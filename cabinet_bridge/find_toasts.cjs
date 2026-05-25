const fs = require('fs');
const d = fs.readFileSync('dist/index.cjs', 'utf8');
const matches = [];
let pos = 0;
while (true) {
  pos = d.indexOf("cabinetToast('", pos);
  if (pos === -1) break;
  matches.push(pos);
  pos = pos + 1;
}
console.log('cabinetToast(\' found at:', matches);
if (matches.length >= 2) {
  const second = matches[1];
  console.log('Second occurrence context:', JSON.stringify(d.slice(second, second + 100)));
}
const funcDefIdx = d.indexOf("function cabinetToast");
console.log('Function definition context:', JSON.stringify(d.slice(funcDefIdx, funcDefIdx + 80)));