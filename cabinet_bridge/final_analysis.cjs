const fs = require('fs');
const src = fs.readFileSync('server/routes/player.ts', 'utf8');

// Get renderSaveGrid function
const funcStart = src.indexOf('function renderSaveGrid');
const funcEnd = src.indexOf('window.CabinetRefreshSaveGrid');
const func = src.slice(funcStart, funcEnd);

// Find cabinetToast call
const toastIdx = func.indexOf("cabinetToast('Loaded slot");
console.log('cabinetToast offset in source:', toastIdx);

// Show the exact source bytes around the toast call
const toastSlice = func.slice(toastIdx - 30, toastIdx + 100);
console.log('\nSource cabinetToast context:');
console.log('String:', JSON.stringify(toastSlice));

// Now check: the source has cabinetToast(\'Loaded slot...\')\;
// But the \' sequences - inside a template literal, these are just regular escape sequences
// In a template literal, \' is a valid escape for a single quote
// But wait - in the current source, are the \' actually present in the source file?

// Let's check the raw bytes of the source around the cabinetToast call
const srcBytes = fs.readFileSync('server/routes/player.ts');
const srcFuncStart = srcBytes.indexOf(Buffer.from('function renderSaveGrid'));
const srcFuncEnd = srcBytes.indexOf(Buffer.from('window.CabinetRefreshSaveGrid'));
const srcFunc = srcBytes.slice(srcFuncStart, srcFuncEnd);

const srcToastIdx = srcFunc.indexOf(Buffer.from("cabinetToast('Loaded slot"));
console.log('\nSource cabinetToast in bytes offset:', srcToastIdx);

if (srcToastIdx >= 0) {
  const slice = srcFunc.slice(srcToastIdx - 20, srcToastIdx + 80);
  console.log('Source bytes:', slice.toString('hex'));
  console.log('Source string:', JSON.stringify(slice.toString('utf8')));
}

// Check: is there a backslash before the opening quote?
const beforeQuote = srcFunc.slice(srcToastIdx - 5, srcToastIdx);
console.log('\n5 bytes before opening quote:', beforeQuote.toString('hex'));
console.log('Contains 0x5C (backslash)?', beforeQuote.includes(0x5C));

// Check the exact pattern of cabinetToast call in source
const pattern = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + ' \\u2705');");
const patternIdx = srcFunc.indexOf(pattern);
console.log('\nExact pattern with escaped backslash u in source:', patternIdx);
if (patternIdx >= 0) {
  console.log('Found it!');
} else {
  // Try without the escaped backslash
  const pattern2 = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + ' \\u2705');");
  const patternIdx2 = srcFunc.indexOf(pattern2);
  console.log('With escaped backslash:', patternIdx2);
  
  // Try with actual backslash character
  const pattern3 = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + ' \u2705');");
  const patternIdx3 = srcFunc.indexOf(pattern3);
  console.log('With actual unicode escape:', patternIdx3);
  
  // Try with actual emoji
  const pattern4 = Buffer.from("cabinetToast('Loaded slot ' + slot.slot + ' ✅');");
  const patternIdx4 = srcFunc.indexOf(pattern4);
  console.log('With actual emoji:', patternIdx4);
}

// Most importantly - find out what the actual compiled output looks like for the toast
const dist = fs.readFileSync('dist/index.cjs');
const distFuncStart = dist.indexOf(Buffer.from('function renderSaveGrid'));
const distFuncEnd = dist.indexOf(Buffer.from('window.CabinetRefreshSaveGrid'));
const distFunc = dist.slice(distFuncStart, distFuncEnd);
const distToastIdx = distFunc.indexOf(Buffer.from("cabinetToast('Loaded slot"));
console.log('\nDist cabinetToast offset:', distToastIdx);
if (distToastIdx >= 0) {
  const slice = distFunc.slice(distToastIdx, distToastIdx + 100);
  console.log('Dist bytes:', slice.toString('hex'));
  console.log('Dist string:', JSON.stringify(slice.toString('utf8')));
}

// Check if the issue is that the single quote is somehow being treated differently
// Let me look at the actual generated output for the Load button onclick attribute
// Specifically: onclick="if(window.EJS_emulator){...cabinetToast(...)}"
// Inside the onclick attribute value, the single quotes around 'Loaded slot' should be fine
// because they're inside a double-quoted attribute value.

// BUT WAIT - I need to check: what quote character does the outer template literal use?
// The renderSaveGrid function is inside the renderEmulatorBootstrap template literal
// Let me find what encloses renderSaveGrid

// Look at the return statement of renderEmulatorBootstrap
const returnStart = src.indexOf('return `"use strict";');
console.log('\nReturn statement at:', returnStart);
const returnSlice = src.slice(returnStart, returnStart + 500);
console.log('Return start:', JSON.stringify(returnSlice.substring(0, 100)));

// Find renderSaveGrid in context - is it inside a template literal?
const beforeRSG = src.slice(Math.max(0, funcStart - 200), funcStart);
console.log('\n200 chars before renderSaveGrid:');
console.log(JSON.stringify(beforeRSG));
console.log('Backtick count before renderSaveGrid:', (beforeRSG.match(/`/g) || []).length);