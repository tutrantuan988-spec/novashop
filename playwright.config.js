// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const projects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
];

if (process.env.E2E_FIREFOX === '1') {
  projects.splice(1, 0, {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  });
}

/**
 * Playwright Config — Cho E2E testing của TRỌNG ĐỊNH STORE
 * 
 * Tích hợp với playwright-mcp server:
 * - Test thanh toán Stripe
 * - Test đăng nhập/đăng ký Clerk
 * - Test giỏ hàng, tìm kiếm
 * - Screenshot cho visual regression
 * - PDF generation cho hoá đơn
 * 
 * @see https://playwright.dev/docs/test-configuration
 * @see https://github.com/microsoft/playwright-mcp
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'e2e/report' }],
    ['list'],
    ['json', { outputFile: 'e2e/results.json' }]
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    serviceWorkers: 'block',
  },

  projects,

  webServer: {
    command: process.env.CI ? 'npm run build && npm run preview' : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
