# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: art-coverage.spec.ts >> HomeArcade Art Coverage >> API: fetch all ROMs and report art coverage
- Location: e2e\art-coverage.spec.ts:87:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
```

# Test source

```ts
  1   | /**
  2   |  * HomeArcade Art Coverage Test Suite
  3   |  * Checks which games have artUrl (cover art thumbnails) populated
  4   |  * and reports on missing visual assets.
  5   |  *
  6   |  * Run with: npx playwright test e2e/art-coverage.spec.ts
  7   |  */
  8   | 
  9   | import { test, expect, type Page } from '@playwright/test';
  10  | 
  11  | const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';
  12  | 
  13  | interface GameReport {
  14  |   id: string;
  15  |   title: string;
  16  |   system: string;
  17  |   hasArtUrl: boolean;
  18  |   hasVideoUrl: boolean;
  19  |   hasRating: boolean;
  20  |   hasDescription: boolean;
  21  |   lastPlayed: number | null;
  22  | }
  23  | 
  24  | interface CoverageSummary {
  25  |   total: number;
  26  |   withArtUrl: number;
  27  |   withVideo: number;
  28  |   withRating: number;
  29  |   withDescription: number;
  30  |   recentlyPlayed: number;
  31  | }
  32  | 
  33  | /**
  34  |  * Fetch all ROMs from the API and build a coverage report.
  35  |  */
  36  | async function fetchGameReport(page: Page): Promise<{ games: GameReport[]; summary: CoverageSummary }> {
  37  |   const response = await page.request.get(`${BASE_URL}/api/roms`);
  38  |   expect(response.ok()).toBeTruthy();
  39  |   const roms = await response.json();
  40  | 
  41  |   const games: GameReport[] = roms.map((rom: Record<string, unknown>) => ({
  42  |     id: String(rom.id),
  43  |     title: String(rom.title ?? 'Untitled'),
  44  |     system: String(rom.system ?? 'unknown'),
  45  |     hasArtUrl: !!(rom.artUrl && String(rom.artUrl).trim() !== ''),
  46  |     hasVideoUrl: !!(rom.videoUrl && String(rom.videoUrl).trim() !== ''),
  47  |     hasRating: !!(rom.rating && Number(rom.rating) > 0),
  48  |     hasDescription: !!(rom.description && String(rom.description).trim() !== ''),
  49  |     lastPlayed: rom.lastPlayed ? Number(rom.lastPlayed) : null,
  50  |   }));
  51  | 
  52  |   const summary: CoverageSummary = {
  53  |     total: games.length,
  54  |     withArtUrl: games.filter(g => g.hasArtUrl).length,
  55  |     withVideo: games.filter(g => g.hasVideoUrl).length,
  56  |     withRating: games.filter(g => g.hasRating).length,
  57  |     withDescription: games.filter(g => g.hasDescription).length,
  58  |     recentlyPlayed: games.filter(g => g.lastPlayed && g.lastPlayed > 0).length,
  59  |   };
  60  | 
  61  |   return { games, summary };
  62  | }
  63  | 
  64  | /**
  65  |  * Print a formatted coverage table to the test output.
  66  |  */
  67  | function printCoverageTable(games: GameReport[]): void {
  68  |   const header = 'ID  | Title                          | System     | Art | Video | Rating | Desc |';
  69  |   const divider = '----|--------------------------------|------------|-----|-------|--------|------|';
  70  |   console.log('\n--- Game Art Coverage Report ---');
  71  |   console.log(header);
  72  |   console.log(divider);
  73  |   for (const g of games) {
  74  |     const title = g.title.length > 28 ? g.title.slice(0, 25) + '...' : g.title.padEnd(28);
  75  |     const system = g.system.padEnd(10);
  76  |     const art    = g.hasArtUrl      ? '✓' : '✗';
  77  |     const video  = g.hasVideoUrl    ? '✓' : '–';
  78  |     const rating = g.hasRating      ? '✓' : '–';
  79  |     const desc   = g.hasDescription ? '✓' : '–';
  80  |     console.log(`${g.id.padEnd(4)} | ${title} | ${system} | ${art.padEnd(3)} | ${video.padEnd(5)} | ${rating.padEnd(6)} | ${desc.padEnd(4)} |`);
  81  |   }
  82  |   console.log('-------------------------------\n');
  83  | }
  84  | 
  85  | test.describe('HomeArcade Art Coverage', () => {
  86  | 
  87  |   test('API: fetch all ROMs and report art coverage', async ({ page }) => {
  88  |     const { games, summary } = await fetchGameReport(page);
  89  | 
  90  |     printCoverageTable(games);
  91  | 
  92  |     console.log('\n=== Coverage Summary ===');
  93  |     console.log(`Total ROMs:        ${summary.total}`);
  94  |     console.log(`Has cover art:     ${summary.withArtUrl} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withArtUrl / summary.total * 100) : 0}%)`);
  95  |     console.log(`Has video preview: ${summary.withVideo} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withVideo / summary.total * 100) : 0}%)`);
  96  |     console.log(`Has rating:        ${summary.withRating} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withRating / summary.total * 100) : 0}%)`);
  97  |     console.log(`Has description:   ${summary.withDescription} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withDescription / summary.total * 100) : 0}%)`);
  98  |     console.log(`Recently played:   ${summary.recentlyPlayed}`);
  99  | 
  100 |     // Assert at least some games were found
> 101 |     expect(summary.total).toBeGreaterThan(0);
      |                           ^ Error: expect(received).toBeGreaterThan(expected)
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
  196 |     await expect(page.locator('body')).toBeVisible();
  197 |   });
  198 | 
  199 |   test('UI: check if game cards show real images vs. gradient fallbacks', async ({ page }) => {
  200 |     await page.goto(`${BASE_URL}/`);
  201 |     await page.waitForLoadState('networkidle');
```