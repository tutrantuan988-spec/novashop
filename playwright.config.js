// @ts-check
const { defineConfig, devices } = require('@playwright/test');

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
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
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
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: process.env.CI ? 'npm run build && npm run preview' : 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
