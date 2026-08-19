import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export class MinimapHUD {
  private static instance: MinimapHUD | null = null;
  private engine: BimEngine;
  private canvasEl: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private containerEl: HTMLElement | null = null;
  private elevationBadgeEl: HTMLElement | null = null;
  private visible: boolean = true;
  private scanAngle: number = 0;

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.setupDOM();
  }

  public static getInstance(): MinimapHUD {
    if (!MinimapHUD.instance) {
      MinimapHUD.instance = new MinimapHUD();
    }
    return MinimapHUD.instance;
  }

  private setupDOM() {
    this.containerEl = document.getElementById("minimap-hud-container");
    this.canvasEl = document.getElementById("minimap-hud-canvas") as HTMLCanvasElement;
    this.elevationBadgeEl = document.getElementById("radar-elevation-badge");

    if (!this.containerEl) {
      this.containerEl = document.createElement("div");
      this.containerEl.id = "minimap-hud-container";
      this.containerEl.className = "minimap-hud-container";

      const header = document.createElement("div");
      header.className = "radar-hud-header";
      header.innerHTML = `
        <div class="radar-hud-title">
          <span class="radar-status-dot"></span>
          <span>RADAR HUD</span>
        </div>
        <div id="radar-elevation-badge" class="radar-elevation-badge">ELV: +0.0m</div>
      `;
      this.containerEl.appendChild(header);
      this.elevationBadgeEl = header.querySelector("#radar-elevation-badge");

      this.canvasEl = document.createElement("canvas");
      this.canvasEl.id = "minimap-hud-canvas";
      this.canvasEl.width = 136;
      this.canvasEl.height = 136;
      this.containerEl.appendChild(this.canvasEl);

      document.getElementById("app")?.appendChild(this.containerEl);
    }

    if (this.canvasEl) {
      this.ctx = this.canvasEl.getContext("2d");
    }
  }

  public setVisible(visible: boolean) {
    this.visible = visible;
    if (this.containerEl) {
      this.containerEl.style.display = visible ? "block" : "none";
    }
  }

  public update() {
    if (!this.visible || !this.ctx || !this.canvasEl || !this.engine.world.camera) return;

    const ctx = this.ctx;
    const w = this.canvasEl.width;
    const h = this.canvasEl.height;
    const center = w / 2;

    ctx.clearRect(0, 0, w, h);

    // Dynamic scan line effect
    this.scanAngle += 0.03;
    if (this.scanAngle > Math.PI * 2) this.scanAngle = 0;

    // 1. Draw Polar Radar Grid & Crosshairs
    ctx.save();
    ctx.translate(center, center);

    // Outer circle
    ctx.strokeStyle = "rgba(212, 255, 63, 0.35)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.stroke();

    // Inner range circles
    ctx.strokeStyle = "rgba(212, 255, 63, 0.15)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 38, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();

    // Crosshair axes
    ctx.strokeStyle = "rgba(212, 255, 63, 0.2)";
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(-56, 0);
    ctx.lineTo(56, 0);
    ctx.moveTo(0, -56);
    ctx.lineTo(0, 56);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cardinal Indicators aligned with ViewCube (North: Top / -Z, South: Bottom / +Z, East: Right / +X, West: Left / -X)
    ctx.font = "bold 8px var(--font-mono, monospace)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // North Indicator
    ctx.fillStyle = "#D4FF3F";
    ctx.fillText("N", 0, -46);
    // North Arrow tip
    ctx.fillStyle = "#D4FF3F";
    ctx.beginPath();
    ctx.moveTo(0, -55);
    ctx.lineTo(3, -50);
    ctx.lineTo(-3, -50);
    ctx.closePath();
    ctx.fill();

    // South, East, West Indicators
    ctx.fillStyle = "rgba(203, 213, 225, 0.55)";
    ctx.fillText("S", 0, 47);
    ctx.fillText("E", 47, 0);
    ctx.fillText("W", -47, 0);

    // Rotating Radar Sweep Ray
    const sweepGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 56);
    sweepGradient.addColorStop(0, "rgba(212, 255, 63, 0.25)");
    sweepGradient.addColorStop(1, "rgba(212, 255, 63, 0)");
    ctx.fillStyle = sweepGradient;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 56, this.scanAngle - 0.4, this.scanAngle);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // 2. Get Camera & Model coordinates
    const camPos = new THREE.Vector3();
    const cam = this.engine.world.camera;
    if (!cam) return;

    if (cam.controls) {
      cam.controls.getPosition(camPos);
    } else if (cam.three) {
      cam.three.getWorldPosition(camPos);
    }

    if (this.elevationBadgeEl) {
      const elv = camPos.y >= 0 ? `+${camPos.y.toFixed(1)}m` : `${camPos.y.toFixed(1)}m`;
      this.elevationBadgeEl.innerText = `ELV: ${elv}`;
    }

    // 3. Get Model Bounding Box Footprint
    const bbox = new THREE.Box3();
    let hasModel = false;
    for (const [, model] of this.engine.fragments.list) {
      const modelObj = (model?.object || model) as THREE.Object3D;
      if (modelObj) {
        bbox.expandByObject(modelObj);
        hasModel = true;
      }
    }

    const dir = new THREE.Vector3();
    cam.three.getWorldDirection(dir);
    // In Three.js coordinate system: +X is East, -Z is North, +Z is South.
    // Clockwise azimuth angle from North (0 = North, PI/2 = East, PI = South, -PI/2 = West):
    const angle = Math.atan2(dir.x, -dir.z);

    // 4. Draw Model Footprint on Radar (Scaled to fit within radar screen)
    if (hasModel && !bbox.isEmpty()) {
      const modelCenter = new THREE.Vector3();
      bbox.getCenter(modelCenter);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      const maxDim = Math.max(size.x, size.z, 15);
      const scale = 70 / maxDim; // Fit nicely into radar boundary
      const relX = (modelCenter.x - camPos.x) * scale;
      const relZ = (modelCenter.z - camPos.z) * scale;

      // Clamp footprint within display area
      const clampedRelX = Math.max(-30, Math.min(30, relX));
      const clampedRelZ = Math.max(-30, Math.min(30, relZ));

      ctx.save();
      ctx.translate(center + clampedRelX, center + clampedRelZ);

      // Model Box Fill & Outline
      const boxW = Math.max(8, size.x * scale);
      const boxH = Math.max(8, size.z * scale);

      ctx.fillStyle = "rgba(212, 255, 63, 0.12)";
      ctx.strokeStyle = "#D4FF3F";
      ctx.lineWidth = 1.5;
      ctx.fillRect(-boxW / 2, -boxH / 2, boxW, boxH);
      ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

      // Center cross on model
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-3, 0);
      ctx.lineTo(3, 0);
      ctx.moveTo(0, -3);
      ctx.lineTo(0, 3);
      ctx.stroke();

      ctx.restore();
    }

    // 5. Draw Camera / Player Position & Vision Cone
    ctx.save();
    ctx.translate(center, center);

    // Vision frustum cone (mapped clockwise from North)
    ctx.fillStyle = "rgba(212, 255, 63, 0.22)";
    ctx.strokeStyle = "rgba(212, 255, 63, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const fovSpread = 0.38;
    ctx.arc(0, 0, 32, -Math.PI / 2 + angle - fovSpread, -Math.PI / 2 + angle + fovSpread);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Direction arrow pointer pointing towards active view orientation
    ctx.rotate(angle);
    ctx.fillStyle = "#D4FF3F";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }
}
