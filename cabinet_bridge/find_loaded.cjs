const fs = require('fs');
const d = fs.readFileSync('dist/index.cjs');
const i = d.indexOf(Buffer.from("Loaded slot"));
console.log('"Loaded slot" at byte:', i);
if (i >= 0) {
  const s = d.slice(Math.max(0, i - 50), i + 150);
  console.log('Context:', JSON.stringify(s.toString('utf8')));
  console.log('Bytes:', s.toString('hex'));
  
  // What is the byte immediately before the opening quote of 'Loaded slot'?
  const before = d.slice(Math.max(0, i - 3), i);
  console.log('\n3 bytes before "Loaded slot":', before.toString('hex'));
  
  // Check: is there a backslash before the quote?
  if (before[before.length - 1] === 0x5C) {
    console.log('ERROR: Backslash (0x5C) found before opening quote!');
  }
  
  // Check: is the quote preceded by +' or just a bare '?
  // Pattern we expect: + 'Loaded slot...
  const expectedBefore = Buffer.from([0x27, 0x4C, 0x6F, 0x61, 0x64, 0x65, 0x64]); // 'Loaded
  const actualBefore = d.slice(i - 1, i + 6);
  console.log('\nActual 1 byte before:', d[i-1].toString('hex'));
  console.log('Expected quote (0x27)?', d[i-1] === 0x27);
  
  // Let's look at the broader context - what function is this in?
  // Find renderSaveGrid function boundaries
  const rsgStart = d.indexOf(Buffer.from('function renderSaveGrid'));
  const rsgEnd = d.indexOf(Buffer.from('window.CabinetRefreshSaveGrid'));
  console.log('\nrenderSaveGrid function: bytes', rsgStart, 'to', rsgEnd);
  
  // Find what function contains "Loaded slot"
  let containingFunc = '';
  if (i > rsgStart && i < rsgEnd) {
    containingFunc = 'renderSaveGrid';
  } else {
    // Find a nearby function name
    const nearby = d.slice(Math.max(0, i - 500), i);
    const funcMatch = nearby.match(/function\s+(\w+)/g);
    containingFunc = funcMatch ? funcMatch[funcMatch.length - 1] : 'unknown';
  }
  console.log('Containing function:', containingFunc);
}