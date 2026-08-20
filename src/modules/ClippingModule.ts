import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";
import { SectionPlaneGizmo } from "./SectionPlaneGizmo";

export class ClippingModule {
  private static instance: ClippingModule;
  private engine: BimEngine;
  private sectionPlanes: THREE.Plane[] = [];
  public sectionBoxEnabled: boolean = false;
  
  // Tracking active cutting plane and animations
  private activePlane: any | null = null;
  private planeGlowBorders: Map<any, THREE.LineSegments> = new Map();
  private isPulsingActive: boolean = false;
  private pulseAnimFrameId: number | null = null;
  private isGliding: boolean = false;
  private planesChangedListeners: Set<(planes: any[]) => void> = new Set();

  constructor() {
    this.engine = BimEngine.getInstance();
    this.initSectionPlanes();
    this.setupClipperHooks();
    this.startPulsingAnimation();
  }

  public static getInstance(): ClippingModule {
    if (!ClippingModule.instance) {
      ClippingModule.instance = new ClippingModule();
    }
    return ClippingModule.instance;
  }

  private initSectionPlanes() {
    this.sectionPlanes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 1000),   // X-Min
      new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1000),  // X-Max
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 1000),   // Y-Min
      new THREE.Plane(new THREE.Vector3(0, -1, 0), 1000),  // Y-Max
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 1000),   // Z-Min
      new THREE.Plane(new THREE.Vector3(0, 0, -1), 1000)   // Z-Max
    ];
  }

  private setupClipperHooks() {
    const clipper = this.engine.clipper;
    if (!clipper) return;

    // Listen for newly created clipping planes
    try {
      if (clipper.onAfterCreate && typeof clipper.onAfterCreate.add === "function") {
        clipper.onAfterCreate.add((plane: any) => {
          this.handlePlaneCreated(plane);
          this.notifyPlanesChanged();
        });
      }
    } catch (e) {
      console.warn("Clipper onAfterCreate hook warning:", e);
    }

    // Listen for plane drag interactions to set active plane
    try {
      if (clipper.onBeforeDrag && typeof clipper.onBeforeDrag.add === "function") {
        clipper.onBeforeDrag.add((plane: any) => {
          this.setActivePlane(plane);
        });
      }
    } catch (e) {
      console.warn("Clipper onBeforeDrag hook warning:", e);
    }

    // Listen for plane deletion
    try {
      if (clipper.onAfterDelete && typeof clipper.onAfterDelete.add === "function") {
        clipper.onAfterDelete.add((deletedPlane: any) => {
          this.handlePlaneDeleted(deletedPlane);
          this.notifyPlanesChanged();
        });
      }
    } catch (e) {
      console.warn("Clipper onAfterDelete hook warning:", e);
    }
  }

  /**
   * Register a listener for changes to the active section planes list.
   */
  public subscribePlanesChange(callback: (planes: any[]) => void): () => void {
    this.planesChangedListeners.add(callback);
    callback(this.getAllPlanes());
    return () => {
      this.planesChangedListeners.delete(callback);
    };
  }

  /**
   * Notify all registered listeners when planes are added, removed, or modified.
   */
  public notifyPlanesChanged() {
    const planes = this.getAllPlanes();
    for (const listener of this.planesChangedListeners) {
      try {
        listener(planes);
      } catch (err) {
        console.error("Error in plane change listener:", err);
      }
    }
  }

  /**
   * Returns all active clipping planes from the clipper.
   */
  public getAllPlanes(): any[] {
    const clipper = this.engine.clipper;
    if (!clipper || !clipper.list) return [];
    return Array.from(clipper.list.values());
  }

  /**
   * Called whenever a new clipping plane is created.
   * Glides the plane smoothly into slicing position instead of snapping.
   */
  public handlePlaneCreated(plane: any) {
    if (!plane) return;

    this.setActivePlane(plane);

    // Attach custom glowing border to the plane helper
    this.attachGlowBorder(plane);

    // Save final target origin and normal
    const targetOrigin = plane.origin ? plane.origin.clone() : new THREE.Vector3();
    const targetNormal = plane.normal ? plane.normal.clone() : new THREE.Vector3(0, 1, 0);

    // Store target in plane's user data for future animations
    if (!plane.userData) plane.userData = {};
    plane.userData.targetOrigin = targetOrigin.clone();
    plane.userData.targetNormal = targetNormal.clone();

    // Start with a smooth offset along the normal
    const glideDistance = 14.0; // Smooth 14m glide into the model
    const startOrigin = targetOrigin.clone().addScaledVector(targetNormal, glideDistance);

    // Immediately place plane at start offset
    try {
      plane.setFromNormalAndCoplanarPoint(targetNormal, startOrigin);
    } catch {
      // Fallback
    }

    // Smoothly glide into target position
    this.glidePlaneTo(plane, startOrigin, targetOrigin, targetNormal, 750);
  }

  private handlePlaneDeleted(plane: any) {
    const border = this.planeGlowBorders.get(plane);
    if (border) {
      border.removeFromParent();
      if (border.geometry) border.geometry.dispose();
      if (Array.isArray(border.material)) {
        border.material.forEach((m) => m.dispose());
      } else if (border.material) {
        border.material.dispose();
      }
      this.planeGlowBorders.delete(plane);
    }

    if (this.activePlane === plane) {
      this.activePlane = null;
      // Switch active plane to another existing plane if available
      const clipper = this.engine.clipper;
      if (clipper && clipper.list && clipper.list.size > 0) {
        const remaining = Array.from(clipper.list.values());
        if (remaining.length > 0) {
          this.setActivePlane(remaining[remaining.length - 1]);
        }
      }
    }
  }

  /**
   * Sets the active cutting plane and updates its highlight state.
   */
  public setActivePlane(plane: any) {
    if (this.activePlane === plane) return;

    // Reset previous active plane appearance
    if (this.activePlane) {
      const prevBorder = this.planeGlowBorders.get(this.activePlane);
      if (prevBorder) prevBorder.visible = false;
      if (this.activePlane.planeMaterial) {
        this.activePlane.planeMaterial.opacity = 0.15;
        this.activePlane.planeMaterial.color = this.getPlaneThreeColor(this.activePlane);
      }
    }

    this.activePlane = plane;

    if (this.activePlane) {
      this.attachGlowBorder(this.activePlane);
      const activeBorder = this.planeGlowBorders.get(this.activePlane);
      if (activeBorder) {
        activeBorder.visible = true;
        if (activeBorder.material) {
          (activeBorder.material as THREE.LineBasicMaterial).color = this.getPlaneThreeColor(this.activePlane);
        }
      }
      if (this.activePlane.planeMaterial) {
        this.activePlane.planeMaterial.color = this.getPlaneThreeColor(this.activePlane);
      }
      SectionPlaneGizmo.getInstance().attachToPlane(this.activePlane);
    } else {
      SectionPlaneGizmo.getInstance().detach();
    }

    this.notifyPlanesChanged();
  }

  public getActivePlane(): any | null {
    return this.activePlane;
  }

  /**
   * Returns the specific CSS color hex string for a given plane.
   */
  public getPlaneColor(plane: any): string {
    if (!plane) return "var(--accent-500)";
    const meta = this.getPlaneAxisMeta(plane);
    return meta.color || "var(--accent-500)";
  }

  /**
   * Returns the THREE.Color instance for a given plane.
   */
  public getPlaneThreeColor(plane: any): THREE.Color {
    if (!plane) return this.getThemeAccentColor();
    const meta = this.getPlaneAxisMeta(plane);
    if (meta.color && meta.color.startsWith("#")) {
      try {
        return new THREE.Color(meta.color);
      } catch (_) {}
    }
    return this.getThemeAccentColor();
  }

  /**
   * Reads the active theme accent color from CSS custom properties or falls back to Neon Lime.
   */
  private getThemeAccentColor(): THREE.Color {
    if (typeof window !== "undefined" && typeof getComputedStyle === "function") {
      const accentHex = getComputedStyle(document.documentElement).getPropertyValue("--accent-500").trim();
      if (accentHex) {
        try {
          return new THREE.Color(accentHex);
        } catch (_) {}
      }
    }
    return new THREE.Color(0xD4FF3F); // Neon Lime Default
  }

  /**
   * Attaches a glowing, pulsing border frame around the clipping plane helper.
   */
  private attachGlowBorder(plane: any) {
    if (this.planeGlowBorders.has(plane)) return;

    const helper = plane.helper || (plane as any)._helper;
    if (!helper) return;

    const planeColor = this.getPlaneThreeColor(plane);

    // Create a square outline representing the plane cut boundary
    const size = (plane.size || 5) * 1.05;
    const half = size / 2;
    const points = [
      new THREE.Vector3(-half, -half, 0),
      new THREE.Vector3(half, -half, 0),
      new THREE.Vector3(half, -half, 0),
      new THREE.Vector3(half, half, 0),
      new THREE.Vector3(half, half, 0),
      new THREE.Vector3(-half, half, 0),
      new THREE.Vector3(-half, half, 0),
      new THREE.Vector3(-half, -half, 0),
    ];

    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: planeColor,
      linewidth: 3,
      transparent: true,
      opacity: 0.9,
      depthTest: false,
    });

    const borderLines = new THREE.LineSegments(geom, mat);
    borderLines.renderOrder = 999;
    helper.add(borderLines);
    this.planeGlowBorders.set(plane, borderLines);
  }

  /**
   * Smoothly animates a clipping plane from startPoint to targetPoint using cubic ease-out.
   */
  public glidePlaneTo(
    plane: any,
    startPoint: THREE.Vector3,
    targetPoint: THREE.Vector3,
    normal: THREE.Vector3,
    durationMs: number = 700
  ): Promise<void> {
    return new Promise((resolve) => {
      this.isGliding = true;
      const startTime = performance.now();

      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

      const step = () => {
        const now = performance.now();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeOutCubic(progress);

        const currentPoint = new THREE.Vector3().lerpVectors(startPoint, targetPoint, eased);

        try {
          plane.setFromNormalAndCoplanarPoint(normal, currentPoint);
        } catch {
          // Fallback if plane equation is updated directly
          if (plane.three && typeof plane.three.setFromNormalAndCoplanarPoint === "function") {
            plane.three.setFromNormalAndCoplanarPoint(normal, currentPoint);
          }
        }

        if (this.activePlane === plane) {
          SectionPlaneGizmo.getInstance().updateTransform();
        }

        if (this.engine.fragments && this.engine.fragments.core) {
          this.engine.fragments.core.update(true);
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          // Ensure exact target state reached
          try {
            plane.setFromNormalAndCoplanarPoint(normal, targetPoint);
          } catch (_) {}
          this.isGliding = false;
          if (this.activePlane === plane) {
            SectionPlaneGizmo.getInstance().updateTransform();
          }
          if (this.engine.fragments && this.engine.fragments.core) {
            this.engine.fragments.core.update(true);
          }
          resolve();
        }
      };

      requestAnimationFrame(step);
    });
  }

  /**
   * Continuously pulses the active cutting plane with theme synchronized accent glow.
   */
  private startPulsingAnimation() {
    if (this.isPulsingActive) return;
    this.isPulsingActive = true;

    const animate = () => {
      if (this.activePlane && this.activePlane.enabled && this.activePlane.visible) {
        const time = performance.now() * 0.0032;
        const pulse = 0.5 + 0.5 * Math.sin(time); // Smooth 0 to 1 oscillation

        const planeColor = this.getPlaneThreeColor(this.activePlane);
        const pulseFactor = 0.8 + 0.3 * pulse;
        const pulseColor = planeColor.clone().multiplyScalar(pulseFactor);

        // Modulate plane helper surface material
        if (this.activePlane.planeMaterial) {
          this.activePlane.planeMaterial.color = pulseColor;
          this.activePlane.planeMaterial.opacity = 0.2 + 0.16 * pulse;
          this.activePlane.planeMaterial.transparent = true;
          this.activePlane.planeMaterial.needsUpdate = true;
        }

        // Modulate glowing border
        const border = this.planeGlowBorders.get(this.activePlane);
        if (border && border.material) {
          const mat = border.material as THREE.LineBasicMaterial;
          mat.color = pulseColor;
          mat.opacity = 0.55 + 0.45 * pulse;
        }
      }

      this.pulseAnimFrameId = requestAnimationFrame(animate);
    };

    this.pulseAnimFrameId = requestAnimationFrame(animate);
  }

  /**
   * Toggle the Section Cut tool on/off with smooth gliding animations.
   */
  public async toggleSectionCut(forceState?: boolean): Promise<boolean> {
    const clipper = this.engine.clipper;
    if (!clipper) return false;

    const nextState = forceState !== undefined ? forceState : !clipper.enabled;
    const btn = document.getElementById("btn-section-cut");

    if (nextState) {
      // Toggling Section Cut ON
      clipper.enabled = true;
      if (btn) btn.classList.add("active");

      // If existing clipping planes exist, glide them smoothly into position
      if (clipper.list && clipper.list.size > 0) {
        const planes = Array.from(clipper.list.values());
        const glidePromises = planes.map((plane: any) => {
          const targetOrigin = (plane.userData && plane.userData.targetOrigin) || plane.origin.clone();
          const targetNormal = (plane.userData && plane.userData.targetNormal) || plane.normal.clone();
          const startOrigin = targetOrigin.clone().addScaledVector(targetNormal, 10.0);
          
          plane.visible = true;
          this.setActivePlane(plane);
          return this.glidePlaneTo(plane, startOrigin, targetOrigin, targetNormal, 650);
        });
        await Promise.all(glidePromises);
      }
    } else {
      // Toggling Section Cut OFF: glide planes outward smoothly before hiding
      if (btn) btn.classList.remove("active");

      if (clipper.list && clipper.list.size > 0) {
        const planes = Array.from(clipper.list.values());
        const glidePromises = planes.map((plane: any) => {
          const curOrigin = plane.origin ? plane.origin.clone() : new THREE.Vector3();
          const normal = plane.normal ? plane.normal.clone() : new THREE.Vector3(0, 1, 0);
          const endOrigin = curOrigin.clone().addScaledVector(normal, 10.0);
          return this.glidePlaneTo(plane, curOrigin, endOrigin, normal, 400);
        });
        await Promise.all(glidePromises);
      }

      clipper.enabled = false;
      this.activePlane = null;
      SectionPlaneGizmo.getInstance().detach();
    }

    if (this.engine.fragments && this.engine.fragments.core) {
      this.engine.fragments.core.update(true);
    }

    this.notifyPlanesChanged();

    return clipper.enabled;
  }

  public setEnabled(enabled: boolean) {
    this.toggleSectionCut(enabled);
  }

  public isEnabled(): boolean {
    return this.engine.clipper ? this.engine.clipper.enabled : false;
  }

  public isGlidingActive(): boolean {
    return this.isGliding;
  }

  public createSectionPlane() {
    try {
      this.engine.clipper.create(this.engine.world);
    } catch (e) {
      try {
        (this.engine.clipper as any).create();
      } catch (err) {
        console.error("Failed to create section plane:", err);
      }
    }
  }

  /**
   * Creates a predefined section plane along an axis at the model center.
   */
  public createDefaultPlane(axis: "X" | "Y" | "Z" | "NEG_Y" = "Y"): any {
    let normal = new THREE.Vector3(0, 1, 0);
    if (axis === "X") normal = new THREE.Vector3(1, 0, 0);
    else if (axis === "Z") normal = new THREE.Vector3(0, 0, 1);
    else if (axis === "NEG_Y") normal = new THREE.Vector3(0, -1, 0);
    else normal = new THREE.Vector3(0, 1, 0);

    return this.createCustomPlane(normal);
  }

  /**
   * Creates a section plane with a given normal and center point.
   */
  public createCustomPlane(normal: THREE.Vector3 = new THREE.Vector3(0, 1, 0), point?: THREE.Vector3): any {
    const clipper = this.engine.clipper;
    if (!clipper) return null;

    clipper.enabled = true;
    const btn = document.getElementById("btn-section-cut");
    if (btn) btn.classList.add("active");

    let origin = point;
    if (!origin) {
      origin = new THREE.Vector3(0, 0, 0);
      try {
        const boxer = this.engine.components.get(OBC.BoundingBoxer);
        if (boxer) {
          boxer.list.clear();
          boxer.addFromModels();
          const bbox = boxer.get();
          if (!bbox.isEmpty()) {
            bbox.getCenter(origin);
          }
          boxer.list.clear();
        }
      } catch (_) {
        if (this.engine.world?.camera?.controls) {
          try {
            (this.engine.world.camera.controls as any).getTarget(origin);
          } catch {
            // fallback
          }
        }
      }
    }

    let plane: any = null;
    try {
      if (typeof clipper.createFromNormalAndCoplanarPoint === "function") {
        const planeId = clipper.createFromNormalAndCoplanarPoint(this.engine.world, normal, origin);
        if (clipper.list) {
          plane = (clipper.list as any).get ? (clipper.list as any).get(planeId) : Array.from(clipper.list.values()).pop();
        }
      }
    } catch (e) {
      console.warn("createFromNormalAndCoplanarPoint fallback:", e);
    }

    if (!plane) {
      try {
        plane = clipper.create(this.engine.world);
      } catch (e) {
        console.warn("clipper.create fallback:", e);
      }
    }

    if (plane) {
      this.handlePlaneCreated(plane);
    }

    this.notifyPlanesChanged();
    return plane;
  }

  /**
   * Sets a custom human-readable name/label for a clipping plane.
   */
  public setPlaneName(plane: any, name: string) {
    if (!plane) return;
    plane.userData = plane.userData || {};
    plane.userData.customName = name.trim();
    this.notifyPlanesChanged();
  }

  /**
   * Gets the display name for a clipping plane.
   */
  public getPlaneName(plane: any, defaultIndex?: number): string {
    if (!plane) return "Section Plane";
    if (plane.userData && typeof plane.userData.customName === "string" && plane.userData.customName.trim()) {
      return plane.userData.customName.trim();
    }
    return defaultIndex !== undefined ? `Plane #${defaultIndex + 1}` : "Section Plane";
  }

  /**
   * Retrieves user-friendly axis metadata for a given plane.
   */
  public getPlaneAxisMeta(plane: any): { label: string; axis: string; color: string } {
    if (!plane || !plane.normal) {
      return { label: "Cut Plane", axis: "PLANE", color: "var(--accent-500)" };
    }

    const n = plane.normal;
    const absX = Math.abs(n.x);
    const absY = Math.abs(n.y);
    const absZ = Math.abs(n.z);

    if (absY >= 0.75) {
      return n.y >= 0
        ? { label: "+Y Floor Plan", axis: "Y PLAN", color: "#10b981" }
        : { label: "-Y Ceiling Cut", axis: "-Y PLAN", color: "#10b981" };
    } else if (absX >= 0.75) {
      return n.x >= 0
        ? { label: "+X Right Section", axis: "X SEC", color: "#ef4444" }
        : { label: "-X Left Section", axis: "-X SEC", color: "#ef4444" };
    } else if (absZ >= 0.75) {
      return n.z >= 0
        ? { label: "+Z Front Elevation", axis: "Z ELEV", color: "#3b82f6" }
        : { label: "-Z Back Elevation", axis: "-Z ELEV", color: "#3b82f6" };
    } else {
      return {
        label: `Angled (${n.x.toFixed(1)}, ${n.y.toFixed(1)}, ${n.z.toFixed(1)})`,
        axis: "ANGLED",
        color: "#a855f7"
      };
    }
  }

  /**
   * Toggles the visibility/clipping of an individual plane.
   */
  public togglePlaneVisibility(plane: any): boolean {
    if (!plane) return false;

    const isCurrentlyActive = plane.enabled !== false && plane.visible !== false;
    const nextState = !isCurrentlyActive;
    plane.enabled = nextState;
    plane.visible = nextState;

    const border = this.planeGlowBorders.get(plane);
    if (border) {
      border.visible = nextState && (this.activePlane === plane);
    }

    if (this.activePlane === plane) {
      if (nextState) {
        SectionPlaneGizmo.getInstance().attachToPlane(plane);
      } else {
        SectionPlaneGizmo.getInstance().detach();
      }
    }

    if (this.engine.fragments && this.engine.fragments.core) {
      this.engine.fragments.core.update(true);
    }

    this.notifyPlanesChanged();
    return nextState;
  }

  /**
   * Inverts the clipping normal direction of an individual plane.
   */
  public flipPlaneNormal(plane: any) {
    if (!plane) return;

    if (plane.normal) {
      const newNormal = plane.normal.clone().negate();
      const origin = plane.origin ? plane.origin.clone() : new THREE.Vector3();
      try {
        plane.setFromNormalAndCoplanarPoint(newNormal, origin);
      } catch {
        if (plane.three && typeof plane.three.setFromNormalAndCoplanarPoint === "function") {
          plane.three.setFromNormalAndCoplanarPoint(newNormal, origin);
        }
      }
    }

    if (this.activePlane === plane) {
      SectionPlaneGizmo.getInstance().updateTransform();
    }

    if (this.engine.fragments && this.engine.fragments.core) {
      this.engine.fragments.core.update(true);
    }

    this.notifyPlanesChanged();
  }

  /**
   * Deletes a single section plane cleanly.
   */
  public async deletePlane(plane: any) {
    if (!plane) return;

    // 1. Remove glow border
    const border = this.planeGlowBorders.get(plane);
    if (border) {
      border.removeFromParent();
      if (border.geometry) border.geometry.dispose();
      if (border.material) {
        if (Array.isArray(border.material)) border.material.forEach((m) => m.dispose());
        else border.material.dispose();
      }
      this.planeGlowBorders.delete(plane);
    }

    // 2. Dispose plane or remove from clipper
    try {
      if (typeof plane.dispose === "function") {
        plane.dispose();
      }
    } catch (e) {
      console.warn("plane.dispose fallback:", e);
    }

    try {
      const clipper = this.engine.clipper;
      if (clipper) {
        if (typeof clipper.delete === "function") {
          await clipper.delete(this.engine.world, plane.id || (plane as any)._id);
        }
        if (clipper.list) {
          if (typeof (clipper.list as any).delete === "function") {
            (clipper.list as any).delete(plane.id || plane);
          }
        }
      }
    } catch (e) {
      console.warn("clipper.delete fallback:", e);
    }

    // 3. Reassign active plane if this was active
    if (this.activePlane === plane) {
      this.activePlane = null;
      const clipper = this.engine.clipper;
      if (clipper && clipper.list && clipper.list.size > 0) {
        const remaining = Array.from(clipper.list.values());
        if (remaining.length > 0) {
          this.setActivePlane(remaining[remaining.length - 1]);
        }
      }
    }

    // 4. Update fragments core
    if (this.engine.fragments && this.engine.fragments.core) {
      this.engine.fragments.core.update(true);
    }

    this.notifyPlanesChanged();
  }

  public deleteAllPlanes() {
    // Clean up glow borders
    for (const [, border] of this.planeGlowBorders) {
      border.removeFromParent();
      if (border.geometry) border.geometry.dispose();
      if (border.material) {
        if (Array.isArray(border.material)) border.material.forEach(m => m.dispose());
        else border.material.dispose();
      }
    }
    this.planeGlowBorders.clear();
    this.activePlane = null;
    SectionPlaneGizmo.getInstance().detach();

    if (this.engine.clipper) {
      this.engine.clipper.deleteAll();
    }
    this.setSectionBoxEnabled(false);

    if (this.engine.fragments && this.engine.fragments.core) {
      this.engine.fragments.core.update(true);
    }

    this.notifyPlanesChanged();
  }

  public setSectionBoxEnabled(enabled: boolean) {
    this.sectionBoxEnabled = enabled;
    const renderer = this.engine.world.renderer;
    if (!renderer) return;
    const rendererThree = renderer.three;
    
    if (enabled) {
      rendererThree.clippingPlanes = this.sectionPlanes;
      this.updateSectionBoxBounds(0, 0, 0, 50, 50, 50);
    } else {
      rendererThree.clippingPlanes = [];
    }
    
    if (this.engine.fragments.core) {
      this.engine.fragments.core.update(true);
    }
  }

  public updateSectionBoxBounds(
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number
  ) {
    if (!this.sectionBoxEnabled) return;

    this.sectionPlanes[0].constant = -minX;
    this.sectionPlanes[1].constant = maxX;
    this.sectionPlanes[2].constant = -minY;
    this.sectionPlanes[3].constant = maxY;
    this.sectionPlanes[4].constant = -minZ;
    this.sectionPlanes[5].constant = maxZ;

    if (this.engine.fragments.core) {
      this.engine.fragments.core.update(true);
    }
  }

  public dispose() {
    if (this.pulseAnimFrameId !== null) {
      cancelAnimationFrame(this.pulseAnimFrameId);
      this.pulseAnimFrameId = null;
    }
    this.deleteAllPlanes();
  }
}
