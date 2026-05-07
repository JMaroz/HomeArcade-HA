import { chromium, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesSrc = readFileSync(path.join(__dirname, "..", "server", "routes.ts"), "utf8");

function extractRenderEmulatorPage(): string {
  const start = routesSrc.indexOf("function renderEmulatorPage(");
  const next = routesSrc.indexOf("function renderEmulatorBootstrap(", start);
  if (start < 0 || next < 0) throw new Error("anchor functions not found");
  // Slice everything between renderEmulatorPage start and the next function declaration.
  return routesSrc.slice(start, next).trimEnd();
}

const fnSrc = extractRenderEmulatorPage();
const escapeHtmlSrc = `function escapeHtml(s){return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;","'":"&#39;"}[c]));}`;
// Replace the destructured + typed signature with a plain JS one.
const fnSrcJs = fnSrc.replace(
  /function renderEmulatorPage\(\{ title, returnTo \}: \{ title: string; returnTo: string \}\) \{/,
  "function renderEmulatorPage(args) { var title = args.title; var returnTo = args.returnTo;",
);
const factoryBody = `${escapeHtmlSrc}\n${fnSrcJs}\nreturn renderEmulatorPage;`;
const factory = new Function(factoryBody);
const renderEmulatorPage = factory() as (a: { title: string; returnTo: string }) => string;

const html = renderEmulatorPage({ title: "Aladdin", returnTo: "/" });

type Result = { width: number; height: number; ok: boolean; gap: number; dpadRight: number; faceLeft: number; sizes: Record<string, { w: number; h: number }>; failures: string[] };

const viewports = [
  { width: 360, height: 780 },
  { width: 390, height: 844 },
];

const dpadIds = [
  "button-gamepad-up",
  "button-gamepad-left",
  "button-gamepad-right",
  "button-gamepad-down",
];
const faceIds = [
  "button-gamepad-x",
  "button-gamepad-y",
  "button-gamepad-a",
  "button-gamepad-b",
];
const topRowIds = [
  "button-gamepad-l1",
  "button-gamepad-r1",
  "button-gamepad-select",
  "button-gamepad-start",
];
// Controls that must remain present in the DOM (preserved), even if not currently visible.
const preservedIds = [
  "button-gamepad-hide",
  "button-open-player-menu",
  "button-quick-save",
  "button-quick-load",
  "button-exit-player",
];

(async () => {
  const browser = await chromium.launch();
  const results: Result[] = [];
  let allOk = true;

  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    // Force the gamepad visible: it's hidden by default. Apply both classes used by mobile pad and reveal.
    await page.evaluate(() => {
      document.body.classList.add("cabinet-pad-mobile", "cabinet-pad-on");
      const pad = document.getElementById("cabinet-gamepad")!;
      pad.removeAttribute("hidden");
      pad.classList.add("is-visible");
    });

    const failures: string[] = [];

    const rect = (id: string) => page.evaluate((tid) => {
      const el = document.querySelector(`[data-testid="${tid}"]`);
      if (!el) return null;
      const r = (el as HTMLElement).getBoundingClientRect();
      return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
    }, id);

    const dpadRects = await Promise.all(dpadIds.map(rect));
    const faceRects = await Promise.all(faceIds.map(rect));

    if (dpadRects.some((r) => !r)) failures.push("missing dpad button");
    if (faceRects.some((r) => !r)) failures.push("missing face button");

    const dpadRight = Math.max(...dpadRects.filter(Boolean).map((r) => r!.right));
    const faceLeft = Math.min(...faceRects.filter(Boolean).map((r) => r!.left));
    const gap = faceLeft - dpadRight;

    if (gap < 16) failures.push(`center gap ${gap.toFixed(2)}px < 16px`);

    // Bounding-box overlap check (any dpad vs any face)
    const sizes: Record<string, { w: number; h: number }> = {};
    for (let i = 0; i < dpadRects.length; i++) {
      const a = dpadRects[i]!;
      sizes[dpadIds[i]] = { w: a.width, h: a.height };
      if (a.width < 44 || a.height < 44) failures.push(`${dpadIds[i]} touch target ${a.width}x${a.height} < 44px`);
      for (let j = 0; j < faceRects.length; j++) {
        const b = faceRects[j]!;
        const overlap = !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top);
        if (overlap) failures.push(`overlap ${dpadIds[i]} with ${faceIds[j]}`);
      }
    }
    for (let j = 0; j < faceRects.length; j++) {
      const b = faceRects[j]!;
      sizes[faceIds[j]] = { w: b.width, h: b.height };
      if (b.width < 44 || b.height < 44) failures.push(`${faceIds[j]} touch target ${b.width}x${b.height} < 44px`);
    }

    // Top row presence: L1, Select, Start, R1
    for (const id of topRowIds) {
      const r = await rect(id);
      if (!r) failures.push(`top row ${id} missing`);
      else if (r.width < 1 || r.height < 1) failures.push(`top row ${id} not visible`);
    }

    // Preserved controls: must still exist in the DOM after the layout fix.
    for (const id of preservedIds) {
      const exists = await page.evaluate(
        (tid) => !!document.querySelector(`[data-testid="${tid}"]`),
        id,
      );
      if (!exists) failures.push(`preserved control ${id} missing from DOM`);
    }

    // Verify keyboard mappings + ejs-input + multi-touch attrs preserved
    const attrCheck = await page.evaluate(() => {
      const expected: Record<string, { vkey: string; ejs: string }> = {
        "button-gamepad-up": { vkey: "ArrowUp", ejs: "4" },
        "button-gamepad-down": { vkey: "ArrowDown", ejs: "5" },
        "button-gamepad-left": { vkey: "ArrowLeft", ejs: "6" },
        "button-gamepad-right": { vkey: "ArrowRight", ejs: "7" },
        "button-gamepad-a": { vkey: "x", ejs: "8" },
        "button-gamepad-b": { vkey: "z", ejs: "0" },
        "button-gamepad-x": { vkey: "s", ejs: "9" },
        "button-gamepad-y": { vkey: "a", ejs: "1" },
        "button-gamepad-l1": { vkey: "q", ejs: "10" },
        "button-gamepad-r1": { vkey: "w", ejs: "11" },
        "button-gamepad-select": { vkey: "Shift", ejs: "2" },
        "button-gamepad-start": { vkey: "Enter", ejs: "3" },
      };
      const errs: string[] = [];
      for (const [tid, spec] of Object.entries(expected)) {
        const el = document.querySelector(`[data-testid="${tid}"]`) as HTMLElement | null;
        if (!el) { errs.push(`${tid} missing`); continue; }
        if (el.getAttribute("data-vkey") !== spec.vkey) errs.push(`${tid} vkey=${el.getAttribute("data-vkey")} expected ${spec.vkey}`);
        if (el.getAttribute("data-ejs-input") !== spec.ejs) errs.push(`${tid} ejs=${el.getAttribute("data-ejs-input")} expected ${spec.ejs}`);
        const ta = getComputedStyle(el).touchAction;
        if (!ta || ta === "auto") errs.push(`${tid} touch-action=${ta} (expected non-auto for multi-touch)`);
      }
      return errs;
    });
    failures.push(...attrCheck);

    const ok = failures.length === 0;
    if (!ok) allOk = false;
    results.push({ width: vp.width, height: vp.height, ok, gap, dpadRight, faceLeft, sizes, failures });

    await ctx.close();
  }
  await browser.close();

  console.log(JSON.stringify(results, null, 2));
  if (!allOk) {
    console.error("FAIL");
    process.exit(1);
  } else {
    console.log("PASS");
  }
})();
