const { test, expect } = require('@playwright/test');
const { installSupabaseMock } = require('./mocks/supabase');

// 출석체크 탭의 "골든 패스" — 학생 목록을 불러와서, 한 명을 결석으로
// 바꾸고, 사유를 입력한 뒤 저장까지 끝까지 해본다.
test('학생을 결석 처리하고 사유를 입력해 저장할 수 있다', async ({ page }) => {
  const store = await installSupabaseMock(page);
  await page.goto('/');

  // 스플래시가 사라지고 그룹 목록이 채워질 때까지 대기
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  await page.locator('#dateInput').fill('2026-08-19'); // 수요일 고정
  await page.locator('#groupSelect').selectOption('청운반');

  const cards = page.locator('.student-card');
  await expect(cards).toHaveCount(2);

  const first = cards.first();
  await expect(first).toHaveClass(/present/);
  await expect(first.locator('.s-badge')).toHaveText('출석');

  // 탭해서 결석으로 전환
  await first.click();
  await expect(first).toHaveClass(/absent/);
  await expect(first.locator('.s-badge')).toHaveText('결석');

  // 사유 선택
  await first.locator('.cd-reason-select').selectOption({ label: '학원 보강' });

  await page.locator('#checkerName').fill('테스트교사');
  await page.locator('#btnSave').click();

  await expect(page.getByText('저장 완료')).toBeVisible({ timeout: 5000 });

  // 실제로 mock 스토어에 결석 기록이 저장됐는지 확인
  await expect.poll(() => store.attendance.length).toBeGreaterThan(0);
  const saved = store.attendance.find(r => r.status === '결석');
  expect(saved).toBeTruthy();
  expect(saved.reason).toBe('학원 보강');
});
