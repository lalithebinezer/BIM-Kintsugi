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

  it("should import MultiPolygon, MultiLineString, and Point GeoJSON with auto-centering", () => {
    // GeoJSON in London (~51.5, -0.1) when current location is San Francisco (~37.77, -122.41)
    const geojsonData = {
      type: "FeatureCollection",
      name: "London Survey Site",
      features: [
        {
          type: "Feature",
          properties: { name: "Cadastre Boundary", category: "parcel" },
          geometry: {
            type: "MultiPolygon",
            coordinates: [
              [
                [
                  [-0.1278, 51.5074],
                  [-0.1270, 51.5074],
                  [-0.1270, 51.5080],
                  [-0.1278, 51.5080],
                  [-0.1278, 51.5074],
                ],
              ],
            ],
          },
        },
        {
          type: "Feature",
          properties: { name: "Underground Pipe", category: "utility-water" },
          geometry: {
            type: "MultiLineString",
            coordinates: [
              [
                [-0.1275, 51.5075],
                [-0.1272, 51.5078],
              ],
            ],
          },
        },
        {
          type: "Feature",
          properties: { name: "Survey Benchmark Pin", category: "survey-point" },
          geometry: {
            type: "Point",
            coordinates: [-0.1274, 51.5076],
          },
        },
      ],
    };

    const res = gis.loadGeoJSON(geojsonData);
    expect(res.featureCount).toBe(3);
    expect(res.layerNames).toContain("parcel");
    expect(res.layerNames).toContain("utility-water");

    // Location must have auto-centered to London centroid
    const newLoc = gis.getLocation();
    expect(newLoc.latitude).toBeCloseTo(51.5076, 2);
    expect(newLoc.longitude).toBeCloseTo(-0.1274, 2);

    // Basemap must have been enabled with calculated radius
    const cfg = gis.getBasemapConfig();
    expect(cfg.enabled).toBe(true);
    expect(cfg.radius).toBeGreaterThanOrEqual(300);
  });

  it("should apply geocoded location to datum and update solar angles", () => {
    gis.applyGeocodedLocation({
      displayName: "Sydney Opera House, Bennelong Point, Sydney, NSW, Australia",
      lat: -33.8568,
      lon: 151.2153,
    });

    const loc = gis.getLocation();
    expect(loc.latitude).toBeCloseTo(-33.8568, 4);
    expect(loc.longitude).toBeCloseTo(151.2153, 4);
    expect(loc.address).toContain("Sydney Opera House");

    const sun = gis.calculateSolarPosition(new Date("2026-12-21T12:00:00+11:00"));
    expect(sun.elevation).toBeGreaterThan(60); // High summer sun in Southern hemisphere
  });

  it("should manage space flight state correctly", async () => {
    expect(gis.getIsSpaceView()).toBe(false);
    // In headless mock without camera controls, toggleSpaceFlight returns false safely
    const res = await gis.toggleSpaceFlight();
    expect(typeof res).toBe("boolean");
  });
});
