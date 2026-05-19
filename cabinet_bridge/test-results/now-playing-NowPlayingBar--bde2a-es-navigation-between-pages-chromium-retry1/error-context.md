# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: now-playing.spec.ts >> NowPlayingBar >> bar survives navigation between pages
- Location: e2e\now-playing.spec.ts:211:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/
Call log:
  - navigating to "http://localhost:5000/", waiting until "load"

```

# Test source

```ts
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
  201 |     const bar = page.locator('[data-testid="now-playing-bar"]');
  202 |     await expect(bar).toBeVisible({ timeout: 5000 });
  203 | 
  204 |     // Mobile bottom nav should still be visible
  205 |     const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
  206 |     if (await bottomNav.count() > 0) {
  207 |       await expect(bottomNav).toBeVisible();
  208 |     }
  209 |   });
  210 | 
  211 |   test('bar survives navigation between pages', async ({ page }) => {
  212 |     await mockNowPlaying(page, {
  213 |       playing: true,
  214 |       id: 42,
  215 |       title: 'Duck Tales',
  216 |       system: 'nes',
  217 |       startedAt: Date.now() - 300_000,
  218 |     });
  219 | 
> 220 |     await page.goto(`${BASE_URL}/`);
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5000/
  221 |     await page.waitForLoadState('networkidle');
  222 |     await page.waitForTimeout(2000);
  223 | 
  224 |     const bar = page.locator('[data-testid="now-playing-bar"]');
  225 |     await expect(bar).toBeVisible({ timeout: 5000 });
  226 | 
  227 |     // Navigate to library
  228 |     await page.goto(`${BASE_URL}/#/library`);
  229 |     await page.waitForLoadState('networkidle');
  230 |     await page.waitForTimeout(1500);
  231 |     await expect(bar).toBeVisible({ timeout: 3000 });
  232 | 
  233 |     // Navigate to settings
  234 |     await page.goto(`${BASE_URL}/#/settings`);
  235 |     await page.waitForLoadState('networkidle');
  236 |     await page.waitForTimeout(1500);
  237 |     await expect(bar).toBeVisible({ timeout: 3000 });
  238 | 
  239 |     // Navigate back to dashboard
  240 |     await page.goto(`${BASE_URL}/`);
  241 |     await page.waitForLoadState('networkidle');
  242 |     await page.waitForTimeout(1500);
  243 |     await expect(bar).toBeVisible({ timeout: 3000 });
  244 |   });
  245 | 
  246 | });
```