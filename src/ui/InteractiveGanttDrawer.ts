import { ScheduleManager, type ScheduleTask } from "../modules/ScheduleManager";
import { ScheduleImportParsers } from "../modules/ScheduleImportParsers";
import { RuleSearchEngine } from "../modules/RuleSearchEngine";
import { showToast } from "./ToastManager";

export type GanttTimeScale = "month" | "week" | "day";

const STORAGE_LEFT_WIDTH_KEY = "bim_gantt_left_width_v1";

/**
 * InteractiveGanttDrawer — Hierarchical WBS & 4D Interactive Gantt Drawer for BIM Kintsugi.
 *
 * Provides collapsible WBS tree rollups, resizable table/chart splitter, multi-tier
 * Month/Week/Day timescales, dependency SVG connectors, Search Set XML rule import,
 * interactive chart-canvas scrubbing, and bi-directional 3D cross-highlighting.
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
  private collapsedParentIds: Set<string> = new Set();
  private timeScale: GanttTimeScale = "week";
  private leftPaneWidthPx: number = 470;
  private splitterEl: HTMLElement | null = null;

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
            <div class="gantt-scale-pill-group" role="group" aria-label="Gantt Timescale">
              <button type="button" class="btn-gantt-scale" data-scale="month" title="Zoom out to Months">M</button>
              <button type="button" class="btn-gantt-scale active" data-scale="week" title="Weekly Grid">W</button>
              <button type="button" class="btn-gantt-scale" data-scale="day" title="Zoom in to Days">D</button>
            </div>
            <button id="btn-gantt-import-rules" class="btn-gantt-drawer-action" title="Import Autodesk Navisworks Search Sets (.xml) for dynamic 4D rule binding">Rules XML</button>
            <input type="file" id="gantt-rules-file-input" accept=".xml" style="display: none;" />
            <button id="btn-gantt-cost-control" class="btn-gantt-drawer-action" title="Open Unified 5D Project Cost Control Suite" style="border-color: var(--color-success-border); color: var(--color-success);">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display: inline-block; vertical-align: middle; margin-right: 2px;"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> 5D Cost Control
            </button>
            <button id="btn-gantt-sync-synchro" class="btn-gantt-drawer-action" title="Synchronize 4D Sequence with Synchro Schedule XML and model SIMULATION property" style="border-color: var(--color-info-border); color: var(--color-info);">⚡ Sync Synchro (SIMULATION)</button>
            <button id="btn-gantt-export-mspdi" class="btn-gantt-drawer-action" title="Export schedule to Microsoft Project XML (MSPDI)">Export MSP XML</button>
            <button id="btn-gantt-export-p6" class="btn-gantt-drawer-action" title="Export schedule to Oracle Primavera P6 XER">Export P6 XER</button>
            <button id="btn-gantt-export-csv" class="btn-gantt-drawer-action" title="Export schedule to CSV with itemized 5D unit & total costs">Export CSV (Cost)</button>
            <button id="btn-gantt-fit-dates" class="btn-gantt-drawer-action" title="Fit all tasks into timeline view">Fit Timeline</button>
            <button id="btn-close-gantt-drawer" class="btn-icon-sm" title="Close Gantt Drawer">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
        <div class="gantt-drawer-body">
          <div class="gantt-pane-splitter" id="gantt-pane-splitter" title="Drag to resize WBS table vs timeline"></div>
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
    this.splitterEl = panel.querySelector("#gantt-pane-splitter");

    // Restore saved left pane width for WBS table splitter
    try {
      const savedW = Number(localStorage.getItem(STORAGE_LEFT_WIDTH_KEY));
      if (Number.isFinite(savedW) && savedW >= 260 && savedW <= 720) {
        this.leftPaneWidthPx = savedW;
      }
    } catch {}
    panel.style.setProperty("--gantt-left-width", `${this.leftPaneWidthPx}px`);

    this.setupSplitterDrag();
    this.setupDirectChartScrub();

    // Scale selector buttons (Month / Week / Day)
    panel.querySelectorAll<HTMLButtonElement>(".btn-gantt-scale").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextScale = (btn.dataset.scale as GanttTimeScale) || "week";
        this.setTimeScale(nextScale);
      });
    });

    // Navisworks XML Rule Set import button
    const rulesBtn = panel.querySelector("#btn-gantt-import-rules");
    const rulesInput = panel.querySelector<HTMLInputElement>("#gantt-rules-file-input");
    rulesBtn?.addEventListener("click", () => rulesInput?.click());
    rulesInput?.addEventListener("change", async () => {
      const file = rulesInput.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const ruleEngine = RuleSearchEngine.getInstance();
        const imported = ruleEngine.importNavisworksXml(text);
        if (imported.length === 0) {
          showToast("No valid Search Sets found in XML file", "warning");
          return;
        }
        const scheduleManager: ScheduleManager | undefined = (window as any).scheduleManager;
        let boundCount = 0;
        if (scheduleManager) {
          for (const rule of imported) {
            const evalRes = await ruleEngine.evaluateAgainstLoadedModels(rule);
            if (evalRes.matchedCount === 0) continue;
            for (const task of scheduleManager.tasks.values()) {
              if (
                task.name.toLowerCase().includes(rule.name.toLowerCase()) ||
                rule.name.toLowerCase().includes(task.name.toLowerCase())
              ) {
                scheduleManager.bindSearchSetRuleToTask(task.id, rule.id, evalRes.modelIdMap);
                boundCount++;
              }
            }
          }
          scheduleManager.recomputeCpmAndRollups();
          this.render();
        }
        showToast(`Imported ${imported.length} Search Sets (${boundCount} matched to tasks)`, "success");
      } catch (err) {
        console.warn("XML rules import error:", err);
        showToast("Failed to parse Search Set XML", "warning");
      } finally {
        rulesInput.value = "";
      }
    });

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

    panel.querySelector("#btn-gantt-sync-synchro")?.addEventListener("click", () => {
      if (typeof (window as any).sync4DWithSimulationProperty === "function") {
        (window as any).sync4DWithSimulationProperty();
      }
    });

    panel.querySelector("#btn-gantt-export-mspdi")?.addEventListener("click", () => {
      this.exportSchedule("MSPDI");
    });

    panel.querySelector("#btn-gantt-export-p6")?.addEventListener("click", () => {
      this.exportSchedule("P6");
    });

    panel.querySelector("#btn-gantt-export-csv")?.addEventListener("click", () => {
      this.exportSchedule("CSV");
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

  public open(): void {
    this.show();
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

  public setTimeScale(scale: GanttTimeScale): void {
    this.timeScale = scale;
    this.container?.querySelectorAll<HTMLButtonElement>(".btn-gantt-scale").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.scale === scale);
    });
    this.render();
  }

  private setupSplitterDrag(): void {
    if (!this.splitterEl || !this.container) return;
    let startX = 0;
    let startWidth = this.leftPaneWidthPx;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      this.leftPaneWidthPx = Math.max(260, Math.min(720, Math.round(startWidth + dx)));
      this.container?.style.setProperty("--gantt-left-width", `${this.leftPaneWidthPx}px`);
      const currentMs = (window as any).currentTimelineDate?.getTime?.();
      if (currentMs) this.updateSeekbarPosition(currentMs, false);
    };

    const onUp = () => {
      this.splitterEl?.classList.remove("dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      try {
        localStorage.setItem(STORAGE_LEFT_WIDTH_KEY, String(this.leftPaneWidthPx));
      } catch {}
    };

    this.splitterEl.addEventListener("mousedown", (e) => {
      e.preventDefault();
      startX = e.clientX;
      startWidth = this.leftPaneWidthPx;
      this.splitterEl?.classList.add("dragging");
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    });
  }

  private setupDirectChartScrub(): void {
    if (!this.tasksList) return;
    let scrubbing = false;

    const scrubAtClientX = (clientX: number) => {
      const sampleCell =
        this.tasksList?.querySelector<HTMLElement>(".col-task-bar-cell") || this.timelineHeader;
      if (!sampleCell) return;
      const rect = sampleCell.getBoundingClientRect();
      if (rect.width <= 0) return;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const bounds = this.getTimelineBounds();
      const targetMs = bounds.min.getTime() + ratio * Math.max(1, bounds.max.getTime() - bounds.min.getTime());
      if (typeof (window as any).jumpTimelineToDate === "function") {
        (window as any).jumpTimelineToDate(new Date(targetMs));
      }
      this.updateSeekbarPosition(targetMs, true);
    };

    this.tasksList.addEventListener("mousedown", (e) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest(".col-task-bar-cell")) return;
      if (target.closest(".gantt-bar-item")) return; // Preserve click-to-select-task on bars
      scrubbing = true;
      this.isUserDraggingSeekbar = true;
      scrubAtClientX(e.clientX);
    });

    document.addEventListener("mousemove", (e) => {
      if (!scrubbing) return;
      scrubAtClientX(e.clientX);
    });

    document.addEventListener("mouseup", () => {
      if (!scrubbing) return;
      scrubbing = false;
      this.isUserDraggingSeekbar = false;
    });
  }

  /** Builds depth-first hierarchical WBS order while preserving chronological sort within siblings. */
  private getHierarchicalTasks(tasks: ScheduleTask[]): Array<{ task: ScheduleTask; depth: number; hasChildren: boolean }> {
    const byId = new Map<string, ScheduleTask>();
    const childrenMap = new Map<string, ScheduleTask[]>();
    for (const t of tasks) {
      byId.set(t.id, t);
      childrenMap.set(t.id, []);
    }

    const roots: ScheduleTask[] = [];
    for (const t of tasks) {
      if (t.parentId && t.parentId !== t.id && byId.has(t.parentId)) {
        childrenMap.get(t.parentId)!.push(t);
      } else {
        roots.push(t);
      }
    }

    const byStartAsc = (a: ScheduleTask, b: ScheduleTask) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    roots.sort(byStartAsc);

    const out: Array<{ task: ScheduleTask; depth: number; hasChildren: boolean }> = [];
    const visited = new Set<string>();

    const visit = (node: ScheduleTask, depth: number) => {
      if (visited.has(node.id)) return;
      visited.add(node.id);
      const kids = (childrenMap.get(node.id) ?? []).sort(byStartAsc);
      const hasChildren = kids.length > 0 || Boolean(node.isSummary);
      out.push({ task: node, depth, hasChildren });
      if (!this.collapsedParentIds.has(node.id)) {
        for (const kid of kids) {
          visit(kid, depth + 1);
        }
      }
    };

    for (const r of roots) visit(r, 0);
    return out;
  }

  private renderTimelineTicks(minTime: number, maxTime: number): void {
    const ticksTrack = this.timelineHeader?.querySelector("#gantt-ticks-track") || this.timelineHeader;
    if (!ticksTrack) return;
    const totalDuration = Math.max(86_400_000, maxTime - minTime);

    // Major Year-Month tier
    const majorSpans: string[] = [];
    const startD = new Date(minTime);
    const curMonth = new Date(Date.UTC(startD.getUTCFullYear(), startD.getUTCMonth(), 1));
    const monthsList = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let guard = 0;
    while (curMonth.getTime() <= maxTime && guard < 48) {
      const mStart = Math.max(minTime, curMonth.getTime());
      const nextMonth = new Date(Date.UTC(curMonth.getUTCFullYear(), curMonth.getUTCMonth() + 1, 1));
      const mEnd = Math.min(maxTime, nextMonth.getTime());
      const pct = Math.max(2, ((mEnd - mStart) / totalDuration) * 100);
      const label = `${monthsList[curMonth.getUTCMonth()]} '${String(curMonth.getUTCFullYear()).slice(2)}`;
      majorSpans.push(`<span class="gantt-tick-major" style="width: ${pct.toFixed(2)}%;">${label}</span>`);
      curMonth.setUTCMonth(curMonth.getUTCMonth() + 1);
      guard++;
    }

    // Minor tier driven by selected zoom scale
    const minorTicks: string[] = [];
    if (this.timeScale === "day") {
      const days = Math.max(1, Math.min(31, Math.ceil(totalDuration / 86_400_000)));
      const step = Math.max(1, Math.ceil(Math.ceil(totalDuration / 86_400_000) / days));
      for (let d = 0; d <= Math.ceil(totalDuration / 86_400_000); d += step) {
        const dt = new Date(minTime + d * 86_400_000);
        minorTicks.push(`<span class="gantt-tick">${dt.getUTCDate()}/${dt.getUTCMonth() + 1}</span>`);
        if (minorTicks.length >= 24) break;
      }
    } else if (this.timeScale === "month") {
      const count = Math.min(24, Math.max(1, majorSpans.length));
      for (let i = 1; i <= count; i++) minorTicks.push(`<span class="gantt-tick">M${i}</span>`);
    } else {
      const weeks = Math.max(1, Math.ceil(totalDuration / (7 * 86_400_000)));
      for (let w = 1; w <= Math.min(weeks, 24); w++) {
        minorTicks.push(`<span class="gantt-tick">W${w}</span>`);
      }
    }

    ticksTrack.innerHTML = `
      <div class="gantt-ticks-tier-major">${majorSpans.join("")}</div>
      <div style="display:flex;width:100%;justify-content:space-between;">${minorTicks.join("")}</div>
    `;
  }

  public render(): void {
    if (!this.tasksList) return;
    this.ensureDefaultTasks();
    const scheduleManager: ScheduleManager | undefined = (window as any).scheduleManager;
    if (!scheduleManager || scheduleManager.tasks.size === 0) {
      this.tasksList.innerHTML = `<div class="empty-state">No active construction tasks. Load an IFC model or import a schedule to generate Gantt chart.</div>`;
      return;
    }

    const sortedTasks = scheduleManager.getTasksSorted();
    const orderedRows = this.getHierarchicalTasks(sortedTasks);
    const countBadge = document.getElementById("gantt-task-count-badge");
    if (countBadge) countBadge.innerText = `${sortedTasks.length} Tasks`;

    const bounds = this.getTimelineBounds();
    const minTime = bounds.min.getTime();
    const maxTime = bounds.max.getTime();
    const totalDuration = Math.max(1, maxTime - minTime);

    this.renderTimelineTicks(minTime, maxTime);

    // Keep playhead line & dependency SVG overlay inside tasks list
    this.tasksList.innerHTML = `
      <svg class="gantt-dependency-svg" id="gantt-dependency-svg" preserveAspectRatio="none"></svg>
      <div class="gantt-playhead-line" id="gantt-playhead-line"></div>
    `;
    this.playheadLine = this.tasksList.querySelector("#gantt-playhead-line");
    const svgOverlay = this.tasksList.querySelector<SVGSVGElement>("#gantt-dependency-svg");

    const rowGeom = new Map<string, { rowIdx: number; leftPct: number; rightPct: number; isCritical: boolean }>();

    orderedRows.forEach(({ task: t, depth, hasChildren }, visibleIdx) => {
      const taskStart = new Date(t.startDate).getTime();
      const taskEnd = new Date(t.endDate).getTime();
      const leftPct = Math.max(0, Math.min(100, ((taskStart - minTime) / totalDuration) * 100));
      const widthPct = Math.max(1.5, Math.min(100 - leftPct, ((taskEnd - taskStart) / totalDuration) * 100));
      rowGeom.set(t.id, {
        rowIdx: visibleIdx,
        leftPct,
        rightPct: Math.min(100, leftPct + widthPct),
        isCritical: Boolean(t.isCritical),
      });

      const currentMs = (window as any).currentTimelineDate?.getTime?.();
      let displayStatus = t.status;
      if (Number.isFinite(currentMs) && Number.isFinite(taskStart) && Number.isFinite(taskEnd)) {
        if (t.status === "Completed" || currentMs >= taskEnd) {
          displayStatus = "Completed";
        } else if (currentMs >= taskStart) {
          displayStatus = "In Progress";
        } else {
          displayStatus = "Planned";
        }
      }

      const row = document.createElement("div");
      row.className = `gantt-task-row ${t.id === this.activeTaskId ? "active" : ""} ${hasChildren ? "is-summary" : ""}`;
      row.dataset.taskId = t.id;
      row.dataset.category = t.category;

      const statusClass = displayStatus === "Completed" ? "status-complete" : (displayStatus === "In Progress" ? "status-active" : "status-planned");
      const indentPx = Math.min(4, depth) * 14;
      const isCollapsed = this.collapsedParentIds.has(t.id);
      const toggleHtml = hasChildren
        ? `<button type="button" class="btn-gantt-tree-toggle" data-toggle-id="${t.id}" title="Collapse/Expand WBS Group">${isCollapsed ? "▶" : "▼"}</button>`
        : `<span class="task-drag-handle" style="margin-left:${indentPx}px;">≡</span>`;

      row.innerHTML = `
        <div class="col-task-name" title="${t.name}">
          ${toggleHtml}
          ${t.wbsCode ? `<span class="gantt-wbs-badge" style="font-size: 0.65rem; font-weight: 700; background: var(--color-info-subtle); color: var(--color-info); padding: 1px 4px; border-radius: 2px; margin-right: 4px;">${t.wbsCode}</span>` : ''}
          <span class="task-text">${t.name}</span>
          <span class="gantt-badge-elements" style="font-size: 0.6rem; font-weight: 700; background: var(--accent-glow2); color: var(--accent-500); padding: 1px 4px; border-radius: 2px; margin-left: 4px;" title="${t.elementIds.size} 3D elements assigned to task">${t.elementIds.size} 3D</span>
          <button type="button" class="btn-gantt-link-3d" data-task-id="${t.id}" style="font-size: 0.58rem; font-weight: 700; background: var(--color-info-subtle); color: var(--color-info); border: 1px solid var(--color-info-border); border-radius: 3px; padding: 1px 5px; cursor: pointer; margin-left: 6px;" title="Assign currently selected 3D elements in viewport to this task">🔗 Link 3D</button>
          ${t.isCritical ? `<span class="gantt-cpm-badge" style="font-size: 0.62rem; font-weight: 800; background: var(--color-danger-subtle); color: var(--color-danger); border: 1px solid var(--color-danger-border); padding: 1px 3px; border-radius: 2px; margin-left: 4px;" title="Critical Path Task (Total Float: ${t.totalFloat ?? 0}d / Free Float: ${t.freeFloat ?? 0}d)">CPM</span>` : ''}
          ${t.outOfSequence ? `<span class="gantt-cpm-badge" style="font-size: 0.58rem; font-weight: 800; background: rgba(245,158,11,0.2); color: #F59E0B; border: 1px solid rgba(245,158,11,0.5); padding: 1px 3px; border-radius: 2px; margin-left: 3px;" title="Out-of-Sequence warning">OOS</span>` : ''}
        </div>
        <div class="col-task-status">
          <span class="gantt-status-tag ${statusClass}">${displayStatus}</span>
        </div>
        <div class="col-task-dates">
          <span>${t.startDate.slice(5)} → ${t.endDate.slice(5)}</span>
        </div>
        <div class="col-task-bar-cell">
          <div class="gantt-bar-track">
            <div class="gantt-bar-item ${hasChildren ? "summary-bar" : statusClass}" 
                 style="left: ${leftPct.toFixed(1)}%; width: ${widthPct.toFixed(1)}%;" 
                 title="${t.name} (${t.startDate} to ${t.endDate})\n${t.elementIds.size} elements">
              <span class="gantt-bar-label">${t.name}</span>
            </div>
          </div>
        </div>
      `;

      // Click task or tree toggle chevron
      row.addEventListener("click", (e) => {
        const treeBtn = (e.target as HTMLElement)?.closest<HTMLElement>(".btn-gantt-tree-toggle");
        if (treeBtn) {
          e.stopPropagation();
          const pid = treeBtn.dataset.toggleId;
          if (pid) {
            if (this.collapsedParentIds.has(pid)) this.collapsedParentIds.delete(pid);
            else this.collapsedParentIds.add(pid);
            this.render();
          }
          return;
        }

        const linkBtn = (e.target as HTMLElement)?.closest(".btn-gantt-link-3d");
        if (linkBtn) {
          e.stopPropagation();
          const selMap = (window as any).getActiveSelectionMap ? (window as any).getActiveSelectionMap() : {};
          let totalSelected = 0;
          for (const mId in selMap) totalSelected += selMap[mId].size;

          if (totalSelected === 0) {
            showToast("Select 3D elements in the viewport first (Click or Shift+Click)", "warning");
            return;
          }

          const mgr: ScheduleManager | undefined = (window as any).scheduleManager;
          if (mgr) {
            const linked = mgr.assignElementsToTask(t.id, selMap);
            if (typeof (window as any).updateCumulative5DCost === "function") {
              (window as any).updateCumulative5DCost();
            }
            if (typeof (window as any).updateTimelineVisualState === "function") {
              (window as any).updateTimelineVisualState(true);
            }
            this.render();
            showToast(`✓ Assigned ${linked} 3D elements to task "${t.name}"!`, "success");
          }
          return;
        }

        this.selectTask(t);
      });

      this.tasksList!.appendChild(row);
    });

    // Draw lightweight SVG dependency connectors in percentage X & row-step Y space
    if (svgOverlay && orderedRows.length > 0 && orderedRows.length <= 250) {
      const rowHeight = 29;
      const totalH = orderedRows.length * rowHeight;
      svgOverlay.setAttribute("viewBox", `0 0 100 ${totalH}`);
      svgOverlay.style.height = `${totalH}px`;
      const paths: string[] = [];
      for (const { task } of orderedRows) {
        if (!task.predecessors) continue;
        const succ = rowGeom.get(task.id);
        if (!succ) continue;
        for (const dep of task.predecessors) {
          const pred = rowGeom.get(dep.predecessorId);
          if (!pred) continue;
          const x1 = dep.type === "SS" || dep.type === "SF" ? pred.leftPct : pred.rightPct;
          const y1 = pred.rowIdx * rowHeight + rowHeight * 0.5;
          const x2 = dep.type === "FF" || dep.type === "SF" ? succ.rightPct : succ.leftPct;
          const y2 = succ.rowIdx * rowHeight + rowHeight * 0.5;
          const midX = x1 + (x2 - x1) * 0.5;
          const isCritEdge = pred.isCritical && succ.isCritical;
          const stroke = isCritEdge ? "rgba(239,68,68,0.85)" : "rgba(148,163,184,0.45)";
          paths.push(
            `<path d="M ${x1.toFixed(2)} ${y1} L ${midX.toFixed(2)} ${y1} L ${midX.toFixed(2)} ${y2} L ${x2.toFixed(2)} ${y2}" fill="none" stroke="${stroke}" stroke-width="${isCritEdge ? 0.45 : 0.3}" vector-effect="non-scaling-stroke" />`
          );
          if (paths.length >= 600) break;
        }
        if (paths.length >= 600) break;
      }
      svgOverlay.innerHTML = paths.join("");
    }

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
      this.playheadLine.style.left = `calc(var(--gantt-left-width, 470px) + (100% - var(--gantt-left-width, 470px)) * ${pct / 100})`;
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

  public getActiveTaskId(): string | null {
    return this.activeTaskId;
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

    // Highlight task elements in 4D mode (or isolate outside 4D mode) without corrupting cumulative 4D timeline
    if (task.elementIds.size > 0 && (window as any).components) {
      try {
        const components = (window as any).components;
        const mId = task.modelId || "default-model";
        const is4d = document.body.classList.contains("mode-4d");
        const highlighter = (window as any).highlighter;
        if (is4d && highlighter?.highlightByID) {
          highlighter.highlightByID("select", { [mId]: task.elementIds }, true, false);
        } else {
          const hider = components.get ? components.get((window as any).OBC?.Hider) : null;
          if (hider) {
            hider.isolate({ [mId]: task.elementIds });
          }
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

  public exportSchedule(format: "MSPDI" | "P6" | "CSV"): void {
    const scheduleManager: ScheduleManager | undefined = (window as any).scheduleManager;
    if (!scheduleManager || scheduleManager.tasks.size === 0) {
      showToast("No schedule tasks available to export", "warning");
      return;
    }
    const tasks = scheduleManager.getTasksSorted();
    if (format === "MSPDI") {
      const xml = ScheduleImportParsers.exportToMSPDI(tasks);
      this.triggerDownload(xml, "BIM_Kintsugi_Schedule.xml", "application/xml");
      showToast(`Exported ${tasks.length} tasks to Microsoft Project XML`, "success");
    } else if (format === "P6") {
      const xer = ScheduleImportParsers.exportToPrimaveraP6(tasks);
      this.triggerDownload(xer, "BIM_Kintsugi_Schedule.xer", "text/plain");
      showToast(`Exported ${tasks.length} tasks to Oracle Primavera P6 XER`, "success");
    } else if (format === "CSV") {
      const csv = scheduleManager.exportScheduleTemplateCSV();
      const dateStr = new Date().toISOString().split("T")[0];
      this.triggerDownload(csv, `4D_Schedule_Cost_${dateStr}.csv`, "text/csv;charset=utf-8;");
      showToast(`Exported ${tasks.length} tasks with itemized 5D costs to CSV`, "success");
    }
  }

  private triggerDownload(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

}