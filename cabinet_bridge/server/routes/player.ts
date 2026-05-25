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
        --vpad-btn-size: 64px;
        --vpad-gap: 4px;
        --vpad-padding: 8px;
      }
      @media (max-width: 480px) {
        :root {
          --vpad-btn-size: 46px;
          --vpad-gap: 2px;
          --vpad-padding: 6px;
        }
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
        background: rgba(11, 11, 18, 0.65); border: 1px solid rgba(255, 255, 255, 0.12); border-radius: 32px;
        box-shadow: 0 40px 100px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.15), 0 0 40px rgba(236, 72, 153, 0.06);
        padding: 32px; transform: scale(0.9) translateY(20px); transition: all 350ms cubic-bezier(0.16, 1, 0.3, 1);
        backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%);
      }
      .cabinet-menu-panel.is-open .cabinet-menu-card { transform: scale(1) translateY(0); }

      .cabinet-menu-header { margin-bottom: 24px; text-align: center; }
      .cabinet-menu-title { font: 900 11px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.3em; color: #ec4899; }
      .cabinet-menu-game { font-size: 16px; font-weight: 900; color: #fff; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .cabinet-menu-section-label { font: 900 9px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255, 255, 255, 0.3); margin: 24px 0 12px; }

      .cabinet-menu-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
      .cabinet-menu-tile {
        appearance: none; aspect-ratio: 1.1 / 1; border-radius: 20px; background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.8); display: flex; flex-direction: column;
        align-items: center; justify-content: center; gap: 12px; cursor: pointer; transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      .cabinet-menu-tile:hover {
        background: rgba(255, 255, 255, 0.06); border-color: rgba(255, 255, 255, 0.18);
        transform: translateY(-3px) scale(1.02); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4), 0 0 15px rgba(255, 255, 255, 0.03);
        color: #fff;
      }
      .cabinet-menu-tile:active { transform: scale(0.96) translateY(0); background: rgba(236, 72, 153, 0.15); border-color: rgba(236, 72, 153, 0.5); }
      .cabinet-menu-tile.primary {
        background: rgba(236, 72, 153, 0.12); border-color: rgba(236, 72, 153, 0.35);
        color: #fff;
      }
      .cabinet-menu-tile.primary:hover {
        background: rgba(236, 72, 153, 0.22); border-color: rgba(236, 72, 153, 0.7);
        box-shadow: 0 12px 30px rgba(236, 72, 153, 0.18), 0 0 15px rgba(236, 72, 153, 0.1);
      }

      .cabinet-menu-tile svg {
        width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2px; stroke-linecap: round; stroke-linejoin: round;
        opacity: 0.8; transition: all 250ms cubic-bezier(0.16, 1, 0.3, 1);
      }
      .cabinet-menu-tile:hover svg {
        opacity: 1; transform: scale(1.1);
      }

      /* SVG Icon animations */
      @keyframes icon-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.18); }
        100% { transform: scale(1); }
      }
      .cabinet-menu-tile:hover svg.icon-resume { animation: icon-pulse 1.2s infinite ease-in-out; }
      .cabinet-menu-tile:hover svg.icon-restart { transform: rotate(-360deg) scale(1.1); }
      @keyframes icon-bounce {
        0%, 100% { transform: translateY(0) scale(1.1); }
        50% { transform: translateY(-3px) scale(1.1); }
      }
      .cabinet-menu-tile:hover svg.icon-save { animation: icon-bounce 1s infinite ease-in-out; }
      @keyframes icon-load-shift {
        0%, 100% { transform: translateY(0) scale(1.1); }
        50% { transform: translateY(3px) scale(1.1); }
      }
      .cabinet-menu-tile:hover svg.icon-load { animation: icon-load-shift 1s infinite ease-in-out; }
      .cabinet-menu-tile:hover svg.icon-saves { transform: scale(1.15); }
      @keyframes icon-spin {
        from { transform: rotate(0deg) scale(1.1); }
        to { transform: rotate(360deg) scale(1.1); }
      }
      .cabinet-menu-tile:hover svg.icon-warp { animation: icon-spin 4s linear infinite; }
      @keyframes icon-shake {
        0%, 100% { transform: rotate(0deg) scale(1.1); }
        25% { transform: rotate(-5deg) scale(1.1); }
        75% { transform: rotate(5deg) scale(1.1); }
      }
      .cabinet-menu-tile:hover svg.icon-pad { animation: icon-shake 0.3s infinite ease-in-out; }

      .cabinet-menu-tile span { font: 900 10px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; }

      /* Settings Controls */
      .cabinet-setting-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }
      .cabinet-setting-label { font: 800 10px ui-monospace, monospace; text-transform: uppercase; color: rgba(255, 255, 255, 0.7); }
      .cabinet-setting-control { flex: 1; display: flex; align-items: center; gap: 12px; }
      input[type="range"] { flex: 1; appearance: none; height: 4px; border-radius: 2px; background: rgba(255, 255, 255, 0.15); }
      input[type="range"]::-webkit-slider-thumb { appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #ec4899; cursor: pointer; border: 2px solid #fff; box-shadow: 0 0 10px rgba(236, 72, 153, 0.5); }
      .cabinet-toggle { appearance: none; width: 36px; height: 20px; border-radius: 18px; background: rgba(255, 255, 255, 0.15); position: relative; cursor: pointer; transition: background 200ms; }
      .cabinet-toggle::after { content: ""; position: absolute; left: 2px; top: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform 200ms; }
      .cabinet-toggle:checked { background: #ec4899; box-shadow: 0 0 10px rgba(236, 72, 153, 0.4); }
      .cabinet-toggle:checked::after { transform: translateX(16px); }

      .cabinet-menu-footer { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; flex-direction: column; gap: 8px; }
      .cabinet-menu-btn-wide { appearance: none; width: 100%; height: 48px; border-radius: 14px; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06); color: rgba(255, 255, 255, 0.8); cursor: pointer; font: 900 10px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.1em; transition: all 150ms ease; }
      .cabinet-menu-btn-wide:hover { background: rgba(255, 255, 255, 0.08); color: #fff; border-color: rgba(255, 255, 255, 0.18); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
      .cabinet-menu-btn-wide.danger:hover { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border-color: rgba(239, 68, 68, 0.35); box-shadow: 0 4px 12px rgba(239, 68, 68, 0.12); }

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
      @media (max-width: 768px) {
        #game { padding-top: 50px; box-sizing: border-box; }
      }
      .ejs-virtual-gamepad, .ejs_virtualGamepad, .ejs_virtual_gamepad, div[class*="virtual-gamepad"], div[class*="virtualGamepad"], div[class*="virtual_gamepad"], #virtual-gamepad, #virtualGamepad, #virtual_gamepad, .ejs-vpad, .ejs_vpad, .ejs_virtualGamepad_open, [id*="virtual-gamepad"], [id*="virtual_gamepad"], [id*="virtualGamepad"] { display: none !important; opacity: 0 !important; pointer-events: none !important; visibility: hidden !important; }

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
        color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.6);
        transition: transform 80ms cubic-bezier(0.2, 0, 0, 1), background 120ms ease, box-shadow 80ms ease;
      }
      .virtual-pad button.is-pressed, .virtual-pad button:active {
        transform: scale(0.92) translateY(1px);
        transition: transform 40ms ease;
      }
      
      .vpad-dpad {
        position: absolute;
        left: max(16px, env(safe-area-inset-left));
        bottom: max(24px, env(safe-area-inset-bottom));
        display: grid;
        grid-template-columns: repeat(3, calc(var(--vpad-btn-size) * var(--vpad-scale)));
        grid-template-rows: repeat(3, calc(var(--vpad-btn-size) * var(--vpad-scale)));
        gap: calc(var(--vpad-gap) * var(--vpad-scale));
        padding: calc(var(--vpad-padding) * var(--vpad-scale));
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 70%, transparent 100%), rgba(15, 15, 20, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: inset 0 4px 12px rgba(255,255,255,0.05), inset 0 -4px 12px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.6);
        backdrop-filter: blur(8px);
      }
      .vpad-dpad button {
        border-radius: calc(6px * var(--vpad-scale));
        min-width: 100%;
        min-height: 100%;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.06);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
        font-size: calc(18px * var(--vpad-scale));
      }
      .vpad-dpad button.is-pressed, .vpad-dpad button:active {
        background: rgba(236, 72, 153, 0.25) !important;
        border-color: rgba(236, 72, 153, 0.5) !important;
      }
      .vpad-dpad .up { grid-column: 2; grid-row: 1; border-radius: calc(10px * var(--vpad-scale)) calc(10px * var(--vpad-scale)) calc(4px * var(--vpad-scale)) calc(4px * var(--vpad-scale)); border-bottom: none; }
      .vpad-dpad .left { grid-column: 1; grid-row: 2; border-radius: calc(10px * var(--vpad-scale)) calc(4px * var(--vpad-scale)) calc(4px * var(--vpad-scale)) calc(10px * var(--vpad-scale)); border-right: none; }
      .vpad-dpad .right { grid-column: 3; grid-row: 2; border-radius: calc(4px * var(--vpad-scale)) calc(10px * var(--vpad-scale)) calc(10px * var(--vpad-scale)) calc(4px * var(--vpad-scale)); border-left: none; }
      .vpad-dpad .down { grid-column: 2; grid-row: 3; border-radius: calc(4px * var(--vpad-scale)) calc(4px * var(--vpad-scale)) calc(10px * var(--vpad-scale)) calc(10px * var(--vpad-scale)); border-top: none; }
      
      .vpad-dpad::after {
        content: "";
        grid-column: 2;
        grid-row: 2;
        background: radial-gradient(circle at 35% 35%, rgba(255,255,255,0.06) 0%, transparent 60%), rgba(20, 20, 25, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1);
        width: 80%;
        height: 80%;
        margin: auto;
        pointer-events: none;
        z-index: 2;
      }

      .vpad-face {
        position: absolute;
        right: max(16px, env(safe-area-inset-right));
        bottom: max(24px, env(safe-area-inset-bottom));
        display: grid;
        grid-template-columns: repeat(3, calc(var(--vpad-btn-size) * var(--vpad-scale)));
        grid-template-rows: repeat(3, calc(var(--vpad-btn-size) * var(--vpad-scale)));
        gap: calc(var(--vpad-gap) * var(--vpad-scale));
        padding: calc(var(--vpad-padding) * var(--vpad-scale));
        border-radius: 50%;
        background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 70%, transparent 100%), rgba(15, 15, 20, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: inset 0 4px 12px rgba(255,255,255,0.05), inset 0 -4px 12px rgba(0,0,0,0.4), 0 12px 32px rgba(0,0,0,0.6);
        backdrop-filter: blur(8px);
      }
      .vpad-face button {
        border-radius: 50%;
        width: 100%;
        height: 100%;
        font-size: calc(16px * var(--vpad-scale));
        font-weight: 900;
        background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.15) 0%, transparent 60%), rgba(20, 20, 25, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.15);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.15);
      }
      .vpad-face button.is-pressed, .vpad-face button:active {
        background: radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.4), rgba(236, 72, 153, 0.15)), rgba(10, 10, 15, 0.85);
        border-color: rgba(236, 72, 153, 0.5);
      }
      .vpad-face .y { grid-column: 1; grid-row: 2; }
      .vpad-face .x { grid-column: 2; grid-row: 1; }
      .vpad-face .b { grid-column: 2; grid-row: 3; }
      .vpad-face .a { grid-column: 3; grid-row: 2; }

      .vpad-shoulders {
        position: absolute;
        bottom: calc(((var(--vpad-btn-size) * 3 + var(--vpad-gap) * 2 + var(--vpad-padding) * 2) * var(--vpad-scale)) + max(24px, env(safe-area-inset-bottom)) + 12px);
        left: 0;
        right: 0;
        pointer-events: none;
        display: flex;
        justify-content: space-between;
        padding: 0 max(16px, env(safe-area-inset-left)) 0 max(16px, env(safe-area-inset-right));
      }
      .vpad-shoulders button {
        pointer-events: auto;
        width: calc(90px * var(--vpad-scale));
        height: calc(38px * var(--vpad-scale));
        border-radius: calc(10px * var(--vpad-scale));
        font-size: calc(11px * var(--vpad-scale));
        font-weight: 900;
        background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.12) 0%, transparent 65%), rgba(20, 20, 25, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 6px 16px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1);
      }
      .vpad-shoulders button.is-pressed, .vpad-shoulders button:active {
        background: radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.45), rgba(236, 72, 153, 0.15)), rgba(10, 10, 15, 0.85);
        border-color: rgba(236, 72, 153, 0.5);
      }

      .vpad-system {
        position: absolute;
        left: 50%;
        bottom: max(24px, env(safe-area-inset-bottom));
        transform: translateX(-50%);
        display: flex;
        gap: calc(12px * var(--vpad-scale));
        z-index: 10;
      }
      .vpad-system button {
        width: calc(64px * var(--vpad-scale));
        height: calc(26px * var(--vpad-scale));
        border-radius: 999px;
        font-size: calc(8px * var(--vpad-scale));
        font-weight: 900;
        background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.1) 0%, transparent 65%), rgba(20, 20, 25, 0.75);
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 4px 10px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1);
        color: rgba(255, 255, 255, 0.7);
        letter-spacing: 0.05em;
      }
      .vpad-system button.is-pressed, .vpad-system button:active {
        background: rgba(236, 72, 153, 0.3) !important;
        border-color: rgba(236, 72, 153, 0.5) !important;
        color: #fff;
      }

      body[data-system="snes"] .vpad-face button { background: radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.4) 0%, transparent 60%); }
      body[data-system="snes"] .vpad-face .a { background-color: rgba(220, 38, 38, 0.85) !important; border-color: #ef4444 !important; }
      body[data-system="snes"] .vpad-face .b { background-color: rgba(202, 138, 4, 0.85) !important; border-color: #facc15 !important; }
      body[data-system="snes"] .vpad-face .x { background-color: rgba(37, 99, 235, 0.85) !important; border-color: #60a5fa !important; box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4); }
      body[data-system="snes"] .vpad-face .y { background-color: rgba(22, 163, 74, 0.85) !important; border-color: #4ade80 !important; box-shadow: inset 0 0 15px rgba(0,0,0,0.5), 0 4px 8px rgba(0,0,0,0.4); }

      /* Save Manager Panel styling */
      .cabinet-save-panel {
        position: fixed;
        z-index: 1000000;
        left: 50%;
        top: 50%;
        width: min(94vw, 760px);
        max-height: min(86vh, 720px);
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 24px;
        background: rgba(11, 11, 16, 0.9);
        box-shadow: 0 28px 90px rgba(0, 0, 0, 0.66);
        color: #f8fafc;
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -48%) scale(0.98);
        transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
        visibility: hidden;
        backdrop-filter: blur(20px);
      }
      .cabinet-save-panel.is-open {
        opacity: 1;
        pointer-events: auto;
        transform: translate(-50%, -50%) scale(1);
        visibility: visible;
      }
      .cabinet-save-panel__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 18px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .cabinet-save-title {
        margin: 0;
        color: #f8fafc;
        font: 900 13px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: 0.18em;
        text-transform: uppercase;
      }
      .cabinet-save-subtitle {
        margin: 6px 0 0;
        color: rgba(248, 250, 252, 0.6);
        font: 700 10px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        letter-spacing: 0.08em;
        line-height: 1.5;
        text-transform: uppercase;
      }
      .cabinet-save-close {
        appearance: none;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        color: #f8fafc;
        cursor: pointer;
        font: 900 16px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        min-height: 40px;
        min-width: 40px;
      }
      .cabinet-save-close:hover,
      .cabinet-save-close:focus-visible {
        background: rgba(236, 72, 153, 0.34);
        border-color: rgba(236, 72, 153, 0.75);
        outline: none;
      }
      .cabinet-save-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        max-height: calc(min(86vh, 720px) - 94px);
        overflow-y: auto;
        padding: 14px 18px 18px;
      }
      
      @media (max-width: 768px) {
        .cabinet-save-panel {
          width: calc(100vw - 24px);
          max-height: calc(100dvh - 34px);
        }
        .cabinet-save-grid {
          grid-template-columns: 1fr;
          gap: 8px;
          max-height: calc(100dvh - 128px);
          padding: 10px 12px 14px;
        }
      }

      /* Warp Panel styling */
      .cabinet-warp-panel {
        position: fixed;
        z-index: 1000000;
        left: 50%;
        top: 50%;
        width: min(90vw, 420px);
        max-height: min(85vh, 600px);
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 24px;
        background: rgba(11, 11, 16, 0.75);
        box-shadow: 0 28px 90px rgba(0, 0, 0, 0.7);
        color: #f8fafc;
        opacity: 0;
        pointer-events: none;
        transform: translate(-50%, -48%) scale(0.98);
        transition: opacity 180ms ease, transform 180ms ease, visibility 180ms ease;
        visibility: hidden;
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
      }
      .cabinet-warp-panel.is-open {
        opacity: 1;
        pointer-events: auto;
        transform: translate(-50%, -50%) scale(1);
        visibility: visible;
      }
      .cabinet-warp-panel__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        padding: 18px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      .cabinet-warp-content {
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 16px;
      }
      .cabinet-warp-qr-container {
        width: 220px;
        height: 220px;
        background: #fff;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
        padding: 8px;
        box-sizing: border-box;
      }
      .cabinet-warp-qr-container img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .cabinet-warp-desc {
        font-size: 11px;
        line-height: 1.6;
        color: rgba(248, 250, 252, 0.6);
        max-width: 280px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
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
             <svg class="icon-resume" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
             <span>Resume</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-restart">
             <svg class="icon-restart" viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
             <span>Restart</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-save">
             <svg class="icon-save" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
             <span>Save</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-load">
             <svg class="icon-load" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
             <span>Load</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-saves">
             <svg class="icon-saves" viewBox="0 0 24 24"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><path d="M2 10h20"></path></svg>
             <span>Saves</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-warp-open">
             <svg class="icon-warp" viewBox="0 0 24 24"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5 5 3Z"></path><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"></path></svg>
             <span>Warp</span>
           </button>
           <button type="button" class="cabinet-menu-tile" id="cabinet-pad-toggle">
             <svg class="icon-pad" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
             <span>Pad</span>
           </button>
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

    <section class="cabinet-save-panel" id="cabinet-save-panel" aria-label="Save state manager" aria-hidden="true" data-testid="panel-save-manager">
      <div class="cabinet-save-panel__header">
        <div>
          <p class="cabinet-save-title">Save-state Manager</p>
          <p class="cabinet-save-subtitle">Nine browser-local slots for this game · saved as <strong id="cabinet-save-user"></strong></p>
        </div>
        <button type="button" class="cabinet-save-close" id="cabinet-save-manager-close" aria-label="Close save-state manager" data-testid="button-close-save-manager">×</button>
      </div>
      <div class="cabinet-save-grid" id="cabinet-save-grid" data-testid="grid-save-slots"></div>
      <div style="padding:8px 14px 12px;display:flex;justify-content:flex-end;">
        <button type="button" id="cabinet-sync-from-server" style="appearance:none;border:1px solid rgba(99,179,237,0.35);border-radius:10px;background:rgba(99,179,237,0.08);color:#93c5fd;cursor:pointer;font:700 9px ui-monospace,monospace;letter-spacing:0.1em;padding:7px 12px;text-transform:uppercase;" data-testid="button-sync-from-server" title="Pull any server backup slots that are missing locally">☁ Sync from server</button>
      </div>
    </section>

    <section class="cabinet-warp-panel" id="cabinet-warp-panel" aria-label="Warp play to mobile" aria-hidden="true">
      <div class="cabinet-warp-panel__header">
        <h3 class="cabinet-save-title">Warp Play</h3>
        <button type="button" class="cabinet-save-close" id="cabinet-warp-close" aria-label="Close panel">✕</button>
      </div>
      <div class="cabinet-warp-content">
        <div class="cabinet-warp-qr-container">
          <img id="cabinet-warp-qr-image" src="" alt="Scan to Warp" />
        </div>
        <p class="cabinet-warp-desc">Scan this QR code with your mobile device to instantly warp your session and play on the go!</p>
      </div>
    </section>

    <div class="cabinet-toast" id="cabinet-toast"></div>
    <div id="game"></div>

    <script>
      (function() {
        // Intercept global errors to show on the launch overlay in case boot fails
        window.addEventListener("error", function(e) {
          var target = e.target;
          var statusText = document.querySelector("#cabinet-launch-status");
          var bar = document.querySelector("#cabinet-progress-bar");
          var msg = e.message || "Unknown error";
          
          if (target && (target.src || target.href)) {
            msg = "Failed to load resource: " + (target.src || target.href);
          }
          
          if (statusText) {
            statusText.textContent = "Boot Error: " + msg;
            statusText.style.color = "#ef4444";
            statusText.style.opacity = "1";
            statusText.style.fontWeight = "900";
          }
          if (bar) {
            bar.style.width = "100%";
            bar.style.backgroundColor = "#ef4444";
          }
        }, true);

        window.addEventListener("unhandledrejection", function(e) {
          var statusText = document.querySelector("#cabinet-launch-status");
          var bar = document.querySelector("#cabinet-progress-bar");
          if (statusText) {
            var msg = e.reason && e.reason.message ? e.reason.message : String(e.reason);
            statusText.textContent = "Boot Promise Error: " + msg;
            statusText.style.color = "#ef4444";
            statusText.style.opacity = "1";
            statusText.style.fontWeight = "900";
          }
          if (bar) {
            bar.style.width = "100%";
            bar.style.backgroundColor = "#ef4444";
          }
        });

        // Intercept console.error to catch resource fetch status messages (403, 404, etc.)
        var originalConsoleError = console.error;
        console.error = function() {
          var args = Array.prototype.slice.call(arguments);
          var msg = args.map(function(arg) {
            return typeof arg === "object" ? JSON.stringify(arg) : String(arg);
          }).join(" ");
          
          if (msg.indexOf("Failed to load resource") !== -1 || msg.indexOf("403") !== -1 || msg.indexOf("404") !== -1 || msg.indexOf("TypeError") !== -1) {
            var statusText = document.querySelector("#cabinet-launch-status");
            var bar = document.querySelector("#cabinet-progress-bar");
            if (statusText) {
              statusText.textContent = "Core Error: " + msg;
              statusText.style.color = "#ef4444";
              statusText.style.opacity = "1";
              statusText.style.fontWeight = "900";
            }
            if (bar) {
              bar.style.width = "100%";
              bar.style.backgroundColor = "#ef4444";
            }
          }
          originalConsoleError.apply(console, arguments);
        };

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
    ? `window.EJS_discs = [${discs.map((d: any) => `{ fileName: window.CABINET_INGRESS_BASE + "/api/roms/${d.id}/file", label: ${JSON.stringify(d.label)} }`).join(", ")}];`
    : `window.EJS_gameUrl = window.CABINET_INGRESS_BASE + "/api/roms/" + ${JSON.stringify(romId)} + "/file";`;

  return `"use strict";
window.CABINET_ROM_ID = ${JSON.stringify(romId)};
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

  function safeOnClick(id, handler) {
    var el = document.getElementById(id);
    if (el) el.onclick = handler;
  }

  btn.onclick = function() { toggleMenu(!panel.classList.contains("is-open")); };
  backdrop.onclick = function() { toggleMenu(false); };
  safeOnClick("cabinet-resume", function() { toggleMenu(false); });
  safeOnClick("cabinet-restart", function() { 
    if (window.EJS_emulator) { window.EJS_emulator.restart(); cabinetToast("Restarted ↺"); toggleMenu(false); }
  });
  safeOnClick("cabinet-save", function() { if (window.EJS_emulator) { window.EJS_emulator.saveState(); cabinetToast("Saved ✨"); toggleMenu(false); } });
  safeOnClick("cabinet-load", function() { if (window.EJS_emulator) { window.EJS_emulator.loadState(); cabinetToast("Loaded 🎮"); toggleMenu(false); } });
  safeOnClick("cabinet-saves", function() { toggleMenu(false); var panel = document.getElementById("cabinet-save-panel"); if (panel) { panel.classList.add("is-open"); document.getElementById("cabinet-save-user").textContent = userName || "Guest"; window.CabinetRefreshSaveGrid(); } });
  var saveGrid = document.getElementById("cabinet-save-grid");
  window.CabinetGetSaveSlots = function(cb) { if (!window.EJS_emulator) { cb([]); return; } window.EJS_emulator.saveStates(function(slots) { cb(slots || []); }); };
  function renderSaveGrid(slots) {
    if (!saveGrid) return;
    saveGrid.innerHTML = '';
    if (!slots || slots.length === 0) {
      saveGrid.innerHTML = '<p style="color:rgba(248,250,252,0.35);font:600 11px ui-monospace,monospace;text-align:center;padding:32px 0;">No saves yet. Use Save to create one.</p>';
      return;
    }
    slots.forEach(function(slot) {
      var div = document.createElement("div");
      div.style.cssText = "display:flex;flex-direction:column;gap:6px;background:rgba(255,255,255,0.04);border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);";
      var img = slot.thumbnail ? '<img src="' + slot.thumbnail + '" style="width:100%;aspect-ratio:16/9;object-fit:contain;background:#000;" />' : '<div style="width:100%;aspect-ratio:16/9;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.2);font:700 20px ui-monospace,monospace;">' + (slot.slot ?? "?") + '</div>';
      var date = slot.timestamp ? new Date(slot.timestamp * 1000).toLocaleString() : "No date";
      div.innerHTML = img + '<div style="padding:8px 10px 10px;display:flex;flex-direction:column;gap:6px;"><div style="font:700 10px ui-monospace,monospace;color:rgba(248,250,252,0.5);letter-spacing:0.1em;text-transform:uppercase;">Slot ' + slot.slot + '</div><div style="font:500 10px ui-monospace,monospace;color:rgba(248,250,252,0.3);">' + date + '</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:2px;"><button data-action="load" data-slot="' + slot.slot + '" style="padding:5px 8px;border-radius:6px;font:700 9px ui-monospace,monospace;letter-spacing:0.08em;background:rgba(99,179,237,0.15);color:#93c5fd;border:1px solid rgba(99,179,237,0.25);cursor:pointer;">Load</button><button data-action="delete" data-slot="' + slot.slot + '" style="padding:5px 8px;border-radius:6px;font:700 9px ui-monospace,monospace;letter-spacing:0.08em;background:rgba(239,68,68,0.12);color:#fca5a5;border:1px solid rgba(239,68,68,0.2);cursor:pointer;">Delete</button></div></div></div>';
      saveGrid.appendChild(div);
    });
    if (!saveGrid.dataset.listenerAdded) {
      saveGrid.dataset.listenerAdded = 'true';
      saveGrid.onclick = function(e) {
        var btn = e.target.closest('button');
        if (!btn || !window.EJS_emulator) return;
        var action = btn.getAttribute('data-action');
        var slotId = Number(btn.getAttribute('data-slot'));
        if (action === 'load') {
          window.EJS_emulator.loadState(slotId);
          cabinetToast('Loaded slot ' + slotId + ' ✅');
        } else if (action === 'delete') {
          window.EJS_emulator.deleteState(slotId);
          cabinetToast('Deleted slot ' + slotId + ' 🗑️');
          window.CabinetGetSaveSlots(renderSaveGrid);
        }
      };
    }
  }
  window.CabinetRefreshSaveGrid = function() { window.CabinetGetSaveSlots(renderSaveGrid); };
  safeOnClick("cabinet-sync-from-server", function() {
    cabinetToast("Syncing...");
    fetch(window.CABINET_INGRESS_BASE + "/api/roms/" + window.CABINET_ROM_ID + "/save-states")
      .then(function(r) { return r.json(); })
      .then(function(slots) {
         if (!slots || slots.length === 0) {
           cabinetToast("No backups found");
           return;
         }
         var promises = slots.map(function(serverSlot) {
           return fetch(window.CABINET_INGRESS_BASE + "/api/roms/" + window.CABINET_ROM_ID + "/save-backup/" + serverSlot.slot)
             .then(function(res) {
               if (res.ok) return res.arrayBuffer();
               throw new Error();
             })
             .then(function(buf) {
               if (window.EJS_emulator) {
                 try {
                   window.EJS_emulator.importSaveState(serverSlot.slot, new Uint8Array(buf));
                 } catch(e) {
                   console.error("[SaveSync] Import error:", e);
                 }
               }
             })
             .catch(function() {
               console.warn("[SaveSync] Failed to download slot", serverSlot.slot);
             });
         });
         Promise.all(promises).then(function() {
           setTimeout(function() {
             window.CabinetRefreshSaveGrid();
             cabinetToast("Sync complete ✓");
           }, 800);
         });
      })
      .catch(function() {
        cabinetToast("Sync failed");
      });
  });
  safeOnClick("cabinet-save-manager-close", function() { var panel = document.getElementById("cabinet-save-panel"); if (panel) panel.classList.remove("is-open"); });
  safeOnClick("cabinet-exit", function() { window.location.href = window.CABINET_RETURN_TO || "/"; });
  safeOnClick("cabinet-warp-open", function() {
    toggleMenu(false);
    var warpPanel = document.getElementById("cabinet-warp-panel");
    var qrImg = document.getElementById("cabinet-warp-qr-image");
    if (warpPanel && qrImg) {
      cabinetToast("Generating QR...");
      if (window.EJS_emulator) {
        window.EJS_emulator.saveState(0);
      }
      var pageUrl = window.location.href;
      fetch(window.CABINET_INGRESS_BASE + "/api/roms/warp-qr?url=" + encodeURIComponent(pageUrl))
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (data && data.dataUrl) {
            qrImg.src = data.dataUrl;
            warpPanel.classList.add("is-open");
          } else {
            cabinetToast("Failed to load QR");
          }
        })
        .catch(function() {
          cabinetToast("Failed to load QR");
        });
    }
  });
  safeOnClick("cabinet-warp-close", function() {
    var warpPanel = document.getElementById("cabinet-warp-panel");
    if (warpPanel) warpPanel.classList.remove("is-open");
  });

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

window.EJS_onSaveState = function(state) {
  if (!state || !state.data) return;
  fetch(window.CABINET_INGRESS_BASE + "/api/roms/" + window.CABINET_ROM_ID + "/save-states/" + state.slot, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: "Slot " + state.slot })
  }).then(function(r) {
    if (!r.ok) throw new Error();
    return fetch(window.CABINET_INGRESS_BASE + "/api/roms/" + window.CABINET_ROM_ID + "/save-backup/" + state.slot, {
      method: "PUT",
      headers: { "Content-Type": "application/octet-stream" },
      body: state.data
    });
  }).then(function(r) {
    if (!r.ok) throw new Error();
    if (state.screenshot) {
      return fetch(window.CABINET_INGRESS_BASE + "/api/roms/" + window.CABINET_ROM_ID + "/save-thumb/" + state.slot, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl: state.screenshot })
      });
    }
  }).then(function() {
    console.log("[SaveSync] Auto-backed up slot " + state.slot);
    if (window.CabinetRefreshSaveGrid) window.CabinetRefreshSaveGrid();
  }).catch(function(err) {
    console.error("[SaveSync] Auto-backup failed:", err);
  });
};

window.EJS_onGameStart = function () {
  cabinetFinishLaunchProgress();
  cabinetSetupVirtualPad();
  cabinetSetupGamepad();
  
  fetch(window.CABINET_INGRESS_BASE + "/api/roms/" + window.CABINET_ROM_ID + "/save-states")
    .then(function(r) { return r.json(); })
    .then(function(slots) {
      var auto = slots.find(function(s) { return s.slot === 0; });
      if (auto) {
        fetch(window.CABINET_INGRESS_BASE + "/api/roms/" + window.CABINET_ROM_ID + "/save-backup/0")
          .then(function(res) {
            if (res.ok) return res.arrayBuffer();
            throw new Error();
          })
          .then(function(buf) {
            if (window.EJS_emulator) {
              try {
                window.EJS_emulator.importSaveState(0, new Uint8Array(buf));
                setTimeout(function() {
                  cabinetToast("Auto-Resuming...");
                  window.EJS_emulator.loadState(0);
                }, 1200);
              } catch(e) {
                console.error("[Warp] Auto-resume import error:", e);
              }
            }
          })
          .catch(function() {
            console.log("[Warp] No remote auto-save found.");
          });
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
window.EJS_VirtualGamepadSettings = [{ type: "button", id: "dummy_btn", text: "", location: "left", left: "-9999px", top: "-9999px" }];
window.EJS_gamepad = false;
window.EJS_color = "#1a1a2e";
window.EJS_backgroundColor = "#000000";
window.EJS_Buttons = { play_pause: false, restart: false, mute: false, settings: false, fullscreen: true, save_state: false, load_state: false, quick_save: false, quick_load: false };

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
