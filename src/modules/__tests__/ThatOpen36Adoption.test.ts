// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { BimEngine } from "../../core/BimEngine";
import { GraphicsVFXManager } from "../GraphicsVFXManager";
import { HighlighterManager } from "../HighlighterManager";
import { AnnotationModule } from "../AnnotationModule";
import { TechnicalDrawingModule } from "../TechnicalDrawingModule";
import { RealityCaptureModule } from "../RealityCaptureModule";
import { IfcSplitterModule } from "../IfcSplitterModule";
import { CivilAlignmentModule } from "../CivilAlignmentModule";
import { ClashDetector } from "../ClashDetector";

describe("ThatOpen 3.6.x Option-B Feature Adoption Suite", () => {
  beforeEach(() => {
    document.body.innerHTML = `<div id="container" style="width: 1000px; height: 800px;"></div>`;
    const container = document.getElementById("container")!;
    void container;
    BimEngine.getInstance();
  });

  it("1. HighlighterManager applies deterministic style priority hierarchy", () => {
    const styleMap = new Map<string, Record<string, any>>([
      ["select", {}],
      ["ClashElementA", {}],
      ["IDS_Fail", {}],
      ["audit-unassigned", {}],
      ["IDS_Pass", {}],
      ["timeline-inprogress", {}],
      ["hover", {}],
      ["audit-ghost", {}],
    ]);

    HighlighterManager.applyStylePriorities({ styles: styleMap });

    expect(styleMap.get("select")!.priority).toBeGreaterThan(styleMap.get("ClashElementA")!.priority);
    expect(styleMap.get("ClashElementA")!.priority).toBeGreaterThan(styleMap.get("IDS_Fail")!.priority);
    expect(styleMap.get("IDS_Fail")!.priority).toBeGreaterThan(styleMap.get("IDS_Pass")!.priority);
    expect(styleMap.get("IDS_Pass")!.priority).toBeGreaterThan(styleMap.get("hover")!.priority);
    expect(styleMap.get("hover")!.priority).toBeGreaterThan(styleMap.get("audit-ghost")!.priority);
  });

  it("2. GraphicsVFXManager manages Deferred vs Composer pipeline mode and adaptive FPS", () => {
    const vfx = GraphicsVFXManager.getInstance();
    vfx.setPipelineMode("composer");
    expect(vfx.getPipelineMode()).toBe("composer");
    expect(localStorage.getItem("bim_pipeline_mode")).toBe("composer");

    vfx.setPipelineMode("deferred");
    expect(vfx.getPipelineMode()).toBe("deferred");
    expect(localStorage.getItem("bim_pipeline_mode")).toBe("deferred");

    vfx.setAdaptiveResolution(false, 60);
    expect(vfx.isAdaptiveResolutionEnabled()).toBe(false);
    vfx.setAdaptiveResolution(true, 55);
    expect(vfx.isAdaptiveResolutionEnabled()).toBe(true);
  });

  it("3. AnnotationModule toggles native Fragments setGhostItems / clearGhost X-Ray mode", () => {
    const setGhostItems = vi.fn().mockResolvedValue(undefined);
    const clearGhost = vi.fn();
    const setGhostOpacity = vi.fn();
    const engine = BimEngine.getInstance();
    const origFragments = engine.fragments;

    (engine as any).fragments = {
      list: new Map([["m1", { setGhostItems, clearGhost }]]),
      core: { setGhostOpacity, update: vi.fn().mockResolvedValue(undefined) },
    };
    (engine as any).highlighter = {
      selection: { select: { m1: new Set([101, 202]) } },
    };

    try {
      const anno = AnnotationModule.getInstance();
      anno.toggleXRay(true);
      expect(setGhostOpacity).toHaveBeenCalledWith(0.24);
      expect(setGhostItems).toHaveBeenCalledWith([101, 202], true);

      anno.toggleXRay(false);
      expect(clearGhost).toHaveBeenCalled();
    } finally {
      (engine as any).fragments = origFragments;
    }
  });

  it("4. TechnicalDrawingModule initializes EdgeProjector/DXF and validates missing projection", () => {
    const td = TechnicalDrawingModule.getInstance();
    expect(td.getLastView()).toBe("top");
    expect(() => td.exportDxf()).toThrow(/Generate a 2D projection/);
    td.dispose();
  });

  it("5. RealityCaptureModule configures PointCloudSettings (budget, edl) and Splat scale", () => {
    const rc = RealityCaptureModule.getInstance();
    rc.setPointBudget(3_000_000);
    rc.setEdlEnabled(false);
    rc.setEdlEnabled(true);
    rc.setSplatScale(1.45);
    rc.setCaptureOffset(1, 2, 3);
    const summary = rc.disposeAll();
    expect(summary).toEqual({ clouds: 0, splats: 0, totalPoints: 0 });
  });

  it("6. IfcSplitterModule splits a synthetic IFC buffer into standalone IFC files in-memory", async () => {
    const sampleIfc = [
      "ISO-10303-21;",
      "HEADER;",
      "FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');",
      "FILE_NAME('sample.ifc','2026-11-16T00:00:00',('Author'),('Org'),'','','');",
      "FILE_SCHEMA(('IFC4'));",
      "ENDSEC;",
      "DATA;",
      "#1=IFCPROJECT('0x001',$,'Proj',$,$,$,$,$,$);",
      "#2=IFCSITE('0x002',$,'Site',$,$,$,$,$,.ELEMENT.,$,$,$,$,$);",
      "#3=IFCBUILDING('0x003',$,'Bldg',$,$,$,$,$,.ELEMENT.,$,$,$);",
      "#4=IFCBUILDINGSTOREY('0x004',$,'Level 1',$,$,$,$,$,.ELEMENT.,0.);",
      "#5=IFCRELAGGREGATES('0x005',$,$,$,#1,(#2));",
      "#6=IFCRELAGGREGATES('0x006',$,$,$,#2,(#3));",
      "#7=IFCRELAGGREGATES('0x007',$,$,$,#3,(#4));",
      "#10=IFCWALL('0x010',$,'Wall-1',$,$,$,$,$,.NOTDEFINED.);",
      "#11=IFCWALL('0x011',$,'Wall-2',$,$,$,$,$,.NOTDEFINED.);",
      "#12=IFCSLAB('0x012',$,'Slab-1',$,$,$,$,$,.FLOOR.);",
      "#20=IFCRELCONTAINEDINSPATIALSTRUCTURE('0x020',$,$,$,(#10,#11,#12),#4);",
      "ENDSEC;",
      "END-ISO-10303-21;",
    ].join("\n");

    const splitter = IfcSplitterModule.getInstance();
    const bytes = new TextEncoder().encode(sampleIfc);
    const outputs = await splitter.splitBuffer(bytes, 2, "Demo.ifc");

    expect(outputs.length).toBeGreaterThanOrEqual(1);
    for (const part of outputs) {
      expect(part.content).toContain("ISO-10303-21;");
      expect(part.content).toContain("END-ISO-10303-21;");
    }
    const extracted = await splitter.extractIds(bytes, [10], "WallOnly.ifc");
    expect(extracted.itemCount).toBeGreaterThanOrEqual(1);
    expect(extracted.content).toContain("IFCWALL('0x010'");
  });

  it("7. ClashDetector toggles Deep Triangle BVH Verification via OBF.Mesher cleanly", async () => {
    const detector = ClashDetector.getInstance();
    detector.setDeepMeshVerification(true);
    expect(detector.isDeepMeshVerification()).toBe(true);
    const clashes = await detector.runClashAudit();
    expect(Array.isArray(clashes)).toBe(true);
    expect(clashes.length).toBeGreaterThan(0);
    detector.setDeepMeshVerification(false);
    expect(detector.isDeepMeshVerification()).toBe(false);
  });

  it("8. CivilAlignmentModule scans models and toggles cross-section state cleanly", async () => {
    const civil = CivilAlignmentModule.getInstance();
    const report = await civil.scanAndAttachAlignments();
    expect(report.alignmentCount).toBe(0);
    expect(civil.toggleCrossSection(true)).toBe(true);
    expect(civil.toggleCrossSection(false)).toBe(false);
    civil.dispose();
  });
});
