-- 활동 로그 / 공지사항 테이블
-- Supabase SQL Editor에서 1회 실행 (anon key로는 DDL 불가)

CREATE TABLE activity_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  timestamptz DEFAULT now(),
  actor       text DEFAULT '',        -- 확인자/교사 성명 (checkerName 재사용)
  type        text NOT NULL DEFAULT 'schedule',  -- 'schedule' | 'notice'
  student_id  uuid REFERENCES students(id) ON DELETE SET NULL,
  message     text NOT NULL
);

CREATE INDEX ON activity_log(created_at DESC);
