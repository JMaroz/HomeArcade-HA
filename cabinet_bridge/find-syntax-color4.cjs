const fs = require('fs');
const c = fs.readFileSync('ejs_cache/emulator.min.js', 'utf8');

// Find where EmulatorJS class is defined - search for "class EmulatorJS"
let idx = c.indexOf('class EmulatorJS');
while (idx !== -1) {
  console.log(`\n=== EmulatorJS class at ${idx} ===`);
  console.log(c.substring(idx, idx + 500));
  idx = c.indexOf('class EmulatorJS', idx + 1);
  if (idx > 1000) break; // just first
}

// Find "new EmulatorJS" instantiation
let idx2 = c.indexOf('new EmulatorJS');
while (idx2 !== -1) {
  console.log(`\n=== new EmulatorJS at ${idx2} ===`);
  console.log(c.substring(Math.max(0, idx2 - 100), idx2 + 200));
  idx2 = c.indexOf('new EmulatorJS', idx2 + 1);
}

// Also look for where color is actually USED (not just set in config)
let idx3 = c.indexOf('setColor');
if (idx3 !== -1) {
  console.log(`\n=== setColor at ${idx3} ===`);
  console.log(c.substring(idx3, idx3 + 300));
}

// Look for any "color" parameter in function signatures
let colorFnM = c.match(/function\s*\([^)]*color[^)]*\)/g);
if (colorFnM) {
  console.log('\n\nFunctions with color param:', colorFnM.slice(0, 10));
}

// Most importantly - search for places where 'color' could cause a parse error
// Common pattern: a ternary without the second part: color?something:
// or: [color] instead of ["color"]
// Let's check for shorthand property issues like {color} meaning {color: color}
let shorthandColor = c.match(/\{[^}]*\bcolor\b[^}]*\}/g);
if (shorthandColor && shorthandColor.length < 20) {
  console.log('\nShorthand objects containing color:', shorthandColor.slice(0, 10));
}

// Find any "color" that looks like it could break parsing
// Specifically, look for patterns like "var color" where "color" shouldn't be a var name
// or "function color()" where it shouldn't be a function name
const problematicColor = c.match(/(?:var|let|const|function)\s+color\b/g);
if (problematicColor) {
  console.log('\nProblematic var/let/const/function color:', problematicColor.slice(0, 10));
}

// Also: check if "color" appears after a return statement or expression terminator incorrectly
const returnColor = c.match(/return\s+color\b/g);
if (returnColor) {
  console.log('\nreturn color:', returnColor.slice(0, 10));
}

// Most importantly: look at where color appears in dynamic string evaluation contexts
const evalColor = c.match(/\beval\s*\([^)]*\bcolor\b[^)]*\)/g);
if (evalColor) {
  console.log('\neval with color:', evalColor.slice(0, 5));
}

const funcColor = c.match(/new Function\s*\([^)]*\bcolor\b[^)]*\)/g);
if (funcColor) {
  console.log('\nnew Function with color:', funcColor.slice(0, 5));
}