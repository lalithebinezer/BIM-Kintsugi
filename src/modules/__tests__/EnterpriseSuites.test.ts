// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import {
  MeasurementSuite,
  formatMeasurementLength,
  formatMeasurementArea,
  formatMeasurementVolume,
  MEASUREMENT_UNIT_STORAGE_KEY,
} from "../MeasurementSuite";
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
import { CinematicTourManager } from "../CinematicTourManager";
import { FederationModule } from "../FederationModule";
import { IDSChecker } from "../IdsChecker";

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

    it("should snap continuously to true element edges and midpoints without bogus 0.1m grid rounding", () => {
      suite.setSnapEnabled(true);
      const engine = BimEngine.getInstance();
      const scene = engine.world?.scene?.three;
      expect(scene).toBeDefined();

      // Create an off-grid architectural wall box (edges at x=4.237, y=3.145, z=0.618)
      const wallGeo = new THREE.BoxGeometry(4, 3, 0.3);
      const wallMesh = new THREE.Mesh(wallGeo, new THREE.MeshBasicMaterial());
      wallMesh.position.set(2.237, 1.645, 0.468); // max corner = (4.237, 3.145, 0.618)
      wallMesh.updateMatrixWorld(true);
      scene!.add(wallMesh);

      try {
        // Point near the top-front edge off-center (x=1.123 is away from midpoint 2.237 and corners)
        const nearTopEdge = new THREE.Vector3(1.123, 3.10, 0.59);
        const edgeSnap = suite.snapPosition(nearTopEdge);
        expect(edgeSnap.snapType).toBe("edge");
        expect(edgeSnap.position.x).toBeCloseTo(1.123, 3);
        expect(edgeSnap.position.y).toBeCloseTo(3.145, 3);
        expect(edgeSnap.position.z).toBeCloseTo(0.618, 3);
        expect(edgeSnap.edgeStart).toBeDefined();
        expect(edgeSnap.edgeEnd).toBeDefined();

        // Point near the middle of the flat wall face (far from edges): MUST stay on exact face, NOT round to 0.1m
        const onFlatFace = new THREE.Vector3(2.237, 1.645, 0.618);
        const faceSnap = suite.snapPosition(onFlatFace);
        expect(faceSnap.snapType).toBe("face");
        expect(faceSnap.position.x).toBeCloseTo(2.237, 4);
        expect(faceSnap.position.y).toBeCloseTo(1.645, 4);
        expect(faceSnap.position.z).toBeCloseTo(0.618, 4);
      } finally {
        scene!.remove(wallMesh);
        wallGeo.dispose();
      }
    });

    it("should resolve native ThatOpen Fragment LINE edge snaps and highlight snapped edge endpoints", async () => {
      suite.setSnapEnabled(true);
      const engine = BimEngine.getInstance();
      const origFragments = engine.fragments;
      const origComponents = engine.components;

      const fakeEdgeP1 = new THREE.Vector3(0, 3.0, 2.0);
      const fakeEdgeP2 = new THREE.Vector3(6.0, 3.0, 2.0);
      const hitPoint = new THREE.Vector3(1.75, 2.95, 1.98);

      const fakePicker = {
        getFullPick: async () => ({
          modelId: "model_1",
          itemId: 42,
          localId: 1001,
          point: hitPoint.clone(),
          normal: new THREE.Vector3(0, 0, 1),
          distance: 8,
        }),
      };
      const fakeResolver = {
        maxDistance: 1,
        resolve: async (_pt: THREE.Vector3, _mId: string, _iId: number, classes: number[]) => {
          // Simulate cursor along the edge away from corners: POINT returns FACE fallback, LINE returns exact edge
          if (classes.includes(0)) {
            return { point: hitPoint.clone(), snappingClass: 2 };
          }
          if (classes.includes(1)) {
            return {
              point: new THREE.Vector3(1.75, 3.0, 2.0),
              snappingClass: 1,
              snappedEdgeP1: fakeEdgeP1.clone(),
              snappedEdgeP2: fakeEdgeP2.clone(),
            };
          }
          return null;
        },
      };

      (engine as any).fragments = { initialized: true, list: new Map([["model_1", {}]]) };
      (engine as any).components = {
        get: (ctor: any) => {
          if (ctor?.name === "FastModelPickers") return { get: () => fakePicker };
          if (ctor?.name === "SnapResolvers") return { get: () => fakeResolver };
          return origComponents.get(ctor);
        },
      };

      try {
        const res = await suite.resolveFragmentSnap(new THREE.Vector2(0, 0), 1280, 800);
        expect(res).not.toBeNull();
        expect(res!.snapType).toBe("edge");
        expect(res!.position.x).toBeCloseTo(1.75, 4);
        expect(res!.position.y).toBeCloseTo(3.0, 4);
        expect(res!.position.z).toBeCloseTo(2.0, 4);
        expect(res!.edgeStart?.x).toBeCloseTo(0, 4);
        expect(res!.edgeEnd?.x).toBeCloseTo(6.0, 4);
        expect(res!.elementId).toBe(1001);
      } finally {
        (engine as any).fragments = origFragments;
        (engine as any).components = origComponents;
      }
    });

    it("should convert measurement lengths, areas, volumes & live 3D labels across m, mm, cm, ft-in, ft, and in", () => {
      // Pure unit conversions
      expect(formatMeasurementLength(4.515, "m")).toBe("4.515 m");
      expect(formatMeasurementLength(4.515, "mm")).toBe("4515 mm");
      expect(formatMeasurementLength(4.515, "cm")).toBe("451.5 cm");
      expect(formatMeasurementLength(1.0, "ft")).toBe("3.281 ft");
      expect(formatMeasurementLength(0.3048, "ft-in")).toBe(`1'-0.0"`);
      expect(formatMeasurementLength(0.3047, "ft-in")).toBe(`1'-0.0"`); // inch carry 12.0" -> 1'-0.0"
      expect(formatMeasurementLength(0.254, "in")).toBe("10.00 in");
      expect(formatMeasurementArea(10, "ft")).toBe("107.64 ft²");
      expect(formatMeasurementVolume(1, "ft")).toBe("35.31 ft³");

      // Live re-formatting of existing measurements, 3D DOM labels, and localStorage persistence
      document.body.insertAdjacentHTML(
        "beforeend",
        `<select id="select-measure-unit"><option value="m">m</option><option value="mm">mm</option><option value="ft-in">ft-in</option></select>`
      );

      suite.setUnit("m");
      (suite as any).finalizeDistanceMeasurement(
        { position: new THREE.Vector3(0, 0, 0), snapType: "vertex" },
        { position: new THREE.Vector3(4.515, 0, 0), snapType: "edge" }
      );
      expect(suite.getMeasurements()[0].formattedValue).toBe("4.515 m");

      suite.setUnit("mm");
      expect(suite.getUnit()).toBe("mm");
      expect(localStorage.getItem(MEASUREMENT_UNIT_STORAGE_KEY)).toBe("mm");
      expect(suite.getMeasurements()[0].formattedValue).toBe("4515 mm");
      expect(suite.getMeasurements()[0].labelElement?.innerHTML).toContain("4515 mm");
      expect(document.getElementById("measurement-live-val")?.innerText).toBe("0.0 mm");

      suite.setUnit("ft-in");
      expect(suite.getMeasurements()[0].formattedValue).toBe(`14'-9.8"`);
      expect(suite.getMeasurements()[0].labelElement?.innerHTML).toContain(`14'-9.8"`);

      suite.setUnit("m");
    });

    it("should render opaque bullseye endpoint pins in strict renderOrder and restore active tool button after stop/restart", () => {
      document.body.insertAdjacentHTML(
        "beforeend",
        `<div id="measurement-panel">
          <button id="btn-measure-dist" class="btn-drawer-tool" data-type="distance">Distance</button>
          <button id="btn-measure-angle" class="btn-drawer-tool" data-type="angle">Angle</button>
        </div>`
      );

      suite.startMeasurement("angle");
      expect(document.getElementById("btn-measure-angle")?.classList.contains("active")).toBe(true);
      expect(document.getElementById("btn-measure-dist")?.classList.contains("active")).toBe(false);

      suite.stopMeasurement();
      expect(document.getElementById("btn-measure-angle")?.classList.contains("active")).toBe(false);

      // Re-opening measurement panel restarts distance mode -> Distance button must regain .active
      suite.startMeasurement("distance");
      expect(document.getElementById("btn-measure-dist")?.classList.contains("active")).toBe(true);

      // Verify finalized endpoint pins put BOTH halo and core in opaque queue (`transparent: false`)
      // so the dark halo (9998) never occludes the bright core (9999)
      (suite as any).finalizeDistanceMeasurement(
        { position: new THREE.Vector3(0, 0, 0), snapType: "vertex" },
        { position: new THREE.Vector3(5, 0, 0), snapType: "vertex" }
      );
      const item = suite.getMeasurements()[0];
      expect(item.labelElement?.parentElement?.id).toBe("measurement-labels-overlay");
      const endpointGroups = item.lineGroup!.children.filter((c) => c.userData?.isDimensionEndpoint);
      expect(endpointGroups.length).toBe(2);
      for (const pin of endpointGroups) {
        const halo = pin.getObjectByName("EndpointHalo") as THREE.Mesh;
        const core = pin.getObjectByName("EndpointCore") as THREE.Mesh;
        expect(halo).toBeDefined();
        expect(core).toBeDefined();
        expect((halo.material as THREE.MeshBasicMaterial).transparent).toBe(false);
        expect((core.material as THREE.MeshBasicMaterial).transparent).toBe(false);
        expect(halo.renderOrder).toBeLessThan(core.renderOrder);
      }

      suite.clearAllMeasurements();
      expect(document.querySelectorAll(".bim-3d-dimension-badge").length).toBe(0);
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

    it("should support BCF JSON import, model-aware drone tour bounds, federation transforms, and IDS XML export", async () => {
      const tour = CinematicTourManager.getInstance();
      const bounds = tour.getModelCenterAndRadius();
      expect(bounds.radius).toBeGreaterThan(0);

      const bcf = BcfIssueManager.getInstance();
      const imported = await bcf.importBcfData(
        JSON.stringify([
          {
            guid: "ext-bcf-999",
            title: "External Solibri Issue",
            priority: "Major",
            description: "Imported external coordination topic",
            viewpoint: {
              cameraPosition: { x: 8, y: 4, z: 8 },
              cameraTarget: { x: 0, y: 1, z: 0 },
            },
          },
        ])
      );
      expect(imported).toBe(1);
      expect(bcf.getTopics().some((t) => t.guid === "ext-bcf-999")).toBe(true);

      const fed = FederationModule.getInstance();
      const dummyObj = new THREE.Group();
      fed.registerModel({ modelId: "m-str", object: dummyObj }, "Tower_Structure.ifc");
      fed.setModelTransform("m-str", { x: 2.5, y: 1.0, z: -1.5, rotationY: 90 });
      expect(dummyObj.position.x).toBeCloseTo(2.5);
      expect(dummyObj.position.y).toBeCloseTo(1.0);
      expect(dummyObj.position.z).toBeCloseTo(-1.5);

      const idsChecker = new IDSChecker(BimEngine.getInstance().components);
      const xml = idsChecker.exportIdsXml();
      expect(xml).toContain("<ids");
      expect(xml).toContain("IFCWALL");
      expect(xml).toContain("IFCDOOR");
    });
  });
});
