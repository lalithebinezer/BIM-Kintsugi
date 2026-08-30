import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export interface MeasurementPoint {
  position: THREE.Vector3;
  elementId?: number;
  modelId?: string;
  snapType?: "vertex" | "edge" | "face" | "free";
}

export interface DimensionItem {
  id: string;
  type: "distance" | "angle" | "area" | "delta";
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
  private activeType: "distance" | "angle" | "area" | "delta" = "distance";
  private isMeasuring: boolean = false;
  private snapEnabled: boolean = true;
  private snapTolerance: number = 0.35; // world units
  private currentPoints: MeasurementPoint[] = [];
  
  private overlayGroup: THREE.Group;
  private snapMarker: THREE.Mesh;
  private previewLine: THREE.Line;
  private previewLineGeometry: THREE.BufferGeometry;

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.overlayGroup = new THREE.Group();
    this.overlayGroup.name = "MeasurementOverlayGroup";

    if (this.engine.world?.scene?.three) {
      this.engine.world.scene.three.add(this.overlayGroup);
    }

    // Snap visual indicator sphere
    const sphereGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xd4ff3f,
      depthTest: false,
      transparent: true,
      opacity: 0.9,
    });
    this.snapMarker = new THREE.Mesh(sphereGeo, sphereMat);
    this.snapMarker.visible = false;
    this.snapMarker.renderOrder = 9999;
    this.overlayGroup.add(this.snapMarker);

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

    this.bindPointerEvents();
  }

  public static getInstance(): MeasurementSuite {
    if (!MeasurementSuite.instance) {
      MeasurementSuite.instance = new MeasurementSuite();
    }
    return MeasurementSuite.instance;
  }

  private bindPointerEvents() {
    if (typeof window === "undefined") return;

    window.addEventListener("pointermove", (e) => {
      if (!this.isMeasuring) return;
      this.handlePointerMove(e);
    });

    window.addEventListener("pointerdown", (e) => {
      if (!this.isMeasuring || e.button !== 0) return;
      // If clicking on UI controls, ignore
      const target = e.target as HTMLElement;
      if (target.closest(".bim-toolbar, .bim-modal, .sidebar-panel, #viewport-selection-bar, #measurement-panel")) {
        return;
      }
      this.handlePointerClick(e);
    });
  }

  public startMeasurement(type: "distance" | "angle" | "area" | "delta" = "distance") {
    this.activeType = type;
    this.isMeasuring = true;
    this.currentPoints = [];
    this.snapMarker.visible = false;
    this.previewLine.visible = false;

    this.updateMeasurementUI();
  }

  public stopMeasurement() {
    this.isMeasuring = false;
    this.currentPoints = [];
    this.snapMarker.visible = false;
    this.previewLine.visible = false;
    this.updateMeasurementUI();
  }

  public setSnapEnabled(enabled: boolean) {
    this.snapEnabled = enabled;
  }

  public getSnapEnabled(): boolean {
    return this.snapEnabled;
  }

  public getMeasurements(): DimensionItem[] {
    return this.measurements;
  }

  public clearAllMeasurements() {
    for (const item of this.measurements) {
      if (item.lineGroup) {
        this.overlayGroup.remove(item.lineGroup);
      }
      if (item.labelElement && item.labelElement.parentElement) {
        item.labelElement.parentElement.removeChild(item.labelElement);
      }
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
      }
      if (item.labelElement && item.labelElement.parentElement) {
        item.labelElement.parentElement.removeChild(item.labelElement);
      }
      this.measurements.splice(idx, 1);
      this.updateMeasurementUI();
    }
  }

  /**
   * Snaps a world position to the closest element vertex/edge if within tolerance.
   */
  public snapPosition(rawPos: THREE.Vector3): { position: THREE.Vector3; snapType: "vertex" | "edge" | "face" | "free" } {
    if (!this.snapEnabled) {
      return { position: rawPos.clone(), snapType: "free" };
    }

    const camera = this.engine.world?.camera?.three;
    if (!camera || !this.engine.world?.scene?.three) {
      return { position: rawPos.clone(), snapType: "free" };
    }

    // If close to an existing measurement point, snap to it
    for (const m of this.measurements) {
      if (m.start.position.distanceTo(rawPos) <= this.snapTolerance) {
        return { position: m.start.position.clone(), snapType: "vertex" };
      }
      if (m.end && m.end.position.distanceTo(rawPos) <= this.snapTolerance) {
        return { position: m.end.position.clone(), snapType: "vertex" };
      }
    }

    // Grid snapping alignment (0.1m precision)
    const snapped = rawPos.clone();
    snapped.x = Math.round(snapped.x * 10) / 10;
    snapped.y = Math.round(snapped.y * 10) / 10;
    snapped.z = Math.round(snapped.z * 10) / 10;

    if (snapped.distanceTo(rawPos) <= this.snapTolerance) {
      return { position: snapped, snapType: "vertex" };
    }

    return { position: rawPos.clone(), snapType: "face" };
  }

  private handlePointerMove(e: PointerEvent) {
    const rawPos = this.getWorldPositionFromEvent(e);
    if (!rawPos) return;

    const { position: snappedPos } = this.snapPosition(rawPos);
    this.snapMarker.position.copy(snappedPos);
    this.snapMarker.visible = true;

    if (this.currentPoints.length > 0) {
      const p1 = this.currentPoints[0].position;
      const pts = [p1, snappedPos];
      this.previewLineGeometry.setFromPoints(pts);
      this.previewLine.computeLineDistances();
      this.previewLine.visible = true;

      // Update real-time live distance in HUD
      const dist = p1.distanceTo(snappedPos);
      const hudLive = document.getElementById("measurement-live-val");
      if (hudLive) {
        hudLive.innerText = `${dist.toFixed(3)} m`;
      }
    }
  }

  private handlePointerClick(e: PointerEvent) {
    const rawPos = this.getWorldPositionFromEvent(e);
    if (!rawPos) return;

    const { position: snappedPos, snapType } = this.snapPosition(rawPos);
    const newPt: MeasurementPoint = {
      position: snappedPos,
      snapType,
    };

    this.currentPoints.push(newPt);

    if (this.activeType === "distance" || this.activeType === "delta") {
      if (this.currentPoints.length >= 2) {
        this.finalizeDistanceMeasurement(this.currentPoints[0], this.currentPoints[1]);
        this.currentPoints = [];
        this.previewLine.visible = false;
      }
    } else if (this.activeType === "angle") {
      if (this.currentPoints.length >= 3) {
        this.finalizeAngleMeasurement(this.currentPoints[0], this.currentPoints[1], this.currentPoints[2]);
        this.currentPoints = [];
        this.previewLine.visible = false;
      }
    } else if (this.activeType === "area") {
      if (this.currentPoints.length >= 3) {
        this.finalizeAreaMeasurement([...this.currentPoints]);
        this.currentPoints = [];
        this.previewLine.visible = false;
      }
    }
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

    // Endpoints
    const endGeo = new THREE.SphereGeometry(0.06, 12, 12);
    const endMat = new THREE.MeshBasicMaterial({ color: 0xd4ff3f, depthTest: false });
    const s1 = new THREE.Mesh(endGeo, endMat);
    s1.position.copy(p1.position);
    s1.renderOrder = 9998;
    const s2 = new THREE.Mesh(endGeo, endMat);
    s2.position.copy(p2.position);
    s2.renderOrder = 9998;
    group.add(s1);
    group.add(s2);

    this.overlayGroup.add(group);

    const item: DimensionItem = {
      id: `dim_${Date.now()}`,
      type: this.activeType === "delta" ? "delta" : "distance",
      start: p1,
      end: p2,
      value: dist,
      formattedValue: `${dist.toFixed(3)} m`,
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
    const lineMat = new THREE.LineBasicMaterial({ color: 0xa855f7, depthTest: false });
    const line = new THREE.Line(lineGeo, lineMat);
    line.renderOrder = 9997;
    group.add(line);
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
      formattedValue: `${area.toFixed(2)} m²`,
      lineGroup: group,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    this.measurements.push(item);
    this.create3DHtmlLabel(item, center);
    this.updateMeasurementUI();
  }

  private create3DHtmlLabel(item: DimensionItem, pos: THREE.Vector3) {
    if (typeof document === "undefined") return;
    const container = document.getElementById("container");
    if (!container) return;

    const label = document.createElement("div");
    label.className = "bim-3d-dimension-badge";
    label.innerHTML = `
      <span class="dim-val">${item.formattedValue}</span>
      ${item.deltaX !== undefined ? `<span class="dim-deltas">ΔX: ${item.deltaX.toFixed(2)}m · ΔY: ${item.deltaY?.toFixed(2)}m · ΔZ: ${item.deltaZ?.toFixed(2)}m</span>` : ""}
    `;
    label.style.position = "absolute";
    label.style.pointerEvents = "none";
    label.style.transform = "translate(-50%, -50%)";
    container.appendChild(label);
    item.labelElement = label;

    // Attach frame update to keep label projected onto 2D screen
    this.updateLabelPosition(label, pos);
  }

  private updateLabelPosition(label: HTMLElement, worldPos: THREE.Vector3) {
    const camera = this.engine.world?.camera?.three;
    const renderer = this.engine.world?.renderer?.three;
    if (!camera || !renderer) return;

    const p = worldPos.clone().project(camera);
    const w = renderer.domElement.clientWidth || 1000;
    const h = renderer.domElement.clientHeight || 800;

    const x = ((p.x + 1) * w) / 2;
    const y = ((-p.y + 1) * h) / 2;

    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
    label.style.display = p.z < 1 ? "block" : "none";
  }

  private getWorldPositionFromEvent(e: PointerEvent): THREE.Vector3 | null {
    const container = document.getElementById("container");
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const camera = this.engine.world?.camera?.three;
    if (!camera) return new THREE.Vector3(x * 10, 0, -y * 10);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);
    return target;
  }

  public updateMeasurementUI() {
    if (typeof document === "undefined") return;

    const listEl = document.getElementById("measurement-list");
    const countEl = document.getElementById("measurement-count-badge");
    const modeEl = document.getElementById("measurement-mode-badge");

    if (countEl) countEl.innerText = `${this.measurements.length} Active`;
    if (modeEl) modeEl.innerText = this.isMeasuring ? `Measuring: ${this.activeType.toUpperCase()}` : "Ready";

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
