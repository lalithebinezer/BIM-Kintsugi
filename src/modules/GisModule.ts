import * as THREE from "three";

export type GisBasemapProvider = "satellite" | "streets" | "dark" | "topo";

export interface GisProjectLocation {
  latitude: number;
  longitude: number;
  elevationAMSL: number; // meters Above Mean Sea Level
  trueNorthAngle: number; // degrees 0-360 clockwise from +Z
  crsName: string;
  address?: string;
  source?: "ifc-site" | "manual" | "preset";
}

export interface GisBasemapConfig {
  enabled: boolean;
  provider: GisBasemapProvider;
  radius: number; // meters (radius from project origin)
  elevationOffset: number; // vertical offset relative to 3D model ground (meters)
  opacity: number;
  resolution?: 1024 | 2048 | 4096; // canvas texture pixel resolution
}

export interface GisGeoJsonFeature {
  id: string;
  name: string;
  category: "parcel" | "setback" | "utility-water" | "utility-electric" | "utility-gas" | "utility-sewer";
  color: string;
  coordinates: [number, number][]; // [lon, lat] pairs
  depthOffset?: number; // negative for underground utilities
}

export interface GisCoordinatesTelemetry {
  lat: number;
  lon: number;
  latDms: string;
  lonDms: string;
  utmZone: string;
  utmEasting: number;
  utmNorthing: number;
  elevationAMSL: number;
  localX: number;
  localY: number;
  localZ: number;
}

export interface GisGeocodingResult {
  displayName: string;
  lat: number;
  lon: number;
  type?: string;
}

export interface GisSurveyControlPoint {
  id: string; // e.g. "BM-01", "GCP-01"
  name: string;
  code: string;
  type?: string;
  color?: string;
  localX: number;
  localY: number;
  localZ: number;
  latitude: number;
  longitude: number;
  elevationAMSL: number;
  easting: number;
  northing: number;
  description?: string;
}

export interface GisDistanceMeasurement {
  fromLat: number;
  fromLon: number;
  toLat: number;
  toLon: number;
  distanceMeters: number;
  distanceKm: number;
  initialBearingDegrees: number;
  elevationDeltaMeters: number;
  localDistance?: number;
  geodesicDistance?: number;
  initialBearing?: number;
  deltaElevation?: number;
}

export interface GisModelPlacement {
  modelId: string;
  x: number;
  y: number;
  z: number;
  rotationY: number;
  latitude: number;
  longitude: number;
  elevationAMSL: number;
  isLocked?: boolean;
}

export const GIS_LOCATION_PRESETS: Record<string, GisProjectLocation> = {
  tokyo: {
    latitude: 35.6895,
    longitude: 139.6917,
    elevationAMSL: 38.0,
    trueNorthAngle: 7.2,
    crsName: "EPSG:6677 (JGD2011 / Japan Plane Zone IX)",
    address: "Shinjuku, Tokyo, Japan",
    source: "preset",
  },
  london: {
    latitude: 51.5074,
    longitude: -0.1278,
    elevationAMSL: 14.5,
    trueNorthAngle: 0.8,
    crsName: "EPSG:27700 (OSGB36 / British National Grid)",
    address: "City of London, UK",
    source: "preset",
  },
  sanfrancisco: {
    latitude: 37.7749,
    longitude: -122.4194,
    elevationAMSL: 16.0,
    trueNorthAngle: 13.5,
    crsName: "EPSG:26910 (NAD83 / UTM Zone 10N)",
    address: "Market St, San Francisco, CA, USA",
    source: "preset",
  },
  newyork: {
    latitude: 40.7128,
    longitude: -74.006,
    elevationAMSL: 10.2,
    trueNorthAngle: 12.0,
    crsName: "EPSG:2263 (NAD83 / New York Long Island)",
    address: "Manhattan, New York, NY, USA",
    source: "preset",
  },
  dubai: {
    latitude: 25.1972,
    longitude: 55.2744,
    elevationAMSL: 8.0,
    trueNorthAngle: 2.1,
    crsName: "EPSG:3997 (WGS 84 / UTM Zone 40N)",
    address: "Downtown Dubai, UAE",
    source: "preset",
  },
  singapore: {
    latitude: 1.2838,
    longitude: 103.8591,
    elevationAMSL: 4.5,
    trueNorthAngle: 0.2,
    crsName: "EPSG:3414 (SVY21 / Singapore TM)",
    address: "Marina Bay, Singapore",
    source: "preset",
  },
  sydney: {
    latitude: -33.8568,
    longitude: 151.2153,
    elevationAMSL: 12.0,
    trueNorthAngle: 12.6,
    crsName: "EPSG:28356 (GDA94 / MGA Zone 56)",
    address: "Sydney Harbour, NSW, Australia",
    source: "preset",
  },
};

export class GisModule {
  private static instance: GisModule | null = null;
  private world: any = null;

  // State
  private location: GisProjectLocation = { ...GIS_LOCATION_PRESETS.sanfrancisco };
  private basemapConfig: GisBasemapConfig = {
    enabled: true,
    provider: "satellite",
    radius: 400,
    elevationOffset: -0.05,
    opacity: 0.95,
    resolution: 2048,
  };

  // 3D Scene Objects
  private basemapGroup: THREE.Group | null = null;
  private basemapMesh: THREE.Mesh | null = null;
  private cadastreGroup: THREE.Group | null = null;
  private compassGroup: THREE.Group | null = null;
  private surveyGroup: THREE.Group | null = null;
  private modelAnchorGroup: THREE.Group | null = null;
  private basemapCanvas: HTMLCanvasElement | null = null;
  private basemapTexture: THREE.CanvasTexture | null = null;
  private currentTileFetchId: number = 0;
  private tileFetchTimer: any = null;
  private tileCache: Map<string, HTMLImageElement> = new Map();
  private isSpaceView: boolean = false;
  private _isCompassVisible: boolean = true;
  private _isSurveyVisible: boolean = true;
  private miniMapZoom: number = 14;
  private miniMapCanvas: HTMLCanvasElement | null = null;

  // Model Placement on Map
  private modelPlacement: GisModelPlacement = {
    modelId: "all",
    x: 0,
    y: 0,
    z: 0,
    rotationY: 0,
    latitude: 0,
    longitude: 0,
    elevationAMSL: 0,
  };
  private isModelPlacementMode: boolean = false;
  private boundOn3DGroundClick: ((e: MouseEvent) => void) | null = null;

  // Features list
  private geoJsonFeatures: GisGeoJsonFeature[] = [];
  private surveyPoints: GisSurveyControlPoint[] = [];

  private constructor() {
    this.initDefaultSurveyPoints();
  }

  public static getInstance(): GisModule {
    if (!GisModule.instance) {
      GisModule.instance = new GisModule();
    }
    return GisModule.instance;
  }

  public init(world: any) {
    this.world = world;
    if (!this.world || !this.world.scene || !this.world.scene.three) return;

    if (!this.basemapGroup) {
      this.basemapGroup = new THREE.Group();
      this.basemapGroup.name = "gis-basemap-group";
      this.world.scene.three.add(this.basemapGroup);
    }

    if (!this.cadastreGroup) {
      this.cadastreGroup = new THREE.Group();
      this.cadastreGroup.name = "gis-cadastre-group";
      this.world.scene.three.add(this.cadastreGroup);
    }

    if (!this.compassGroup) {
      this.compassGroup = new THREE.Group();
      this.compassGroup.name = "gis-compass-group";
      this.world.scene.three.add(this.compassGroup);
    }

    if (!this.surveyGroup) {
      this.surveyGroup = new THREE.Group();
      this.surveyGroup.name = "gis-survey-group";
      this.world.scene.three.add(this.surveyGroup);
    }

    if (!this.modelAnchorGroup) {
      this.modelAnchorGroup = new THREE.Group();
      this.modelAnchorGroup.name = "gis-model-anchor-group";
      this.world.scene.three.add(this.modelAnchorGroup);
    }

    if (this.surveyPoints.length === 0) {
      this.initDefaultSurveyPoints();
    } else {
      this.rebuildSurveyPointsMesh();
    }

    this.rebuildCompassRose();
    this.rebuildModelAnchorMesh();

    if (this.basemapConfig.enabled) {
      this.rebuildBasemap();
    }
  }

  // ============================================================
  // GEOREFERENCING & LOCATION MANAGEMENT
  // ============================================================

  public getLocation(): GisProjectLocation {
    return { ...this.location };
  }

  public setLocation(loc: Partial<GisProjectLocation>) {
    this.location = { ...this.location, ...loc };
    if (this.basemapConfig.enabled) {
      this.rebuildBasemap();
    }
    if (this.geoJsonFeatures.length > 0) {
      this.rebuildCadastreMesh();
    }
    this.rebuildCompassRose();
    this.updateSurveyPointCoordinates();
    this.rebuildSurveyPointsMesh();
    if (this.miniMapCanvas) {
      this.renderMiniMap();
    }
  }

  public loadPresetLocation(presetKey: string) {
    const preset = GIS_LOCATION_PRESETS[presetKey.toLowerCase().replace(/[^a-z]/g, "")];
    if (preset) {
      this.setLocation(preset);
      return preset;
    }
    return null;
  }

  public applyPreset(name: string): GisProjectLocation | null {
    return this.loadPresetLocation(name);
  }

  /**
   * Performs asynchronous keyless address/landmark geocoding via OpenStreetMap Nominatim.
   */
  public async searchLocation(query: string): Promise<GisGeocodingResult[]> {
    const q = (query || "").trim();
    if (q.length < 2) return [];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      if (!Array.isArray(data)) return [];
      return data.map((item: any) => ({
        displayName: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type || item.class,
      }));
    } catch (err) {
      console.warn("Nominatim geocoding error:", err);
      return [];
    }
  }

  /**
   * Applies geocoded coordinates to project datum, rebuilds basemap, and updates solar position.
   */
  public applyGeocodedLocation(result: GisGeocodingResult) {
    this.setLocation({
      latitude: Number(result.lat.toFixed(6)),
      longitude: Number(result.lon.toFixed(6)),
      address: result.displayName,
      source: "manual",
    });

    const sun = this.calculateSolarPosition();
    if (typeof window !== "undefined" && typeof (window as any).updateSunPosition === "function") {
      (window as any).updateSunPosition(sun.azimuth, sun.elevation);
    }
  }

  public getIsSpaceView(): boolean {
    return this.isSpaceView;
  }

  /**
   * Toggles smooth cinematic flight between high-altitude space/regional orbit and site-level eye perspective.
   */
  public async toggleSpaceFlight(): Promise<boolean> {
    if (!this.world || !this.world.camera?.controls) return false;
    const controls = this.world.camera.controls as any;

    this.isSpaceView = !this.isSpaceView;

    if (this.isSpaceView) {
      // High-altitude orbital space view overlooking the regional basemap
      const alt = Math.max(1200, this.basemapConfig.radius * 2.2);
      await controls.setLookAt(0, alt, alt * 0.45, 0, 0, 0, true);
      const ticker = document.getElementById("ticker-camera-mode");
      if (ticker) ticker.textContent = `ORBITAL SPACE VIEW (${Math.round(alt)}m AMSL)`;
    } else {
      // Cinematic descent down to site isometric eye-level perspective
      const radius = Math.min(60, this.basemapConfig.radius * 0.15);
      const isoDist = Math.max(28, radius * 1.5);
      const isoNorm = 1 / Math.sqrt(3);
      await controls.setLookAt(
        isoNorm * isoDist,
        isoNorm * isoDist + 4,
        isoNorm * isoDist,
        0,
        2,
        0,
        true
      );
      const ticker = document.getElementById("ticker-camera-mode");
      if (ticker) ticker.textContent = "3D PERSPECTIVE ISOMETRIC";
    }

    this.triggerRender();
    return this.isSpaceView;
  }

  public getGeoreference(): { latitude: number; longitude: number; elevation: number; trueNorthRotation: number } {
    return {
      latitude: this.location.latitude,
      longitude: this.location.longitude,
      elevation: this.location.elevationAMSL,
      trueNorthRotation: this.location.trueNorthAngle,
    };
  }

  public setGeoreference(data: { latitude?: number; longitude?: number; elevation?: number; trueNorthRotation?: number }) {
    this.setLocation({
      latitude: data.latitude !== undefined ? data.latitude : this.location.latitude,
      longitude: data.longitude !== undefined ? data.longitude : this.location.longitude,
      elevationAMSL: data.elevation !== undefined ? data.elevation : this.location.elevationAMSL,
      trueNorthAngle: data.trueNorthRotation !== undefined ? data.trueNorthRotation : this.location.trueNorthAngle,
    });
  }

  public formatDMS(lat: number, lon: number): { latDms: string; lonDms: string } {
    return {
      latDms: this.toDms(lat, true),
      lonDms: this.toDms(lon, false),
    };
  }

  public getUtmZone(lat: number, lon: number): string {
    return this.toUtm(lat, lon).zone;
  }

  public setBasemapVisible(enabled: boolean) {
    this.setBasemapConfig({ enabled });
  }

  public setBasemapProvider(provider: GisBasemapProvider) {
    this.setBasemapConfig({ provider });
  }

  public setBasemapRadius(radius: number, fitView: boolean = false) {
    const clamped = Math.max(50, Math.min(5000, radius));
    this.setBasemapConfig({ radius: clamped });
    if (this.miniMapCanvas) {
      this.renderMiniMap();
    }
    if (fitView) {
      this.fitToBasemap();
    }
  }

  /**
   * Smoothly frames the 3D camera to fit the full geographic extent of the 3D Basemap ground plane.
   */
  public fitToBasemap() {
    if (!this.world || !this.world.camera?.controls || !this.basemapMesh) return;
    try {
      const box = new THREE.Box3().setFromObject(this.basemapMesh);
      const r = this.basemapConfig.radius;
      // Add vertical volume so fitToBox frames from an elevated aerial viewpoint
      box.min.y = this.basemapConfig.elevationOffset - r * 0.15;
      box.max.y = this.basemapConfig.elevationOffset + r * 0.85;

      const controls = this.world.camera.controls as any;
      if (typeof controls.fitToBox === "function") {
        controls.fitToBox(box, true);
      }
    } catch (e) {
      console.warn("fitToBasemap failed:", e);
    }
  }

  public setBasemapElevation(elevationOffset: number) {
    this.basemapConfig.elevationOffset = elevationOffset;
    if (this.basemapMesh) {
      this.basemapMesh.position.y = elevationOffset;
      this.triggerRender();
    }
  }

  public setBasemapOpacity(opacity: number) {
    this.basemapConfig.opacity = opacity;
    if (this.basemapMesh && this.basemapMesh.material instanceof THREE.MeshBasicMaterial) {
      this.basemapMesh.material.opacity = opacity;
      this.triggerRender();
    }
  }

  public setBasemapResolution(resolution: 1024 | 2048 | 4096) {
    this.setBasemapConfig({ resolution });
  }

  public clearCadastre() {
    this.clearGeoJsonFeatures();
  }

  public loadGeoJSON(data: any): { featureCount: number; layerNames: string[] } {
    const count = this.loadGeoJson(data);
    const layers = Array.from(new Set(this.geoJsonFeatures.map((f) => f.category)));
    return { featureCount: count, layerNames: layers };
  }

  public exportSiteGeoJson(): string {
    const lat = this.location.latitude;
    const lon = this.location.longitude;
    const originPoint = {
      type: "Feature",
      properties: {
        name: "Project Georeference Datum (Origin 0,0,0)",
        crs: this.location.crsName,
        elevationAMSL: this.location.elevationAMSL,
        trueNorthAngle: this.location.trueNorthAngle,
      },
      geometry: {
        type: "Point",
        coordinates: [lon, lat, this.location.elevationAMSL],
      },
    };

    const features: any[] = [originPoint];
    this.geoJsonFeatures.forEach((feat) => {
      features.push({
        type: "Feature",
        properties: {
          id: feat.id,
          name: feat.name,
          category: feat.category,
          color: feat.color,
          depthOffset: feat.depthOffset,
        },
        geometry: {
          type: feat.category.startsWith("utility") ? "LineString" : "Polygon",
          coordinates: feat.category.startsWith("utility") ? feat.coordinates : [feat.coordinates],
        },
      });
    });

    return JSON.stringify(
      {
        type: "FeatureCollection",
        metadata: {
          generator: "BIM Kintsugi GeoBIM Suite",
          timestamp: new Date().toISOString(),
          location: this.location,
        },
        features,
      },
      null,
      2
    );
  }

  /**
   * Attempts to parse `IfcSite`, `IfcMapConversion`, and `IfcProjectedCRS` metadata from fragment models or raw IFC text.
   */
  public parseIfcSiteMetadata(model: any): any {
    if (!model) return null;

    if (typeof model === "string") {
      let siteName = "IFC Site Location";
      let latitude = this.location.latitude;
      let longitude = this.location.longitude;
      let elevation = this.location.elevationAMSL;
      let mapConversion: any = undefined;
      let projectedCrs: any = undefined;

      // Extract IFCSITE
      const siteNameMatch = model.match(/IFCSITE\s*\(\s*'[^']*'\s*,\s*[^,]+\s*,\s*'([^']+)'/i);
      if (siteNameMatch) {
        siteName = siteNameMatch[1];
      }
      const coordsMatch = model.match(/IFCSITE[\s\S]*?\(\s*([-\d\s,]+)\s*\)\s*,\s*\(\s*([-\d\s,]+)\s*\)\s*,\s*([-\d.]+)/i);
      if (coordsMatch) {
        const latParts = coordsMatch[1].split(",").map((s) => parseFloat(s.trim()));
        const lonParts = coordsMatch[2].split(",").map((s) => parseFloat(s.trim()));
        if (latParts.length >= 3) {
          latitude = latParts[0] + latParts[1] / 60 + (latParts[2] + (latParts[3] || 0) / 1000000) / 3600;
        }
        if (lonParts.length >= 3) {
          longitude = lonParts[0] + lonParts[1] / 60 + (lonParts[2] + (lonParts[3] || 0) / 1000000) / 3600;
        }
        elevation = parseFloat(coordsMatch[3]) || elevation;
      }

      // Extract IFCMAPCONVERSION
      const mcMatch = model.match(/IFCMAPCONVERSION\s*\([^,]+,[^,]+,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)/i);
      if (mcMatch) {
        mapConversion = {
          eastings: parseFloat(mcMatch[1]),
          northings: parseFloat(mcMatch[2]),
          orthogonalHeight: parseFloat(mcMatch[3]),
        };
      }

      // Extract IFCPROJECTEDCRS
      const crsMatch = model.match(/IFCPROJECTEDCRS\s*\(\s*'([^']+)'\s*,\s*'([^']+)'/i);
      if (crsMatch) {
        projectedCrs = {
          name: crsMatch[1],
          description: crsMatch[2],
        };
      }

      const result = {
        siteName,
        latitude,
        longitude,
        elevation,
        mapConversion,
        projectedCrs,
      };

      this.setLocation({
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        elevationAMSL: Number(elevation.toFixed(2)),
        source: "ifc-site",
        address: siteName,
        crsName: projectedCrs?.name || this.location.crsName,
      });

      return result;
    }

    return (async () => {
      let foundGeoreference = false;
      try {
        if (typeof model.getAllPropertiesOfType === "function") {
          // 1. Look for IFCMAPCONVERSION & IFCPROJECTEDCRS (IFC4 standard)
          try {
            const mapConversions = await model.getAllPropertiesOfType("IFCMAPCONVERSION");
            if (mapConversions && Object.keys(mapConversions).length > 0) {
              const mc = Object.values(mapConversions)[0] as any;
              const elev = mc.OrthogonalHeight?.value ?? mc.OrthogonalHeight;
              const xAxisX = mc.XAxisAbscissa?.value ?? mc.XAxisAbscissa ?? 1;
              const xAxisY = mc.XAxisOrdinate?.value ?? mc.XAxisOrdinate ?? 0;
              const trueNorthRot = (Math.atan2(xAxisY, xAxisX) * 180) / Math.PI;

              if (typeof elev === "number" || typeof trueNorthRot === "number") {
                this.setLocation({
                  elevationAMSL: typeof elev === "number" ? Number(elev.toFixed(2)) : this.location.elevationAMSL,
                  trueNorthAngle: Number(trueNorthRot.toFixed(2)),
                  source: "ifc-site"
                });
                foundGeoreference = true;
              }
            }

            const crsList = await model.getAllPropertiesOfType("IFCPROJECTEDCRS");
            if (crsList && Object.keys(crsList).length > 0) {
              const crs = Object.values(crsList)[0] as any;
              const crsName = crs.Name?.value || crs.Name;
              if (crsName) {
                this.location.crsName = String(crsName);
                foundGeoreference = true;
              }
            }
          } catch {}

          // 2. Look for IFCSITE (express type 4096294205 or matching string)
          const sites = await model.getAllPropertiesOfType("IFCSITE");
          if (sites && Object.keys(sites).length > 0) {
            const firstSite = Object.values(sites)[0] as any;
            let latVal = firstSite.RefLatitude?.value || firstSite.RefLatitude;
            let lonVal = firstSite.RefLongitude?.value || firstSite.RefLongitude;
            let elevVal = firstSite.RefElevation?.value || firstSite.RefElevation;

            // Convert IFC DMS array [deg, min, sec, microsec] to decimal degrees
            if (Array.isArray(latVal) && latVal.length >= 3) {
              latVal = latVal[0] + latVal[1] / 60 + (latVal[2] + (latVal[3] || 0) / 1000000) / 3600;
            }
            if (Array.isArray(lonVal) && lonVal.length >= 3) {
              lonVal = lonVal[0] + lonVal[1] / 60 + (lonVal[2] + (lonVal[3] || 0) / 1000000) / 3600;
            }

            if (typeof latVal === "number" && typeof lonVal === "number" && !isNaN(latVal) && !isNaN(lonVal)) {
              this.setLocation({
                latitude: Number(latVal.toFixed(6)),
                longitude: Number(lonVal.toFixed(6)),
                elevationAMSL: typeof elevVal === "number" ? Number(elevVal.toFixed(2)) : this.location.elevationAMSL,
                source: "ifc-site",
                address: firstSite.Name?.value || "IFC Site Location",
              });
              return true;
            }
          }
        }
      } catch {
        // IFC site not parsed or not available in current model
      }
      return foundGeoreference;
    })();
  }

  // ============================================================
  // COORDINATE TRANSFORMATIONS & PROJECTIONS
  // ============================================================

  /**
   * Converts local Three.js (BIM) coordinates to WGS84 Geodetic Coordinates.
   * In Three.js: +X is East, -Z is North when trueNorthAngle = 0.
   */
  public localToGeodetic(localX: number, localZ: number): { lat: number; lon: number } {
    const R = 6378137.0; // WGS84 Earth equatorial radius in meters
    const theta = (this.location.trueNorthAngle * Math.PI) / 180;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    // Forward rotation: [localX, -localZ] rotated clockwise by trueNorthAngle
    const eastMeters = localX * cosT - localZ * sinT;
    const northMeters = -localZ * cosT - localX * sinT;

    const dLat = (northMeters / R) * (180 / Math.PI);
    const dLon = (eastMeters / (R * Math.cos((this.location.latitude * Math.PI) / 180))) * (180 / Math.PI);

    return {
      lat: Number((this.location.latitude + dLat).toFixed(7)),
      lon: Number((this.location.longitude + dLon).toFixed(7)),
    };
  }

  /**
   * Converts WGS84 Geodetic (Lat, Lon) to local Three.js coordinates relative to site origin.
   */
  public geodeticToLocal(lat: number, lon: number): { x: number; z: number } {
    const R = 6378137.0;
    const theta = (this.location.trueNorthAngle * Math.PI) / 180;
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);

    const dLat = ((lat - this.location.latitude) * Math.PI) / 180;
    const dLon = ((lon - this.location.longitude) * Math.PI) / 180;

    const northMeters = dLat * R;
    const eastMeters = dLon * R * Math.cos((this.location.latitude * Math.PI) / 180);

    // Inverse rotation:
    // [X]  =  [ cosT  -sinT ] [ eastMeters ]
    // [-Z] =  [ sinT   cosT ] [ northMeters ]
    const localX = eastMeters * cosT - northMeters * sinT;
    const localZ = -(eastMeters * sinT + northMeters * cosT);

    return { x: localX, z: localZ };
  }

  /**
   * Formats a decimal degree coordinate into human-readable DMS string (e.g. 37°46'29.6"N).
   */
  public toDms(deg: number, isLatitude: boolean): string {
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60 * 10) / 10;

    const direction = isLatitude ? (deg >= 0 ? "N" : "S") : deg >= 0 ? "E" : "W";
    return `${degrees}°${minutes}'${seconds.toFixed(1)}"${direction}`;
  }

  /**
   * Calculates UTM zone and projected coordinates.
   */
  public toUtm(lat: number, lon: number): { zone: string; easting: number; northing: number } {
    const zoneNum = Math.floor((lon + 180) / 6) + 1;
    const hemisphere = lat >= 0 ? "N" : "S";

    // Simplified Transverse Mercator estimation for engineering viewport readouts
    const latRad = (lat * Math.PI) / 180;
    const centralLon = (zoneNum - 1) * 6 - 180 + 3;
    const dLon = ((lon - centralLon) * Math.PI) / 180;

    const a = 6378137.0;
    const k0 = 0.9996;

    const x = k0 * a * dLon * Math.cos(latRad) + 500000;
    let y = k0 * a * latRad;
    if (lat < 0) y += 10000000;

    return {
      zone: `Zone ${zoneNum}${hemisphere}`,
      easting: Math.round(x),
      northing: Math.round(y),
    };
  }

  /**
   * Returns comprehensive GIS telemetry for a local 3D point.
   */
  public getCoordinatesTelemetry(localX: number, localY: number, localZ: number): GisCoordinatesTelemetry {
    const { lat, lon } = this.localToGeodetic(localX, localZ);
    const utm = this.toUtm(lat, lon);
    const elevationAMSL = Number((this.location.elevationAMSL + localY).toFixed(2));

    return {
      lat,
      lon,
      latDms: this.toDms(lat, true),
      lonDms: this.toDms(lon, false),
      utmZone: utm.zone,
      utmEasting: utm.easting,
      utmNorthing: utm.northing,
      elevationAMSL,
      localX: Number(localX.toFixed(2)),
      localY: Number(localY.toFixed(2)),
      localZ: Number(localZ.toFixed(2)),
    };
  }

  // ============================================================
  // NOAA ASTRONOMICAL SOLAR SIMULATION
  // ============================================================

  /**
   * Computes astronomical solar position (azimuth & elevation) for project location and date.
   */
  public calculateSolarPosition(date: Date = new Date()): { azimuth: number; elevation: number } {
    const lat = this.location.latitude;
    const lon = this.location.longitude;

    // Day of year and fractional hour
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const hours = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;

    // Solar Declination (Spencer formula)
    const gamma = (2 * Math.PI * (dayOfYear - 1 + (hours - 12) / 24)) / 365;
    const decl =
      0.006918 -
      0.399912 * Math.cos(gamma) +
      0.070257 * Math.sin(gamma) -
      0.006758 * Math.cos(2 * gamma) +
      0.000907 * Math.sin(2 * gamma);

    // Equation of Time in minutes
    const eqTime =
      229.18 *
      (0.000075 +
        0.001868 * Math.cos(gamma) -
        0.032077 * Math.sin(gamma) -
        0.014615 * Math.cos(2 * gamma) -
        0.040849 * Math.sin(2 * gamma));

    // Solar Time Offset in hours
    const timezoneOffset = -date.getTimezoneOffset() / 60;
    const timeOffset = eqTime + 4 * lon - 60 * timezoneOffset;
    const trueSolarTime = (hours * 60 + timeOffset) % 1440;

    // Solar Hour Angle
    const hourAngle = (trueSolarTime / 4 - 180) * (Math.PI / 180);

    const latRad = (lat * Math.PI) / 180;

    // Solar Zenith & Elevation Angle
    const csz = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(hourAngle);
    const zenithRad = Math.acos(Math.max(-1, Math.min(1, csz)));
    const elevationDeg = 90 - (zenithRad * 180) / Math.PI;

    // Solar Azimuth Angle (clockwise from North)
    const cosAzimuth =
      (Math.sin(decl) - Math.cos(zenithRad) * Math.sin(latRad)) / (Math.sin(zenithRad) * Math.cos(latRad));
    let azimuthDeg = (Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180) / Math.PI;
    if (hourAngle > 0) {
      azimuthDeg = 360 - azimuthDeg;
    }

    return {
      azimuth: Math.round(azimuthDeg),
      elevation: Math.round(Math.max(0, elevationDeg)),
    };
  }

  // ============================================================
  // 3D BASEMAP TILE MESH GENERATION
  // ============================================================

  public getBasemapConfig(): GisBasemapConfig {
    return { ...this.basemapConfig };
  }

  public setBasemapConfig(config: Partial<GisBasemapConfig>) {
    this.basemapConfig = { ...this.basemapConfig, ...config };
    this.rebuildBasemap();
  }

  public toggleBasemap(enabled?: boolean) {
    this.basemapConfig.enabled = enabled !== undefined ? enabled : !this.basemapConfig.enabled;
    this.rebuildBasemap();
  }

  /**
   * Reconstructs or updates the 3D ground basemap mesh.
   */
  public rebuildBasemap(immediateTiles: boolean = false) {
    if (!this.basemapGroup) return;

    if (!this.basemapConfig.enabled) {
      this.basemapGroup.visible = false;
      return;
    }

    this.basemapGroup.visible = true;

    const diameter = this.basemapConfig.radius * 2;
    const res = this.basemapConfig.resolution || 2048;

    // Initialize or resize high-res procedural canvas texture
    if (!this.basemapCanvas) {
      this.basemapCanvas = document.createElement("canvas");
    }
    if (this.basemapCanvas.width !== res || this.basemapCanvas.height !== res) {
      this.basemapCanvas.width = res;
      this.basemapCanvas.height = res;
      if (this.basemapTexture) {
        this.basemapTexture.needsUpdate = true;
      }
    }

    // Recreate geometry if size changed
    if (!this.basemapMesh) {
      const geo = new THREE.PlaneGeometry(diameter, diameter, 32, 32);
      geo.rotateX(-Math.PI / 2);

      this.renderBasemapTextureContent();

      this.basemapTexture = new THREE.CanvasTexture(this.basemapCanvas);
      this.basemapTexture.wrapS = THREE.ClampToEdgeWrapping;
      this.basemapTexture.wrapT = THREE.ClampToEdgeWrapping;
      this.basemapTexture.generateMipmaps = true;
      this.basemapTexture.minFilter = THREE.LinearMipmapLinearFilter;
      this.basemapTexture.magFilter = THREE.LinearFilter;
      const maxAnisotropy = this.world?.renderer?.three?.capabilities?.getMaxAnisotropy?.() ?? 16;
      this.basemapTexture.anisotropy = Math.max(1, Math.min(16, maxAnisotropy));
      if ((THREE as any).SRGBColorSpace) {
        this.basemapTexture.colorSpace = (THREE as any).SRGBColorSpace;
      }

      const mat = new THREE.MeshBasicMaterial({
        map: this.basemapTexture,
        transparent: true,
        opacity: this.basemapConfig.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      this.basemapMesh = new THREE.Mesh(geo, mat);
      this.basemapGroup.add(this.basemapMesh);
    } else {
      // Update dimensions to match exact radius
      this.basemapMesh.geometry.dispose();
      const geo = new THREE.PlaneGeometry(diameter, diameter, 32, 32);
      geo.rotateX(-Math.PI / 2);
      this.basemapMesh.geometry = geo;

      if (this.basemapMesh.material instanceof THREE.MeshBasicMaterial) {
        this.basemapMesh.material.opacity = this.basemapConfig.opacity;
      }
      this.renderBasemapTextureContent();
    }

    // Position and orient to true north
    this.basemapMesh.position.set(0, this.basemapConfig.elevationOffset, 0);
    this.basemapMesh.rotation.y = (-this.location.trueNorthAngle * Math.PI) / 180;
    this.triggerRender();

    // Debounce network tile fetching
    if (this.tileFetchTimer) {
      clearTimeout(this.tileFetchTimer);
      this.tileFetchTimer = null;
    }

    if (immediateTiles) {
      this.fetchTileImagery();
    } else {
      this.tileFetchTimer = setTimeout(() => {
        this.fetchTileImagery();
      }, 200);
    }
  }

  /**
   * Generates crisp procedural architectural basemap patterns and concentric metric distance markers.
   */
  private renderBasemapTextureContent() {
    if (!this.basemapCanvas) return;
    const ctx = this.basemapCanvas.getContext("2d");
    if (!ctx) return;

    const w = this.basemapCanvas.width;
    const h = this.basemapCanvas.height;
    const scale = w / 1024;
    const provider = this.basemapConfig.provider;

    ctx.clearRect(0, 0, w, h);

    // Color palettes per provider
    let bgFill = "#0c0e14";
    let gridMajor = "rgba(56, 189, 248, 0.25)";
    let gridMinor = "rgba(56, 189, 248, 0.08)";
    let ringColor = "rgba(212, 255, 63, 0.4)";

    if (provider === "satellite") {
      bgFill = "#0f171c";
      gridMajor = "rgba(16, 185, 129, 0.25)";
      gridMinor = "rgba(16, 185, 129, 0.08)";
      ringColor = "rgba(16, 185, 129, 0.45)";
    } else if (provider === "streets") {
      bgFill = "#1e2430";
      gridMajor = "rgba(148, 163, 184, 0.3)";
      gridMinor = "rgba(148, 163, 184, 0.1)";
      ringColor = "rgba(59, 130, 246, 0.4)";
    } else if (provider === "topo") {
      bgFill = "#141712";
      gridMajor = "rgba(234, 179, 8, 0.3)";
      gridMinor = "rgba(234, 179, 8, 0.08)";
      ringColor = "rgba(234, 179, 8, 0.45)";
    }

    // Fill background
    ctx.fillStyle = bgFill;
    ctx.fillRect(0, 0, w, h);

    // Draw metric coordinate grid centered on project origin (0, 0, 0)
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = this.basemapConfig.radius;
    const pxPerMeter = (w / 2) / radius;

    let gridStep = 50; // meters
    if (radius >= 1600) gridStep = 200;
    else if (radius >= 800) gridStep = 100;
    else if (radius <= 250) gridStep = 25;

    for (let d = 0; d <= radius; d += gridStep) {
      const isMajor = Math.round(d / gridStep) % 4 === 0;
      ctx.strokeStyle = isMajor ? gridMajor : gridMinor;
      ctx.lineWidth = (isMajor ? 1.5 : 1) * scale;

      // Positive & negative offsets from center
      const offsets = d === 0 ? [0] : [d, -d];
      offsets.forEach((offset) => {
        const x = centerX + offset * pxPerMeter;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();

        const y = centerY + offset * pxPerMeter;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      });
    }

    // Draw metric range rings
    this.drawMetricRangeRings(ctx, w, h, ringColor);

    // North arrow mark at top
    ctx.fillStyle = "#D4FF3F";
    ctx.beginPath();
    ctx.moveTo(centerX, 20 * scale);
    ctx.lineTo(centerX - 10 * scale, 45 * scale);
    ctx.lineTo(centerX + 10 * scale, 45 * scale);
    ctx.closePath();
    ctx.fill();

    ctx.font = `bold ${Math.round(16 * scale)}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("N", centerX - 6 * scale, 65 * scale);

    // Center origin reticle
    ctx.strokeStyle = "#D4FF3F";
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8 * scale, 0, Math.PI * 2);
    ctx.moveTo(centerX - 16 * scale, centerY);
    ctx.lineTo(centerX + 16 * scale, centerY);
    ctx.moveTo(centerX, centerY - 16 * scale);
    ctx.lineTo(centerX, centerY + 16 * scale);
    ctx.stroke();

    if (this.basemapTexture) {
      this.basemapTexture.needsUpdate = true;
    }
  }

  private drawMetricRangeRings(ctx: CanvasRenderingContext2D, w: number, h: number, ringColor: string) {
    const centerX = w / 2;
    const centerY = h / 2;
    const radius = this.basemapConfig.radius;
    const pxPerMeter = (w / 2) / radius;
    const scale = w / 1024;

    let interval = 100;
    if (radius >= 2000) interval = 500;
    else if (radius >= 800) interval = 250;
    else if (radius <= 250) interval = 50;

    ctx.lineWidth = 1.5 * scale;
    ctx.strokeStyle = ringColor;

    for (let d = interval; d <= radius; d += interval) {
      const rPx = d * pxPerMeter;
      ctx.beginPath();
      ctx.arc(centerX, centerY, rPx, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = ringColor;
      ctx.font = `bold ${Math.round(13 * scale)}px monospace`;
      ctx.fillText(`${d}m`, centerX + rPx + 4 * scale, centerY - 4 * scale);
    }

    // Outer boundary ring
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, (w / 2) * 0.98, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Asynchronously fetches georeferenced slippy map tiles matching the exact geographic
   * bounding box of the current basemap radius, ensuring 1:1 true metric scale.
   */
  private async fetchTileImagery() {
    const fetchId = ++this.currentTileFetchId;
    const provider = this.basemapConfig.provider;
    let tileUrlTemplate = "";

    if (provider === "satellite") {
      tileUrlTemplate = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    } else if (provider === "streets") {
      tileUrlTemplate = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    } else if (provider === "dark") {
      tileUrlTemplate = "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
    } else if (provider === "topo") {
      tileUrlTemplate = "https://tile.opentopomap.org/{z}/{x}/{y}.png";
    }

    if (!tileUrlTemplate) return;

    const R = this.basemapConfig.radius;
    const lat0 = this.location.latitude;
    const lon0 = this.location.longitude;
    const R_earth = 6378137.0;

    // Geographic bounding box for this radius extent in meters
    const dLatDeg = (R / R_earth) * (180 / Math.PI);
    const latMin = Math.max(-85.0511, lat0 - dLatDeg);
    const latMax = Math.min(85.0511, lat0 + dLatDeg);

    const cosLat = Math.cos((lat0 * Math.PI) / 180);
    const dLonDeg = (R / (R_earth * Math.max(0.01, cosLat))) * (180 / Math.PI);
    const lonMin = Math.max(-180, lon0 - dLonDeg);
    const lonMax = Math.min(180, lon0 + dLonDeg);

    if (!this.basemapCanvas) return;
    const canvasWidth = this.basemapCanvas.width;
    const canvasHeight = this.basemapCanvas.height;

    // Desired ground resolution in meters per pixel
    const groundRes = (2 * R) / canvasWidth;

    // Optimal Web Mercator zoom level for this extent (up to zoom 19 for crisp detail)
    let zoom = Math.round(Math.log2((156543.03 * Math.max(0.1, cosLat)) / groundRes));
    zoom = Math.max(12, Math.min(19, zoom));

    const lonToTileX = (lon: number, z: number) => ((lon + 180) / 360) * Math.pow(2, z);
    const latToTileY = (lat: number, z: number) => {
      const latRad = (lat * Math.PI) / 180;
      return ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * Math.pow(2, z);
    };

    let xStart = lonToTileX(lonMin, zoom);
    let xEnd = lonToTileX(lonMax, zoom);
    let yStart = latToTileY(latMax, zoom); // latMax (North) -> smaller tile Y
    let yEnd = latToTileY(latMin, zoom);   // latMin (South) -> larger tile Y

    let tileXMin = Math.floor(xStart);
    let tileXMax = Math.floor(xEnd);
    let tileYMin = Math.floor(yStart);
    let tileYMax = Math.floor(yEnd);

    // Limit maximum tiles to fetch in one pass based on resolution
    const maxTiles = canvasWidth >= 4096 ? 49 : canvasWidth >= 2048 ? 36 : 20;
    while ((tileXMax - tileXMin + 1) * (tileYMax - tileYMin + 1) > maxTiles && zoom > 10) {
      zoom--;
      xStart = lonToTileX(lonMin, zoom);
      xEnd = lonToTileX(lonMax, zoom);
      yStart = latToTileY(latMax, zoom);
      yEnd = latToTileY(latMin, zoom);
      tileXMin = Math.floor(xStart);
      tileXMax = Math.floor(xEnd);
      tileYMin = Math.floor(yStart);
      tileYMax = Math.floor(yEnd);
    }

    const imgPromises: Promise<{ img: HTMLImageElement; tx: number; ty: number } | null>[] = [];

    for (let tx = tileXMin; tx <= tileXMax; tx++) {
      for (let ty = tileYMin; ty <= tileYMax; ty++) {
        const url = tileUrlTemplate
          .replace("{z}", String(zoom))
          .replace("{x}", String(tx))
          .replace("{y}", String(ty));

        const cached = this.tileCache.get(url);
        if (cached && cached.complete && cached.naturalWidth > 0) {
          imgPromises.push(Promise.resolve({ img: cached, tx, ty }));
          continue;
        }

        const p = new Promise<{ img: HTMLImageElement; tx: number; ty: number } | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            if (this.tileCache.size > 300) {
              const firstKey = this.tileCache.keys().next().value;
              if (firstKey) this.tileCache.delete(firstKey);
            }
            this.tileCache.set(url, img);
            resolve({ img, tx, ty });
          };
          img.onerror = () => resolve(null);
          img.src = url;
        });
        imgPromises.push(p);
      }
    }

    try {
      const results = await Promise.all(imgPromises);
      // Discard if a newer fetch was initiated
      if (fetchId !== this.currentTileFetchId) return;

      if (!this.basemapCanvas) return;
      const ctx = this.basemapCanvas.getContext("2d");
      if (!ctx) return;

      // Re-render base background and grid
      this.renderBasemapTextureContent();

      const spanX = xEnd - xStart;
      const spanY = yEnd - yStart;

      results.forEach((res) => {
        if (res && res.img) {
          const destX = ((res.tx - xStart) / spanX) * canvasWidth;
          const destY = ((res.ty - yStart) / spanY) * canvasHeight;
          const destW = (1 / spanX) * canvasWidth;
          const destH = (1 / spanY) * canvasHeight;

          ctx.globalAlpha = 0.88;
          ctx.drawImage(res.img, destX, destY, destW, destH);
        }
      });
      ctx.globalAlpha = 1.0;

      // Re-overlay metric range markings and reticle
      this.overlayCadastralMarks(ctx, canvasWidth, canvasHeight);

      if (this.basemapTexture) {
        this.basemapTexture.needsUpdate = true;
      }
      this.triggerRender();
    } catch {
      // Offline fallback: keep high-contrast procedural grid intact
    }
  }

  private overlayCadastralMarks(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const centerX = w / 2;
    const centerY = h / 2;
    const scale = w / 1024;

    this.drawMetricRangeRings(ctx, w, h, "rgba(212, 255, 63, 0.65)");

    // Center crosshair / origin reticle
    ctx.strokeStyle = "#D4FF3F";
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6 * scale, 0, Math.PI * 2);
    ctx.moveTo(centerX - 18 * scale, centerY);
    ctx.lineTo(centerX + 18 * scale, centerY);
    ctx.moveTo(centerX, centerY - 18 * scale);
    ctx.lineTo(centerX, centerY + 18 * scale);
    ctx.stroke();
  }

  private triggerRender() {
    if (this.world?.renderer?.three && (this.world.renderer.three as any).render) {
      try {
        const threeRenderer = this.world.renderer.three;
        if (this.world.scene?.three && this.world.camera?.three) {
          threeRenderer.render(this.world.scene.three, this.world.camera.three);
        }
      } catch (e) {
        // Ignore in test or headless envs
      }
    }
  }

  // ============================================================
  // GEOJSON CADASTRAL PARCEL & MUNICIPAL UTILITY ENGINE
  // ============================================================

  public getGeoJsonFeatures(): GisGeoJsonFeature[] {
    return [...this.geoJsonFeatures];
  }

  public clearGeoJsonFeatures() {
    this.geoJsonFeatures = [];
    if (this.cadastreGroup) {
      while (this.cadastreGroup.children.length > 0) {
        const child = this.cadastreGroup.children[0] as any;
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
          else child.material.dispose();
        }
        this.cadastreGroup.remove(child);
      }
    }
  }

  /**
   * Loads a GeoJSON FeatureCollection or Geometry object.
   * Automatically parses Polygons, MultiPolygons, LineStrings, MultiLineStrings, and Points.
   * If autoCenter is true, updates the site georeference location to the centroid of the imported data.
   */
  public loadGeoJson(data: any, autoCenter: boolean = true): number {
    this.clearGeoJsonFeatures();
    if (!data) return 0;

    let rawFeatures: any[] = [];
    if (data.type === "FeatureCollection" && Array.isArray(data.features)) {
      rawFeatures = data.features;
    } else if (Array.isArray(data)) {
      rawFeatures = data;
    } else if (data.type === "Feature") {
      rawFeatures = [data];
    } else if (data.type && data.coordinates) {
      // Raw Geometry
      rawFeatures = [{ type: "Feature", geometry: data, properties: {} }];
    }

    if (rawFeatures.length === 0) return 0;

    interface ExtractedGeometry {
      name: string;
      category: string;
      color: string;
      depthOffset: number;
      type: "polygon" | "line" | "point";
      coordinates: [number, number][];
    }

    const extractedList: ExtractedGeometry[] = [];
    const allPoints: [number, number][] = [];

    rawFeatures.forEach((feat: any, idx: number) => {
      const geom = feat.geometry || feat;
      if (!geom || !geom.coordinates) return;

      const props = feat.properties || {};
      const cat = props.category || (String(geom.type).includes("Polygon") ? "parcel" : (String(geom.type).includes("Line") ? "utility-water" : "survey-point"));
      const name = props.name || props.title || props.id || `GIS Feature #${idx + 1}`;
      const color = props.color || props.stroke || props.fill || this.getDefaultColorForCategory(cat);
      const depthOffset = props.depthOffset || (cat.startsWith("utility") ? -1.5 : 0.05);

      const typeStr = (geom.type || "").toLowerCase();

      if (typeStr === "polygon") {
        if (Array.isArray(geom.coordinates) && Array.isArray(geom.coordinates[0])) {
          const ring: [number, number][] = geom.coordinates[0]
            .filter((pt: any) => Array.isArray(pt) && pt.length >= 2)
            .map((pt: any) => [Number(pt[0]), Number(pt[1])]);
          if (ring.length > 2) {
            extractedList.push({ name, category: cat, color, depthOffset, type: "polygon", coordinates: ring });
            allPoints.push(...ring);
          }
        }
      } else if (typeStr === "multipolygon") {
        if (Array.isArray(geom.coordinates)) {
          geom.coordinates.forEach((poly: any, pIdx: number) => {
            if (Array.isArray(poly) && Array.isArray(poly[0])) {
              const ring: [number, number][] = poly[0]
                .filter((pt: any) => Array.isArray(pt) && pt.length >= 2)
                .map((pt: any) => [Number(pt[0]), Number(pt[1])]);
              if (ring.length > 2) {
                extractedList.push({
                  name: `${name} (Part ${pIdx + 1})`,
                  category: cat,
                  color,
                  depthOffset,
                  type: "polygon",
                  coordinates: ring,
                });
                allPoints.push(...ring);
              }
            }
          });
        }
      } else if (typeStr === "linestring") {
        if (Array.isArray(geom.coordinates)) {
          const line: [number, number][] = geom.coordinates
            .filter((pt: any) => Array.isArray(pt) && pt.length >= 2)
            .map((pt: any) => [Number(pt[0]), Number(pt[1])]);
          if (line.length > 1) {
            extractedList.push({ name, category: cat, color, depthOffset, type: "line", coordinates: line });
            allPoints.push(...line);
          }
        }
      } else if (typeStr === "multilinestring") {
        if (Array.isArray(geom.coordinates)) {
          geom.coordinates.forEach((lineArr: any, lIdx: number) => {
            if (Array.isArray(lineArr)) {
              const line: [number, number][] = lineArr
                .filter((pt: any) => Array.isArray(pt) && pt.length >= 2)
                .map((pt: any) => [Number(pt[0]), Number(pt[1])]);
              if (line.length > 1) {
                extractedList.push({
                  name: `${name} (Segment ${lIdx + 1})`,
                  category: cat,
                  color,
                  depthOffset,
                  type: "line",
                  coordinates: line,
                });
                allPoints.push(...line);
              }
            }
          });
        }
      } else if (typeStr === "point") {
        if (Array.isArray(geom.coordinates) && geom.coordinates.length >= 2) {
          const pt: [number, number] = [Number(geom.coordinates[0]), Number(geom.coordinates[1])];
          extractedList.push({ name, category: cat, color, depthOffset, type: "point", coordinates: [pt] });
          allPoints.push(pt);
        }
      }
    });

    if (extractedList.length === 0 || allPoints.length === 0) return 0;

    // Auto-Centering to GeoJSON centroid if distant or requested
    if (autoCenter) {
      let sumLon = 0;
      let sumLat = 0;
      let validCount = 0;
      allPoints.forEach(([lon, lat]) => {
        if (!isNaN(lon) && !isNaN(lat) && lon >= -180 && lon <= 180 && lat >= -90 && lat <= 90) {
          sumLon += lon;
          sumLat += lat;
          validCount++;
        }
      });

      if (validCount > 0) {
        const centerLon = sumLon / validCount;
        const centerLat = sumLat / validCount;

        // Approximate distance to current project origin in meters
        const currentDist = Math.hypot(
          (centerLon - this.location.longitude) * 111320 * Math.cos((centerLat * Math.PI) / 180),
          (centerLat - this.location.latitude) * 110540
        );

        // If distance exceeds 50 meters, re-anchor location datum to GeoJSON centroid
        if (currentDist > 50) {
          this.setLocation({
            latitude: Number(centerLat.toFixed(6)),
            longitude: Number(centerLon.toFixed(6)),
            source: "manual",
            address: data.name || (data.metadata?.title) || "Imported Cadastre Site",
          });
        }

        // Compute max radius to encompass all imported features
        let maxRadiusMeters = 200;
        allPoints.forEach(([lon, lat]) => {
          const dMeters = Math.hypot(
            (lon - centerLon) * 111320 * Math.cos((centerLat * Math.PI) / 180),
            (lat - centerLat) * 110540
          );
          if (dMeters > maxRadiusMeters) maxRadiusMeters = dMeters;
        });

        const optimalRadius = Math.max(300, Math.min(2500, Math.ceil((maxRadiusMeters * 1.3) / 50) * 50));
        this.setBasemapConfig({
          enabled: true,
          radius: optimalRadius,
        });
      }
    }

    extractedList.forEach((item, idx) => {
      this.geoJsonFeatures.push({
        id: `feat-${idx}`,
        name: item.name,
        category: item.category as any,
        color: item.color,
        coordinates: item.coordinates,
        depthOffset: item.depthOffset,
      });
    });

    this.rebuildCadastreMesh();
    return this.geoJsonFeatures.length;
  }

  /**
   * Generates sample municipal property boundaries, setbacks, and underground utilities.
   */
  public loadDemoCadastre(): { featureCount: number; layerNames: string[] } {
    const lat = this.location.latitude;
    const lon = this.location.longitude;

    // Site parcel polygon (~80m x 60m)
    const p1 = this.offsetCoord(lat, lon, -40, -30);
    const p2 = this.offsetCoord(lat, lon, 40, -30);
    const p3 = this.offsetCoord(lat, lon, 40, 30);
    const p4 = this.offsetCoord(lat, lon, -40, 30);

    // Setback envelope (6m inside parcel)
    const s1 = this.offsetCoord(lat, lon, -34, -24);
    const s2 = this.offsetCoord(lat, lon, 34, -24);
    const s3 = this.offsetCoord(lat, lon, 34, 24);
    const s4 = this.offsetCoord(lat, lon, -34, 24);

    // Underground utilities
    const waterStart = this.offsetCoord(lat, lon, -45, -35);
    const waterEnd = this.offsetCoord(lat, lon, 15, -35);
    const waterBranch = this.offsetCoord(lat, lon, 15, -10);

    const electricStart = this.offsetCoord(lat, lon, -45, 35);
    const electricEnd = this.offsetCoord(lat, lon, 0, 35);
    const electricBranch = this.offsetCoord(lat, lon, 0, 10);

    const demoData = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Property Boundary Line (Parcel #104-A)", category: "parcel", color: "#D4FF3F" },
          geometry: { type: "Polygon", coordinates: [[p1, p2, p3, p4, p1]] },
        },
        {
          type: "Feature",
          properties: { name: "6.0m Municipal Zoning Setback Envelope", category: "setback", color: "#38BDF8" },
          geometry: { type: "Polygon", coordinates: [[s1, s2, s3, s4, s1]] },
        },
        {
          type: "Feature",
          properties: {
            name: "Underground Potable Water Main (DN150 HDPE)",
            category: "utility-water",
            color: "#00E5FF",
            depthOffset: -1.8,
          },
          geometry: { type: "LineString", coordinates: [waterStart, waterEnd, waterBranch] },
        },
        {
          type: "Feature",
          properties: {
            name: "High-Voltage Power Service Feed (24kV Conduits)",
            category: "utility-electric",
            color: "#F59E0B",
            depthOffset: -1.2,
          },
          geometry: { type: "LineString", coordinates: [electricStart, electricEnd, electricBranch] },
        },
      ],
    };

    const count = this.loadGeoJson(demoData);
    const layers = Array.from(new Set(this.geoJsonFeatures.map((f) => f.category)));
    return { featureCount: count, layerNames: layers };
  }

  private offsetCoord(lat: number, lon: number, xMeters: number, zMeters: number): [number, number] {
    const R = 6378137.0;
    const dLat = (-zMeters / R) * (180 / Math.PI);
    const dLon = (xMeters / (R * Math.cos((lat * Math.PI) / 180))) * (180 / Math.PI);
    return [lon + dLon, lat + dLat];
  }

  private getDefaultColorForCategory(cat: string): string {
    switch (cat) {
      case "parcel":
        return "#D4FF3F";
      case "setback":
        return "#38BDF8";
      case "utility-water":
        return "#00E5FF";
      case "utility-electric":
        return "#F59E0B";
      case "utility-gas":
        return "#EF4444";
      case "utility-sewer":
        return "#10B981";
      default:
        return "#A855F7";
    }
  }

  /**
   * Fits camera view to cadastre or basemap geometry.
   */
  public fitToCadastre() {
    if (!this.world || !this.world.camera?.controls) return;
    const box = new THREE.Box3();
    if (this.cadastreGroup && this.cadastreGroup.children.length > 0) {
      box.setFromObject(this.cadastreGroup);
    } else if (this.basemapMesh) {
      box.setFromObject(this.basemapMesh);
    }
    if (!box.isEmpty()) {
      try {
        const controls = this.world.camera.controls as any;
        if (typeof controls.fitToBox === "function") {
          controls.fitToBox(box, true);
        }
      } catch (e) {
        console.warn("fitToCadastre failed:", e);
      }
    }
  }

  /**
   * Renders 3D polylines, pin markers, and tube geometries for cadastral parcel boundaries & utilities.
   */
  private rebuildCadastreMesh() {
    if (!this.cadastreGroup) return;

    // Clear existing
    while (this.cadastreGroup.children.length > 0) {
      const child = this.cadastreGroup.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      this.cadastreGroup.remove(child);
    }

    this.geoJsonFeatures.forEach((feat) => {
      const points: THREE.Vector3[] = [];
      feat.coordinates.forEach(([lon, lat]) => {
        const local = this.geodeticToLocal(lat, lon);
        points.push(new THREE.Vector3(local.x, feat.depthOffset || 0.05, local.z));
      });

      if (points.length === 0) return;

      if (points.length === 1) {
        // Point landmark / survey marker pin
        const pinGeo = new THREE.ConeGeometry(1.2, 3.5, 8);
        pinGeo.rotateX(Math.PI);
        pinGeo.translate(0, 1.75, 0);
        const pinMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(feat.color),
        });
        const pinMesh = new THREE.Mesh(pinGeo, pinMat);
        pinMesh.position.copy(points[0]);
        pinMesh.name = feat.name;
        this.cadastreGroup?.add(pinMesh);
        return;
      }

      if (feat.category.startsWith("utility")) {
        // Create 3D underground pipeline tube
        const curve = new THREE.CatmullRomCurve3(points);
        curve.curveType = "catmullrom";
        const tubeGeo = new THREE.TubeGeometry(curve, Math.max(12, points.length * 6), 0.25, 8, false);
        const tubeMat = new THREE.MeshBasicMaterial({
          color: new THREE.Color(feat.color),
          wireframe: false,
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        tubeMesh.name = feat.name;
        this.cadastreGroup?.add(tubeMesh);
      } else {
        // Create boundary line or loop
        const isClosed =
          points.length > 2 &&
          (feat.category === "parcel" ||
            feat.category === "setback" ||
            points[0].distanceTo(points[points.length - 1]) < 0.1);
        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(feat.color),
          linewidth: 2,
        });
        const lineMesh = isClosed ? new THREE.LineLoop(lineGeo, lineMat) : new THREE.Line(lineGeo, lineMat);
        lineMesh.name = feat.name;
        this.cadastreGroup?.add(lineMesh);
      }
    });

    // Trigger Three.js render
    this.triggerRender();
  }

  // ============================================================
  // 3D TRUE NORTH COMPASS ROSE & CAMERA ALIGNMENT
  // ============================================================

  /**
   * Rebuilds the 3D True North Compass Rose on the ground plane.
   */
  public rebuildCompassRose() {
    if (!this.compassGroup) return;

    // Clear existing
    while (this.compassGroup.children.length > 0) {
      const child = this.compassGroup.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      this.compassGroup.remove(child);
    }

    if (!this._isCompassVisible) {
      this.compassGroup.visible = false;
      return;
    }
    this.compassGroup.visible = true;

    const radius = Math.min(32, Math.max(12, this.basemapConfig.radius * 0.08));
    const elev = this.basemapConfig.elevationOffset + 0.12;

    // 1. Outer Ring
    const segments = 64;
    const ringPts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      ringPts.push(new THREE.Vector3(Math.cos(theta) * radius, elev, Math.sin(theta) * radius));
    }
    const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
    const ringMat = new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.65 });
    const ringLine = new THREE.LineLoop(ringGeo, ringMat);
    this.compassGroup.add(ringLine);

    // 2. Inner Ring
    const innerRadius = radius * 0.72;
    const innerPts: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      innerPts.push(new THREE.Vector3(Math.cos(theta) * innerRadius, elev, Math.sin(theta) * innerRadius));
    }
    const innerGeo = new THREE.BufferGeometry().setFromPoints(innerPts);
    const innerMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
    const innerLine = new THREE.LineLoop(innerGeo, innerMat);
    this.compassGroup.add(innerLine);

    // 3. Compass Rose Ticks (every 30 degrees, large at cardinals)
    const tickPts: THREE.Vector3[] = [];
    for (let deg = 0; deg < 360; deg += 30) {
      const rad = (deg * Math.PI) / 180;
      const isCardinal = deg % 90 === 0;
      const r1 = isCardinal ? radius * 0.58 : radius * 0.76;
      const r2 = radius * 1.04;
      tickPts.push(new THREE.Vector3(Math.sin(rad) * r1, elev, -Math.cos(rad) * r1));
      tickPts.push(new THREE.Vector3(Math.sin(rad) * r2, elev, -Math.cos(rad) * r2));
    }
    const tickGeo = new THREE.BufferGeometry().setFromPoints(tickPts);
    const tickSegments = new THREE.LineSegments(
      tickGeo,
      new THREE.LineBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.75 })
    );
    this.compassGroup.add(tickSegments);

    // 4. Stylized 3D True North Arrow (pointing North -Z)
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, -radius * 1.25);
    arrowShape.lineTo(radius * 0.22, 0);
    arrowShape.lineTo(0, -radius * 0.15);
    arrowShape.lineTo(-radius * 0.22, 0);
    arrowShape.closePath();

    const arrowGeo = new THREE.ShapeGeometry(arrowShape);
    arrowGeo.rotateX(-Math.PI / 2);
    arrowGeo.translate(0, elev + 0.05, 0);

    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    this.compassGroup.add(arrowMesh);

    // Position & Orientation matching True North
    this.compassGroup.position.set(0, 0, 0);
    this.compassGroup.rotation.y = (-this.location.trueNorthAngle * Math.PI) / 180;

    this.triggerRender();
  }

  public setCompassVisible(visible: boolean) {
    this._isCompassVisible = visible;
    if (this.compassGroup) {
      this.compassGroup.visible = visible;
    }
    this.triggerRender();
  }

  public isCompassVisible(): boolean {
    return this._isCompassVisible;
  }

  public getIsCompassVisible(): boolean {
    return this._isCompassVisible;
  }

  public async alignCameraToTrueNorth(): Promise<void> {
    if (!this.world?.camera?.controls) return;
    try {
      const controls = this.world.camera.controls as any;
      const angleRad = (-this.location.trueNorthAngle * Math.PI) / 180;
      if (typeof controls.rotateTo === "function") {
        await controls.rotateTo(angleRad, Math.PI / 3.5, true);
      }
    } catch (e) {
      console.warn("alignCameraToTrueNorth error:", e);
    }
  }

  public async alignCameraToProjectNorth(): Promise<void> {
    if (!this.world?.camera?.controls) return;
    try {
      const controls = this.world.camera.controls as any;
      if (typeof controls.rotateTo === "function") {
        await controls.rotateTo(0, Math.PI / 3.5, true);
      }
    } catch (e) {
      console.warn("alignCameraToProjectNorth error:", e);
    }
  }

  // ============================================================
  // SURVEY GROUND CONTROL POINTS (GCPS) SUITE
  // ============================================================

  public initDefaultSurveyPoints() {
    this.surveyPoints = [];
    const utmOrigin = this.toUtm(this.location.latitude, this.location.longitude);

    // 1. Primary Site Origin Benchmark
    this.surveyPoints.push({
      id: "BM-01",
      name: "Site Origin Benchmark",
      code: "BENCHMARK",
      type: "BENCHMARK",
      color: "#f59e0b",
      localX: 0,
      localY: 0,
      localZ: 0,
      latitude: this.location.latitude,
      longitude: this.location.longitude,
      elevationAMSL: this.location.elevationAMSL,
      easting: utmOrigin.easting,
      northing: utmOrigin.northing,
      description: "Primary Geodetic Control Benchmark (Origin 0,0,0)",
    });

    // 2. North-East Site Boundary Control Point
    const gcp1Geo = this.localToGeodetic(35, -25);
    const gcp1Utm = this.toUtm(gcp1Geo.lat, gcp1Geo.lon);
    this.surveyPoints.push({
      id: "GCP-01",
      name: "NE Boundary Control",
      code: "CONTROL",
      type: "CONTROL",
      color: "#06b6d4",
      localX: 35,
      localY: 0,
      localZ: -25,
      latitude: gcp1Geo.lat,
      longitude: gcp1Geo.lon,
      elevationAMSL: this.location.elevationAMSL,
      easting: gcp1Utm.easting,
      northing: gcp1Utm.northing,
      description: "North-East Cadastral Survey Station",
    });

    // 3. South-West Site Boundary Control Point
    const gcp2Geo = this.localToGeodetic(-35, 25);
    const gcp2Utm = this.toUtm(gcp2Geo.lat, gcp2Geo.lon);
    this.surveyPoints.push({
      id: "GCP-02",
      name: "SW Boundary Control",
      code: "BOUNDARY",
      type: "BOUNDARY",
      color: "#10b981",
      localX: -35,
      localY: 0,
      localZ: 25,
      latitude: gcp2Geo.lat,
      longitude: gcp2Geo.lon,
      elevationAMSL: this.location.elevationAMSL,
      easting: gcp2Utm.easting,
      northing: gcp2Utm.northing,
      description: "South-West Cadastral Boundary Peg",
    });

    this.rebuildSurveyPointsMesh();
  }

  public getSurveyPoints(): GisSurveyControlPoint[] {
    return [...this.surveyPoints];
  }

  public addSurveyPoint(point: Partial<GisSurveyControlPoint> & {
    localX: number;
    localZ: number;
  }): GisSurveyControlPoint {
    const id = point.id || `GCP-0${this.surveyPoints.length + 1}`;
    const localY = point.localY || 0;
    const geo = this.localToGeodetic(point.localX, point.localZ);
    const utm = this.toUtm(geo.lat, geo.lon);

    const newPoint: GisSurveyControlPoint = {
      id,
      name: point.name || `Control Point ${id}`,
      code: point.code || "CONTROL",
      type: point.type || point.code || "CONTROL",
      color: point.color || "#10b981",
      localX: point.localX,
      localY,
      localZ: point.localZ,
      latitude: geo.lat,
      longitude: geo.lon,
      elevationAMSL: Number((this.location.elevationAMSL + localY).toFixed(2)),
      easting: utm.easting,
      northing: utm.northing,
      description: point.description || "Field Survey Station",
    };

    this.surveyPoints.push(newPoint);
    this.rebuildSurveyPointsMesh();
    return newPoint;
  }

  public removeSurveyPoint(id: string): boolean {
    const idx = this.surveyPoints.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.surveyPoints.splice(idx, 1);
      this.rebuildSurveyPointsMesh();
      return true;
    }
    return false;
  }

  public clearSurveyPoints() {
    this.surveyPoints = [];
    this.rebuildSurveyPointsMesh();
  }

  public setSurveyVisible(visible: boolean) {
    this._isSurveyVisible = visible;
    if (this.surveyGroup) {
      this.surveyGroup.visible = visible;
    }
    this.triggerRender();
  }

  public setSurveyPointsVisible(visible: boolean) {
    this.setSurveyVisible(visible);
  }

  public isSurveyPointsVisible(): boolean {
    return this._isSurveyVisible;
  }

  public getIsSurveyVisible(): boolean {
    return this._isSurveyVisible;
  }

  private updateSurveyPointCoordinates() {
    this.surveyPoints.forEach((p) => {
      const geo = this.localToGeodetic(p.localX, p.localZ);
      const utm = this.toUtm(geo.lat, geo.lon);
      p.latitude = geo.lat;
      p.longitude = geo.lon;
      p.elevationAMSL = Number((this.location.elevationAMSL + p.localY).toFixed(2));
      p.easting = utm.easting;
      p.northing = utm.northing;
    });
  }

  /**
   * Rebuilds 3D Survey Ground Control Points (GCPs) beacons and laser lines.
   */
  public rebuildSurveyPointsMesh() {
    if (!this.surveyGroup) return;

    // Clear existing
    while (this.surveyGroup.children.length > 0) {
      const child = this.surveyGroup.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      this.surveyGroup.remove(child);
    }

    if (!this._isSurveyVisible) {
      this.surveyGroup.visible = false;
      return;
    }
    this.surveyGroup.visible = true;

    this.surveyPoints.forEach((p) => {
      let colorHex = 0x06b6d4; // Cyan (CONTROL)
      if (p.code === "BENCHMARK") colorHex = 0xf59e0b; // Amber / Gold
      else if (p.code === "BOUNDARY") colorHex = 0x10b981; // Emerald
      else if (p.code === "UTILITY") colorHex = 0xa855f7; // Purple

      // 1. Survey Prism (Octahedron)
      const prismGeo = new THREE.OctahedronGeometry(0.75, 0);
      const prismMat = new THREE.MeshBasicMaterial({ color: colorHex, wireframe: false });
      const prismMesh = new THREE.Mesh(prismGeo, prismMat);
      prismMesh.position.set(p.localX, p.localY + 1.8, p.localZ);
      prismMesh.name = `GCP-${p.id}`;
      this.surveyGroup?.add(prismMesh);

      // 2. Vertical Laser Line to ground
      const linePts = [
        new THREE.Vector3(p.localX, p.localY, p.localZ),
        new THREE.Vector3(p.localX, p.localY + 1.8, p.localZ),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(linePts);
      const lineMat = new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.85 });
      const line = new THREE.Line(lineGeo, lineMat);
      this.surveyGroup?.add(line);

      // 3. Ground ring target
      const ringGeo = new THREE.RingGeometry(0.5, 0.75, 16);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      });
      const groundRing = new THREE.Mesh(ringGeo, ringMat);
      groundRing.position.set(p.localX, p.localY + 0.05, p.localZ);
      this.surveyGroup?.add(groundRing);
    });

    this.triggerRender();
  }

  // ============================================================
  // GEODESIC DISTANCE & BEARING (HAVERSINE INVERSE)
  // ============================================================

  public calculateGeodesicDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6378137.0; // WGS84 Equatorial Radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public calculateInitialBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);
    return ((theta * 180) / Math.PI + 360) % 360;
  }

  public measureDistanceBetweenPoints(
    arg1: string | number,
    arg2?: string | number,
    x2?: number,
    z2?: number
  ): GisDistanceMeasurement | null {
    if (typeof arg1 === "string" && typeof arg2 === "string") {
      const p1 = this.surveyPoints.find((p) => p.id === arg1);
      const p2 = this.surveyPoints.find((p) => p.id === arg2);
      if (!p1 || !p2) return null;

      const localDx = p2.localX - p1.localX;
      const localDy = p2.localY - p1.localY;
      const localDz = p2.localZ - p1.localZ;
      const localDist = Math.sqrt(localDx * localDx + localDy * localDy + localDz * localDz);

      const geodesicDist = this.calculateGeodesicDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      const bearing = this.calculateInitialBearing(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      const dZ = p2.elevationAMSL - p1.elevationAMSL;

      return {
        fromLat: p1.latitude,
        fromLon: p1.longitude,
        toLat: p2.latitude,
        toLon: p2.longitude,
        distanceMeters: Math.round(geodesicDist * 100) / 100,
        distanceKm: Math.round((geodesicDist / 1000) * 1000) / 1000,
        initialBearingDegrees: Math.round(bearing * 10) / 10,
        elevationDeltaMeters: Math.round(dZ * 100) / 100,
        localDistance: Math.round(localDist * 100) / 100,
        geodesicDistance: Math.round(geodesicDist * 100) / 100,
        initialBearing: Math.round(bearing * 10) / 10,
        deltaElevation: Math.round(dZ * 100) / 100,
      };
    }

    const x1 = typeof arg1 === "number" ? arg1 : 0;
    const z1 = typeof arg2 === "number" ? arg2 : 0;
    const geo1 = this.localToGeodetic(x1, z1);
    const geo2 = this.localToGeodetic(x2 || 0, z2 || 0);
    const dist = this.calculateGeodesicDistance(geo1.lat, geo1.lon, geo2.lat, geo2.lon);
    const bearing = this.calculateInitialBearing(geo1.lat, geo1.lon, geo2.lat, geo2.lon);
    const localDist = Math.sqrt(Math.pow((x2 || 0) - x1, 2) + Math.pow((z2 || 0) - z1, 2));

    return {
      fromLat: geo1.lat,
      fromLon: geo1.lon,
      toLat: geo2.lat,
      toLon: geo2.lon,
      distanceMeters: Math.round(dist * 100) / 100,
      distanceKm: Math.round((dist / 1000) * 1000) / 1000,
      initialBearingDegrees: Math.round(bearing * 10) / 10,
      elevationDeltaMeters: 0,
      localDistance: Math.round(localDist * 100) / 100,
      geodesicDistance: Math.round(dist * 100) / 100,
      initialBearing: Math.round(bearing * 10) / 10,
      deltaElevation: 0,
    };
  }

  // ============================================================
  // MULTI-STANDARD GEOREFERENCING EXPORT SUITE
  // ============================================================

  public exportSurveyPointsCsv(): string {
    const headers = [
      "Point_ID",
      "Name",
      "Code",
      "Type",
      "Local_X_m",
      "Local_Y_m",
      "Local_Z_m",
      "Latitude",
      "Longitude",
      "UTM_Easting_m",
      "UTM_Northing_m",
      "Elevation_AMSL_m",
      "Description",
    ];
    const rows = this.surveyPoints.map((p) =>
      [
        p.id,
        `"${p.name}"`,
        p.code,
        p.type,
        p.localX.toFixed(3),
        p.localY.toFixed(3),
        p.localZ.toFixed(3),
        p.latitude.toFixed(7),
        p.longitude.toFixed(7),
        p.easting,
        p.northing,
        p.elevationAMSL.toFixed(2),
        `"${p.description || ""}"`,
      ].join(",")
    );
    return [headers.join(","), ...rows].join("\n");
  }

  public exportEsriWorldFile(): string {
    const pixelSize = (this.basemapConfig.radius * 2) / 1024;
    const theta = (-this.location.trueNorthAngle * Math.PI) / 180;
    const utm = this.toUtm(this.location.latitude, this.location.longitude);
    const A = pixelSize * Math.cos(theta);
    const D = pixelSize * Math.sin(theta);
    const B = pixelSize * Math.sin(theta);
    const E = -pixelSize * Math.cos(theta);
    const C = utm.easting - this.basemapConfig.radius;
    const F = utm.northing + this.basemapConfig.radius;

    return [
      A.toFixed(6),
      D.toFixed(6),
      B.toFixed(6),
      E.toFixed(6),
      C.toFixed(2),
      F.toFixed(2),
    ].join("\n");
  }

  public exportPrjFile(): string {
    const utm = this.toUtm(this.location.latitude, this.location.longitude);
    const zoneDigits = parseInt(utm.zone.replace(/\D/g, "")) || 30;
    const centralMeridian = (zoneDigits - 1) * 6 - 180 + 3;

    return `PROJCS["WGS_1984_${utm.zone.replace(" ", "_")}",GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],PROJECTION["Transverse_Mercator"],PARAMETER["False_Easting",500000.0],PARAMETER["False_Northing",${this.location.latitude >= 0 ? "0.0" : "10000000.0"}],PARAMETER["Central_Meridian",${centralMeridian}.0],PARAMETER["Scale_Factor",0.9996],PARAMETER["Latitude_Of_Origin",0.0],UNIT["Meter",1.0]]`;
  }

  // ============================================================
  // INTERACTIVE 2D MINI-MAP LOCATION PICKER
  // ============================================================

  public renderMiniMap(canvas?: HTMLCanvasElement | string, zoom?: number) {
    let c: HTMLCanvasElement | null = null;
    if (typeof canvas === "string") {
      c = (typeof document !== "undefined" ? (document.getElementById(canvas) as HTMLCanvasElement) : null) || this.miniMapCanvas;
    } else {
      c = canvas || this.miniMapCanvas;
    }
    if (!c) return;
    this.miniMapCanvas = c;
    if (typeof zoom === "number") {
      this.miniMapZoom = Math.max(3, Math.min(18, zoom));
    }
    const ctx = c.getContext ? c.getContext("2d") : null;
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? Math.max(1, Math.min(3, window.devicePixelRatio || 1)) : 1;
    const clientW = c.clientWidth || 320;
    const clientH = c.clientHeight || 135;
    const targetW = Math.round(clientW * dpr);
    const targetH = Math.round(clientH * dpr);

    if (c.width !== targetW || c.height !== targetH) {
      c.width = targetW;
      c.height = targetH;
    }

    if (ctx.setTransform) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const w = clientW;
    const h = clientH;

    // Dark high-tech background
    ctx.fillStyle = "#090d14";
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = "rgba(6, 182, 212, 0.12)";
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Try fetching and rendering center tile + adjacent tiles
    const z = this.miniMapZoom;
    const cx = ((this.location.longitude + 180) / 360) * Math.pow(2, z);
    const latRad = (this.location.latitude * Math.PI) / 180;
    const cy = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * Math.pow(2, z);

    const tileX = Math.floor(cx);
    const tileY = Math.floor(cy);
    const fracX = cx - tileX;
    const fracY = cy - tileY;

    if (typeof Image !== "undefined") {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const tx = tileX + dx;
          const ty = tileY + dy;
          if (tx < 0 || ty < 0 || tx >= Math.pow(2, z) || ty >= Math.pow(2, z)) continue;
          const url = `https://tile.openstreetmap.org/${z}/${tx}/${ty}.png`;
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            if (ctx.setTransform) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            const posX = w / 2 + (dx - fracX) * 256;
            const posY = h / 2 + (dy - fracY) * 256;
            ctx.drawImage(img, posX, posY, 256, 256);
            this.drawMiniMapCrosshair(ctx, w, h);
          };
          img.src = url;
        }
      }
    }

    this.drawMiniMapCrosshair(ctx, w, h);
  }

  private drawMiniMapCrosshair(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const centerX = w / 2;
    const centerY = h / 2;

    // Dynamic Basemap Extent Radius Coverage Ring on 2D Mini-Map
    const lat0 = this.location.latitude;
    const cosLat = Math.cos((lat0 * Math.PI) / 180);
    const miniMapGroundRes = (156543.03 * Math.max(0.1, cosLat)) / Math.pow(2, this.miniMapZoom);
    const extentRadiusPx = this.basemapConfig.radius / miniMapGroundRes;

    // Draw dynamic geographic extent circle
    ctx.save();
    ctx.fillStyle = "rgba(6, 182, 212, 0.08)";
    ctx.strokeStyle = "rgba(6, 182, 212, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, extentRadiusPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Coverage label on circle border
    if (extentRadiusPx > 18) {
      ctx.fillStyle = "#06b6d4";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${this.basemapConfig.radius}m Extent`, centerX + extentRadiusPx + 3, centerY - 2);
    }
    ctx.restore();

    // Central crosshair & reticle
    ctx.strokeStyle = "rgba(6, 182, 212, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshairs
    ctx.strokeStyle = "#06b6d4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX - 16, centerY);
    ctx.lineTo(centerX + 16, centerY);
    ctx.moveTo(centerX, centerY - 16);
    ctx.lineTo(centerX, centerY + 16);
    ctx.stroke();

    // Central Pin
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // True North indicator in top-left
    ctx.save();
    ctx.translate(22, 22);
    ctx.rotate((-this.location.trueNorthAngle * Math.PI) / 180);
    ctx.fillStyle = "#06b6d4";
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(4, 5);
    ctx.lineTo(-4, 5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center";
    ctx.fillText("N", 0, -14);
    ctx.restore();

    // Draw Relocated BIM Model Marker on Mini-Map
    const mGeo = this.localToGeodetic(this.modelPlacement.x, this.modelPlacement.z);
    const z = this.miniMapZoom;
    const cx = ((this.location.longitude + 180) / 360) * Math.pow(2, z);
    const latRad = (this.location.latitude * Math.PI) / 180;
    const cy = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * Math.pow(2, z);

    const mcx = ((mGeo.lon + 180) / 360) * Math.pow(2, z);
    const mLatRad = (mGeo.lat * Math.PI) / 180;
    const mcy = ((1 - Math.asinh(Math.tan(mLatRad)) / Math.PI) / 2) * Math.pow(2, z);

    const modelPixelX = w / 2 + (mcx - cx) * 256;
    const modelPixelY = h / 2 + (mcy - cy) * 256;

    ctx.save();
    ctx.translate(modelPixelX, modelPixelY);
    ctx.rotate((this.modelPlacement.rotationY * Math.PI) / 180);

    // Model building footprint marker
    ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;
    ctx.fillRect(-12, -9, 24, 18);
    ctx.strokeRect(-12, -9, 24, 18);

    // Heading Arrow
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(4, -9);
    ctx.lineTo(-4, -9);
    ctx.closePath();
    ctx.fill();

    // Model Label
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("MODEL", 0, 4);
    ctx.restore();
  }

  public pickLocationForModel(
    clickX: number,
    clickY: number,
    canvasWidth: number,
    canvasHeight: number
  ): GisModelPlacement {
    const z = this.miniMapZoom;
    const cx = ((this.location.longitude + 180) / 360) * Math.pow(2, z);
    const latRad = (this.location.latitude * Math.PI) / 180;
    const cy = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * Math.pow(2, z);

    const deltaTileX = (clickX - canvasWidth / 2) / 256;
    const deltaTileY = (clickY - canvasHeight / 2) / 256;

    const clickedTileX = cx + deltaTileX;
    const clickedTileY = cy + deltaTileY;

    const newLon = (clickedTileX / Math.pow(2, z)) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * clickedTileY) / Math.pow(2, z);
    const newLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

    return this.relocateModelToCoordinates(newLat, newLon);
  }

  public pickLocationFromMiniMap(
    clickX: number,
    clickY: number,
    canvasWidth: number,
    canvasHeight: number
  ): { lat: number; lon: number; latitude: number; longitude: number } {
    const z = this.miniMapZoom;
    const cx = ((this.location.longitude + 180) / 360) * Math.pow(2, z);
    const latRad = (this.location.latitude * Math.PI) / 180;
    const cy = ((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * Math.pow(2, z);

    const deltaTileX = (clickX - canvasWidth / 2) / 256;
    const deltaTileY = (clickY - canvasHeight / 2) / 256;

    const clickedTileX = cx + deltaTileX;
    const clickedTileY = cy + deltaTileY;

    const newLon = (clickedTileX / Math.pow(2, z)) * 360 - 180;
    const n = Math.PI - (2 * Math.PI * clickedTileY) / Math.pow(2, z);
    const newLat = (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));

    const clampedLat = Math.max(-85.0511, Math.min(85.0511, newLat));
    const clampedLon = Math.max(-180, Math.min(180, newLon));

    this.setLocation({
      latitude: Number(clampedLat.toFixed(6)),
      longitude: Number(clampedLon.toFixed(6)),
      source: "manual",
      address: `Selected Map Pin (${clampedLat.toFixed(4)}°, ${clampedLon.toFixed(4)}°)`,
    });

    return {
      lat: this.location.latitude,
      lon: this.location.longitude,
      latitude: this.location.latitude,
      longitude: this.location.longitude,
    };
  }

  public getMiniMapZoom(): number {
    return this.miniMapZoom;
  }

  public setMiniMapZoom(zoom: number) {
    this.miniMapZoom = Math.max(3, Math.min(18, zoom));
    if (this.miniMapCanvas) {
      this.renderMiniMap();
    }
  }

  public async requestCurrentGpsLocation(): Promise<GisProjectLocation> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === "undefined" || !navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.setLocation({
            latitude: Number(pos.coords.latitude.toFixed(6)),
            longitude: Number(pos.coords.longitude.toFixed(6)),
            elevationAMSL:
              pos.coords.altitude !== null ? Number(pos.coords.altitude.toFixed(1)) : this.location.elevationAMSL,
            source: "manual",
            address: `Device GPS (±${Math.round(pos.coords.accuracy)}m)`,
          });
          resolve(this.getLocation());
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  // ============================================================
  // MODEL MAP RELOCATION & PLACEMENT SUITE
  // ============================================================

  public getModelPlacement(): GisModelPlacement {
    const geo = this.localToGeodetic(this.modelPlacement.x, this.modelPlacement.z);
    return {
      ...this.modelPlacement,
      latitude: geo.lat,
      longitude: geo.lon,
      elevationAMSL: Number((this.location.elevationAMSL + this.modelPlacement.y).toFixed(2)),
    };
  }

  public setModelPlacement(offset: Partial<GisModelPlacement>): GisModelPlacement {
    this.modelPlacement = {
      ...this.modelPlacement,
      ...offset,
    };

    // Apply translation & rotation to loaded BIM models
    try {
      if (typeof window !== "undefined") {
        const bimEngine = (window as any).bimEngine || (window as any).BimEngine?.getInstance?.();
        const fragments = bimEngine?.fragments;
        if (fragments?.list) {
          for (const [modelId, model] of fragments.list) {
            if (this.modelPlacement.modelId !== "all" && this.modelPlacement.modelId !== modelId) {
              continue;
            }
            const modelObj = (model.object || model) as THREE.Object3D;
            if (modelObj && modelObj.position) {
              modelObj.position.set(
                this.modelPlacement.x,
                this.modelPlacement.y,
                this.modelPlacement.z
              );
              if (modelObj.rotation) {
                modelObj.rotation.y = (this.modelPlacement.rotationY * Math.PI) / 180;
              }
              modelObj.updateMatrixWorld?.(true);
            }
          }
          fragments.core?.update?.(true);
        }
      }
    } catch (e) {
      console.warn("Failed to apply model placement transform:", e);
    }

    this.rebuildModelAnchorMesh();
    this.renderMiniMap();
    this.triggerRender();

    return this.getModelPlacement();
  }

  public resetModelPlacement(): GisModelPlacement {
    return this.setModelPlacement({
      x: 0,
      y: 0,
      z: 0,
      rotationY: 0,
    });
  }

  public snapModelToGround(): GisModelPlacement {
    return this.setModelPlacement({
      y: this.basemapConfig.elevationOffset,
    });
  }

  public snapModelToGcp(gcpId: string): GisModelPlacement | null {
    const pt = this.surveyPoints.find((p) => p.id === gcpId);
    if (!pt) return null;
    return this.setModelPlacement({
      x: pt.localX,
      y: pt.localY,
      z: pt.localZ,
    });
  }

  public relocateModelToCoordinates(lat: number, lon: number, elevationAMSL?: number): GisModelPlacement {
    const local = this.geodeticToLocal(lat, lon);
    const y = typeof elevationAMSL === "number" ? elevationAMSL - this.location.elevationAMSL : this.modelPlacement.y;
    return this.setModelPlacement({
      x: Number(local.x.toFixed(2)),
      z: Number(local.z.toFixed(2)),
      y: Number(y.toFixed(2)),
    });
  }

  public startModelPlacementMode(onPlaced?: (placement: GisModelPlacement) => void): boolean {
    this.isModelPlacementMode = true;
    if (typeof document === "undefined") return true;

    const container = document.getElementById("container");
    if (!container) return false;

    container.style.cursor = "crosshair";

    if (this.boundOn3DGroundClick) {
      container.removeEventListener("pointerdown", this.boundOn3DGroundClick);
    }

    this.boundOn3DGroundClick = (e: MouseEvent) => {
      if (!this.isModelPlacementMode) return;
      if ((e.target as HTMLElement)?.closest(".enterprise-drawer, .dock, .top-bar-overlay, .panel-glass, #gis-panel")) {
        return;
      }

      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const raycaster = new THREE.Raycaster();
      if (this.world?.camera?.three) {
        raycaster.setFromCamera(mouse, this.world.camera.three);
        const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -this.basemapConfig.elevationOffset);
        const hit = new THREE.Vector3();
        const intersected = raycaster.ray.intersectPlane(groundPlane, hit);
        if (intersected) {
          const placement = this.setModelPlacement({
            x: Number(hit.x.toFixed(2)),
            z: Number(hit.z.toFixed(2)),
          });
          if (onPlaced) onPlaced(placement);
          if (typeof (window as any).refreshGisUI === "function") {
            (window as any).refreshGisUI();
          }
          this.stopModelPlacementMode();
        }
      }
    };

    container.addEventListener("pointerdown", this.boundOn3DGroundClick);
    return true;
  }

  public stopModelPlacementMode() {
    this.isModelPlacementMode = false;
    if (typeof document !== "undefined") {
      const container = document.getElementById("container");
      if (container) {
        container.style.cursor = "";
        if (this.boundOn3DGroundClick) {
          container.removeEventListener("pointerdown", this.boundOn3DGroundClick);
          this.boundOn3DGroundClick = null;
        }
      }
    }
  }

  public isModelPlacementActive(): boolean {
    return this.isModelPlacementMode;
  }

  public rebuildModelAnchorMesh() {
    if (!this.modelAnchorGroup) return;

    // Clear existing
    while (this.modelAnchorGroup.children.length > 0) {
      const child = this.modelAnchorGroup.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      this.modelAnchorGroup.remove(child);
    }

    const { x, y, z, rotationY } = this.modelPlacement;

    // Outer target ring on ground
    const ringGeo = new THREE.RingGeometry(3.0, 3.25, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    this.modelAnchorGroup.add(ringMesh);

    // Inner central beacon disc
    const discGeo = new THREE.CircleGeometry(0.8, 16);
    discGeo.rotateX(-Math.PI / 2);
    const discMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const discMesh = new THREE.Mesh(discGeo, discMat);
    this.modelAnchorGroup.add(discMesh);

    // Forward direction arrow
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 6.0);
    arrowShape.lineTo(1.4, 3.2);
    arrowShape.lineTo(0.5, 3.2);
    arrowShape.lineTo(0.5, 0);
    arrowShape.lineTo(-0.5, 0);
    arrowShape.lineTo(-0.5, 3.2);
    arrowShape.lineTo(-1.4, 3.2);
    arrowShape.closePath();
    const arrowGeo = new THREE.ShapeGeometry(arrowShape);
    arrowGeo.rotateX(-Math.PI / 2);
    const arrowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
    });
    const arrowMesh = new THREE.Mesh(arrowGeo, arrowMat);
    this.modelAnchorGroup.add(arrowMesh);

    // Position and orient anchor
    this.modelAnchorGroup.position.set(x, y + 0.02, z);
    this.modelAnchorGroup.rotation.y = (rotationY * Math.PI) / 180;
    this.triggerRender();
  }
}
