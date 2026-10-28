import { ScheduleManager, type ScheduleTask } from "../modules/ScheduleManager";
import { showToast } from "./ToastManager";

/**
 * InteractiveGanttDrawer — Interactive horizontal Gantt chart drawer for BIM Kintsugi.
 *
 * Provides timeline visualization, task searching, interactive scrubbing,
 * and bi-directional cross-highlighting between schedule tasks and 3D IFC elements.
 */
export class InteractiveGanttDrawer {
  private static instance: InteractiveGanttDrawer | null = null;
  private container: HTMLElement | null = null;
  private tasksList: HTMLElement | null = null;
  private timelineHeader: HTMLElement | null = null;
  private isVisible: boolean = false;
  private activeTaskId: string | null = null;

  private constructor() {}

  public static getInstance(): InteractiveGanttDrawer {
    if (!InteractiveGanttDrawer.instance) {
      InteractiveGanttDrawer.instance = new InteractiveGanttDrawer();
    }
    return InteractiveGanttDrawer.instance;
  }

  public init(panelId: string = "gantt-chart-drawer"): void {
    let panel = document.getElementById(panelId);
    if (!panel) {
      panel = document.createElement("div");
      panel.id = panelId;
      panel.className = "interactive-gantt-drawer hidden";
      panel.innerHTML = `
        <div class="gantt-drawer-header">
          <div class="gantt-drawer-title-group">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/>
            </svg>
            <span class="gantt-drawer-title">4D Interactive Construction Gantt</span>
            <span id="gantt-task-count-badge" class="gantt-count-badge">0 Tasks</span>
          </div>
          <div class="gantt-drawer-controls">
            <input type="text" id="gantt-search-filter" class="gantt-search-input" placeholder="Filter tasks by name or category..." />
            <button id="btn-gantt-fit-dates" class="btn-gantt-drawer-action" title="Fit all tasks into timeline view">Fit Timeline</button>
            <button id="btn-close-gantt-drawer" class="btn-icon-sm" title="Close Gantt Drawer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="gantt-drawer-body">
          <div class="gantt-table-header">
            <div class="col-task-name">Task Description</div>
            <div class="col-task-status">Status</div>
            <div class="col-task-dates">Duration</div>
            <div class="col-task-bar-header" id="gantt-timeline-header"></div>
          </div>
          <div class="gantt-table-rows thin-scrollbar" id="gantt-table-rows">
            <div class="empty-state">No schedule tasks loaded. Activate 4D mode or import CSV/MS Project schedule.</div>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    this.container = panel;
    this.tasksList = panel.querySelector("#gantt-table-rows");
    this.timelineHeader = panel.querySelector("#gantt-timeline-header");

    panel.querySelector("#btn-close-gantt-drawer")?.addEventListener("click", () => {
      this.hide();
    });

    panel.querySelector("#gantt-search-filter")?.addEventListener("input", (e) => {
      const query = (e.target as HTMLInputElement).value.toLowerCase();
      this.filterTasks(query);
    });

    panel.querySelector("#btn-gantt-fit-dates")?.addEventListener("click", () => {
      this.render();
      showToast("Fitted Gantt timeline to project dates", "info");
    });
  }

  public show(): void {
    if (!this.container) this.init();
    this.container?.classList.remove("hidden");
    this.isVisible = true;
    this.render();
  }

  public hide(): void {
    this.container?.classList.add("hidden");
    this.isVisible = false;
  }

  public toggle(): boolean {
    if (this.isVisible) {
      this.hide();
      return false;
    } else {
      this.show();
      return true;
    }
  }

  public render(): void {
    if (!this.tasksList) return;
    const scheduleManager: ScheduleManager | undefined = (window as any).scheduleManager;
    if (!scheduleManager || scheduleManager.tasks.size === 0) {
      this.tasksList.innerHTML = `<div class="empty-state">No active construction tasks. Load an IFC model or import a schedule to generate Gantt chart.</div>`;
      return;
    }

    const tasks = scheduleManager.getTasksSorted();
    const countBadge = document.getElementById("gantt-task-count-badge");
    if (countBadge) countBadge.innerText = `${tasks.length} Tasks`;

    const bounds = scheduleManager.getProjectDateRange();
    if (!bounds) return;

    const minTime = bounds.min.getTime();
    const maxTime = bounds.max.getTime();
    const totalDuration = Math.max(1, maxTime - minTime);

    // Render timeline month/week tick header
    if (this.timelineHeader) {
      const weeks = Math.max(1, Math.ceil(totalDuration / (7 * 24 * 60 * 60 * 1000)));
      const ticks: string[] = [];
      for (let w = 1; w <= Math.min(weeks, 24); w++) {
        ticks.push(`<span class="gantt-tick">W${w}</span>`);
      }
      this.timelineHeader.innerHTML = `<div class="gantt-ticks-track">${ticks.join("")}</div>`;
    }

    this.tasksList.innerHTML = "";

    tasks.forEach((t) => {
      const taskStart = new Date(t.startDate).getTime();
      const taskEnd = new Date(t.endDate).getTime();
      const leftPct = Math.max(0, Math.min(100, ((taskStart - minTime) / totalDuration) * 100));
      const widthPct = Math.max(1.5, Math.min(100 - leftPct, ((taskEnd - taskStart) / totalDuration) * 100));

      const row = document.createElement("div");
      row.className = `gantt-task-row ${t.id === this.activeTaskId ? "active" : ""}`;
      row.dataset.taskId = t.id;
      row.dataset.category = t.category;

      const statusClass = t.status === "Completed" ? "status-complete" : (t.status === "In Progress" ? "status-active" : "status-planned");

      row.innerHTML = `
        <div class="col-task-name" title="${t.name}">
          <span class="task-drag-handle">≡</span>
          <span class="task-text">${t.name}</span>
        </div>
        <div class="col-task-status">
          <span class="gantt-status-tag ${statusClass}">${t.status}</span>
        </div>
        <div class="col-task-dates">
          <span>${t.startDate.slice(5)} → ${t.endDate.slice(5)}</span>
        </div>
        <div class="col-task-bar-cell">
          <div class="gantt-bar-track">
            <div class="gantt-bar-item ${statusClass}" 
                 style="left: ${leftPct.toFixed(1)}%; width: ${widthPct.toFixed(1)}%;" 
                 title="${t.name} (${t.startDate} to ${t.endDate})\n${t.elementIds.size} elements">
              <span class="gantt-bar-label">${t.name}</span>
            </div>
          </div>
        </div>
      `;

      // Click task: scrub timeline to task start and isolate elements in 3D
      row.addEventListener("click", () => {
        this.selectTask(t);
      });

      this.tasksList!.appendChild(row);
    });
  }

  public selectTask(task: ScheduleTask): void {
    this.activeTaskId = task.id;
    document.querySelectorAll(".gantt-task-row").forEach((r) => {
      r.classList.toggle("active", (r as HTMLElement).dataset.taskId === task.id);
    });

    // Jump 4D timeline scrubber to task's start date
    if (typeof (window as any).jumpTimelineToDate === "function") {
      (window as any).jumpTimelineToDate(new Date(task.startDate));
    }

    // Cross-isolate elements if task has assigned elements
    if (task.elementIds.size > 0 && (window as any).components) {
      try {
        const components = (window as any).components;
        const hider = components.get ? components.get((window as any).OBC?.Hider) : null;
        if (hider) {
          const mId = task.modelId || "default-model";
          hider.isolate({ [mId]: task.elementIds });
        }
      } catch (e) {
        console.warn("Cross-isolation failed:", e);
      }
    }
    showToast(`Selected Task: ${task.name} (${task.elementIds.size} elements)`, "info");
  }

  public highlightTaskForElement(modelId: string, expressId: number): void {
    const scheduleManager: ScheduleManager | undefined = (window as any).scheduleManager;
    if (!scheduleManager) return;

    for (const [, task] of scheduleManager.tasks) {
      if ((!task.modelId || task.modelId === modelId) && task.elementIds.has(expressId)) {
        this.activeTaskId = task.id;
        document.querySelectorAll(".gantt-task-row").forEach((r) => {
          const isMatch = (r as HTMLElement).dataset.taskId === task.id;
          r.classList.toggle("active", isMatch);
          if (isMatch) {
            r.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });
        break;
      }
    }
  }

  private filterTasks(query: string): void {
    if (!this.tasksList) return;
    const rows = this.tasksList.querySelectorAll<HTMLElement>(".gantt-task-row");
    rows.forEach((r) => {
      const text = r.innerText.toLowerCase();
      r.style.display = text.includes(query) ? "" : "none";
    });
  }
}
