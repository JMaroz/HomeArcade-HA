const fs = require('fs');
const content = fs.readFileSync('server/routes/player.ts', 'utf8');
const idx = content.indexOf('style="color');
console.log('style= at:', idx);
// Show raw bytes
const slice = content.slice(idx - 5, idx + 30);
console.log('Raw slice:', JSON.stringify(slice));
console.log('Slice bytes:', Buffer.from(slice).toString('hex'));
// Check character by character
for (let i = 0; i < 10; i++) {
  console.log(`Char ${i}: '${slice[i]}' code=${slice.charCodeAt(i)} hex=0x${slice.charCodeAt(i).toString(16)}`);
}