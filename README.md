# @nextgis/plugin-sdk

Official SDK for building third-party plugins for the **NEXT GIS Platform**.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## What is it?

The NEXT GIS Plugin SDK lets you build fully sandboxed map plugins that run inside the NEXT GIS Platform. Plugins can interact with the map, data layers, the MNO module, the UI, auth, and persistent storage — all through a permission-based context API.

Plugins follow a managed promotion pipeline:

```
DEV → TEST → LIVE
```

---

## Install

```bash
npm install @nextgis/plugin-sdk
```

---

## Quick start

```typescript
import { definePlugin } from '@nextgis/plugin-sdk';

export default definePlugin({
  manifest: {
    slug:        'my-awesome-plugin',
    name:        'My Awesome Plugin',
    version:     '1.0.0',
    description: 'Does something great on the map',
    permissions: ['map:read', 'map:write', 'ui:panel'],
  },

  async onLoad(ctx) {
    ctx.map.addLayer({
      id:     'my-layer',
      type:   'circle',
      source: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
      paint:  { 'circle-color': '#ff0000', 'circle-radius': 6 },
    });

    ctx.ui.openPanel('My Plugin');

    const unsub = ctx.map.onMapClick((e) => {
      console.log('Clicked at', e.lngLat);
    });

    return () => unsub();
  },

  onUnload() {
    console.log('Plugin unloaded');
  },
});
```

---

## Permissions

| Permission     | What it grants                             |
|----------------|--------------------------------------------|
| `map:read`     | Read map state (viewport, layers, bounds)  |
| `map:write`    | Add/remove layers, fly to positions        |
| `data:read`    | Query GeoJSON features from platform layers|
| `mno:read`     | Read MNO cell/site data                    |
| `ui:panel`     | Open side panel, show toasts               |
| `auth:read`    | Read current user profile                  |
| `storage:read` | Read plugin-namespaced localStorage        |
| `storage:write`| Write plugin-namespaced localStorage       |

---

## Context API

```typescript
ctx.map        // MapAPI      — flyTo, addLayer, removeLayer, onMapClick, …
ctx.features   // FeaturesAPI — query features within bounds
ctx.mno        // MnoAPI      — getCells, getSites
ctx.ui         // UIAPI       — openPanel, closePanel, showToast
ctx.auth       // AuthAPI     — getUser
ctx.storage    // StorageAPI  — get, set, remove (namespaced per plugin)
```

---

## Publishing

### 1. Build your plugin

```bash
npm install && npm run build
```

### 2. Submit via Developer Portal

Go to **[dev-portal.nextgis.io](https://dev-portal.nextgis.io)** → Submit Plugin.

### 3. Automate with GitHub Actions

Copy `templates/.github/workflows/publish-plugin.yml` to your repo and set secrets:

| Secret             | Value                              |
|--------------------|------------------------------------|
| `NEXTGIS_API_KEY`  | Your API key from Developer Portal |
| `NEXTGIS_APP_SLUG` | Your plugin slug                   |

On every GitHub Release → plugin auto-submitted and promoted to **DEV**.

---

## License

MIT © 2026 [Arimas S.r.l.](https://arimas.com)
