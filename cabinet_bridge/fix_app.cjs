const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
// Replace imports
c = c.replace(
  /import \{ MobileBottomNav, MobileTopBar \} from "@\/components\/MobileNav";/,
  'import { MobileBottomNav } from "@/components/MobileNav";'
);
c = c.replace(
  /import Home from "@\/pages\/Home";\nimport \{ ProfileProvider \} from "\.\/lib\/useProfile";\nimport Dashboard from "@\/pages\/Dashboard";/,
  'import { ProfileProvider } from "./lib/useProfile";'
);
// Remove Dashboard from imports (line after ProfileProvider, Dashboard is on its own line)
c = c.replace(
  /import Dashboard from "@\/pages\/Dashboard";\n/,
  ''
);
// Add HomePage import after i18n
c = c.replace(
  /import i18n from "\.\/lib\/i18n";\n/,
  'import i18n from "./lib/i18n";\nimport HomePage from "@/pages/HomePage";\n'
);
// Remove Lazy — loaded only when navigated to section (it's fine to keep lazy imports)
// But remove Dashboard from the lazy list
c = c.replace(
  /const Dashboard = lazy\(\(\) => import\("@\/pages\/Dashboard"\)\);\n/,
  ''
);

// Write back
fs.writeFileSync('client/src/App.tsx', c);
console.log('Done');