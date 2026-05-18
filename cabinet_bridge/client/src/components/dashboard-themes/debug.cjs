const fs = require('fs');
const t = fs.readFileSync('HomeArcadeTheme.tsx', 'utf8');
const lines = t.split('\n');
const l = lines[953];
console.log('Line 954:', JSON.stringify(l));
console.log('Length:', l.length);
for (let i = 0; i < l.length; i++) {
  process.stdout.write(l.charCodeAt(i).toString(16).padStart(2, '0') + ' ');
  if ((i + 1) % 32 === 0) process.stdout.write('\n');
}