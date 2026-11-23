/**
 * ScheduleTimelineController — Extracted 4D Schedule Sidebar, Filter, Virtualization,
 * Auto-Scroll, Camera Auto-Follow, and Viewport 4D HUD Controller.
 */

export type ScheduleFilterStatus = "all" | "active" | "completed" | "planned" | "unlinked";

export interface ScheduleTaskWidgetStats {
  startDate: string;
  endDate: string;
  totalCount: number;
  completedCount: number;
  pctOverride?: number;
  statusOverride?: "Planned" | "In Progress" | "Completed";
  isSummary?: boolean;
  modelIdMaps: Record<string, Set<number>>;
}

export interface ScheduleTaskEntry {
  taskKey: string;
  taskName: string;
  cleanDisplayTitle: string;
  stats: ScheduleTaskWidgetStats;
  taskStatus: "Planned" | "In Progress" | "Completed";
  isActive: boolean;
  pct: number;
  linkedElementCount: number;
}

interface ScheduleTaskItemRefs {
  item: HTMLDivElement;
  badge: HTMLSpanElement;
  fill: HTMLDivElement;
  progressText: HTMLSpanElement;
  stats: ScheduleTaskWidgetStats;
}

export interface ScheduleControllerCallbacks {
  onTaskClick: (taskKey: string, stats: ScheduleTaskWidgetStats) => Promise<void> | void;
  onCameraFollowTask?: (taskKey: string, stats: ScheduleTaskWidgetStats) => Promise<void> | void;
  onRequestRender?: () => void;
}

const VIRTUALIZATION_THRESHOLD = 150;
const VIRTUAL_ROW_HEIGHT = 82;
const VIRTUAL_OVERSCAN = 6;

export function cleanScheduleTaskTitle(taskName: string): string {
  return (
    taskName
      .replace(/^(Text\.[A-Za-z0-9_]+|SIMULATION|Reference|Pset_[A-Za-z0-9_]+):\s*/i, "")
      .trim() || taskName
  );
}

export function filterScheduleEntries(
  entries: ScheduleTaskEntry[],
  searchQuery: string,
  statusFilter: ScheduleFilterStatus
): ScheduleTaskEntry[] {
  const q = searchQuery.trim().toLowerCase();
  return entries.filter((entry) => {
    if (statusFilter === "active" && !entry.isActive && entry.taskStatus !== "In Progress") {
      return false;
    }
    if (statusFilter === "completed" && entry.taskStatus !== "Completed") {
      return false;
    }
    if (statusFilter === "planned" && entry.taskStatus !== "Planned") {
      return false;
    }
    if (statusFilter === "unlinked" && entry.linkedElementCount > 0) {
      return false;
    }
    if (q) {
      const hay = `${entry.cleanDisplayTitle} ${entry.taskName} ${entry.stats.startDate}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function computeVirtualWindow(
  totalItems: number,
  scrollTop: number,
  viewportHeight: number,
  rowHeight = VIRTUAL_ROW_HEIGHT,
  overscan = VIRTUAL_OVERSCAN
): { startIndex: number; endIndex: number; topSpacerPx: number; bottomSpacerPx: number } {
  const safeHeight = Math.max(rowHeight, viewportHeight || 320);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(safeHeight / rowHeight) + overscan * 2;
  const endIndex = Math.min(totalItems, startIndex + visibleCount);
  const topSpacerPx = startIndex * rowHeight;
  const bottomSpacerPx = Math.max(0, (totalItems - endIndex) * rowHeight);
  return { startIndex, endIndex, topSpacerPx, bottomSpacerPx };
}

export class ScheduleTimelineController {
  private callbacks: ScheduleControllerCallbacks;

  public searchQuery = "";
  public statusFilter: ScheduleFilterStatus = "all";
  public autoScrollEnabled = true;
  public cameraFollowEnabled = false;
  public hudEnabled = true;
  public sequenceBoxCollapsed = false;

  private lastRenderedListSignature = "";
  private lastAutoScrolledTaskKey: string | null = null;
  private lastCameraFollowedTaskKey: string | null = null;
  private userScrollPauseUntil = 0;
  private itemCache = new Map<string, ScheduleTaskItemRefs>();
  private lastFilteredEntries: ScheduleTaskEntry[] = [];
  private lastActiveEntry: ScheduleTaskEntry | null = null;
  private listenersBound = false;

  constructor(callbacks: ScheduleControllerCallbacks) {
    this.callbacks = callbacks;
  }

  public reset(): void {
    this.lastRenderedListSignature = "";
    this.lastAutoScrolledTaskKey = null;
    this.lastCameraFollowedTaskKey = null;
    this.itemCache.clear();
    this.lastFilteredEntries = [];
    this.lastActiveEntry = null;
  }

  public bindControls(): void {
    if (this.listenersBound) return;
    this.listenersBound = true;

    // 1. Collapsible Sequence Generator Box
    const toggleSeqBtn = document.getElementById("btn-toggle-sequence-box");
    const seqBox = document.getElementById("sequence-generator-box");
    toggleSeqBtn?.addEventListener("click", () => {
      this.sequenceBoxCollapsed = !this.sequenceBoxCollapsed;
      seqBox?.classList.toggle("collapsed", this.sequenceBoxCollapsed);
      if (toggleSeqBtn) {
        toggleSeqBtn.setAttribute("aria-expanded", String(!this.sequenceBoxCollapsed));
        toggleSeqBtn.textContent = this.sequenceBoxCollapsed ? "▸ Show Setup" : "▾ Hide Setup";
      }
      this.lastAutoScrolledTaskKey = null;
      requestAnimationFrame(() => this.callbacks.onRequestRender?.());
    });

    // 2. Task Search Input
    const searchInput = document.getElementById("schedule-task-search") as HTMLInputElement | null;
    searchInput?.addEventListener("input", () => {
      this.searchQuery = searchInput.value;
      this.lastRenderedListSignature = "";
      this.callbacks.onRequestRender?.();
    });

    // 3. Status Filter Pills
    const filterBar = document.getElementById("schedule-filter-pills");
    filterBar?.addEventListener("click", (ev) => {
      const btn = (ev.target as HTMLElement)?.closest<HTMLButtonElement>(".sched-filter-pill");
      if (!btn || !btn.dataset.filter) return;
      this.statusFilter = btn.dataset.filter as ScheduleFilterStatus;
      filterBar.querySelectorAll(".sched-filter-pill").forEach((b) => {
        b.classList.toggle("active", b === btn);
      });
      this.lastRenderedListSignature = "";
      this.callbacks.onRequestRender?.();
    });

    // 4. Auto-Follow Scroll Lock Toggle
    const autoFollowBtn = document.getElementById("btn-schedule-autofollow");
    autoFollowBtn?.addEventListener("click", () => {
      this.autoScrollEnabled = !this.autoScrollEnabled;
      autoFollowBtn.classList.toggle("active", this.autoScrollEnabled);
      autoFollowBtn.title = this.autoScrollEnabled
        ? "Auto-Scroll to Active Task: ON"
        : "Auto-Scroll to Active Task: OFF";
      if (this.autoScrollEnabled) {
        this.userScrollPauseUntil = 0;
        this.lastAutoScrolledTaskKey = null;
        this.hideJumpToActivePill();
        this.callbacks.onRequestRender?.();
      }
    });

    // 5. Camera Auto-Follow Toggle (4D Fly-To Active Zone)
    const camFollowBtn = document.getElementById("btn-schedule-camfollow");
    camFollowBtn?.addEventListener("click", () => {
      this.cameraFollowEnabled = !this.cameraFollowEnabled;
      camFollowBtn.classList.toggle("active", this.cameraFollowEnabled);
      camFollowBtn.title = this.cameraFollowEnabled
        ? "4D Camera Auto-Follow: ON (Flies to active zone)"
        : "4D Camera Auto-Follow: OFF";
      if (this.cameraFollowEnabled && this.lastActiveEntry) {
        this.lastCameraFollowedTaskKey = null;
        this.callbacks.onCameraFollowTask?.(
          this.lastActiveEntry.taskKey,
          this.lastActiveEntry.stats
        );
      }
    });

    // 6. Floating "Jump to Active" Pill
    const jumpBtn = document.getElementById("btn-schedule-jump-active");
    jumpBtn?.addEventListener("click", () => {
      this.userScrollPauseUntil = 0;
      this.lastAutoScrolledTaskKey = null;
      this.hideJumpToActivePill();
      this.scrollToActiveTask(true);
    });

    // 7. Viewport 4D HUD Close & Floating Drag Handle (.hud-4d-header)
    const hudEl = document.getElementById("viewport-4d-hud");
    const hudHeader = hudEl?.querySelector<HTMLElement>(".hud-4d-header");
    const hudCloseBtn = document.getElementById("btn-4d-hud-close");
    hudCloseBtn?.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.hudEnabled = false;
      hudEl?.classList.add("hidden");
    });

    if (hudEl && hudHeader && hudEl.dataset.dragBound !== "1") {
      hudEl.dataset.dragBound = "1";
      const STORAGE_KEY = "bim_kintsugi_4d_hud_pos";

      const applyHudPosition = (left: number, top: number) => {
        const rect = hudEl.getBoundingClientRect();
        const w = rect.width || 300;
        const h = rect.height || 92;
        const clampedLeft = Math.max(8, Math.min(window.innerWidth - w - 8, left));
        const clampedTop = Math.max(8, Math.min(window.innerHeight - h - 8, top));
        hudEl.style.left = `${Math.round(clampedLeft)}px`;
        hudEl.style.top = `${Math.round(clampedTop)}px`;
        hudEl.style.transform = "none";
      };

      // Restore last dragged floating position if saved
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed?.left === "number" && typeof parsed?.top === "number") {
            hudEl.style.left = `${parsed.left}px`;
            hudEl.style.top = `${parsed.top}px`;
            hudEl.style.transform = "none";
          }
        }
      } catch {
        // Ignore storage errors
      }

      let dragging = false;
      let startX = 0;
      let startY = 0;
      let origLeft = 0;
      let origTop = 0;

      hudHeader.addEventListener("pointerdown", (ev: PointerEvent) => {
        if ((ev.target as HTMLElement)?.closest("#btn-4d-hud-close")) return;
        dragging = true;
        const rect = hudEl.getBoundingClientRect();
        origLeft = rect.left;
        origTop = rect.top;
        startX = ev.clientX;
        startY = ev.clientY;
        hudEl.classList.add("dragging");
        hudHeader.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
      });

      hudHeader.addEventListener("pointermove", (ev: PointerEvent) => {
        if (!dragging) return;
        applyHudPosition(origLeft + (ev.clientX - startX), origTop + (ev.clientY - startY));
      });

      const endDrag = (ev: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        hudEl.classList.remove("dragging");
        hudHeader.releasePointerCapture?.(ev.pointerId);
        const rect = hudEl.getBoundingClientRect();
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ left: Math.round(rect.left), top: Math.round(rect.top) })
          );
        } catch {
          // Ignore storage errors
        }
      };

      hudHeader.addEventListener("pointerup", endDrag);
      hudHeader.addEventListener("pointercancel", endDrag);

      // Double-click header to reset back to top-center
      hudHeader.addEventListener("dblclick", () => {
        hudEl.style.left = "50%";
        hudEl.style.top = "70px";
        hudEl.style.transform = "translateX(-50%)";
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // Ignore storage errors
        }
      });

      window.addEventListener("resize", () => {
        if (hudEl.style.transform === "none" && !hudEl.classList.contains("hidden")) {
          const rect = hudEl.getBoundingClientRect();
          applyHudPosition(rect.left, rect.top);
        }
      });
    }

    // 8. Container manual scroll pause & virtual scroll listener
    const container = document.getElementById("schedule-tasks-list");
    if (container && container.dataset.autoScrollBound !== "1") {
      container.dataset.autoScrollBound = "1";
      const pauseAutoScroll = () => {
        this.userScrollPauseUntil = Date.now() + 3500;
        if (this.lastActiveEntry) {
          this.showJumpToActivePill(this.lastActiveEntry.cleanDisplayTitle);
        }
      };
      container.addEventListener("wheel", pauseAutoScroll, { passive: true });
      container.addEventListener("touchstart", pauseAutoScroll, { passive: true });
      container.addEventListener("scroll", () => {
        if (this.lastFilteredEntries.length > VIRTUALIZATION_THRESHOLD) {
          this.renderVirtualizedSlice(container);
        }
      }, { passive: true });
    }

    // 9. Re-scroll when switching back to the Schedule tab
    const schedTabBtn = document.querySelector('#left-tab-bar .sidebar-tab-btn[data-tab="schedule"]');
    if (schedTabBtn && (schedTabBtn as HTMLElement).dataset.autoScrollTabBound !== "1") {
      (schedTabBtn as HTMLElement).dataset.autoScrollTabBound = "1";
      schedTabBtn.addEventListener("click", () => {
        this.lastAutoScrolledTaskKey = null;
        this.userScrollPauseUntil = 0;
        this.hideJumpToActivePill();
        requestAnimationFrame(() => this.callbacks.onRequestRender?.());
      });
    }
  }

  private showJumpToActivePill(taskTitle: string): void {
    const pill = document.getElementById("btn-schedule-jump-active");
    if (!pill) return;
    pill.textContent = `↓ Active: ${taskTitle.slice(0, 24)}${taskTitle.length > 24 ? "…" : ""}`;
    pill.classList.remove("hidden");
  }

  private hideJumpToActivePill(): void {
    document.getElementById("btn-schedule-jump-active")?.classList.add("hidden");
  }

  private createTaskCard(entry: ScheduleTaskEntry): ScheduleTaskItemRefs {
    const item = document.createElement("div");
    item.className = "schedule-task-item";
    item.dataset.taskKey = entry.taskKey;

    item.innerHTML = `
      <div class="task-header-row">
        <span class="task-title" title="${entry.taskName}">${entry.cleanDisplayTitle}</span>
        <span class="task-status-badge task-badge-planned">Planned</span>
      </div>
      <div class="task-date-info">
        <span class="task-date-range">${entry.stats.startDate} <span class="task-date-arrow">→</span> ${entry.stats.endDate}</span>
        <span class="task-progress-text">0% (0/0)</span>
      </div>
      <div class="task-progress-row">
        <div class="task-progress-bar">
          <div class="task-progress-fill" style="width: 0%"></div>
        </div>
      </div>
    `;

    const badge = item.querySelector(".task-status-badge") as HTMLSpanElement;
    const fill = item.querySelector(".task-progress-fill") as HTMLDivElement;
    const progressText = item.querySelector(".task-progress-text") as HTMLSpanElement;
    const refs: ScheduleTaskItemRefs = { item, badge, fill, progressText, stats: entry.stats };

    item.addEventListener("click", () => {
      this.userScrollPauseUntil = 0;
      this.lastAutoScrolledTaskKey = entry.taskKey;
      this.hideJumpToActivePill();
      this.callbacks.onTaskClick(entry.taskKey, refs.stats);
    });

    this.applyEntryToCard(refs, entry);
    return refs;
  }

  private applyEntryToCard(refs: ScheduleTaskItemRefs, entry: ScheduleTaskEntry): void {
    refs.stats = entry.stats;
    refs.item.classList.toggle("active-task", entry.isActive);
    const statusAttr =
      entry.taskStatus === "Completed"
        ? "completed"
        : entry.taskStatus === "In Progress"
          ? "active"
          : "planned";
    if (refs.item.dataset.status !== statusAttr) {
      refs.item.dataset.status = statusAttr;
    }

    const badgeClass =
      entry.taskStatus === "Completed"
        ? "task-badge-complete"
        : entry.taskStatus === "In Progress"
          ? "task-badge-active"
          : "task-badge-planned";
    const nextBadgeClass = `task-status-badge ${badgeClass}`;
    if (refs.badge.className !== nextBadgeClass) {
      refs.badge.className = nextBadgeClass;
    }
    if (refs.badge.textContent !== entry.taskStatus) {
      refs.badge.textContent = entry.taskStatus;
    }
    const nextWidth = `${entry.pct}%`;
    if (refs.fill.style.width !== nextWidth) {
      refs.fill.style.width = nextWidth;
    }
    const nextProgressText = `${entry.pct}% (${entry.stats.completedCount}/${entry.stats.totalCount})`;
    if (refs.progressText.textContent !== nextProgressText) {
      refs.progressText.textContent = nextProgressText;
    }
  }

  private renderVirtualizedSlice(container: HTMLElement): void {
    const entries = this.lastFilteredEntries;
    const { startIndex, endIndex, topSpacerPx, bottomSpacerPx } = computeVirtualWindow(
      entries.length,
      container.scrollTop,
      container.clientHeight
    );

    const frag = document.createDocumentFragment();
    if (topSpacerPx > 0) {
      const topSpacer = document.createElement("div");
      topSpacer.style.height = `${topSpacerPx}px`;
      topSpacer.style.flexShrink = "0";
      frag.appendChild(topSpacer);
    }

    for (let i = startIndex; i < endIndex; i++) {
      const entry = entries[i];
      let refs = this.itemCache.get(entry.taskKey);
      if (!refs) {
        refs = this.createTaskCard(entry);
        this.itemCache.set(entry.taskKey, refs);
      } else {
        this.applyEntryToCard(refs, entry);
      }
      frag.appendChild(refs.item);
    }

    if (bottomSpacerPx > 0) {
      const bottomSpacer = document.createElement("div");
      bottomSpacer.style.height = `${bottomSpacerPx}px`;
      bottomSpacer.style.flexShrink = "0";
      frag.appendChild(bottomSpacer);
    }

    container.innerHTML = "";
    container.appendChild(frag);
  }

  public scrollToActiveTask(force = false): void {
    const container = document.getElementById("schedule-tasks-list");
    const activeEntry = this.lastActiveEntry;
    if (!container || !activeEntry) return;
    if (!force && (!this.autoScrollEnabled || Date.now() < this.userScrollPauseUntil)) return;
    if (!force && activeEntry.taskKey === this.lastAutoScrolledTaskKey) return;

    const containerRect = container.getBoundingClientRect();
    if (containerRect.height <= 0 || container.clientHeight <= 0) return;

    this.lastAutoScrolledTaskKey = activeEntry.taskKey;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    if (maxScrollTop <= 0) return;

    // Virtualized mode: compute scroll target mathematically by row index
    if (this.lastFilteredEntries.length > VIRTUALIZATION_THRESHOLD) {
      const idx = this.lastFilteredEntries.findIndex((e) => e.taskKey === activeEntry.taskKey);
      if (idx < 0) return;
      const targetTop = Math.max(
        0,
        Math.min(maxScrollTop, idx * VIRTUAL_ROW_HEIGHT - (container.clientHeight - VIRTUAL_ROW_HEIGHT) / 2)
      );
      if (typeof container.scrollTo === "function") {
        container.scrollTo({ top: targetTop, behavior: "smooth" });
      } else {
        container.scrollTop = targetTop;
      }
      return;
    }

    // Standard in-place mode: measure exact DOM element position
    const refs = this.itemCache.get(activeEntry.taskKey);
    if (!refs) return;
    const itemRect = refs.item.getBoundingClientRect();
    const deltaToCenter =
      itemRect.top - containerRect.top - (containerRect.height - itemRect.height) / 2;
    const targetTop = Math.max(0, Math.min(maxScrollTop, container.scrollTop + deltaToCenter));
    if (typeof container.scrollTo === "function") {
      container.scrollTo({ top: targetTop, behavior: "smooth" });
    } else {
      container.scrollTop = targetTop;
    }
  }

  public updateViewportHud(opts: {
    is4dMode: boolean;
    dateLabel: string;
    progressPct: number;
    activeEntries: ScheduleTaskEntry[];
    totalTasks: number;
    completedTasks: number;
  }): void {
    const hud = document.getElementById("viewport-4d-hud");
    if (!hud) return;

    if (!opts.is4dMode || !this.hudEnabled || opts.totalTasks === 0) {
      hud.classList.add("hidden");
      return;
    }
    hud.classList.remove("hidden");

    const dateEl = document.getElementById("hud-4d-date");
    const pctEl = document.getElementById("hud-4d-pct");
    const tasksEl = document.getElementById("hud-4d-active-tasks");
    const barEl = document.getElementById("hud-4d-progress-fill");
    const metaEl = document.getElementById("hud-4d-meta");

    if (dateEl) dateEl.textContent = opts.dateLabel;
    if (pctEl) pctEl.textContent = `${Math.round(opts.progressPct)}%`;
    if (barEl) barEl.style.width = `${Math.max(0, Math.min(100, opts.progressPct))}%`;
    if (metaEl) {
      metaEl.textContent = `${opts.completedTasks}/${opts.totalTasks} tasks complete • ${opts.activeEntries.length} active`;
    }
    if (tasksEl) {
      if (opts.activeEntries.length === 0) {
        tasksEl.textContent = opts.progressPct >= 99 ? "Project Completed" : "Awaiting Start";
      } else {
        const names = opts.activeEntries.slice(0, 2).map((e) => e.cleanDisplayTitle);
        const extra = opts.activeEntries.length > 2 ? ` +${opts.activeEntries.length - 2}` : "";
        tasksEl.textContent = `${names.join(" • ")}${extra}`;
      }
    }
  }

  public render(
    sortedTasks: Array<[string, ScheduleTaskWidgetStats]>,
    currentTimelineDate: Date | null,
    is4dMode: boolean
  ): {
    activeEntry: ScheduleTaskEntry | null;
    activeEntries: ScheduleTaskEntry[];
    overallPct: number;
    completedTasks: number;
  } {
    this.bindControls();
    const container = document.getElementById("schedule-tasks-list");

    const currentMs = currentTimelineDate ? currentTimelineDate.getTime() : null;

    let primaryActive: ScheduleTaskEntry | null = null;
    let primaryStartMs = -Infinity;
    let primaryDurationMs = Infinity;
    let fallbackActive: ScheduleTaskEntry | null = null;
    let fallbackStartMs = -Infinity;

    const allEntries: ScheduleTaskEntry[] = [];
    const activeEntries: ScheduleTaskEntry[] = [];
    let completedTasks = 0;
    let totalPctSum = 0;

    for (const [taskKey, stats] of sortedTasks) {
      const taskName = taskKey.includes("::") ? taskKey.split("::").slice(1).join("::") : taskKey;
      const cleanDisplayTitle = cleanScheduleTaskTitle(taskName);

      let taskStatus: "Planned" | "In Progress" | "Completed" = stats.statusOverride ?? "Planned";
      if (!stats.statusOverride) {
        if (stats.totalCount > 0 && stats.completedCount === stats.totalCount) {
          taskStatus = "Completed";
        } else if (stats.completedCount > 0) {
          taskStatus = "In Progress";
        }
      }

      let isActive = false;
      if (currentMs !== null) {
        const startMs = new Date(stats.startDate).getTime();
        const endMs = new Date(stats.endDate).getTime();
        if (currentMs >= startMs && currentMs <= endMs) {
          isActive = true;
        }
      }

      const pct =
        stats.pctOverride ??
        (stats.totalCount > 0 ? Math.round((stats.completedCount / stats.totalCount) * 100) : 0);
      if (taskStatus === "Completed") completedTasks++;
      totalPctSum += pct;

      let linkedElementCount = 0;
      for (const s of Object.values(stats.modelIdMaps)) linkedElementCount += s.size;

      const entry: ScheduleTaskEntry = {
        taskKey,
        taskName,
        cleanDisplayTitle,
        stats,
        taskStatus,
        isActive,
        pct,
        linkedElementCount,
      };
      allEntries.push(entry);

      if (isActive) {
        activeEntries.push(entry);
        const startMs = new Date(stats.startDate).getTime();
        const endMs = new Date(stats.endDate).getTime();
        const durationMs = Math.max(0, endMs - startMs);
        if (!stats.isSummary) {
          if (
            startMs > primaryStartMs ||
            (startMs === primaryStartMs && durationMs < primaryDurationMs)
          ) {
            primaryActive = entry;
            primaryStartMs = startMs;
            primaryDurationMs = durationMs;
          }
        } else if (startMs >= fallbackStartMs) {
          fallbackActive = entry;
          fallbackStartMs = startMs;
        }
      }
    }

    const activeEntry = primaryActive || fallbackActive;
    this.lastActiveEntry = activeEntry;

    // Update filter badge count
    const countBadge = document.getElementById("schedule-tasks-count-badge");
    const filteredEntries = filterScheduleEntries(allEntries, this.searchQuery, this.statusFilter);
    this.lastFilteredEntries = filteredEntries;
    if (countBadge) {
      countBadge.textContent =
        filteredEntries.length === allEntries.length
          ? `${allEntries.length}`
          : `${filteredEntries.length}/${allEntries.length}`;
    }

    if (container) {
      if (filteredEntries.length === 0) {
        this.lastRenderedListSignature = "";
        this.itemCache.clear();
        container.innerHTML = `<div class="empty-state">No tasks match the current filter.</div>`;
      } else if (filteredEntries.length > VIRTUALIZATION_THRESHOLD) {
        this.renderVirtualizedSlice(container);
      } else {
        const listSignature = filteredEntries
          .map((e) => `${e.taskKey}@${e.stats.startDate}@${e.stats.endDate}`)
          .join("|");
        const needsRebuild =
          listSignature !== this.lastRenderedListSignature ||
          this.itemCache.size !== filteredEntries.length ||
          container.children.length !== filteredEntries.length;

        if (needsRebuild) {
          container.innerHTML = "";
          this.itemCache.clear();
          this.lastRenderedListSignature = listSignature;
          this.lastAutoScrolledTaskKey = null;

          const frag = document.createDocumentFragment();
          for (const entry of filteredEntries) {
            const refs = this.createTaskCard(entry);
            this.itemCache.set(entry.taskKey, refs);
            frag.appendChild(refs.item);
          }
          container.appendChild(frag);
        } else {
          for (const entry of filteredEntries) {
            const refs = this.itemCache.get(entry.taskKey);
            if (refs) this.applyEntryToCard(refs, entry);
          }
        }
      }
    }

    if (activeEntry) {
      this.scrollToActiveTask(false);
      if (
        this.cameraFollowEnabled &&
        activeEntry.taskKey !== this.lastCameraFollowedTaskKey &&
        activeEntry.linkedElementCount > 0
      ) {
        this.lastCameraFollowedTaskKey = activeEntry.taskKey;
        this.callbacks.onCameraFollowTask?.(activeEntry.taskKey, activeEntry.stats);
      }
    } else {
      this.lastAutoScrolledTaskKey = null;
      this.hideJumpToActivePill();
    }

    const overallPct = allEntries.length > 0 ? totalPctSum / allEntries.length : 0;
    const dateLabel = currentTimelineDate
      ? currentTimelineDate.toISOString().slice(0, 10)
      : "--";
    this.updateViewportHud({
      is4dMode,
      dateLabel,
      progressPct: overallPct,
      activeEntries,
      totalTasks: allEntries.length,
      completedTasks,
    });

    return {
      activeEntry,
      activeEntries,
      overallPct,
      completedTasks,
    };
  }
}
