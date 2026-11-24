/**
 * LookaheadEngine — 2 / 3 / 4 / 6-Week Construction Site Lookahead Scheduler
 *
 * Classifies 4D schedule tasks relative to the active simulation date (`anchorMs`) into:
 *  - completed:  finished before anchorMs
 *  - thisWeek:   active within [anchorMs, anchorMs + 7d]
 *  - lookahead:  starting or active within (anchorMs + 7d, anchorMs + weeks * 7d]
 *  - future:     starting after the lookahead horizon
 *
 * Produces ready-to-highlight 3D modelIdMaps and exports printable / CSV site lookaheads.
 */

import type { ScheduleTask } from "./ScheduleManager";
import { escapeHtml } from "../utils/formatters";
import { createBkModal } from "../ui/UiPlatform";

const DAY_MS = 24 * 60 * 60 * 1000;

export interface LookaheadReport {
  anchorIso: string;
  horizonIso: string;
  weeks: number;
  completedTasks: ScheduleTask[];
  thisWeekTasks: ScheduleTask[];
  lookaheadTasks: ScheduleTask[];
  futureTasks: ScheduleTask[];
  buckets: {
    completed: Record<string, Set<number>>;
    thisWeek: Record<string, Set<number>>;
    lookahead: Record<string, Set<number>>;
    future: Record<string, Set<number>>;
  };
}

function addTaskElements(target: Record<string, Set<number>>, task: ScheduleTask): void {
  if (!task.elementIds || task.elementIds.size === 0) return;
  const mId = task.modelId || "default-model";
  const set = (target[mId] ??= new Set<number>());
  for (const eid of task.elementIds) set.add(eid);
}

export function computeLookaheadReport(
  tasks: ScheduleTask[],
  anchorMs: number,
  weeks = 3
): LookaheadReport {
  const safeWeeks = Math.max(1, Math.min(12, Math.round(weeks)));
  const week1EndMs = anchorMs + 7 * DAY_MS;
  const horizonMs = anchorMs + safeWeeks * 7 * DAY_MS;

  const completedTasks: ScheduleTask[] = [];
  const thisWeekTasks: ScheduleTask[] = [];
  const lookaheadTasks: ScheduleTask[] = [];
  const futureTasks: ScheduleTask[] = [];

  const buckets: LookaheadReport["buckets"] = {
    completed: {},
    thisWeek: {},
    lookahead: {},
    future: {},
  };

  for (const task of tasks) {
    if (task.isSummary || !task.startDate || !task.endDate) continue;
    const startMs = new Date(task.startDate).getTime();
    const endMs = new Date(task.endDate).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;

    if (task.status === "Completed" || endMs < anchorMs) {
      completedTasks.push(task);
      addTaskElements(buckets.completed, task);
    } else if (startMs <= week1EndMs && endMs >= anchorMs) {
      thisWeekTasks.push(task);
      addTaskElements(buckets.thisWeek, task);
    } else if (startMs <= horizonMs) {
      lookaheadTasks.push(task);
      addTaskElements(buckets.lookahead, task);
    } else {
      futureTasks.push(task);
      addTaskElements(buckets.future, task);
    }
  }

  return {
    anchorIso: new Date(anchorMs).toISOString().slice(0, 10),
    horizonIso: new Date(horizonMs).toISOString().slice(0, 10),
    weeks: safeWeeks,
    completedTasks,
    thisWeekTasks,
    lookaheadTasks,
    futureTasks,
    buckets,
  };
}

export function exportLookaheadCsv(report: LookaheadReport): string {
  const csvCell = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows: string[] = [
    "Window,TaskID,TaskName,StartDate,EndDate,Elements,TotalCost",
  ];
  for (const t of report.thisWeekTasks) {
    rows.push(
      ["THIS_WEEK", t.id, t.name, t.startDate, t.endDate, t.elementIds?.size || 0, t.totalCost || 0]
        .map(csvCell)
        .join(",")
    );
  }
  for (const t of report.lookaheadTasks) {
    rows.push(
      [`NEXT_${report.weeks}_WEEKS`, t.id, t.name, t.startDate, t.endDate, t.elementIds?.size || 0, t.totalCost || 0]
        .map(csvCell)
        .join(",")
    );
  }
  return rows.join("\n");
}

export function openLookaheadModal(options: {
  tasks: ScheduleTask[];
  anchorMs: number;
  initialWeeks?: number;
  onApply3DLookahead: (report: LookaheadReport) => Promise<void> | void;
  onClearLookahead: () => Promise<void> | void;
}): void {
  let currentWeeks = options.initialWeeks ?? 3;

  const renderModal = () => {
    const report = computeLookaheadReport(options.tasks, options.anchorMs, currentWeeks);
    const listHtml = (items: ScheduleTask[], badgeColor: string) =>
      items.length === 0
        ? `<div style="font-size:var(--bk-text-sm);color:var(--bk-text-muted);">No tasks in this window.</div>`
        : items
            .slice(0, 25)
            .map(
              (t) => `
            <div class="audit-row-item">
              <span style="font-size:var(--bk-text-sm);font-weight:600;color:var(--bk-text);">${escapeHtml(t.name)}</span>
              <span style="font-size:var(--bk-text-xs);font-variant-numeric:tabular-nums;color:${badgeColor};">${escapeHtml(t.startDate)} → ${escapeHtml(t.endDate)} (${t.elementIds?.size || 0})</span>
            </div>`
            )
            .join("");

    const modal = createBkModal({
      id: "lookahead-modal",
      title: `${currentWeeks}-Week Construction Site Lookahead`,
      subtitle: `Window: ${escapeHtml(report.anchorIso)} → ${escapeHtml(report.horizonIso)}`,
      size: "lg",
      closeButtonId: "la-close",
      headerActionsHtml: `
        <div class="bk-seg">
          ${[2, 3, 4, 6]
            .map(
              (w) =>
                `<button type="button" class="bk-seg__btn btn-la-weeks ${w === currentWeeks ? "is-active" : ""}" data-weeks="${w}">${w}W</button>`
            )
            .join("")}
        </div>
      `,
      bodyHtml: `
        <div class="bk-kpi-grid">
          <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--bk-success);">${report.completedTasks.length}</div><div class="audit-kpi-lbl">Completed</div></div>
          <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--bk-accent-text);">${report.thisWeekTasks.length}</div><div class="audit-kpi-lbl">This Week</div></div>
          <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--bk-warning);">${report.lookaheadTasks.length}</div><div class="audit-kpi-lbl">Next ${currentWeeks}W</div></div>
          <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--bk-text-muted);">${report.futureTasks.length}</div><div class="audit-kpi-lbl">Later</div></div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
          <div class="bk-card" style="max-height:240px;overflow-y:auto;">
            <div style="font-size:var(--bk-text-sm);font-weight:700;color:var(--bk-accent-text);margin-bottom:6px;">Active This Week (${report.thisWeekTasks.length})</div>
            <div style="display:flex;flex-direction:column;gap:4px;">${listHtml(report.thisWeekTasks, "var(--bk-accent-text)")}</div>
          </div>
          <div class="bk-card" style="max-height:240px;overflow-y:auto;">
            <div style="font-size:var(--bk-text-sm);font-weight:700;color:var(--bk-warning);margin-bottom:6px;">Upcoming (${currentWeeks}-Week Horizon: ${report.lookaheadTasks.length})</div>
            <div style="display:flex;flex-direction:column;gap:4px;">${listHtml(report.lookaheadTasks, "var(--bk-warning)")}</div>
          </div>
        </div>
      `,
      footerHtml: `
        <button type="button" id="la-export-csv" class="bk-btn bk-btn--secondary" style="margin-right:auto;">Export Lookahead CSV</button>
        <button type="button" id="la-clear-3d" class="bk-btn bk-btn--secondary">Clear 3D Filter</button>
        <button type="button" id="la-apply-3d" class="bk-btn bk-btn--primary">Highlight ${currentWeeks}W Lookahead in 3D</button>
      `,
    });

    const overlay = modal.overlay;
    overlay.querySelectorAll<HTMLButtonElement>(".btn-la-weeks").forEach((b) => {
      b.addEventListener("click", () => {
        currentWeeks = Number(b.dataset.weeks) || 3;
        renderModal();
      });
    });
    overlay.querySelector("#la-apply-3d")?.addEventListener("click", async () => {
      await options.onApply3DLookahead(report);
      modal.close();
    });
    overlay.querySelector("#la-clear-3d")?.addEventListener("click", async () => {
      await options.onClearLookahead();
      modal.close();
    });
    overlay.querySelector("#la-export-csv")?.addEventListener("click", () => {
      const csv = exportLookaheadCsv(report);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BIM_Kintsugi_${currentWeeks}W_Lookahead_${report.anchorIso}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    });
  };

  renderModal();
}
