// ════════════════════════════════════════
//  roster.js — 명단 탭
//  (app.js에서 분리됨)
// ════════════════════════════════════════

/* ════════════════════════════════
   명단 탭
════════════════════════════════ */
function loadRoster() {
  if (_rosterLoaded) { renderRoster(); return; }
  const container = document.getElementById('rosterContainer');
  container.innerHTML = `<div class="roster-grid">${Array.from({length:12}).map(()=>`
    <div class="skeleton-student-card" style="text-align:center;padding:12px 10px;">
      <div class="cd-skeleton" style="height:10px;width:55%;margin:0 auto 8px;"></div>
      <div class="cd-skeleton" style="height:18px;width:70%;margin:0 auto;"></div>
    </div>`).join('')}</div>`;

  showLoading('명단 불러오는 중...');
  API.getAllMemberList()
    .then(data => {
      hideLoading();
      _rosterData   = data || [];
      _rosterLoaded = true;
      renderRoster();
    })
    .catch(() => {
      hideLoading();
      container.innerHTML = '<div class="text-center py-5" style="color:var(--red);font-weight:600;">명단을 불러오지 못했습니다.</div>';
    });
}

function renderRoster() {
  _renderRosterPills();
  _renderRosterCards();
}

function _renderRosterPills() {
  const wrap = document.getElementById('rosterPillWrap');
  const labels = ['전체', ..._activeGroups()];
  wrap.innerHTML = '<div class="roster-pill-slider" id="rosterPillSlider"></div>' +
    labels.map((lbl, i) => `<button class="roster-pill${i===_rosterActivePill?' active':''}" onclick="selectRosterPill(${i})">${lbl}</button>`).join('');
  _updatePillFade('rosterPillWrap');
  const slider = document.getElementById('rosterPillSlider');
  if (slider) slider.style.transition = 'none';
  setTimeout(() => {
    const ab = wrap.querySelector('.roster-pill.active');
    _moveRosterPillSlider(ab);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const s = document.getElementById('rosterPillSlider'); if (s) s.style.transition = '';
    }));
  }, 0);
}

function _moveRosterPillSlider(activeBtn) {
  const wrap   = document.getElementById('rosterPillWrap');
  const slider = document.getElementById('rosterPillSlider');
  if (!slider||!activeBtn||!wrap) return;
  slider.style.width     = activeBtn.offsetWidth + 'px';
  slider.style.transform = 'translateX(' + activeBtn.offsetLeft + 'px)';
}

function selectRosterPill(idx) {
  _rosterActivePill = idx;
  const wrap = document.getElementById('rosterPillWrap');
  if (wrap) {
    wrap.querySelectorAll('.roster-pill').forEach((b,i) => b.classList.toggle('active', i===idx));
    const ab = wrap.querySelectorAll('.roster-pill')[idx];
    requestAnimationFrame(() => _moveRosterPillSlider(ab));
  }
  _renderRosterCards();
}

function filterRosterByName(val) {
  _rosterSearchQuery = val.trim();
  _updateSearchClear('rosterSearchInput', 'rosterSearchClear');
  _renderRosterCards();
}

function _renderRosterCards() {
  const container = document.getElementById('rosterContainer');
  const activeGroups = _activeGroups();
  let filtered = _rosterActivePill === 0
    ? _rosterData
    : _rosterData.filter(s => s.group === activeGroups[_rosterActivePill - 1]);
  if (_rosterSearchQuery) filtered = filtered.filter(s => s.name.includes(_rosterSearchQuery));

  if (!filtered.length) {
    container.innerHTML = _emptyState(_rosterSearchQuery ? '검색 결과가 없습니다.' : '명단이 없습니다.');
    return;
  }

  let html = `<div style="text-align:center;margin-bottom:14px;">
    <span style="display:inline-flex;align-items:center;gap:7px;background:var(--surface);box-shadow:var(--sh-md);border-radius:var(--radius-pill);padding:9px 20px;font-size:13px;font-weight:700;color:var(--ink-2);">
      총 인원 <span style="color:var(--blue);font-weight:800;">${filtered.length}명</span>
    </span>
  </div>`;
  if (_rosterActivePill === 0) {
    activeGroups.forEach(g => {
      const gs = filtered.filter(s => s.group === g);
      if (!gs.length) return;
      html += `<div class="roster-section-head"><span class="roster-section-title">${g}</span><span class="roster-section-count">${gs.length}명</span><div class="roster-section-line"></div></div>`;
      html += `<div class="roster-grid">` + gs.map(s => _rosterCardHtml(s)).join('') + `</div>`;
    });
  } else {
    const bans = [...new Set(filtered.map(s => s.ban))].sort((a,b) => parseInt(a)-parseInt(b));
    bans.forEach(ban => {
      const bs = filtered.filter(s => s.ban === ban);
      html += `<div class="roster-section-head"><span class="roster-section-title">${ban}반</span><span class="roster-section-count">${bs.length}명</span><div class="roster-section-line"></div></div>`;
      html += `<div class="roster-grid">` + bs.map(s => _rosterCardHtml(s)).join('') + `</div>`;
    });
  }

  container.innerHTML = html;
  container.querySelectorAll('.roster-card').forEach((card, i) => {
    card.style.animationDelay = (i * 25) + 'ms';
  });
  _bindRosterCardEvents();
}

/* ─────────────────────────────────────────
   이벤트 위임 — rosterContainer
   ───────────────────────────────────────── */
let _rosterLpTimer   = null;
let _rosterIsLong    = false;
let _rosterLpTarget  = null;
let _rosterLpStartY  = 0;
let _rosterLpStartX  = 0;
let _rosterLpMoved   = false;
let _rosterEvtBound  = false;

function _bindRosterCardEvents() {
  if (_rosterEvtBound) return;
  _rosterEvtBound = true;

  const root = document.getElementById('rosterContainer');
  if (!root) return;

  root.addEventListener('click', e => {
    if (_rosterIsLong) { _rosterIsLong = false; return; }
    const card = e.target.closest('.roster-card');
    if (!card) return;
    const [ban, num, name, group, id] = card.dataset.sid.split('_');
    openViolHistory({
      id, ban, num,
      name:  decodeURIComponent(name),
      group: decodeURIComponent(group)
    });
  });

  root.addEventListener('touchstart', e => {
    const card = e.target.closest('.roster-card');
    if (!card) return;
    _rosterLpTarget = card;
    _rosterIsLong   = false;
    _rosterLpMoved  = false;
    _rosterLpStartY = e.touches[0].clientY;
    _rosterLpStartX = e.touches[0].clientX;
    clearTimeout(_rosterLpTimer);
    _rosterLpTimer = setTimeout(() => {
      if (_rosterLpMoved) return;
      _rosterIsLong = true;
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
      card.classList.add('pressing');
      const [ban, num, name, group, id] = card.dataset.sid.split('_');
      _violTarget = {
        id, ban, num,
        name:  decodeURIComponent(name),
        group: decodeURIComponent(group)
      };
      openViolSheet(_violTarget);
    }, 520);
  }, { passive: true });

  root.addEventListener('touchmove', e => {
    if (!_rosterLpTarget) return;
    if (Math.abs(e.touches[0].clientY - _rosterLpStartY) > 8 ||
        Math.abs(e.touches[0].clientX - _rosterLpStartX) > 8) {
      _rosterLpMoved = true;
      clearTimeout(_rosterLpTimer);
      _rosterLpTarget.classList.remove('pressing');
      _rosterLpTarget = null;
    }
  }, { passive: true });

  const _lpCleanup = () => {
    clearTimeout(_rosterLpTimer);
    if (_rosterLpTarget) { _rosterLpTarget.classList.remove('pressing'); _rosterLpTarget = null; }
  };
  root.addEventListener('touchend',    _lpCleanup, { passive: true });
  root.addEventListener('touchcancel', _lpCleanup, { passive: true });
}

function _rosterCardHtml(s) {
  const violBadge   = s.violCount > 0
    ? `<div class="rc-viol-badge"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> 위반 ${s.violCount}회</div>` : '';
  const absentBadge = s.absentCount > 0
    ? `<div class="rc-absent-badge">결석 ${s.absentCount}회</div>` : '';
  const violClass   = s.violCount > 0 ? ' has-violation' : '';
  return `<div class="roster-card${violClass}" data-sid="${s.ban}_${s.num}_${encodeURIComponent(s.name)}_${encodeURIComponent(s.group)}_${s.id}">
    <div class="rc-num">${s.ban}반 ${s.num}번</div>
    <div class="rc-name">${_esc(s.name)}</div>
    <div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:4px;">
      ${absentBadge}${violBadge}
    </div>
  </div>`;
}

