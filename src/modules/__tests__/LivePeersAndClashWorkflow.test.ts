// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import { CollaborationManager } from "../CollaborationManager";
import { ClashDetector } from "../ClashDetector";
import { BimAiCopilot } from "../BimAiCopilot";
import { BimEngine } from "../../core/BimEngine";

describe("Live Peers On/Off Toggle & Real Clash Detection Workflow", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="container" style="width: 1000px; height: 800px;"></div>
      <button id="btn-dock-collab"></button>
      <div id="collab-live-status-dot"></div>
      <span id="collab-live-status-text"></span>
      <input type="checkbox" id="toggle-live-peers" checked />
      <input type="checkbox" id="settings-toggle-live-peers" checked />
      <span id="collab-user-count-badge"></span>
      <button id="btn-follow-host"></button>
      <button id="btn-collab-ping-loc"></button>
      <button id="btn-collab-mic-toggle"></button>
      <button id="btn-collab-copy-invite"></button>
      <div id="collab-users-list"></div>
      <div id="collab-chat-messages"></div>
      <input id="collab-chat-input" />
      <button id="btn-collab-chat-send"></button>

      <span id="clash-header-count"></span>
      <span id="clash-critical-badge"></span>
      <span id="clash-total-badge"></span>
      <button id="btn-run-clash-audit"><span>Run Clash Audit</span></button>
      <div id="clash-rules-container"></div>
      <div id="clash-scan-summary"></div>
      <div id="clash-matrix-container"></div>
      <select id="clash-severity-filter">
        <option value="all">All</option>
        <option value="critical">Critical</option>
        <option value="major">Major</option>
        <option value="clearance">Clearance</option>
      </select>
      <div id="clash-results-list"></div>
      <div id="copilot-chat-messages"></div>
    `;
  });

  afterEach(() => {
    CollaborationManager.getInstance().setLivePeersEnabled(true);
    const detector = ClashDetector.getInstance();
    detector.setSeverityFilter("all");
    detector.clearClashes();
  });

  it("toggles Live Peers ON and OFF, syncing 3D visibility, peer roster, follow mode, and localStorage", () => {
    const collab = CollaborationManager.getInstance();
    expect(collab.isLivePeersOn()).toBe(true);
    expect(collab.getActiveUsers().length).toBeGreaterThanOrEqual(4);

    // Enable follow-host while ON, then turn Live Peers OFF
    expect(collab.toggleFollowHost(true)).toBe(true);
    const turnedOff = collab.toggleLivePeers(false);
    expect(turnedOff).toBe(false);
    expect(collab.isLivePeersOn()).toBe(false);
    expect(collab.isFollowingHost()).toBe(false);
    expect(collab.getActiveUsers()).toHaveLength(1);
    expect(localStorage.getItem("bim_live_peers_enabled")).toBe("false");

    const toggleEl = document.getElementById("toggle-live-peers") as HTMLInputElement;
    const settingsToggle = document.getElementById("settings-toggle-live-peers") as HTMLInputElement;
    const countBadge = document.getElementById("collab-user-count-badge");
    const followBtn = document.getElementById("btn-follow-host") as HTMLButtonElement;
    const dockBtn = document.getElementById("btn-dock-collab");

    expect(toggleEl.checked).toBe(false);
    expect(settingsToggle.checked).toBe(false);
    expect(countBadge?.innerText).toBe("OFF");
    expect(followBtn.disabled).toBe(true);
    expect(dockBtn?.classList.contains("peers-off")).toBe(true);
    expect(document.getElementById("collab-users-list")?.textContent).toContain("Live Workstation Peers is OFF");

    // Follow / Mic stay disabled while Live Peers is OFF
    expect(collab.toggleFollowHost(true)).toBe(false);
    expect(collab.toggleMic()).toBe(false);

    // Turn Live Peers back ON
    const turnedOn = collab.toggleLivePeers(true);
    expect(turnedOn).toBe(true);
    expect(collab.isLivePeersOn()).toBe(true);
    expect(collab.getActiveUsers().length).toBeGreaterThanOrEqual(4);
    expect(localStorage.getItem("bim_live_peers_enabled")).toBe("true");
    expect(toggleEl.checked).toBe(true);
    expect(settingsToggle.checked).toBe(true);
    expect(followBtn.disabled).toBe(false);
    expect(dockBtn?.classList.contains("peers-off")).toBe(false);
  });

  it("scans loaded FragmentsModel asynchronously using getCategories, getItemsOfCategories, getBoxes, and getItemsData", async () => {
    const engine = BimEngine.getInstance();
    const detector = ClashDetector.getInstance();

    // Duct #101 overlaps Beam #201 by 120mm (min penetration = 0.12m >= 0.01m -> critical)
    // Duct #102 only touches Beam #201 flush (0mm overlap, 50mm within clearance buffer -> clearance, NOT boosted to 80mm!)
    const ductHardBox = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 1, 2));
    const ductFlushBox = new THREE.Box3(new THREE.Vector3(10, 0, 0), new THREE.Vector3(11, 1, 1));
    const beamBox = new THREE.Box3(new THREE.Vector3(1.5, 0.88, 0.5), new THREE.Vector3(10.0, 2.0, 1.5));

    const mockFragModel = {
      modelId: "test-real-model",
      getCategories: async () => ["IFCDUCTSEGMENT", "IFCBEAM", "IFCSPACE"],
      getItemsOfCategories: async (regexes: RegExp[]) => {
        const res: Record<string, number[]> = {};
        if (regexes.some((r) => r.test("IFCDUCTSEGMENT"))) res.IFCDUCTSEGMENT = [101, 102];
        if (regexes.some((r) => r.test("IFCBEAM"))) res.IFCBEAM = [201];
        return res;
      },
      getBoxes: async (ids: number[]) =>
        ids.map((id) => {
          if (id === 101) return ductHardBox.clone();
          if (id === 102) return ductFlushBox.clone();
          return beamBox.clone();
        }),
      getItemsData: async (ids: number[]) =>
        ids.map((id) => ({
          Name: {
            value: id === 101 ? "Main Supply Duct" : id === 102 ? "Flush Branch Duct" : "Primary Steel Girder",
          },
        })),
    };

    const origFrags = engine.fragments;
    const mockMap = new Map<string, any>([["test-real-model", mockFragModel]]);
    (engine as any).fragments = { initialized: false, list: mockMap };

    try {
      const results = await detector.runClashAudit();
      const summary = detector.getLastScanSummary();
      expect(summary?.source).toBe("model");
      expect(summary?.scannedElements).toBe(3);

      const hard = results.find((c) => c.elementA.expressId === 101 && c.elementB.expressId === 201);
      expect(hard).toBeDefined();
      expect(hard?.severity).toBe("critical");
      expect(hard?.overlapDistance).toBeCloseTo(0.12, 3);
      expect(hard?.elementA.name).toBe("Main Supply Duct");
      expect(hard?.elementB.name).toBe("Primary Steel Girder");

      const flush = results.find((c) => c.elementA.expressId === 102 && c.elementB.expressId === 201);
      expect(flush).toBeDefined();
      expect(flush?.severity).toBe("clearance");

      // Severity filtering updates displayed cards cleanly
      detector.setSeverityFilter("critical");
      const cards = document.querySelectorAll("#clash-results-list .clash-card");
      expect(cards.length).toBe(1);

      // Clearing clashes wipes results and badges cleanly
      detector.clearClashes();
      expect(detector.getClashes()).toHaveLength(0);
      expect(document.getElementById("clash-total-badge")?.innerText).toBe("0 Total");
    } finally {
      (engine as any).fragments = origFrags;
    }
  });

  it("does not inject fake demo clashes when a real model is loaded cleanly with zero clashes", async () => {
    const engine = BimEngine.getInstance();
    const detector = ClashDetector.getInstance();

    const farWall = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 3, 4));
    const farBeam = new THREE.Box3(new THREE.Vector3(50, 10, 50), new THREE.Vector3(55, 11, 51));

    const cleanModel = {
      modelId: "test-real-model",
      getCategories: async () => ["IFCWALL", "IFCBEAM"],
      getItemsOfCategories: async () => ({ IFCWALL: [1], IFCBEAM: [2] }),
      getBoxes: async () => [farWall, farBeam],
      getItemsData: async () => [{ Name: { value: "North Wall" } }, { Name: { value: "South Beam" } }],
    };

    const origFrags = engine.fragments;
    (engine as any).fragments = { initialized: false, list: new Map<string, any>([["test-real-model", cleanModel]]) };

    try {
      const results = await detector.runClashAudit();
      expect(results).toHaveLength(0);
      expect(detector.getLastScanSummary()?.source).toBe("model");
      expect(document.getElementById("clash-results-list")?.textContent).toContain("Clean Audit: 0 clashes");
    } finally {
      (engine as any).fragments = origFrags;
    }
  });

  it("handles Copilot clear clash markers and zoom to clash without re-running audit", async () => {
    const detector = ClashDetector.getInstance();
    const copilot = BimAiCopilot.getInstance();

    await detector.runClashAudit();
    expect(detector.getClashes().length).toBeGreaterThan(0);

    const focusReply = await copilot.executeQuery("Zoom to critical clash #1");
    expect(focusReply.actionsExecuted).toContain("Focus Critical Clash in 3D");
    expect(detector.getClashes().length).toBeGreaterThan(0);

    const clearReply = await copilot.executeQuery("Clear clash markers");
    expect(clearReply.actionsExecuted).toContain("Clear Clash Results");
    expect(detector.getClashes()).toHaveLength(0);
  });
});
