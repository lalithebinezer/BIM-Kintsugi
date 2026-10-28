import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { StoreyLevelSlicer } from "./StoreyLevelSlicer";
import { showToast } from "../ui/ToastManager";

/**
 * PlanOverlayModule — Projects 2D CAD/PDF drawing sheets onto 3D Storey Slices.
 *
 * Provides opacity blending, scaling, and alignment directly over active floor plates.
 */
export class PlanOverlayModule {
  private static instance: PlanOverlayModule | null = null;
  private engine: BimEngine;
  private overlayMesh: THREE.Mesh | null = null;
  private overlayMaterial: THREE.MeshBasicMaterial | null = null;
  private isVisible: boolean = false;
  private currentOpacity: number = 0.75;
  private currentScale: number = 30.0; // meters width/length

  private constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): PlanOverlayModule {
    if (!PlanOverlayModule.instance) {
      PlanOverlayModule.instance = new PlanOverlayModule();
    }
    return PlanOverlayModule.instance;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public getOpacity(): number {
    return this.currentOpacity;
  }

  public getScale(): number {
    return this.currentScale;
  }

  /**
   * Load drawing from an image file (PNG/JPG) or PDF raster.
   */
  public async loadDrawingFromFile(file: File): Promise<boolean> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          this.applyDrawingTexture(dataUrl);
          showToast(`Loaded 2D Plan Drawing: ${file.name}`, "success");
          resolve(true);
        } else {
          resolve(false);
        }
      };
      reader.onerror = () => {
        showToast("Failed to read drawing file.", "warning");
        resolve(false);
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Create or update the textured 3D plane at the active floor level.
   */
  public applyDrawingTexture(imageUrl: string): void {
    const scene = this.engine.world?.scene?.three;
    if (!scene) return;

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(imageUrl, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.generateMipmaps = true;
      texture.minFilter = THREE.LinearMipmapLinearFilter;

      if (!this.overlayMaterial) {
        this.overlayMaterial = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: this.currentOpacity,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });
      } else {
        this.overlayMaterial.map = texture;
        this.overlayMaterial.needsUpdate = true;
      }

      if (!this.overlayMesh) {
        const geo = new THREE.PlaneGeometry(this.currentScale, this.currentScale);
        geo.rotateX(-Math.PI / 2); // Lay flat on XZ floor plane
        this.overlayMesh = new THREE.Mesh(geo, this.overlayMaterial);
        this.overlayMesh.name = "BIM_2D_Plan_Overlay";
        this.overlayMesh.renderOrder = 2000;
        scene.add(this.overlayMesh);
      }

      this.alignToActiveStorey();
      this.isVisible = true;
      this.overlayMesh.visible = true;
    });
  }

  /**
   * Aligns the Y elevation of the 2D sheet to the currently active storey level.
   */
  public alignToActiveStorey(): void {
    if (!this.overlayMesh) return;
    const slicer = StoreyLevelSlicer.getInstance();
    const activeLevel = slicer.getActiveLevel();
    const elevation = activeLevel ? activeLevel.elevation + 0.05 : 0.05; // 50mm above slab surface
    this.overlayMesh.position.y = elevation;
  }

  public setOpacity(opacity: number): void {
    this.currentOpacity = Math.max(0, Math.min(1, opacity));
    if (this.overlayMaterial) {
      this.overlayMaterial.opacity = this.currentOpacity;
      this.overlayMaterial.needsUpdate = true;
    }
  }

  public setScale(scaleMeters: number): void {
    this.currentScale = Math.max(1, scaleMeters);
    if (this.overlayMesh) {
      this.overlayMesh.scale.set(this.currentScale / 30, 1, this.currentScale / 30);
    }
  }

  public toggleVisibility(): boolean {
    if (!this.overlayMesh) return false;
    this.isVisible = !this.isVisible;
    this.overlayMesh.visible = this.isVisible;
    showToast(this.isVisible ? "2D Sheet Overlay Visible" : "2D Sheet Hidden", "info");
    return this.isVisible;
  }

  public removeOverlay(): void {
    if (this.overlayMesh && this.engine.world?.scene?.three) {
      this.engine.world.scene.three.remove(this.overlayMesh);
      this.overlayMesh.geometry.dispose();
      if (this.overlayMaterial) {
        this.overlayMaterial.dispose();
      }
      this.overlayMesh = null;
      this.overlayMaterial = null;
      this.isVisible = false;
      showToast("Removed 2D Drawing Overlay", "info");
    }
  }
}

