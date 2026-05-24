const fs = require('fs');
const content = fs.readFileSync('server/routes/player.ts', 'utf8');

// Find the renderEmulatorBootstrap function
const start = content.indexOf('export function renderEmulatorBootstrap');
const end = content.indexOf('\nexport ', start + 1);
const func = content.substring(start, end);

// Find all double-quoted strings inside the function that contain style= attributes
// The problematic pattern is: "..." (inside template literal) where the content has \" that was meant to be literal
// But in template literals, \" is consumed, so we need to use the escaped version

// Find all occurrences of \" inside the function
let count = 0;
let idx = func.indexOf('\\"');
while (idx !== -1 && idx < 2000) { // Only check the first part (renderSaveGrid area)
  count++;
  console.log(`Found escaped quote at position ${idx}: ...${func.substring(Math.max(0,idx-30), idx+50)}...`);
  idx = func.indexOf('\\"', idx + 1);
}

console.log(`\nTotal escaped double-quotes in first 2000 chars: ${count}`);

// Now find the specific problematic area with style=
const styleIdx = func.indexOf('style=');
if (styleIdx > 0 && styleIdx < 2000) {
  console.log('\nstyle= found at:', styleIdx);
  console.log('Context:', func.substring(styleIdx - 20, styleIdx + 200));
}