const fs = require('fs');
const t = fs.readFileSync('HomeArcadeTheme.tsx', 'utf8');
const lines = t.split('\n');

let depth = 0;
let lastBreak = { line: 0, depth: 0 };
lines.forEach((l, i) => {
  const opens = (l.match(/<div/g) || []).length;
  const closes = (l.match(/<\/div>/g) || []).length;
  const delta = opens - closes;
  if (delta !== 0 || closes > 0) {
    const newDepth = depth + delta;
    if (newDepth < depth && depth >= 3) {
      console.log(`deeper close at line ${i+1}, depth was ${depth}, now ${newDepth}`);
      console.log('  ', l.trim().slice(0, 80));
    }
    depth += delta;
  }
});
console.log('final depth:', depth);