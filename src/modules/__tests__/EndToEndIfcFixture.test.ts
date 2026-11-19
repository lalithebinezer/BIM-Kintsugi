import { describe, it, expect } from "vitest";
import ifcText from "./fixtures/sample_enterprise_4d.ifc?raw";
import { runIfcPreflightSummary } from "../../core/IfcPreflightCoordinator";
import { parseIfcStepText } from "../IfcStepParser";
import { ScheduleImportParsers } from "../ScheduleImportParsers";
import { solveCpmGraph } from "../CpmGraphSolver";
import { GisModule } from "../GisModule";
import { extractQuantityData } from "../BoqGenerator";
import { CostRuleBookEngine } from "../CostRuleBookEngine";

describe("End-to-End Real IFC4 Fixture Integration Pipeline", () => {
  it("runs pre-flight scanning detecting IFC4, mm units, MapConversion, WorkSchedule, and Qto", async () => {
    const { report, subtitleText } = await runIfcPreflightSummary(ifcText);
    expect(report.schema).toBe("IFC4");
    expect(report.lengthUnitLabel).toBe("mm");
    expect(report.hasMapConversion).toBe(true);
    expect(report.hasWorkSchedule).toBe(true);
    expect(report.hasElementQuantities).toBe(true);
    expect(subtitleText).toContain("IFC4");
    expect(subtitleText).toContain("CRS/MapConv");
    expect(subtitleText).toContain("IFC4 Schedule");
  });

  it("extracts Qto_WallBaseQuantities provenance and prices via DIN 276 Rule-Book", () => {
    const parsed = parseIfcStepText(ifcText);
    const wall = parsed[101];
    expect(wall).toBeDefined();
    expect(Number(wall.psets["Qto_WallBaseQuantities"]?.NetVolume)).toBe(42.5);
    expect(Number(wall.psets["Qto_WallBaseQuantities"]?.GrossVolume)).toBe(48.0);

    const qty = extractQuantityData({ Name: wall.Name.value, Category: wall.type }, wall.psets);
    expect(qty.quantity).toBe(42.5);
    expect(qty.unit).toBe("m³");
    expect(qty.availableQuantities?.length).toBeGreaterThanOrEqual(2);

    const ruleBook = CostRuleBookEngine.getInstance();
    ruleBook.setStandard("DIN276");
    const matches = ruleBook.matchElement({
      category: wall.type,
      elementName: wall.Name.value,
      preferredUnit: qty.unit,
    });
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].entry.codes.DIN276).toBeTruthy();
  });

  it("extracts native IFC4 WorkSchedule tasks, dependencies, and computes CPM critical path", () => {
    const res = ScheduleImportParsers.parseIfcWorkSchedule(ifcText, "fixture-model");
    expect(res.tasks.length).toBe(2);
    const slabTask = res.tasks.find((t) => t.name.includes("Slab"))!;
    const wallTask = res.tasks.find((t) => t.name.includes("Wall"))!;
    expect(slabTask).toBeDefined();
    expect(wallTask).toBeDefined();
    expect(slabTask.elementIds.has(100)).toBe(true);
    expect(wallTask.elementIds.has(101)).toBe(true);
    expect(wallTask.predecessors?.some((p) => p.predecessorId === slabTask.id && p.type === "FS")).toBe(true);

    const cpm = solveCpmGraph(
      res.tasks.map((t) => ({
        id: t.id,
        name: t.name,
        startDate: t.startDate,
        endDate: t.endDate,
        predecessors: t.predecessors,
      }))
    );
    expect(cpm.hasCycles).toBe(false);
    expect(cpm.criticalPathIds.length).toBeGreaterThanOrEqual(1);
    expect(cpm.criticalPathIds).toContain(wallTask.id);
  });

  it("parses full 6-parameter IFCMAPCONVERSION & IFCPROJECTEDCRS True North angle", () => {
    const meta = GisModule.getInstance().parseIfcSiteMetadata(ifcText);
    expect(meta).not.toBeNull();
    expect(meta.mapConversion?.eastings).toBeCloseTo(691800.5, 2);
    expect(meta.mapConversion?.northings).toBeCloseTo(5334900.25, 2);
    expect(meta.mapConversion?.orthogonalHeight).toBeCloseTo(512.4, 2);
    expect(meta.projectedCrs?.name).toBe("EPSG:25832");
    // Clockwise compass bearing from XAxisAbscissa=0.8660254, XAxisOrdinate=0.5 => (360 - 30) = 330 deg
    expect(GisModule.getInstance().getLocation().trueNorthAngle).toBeCloseTo(330, 0);
  });
});
