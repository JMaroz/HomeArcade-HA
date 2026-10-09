# Piano di Lavoro: Branding, Icone & Asset per HomeArcade

**Data**: 2026-10-08  
**Stato**: In pianificazione / Allineamento proposte  

---

## 1. Obiettivo
Creare e integrare l'identità visiva e il set completo di asset grafici per **HomeArcade** (Home Assistant Add-on & Frontend Retrogaming):
- Icone ufficiali per l'Add-on Store e il Repository di Home Assistant.
- Branding e Social Preview per GitHub.
- Favicon, icone PWA e Web App per il frontend `cabinet_bridge`.
- Generazione tramite AI (`generate_image`) con ottimizzazione e ridimensionamento nativo macOS (`sips`) per diff minimi e massima qualità.

---

## 2. Scope & Non-Goals

### In Scope
- Ricerca tecnica approfondita su requisiti dimensionali e di formato (HA, GitHub, Web/PWA).
- Definizione di 3 direzioni concettuali (Neon Synthwave Arcade, Minimalist MD3 Home Fusion, Pixel CRT Badge).
- Intervista guidata (`/grill-me`) per allineamento su stile, asset prioritari e dettagli visivi.
- Generazione dell'icona master ad alta risoluzione.
- Creazione e collocazione dei file derivati:
  - `icon.png` nel root del repository (Add-on Repository icon)
  - `cabinet_bridge/icon.png` (Add-on icon in HA store, 256x256 / 512x512)
  - `cabinet_bridge/logo.png` (Add-on banner/logo, orizzontale ~2.5:1)
  - `cabinet_bridge/client/public/` (favicon.ico/svg, icon-192.png, icon-512.png, apple-touch-icon.png)
  - Aggiornamento di `manifest.json` e `index.html` per rimuovere gli SVG inline placeholder
  - `docs/assets/social-preview.png` (1280x640 per GitHub) e aggiornamento README con banner/logo.

### Non-Goals (YAGNI)
- Modifica della logica backend o dei controller di gioco.
- Aggiunta di dipendenze pesanti (ImageMagick, canvas, sharp) — utilizzo esclusivo di strumenti nativi (`sips`) e stdlib.

---

## 3. Specifiche Tecniche Asset Raccolte

| Destinazione | File | Dimensioni / Ratio | Formato / Note |
|---|---|---|---|
| **HA Repo Root** | `/icon.png` | 256x256 (1:1) | PNG, trasparenza, visualizzato nella lista repository |
| **HA Add-on Store** | `cabinet_bridge/icon.png` | 256x256 o 512x512 (1:1) | PNG trasparente o sagomato, visualizzato nelle card addon |
| **HA Add-on Header** | `cabinet_bridge/logo.png` | 500x200 o 600x240 (~2.5:1) | PNG, trasparenza, visualizzato nei dettagli addon |
| **PWA / Android** | `cabinet_bridge/client/public/icon-192.png` | 192x192 (1:1) | PNG standard per installazione PWA |
| **PWA / Android Splash** | `cabinet_bridge/client/public/icon-512.png` | 512x512 (1:1) | PNG ad alta risoluzione per splash screen PWA |
| **Apple Touch Icon** | `cabinet_bridge/client/public/apple-touch-icon.png` | 180x180 (1:1) | PNG per iOS Safari / Home Screen |
| **Browser Favicon** | `cabinet_bridge/client/public/favicon.svg` + `.ico` | Vettoriale / 32x32 | Per tab browser e bookmark |
| **GitHub Social Preview** | `docs/assets/social-preview.png` | 1280x640 (2:1) | PNG < 1MB, OpenGraph preview per condivisione repo |
| **GitHub Repo Avatar** | `docs/assets/avatar.png` | 1024x1024 (1:1) | PNG per avatar organizzazione/progetto |

---

## 4. Task Checklist
- [x] Ricerca requisiti tecnici e standard ecosistema completata
- [x] Formulazione e generazione grafica ad alta risoluzione delle 3 proposte visive
- [x] Scelta del concept definitivo da parte dell'utente (Proposta 1: Neon Synthwave Arcade & Home)
- [x] Generazione del logo orizzontale e del social preview banner
- [x] Elaborazione dei derivati (icone 1:1, banner HA, social preview, PWA favicons) con `sips`
- [x] Aggiornamento `manifest.json`, `index.html` e `README.md`
- [x] Esecuzione test di regressione (`pnpm check`, `pnpm vitest run client/`, `pnpm vitest run shared/`, `pnpm build`)
- [ ] Aggiornamento `docs/HANDOFF.md`

---

## 5. Strategia di Verifica
- Verifica integrità grafica con `sips -g pixelWidth -g pixelHeight` per ciascun asset generato.
- Validazione build e type-check: `cd cabinet_bridge && pnpm check`.
- Validazione test suite: `cd cabinet_bridge && pnpm test`.
- Ispezione visiva dei file generati.
