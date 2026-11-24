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
  document.getElementById("lookahead-modal")?.remove();
  let currentWeeks = options.initialWeeks ?? 3;

  const overlay = document.createElement("div");
  overlay.id = "lookahead-modal";
  overlay.className = "modal-overlay open";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:10060;background:rgba(5,7,12,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;";

  const renderContent = () => {
    const report = computeLookaheadReport(options.tasks, options.anchorMs, currentWeeks);
    const listHtml = (items: ScheduleTask[], badgeColor: string) =>
      items.length === 0
        ? `<div style="font-size:0.73rem;color:var(--text-muted);">No tasks in this window.</div>`
        : items
            .slice(0, 25)
            .map(
              (t) => `
            <div class="audit-row-item">
              <span style="font-size:0.74rem;font-weight:600;color:var(--text-primary);">${escapeHtml(t.name)}</span>
              <span style="font-size:0.66rem;font-variant-numeric:tabular-nums;color:${badgeColor};">${escapeHtml(t.startDate)} → ${escapeHtml(t.endDate)} (${t.elementIds?.size || 0})</span>
            </div>`
            )
            .join("");

    overlay.innerHTML = `
      <div style="width:min(740px,96vw);max-height:88vh;border-radius:12px;border:1px solid var(--border-strong);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--studio-hairline);">
          <div>
            <div style="font-weight:750;font-size:0.95rem;">${currentWeeks}-Week Construction Site Lookahead</div>
            <div style="font-size:0.73rem;color:var(--text-muted);font-variant-numeric:tabular-nums;">Window: ${escapeHtml(report.anchorIso)} → ${escapeHtml(report.horizonIso)}</div>
          </div>
          <div style="display:flex;gap:0.35rem;align-items:center;">
            ${[2, 3, 4, 6]
              .map(
                (w) =>
                  `<button type="button" class="btn-secondary btn-la-weeks ${w === currentWeeks ? "active" : ""}" data-weeks="${w}" style="font-size:0.7rem;padding:0.22rem 0.5rem;">${w}W</button>`
              )
              .join("")}
            <button type="button" id="la-close" class="btn-secondary" style="padding:0.22rem 0.55rem;">✕</button>
          </div>
        </div>

        <div class="thin-scrollbar" style="padding:0.95rem 1.1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.8rem;">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;">
            <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--color-success);">${report.completedTasks.length}</div><div class="audit-kpi-lbl">Completed</div></div>
            <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--accent-500);">${report.thisWeekTasks.length}</div><div class="audit-kpi-lbl">This Week</div></div>
            <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--color-warning);">${report.lookaheadTasks.length}</div><div class="audit-kpi-lbl">Next ${currentWeeks}W</div></div>
            <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--text-muted);">${report.futureTasks.length}</div><div class="audit-kpi-lbl">Later</div></div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.7rem;">
            <div style="padding:0.7rem;border:1px solid var(--studio-hairline);border-radius:8px;max-height:240px;overflow-y:auto;">
              <div style="font-size:0.73rem;font-weight:700;color:var(--accent-500);margin-bottom:0.4rem;">Active This Week (${report.thisWeekTasks.length})</div>
              <div style="display:flex;flex-direction:column;gap:0.28rem;">${listHtml(report.thisWeekTasks, "var(--accent-500)")}</div>
            </div>
            <div style="padding:0.7rem;border:1px solid var(--studio-hairline);border-radius:8px;max-height:240px;overflow-y:auto;">
              <div style="font-size:0.73rem;font-weight:700;color:var(--color-warning);margin-bottom:0.4rem;">Upcoming (${currentWeeks}-Week Horizon: ${report.lookaheadTasks.length})</div>
              <div style="display:flex;flex-direction:column;gap:0.28rem;">${listHtml(report.lookaheadTasks, "var(--color-warning)")}</div>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;gap:0.5rem;padding:0.8rem 1.1rem;border-top:1px solid var(--studio-hairline);">
          <button type="button" id="la-export-csv" class="btn-secondary">Export Lookahead CSV</button>
          <div style="display:flex;gap:0.45rem;">
            <button type="button" id="la-clear-3d" class="btn-secondary">Clear 3D Filter</button>
            <button type="button" id="la-apply-3d" class="btn-primary">Highlight ${currentWeeks}W Lookahead in 3D</button>
          </div>
        </div>
      </div>
    `;

    overlay.querySelector("#la-close")?.addEventListener("click", () => overlay.remove());
    overlay.querySelectorAll<HTMLButtonElement>(".btn-la-weeks").forEach((b) => {
      b.addEventListener("click", () => {
        currentWeeks = Number(b.dataset.weeks) || 3;
        renderContent();
      });
    });
    overlay.querySelector("#la-apply-3d")?.addEventListener("click", async () => {
      await options.onApply3DLookahead(report);
      overlay.remove();
    });
    overlay.querySelector("#la-clear-3d")?.addEventListener("click", async () => {
      await options.onClearLookahead();
      overlay.remove();
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

  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) overlay.remove();
  });
  document.body.appendChild(overlay);
  renderContent();
}
