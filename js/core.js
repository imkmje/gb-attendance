// ════════════════════════════════════════
//  core.js — 상수 · 상태 · 유틸 · 테마 · 토스트 · Bottom Sheet 공통 · 탭 전환
//  (app.js에서 분리됨. 전역 스크립트라 다른 파일과 스코프를 공유한다.)
// ════════════════════════════════════════

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
const APP_VERSION = '3.0.3';
const CHANGELOG = [
  { v:'3.0.3', d:'2026-08-19', t:'patch', title:'텍스트 복사 구분선 길이를 32자 → 16자로 줄임 — 박스 그리기 문자(─)는 글꼴마다 가로 폭이 달라서, 길게 반복하면 폰마다 줄바꿈 여부가 달라질 수 있었음' },
  { v:'3.0.2', d:'2026-08-19', t:'patch', title:'출석 결과보기·벌금 현황 텍스트 복사 시 서식이 깨져 보이던 문제 수정 — "-" 반복 구분선과 줄머리 "- "가 카카오톡 등 일부 붙여넣기 대상에서 마크다운 제목·목록으로 오인되던 것을, 기간 결산 공지가 이미 쓰던 "─"·"·"로 통일' },
  { v:'3.0.1', d:'2026-08-19', t:'patch', title:'코드 리뷰로 발견한 버그 4건 수정 — ① 오프라인 저장 큐가 네트워크 아닌 오류로 막히면 뒤에 쌓인 정상 항목까지 영원히 안 나가던 문제, ② 기간 결산 팝업의 "미납 벌금"·"누적 위반" 체크박스가 민감정보인데도 기본으로 켜져 있던 문제(이제 기본 꺼짐), ③ 결석 카운트 수정 시트에서 시트를 열어둔 채 기록을 고쳐도 상단 카운트가 안 바뀌던 문제, ④ 조퇴·지각 요약 칩 값을 지워도 패널이 안 접히던 문제' },
  { v:'3.0.0', d:'2026-08-19', t:'major', title:'자동화 테스트(Playwright) 도입 + app.js(5,200여 줄)를 기능별 파일 10개로 분리. 화면상 변화는 없지만, 1.0(백엔드 전환)·2.0(PC 레이아웃 전면개편)급으로 앱 내부가 통째로 바뀐 판올림 — 이제 기능을 고칠 때마다 자동으로 회귀를 잡아내고, 코드도 탭별로 나뉘어 있어 앞으로 더 안전하고 빠르게 키워나갈 수 있음' },
  { v:'2.29.0', d:'2026-08-19', t:'minor', title:'출석체크 카드 대비 반전 — 결석 카드가 옅어져 오히려 눈에 안 띄던 걸 뒤집어서, 결석은 빨강 글로우로 도드라지고 출석은 차분하게 가라앉게 함(이름 텍스트는 둘 다 항상 또렷하게 유지)' },
  { v:'2.28.2', d:'2026-08-19', t:'patch', title:'조퇴·지각 칩이 탭 영역을 넓히려다 시각적으로 커져 있던 걸 원래 크기로 되돌림 — 보이는 크기는 컴팩트하게 두고 안 보이는 히트박스만 넓혀서 터치 편의성은 유지' },
  { v:'2.28.1', d:'2026-08-19', t:'patch', title:'출석체크 카드에 있던 "꾹 누르면 위반 등록" 힌트 점 제거 — 그 기능은 명단 탭 카드에만 있고 출석체크 카드엔 원래 없던 기능이라 안내가 잘못됐었음' },
  { v:'2.28.0', d:'2026-08-19', t:'minor', title:'출석체크 학생 카드 개편 — 조퇴·지각 칩은 값이 있을 때만 기본 노출, 나머지는 요약 칩 한 번 탭해서 펼치기(카드 밀도 개선, 폰 오탭 감소), 칩 탭 영역 확대' },
  { v:'2.26.2', d:'2026-08-19', t:'patch', title:'전체 바텀시트(약 20곳) 닫힘 애니메이션이 실제 CSS 전환(400ms)보다 50ms 일찍 DOM에서 제거돼 끝에서 살짝 끊겨 보이던 문제 일괄 수정' },
  { v:'2.26.1', d:'2026-08-19', t:'patch', title:'대시보드 점등 표시를 결석자만/전체 명단 필터 바로 아래 붙여 하나의 카드처럼 통합(양각 음영 적용), 학생 카드 클릭 시 스켈레톤이 너무 짧게 번쩍이던 문제 수정' },
  { v:'2.26.0', d:'2026-08-19', t:'minor', title:'학생 없는 자습반은 명단·규정위반 등록·대시보드 점등에서 자동으로 숨김(학생 추가/자습반 변경 화면은 그대로), 출석체크 미완료 알림은 일단 꺼둠' },
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

// 학생이 1명도 없는 자습반은 "기존 반을 골라서 보는" 화면(명단 필터,
// 규정 위반 등록 대상 고르기 등)에서 자동으로 숨긴다. 반대로 학생을 새로
// 배정/이동시키는 화면(학생 추가, 자습반 변경)은 지금 비어있어도 골라야
// 하므로 그쪽은 GROUPS 원본을 그대로 쓴다 — 이 함수로 바꾸지 말 것.
function _activeGroups() {
  if (!_rosterLoaded) return GROUPS;
  const present = new Set(_rosterData.map(s => s.group));
  return GROUPS.filter(g => present.has(g));
}
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
  const close = () => { backdrop.classList.remove('show'); setTimeout(()=>backdrop.remove(),420); };
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

