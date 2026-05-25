const fs = require('fs');
const d = fs.readFileSync('dist/index.cjs', 'utf8');

// First cabinetToast(' occurrence (not the function definition)
console.log('Byte 1043700 context:', JSON.stringify(d.slice(1043700, 1043700 + 120)));
console.log('Bytes:', Buffer.from(d.slice(1043700, 1043700 + 120)).toString('hex'));

// Second occurrence
console.log('\nByte 1044064 context:', JSON.stringify(d.slice(1044064, 1044064 + 120)));
console.log('Bytes:', Buffer.from(d.slice(1044064, 1044064 + 120)).toString('hex'));

// Check: is there a \u2705 in the dist at all?
const uIdx = d.indexOf('\\u2705');
console.log('\n\\u2705 in dist at:', uIdx);
if (uIdx >= 0) {
  console.log('Context:', JSON.stringify(d.slice(uIdx - 30, uIdx + 30)));
}

// Check: what character is at position 1043700 + 50 or so?
// cabinetToast('Loaded slot ' + slot.slot + ' \u2705');
// After ' + slot.slot + ' there should be \u2705
// Let's find the slot.slot in that context
const slotPattern = d.indexOf("slot.slot + '");
console.log('\nslot.slot + \' pattern at:', slotPattern);
if (slotPattern >= 0) {
  console.log('Context:', JSON.stringify(d.slice(slotPattern, slotPattern + 80)));
  console.log('Bytes:', Buffer.from(d.slice(slotPattern, slotPattern + 80)).toString('hex'));
}