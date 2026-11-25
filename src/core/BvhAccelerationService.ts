import * as THREE from "three";
import {
  MeshBVH,
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree,
  estimateMemoryInBytes,
  SAH,
  INTERSECTED,
  NOT_INTERSECTED,
  type HitPointInfo,
} from "three-mesh-bvh";
import { ResourceLifecycleManager } from "./ResourceLifecycleManager";

export interface BvhSnapResult {
  point: THREE.Vector3;
  snapType: "vertex" | "edge" | "midpoint" | "face";
  distance: number;
  mesh: THREE.Mesh;
  edgeStart?: THREE.Vector3;
  edgeEnd?: THREE.Vector3;
}

export interface BvhSnapOptions {
  /** Tighter capture radius for corner vertices & edge midpoints (defaults to min(snapRadius * 0.65, 0.25)) */
  vertexRadius?: number;
  /** Optional map of InstancedMesh -> known hit instanceId so we transform the exact hit instance */
  instanceHints?: Map<THREE.InstancedMesh, number>;
  /** Cos of minimum dihedral angle to classify an edge as a true feature edge (default ~10 deg => 0.985) */
  creaseDotThreshold?: number;
}

export interface BvhStats {
  patched: boolean;
  indexedMeshes: number;
  estimatedMemoryKb: number;
  lastRaycastMs: number;
}

/**
 * Spatial BVH acceleration layer powered by `three-mesh-bvh`.
 * Replaces slow triangle-soup raycasting and vertex scanning with O(log N) BVH traversal
 * for object picking, measurement vertex/edge snapping, walkthrough collision, and box selection.
 */
export class BvhAccelerationService {
  private static instance: BvhAccelerationService | null = null;
  private patched: boolean = false;
  private indexedGeometries: WeakSet<THREE.BufferGeometry> = new WeakSet();
  private indexedCount: number = 0;
  private trackedGeometries: Set<THREE.BufferGeometry> = new Set();
  private lastRaycastMs: number = 0;
  private reusableRaycaster: THREE.Raycaster = new THREE.Raycaster();
  private lifecycle: ResourceLifecycleManager;

  private constructor() {
    this.lifecycle = ResourceLifecycleManager.getInstance();
    this.reusableRaycaster.firstHitOnly = true;
    this.patchThreePrototypes();
  }

  public static getInstance(): BvhAccelerationService {
    if (!BvhAccelerationService.instance) {
      BvhAccelerationService.instance = new BvhAccelerationService();
    }
    return BvhAccelerationService.instance;
  }

  /**
   * Patches `THREE.BufferGeometry` and `THREE.Mesh.prototype.raycast` once idempotently
   * so any geometry with `.boundsTree` automatically uses accelerated raycasting.
   */
  public patchThreePrototypes() {
    if (this.patched) return;
    try {
      (THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree;
      (THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree;
      THREE.Mesh.prototype.raycast = acceleratedRaycast;
      this.patched = true;
    } catch {
      this.patched = false;
    }
  }

  /**
   * Builds a `MeshBVH` for a geometry if missing and registers cleanup with `ResourceLifecycleManager`.
   */
  public ensureGeometryBvh(
    geometry: THREE.BufferGeometry | null | undefined,
    ownerTag: string = "bvh:scene"
  ): MeshBVH | null {
    if (!geometry || !geometry.attributes?.position) return null;
    this.patchThreePrototypes();

    const geomAny = geometry as any;
    if (geomAny.boundsTree) {
      return geomAny.boundsTree as MeshBVH;
    }

    try {
      const bvh = new MeshBVH(geometry, {
        strategy: SAH,
        maxLeafSize: 10,
        indirect: false,
      });
      geomAny.boundsTree = bvh;
      if (!this.indexedGeometries.has(geometry)) {
        this.indexedGeometries.add(geometry);
        this.trackedGeometries.add(geometry);
        this.indexedCount = this.trackedGeometries.size;
      }
      this.lifecycle.track(geometry, ownerTag, undefined, () => {
        this.disposeGeometryBvh(geometry);
      });
      return bvh;
    } catch {
      return null;
    }
  }

  /**
   * Indexes all visible meshes in an Object3D subtree incrementally.
   */
  public buildBoundsForObjectTree(root: THREE.Object3D | null | undefined, ownerTag: string = "bvh:model"): number {
    if (!root || typeof root.traverse !== "function") return 0;
    let built = 0;
    root.traverse((obj: any) => {
      if (obj?.isMesh && obj.geometry && obj.name !== "BIM_GroundContactShadow") {
        if (this.ensureGeometryBvh(obj.geometry, ownerTag)) {
          built++;
        }
      }
    });
    return built;
  }

  public disposeGeometryBvh(geometry: THREE.BufferGeometry | null | undefined) {
    if (!geometry) return;
    const geomAny = geometry as any;
    if (geomAny.boundsTree) {
      try {
        if (typeof geomAny.disposeBoundsTree === "function") {
          geomAny.disposeBoundsTree();
        } else {
          geomAny.boundsTree = undefined;
        }
      } catch {
        geomAny.boundsTree = undefined;
      }
    }
    this.trackedGeometries.delete(geometry);
    this.indexedCount = this.trackedGeometries.size;
  }

  /**
   * Executes a fast `firstHitOnly` BVH raycast from camera + NDC coordinates or preconfigured ray.
   */
  public raycastMeshes(
    meshes: THREE.Object3D[],
    originOrNdc: THREE.Vector2 | { origin: THREE.Vector3; direction: THREE.Vector3 },
    camera?: THREE.Camera,
    options: { firstHitOnly?: boolean; maxDistance?: number; ownerTag?: string } = {}
  ): THREE.Intersection[] {
    if (!meshes.length) return [];

    const start = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.reusableRaycaster.firstHitOnly = options.firstHitOnly ?? true;
    this.reusableRaycaster.far = options.maxDistance ?? Infinity;

    if (originOrNdc instanceof THREE.Vector2 && camera) {
      this.reusableRaycaster.setFromCamera(originOrNdc, camera);
    } else if ("origin" in originOrNdc && "direction" in originOrNdc) {
      this.reusableRaycaster.set(originOrNdc.origin, originOrNdc.direction);
    } else {
      return [];
    }

    for (const m of meshes) {
      if ((m as any).isMesh && (m as any).geometry) {
        this.ensureGeometryBvh((m as any).geometry, options.ownerTag || "bvh:raycast");
      }
    }

    try {
      const hits = this.reusableRaycaster.intersectObjects(meshes, false);
      const end = typeof performance !== "undefined" ? performance.now() : Date.now();
      this.lastRaycastMs = Math.round((end - start) * 100) / 100;
      return hits;
    } catch {
      return [];
    }
  }

  /**
   * Uses `MeshBVH.shapecast()` & `closestPointToPoint()` to snap to the nearest
   * vertex, edge midpoint, or true architectural feature edge (rejecting coplanar
   * triangulation diagonals) within `snapRadius`. Supports both `THREE.Mesh` and
   * `THREE.InstancedMesh` transforms.
   */
  public findNearestSnapPoint(
    worldPoint: THREE.Vector3,
    snapRadius: number,
    meshes: THREE.Mesh[],
    options: BvhSnapOptions = {}
  ): BvhSnapResult | null {
    if (!meshes.length || snapRadius <= 0) return null;

    const vertexRadius = Math.min(snapRadius, Math.max(0.01, options.vertexRadius ?? Math.min(snapRadius * 0.65, 0.25)));
    const midpointRadius = vertexRadius * 0.78;
    const creaseDotThreshold = options.creaseDotThreshold ?? 0.985;

    let bestVertex: BvhSnapResult | null = null;
    let bestVertexDistSq = vertexRadius * vertexRadius;

    let bestMidpoint: BvhSnapResult | null = null;
    let bestMidpointDistSq = midpointRadius * midpointRadius;

    let bestEdge: BvhSnapResult | null = null;
    let bestEdgeDistSq = snapRadius * snapRadius;

    // Track fallback vertex within full snapRadius if no closer vertex/edge was found
    let bestFallbackVertex: BvhSnapResult | null = null;
    let bestFallbackVertexDistSq = snapRadius * snapRadius;

    const invMatrix = new THREE.Matrix4();
    const instanceMat = new THREE.Matrix4();
    const effectiveMatrix = new THREE.Matrix4();
    const localPoint = new THREE.Vector3();
    const hitInfo: HitPointInfo = { point: new THREE.Vector3(), distance: Infinity, faceIndex: -1 };
    const worldA = new THREE.Vector3();
    const worldB = new THREE.Vector3();
    const worldClosest = new THREE.Vector3();
    const worldMid = new THREE.Vector3();
    const segLine = new THREE.Line3();
    const localClosest = new THREE.Vector3();
    const localSphere = new THREE.Sphere();
    const tmpBox = new THREE.Box3();
    const triNormal = new THREE.Vector3();

    const quantizeKey = (v: THREE.Vector3) =>
      `${Math.round(v.x * 1e4)},${Math.round(v.y * 1e4)},${Math.round(v.z * 1e4)}`;

    const evalTransform = (mesh: THREE.Mesh, bvh: MeshBVH, worldMat: THREE.Matrix4) => {
      invMatrix.copy(worldMat).invert();
      localPoint.copy(worldPoint).applyMatrix4(invMatrix);

      const scale = worldMat.getMaxScaleOnAxis() || 1;
      const localRadius = snapRadius / Math.max(0.0001, scale);
      localSphere.set(localPoint, localRadius);

      // Coarse surface check first
      const closest = bvh.closestPointToPoint(localPoint, hitInfo, 0, localRadius);
      if (!closest) return;

      interface EdgeRec {
        a: THREE.Vector3;
        b: THREE.Vector3;
        normals: THREE.Vector3[];
      }
      const edgeMap = new Map<string, EdgeRec>();
      const allVertices = new Map<string, THREE.Vector3>();

      // Shapecast triangles inside the snap radius sphere to build local edge adjacency
      bvh.shapecast({
        intersectsBounds: (box) => {
          return box.intersectsSphere(localSphere) ? INTERSECTED : NOT_INTERSECTED;
        },
        intersectsTriangle: (tri) => {
          tri.getNormal(triNormal);
          if (triNormal.lengthSq() < 1e-12) return false;
          const nClone = triNormal.clone();

          const verts = [tri.a, tri.b, tri.c];
          const keys = verts.map((v) => {
            const k = quantizeKey(v);
            if (!allVertices.has(k)) allVertices.set(k, v.clone());
            return k;
          });

          const pairs: Array<[number, number]> = [
            [0, 1],
            [1, 2],
            [2, 0],
          ];
          for (const [i0, i1] of pairs) {
            const k0 = keys[i0];
            const k1 = keys[i1];
            if (k0 === k1) continue;
            const eKey = k0 < k1 ? `${k0}|${k1}` : `${k1}|${k0}`;
            const existing = edgeMap.get(eKey);
            if (existing) {
              existing.normals.push(nClone);
            } else {
              edgeMap.set(eKey, {
                a: verts[i0].clone(),
                b: verts[i1].clone(),
                normals: [nClone],
              });
            }
          }
          return false;
        },
      });

      const featureVertices = new Map<string, THREE.Vector3>();

      for (const edge of edgeMap.values()) {
        // Determine whether this edge is a true architectural feature edge:
        // boundary (1 adjacent triangle) OR sharp crease (dihedral angle above threshold).
        let isFeatureEdge = edge.normals.length === 1;
        if (!isFeatureEdge && edge.normals.length >= 2) {
          const refN = edge.normals[0];
          for (let i = 1; i < edge.normals.length; i++) {
            if (refN.dot(edge.normals[i]) <= creaseDotThreshold) {
              isFeatureEdge = true;
              break;
            }
          }
        }
        if (!isFeatureEdge) continue;

        featureVertices.set(quantizeKey(edge.a), edge.a);
        featureVertices.set(quantizeKey(edge.b), edge.b);

        // Closest point anywhere along the edge segment
        segLine.set(edge.a, edge.b);
        segLine.closestPointToPoint(localPoint, true, localClosest);

        worldA.copy(edge.a).applyMatrix4(worldMat);
        worldB.copy(edge.b).applyMatrix4(worldMat);
        worldClosest.copy(localClosest).applyMatrix4(worldMat);

        const edgeDistSq = worldClosest.distanceToSquared(worldPoint);
        if (edgeDistSq < bestEdgeDistSq) {
          bestEdgeDistSq = edgeDistSq;
          bestEdge = {
            point: worldClosest.clone(),
            snapType: "edge",
            distance: Math.sqrt(edgeDistSq),
            mesh,
            edgeStart: worldA.clone(),
            edgeEnd: worldB.clone(),
          };
        }

        // Edge midpoint (only for edges meaningfully longer than the vertex capture zone)
        const edgeLen = worldA.distanceTo(worldB);
        if (edgeLen > vertexRadius * 1.5) {
          worldMid.copy(worldA).add(worldB).multiplyScalar(0.5);
          const midDistSq = worldMid.distanceToSquared(worldPoint);
          if (midDistSq < bestMidpointDistSq) {
            bestMidpointDistSq = midDistSq;
            bestMidpoint = {
              point: worldMid.clone(),
              snapType: "midpoint",
              distance: Math.sqrt(midDistSq),
              mesh,
              edgeStart: worldA.clone(),
              edgeEnd: worldB.clone(),
            };
          }
        }
      }

      // Evaluate corner vertices (preferring feature-edge endpoints, falling back to all local vertices)
      const vertexPool = featureVertices.size > 0 ? featureVertices.values() : allVertices.values();
      for (const v of vertexPool) {
        worldClosest.copy(v).applyMatrix4(worldMat);
        const dSq = worldClosest.distanceToSquared(worldPoint);
        if (dSq < bestVertexDistSq) {
          bestVertexDistSq = dSq;
          bestVertex = {
            point: worldClosest.clone(),
            snapType: "vertex",
            distance: Math.sqrt(dSq),
            mesh,
          };
        }
        if (dSq < bestFallbackVertexDistSq) {
          bestFallbackVertexDistSq = dSq;
          bestFallbackVertex = {
            point: worldClosest.clone(),
            snapType: "vertex",
            distance: Math.sqrt(dSq),
            mesh,
          };
        }
      }
    };

    for (const mesh of meshes) {
      if (!mesh.visible || !mesh.geometry) continue;
      const bvh = this.ensureGeometryBvh(mesh.geometry, "bvh:snap");
      if (!bvh) continue;

      mesh.updateMatrixWorld();

      if ((mesh as THREE.InstancedMesh).isInstancedMesh) {
        const instMesh = mesh as THREE.InstancedMesh;
        const hintedId = options.instanceHints?.get(instMesh);
        if (typeof hintedId === "number" && hintedId >= 0 && hintedId < instMesh.count) {
          instMesh.getMatrixAt(hintedId, instanceMat);
          effectiveMatrix.multiplyMatrices(instMesh.matrixWorld, instanceMat);
          evalTransform(instMesh, bvh, effectiveMatrix);
          continue;
        }

        // No specific instance hint: coarsely filter instances via local boundingBox
        if (!instMesh.geometry.boundingBox) instMesh.geometry.computeBoundingBox();
        const baseBox = instMesh.geometry.boundingBox;
        const maxChecks = Math.min(instMesh.count, 512);
        for (let i = 0; i < maxChecks; i++) {
          instMesh.getMatrixAt(i, instanceMat);
          effectiveMatrix.multiplyMatrices(instMesh.matrixWorld, instanceMat);
          if (baseBox) {
            tmpBox.copy(baseBox).applyMatrix4(effectiveMatrix).expandByScalar(snapRadius);
            if (!tmpBox.containsPoint(worldPoint)) continue;
          }
          evalTransform(instMesh, bvh, effectiveMatrix);
        }
      } else {
        evalTransform(mesh, bvh, mesh.matrixWorld);
      }
    }

    // Priority: exact corner vertex > edge midpoint > anywhere along feature edge > fallback vertex
    return bestVertex ?? bestMidpoint ?? bestEdge ?? bestFallbackVertex;
  }

  /**
   * Uses `MeshBVH.intersectsBox` to test whether a mesh intersects a world-space selection or section box.
   */
  public intersectsWorldBox(mesh: THREE.Mesh, worldBox: THREE.Box3): boolean {
    if (!mesh.geometry) return false;
    const bvh = this.ensureGeometryBvh(mesh.geometry, "bvh:query");
    if (!bvh) return false;

    const invMat = new THREE.Matrix4().copy(mesh.matrixWorld).invert();
    const localBox = worldBox.clone().applyMatrix4(invMat);
    const identity = new THREE.Matrix4();
    return bvh.intersectsBox(localBox, identity);
  }

  public getStats(): BvhStats {
    let bytes = 0;
    for (const geom of this.trackedGeometries) {
      const tree = (geom as any).boundsTree;
      if (tree) {
        try {
          bytes += estimateMemoryInBytes(tree);
        } catch {}
      }
    }
    return {
      patched: this.patched,
      indexedMeshes: this.indexedCount,
      estimatedMemoryKb: Math.round((bytes / 1024) * 10) / 10,
      lastRaycastMs: this.lastRaycastMs,
    };
  }
}
