const fs = require('fs');
const c = fs.readFileSync('ejs_cache/emulator.min.js', 'utf8');

// Look for "color" preceded by a character that would make it a standalone identifier
// In JS, an identifier can't be preceded by a digit, but can be preceded by
// operators like (, [, ,, {, }, ;, :, =, +, -, *, /, %, etc.
// 
// Common problematic patterns:
// color:  (label statement in non-strict mode: labelname: ...)
// color;  (expression statement where color is the value)
// {color} (shorthand property but no value after)
// [color] (array element, would be fine actually)
// 
// Wait - in non-strict mode, "color: statement" is valid as a GOTO label!
// So "color: if(x) {...}" would be valid JS! Not an error.
// 
// But what about "color: color" - where the SECOND color is unexpected?

// Find the specific context of all standalone "color" occurrences
// Look for patterns like "color:" after a statement terminator
let idx = 0;
let count = 0;
while (count < 5) {
  idx = c.indexOf('color', idx);
  if (idx === -1) break;
  
  // Get context: 80 chars before and 60 after
  const before = c.substring(Math.max(0, idx - 80), idx);
  const after = c.substring(idx, idx + 60);
  
  // Check if this looks like it could be a label statement followed by something unexpected
  // e.g., "color: color" - the second "color" would be unexpected if the first was parsed as a label
  // In non-strict mode: "color: expression" is a valid label statement
  // But if the parser sees "color" then ":" then expects an expression but gets another identifier...
  
  // Check if there's a colon immediately after "color"
  const afterColor = c.substring(idx + 5, idx + 8);
  if (afterColor.startsWith(':')) {
    // This is a label statement "color: ..."
    // But wait - the label statement is valid JS...
    // Unless there's another "color" after the colon
    const rest = c.substring(idx + 5, idx + 100);
    const secondColorIdx = rest.indexOf('color');
    if (secondColorIdx !== -1 && secondColorIdx < 50) {
      console.log(`\n=== POTENTIAL ISSUE at ${idx} ===`);
      console.log(`BEFORE: ${JSON.stringify(before.slice(-30))}`);
      console.log(`MATCH: ${afterColor + rest.slice(0, 50)}`);
      console.log(`SECOND COLOR context: ${JSON.stringify(rest.substring(secondColorIdx, secondColorIdx + 50))}`);
    }
  }
  
  idx = idx + 1;
  count++;
}

// Also search specifically for the pattern "color:color" or "color: color"
const doubleColorM = c.match(/color:color/g);
const doubleColorSpaceM = c.match(/color: color/g);
console.log('\n\ncolor:color occurrences:', doubleColorM ? doubleColorM.length : 0);
console.log('color: color occurrences:', doubleColorSpaceM ? doubleColorSpaceM.length : 0);

// Most importantly - find where "Unexpected identifier 'color'" could come from
// In Chrome: "SyntaxError: Unexpected identifier 'color'" 
// This means the parser sees "color" where an expression is NOT allowed.
// 
// Examples:
// - "function color()" is fine
// - "var color" is fine  
// - "color = 5" is fine (global)
// - "color: if(x)" - label + statement, valid
// - "function() { color: 5 }" - label inside function body, valid
// - "var obj = { color }" - shorthand property, VALID
// - "var obj = { color: }" - INVALID (no value after colon)
// 
// The error could come from a shorthand where the VALUE is "color" as an undefined variable
// e.g., { color: color } where the second "color" is an undefined reference - but that would be ReferenceError not SyntaxError
// 
// What about ",color}" - where a comma starts an object property
// "{ color:color }" - the second "color" (after the colon) IS the value
// If "color" as a value is an undefined variable, that's RUNTIME, not syntax
// 
// WAIT! What if the problem is "color" as a LABEL followed by another label?
// "color: color:" - two labels in a row?
// In non-strict mode: label: label: statement is NOT valid
// Because after "color: color:" - the parser would expect a statement after the second colon
// but finds another identifier "color" instead
// 
// Let me look for "color:color:" pattern
const colorColonColorColon = c.match(/color:color:/g);
console.log('\ncolor:color: pattern:', colorColonColorColon ? colorColonColorColon.length : 0);

// And more broadly: label statements followed by identifiers
// Find "color: " followed by something that's not a statement-starting keyword
const labelColorM = c.match(/color:\s*[a-zA-Z_$]/g);
console.log('\ncolor: <identifier> patterns (possible label issues):', labelColorM ? labelColorM.length : 0);
if (labelColorM && labelColorM.length < 20) {
  console.log('Examples:', labelColorM.slice(0, 10));
}