# Handoff Sessione: Revisione Impostazioni, Scansione, Trasferimento e Sincronizzazione ROM

**Data**: 2026-10-09  
**Stato**: Intervista `/grill-me` completata — Piano approvato, pronto per Fase 1  
**Piano di Riferimento**: `docs/plans/2026-10-09_rom_management_and_settings_overhaul.md`  

---

## 1. Stato Corrente
- **Analisi di Mercato & Benchmark Eseguita**:
  - Confrontato lo stack attuale di HomeArcade-HA con progetti di riferimento (es. **RomM**, RetroArch, ecosistema Home Assistant add-on).
  - Punti critici identificati:
    1. *Scansione*: Polling cieco a 60 secondi con I/O continuo su disco, assenza di streaming del progresso, assenza di hash dei file importati via cartella e mancata riconciliazione automatica dei file cancellati su disco.
    2. *Upload*: Singolo stream HTTP vulnerabile a timeout e reset del proxy Home Assistant Ingress/Nginx su file grandi (CD/DVD per PS1/PS2). Mancanza di chunked upload con retry.
    3. *Sincronizzazione*: Dipendenza esclusiva da Google Drive con macchinosa configurazione OAuth (Client ID/Secret/Refresh Token via OAuth Playground) e salvataggio limitato agli stati (`.state`), trascurando i salvataggi nativi in-game (`.srm`/`.sav`) e protocolli standard come WebDAV.
    4. *UI Impostazioni*: Tab "Library" sovraffollata e monolitica con strumenti eterogenei privi di divisione logica chiara.
- **Decisioni di Design Condivise (Intervista /grill-me)**:
  - **Layout Impostazioni**: Tab "Gestione Libreria" riorganizzata con sezioni tematiche/accordion ad alto contrasto (*Cartelle & Scansione*, *Trasferimento ROM*, *Salute & Manutenzione*, *Backup & Sincronizzazione*, *Collezioni Smart*).
  - **Motore di Scansione**: Scansione on-demand con streaming SSE del progresso in tempo reale, calcolo hash (CRC32/MD5) e auto-riconciliazione dei file rimossi/spostati.
  - **Trasferimento ROM**: Chunked Upload a blocchi (16/32MB con retry e ripresa) per superare i limiti di HA Ingress + guida e rilevamento per cartelle dirette di rete (SMB/media).
  - **Sincronizzazione**: Supporto WebDAV (Nextcloud, Synology, NAS con URL/user/pwd) + Esportazione e Ripristino ZIP dei salvataggi (in-game `.srm`/`.sav` e stati), mantenendo Google Drive come fallback.
  - **Hashing & Scraping**: Hashing in background per identificazione certa + opzione di scraping mirato per i soli giochi privi di artwork/metadati.
  - **Strategia di Esecuzione**: Sviluppo incrementale in 4 fasi atomiche e testate singolarmente.

---

## 2. File Rilevanti

- [2026-10-09_rom_management_and_settings_overhaul.md](file:///Users/andrea/Repository/HomeArcade-HA/docs/plans/2026-10-09_rom_management_and_settings_overhaul.md): Piano di lavoro dettagliato con checklist per le 4 fasi.
- [scanner.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/scanner.ts): Modulo di scansione cartelle da arricchire con hashing e SSE.
- [routes/scanner.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/routes/scanner.ts): Route HTTP e SSE per la scansione.
- [routes/roms.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/routes/roms.ts): Route di upload e gestione ROM.
- [routes/vault.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/routes/vault.ts): Route di salute, pulizia e sincronizzazione.
- [RomUpload.tsx](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/components/RomUpload.tsx): Componente frontend di upload da potenziare con chunking.
- [LibrarySettings.tsx](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/client/src/pages/settings/LibrarySettings.tsx): UI impostazioni da riorganizzare modularmente.

---

- **Fase 1 Completata (Motore di Scansione Avanzato)**:
  - Implementato `computeFileHash` con MD5 streaming stdlib nativo (`node:crypto` + streams).
  - Aggiunto supporto Server-Sent Events (SSE) a `scanner.ts` e `/api/scanner/scan-stream` con eventi progressivi (`start`, `discover`, `processing`, `imported`, `pruned`, `complete`, `error`).
  - Implementata auto-riconciliazione in `doScan`: identificazione e potatura atomica (`pruned`) delle ROM eliminate da disco nelle cartelle monitorate, con backfill degli hash mancanti.
  - Aggiunto endpoint `/api/roms/scrape-missing` in `routes/scrape.ts` per scrape mirato via SSE sui soli titoli privi di artwork o descrizione.
  - Creato test di unità `server/__tests__/scanner.test.ts` (4 test su 4 superati). Suite unit test: 78/78 test verdi.
  - Verifica statica TypeScript: 0 errori (`pnpm check`).

---

## 2. File Rilevanti

- [2026-10-09_rom_management_and_settings_overhaul.md](file:///Users/andrea/Repository/HomeArcade-HA/docs/plans/2026-10-09_rom_management_and_settings_overhaul.md): Piano di lavoro strutturato aggiornato (Fase 1 completata).
- [scanner.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/scanner.ts): Motore di scansione con hash MD5 streaming, streaming eventi e auto-riconciliazione.
- [routes/scanner.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/routes/scanner.ts): Endpoint SSE `/api/scanner/scan-stream`.
- [routes/scrape.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/routes/scrape.ts): Endpoint SSE `/api/roms/scrape-missing`.
- [scanner.test.ts](file:///Users/andrea/Repository/HomeArcade-HA/cabinet_bridge/server/__tests__/scanner.test.ts): Test di unità dedicati al motore di scansione.

---

## 3. Prossimi Passi (Next Steps)
1. **Avvio Fase 2: Chunked Upload Resiliente**:
   - Creare le route backend `/api/roms/upload/init`, `/api/roms/upload/chunk`, `/api/roms/upload/complete` e `/api/roms/upload/cancel` in `routes/roms.ts`.
   - Gestire lo staging dei blocchi su disco (`dataPath("upload-chunks")`) e l'assemblaggio con stream pipeline.
   - Aggiornare `RomUpload.tsx` per supportare chunked upload a blocchi di 16/32MB con retry e ripresa automatica.
   - Test di unità per il chunked upload.

---

## 4. Comandi Utili

```bash
# Typecheck TypeScript (dal folder cabinet_bridge)
./script/pnpm_run.sh check

# Esecuzione test suite Vitest
./script/pnpm_run.sh test

# Avvio server di sviluppo locale (porta 5001 per evitare AirPlay su macOS)
PORT=5001 ./script/pnpm_run.sh dev
```
