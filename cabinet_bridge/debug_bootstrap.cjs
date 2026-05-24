const fs = require('fs');
const content = fs.readFileSync('server/routes/player.ts', 'utf8');

// Find the renderSaveGrid inner function inside renderEmulatorBootstrap
const start = content.indexOf('function renderSaveGrid');
if (start < 0) {
  console.log('renderSaveGrid not found');
  process.exit(1);
}

// Find the section up to where it defines the innerHTML
const section = content.substring(start, start + 3000);

// Check for problematic escape sequences
const lines = section.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Look for escaped quotes in template literals
  if (line.includes('innerHTML') && (line.includes("\\'") || line.includes('\\"'))) {
    console.log('Line', i+1, 'has escapes:', line.substring(0, 150));
  }
  if (line.includes('cabinetToast') && line.includes("\\'")) {
    console.log('Line', i+1, 'cabinetToast has escapes:', line.substring(0, 150));
  }
}

// Find the actual problematic area
const innerHtmlIdx = section.indexOf('saveGrid.innerHTML');
if (innerHtmlIdx > 0) {
  console.log('\nsaveGrid.innerHTML area:');
  console.log(section.substring(innerHtmlIdx, innerHtmlIdx + 500));
}