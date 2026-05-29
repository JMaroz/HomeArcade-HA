import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';
const APP_URL = BASE_URL + "/#";

test.beforeEach(async ({ context }) => {
  await context.addInitScript(() => {
    window.localStorage.setItem('ha-onboarded-v2', '1');
  });
});

test.describe('HomeArcade — Enhanced Emulator Tests', () => {
  test('emulator page loads and shows custom menu', async ({ page }) => {
    // We use a non-existent ID to just test the player shell loading
    await page.goto(`${BASE_URL}/api/roms/test-id/player`);
    
    // Check for the custom menu button
    const menuBtn = page.locator('.cabinet-menu-button');
    await expect(menuBtn).toBeVisible({ timeout: 10000 });
    await expect(menuBtn).toHaveText(/MENU/);

    // Open the menu
    await menuBtn.click();
    const menuPanel = page.locator('.cabinet-menu-panel');
    await expect(menuPanel).toHaveClass(/is-open/);
    
    // Check for menu tiles
    await expect(page.locator('text=Resume')).toBeVisible();
    await expect(page.locator('text=Restart')).toBeVisible();
    await expect(page.locator('text=Exit')).toBeVisible();
  });

  test('virtual gamepad elements are rendered on emulator page', async ({ page }) => {
    await page.goto(`${BASE_URL}/api/roms/test-id/player`);
    
    // Virtual pad container should be in DOM
    const vpad = page.locator('.virtual-pad');
    await expect(vpad).toBeAttached();
    
    // Should have D-pad and action buttons
    await expect(page.locator('.vpad-btn-up')).toBeAttached();
    await expect(page.locator('.vpad-btn-a')).toBeAttached();
  });
});

test.describe('HomeArcade — Visual Regression (Themes)', () => {
  const themes = ['HomeArcade', 'PXL', 'NES'];

  for (const theme of themes) {
    test(`visual snapshot for ${theme} theme dashboard`, async ({ page }) => {
      await page.goto(APP_URL);
      
      // Navigate to settings to change theme
      await page.goto(`${APP_URL}/settings`);
      const themeSelect = page.locator('[data-testid="theme-select"], button:has-text("Theme")').first();
      if (await themeSelect.count() > 0) {
        await themeSelect.click();
        await page.locator(`text=${theme}`).first().click();
        await page.waitForTimeout(1000);
      }

      // Go back to dashboard
      await page.goto(APP_URL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Take a screenshot and compare
      await expect(page).toHaveScreenshot(`dashboard-${theme.toLowerCase()}.png`, {
        maxDiffPixelRatio: 0.05,
        mask: [page.locator('[data-testid^="card-game-"]')] // mask dynamic content
      });
    });
  }
});
