const { test, expect } = require('@playwright/test');
const { installSupabaseMock } = require('./mocks/supabase');

// 회귀 테스트: 조퇴·지각 "요약 칩"을 탭하면 조기 퇴실/지각 편집 영역만
// 펼쳐져야 하고, 카드의 출결 상태(출석/결석)는 절대 바뀌면 안 된다.
// (개발 중 화면 좌표 오차로 실제로 이 버그를 만들 뻔했던 적이 있어 고정)
test('조퇴·지각 요약 칩을 눌러도 출결 상태는 그대로다', async ({ page }) => {
  await installSupabaseMock(page);
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  await page.locator('#dateInput').fill('2026-08-19');
  await page.locator('#groupSelect').selectOption('청운반');

  const first = page.locator('.student-card').first();
  await expect(first).toHaveClass(/present/);

  const toggleChip = first.locator('.el-toggle-chip');
  await expect(toggleChip).toHaveText(/조퇴·지각/);
  await expect(toggleChip).toHaveAttribute('aria-expanded', 'false');

  await toggleChip.click();

  // 펼쳐졌는지 + 상태는 그대로인지
  await expect(toggleChip).toHaveAttribute('aria-expanded', 'true');
  await expect(first).toHaveClass(/chips-open/);
  await expect(first).toHaveClass(/present/);
  await expect(first).not.toHaveClass(/absent/);
  await expect(first.locator('.s-badge')).toHaveText('출석');

  // 펼쳐진 뒤에는 실제 조기 퇴실/지각 칩이 보여야 한다
  await expect(first.locator('#el-chip-0')).toBeVisible();
  await expect(first.locator('#late-chip-0')).toBeVisible();
});
