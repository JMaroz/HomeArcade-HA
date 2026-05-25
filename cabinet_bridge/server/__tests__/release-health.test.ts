import { describe, it, expect } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Release & Manifest Health Validation", () => {
  const bridgeDir = path.resolve(__dirname, "../..");
  const rootDir = path.resolve(bridgeDir, "..");

  it("should have matching versions in package.json and config.yaml", () => {
    const pkgPath = path.join(bridgeDir, "package.json");
    const cfgPath = path.join(bridgeDir, "config.yaml");

    expect(fs.existsSync(pkgPath)).toBe(true);
    expect(fs.existsSync(cfgPath)).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const pkgVersion = pkg.version;

    const cfgContent = fs.readFileSync(cfgPath, "utf8");
    const versionMatch = cfgContent.match(/^version:\s*["']?([^"'\s]+)["']?/m);
    
    expect(versionMatch).not.toBeNull();
    const cfgVersion = versionMatch![1];

    expect(pkgVersion).toBe(cfgVersion);
  });

  it("should have correct repository URLs pointing to the main HomeArcade-HA repo", () => {
    const repoYamlPath = path.join(rootDir, "repository.yaml");
    const cfgPath = path.join(bridgeDir, "config.yaml");

    expect(fs.existsSync(repoYamlPath)).toBe(true);
    expect(fs.existsSync(cfgPath)).toBe(true);

    // Check repository.yaml URL
    const repoContent = fs.readFileSync(repoYamlPath, "utf8");
    const repoUrlMatch = repoContent.match(/^url:\s*["']?([^"'\s]+)["']?/m);
    expect(repoUrlMatch).not.toBeNull();
    expect(repoUrlMatch![1]).toBe("https://github.com/GlerschNersch/HomeArcade-HA");

    // Check config.yaml URL
    const cfgContent = fs.readFileSync(cfgPath, "utf8");
    const cfgUrlMatch = cfgContent.match(/^url:\s*["']?([^"'\s]+)["']?/m);
    expect(cfgUrlMatch).not.toBeNull();
    expect(cfgUrlMatch![1]).toBe("https://github.com/GlerschNersch/HomeArcade-HA");
  });

  it("should document the active version in both root and local changelogs", () => {
    const pkgPath = path.join(bridgeDir, "package.json");
    const localChangelogPath = path.join(bridgeDir, "CHANGELOG.md");
    const rootChangelogPath = path.join(rootDir, "CHANGELOG.md");

    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const version = pkg.version;

    // Check local changelog
    expect(fs.existsSync(localChangelogPath)).toBe(true);
    const localChangelog = fs.readFileSync(localChangelogPath, "utf8");
    // Matches "## 2.43.31" or similar
    const localVersionRegex = new RegExp(`##\\s*${version.replace(/\./g, '\\.')}`);
    expect(localChangelog).toMatch(localVersionRegex);

    // Check root changelog
    expect(fs.existsSync(rootChangelogPath)).toBe(true);
    const rootChangelog = fs.readFileSync(rootChangelogPath, "utf8");
    // Matches "## [2.43.31]" or similar
    const rootVersionRegex = new RegExp(`##\\s*\\[${version.replace(/\./g, '\\.')}\\]`);
    expect(rootChangelog).toMatch(rootVersionRegex);
  });
});
