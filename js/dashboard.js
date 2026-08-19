// ════════════════════════════════════════
//  dashboard.js — 대시보드 탭(교사 전용) · 기간 결산
//  (app.js에서 분리됨)
// ════════════════════════════════════════

/* ════════════════════════════════
   대시보드 (교사 전용 — 오늘의 결석 현황 + 학생별 인사이트)
════════════════════════════════ */
let _dashMode = 'absent'; // 'absent' | 'all' — "결석자만"/"전체 명단" 세그먼트 상태

function _dashShiftDate(delta) {
  const input = document.getElementById('dashDateInput');
  const base = input.value ? new Date(input.value + 'T00:00:00') : new Date();
  base.setDate(base.getDate() + delta);
  input.value = _fmtYMD(base);
  loadDashboard();
}

function _switchDashMode(mode) {
  if (_dashMode === mode) return;
  _dashMode = mode;
  const absBtn = document.getElementById('dashMode-absent');
  const allBtn = document.getElementById('dashMode-all');
  if (absBtn) absBtn.classList.toggle('active', mode === 'absent');
  if (allBtn) allBtn.classList.toggle('active', mode === 'all');
  _moveDashModeSlider();
  loadDashboard();
}

function _moveDashModeSlider() {
  const bar = document.getElementById('dashModeBar');
  const ind = document.getElementById('dashModeIndicator');
  const active = bar && bar.querySelector('.sch-pill-item.active');
  if (!bar || !ind || !active) return;
  ind.style.width = active.offsetWidth + 'px';
  ind.style.transform = 'translateX(' + active.offsetLeft + 'px)';
}

let _dashReqToken = 0; // 날짜/모드를 빠르게 연속 전환할 때 오래된 응답이 최신 화면을 덮어쓰지 않도록 막는 토큰

function loadDashboard() {
  const dateInput = document.getElementById('dashDateInput');
  if (!dateInput.value) dateInput.value = _todayStr();
  const date = dateInput.value;
  const mode = _dashMode;
  const myToken = ++_dashReqToken;

  const summary = document.getElementById('dashSummary');
  const list = document.getElementById('dashAbsentList');
  summary.innerHTML = `<div class="cd-skeleton" style="height:40px;width:220px;margin:0 auto;border-radius:var(--radius-pill);"></div>`;
  list.innerHTML = Array.from({length:3}).map(() =>
    `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);padding:14px;margin-bottom:10px;">
      <div class="cd-skeleton" style="height:12px;width:30%;margin-bottom:10px;"></div>
      <div class="cd-skeleton" style="height:38px;width:100%;"></div>
    </div>`
  ).join('');

  const req = mode === 'all' ? API.getDayRoster(date) : API.getTodayAbsences(date);
  // 점등 표시는 모드(결석자만/전체 명단)와 무관하게 항상 전체 명단 기준으로 계산해야 하므로,
  // "전체 명단" 모드면 이미 하는 요청을 그대로 재사용하고 아니면 별도로 한 번 더 불러온다.
  // 실패해도 본문 렌더링은 그대로 진행되도록 조용히 null로 처리.
  const lightsReq = (mode === 'all' ? req : API.getDayRoster(date)).catch(() => null);
  Promise.all([req, lightsReq])
    .then(([data, roster]) => {
      if (myToken !== _dashReqToken) return; // 이 사이 더 최신 요청이 시작됐으면 이 결과는 버림
      mode === 'all' ? _renderDashboardAll(data, date) : _renderDashboard(data, date);
      _renderDashLights(roster, date);
    })
    .catch(() => {
      if (myToken !== _dashReqToken) return;
      summary.innerHTML = '';
      list.innerHTML = _emptyState('현황을 불러오지 못했습니다.');
    });
}

// 반별로 3칸(세션별) LED 점등 — 그 반의 그 세션 출석 저장이 됐으면 켜짐.
// "결석자만" 모드에서도 출석 여부만 판단하면 되므로 결석 여부는 보지 않는다.
function _groupShortLabel(g) {
  if (g === '청운반') return '청운';
  const m = g.match(/백운 (.)반/);
  return m ? m[1] : g;
}
function _renderDashLights(roster, date) {
  const el = document.getElementById('dashLights');
  if (!el) return;
  const sessions = _computeSessionOptions(date);
  if (!roster || !sessions.length) { el.innerHTML = ''; return; }

  // 그날 명단(roster)에 실제로 학생이 있는 반만 — 학생 없는 반은 표시 자체를 만들지 않는다.
  const presentGroups = GROUPS.filter(g => roster.some(s => s.group === g));
  if (!presentGroups.length) { el.innerHTML = ''; return; }

  const shortLabels = sessions.map(o => o.text.replace(' 자율학습','').replace(/\(토\)/,''));
  const lit = {};
  presentGroups.forEach(g => { lit[g] = sessions.map(() => false); });
  roster.forEach(s => {
    if (!lit[s.group]) return;
    s.sessions.forEach(sess => {
      const idx = sessions.findIndex(o => o.text === sess.session);
      if (idx >= 0) lit[s.group][idx] = true;
    });
  });

  const groups = presentGroups.map(g => `
    <div class="dash-lights-grp" title="${_esc(g)}">
      <span class="dash-lights-label">${_groupShortLabel(g)}</span>
      ${lit[g].map((on, i) => `<span class="dash-light${on ? ' on' : ''}" title="${_esc(shortLabels[i])}"></span>`).join('')}
    </div>`).join('');
  el.innerHTML = `<div class="dash-lights">${groups}</div>`;
}

// 결석 세션 태그 하나 — "전체 명단" 모드에서는 출석 세션도 함께 표시해야 해서
// 결석 전용이던 기존 로직에 출석 분기를 추가해 공용 헬퍼로 뺐다.
function _dashSessTag(sess) {
  const short = sess.session.replace(' 자율학습','').replace(/\(토\)/,'');
  if (sess.status !== '결석') {
    return `<span class="sch-dr-s" style="background:var(--green-dim);color:var(--green);">${short} 출석</span>`;
  }
  const label = sess.reason ? `${short} · ${_esc(sess.reason)}` : short;
  const bg = sess.noCount ? 'var(--green-dim)' : 'var(--red-dim)';
  const fg = sess.noCount ? 'var(--green)'      : 'var(--red)';
  return `<span class="sch-dr-s" style="background:${bg};color:${fg};">${label}${sess.noCount ? ' (노카운트)' : ''}</span>`;
}

function _dashStudentRowHtml(s, badgeBg, badgeFg) {
  const tags = s.sessions.length
    ? s.sessions.map(_dashSessTag).join('')
    : `<span class="sch-dr-s" style="background:var(--bg-deep);color:var(--ink-4);">기록 없음</span>`;
  return `<div class="_dash-student" data-sid="${s.id}" style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--bg-deep);cursor:pointer;">
    <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:${badgeBg};color:${badgeFg};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;">${s.ban}-${s.num}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:14px;font-weight:700;color:var(--ink);">${_esc(s.name)}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">${tags}</div>
    </div>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
  </div>`;
}

function _bindDashRows(list) {
  list.querySelectorAll('._dash-student').forEach((el, i) => {
    el.style.animationDelay = (i * 20) + 'ms';
    el.addEventListener('click', () => {
      const s = (window._dashRoster || []).find(a => a.id === el.dataset.sid);
      if (s) _openStudentInsightSheet(s);
    });
  });
}

function _renderDashboard(absences, date) {
  const summary = document.getElementById('dashSummary');
  const list = document.getElementById('dashAbsentList');
  const d = new Date(date), dn = ['일','월','화','수','목','금','토'];
  const dl = `${d.getMonth()+1}월 ${d.getDate()}일 (${dn[d.getDay()]})`;

  summary.innerHTML = `<div style="text-align:center;">
    <span style="display:inline-flex;align-items:center;gap:8px;background:var(--surface);box-shadow:var(--sh-md);border-radius:var(--radius-pill);padding:10px 22px;font-size:13px;font-weight:700;color:var(--ink-2);">
      ${dl} 결석 <span style="color:var(--red);font-weight:800;font-size:15px;">${absences.length}명</span>
    </span>
  </div>`;

  if (!absences.length) {
    list.innerHTML = _emptyState('결석자가 없습니다. 🎉');
    return;
  }

  window._dashRoster = absences;
  const html = GROUPS.map(g => {
    const gs = absences.filter(a => a.group === g)
      .sort((a,b) => parseInt(a.ban)-parseInt(b.ban) || parseInt(a.num)-parseInt(b.num));
    if (!gs.length) return '';
    const rows = gs.map(s => _dashStudentRowHtml(s, 'var(--red-dim)', 'var(--red)')).join('');
    return `<div class="roster-section-head"><span class="roster-section-title">${g}</span><span class="roster-section-count">${gs.length}명</span><div class="roster-section-line"></div></div>
      <div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);overflow:hidden;margin-bottom:16px;">${rows}</div>`;
  }).join('');

  list.innerHTML = html;
  _bindDashRows(list);
}

function _renderDashboardAll(roster, date) {
  const summary = document.getElementById('dashSummary');
  const list = document.getElementById('dashAbsentList');
  const d = new Date(date), dn = ['일','월','화','수','목','금','토'];
  const dl = `${d.getMonth()+1}월 ${d.getDate()}일 (${dn[d.getDay()]})`;
  // "결석자만" 모드는 노카운트 여부와 무관하게 결석 기록이 있으면 포함하므로,
  // 두 모드의 결석 인원수가 서로 다르게 보이지 않도록 동일한 기준을 쓴다.
  const isAbsent = s => s.sessions.some(x => x.status === '결석');
  const absentCount = roster.filter(isAbsent).length;

  summary.innerHTML = `<div style="text-align:center;">
    <span style="display:inline-flex;align-items:center;gap:8px;background:var(--surface);box-shadow:var(--sh-md);border-radius:var(--radius-pill);padding:10px 22px;font-size:13px;font-weight:700;color:var(--ink-2);">
      ${dl} 전체 <span style="color:var(--blue);font-weight:800;font-size:15px;">${roster.length}명</span>
      <span style="width:1px;height:12px;background:var(--bg-deep);"></span>
      결석 <span style="color:var(--red);font-weight:800;font-size:15px;">${absentCount}명</span>
    </span>
  </div>`;

  if (!roster.length) {
    list.innerHTML = _emptyState('명단이 없습니다.');
    return;
  }

  window._dashRoster = roster;
  const html = GROUPS.map(g => {
    const gs = roster.filter(s => s.group === g)
      .sort((a,b) => parseInt(a.ban)-parseInt(b.ban) || parseInt(a.num)-parseInt(b.num));
    if (!gs.length) return '';
    const rows = gs.map(s => isAbsent(s)
      ? _dashStudentRowHtml(s, 'var(--red-dim)', 'var(--red)')
      : _dashStudentRowHtml(s, 'var(--blue-dim)', 'var(--blue)')
    ).join('');
    return `<div class="roster-section-head"><span class="roster-section-title">${g}</span><span class="roster-section-count">${gs.length}명</span><div class="roster-section-line"></div></div>
      <div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);overflow:hidden;margin-bottom:16px;">${rows}</div>`;
  }).join('');

  list.innerHTML = html;
  _bindDashRows(list);
}

function _openStudentInsightSheet(student) {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '2200';
  const sheet = document.createElement('div');
  sheet.className = 'vh-sheet';
  sheet.innerHTML = `
    <div class="vh-header">
      <div class="vh-handle"></div>
      <div class="vh-title-row">
        <div class="vh-student-info">
          <div class="vh-name">${_esc(student.name)}</div>
          <div class="vh-meta">${student.ban}반 ${student.num}번 · ${_esc(student.group)}</div>
        </div>
        <button class="vh-close-btn" id="_diClose" aria-label="닫기">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="vh-body" id="_diBody">
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${Array.from({length:3}).map(() => `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);padding:14px;"><div class="cd-skeleton" style="height:14px;width:55%;margin-bottom:8px;"></div><div class="cd-skeleton" style="height:10px;width:35%;"></div></div>`).join('')}
      </div>
    </div>`;
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_diClose').addEventListener('click', close);

  // API 응답이 너무 빨리(수십~백여ms) 오면 스켈레톤이 찰나만 번쩍이고
  // 사라져서 오히려 어색해 보임 — 스켈레톤이 최소한 이만큼은 눈에 보이도록
  // 붙잡아둔다. 응답이 이미 이 시간보다 오래 걸렸으면 추가 지연은 없음.
  const MIN_SKELETON_MS = 260;
  const _t0 = Date.now();
  API.getStudentInsight(student.id)
    .then(insight => {
      const wait = Math.max(0, MIN_SKELETON_MS - (Date.now() - _t0));
      setTimeout(() => _renderStudentInsightBody(sheet.querySelector('#_diBody'), insight), wait);
    })
    .catch(() => { sheet.querySelector('#_diBody').innerHTML = _emptyState('정보를 불러오지 못했습니다.'); });
}

function _renderStudentInsightBody(body, ins) {
  const rateColor = ins.attendRate === null ? 'var(--ink-4)'
    : ins.attendRate >= 90 ? 'var(--green)' : ins.attendRate >= 70 ? 'var(--amber)' : 'var(--red)';

  // 연속 출석/결석은 동시에 3 이상일 수 없으므로(둘 다 _dailyAbsentFlags의
  // 같은 마지막 구간을 바라봄) 서로 배타적으로 뜬다 — 긍정적인 쪽을 먼저 배치.
  const streakGood = ins.consecutivePresentStreak >= 3
    ? `<div style="display:flex;align-items:center;gap:10px;background:var(--green-dim);border-radius:var(--radius);padding:12px 14px;margin-bottom:14px;">
        <span style="font-size:18px;line-height:1;flex-shrink:0;">🔥</span>
        <div style="font-size:13px;font-weight:700;color:var(--green);">${ins.consecutivePresentStreak}일 연속 출석 중이에요</div>
      </div>` : '';

  const streakWarning = ins.consecutiveAbsentStreak >= 3
    ? `<div style="display:flex;align-items:center;gap:10px;background:var(--red-dim);border-radius:var(--radius);padding:12px 14px;margin-bottom:14px;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--red)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div style="font-size:13px;font-weight:700;color:var(--red);">최근 ${ins.consecutiveAbsentStreak}일 연속 결석 중이에요</div>
      </div>` : '';

  const stats = [
    { n: ins.attendRate === null ? '—' : ins.attendRate + '%', l: '출석률',     c: rateColor },
    { n: ins.countedAbsent,                                     l: '실질 결석', c: 'var(--red)' },
    { n: ins.lateCount,                                         l: '지각',      c: 'var(--amber)' },
    { n: ins.earlyCount,                                        l: '조퇴',      c: 'var(--blue)' },
    { n: ins.noCountAbsent,                                     l: '노카운트',  c: 'var(--green)' },
    { n: ins.violationCount,                                    l: '위반',      c: 'var(--purple)' },
  ];
  const statsHtml = `<div class="vh-money-bar" style="margin-bottom:14px;">
    ${stats.map(s => `<div class="vh-money-card"><div class="vh-money-n" style="color:${s.c}">${s.n}</div><div class="vh-money-l">${s.l}</div></div>`).join('')}
  </div>`;

  const fineWarning = ins.fineUnpaid > 0
    ? `<div style="display:flex;align-items:center;gap:8px;background:var(--amber-dim);border-radius:var(--radius-sm);padding:9px 12px;margin-bottom:16px;font-size:12px;font-weight:700;color:var(--amber);">💰 미납 벌금 ${ins.fineUnpaid.toLocaleString()}원</div>` : '';

  const reasonEntries = Object.entries(ins.reasonCounts);
  const reasonHtml = reasonEntries.length
    ? `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:18px;">
        ${reasonEntries.map(([reason, count]) => `<div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-deep);border-radius:var(--radius-sm);padding:9px 12px;">
          <span style="font-size:13px;color:var(--ink-2);font-weight:600;">${_esc(reason)}</span>
          <span style="font-size:13px;font-weight:800;color:var(--ink);">${count}회</span>
        </div>`).join('')}
      </div>`
    : '';

  const ss = s => s.replace(' 자율학습','');
  // 같은 날짜에 여러 세션(예: 일괄 적용으로 야간+심야)이 결석이어도 날짜
  // 카드를 두 번 반복하지 않고, 그 날의 세션들을 태그로 모아 카드 하나로.
  const recentHtml = ins.recentAbsences.length
    ? ins.recentAbsences.map(a => {
        const tags = a.sessions.map(sess => {
          const label = sess.reason ? `${ss(sess.session)} · ${_esc(sess.reason)}` : ss(sess.session);
          const cls   = sess.noCount ? '' : 'is-etc';
          const style = sess.noCount ? 'background:var(--green-dim);color:var(--green);' : '';
          return `<span class="vh-item-action ${cls}" style="${style}">${label}${sess.noCount ? ' (노카운트)' : ''}</span>`;
        }).join('');
        return `<div class="vh-item"><div class="vh-item-head" style="align-items:flex-start;"><div class="vh-type-dot" style="background:var(--amber);"></div><div class="vh-item-main"><div class="vh-item-type">${a.date}</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">${tags}</div></div></div></div>`;
      }).join('')
    : _emptyState('결석 기록이 없습니다.');

  body.innerHTML = `
    ${streakGood}
    ${streakWarning}
    ${statsHtml}
    ${fineWarning}
    ${reasonEntries.length ? `<div style="font-size:12px;font-weight:700;color:var(--ink-3);margin-bottom:8px;">사유별 결석</div>${reasonHtml}` : ''}
    <div style="font-size:12px;font-weight:700;color:var(--ink-3);margin-bottom:8px;">최근 결석 이력</div>
    ${recentHtml}`;
}

/* ════════════════════════════════
   기간 결산 — 대시보드 📊 버튼
   지정한 기간의 출석률·결석 횟수·최대 연속 출석(기간/학기 전체)을
   자습반별로 모아 보여주고, 카톡 공지용 텍스트로 복사할 수 있게 함.
════════════════════════════════ */

// 학기 시작일(MM-DD)을 올해 또는 작년 기준 실제 날짜(YYYY-MM-DD)로 환산.
// 1/2월처럼 "작년 9월에 시작한 2학기가 이어지는 중"인 경우까지 처리.
function _currentSemesterStartDate() {
  const cfg = _semesterConfig || _SEMESTER_DEFAULT;
  const now = new Date();
  const mmdd = _mmdd(now);
  const year = now.getFullYear();
  if (mmdd >= cfg.s1 && mmdd < cfg.s2) return `${year}-${cfg.s1}`;
  if (mmdd >= cfg.s2) return `${year}-${cfg.s2}`;
  return `${year - 1}-${cfg.s2}`;
}

function _mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=일 ... 6=토
  const diff = day === 0 ? -6 : 1 - day; // 월요일로 이동
  d.setDate(d.getDate() + diff);
  return d;
}

function openPeriodSummarySheet() {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3100';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'max-height:90dvh;display:flex;flex-direction:column;padding-bottom:20px;';

  const today = _todayStr();
  const weekStart  = _fmtYMD(_mondayOf(new Date()));
  const monthStart = (() => { const d = new Date(); d.setDate(1); return _fmtYMD(d); })();

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div style="font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">기간 결산</div>
      <button id="_psClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div style="display:flex;gap:6px;align-items:center;margin-bottom:8px;">
      <input type="date" id="_psStart" class="cd-input" style="flex:1;min-width:0;" value="${monthStart}">
      <span style="color:var(--ink-4);font-size:12px;flex-shrink:0;">~</span>
      <input type="date" id="_psEnd" class="cd-input" style="flex:1;min-width:0;" value="${today}">
    </div>
    <div class="ssf-chips" style="margin-bottom:8px;">
      <button class="ssf-chip" id="_psPresetWeek">이번 주</button>
      <button class="ssf-chip on" id="_psPresetMonth">이번 달</button>
      <button class="ssf-chip" id="_psPresetSemester">학기 전체</button>
    </div>
    <div style="position:relative;margin-bottom:14px;">
      <input type="text" id="_psSearch" class="cd-input" placeholder="학생 이름 검색" style="width:100%;box-sizing:border-box;padding-right:32px;">
      <span class="clear-input-btn" id="_psSearchClear" role="button" tabindex="0" aria-label="검색어 지우기" style="display:none;">&times;</span>
    </div>
    <div id="_psSummary" style="text-align:center;margin-bottom:14px;"></div>
    <div id="_psList" style="overflow-y:auto;flex:1;transition:opacity var(--dur-fast) var(--ease);">
      ${Array.from({length:3}).map(() => `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);padding:14px;margin-bottom:10px;"><div class="cd-skeleton" style="height:12px;width:30%;margin-bottom:10px;"></div><div class="cd-skeleton" style="height:38px;width:100%;"></div></div>`).join('')}
    </div>
    <div style="font-size:11px;font-weight:700;color:var(--ink-3);margin:14px 0 6px;flex-shrink:0;">표시·전달 항목 — 체크한 항목만 위 목록과 복사 텍스트에 보여요</div>
    <div id="_psFields" style="display:flex;flex-wrap:wrap;gap:6px;flex-shrink:0;transition:opacity var(--dur-fast) var(--ease);"></div>
    <button class="vh-add-btn is-green" id="_psCopy" style="margin:12px 0 0;flex-shrink:0;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></svg>
      텍스트 미리보기
    </button>`;
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_psClose').addEventListener('click', close);

  let summary = [];
  const startInput  = sheet.querySelector('#_psStart');
  const endInput    = sheet.querySelector('#_psEnd');
  const listEl       = sheet.querySelector('#_psList');
  const summaryEl    = sheet.querySelector('#_psSummary');
  const searchInput = sheet.querySelector('#_psSearch');
  const searchClear = sheet.querySelector('#_psSearchClear');

  // 학생용/교사용을 모드로 나누지 않고 체크박스 하나로 통일 — 대시보드에서
  // 볼 항목도, 학생에게 전달할 항목도 그때그때 체크박스만 바꾸면 된다.
  const fieldsEl = sheet.querySelector('#_psFields');
  const getCheckedFields = () => [...fieldsEl.querySelectorAll('input:checked')].map(el => el.dataset.field);

  // 체크박스를 켜고 끌 때마다 팝업에 뜬 학생 목록의 뱃지가 그 자리에서
  // 바로 바뀌도록 — 예전엔 텍스트 복사 버튼을 눌러야만 반영 여부를 알 수
  // 있었음. 살짝 페이드를 줘서 뱃지가 우르르 바뀌는 게 딱딱하지 않게 한다.
  const rerenderList = () => {
    if (!summary.length) return;
    listEl.style.opacity = '0';
    setTimeout(() => {
      _renderPeriodSummary(summaryEl, listEl, summary, startInput.value, endInput.value, searchInput.value.trim(), getCheckedFields());
      listEl.style.opacity = '1';
    }, 120);
  };

  fieldsEl.innerHTML = PERIOD_SUMMARY_FIELDS.map(f => `<label style="display:flex;align-items:center;gap:5px;background:var(--bg-deep);border-radius:var(--radius-pill);padding:6px 12px;font-size:12px;font-weight:600;color:var(--ink-2);cursor:pointer;">
    <input type="checkbox" data-field="${f.key}" ${f.sensitive ? '' : 'checked'} style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer;">${f.label}
  </label>`).join('');
  fieldsEl.querySelectorAll('input[type=checkbox]').forEach(cb => cb.addEventListener('change', rerenderList));

  const runQuery = () => {
    let start = startInput.value, end = endInput.value;
    if (!start || !end) return;
    // 시작일을 종료일보다 늦게 잡으면 필터에 걸리는 날짜가 하나도 없어서
    // 조용히 빈 결과만 뜨고 왜 그런지 알 수 없었음 — 자동으로 바꿔주고 안내.
    if (start > end) {
      [start, end] = [end, start];
      startInput.value = start; endInput.value = end;
      showSuccessToast('시작일이 종료일보다 늦어 순서를 바꿨어요');
    }
    listEl.innerHTML = Array.from({length:3}).map(() => `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);padding:14px;margin-bottom:10px;"><div class="cd-skeleton" style="height:12px;width:30%;margin-bottom:10px;"></div><div class="cd-skeleton" style="height:38px;width:100%;"></div></div>`).join('');
    summaryEl.innerHTML = `<div class="cd-skeleton" style="height:34px;width:200px;margin:0 auto;border-radius:var(--radius-pill);"></div>`;
    API.getPeriodSummary(start, end)
      .then(data => {
        summary = data || [];
        _renderPeriodSummary(summaryEl, listEl, summary, start, end, searchInput.value.trim(), getCheckedFields());
      })
      .catch(() => { listEl.innerHTML = _emptyState('결산을 불러오지 못했습니다.'); summaryEl.innerHTML = ''; });
  };

  // 검색은 재조회 없이 이미 받아온 summary를 그 자리에서 다시 필터링만 함.
  // 텍스트 복사는 검색과 무관하게 항상 전체를 대상으로 하도록 유지
  // (검색 중인 걸 깜빡하고 복사하면 몇 명 빠진 채로 공지가 나갈 위험 방지).
  searchInput.addEventListener('input', () => {
    searchClear.style.display = searchInput.value ? '' : 'none';
    if (!summary.length) return;
    _renderPeriodSummary(summaryEl, listEl, summary, startInput.value, endInput.value, searchInput.value.trim(), getCheckedFields());
  });
  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  });

  const chips = {
    week:     sheet.querySelector('#_psPresetWeek'),
    month:    sheet.querySelector('#_psPresetMonth'),
    semester: sheet.querySelector('#_psPresetSemester'),
  };
  const setActiveChip = key => Object.entries(chips).forEach(([k, el]) => el.classList.toggle('on', k === key));

  startInput.addEventListener('change', runQuery);
  endInput.addEventListener('change', runQuery);
  chips.week.addEventListener('click', () => {
    setActiveChip('week');
    startInput.value = weekStart; endInput.value = today; runQuery();
  });
  chips.month.addEventListener('click', () => {
    setActiveChip('month');
    startInput.value = monthStart; endInput.value = today; runQuery();
  });
  chips.semester.addEventListener('click', () => {
    setActiveChip('semester');
    startInput.value = _currentSemesterStartDate(); endInput.value = today; runQuery();
  });
  sheet.querySelector('#_psCopy').addEventListener('click', () => {
    if (!summary.length) { showSuccessToast('미리볼 내용이 없습니다'); return; }
    const text = _buildPeriodSummaryText(summary, startInput.value, endInput.value, getCheckedFields());
    _openTextPreviewSheet(text, '기간 결산 미리보기');
  });

  runQuery();
}

function _renderPeriodSummary(summaryEl, listEl, summary, start, end, searchQuery, checkedFields) {
  // checkedFields 없이 호출되는 기존 코드 경로 보호용 기본값 — 없으면
  // 예전처럼 출석률/결석/최대연속자습 3개만 보여준다.
  const keys = checkedFields || ['rate', 'period', 'streak'];
  const activeFieldDefs = PERIOD_SUMMARY_FIELDS.filter(f => keys.includes(f.key));
  const active = summary.filter(s => s.attendRate !== null); // 기록이 있는 학생만 결산 대상으로 카운트
  const avgRate = active.length
    ? Math.round(active.reduce((sum, s) => sum + s.attendRate, 0) / active.length)
    : null;
  // 평균 출석률 요약은 검색 여부와 무관하게 항상 전체 기준 유지 — 검색은
  // 순수 "찾기" 보조 기능이라 결산 요약치 자체를 바꾸면 혼동될 수 있음.
  summaryEl.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;background:var(--surface);box-shadow:var(--sh-md);border-radius:var(--radius-pill);padding:10px 22px;font-size:13px;font-weight:700;color:var(--ink-2);">
    ${_fmtDateShort(start)} ~ ${_fmtDateShort(end)} · 평균 출석률 <span style="color:var(--blue);font-weight:800;">${avgRate===null?'—':avgRate+'%'}</span>
  </span>`;

  const visible = searchQuery ? active.filter(s => s.name.includes(searchQuery)) : active;
  if (!visible.length) {
    listEl.innerHTML = _emptyState(searchQuery ? '검색 결과가 없습니다.' : '해당 기간에 기록이 없습니다.');
    return;
  }
  const html = GROUPS.map(g => {
    const gs = visible.filter(s => s.group === g);
    if (!gs.length) return '';
    const rows = gs.map(s => {
      const tags = activeFieldDefs.map(f => f.tag(s)).join('');
      return `<div class="_ps-row" data-sid="${s.id}" style="display:flex;align-items:center;gap:10px;padding:11px 14px;border-bottom:1px solid var(--bg-deep);cursor:pointer;">
        <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--blue-dim);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;">${s.ban}-${s.num}</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:700;color:var(--ink);">${_esc(s.name)}</div>
          <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">${tags}</div>
        </div>
      </div>`;
    }).join('');
    return `<div class="roster-section-head"><span class="roster-section-title">${g}</span><span class="roster-section-count">${gs.length}명</span><div class="roster-section-line"></div></div>
      <div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);overflow:hidden;margin-bottom:16px;">${rows}</div>`;
  }).join('');
  listEl.innerHTML = html;
  listEl.querySelectorAll('._ps-row').forEach(el => {
    el.addEventListener('click', () => {
      const s = active.find(x => x.id === el.dataset.sid);
      if (s) _openStudentInsightSheet(s);
    });
  });
}

function _fmtDateShort(dateStr) {
  const [, m, d] = dateStr.split('-');
  return `${+m}/${+d}`;
}

// 기간 결산 텍스트 복사 + 팝업 목록 태그 둘 다에 쓰이는 항목 정의.
// get(s): 카톡 복사 텍스트용 한 줄 문구(숨길 항목은 null 반환). tag(s):
// 팝업 목록에 뜨는 색깔 있는 뱃지 HTML(숨길 항목은 빈 문자열) — 체크박스로
// 고른 항목이 실시간으로 그대로 화면 목록에도 반영되도록, 텍스트 복사와
// 화면 표시가 이 정의 하나를 같이 참조한다(따로 관리하면 서로 어긋날
// 위험이 있어 하나로 묶음). 학생용/교사용을 따로 나누지 않고 하나로 통일 —
// 대시보드에서 볼 항목과 학생에게 전달할 항목은 어차피 체크박스로 그때그때
// 고르면 되므로 모드를 나눌 필요가 없다.
const PERIOD_SUMMARY_FIELDS = [
  { key:'rate', label:'출석률', get: s => `출석률 ${s.attendRate}%`,
    tag: s => { const c=s.attendRate>=90?'var(--green)':s.attendRate>=70?'var(--amber)':'var(--red)'; const d=s.attendRate>=90?'var(--green-dim)':s.attendRate>=70?'var(--amber-dim)':'var(--red-dim)'; return `<span class="sch-dr-s" style="background:${d};color:${c};">출석률 ${s.attendRate}%</span>`; } },
  { key:'hours', label:'누적 자습 시간', get: s => `누적 자습 시간 ${s.totalStudyHours.toFixed(1)}시간`,
    tag: s => `<span class="sch-dr-s" style="background:var(--blue-dim);color:var(--blue);">누적 자습 시간 ${s.totalStudyHours.toFixed(1)}시간</span>` },
  { key:'total', label:'누적 결석', get: s => `누적결석 ${s.totalAbsentCount}회`,
    tag: s => `<span class="sch-dr-s" style="background:var(--red-dim);color:var(--red);">누적결석 ${s.totalAbsentCount}회</span>` },
  { key:'period', label:'기간 중 결석', get: s => `기간중결석 ${s.absentCount}회`,
    tag: s => `<span class="sch-dr-s" style="background:var(--red-dim);color:var(--red);">기간중결석 ${s.absentCount}회</span>` },
  { key:'streak', label:'최대 연속 자습', get: s => `최대 연속 자습 ${s.periodMaxStreak}일`,
    tag: s => `<span class="sch-dr-s" style="background:var(--green-dim);color:var(--green);">최대 연속 자습 ${s.periodMaxStreak}일</span>` },
  { key:'late', label:'기간 중 지각', get: s => `지각 ${s.lateCount}회`,
    tag: s => `<span class="sch-dr-s" style="background:var(--amber-dim);color:var(--amber);">지각 ${s.lateCount}회</span>` },
  // 미납 벌금 0원이면 딱히 알릴 게 없는 상태라 태그/문구 자체를 숨긴다.
  // 벌금·위반은 매달 학생 동기부여 공지에 무심코 그대로 나가면 안 되는
  // 민감 정보라 sensitive:true — 체크박스 기본값이 꺼진 채로 시작한다.
  { key:'fine', label:'미납 벌금', sensitive:true, get: s => s.fineUnpaid > 0 ? `미납 벌금 ${s.fineUnpaid.toLocaleString()}원` : null,
    tag: s => s.fineUnpaid > 0 ? `<span class="sch-dr-s" style="background:var(--red-dim);color:var(--red);">미납 벌금 ${s.fineUnpaid.toLocaleString()}원</span>` : '' },
  { key:'early', label:'기간 중 조퇴', get: s => `조퇴 ${s.earlyCount}회`,
    tag: s => `<span class="sch-dr-s" style="background:var(--amber-dim);color:var(--amber);">조퇴 ${s.earlyCount}회</span>` },
  { key:'viol', label:'누적 위반', sensitive:true, get: s => `위반 ${s.violationCount}회`,
    tag: s => `<span class="sch-dr-s" style="background:var(--purple-dim);color:var(--purple);">위반 ${s.violationCount}회</span>` },
];

// 반별로 묶어서 카톡 공지에 바로 붙여넣기 좋은 형태의 텍스트로 변환.
// 매달 학생 동기부여용 공지로 쓸 걸 염두에 두고, 반 안에서는 명단 순서가
// 아니라 (최대연속 → 출석률) 성과 순으로 정렬하고 상위 3명은 메달을 붙여
// 잘한 학생이 먼저 보이도록 한다(통계 탭 Top3와 같은 결의 표현).
// fields: 체크박스에서 고른 필드 key 배열 — 굳이 안 보여주고 싶은 항목은
// 빼고 복사 가능.
const _MEDALS = ['🥇','🥈','🥉'];
function _buildPeriodSummaryText(summary, start, end, fields) {
  const active = summary.filter(s => s.attendRate !== null);
  const activeFields = PERIOD_SUMMARY_FIELDS.filter(f => fields.includes(f.key));
  let text = `📊 기간 결산 (${_fmtDateShort(start)}~${_fmtDateShort(end)})\n`;
  GROUPS.forEach(g => {
    const gs = active.filter(s => s.group === g)
      .sort((a, b) => b.periodMaxStreak - a.periodMaxStreak || b.attendRate - a.attendRate);
    if (!gs.length) return;
    text += `\n[${g}]\n`;
    gs.forEach((s, i) => {
      const medal = _MEDALS[i] ? `${_MEDALS[i]} ` : '';
      const parts = activeFields.map(f => f.get(s)).filter(Boolean); // null(숨김 항목) 제외
      const suffix = parts.length ? ` - ${parts.join(' · ')}` : '';
      text += `${medal}· ${s.name}${suffix}\n`;
    });
  });
  return text.trim();
}

// 클립보드에 바로 복사하지 않고, 실제로 뭐가 복사될지 먼저 눈으로 확인할 수
// 있게 미리보기를 보여주는 스택 시트. 기간 결산 외에 다른 텍스트 복사
// 기능에서도 재사용할 수 있도록 일반화해서 분리했다.
function _openTextPreviewSheet(text, title) {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3200';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'max-height:80dvh;display:flex;flex-direction:column;padding-bottom:20px;';
  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div style="font-size:15px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">${_esc(title || '미리보기')}</div>
      <button id="_tpvClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <textarea id="_tpvText" readonly style="flex:1;min-height:220px;resize:none;border:1px solid var(--bg-deep);border-radius:var(--radius);padding:12px;font-size:13px;line-height:1.65;color:var(--ink-2);background:var(--bg);font-family:inherit;">${_esc(text)}</textarea>
    <button class="vh-add-btn is-green" id="_tpvCopy" style="margin:14px 0 0;flex-shrink:0;">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      클립보드에 복사
    </button>`;
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_tpvClose').addEventListener('click', close);
  sheet.querySelector('#_tpvCopy').addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => { showSuccessToast('클립보드에 복사됐어요'); close(); });
  });
}

