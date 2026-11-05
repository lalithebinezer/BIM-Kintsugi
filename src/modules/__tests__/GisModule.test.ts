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
    expect(cfg.resolution).toBe(2048);

    // Test resolution adjustment
    gis.setBasemapResolution(4096);
    expect(gis.getBasemapConfig().resolution).toBe(4096);

    gis.setBasemapResolution(1024);
    expect(gis.getBasemapConfig().resolution).toBe(1024);

    // Test radius adjustment and clamping
    gis.setBasemapRadius(1500);
    expect(gis.getBasemapConfig().radius).toBe(1500);

    gis.setBasemapRadius(10); // Below minimum 50m
    expect(gis.getBasemapConfig().radius).toBe(50);

    gis.setBasemapRadius(9999); // Above maximum 5000m
    expect(gis.getBasemapConfig().radius).toBe(5000);

    expect(() => gis.fitToBasemap()).not.toThrow();

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

  it("should compute accurate geodesic distance and initial bearing", () => {
    // Tokyo Station (35.6812, 139.7671) to Tokyo Tower (35.6586, 139.7454) ~3.25 km
    const dist = gis.calculateGeodesicDistance(35.6812, 139.7671, 35.6586, 139.7454);
    expect(dist).toBeGreaterThan(3100);
    expect(dist).toBeLessThan(3400);

    const bearing = gis.calculateInitialBearing(35.6812, 139.7671, 35.6586, 139.7454);
    expect(bearing).toBeGreaterThan(200);
    expect(bearing).toBeLessThan(230); // South-Southwest
  });

  it("should manage Survey Ground Control Points (GCPs) and measure baselines", () => {
    const defaultPts = gis.getSurveyPoints();
    expect(defaultPts.length).toBeGreaterThanOrEqual(3);
    expect(defaultPts.some((p) => p.id === "BM-01")).toBe(true);
    expect(defaultPts.some((p) => p.id === "GCP-01")).toBe(true);

    const newPt = gis.addSurveyPoint({
      name: "Boundary Monument 4",
      code: "GCP-04",
      type: "BOUNDARY",
      localX: 80,
      localY: 0.5,
      localZ: -45,
      color: "#ec4899",
    });
    expect(newPt.id).toBeDefined();
    expect(newPt.latitude).toBeDefined();
    expect(newPt.longitude).toBeDefined();

    // Measure baseline between BM-01 and GCP-04
    const bm = defaultPts.find((p) => p.id === "BM-01")!;
    const measurement = gis.measureDistanceBetweenPoints(bm.id, newPt.id);
    expect(measurement).not.toBeNull();
    if (measurement) {
      expect(measurement.localDistance).toBeGreaterThan(0);
      expect(measurement.geodesicDistance).toBeGreaterThan(0);
      expect(measurement.initialBearing).toBeGreaterThanOrEqual(0);
      expect(measurement.deltaElevation).toBeCloseTo(0.5, 1);
    }

    // Export Survey CSV
    const csv = gis.exportSurveyPointsCsv();
    expect(csv).toContain("Point_ID,Name,Code,Type,Local_X_m,Local_Y_m,Local_Z_m,Latitude,Longitude");
    expect(csv).toContain("GCP-04");
    expect(csv).toContain("BM-01");

    // Remove point
    const removed = gis.removeSurveyPoint(newPt.id);
    expect(removed).toBe(true);
    expect(gis.getSurveyPoints().some((p) => p.id === newPt.id)).toBe(false);
  });

  it("should generate valid ESRI World File (.wld) and Projection WKT (.prj)", () => {
    gis.setGeoreference({ latitude: 35.6895, longitude: 139.6917, trueNorthRotation: 15.0 });
    const wld = gis.exportEsriWorldFile();
    const lines = wld.trim().split("\n");
    expect(lines.length).toBe(6);
    expect(parseFloat(lines[0])).not.toBeNaN();
    expect(parseFloat(lines[4])).toBeGreaterThan(0); // Easting
    expect(parseFloat(lines[5])).toBeGreaterThan(0); // Northing

    const prj = gis.exportPrjFile();
    expect(prj).toContain('PROJCS["WGS_1984_');
    expect(prj).toContain('GEOGCS["GCS_WGS_1984"');
  });

  it("should calculate coordinate picking from 2D mini-map projection", () => {
    gis.setMiniMapZoom(16);
    expect(gis.getMiniMapZoom()).toBe(16);

    const picked = gis.pickLocationFromMiniMap(160, 75, 320, 150);
    // Clicking at the exact center (160, 75) of a 320x150 canvas should return approximately the current site location
    const currLoc = gis.getLocation();
    expect(picked.latitude).toBeCloseTo(currLoc.latitude, 1);
    expect(picked.longitude).toBeCloseTo(currLoc.longitude, 1);
  });

  it("should control 3D True North compass and ground control point visibility", () => {
    expect(gis.isCompassVisible()).toBe(false);
    gis.setCompassVisible(true);
    expect(gis.isCompassVisible()).toBe(true);
    gis.setCompassVisible(false);
    expect(gis.isCompassVisible()).toBe(false);

    expect(gis.isSurveyPointsVisible()).toBe(false);
    gis.setSurveyPointsVisible(true);
    expect(gis.isSurveyPointsVisible()).toBe(true);
    gis.setSurveyPointsVisible(false);
    expect(gis.isSurveyPointsVisible()).toBe(false);

    // Camera alignments and fly-to helpers should run cleanly without throwing
    expect(() => gis.alignCameraToTrueNorth()).not.toThrow();
    expect(() => gis.alignCameraToProjectNorth()).not.toThrow();
    expect(() => gis.flyToCompass()).not.toThrow();
    expect(() => gis.flyToSurveyPoint("BM-01")).not.toThrow();
  });

  it("should parse buildingSMART IFC4 IfcMapConversion and IfcProjectedCRS metadata", () => {
    const mockIfc = `
ISO-10303-21;
HEADER;
ENDSEC;
DATA;
#10=IFCPROJECT('0123456789',#1,'Sample GeoBIM Project',$,$,$,$,(#20),#30);
#20=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#40,#50);
#40=IFCAXIS2PLACEMENT3D(#60,$,$);
#60=IFCCARTESIANPOINT((0.,0.,0.));
#100=IFCSITE('9876543210',#1,'Olympic Stadium Site',$,$,#110,$,$,.ELEMENT.,(35,40,48,720000),(139,42,42,840000),42.5,$,$);
#200=IFCMAPCONVERSION(#20,#210,395420.5,3948750.2,42.5,0.9996,0.02617,1.0);
#210=IFCPROJECTEDCRS('EPSG:32654','WGS 84 / UTM zone 54N','WGS 84','UTM','54N',#220);
ENDSEC;
END-ISO-10303-21;
`;
    const parsed = gis.parseIfcSiteMetadata(mockIfc);
    expect(parsed).not.toBeNull();
    if (parsed) {
      expect(parsed.siteName).toBe("Olympic Stadium Site");
      expect(parsed.latitude).toBeCloseTo(35.6802, 2);
      expect(parsed.longitude).toBeCloseTo(139.7119, 2);
      expect(parsed.elevation).toBeCloseTo(42.5, 1);
      expect(parsed.mapConversion).toBeDefined();
      expect(parsed.mapConversion?.eastings).toBe(395420.5);
      expect(parsed.mapConversion?.northings).toBe(3948750.2);
      expect(parsed.projectedCrs?.name).toBe("EPSG:32654");
    }
  });

  it("should manage model map relocation, coordinate translation, and station snapping", () => {
    // 1. Initial state
    const initial = gis.getModelPlacement();
    expect(initial.x).toBe(0);
    expect(initial.y).toBe(0);
    expect(initial.z).toBe(0);
    expect(initial.rotationY).toBe(0);

    // 2. Set placement offset (+40m East, -25m North, +3.5m Elev, 30 deg rotation)
    const placed = gis.setModelPlacement({
      x: 40,
      z: -25,
      y: 3.5,
      rotationY: 30,
    });
    expect(placed.x).toBe(40);
    expect(placed.z).toBe(-25);
    expect(placed.y).toBe(3.5);
    expect(placed.rotationY).toBe(30);
    expect(placed.latitude).toBeDefined();
    expect(placed.longitude).toBeDefined();

    // 3. Snap to ground basemap elevation
    gis.setBasemapElevation(-1.25);
    const groundSnapped = gis.snapModelToGround();
    expect(groundSnapped.y).toBe(-1.25);

    // 4. Snap model to survey control point (GCP-01 is at local X: 35, Z: -25)
    const gcpSnapped = gis.snapModelToGcp("GCP-01");
    expect(gcpSnapped).not.toBeNull();
    if (gcpSnapped) {
      expect(gcpSnapped.x).toBe(35);
      expect(gcpSnapped.z).toBe(-25);
    }

    // 5. Relocate model to geographic coordinates
    const geoRelocated = gis.relocateModelToCoordinates(37.7750, -122.4190);
    expect(geoRelocated.latitude).toBeCloseTo(37.7750, 3);
    expect(geoRelocated.longitude).toBeCloseTo(-122.4190, 3);

    // 6. Interactive placement mode
    expect(gis.isModelPlacementActive()).toBe(false);
    gis.startModelPlacementMode();
    expect(gis.isModelPlacementActive()).toBe(true);
    gis.stopModelPlacementMode();
    expect(gis.isModelPlacementActive()).toBe(false);

    // 7. Mini-map model coordinate picking
    const miniMapPlaced = gis.pickLocationForModel(160, 75, 320, 150);
    expect(miniMapPlaced.x).toBeDefined();
    expect(miniMapPlaced.z).toBeDefined();

    // 8. Reset model position back to origin
    const reset = gis.resetModelPlacement();
    expect(reset.x).toBe(0);
    expect(reset.y).toBe(0);
    expect(reset.z).toBe(0);
    expect(reset.rotationY).toBe(0);
  });

  it("should extract IFCSITE georeference metadata from fragmented properties dictionary", async () => {
    const mockModel = {
      modelId: "mock-ifc-model",
      properties: {
        1001: {
          type: "IFCSITE",
          Name: { value: "Olympic Stadium Site" },
          RefLatitude: [35, 41, 22, 123456],
          RefLongitude: [139, 41, 30, 654321],
          RefElevation: 42.5,
        },
      },
    };

    const parsed = await gis.parseIfcSiteMetadata(mockModel);
    expect(parsed).toBe(true);
    const loc = gis.getLocation();
    expect(loc.latitude).toBeCloseTo(35.6894, 2);
    expect(loc.longitude).toBeCloseTo(139.6918, 2);
    expect(loc.elevationAMSL).toBe(42.5);
    expect(loc.source).toBe("ifc-site");
    expect(loc.address).toBe("Olympic Stadium Site");
  });

  it("should handle models with no IFCSITE gracefully by retaining valid site datum", async () => {
    const emptyModel = {
      modelId: "empty-ifc-model",
      properties: {
        2001: { type: "IFCWALL", Name: { value: "Wall A" } },
      },
    };

    const parsed = await gis.parseIfcSiteMetadata(emptyModel);
    expect(parsed).toBe(false);
    const loc = gis.getLocation();
    expect(loc.latitude).toBeDefined();
    expect(loc.longitude).toBeDefined();
    expect(loc.source).toBe("project-datum");
  });
});
