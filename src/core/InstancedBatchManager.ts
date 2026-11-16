import * as THREE from "three";
import { ResourceLifecycleManager } from "./ResourceLifecycleManager";

export interface InstancePlacement {
  id: string;
  matrix: THREE.Matrix4;
  color?: THREE.ColorRepresentation;
}

export interface InstancedBatchStats {
  batchCount: number;
  totalInstances: number;
  drawCallsUsed: number;
  estimatedDrawCallsSaved: number;
}

interface BatchRecord {
  key: string;
  mesh: THREE.InstancedMesh;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  idToIndex: Map<string, number>;
  hiddenScaleMatrix: THREE.Matrix4;
  capacity: number;
  count: number;
}

/**
 * Consolidates thousands of repetitive BIM accessories (bolts/fasteners, fixtures,
 * chairs, 3D annotation markers, clash spheres) into shared GPU `THREE.InstancedMesh`
 * batches so entire categories render in a single draw call.
 */
export class InstancedBatchManager {
  private static instance: InstancedBatchManager | null = null;
  private batches: Map<string, BatchRecord> = new Map();
  private rootGroup: THREE.Group;
  private lifecycle: ResourceLifecycleManager;
  private zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);

  private constructor() {
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = "InstancedBatchRoot";
    this.lifecycle = ResourceLifecycleManager.getInstance();
  }

  public static getInstance(): InstancedBatchManager {
    if (!InstancedBatchManager.instance) {
      InstancedBatchManager.instance = new InstancedBatchManager();
    }
    return InstancedBatchManager.instance;
  }

  public attachToScene(scene: THREE.Object3D | null | undefined) {
    if (scene && !scene.children.includes(this.rootGroup)) {
      scene.add(this.rootGroup);
    }
  }

  /**
   * Creates or replaces an instanced draw batch for repetitive objects sharing `geometry` & `material`.
   */
  public syncBatch(
    key: string,
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    placements: InstancePlacement[]
  ): THREE.InstancedMesh {
    this.removeBatch(key);

    const capacity = Math.max(1, placements.length);
    const mesh = new THREE.InstancedMesh(geometry, material, capacity);
    mesh.name = `InstancedBatch_${key}`;
    mesh.count = placements.length;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = true;

    const idToIndex = new Map<string, number>();
    let hasColors = false;
    const tempColor = new THREE.Color();

    for (let i = 0; i < placements.length; i++) {
      const p = placements[i];
      idToIndex.set(p.id, i);
      mesh.setMatrixAt(i, p.matrix);
      if (p.color !== undefined) {
        hasColors = true;
        mesh.setColorAt(i, tempColor.set(p.color));
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (hasColors && mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();

    this.rootGroup.add(mesh);

    const ownerTag = `instanced:${key}`;
    this.lifecycle.track(geometry, ownerTag);
    this.lifecycle.track(material, ownerTag);

    this.batches.set(key, {
      key,
      mesh,
      geometry,
      material,
      idToIndex,
      hiddenScaleMatrix: this.zeroMatrix,
      capacity,
      count: placements.length,
    });

    return mesh;
  }

  public setInstanceTransform(batchKey: string, instanceId: string, matrix: THREE.Matrix4): boolean {
    const rec = this.batches.get(batchKey);
    if (!rec) return false;
    const idx = rec.idToIndex.get(instanceId);
    if (idx === undefined) return false;
    rec.mesh.setMatrixAt(idx, matrix);
    rec.mesh.instanceMatrix.needsUpdate = true;
    return true;
  }

  /**
   * Hides an individual instance without tearing down the GPU batch by scaling its matrix to zero.
   */
  public setInstanceVisible(
    batchKey: string,
    instanceId: string,
    visible: boolean,
    restoreMatrix?: THREE.Matrix4
  ): boolean {
    const rec = this.batches.get(batchKey);
    if (!rec) return false;
    const idx = rec.idToIndex.get(instanceId);
    if (idx === undefined) return false;

    if (!visible) {
      rec.mesh.setMatrixAt(idx, rec.hiddenScaleMatrix);
    } else if (restoreMatrix) {
      rec.mesh.setMatrixAt(idx, restoreMatrix);
    }
    rec.mesh.instanceMatrix.needsUpdate = true;
    return true;
  }

  public removeBatch(key: string) {
    const existing = this.batches.get(key);
    if (!existing) return;
    existing.mesh.removeFromParent();
    existing.mesh.dispose();
    this.lifecycle.releaseByTag(`instanced:${key}`);
    this.batches.delete(key);
  }

  public clearAll() {
    for (const key of Array.from(this.batches.keys())) {
      this.removeBatch(key);
    }
  }

  public getStats(): InstancedBatchStats {
    let totalInstances = 0;
    for (const batch of this.batches.values()) {
      totalInstances += batch.count;
    }
    const drawCallsUsed = this.batches.size;
    return {
      batchCount: this.batches.size,
      totalInstances,
      drawCallsUsed,
      estimatedDrawCallsSaved: Math.max(0, totalInstances - drawCallsUsed),
    };
  }
}
