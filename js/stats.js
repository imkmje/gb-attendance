// ════════════════════════════════════════
//  stats.js — 통계 탭
//  (app.js에서 분리됨)
// ════════════════════════════════════════

/* ════════════════════════════════
   통계
════════════════════════════════ */
function _renderStatsSkeleton() {
  const container = document.getElementById('statsListContainer');
  if (container) container.innerHTML = Array.from({length:3}).map(() =>
    `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);padding:14px;margin-bottom:10px;">
      <div class="cd-skeleton" style="height:12px;width:30%;margin-bottom:10px;"></div>
      <div class="cd-skeleton" style="height:38px;width:100%;"></div>
    </div>`
  ).join('');
  const top3 = document.getElementById('top3Container');
  if (top3) top3.innerHTML = Array.from({length:3}).map(() =>
    `<div class="cd-skeleton" style="height:34px;width:160px;border-radius:var(--radius);"></div>`
  ).join('');
}

function loadStats() {
  if (_cache.stats && (Date.now() - _cache.statsTs) < _cache.STATS_TTL) {
    _applyStatsData(_cache.stats);
    return;
  }
  _renderStatsSkeleton();
  API.calculateStats(_reasonTypes.filter(r => r.countsAsPresent).map(r => r.name))
    .then(data=>{
      _cache.stats  = data;
      _cache.statsTs = Date.now();
      _applyStatsData(data);
    })
    .catch(()=>{ Swal.fire('오류','데이터를 가져오지 못했습니다.','error'); });
}

function _applyStatsData(data) {
  rawStatsData = data;
  const sorted = [...data].sort((a,b) => b.total - a.total);
  const medals = ['🥇','🥈','🥉'];
  let top3Html = '';
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    if (sorted[i].total <= 0) break;
    top3Html += `<span style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-deep);border-radius:var(--radius);box-shadow:var(--sh-sm);padding:8px 14px;font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;font-family:var(--font);">${medals[i]} ${_esc(sorted[i].group)} ${_esc(sorted[i].name)} <span style="color:var(--blue);font-weight:800;">${sorted[i].total.toFixed(1)}H</span></span>`;
  }
  document.getElementById('top3Container').innerHTML = top3Html || `<span style="color:var(--ink-3);font-size:13px;font-family:var(--font);">아직 누적 데이터가 없습니다.</span>`;
  const gFil = document.getElementById('filterStudyGroup');
  const cFil = document.getElementById('filterClass');
  gFil.innerHTML = '<option value="전체">자습반 전체</option>';
  [...new Set(data.map(d => d.group))].sort().forEach(g => gFil.add(new Option(g, g)));
  cFil.innerHTML = '<option value="전체">학급 전체</option>';
  [...new Set(data.map(d => d.ban))].sort((a,b) => a-b).forEach(c => cFil.add(new Option(c+'반', c)));
  filterStats();
}
const STATS_SORTS = [
  { key:'total',       label:'누적 시간' },
  { key:'attendRate',  label:'출석률' },
  { key:'absentCount', label:'누적 결석' },
];

function _renderStatsSortChips() {
  const wrap = document.getElementById('statsSortChips');
  if (!wrap) return;
  wrap.innerHTML = STATS_SORTS.map(s => {
    const active = sortState.col === s.key;
    const arrow  = active ? (sortState.asc ? '↑' : '↓') : '↕';
    return `<button class="ssf-chip${active?' on':''}" onclick="handleSort('${s.key}')">${s.label} ${arrow}</button>`;
  }).join('');
}

function handleSort(col){ sortState.asc=(sortState.col===col)?!sortState.asc:true; sortState.col=col; filterStats(); }

let _statsSearchQuery = '';
function filterStatsByName(val) {
  _statsSearchQuery = val.trim();
  _updateSearchClear('statsSearchInput', 'statsSearchClear');
  filterStats();
}

function filterStats(){
  const g=document.getElementById('filterStudyGroup').value, c=document.getElementById('filterClass').value;
  let filtered=rawStatsData.filter(d=>(g==='전체'||d.group===g)&&(c==='전체'||d.ban.toString()===c.replace('반',''))&&(!_statsSearchQuery||d.name.includes(_statsSearchQuery)));
  filtered = filtered.map(r => {
    const total = (r.attendCount || 0) + (r.absentCount || 0);
    const rate  = total > 0 ? Math.round((r.attendCount || 0) / total * 100) : null;
    return { ...r, attendRate: rate ?? -1 };
  });
  filtered.sort((a,b)=>{ let vA=a[sortState.col],vB=b[sortState.col]; if(sortState.col==='ban'){vA=parseInt(vA);vB=parseInt(vB);} return sortState.asc?(vA>vB?1:-1):(vA<vB?1:-1); });
  _renderStatsSortChips();
  window._statsFiltered = filtered;
  _renderStatsList(filtered, g);
}

let _statsFlatView = false; // true면 자습반 구분 없이 전체를 한 순위표로 보여줌

function toggleStatsFlatView() {
  _statsFlatView = !_statsFlatView;
  const sw = document.getElementById('statsFlatSw');
  if (sw) sw.classList.toggle('on', _statsFlatView);
  filterStats();
}

function _statRowHtml(s, showGroup) {
  const ratePct   = s.attendRate === -1 ? null : s.attendRate;
  const rateColor = ratePct === null ? 'var(--ink-4)' : ratePct >= 90 ? 'var(--green)' : ratePct >= 70 ? 'var(--amber)' : 'var(--red)';
  const rateDim   = ratePct === null ? 'var(--bg-deep)' : ratePct >= 90 ? 'var(--green-dim)' : ratePct >= 70 ? 'var(--amber-dim)' : 'var(--red-dim)';
  const rateLabel = ratePct === null ? '—' : ratePct + '%';
  const groupTag  = showGroup ? `<span class="sch-dr-s" style="background:var(--bg-deep);color:var(--ink-3);">${_esc(s.group)}</span>` : '';
  return `<div class="stat-row" data-sid="${s.id}">
    <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--blue-dim);color:var(--blue);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;">${s.ban}-${s.num}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:14px;font-weight:700;color:var(--ink);">${_esc(s.name)}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">
        ${groupTag}
        <span class="sch-dr-s" style="background:var(--blue-dim);color:var(--blue);">${s.total.toFixed(1)}시간</span>
        <span class="sch-dr-s" style="background:${rateDim};color:${rateColor};">출석률 ${rateLabel}</span>
        <span class="sch-dr-s" style="background:var(--red-dim);color:var(--red);">결석 ${s.absentCount}회</span>
      </div>
    </div>
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--ink-4)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>
  </div>`;
}

function _renderStatsList(filtered, groupFilter) {
  const container = document.getElementById('statsListContainer');
  if (!container) return;
  if (!filtered.length) { container.innerHTML = _emptyState(_statsSearchQuery ? '검색 결과가 없습니다.' : '데이터가 없습니다.'); return; }

  let html;
  if (groupFilter === '전체' && _statsFlatView) {
    // 자습반 구분 없이 정렬 기준 그대로 한 줄 순위표로
    html = `<div style="text-align:center;margin-bottom:14px;">
      <span style="display:inline-flex;align-items:center;gap:7px;background:var(--surface);box-shadow:var(--sh-md);border-radius:var(--radius-pill);padding:9px 20px;font-size:13px;font-weight:700;color:var(--ink-2);">
        전체 <span style="color:var(--blue);font-weight:800;">${filtered.length}명</span>
      </span>
    </div>
    <div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);overflow:hidden;margin-bottom:16px;">${filtered.map(s => _statRowHtml(s, true)).join('')}</div>`;
  } else if (groupFilter === '전체') {
    html = GROUPS.map(g => {
      const gs = filtered.filter(s => s.group === g);
      if (!gs.length) return '';
      return `<div class="roster-section-head"><span class="roster-section-title">${g}</span><span class="roster-section-count">${gs.length}명</span><div class="roster-section-line"></div></div>
        <div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);overflow:hidden;margin-bottom:16px;">${gs.map(s => _statRowHtml(s, false)).join('')}</div>`;
    }).join('');
  } else {
    html = `<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);overflow:hidden;margin-bottom:16px;">${filtered.map(s => _statRowHtml(s, false)).join('')}</div>`;
  }
  container.innerHTML = html;

  container.querySelectorAll('.stat-row').forEach((el, i) => {
    el.style.animationDelay = (i * 20) + 'ms';
    el.addEventListener('click', () => {
      const s = (window._statsFiltered || []).find(x => String(x.id) === el.dataset.sid);
      if (s) openViolHistory(s);
    });
  });
}

