const fs = require('fs');

// Read raw bytes of source and dist
const srcBytes = fs.readFileSync('server/routes/player.ts');
const distBytes = fs.readFileSync('dist/index.cjs');

// Find the "saveGrid.innerHTML = " area in dist and show exact bytes
const distStr = distBytes.toString('utf8');
const distSaveGridIdx = distStr.indexOf('saveGrid.innerHTML = "<p style');
console.log('dist saveGrid position (string):', distSaveGridIdx);

// Show raw bytes of the dist line
const distLineSlice = distBytes.slice(distSaveGridIdx, distSaveGridIdx + 200);
console.log('\nDist raw bytes hex:');
console.log(distLineSlice.toString('hex'));
console.log('\nDist raw string:');
console.log(distLineSlice.toString('utf8'));

// Now check: is there a backslash byte (0x5C) before any of the quote bytes (0x22)?
// Look for 5C 22 pattern (escaped quote) vs just 22 (unescaped quote)
const hexStr = distLineSlice.toString('hex');
const unescapedQuotes = hexStr.split('22').length - 1;
const escapedQuotes = (hexStr.match(/5c22/g) || []).length;
console.log('\nQuote analysis in dist line:');
console.log('Total " bytes:', unescapedQuotes);
console.log('Escaped \\" sequences:', escapedQuotes);

// Check the source file same area
const srcStr = srcBytes.toString('utf8');
const srcSaveGridIdx = srcStr.indexOf("saveGrid.innerHTML = '<p style");
console.log('\nSource saveGrid position (string):', srcSaveGridIdx);
const srcLineSlice = srcBytes.slice(Math.max(0, srcSaveGridIdx - 5), srcSaveGridIdx + 200);
console.log('\nSource raw bytes hex:');
console.log(srcLineSlice.toString('hex'));
console.log('\nSource raw string:');
console.log(srcLineSlice.toString('utf8'));

// Check for escaped vs unescaped in source
const srcHexStr = srcLineSlice.toString('hex');
const srcEscapedQuotes = (srcHexStr.match(/5c22/g) || []).length;
console.log('\nSource escaped \\" sequences:', srcEscapedQuotes);