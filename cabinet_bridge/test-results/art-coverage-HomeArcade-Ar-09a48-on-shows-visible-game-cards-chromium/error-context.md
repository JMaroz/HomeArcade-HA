# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: art-coverage.spec.ts >> HomeArcade Art Coverage >> UI: dashboard "Jump Back In" section shows visible game cards
- Location: e2e\art-coverage.spec.ts:173:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('body')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('body')
    14 × locator resolved to <body>…</body>
       - unexpected value "hidden"

```

# Test source

```ts
  96  |     console.log(`Has rating:        ${summary.withRating} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withRating / summary.total * 100) : 0}%)`);
  97  |     console.log(`Has description:   ${summary.withDescription} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withDescription / summary.total * 100) : 0}%)`);
  98  |     console.log(`Recently played:   ${summary.recentlyPlayed}`);
  99  | 
  100 |     // Assert at least some games were found
  101 |     expect(summary.total).toBeGreaterThan(0);
  102 |   });
  103 | 
  104 |   test('API: flag games missing cover art (artUrl)', async ({ page }) => {
  105 |     const { games, summary } = await fetchGameReport(page);
  106 |     const missingArt = games.filter(g => !g.hasArtUrl);
  107 | 
  108 |     if (missingArt.length > 0) {
  109 |       console.log(`\n⚠️  ${missingArt.length} game(s) are missing cover art:`);
  110 |       for (const g of missingArt.slice(0, 50)) {
  111 |         console.log(`   - [${g.system}] ${g.title} (id=${g.id})`);
  112 |       }
  113 |       if (missingArt.length > 50) {
  114 |         console.log(`   ... and ${missingArt.length - 50} more`);
  115 |       }
  116 |     }
  117 | 
  118 |     // This test always passes — it just reports. Use the output to decide next steps.
  119 |     // Assert the API is working, not that art exists.
  120 |     expect(summary.total).toBeGreaterThan(0);
  121 |   });
  122 | 
  123 |   test('API: flag recently-played games missing cover art', async ({ page }) => {
  124 |     const { games, summary } = await fetchGameReport(page);
  125 |     const recentMissingArt = games.filter(g =>
  126 |       g.lastPlayed !== null &&
  127 |       g.lastPlayed > 0 &&
  128 |       !g.hasArtUrl
  129 |     );
  130 | 
  131 |     if (recentMissingArt.length > 0) {
  132 |       console.log(`\n⚠️  ${recentMissingArt.length} recently-played game(s) are missing cover art:`);
  133 |       for (const g of recentMissingArt.slice(0, 20)) {
  134 |         console.log(`   - [${g.system}] ${g.title} (id=${g.id})`);
  135 |       }
  136 |     } else {
  137 |       console.log('\n✅ All recently-played games have cover art!');
  138 |     }
  139 | 
  140 |     expect(summary.total).toBeGreaterThan(0);
  141 |   });
  142 | 
  143 |   test('API: per-system art coverage breakdown', async ({ page }) => {
  144 |     const { games } = await fetchGameReport(page);
  145 | 
  146 |     const bySystem: Record<string, { total: number; withArt: number; games: string[] }> = {};
  147 |     for (const g of games) {
  148 |       if (!bySystem[g.system]) {
  149 |         bySystem[g.system] = { total: 0, withArt: 0, games: [] };
  150 |       }
  151 |       bySystem[g.system].total++;
  152 |       if (g.hasArtUrl) bySystem[g.system].withArt++;
  153 |       bySystem[g.system].games.push(g.title);
  154 |     }
  155 | 
  156 |     console.log('\n=== Per-System Art Coverage ===');
  157 |     const systems = Object.keys(bySystem).sort();
  158 |     for (const sys of systems) {
  159 |       const { total, withArt } = bySystem[sys];
  160 |       const pct = total > 0 ? Math.round(withArt / total * 100) : 0;
  161 |       const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
  162 |       const status = pct === 100 ? '✅' : pct > 50 ? '🟡' : '❌';
  163 |       console.log(`${status} ${sys.padEnd(10)} | ${bar} | ${withArt}/${total} (${pct}%)`);
  164 |     }
  165 |     console.log('');
  166 | 
  167 |     expect(summary.total).toBeGreaterThan(0);
  168 |     // Use the summary from the outer scope — redefine to avoid TS error
  169 |     const summaryTotal = games.length;
  170 |     expect(summaryTotal).toBeGreaterThan(0);
  171 |   });
  172 | 
  173 |   test('UI: dashboard "Jump Back In" section shows visible game cards', async ({ page }) => {
  174 |     await page.goto(`${BASE_URL}/`);
  175 |     await page.waitForLoadState('networkidle');
  176 |     await page.waitForTimeout(3000);
  177 | 
  178 |     // The Jump Back In / hero section
  179 |     const heroSection = page.locator('[data-testid="hero-continue"]');
  180 |     const heroVisible = await heroSection.count() > 0;
  181 | 
  182 |     // Browse Systems tiles
  183 |     const systemTiles = page.locator('[data-testid^="system-tile-"], [class*="system-tile"]');
  184 |     const systemTileCount = await systemTiles.count();
  185 | 
  186 |     // Game cards in recently played
  187 |     const gameCards = page.locator('[data-testid^="card-game-"]');
  188 |     const gameCardCount = await gameCards.count();
  189 | 
  190 |     console.log(`\n=== Dashboard UI State ===`);
  191 |     console.log(`Hero section visible: ${heroVisible ? 'yes' : 'no'}`);
  192 |     console.log(`System tiles found:    ${systemTileCount}`);
  193 |     console.log(`Game cards on page:     ${gameCardCount}`);
  194 | 
  195 |     // At minimum, the page should render something
> 196 |     await expect(page.locator('body')).toBeVisible();
      |                                        ^ Error: expect(locator).toBeVisible() failed
  197 |   });
  198 | 
  199 |   test('UI: check if game cards show real images vs. gradient fallbacks', async ({ page }) => {
  200 |     await page.goto(`${BASE_URL}/`);
  201 |     await page.waitForLoadState('networkidle');
  202 |     await page.waitForTimeout(3000);
  203 | 
  204 |     const cards = page.locator('[data-testid^="card-game-"]').all();
  205 |     const count = await cards.count();
  206 | 
  207 |     if (count === 0) {
  208 |       console.log('No game cards found on dashboard — skipping image check');
  209 |       test.skip();
  210 |       return;
  211 |     }
  212 | 
  213 |     let withRealImages = 0;
  214 |     let withOnlyGradient = 0;
  215 | 
  216 |     for (let i = 0; i < Math.min(count, 20); i++) {
  217 |       const card = cards[i];
  218 |       const imgEl = card.locator('img').first();
  219 |       const hasImg = await imgEl.count() > 0;
  220 | 
  221 |       if (hasImg) {
  222 |         const naturalWidth = await imgEl.evaluate((el: HTMLImageElement) => el.naturalWidth);
  223 |         if (naturalWidth > 0) {
  224 |           withRealImages++;
  225 |         } else {
  226 |           withOnlyGradient++;
  227 |         }
  228 |       } else {
  229 |         withOnlyGradient++;
  230 |       }
  231 |     }
  232 | 
  233 |     console.log(`\n=== Game Card Image Analysis (${Math.min(count, 20)} cards sampled) ===`);
  234 |     console.log(`Cards with real images:  ${withRealImages}`);
  235 |     console.log(`Cards with gradient only: ${withOnlyGradient}`);
  236 | 
  237 |     if (withOnlyGradient > withRealImages) {
  238 |       console.log(`\n⚠️  Most cards are showing procedural gradients instead of real cover art.`);
  239 |       console.log(`   This confirms artUrl is not populated for most games.`);
  240 |     }
  241 |   });
  242 | 
  243 |   test('UI: recently played games have no visible cover art', async ({ page }) => {
  244 |     await page.goto(`${APP_URL}/`);
  245 |     await page.waitForLoadState('networkidle');
  246 |     await page.waitForTimeout(3000);
  247 | 
  248 |     const cards = page.locator('[data-testid^="card-game-"]').all();
  249 |     const count = await cards.count();
  250 | 
  251 |     if (count === 0) {
  252 |       console.log('No recently-played game cards found');
  253 |       test.skip();
  254 |       return;
  255 |     }
  256 | 
  257 |     let cardsWithBrokenOrMissingImg = 0;
  258 | 
  259 |     for (let i = 0; i < Math.min(count, 10); i++) {
  260 |       const card = cards[i];
  261 |       const imgEl = card.locator('img').first();
  262 |       const hasImg = await imgEl.count() > 0;
  263 | 
  264 |       if (hasImg) {
  265 |         const naturalWidth = await imgEl.evaluate((el: HTMLImageElement) => el.naturalWidth);
  266 |         if (naturalWidth === 0) {
  267 |           // Image failed to load or is placeholder
  268 |           cardsWithBrokenOrMissingImg++;
  269 |         }
  270 |       } else {
  271 |         cardsWithBrokenOrMissingImg++;
  272 |       }
  273 |     }
  274 | 
  275 |     console.log(`\n=== Recently Played Image Status (${Math.min(count, 10)} sampled) ===`);
  276 |     console.log(`Cards with missing/broken images: ${cardsWithBrokenOrMissingImg} / ${Math.min(count, 10)}`);
  277 | 
  278 |     if (cardsWithBrokenOrMissingImg > 0) {
  279 |       console.log(`\n⚠️  ${cardsWithBrokenOrMissingImg} recently-played game(s) show no cover art.`);
  280 |     }
  281 |   });
  282 | 
  283 | });
  284 | 
```