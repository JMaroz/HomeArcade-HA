$ErrorActionPreference = 'Continue'
$v = "2.43.29"

# Bump package.json
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$pkg.version = $v
$json = $pkg | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText("$PWD\package.json", $json, [System.Text.UTF8Encoding]::new($false))

# Bump config.yaml
$cfg = Get-Content config.yaml -Raw
$cfg = $cfg -replace '^version:.*', "version: $v"
[System.IO.File]::WriteAllText("$PWD\config.yaml", $cfg, [System.Text.UTF8Encoding]::new($false))

git add package.json config.yaml
git commit -m "fix: Update settings UI layout with defaultOpen Interface section and theme picker selector, and fix E2E Playwright test locator conflicts"
git tag "v$v"
git push
git push origin "v$v"