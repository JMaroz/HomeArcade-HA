const fs = require('fs');
let c = fs.readFileSync('client/src/components/dashboard-themes/HomeArcadeTheme.tsx', 'utf8');

const marker = 'fixed right-0 top-0 sm:top-16 bottom-0 w-full sm:w-[450px] 2xl:w-[500px]';
const idx = c.indexOf(marker);
console.log('marker found at:', idx);
if (idx === -1) { console.log('NOT FOUND'); process.exit(1); }

// Grab exact 250 chars around it
const excerpt = c.slice(idx - 10, idx + 250);
console.log('EXCERPT:', JSON.stringify(excerpt));