/**
 * EvmDashboardModule — Enterprise Earned Value Management (EVM) Suite & Analytics.
 *
 * Provides real-time calculation and visualization of EVM parameters:
 * BAC, PV, EV, AC, SV, CV, SPI, CPI, EAC, VAC, TCPI, prolongation overhead,
 * liquidated damages penalty exposure, multi-line interactive S-Curves,
 * and comprehensive CSV audit reporting.
 */

import { DelayImpactEngine, type DelayImpactReport, type TaskDelayImpact } from "./DelayImpactEngine";
import { ScheduleManager } from "./ScheduleManager";
import { formatCurrency } from "../utils/formatters";
import { showToast } from "../ui/ToastManager";

export interface EvmMetricsSummary {
  simDateMs: number;
  simDateIso: string;
  bac: number;           // Budget at Completion (Total Planned Cost)
  pv: number;            // Planned Value
  ev: number;            // Earned Value
  ac: number;            // Actual Cost
  sv: number;            // Schedule Variance (EV - PV)
  cv: number;            // Cost Variance (EV - AC)
  spi: number;           // Schedule Performance Index (EV / PV)
  cpi: number;           // Cost Performance Index (EV / AC)
  eac: number;           // Estimate at Completion (BAC / CPI)
  vac: number;           // Variance at Completion (BAC - EAC)
  tcpi: number;          // To-Complete Performance Index ((BAC - EV) / (BAC - AC))
  progressPercent: number; // EV / BAC * 100
  prolongationCost: number; // Overhead delay costs
  penaltyCost: number;   // Contractual liquidated damages
  totalCostImpact: number; // Total financial delay exposure
  projectSlippageDays: number;
  delayedCount: number;
  criticalDelayCount: number;
  criticalTasksDelayed: TaskDelayImpact[];
  taskImpacts: TaskDelayImpact[];
}

export interface SCurvePoint {
  dateMs: number;
  dateStr: string;
  pv: number;
  ev: number;
  ac: number;
}

export class EvmDashboardModule {
  private static instance: EvmDashboardModule | null = null;
  private delayEngine: DelayImpactEngine;
  private simulatedDelayDays: number = 0;

  private constructor() {
    this.delayEngine = DelayImpactEngine.getInstance();
  }

  public static getInstance(): EvmDashboardModule {
    if (!EvmDashboardModule.instance) {
      EvmDashboardModule.instance = new EvmDashboardModule();
    }
    return EvmDashboardModule.instance;
  }

  /**
   * Set a what-if simulated delay in days to test EVM sensitivity.
   */
  public setSimulatedDelayDays(days: number): void {
    this.simulatedDelayDays = Math.max(0, days);
  }

  public getSimulatedDelayDays(): number {
    return this.simulatedDelayDays;
  }

  /**
   * Compute complete EVM analytics for the active schedule and simulation date.
   */
  public computeEvmMetrics(currentSimDateMs?: number): EvmMetricsSummary {
    const sm = ScheduleManager.getInstance();
    const tasks = sm.getTasksSorted();

    let simMs = currentSimDateMs ?? Date.now();
    const range = sm.getProjectDateRange();
    if (range) {
      if (currentSimDateMs === undefined) {
        simMs = range.min.getTime();
      }
    }

    // Apply simulated delay if active
    let effectiveTasks = tasks;
    if (this.simulatedDelayDays > 0) {
      effectiveTasks = tasks.map(t => {
        if (t.isCritical || (t.totalFloat !== undefined && t.totalFloat <= 0)) {
          return {
            ...t,
            delayDays: (t.delayDays || 0) + this.simulatedDelayDays
          };
        }
        return t;
      });
    }

    const report: DelayImpactReport = this.delayEngine.computeProjectDelayReport(effectiveTasks, simMs);

    const bac = report.totalPlannedCost;
    const pv = report.plannedValue;
    const ev = report.earnedValue;
    const ac = report.totalActualCost;
    const sv = report.scheduleVariance;
    const cv = report.costVariance;
    const spi = report.spi;
    const cpi = report.cpi;
    const eac = report.eac;
    const vac = report.vac;

    const remainingWork = Math.max(0, bac - ev);
    const remainingBudget = Math.max(1, bac - ac);
    const tcpi = remainingWork > 0 ? remainingWork / remainingBudget : 1.0;

    const progressPercent = bac > 0 ? Math.min(100, Math.round((ev / bac) * 100)) : 0;
    const simDateIso = new Date(simMs).toISOString().split("T")[0];

    return {
      simDateMs: simMs,
      simDateIso,
      bac,
      pv,
      ev,
      ac,
      sv,
      cv,
      spi,
      cpi,
      eac,
      vac,
      tcpi,
      progressPercent,
      prolongationCost: report.totalProlongationCost,
      penaltyCost: report.totalPenaltyCost,
      totalCostImpact: report.totalCostImpact,
      projectSlippageDays: report.projectSlippageDays,
      delayedCount: report.delayedCount,
      criticalDelayCount: report.criticalDelayCount,
      criticalTasksDelayed: report.criticalTasksDelayed,
      taskImpacts: report.taskImpacts,
    };
  }

  /**
   * Generate time-series milestones for the multi-line S-Curve across project duration.
   */
  public generateSCurveSeries(steps: number = 24, currentSimDateMs?: number): {
    points: SCurvePoint[];
    maxCost: number;
    minDateMs: number;
    maxDateMs: number;
  } {
    const sm = ScheduleManager.getInstance();
    const tasks = sm.getTasksSorted();
    const range = sm.getProjectDateRange();

    if (!range || tasks.length === 0) {
      return { points: [], maxCost: 0, minDateMs: 0, maxDateMs: 0 };
    }

    const minDateMs = range.min.getTime();
    const maxDateMs = range.max.getTime();
    const durationMs = Math.max(1, maxDateMs - minDateMs);
    const stepMs = durationMs / Math.max(1, steps - 1);

    const points: SCurvePoint[] = [];
    let maxCost = 0;

    for (let i = 0; i < steps; i++) {
      const pointMs = minDateMs + i * stepMs;
      const report = this.delayEngine.computeProjectDelayReport(tasks, pointMs);
      const pv = report.plannedValue;
      const ev = pointMs <= (currentSimDateMs ?? maxDateMs) ? report.earnedValue : 0;
      const ac = pointMs <= (currentSimDateMs ?? maxDateMs) ? report.totalActualCost : 0;

      if (pv > maxCost) maxCost = pv;
      if (ev > maxCost) maxCost = ev;
      if (ac > maxCost) maxCost = ac;

      points.push({
        dateMs: pointMs,
        dateStr: new Date(pointMs).toISOString().split("T")[0],
        pv,
        ev,
        ac,
      });
    }

    return { points, maxCost: Math.max(1000, maxCost), minDateMs, maxDateMs };
  }

  /**
   * Render the dedicated Earned Value Management (EVM) Suite inside `#evm-panel`.
   */
  public render(currentSimDateMs?: number): void {
    const panel = document.getElementById("evm-panel");
    if (!panel) return;

    const metrics = this.computeEvmMetrics(currentSimDateMs);

    // 1. Status Badge in Header
    const statusBadge = document.getElementById("evm-status-badge");
    if (statusBadge) {
      let statusColor = "#10b981"; // green
      let statusText = "ON TRACK";
      if (metrics.spi < 0.95 || metrics.cpi < 0.95) {
        statusColor = "#ef4444"; // red
        statusText = "CRITICAL VARIANCE";
      } else if (metrics.spi < 1.0 || metrics.cpi < 1.0) {
        statusColor = "#f59e0b"; // amber
        statusText = "WATCH LIST";
      } else if (metrics.spi > 1.05 && metrics.cpi >= 1.0) {
        statusColor = "#38bdf8"; // sky blue
        statusText = "AHEAD OF SCHEDULE";
      }

      statusBadge.style.borderColor = statusColor;
      statusBadge.style.color = statusColor;
      statusBadge.style.background = `${statusColor}22`;
      statusBadge.textContent = `${statusText} • SPI ${metrics.spi.toFixed(2)} | CPI ${metrics.cpi.toFixed(2)}`;
    }

    // 2. Executive KPI Cards
    const setElem = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setElem("evm-val-bac", formatCurrency(metrics.bac));
    setElem("evm-val-pv", formatCurrency(metrics.pv));
    setElem("evm-val-ev", formatCurrency(metrics.ev));
    setElem("evm-val-ac", formatCurrency(metrics.ac));

    // Schedule Variance & Cost Variance with sign styling
    const svEl = document.getElementById("evm-val-sv");
    if (svEl) {
      const svSign = metrics.sv >= 0 ? "+" : "−";
      svEl.textContent = `${svSign}${formatCurrency(Math.abs(metrics.sv))}`;
      svEl.style.color = metrics.sv >= 0 ? "#10b981" : "#ef4444";
    }

    const cvEl = document.getElementById("evm-val-cv");
    if (cvEl) {
      const cvSign = metrics.cv >= 0 ? "+" : "−";
      cvEl.textContent = `${cvSign}${formatCurrency(Math.abs(metrics.cv))}`;
      cvEl.style.color = metrics.cv >= 0 ? "#10b981" : "#ef4444";
    }

    // Indices & Forecasts
    setElem("evm-val-spi", metrics.spi.toFixed(2));
    setElem("evm-val-cpi", metrics.cpi.toFixed(2));
    setElem("evm-val-eac", formatCurrency(metrics.eac));
    setElem("evm-val-vac", (metrics.vac >= 0 ? "+" : "−") + formatCurrency(Math.abs(metrics.vac)));
    setElem("evm-val-tcpi", metrics.tcpi.toFixed(2));
    setElem("evm-val-progress", `${metrics.progressPercent}%`);

    // Financial Exposure & Risk
    setElem("evm-val-slippage", `${metrics.projectSlippageDays > 0 ? "+" : ""}${metrics.projectSlippageDays} Days`);
    setElem("evm-val-prolongation", formatCurrency(metrics.prolongationCost));
    setElem("evm-val-penalties", formatCurrency(metrics.penaltyCost));
    setElem("evm-val-total-impact", formatCurrency(metrics.totalCostImpact));

    // 3. Render Interactive Multi-Line SVG EVM S-Curve
    this.renderSCurveSVG("evm-scurve-chart-container", metrics.simDateMs);

    // 4. Render Critical Delayed Tasks Table
    this.renderDelayedTasksTable("evm-delayed-tasks-container", metrics.criticalTasksDelayed);
  }

  /**
   * Render high-resolution multi-line SVG S-Curve with PV, EV, AC lines and scrub position.
   */
  public renderSCurveSVG(containerId: string, currentSimDateMs?: number): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { points, maxCost, minDateMs, maxDateMs } = this.generateSCurveSeries(28, currentSimDateMs);

    if (points.length === 0 || maxCost === 0) {
      container.innerHTML = `
        <div style="font-size: 0.65rem; color: var(--text-muted); text-align: center; padding: 1rem; border: 1px dashed var(--border-subtle); border-radius: 6px;">
          Awaiting schedule or model loading to compute EVM S-Curve.
        </div>
      `;
      return;
    }

    const w = 360;
    const h = 140;
    const padL = 36;
    const padR = 14;
    const padT = 16;
    const padB = 22;

    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const mapX = (dateMs: number) => padL + ((dateMs - minDateMs) / Math.max(1, maxDateMs - minDateMs)) * chartW;
    const mapY = (cost: number) => padT + chartH - (cost / maxCost) * chartH;

    // Paths
    const pvPts = points.map(p => `${mapX(p.dateMs).toFixed(1)},${mapY(p.pv).toFixed(1)}`).join(" L ");
    const evPts = points.filter(p => p.ev > 0).map(p => `${mapX(p.dateMs).toFixed(1)},${mapY(p.ev).toFixed(1)}`).join(" L ");
    const acPts = points.filter(p => p.ac > 0).map(p => `${mapX(p.dateMs).toFixed(1)},${mapY(p.ac).toFixed(1)}`).join(" L ");

    const scrubX = currentSimDateMs ? mapX(currentSimDateMs) : padL;

    container.innerHTML = `
      <div style="background: var(--bg-card, #17171c); border: 1px solid var(--border-subtle, #27272a); border-radius: 8px; padding: 0.6rem; position: relative;">
        <!-- Header Legend -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; font-size: 0.62rem; font-weight: 700;">
          <span style="color: var(--text-muted, #94a3b8); text-transform: uppercase; letter-spacing: 0.5px;">EVM S-Curve Timeline</span>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <span style="color: #38bdf8; display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: #38bdf8;"></span>PV</span>
            <span style="color: #10b981; display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: #10b981;"></span>EV</span>
            <span style="color: #f59e0b; display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: #f59e0b;"></span>AC</span>
            <span style="color: #d4ff3f; display: flex; align-items: center; gap: 0.2rem;"><span style="width: 2px; height: 8px; background: #d4ff3f;"></span>Now</span>
          </div>
        </div>

        <!-- SVG Chart -->
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="overflow: visible;">
          <!-- Horizontal Grid Lines -->
          <line x1="${padL}" y1="${padT}" x2="${w - padR}" y2="${padT}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          <line x1="${padL}" y1="${padT + chartH * 0.5}" x2="${w - padR}" y2="${padT + chartH * 0.5}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          <line x1="${padL}" y1="${padT + chartH}" x2="${w - padR}" y2="${padT + chartH}" stroke="rgba(255,255,255,0.18)" />

          <!-- Y-Axis Ticks -->
          <text x="${padL - 4}" y="${padT + 4}" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">${(maxCost / 1e6).toFixed(1)}M</text>
          <text x="${padL - 4}" y="${padT + chartH * 0.5 + 3}" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">${(maxCost * 0.5 / 1e6).toFixed(1)}M</text>
          <text x="${padL - 4}" y="${padT + chartH}" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">0</text>

          <!-- Planned Value (PV) Curve -->
          <path d="M ${pvPts}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />

          <!-- Actual Cost (AC) Curve -->
          ${acPts ? `<path d="M ${acPts}" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="3,2" />` : ""}

          <!-- Earned Value (EV) Curve -->
          ${evPts ? `<path d="M ${evPts}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" />` : ""}

          <!-- Current Simulation Scrub Line -->
          ${currentSimDateMs ? `
            <line x1="${scrubX}" y1="${padT}" x2="${scrubX}" y2="${padT + chartH}" stroke="#d4ff3f" stroke-width="1.5" stroke-dasharray="2,2" />
            <circle cx="${scrubX}" cy="${padT + chartH}" r="3" fill="#d4ff3f" />
          ` : ""}
        </svg>
      </div>
    `;
  }

  /**
   * Render table of critical delayed activities and their financial exposure.
   */
  public renderDelayedTasksTable(containerId: string, criticalDelayed: TaskDelayImpact[]): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (criticalDelayed.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.62rem; color: #10b981; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.5rem 0.6rem; border-radius: 6px; display: flex; align-items: center; gap: 0.35rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>
          <span>All critical path construction activities are operating on schedule. Zero delay exposure detected.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.35rem; width: 100%;">
        ${criticalDelayed.slice(0, 5).map(task => {
          return `
            <div style="background: var(--bg-card, #18181b); border-left: 3px solid #ef4444; border: 1px solid var(--border-subtle, #27272a); border-left-width: 3px; border-left-color: #ef4444; border-radius: 4px; padding: 0.35rem 0.5rem; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; flex-direction: column; gap: 0.1rem; overflow: hidden; max-width: 65%;">
                <span style="font-size: 0.68rem; font-weight: 700; color: var(--text-primary, #ffffff); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${task.taskName}</span>
                <span style="font-size: 0.58rem; color: var(--text-muted, #94a3b8);">Target End: ${task.plannedEndDate} • CPM Critical</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem;">
                <span style="font-size: 0.62rem; font-weight: 800; color: #ef4444; background: rgba(239, 68, 68, 0.15); padding: 1px 4px; border-radius: 2px;">+${task.delayDays}d Delayed</span>
                <span style="font-size: 0.58rem; color: var(--text-muted, #94a3b8); font-family: var(--font-mono);">${formatCurrency(task.totalCostImpact)} Exp</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  /**
   * Export complete EVM Audit Ledger to downloadable CSV.
   */
  public exportEvmAuditCsv(currentSimDateMs?: number): void {
    const metrics = this.computeEvmMetrics(currentSimDateMs);
    const headers = [
      "TaskID",
      "TaskName",
      "Category",
      "PlannedStartDate",
      "PlannedEndDate",
      "ActualStartDate",
      "ActualEndDate",
      "PlannedDurationDays",
      "ActualDurationDays",
      "DelayDays",
      "Status",
      "IsCritical",
      "TotalFloat",
      "PlannedCost_BAC",
      "ActualCost_AC",
      "ProlongationCost",
      "PenaltyCost",
      "TotalFinancialExposure"
    ];

    const rows = metrics.taskImpacts.map(t => [
      `"${t.taskId}"`,
      `"${t.taskName.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.plannedStartDate}"`,
      `"${t.plannedEndDate}"`,
      `"${t.actualStartDate || ""}"`,
      `"${t.actualEndDate || ""}"`,
      t.plannedDurationDays,
      t.actualDurationDays || "",
      t.delayDays,
      `"${t.status}"`,
      t.isCritical ? "YES" : "NO",
      t.totalFloat,
      t.plannedCost,
      t.actualCost,
      t.prolongationCost,
      t.penaltyCost,
      t.totalCostImpact
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BIM_EVM_Audit_${metrics.simDateIso}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`✓ Exported EVM Audit Ledger (${metrics.taskImpacts.length} activities)`, "success");
  }
}
