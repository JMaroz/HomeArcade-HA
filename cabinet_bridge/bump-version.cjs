#!/usr/bin/env node
/**
 * bump-version.cjs — atomically updates version across all config files.
 *
 * Usage:
 *   node bump-version.cjs patch        # 2.33.1 → 2.33.2
 *   node bump-version.cjs minor        # 2.33.1 → 2.34.0
 *   node bump-version.cjs major        # 2.33.1 → 3.0.0
 *   node bump-version.cjs 2.35.0       # set exact version
 *
 * Updates:
 *   - cabinet_bridge/package.json
 *   - cabinet_bridge/config.yaml
 *   - README.md (root)
 */
const fs = require("fs");
const path = require("path");

const arg = process.argv[2] || "patch";
const root = path.join(__dirname, "..");

// Read current version from package.json
const pkgPath = path.join(__dirname, "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const current = pkg.version;

function bumpVersion(current, type) {
  const [major, minor, patch] = current.split(".").map(Number);
  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  if (type === "patch") return `${major}.${minor}.${patch + 1}`;
  // Treat as explicit version string
  if (/^\d+\.\d+\.\d+$/.test(type)) return type;
  throw new Error(`Invalid version argument: "${type}". Use patch, minor, major, or x.y.z`);
}

const newVersion = bumpVersion(current, arg);

// 1. Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf8");
console.log(`✓ package.json       ${current} → ${newVersion}`);

// 2. Update config.yaml
const configPath = path.join(__dirname, "config.yaml");
let config = fs.readFileSync(configPath, "utf8");
config = config.replace(/^version:\s*"[\d.]+"$/m, `version: "${newVersion}"`);
fs.writeFileSync(configPath, config, "utf8");
console.log(`✓ config.yaml        ${current} → ${newVersion}`);

// 3. Update README.md (root)
const readmePath = path.join(root, "README.md");
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, "utf8");
  readme = readme.replace(
    /\*\*Current version: [\d.]+\*\*/,
    `**Current version: ${newVersion}**`
  );
  fs.writeFileSync(readmePath, readme, "utf8");
  console.log(`✓ README.md          ${current} → ${newVersion}`);
}

console.log(`\nVersion bumped: ${current} → ${newVersion}`);
console.log(`\nNext steps:`);
console.log(`  git add .`);
console.log(`  git commit -m "Bump version to ${newVersion}"`);
console.log(`  git push origin main`);
