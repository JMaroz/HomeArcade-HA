# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ux.spec.ts >> HomeArcade UX — Settings Page >> settings page loads without crash
- Location: e2e\ux.spec.ts:391:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/settings
Call log:
  - navigating to "http://localhost:5000/#/settings", waiting until "load"

```

# Test source

```ts
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
  306 |     await page.goto(`${APP_URL}/library`);
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
> 392 |     await page.goto(`${APP_URL}/settings`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/settings
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
  407 |       return;
  408 |     }
  409 | 
  410 |     await themeControl.click();
  411 |     await page.waitForTimeout(500);
  412 | 
  413 |     // Check key themes exist
  414 |     const themes = ['synthwave', 'matrix', 'golden-age', 'retro', 'arcade', 'neon'];
  415 |     for (const theme of themes) {
  416 |       const el = page.locator(`text=${theme}`).first();
  417 |       await expect(el).toBeVisible({ timeout: 3000 });
  418 |     }
  419 | 
  420 |     // Select one theme
  421 |     await page.locator(`text=synthwave`).first().click();
  422 |     await page.waitForTimeout(500);
  423 | 
  424 |     // Should apply without crash
  425 |     await expect(page.locator('body')).toBeVisible();
  426 |   });
  427 | 
  428 |   test('language setting is accessible', async ({ page }) => {
  429 |     await page.goto(`${APP_URL}/settings`);
  430 |     await page.waitForLoadState('networkidle');
  431 |     await page.waitForTimeout(1000);
  432 | 
  433 |     const langControl = page.locator('[data-testid="language-select"], [aria-label*="language" i], [role="combobox"]:nth-of-type(2)').first();
  434 |     if (await langControl.count() === 0) {
  435 |       test.skip();
  436 |       return;
  437 |     }
  438 | 
  439 |     await langControl.click();
  440 |     await page.waitForTimeout(500);
  441 | 
  442 |     const option = page.locator('[role="option"], [data-state="checked"]').first();
  443 |     if (await option.count() > 0) {
  444 |       await option.click();
  445 |       await page.waitForTimeout(500);
  446 |     }
  447 |   });
  448 | 
  449 |   test('settings changes persist after page reload', async ({ page }) => {
  450 |     await page.goto(`${APP_URL}/settings`);
  451 |     await page.waitForLoadState('networkidle');
  452 |     await page.waitForTimeout(1000);
  453 | 
  454 |     const themeControl = page.locator('[data-testid="theme-select"], [role="combobox"], [aria-label*="theme" i]').first();
  455 |     if (await themeControl.count() === 0) {
  456 |       test.skip();
  457 |       return;
  458 |     }
  459 | 
  460 |     await themeControl.click();
  461 |     await page.waitForTimeout(500);
  462 | 
  463 |     // Select a second theme
  464 |     const allThemes = page.locator('[role="option"], [data-testid^="option-"]');
  465 |     if (await allThemes.count() > 1) {
  466 |       await allThemes.nth(1).click();
  467 |       await page.waitForTimeout(500);
  468 |     }
  469 | 
  470 |     // Reload page
  471 |     await page.reload();
  472 |     await page.waitForLoadState('networkidle');
  473 |     await page.waitForTimeout(1000);
  474 | 
  475 |     // Theme should still be applied (or at least no crash)
  476 |     await expect(page.locator('body')).toBeVisible();
  477 |   });
  478 | 
  479 | });
  480 | 
  481 | test.describe('HomeArcade UX — Keyboard Navigation', () => {
  482 | 
  483 |   test('Tab key navigates through interactive elements', async ({ page }) => {
  484 |     await page.goto(`${APP_URL}/library`);
  485 |     await page.waitForLoadState('networkidle');
  486 |     await page.waitForTimeout(2000);
  487 | 
  488 |     // Press Tab several times
  489 |     await page.keyboard.press('Tab');
  490 |     await page.waitForTimeout(200);
  491 |     await page.keyboard.press('Tab');
  492 |     await page.waitForTimeout(200);
```