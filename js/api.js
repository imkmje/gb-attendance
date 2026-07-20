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
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  const _get  = p       => _req('GET',   p);
  const _post = (p, b)  => _req('POST',  p, b);
  const _patch = (p, b) => _req('PATCH', p, b, { Prefer: 'return=minimal' });
  const _del  = p       => _req('DELETE', p, null, { Prefer: 'return=minimal' });

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
    '오후 자율학습':      ['mon','tue','wed','thu','fri'].map(d=>[d,0]),
    '야간 자율학습':      ['mon','tue','wed','thu','fri'].map(d=>[d,1]),
    '심야 자율학습':      ['mon','tue','wed','thu','fri'].map(d=>[d,2]),
    '오전 자율학습(토)':  [['sat',0]],
    '오후1 자율학습(토)': [['sat',1]],
    '오후2 자율학습(토)': [['sat',1]],
  };

  const SESSION_WEIGHTS = {
    '오후 자율학습':      1.5,
    '야간 자율학습':      2.0,
    '심야 자율학습':      1.5,
    '오전 자율학습(토)':  3.0,
    '오후1 자율학습(토)': 2.0,
    '오후2 자율학습(토)': 2.0,
  };

  const WEEKDAY_PRIORITY = ['심야 자율학습', '야간 자율학습', '오후 자율학습'];

  // 날짜 문자열 → 요일명 ('mon'~'sat') — 로컬 파싱으로 타임존 오류 방지
  function _dayKey(dateStr) {
    const p = dateStr.split('-');
    return ['sun','mon','tue','wed','thu','fri','sat'][new Date(+p[0], +p[1]-1, +p[2]).getDay()];
  }

  // session + date → schedule [dayKey, idx]
  function _schedKey(sessionName, dateStr) {
    const day = _dayKey(dateStr);
    const map = { '오후':0, '야간':1, '심야':2 };
    if (sessionName === '오전 자율학습(토)') return ['sat', 0];
    if (sessionName === '오후1 자율학습(토)' || sessionName === '오후2 자율학습(토)') return ['sat', 1];
    const idx = { '오후 자율학습':0, '야간 자율학습':1, '심야 자율학습':2 }[sessionName];
    return [day, idx];
  }

  // ─── 결석 카운트 (GAS _calcAbsentCounts 동일 로직) ────────
  // records: [{record_date, session, status, no_count}]
  function _calcAbsentCounts(records) {
    if (!records?.length) return 0;
    const byDate = {};
    for (const r of records) {
      const dateKey = String(r.record_date).slice(0, 10); // 'YYYY-MM-DD' 보장
      (byDate[dateKey] ??= []).push(r);
    }
    let count = 0;
    for (const [date, recs] of Object.entries(byDate)) {
      // 타임존 오류 방지: 날짜 문자열에서 직접 파싱
      const parts = date.split('-');
      const dayOfWeek = new Date(+parts[0], +parts[1] - 1, +parts[2]).getDay();
      const isSat = dayOfWeek === 6;
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
    const parts = date.split('-');
    const dayOfWeek = new Date(+parts[0], +parts[1]-1, +parts[2]).getDay(); // 0=일, 6=토

    const [students, attendance] = await Promise.all([
      _get(`students?study_room=eq.${encodeURIComponent(groupName)}&order=class_num,student_num`),
      _get(`attendance?record_date=eq.${date}&session=eq.${encodeURIComponent(sessionName)}&select=student_id,status,reason,no_count,checker,early_leave_mins,late_mins`),
    ]);

    const attMap = Object.fromEntries(attendance.map(a => [a.student_id, a]));
    const isAlreadySaved = attendance.length > 0;

    // 결석 횟수 + 조기퇴실 반복규칙
    const studentIds = students.map(s => s.id);
    let absentCountMap = {};
    let recurringMap = {};
    if (studentIds.length > 0) {
      const idList = studentIds.join(',');
      const [allAtt, recurringRules] = await Promise.all([
        _get(`attendance?student_id=in.(${idList})&select=student_id,record_date,session,status,no_count`),
        _get(`recurring_early_leave?day_of_week=eq.${dayOfWeek}&session=eq.${encodeURIComponent(sessionName)}&student_id=in.(${idList})&select=student_id,early_leave_mins`)
          .catch(() => []),
      ]);
      for (const s of students) {
        const recs = allAtt.filter(a => a.student_id === s.id);
        absentCountMap[s.id] = _calcAbsentCounts(recs);
      }
      recurringMap = Object.fromEntries(recurringRules.map(r => [r.student_id, r.early_leave_mins]));
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
        const savedEarly   = att?.early_leave_mins ?? null;
        const recurringEarly = recurringMap[s.id] ?? null;
        return {
          id:            s.id,
          ban:           String(s.class_num),
          num:           String(s.student_num),
          name:          s.name,
          isTarget:      val === 'O' || val === '방과후',
          status:        att?.status ?? '출석',
          reason:        att?.reason ?? '',
          noCount:       att?.no_count ?? false,
          absentCount:   absentCountMap[s.id] ?? 0,
          earlyLeaveMins: savedEarly ?? recurringEarly ?? 0,
          isRecurring:    recurringEarly != null,
          lateMins:       att?.late_mins ?? 0,
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

    const studentIds = students.map(s => s.student_id).filter(Boolean);
    if (studentIds.length > 0) {
      await _del(
        `attendance?record_date=eq.${date}&session=eq.${encodeURIComponent(sessionName)}&student_id=in.(${studentIds.join(',')})`
      );
    }

    const rows = students.map(s => ({
      student_id:       s.student_id,
      record_date:      date,
      session:          sessionName,
      status:           s.type,
      reason:           s.reason || '',
      no_count:         s.noCount || false,
      checker:          checkerName || '',
      early_leave_mins: s.earlyLeaveMins || 0,
      late_mins:        s.lateMins || 0,
    }));

    await _post('attendance', rows);
    return '출결 현황이 정상적으로 저장되었습니다.';
  }

  async function resetAttendanceByDate(date) {
    await _del(`attendance?record_date=eq.${date}`);
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
    const newDates = new Set(holidays.map(h => h.date));
    // 삭제된 공휴일 제거
    const existing = await _get('holidays?select=hol_date');
    await Promise.all(
      existing.filter(e => !newDates.has(e.hol_date)).map(e => _del(`holidays?hol_date=eq.${e.hol_date}`))
    );
    // 신규·변경 공휴일 upsert (hol_date PK 기준 merge)
    if (holidays.length) {
      await _req('POST', 'holidays', holidays.map(h => ({
        hol_date: h.date,
        has_am:   h.am ?? true,
        has_pm:   h.pm ?? true,
      })), { Prefer: 'resolution=merge-duplicates,return=minimal' });
    }
    return '저장되었습니다.';
  }

  /**
   * 통계 (자습 시간 집계)
   * GAS: calculateStats() → [{ban, num, name, group, total, attendCount, absentCount}]
   */
  async function calculateStats() {
    const [students, attendance] = await Promise.all([
      _get('students?order=study_room,class_num,student_num'),
      _get('attendance?select=student_id,session,status,record_date,no_count,early_leave_mins,late_mins'),
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
          const weight    = SESSION_WEIGHTS[r.session] ?? 0;
          const deduction = ((r.early_leave_mins ?? 0) + (r.late_mins ?? 0)) / 60;
          total       += Math.max(0, weight - deduction);
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
    const query = groupName === '전체'
      ? 'students?order=study_room,class_num,student_num'
      : `students?study_room=eq.${encodeURIComponent(groupName)}&order=class_num,student_num`;
    const students = await _get(query);
    const DAYS  = ['mon','tue','wed','thu','fri'];
    return students.map(s => {
      const sched = s.schedule ?? {};
      const flat  = [];
      for (const d of DAYS)
        for (const v of (sched[d] ?? ['-','-','-'])) flat.push(v);
      for (const v of (sched['sat'] ?? ['-','-']))    flat.push(v);
      return {
        id:       s.id,
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

  // ─── 교사 메뉴용 추가 API ─────────────────────────────

  async function getStudentAttendanceFull(studentId) {
    const rows = await _get(`attendance?student_id=eq.${studentId}&order=record_date.desc,session.desc`);
    return rows.map(r => ({
      id:            r.id,
      date:          r.record_date,
      session:       r.session,
      status:        r.status,
      reason:        r.reason || '',
      noCount:       r.no_count,
      checker:       r.checker || '',
      earlyLeaveMins: r.early_leave_mins ?? 0,
      lateMins:       r.late_mins ?? 0,
    }));
  }

  async function upsertRecurringEarlyLeave(studentId, dayOfWeek, session, earlyLeaveMins) {
    await _req('POST', 'recurring_early_leave',
      { student_id: studentId, day_of_week: dayOfWeek, session, early_leave_mins: earlyLeaveMins },
      { Prefer: 'resolution=merge-duplicates,return=minimal' }
    );
  }

  async function deleteRecurringEarlyLeave(studentId, dayOfWeek, session) {
    await _del(`recurring_early_leave?student_id=eq.${studentId}&day_of_week=eq.${dayOfWeek}&session=eq.${encodeURIComponent(session)}`);
  }

  async function updateAttendanceRecord(recordId, updates) {
    const patch = {};
    if (updates.status  !== undefined) patch.status   = updates.status;
    if (updates.reason  !== undefined) patch.reason   = updates.reason;
    if (updates.noCount !== undefined) patch.no_count = updates.noCount;
    // return=representation 으로 실제 반영 여부 확인 (return=minimal은 0행 매칭도 204 반환)
    const rows = await _req('PATCH', `attendance?id=eq.${recordId}`, patch, { Prefer: 'return=representation' });
    if (!rows || rows.length === 0) throw new Error('업데이트 실패: 기록을 찾을 수 없습니다');
  }

  async function deleteAttendanceRecord(recordId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/attendance?id=eq.${recordId}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) throw new Error(`DELETE attendance: ${res.status}`);
  }

  async function addStudent(data) {
    await _post('students', {
      class_num:   data.classNum,
      student_num: data.studentNum,
      name:        data.name,
      study_room:  data.studyRoom,
      schedule:    {},
    });
  }

  async function deleteStudent(studentId) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
      method: 'DELETE',
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    });
    if (!res.ok) throw new Error(`DELETE student: ${res.status}`);
  }

  async function updateStudentRoom(studentId, newRoom) {
    await _patch(`students?id=eq.${studentId}`, { study_room: newRoom });
  }

  async function getStudentSchedule(studentId) {
    const rows = await _get(`students?id=eq.${studentId}&select=schedule`);
    return rows[0]?.schedule || {};
  }

  async function updateStudentSchedule(studentId, schedule) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${studentId}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ schedule }),
    });
    if (!res.ok) { const msg = await res.text(); throw new Error(`저장 실패: ${msg}`); }
    if (res.status !== 204) {
      const rows = await res.json();
      if (rows.length === 0) throw new Error('세션 저장 실패: Supabase students 테이블에 UPDATE 정책이 없습니다.\nSupabase 대시보드 → Table Editor → students → RLS 에서 anon UPDATE 정책을 추가하세요.');
    }
  }

  async function deleteViolation(violationId) {
    await _del(`violations?id=eq.${violationId}`);
  }

  async function importStudents(rows, replaceAll) {
    if (replaceAll) {
      await _del('students?id=not.is.null');
    }
    const payload = rows.map(r => ({
      class_num:   r.ban,
      student_num: r.num,
      name:        r.name,
      study_room:  r.group,
      schedule:    r.schedule,
    }));
    const BATCH = 100;
    for (let i = 0; i < payload.length; i += BATCH) {
      await _req('POST', 'students', payload.slice(i, i + BATCH), { Prefer: 'resolution=merge-duplicates,return=minimal' });
    }
  }

  async function updateViolationRecord(violationId, updates) {
    await _patch(`violations?id=eq.${violationId}`, updates);
  }

  async function exportScheduleData() {
    const students = await _get('students?order=study_room,class_num,student_num');
    const DAYS = ['mon','tue','wed','thu','fri'];
    const DAY_KR = {mon:'월',tue:'화',wed:'수',thu:'목',fri:'금'};
    return students.map(s => {
      const sched = s.schedule ?? {};
      const row = { 반: String(s.class_num||''), 번호: String(s.student_num||''), 이름: s.name||'', 자습반: s.study_room||'' };
      for (const d of DAYS) {
        const a = sched[d] ?? ['-','-','-'];
        row[`${DAY_KR[d]}오후`] = a[0] ?? '-';
        row[`${DAY_KR[d]}야간`] = a[1] ?? '-';
        row[`${DAY_KR[d]}심야`] = a[2] ?? '-';
      }
      const sat = sched.sat ?? ['-','-'];
      row['토오전'] = sat[0] ?? '-';
      row['토오후'] = sat[1] ?? '-';
      return row;
    });
  }

  async function exportViolationsData() {
    const [violations, students] = await Promise.all([
      _get('violations?order=viol_date.asc'),
      _get('students?select=id,class_num,student_num,name,study_room'),
    ]);
    const sMap = Object.fromEntries(students.map(s => [s.id, s]));
    return violations.map(v => {
      const s = sMap[v.student_id] || {};
      return {
        반:       String(s.class_num    || ''),
        번호:     String(s.student_num  || ''),
        이름:     s.name         || '',
        자습반:   s.study_room   || '',
        날짜:     v.viol_date,
        위반유형: v.viol_type,
        조치:     v.action,
        상세:     v.detail       || '',
        납부여부: v.paid ? 'Y' : 'N',
      };
    });
  }

  async function getAllViolationsWithStudents() {
    const [violations, students] = await Promise.all([
      _get('violations?order=viol_date.desc'),
      _get('students?select=id,class_num,student_num,name,study_room'),
    ]);
    const sMap = Object.fromEntries(students.map(s => [s.id, s]));
    return violations.map(v => {
      const s = sMap[v.student_id] || {};
      return {
        id:       v.id,
        date:     v.viol_date,
        violType: v.viol_type,
        action:   v.action,
        detail:   v.detail || '',
        paid:     v.paid,
        student: {
          ban:   String(s.class_num  || ''),
          num:   String(s.student_num || ''),
          name:  s.name       || '알 수 없음',
          group: s.study_room || '',
        },
      };
    });
  }

  async function exportAttendanceData() {
    const [students, attendance] = await Promise.all([
      _get('students?order=study_room,class_num,student_num'),
      _get('attendance?order=record_date.asc,session.asc&select=student_id,record_date,session,status,reason,no_count,checker'),
    ]);
    const sMap = Object.fromEntries(students.map(s => [s.id, s]));
    return attendance.map(a => {
      const s = sMap[a.student_id] || {};
      return {
        반:       s.class_num    || '',
        번호:     s.student_num  || '',
        이름:     s.name         || '',
        자습반:   s.study_room   || '',
        날짜:     a.record_date,
        세션:     a.session,
        상태:     a.status,
        사유:     a.reason       || '',
        노카운트: a.no_count ? 'Y' : 'N',
        확인자:   a.checker      || '',
      };
    });
  }

  async function getReasonTypes() {
    try {
      const rows = await _get('settings?key=eq.reason_types&select=value');
      if (rows.length && Array.isArray(rows[0].value)) return rows[0].value;
    } catch (_) {}
    return ['학원 보강', '병결', '개인 사정'];
  }

  async function saveReasonTypes(types) {
    await _req('POST', 'settings', { key: 'reason_types', value: types },
      { Prefer: 'resolution=merge-duplicates,return=minimal' });
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
    getStudentAttendanceFull,
    upsertRecurringEarlyLeave,
    deleteRecurringEarlyLeave,
    updateAttendanceRecord,
    deleteAttendanceRecord,
    addStudent,
    deleteStudent,
    updateStudentRoom,
    exportAttendanceData,
    getStudentSchedule,
    updateStudentSchedule,
    updateViolationRecord,
    deleteViolation,
    importStudents,
    resetAttendanceByDate,
    getAllViolationsWithStudents,
    exportViolationsData,
    exportScheduleData,
    getReasonTypes,
    saveReasonTypes,
  };
})();
