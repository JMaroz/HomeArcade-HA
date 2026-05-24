const fs = require('fs');
const content = fs.readFileSync('server/routes/player.ts', 'utf8');
const start = content.indexOf('function renderSaveGrid');
const end = content.indexOf('}', start + 5000);
const section = content.substring(start, end);
console.log('Section length:', section.length);

// Find all escaped double quotes in HTML attributes
const matches = [];
let idx = section.indexOf('\\"');
while (idx !== -1 && idx < section.length) {
  matches.push({pos: idx, context: section.substring(idx-20, idx+40)});
  idx = section.indexOf('\\"', idx+1);
}
console.log('Found', matches.length, 'escaped quotes');
matches.forEach((m, i) => console.log(i, ':', m.context));

// Also check for unescaped double quotes inside HTML attributes in template literal
// Look for pattern: style="..." where the ... contains double quotes
const htmlAttrMatches = [];
const attrPattern = /style="[^"]*"/g;
let match;
while ((match = attrPattern.exec(section)) !== null) {
  htmlAttrMatches.push(match[0]);
}
console.log('\nHTML style attributes found:', htmlAttrMatches.length);
htmlAttrMatches.forEach((m, i) => console.log(i, ':', m));