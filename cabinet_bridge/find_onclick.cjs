const fs = require('fs');
const s = fs.readFileSync('server/routes/player.ts', 'utf8');
const idx = s.indexOf('onclick="if');
console.log('onclick="if at:', idx);
console.log(JSON.stringify(s.slice(idx, idx + 100)));

// Find the specific one inside renderSaveGrid
const rsg = s.indexOf('function renderSaveGrid');
const onclickIdx = s.indexOf('onclick="if', rsg);
console.log('\nIn renderSaveGrid, onclick="if at:', onclickIdx);
console.log(JSON.stringify(s.slice(onclickIdx, onclickIdx + 200)));