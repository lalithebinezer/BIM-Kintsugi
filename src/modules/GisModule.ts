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
    this.setBasemapConfig({ elevationOffset });
  }

  public setBasemapOpacity(opacity: number) {
    this.setBasemapConfig({ opacity });
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
  public rebuildBasemap() {
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
      // Update dimensions
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

    // Trigger asynchronous satellite/map tile loading
    this.fetchTileImagery();
  }

  /**
   * Generates crisp procedural architectural basemap patterns and initiates tile stitching.
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
    let ringColor = "rgba(212, 255, 63, 0.35)";

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

    // Draw coordinate grid
    const step = w / 16;
    ctx.lineWidth = 1;

    for (let x = 0; x <= w; x += step) {
      ctx.strokeStyle = x % (step * 4) === 0 ? gridMajor : gridMinor;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    for (let y = 0; y <= h; y += step) {
      ctx.strokeStyle = y % (step * 4) === 0 ? gridMajor : gridMinor;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Concentric range circles (Radius markers)
    const centerX = w / 2;
    const centerY = h / 2;
    const radii = [0.25, 0.5, 0.75, 0.95];

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = ringColor;
    radii.forEach((rRatio) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (w / 2) * rRatio, 0, Math.PI * 2);
      ctx.stroke();

      // Range text
      const meters = Math.round(this.basemapConfig.radius * rRatio);
      ctx.fillStyle = ringColor;
      ctx.font = "bold 14px monospace";
      ctx.fillText(`${meters}m`, centerX + (w / 2) * rRatio + 4, centerY - 4);
    });

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

  /**
   * Asynchronously fetches slippy map tiles and paints them onto the basemap canvas.
   */
  private async fetchTileImagery() {
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

    // Slippy tile math at zoom level 16
    const zoom = 16;
    const lat = this.location.latitude;
    const lon = this.location.longitude;

    const latRad = (lat * Math.PI) / 180;
    const n = Math.pow(2, zoom);
    const tileX = Math.floor(((lon + 180) / 360) * n);
    const tileY = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);

    // Fetch 3x3 tiles centered on project
    const imgPromises: Promise<{ img: HTMLImageElement; dx: number; dy: number } | null>[] = [];

    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        const curX = tileX + ox;
        const curY = tileY + oy;
        const url = tileUrlTemplate.replace("{z}", String(zoom)).replace("{x}", String(curX)).replace("{y}", String(curY));

        const p = new Promise<{ img: HTMLImageElement; dx: number; dy: number } | null>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ img, dx: ox + 1, dy: oy + 1 });
          img.onerror = () => resolve(null);
          img.src = url;
        });
        imgPromises.push(p);
      }
    }

    try {
      const results = await Promise.all(imgPromises);
      if (!this.basemapCanvas) return;
      const ctx = this.basemapCanvas.getContext("2d");
      if (!ctx) return;

      const w = this.basemapCanvas.width;
      const tileSize = w / 3;

      results.forEach((res) => {
        if (res && res.img) {
          ctx.globalAlpha = 0.85;
          ctx.drawImage(res.img, res.dx * tileSize, res.dy * tileSize, tileSize, tileSize);
        }
      });
      ctx.globalAlpha = 1.0;

      // Re-overlay range markings and reticle
      this.overlayCadastralMarks(ctx, w, w);

      if (this.basemapTexture) {
        this.basemapTexture.needsUpdate = true;
      }
      if (this.world?.renderer?.three && this.world?.scene?.three && this.world?.camera?.three) {
        this.world.renderer.three.render(this.world.scene.three, this.world.camera.three);
      }
    } catch {
      // Offline fallback: keep high-contrast procedural grid intact
    }
  }

  private overlayCadastralMarks(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const centerX = w / 2;
    const centerY = h / 2;

    // Outer boundary ring
    ctx.strokeStyle = "rgba(212, 255, 63, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, w * 0.48, 0, Math.PI * 2);
    ctx.stroke();

    // Center crosshair
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
    if (this.world?.renderer?.three && (this.world.renderer.three as any).render) {
      try {
        const threeRenderer = this.world.renderer.three;
        if (this.world.scene?.three && this.world.camera?.three) {
          threeRenderer.render(this.world.scene.three, this.world.camera.three);
        }
      } catch (e) {
        // Ignore render exceptions in head-less or test environments
      }
    }
  }
}
