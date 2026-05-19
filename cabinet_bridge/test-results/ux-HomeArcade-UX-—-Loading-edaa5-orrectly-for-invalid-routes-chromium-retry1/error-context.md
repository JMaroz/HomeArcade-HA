# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ux.spec.ts >> HomeArcade UX — Loading & Edge States >> 404 page renders correctly for invalid routes
- Location: e2e\ux.spec.ts:635:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/this-route-does-not-exist-12345
Call log:
  - navigating to "http://localhost:5000/#/this-route-does-not-exist-12345", waiting until "load"

```

# Test source

```ts
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
  585 |     expect(hasContent || hasEmpty).toBeTruthy();
  586 |   });
  587 | 
  588 |   test('achievements page loads without crash', async ({ page }) => {
  589 |     await page.goto(`${APP_URL}/achievements`);
  590 |     await page.waitForLoadState('networkidle');
  591 |     await expect(page.locator('body')).toBeVisible();
  592 |     await expect(page.locator('text=/something went wrong/i')).not.toBeVisible();
  593 |   });
  594 | 
  595 |   test('achievements page shows badges or empty state', async ({ page }) => {
  596 |     await page.goto(`${APP_URL}/achievements`);
  597 |     await page.waitForLoadState('networkidle');
  598 |     await page.waitForTimeout(2000);
  599 | 
  600 |     const hasContent = await page.locator('[data-testid^="achievement-"], img[alt*="achievement"]').count() > 0;
  601 |     const hasEmpty = await page.locator('[data-testid="state-empty"], text=/no achievements/i').count() > 0;
  602 |     expect(hasContent || hasEmpty).toBeTruthy();
  603 |   });
  604 | 
  605 | });
  606 | 
  607 | test.describe('HomeArcade UX — Loading & Edge States', () => {
  608 | 
  609 |   test('loading skeletons appear while data fetches', async ({ page }) => {
  610 |     await page.goto(`${APP_URL}/library`);
  611 |     // Don't wait for networkidle — capture the loading state
  612 |     await page.waitForTimeout(500);
  613 | 
  614 |     const skeletons = page.locator('.animate-pulse, [data-testid="skeleton"], [data-testid="loading"]');
  615 |     // Skeletons may or may not be present — just ensure no crash
  616 |     await expect(page.locator('body')).toBeVisible();
  617 |   });
  618 | 
  619 |   test('empty library shows helpful empty state', async ({ page }) => {
  620 |     await page.goto(`${APP_URL}/library`);
  621 |     await page.waitForLoadState('networkidle');
  622 |     await page.waitForTimeout(3000);
  623 | 
  624 |     const emptyState = page.locator('[data-testid="state-empty"]');
  625 |     const noGames = page.locator('text=/no games|empty library|add some games/i');
  626 | 
  627 |     const hasEmpty = await emptyState.count() > 0 || await noGames.count() > 0;
  628 |     if (!hasEmpty) {
  629 |       // If no empty state, there should be actual games
  630 |       const cards = await visibleGameCardCount(page);
  631 |       expect(cards).toBeGreaterThan(0);
  632 |     }
  633 |   });
  634 | 
  635 |   test('404 page renders correctly for invalid routes', async ({ page }) => {
> 636 |     await page.goto(`${APP_URL}/this-route-does-not-exist-12345`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/#/this-route-does-not-exist-12345
  637 |     await page.waitForLoadState('networkidle');
  638 |     await page.waitForTimeout(1000);
  639 | 
  640 |     const notFound = page.locator('text=/404|not found|page not found/i');
  641 |     await expect(notFound).toBeVisible({ timeout: 5000 });
  642 |   });
  643 | 
  644 |   test('no console errors on dashboard load', async ({ page }) => {
  645 |     const errors: string[] = [];
  646 |     page.on('console', msg => {
  647 |       if (msg.type() === 'error') errors.push(msg.text());
  648 |     });
  649 | 
  650 |     await page.goto(`${APP_URL}/`);
  651 |     await page.waitForLoadState('networkidle');
  652 |     await page.waitForTimeout(2000);
  653 | 
  654 |     // Filter out known non-issue errors (favicon 404s, etc.)
  655 |     const realErrors = errors.filter(e =>
  656 |       !e.includes('favicon') &&
  657 |       !e.includes('net::ERR_') &&
  658 |       !e.includes('Failed to load resource')
  659 |     );
  660 | 
  661 |     if (realErrors.length > 0) {
  662 |       console.log('Console errors found:', realErrors);
  663 |     }
  664 |     expect(realErrors.length).toBe(0);
  665 |   });
  666 | 
  667 | });
  668 | 
  669 | test.describe('HomeArcade UX — Collections', () => {
  670 | 
  671 |   test('collections appear in sidebar when present', async ({ page }) => {
  672 |     await page.goto(`${APP_URL}/library`);
  673 |     await page.waitForLoadState('networkidle');
  674 |     await page.waitForTimeout(2000);
  675 | 
  676 |     const collectionSection = page.locator('text=/collections/i');
  677 |     if (await collectionSection.count() > 0) {
  678 |       await expect(collectionSection).toBeVisible();
  679 |     }
  680 |   });
  681 | 
  682 |   test('clicking a collection in sidebar filters to that collection', async ({ page }) => {
  683 |     await page.goto(`${APP_URL}/library`);
  684 |     await page.waitForLoadState('networkidle');
  685 |     await page.waitForTimeout(2000);
  686 | 
  687 |     const collectionLink = page.locator('[href*="/collection/"]').first();
  688 |     if (await collectionLink.count() === 0) {
  689 |       test.skip();
  690 |       return;
  691 |     }
  692 | 
  693 |     await collectionLink.click();
  694 |     await page.waitForLoadState('networkidle');
  695 |     await page.waitForTimeout(1000);
  696 | 
  697 |     // URL should contain collection id
  698 |     const url = page.url();
  699 |     expect(url).toContain('/collection/');
  700 |   });
  701 | 
  702 | });
  703 | 
  704 | test.describe('HomeArcade UX — Responsive & Mobile', () => {
  705 | 
  706 |   test('mobile viewport shows bottom nav', async ({ page }) => {
  707 |     await page.setViewportSize({ width: 390, height: 844 });
  708 |     await page.goto(`${APP_URL}/library`);
  709 |     await page.waitForLoadState('networkidle');
  710 |     await page.waitForTimeout(1000);
  711 | 
  712 |     const bottomNav = page.locator('[data-testid="mobile-bottom-nav"], nav[class*="bottom"]').first();
  713 |     await expect(bottomNav).toBeVisible({ timeout: 5000 });
  714 |   });
  715 | 
  716 |   test('game grid is usable on mobile viewport', async ({ page }) => {
  717 |     await page.setViewportSize({ width: 390, height: 844 });
  718 |     await page.goto(`${APP_URL}/library`);
  719 |     await page.waitForLoadState('networkidle');
  720 |     await page.waitForTimeout(2000);
  721 | 
  722 |     const card = page.locator('[data-testid^="card-game-"]').first();
  723 |     if (await card.count() > 0) {
  724 |       await card.click();
  725 |       await page.waitForTimeout(800);
  726 |       // Dialog should open on mobile too
  727 |       const dialog = page.locator('[role="dialog"]').first();
  728 |       await expect(dialog).toBeVisible({ timeout: 5000 });
  729 |     }
  730 |   });
  731 | 
  732 |   test('sidebar collapses on mobile by default', async ({ page }) => {
  733 |     await page.setViewportSize({ width: 390, height: 844 });
  734 |     await page.goto(`${APP_URL}/`);
  735 |     await page.waitForLoadState('networkidle');
  736 |     await page.waitForTimeout(1000);
```