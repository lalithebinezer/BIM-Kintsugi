import { describe, it, expect } from "vitest";
import { parseIfcStepText, scanIfcPreflight } from "../IfcStepParser";
import { GisModule } from "../GisModule";
import {
  sampleClothoidSegment,
  sampleVerticalParabola,
  formatChainage,
  buildVerticalProfileSvg,
} from "../CivilAlignmentModule";
import { buildStandaloneIfcGeoreference } from "../GeoEngineeringSuite";

describe("Phase 5: STEP Pre-Flight Scanner, Full IfcMapConversion & Civil Clothoids", () => {
  it("runs pre-flight STEP inspection detecting schema, SI unit factor, alignments, schedules & QTOs", () => {
    const sampleStep = `ISO-10303-21;
HEADER;
FILE_SCHEMA(('IFC4X3'));
ENDSEC;
DATA;
#10=IFCSIUNIT(*,.LENGTHUNIT.,.MILLI.,.METRE.);
#20=IFCPROJECTEDCRS('EPSG:32632','WGS84 / UTM zone 32N','WGS84','DHHN2016','UTM','32N',$);
#21=IFCMAPCONVERSION(#5,#20,500120.5,5700200.25,412.75,0.8660254,0.5,1.0);
#30=IFCALIGNMENTHORIZONTAL('g-al',$,'Main Highway',$,$,#31,$);
#40=IFCWORKSCHEDULE('g-ws',$,'Bridge Schedule',$,$,$,$,$,$,$,$);
#50=IFCELEMENTQUANTITY('g-qto',$,'Qto_WallBaseQuantities',$,$,(#51));
#51=IFCQUANTITYVOLUME('NetVolume',$,$,18.75,$);
ENDSEC;
END-ISO-10303-21;`;

    const report = scanIfcPreflight(sampleStep);
    expect(report.schema).toBe("IFC4X3");
    expect(report.lengthUnitFactor).toBe(0.001);
    expect(report.lengthUnitLabel).toBe("mm");
    expect(report.hasMapConversion).toBe(true);
    expect(report.hasProjectedCrs).toBe(true);
    expect(report.hasAlignment).toBe(true);
    expect(report.hasWorkSchedule).toBe(true);
    expect(report.hasElementQuantities).toBe(true);
    expect(report.totalEntities).toBe(7);
  });

  it("parses multi-line STEP statements and Qto_* physical quantities in parseIfcStepText", () => {
    const multiLineIfc = `
#100=IFCWALL('guid-w1',$,
  'Core Shear Wall',$,$,$,$,$);
#200=IFCQUANTITYVOLUME('NetVolume',$,$,
  24.5,$);
#210=IFCELEMENTQUANTITY('q-1',$,
  'Qto_WallBaseQuantities',$,$,(#200));
#300=IFCRELDEFINESBYPROPERTIES('r-1',$,$,$,
  (#100),#210);
`;
    const parsed = parseIfcStepText(multiLineIfc);
    expect(parsed[100]).toBeDefined();
    expect(parsed[100].Name.value).toBe("Core Shear Wall");
    expect(parsed[100].psets["Qto_WallBaseQuantities"]?.["NetVolume"]).toBe("24.5");
  });

  it("extracts full 6-parameter IfcMapConversion rotation/scale and ProjectedCRS round-trip", () => {
    const stepText = buildStandaloneIfcGeoreference({
      crsName: "EPSG:25832",
      eastings: 451234.5,
      northings: 5334567.25,
      orthogonalHeight: 515.4,
      trueNorthDeg: 30,
      scale: 0.9996,
      latitude: 48.1351,
      longitude: 11.582,
      mapZone: "32N",
    });

    const gis = GisModule.getInstance();
    const res = gis.parseIfcSiteMetadata(stepText);
    expect(res.mapConversion.eastings).toBeCloseTo(451234.5, 2);
    expect(res.mapConversion.northings).toBeCloseTo(5334567.25, 2);
    expect(res.mapConversion.orthogonalHeight).toBeCloseTo(515.4, 2);
    expect(res.mapConversion.scale).toBeCloseTo(0.9996, 4);
    expect(res.mapConversion.trueNorthDeg).toBeCloseTo(30, 1);
    expect(res.projectedCrs.name).toBe("EPSG:25832");
    expect(res.projectedCrs.mapZone).toBe("32N");
  });

  it("samples Clothoid spiral curvature, vertical parabolic grades, chainage labels & SVG profile accurately", () => {
    // Straight tangent (R0 = Infinity) transitioning to R1 = 200m over L = 100m
    // End tangent angle exact formula: theta(L) = 0 + L / (2 * R1) = 100 / 400 = 0.25 rad
    const clothoid = sampleClothoidSegment(
      {
        startX: 0,
        startZ: 0,
        startDirRad: 0,
        length: 100,
        startRadius: Infinity,
        endRadius: 200,
        startStation: 1000,
      },
      40
    );
    const last = clothoid[clothoid.length - 1];
    expect(last.station).toBe(1100);
    expect(last.tangentRad).toBeCloseTo(0.25, 6);
    expect(last.curvature).toBeCloseTo(1 / 200, 6);
    expect(formatChainage(1250)).toBe("1+250");

    const vCurve = sampleVerticalParabola(100, 0.02, -0.02, 200, 1000, 20);
    // Crest symmetric parabola midpoint (x = 100m): elev = 100 + 0.02*100 - 0.04/(400)*100^2 = 101.0m
    const mid = vCurve[10];
    expect(mid.elevation).toBeCloseTo(101.0, 3);
    expect(mid.grade).toBeCloseTo(0, 4);

    const svg = buildVerticalProfileSvg(vCurve);
    expect(svg).toContain("1+000");
    expect(svg).toContain("1+200");
  });
});
