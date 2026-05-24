const fs = require('fs');
const srcBytes = fs.readFileSync('server/routes/player.ts');
const distBytes = fs.readFileSync('dist/index.cjs');

// Find the exact bytes for the two styles in source
const searchSource = Buffer.from([0x73, 0x74, 0x79, 0x6C, 0x65, 0x3D, 0x22, 0x63, 0x6F, 0x6C, 0x6F, 0x72]); // style="color
const srcPos = srcBytes.indexOf(searchSource);
console.log('Source style="color byte position:', srcPos);

// Show bytes around it
if (srcPos >= 0) {
  const ctx = srcBytes.slice(srcPos - 10, srcPos + 20);
  console.log('Source hex around style="color:', ctx.toString('hex'));
  // Check: byte 0x5C is backslash, 0x22 is quote
  // Is there 5C before the 22 of style=" ?
  const beforeStyle = ctx.slice(0, 6); // 6 bytes before "color"
  console.log('Before style quote hex:', beforeStyle.toString('hex'));
  console.log('Has backslash?', beforeStyle.includes(0x5C));
}

// Same for dist
const searchDist = Buffer.from([0x73, 0x74, 0x79, 0x6C, 0x65, 0x3D, 0x22, 0x63, 0x6F, 0x6C, 0x6F, 0x72]);
const distPos = distBytes.indexOf(searchDist);
console.log('\nDist style="color byte position:', distPos);
if (distPos >= 0) {
  const ctx = distBytes.slice(distPos - 10, distPos + 20);
  console.log('Dist hex around style="color:', ctx.toString('hex'));
  const beforeStyle = ctx.slice(0, 6);
  console.log('Before style quote hex:', beforeStyle.toString('hex'));
  console.log('Has backslash?', beforeStyle.includes(0x5C));
}

// Now check: is the source using a backtick template literal?
// Find the function renderEmulatorBootstrap and check what quote type is used
const srcContent = srcBytes.toString('utf8');
const funcStart = srcContent.indexOf('export function renderEmulatorBootstrap');
const funcEnd = srcContent.indexOf('\n}', funcStart + 500);
const funcSection = srcContent.slice(funcStart, funcEnd + 100);

// Check: what character does the saveGrid.innerHTML use?
const saveGridLineStart = srcContent.indexOf('saveGrid.innerHTML', funcStart);
const saveGridLine = srcContent.slice(saveGridLineStart, saveGridLineStart + 80);
console.log('\nSource saveGrid line:', JSON.stringify(saveGridLine.substring(0, 80)));
console.log('First char after =:', JSON.stringify(saveGridLine[0]));

// Check: template literal uses backtick ` 
const backtickCount = (funcSection.match(/`/g) || []).length;
const singleQuoteCount = (funcSection.match(/'[^']*'/g) || []).length;
const doubleQuoteCount = (funcSection.match(/"[^"]*"/g) || []).length;
console.log('\nIn renderEmulatorBootstrap function:');
console.log('Backticks:', backtickCount);
console.log('Single quote strings:', singleQuoteCount);
console.log('Double quote strings:', doubleQuoteCount);

// The key question: what quote character is used for the saveGrid.innerHTML string?
const sq = saveGridLine.indexOf("'");
const dq = saveGridLine.indexOf('"');
const bq = saveGridLine.indexOf('`');
console.log('\nFirst quote in saveGrid line:');
console.log('Single quote at:', sq);
console.log('Double quote at:', dq);
console.log('Backtick at:', bq);