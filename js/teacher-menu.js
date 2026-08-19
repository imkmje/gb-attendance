// ════════════════════════════════════════
//  teacher-menu.js — 교사 메뉴 · 개발자 메뉴
//  (app.js에서 분리됨)
// ════════════════════════════════════════

/* ════════════════════════════════
   교사 메뉴
════════════════════════════════ */

// 교사 메뉴 비밀번호(TEACHER_PW) 인증 게이트 — 교사 메뉴 진입, 명단 탭 세션 수정 등
// 교사만 허용해야 하는 동작 앞에서 공통으로 사용
function _requireTeacherAuth(onSuccess, opts = {}) {
  if (localStorage.getItem('teacherPwEnabled') === 'false') {
    onSuccess();
    return;
  }
  Swal.fire({
    title: opts.title || '교사 인증',
    text: opts.text,
    input: 'password',
    inputPlaceholder: '비밀번호를 입력하세요',
    inputAttributes: { autocomplete: 'off' },
    showCancelButton: true,
    confirmButtonText: '확인',
    cancelButtonText: '취소',
  }).then(result => {
    if (result.isConfirmed && result.value === TEACHER_PW) {
      onSuccess();
    } else if (result.isConfirmed) {
      Swal.fire({ title: '비밀번호가 틀렸습니다', icon: 'error', confirmButtonText: '확인' });
    }
  });
}

function handleTeacherMenuClick() {
  _requireTeacherAuth(_openTeacherMenu, { title: '교사 메뉴' });
}

// ── 활동 로그 / 공지사항 ──────────────────────────────
function _activityLogEnabled() {
  return _activityLogOn;
}

function _applyActivityBellVisibility() {
  const on = _activityLogEnabled();
  document.querySelectorAll('#activityBellBtn, .js-bell-btn').forEach(btn => {
    btn.style.display = on ? 'flex' : 'none';
  });
}

function _timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function checkActivityBadge() {
  const dots = document.querySelectorAll('.bell-dot');
  if (!dots.length || !_activityLogEnabled()) return;
  API.getActivityLog(1).then(rows => {
    const latest = rows && rows[0];
    if (!latest) { dots.forEach(d => d.classList.remove('show')); return; }
    const lastSeen = localStorage.getItem('lastSeenActivityAt');
    const show = !lastSeen || new Date(latest.created_at) > new Date(lastSeen);
    dots.forEach(d => d.classList.toggle('show', show));
  }).catch(() => {});
}

function openActivityLogSheet() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3000';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'padding-bottom:48px;max-height:90dvh;display:flex;flex-direction:column;';

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      <div style="width:42px;height:42px;border-radius:var(--radius-sm);background:var(--blue-dim);display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-sm);flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">활동 로그</div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">세션 변경 내역 · 공지사항</div>
      </div>
      <button id="_alPost" aria-label="공지 작성" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--blue-dim);color:var(--blue);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);flex-shrink:0;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      </button>
      <button id="_alClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);flex-shrink:0;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div id="_alBody" style="overflow-y:auto;flex:1;margin:0 -16px;padding:0 16px;">
      <div class="text-center py-5" style="color:var(--ink-3);font-weight:600;">불러오는 중...</div>
    </div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_alClose').addEventListener('click', close);
  sheet.querySelector('#_alPost').addEventListener('click', () => {
    _requireTeacherAuth(() => _postNotice(() => _loadActivityLogBody(sheet.querySelector('#_alBody'))), { title: '교사 인증', text: '공지사항을 작성하려면 교사 메뉴 비밀번호를 입력하세요.' });
  });

  _loadActivityLogBody(sheet.querySelector('#_alBody'));

  // 읽음 처리
  localStorage.setItem('lastSeenActivityAt', new Date().toISOString());
  document.querySelectorAll('.bell-dot').forEach(d => d.classList.remove('show'));
}

function _loadActivityLogBody(body) {
  API.getActivityLog(50).then(rows => {
    if (!rows || !rows.length) { body.innerHTML = _emptyState('활동 내역이 없습니다.'); return; }
    body.innerHTML = rows.map(r => {
      const isNotice = r.type === 'notice';
      const dotColor = isNotice ? 'background:var(--amber);' : 'background:var(--blue);';
      const actorTxt = r.actor ? `${_esc(r.actor)} · ` : '';
      return `<div class="vh-item"><div class="vh-item-head"><div class="vh-type-dot" style="${dotColor}"></div><div class="vh-item-main"><div class="vh-item-type">${_esc(r.message)}</div><div class="vh-item-date">${actorTxt}${_timeAgo(r.created_at)}</div></div></div></div>`;
    }).join('');
  }).catch(() => { body.innerHTML = '<div class="vh-empty">불러오지 못했습니다.</div>'; });
}

function _postNotice(onDone) {
  Swal.fire({
    title: '공지사항 작성',
    input: 'textarea',
    inputPlaceholder: '모든 교사가 볼 수 있는 공지 내용을 입력하세요',
    showCancelButton: true,
    confirmButtonText: '등록',
    cancelButtonText: '취소',
  }).then(result => {
    const text = result.value && result.value.trim();
    if (!result.isConfirmed || !text) return;
    const actor = (document.getElementById('checkerName')?.value || localStorage.getItem('checkerName') || '').trim();
    API.logActivity({ actor, type: 'notice', message: text })
      .then(() => { showSuccessToast('공지 등록됨'); if (typeof onDone === 'function') onDone(); })
      .catch(err => Swal.fire('오류', err?.message || '등록하지 못했습니다.', 'error'));
  });
}

function _openTeacherMenu() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3000';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'padding-bottom:48px;max-height:90dvh;overflow-y:auto;';

  const sections = [
    {
      label: '출결 관리',
      items: [
        { bg:'var(--blue-dim)',   fg:'var(--blue)',  svg:'<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
          title:'결석 카운트 수정', sub:'출석 기록 수정 및 결석 카운트를 조정합니다', fn:_teacherEditAttendance },
        { bg:'var(--green-dim)',  fg:'var(--green)', svg:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
          title:'자습 세션 변경',  sub:'학생별 자습 참가 세션(O/방과후/-)을 편집합니다', fn:_teacherEditSchedule },
        { bg:'var(--amber-dim)', fg:'var(--amber)', svg:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
          title:'전체 벌금 현황',  sub:'전체 벌금 목록 조회 및 납부 상태를 수정합니다', fn:_teacherViewFines },
        { bg:'var(--purple-dim)', fg:'var(--purple)', svg:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01"/>',
          title:'평일 공휴일 설정', sub:'평일 공휴일 중 자습하는 날을 등록/삭제합니다', fn:_teacherEditHolidays },
      ],
    },
    {
      label: '학생 관리',
      items: [
        { bg:'var(--green-dim)', fg:'var(--green)', svg:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
          title:'학생 추가',      sub:'새 학생을 자습반에 등록합니다', fn:_teacherAddStudent },
        { bg:'var(--red-dim)',   fg:'var(--red)',   svg:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/>',
          title:'학생 삭제 / 자습반 변경', sub:'학생을 삭제하거나 소속 자습반을 변경합니다', fn:_teacherManageStudent },
      ],
    },
    {
      label: '데이터',
      items: [
        { bg:'var(--green-dim)', fg:'var(--green)', svg:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
          title:'학생 일괄 등록', sub:'Excel 양식으로 학생 목록을 한번에 등록합니다', fn:_teacherImportStudents },
        { bg:'var(--bg-deep)',   fg:'var(--ink-3)', svg:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
          title:'데이터 내보내기', sub:'원하는 데이터를 선택해 Excel 파일로 내보냅니다', fn:_teacherExportData },
      ],
    },
  ];

  const allItems = sections.flatMap(s => s.items);
  let idx = 0;

  const sectionHtml = sections.map(sec => {
    const itemsHtml = sec.items.map(item => {
      const i = idx++;
      return `<button id="_tmBtn${i}" style="all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-sm);padding:13px 14px;cursor:pointer;width:100%;-webkit-tap-highlight-color:transparent;">
        <div style="width:38px;height:38px;border-radius:var(--radius-sm);background:${item.bg};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${item.fg}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${item.svg}</svg>
        </div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:13px;font-weight:700;color:var(--ink);letter-spacing:-0.2px;">${item.title}</div>
          <div style="font-size:11px;color:var(--ink-3);margin-top:2px;line-height:1.4;">${item.sub}</div>
        </div>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>`;
    }).join('');
    return `<div style="margin-bottom:18px;">
      <div style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--ink-4);margin-bottom:8px;padding:0 2px;">${sec.label}</div>
      <div style="display:flex;flex-direction:column;gap:6px;">${itemsHtml}</div>
    </div>`;
  }).join('');

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;">
      <div style="width:42px;height:42px;border-radius:var(--radius-sm);background:var(--blue-dim);display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-sm);flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">교사 메뉴</div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">관리자 전용 기능</div>
      </div>
      <button id="_tmClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    ${sectionHtml}`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_tmClose').addEventListener('click', close);
  allItems.forEach((item, i) => {
    const btn = sheet.querySelector(`#_tmBtn${i}`);
    if (btn) btn.addEventListener('click', () => { close(); setTimeout(() => item.fn(), 370); });
  });
}

// ── 공통: 학생 선택 시트 (콜백 버전) — 반 드롭다운 → 학생 목록 ──
function _openStudentPickerSheetEx(students, callback) {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3100';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'max-height:82vh;display:flex;flex-direction:column;';

  const groups = [...new Set(students.map(s => s.group))];
  const groupOpts = [
    '<option value="" disabled selected>자습반을 선택하세요</option>',
    ...groups.map(g => `<option value="${g}">${g}</option>`),
  ].join('');

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="font-size:15px;font-weight:800;color:var(--ink);margin-bottom:12px;letter-spacing:-0.4px;">학생 선택</div>
    <div style="position:relative;margin-bottom:12px;">
      <select id="_spxGroup" style="width:100%;padding:11px 40px 11px 14px;border-radius:var(--radius);border:1.5px solid var(--bg-deep);background:var(--surface);font-family:var(--font);font-size:14px;font-weight:600;color:var(--ink);appearance:none;-webkit-appearance:none;outline:none;">
        ${groupOpts}
      </select>
      <svg style="position:absolute;right:12px;top:50%;transform:translateY(-50%);pointer-events:none;" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
    <div id="_spxList" style="overflow-y:auto;flex:1;margin:0 -16px;padding:0 16px;">
      <div style="text-align:center;padding:36px;color:var(--ink-4);font-size:13px;font-weight:600;">자습반을 선택하면<br>학생 목록이 나타납니다</div>
    </div>`;

  const listEl = sheet.querySelector('#_spxList');

  const renderStudents = (group) => {
    const studs = students.filter(s => s.group === group);
    if (!studs.length) { listEl.innerHTML = '<div style="text-align:center;padding:32px;color:var(--ink-3);font-size:13px;">해당 반 학생이 없습니다</div>'; return; }
    listEl.innerHTML = studs.map(s => `
      <div class="_spx-item" data-id="${s.id}" data-ban="${s.ban}" data-num="${s.num}" data-name="${encodeURIComponent(s.name)}" data-group="${encodeURIComponent(s.group)}"
        style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid var(--bg-deep);cursor:pointer;gap:12px;">
        <div style="width:32px;height:32px;border-radius:var(--radius-sm);background:var(--blue-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:800;color:var(--blue);">${s.ban}</div>
        <div>
          <div style="font-size:14px;font-weight:700;color:var(--ink);">${_esc(s.name)}</div>
          <div style="font-size:11px;color:var(--ink-3);">${s.ban}반 ${s.num}번</div>
        </div>
      </div>`).join('');
    listEl.querySelectorAll('._spx-item').forEach(el => {
      el.addEventListener('click', () => {
        close();
        setTimeout(() => callback({
          id:    el.dataset.id,
          ban:   el.dataset.ban,
          num:   el.dataset.num,
          name:  decodeURIComponent(el.dataset.name),
          group: decodeURIComponent(el.dataset.group),
        }), 370);
      });
    });
  };

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_spxGroup').addEventListener('change', function() { renderStudents(this.value); });
}

// ── 1. 출석 수정 / 결석 카운트 조작 ───────────────────
function _teacherEditAttendance() {
  showLoading('학생 목록 불러오는 중...');
  API.getAllMemberList()
    .then(students => {
      hideLoading();
      _openStudentPickerSheetEx(students, student => _teacherShowAttEditor(student));
    })
    .catch(() => { hideLoading(); Swal.fire('오류', '학생 목록을 불러오지 못했습니다.', 'error'); });
}

function _teacherShowAttEditor(student) {
  showLoading('출석 기록 불러오는 중...');
  API.getStudentAttendanceFull(student.id)
    .then(records => { hideLoading(); _renderAttEditor(student, records); })
    .catch(() => { hideLoading(); Swal.fire('오류', '출석 기록을 불러오지 못했습니다.', 'error'); });
}

function _renderAttEditor(student, records) {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3200';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.maxHeight = '90vh';
  sheet.style.display = 'flex';
  sheet.style.flexDirection = 'column';
  sheet.style.paddingBottom = '20px';

  const SESSION_ABBR = {
    '오후 자율학습':'오후', '야간 자율학습':'야간', '심야 자율학습':'심야',
    '오전 자율학습(토)':'토오전', '오후1 자율학습(토)':'토오후1', '오후2 자율학습(토)':'토오후2',
  };

  const makeRow = r => {
    const isAbsent = r.status === '결석';
    const nc = r.noCount;
    return `<div class="_ate-row" data-rid="${r.id}" style="background:var(--surface);border-radius:var(--radius-sm);box-shadow:var(--sh-sm);padding:12px 14px;display:flex;flex-direction:column;gap:8px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:13px;font-weight:700;color:var(--ink-2);">${r.date}</span>
        <span style="font-size:11px;font-weight:600;color:var(--ink-3);background:var(--bg-deep);border-radius:var(--radius-pill);padding:2px 8px;">${SESSION_ABBR[r.session]||r.session}</span>
        <span class="_ate-status" style="margin-left:auto;cursor:pointer;font-size:12px;font-weight:700;border-radius:var(--radius-pill);padding:4px 12px;transition:background .15s,color .15s;background:${isAbsent?'var(--red-dim)':'var(--green-dim)'};color:${isAbsent?'var(--red)':'var(--green)'};">${r.status}</span>
        <button class="_ate-del" aria-label="기록 삭제" style="background:none;border:none;color:var(--ink-4);cursor:pointer;padding:2px 4px;font-size:14px;flex-shrink:0;line-height:1;">✕</button>
      </div>
      ${isAbsent ? `<div class="_ate-extra" style="display:flex;align-items:center;gap:8px;">
        <button class="_ate-nc" style="flex-shrink:0;border:none;border-radius:var(--radius-pill);padding:4px 10px;cursor:pointer;font-family:var(--font);font-size:11px;font-weight:700;transition:background .15s,color .15s;background:${nc?'var(--green-dim)':'var(--bg-deep)'};color:${nc?'var(--green)':'var(--ink-3)'};">노카운트</button>
        <input class="_ate-reason" type="text" value="${r.reason||''}" placeholder="결석 사유" style="flex:1;background:var(--bg-deep);border:none;border-radius:var(--radius-pill);padding:5px 12px;font-family:var(--font);font-size:12px;font-weight:600;color:var(--ink-2);outline:none;">
      </div>` : ''}
    </div>`;
  };

  const absentCnt = records.filter(r => r.status==='결석'&&!r.noCount).length;

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <div>
        <div style="font-size:15px;font-weight:800;color:var(--ink);">${_esc(student.name)}</div>
        <div style="font-size:12px;color:var(--ink-3);margin-top:2px;">${student.ban}반 ${student.num}번 · ${_esc(student.group)}</div>
      </div>
      <button id="_aeClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:var(--sh-xs);">✕</button>
    </div>
    <div style="display:flex;gap:12px;margin-bottom:12px;padding:10px 12px;background:var(--bg-deep);border-radius:var(--radius-sm);">
      <span style="font-size:12px;font-weight:600;color:var(--ink-3);">기록 <b style="color:var(--ink);" id="_aeTotalCnt">${records.length}회</b></span>
      <span style="color:var(--ink-4);">·</span>
      <span style="font-size:12px;font-weight:600;color:var(--red);">결석 카운트 <b id="_aeAbsentCnt">${absentCnt}회</b></span>
    </div>
    <div id="_aeList" style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px;">
      ${records.length ? records.map(makeRow).join('') : '<div style="text-align:center;padding:28px;color:var(--ink-3);font-size:13px;font-weight:600;">출석 기록이 없습니다.</div>'}
    </div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  let _aeChanged = false;
  const close = () => {
    backdrop.classList.remove('show');
    setTimeout(() => backdrop.remove(), 420);
    if (_aeChanged) {
      _cache.stats = null;
      _rosterLoaded = false;
      loadStudents(false, true);
    }
  };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_aeClose').addEventListener('click', close);

  let _reasonTimer = null;

  // 상단 "기록 N회 · 결석 카운트 N회" 헤더 — 시트를 열어둔 채로 상태/노카운트를
  // 토글하거나 기록을 삭제해도 처음 연 시점 값에 멈춰있던 문제 수정.
  const _updateAeHeaderCounts = () => {
    const totalEl = sheet.querySelector('#_aeTotalCnt');
    const absentEl = sheet.querySelector('#_aeAbsentCnt');
    if (totalEl) totalEl.textContent = `${records.length}회`;
    if (absentEl) absentEl.textContent = `${records.filter(r => r.status === '결석' && !r.noCount).length}회`;
  };

  const bindReasonInput = (inp, rid, rec) => {
    inp.addEventListener('input', () => {
      rec.reason = inp.value;
      clearTimeout(_reasonTimer);
      _reasonTimer = setTimeout(() => API.updateAttendanceRecord(rid, { reason: inp.value })
        .catch(() => { _cdToast({type:'red', title:'저장 실패', sub:'사유를 저장하지 못했습니다. 다시 입력해 주세요.'}); }), 600);
    });
  };

  sheet.querySelector('#_aeList').addEventListener('click', async e => {
    const statusBtn = e.target.closest('._ate-status');
    const ncBtn     = e.target.closest('._ate-nc');
    const delBtn    = e.target.closest('._ate-del');

    if (statusBtn) {
      const row = statusBtn.closest('._ate-row');
      const rid = row.dataset.rid;
      const rec = records.find(r => r.id === rid); if (!rec) return;
      rec.status = rec.status === '출석' ? '결석' : '출석';
      const isAbs = rec.status === '결석';
      statusBtn.textContent = rec.status;
      statusBtn.style.background = isAbs ? 'var(--red-dim)' : 'var(--green-dim)';
      statusBtn.style.color      = isAbs ? 'var(--red)'     : 'var(--green)';

      const existExtra = row.querySelector('._ate-extra');
      if (isAbs && !existExtra) {
        const extra = document.createElement('div');
        extra.className = '_ate-extra';
        extra.style.cssText = 'display:flex;align-items:center;gap:8px;';
        extra.innerHTML = `<button class="_ate-nc" style="flex-shrink:0;border:none;border-radius:var(--radius-pill);padding:4px 10px;cursor:pointer;font-family:var(--font);font-size:11px;font-weight:700;background:var(--bg-deep);color:var(--ink-3);">노카운트</button>
          <input class="_ate-reason" type="text" value="" placeholder="결석 사유" style="flex:1;background:var(--bg-deep);border:none;border-radius:var(--radius-pill);padding:5px 12px;font-family:var(--font);font-size:12px;font-weight:600;color:var(--ink-2);outline:none;">`;
        row.appendChild(extra);
        bindReasonInput(extra.querySelector('._ate-reason'), rid, rec);
        rec.reason = ''; rec.noCount = false;
      } else if (!isAbs && existExtra) {
        existExtra.remove();
        rec.reason = ''; rec.noCount = false;
      }
      _updateAeHeaderCounts();

      try {
        const updates = { status: rec.status };
        if (!isAbs) { updates.reason = ''; updates.noCount = false; }
        await API.updateAttendanceRecord(rid, updates);
        _aeChanged = true;
        showSuccessToast('상태 변경됨', rec.status);
      } catch (err) { _cdToast({ type:'red', title:'저장 실패', sub: err?.message }); }
    }

    if (ncBtn) {
      const row = ncBtn.closest('._ate-row');
      const rid = row.dataset.rid;
      const rec = records.find(r => r.id === rid); if (!rec) return;
      rec.noCount = !rec.noCount;
      ncBtn.style.background = rec.noCount ? 'var(--green-dim)' : 'var(--bg-deep)';
      ncBtn.style.color      = rec.noCount ? 'var(--green)'     : 'var(--ink-3)';
      _updateAeHeaderCounts();
      try {
        await API.updateAttendanceRecord(rid, { noCount: rec.noCount });
        _aeChanged = true;
        showSuccessToast(rec.noCount ? '노카운트 설정됨' : '노카운트 해제됨');
      } catch (err) { _cdToast({ type:'red', title:'저장 실패', sub: err?.message }); }
    }

    if (delBtn) {
      const row = delBtn.closest('._ate-row');
      const rid = row.dataset.rid;
      const confirmed = await Swal.fire({
        title: '기록 삭제', text: '이 출석 기록을 삭제할까요?',
        icon: 'warning', showCancelButton: true,
        confirmButtonText: '삭제', cancelButtonText: '취소',
      });
      if (!confirmed.isConfirmed) return;
      try {
        await API.deleteAttendanceRecord(rid);
        records = records.filter(r => r.id !== rid);
        row.remove();
        _updateAeHeaderCounts();
        _aeChanged = true;
        showSuccessToast('기록 삭제됨');
      } catch { _cdToast({ type:'red', title:'삭제 실패' }); }
    }
  });

  sheet.querySelectorAll('._ate-reason').forEach(inp => {
    const rid = inp.closest('._ate-row').dataset.rid;
    const rec = records.find(r => r.id === rid);
    if (rec) bindReasonInput(inp, rid, rec);
  });
}

// ── 2. 자습 세션 변경 ──────────────────
function _teacherEditSchedule() {
  showLoading('학생 목록 불러오는 중...');
  API.getAllMemberList()
    .then(students => {
      hideLoading();
      _openStudentPickerSheetEx(students, student => {
        _teacherLoadSchedule(student);
      });
    })
    .catch(() => { hideLoading(); Swal.fire('오류', '학생 목록을 불러오지 못했습니다.', 'error'); });
}

function _teacherLoadSchedule(student) {
  showLoading('시간표 불러오는 중...');
  API.getStudentSchedule(student.id)
    .then(schedule => { hideLoading(); _renderScheduleEditor(student, schedule); })
    .catch(() => { hideLoading(); Swal.fire('오류', '시간표를 불러오지 못했습니다.', 'error'); });
}

// 자습 세션 변경분을 비교해 활동 로그에 기록 (실패해도 저장 흐름은 막지 않음)
function _logScheduleChange(student, before, after) {
  if (!_activityLogEnabled()) return;
  const DAYS_KR = { mon:'월', tue:'화', wed:'수', thu:'목', fri:'금' };
  const SESS_WD = ['오후','야간','심야'];
  const SESS_SAT = ['오전','오후'];
  const norm = obj => {
    const o = obj || {}, r = {};
    ['mon','tue','wed','thu','fri'].forEach(d => { r[d] = Array.isArray(o[d]) && o[d].length ? o[d] : ['-','-','-']; });
    r.sat = Array.isArray(o.sat) && o.sat.length ? o.sat : ['-','-'];
    return r;
  };
  const b = norm(before), a = norm(after);
  const changes = [];
  ['mon','tue','wed','thu','fri'].forEach(d => {
    SESS_WD.forEach((label, i) => {
      const bv = b[d][i] ?? '-', av = a[d][i] ?? '-';
      if (bv !== av) changes.push(`${DAYS_KR[d]} ${label} ${bv}→${av}`);
    });
  });
  SESS_SAT.forEach((label, i) => {
    const bv = b.sat[i] ?? '-', av = a.sat[i] ?? '-';
    if (bv !== av) changes.push(`토 ${label} ${bv}→${av}`);
  });
  if (!changes.length) return;
  const actor = (document.getElementById('checkerName')?.value || localStorage.getItem('checkerName') || '').trim();
  const message = `${student.name}(${student.ban}반 ${student.num}번) 자습 세션 변경: ${changes.join(', ')}`;
  API.logActivity({ actor, type: 'schedule', studentId: student.id, message }).catch(() => {});
}

function _renderScheduleEditor(student, rawSchedule, onSaved) {
  const sched = JSON.parse(JSON.stringify(rawSchedule || {}));
  ['mon','tue','wed','thu','fri'].forEach(d => { if (!Array.isArray(sched[d])) sched[d] = ['-','-','-']; });
  if (!Array.isArray(sched.sat)) sched.sat = ['-','-'];

  const DAYS_KR = { mon:'월', tue:'화', wed:'수', thu:'목', fri:'금' };
  const SESS_WD = ['오후','야간','심야'];
  const SESS_SAT = ['오전','오후'];

  // 읽기 전용 시간표(.sds-on/.sds-aft)와 같은 색 배정 — O=파랑, 방과후=초록.
  const cellStyle = v => {
    if (v === 'O')    return 'background:var(--blue-dim);color:var(--blue);border:1.5px solid var(--blue);';
    if (v === '방과후') return 'background:var(--green-dim);color:var(--green);border:1.5px solid var(--green);';
    return 'background:var(--bg-deep);color:var(--ink-4);border:1.5px solid transparent;';
  };
  const cellText = v => v === '방과후' ? '방과후' : v;

  const makeRow = (dayKey, dayKr, vals) => vals.map((v, i) => `
    <button class="_sce-cell" data-day="${dayKey}" data-idx="${i}"
      style="flex:1;min-width:0;height:38px;border-radius:var(--radius-sm,8px);cursor:pointer;font-size:12px;font-weight:700;font-family:var(--font);transition:all .15s;${cellStyle(v)}">
      ${cellText(v)}
    </button>`).join('');

  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3200';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'padding-bottom:48px;overflow-y:auto;max-height:92dvh;';

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div>
        <div style="font-size:15px;font-weight:800;color:var(--ink);">${_esc(student.name)}</div>
        <div style="font-size:12px;color:var(--ink-3);margin-top:2px;">${student.ban}반 ${student.num}번 · ${_esc(student.group)}</div>
      </div>
      <button id="_sceClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;font-size:12px;box-shadow:var(--sh-xs);">✕</button>
    </div>
    <div style="font-size:11px;color:var(--ink-4);margin-bottom:10px;">셀을 눌러 O / 방과후 / - 를 전환하세요</div>
    <!-- 평일 헤더 -->
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
      <span style="width:22px;flex-shrink:0;"></span>
      ${SESS_WD.map(s => `<span style="flex:1;text-align:center;font-size:11px;font-weight:700;color:var(--ink-3);">${s}</span>`).join('')}
    </div>
    <!-- 평일 행 -->
    <div style="display:flex;flex-direction:column;gap:7px;">
      ${['mon','tue','wed','thu','fri'].map(d => `
        <div style="display:flex;align-items:center;gap:6px;">
          <span style="width:22px;flex-shrink:0;text-align:center;font-size:13px;font-weight:700;color:var(--ink-3);">${DAYS_KR[d]}</span>
          ${makeRow(d, DAYS_KR[d], sched[d])}
        </div>`).join('')}
    </div>
    <!-- 토요일 구분 -->
    <div style="margin:14px 0 10px;display:flex;align-items:center;gap:8px;">
      <div style="flex:1;height:1px;background:var(--bg-deep);"></div>
      <span style="font-size:11px;font-weight:700;color:var(--ink-4);">토요일</span>
      <div style="flex:1;height:1px;background:var(--bg-deep);"></div>
    </div>
    <!-- 토요일 헤더 -->
    <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
      <span style="width:22px;flex-shrink:0;"></span>
      ${SESS_SAT.map(s => `<span style="flex:1;text-align:center;font-size:11px;font-weight:700;color:var(--ink-3);">${s}</span>`).join('')}
    </div>
    <!-- 토요일 행 -->
    <div style="display:flex;align-items:center;gap:6px;">
      <span style="width:22px;flex-shrink:0;text-align:center;font-size:13px;font-weight:700;color:var(--ink-3);">토</span>
      ${makeRow('sat', '토', sched.sat)}
    </div>
    <!-- 저장 -->
    <button id="_sceSave" style="margin-top:20px;padding:14px;border-radius:var(--radius);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;width:100%;box-shadow:var(--sh-blue);">저장</button>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_sceClose').addEventListener('click', close);

  sheet.querySelectorAll('._sce-cell').forEach(btn => {
    btn.addEventListener('click', () => {
      const day = btn.dataset.day;
      const idx = parseInt(btn.dataset.idx);
      const cur = sched[day][idx];
      let next;
      if (day !== 'sat' && idx === 0) {
        next = cur === '-' ? 'O' : cur === 'O' ? '방과후' : '-';
      } else {
        next = cur === '-' ? 'O' : '-';
      }
      sched[day][idx] = next;
      btn.textContent = cellText(next);
      btn.setAttribute('style', `flex:1;min-width:0;height:38px;border-radius:var(--radius-sm,8px);cursor:pointer;font-size:12px;font-weight:700;font-family:var(--font);transition:all .15s;${cellStyle(next)}`);
    });
  });

  sheet.querySelector('#_sceSave').addEventListener('click', async () => {
    const saveBtn = sheet.querySelector('#_sceSave');
    saveBtn.disabled = true;
    saveBtn.textContent = '저장 중...';
    try {
      await API.updateStudentSchedule(student.id, sched);
      _logScheduleChange(student, rawSchedule, sched);
      close();
      showSuccessToast('세션 편성 저장됨', student.name);
      _cache.stats = null;
      _rosterLoaded = false;
      // 시간표 탭: 현재 선택 유지하고 즉시 갱신
      updateGroupScheduleView();
      // 출석체크 탭: 현재 선택 그룹이 같으면 갱신
      const homeSel = document.getElementById('groupSelect');
      if (homeSel && homeSel.value === student.group) {
        loadStudents(false, true);
      }
      if (typeof onSaved === 'function') onSaved(sched);
    } catch (err) {
      Swal.fire('오류', err?.message || '저장하지 못했습니다.', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = '저장';
    }
  });
}

// ── 2-1. 평일 공휴일 설정 (교사 메뉴) ──────────────────
function _teacherEditHolidays() {
  showLoading('공휴일 설정 불러오는 중...');
  API.getHolidays()
    .then(holidays => {
      hideLoading();
      _holidays = holidays || [];
      _renderHolidayEditorSheet();
    })
    .catch(() => { hideLoading(); Swal.fire('오류', '공휴일 설정을 불러오지 못했습니다.', 'error'); });
}

function _renderHolidayEditorSheet() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3200';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'padding-bottom:40px;max-height:88vh;overflow-y:auto;';

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div style="font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">📅 평일 공휴일 설정</div>
      <button id="_heClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div style="font-size:11px;color:var(--ink-4);margin-bottom:12px;line-height:1.5;">평일 공휴일 중 자습하는 날을 등록하면 해당 요일이 공휴일 세션으로 전환됩니다.</div>
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px;box-shadow:var(--sh-pressed);margin-bottom:12px;">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input type="date" id="_holDateInput" class="cd-input" style="flex:1;min-width:130px;">
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--ink-2);cursor:pointer;">
          <input type="checkbox" id="_holAm" checked style="width:15px;height:15px;"> 오전
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--ink-2);cursor:pointer;">
          <input type="checkbox" id="_holPm" checked style="width:15px;height:15px;"> 오후
        </label>
        <button onclick="_addHoliday()" style="padding:8px 16px;border-radius:var(--radius-pill);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;box-shadow:var(--sh-blue);white-space:nowrap;">+ 추가</button>
      </div>
    </div>
    <div id="_holList" style="display:flex;flex-direction:column;gap:8px;"></div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_heClose').addEventListener('click', close);

  sheet.querySelector('#_holDateInput').value = _todayStr();
  _renderHolidayList(sheet);
}

// ── 3. 출석 기록 초기화 ────────────────
function _teacherResetAttendance() {
  const today = _todayStr();
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3100';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.paddingBottom = '40px';

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div style="font-size:15px;font-weight:800;color:var(--ink);">🗑️ 출석 기록 초기화</div>
      <button id="_traClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;font-size:12px;box-shadow:var(--sh-xs);">✕</button>
    </div>
    <div style="background:var(--bg-deep);border-radius:var(--radius);padding:12px 14px;margin-bottom:16px;">
      <div style="font-size:12px;font-weight:700;color:var(--red);margin-bottom:4px;">⚠ 주의</div>
      <div style="font-size:12px;color:var(--ink-3);line-height:1.6;">지정한 날짜의 <b>모든 반 출석 기록</b>이 삭제됩니다.<br>삭제 후에는 복구할 수 없습니다.</div>
    </div>
    <div style="font-size:13px;font-weight:700;color:var(--ink-2);margin-bottom:8px;">날짜 선택</div>
    <input type="date" id="_traDate" value="${today}"
      style="width:100%;padding:12px 14px;border-radius:var(--radius);border:1.5px solid var(--bg-deep);background:var(--surface);color:var(--ink);font-family:var(--font);font-size:14px;box-sizing:border-box;outline:none;">
    <button id="_traConfirm" style="margin-top:16px;padding:14px;border-radius:var(--radius);border:none;background:var(--red);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;width:100%;">선택한 날짜 출석 기록 삭제</button>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_traClose').addEventListener('click', close);

  sheet.querySelector('#_traConfirm').addEventListener('click', () => {
    const date = sheet.querySelector('#_traDate').value;
    if (!date) { Swal.fire('알림', '날짜를 선택해 주세요.', 'warning'); return; }
    close();
    Swal.fire({
      title: `${date} 출석 기록을 삭제할까요?`,
      text: '이 작업은 되돌릴 수 없습니다.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      customClass: { confirmButton: 'swal2-danger' },
    }).then(r => {
      if (!r.isConfirmed) return;
      showLoading('출석 기록 삭제 중...');
      API.resetAttendanceByDate(date)
        .then(() => {
          hideLoading();
          showSuccessToast('출석 기록 삭제됨', date);
          _cache.stats = null;
          if (loadedDate === date) loadStudents(false, true);
        })
        .catch(() => { hideLoading(); Swal.fire('오류', '삭제하지 못했습니다.', 'error'); });
    });
  });
}

// ── 4. 학생 추가 ──────────────────────
function _teacherAddStudent() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3100';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.paddingBottom = '40px';

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="font-size:15px;font-weight:800;color:var(--ink);margin-bottom:18px;letter-spacing:-0.4px;">➕ 학생 추가</div>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--ink-3);margin-bottom:6px;">반 (숫자)</div>
        <input id="_asClass" type="number" class="cd-input" placeholder="예: 3" min="1" max="9">
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--ink-3);margin-bottom:6px;">번호</div>
        <input id="_asNum" type="number" class="cd-input" placeholder="예: 15" min="1" max="50">
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--ink-3);margin-bottom:6px;">이름</div>
        <input id="_asName" type="text" class="cd-input" placeholder="이름 입력">
      </div>
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--ink-3);margin-bottom:6px;">자습반</div>
        <select id="_asRoom" class="cd-select">${GROUPS.map(g=>`<option value="${g}">${g}</option>`).join('')}</select>
      </div>
      <button id="_asSubmit" style="margin-top:8px;padding:14px;border-radius:var(--radius);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;box-shadow:var(--sh-blue);">추가하기</button>
    </div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

  sheet.querySelector('#_asSubmit').addEventListener('click', async () => {
    const classNum   = parseInt(sheet.querySelector('#_asClass').value);
    const studentNum = parseInt(sheet.querySelector('#_asNum').value);
    const name       = sheet.querySelector('#_asName').value.trim();
    const studyRoom  = sheet.querySelector('#_asRoom').value;
    if (!classNum || !studentNum || !name) { Swal.fire('알림', '모든 항목을 입력해 주세요.', 'warning'); return; }
    try {
      await API.addStudent({ classNum, studentNum, name, studyRoom });
      close();
      showSuccessToast('학생 추가됨', `${classNum}반 ${studentNum}번 ${name}`);
      _rosterLoaded = false;
    } catch { Swal.fire('오류', '추가하지 못했습니다.', 'error'); }
  });
}

// ── 5. 학생 삭제 / 자습반 변경 ────────────────────────
function _teacherManageStudent() {
  showLoading('학생 목록 불러오는 중...');
  API.getAllMemberList()
    .then(students => {
      hideLoading();
      _openStudentPickerSheetEx(students, student => _teacherStudentActions(student));
    })
    .catch(() => { hideLoading(); Swal.fire('오류', '학생 목록을 불러오지 못했습니다.', 'error'); });
}

function _teacherStudentActions(student) {
  showSheet({
    title: `${student.name} (${student.ban}반 ${student.num}번)`,
    text:  `현재 자습반: ${student.group}`,
    buttons: [
      { label: '자습반 변경', cls: 'csb-save',   cb: () => _teacherChangeRoom(student) },
      { label: '학생 삭제',   cls: 'csb-ignore', cb: () => _teacherDeleteStudent(student) },
      { label: '취소',        cls: 'csb-cancel', cb: null },
    ],
  });
}

function _teacherChangeRoom(student) {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3200';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.paddingBottom = '40px';

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="font-size:15px;font-weight:800;color:var(--ink);margin-bottom:4px;">${_esc(student.name)}</div>
    <div style="font-size:12px;color:var(--ink-3);margin-bottom:18px;">현재 자습반: <b style="color:var(--blue);">${_esc(student.group)}</b></div>
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${GROUPS.map(g => `
        <button class="_crBtn" data-room="${g}" style="all:unset;box-sizing:border-box;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-radius:var(--radius);box-shadow:var(--sh-md);cursor:pointer;font-size:14px;font-weight:700;background:${g===student.group?'var(--blue-dim)':'var(--surface)'};color:${g===student.group?'var(--blue)':'var(--ink)'};">
          ${g}
          ${g===student.group?`<span style="font-size:11px;background:var(--blue);color:#fff;border-radius:var(--radius-pill);padding:2px 10px;">현재</span>`:''}
        </button>`).join('')}
    </div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

  sheet.querySelectorAll('._crBtn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const newRoom = btn.dataset.room;
      if (newRoom === student.group) { close(); return; }
      try {
        await API.updateStudentRoom(student.id, newRoom);
        close();
        showSuccessToast('자습반 변경됨', `${student.name} → ${newRoom}`);
        _rosterLoaded = false; _cache.stats = null;
      } catch { Swal.fire('오류', '변경하지 못했습니다.', 'error'); }
    });
  });
}

async function _teacherDeleteStudent(student) {
  showLoading('삭제될 기록 확인 중...');
  let counts = { attendanceCount: '—', violationCount: '—' };
  try { counts = await API.getStudentRecordCounts(student.id); } catch (_) {}
  hideLoading();

  const result = await Swal.fire({
    title: `${_esc(student.name)} 삭제`,
    html:  `<b style="color:var(--red);">${student.ban}반 ${student.num}번 ${_esc(student.name)}</b>을 삭제하면 아래 기록도 함께 영구 삭제됩니다.<br><br>
      출석 기록 <b>${counts.attendanceCount}건</b> · 위반 기록 <b>${counts.violationCount}건</b><br><br>
      <span style="color:var(--red);font-weight:700;">되돌릴 수 없습니다.</span> 정말 삭제할까요?`,
    icon:  'warning', showCancelButton: true,
    confirmButtonText: '삭제', cancelButtonText: '취소',
    confirmButtonColor: 'var(--red)',
  });
  if (!result.isConfirmed) return;
  try {
    await API.deleteStudent(student.id);
    showSuccessToast('삭제됨', student.name);
    _rosterLoaded = false; _cache.stats = null;
  } catch { Swal.fire('오류', '삭제하지 못했습니다.', 'error'); }
}

// ── 6. 학생 일괄 등록 ──────────────────
function _downloadStudentTemplate() {
  const HDR = ['반','번호','이름','자습반','월오후','월야간','월심야','화오후','화야간','화심야','수오후','수야간','수심야','목오후','목야간','목심야','금오후','금야간','금심야','토오전','토오후'];
  const ex = [
    [1,1,'홍길동','청운반','O','-','-','O','-','-','O','-','-','O','-','-','O','-','-','-','-'],
    [1,2,'김철수','청운반','O','O','-','O','O','-','O','O','-','O','O','-','O','O','-','-','-'],
    [2,1,'이영희','백운 A반','O','-','-','O','-','-','O','-','-','O','-','-','O','-','-','O','-'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([HDR, ...ex]);
  ws['!cols'] = [4,4,8,12,...Array(17).fill(5)].map(wch => ({wch}));
  const info = XLSX.utils.aoa_to_sheet([
    ['필드','설명','허용값'],
    ['반','학급 번호','숫자 (1, 2, 3 …)'],
    ['번호','출석 번호','숫자 (1, 2, 3 …)'],
    ['이름','학생 이름','텍스트'],
    ['자습반','소속 자습반','청운반 / 백운 A반 / 백운 B반 / 백운 C반 / 백운 D반'],
    ['세션 컬럼','자습 참가 여부','O = 자습대상  /  방과후 = 방과후  /  - 또는 빈칸 = 미해당'],
    ['','월~금: 오후·야간·심야  /  토: 오전·오후',''],
  ]);
  info['!cols'] = [{wch:18},{wch:18},{wch:48}];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '학생목록');
  XLSX.utils.book_append_sheet(wb, info, '작성요령');
  XLSX.writeFile(wb, '청백운반_학생목록_양식.xlsx');
}

function _teacherImportStudents() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3100';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.paddingBottom = '32px';

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="font-size:15px;font-weight:800;color:var(--ink);margin-bottom:6px;">학생 일괄 등록</div>
    <div style="font-size:12px;color:var(--ink-3);margin-bottom:16px;">양식을 다운받아 작성한 뒤 업로드하세요.</div>
    <button id="_impTmpl" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:var(--radius);border:1.5px solid var(--blue);background:var(--blue-dim);color:var(--blue);font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;width:100%;margin-bottom:14px;">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      양식 다운로드 (.xlsx)
    </button>
    <div id="_impUploadArea" style="position:relative;border:2px dashed var(--bg-deep);border-radius:var(--radius);padding:28px 16px;text-align:center;cursor:pointer;margin-bottom:14px;transition:border-color .2s;">
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" stroke-width="1.5" stroke-linecap="round" style="margin-bottom:8px;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
      <div style="font-size:13px;font-weight:700;color:var(--ink-3);">파일을 탭해서 선택</div>
      <div style="font-size:11px;color:var(--ink-4);margin-top:4px;">.xlsx / .xls / .csv</div>
      <input type="file" id="_impFile" accept=".xlsx,.xls,.csv" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
    </div>
    <div id="_impPreview"></div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_impTmpl').addEventListener('click', _downloadStudentTemplate);

  sheet.querySelector('#_impFile').addEventListener('change', function() {
    const file = this.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' });
        const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
        if (!rows.length) { Swal.fire('알림', '파일에 데이터가 없습니다.', 'info'); return; }
        _renderImportPreview(sheet, rows, close);
      } catch { Swal.fire('오류', '파일을 읽을 수 없습니다. Excel 또는 CSV인지 확인하세요.', 'error'); }
    };
    reader.readAsArrayBuffer(file);
  });
}

function _renderImportPreview(sheet, rawRows, close) {
  const DAY_KEYS = {'월':'mon','화':'tue','수':'wed','목':'thu','금':'fri'};
  const SESS_IDX = {'오후':0,'야간':1,'심야':2};
  const SESSION_COLS = ['월오후','월야간','월심야','화오후','화야간','화심야','수오후','수야간','수심야','목오후','목야간','목심야','금오후','금야간','금심야','토오전','토오후'];

  const parseVal = v => { const s = String(v||'').trim(); return (s==='O'||s==='방과후') ? s : '-'; };

  const parsed = rawRows.map(r => {
    const sched = {mon:['-','-','-'],tue:['-','-','-'],wed:['-','-','-'],thu:['-','-','-'],fri:['-','-','-'],sat:['-','-']};
    for (const col of SESSION_COLS) {
      const v = parseVal(r[col]);
      if (col==='토오전') { sched.sat[0]=v; continue; }
      if (col==='토오후') { sched.sat[1]=v; continue; }
      const day=col[0]; const sess=col.slice(1);
      if (DAY_KEYS[day] && SESS_IDX[sess]!==undefined) sched[DAY_KEYS[day]][SESS_IDX[sess]]=v;
    }
    return { ban:Number(r['반']||0), num:Number(r['번호']||0), name:String(r['이름']||'').trim(), group:String(r['자습반']||'').trim(), schedule:sched };
  }).filter(r => r.name && r.group);

  const skipped = rawRows.length - parsed.length;
  const preview = sheet.querySelector('#_impPreview');
  preview.innerHTML = `
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px 14px;margin-bottom:12px;">
      <div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:8px;">미리보기 · 총 ${parsed.length}명${skipped ? ` (${skipped}행 무시됨)` : ''}</div>
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
          <thead><tr style="border-bottom:1.5px solid var(--ink-4);">
            <th style="padding:4px 6px;text-align:left;color:var(--ink-3);font-weight:700;">반</th>
            <th style="padding:4px 6px;text-align:left;color:var(--ink-3);font-weight:700;">번호</th>
            <th style="padding:4px 6px;text-align:left;color:var(--ink-3);font-weight:700;">이름</th>
            <th style="padding:4px 6px;text-align:left;color:var(--ink-3);font-weight:700;">자습반</th>
            <th style="padding:4px 6px;text-align:right;color:var(--ink-3);font-weight:700;">O 세션</th>
          </tr></thead>
          <tbody>
            ${parsed.slice(0,10).map(r=>{
              const cnt=Object.values(r.schedule).flat().filter(v=>v==='O').length;
              return `<tr style="border-bottom:1px solid var(--bg-deep);">
                <td style="padding:5px 6px;color:var(--ink);">${r.ban}</td>
                <td style="padding:5px 6px;color:var(--ink);">${r.num}</td>
                <td style="padding:5px 6px;font-weight:700;color:var(--ink);">${_esc(r.name)}</td>
                <td style="padding:5px 6px;color:var(--ink-3);font-size:11px;">${_esc(r.group)}</td>
                <td style="padding:5px 6px;text-align:right;color:var(--blue);font-weight:700;">${cnt||'-'}</td>
              </tr>`;
            }).join('')}
            ${parsed.length>10?`<tr><td colspan="5" style="padding:6px;text-align:center;color:var(--ink-4);font-size:11px;">… 외 ${parsed.length-10}명</td></tr>`:''}
          </tbody>
        </table>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button id="_impAdd" style="flex:1;padding:12px;border:none;border-radius:var(--radius-pill);background:var(--blue);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;">추가/갱신</button>
      <button id="_impReplace" style="flex:1;padding:12px;border:none;border-radius:var(--radius-pill);background:var(--red-dim);color:var(--red);font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;">전체 교체 ⚠</button>
    </div>`;

  sheet.querySelector('#_impAdd').addEventListener('click', () => _doImport(parsed, false, close));
  sheet.querySelector('#_impReplace').addEventListener('click', () => {
    Swal.fire({
      title: '전체 교체',
      html: `기존 학생 데이터 전체를 삭제하고<br>새로운 <b>${parsed.length}명</b>으로 교체합니다.<br><small style="color:var(--red);">⚠ 출석·위반 기록도 함께 삭제됩니다.</small>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: '교체',
      cancelButtonText: '취소',
    }).then(r => { if (r.isConfirmed) _doImport(parsed, true, close); });
  });
}

async function _doImport(students, replaceAll, close) {
  showLoading(replaceAll ? '전체 교체 중…' : '등록 중…');
  try {
    await API.importStudents(students, replaceAll);
    hideLoading();
    close();
    _cache.stats = null;
    _rosterLoaded = false;
    showSuccessToast('등록 완료', `${students.length}명 등록됨`);
  } catch(err) {
    hideLoading();
    Swal.fire('오류', err?.message || '등록에 실패했습니다.', 'error');
  }
}

// ── 7. 데이터 내보내기 (Excel 다중 시트) ──────────────
function _teacherExportData() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3100';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.paddingBottom = '32px';

  const mkCheck = (id, label, sub) => `
    <label style="display:flex;align-items:center;gap:14px;padding:14px;background:var(--bg-deep);border-radius:var(--radius-sm);cursor:pointer;">
      <input type="checkbox" id="${id}" checked style="width:18px;height:18px;cursor:pointer;accent-color:var(--blue);flex-shrink:0;">
      <div>
        <div style="font-size:14px;font-weight:700;color:var(--ink);">${label}</div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:2px;">${sub}</div>
      </div>
    </label>`;

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="font-size:15px;font-weight:800;color:var(--ink);margin-bottom:16px;letter-spacing:-0.4px;">데이터 내보내기</div>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
      ${mkCheck('_expAtt',   '출석 현황',     '날짜별 출결 기록 전체')}
      ${mkCheck('_expViol',  '벌금 현황',     '규정 위반 및 벌금 기록 전체')}
      ${mkCheck('_expSched', '자습 세션 편성', '학생별 요일·세션 편성 현황')}
    </div>
    <button id="_expBtn" style="padding:14px;border-radius:var(--radius-pill);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;width:100%;box-shadow:var(--sh-blue);">Excel로 내보내기</button>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });

  sheet.querySelector('#_expBtn').addEventListener('click', async () => {
    const wantAtt   = sheet.querySelector('#_expAtt').checked;
    const wantViol  = sheet.querySelector('#_expViol').checked;
    const wantSched = sheet.querySelector('#_expSched').checked;
    if (!wantAtt && !wantViol && !wantSched) { Swal.fire('알림', '내보낼 항목을 하나 이상 선택하세요.', 'info'); return; }
    const btn = sheet.querySelector('#_expBtn');
    btn.disabled = true; btn.textContent = '불러오는 중...';
    try {
      const [attRows, violRows, schedRows] = await Promise.all([
        wantAtt   ? API.exportAttendanceData() : [],
        wantViol  ? API.exportViolationsData() : [],
        wantSched ? API.exportScheduleData()   : [],
      ]);
      const wb = XLSX.utils.book_new();
      if (wantAtt   && attRows.length)   XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(attRows),   '출석현황');
      if (wantViol  && violRows.length)  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(violRows),  '벌금현황');
      if (wantSched && schedRows.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(schedRows), '세션편성');
      if (!wb.SheetNames.length) { Swal.fire('알림', '내보낼 데이터가 없습니다.', 'info'); btn.disabled=false; btn.textContent='Excel로 내보내기'; return; }
      const today = _todayStr();
      XLSX.writeFile(wb, `청백운반_${today}.xlsx`);
      close();
      showSuccessToast('내보내기 완료', `시트 ${wb.SheetNames.length}개`);
    } catch(err) {
      Swal.fire('오류', err?.message || '내보내기 실패', 'error');
      btn.disabled = false; btn.textContent = '내보내기';
    }
  });
}

// ── 7. 전체 벌금 현황 ─────────────────
function _teacherViewFines() {
  showLoading('벌금 현황 불러오는 중...');
  API.getAllViolationsWithStudents()
    .then(all => {
      hideLoading();
      const fines = all.filter(v => _parseFine(v.action) > 0);
      _renderFineSheet(fines);
    })
    .catch(() => { hideLoading(); Swal.fire('오류', '벌금 현황을 불러오지 못했습니다.', 'error'); });
}

// 자습반별로 묶은 벌금 현황을 공유하기 좋은 텍스트로 변환
function _buildFineReportText(visible, filterState) {
  const fmt = n => n.toLocaleString('ko-KR') + '원';
  const total  = visible.reduce((s, v) => s + _parseFine(v.action), 0);
  const paid   = visible.filter(v => v.paid).reduce((s, v) => s + _parseFine(v.action), 0);
  const unpaid = total - paid;

  let report = `[자습반별 벌금 현황${filterState === 'unpaid' ? ' · 미납만' : ''}]\n`;
  report += `▪ 총 부과: ${fmt(total)} · 납부: ${fmt(paid)} · 미납: ${fmt(unpaid)}\n`;
  // attendance.js의 viewAllResults와 동일한 이유로 "-" 반복 대신 박스 그리기
  // 문자(─)를 쓴다 — 마크다운 지원 붙여넣기 대상에서 구분선/제목으로 오인되는 문제 방지.
  report += '────────────────\n';

  const byGroup = {};
  for (const v of visible) (byGroup[v.student.group || '기타'] ??= []).push(v);

  for (const [group, vs] of Object.entries(byGroup)) {
    const groupTotal  = vs.reduce((s, v) => s + _parseFine(v.action), 0);
    const groupUnpaid = vs.filter(v => !v.paid).reduce((s, v) => s + _parseFine(v.action), 0);
    report += `\n[${group}] 소계 ${fmt(groupTotal)}${groupUnpaid > 0 ? ` (미납 ${fmt(groupUnpaid)})` : ''}\n`;
    vs.forEach(v => {
      const fine = _parseFine(v.action);
      report += `· ${v.student.ban}반 ${v.student.num}번 ${v.student.name} · ${v.violType}${v.detail ? `(${v.detail})` : ''} · ${fmt(fine)} [${v.paid ? '납부' : '미납'}]\n`;
    });
  }
  report += '────────────────';
  return report;
}

function _renderFineSheet(fines) {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3100';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'max-height:92dvh;display:flex;flex-direction:column;padding-bottom:20px;';

  const fmt = n => n.toLocaleString('ko-KR') + '원';
  let filterState = 'all';

  const calcSummary = () => {
    const total  = fines.reduce((s, v) => s + _parseFine(v.action), 0);
    const paid   = fines.filter(v => v.paid).reduce((s, v) => s + _parseFine(v.action), 0);
    return { total, paid, unpaid: total - paid };
  };

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div style="font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">전체 벌금 현황</div>
      <div style="display:flex;gap:6px;">
        <button id="_fshCopy" aria-label="텍스트로 복사" title="텍스트로 복사" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--blue-dim);color:var(--blue);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        </button>
        <button id="_fshClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <!-- 요약 바 -->
    <div style="display:flex;gap:6px;margin-bottom:12px;">
      <div style="flex:1;background:var(--bg-deep);border-radius:var(--radius-sm);padding:10px 8px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--ink-3);margin-bottom:3px;">총 부과</div>
        <div id="_fshTotal" style="font-size:13px;font-weight:800;color:var(--ink);"></div>
      </div>
      <div style="flex:1;background:var(--green-dim);border-radius:var(--radius-sm);padding:10px 8px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--ink-3);margin-bottom:3px;">납부</div>
        <div id="_fshPaid" style="font-size:13px;font-weight:800;color:var(--green);"></div>
      </div>
      <div style="flex:1;background:var(--red-dim);border-radius:var(--radius-sm);padding:10px 8px;text-align:center;">
        <div style="font-size:10px;font-weight:700;color:var(--ink-3);margin-bottom:3px;">미납</div>
        <div id="_fshUnpaid" style="font-size:13px;font-weight:800;color:var(--red);"></div>
      </div>
    </div>
    <!-- 필터 탭 -->
    <div style="display:flex;gap:6px;margin-bottom:12px;">
      <button id="_fshTabAll"    style="flex:1;padding:7px;border-radius:var(--radius-pill);border:none;font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;background:var(--blue);color:#fff;">전체</button>
      <button id="_fshTabUnpaid" style="flex:1;padding:7px;border-radius:var(--radius-pill);border:none;font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;background:var(--bg-deep);color:var(--ink-3);">미납만</button>
    </div>
    <!-- 목록 -->
    <div id="_fshList" style="overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:8px;"></div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_fshClose').addEventListener('click', close);
  sheet.querySelector('#_fshCopy').addEventListener('click', () => {
    const visible = filterState === 'unpaid' ? fines.filter(v => !v.paid) : fines;
    if (!visible.length) { showSuccessToast('복사할 내용이 없습니다'); return; }
    const text = _buildFineReportText(visible, filterState);
    navigator.clipboard.writeText(text).then(() => showSuccessToast('클립보드에 복사됐어요'));
  });

  const refreshSummary = () => {
    const { total, paid, unpaid } = calcSummary();
    sheet.querySelector('#_fshTotal').textContent  = fmt(total);
    sheet.querySelector('#_fshPaid').textContent   = fmt(paid);
    sheet.querySelector('#_fshUnpaid').textContent = fmt(unpaid);
  };

  const renderList = () => {
    const list = sheet.querySelector('#_fshList');
    const visible = filterState === 'unpaid' ? fines.filter(v => !v.paid) : fines;

    if (!visible.length) {
      list.innerHTML = `<div style="text-align:center;padding:32px;color:var(--ink-3);font-size:13px;font-weight:600;">${filterState === 'unpaid' ? '미납 벌금이 없습니다 🎉' : '벌금 기록이 없습니다.'}</div>`;
      return;
    }

    // 자습반별 그룹
    const byGroup = {};
    for (const v of visible) {
      const g = v.student.group || '기타';
      (byGroup[g] ??= []).push(v);
    }

    let html = '';
    for (const [group, vs] of Object.entries(byGroup)) {
      const groupTotal  = vs.reduce((s, v) => s + _parseFine(v.action), 0);
      const groupUnpaid = vs.filter(v => !v.paid).reduce((s, v) => s + _parseFine(v.action), 0);
      html += `<div style="display:flex;align-items:baseline;justify-content:space-between;padding:6px 2px 4px;">
        <span style="font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:var(--ink-4);">${_esc(group)}</span>
        <span style="font-size:11px;font-weight:700;color:var(--ink-3);">소계 ${fmt(groupTotal)}${groupUnpaid > 0 ? ` · 미납 ${fmt(groupUnpaid)}` : ''}</span>
      </div>`;
      for (const v of vs) {
        const fine = _parseFine(v.action);
        const isPaid = v.paid;
        html += `<div class="_fsh-row" data-vid="${v.id}"
          style="background:var(--surface);border-radius:var(--radius-sm);box-shadow:var(--sh-sm);padding:12px 14px;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px;">
            <span style="font-size:13px;font-weight:700;color:var(--ink);">${_esc(v.student.name)}</span>
            <span style="font-size:11px;color:var(--ink-3);">${v.student.ban}반 ${v.student.num}번</span>
            <span style="margin-left:auto;font-size:11px;color:var(--ink-4);">${v.date}</span>
          </div>
          <div style="font-size:11px;color:var(--ink-3);margin-bottom:8px;">${_esc(v.violType)}${v.detail ? ' · ' + _esc(v.detail) : ''}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <span class="_fsh-amt" style="font-size:14px;font-weight:800;color:${isPaid ? 'var(--ink-3)' : 'var(--red)'};">${fmt(fine)}</span>
            <button class="_fsh-e" title="수정" aria-label="수정" style="width:26px;height:26px;border-radius:6px;border:1.5px solid var(--bg-deep);background:var(--surface);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="_fsh-d" title="삭제" aria-label="삭제" style="width:26px;height:26px;border-radius:6px;border:1.5px solid var(--red-dim);background:var(--red-dim);color:var(--red);cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;flex-shrink:0;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
            <div style="margin-left:auto;display:flex;border-radius:var(--radius-pill);overflow:hidden;border:1.5px solid var(--bg-deep);">
              <button class="_fsh-u" style="padding:4px 14px;border:none;font-family:var(--font);font-size:11px;font-weight:700;cursor:pointer;background:${!isPaid ? 'var(--red)' : 'var(--surface)'};color:${!isPaid ? '#fff' : 'var(--ink-3)'};">미납</button>
              <button class="_fsh-p" style="padding:4px 14px;border:none;font-family:var(--font);font-size:11px;font-weight:700;cursor:pointer;background:${isPaid ? 'var(--green)' : 'var(--surface)'};color:${isPaid ? '#fff' : 'var(--ink-3)'};">납부</button>
            </div>
          </div>
        </div>`;
      }
    }
    list.innerHTML = html;

    list.querySelectorAll('._fsh-row').forEach(row => {
      const vid  = row.dataset.vid;
      const viol = fines.find(v => v.id === vid);
      if (!viol) return;

      const applyState = () => {
        const uBtn = row.querySelector('._fsh-u');
        const pBtn = row.querySelector('._fsh-p');
        const amtEl = row.querySelector('._fsh-amt');
        if (uBtn) { uBtn.style.background = !viol.paid ? 'var(--red)' : 'var(--surface)'; uBtn.style.color = !viol.paid ? '#fff' : 'var(--ink-3)'; }
        if (pBtn) { pBtn.style.background = viol.paid  ? 'var(--green)' : 'var(--surface)'; pBtn.style.color = viol.paid  ? '#fff' : 'var(--ink-3)'; }
        if (amtEl) amtEl.style.color = viol.paid ? 'var(--ink-3)' : 'var(--red)';
        refreshSummary();
      };

      row.querySelector('._fsh-e').addEventListener('click', () => {
        _editFineRecord(viol, () => { renderList(); refreshSummary(); });
      });
      row.querySelector('._fsh-d').addEventListener('click', () => {
        const amt = _parseFine(viol.action).toLocaleString('ko-KR');
        Swal.fire({
          title: '벌금 기록 삭제',
          text: `${viol.student.name}의 ${amt}원 벌금 기록을 삭제합니다.`,
          icon: 'warning',
          showCancelButton: true,
          confirmButtonText: '삭제',
          cancelButtonText: '취소',
        }).then(r => {
          if (!r.isConfirmed) return;
          API.deleteViolation(vid)
            .then(() => {
              const i = fines.findIndex(v => v.id === vid);
              if (i !== -1) fines.splice(i, 1);
              renderList(); refreshSummary();
              _cdToast({ type:'red', title:'삭제됨', sub: `${viol.student.name} 벌금 기록` });
            })
            .catch(() => _cdToast({ type:'red', title:'삭제 실패' }));
        });
      });
      row.querySelector('._fsh-u').addEventListener('click', () => {
        if (!viol.paid) return;
        viol.paid = false; applyState();
        API.updateViolationPayment(vid, false).catch(() => _cdToast({ type:'red', title:'저장 실패' }));
      });
      row.querySelector('._fsh-p').addEventListener('click', () => {
        if (viol.paid) return;
        viol.paid = true; applyState();
        API.updateViolationPayment(vid, true).catch(() => _cdToast({ type:'red', title:'저장 실패' }));
        if (filterState === 'unpaid') {
          row.style.transition = 'opacity .3s';
          row.style.opacity = '0.3';
          setTimeout(() => row.remove(), 320);
        }
      });
    });
  };

  // 필터 버튼
  const switchFilter = (state) => {
    filterState = state;
    sheet.querySelector('#_fshTabAll').style.cssText    += `;background:${state==='all'    ? 'var(--blue)' : 'var(--bg-deep)'};color:${state==='all'    ? '#fff' : 'var(--ink-3)'}`;
    sheet.querySelector('#_fshTabUnpaid').style.cssText += `;background:${state==='unpaid' ? 'var(--red)'  : 'var(--bg-deep)'};color:${state==='unpaid' ? '#fff' : 'var(--ink-3)'}`;
    renderList();
  };
  sheet.querySelector('#_fshTabAll').addEventListener('click',    () => switchFilter('all'));
  sheet.querySelector('#_fshTabUnpaid').addEventListener('click', () => switchFilter('unpaid'));

  refreshSummary();
  renderList();
}

// ── 벌금 기록 수정 시트 ─────────────────────────────
function _editFineRecord(viol, onSaved) {
  const origFine = _parseFine(viol.action);
  const isCustomType = !_violationTypes.slice(0, -1).includes(viol.violType);

  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3200';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.paddingBottom = '32px';

  const violOpts = _violationTypes.map(v => {
    const sel = (v === viol.violType) || (v === '직접 입력' && isCustomType);
    return `<option value="${_esc(v)}"${sel ? ' selected' : ''}>${_esc(v)}</option>`;
  }).join('');

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <div style="font-size:15px;font-weight:800;color:var(--ink);">벌금 기록 수정</div>
      <button id="_feClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div style="font-size:12px;color:var(--ink-3);margin-bottom:14px;font-weight:600;">${_esc(viol.student.name)} (${viol.student.ban}반 ${viol.student.num}번)</div>
    <div class="viol-field">
      <label class="viol-label">날짜</label>
      <input type="date" class="viol-input" id="_feDate" value="${viol.date}">
    </div>
    <div class="viol-field">
      <label class="viol-label">위반 유형</label>
      <select class="viol-select" id="_feType">
        ${violOpts}
      </select>
      <div id="_feTypeCustomWrap" style="margin-top:8px;display:${isCustomType ? 'block' : 'none'};">
        <input type="text" class="viol-input" id="_feTypeCustom" value="${isCustomType ? _esc(viol.violType) : ''}" placeholder="위반 유형을 직접 입력하세요">
      </div>
    </div>
    <div class="viol-field">
      <label class="viol-label">벌금 금액</label>
      <div style="position:relative;">
        <input type="text" inputmode="numeric" class="viol-input" id="_feFine" value="${origFine.toLocaleString('ko-KR')}" style="padding-right:40px!important;">
        <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:13px;font-weight:600;color:var(--ink-3);pointer-events:none;">원</span>
      </div>
    </div>
    <div class="viol-field">
      <label class="viol-label">상세 내용 <span style="font-size:10px;color:var(--ink-4);font-weight:500;">(선택)</span></label>
      <textarea class="viol-textarea" id="_feDetail" placeholder="추가 메모를 입력하세요.">${_esc(viol.detail)}</textarea>
    </div>
    <div style="display:flex;gap:10px;margin-top:16px;">
      <button id="_feCancel" class="csb-cancel" style="flex:1;padding:13px;border:none;border-radius:var(--radius-pill);font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;">취소</button>
      <button id="_feSave" style="flex:2;padding:13px;border:none;border-radius:var(--radius-pill);background:var(--blue);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;box-shadow:var(--sh-blue);">저장</button>
    </div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_feClose').addEventListener('click', close);
  sheet.querySelector('#_feCancel').addEventListener('click', close);

  sheet.querySelector('#_feType').addEventListener('change', function () {
    const wrap = sheet.querySelector('#_feTypeCustomWrap');
    if (wrap) wrap.style.display = this.value === '직접 입력' ? 'block' : 'none';
  });
  sheet.querySelector('#_feFine').addEventListener('input', function () {
    const raw = this.value.replace(/[^0-9]/g, '');
    this.value = raw ? Number(raw).toLocaleString('ko-KR') : '';
  });

  sheet.querySelector('#_feSave').addEventListener('click', async () => {
    const saveBtn = sheet.querySelector('#_feSave');
    const dateVal = sheet.querySelector('#_feDate').value.trim();
    let violType = sheet.querySelector('#_feType').value;
    if (violType === '직접 입력') {
      violType = (sheet.querySelector('#_feTypeCustom').value || '').trim();
      if (!violType) { Swal.fire('알림', '위반 유형을 입력해 주세요.', 'warning'); return; }
    }
    const fineRaw = (sheet.querySelector('#_feFine').value || '').replace(/[^0-9]/g, '');
    if (!fineRaw || Number(fineRaw) <= 0) { Swal.fire('알림', '벌금 금액을 입력해 주세요.', 'warning'); return; }
    const action = `벌금 ${Number(fineRaw).toLocaleString('ko-KR')}원`;
    const detail = (sheet.querySelector('#_feDetail').value || '').trim();

    saveBtn.disabled = true; saveBtn.textContent = '저장 중...';
    try {
      await API.updateViolationRecord(viol.id, { viol_date: dateVal, viol_type: violType, action, detail });
      viol.date = dateVal; viol.violType = violType; viol.action = action; viol.detail = detail;
      close();
      if (onSaved) onSaved();
      _cdToast({ type:'green', title:'수정 완료', sub: `${viol.student.name} 벌금 기록` });
    } catch (err) {
      saveBtn.disabled = false; saveBtn.textContent = '저장';
      Swal.fire('오류', err?.message || '저장하지 못했습니다.', 'error');
    }
  });
}

/* ════════════════════════════════
   개발자 메뉴
════════════════════════════════ */
function handleHeaderClick() {
  _headerClickCount++;
  clearTimeout(_headerClickTimer);
  _headerClickTimer = setTimeout(()=>{ _headerClickCount=0; }, 800);
  if (_headerClickCount >= 3) {
    _headerClickCount = 0;
    _openDevPasswordPrompt();
  }
}

function _openDevPasswordPrompt() {
  Swal.fire({
    title: '개발자 메뉴',
    input: 'password',
    inputPlaceholder: '비밀번호 입력',
    inputAttributes: { autocomplete: 'off' },
    showCancelButton: true,
    confirmButtonText: '확인',
    cancelButtonText: '취소',
    customClass: { input: 'cd-input' }
  }).then(result => {
    if (result.isConfirmed && result.value === '4834') {
      _openDevMenu();
    } else if (result.isConfirmed) {
      Swal.fire({ title: '비밀번호 오류', icon: 'error', confirmButtonText: '확인' });
    }
  });
}

function _openDevMenu() {
  showLoading('설정 불러오는 중...');
  Promise.all([
    API.getHolidays().catch(() => []),
    API.getActivityLogEnabled().catch(() => _activityLogOn),
  ]).then(([holidays, activityLogOn]) => {
    hideLoading();
    _holidays = holidays || [];
    _activityLogOn = activityLogOn;
    _applyActivityBellVisibility();
    _renderDevMenuSheet();
  });
}

function _openChangelogSheet() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3200';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'padding-bottom:40px;max-height:88vh;overflow-y:auto;';

  const TYPE_META = {
    major: { label:'MAJOR', bg:'var(--purple-dim)', fg:'var(--purple)' },
    minor: { label:'MINOR', bg:'var(--blue-dim)',   fg:'var(--blue)' },
    patch: { label:'PATCH', bg:'var(--bg-deep)',    fg:'var(--ink-3)' },
  };
  const rows = CHANGELOG.map(e => {
    const m = TYPE_META[e.t];
    const isMajor = e.t === 'major';
    return `<div style="display:flex;gap:12px;padding:${isMajor ? '14px' : '11px'} 2px;${isMajor ? 'border-top:1px solid var(--bg-deep);border-bottom:1px solid var(--bg-deep);' : ''}">
      <div style="flex-shrink:0;width:60px;text-align:center;">
        <div style="font-size:${isMajor ? '14px' : '12px'};font-weight:800;color:${m.fg};">${e.v}</div>
        <div style="font-size:9px;font-weight:700;letter-spacing:0.4px;color:${m.fg};background:${m.bg};border-radius:var(--radius-pill);padding:1px 6px;margin-top:3px;display:inline-block;">${m.label}</div>
      </div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:${isMajor ? '13.5px' : '13px'};font-weight:${isMajor ? '800' : '600'};color:var(--ink);line-height:1.5;">${e.title}</div>
        <div style="font-size:10.5px;color:var(--ink-4);margin-top:3px;">${e.d}</div>
      </div>
    </div>`;
  }).join('');

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px;">
      <div style="width:42px;height:42px;border-radius:var(--radius-sm);background:var(--purple-dim);display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-sm);flex-shrink:0;">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">개발 로그</div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">현재 버전 v${APP_VERSION}</div>
      </div>
      <button id="_clClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);flex-shrink:0;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div style="font-size:10px;color:var(--ink-4);line-height:1.6;margin-bottom:6px;">
      <b style="color:var(--purple);">MAJOR</b> 대규모 업데이트 · <b style="color:var(--blue);">MINOR</b> 기능·디자인 개선 · <b style="color:var(--ink-3);">PATCH</b> 버그 수정
    </div>
    <div style="display:flex;flex-direction:column;">${rows}</div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_clClose').addEventListener('click', close);
}

function _renderDevMenuSheet() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3000';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.paddingBottom = '40px';
  sheet.style.maxHeight = '88vh';
  sheet.style.overflowY = 'auto';

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">⚙️ 개발자 메뉴</div>
      <button id="_devClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <button id="_devChangelogBtn" style="all:unset;box-sizing:border-box;display:flex;align-items:center;gap:12px;background:var(--purple-dim);border-radius:var(--radius);padding:12px 14px;cursor:pointer;width:100%;margin-bottom:22px;-webkit-tap-highlight-color:transparent;">
      <div style="width:34px;height:34px;border-radius:var(--radius-sm);background:var(--surface);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:var(--sh-sm);">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
      </div>
      <div style="flex:1;text-align:left;">
        <div style="font-size:13px;font-weight:800;color:var(--purple);">개발 로그</div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">현재 버전 v${APP_VERSION} · 전체 업데이트 내역 보기</div>
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>

    <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">📅 평일 공휴일 설정</div>
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px;box-shadow:var(--sh-pressed);margin-bottom:12px;">
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <input type="date" id="_holDateInput" class="cd-input" style="flex:1;min-width:130px;">
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--ink-2);cursor:pointer;">
          <input type="checkbox" id="_holAm" checked style="width:15px;height:15px;"> 오전
        </label>
        <label style="display:flex;align-items:center;gap:4px;font-size:13px;font-weight:600;color:var(--ink-2);cursor:pointer;">
          <input type="checkbox" id="_holPm" checked style="width:15px;height:15px;"> 오후
        </label>
        <button onclick="_addHoliday()" style="padding:8px 16px;border-radius:var(--radius-pill);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;box-shadow:var(--sh-blue);white-space:nowrap;">+ 추가</button>
      </div>
    </div>

    <div id="_holList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px;"></div>

    <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">🏫 학기 설정</div>
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px;box-shadow:var(--sh-pressed);margin-bottom:24px;">
      <div style="font-size:11px;color:var(--ink-3);margin-bottom:10px;line-height:1.5;">통계 탭 "1학기/2학기" 표시가 이 월·일을 기준으로 자동 전환돼요. (연도는 무시하고 매년 반복 적용)</div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;">
        <label style="font-size:12px;font-weight:700;color:var(--ink-2);width:76px;flex-shrink:0;">1학기 시작</label>
        <input type="date" id="_semS1Input" class="cd-input" style="flex:1;">
      </div>
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
        <label style="font-size:12px;font-weight:700;color:var(--ink-2);width:76px;flex-shrink:0;">2학기 시작</label>
        <input type="date" id="_semS2Input" class="cd-input" style="flex:1;">
      </div>
      <button onclick="_saveSemesterConfig()" style="width:100%;padding:8px 16px;border-radius:var(--radius-pill);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;box-shadow:var(--sh-blue);">저장</button>
    </div>

    <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">🔐 교사 메뉴 보안</div>
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--sh-pressed);margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--ink-2);">비밀번호 잠금</div>
          <div style="font-size:11px;color:var(--ink-3);margin-top:2px;">OFF 시 기어 아이콘 탭으로 바로 진입</div>
        </div>
        <button id="_devPwToggle" onclick="_toggleTeacherPw()" style="padding:6px 16px;border-radius:var(--radius-pill);border:none;font-family:var(--font);font-size:13px;font-weight:800;cursor:pointer;min-width:52px;transition:background .2s,color .2s;"></button>
      </div>
    </div>

    <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">🔔 활동 로그 / 공지사항</div>
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px 14px;box-shadow:var(--sh-pressed);margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;color:var(--ink-2);">헤더 종 아이콘 사용</div>
          <div style="font-size:11px;color:var(--ink-3);margin-top:2px;">모든 교사에게 공통 적용 · OFF 시 종 아이콘 숨김, 세션 변경 자동 기록도 중단</div>
        </div>
        <button id="_devActLogToggle" onclick="_toggleActivityLog()" style="padding:6px 16px;border-radius:var(--radius-pill);border:none;font-family:var(--font);font-size:13px;font-weight:800;cursor:pointer;min-width:52px;transition:background .2s,color .2s;"></button>
      </div>
    </div>

    <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">🗑️ 출석 기록 초기화</div>
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px;box-shadow:var(--sh-pressed);margin-bottom:24px;">
      <div style="font-size:11px;color:var(--red);font-weight:600;margin-bottom:8px;">지정한 날짜의 모든 출석 기록이 삭제됩니다.</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="date" id="_resetDateInput" class="cd-input" style="flex:1;">
        <button onclick="_devResetAttendance()" style="padding:8px 16px;border-radius:var(--radius-pill);border:none;background:var(--red);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">초기화</button>
      </div>
    </div>

    <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:var(--ink-3);margin-bottom:10px;">📝 결석 사유 관리</div>
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px;box-shadow:var(--sh-pressed);">
      <div id="_reasonList" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;"></div>
      <div style="display:flex;gap:8px;">
        <input type="text" id="_reasonInput" class="cd-input" placeholder="새 사유 입력" style="flex:1;" onkeydown="if(event.key==='Enter')_addReasonType()">
        <button onclick="_addReasonType()" style="padding:8px 16px;border-radius:var(--radius-pill);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:var(--sh-blue);">+ 추가</button>
      </div>
    </div>

    <div style="font-size:12px;font-weight:700;letter-spacing:0.4px;text-transform:uppercase;color:var(--ink-3);margin:20px 0 10px;">⚠️ 위반 유형 관리</div>
    <div style="background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px;box-shadow:var(--sh-pressed);">
      <div id="_violTypeList" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;"></div>
      <div style="display:flex;gap:8px;">
        <input type="text" id="_violTypeInput" class="cd-input" placeholder="새 위반 유형 입력" style="flex:1;" onkeydown="if(event.key==='Enter')_addViolationType()">
        <button onclick="_addViolationType()" style="padding:8px 16px;border-radius:var(--radius-pill);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:var(--sh-blue);">+ 추가</button>
      </div>
      <div style="font-size:10.5px;color:var(--ink-4);margin-top:8px;line-height:1.5;">'직접 입력'은 항상 마지막에 고정으로 붙어서 목록에 표시되지 않습니다.</div>
    </div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(()=>requestAnimationFrame(()=>backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(), 420); };
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });
  sheet.querySelector('#_devClose').addEventListener('click', close);
  sheet.querySelector('#_devChangelogBtn').addEventListener('click', () => { close(); setTimeout(_openChangelogSheet, 370); });

  sheet.querySelector('#_holDateInput').value = _todayStr();
  sheet.querySelector('#_resetDateInput').value = _todayStr();
  const semCfg = _semesterConfig || _SEMESTER_DEFAULT;
  sheet.querySelector('#_semS1Input').value = '2000-' + semCfg.s1;
  sheet.querySelector('#_semS2Input').value = '2000-' + semCfg.s2;
  _renderHolidayList(sheet);
  _renderReasonList(sheet);
  _renderViolationTypeList(sheet);
  const pwBtn = sheet.querySelector('#_devPwToggle');
  if (pwBtn) _applyTeacherPwBtn(pwBtn);
  const actLogBtn = sheet.querySelector('#_devActLogToggle');
  if (actLogBtn) _applyActivityLogBtn(actLogBtn);
}

async function _saveSemesterConfig() {
  const s1 = document.getElementById('_semS1Input')?.value?.slice(5); // 'YYYY-MM-DD' → 'MM-DD'
  const s2 = document.getElementById('_semS2Input')?.value?.slice(5);
  if (!s1 || !s2) { showSuccessToast('날짜를 입력해 주세요'); return; }
  if (s1 >= s2) { Swal.fire('오류', '1학기 시작일이 2학기 시작일보다 빨라야 합니다.', 'error'); return; }
  const cfg = { s1, s2 };
  try {
    await API.saveSemesterConfig(cfg);
    _semesterConfig = cfg;
    _applySemesterLabel();
    showSuccessToast('학기 설정 저장됨', `1학기 ${s1} · 2학기 ${s2}`);
  } catch (e) {
    Swal.fire('오류', e?.message || '저장하지 못했습니다.', 'error');
  }
}

function _applyTeacherPwBtn(btn) {
  const on = localStorage.getItem('teacherPwEnabled') !== 'false';
  btn.textContent = on ? 'ON' : 'OFF';
  btn.style.background = on ? 'var(--green)' : 'var(--red)';
  btn.style.color = '#fff';
}

function _toggleTeacherPw() {
  const on = localStorage.getItem('teacherPwEnabled') !== 'false';
  localStorage.setItem('teacherPwEnabled', on ? 'false' : 'true');
  const btn = document.getElementById('_devPwToggle');
  if (btn) _applyTeacherPwBtn(btn);
  showSuccessToast('교사 메뉴 잠금 ' + (!on ? 'ON' : 'OFF'));
}

function _applyActivityLogBtn(btn) {
  const on = _activityLogEnabled();
  btn.textContent = on ? 'ON' : 'OFF';
  btn.style.background = on ? 'var(--green)' : 'var(--red)';
  btn.style.color = '#fff';
}

async function _toggleActivityLog() {
  const prev = _activityLogOn;
  const next = !prev;
  _activityLogOn = next;
  const btn = document.getElementById('_devActLogToggle');
  if (btn) _applyActivityLogBtn(btn);
  _applyActivityBellVisibility();
  try {
    await API.saveActivityLogEnabled(next);
    showSuccessToast('활동 로그 ' + (next ? 'ON' : 'OFF'), '모든 교사에게 적용됩니다');
  } catch (err) {
    _activityLogOn = prev;
    if (btn) _applyActivityLogBtn(btn);
    _applyActivityBellVisibility();
    Swal.fire('오류', err?.message || '설정을 저장하지 못했습니다.', 'error');
  }
}

function _renderReasonList(sheet) {
  const list = sheet ? sheet.querySelector('#_reasonList') : document.getElementById('_reasonList');
  if (!list) return;
  if (!_reasonTypes.length) {
    list.innerHTML = '<div style="text-align:center;padding:12px;color:var(--ink-3);font-size:13px;font-weight:600;">등록된 사유가 없습니다.</div>';
    return;
  }
  list.innerHTML = _reasonTypes.map((r, i) => `
    <div style="display:flex;align-items:center;gap:6px;padding:8px 10px;background:var(--surface);border-radius:var(--radius-sm);box-shadow:var(--sh-sm);">
      <span style="flex:1;font-size:13px;font-weight:600;color:var(--ink);">${_esc(r)}</span>
      <button onclick="_moveReasonType(${i},-1)" title="위로" aria-label="위로 이동" style="width:28px;height:28px;border:none;border-radius:6px;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;font-size:13px;line-height:1;">↑</button>
      <button onclick="_moveReasonType(${i},1)"  title="아래로" aria-label="아래로 이동" style="width:28px;height:28px;border:none;border-radius:6px;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;font-size:13px;line-height:1;">↓</button>
      <button onclick="_deleteReasonType(${i})" title="삭제" aria-label="사유 삭제" style="width:28px;height:28px;border:none;border-radius:6px;background:var(--red-dim);color:var(--red);cursor:pointer;font-size:16px;font-weight:900;line-height:1;">×</button>
    </div>`).join('');
}

async function _addReasonType() {
  const input = document.getElementById('_reasonInput');
  const val = (input?.value || '').trim();
  if (!val) return;
  if (_reasonTypes.includes(val)) { showSuccessToast('이미 있는 사유입니다'); return; }
  _reasonTypes = [..._reasonTypes, val];
  input.value = '';
  _renderReasonList(null);
  try { await API.saveReasonTypes(_reasonTypes); showSuccessToast('저장 완료'); }
  catch (e) { showSuccessToast('저장 실패: ' + e.message); }
}

async function _deleteReasonType(idx) {
  const removed = _reasonTypes[idx];
  _reasonTypes = _reasonTypes.filter((_, i) => i !== idx);
  _renderReasonList(null);
  try { await API.saveReasonTypes(_reasonTypes); showSuccessToast(`"${removed}" 삭제됨`); }
  catch (e) { showSuccessToast('저장 실패: ' + e.message); }
}

async function _moveReasonType(idx, dir) {
  const next = idx + dir;
  if (next < 0 || next >= _reasonTypes.length) return;
  const arr = [..._reasonTypes];
  [arr[idx], arr[next]] = [arr[next], arr[idx]];
  _reasonTypes = arr;
  _renderReasonList(null);
  try { await API.saveReasonTypes(_reasonTypes); }
  catch (e) { showSuccessToast('저장 실패: ' + e.message); }
}

// ── 위반 유형 관리 (결석 사유와 동일한 패턴) ──
// _violationTypes의 마지막 '직접 입력'은 고정 항목이라 관리 목록에는 안 보여주고,
// 저장할 때도 편집 가능한 부분만 서버에 저장한다.
function _violEditable() { return _violationTypes.slice(0, -1); }

function _renderViolationTypeList(sheet) {
  const list = sheet ? sheet.querySelector('#_violTypeList') : document.getElementById('_violTypeList');
  if (!list) return;
  const editable = _violEditable();
  if (!editable.length) {
    list.innerHTML = '<div style="text-align:center;padding:12px;color:var(--ink-3);font-size:13px;font-weight:600;">등록된 유형이 없습니다.</div>';
    return;
  }
  list.innerHTML = editable.map((v, i) => `
    <div style="display:flex;align-items:center;gap:6px;padding:8px 10px;background:var(--surface);border-radius:var(--radius-sm);box-shadow:var(--sh-sm);">
      <span style="flex:1;font-size:13px;font-weight:600;color:var(--ink);">${_esc(v)}</span>
      <button onclick="_moveViolationType(${i},-1)" title="위로" aria-label="위로 이동" style="width:28px;height:28px;border:none;border-radius:6px;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;font-size:13px;line-height:1;">↑</button>
      <button onclick="_moveViolationType(${i},1)"  title="아래로" aria-label="아래로 이동" style="width:28px;height:28px;border:none;border-radius:6px;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;font-size:13px;line-height:1;">↓</button>
      <button onclick="_deleteViolationType(${i})" title="삭제" aria-label="유형 삭제" style="width:28px;height:28px;border:none;border-radius:6px;background:var(--red-dim);color:var(--red);cursor:pointer;font-size:16px;font-weight:900;line-height:1;">×</button>
    </div>`).join('');
}

async function _addViolationType() {
  const input = document.getElementById('_violTypeInput');
  const val = (input?.value || '').trim();
  if (!val || val === '직접 입력') return;
  const editable = _violEditable();
  if (editable.includes(val)) { showSuccessToast('이미 있는 유형입니다'); return; }
  const next = [...editable, val];
  _violationTypes = [...next, '직접 입력'];
  input.value = '';
  _renderViolationTypeList(null);
  try { await API.saveViolationTypes(next); showSuccessToast('저장 완료'); }
  catch (e) { showSuccessToast('저장 실패: ' + e.message); }
}

async function _deleteViolationType(idx) {
  const editable = _violEditable();
  const removed = editable[idx];
  const next = editable.filter((_, i) => i !== idx);
  _violationTypes = [...next, '직접 입력'];
  _renderViolationTypeList(null);
  try { await API.saveViolationTypes(next); showSuccessToast(`"${removed}" 삭제됨`); }
  catch (e) { showSuccessToast('저장 실패: ' + e.message); }
}

async function _moveViolationType(idx, dir) {
  const editable = _violEditable();
  const next = idx + dir;
  if (next < 0 || next >= editable.length) return;
  const arr = [...editable];
  [arr[idx], arr[next]] = [arr[next], arr[idx]];
  _violationTypes = [...arr, '직접 입력'];
  _renderViolationTypeList(null);
  try { await API.saveViolationTypes(arr); }
  catch (e) { showSuccessToast('저장 실패: ' + e.message); }
}

function _renderHolidayList(sheet) {
  const list = sheet ? sheet.querySelector('#_holList') : document.getElementById('_holList');
  if (!list) return;
  if (!_holidays.length) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--ink-3);font-size:13px;font-weight:600;">설정된 공휴일이 없습니다.</div>';
    return;
  }
  const sorted = [..._holidays].sort((a,b)=>a.date>b.date?1:-1);
  list.innerHTML = sorted.map((h,i) => {
    const sess = [h.am?'오전':'', h.pm?'오후':''].filter(Boolean).join(' / ');
    const d = new Date(h.date), dn=['일','월','화','수','목','금','토'];
    const label = `${h.date} (${dn[d.getDay()]})`;
    return `<div style="display:flex;align-items:center;gap:10px;background:var(--surface);border-radius:var(--radius-sm);padding:11px 14px;box-shadow:var(--sh-sm);">
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:700;color:var(--ink);">${label}</div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:2px;">${sess}</div>
      </div>
      <button onclick="_removeHoliday('${h.date}')" style="padding:5px 12px;border-radius:var(--radius-pill);border:none;background:var(--red-dim);color:var(--red);font-family:var(--font);font-size:12px;font-weight:700;cursor:pointer;">삭제</button>
    </div>`;
  }).join('');
}

function _addHoliday() {
  const date = document.getElementById('_holDateInput').value;
  const am   = document.getElementById('_holAm').checked;
  const pm   = document.getElementById('_holPm').checked;
  if (!date) { Swal.fire('알림','날짜를 선택해 주세요.','warning'); return; }
  if (!am && !pm) { Swal.fire('알림','오전 또는 오후를 하나 이상 선택해 주세요.','warning'); return; }
  _holidays = _holidays.filter(h => h.date !== date);
  _holidays.push({ date, am, pm });
  _saveHolidays();
}

function _removeHoliday(date) {
  _holidays = _holidays.filter(h => h.date !== date);
  _saveHolidays();
}

function _saveHolidays() {
  showLoading('저장 중...');
  API.saveHolidays(_holidays)
    .then(() => {
      hideLoading();
      showSuccessToast('공휴일 설정 저장됨');
      const list = document.getElementById('_holList');
      if (list) _renderHolidayList(null);
      handleDateChange(true);
    })
    .catch(() => { hideLoading(); Swal.fire('오류','저장하지 못했습니다.','error'); });
}

function _devResetAttendance() {
  const date = document.getElementById('_resetDateInput')?.value;
  if (!date) { Swal.fire('알림','날짜를 선택해 주세요.','warning'); return; }
  showLoading('삭제될 기록 확인 중...');
  API.getAttendanceCountByDate(date)
    .then(count => {
      hideLoading();
      if (count === 0) { Swal.fire('알림', `${date}에는 삭제할 출석 기록이 없습니다.`, 'info'); return; }
      Swal.fire({
        title: `${date} 출석 기록 삭제`,
        html: `해당 날짜의 출석 기록 <b style="color:var(--red);">${count}건</b>이 영구 삭제됩니다.<br><span style="color:var(--red);font-weight:700;">되돌릴 수 없습니다.</span>`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: '삭제',
        cancelButtonText: '취소',
        customClass: { confirmButton: 'swal2-danger' },
      }).then(r => {
        if (!r.isConfirmed) return;
        showLoading('출석 기록 삭제 중...');
        API.resetAttendanceByDate(date)
          .then(() => {
            hideLoading();
            showSuccessToast('출석 기록 삭제됨', date);
            _cache.stats = null;
            if (loadedDate === date) loadStudents(false, true);
          })
          .catch(() => { hideLoading(); Swal.fire('오류','삭제하지 못했습니다.','error'); });
      });
    })
    .catch(() => { hideLoading(); Swal.fire('오류', '확인하지 못했습니다.', 'error'); });
}

