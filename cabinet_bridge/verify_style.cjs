const fs = require('fs');

// Read raw bytes of player.ts around the style="color area
const content = fs.readFileSync('server/routes/player.ts', 'utf8');
const idx = content.indexOf('style="color');
console.log('Position of style="color:', idx);

// Get the raw bytes around the quote after style=
const slice = content.slice(idx - 5, idx + 10);
console.log('Text around style=:', JSON.stringify(slice));
console.log('Bytes:', Buffer.from(slice).toString('hex'));

// Check: is there a backslash before the first quote of the attribute?
// In JSON.stringify, a backslash shows as \\ so if we see \" in JSON output, there's a backslash
console.log('\nDoes JSON show backslash before "color"?', JSON.stringify(slice).includes('\\"color'));

// Also find the renderSaveGrid section and check all style= attributes
const funcStart = content.indexOf('function renderSaveGrid');
const funcEnd = content.indexOf('window.CabinetRefreshSaveGrid');
const funcSection = content.slice(funcStart, funcEnd);

// Count occurrences of style=" 
let count = 0;
let pos = 0;
while ((pos = funcSection.indexOf('style="', pos)) !== -1 && pos < funcSection.length) {
  count++;
  const ctx = funcSection.slice(Math.max(0, pos-5), pos+40);
  console.log(`\nstyle= #${count} at offset ${pos}: ${JSON.stringify(ctx)}`);
  pos++;
}
console.log('\nTotal style=" occurrences in renderSaveGrid:', count);