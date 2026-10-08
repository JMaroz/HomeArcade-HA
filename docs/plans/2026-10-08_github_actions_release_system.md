# Piano di Lavoro: GitHub Actions CI/CD e Release Automation

**Data**: 2026-10-08  
**Riferimento**: Ispirato ad architettura `streaming-hub-ha` ed evoluto per HomeArcade-HA

---

## 1. Obiettivo
Dotare `HomeArcade-HA` di una pipeline di validazione e rilascio solida e automatizzata:
1. Validazione continua (CI): linting YAML (`yamllint`), validazione Home Assistant Add-on (`frenck/action-addon-linter`), TypeScript check, Vitest unit test, linting s6-overlay e test build Docker.
2. Quality gate Pull Request: controllo formale delle convenzioni semantiche dei titoli PR (`amannn/action-semantic-pull-request`) per garantire compatibilità con Conventional Commits.
3. Automazione Release: adozione di Google Release Please (`release-please-action@v4`) con gestione automatica di `CHANGELOG.md`, `.release-please-manifest.json` e bumping di versione in `cabinet_bridge/config.yaml` e `cabinet_bridge/package.json`. Sincronizzazione automatica del changelog in `cabinet_bridge/CHANGELOG.md`.
4. Pubblicazione Immagini Container su GHCR: compilazione e push multi-arch (`amd64`, `aarch64`) isolata e scatenata esclusivamente alla pubblicazione ufficiale di una release (o tag `v*`), evitando sprechi di risorse CI su singoli push a `main`.

---

## 2. Decisioni Architetturali Concordate (/grill-me)
1. **Trigger Pubblicazione Docker GHCR**: Le immagini multi-arch (`amd64` / `aarch64`) vengono compilate e pubblicate su GHCR esclusivamente su tag di rilascio (`v*`) e GitHub Release, mentre la CI ordinaria esegue un test build veloce a singola architettura.
2. **Sincronizzazione Changelog**: Release Please gestisce il `CHANGELOG.md` primario alla radice del repository. `cabinet_bridge/CHANGELOG.md` viene mantenuto automaticamente sincronizzato all'interno del workflow di release.
3. **E2E e Playwright**: Rimosso lo step di installazione e download di Playwright Chromium (~300MB) dalla CI ordinaria, mantenendo la suite Vitest (oltre 90 test unitari e di integrazione) come quality gate rapido ed efficace.
4. **Organizzazione Workflow**:
   - `.github/workflows/lint.yml`: job paralleli rapidi (`yamllint`, `addon-lint`, `pr-lint`).
   - `.github/workflows/ci.yml`: job applicativo (`pnpm check`, `pnpm test`, `s6 lint`, `docker build`).
   - `.github/workflows/release-please.yml`: job di release management PR-driven.
   - `.github/workflows/build.yml`: job di pubblicazione Docker multi-arch su GHCR.

---

## 3. Scope & Non-Goals
- **In Scope**:
  - File di configurazione `.yamllint`.
  - File di configurazione `release-please-config.json` e `.release-please-manifest.json` (baseline versione 2.51.0).
  - Creazione `.github/workflows/lint.yml`.
  - Aggiornamento `.github/workflows/ci.yml` (concurrency group, rimozione playwright superfluo, ottimizzazione step).
  - Creazione `.github/workflows/release-please.yml` con sync changelog.
  - Aggiornamento `.github/workflows/build.yml` (trigger ristretto a tag `v*` e release events).
  - Aggiornamento documentazione `AGENTS.md` e `docs/HANDOFF.md`.
- **Non-Goals**:
  - Modifiche al codice applicativo di gioco o client React (YAGNI).
  - Aggiunta di pacchetti npm o dipendenze runtime non strettamente necessarie.

---

## 4. Task Checklist
- [x] Analisi architettura `streaming-hub-ha` vs `HomeArcade-HA`
- [x] Intervista e allineamento decisionale (/grill-me)
- [x] Creazione `.yamllint` alla radice
- [x] Creazione `release-please-config.json` e `.release-please-manifest.json`
- [x] Creazione `.github/workflows/lint.yml` (yamllint, HA addon-linter, PR semantic lint)
- [x] Ristrutturazione `.github/workflows/ci.yml` (concurrency, pnpm cache, test, s6, smoke build)
- [x] Implementazione `.github/workflows/release-please.yml` (release-please-action v4 + sync cabinet_bridge/CHANGELOG.md)
- [x] Aggiornamento `.github/workflows/build.yml` (trigger solo su release / tag `v*`)
- [x] Verifica empirica di validazione file, sintassi e test
- [x] Aggiornamento `docs/HANDOFF.md` e `AGENTS.md`

---

## 5. Strategia di Verifica
1. Controllo di validità sintattica YAML di tutti i workflow e configurazioni.
2. Esecuzione `pnpm check` in `cabinet_bridge` per garantire assenza di regressioni.
3. Test dell'allineamento delle versioni (2.51.0) in manifest, package.json e config.yaml.
4. Verifica con `git status` e `git diff` della conformità.
