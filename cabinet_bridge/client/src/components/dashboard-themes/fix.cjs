const fs = require('fs');
let t = fs.readFileSync('HomeArcadeTheme.tsx', 'utf8');

// Fix 1: Close the flex-1 overflow container before Recently Played
// The pattern is the closing </div> of the All Games Grid scroll area, followed by </div> (overflow container), then blank, then Recently Played
const fix1 = `            </div>
          )}
        </div>

        {/* Recently Played — collapsible, below Browse Systems */}`;

const before1 = `            </div>
          )}

        {/* Recently Played — collapsible, below Browse Systems */}`;

t = t.replace(before1, fix1);

// Fix 2: Remove the duplicate </div>} that was creating the extra wrapper
// After fix 1, we need to close the overflow container div
const fix2 = `              </div>
            )}
          </div>
        )}

          {/* Right Info Panel (The Glass Hub) */}
          <AnimatePresence>`;

const before2 = `              </div>
            )}
          </div>
        )}

          {/* Right Info Panel (The Glass Hub) */}
          <AnimatePresence>`;

t = t.replace(before2, fix2);

fs.writeFileSync('HomeArcadeTheme.tsx', t);
console.log('Done');