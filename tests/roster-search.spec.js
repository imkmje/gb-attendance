const { test, expect } = require('@playwright/test');
const { installSupabaseMock } = require('./mocks/supabase');

test('명단 탭 이름 검색과 학생 없는 반 자동 숨김', async ({ page }) => {
  await installSupabaseMock(page); // 청운반 2명, 백운 A반 1명 — B/C/D반은 0명
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  await page.locator('#tab-roster').click();
  await expect(page.locator('#view-roster')).toHaveClass(/active/);

  // 학생이 있는 반(전체/청운반/백운 A반)만 필터 pill로 떠야 하고,
  // 학생이 0명인 백운 B/C/D반은 안 보여야 한다.
  const pills = page.locator('#rosterPillWrap .roster-pill');
  await expect(pills).toHaveText(['전체', '청운반', '백운 A반']);

  // 이름 검색
  await page.locator('#rosterSearchInput').fill('이서연');
  await expect(page.locator('.roster-card')).toHaveCount(1);
  await expect(page.locator('.roster-card')).toContainText('이서연');

  await page.locator('#rosterSearchInput').fill('');
  await expect(page.locator('.roster-card')).toHaveCount(3);
});
