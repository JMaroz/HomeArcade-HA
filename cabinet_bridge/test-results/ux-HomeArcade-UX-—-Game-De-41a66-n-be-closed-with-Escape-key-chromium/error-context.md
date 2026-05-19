# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ux.spec.ts >> HomeArcade UX — Game Detail Dialog >> dialog can be closed with Escape key
- Location: e2e\ux.spec.ts:333:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/library
Call log:
  - navigating to "http://localhost:5000/#/library", waiting until "load"

```

# Test source

```ts
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
  292 |       return;
  293 |     }
  294 | 
  295 |     const beforeUrl = page.url();
  296 |     await favBtn.click();
  297 |     await page.waitForTimeout(500);
  298 |     expect(page.url()).toBe(beforeUrl); // no navigation
  299 |   });
  300 | 
  301 | });
  302 | 
  303 | test.describe('HomeArcade UX — Game Detail Dialog', () => {
  304 | 
  305 |   async function openGameDialog(page: Page): Promise<void> {
> 306 |     await page.goto(`${APP_URL}/library`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/library
  307 |     await page.waitForLoadState('networkidle');
  308 |     await page.waitForTimeout(2000);
  309 |     const card = page.locator('[data-testid^="card-game-"]').first();
  310 |     if (await card.count() > 0) {
  311 |       await card.click();
  312 |       await page.waitForTimeout(800);
  313 |     }
  314 |   }
  315 | 
  316 |   test('game detail dialog shows title and metadata', async ({ page }) => {
  317 |     await openGameDialog(page);
  318 |     const dialog = page.locator('[role="dialog"], [data-testid="game-detail"]').first();
  319 |     if (await dialog.count() === 0) {
  320 |       test.skip();
  321 |       return;
  322 |     }
  323 | 
  324 |     // Title should be visible
  325 |     const title = dialog.locator('h1, h2, [data-testid="dialog-title"], [class*="title"]').first();
  326 |     await expect(title).toBeVisible({ timeout: 3000 });
  327 | 
  328 |     // Rating, system label, or description should be present
  329 |     const hasMeta = await page.locator('text=/\\d+(\\.\\d)?\\/?\\d+|\\w+ system/i').count() > 0;
  330 |     expect(hasMeta).toBeTruthy();
  331 |   });
  332 | 
  333 |   test('dialog can be closed with Escape key', async ({ page }) => {
  334 |     await openGameDialog(page);
  335 |     const dialog = page.locator('[role="dialog"]').first();
  336 |     if (await dialog.count() === 0) {
  337 |       test.skip();
  338 |       return;
  339 |     }
  340 | 
  341 |     await pressEsc(page);
  342 |     await page.waitForTimeout(500);
  343 |     await expect(dialog).not.toBeVisible({ timeout: 3000 });
  344 |   });
  345 | 
  346 |   test('dialog can be closed by clicking backdrop', async ({ page }) => {
  347 |     await openGameDialog(page);
  348 |     const dialog = page.locator('[role="dialog"]').first();
  349 |     if (await dialog.count() === 0) {
  350 |       test.skip();
  351 |       return;
  352 |     }
  353 | 
  354 |     // Click outside the dialog
  355 |     const backdrop = page.locator('[data-state="open"] ~ *, [class*="backdrop"]').first();
  356 |     if (await backdrop.count() > 0) {
  357 |       await backdrop.click({ position: { x: 10, y: 10 }, force: true });
  358 |       await page.waitForTimeout(500);
  359 |     }
  360 |   });
  361 | 
  362 |   test('play button exists and is clickable', async ({ page }) => {
  363 |     await openGameDialog(page);
  364 |     const playBtn = page.locator('[data-testid^="button-play"], button:has-text("Play")').first();
  365 |     if (await playBtn.count() === 0) {
  366 |       test.skip();
  367 |       return;
  368 |     }
  369 | 
  370 |     await expect(playBtn).toBeVisible();
  371 |     await expect(playBtn).toBeEnabled();
  372 |   });
  373 | 
  374 |   test('dialog shows rating display', async ({ page }) => {
  375 |     await openGameDialog(page);
  376 |     const dialog = page.locator('[role="dialog"]').first();
  377 |     if (await dialog.count() === 0) {
  378 |       test.skip();
  379 |       return;
  380 |     }
  381 | 
  382 |     // Should show some star or number rating
  383 |     const ratingArea = page.locator('[data-testid^="rating"], svg[class*="star"], text=/rating/i').first();
  384 |     await expect(ratingArea).toBeVisible({ timeout: 3000 });
  385 |   });
  386 | 
  387 | });
  388 | 
  389 | test.describe('HomeArcade UX — Settings Page', () => {
  390 | 
  391 |   test('settings page loads without crash', async ({ page }) => {
  392 |     await page.goto(`${APP_URL}/settings`);
  393 |     await page.waitForLoadState('networkidle');
  394 |     await expect(page.locator('body')).toBeVisible();
  395 |     await expect(page.locator('text=/something went wrong/i')).not.toBeVisible();
  396 |   });
  397 | 
  398 |   test('all 26 themes are listed and selectable', async ({ page }) => {
  399 |     await page.goto(`${APP_URL}/settings`);
  400 |     await page.waitForLoadState('networkidle');
  401 |     await page.waitForTimeout(1000);
  402 | 
  403 |     // Open theme selector
  404 |     const themeControl = page.locator('[data-testid="theme-select"], [role="combobox"], [aria-label*="theme" i]').first();
  405 |     if (await themeControl.count() === 0) {
  406 |       test.skip();
```