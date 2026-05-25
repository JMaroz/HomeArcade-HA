const fs = require('fs');
const d = fs.readFileSync('dist/index.cjs');

// Find the specific pattern that causes "Unexpected identifier 'Loaded'"
// The error is cabinetToast('Loaded slot...) - so the quote before Loaded is somehow not seen as closing a string

// Find the exact output around 'Loaded slot'
const idx = d.indexOf("'Loaded slot '");
console.log('Found at byte:', idx);

// Get 500 bytes before and after
const slice = d.slice(Math.max(0, idx - 200), idx + 200);
console.log('\nFull hex:');
console.log(slice.toString('hex'));
console.log('\nString:');
console.log(JSON.stringify(slice.toString('utf8')));

// Count quote characters in the slice
const str = slice.toString('utf8');
let singleQuotes = 0;
let doubleQuotes = 0;
for (const ch of str) {
  if (ch === "'") singleQuotes++;
  else if (ch === '"') doubleQuotes++;
}
console.log('\nQuotes in slice:');
console.log('Single quotes:', singleQuotes);
console.log('Double quotes:', doubleQuotes);

// Check if there are any unescaped quotes inside the cabinetToast argument
// The pattern should be: cabinetToast('Loaded slot ' + slot.slot + ' \u2705');
// Let's verify the exact bytes
const searchPattern = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + ' \\u2705');} \"");
const patternIdx = d.indexOf(searchPattern);
console.log('\nExact pattern search:', patternIdx);

// Show the specific bytes of the cabinetToast call
const toastBytes = d.slice(idx - 50, idx + 100);
console.log('\nBytes of cabinetToast call:');
console.log('Hex:', toastBytes.toString('hex'));
console.log('As string:', JSON.stringify(toastBytes.toString('utf8')));

// The key question: what comes immediately before the ' in 'Loaded slot'?
// In the template literal, the outer string uses ' as delimiter
// So cabinetToast('Loaded slot...) means cabinetToast(the string 'Loaded slot '...)
// But something is consuming or escaping the quote before Loaded
const beforeLoaded = d.slice(idx - 10, idx);
console.log('\n10 bytes before the quote of \'Loaded slot\':');
console.log('Hex:', beforeLoaded.toString('hex'));
console.log('String:', JSON.stringify(beforeLoaded.toString('utf8')));