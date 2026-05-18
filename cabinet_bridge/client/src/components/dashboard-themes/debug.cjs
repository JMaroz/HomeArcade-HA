const fs = require('fs');
const text = fs.readFileSync('HomeArcadeTheme.tsx', 'utf8');

// Find truly unterminated strings (single-line only, looking for odd quote counts)
const lines = text.split('\n');
for(let i=0;i<lines.length;i++){
  const l = lines[i];
  // Skip lines that are JSX (contain < or >) or comments
  if(l.includes('<') || l.includes('//') || l.trim().startsWith('*')) continue;
  
  // Find lines with potentially unterminated strings
  // Count quotes properly
  let inStr = false, strChar = '', escapes = 0;
  for(let j=0;j<l.length;j++){
    const ch = l[j];
    if(ch === '\\'){ escapes++; continue; }
    if(escapes > 0){ escapes = 0; continue; }
    if(ch === '"' || ch === "'"){
      if(!inStr){ inStr = true; strChar = ch; }
      else if(ch === strChar){ inStr = false; strChar = ''; }
      else { /* different closer */ }
    }
  }
  if(inStr) console.log(i+1, 'unterminated string:', l.trim().slice(0,80));
}

// Check for unterminated template literals
let inTemplate = false, templateStart = 0;
for(let i=0;i<text.length;i++){
  if(text[i] === '`' && (i === 0 || text[i-1] !== '\\')){
    if(!inTemplate){ inTemplate = true; templateStart = i; }
    else { inTemplate = false; }
  }
}
if(inTemplate) console.log('Unterminated template literal at position', templateStart);