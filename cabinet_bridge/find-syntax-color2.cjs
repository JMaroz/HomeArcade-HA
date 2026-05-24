const fs = require('fs');
const c = fs.readFileSync('ejs_cache/loader.js', 'utf8');

// Check loader.js for any unexpected color references or syntax issues
let idx = c.indexOf('color');
while (idx !== -1) {
  const ctx = c.substring(Math.max(0, idx - 50), idx + 100);
  console.log(`color at ${idx}: ${ctx}`);
  console.log('---');
  idx = c.indexOf('color', idx + 1);
}