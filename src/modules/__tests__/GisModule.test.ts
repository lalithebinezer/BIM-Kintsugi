import { describe, it, expect, beforeEach } from "vitest";
import { GisModule } from "../GisModule";

describe("GisModule Unit Tests", () => {
  let gis: GisModule;

  beforeEach(() => {
    gis = GisModule.getInstance();
    gis.loadPresetLocation("sanfrancisco");
  });

  it("should initialize with default location and support preset switching", () => {
    const loc = gis.getLocation();
    expect(loc.latitude).toBeCloseTo(37.7749, 4);
    expect(loc.longitude).toBeCloseTo(-122.4194, 4);

    gis.loadPresetLocation("tokyo");
    const tokyoLoc = gis.getLocation();
    expect(tokyoLoc.latitude).toBeCloseTo(35.6895, 4);
    expect(tokyoLoc.longitude).toBeCloseTo(139.6917, 4);
    expect(tokyoLoc.address).toContain("Tokyo");
  });

  it("should accurately convert local coordinates to geodetic and invert back", () => {
    // 50m East, 30m South
    const localX = 50;
    const localZ = 30;

    const geo = gis.localToGeodetic(localX, localZ);
    expect(geo.lat).toBeDefined();
    expect(geo.lon).toBeDefined();

    const inverted = gis.geodeticToLocal(geo.lat, geo.lon);
    expect(inverted.x).toBeCloseTo(localX, 1);
    expect(inverted.z).toBeCloseTo(localZ, 1);
  });

  it("should format coordinates to standard DMS strings and calculate UTM zones", () => {
    const dmsLat = gis.toDms(37.7749, true);
    expect(dmsLat).toContain("37°");
    expect(dmsLat).toContain("N");

    const dmsLon = gis.toDms(-122.4194, false);
    expect(dmsLon).toContain("122°");
    expect(dmsLon).toContain("W");

    const utm = gis.toUtm(37.7749, -122.4194);
    expect(utm.zone).toBe("Zone 10N");
    expect(utm.easting).toBeGreaterThan(500000);
    expect(utm.northing).toBeGreaterThan(4000000);
  });

  it("should generate comprehensive telemetry for any 3D viewport coordinate", () => {
    const telemetry = gis.getCoordinatesTelemetry(15.5, 3.2, -8.0);
    expect(telemetry.localX).toBe(15.5);
    expect(telemetry.localY).toBe(3.2);
    expect(telemetry.localZ).toBe(-8.0);
    expect(telemetry.latDms).toBeDefined();
    expect(telemetry.lonDms).toBeDefined();
    expect(telemetry.elevationAMSL).toBeCloseTo(16.0 + 3.2, 1);
  });

  it("should compute realistic astronomical solar angles for project location", () => {
    // Midday summer sun in Tokyo (June 21, 12:00)
    gis.loadPresetLocation("tokyo");
    const summerNoon = new Date("2026-06-21T12:00:00+09:00");
    const sunPos = gis.calculateSolarPosition(summerNoon);

    expect(sunPos.elevation).toBeGreaterThan(50); // High summer sun
    expect(sunPos.azimuth).toBeGreaterThanOrEqual(0);
    expect(sunPos.azimuth).toBeLessThanOrEqual(360);
  });

  it("should load GeoJSON features and demo municipal cadastre with utilities", () => {
    gis.clearGeoJsonFeatures();
    expect(gis.getGeoJsonFeatures().length).toBe(0);

    const res = gis.loadDemoCadastre();
    expect(res.featureCount).toBe(4);
    expect(res.layerNames.length).toBeGreaterThanOrEqual(2);

    const features = gis.getGeoJsonFeatures();
    expect(features.some((f) => f.category === "parcel")).toBe(true);
    expect(features.some((f) => f.category === "setback")).toBe(true);
    expect(features.some((f) => f.category === "utility-water")).toBe(true);
    expect(features.some((f) => f.category === "utility-electric")).toBe(true);
  });

  it("should manage basemap configurations correctly", () => {
    gis.setBasemapConfig({
      enabled: true,
      provider: "satellite",
      radius: 800,
      opacity: 0.75,
    });

    const cfg = gis.getBasemapConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.provider).toBe("satellite");
    expect(cfg.radius).toBe(800);
    expect(cfg.opacity).toBe(0.75);

    gis.toggleBasemap(false);
    expect(gis.getBasemapConfig().enabled).toBe(false);
  });
});
