// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import { MeasurementSuite } from "../MeasurementSuite";
import { ClashDetector } from "../ClashDetector";
import { CarbonLcaManager } from "../CarbonLcaManager";
import { BimAiCopilot } from "../BimAiCopilot";
import { CollaborationManager } from "../CollaborationManager";

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
});
