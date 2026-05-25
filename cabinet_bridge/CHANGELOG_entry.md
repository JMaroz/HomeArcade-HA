## 2.43.12 - 2026-05-24

- **Fix**: **cabinetToast Unicode Escape in HTML Attributes** - Replaced `\u2705` and `\u{1F5D1}` escape sequences with actual emoji characters in renderSaveGrid cabinetToast calls. The `\u` escape sequences inside HTML onclick attributes were being parsed as literal backslash+u, causing "Unexpected identifier 'Loaded'" JS syntax errors.## 2.43.11 - 2026-05-24