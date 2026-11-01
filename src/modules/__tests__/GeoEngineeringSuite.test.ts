import { describe, it, expect } from "vitest";
import {
  solarPosition,
  computeSunPath,
  computeDaylight,
  sunDirection,
  decodeTerrarium,
  computeCutFill,
  proceduralHeights,
  toIfcCompoundAngle,
  buildStandaloneIfcGeoreference,
  injectGeoreferencingIntoIfc,
  parseSurveyCsv,
  computeDiscrepancies,
  summarizeDiscrepancies,
  classifyDeviation,
  discrepanciesToCsv,
  resolveWalkStep,
  resolveEyeHeight,
} from "../GeoEngineeringSuite";

const SF = { lat: 37.7749, lon: -122.4194 };

describe("GeoEngineeringSuite — solar", () => {
  it("summer solstice noon sun is high and roughly south in San Francisco", () => {
    // 13:00 PDT ≈ solar noon; use UTC-7
    const p = solarPosition(SF.lat, SF.lon, 172, 13.2, -7);
    expect(p.elevation).toBeGreaterThan(73);
    expect(p.elevation).toBeLessThan(77);
    expect(p.azimuth).toBeGreaterThan(150);
    expect(p.azimuth).toBeLessThan(215);
  });

  it("winter day is shorter than summer day", () => {
    const summer = computeDaylight(computeSunPath(SF.lat, SF.lon, 172, 0.1, -8));
    const winter = computeDaylight(computeSunPath(SF.lat, SF.lon, 355, 0.1, -8));
    expect(summer.hours).toBeGreaterThan(14);
    expect(winter.hours).toBeLessThan(10);
  });

  it("sun direction maps azimuth 0 to scene -Z (north) and 90 to +X (east)", () => {
    const n = sunDirection(0, 0);
    const e = sunDirection(90, 0);
    expect(n.z).toBeCloseTo(-1);
    expect(e.x).toBeCloseTo(1);
    expect(sunDirection(0, 90).y).toBeCloseTo(1);
  });
});

describe("GeoEngineeringSuite — terrain", () => {
  it("decodes terrarium pixels", () => {
    expect(decodeTerrarium(128, 0, 0)).toBe(0);
    expect(decodeTerrarium(128, 100, 128)).toBeCloseTo(100.5);
  });

  it("computes cut and fill volumes", () => {
    const r = computeCutFill([2, -1, 0, 3], 0, 10);
    expect(r.cut).toBe(50);
    expect(r.fill).toBe(10);
    expect(r.net).toBe(40);
  });

  it("procedural heights are bounded", () => {
    const h = proceduralHeights(17, 5);
    expect(h.length).toBe(289);
    expect(Math.max(...h)).toBeLessThanOrEqual(5.01);
  });
});

describe("GeoEngineeringSuite — IFC4 georeferencing", () => {
  const params = {
    eastings: 551000.123, northings: 4180000.456, orthogonalHeight: 16,
    trueNorthDeg: 45, crsName: "EPSG:32610", mapZone: "10N", latitude: SF.lat, longitude: SF.lon,
  };

  it("converts to IFC compound angles", () => {
    expect(toIfcCompoundAngle(37.5)).toEqual([37, 30, 0, 0]);
    expect(toIfcCompoundAngle(-122.25)[0]).toBe(-122);
  });

  it("builds a valid standalone IFC4 file", () => {
    const ifc = buildStandaloneIfcGeoreference(params);
    expect(ifc).toContain("FILE_SCHEMA(('IFC4'))");
    expect(ifc).toMatch(/IFCPROJECTEDCRS\('EPSG:32610'/);
    expect(ifc).toMatch(/IFCMAPCONVERSION\(#4,#11,551000\.1230,4180000\.4560,16\.0000,0\.70710678\d,-0\.70710678\d,1\.0000\)/);
    expect(ifc).toContain("END-ISO-10303-21;");
  });

  it("injects into existing IFC and replaces old georef", () => {
    const src = "ISO-10303-21;\nDATA;\n#1=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,$,$);\n#2=IFCMAPCONVERSION(#1,$,0.,0.,0.,1.,0.,1.);\nENDSEC;\nEND-ISO-10303-21;";
    const out = injectGeoreferencingIntoIfc(src, params);
    expect(out.match(/IFCMAPCONVERSION/g)!.length).toBe(1);
    expect(out).toMatch(/#4=IFCMAPCONVERSION\(#1,#3,/);
  });
});

describe("GeoEngineeringSuite — survey discrepancy", () => {
  it("parses headered E/N/H CSV and headerless CSV", () => {
    const a = parseSurveyCsv("Point,Easting,Northing,Elevation\nBM-01,1.0,2.0,3.0");
    expect(a[0]).toEqual({ id: "BM-01", x: 1, y: 3, z: -2 });
    const b = parseSurveyCsv("GCP-01,1,2,3\nbad,line\nGCP-02,4,5,6");
    expect(b.length).toBe(2);
  });

  it("classifies and summarises deviations", () => {
    expect(classifyDeviation(0.01)).toBe("pass");
    expect(classifyDeviation(0.02)).toBe("warn");
    expect(classifyDeviation(0.05)).toBe("fail");
    const design = [{ id: "A", x: 0, y: 0, z: 0 }, { id: "B", x: 10, y: 0, z: 0 }];
    const field = [{ id: "a", x: 0.003, y: 0, z: 0.004 }, { id: "B", x: 10.04, y: 0, z: 0 }, { id: "Z", x: 0, y: 0, z: 0 }];
    const list = computeDiscrepancies(design, field);
    expect(list.length).toBe(2);
    expect(list[0].ds).toBeCloseTo(0.005);
    const s = summarizeDiscrepancies(list);
    expect(s.pass).toBe(1);
    expect(s.fail).toBe(1);
    expect(s.maxMm).toBeCloseTo(40);
    expect(discrepanciesToCsv(list).split("\n").length).toBe(3);
  });
});

describe("GeoEngineeringSuite — walkthrough", () => {
  it("stops before walls", () => {
    expect(resolveWalkStep(1, null)).toBe(1);
    expect(resolveWalkStep(1, 0.5, 0.35)).toBeCloseTo(0.15);
    expect(resolveWalkStep(1, 0.2, 0.35)).toBe(0);
  });

  it("follows floors and climbs stairs but not tables", () => {
    expect(resolveEyeHeight(1.65, 0.3, 1.65, 0.45, 1)).toBeCloseTo(1.95);
    expect(resolveEyeHeight(1.65, 0.9, 1.65, 0.45, 1)).toBe(1.65);
    expect(resolveEyeHeight(1.65, null)).toBe(1.65);
  });
});

