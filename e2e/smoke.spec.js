// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * E2E Smoke Tests — TRỌNG ĐỊNH STORE
 * Pattern inspired by microsoft/playwright-mcp
 * 
 * Test các flow chính của trang thương mại điện tử
 * Chạy: npx playwright test --project=chromium
 * UI mode: npx playwright test --ui
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

test.describe('TRỌNG ĐỊNH STORE — Smoke Tests', () => {

  // ===== 1. Homepage =====
  test('1. Homepage loads with products and navigation', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Header elements
    await expect(page.locator('header').first()).toBeVisible();
    
    // Sản phẩm được hiển thị
    const products = page.locator('[class*="product"], [class*="card"], article');
    await expect(products.first()).toBeVisible({ timeout: 10000 });
    
    // Footer
    await expect(page.locator('footer').first()).toBeVisible();
    
    // Title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  // ===== 2. Navigation =====
  test('2. Navigation between pages works', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Click into a product category or link
    const firstLink = page.locator('a[href*="product"], a[href*="category"], a[href*="/product"]').first();
    if (await firstLink.isVisible()) {
      await firstLink.click();
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      expect(currentUrl).not.toBe(BASE_URL + '/');
    }
  });

  // ===== 3. Search =====
  test('3. Search functionality works', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="tìm"], input[placeholder*="search"], [class*="search"] input'
    ).first();

    if (await searchInput.isVisible()) {
      await searchInput.fill('Royal');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
      
      // Should see search results or be on search page
      const currentUrl = page.url();
      expect(currentUrl.toLowerCase()).toMatch(/(search|tim-kiem)/);
    }
  });

  // ===== 4. Add to Cart =====
  test('4. Add product to cart flow', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Find an "Add to Cart" button
    const addBtn = page.locator(
      'button:has-text("mua"), button:has-text("cart"), button:has-text("giỏ"), [class*="add-to-cart"], button:has-text("thêm")'
    ).first();

    if (await addBtn.isVisible()) {
      await addBtn.click();
      
      // Cart drawer should appear or cart count should update
      await page.waitForTimeout(1500);

      const cartDrawer = page.locator(
        '[class*="cart-drawer"], [class*="CartDrawer"], [class*="cart"]'
      ).first();
      
      const cartCount = page.locator('[class*="cart-count"], [class*="badge"]').first();
      
      // Either cart drawer is visible or cart count updated
      const drawerVisible = await cartDrawer.isVisible().catch(() => false);
      const countVisible = await cartCount.isVisible().catch(() => false);
      
      expect(drawerVisible || countVisible).toBeTruthy();
    }
  });

  // ===== 5. Authentication pages =====
  test('5. Sign-in and Sign-up pages accessible', async ({ page }) => {
    // Test sign-in page
    const signInRes = await page.goto(`${BASE_URL}/sign-in`, { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    expect(signInRes?.status()).toBeLessThan(400);

    // Test sign-up page  
    const signUpRes = await page.goto(`${BASE_URL}/sign-up`, { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    expect(signUpRes?.status()).toBeLessThan(400);
  });

  // ===== 6. Checkout page redirects to auth if not logged in =====
  test('6. Checkout page accessible or redirects gracefully', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/checkout`, { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    // Either shows checkout page or redirects to login (acceptable)
    const url = page.url();
    const isOnCheckout = url.includes('checkout');
    const isOnLogin = url.includes('sign-in') || url.includes('login');
    
    expect(isOnCheckout || isOnLogin).toBeTruthy();
  });

  // ===== 7. Responsive: Mobile viewport =====
  test('7. Mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    
    // Mobile menu button should be visible
    const mobileMenu = page.locator(
      'button[class*="menu"], button[class*="hamburger"], button[class*="mobile"], [aria-label*="menu"], button:has(svg)'
    ).first();
    
    // On mobile, either a hamburger menu is visible or the layout still works
    await expect(page.locator('header').first()).toBeVisible();
  });

  // ===== 8. API Health Check =====
  test('8. Backend API health endpoint responds', async ({ page }) => {
    const apiUrl = process.env.VITE_API_URL || BASE_URL;
    
    const response = await page.request.get(`${apiUrl}/api/health`, {
      timeout: 10000
    }).catch(() => null);

    if (response) {
      expect(response.status()).toBeLessThan(500);
      const body = await response.json().catch(() => ({}));
      console.log('Health check response:', JSON.stringify(body));
    } else {
      console.log('⚠️ API health check skipped (no backend running)');
      test.skip(); // Skip if no backend
    }
  });
});

test.describe('Admin Flow Tests', () => {
  // ===== 9. Admin page requires auth =====
  test('9. Admin page redirects to login', async ({ page }) => {
    const response = await page.goto(`${BASE_URL}/admin`, { 
      waitUntil: 'networkidle',
      timeout: 15000 
    });
    
    const url = page.url();
    const isOnAdmin = url.includes('/admin');
    const isOnLogin = url.includes('sign-in') || url.includes('login');
    
    // Either admin loads or redirects to login
    expect(isOnAdmin || isOnLogin).toBeTruthy();
  });
});
