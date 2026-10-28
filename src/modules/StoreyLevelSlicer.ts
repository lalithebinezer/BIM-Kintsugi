import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { BimEngine } from "../core/BimEngine";
import { SoundManager } from "../core/SoundManager";

export interface StoreyLevel {
  id: string;
  name: string;
  elevation: number;
  height: number;
  viewId?: string;
}

export class StoreyLevelSlicer {
  private static instance: StoreyLevelSlicer | null = null;
  private engine: BimEngine;
  private activeLevelIndex: number = 0;
  private isSlicingActive: boolean = false;
  private clipPlane: THREE.Plane | null = null;
  public views?: OBC.Views;
  public clipStyler?: OBF.ClipStyler;
  private activeClipEdges?: OBF.ClipEdges;

  public levels: StoreyLevel[] = [
    { id: "L0", name: "Ground Floor (L0)", elevation: 0.0, height: 3.5 },
    { id: "L1", name: "First Floor (L1)", elevation: 3.5, height: 3.5 },
    { id: "L2", name: "Second Floor (L2)", elevation: 7.0, height: 3.5 },
    { id: "Roof", name: "Roof Level", elevation: 10.5, height: 3.0 },
  ];

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 3.5);
    try {
      this.views = this.engine.views || this.engine.components.get(OBC.Views);
      if (this.views && this.engine.world) {
        this.views.world = this.engine.world;
      }
      this.clipStyler = this.engine.clipStyler || this.engine.components.get(OBF.ClipStyler);
    } catch (e) {}
  }

  public static getInstance(): StoreyLevelSlicer {
    if (!StoreyLevelSlicer.instance) {
      StoreyLevelSlicer.instance = new StoreyLevelSlicer();
    }
    return StoreyLevelSlicer.instance;
  }

  /**
   * Synchronizes storey levels from loaded IFC BuildingStoreys via ThatOpen OBC.Views
   */
  public async syncIfcStoreyViews(): Promise<StoreyLevel[]> {
    try {
      if (!this.views || !this.engine.fragments || this.engine.fragments.list.size === 0) {
        return this.levels;
      }
      const createdViews = await this.views.createFromIfcStoreys({
        world: this.engine.world,
        offset: 1.2,
      });
      if (createdViews && createdViews.length > 0) {
        this.levels = createdViews.map((v: any, idx: number) => ({
          id: v.id || `L${idx}`,
          name: v.id || `Storey ${idx + 1}`,
          elevation: v.plane ? -v.plane.constant : idx * 3.5,
          height: v.range || 3.5,
          viewId: v.id,
        }));
      }
    } catch (e) {
      // Keep default levels if model has no explicit IfcBuildingStorey entities
    }
    return this.levels;
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
      try {
        this.views?.close();
        if (this.activeClipEdges) {
          this.activeClipEdges.visible = false;
        }
      } catch (e) {}
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

    // Style the storey slice plane using OBF.ClipStyler if available
    try {
      if (this.clipStyler && this.clipPlane) {
        if (!this.activeClipEdges) {
          this.activeClipEdges = this.clipStyler.create(this.clipPlane, {
            world: this.engine.world,
            link: true,
            items: {
              default: { style: "ArchitecturalSection" },
            },
          });
        } else {
          this.activeClipEdges.visible = true;
          this.activeClipEdges.update();
        }
      }
    } catch (e) {}
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
