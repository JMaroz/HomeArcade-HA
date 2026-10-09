# Piano di Lavoro: Ripristino UI & Risoluzione Criticità (Rollback Controllato & Schema Fix)

**Data**: 2026-10-09  
**Stato**: Pronto per esecuzione  
**Riferimento Utente**: Problemi 1-9 UI / Decisione su Rollback v2.51.0 e azzeramento preferiti

---

## 1. Obiettivo
Ripristinare la completa stabilità, usabilità ed estetica dell'applicazione HomeArcade eliminando le regressioni critiche introdotte nel commit `9da94e8` (Next-Gen UI), correggendo alla radice il default errato dei preferiti in SQLite/Drizzle e garantendo la piena compatibilità con React 19, Tailwind CSS v4 e l'ecosistema Home Assistant Ingress.

---

## 2. Analisi Root-Cause delle 9 Criticità

1. **Blocco dello scroll (Desktop e Mobile)**:
   - `gridRef` associato erroneamente all'intero container `<main>` anziché alla sola griglia; `useGridNav` forzava `scrollIntoView(0)` sul primo elemento (`motion.div` / hero) a ogni aggiornamento di stato.
   - Presenza contemporanea di `select-none`, `overscroll-contain`, `scrollbar-none` e molteplici wrapper con `overflow-hidden` senza altezze calcolate stabili.
2. **Carosello unico con 100 preferiti indesiderati**:
   - In `cabinet_bridge/shared/schema.ts` il campo `favorite` era impostato a `.notNull().default(true)`.
   - Ogni ROM scansionata o importata veniva marcata con `favorite = 1`, facendo apparire il cuore rosso su tutte le card e popolando il carosello `PREFERITI (100)`.
3. **Hero banner senza immagini e UI scadente**:
   - Tentativo di rendering solo dello snapshot `/save-thumb/auto` (che fallisce con 404 per giochi non giocati, nascondendosi con `onError`), senza cover art di sfondo e con titoli raw non formattati.
4. **"Hamburger menu" aperto di default e sgraziato**:
   - La `ConsoleTopBar` introdotta in `9da94e8` rompeva il flusso flex orizzontale in Tailwind v4 (`flex items-center justify-between` impilato in 6 righe verticali giganti), occupando 350+ px ed evidenziando "Home" con una barra espansa a schermo intero.
5. **6. 7. Schermata nera vuota su Medaglie, Storico, Impostazioni**:
   - Inclusione di `ConsoleTopBar` corrotta all'interno dei layout di `Achievements.tsx` e `History.tsx` e conflitti di posizionamento/overflow nei componenti lazy con Wouter hash routing.
8. **Visualizzazione sistemi inguardabile e doppi header**:
   - Presenza simultanea della `ConsoleTopBar` errata e del secondo header di sistema con filtri, con watermark `ConsoleSilhouette` sovrapposto in modo illeggibile ai testi delle card.
9. **Scheda di dettaglio gioco posizionata in alto a sinistra e tagliata**:
   - `DialogContent` modificato con `w-screen h-dvh inset-0` mantenendo le classi base di Radix Dialog (`left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`). La traslazione del -50% su un box a schermo intero spostava il dialog esattamente nell'angolo superiore sinistro, tagliandolo a metà.

---

## 3. Scope & Non-Goals

### In Scope
- **Rollback controllato dei componenti UI** allo stato stabile e collaudato pre-`9da94e8` (`635347d`):
  - Rimozione di `ConsoleTopBar.tsx` e pulizia delle dipendenze correlate.
  - Ripristino di `HomeArcadeTheme.tsx`: header pulito, griglia portali originale, navigazione fluida.
  - Ripristino di `GameDetailDialog.tsx`: dialog modale a 2 colonne centrato a schermo (`sm:max-w-2xl max-h-[92dvh]`), con artwork, video preview, salvataggi e cheat funzionanti.
  - Ripristino di `MobileNav.tsx`, `Achievements.tsx`, `History.tsx`, `Settings.tsx`, `DisplaySettings.tsx`.
- **Risoluzione Syntax Error in `index.css`**: rimozione della parentesi graffa superflua e delle classi incompatibili.
- **Correzione Default Preferiti**:
  - Modifica dello schema `cabinet_bridge/shared/schema.ts` per impostare `favorite: ... default(false)`.
  - Migrazione / script per resettare `favorite = 0` per tutti i giochi esistenti nel database SQLite.
- **Risoluzione Regex in `release-health.test.ts`**: supporto per formato changelog Release Please `## [X.Y.Z]`.

### Non-Goals (YAGNI)
- Nessuna alterazione al backend Express, ai percorsi Ingress o ai motori di emulazione RetroArch / EmulatorJS.
- Nessuna dipendenza esterna aggiuntiva (mantenimento stretto dello stack attuale e conformità Ponytail).

---

## 4. Task Checklist

- [x] **Fase 1: Ripristino UI & Layout Stabile**
  - [x] Ripristinare `cabinet_bridge/client/src/components/dashboard-themes/HomeArcadeTheme.tsx` alla versione pre-`9da94e8`.
  - [x] Ripristinare `cabinet_bridge/client/src/components/GameDetailDialog.tsx` al modale centrato collaudato.
  - [x] Ripristinare `cabinet_bridge/client/src/components/MobileNav.tsx`.
  - [x] Ripristinare `cabinet_bridge/client/src/pages/Achievements.tsx`, `History.tsx`, `Settings.tsx`, `DisplaySettings.tsx`.
  - [x] Rimuovere il componente difettoso `cabinet_bridge/client/src/components/ConsoleTopBar.tsx`.
  - [x] Ripristinare `cabinet_bridge/client/src/index.css` eliminando la graffa spuria e i selettori corrotti.
  - [x] Verificare che non rimangano import orfani di `ConsoleTopBar` o token rimossi.
- [x] **Fase 2: Correzione Schema DB & Reset Preferiti**
  - [x] Aggiornare `uploadedRoms.favorite` in `cabinet_bridge/shared/schema.ts` a `.notNull().default(false)`.
  - [x] Aggiungere migrazione/istruzione SQL di reset `UPDATE uploaded_roms SET favorite = 0` all'avvio del database in `cabinet_bridge/server/storage.ts`.
- [x] **Fase 3: Allineamento Test & Build**
  - [x] Allineare `cabinet_bridge/server/__tests__/release-health.test.ts` con la regex per il formato `## [version]`.
  - [x] Eseguire `pnpm check` (TypeCheck).
  - [x] Eseguire `pnpm build` (compilazione Vite + esbuild).
  - [x] Eseguire `pnpm test` (suite unit test Vitest).
- [x] **Fase 4: Aggiornamento Documentazione**
  - [x] Aggiornare `docs/HANDOFF.md`.
  - [x] Spuntare tutte le voci del piano.

---

## 5. Strategia di Verifica Empirica

1. `cd cabinet_bridge && ./script/pnpm_run.sh check` -> TypeScript typecheck senza errori.
2. `cd cabinet_bridge && ./script/pnpm_run.sh build` -> Bundle Vite e server buildati con successo senza warning bloccanti.
3. `cd cabinet_bridge && ./script/pnpm_run.sh test` -> Tutti i test unitari (`release-health.test.ts`, `scale.test.ts`, ecc.) verdi.
4. Ispezione del codice sorgente di `GameDetailDialog.tsx`, `HomeArcadeTheme.tsx` e `index.css`.
