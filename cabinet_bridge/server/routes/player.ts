import { escapeHtml } from "./utils";

// ── EJS default controls builder ───────────────────────────────────────────
const EJS_DEFAULT_KEYS: Record<number, string> = {
  0: "z", 1: "a", 2: "shift", 3: "enter",
  4: "up arrow", 5: "down arrow", 6: "left arrow", 7: "right arrow",
  8: "x", 9: "s", 10: "q", 11: "w",
  12: "e", 13: "r", 14: "tab", 15: "c",
  24: "1", 25: "2", 26: "3",
};

const EJS_VALUE2: Record<number, string> = {
  // Standard W3C Gamepad API button indices — matches DEFAULT_GAMEPAD_MAP in Settings.tsx.
  // EmulatorJS expects numeric-string indices here, not named constants.
  0: "0",   // Retropad B   → A / Cross      (button 0)
  1: "2",   // Retropad Y   → X / Square     (button 2)
  2: "8",   // Retropad Sel → Select / Share (button 8)
  3: "9",   // Retropad Sta → Start / Menu   (button 9)
  4: "12",  // Retropad D↑  → D-pad Up       (button 12)
  5: "13",  // Retropad D↓  → D-pad Down     (button 13)
  6: "14",  // Retropad D←  → D-pad Left     (button 14)
  7: "15",  // Retropad D→  → D-pad Right    (button 15)
  8: "1",   // Retropad A   → B / Circle     (button 1)
  9: "3",   // Retropad X   → Y / Triangle   (button 3)
  10: "4",  // Retropad L   → LB / L1        (button 4)
  11: "5",  // Retropad R   → RB / R1        (button 5)
  12: "6",  // Retropad L2  → LT / L2        (button 6)
  13: "7",  // Retropad R2  → RT / R2        (button 7)
  14: "10", // Retropad L3  → Left stick     (button 10)
  15: "11", // Retropad R3  → Right stick    (button 11)
};

export function buildPlayerControls(
  core: string,
  customKeys: Record<number, string>,
  gamepadBindings: Record<number, number> = {},
): Record<number, { value: string; value2?: string }> {
  const isPS = ["psx", "play", "ppsspp"].includes(core);
  const maxBtn = isPS ? 15 : 11;
  const controls: Record<number, { value: string; value2?: string }> = {};
  for (let i = 0; i <= maxBtn; i++) {
    const key = customKeys[i] ?? EJS_DEFAULT_KEYS[i];
    if (!key) continue;
    const entry: { value: string; value2?: string } = { value: key };
    if (gamepadBindings[i] !== undefined) {
      entry.value2 = String(gamepadBindings[i]);
    } else if (EJS_VALUE2[i]) {
      entry.value2 = EJS_VALUE2[i];
    }
    controls[i] = entry;
  }
  // Hotkeys (shared, still respect custom overrides)
  for (const idx of [24, 25, 26]) {
    controls[idx] = { value: customKeys[idx] ?? EJS_DEFAULT_KEYS[idx] ?? String(idx - 23) };
  }
  return controls;
}

export function buildEjsControls(
  core: string,
  controlDefaults: Record<string, Record<number, string>>,
  gamepadBindings: Record<number, number> = {},
  controlDefaultsP2: Record<number, string> = {},
  gamepadBindingsP2: Record<number, number> = {},
): Record<number, Record<number, { value: string; value2?: string }>> {
  // Merge numeric keys from saved config (keys may be strings after JSON round-trip)
  const custom: Record<number, string> = {};
  for (const [k, v] of Object.entries(controlDefaults[core] ?? {})) {
    custom[Number(k)] = v;
  }
  const p1 = buildPlayerControls(core, custom, gamepadBindings);
  // Only populate P2 if bindings have been saved for it
  const hasP2 = Object.keys(controlDefaultsP2).length > 0 || Object.keys(gamepadBindingsP2).length > 0;
  const p2 = hasP2 ? buildPlayerControls(core, controlDefaultsP2, gamepadBindingsP2) : {};
  return { 0: p1, 1: p2, 2: {}, 3: {} };
}

export function renderPlayerError(message: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        height: 100%;
        margin: 0;
        display: grid;
        place-items: center;
        background: #050507;
        color: #f8fafc;
        font: 14px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      }
    </style>
  </head>
  <body>${escapeHtml(message)}</body>
</html>`;
}

export function renderBootstrapError(message: string) {
  return `"use strict";
function cabinetFailLaunchProgress(msg) {
  var bar = document.querySelector("#cabinet-progress-bar");
  var statusText = document.querySelector("#cabinet-launch-status");
  if (bar) {
    bar.style.width = "100%";
    bar.style.backgroundColor = "#ef4444";
  }
  if (statusText) {
    statusText.textContent = msg || "Launch failed";
    statusText.style.color = "#ef4444";
    statusText.style.opacity = "1";
    statusText.style.fontWeight = "900";
  }
}
cabinetFailLaunchProgress(${JSON.stringify(message)});
`;
}

export function renderEmulatorPage({ title, returnTo, romHash, queryString, system }: { title: string; returnTo: string; romHash: string | null; queryString?: string; system?: string }) {
  const safeTitle = escapeHtml(title);
  const safeReturnTo = JSON.stringify(returnTo);
  const safeQueryString = queryString || "";
  const safeSystem = system || "generic";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${safeTitle} · HomeArcade</title>
    <style>
      :root {
        --vpad-scale: 1;
        --vpad-opacity: 1;
      }
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #000;
        color: #f8fafc;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      }
      .cabinet-menu-button {
        position: fixed;
        z-index: 999999;
        top: max(12px, env(safe-area-inset-top));
        left: max(12px, env(safe-area-inset-left));
        appearance: none;
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        background: rgba(5, 5, 7, 0.65);
        color: #f8fafc;
        cursor: pointer;
        font: 800 11px ui-monospace, monospace;
        letter-spacing: 0.14em;
        min-height: 46px;
        padding: 0 18px;
        text-transform: uppercase;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.42);
        backdrop-filter: blur(12px);
        transition: all 180ms ease;
      }
      .cabinet-menu-button:hover,
      .cabinet-menu-button[aria-expanded="true"] {
        background: rgba(236, 72, 153, 0.36);
        border-color: rgba(236, 72, 153, 0.78);
        outline: none;
      }
      .cabinet-menu-backdrop {
        position: fixed;
        z-index: 999998;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        opacity: 0;
        pointer-events: none;
        transition: opacity 180ms ease, visibility 180ms ease;
        visibility: hidden;
        backdrop-filter: blur(4px);
      }
      .cabinet-menu-panel {
        position: fixed;
        z-index: 999999;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(12px);
        opacity: 0;
        pointer-events: none;
        transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
        visibility: hidden;
      }
      .cabinet-menu-panel.is-open { opacity: 1; pointer-events: auto; visibility: visible; }

      .cabinet-menu-card {
        width: min(90vw, 420px);
        max-height: 90vh;
        overflow-y: auto;
        background: rgba(15, 15, 20, 0.85);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 32px;
        box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.1);
        padding: 32px;
        transform: scale(0.9) translateY(20px);
        transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .cabinet-menu-panel.is-open .cabinet-menu-card { transform: scale(1) translateY(0); }

      .cabinet-menu-header { margin-bottom: 24px; text-align: center; }
      .cabinet-menu-title { font: 900 11px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.3em; color: #ec4899; }
      .cabinet-menu-game { font-size: 16px; font-weight: 900; color: #fff; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .cabinet-menu-section-label { font: 900 9px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255, 255, 255, 0.3); margin: 24px 0 12px; }

      .cabinet-menu-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .cabinet-menu-tile {
        appearance: none;
        aspect-ratio: 1 / 0.8;
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        cursor: pointer;
        transition: all 150ms ease;
      }
      .cabinet-menu-tile:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); transform: translateY(-2px); }
      .cabinet-menu-tile:active { transform: scale(0.95); background: rgba(236, 72, 153, 0.2); border-color: #ec4899; }
      .cabinet-menu-tile.primary { background: rgba(236, 72, 153, 0.15); border-color: rgba(236, 72, 153, 0.4); }
      .cabinet-menu-tile.primary:hover { background: rgba(236, 72, 153, 0.25); border-color: #ec4899; }
      .cabinet-menu-tile.danger:hover { background: rgba(239, 68, 68, 0.15); border-color: #ef4444; }

      .cabinet-menu-tile i { font-size: 20px; }
      .cabinet-menu-tile span { font: 900 10px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; }

      /* Settings Controls */
      .cabinet-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
      .cabinet-setting-label { font: 800 10px ui-monospace, monospace; text-transform: uppercase; color: rgba(255, 255, 255, 0.7); }
      .cabinet-setting-control { flex: 1; display: flex; align-items: center; gap: 12px; }
      
      input[type="range"] {
        flex: 1; appearance: none; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.1);
      }
      input[type="range"]::-webkit-slider-thumb {
        appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #ec4899; cursor: pointer; border: 2px solid #fff;
      }
      
      .cabinet-toggle {
        appearance: none; width: 36px; height: 20px; border-radius: 18px; background: rgba(255, 255, 255, 0.1); position: relative; cursor: pointer; transition: background 200ms;
      }
      .cabinet-toggle::after {
        content: ""; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform 200ms;
      }
      .cabinet-toggle:checked { background: #ec4899; }
      .cabinet-toggle:checked::after { transform: translateX(16px); }

      .cabinet-menu-footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; gap: 8px; }
      .cabinet-menu-btn-wide {
        appearance: none; width: 100%; height: 48px; border-radius: 14px;
        background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06);
        color: rgba(255, 255, 255, 0.8); cursor: pointer;
        font: 900 10px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.1em;
        transition: all 150ms ease;
      }
      .cabinet-menu-btn-wide:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }

      /* Disc Selector Submenu */
      .cabinet-disc-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 10px;
      }
      .cabinet-disc-item {
        justify-content: flex-start !important;
        padding-left: 16px !important;
      }

      /* Forced Menu Hide for Default EmulatorJS */
      #emulator-parent > div[style*="z-index: 1001"],
      .ejs-menu, .ejs-overlay, div[class*="overlay-menu"] {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }

      /* In-game Toast */
      .cabinet-toast {
        position: fixed;
        z-index: 1000000;
        top: 24px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        border-radius: 99px;
        background: rgba(236, 72, 153, 0.95);
        color: white;
        font: 900 11px ui-monospace, monospace;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        opacity: 0;
        pointer-events: none;
        transition: all 200ms ease;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      }
      .cabinet-toast.show { opacity: 1; transform: translateX(-50%) translateY(10px); }

      /* Netplay Ping Indicator */
      .cabinet-netplay-status {
        position: fixed;
        z-index: 999999;
        top: max(12px, env(safe-area-inset-top));
        right: max(12px, env(safe-area-inset-right));
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 99px;
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(12px);
        font: 900 10px ui-monospace, monospace;
        color: #f8fafc;
        opacity: 0;
        transition: opacity 300ms ease;
      }
      .cabinet-netplay-status.is-active { opacity: 1; }
      .cabinet-ping-dot { width: 6px; height: 6px; border-radius: 999px; background: #22c55e; }
      .cabinet-ping-dot.laggy { background: #eab308; }
      .cabinet-ping-dot.slow { background: #ef4444; }

      #game { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; }
      
      /* Force-hide any default EmulatorJS UI elements that might leak through */
      .ejs-virtual-gamepad, 
      #emulator-parent > div[style*="z-index: 1000"],
      div[class*="virtual-gamepad"],
      #virtual-gamepad,
      .ejs-vpad,
      [id*="virtual-gamepad"],
      canvas + div { 
        display: none !important; 
        opacity: 0 !important; 
        pointer-events: none !important; 
        visibility: hidden !important;
      }
      
      /* Filter Overlays (on #game container) */
      #game.filter-crt canvas { filter: contrast(1.1) brightness(0.9) saturate(1.1); }
      #game.filter-crt::after {
        content: ""; pointer-events: none; position: absolute; inset: 0; z-index: 10;
        background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
        background-size: 100% 3px, 3px 100%;
      }
      #game.filter-scanlines canvas { filter: brightness(0.85); }
      #game.filter-scanlines::after {
        content: ""; pointer-events: none; position: absolute; inset: 0; z-index: 10;
        background: linear-gradient(transparent 50%, rgba(0,0,0,0.2) 50%);
        background-size: 100% 2px;
      }
      #game.filter-smooth canvas { image-rendering: auto !important; filter: blur(0.4px) brightness(1.05); }

      .cabinet-launch-overlay {
        position: fixed;
        z-index: 999998;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        color: #f8fafc;
        transition: opacity 300ms ease;
      }
      .cabinet-launch-overlay.is-hidden { opacity: 0; visibility: hidden; }
      .cabinet-launch-card {
        width: 300px;
        text-align: center;
      }
      .cabinet-progress-track { width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); overflow: hidden; margin: 20px 0; }
      .cabinet-progress-bar { width: 0%; height: 100%; background: #ec4899; transition: width 200ms ease; }

      /* Virtual Gamepad Layout & Styling */
      .virtual-pad {
        position: fixed;
        z-index: 999997;
        inset: 0;
        pointer-events: none;
        opacity: 0;
        transition: opacity 250ms ease;
        opacity: var(--vpad-opacity);
      }
      .virtual-pad.is-visible { opacity: var(--vpad-opacity); }
      .virtual-pad button {
        appearance: none;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: calc(66px * var(--vpad-scale));
        min-height: calc(66px * var(--vpad-scale));
        border: 1px solid rgba(255, 255, 255, 0.35);
        border-radius: 999px;
        background:
          radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 80%),
          rgba(15, 15, 22, 0.75);
        color: #fff;
        box-shadow:
          0 10px 25px rgba(0, 0, 0, 0.5),
          inset 0 1px 1px rgba(255, 255, 255, 0.2),
          inset 0 -2px 5px rgba(0, 0, 0, 0.3);
        font: 900 calc(15px * var(--vpad-scale)) ui-monospace, SFMono-Regular, monospace;
        letter-spacing: 0.02em;
        text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        transition: transform 80ms cubic-bezier(0.2, 0, 0, 1), background 120ms ease, box-shadow 80ms ease;
      }
      .virtual-pad button.is-pressed,
      .virtual-pad button:active {
        background:
          radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.4), rgba(236, 72, 153, 0.15)),
          rgba(10, 10, 15, 0.85);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), inset 0 2px 10px rgba(0, 0, 0, 0.4);
        transform: scale(0.94) translateY(2px);
        transition: transform 40ms ease;
      }
      
      .vpad-dpad { position: absolute; left: max(32px, env(safe-area-inset-left)); bottom: max(32px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(3, calc(68px * var(--vpad-scale))); grid-template-rows: repeat(3, calc(68px * var(--vpad-scale))); gap: 2px; filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6)); }
      .vpad-dpad button { border-radius: 8px; min-width: calc(68px * var(--vpad-scale)); min-height: calc(68px * var(--vpad-scale)); background: rgba(20, 20, 25, 0.85); border-color: rgba(255,255,255,0.15); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); }
      .vpad-dpad .up { grid-column: 2; grid-row: 1; border-radius: 16px 16px 4px 4px; border-bottom: none; }
      .vpad-dpad .left { grid-column: 1; grid-row: 2; border-radius: 16px 4px 4px 16px; border-right: none; }
      .vpad-dpad .right { grid-column: 3; grid-row: 2; border-radius: 4px 16px 16px 4px; border-left: none; }
      .vpad-dpad .down { grid-column: 2; grid-row: 3; border-radius: 4px 4px 16px 16px; border-top: none; }
      .vpad-dpad-core { grid-column: 2; grid-row: 2; background: rgba(15, 15, 20, 0.9); border: 1px solid rgba(255,255,255,0.05); }

      .vpad-face { position: absolute; right: max(32px, env(safe-area-inset-right)); bottom: max(32px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(3, calc(72px * var(--vpad-scale))); grid-template-rows: repeat(3, calc(72px * var(--vpad-scale))); gap: 6px; }
      .vpad-face button { border-radius: 999px; width: calc(72px * var(--vpad-scale)); height: calc(72px * var(--vpad-scale)); }
      .vpad-face .y { grid-column: 1; grid-row: 2; }
      .vpad-face .x { grid-column: 2; grid-row: 1; }
      .vpad-face .b { grid-column: 2; grid-row: 3; }
      .vpad-face .a { grid-column: 3; grid-row: 2; }

      .vpad-shoulders { position: absolute; top: 12px; left: max(20px, env(safe-area-inset-left)); right: max(20px, env(safe-area-inset-right)); display: flex; justify-content: space-between; }
      .vpad-shoulders button { width: min(30vw, calc(160px * var(--vpad-scale))); height: calc(52px * var(--vpad-scale)); border-radius: 20px; font-size: calc(12px * var(--vpad-scale)); background: rgba(255, 255, 255, 0.08); backdrop-filter: blur(10px); }

      .vpad-system { position: absolute; left: 50%; bottom: max(32px, env(safe-area-inset-bottom)); transform: translateX(-50%); display: flex; gap: 24px; }
      .vpad-system button { width: calc(90px * var(--vpad-scale)); height: calc(32px * var(--vpad-scale)); border-radius: 999px; font-size: calc(9px * var(--vpad-scale)); font-weight: 900; background: rgba(255, 255, 255, 0.05); border-color: rgba(255,255,255,0.1); transform: rotate(-15deg); }

      /* ── SNES THEME (High Gloss) ── */
      body[data-system="snes"] .vpad-face button {
        background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.4) 0%, transparent 60%);
      }
      body[data-system="snes"] .vpad-face .a { background-color: rgba(220, 38, 38, 0.8) !important; border-color: #ef4444 !important; }
      body[data-system="snes"] .vpad-face .b { background-color: rgba(202, 138, 4, 0.8) !important; border-color: #facc15 !important; }
      body[data-system="snes"] .vpad-face .x { background-color: rgba(37, 99, 235, 0.8) !important; border-color: #60a5fa !important; box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 10px 25px rgba(0,0,0,0.5); }
      body[data-system="snes"] .vpad-face .y { background-color: rgba(22, 163, 74, 0.8) !important; border-color: #4ade80 !important; box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 10px 25px rgba(0,0,0,0.5); }
      
      @media (max-width: 768px) {
        .vpad-dpad { grid-template-columns: repeat(3, calc(58px * var(--vpad-scale))); grid-template-rows: repeat(3, calc(58px * var(--vpad-scale))); left: 20px; bottom: 20px; }
        .vpad-face { grid-template-columns: repeat(3, calc(62px * var(--vpad-scale))); grid-template-rows: repeat(3, calc(62px * var(--vpad-scale))); right: 20px; bottom: 20px; }
        .vpad-dpad button, .vpad-face button { min-width: calc(58px * var(--vpad-scale)); min-height: calc(58px * var(--vpad-scale)); width: calc(62px * var(--vpad-scale)); height: calc(62px * var(--vpad-scale)); }
      }
    </style>
  </head>
  <body data-system="${safeSystem}">
    <button type="button" class="cabinet-menu-button" id="cabinet-menu-toggle">Menu</button>
    <div class="cabinet-menu-backdrop" id="cabinet-menu-backdrop"></div>

    <div class="cabinet-netplay-status" id="cabinet-netplay-status">
      <div class="cabinet-ping-dot" id="cabinet-ping-dot"></div>
      <span id="cabinet-ping-text">-- ms</span>
    </div>
    
    <div class="cabinet-menu-panel" id="cabinet-menu-panel">
      <div class="cabinet-menu-card">
        <div class="cabinet-menu-header">
           <div class="cabinet-menu-title">Paused</div>
           <div class="cabinet-menu-game">${safeTitle}</div>
        </div>

        <div class="cabinet-menu-grid">
           <button type="button" class="cabinet-menu-tile primary" id="cabinet-resume">
              <i>▶</i><span>Resume</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-restart">
              <i>↺</i><span>Restart</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-save">
              <i>💾</i><span>Save</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-load">
              <i>🎮</i><span>Load</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-warp-open">
              <i>✨</i><span>Warp</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-pad-toggle">
              <i>📱</i><span>Pad</span>
           </button>
        </div>

        <div class="cabinet-menu-section-label">Handheld Settings</div>
        <div class="space-y-4">
           <div class="cabinet-setting-row">
              <span class="cabinet-setting-label">Button Size</span>
              <div class="cabinet-setting-control">
                 <input type="range" id="cabinet-set-vpad-scale" min="0.5" max="1.5" step="0.05" value="1" />
              </div>
           </div>
           <div class="cabinet-setting-row">
              <span class="cabinet-setting-label">Opacity</span>
              <div class="cabinet-setting-control">
                 <input type="range" id="cabinet-set-vpad-opacity" min="0.1" max="1" step="0.05" value="1" />
              </div>
           </div>
           <div class="cabinet-setting-row">
              <span class="cabinet-setting-label">HD Mode (Upscale)</span>
              <input type="checkbox" class="cabinet-toggle" id="cabinet-set-hd" />
           </div>
        </div>

        <div class="cabinet-menu-footer">
           <button type="button" class="cabinet-menu-btn-wide" id="cabinet-filter-cycle">📺 Cycle Visuals</button>
           <button type="button" class="cabinet-menu-btn-wide danger" id="cabinet-exit">✕ Exit Game</button>
        </div>
      </div>
    </div>

    <section class="cabinet-save-panel" id="cabinet-warp-panel" style="display:none; position:fixed; inset:0; z-index:1000000; background:rgba(0,0,0,0.9); backdrop-filter:blur(10px); align-items:center; justify-content:center;">
       <div style="width:min(90vw, 400px); background:#0a0a0f; border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:32px; text-align:center;">
          <div class="cabinet-menu-label" style="margin-bottom:20px;">Warp Hand-off</div>
          <div id="cabinet-warp-qr" style="margin:0 auto 20px; background:#fff; padding:10px; border-radius:12px; width:220px; height:220px;"></div>
          <p style="font-size:11px; color:rgba(255,255,255,0.5); line-height:1.6; margin-bottom:24px;">Scan with your phone to pick up exactly where you left off. Make sure you're logged into Home Assistant on your phone!</p>
          <button type="button" id="cabinet-warp-close" style="appearance:none; width:100%; padding:14px; border-radius:12px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; font:900 10px ui-monospace,monospace; text-transform:uppercase; cursor:pointer;">Back to Menu</button>
       </div>
    </section>

    <div class="cabinet-launch-overlay" id="cabinet-launch-overlay">
      <div class="cabinet-launch-card">
        <div class="cabinet-menu-label">Booting Core</div>
        <p style="font-weight:900; letter-spacing:0.1em; text-transform:uppercase; margin-top:8px;">${safeTitle}</p>
        <div class="cabinet-progress-track"><div class="cabinet-progress-bar" id="cabinet-progress-bar"></div></div>
        <p id="cabinet-launch-status" style="font-size:9px; opacity:0.4; text-transform:uppercase; letter-spacing:0.1em;">Initializing...</p>
      </div>
    </div>

    <div class="virtual-pad" id="cabinet-vpad">
      <div class="vpad-shoulders">
        <button type="button" data-key="q" data-ejs-input="10">L</button>
        <button type="button" data-key="w" data-ejs-input="11">R</button>
      </div>
      <div class="vpad-system">
        <button type="button" data-key="Shift" data-ejs-input="2">SELECT</button>
        <button type="button" data-key="Enter" data-ejs-input="3">START</button>
      </div>
      <div class="vpad-dpad">
        <button type="button" class="up" data-key="ArrowUp" data-ejs-input="4">↑</button>
        <button type="button" class="left" data-key="ArrowLeft" data-ejs-input="6">←</button>
        <button type="button" class="right" data-key="ArrowRight" data-ejs-input="7">→</button>
        <button type="button" class="down" data-key="ArrowDown" data-ejs-input="5">↓</button>
      </div>
      <div class="vpad-face">
        <button type="button" class="x" data-key="s" data-ejs-input="9">X</button>
        <button type="button" class="y" data-key="a" data-ejs-input="1">Y</button>
        <button type="button" class="b" data-key="z" data-ejs-input="0">B</button>
        <button type="button" class="a" data-key="x" data-ejs-input="8">A</button>
      </div>
    </div>

    <div class="cabinet-toast" id="cabinet-toast"></div>
    <div id="game"></div>

    <script>
      window.CABINET_RETURN_TO = ${safeReturnTo};
    </script>
    <script src="./bootstrap.js${safeQueryString}"></script>
  </body>
</html>`;
}

export function renderEmulatorBootstrap({
  core,
  title,
  gameId,
  romId,
  discs,
  romHash,
  raUsername,
  raToken,
  controlDefaults,
  gamepadBindings,
  controlDefaultsP2,
  gamepadBindingsP2,
  gamepadRumble,
  systemDisplay,
  globalAspectRatio,
  globalShader,
  userId,
  userName,
  profileId,
  cheats,
  biosUrl,
  netplayRole,
  netplayRoom,
  netplaySyncMode,
}: any) {
  return `"use strict";
function cabinetToast(message) {
  var toast = document.querySelector("#cabinet-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(window.__cabinetToastTimer);
  window.__cabinetToastTimer = window.setTimeout(function () {
    toast.classList.remove("show");
  }, 1800);
}

var cabinetLaunchProgress = 0;
var cabinetLaunchTimer = null;
function cabinetSetLaunchProgress(percent, status) {
  cabinetLaunchProgress = Math.max(cabinetLaunchProgress, Math.min(100, percent));
  var bar = document.querySelector("#cabinet-progress-bar");
  var statusText = document.querySelector("#cabinet-launch-status");
  if (bar) bar.style.width = cabinetLaunchProgress + "%";
  if (statusText && status) statusText.textContent = status;
}

function cabinetStartLaunchProgress() {
  cabinetSetLaunchProgress(10, "Booting core...");
  var steps = [
    { at: 30, status: "Fetching ROM data..." },
    { at: 50, status: "Loading EmulatorJS core..." },
    { at: 70, status: "Preparing controls..." },
    { at: 90, status: "Finalizing..." }
  ];
  var index = 0;
  cabinetLaunchTimer = setInterval(function () {
    if (index < steps.length) {
      var step = steps[index++];
      cabinetSetLaunchProgress(step.at, step.status);
    } else {
      clearInterval(cabinetLaunchTimer);
    }
  }, 600);
}

function cabinetFinishLaunchProgress(status) {
  cabinetSetLaunchProgress(100, status || "Ready");
  clearInterval(cabinetLaunchTimer);
  setTimeout(function () {
    var overlay = document.getElementById("cabinet-launch-overlay");
    if (overlay) overlay.classList.add("is-hidden");
  }, 500);
}

cabinetStartLaunchProgress();

var cabinetPressedKeyCounts = {};
var cabinetPressedInputCounts = {};

function cabinetSimulateInput(inputValue, pressed) {
  var emulator = window.EJS_emulator;
  var value = pressed ? 1 : 0;
  if (emulator && emulator.gameManager && typeof emulator.gameManager.simulateInput === "function") {
    emulator.gameManager.simulateInput(0, inputValue, value);
    return true;
  }
  return false;
}

function cabinetPressControl(control, pressed) {
  var inputAttr = control.getAttribute("data-ejs-input");
  var inputValue = inputAttr === null ? null : Number(inputAttr);
  if (inputValue !== null) {
     if (pressed) cabinetSimulateInput(inputValue, true);
     else cabinetSimulateInput(inputValue, false);
  }
}

// ── Virtual Pad Setup ──────────────────────────────────────────────────────

function cabinetSetupVirtualPad() {
  var pad = document.querySelector("#cabinet-vpad");
  var toggle = document.querySelector("#cabinet-pad-toggle");
  var sizeSlider = document.getElementById("cabinet-set-vpad-scale");
  var opacitySlider = document.getElementById("cabinet-set-vpad-opacity");
  
  if (!pad || !toggle) return;

  var touchCapable = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  var visible = touchCapable;

  function setPadVisible(v) {
    visible = v;
    pad.classList.toggle("is-visible", v);
    toggle.setAttribute("aria-pressed", v ? "true" : "false");
    var label = toggle.querySelector("span");
    if (label) label.textContent = v ? "Hide Pad" : "Show Pad";
  }

  // Load customizations
  var savedScale = localStorage.getItem("cabinet_vpad_scale") || "1";
  var savedOpacity = localStorage.getItem("cabinet_vpad_opacity") || "1";
  document.documentElement.style.setProperty("--vpad-scale", savedScale);
  document.documentElement.style.setProperty("--vpad-opacity", savedOpacity);
  if (sizeSlider) sizeSlider.value = savedScale;
  if (opacitySlider) opacitySlider.value = savedOpacity;

  toggle.onclick = function() { setPadVisible(!visible); };

  if (sizeSlider) {
    sizeSlider.oninput = function() {
      document.documentElement.style.setProperty("--vpad-scale", sizeSlider.value);
      localStorage.setItem("cabinet_vpad_scale", sizeSlider.value);
    };
  }
  if (opacitySlider) {
    opacitySlider.oninput = function() {
      document.documentElement.style.setProperty("--vpad-opacity", opacitySlider.value);
      localStorage.setItem("cabinet_vpad_opacity", opacitySlider.value);
    };
  }

  pad.querySelectorAll("button").forEach(function(btn) {
    btn.onpointerdown = function(e) {
      e.preventDefault();
      btn.classList.add("is-pressed");
      cabinetPressControl(btn, true);
      if (btn.setPointerCapture) btn.setPointerCapture(e.pointerId);
    };
    btn.onpointerup = btn.onpointercancel = function(e) {
      e.preventDefault();
      btn.classList.remove("is-pressed");
      cabinetPressControl(btn, false);
    };
  });

  setPadVisible(visible);
}

// ── Unified Menu Logic ──────────────────────────────────────────────────────

function cabinetSetupMenu() {
  var btn = document.getElementById("cabinet-menu-toggle");
  var backdrop = document.getElementById("cabinet-menu-backdrop");
  var panel = document.getElementById("cabinet-menu-panel");
  var resumeBtn = document.getElementById("cabinet-resume");
  var saveBtn = document.getElementById("cabinet-save");
  var loadBtn = document.getElementById("cabinet-load");
  var warpBtn = document.getElementById("cabinet-warp-open");
  var exitBtn = document.getElementById("cabinet-exit");
  var hdToggle = document.getElementById("cabinet-set-hd");

  if (!btn || !panel) return;

  function toggleMenu(open) {
    panel.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open);
    if (window.EJS_emulator) {
       if (open) window.EJS_emulator.pause();
       else window.EJS_emulator.unpause();
    }
  }

  btn.onclick = function() { toggleMenu(!panel.classList.contains("is-open")); };
  backdrop.onclick = function() { toggleMenu(false); };
  resumeBtn.onclick = function() { toggleMenu(false); };
  
  var restartBtn = document.getElementById("cabinet-restart");
  if (restartBtn) {
    restartBtn.onclick = function() {
      if (window.EJS_emulator && typeof window.EJS_emulator.restart === "function") {
        window.EJS_emulator.restart();
        cabinetToast("Game Restarted ↺");
        toggleMenu(false);
      }
    };
  }

  saveBtn.onclick = function() {
    if (!window.EJS_emulator) return;
    window.EJS_emulator.saveState();
    cabinetToast("Game Saved ✨");
    toggleMenu(false);
  };

  loadBtn.onclick = function() {
    if (!window.EJS_emulator) return;
    window.EJS_emulator.loadState();
    cabinetToast("State Loaded 🎮");
    toggleMenu(false);
  };

  exitBtn.onclick = function() {
    if (window.EJS_emulator && typeof window.EJS_emulator.saveState === "function") {
      try { window.EJS_emulator.saveState(0); } catch(e){}
    }
    setTimeout(function() {
      if (window.CABINET_RETURN_TO) window.location.href = window.CABINET_RETURN_TO;
      else window.location.href = "/";
    }, 400);
  };

  // Visual Filter Cycling
  var filterCycleBtn = document.getElementById("cabinet-filter-cycle");
  if (filterCycleBtn) {
    var filters = ["none", "smooth", "crt", "scanlines"];
    var currentFilterIdx = 0;
    filterCycleBtn.onclick = function() {
      currentFilterIdx = (currentFilterIdx + 1) % filters.length;
      var filter = filters[currentFilterIdx];
      var gameEl = document.getElementById("game");
      gameEl.className = ""; 
      if (filter !== "none") gameEl.classList.add("filter-" + filter);
      cabinetToast("Filter: " + filter.toUpperCase());
    };
  }

  // HD Mode / Upscale
  if (hdToggle) {
    var savedHD = localStorage.getItem("cabinet_hd_mode") === "true";
    hdToggle.checked = savedHD;
    hdToggle.onchange = function() {
      localStorage.setItem("cabinet_hd_mode", hdToggle.checked);
      cabinetToast("HD Mode " + (hdToggle.checked ? "ON" : "OFF") + " (Restart game to apply)");
    };
  }

  // Warp Logic
  if (warpBtn) {
    warpBtn.onclick = async function() {
      toggleMenu(false);
      var wPanel = document.getElementById("cabinet-warp-panel");
      if (wPanel) wPanel.style.display = "flex";
      var qr = document.getElementById("cabinet-warp-qr");
      if (qr) qr.innerHTML = '<div style="height:100%; display:flex; align-items:center; justify-content:center; color:#000; font:800 10px monospace;">GENERATING...</div>';
      
      var slot = 9;
      if (window.EJS_emulator) {
         window.EJS_emulator.saveState(slot);
         setTimeout(async function() {
            var url = new URL(window.location.href);
            url.searchParams.set("loadSlot", String(slot));
            url.searchParams.set("warp", "true");
            var response = await fetch("../warp-qr?url=" + encodeURIComponent(url.toString()));
            var data = await response.json();
            if (data.dataUrl && qr) {
              qr.innerHTML = '<img src="'+data.dataUrl+'" style="width:100%; height:auto;" />';
            }
         }, 1500);
      }
    };
  }
  var wClose = document.getElementById("cabinet-warp-close");
  if (wClose) {
    wClose.onclick = function() {
      var wPanel = document.getElementById("cabinet-warp-panel");
      if (wPanel) wPanel.style.display = "none";
      toggleMenu(true);
    };
  }
}

// ── Auto-Resume Logic ───────────────────────────────────────────────────────

var cabinetSaveSlots = [];
var cabinetSaveSlotsFetched = false;

async function cabinetFetchSaveSlots() {
  try {
    var response = await fetch("./save-states");
    if (response.ok) cabinetSaveSlots = await response.json();
  } catch (e) {} finally {
    cabinetSaveSlotsFetched = true;
  }
}

window.EJS_onGameStart = async function () {
  cabinetFinishLaunchProgress("Game ready");
  cabinetSetupVirtualPad();
  
  // Auto-save on exit/hide
  window.addEventListener("beforeunload", function () {
    if (window.EJS_emulator && typeof window.EJS_emulator.saveState === "function") {
      try { window.EJS_emulator.saveState(0); } catch (e) {}
    }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && window.EJS_emulator && typeof window.EJS_emulator.saveState === "function") {
      try { window.EJS_emulator.saveState(0); } catch (e) {}
    }
  });

  // Resume warp if needed
  var params = new URLSearchParams(window.location.search);
  var loadSlot = params.get("loadSlot");
  if (loadSlot) {
    setTimeout(function() {
      if (window.EJS_emulator) window.EJS_emulator.loadState(Number(loadSlot));
      cabinetToast("Warp Complete ✨");
    }, 2500);
    return;
  }

  // ── Auto-Resume ──
  await cabinetFetchSaveSlots();
  var autoSaveSlot = cabinetSaveSlots.find(function(s) { return s.slot === 0; });
  if (autoSaveSlot) {
    setTimeout(function () {
      cabinetToast("Resuming auto-save…");
      if (window.EJS_emulator && typeof window.EJS_emulator.loadState === "function") {
        try { window.EJS_emulator.loadState(0); } catch (_e) {}
      }
    }, 1800);
  }
};

// ── Gamepad Logic ──────────────────────────────────────────────────────────

function cabinetSetupGamepad() {
  var activeGP = null;
  var mapping = { 0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11, 12:12, 13:13, 14:14, 15:15 };

  window.addEventListener("gamepadconnected", function(e) {
    var gp = e.gamepad;
    console.log("[Gamepad] Connected:", gp.id);
    cabinetToast("🎮 " + gp.id.split(" (")[0] + " connected");
    activeGP = gp.index;
    
    var id = gp.id.toLowerCase();
    if (id.indexOf("nintendo") !== -1 || id.indexOf("switch") !== -1) {
      // Nintendo swap: B=1, A=0, Y=3, X=2
      mapping[0] = 1; mapping[8] = 0; mapping[1] = 3; mapping[9] = 2;
    }
  });

  window.addEventListener("gamepaddisconnected", function(e) {
    cabinetToast("🔌 Gamepad disconnected");
    if (activeGP === e.gamepad.index) activeGP = null;
  });

  // Gamepad Bridge: Poll and inject inputs directly into core
  var lastStates = {};
  function pollGamepad() {
    if (activeGP !== null) {
      var gp = navigator.getGamepads()[activeGP];
      if (gp) {
        for (var i = 0; i < gp.buttons.length; i++) {
          var pressed = gp.buttons[i].pressed;
          var retropadIdx = mapping[i] !== undefined ? mapping[i] : i;
          if (pressed !== lastStates[retropadIdx]) {
            cabinetSimulateInput(retropadIdx, pressed);
            lastStates[retropadIdx] = pressed;
          }
        }
        // Handle D-Pad (Axes 6/7 or Buttons 12-15)
        var dpad = [
          { idx: 4, val: gp.buttons[12]?.pressed }, // Up
          { idx: 5, val: gp.buttons[13]?.pressed }, // Down
          { idx: 6, val: gp.buttons[14]?.pressed }, // Left
          { idx: 7, val: gp.buttons[15]?.pressed }  // Right
        ];
        dpad.forEach(function(d) {
           if (d.val !== undefined && d.val !== lastStates[d.idx]) {
             cabinetSimulateInput(d.idx, d.val);
             lastStates[d.idx] = d.val;
           }
        });
      }
    }
    requestAnimationFrame(pollGamepad);
  }
  pollGamepad();
}

cabinetSetupGamepad();
cabinetSetupMenu();

window.EJS_player = "#game";
window.EJS_core = ${JSON.stringify(core)};
window.EJS_gameName = ${JSON.stringify(title)};
window.EJS_gameID = ${JSON.stringify(userId + "_" + gameId)};
${discs?.length > 1 ? `window.EJS_discs = ${JSON.stringify(discs.map((d: any) => ({ fileName: `../${d.id}/file`, label: d.label })))};` : `window.EJS_gameUrl = \"./file\";`}
window.EJS_pathtodata = ingressBase + "/../../emulatorjs/";
${biosUrl ? `window.EJS_biosUrl = ${JSON.stringify(biosUrl)};` : ""}
window.EJS_startOnLoaded = true;
window.EJS_volume = 0.5; // Default volume to prevent AL initialization crash

// ── WebRTC STUN Servers for Netplay ──
window.EJS_iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" }
];

// ── HD Mode Upscale ──
window.EJS_upscale = localStorage.getItem("cabinet_hd_mode") === "true";

// ── Hide built-in UI ──
window.EJS_onMobile = false;
window.EJS_virtualGamepad = false;
window.EJS_gamepad = false;
window.EJS_buttons = {
  play_pause: false, restart: false, mute: false, settings: false, fullscreen: true,
  save_state: false, load_state: false, quick_save: false, quick_load: false
};

// ── Netplay Configuration ──
window.EJS_netplay = ${netplayRoom ? "true" : "false"};
var ingressBase = window.location.pathname.substring(0, window.location.pathname.indexOf("/api/roms"));
window.EJS_netplayUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + ingressBase + "/api/netplay";
${netplayRole ? `window.EJS_netplayRole = ${JSON.stringify(netplayRole)};` : ""}
${netplayRoom ? `window.EJS_netplayRoom = ${JSON.stringify(netplayRoom)};` : ""}
window.EJS_netplayRollback = ${netplaySyncMode === "rollback" ? "true" : "false"};
window.EJS_netplayManualSync = ${netplaySyncMode === "lockstep" ? "true" : "false"};

// ── Netplay Ping Logic ───────────────────────────────────────────────────
(function() {
  if (!${JSON.stringify(netplayRoom)}) return;
  var statusEl = document.getElementById("cabinet-netplay-status");
  var pingDot = document.getElementById("cabinet-ping-dot");
  var pingText = document.getElementById("cabinet-ping-text");
  if (statusEl) statusEl.classList.add("is-active");

  Object.defineProperty(window, "EJS_netplaySocket", {
    configurable: true,
    set: function(ws) {
      this._ejs_ws = ws;
      var oldOnMessage = ws.onmessage;
      ws.onmessage = function(e) {
        try {
          var msg = JSON.parse(e.data);
          if (msg.type === "pong") {
            var rtt = Date.now() - msg.ts;
            if (pingText) pingText.textContent = rtt + " ms";
            if (pingDot) {
              pingDot.className = "cabinet-ping-dot" + (rtt > 150 ? " slow" : (rtt > 80 ? " laggy" : ""));
            }
            return;
          }
        } catch(_e) {}
        if (oldOnMessage) oldOnMessage.apply(this, arguments);
      };
      
      setInterval(function() {
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: "ping", ts: Date.now() }));
        }
      }, 2000);
    },
    get: function() { return this._ejs_ws; }
  });
})();

window.EJS_defaultControls = ${JSON.stringify(buildEjsControls(core, controlDefaults, gamepadBindings, controlDefaultsP2, gamepadBindingsP2))};

var loader = document.createElement("script");
loader.src = ingressBase + "/emulatorjs/loader.js";
document.body.appendChild(loader);
`;
}
