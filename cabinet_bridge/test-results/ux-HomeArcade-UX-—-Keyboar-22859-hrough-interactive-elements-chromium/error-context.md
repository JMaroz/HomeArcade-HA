# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ux.spec.ts >> HomeArcade UX — Keyboard Navigation >> Tab key navigates through interactive elements
- Location: e2e\ux.spec.ts:483:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/library
Call log:
  - navigating to "http://localhost:5000/#/library", waiting until "load"

```

# Test source

```ts
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
> 484 |     await page.goto(`${APP_URL}/library`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/library
  485 |     await page.waitForLoadState('networkidle');
  486 |     await page.waitForTimeout(2000);
  487 | 
  488 |     // Press Tab several times
  489 |     await page.keyboard.press('Tab');
  490 |     await page.waitForTimeout(200);
  491 |     await page.keyboard.press('Tab');
  492 |     await page.waitForTimeout(200);
  493 |     await page.keyboard.press('Tab');
  494 | 
  495 |     // Should have focused an element (no crash)
  496 |     await expect(page.locator('body')).toBeVisible();
  497 |   });
  498 | 
  499 |   test('Escape closes any open dialog/modal', async ({ page }) => {
  500 |     await page.goto(`${APP_URL}/library`);
  501 |     await page.waitForLoadState('networkidle');
  502 |     await page.waitForTimeout(2000);
  503 | 
  504 |     const card = page.locator('[data-testid^="card-game-"]').first();
  505 |     if (await card.count() > 0) {
  506 |       await card.click();
  507 |       await page.waitForTimeout(800);
  508 |       await pressEsc(page);
  509 |       await page.waitForTimeout(500);
  510 |       const dialog = page.locator('[role="dialog"]:visible').first();
  511 |       await expect(dialog).not.toBeVisible({ timeout: 3000 });
  512 |     }
  513 |   });
  514 | 
  515 |   test('"/" shortcut focuses search input', async ({ page }) => {
  516 |     await page.goto(`${APP_URL}/library`);
  517 |     await page.waitForLoadState('networkidle');
  518 |     await page.waitForTimeout(2000);
  519 | 
  520 |     await page.keyboard.press('/');
  521 |     await page.waitForTimeout(400);
  522 | 
  523 |     const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
  524 |     const isFocused = await searchInput.evaluate((el) => document.activeElement === el);
  525 |     expect(isFocused).toBeTruthy();
  526 |   });
  527 | 
  528 |   test('Ctrl+K also focuses search input', async ({ page }) => {
  529 |     await page.goto(`${APP_URL}/library`);
  530 |     await page.waitForLoadState('networkidle');
  531 |     await page.waitForTimeout(2000);
  532 | 
  533 |     await page.keyboard.press('Control+k');
  534 |     await page.waitForTimeout(400);
  535 | 
  536 |     const searchInput = page.locator('input[type="search"], input[placeholder*="Search" i]').first();
  537 |     const isFocused = await searchInput.evaluate((el) => document.activeElement === el);
  538 |     expect(isFocused).toBeTruthy();
  539 |   });
  540 | 
  541 |   test('Arrow keys navigate game grid when focused', async ({ page }) => {
  542 |     await page.goto(`${APP_URL}/library`);
  543 |     await page.waitForLoadState('networkidle');
  544 |     await page.waitForTimeout(2000);
  545 | 
  546 |     // Focus a game card
  547 |     const card = page.locator('[data-testid^="card-game-"]').first();
  548 |     if (await card.count() === 0) {
  549 |       test.skip();
  550 |       return;
  551 |     }
  552 |     await card.focus();
  553 |     await page.waitForTimeout(200);
  554 | 
  555 |     // Press arrow keys (should not crash)
  556 |     await page.keyboard.press('ArrowRight');
  557 |     await page.waitForTimeout(200);
  558 |     await page.keyboard.press('ArrowDown');
  559 |     await page.waitForTimeout(200);
  560 |     await page.keyboard.press('ArrowLeft');
  561 |     await page.waitForTimeout(200);
  562 | 
  563 |     // Still on the page
  564 |     await expect(page.locator('body')).toBeVisible();
  565 |   });
  566 | 
  567 | });
  568 | 
  569 | test.describe('HomeArcade UX — History & Achievements', () => {
  570 | 
  571 |   test('history page loads without crash', async ({ page }) => {
  572 |     await page.goto(`${APP_URL}/history`);
  573 |     await page.waitForLoadState('networkidle');
  574 |     await expect(page.locator('body')).toBeVisible();
  575 |     await expect(page.locator('text=/something went wrong/i')).not.toBeVisible();
  576 |   });
  577 | 
  578 |   test('history shows play sessions or empty state', async ({ page }) => {
  579 |     await page.goto(`${APP_URL}/history`);
  580 |     await page.waitForLoadState('networkidle');
  581 |     await page.waitForTimeout(2000);
  582 | 
  583 |     const hasContent = await page.locator('[data-testid^="history-item"], [data-testid^="session-"]').count() > 0;
  584 |     const hasEmpty = await page.locator('[data-testid="state-empty"], text=/no history/i').count() > 0;
```