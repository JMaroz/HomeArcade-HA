import { escapeHtml } from "./utils";

/**
 * Renders the High-Performance Emulator Page.
 * Uses the stable EmulatorJS engine with a premium Lemuroid-inspired UI.
 */
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
        width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #000;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
      }
      .cabinet-menu-button {
        position: fixed; z-index: 999999; top: max(12px, env(safe-area-inset-top)); left: max(12px, env(safe-area-inset-left));
        appearance: none; border: 1px solid rgba(255, 255, 255, 0.18); border-radius: 999px;
        background: rgba(5, 5, 7, 0.65); color: #f8fafc; cursor: pointer; font: 800 11px ui-monospace, monospace;
        letter-spacing: 0.14em; min-height: 46px; padding: 0 18px; text-transform: uppercase;
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.42); backdrop-filter: blur(12px); transition: all 180ms ease;
      }
      .cabinet-menu-button:hover, .cabinet-menu-button[aria-expanded="true"] {
        background: rgba(236, 72, 153, 0.36); border-color: rgba(236, 72, 153, 0.78); outline: none;
      }
      .cabinet-menu-backdrop {
        position: fixed; z-index: 999998; inset: 0; background: rgba(0, 0, 0, 0.7);
        opacity: 0; pointer-events: none; transition: opacity 180ms ease, visibility 180ms ease; visibility: hidden; backdrop-filter: blur(4px);
      }
      .cabinet-menu-panel {
        position: fixed; z-index: 999999; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(0, 0, 0, 0.4); backdrop-filter: blur(12px);
        opacity: 0; pointer-events: none; transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1); visibility: hidden;
      }
      .cabinet-menu-panel.is-open { opacity: 1; pointer-events: auto; visibility: visible; }

      .cabinet-menu-card {
        width: min(90vw, 420px); max-height: 90vh; overflow-y: auto;
        background: rgba(15, 15, 20, 0.85); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 32px;
        box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.1);
        padding: 32px; transform: scale(0.9) translateY(20px); transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .cabinet-menu-panel.is-open .cabinet-menu-card { transform: scale(1) translateY(0); }

      .cabinet-menu-header { margin-bottom: 24px; text-align: center; }
      .cabinet-menu-title { font: 900 11px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.3em; color: #ec4899; }
      .cabinet-menu-game { font-size: 16px; font-weight: 900; color: #fff; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .cabinet-menu-section-label { font: 900 9px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255, 255, 255, 0.3); margin: 24px 0 12px; }

      .cabinet-menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .cabinet-menu-tile {
        appearance: none; aspect-ratio: 1 / 0.8; border-radius: 20px; background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08); color: #fff; display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 10px; cursor: pointer; transition: all 150ms ease;
      }
      .cabinet-menu-tile:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.2); transform: translateY(-2px); }
      .cabinet-menu-tile:active { transform: scale(0.95); background: rgba(236, 72, 153, 0.2); border-color: #ec4899; }
      .cabinet-menu-tile.primary { background: rgba(236, 72, 153, 0.15); border-color: rgba(236, 72, 153, 0.4); }

      .cabinet-menu-tile i { font-size: 20px; }
      .cabinet-menu-tile span { font: 900 10px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; }

      /* Settings Controls */
      .cabinet-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
      .cabinet-setting-label { font: 800 10px ui-monospace, monospace; text-transform: uppercase; color: rgba(255, 255, 255, 0.7); }
      .cabinet-setting-control { flex: 1; display: flex; align-items: center; gap: 12px; }
      input[type="range"] { flex: 1; appearance: none; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.1); }
      input[type="range"]::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #ec4899; cursor: pointer; border: 2px solid #fff; }
      .cabinet-toggle { appearance: none; width: 36px; height: 20px; border-radius: 18px; background: rgba(255, 255, 255, 0.1); position: relative; cursor: pointer; transition: background 200ms; }
      .cabinet-toggle::after { content: ""; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform 200ms; }
      .cabinet-toggle:checked { background: #ec4899; }
      .cabinet-toggle:checked::after { transform: translateX(16px); }

      .cabinet-menu-footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; gap: 8px; }
      .cabinet-menu-btn-wide { appearance: none; width: 100%; height: 48px; border-radius: 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.8); cursor: pointer; font: 900 10px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.1em; transition: all 150ms ease; }
      .cabinet-menu-btn-wide:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }

      /* Forced Menu Hide for Default EmulatorJS */
      #emulator-parent > div[style*="z-index: 1001"], .ejs-menu, .ejs-overlay, div[class*="overlay-menu"] {
        display: none !important; opacity: 0 !important; pointer-events: none !important; visibility: hidden !important;
      }

      /* In-game Toast */
      .cabinet-toast { position: fixed; z-index: 1000000; top: 24px; left: 50%; transform: translateX(-50%); padding: 12px 24px; border-radius: 99px; background: rgba(236, 72, 153, 0.95); color: white; font: 900 11px ui-monospace, monospace; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0; pointer-events: none; transition: all 200ms ease; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
      .cabinet-toast.show { opacity: 1; transform: translateX(-50%) translateY(10px); }

      /* Netplay Status */
      .cabinet-netplay-status { position: fixed; z-index: 999999; top: max(12px, env(safe-area-inset-top)); right: max(12px, env(safe-area-inset-right)); display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 99px; background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(255, 255, 255, 0.15); backdrop-filter: blur(12px); font: 900 10px ui-monospace, monospace; color: #f8fafc; opacity: 0; transition: opacity 300ms ease; }
      .cabinet-netplay-status.is-active { opacity: 1; }
      .cabinet-ping-dot { width: 6px; height: 6px; border-radius: 999px; background: #22c55e; }
      .cabinet-ping-dot.laggy { background: #eab308; }
      .cabinet-ping-dot.slow { background: #ef4444; }

      #game { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; }
      .ejs-virtual-gamepad, #emulator-parent > div[style*="z-index: 1000"], div[class*="virtual-gamepad"], #virtual-gamepad, .ejs-vpad, [id*="virtual-gamepad"], canvas + div { display: none !important; opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }

      /* Filters */
      #game.filter-crt canvas { filter: contrast(1.1) brightness(0.9) saturate(1.1); }
      #game.filter-crt::after { content: ""; pointer-events: none; position: absolute; inset: 0; z-index: 10; background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03)); background-size: 100% 3px, 3px 100%; }
      #game.filter-scanlines canvas { filter: brightness(0.85); }
      #game.filter-scanlines::after { content: ""; pointer-events: none; position: absolute; inset: 0; z-index: 10; background: linear-gradient(transparent 50%, rgba(0,0,0,0.2) 50%); background-size: 100% 2px; }
      #game.filter-smooth canvas { image-rendering: auto !important; filter: blur(0.4px) brightness(1.05); }

      .cabinet-launch-overlay { position: fixed; z-index: 999998; inset: 0; display: flex; align-items: center; justify-content: center; background: #000; color: #f8fafc; transition: opacity 300ms ease; }
      .cabinet-launch-overlay.is-hidden { opacity: 0; visibility: hidden; }
      .cabinet-launch-card { width: 300px; text-align: center; }
      .cabinet-progress-track { width: 100%; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.1); overflow: hidden; margin: 20px 0; }
      .cabinet-progress-bar { width: 0%; height: 100%; background: #ec4899; transition: width 200ms ease; }

      /* Virtual Pad */
      .virtual-pad { position: fixed; z-index: 999997; inset: 0; pointer-events: none; opacity: 0; transition: opacity 250ms ease; opacity: var(--vpad-opacity); }
      .virtual-pad.is-visible { opacity: var(--vpad-opacity); }
      .virtual-pad button {
        appearance: none; pointer-events: auto; touch-action: none; user-select: none; -webkit-user-select: none; cursor: pointer; display: flex; align-items: center; justify-content: center;
        min-width: calc(66px * var(--vpad-scale)); min-height: calc(66px * var(--vpad-scale)); border: 1px solid rgba(255, 255, 255, 0.35); border-radius: 999px;
        background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.25) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 80%), rgba(15, 15, 22, 0.75);
        color: #fff; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -2px 5px rgba(0, 0, 0, 0.3);
        font: 900 calc(15px * var(--vpad-scale)) ui-monospace, SFMono-Regular, monospace; letter-spacing: 0.02em; text-shadow: 0 2px 4px rgba(0,0,0,0.5); transition: transform 80ms cubic-bezier(0.2, 0, 0, 1), background 120ms ease, box-shadow 80ms ease;
      }
      .virtual-pad button.is-pressed, .virtual-pad button:active { background: radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.4), rgba(236, 72, 153, 0.15)), rgba(10, 10, 15, 0.85); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.6), inset 0 2px 10px rgba(0, 0, 0, 0.4); transform: scale(0.94) translateY(2px); transition: transform 40ms ease; }
      
      .vpad-dpad { position: absolute; left: max(32px, env(safe-area-inset-left)); bottom: max(32px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: repeat(3, calc(68px * var(--vpad-scale))); grid-template-rows: repeat(3, calc(68px * var(--vpad-scale))); gap: 2px; filter: drop-shadow(0 15px 30px rgba(0,0,0,0.6)); }
      .vpad-dpad button { border-radius: 8px; min-width: calc(68px * var(--vpad-scale)); min-height: calc(68px * var(--vpad-scale)); background: rgba(20, 20, 25, 0.85); border-color: rgba(255,255,255,0.15); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1); }
      .vpad-dpad .up { grid-column: 2; grid-row: 1; border-radius: 16px 16px 4px 4px; }
      .vpad-dpad .left { grid-column: 1; grid-row: 2; border-radius: 16px 4px 4px 16px; }
      .vpad-dpad .right { grid-column: 3; grid-row: 2; border-radius: 4px 16px 16px 4px; }
      .vpad-dpad .down { grid-column: 2; grid-row: 3; border-radius: 4px 4px 16px 16px; }

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

      body[data-system="snes"] .vpad-face button { background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.4) 0%, transparent 60%); }
      body[data-system="snes"] .vpad-face .a { background-color: rgba(220, 38, 38, 0.8) !important; border-color: #ef4444 !important; }
      body[data-system="snes"] .vpad-face .b { background-color: rgba(202, 138, 4, 0.8) !important; border-color: #facc15 !important; }
      body[data-system="snes"] .vpad-face .x { background-color: rgba(37, 99, 235, 0.8) !important; border-color: #60a5fa !important; box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 10px 25px rgba(0,0,0,0.5); }
      body[data-system="snes"] .vpad-face .y { background-color: rgba(22, 163, 74, 0.8) !important; border-color: #4ade80 !important; box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 10px 25px rgba(0,0,0,0.5); }
      
      @media (max-width: 768px) {
        .vpad-dpad { left: 20px; bottom: 20px; }
        .vpad-face { right: 20px; bottom: 20px; }
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
           <button type="button" class="cabinet-menu-tile primary" id="cabinet-resume"><i>▶</i><span>Resume</span></button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-restart"><i>↺</i><span>Restart</span></button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-save"><i>💾</i><span>Save</span></button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-load"><i>🎮</i><span>Load</span></button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-warp-open"><i>✨</i><span>Warp</span></button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-pad-toggle"><i>📱</i><span>Pad</span></button>
        </div>

        <div class="cabinet-menu-section-label">Handheld Settings</div>
        <div class="space-y-4">
           <div class="cabinet-setting-row">
              <span class="cabinet-setting-label">Button Size</span>
              <div class="cabinet-setting-control"><input type="range" id="cabinet-set-vpad-scale" min="0.5" max="1.5" step="0.05" value="1" /></div>
           </div>
           <div class="cabinet-setting-row">
              <span class="cabinet-setting-label">Opacity</span>
              <div class="cabinet-setting-control"><input type="range" id="cabinet-set-vpad-opacity" min="0.1" max="1" step="0.05" value="1" /></div>
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
        <button type="button" data-ejs-input="10">L</button>
        <button type="button" data-ejs-input="11">R</button>
      </div>
      <div class="vpad-system">
        <button type="button" data-ejs-input="2">SELECT</button>
        <button type="button" data-ejs-input="3">START</button>
      </div>
      <div class="vpad-dpad">
        <button type="button" class="up" data-ejs-input="4">↑</button>
        <button type="button" class="left" data-ejs-input="6">←</button>
        <button type="button" class="right" data-ejs-input="7">→</button>
        <button type="button" class="down" data-ejs-input="5">↓</button>
      </div>
      <div class="vpad-face">
        <button type="button" class="x" data-ejs-input="9">X</button>
        <button type="button" class="y" data-ejs-input="1">Y</button>
        <button type="button" class="b" data-ejs-input="0">B</button>
        <button type="button" class="a" data-ejs-input="8">A</button>
      </div>
    </div>

    <div class="cabinet-toast" id="cabinet-toast"></div>
    <div id="game"></div>

    <script>
      (function() {
        var path = window.location.pathname;
        var apiIdx = path.indexOf("/api/roms");
        var base = apiIdx !== -1 ? path.substring(0, apiIdx) : "";
        window.CABINET_INGRESS_BASE = base;
        window.CABINET_RETURN_TO = ${safeReturnTo};
        
        var baseTag = document.createElement("base");
        baseTag.href = base + "/";
        document.head.appendChild(baseTag);
        
        // Use timeout to ensure body is ready for appendChild
        setTimeout(function() {
          var script = document.createElement("script");
          var romIdMatch = path.match(/\\/api\\/roms\\/(\\d+)\\//);
          var romId = romIdMatch ? romIdMatch[1] : "";
          script.src = base + "/api/roms/" + romId + "/bootstrap.js" + window.location.search;
          document.body.appendChild(script);
        }, 0);
      })();
    </script>
  </body>
</html>`;
}

export function renderEmulatorBootstrap({
  core, title, gameId, romId, discs, romHash, userId, userName, profileId, biosUrl, netplayRole, netplayRoom, netplaySyncMode, controlDefaults, gamepadBindings, controlDefaultsP2, gamepadBindingsP2
}: any) {
  const ejsDiscs = discs?.length > 1 
    ? `window.EJS_discs = ${JSON.stringify(discs.map((d: any) => ({ fileName: '../' + d.id + '/file', label: d.label })))};`
    : `window.EJS_gameUrl = "./file";`;

  return `"use strict";
function cabinetToast(message) {
  var toast = document.querySelector("#cabinet-toast");
  if (!toast) return;
  toast.textContent = message; toast.classList.add("show");
  window.clearTimeout(window.__cabinetToastTimer);
  window.__cabinetToastTimer = window.setTimeout(function () { toast.classList.remove("show"); }, 1800);
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
    { at: 50, status: "Loading Emulator engine..." },
    { at: 70, status: "Preparing controls..." },
    { at: 90, status: "Finalizing..." }
  ];
  var index = 0;
  cabinetLaunchTimer = setInterval(function () {
    if (index < steps.length) {
      var step = steps[index++]; cabinetSetLaunchProgress(step.at, step.status);
    } else { clearInterval(cabinetLaunchTimer); }
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

function cabinetSimulateInput(inputValue, pressed) {
  var emulator = window.EJS_emulator;
  var value = pressed ? 1 : 0;
  if (emulator && emulator.gameManager && typeof emulator.gameManager.simulateInput === "function") {
    emulator.gameManager.simulateInput(0, inputValue, value);
    return true;
  }
  return false;
}

function cabinetSetupVirtualPad() {
  var pad = document.querySelector("#cabinet-vpad");
  var toggle = document.querySelector("#cabinet-pad-toggle");
  var sizeSlider = document.getElementById("cabinet-set-vpad-scale");
  var opacitySlider = document.getElementById("cabinet-set-vpad-opacity");
  if (!pad || !toggle) return;
  var visible = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  function setPadVisible(v) {
    visible = v;
    pad.classList.toggle("is-visible", v);
    toggle.setAttribute("aria-pressed", v ? "true" : "false");
  }

  var savedScale = localStorage.getItem("cabinet_vpad_scale") || "1";
  var savedOpacity = localStorage.getItem("cabinet_vpad_opacity") || "1";
  document.documentElement.style.setProperty("--vpad-scale", savedScale);
  document.documentElement.style.setProperty("--vpad-opacity", savedOpacity);
  if (sizeSlider) sizeSlider.value = savedScale;
  if (opacitySlider) opacitySlider.value = savedOpacity;

  toggle.onclick = function() { setPadVisible(!visible); };
  if (sizeSlider) sizeSlider.oninput = function() {
    document.documentElement.style.setProperty("--vpad-scale", sizeSlider.value);
    localStorage.setItem("cabinet_vpad_scale", sizeSlider.value);
  };
  if (opacitySlider) opacitySlider.oninput = function() {
    document.documentElement.style.setProperty("--vpad-opacity", opacitySlider.value);
    localStorage.setItem("cabinet_vpad_opacity", opacitySlider.value);
  };

  pad.querySelectorAll("button").forEach(function(btn) {
    btn.onpointerdown = function(e) {
      e.preventDefault(); btn.classList.add("is-pressed");
      var input = Number(btn.getAttribute("data-ejs-input"));
      cabinetSimulateInput(input, true);
      if (btn.setPointerCapture) btn.setPointerCapture(e.pointerId);
    };
    btn.onpointerup = btn.onpointercancel = function(e) {
      e.preventDefault(); btn.classList.remove("is-pressed");
      var input = Number(btn.getAttribute("data-ejs-input"));
      cabinetSimulateInput(input, false);
    };
  });
  setPadVisible(visible);
}

function cabinetSetupMenu() {
  var btn = document.getElementById("cabinet-menu-toggle");
  var backdrop = document.getElementById("cabinet-menu-backdrop");
  var panel = document.getElementById("cabinet-menu-panel");
  var hdToggle = document.getElementById("cabinet-set-hd");
  if (!btn || !panel) return;

  function toggleMenu(open) {
    panel.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    if (window.EJS_emulator) {
       if (open) window.EJS_emulator.pause(); else window.EJS_emulator.unpause();
    }
  }

  btn.onclick = function() { toggleMenu(!panel.classList.contains("is-open")); };
  backdrop.onclick = function() { toggleMenu(false); };
  document.getElementById("cabinet-resume").onclick = function() { toggleMenu(false); };
  document.getElementById("cabinet-restart").onclick = function() { 
    if (window.EJS_emulator) { window.EJS_emulator.restart(); cabinetToast("Restarted ↺"); toggleMenu(false); }
  };
  document.getElementById("cabinet-save").onclick = function() { if (window.EJS_emulator) { window.EJS_emulator.saveState(); cabinetToast("Saved ✨"); toggleMenu(false); } };
  document.getElementById("cabinet-load").onclick = function() { if (window.EJS_emulator) { window.EJS_emulator.loadState(); cabinetToast("Loaded 🎮"); toggleMenu(false); } };
  document.getElementById("cabinet-exit").onclick = function() { window.location.href = window.CABINET_RETURN_TO || "/"; };

  if (hdToggle) {
    hdToggle.checked = localStorage.getItem("cabinet_hd_mode") === "true";
    hdToggle.onchange = function() { localStorage.setItem("cabinet_hd_mode", hdToggle.checked); cabinetToast("HD Mode Updated"); };
  }
}

function cabinetSetupGamepad() {
  var activeGP = null;
  window.addEventListener("gamepadconnected", function(e) { cabinetToast("🎮 Controller Connected"); activeGP = e.gamepad.index; });
  var lastStates = {};
  function poll() {
    if (activeGP !== null) {
      var gp = navigator.getGamepads()[activeGP];
      if (gp) {
        for (var i = 0; i < gp.buttons.length; i++) {
          var p = gp.buttons[i].pressed;
          if (p !== lastStates[i]) { cabinetSimulateInput(i, p); lastStates[i] = p; }
        }
      }
    }
    requestAnimationFrame(poll);
  }
  poll();
}

window.EJS_onGameStart = function () {
  cabinetFinishLaunchProgress();
  cabinetSetupVirtualPad();
  cabinetSetupGamepad();
  
  fetch("./save-states").then(r => r.json()).then(slots => {
    var auto = slots.find(s => s.slot === 0);
    if (auto && window.EJS_emulator) {
       setTimeout(() => { cabinetToast("Auto-Resuming..."); window.EJS_emulator.loadState(0); }, 1500);
    }
  });
};

cabinetSetupMenu();

window.EJS_player = "#game";
window.EJS_core = ${JSON.stringify(core)};
window.EJS_gameName = ${JSON.stringify(title)};
window.EJS_gameID = ${JSON.stringify(userId + "_" + gameId)};
${ejsDiscs}

window.EJS_pathtodata = window.CABINET_INGRESS_BASE + "/api/emulatorjs/";
window.EJS_startOnLoaded = true;
window.EJS_volume = 0.5;
window.EJS_onMobile = false;
window.EJS_virtualGamepad = false;
window.EJS_gamepad = false;
window.EJS_buttons = { play_pause: false, restart: false, mute: false, settings: false, fullscreen: true, save_state: false, load_state: false, quick_save: false, quick_load: false };

var loader = document.createElement("script");
loader.src = window.EJS_pathtodata + "loader.js";
document.body.appendChild(loader);
`;
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
