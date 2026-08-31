import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { SoundManager } from "../core/SoundManager";

export interface StoreyLevel {
  id: string;
  name: string;
  elevation: number;
  height: number;
}

export class StoreyLevelSlicer {
  private static instance: StoreyLevelSlicer | null = null;
  private engine: BimEngine;
  private activeLevelIndex: number = 0;
  private isSlicingActive: boolean = false;
  private clipPlane: THREE.Plane | null = null;

  public levels: StoreyLevel[] = [
    { id: "L0", name: "Ground Floor (L0)", elevation: 0.0, height: 3.5 },
    { id: "L1", name: "First Floor (L1)", elevation: 3.5, height: 3.5 },
    { id: "L2", name: "Second Floor (L2)", elevation: 7.0, height: 3.5 },
    { id: "Roof", name: "Roof Level", elevation: 10.5, height: 3.0 },
  ];

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 3.5);
  }

  public static getInstance(): StoreyLevelSlicer {
    if (!StoreyLevelSlicer.instance) {
      StoreyLevelSlicer.instance = new StoreyLevelSlicer();
    }
    return StoreyLevelSlicer.instance;
  }

  public toggleSlicing(enable?: boolean): boolean {
    this.isSlicingActive = enable !== undefined ? enable : !this.isSlicingActive;
    SoundManager.getInstance().playClick();
    this.applyStoreySlice();
    return this.isSlicingActive;
  }

  public setStorey(index: number) {
    if (index >= 0 && index < this.levels.length) {
      this.activeLevelIndex = index;
      SoundManager.getInstance().playSnap();
      this.applyStoreySlice();
      this.teleportCameraToStorey();
    }
  }

  public getActiveLevel(): StoreyLevel {
    return this.levels[this.activeLevelIndex] || this.levels[0];
  }

  private applyStoreySlice() {
    const renderer = this.engine.world?.renderer?.three;
    if (!renderer) return;

    if (!this.isSlicingActive) {
      renderer.clippingPlanes = [];
      return;
    }

    const activeLevel = this.getActiveLevel();
    const sliceHeight = activeLevel.elevation + activeLevel.height - 0.2;

    if (!this.clipPlane) {
      this.clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), sliceHeight);
    } else {
      this.clipPlane.constant = sliceHeight;
    }

    renderer.clippingPlanes = [this.clipPlane];
    renderer.localClippingEnabled = true;
  }

  private teleportCameraToStorey() {
    try {
      const camera = this.engine.world?.camera;
      if (!camera || !camera.controls) return;

      const activeLevel = this.getActiveLevel();
      const eyeElevation = activeLevel.elevation + 1.75;

      camera.controls.setLookAt(
        camera.three.position.x,
        eyeElevation + 4,
        camera.three.position.z,
        camera.three.position.x,
        eyeElevation,
        camera.three.position.z - 3,
        true
      );
    } catch (e) {}
  }
}
