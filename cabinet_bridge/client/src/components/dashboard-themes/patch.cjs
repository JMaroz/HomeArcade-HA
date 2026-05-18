const fs = require('fs');
const t = fs.readFileSync('HomeArcadeTheme.tsx', 'utf8');

// The Recently Played section to insert
const recentlyPlayedSection = `
        {/* Recently Played — collapsible, below Browse Systems / above game grid */}
        {recentlyPlayed.length > 0 && !searchQuery && (
          <div className="shrink-0 border-t border-white/5">
            <button
              type="button"
              onClick={() => setRecentlyPlayedCollapsed((v) => !v)}
              className="w-full flex items-center justify-between px-8 py-3 hover:bg-white/5 transition-colors"
            >
              <div className="font-display text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Recently Played</div>
              {recentlyPlayedCollapsed
                ? <ChevronUp className="size-3.5 text-white/30" />
                : <ChevronDown className="size-3.5 text-white/30" />
              }
            </button>
            {!recentlyPlayedCollapsed && (
              <div className="flex gap-4 overflow-x-auto scrollbar-none px-8 pb-4">
                {recentlyPlayed.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    onClick={() => {
                      const idx = filteredGames.findIndex((g) => g.id === game.id);
                      if (idx >= 0) setActiveGameIdx(idx);
                      if (window.innerWidth < 1280) setShowMobileDetails(true);
                    }}
                    className="shrink-0 w-28 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900/50 group flex flex-col items-center"
                  >
                    <div className="relative w-full h-full flex-1">
                      {game.artUrl ? (
                        <img src={game.artUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full" style={{ background: \`linear-gradient(135deg, hsl(\${game.art[0]}), hsl(\${game.art[1]}))\` }} />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>
                    <div className="w-full bg-white/5 px-1.5 py-1 text-center">
                      <div className="text-[9px] font-bold truncate text-white/80 leading-tight">{game.title}</div>
                      <div className="text-[8px] text-white/30 uppercase">{game.system.toUpperCase()}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

          {/* Right Info Panel (The Glass Hub) */}
          <AnimatePresence>`;

// Find the Right Info Panel section and replace the blank space before it
const marker = '          {/* Right Info Panel (The Glass Hub) */}';
const idx = t.indexOf(marker);
if (idx === -1) {
  console.log('Marker not found');
  process.exit(1);
}

// Find the closing div just before the marker
// Go backwards from the marker to find the </div> that closes the All Games Grid
let search = t.slice(0, idx);
const lastCloseDiv = search.lastIndexOf('</div>');
const beforeThat = search.slice(0, lastCloseDiv);
const penultimateCloseDiv = beforeThat.lastIndexOf('</div>');

const patched = t.slice(0, penultimateCloseDiv + 6) + '\n' + recentlyPlayedSection + t.slice(lastCloseDiv + 6);

fs.writeFileSync('HomeArcadeTheme.tsx', patched);
console.log('Done');