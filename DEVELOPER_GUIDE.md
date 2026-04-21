# 🗺️ NEXT GIS — Developer Guide

> How to build, test and publish a **NEXT App** on the NEXT GIS Platform.

---

## Table of Contents

1. [What is a NEXT App](#1-what-is-a-next-app)
2. [How the DEV / TEST / LIVE pipeline works](#2-how-the-dev--test--live-pipeline-works)
3. [Prerequisites](#3-prerequisites)
4. [Create your first NEXT App](#4-create-your-first-next-app)
5. [Project structure](#5-project-structure)
6. [Context API reference](#6-context-api-reference)
7. [Test locally](#7-test-locally)
8. [Publish to DEV](#8-publish-to-dev)
9. [Promote to TEST](#9-promote-to-test)
10. [Go LIVE](#10-go-live)
11. [Automated CI/CD with GitHub Actions](#11-automated-cicd-with-github-actions)
12. [FAQ](#12-faq)

---

## 1. What is a NEXT App

A **NEXT App** (also called a plugin) is a JavaScript/TypeScript module that extends the NEXT GIS Platform. It can:

- Add custom layers to the map
- Open side panels with its own UI
- Read and write GIS data
- Access MNO data (cells, radio sites)
- Integrate with platform authentication
- Persist configuration in isolated storage

Apps run inside a sandboxed context — they can only access the APIs they explicitly declare as permissions in their manifest.

---

## 2. How the DEV / TEST / LIVE pipeline works

### Overview

Every NEXT App goes through three promotion stages before reaching end users:

```
Local development  →  DEV  →  TEST  →  LIVE
```

Each promotion is **deliberate and independent** — pushing a new version to DEV never affects TEST or LIVE. You can have different versions active in different environments at the same time.

### Environments are logical, not physical

The DEV / TEST / LIVE environments are **logical stages managed by the marketplace**, not separate servers. All three environments run inside the same `marketplace-service` on the NEXT GIS production infrastructure:

```
NEXT GIS Platform (single server)
    └── marketplace-service
            │
            ├── your-plugin
            │       ├── DEV  → v1.1.0  ← you are testing this
            │       ├── TEST → v1.0.0  ← under review by NEXT GIS team
            │       └── LIVE → v0.9.0  ← visible to all users
            │
            └── another-plugin
                    ├── DEV  → v2.0.0
                    ├── TEST → —
                    └── LIVE → v1.8.0
```

### What each environment means

| Environment | Who can see the plugin | Purpose |
|-------------|------------------------|---------|
| **DEV** | Only you (via your API Key) | Build and test your integration with the live platform |
| **TEST** | You + NEXT GIS team | Quality review before going public |
| **LIVE** | All NEXT GIS users | Production — visible in the marketplace |

> ⚠️ **Order is mandatory.** You cannot skip TEST and go directly from DEV to LIVE.

### Who controls what

| Action | Who can do it |
|--------|--------------|
| Submit a new version to DEV | Developer (API Key) |
| Promote DEV → TEST | Developer (API Key) |
| Review and approve the version | **NEXT GIS team only** |
| Promote TEST → LIVE | Developer (after approval) |
| Suspend / remove from LIVE | **NEXT GIS team only** |

### What end users see

The NEXT GIS marketplace **only shows LIVE plugins**. A plugin in DEV or TEST is completely invisible to regular users — only the developer who created it (via API Key) and the NEXT GIS team can see it during review.

### Parallel versions example

You can safely work on a new version while the previous one is still live:

```
DEV  → v2.0.0  ← you are actively developing
TEST → v1.1.0  ← under review
LIVE → v1.0.0  ← users are using this right now
```

---

## 3. Prerequisites

| Tool | Minimum version |
|------|----------------|
| Node.js | 18+ |
| npm | 9+ |
| Git | 2.x |
| GitHub account | — |

**Register on the Developer Portal:**

1. Go to **[dev-portal.nextgis.io](https://dev-portal.nextgis.io)**
2. Sign in with your GitHub account
3. Create an app from the **Submit Plugin** menu
4. Save your **API Key** — you will need it for publishing

---

## 4. Create your first NEXT App

### 4.1 Install the SDK

```bash
npm install @nextgis/plugin-sdk
```

### 4.2 Create the entry point

```typescript
// src/index.ts
import { definePlugin } from '@nextgis/plugin-sdk';

export default definePlugin({

  manifest: {
    slug:        'my-app',            // unique identifier — lowercase, hyphens only
    name:        'My App',
    version:     '1.0.0',
    description: 'Short description shown in the marketplace',
    author:      'Your Name',
    homepage:    'https://github.com/your-user/my-app',
    permissions: [
      'map:read',   // read map state
      'map:write',  // add/remove layers
      'ui:panel',   // open side panels
    ],
  },

  // Called when the user installs / enables the plugin
  async onLoad(ctx) {

    // Add a layer to the map
    ctx.map.addLayer({
      id:   'my-app-layer',
      type: 'circle',
      source: {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
      paint: {
        'circle-color':  '#e63946',
        'circle-radius': 8,
      },
    });

    // Show a toast message to the user
    ctx.ui.showToast('My App loaded ✅');

    // React to map clicks
    const unsub = ctx.map.onMapClick((e) => {
      console.log('Clicked at', e.lngLat.lat, e.lngLat.lng);
    });

    // Return a cleanup function (called on onUnload)
    return () => unsub();
  },

  // Called when the user disables / uninstalls the plugin
  onUnload() {
    console.log('My App removed');
  },

});
```

---

## 5. Project structure

```
my-app/
├── src/
│   └── index.ts              ← plugin entry point
├── dist/                     ← generated bundle (do not commit)
├── nextgis.manifest.json     ← plugin manifest
├── package.json
├── tsconfig.json
└── .github/
    └── workflows/
        └── publish-plugin.yml  ← optional CI/CD automation
```

### `nextgis.manifest.json`

```json
{
  "slug":        "my-app",
  "name":        "My App",
  "version":     "1.0.0",
  "description": "Short description shown in the marketplace",
  "author":      "Your Name",
  "homepage":    "https://github.com/your-user/my-app",
  "permissions": ["map:read", "map:write", "ui:panel"],
  "ui": {
    "panel":      true,
    "panelTitle": "My App"
  }
}
```

### `package.json`

```json
{
  "name": "my-app",
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

## 6. Context API reference

The `ctx` parameter inside `onLoad` exposes all platform APIs, filtered by the **permissions** declared in your manifest. Calling an API without the required permission throws an error at runtime.

### `ctx.map` — Map API *(requires `map:read` / `map:write`)*

```typescript
ctx.map.flyTo({ center: [12.4964, 41.9028], zoom: 14 });
ctx.map.getBounds();
ctx.map.addLayer({ id, type, source, paint });
ctx.map.removeLayer('my-app-layer');

// Event listeners — return an unsubscribe function
const unsub1 = ctx.map.onMapClick((e) => { /* e.lngLat, e.features */ });
const unsub2 = ctx.map.onViewportChange((viewport) => { /* zoom, center, bounds */ });
```

### `ctx.features` — Feature query *(requires `data:read`)*

```typescript
const features = await ctx.features.queryInBounds(ctx.map.getBounds());
```

### `ctx.mno` — MNO data *(requires `mno:read`)*

```typescript
const cells = await ctx.mno.getCells({ bounds: ctx.map.getBounds() });
const sites = await ctx.mno.getSites({ bounds: ctx.map.getBounds() });
```

### `ctx.ui` — UI *(requires `ui:panel`)*

```typescript
ctx.ui.showToast('Operation complete');
ctx.ui.openPanel('My Panel');
ctx.ui.closePanel();
```

### `ctx.auth` — Current user *(requires `auth:read`)*

```typescript
const user = await ctx.auth.getUser();
console.log(user.email, user.name);
```

### `ctx.storage` — Persistent storage *(requires `storage:read` / `storage:write`)*

```typescript
await ctx.storage.set('config', { color: '#ff0000' });
const config = await ctx.storage.get('config');
await ctx.storage.remove('config');
```

> **Note:** each plugin has its own isolated storage namespace — it cannot read data from other plugins.

---

## 7. Test locally

### Build the bundle

```bash
npm run build
# output: dist/index.mjs
```

### Serve the bundle locally

The bundle must be reachable via a public URL. During local development use a local server:

```bash
npx serve dist --cors
# bundle available at: http://localhost:3000/index.mjs
```

### Install manually in NEXT GIS

1. Open **NEXT GIS** → sidebar → **Store**
2. Scroll to **Install from URL**
3. Enter: `http://localhost:3000/index.mjs`
4. Click **Install** — the plugin loads in real time

---

## 8. Publish to DEV

When your plugin is ready to be tested on the live platform:

### Step 1 — Production build

```bash
npm run build
```

### Step 2 — Host the bundle

Upload `dist/index.mjs` to a public host (GitHub Releases, AWS S3, Cloudflare R2, etc.).

**Example using GitHub Releases:**

```bash
git tag v1.0.0
git push origin v1.0.0
# On GitHub: create a Release and attach dist/index.mjs as an asset
# Bundle URL: https://github.com/your-user/my-app/releases/download/v1.0.0/index.mjs
```

### Step 3 — Submit to the Developer Portal

**Option A — Web UI:**

1. Go to **[dev-portal.nextgis.io](https://dev-portal.nextgis.io)** → **Submit Plugin**
2. Fill in: name, slug, description, category, bundle URL, version, changelog
3. Click **Submit** — the plugin enters `pending` state

**Option B — REST API:**

```bash
curl -X POST https://marketplace.nextgis.io/v1/marketplace/apps/{slug}/versions \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version":    "1.0.0",
    "bundle_url": "https://...index.mjs",
    "changelog":  "Initial release",
    "envs":       ["dev"]
  }'
```

### Result

After submission the plugin is automatically promoted to **DEV**. Verify it in:

**Developer Portal → Environments**

```
DEV  ✅  v1.0.0    ← active, only visible to you
TEST  —   —
LIVE  —   —
```

---

## 9. Promote to TEST

Once you have verified your plugin in DEV, promote it to TEST for review by the NEXT GIS team.

### Via Developer Portal

1. **Developer Portal → Environments**
2. On your plugin card → **DEV** column → click **Promote to TEST**
3. Select the version → **Promote**

### Via API

```bash
curl -X POST https://marketplace.nextgis.io/v1/marketplace/apps/{slug}/promote?env=test \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version_id": "VERSION_ID",
    "notes":      "Ready for internal testing"
  }'
```

### After promotion

```
DEV  ✅  v1.0.0
TEST ✅  v1.0.0    ← now under review by NEXT GIS team
LIVE  —   —
```

**What happens next:**
- The NEXT GIS team reviews your plugin for quality and security
- You receive an email notification when the status changes
- If approved → you can promote to LIVE
- If rejected → you receive feedback, fix the issues, submit a new version to DEV

> ⚠️ You cannot skip TEST and promote directly from DEV to LIVE.

---

## 10. Go LIVE

A version can be promoted to LIVE only if it is already in TEST **and** has been approved by the NEXT GIS team (status: `approved`).

### Via Developer Portal

1. **Developer Portal → Environments**
2. **TEST** column → click **Promote to LIVE**
3. Confirm → the plugin is now visible to all NEXT GIS users

### Via API

```bash
curl -X POST https://marketplace.nextgis.io/v1/marketplace/apps/{slug}/promote?env=live \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "version_id": "VERSION_ID",
    "notes":      "Stable release 1.0.0"
  }'
```

### Final state

```
DEV  ✅  v1.0.0
TEST ✅  v1.0.0
LIVE ✅  v1.0.0   ← visible to all users 🚀
```

### Rolling back

If a LIVE version has a critical bug, you can re-promote any previous approved version from TEST without going through the full pipeline again:

```bash
curl -X POST https://marketplace.nextgis.io/v1/marketplace/apps/{slug}/promote?env=live \
  -H "X-API-Key: YOUR_API_KEY" \
  -d '{ "version_id": "PREVIOUS_VERSION_ID", "notes": "Rollback to v0.9.0" }'
```

---

## 11. Automated CI/CD with GitHub Actions

Copy `.github/workflows/publish-plugin.yml` from the SDK templates into your repo to automate the entire build and publish process:

```yaml
# Triggers on every published GitHub Release
on:
  release:
    types: [published]
```

### Setup

1. Go to **Developer Portal → My Plugins** → copy your **API Key**
2. In your GitHub repo → **Settings → Secrets → Actions**
3. Add the following secrets:

| Secret | Value |
|--------|-------|
| `NEXTGIS_API_KEY` | Your API Key from the Developer Portal |
| `NEXTGIS_APP_SLUG` | Your plugin slug (e.g. `my-app`) |

### Automated flow

```
git tag v1.0.1 && git push origin v1.0.1
      ↓  Create a GitHub Release
GitHub Actions:
  1. npm ci && npm run build
  2. Attach bundle to the GitHub Release
  3. POST /v1/marketplace/apps/{slug}/versions
  4. Plugin automatically promoted to DEV ✅
```

Find the full template at:
**[github.com/arimas-group/nextgis-plugin-sdk/tree/main/templates/.github/workflows](https://github.com/arimas-group/nextgis-plugin-sdk/tree/main/templates/.github/workflows)**

---

## 12. FAQ

**Q: Can I use external libraries (React, Leaflet, etc.)?**
Yes, but they must be bundled (`tsup` handles this automatically). Keep an eye on bundle size — large bundles slow down loading.

**Q: Can my plugin communicate with my own backend?**
Yes, you can fetch from your own server. Make sure your backend supports CORS for the `nextgis.io` domain.

**Q: What happens if I publish a buggy version to LIVE?**
You can roll back by re-promoting a previous approved version to LIVE immediately — no need to go through the full pipeline again.

**Q: Can I have multiple versions in different environments at the same time?**
Yes. Each environment (DEV / TEST / LIVE) has exactly one active version at a time, but they can all be different versions simultaneously.

**Q: How do I know when my plugin has been reviewed?**
The NEXT GIS team will notify you by email (the address linked to your GitHub account) whenever the status of your plugin changes.

**Q: Can I test my DEV plugin without affecting my LIVE version?**
Absolutely. DEV and LIVE are completely independent. Users on LIVE never see your DEV or TEST versions.

**Q: What is the review criteria?**
The NEXT GIS team checks: functionality, performance, security (no data exfiltration), declared permissions vs actual usage, and UI consistency with the platform.

**Q: Where do I get support?**
- Documentation: **[dev-portal.nextgis.io/docs](https://dev-portal.nextgis.io/docs)**
- SDK issues: **[github.com/arimas-group/nextgis-plugin-sdk/issues](https://github.com/arimas-group/nextgis-plugin-sdk/issues)**
- Email: **developers@nextgis.io**

---

*NEXT GIS Platform — Developer Guide v1.2.1 — © 2026 Arimas S.r.l.*
