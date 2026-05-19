#!/usr/bin/env node
// bump-version.js — updates version in package.json and config.yaml atomically
const fs = require("fs");
const path = require("path");

const newVersion = process.argv[2] || "2.24.44";

function updatePackageJson() {
  const file = path.join(process.cwd(), "package.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.version = newVersion;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`package.json: version set to ${newVersion}`);
}

function updateConfigYaml() {
  const file = path.join(process.cwd(), "config.yaml");
  let content = fs.readFileSync(file, "utf8");
  content = content.replace(/^version:\s*"[\d.]+"$/m, `version: "${newVersion}"`);
  fs.writeFileSync(file, content, "utf8");
  console.log(`config.yaml: version set to ${newVersion}`);
}

updatePackageJson();
updateConfigYaml();