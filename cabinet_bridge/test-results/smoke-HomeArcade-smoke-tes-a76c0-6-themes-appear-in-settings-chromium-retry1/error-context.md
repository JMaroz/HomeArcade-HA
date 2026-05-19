# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> HomeArcade smoke tests >> all 26 themes appear in settings
- Location: e2e\smoke.spec.ts:40:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/settings
Call log:
  - navigating to "http://localhost:5000/#/settings", waiting until "load"

```

# Test source

```ts
  1  | /**
  2  |  * Playwright E2E smoke test.
  3  |  * Requires the dev server running: `npm run dev`
  4  |  * Run with: npx playwright test
  5  |  *
  6  |  * Install once: npx playwright install chromium
  7  |  */
  8  | import { test, expect } from '@playwright/test';
  9  | 
  10 | const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';
  11 | 
  12 | test.describe('HomeArcade smoke tests', () => {
  13 |   test('health endpoint returns ok', async ({ request }) => {
  14 |     const res = await request.get(`${BASE_URL}/api/health`);
  15 |     expect(res.ok()).toBeTruthy();
  16 |     const body = await res.json();
  17 |     expect(body.status).toBe('ok');
  18 |   });
  19 | 
  20 |   test('dashboard loads without crashing', async ({ page }) => {
  21 |     await page.goto(`${BASE_URL}/`);
  22 |     await expect(page.locator('body')).toBeVisible();
  23 |     // Should not show an error boundary or crash message
  24 |     await expect(page.locator('text=Something went wrong')).not.toBeVisible();
  25 |   });
  26 | 
  27 |   test('library page renders game grid or empty state', async ({ page }) => {
  28 |     await page.goto(`${BASE_URL}/#/library`);
  29 |     // Either a game card or the empty state message should be present
  30 |     const hasGames = await page.locator('[data-testid="game-card"]').count();
  31 |     const hasEmpty = await page.locator('text=No games').count();
  32 |     expect(hasGames + hasEmpty).toBeGreaterThan(0);
  33 |   });
  34 | 
  35 |   test('settings page loads and shows theme picker', async ({ page }) => {
  36 |     await page.goto(`${BASE_URL}/#/settings`);
  37 |     await expect(page.locator('text=Theme')).toBeVisible();
  38 |   });
  39 | 
  40 |   test('all 26 themes appear in settings', async ({ page }) => {
> 41 |     await page.goto(`${BASE_URL}/#/settings`);
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/settings
  42 |     // Open the theme select / combobox
  43 |     const themeControl = page.locator('[data-testid="theme-select"], [aria-label*="theme" i]').first();
  44 |     if (await themeControl.count() > 0) {
  45 |       await themeControl.click();
  46 |       await expect(page.locator('text=synthwave')).toBeVisible();
  47 |       await expect(page.locator('text=matrix')).toBeVisible();
  48 |       await expect(page.locator('text=golden-age')).toBeVisible();
  49 |     }
  50 |   });
  51 | 
  52 |   test('history page loads', async ({ page }) => {
  53 |     await page.goto(`${BASE_URL}/#/history`);
  54 |     await expect(page.locator('body')).toBeVisible();
  55 |     await expect(page.locator('text=Something went wrong')).not.toBeVisible();
  56 |   });
  57 | 
  58 |   test('404 route shows not-found page', async ({ page }) => {
  59 |     await page.goto(`${BASE_URL}/#/this-route-does-not-exist`);
  60 |     await expect(page.locator('text=404').or(page.locator('text=Not Found'))).toBeVisible();
  61 |   });
  62 | });
  63 | 
```