const fs = require('fs');
const path = 'server/routes/player.ts';
const content = fs.readFileSync(path);

// Find style="color area and show exact characters
const idx = content.indexOf('style="color');
console.log('Position:', idx);

// Show exact characters around the =
const slice = content.slice(idx - 3, idx + 15);
console.log('Raw slice:', JSON.stringify(slice));
console.log('Char codes:', [...slice].map(c => c.charCodeAt(0)));

// Find all 9 style attributes in renderSaveGrid and show raw characters for each
const funcStart = content.indexOf('function renderSaveGrid');
const funcEnd = content.indexOf('window.CabinetRefreshSaveGrid');
const section = content.slice(funcStart, funcEnd);

console.log('\n--- All style= occurrences in renderSaveGrid ---');
let pos = 0;
let count = 0;
while ((pos = section.indexOf('style=', pos)) !== -1 && count < 20) {
  count++;
  const ctx = section.slice(Math.max(0, pos - 2), pos + 30);
  console.log(`#${count} offset ${pos}: ${JSON.stringify(ctx)} | char codes: ${[...ctx].map(c => c.charCodeAt(0))}`);
  pos++;
}

// Also check what the compiled dist looks like
const dist = fs.readFileSync('dist/index.cjs', 'utf8');
const distIdx = dist.indexOf('saveGrid.innerHTML = "<p style');
if (distIdx >= 0) {
  const distSlice = dist.slice(distIdx, distIdx + 100);
  console.log('\n--- dist/index.cjs saveGrid.innerHTML ---');
  console.log(JSON.stringify(distSlice));
}