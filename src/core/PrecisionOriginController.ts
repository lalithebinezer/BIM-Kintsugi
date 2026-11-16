import * as THREE from "three";

export interface Float64Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface AnchoredObjectRecord {
  id: string;
  object: THREE.Object3D;
  worldPosition64: Float64Vector3;
}

export interface PrecisionTelemetry {
  activeOrigin64: Float64Vector3;
  recenterCount: number;
  anchoredCount: number;
  maxWorldMagnitudeMeters: number;
  estimatedFloat32ErrorMm: number;
  cameraNear: number | null;
  cameraFar: number | null;
}

export type OriginShiftListener = (deltaRender: THREE.Vector3, newOrigin64: Float64Vector3) => void;

/**
 * Dual-Origin Float64 <-> Float32 Virtual Scene Origin Controller.
 * Prevents WebGL vertex jittering, z-fighting, and depth-buffer collapse when viewing
 * large architectural/civil coordinates or zooming in to sub-millimeter detail.
 */
export class PrecisionOriginController {
  private static instance: PrecisionOriginController | null = null;

  private activeOrigin64: Float64Vector3 = { x: 0, y: 0, z: 0 };
  private recenterThresholdMeters: number = 2000;
  private recenterCount: number = 0;
  private anchoredObjects: Map<string, AnchoredObjectRecord> = new Map();
  private originListeners: Set<OriginShiftListener> = new Set();

  private constructor() {}

  public static getInstance(): PrecisionOriginController {
    if (!PrecisionOriginController.instance) {
      PrecisionOriginController.instance = new PrecisionOriginController();
    }
    return PrecisionOriginController.instance;
  }

  public setRecenterThreshold(meters: number) {
    if (meters >= 100 && Number.isFinite(meters)) {
      this.recenterThresholdMeters = meters;
    }
  }

  public getActiveOrigin64(): Float64Vector3 {
    return { ...this.activeOrigin64 };
  }

  /**
   * Initializes the authoritative Float64 world origin from a model's CRS / MapConversion / site offset.
   */
  public setWorldOrigin(x: number, y: number, z: number) {
    this.activeOrigin64 = {
      x: Number.isFinite(x) ? x : 0,
      y: Number.isFinite(y) ? y : 0,
      z: Number.isFinite(z) ? z : 0,
    };
    this.syncAllAnchoredTransforms();
  }

  /**
   * Converts an authoritative Float64 coordinate into Float32 GPU render-space relative to activeOrigin64.
   */
  public world64ToRender32(world64: Float64Vector3, out: THREE.Vector3 = new THREE.Vector3()): THREE.Vector3 {
    out.set(
      world64.x - this.activeOrigin64.x,
      world64.y - this.activeOrigin64.y,
      world64.z - this.activeOrigin64.z
    );
    return out;
  }

  /**
   * Converts a Float32 render-space coordinate back to exact Float64 global coordinates.
   */
  public render32ToWorld64(render32: { x: number; y: number; z: number }): Float64Vector3 {
    return {
      x: this.activeOrigin64.x + render32.x,
      y: this.activeOrigin64.y + render32.y,
      z: this.activeOrigin64.z + render32.z,
    };
  }

  /**
   * Registers a Three.js Object3D whose render position is synchronized from a Float64 world anchor.
   */
  public registerAnchoredObject(id: string, object: THREE.Object3D, worldPosition64?: Float64Vector3) {
    const pos64: Float64Vector3 = worldPosition64
      ? { ...worldPosition64 }
      : this.render32ToWorld64(object.position);

    this.anchoredObjects.set(id, {
      id,
      object,
      worldPosition64: pos64,
    });
    this.applyRenderTransform(object, pos64);
  }

  public updateAnchoredWorldPosition(id: string, worldPosition64: Float64Vector3) {
    const rec = this.anchoredObjects.get(id);
    if (!rec) return;
    rec.worldPosition64 = { ...worldPosition64 };
    this.applyRenderTransform(rec.object, rec.worldPosition64);
  }

  public unregisterAnchoredObject(id: string) {
    this.anchoredObjects.delete(id);
  }

  public onOriginShift(listener: OriginShiftListener): () => void {
    this.originListeners.add(listener);
    return () => {
      this.originListeners.delete(listener);
    };
  }

  /**
   * Checks if camera moved far from render origin (0,0,0); if so, shifts the Floating Origin
   * around the camera and offsets controls/models synchronously so Float32 coordinates stay small.
   */
  public recenterIfNeeded(
    camera: THREE.Camera | null | undefined,
    controls?: any
  ): boolean {
    if (!camera) return false;
    const distFromOrigin = camera.position.length();
    if (!Number.isFinite(distFromOrigin) || distFromOrigin <= this.recenterThresholdMeters) {
      return false;
    }

    const delta = camera.position.clone();
    this.activeOrigin64.x += delta.x;
    this.activeOrigin64.y += delta.y;
    this.activeOrigin64.z += delta.z;
    this.recenterCount += 1;

    // Move camera back to (0, 0, 0) in render space
    camera.position.set(0, 0, 0);

    // Keep orbit/first-person controls target aligned by subtracting delta
    if (controls && typeof controls.getTarget === "function" && typeof controls.setLookAt === "function") {
      try {
        const target = new THREE.Vector3();
        controls.getTarget(target);
        target.sub(delta);
        controls.setLookAt(0, 0, 0, target.x, target.y, target.z, false);
      } catch {}
    }

    this.syncAllAnchoredTransforms();

    for (const listener of this.originListeners) {
      try {
        listener(delta, this.getActiveOrigin64());
      } catch {}
    }

    return true;
  }

  private applyRenderTransform(obj: THREE.Object3D, worldPos64: Float64Vector3) {
    if (!obj?.position) return;
    this.world64ToRender32(worldPos64, obj.position);
    obj.updateMatrixWorld?.(true);
  }

  private syncAllAnchoredTransforms() {
    for (const rec of this.anchoredObjects.values()) {
      this.applyRenderTransform(rec.object, rec.worldPosition64);
    }
  }

  /**
   * Dynamically adjusts camera near/far clip planes based on camera target distance and scene radius
   * to maximize 24-bit depth-buffer precision during macro site views and micro close-ups.
   */
  public updateDepthPrecision(
    camera: THREE.Camera | null | undefined,
    distanceToTargetMeters: number,
    sceneRadiusMeters: number = 500
  ) {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    const clampedDist = Math.max(0.05, Number.isFinite(distanceToTargetMeters) ? distanceToTargetMeters : 10);
    const desiredNear = Math.max(0.02, Math.min(2.0, clampedDist * 0.008));
    const desiredFar = Math.max(desiredNear + 500, Math.min(250_000, sceneRadiusMeters * 4 + clampedDist * 3));

    if (
      Math.abs(camera.near - desiredNear) / Math.max(0.01, camera.near) > 0.25 ||
      Math.abs(camera.far - desiredFar) / Math.max(1, camera.far) > 0.25
    ) {
      camera.near = desiredNear;
      camera.far = desiredFar;
      camera.updateProjectionMatrix();
    }
  }

  /**
   * Computes theoretical worst-case IEEE-754 Float32 quantization step (in millimeters)
   * at the active render-space origin vs raw unshifted Float64 magnitude.
   */
  public estimateFloat32ErrorMm(coordMagnitudeMeters: number): number {
    const absMag = Math.abs(coordMagnitudeMeters);
    if (absMag <= 1) return 0.00012;
    const ulpMeters = Math.pow(2, Math.floor(Math.log2(absMag)) - 23);
    return Math.round(ulpMeters * 1000 * 10000) / 10000;
  }

  public getTelemetry(camera?: THREE.Camera | null): PrecisionTelemetry {
    const originMag = Math.hypot(this.activeOrigin64.x, this.activeOrigin64.y, this.activeOrigin64.z);
    const renderMag = camera ? camera.position.length() : 0;
    const persp = camera instanceof THREE.PerspectiveCamera ? camera : null;

    return {
      activeOrigin64: this.getActiveOrigin64(),
      recenterCount: this.recenterCount,
      anchoredCount: this.anchoredObjects.size,
      maxWorldMagnitudeMeters: Math.round(originMag * 100) / 100,
      estimatedFloat32ErrorMm: this.estimateFloat32ErrorMm(Math.max(1, renderMag)),
      cameraNear: persp ? persp.near : null,
      cameraFar: persp ? persp.far : null,
    };
  }
}
