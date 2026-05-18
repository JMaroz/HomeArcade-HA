const fs = require('fs');
const t = fs.readFileSync('HomeArcadeTheme.tsx', 'utf8');
const lines = t.split('\n');

// Use proper div counting: <div (not </div) opens increase depth
let d = 0;
let maxD = 0;
let lines15 = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  // Count <div openings (but not </div> closings)
  // Simple: count <div (self-closing or not) - count </div>
  const opens = (l.match(/<div/g) || []).length;
  const closes = (l.match(/<\/div>/g) || []).length;
  d += opens - closes;
  if (d > maxD) maxD = d;
  if (i >= 948 && i <= 955) {
    lines15.push(`${i + 1} depth=${d} max=${maxD} |${l}`);
  }
}
console.log('Max depth:', maxD);
lines15.forEach(l => console.log(l));