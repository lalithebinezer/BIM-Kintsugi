import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as FRAGS from "@thatopen/fragments";
import { BimEngine } from "../core/BimEngine";
import { SoundManager } from "../core/SoundManager";
import { BvhAccelerationService } from "../core/BvhAccelerationService";
import { PointerInputArbiter } from "../core/PointerInputArbiter";
import { ResourceLifecycleManager } from "../core/ResourceLifecycleManager";

export type SnapType = "vertex" | "edge" | "midpoint" | "face" | "free";
export type MeasurementUnit = "m" | "mm" | "cm" | "ft-in" | "ft" | "in";

export const MEASUREMENT_UNIT_STORAGE_KEY = "bim_measurement_unit";
const VALID_UNITS: readonly MeasurementUnit[] = ["m", "mm", "cm", "ft-in", "ft", "in"];

export function isMeasurementUnit(val: unknown): val is MeasurementUnit {
  return typeof val === "string" && (VALID_UNITS as readonly string[]).includes(val);
}

/**
 * Formats a linear distance in meters into the selected architectural/engineering display unit.
 */
export function formatMeasurementLength(meters: number, unit: MeasurementUnit, compact = false): string {
  const safe = Number.isFinite(meters) ? meters : 0;
  switch (unit) {
    case "mm": {
      const mm = safe * 1000;
      const digits = Math.abs(mm) < 10 && !compact ? 1 : 0;
      return `${mm.toFixed(digits)} mm`;
    }
    case "cm":
      return `${(safe * 100).toFixed(1)} cm`;
    case "ft":
      return `${(safe * 3.280839895).toFixed(compact ? 2 : 3)} ft`;
    case "in":
      return `${(safe * 39.37007874).toFixed(compact ? 1 : 2)} in`;
    case "ft-in": {
      const sign = safe < 0 ? "-" : "";
      const totalInches = Math.abs(safe) * 39.37007874;
      let feet = Math.floor(totalInches / 12);
      let inches = Math.round((totalInches - feet * 12) * 10) / 10;
      if (inches >= 12) {
        feet += 1;
        inches = 0;
      }
      if (feet === 0) return `${sign}${inches.toFixed(1)}"`;
      return `${sign}${feet}'-${inches.toFixed(1)}"`;
    }
    case "m":
    default:
      return `${safe.toFixed(compact ? 2 : 3)} m`;
  }
}

/**
 * Formats a surface area in square meters into the selected display unit.
 */
export function formatMeasurementArea(sqMeters: number, unit: MeasurementUnit): string {
  const safe = Number.isFinite(sqMeters) ? sqMeters : 0;
  switch (unit) {
    case "mm":
      return `${Math.round(safe * 1e6).toLocaleString("en-US")} mm²`;
    case "cm":
      return `${(safe * 1e4).toLocaleString("en-US", { maximumFractionDigits: 1 })} cm²`;
    case "ft":
    case "ft-in":
      return `${(safe * 10.763910417).toFixed(2)} ft²`;
    case "in":
      return `${(safe * 1550.0031).toFixed(1)} in²`;
    case "m":
    default:
      return `${safe.toFixed(2)} m²`;
  }
}

/**
 * Formats a volume in cubic meters into the selected display unit.
 */
export function formatMeasurementVolume(cuMeters: number, unit: MeasurementUnit): string {
  const safe = Number.isFinite(cuMeters) ? cuMeters : 0;
  switch (unit) {
    case "mm":
      return `${Math.round(safe * 1e9).toLocaleString("en-US")} mm³`;
    case "cm":
      return `${Math.round(safe * 1e6).toLocaleString("en-US")} cm³`;
    case "ft":
    case "ft-in":
      return `${(safe * 35.314666721).toFixed(2)} ft³`;
    case "in":
      return `${(safe * 61023.744).toFixed(1)} in³`;
    case "m":
    default:
      return `${safe.toFixed(2)} m³`;
  }
}

export function formatMeasurementDeltas(dx: number, dy: number, dz: number, unit: MeasurementUnit): string {
  return `ΔX: ${formatMeasurementLength(dx, unit, true)} · ΔY: ${formatMeasurementLength(dy, unit, true)} · ΔZ: ${formatMeasurementLength(dz, unit, true)}`;
}

export interface MeasurementPoint {
  position: THREE.Vector3;
  elementId?: number;
  modelId?: string;
  snapType?: SnapType;
}

export interface ResolvedSnapPoint {
  position: THREE.Vector3;
  snapType: SnapType;
  elementId?: number;
  modelId?: string;
  edgeStart?: THREE.Vector3;
  edgeEnd?: THREE.Vector3;
}

export interface DimensionItem {
  id: string;
  type: "distance" | "angle" | "area" | "delta" | "volume";
  start: MeasurementPoint;
  end?: MeasurementPoint;
  extraPoints?: MeasurementPoint[];
  value: number;
  formattedValue: string;
  deltaX?: number;
  deltaY?: number;
  deltaZ?: number;
  lineGroup?: THREE.Group;
  labelElement?: HTMLElement;
  createdAt: string;
}

export class MeasurementSuite {
  private static instance: MeasurementSuite;
  private engine: BimEngine;
  private measurements: DimensionItem[] = [];
  private activeType: "distance" | "angle" | "area" | "delta" | "volume" = "distance";
  private isMeasuring: boolean = false;
  private snapEnabled: boolean = true;
  private snapTolerance: number = 0.35; // world units
  private unit: MeasurementUnit = "m";
  private currentPoints: MeasurementPoint[] = [];

  // Native ThatOpen @thatopen/components-front measurers
  public lengthMeasurer?: OBF.LengthMeasurement;
  public areaMeasurer?: OBF.AreaMeasurement;
  public angleMeasurer?: OBF.AngleMeasurement;
  public volumeMeasurer?: OBF.VolumeMeasurement;

  private overlayGroup: THREE.Group;
  private snapMarker: THREE.Mesh;
  private snapMarkerMaterial: THREE.MeshBasicMaterial;
  private snapEdgeLine: THREE.Line;
  private snapEdgeGeometry: THREE.BufferGeometry;
  private previewLine: THREE.Line;
  private previewLineGeometry: THREE.BufferGeometry;
  private pointerMoveSeq: number = 0;
  private lastResolvedSnap: {
    clientX: number;
    clientY: number;
    result: ResolvedSnapPoint;
    timestamp: number;
  } | null = null;

  private constructor() {
    this.engine = BimEngine.getInstance();
    try {
      const savedUnit = typeof localStorage !== "undefined" ? localStorage.getItem(MEASUREMENT_UNIT_STORAGE_KEY) : null;
      if (isMeasurementUnit(savedUnit)) {
        this.unit = savedUnit;
      }
    } catch {
      /* storage unavailable */
    }
    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = "MeasurementOverlayGroup";

    if (this.engine.world?.scene?.three) {
      this.engine.world.scene.three.add(this.overlayGroup);
    }

    // Snap visual indicator sphere (dynamically scaled by camera distance & color-coded by snap type)
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
    this.snapMarkerMaterial = new THREE.MeshBasicMaterial({
      color: 0xd4ff3f,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    });
    this.snapMarker = new THREE.Mesh(sphereGeo, this.snapMarkerMaterial);
    this.snapMarker.visible = false;
    this.snapMarker.renderOrder = 9999;
    this.overlayGroup.add(this.snapMarker);

    // Highlighted 3D element edge line (lights up the exact snapped edge segment)
    this.snapEdgeGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    const snapEdgeMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      depthTest: false,
      transparent: true,
      opacity: 0.95,
    });
    this.snapEdgeLine = new THREE.Line(this.snapEdgeGeometry, snapEdgeMat);
    this.snapEdgeLine.visible = false;
    this.snapEdgeLine.renderOrder = 9998;
    this.overlayGroup.add(this.snapEdgeLine);

    // Dynamic measurement preview line
    this.previewLineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    const lineMat = new THREE.LineDashedMaterial({
      color: 0x38bdf8,
      dashSize: 0.2,
      gapSize: 0.1,
      depthTest: false,
    });
    this.previewLine = new THREE.Line(this.previewLineGeometry, lineMat);
    this.previewLine.computeLineDistances();
    this.previewLine.visible = false;
    this.previewLine.renderOrder = 9998;
    this.overlayGroup.add(this.previewLine);

    this.initNativeThatOpenMeasurers();
    this.bindPointerEvents();
  }

  public static getInstance(): MeasurementSuite {
    if (!MeasurementSuite.instance) {
      MeasurementSuite.instance = new MeasurementSuite();
    }
    return MeasurementSuite.instance;
  }

  private initNativeThatOpenMeasurers() {
    try {
      const components = this.engine.components;
      const world = this.engine.world;
      if (!components || !world) return;

      this.lengthMeasurer = components.get(OBF.LengthMeasurement);
      this.areaMeasurer = components.get(OBF.AreaMeasurement);
      this.angleMeasurer = components.get(OBF.AngleMeasurement);
      this.volumeMeasurer = components.get(OBF.VolumeMeasurement);

      const defaultSnaps = [
        FRAGS.SnappingClass.POINT,
        FRAGS.SnappingClass.LINE,
        FRAGS.SnappingClass.FACE,
      ];

      if (this.lengthMeasurer) {
        this.lengthMeasurer.world = world;
        this.lengthMeasurer.color = new THREE.Color(0xd4ff3f);
        this.lengthMeasurer.units = "m";
        this.lengthMeasurer.rounding = 3;
        this.lengthMeasurer.snappings = defaultSnaps;
        this.lengthMeasurer.enabled = false;
        this.lengthMeasurer.list?.onItemAdded?.add((line: OBF.Line) => {
          const dist = line.value || line.distance();
          const dx = Math.abs(line.end.x - line.start.x);
          const dy = Math.abs(line.end.y - line.start.y);
          const dz = Math.abs(line.end.z - line.start.z);
          this.measurements.push({
            id: line.id || `dim_obf_${Date.now()}`,
            type: this.activeType === "delta" ? "delta" : "distance",
            start: { position: line.start.clone(), snapType: "vertex" },
            end: { position: line.end.clone(), snapType: "vertex" },
            value: dist,
            formattedValue: formatMeasurementLength(dist, this.unit),
            deltaX: dx,
            deltaY: dy,
            deltaZ: dz,
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          this.updateMeasurementUI();
        });
      }

      if (this.areaMeasurer) {
        this.areaMeasurer.world = world;
        this.areaMeasurer.color = new THREE.Color(0xa855f7);
        this.areaMeasurer.units = "m2";
        this.areaMeasurer.rounding = 2;
        this.areaMeasurer.snappings = defaultSnaps;
        this.areaMeasurer.enabled = false;
        this.areaMeasurer.list?.onItemAdded?.add((area: OBF.Area) => {
          const val = area.value || 0;
          const pts = Array.from(area.points || []);
          const startPos = pts[0] ? pts[0].clone() : new THREE.Vector3();
          this.measurements.push({
            id: area.id || `area_obf_${Date.now()}`,
            type: "area",
            start: { position: startPos, snapType: "vertex" },
            value: val,
            formattedValue: formatMeasurementArea(val, this.unit),
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          this.updateMeasurementUI();
        });
      }

      if (this.angleMeasurer) {
        this.angleMeasurer.world = world;
        this.angleMeasurer.color = new THREE.Color(0x38bdf8);
        this.angleMeasurer.units = "deg";
        this.angleMeasurer.rounding = 1;
        this.angleMeasurer.snappings = defaultSnaps;
        this.angleMeasurer.enabled = false;
        this.angleMeasurer.list?.onItemAdded?.add((angle: OBF.Angle) => {
          const deg = angle.value || 0;
          this.measurements.push({
            id: angle.id || `angle_obf_${Date.now()}`,
            type: "angle",
            start: { position: angle.start.clone(), snapType: "vertex" },
            end: { position: angle.end.clone(), snapType: "vertex" },
            extraPoints: [{ position: angle.vertex.clone(), snapType: "vertex" }],
            value: deg,
            formattedValue: `${deg.toFixed(1)}°`,
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          this.updateMeasurementUI();
        });
      }

      if (this.volumeMeasurer) {
        this.volumeMeasurer.world = world;
        this.volumeMeasurer.color = new THREE.Color(0x10b981);
        this.volumeMeasurer.units = "m3";
        this.volumeMeasurer.rounding = 2;
        this.volumeMeasurer.enabled = false;
        this.volumeMeasurer.list?.onItemAdded?.add(async (vol: OBF.Volume) => {
          const v = (await vol.getValue?.()) || 0;
          const center = (await vol.getCenter?.()) || new THREE.Vector3();
          this.measurements.push({
            id: vol.id || `vol_obf_${Date.now()}`,
            type: "volume",
            start: { position: center.clone(), snapType: "face" },
            value: v,
            formattedValue: formatMeasurementVolume(v, this.unit),
            createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          });
          this.updateMeasurementUI();
        });
      }
    } catch (e) {
      // Safe fallback in headless unit test environments
    }
  }

  private getActiveNativeMeasurer(): OBF.Measurement<any, any> | undefined {
    if (this.activeType === "volume") return this.volumeMeasurer;
    return undefined;
  }

  private syncNativeMeasurerState() {
    try {
      if (this.lengthMeasurer) this.lengthMeasurer.enabled = false;
      if (this.areaMeasurer) this.areaMeasurer.enabled = false;
      if (this.angleMeasurer) this.angleMeasurer.enabled = false;
      if (this.volumeMeasurer) this.volumeMeasurer.enabled = false;

      if (!this.isMeasuring) return;

      const active = this.getActiveNativeMeasurer();
      if (active) {
        active.enabled = true;
      }
    } catch (e) { }
  }

  private bindPointerEvents() {
    if (typeof window === "undefined") return;

    const arbiter = PointerInputArbiter.getInstance();
    const container = document.getElementById("container") || this.engine.container;
    if (container instanceof HTMLElement) {
      arbiter.attach(container);
    }

    const isUiClick = (target: HTMLElement | null) =>
      !!target?.closest?.(
        ".ui-layer header, .sidebar, .sidebar-panel, .bottom-toolbar, .hud-anchor-top-left, .hud-anchor-bottom-center, .hud-anchor-bottom-right, .enterprise-drawer, .timeline-panel, .bim-toolbar, .bim-modal, #viewport-selection-bar, #viewport-hidden-indicator, #measurement-panel, #minimap-container, #bim-context-menu, .view-cube-layer, button, input, select, a"
      );

    arbiter.registerHandler({
      id: "measurement-suite",
      priority: "measurement",
      isActive: () => this.isMeasuring,
      onPointerMove: (e) => {
        if (isUiClick(e.target as HTMLElement | null)) return;
        this.handlePointerMove(e);
      },
      onPointerUp: (e, isClickWithinDeadzone) => {
        if (!isClickWithinDeadzone || e.button !== 0) return;
        if (isUiClick(e.target as HTMLElement | null)) {
          return;
        }
        this.handlePointerClick(e);
      },
    });

    window.addEventListener("dblclick", (e) => {
      if (!this.isMeasuring) return;
      if (isUiClick(e.target as HTMLElement | null)) {
        return;
      }
      try {
        const active = this.getActiveNativeMeasurer();
        if (active && active.enabled) {
          active.create();
        }
      } catch (err) { }
    });

    window.addEventListener("keydown", (e) => {
      if (!this.isMeasuring) return;
      try {
        const active = this.getActiveNativeMeasurer();
        if (active && active.enabled) {
          if (e.key === "Enter") {
            active.endCreation?.();
          } else if (e.key === "Escape") {
            active.cancelCreation?.();
            this.stopMeasurement();
          } else if (e.key === "Delete" || e.key === "Backspace") {
            active.delete?.();
          }
          return;
        }
        if (e.key === "Escape") {
          if (this.currentPoints.length > 0) {
            this.currentPoints = [];
            this.previewLine.visible = false;
            this.snapEdgeLine.visible = false;
          } else {
            this.stopMeasurement();
          }
        }
      } catch (err) { }
    });
  }

  public startMeasurement(type: "distance" | "angle" | "area" | "delta" | "volume" = "distance") {
    this.activeType = type;
    this.isMeasuring = true;
    this.currentPoints = [];
    this.lastResolvedSnap = null;
    this.snapMarker.visible = false;
    this.snapEdgeLine.visible = false;
    this.previewLine.visible = false;

    if (typeof document !== "undefined") {
      document.querySelectorAll("#measurement-panel .btn-drawer-tool").forEach((btn) => {
        const el = btn as HTMLElement;
        el.classList.toggle("active", el.dataset.type === type);
      });
      const hoverBadge = document.getElementById("viewport-hover-badge");
      if (hoverBadge) hoverBadge.style.display = "none";
    }

    this.syncNativeMeasurerState();
    this.updateSnapBadge(this.snapEnabled ? null : "free");
    this.updateMeasurementUI();
  }

  public stopMeasurement() {
    this.isMeasuring = false;
    this.currentPoints = [];
    this.lastResolvedSnap = null;
    this.pointerMoveSeq++;
    this.snapMarker.visible = false;
    this.snapEdgeLine.visible = false;
    this.previewLine.visible = false;
    try {
      this.lengthMeasurer?.cancelCreation?.();
      this.areaMeasurer?.cancelCreation?.();
      this.angleMeasurer?.cancelCreation?.();
      this.volumeMeasurer?.cancelCreation?.();
    } catch (e) { }
    if (typeof document !== "undefined") {
      document.querySelectorAll(".btn-drawer-tool").forEach((b) => b.classList.remove("active"));
    }
    this.syncNativeMeasurerState();
    this.updateSnapBadge(null);
    this.updateMeasurementUI();
  }

  public setSnapEnabled(enabled: boolean) {
    this.snapEnabled = enabled;
    this.lastResolvedSnap = null;
    if (!enabled) {
      this.snapEdgeLine.visible = false;
    }
    this.updateSnapBadge(enabled ? null : "free");
    try {
      const snaps = enabled
        ? [FRAGS.SnappingClass.POINT, FRAGS.SnappingClass.LINE, FRAGS.SnappingClass.FACE]
        : [];
      if (this.lengthMeasurer) this.lengthMeasurer.snappings = snaps;
      if (this.areaMeasurer) this.areaMeasurer.snappings = snaps;
      if (this.angleMeasurer) this.angleMeasurer.snappings = snaps;
    } catch (e) { }
  }

  public getSnapEnabled(): boolean {
    return this.snapEnabled;
  }

  public getUnit(): MeasurementUnit {
    return this.unit;
  }

  public setUnit(unit: MeasurementUnit): void {
    if (!isMeasurementUnit(unit)) return;
    this.unit = unit;
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(MEASUREMENT_UNIT_STORAGE_KEY, unit);
      }
    } catch {
      /* storage blocked */
    }

    // Sync native ThatOpen measurer units when using metric presets
    try {
      const metricLen: "m" | "cm" | "mm" = unit === "mm" ? "mm" : unit === "cm" ? "cm" : "m";
      if (this.lengthMeasurer) {
        this.lengthMeasurer.units = metricLen;
        this.lengthMeasurer.rounding = unit === "mm" ? 0 : unit === "cm" ? 1 : 3;
      }
      if (this.areaMeasurer) {
        this.areaMeasurer.units = (metricLen === "mm" ? "mm2" : metricLen === "cm" ? "cm2" : "m2") as any;
      }
      if (this.volumeMeasurer) {
        this.volumeMeasurer.units = (metricLen === "mm" ? "mm3" : metricLen === "cm" ? "cm3" : "m3") as any;
      }
    } catch {
      /* ignore */
    }

    // Live re-format all existing measurements and their 3D viewport labels
    for (const item of this.measurements) {
      if (item.type === "distance" || item.type === "delta") {
        item.formattedValue = formatMeasurementLength(item.value, this.unit);
      } else if (item.type === "area") {
        item.formattedValue = formatMeasurementArea(item.value, this.unit);
      } else if (item.type === "volume") {
        item.formattedValue = formatMeasurementVolume(item.value, this.unit);
      }
      if (item.labelElement) {
        item.labelElement.innerHTML = this.buildLabelInnerHtml(item);
      }
    }

    // Sync live cursor preview readout and dropdown control
    if (typeof document !== "undefined") {
      const sel = document.getElementById("select-measure-unit") as HTMLSelectElement | null;
      if (sel && sel.value !== this.unit) sel.value = this.unit;
      const hudLive = document.getElementById("measurement-live-val");
      if (hudLive) {
        if (this.currentPoints.length > 0 && this.lastResolvedSnap) {
          const dist = this.currentPoints[0].position.distanceTo(this.lastResolvedSnap.result.position);
          hudLive.innerText = formatMeasurementLength(dist, this.unit);
        } else {
          hudLive.innerText = formatMeasurementLength(0, this.unit);
        }
      }
    }

    this.updateMeasurementUI();
  }

  public isMeasuringActive(): boolean {
    return this.isMeasuring;
  }

  public getMeasurements(): DimensionItem[] {
    return this.measurements;
  }

  public clearAllMeasurements() {
    const lifecycle = ResourceLifecycleManager.getInstance();
    for (const item of this.measurements) {
      if (item.lineGroup) {
        this.overlayGroup.remove(item.lineGroup);
        lifecycle.disposeObjectTree(item.lineGroup, { disposeMaterials: true, removeFromParent: false });
      }
      if (item.labelElement && item.labelElement.parentElement) {
        item.labelElement.parentElement.removeChild(item.labelElement);
      }
    }
    this.currentPoints = [];
    this.lastResolvedSnap = null;
    this.snapMarker.visible = false;
    this.snapEdgeLine.visible = false;
    this.previewLine.visible = false;
    try {
      this.lengthMeasurer?.cancelCreation?.();
      this.areaMeasurer?.cancelCreation?.();
      this.angleMeasurer?.cancelCreation?.();
      this.volumeMeasurer?.cancelCreation?.();
      this.lengthMeasurer?.list?.clear();
      this.areaMeasurer?.list?.clear();
      this.angleMeasurer?.list?.clear();
      this.volumeMeasurer?.list?.clear();
    } catch (e) { }
    if (typeof document !== "undefined") {
      document
        .querySelectorAll("#measurement-labels-overlay .bim-3d-dimension-badge, #container .bim-3d-dimension-badge")
        .forEach((el) => el.remove());
      const hudLive = document.getElementById("measurement-live-val");
      if (hudLive) hudLive.innerText = formatMeasurementLength(0, this.unit);
    }
    this.measurements = [];
    this.updateMeasurementUI();
  }

  public removeMeasurement(id: string) {
    const idx = this.measurements.findIndex((m) => m.id === id);
    if (idx !== -1) {
      const item = this.measurements[idx];
      if (item.lineGroup) {
        this.overlayGroup.remove(item.lineGroup);
        ResourceLifecycleManager.getInstance().disposeObjectTree(item.lineGroup, {
          disposeMaterials: true,
          removeFromParent: false,
        });
      }
      if (item.labelElement && item.labelElement.parentElement) {
        item.labelElement.parentElement.removeChild(item.labelElement);
      }
      this.measurements.splice(idx, 1);
      this.updateMeasurementUI();
    }
  }

  private getCandidateMeshes(): THREE.Mesh[] {
    const scene = this.engine.world?.scene?.three;
    if (!scene) return [];
    const candidateMeshes: THREE.Mesh[] = [];
    scene.traverse((obj) => {
      if (
        obj instanceof THREE.Mesh &&
        obj.visible &&
        obj !== this.snapMarker &&
        !this.isDescendantOfOverlay(obj) &&
        obj.name !== "BIM_GroundContactShadow"
      ) {
        candidateMeshes.push(obj);
      }
    });
    return candidateMeshes;
  }

  private isDescendantOfOverlay(obj: THREE.Object3D): boolean {
    let cur: THREE.Object3D | null = obj;
    while (cur) {
      if (cur === this.overlayGroup) return true;
      cur = cur.parent;
    }
    return false;
  }

  /**
   * Computes camera-distance adaptive snap tolerances so close-up detail work has
   * millimeter accuracy while building-scale overview work still feels magnetic.
   */
  public computeAdaptiveSnapRadii(worldPos: THREE.Vector3): { vertexRadius: number; edgeRadius: number } {
    const camera = this.engine.world?.camera?.three;
    const renderer = this.engine.world?.renderer?.three;
    const viewportH = Math.max(240, renderer?.domElement?.clientHeight || 800);

    if (camera instanceof THREE.PerspectiveCamera) {
      const dist = Math.max(0.2, camera.position.distanceTo(worldPos));
      const fovRad = THREE.MathUtils.degToRad(camera.fov || 60);
      const worldPerPx = (2 * dist * Math.tan(fovRad * 0.5)) / viewportH;
      return {
        vertexRadius: THREE.MathUtils.clamp(worldPerPx * 14, 0.04, 0.28),
        edgeRadius: THREE.MathUtils.clamp(worldPerPx * 24, 0.06, 0.45),
      };
    }

    if (camera instanceof THREE.OrthographicCamera) {
      const worldPerPx =
        Math.abs(camera.top - camera.bottom) / Math.max(0.001, camera.zoom || 1) / viewportH;
      return {
        vertexRadius: THREE.MathUtils.clamp(worldPerPx * 14, 0.04, 0.28),
        edgeRadius: THREE.MathUtils.clamp(worldPerPx * 24, 0.06, 0.45),
      };
    }

    return {
      vertexRadius: Math.min(this.snapTolerance * 0.65, 0.22),
      edgeRadius: this.snapTolerance,
    };
  }

  private findExistingMeasurementSnap(rawPos: THREE.Vector3, radius: number): ResolvedSnapPoint | null {
    let best: THREE.Vector3 | null = null;
    let bestDist = radius;
    const check = (pt?: THREE.Vector3) => {
      if (!pt) return;
      const d = pt.distanceTo(rawPos);
      if (d <= bestDist) {
        bestDist = d;
        best = pt;
      }
    };
    for (const m of this.measurements) {
      check(m.start.position);
      check(m.end?.position);
      if (m.extraPoints) {
        for (const ep of m.extraPoints) check(ep.position);
      }
    }
    return best ? { position: (best as THREE.Vector3).clone(), snapType: "vertex" } : null;
  }

  /**
   * Snaps a world position to the closest BVH vertex, edge midpoint, or true
   * architectural feature edge if within tolerance. Only applies the 0.1m grid
   * fallback when no scene geometry exists (e.g. empty canvas).
   */
  public snapPosition(rawPos: THREE.Vector3): ResolvedSnapPoint {
    if (!this.snapEnabled) {
      return { position: rawPos.clone(), snapType: "free" };
    }

    const camera = this.engine.world?.camera?.three;
    if (!camera || !this.engine.world?.scene?.three) {
      return { position: rawPos.clone(), snapType: "free" };
    }

    const { vertexRadius, edgeRadius } = this.computeAdaptiveSnapRadii(rawPos);

    // 1. Snap to existing measurement endpoints first
    const existingSnap = this.findExistingMeasurementSnap(rawPos, vertexRadius);
    if (existingSnap) return existingSnap;

    // 2. BVH shapecast vertex / midpoint / sharp feature edge snapping across scene geometry
    const candidateMeshes = this.getCandidateMeshes();
    if (candidateMeshes.length > 0) {
      const bvhSnap = BvhAccelerationService.getInstance().findNearestSnapPoint(
        rawPos,
        edgeRadius,
        candidateMeshes,
        { vertexRadius }
      );
      if (bvhSnap) {
        return {
          position: bvhSnap.point,
          snapType: bvhSnap.snapType,
          edgeStart: bvhSnap.edgeStart,
          edgeEnd: bvhSnap.edgeEnd,
        };
      }
      // Stay accurately on the hit 3D surface rather than rounding onto an arbitrary 0.1m grid
      return { position: rawPos.clone(), snapType: "face" };
    }

    // 3. Empty-canvas fallback 0.1m architectural grid snap
    const snapped = rawPos.clone();
    snapped.x = Math.round(snapped.x * 10) / 10;
    snapped.y = Math.round(snapped.y * 10) / 10;
    snapped.z = Math.round(snapped.z * 10) / 10;

    if (snapped.distanceTo(rawPos) <= this.snapTolerance) {
      return { position: snapped, snapType: "vertex" };
    }

    return { position: rawPos.clone(), snapType: "face" };
  }

  /**
   * Native `@thatopen/components` GPU pick + `SnapResolver` edge/vertex snapping for
   * loaded IFC Fragment models. Evaluates exact IFC shell vertices (`POINT`), edge
   * midpoints, and true continuous edge projections (`LINE` with `snappedEdgeP1/P2`).
   */
  public async resolveFragmentSnap(
    ndc: THREE.Vector2,
    viewportW: number,
    viewportH: number
  ): Promise<ResolvedSnapPoint | null> {
    const components = this.engine.components;
    const world = this.engine.world;
    const fragments = this.engine.fragments;
    if (!components || !world || !fragments?.initialized || fragments.list.size === 0) {
      return null;
    }

    try {
      const fastPicker = components.get(OBC.FastModelPickers).get(world);
      let hit = await fastPicker.getFullPick(ndc);

      // Micro-ring probe (±6px) when cursor sits just outside a silhouette edge
      if (!hit && this.snapEnabled) {
        const dx = (6 / Math.max(200, viewportW)) * 2;
        const dy = (6 / Math.max(200, viewportH)) * 2;
        const offsets: Array<[number, number]> = [
          [dx, 0],
          [-dx, 0],
          [0, dy],
          [0, -dy],
        ];
        for (const [ox, oy] of offsets) {
          const probe = await fastPicker.getFullPick(new THREE.Vector2(ndc.x + ox, ndc.y + oy));
          if (probe) {
            hit = probe;
            break;
          }
        }
      }

      if (!hit || !hit.point) return null;

      const rawPos = hit.point.clone();
      if (!this.snapEnabled) {
        return {
          position: rawPos,
          snapType: "face",
          elementId: hit.localId,
          modelId: hit.modelId,
        };
      }

      const { vertexRadius, edgeRadius } = this.computeAdaptiveSnapRadii(rawPos);

      // 1. Existing measurement endpoints take top priority within vertex radius
      const existingSnap = this.findExistingMeasurementSnap(rawPos, vertexRadius);
      if (existingSnap) return existingSnap;

      // 2. Native ThatOpen SnapResolver on exact IFC shell polygons (vertices & real edges)
      const resolver = components.get(OBC.SnapResolvers).get();
      const prevMaxDistance = resolver.maxDistance;
      try {
        // Tier 1: Corner Vertex within tight vertexRadius
        resolver.maxDistance = vertexRadius;
        const vertexSnap = await resolver.resolve(rawPos, hit.modelId, hit.itemId, [
          OBC.SnapClass.POINT,
        ]);
        if (vertexSnap && vertexSnap.snappingClass === OBC.SnapClass.POINT && vertexSnap.point) {
          return {
            position: vertexSnap.point.clone(),
            snapType: "vertex",
            elementId: hit.localId,
            modelId: hit.modelId,
          };
        }

        // Tier 2: True Element Edge (continuous segment projection + midpoint detection)
        resolver.maxDistance = edgeRadius;
        const edgeSnap = await resolver.resolve(rawPos, hit.modelId, hit.itemId, [
          OBC.SnapClass.LINE,
        ]);
        if (edgeSnap && edgeSnap.snappingClass === OBC.SnapClass.LINE && edgeSnap.point) {
          const p1 = edgeSnap.snappedEdgeP1?.clone();
          const p2 = edgeSnap.snappedEdgeP2?.clone();
          if (p1 && p2) {
            // Check exact endpoints first if projection landed near a corner
            if (eDistWithin(edgeSnap.point, p1, vertexRadius * 0.6)) {
              return {
                position: p1,
                snapType: "vertex",
                elementId: hit.localId,
                modelId: hit.modelId,
                edgeStart: p1,
                edgeEnd: p2,
              };
            }
            if (eDistWithin(edgeSnap.point, p2, vertexRadius * 0.6)) {
              return {
                position: p2,
                snapType: "vertex",
                elementId: hit.localId,
                modelId: hit.modelId,
                edgeStart: p1,
                edgeEnd: p2,
              };
            }
            // Check exact edge midpoint for longer architectural edges
            const edgeLen = p1.distanceTo(p2);
            if (edgeLen > vertexRadius * 1.5) {
              const mid = p1.clone().add(p2).multiplyScalar(0.5);
              if (edgeSnap.point.distanceTo(mid) <= vertexRadius * 0.78) {
                return {
                  position: mid,
                  snapType: "midpoint",
                  elementId: hit.localId,
                  modelId: hit.modelId,
                  edgeStart: p1,
                  edgeEnd: p2,
                };
              }
            }
          }

          return {
            position: edgeSnap.point.clone(),
            snapType: "edge",
            elementId: hit.localId,
            modelId: hit.modelId,
            edgeStart: p1,
            edgeEnd: p2,
          };
        }
      } finally {
        resolver.maxDistance = prevMaxDistance;
      }

      // 3. No vertex or edge within range -> stay accurately on the hit element surface
      return {
        position: rawPos,
        snapType: "face",
        elementId: hit.localId,
        modelId: hit.modelId,
      };
    } catch {
      return null;
    }
  }

  /**
   * Resolves the best 3D snapped point for a pointer event using native IFC Fragment
   * edge/vertex snapping first, then BVH mesh/InstancedMesh feature-edge snapping,
   * and finally a y=0 ground plane fallback when pointing at empty space.
   */
  public async resolveSnapAtEvent(e: PointerEvent): Promise<ResolvedSnapPoint | null> {
    const container = document.getElementById("container") || this.engine.container;
    if (!(container instanceof HTMLElement)) return null;
    const rect = container.getBoundingClientRect();
    const w = rect.width || 1;
    const h = rect.height || 1;
    const x = ((e.clientX - rect.left) / w) * 2 - 1;
    const y = -((e.clientY - rect.top) / h) * 2 + 1;
    const ndc = new THREE.Vector2(x, y);

    const camera = this.engine.world?.camera?.three;
    if (!camera) {
      return { position: new THREE.Vector3(x * 10, 0, -y * 10), snapType: "free" };
    }

    // 1. Primary: Native ThatOpen Fragment GPU pick + exact IFC shell vertex/edge SnapResolver
    const fragSnap = await this.resolveFragmentSnap(ndc, w, h);
    if (fragSnap) {
      return fragSnap;
    }

    // 2. Fallback: Three.js Mesh / InstancedMesh BVH raycast + feature-edge snapping
    const candidateMeshes = this.getCandidateMeshes();
    if (candidateMeshes.length > 0) {
      const hits = BvhAccelerationService.getInstance().raycastMeshes(
        candidateMeshes,
        ndc,
        camera,
        { firstHitOnly: true, ownerTag: "bvh:measurement" }
      );
      if (hits.length > 0) {
        const hit = hits[0];
        const hitPoint = hit.point.clone();
        if (!this.snapEnabled) {
          return { position: hitPoint, snapType: "face" };
        }

        const { vertexRadius, edgeRadius } = this.computeAdaptiveSnapRadii(hitPoint);
        const existingSnap = this.findExistingMeasurementSnap(hitPoint, vertexRadius);
        if (existingSnap) return existingSnap;

        const instanceHints = new Map<THREE.InstancedMesh, number>();
        if ((hit.object as THREE.InstancedMesh).isInstancedMesh && typeof hit.instanceId === "number") {
          instanceHints.set(hit.object as THREE.InstancedMesh, hit.instanceId);
        }

        // Prioritize the directly hit mesh first, plus other nearby non-instanced meshes
        const hitMesh = hit.object as THREE.Mesh;
        const snapPool = [hitMesh, ...candidateMeshes.filter((m) => m !== hitMesh && !(m as THREE.InstancedMesh).isInstancedMesh)];
        const bvhSnap = BvhAccelerationService.getInstance().findNearestSnapPoint(
          hitPoint,
          edgeRadius,
          snapPool,
          { vertexRadius, instanceHints }
        );
        if (bvhSnap) {
          return {
            position: bvhSnap.point,
            snapType: bvhSnap.snapType,
            edgeStart: bvhSnap.edgeStart,
            edgeEnd: bvhSnap.edgeEnd,
          };
        }

        return { position: hitPoint, snapType: "face" };
      }
    }

    // 3. Empty-space ground plane fallback
    const fallbackRay = new THREE.Raycaster();
    fallbackRay.setFromCamera(ndc, camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const target = new THREE.Vector3();
    if (!fallbackRay.ray.intersectPlane(plane, target)) return null;
    return { position: target, snapType: "free" };
  }

  private applySnapVisuals(resolved: ResolvedSnapPoint): void {
    const snappedPos = resolved.position;
    this.snapMarker.position.copy(snappedPos);

    // Color-code snap marker by snap class so edge vs corner vs midpoint is unmistakable
    const colorMap: Record<SnapType, number> = {
      vertex: 0xd4ff3f,   // Acid chartreuse corner
      edge: 0x38bdf8,     // Electric cyan edge
      midpoint: 0xf59e0b, // Amber gold midpoint
      face: 0xe2e8f0,     // Neutral surface
      free: 0x94a3b8,
    };
    this.snapMarkerMaterial.color.setHex(colorMap[resolved.snapType] ?? 0xd4ff3f);

    // Scale marker adaptively to camera distance so it stays crisp at all zoom levels
    const camera = this.engine.world?.camera?.three;
    if (camera) {
      const dist = Math.max(0.25, camera.position.distanceTo(snappedPos));
      const worldRadius = THREE.MathUtils.clamp(dist * 0.0075, 0.009, 0.22);
      const scaleFactor = worldRadius / 0.08;
      this.snapMarker.scale.setScalar(scaleFactor);
    } else {
      this.snapMarker.scale.setScalar(0.5);
    }
    this.snapMarker.visible = true;

    // Highlight the exact element edge segment in 3D when snapping to an edge or midpoint
    if (resolved.edgeStart && resolved.edgeEnd) {
      this.snapEdgeGeometry.setFromPoints([resolved.edgeStart, resolved.edgeEnd]);
      const edgeMat = this.snapEdgeLine.material as THREE.LineBasicMaterial;
      edgeMat.color.setHex(resolved.snapType === "midpoint" ? 0xf59e0b : 0x38bdf8);
      this.snapEdgeLine.visible = true;
    } else {
      this.snapEdgeLine.visible = false;
    }

    this.updateSnapBadge(resolved.snapType);

    if (this.currentPoints.length > 0) {
      const p1 = this.currentPoints[0].position;
      this.previewLineGeometry.setFromPoints([p1, snappedPos]);
      this.previewLine.computeLineDistances();
      this.previewLine.visible = true;

      const dist = p1.distanceTo(snappedPos);
      const hudLive = document.getElementById("measurement-live-val");
      if (hudLive) {
        hudLive.innerText = formatMeasurementLength(dist, this.unit);
      }
    }
  }

  private updateSnapBadge(snapType: SnapType | null): void {
    if (typeof document === "undefined") return;
    const badge = document.getElementById("measurement-snap-badge");
    if (!badge) return;
    badge.style.color = "";
    if (!this.snapEnabled) {
      badge.textContent = "SNAP OFF";
      badge.removeAttribute("data-snap-type");
      return;
    }
    if (!snapType) {
      badge.textContent = "EDGE · VERTEX";
      badge.removeAttribute("data-snap-type");
      return;
    }
    const labels: Record<SnapType, string> = {
      vertex: "SNAP: VERTEX",
      edge: "SNAP: EDGE",
      midpoint: "SNAP: MIDPOINT",
      face: "SNAP: FACE",
      free: "FREE",
    };
    badge.textContent = labels[snapType];
    badge.setAttribute("data-snap-type", snapType);
  }

  private handlePointerMove(e: PointerEvent) {
    const seq = ++this.pointerMoveSeq;
    void this.resolveSnapAtEvent(e).then((resolved) => {
      if (seq !== this.pointerMoveSeq || !this.isMeasuring) return;
      if (!resolved) {
        this.lastResolvedSnap = null;
        this.snapMarker.visible = false;
        this.snapEdgeLine.visible = false;
        this.updateSnapBadge(null);
        return;
      }
      this.lastResolvedSnap = {
        clientX: e.clientX,
        clientY: e.clientY,
        result: resolved,
        timestamp: Date.now(),
      };
      this.applySnapVisuals(resolved);
    });
  }

  private handlePointerClick(e: PointerEvent) {
    // Use the hover-cached snap immediately if cursor hasn't moved > 8px (0ms click latency)
    const cached = this.lastResolvedSnap;
    if (
      cached &&
      Date.now() - cached.timestamp < 500 &&
      Math.hypot(e.clientX - cached.clientX, e.clientY - cached.clientY) <= 8
    ) {
      this.commitMeasurementPoint(cached.result);
      return;
    }

    const seq = ++this.pointerMoveSeq;
    void this.resolveSnapAtEvent(e).then((resolved) => {
      if (!this.isMeasuring || !resolved) return;
      if (seq === this.pointerMoveSeq) {
        this.applySnapVisuals(resolved);
      }
      this.commitMeasurementPoint(resolved);
    });
  }

  private commitMeasurementPoint(resolved: ResolvedSnapPoint): void {
    const newPt: MeasurementPoint = {
      position: resolved.position.clone(),
      snapType: resolved.snapType,
      elementId: resolved.elementId,
      modelId: resolved.modelId,
    };

    this.currentPoints.push(newPt);
    SoundManager.getInstance().playSnap();

    if (this.activeType === "distance" || this.activeType === "delta") {
      if (this.currentPoints.length >= 2) {
        this.finalizeDistanceMeasurement(this.currentPoints[0], this.currentPoints[1]);
        this.currentPoints = [];
        this.previewLine.visible = false;
        this.snapEdgeLine.visible = false;
      }
    } else if (this.activeType === "angle") {
      if (this.currentPoints.length >= 3) {
        this.finalizeAngleMeasurement(this.currentPoints[0], this.currentPoints[1], this.currentPoints[2]);
        this.currentPoints = [];
        this.previewLine.visible = false;
        this.snapEdgeLine.visible = false;
      }
    } else if (this.activeType === "area") {
      if (this.currentPoints.length >= 3) {
        this.finalizeAreaMeasurement([...this.currentPoints]);
        this.currentPoints = [];
        this.previewLine.visible = false;
        this.snapEdgeLine.visible = false;
      }
    }
  }

  private createEndpointMarker(position: THREE.Vector3, coreHex = 0xd4ff3f): THREE.Group {
    const pin = new THREE.Group();
    pin.position.copy(position);
    pin.userData.isDimensionEndpoint = true;

    // Both halo and core MUST stay in the opaque render queue (`transparent: false`) so Three.js
    // strictly honors `renderOrder` (halo 9998 behind, bright core 9999 on top). Mixing transparent
    // halo with opaque core causes the dark halo to draw after and completely cover the core.
    const haloGeo = new THREE.SphereGeometry(0.032, 16, 16);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x0f172a,
      depthTest: false,
      depthWrite: false,
      transparent: false,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.name = "EndpointHalo";
    halo.renderOrder = 9998;
    pin.add(halo);

    // Bright precision inner core
    const coreGeo = new THREE.SphereGeometry(0.024, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: coreHex,
      depthTest: false,
      depthWrite: false,
      transparent: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.name = "EndpointCore";
    core.renderOrder = 9999;
    pin.add(core);

    this.scaleEndpointMarkerToCamera(pin);
    return pin;
  }

  private getActiveCamera(): THREE.Camera | undefined {
    return (
      this.engine.world?.camera?.three ||
      (typeof window !== "undefined" ? (window as any).viewer_world?.camera?.three : undefined)
    );
  }

  private getActiveRendererDom(): HTMLElement | null {
    return (
      (this.engine.world?.renderer as any)?.three?.domElement ||
      (typeof window !== "undefined" ? (window as any).viewer_world?.renderer?.three?.domElement : null) ||
      (typeof document !== "undefined" ? document.querySelector<HTMLElement>("#container canvas") : null) ||
      (typeof document !== "undefined" ? document.getElementById("container") : null)
    );
  }

  private scaleEndpointMarkerToCamera(pin: THREE.Object3D): void {
    const camera = this.getActiveCamera();
    if (!camera) return;
    const domEl = this.getActiveRendererDom();
    const viewportH = Math.max(240, domEl?.clientHeight || (typeof window !== "undefined" ? window.innerHeight : 800));

    // Constant crisp screen-space radius (~4.2px core / ~5.6px outer dark ring) across near & far endpoints
    let worldPerPx = 0.004;
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const persp = camera as THREE.PerspectiveCamera;
      const dist = Math.max(0.2, camera.position.distanceTo(pin.position));
      const fovRad = THREE.MathUtils.degToRad(persp.fov || 55);
      worldPerPx = (2 * dist * Math.tan(fovRad * 0.5)) / viewportH;
    } else if ((camera as THREE.OrthographicCamera).isOrthographicCamera) {
      const ortho = camera as THREE.OrthographicCamera;
      worldPerPx = Math.abs(ortho.top - ortho.bottom) / Math.max(0.001, ortho.zoom || 1) / viewportH;
    }

    const desiredCoreRadius = THREE.MathUtils.clamp(worldPerPx * 4.2, 0.004, 0.45);
    pin.scale.setScalar(desiredCoreRadius / 0.024);
  }

  private finalizeDistanceMeasurement(p1: MeasurementPoint, p2: MeasurementPoint) {
    const dist = p1.position.distanceTo(p2.position);
    const dx = Math.abs(p2.position.x - p1.position.x);
    const dy = Math.abs(p2.position.y - p1.position.y);
    const dz = Math.abs(p2.position.z - p1.position.z);

    const group = new THREE.Group();

    // 3D Solid Measurement Line
    const lineGeo = new THREE.BufferGeometry().setFromPoints([p1.position, p2.position]);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xd4ff3f,
      linewidth: 2,
      depthTest: false,
    });
    const line = new THREE.Line(lineGeo, lineMat);
    line.renderOrder = 9997;
    group.add(line);

    // Camera-scaled high-contrast architectural endpoint pins
    group.add(this.createEndpointMarker(p1.position, 0xd4ff3f));
    group.add(this.createEndpointMarker(p2.position, 0xd4ff3f));

    this.overlayGroup.add(group);

    const item: DimensionItem = {
      id: `dim_${Date.now()}`,
      type: this.activeType === "delta" ? "delta" : "distance",
      start: p1,
      end: p2,
      value: dist,
      formattedValue: formatMeasurementLength(dist, this.unit),
      deltaX: dx,
      deltaY: dy,
      deltaZ: dz,
      lineGroup: group,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    this.measurements.push(item);
    this.create3DHtmlLabel(item, p1.position.clone().lerp(p2.position, 0.5));
    this.updateMeasurementUI();
  }

  private finalizeAngleMeasurement(p1: MeasurementPoint, p2: MeasurementPoint, p3: MeasurementPoint) {
    const v1 = new THREE.Vector3().subVectors(p1.position, p2.position).normalize();
    const v2 = new THREE.Vector3().subVectors(p3.position, p2.position).normalize();
    const rad = v1.angleTo(v2);
    const deg = THREE.MathUtils.radToDeg(rad);

    const group = new THREE.Group();
    const lineGeo = new THREE.BufferGeometry().setFromPoints([p1.position, p2.position, p3.position]);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, depthTest: false });
    const line = new THREE.Line(lineGeo, lineMat);
    line.renderOrder = 9997;
    group.add(line);
    this.overlayGroup.add(group);

    const item: DimensionItem = {
      id: `dim_${Date.now()}`,
      type: "angle",
      start: p1,
      end: p3,
      extraPoints: [p2],
      value: deg,
      formattedValue: `${deg.toFixed(1)}°`,
      lineGroup: group,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    this.measurements.push(item);
    this.create3DHtmlLabel(item, p2.position);
    this.updateMeasurementUI();
  }

  private finalizeAreaMeasurement(points: MeasurementPoint[]) {
    // Polygon area calculation via cross product
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const pA = points[i].position;
      const pB = points[(i + 1) % points.length].position;
      area += (pA.x * pB.z - pB.x * pA.z);
    }
    area = Math.abs(area) * 0.5;

    const group = new THREE.Group();
    const pts = points.map((p) => p.position);
    pts.push(points[0].position);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xa855f7, depthTest: false, linewidth: 2 });
    const line = new THREE.Line(lineGeo, lineMat);
    line.renderOrder = 9997;
    group.add(line);

    // Render transparent 3D polygon fill
    try {
      const shape = new THREE.Shape();
      shape.moveTo(points[0].position.x, points[0].position.z);
      for (let i = 1; i < points.length; i++) {
        shape.lineTo(points[i].position.x, points[i].position.z);
      }
      shape.closePath();

      const polyGeo = new THREE.ShapeGeometry(shape);
      polyGeo.rotateX(-Math.PI / 2);
      polyGeo.translate(0, points[0].position.y, 0);

      const polyMat = new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const polyMesh = new THREE.Mesh(polyGeo, polyMat);
      polyMesh.renderOrder = 9996;
      group.add(polyMesh);
    } catch (e) { }

    this.overlayGroup.add(group);

    const center = new THREE.Vector3();
    points.forEach((p) => center.add(p.position));
    center.divideScalar(points.length);

    const item: DimensionItem = {
      id: `dim_${Date.now()}`,
      type: "area",
      start: points[0],
      extraPoints: points.slice(1),
      value: area,
      formattedValue: formatMeasurementArea(area, this.unit),
      lineGroup: group,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    this.measurements.push(item);
    this.create3DHtmlLabel(item, center);
    this.updateMeasurementUI();
  }

  private buildLabelInnerHtml(item: DimensionItem): string {
    const deltasHtml =
      item.deltaX !== undefined
        ? `<span class="dim-deltas">${formatMeasurementDeltas(item.deltaX, item.deltaY ?? 0, item.deltaZ ?? 0, this.unit)}</span>`
        : "";
    return `
      <span class="dim-val">${item.formattedValue}</span>
      ${deltasHtml}
    `;
  }

  private getOrCreateLabelHost(): HTMLElement | null {
    if (typeof document === "undefined") return null;
    let host = document.getElementById("measurement-labels-overlay");
    if (host && host.isConnected) return host;

    const container = document.getElementById("container");
    const appRoot = document.getElementById("app") || container?.parentElement || document.body;
    if (!appRoot) return container;

    host = document.createElement("div");
    host.id = "measurement-labels-overlay";
    host.style.cssText =
      "position:fixed;inset:0;pointer-events:none;z-index:6;overflow:hidden;";
    appRoot.appendChild(host);
    return host;
  }

  private create3DHtmlLabel(item: DimensionItem, pos: THREE.Vector3) {
    if (typeof document === "undefined") return;
    const host = this.getOrCreateLabelHost();
    if (!host) return;

    const label = document.createElement("div");
    label.className = "bim-3d-dimension-badge";
    label.innerHTML = this.buildLabelInnerHtml(item);
    label.style.position = "absolute";
    label.style.pointerEvents = "none";
    label.style.transform = "translate(-50%, -50%)";
    host.appendChild(label);
    item.labelElement = label;

    // Immediately project onto 2D screen coordinates
    this.updateLabelPosition(label, pos);
  }

  private updateLabelPosition(label: HTMLElement, worldPos: THREE.Vector3) {
    const camera = this.getActiveCamera();
    const domEl = this.getActiveRendererDom();
    if (!camera || !domEl) return;

    if (!label.isConnected) {
      const host = this.getOrCreateLabelHost();
      if (host) host.appendChild(label);
    }

    camera.updateMatrixWorld();
    const p = worldPos.clone().project(camera);
    const rect = domEl.getBoundingClientRect();
    const w = rect.width > 0 ? rect.width : domEl.clientWidth || 1000;
    const h = rect.height > 0 ? rect.height : domEl.clientHeight || 800;
    const offsetLeft = rect.width > 0 ? rect.left : 0;
    const offsetTop = rect.height > 0 ? rect.top : 0;

    const x = offsetLeft + ((p.x + 1) * w) / 2;
    const y = offsetTop + ((-p.y + 1) * h) / 2;

    const inFrustum = Number.isFinite(x) && Number.isFinite(y) && p.z >= -1 && p.z <= 1;
    label.style.left = `${x.toFixed(1)}px`;
    label.style.top = `${y.toFixed(1)}px`;
    label.style.display = inFrustum ? "inline-flex" : "none";
  }

  public updateOverlayPositions() {
    for (const item of this.measurements) {
      if (item.lineGroup) {
        for (const child of item.lineGroup.children) {
          if (child.userData?.isDimensionEndpoint) {
            this.scaleEndpointMarkerToCamera(child);
          }
        }
      }
      if (!item.labelElement) continue;
      let worldPos = item.start.position;
      if (item.type === "angle" && item.extraPoints?.[0]) {
        worldPos = item.extraPoints[0].position;
      } else if (item.end) {
        worldPos = item.start.position.clone().lerp(item.end.position, 0.5);
      }
      this.updateLabelPosition(item.labelElement, worldPos);
    }
  }

  public updateMeasurementUI() {
    if (typeof document === "undefined") return;

    const listEl = document.getElementById("measurement-list");
    const countEl = document.getElementById("measurement-count-badge");
    const modeEl = document.getElementById("measurement-mode-badge");

    if (countEl) countEl.innerText = `${this.measurements.length} Active`;
    if (modeEl) modeEl.innerText = this.isMeasuring ? this.activeType.toUpperCase() : "Ready";
    const unitSel = document.getElementById("select-measure-unit") as HTMLSelectElement | null;
    if (unitSel && unitSel.value !== this.unit) unitSel.value = this.unit;
    if (this.currentPoints.length === 0) {
      const hudLive = document.getElementById("measurement-live-val");
      if (hudLive) hudLive.innerText = formatMeasurementLength(0, this.unit);
    }

    if (listEl) {
      listEl.innerHTML = "";
      if (this.measurements.length === 0) {
        listEl.innerHTML = `<div class="empty-state-hint">No active measurements. Select a tool above and click on 3D geometry.</div>`;
      } else {
        this.measurements.forEach((m) => {
          const row = document.createElement("div");
          row.className = "measurement-item-row";
          row.innerHTML = `
            <div class="m-info">
              <span class="m-type-tag ${m.type}">${m.type}</span>
              <span class="m-value">${m.formattedValue}</span>
              <span class="m-time">${m.createdAt}</span>
            </div>
            <button class="btn-icon-danger delete-dim-btn" data-id="${m.id}" title="Remove measurement">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          `;
          row.querySelector(".delete-dim-btn")?.addEventListener("click", () => {
            this.removeMeasurement(m.id);
          });
          listEl.appendChild(row);
        });
      }
    }
  }
}

function eDistWithin(a: THREE.Vector3, b: THREE.Vector3, radius: number): boolean {
  return a.distanceToSquared(b) <= radius * radius;
}
