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
  };

  // 3D Scene Objects
  private basemapGroup: THREE.Group | null = null;
  private basemapMesh: THREE.Mesh | null = null;
  private cadastreGroup: THREE.Group | null = null;
  private basemapCanvas: HTMLCanvasElement | null = null;
  private basemapTexture: THREE.CanvasTexture | null = null;
  private currentTileFetchId: number = 0;
  private tileFetchTimer: any = null;
  private isSpaceView: boolean = false;

  // Features list
  private geoJsonFeatures: GisGeoJsonFeature[] = [];

  private constructor() {}

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

  public setBasemapRadius(radius: number) {
    this.setBasemapConfig({ radius });
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
   * Attempts to parse `IfcSite` latitude, longitude, and elevation from fragment models.
   */
  public async parseIfcSiteMetadata(model: any): Promise<boolean> {
    if (!model) return false;
    try {
      if (typeof model.getAllPropertiesOfType === "function") {
        // Look for IFCSITE (express type 4096294205 or matching string)
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
    return false;
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

    // Recreate geometry if size changed
    if (!this.basemapMesh) {
      const geo = new THREE.PlaneGeometry(diameter, diameter, 32, 32);
      geo.rotateX(-Math.PI / 2);

      // Initialize high-res procedural canvas texture
      this.basemapCanvas = document.createElement("canvas");
      this.basemapCanvas.width = 1024;
      this.basemapCanvas.height = 1024;
      this.renderBasemapTextureContent();

      this.basemapTexture = new THREE.CanvasTexture(this.basemapCanvas);
      this.basemapTexture.wrapS = THREE.ClampToEdgeWrapping;
      this.basemapTexture.wrapT = THREE.ClampToEdgeWrapping;

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
      ctx.lineWidth = isMajor ? 1.5 : 1;

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
    ctx.moveTo(centerX, 20);
    ctx.lineTo(centerX - 10, 45);
    ctx.lineTo(centerX + 10, 45);
    ctx.closePath();
    ctx.fill();

    ctx.font = "bold 16px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("N", centerX - 6, 65);

    // Center origin reticle
    ctx.strokeStyle = "#D4FF3F";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.moveTo(centerX - 16, centerY);
    ctx.lineTo(centerX + 16, centerY);
    ctx.moveTo(centerX, centerY - 16);
    ctx.lineTo(centerX, centerY + 16);
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

    let interval = 100;
    if (radius >= 2000) interval = 500;
    else if (radius >= 800) interval = 250;
    else if (radius <= 250) interval = 50;

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = ringColor;

    for (let d = interval; d <= radius; d += interval) {
      const rPx = d * pxPerMeter;
      ctx.beginPath();
      ctx.arc(centerX, centerY, rPx, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = ringColor;
      ctx.font = "bold 13px monospace";
      ctx.fillText(`${d}m`, centerX + rPx + 4, centerY - 4);
    }

    // Outer boundary ring
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2;
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

    // Optimal Web Mercator zoom level for this extent
    let zoom = Math.round(Math.log2((156543.03 * Math.max(0.1, cosLat)) / groundRes));
    zoom = Math.max(12, Math.min(18, zoom));

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

    // Limit maximum tiles to fetch in one pass to avoid rate limits or browser stalls
    while ((tileXMax - tileXMin + 1) * (tileYMax - tileYMin + 1) > 20 && zoom > 10) {
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

        const p = new Promise<{ img: HTMLImageElement; tx: number; ty: number } | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ img, tx, ty });
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

    this.drawMetricRangeRings(ctx, w, h, "rgba(212, 255, 63, 0.65)");

    // Center crosshair / origin reticle
    ctx.strokeStyle = "#D4FF3F";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 6, 0, Math.PI * 2);
    ctx.moveTo(centerX - 18, centerY);
    ctx.lineTo(centerX + 18, centerY);
    ctx.moveTo(centerX, centerY - 18);
    ctx.lineTo(centerX, centerY + 18);
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
}
