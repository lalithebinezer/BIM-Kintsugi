/**
 * CashFlowHistogramDrawer — Floating 4D Cash-Flow & Resource Load Histogram
 *
 * Powered by the global `UiPlatform` (`createFloatingWindow` + `bk-*` primitives)
 * for uniform dragging, corner resizing, z-index focus stacking, collapse/expand,
 * viewport clamping, and localStorage persistence across all devices and themes.
 */

import type { ScheduleTask } from "../modules/ScheduleManager";
import {
  createFloatingWindow,
  type BkFloatingGeometry,
  type BkFloatingWindow,
} from "./UiPlatform";

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

export type FloatingHistogramGeometry = BkFloatingGeometry;

const DAY_MS = 24 * 60 * 60 * 1000;
const FLOAT_STORAGE_KEY = "bim_kintsugi_cfh_float_v1";

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
  const leafTasks = tasks.filter((t) => !t.isSummary && t.startDate && t.endDate);
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
  private win: BkFloatingWindow | null = null;
  private granularity: HistogramGranularity = "month";
  private mode: HistogramViewMode = "cashflow";
  private lastTasks: ScheduleTask[] = [];
  private lastDateMs: number | undefined;
  private onScrubDate: ((dateMs: number) => void) | null = null;
  private onCloseCallback: (() => void) | null = null;

  public static getInstance(): CashFlowHistogramDrawer {
    if (!this.instance) this.instance = new CashFlowHistogramDrawer();
    return this.instance;
  }

  public getFloatingGeometry(): FloatingHistogramGeometry {
    this.ensureWindow();
    return this.win!.getGeometry();
  }

  public setFloatingPosition(left: number, top: number): void {
    this.ensureWindow();
    this.win!.setPosition(left, top);
  }

  public setFloatingSize(width: number, height: number): void {
    this.ensureWindow();
    this.win!.setSize(width, height);
  }

  public setCollapsed(collapsed: boolean): void {
    this.ensureWindow();
    this.win!.setCollapsed(collapsed);
  }

  public resetFloatingPosition(): void {
    this.ensureWindow();
    this.win!.resetGeometry();
  }

  public isOpen(): boolean {
    return Boolean(this.win && this.win.isOpen());
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
    this.ensureWindow();
    this.win!.open();
    this.render(tasks, currentDateMs);
  }

  public close(): void {
    this.win?.close(false);
  }

  private ensureWindow(): void {
    if (this.win && document.body.contains(this.win.el)) return;

    this.win = createFloatingWindow({
      id: "cashflow-histogram-drawer",
      title: "4D Cash-Flow &amp; Resource Histogram",
      ariaLabel: "4D Cash-Flow and Resource Histogram",
      size: "lg",
      preferredSlot: "center",
      extraClass: "cashflow-histogram-drawer floating-window",
      resizable: true,
      collapsible: true,
      showResetButton: true,
      closeButtonId: "cfh-close-btn",
      resizeHandleId: "cfh-resize-handle",
      persistKey: FLOAT_STORAGE_KEY,
      headerBadgeHtml: `<span class="bk-badge bk-badge--accent" id="cfh-summary-pill">--</span>`,
      headerActionsHtml: `
        <div class="bk-seg">
          <button type="button" class="bk-seg__btn is-active" data-cfh-mode="cashflow">Cash Flow ($)</button>
          <button type="button" class="bk-seg__btn" data-cfh-mode="resources">Resources</button>
        </div>
        <div class="bk-seg">
          <button type="button" class="bk-seg__btn is-active" data-cfh-gran="month">Monthly</button>
          <button type="button" class="bk-seg__btn" data-cfh-gran="week">Weekly</button>
        </div>
      `,
      bodyHtml: `<div class="cfh-body" id="cfh-chart-body"></div>`,
      footerHtml: `<span id="cfh-footer-legend">Click any period bar to jump the 4D simulation date.</span>`,
      onResize: () => {
        if (this.isOpen()) this.render(this.lastTasks, this.lastDateMs);
      },
      onClose: () => {
        this.onCloseCallback?.();
      },
    });

    const el = this.win.el;
    el.querySelectorAll<HTMLButtonElement>("[data-cfh-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.mode = btn.dataset.cfhMode as HistogramViewMode;
        el.querySelectorAll("[data-cfh-mode]").forEach((b) =>
          b.classList.toggle("is-active", b === btn)
        );
        this.render(this.lastTasks, this.lastDateMs);
      });
    });

    el.querySelectorAll<HTMLButtonElement>("[data-cfh-gran]").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.granularity = btn.dataset.cfhGran as HistogramGranularity;
        el.querySelectorAll("[data-cfh-gran]").forEach((b) =>
          b.classList.toggle("is-active", b === btn)
        );
        this.render(this.lastTasks, this.lastDateMs);
      });
    });
  }

  public render(tasks: ScheduleTask[], currentDateMs?: number): void {
    this.lastTasks = tasks;
    this.lastDateMs = currentDateMs;
    if (!this.isOpen() || !this.win) return;

    const el = this.win.el;
    const body = el.querySelector("#cfh-chart-body");
    const summary = el.querySelector("#cfh-summary-pill");
    const legend = el.querySelector("#cfh-footer-legend");
    if (!body) return;

    const buckets = buildCashFlowHistogramBuckets(tasks, this.granularity);
    if (buckets.length === 0) {
      body.innerHTML = `<div style="padding:1.5rem;text-align:center;color:var(--bk-text-muted);font-size:var(--bk-text-sm);">No scheduled tasks with valid dates available.</div>`;
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

    const geom = this.win.getGeometry();
    const availableW = Math.max(280, geom.width - 36);
    const svgW = Math.max(availableW, buckets.length * 40);
    const svgH = Math.max(115, geom.height - 98);
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
        const fill = isCurrent ? "var(--cfh-accent, var(--bk-accent))" : "var(--cfh-bar, rgba(56, 189, 248, 0.78))";
        barsSvg += `<rect class="cfh-bar" data-ms="${b.startMs}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barW.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${fill}"><title>${b.label}: $${b.periodCost.toLocaleString()} (Cum: $${b.cumulativeCost.toLocaleString()})</title></rect>`;

        const cy =
          totalBudget > 0 ? padT + plotH - (b.cumulativeCost / totalBudget) * plotH : padT + plotH;
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
        barsSvg += `<text x="${cx.toFixed(1)}" y="${svgH - 7}" text-anchor="middle" fill="${isCurrent ? "var(--cfh-accent, var(--bk-accent))" : "var(--cfh-label, var(--bk-text-muted))"}" font-size="9.5" font-weight="${isCurrent ? "700" : "500"}">${b.label}</text>`;
      }
    }

    const sCurveSvg =
      this.mode === "cashflow" && curvePoints.length > 1
        ? `<polyline fill="none" stroke="var(--cfh-accent, var(--bk-accent))" stroke-width="2" points="${curvePoints.join(" ")}" />`
        : "";
    const playheadSvg =
      playheadX !== null
        ? `<line x1="${playheadX.toFixed(1)}" y1="${padT}" x2="${playheadX.toFixed(1)}" y2="${padT + plotH}" stroke="var(--cfh-playhead, #f43f5e)" stroke-width="2" stroke-dasharray="3 2" />`
        : "";

    const topTick = this.mode === "cashflow" ? `$${Math.round(maxCost / 1000)}k` : `${peakTasks}`;

    body.innerHTML = `
      <div class="thin-scrollbar" style="overflow-x:auto;width:100%;height:100%;">
        <svg viewBox="0 0 ${svgW} ${svgH}" width="100%" height="${svgH}" style="min-width:${Math.min(svgW, availableW)}px;display:block;">
          <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${padT + plotH}" stroke="var(--cfh-axis, var(--bk-border-strong))" />
          <line x1="${padL}" y1="${padT + plotH}" x2="${svgW - padR}" y2="${padT + plotH}" stroke="var(--cfh-axis, var(--bk-border-strong))" />
          <text x="${padL - 6}" y="${padT + 8}" text-anchor="end" fill="var(--cfh-label, var(--bk-text-muted))" font-size="9">${topTick}</text>
          <text x="${padL - 6}" y="${padT + plotH}" text-anchor="end" fill="var(--cfh-label, var(--bk-text-muted))" font-size="9">0</text>
          ${barsSvg}
          ${sCurveSvg}
          ${playheadSvg}
        </svg>
      </div>
    `;

    if (legend) {
      legend.innerHTML =
        this.mode === "cashflow"
          ? `<span><strong style="color:var(--cfh-bar,#38bdf8);">■</strong> Period Spend</span> · <span><strong style="color:var(--cfh-accent,var(--bk-accent));">━</strong> Cumulative S-Curve</span> · <span><strong style="color:var(--cfh-playhead,#f43f5e);">┆</strong> Live 4D Date</span> · <em>Click bar to jump · Drag header to float</em>`
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
