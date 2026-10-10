# Piano di Lavoro: Risoluzione Criticità UI, Scroll, Font e Caricamento Sistemi

**Data**: 2026-10-10  
**Obiettivo**: Risolvere i 5 problemi segnalati dall'utente (caricamento di tutti i sistemi in Home, animazione e lag della scheda di dettaglio, armonizzazione design system e font in Settings, rimozione icona duplicata impostazioni, ripristino scroll affidabile in Settings e Ingress).

---

## 1. Scope & Root Cause

1. **Caricamento incompleto dei sistemi in Home (solo PS1)**:
   - Root cause: L'endpoint `GET /api/roms` imponeva forzatamente una paginazione a 100 elementi (`limit ?? 100`). La Home accumulava solo le prime 2 pagine (200 ROM, tutte PS1 nel DB), e la lista `systemsWithGames` calcolata su `allGames` conteneva unicamente `ps1`. Inoltre l'IntersectionObserver in portals view si arrestava.
   - Soluzione: Supportare il recupero completo delle ROM in `GET /api/roms` quando `limit` non è specificato o è impostato a tutti i record (`limit=all`), garantendo il caricamento immediato di tutti i sistemi e dei relativi conteggi all'avvio.

2. **Transizione anomala scheda dettaglio (volo da alto-sinistra e lentezza)**:
   - Root cause: Con Tailwind CSS v4, le classi `data-[state=open]:slide-in-from-left-1/2` e `data-[state=open]:slide-in-from-top-[48%]` in `dialog.tsx` e `alert-dialog.tsx` entrano in conflitto con `translate-x-[-50%] translate-y-[-50%]`, causando un'animazione che parte dall'angolo superiore sinistro dello schermo prima di centrarsi, con ricalcoli e scatti.
   - Soluzione: Rimuovere le classi di slide e adottare un fade/zoom pulito, rapido e stabile (`fade-in-0 zoom-in-95 duration-150`), perfettamente centrato fin dal frame 0.

3. **Font distorti e troppo grandi nei Settings (Discrepanza Design System)**:
   - Root cause: In `index.html` erano presenti link esterni non autorizzati a `nes.css` e `Press Start 2P`. `nes.css` sovrascrive a livello globale gli stili nativi di `button`, `select`, `input`, `body` imponendo un font pixelato e dimensioni sproporzionate. Inoltre `--font-display` in `index.css` era forzato a `JetBrains Mono` monospace.
   - Soluzione: Rimuovere `nes.css` e `Press Start 2P` da `index.html`. Unificare `--font-display` sul font sans di sistema (`var(--font-sans)`). Applicare `font-sans` esplicito a Settings e sub-componenti.

4. **Doppia icona delle impostazioni**:
   - Root cause: L'icona a ingranaggio era renderizzata sia nell'header di `HomeArcadeTheme.tsx` accanto alla barra di ricerca, sia nella barra di navigazione fluttuante in basso (`AppBottomNav`).
   - Soluzione: Rimuovere il pulsante impostazioni dall'header di `HomeArcadeTheme.tsx`, mantenendo esclusivamente quello nella bottom bar.

5. **Problema dello scroll nei Settings e integrazione Ingress**:
   - Root cause: In Home Assistant Ingress (iframe), `h-dvh` e catene flexbox con `h-full` senza `min-h-0` causano il collasso o l'espansione indefinita dei contenitori flex figli (`min-height: auto`), impedendo a `overflow-y-auto` di attivarsi e tagliando i contenuti. Inoltre mancava `html, body, #root { height: 100% }` in `index.css` e `overscroll-contain` bloccava la propagazione degli eventi di scroll.
   - Soluzione: Inserire `html, body, #root { height: 100% }` in `index.css`; assicurare `min-h-0` e corretta altezza su tutta la catena flex in `App.tsx` e `Settings.tsx`; rimuovere `overscroll-contain` limitante e garantire padding inferiore per non sovrapporsi alla bottom bar.

---

## 2. Task Checklist

- [x] **Task 1: Caricamento completo dei sistemi in Home**
  - [x] Aggiornare `server/routes/roms.ts` affinché `GET /api/roms` restituisca tutte le ROM se `limit` non è specificato o `limit=all`.
  - [x] Aggiornare `HomeArcadeTheme.tsx` per caricare tutte le ROM all'avvio, garantendo che tutti i sistemi (PS1, GBA, PS2, ecc.) e i titoli totali vengano renderizzati subito.
- [x] **Task 2: Fix transizione e velocità GameDetailDialog**
  - [x] Rimuovere classi di slide-in da `cabinet_bridge/client/src/components/ui/dialog.tsx` e `alert-dialog.tsx`.
  - [x] Verificare che il dialog appaia centrato istantaneamente con transizione pulita.
- [x] **Task 3: Unificazione Design System e Font**
  - [x] Rimuovere `nes.css` e Google Font `Press Start 2P` da `cabinet_bridge/client/index.html`.
  - [x] Unificare `--font-display` con `var(--font-sans)` in `cabinet_bridge/client/src/index.css`.
  - [x] Assicurare `font-sans` e dimensioni corrette nei layout di `Settings.tsx` e `SettingsShared.tsx`.
- [x] **Task 4: Rimozione icona impostazioni duplicata**
  - [x] Rimuovere il link `/settings` dall'header di `cabinet_bridge/client/src/components/dashboard-themes/HomeArcadeTheme.tsx`.
- [x] **Task 5: Risoluzione definitiva dello scroll in Settings**
  - [x] Aggiungere `html, body, #root { height: 100%; }` in `cabinet_bridge/client/src/index.css`.
  - [x] Correggere la catena flexbox (`min-h-0`, `flex-1`, rimozione `overscroll-contain`, `pb-32`) in `App.tsx` e `Settings.tsx`.
- [x] **Task 6: Verifica empirica e DoD**
  - [x] Eseguire `pnpm check` (typecheck TypeScript).
  - [x] Eseguire `pnpm build` (build client e server).
  - [x] Eseguire `pnpm test` (suite test Vitest).
  - [x] Aggiornare `docs/HANDOFF.md` e spuntare la checklist.
