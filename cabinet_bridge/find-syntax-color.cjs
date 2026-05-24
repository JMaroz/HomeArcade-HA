const fs = require('fs');
const c = fs.readFileSync('ejs_cache/emulator.min.js', 'utf8');

// Find all occurrences of 'color' as a standalone word/identifier
// that could cause "Unexpected identifier 'color'" syntax error
const colorIdx = c.indexOf('color this');
if (colorIdx !== -1) {
  console.log('FOUND "color this" at', colorIdx, ':', c.substring(colorIdx - 10, colorIdx + 50));
}

// Look for patterns like "color:" in what might be object literals
// but more importantly, check what "color" refers to globally
let idx = c.indexOf('color');
let count = 0;
while (idx !== -1 && count < 20) {
  const ctx = c.substring(Math.max(0, idx - 30), idx + 60);
  // Only show if it looks like it could be problematic
  if (ctx.includes('var ') || ctx.includes('let ') || ctx.includes('const ') || ctx.includes('function ')) {
    console.log(`\n-- color at ${idx}: ${ctx}`);
  }
  idx = c.indexOf('color', idx + 1);
  count++;
}

// Most importantly: check if the emulator uses "color" as a variable name in a way that would break
// Look for patterns that suggest shorthand property issues
// Pattern: ,color,} or {color} or [color]
const shorthandM = c.match(/[,=({[ ]color[,}=)\]]/g);
if (shorthandM) {
  console.log('\nFound shorthand-ish color patterns:', shorthandM.slice(0, 10));
}

// Check for the pattern that would cause "Unexpected identifier 'color'"
// This happens when "color" is used where an identifier is not allowed
// e.g., "var color" would be fine, but just "color" after a keyword expecting an expression
// would be the problem

// Look for any place where " color" appears without a dot before it (property access)
// but after something that doesn't connect to it properly
const standaloneColorM = c.match(/(?:^|[^a-zA-Z0-9_])color(?![a-zA-Z0-9_])/g);
console.log('\nStandalone "color" occurrences:', standaloneColorM ? standaloneColorM.length : 0);
if (standaloneColorM && standaloneColorM.length < 50) {
  console.log('Samples:', standaloneColorM.slice(0, 20));
}

// Check what happens BEFORE "config.color" - is it possible the config object is malformed?
const configColorIdx = c.indexOf('config.color');
if (configColorIdx !== -1) {
  console.log('\n\nconfig.color found at', configColorIdx);
  // Look at the surrounding 200 chars to see the full context
  console.log('Context:', c.substring(configColorIdx - 50, configColorIdx + 200));
}

// Also look at what setColor does
const setColorIdx = c.indexOf('setColor');
let scount = 0;
while (setColorIdx !== -1 && scount < 3) {
  console.log('\n\nsetColor at', setColorIdx);
  console.log(c.substring(setColorIdx, setColorIdx + 300));
  scount++;
  break; // just first one
}