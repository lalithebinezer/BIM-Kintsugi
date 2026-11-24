/**
 * EquipmentEnvelopeSimulator — 4D Tower Crane & Swing-Radius Safety Envelope
 *
 * Places a procedural Three.js Tower Crane (mast, cabin, main jib, counter-jib,
 * hook cable, and translucent swing-radius safety zone) with full interactive
 * X / Y (plan East-West / North-South), Elevation, Jib Radius, and Slew Angle
 * transformation controls, corner presets, click-to-place picking, and localStorage persistence.
 */

import * as THREE from "three";
import { GpuPerformanceMonitor } from "../core/GpuPerformanceMonitor";
import { createFloatingWindow, type BkFloatingWindow } from "../ui/UiPlatform";

export interface CraneTransform {
  /** Plan X coordinate in meters (Three.js X — East/West) */
  x: number;
  /** Plan Y coordinate in meters (Three.js Z — North/South in BIM/CAD convention) */
  y: number;
  /** Base elevation in meters (Three.js Y — Vertical) */
  elevation: number;
  /** Jib radius in meters */
  jibRadius: number;
  /** Mast height in meters */
  mastHeight: number;
  /** Manual slew angle offset in degrees */
  slewOffsetDeg: number;
}

export interface CraneEnvelopeStatus {
  active: boolean;
  jibRadiusMeters: number;
  hookHeightMeters: number;
  slewAngleDeg: number;
  clearanceOk: boolean;
  clearanceMeters: number;
  transform: CraneTransform;
}

export type CraneCornerPreset = "NE" | "NW" | "SE" | "SW" | "CENTER" | "RESET";

const STORAGE_KEY = "bim_kintsugi_crane_transform_v1";

export class EquipmentEnvelopeSimulator {
  private static instance: EquipmentEnvelopeSimulator | null = null;
  private sceneRef: THREE.Scene | null = null;
  private craneGroup: THREE.Group | null = null;
  private jibPivot: THREE.Group | null = null;
  private envelopeMesh: THREE.Mesh | null = null;
  private active = false;

  private modelCenter = new THREE.Vector3(0, 0, 0);
  private modelSize = new THREE.Vector3(30, 22, 30);
  private modelBaseY = 0;
  private modelTopY = 22;

  private defaultTransform: CraneTransform = {
    x: 20,
    y: -8,
    elevation: 0,
    jibRadius: 32,
    mastHeight: 34,
    slewOffsetDeg: 0,
  };

  private transform: CraneTransform = { ...this.defaultTransform };
  private timelineSlewRad = 0;
  private floatWin: BkFloatingWindow | null = null;
  private onPickModeToggle: ((enabled: boolean) => void) | null = null;
  private onRequestRender: (() => void) | null = null;
  private pickModeActive = false;
  private escKeyListener: ((ev: KeyboardEvent) => void) | null = null;

  public static getInstance(): EquipmentEnvelopeSimulator {
    if (!this.instance) this.instance = new EquipmentEnvelopeSimulator();
    return this.instance;
  }

  public isActive(): boolean {
    return this.active;
  }

  public isPickModeActive(): boolean {
    return this.pickModeActive;
  }

  public setPickModeActive(next: boolean): void {
    this.pickModeActive = next;
    const btn = this.floatWin?.el.querySelector<HTMLButtonElement>("#btn-crane-pick-ground");
    if (btn) {
      btn.classList.toggle("active", next);
      btn.classList.toggle("is-active", next);
      btn.textContent = next ? "🎯 Click 3D to Place (Esc to cancel)" : "🎯 Pick in 3D";
    }
    if (typeof window !== "undefined") {
      if (this.escKeyListener) {
        window.removeEventListener("keydown", this.escKeyListener);
        this.escKeyListener = null;
      }
      if (next) {
        this.escKeyListener = (ev: KeyboardEvent) => {
          if (ev.key === "Escape") {
            this.setPickModeActive(false);
          }
        };
        window.addEventListener("keydown", this.escKeyListener);
      }
    }
    this.onPickModeToggle?.(next);
  }

  public getTransform(): CraneTransform {
    return { ...this.transform };
  }

  public toggle(
    scene: THREE.Scene,
    modelBounds?: THREE.Box3 | null,
    callbacks?: {
      onPickModeToggle?: (enabled: boolean) => void;
      onRequestRender?: () => void;
    }
  ): CraneEnvelopeStatus {
    this.onPickModeToggle = callbacks?.onPickModeToggle ?? null;
    this.onRequestRender = callbacks?.onRequestRender ?? null;

    if (this.active) {
      this.dispose(scene);
      return this.getStatus(0);
    }
    this.mount(scene, modelBounds);
    this.openTransformPanel();
    return this.getStatus(this.modelTopY);
  }

  public mount(scene: THREE.Scene, modelBounds?: THREE.Box3 | null): void {
    this.disposeMeshOnly(scene);
    this.sceneRef = scene;

    this.modelCenter.set(0, 0, 0);
    this.modelSize.set(30, 22, 30);
    this.modelBaseY = 0;
    this.modelTopY = 22;

    if (modelBounds && !modelBounds.isEmpty()) {
      modelBounds.getCenter(this.modelCenter);
      modelBounds.getSize(this.modelSize);
      this.modelBaseY = modelBounds.min.y;
      this.modelTopY = modelBounds.max.y;
    }

    const buildingHeight = Math.max(12, this.modelTopY - this.modelBaseY);
    const defaultMast = Math.round((buildingHeight + 12) * 10) / 10;
    const defaultRadius = Math.round(
      Math.max(22, Math.min(65, Math.max(this.modelSize.x, this.modelSize.z) * 0.72)) * 10
    ) / 10;

    this.defaultTransform = {
      x: Math.round((this.modelCenter.x + this.modelSize.x * 0.56 + 4) * 10) / 10,
      y: Math.round((this.modelCenter.z - this.modelSize.z * 0.25) * 10) / 10,
      elevation: Math.round(this.modelBaseY * 10) / 10,
      jibRadius: defaultRadius,
      mastHeight: defaultMast,
      slewOffsetDeg: 0,
    };

    // Restore persisted transform if close to current model bounds, else use default
    this.transform = { ...this.defaultTransform };
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CraneTransform>;
        if (
          typeof parsed.x === "number" &&
          typeof parsed.y === "number" &&
          Math.hypot(parsed.x - this.modelCenter.x, parsed.y - this.modelCenter.z) < 250
        ) {
          this.transform = {
            x: parsed.x,
            y: parsed.y,
            elevation: typeof parsed.elevation === "number" ? parsed.elevation : this.defaultTransform.elevation,
            jibRadius: typeof parsed.jibRadius === "number" ? parsed.jibRadius : this.defaultTransform.jibRadius,
            mastHeight: typeof parsed.mastHeight === "number" ? parsed.mastHeight : this.defaultTransform.mastHeight,
            slewOffsetDeg: typeof parsed.slewOffsetDeg === "number" ? parsed.slewOffsetDeg : 0,
          };
        }
      }
    } catch {
      // Ignore storage errors
    }

    this.buildCraneMesh(scene);
    this.active = true;
  }

  private buildCraneMesh(scene: THREE.Scene): void {
    this.disposeMeshOnly(scene);

    const { x, y, elevation, jibRadius, mastHeight } = this.transform;

    const root = new THREE.Group();
    root.name = "bim-kintsugi-4d-crane-envelope";
    root.position.set(x, elevation, y);

    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.45,
      metalness: 0.35,
    });
    const darkSteelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.5,
      metalness: 0.6,
    });

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.2, 3.6), darkSteelMat);
    plinth.position.y = 0.6;
    root.add(plinth);

    // Subtle ground plan X (+Red East) & Plan Y (+Blue North/South) axis guides on plinth
    const axisLen = Math.min(8, Math.max(4.5, jibRadius * 0.22));
    const xAxisMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const yAxisMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const xBar = new THREE.Mesh(new THREE.BoxGeometry(axisLen, 0.14, 0.14), xAxisMat);
    xBar.position.set(axisLen / 2, 0.15, 0);
    root.add(xBar);
    const yBar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, axisLen), yAxisMat);
    yBar.position.set(0, 0.15, axisLen / 2);
    root.add(yBar);

    const mast = new THREE.Mesh(new THREE.BoxGeometry(1.8, mastHeight, 1.8), yellowMat);
    mast.position.y = mastHeight / 2;
    root.add(mast);

    const pivot = new THREE.Group();
    pivot.position.y = mastHeight;
    pivot.rotation.y = this.timelineSlewRad + (this.transform.slewOffsetDeg * Math.PI) / 180;

    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 2.2), darkSteelMat);
    cabin.position.set(0.8, 0.2, 1.4);
    pivot.add(cabin);

    const mainJib = new THREE.Mesh(new THREE.BoxGeometry(jibRadius, 1.3, 1.2), yellowMat);
    mainJib.position.set(-jibRadius / 2, 1.2, 0);
    pivot.add(mainJib);

    const counterJib = new THREE.Mesh(new THREE.BoxGeometry(10, 1.2, 1.4), darkSteelMat);
    counterJib.position.set(5, 1.2, 0);
    pivot.add(counterJib);

    const hookLine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, Math.max(6, mastHeight * 0.45), 8),
      darkSteelMat
    );
    hookLine.position.set(-jibRadius * 0.65, -Math.max(3, mastHeight * 0.22), 0);
    pivot.add(hookLine);

    root.add(pivot);

    const envGeo = new THREE.CylinderGeometry(jibRadius, jibRadius, mastHeight + 2, 40, 1, true);
    const envMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.09,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const envMesh = new THREE.Mesh(envGeo, envMat);
    envMesh.position.y = (mastHeight + 2) / 2;
    root.add(envMesh);

    scene.add(root);
    this.craneGroup = root;
    this.jibPivot = pivot;
    this.envelopeMesh = envMesh;
    this.applyClearanceColor();
  }

  private persistTransform(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transform));
    } catch {
      // Ignore quota errors
    }
  }

  private applyClearanceColor(activeStructureTopY = this.modelTopY): void {
    if (!this.envelopeMesh) return;
    const status = this.getStatus(activeStructureTopY);
    const mat = this.envelopeMesh.material as THREE.MeshBasicMaterial;
    mat.color.setHex(status.clearanceOk ? 0x10b981 : 0xf43f5e);
  }

  /**
   * Moves crane immediately in Plan X (East-West) and Plan Y (North-South -> Three.js Z).
   */
  public setPlanPosition(x: number, y: number): CraneEnvelopeStatus {
    this.transform.x = Math.round(x * 10) / 10;
    this.transform.y = Math.round(y * 10) / 10;
    if (this.craneGroup) {
      this.craneGroup.position.x = this.transform.x;
      this.craneGroup.position.z = this.transform.y;
    }
    this.persistTransform();
    this.syncPanelInputs();
    this.onRequestRender?.();
    return this.getStatus(this.modelTopY);
  }

  public nudgePlanPosition(dx: number, dy: number): CraneEnvelopeStatus {
    return this.setPlanPosition(this.transform.x + dx, this.transform.y + dy);
  }

  public setElevation(elevation: number): CraneEnvelopeStatus {
    this.transform.elevation = Math.round(elevation * 10) / 10;
    if (this.craneGroup) {
      this.craneGroup.position.y = this.transform.elevation;
    }
    this.applyClearanceColor();
    this.persistTransform();
    this.syncPanelInputs();
    this.onRequestRender?.();
    return this.getStatus(this.modelTopY);
  }

  public setJibRadius(radiusMeters: number): CraneEnvelopeStatus {
    this.transform.jibRadius = Math.max(12, Math.min(90, Math.round(radiusMeters * 10) / 10));
    if (this.sceneRef && this.active) {
      this.buildCraneMesh(this.sceneRef);
    }
    this.persistTransform();
    this.syncPanelInputs();
    this.onRequestRender?.();
    return this.getStatus(this.modelTopY);
  }

  public setMastHeight(mastHeightMeters: number): CraneEnvelopeStatus {
    this.transform.mastHeight = Math.max(10, Math.min(140, Math.round(mastHeightMeters * 10) / 10));
    if (this.sceneRef && this.active) {
      this.buildCraneMesh(this.sceneRef);
    }
    this.persistTransform();
    this.syncPanelInputs();
    this.onRequestRender?.();
    return this.getStatus(this.modelTopY);
  }

  public setSlewOffsetDeg(deg: number): CraneEnvelopeStatus {
    this.transform.slewOffsetDeg = ((Math.round(deg) % 360) + 360) % 360;
    if (this.jibPivot) {
      this.jibPivot.rotation.y =
        this.timelineSlewRad + (this.transform.slewOffsetDeg * Math.PI) / 180;
    }
    this.persistTransform();
    this.syncPanelInputs();
    this.onRequestRender?.();
    return this.getStatus(this.modelTopY);
  }

  public applyCornerPreset(preset: CraneCornerPreset): CraneEnvelopeStatus {
    const padX = this.modelSize.x * 0.56 + 4;
    const padZ = this.modelSize.z * 0.56 + 4;
    switch (preset) {
      case "NE":
        return this.setPlanPosition(this.modelCenter.x + padX, this.modelCenter.z - padZ * 0.5);
      case "NW":
        return this.setPlanPosition(this.modelCenter.x - padX, this.modelCenter.z - padZ * 0.5);
      case "SE":
        return this.setPlanPosition(this.modelCenter.x + padX, this.modelCenter.z + padZ * 0.5);
      case "SW":
        return this.setPlanPosition(this.modelCenter.x - padX, this.modelCenter.z + padZ * 0.5);
      case "CENTER":
        return this.setPlanPosition(this.modelCenter.x, this.modelCenter.z);
      case "RESET":
        this.transform = { ...this.defaultTransform };
        if (this.sceneRef && this.active) {
          this.buildCraneMesh(this.sceneRef);
        }
        this.persistTransform();
        this.syncPanelInputs();
        this.onRequestRender?.();
        return this.getStatus(this.modelTopY);
    }
  }

  public updateForTimelineRatio(progressRatio: number, activeStructureTopY = this.modelTopY): CraneEnvelopeStatus {
    this.timelineSlewRad = progressRatio * Math.PI * 4;
    if (this.jibPivot) {
      this.jibPivot.rotation.y =
        this.timelineSlewRad + (this.transform.slewOffsetDeg * Math.PI) / 180;
    }
    this.applyClearanceColor(activeStructureTopY);
    return this.getStatus(activeStructureTopY);
  }

  public getStatus(activeStructureTopY = this.modelTopY): CraneEnvelopeStatus {
    const hookHeight = this.transform.elevation + this.transform.mastHeight;
    const clearanceMeters = Math.round((hookHeight - activeStructureTopY) * 10) / 10;
    const totalDeg = Math.round(
      (((this.timelineSlewRad * 180) / Math.PI + this.transform.slewOffsetDeg) % 360 + 360) % 360
    );
    return {
      active: this.active,
      jibRadiusMeters: Math.round(this.transform.jibRadius * 10) / 10,
      hookHeightMeters: Math.round(hookHeight * 10) / 10,
      slewAngleDeg: totalDeg,
      clearanceOk: clearanceMeters >= 3,
      clearanceMeters,
      transform: { ...this.transform },
    };
  }

  public openTransformPanel(): void {
    if (typeof document === "undefined") return;
    if (this.floatWin && document.body.contains(this.floatWin.el)) {
      this.floatWin.open();
      this.syncPanelInputs();
      return;
    }

    const span = Math.max(80, Math.round(Math.max(this.modelSize.x, this.modelSize.z) * 1.6));
    const minX = Math.min(Math.round(this.modelCenter.x - span), Math.floor(this.transform.x - 10));
    const maxX = Math.max(Math.round(this.modelCenter.x + span), Math.ceil(this.transform.x + 10));
    const minY = Math.min(Math.round(this.modelCenter.z - span), Math.floor(this.transform.y - 10));
    const maxY = Math.max(Math.round(this.modelCenter.z + span), Math.ceil(this.transform.y + 10));

    this.floatWin = createFloatingWindow({
      id: "crane-transform-hud",
      title: "Tower Crane Transform",
      size: "sm",
      preferredSlot: "left",
      minimizeMode: "pill",
      pillId: "crane-hud-reopen-pill",
      pillLabel: "🏗️ Crane Transform",
      closeButtonId: "btn-crane-hud-close",
      autoHeight: true,
      headerBadgeHtml: `<span id="crane-clearance-badge" class="bk-badge bk-badge--success crane-badge-ok">OK</span>`,
      bodyHtml: `
        <div class="bk-field">
          <div class="bk-field__label">
            <label for="crane-input-x" style="display:inline-flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:999px;background:#ef4444;display:inline-block;"></span>Position X (East / West)</label>
            <input type="number" id="crane-num-x" class="bk-input bk-input--xs bk-input--num" step="0.5" value="${this.transform.x}" style="width:72px;" />
          </div>
          <input type="range" id="crane-input-x" class="bk-range" min="${minX}" max="${maxX}" step="0.5" value="${this.transform.x}" />
        </div>

        <div class="bk-field">
          <div class="bk-field__label">
            <label for="crane-input-y" style="display:inline-flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;border-radius:999px;background:#38bdf8;display:inline-block;"></span>Position Y (North / South)</label>
            <input type="number" id="crane-num-y" class="bk-input bk-input--xs bk-input--num" step="0.5" value="${this.transform.y}" style="width:72px;" />
          </div>
          <input type="range" id="crane-input-y" class="bk-range" min="${minY}" max="${maxY}" step="0.5" value="${this.transform.y}" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <label class="bk-field">
            <span class="bk-field__label">Elevation Z (m)</span>
            <input type="number" id="crane-num-elev" class="bk-input bk-input--xs bk-input--num" step="0.5" value="${this.transform.elevation}" />
          </label>
          <label class="bk-field">
            <span class="bk-field__label">Jib Radius (m)</span>
            <input type="number" id="crane-num-radius" class="bk-input bk-input--xs bk-input--num" min="12" max="90" step="1" value="${this.transform.jibRadius}" />
          </label>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <label class="bk-field">
            <span class="bk-field__label">Mast Height (m)</span>
            <input type="number" id="crane-num-mast" class="bk-input bk-input--xs bk-input--num" min="10" max="140" step="1" value="${this.transform.mastHeight}" />
          </label>
          <label class="bk-field">
            <span class="bk-field__label">Jib Angle (°)</span>
            <input type="number" id="crane-num-slew" class="bk-input bk-input--xs bk-input--num" min="0" max="360" step="5" value="${this.transform.slewOffsetDeg}" />
          </label>
        </div>

        <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;">
          <button type="button" class="bk-btn bk-btn--secondary bk-btn--xs btn-crane-preset" data-preset="NW" style="padding:0;">NW</button>
          <button type="button" class="bk-btn bk-btn--secondary bk-btn--xs btn-crane-preset" data-preset="NE" style="padding:0;">NE</button>
          <button type="button" class="bk-btn bk-btn--secondary bk-btn--xs btn-crane-preset" data-preset="SW" style="padding:0;">SW</button>
          <button type="button" class="bk-btn bk-btn--secondary bk-btn--xs btn-crane-preset" data-preset="SE" style="padding:0;">SE</button>
          <button type="button" class="bk-btn bk-btn--secondary bk-btn--xs btn-crane-preset" data-preset="CENTER" style="padding:0;">CTR</button>
          <button type="button" class="bk-btn bk-btn--secondary bk-btn--xs btn-crane-preset" data-preset="RESET" style="padding:0;">RST</button>
        </div>

        <button type="button" id="btn-crane-pick-ground" class="bk-btn bk-btn--secondary bk-btn--sm" style="width:100%;" title="Click anywhere in the 3D scene to reposition the crane X/Y">🎯 Pick in 3D</button>
      `,
      onClose: () => {
        this.setPickModeActive(false);
      },
    });

    const panel = this.floatWin.el;
    this.floatWin.open();
    this.syncPanelInputs();

    panel.querySelector<HTMLInputElement>("#crane-input-x")?.addEventListener("input", (ev) => {
      this.setPlanPosition(Number((ev.target as HTMLInputElement).value), this.transform.y);
    });
    panel.querySelector<HTMLInputElement>("#crane-num-x")?.addEventListener("input", (ev) => {
      const v = Number((ev.target as HTMLInputElement).value);
      if (Number.isFinite(v)) this.setPlanPosition(v, this.transform.y);
    });

    panel.querySelector<HTMLInputElement>("#crane-input-y")?.addEventListener("input", (ev) => {
      this.setPlanPosition(this.transform.x, Number((ev.target as HTMLInputElement).value));
    });
    panel.querySelector<HTMLInputElement>("#crane-num-y")?.addEventListener("input", (ev) => {
      const v = Number((ev.target as HTMLInputElement).value);
      if (Number.isFinite(v)) this.setPlanPosition(this.transform.x, v);
    });

    panel.querySelector<HTMLInputElement>("#crane-num-elev")?.addEventListener("input", (ev) => {
      const v = Number((ev.target as HTMLInputElement).value);
      if (Number.isFinite(v)) this.setElevation(v);
    });
    panel.querySelector<HTMLInputElement>("#crane-num-radius")?.addEventListener("change", (ev) => {
      const v = Number((ev.target as HTMLInputElement).value);
      if (Number.isFinite(v)) this.setJibRadius(v);
    });
    panel.querySelector<HTMLInputElement>("#crane-num-mast")?.addEventListener("change", (ev) => {
      const v = Number((ev.target as HTMLInputElement).value);
      if (Number.isFinite(v)) this.setMastHeight(v);
    });
    panel.querySelector<HTMLInputElement>("#crane-num-slew")?.addEventListener("input", (ev) => {
      const v = Number((ev.target as HTMLInputElement).value);
      if (Number.isFinite(v)) this.setSlewOffsetDeg(v);
    });

    panel.querySelectorAll<HTMLButtonElement>(".btn-crane-preset").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = btn.dataset.preset as CraneCornerPreset;
        if (preset) this.applyCornerPreset(preset);
      });
    });

    panel.querySelector("#btn-crane-pick-ground")?.addEventListener("click", () => {
      this.setPickModeActive(!this.pickModeActive);
    });
  }

  private syncPanelInputs(): void {
    const panel = this.floatWin?.el;
    if (!panel) return;
    const setRangeVal = (sel: string, val: number) => {
      const el = panel.querySelector<HTMLInputElement>(sel);
      if (!el) return;
      const curMin = Number(el.min);
      const curMax = Number(el.max);
      if (Number.isFinite(curMin) && val < curMin) el.min = String(Math.floor(val - 20));
      if (Number.isFinite(curMax) && val > curMax) el.max = String(Math.ceil(val + 20));
      if (document.activeElement !== el) el.value = String(val);
    };
    const setVal = (sel: string, val: number) => {
      const el = panel.querySelector<HTMLInputElement>(sel);
      if (el && document.activeElement !== el) el.value = String(val);
    };
    setRangeVal("#crane-input-x", this.transform.x);
    setVal("#crane-num-x", this.transform.x);
    setRangeVal("#crane-input-y", this.transform.y);
    setVal("#crane-num-y", this.transform.y);
    setVal("#crane-num-elev", this.transform.elevation);
    setVal("#crane-num-radius", this.transform.jibRadius);
    setVal("#crane-num-mast", this.transform.mastHeight);
    setVal("#crane-num-slew", this.transform.slewOffsetDeg);

    const badge = panel.querySelector<HTMLElement>("#crane-clearance-badge");
    if (badge) {
      const st = this.getStatus(this.modelTopY);
      badge.textContent = st.clearanceOk ? `+${st.clearanceMeters}m OK` : `${st.clearanceMeters}m CLASH`;
      badge.classList.toggle("crane-badge-ok", st.clearanceOk);
      badge.classList.toggle("bk-badge--success", st.clearanceOk);
      badge.classList.toggle("crane-badge-clash", !st.clearanceOk);
      badge.classList.toggle("bk-badge--danger", !st.clearanceOk);
    }
  }

  public closeTransformPanel(showReopen = false): void {
    this.setPickModeActive(false);
    if (showReopen && this.active) {
      this.floatWin?.close(true);
    } else {
      this.floatWin?.destroy();
      this.floatWin = null;
    }
  }

  private disposeMeshOnly(scene?: THREE.Scene): void {
    if (this.craneGroup) {
      if (scene) scene.remove(this.craneGroup);
      else this.craneGroup.parent?.remove(this.craneGroup);
      GpuPerformanceMonitor.disposeObject3D(this.craneGroup);
      this.craneGroup = null;
      this.jibPivot = null;
      this.envelopeMesh = null;
    }
  }

  public dispose(scene?: THREE.Scene): void {
    this.closeTransformPanel();
    this.disposeMeshOnly(scene);
    this.active = false;
  }
}
