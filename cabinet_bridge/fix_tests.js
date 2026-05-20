const fs = require('fs');
const path = 'C:/Users/matt/.openclaw/workspace/token/cabinet_bridge/e2e/ux.spec.ts';
let c = fs.readFileSync(path, 'utf8');

// Fix broken APP_URL+/ replacements - revert to proper string concatenation
c = c.replace(/`APP_URL\+\/`/g, "APP_URL + '/'");

fs.writeFileSync(path, c);
console.log('done');