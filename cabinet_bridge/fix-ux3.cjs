const fs = require('fs');

// Fix smoke.spec.ts: BASE_URL + /library -> APP_URL + /
let c = fs.readFileSync('e2e/smoke.spec.ts', 'utf8');
let count = 0;
// Replace the library goto
while (c.includes("await page.goto(`${BASE_URL}/#/library`);")) {
  c = c.replace("await page.goto(`${BASE_URL}/#/library`);", "await page.goto(`${APP_URL}/`);");
  count++;
}
// Replace test name
c = c.replace(
  "test('library page renders game grid or empty state'",
  "test('home page renders game grid or empty state'"
);
fs.writeFileSync('e2e/smoke.spec.ts', c);
console.log('smoke.spec.ts:', count, 'replacements');

// Fix art-coverage.spec.ts: BASE_URL + /library/recent -> APP_URL + /
c = fs.readFileSync('e2e/art-coverage.spec.ts', 'utf8');
count = 0;
while (c.includes("await page.goto(`${BASE_URL}/#/library/recent`);")) {
  c = c.replace("await page.goto(`${BASE_URL}/#/library/recent`);", "await page.goto(`${APP_URL}/`);");
  count++;
}
fs.writeFileSync('e2e/art-coverage.spec.ts', c);
console.log('art-coverage.spec.ts:', count, 'replacements');

// Fix now-playing.spec.ts: BASE_URL + /library -> APP_URL + /
c = fs.readFileSync('e2e/now-playing.spec.ts', 'utf8');
count = 0;
while (c.includes("await page.goto(`${BASE_URL}/#/library`);")) {
  c = c.replace("await page.goto(`${BASE_URL}/#/library`);", "await page.goto(`${APP_URL}/`);");
  count++;
}
fs.writeFileSync('e2e/now-playing.spec.ts', c);
console.log('now-playing.spec.ts:', count, 'replacements');