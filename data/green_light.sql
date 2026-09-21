-- 그린라이트 기능 — Supabase SQL Editor에서 1회 실행 (anon key로는 DDL 불가)
--
-- 그린라이트: 내신/모의고사 목표를 달성한 학생에게 지급되는 결석 허용권.
-- 학생별 잔여 개수만 저장하고(내신/모의고사 출처 구분은 activity_log에만 남김),
-- 출석체크 화면에서 사유로 선택해 쓰면 자동으로 1개 차감된다.

ALTER TABLE students ADD COLUMN IF NOT EXISTS green_light_count int NOT NULL DEFAULT 0;
