const fs = require('fs');
const d = fs.readFileSync('dist/index.cjs');

// Find the exact position of cabinetToast('Loaded slot
const searchBytes = Buffer.from("cabinetToast('Loaded slot");
const idx = d.indexOf(searchBytes);
console.log('cabinetToast found at byte:', idx);

if (idx >= 0) {
  // Show bytes around position
  const slice = d.slice(Math.max(0, idx - 50), idx + 80);
  console.log('\nHex around cabinetToast:');
  console.log('Bytes:', slice.toString('hex'));
  console.log('String:', slice.toString('utf8'));
  
  // Check each byte
  const str = slice.toString('utf8');
  console.log('\nByte analysis:');
  for (let i = 0; i < 30; i++) {
    const b = slice[i];
    if (b !== undefined) {
      console.log(`  [${i}] 0x${b.toString(16).padStart(2,'0')} = '${str[i]}'`);
    }
  }
  
  // Check: is there a backslash 0x5C before the opening quote of 'Loaded slot'?
  console.log('\n--- Checking for backslash before the quote ---');
  const beforeQuote = d.slice(idx - 5, idx);
  console.log('5 bytes before cabinetToast:', beforeQuote.toString('hex'));
  console.log('Contains 0x5C (backslash)?', beforeQuote.includes(0x5C));
}

// Also check: what quotes are actually in the output for the cabinetToast call?
const aroundToast = d.slice(idx - 30, idx + 60);
console.log('\nFull context hex:');
console.log(aroundToast.toString('hex'));
console.log('String:', JSON.stringify(aroundToast.toString('utf8')));