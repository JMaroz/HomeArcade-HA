const fs = require('fs');
const src = fs.readFileSync('server/routes/player.ts');

// Find the exact source bytes for the problematic area
const funcStart = src.indexOf(Buffer.from('function renderSaveGrid'));
const funcEnd = src.indexOf(Buffer.from('window.CabinetRefreshSaveGrid'));
const func = src.slice(funcStart, funcEnd);

// Find cabinetToast(\'Loaded slot
const searchBytes = Buffer.from("cabinetToast('Loaded slot");
const idx = func.indexOf(searchBytes);
console.log('cabinetToast call at byte:', idx);

if (idx >= 0) {
  const slice = func.slice(idx - 30, idx + 100);
  console.log('Bytes:', slice.toString('hex'));
  console.log('String:', JSON.stringify(slice.toString('utf8')));
  
  // Check: is there a backslash before the opening quote of 'Loaded slot'?
  const beforeQuote = func.slice(idx - 5, idx);
  console.log('\n5 bytes before opening quote:', beforeQuote.toString('hex'));
  console.log('Contains 0x5C?', beforeQuote.includes(0x5C));
  
  // Find the \u2705 in source
  const unicodeSearch = Buffer.from('\\u2705');
  const unicodeIdx = func.indexOf(unicodeSearch);
  console.log('\n\\u2705 pattern at byte:', unicodeIdx);
  if (unicodeIdx >= 0) {
    const slice2 = func.slice(unicodeIdx - 10, unicodeIdx + 20);
    console.log('Unicode context bytes:', slice2.toString('hex'));
    console.log('Unicode context string:', JSON.stringify(slice2.toString('utf8')));
  }
  
  // Check for actual \u escape
  const backslashU = Buffer.from('\\u');
  const buIdx = func.indexOf(backslashU);
  console.log('\n\\u pattern count:', buIdx >= 0 ? 'found at ' + buIdx : 'not found');
  
  // Look for the actual pattern in source - cabinetToast(\'Loaded slot ' + slot.slot + ' \u2705\')
  // In source, if \' is escaped, the bytes would be 5C 27
  const escapedSingleQuote = Buffer.from([0x5C, 0x27]); // \'
  const escIdx = func.indexOf(escapedSingleQuote);
  console.log('\nEscaped single quote \\' pattern count:', (func.match(/\\'/g) || []).length);
  
  // Just show the raw content of the slot.slot + ' section
  const slotIdx = func.indexOf(Buffer.from("slot.slot + ' \\u2705"));
  console.log('\nslot.slot pattern at:', slotIdx);
  if (slotIdx >= 0) {
    const slice3 = func.slice(slotIdx - 20, slotIdx + 40);
    console.log('Slot context:', slice3.toString('hex'));
    console.log('Slot string:', JSON.stringify(slice3.toString('utf8')));
  }
}

// Check what the source actually has for the cabinetToast argument
const fullSearch = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + '");
const fullIdx = func.indexOf(fullSearch);
console.log('\nFull pattern at:', fullIdx);
if (fullIdx >= 0) {
  const slice = func.slice(fullIdx, fullIdx + 80);
  console.log('Content:', JSON.stringify(slice.toString('utf8')));
  console.log('Bytes:', slice.toString('hex'));
}

// Most importantly - what is the actual character BEFORE the ' in 'Loaded slot' in the dist?
const dist = fs.readFileSync('dist/index.cjs');
const distFuncStart = dist.indexOf('function renderSaveGrid');
const distFuncEnd = dist.indexOf('window.CabinetRefreshSaveGrid');
const distFunc = dist.slice(distFuncStart, distFuncEnd);

// Find cabinetToast('Loaded slot ' + slot.slot + '
const distSearch = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + '");
const distIdx = distFunc.indexOf(distSearch);
console.log('\nDist pattern at:', distIdx);
if (distIdx >= 0) {
  const slice = distFunc.slice(distIdx, distIdx + 80);
  console.log('Dist content:', JSON.stringify(slice.toString('utf8')));
  console.log('Dist bytes:', slice.toString('hex'));
  
  // What are the exact bytes of the ' before Loaded?
  const quoteIdx = slice.indexOf("'Loaded slot");
  console.log('\nQuote before Loaded at offset:', quoteIdx);
  if (quoteIdx >= 0) {
    const quoteBytes = slice.slice(Math.max(0, quoteIdx - 5), quoteIdx + 3);
    console.log('Quote context bytes:', quoteBytes.toString('hex'));
    console.log('Quote context string:', JSON.stringify(quoteBytes.toString('utf8')));
  }
}