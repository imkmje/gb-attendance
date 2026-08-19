// ════════════════════════════════════════
//  schedule.js — 시간표 탭
//  (app.js에서 분리됨)
// ════════════════════════════════════════

/* ════════════════════════════════
   시간표
════════════════════════════════ */
function _schDataFiltered() {
  if (!_schSearchQuery) return _schData;
  return _schData.filter(s => s.name.includes(_schSearchQuery));
}
function filterSchByName(val) {
  _schSearchQuery = val.trim();
  _updateSearchClear('schSearchInput', 'schSearchClear');
  _renderSchCards();
  renderSchDay(_schDayIdx);
}
function _renderSchCards() {
  const listEl = document.getElementById('scheduleCardList');
  if (!listEl) return;
  const dayLabels=['월','화','수','목','금'], sessLabels=['오','야','심'], satLabels=['전','후'];
  const filtered = _schDataFiltered();
  if (!filtered.length) {
    listEl.innerHTML = _schSearchQuery ? _emptyState('검색 결과가 없습니다.') : _emptyState('데이터가 없습니다.');
    return;
  }
  listEl.innerHTML = filtered.map(s => {
    let dgh='';
    for(let d=0;d<5;d++){
      let cells='';
      for(let j=0;j<3;j++){const val=s.schedule[d*3+j]; const cls=val==='O'?'sch-cell-on':(val==='방과후'?'sch-cell-after':'sch-cell-off'); const lbl=val==='O'?sessLabels[j]:(val==='방과후'?'방':''); cells+=`<div class="sch-cell ${cls}">${lbl}</div>`;}
      dgh+=`<div class="sch-day-wrap"><div class="sch-day-lbl">${dayLabels[d]}</div><div class="sch-day-group">${cells}</div></div>`;
    }
    let satCells='';
    for(let j=0;j<2;j++){const val=s.schedule[15+j]; satCells+=`<div class="sch-cell ${val==='O'?'sch-cell-on':'sch-cell-off'}">${val==='O'?satLabels[j]:''}</div>`;}
    dgh+=`<div class="sch-sep"></div><div class="sch-day-wrap sch-sat"><div class="sch-day-lbl">토</div><div class="sch-day-group">${satCells}</div></div>`;
    const editAttr = _scheduleEditMode ? `onclick="_openScheduleCardEditorById('${s.id}')" style="cursor:pointer;"` : '';
    const editBadge = _scheduleEditMode ? `<span style="font-size:10px;font-weight:700;color:var(--blue);background:var(--blue-dim);border-radius:var(--radius-pill);padding:2px 8px;white-space:nowrap;flex-shrink:0;">세션 편집</span>` : '';
    return `<div class="sch-card-row" ${editAttr}><div class="sch-top-row"><span class="sch-num-cell">${s.ban}반 ${s.num}번</span><span class="sch-name-cell">${_esc(s.name)}</span><span class="sch-group-cell">${_esc(s.group)}</span>${editBadge}</div><div class="sch-days">${dgh}</div></div>`;
  }).join('');
}
function updateGroupScheduleView() {
  const group=document.getElementById('scheduleGroupSelect').value;
  const title=document.getElementById('schTitle');
  if(title){const nodes=Array.from(title.childNodes); const tn=nodes.reverse().find(n=>n.nodeType===3); if(tn)tn.textContent=' '+group+' 주간 자습 편성표';}
  _schSearchQuery = '';
  const searchEl = document.getElementById('schSearchInput');
  if (searchEl) searchEl.value = '';
  const listEl=document.getElementById('scheduleCardList'), dayContent=document.getElementById('schDayContent');
  if(listEl)listEl.innerHTML=Array.from({length:5}).map(()=>`<div class="sch-card-row"><div class="cd-skeleton" style="height:13px;width:40%;"></div><div class="cd-skeleton" style="height:24px;width:100%;"></div></div>`).join('');

  API.getGroupSchedule(group)
    .then(data=>{
      _schData=data||[];
      if(!listEl)return;
      _renderSchCards();
      _schSessFilter.clear(); buildSessFilterChips(_schDayIdx); renderSchDay(_schDayIdx);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const ind=document.getElementById('schPillIndicator'); if(ind)ind.style.transition='none';
        _moveSchPillSlider(document.getElementById('schTab-all'));
        requestAnimationFrame(()=>{const ind=document.getElementById('schPillIndicator'); if(ind)ind.style.transition='';});
      }));
    })
    .catch(()=>{if(listEl)listEl.innerHTML='<div class="text-center py-5" style="color:var(--red);font-weight:600;">오류가 발생했습니다.</div>';});
}
function toggleScheduleEditMode() {
  if (_scheduleEditMode) {
    _scheduleEditMode = false;
    _updateScheduleEditBtn();
    _renderSchCards();
    return;
  }
  if (_scheduleEditAuthed || localStorage.getItem('teacherPwEnabled') === 'false') {
    _enterScheduleEditMode(); return;
  }
  Swal.fire({
    title: '시간표 편집',
    input: 'password',
    inputPlaceholder: '교사 비밀번호를 입력하세요',
    inputAttributes: { autocomplete: 'off' },
    showCancelButton: true,
    confirmButtonText: '확인',
    cancelButtonText: '취소',
  }).then(result => {
    if (result.isConfirmed && result.value === TEACHER_PW) {
      _scheduleEditAuthed = true;
      _enterScheduleEditMode();
    } else if (result.isConfirmed) {
      Swal.fire({ title: '비밀번호가 틀렸습니다', icon: 'error', confirmButtonText: '확인' });
    }
  });
}

function _enterScheduleEditMode() {
  _scheduleEditMode = true;
  _updateScheduleEditBtn();
  _renderSchCards();
  const el = _cdToast({ type:'blue', title:'편집 모드', sub:'학생 카드를 탭해서 세션을 편집하세요' });
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 280); }, 2400);
}

function _updateScheduleEditBtn() {
  const btn = document.getElementById('schedEditBtn');
  if (!btn) return;
  if (_scheduleEditMode) {
    btn.style.background = 'var(--blue)';
    btn.style.color = '#fff';
    btn.style.borderColor = 'var(--blue)';
    btn.style.boxShadow = 'var(--sh-blue)';
  } else {
    btn.style.background = 'var(--surface)';
    btn.style.color = 'var(--ink-3)';
    btn.style.borderColor = 'var(--bg-deep)';
    btn.style.boxShadow = 'var(--sh-xs)';
  }
}

function _openScheduleCardEditorById(id) {
  const s = _schData.find(s => s.id === id);
  if (!s) return;
  _teacherLoadSchedule(s);
}

function _moveSchPillSlider(activeBtn){
  const ind=document.getElementById('schPillIndicator');
  if(!ind||!activeBtn)return;
  const btnLeft=activeBtn.offsetLeft, btnW=activeBtn.offsetWidth;
  if(btnW===0)return;
  ind.style.width=btnW+'px'; ind.style.transform='translateX('+btnLeft+'px)';
}
function switchSchTab(tab){
  const av=document.getElementById('schView-all'), dv=document.getElementById('schView-day');
  const ab=document.getElementById('schTab-all'),  db=document.getElementById('schTab-day');
  if(tab==='all'){ ab.classList.add('active'); db.classList.remove('active'); av.style.display=''; dv.style.display='none'; _moveSchPillSlider(ab); }
  else           { db.classList.add('active'); ab.classList.remove('active'); av.style.display='none'; dv.style.display=''; _moveSchPillSlider(db); _schSessFilter.clear(); buildSessFilterChips(_schDayIdx); renderSchDay(_schDayIdx); }
}
function switchSchDay(d){ _schDayIdx=d; _schSessFilter.clear(); document.querySelectorAll('.sch-day-tab').forEach((t,i)=>t.classList.toggle('active',i===d)); buildSessFilterChips(d); renderSchDay(d); }
function buildSessFilterChips(d){
  const labels=d===5?['오전','오후']:['오자','야자','심자'];
  const chips=document.getElementById('schSessChips'); if(!chips)return;
  chips.innerHTML=labels.map((lbl,j)=>`<button class="ssf-chip" data-j="${j}" onclick="toggleSessFilter(${j})">${lbl}</button>`).join('');
  updateResetBtn();
}
function toggleSessFilter(j){ if(_schSessFilter.has(j))_schSessFilter.delete(j); else _schSessFilter.add(j); document.querySelectorAll('.ssf-chip').forEach(c=>c.classList.toggle('on',_schSessFilter.has(parseInt(c.dataset.j)))); updateResetBtn(); renderSchDay(_schDayIdx); }
function resetSchSessFilter(){ _schSessFilter.clear(); document.querySelectorAll('.ssf-chip').forEach(c=>c.classList.remove('on')); updateResetBtn(); renderSchDay(_schDayIdx); const btn=document.getElementById('schSessReset'); if(btn){btn.style.transition='transform var(--dur-slow) var(--spring)'; btn.style.transform='rotate(-360deg)'; setTimeout(()=>{btn.style.transform=''; btn.style.transition='';},420);} }
function updateResetBtn(){ const btn=document.getElementById('schSessReset'); if(!btn)return; if(_schSessFilter.size>0){btn.style.background='var(--blue-dim)'; btn.style.color='var(--blue)';}else{btn.style.background=''; btn.style.color='';} }
function renderSchDay(d){
  const content=document.getElementById('schDayContent'); if(!content)return;
  if(!_schData.length){content.innerHTML='<div style="text-align:center;padding:28px;font-size:13px;font-weight:600;color:var(--ink-3);">자습반을 먼저 선택하세요</div>'; return;}
  const isSat=(d===5), sessLabels=isSat?['오전','오후']:['오자','야자','심자'], offset=isSat?15:d*3, count=isSat?2:3;
  const base=_schDataFiltered();
  let filtered=base;
  if(_schSessFilter.size>0){ filtered=base.filter(s=>{const sess=(s.schedule||[]).slice(offset,offset+count); return[..._schSessFilter].every(j=>sess[j]==='O'||sess[j]==='방과후');}); }
  else{ filtered=base.filter(s=>{const sess=(s.schedule||[]).slice(offset,offset+count); return sess.some(v=>v==='O'||v==='방과후');}); }
  if(!filtered.length){content.innerHTML='<div style="text-align:center;padding:28px;font-size:13px;font-weight:600;color:var(--ink-3);">조건에 맞는 학생이 없어요</div>'; return;}
  content.innerHTML=filtered.map(s=>{
    const sess=(s.schedule||[]).slice(offset,offset+count);
    const sessCells=sess.map((val,j)=>{ const cls=val==='O'?'sds-on':(val==='방과후'?'sds-aft':'sds-off'); const label=val==='방과후'?'방과후':sessLabels[j]; return`<span class="sch-dr-s ${cls}">${label}</span>`; }).join('');
    return`<div class="sch-day-row"><div class="sch-dr-num">${s.num}번</div><div style="flex:1;min-width:0;"><div class="sch-dr-name">${_esc(s.name)}</div><span class="sch-dr-grp" style="display:inline-block;margin-top:2px;">${_esc(s.group)}</span></div><div class="sch-dr-sess">${sessCells}</div></div>`;
  }).join('');
}

