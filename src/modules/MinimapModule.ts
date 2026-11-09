import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";
import { ClashDetector } from "./ClashDetector";
import { StoreyLevelSlicer } from "./StoreyLevelSlicer";
import { GeoEngineeringSuite } from "./GeoEngineeringSuite";

export interface MinimapConfig {
  size: number;
  zoom: number;
  currentLevelIndex: number;
  levels: { name: string; elevation: number }[];
  isWalkModeActive: boolean;
  autoTrackLevel?: boolean;
  showClashPins?: boolean;
  isExpanded?: boolean;
  headingUp?: boolean;
}

export interface BreadcrumbNode {
  x: number;
  z: number;
  time: number;
}

export interface RoomZone {
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  area: number;
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
  private userLevelOverrideUntil: number = 0;
  private showClashPins: boolean = true;
  private isExpanded: boolean = false;
  private autoSyncCamera: boolean = true;

  // Advanced 2D Radar Enhancements
  public isHeadingUp: boolean = false;
  private breadcrumbs: BreadcrumbNode[] = [];
  private lastBreadcrumbTime: number = 0;
  private roomZones: RoomZone[] = [];

  // Measurement tool state on 2D radar (Shift + Click/Drag or Double-Click)
  private isMeasuring: boolean = false;
  private measureStart: { x: number; z: number } | null = null;
  private measureEnd: { x: number; z: number } | null = null;

  private config: MinimapConfig = {
    size: 280,
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
    headingUp: false,
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

    (window as any).viewer_minimap = this;
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
    if (this.canvas) {
      const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
      this.canvas.width = Math.round(this.config.size * dpr);
      this.canvas.height = Math.round(this.config.size * dpr);
      this.canvas.style.width = "100%";
      this.canvas.style.height = "auto";
      this.canvas.style.aspectRatio = "1 / 1";
      this.ctx = this.canvas.getContext("2d");
      this.bindEvents();
      this.bindHeaderControls();
      this.initSizeObserver();
      this.startRenderLoop();
    }
  }

  public toggleVisibility(visible?: boolean): boolean {
    this.isVisible = visible !== undefined ? visible : !this.isVisible;
    const container = document.getElementById("minimap-container");
    if (container) {
      container.classList.toggle("hidden", !this.isVisible);
      if (typeof document !== "undefined") {
        const radarW = !this.isVisible ? "0px" : `${container.offsetWidth || 210}px`;
        document.documentElement.style.setProperty("--radar-w", radarW);
        document.body.style.setProperty("--radar-w", radarW);
      }
    }
    return this.isVisible;
  }

  private initSizeObserver() {
    if (typeof document === "undefined" || typeof ResizeObserver === "undefined") return;
    const container = document.getElementById("minimap-container");
    if (!container) return;
    try {
      const ro = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const isHidden = container.classList.contains("hidden") || container.style.display === "none";
          const width = isHidden ? 0 : Math.round(entry.borderBoxSize?.[0]?.inlineSize || entry.contentRect.width || container.offsetWidth);
          if (width > 0) {
            const wPx = `${width}px`;
            document.documentElement.style.setProperty("--radar-w", wPx);
            document.body.style.setProperty("--radar-w", wPx);
          }
        }
      });
      ro.observe(container);
    } catch (e) {}
  }

  public toggleHeadingUp(enable?: boolean): boolean {
    this.isHeadingUp = enable !== undefined ? enable : !this.isHeadingUp;
    this.config.headingUp = this.isHeadingUp;
    const label = document.getElementById("label-minimap-heading");
    if (label) {
      label.innerText = this.isHeadingUp ? "H-UP" : "N-UP";
    }
    const btn = document.getElementById("btn-minimap-heading-mode");
    if (btn) {
      btn.classList.toggle("active", this.isHeadingUp);
    }
    return this.isHeadingUp;
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
      const label = document.getElementById("label-minimap-walk-mode");
      if (label) {
        label.innerText = this.isWalkMode ? "Walk Mode" : "Orbit Mode";
      } else {
        walkBtn.innerText = this.isWalkMode ? "Walk Mode" : "Orbit Mode";
      }
    }

    return this.isWalkMode;
  }

  public setLevel(index: number) {
    if (index >= 0 && index < this.config.levels.length) {
      this.config.currentLevelIndex = index;
      this.userLevelOverrideUntil = Date.now() + 8000;
      this.generateContextualRoomZones(this.config.levels[index].name);
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
      }
    } catch (e) {}
  }

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
    this.autoSyncCamera = false;
    this.config.zoom = Math.min(50, this.config.zoom * 1.25);
  }

  public zoomOut() {
    this.autoSyncCamera = false;
    this.config.zoom = Math.max(0.5, this.config.zoom / 1.25);
  }

  public resetView() {
    this.autoSyncCamera = true;
    this.panOffset = { x: 0, y: 0 };
    if (this.hasModel && !this.modelBounds.isEmpty()) {
      const maxDim = Math.max(this.modelSize.x, this.modelSize.z, 5);
      this.config.zoom = (this.config.size * 0.65) / maxDim;
    } else {
      this.config.zoom = 8;
    }
  }

  public isCameraSyncEnabled(): boolean {
    return this.autoSyncCamera;
  }

  public setAutoSyncCamera(enable: boolean) {
    this.autoSyncCamera = enable;
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
    const newSize = this.isExpanded ? 380 : 280;
    this.setSize(newSize);
    return this.isExpanded;
  }

  public setSize(size: number, saveToStorage: boolean = true) {
    const clampedSize = Math.max(140, Math.min(520, size));
    this.config.size = clampedSize;
    if (this.canvas) {
      const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
      this.canvas.width = Math.round(clampedSize * dpr);
      this.canvas.height = Math.round(clampedSize * dpr);
      this.canvas.style.width = "100%";
      this.canvas.style.height = "auto";
      this.canvas.style.aspectRatio = "1 / 1";
    }
    const container = document.getElementById("minimap-container");
    if (container) {
      const radarW = `${clampedSize + 20}px`;
      container.style.setProperty("--radar-w", radarW);
      container.style.width = radarW;
      if (typeof document !== "undefined") {
        document.documentElement.style.setProperty("--radar-w", radarW);
        document.body.style.setProperty("--radar-w", radarW);
      }
    }
    if (saveToStorage && typeof localStorage !== "undefined") {
      try {
        localStorage.setItem("bim_minimap_custom_size", String(clampedSize));
      } catch (e) {}
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

  public exportPlanImage(filename: string = "BIM-Kintsugi-FloorPlan-2D.png") {
    if (!this.canvas) return;
    try {
      const dataUrl = this.canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.warn("Failed to export minimap image:", e);
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

    // 2. Scan ThatOpen Fragments Manager for 2D slice footprints (only when IFC fragments loaded)
    const fragmentsList = this.engine.fragments?.list;
    if (fragmentsList && fragmentsList.size > 0) {
      for (const [, model] of fragmentsList) {
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

    if (this.hasModel && !this.modelBounds.isEmpty()) {
      this.modelBounds.getCenter(this.modelCenter);
      this.modelBounds.getSize(this.modelSize);

      if (this.config.zoom === 8) {
        const maxDim = Math.max(this.modelSize.x, this.modelSize.z, 5);
        this.config.zoom = (this.config.size * 0.65) / maxDim;
      }

      // Generate contextual room zones if not populated
      if (this.roomZones.length === 0 && this.modelSize.x > 2 && this.modelSize.z > 2) {
        this.generateContextualRoomZones();
      }
    }
  }

  /**
   * Room zone helper kept for backwards-compatibility;
   * avoids generating fake procedural mock rooms to keep floor plan clean and functional.
   */
  public generateContextualRoomZones(_storeyName?: string): void {
    this.roomZones = [];
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
      this.autoSyncCamera = false;
      const { x: mouseX, y: mouseY } = getCanvasCoords(e);
      const worldBefore = this.minimapToWorld(mouseX, mouseY);
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      this.config.zoom = Math.max(0.5, Math.min(60, this.config.zoom * zoomFactor));
      const worldAfter = this.minimapToWorld(mouseX, mouseY);

      this.panOffset.x += (worldAfter.x - worldBefore.x) * this.config.zoom;
      this.panOffset.y += (worldAfter.z - worldBefore.z) * this.config.zoom;
    }, { passive: false });

    // Double click to re-align view and resume camera sync
    this.canvas.addEventListener("dblclick", () => {
      this.resetView();
    });

    this.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault(); // allow right-drag for pan or measure
    });

    this.canvas.addEventListener("pointerdown", (e) => {
      const { x: clickX, y: clickY } = getCanvasCoords(e);

      // Check if Shift + Left Click is pressed: Start Radar Measurement
      if (e.shiftKey && e.button === 0) {
        this.isMeasuring = true;
        const wPos = this.minimapToWorld(clickX, clickY);
        this.measureStart = { x: wPos.x, z: wPos.z };
        this.measureEnd = { x: wPos.x, z: wPos.z };
        return;
      }

      // 1. Check if right-click or middle-click: Start Pan
      if (e.button === 2 || e.button === 1) {
        this.isPanning = true;
        this.autoSyncCamera = false;
        this.lastPanPointer = { x: e.clientX, y: e.clientY };
        return;
      }

      if (e.button !== 0) return;

      // 2. Check if clicking on avatar cone to rotate gaze
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

      const worldPos = this.minimapToWorld(clickX, clickY);

      // Handle Measurement Dragging
      if (this.isMeasuring && this.measureStart) {
        this.measureEnd = { x: worldPos.x, z: worldPos.z };
        const dist = Math.hypot(this.measureEnd.x - this.measureStart.x, this.measureEnd.z - this.measureStart.z);
        const coordsBadge = document.getElementById("minimap-coords-badge");
        const coordsText = document.getElementById("minimap-coords-text");
        const coordsDist = document.getElementById("minimap-coords-dist");
        if (coordsBadge && coordsText && coordsDist) {
          coordsBadge.style.display = "flex";
          coordsText.innerText = `Measure: ${dist.toFixed(2)}m`;
          coordsDist.innerText = `ΔX:${Math.abs(this.measureEnd.x - this.measureStart.x).toFixed(1)}m ΔZ:${Math.abs(this.measureEnd.z - this.measureStart.z).toFixed(1)}m`;
        }
        return;
      }

      // Update Live Metric Coordinates Readout Pill
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
          const dx = clickX - rawMapPos.x;
          const dy = clickY - rawMapPos.y;
          const dist = Math.hypot(dx, dy) || 1;
          const targetDist = 12;
          const targetX = cam.three.position.x + (dx / dist) * targetDist;
          const targetZ = cam.three.position.z + (dy / dist) * targetDist;
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
      if (!this.isMeasuring) {
        const coordsBadge = document.getElementById("minimap-coords-badge");
        if (coordsBadge) coordsBadge.style.display = "none";
      }
    });

    const endDrag = () => {
      this.isDraggingMinimap = false;
      this.isRotatingGaze = false;
      this.isPanning = false;
      if (this.isMeasuring) {
        // Keep measurement visible for 3 seconds
        setTimeout(() => {
          this.isMeasuring = false;
          this.measureStart = null;
          this.measureEnd = null;
        }, 3500);
      }
    };

    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
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

    document.getElementById("btn-minimap-heading-mode")?.addEventListener("click", () => {
      this.toggleHeadingUp();
    });

    document.getElementById("btn-minimap-export")?.addEventListener("click", () => {
      this.exportPlanImage();
    });

    document.getElementById("btn-minimap-expand")?.addEventListener("click", () => {
      this.toggleExpanded();
    });

    document.getElementById("btn-minimap-pins-toggle")?.addEventListener("click", () => {
      this.toggleClashPins();
    });

    this.bindResizeHandle();
  }

  private bindResizeHandle() {
    const handle = document.getElementById("minimap-resize-handle");
    const container = document.getElementById("minimap-container");
    if (!handle || !container) return;

    let isResizing = false;
    let startX = 0;
    let startWidth = 0;

    // Restore saved custom size if present
    try {
      const saved = localStorage.getItem("bim_minimap_custom_size");
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 140 && parsed <= 520) {
          this.setSize(parsed, false);
        }
      }
    } catch (e) {}

    handle.addEventListener("pointerdown", (e: PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isResizing = true;
      startX = e.clientX;
      startWidth = container.offsetWidth;
      handle.setPointerCapture(e.pointerId);
      document.body.classList.add("resizing-radar");
    });

    const onPointerMove = (e: PointerEvent) => {
      if (!isResizing) return;
      // Because container is bottom-right anchored, dragging left (negative deltaX) increases width
      const deltaX = startX - e.clientX;
      const targetContainerWidth = startWidth + deltaX;
      const targetCanvasSize = THREE.MathUtils.clamp(targetContainerWidth - 20, 140, 520);
      this.setSize(targetCanvasSize, true);
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!isResizing) return;
      isResizing = false;
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch (err) {}
      document.body.classList.remove("resizing-radar");
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }

  public draw() {
    if (!this.ctx || !this.canvas || !this.isVisible) return;

    this.updateModelBounds();

    const ctx = this.ctx;
    const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
    const displaySize = this.config.size;
    const targetBuffer = Math.round(displaySize * dpr);

    if (this.canvas.width !== targetBuffer || this.canvas.height !== targetBuffer) {
      this.canvas.width = targetBuffer;
      this.canvas.height = targetBuffer;
      this.canvas.style.width = `${displaySize}px`;
      this.canvas.style.height = `${displaySize}px`;
    }

    const w = displaySize;
    const h = displaySize;
    const center = displaySize / 2;

    ctx.save();
    ctx.scale(dpr, dpr);

    // 0. Query 3D camera position, forward orientation, orbit target & distance
    const cam = this.engine.world?.camera?.three;
    let camPos = new THREE.Vector3(0, 0, 0);
    const forward = new THREE.Vector3(0, 0, -1);
    const target = new THREE.Vector3(0, 0, 0);
    let camDist = 20;

    if (cam) {
      camPos.copy(cam.position);
      cam.getWorldDirection(forward);

      const controls = (this.engine.world?.camera as any)?.controls;
      if (controls && typeof controls.getTarget === "function") {
        controls.getTarget(target);
        camDist = camPos.distanceTo(target) || 20;
      } else {
        target.copy(camPos).addScaledVector(forward, 15);
      }

      // Record Walk Breadcrumb Trail
      const now = performance.now();
      if (now - this.lastBreadcrumbTime > 800) {
        this.lastBreadcrumbTime = now;
        this.breadcrumbs.push({ x: camPos.x, z: camPos.z, time: now });
        if (this.breadcrumbs.length > 50) this.breadcrumbs.shift();
      }

      // Synchronize 2D Radar zoom continuously with 3D workspace camera distance & focal span
      if (this.autoSyncCamera && !this.isPanning) {
        let targetZoom: number;
        if (cam && (cam as any).isOrthographicCamera) {
          const orthoZoom = (cam as any).zoom || 1.0;
          targetZoom = orthoZoom * 2.5;
        } else {
          // Perspective camera: calculate visible ground/focal extent in workspace
          const fovRad = THREE.MathUtils.degToRad((cam as THREE.PerspectiveCamera)?.fov || 55);
          // Effective visible half-span at camera target plane
          const visibleHalfSpan = Math.max(1.5, camDist * Math.tan(fovRad / 2));
          // Map viewport half-span to radar half-dimension so radar coverage mirrors workspace field
          targetZoom = (this.config.size * 0.48) / visibleHalfSpan;
        }

        // Clamp to sensible range [0.5, 60] and lerp smoothly at 60fps
        const clampedZoom = THREE.MathUtils.clamp(targetZoom, 0.5, 60);
        this.config.zoom += (clampedZoom - this.config.zoom) * 0.15;
      }

      // Smooth center tracking when inspecting or in walk mode
      if (this.autoSyncCamera && !this.isPanning) {
        const focalX = this.isWalkMode ? camPos.x : (camPos.x + target.x) / 2;
        const focalZ = this.isWalkMode ? camPos.z : (camPos.z + target.z) / 2;
        const originX = this.hasModel ? this.modelCenter.x : 0;
        const originZ = this.hasModel ? this.modelCenter.z : 0;
        const desiredPanX = -(focalX - originX) * this.config.zoom;
        const desiredPanY = -(focalZ - originZ) * this.config.zoom;
        this.panOffset.x += (desiredPanX - this.panOffset.x) * 0.1;
        this.panOffset.y += (desiredPanY - this.panOffset.y) * 0.1;
      }

      // Live Compass Needle Rotation & Bearing in UI header
      const needle = document.querySelector(".compass-needle") as HTMLElement | null;
      const compassLabel = document.getElementById("minimap-compass-label");
      if (needle || compassLabel) {
        let bearingDeg = Math.round(THREE.MathUtils.radToDeg(Math.atan2(forward.x, -forward.z)));
        if (bearingDeg < 0) bearingDeg += 360;
        if (needle) {
          needle.style.transform = `rotate(${(-bearingDeg).toFixed(1)}deg)`;
        }
        if (compassLabel) {
          const cardinal = bearingDeg >= 337.5 || bearingDeg < 22.5 ? "N"
            : bearingDeg < 67.5 ? "NE"
            : bearingDeg < 112.5 ? "E"
            : bearingDeg < 157.5 ? "SE"
            : bearingDeg < 202.5 ? "S"
            : bearingDeg < 247.5 ? "SW"
            : bearingDeg < 292.5 ? "W" : "NW";
          compassLabel.textContent = `${String(bearingDeg).padStart(3, "0")}° ${cardinal}`;
        }
      }

      // Auto-track camera elevation to match floor storey (unless user recently overrode it manually)
      if (this.isAutoTrackLevel && this.config.levels.length > 0 && Date.now() > this.userLevelOverrideUntil) {
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
          this.generateContextualRoomZones(this.config.levels[matchedIdx]?.name);
          const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
          if (select) select.value = String(matchedIdx);
          this.updateUI();
        }
      }
    }

    // Theme check for architectural canvas rendering
    const isLight = typeof document !== "undefined" && (
      document.documentElement.getAttribute("data-theme") === "light" ||
      document.body.getAttribute("data-theme") === "light"
    );
    const accentRgb = isLight ? "2, 132, 199" : "56, 189, 248";
    const accentColor = isLight ? "#0284C7" : "#38BDF8";

    // Clear background (Deep sleek architectural slate or crisp drafting paper)
    ctx.fillStyle = isLight ? "rgba(248, 250, 252, 0.96)" : "rgba(11, 15, 23, 0.96)";
    ctx.fillRect(0, 0, w, h);

    // Save context for possible Heading-Up Rotation
    ctx.save();
    let cameraHeading = 0;
    if (this.isHeadingUp) {
      cameraHeading = Math.atan2(forward.x, -forward.z); // angle from North
      ctx.translate(center, center);
      ctx.rotate(-cameraHeading);
      ctx.translate(-center, -center);
    }

    // 1. Draw Architectural Drafting Hairline Grid
    ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.04)" : "rgba(255, 255, 255, 0.04)";
    ctx.lineWidth = 1;

    const step = 20;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Subtle Architectural Perimeter Boundary Circle
    ctx.strokeStyle = isLight ? "rgba(2, 132, 199, 0.16)" : "rgba(56, 189, 248, 0.16)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(center, center, w * 0.44, 0, Math.PI * 2);
    ctx.stroke();

    // Subtle Cardinal North Indicator at top
    ctx.fillStyle = "#EF4444";
    ctx.font = "700 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", center, 9);
    ctx.beginPath();
    ctx.moveTo(center, 13);
    ctx.lineTo(center - 2.5, 17);
    ctx.lineTo(center + 2.5, 17);
    ctx.closePath();
    ctx.fill();

    // 2. Draw Solar Sun Vector if Solar study active
    try {
      const suite = GeoEngineeringSuite.getInstance();
      const sun = suite.getSunNow();
      if (sun && sun.elevation > 0) {
        const sunRad = ((sun.azimuth - 90) * Math.PI) / 180;
        const sunDist = w * 0.43;
        const sx = center + Math.cos(sunRad) * sunDist;
        const sy = center + Math.sin(sunRad) * sunDist;
        ctx.fillStyle = "#F59E0B";
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "700 6.5px monospace";
        ctx.fillText("☀", sx, sy - 5);
      }
    } catch (e) {}

    // 3. Draw Real BIM Model Geometry or Drafting Origin State
    if (this.hasModel && !this.modelBounds.isEmpty()) {
      const minPt = this.worldToMinimap(this.modelBounds.min.x, this.modelBounds.min.z);
      const maxPt = this.worldToMinimap(this.modelBounds.max.x, this.modelBounds.max.z);

      const footX = Math.min(minPt.x, maxPt.x);
      const footY = Math.min(minPt.y, maxPt.y);
      const footW = Math.abs(maxPt.x - minPt.x);
      const footH = Math.abs(maxPt.y - minPt.y);

      // Building Footprint Blueprint Wash
      ctx.fillStyle = isLight ? "rgba(2, 132, 199, 0.06)" : "rgba(56, 189, 248, 0.08)";
      ctx.fillRect(footX, footY, footW, footH);

      // Real Mesh Footprints at Active Storey Level (slabs, columns, walls)
      if (this.meshFootprints.length > 0) {
        const activeElev = this.config.levels[this.config.currentLevelIndex]?.elevation ?? 0;
        ctx.strokeStyle = isLight ? "rgba(2, 132, 199, 0.45)" : "rgba(56, 189, 248, 0.45)";
        ctx.fillStyle = isLight ? "rgba(2, 132, 199, 0.12)" : "rgba(56, 189, 248, 0.14)";
        ctx.lineWidth = 0.8;
        for (const fp of this.meshFootprints) {
          if (fp.maxY >= activeElev - 1.0 && fp.minY <= activeElev + 4.5) {
            const pA = this.worldToMinimap(fp.minX, fp.minZ);
            const pB = this.worldToMinimap(fp.maxX, fp.maxZ);
            const rx = Math.min(pA.x, pB.x);
            const ry = Math.min(pA.y, pB.y);
            const rw = Math.max(1, Math.abs(pB.x - pA.x));
            const rh = Math.max(1, Math.abs(pB.y - pA.y));
            ctx.fillRect(rx, ry, rw, rh);
            ctx.strokeRect(rx, ry, rw, rh);
          }
        }
      }

      // Structural Outer Boundary Line
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.2;
      ctx.strokeRect(footX, footY, footW, footH);
    } else {
      // Subtle drafting origin state when no model is loaded
      ctx.strokeStyle = isLight ? "rgba(15, 23, 42, 0.08)" : "rgba(255, 255, 255, 0.08)";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(center - 16, center);
      ctx.lineTo(center + 16, center);
      ctx.moveTo(center, center - 16);
      ctx.lineTo(center, center + 16);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 4. Draw Walkthrough Breadcrumb Trail (Clean translucent dots)
    if (this.breadcrumbs.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < this.breadcrumbs.length; i++) {
        const b = this.breadcrumbs[i];
        const pt = this.worldToMinimap(b.x, b.z);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = `rgba(${accentRgb}, 0.22)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Draw Active Multi-Discipline Clash Pins
    if (this.showClashPins) {
      try {
        const clashes = ClashDetector.getInstance().getClashes();
        const activeElev = this.config.levels[this.config.currentLevelIndex]?.elevation ?? 0;
        for (const clash of clashes) {
          if (Math.abs(clash.intersectionPoint[1] - activeElev) < 3.5) {
            const cp = this.worldToMinimap(clash.intersectionPoint[0], clash.intersectionPoint[2]);
            const isCritical = clash.severity === "critical";

            ctx.fillStyle = isCritical ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)";
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = isCritical ? "#EF4444" : "#F59E0B";
            ctx.beginPath();
            ctx.arc(cp.x, cp.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } catch (e) {}
    }

    // 6. Draw Selected Element Reticle
    if (this.selectedElementPos) {
      const sp = this.worldToMinimap(this.selectedElementPos.x, this.selectedElementPos.z);
      const now = performance.now() * 0.004;
      const pulse = 7 + Math.sin(now) * 1.5;

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, pulse, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = accentColor;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2, 0, Math.PI * 2);
      ctx.fill();

      if (this.selectedExpressId) {
        ctx.font = "700 7px monospace";
        ctx.fillStyle = accentColor;
        ctx.textAlign = "center";
        ctx.fillText(`#${this.selectedExpressId}`, sp.x, sp.y + pulse + 6);
      }
    }

    // 7. Draw 2D Radar Measure Line
    if (this.isMeasuring && this.measureStart && this.measureEnd) {
      const p1 = this.worldToMinimap(this.measureStart.x, this.measureStart.z);
      const p2 = this.worldToMinimap(this.measureEnd.x, this.measureEnd.z);
      ctx.strokeStyle = "#F59E0B";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 2]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 2.5, 0, Math.PI * 2);
      ctx.arc(p2.x, p2.y, 2.5, 0, Math.PI * 2);
      ctx.fill();

      const dist = Math.hypot(this.measureEnd.x - this.measureStart.x, this.measureEnd.z - this.measureStart.z);
      ctx.fillStyle = isLight ? "#0F172A" : "#FFFFFF";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${dist.toFixed(2)}m`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 5);
    }

    // 8. Draw Camera Field of View Frustum Cone, Focal Target & Avatar
    const rawMapPos = this.worldToMinimap(camPos.x, camPos.z);
    const margin = 10;
    const playerMapPos = {
      x: Math.max(margin, Math.min(w - margin, rawMapPos.x)),
      y: Math.max(margin, Math.min(h - margin, rawMapPos.y)),
    };

    const viewAngle = Math.atan2(forward.z, forward.x);
    const fovDegrees = (cam as THREE.PerspectiveCamera)?.fov || 60;
    const fovAngle = THREE.MathUtils.degToRad(fovDegrees);
    const targetPixelDist = camDist * this.config.zoom;
    const coneRadius = THREE.MathUtils.clamp(targetPixelDist, 20, w * 0.65);

    // Subtle Architectural Vision Frustum Cone
    const grad = ctx.createRadialGradient(playerMapPos.x, playerMapPos.y, 2, playerMapPos.x, playerMapPos.y, coneRadius);
    grad.addColorStop(0, `rgba(${accentRgb}, 0.22)`);
    grad.addColorStop(0.65, `rgba(${accentRgb}, 0.05)`);
    grad.addColorStop(1, `rgba(${accentRgb}, 0.0)`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.arc(
      playerMapPos.x,
      playerMapPos.y,
      coneRadius,
      viewAngle - fovAngle / 2,
      viewAngle + fovAngle / 2
    );
    ctx.closePath();
    ctx.fill();

    // Frustum Side Guide Rays
    ctx.strokeStyle = `rgba(${accentRgb}, 0.35)`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.lineTo(
      playerMapPos.x + Math.cos(viewAngle - fovAngle / 2) * coneRadius,
      playerMapPos.y + Math.sin(viewAngle - fovAngle / 2) * coneRadius
    );
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.lineTo(
      playerMapPos.x + Math.cos(viewAngle + fovAngle / 2) * coneRadius,
      playerMapPos.y + Math.sin(viewAngle + fovAngle / 2) * coneRadius
    );
    ctx.stroke();

    // Orbit Focal Target Crosshair
    if (!this.isWalkMode) {
      const rawTargetPos = this.worldToMinimap(target.x, target.z);
      ctx.strokeStyle = `rgba(${accentRgb}, 0.45)`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(rawTargetPos.x, rawTargetPos.y, 2.5, 0, Math.PI * 2);
      ctx.moveTo(rawTargetPos.x - 4, rawTargetPos.y);
      ctx.lineTo(rawTargetPos.x + 4, rawTargetPos.y);
      ctx.moveTo(rawTargetPos.x, rawTargetPos.y - 4);
      ctx.lineTo(rawTargetPos.x, rawTargetPos.y + 4);
      ctx.stroke();
    }

    // Camera Avatar Dot (Crisp white center with accent ring)
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.arc(playerMapPos.x, playerMapPos.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Directional View Heading Tick
    const headingLength = 9;
    const endX = playerMapPos.x + Math.cos(viewAngle) * headingLength;
    const endY = playerMapPos.y + Math.sin(viewAngle) * headingLength;

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(playerMapPos.x + Math.cos(viewAngle) * 3.5, playerMapPos.y + Math.sin(viewAngle) * 3.5);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 9. Draw Live Crosshair when Mouse Hovers Over Radar
    if (this.hoverPixel) {
      ctx.strokeStyle = `rgba(${accentRgb}, 0.3)`;
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, this.hoverPixel.y);
      ctx.lineTo(w, this.hoverPixel.y);
      ctx.moveTo(this.hoverPixel.x, 0);
      ctx.lineTo(this.hoverPixel.x, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = accentColor;
      ctx.beginPath();
      ctx.arc(this.hoverPixel.x, this.hoverPixel.y, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Restore context from Heading-Up rotation
    ctx.restore();
    // Restore context from Hi-DPI scaling
    ctx.restore();
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
