const fs = require('fs');
const d = fs.readFileSync('dist/index.cjs', 'utf8');
const idx = d.indexOf("'Loaded slot");
console.log('Found at:', idx);
console.log('Context:', JSON.stringify(d.slice(idx, idx + 80)));

// Check the \u2705 escape
const uIdx = d.indexOf('\\u2705');
console.log('\n\\u2705 at:', uIdx);
if (uIdx >= 0) {
  const before = d.slice(uIdx - 10, uIdx + 20);
  console.log('Before unicode:', JSON.stringify(before));
  // What is the actual byte sequence?
  console.log('Bytes:', Buffer.from(before).toString('hex'));
  // Check if the backslash is actually a literal backslash
  const backslash = Buffer.from([0x5C]);
  console.log('Contains 0x5C?', Buffer.from(before).includes(backslash));
}

// Show: in the output, what is slot.slot + ' followed by?
const slotIdx = d.indexOf("slot.slot + '");
console.log('\nslot.slot + \' at:', slotIdx);
if (slotIdx >= 0) {
  const slice = d.slice(slotIdx, slotIdx + 50);
  console.log('Content:', JSON.stringify(slice));
  console.log('Bytes after slot.slot + \':', Buffer.from(slice).toString('hex'));
}