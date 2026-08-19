// ════════════════════════════════════════
//  violations.js — 위반 내역 조회 · 규정 위반 등록(FAB + Bottom Sheet)
//  (app.js에서 분리됨)
// ════════════════════════════════════════

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
          <div class="vh-name">${_esc(student.name)}</div>
          <div class="vh-meta">${student.ban}반 ${student.num}번 · ${_esc(student.group)}</div>
        </div>
        <button class="vh-close-btn" id="_vhClose" aria-label="닫기">
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
        <button class="vh-seg-btn" id="_vhSegSchedule" onclick="_switchVhSeg('schedule')">
          자습 세션 <span class="vh-seg-count blue" id="_vhSegScheduleCount">—</span>
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
  window._vhRecords=null; window._vhAbsents=null; window._vhSchedule=null; window._vhActiveSeg='viol';
  // 세그먼트 개수(3개) 기준 슬라이더 폭을 데이터 로드 전에 즉시 맞춰둠
  // — API 응답을 기다렸다가 계산하면 그 사이 CSS 기본값(width:50%, 옛 2분할 시절 값)이
  //   잠깐 보였다가 33%로 스냅되는 게 눈에 띄었음 (특히 PC 중앙 모달에서 두드러짐)
  _updateVhSegSlider(sheet);
  let loaded=0;
  const checkBoth=()=>{
    if(++loaded<3)return;
    const vc=sheet.querySelector('#_vhSegViolCount'); const ac=sheet.querySelector('#_vhSegAbsentCount'); const sc=sheet.querySelector('#_vhSegScheduleCount');
    if(vc)vc.textContent=(window._vhRecords||[]).length;
    if(ac)ac.textContent=(window._vhAbsents||[]).length;
    if(sc)sc.textContent=_countOSessions(window._vhSchedule);
    _updateVhSegSlider(sheet);
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
  if (student.id) {
    API.getStudentSchedule(student.id)
      .then(schedule=>{window._vhSchedule=schedule||{};checkBoth();})
      .catch(()=>{window._vhSchedule={};checkBoth();});
  } else {
    window._vhSchedule={};checkBoth();
  }
}

const VH_SEGS=['viol','absent','schedule'];

// 세그먼트 슬라이더 크기/위치 갱신 (버튼 개수 기준 동적 계산) — 최초 렌더 시에도 호출 필요
function _updateVhSegSlider(sheet){
  const wrap=sheet.querySelector('.vh-seg-wrap');
  const slider=sheet.querySelector('#_vhSegSlider');
  if(!wrap||!slider)return;
  const btns=[...wrap.querySelectorAll('.vh-seg-btn')];
  const idx=Math.max(0, VH_SEGS.indexOf(window._vhActiveSeg));
  btns.forEach((b,i)=>b.classList.toggle('active', i===idx));
  slider.style.width=(100/btns.length)+'%';
  slider.style.transform=`translateX(${idx*100}%)`;
}

function _switchVhSeg(seg){
  window._vhActiveSeg=seg;
  const sheet=window._vhSheet; if(!sheet)return;
  const addBtn=sheet.querySelector('#_vhAddBtn');
  _updateVhSegSlider(sheet);
  if(addBtn)addBtn.style.display = seg==='viol' ? '' : 'none';
  _renderVhActiveTab(sheet);
}

function _renderVhActiveTab(sheet){
  const body=sheet.querySelector('#_vhBody');
  if(window._vhActiveSeg==='viol')_renderViolHistoryBody(body);
  else if(window._vhActiveSeg==='absent')_renderAbsentHistoryBody(body);
  else _renderScheduleHistoryBody(body);
}

// schedule 객체의 'O' 참여 세션 총 개수 (세그먼트 배지, 요약 등에 재사용)
function _countOSessions(sched) {
  if (!sched) return 0;
  const days = ['mon','tue','wed','thu','fri','sat'];
  let n = 0;
  for (const d of days) if (Array.isArray(sched[d])) n += sched[d].filter(v => v === 'O').length;
  return n;
}

function _renderScheduleHistoryBody(body){
  const sched = window._vhSchedule;
  const student = window._vhStudent;
  if(!sched){ body.innerHTML='<div class="vh-empty">시간표를 불러오지 못했습니다.</div>'; return; }
  const DAYS=[['mon','월'],['tue','화'],['wed','수'],['thu','목'],['fri','금']];
  const WD_LABELS=['오','야','심'], SAT_LABELS=['전','후'];
  // 참석(O)은 'O' 글자 그대로 두면 숫자 0과 헷갈리므로, 시간표 탭과 동일하게
  // 세션 약자(오/야/심, 전/후)로 표시 — 어떤 세션인지도 바로 드러나서 더 명확함
  const cellCls=v => v==='O' ? 'sch-dr-s sds-on' : (v==='방과후' ? 'sch-dr-s sds-aft' : 'sch-dr-s sds-off');
  const row=(label, vals, labels)=>{
    const arr = Array.isArray(vals) ? vals : [];
    const cells = arr.map((v,i)=>{
      const txt = v==='방과후' ? '방과후' : (v==='O' ? labels[i] : '-');
      return `<span class="${cellCls(v)}">${txt}</span>`;
    }).join('');
    return `<div class="sch-day-row"><div class="sch-dr-num">${label}</div><div class="sch-dr-sess">${cells}</div></div>`;
  };
  const rows = DAYS.map(([k,kr]) => row(kr, sched[k] && sched[k].length ? sched[k] : ['-','-','-'], WD_LABELS)).join('')
    + row('토', sched.sat && sched.sat.length ? sched.sat : ['-','-'], SAT_LABELS);
  body.innerHTML = `
    <div style="font-size:11px;color:var(--ink-4);margin-bottom:8px;">현재 등록된 자습 참여 세션입니다. (오후/야간/심야, 토 오전/오후)</div>
    <div style="background:var(--surface);border-radius:var(--radius);box-shadow:var(--sh-sm);overflow:hidden;">${rows}</div>
    <button id="_vhSchedEdit" style="margin-top:16px;width:100%;padding:12px;border-radius:var(--radius);border:none;background:var(--blue);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;box-shadow:var(--sh-blue);">세션 수정</button>`;
  const editBtn = body.querySelector('#_vhSchedEdit');
  if (editBtn) editBtn.addEventListener('click', () => {
    if (!student?.id) { Swal.fire('오류','학생 정보를 찾을 수 없습니다.','error'); return; }
    _requireTeacherAuth(() => {
      _renderScheduleEditor(student, sched, (newSched) => {
        window._vhSchedule = newSched;
        const countEl = window._vhSheet?.querySelector('#_vhSegScheduleCount');
        if (countEl) countEl.textContent = _countOSessions(newSched);
        if (window._vhActiveSeg === 'schedule') {
          const b = _vhBodyEl();
          if (b) _renderScheduleHistoryBody(b);
        }
      });
    }, { title: '교사 인증', text: '자습 세션을 수정하려면 교사 메뉴 비밀번호를 입력하세요.' });
  });
}

function _vhBodyEl(){
  const sheet = window._vhSheet;
  return sheet ? sheet.querySelector('#_vhBody') : null;
}

function _renderViolHistoryBody(body){
  const records=window._vhRecords;
  if(!records||!records.length){body.innerHTML=_emptyState('위반 내역이 없습니다.');return;}
  body.innerHTML=records.map((r,idx)=>{
    const fine=_parseFine(r.action),isFine=fine>0;
    const actionCls=isFine?'is-fine':(r.action.includes('경고')?'is-warn':'is-etc');
    const fineRow=isFine?`<div class="vh-fine-row"><span class="vh-fine-amount">${fine.toLocaleString()}원</span><div class="vh-pay-toggle"><button class="vh-pay-btn ${r.paid?'':'unpaid-active'}" data-idx="${idx}" data-state="unpaid" onclick="_togglePayment(this,${idx})">미납</button><button class="vh-pay-btn ${r.paid?'paid-active':''}" data-idx="${idx}" data-state="paid" onclick="_togglePayment(this,${idx})">납부</button></div></div>`:'';
    const detailRow=r.detail?`<div class="vh-item-detail">${_esc(r.detail)}</div>`:'';
    return`<div class="vh-item" data-ridx="${idx}"><div class="vh-item-head"><div class="vh-type-dot"></div><div class="vh-item-main"><div class="vh-item-type">${_esc(r.violType)}</div><div class="vh-item-date">${r.date}</div></div><span class="vh-item-action ${actionCls}">${_esc(r.action)}</span></div>${detailRow}${fineRow}</div>`;
  }).join('');
}

function _renderAbsentHistoryBody(body){
  const absents=window._vhAbsents;
  if(!absents||!absents.length){body.innerHTML=_emptyState('결석 기록이 없습니다.');return;}
  const ss=s=>s.replace(' 자율학습','');
  body.innerHTML=absents.map(a=>{
    const nc=a.noCount?`<span style="font-size:10px;font-weight:700;color:var(--green);background:var(--green-dim);border-radius:var(--radius-pill);padding:1px 8px;margin-left:6px;">노카운트</span>`:'';
    return`<div class="vh-item"><div class="vh-item-head"><div class="vh-type-dot" style="background:var(--amber);"></div><div class="vh-item-main"><div class="vh-item-type">${a.date}${nc}</div><div class="vh-item-date">${ss(a.session)}</div></div><span class="vh-item-action is-etc">${_esc(a.reason)||'사유 없음'}</span></div></div>`;
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

  const activeGroups = _activeGroups();
  const filtered = _rosterActivePill === 0
    ? _rosterData
    : _rosterData.filter(s => s.group === activeGroups[_rosterActivePill - 1]);
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
         <div style="font-size:15px;font-weight:700;color:var(--ink);">${_esc(s.name)}</div>
         <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">${s.ban}반 ${s.num}번 · ${_esc(s.group)}</div>
       </div>
     </div>`
  ).join('');

  sheet.innerHTML = `<div class="custom-sheet-handle"></div>
    <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;margin-bottom:14px;">규정 위반 등록 — 학생 선택</div>
    <div style="overflow-y:auto;flex:1;margin:0 -16px;padding:0 16px;">${listHtml}</div>`;

  backdrop.appendChild(sheet); document.body.appendChild(backdrop);
  requestAnimationFrame(()=>requestAnimationFrame(()=>backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(),420); };
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
function openViolSheet(student, preselect = {}) {
  const backdrop = document.createElement('div'); backdrop.className = 'custom-sheet-backdrop';
  const sheet    = document.createElement('div'); sheet.className    = 'custom-sheet';
  sheet.style.paddingBottom = '40px';

  const violOpts = _violationTypes.map(v => `<option value="${_esc(v)}">${_esc(v)}</option>`).join('');
  const actOpts  = VIOLATION_ACTIONS.map(a => `<option value="${a}">${a}</option>`).join('');

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div class="viol-student-header">
      <div class="viol-student-avatar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--purple)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      </div>
      <div>
        <div class="viol-student-name">${_esc(student.name)}</div>
        <div class="viol-student-meta">${student.ban}반 ${student.num}번 · ${_esc(student.group)}</div>
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
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop){ backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(),420); } });
  window._violBackdrop = backdrop;
  if (preselect.violType) {
    const sel = sheet.querySelector('#_vType');
    if (sel) { sel.value = preselect.violType; _onViolTypeChange(sel); }
  }
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
    date:      _todayStr(),
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
      if (window._violBackdrop) { window._violBackdrop.classList.remove('show'); setTimeout(()=>window._violBackdrop?.remove(),420); }
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

