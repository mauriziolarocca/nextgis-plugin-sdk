# 🗺️ NEXT GIS — Guida per gli Sviluppatori

> Come creare, testare e pubblicare una **NEXT App** sulla piattaforma NEXT GIS.

---

## Indice

1. [Cos'è una NEXT App](#1-cosè-una-next-app)
2. [Prerequisiti](#2-prerequisiti)
3. [Creare la tua prima NEXT App](#3-creare-la-tua-prima-next-app)
4. [Struttura del progetto](#4-struttura-del-progetto)
5. [L'API del contesto](#5-lapi-del-contesto)
6. [Testare in locale](#6-testare-in-locale)
7. [Pubblicare in DEV](#7-pubblicare-in-dev)
8. [Promuovere in TEST](#8-promuovere-in-test)
9. [Andare LIVE](#9-andare-live)
10. [CI/CD automatico con GitHub Actions](#10-cicd-automatico-con-github-actions)
11. [FAQ](#11-faq)

---

## 1. Cos'è una NEXT App

Una **NEXT App** (o plugin) è un modulo JavaScript/TypeScript che estende le funzionalità della piattaforma NEXT GIS. Può:

- aggiungere layer personalizzati alla mappa
- aprire pannelli laterali con UI propria
- leggere e modificare dati GIS
- accedere ai dati MNO (celle, siti radio)
- integrarsi con l'autenticazione della piattaforma

Le app seguono un ciclo di vita controllato:

```
sviluppo locale  →  DEV  →  TEST  →  LIVE
```

Ogni promozione è deliberata e separata — un aggiornamento in DEV non impatta mai TEST o LIVE.

---

## 2. Prerequisiti

| Strumento | Versione minima |
|-----------|----------------|
| Node.js   | 18+            |
| npm       | 9+             |
| Git       | 2.x            |
| Account GitHub | — |

**Registrazione al Developer Portal:**

1. Vai su **[dev-portal.nextgis.io](https://dev-portal.nextgis.io)**
2. Accedi con il tuo account GitHub
3. Crea un'app dal menu **Submit Plugin** — conserva il tuo **API Key**

---

## 3. Creare la tua prima NEXT App

### 3.1 Installa l'SDK

```bash
npm install @nextgis/plugin-sdk
```

### 3.2 Crea il file principale

```typescript
// src/index.ts
import { definePlugin } from '@nextgis/plugin-sdk';

export default definePlugin({

  manifest: {
    slug:        'mia-app',           // identificatore univoco, solo minuscole e trattini
    name:        'La Mia App',
    version:     '1.0.0',
    description: 'Descrizione breve visibile nel marketplace',
    author:      'Mario Rossi',
    homepage:    'https://github.com/tuo-user/mia-app',
    permissions: [
      'map:read',    // legge lo stato della mappa
      'map:write',   // aggiunge/rimuove layer
      'ui:panel',    // apre pannelli laterali
    ],
  },

  // Chiamato quando l'utente installa/attiva il plugin
  async onLoad(ctx) {

    // Aggiungi un layer alla mappa
    ctx.map.addLayer({
      id:   'mia-app-layer',
      type: 'circle',
      source: {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [],
        },
      },
      paint: {
        'circle-color':  '#e63946',
        'circle-radius': 8,
      },
    });

    // Mostra un messaggio all'utente
    ctx.ui.showToast('Mia App caricata ✅');

    // Reagisci ai click sulla mappa
    const unsub = ctx.map.onMapClick((e) => {
      console.log('Click a', e.lngLat.lat, e.lngLat.lng);
    });

    // Restituisci una funzione di cleanup (chiamata su onUnload)
    return () => unsub();
  },

  // Chiamato quando l'utente disattiva/disinstalla il plugin
  onUnload() {
    console.log('Mia App rimossa');
  },

});
```

---

## 4. Struttura del progetto

```
mia-app/
├── src/
│   └── index.ts          ← entry point del plugin
├── dist/                 ← bundle generato (non committare)
├── nextgis.manifest.json ← manifest del plugin
├── package.json
├── tsconfig.json
└── .github/
    └── workflows/
        └── publish-plugin.yml  ← CI/CD automatico (opzionale)
```

### `nextgis.manifest.json`

```json
{
  "slug":        "mia-app",
  "name":        "La Mia App",
  "version":     "1.0.0",
  "description": "Descrizione breve visibile nel marketplace",
  "author":      "Mario Rossi",
  "homepage":    "https://github.com/tuo-user/mia-app",
  "permissions": ["map:read", "map:write", "ui:panel"],
  "ui": {
    "panel":      true,
    "panelTitle": "La Mia App"
  }
}
```

### `package.json`

```json
{
  "name": "mia-app",
  "version": "1.0.0",
  "scripts": {
    "build": "npx tsup src/index.ts --format esm --dts --minify",
    "dev":   "npx tsup src/index.ts --format esm --watch"
  },
  "devDependencies": {
    "@nextgis/plugin-sdk": "latest",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0"
  }
}
```

---

## 5. L'API del contesto

Il parametro `ctx` dentro `onLoad` espone tutte le API della piattaforma, filtrate in base alle **permissions** dichiarate nel manifest.

### `ctx.map` — API Mappa *(richiede `map:read` / `map:write`)*

```typescript
ctx.map.flyTo({ center: [12.4964, 41.9028], zoom: 14 });
ctx.map.getBounds();                        // restituisce i bounds correnti
ctx.map.addLayer({ id, type, source, paint });
ctx.map.removeLayer('mia-app-layer');
ctx.map.onMapClick((e) => { /* e.lngLat, e.features */ });
ctx.map.onViewportChange((viewport) => { /* zoom, center, bounds */ });
```

### `ctx.features` — Query Feature *(richiede `data:read`)*

```typescript
const features = await ctx.features.queryInBounds(ctx.map.getBounds());
```

### `ctx.mno` — Dati MNO *(richiede `mno:read`)*

```typescript
const cells = await ctx.mno.getCells({ bounds: ctx.map.getBounds() });
const sites = await ctx.mno.getSites({ bounds: ctx.map.getBounds() });
```

### `ctx.ui` — Interfaccia *(richiede `ui:panel`)*

```typescript
ctx.ui.showToast('Operazione completata');
ctx.ui.openPanel('Il Mio Pannello');
ctx.ui.closePanel();
```

### `ctx.auth` — Utente corrente *(richiede `auth:read`)*

```typescript
const user = await ctx.auth.getUser();
console.log(user.email, user.name);
```

### `ctx.storage` — Storage locale *(richiede `storage:read` / `storage:write`)*

```typescript
await ctx.storage.set('config', { colore: '#ff0000' });
const config = await ctx.storage.get('config');
await ctx.storage.remove('config');
```

> **Nota:** ogni plugin ha il suo namespace di storage isolato — non può leggere i dati di altri plugin.

---

## 6. Testare in locale

### Build del bundle

```bash
npm run build
```

Il bundle viene generato in `dist/index.mjs`.

### Hosting locale del bundle

Il bundle deve essere raggiungibile via URL HTTP/HTTPS dalla piattaforma. Usa un server locale:

```bash
# Con npx
npx serve dist --cors

# Il bundle sarà disponibile a:
# http://localhost:3000/index.mjs
```

### Installazione manuale in NEXT GIS

1. Apri **NEXT GIS** → sidebar → **Store**
2. Scorri fino a **Installa da URL**
3. Inserisci: `http://localhost:3000/index.mjs`
4. Clicca **Installa** — il plugin si carica in tempo reale

---

## 7. Pubblicare in DEV

Quando il tuo plugin è pronto per essere testato sulla piattaforma:

### 7.1 Fai il build di produzione

```bash
npm run build
```

### 7.2 Carica il bundle

Carica `dist/index.mjs` su un host pubblico (es. GitHub Releases, AWS S3, Cloudflare R2).

Esempio con GitHub Release:
```bash
# Crea un tag e release su GitHub
git tag v1.0.0
git push origin v1.0.0
# Poi su GitHub: crea una Release e allega dist/index.mjs
# URL bundle: https://github.com/tuo-user/mia-app/releases/download/v1.0.0/index.mjs
```

### 7.3 Invia al Developer Portal

**Opzione A — Interfaccia web:**

1. Vai su **[dev-portal.nextgis.io](https://dev-portal.nextgis.io)** → **Submit Plugin**
2. Compila il form:
   - Nome, slug, descrizione, categoria
   - Bundle URL: `https://...index.mjs`
   - Versione, changelog
3. Clicca **Invia** — il plugin è in stato `pending`

**Opzione B — API diretta:**

```bash
curl -X POST https://marketplace.nextgis.io/v1/marketplace/apps/{slug}/versions \
  -H "X-API-Key: TUO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version": "1.0.0",
    "bundle_url": "https://...index.mjs",
    "changelog": "Prima versione",
    "envs": ["dev"]
  }'
```

### 7.4 Promozione in DEV

Dopo l'invio, il plugin viene automaticamente promosso in **DEV**. Puoi verificarlo in:

**Developer Portal → Environments**

```
DEV  ✅  v1.0.0    (attivo)
TEST  —   —
LIVE  —   —
```

---

## 8. Promuovere in TEST

Quando hai verificato il plugin in DEV:

### Via Developer Portal

1. **Developer Portal → Environments**
2. Nella card del tuo plugin → colonna **DEV** → pulsante **Promuovi a TEST**
3. Seleziona la versione → **Promuovi**

### Via API

```bash
curl -X POST https://marketplace.nextgis.io/v1/marketplace/apps/{slug}/promote?env=test \
  -H "X-API-Key: TUO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version_id": "ID_VERSIONE",
    "notes": "Pronto per test interno"
  }'
```

**Dopo la promozione:**

```
DEV  ✅  v1.0.0
TEST ✅  v1.0.0    ← ora attivo in TEST
LIVE  —   —
```

> ⚠️ L'ordine è obbligatorio: non è possibile promuovere direttamente in LIVE saltando TEST.

---

## 9. Andare LIVE

La promozione in LIVE richiede che la versione sia già in TEST **e** che il team NEXT GIS abbia approvato il plugin (stato `approved`).

### Via Developer Portal

1. **Developer Portal → Environments**
2. Colonna **TEST** → pulsante **Promuovi a LIVE**
3. Conferma → il plugin è visibile a tutti gli utenti NEXT GIS

### Via API

```bash
curl -X POST https://marketplace.nextgis.io/v1/marketplace/apps/{slug}/promote?env=live \
  -H "X-API-Key: TUO_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version_id": "ID_VERSIONE",
    "notes": "Release 1.0.0 stabile"
  }'
```

**Stato finale:**

```
DEV  ✅  v1.0.0
TEST ✅  v1.0.0
LIVE ✅  v1.0.0   ← visibile a tutti gli utenti 🚀
```

---

## 10. CI/CD automatico con GitHub Actions

Copia il file `.github/workflows/publish-plugin.yml` nella tua repo per automatizzare tutto il processo:

```yaml
# Si attiva ad ogni GitHub Release pubblicata
on:
  release:
    types: [published]
```

**Setup:**

1. Vai su **Developer Portal → My Plugins** → copia il tuo **API Key**
2. Nella tua repo GitHub → **Settings → Secrets → Actions**
3. Aggiungi:

| Secret | Valore |
|--------|--------|
| `NEXTGIS_API_KEY` | Il tuo API Key dal Developer Portal |
| `NEXTGIS_APP_SLUG` | Lo slug del tuo plugin (es. `mia-app`) |

**Flusso automatico:**

```
git tag v1.0.1 && git push origin v1.0.1
      ↓  Crea Release su GitHub
GitHub Actions:
  1. npm run build
  2. Allega bundle alla Release
  3. POST /v1/marketplace/apps/{slug}/versions
  4. Plugin promosso automaticamente in DEV ✅
```

Trovi il template completo in:
**[github.com/mauriziolarocca/nextgis-plugin-sdk/tree/main/templates/.github/workflows](https://github.com/mauriziolarocca/nextgis-plugin-sdk/tree/main/templates/.github/workflows)**

---

## 11. FAQ

**Q: Posso usare librerie esterne (React, Leaflet, ecc.)?**
Sì, ma devono essere incluse nel bundle (`tsup` le include automaticamente). Attenzione alle dimensioni — bundle troppo grandi rallentano il caricamento.

**Q: Il mio plugin può comunicare con il mio backend?**
Sì, puoi fare fetch verso il tuo server. Assicurati che il tuo backend supporti CORS per il dominio `nextgis.io`.

**Q: Cosa succede se publico una versione con un bug in LIVE?**
Puoi promuovere una versione precedente da DEV o TEST. La piattaforma mantiene la storia di tutte le versioni.

**Q: Posso avere più versioni in parallelo?**
Ogni ambiente (DEV/TEST/LIVE) ha esattamente una versione attiva per volta. Puoi avere versioni diverse nei diversi ambienti.

**Q: Come ricevo notifiche di review?**
Il team NEXT GIS ti contatta via email (quella del tuo account GitHub) quando cambia lo stato del tuo plugin.

**Q: Dove ottengo supporto?**
- Documentazione: **[dev-portal.nextgis.io/docs](https://dev-portal.nextgis.io/docs)**
- Issues SDK: **[github.com/mauriziolarocca/nextgis-plugin-sdk/issues](https://github.com/mauriziolarocca/nextgis-plugin-sdk/issues)**
- Email: **developers@nextgis.io**

---

*NEXT GIS Platform — Developer Guide v1.2.1 — © 2026 Arimas S.r.l.*
