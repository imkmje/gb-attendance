const { test, expect } = require('@playwright/test');
const { installSupabaseMock } = require('./mocks/supabase');

// 평일만 N일치(하루 오후·야간·심야 3세션 전부 출석) 출석 기록을 만든다.
function _weekdayRecords(studentId, days) {
  const recs = [];
  const d = new Date(2026, 2, 2); // 2026-03-02(월)
  let n = 0;
  while (n < days) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      for (const session of ['오후 자율학습', '야간 자율학습', '심야 자율학습']) {
        recs.push({
          id: `att-${studentId}-${n}-${session}`, student_id: studentId, record_date: date, session,
          status: '출석', reason: '', no_count: false, early_leave_mins: 0, late_mins: 0, study_excluded: false,
        });
      }
      n++;
    }
    d.setDate(d.getDate() + 1);
  }
  return recs;
}

// 출석 기록이 Supabase 한 요청 한도(1000행)를 넘어도 기간 결산·통계 탭이
// 전부 받아서 계산하는지, "출석 인정" 사유가 출석률·연속 자습에 반영되는지,
// "자습 시간 제외"가 통계 탭 누적 자습 시간에도 반영되는지 확인한다.
test('기간 결산·통계 탭이 1000행 넘는 기록을 모두 집계하고 출석 인정·자습 제외를 반영한다', async ({ page }) => {
  const DAYS = 400; // 400일 × 3세션 = 1200행
  const attendance = _weekdayRecords('stu-1', DAYS);
  // 200번째 날 심야: 학교 프로그램(출석 인정 사유)으로 결석 → 자습 시간 1.5h 빠짐, 연속 자습은 안 끊겨야 함
  const absentRec = attendance[200 * 3 + 2];
  Object.assign(absentRec, { status: '결석', reason: '청백지교' });
  // 100번째 날 오후: 자습 시간 제외 → 1.5h 빠짐
  attendance[100 * 3].study_excluded = true;

  await installSupabaseMock(page, { attendance });
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  const result = await page.evaluate(async () => {
    const summary = await API.getPeriodSummary('2026-01-01', '2030-12-31', ['청백지교']);
    const summaryNoReason = await API.getPeriodSummary('2026-01-01', '2030-12-31', []);
    const stats = await API.calculateStats(['청백지교']);
    const pick = arr => arr.find(s => s.id === 'stu-1');
    return { s: pick(summary), s0: pick(summaryNoReason), st: pick(stats) };
  });

  const expectedHours = DAYS * 5 - 1.5 - 1.5;
  expect(result.s.periodStudyHours).toBeCloseTo(expectedHours);
  expect(result.st.total).toBeCloseTo(expectedHours); // 통계 탭과 기간 결산이 같은 값
  expect(result.s.periodMaxStreak).toBe(DAYS);         // 출석 인정 사유는 연속 자습을 끊지 않음
  expect(result.s.attendRate).toBe(100);
  expect(result.s.absentCount).toBe(0);
  expect(result.st.absentCount).toBe(0);
  // 출석 인정 설정이 없으면 그 날에서 끊긴다(앞 200일 / 뒤 199일)
  expect(result.s0.periodMaxStreak).toBe(200);
  expect(result.s0.absentCount).toBe(1);
});

// 토요일은 오전/오후 세션 수와 상관없이 연속 자습 "1일"로 세고, 그날 기록된
// 세션(=신청한 세션)을 전부 출석해야 이어진다.
test('최대 연속 자습에서 토요일은 하루 1일로 세고, 기록된 세션 중 하나라도 결석이면 끊긴다', async ({ page }) => {
  const rec = (date, session, status = '출석') => ({
    id: `att-${date}-${session}`, student_id: 'stu-2', record_date: date, session, status,
    reason: '', no_count: false, early_leave_mins: 0, late_mins: 0, study_excluded: false,
  });
  const attendance = [
    rec('2026-09-04', '심야 자율학습'),                                  // 금
    rec('2026-09-05', '오전 자율학습(토)'), rec('2026-09-05', '오후1 자율학습(토)'), // 토: 둘 다 출석 → 1일
    rec('2026-09-07', '심야 자율학습'),                                  // 월  → 여기까지 3일
    rec('2026-09-12', '오전 자율학습(토)'), rec('2026-09-12', '오후1 자율학습(토)', '결석'), // 토: 오후 결석 → 끊김
    rec('2026-09-14', '심야 자율학습'),
    rec('2026-09-15', '심야 자율학습'),                                  // → 2일
  ];
  await installSupabaseMock(page, { attendance });
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  const s = await page.evaluate(async () =>
    (await API.getPeriodSummary('2026-09-01', '2026-09-30', [])).find(x => x.id === 'stu-2'));
  expect(s.periodMaxStreak).toBe(3);

  // 자습 시간은 선택한 기간만 집계한다(9/4 심야 1.5 + 9/5 토 오전 3 + 오후1 2 + 9/7 심야 1.5)
  const firstWeek = await page.evaluate(async () =>
    (await API.getPeriodSummary('2026-09-01', '2026-09-07', [])).find(x => x.id === 'stu-2'));
  expect(firstWeek.periodStudyHours).toBeCloseTo(8);
  expect(s.periodStudyHours).toBeCloseTo(8 + 3 + 1.5 + 1.5);
});
