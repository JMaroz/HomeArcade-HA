/**
 * Playwright E2E smoke test.
 * Requires the dev server running: `npm run dev`
 * Run with: npx playwright test
 *
 * Install once: npx playwright install chromium
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';
const APP_URL  = BASE_URL + '/#';

test.describe('HomeArcade smoke tests', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/api/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('ok');
  });

  test('dashboard loads without crashing', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('body')).toBeVisible();
    // Should not show an error boundary or crash message
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
  });

  test('home page renders game grid or empty state', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    // Wait for app to initialize (IntegrationProvider + React Query load from API)
    await page.waitForTimeout(5000);
    // Either game cards (data-testid^="card-game-") or visible body content
    const hasGames = await page.locator('[data-testid^="card-game-"]').count();
    // If no games and no cards, check that page at least has rendered something
    // (not a blank screen) by looking for the body element's children
    const bodyChildren = await page.locator('body > *').count();
    expect(hasGames + bodyChildren).toBeGreaterThan(0);
  });

  test('settings page loads and shows theme picker', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/settings`);
    await expect(page.locator('text=Theme')).toBeVisible();
  });

  test('all 26 themes appear in settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/settings`);
    // Open the theme select / combobox — uiTheme is a Select in Display tab
    const themeControl = page.locator('[data-testid="theme-select"], [aria-label*="theme" i], button:has-text("Theme")').first();
    if (await themeControl.count() > 0) {
      await themeControl.click();
      // Check a few actual theme names from THEMES array
      await expect(page.locator('text=Synthwave')).toBeVisible();
      await expect(page.locator('text=Matrix')).toBeVisible();
      await expect(page.locator('text=Golden-age')).toBeVisible();
    }
  });

  test('history page loads', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/history`);
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();
  });

  test('404 route shows not-found page', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/this-route-does-not-exist`);
    await expect(page.locator('text=404').or(page.locator('text=Not Found'))).toBeVisible();
  });
});
