const https = require('https');

const targetHost = 'cdn.emulatorjs.org';

async function fetch(path) {
  return new Promise((resolve) => {
    https.get({ hostname: targetHost, port: 443, path, headers: { 'User-Agent': 'HomeArcade/1.0' } }, (res) => {
      let size = parseInt(res.headers['content-length'] || '0');
      resolve({ status: res.statusCode, size });
    });
  });
}

async function main() {
  // Check if loader.js is the same as our local version
  const ourLoaderSize = require('fs').statSync('ejs_cache/loader.js').size;
  const cdnLoader = await fetch('/latest/data/loader.js');
  console.log(`Our loader.js: ${ourLoaderSize} bytes`);
  console.log(`CDN loader.js: ${cdnLoader.size} bytes (status: ${cdnLoader.status})`);

  // Check emulator.min.js
  const ourEmuSize = require('fs').statSync('ejs_cache/emulator.min.js').size;
  const cdnEmu = await fetch('/latest/data/emulator.min.js');
  console.log(`\nOur emulator.min.js: ${ourEmuSize} bytes`);
  console.log(`CDN emulator.min.js: ${cdnEmu.size} bytes (status: ${cdnEmu.status})`);
}

main().catch(e => console.error(e.message));