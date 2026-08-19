const { test, expect } = require('@playwright/test');
const { installSupabaseMock } = require('./mocks/supabase');

test('대시보드는 비밀번호가 맞아야 들어갈 수 있고, 점등 표시가 명단을 반영한다', async ({ page }) => {
  await installSupabaseMock(page, {
    attendance: [
      {
        id: 'att-1', student_id: 'stu-1', record_date: '2026-08-19', session: '오후 자율학습',
        status: '출석', reason: '', no_count: false, checker: '테스트교사', early_leave_mins: 0, late_mins: 0,
      },
    ],
  });
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  await page.locator('#tab-dashboard').click();
  await expect(page.locator('.swal2-popup')).toBeVisible();

  // 오답
  await page.locator('.swal2-input').fill('0000');
  await page.getByRole('button', { name: '확인' }).click();
  await expect(page.getByText('비밀번호가 틀렸습니다')).toBeVisible();
  await page.getByRole('button', { name: '확인' }).click();

  // 정답
  await page.locator('#tab-dashboard').click();
  await page.locator('.swal2-input').fill('2821');
  await page.getByRole('button', { name: '확인' }).click();

  await expect(page.locator('#view-dashboard')).toHaveClass(/active/);

  // 고정 날짜로 다시 조회해서 결정적으로 검증
  await page.locator('#dashDateInput').fill('2026-08-19');

  // 청운반(학생 2명) · 백운 A반(학생 1명) 둘 다 점등 바에 나타나야 함
  const lightsRow = page.locator('#dashLights .dash-lights-grp');
  await expect(lightsRow).toHaveCount(2, { timeout: 5000 });
  await expect(page.locator('#dashLights')).toContainText('청운');
});
