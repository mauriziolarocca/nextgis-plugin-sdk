/**
 * @nextgis/plugin-sdk
 *
 * SDK for building NEXT GIS Platform plugins.
 *
 * @example
 * ```typescript
 * import type { NextGISPlugin, NextGISPluginContext } from '@nextgis/plugin-sdk';
 *
 * const MyPlugin: NextGISPlugin = {
 *   id: 'com.mycompany.my-plugin',
 *
 *   async onLoad(ctx: NextGISPluginContext) {
 *     ctx.ui.toast('My plugin loaded!', 'success');
 *
 *     ctx.map.onMapClick((lngLat) => {
 *       const text = `Clicked: ${lngLat.lat.toFixed(5)}, ${lngLat.lng.toFixed(5)}`;
 *       ctx.ui.toast(text, 'info');
 *     });
 *   },
 *
 *   onUnload() {
 *     console.log('Plugin unloaded');
 *   },
 * };
 *
 * export default MyPlugin;
 * ```
 */

export type {
  // Core types
  NextGISPlugin,
  NextGISPluginContext,
  PluginManifest,
  PluginPermission,

  // API types
  MapAPI,
  FeaturesAPI,
  MnoAPI,
  UIAPI,
  AuthAPI,
  StorageAPI,

  // GeoJSON helpers
  LngLat,
  BBox,
  GeoJSONFeatureCollection,
  GeoJSONFeature,
  LayerConfig,
  Unsubscribe,
} from './types';

// ── Helper: definePlugin ─────────────────────────────────────────────────────

import type { NextGISPlugin } from './types';

/**
 * Type-safe helper to define a plugin.
 * Equivalent to `export default plugin` but with full type inference.
 *
 * @example
 * ```typescript
 * export default definePlugin({
 *   id: 'com.acme.my-tool',
 *   async onLoad(ctx) { ... },
 * });
 * ```
 */
export function definePlugin(plugin: NextGISPlugin): NextGISPlugin {
  return plugin;
}

// ── SDK version ───────────────────────────────────────────────────────────────

export const SDK_VERSION = '1.0.0';
