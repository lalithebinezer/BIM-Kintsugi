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
      this.canvas.style.width = `${this.config.size}px`;
      this.canvas.style.height = `${this.config.size}px`;
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
      this.canvas.style.width = `${clampedSize}px`;
      this.canvas.style.height = `${clampedSize}px`;
    }
    const container = document.getElementById("minimap-container");
    if (container) {
      container.style.setProperty("--radar-w", `${clampedSize + 20}px`);
      container.style.width = `${clampedSize + 20}px`;
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

      // Generate contextual room zones if not populated
      if (this.roomZones.length === 0 && this.modelSize.x > 2 && this.modelSize.z > 2) {
        this.generateContextualRoomZones();
      }
    }
  }

  /**
   * Generates contextual zones (structural deck, plant rooms, core, foundations)
   * tailored to the active building storey or structural discipline.
   */
  public generateContextualRoomZones(storeyName?: string): void {
    if (!this.hasModel || this.modelBounds.isEmpty() || this.modelSize.x <= 2 || this.modelSize.z <= 2) {
      return;
    }

    const minX = this.modelBounds.min.x;
    const maxX = this.modelBounds.max.x;
    const minZ = this.modelBounds.min.z;
    const maxZ = this.modelBounds.max.z;
    const totalW = maxX - minX;
    const totalD = maxZ - minZ;

    const activeLvlName = (storeyName || this.config.levels[this.config.currentLevelIndex]?.name || "").toLowerCase();
    this.roomZones = [];

    if (activeLvlName.includes("roof") || activeLvlName.includes("rtos") || activeLvlName.includes("tos")) {
      // Rooftop structural layout: Central Core Overrun, Rooftop MEP & Plant, and Main Roof Slabs
      const coreMinX = minX + totalW * 0.35;
      const coreMaxX = minX + totalW * 0.65;
      const coreMinZ = minZ + totalD * 0.35;
      const coreMaxZ = minZ + totalD * 0.65;

      this.roomZones.push({
        name: "Roof Slab Deck (West)",
        minX: minX,
        maxX: coreMinX,
        minZ: minZ,
        maxZ: maxZ,
        area: Math.round((coreMinX - minX) * totalD),
      });

      this.roomZones.push({
        name: "Lift Core Overrun",
        minX: coreMinX,
        maxX: coreMaxX,
        minZ: coreMinZ,
        maxZ: coreMaxZ,
        area: Math.round((coreMaxX - coreMinX) * (coreMaxZ - coreMinZ)),
      });

      this.roomZones.push({
        name: "Rooftop Plant & MEP",
        minX: coreMinX,
        maxX: maxX,
        minZ: minZ,
        maxZ: coreMinZ,
        area: Math.round((maxX - coreMinX) * (coreMinZ - minZ)),
      });

      this.roomZones.push({
        name: "Roof Slab Deck (East)",
        minX: coreMaxX,
        maxX: maxX,
        minZ: coreMinZ,
        maxZ: maxZ,
        area: Math.round((maxX - coreMaxX) * (maxZ - coreMinZ)),
      });
    } else if (
      activeLvlName.includes("fou") ||
      activeLvlName.includes("footing") ||
      activeLvlName.includes("parking") ||
      activeLvlName.includes("basement") ||
      activeLvlName.includes("sub")
    ) {
      // Substructure & Foundation layout
      const splitX = minX + totalW * 0.5;
      const splitZ = minZ + totalD * 0.5;

      this.roomZones.push({
        name: "Foundation Mat (West)",
        minX: minX,
        maxX: splitX,
        minZ: minZ,
        maxZ: splitZ,
        area: Math.round((splitX - minX) * (splitZ - minZ)),
      });
      this.roomZones.push({
        name: "Substructure Core Vault",
        minX: splitX,
        maxX: maxX,
        minZ: minZ,
        maxZ: splitZ,
        area: Math.round((maxX - splitX) * (splitZ - minZ)),
      });
      this.roomZones.push({
        name: "Parking & Foundation Bay A",
        minX: minX,
        maxX: splitX,
        minZ: splitZ,
        maxZ: maxZ,
        area: Math.round((splitX - minX) * (maxZ - splitZ)),
      });
      this.roomZones.push({
        name: "Parking & Foundation Bay B",
        minX: splitX,
        maxX: maxX,
        minZ: splitZ,
        maxZ: maxZ,
        area: Math.round((maxX - splitX) * (maxZ - splitZ)),
      });
    } else {
      // Standard superstructure / architectural floor plate
      const coreMinX = minX + totalW * 0.35;
      const coreMaxX = minX + totalW * 0.65;
      const splitZ = minZ + totalD * 0.5;

      this.roomZones.push({
        name: "Floor Plate (West)",
        minX: minX,
        maxX: coreMinX,
        minZ: minZ,
        maxZ: maxZ,
        area: Math.round((coreMinX - minX) * totalD),
      });

      this.roomZones.push({
        name: "Central Shear Core",
        minX: coreMinX,
        maxX: coreMaxX,
        minZ: minZ,
        maxZ: splitZ,
        area: Math.round((coreMaxX - coreMinX) * (splitZ - minZ)),
      });

      this.roomZones.push({
        name: "Vertical Circulation & MEP",
        minX: coreMinX,
        maxX: coreMaxX,
        minZ: splitZ,
        maxZ: maxZ,
        area: Math.round((coreMaxX - coreMinX) * (maxZ - splitZ)),
      });

      this.roomZones.push({
        name: "Floor Plate (East)",
        minX: coreMaxX,
        maxX: maxX,
        minZ: minZ,
        maxZ: maxZ,
        area: Math.round((maxX - coreMaxX) * totalD),
      });
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

    // Clear background (Deep sleek architectural slate)
    ctx.fillStyle = "rgba(10, 12, 18, 0.95)";
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

    // 1. Draw Architectural Metric Radar Grid & Coordinate Crosshairs
    ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
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

    // Concentric Metric Range Rings with Dynamic Distance Readouts
    const ringRadii = [w * 0.16, w * 0.30, w * 0.44];
    for (let i = 0; i < ringRadii.length; i++) {
      const r = ringRadii[i];
      ctx.strokeStyle = i === ringRadii.length - 1 ? "rgba(56, 189, 248, 0.24)" : "rgba(255, 255, 255, 0.07)";
      ctx.lineWidth = i === ringRadii.length - 1 ? 1.2 : 0.8;
      ctx.setLineDash(i === 1 ? [3, 3] : []);
      ctx.beginPath();
      ctx.arc(center, center, r, 0, Math.PI * 2);
      ctx.stroke();

      // Metric distance label along 45-degree isometric ray
      if (this.config.zoom > 0) {
        const distMeters = (r / this.config.zoom).toFixed(0);
        ctx.fillStyle = "rgba(148, 163, 184, 0.65)";
        ctx.font = "600 7px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`${distMeters}m`, center + r * 0.707 + 3, center - r * 0.707);
      }
    }
    ctx.setLineDash([]);

    // Subtle Live Tactical Radar Ray Sweep & Radial Gradient Beam
    const sweepTime = performance.now() * 0.0012;
    const sweepAngle = (sweepTime * 1.5) % (Math.PI * 2);
    const sweepRadius = w * 0.44;

    const sweepGrad = ctx.createRadialGradient(center, center, 0, center, center, sweepRadius);
    sweepGrad.addColorStop(0, "rgba(56, 189, 248, 0.12)");
    sweepGrad.addColorStop(0.8, "rgba(56, 189, 248, 0.03)");
    sweepGrad.addColorStop(1, "rgba(56, 189, 248, 0.0)");

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, sweepRadius, sweepAngle - 0.35, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();

    // Leading sweep line
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(center + Math.cos(sweepAngle) * sweepRadius, center + Math.sin(sweepAngle) * sweepRadius);
    ctx.stroke();
    ctx.restore();

    // Cardinal Points on Radar Perimeter (N, S, E, W)
    ctx.font = "800 8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // North Marker (High contrast crimson accent with indicator arrow)
    ctx.fillStyle = "#ef4444";
    ctx.fillText("N", center, 10);
    ctx.beginPath();
    ctx.moveTo(center, 15);
    ctx.lineTo(center - 3.5, 20);
    ctx.lineTo(center + 3.5, 20);
    ctx.closePath();
    ctx.fill();

    // South, East, West Markers
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.fillText("S", center, h - 8);
    ctx.fillText("E", w - 8, center);
    ctx.fillText("W", 8, center);

    // 2. Draw Solar Sun Vector if Solar study active
    try {
      const suite = GeoEngineeringSuite.getInstance();
      const sun = suite.getSunNow();
      if (sun && sun.elevation > 0) {
        // Sun vector on perimeter
        const sunRad = ((sun.azimuth - 90) * Math.PI) / 180;
        const sunDist = w * 0.43;
        const sx = center + Math.cos(sunRad) * sunDist;
        const sy = center + Math.sin(sunRad) * sunDist;
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "700 6.5px monospace";
        ctx.fillText("☀", sx, sy - 6);
      }
    } catch (e) {}

    // 3. Draw Loaded BIM Model Footprints, Room Zones & Slabs
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

    // B. Room / Space Zones Overlays & Labels with Boundary Clipping
    if (this.roomZones.length > 0 && footW > 50 && footH > 50) {
      ctx.font = "600 7px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const room of this.roomZones) {
        const p1 = this.worldToMinimap(room.minX, room.minZ);
        const p2 = this.worldToMinimap(room.maxX, room.maxZ);
        const rx = Math.min(p1.x, p2.x);
        const ry = Math.min(p1.y, p2.y);
        const rw = Math.abs(p2.x - p1.x);
        const rh = Math.abs(p2.y - p1.y);

        ctx.save();
        ctx.beginPath();
        ctx.rect(rx, ry, rw, rh);
        ctx.clip();

        // Zone background tint
        ctx.fillStyle = "rgba(56, 189, 248, 0.05)";
        ctx.fillRect(rx, ry, rw, rh);

        // Zone boundary border
        ctx.strokeStyle = "rgba(56, 189, 248, 0.28)";
        ctx.lineWidth = 0.6;
        ctx.strokeRect(rx, ry, rw, rh);

        if (rw > 32 && rh > 18) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
          let label = room.name;
          if (ctx.measureText(label).width > rw - 6) {
            while (label.length > 4 && ctx.measureText(label + "…").width > rw - 6) {
              label = label.slice(0, -1);
            }
            label += "…";
          }
          ctx.fillText(label, rx + rw / 2, ry + rh / 2 - 4);

          ctx.fillStyle = "rgba(56, 189, 248, 0.75)";
          ctx.fillText(`${room.area.toLocaleString()} m²`, rx + rw / 2, ry + rh / 2 + 5);
        }
        ctx.restore();
      }
    }

    // C. Individual Mesh Footprints at Active Storey Level
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

    // D. Structural Outer Perimeter
    ctx.strokeStyle = this.hasModel ? "#38BDF8" : "rgba(56, 189, 248, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(footX, footY, footW, footH);

    // E. Structural Grid Bubbles & Lines
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

    // Corner Structural Pillars
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

    // 4. Draw Walkthrough Breadcrumb Trail
    if (this.breadcrumbs.length > 1) {
      const now = performance.now();
      ctx.beginPath();
      for (let i = 0; i < this.breadcrumbs.length; i++) {
        const b = this.breadcrumbs[i];
        const pt = this.worldToMinimap(b.x, b.z);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = "rgba(212, 255, 63, 0.25)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([2, 3]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Breadcrumb dots
      for (let i = 0; i < this.breadcrumbs.length; i += 3) {
        const b = this.breadcrumbs[i];
        const pt = this.worldToMinimap(b.x, b.z);
        const ageSec = (now - b.time) / 1000;
        const alpha = Math.max(0.1, 0.6 - ageSec * 0.015);
        ctx.fillStyle = `rgba(212, 255, 63, ${alpha.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
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

    // 6. Draw Selected Element Crosshair Reticle
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
      ctx.beginPath();
      ctx.moveTo(sp.x - bracketSize, sp.y - bracketSize + 3);
      ctx.lineTo(sp.x - bracketSize, sp.y - bracketSize);
      ctx.lineTo(sp.x - bracketSize + 3, sp.y - bracketSize);
      ctx.moveTo(sp.x + bracketSize - 3, sp.y - bracketSize);
      ctx.lineTo(sp.x + bracketSize, sp.y - bracketSize);
      ctx.lineTo(sp.x + bracketSize, sp.y - bracketSize + 3);
      ctx.moveTo(sp.x - bracketSize, sp.y + bracketSize - 3);
      ctx.lineTo(sp.x - bracketSize, sp.y + bracketSize);
      ctx.lineTo(sp.x - bracketSize + 3, sp.y + bracketSize);
      ctx.moveTo(sp.x + bracketSize - 3, sp.y + bracketSize);
      ctx.lineTo(sp.x + bracketSize, sp.y + bracketSize);
      ctx.lineTo(sp.x + bracketSize, sp.y + bracketSize - 3);
      ctx.stroke();

      if (this.selectedExpressId) {
        ctx.font = "700 7px monospace";
        ctx.fillStyle = "#38BDF8";
        ctx.fillText(`#${this.selectedExpressId}`, sp.x, sp.y + bracketSize + 6);
      }
    }

    // 7. Draw 2D Radar Measure Line
    if (this.isMeasuring && this.measureStart && this.measureEnd) {
      const p1 = this.worldToMinimap(this.measureStart.x, this.measureStart.z);
      const p2 = this.worldToMinimap(this.measureEnd.x, this.measureEnd.z);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(p1.x, p1.y, 3, 0, Math.PI * 2);
      ctx.arc(p2.x, p2.y, 3, 0, Math.PI * 2);
      ctx.fill();

      const dist = Math.hypot(this.measureEnd.x - this.measureStart.x, this.measureEnd.z - this.measureStart.z);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 8px monospace";
      ctx.fillText(`${dist.toFixed(2)}m`, (p1.x + p2.x) / 2, (p1.y + p2.y) / 2 - 5);
    }

    // 8. Draw Camera Field of View Frustum Cone, Focal Target & Avatar
    const rawMapPos = this.worldToMinimap(camPos.x, camPos.z);
    const margin = 12;
    const playerMapPos = {
      x: Math.max(margin, Math.min(w - margin, rawMapPos.x)),
      y: Math.max(margin, Math.min(h - margin, rawMapPos.y)),
    };

    const viewAngle = Math.atan2(forward.z, forward.x);
    const fovDegrees = (cam as THREE.PerspectiveCamera)?.fov || 60;
    const fovAngle = THREE.MathUtils.degToRad(fovDegrees);
    const targetPixelDist = camDist * this.config.zoom;
    const coneRadius = THREE.MathUtils.clamp(targetPixelDist, 24, w * 0.72);

    // Gradient Vision Cone
    const grad = ctx.createRadialGradient(playerMapPos.x, playerMapPos.y, 2, playerMapPos.x, playerMapPos.y, coneRadius);
    grad.addColorStop(0, "rgba(212, 255, 63, 0.45)");
    grad.addColorStop(0.6, "rgba(212, 255, 63, 0.14)");
    grad.addColorStop(1, "rgba(212, 255, 63, 0.0)");

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
    ctx.strokeStyle = "rgba(212, 255, 63, 0.6)";
    ctx.lineWidth = 1;
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

    // Target Focal Crosshair
    if (!this.isWalkMode) {
      const rawTargetPos = this.worldToMinimap(target.x, target.z);
      ctx.strokeStyle = "rgba(212, 255, 63, 0.75)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(rawTargetPos.x, rawTargetPos.y, 3, 0, Math.PI * 2);
      ctx.moveTo(rawTargetPos.x - 5, rawTargetPos.y);
      ctx.lineTo(rawTargetPos.x + 5, rawTargetPos.y);
      ctx.moveTo(rawTargetPos.x, rawTargetPos.y - 5);
      ctx.lineTo(rawTargetPos.x, rawTargetPos.y + 5);
      ctx.stroke();
    }

    // Player / Camera Avatar Dot
    ctx.fillStyle = "#D4FF3F";
    ctx.shadowColor = "#D4FF3F";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(playerMapPos.x, playerMapPos.y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Directional View Arrow
    const headingLength = 14;
    const endX = playerMapPos.x + Math.cos(viewAngle) * headingLength;
    const endY = playerMapPos.y + Math.sin(viewAngle) * headingLength;

    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playerMapPos.x, playerMapPos.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // 9. Draw Live Crosshair when Mouse Hovers Over Radar
    if (this.hoverPixel) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, this.hoverPixel.y);
      ctx.lineTo(w, this.hoverPixel.y);
      ctx.moveTo(this.hoverPixel.x, 0);
      ctx.lineTo(this.hoverPixel.x, h);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = "#38BDF8";
      ctx.beginPath();
      ctx.arc(this.hoverPixel.x, this.hoverPixel.y, 3, 0, Math.PI * 2);
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
