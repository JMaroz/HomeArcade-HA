const fs = require('fs');
let c = fs.readFileSync('client/src/components/dashboard-themes/HomeArcadeTheme.tsx', 'utf8');
c = c.replace(/  const \[activeGameIdx, setActiveGameIdx\] = useState\(0\);\n/, '');
c = c.replace(/  const \[showMobileDetails, setShowMobileDetails\] = useState\(false\);\n/, '');
c = c.replace(/  const activeGame = filteredGames\[activeGameIdx\];\n/, '');
c = c.replace(/\/\/ [^\n]+\n  const gridRef = useRef[^\n]+;\n  const \{[^}]+\} = useGridNav\(\{[^}]+\}\);[\s\S]+?setFocusedIndex\(activeGameIdx\);\n  \}, \[activeGameIdx, focusedIndex, setFocusedIndex\]\);\n/, '');
fs.writeFileSync('client/src/components/dashboard-themes/HomeArcadeTheme.tsx', c);
console.log('Done');