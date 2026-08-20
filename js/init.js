// ════════════════════════════════════════
//  init.js — 초기화(window.onload)
//  (app.js에서 분리됨. 반드시 다른 모든 js 파일 뒤에 로드할 것)
// ════════════════════════════════════════

/* ════════════════════════════════
   초기화
════════════════════════════════ */
// 출석 체크 중 저장하지 않고 탭을 닫거나 새로고침하면 경고 (모바일에서 흔히 발생)
window.addEventListener('beforeunload', (e) => {
  if (!hasUnsavedChanges) return;
  e.preventDefault();
  e.returnValue = '';
});

// 온라인 복귀 시 오프라인 큐 자동 재전송
window.addEventListener('online', () => _flushOfflineQueue(false));

// 출석체크 미완료 알림 — 오늘 자율학습이 있는 날인데(일요일·"세션 없음"으로
// 등록된 날 제외) 특정 시각이 지나도록 어떤 그룹도 출석 저장을 안 했으면
// 한 번 알려준다. 시험 기간·모의고사처럼 자습이 아예 없는 날은 개발자 메뉴 →
// 공휴일 설정에서 해당 날짜의 오전/오후 체크를 모두 해제해두면 세션 자체가
// 없는 날로 처리되어 이 알림도 자동으로 뜨지 않는다.
// ⚠ 2026-08-19 요청으로 일단 꺼둠(ATTENDANCE_REMINDER_ENABLED = false) — 필요해지면 true로.
const ATTENDANCE_REMINDER_ENABLED = false;
function _maybeShowAttendanceReminder() {
  if (!ATTENDANCE_REMINDER_ENABLED) return;
  const todayStr = _todayStr();
  const day = new Date(todayStr).getDay();
  if (!_computeSessionOptions(todayStr).length) return; // 일요일이거나 세션이 등록되지 않은 날

  const now = new Date();
  const hm = now.getHours() * 100 + now.getMinutes();
  const cutoff = (day === 6) ? 1300 : 1900; // 세션 자동선택과 동일한 기준(오후 자습이 시작됐을 시각)
  if (hm < cutoff) return;

  const flagKey = `attnReminderShown_${todayStr}`;
  if (localStorage.getItem(flagKey)) return;

  API.getAttendanceCountByDate(todayStr).then(count => {
    if (count > 0) return; // 이미 어딘가 저장된 기록이 있음
    localStorage.setItem(flagKey, '1');
    const el = _cdToast({ type:'amber', title:'오늘 출석체크가 아직 없어요', sub:'출석체크 탭에서 저장해 주세요' });
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => { switchTab('home'); el.classList.add('out'); setTimeout(()=>el.remove(),280); });
    setTimeout(()=>{ el.classList.add('out'); setTimeout(()=>el.remove(),280); }, 6000);
  }).catch(() => {});
}

window.onload = () => {
  updateThemeIcon();
  _bindPillFade('sessionPillWrap');
  _bindPillFade('rosterPillWrap');
  _updateOfflineQueueChip();
  if (navigator.onLine) _flushOfflineQueue(false); // 오프라인 상태로 앱을 껐다 켠 경우 대비

  // 날짜: sessionStorage 복원 (없으면 오늘)
  const _ssDate = sessionStorage.getItem('ss_date');
  if (_ssDate) document.getElementById('dateInput').value = _ssDate;
  else document.getElementById('dateInput').value = _todayStr();

  // 브라우저 뒤로가기 처리
  history.replaceState({ tab: 'home' }, '');
  window.addEventListener('popstate', (e) => {
    const targetTab = (e.state && e.state.tab) || 'home';
    _skipHistory = true;
    executeSwitchTab(targetTab);
    _skipHistory = false;
  });

  const savedChecker = localStorage.getItem('checkerName');
  if (savedChecker) document.getElementById('checkerName').value = savedChecker;
  // 활동 로그 버튼은 HTML 기본값이 이미 숨김(display:none)이고, 실제 표시 여부는
  // 서버에서 activity_log_enabled를 받아온 뒤(아래 API.getActivityLogEnabled) 결정한다.
  // 여기서 미리 호출하면 _activityLogOn의 기본값(true)으로 잠깐 보였다가
  // 응답이 오면 다시 숨겨지는 깜빡임이 생겨서 제거함.
  _applyInstallBtnVisibility();
  _applyRefreshBtnVisibility();
  _applySemesterLabel();
  _initPullToRefresh();
  _movePcNavIndicator('home');

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
      gSel.add(new Option('전체','전체'));
      (groups||[]).forEach(g=>{ sel.add(new Option(g,g)); gSel.add(new Option(g,g)); });
      const lastGroup = localStorage.getItem('lastGroup');
      if (lastGroup && [...sel.options].some(o => o.value === lastGroup)) {
        sel.value = lastGroup;
      }
      handleDateChange();
      hideSplash();
      setTimeout(() => {
        API.getHolidays()
          .then(h => { _holidays = h || []; handleDateChange(true); _maybeShowAttendanceReminder(); })
          .catch(() => {});
        API.getReasonTypes()
          // 예전엔 문자열 배열로 저장돼 있었음(countsAsPresent 속성 도입 전) — DB에
          // 남아있는 옛 형식을 만나도 깨지지 않게 로드 시점에 객체 형태로 보정한다.
          .then(types => { _reasonTypes = (types || []).map(t => typeof t === 'string' ? { name: t, countsAsPresent: false } : t); })
          .catch(() => {});
        API.getViolationTypes()
          .then(types => { _violationTypes = [...types, '직접 입력']; })
          .catch(() => {});
        API.getSemesterConfig()
          .then(cfg => { if (cfg) { _semesterConfig = cfg; _applySemesterLabel(); } })
          .catch(() => {});
        API.getActivityLogEnabled()
          .then(on => { _activityLogOn = on; _applyActivityBellVisibility(); checkActivityBadge(); })
          .catch(() => { checkActivityBadge(); });
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
