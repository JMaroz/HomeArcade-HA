const fs = require('fs');
let c = fs.readFileSync('e2e/ux.spec.ts', 'utf8');
const old = 'await page.goto(`${APP_URL}/library`);';
const rep = 'await page.goto(`${APP_URL}/`);';
let count = 0;
while (c.includes(old)) { c = c.replace(old, rep); count++; }
fs.writeFileSync('e2e/ux.spec.ts', c);
console.log('replaced:', count, 'instances');