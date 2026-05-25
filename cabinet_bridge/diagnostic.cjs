const fs = require('fs');
const d = fs.readFileSync('dist/index.cjs');
const searchBytes = Buffer.from([0x63,0x61,0x62,0x69,0x6E,0x65,0x54,0x6F,0x61,0x73,0x74,0x28,0x27,0x4C,0x6F,0x61,0x64,0x65,0x64]); // cabinetToast('Loaded
const i = d.indexOf(searchBytes);
console.log('cabinetToast(\'Loaded at byte:', i);
if (i >= 0) {
  const ctx = d.slice(i, i + 120);
  console.log('Content:', JSON.stringify(ctx.toString('utf8')));
  console.log('Bytes:', ctx.toString('hex'));
  
  // Check the bytes before the opening quote
  const before = d.slice(i - 5, i);
  console.log('5 bytes before:', before.toString('hex'), JSON.stringify(before.toString('utf8')));
  
  // The issue: is there a backslash before the quote?
  // cabinetToast('Loaded - the quote 0x27 should be directly after the ( character
  // But let's see the full context of the HTML attribute
  // onclick="cabinetToast('Loaded slot ' + slot.slot + ' \u2705');}
  
  // The generated HTML is: onclick="cabinetToast('Loaded slot ' + slot.slot + ' \u2705');}"
  // Inside the onclick attribute, after the browser parses onclick=", it reads:
  // cabinetToast('Loaded slot ' + slot.slot + ' \u2705');
  // But \u2705 is NOT valid inside an HTML attribute!
  // \u is not an HTML escape sequence - browsers don't understand \u escape!
  // The HTML parser sees \ and then u, but u isn't a valid HTML entity reference
  // So it might be treating \u as invalid, then 2705 as text
  
  // Check: in the HTML attribute, \u2705 is NOT valid - it should be &#x2705; or just the emoji
  // But in JS string context, \u2705 is valid
  // The problem is: this is inside an HTML onclick attribute value
  // The attribute value is: cabinetToast('Loaded slot ' + slot.slot + ' \u2705');
  // But inside HTML, \ is not special - it's just a backslash character
  // So the browser sees: cabinetToast('Loaded slot ' + slot.slot + ' \u2705');
  // And the \ is being treated as... something problematic
  
  // Actually wait - let me re-examine the actual output. The dist has:
  // cabinetToast('Loaded slot ' + slot.slot + ' \u2705');
  // This is a JS string. But in the HTML attribute context, the backslash matters.
  // Let me look at the actual raw bytes around the \u2705
  const uIdx = d.indexOf(Buffer.from('\\u2705'));
  console.log('\n\\u2705 at byte:', uIdx);
  if (uIdx >= 0) {
    const ctx2 = d.slice(uIdx - 30, uIdx + 30);
    console.log('Unicode context:', JSON.stringify(ctx2.toString('utf8')));
    console.log('Unicode bytes:', ctx2.toString('hex'));
  }
  
  // Find the saveGrid.innerHTML = img + '... div.innerHTML output
  const divStart = d.indexOf(Buffer.from("div.innerHTML = img + '"));
  console.log('\ndiv.innerHTML at byte:', divStart);
  if (divStart >= 0) {
    const slice = d.slice(divStart, divStart + 200);
    console.log('div.innerHTML content:', JSON.stringify(slice.toString('utf8')));
    console.log('div.innerHTML bytes:', slice.toString('hex'));
  }
}