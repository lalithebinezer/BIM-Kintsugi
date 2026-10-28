// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { MeasurementSuite } from "../MeasurementSuite";
import { ClashDetector } from "../ClashDetector";
import { CarbonLcaManager } from "../CarbonLcaManager";
import { BimAiCopilot } from "../BimAiCopilot";
import { CollaborationManager } from "../CollaborationManager";
import { BimEngine } from "../../core/BimEngine";
import { StoreyLevelSlicer } from "../StoreyLevelSlicer";
import { BcfIssueManager } from "../BcfIssueManager";
import { GraphicsVFXManager } from "../GraphicsVFXManager";
import { CustomViewManager } from "../../core/CustomViewManager";
import { ScheduleManager } from "../ScheduleManager";
import { generateBOQSummary, highlightBoqCategory, isolateBoqItems, resolveCategoryUnitCost } from "../BoqGenerator";
import { SelectionManager } from "../SelectionManager";

describe("Enterprise BIM Kintsugi Suites", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container" style="width: 1000px; height: 800px;"></div>
      <div id="measurement-list"></div>
      <div id="measurement-count-badge"></div>
      <div id="measurement-mode-badge"></div>
      <div id="measurement-live-val"></div>
      <div id="clash-results-list"></div>
      <div id="clash-total-badge"></div>
      <div id="clash-critical-badge"></div>
      <div id="carbon-total-tonnes"></div>
      <div id="carbon-intensity-m2"></div>
      <div id="carbon-rating-grade"></div>
      <div id="carbon-potential-savings"></div>
      <button id="btn-toggle-carbon-heatmap"></button>
      <div id="copilot-chat-messages"></div>
      <div id="collab-users-list"></div>
      <div id="collab-user-count-badge"></div>
      <button id="btn-follow-host"></button>
    `;
  });

  describe("1. MeasurementSuite", () => {
    let suite: MeasurementSuite;

    beforeEach(() => {
      suite = MeasurementSuite.getInstance();
      suite.clearAllMeasurements();
    });

    it("should toggle snap settings and snap coordinates to precision grid", () => {
      suite.setSnapEnabled(true);
      expect(suite.getSnapEnabled()).toBe(true);

      const raw = new THREE.Vector3(1.02, 2.01, 3.04);
      const snapped = suite.snapPosition(raw);
      expect(snapped.position.x).toBeCloseTo(1.0);
      expect(snapped.position.y).toBeCloseTo(2.0);
      expect(snapped.position.z).toBeCloseTo(3.0);
    });

    it("should start measurement and update active mode state", () => {
      suite.startMeasurement("distance");
      const modeBadge = document.getElementById("measurement-mode-badge");
      expect(modeBadge?.innerText).toContain("DISTANCE");
    });
  });

  describe("2. ClashDetector", () => {
    let detector: ClashDetector;

    beforeEach(() => {
      detector = ClashDetector.getInstance();
    });

    it("should maintain default multi-discipline clash rules", () => {
      const rules = detector.getRules();
      expect(rules.length).toBeGreaterThanOrEqual(3);
      expect(rules.some((r) => r.name.includes("MEP vs Structural"))).toBe(true);
    });

    it("should execute clash audit and populate categorized clash items", async () => {
      const clashes = await detector.runClashAudit();
      expect(clashes.length).toBeGreaterThan(0);

      const first = clashes[0];
      expect(first.elementA).toBeDefined();
      expect(first.elementB).toBeDefined();
      expect(first.overlapDistance).toBeGreaterThan(0);
    });

    it("should export detected clashes to BCF 3.0 JSON format", async () => {
      await detector.runClashAudit();
      const bcfJson = detector.exportBcfIssues();
      const parsed = JSON.parse(bcfJson);
      expect(parsed.bcfVersion).toBe("3.0");
      expect(parsed.topics.length).toBeGreaterThan(0);
    });
  });

  describe("3. CarbonLcaManager", () => {
    let carbonMgr: CarbonLcaManager;

    beforeEach(() => {
      carbonMgr = CarbonLcaManager.getInstance();
    });

    it("should calculate project embodied carbon footprint and energy rating", () => {
      const summary = carbonMgr.calculateProjectCarbon();
      expect(summary.totalCarbonTonnes).toBeGreaterThan(0);
      expect(summary.carbonIntensityPerM2).toBeGreaterThan(0);
      expect(["A+", "A", "B", "C", "D"]).toContain(summary.ratingGrade);
    });

    it("should toggle 6D carbon heatmap overlay", () => {
      const active = carbonMgr.toggleHeatmap(true);
      expect(active).toBe(true);
      expect(carbonMgr.isHeatmapEnabled()).toBe(true);

      const inactive = carbonMgr.toggleHeatmap(false);
      expect(inactive).toBe(false);
    });
  });

  describe("4. BimAiCopilot", () => {
    let copilot: BimAiCopilot;

    beforeEach(() => {
      copilot = BimAiCopilot.getInstance();
    });

    it("should process clash query and dispatch clash audit", async () => {
      const res = await copilot.executeQuery("Run clash detection between MEP and Structure");
      expect(res.sender).toBe("ai");
      expect(res.text).toContain("clash");
      expect(res.actionsExecuted?.length).toBeGreaterThan(0);
    });

    it("should process carbon sustainability query and activate heatmap", async () => {
      const res = await copilot.executeQuery("Show carbon heatmap");
      expect(res.sender).toBe("ai");
      expect(res.text).toContain("Embodied Carbon Heatmap");
    });
  });

  describe("5. CollaborationManager", () => {
    let collabMgr: CollaborationManager;

    beforeEach(() => {
      collabMgr = CollaborationManager.getInstance();
    });

    it("should initialize active user and roster of peers", () => {
      const current = collabMgr.getCurrentUser();
      expect(current.name).toBeDefined();
      expect(current.color).toBeDefined();

      const allUsers = collabMgr.getActiveUsers();
      expect(allUsers.length).toBeGreaterThanOrEqual(3);
    });

    it("should toggle follow host presenter mode", () => {
      const active = collabMgr.toggleFollowHost(true);
      expect(active).toBe(true);
      expect(collabMgr.isFollowingHost()).toBe(true);

      const inactive = collabMgr.toggleFollowHost(false);
      expect(inactive).toBe(false);
    });
  });

  describe("6. ThatOpen Engine Extensions (Outliner, Views, BCFTopics, VolumeMeasurement)", () => {
    it("should initialize BimEngine with Outliner, ClipStyler, Views, and BCFTopics", () => {
      const engine = BimEngine.getInstance();
      expect(engine.components).toBeDefined();
      expect(() => engine.syncOutlinerTheme("#00D2FF", "#D4FF3F")).not.toThrow();
    });

    it("should support volume measurement mode in MeasurementSuite", () => {
      const suite = MeasurementSuite.getInstance();
      suite.startMeasurement("volume");
      const modeBadge = document.getElementById("measurement-mode-badge");
      expect(modeBadge?.innerText).toContain("VOLUME");
      suite.stopMeasurement();
    });

    it("should synchronize StoreyLevelSlicer with OBC.Views and slice levels", async () => {
      const slicer = StoreyLevelSlicer.getInstance();
      const levels = await slicer.syncIfcStoreyViews();
      expect(levels.length).toBeGreaterThanOrEqual(4);
      slicer.setStorey(1);
      expect(slicer.getActiveLevel().id).toBe("L1");
    });

    it("should create BCF issues synced with OBC.BCFTopics and focus clashes", async () => {
      const bcfMgr = BcfIssueManager.getInstance();
      const initialCount = bcfMgr.getTopics().length;
      const created = bcfMgr.createIssue("Pipe vs Beam Clash", "Verify penetration sleeve", "Critical", "MEP Lead");
      expect(created.title).toBe("Pipe vs Beam Clash");
      expect(bcfMgr.getTopics().length).toBe(initialCount + 1);

      const detector = ClashDetector.getInstance();
      const clashes = await detector.runClashAudit();
      expect(() => detector.focusClash(clashes[0].id)).not.toThrow();
    });

    it("should switch PostproductionAspect render styles in GraphicsVFXManager", () => {
      const vfx = GraphicsVFXManager.getInstance();
      vfx.setRenderStyle("pen-shadows");
      expect(vfx.getRenderStyle()).toBe("pen-shadows");
      vfx.setRenderStyle("gloss");
      expect(vfx.getRenderStyle()).toBe("gloss");
      vfx.setRenderStyle("color-pen-shadows");
      expect(vfx.getRenderStyle()).toBe("color-pen-shadows");
    });

    it("should save and restore viewpoints in CustomViewManager without blocking prompt()", async () => {
      const viewMgr = CustomViewManager.getInstance();
      await viewMgr.init({
        camera: {
          three: { position: new THREE.Vector3(10, 12, 15) },
          controls: {
            getPosition: () => new THREE.Vector3(10, 12, 15),
            getTarget: () => new THREE.Vector3(0, 0, 0),
            setLookAt: () => {},
          },
        },
      } as any);
      const saved = viewMgr.saveCurrentView("Level 2 MEP Coordination");
      expect(saved).not.toBeNull();
      expect(saved!.name).toBe("Level 2 MEP Coordination");
      expect(viewMgr.getAllViews().some((v) => v.id === saved!.id)).toBe(true);
      expect(() => viewMgr.restoreView(saved!.id)).not.toThrow();
      viewMgr.deleteView(saved!.id);
    });

    it("should handle storey slicing, render style commands, and XSS escaping in BimAiCopilot", async () => {
      const copilot = BimAiCopilot.getInstance();
      const sliceReply = await copilot.executeQuery("Slice Level 2 floor plan");
      expect(sliceReply.actionsExecuted?.some((a) => a.includes("Slice Storey"))).toBe(true);

      const styleReply = await copilot.executeQuery("Switch to pen blueprint sketch mode");
      expect(styleReply.actionsExecuted).toContain("Render Style: Pen + Shadows");

      await copilot.executeQuery("<script>alert(1)</script>");
      const chatHtml = document.getElementById("copilot-chat-messages")?.innerHTML || "";
      expect(chatHtml).not.toContain("<script>alert(1)</script>");
      expect(chatHtml).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    });

    it("should promote a detected clash directly to a BCF issue with viewpoint", async () => {
      const detector = ClashDetector.getInstance();
      const clashes = await detector.runClashAudit();
      const topic = detector.promoteClashToBcf(clashes[0].id);
      expect(topic).not.toBeNull();
      expect(topic?.topicType).toBe("Clash");
      expect(clashes[0].status).toBe("active");
    });

    it("should partition 4D tasks into completed, inProgress, and planned sets by date", () => {
      const sched = new ScheduleManager();
      const cats = new Map([
        ["IFCFOOTING", [{ modelId: "m1", elementIds: [10, 11] }]],
        ["IFCCOLUMN", [{ modelId: "m1", elementIds: [20, 21] }]],
        ["IFCROOF", [{ modelId: "m1", elementIds: [30, 31] }]],
      ]);
      sched.generateFromCategories(cats, "2026-01-01");
      const state = sched.getPhasingStateAtDate(new Date("2026-01-10"));
      expect(state.inProgress["m1"]?.has(10)).toBe(true);
      expect(state.planned["m1"]?.has(30)).toBe(true);
    });

    it("should highlight and isolate 5D BOQ categories and export 4K technical drawing sheets", async () => {
      expect(resolveCategoryUnitCost("IFCCOLUMN", 0)).toBe(420);
      const summary = generateBOQSummary([
        {
          expressId: 101,
          modelId: "m1",
          category: "IFCWALL",
          elementName: "Core Wall",
          materialNumber: "MAT-01",
          unit: "m³",
          quantity: 12,
          unitCost: 185,
          totalCost: 2220,
          propertySetName: "Qto_WallBaseQuantities",
          quantityType: "NetVolume",
        },
      ]);
      const highlighted = highlightBoqCategory("IFCWALL", summary);
      expect(highlighted["m1"]?.has(101)).toBe(true);
      const isolated = isolateBoqItems(summary.items);
      expect(isolated["m1"]?.has(101)).toBe(true);

      const vfx = GraphicsVFXManager.getInstance();
      const sheetUrl = vfx.exportTechnicalDrawingSheet({
        projectTitle: "Test Sheet",
        storeyName: "Level 1",
        carbonGrade: "A",
        clashCount: 2,
      });
      expect(sheetUrl.startsWith("data:image/png")).toBe(true);

      const classified = await BimEngine.getInstance().classifyModelByStoreyAndCategory();
      expect(Array.isArray(classified.categories)).toBe(true);
      await expect(SelectionManager.getInstance().isolateCategory("IFCWALL")).resolves.toBeDefined();
    });
  });
});
