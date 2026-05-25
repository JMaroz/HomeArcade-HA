$ErrorActionPreference = 'Continue'
$v = "2.43.31"

# Bump package.json
$pkg = Get-Content package.json -Raw | ConvertFrom-Json
$pkg.version = $v
$json = $pkg | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText("$PWD\package.json", $json, [System.Text.UTF8Encoding]::new($false))

# Bump config.yaml
$cfg = Get-Content config.yaml -Raw
$cfg = $cfg -replace '(?m)^version:.*', "version: `"$v`""
[System.IO.File]::WriteAllText("$PWD\config.yaml", $cfg, [System.Text.UTF8Encoding]::new($false))

git add package.json config.yaml
git commit -m "bump: version 2.43.30 -> 2.43.31 (fix repository sync URL)"
git tag "v$v"
git push
git push origin "v$v"