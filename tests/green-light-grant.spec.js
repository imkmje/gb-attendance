const { test, expect } = require('@playwright/test');
const { installSupabaseMock, DEFAULT_STUDENTS } = require('./mocks/supabase');

// 명단 탭 배지 — 잔여 개수가 있는 학생만 🟢 배지가 뜬다.
test('명단 탭 카드에 그린라이트 잔여 개수 배지가 표시된다', async ({ page }) => {
  const students = DEFAULT_STUDENTS.map(s => (s.id === 'stu-1' ? { ...s, green_light_count: 2 } : s));
  await installSupabaseMock(page, { students });
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  await page.locator('#tab-roster').click();
  await expect(page.locator('#view-roster')).toHaveClass(/active/);

  const card1 = page.locator('.roster-card', { hasText: '김민준' });
  await expect(card1.locator('.rc-greenlight-badge')).toHaveText('🟢 그린라이트 2');

  const card2 = page.locator('.roster-card', { hasText: '이서연' });
  await expect(card2.locator('.rc-greenlight-badge')).toHaveCount(0);
});

// 개발자 메뉴 → 데이터 탭 → 그린라이트 일괄 지급 — 붙여넣기 → 미리보기(매칭/실패 구분)
// → 확정까지 끝까지 해보고, 기존 개수에 더해지는지 + 활동 로그가 남는지 확인한다.
test('개발자 메뉴에서 그린라이트를 일괄 지급하면 기존 개수에 더해지고 활동 로그가 남는다', async ({ page }) => {
  const store = await installSupabaseMock(page);
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  // 헤더 3연타 + 비밀번호(4834)로 개발자 메뉴 진입
  const header = page.locator('.header-title');
  await header.click();
  await header.click();
  await header.click();
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await page.locator('.swal2-input').fill('4834');
  await page.getByRole('button', { name: '확인' }).click();

  await page.locator('#_devSeg-data').click();

  await page.locator('#_glSourceSelect').selectOption('모의고사');
  // 반\t번호\t이름\t개수 — 매칭 2건(stu-1, stu-2) + 실패 1건(없는 학생)
  await page.locator('#_glPasteInput').fill('2\t6\t김민준\t1\n3\t11\t이서연\t2\n9\t99\t없는학생\t1');
  await page.getByRole('button', { name: '미리보기' }).click();

  await expect(page.getByText('미리보기 — 매칭 2명 · 실패 1건')).toBeVisible();
  await expect(page.locator('#_glPreviewArea')).toContainText('9반 99번 없는학생 — 명단에서 못 찾음');
  await expect(page.locator('#_glPreviewArea')).toContainText('2반 6번 김민준');
  await expect(page.locator('#_glPreviewArea')).toContainText('+1');
  await expect(page.locator('#_glPreviewArea')).toContainText('+2');

  await page.getByRole('button', { name: '반영 확정' }).click();
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await page.getByRole('button', { name: '반영', exact: true }).click();

  await expect(page.getByText('그린라이트 반영 완료')).toBeVisible({ timeout: 5000 });

  await expect.poll(() => store.students.find(s => s.id === 'stu-1')?.green_light_count).toBe(1);
  await expect.poll(() => store.students.find(s => s.id === 'stu-2')?.green_light_count).toBe(2);

  const log = store.activity_log.find(l => l.type === 'green_light' && l.student_id === 'stu-1');
  expect(log).toBeTruthy();
  expect(log.message).toContain('모의고사');
  expect(log.message).toContain('+1');
});

// 회수(음수 개수) — 잘못 지급한 경우 등 교사 임의 정정. 0 밑으로는 안 내려간다.
test('회수(음수 개수)를 붙여넣으면 차감되고, 0 밑으로는 안 내려간다', async ({ page }) => {
  const students = DEFAULT_STUDENTS.map(s => {
    if (s.id === 'stu-1') return { ...s, green_light_count: 1 };
    if (s.id === 'stu-2') return { ...s, green_light_count: 2 };
    return s;
  });
  const store = await installSupabaseMock(page, { students });
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  const header = page.locator('.header-title');
  await header.click();
  await header.click();
  await header.click();
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await page.locator('.swal2-input').fill('4834');
  await page.getByRole('button', { name: '확인' }).click();
  await page.locator('#_devSeg-data').click();

  await page.locator('#_glSourceSelect').selectOption('정정·회수');
  // 김민준: 보유 1개인데 3개 회수 시도 → 0에서 멈춰야 함 / 이서연: 보유 2개 중 1개만 회수
  await page.locator('#_glPasteInput').fill('2\t6\t김민준\t-3\n3\t11\t이서연\t-1');
  await page.getByRole('button', { name: '미리보기' }).click();

  await expect(page.getByText('미리보기 — 매칭 2명')).toBeVisible();
  await expect(page.locator('#_glPreviewArea')).toContainText('-3 (1→0)');
  await expect(page.locator('#_glPreviewArea')).toContainText('-1 (2→1)');

  await page.getByRole('button', { name: '반영 확정' }).click();
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await page.getByRole('button', { name: '반영', exact: true }).click();
  await expect(page.getByText('그린라이트 반영 완료')).toBeVisible({ timeout: 5000 });

  await expect.poll(() => store.students.find(s => s.id === 'stu-1')?.green_light_count).toBe(0);
  await expect.poll(() => store.students.find(s => s.id === 'stu-2')?.green_light_count).toBe(1);

  const log = store.activity_log.find(l => l.type === 'green_light' && l.student_id === 'stu-1');
  expect(log.message).toContain('-3개 회수');
});

// 개별 조정 — 엑셀 없이 이름 검색으로 학생 한 명만 부여/회수한다.
test('개별 조정에서 이름으로 검색해 학생을 선택하고 회수할 수 있다', async ({ page }) => {
  const students = DEFAULT_STUDENTS.map(s => (s.id === 'stu-1' ? { ...s, green_light_count: 2 } : s));
  const store = await installSupabaseMock(page, { students });
  await page.goto('/');
  await expect(page.locator('#appSplash')).toHaveCount(0, { timeout: 10000 });

  const header = page.locator('.header-title');
  await header.click();
  await header.click();
  await header.click();
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await page.locator('.swal2-input').fill('4834');
  await page.getByRole('button', { name: '확인' }).click();
  await page.locator('#_devSeg-data').click();

  await page.locator('#_glIndivSearchInput').fill('김민준');
  const resultRow = page.locator('#_glIndivResults button', { hasText: '김민준' });
  await expect(resultRow).toContainText('잔여 2개');
  await resultRow.click();

  // 선택 패널에 현재 잔여 개수가 뜨고, 검색창/결과 목록은 비워짐
  await expect(page.locator('#_glIndivPanel')).toContainText('김민준');
  await expect(page.locator('#_glIndivPanel')).toContainText('잔여 2개');
  await expect(page.locator('#_glIndivSearchInput')).toHaveValue('');

  // -1로 바꿔서 회수
  await page.locator('#_glIndivAmount').fill('-1');
  await page.locator('#_glIndivPanel').getByRole('button', { name: '적용', exact: true }).click();
  await expect(page.locator('.swal2-popup')).toBeVisible();
  await page.getByRole('button', { name: '반영', exact: true }).click();

  await expect(page.getByText('그린라이트 반영 완료')).toBeVisible({ timeout: 5000 });
  await expect.poll(() => store.students.find(s => s.id === 'stu-1')?.green_light_count).toBe(1);

  const log = store.activity_log.find(l => l.type === 'green_light' && l.student_id === 'stu-1');
  expect(log.message).toContain('-1개 회수');
});
