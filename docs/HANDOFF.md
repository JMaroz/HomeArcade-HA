# Handoff Sessione: Risoluzione Criticità UI, Scroll, Font e Caricamento Sistemi

**Data**: 2026-10-10  
**Stato**: Tutte le criticità risolte, typecheck TypeScript e build Vite/esbuild verificati con successo.  
**Piano di Riferimento**: `docs/plans/2026-10-10_ui_and_system_fixes.md`  

---

## 1. Stato Corrente & Problemi Risolti

Tutte le 5 problematiche segnalate dall'utente sono state identificate alla causa radice e risolte:

1. **Caricamento di tutti i sistemi in Home (risolto blocco "solo PS1")**:
   - `server/routes/roms.ts`: `GET /api/roms` ora restituisce tutte le ROM quando `limit` non è presente (o `limit=all`), preservando la paginazione opzionale solo se esplicitamente richiesta con `?limit=N`.
   - `server/storage.ts`: `listUploadedRoms` supporta ora il parametro `excludeChildren` per escludere i file disco figli di playlist `.m3u`.
   - `HomeArcadeTheme.tsx`: eliminata la complessità della sincronizzazione a blocchi via `IntersectionObserver`. Tutte le ROM vengono caricate all'avvio in un'unica query leggera (~60KB); tutti i sistemi (PS1, GBA, PS2, SNES, ecc.) e i rispettivi conteggi appaiono immediatamente all'apertura dell'app.
   - Rimossa la dicitura artefatta "Showing 200 of 528 games" dalla vista portali.

2. **Transizione scheda di dettaglio (`GameDetailDialog`)**:
   - `dialog.tsx` e `alert-dialog.tsx`: rimosse le classi di slide-in (`slide-in-from-left-1/2`, `slide-in-from-top-[48%]`) che in Tailwind CSS v4 causavano il volo della finestra modale dall'angolo in alto a sinistra verso il centro dello schermo.
   - Durata ridotta a `duration-150` con sola animazione di fade-in e leggero zoom (`zoom-in-95`), rendendo l'apertura istantanea, stabile e fluida senza blocchi UI.

3. **Unificazione Design System e Font**:
   - `index.html`: rimossi i fogli di stile esterni non autorizzati `nes.css` e Google Font `Press Start 2P` che forzavano globalmente font pixelati e dimensioni giganti su pulsanti, select, input e titoli.
   - `index.css`: unificata la variabile `--font-display` su `Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif` per allineare tutti i titoli della schermata Settings al design system moderno della Home.
   - `Settings.tsx`, `History.tsx`, `Achievements.tsx`: applicata esplicitamente la classe `font-sans` e normalizzati i titoli a `text-2xl font-black`.

4. **Rimozione icona duplicata delle Impostazioni**:
   - `HomeArcadeTheme.tsx`: rimosso il pulsante link `<Link href="/settings">` dall'header accanto alla barra di ricerca. L'accesso ai Settings resta affidato esclusivamente all'icona nella barra di navigazione inferiore (`AppBottomNav`).

5. **Risoluzione definitiva dello scroll nei Settings e Home Assistant Ingress**:
   - `index.css`: reinserita la regola `@layer base { html, body, #root { height: 100%; } }` per garantire l'altezza corretta all'interno degli `iframe` di Home Assistant Ingress.
   - `App.tsx`: garantita la catena flexbox con `h-full min-h-0` in `PageTransition` e nel layout root.
   - `Settings.tsx`: aggiunti `min-h-0` su tutti i wrapper flex intermedi, rimosso `overscroll-contain` che bloccava il trackpad/touch, e impostato `pb-36` per assicurare che nessun elemento in fondo ai tab venga coperto dalla bottom bar.
   - Applicate medesime migliorie di layout a `History.tsx` e `Achievements.tsx`.

---

## 2. File Rilevanti

- [HomeArcadeTheme.tsx](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/components/dashboard-themes/HomeArcadeTheme.tsx): Caricamento all-roms immediato, calcolo istantaneo di tutti i sistemi, rimozione ingranaggio duplicato.
- [dialog.tsx](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/components/ui/dialog.tsx): Fade-in centrato pulito senza slide-in da coordinate errate.
- [alert-dialog.tsx](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/components/ui/alert-dialog.tsx): Fade-in centrato ottimizzato.
- [index.html](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/index.html): Rimozione di `nes.css` e `Press Start 2P`.
- [index.css](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/index.css): Unificazione `--font-display`, altezza 100% per `#root`.
- [Settings.tsx](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/pages/Settings.tsx): Flex chain `min-h-0`, font-sans, padding `pb-36`.
- [App.tsx](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/App.tsx): Propagazione altezza completa `h-full min-h-0` in `PageTransition`.
- [Sidebar.tsx](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/components/Sidebar.tsx): Query ROM senza limit artificiale a 100.
- [routes/roms.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/routes/roms.ts): Gestione `hasLimit` per restituire tutte le ROM senza paginazione forzata.
- [storage.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/storage.ts): Parametro `excludeChildren` in `listUploadedRoms`.
- [2026-10-10_ui_and_system_fixes.md](file:///Users/andrea/Repository/HomeArcade-HA/docs/plans/2026-10-10_ui_and_system_fixes.md): Piano di lavoro con tutte le attività spuntate.

---

## 3. Comandi di Verifica Eseguiti

- Typecheck TypeScript: `node node_modules/typescript/bin/tsc --noEmit` -> **0 errori** (passato).
- Client Vitest tests: `node node_modules/vitest/vitest.mjs run client/` -> **3/3 file passati, 22/22 test verdi**.
- Shared Vitest tests: `node node_modules/vitest/vitest.mjs run shared/` -> **2/2 file passati, 18/18 test verdi**.
- Release-health test: `node node_modules/vitest/vitest.mjs run server/__tests__/release-health.test.ts` -> **3/3 test verdi**.
- Build di produzione: `node node_modules/tsx/dist/cli.mjs script/build.ts` -> **Vite client + esbuild server completati con successo** (1.76s).
