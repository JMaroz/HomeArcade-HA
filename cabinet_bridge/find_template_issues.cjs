const fs = require('fs');
const srcContent = fs.readFileSync('server/routes/player.ts', 'utf8');

// Get the full renderEmulatorBootstrap function
const funcStart = srcContent.indexOf('export function renderEmulatorBootstrap');
const afterFunc = srcContent.indexOf('\n}', funcStart + 100);
const funcEnd = srcContent.indexOf('\n', afterFunc + 10);
const funcSection = srcContent.slice(funcStart, funcEnd);

// Show first 200 chars of the function
console.log('Function start (first 200 chars):');
console.log(JSON.stringify(funcSection.substring(0, 200)));

// Find all backtick positions
const backtickPositions = [];
let bq = funcSection.indexOf('`');
while (bq !== -1) {
  backtickPositions.push(bq);
  bq = funcSection.indexOf('`', bq + 1);
}
console.log('\nBacktick count:', backtickPositions.length);
console.log('Positions:', backtickPositions.slice(0, 20));

// Find the renderSaveGrid section
const saveGridStart = funcSection.indexOf('function renderSaveGrid');
console.log('\nrenderSaveGrid found at offset:', saveGridStart);

// Find the preceding 500 chars before renderSaveGrid
const beforeSaveGrid = funcSection.slice(Math.max(0, saveGridStart - 500), saveGridStart);
console.log('\n500 chars before renderSaveGrid:');
console.log(JSON.stringify(beforeSaveGrid));

// Count backticks before renderSaveGrid
const backticksBefore = (beforeSaveGrid.match(/`/g) || []).length;
console.log('\nBackticks before renderSaveGrid:', backticksBefore);
console.log('Is renderSaveGrid in template literal?', backticksBefore % 2 === 1);

// Find the specific saveGrid.innerHTML line
const saveGridLineStart = funcSection.indexOf('saveGrid.innerHTML');
const saveGridLine = funcSection.slice(saveGridLineStart, saveGridLineStart + 120);
console.log('\nFull saveGrid.innerHTML line:');
console.log(JSON.stringify(saveGridLine));

// Look for the pattern: saveGrid.innerHTML = `...<p style="...
// That would explain the broken output
console.log('\n--- Looking for template literal containing saveGrid ---');
const templateMatch = funcSection.match(/saveGrid\.innerHTML\s*=\s*`[^`]*`/);
if (templateMatch) {
  console.log('Found template literal:', JSON.stringify(templateMatch[0].substring(0, 100)));
}

// Find all backtick-enclosed strings in the function that contain saveGrid.innerHTML
let searchStart = 0;
while (searchStart < funcSection.length) {
  const openBq = funcSection.indexOf('`', searchStart);
  if (openBq === -1) break;
  const closeBq = funcSection.indexOf('`', openBq + 1);
  if (closeBq === -1) break;
  const templateContent = funcSection.slice(openBq, closeBq + 1);
  if (templateContent.includes('saveGrid')) {
    console.log('\nTemplate containing saveGrid found at position', openBq);
    console.log('Content:', JSON.stringify(templateContent.substring(0, 150)));
  }
  searchStart = closeBq + 1;
}