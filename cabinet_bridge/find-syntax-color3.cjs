const fs = require('fs');
const c = fs.readFileSync('ejs_cache/emulator.min.js', 'utf8');

// Check the context around the specific color occurrence at 217739
const idx = 217739;
console.log('Context at 217739:');
console.log(c.substring(idx - 100, idx + 200));
console.log('\n---\n');

// Also look at the specific pattern for "Unexpected identifier 'color'"
// This is typically caused by object shorthand when variable doesn't exist
// Find all {color} shorthand occurrences
let idx2 = c.indexOf(',color');
while (idx2 !== -1) {
  console.log(`\n,color at ${idx2}:`);
  console.log(c.substring(Math.max(0, idx2 - 30), idx2 + 100));
  idx2 = c.indexOf(',color', idx2 + 1);
  if (idx2 > idx + 10000) break;
}