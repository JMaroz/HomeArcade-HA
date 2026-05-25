/**
 * HomeArcade Art Coverage Test Suite
 * Checks which games have artUrl (cover art thumbnails) populated
 * and reports on missing visual assets.
 *
 * Run with: npx playwright test e2e/art-coverage.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5000';

interface GameReport {
  id: string;
  title: string;
  system: string;
  hasArtUrl: boolean;
  hasVideoUrl: boolean;
  hasRating: boolean;
  hasDescription: boolean;
  lastPlayed: number | null;
}

interface CoverageSummary {
  total: number;
  withArtUrl: number;
  withVideo: number;
  withRating: number;
  withDescription: number;
  recentlyPlayed: number;
}

/**
 * Fetch all ROMs from the API and build a coverage report.
 */
async function fetchGameReport(page: Page): Promise<{ games: GameReport[]; summary: CoverageSummary }> {
  const response = await page.request.get(`${BASE_URL}/api/roms`);
  expect(response.ok()).toBeTruthy();
  const data = await response.json();
  const roms = Array.isArray(data) ? data : (data.roms || []);

  const games: GameReport[] = roms.map((rom: Record<string, unknown>) => ({
    id: String(rom.id),
    title: String(rom.title ?? 'Untitled'),
    system: String(rom.system ?? 'unknown'),
    hasArtUrl: !!(rom.artUrl && String(rom.artUrl).trim() !== ''),
    hasVideoUrl: !!(rom.videoUrl && String(rom.videoUrl).trim() !== ''),
    hasRating: !!(rom.rating && Number(rom.rating) > 0),
    hasDescription: !!(rom.description && String(rom.description).trim() !== ''),
    lastPlayed: rom.lastPlayed ? Number(rom.lastPlayed) : null,
  }));

  const summary: CoverageSummary = {
    total: games.length,
    withArtUrl: games.filter(g => g.hasArtUrl).length,
    withVideo: games.filter(g => g.hasVideoUrl).length,
    withRating: games.filter(g => g.hasRating).length,
    withDescription: games.filter(g => g.hasDescription).length,
    recentlyPlayed: games.filter(g => g.lastPlayed && g.lastPlayed > 0).length,
  };

  return { games, summary };
}

/**
 * Print a formatted coverage table to the test output.
 */
function printCoverageTable(games: GameReport[]): void {
  const header = 'ID  | Title                          | System     | Art | Video | Rating | Desc |';
  const divider = '----|--------------------------------|------------|-----|-------|--------|------|';
  console.log('\n--- Game Art Coverage Report ---');
  console.log(header);
  console.log(divider);
  for (const g of games) {
    const title = g.title.length > 28 ? g.title.slice(0, 25) + '...' : g.title.padEnd(28);
    const system = g.system.padEnd(10);
    const art    = g.hasArtUrl      ? '✓' : '✗';
    const video  = g.hasVideoUrl    ? '✓' : '–';
    const rating = g.hasRating      ? '✓' : '–';
    const desc   = g.hasDescription ? '✓' : '–';
    console.log(`${g.id.padEnd(4)} | ${title} | ${system} | ${art.padEnd(3)} | ${video.padEnd(5)} | ${rating.padEnd(6)} | ${desc.padEnd(4)} |`);
  }
  console.log('-------------------------------\n');
}

test.describe('HomeArcade Art Coverage', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      window.localStorage.setItem('ha-onboarded-v2', '1');
    });
  });

  test('API: fetch all ROMs and report art coverage', async ({ page }) => {
    const { games, summary } = await fetchGameReport(page);

    printCoverageTable(games);

    console.log('\n=== Coverage Summary ===');
    console.log(`Total ROMs:        ${summary.total}`);
    console.log(`Has cover art:     ${summary.withArtUrl} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withArtUrl / summary.total * 100) : 0}%)`);
    console.log(`Has video preview: ${summary.withVideo} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withVideo / summary.total * 100) : 0}%)`);
    console.log(`Has rating:        ${summary.withRating} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withRating / summary.total * 100) : 0}%)`);
    console.log(`Has description:   ${summary.withDescription} / ${summary.total} (${summary.total > 0 ? Math.round(summary.withDescription / summary.total * 100) : 0}%)`);
    console.log(`Recently played:   ${summary.recentlyPlayed}`);

    // Assert at least some games were found
    expect(summary.total).toBeGreaterThan(0);
  });

  test('API: flag games missing cover art (artUrl)', async ({ page }) => {
    const { games, summary } = await fetchGameReport(page);
    const missingArt = games.filter(g => !g.hasArtUrl);

    if (missingArt.length > 0) {
      console.log(`\n⚠️  ${missingArt.length} game(s) are missing cover art:`);
      for (const g of missingArt.slice(0, 50)) {
        console.log(`   - [${g.system}] ${g.title} (id=${g.id})`);
      }
      if (missingArt.length > 50) {
        console.log(`   ... and ${missingArt.length - 50} more`);
      }
    }

    // This test always passes — it just reports. Use the output to decide next steps.
    // Assert the API is working, not that art exists.
    expect(summary.total).toBeGreaterThan(0);
  });

  test('API: flag recently-played games missing cover art', async ({ page }) => {
    const { games, summary } = await fetchGameReport(page);
    const recentMissingArt = games.filter(g =>
      g.lastPlayed !== null &&
      g.lastPlayed > 0 &&
      !g.hasArtUrl
    );

    if (recentMissingArt.length > 0) {
      console.log(`\n⚠️  ${recentMissingArt.length} recently-played game(s) are missing cover art:`);
      for (const g of recentMissingArt.slice(0, 20)) {
        console.log(`   - [${g.system}] ${g.title} (id=${g.id})`);
      }
    } else {
      console.log('\n✅ All recently-played games have cover art!');
    }

    expect(summary.total).toBeGreaterThan(0);
  });

  test('API: per-system art coverage breakdown', async ({ page }) => {
    const { games } = await fetchGameReport(page);

    const bySystem: Record<string, { total: number; withArt: number; games: string[] }> = {};
    for (const g of games) {
      if (!bySystem[g.system]) {
        bySystem[g.system] = { total: 0, withArt: 0, games: [] };
      }
      bySystem[g.system].total++;
      if (g.hasArtUrl) bySystem[g.system].withArt++;
      bySystem[g.system].games.push(g.title);
    }

    console.log('\n=== Per-System Art Coverage ===');
    const systems = Object.keys(bySystem).sort();
    for (const sys of systems) {
      const { total, withArt } = bySystem[sys];
      const pct = total > 0 ? Math.round(withArt / total * 100) : 0;
      const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
      const status = pct === 100 ? '✅' : pct > 50 ? '🟡' : '❌';
      console.log(`${status} ${sys.padEnd(10)} | ${bar} | ${withArt}/${total} (${pct}%)`);
    }
    console.log('');

    const summaryTotal = games.length;
    expect(summaryTotal).toBeGreaterThan(0);
  });

  test('UI: dashboard "Jump Back In" section shows visible game cards', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // The Jump Back In / hero section
    const heroSection = page.locator('[data-testid="hero-continue"]');
    const heroVisible = await heroSection.count() > 0;

    // Browse Systems tiles
    const systemTiles = page.locator('[data-testid^="system-tile-"], [class*="system-tile"]');
    const systemTileCount = await systemTiles.count();

    // Game cards in recently played
    const gameCards = page.locator('[data-testid^="card-game-"]');
    const gameCardCount = await gameCards.count();

    console.log(`\n=== Dashboard UI State ===`);
    console.log(`Hero section visible: ${heroVisible ? 'yes' : 'no'}`);
    console.log(`System tiles found:    ${systemTileCount}`);
    console.log(`Game cards on page:     ${gameCardCount}`);

    // At minimum, the page should render something
    await expect(page.locator('body')).toBeVisible();
  });

  test('UI: check if game cards show real images vs. gradient fallbacks', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const cards = await page.locator('[data-testid^="card-game-"]').all();
    const count = cards.length;

    if (count === 0) {
      console.log('No game cards found on dashboard — skipping image check');
      test.skip();
      return;
    }

    let withRealImages = 0;
    let withOnlyGradient = 0;

    for (let i = 0; i < Math.min(count, 20); i++) {
      const card = cards[i];
      const imgEl = card.locator('img').first();
      const hasImg = await imgEl.count() > 0;

      if (hasImg) {
        const naturalWidth = await imgEl.evaluate((el: HTMLImageElement) => el.naturalWidth);
        if (naturalWidth > 0) {
          withRealImages++;
        } else {
          withOnlyGradient++;
        }
      } else {
        withOnlyGradient++;
      }
    }

    console.log(`\n=== Game Card Image Analysis (${Math.min(count, 20)} cards sampled) ===`);
    console.log(`Cards with real images:  ${withRealImages}`);
    console.log(`Cards with gradient only: ${withOnlyGradient}`);

    if (withOnlyGradient > withRealImages) {
      console.log(`\n⚠️  Most cards are showing procedural gradients instead of real cover art.`);
      console.log(`   This confirms artUrl is not populated for most games.`);
    }
  });

  test('UI: recently played games have no visible cover art', async ({ page }) => {
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const cards = await page.locator('[data-testid^="card-game-"]').all();
    const count = cards.length;

    if (count === 0) {
      console.log('No recently-played game cards found');
      test.skip();
      return;
    }

    let cardsWithBrokenOrMissingImg = 0;

    for (let i = 0; i < Math.min(count, 10); i++) {
      const card = cards[i];
      const imgEl = card.locator('img').first();
      const hasImg = await imgEl.count() > 0;

      if (hasImg) {
        const naturalWidth = await imgEl.evaluate((el: HTMLImageElement) => el.naturalWidth);
        if (naturalWidth === 0) {
          // Image failed to load or is placeholder
          cardsWithBrokenOrMissingImg++;
        }
      } else {
        cardsWithBrokenOrMissingImg++;
      }
    }

    console.log(`\n=== Recently Played Image Status (${Math.min(count, 10)} sampled) ===`);
    console.log(`Cards with missing/broken images: ${cardsWithBrokenOrMissingImg} / ${Math.min(count, 10)}`);

    if (cardsWithBrokenOrMissingImg > 0) {
      console.log(`\n⚠️  ${cardsWithBrokenOrMissingImg} recently-played game(s) show no cover art.`);
    }
  });

});
