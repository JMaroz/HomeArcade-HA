const fs = require('fs');
const files = ['e2e/smoke.spec.ts', 'e2e/art-coverage.spec.ts', 'e2e/now-playing.spec.ts'];
files.forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, i) => {
    if (l.includes('library')) {
      console.log(f + ':' + (i+1) + ': ' + l.trim());
    }
  });
});