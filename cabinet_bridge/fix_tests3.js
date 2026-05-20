const fs = require('fs');
const path = 'C:/Users/matt/.openclaw/workspace/token/cabinet_bridge/e2e/ux.spec.ts';
let c = fs.readFileSync(path, 'utf8');

// Fix all remaining backtick template literals containing APP_URL+/
// These are unevaluated string concatenations that should use + instead

// Pattern: `APP_URL+/something` -> APP_URL + '/something'
c = c.replace(/`APP_URL\+\/([^`]+)`/g, (match, suffix) => {
  return "APP_URL + '/" + suffix + "'";
});

fs.writeFileSync(path, c);
console.log('done, replacements:', c.match(/APP_URL \+ '/g)?.length ?? 0);