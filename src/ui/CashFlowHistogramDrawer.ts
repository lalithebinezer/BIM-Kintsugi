/**
 * CashFlowHistogramDrawer — Floating Draggable & Resizable 4D Cash-Flow & Resource Load Histogram
 *
 * Aggregates ScheduleManager tasks into weekly or monthly buckets, plotting:
 *  - Cash Flow mode: period spend bars ($) + cumulative spend S-Curve
 *  - Resource mode: stacked Labor (LAB_*), Equipment (EQ_*), Material (MAT_*),
 *    and Trade Crew counts active per period
 *
 * Floats freely above the 3D viewport with header drag, corner resize, collapse/expand,
 * reset-position, viewport clamping, localStorage persistence, and theme-aware SVG colors.
 * Synced live to the 4D timeline playhead; clicking any bar scrubs the 4D simulation date.
 */

import type { ScheduleTask } from "../modules/ScheduleManager";

export type HistogramGranularity = "week" | "month";
export type HistogramViewMode = "cashflow" | "resources";

export interface HistogramPeriodBucket {
  key: string;
  label: string;
  startMs: number;
  endMs: number;
  periodCost: number;
  cumulativeCost: number;
  laborCount: number;
  equipmentCount: number;
  materialCount: number;
  tradeTaskCount: number;
  totalActiveTasks: number;
}

export interface FloatingHistogramGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
  collapsed: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const FLOAT_STORAGE_KEY = "bim_kintsugi_cfh_float_v1";
const MIN_FLOAT_WIDTH = 300;
const MAX_FLOAT_WIDTH = 1120;
const MIN_FLOAT_HEIGHT = 180;
const MAX_FLOAT_HEIGHT = 560;
const DEFAULT_FLOAT_WIDTH = 640;
const DEFAULT_FLOAT_HEIGHT = 244;

function formatPeriodLabel(d: Date, granularity: HistogramGranularity): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (granularity === "month") {
    return `${months[d.getUTCMonth()]} '${String(d.getUTCFullYear()).slice(-2)}`;
  }
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

export function buildCashFlowHistogramBuckets(
  tasks: ScheduleTask[],
  granularity: HistogramGranularity = "month"
): HistogramPeriodBucket[] {
  const leafTasks = tasks.filter(
    (t) => !t.isSummary && t.startDate && t.endDate
  );
  if (leafTasks.length === 0) return [];

  let minMs = Infinity;
  let maxMs = -Infinity;
  for (const t of leafTasks) {
    const s = new Date(t.startDate).getTime();
    const e = new Date(t.endDate).getTime();
    if (!Number.isFinite(s) || !Number.isFinite(e)) continue;
    if (s < minMs) minMs = s;
    if (e > maxMs) maxMs = e;
  }
  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) return [];

  const buckets: HistogramPeriodBucket[] = [];
  if (granularity === "month") {
    const startDate = new Date(minMs);
    let cur = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
    const hardLimit = 60;
    while (cur.getTime() <= maxMs && buckets.length < hardLimit) {
      const next = new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth() + 1, 1));
      buckets.push({
        key: `${cur.getUTCFullYear()}-${String(cur.getUTCMonth() + 1).padStart(2, "0")}`,
        label: formatPeriodLabel(cur, "month"),
        startMs: cur.getTime(),
        endMs: next.getTime() - 1,
        periodCost: 0,
        cumulativeCost: 0,
        laborCount: 0,
        equipmentCount: 0,
        materialCount: 0,
        tradeTaskCount: 0,
        totalActiveTasks: 0,
      });
      cur = next;
    }
  } else {
    const stepMs = 7 * DAY_MS;
    const hardLimit = 80;
    let curMs = minMs;
    while (curMs <= maxMs && buckets.length < hardLimit) {
      const d = new Date(curMs);
      buckets.push({
        key: d.toISOString().slice(0, 10),
        label: formatPeriodLabel(d, "week"),
        startMs: curMs,
        endMs: curMs + stepMs - 1,
        periodCost: 0,
        cumulativeCost: 0,
        laborCount: 0,
        equipmentCount: 0,
        materialCount: 0,
        tradeTaskCount: 0,
        totalActiveTasks: 0,
      });
      curMs += stepMs;
    }
  }

  for (const t of leafTasks) {
    const tStart = new Date(t.startDate).getTime();
    const tEnd = Math.max(tStart + DAY_MS, new Date(t.endDate).getTime());
    const tDuration = Math.max(DAY_MS, tEnd - tStart);
    const taskCost =
      t.totalCost && t.totalCost > 0
        ? t.totalCost
        : (t.unitCost || 0) * Math.max(1, t.quantity || t.elementIds?.size || 1);

    const upperName = (t.name || "").toUpperCase();
    const isLab = /^(LAB_|CREW|LABOR|LABOUR)/i.test(upperName);
    const isEq = /^(EQ_|CRANE|PUMP|EQUIP)/i.test(upperName);
    const isMat = /^(MAT_|SUPPLY|SHUTTER|PROCURE)/i.test(upperName);

    for (const b of buckets) {
      const overlapStart = Math.max(tStart, b.startMs);
      const overlapEnd = Math.min(tEnd, b.endMs);
      if (overlapEnd <= overlapStart) continue;
      const ratio = (overlapEnd - overlapStart) / tDuration;
      b.periodCost += taskCost * ratio;
      b.totalActiveTasks++;
      if (isLab) b.laborCount++;
      else if (isEq) b.equipmentCount++;
      else if (isMat) b.materialCount++;
      else b.tradeTaskCount++;
    }
  }

  let running = 0;
  for (const b of buckets) {
    b.periodCost = Math.round(b.periodCost);
    running += b.periodCost;
    b.cumulativeCost = running;
  }
  return buckets;
}

export class CashFlowHistogramDrawer {
  private static instance: CashFlowHistogramDrawer | null = null;
  private el: HTMLDivElement | null = null;
  private granularity: HistogramGranularity = "month";
  private mode: HistogramViewMode = "cashflow";
  private lastTasks: ScheduleTask[] = [];
  private lastDateMs: number | undefined;
  private onScrubDate: ((dateMs: number) => void) | null = null;
  private onCloseCallback: (() => void) | null = null;
  private geometry: FloatingHistogramGeometry;
  private resizeListenerAttached = false;

  private constructor() {
    this.geometry = this.computeDefaultGeometry();
  }

  public static getInstance(): CashFlowHistogramDrawer {
    if (!this.instance) this.instance = new CashFlowHistogramDrawer();
    return this.instance;
  }

  private getViewportSize(): { vw: number; vh: number } {
    const vw = typeof window !== "undefined" && window.innerWidth > 0 ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" && window.innerHeight > 0 ? window.innerHeight : 800;
    return { vw, vh };
  }

  private computeDefaultGeometry(): FloatingHistogramGeometry {
    const { vw, vh } = this.getViewportSize();
    const safeMinW = Math.min(MIN_FLOAT_WIDTH, Math.max(260, vw - 16));

    // Read live HUD landmark bounds so the floating window spawns cleanly clear of Header, Quick-Views, ViewCube & Bottom Dock
    let headerBottom = 56;
    let topClearance = 126;
    let bottomDockTop = vh - 96;
    let minimapLeft = vw - 12;
    if (typeof document !== "undefined") {
      const hdr = document.querySelector("header")?.getBoundingClientRect();
      if (hdr && hdr.height > 0) headerBottom = Math.ceil(hdr.bottom);

      const topLeft = document.querySelector(".hud-anchor-top-left")?.getBoundingClientRect();
      const viewCube = document.querySelector(".view-cube-layer")?.getBoundingClientRect();
      const topCandidates = [headerBottom + 8];
      if (topLeft && topLeft.height > 0 && topLeft.bottom < vh * 0.45) {
        topCandidates.push(Math.ceil(topLeft.bottom) + 8);
      }
      if (viewCube && viewCube.height > 0 && viewCube.bottom < vh * 0.45) {
        topCandidates.push(Math.ceil(viewCube.bottom) + 8);
      }
      topClearance = Math.max(...topCandidates);

      const timeline = document.querySelector(".timeline-panel");
      const dock = document.querySelector("#bottom-toolbar");
      const activeDock =
        timeline && getComputedStyle(timeline).display !== "none"
          ? timeline.getBoundingClientRect()
          : dock?.getBoundingClientRect();
      if (activeDock && activeDock.height > 0 && activeDock.top > headerBottom + 80) {
        bottomDockTop = Math.floor(activeDock.top);
      }

      const minimap = document.querySelector(".hud-anchor-bottom-right");
      if (minimap && getComputedStyle(minimap).display !== "none") {
        const mr = minimap.getBoundingClientRect();
        if (mr.width > 0 && mr.top > vh * 0.4) minimapLeft = Math.floor(mr.left);
      }
    }

    const availH = Math.max(140, bottomDockTop - topClearance - 12);
    const height = Math.round(
      vh <= 480
        ? Math.max(136, Math.min(180, bottomDockTop - headerBottom - 16))
        : Math.max(Math.min(MIN_FLOAT_HEIGHT, availH), Math.min(DEFAULT_FLOAT_HEIGHT, availH))
    );

    // On wide desktop (>= 1024px), leave left clear of Crane HUD (300px) and right clear of Minimap
    const maxDesktopW =
      vw >= 1024 ? Math.min(DEFAULT_FLOAT_WIDTH, Math.max(safeMinW, minimapLeft - 316)) : DEFAULT_FLOAT_WIDTH;
    const width = Math.round(Math.max(safeMinW, Math.min(maxDesktopW, vw - 16)));

    let left = Math.max(8, Math.round((vw - width) / 2));
    if (vw >= 1024) {
      if (left < 304 && minimapLeft - width - 12 >= 304) {
        left = Math.min(308, minimapLeft - width - 12);
      } else if (left + width > minimapLeft - 10) {
        left = Math.max(8, minimapLeft - width - 12);
      }
    }

    const top =
      vh <= 480
        ? Math.max(headerBottom + 6, Math.min(topClearance, bottomDockTop - height - 8))
        : Math.max(topClearance, Math.min(bottomDockTop - height - 12, Math.round(topClearance + (availH - height) / 2)));

    return { left, top, width, height, collapsed: false };
  }

  private clampGeometry(geom: FloatingHistogramGeometry): FloatingHistogramGeometry {
    const { vw, vh } = this.getViewportSize();
    const safeMinW = Math.min(MIN_FLOAT_WIDTH, Math.max(260, vw - 16));
    const maxW = Math.max(safeMinW, Math.min(MAX_FLOAT_WIDTH, vw - 16));
    const minH = vh <= 480 ? 148 : MIN_FLOAT_HEIGHT;
    const maxH = Math.max(minH, Math.min(MAX_FLOAT_HEIGHT, vh - 76));
    const width = Math.round(Math.max(safeMinW, Math.min(maxW, geom.width)));
    const height = Math.round(Math.max(minH, Math.min(maxH, geom.height)));
    const effectiveH = geom.collapsed ? 48 : height;
    const left = Math.round(Math.max(8, Math.min(Math.max(8, vw - width - 8), geom.left)));
    const top = Math.round(Math.max(54, Math.min(Math.max(54, vh - effectiveH - 10), geom.top)));
    return { left, top, width, height, collapsed: Boolean(geom.collapsed) };
  }

  private loadPersistedGeometry(): FloatingHistogramGeometry {
    const fallback = this.computeDefaultGeometry();
    try {
      const raw = localStorage.getItem(FLOAT_STORAGE_KEY);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw) as Partial<FloatingHistogramGeometry>;
      if (
        typeof parsed.left === "number" &&
        typeof parsed.top === "number" &&
        typeof parsed.width === "number" &&
        typeof parsed.height === "number"
      ) {
        return this.clampGeometry({
          left: parsed.left,
          top: parsed.top,
          width: parsed.width,
          height: parsed.height,
          collapsed: Boolean(parsed.collapsed),
        });
      }
    } catch {
      // Ignore invalid persisted layout
    }
    return fallback;
  }

  private persistGeometry(): void {
    try {
      localStorage.setItem(FLOAT_STORAGE_KEY, JSON.stringify(this.geometry));
    } catch {
      // Ignore storage quota errors
    }
  }

  private applyGeometryToDom(): void {
    if (!this.el) return;
    this.geometry = this.clampGeometry(this.geometry);
    this.el.style.left = `${this.geometry.left}px`;
    this.el.style.top = `${this.geometry.top}px`;
    this.el.style.width = `${this.geometry.width}px`;
    this.el.style.height = this.geometry.collapsed ? "auto" : `${this.geometry.height}px`;
    this.el.classList.toggle("collapsed", this.geometry.collapsed);
    const collapseBtn = this.el.querySelector<HTMLButtonElement>("#cfh-collapse-btn");
    if (collapseBtn) {
      collapseBtn.textContent = this.geometry.collapsed ? "▢" : "—";
      collapseBtn.title = this.geometry.collapsed
        ? "Expand Cash-Flow Histogram"
        : "Minimize to Floating Bar";
    }
  }

  public getFloatingGeometry(): FloatingHistogramGeometry {
    return { ...this.geometry };
  }

  public setFloatingPosition(left: number, top: number): void {
    this.geometry = this.clampGeometry({ ...this.geometry, left, top });
    this.applyGeometryToDom();
    this.persistGeometry();
  }

  public setFloatingSize(width: number, height: number): void {
    this.geometry = this.clampGeometry({ ...this.geometry, width, height, collapsed: false });
    this.applyGeometryToDom();
    this.persistGeometry();
    if (this.isOpen()) this.render(this.lastTasks, this.lastDateMs);
  }

  public setCollapsed(collapsed: boolean): void {
    this.geometry = this.clampGeometry({ ...this.geometry, collapsed });
    this.applyGeometryToDom();
    this.persistGeometry();
  }

  public resetFloatingPosition(): void {
    this.geometry = this.computeDefaultGeometry();
    this.applyGeometryToDom();
    this.persistGeometry();
    if (this.isOpen()) this.render(this.lastTasks, this.lastDateMs);
  }

  public isOpen(): boolean {
    return Boolean(this.el && !this.el.classList.contains("hidden"));
  }

  public toggle(
    tasks: ScheduleTask[],
    currentDateMs: number | undefined,
    onScrubDate: (dateMs: number) => void,
    onClose?: () => void
  ): void {
    this.onScrubDate = onScrubDate;
    if (onClose !== undefined) this.onCloseCallback = onClose;
    if (this.isOpen()) {
      this.close();
    } else {
      this.open(tasks, currentDateMs, onScrubDate, onClose);
    }
  }

  public open(
    tasks: ScheduleTask[],
    currentDateMs: number | undefined,
    onScrubDate: (dateMs: number) => void,
    onClose?: () => void
  ): void {
    this.onScrubDate = onScrubDate;
    if (onClose !== undefined) this.onCloseCallback = onClose;
    this.ensureDom();
    this.applyGeometryToDom();
    this.el?.classList.remove("hidden");
    this.render(tasks, currentDateMs);
  }

  public close(): void {
    if (!this.el || this.el.classList.contains("hidden")) return;
    this.el.classList.add("hidden");
    this.onCloseCallback?.();
  }

  private ensureDom(): void {
    if (this.el) return;
    this.geometry = this.loadPersistedGeometry();

    const div = document.createElement("div");
    div.id = "cashflow-histogram-drawer";
    div.className = "cashflow-histogram-drawer floating-window hidden";
    div.setAttribute("role", "dialog");
    div.setAttribute("aria-label", "4D Cash-Flow and Resource Histogram");
    div.innerHTML = `
      <div class="cfh-header" id="cfh-drag-header" title="Drag to move floating Cash-Flow Histogram">
        <div class="cfh-title-group">
          <span class="cfh-drag-grip" aria-hidden="true">⋮⋮</span>
          <span class="cfh-title">4D Cash-Flow &amp; Resource Histogram</span>
          <span class="cfh-summary" id="cfh-summary-pill">--</span>
        </div>
        <div class="cfh-controls">
          <div class="timeline-seg-group">
            <button type="button" class="btn-timeline-csv active" data-cfh-mode="cashflow">Cash Flow ($)</button>
            <button type="button" class="btn-timeline-csv" data-cfh-mode="resources">Resources</button>
          </div>
          <div class="timeline-seg-group">
            <button type="button" class="btn-timeline-csv active" data-cfh-gran="month">Monthly</button>
            <button type="button" class="btn-timeline-csv" data-cfh-gran="week">Weekly</button>
          </div>
          <button type="button" id="cfh-reset-pos-btn" class="btn-secondary cfh-win-btn" title="Reset Floating Position &amp; Size">⌖</button>
          <button type="button" id="cfh-collapse-btn" class="btn-secondary cfh-win-btn" title="Minimize to Floating Bar">—</button>
          <button type="button" id="cfh-close-btn" class="btn-secondary cfh-win-btn" title="Close Cash-Flow Histogram">✕</button>
        </div>
      </div>
      <div class="cfh-body" id="cfh-chart-body"></div>
      <div class="cfh-footer" id="cfh-footer-legend">Click any period bar to jump the 4D simulation date.</div>
      <div class="cfh-resize-handle" id="cfh-resize-handle" title="Drag to resize window" aria-hidden="true"></div>
    `;
    document.body.appendChild(div);
    this.el = div;
    this.applyGeometryToDom();

    // Header buttons
    div.querySelector("#cfh-close-btn")?.addEventListener("click", () => this.close());
    div.querySelector("#cfh-collapse-btn")?.addEventListener("click", () => {
      this.setCollapsed(!this.geometry.collapsed);
    });
    div.querySelector("#cfh-reset-pos-btn")?.addEventListener("click", () => {
      this.resetFloatingPosition();
    });

    div.querySelectorAll<HTMLButtonElement>("[data-cfh-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.mode = btn.dataset.cfhMode as HistogramViewMode;
        div.querySelectorAll("[data-cfh-mode]").forEach((b) => b.classList.toggle("active", b === btn));
        this.render(this.lastTasks, this.lastDateMs);
      });
    });
    div.querySelectorAll<HTMLButtonElement>("[data-cfh-gran]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.granularity = btn.dataset.cfhGran as HistogramGranularity;
        div.querySelectorAll("[data-cfh-gran]").forEach((b) => b.classList.toggle("active", b === btn));
        this.render(this.lastTasks, this.lastDateMs);
      });
    });

    // Drag floating window by header
    const dragHeader = div.querySelector<HTMLElement>("#cfh-drag-header");
    if (dragHeader) {
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let originLeft = 0;
      let originTop = 0;

      dragHeader.addEventListener("pointerdown", (ev: PointerEvent) => {
        if ((ev.target as HTMLElement)?.closest("button")) return;
        dragging = true;
        originLeft = this.geometry.left;
        originTop = this.geometry.top;
        startX = ev.clientX;
        startY = ev.clientY;
        div.classList.add("dragging");
        dragHeader.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
      });

      dragHeader.addEventListener("pointermove", (ev: PointerEvent) => {
        if (!dragging) return;
        this.geometry = this.clampGeometry({
          ...this.geometry,
          left: originLeft + (ev.clientX - startX),
          top: originTop + (ev.clientY - startY),
        });
        this.applyGeometryToDom();
      });

      const endDrag = (ev: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        div.classList.remove("dragging");
        dragHeader.releasePointerCapture?.(ev.pointerId);
        this.persistGeometry();
      };
      dragHeader.addEventListener("pointerup", endDrag);
      dragHeader.addEventListener("pointercancel", endDrag);

      // Double-click header toggles collapse/expand
      dragHeader.addEventListener("dblclick", (ev: MouseEvent) => {
        if ((ev.target as HTMLElement)?.closest("button")) return;
        this.setCollapsed(!this.geometry.collapsed);
      });
    }

    // Resize floating window from bottom-right corner handle
    const resizeHandle = div.querySelector<HTMLElement>("#cfh-resize-handle");
    if (resizeHandle) {
      let resizing = false;
      let startX = 0;
      let startY = 0;
      let originW = 0;
      let originH = 0;

      resizeHandle.addEventListener("pointerdown", (ev: PointerEvent) => {
        resizing = true;
        originW = this.geometry.width;
        originH = this.geometry.height;
        startX = ev.clientX;
        startY = ev.clientY;
        div.classList.add("resizing");
        resizeHandle.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
        ev.stopPropagation();
      });

      resizeHandle.addEventListener("pointermove", (ev: PointerEvent) => {
        if (!resizing) return;
        this.geometry = this.clampGeometry({
          ...this.geometry,
          width: originW + (ev.clientX - startX),
          height: originH + (ev.clientY - startY),
          collapsed: false,
        });
        this.applyGeometryToDom();
      });

      const endResize = (ev: PointerEvent) => {
        if (!resizing) return;
        resizing = false;
        div.classList.remove("resizing");
        resizeHandle.releasePointerCapture?.(ev.pointerId);
        this.persistGeometry();
        if (this.isOpen()) this.render(this.lastTasks, this.lastDateMs);
      };
      resizeHandle.addEventListener("pointerup", endResize);
      resizeHandle.addEventListener("pointercancel", endResize);
    }

    // Clamp window into viewport on browser resize
    if (!this.resizeListenerAttached && typeof window !== "undefined") {
      this.resizeListenerAttached = true;
      window.addEventListener("resize", () => {
        if (this.el) this.applyGeometryToDom();
      });
    }
  }

  public render(tasks: ScheduleTask[], currentDateMs?: number): void {
    this.lastTasks = tasks;
    this.lastDateMs = currentDateMs;
    if (!this.isOpen() || !this.el) return;

    const body = this.el.querySelector("#cfh-chart-body");
    const summary = this.el.querySelector("#cfh-summary-pill");
    const legend = this.el.querySelector("#cfh-footer-legend");
    if (!body) return;

    const buckets = buildCashFlowHistogramBuckets(tasks, this.granularity);
    if (buckets.length === 0) {
      body.innerHTML = `<div style="padding:1.5rem;text-align:center;color:var(--text-muted,#94a3b8);font-size:0.76rem;">No scheduled tasks with valid dates available.</div>`;
      return;
    }

    const totalBudget = buckets[buckets.length - 1].cumulativeCost;
    const peakTasks = Math.max(...buckets.map((b) => b.totalActiveTasks), 1);
    const maxCost = Math.max(...buckets.map((b) => b.periodCost), 1);

    if (summary) {
      summary.textContent =
        this.mode === "cashflow"
          ? `Total: $${totalBudget.toLocaleString("en-US")} • ${buckets.length} ${this.granularity === "month" ? "mo" : "wk"}`
          : `Peak: ${peakTasks} active • ${buckets.length} periods`;
    }

    const availableW = Math.max(320, this.geometry.width - 36);
    const svgW = Math.max(availableW, buckets.length * 40);
    const svgH = Math.max(120, this.geometry.height - 96);
    const padL = 44;
    const padR = 16;
    const padT = 14;
    const padB = 26;
    const plotW = svgW - padL - padR;
    const plotH = svgH - padT - padB;
    const stepW = plotW / buckets.length;
    const barW = Math.max(8, Math.min(28, stepW * 0.66));

    let barsSvg = "";
    const curvePoints: string[] = [];
    let playheadX: number | null = null;

    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      const cx = padL + i * stepW + stepW / 2;
      const x = cx - barW / 2;
      const isCurrent =
        currentDateMs !== undefined && currentDateMs >= b.startMs && currentDateMs <= b.endMs;
      if (isCurrent) {
        const frac = Math.max(0, Math.min(1, (currentDateMs - b.startMs) / Math.max(1, b.endMs - b.startMs)));
        playheadX = padL + (i + frac) * stepW;
      }

      if (this.mode === "cashflow") {
        const h = Math.max(2, (b.periodCost / maxCost) * plotH);
        const y = padT + plotH - h;
        const fill = isCurrent ? "var(--cfh-accent, #d4ff3f)" : "var(--cfh-bar, rgba(56, 189, 248, 0.78))";
        barsSvg += `<rect class="cfh-bar" data-ms="${b.startMs}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${fill}"><title>${b.label}: $${b.periodCost.toLocaleString()} (Cum: $${b.cumulativeCost.toLocaleString()})</title></rect>`;

        const cy =
          totalBudget > 0
            ? padT + plotH - (b.cumulativeCost / totalBudget) * plotH
            : padT + plotH;
        curvePoints.push(`${cx.toFixed(1)},${cy.toFixed(1)}`);
      } else {
        let curY = padT + plotH;
        const segments = [
          { count: b.tradeTaskCount, color: "#0ea5e9", name: "Trade" },
          { count: b.laborCount, color: "#10b981", name: "Labor" },
          { count: b.equipmentCount, color: "#f59e0b", name: "Equipment" },
          { count: b.materialCount, color: "#9333ea", name: "Material" },
        ];
        for (const seg of segments) {
          if (seg.count <= 0) continue;
          const h = (seg.count / peakTasks) * plotH;
          curY -= h;
          barsSvg += `<rect class="cfh-bar" data-ms="${b.startMs}" x="${x.toFixed(1)}" y="${curY.toFixed(1)}" width="${barW.toFixed(1)}" height="${Math.max(1.5, h).toFixed(1)}" rx="2" fill="${seg.color}"><title>${b.label} — ${seg.name}: ${seg.count} active</title></rect>`;
        }
      }

      const labelStep = buckets.length > 24 ? 3 : buckets.length > 14 ? 2 : 1;
      if (i % labelStep === 0 || isCurrent) {
        barsSvg += `<text x="${cx.toFixed(1)}" y="${svgH - 7}" text-anchor="middle" fill="${isCurrent ? "var(--cfh-accent, #d4ff3f)" : "var(--cfh-label, #94a3b8)"}" font-size="9.5" font-weight="${isCurrent ? "700" : "500"}">${b.label}</text>`;
      }
    }

    const sCurveSvg =
      this.mode === "cashflow" && curvePoints.length > 1
        ? `<polyline fill="none" stroke="var(--cfh-accent, #d4ff3f)" stroke-width="2" points="${curvePoints.join(" ")}" />`
        : "";
    const playheadSvg =
      playheadX !== null
        ? `<line x1="${playheadX.toFixed(1)}" y1="${padT}" x2="${playheadX.toFixed(1)}" y2="${padT + plotH}" stroke="var(--cfh-playhead, #f43f5e)" stroke-width="2" stroke-dasharray="3 2" />`
        : "";

    const topTick =
      this.mode === "cashflow"
        ? `$${Math.round(maxCost / 1000)}k`
        : `${peakTasks}`;

    body.innerHTML = `
      <div class="thin-scrollbar" style="overflow-x:auto;width:100%;height:100%;">
        <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="${svgH}" style="min-width:${Math.min(svgW, availableW)}px;display:block;">
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="var(--cfh-axis, rgba(255,255,255,0.15))" />
          <line x1="${padL}" y1="${padT + plotH}" x2="${svgW - padR}" y2="${padT + plotH}" stroke="var(--cfh-axis, rgba(255,255,255,0.15))" />
          <text x="${padL - 6}" y="${padT + 8}" text-anchor="end" fill="var(--cfh-label, #64748b)" font-size="9">${topTick}</text>
          <text x="${padL - 6}" y="${padT + plotH}" text-anchor="end" fill="var(--cfh-label, #64748b)" font-size="9">0</text>
          ${barsSvg}
          ${sCurveSvg}
          ${playheadSvg}
        </svg>
      </div>
    `;

    if (legend) {
      legend.innerHTML =
        this.mode === "cashflow"
          ? `<span><strong style="color:var(--cfh-bar,#38bdf8);">■</strong> Period Spend</span> · <span><strong style="color:var(--cfh-accent,#d4ff3f);">━</strong> Cumulative S-Curve</span> · <span><strong style="color:var(--cfh-playhead,#f43f5e);">┆</strong> Live 4D Date</span> · <em>Click bar to jump · Drag header to float</em>`
          : `<span><strong style="color:#0ea5e9;">■</strong> Trade</span> · <span><strong style="color:#10b981;">■</strong> Labor</span> · <span><strong style="color:#f59e0b;">■</strong> Equipment</span> · <span><strong style="color:#9333ea;">■</strong> Material</span> · <em>Click bar to jump · Drag header to float</em>`;
    }

    body.querySelectorAll<SVGRectElement>(".cfh-bar").forEach((bar) => {
      bar.style.cursor = "pointer";
      bar.addEventListener("click", () => {
        const ms = Number(bar.dataset.ms);
        if (Number.isFinite(ms)) this.onScrubDate?.(ms);
      });
    });
  }
}
