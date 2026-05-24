const fs = require('fs');
const crypto = require('crypto');

const emulatorJs = fs.readFileSync('ejs_cache/emulator.min.js');
const loaderJs = fs.readFileSync('ejs_cache/loader.js');

console.log('emulator.min.js');
console.log('  Size:', emulatorJs.length, 'bytes');
console.log('  SHA256:', crypto.createHash('sha256').update(emulatorJs).digest('hex'));
console.log('');
console.log('loader.js');
console.log('  Size:', loaderJs.length, 'bytes');
console.log('  SHA256:', crypto.createHash('sha256').update(loaderJs).digest('hex'));

// Also check if there's any issue with the file content - look for non-ASCII
let nonAscii = 0;
for (let i = 0; i < Math.min(emulatorJs.length, 50000); i++) {
  if (emulatorJs[i] > 127) nonAscii++;
}
console.log('\nNon-ASCII in first 50KB:', nonAscii);