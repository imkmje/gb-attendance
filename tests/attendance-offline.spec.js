const { test, expect } = require('@playwright/test');
const { installSupabaseMock } = require('./mocks/supabase');

test('저장이 네트워크 오류로 실패하면 오프라인 큐에 쌓였다가 온라인 복귀 시 자동 재전송된다', async ({ page }) => {
  const store = await installSupabaseMock(page);
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  await page.locator('#dateInput').fill('2026-08-19');
  await page.locator('#groupSelect').selectOption('청운반');
  await page.locator('#checkerName').fill('테스트교사');

  // installSupabaseMock의 attendance 핸들러보다 나중에 등록해서, 저장(POST)만
  // 골라 네트워크 오류로 만든다. route.fallback()으로 그 외 요청은 원래
  // mock으로 넘긴다.
  let failNextSave = true;
  await page.route('**/rest/v1/attendance*', async (route) => {
    if (route.request().method() === 'POST' && failNextSave) {
      return route.abort('failed');
    }
    return route.fallback();
  });

  await page.locator('#btnSave').click();

  await expect(page.getByText('오프라인 저장됨')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('#offlineQueueChip')).toHaveClass(/show/);
  expect(store.attendance.length).toBe(0); // 아직 서버엔 안 들어감

  // 네트워크 복구 시뮬레이션 → online 이벤트로 자동 재전송
  failNextSave = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));

  await expect.poll(() => store.attendance.length, { timeout: 5000 }).toBeGreaterThan(0);
  await expect(page.locator('#offlineQueueChip')).not.toHaveClass(/show/);
});
