const fs = require('fs');
const dist = fs.readFileSync('dist/index.cjs', 'utf8');
const idx = dist.indexOf('saveGrid.innerHTML = "<p style');
console.log('dist saveGrid position:', idx);
if (idx >= 0) {
  const slice = dist.slice(idx, idx + 200);
  console.log(JSON.stringify(slice));
  // Show exact byte values around the first style=
  const firstStyle = dist.indexOf('style="color', idx);
  const ctx = dist.slice(firstStyle - 5, firstStyle + 15);
  const bytes = Buffer.from(ctx);
  console.log('Bytes around style="color:', bytes.toString('hex'));
  console.log('String around style="color:', JSON.stringify(ctx.toString()));
}

// Also check the original compiled output from before any fix attempt
// Look at the actual bytes of the .cjs file around the same area
const distBytes = fs.readFileSync('dist/index.cjs');
const searchBytes = Buffer.from('saveGrid.innerHTML = "<p style');
const pos = distBytes.indexOf(searchBytes);
console.log('\ndist bytes position:', pos);
if (pos >= 0) {
  const snippet = distBytes.slice(pos, pos + 100);
  console.log('Hex:', snippet.toString('hex'));
  console.log('Decoded:', snippet.toString('utf8'));
}