# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ux.spec.ts >> HomeArcade UX — Game Library (Home Page) >> sort options change game order
- Location: e2e\ux.spec.ts:190:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/library
Call log:
  - navigating to "http://localhost:5000/#/library", waiting until "load"

```

# Test source

```ts
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
  115 |     await page.goto(`${APP_URL}/library`);
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
> 191 |     await page.goto(`${APP_URL}/library`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/library
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
  216 |   test('filter pills filter the game list', async ({ page }) => {
  217 |     await page.goto(`${APP_URL}/library`);
  218 |     await page.waitForLoadState('networkidle');
  219 |     await page.waitForTimeout(2000);
  220 | 
  221 |     const filterPills = page.locator('[data-testid^="filter-"], button[class*="filter"]');
  222 |     const count = await filterPills.count();
  223 |     if (count === 0) {
  224 |       test.skip();
  225 |       return;
  226 |     }
  227 | 
  228 |     await filterPills.first().click();
  229 |     await page.waitForTimeout(500);
  230 |     await expect(page.locator('body')).toBeVisible();
  231 |   });
  232 | 
  233 |   test('grid/list view toggle works', async ({ page }) => {
  234 |     await page.goto(`${APP_URL}/library`);
  235 |     await page.waitForLoadState('networkidle');
  236 |     await page.waitForTimeout(2000);
  237 | 
  238 |     const toggleBtns = page.locator('[data-testid^="button-view-"]');
  239 |     if (await toggleBtns.count() >= 2) {
  240 |       await toggleBtns.nth(1).click(); // switch view
  241 |       await page.waitForTimeout(500);
  242 |       await toggleBtns.nth(0).click(); // switch back
  243 |       await page.waitForTimeout(300);
  244 |     }
  245 |   });
  246 | 
  247 |   test('hover on a game card shows overlay', async ({ page }) => {
  248 |     await page.goto(`${APP_URL}/library`);
  249 |     await page.waitForLoadState('networkidle');
  250 |     await page.waitForTimeout(2000);
  251 | 
  252 |     const card = page.locator('[data-testid^="card-game-"]').first();
  253 |     if (await card.count() === 0) {
  254 |       test.skip();
  255 |       return;
  256 |     }
  257 | 
  258 |     await card.hover();
  259 |     await page.waitForTimeout(400);
  260 | 
  261 |     const overlay = card.locator('[data-testid^="button-details-"]');
  262 |     await expect(overlay).toBeVisible({ timeout: 3000 });
  263 |   });
  264 | 
  265 |   test('click game card opens detail dialog', async ({ page }) => {
  266 |     await page.goto(`${APP_URL}/library`);
  267 |     await page.waitForLoadState('networkidle');
  268 |     await page.waitForTimeout(2000);
  269 | 
  270 |     const card = page.locator('[data-testid^="card-game-"]').first();
  271 |     if (await card.count() === 0) {
  272 |       test.skip();
  273 |       return;
  274 |     }
  275 | 
  276 |     await card.click();
  277 |     await page.waitForTimeout(800);
  278 | 
  279 |     // Dialog should be open
  280 |     const dialog = page.locator('[role="dialog"], [data-testid="game-detail"]').first();
  281 |     await expect(dialog).toBeVisible({ timeout: 5000 });
  282 |   });
  283 | 
  284 |   test('favorite button toggles without navigating away', async ({ page }) => {
  285 |     await page.goto(`${APP_URL}/library`);
  286 |     await page.waitForLoadState('networkidle');
  287 |     await page.waitForTimeout(2000);
  288 | 
  289 |     const favBtn = page.locator('[data-testid^="button-fav-"]').first();
  290 |     if (await favBtn.count() === 0) {
  291 |       test.skip();
```