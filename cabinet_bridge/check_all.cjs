const fs = require('fs');
const src = fs.readFileSync('server/routes/player.ts', 'utf8');
const dist = fs.readFileSync('dist/index.cjs', 'utf8');

// Check source cabinetToast
const funcStart = src.indexOf('function renderSaveGrid');
const funcEnd = src.indexOf('window.CabinetRefreshSaveGrid');
const func = src.slice(funcStart, funcEnd);

const toastIdx = func.indexOf("cabinetToast('Loaded slot");
console.log('Source cabinetToast offset:', toastIdx);
if (toastIdx >= 0) {
  const slice = func.slice(toastIdx, toastIdx + 80);
  console.log('Source:', JSON.stringify(slice));
  console.log('Source hex:', Buffer.from(slice).toString('hex'));
}

// Check dist cabinetToast
const distFuncStart = dist.indexOf('function renderSaveGrid');
const distFuncEnd = dist.indexOf('window.CabinetRefreshSaveGrid');
const distFunc = dist.slice(distFuncStart, distFuncEnd);
const distToastIdx = distFunc.indexOf("cabinetToast('Loaded slot");
console.log('\nDist cabinetToast offset:', distToastIdx);
if (distToastIdx >= 0) {
  const slice = distFunc.slice(distToastIdx, distToastIdx + 80);
  console.log('Dist:', JSON.stringify(slice));
  console.log('Dist hex:', Buffer.from(slice).toString('hex'));
}

// Check for unescaped single quotes in dist onclick attribute
const distOnclickIdx = distFunc.indexOf("onclick=");
if (distOnclickIdx >= 0) {
  const slice = distFunc.slice(distOnclickIdx, distOnclickIdx + 300);
  console.log('\nDist onclick:', JSON.stringify(slice.substring(0, 200)));
}

// Check source onclick 
const srcOnclickIdx = func.indexOf("onclick=");
if (srcOnclickIdx >= 0) {
  const slice = func.slice(srcOnclickIdx, srcOnclickIdx + 300);
  console.log('\nSource onclick:', JSON.stringify(slice.substring(0, 200)));
}

// Now find what cabinetToast('Loaded slot ' + slot.slot + ' looks like in the context of the onclick attribute
// The error "Unexpected identifier 'Loaded'" means the string is being prematurely closed
// Look for the pattern: cabinetToast('Loaded slot ' + slot.slot + ' ✅');
// Where inside the onclick attribute: onclick="...cabinetToast('Loaded slot ' + slot.slot + ' ✅');..."
// The single quote inside the double-quoted attribute is fine as a character
// BUT the issue is: the outer template literal is `...onclick="if(...);cabinetToast('Loaded slot ' + slot.slot + ' ✅');} "`...
// Wait, this is all one big template literal that produces a JS string!
// The output is: element.innerHTML = "...onclick="if(...);cabinetToast('Loaded slot ' + slot.slot + ' ✅');} "..."
// And this is assigned to innerHTML, which means the browser parses this as JavaScript, not HTML.

// In the generated JavaScript, we have:
// saveGrid.innerHTML = '...<button onclick="if(window.EJS_emulator){...cabinetToast(\'Loaded slot...)}\"...>...';
// The entire content is a single-quoted JS string (the value being assigned to innerHTML).
// Inside that string, the onclick attribute value uses double quotes: onclick="..."
// Inside the onclick value, there's cabinetToast(\'Loaded slot...\'); 
// And since we're inside a single-quoted JS string, the \' inside the onclick value should be fine as literal characters.

// But I see the source has: cabinetToast(\'Loaded slot ' + slot.slot + ' \u2705\');
// In the source, the \' are escaped single quotes INSIDE the template literal.
// The template literal evaluates to: ...cabinetToast('Loaded slot ' + slot.slot + ' ✅');...
// Where the inner '...' strings are just regular JS single-quoted strings.

// Wait, I need to look more carefully. Let me find the exact output in dist.
const innerHTMLstart = distFunc.indexOf('div.innerHTML = img + ');
if (innerHTMLstart >= 0) {
  const slice = distFunc.slice(innerHTMLstart, innerHTMLstart + 500);
  console.log('\n--- div.innerHTML assignment in dist ---');
  // Find cabinetToast call
  const ctIdx = slice.indexOf("cabinetToast");
  if (ctIdx >= 0) {
    console.log('cabinetToast at offset', ctIdx, ':', JSON.stringify(slice.slice(ctIdx, ctIdx + 100)));
  }
}