# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: now-playing.spec.ts >> NowPlayingBar >> session timer increments over time
- Location: e2e\now-playing.spec.ts:86:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="now-playing-bar"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('[data-testid="now-playing-bar"]')

```

# Test source

```ts
  1   | /**
  2   |  * NowPlayingBar E2E Tests
  3   |  *
  4   |  * Tests the persistent Now Playing mini-player bar that appears
  5   |  * when a game is active.
  6   |  *
  7   |  * Run with: npx playwright test e2e/now-playing.spec.ts
  8   |  */
  9   | 
  10  | import { test, expect, type Page } from '@playwright/test';
  11  | 
  12  | const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';
  13  | 
  14  | /** Override /api/now-playing to return a fake "playing" state */
  15  | async function mockNowPlaying(page: Page, data: Record<string, unknown>) {
  16  |   await page.route('/api/now-playing', async (route) => {
  17  |     await route.fulfill({ json: data, status: 200 });
  18  |   });
  19  | }
  20  | 
  21  | /** Clear the mock so it returns playing: false */
  22  | async function clearNowPlaying(page: Page) {
  23  |   await page.route('/api/now-playing', async (route) => {
  24  |     await route.fulfill({ json: { playing: false }, status: 200 });
  25  |   });
  26  | }
  27  | 
  28  | test.describe('NowPlayingBar', () => {
  29  | 
  30  |   test('is hidden when no game is playing', async ({ page }) => {
  31  |     await clearNowPlaying(page);
  32  |     await page.goto(`${BASE_URL}/`);
  33  |     await page.waitForLoadState('networkidle');
  34  |     await page.waitForTimeout(2000);
  35  | 
  36  |     // Bar should not be visible
  37  |     const bar = page.locator('[data-testid="now-playing-bar"]');
  38  |     await expect(bar).not.toBeVisible();
  39  |   });
  40  | 
  41  |   test('appears when a game is active (playing=true)', async ({ page }) => {
  42  |     await mockNowPlaying(page, {
  43  |       playing: true,
  44  |       id: 42,
  45  |       title: 'Duck Tales',
  46  |       system: 'nes',
  47  |       startedAt: Date.now() - 60_000, // started 1 min ago
  48  |     });
  49  | 
  50  |     await page.goto(`${BASE_URL}/`);
  51  |     await page.waitForLoadState('networkidle');
  52  |     await page.waitForTimeout(2000);
  53  | 
  54  |     const bar = page.locator('[data-testid="now-playing-bar"]');
  55  |     await expect(bar).toBeVisible({ timeout: 5000 });
  56  | 
  57  |     // Title should appear
  58  |     await expect(page.locator('text=Duck Tales')).toBeVisible();
  59  |     await expect(page.locator('text=nes')).toBeVisible();
  60  |   });
  61  | 
  62  |   test('shows "Now Playing" label and pulsing green dot', async ({ page }) => {
  63  |     await mockNowPlaying(page, {
  64  |       playing: true,
  65  |       id: 99,
  66  |       title: 'Street Fighter II',
  67  |       system: 'snes',
  68  |       startedAt: Date.now() - 120_000,
  69  |     });
  70  | 
  71  |     await page.goto(`${BASE_URL}/`);
  72  |     await page.waitForLoadState('networkidle');
  73  |     await page.waitForTimeout(2000);
  74  | 
  75  |     const bar = page.locator('[data-testid="now-playing-bar"]');
  76  |     await expect(bar).toBeVisible();
  77  | 
  78  |     // "Now Playing" label should be visible
  79  |     await expect(page.locator('text=Now Playing')).toBeVisible();
  80  | 
  81  |     // Pulsing dot should exist
  82  |     const dot = bar.locator('[class*="animate-ping"]');
  83  |     await expect(dot).toBeVisible();
  84  |   });
  85  | 
  86  |   test('session timer increments over time', async ({ page }) => {
  87  |     await mockNowPlaying(page, {
  88  |       playing: true,
  89  |       id: 7,
  90  |       title: 'Tetris',
  91  |       system: 'gameboy',
  92  |       startedAt: Date.now() - 90_000,
  93  |     });
  94  | 
  95  |     await page.goto(`${BASE_URL}/`);
  96  |     await page.waitForLoadState('networkidle');
  97  |     await page.waitForTimeout(2000);
  98  | 
  99  |     const bar = page.locator('[data-testid="now-playing-bar"]');
> 100 |     await expect(bar).toBeVisible({ timeout: 5000 });
      |                       ^ Error: expect(locator).toBeVisible() failed
  101 | 
  102 |     // Read initial timer value
  103 |     const initialTimer = await bar.locator('[data-testid="now-playing-timer"]').textContent();
  104 | 
  105 |     // Wait 3 seconds
  106 |     await page.waitForTimeout(3000);
  107 | 
  108 |     // Timer should have increased (now shows >= 93s → "1:33" or similar)
  109 |     const newTimer = await bar.locator('[data-testid="now-playing-timer"]').textContent();
  110 |     expect(newTimer).not.toBe(initialTimer);
  111 |   });
  112 | 
  113 |   test('"Return" button links to the player page', async ({ page }) => {
  114 |     await mockNowPlaying(page, {
  115 |       playing: true,
  116 |       id: 42,
  117 |       title: 'Duck Tales',
  118 |       system: 'nes',
  119 |       startedAt: Date.now(),
  120 |     });
  121 | 
  122 |     await page.goto(`${BASE_URL}/`);
  123 |     await page.waitForLoadState('networkidle');
  124 |     await page.waitForTimeout(2000);
  125 | 
  126 |     const bar = page.locator('[data-testid="now-playing-bar"]');
  127 |     await expect(bar).toBeVisible({ timeout: 5000 });
  128 | 
  129 |     const returnBtn = page.locator('[data-testid="now-playing-return"]');
  130 |     await expect(returnBtn).toBeVisible();
  131 |     await expect(returnBtn).toHaveAttribute('href', '/play/42');
  132 |   });
  133 | 
  134 |   test('"Exit" button navigates home', async ({ page }) => {
  135 |     await mockNowPlaying(page, {
  136 |       playing: true,
  137 |       id: 42,
  138 |       title: 'Duck Tales',
  139 |       system: 'nes',
  140 |       startedAt: Date.now(),
  141 |     });
  142 | 
  143 |     await page.goto(`${BASE_URL}/`);
  144 |     await page.waitForLoadState('networkidle');
  145 |     await page.waitForTimeout(2000);
  146 | 
  147 |     const exitBtn = page.locator('[data-testid="now-playing-exit"]');
  148 |     if (await exitBtn.count() > 0) {
  149 |       // Intercept the exit API call
  150 |       await page.route('/api/roms/exit', async (route) => {
  151 |         await route.fulfill({ json: { ok: true }, status: 200 });
  152 |       });
  153 | 
  154 |       await exitBtn.click();
  155 |       await page.waitForTimeout(500);
  156 |       // Should redirect home
  157 |       await expect(page).toHaveURL(/\/$|.*#\/$/);
  158 |     } else {
  159 |       test.skip();
  160 |     }
  161 |   });
  162 | 
  163 |   test('dismiss button hides the bar', async ({ page }) => {
  164 |     await mockNowPlaying(page, {
  165 |       playing: true,
  166 |       id: 42,
  167 |       title: 'Duck Tales',
  168 |       system: 'nes',
  169 |       startedAt: Date.now(),
  170 |     });
  171 | 
  172 |     await page.goto(`${BASE_URL}/`);
  173 |     await page.waitForLoadState('networkidle');
  174 |     await page.waitForTimeout(2000);
  175 | 
  176 |     const bar = page.locator('[data-testid="now-playing-bar"]');
  177 |     await expect(bar).toBeVisible({ timeout: 5000 });
  178 | 
  179 |     const dismissBtn = page.locator('[aria-label="Dismiss now playing bar"]');
  180 |     await dismissBtn.click();
  181 |     await page.waitForTimeout(400);
  182 | 
  183 |     // Bar should be gone
  184 |     await expect(bar).not.toBeVisible();
  185 |   });
  186 | 
  187 |   test('bar position: above mobile bottom nav', async ({ page }) => {
  188 |     await page.setViewportSize({ width: 390, height: 844 });
  189 |     await mockNowPlaying(page, {
  190 |       playing: true,
  191 |       id: 42,
  192 |       title: 'Duck Tales',
  193 |       system: 'nes',
  194 |       startedAt: Date.now(),
  195 |     });
  196 | 
  197 |     await page.goto(`${BASE_URL}/`);
  198 |     await page.waitForLoadState('networkidle');
  199 |     await page.waitForTimeout(2000);
  200 | 
```