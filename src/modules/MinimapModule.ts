import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export interface MinimapConfig {
  size: number;
  zoom: number;
  currentLevelIndex: number;
  levels: { name: string; elevation: number }[];
  isWalkModeActive: boolean;
}

export class MinimapModule {
  private static instance: MinimapModule;
  private engine: BimEngine;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isVisible: boolean = true;
  private isWalkMode: boolean = false;
  private animationFrameId: number | null = null;

  // Cached model bounds & center for dynamic auto-fit
  private modelBounds: THREE.Box3 = new THREE.Box3();
  private modelCenter: THREE.Vector3 = new THREE.Vector3();
  private modelSize: THREE.Vector3 = new THREE.Vector3();
  private hasModel: boolean = false;

  private config: MinimapConfig = {
    size: 180,
    zoom: 8,
    currentLevelIndex: 0,
    levels: [
      { name: "Ground Floor (L0)", elevation: 0.0 },
      { name: "First Floor (L1)", elevation: 3.5 },
      { name: "Second Floor (L2)", elevation: 7.0 },
      { name: "Roof Level", elevation: 10.5 },
    ],
    isWalkModeActive: false,
  };

  private constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): MinimapModule {
    if (!MinimapModule.instance) {
      MinimapModule.instance = new MinimapModule();
    }
    return MinimapModule.instance;
  }

  public init(canvasId: string = "minimap-canvas") {
    if (typeof document === "undefined") return;

    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (this.canvas) {
      this.canvas.width = this.config.size;
      this.canvas.height = this.config.size;
      this.ctx = this.canvas.getContext("2d");
      this.bindEvents();
      this.startRenderLoop();
    }
  }

  public toggleVisibility(visible?: boolean): boolean {
    this.isVisible = visible !== undefined ? visible : !this.isVisible;
    const container = document.getElementById("minimap-container");
    if (container) {
      container.classList.toggle("hidden", !this.isVisible);
    }
    return this.isVisible;
  }

  public toggleWalkMode(enable?: boolean): boolean {
    this.isWalkMode = enable !== undefined ? enable : !this.isWalkMode;
    this.config.isWalkModeActive = this.isWalkMode;

    try {
      const camera = this.engine.world?.camera;
      if (camera && camera.controls) {
        if (this.isWalkMode) {
          camera.controls.setLookAt(
            camera.three.position.x,
            1.75,
            camera.three.position.z,
            camera.three.position.x,
            1.75,
            camera.three.position.z - 5,
            true
          );
        }
      }
    } catch (e) {}

    const walkBtn = document.getElementById("btn-minimap-walk-toggle");
    if (walkBtn) {
      walkBtn.classList.toggle("active", this.isWalkMode);
      walkBtn.innerText = this.isWalkMode ? "Walk Mode (WASD)" : "Orbit Mode";
    }

    return this.isWalkMode;
  }

  public setLevel(index: number) {
    if (index >= 0 && index < this.config.levels.length) {
      this.config.currentLevelIndex = index;
      const targetElevation = this.config.levels[index].elevation;

      try {
        const camera = this.engine.world?.camera;
        if (camera && camera.controls) {
          camera.controls.setLookAt(
            camera.three.position.x,
            targetElevation + (this.isWalkMode ? 1.75 : 8.0),
            camera.three.position.z,
            camera.three.position.x,
            targetElevation,
            camera.three.position.z - 2,
            true
          );
        }
      } catch (e) {}
      this.updateUI();
    }
  }

  /**
   * Recalculates aggregate model bounding box across all loaded IFC models and scene meshes
   */
  public updateModelBounds() {
    this.modelBounds.makeEmpty();
    this.hasModel = false;

    // 1. Scan ThatOpen Fragments Manager
    if (this.engine.fragments && this.engine.fragments.list) {
      for (const [, model] of this.engine.fragments.list) {
        if (model) {
          const modelObj = (model.object || model) as THREE.Object3D;
          if (modelObj && typeof modelObj.traverse === "function") {
            this.modelBounds.expandByObject(modelObj);
            this.hasModel = true;
          }
        }
      }
    }

    // 2. Scan Three.js Scene objects for any additional BIM meshes
    const scene = this.engine.world?.scene?.three;
    if (scene) {
      scene.traverse((obj) => {
        if (
          obj instanceof THREE.Mesh &&
          obj.name !== "BIM_GroundContactShadow" &&
          !obj.name.includes("Measurement") &&
          !obj.name.includes("Selection")
        ) {
          this.modelBounds.expandByObject(obj);
          this.hasModel = true;
        }
      });
    }

    if (this.hasModel && !this.modelBounds.isEmpty()) {
      this.modelBounds.getCenter(this.modelCenter);
      this.modelBounds.getSize(this.modelSize);

      // Auto-compute zoom scale so building occupies ~65% of minimap
      const maxDim = Math.max(this.modelSize.x, this.modelSize.z, 5);
      this.config.zoom = (this.config.size * 0.65) / maxDim;
    }
  }

  public teleportToWorldCoordinates(worldX: number, worldZ: number) {
    try {
      const camera = this.engine.world?.camera;
      if (!camera || !camera.controls) return;

      const currentY = camera.three?.position?.y || 1.75;
      camera.controls.setLookAt(
        worldX,
        currentY,
        worldZ,
        worldX,
        currentY - 1,
        worldZ - 4,
        true
      );
    } catch (e) {}
  }

  public worldToMinimap(worldX: number, worldZ: number): { x: number; y: number } {
    const centerX = this.config.size / 2;
    const centerY = this.config.size / 2;
    const scale = this.config.zoom;
    const originX = this.hasModel ? this.modelCenter.x : 0;
    const originZ = this.hasModel ? this.modelCenter.z : 0;

    return {
      x: centerX + (worldX - originX) * scale,
      y: centerY + (worldZ - originZ) * scale,
    };
  }

  public minimapToWorld(pixelX: number, pixelY: number): { x: number; z: number } {
    const centerX = this.config.size / 2;
    const centerY = this.config.size / 2;
    const scale = this.config.zoom;
    const originX = this.hasModel ? this.modelCenter.x : 0;
    const originZ = this.hasModel ? this.modelCenter.z : 0;

    return {
      x: (pixelX - centerX) / scale + originX,
      z: (pixelY - centerY) / scale + originZ,
    };
  }

  private bindEvents() {
    if (!this.canvas) return;

    this.canvas.addEventListener("click", (e) => {
      const rect = this.canvas!.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const worldPos = this.minimapToWorld(clickX, clickY);
      this.teleportToWorldCoordinates(worldPos.x, worldPos.z);
    });
  }

  public draw() {
    if (!this.ctx || !this.canvas || !this.isVisible) return;

    // Refresh model bounds periodically
    this.updateModelBounds();

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const center = w / 2;

    // Clear background (Deep sleek architectural slate)
    ctx.fillStyle = "rgba(10, 12, 18, 0.95)";
    ctx.fillRect(0, 0, w, h);

    // 1. Draw Architectural Metric Radar Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.06)";
    ctx.lineWidth = 1;

    for (let x = 0; x < w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 18) {
      ctx.beginPath();
      ctx.moveTo(y, 0);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer range rings
    ctx.strokeStyle = "rgba(212, 255, 63, 0.16)";
    ctx.beginPath();
    ctx.arc(center, center, w * 0.44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
    ctx.beginPath();
    ctx.arc(center, center, w * 0.26, 0, Math.PI * 2);
    ctx.stroke();

    // 2. Draw Loaded BIM Model Footprints & Slabs
    if (this.hasModel && !this.modelBounds.isEmpty()) {
      const minPt = this.worldToMinimap(this.modelBounds.min.x, this.modelBounds.min.z);
      const maxPt = this.worldToMinimap(this.modelBounds.max.x, this.modelBounds.max.z);

      const footX = Math.min(minPt.x, maxPt.x);
      const footY = Math.min(minPt.y, maxPt.y);
      const footW = Math.abs(maxPt.x - minPt.x);
      const footH = Math.abs(maxPt.y - minPt.y);

      // A. Building Footprint Glow Fill
      ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
      ctx.fillRect(footX, footY, footW, footH);

      // B. Structural Outer Perimeter (Cyan with subtle glow)
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(footX, footY, footW, footH);

      // C. Internal Storey Grid Partitioning
      ctx.strokeStyle = "rgba(212, 255, 63, 0.25)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(footX + footW * 0.33, footY);
      ctx.lineTo(footX + footW * 0.33, footY + footH);
      ctx.moveTo(footX + footW * 0.66, footY);
      ctx.lineTo(footX + footW * 0.66, footY + footH);
      ctx.moveTo(footX, footY + footH * 0.5);
      ctx.lineTo(footX + footW, footY + footH * 0.5);
      ctx.stroke();

      // D. Corner Structural Pillars
      ctx.fillStyle = "#D4FF3F";
      const pillarSize = 3.5;
      [
        [footX, footY],
        [footX + footW - pillarSize, footY],
        [footX, footY + footH - pillarSize],
        [footX + footW - pillarSize, footY + footH - pillarSize],
      ].forEach(([px, py]) => {
        ctx.fillRect(px, py, pillarSize, pillarSize);
      });
    }

    // 3. Get Current Camera Position & Eye Level Heading
    let camPos = new THREE.Vector3(0, 0, 0);
    let camHeading = 0;

    const cam = this.engine.world?.camera?.three;
    if (cam) {
      camPos.copy(cam.position);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      camHeading = Math.atan2(forward.x, forward.z);
    }

    const playerMapPos = this.worldToMinimap(camPos.x, camPos.z);

    // 4. Draw Camera Field of View Frustum Cone
    const fovAngle = Math.PI / 3; // 60 degrees
    const coneRadius = 32;

    ctx.fillStyle = "rgba(212, 255, 63, 0.25)";
    ctx.beginPath();
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.arc(
      playerMapPos.x,
      playerMapPos.y,
      coneRadius,
      camHeading - fovAngle / 2 - Math.PI / 2,
      camHeading + fovAngle / 2 - Math.PI / 2
    );
    ctx.closePath();
    ctx.fill();

    // 5. Draw Player / Camera Avatar Marker
    ctx.fillStyle = "#D4FF3F";
    ctx.shadowColor = "#D4FF3F";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(playerMapPos.x, playerMapPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 6. Draw Directional View Arrow
    const headingLength = 12;
    const endX = playerMapPos.x + Math.sin(camHeading) * headingLength;
    const endY = playerMapPos.y - Math.cos(camHeading) * headingLength;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  private startRenderLoop() {
    const loop = () => {
      this.draw();
      this.animationFrameId = requestAnimationFrame(loop);
    };
    loop();
  }

  public destroy() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  public updateUI() {
    if (typeof document === "undefined") return;

    const levelBadge = document.getElementById("minimap-level-name");
    if (levelBadge && this.config.levels[this.config.currentLevelIndex]) {
      levelBadge.innerText = this.config.levels[this.config.currentLevelIndex].name;
    }
  }

  public getConfig(): MinimapConfig {
    return this.config;
  }
}
