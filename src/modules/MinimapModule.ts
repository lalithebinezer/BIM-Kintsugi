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
      if (camera) {
        if (this.isWalkMode) {
          // Switch to eye level height and First-Person mode
          camera.controls?.setLookAt(
            camera.three.position.x,
            1.75, // Eye level (1.75m)
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
        if (camera) {
          camera.controls?.setLookAt(
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

  public teleportToWorldCoordinates(worldX: number, worldZ: number) {
    try {
      const camera = this.engine.world?.camera;
      if (!camera) return;

      const currentY = camera.three.position.y;
      camera.controls?.setLookAt(
        worldX,
        currentY,
        worldZ,
        worldX,
        currentY - 2,
        worldZ - 5,
        true
      );
    } catch (e) {}
  }

  public worldToMinimap(worldX: number, worldZ: number): { x: number; y: number } {
    const centerX = this.config.size / 2;
    const centerY = this.config.size / 2;
    const scale = this.config.zoom;

    return {
      x: centerX + worldX * scale,
      y: centerY + worldZ * scale,
    };
  }

  public minimapToWorld(pixelX: number, pixelY: number): { x: number; z: number } {
    const centerX = this.config.size / 2;
    const centerY = this.config.size / 2;
    const scale = this.config.zoom;

    return {
      x: (pixelX - centerX) / scale,
      z: (pixelY - centerY) / scale,
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

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // Clear background
    ctx.fillStyle = "rgba(10, 10, 14, 0.92)";
    ctx.fillRect(0, 0, w, h);

    // Draw Radar Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;

    for (let x = 0; x < w; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer range rings
    ctx.strokeStyle = "rgba(212, 255, 63, 0.15)";
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.42, 0, Math.PI * 2);
    ctx.stroke();

    // Get current camera position & orientation
    let camPos = new THREE.Vector3(0, 0, 0);
    let camHeading = 0;

    const cam = this.engine.world?.camera?.three;
    if (cam) {
      camPos.copy(cam.position);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      camHeading = Math.atan2(forward.x, forward.z);
    }

    const playerMapPos = this.worldToMinimap(camPos.x, camPos.z);

    // Draw field of view cone
    const fovAngle = Math.PI / 3; // 60 degrees
    const coneRadius = 35;

    ctx.fillStyle = "rgba(212, 255, 63, 0.18)";
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

    // Draw player avatar dot
    ctx.fillStyle = "#D4FF3F";
    ctx.shadowColor = "#D4FF3F";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(playerMapPos.x, playerMapPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw heading direction pointer
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
