/**
 * EquipmentEnvelopeSimulator — 4D Tower Crane & Swing-Radius Safety Envelope
 *
 * Places a procedural Three.js Tower Crane (mast, cabin, main jib, counter-jib,
 * hook cable, and translucent swing-radius safety zone) anchored outside the
 * loaded building footprint, slews smoothly with 4D simulation progress, and
 * validates hook/jib clearance height against rising construction levels.
 */

import * as THREE from "three";
import { GpuPerformanceMonitor } from "../core/GpuPerformanceMonitor";

export interface CraneEnvelopeStatus {
  active: boolean;
  jibRadiusMeters: number;
  hookHeightMeters: number;
  slewAngleDeg: number;
  clearanceOk: boolean;
  clearanceMeters: number;
}

export class EquipmentEnvelopeSimulator {
  private static instance: EquipmentEnvelopeSimulator | null = null;
  private craneGroup: THREE.Group | null = null;
  private jibPivot: THREE.Group | null = null;
  private envelopeMesh: THREE.Mesh | null = null;
  private active = false;
  private jibRadius = 32;
  private hookHeight = 36;
  private slewAngleRad = 0;

  public static getInstance(): EquipmentEnvelopeSimulator {
    if (!this.instance) this.instance = new EquipmentEnvelopeSimulator();
    return this.instance;
  }

  public isActive(): boolean {
    return this.active;
  }

  public toggle(scene: THREE.Scene, modelBounds?: THREE.Box3 | null): CraneEnvelopeStatus {
    if (this.active) {
      this.dispose(scene);
      return this.getStatus(0);
    }
    this.mount(scene, modelBounds);
    return this.getStatus(modelBounds ? modelBounds.max.y : 0);
  }

  public mount(scene: THREE.Scene, modelBounds?: THREE.Box3 | null): void {
    this.dispose(scene);

    const center = new THREE.Vector3(0, 0, 0);
    const size = new THREE.Vector3(30, 22, 30);
    let baseY = 0;
    let topY = 22;

    if (modelBounds && !modelBounds.isEmpty()) {
      modelBounds.getCenter(center);
      modelBounds.getSize(size);
      baseY = modelBounds.min.y;
      topY = modelBounds.max.y;
    }

    const buildingHeight = Math.max(12, topY - baseY);
    const mastHeight = buildingHeight + 12;
    this.hookHeight = baseY + mastHeight;
    this.jibRadius = Math.max(22, Math.min(65, Math.max(size.x, size.z) * 0.72));

    // Anchor crane slightly outside the north-east building corner
    const craneX = center.x + size.x * 0.56 + 4;
    const craneZ = center.z - size.z * 0.25;

    const root = new THREE.Group();
    root.name = "bim-kintsugi-4d-crane-envelope";
    root.position.set(craneX, baseY, craneZ);

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.45,
      metalness: 0.35,
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.6,
    });

    // Base plinth + vertical lattice mast
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 3.6), darkSteelMat);
    plinth.position.y = 0.6;
    root.add(plinth);

    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.8, mastHeight, 1.8), yellowMat);
    mast.position.y = mastHeight / 2;
    root.add(mast);

    // Slewing jib pivot at mast top
    const pivot = new THREE.Group();
    pivot.position.y = mastHeight;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.2), darkSteelMat);
    cabin.position.set(0.8, 0.2, 1.4);
    pivot.add(cabin);

    const mainJib = new THREE.Mesh(new THREE.BoxGeometry(this.jibRadius, 1.3, 1.2), yellowMat);
    mainJib.position.set(-this.jibRadius / 2, 1.2, 0);
    pivot.add(mainJib);

    const counterJib = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 1.4), darkSteelMat);
    counterJib.position.set(5, 1.2, 0);
    pivot.add(counterJib);

    const hookLine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, Math.max(6, mastHeight * 0.45), 8),
      darkSteelMat
    );
    hookLine.position.set(-this.jibRadius * 0.65, -Math.max(3, mastHeight * 0.22), 0);
    pivot.add(hookLine);

    root.add(pivot);

    // Translucent cylindrical swing-radius safety envelope
    const envGeo = new THREE.CylinderGeometry(
      this.jibRadius,
      this.jibRadius,
      mastHeight + 2,
      40,
      1,
      true
    );
    const envMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    envMesh.position.y = (mastHeight + 2) / 2;
    root.add(envMesh);

    scene.add(root);
    this.craneGroup = root;
    this.jibPivot = pivot;
    this.envelopeMesh = envMesh;
    this.active = true;
  }

  public updateForTimelineRatio(progressRatio: number, activeStructureTopY = 0): CraneEnvelopeStatus {
    this.slewAngleRad = progressRatio * Math.PI * 4;
    if (this.jibPivot) {
      this.jibPivot.rotation.y = this.slewAngleRad;
    }
    const status = this.getStatus(activeStructureTopY);
    if (this.envelopeMesh) {
      const mat = this.envelopeMesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(status.clearanceOk ? 0x10b981 : 0xf43f5e);
    }
    return status;
  }

  public getStatus(activeStructureTopY = 0): CraneEnvelopeStatus {
    const clearanceMeters = Math.round((this.hookHeight - activeStructureTopY) * 10) / 10;
    return {
      active: this.active,
      jibRadiusMeters: Math.round(this.jibRadius * 10) / 10,
      hookHeightMeters: Math.round(this.hookHeight * 10) / 10,
      slewAngleDeg: Math.round(((this.slewAngleRad * 180) / Math.PI) % 360),
      clearanceOk: clearanceMeters >= 3,
      clearanceMeters,
    };
  }

  public dispose(scene?: THREE.Scene): void {
    if (this.craneGroup) {
      if (scene) scene.remove(this.craneGroup);
      else this.craneGroup.parent?.remove(this.craneGroup);
      GpuPerformanceMonitor.disposeObject3D(this.craneGroup);
      this.craneGroup = null;
      this.jibPivot = null;
      this.envelopeMesh = null;
    }
    this.active = false;
  }
}
