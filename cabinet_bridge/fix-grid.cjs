const fs = require('fs');
let c = fs.readFileSync('client/src/components/dashboard-themes/HomeArcadeTheme.tsx', 'utf8');
const lines = c.split('\n');
// Lines are 0-indexed, so line 715 is index 714
[713, 714, 715, 716, 717].forEach(i => {
  console.log(`Line ${i+1}: ${JSON.stringify(lines[i])}`);
});