// js/api.js — GAS google.script.run 대체 레이어 (Supabase REST)
// 의존: config.js (SUPABASE_URL, SUPABASE_ANON_KEY)
//
// 함수 시그니처는 GAS Code.gs와 동일하게 유지.
// 단, rowIndex(시트 행 번호) 대신 violation UUID를 사용하도록
// getViolationHistory / updateViolationPayment만 변경.

const API = (() => {

  // ─── 내부 fetch 헬퍼 ──────────────────────────────────────
  async function _req(method, path, body = null, extra = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      method,
      headers: {
        apikey:         SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer:         'return=representation',
        ...extra,
      },
      body: body !== null ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const msg = await res.text();
      throw new Error(`[API] ${method} ${path} → ${res.status}: ${msg}`);
    }
    return res.status === 204 ? null : res.json();
  }

  const _get  = p       => _req('GET',   p);
  const _post = (p, b)  => _req('POST',  p, b);
  const _patch = (p, b) => _req('PATCH', p, b, { Prefer: 'return=minimal' });
  const _upsert = (p, b) => _req('POST', p, b, { Prefer: 'resolution=merge-duplicates,return=minimal' });

  // ─── 세션 관련 상수 ───────────────────────────────────────
  // GAS colIdx → schedule JSON 키·배열 인덱스 매핑
  // 시트1 컬럼 4~20 (1-indexed) = schedule 배열 인덱스 0~16
  // 배열 레이아웃: [월오,월야,월심, 화오,화야,화심, 수오,수야,수심, 목오,목야,목심, 금오,금야,금심, 토오,토오후]
  const COL_TO_SCHED = [
    null,                           // idx 0 (미사용)
    null,null,null,                 // idx 1-3: 반·번호·이름
    ['mon',0],['mon',1],['mon',2],  // idx 4-6: 월 오자/야자/심자
    ['tue',0],['tue',1],['tue',2],  // idx 7-9
    ['wed',0],['wed',1],['wed',2],  // idx 10-12
    ['thu',0],['thu',1],['thu',2],  // idx 13-15
    ['fri',0],['fri',1],['fri',2],  // idx 16-18
    ['sat',0],['sat',1],            // idx 19-20: 토 오전/오후
  ];

  const SESSION_TO_SCHED = {
    '오후 자율학습':     ['mon','tue','wed','thu','fri'].map(d=>[d,0]),
    '야간 자율학습':     ['mon','tue','wed','thu','fri'].map(d=>[d,1]),
    '심야 자율학습':     ['mon','tue','wed','thu','fri'].map(d=>[d,2]),
    '오전 자율학습(토)': [['sat',0]],
    '오후 자율학습(토)': [['sat',1]],
  };

  const SESSION_WEIGHTS = {
    '오후 자율학습':     1.5,
    '야간 자율학습':     2.0,
    '심야 자율학습':     1.5,
    '오전 자율학습(토)': 3.0,
    '오후 자율학습(토)': 4.0,
  };

  const WEEKDAY_PRIORITY = ['심야 자율학습', '야간 자율학습', '오후 자율학습'];

  // 날짜 문자열 → 요일명 ('mon'~'sat')
  function _dayKey(dateStr) {
    return ['sun','mon','tue','wed','thu','fri','sat'][new Date(dateStr).getDay()];
  }

  // session + date → schedule [dayKey, idx]
  function _schedKey(sessionName, dateStr) {
    const day = _dayKey(dateStr);
    const map = { '오후':0, '야간':1, '심야':2 };
    if (sessionName === '오전 자율학습(토)') return ['sat', 0];
    if (sessionName === '오후 자율학습(토)') return ['sat', 1];
    const idx = { '오후 자율학습':0, '야간 자율학습':1, '심야 자율학습':2 }[sessionName];
    return [day, idx];
  }

  // ─── 결석 카운트 (GAS _calcAbsentCounts 동일 로직) ────────
  // records: [{record_date, session, status, no_count}]
  function _calcAbsentCounts(records) {
    const byDate = {};
    for (const r of records) {
      (byDate[r.record_date] ??= []).push(r);
    }
    let count = 0;
    for (const [date, recs] of Object.entries(byDate)) {
      const isSat = new Date(date).getDay() === 6;
      if (isSat) {
        for (const r of recs)
          if (r.status === '결석' && !r.no_count) count++;
      } else {
        for (const sess of WEEKDAY_PRIORITY) {
          const rec = recs.find(r => r.session === sess);
          if (rec) {
            if (rec.status === '결석' && !rec.no_count) count++;
            break;
          }
        }
      }
    }
    return count;
  }

  // ─── 공개 API ─────────────────────────────────────────────

  /**
   * 자습반 목록
   * GAS: getGroupList() → string[]
   */
  async function getGroupList() {
    const rows = await _get('students?select=study_room&order=study_room');
    return [...new Set(rows.map(r => r.study_room))];
  }

  /**
   * 출석 학생 조회
   * GAS: getStudentList(groupName, sessionName, date, sessionColIndex, includeAfterSchool)
   *      → { list, totalCount, isAlreadySaved }
   *
   * 각 학생 객체: { id, ban, num, name, isTarget, status, reason, noCount, absentCount }
   * ※ id(UUID)가 추가됨 — app.js의 saveAttendance 페이로드에 student_id로 사용
   */
  async function getStudentList(groupName, sessionName, date, _colIdx, includeAfterSchool = true) {
    const [dayKey, sessIdx] = _schedKey(sessionName, date);

    const [students, attendance] = await Promise.all([
      _get(`students?study_room=eq.${encodeURIComponent(groupName)}&order=class_num,student_num`),
      _get(`attendance?record_date=eq.${date}&session=eq.${encodeURIComponent(sessionName)}&select=student_id,status,reason,no_count,checker`),
    ]);

    const attMap = Object.fromEntries(attendance.map(a => [a.student_id, a]));
    const isAlreadySaved = attendance.length > 0;

    // 결석 횟수: 이 자습반 학생 전체 출석기록 조회
    const studentIds = students.map(s => s.id);
    let absentCountMap = {};
    if (studentIds.length > 0) {
      const allAtt = await _get(
        `attendance?student_id=in.(${studentIds.join(',')})&select=student_id,record_date,session,status,no_count`
      );
      for (const s of students) {
        const recs = allAtt.filter(a => a.student_id === s.id);
        absentCountMap[s.id] = _calcAbsentCounts(recs);
      }
    }

    const list = students
      .filter(s => {
        const val = s.schedule?.[dayKey]?.[sessIdx];
        if (val === 'O') return true;
        if (val === '방과후') return includeAfterSchool;
        return false;
      })
      .map(s => {
        const val = s.schedule?.[dayKey]?.[sessIdx];
        const att = attMap[s.id];
        return {
          id:          s.id,
          ban:         String(s.class_num),
          num:         String(s.student_num),
          name:        s.name,
          isTarget:    val === 'O' || val === '방과후',
          status:      att?.status ?? null,
          reason:      att?.reason ?? '',
          noCount:     att?.no_count ?? false,
          absentCount: absentCountMap[s.id] ?? 0,
        };
      });

    return { list, totalCount: list.length, isAlreadySaved };
  }

  /**
   * 전체 명단 + 결석·위반 횟수
   * GAS: getAllMemberList() → [{ban, num, name, group, violCount, absentCount}]
   */
  async function getAllMemberList() {
    const [students, attendance, violations] = await Promise.all([
      _get('students?order=study_room,class_num,student_num'),
      _get('attendance?select=student_id,record_date,session,status,no_count'),
      _get('violations?select=student_id'),
    ]);

    const attByStudent  = {};
    for (const a of attendance)
      (attByStudent[a.student_id] ??= []).push(a);

    const violCount = {};
    for (const v of violations)
      violCount[v.student_id] = (violCount[v.student_id] ?? 0) + 1;

    return students.map(s => ({
      id:          s.id,
      ban:         String(s.class_num),
      num:         String(s.student_num),
      name:        s.name,
      group:       s.study_room,
      violCount:   violCount[s.id]                          ?? 0,
      absentCount: _calcAbsentCounts(attByStudent[s.id] ?? []),
    }));
  }

  /**
   * 출석 저장
   * GAS: saveAttendance({ group, sessionName, students, date, checkerName })
   *      students: [{ student_id(UUID), ban, num, name, type, reason, noCount }]
   *
   * ※ 기존 GAS는 시트 행 삭제 후 재삽입. Supabase는 UNIQUE 제약 upsert.
   */
  async function saveAttendance(payload) {
    const { group, sessionName, students, date, checkerName } = payload;

    const rows = students.map(s => ({
      student_id:  s.student_id,   // UUID (getStudentList 반환값의 id)
      record_date: date,
      session:     sessionName,
      status:      s.type,
      reason:      s.reason || '',
      no_count:    s.noCount || false,
      checker:     checkerName || '',
    }));

    await _upsert('attendance', rows);
    return '출결 현황이 정상적으로 저장되었습니다.';
  }

  /**
   * 학생별 결석 이력
   * GAS: getAbsentHistory(ban, num, name, group) → [{date, session, reason, noCount}]
   */
  async function getAbsentHistory(ban, num, name, group) {
    // class_num + student_num으로 UUID 조회
    const students = await _get(
      `students?class_num=eq.${ban}&student_num=eq.${num}&name=eq.${encodeURIComponent(name)}&study_room=eq.${encodeURIComponent(group)}&select=id`
    );
    if (!students.length) return [];

    const sid = students[0].id;
    const rows = await _get(
      `attendance?student_id=eq.${sid}&status=eq.결석&order=record_date.desc,session.desc&select=record_date,session,reason,no_count`
    );
    return rows.map(r => ({
      date:    r.record_date,
      session: r.session,
      reason:  r.reason || '',
      noCount: r.no_count,
    }));
  }

  /**
   * 규정 위반 이력
   * GAS: getViolationHistory(ban, num, name, group)
   *      → [{ rowIndex, date, violType, action, detail, paid }]
   * ※ rowIndex → id(UUID)로 변경. app.js에서 updateViolationPayment(id, paid) 호출.
   */
  async function getViolationHistory(ban, num, name, group) {
    const students = await _get(
      `students?class_num=eq.${ban}&student_num=eq.${num}&name=eq.${encodeURIComponent(name)}&study_room=eq.${encodeURIComponent(group)}&select=id`
    );
    if (!students.length) return [];

    const sid = students[0].id;
    const rows = await _get(
      `violations?student_id=eq.${sid}&order=viol_date.desc`
    );
    return rows.map(r => ({
      rowIndex: r.id,   // UUID (GAS rowIndex 대체)
      date:     r.viol_date,
      violType: r.viol_type,
      action:   r.action,
      detail:   r.detail || '',
      paid:     r.paid,
    }));
  }

  /**
   * 규정 위반 등록
   * GAS: saveViolation({ date, group, ban, num, name, violType, action, detail })
   */
  async function saveViolation(payload) {
    const { date, group, ban, num, name, violType, action, detail } = payload;

    const students = await _get(
      `students?class_num=eq.${ban}&student_num=eq.${num}&name=eq.${encodeURIComponent(name)}&study_room=eq.${encodeURIComponent(group)}&select=id`
    );
    if (!students.length) throw new Error(`학생을 찾을 수 없습니다: ${ban}반 ${num}번 ${name}`);

    await _post('violations', {
      student_id: students[0].id,
      viol_date:  date,
      viol_type:  violType,
      action,
      detail:     detail || '',
      paid:       false,
    });
    return '규정 위반이 정상적으로 등록되었습니다.';
  }

  /**
   * 납부 여부 업데이트
   * GAS: updateViolationPayment(rowIndex, paid)  ← rowIndex = 시트 행 번호
   * Supabase: updateViolationPayment(violationId, paid)  ← UUID
   */
  async function updateViolationPayment(violationId, paid) {
    await _patch(`violations?id=eq.${violationId}`, { paid });
    return '납부 상태가 저장되었습니다.';
  }

  /**
   * 공휴일 목록
   * GAS: getHolidays() → [{date, am, pm}]
   * app.js의 holiday.am / holiday.pm 필드명과 일치
   */
  async function getHolidays() {
    const rows = await _get('holidays?order=hol_date');
    return rows.map(r => ({ date: r.hol_date, am: r.has_am, pm: r.has_pm }));
  }

  /**
   * 공휴일 저장
   * GAS: saveHolidays([{date, am, pm}])
   */
  async function saveHolidays(holidays) {
    const rows = holidays.map(h => ({
      hol_date: h.date,
      has_am:   h.am ?? true,
      has_pm:   h.pm ?? true,
    }));
    await _upsert('holidays', rows);
    return '저장되었습니다.';
  }

  /**
   * 통계 (자습 시간 집계)
   * GAS: calculateStats() → [{ban, num, name, group, total, attendCount, absentCount}]
   */
  async function calculateStats() {
    const [students, attendance] = await Promise.all([
      _get('students?order=study_room,class_num,student_num'),
      _get('attendance?select=student_id,session,status,record_date,no_count'),
    ]);

    const attByStudent = {};
    for (const a of attendance)
      (attByStudent[a.student_id] ??= []).push(a);

    return students.map(s => {
      const recs      = attByStudent[s.id] ?? [];
      let total       = 0;
      let attendCount = 0;
      for (const r of recs) {
        if (r.status === '출석') {
          total       += SESSION_WEIGHTS[r.session] ?? 0;
          attendCount += 1;
        }
      }
      return {
        ban:         String(s.class_num),
        num:         String(s.student_num),
        name:        s.name,
        group:       s.study_room,
        total,
        attendCount,
        absentCount: _calcAbsentCounts(recs),
      };
    });
  }

  /**
   * 자습반 시간표 조회
   * GAS: getGroupSchedule(groupName)
   *      → [{ban, num, name, group, schedule: [17값 배열]}]
   * schedule 배열 순서: 월오/야/심, 화오/야/심, 수오/야/심, 목오/야/심, 금오/야/심, 토오전/오후
   */
  async function getGroupSchedule(groupName) {
    const students = await _get(
      `students?study_room=eq.${encodeURIComponent(groupName)}&order=class_num,student_num`
    );
    const DAYS  = ['mon','tue','wed','thu','fri'];
    return students.map(s => {
      const sched = s.schedule ?? {};
      const flat  = [];
      for (const d of DAYS)
        for (const v of (sched[d] ?? ['-','-','-'])) flat.push(v);
      for (const v of (sched['sat'] ?? ['-','-']))    flat.push(v);
      return {
        ban:      String(s.class_num),
        num:      String(s.student_num),
        name:     s.name,
        group:    s.study_room,
        schedule: flat,
      };
    });
  }

  /**
   * 결석자 현황 텍스트 (클라이언트 사이드 생성)
   * GAS getGroupAbsentees는 서버에서 텍스트를 만들었지만
   * Supabase 버전은 getStudentList 결과를 받아 클라이언트에서 조합.
   */
  function buildAbsentReport(groupName, sessionName, date, studentList) {
    const checkers = [...new Set(studentList.filter(s=>s.checker).map(s=>s.checker))];
    let report = `[${groupName} 자율학습 현황]\n`;
    report += `▪ 일시: ${date} (${sessionName.replace(' 자율학습','')})\n`;
    if (checkers.length) report += `▪ 확인자: ${checkers.join(', ')}\n`;
    report += '----------------------------------\n';
    const absentees = studentList
      .filter(s => s.status && s.status !== '출석')
      .map(s => `- ${s.ban}반 ${s.num}번 ${s.name} [${s.status}]${s.reason ? ` (${s.reason})` : ''}`);
    report += absentees.length ? absentees.join('\n') + '\n' : '전원 출석하였습니다.\n';
    report += '----------------------------------';
    return report;
  }

  return {
    getGroupList,
    getStudentList,
    getAllMemberList,
    saveAttendance,
    getAbsentHistory,
    getViolationHistory,
    saveViolation,
    updateViolationPayment,
    getHolidays,
    saveHolidays,
    calculateStats,
    getGroupSchedule,
    buildAbsentReport,
  };
})();
