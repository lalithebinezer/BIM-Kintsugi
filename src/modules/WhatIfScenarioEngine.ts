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
import { createBkModal } from "../ui/UiPlatform";

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

export function cloneScheduleTask(t: ScheduleTask): ScheduleTask {
  return {
    ...t,
    category: t.category || "General",
    elementIds: new Set(t.elementIds || []),
    predecessors: t.predecessors ? t.predecessors.map((p) => ({ ...p })) : undefined,
    successors: t.successors ? [...t.successors] : undefined,
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

  const cloned = baselineTasks.map(cloneScheduleTask);
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

  const taskOptions = leafTasks
    .map(
      (t) =>
        `<option value="${escapeHtml(t.id)}" ${t.id === selectedTaskId ? "selected" : ""}>${escapeHtml(t.name)} (${escapeHtml(t.startDate)})</option>`
    )
    .join("");

  const modal = createBkModal({
    id: "whatif-sandbox-modal",
    title: "Live 4D/5D What-If Delay Scenario Sandbox",
    subtitle: "Simulate schedule slip, CPM cascade, liquidated damages &amp; SPI impact (Undoable)",
    size: "md",
    closeButtonId: "wi-close",
    bodyHtml: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
        <label class="bk-field">
          <span class="bk-field__label">Target Activity</span>
          <select id="wi-task-select" class="bk-select">${taskOptions}</select>
        </label>
        <label class="bk-field">
          <span class="bk-field__label"><span>Delay Shift</span><strong id="wi-delay-label">+14d</strong></span>
          <input type="range" id="wi-delay-slider" class="bk-range" min="-14" max="60" value="${delayDays}" />
        </label>
      </div>

      <label class="bk-checkbox-row">
        <input type="checkbox" id="wi-cascade-check" ${cascade ? "checked" : ""} />
        <span>Cascade delay to downstream successor activities</span>
      </label>

      <div class="bk-kpi-grid">
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" id="wi-kpi-slip">+0d</div>
          <div class="audit-kpi-lbl">Completion Slip</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" id="wi-kpi-affected" style="color:var(--bk-warning);">0</div>
          <div class="audit-kpi-lbl">Affected Tasks</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" id="wi-kpi-cost">$0</div>
          <div class="audit-kpi-lbl">Cost Impact Δ</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" id="wi-kpi-spi" style="color:var(--bk-info);">1.00 → 1.00</div>
          <div class="audit-kpi-lbl">SPI Forecast</div>
        </div>
      </div>

      <div id="wi-finish-summary" class="bk-card" style="font-size:var(--bk-text-sm);color:var(--bk-text-muted);font-variant-numeric:tabular-nums;">
        Baseline Finish: <strong>--</strong> → Simulated Finish: <strong>--</strong>
      </div>
    `,
    footerHtml: `
      <button type="button" id="wi-revert" class="bk-btn bk-btn--secondary">Cancel / Revert</button>
      <button type="button" id="wi-accept" class="bk-btn bk-btn--primary">Apply Scenario (Undoable)</button>
    `,
  });

  const overlay = modal.overlay;

  let latestResult: WhatIfScenarioResult = simulateTaskDelayScenario(
    options.tasks,
    selectedTaskId,
    delayDays,
    options.evalDateMs,
    cascade
  );

  const updateReadouts = () => {
    latestResult = simulateTaskDelayScenario(
      options.tasks,
      selectedTaskId,
      delayDays,
      options.evalDateMs,
      cascade
    );
    const delayLbl = overlay.querySelector("#wi-delay-label");
    if (delayLbl) delayLbl.textContent = `${delayDays >= 0 ? "+" : ""}${delayDays}d`;

    const slipEl = overlay.querySelector<HTMLElement>("#wi-kpi-slip");
    if (slipEl) {
      slipEl.textContent = `${latestResult.projectSlipDays >= 0 ? "+" : ""}${latestResult.projectSlipDays}d`;
      slipEl.style.color =
        latestResult.projectSlipDays > 0 ? "var(--bk-danger)" : "var(--bk-success)";
    }
    const affEl = overlay.querySelector("#wi-kpi-affected");
    if (affEl) affEl.textContent = String(latestResult.affectedTaskCount);

    const costEl = overlay.querySelector<HTMLElement>("#wi-kpi-cost");
    if (costEl) {
      costEl.textContent = `${latestResult.deltaCostImpact >= 0 ? "+" : "-"}$${Math.abs(latestResult.deltaCostImpact).toLocaleString()}`;
      costEl.style.color =
        latestResult.deltaCostImpact > 0 ? "var(--bk-danger)" : "var(--bk-success)";
    }
    const spiEl = overlay.querySelector("#wi-kpi-spi");
    if (spiEl) {
      spiEl.textContent = `${latestResult.baselineSpi.toFixed(2)} → ${latestResult.simulatedSpi.toFixed(2)}`;
    }
    const finEl = overlay.querySelector("#wi-finish-summary");
    if (finEl) {
      finEl.innerHTML = `Baseline Finish: <strong>${escapeHtml(latestResult.baselineEndDate)}</strong> &nbsp;→&nbsp; Simulated Finish: <strong style="color:var(--bk-warning);">${escapeHtml(latestResult.simulatedEndDate)}</strong>`;
    }
  };

  updateReadouts();

  overlay.querySelector("#wi-revert")?.addEventListener("click", () => modal.close());
  overlay.querySelector<HTMLSelectElement>("#wi-task-select")?.addEventListener("change", (ev) => {
    selectedTaskId = (ev.target as HTMLSelectElement).value;
    updateReadouts();
  });
  overlay.querySelector<HTMLInputElement>("#wi-delay-slider")?.addEventListener("input", (ev) => {
    delayDays = Number((ev.target as HTMLInputElement).value);
    updateReadouts();
  });
  overlay.querySelector<HTMLInputElement>("#wi-cascade-check")?.addEventListener("change", (ev) => {
    cascade = (ev.target as HTMLInputElement).checked;
    updateReadouts();
  });

  const acceptBtn = overlay.querySelector<HTMLButtonElement>("#wi-accept");
  acceptBtn?.addEventListener("click", async () => {
    if (acceptBtn) {
      acceptBtn.disabled = true;
      acceptBtn.textContent = "Applying...";
    }
    try {
      await options.onAcceptScenario(latestResult);
      modal.close();
    } catch (err) {
      console.error("Failed to apply What-If scenario:", err);
      if (acceptBtn) {
        acceptBtn.disabled = false;
        acceptBtn.textContent = "Apply Scenario (Undoable)";
      }
    }
  });
}
