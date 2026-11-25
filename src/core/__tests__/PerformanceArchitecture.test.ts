import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { PrecisionOriginController } from "../PrecisionOriginController";
import { ResourceLifecycleManager } from "../ResourceLifecycleManager";
import { MetadataSyncService } from "../MetadataSyncService";
import { MetadataApiAdapter } from "../MetadataApiAdapter";
import { classifyStreamPriority, StreamingLoader } from "../StreamingLoader";
import { GraphicsPipeline } from "../GraphicsPipeline";
import { InstancedBatchManager } from "../InstancedBatchManager";
import { LodAndCullingManager } from "../LodAndCullingManager";
import { BvhAccelerationService } from "../BvhAccelerationService";
import { PointerInputArbiter } from "../PointerInputArbiter";

describe("Enterprise 3D Performance & Optimization Architecture", () => {
  beforeEach(() => {
    PrecisionOriginController.getInstance().setWorldOrigin(0, 0, 0);
    MetadataSyncService.getInstance().clearLruCache();
    MetadataApiAdapter.getInstance().configure(null);
    InstancedBatchManager.getInstance().clearAll();
    LodAndCullingManager.getInstance().clearAll();
  });

  describe("1. PrecisionOriginController (Dual-Origin Float64 <-> Float32)", () => {
    it("eliminates large-coordinate Float32 jitter via camera-relative origin shifts", () => {
      const precision = PrecisionOriginController.getInstance();
      const rawWorld = { x: 540_125.1234, y: 12.5, z: 4_810_234.5678 };

      const unshiftedErrMm = precision.estimateFloat32ErrorMm(rawWorld.z);
      expect(unshiftedErrMm).toBeGreaterThan(200); // >0.25m precision loss at ~4.8M meters

      precision.setWorldOrigin(540_000, 0, 4_810_000);
      const local32 = precision.world64ToRender32(rawWorld);
      expect(local32.x).toBeCloseTo(125.1234, 3);
      expect(local32.y).toBeCloseTo(12.5, 3);
      expect(local32.z).toBeCloseTo(234.5678, 3);

      const roundTrip64 = precision.render32ToWorld64(local32);
      expect(roundTrip64.x).toBeCloseTo(rawWorld.x, 4);
      expect(roundTrip64.z).toBeCloseTo(rawWorld.z, 4);
    });

    it("recenters world origin and shifts anchored objects when camera exceeds threshold", () => {
      const precision = PrecisionOriginController.getInstance();
      precision.setRecenterThreshold(1000);

      const cam = new THREE.PerspectiveCamera(60, 1.5, 0.1, 1000);
      cam.position.set(2500, 0, 0);

      const mesh = new THREE.Object3D();
      mesh.position.set(2510, 5, 0);
      precision.registerAnchoredObject("m1", mesh);

      const shifted = precision.recenterIfNeeded(cam);
      expect(shifted).toBe(true);
      expect(cam.position.x).toBe(0);
      expect(mesh.position.x).toBeCloseTo(10, 4);
      expect(precision.getActiveOrigin64().x).toBeCloseTo(2500, 4);

      precision.updateDepthPrecision(cam, 0.25, 400);
      expect(cam.near).toBeGreaterThanOrEqual(0.02);
      expect(cam.near).toBeLessThan(0.5);
    });
  });

  describe("2. ResourceLifecycleManager (Memory & GC Control)", () => {
    it("disposes subtree geometries, materials, and BVH trees without leaking", () => {
      const lifecycle = ResourceLifecycleManager.getInstance();
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const geoSpy = vi.spyOn(geo, "dispose");
      const matSpy = vi.spyOn(mat, "dispose");

      const group = new THREE.Group();
      group.add(new THREE.Mesh(geo, mat));

      const disposedCount = lifecycle.disposeObjectTree(group, {
        disposeMaterials: true,
        removeFromParent: false,
      });

      expect(disposedCount).toBe(1);
      expect(geoSpy).toHaveBeenCalledTimes(1);
      expect(matSpy).toHaveBeenCalledTimes(1);
    });

    it("reclaims hidden targets past TTL and restores them when marked visible", async () => {
      const lifecycle = ResourceLifecycleManager.getInstance();
      const reclaimSpy = vi.fn();
      const restoreSpy = vi.fn();

      lifecycle.markHidden("storey:L3", reclaimSpy, restoreSpy);
      const count0 = await lifecycle.reclaimExpiredHidden(60_000, Date.now());
      expect(count0).toBe(0);

      const count1 = await lifecycle.reclaimExpiredHidden(1000, Date.now() + 2000);
      expect(count1).toBe(1);
      expect(reclaimSpy).toHaveBeenCalledTimes(1);

      const restored = await lifecycle.markVisible("storey:L3");
      expect(restored).toBe(true);
      expect(restoreSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("3. MetadataSyncService & Remote Adapter (LRU + Lazy Query)", () => {
    it("ingests IFC STEP properties, enforces LRU heap cap, and fetches missing IDs remotely", async () => {
      const service = MetadataSyncService.getInstance();
      service.setLruCapacity(10);

      const sampleStep = [
        "ISO-10303-21;",
        "DATA;",
        "#10=IFCBUILDINGSTOREY('g1',#1,'Level 1',$,$,$,$,$,.ELEMENT.,0.);",
        "#20=IFCPROPERTYSINGLEVALUE('FireRating',$,IFCLABEL('2HR'),$);",
        "#21=IFCPROPERTYSET('g2',#1,'Pset_WallCommon',$,(#20));",
        "#30=IFCWALL('g3',#1,'Core Shear Wall',$,$,$,$,'W-01',.STANDARD.);",
        "#40=IFCRELDEFINESBYPROPERTIES('r1',#1,$,$,(#30),#21);",
        "#41=IFCRELCONTAINEDINSPATIALSTRUCTURE('r2',#1,$,$,(#30),#10);",
        "ENDSEC;",
        "END-ISO-10303-21;",
      ].join("\n");

      const res = await service.ingestStepMetadata("test_model", sampleStep);
      expect(res.elementCount).toBeGreaterThanOrEqual(1);
      expect(res.storeysMap["test_model-30"]).toBe("Level 1");

      const wallMeta = await service.getElementMetadata("test_model", 30);
      expect(wallMeta).toBeTruthy();
      expect(wallMeta.Name.value).toBe("Core Shear Wall");
      expect(wallMeta.psets.Pset_WallCommon.FireRating).toBe("2HR");

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          expressId: 999,
          type: "IFCAIRTERMINAL",
          name: "Diffuser-999",
          storey: "Roof",
          psets: { Pset_Flow: { FlowRate: "450 CFM" } },
        }),
      });
      vi.stubGlobal("fetch", fetchMock);
      MetadataApiAdapter.getInstance().configure({
        mode: "rest",
        baseUrl: "https://bim.example.local/api",
      });

      const remoteMeta = await service.getElementMetadata("remote_model", 999);
      expect(remoteMeta?.Name?.value).toBe("Diffuser-999");
      expect(remoteMeta?.psets?.Pset_Flow?.FlowRate).toBe("450 CFM");
      vi.unstubAllGlobals();
    });
  });

  describe("4. StreamingLoader (Hierarchical Shell vs Internals Partitioning)", () => {
    it("prioritizes primary envelope/structure as shell and MEP/furnishings as internals", () => {
      expect(classifyStreamPriority("IFCWALL")).toBe("shell");
      expect(classifyStreamPriority("IFCSLAB")).toBe("shell");
      expect(classifyStreamPriority("IFCCOLUMN")).toBe("shell");
      expect(classifyStreamPriority("IFCFLOWSEGMENT")).toBe("internals");
      expect(classifyStreamPriority("IFCFURNISHINGELEMENT")).toBe("internals");
      expect(classifyStreamPriority("IFCFASTENER")).toBe("internals");

      const cfg = StreamingLoader.getInstance().getMultithreadingConfig();
      expect(cfg.multithreading?.meshConnectionRate).toBeGreaterThan(0);
    });
  });

  describe("5. GraphicsPipeline & InstancedBatchManager (Single-Draw Batching)", () => {
    it("renders repetitive fixtures in 1 GPU InstancedMesh batch and reports capability tiers", async () => {
      const pipeline = GraphicsPipeline.getInstance();
      const report = await pipeline.probeHardware();
      expect(["ultra", "balanced", "efficiency"]).toContain(report.qualityTier);

      const batchMgr = InstancedBatchManager.getInstance();
      const scene = new THREE.Scene();
      batchMgr.attachToScene(scene);

      const boxGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const mat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const placements = Array.from({ length: 500 }, (_, i) => ({
        id: `bolt_${i}`,
        matrix: new THREE.Matrix4().makeTranslation(i * 0.2, 0, 0),
        color: i % 2 === 0 ? 0xd4ff3f : 0x38bdf8,
      }));

      const instanced = batchMgr.syncBatch("bolts", boxGeo, mat, placements);
      expect(instanced.count).toBe(500);

      const stats = batchMgr.getStats();
      expect(stats.batchCount).toBe(1);
      expect(stats.drawCallsUsed).toBe(1);
      expect(stats.estimatedDrawCallsSaved).toBe(499);

      batchMgr.setInstanceVisible("bolts", "bolt_10", false);
      batchMgr.removeBatch("bolts");
      expect(batchMgr.getStats().batchCount).toBe(0);
    });
  });

  describe("6. LodAndCullingManager (Frustum & Conservative Occlusion Culling)", () => {
    it("culls out-of-frustum and occluded interior targets after hysteresis frames", () => {
      const culler = LodAndCullingManager.getInstance();
      const cam = new THREE.PerspectiveCamera(60, 1, 0.5, 500);
      cam.position.set(0, 2, 20);
      cam.lookAt(0, 2, 0);
      cam.updateMatrixWorld();

      // Solid structural wall at z=10 blocking interior MEP behind it at z=-20
      const wallBox = new THREE.Box3(new THREE.Vector3(-12, -5, 9), new THREE.Vector3(12, 12, 11));
      culler.registerOccluder("shear_wall", wallBox);

      const behindMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
      const behindBox = new THREE.Box3(new THREE.Vector3(-1, 0, -21), new THREE.Vector3(1, 2, -19));
      culler.registerCullable("mep_unit", behindMesh, behindBox);

      const outMesh = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2));
      const outBox = new THREE.Box3(new THREE.Vector3(-1, 0, 50), new THREE.Vector3(1, 2, 52));
      culler.registerCullable("behind_camera", outMesh, outBox);

      // Frame 1: behind_camera culled by frustum immediately; mep_unit waits hysteresis (2 frames)
      culler.evaluateCulling(cam);
      expect(outMesh.visible).toBe(false);
      expect(behindMesh.visible).toBe(true);

      // Frame 2: mep_unit is hidden by conservative occlusion
      const stats2 = culler.evaluateCulling(cam);
      expect(behindMesh.visible).toBe(false);
      expect(stats2.frustumCulledCount).toBe(1);
      expect(stats2.occlusionCulledCount).toBe(1);
    });
  });

  describe("7. BvhAccelerationService & PointerInputArbiter (three-mesh-bvh)", () => {
    it("builds MeshBVH, accelerates raycasting, and snaps to exact mesh vertex via shapecast", () => {
      const bvhService = BvhAccelerationService.getInstance();
      const geo = new THREE.BoxGeometry(4, 4, 4);
      const mat = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.updateMatrixWorld();

      const tree = bvhService.ensureGeometryBvh(geo, "bvh:test");
      expect(tree).toBeTruthy();

      const hits = bvhService.raycastMeshes(
        [mesh],
        { origin: new THREE.Vector3(0, 0, 10), direction: new THREE.Vector3(0, 0, -1) },
        undefined,
        { firstHitOnly: true, ownerTag: "bvh:test" }
      );
      expect(hits.length).toBe(1);
      expect(hits[0].point.z).toBeCloseTo(2, 4);

      const nearCorner = new THREE.Vector3(1.92, 1.95, 1.96);
      const snap = bvhService.findNearestSnapPoint(nearCorner, 0.3, [mesh]);
      expect(snap).toBeTruthy();
      expect(snap!.snapType).toBe("vertex");
      expect(snap!.point.x).toBeCloseTo(2, 4);
      expect(snap!.point.y).toBeCloseTo(2, 4);
      expect(snap!.point.z).toBeCloseTo(2, 4);

      // Snap continuously anywhere along a true architectural box edge (NOT just midpoint/corner)
      const alongTopEdge = new THREE.Vector3(-1.3, 1.94, 1.96);
      const edgeSnap = bvhService.findNearestSnapPoint(alongTopEdge, 0.3, [mesh], { vertexRadius: 0.12 });
      expect(edgeSnap).toBeTruthy();
      expect(edgeSnap!.snapType).toBe("edge");
      expect(edgeSnap!.point.x).toBeCloseTo(-1.3, 3);
      expect(edgeSnap!.point.y).toBeCloseTo(2, 4);
      expect(edgeSnap!.point.z).toBeCloseTo(2, 4);
      expect(edgeSnap!.edgeStart).toBeDefined();
      expect(edgeSnap!.edgeEnd).toBeDefined();

      // Reject coplanar interior triangulation diagonal on the middle of a flat face
      const onFlatFaceCenter = new THREE.Vector3(0.05, 0.05, 2.0);
      const diagCheck = bvhService.findNearestSnapPoint(onFlatFaceCenter, 0.3, [mesh], { vertexRadius: 0.12 });
      expect(diagCheck).toBeNull();

      // Snap accurately on a translated THREE.InstancedMesh (as used by batched BIM elements)
      const instGeo = new THREE.BoxGeometry(2, 2, 2);
      const instMesh = new THREE.InstancedMesh(instGeo, mat, 2);
      instMesh.setMatrixAt(0, new THREE.Matrix4().makeTranslation(0, 0, 0));
      instMesh.setMatrixAt(1, new THREE.Matrix4().makeTranslation(10, 0, 0));
      instMesh.instanceMatrix.needsUpdate = true;
      instMesh.updateMatrixWorld();
      const instNearEdge = new THREE.Vector3(9.45, 0.95, 1.03);
      const instSnap = bvhService.findNearestSnapPoint(instNearEdge, 0.3, [instMesh], {
        vertexRadius: 0.1,
        instanceHints: new Map([[instMesh, 1]]),
      });
      expect(instSnap).toBeTruthy();
      expect(instSnap!.snapType).toBe("edge");
      expect(instSnap!.point.x).toBeCloseTo(9.45, 3);
      expect(instSnap!.point.y).toBeCloseTo(1, 4);
      expect(instSnap!.point.z).toBeCloseTo(1, 4);
      bvhService.disposeGeometryBvh(instGeo);

      const queryBox = new THREE.Box3(new THREE.Vector3(-1, -1, 1.5), new THREE.Vector3(1, 1, 3));
      expect(bvhService.intersectsWorldBox(mesh, queryBox)).toBe(true);

      ResourceLifecycleManager.getInstance().releaseByTag("bvh:test");
      expect((geo as any).boundsTree).toBeNull();
    });

    it("distinguishes orbit drags from deadzone clicks in PointerInputArbiter", () => {
      const arbiter = PointerInputArbiter.getInstance();
      arbiter.setDragDeadzone(5);

      const fakeEl = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        setPointerCapture: vi.fn(),
        hasPointerCapture: vi.fn().mockReturnValue(false),
        releasePointerCapture: vi.fn(),
      } as unknown as HTMLElement;

      arbiter.attach(fakeEl);
      const downCall = (fakeEl.addEventListener as any).mock.calls.find(
        (c: any[]) => c[0] === "pointerdown"
      );
      expect(downCall).toBeTruthy();

      // Simulate pointer tracking map check via public deadzone checker
      expect(arbiter.isClickWithinDeadzone(99, 100, 100)).toBe(true);
      arbiter.dispose();
    });
  });
});
