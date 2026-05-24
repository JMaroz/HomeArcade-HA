const fs = require('fs');
const content = fs.readFileSync('server/routes/player.ts', 'utf8');

// Find all escaped quotes in the entire file
const matches = [];
let idx = content.indexOf('\\"');
while (idx !== -1) {
  matches.push({pos: idx, context: content.substring(idx-50, idx+50)});
  idx = content.indexOf('\\"', idx+1);
}
console.log('Total escaped quotes in file:', matches.length);
matches.forEach((m, i) => console.log(i, 'pos:', m.pos, JSON.stringify(m.context)));