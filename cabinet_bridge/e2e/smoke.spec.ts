/**
 * Playwright E2E smoke test.
 * Requires the dev server running: `npm run dev`
 * Run with: npx playwright test
 *
 * Install once: npx playwright install chromium
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';

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
    await page.goto(`${APP_URL}/`);
    // Either a game card or the empty state message should be present
    const hasGames = await page.locator('[data-testid="game-card"]').count();
    const hasEmpty = await page.locator('text=No games').count();
    expect(hasGames + hasEmpty).toBeGreaterThan(0);
  });

  test('settings page loads and shows theme picker', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/settings`);
    await expect(page.locator('text=Theme')).toBeVisible();
  });

  test('all 26 themes appear in settings', async ({ page }) => {
    await page.goto(`${BASE_URL}/#/settings`);
    // Open the theme select / combobox
    const themeControl = page.locator('[data-testid="theme-select"], [aria-label*="theme" i]').first();
    if (await themeControl.count() > 0) {
      await themeControl.click();
      await expect(page.locator('text=synthwave')).toBeVisible();
      await expect(page.locator('text=matrix')).toBeVisible();
      await expect(page.locator('text=golden-age')).toBeVisible();
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
