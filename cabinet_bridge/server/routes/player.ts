import { escapeHtml } from "./utils";

/**
 * Renders the Pure Libretro (RetroArch Web) Player.
 * This ditches the EmulatorJS wrapper in favor of the official RetroArch Web engine.
 */
export function renderEmulatorPage({ title, returnTo, romHash, queryString, system }: { title: string; returnTo: string; romHash: string | null; queryString?: string; system?: string }) {
  const safeTitle = escapeHtml(title);
  const safeReturnTo = JSON.stringify(returnTo);
  const safeQueryString = queryString || "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>${safeTitle} · RetroArch</title>
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: #000;
      }
      #canvas {
        width: 100vw;
        height: 100vh;
        display: block;
      }
      .back-button {
        position: fixed;
        top: 10px;
        left: 10px;
        z-index: 1000;
        background: rgba(0,0,0,0.5);
        color: white;
        border: 1px solid white;
        padding: 5px 10px;
        border-radius: 5px;
        cursor: pointer;
        font-family: sans-serif;
      }
    </style>
  </head>
  <body>
    <button class="back-button" onclick="window.location.href=${safeReturnTo}">Back</button>
    <canvas id="canvas"></canvas>
    <script>
      var ingressBase = window.location.pathname.substring(0, window.location.pathname.indexOf("/api/roms"));
      window.Module = {
        canvas: document.getElementById('canvas'),
        arguments: [
          "-v",
          "--menu",
          "-L", "/cores/core.js",
          "/userdata/roms/game.bin"
        ],
        preRun: [],
        postRun: [],
        print: function(text) { console.log(text); },
        printErr: function(text) { console.error(text); },
        locateFile: function(path, prefix) {
          if (path.endsWith(".wasm") || path.endsWith(".data")) {
            return ingressBase + "/retroarch/" + path;
          }
          return prefix + path;
        }
      };
    </script>
    <script src="../../retroarch/retroarch.js${safeQueryString}"></script>
  </body>
</html>`;
}

export function renderEmulatorBootstrap(params: any) {
  // We'll expand this as we finalize the RetroArch WASM build integration
  return `"use strict"; console.log("RetroArch Bootstrap Initialized");`;
}

export function renderPlayerError(message: string) {
  return `<!doctype html><html><body style="background:#000;color:white;display:grid;place-items:center;height:100vh;">${escapeHtml(message)}</body></html>`;
}

export function renderBootstrapError(message: string) {
  return `console.error(${JSON.stringify(message)});`;
}
