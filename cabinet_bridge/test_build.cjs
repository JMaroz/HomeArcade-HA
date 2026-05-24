// Test how esbuild handles this specific pattern
const tsContent = `export function test() {
  return '<p style="color:red;">test</p>';
}`;

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Write test file
fs.writeFileSync('test_input.ts', tsContent);

// Compile with esbuild
try {
  const result = execSync('npx esbuild test_input.ts --bundle --format=iife --outfile=test_output.cjs', { encoding: 'utf8' });
  console.log('Build completed');
  const output = fs.readFileSync('test_output.cjs', 'utf8');
  console.log('Output:', JSON.stringify(output));
} catch(e) {
  console.log('Error:', e.message);
}

// Check bytes
const outBytes = fs.readFileSync('test_output.cjs');
const idx = outBytes.indexOf(Buffer.from('<p style'));
if (idx >= 0) {
  const slice = outBytes.slice(Math.max(0, idx - 20), idx + 60);
  console.log('\nOutput bytes around style=:', slice.toString('hex'));
  console.log('Output string:', JSON.stringify(slice.toString('utf8')));
}

// Cleanup
['test_input.ts', 'test_output.cjs'].forEach(f => {
  try { fs.unlinkSync(f); } catch(e) {}
});