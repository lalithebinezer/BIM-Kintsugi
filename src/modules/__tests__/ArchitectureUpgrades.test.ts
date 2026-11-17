// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { FragmentIndexer } from "../../core/FragmentIndexer";
import { runSweepAndPrune } from "../../core/clashBroadPhase";
import {
  hasInternalMepEntities,
  hasShellEntities,
  StreamingLoader,
} from "../../core/StreamingLoader";
import { ClashDetector } from "../ClashDetector";
import { CollaborationManager } from "../CollaborationManager";
import { CarbonLcaManager } from "../CarbonLcaManager";
import { AppearanceProfileEngine } from "../AppearanceProfileEngine";
import { SelectionManager } from "../SelectionManager";
import { GraphicsPipeline } from "../../core/GraphicsPipeline";
import { MetadataSyncService } from "../../core/MetadataSyncService";

describe("Architecture Upgrades (Tracks 1 - 6)", () => {
  beforeEach(() => {
    FragmentIndexer.getInstance().clearAll();
    localStorage.clear();
  });

  describe("Track 1: Shared Async FragmentIndexer & Module Integration", () => {
    it("indexes FRAGS v3 categories, boxes, names, and Qto volumes without legacy model.properties", async () => {
      const mockModel = {
        modelId: "frags_v3_test",
        getCategories: vi.fn(async () => [
          "IFCWALL",
          "IFCCOLUMN",
          "IFCRELDEFINESBYPROPERTIES",
          "IFCPROPERTYSET",
        ]),
        getItemsOfCategories: vi.fn(async () => ({
          IFCWALL: [101],
          IFCCOLUMN: [202],
        })),
        getBoxes: vi.fn(async () => [
          new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(4, 3, 0.3)),
          new THREE.Box3(new THREE.Vector3(1, 0, 0), new THREE.Vector3(1.5, 4, 0.5)),
        ]),
        getItemsData: vi.fn(async () => [
          {
            Name: { value: "Core Shear Wall W1" },
            GlobalId: { value: "GUID_W1" },
            IsDefinedBy: [
              {
                Name: { value: "Qto_WallBaseQuantities" },
                HasProperties: [{ Name: { value: "NetVolume" }, VolumeValue: { value: 3.6 } }],
              },
            ],
          },
          {
            Name: { value: "C35 Square Column C1" },
            GlobalId: { value: "GUID_C1" },
            IsDefinedBy: [],
          },
        ]),
      };

      const indexer = FragmentIndexer.getInstance();
      const summary = await indexer.indexModel("frags_v3_test", mockModel, {
        includeBoxes: true,
        includePsets: true,
      });

      expect(summary.source).toBe("fragments-v3");
      expect(summary.elements).toHaveLength(2);
      expect(summary.categories).toEqual(["IFCWALL", "IFCCOLUMN"]);

      const wall = summary.byExpressId.get(101)!;
      expect(wall.name).toBe("Core Shear Wall W1");
      expect(wall.volumeM3).toBe(3.6);
      expect(wall.box?.max.x).toBe(4);

      const col = summary.byExpressId.get(202)!;
      expect(col.name).toBe("C35 Square Column C1");
      expect(col.volumeM3).toBeGreaterThan(0.4); // computed from real Box3 (0.5 * 4 * 0.5 * 0.45)

      // Cache hit avoids redundant FRAGS worker calls
      const cached = await indexer.indexModel("frags_v3_test", mockModel, {
        includeBoxes: true,
        includePsets: true,
      });
      expect(cached).toBe(summary);
      expect(mockModel.getCategories).toHaveBeenCalledTimes(1);

      // AppearanceProfileEngine uses indexed Box3 directly
      const profileBox = AppearanceProfileEngine.getInstance().getElementBoundingBox(
        "frags_v3_test",
        101
      );
      expect(profileBox.max.x).toBe(4);
      expect(profileBox.max.y).toBe(3);

      // Invalidation removes cached entry
      indexer.invalidateModel("frags_v3_test");
      expect(indexer.getCachedModel("frags_v3_test")).toBeNull();
    });

    it("resolves real SelectionInfo names from FragmentIndexer when model.properties is absent", async () => {
      const mockModel = {
        modelId: "sel_frags_model",
        getCategories: async () => ["IFCBEAM"],
        getItemsOfCategories: async () => ({ IFCBEAM: [77] }),
        getBoxes: async () => [new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 1, 1))],
        getItemsData: async () => [{ Name: { value: "Steel Truss Beam B77" } }],
      };

      await FragmentIndexer.getInstance().indexModel("sel_frags_model", mockModel);
      const selMgr = SelectionManager.getInstance();
      (selMgr as any).selectedElements = { sel_frags_model: new Set([77]) };
      const info = selMgr.getSelectionInfo();
      expect(info.primaryName).toBe("Steel Truss Beam B77");
      expect(info.primaryCategory).toBe("IFCBEAM");
      (selMgr as any).selectedElements = {};
    });

    it("CarbonLcaManager reads real FRAGS v3 element volumes from FragmentIndexer", async () => {
      const mockModel = {
        modelId: "lca_model",
        getCategories: async () => ["IFCWALL", "IFCSLAB"],
        getItemsOfCategories: async () => ({ IFCWALL: [1], IFCSLAB: [2] }),
        getBoxes: async () => [
          new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(5, 3, 0.2)),
          new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 0.3, 10)),
        ],
        getItemsData: async () => [{ Name: { value: "Wall 1" } }, { Name: { value: "Slab 2" } }],
      };

      await FragmentIndexer.getInstance().indexModel("lca_model", mockModel, { includeBoxes: true });
      const lca = CarbonLcaManager.getInstance();
      const fakeFrags = { initialized: true, list: new Map([["lca_model", mockModel]]) };
      const origFrags = (lca as any).engine.fragments;
      (lca as any).engine.fragments = fakeFrags;
      try {
        const elems = lca.getAnalyzedElements();
        expect(elems).toHaveLength(2);
        expect(elems[0].name).toBe("Wall 1");
        expect(elems[1].volumeM3).toBeGreaterThan(10);
      } finally {
        (lca as any).engine.fragments = origFrags;
      }
    });
  });

  describe("Track 2: StreamingLoader Two-Phase Pre-check & Dual Caching", () => {
    it("detects structural-only IFC buffers and skips redundant Phase 2 ::internals parsing", async () => {
      const structuralStep = new TextEncoder().encode(
        [
          "ISO-10303-21;",
          "#10=IFCWALL('a',$,'W1');",
          "#11=IFCBEAM('b',$,'B1');",
          "#12=IFCCOLUMN('c',$,'C1');",
          "#13=IFCBUILDINGELEMENTPROXY('p',$,'P1');",
          "END-ISO-10303-21;",
        ].join("\n")
      );
      expect(hasShellEntities(structuralStep)).toBe(true);
      expect(hasInternalMepEntities(structuralStep)).toBe(false);

      const loadSpy = vi.fn(async (_buf: Uint8Array, _coords: boolean, modelId: string) => ({
        modelId,
        setLodMode: vi.fn(async () => {}),
        getBuffer: vi.fn(async () => new Uint8Array([1, 2, 3])),
      }));

      const meta = MetadataSyncService.getInstance();
      const getBufSpy = vi.spyOn(meta, "getFragmentBuffer").mockResolvedValue(null);

      const res = await StreamingLoader.getInstance().streamIfc(
        { load: loadSpy },
        {
          modelId: "snowdon_struct.ifc",
          name: "snowdon_struct.ifc",
          buffer: structuralStep,
          shellFirstThresholdBytes: 10, // force size threshold check
        }
      );

      expect(res.strategy).toBe("tile-stream");
      expect(res.secondaryPromise).toBeNull();
      expect(loadSpy).toHaveBeenCalledTimes(1);
      getBufSpy.mockRestore();
    });

    it("uses shell-then-internals and streams cached ::shell + ::internals for dense MEP IFCs", async () => {
      const mepLines = Array.from({ length: 12 }, (_, i) => `#${100 + i}=IFCFLOWSEGMENT('g${i}',$,'Duct ${i}');`);
      const mepStep = new TextEncoder().encode(
        ["#1=IFCWALL('w',$,'Wall');", "#2=IFCSLAB('s',$,'Slab');", ...mepLines].join("\n")
      );
      expect(hasShellEntities(mepStep)).toBe(true);
      expect(hasInternalMepEntities(mepStep)).toBe(true);

      const meta = MetadataSyncService.getInstance();
      const getBufSpy = vi.spyOn(meta, "getFragmentBuffer").mockImplementation(async (key: string) => {
        if (key.endsWith("::shell")) return new Uint8Array([9, 9]);
        if (key.endsWith("::internals")) return new Uint8Array([8, 8]);
        return null;
      });
      const streamSpy = vi
        .spyOn(StreamingLoader.getInstance(), "loadFragmentStream")
        .mockImplementation(async (_buf, id) => ({ modelId: id }));

      const res = await StreamingLoader.getInstance().streamIfc(
        { load: vi.fn() },
        {
          modelId: "hospital_mep.ifc",
          name: "hospital_mep.ifc",
          buffer: mepStep,
          shellFirstThresholdBytes: 10,
        }
      );

      expect(res.strategy).toBe("cached-tile-stream");
      expect(res.primaryModel.modelId).toBe("hospital_mep.ifc");
      const sec = await res.secondaryPromise;
      expect(sec?.modelId).toBe("hospital_mep.ifc::internals");

      getBufSpy.mockRestore();
      streamSpy.mockRestore();
    });
  });

  describe("Track 3: 1D Sweep-and-Prune Clash Kernel & Rules", () => {
    it("finds exact intersecting & clearance pairs via X-axis Sweep-and-Prune", () => {
      // Element 0: Duct at X [0..4], Y [0..1], Z [0..1]
      // Element 1: Beam intersecting Duct at X [1..3], Y [0.5..2], Z [0..1]
      // Element 2: Wall separated along X at X [10..12], Y [0..3], Z [0..3]
      // Element 3: Pipe near clearance at X [4.03..5], Y [0..1], Z [0..1] (0.03m gap)
      const boxes = new Float64Array([
        0, 0, 0, 4, 1, 1,
        1, 0.5, 0, 3, 2, 1,
        10, 0, 0, 12, 3, 3,
        4.03, 0, 0, 5, 1, 1,
      ]);

      const { hits } = runSweepAndPrune(boxes, [
        {
          ruleIdx: 0,
          groupA: [0, 3],
          groupB: [1, 2],
          hardTolerance: 0.01,
          softBuffer: 0.05,
        },
        {
          ruleIdx: 1,
          groupA: [0],
          groupB: [3],
          hardTolerance: 0.01,
          softBuffer: 0.05,
        },
      ]);

      const hardHit = hits.find((h) => h.idxA === 0 && h.idxB === 1);
      expect(hardHit).toBeDefined();
      expect(hardHit!.isHard).toBe(true);
      expect(hardHit!.severity).toBe("critical");

      const clearanceHit = hits.find((h) => h.idxA === 0 && h.idxB === 3);
      expect(clearanceHit).toBeDefined();
      expect(clearanceHit!.isHard).toBe(false);
      expect(clearanceHit!.severity).toBe("clearance");

      // Separated wall should never match
      expect(hits.some((h) => h.idxA === 2 || h.idxB === 2)).toBe(false);
    });

    it("updates per-rule tolerances cleanly on ClashDetector", () => {
      const detector = ClashDetector.getInstance();
      const ok = detector.updateRuleTolerances(0, 0.03, 0.12);
      expect(ok).toBe(true);
      expect(detector.getRules()[0].hardClashTolerance).toBe(0.03);
      expect(detector.getRules()[0].softClearanceBuffer).toBe(0.12);

      detector.setIsolateContextOnFocus(false);
      expect(detector.isIsolateContextOnFocus()).toBe(false);
      detector.setIsolateContextOnFocus(true);
    });
  });

  describe("Track 4: Cross-Device Live Peers, Profile Persistence & Demo Toggle", () => {
    it("supports room scoping, persisted user profile, Hide Demo Peers toggle, and relay validation", async () => {
      const collab = CollaborationManager.getInstance();
      collab.setLivePeersEnabled(true);
      collab.setHideDemoPeers(false);

      // Update profile & persist
      const profile = collab.setUserProfile("Alex <Architect>", "BIM Coordinator");
      expect(profile.name).toBe("Alex <Architect>");
      expect(collab.getCurrentUser().role).toBe("BIM Coordinator");

      // Change room & check invite URL
      collab.setRoomId("TOWER-PHASE-2");
      expect(collab.getRoomId()).toBe("TOWER-PHASE-2");
      expect(collab.getInviteUrl()).toContain("room=TOWER-PHASE-2");

      // Inject a real remote peer via transport envelope
      (collab as any).handleTransportPayload({
        type: "user_presence",
        roomId: "TOWER-PHASE-2",
        data: {
          id: "real_peer_99",
          name: "Maya Lin",
          role: "Structural PE",
          color: "#10B981",
          cursorPosition: [2, 3, 4],
          cameraPosition: [10, 10, 10],
          cameraTarget: [0, 0, 0],
          lastActive: "Just now",
        },
      });

      const withDemo = collab.getActiveUsers();
      expect(withDemo.some((u) => u.isDemo)).toBe(true);
      expect(withDemo.some((u) => u.id === "real_peer_99")).toBe(true);

      // Hide demo peers -> keeps local user + real connected peer only
      collab.setHideDemoPeers(true);
      const realOnly = collab.getActiveUsers();
      expect(realOnly.some((u) => u.isDemo)).toBe(false);
      expect(realOnly.some((u) => u.id === "real_peer_99")).toBe(true);

      // Reject non-WS protocol relay URLs safely
      expect(await collab.connectWebSocketRelay("http://invalid-protocol")).toBe(false);

      collab.setHideDemoPeers(false);
    });
  });

  describe("Track 6: GraphicsPipeline Experimental WebGPU Readiness", () => {
    it("probes WebGPU availability and persists experimental opt-in preference", async () => {
      const pipeline = GraphicsPipeline.getInstance();
      pipeline.setExperimentalWebGpu(true);
      expect(pipeline.isExperimentalWebGpuEnabled()).toBe(true);

      const report = await pipeline.probeHardware({ force: true });
      expect(report.experimentalWebGpuOptIn).toBe(true);
      expect(typeof pipeline.getBackendDisplayLabel()).toBe("string");

      pipeline.setExperimentalWebGpu(false);
    });
  });
});
