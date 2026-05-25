const fs = require('fs');
const d = fs.readFileSync('dist/index.cjs', 'utf8');

// Split into lines
const lines = d.split('\n');
console.log('Total lines:', lines.length);
console.log('Line 130:', JSON.stringify(lines[129]));
console.log('Line 130 length:', lines[129].length);
if (lines[129].length >= 152) {
  console.log('Char at 152:', JSON.stringify(lines[129][151]));
  console.log('Context 140-165:', JSON.stringify(lines[129].substring(140, 165)));
}

// Check if line 130 has any issues
const line130 = lines[129];
// Count single quotes, double quotes
let sq = 0, dq = 0;
for (const ch of line130) {
  if (ch === "'") sq++;
  else if (ch === '"') dq++;
}
console.log('\nLine 130 quotes: single=', sq, 'double=', dq);

// Check the compiled renderSaveGrid output specifically
const funcStart = d.indexOf('function renderSaveGrid');
const funcEnd = d.indexOf('window.CabinetRefreshSaveGrid');
const func = d.slice(funcStart, funcEnd);

// Count lines in renderSaveGrid
const funcLines = func.split('\n');
console.log('\nrenderSaveGrid function:');
console.log('Total lines:', funcLines.length);
console.log('Line count in compiled form:', funcLines.length);

// Show line numbers
funcLines.forEach((line, i) => {
  if (line.includes("cabinetToast('Loaded") || line.includes("slot.slot")) {
    console.log(`Line ${i}: ${line.substring(0, 100)}`);
  }
});

// Also check: what exact position in the whole file is line 130 char 152?
let pos = 0;
for (let i = 0; i < 129; i++) {
  pos += lines[i].length + 1; // +1 for newline
}
console.log('\nAbsolute position of line 130 char 152:', pos + 151);
console.log('Context:', JSON.stringify(d.slice(pos + 140, pos + 170)));