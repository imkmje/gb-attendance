/* ════════════════════════════════
   상수
════════════════════════════════ */
const GROUPS = ['청운반','백운 A반','백운 B반','백운 C반','백운 D반'];

const VIOLATION_TYPES = [
  '무단 지각', '무단 결석', '전자기기 무단 사용',
  '졸음', '취침', '자습 방해', '직접 입력'
];
const VIOLATION_ACTIONS = ['경고', '벌금', '직접 입력'];

/* ════════════════════════════════
   상태
════════════════════════════════ */
let currentStudents    = [];
let isAlreadySaved     = false;
let rawStatsData       = [];
let sortState          = { col:'total', asc:false };
let sessionOptions     = [];
let selectedSessionIdx = 0;
let isLocked           = false;
let hasUnsavedChanges  = false;
let loadedGroup        = '';
let loadedSessionText  = '';
let loadedDate         = '';
let longPressTimer, isLongPress = false, isScrolling = false, startY = 0, startX = 0;
let pressedCard = null, pressedIdx = -1;
let _loadingEl  = null;
let _schData    = [];
let _schDayIdx  = 0;
let _schSessFilter = new Set();
let _lockChipTimer = null;

let _rosterData        = [];
let _rosterLoaded      = false;
let _rosterActivePill  = 0;
let _violTarget        = null;
let _includeAfterSchool = false;
let _holidays = [];
let _headerClickCount = 0, _headerClickTimer = null;

const _cache = {
  stats: null,
  statsTs: 0,
  STATS_TTL: 5 * 60 * 1000,
};

/* ════════════════════════════════
   테마
════════════════════════════════ */
function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const sun = document.getElementById('iconSun'), moon = document.getElementById('iconMoon');
  if (!sun || !moon) return;
  if (isDark) { sun.style.opacity='0'; sun.style.transform='rotate(-90deg) scale(0.3)'; moon.style.opacity='1'; moon.style.transform='none'; }
  else        { sun.style.opacity='1'; sun.style.transform='none'; moon.style.opacity='0'; moon.style.transform='rotate(90deg) scale(0.3)'; }
}
function toggleTheme(e) {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('appTheme', next);
  updateThemeIcon();
}

/* ════════════════════════════════
   토스트
════════════════════════════════ */
const TOAST_DOTS = { blue:'var(--blue)', green:'var(--green)', red:'var(--red)', amber:'var(--amber)', purple:'var(--purple)' };
function _cdToast(opts) {
  const tc = document.getElementById('toast-container');
  const el = document.createElement('div'); el.className = 'cd-toast';
  const dot = opts.spinner ? '<div class="cd-toast-spin"></div>' : `<div class="cd-toast-dot" style="background:${TOAST_DOTS[opts.type]||TOAST_DOTS.blue}"></div>`;
  el.innerHTML = `${dot}<div class="cd-toast-body"><div class="cd-toast-title">${opts.title}</div>${opts.sub?`<div class="cd-toast-sub">${opts.sub}</div>`:''}</div>`;
  tc.appendChild(el); return el;
}
const showLoading = (msg) => {
  if (_loadingEl) { _loadingEl.classList.add('out'); setTimeout(()=>_loadingEl?.remove(),280); }
  _loadingEl = _cdToast({ type:'blue', title:msg, sub:'잠시만 기다려주세요', spinner:true });
};
const hideLoading = () => {
  if (_loadingEl) { _loadingEl.classList.add('out'); setTimeout(()=>{ _loadingEl?.remove(); _loadingEl=null; },280); }
};
const showSuccessToast = (msg, sub) => {
  const el = _cdToast({ type:'green', title:msg, sub:sub||'' });
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),280); },1800);
};

/* ════════════════════════════════
   Bottom Sheet (공통)
════════════════════════════════ */
function showSheet(opts) {
  const backdrop = document.createElement('div'); backdrop.className = 'custom-sheet-backdrop';
  const sheet    = document.createElement('div'); sheet.className    = 'custom-sheet';
  sheet.innerHTML = '<div class="custom-sheet-handle"></div>' +
    `<div class="custom-sheet-title">${opts.title}</div>` +
    (opts.text?`<div class="custom-sheet-text">${opts.text}</div>`:'') +
    `<div class="custom-sheet-btns">${opts.buttons.map((b,i)=>`<button class="custom-sheet-btn ${b.cls}" id="_csb${i}">${b.label}</button>`).join('')}</div>`;
  backdrop.appendChild(sheet); document.body.appendChild(backdrop);
  requestAnimationFrame(()=>requestAnimationFrame(()=>backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(),350); };
  opts.buttons.forEach((b,i)=>sheet.querySelector(`#_csb${i}`).addEventListener('click',()=>{ close(); if(b.cb)b.cb(); }));
  backdrop.addEventListener('click',e=>{ if(e.target===backdrop){ close(); const c=opts.buttons.find(b=>b.cls==='csb-cancel'); if(c&&c.cb)c.cb(); } });
}

function showLockChip() {
  if (navigator.vibrate) navigator.vibrate(20);
  const chip = document.getElementById('lockChip'); if (!chip) return;
  chip.classList.add('show'); clearTimeout(_lockChipTimer);
  _lockChipTimer = setTimeout(()=>chip.classList.remove('show'),1800);
}

/* ════════════════════════════════
   탭 전환
════════════════════════════════ */
function switchTab(tabName) {
  if (tabName !== 'home' && hasUnsavedChanges) {
    showSheet({ title:'저장하지 않고 이동할까요?', text:'변경한 출석 기록이 저장되지 않아요.',
      buttons:[
        { label:'저장하고 이동', cls:'csb-save',   cb:()=>submitAttendance(()=>executeSwitchTab(tabName)) },
        { label:'무시하고 이동', cls:'csb-ignore', cb:()=>{ hasUnsavedChanges=false; loadStudents(false,true); executeSwitchTab(tabName); } },
        { label:'취소',          cls:'csb-cancel', cb:null }
      ]
    }); return;
  }
  executeSwitchTab(tabName);
}

function executeSwitchTab(tabName) {
  const tabs    = ['home','roster','stats','schedule'];
  const idx     = tabs.indexOf(tabName);
  const ind     = document.getElementById('tabIndicatorFluid');
  if (ind) ind.style.transform = `translateX(${idx * 100}%)`;

  document.querySelectorAll('.tab-item').forEach(el=>el.classList.remove('active'));
  const at = document.getElementById('tab-'+tabName); if(at)at.classList.add('active');
  document.querySelectorAll('.tab-view').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+tabName).classList.add('active');

  const ab  = document.getElementById('homeActionBar');
  const fab = document.getElementById('rosterFab');
  if (tabName === 'home')        { ab.classList.remove('d-none'); fab.classList.remove('visible'); }
  else if (tabName === 'roster') { ab.classList.add('d-none');    fab.classList.add('visible'); }
  else                           { ab.classList.add('d-none');    fab.classList.remove('visible'); }

  window.scrollTo(0,0);
  if (tabName === 'stats')    loadStats();
  if (tabName === 'schedule') updateGroupScheduleView();
  if (tabName === 'roster')   loadRoster();
}

/* ════════════════════════════════
   날짜 / 세션
════════════════════════════════ */
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
  const day = new Date(dateStr).getDay();
  sessionOptions=[]; selectedSessionIdx=0;

  const holiday = _holidays.find(h => h.date === dateStr);

  if (day===0) {
    document.getElementById('sessionPillWrap').innerHTML='';
    document.getElementById('studentContainer').innerHTML='<div class="col-12 text-center py-5" style="color:var(--ink-3);font-weight:600;">일요일은 자습이 없습니다.</div>';
    document.getElementById('dashboardWidget').classList.remove('visible'); return;
  }

  if (holiday) {
    if (holiday.am) sessionOptions.push({text:'오전 자율학습(공휴일)', value:'HOL_AM', isHoliday:true});
    if (holiday.pm) sessionOptions.push({text:'오후 자율학습(공휴일)', value:'HOL_PM', isHoliday:true});
    if (!sessionOptions.length) {
      document.getElementById('sessionPillWrap').innerHTML='';
      document.getElementById('studentContainer').innerHTML='<div class="col-12 text-center py-5" style="color:var(--ink-3);font-weight:600;">설정된 세션이 없습니다.</div>';
      document.getElementById('dashboardWidget').classList.remove('visible'); return;
    }
  } else if (day===6) {
    sessionOptions=[{text:"오전 자율학습(토)",value:"19"},{text:"오후 자율학습(토)",value:"20"}];
  } else {
    const base=4+(day-1)*3;
    sessionOptions=[{text:"오후 자율학습",value:String(base)},{text:"야간 자율학습",value:String(base+1)},{text:"심야 자율학습",value:String(base+2)}];
  }
  const today=new Date();
  if (new Date(dateStr).toDateString()===today.toDateString()) {
    const hm=today.getHours()*100+today.getMinutes();
    if (day===6){if(hm>=1300)selectedSessionIdx=1;}
    else{if(hm>=2110)selectedSessionIdx=2; else if(hm>=1900)selectedSessionIdx=1;}
  }
  renderSessionPills(); loadStudents();
}

function _movePillSlider(activeBtn) {
  const wrap   = document.getElementById('sessionPillWrap');
  const slider = document.getElementById('sessionPillSlider');
  if (!slider||!activeBtn||!wrap) return;
  const btnLeft=activeBtn.offsetLeft, btnW=activeBtn.offsetWidth;
  if (btnW===0) return;
  slider.style.width=btnW+'px'; slider.style.transform='translateX('+btnLeft+'px)';
}

function renderSessionPills() {
  const wrap=document.getElementById('sessionPillWrap');
  wrap.innerHTML='<div class="session-pill-slider" id="sessionPillSlider"></div>'+
    sessionOptions.map((opt,i)=>`<button class="session-pill${i===selectedSessionIdx?' active':''}" onclick="selectSessionPill(${i})">${opt.text}</button>`).join('');
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
  return opt && (opt.text === '오후 자율학습' || opt.text === '오후 자율학습(토)');
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

function _applyStudentResult(res,group,opt,date) {
  if(!res||!res.list){ document.getElementById('studentContainer').innerHTML='<div class="col-12 text-center py-5" style="color:var(--red);font-weight:600;">서버 오류가 발생했습니다.</div>'; return; }
  currentStudents=res.list; isAlreadySaved=res.isAlreadySaved;
  loadedGroup=group; loadedSessionText=opt.text; loadedDate=date; hasUnsavedChanges=false;
  const txt=document.getElementById('saveBtnText'); if(txt)txt.textContent=isAlreadySaved?'출석 수정':'출석 저장';
  renderStudents();
}

function renderStudents() {
  const container=document.getElementById('studentContainer');
  if(!currentStudents.length){
    container.innerHTML='<div class="col-12 text-center py-5" style="color:var(--ink-3);font-weight:600;">해당 조건에 학생이 없습니다.</div>';
    return updateDashboard();
  }
  container.innerHTML=currentStudents.map((s,idx)=>{
    const absentBadge=s.absentCount>0?`<span class="absent-count-badge">결석 ${s.absentCount}회</span>`:'';
    const isAbsent=(s.status==='결석');
    return `<div class="student-card ${isAbsent?'absent':'present'}"
           onpointerdown="startPress(${idx},event)" onpointerup="endPress(${idx},event)"
           onpointermove="handlePointerMove(event)" onpointercancel="cancelPress()">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
          <div style="min-width:0;">
            <div class="s-meta">${s.ban}반 ${s.num}번${absentBadge}</div>
            <div class="s-name">${s.name}</div>
          </div>
          <span class="s-badge ${isAbsent?'absent':'present'}">${s.status}</span>
        </div>
        <div class="reason-drop" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
          <div class="reason-drop-overflow"><div class="reason-drop-inner">
            <select class="cd-reason-select" onchange="changeReasonType(${idx},this.value,this)">
              <option value="" ${!s.reasonType?'selected':''}>결석 사유 선택</option>
              <option value="학원 보강" ${s.reasonType==='학원 보강'?'selected':''}>학원 보강</option>
              <option value="병결"      ${s.reasonType==='병결'?'selected':''}>병결</option>
              <option value="개인 사정" ${s.reasonType==='개인 사정'?'selected':''}>개인 사정</option>
              <option value="직접 입력" ${s.reasonType==='직접 입력'?'selected':''}>직접 입력</option>
            </select>
            <div style="position:relative;display:${s.reasonType==='직접 입력'?'block':'none'}">
              <input type="text" class="cd-reason-input" placeholder="상세 사유 입력" value="${s.reasonText||''}" oninput="changeReasonText(${idx},this.value)">
              <span class="clear-input-btn" onclick="clearReasonText(${idx},this)">&times;</span>
            </div>
            <div class="nocount-row" onclick="event.stopPropagation()" onpointerdown="event.stopPropagation()" onpointerup="event.stopPropagation()">
              <button class="nocount-sw${s.noCount?' on':''}" id="nocount-sw-${idx}" onclick="toggleNoCount(${idx},this)">
                <div class="nocount-sw-thumb"></div>
              </button>
              <span class="nocount-label${s.noCount?' on':''}" id="nocount-lbl-${idx}">노카운트 <span style="font-weight:500;opacity:0.7;">(결석 횟수 미산입)</span></span>
            </div>
          </div></div>
        </div>
        ${s.reason&&!s.reasonType?`<div class="reason-text">⚠ ${s.reason}</div>`:''}
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
  if(s.status==='출석'){s.reasonType='';s.reasonText='';s.noCount=false;}
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
   대시보드
════════════════════════════════ */
function updateDashboard() {
  const w=document.getElementById('dashboardWidget');
  if(!currentStudents||!currentStudents.length){w.classList.remove('visible');return;}
  const total=currentStudents.length;
  const present=currentStudents.filter(s=>s.status==='출석').length;
  document.getElementById('dashTotal').textContent=total;
  document.getElementById('dashPresent').textContent=present;
  document.getElementById('dashAbsent').textContent=total-present;
  w.classList.add('visible');
}

/* ════════════════════════════════
   저장
════════════════════════════════ */
function _setSaveBtnState(state){ const btn=document.getElementById('btnSave'); if(btn)btn.dataset.saveState=state; }

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
      setLabel('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 저장 완료');
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
    .then(()=>{
      hasUnsavedChanges=false; resetBtn(true);
      showSuccessToast('저장 완료',loadedGroup+' · '+loadedSessionText);
      _cache.stats = null;
      setTimeout(()=>{if(cb)cb(); else loadStudents(false,true);},1800);
    })
    .catch(()=>{ resetBtn(false); Swal.fire('오류 발생','저장하지 못했습니다.','error'); });
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

  document.getElementById('resultBox').innerText = report;
  _renderReportFromStudents(absentees, date, opt.text);
  new bootstrap.Modal(document.getElementById('resultModal')).show();
}

function _renderReportFromStudents(absentees, date, session) {
  const d = new Date(date), dn = ['일','월','화','수','목','금','토'];
  const dl = `${d.getMonth()+1}월 ${d.getDate()}일 (${dn[d.getDay()]})`;
  let html = `<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--bg-deep);"><div style="font-size:14px;font-weight:700;color:var(--ink);display:flex;align-items:center;gap:8px;">📋 ${dl} <span style="color:var(--blue);">${session.replace(' 자율학습','')}</span></div></div>`;
  if (!absentees.length) {
    html += '<div style="text-align:center;padding:24px 0;color:var(--green);font-weight:700;font-size:15px;">✅ 전원 출석하였습니다!</div>';
  } else {
    const grouped = {};
    absentees.forEach(s => {
      const ban = s.ban + '반';
      if (!grouped[ban]) grouped[ban] = [];
      const reason = s.reasonType === '직접 입력' ? s.reasonText : s.reasonType;
      const label = `${s.num}번 ${s.name}${reason ? ` (${reason})` : ''}`;
      grouped[ban].push({ label, hasReason: !!reason });
    });
    for (const [ban, studs] of Object.entries(grouped)) {
      html += `<div class="report-class-block"><div class="report-class-title">${ban}</div><div>`;
      studs.forEach(stu => { html += `<span class="report-student-chip ${stu.hasReason?'has-reason':''}">${stu.label}</span>`; });
      html += `</div></div>`;
    }
  }
  document.getElementById('reportPreview').innerHTML = html;
}

function copyResult(){ const t=document.getElementById('resultBox').innerText; navigator.clipboard.writeText(t).then(()=>showSuccessToast('클립보드에 복사됐어요')); }

/* ════════════════════════════════
   통계
════════════════════════════════ */
function loadStats() {
  if (_cache.stats && (Date.now() - _cache.statsTs) < _cache.STATS_TTL) {
    _applyStatsData(_cache.stats);
    return;
  }
  showLoading('정산 중...');
  API.calculateStats()
    .then(data=>{
      hideLoading();
      _cache.stats  = data;
      _cache.statsTs = Date.now();
      _applyStatsData(data);
    })
    .catch(()=>{ hideLoading(); Swal.fire('오류','데이터를 가져오지 못했습니다.','error'); });
}

function _applyStatsData(data) {
  rawStatsData = data;
  const sorted = [...data].sort((a,b) => b.total - a.total);
  const medals = ['🥇','🥈','🥉'];
  let top3Html = '';
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    if (sorted[i].total <= 0) break;
    top3Html += `<span style="display:inline-flex;align-items:center;gap:6px;background:var(--bg-deep);border-radius:var(--radius);box-shadow:var(--sh-sm);padding:8px 14px;font-size:13px;font-weight:700;color:var(--ink);white-space:nowrap;font-family:var(--font);">${medals[i]} ${sorted[i].group} ${sorted[i].name} <span style="color:var(--blue);font-weight:800;">${sorted[i].total.toFixed(1)}H</span></span>`;
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
function handleSort(col){ sortState.asc=(sortState.col===col)?!sortState.asc:true; sortState.col=col; filterStats(); }
function filterStats(){
  const g=document.getElementById('filterStudyGroup').value, c=document.getElementById('filterClass').value;
  let filtered=rawStatsData.filter(d=>(g==='전체'||d.group===g)&&(c==='전체'||d.ban.toString()===c.replace('반','')));
  filtered = filtered.map(r => {
    const total = (r.attendCount || 0) + (r.absentCount || 0);
    const rate  = total > 0 ? Math.round((r.attendCount || 0) / total * 100) : null;
    return { ...r, attendRate: rate ?? -1 };
  });
  filtered.sort((a,b)=>{ let vA=a[sortState.col],vB=b[sortState.col]; if(sortState.col==='ban'){vA=parseInt(vA);vB=parseInt(vB);} return sortState.asc?(vA>vB?1:-1):(vA<vB?1:-1); });
  document.getElementById('statsBody').innerHTML=filtered.map(r=>{
    const total    = (r.attendCount || 0) + (r.absentCount || 0);
    const ratePct  = total > 0 ? Math.round((r.attendCount || 0) / total * 100) : null;
    const rateColor = ratePct === null ? 'var(--ink-4)'
                    : ratePct >= 90   ? 'var(--green)'
                    : ratePct >= 70   ? 'var(--amber)'
                    : 'var(--red)';
    const rateHtml  = ratePct !== null
      ? `<span style="font-weight:800;color:${rateColor};">${ratePct}%</span><span style="font-size:10px;color:var(--ink-4);margin-left:3px;">(${r.attendCount}/${total})</span>`
      : `<span style="color:var(--ink-4);">—</span>`;
    return `
    <tr style="border-bottom:1px solid var(--bg-deep);">
      <td style="color:var(--ink);">${r.ban}반</td><td style="color:var(--ink);">${r.num}번</td>
      <td style="font-weight:700;color:var(--ink);">${r.name}</td>
      <td style="font-size:12px;color:var(--ink-3);">${r.group}</td>
      <td style="font-weight:700;color:var(--blue);">${r.total.toFixed(1)}시간</td>
      <td>${rateHtml}</td>
      <td style="font-weight:700;color:var(--red);">${r.absentCount}회</td>
    </tr>`;
  }).join('');
}

/* ════════════════════════════════
   시간표
════════════════════════════════ */
function updateGroupScheduleView() {
  const group=document.getElementById('scheduleGroupSelect').value;
  const title=document.getElementById('schTitle');
  if(title){const nodes=Array.from(title.childNodes); const tn=nodes.reverse().find(n=>n.nodeType===3); if(tn)tn.textContent=' '+group+' 주간 자습 편성표';}
  const listEl=document.getElementById('scheduleCardList'), dayContent=document.getElementById('schDayContent');
  if(listEl)listEl.innerHTML='<div class="text-center py-5" style="color:var(--ink-3);font-weight:600;">불러오는 중...</div>';
  const dayLabels=['월','화','수','목','금'], sessLabels=['오','야','심'], satLabels=['전','후'];

  API.getGroupSchedule(group)
    .then(data=>{
      _schData=data||[];
      if(!listEl)return;
      if(!_schData.length){listEl.innerHTML='<div class="text-center py-5" style="color:var(--ink-3);font-weight:600;">데이터가 없습니다.</div>'; if(dayContent)dayContent.innerHTML=''; return;}
      listEl.innerHTML=_schData.map(s=>{
        let dgh='';
        for(let d=0;d<5;d++){
          let cells='';
          for(let j=0;j<3;j++){const val=s.schedule[d*3+j]; const cls=val==='O'?'sch-cell-on':(val==='방과후'?'sch-cell-after':'sch-cell-off'); const lbl=val==='O'?sessLabels[j]:(val==='방과후'?'방':''); cells+=`<div class="sch-cell ${cls}">${lbl}</div>`;}
          dgh+=`<div class="sch-day-wrap"><div class="sch-day-lbl">${dayLabels[d]}</div><div class="sch-day-group">${cells}</div></div>`;
        }
        let satCells='';
        for(let j=0;j<2;j++){const val=s.schedule[15+j]; satCells+=`<div class="sch-cell ${val==='O'?'sch-cell-on':'sch-cell-off'}">${val==='O'?satLabels[j]:''}</div>`;}
        dgh+=`<div class="sch-sep"></div><div class="sch-day-wrap sch-sat"><div class="sch-day-lbl">토</div><div class="sch-day-group">${satCells}</div></div>`;
        return `<div class="sch-card-row"><div class="sch-top-row"><span class="sch-num-cell">${s.ban}반 ${s.num}번</span><span class="sch-name-cell">${s.name}</span><span class="sch-group-cell">${group}</span></div><div class="sch-days">${dgh}</div></div>`;
      }).join('');
      _schSessFilter.clear(); buildSessFilterChips(_schDayIdx); renderSchDay(_schDayIdx);
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        const ind=document.getElementById('schPillIndicator'); if(ind)ind.style.transition='none';
        _moveSchPillSlider(document.getElementById('schTab-all'));
        requestAnimationFrame(()=>{const ind=document.getElementById('schPillIndicator'); if(ind)ind.style.transition='';});
      }));
    })
    .catch(()=>{if(listEl)listEl.innerHTML='<div class="text-center py-5" style="color:var(--red);font-weight:600;">오류가 발생했습니다.</div>';});
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
  const group=document.getElementById('scheduleGroupSelect').value;
  let filtered=_schData;
  if(_schSessFilter.size>0){ filtered=_schData.filter(s=>{const sess=(s.schedule||[]).slice(offset,offset+count); return[..._schSessFilter].every(j=>sess[j]==='O'||sess[j]==='방과후');}); }
  else{ filtered=_schData.filter(s=>{const sess=(s.schedule||[]).slice(offset,offset+count); return sess.some(v=>v==='O'||v==='방과후');}); }
  if(!filtered.length){content.innerHTML='<div style="text-align:center;padding:28px;font-size:13px;font-weight:600;color:var(--ink-3);">조건에 맞는 학생이 없어요</div>'; return;}
  content.innerHTML=filtered.map(s=>{
    const sess=(s.schedule||[]).slice(offset,offset+count);
    const sessCells=sess.map((val,j)=>{ const cls=val==='O'?'sds-on':(val==='방과후'?'sds-aft':'sds-off'); const label=val==='방과후'?'방과후':sessLabels[j]; return`<span class="sch-dr-s ${cls}">${label}</span>`; }).join('');
    return`<div class="sch-day-row"><div class="sch-dr-num">${s.num}번</div><div style="flex:1;min-width:0;"><div class="sch-dr-name">${s.name}</div><span class="sch-dr-grp" style="display:inline-block;margin-top:2px;">${group}</span></div><div class="sch-dr-sess">${sessCells}</div></div>`;
  }).join('');
}

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
  const labels = ['전체', ...GROUPS];
  wrap.innerHTML = '<div class="roster-pill-slider" id="rosterPillSlider"></div>' +
    labels.map((lbl, i) => `<button class="roster-pill${i===_rosterActivePill?' active':''}" onclick="selectRosterPill(${i})">${lbl}</button>`).join('');
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

function _renderRosterCards() {
  const container = document.getElementById('rosterContainer');
  const filtered = _rosterActivePill === 0
    ? _rosterData
    : _rosterData.filter(s => s.group === GROUPS[_rosterActivePill - 1]);

  if (!filtered.length) {
    container.innerHTML = '<div class="text-center py-5" style="color:var(--ink-3);font-weight:600;">명단이 없습니다.</div>';
    return;
  }

  let html = '';
  if (_rosterActivePill === 0) {
    GROUPS.forEach(g => {
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
    const [ban, num, name, group] = card.dataset.sid.split('_');
    openViolHistory({
      ban, num,
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
      const [ban, num, name, group] = card.dataset.sid.split('_');
      _violTarget = {
        ban, num,
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
  return `<div class="roster-card${violClass}" data-sid="${s.ban}_${s.num}_${encodeURIComponent(s.name)}_${encodeURIComponent(s.group)}">
    <div class="rc-num">${s.ban}반 ${s.num}번</div>
    <div class="rc-name">${s.name}</div>
    <div style="display:flex;flex-wrap:wrap;gap:3px;justify-content:center;margin-top:4px;">
      ${absentBadge}${violBadge}
    </div>
  </div>`;
}

/* ════════════════════════════════
   위반 내역 조회 Bottom Sheet
════════════════════════════════ */
function openViolHistory(student) {
  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '2100';
  const sheet = document.createElement('div');
  sheet.className = 'vh-sheet';
  sheet.innerHTML = `
    <div class="vh-header">
      <div class="vh-handle"></div>
      <div class="vh-title-row">
        <div class="vh-student-info">
          <div class="vh-name">${student.name}</div>
          <div class="vh-meta">${student.ban}반 ${student.num}번 · ${student.group}</div>
        </div>
        <button class="vh-close-btn" id="_vhClose">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="vh-money-bar" id="_vhMoneyBar">
        <div class="vh-money-card"><div class="vh-money-n" style="color:var(--ink-2)">—</div><div class="vh-money-l">총 부과</div></div>
        <div class="vh-money-card"><div class="vh-money-n" style="color:var(--green)">—</div><div class="vh-money-l">납부</div></div>
        <div class="vh-money-card"><div class="vh-money-n" style="color:var(--red)">—</div><div class="vh-money-l">미납</div></div>
      </div>
      <div class="vh-seg-wrap">
        <div class="vh-seg-slider" id="_vhSegSlider"></div>
        <button class="vh-seg-btn active" id="_vhSegViol" onclick="_switchVhSeg('viol')">
          위반 내역 <span class="vh-seg-count red" id="_vhSegViolCount">—</span>
        </button>
        <button class="vh-seg-btn" id="_vhSegAbsent" onclick="_switchVhSeg('absent')">
          결석 기록 <span class="vh-seg-count amber" id="_vhSegAbsentCount">—</span>
        </button>
      </div>
    </div>
    <div class="vh-body" id="_vhBody">
      <div style="display:flex;flex-direction:column;gap:10px;">
        ${Array.from({length:3}).map(()=>`<div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-md);padding:14px;display:flex;flex-direction:column;gap:8px;"><div class="cd-skeleton" style="height:14px;width:55%;"></div><div class="cd-skeleton" style="height:10px;width:35%;"></div></div>`).join('')}
      </div>
    </div>
    <button class="vh-add-btn" id="_vhAddBtn">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
      위반 등록
    </button>`;
  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(()=>requestAnimationFrame(()=>backdrop.classList.add('show')));
  const closeSheet = () => { backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(), 420); };
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) closeSheet(); });
  sheet.querySelector('#_vhClose').addEventListener('click', closeSheet);
  sheet.querySelector('#_vhAddBtn').addEventListener('click', ()=>{ closeSheet(); _violTarget=student; setTimeout(()=>openViolSheet(student),370); });
  window._vhStudent=student; window._vhSheet=sheet; window._vhMoneyBar=sheet.querySelector('#_vhMoneyBar');
  window._vhRecords=null; window._vhAbsents=null; window._vhActiveSeg='viol';
  let loaded=0;
  const checkBoth=()=>{
    if(++loaded<2)return;
    const vc=sheet.querySelector('#_vhSegViolCount'); const ac=sheet.querySelector('#_vhSegAbsentCount');
    if(vc)vc.textContent=(window._vhRecords||[]).length;
    if(ac)ac.textContent=(window._vhAbsents||[]).length;
    _renderVhActiveTab(sheet);
  };
  API.getViolationHistory(student.ban, student.num, student.name, student.group)
    .then(records=>{
      window._vhRecords=records||[];
      let tf=0,pf=0; window._vhRecords.forEach(r=>{const f=_parseFine(r.action);if(f>0){tf+=f;if(r.paid)pf+=f;}});
      _updateMoneyBar(window._vhMoneyBar,tf,pf); checkBoth();
    })
    .catch(()=>{window._vhRecords=[];checkBoth();});
  API.getAbsentHistory(student.ban, student.num, student.name, student.group)
    .then(absents=>{window._vhAbsents=absents||[];checkBoth();})
    .catch(()=>{window._vhAbsents=[];checkBoth();});
}

function _switchVhSeg(seg){
  window._vhActiveSeg=seg;
  const sheet=window._vhSheet; if(!sheet)return;
  const slider=sheet.querySelector('#_vhSegSlider');
  const bViol=sheet.querySelector('#_vhSegViol'); const bAbs=sheet.querySelector('#_vhSegAbsent');
  const addBtn=sheet.querySelector('#_vhAddBtn');
  if(seg==='viol'){bViol.classList.add('active');bAbs.classList.remove('active');if(slider)slider.style.transform='translateX(0)';if(addBtn)addBtn.style.display='';}
  else{bAbs.classList.add('active');bViol.classList.remove('active');if(slider)slider.style.transform='translateX(100%)';if(addBtn)addBtn.style.display='none';}
  _renderVhActiveTab(sheet);
}

function _renderVhActiveTab(sheet){
  const body=sheet.querySelector('#_vhBody');
  if(window._vhActiveSeg==='viol')_renderViolHistoryBody(body); else _renderAbsentHistoryBody(body);
}

function _renderViolHistoryBody(body){
  const records=window._vhRecords;
  if(!records||!records.length){body.innerHTML='<div class="vh-empty">위반 내역이 없습니다.</div>';return;}
  body.innerHTML=records.map((r,idx)=>{
    const fine=_parseFine(r.action),isFine=fine>0;
    const actionCls=isFine?'is-fine':(r.action.includes('경고')?'is-warn':'is-etc');
    const fineRow=isFine?`<div class="vh-fine-row"><span class="vh-fine-amount">${fine.toLocaleString()}원</span><div class="vh-pay-toggle"><button class="vh-pay-btn ${r.paid?'':'unpaid-active'}" data-idx="${idx}" data-state="unpaid" onclick="_togglePayment(this,${idx})">미납</button><button class="vh-pay-btn ${r.paid?'paid-active':''}" data-idx="${idx}" data-state="paid" onclick="_togglePayment(this,${idx})">납부</button></div></div>`:'';
    const detailRow=r.detail?`<div class="vh-item-detail">${r.detail}</div>`:'';
    return`<div class="vh-item" data-ridx="${idx}"><div class="vh-item-head"><div class="vh-type-dot"></div><div class="vh-item-main"><div class="vh-item-type">${r.violType}</div><div class="vh-item-date">${r.date}</div></div><span class="vh-item-action ${actionCls}">${r.action}</span></div>${detailRow}${fineRow}</div>`;
  }).join('');
}

function _renderAbsentHistoryBody(body){
  const absents=window._vhAbsents;
  if(!absents||!absents.length){body.innerHTML='<div class="vh-empty">결석 기록이 없습니다.</div>';return;}
  const ss=s=>s.replace(' 자율학습','');
  body.innerHTML=absents.map(a=>{
    const nc=a.noCount?`<span style="font-size:10px;font-weight:700;color:var(--green);background:var(--green-dim);border-radius:var(--radius-pill);padding:1px 8px;margin-left:6px;">노카운트</span>`:'';
    return`<div class="vh-item"><div class="vh-item-head"><div class="vh-type-dot" style="background:var(--amber);"></div><div class="vh-item-main"><div class="vh-item-type">${a.date}${nc}</div><div class="vh-item-date">${ss(a.session)}</div></div><span class="vh-item-action is-etc">${a.reason||'사유 없음'}</span></div></div>`;
  }).join('');
}

function _parseFine(action){const m=action.match(/벌금\s*([\d,]+)원/);return m?parseInt(m[1].replace(/,/g,'')):0;}

function _updateMoneyBar(bar,total,paid){
  if(!bar)return;
  const cards=bar.querySelectorAll('.vh-money-n');
  const fmt=n=>n>0?n.toLocaleString()+'원':'0원';
  if(cards[0]){cards[0].textContent=fmt(total);cards[0].style.color=total>0?'var(--ink-2)':'var(--ink-4)';}
  if(cards[1]){cards[1].textContent=fmt(paid);cards[1].style.color=paid>0?'var(--green)':'var(--ink-4)';}
  if(cards[2]){cards[2].textContent=fmt(total-paid);cards[2].style.color=(total-paid)>0?'var(--red)':'var(--ink-4)';}
}

function _togglePayment(btn,idx){
  if(!window._vhRecords)return;
  const record=window._vhRecords[idx]; const isPaid=btn.dataset.state==='paid'; record.paid=isPaid;
  const toggle=btn.closest('.vh-pay-toggle');
  toggle.querySelectorAll('.vh-pay-btn').forEach(b=>{b.classList.remove('paid-active','unpaid-active');if(b.dataset.state==='paid'&&isPaid)b.classList.add('paid-active');if(b.dataset.state==='unpaid'&&!isPaid)b.classList.add('unpaid-active');});
  let tf=0,pf=0; window._vhRecords.forEach(r=>{const f=_parseFine(r.action);if(f>0){tf+=f;if(r.paid)pf+=f;}});
  _updateMoneyBar(window._vhMoneyBar,tf,pf);
  API.updateViolationPayment(record.rowIndex, isPaid)
    .then(()=>{})
    .catch(()=>{ _cdToast({type:'red',title:'저장 실패',sub:'납부 상태를 저장하지 못했습니다.'}); });
}

/* ════════════════════════════════
   규정 위반 등록 FAB
════════════════════════════════ */
function openViolFabSheet() {
  const el = _cdToast({ type:'purple', title:'학생 카드를 꾹 눌러도 등록할 수 있어요', sub:'' });
  setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),280); }, 2400);

  const filtered = _rosterActivePill === 0
    ? _rosterData
    : _rosterData.filter(s => s.group === GROUPS[_rosterActivePill - 1]);
  if (!filtered.length) { Swal.fire('알림','먼저 명단을 불러와주세요.','info'); return; }
  _openStudentPickerSheet(filtered);
}

function _openStudentPickerSheet(students) {
  const backdrop = document.createElement('div'); backdrop.className = 'custom-sheet-backdrop';
  const sheet    = document.createElement('div'); sheet.className    = 'custom-sheet';
  sheet.style.maxHeight = '72vh';
  sheet.style.display   = 'flex';
  sheet.style.flexDirection = 'column';

  const listHtml = students.map((s,i) =>
    `<div style="display:flex;align-items:center;padding:12px 0;border-bottom:1px solid var(--bg-deep);cursor:pointer;gap:12px;" id="_vpick${i}">
       <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:var(--blue-dim);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;font-weight:800;color:var(--blue);">${s.ban}</div>
       <div style="flex:1;">
         <div style="font-size:15px;font-weight:700;color:var(--ink);">${s.name}</div>
         <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">${s.ban}반 ${s.num}번 · ${s.group}</div>
       </div>
     </div>`
  ).join('');

  sheet.innerHTML = `<div class="custom-sheet-handle"></div>
    <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;margin-bottom:14px;">규정 위반 등록 — 학생 선택</div>
    <div style="overflow-y:auto;flex:1;margin:0 -16px;padding:0 16px;">${listHtml}</div>`;

  backdrop.appendChild(sheet); document.body.appendChild(backdrop);
  requestAnimationFrame(()=>requestAnimationFrame(()=>backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(),350); };
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop)close(); });

  students.forEach((s,i) => {
    sheet.querySelector(`#_vpick${i}`).addEventListener('click', () => {
      close();
      _violTarget = s;
      setTimeout(() => openViolSheet(s), 370);
    });
  });
}

/* ════════════════════════════════
   규정 위반 등록 Bottom Sheet
════════════════════════════════ */
function openViolSheet(student) {
  const backdrop = document.createElement('div'); backdrop.className = 'custom-sheet-backdrop';
  const sheet    = document.createElement('div'); sheet.className    = 'custom-sheet';
  sheet.style.paddingBottom = '40px';

  const violOpts = VIOLATION_TYPES.map(v => `<option value="${v}">${v}</option>`).join('');
  const actOpts  = VIOLATION_ACTIONS.map(a => `<option value="${a}">${a}</option>`).join('');

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div class="viol-student-header">
      <div class="viol-student-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div>
        <div class="viol-student-name">${student.name}</div>
        <div class="viol-student-meta">${student.ban}반 ${student.num}번 · ${student.group}</div>
      </div>
    </div>

    <div class="viol-field">
      <label class="viol-label">위반 유형</label>
      <select class="viol-select" id="_vType" onchange="_onViolTypeChange(this)">
        <option value="" disabled selected>선택하세요</option>
        ${violOpts}
      </select>
      <div id="_vTypeCustomWrap" style="margin-top:8px;display:none;">
        <input type="text" class="viol-input" id="_vTypeCustom" placeholder="위반 유형을 직접 입력하세요">
      </div>
    </div>

    <div class="viol-field">
      <label class="viol-label">조치 내용</label>
      <select class="viol-select" id="_vAction" onchange="_onActionChange(this)">
        <option value="" disabled selected>선택하세요</option>
        ${actOpts}
      </select>
      <div id="_vFineWrap" style="margin-top:8px;display:none;position:relative;">
        <input type="text" inputmode="numeric" class="viol-input" id="_vFine"
          placeholder="0" style="padding-right:40px !important;"
          oninput="_formatFineInput(this)">
        <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:13px;font-weight:600;color:var(--ink-3);pointer-events:none;">원</span>
      </div>
      <div id="_vActionCustomWrap" style="margin-top:8px;display:none;">
        <input type="text" class="viol-input" id="_vActionCustom" placeholder="조치 내용을 직접 입력하세요">
      </div>
    </div>

    <div class="viol-field">
      <label class="viol-label">상세 내용 <span style="font-size:10px;color:var(--ink-4);font-weight:500;text-transform:none;">(선택)</span></label>
      <textarea class="viol-textarea" id="_vDetail" placeholder="추가 메모를 입력하세요."></textarea>
    </div>

    <button class="viol-submit-btn" id="_vSubmit" onclick="_submitViolation()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      위반 등록
    </button>`;

  backdrop.appendChild(sheet); document.body.appendChild(backdrop);
  requestAnimationFrame(()=>requestAnimationFrame(()=>backdrop.classList.add('show')));
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop){ backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(),350); } });
  window._violBackdrop = backdrop;
}

function _onViolTypeChange(sel) {
  const wrap = document.getElementById('_vTypeCustomWrap');
  if (wrap) wrap.style.display = sel.value === '직접 입력' ? 'block' : 'none';
}

function _onActionChange(sel) {
  const fineWrap   = document.getElementById('_vFineWrap');
  const customWrap = document.getElementById('_vActionCustomWrap');
  if (fineWrap)   fineWrap.style.display   = sel.value === '벌금'      ? 'block' : 'none';
  if (customWrap) customWrap.style.display = sel.value === '직접 입력' ? 'block' : 'none';
}

function _formatFineInput(el) {
  const raw    = el.value.replace(/[^0-9]/g, '');
  const cursor = el.selectionStart;
  const before = el.value.slice(0, cursor).replace(/[^0-9]/g, '').length;
  el.value = raw ? Number(raw).toLocaleString('ko-KR') : '';
  let newCursor = 0, cnt = 0;
  for (let i = 0; i < el.value.length; i++) {
    if (/[0-9]/.test(el.value[i])) cnt++;
    if (cnt === before) { newCursor = i + 1; break; }
  }
  el.setSelectionRange(newCursor || el.value.length, newCursor || el.value.length);
}

function _submitViolation() {
  let vType   = document.getElementById('_vType')?.value;
  let vAction = document.getElementById('_vAction')?.value;
  const vDetail = document.getElementById('_vDetail')?.value.trim();

  if (vType === '직접 입력') {
    const custom = document.getElementById('_vTypeCustom')?.value.trim();
    if (!custom) { Swal.fire('알림','위반 유형을 직접 입력해 주세요.','warning'); return; }
    vType = custom;
  }
  if (vAction === '직접 입력') {
    const custom = document.getElementById('_vActionCustom')?.value.trim();
    if (!custom) { Swal.fire('알림','조치 내용을 직접 입력해 주세요.','warning'); return; }
    vAction = custom;
  }
  if (vAction === '벌금') {
    const fineRaw = (document.getElementById('_vFine')?.value || '').replace(/[^0-9]/g, '');
    if (!fineRaw || Number(fineRaw) <= 0) { Swal.fire('알림','벌금 금액을 입력해 주세요.','warning'); return; }
    vAction = `벌금 ${Number(fineRaw).toLocaleString('ko-KR')}원`;
  }

  if (!vType || !vAction) {
    Swal.fire('알림','위반 유형과 조치 내용을 선택해 주세요.','warning'); return;
  }
  const btn = document.getElementById('_vSubmit');
  if (btn) { btn.disabled=true; btn.innerHTML='<div class="spin-ring-s" style="border-top-color:#fff;border-color:rgba(255,255,255,0.3);"></div> 등록 중...'; }

  const payload = {
    date:      new Date().toISOString().slice(0,10),
    group:     _violTarget.group,
    ban:       _violTarget.ban,
    num:       _violTarget.num,
    name:      _violTarget.name,
    violType:  vType,
    action:    vAction,
    detail:    vDetail
  };

  API.saveViolation(payload)
    .then(() => {
      if (window._violBackdrop) { window._violBackdrop.classList.remove('show'); setTimeout(()=>window._violBackdrop?.remove(),350); }
      showSuccessToast('위반 등록 완료', `${_violTarget.name} · ${vType}`);
      _rosterLoaded = false;
      if (document.getElementById('tab-roster')?.classList.contains('active')) {
        setTimeout(()=>loadRoster(), 400);
      }
    })
    .catch(() => {
      if (btn) { btn.disabled=false; btn.innerHTML='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg> 위반 등록'; }
      Swal.fire('오류','등록하지 못했습니다. 다시 시도해 주세요.','error');
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
  API.getHolidays()
    .then(holidays => {
      hideLoading();
      _holidays = holidays || [];
      _renderDevMenuSheet();
    })
    .catch(() => { hideLoading(); _renderDevMenuSheet(); });
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
      <button id="_devClose" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

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

    <div id="_holList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;"></div>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(()=>requestAnimationFrame(()=>backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(), 420); };
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop) close(); });
  sheet.querySelector('#_devClose').addEventListener('click', close);

  sheet.querySelector('#_holDateInput').valueAsDate = new Date();
  _renderHolidayList(sheet);
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

/* ════════════════════════════════
   초기화
════════════════════════════════ */
window.onload = () => {
  updateThemeIcon();
  document.getElementById('dateInput').valueAsDate = new Date();

  const savedChecker = localStorage.getItem('checkerName');
  if (savedChecker) document.getElementById('checkerName').value = savedChecker;

  const splashSafetyTimer = setTimeout(() => {
    const splash = document.getElementById('appSplash');
    if (splash) { splash.classList.add('hide'); setTimeout(()=>splash.remove(), 400); }
  }, 10000);

  const hideSplash = () => {
    clearTimeout(splashSafetyTimer);
    const splash = document.getElementById('appSplash');
    if (splash) { setTimeout(()=>{ splash.classList.add('hide'); setTimeout(()=>splash.remove(),400); }, 500); }
  };

  API.getGroupList()
    .then(groups => {
      const sel  = document.getElementById('groupSelect');
      const gSel = document.getElementById('scheduleGroupSelect');
      sel.innerHTML=''; gSel.innerHTML='';
      (groups||[]).forEach(g=>{ sel.add(new Option(g,g)); gSel.add(new Option(g,g)); });
      const lastGroup = localStorage.getItem('lastGroup');
      if (lastGroup && [...sel.options].some(o => o.value === lastGroup)) {
        sel.value = lastGroup;
      }
      handleDateChange();
      hideSplash();
      setTimeout(() => {
        API.getHolidays()
          .then(h => { _holidays = h || []; handleDateChange(true); })
          .catch(() => {});
        if (!_rosterLoaded) {
          API.getAllMemberList()
            .then(data => { _rosterData=data||[]; _rosterLoaded=true; })
            .catch(() => {});
        }
      }, 800);
    })
    .catch(err=>{
      hideSplash();
      Swal.fire('초기 설정 에러', (err&&err.message)||'서버 연결에 실패했습니다.', 'error');
    });
};
