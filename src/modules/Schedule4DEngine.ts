/**
 * Schedule4DEngine — single source of truth for 4D playback.
 *
 * Holds one schedule entry per BIM element (dates, cost, task) and derives
 * everything the 4D UI needs from it: timeline bounds, week numbers,
 * milestones, per-date status buckets and earned-value metrics.
 *
 * Status buckets only change when the playhead crosses a task start/end
 * boundary, so callers can skip expensive scene updates between boundaries
 * by comparing `getBoundaryIndex()` results.
 */

export type ElementStatus = "Planned" | "In Progress" | "Completed";
export type VarianceStatus = "Ahead" | "On Schedule" | "Delayed" | "Critical";

export interface ElementSchedule {
  modelId: string;
  expressId: number;
  /** Task / work-package name the element belongs to */
  task: string;
  /** Grouping key used for milestones (defaults to `task`) */
  group?: string;
  /** Inclusive start, epoch ms */
  start: number;
  /** Inclusive end, epoch ms */
  end: number;
  /** Actual recorded start on site, epoch ms */
  actualStart?: number;
  /** Actual recorded completion on site, epoch ms */
  actualEnd?: number;
  /** Budgeted cost of the element (BAC contribution) */
  cost: number;
  /** User-reported status; drives Earned Value instead of the planned dates */
  statusOverride?: ElementStatus;
}

export interface VarianceBuckets {
  ahead: Record<string, Set<number>>;
  onSchedule: Record<string, Set<number>>;
  delayed: Record<string, Set<number>>;
  critical: Record<string, Set<number>>;
  counts: { ahead: number; onSchedule: number; delayed: number; critical: number };
}

export interface Milestone {
  name: string;
  start: number;
  end: number;
  cost: number;
  elementCount: number;
  elements: Record<string, Set<number>>;
}

export interface StatusBuckets {
  planned: Record<string, Set<number>>;
  inProgress: Record<string, Set<number>>;
  completed: Record<string, Set<number>>;
  counts: { planned: number; inProgress: number; completed: number };
}

export interface EarnedValue {
  /** Budget at completion */
  bac: number;
  /** Planned value: budgeted cost of work scheduled up to the date */
  pv: number;
  /** Earned value: budgeted cost of work performed (uses status overrides) */
  ev: number;
  /** Schedule performance index EV / PV (1 when nothing is planned yet) */
  spi: number;
  /** Schedule variance EV − PV */
  sv: number;
  /** Planned % complete (PV / BAC) */
  plannedPercent: number;
  /** Earned % complete (EV / BAC) */
  earnedPercent: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export class Schedule4DEngine {
  private elements: ElementSchedule[] = [];
  private boundaries: number[] = [];
  private minMs = 0;
  private maxMs = 0;

  setElements(elements: ElementSchedule[]): void {
    this.elements = elements.filter(
      (e) => Number.isFinite(e.start) && Number.isFinite(e.end) && e.end >= e.start
    );

    const set = new Set<number>();
    let min = Infinity;
    let max = -Infinity;
    for (const e of this.elements) {
      set.add(e.start);
      // Status flips to Completed just after `end`, so the boundary is end + 1ms
      set.add(e.end + 1);
      if (e.start < min) min = e.start;
      if (e.end > max) max = e.end;
    }
    this.boundaries = [...set].sort((a, b) => a - b);
    this.minMs = min === Infinity ? 0 : min;
    this.maxMs = max === -Infinity ? 0 : max;
  }

  getElements(): readonly ElementSchedule[] {
    return this.elements;
  }

  get size(): number {
    return this.elements.length;
  }

  getBounds(): { min: Date; max: Date } | null {
    if (this.elements.length === 0) return null;
    return { min: new Date(this.minMs), max: new Date(this.maxMs) };
  }

  /**
   * Number of start/end boundaries at or before `dateMs`.
   * Two dates with the same index produce identical status buckets.
   */
  getBoundaryIndex(dateMs: number): number {
    let lo = 0;
    let hi = this.boundaries.length;
    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.boundaries[mid] <= dateMs) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  static statusAt(e: Pick<ElementSchedule, "start" | "end">, dateMs: number): ElementStatus {
    if (dateMs < e.start) return "Planned";
    if (dateMs <= e.end) return "In Progress";
    return "Completed";
  }

  getStatusBuckets(dateMs: number): StatusBuckets {
    const planned: Record<string, Set<number>> = {};
    const inProgress: Record<string, Set<number>> = {};
    const completed: Record<string, Set<number>> = {};
    const counts = { planned: 0, inProgress: 0, completed: 0 };

    for (const e of this.elements) {
      const status = Schedule4DEngine.statusAt(e, dateMs);
      const bucket = status === "Planned" ? planned : status === "In Progress" ? inProgress : completed;
      (bucket[e.modelId] ??= new Set<number>()).add(e.expressId);
      if (status === "Planned") counts.planned++;
      else if (status === "In Progress") counts.inProgress++;
      else counts.completed++;
    }
    return { planned, inProgress, completed, counts };
  }

  /** Fraction (0..1) of an element's planned duration elapsed at `dateMs`. */
  static plannedFraction(e: Pick<ElementSchedule, "start" | "end">, dateMs: number): number {
    if (dateMs < e.start) return 0;
    if (dateMs >= e.end) return 1;
    const span = e.end - e.start;
    return span <= 0 ? 1 : (dateMs - e.start) / span;
  }

  getEarnedValue(dateMs: number): EarnedValue {
    let bac = 0;
    let pv = 0;
    let ev = 0;

    for (const e of this.elements) {
      const cost = e.cost > 0 ? e.cost : 0;
      bac += cost;
      const planned = Schedule4DEngine.plannedFraction(e, dateMs);
      pv += cost * planned;

      let earned = planned;
      if (e.statusOverride === "Completed") earned = 1;
      else if (e.statusOverride === "Planned") earned = 0;
      else if (e.statusOverride === "In Progress") earned = Math.min(Math.max(planned, 0), 0.99);
      ev += cost * earned;
    }

    const spi = pv > 0 ? ev / pv : 1;
    return {
      bac,
      pv,
      ev,
      spi,
      sv: ev - pv,
      plannedPercent: bac > 0 ? (pv / bac) * 100 : 0,
      earnedPercent: bac > 0 ? (ev / bac) * 100 : 0,
    };
  }

  /** Milestones grouped by `group ?? task`, sorted by start date. */
  getMilestones(): Milestone[] {
    const map = new Map<string, Milestone>();
    for (const e of this.elements) {
      const name = e.group ?? e.task;
      let m = map.get(name);
      if (!m) {
        m = { name, start: e.start, end: e.end, cost: 0, elementCount: 0, elements: {} };
        map.set(name, m);
      }
      if (e.start < m.start) m.start = e.start;
      if (e.end > m.end) m.end = e.end;
      m.cost += e.cost > 0 ? e.cost : 0;
      m.elementCount++;
      (m.elements[e.modelId] ??= new Set<number>()).add(e.expressId);
    }
    return [...map.values()].sort((a, b) => a.start - b.start || a.end - b.end);
  }

  getVarianceBuckets(dateMs: number): VarianceBuckets {
    const ahead: Record<string, Set<number>> = {};
    const onSchedule: Record<string, Set<number>> = {};
    const delayed: Record<string, Set<number>> = {};
    const critical: Record<string, Set<number>> = {};
    const counts = { ahead: 0, onSchedule: 0, delayed: 0, critical: 0 };

    for (const e of this.elements) {
      const actEnd = e.actualEnd ?? (e.statusOverride === "Completed" ? Math.min(dateMs, e.end) : undefined);
      const isDone = e.statusOverride === "Completed" || (actEnd !== undefined && dateMs >= actEnd);

      let status: VarianceStatus = "On Schedule";
      if (isDone) {
        if (actEnd && actEnd < e.end - 2 * DAY_MS) {
          status = "Ahead";
        } else if (actEnd && actEnd > e.end + 7 * DAY_MS) {
          status = "Critical";
        } else if (actEnd && actEnd > e.end) {
          status = "Delayed";
        } else {
          status = "On Schedule";
        }
      } else {
        if (dateMs > e.end + 7 * DAY_MS) {
          status = "Critical";
        } else if (dateMs > e.end) {
          status = "Delayed";
        } else {
          status = "On Schedule";
        }
      }

      const bucket = status === "Ahead" ? ahead : status === "Critical" ? critical : status === "Delayed" ? delayed : onSchedule;
      (bucket[e.modelId] ??= new Set<number>()).add(e.expressId);
      if (status === "Ahead") counts.ahead++;
      else if (status === "Critical") counts.critical++;
      else if (status === "Delayed") counts.delayed++;
      else counts.onSchedule++;
    }

    return { ahead, onSchedule, delayed, critical, counts };
  }

  /** Total project length in whole weeks (minimum 1). */
  static totalWeeks(min: Date, max: Date): number {
    const days = Math.max(1, Math.ceil((max.getTime() - min.getTime()) / DAY_MS));
    return Math.max(1, Math.ceil(days / 7));
  }

  /** 1-based week number of `date` within [min, max]. */
  static weekOf(date: Date, min: Date, max: Date): number {
    const total = Schedule4DEngine.totalWeeks(min, max);
    const elapsedDays = Math.max(0, (date.getTime() - min.getTime()) / DAY_MS);
    return Math.min(total, Math.floor(elapsedDays / 7) + 1);
  }
}

