// ════════════════════════════════════════
//  attendance.js — 출석체크 탭: 날짜/세션 · 학생 불러오기 · 터치/클릭 · 조기 퇴실 · 대시보드 위젯 · 저장 · 오프라인 큐 · 결과보기
//  (app.js에서 분리됨)
// ════════════════════════════════════════

/* ════════════════════════════════
   날짜 / 세션
════════════════════════════════ */
// 날짜별 세션 목록을 계산하는 순수 함수 — handleDateChange(홈 탭 상태 변경)와
// 대시보드 점등 표시처럼 "이 날짜에 세션이 뭐가 있는지"만 필요한 곳에서 공용으로 쓴다.
function _computeSessionOptions(dateStr) {
  const day = new Date(dateStr).getDay();
  if (day === 0) return [];
  const holiday = _holidays.find(h => h.date === dateStr);
  if (holiday) {
    const opts = [];
    if (holiday.am) opts.push({text:'오전 자율학습(공휴일)', value:'HOL_AM', isHoliday:true});
    if (holiday.pm) opts.push({text:'오후 자율학습(공휴일)', value:'HOL_PM', isHoliday:true});
    return opts;
  }
  if (day === 6) return [{text:"오전 자율학습(토)",value:"19"},{text:"오후1 자율학습(토)",value:"20"},{text:"오후2 자율학습(토)",value:"21"}];
  const base = 4 + (day-1)*3;
  return [{text:"오후 자율학습",value:String(base)},{text:"야간 자율학습",value:String(base+1)},{text:"심야 자율학습",value:String(base+2)}];
}

function handleDateChange(forceLoad=false) {
  if (hasUnsavedChanges && !forceLoad) {
    showSheet({ title:'저장하지 않고 변경할까요?', text:'변경사항이 저장되지 않아요.',
      buttons:[
        { label:'저장하고 이동', cls:'csb-save',   cb:()=>submitAttendance(()=>handleDateChange(true)) },
        { label:'무시',          cls:'csb-ignore', cb:()=>{ hasUnsavedChanges=false; handleDateChange(true); } },
        { label:'취소',          cls:'csb-cancel', cb:null }
      ]
    }); return;
  }
  const dateStr = document.getElementById('dateInput').value;
  sessionStorage.setItem('ss_date', dateStr);
  const day = new Date(dateStr).getDay();
  selectedSessionIdx=0;
  sessionOptions = _computeSessionOptions(dateStr);

  if (day===0) {
    document.getElementById('sessionPillWrap').innerHTML='';
    document.getElementById('studentContainer').innerHTML=_emptyState('일요일은 자습이 없습니다.');
    document.getElementById('dashboardWidget').classList.remove('visible'); return;
  }

  if (!sessionOptions.length) {
    document.getElementById('sessionPillWrap').innerHTML='';
    document.getElementById('studentContainer').innerHTML=_emptyState('설정된 세션이 없습니다.');
    document.getElementById('dashboardWidget').classList.remove('visible'); return;
  }

  const today=new Date();
  if (new Date(dateStr).toDateString()===today.toDateString()) {
    const hm=today.getHours()*100+today.getMinutes();
    if (day===6){if(hm>=1300)selectedSessionIdx=1;}
    else{if(hm>=2110)selectedSessionIdx=2; else if(hm>=1900)selectedSessionIdx=1;}
  }
  if (!_ssRestored) {
    const _sv = sessionStorage.getItem('ss_session');
    if (_sv) { const _si = sessionOptions.findIndex(o => o.text === _sv); if (_si >= 0) selectedSessionIdx = _si; }
    _ssRestored = true;
  }
  renderSessionPills(); loadStudents();
}

// instant=true: 스크롤 중처럼 매 프레임 위치가 바뀔 때 쓰는 모드.
// 슬라이더에 걸린 스프링 트랜지션(탭 클릭 시 부드럽게 슥 이동하는 용도)을
// 그대로 둔 채 계속 값을 갱신하면, 목표 지점이 프레임마다 바뀌면서
// 트랜지션이 계속 새로 시작→덧씌워지길 반복해 슬라이더가 불안정하게
// 떨리는 버그가 있었음 — 스크롤 중엔 트랜지션을 잠깐 꺼서 즉시 스냅되게
// 하고, 스크롤이 멎으면 다음 프레임에 다시 켜서 탭 클릭 시엔 여전히
// 부드럽게 슬라이드하도록 한다.
function _movePillSlider(activeBtn, instant) {
  const wrap   = document.getElementById('sessionPillWrap');
  const slider = document.getElementById('sessionPillSlider');
  if (!slider||!activeBtn||!wrap) return;
  const btnLeft=activeBtn.offsetLeft, btnW=activeBtn.offsetWidth;
  if (btnW===0) return;
  if (instant) slider.style.transition = 'none';
  slider.style.width=btnW+'px'; slider.style.transform='translateX('+btnLeft+'px)';
  if (instant) {
    // rAF가 지연될 수 있는 상황(탭 백그라운드 전환 등)에도 트랜지션이
    // 계속 꺼진 채로 남지 않도록 setTimeout을 함께 건다 — 둘 중 먼저
    // 오는 쪽이 복구.
    const restore = () => { slider.style.transition = ''; };
    requestAnimationFrame(() => requestAnimationFrame(restore));
    setTimeout(restore, 120);
  }
}

function renderSessionPills() {
  const wrap=document.getElementById('sessionPillWrap');
  wrap.innerHTML='<div class="session-pill-slider" id="sessionPillSlider"></div>'+
    sessionOptions.map((opt,i)=>`<button class="session-pill${i===selectedSessionIdx?' active':''}" onclick="selectSessionPill(${i})">${opt.text}</button>`).join('');
  _updatePillFade('sessionPillWrap');
  const slider=document.getElementById('sessionPillSlider');
  if(slider)slider.style.transition='none';
  setTimeout(()=>{
    const ab=wrap.querySelector('.session-pill.active'); _movePillSlider(ab);
    requestAnimationFrame(()=>requestAnimationFrame(()=>{ const s=document.getElementById('sessionPillSlider'); if(s)s.style.transition=''; }));
  },0);
  _updateAfterSchoolRow();
}

function _isAfternoonSession() {
  const opt = sessionOptions[selectedSessionIdx];
  return opt && (opt.text === '오후 자율학습' || opt.text === '오후1 자율학습(토)' || opt.text === '오후2 자율학습(토)');
}

function _updateAfterSchoolRow() {
  const row = document.getElementById('afterSchoolRow');
  if (!row) return;
  const show = _isAfternoonSession();
  row.style.display = show ? 'flex' : 'none';
  if (!show) {
    _includeAfterSchool = false;
    const sw = document.getElementById('afterSchoolSw');
    const lbl = document.getElementById('afterSchoolLbl');
    if (sw) sw.classList.remove('on');
    if (lbl) { lbl.textContent = '방과후 없는 날'; lbl.style.color = 'var(--ink-3)'; }
  }
}

function toggleAfterSchool() {
  if (!_isAfternoonSession()) return;
  _includeAfterSchool = !_includeAfterSchool;
  const sw  = document.getElementById('afterSchoolSw');
  const lbl = document.getElementById('afterSchoolLbl');
  if (sw)  sw.classList.toggle('on', _includeAfterSchool);
  if (lbl) { lbl.textContent = _includeAfterSchool ? '방과후 없는 날 (방과후 포함)' : '방과후 없는 날'; lbl.style.color = _includeAfterSchool ? 'var(--amber)' : 'var(--ink-3)'; }
  loadStudents();
}

function selectSessionPill(idx, forceLoad=false) {
  if (hasUnsavedChanges&&!forceLoad) {
    showSheet({ title:'저장하지 않고 변경할까요?', text:'변경한 출석 기록이 저장되지 않아요.',
      buttons:[
        {label:'저장하고 변경',cls:'csb-save',  cb:()=>submitAttendance(()=>selectSessionPill(idx,true))},
        {label:'무시',         cls:'csb-ignore',cb:()=>{ hasUnsavedChanges=false; selectSessionPill(idx,true); }},
        {label:'취소',         cls:'csb-cancel',cb:null}
      ]
    }); return;
  }
  if(navigator.vibrate)navigator.vibrate(20);
  selectedSessionIdx=idx;
  sessionStorage.setItem('ss_session', sessionOptions[idx].text);
  const wrap=document.getElementById('sessionPillWrap');
  if(wrap){
    wrap.querySelectorAll('.session-pill').forEach((b,i)=>b.classList.toggle('active',i===idx));
    const ab=wrap.querySelectorAll('.session-pill')[idx];
    requestAnimationFrame(()=>_movePillSlider(ab));
  }
  _updateAfterSchoolRow();
  loadStudents();
}

/* ════════════════════════════════
   학생 불러오기 (출석체크)
════════════════════════════════ */
function _renderSkeletonCards(count) {
  return Array.from({length:count||6}).map(()=>
    `<div class="skeleton-student-card">
       <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
         <div style="flex:1;display:flex;flex-direction:column;gap:8px;">
           <div class="cd-skeleton skeleton-line-sm"></div>
           <div class="cd-skeleton skeleton-line-lg"></div>
         </div>
         <div class="cd-skeleton skeleton-badge"></div>
       </div>
     </div>`
  ).join('');
}

function renderLoadingState() {
  document.getElementById('studentContainer').innerHTML = _renderSkeletonCards(6);
  document.getElementById('dashboardWidget').classList.remove('visible');
}

function loadStudents(withLoading=true, forceLoad=false) {
  if (hasUnsavedChanges&&!forceLoad) {
    showSheet({ title:'저장하지 않고 변경할까요?', text:'변경한 출석 기록이 저장되지 않아요.',
      buttons:[
        {label:'저장하고 변경',cls:'csb-save',  cb:()=>submitAttendance(()=>loadStudents(withLoading,true))},
        {label:'무시',         cls:'csb-ignore',cb:()=>{ hasUnsavedChanges=false; loadStudents(withLoading,true); }},
        {label:'취소',         cls:'csb-cancel',cb:null}
      ]
    }); return;
  }
  const group=document.getElementById('groupSelect').value;
  const opt=sessionOptions[selectedSessionIdx];
  const date=document.getElementById('dateInput').value;
  if(!group||!opt)return;

  if(withLoading)renderLoadingState();

  if (opt.isHoliday) {
    API.getAllMemberList()
      .then(data => {
        hideLoading();
        if (!data) { document.getElementById('studentContainer').innerHTML='<div class="col-12 text-center py-5" style="color:var(--red);font-weight:600;">서버 오류가 발생했습니다.</div>'; return; }
        const list = data
          .filter(s => s.group === group)
          .map(s => ({...s, status:'출석', reasonType:'', reasonText:'', noCount:false}));
        const fakeRes = { list, isAlreadySaved: false };
        _applyStudentResult(fakeRes, group, opt, date);
      })
      .catch(()=>{ hideLoading(); Swal.fire('오류','명단을 불러오지 못했습니다.','error'); });
    return;
  }

  API.getStudentList(group, opt.text, date, parseInt(opt.value), _includeAfterSchool)
    .then(res=>{
      hideLoading();
      _applyStudentResult(res, group, opt, date);
    })
    .catch(()=>{ hideLoading(); Swal.fire('오류','명단을 불러오지 못했습니다.','error'); });
}

// 서버에서 불러온 raw reason 문자열을 드롭다운 상태(reasonType/reasonText)로 복원한다.
// ⚠ 기존엔 이 변환이 아예 없어서, 이미 저장된 결석 사유가 있는 학생이어도
//   새로고침/재조회 시 사유 선택란이 빈 채로 보였고, 그 상태로 결과보기를 열면
//   사유가 안 보이고, 그대로 재저장하면 저장돼 있던 사유가 지워지는 문제가 있었음.
function _deriveReasonFields(s) {
  if (s.status !== '결석' || !s.reason) return { reasonType: '', reasonText: '' };
  if (_reasonTypes.includes(s.reason)) return { reasonType: s.reason, reasonText: '' };
  return { reasonType: '직접 입력', reasonText: s.reason };
}

// "오늘 남은 세션도 결석" 토글의 초기 상태를 실제 저장 결과로 판단한다.
// — 노카운트처럼 서버 데이터를 그대로 반영해야, 저장 후 다른 세션으로
//   갔다가 돌아와도(혹은 처음부터 다른 세션을 봐도) 계속 켜진 채로 보여서
//   "켰는데 다른 세션 가면 꺼져 보인다"는 불일치가 사라진다.
// 판단 기준: 이후 세션들 중 실제로 오늘 자 기록이 있는 세션이 하나 이상이고,
// 그 기록들이 전부 '결석'이면 이미 적용된 것으로 보고 ON.
function _deriveRestOfDayFlag(s) {
  if (s.status !== '결석') return false;
  const laterOpts = sessionOptions.slice(selectedSessionIdx + 1).filter(o => !o.isHoliday);
  if (!laterOpts.length) return false;
  const recorded = laterOpts.map(o => s.todaySessions?.[o.text]).filter(v => v !== undefined);
  if (!recorded.length) return false;
  return recorded.every(v => v === '결석');
}

function _applyStudentResult(res,group,opt,date) {
  if(!res||!res.list){ document.getElementById('studentContainer').innerHTML='<div class="col-12 text-center py-5" style="color:var(--red);font-weight:600;">서버 오류가 발생했습니다.</div>'; return; }
  currentStudents=res.list.map(s => ({ ...s, ..._deriveReasonFields(s), applyRestOfDay: _deriveRestOfDayFlag(s) }));
  isAlreadySaved=res.isAlreadySaved;
  loadedGroup=group; loadedSessionText=opt.text; loadedDate=date; hasUnsavedChanges=false;
  const txt=document.getElementById('saveBtnText'); if(txt)txt.textContent=isAlreadySaved?'출석 수정':'출석 저장';
  renderStudents();
}

function renderStudents() {
  const container=document.getElementById('studentContainer');
  if(!currentStudents.length){
    container.innerHTML=_emptyState('해당 조건에 학생이 없습니다.');
    return updateDashboard();
  }
  const _clockSvg='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  const _lateSvg ='<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  container.innerHTML=currentStudents.map((s,idx)=>{
    const absentBadge=s.absentCount>0?`<span class="absent-count-badge">결석 ${s.absentCount}회</span>`:'';
    const isAbsent=(s.status==='결석');
    const elm=s.earlyLeaveMins||0;
    const elRec=s.isRecurring||false;
    const elPanelShow=elm>0;
    const ltm=s.lateMins||0;
    const chipsSet=elm>0||ltm>0; // 조퇴·지각 중 하나라도 값이 있으면 기본으로 펼쳐둠
    const toggleLbl=elm>0?`${elm}분 조퇴`:(ltm>0?`${ltm}분 지각`:'조퇴·지각');
    return `<div class="student-card ${isAbsent?'absent':'present'}${chipsSet?' chips-open':''}"
           onpointerdown="startPress(${idx},event)" onpointerup="endPress(${idx},event)"
           onpointermove="handlePointerMove(event)" onpointercancel="cancelPress()">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="min-width:0;">
            <div class="s-meta">${s.ban}반 ${s.num}번${absentBadge}</div>
            <div class="s-name">${_esc(s.name)}</div>
          </div>
          <span class="s-badge ${isAbsent?'absent':'present'}">${s.status}</span>
        </div>
        <div class="reason-drop" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
          <div class="reason-drop-overflow"><div class="reason-drop-inner">
            <select class="cd-reason-select" onchange="changeReasonType(${idx},this.value,this)">
              <option value="" ${!s.reasonType?'selected':''}>결석 사유 선택</option>
              ${_reasonTypes.map(r=>`<option value="${_esc(r)}" ${s.reasonType===r?'selected':''}>${_esc(r)}</option>`).join('')}
              <option value="직접 입력" ${s.reasonType==='직접 입력'?'selected':''}>직접 입력</option>
            </select>
            <div style="position:relative;display:${s.reasonType==='직접 입력'?'block':'none'}">
              <input type="text" class="cd-reason-input" placeholder="상세 사유 입력" value="${_esc(s.reasonText)}" oninput="changeReasonText(${idx},this.value)">
              <span class="clear-input-btn" onclick="clearReasonText(${idx},this)" role="button" tabindex="0" aria-label="입력 지우기">&times;</span>
            </div>
            <div class="nocount-row" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
              <button class="nocount-sw${s.noCount?' on':''}" id="nocount-sw-${idx}" onclick="toggleNoCount(${idx},this)" aria-label="노카운트 전환" aria-pressed="${s.noCount?'true':'false'}">
                <div class="nocount-sw-thumb"></div>
              </button>
              <span class="nocount-label${s.noCount?' on':''}" id="nocount-lbl-${idx}">노카운트 <span style="font-weight:500;opacity:0.7;">(결석 횟수 미산입)</span></span>
            </div>
            ${_hasLaterSessionToday() ? `
            <div class="nocount-row" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
              <button class="nocount-sw${s.applyRestOfDay?' on':''}" id="rest-sw-${idx}" onclick="toggleApplyRestOfDay(${idx},this)" aria-label="일괄 적용 전환" aria-pressed="${s.applyRestOfDay?'true':'false'}">
                <div class="nocount-sw-thumb"></div>
              </button>
              <span class="nocount-label${s.applyRestOfDay?' on':''}" id="rest-lbl-${idx}">일괄 적용 <span style="font-weight:500;opacity:0.7;">(선택 시 오늘 자습 전체 결석 적용)</span></span>
            </div>` : ''}
          </div></div>
        </div>
        <div class="el-toggle-row" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
          <button class="el-chip el-toggle-chip${chipsSet?' active':''}" id="el-toggle-${idx}" onclick="toggleElChips(this)" aria-expanded="${chipsSet?'true':'false'}">
            <span id="el-toggle-lbl-${idx}">${toggleLbl}</span>
            <svg class="el-toggle-caret" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <div class="early-leave-drop" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
          <div class="early-leave-overflow"><div class="early-leave-inner">
            <div style="display:flex;gap:7px;flex-wrap:wrap;">
              <button class="el-chip${elm>0?' active':''}" id="el-chip-${idx}" onclick="toggleEarlyLeavePanel(${idx})">
                ${_clockSvg} <span id="el-chip-lbl-${idx}">${elm>0?elm+'분 조기 퇴실':'조기 퇴실'}</span>
              </button>
              <button class="el-chip late-chip${ltm>0?' active':''}" id="late-chip-${idx}" onclick="toggleLatePanel(${idx})">
                ${_lateSvg} <span id="late-chip-lbl-${idx}">${ltm>0?ltm+'분 지각':'지각'}</span>
              </button>
            </div>
            <div class="el-panel${elPanelShow?' show':''}" id="el-panel-${idx}">
              <div class="el-panel-overflow"><div class="el-panel-inner">
                <div class="el-presets">
                  ${[15,30,45,60].map(m=>`<button class="el-preset${elm===m?' active':''}" onclick="setEarlyLeave(${idx},${m})">${m}분</button>`).join('')}
                </div>
                <div class="el-input-row">
                  <input type="number" inputmode="numeric" class="el-mins-input" id="el-mins-${idx}"
                    value="${elm||''}" min="1" max="180" placeholder="직접 입력"
                    oninput="changeEarlyLeaveMins(${idx},this.value)">
                  <span class="el-mins-unit">분 일찍 퇴실</span>
                </div>
                <div class="nocount-row el-recurring-row" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
                  <button class="nocount-sw${elRec?' on':''}" id="el-rec-${idx}" onclick="toggleRecurringLeave(${idx},this)" aria-label="매주 반복 전환" aria-pressed="${elRec?'true':'false'}">
                    <div class="nocount-sw-thumb"></div>
                  </button>
                  <span class="nocount-label${elRec?' on':''}" id="el-rec-lbl-${idx}">매주 반복</span>
                </div>
              </div></div>
            </div>
            <div class="el-panel${ltm>0?' show':''}" id="late-panel-${idx}">
              <div class="el-panel-overflow"><div class="el-panel-inner">
                <div class="el-presets">
                  ${[5,10,15,30].map(m=>`<button class="el-preset${ltm===m?' active':''}" onclick="setLate(${idx},${m})">${m}분</button>`).join('')}
                </div>
                <div class="el-input-row">
                  <input type="number" inputmode="numeric" class="el-mins-input" id="late-mins-${idx}"
                    value="${ltm||''}" min="1" max="120" placeholder="직접 입력"
                    oninput="changeLateMins(${idx},this.value)">
                  <span class="el-mins-unit">분 지각</span>
                </div>
                <button class="el-fine-btn" id="late-fine-btn-${idx}" onclick="openLateViolSheet(${idx})" style="${ltm>0?'':'display:none'}">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  벌금 등록
                </button>
              </div></div>
            </div>
          </div></div>
        </div>
        ${s.reason&&!s.reasonType?`<div class="reason-text">⚠ ${_esc(s.reason)}</div>`:''}
      </div>`;
  }).join('');
  updateDashboard();
  container.querySelectorAll('.student-card').forEach((card,i)=>{ card.style.animationDelay=(i*35)+'ms'; });
}

/* ════════════════════════════════
   터치 / 클릭 (출석체크)
════════════════════════════════ */
function startPress(idx,event) {
  if(event.button!==0&&event.pointerType==='mouse')return;
  startY=event.clientY; startX=event.clientX;
  isLongPress=false; isScrolling=false;
  pressedCard=event.currentTarget; pressedIdx=idx;
  pressedCard.style.transform='scale(0.96)'; pressedCard.style.boxShadow='var(--sh-xs)';
  longPressTimer=setTimeout(()=>{ isLongPress=true; if(navigator.vibrate)navigator.vibrate(40); if(pressedCard)pressedCard.style.transform='scale(0.93)'; },420);
}
function handlePointerMove(e) {
  if(Math.abs(e.clientY-startY)>10||Math.abs(e.clientX-startX)>10){
    isScrolling=true; clearTimeout(longPressTimer);
    if(pressedCard){pressedCard.style.transform=''; pressedCard.style.boxShadow='';}
  }
}
function endPress(idx,e) {
  clearTimeout(longPressTimer);
  const card=pressedCard;
  if(card){card.style.transform=''; card.style.boxShadow='';}
  if(!isLongPress&&!isScrolling) toggleStatus(idx,card,e.clientX,e.clientY);
  pressedCard=null; pressedIdx=-1;
}
function cancelPress() {
  clearTimeout(longPressTimer);
  if(pressedCard){pressedCard.style.transform=''; pressedCard.style.boxShadow='';}
  pressedCard=null; pressedIdx=-1; isLongPress=false; isScrolling=false;
}
function toggleStatus(idx,card,clientX,clientY) {
  if(!card)return;
  if(navigator.vibrate)navigator.vibrate(28);
  const s=currentStudents[idx];
  s.status=s.status==='출석'?'결석':'출석';
  hasUnsavedChanges=true;
  if(s.status==='출석'){
    s.reasonType='';s.reasonText='';s.noCount=false;s.reason='';s.applyRestOfDay=false;
    // DOM에서 ⚠ 사유 경고 텍스트 즉시 제거
    const rt=card.querySelector('.reason-text');
    if(rt)rt.remove();
  } else {
    // 결석으로 전환: 조기 퇴실·지각 초기화
    s.earlyLeaveMins=0; s.isRecurring=false; s.lateMins=0;
  }
  const isNowAbsent=(s.status==='결석');
  const rect=card.getBoundingClientRect();
  const x=clientX-rect.left, y=clientY-rect.top;
  const size=Math.max(rect.width,rect.height)*2.2;
  const rpl=document.createElement('div');
  rpl.className='ripple-wave';
  rpl.style.cssText=[`left:${x}px`,`top:${y}px`,`width:${size}px`,`height:${size}px`,`background:${isNowAbsent?'rgba(212,149,154,0.28)':'rgba(114,184,150,0.24)'}`].join(';');
  card.appendChild(rpl); setTimeout(()=>rpl.remove(),580);
  card.classList.add('flipping');
  requestAnimationFrame(()=>{
    card.classList.toggle('present',!isNowAbsent); card.classList.toggle('absent',isNowAbsent);
    const badge=card.querySelector('.s-badge');
    if(badge){ badge.style.opacity='0'; badge.style.transform='scale(0.8)'; setTimeout(()=>{ badge.className=`s-badge ${isNowAbsent?'absent':'present'}`; badge.textContent=isNowAbsent?'결석':'출석'; badge.style.opacity='1'; badge.style.transform='scale(1)'; },120); }
    setTimeout(()=>card.classList.remove('flipping'),180);
    updateDashboard();
  });
}
function changeReasonType(idx,val,sel){ currentStudents[idx].reasonType=val; const inp=sel.nextElementSibling; if(inp)inp.style.display=(val==='직접 입력'?'block':'none'); }
function changeReasonText(idx,val){ currentStudents[idx].reasonText=val; }
function clearReasonText(idx,btn){ const inp=btn.previousElementSibling; inp.value=''; currentStudents[idx].reasonText=''; }
function toggleNoCount(idx, btn) {
  const s = currentStudents[idx];
  s.noCount = !s.noCount;
  btn.classList.toggle('on', s.noCount);
  const lbl = document.getElementById('nocount-lbl-' + idx);
  if (lbl) lbl.classList.toggle('on', s.noCount);
  hasUnsavedChanges = true;
}

/* ════════════════════════════════
   조기 퇴실
════════════════════════════════ */
function _getDayOfWeekNum(dateStr) {
  const p = dateStr.split('-');
  return new Date(+p[0], +p[1]-1, +p[2]).getDay();
}
function _updateEarlyLeaveChip(idx, mins) {
  const chip = document.getElementById(`el-chip-${idx}`);
  const lbl  = document.getElementById(`el-chip-lbl-${idx}`);
  if (!chip) return;
  chip.classList.toggle('active', mins > 0);
  if (lbl) lbl.textContent = mins > 0 ? `${mins}분 조기 퇴실` : '조기 퇴실';
  _updateElToggleChip(idx);
}
// 조퇴/지각 값 유무에 따라 접힌 상태에서 보이는 요약 칩(el-toggle-chip)을
// 동기화 — 둘 중 하나라도 값이 생기면 칩 라벨을 갱신하고 카드를 자동으로 펼친다.
function _updateElToggleChip(idx) {
  const s = currentStudents[idx]; if (!s) return;
  const elm = s.earlyLeaveMins || 0, ltm = s.lateMins || 0;
  const chipsSet = elm > 0 || ltm > 0;
  const btn = document.getElementById(`el-toggle-${idx}`);
  const lbl = document.getElementById(`el-toggle-lbl-${idx}`);
  if (btn) btn.classList.toggle('active', chipsSet);
  if (lbl) lbl.textContent = elm > 0 ? `${elm}분 조퇴` : (ltm > 0 ? `${ltm}분 지각` : '조퇴·지각');
  const card = btn?.closest('.student-card');
  if (card) card.classList.toggle('chips-open', chipsSet);
}
// el-toggle-chip 탭 — 조퇴·지각 편집 영역을 펼치거나 접는다.
function toggleElChips(btn) {
  const card = btn.closest('.student-card');
  if (!card) return;
  const open = card.classList.toggle('chips-open');
  btn.setAttribute('aria-expanded', open ? 'true' : 'false');
}
function toggleEarlyLeavePanel(idx) {
  const panel = document.getElementById(`el-panel-${idx}`);
  if (panel) panel.classList.toggle('show');
}
function setEarlyLeave(idx, mins) {
  const s = currentStudents[idx]; if (!s) return;
  s.earlyLeaveMins = s.earlyLeaveMins === mins ? 0 : mins;
  hasUnsavedChanges = true;
  const panel = document.getElementById(`el-panel-${idx}`);
  if (panel) panel.querySelectorAll('.el-preset').forEach(b => b.classList.toggle('active', parseInt(b.textContent) === s.earlyLeaveMins));
  const inp = document.getElementById(`el-mins-${idx}`);
  if (inp) inp.value = s.earlyLeaveMins || '';
  _updateEarlyLeaveChip(idx, s.earlyLeaveMins);
}
function changeEarlyLeaveMins(idx, val) {
  const s = currentStudents[idx]; if (!s) return;
  const mins = Math.max(0, parseInt(val) || 0);
  s.earlyLeaveMins = mins;
  hasUnsavedChanges = true;
  const panel = document.getElementById(`el-panel-${idx}`);
  if (panel) panel.querySelectorAll('.el-preset').forEach(b => b.classList.toggle('active', parseInt(b.textContent) === mins));
  _updateEarlyLeaveChip(idx, mins);
}
function toggleLatePanel(idx) {
  const panel = document.getElementById(`late-panel-${idx}`);
  if (panel) panel.classList.toggle('show');
}
function _updateLateChip(idx, mins) {
  const chip = document.getElementById(`late-chip-${idx}`);
  const lbl  = document.getElementById(`late-chip-lbl-${idx}`);
  if (!chip) return;
  chip.classList.toggle('active', mins > 0);
  if (lbl) lbl.textContent = mins > 0 ? `${mins}분 지각` : '지각';
  const fineBtn = document.getElementById(`late-fine-btn-${idx}`);
  if (fineBtn) fineBtn.style.display = mins > 0 ? '' : 'none';
  _updateElToggleChip(idx);
}
function setLate(idx, mins) {
  const s = currentStudents[idx]; if (!s) return;
  s.lateMins = s.lateMins === mins ? 0 : mins;
  hasUnsavedChanges = true;
  const panel = document.getElementById(`late-panel-${idx}`);
  if (panel) panel.querySelectorAll('.el-preset').forEach(b => b.classList.toggle('active', parseInt(b.textContent) === s.lateMins));
  const inp = document.getElementById(`late-mins-${idx}`);
  if (inp) inp.value = s.lateMins || '';
  _updateLateChip(idx, s.lateMins);
}
function changeLateMins(idx, val) {
  const s = currentStudents[idx]; if (!s) return;
  const mins = Math.max(0, parseInt(val) || 0);
  s.lateMins = mins;
  hasUnsavedChanges = true;
  const panel = document.getElementById(`late-panel-${idx}`);
  if (panel) panel.querySelectorAll('.el-preset').forEach(b => b.classList.toggle('active', parseInt(b.textContent) === mins));
  _updateLateChip(idx, mins);
}
function openLateViolSheet(idx) {
  const s = currentStudents[idx]; if (!s) return;
  const target = { id: s.id, ban: s.ban, num: s.num, name: s.name, group: loadedGroup };
  _violTarget = target;
  openViolSheet(target, { violType: '무단 지각' });
}

async function toggleRecurringLeave(idx) {
  const s = currentStudents[idx]; if (!s) return;
  if (!s.isRecurring && !(s.earlyLeaveMins > 0)) {
    const el = _cdToast({ type:'amber', title:'먼저 조기 퇴실 시간을 설정하세요', sub:'' });
    setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),280); }, 2000);
    return;
  }
  s.isRecurring = !s.isRecurring;
  const swBtn = document.getElementById(`el-rec-${idx}`);
  const lbl   = document.getElementById(`el-rec-lbl-${idx}`);
  if (swBtn) swBtn.classList.toggle('on', s.isRecurring);
  if (lbl)   lbl.classList.toggle('on', s.isRecurring);
  const dayOfWeek = _getDayOfWeekNum(loadedDate);
  try {
    if (s.isRecurring) {
      await API.upsertRecurringEarlyLeave(s.id, dayOfWeek, loadedSessionText, s.earlyLeaveMins);
      showSuccessToast('매주 반복 설정됨', `${s.name} · ${s.earlyLeaveMins}분`);
    } else {
      await API.deleteRecurringEarlyLeave(s.id, dayOfWeek, loadedSessionText);
      showSuccessToast('반복 해제됨', s.name);
    }
  } catch {
    s.isRecurring = !s.isRecurring;
    if (swBtn) swBtn.classList.toggle('on', s.isRecurring);
    if (lbl)   lbl.classList.toggle('on', s.isRecurring);
    _cdToast({ type:'red', title:'저장 실패', sub:'다시 시도해 주세요' });
  }
}

/* ════════════════════════════════
   대시보드
════════════════════════════════ */
// 숫자를 이전 값에서 목표 값까지 부드럽게 굴려서 표시 (대시보드 위젯 등)
function _animateCount(el, to) {
  if (!el) return;
  const from = parseInt(el.textContent, 10) || 0;
  if (from === to) { el.textContent = to; return; }
  const dur = 420;
  const start = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3); // ease-out-cubic
  const step = now => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(from + (to - from) * ease(p));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function updateDashboard() {
  const w=document.getElementById('dashboardWidget');
  if(!currentStudents||!currentStudents.length){w.classList.remove('visible');return;}
  const total=currentStudents.length;
  const present=currentStudents.filter(s=>s.status==='출석').length;
  _animateCount(document.getElementById('dashTotal'), total);
  _animateCount(document.getElementById('dashPresent'), present);
  _animateCount(document.getElementById('dashAbsent'), total-present);
  w.classList.add('visible');
}

/* ════════════════════════════════
   저장
════════════════════════════════ */
function _setSaveBtnState(state){ const btn=document.getElementById('btnSave'); if(btn)btn.dataset.saveState=state; }

// 오늘 현재 세션 뒤에 세션이 더 남아있는지 (공휴일 세션은 제외 — 순차 세션 개념이 약함)
function _hasLaterSessionToday() {
  const opt = sessionOptions[selectedSessionIdx];
  if (!opt || opt.isHoliday) return false;
  return sessionOptions.slice(selectedSessionIdx + 1).some(o => !o.isHoliday);
}

function toggleApplyRestOfDay(idx, btn) {
  const s = currentStudents[idx];
  s.applyRestOfDay = !s.applyRestOfDay;
  btn.classList.toggle('on', s.applyRestOfDay);
  btn.setAttribute('aria-pressed', s.applyRestOfDay ? 'true' : 'false');
  const lbl = document.getElementById('rest-lbl-' + idx);
  if (lbl) lbl.classList.toggle('on', s.applyRestOfDay);
}

// 세션명 → 학생 주간 스케줄(schedule) 조회용 [요일키, 인덱스] 매핑
// api.js 내부 _schedKey와 동일한 규칙(토요일 오후1/오후2는 같은 스케줄 칸을 공유)
function _scheduleSlotForSession(sessionText, dayKey) {
  if (dayKey === 'sat') {
    if (sessionText.startsWith('오전')) return ['sat', 0];
    if (sessionText.startsWith('오후')) return ['sat', 1];
    return null;
  }
  if (sessionText.startsWith('오후')) return [dayKey, 0];
  if (sessionText.startsWith('야간')) return [dayKey, 1];
  if (sessionText.startsWith('심야')) return [dayKey, 2];
  return null;
}

// "오늘 남은 세션도 결석" 체크된 학생들을, 각자 시간표상 참여 대상인
// 이후 세션(들)에도 결석으로 미리 저장한다. (요청한 세션이 없으면 조용히 스킵)
async function _applyRestOfDayAbsences(group, date, checkerName) {
  const targets = currentStudents.filter(s => s.status === '결석' && s.applyRestOfDay);
  const laterOpts = sessionOptions.slice(selectedSessionIdx + 1).filter(o => !o.isHoliday);
  if (!targets.length || !laterOpts.length) return { applied: 0, sessions: [] };

  const parts = date.split('-');
  const dayIdx = new Date(+parts[0], +parts[1] - 1, +parts[2]).getDay();
  const dayKey = dayIdx === 6 ? 'sat' : ['sun','mon','tue','wed','thu','fri','sat'][dayIdx];

  const schedules = await Promise.all(targets.map(s => API.getStudentSchedule(s.id).catch(() => null)));

  let appliedCount = 0;
  const touchedSessions = [];
  for (const opt of laterOpts) {
    const slot = _scheduleSlotForSession(opt.text, dayKey);
    if (!slot) continue;
    const studentsForThis = [];
    targets.forEach((s, i) => {
      const sched = schedules[i];
      const val = sched?.[slot[0]]?.[slot[1]];
      if (val === 'O' || val === '방과후') {
        const reason = s.reasonType === '직접 입력' ? s.reasonText : s.reasonType;
        studentsForThis.push({ student_id: s.id, type: '결석', reason: reason || '', noCount: s.noCount || false });
      }
    });
    if (studentsForThis.length) {
      await API.saveAttendance({ group, sessionName: opt.text, date, checkerName, students: studentsForThis });
      appliedCount += studentsForThis.length;
      touchedSessions.push(opt.text.replace(' 자율학습','').replace(/\(토\)/,''));
    }
  }
  return { applied: appliedCount, sessions: touchedSessions };
}

/* ════════════════════════════════
   오프라인 저장 큐
   와이파이가 끊긴 교실에서 "출석 저장"을 눌러도 실패로 끝내지 않고
   payload를 localStorage에 쌓아뒀다가, 온라인 복귀 시(또는 앱 재실행 시)
   자동으로 순서대로 재전송한다. 서비스워커가 앱 셸을 오프라인에도 열어주므로
   교실에서 그대로 출석체크를 계속할 수 있다.
════════════════════════════════ */
const OFFLINE_QUEUE_KEY = 'gbAttOfflineQueue';
let _flushingOfflineQueue = false;

function _getOfflineQueue() {
  try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)) || []; }
  catch { return []; }
}
function _setOfflineQueue(arr) {
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(arr));
  _updateOfflineQueueChip();
}
function _queueAttendanceOffline(payload) {
  const queue = _getOfflineQueue();
  queue.push({ payload, queuedAt: new Date().toISOString() });
  _setOfflineQueue(queue);
}
function _isNetworkError(err) {
  const msg = err?.message || '';
  return msg.includes('네트워크 연결에 실패') || msg.includes('요청 시간이 초과');
}
function _updateOfflineQueueChip() {
  const chip = document.getElementById('offlineQueueChip');
  if (!chip) return;
  const n = _getOfflineQueue().length;
  if (n > 0) {
    document.getElementById('offlineQueueChipText').textContent = `오프라인 저장 대기 ${n}건 · 탭하여 재시도`;
    chip.classList.add('show');
  } else {
    chip.classList.remove('show');
  }
}
// silent=true면 재전송할 게 없거나 여전히 실패해도 토스트를 띄우지 않는다
// (온라인 이벤트·주기적 재시도처럼 사용자가 직접 누른 게 아닌 경우).
async function _flushOfflineQueue(manual) {
  if (_flushingOfflineQueue) return;
  const queue = _getOfflineQueue();
  if (!queue.length) { if (manual) showSuccessToast('대기 중인 기록이 없어요'); return; }
  _flushingOfflineQueue = true;
  let flushed = 0;
  while (queue.length) {
    try {
      await API.saveAttendance(queue[0].payload);
      queue.shift();
      _setOfflineQueue(queue);
      flushed++;
    } catch (err) {
      if (_isNetworkError(err)) {
        // 아직 오프라인 — 이 항목도 뒤에 남은 항목도 지금은 못 보낸다. 다음 online 이벤트/재시도를 기다린다.
        if (manual && flushed === 0) showSuccessToast('아직 연결이 안 됐어요', '잠시 후 자동으로 다시 시도할게요');
        break;
      }
      // 네트워크 문제가 아니라 서버가 실제로 거부한 항목 — 계속 맨 앞에 붙잡아두면
      // 뒤에 쌓인 정상 항목까지 영원히 못 나가므로, 이 항목만 빼서 알리고 나머지는 계속 진행한다.
      const failed = queue.shift();
      _setOfflineQueue(queue);
      const p = failed.payload;
      _cdToast({ type: 'red', title: '오프라인 저장 항목을 동기화하지 못했어요', sub: `${p.group} · ${p.sessionName} · ${p.date} — 직접 다시 저장해 주세요` });
    }
  }
  _flushingOfflineQueue = false;
  if (flushed > 0) {
    _cache.stats = null;
    showSuccessToast('오프라인 저장 동기화 완료', `${flushed}건 서버에 반영됐어요`);
    if (document.getElementById('view-home')?.classList.contains('active')) loadStudents(false, true);
  }
}

function submitAttendance(cb) {
  const checkerName=document.getElementById('checkerName').value.trim();
  if(!checkerName){ Swal.fire('알림','출결 확인자 성명을 입력해 주세요.','warning'); return; }

  const noReason = currentStudents.filter(s => {
    if (s.status !== '결석') return false;
    if (!s.reasonType) return true;
    if (s.reasonType === '직접 입력' && !s.reasonText?.trim()) return true;
    return false;
  });
  if (noReason.length > 0) {
    const names = noReason.map(s => `${s.ban}반 ${s.num}번 ${s.name}`).join('\n');
    Swal.fire('결석 사유 미입력', `다음 학생의 결석 사유를 입력해 주세요.\n\n${names}`, 'warning');
    return;
  }
  const btn=document.getElementById('btnSave'), bar=document.getElementById('saveBtnBar'), lbl=document.getElementById('saveBtnLabel');
  _setSaveBtnState('saving');
  if(btn){btn.classList.add('rsb-saving'); btn.disabled=true;}
  if(lbl){lbl.style.opacity='0'; setTimeout(()=>{lbl.innerHTML='<div class="spin-ring-s"></div>저장 중...'; lbl.style.opacity='1';},230);}
  const setLabel=(html,cbk)=>{ if(!lbl)return; lbl.style.opacity='0'; setTimeout(()=>{lbl.innerHTML=html; lbl.style.opacity='1'; if(cbk)cbk();},230); };
  const svgSave='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>';
  const resetBtn=(success)=>{
    if(!btn||!lbl)return;
    if(success){
      _setSaveBtnState('saved'); btn.classList.remove('rsb-saving'); btn.classList.add('rsb-done');
      setLabel('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline class="check-draw" points="20 6 9 17 4 12"/></svg> 저장 완료');
      setTimeout(()=>{
        if(bar){bar.style.transition='none'; bar.style.width='0%';}
        btn.classList.remove('rsb-done'); btn.disabled=false;
        setTimeout(()=>{if(bar)bar.style.transition='';},30);
        _setSaveBtnState('idle');
        setLabel(svgSave+' <span id="saveBtnText">출석 저장</span>');
      },1800);
    } else {
      _setSaveBtnState('idle'); btn.classList.remove('rsb-saving'); btn.disabled=false;
      if(bar){bar.style.transition='none'; bar.style.width='0%'; setTimeout(()=>{if(bar)bar.style.transition='';},30);}
      setLabel(svgSave+' <span id="saveBtnText">출석 저장</span>');
    }
  };

  /* student_id(UUID) 추가 — Supabase upsert에 필요 */
  const studentsToSave=currentStudents.map(s=>{ let r=''; if(s.status==='결석'){r=(s.reasonType==='직접 입력')?s.reasonText:s.reasonType;} return{...s,student_id:s.id,type:s.status,reason:r,noCount:s.noCount||false}; });
  const payload={group:loadedGroup,sessionName:loadedSessionText,date:loadedDate,checkerName,students:studentsToSave};

  API.saveAttendance(payload)
    .then(async ()=>{
      hasUnsavedChanges=false; resetBtn(true);
      _cache.stats = null;

      let restInfo = null;
      try { restInfo = await _applyRestOfDayAbsences(loadedGroup, loadedDate, checkerName); }
      catch (_) { /* 이후 세션 일괄 적용은 실패해도 본 저장은 이미 끝났으므로 조용히 무시 */ }

      if (restInfo && restInfo.applied > 0) {
        showSuccessToast('저장 완료', `${loadedGroup} · ${loadedSessionText} + ${restInfo.sessions.join('/')} 결석 ${restInfo.applied}건 적용`);
      } else {
        showSuccessToast('저장 완료',loadedGroup+' · '+loadedSessionText);
      }
      setTimeout(()=>{if(cb)cb(); else loadStudents(false,true);},1800);
    })
    .catch((err)=>{
      // 네트워크 문제로 실패한 경우 — 오류로 끝내지 않고 로컬 큐에 쌓아둔다.
      // (서버가 거부한 경우, 즉 실제 오류는 그대로 안내한다.)
      if (_isNetworkError(err)) {
        _queueAttendanceOffline(payload);
        hasUnsavedChanges = false;
        resetBtn(true);
        const el = _cdToast({ type:'amber', title:'오프라인 저장됨', sub:'연결되면 자동으로 서버에 저장할게요' });
        setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),280); }, 2600);
        return;
      }
      resetBtn(false); Swal.fire('오류 발생','저장하지 못했습니다.','error');
    });
}

/* ════════════════════════════════
   결과보기
════════════════════════════════ */
function viewAllResults() {
  const opt = sessionOptions[selectedSessionIdx];
  if (!opt) { Swal.fire('알림','선택된 자습 시간이 없습니다.','info'); return; }
  const date = document.getElementById('dateInput').value;

  const absentees = currentStudents.filter(s => s.status === '결석');
  const checkerName = document.getElementById('checkerName').value.trim();

  const sessShort = opt.text.replace(' 자율학습','');
  let report = `[${loadedGroup} 자율학습 현황]\n`;
  report += `▪ 일시: ${date} (${sessShort})\n`;
  if (checkerName) report += `▪ 확인자: ${checkerName}\n`;
  report += '----------------------------------\n';
  if (!absentees.length) {
    report += '전원 출석하였습니다.\n';
  } else {
    absentees.forEach(s => {
      const reason = s.reasonType === '직접 입력' ? s.reasonText : s.reasonType;
      const reasonSuffix = reason ? ` (${reason})` : '';
      report += `- ${s.ban}반 ${s.num}번 ${s.name} [결석]${reasonSuffix}\n`;
    });
  }
  report += '----------------------------------';

  _openResultSheet(report, absentees, date, opt.text, currentStudents.length);
}

function _openResultSheet(reportText, absentees, date, session, total) {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '2100';
  const sheet = document.createElement('div');
  sheet.className = 'vh-sheet';

  const d = new Date(date), dn = ['일','월','화','수','목','금','토'];
  const dl = `${d.getMonth()+1}월 ${d.getDate()}일 (${dn[d.getDay()]})`;
  const sessShort = session.replace(' 자율학습','');

  sheet.innerHTML = `
    <div class="vh-header">
      <div class="vh-handle"></div>
      <div class="vh-title-row">
        <div class="vh-student-info">
          <div class="vh-name">전체 결과</div>
          <div class="vh-meta">${dl} · <span style="color:var(--blue);font-weight:700;">${sessShort}</span></div>
        </div>
        <button class="vh-close-btn" id="_rsClose" aria-label="닫기">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="vh-body" id="_rsBody"></div>
    <div class="vh-add-btn-row">
      <button class="vh-add-btn is-green" id="_rsCopyBtn">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
        텍스트 복사
      </button>
      <button class="vh-add-btn is-blue" id="_rsShareBtn" style="display:none;">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
        공유하기
      </button>
    </div>`;
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 420); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_rsClose').addEventListener('click', close);
  sheet.querySelector('#_rsCopyBtn').addEventListener('click', () => {
    navigator.clipboard.writeText(reportText).then(() => showSuccessToast('클립보드에 복사됐어요'));
  });
  // 모바일(카톡/문자 앱 대상 Web Share API 지원 브라우저)에서만 공유 버튼 노출.
  // 미지원 환경(대부분의 PC 브라우저)은 기존 복사 버튼만 그대로 보인다.
  const shareBtn = sheet.querySelector('#_rsShareBtn');
  if (navigator.share) {
    shareBtn.style.display = '';
    shareBtn.addEventListener('click', async () => {
      try { await navigator.share({ text: reportText }); }
      catch (err) {
        if (err?.name === 'AbortError') return; // 사용자가 공유 취소 — 조용히 무시
        navigator.clipboard.writeText(reportText).then(() => showSuccessToast('공유에 실패해 클립보드에 복사했어요'));
      }
    });
  }

  _renderReportFromStudents(sheet.querySelector('#_rsBody'), absentees, total);
}

function _renderReportFromStudents(body, absentees, total) {
  const presentCount = total - absentees.length;
  let html = `<div class="vh-money-bar" style="margin-bottom:16px;">
    <div class="vh-money-card"><div class="vh-money-n" style="color:var(--ink-2)">${total}</div><div class="vh-money-l">총원</div></div>
    <div class="vh-money-card"><div class="vh-money-n" style="color:var(--green)">${presentCount}</div><div class="vh-money-l">출석</div></div>
    <div class="vh-money-card"><div class="vh-money-n" style="color:var(--red)">${absentees.length}</div><div class="vh-money-l">결석</div></div>
  </div>`;
  if (!absentees.length) {
    html += `<div class="cd-empty"><div class="cd-empty-icon" style="background:var(--green-dim);color:var(--green);"><svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div><div class="cd-empty-text" style="color:var(--green);font-weight:700;font-size:14px;">전원 출석하였습니다!</div></div>`;
  } else {
    const grouped = {};
    absentees.forEach(s => {
      const ban = s.ban + '반';
      if (!grouped[ban]) grouped[ban] = [];
      const reason = s.reasonType === '직접 입력' ? s.reasonText : s.reasonType;
      const label = `${s.num}번 ${_esc(s.name)}${reason ? ` (${_esc(reason)})` : ''}`;
      grouped[ban].push({ label, hasReason: !!reason });
    });
    let blockIdx = 0;
    for (const [ban, studs] of Object.entries(grouped)) {
      html += `<div class="report-class-block" style="animation-delay:${blockIdx*60}ms;"><div class="report-class-title">${ban}</div><div>`;
      studs.forEach(stu => { html += `<span class="report-student-chip ${stu.hasReason?'has-reason':''}">${stu.label}</span>`; });
      html += `</div></div>`;
      blockIdx++;
    }
  }
  body.innerHTML = html;
}

