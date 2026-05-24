const https = require('https');
const fs = require('fs');
const path = require('path');

const EJS_CACHE_DIR = 'ejs_cache';

// Download emulator.min.js fresh from CDN
const url = 'https://cdn.emulatorjs.org/stable/data/emulator.min.js';
const destPath = path.join(EJS_CACHE_DIR, 'emulator.min.js');
const tmpPath = destPath + '.tmp';

console.log('Downloading emulator.min.js from CDN...');

https.get(url, { headers: { 'User-Agent': 'HomeArcade/1.0' } }, (res) => {
  if (res.statusCode !== 200) {
    console.error(`CDN returned ${res.statusCode}`);
    process.exit(1);
  }
  const size = parseInt(res.headers['content-length'] || '0', 10);
  console.log(`Content-Length: ${size} bytes`);
  console.log(`Content-Type: ${res.headers['content-type']}`);

  const writeStream = fs.createWriteStream(tmpPath);
  let downloaded = 0;
  res.on('data', (chunk) => {
    downloaded += chunk.length;
    if (size > 0) {
      process.stdout.write(`\rProgress: ${Math.round(downloaded / size * 100)}%`);
    }
    writeStream.write(chunk);
  });
  res.on('end', () => {
    writeStream.end();
    process.stdout.write('\n');
    fs.rename(tmpPath, destPath, () => {
      const stat = fs.statSync(destPath);
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(fs.readFileSync(destPath)).digest('hex');
      console.log(`Downloaded: ${stat.size} bytes, SHA256: ${hash}`);
    });
  });
  res.on('error', (err) => {
    console.error('Download error:', err.message);
    process.exit(1);
  });
}).on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});