const fs = require('fs');
const lines = fs.readFileSync('HomeArcadeTheme.tsx', 'utf8').split('\n');
let d = 0;
let overclose = -1;
lines.forEach((l, i) => {
  const o = (l.match(/<div/g) || []).length;
  const c = (l.match(/<\/div>/g) || []).length;
  d += o - c;
  if (d < 0 && overclose < 0) {
    overclose = i + 1;
    console.log('OVERCLOSE at', overclose, d, l.trim().slice(0, 80));
  }
  if (i >= 600 && i <= 620) {
    console.log(i + 1, d, l.trim().slice(0, 60));
  }
});
console.log('final depth:', d);