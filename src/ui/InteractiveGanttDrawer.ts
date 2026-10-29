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
  private playheadLine: HTMLElement | null = null;
  private playheadHeaderMarker: HTMLElement | null = null;
  private seekbarInput: HTMLInputElement | null = null;
  private currentDateDisplay: HTMLElement | null = null;
  private isUserDraggingSeekbar: boolean = false;

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
            <div class="gantt-playback-controls">
              <button id="btn-gantt-play-toggle" class="btn-gantt-play" title="Play / Pause 4D Animation (Space)">
                <span id="gantt-play-icon">▶</span>
                <span id="gantt-play-text">Play</span>
              </button>
              <span id="gantt-current-date-badge" class="gantt-date-badge">YYYY-MM-DD</span>
            </div>
            <input type="text" id="gantt-search-filter" class="gantt-search-input" placeholder="Filter tasks by name or category..." />
            <button id="btn-gantt-cost-control" class="btn-gantt-drawer-action" title="Open Unified 5D Project Cost Control Suite" style="border-color: rgba(16, 185, 129, 0.4); color: #10b981;">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display: inline-block; vertical-align: middle; margin-right: 2px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> 5D Cost Control
            </button>
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
            <div class="col-task-bar-header" id="gantt-timeline-header">
              <!-- Timeline ticks track and interactive seekbar overlay -->
              <div class="gantt-ticks-track" id="gantt-ticks-track"></div>
              <div class="gantt-seekbar-container" id="gantt-seekbar-container" title="Drag to seek 4D simulation date">
                <input type="range" id="gantt-seekbar-slider" class="gantt-seekbar-slider" min="0" max="1000" value="0" />
                <div class="gantt-playhead-marker" id="gantt-playhead-marker">
                  <span class="gantt-playhead-tag" id="gantt-playhead-tag">Today</span>
                </div>
              </div>
            </div>
          </div>
          <div class="gantt-table-rows thin-scrollbar" id="gantt-table-rows">
            <!-- Global vertical playhead line spanning across all Gantt rows -->
            <div class="gantt-playhead-line" id="gantt-playhead-line"></div>
            <div class="empty-state">No schedule tasks loaded. Activate 4D mode or import CSV/MS Project schedule.</div>
          </div>
        </div>
      `;
      document.body.appendChild(panel);
    }

    this.container = panel;
    this.tasksList = panel.querySelector("#gantt-table-rows");
    this.timelineHeader = panel.querySelector("#gantt-timeline-header");
    this.seekbarInput = panel.querySelector("#gantt-seekbar-slider");
    this.playheadLine = panel.querySelector("#gantt-playhead-line");
    this.playheadHeaderMarker = panel.querySelector("#gantt-playhead-marker");
    this.currentDateDisplay = panel.querySelector("#gantt-current-date-badge");

    // Play/Pause button in Gantt drawer
    const playBtn = panel.querySelector("#btn-gantt-play-toggle");
    playBtn?.addEventListener("click", () => {
      if (typeof (window as any).toggleTimelinePlayback === "function") {
        (window as any).toggleTimelinePlayback();
      }
    });

    // Seekbar input scrubbing
    if (this.seekbarInput) {
      this.seekbarInput.addEventListener("input", (e) => {
        this.isUserDraggingSeekbar = true;
        const val = Number((e.target as HTMLInputElement).value); // 0 to 1000
        const bounds = this.getTimelineBounds();
        if (bounds) {
          const minMs = bounds.min.getTime();
          const maxMs = bounds.max.getTime();
          const targetMs = minMs + (val / 1000) * (maxMs - minMs);
          const targetDate = new Date(targetMs);
          if (typeof (window as any).jumpTimelineToDate === "function") {
            (window as any).jumpTimelineToDate(targetDate);
          }
          this.updateSeekbarPosition(targetMs, false);
        }
      });

      this.seekbarInput.addEventListener("change", () => {
        this.isUserDraggingSeekbar = false;
      });
    }

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

    panel.querySelector("#btn-gantt-cost-control")?.addEventListener("click", () => {
      if (typeof (window as any).toggleUnifiedCostControl === "function") {
        (window as any).toggleUnifiedCostControl();
      }
    });
  }

  /**
   * Helper to retrieve active timeline bounds.
   * Derives bounds from either schedule tasks or simulation bounds to enclose all activities.
   */
  public getTimelineBounds(): { min: Date; max: Date } {
    const scheduleManager: ScheduleManager | undefined = (window as any).scheduleManager;
    const mgrBounds = scheduleManager?.getProjectDateRange();
    let simBounds: { min: Date; max: Date } | null = null;
    if (typeof (window as any).getTimelineBounds === "function") {
      const tb = (window as any).getTimelineBounds();
      if (tb && tb.min && tb.max) {
        const dMin = new Date(tb.min);
        const dMax = new Date(tb.max);
        if (!isNaN(dMin.getTime()) && !isNaN(dMax.getTime())) {
          simBounds = { min: dMin, max: dMax };
        }
      }
    }

    if (mgrBounds && simBounds) {
      // Enclose both so that neither task bars nor the timeline scrubber get clipped
      return {
        min: new Date(Math.min(mgrBounds.min.getTime(), simBounds.min.getTime())),
        max: new Date(Math.max(mgrBounds.max.getTime(), simBounds.max.getTime())),
      };
    }
    if (mgrBounds) return mgrBounds;
    if (simBounds) return simBounds;
    return { min: new Date("2026-06-18"), max: new Date("2026-08-18") };
  }

  /**
   * Ensures default schedule tasks are generated if none exist so the Gantt chart can be used.
   */
  private ensureDefaultTasks(): void {
    let scheduleManager: ScheduleManager | undefined = (window as any).scheduleManager;
    if (!scheduleManager) {
      scheduleManager = new ScheduleManager();
      (window as any).scheduleManager = scheduleManager;
    }
    if (scheduleManager.tasks.size === 0) {
      const bounds = this.getTimelineBounds();
      const minMs = bounds.min.getTime();
      const spanMs = Math.max(14 * 86400000, bounds.max.getTime() - minMs);
      const stepMs = Math.floor(spanMs / 6);

      const defaultPhases = [
        { name: "Substructure & Excavation", cat: "IFCFOOTING", offset: 0, dur: 1.5 },
        { name: "Structural Concrete Framing", cat: "IFCCOLUMN", offset: 1, dur: 2.0 },
        { name: "Floor Slabs & Decks", cat: "IFCSLAB", offset: 2.2, dur: 1.8 },
        { name: "Exterior Enclosure & Walls", cat: "IFCWALL", offset: 3.5, dur: 2.0 },
        { name: "MEP Rough-in & Services", cat: "IFCFLOWTERMINAL", offset: 4.2, dur: 1.8 },
        { name: "Interior Architectural Fitout", cat: "IFCCOVERING", offset: 5.0, dur: 1.5 },
      ];

      defaultPhases.forEach((p, idx) => {
        const start = new Date(minMs + p.offset * stepMs);
        const end = new Date(Math.min(bounds.max.getTime(), start.getTime() + p.dur * stepMs));
        const taskId = `phasing-task-${idx + 1}`;
        scheduleManager.tasks.set(taskId, {
          id: taskId,
          name: p.name,
          category: p.cat,
          startDate: start.toISOString().split("T")[0],
          endDate: end.toISOString().split("T")[0],
          status: "Planned",
          elementIds: new Set(),
          modelId: "default-model",
          unitCost: 0,
          quantity: 1,
        });
      });
    }
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
    this.ensureDefaultTasks();
    const scheduleManager: ScheduleManager | undefined = (window as any).scheduleManager;
    if (!scheduleManager || scheduleManager.tasks.size === 0) {
      this.tasksList.innerHTML = `<div class="empty-state">No active construction tasks. Load an IFC model or import a schedule to generate Gantt chart.</div>`;
      return;
    }

    const tasks = scheduleManager.getTasksSorted();
    const countBadge = document.getElementById("gantt-task-count-badge");
    if (countBadge) countBadge.innerText = `${tasks.length} Tasks`;

    const bounds = this.getTimelineBounds();
    const minTime = bounds.min.getTime();
    const maxTime = bounds.max.getTime();
    const totalDuration = Math.max(1, maxTime - minTime);

    // Render timeline month/week tick header
    const ticksTrack = this.timelineHeader?.querySelector("#gantt-ticks-track") || this.timelineHeader;
    if (ticksTrack) {
      const weeks = Math.max(1, Math.ceil(totalDuration / (7 * 24 * 60 * 60 * 1000)));
      const ticks: string[] = [];
      for (let w = 1; w <= Math.min(weeks, 24); w++) {
        ticks.push(`<span class="gantt-tick">W${w}</span>`);
      }
      ticksTrack.innerHTML = ticks.join("");
    }

    // Keep playhead line element inside tasks list
    this.tasksList.innerHTML = `<div class="gantt-playhead-line" id="gantt-playhead-line"></div>`;
    this.playheadLine = this.tasksList.querySelector("#gantt-playhead-line");

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

    // Re-sync seekbar position after rendering tasks
    const currentMs = (window as any).currentTimelineDate?.getTime?.();
    if (currentMs) {
      this.updateSeekbarPosition(currentMs, true);
    }
  }

  /**
   * Update the seekbar position and vertical playhead line during 4D animation playback.
   */
  public updateSeekbarPosition(currentDateMs: number, forceSliderSync: boolean = false): void {
    const bounds = this.getTimelineBounds();
    const minMs = bounds.min.getTime();
    const maxMs = bounds.max.getTime();
    const totalDuration = Math.max(1, maxMs - minMs);
    const clampedMs = Math.max(minMs, Math.min(maxMs, currentDateMs));
    const pct = Math.max(0, Math.min(100, ((clampedMs - minMs) / totalDuration) * 100));

    // Update seekbar input if user is not actively dragging it
    if (this.seekbarInput && (!this.isUserDraggingSeekbar || forceSliderSync)) {
      this.seekbarInput.value = String(Math.round((pct / 100) * 1000));
    }

    // Update header playhead marker position
    if (this.playheadHeaderMarker) {
      this.playheadHeaderMarker.style.left = `${pct.toFixed(2)}%`;
      const dateObj = new Date(clampedMs);
      const dateStr = dateObj.toISOString().split("T")[0];
      const tag = this.playheadHeaderMarker.querySelector("#gantt-playhead-tag");
      if (tag) {
        tag.textContent = dateStr.slice(5); // MM-DD
      }
    }

    // Update playhead vertical line spanning across task rows
    if (this.playheadLine) {
      // Align with column offset (col-task-name + col-task-status + col-task-dates = 260 + 90 + 120 = 470px)
      this.playheadLine.style.left = `calc(470px + (100% - 470px) * ${pct / 100})`;
      this.playheadLine.style.display = "block";
    }

    // Update date badge in header controls
    if (this.currentDateDisplay) {
      const dateObj = new Date(clampedMs);
      this.currentDateDisplay.textContent = dateObj.toISOString().split("T")[0];
    }

    // Sync play/pause toggle button state
    this.updatePlaybackState((window as any).isTimelinePlaying || false);
  }

  /**
   * Updates play button visual icon/label to reflect 4D animation status.
   */
  public updatePlaybackState(isPlaying: boolean): void {
    const playBtn = document.getElementById("btn-gantt-play-toggle");
    const playIcon = document.getElementById("gantt-play-icon");
    const playText = document.getElementById("gantt-play-text");
    if (!playBtn) return;

    if (isPlaying) {
      playBtn.classList.add("playing");
      if (playIcon) playIcon.textContent = "⏸";
      if (playText) playText.textContent = "Pause";
    } else {
      playBtn.classList.remove("playing");
      if (playIcon) playIcon.textContent = "▶";
      if (playText) playText.textContent = "Play";
    }
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
