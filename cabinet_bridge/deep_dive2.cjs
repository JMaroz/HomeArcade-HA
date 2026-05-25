const fs = require('fs');
const src = fs.readFileSync('server/routes/player.ts');

// Find cabinetToast in renderSaveGrid
const funcStart = src.indexOf(Buffer.from('function renderSaveGrid'));
const funcEnd = src.indexOf(Buffer.from('window.CabinetRefreshSaveGrid'));
const func = src.slice(funcStart, funcEnd);

// Find the cabinetToast call
const search = Buffer.from("cabinetToast('Loaded slot");
const idx = func.indexOf(search);
console.log('cabinetToast call at byte:', idx);

if (idx >= 0) {
  const slice = func.slice(idx - 10, idx + 80);
  console.log('Source content:', JSON.stringify(slice.toString('utf8')));
  console.log('Source bytes:', slice.toString('hex'));
  
  // Check: the source has cabinetToast(\'Loaded slot...\')\;
  // After compilation, what does this look like?
  // \' in a template literal should become just '
  // But what if esbuild is treating \' differently?
  
  // Check the \u2705 in source
  const unicodePattern = Buffer.from([0x5C, 0x75, 0x32, 0x37, 0x30, 0x35]); // \u2705
  const uIdx = func.indexOf(unicodePattern);
  console.log('\n\\u2705 at byte:', uIdx);
  if (uIdx >= 0) {
    const uSlice = func.slice(Math.max(0, uIdx - 20), uIdx + 30);
    console.log('Unicode context:', JSON.stringify(uSlice.toString('utf8')));
    console.log('Unicode bytes:', uSlice.toString('hex'));
  }
  
  // Look for backslash before quote
  const backslash = Buffer.from([0x5C]);
  const bsIdx = func.indexOf(backslash);
  console.log('\nFirst backslash at byte:', bsIdx);
  
  // Find the exact pattern with \'
  const backslash27 = Buffer.from([0x5C, 0x27]); // \'
  let count = 0;
  let pos = func.indexOf(backslash27);
  while (pos !== -1 && count < 10) {
    console.log('Found \\' at byte:', pos, 'context:', JSON.stringify(func.slice(pos - 5, pos + 20).toString('utf8')));
    pos = func.indexOf(backslash27, pos + 1);
    count++;
  }
}

// Now check dist output
const dist = fs.readFileSync('dist/index.cjs');
const distFuncStart = dist.indexOf(Buffer.from('function renderSaveGrid'));
const distFuncEnd = dist.indexOf(Buffer.from('window.CabinetRefreshSaveGrid'));
const distFunc = dist.slice(distFuncStart, distFuncEnd);

// Find cabinetToast call in dist
const distSearch = Buffer.from("cabinetToast('Loaded slot");
const distIdx = distFunc.indexOf(distSearch);
console.log('\n\n=== Dist cabinetToast at:', distIdx, '===');
if (distIdx >= 0) {
  const slice = distFunc.slice(distIdx - 10, distIdx + 80);
  console.log('Dist content:', JSON.stringify(slice.toString('utf8')));
  console.log('Dist bytes:', slice.toString('hex'));
  
  // Check: what is the byte BEFORE the quote in 'Loaded slot'?
  const beforeQuote = distFunc.slice(distIdx - 1, distIdx);
  console.log('\n1 byte before quote:', beforeQuote.toString('hex'), '=', JSON.stringify(beforeQuote.toString('utf8')));
  
  // Check: is there a backslash 0x5C before the quote?
  if (beforeQuote[0] === 0x5C) {
    console.log('FOUND BACKSLASH BEFORE QUOTE!');
  }
  
  // Also check: what is the byte sequence 27 (quote) 4C (L) 6F (o)...
  const expectedPattern = Buffer.from([0x27, 0x4C, 0x6F, 0x61, 0x64, 0x65, 0x64]); // 'Loaded
  const patternInDist = distFunc.indexOf(expectedPattern);
  console.log("Pattern 'Loaded in dist at:", patternInDist);
  
  // Check the bytes immediately before this pattern
  if (patternInDist >= 0) {
    const before = distFunc.slice(patternInDist - 3, patternInDist);
    console.log('3 bytes before Loaded:', before.toString('hex'), '=', JSON.stringify(before.toString('utf8')));
  }
}

// Check if there are any \ characters before the cabinetToast call
const lastBackslashBeforeToast = distFunc.lastIndexOf(Buffer.from([0x5C]), distIdx);
console.log('\nLast backslash before cabinetToast at:', lastBackslashBeforeToast);
if (lastBackslashBeforeToast >= distIdx - 20) {
  const ctx = distFunc.slice(lastBackslashBeforeToast, distIdx + 10);
  console.log('Context:', ctx.toString('hex'));
  console.log('String:', JSON.stringify(ctx.toString('utf8')));
}