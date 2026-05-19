# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ux.spec.ts >> HomeArcade UX — Navigation & Structure >> sidebar system filters navigate to correct library views
- Location: e2e\ux.spec.ts:114:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/library
Call log:
  - navigating to "http://localhost:5000/#/library", waiting until "load"

```

# Test source

```ts
  15  | const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';
  16  | const APP_URL  = `${BASE_URL}/#`;
  17  | 
  18  | // ── Helpers ────────────────────────────────────────────────────────────────────
  19  | 
  20  | async function waitForToast(page: Page, timeoutMs = 5000): Promise<void> {
  21  |   await page.waitForSelector('[role="status"], [data-testid="toast"]', { timeout: timeoutMs }).catch(() => {});
  22  | }
  23  | 
  24  | /** Dismiss all visible toasts */
  25  | async function dismissToasts(page: Page): Promise<void> {
  26  |   const closeButtons = page.locator('[aria-label="Close"], [data-testid="toast-dismiss"]');
  27  |   const count = await closeButtons.count();
  28  |   for (let i = 0; i < count; i++) {
  29  |     await closeButtons.first().click();
  30  |     await page.waitForTimeout(200);
  31  |   }
  32  | }
  33  | 
  34  | /** Escape key shorthand */
  35  | async function pressEsc(page: Page): Promise<void> {
  36  |   await page.keyboard.press('Escape');
  37  | }
  38  | 
  39  | /** Get a count of visible game cards (non-skeleton) */
  40  | async function visibleGameCardCount(page: Page): Promise<number> {
  41  |   return page.locator('[data-testid^="card-game-"]:not(.animate-pulse)').count();
  42  | }
  43  | 
  44  | // ── Test Suite ─────────────────────────────────────────────────────────────────
  45  | 
  46  | test.describe('HomeArcade UX — Navigation & Structure', () => {
  47  | 
  48  |   test('sidebar is visible on all main routes', async ({ page }) => {
  49  |     const routes = ['/', '/library', '/settings', '/history', '/achievements'];
  50  |     for (const route of routes) {
  51  |       await page.goto(`${APP_URL}${route}`);
  52  |       await page.waitForLoadState('networkidle');
  53  |       const sidebar = page.locator('[data-testid="sidebar"], nav[aria-label="Sidebar"], [class*="sidebar"]').first();
  54  |       await expect(sidebar).toBeVisible({ timeout: 8000 });
  55  |     }
  56  |   });
  57  | 
  58  |   test('sidebar collapses to icons on desktop', async ({ page }) => {
  59  |     await page.setViewportSize({ width: 1280, height: 800 });
  60  |     await page.goto(`${APP_URL}/`);
  61  |     await page.waitForLoadState('networkidle');
  62  | 
  63  |     // Find collapse toggle
  64  |     const trigger = page.locator('[aria-label="Collapse sidebar"], button[class*="trigger"]').first();
  65  |     if (await trigger.count() > 0) {
  66  |       await trigger.click();
  67  |       await page.waitForTimeout(400);
  68  |       // After collapse, sidebar should show icons only (no text)
  69  |       const textItems = page.locator('.sidebar span:not([class*="size"])');
  70  |       await expect(await textItems.count()).toBe(0);
  71  |     }
  72  |   });
  73  | 
  74  |   test('sidebar can expand again after collapse', async ({ page }) => {
  75  |     await page.setViewportSize({ width: 1280, height: 800 });
  76  |     await page.goto(`${APP_URL}/`);
  77  |     await page.waitForLoadState('networkidle');
  78  | 
  79  |     const trigger = page.locator('[aria-label="Collapse sidebar"], [aria-label="Expand sidebar"]').first();
  80  |     if (await trigger.count() > 0) {
  81  |       await trigger.click();
  82  |       await page.waitForTimeout(300);
  83  |       await trigger.click(); // re-expand
  84  |       await page.waitForTimeout(300);
  85  |       // After expand, nav items should be visible
  86  |       const nav = page.locator('nav').first();
  87  |       await expect(nav).toBeVisible();
  88  |     }
  89  |   });
  90  | 
  91  |   test('all sidebar nav items navigate correctly', async ({ page }) => {
  92  |     await page.goto(`${APP_URL}/`);
  93  |     await page.waitForLoadState('networkidle');
  94  | 
  95  |     // Nav items to click
  96  |     const navItems: [string, string][] = [
  97  |       ['Favorites',  '/library/favorites'],
  98  |       ['Recently Played', '/library/recent'],
  99  |       ['All Games',  '/library/all'],
  100 |       ['History',    '/history'],
  101 |       ['Settings',   '/settings'],
  102 |     ];
  103 | 
  104 |     for (const [label, expectedPath] of navItems) {
  105 |       const item = page.locator(`text="${label}"`).first();
  106 |       if (await item.count() > 0) {
  107 |         await item.click();
  108 |         await page.waitForLoadState('networkidle');
  109 |         await expect(page).toHaveURL(`${BASE_URL}/#${expectedPath}`, { timeout: 5000 });
  110 |       }
  111 |     }
  112 |   });
  113 | 
  114 |   test('sidebar system filters navigate to correct library views', async ({ page }) => {
> 115 |     await page.goto(`${APP_URL}/library`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/library
  116 |     await page.waitForLoadState('networkidle');
  117 | 
  118 |     // Click a system filter in the sidebar if visible
  119 |     const systemButtons = page.locator('[aria-label*="NES"], [aria-label*="SNES"], [aria-label*="Genesis"]');
  120 |     const count = await systemButtons.count();
  121 |     if (count > 0) {
  122 |       await systemButtons.first().click();
  123 |       await page.waitForLoadState('networkidle');
  124 |       // Should show filtered game list
  125 |       const cards = await visibleGameCardCount(page);
  126 |       expect(cards).toBeGreaterThanOrEqual(0);
  127 |     }
  128 |   });
  129 | 
  130 | });
  131 | 
  132 | test.describe('HomeArcade UX — Game Library (Home Page)', () => {
  133 | 
  134 |   test('game grid renders cards or empty state', async ({ page }) => {
  135 |     await page.goto(`${APP_URL}/library`);
  136 |     await page.waitForLoadState('networkidle');
  137 |     await page.waitForTimeout(2000); // allow async data
  138 | 
  139 |     const cards = await visibleGameCardCount(page);
  140 |     const emptyState = page.locator('[data-testid="state-empty"]');
  141 |     const hasEmpty = await emptyState.count() > 0;
  142 |     expect(cards + (hasEmpty ? 1 : 0)).toBeGreaterThan(0);
  143 |   });
  144 | 
  145 |   test('search bar filters games in real time', async ({ page }) => {
  146 |     await page.goto(`${APP_URL}/library`);
  147 |     await page.waitForLoadState('networkidle');
  148 |     await page.waitForTimeout(2000);
  149 | 
  150 |     // Find search input
  151 |     const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i], [aria-label*="search" i]').first();
  152 |     if (await searchInput.count() === 0) {
  153 |       test.skip(); // no search input found
  154 |       return;
  155 |     }
  156 | 
  157 |     const initialCards = await visibleGameCardCount(page);
  158 |     await searchInput.fill('zzzz-unlikely-game-title-xyz');
  159 |     await page.waitForTimeout(500);
  160 |     const filteredCards = await visibleGameCardCount(page);
  161 | 
  162 |     // Either empty state or fewer cards
  163 |     const hasEmpty = await page.locator('[data-testid="state-empty"]').count() > 0;
  164 |     expect(filteredCards < initialCards || hasEmpty).toBeTruthy();
  165 |   });
  166 | 
  167 |   test('search can be cleared with X button', async ({ page }) => {
  168 |     await page.goto(`${APP_URL}/library`);
  169 |     await page.waitForLoadState('networkidle');
  170 |     await page.waitForTimeout(2000);
  171 | 
  172 |     const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
  173 |     if (await searchInput.count() === 0) {
  174 |       test.skip();
  175 |       return;
  176 |     }
  177 | 
  178 |     await searchInput.fill('test');
  179 |     await page.waitForTimeout(300);
  180 | 
  181 |     const clearBtn = page.locator('[aria-label="Clear search"], button:has-text("Clear")').first();
  182 |     if (await clearBtn.count() > 0) {
  183 |       await clearBtn.click();
  184 |       await page.waitForTimeout(300);
  185 |       const value = await searchInput.inputValue();
  186 |       expect(value).toBe('');
  187 |     }
  188 |   });
  189 | 
  190 |   test('sort options change game order', async ({ page }) => {
  191 |     await page.goto(`${APP_URL}/library`);
  192 |     await page.waitForLoadState('networkidle');
  193 |     await page.waitForTimeout(2000);
  194 | 
  195 |     const sortBtn = page.locator('[data-testid^="button-sort-"]').first();
  196 |     if (await sortBtn.count() === 0) {
  197 |       test.skip();
  198 |       return;
  199 |     }
  200 | 
  201 |     await sortBtn.click();
  202 |     await page.waitForTimeout(500);
  203 | 
  204 |     const options = page.locator('[data-testid^="button-sort-"]');
  205 |     const optionCount = await options.count();
  206 |     expect(optionCount).toBeGreaterThan(1);
  207 | 
  208 |     // Click each sort option and verify no crash
  209 |     for (let i = 0; i < Math.min(optionCount, 4); i++) {
  210 |       await options.nth(i).click();
  211 |       await page.waitForTimeout(300);
  212 |       await expect(page.locator('body')).toBeVisible();
  213 |     }
  214 |   });
  215 | 
```