const fs = require('fs');
const src = fs.readFileSync('server/routes/player.ts', 'utf8');
const dist = fs.readFileSync('dist/index.cjs', 'utf8');

// Find renderSaveGrid in source
const srcStart = src.indexOf('function renderSaveGrid');
const srcEnd = src.indexOf('window.CabinetRefreshSaveGrid');
const srcFunc = src.slice(srcStart, srcEnd);

// Find the specific line with cabinetToast and emoji
const srcLineIdx = srcFunc.indexOf("cabinetToast\\('Loaded slot");
console.log('Source cabinetToast escaped at:', srcLineIdx);
if (srcLineIdx >= 0) {
  const slice = srcFunc.slice(Math.max(0, srcLineIdx-20), srcLineIdx + 100);
  console.log('Source context:', JSON.stringify(slice));
  console.log('Source hex:', Buffer.from(slice).toString('hex'));
}

// Check if the dist has this differently
const distStart = dist.indexOf('function renderSaveGrid');
const distEnd = dist.indexOf('window.CabinetRefreshSaveGrid');
const distFunc = dist.slice(distStart, distEnd);

// Find cabinetToast('Loaded - checking both escaped and unescaped
const toast1 = distFunc.indexOf("cabinetToast('Loaded slot");
const toast2 = distFunc.indexOf("cabinetToast(\\'Loaded slot");
const toast3 = distFunc.indexOf('cabinetToast("Loaded slot');
console.log('\nDist cabinetToast searches:');
console.log("  cabinetToast('Loaded slot:", toast1);
console.log("  cabinetToast(\\'Loaded slot:", toast2);
console.log('  cabinetToast("Loaded slot:', toast3);

// Show the actual bytes around the toast in dist
if (toast1 >= 0) {
  const slice = distFunc.slice(toast1 - 10, toast1 + 80);
  console.log('\nDist content around toast:', JSON.stringify(slice));
  console.log('Dist hex:', Buffer.from(slice).toString('hex'));
}

// Now look for the emoji in dist
const emojiIdx = distFunc.indexOf('\u2705');
console.log('\nEmoji \\u2705 in dist at:', emojiIdx);
if (emojiIdx >= 0) {
  const slice = distFunc.slice(Math.max(0, emojiIdx - 50), emojiIdx + 50);
  console.log('Context:', JSON.stringify(slice));
}

// Also check for actual emoji character (not escape)
const emojiActual = distFunc.indexOf('✅');
console.log('Actual emoji ✅ in dist at:', emojiActual);

// Check the source for emoji
const srcEmoji = srcFunc.indexOf('\u2705');
console '\nSource emoji \\u2705 at:', srcEmoji);
const srcEmojiActual = srcFunc.indexOf('✅');
console.log('Source actual emoji ✅ at:', srcEmojiActual);