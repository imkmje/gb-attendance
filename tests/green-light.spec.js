const { test, expect } = require('@playwright/test');
const { installSupabaseMock, DEFAULT_STUDENTS } = require('./mocks/supabase');

// 그린라이트 — 잔여 개수가 있는 학생에게만 결석 사유 드롭다운에 옵션이 뜨고,
// 실제로 골라서 저장하면 노카운트가 자동으로 잠기고 개수가 1개 차감된다.
test('그린라이트가 있는 학생만 결석 사유에 옵션이 뜨고, 사용하면 노카운트가 걸리며 개수가 차감된다', async ({ page }) => {
  const students = DEFAULT_STUDENTS.map(s => (s.id === 'stu-1' ? { ...s, green_light_count: 2 } : s));
  const store = await installSupabaseMock(page, { students });
  await page.goto('/');

  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  await page.locator('#dateInput').fill('2026-08-19'); // 수요일 고정
  await page.locator('#groupSelect').selectOption('청운반');

  const cards = page.locator('.student-card');
  await expect(cards).toHaveCount(2);

  const first  = cards.first(); // 김민준(stu-1) — 그린라이트 2개
  const second = cards.nth(1);  // 이서연(stu-2) — 그린라이트 없음

  // 결석으로 전환
  await first.click();
  await second.click();
  await expect(first).toHaveClass(/absent/);
  await expect(second).toHaveClass(/absent/);

  // 그린라이트 있는 학생에게만 옵션이 보이고, 잔여 개수가 라벨에 드러난다
  const glOption = first.locator('.cd-reason-select option', { hasText: '그린라이트' });
  await expect(glOption).toHaveCount(1);
  await expect(glOption).toHaveText(/2개 남음/);
  await expect(second.locator('.cd-reason-select option', { hasText: '그린라이트' })).toHaveCount(0);

  // 그린라이트 사용 선택 → 노카운트 스위치가 자동으로 켜지고 잠긴다
  await first.locator('.cd-reason-select').selectOption('그린라이트');
  const ncSw = page.locator('#nocount-sw-0');
  await expect(ncSw).toHaveClass(/on/);
  await expect(ncSw).toBeDisabled();

  await second.locator('.cd-reason-select').selectOption({ label: '병결(일회성 진료)' });

  await page.locator('#checkerName').fill('테스트교사');
  await page.locator('#btnSave').click();
  await expect(page.getByText('저장 완료')).toBeVisible({ timeout: 5000 });

  // 저장된 기록: 그린라이트는 no_count=true로 저장되고, 학생의 잔여 개수가 1 차감됨
  await expect.poll(() => store.students.find(s => s.id === 'stu-1')?.green_light_count).toBe(1);
  const savedGl = store.attendance.find(r => r.student_id === 'stu-1');
  expect(savedGl.reason).toBe('그린라이트');
  expect(savedGl.no_count).toBe(true);

  // 그린라이트 없던 학생은 평소대로 저장되고 그린라이트 개수는 안 건드림
  const savedOther = store.attendance.find(r => r.student_id === 'stu-2');
  expect(savedOther.reason).toBe('병결(일회성 진료)');
});
