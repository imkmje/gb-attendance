// @ts-check
const { defineConfig, devices } = require('@playwright/test');

// 이 앱은 빌드 단계가 없는 순수 정적 사이트라, 테스트 실행 시에도 그냥
// 정적 서버로 index.html을 그대로 띄운다. 네트워크(Supabase) 요청은
// 각 테스트에서 tests/mocks/supabase.js로 가로채므로 프로덕션 DB에는
// 전혀 접속하지 않는다.
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }], ['github']] : 'html',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // 반장들이 실제로 대부분 폰으로 쓰기 때문에 기본 뷰포트를 모바일로 —
    // PC 사이드바 대신 하단 탭바(#tab-*)가 뜨는 레이아웃으로 테스트한다.
    viewport: { width: 390, height: 844 },
  },
  projects: [
    // devices['Desktop Chrome']가 자체 viewport(1280x720)를 갖고 있어 위
    // use.viewport를 덮어쓰므로, 여기서 모바일 크기로 다시 명시한다.
    { name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: 'npx http-server . -p 4173 -c-1 --silent',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
