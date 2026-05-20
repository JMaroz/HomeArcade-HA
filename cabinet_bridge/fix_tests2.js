const fs = require('fs');
const path = 'C:/Users/matt/.openclaw/workspace/token/cabinet_bridge/e2e/ux.spec.ts';
let c = fs.readFileSync(path, 'utf8');

// Revert corrupted BASE_URL references in regex strings back to ${BASE_URL}
c = c.replace(/\\BASE_URL\+/g, '\\${BASE_URL}');

fs.writeFileSync(path, c);
console.log('done');