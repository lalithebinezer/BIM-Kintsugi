import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";
import { ClashDetector } from "./ClashDetector";
import { StoreyLevelSlicer } from "./StoreyLevelSlicer";

export interface MinimapConfig {
  size: number;
  zoom: number;
  currentLevelIndex: number;
  levels: { name: string; elevation: number }[];
  isWalkModeActive: boolean;
  autoTrackLevel?: boolean;
  showClashPins?: boolean;
  isExpanded?: boolean;
}

export class MinimapModule {
  private static instance: MinimapModule;
  private engine: BimEngine;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isVisible: boolean = true;
  private isWalkMode: boolean = false;
  private isDraggingMinimap: boolean = false;
  private isRotatingGaze: boolean = false;
  private isPanning: boolean = false;
  private lastPanPointer: { x: number; y: number } = { x: 0, y: 0 };
  private panOffset: { x: number; y: number } = { x: 0, y: 0 };
  private hoverPixel: { x: number; y: number } | null = null;
  private animationFrameId: number | null = null;

  // Cached model bounds & center for dynamic auto-fit
  private modelBounds: THREE.Box3 = new THREE.Box3();
  private modelCenter: THREE.Vector3 = new THREE.Vector3();
  private modelSize: THREE.Vector3 = new THREE.Vector3();
  private meshFootprints: Array<{ minX: number; minZ: number; maxX: number; maxZ: number; minY: number; maxY: number }> = [];
  private hasModel: boolean = false;

  // Selected element marker on radar
  private selectedElementPos: THREE.Vector3 | null = null;
  private selectedExpressId: number | null = null;

  private isAutoTrackLevel: boolean = true;
  private showClashPins: boolean = true;
  private isExpanded: boolean = false;

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
    autoTrackLevel: true,
    showClashPins: true,
    isExpanded: false,
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
      this.bindHeaderControls();
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

  public syncLevelsFromStoreySlicer() {
    try {
      const slicerLevels = StoreyLevelSlicer.getInstance().levels;
      if (slicerLevels && slicerLevels.length > 0) {
        this.config.levels = slicerLevels.map((l) => ({ name: l.name, elevation: l.elevation }));
        const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
        if (select) {
          select.innerHTML = this.config.levels
            .map((lvl, idx) => `<option value="${idx}">${lvl.name} (${lvl.elevation >= 0 ? "+" : ""}${lvl.elevation}m)</option>`)
            .join("");
          select.value = String(this.config.currentLevelIndex);
        }
        this.updateUI();
      }
    } catch (e) {}
  }

  /**
   * Rotates 3D camera to face True North (looking down -Z)
   */
  public faceNorth() {
    try {
      const camera = this.engine.world?.camera;
      if (camera && camera.controls) {
        const pos = camera.three.position;
        const target = new THREE.Vector3();
        (camera.controls as any).getTarget(target);
        const dist = Math.hypot(target.x - pos.x, target.z - pos.z) || 12;
        camera.controls.setLookAt(
          pos.x,
          pos.y,
          pos.z,
          pos.x,
          target.y,
          pos.z - dist,
          true
        );
      }
    } catch (e) {}
  }

  public zoomIn() {
    this.config.zoom = Math.min(50, this.config.zoom * 1.25);
  }

  public zoomOut() {
    this.config.zoom = Math.max(0.5, this.config.zoom / 1.25);
  }

  public resetView() {
    this.panOffset = { x: 0, y: 0 };
    if (this.hasModel && !this.modelBounds.isEmpty()) {
      const maxDim = Math.max(this.modelSize.x, this.modelSize.z, 5);
      this.config.zoom = (this.config.size * 0.65) / maxDim;
    } else {
      this.config.zoom = 8;
    }
  }

  public toggleAutoTrackLevel(enable?: boolean): boolean {
    this.isAutoTrackLevel = enable !== undefined ? enable : !this.isAutoTrackLevel;
    this.config.autoTrackLevel = this.isAutoTrackLevel;
    const btn = document.getElementById("btn-minimap-autolevel");
    if (btn) {
      btn.classList.toggle("active", this.isAutoTrackLevel);
    }
    return this.isAutoTrackLevel;
  }

  public toggleExpanded(enable?: boolean): boolean {
    this.isExpanded = enable !== undefined ? enable : !this.isExpanded;
    this.config.isExpanded = this.isExpanded;
    const container = document.getElementById("minimap-container");
    if (container) {
      container.classList.toggle("expanded", this.isExpanded);
    }
    const newSize = this.isExpanded ? 280 : 180;
    this.setSize(newSize);
    return this.isExpanded;
  }

  public setSize(size: number) {
    this.config.size = size;
    if (this.canvas) {
      this.canvas.width = size;
      this.canvas.height = size;
    }
  }

  public toggleClashPins(enable?: boolean): boolean {
    this.showClashPins = enable !== undefined ? enable : !this.showClashPins;
    this.config.showClashPins = this.showClashPins;
    const btn = document.getElementById("btn-minimap-pins-toggle");
    if (btn) {
      btn.classList.toggle("active", this.showClashPins);
    }
    return this.showClashPins;
  }

  public setSelectedElement(pos: THREE.Vector3 | { x: number; y: number; z: number } | null, expressId?: number) {
    if (pos) {
      this.selectedElementPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      this.selectedExpressId = expressId ?? null;
    } else {
      this.selectedElementPos = null;
      this.selectedExpressId = null;
    }
  }

  /**
   * Recalculates aggregate model bounding box across all loaded IFC models and scene meshes
   */
  public updateModelBounds() {
    this.modelBounds.makeEmpty();
    this.meshFootprints = [];
    this.hasModel = false;

    // 1. Query ThatOpen OBC.BoundingBoxer first for exact fragment bounds
    try {
      const boxer = this.engine.components?.get(OBC.BoundingBoxer);
      if (boxer && this.engine.fragments && this.engine.fragments.list.size > 0) {
        boxer.list.clear();
        boxer.addFromModels();
        const bbox = boxer.get();
        if (bbox && !bbox.isEmpty()) {
          this.modelBounds.union(bbox);
          this.hasModel = true;
        }
        boxer.list.clear();
      }
    } catch (e) {}

    // 2. Scan ThatOpen Fragments Manager & Three.js Scene objects for 2D slice footprints
    if (this.engine.fragments && this.engine.fragments.list) {
      for (const [, model] of this.engine.fragments.list) {
        if (model) {
          const modelObj = (model.object || model) as THREE.Object3D;
          if (modelObj && typeof modelObj.traverse === "function") {
            this.modelBounds.expandByObject(modelObj);
            this.hasModel = true;
            modelObj.traverse((child) => {
              if (child instanceof THREE.Mesh && this.meshFootprints.length < 240) {
                const box = new THREE.Box3().setFromObject(child);
                if (!box.isEmpty()) {
                  this.meshFootprints.push({
                    minX: box.min.x,
                    minZ: box.min.z,
                    maxX: box.max.x,
                    maxZ: box.max.z,
                    minY: box.min.y,
                    maxY: box.max.y,
                  });
                }
              }
            });
          }
        }
      }
    }

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
          if (this.meshFootprints.length < 240) {
            const box = new THREE.Box3().setFromObject(obj);
            if (!box.isEmpty()) {
              this.meshFootprints.push({
                minX: box.min.x,
                minZ: box.min.z,
                maxX: box.max.x,
                maxZ: box.max.z,
                minY: box.min.y,
                maxY: box.max.y,
              });
            }
          }
        }
      });
    }

    if (this.hasModel && !this.modelBounds.isEmpty()) {
      this.modelBounds.getCenter(this.modelCenter);
      this.modelBounds.getSize(this.modelSize);

      if (this.config.zoom === 8) {
        const maxDim = Math.max(this.modelSize.x, this.modelSize.z, 5);
        this.config.zoom = (this.config.size * 0.65) / maxDim;
      }
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
    const centerX = this.config.size / 2 + this.panOffset.x;
    const centerY = this.config.size / 2 + this.panOffset.y;
    const scale = this.config.zoom;
    const originX = this.hasModel ? this.modelCenter.x : 0;
    const originZ = this.hasModel ? this.modelCenter.z : 0;

    return {
      x: centerX + (worldX - originX) * scale,
      y: centerY + (worldZ - originZ) * scale,
    };
  }

  public minimapToWorld(pixelX: number, pixelY: number): { x: number; z: number } {
    const centerX = this.config.size / 2 + this.panOffset.x;
    const centerY = this.config.size / 2 + this.panOffset.y;
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

    const getCanvasCoords = (e: MouseEvent | PointerEvent) => {
      const rect = this.canvas!.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / (rect.width || this.config.size)) * this.config.size;
      const clickY = ((e.clientY - rect.top) / (rect.height || this.config.size)) * this.config.size;
      return { x: clickX, y: clickY };
    };

    // Canvas Wheel to Zoom in / Zoom out anchored to pointer
    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const { x: mouseX, y: mouseY } = getCanvasCoords(e);
      const worldBefore = this.minimapToWorld(mouseX, mouseY);
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      this.config.zoom = Math.max(0.5, Math.min(60, this.config.zoom * zoomFactor));
      const worldAfter = this.minimapToWorld(mouseX, mouseY);

      this.panOffset.x += (worldAfter.x - worldBefore.x) * this.config.zoom;
      this.panOffset.y += (worldAfter.z - worldBefore.z) * this.config.zoom;
    }, { passive: false });

    // Prevent default context menu on right click for panning
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    this.canvas.addEventListener("pointerdown", (e) => {
      if (!this.canvas) return;
      const { x: clickX, y: clickY } = getCanvasCoords(e);

      // 1. Right click or Shift+Click = Pan Map
      if (e.button === 2 || e.button === 1 || e.shiftKey) {
        this.isPanning = true;
        this.lastPanPointer = { x: e.clientX, y: e.clientY };
        return;
      }

      // 2. Check if clicking near avatar to rotate vision gaze
      const cam = this.engine.world?.camera?.three;
      if (cam) {
        const rawMapPos = this.worldToMinimap(cam.position.x, cam.position.z);
        const distToAvatar = Math.hypot(clickX - rawMapPos.x, clickY - rawMapPos.y);
        if (distToAvatar < 18) {
          this.isRotatingGaze = true;
          return;
        }
      }

      // 3. Check if clicking on an active clash pin
      if (this.showClashPins) {
        const clashes = ClashDetector.getInstance().getClashes();
        const activeElev = this.config.levels[this.config.currentLevelIndex]?.elevation ?? 0;
        for (const clash of clashes) {
          if (Math.abs(clash.intersectionPoint[1] - activeElev) < 3.5) {
            const p = this.worldToMinimap(clash.intersectionPoint[0], clash.intersectionPoint[2]);
            if (Math.hypot(clickX - p.x, clickY - p.y) < 12) {
              this.teleportToWorldCoordinates(clash.intersectionPoint[0], clash.intersectionPoint[2]);
              return;
            }
          }
        }
      }

      // 4. Default: Left click = Teleport / Drag Navigate
      this.isDraggingMinimap = true;
      const worldPos = this.minimapToWorld(clickX, clickY);
      this.teleportToWorldCoordinates(worldPos.x, worldPos.z);
    });

    this.canvas.addEventListener("pointermove", (e) => {
      if (!this.canvas) return;
      const { x: clickX, y: clickY } = getCanvasCoords(e);
      this.hoverPixel = { x: clickX, y: clickY };

      // Update Live Metric Coordinates Readout Pill
      const worldPos = this.minimapToWorld(clickX, clickY);
      const coordsBadge = document.getElementById("minimap-coords-badge");
      const coordsText = document.getElementById("minimap-coords-text");
      const coordsDist = document.getElementById("minimap-coords-dist");
      if (coordsBadge && coordsText && coordsDist) {
        coordsBadge.style.display = "flex";
        coordsText.innerText = `X:${worldPos.x >= 0 ? "+" : ""}${worldPos.x.toFixed(1)}m Z:${worldPos.z >= 0 ? "+" : ""}${worldPos.z.toFixed(1)}m`;
        const cam = this.engine.world?.camera?.three;
        if (cam) {
          const dist = Math.hypot(worldPos.x - cam.position.x, worldPos.z - cam.position.z);
          coordsDist.innerText = `${dist.toFixed(1)}m`;
        }
      }

      // Handle Pan Dragging
      if (this.isPanning) {
        const dx = e.clientX - this.lastPanPointer.x;
        const dy = e.clientY - this.lastPanPointer.y;
        this.panOffset.x += dx;
        this.panOffset.y += dy;
        this.lastPanPointer = { x: e.clientX, y: e.clientY };
        return;
      }

      // Handle Vision Cone Rotation Dragging
      if (this.isRotatingGaze) {
        const cam = this.engine.world?.camera;
        if (cam && cam.controls && cam.three) {
          const rawMapPos = this.worldToMinimap(cam.three.position.x, cam.three.position.z);
          const angle = Math.atan2(clickX - rawMapPos.x, -(clickY - rawMapPos.y));
          const targetDist = 12;
          const targetX = cam.three.position.x + Math.sin(angle) * targetDist;
          const targetZ = cam.three.position.z - Math.cos(angle) * targetDist;
          cam.controls.setLookAt(
            cam.three.position.x,
            cam.three.position.y,
            cam.three.position.z,
            targetX,
            cam.three.position.y,
            targetZ,
            false
          );
        }
        return;
      }

      // Handle Continuous Teleport Dragging
      if (this.isDraggingMinimap) {
        this.teleportToWorldCoordinates(worldPos.x, worldPos.z);
      }
    });

    this.canvas.addEventListener("pointerleave", () => {
      this.hoverPixel = null;
      const coordsBadge = document.getElementById("minimap-coords-badge");
      if (coordsBadge) coordsBadge.style.display = "none";
    });

    window.addEventListener("pointerup", () => {
      this.isDraggingMinimap = false;
      this.isRotatingGaze = false;
      this.isPanning = false;
    });

    window.addEventListener("pointercancel", () => {
      this.isDraggingMinimap = false;
      this.isRotatingGaze = false;
      this.isPanning = false;
    });
  }

  private bindHeaderControls() {
    document.getElementById("btn-minimap-north")?.addEventListener("click", () => {
      this.faceNorth();
    });

    document.getElementById("btn-minimap-zoom-in")?.addEventListener("click", () => {
      this.zoomIn();
    });

    document.getElementById("btn-minimap-zoom-out")?.addEventListener("click", () => {
      this.zoomOut();
    });

    document.getElementById("btn-minimap-fit")?.addEventListener("click", () => {
      this.resetView();
    });

    document.getElementById("btn-minimap-autolevel")?.addEventListener("click", () => {
      this.toggleAutoTrackLevel();
    });

    document.getElementById("btn-minimap-expand")?.addEventListener("click", () => {
      this.toggleExpanded();
    });

    document.getElementById("btn-minimap-pins-toggle")?.addEventListener("click", () => {
      this.toggleClashPins();
    });
  }

  public draw() {
    if (!this.ctx || !this.canvas || !this.isVisible) return;

    this.updateModelBounds();

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const center = w / 2;

    // 0. Auto-track camera elevation to match floor storey
    const cam = this.engine.world?.camera?.three;
    let camPos = new THREE.Vector3(0, 0, 0);
    let camHeading = 0;

    if (cam) {
      camPos.copy(cam.position);
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
      camHeading = Math.atan2(forward.x, forward.z);

      if (this.isAutoTrackLevel && this.config.levels.length > 0) {
        let matchedIdx = 0;
        let minDiff = Infinity;
        for (let i = 0; i < this.config.levels.length; i++) {
          const elev = this.config.levels[i].elevation;
          const nextElev = i < this.config.levels.length - 1 ? this.config.levels[i + 1].elevation : elev + 4.0;
          if (camPos.y >= elev - 0.5 && camPos.y < nextElev) {
            matchedIdx = i;
            break;
          }
          const diff = Math.abs(camPos.y - elev);
          if (diff < minDiff) {
            minDiff = diff;
            matchedIdx = i;
          }
        }
        if (matchedIdx !== this.config.currentLevelIndex) {
          this.config.currentLevelIndex = matchedIdx;
          const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
          if (select) select.value = String(matchedIdx);
          this.updateUI();
        }
      }
    }

    // Clear background (Deep sleek architectural slate)
    ctx.fillStyle = "rgba(10, 12, 18, 0.95)";
    ctx.fillRect(0, 0, w, h);

    // 1. Draw Architectural Metric Radar Grid
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;

    const step = 20;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Outer metric radar range rings
    ctx.strokeStyle = "rgba(212, 255, 63, 0.18)";
    ctx.beginPath();
    ctx.arc(center, center, w * 0.44, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
    ctx.beginPath();
    ctx.arc(center, center, w * 0.26, 0, Math.PI * 2);
    ctx.stroke();

    // Cardinal Points on Radar Perimeter (N, S, E, W)
    ctx.font = "800 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // North Marker (Red Accent)
    ctx.fillStyle = "#ef4444";
    ctx.fillText("N", center, 10);
    ctx.beginPath();
    ctx.moveTo(center, 15);
    ctx.lineTo(center - 3, 20);
    ctx.lineTo(center + 3, 20);
    ctx.closePath();
    ctx.fill();

    // South, East, West Markers
    ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
    ctx.fillText("S", center, h - 8);
    ctx.fillText("E", w - 8, center);
    ctx.fillText("W", 8, center);

    // 2. Draw Loaded BIM Model Footprints & Slabs
    const minPt = this.hasModel && !this.modelBounds.isEmpty()
      ? this.worldToMinimap(this.modelBounds.min.x, this.modelBounds.min.z)
      : { x: w * 0.22, y: h * 0.25 };
    const maxPt = this.hasModel && !this.modelBounds.isEmpty()
      ? this.worldToMinimap(this.modelBounds.max.x, this.modelBounds.max.z)
      : { x: w * 0.78, y: h * 0.75 };

    const footX = Math.min(minPt.x, maxPt.x);
    const footY = Math.min(minPt.y, maxPt.y);
    const footW = Math.abs(maxPt.x - minPt.x);
    const footH = Math.abs(maxPt.y - minPt.y);

    // A. Building Footprint Glow Fill
    ctx.fillStyle = this.hasModel ? "rgba(56, 189, 248, 0.14)" : "rgba(56, 189, 248, 0.07)";
    ctx.fillRect(footX, footY, footW, footH);

    // B. Individual Mesh Footprints at Active Storey Level
    if (this.meshFootprints.length > 0) {
      const activeElev = this.config.levels[this.config.currentLevelIndex]?.elevation ?? 0;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.42)";
      ctx.fillStyle = "rgba(56, 189, 248, 0.12)";
      ctx.lineWidth = 0.8;
      for (const fp of this.meshFootprints) {
        if (fp.maxY >= activeElev - 1.0 && fp.minY <= activeElev + 4.5) {
          const pA = this.worldToMinimap(fp.minX, fp.minZ);
          const pB = this.worldToMinimap(fp.maxX, fp.maxZ);
          const rx = Math.min(pA.x, pB.x);
          const ry = Math.min(pA.y, pB.y);
          const rw = Math.max(1.5, Math.abs(pB.x - pA.x));
          const rh = Math.max(1.5, Math.abs(pB.y - pA.y));
          ctx.fillRect(rx, ry, rw, rh);
          ctx.strokeRect(rx, ry, rw, rh);
        }
      }
    }

    // C. Structural Outer Perimeter
    ctx.strokeStyle = this.hasModel ? "#38BDF8" : "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(footX, footY, footW, footH);

    // D. Internal Storey Grid Partitioning
    ctx.strokeStyle = "rgba(212, 255, 63, 0.22)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(footX + footW * 0.33, footY);
    ctx.lineTo(footX + footW * 0.33, footY + footH);
    ctx.moveTo(footX + footW * 0.66, footY);
    ctx.lineTo(footX + footW * 0.66, footY + footH);
    ctx.moveTo(footX, footY + footH * 0.5);
    ctx.lineTo(footX + footW, footY + footH * 0.5);
    ctx.stroke();

    // E. Corner Structural Pillars
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

    // 3. Draw Active Multi-Discipline Clash Pins
    if (this.showClashPins) {
      try {
        const clashes = ClashDetector.getInstance().getClashes();
        const activeElev = this.config.levels[this.config.currentLevelIndex]?.elevation ?? 0;
        for (const clash of clashes) {
          if (Math.abs(clash.intersectionPoint[1] - activeElev) < 3.5) {
            const cp = this.worldToMinimap(clash.intersectionPoint[0], clash.intersectionPoint[2]);
            const isCritical = clash.severity === "critical";

            // Warning Halo Pulse
            ctx.fillStyle = isCritical ? "rgba(239, 68, 68, 0.35)" : "rgba(245, 158, 11, 0.35)";
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 7, 0, Math.PI * 2);
            ctx.fill();

            // Diamond Center
            ctx.fillStyle = isCritical ? "#ef4444" : "#f59e0b";
            ctx.beginPath();
            ctx.moveTo(cp.x, cp.y - 4);
            ctx.lineTo(cp.x + 4, cp.y);
            ctx.lineTo(cp.x, cp.y + 4);
            ctx.lineTo(cp.x - 4, cp.y);
            ctx.closePath();
            ctx.fill();
          }
        }
      } catch (e) {}
    }

    // 4. Draw Selected Element Crosshair Reticle
    if (this.selectedElementPos) {
      const sp = this.worldToMinimap(this.selectedElementPos.x, this.selectedElementPos.z);
      const now = performance.now() * 0.004;
      const pulse = 8 + Math.sin(now) * 2;

      // Pulsing outer ring
      ctx.strokeStyle = "#38BDF8";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, pulse, 0, Math.PI * 2);
      ctx.stroke();

      // Corner crosshair brackets
      ctx.strokeStyle = "#D4FF3F";
      ctx.lineWidth = 1.2;
      const bracketSize = 6;
      // Top-left
      ctx.beginPath();
      ctx.moveTo(sp.x - bracketSize, sp.y - bracketSize + 3);
      ctx.lineTo(sp.x - bracketSize, sp.y - bracketSize);
      ctx.lineTo(sp.x - bracketSize + 3, sp.y - bracketSize);
      // Top-right
      ctx.moveTo(sp.x + bracketSize - 3, sp.y - bracketSize);
      ctx.lineTo(sp.x + bracketSize, sp.y - bracketSize);
      ctx.lineTo(sp.x + bracketSize, sp.y - bracketSize + 3);
      // Bottom-left
      ctx.moveTo(sp.x - bracketSize, sp.y + bracketSize - 3);
      ctx.lineTo(sp.x - bracketSize, sp.y + bracketSize);
      ctx.lineTo(sp.x - bracketSize + 3, sp.y + bracketSize);
      // Bottom-right
      ctx.moveTo(sp.x + bracketSize - 3, sp.y + bracketSize);
      ctx.lineTo(sp.x + bracketSize, sp.y + bracketSize);
      ctx.lineTo(sp.x + bracketSize, sp.y + bracketSize - 3);
      ctx.stroke();

      // Element Tag
      if (this.selectedExpressId) {
        ctx.font = "700 7px monospace";
        ctx.fillStyle = "#38BDF8";
        ctx.fillText(`#${this.selectedExpressId}`, sp.x, sp.y + bracketSize + 6);
      }
    }

    // 5. Draw Camera Field of View Frustum Cone & Avatar
    const rawMapPos = this.worldToMinimap(camPos.x, camPos.z);
    const margin = 14;
    const playerMapPos = {
      x: Math.max(margin, Math.min(w - margin, rawMapPos.x)),
      y: Math.max(margin, Math.min(h - margin, rawMapPos.y)),
    };

    const fovAngle = Math.PI / 3; // 60 degrees
    const coneRadius = 34;

    // Gradient Vision Cone
    const grad = ctx.createRadialGradient(playerMapPos.x, playerMapPos.y, 2, playerMapPos.x, playerMapPos.y, coneRadius);
    grad.addColorStop(0, "rgba(212, 255, 63, 0.4)");
    grad.addColorStop(1, "rgba(212, 255, 63, 0.04)");

    ctx.fillStyle = grad;
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

    // Frustum Side Guide Rays
    ctx.strokeStyle = "rgba(212, 255, 63, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.lineTo(
      playerMapPos.x + Math.cos(camHeading - fovAngle / 2 - Math.PI / 2) * coneRadius,
      playerMapPos.y + Math.sin(camHeading - fovAngle / 2 - Math.PI / 2) * coneRadius
    );
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.lineTo(
      playerMapPos.x + Math.cos(camHeading + fovAngle / 2 - Math.PI / 2) * coneRadius,
      playerMapPos.y + Math.sin(camHeading + fovAngle / 2 - Math.PI / 2) * coneRadius
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Player / Camera Avatar Dot
    ctx.fillStyle = "#D4FF3F";
    ctx.shadowColor = "#D4FF3F";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(playerMapPos.x, playerMapPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Directional View Arrow
    const headingLength = 13;
    const endX = playerMapPos.x + Math.sin(camHeading) * headingLength;
    const endY = playerMapPos.y - Math.cos(camHeading) * headingLength;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 6. Draw Live Crosshair when Mouse Hovers Over Radar
    if (this.hoverPixel) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      // Horizontal
      ctx.moveTo(0, this.hoverPixel.y);
      ctx.lineTo(w, this.hoverPixel.y);
      // Vertical
      ctx.moveTo(this.hoverPixel.x, 0);
      ctx.lineTo(this.hoverPixel.x, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "#38BDF8";
      ctx.beginPath();
      ctx.arc(this.hoverPixel.x, this.hoverPixel.y, 3, 0, Math.PI * 2);
      ctx.stroke();
    }
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
