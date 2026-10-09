# Piano di Lavoro: Riorganizzazione Impostazioni, Scansione Intelligente, Chunked Upload e Sincronizzazione Salvataggi

**Data**: 2026-10-09  
**Stato**: Approvato (esito intervista /grill-me) — Pronto per Fase 1  
**Autore**: Antigravity Pair-Programming  

---

## 1. Obiettivo
Rivedere e modernizzare in profondità la gestione complessiva delle ROM in HomeArcade-HA, allineando l'architettura ai migliori standard di settore (es. RomM, RetroArch, Home Assistant add-on guidelines):
1. **Scansione Intelligente**: Sostituire il polling cieco con scansione on-demand con streaming SSE del progresso in tempo reale, calcolo hash (CRC32/MD5) e riconciliazione automatica dei file rimossi/spostati.
2. **Trasferimento ROM Resiliente**: Implementare un sistema di **Chunked Upload** (a blocchi di 16-32MB) per superare i limiti di timeout e dimensione di Home Assistant Ingress/Nginx per grandi file (PS1, PS2, Dreamcast, fino a 4GB) con retry automatico, affiancato da guida e auto-rilevamento per directory dirette SMB/media.
3. **Sincronizzazione & Backup Salvataggi**: Integrare supporto **WebDAV** (Nextcloud, NAS Synology/TrueNAS con semplici credenziali URL/user/password), esportazione e ripristino archivio ZIP di tutti i salvataggi (in-game `.srm`/`.sav` e stati), mantenendo Google Drive come fallback.
4. **Scraping Mirato**: Aggiungere l'opzione di scraping selettivo per i soli giochi privi di artwork o metadati oltre al refresh globale.
5. **Riorganizzazione UI Impostazioni**: Strutturare la tab "Gestione Libreria" in sezioni modulari e ordinate (tab interne / accordion) per Cartelle & Scansione, Trasferimento ROM, Salute & Manutenzione, Backup & Sincronizzazione e Collezioni Smart.

---

## 2. Scope & Non-Goals

### In Scope
- **Backend Scanner**:
  - Endpoint SSE `/api/scanner/scan-stream` con eventi in tempo reale (`start`, `progress`, `rom_found`, `pruned`, `complete`, `error`).
  - Hashing in streaming (MD5 / CRC32) durante la scansione e memorizzazione in `romHash`.
  - Riconciliazione automatica dei file scomparsi da disco (marcatura o rimozione controllata).
- **Backend Upload**:
  - Endpoint per Chunked Upload: `/api/roms/upload/init`, `/api/roms/upload/chunk`, `/api/roms/upload/complete`.
  - Assembling stream sicuro dei chunk con controllo integrità e pulizia automatica di upload non completati.
- **Backend Sync & Backup**:
  - Client WebDAV leggero basato su `fetch` nativo (std-first/Ponytail: PUT, GET, PROPFIND).
  - Endpoint `/api/vault/saves-export` (download ZIP di tutti i salvataggi `.sav`, `.srm`, `.state`).
  - Endpoint `/api/vault/saves-import` (upload e ripristino archivio ZIP con auto-estrazione sicura).
  - Endpoint `/api/vault/webdav-test` e `/api/vault/webdav-sync`.
- **Backend Scrape**:
  - Endpoint `/api/roms/scrape-missing` per arricchire solo le ROM senza copertina o metadati.
- **Frontend UI**:
  - Componente `LibrarySettings.tsx` riorganizzato con tab interne chiare o card ad alto contrasto.
  - Indicatore visivo di progresso live per scansione e upload.
  - Interfaccia di configurazione WebDAV e pulsanti per Backup ZIP one-click.

### Non-Goals (YAGNI & Ponytail)
- Nessuna dipendenza esterna pesante non necessaria: WebDAV implementato con HTTP standard via `fetch` nativo.
- Nessuna alterazione al bootstrap del player degli emulatori o a RetroArch Core assets.
- Nessuna riscrittura del database da SQLite ad altri database: continuità totale con lo schema Drizzle esistente.

---

## 3. Task Checklist

### Fase 1: Motore di Scansione Avanzato (SSE, Hashing, Riconciliazione)
- [x] Implementare funzione di calcolo hash rapido durante la scansione in `cabinet_bridge/server/scanner.ts`.
- [x] Aggiungere supporto Server-Sent Events (SSE) a `cabinet_bridge/server/routes/scanner.ts` per streaming del progresso.
- [x] Implementare auto-riconciliazione dei file rimossi/orfani durante la scansione.
- [x] Aggiungere endpoint `/api/roms/scrape-missing` per scrape mirato dei titoli senza cover.
- [x] Test di unità per il nuovo scanner e route correlate (`server/__tests__/scanner.test.ts`).

### Fase 2: Chunked Upload Resiliente per File di Grandi Dimensioni
- [ ] Creare route backend per chunked upload (`init`, `chunk`, `complete`, `cancel`) in `cabinet_bridge/server/routes/roms.ts`.
- [ ] Gestire assemblaggio e memorizzazione temporanea in `dataPath("upload-chunks")` con pulizia orfani.
- [ ] Aggiornare `cabinet_bridge/client/src/components/RomUpload.tsx` per supportare upload a blocchi da 16/32MB con barra di avanzamento e retry automatico.
- [ ] Test di upload a blocchi (unit test / integration test).

### Fase 3: Sincronizzazione WebDAV & Backup ZIP dei Salvataggi
- [ ] Implementare client WebDAV nativo in `cabinet_bridge/server/webdav.ts` (test connessione, upload, download salvataggi).
- [ ] Implementare esportazione e importazione archivio ZIP dei salvataggi (in-game `.srm`/`.sav` e savestates) in `cabinet_bridge/server/routes/vault.ts`.
- [ ] Aggiungere campi di configurazione WebDAV a `shared/schema.ts` e memorizzazione in `integrationSettings`.
- [ ] Test di unità per WebDAV e gestione salvataggi.

### Fase 4: Riorganizzazione UI Impostazioni Libreria
- [ ] Ristrutturare `cabinet_bridge/client/src/pages/settings/LibrarySettings.tsx`:
  - Sotto-navigazione o sezioni tematiche chiare: *Cartelle & Scansione*, *Trasferimento ROM*, *Salute & Manutenzione*, *Collezioni Smart*.
- [ ] Integrare pannello WebDAV e pulsanti di Backup/Ripristino ZIP in `cabinet_bridge/client/src/pages/settings/ServicesSettings.tsx` (o tab integrata).
- [ ] Integrare monitor di progresso SSE in tempo reale per la scansione.
- [ ] Validazione visiva e test su responsive / mobile.

---

## 4. Strategia di Verifica Empirica (DoD)
- `pnpm check`: Controllo tipi TypeScript a 0 errori.
- `pnpm test`: Esecuzione suite completa Vitest (Happy-DOM, server tests, shared schema tests).
- Esecuzione test mirati su streaming SSE e chunked upload.
- Verifica build di produzione con `pnpm build`.
