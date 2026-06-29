# 청·백운반 출석부 — GAS → Supabase 마이그레이션 플랜

## 프로젝트 개요

강북고등학교 1학년 자율학습 출석 관리 앱.
기존: Google Apps Script(GAS) + Google Sheets
목표: Supabase(PostgreSQL) + GitHub Pages (순수 HTML/CSS/JS, 프레임워크 없음)

**원칙**: 기존 UI(Clay Depth UI 1.1) · 기능 100% 유지. 백엔드만 교체.

---

## Phase 1 — 백엔드 교체 (현재 목표)

### 1. Supabase 테이블 설계

```sql
-- 학생 기본 정보
CREATE TABLE students (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_num   int  NOT NULL,        -- 반 (1~7)
  student_num int  NOT NULL,        -- 번호
  name        text NOT NULL,
  study_room  text NOT NULL,        -- '청운반' | '백운 A반' | '백운 B반' | '백운 C반' | '백운 D반'
  created_at  timestamptz DEFAULT now()
);

-- 출석 기록
CREATE TABLE attendance (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES students(id) ON DELETE CASCADE,
  record_date date NOT NULL,
  session     text NOT NULL,        -- '오후 자율학습' | '야간 자율학습' | '심야 자율학습' | '오전 자율학습(토)' | '오후 자율학습(토)'
  status      text NOT NULL,        -- '출석' | '결석'
  reason      text DEFAULT '',
  no_count    boolean DEFAULT false,
  checker     text DEFAULT '',
  created_at  timestamptz DEFAULT now(),
  UNIQUE(student_id, record_date, session)
);

-- 규정 위반
CREATE TABLE violations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid REFERENCES students(id) ON DELETE CASCADE,
  viol_date   date NOT NULL,
  viol_type   text NOT NULL,
  action      text NOT NULL,
  detail      text DEFAULT '',
  paid        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);

-- 공휴일 설정
CREATE TABLE holidays (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hol_date    date UNIQUE NOT NULL,
  has_am      boolean DEFAULT true,
  has_pm      boolean DEFAULT true
);

-- 인덱스
CREATE INDEX ON attendance(record_date, session);
CREATE INDEX ON attendance(student_id, record_date);
CREATE INDEX ON violations(student_id);
```

### 2. 프로젝트 구조

```
/
├── index.html          # 기존 Index.html 그대로 (UI 변경 없음)
├── js/
│   ├── config.js       # Supabase URL, anon key (환경변수 대신 직접 삽입)
│   ├── api.js          # GAS google.script.run → Supabase REST API 교체 레이어
│   └── app.js          # 기존 <script> 내용 분리 (로직 변경 없음)
├── css/
│   └── style.css       # 기존 <style> 분리
└── README.md
```

### 3. GAS 함수 → Supabase API 매핑

| GAS 함수 | Supabase 대체 방식 |
|---|---|
| `getGroupList()` | `students` 테이블에서 distinct study_room 조회 |
| `getAllMemberList()` | students + attendance + violations JOIN |
| `getStudentList(group, session, date, colIdx, includeAfterSchool)` | students 필터 + attendance 해당 날짜 조회 |
| `saveAttendance(payload)` | attendance upsert (UNIQUE 제약으로 중복 방지) |
| `calculateStats()` | attendance GROUP BY student_id |
| `getGroupSchedule(group)` | students의 weekly_schedule JSON 컬럼 or 별도 테이블 |
| `getViolationHistory(ban, num, name, group)` | violations WHERE student_id |
| `saveViolation(payload)` | violations INSERT |
| `updateViolationPayment(rowIndex, paid)` | violations UPDATE SET paid |
| `getAbsentHistory(ban, num, name, group)` | attendance WHERE status='결석' |
| `getHolidays()` | holidays SELECT |
| `saveHolidays(holidays)` | holidays upsert |

### 4. 핵심 변경 사항

#### 4-1. google.script.run 제거
기존:
```js
google.script.run
  .withSuccessHandler(data => { ... })
  .withFailureHandler(err => { ... })
  .getGroupList();
```
교체:
```js
// api.js에 동일 인터페이스 래퍼 구현
await API.getGroupList();
```

#### 4-2. 학생 시간표(schedule) 처리
기존 GAS는 Google Sheets 컬럼 인덱스(colIdx)로 직접 셀을 읽었음.
Supabase에서는 students 테이블에 `schedule` jsonb 컬럼 추가:
```json
{
  "mon": ["O", "O", "O"],
  "tue": ["방과후", "O", "O"],
  "wed": ["-", "-", "-"],
  "thu": ["O", "O", "O"],
  "fri": ["O", "-", "-"],
  "sat": ["O", "O"]
}
```
→ getStudentList의 includeAfterSchool 토글, colIdx 계산 모두 클라이언트에서 처리.

#### 4-3. 결석 횟수 계산 (_calcAbsentCounts)
기존 GAS 서버 계산 → 클라이언트 JS로 이전 (로직 동일).
attendance 전체를 한 번 fetch 후 클라이언트에서 집계.

#### 4-4. CacheService 제거
Supabase는 빠르므로 GAS CacheService 불필요.
클라이언트 메모리 캐시(기존 `_cache` 객체)만 유지.

### 5. 인증 전략
- Supabase anon key 사용 (RLS 없이 운영 — 학교 내부 도구이므로)
- 반장 구분: 반 선택 + 확인자 성명 입력 방식 유지 (기존과 동일)
- 개발자 메뉴: 비밀번호 `4834` 유지

### 6. 초기 데이터 적재 (students 테이블)
별도 Python 스크립트로 xlsx → Supabase INSERT.
`scripts/seed_students.py` 파일로 제공.

---

## Phase 2 — 기능 추가 (백엔드 안정화 후)

### 2-1. 결석 카운트 규칙 변경
현재: 마지막 세션(심야) 기준으로 결석 카운트
변경:
- 야자 또는 심자에 `no_count = true`인 출석 기록이 있으면 → 그 날 결석 횟수 **0회**
- 그 외에는 마지막 세션 기준 유지
- 토요일/공휴일은 오전·오후 각각 독립 카운트 (기존 유지)

### 2-2. 결석 사유 항목 커스터마이징
- 개발자 메뉴에 "결석 사유 관리" 섹션 추가
- Supabase `settings` 테이블 또는 `app_settings` key-value 테이블에 저장
- 기본값: ['학원 보강', '병결', '개인 사정', '직접 입력']
- 추가/삭제 가능

### 2-3. 토요일 오후 세션 분리
- '오후 자율학습(토)' → '토 오후1'(13:10~15:00), '토 오후2'(15:10~17:00)
- session 값: `'오후1 자율학습(토)'`, `'오후2 자율학습(토)'`
- 통계 가중치: 각 2.0H (기존 오후(토) 4.0H를 2개로 분리)
- schedule JSON에 `"sat": ["O", "O", "O"]` (오전/오후1/오후2)로 확장

---

## Claude Code 작업 순서

1. `scripts/seed_students.py` — xlsx → Supabase students 적재 스크립트
2. `js/config.js` — Supabase 설정
3. `js/api.js` — GAS 함수 전부 Supabase REST로 대체하는 API 레이어
4. `index.html` + `js/app.js` — google.script.run 호출부를 api.js 호출로 교체
5. `js/css/style.css` — 기존 스타일 분리 (변경 없음)
6. GitHub Pages 배포 설정 (`_config.yml` 또는 루트 배포)

---

## Supabase 프로젝트 정보 (새로 생성 필요)

- 기존 인강 승인 시스템: `nxfobohdyriffcrmzrmj.supabase.co` — **별도 프로젝트로 새로 생성**
- 새 프로젝트 생성 후 URL·anon key를 `js/config.js`에 입력

---

## 참고: 기존 GAS 함수별 주요 로직

### 결석 카운트 (_calcAbsentCounts)
- 평일: 같은 날 세션 중 가장 마지막(심야>야간>오후) 세션이 결석이면 1회 카운트
- 토요일: 오전/오후 각각 독립 카운트
- no_count=true인 결석은 제외

### 통계 가중치
```
오후 자율학습:     1.5H
야간 자율학습:     2.0H
심야 자율학습:     1.5H
오전 자율학습(토): 3.0H
오후 자율학습(토): 4.0H
```

### 자습반 목록
`['청운반', '백운 A반', '백운 B반', '백운 C반', '백운 D반']`
