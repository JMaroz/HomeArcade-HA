const fs = require('fs');

// Read source file as raw bytes
const srcBytes = fs.readFileSync('server/routes/player.ts');
const distBytes = fs.readFileSync('dist/index.cjs');

// Find the string in source (style="color) and compare to dist
const searchInSrc = Buffer.from('style="color');
const srcPos = srcBytes.indexOf(searchInSrc);
console.log('Source style="color position:', srcPos);

const searchInDist = Buffer.from('style="color');
const distPos = distBytes.indexOf(searchInDist);
console.log('Dist style="color position:', distPos);

// Get surrounding bytes from source
if (srcPos >= 0) {
  const srcSlice = srcBytes.slice(srcPos - 20, srcPos + 40);
  console.log('\nSource bytes around style="color:');
  console.log('Hex:', srcSlice.toString('hex'));
  console.log('String:', srcSlice.toString('utf8'));
}

// Get surrounding bytes from dist  
if (distPos >= 0) {
  const distSlice = distBytes.slice(distPos - 20, distPos + 40);
  console.log('\nDist bytes around style="color:');
  console.log('Hex:', distSlice.toString('hex'));
  console.log('String:', distSlice.toString('utf8'));
}

// Now find the compiled saveGrid.innerHTML line and count exact position of the error
// The error is at column 152 of line 130
// First, find line 130 in dist/index.cjs
const distContent = distBytes.toString('utf8');
const lines = distContent.split('\n');
console.log('\nTotal lines in dist:', lines.length);
if (lines.length >= 130) {
  const line130 = lines[129]; // 0-indexed
  console.log('Line 130 length:', line130.length);
  console.log('Line 130:', line130.substring(0, 200));
  console.log('\nCharacter at column 152:', JSON.stringify(line130[151]));
  console.log('Context around col 152:', JSON.stringify(line130.substring(140, 170)));
}

// Also check: does the source have a backslash before the quote?
const srcContent = srcBytes.toString('utf8');
const srcStyleIdx = srcContent.indexOf('style="color');
if (srcStyleIdx >= 0) {
  const beforeQuote = srcContent.slice(Math.max(0, srcStyleIdx - 5), srcStyleIdx);
  console.log('\nBefore the quote in source:', JSON.stringify(beforeQuote));
  console.log('Before quote hex:', Buffer.from(beforeQuote).toString('hex'));
}