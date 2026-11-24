/**
 * WhatIfScenarioEngine — Live 4D/5D Delay What-If Sandbox
 *
 * Simulates shifting any task by +/- N calendar days, cascading Finish-to-Start
 * successors (and subsequent tasks in sequential schedules), and computing exact
 * completion date slippage, delay cost impact, and SPI delta via DelayImpactEngine.
 * Supports 1-click Accept (reversible via EditHistoryManager) or Revert.
 */

import type { ScheduleTask } from "./ScheduleManager";
import { DelayImpactEngine } from "./DelayImpactEngine";
import { escapeHtml } from "../utils/formatters";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface WhatIfScenarioResult {
  targetTaskId: string;
  targetTaskName: string;
  delayDays: number;
  affectedTaskCount: number;
  baselineEndDate: string;
  simulatedEndDate: string;
  projectSlipDays: number;
  baselineCostImpact: number;
  simulatedCostImpact: number;
  deltaCostImpact: number;
  baselineSpi: number;
  simulatedSpi: number;
  simulatedTasks: ScheduleTask[];
}

function addDaysIso(isoDate: string, days: number): string {
  const ms = new Date(isoDate).getTime();
  if (!Number.isFinite(ms)) return isoDate;
  return new Date(ms + days * DAY_MS).toISOString().slice(0, 10);
}

function cloneTask(t: ScheduleTask): ScheduleTask {
  return {
    ...t,
    elementIds: new Set(t.elementIds || []),
    predecessors: t.predecessors ? t.predecessors.map((p) => ({ ...p })) : undefined,
  };
}

function findProjectEnd(tasks: ScheduleTask[]): string {
  let maxMs = -Infinity;
  for (const t of tasks) {
    const ms = new Date(t.actualEndDate || t.endDate).getTime();
    if (Number.isFinite(ms) && ms > maxMs) maxMs = ms;
  }
  return Number.isFinite(maxMs) ? new Date(maxMs).toISOString().slice(0, 10) : "--";
}

export function simulateTaskDelayScenario(
  baselineTasks: ScheduleTask[],
  targetTaskId: string,
  delayDays: number,
  evalDateMs: number,
  cascadeDownstream = true
): WhatIfScenarioResult {
  const delayEngine = DelayImpactEngine.getInstance();
  const baseReport = delayEngine.computeProjectDelayReport(baselineTasks, evalDateMs);
  const baselineEndDate = findProjectEnd(baselineTasks);

  const cloned = baselineTasks.map(cloneTask);
  const byId = new Map<string, ScheduleTask>();
  for (const t of cloned) byId.set(t.id, t);

  const target = byId.get(targetTaskId);
  if (!target || delayDays === 0) {
    return {
      targetTaskId,
      targetTaskName: target?.name ?? targetTaskId,
      delayDays,
      affectedTaskCount: 0,
      baselineEndDate,
      simulatedEndDate: baselineEndDate,
      projectSlipDays: 0,
      baselineCostImpact: baseReport.totalCostImpact,
      simulatedCostImpact: baseReport.totalCostImpact,
      deltaCostImpact: 0,
      baselineSpi: baseReport.spi,
      simulatedSpi: baseReport.spi,
      simulatedTasks: cloned,
    };
  }

  const shiftedIds = new Set<string>([target.id]);
  target.actualStartDate = addDaysIso(target.actualStartDate || target.startDate, delayDays);
  target.actualEndDate = addDaysIso(target.actualEndDate || target.endDate, delayDays);

  if (cascadeDownstream) {
    // 1. Explicit predecessor DAG cascade
    let changed = true;
    let guard = 0;
    while (changed && guard < 20) {
      changed = false;
      guard++;
      for (const task of cloned) {
        if (shiftedIds.has(task.id) || task.isSummary) continue;
        const dependsOnShifted = (task.predecessors ?? []).some((p) => shiftedIds.has(p.predecessorId));
        if (dependsOnShifted) {
          task.actualStartDate = addDaysIso(task.actualStartDate || task.startDate, delayDays);
          task.actualEndDate = addDaysIso(task.actualEndDate || task.endDate, delayDays);
          shiftedIds.add(task.id);
          changed = true;
        }
      }
    }

    // 2. If schedule has no explicit DAG links, cascade sequential successor tasks starting >= target.endDate
    if (shiftedIds.size === 1 && delayDays > 0) {
      const targetBaseEndMs = new Date(target.endDate).getTime();
      for (const task of cloned) {
        if (shiftedIds.has(task.id) || task.isSummary) continue;
        const sMs = new Date(task.startDate).getTime();
        if (Number.isFinite(sMs) && sMs >= targetBaseEndMs - 2 * DAY_MS) {
          task.actualStartDate = addDaysIso(task.actualStartDate || task.startDate, delayDays);
          task.actualEndDate = addDaysIso(task.actualEndDate || task.endDate, delayDays);
          shiftedIds.add(task.id);
        }
      }
    }
  }

  // Recompute per-task delay & cost impact
  for (const t of cloned) {
    const impact = delayEngine.computeTaskDelay(t);
    t.delayDays = impact.delayDays;
    t.costImpact = impact.totalCostImpact;
  }

  const simReport = delayEngine.computeProjectDelayReport(cloned, evalDateMs);
  const simulatedEndDate = findProjectEnd(cloned);
  const baseEndMs = new Date(baselineEndDate).getTime();
  const simEndMs = new Date(simulatedEndDate).getTime();
  const projectSlipDays =
    Number.isFinite(baseEndMs) && Number.isFinite(simEndMs)
      ? Math.round((simEndMs - baseEndMs) / DAY_MS)
      : 0;

  return {
    targetTaskId,
    targetTaskName: target.name,
    delayDays,
    affectedTaskCount: shiftedIds.size,
    baselineEndDate,
    simulatedEndDate,
    projectSlipDays,
    baselineCostImpact: Math.round(baseReport.totalCostImpact),
    simulatedCostImpact: Math.round(simReport.totalCostImpact),
    deltaCostImpact: Math.round(simReport.totalCostImpact - baseReport.totalCostImpact),
    baselineSpi: baseReport.spi,
    simulatedSpi: simReport.spi,
    simulatedTasks: cloned,
  };
}

export function openWhatIfSandboxModal(options: {
  tasks: ScheduleTask[];
  evalDateMs: number;
  onAcceptScenario: (result: WhatIfScenarioResult) => Promise<void> | void;
}): void {
  document.getElementById("whatif-sandbox-modal")?.remove();
  const leafTasks = options.tasks.filter((t) => !t.isSummary);
  if (leafTasks.length === 0) return;

  let selectedTaskId = leafTasks[0].id;
  let delayDays = 14;
  let cascade = true;

  const overlay = document.createElement("div");
  overlay.id = "whatif-sandbox-modal";
  overlay.className = "modal-overlay open";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:10065;background:rgba(5,7,12,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;";

  const render = () => {
    const res = simulateTaskDelayScenario(
      options.tasks,
      selectedTaskId,
      delayDays,
      options.evalDateMs,
      cascade
    );

    const taskOptions = leafTasks
      .map(
        (t) =>
          `<option value="${escapeHtml(t.id)}" ${t.id === selectedTaskId ? "selected" : ""}>${escapeHtml(t.name)} (${escapeHtml(t.startDate)})</option>`
      )
      .join("");

    overlay.innerHTML = `
      <div style="width:min(680px,96vw);border-radius:12px;border:1px solid var(--border-strong);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--studio-hairline);">
          <div>
            <div style="font-weight:750;font-size:0.95rem;">Live 4D/5D What-If Delay Scenario Sandbox</div>
            <div style="font-size:0.73rem;color:var(--text-muted);">Simulate schedule slip, CPM cascade, liquidated damages &amp; SPI impact (Undoable)</div>
          </div>
          <button type="button" id="wi-close" class="btn-secondary" style="padding:0.22rem 0.55rem;">✕</button>
        </div>

        <div style="padding:1rem 1.1rem;display:flex;flex-direction:column;gap:0.85rem;">
          <div style="display:grid;grid-template-columns:1fr 140px;gap:0.65rem;">
            <label class="csv-mapper-field">
              <span>Target Activity</span>
              <select id="wi-task-select" class="custom-select csv-mapper-select">${taskOptions}</select>
            </label>
            <label class="csv-mapper-field">
              <span>Delay Shift: <strong>${delayDays >= 0 ? "+" : ""}${delayDays}d</strong></span>
              <input type="range" id="wi-delay-slider" min="-14" max="60" value="${delayDays}" />
            </label>
          </div>

          <label style="display:flex;align-items:center;gap:0.45rem;font-size:0.74rem;cursor:pointer;">
            <input type="checkbox" id="wi-cascade-check" ${cascade ? "checked" : ""} />
            <span>Cascade delay to downstream successor activities</span>
          </label>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;">
            <div class="audit-kpi-card">
              <div class="audit-kpi-val" style="color:${res.projectSlipDays > 0 ? "var(--color-danger)" : "var(--color-success)"};">${res.projectSlipDays >= 0 ? "+" : ""}${res.projectSlipDays}d</div>
              <div class="audit-kpi-lbl">Completion Slip</div>
            </div>
            <div class="audit-kpi-card">
              <div class="audit-kpi-val" style="color:var(--color-warning);">${res.affectedTaskCount}</div>
              <div class="audit-kpi-lbl">Affected Tasks</div>
            </div>
            <div class="audit-kpi-card">
              <div class="audit-kpi-val" style="color:${res.deltaCostImpact > 0 ? "var(--color-danger)" : "var(--color-success)"};">${res.deltaCostImpact >= 0 ? "+" : "-"}$${Math.abs(res.deltaCostImpact).toLocaleString()}</div>
              <div class="audit-kpi-lbl">Cost Impact Δ</div>
            </div>
            <div class="audit-kpi-card">
              <div class="audit-kpi-val" style="color:var(--color-info);">${res.baselineSpi.toFixed(2)} → ${res.simulatedSpi.toFixed(2)}</div>
              <div class="audit-kpi-lbl">SPI Forecast</div>
            </div>
          </div>

          <div style="font-size:0.74rem;color:var(--text-muted);font-variant-numeric:tabular-nums;padding:0.5rem 0.65rem;border-radius:8px;background:var(--studio-surface-1);border:1px solid var(--studio-hairline);">
            Baseline Finish: <strong>${escapeHtml(res.baselineEndDate)}</strong> &nbsp;→&nbsp; Simulated Finish: <strong style="color:var(--color-warning);">${escapeHtml(res.simulatedEndDate)}</strong>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:0.8rem 1.1rem;border-top:1px solid var(--studio-hairline);">
          <button type="button" id="wi-revert" class="btn-secondary">Cancel / Revert</button>
          <button type="button" id="wi-accept" class="btn-primary">Apply Scenario (Undoable)</button>
        </div>
      </div>
    `;

    overlay.querySelector("#wi-close")?.addEventListener("click", () => overlay.remove());
    overlay.querySelector("#wi-revert")?.addEventListener("click", () => overlay.remove());
    overlay.querySelector<HTMLSelectElement>("#wi-task-select")?.addEventListener("change", (ev) => {
      selectedTaskId = (ev.target as HTMLSelectElement).value;
      render();
    });
    overlay.querySelector<HTMLInputElement>("#wi-delay-slider")?.addEventListener("input", (ev) => {
      delayDays = Number((ev.target as HTMLInputElement).value);
      render();
    });
    overlay.querySelector<HTMLInputElement>("#wi-cascade-check")?.addEventListener("change", (ev) => {
      cascade = (ev.target as HTMLInputElement).checked;
      render();
    });
    overlay.querySelector("#wi-accept")?.addEventListener("click", async () => {
      await options.onAcceptScenario(res);
      overlay.remove();
    });
  };

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  render();
}
