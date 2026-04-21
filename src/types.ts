/**
 * NEXT GIS Plugin SDK — Core Types
 *
 * Third-party developers implement the NextGISPlugin interface
 * and receive a NextGISPluginContext at runtime.
 */

// ── GeoJSON helpers ──────────────────────────────────────────────────────────

export interface LngLat {
  lng: number;
  lat: number;
}

export type BBox = [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export interface GeoJSONFeature {
  type: 'Feature';
  id?: string | number;
  geometry: {
    type: string;
    coordinates: unknown;
  };
  properties: Record<string, unknown>;
}

// ── Layer config ─────────────────────────────────────────────────────────────

export interface LayerConfig {
  id:     string;
  name:   string;
  type:   'geojson' | 'wms' | 'wfs' | 'vector' | 'raster';
  source: string | GeoJSONFeatureCollection;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  visible?: boolean;
}

// ── Plugin Manifest ──────────────────────────────────────────────────────────

export type PluginPermission =
  | 'map:layers:read'
  | 'map:layers:write'
  | 'api:features:read'
  | 'api:features:write'
  | 'api:mno:read'
  | 'api:mno:write'
  | 'api:tiles:read'
  | 'ui:panel'
  | 'ui:toolbar'
  | 'ui:contextmenu';

export interface PluginManifest {
  /** Reverse-DNS identifier, e.g. "com.acme.wind-heatmap" */
  id: string;
  name: string;
  version: string;
  /** URL to the ES module bundle */
  entry: string;
  type: 'map-plugin' | 'panel-plugin' | 'data-plugin';
  permissions: PluginPermission[];
  ui?: {
    sidebar_panel?: boolean;
    toolbar_button?: {
      icon: string;
      tooltip: string;
    };
    context_menu_item?: {
      label: string;
    };
  };
  /** Minimum NEXT GIS platform version required */
  nextgis_api_version: string;
}

// ── Plugin Context ────────────────────────────────────────────────────────────

export type Unsubscribe = () => void;

export interface MapAPI {
  /** Fly to a location on the map */
  flyTo(lng: number, lat: number, zoom?: number): void;

  /** Get current viewport bounding box */
  getBounds(): BBox;

  /** Get current zoom level */
  getZoom(): number;

  /** Add a layer to the map */
  addLayer(layer: LayerConfig): void;

  /** Remove a layer from the map */
  removeLayer(id: string): void;

  /** Check if a layer exists */
  hasLayer(id: string): boolean;

  /** Listen for map click events */
  onMapClick(cb: (lngLat: LngLat, features: GeoJSONFeature[]) => void): Unsubscribe;

  /** Listen for map right-click (context menu) events */
  onContextMenu(cb: (lngLat: LngLat) => void): Unsubscribe;

  /** Listen for map move/zoom events */
  onViewportChange(cb: (bbox: BBox, zoom: number) => void): Unsubscribe;
}

export interface FeaturesAPI {
  /** List features for a layer (with optional bbox filter) */
  list(layerId: string, opts?: { bbox?: BBox; limit?: number }): Promise<GeoJSONFeatureCollection>;

  /** Execute a spatial query */
  query(layerId: string, geometry: unknown): Promise<GeoJSONFeatureCollection>;
}

export interface MnoAPI {
  /** Fetch radio cells in viewport */
  cells(bbox: BBox): Promise<GeoJSONFeatureCollection>;

  /** Fetch estimated sites in viewport */
  sites(bbox: BBox): Promise<GeoJSONFeatureCollection>;

  /** Fetch stats for current viewport */
  stats(bbox: BBox): Promise<Record<string, unknown>>;
}

export interface UIAPI {
  /** Show a toast notification */
  toast(message: string, type?: 'info' | 'success' | 'warning' | 'error', duration?: number): void;

  /** Open a floating panel with a React component */
  openPanel(title: string, component: React.ComponentType<{ context: NextGISPluginContext }>): void;

  /** Close the plugin's panel */
  closePanel(): void;

  /** Add a button to the toolbar */
  addToolbarButton(opts: {
    id: string;
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
  }): Unsubscribe;

  /** Add an item to the right-click context menu */
  addContextMenuItem(opts: {
    id: string;
    label: string;
    onClick: (lngLat: LngLat) => void;
  }): Unsubscribe;
}

export interface AuthAPI {
  /** Get the current user's JWT access token */
  getToken(): Promise<string>;

  /** Current user ID (Keycloak sub) */
  userId: string;

  /** Current organization ID */
  orgId: string;

  /** User display name */
  displayName: string;
}

export interface StorageAPI {
  /** Persist key-value data (isolated per plugin) */
  set(key: string, value: unknown): void;

  /** Retrieve a persisted value */
  get<T = unknown>(key: string): T | null;

  /** Remove a persisted value */
  remove(key: string): void;
}

export interface NextGISPluginContext {
  map:     MapAPI;
  api: {
    features: FeaturesAPI;
    mno:      MnoAPI;
  };
  ui:      UIAPI;
  auth:    AuthAPI;
  storage: StorageAPI;

  /** Platform version string, e.g. "1.2.0.0" */
  platformVersion: string;
}

// ── Plugin interface — implement this ────────────────────────────────────────

export interface NextGISPlugin {
  /** Unique reverse-DNS plugin ID — must match manifest.id */
  readonly id: string;

  /** Called once when the plugin is loaded and permissions are granted */
  onLoad(context: NextGISPluginContext): void | Promise<void>;

  /** Called when the plugin is uninstalled or the user disables it */
  onUnload?(): void | Promise<void>;

  /** Called when the plugin's config changes */
  onConfigChange?(config: Record<string, unknown>): void | Promise<void>;
}
