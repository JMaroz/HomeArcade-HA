const fs = require('fs');
let c = fs.readFileSync('client/src/components/MobileNav.tsx', 'utf8');
// Add Group to imports
c = c.replace(
  'import { LayoutDashboard, Gamepad2, Trophy, Settings, History, QrCode, Menu } from "lucide-react";',
  'import { LayoutDashboard, Gamepad2, Trophy, Settings, History, QrCode, Menu, Group } from "lucide-react";'
);
// Replace tabs array - just do a simple line replacement
const lines = c.split('\n');
const newTabs = [
  '    { href: "/",            icon: LayoutDashboard, label: t("nav.home") || "Library"   },',
  '    { href: "/friends",     icon: Group,           label: t("nav.friends") || "Friends"  },',
  '    { href: "/history",     icon: History,         label: t("nav.history") || "History"  },',
  '    { href: "/achievements",icon: Trophy,          label: t("nav.achievements") || "Awards"   },',
  '    { href: "/settings",    icon: Settings,        label: t("nav.settings") || "Settings" },',
  '  ] as const;'
];
// Find the tabs block (lines 64-70) and replace
const start = lines.findIndex((l,i) => i > 60 && l.includes('const tabs = ['));
if (start >= 0) {
  // Find the closing ] as const;
  let end = start;
  for (let i = start; i < lines.length; i++) {
    if (lines[i].trim() === '] as const;') { end = i; break; }
  }
  lines.splice(start, end - start + 1, ...newTabs);
  c = lines.join('\n');
}
fs.writeFileSync('client/src/components/MobileNav.tsx', c);
console.log('Done');