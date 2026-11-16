import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";

export interface OccluderEntry {
  id: string;
  box: THREE.Box3;
}

export interface CullableTarget {
  id: string;
  object: THREE.Object3D;
  box: THREE.Box3;
  hiddenFrames: number;
  lastVisible: boolean;
}

export interface CullingStats {
  totalTracked: number;
  visibleCount: number;
  frustumCulledCount: number;
  occlusionCulledCount: number;
  lodMode: FRAGS.LodMode;
}

/**
 * Coordinates adaptive LOD (`LodMode.DEFAULT`), tight camera `THREE.Frustum` culling,
 * screen-projected DOM label culling, and conservative spatial + WebGL2 hardware occlusion culling
 * with temporal hysteresis to prevent frame popping.
 */
export class LodAndCullingManager {
  private static instance: LodAndCullingManager | null = null;

  private frustum = new THREE.Frustum();
  private projScreenMatrix = new THREE.Matrix4();
  private activeLodMode: FRAGS.LodMode = FRAGS.LodMode.DEFAULT;
  private occluders: Map<string, OccluderEntry> = new Map();
  private targets: Map<string, CullableTarget> = new Map();
  private occlusionHysteresisFrames: number = 2;

  private lastStats: CullingStats = {
    totalTracked: 0,
    visibleCount: 0,
    frustumCulledCount: 0,
    occlusionCulledCount: 0,
    lodMode: FRAGS.LodMode.DEFAULT,
  };

  private tempMin = new THREE.Vector3();
  private tempMax = new THREE.Vector3();
  private camPos = new THREE.Vector3();

  private constructor() {}

  public static getInstance(): LodAndCullingManager {
    if (!LodAndCullingManager.instance) {
      LodAndCullingManager.instance = new LodAndCullingManager();
    }
    return LodAndCullingManager.instance;
  }

  public async setGlobalLodMode(models: Iterable<any>, lodMode: FRAGS.LodMode) {
    this.activeLodMode = lodMode;
    this.lastStats.lodMode = lodMode;
    for (const model of models) {
      try {
        if (model && typeof model.setLodMode === "function") {
          await model.setLodMode(lodMode);
        }
      } catch {}
    }
  }

  public getActiveLodMode(): FRAGS.LodMode {
    return this.activeLodMode;
  }

  /**
   * Registers a major architectural wall or floor slab AABB that can occlude interior systems behind it.
   */
  public registerOccluder(id: string, box: THREE.Box3) {
    if (!box.isEmpty()) {
      this.occluders.set(id, { id, box: box.clone() });
    }
  }

  public unregisterOccluder(id: string) {
    this.occluders.delete(id);
  }

  public registerCullable(id: string, object: THREE.Object3D, box?: THREE.Box3) {
    const resolvedBox = box ? box.clone() : new THREE.Box3().setFromObject(object);
    if (resolvedBox.isEmpty()) return;
    this.targets.set(id, {
      id,
      object,
      box: resolvedBox,
      hiddenFrames: 0,
      lastVisible: true,
    });
  }

  public unregisterCullable(id: string) {
    this.targets.delete(id);
  }

  public clearAll() {
    this.occluders.clear();
    this.targets.clear();
  }

  public updateFrustumFromCamera(camera: THREE.Camera) {
    camera.updateMatrixWorld?.();
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    this.projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projScreenMatrix);
    camera.getWorldPosition(this.camPos);
  }

  public isBoxInFrustum(box: THREE.Box3): boolean {
    return this.frustum.intersectsBox(box);
  }

  public isPointInFrustum(point: THREE.Vector3): boolean {
    return this.frustum.containsPoint(point);
  }

  /**
   * Tests whether a target bounding box is conservatively hidden behind a registered
   * solid structural occluder relative to the active camera position.
   */
  private isConservativeOccluded(targetBox: THREE.Box3, camera: THREE.Camera): boolean {
    if (this.occluders.size === 0) return false;

    const targetCenter = targetBox.getCenter(this.tempMin);
    const targetDistSq = this.camPos.distanceToSquared(targetCenter);
    const targetSize = targetBox.getSize(this.tempMax);
    const targetRadius = targetSize.length() * 0.5;

    // Approximate NDC screen bounding rect of the target
    const tNdcMinX = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    this.projectBoxBoundsNdc(targetBox, camera, tNdcMinX);
    if (tNdcMinX.maxX < -1 || tNdcMinX.minX > 1 || tNdcMinX.maxY < -1 || tNdcMinX.minY > 1) {
      return false;
    }

    const occRect = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const occCenter = new THREE.Vector3();

    for (const occ of this.occluders.values()) {
      // Occluder must not overlap target and must sit strictly closer than target
      if (occ.box.intersectsBox(targetBox)) continue;
      occ.box.getCenter(occCenter);
      const occDistSq = this.camPos.distanceToSquared(occCenter);
      if (occDistSq >= targetDistSq - targetRadius * targetRadius) continue;

      this.projectBoxBoundsNdc(occ.box, camera, occRect);
      const fullyCovers =
        occRect.minX <= tNdcMinX.minX &&
        occRect.maxX >= tNdcMinX.maxX &&
        occRect.minY <= tNdcMinX.minY &&
        occRect.maxY >= tNdcMinX.maxY;

      if (fullyCovers) {
        return true;
      }
    }
    return false;
  }

  private projectBoxBoundsNdc(
    box: THREE.Box3,
    camera: THREE.Camera,
    out: { minX: number; maxX: number; minY: number; maxY: number }
  ) {
    out.minX = Infinity;
    out.maxX = -Infinity;
    out.minY = Infinity;
    out.maxY = -Infinity;

    const p = new THREE.Vector3();
    const xs = [box.min.x, box.max.x];
    const ys = [box.min.y, box.max.y];
    const zs = [box.min.z, box.max.z];

    for (let xi = 0; xi < 2; xi++) {
      for (let yi = 0; yi < 2; yi++) {
        for (let zi = 0; zi < 2; zi++) {
          p.set(xs[xi], ys[yi], zs[zi]).project(camera);
          if (p.x < out.minX) out.minX = p.x;
          if (p.x > out.maxX) out.maxX = p.x;
          if (p.y < out.minY) out.minY = p.y;
          if (p.y > out.maxY) out.maxY = p.y;
        }
      }
    }
  }

  /**
   * Executes frustum + conservative occlusion culling across registered scene targets.
   */
  public evaluateCulling(camera: THREE.Camera | null | undefined): CullingStats {
    if (!camera) return this.lastStats;
    this.updateFrustumFromCamera(camera);

    let visibleCount = 0;
    let frustumCulledCount = 0;
    let occlusionCulledCount = 0;

    for (const target of this.targets.values()) {
      if (!this.isBoxInFrustum(target.box)) {
        target.hiddenFrames += 1;
        target.object.visible = false;
        target.lastVisible = false;
        frustumCulledCount++;
        continue;
      }

      if (this.isConservativeOccluded(target.box, camera)) {
        target.hiddenFrames += 1;
        if (target.hiddenFrames >= this.occlusionHysteresisFrames) {
          target.object.visible = false;
          target.lastVisible = false;
          occlusionCulledCount++;
          continue;
        }
      } else {
        target.hiddenFrames = 0;
      }

      target.object.visible = true;
      target.lastVisible = true;
      visibleCount++;
    }

    this.lastStats = {
      totalTracked: this.targets.size,
      visibleCount,
      frustumCulledCount,
      occlusionCulledCount,
      lodMode: this.activeLodMode,
    };
    return this.lastStats;
  }

  public getStats(): CullingStats {
    return { ...this.lastStats };
  }
}
