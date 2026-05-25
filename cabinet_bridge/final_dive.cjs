const fs = require('fs');
const src = fs.readFileSync('server/routes/player.ts');
const dist = fs.readFileSync('dist/index.cjs');

// Find cabinetToast in source renderSaveGrid
const funcStart = src.indexOf(Buffer.from('function renderSaveGrid'));
const funcEnd = src.indexOf(Buffer.from('window.CabinetRefreshSaveGrid'));
const func = src.slice(funcStart, funcEnd);

// Find the pattern: 5C 27 (backslash + single quote) followed by Loaded
const backslash27 = Buffer.from([0x5C, 0x27]); // \'
let pos = 0;
let count = 0;
let lastBackslashBeforeLoaded = -1;
while ((pos = func.indexOf(backslash27, pos)) !== -1 && count < 20) {
  const context = func.slice(Math.max(0, pos - 10), pos + 40);
  const contextStr = context.toString('utf8');
  if (contextStr.includes('Loaded')) {
    lastBackslashBeforeLoaded = pos;
    console.log('Found \\' before Loaded at byte:', pos);
    console.log('Context:', JSON.stringify(contextStr));
  }
  pos++;
  count++;
}

if (lastBackslashBeforeLoaded === -1) {
  console.log('No backslash before Loaded found in source');
}

// Now check dist
const distFuncStart = dist.indexOf(Buffer.from('function renderSaveGrid'));
const distFuncEnd = dist.indexOf(Buffer.from('window.CabinetRefreshSaveGrid'));
const distFunc = dist.slice(distFuncStart, distFuncEnd);

// Find cabinetToast('Loaded slot ' + slot.slot + ' 
const toastPattern = Buffer.from([0x63, 0x61, 0x62, 0x69, 0x6E, 0x65, 0x54, 0x6F, 0x61, 0x73, 0x74, 0x28, 0x27, 0x4C, 0x6F, 0x61, 0x64, 0x65, 0x64]); // cabinetToast('Loaded
const toastIdx = distFunc.indexOf(toastPattern);
console.log('\nDist cabinetToast call at byte:', toastIdx);

if (toastIdx >= 0) {
  // What is the byte immediately before the quote of 'Loaded slot'?
  const beforeQuote = distFunc.slice(toastIdx - 1, toastIdx);
  console.log('Byte before quote:', beforeQuote.toString('hex'), '=', JSON.stringify(beforeQuote.toString('utf8')));
  
  // Check: is it a backslash?
  if (beforeQuote[0] === 0x5C) {
    console.log('ERROR: Backslash found before opening quote!');
  } else if (beforeQuote[0] === 0x27) {
    console.log('Correct: quote directly after cabinetToast(');
  }
  
  // Show 20 bytes before the call
  const before = distFunc.slice(Math.max(0, toastIdx - 20), toastIdx + 50);
  console.log('Context around call:', JSON.stringify(before.toString('utf8')));
  console.log('Bytes:', before.toString('hex'));
}

// Check for the actual \u2705 in dist
const u2705 = Buffer.from([0x5C, 0x75, 0x32, 0x37, 0x30, 0x35]); // \u2705
const uIdx = distFunc.indexOf(u2705);
console.log('\n\\u2705 in dist at:', uIdx);
if (uIdx >= 0) {
  const ctx = distFunc.slice(uIdx - 20, uIdx + 30);
  console.log('Context:', JSON.stringify(ctx.toString('utf8')));
}

// Check: the pattern in dist should be: cabinetToast('Loaded slot ' + slot.slot + ' \u2705');
// Let's verify by searching for the full pattern
const fullPattern = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + ' \\u2705');");
const fullIdx = distFunc.indexOf(fullPattern);
console.log('\nFull pattern in dist:', fullIdx);

if (fullIdx === -1) {
  // Try with actual unicode instead of escape
  const fullPattern2 = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + ' \u2705');");
  const fullIdx2 = distFunc.indexOf(fullPattern2);
  console.log('With actual unicode:', fullIdx2);
  
  // Try with emoji
  const fullPattern3 = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + ' ✅');");
  const fullIdx3 = distFunc.indexOf(fullPattern3);
  console.log('With emoji:', fullIdx3);
}

// Look at the raw output around line 130 position 152 in dist
// Line 130 in the original error was in bootstrap.js, not dist/index.cjs
// But the bootstrap.js is generated from the renderSaveGrid function
// So the error "Unexpected identifier 'Loaded'" comes from the generated bootstrap.js

// Let's find the generated saveGrid.innerHTML output and see the actual issue
const innerHTMLStart = distFunc.indexOf(Buffer.from("div.innerHTML = img + '"));
if (innerHTMLStart >= 0) {
  const slice = distFunc.slice(innerHTMLStart, innerHTMLStart + 200);
  console.log('\ndiv.innerHTML output:', JSON.stringify(slice.toString('utf8')));
  console.log('Bytes:', slice.toString('hex'));
}