/* ════════════════════════════════
   상수
════════════════════════════════ */
const GROUPS = ['청운반','백운 A반','백운 B반','백운 C반','백운 D반'];
const TEACHER_PW = '2821'; // 교사 메뉴/시간표 편집/명단 세션 수정 진입 시 공통으로 쓰는 비밀번호 — 바꿀 땐 여기 한 곳만

// 위반 유형 — 개발자 메뉴에서 편집 가능(결석 사유와 동일한 방식).
// 마지막 '직접 입력'은 고정 항목이며 관리 UI에는 노출되지 않음(항상 자동으로 붙임).
let _violationTypes = [
  '무단 지각', '무단 결석', '전자기기 무단 사용',
  '졸음', '취침', '자습 방해', '직접 입력'
];
const VIOLATION_ACTIONS = ['경고', '벌금', '직접 입력'];

/* ════════════════════════════════
   버전 히스토리 (개발 로그)
   n.0.0 대규모 업데이트 · 0.n.0 기능/디자인 개선 · 0.0.n 버그 수정
   최신순 — 새 배포 때마다 맨 위에 추가할 것
════════════════════════════════ */
const APP_VERSION = '2.25.0';
const CHANGELOG = [
  { v:'2.25.0', d:'2026-08-19', t:'minor', title:'대시보드에 반별 세션 점등 표시 추가 — 자습반 5개 × 세션 3칸으로 그날 어떤 반의 어떤 시간대가 출석체크됐는지 한눈에 확인' },
  { v:'2.24.0', d:'2026-08-19', t:'minor', title:'출석 저장 실패 시(네트워크 끊김) 자동 오프라인 큐잉 — 연결되면 자동 재전송, 화면 상단에 대기 건수 칩 표시' },
  { v:'2.23.0', d:'2026-08-19', t:'minor', title:'평일 저녁(19시)/토요일 오후(13시) 넘도록 그날 출석체크가 하나도 없으면 알림 — 자습 없는 날(공휴일 설정에서 세션 미등록)은 자동 제외' },
  { v:'2.22.0', d:'2026-08-19', t:'minor', title:'출석체크 "결과보기"에 공유하기 버튼 추가 — 지원 기기(모바일)에서 카톡/문자로 바로 전송, 텍스트 복사와 나란히 표시' },
  { v:'2.21.0', d:'2026-08-19', t:'minor', title:'기간 결산 "학생 전달용/교사용" 모드 구분을 없애고 체크박스 하나로 통일, 미납 벌금 0원인 학생은 태그·문구 자동 숨김, 텍스트 복사 전 미리보기 추가' },
  { v:'2.20.0', d:'2026-08-19', t:'minor', title:'기간 결산 팝업 화면 목록이 체크박스 선택에 실시간으로 반영되도록 개선(부드러운 페이드), 학생 전달용 항목에 "기간 중 지각"·"미납 벌금" 추가' },
  { v:'2.19.0', d:'2026-08-19', t:'minor', title:'기간 결산에 "학생 전달용"/"교사용" 모드 추가 — 교사용은 지각·조퇴·위반·미납 벌금까지 체크박스로 골라 복사 가능, 부드러운 슬라이드+페이드 전환' },
  { v:'2.18.2', d:'2026-08-19', t:'patch', title:'명단·통계·시간표·기간결산 검색창에 × 지우기 버튼 추가' },
  { v:'2.18.1', d:'2026-08-19', t:'patch', title:'기간 결산 텍스트 복사 항목에 "누적 자습 시간" 추가' },
  { v:'2.18.0', d:'2026-08-19', t:'minor', title:'명단·통계·기간결산 탭에 학생 이름 검색 추가, 기간결산 시작일>종료일 자동 보정, 학생 인사이트 "최근 결석 이력"을 날짜별로 병합(같은 날 여러 세션이어도 카드 하나)' },
  { v:'2.17.1', d:'2026-08-19', t:'patch', title:'기간 결산 버튼 아이콘을 확성기로 원복(텍스트 버튼 대신), 팝업 헤더의 색깔 이모지 제거 — 다른 시트들과 동일하게 텍스트만' },
  { v:'2.17.0', d:'2026-08-19', t:'minor', title:'기간 결산: 최대 연속 자습 하나로 통일, 아이콘을 텍스트 버튼으로 교체, 텍스트 복사에 누적/기간중 결석 분리 표시 + 포함 항목 체크박스 선택 추가' },
  { v:'2.16.1', d:'2026-08-19', t:'patch', title:'기간 결산 아이콘을 통계 탭과 겹치지 않는 확성기 아이콘으로 교체, 기본 조회 기간을 "이번 달"로 변경, 텍스트 복사 시 성과순 정렬+메달 표시' },
  { v:'2.16.0', d:'2026-08-19', t:'minor', title:'연속 출석 스트릭 표시 + 대시보드에 "기간 결산" 추가 (출석률·결석·최대연속, 카톡 공지용 텍스트 복사)' },
  { v:'2.15.2', d:'2026-08-19', t:'patch', title:'출석체크 스크롤 축소 애니메이션이 끊기던 문제 수정 (강제 리플로우 제거)' },
  { v:'2.15.1', d:'2026-08-19', t:'patch', title:'스크롤 시 세션 흰색 필(슬라이더)이 불안정하게 떨리던 버그 수정' },
  { v:'2.15.0', d:'2026-08-19', t:'minor', title:'출석체크 상단 필터 영역이 아이폰처럼 스크롤에 비례해 자연스럽게 축소되도록 개선' },
  { v:'2.14.0', d:'2026-08-19', t:'minor', title:'네트워크 요청 타임아웃 추가, 모바일 터치 시 hover 스타일 안 풀리던 문제 수정, 아이폰 안전영역 대응, 흐린 회색 텍스트 가독성 개선' },
  { v:'2.13.0', d:'2026-08-19', t:'minor', title:'개발자 메뉴에 학기 설정(1학기/2학기 시작일) 추가 — 통계 탭 학기 표시를 직접 조정 가능' },
  { v:'2.12.2', d:'2026-08-19', t:'patch', title:'"결과보기" 창 제목 위 아이콘 위치가 어색해 제거 (다른 시트와 통일)' },
  { v:'2.12.1', d:'2026-08-19', t:'patch', title:'학생 이름·결석 사유 등 자유 입력 텍스트가 이스케이프 없이 표시되던 부분 보안 강화(저장형 XSS 방지)' },
  { v:'2.12.0', d:'2026-08-19', t:'minor', title:'"결과보기" 창을 부트스트랩 모달 → 커스텀 시트로 전환하고 불필요해진 부트스트랩 JS 제거, 통계 학기 라벨 자동 계산' },
  { v:'2.11.1', d:'2026-08-19', t:'patch', title:'교사 비밀번호 상수화, GROUPS 중복 정의 정리' },
  { v:'2.11.0', d:'2026-08-19', t:'minor', title:'대시보드에 날짜 이동 화살표·전체 명단 보기 추가, 통계 탭에 자습반 구분 없는 전체 순위 보기 추가' },
  { v:'2.10.1', d:'2026-08-19', t:'patch', title:'학생 인사이트의 사유별 결석 집계를 하루 단위로 변경 (야간·심야 일괄 적용 시 하루 1회)' },
  { v:'2.10.0', d:'2026-08-19', t:'minor', title:'통계 탭 디자인을 다른 탭과 통일 (카드형 리스트로 개편) + 이름 클릭 시 명단과 동일한 상세 팝업 표시' },
  { v:'2.9.3', d:'2026-08-19', t:'patch', title:'대시보드 학생 인사이트의 노카운트 집계를 하루 단위로 변경 (일괄 적용해도 하루 1회)' },
  { v:'2.9.2', d:'2026-08-18', t:'patch', title:'"일괄 적용"(구 오늘 남은 세션도 결석) 토글이 실제 저장 상태를 반영하도록 수정 + 명칭 변경' },
  { v:'2.9.1', d:'2026-08-18', t:'patch', title:'서비스워커 캐시 전략을 network-first로 변경 — 배포 후에도 예전 버전이 계속 보이던 문제 해결' },
  { v:'2.9.0', d:'2026-08-18', t:'minor', title:'결석 체크 시 "오늘 남은 세션도 결석" 옵션 추가 — 시간표 대조해 야간·심야 등 일괄 적용' },
  { v:'2.8.1', d:'2026-08-18', t:'patch', title:'저장된 결석 사유가 재조회 시 복원되지 않아 결과보기·재저장에서 사라지던 버그 수정' },
  { v:'2.8.0', d:'2026-08-18', t:'minor', title:'위반 유형 관리, 삭제 전 기록 건수 확인, 벌금 현황 자습반별 소계+텍스트 복사 추가' },
  { v:'2.7.0', d:'2026-08-18', t:'minor', title:'개발자 메뉴에 개발 로그(버전 히스토리) 뷰어 추가' },
  { v:'2.6.0', d:'2026-08-18', t:'minor', title:'대시보드 탭 신설 — 오늘의 결석 현황 + 학생별 인사이트(출석률·사유별 결석·연속결석 경고 등)' },
  { v:'2.5.0', d:'2026-08-18', t:'minor', title:'설치된 앱(PWA)에서 새로고침 버튼 + 당겨서 새로고침 제스처 지원' },
  { v:'2.4.1', d:'2026-08-18', t:'patch', title:'활동 로그 종 아이콘이 로드마다 잠깐 보였다 사라지는 깜빡임 버그 수정' },
  { v:'2.4.0', d:'2026-08-18', t:'minor', title:'앱 설치 안내 시트, 명단 탭 총 인원 표시, 결과보기 모달 디자인 통일' },
  { v:'2.3.0', d:'2026-08-18', t:'minor', title:'PWA 설치 지원(홈 화면 추가) + PC Ctrl+S 출석 저장 단축키' },
  { v:'2.2.0', d:'2026-08-18', t:'minor', title:'ESC·뒤로가기로 열린 시트 닫기, 다크모드 표면 크로스페이드 통일' },
  { v:'2.1.1', d:'2026-08-18', t:'patch', title:'PC 팝업 상단 잘림, 공휴일 안내 문구, 세그먼트 슬라이더 등 버그 수정' },
  { v:'2.1.0', d:'2026-08-18', t:'minor', title:'카드 등장·대시보드 숫자·사이드바 인디케이터 애니메이션, 빈 상태·스켈레톤 UI 다듬기' },
  { v:'2.0.0', d:'2026-08-18', t:'major', title:'PC 전용 레이아웃 대규모 개편 — 사이드바 내비게이션 + 중앙 모달로 전환' },
  { v:'1.5.1', d:'2026-08-18', t:'patch', title:'활동 로그 on/off 설정을 기기별 저장에서 전역(Supabase) 설정으로 전환' },
  { v:'1.5.0', d:'2026-08-18', t:'minor', title:'활동 로그·공지사항 기능 신설 (자습 세션 변경 자동 기록 + 교사 수동 공지)' },
  { v:'1.4.1', d:'2026-08-17', t:'patch', title:'공휴일 저장 오류, 세그먼트 슬라이더 초기 폭, 반복설정 409 오류 등 버그 다수 수정' },
  { v:'1.4.0', d:'2026-08-17', t:'minor', title:'교사 메뉴 평일 공휴일 설정, 명단 탭 자습 세션 조회/수정 기능 추가' },
  { v:'1.3.0', d:'2026-07-20', t:'minor', title:'조기 퇴실·지각 기능 + 벌금 자동 연동, 필터 상태 유지, 헤더 뒤로가기 버튼' },
  { v:'1.2.0', d:'2026-06-30', t:'minor', title:'토요일 세션 분리, 결석 사유 관리, 시간표 탭 편집·전체보기·검색 기능' },
  { v:'1.1.1', d:'2026-06-29', t:'patch', title:'출석 저장·자습 세션 편성 관련 버그 다수 수정' },
  { v:'1.1.0', d:'2026-06-29', t:'minor', title:'교사 메뉴, 벌금 관리, 학생 일괄 등록, 데이터 내보내기 등 핵심 관리 기능 추가' },
  { v:'1.0.0', d:'2026-06-29', t:'major', title:'GAS(Google Apps Script) → Supabase 전환, 프레임워크 없는 순수 HTML/CSS/JS로 전면 재구축' },
];

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
let _schSearchQuery = '';
let _schDayIdx  = 0;
let _schSessFilter = new Set();
let _lockChipTimer = null;

let _rosterData        = [];
let _rosterLoaded      = false;
let _rosterActivePill  = 0;
let _rosterSearchQuery = '';
let _ssRestored        = false;
let _skipHistory       = false;
let _violTarget        = null;
let _includeAfterSchool = false;
let _holidays = [];
let _reasonTypes = ['학원 보강', '병결', '개인 사정'];
let _activityLogOn = true;
let _scheduleEditMode = false;
let _scheduleEditAuthed = false;
let _headerClickCount = 0, _headerClickTimer = null;

const _cache = {
  stats: null,
  statsTs: 0,
  STATS_TTL: 5 * 60 * 1000,
};

/* ════════════════════════════════
   유틸
════════════════════════════════ */
// 가로 스크롤되는 pill 줄(명단 그룹 필터, 세션 선택 등)에 좌우 페이드 힌트 표시
// — 스크롤바를 숨겨놔서 넘치는 pill이 있어도 스크롤 가능하다는 걸 알기 어려웠음
function _updatePillFade(id) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  const scrollable = wrap.scrollWidth > wrap.clientWidth + 1;
  wrap.classList.toggle('has-fade-r', scrollable && Math.ceil(wrap.scrollLeft + wrap.clientWidth) < wrap.scrollWidth - 1);
  wrap.classList.toggle('has-fade-l', wrap.scrollLeft > 1);
}
function _bindPillFade(id) {
  const wrap = document.getElementById(id);
  if (!wrap) return;
  wrap.addEventListener('scroll', () => _updatePillFade(id), { passive: true });
  window.addEventListener('resize', () => _updatePillFade(id));
}

// 빈 상태(empty state) 공통 마크업 — 아이콘 + 안내 문구
const _EMPTY_ICON_INBOX = '<svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>';
// HTML 이스케이프 — 학생 이름/결석 사유/직접입력 유형처럼 사용자가 자유롭게
// 타이핑한 텍스트를 innerHTML에 꽂아 넣기 전에 반드시 거쳐야 함(저장형 XSS 방지).
// 순수 텍스트를 보여줘야 하는 곳(토스트, 바텀시트 등)에서 공용으로 사용.
function _esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

function _emptyState(text, iconSvg) {
  return `<div class="cd-empty"><div class="cd-empty-icon">${iconSvg || _EMPTY_ICON_INBOX}</div><div class="cd-empty-text">${text}</div></div>`;
}

// 명단/통계/시간표/기간결산 검색창이 공유하는 × 지우기 버튼 로직.
// 입력값이 있을 때만 버튼을 보여주고, 누르면 비운 뒤 해당 필터 함수를
// 다시 호출해 전체 목록으로 돌아가게 한다.
function _updateSearchClear(inputId, clearId) {
  const inp = document.getElementById(inputId);
  const btn = document.getElementById(clearId);
  if (btn) btn.style.display = inp && inp.value ? '' : 'none';
}
function _clearSearchInput(inputId, clearId, onCleared) {
  const inp = document.getElementById(inputId);
  if (inp) inp.value = '';
  _updateSearchClear(inputId, clearId);
  onCleared('');
}

// 로컬 타임존 기준 오늘 날짜 (YYYY-MM-DD)
// ⚠ toISOString().slice(0,10) / valueAsDate=new Date() 는 UTC 기준이라
//   한국시간(UTC+9) 자정~오전 9시 사이에는 어제 날짜가 나오는 버그가 있었음 — 절대 쓰지 말 것
function _fmtYMD(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function _todayStr() { return _fmtYMD(new Date()); }

// 통계 탭 Top3 카드의 "1학년 N학기" 라벨 — 개발자 메뉴에서 설정한 학기 시작일
// (매년 반복되는 MM-DD, 예: '03-01'/'08-18') 기준으로 자동 전환된다.
// 설정 전 기본값은 학교에서 알려준 실제 2학기 시작일(8/18)로 맞춰둠.
let _semesterConfig = null; // { s1:'MM-DD', s2:'MM-DD' } — window.onload에서 서버 값 로드
const _SEMESTER_DEFAULT = { s1: '03-01', s2: '08-18' };

function _mmdd(d) { return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

function _currentSemesterLabel() {
  const cfg = _semesterConfig || _SEMESTER_DEFAULT;
  const today = _mmdd(new Date());
  // 1학기 구간[s1, s2) 안이면 1학기, 그 외(연도를 넘어가는 s2~12/31, 1/1~s1 포함)는 2학기
  const semester = (today >= cfg.s1 && today < cfg.s2) ? 1 : 2;
  return `1학년 ${semester}학기`;
}
function _applySemesterLabel() {
  const el = document.getElementById('top3SemesterLabel');
  if (el) el.textContent = _currentSemesterLabel();
}

/* ════════════════════════════════
   테마
════════════════════════════════ */
function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.querySelectorAll('.icon-sun').forEach(sun => {
    sun.style.opacity  = isDark ? '0' : '1';
    sun.style.transform = isDark ? 'rotate(-90deg) scale(0.3)' : 'none';
  });
  document.querySelectorAll('.icon-moon').forEach(moon => {
    moon.style.opacity  = isDark ? '1' : '0';
    moon.style.transform = isDark ? 'none' : 'rotate(90deg) scale(0.3)';
  });
}
function toggleTheme(e) {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('appTheme', next);
  updateThemeIcon();
}

/* ════════════════════════════════
   앱 설치 안내 (PWA)
════════════════════════════════ */
let _deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  _deferredInstallPrompt = e;
});
window.addEventListener('appinstalled', () => { _deferredInstallPrompt = null; _applyInstallBtnVisibility(); });

function _isStandaloneApp() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// 앱으로 설치되어 실행 중(standalone)일 때만 새로고침 버튼 표시
// — 일반 브라우저 탭에는 이미 주소창 새로고침/당겨서 새로고침이 있어서 안 보여줌
function _applyRefreshBtnVisibility() {
  const show = _isStandaloneApp();
  document.querySelectorAll('.js-refresh-btn').forEach(btn => {
    btn.style.display = show ? 'flex' : 'none';
  });
}

// standalone 모드(홈 화면에 설치된 앱)에서는 iOS/Android 브라우저가 제공하는
// "당겨서 새로고침" 제스처가 아예 없어져서, 직접 흉내 낸 버전을 붙여준다.
// 열려있는 시트/모달 위에서 스크롤할 때는 절대 반응하지 않도록 가드를 둔다.
function _initPullToRefresh() {
  if (!_isStandaloneApp()) return;
  const THRESHOLD = 68;
  let startY = null, dragging = false, armed = false;

  const indicator = document.createElement('div');
  indicator.id = 'ptrIndicator';
  indicator.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>`;
  indicator.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%) translateY(-40px) scale(0.6);opacity:0;z-index:2500;width:34px;height:34px;border-radius:50%;background:var(--surface);box-shadow:var(--sh-md);display:flex;align-items:center;justify-content:center;transition:transform .18s var(--ease),opacity .18s var(--ease);pointer-events:none;';
  document.body.appendChild(indicator);

  const reset = () => {
    indicator.style.opacity = '0';
    indicator.style.transform = 'translateX(-50%) translateY(-40px) scale(0.6)';
  };
  const isBlocked = () =>
    document.querySelector('.custom-sheet-backdrop.show') ||
    document.querySelector('.modal.show') ||
    document.querySelector('.swal2-container');

  document.addEventListener('touchstart', (e) => {
    if (isBlocked() || window.scrollY > 0) { dragging = false; return; }
    startY = e.touches[0].clientY;
    dragging = true; armed = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!dragging || startY === null) return;
    if (isBlocked() || window.scrollY > 0) { dragging = false; reset(); return; }
    const dy = e.touches[0].clientY - startY;
    if (dy <= 0) { reset(); return; }
    const progress = Math.min(dy / THRESHOLD, 1);
    armed = progress >= 1;
    indicator.style.transition = 'none';
    indicator.style.opacity = String(progress);
    indicator.style.transform = `translateX(-50%) translateY(${-40 + progress * 56}px) scale(${0.6 + progress * 0.4}) rotate(${progress * 280}deg)`;
  }, { passive: true });

  const finish = () => {
    indicator.style.transition = 'transform .18s var(--ease),opacity .18s var(--ease)';
    if (dragging && armed) {
      indicator.style.transform = 'translateX(-50%) translateY(16px) scale(1)';
      location.reload();
    } else {
      reset();
    }
    dragging = false; startY = null; armed = false;
  };
  document.addEventListener('touchend', finish, { passive: true });
  document.addEventListener('touchcancel', finish, { passive: true });
}

// 이미 앱으로 설치되어 실행 중이면 설치 안내 아이콘은 숨김
function _applyInstallBtnVisibility() {
  const show = !_isStandaloneApp();
  document.querySelectorAll('.js-install-btn').forEach(btn => {
    btn.style.display = show ? 'flex' : 'none';
  });
}

function openInstallGuideSheet() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /Android/.test(ua);

  const backdrop = document.createElement('div');
  backdrop.className = 'custom-sheet-backdrop';
  backdrop.style.zIndex = '3000';
  const sheet = document.createElement('div');
  sheet.className = 'custom-sheet';
  sheet.style.cssText = 'padding-bottom:40px;';

  let bodyHtml;
  if (_isStandaloneApp()) {
    bodyHtml = `<div style="text-align:center;padding:12px 0 4px;">
      <div style="font-size:32px;margin-bottom:10px;">✅</div>
      <div style="font-size:14px;font-weight:700;color:var(--ink);">이미 앱으로 설치되어 있어요</div>
    </div>`;
  } else if (_deferredInstallPrompt) {
    bodyHtml = `
      <div style="font-size:13px;color:var(--ink-2);line-height:1.7;margin-bottom:18px;">
        아래 버튼을 누르면 바로 설치할 수 있어요. 설치하면 브라우저 주소창 없이
        앱처럼 홈 화면·바탕화면에서 바로 실행할 수 있습니다.
      </div>
      <button id="_installNowBtn" style="width:100%;padding:14px;border:none;border-radius:var(--radius);background:var(--blue);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;box-shadow:var(--sh-blue);">지금 설치하기</button>`;
  } else if (isIOS) {
    bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${_installStep('1', '하단(또는 상단) 공유 버튼을 탭하세요', '⬆️')}
        ${_installStep('2', `메뉴에서 <b>"홈 화면에 추가"</b>를 선택하세요`, '➕')}
        ${_installStep('3', `우측 상단 <b>"추가"</b>를 탭하면 완료!`, '✅')}
      </div>`;
  } else if (isAndroid) {
    bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${_installStep('1', '우측 상단 브라우저 메뉴(⋮)를 여세요', '⋮')}
        ${_installStep('2', `<b>"앱 설치"</b> 또는 <b>"홈 화면에 추가"</b>를 선택하세요`, '📲')}
      </div>`;
  } else {
    bodyHtml = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${_installStep('1', '주소창 우측의 설치 아이콘을 클릭하세요', '⊕')}
        ${_installStep('2', `없다면 브라우저 메뉴에서 <b>"앱 설치"</b>를 찾아보세요`, '💻')}
      </div>`;
  }

  sheet.innerHTML = `
    <div class="custom-sheet-handle"></div>
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;">
      <div style="width:42px;height:42px;border-radius:var(--radius-sm);background:var(--blue-dim);display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-sm);flex-shrink:0;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M12 8v6"/><path d="M9.5 11.5 12 14l2.5-2.5"/></svg>
      </div>
      <div style="flex:1;">
        <div style="font-size:16px;font-weight:800;color:var(--ink);letter-spacing:-0.4px;">앱으로 설치</div>
        <div style="font-size:11px;color:var(--ink-3);margin-top:1px;">홈 화면·바탕화면에서 바로 실행</div>
      </div>
      <button id="_installClose" aria-label="닫기" style="width:30px;height:30px;border-radius:50%;border:none;background:var(--bg-deep);color:var(--ink-3);cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:var(--sh-xs);flex-shrink:0;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    ${bodyHtml}`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_installClose').addEventListener('click', close);

  const installBtn = sheet.querySelector('#_installNowBtn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!_deferredInstallPrompt) return;
      installBtn.disabled = true; installBtn.textContent = '설치 중...';
      _deferredInstallPrompt.prompt();
      const { outcome } = await _deferredInstallPrompt.userChoice;
      _deferredInstallPrompt = null;
      if (outcome === 'accepted') { showSuccessToast('설치 완료!'); close(); }
      else { installBtn.disabled = false; installBtn.textContent = '지금 설치하기'; }
    });
  }
}

function _installStep(num, text, emoji) {
  return `<div style="display:flex;align-items:center;gap:12px;background:var(--bg-deep);border-radius:var(--radius-sm);padding:12px 14px;">
    <div style="width:30px;height:30px;border-radius:50%;background:var(--surface);box-shadow:var(--sh-sm);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">${emoji}</div>
    <div style="font-size:13px;color:var(--ink-2);line-height:1.5;flex:1;">${text}</div>
  </div>`;
}

/* ════════════════════════════════
   토스트
════════════════════════════════ */
const TOAST_DOTS = { blue:'var(--blue)', green:'var(--green)', red:'var(--red)', amber:'var(--amber)', purple:'var(--purple)' };
function _cdToast(opts) {
  const tc = document.getElementById('toast-container');
  const el = document.createElement('div'); el.className = 'cd-toast';
  const dot = opts.spinner ? '<div class="cd-toast-spin"></div>' : `<div class="cd-toast-dot" style="background:${TOAST_DOTS[opts.type]||TOAST_DOTS.blue}"></div>`;
  el.innerHTML = `${dot}<div class="cd-toast-body"><div class="cd-toast-title">${_esc(opts.title)}</div>${opts.sub?`<div class="cd-toast-sub">${_esc(opts.sub)}</div>`:''}</div>`;
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
    `<div class="custom-sheet-title">${_esc(opts.title)}</div>` +
    (opts.text?`<div class="custom-sheet-text">${_esc(opts.text)}</div>`:'') +
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
let _dashboardAuthed = false;

function switchTab(tabName) {
  if (tabName === 'dashboard' && !_dashboardAuthed) {
    Swal.fire({
      title: '대시보드', text: '교사 메뉴 비밀번호를 입력하세요.',
      input: 'password', inputPlaceholder: '비밀번호를 입력하세요',
      inputAttributes: { autocomplete: 'off' },
      showCancelButton: true, confirmButtonText: '확인', cancelButtonText: '취소',
    }).then(result => {
      if (result.isConfirmed && result.value === TEACHER_PW) {
        _dashboardAuthed = true;
        switchTab('dashboard');
      } else if (result.isConfirmed) {
        Swal.fire({ title: '비밀번호가 틀렸습니다', icon: 'error', confirmButtonText: '확인' });
      }
    });
    return;
  }
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
  const tabs    = ['home','roster','stats','schedule','dashboard'];
  const idx     = tabs.indexOf(tabName);
  const ind     = document.getElementById('tabIndicatorFluid');
  if (ind) ind.style.transform = `translateX(${idx * 100}%)`;

  document.querySelectorAll('.nav-tab').forEach(el=>el.classList.remove('active'));
  document.querySelectorAll(`.nav-tab[data-tab="${tabName}"]`).forEach(el=>el.classList.add('active'));
  _movePcNavIndicator(tabName);
  document.querySelectorAll('.tab-view').forEach(el=>el.classList.remove('active'));
  document.getElementById('view-'+tabName).classList.add('active');

  const ab  = document.getElementById('homeActionBar');
  const fab = document.getElementById('rosterFab');
  if (tabName === 'home')        { ab.classList.remove('d-none'); fab.classList.remove('visible'); }
  else if (tabName === 'roster') { ab.classList.add('d-none');    fab.classList.add('visible'); }
  else                           { ab.classList.add('d-none');    fab.classList.remove('visible'); }

  // 뒤로가기 버튼 표시/숨김
  const backBtn = document.getElementById('backBtn');
  if (backBtn) backBtn.classList.toggle('visible', tabName !== 'home');

  // 브라우저 히스토리 관리
  if (!_skipHistory) {
    if (tabName !== 'home') history.pushState({ tab: tabName }, '');
    else history.replaceState({ tab: 'home' }, '');
  }

  window.scrollTo(0,0);
  if (tabName === 'stats')     loadStats();
  if (tabName === 'schedule')  updateGroupScheduleView();
  if (tabName === 'roster')    loadRoster();
  if (tabName === 'dashboard') {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const ind = document.getElementById('dashModeIndicator'); if (ind) ind.style.transition = 'none';
      _moveDashModeSlider();
      requestAnimationFrame(() => { const ind2 = document.getElementById('dashModeIndicator'); if (ind2) ind2.style.transition = ''; });
    }));
    loadDashboard();
  }
}

function goBack() {
  executeSwitchTab('home');
}

// PC 사이드바의 슬라이딩 활성 인디케이터를 해당 탭 버튼 위치로 이동
function _movePcNavIndicator(tabName) {
  const ind = document.getElementById('pcNavIndicator');
  const btn = document.getElementById('pcTab-' + tabName);
  if (!ind || !btn) return;
  ind.style.height    = btn.offsetHeight + 'px';
  ind.style.transform = 'translateY(' + btn.offsetTop + 'px)';
}
window.addEventListener('resize', () => {
  const active = document.querySelector('.pc-nav-item.nav-tab.active');
  if (active) _movePcNavIndicator(active.dataset.tab);
});

// 열려있는 커스텀 시트 중 가장 위(마지막에 연) 것을 찾아 배경 클릭과 동일하게 닫음
// — 각 시트는 이미 backdrop 클릭 시 닫히도록 되어 있으므로, 그 backdrop에
//   직접 클릭 이벤트를 발생시켜 기존 close 로직(취소 콜백 포함)을 그대로 재사용한다.
function _closeTopmostSheet() {
  const all = document.querySelectorAll('.custom-sheet-backdrop.show');
  if (!all.length) return false;
  all[all.length - 1].click();
  return true;
}

// ESC로 열려있는 시트 닫기 (SweetAlert가 떠 있으면 그쪽이 이미 자체적으로
// ESC를 처리하므로 손대지 않음 — 시트 위에 뜬 인증 다이얼로그 등과 충돌 방지)
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (document.querySelector('.swal2-container')) return;
  _closeTopmostSheet();
});

// Ctrl+S / Cmd+S: 출석체크 탭에서 바로 저장 (브라우저 기본 "페이지 저장"은 막음)
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== 's') return;
  const homeActive = document.getElementById('view-home')?.classList.contains('active');
  if (!homeActive) return;
  e.preventDefault();
  const btn = document.getElementById('btnSave');
  if (btn && !btn.disabled) submitAttendance();
});

// 브라우저 뒤로가기: 시트가 열려있으면 탭 전환 대신 시트부터 닫는다
// (기존엔 시트가 열린 채로 뒷단 탭만 바뀌어버려 시트가 엉뚱한 화면 위에 떠 있었음)
window.addEventListener('popstate', (e) => {
  if (_closeTopmostSheet()) {
    e.stopImmediatePropagation();
    history.pushState(e.state, '');
  }
}, false);

// 출석체크 탭: 스크롤 내리면 상단 필터 영역(날짜·세션·확인자)이 아이폰 대형
// 타이틀처럼 스크롤량에 비례해 자연스럽게 줄어듦.
// COLLAPSE_DISTANCE(px)만큼 내리면 완전히 축소된 상태(--collapse:1)가 된다.
const COLLAPSE_DISTANCE = 60;
let _scrollTicking = false;
let _lastCollapse = -1; // 직전에 실제로 적용한 --collapse 값 — 변화가 없으면 다시 쓰지 않음
function _applyScrollCollapse() {
  // rAF와 setTimeout 둘 중 먼저 온 쪽이 실행하고 플래그를 내리는 방식(경쟁) —
  // 탭이 백그라운드로 가는 등 이유로 requestAnimationFrame이 지연/보류되면
  // _scrollTicking이 true로 계속 남아 이후 스크롤이 전부 무시되는 문제가
  // 있었음. 둘 중 하나는 반드시 제때 실행되므로 그 문제를 막는다.
  if (!_scrollTicking) return;
  _scrollTicking = false;
  const homeActive = document.getElementById('view-home')?.classList.contains('active');
  const fs = document.querySelector('.filter-section');
  if (!fs) return;
  const collapse = homeActive ? Math.min(1, Math.max(0, window.scrollY / COLLAPSE_DISTANCE)) : 0;
  // 값이 눈에 안 띌 만큼(0.5% 미만)만 바뀌었으면 스타일 재계산을 또
  // 일으키지 않고 건너뜀 — 관성 스크롤 막바지처럼 아주 미세한 스크롤
  // 델타가 촘촘히 들어올 때 불필요한 레이아웃 재계산이 계속 발생해
  // 프레임이 밀리는 걸 줄여준다.
  if (Math.abs(collapse - _lastCollapse) < 0.005 && collapse !== 0 && collapse !== 1) return;
  _lastCollapse = collapse;
  fs.style.setProperty('--collapse', collapse);
  fs.classList.toggle('scrolled', !!homeActive && window.scrollY > 24);
  // 세션 탭 배경 슬라이더는 JS가 버튼 크기를 읽어 위치를 잡는데, 방금
  // 위에서 --collapse를 바꿔놓은 직후 곧바로 offsetLeft/offsetWidth를
  // 읽으면 브라우저가 그 변경을 강제로 즉시 레이아웃 계산(강제 동기
  // 리플로우)해야 해서 스크롤이 매 프레임 끊겨 보이는 원인이었음(쓰기
  // 후 바로 읽기 = layout thrashing). 다음 애니메이션 프레임으로 읽기를
  // 미뤄서, 브라우저가 원래 자기 렌더링 파이프라인에서 계산해둔 값을
  // 그냥 읽기만 하도록 한다 — 한 프레임 지연은 육안으로 안 느껴짐.
  if (homeActive) {
    // 여기서도 rAF 하나만 믿으면(탭 백그라운드 전환 등으로) 지연될 수
    // 있으므로 setTimeout을 함께 걸어 둘 중 먼저 오는 쪽이 실행하게 한다.
    let _ran = false;
    const updateSlider = () => {
      if (_ran) return;
      _ran = true;
      const activePill = document.querySelector('#sessionPillWrap .session-pill.active');
      if (activePill) _movePillSlider(activePill, true);
    };
    requestAnimationFrame(updateSlider);
    setTimeout(updateSlider, 32);
  }
}
window.addEventListener('scroll', () => {
  if (_scrollTicking) return;
  _scrollTicking = true;
  requestAnimationFrame(_applyScrollCollapse);
  setTimeout(_applyScrollCollapse, 100);
}, { passive: true });

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
    return `<div class="student-card ${isAbsent?'absent':'present'}"
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
      if (manual && flushed === 0) showSuccessToast('아직 연결이 안 됐어요', '잠시 후 자동으로 다시 시도할게요');
      break; // 여전히 오프라인이거나 실패 — 다음 online 이벤트/재시도를 기다린다
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
  API.calculateStats()
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
  let filtered = _rosterActivePill === 0
    ? _rosterData
    : _rosterData.filter(s => s.group === GROUPS[_rosterActivePill - 1]);
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

  const shortLabels = sessions.map(o => o.text.replace(' 자율학습','').replace(/\(토\)/,''));
  const lit = {};
  GROUPS.forEach(g => { lit[g] = sessions.map(() => false); });
  roster.forEach(s => {
    if (!lit[s.group]) return;
    s.sessions.forEach(sess => {
      const idx = sessions.findIndex(o => o.text === sess.session);
      if (idx >= 0) lit[s.group][idx] = true;
    });
  });

  const groups = GROUPS.map(g => `
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

  API.getStudentInsight(student.id)
    .then(insight => _renderStudentInsightBody(sheet.querySelector('#_diBody'), insight))
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
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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
    <input type="checkbox" data-field="${f.key}" checked style="width:14px;height:14px;accent-color:var(--blue);cursor:pointer;">${f.label}
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
  { key:'fine', label:'미납 벌금', get: s => s.fineUnpaid > 0 ? `미납 벌금 ${s.fineUnpaid.toLocaleString()}원` : null,
    tag: s => s.fineUnpaid > 0 ? `<span class="sch-dr-s" style="background:var(--red-dim);color:var(--red);">미납 벌금 ${s.fineUnpaid.toLocaleString()}원</span>` : '' },
  { key:'early', label:'기간 중 조퇴', get: s => `조퇴 ${s.earlyCount}회`,
    tag: s => `<span class="sch-dr-s" style="background:var(--amber-dim);color:var(--amber);">조퇴 ${s.earlyCount}회</span>` },
  { key:'viol', label:'누적 위반', get: s => `위반 ${s.violationCount}회`,
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
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_tpvClose').addEventListener('click', close);
  sheet.querySelector('#_tpvCopy').addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => { showSuccessToast('클립보드에 복사됐어요'); close(); });
  });
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
  backdrop.addEventListener('click', e=>{ if(e.target===backdrop){ backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(),350); } });
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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
        { bg:'#fef3c7',          fg:'#d97706',      svg:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
          title:'전체 벌금 현황',  sub:'전체 벌금 목록 조회 및 납부 상태를 수정합니다', fn:_teacherViewFines },
        { bg:'#fce7f3',          fg:'#db2777',      svg:'<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01"/>',
          title:'평일 공휴일 설정', sub:'평일 공휴일 중 자습하는 날을 등록/삭제합니다', fn:_teacherEditHolidays },
      ],
    },
    {
      label: '학생 관리',
      items: [
        { bg:'#e0fdf4',          fg:'#059669',      svg:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>',
          title:'학생 추가',      sub:'새 학생을 자습반에 등록합니다', fn:_teacherAddStudent },
        { bg:'#fff7ed',          fg:'#ea580c',      svg:'<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/>',
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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
      <span style="font-size:12px;font-weight:600;color:var(--ink-3);">기록 <b style="color:var(--ink);">${records.length}회</b></span>
      <span style="color:var(--ink-4);">·</span>
      <span style="font-size:12px;font-weight:600;color:var(--red);">결석 카운트 <b>${absentCnt}회</b></span>
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
    setTimeout(() => backdrop.remove(), 350);
    if (_aeChanged) {
      _cache.stats = null;
      _rosterLoaded = false;
      loadStudents(false, true);
    }
  };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_aeClose').addEventListener('click', close);

  let _reasonTimer = null;

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

// ── 2. 자습 세션 변경 ──────────────────────────────────
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

  const cellStyle = v => {
    if (v === 'O')    return 'background:var(--clay-indigo-light,#e0e7ff);color:var(--blue,#4f46e5);border:1.5px solid var(--blue,#4f46e5);';
    if (v === '방과후') return 'background:#fef9c3;color:#b45309;border:1.5px solid #d97706;';
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
    <button id="_sceSave" style="margin-top:20px;padding:14px;border-radius:var(--radius);border:none;background:var(--blue,#4f46e5);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;width:100%;box-shadow:var(--sh-blue);">저장</button>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  sheet.querySelector('#_heClose').addEventListener('click', close);

  sheet.querySelector('#_holDateInput').value = _todayStr();
  _renderHolidayList(sheet);
}

// ── 3. 출석 기록 초기화 ────────────────────────────────
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
      <div style="font-size:12px;font-weight:700;color:var(--red,#ef4444);margin-bottom:4px;">⚠ 주의</div>
      <div style="font-size:12px;color:var(--ink-3);line-height:1.6;">지정한 날짜의 <b>모든 반 출석 기록</b>이 삭제됩니다.<br>삭제 후에는 복구할 수 없습니다.</div>
    </div>
    <div style="font-size:13px;font-weight:700;color:var(--ink-2);margin-bottom:8px;">날짜 선택</div>
    <input type="date" id="_traDate" value="${today}"
      style="width:100%;padding:12px 14px;border-radius:var(--radius);border:1.5px solid var(--bg-deep);background:var(--surface);color:var(--ink);font-family:var(--font);font-size:14px;box-sizing:border-box;outline:none;">
    <button id="_traConfirm" style="margin-top:16px;padding:14px;border-radius:var(--radius);border:none;background:var(--red,#ef4444);color:#fff;font-family:var(--font);font-size:14px;font-weight:700;cursor:pointer;width:100%;">선택한 날짜 출석 기록 삭제</button>`;

  backdrop.appendChild(sheet);
  document.body.appendChild(backdrop);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('show')));

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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
      confirmButtonColor: '#ef4444',
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

// ── 4. 학생 추가 ──────────────────────────────────────
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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
    confirmButtonColor: '#ef4444',
  });
  if (!result.isConfirmed) return;
  try {
    await API.deleteStudent(student.id);
    showSuccessToast('삭제됨', student.name);
    _rosterLoaded = false; _cache.stats = null;
  } catch { Swal.fire('오류', '삭제하지 못했습니다.', 'error'); }
}

// ── 6. 학생 일괄 등록 ──────────────────────────────────
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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
          <thead><tr style="border-bottom:1.5px solid var(--ink-4,#bdb7b0);">
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
      html: `기존 학생 데이터 전체를 삭제하고<br>새로운 <b>${parsed.length}명</b>으로 교체합니다.<br><small style="color:#d4959a;">⚠ 출석·위반 기록도 함께 삭제됩니다.</small>`,
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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

// ── 7. 전체 벌금 현황 ─────────────────────────────────
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
  report += '----------------------------------\n';

  const byGroup = {};
  for (const v of visible) (byGroup[v.student.group || '기타'] ??= []).push(v);

  for (const [group, vs] of Object.entries(byGroup)) {
    const groupTotal  = vs.reduce((s, v) => s + _parseFine(v.action), 0);
    const groupUnpaid = vs.filter(v => !v.paid).reduce((s, v) => s + _parseFine(v.action), 0);
    report += `\n[${group}] 소계 ${fmt(groupTotal)}${groupUnpaid > 0 ? ` (미납 ${fmt(groupUnpaid)})` : ''}\n`;
    vs.forEach(v => {
      const fine = _parseFine(v.action);
      report += `- ${v.student.ban}반 ${v.student.num}번 ${v.student.name} · ${v.violType}${v.detail ? `(${v.detail})` : ''} · ${fmt(fine)} [${v.paid ? '납부' : '미납'}]\n`;
    });
  }
  report += '----------------------------------';
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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

  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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
  const close = () => { backdrop.classList.remove('show'); setTimeout(() => backdrop.remove(), 350); };
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
      <div style="font-size:11px;color:var(--red,#ef4444);font-weight:600;margin-bottom:8px;">지정한 날짜의 모든 출석 기록이 삭제됩니다.</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="date" id="_resetDateInput" class="cd-input" style="flex:1;">
        <button onclick="_devResetAttendance()" style="padding:8px 16px;border-radius:var(--radius-pill);border:none;background:var(--red,#ef4444);color:#fff;font-family:var(--font);font-size:13px;font-weight:700;cursor:pointer;white-space:nowrap;">초기화</button>
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
  btn.style.background = on ? 'var(--green,#22c55e)' : 'var(--red,#ef4444)';
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
  btn.style.background = on ? 'var(--green,#22c55e)' : 'var(--red,#ef4444)';
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
      <button onclick="_deleteReasonType(${i})" title="삭제" aria-label="사유 삭제" style="width:28px;height:28px;border:none;border-radius:6px;background:var(--red-dim);color:var(--red,#ef4444);cursor:pointer;font-size:16px;font-weight:900;line-height:1;">×</button>
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
      <button onclick="_deleteViolationType(${i})" title="삭제" aria-label="유형 삭제" style="width:28px;height:28px;border:none;border-radius:6px;background:var(--red-dim);color:var(--red,#ef4444);cursor:pointer;font-size:16px;font-weight:900;line-height:1;">×</button>
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
        confirmButtonColor: '#ef4444',
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
function _maybeShowAttendanceReminder() {
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
          .then(types => { _reasonTypes = types; })
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
