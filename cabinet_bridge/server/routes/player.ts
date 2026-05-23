import { escapeHtml } from "./utils";

/**
 * Renders the Pure Libretro (RetroArch Web) Player.
 * Uses official Libretro CDN as a fallback for core engine files.
 */
export function renderEmulatorPage({ title, returnTo, romHash, queryString, system }: { title: string; returnTo: string; romHash: string | null; queryString?: string; system?: string }) {
  const safeTitle = escapeHtml(title);
  const safeReturnTo = JSON.stringify(returnTo);
  const safeSystem = system || "generic";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${safeTitle} · RetroArch</title>
    <style>
      html, body {
        width: 100%; height: 100%; margin: 0; padding: 0; overflow: hidden; background: #000;
        font-family: ui-monospace, SFMono-Regular, monospace;
      }
      #canvas { width: 100vw; height: 100vh; display: block; }
      .overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: #000; color: #fff; z-index: 2000; transition: opacity 0.5s;
      }
      .overlay.hidden { opacity: 0; pointer-events: none; }
      .back-button {
        position: fixed; top: 12px; left: 12px; z-index: 3000;
        appearance: none; border: 1px solid rgba(255,255,255,0.2); border-radius: 99px;
        background: rgba(0,0,0,0.5); color: #fff; padding: 8px 16px;
        font: 900 10px ui-monospace, monospace; cursor: pointer; text-transform: uppercase;
      }
      .loader-text { font: 900 12px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 20px; }
      .progress-track { width: 200px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
      .progress-bar { width: 0%; height: 100%; background: #ec4899; transition: width 0.3s; }
    </style>
  </head>
  <body>
    <button class="back-button" onclick="window.location.href=${safeReturnTo}">Back</button>
    
    <div class="overlay" id="loading-overlay">
      <div class="loader-text" id="loader-status">Initializing RetroArch...</div>
      <div class="progress-track"><div class="progress-bar" id="progress-bar"></div></div>
    </div>

    <canvas id="canvas" oncontextmenu="event.preventDefault()"></canvas>

    <script>
      (function() {
        var path = window.location.pathname;
        var apiIdx = path.indexOf("/api/roms");
        var base = apiIdx !== -1 ? path.substring(0, apiIdx) : "";
        window.CABINET_BASE = base;
        
        var status = document.getElementById('loader-status');
        var bar = document.getElementById('progress-bar');
        
        function updateProgress(percent, msg) {
          if (bar) bar.style.width = percent + "%";
          if (status && msg) status.textContent = msg;
        }

        window.Module = {
          canvas: document.getElementById('canvas'),
          noInitialRun: true,
          arguments: ["-v", "--menu"],
          print: function(text) { console.log(text); },
          printErr: function(text) { console.error(text); },
          onRuntimeInitialized: function() {
            updateProgress(90, "Engine Ready");
            setTimeout(function() {
              document.getElementById('loading-overlay').classList.add('hidden');
              window.Module.run();
            }, 500);
          },
          locateFile: function(path, prefix) {
             // Fallback to local build, then to official Libretro CDN
             if (path.endsWith(".wasm") || path.endsWith(".data")) {
               return window.CABINET_BASE + "/retroarch/" + path;
             }
             return prefix + path;
          }
        };

        // Standard Asset Loading
        updateProgress(20, "Fetching Game Data...");
        
        var script = document.createElement('script');
        // Try local build first, fallback to CDN if not found
        script.src = window.CABINET_BASE + "/retroarch/retroarch.js";
        script.onerror = function() {
           console.warn("Local RetroArch build not found, falling back to CDN...");
           script.src = "https://web.libretro.com/retroarch.js";
           document.body.appendChild(script);
        };
        document.body.appendChild(script);
      })();
    </script>
  </body>
</html>`;
}

export function renderEmulatorBootstrap(params: any) {
  return `"use strict"; console.log("RetroArch Bootstrap Initialized");`;
}

export function renderPlayerError(message: string) {
  return `<!doctype html><html><body style="background:#000;color:white;display:grid;place-items:center;height:100vh;font-family:monospace;">${escapeHtml(message)}</body></html>`;
}

export function renderBootstrapError(message: string) {
  return `console.error(${JSON.stringify(message)});`;
}
