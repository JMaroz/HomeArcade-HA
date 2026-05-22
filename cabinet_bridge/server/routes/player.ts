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
  0: "0", 1: "2", 2: "8", 3: "9",
  4: "12", 5: "13", 6: "14", 7: "15",
  8: "1", 9: "3", 10: "4", 11: "5",
  12: "6", 13: "7", 14: "10", 15: "11",
};

function buildPlayerControls(
  core: string,
  customKeys: Record<number, string>,
  gamepadBindings: Record<number, number> = {},
): Record<number, { value: string; value2?: string }> {
  const isPS = ["psx", "pcsx2", "ppsspp"].includes(core);
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
  const custom: Record<number, string> = {};
  for (const [k, v] of Object.entries(controlDefaults[core] ?? {})) {
    custom[Number(k)] = v;
  }
  const p1 = buildPlayerControls(core, custom, gamepadBindings);
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

export function renderEmulatorPage({ title, returnTo, romHash, queryString }: { title: string; returnTo: string; romHash: string | null; queryString?: string }) {
  const safeTitle = escapeHtml(title);
  const safeReturnTo = JSON.stringify(returnTo);
  const safeQueryString = queryString || "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${safeTitle} · HomeArcade</title>
    <style>
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
        top: max(70px, calc(env(safe-area-inset-top) + 64px));
        left: max(12px, env(safe-area-inset-left));
        width: min(92vw, 400px);
        max-height: min(85vh, calc(100dvh - 90px));
        overflow-y: auto;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        background: rgba(10, 10, 15, 0.95);
        box-shadow: 0 30px 100px rgba(0, 0, 0, 0.8);
        opacity: 0;
        pointer-events: none;
        transform: translateY(-10px) scale(0.98);
        transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
        visibility: hidden;
        backdrop-filter: blur(20px);
      }
      .cabinet-menu-panel.is-open,
      .cabinet-menu-backdrop.is-open {
        opacity: 1;
        pointer-events: auto;
        visibility: visible;
      }
      .cabinet-menu-panel.is-open {
        transform: translateY(0) scale(1);
      }
      .cabinet-menu-section {
        padding: 16px 20px;
      }
      .cabinet-menu-section + .cabinet-menu-section {
        border-top: 1px solid rgba(255, 255, 255, 0.06);
      }
      .cabinet-menu-label {
        color: rgba(255, 255, 255, 0.35);
        font: 900 9px ui-monospace, monospace;
        letter-spacing: 0.2em;
        text-transform: uppercase;
        margin-bottom: 12px;
      }
      .cabinet-menu-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 8px;
      }
      .cabinet-menu-panel button {
        appearance: none;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.9);
        cursor: pointer;
        font: 800 10px ui-monospace, monospace;
        letter-spacing: 0.1em;
        min-height: 48px;
        padding: 10px;
        text-transform: uppercase;
        transition: all 150ms ease;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 8px;
      }
      .cabinet-menu-panel button:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
      }
      .cabinet-menu-panel button[aria-pressed="true"] {
        background: rgba(236, 72, 153, 0.3);
        border-color: rgba(236, 72, 153, 0.7);
        color: #fff;
        box-shadow: 0 0 15px rgba(236, 72, 153, 0.2);
      }
      .cabinet-menu-panel button.primary {
        background: rgba(236, 72, 153, 0.4);
        border-color: rgba(236, 72, 153, 0.6);
        color: #fff;
      }
      .cabinet-menu-panel button.danger:hover {
        background: rgba(239, 68, 68, 0.2);
        border-color: rgba(239, 68, 68, 0.5);
      }
      .cabinet-menu-panel .full-width {
        grid-column: 1 / -1;
      }

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

      #game { width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; background: #000; }
      
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
    </style>
  </head>
  <body>
    <button type="button" class="cabinet-menu-button" id="cabinet-menu-toggle">Menu</button>
    <div class="cabinet-menu-backdrop" id="cabinet-menu-backdrop"></div>
    
    <nav class="cabinet-menu-panel" id="cabinet-menu-panel">
      <!-- Game Section -->
      <div class="cabinet-menu-section">
        <div class="cabinet-menu-label">Game Controls</div>
        <div class="cabinet-menu-grid">
          <button type="button" id="cabinet-resume" class="primary full-width">Resume Game</button>
          <button type="button" id="cabinet-save">Save State</button>
          <button type="button" id="cabinet-load">Load State</button>
        </div>
      </div>

      <!-- Disc Swap Section -->
      <div class="cabinet-menu-section" id="cabinet-disc-section" style="display:none;">
        <div class="cabinet-menu-label">CD Console Controls</div>
        <button type="button" class="full-width" id="cabinet-disc-toggle">💿 Swap Disc...</button>
        <div id="cabinet-disc-list" class="cabinet-disc-list" style="display:none;"></div>
      </div>

      <!-- Visuals Section -->
      <div class="cabinet-menu-section">
        <div class="cabinet-menu-label">Visual Filters</div>
        <div class="cabinet-menu-grid">
          <button type="button" class="cabinet-filter-btn" data-filter="none" aria-pressed="true">Raw</button>
          <button type="button" class="cabinet-filter-btn" data-filter="smooth">Smooth</button>
          <button type="button" class="cabinet-filter-btn" data-filter="crt">CRT</button>
          <button type="button" class="cabinet-filter-btn" data-filter="scanlines">Scanlines</button>
        </div>
      </div>

      <!-- System Section -->
      <div class="cabinet-menu-section">
        <div class="cabinet-menu-label">System</div>
        <div class="cabinet-menu-grid">
          <button type="button" id="cabinet-warp-open" class="full-width">✨ Warp Link (QR)</button>
          <button type="button" id="cabinet-exit" class="danger full-width">Exit Game</button>
        </div>
      </div>
    </nav>

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
  netplayUrl,
  netplayRole,
  netplayRoom,
}: any) {
  return `"use strict";
function cabinetToast(msg) {
  var t = document.querySelector("#cabinet-toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(function() { t.classList.remove("show"); }, 2500);
}

var cabinetLaunchProgress = 0;
function cabinetSetLaunchProgress(percent, status) {
  cabinetLaunchProgress = Math.max(cabinetLaunchProgress, percent);
  var bar = document.querySelector("#cabinet-progress-bar");
  var statusText = document.querySelector("#cabinet-launch-status");
  if (bar) bar.style.width = cabinetLaunchProgress + "%";
  if (statusText) statusText.textContent = status || "Loading...";
}

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

  if (!btn || !panel) return;

  function forceUnpause() {
    if (!window.EJS_emulator) return;
    var emu = window.EJS_emulator;
    console.log("[Menu] Force unpause sequence triggered...");
    
    // Attempt every known resume method sequentially
    try { if (typeof emu.unpause === "function") emu.unpause(); } catch(e){}
    try { if (typeof emu.unPause === "function") emu.unPause(); } catch(e){}
    try { if (typeof emu.resume === "function") emu.resume(); } catch(e){}
    try { if (typeof emu.setPause === "function") emu.setPause(false); } catch(e){}
    try { if (typeof emu.onPause === "function") emu.onPause(false); } catch(e){}
    try { if (emu.gameManager && typeof emu.gameManager.resume === "function") emu.gameManager.resume(); } catch(e){}
    
    // Hard browser-level wake up
    window.dispatchEvent(new Event('resize'));
    var canvas = document.querySelector("#game canvas");
    if (canvas) {
       canvas.focus();
       // Satisfy browser interaction requirements
       canvas.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
       canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
       canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }

  function toggleMenu(open) {
    panel.classList.toggle("is-open", open);
    backdrop.classList.toggle("is-open", open);
    btn.setAttribute("aria-expanded", open);
    
    if (window.EJS_emulator) {
       if (open) {
          if (typeof window.EJS_emulator.pause === "function") window.EJS_emulator.pause();
       } else {
          forceUnpause();
       }
    }
  }

  btn.onclick = function() { toggleMenu(!panel.classList.contains("is-open")); };
  backdrop.onclick = function() { toggleMenu(false); };
  resumeBtn.onclick = function() { toggleMenu(false); };
  
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
    if (window.CABINET_RETURN_TO) window.location.href = window.CABINET_RETURN_TO;
    else window.location.href = "/";
  };

  // Visual Filters
  document.querySelectorAll(".cabinet-filter-btn").forEach(function(fBtn) {
    fBtn.onclick = function() {
      var filter = fBtn.getAttribute("data-filter");
      var gameEl = document.getElementById("game");
      gameEl.className = ""; // Clear all
      if (filter !== "none") gameEl.classList.add("filter-" + filter);
      
      document.querySelectorAll(".cabinet-filter-btn").forEach(function(b) { b.setAttribute("aria-pressed", "false"); });
      fBtn.setAttribute("aria-pressed", "true");
      cabinetToast(filter.toUpperCase() + " Enabled");
    };
  });

  // Disc Swapping (Multi-disc)
  var discData = ${JSON.stringify(discs || [])};
  if (discData && discData.length > 1) {
    var discSection = document.getElementById("cabinet-disc-section");
    var discToggle = document.getElementById("cabinet-disc-toggle");
    var discList = document.getElementById("cabinet-disc-list");
    if (discSection) discSection.style.display = "block";
    
    if (discToggle) {
      discToggle.onclick = function() {
        var hidden = discList.style.display === "none";
        discList.style.display = hidden ? "flex" : "none";
      };
    }

    if (discList) {
      discData.forEach(function(disc, idx) {
        var dBtn = document.createElement("button");
        dBtn.className = "cabinet-disc-item";
        dBtn.textContent = "Disc " + (idx + 1) + (disc.label ? ": " + disc.label : "");
        dBtn.onclick = function() {
          if (window.EJS_emulator && window.EJS_emulator.gameManager) {
            window.EJS_emulator.gameManager.changeDisc(idx);
            cabinetToast("Swapped to Disc " + (idx + 1));
            toggleMenu(false);
          }
        };
        discList.appendChild(dBtn);
      });
    }
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

window.EJS_onGameStart = function() {
  cabinetSetLaunchProgress(100, "Ready");
  setTimeout(function() { 
    var overlay = document.getElementById("cabinet-launch-overlay");
    if (overlay) overlay.classList.add("is-hidden"); 
  }, 500);
  
  var params = new URLSearchParams(window.location.search);
  var loadSlot = params.get("loadSlot");
  if (loadSlot) {
    setTimeout(function() {
      if (window.EJS_emulator) window.EJS_emulator.loadState(Number(loadSlot));
      cabinetToast("Warp Complete ✨");
    }, 2500);
  }
};

cabinetSetupMenu();
cabinetSetLaunchProgress(20, "Booting...");

window.EJS_player = "#game";
window.EJS_core = ${JSON.stringify(core)};
window.EJS_gameName = ${JSON.stringify(title)};
window.EJS_gameID = ${JSON.stringify(userId + "_" + gameId)};
${discs?.length > 1 ? `window.EJS_discs = ${JSON.stringify(discs.map((d: any) => ({ fileName: `../${d.id}/file`, label: d.label })))};` : `window.EJS_gameUrl = \"./file\";`}
window.EJS_pathtodata = "../../emulatorjs/";
window.EJS_startOnLoaded = true;

// ── Performance & Quality ──
window.EJS_webgl = true;
window.EJS_fps = true;
window.EJS_threads = ${["psx", "n64", "pcsx2", "ppsspp", "melonds"].includes(core) ? "true" : "false"};
window.EJS_cacheExtensions = true;

// ── Hide built-in UI ──
window.EJS_buttons = {
  play_pause: false,
  restart: false,
  mute: false,
  settings: false,
  fullscreen: true,
  save_state: false,
  load_state: false,
  screen_record: false,
  screenshot: false,
  quick_save: false,
  quick_load: false,
  cheat: false,
  chancge_disc: false
};

// ── Netplay Configuration ──
var pathParts = window.location.pathname.split("/");
var ingressBase = pathParts.slice(0, 4).join("/");
window.EJS_netplayUrl = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + ingressBase + "/api/netplay";
${netplayRole ? `window.EJS_netplayRole = ${JSON.stringify(netplayRole)};` : ""}
${netplayRoom ? `window.EJS_netplayRoom = ${JSON.stringify(netplayRoom)};` : ""}

var loader = document.createElement("script");
loader.src = "../../emulatorjs/loader.js";
document.body.appendChild(loader);
`;
}
