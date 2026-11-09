/**
 * Delay Impact Engine — 4D/5D Schedule Variance & Financial Exposure Calculator.
 *
 * Evaluates schedule delays (actual vs. planned dates), critical path impact,
 * prolongation overhead costs, contractual delay penalties, and Earned Value
 * Metrics (EVM: PV, EV, AC, CV, SV, CPI, SPI, EAC, VAC).
 *
 * Directly powers 4D Variance Mode 3D color-coding and CSV export/import analytics.
 */

import type { ScheduleTask } from "./ScheduleManager";

export type VarianceCategory = "Ahead" | "On Schedule" | "Delayed" | "Critical Delay";

export interface TaskDelayImpact {
  taskId: string;
  taskName: string;
  category: string;
  plannedStartDate: string;
  plannedEndDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  plannedDurationDays: number;
  actualDurationDays?: number;
  delayDays: number; // positive = delayed, negative = ahead, 0 = on schedule
  status: VarianceCategory;
  isCritical: boolean;
  totalFloat: number;
  plannedCost: number;
  actualCost: number;
  directCostVariance: number; // actualCost - plannedCost
  prolongationCost: number;   // delayDays * dailyOverheadRate (if delayDays > 0)
  penaltyCost: number;       // liquidated damages for critical/severe delay
  totalCostImpact: number;   // directCostVariance + prolongationCost + penaltyCost
  elementCount: number;
  elementIds: Set<number>;
  modelId: string;
}

export interface VarianceBuckets {
  ahead: Record<string, Set<number>>;
  onSchedule: Record<string, Set<number>>;
  delayed: Record<string, Set<number>>;
  critical: Record<string, Set<number>>;
  counts: {
    ahead: number;
    onSchedule: number;
    delayed: number;
    critical: number;
  };
}

export interface DelayImpactReport {
  currentSimDateMs: number;
  totalTasks: number;
  aheadCount: number;
  onScheduleCount: number;
  delayedCount: number;
  criticalDelayCount: number;
  projectSlippageDays: number;
  totalPlannedCost: number;      // BAC (Budget at Completion)
  totalActualCost: number;       // AC (Actual Cost)
  earnedValue: number;           // EV
  plannedValue: number;          // PV
  scheduleVariance: number;      // SV = EV - PV
  costVariance: number;          // CV = EV - AC
  spi: number;                   // Schedule Performance Index (EV / PV)
  cpi: number;                   // Cost Performance Index (EV / AC)
  eac: number;                   // Estimate at Completion (BAC / CPI)
  vac: number;                   // Variance at Completion (BAC - EAC)
  totalProlongationCost: number; // Prolongation / site overhead costs
  totalPenaltyCost: number;      // Liquidated damages / penalty exposure
  totalCostImpact: number;       // Total financial delay exposure
  criticalTasksDelayed: TaskDelayImpact[];
  taskImpacts: TaskDelayImpact[];
}

export interface DelayImpactEngineConfig {
  dailyOverheadRate: number;          // Default $1,200/day
  dailyPenaltyRate: number;           // Default $2,500/day
  criticalDelayThresholdDays: number; // Default 7 days
  onScheduleBufferDays: number;       // Default 2 days
}

export const DEFAULT_DELAY_CONFIG: DelayImpactEngineConfig = {
  dailyOverheadRate: 1200,
  dailyPenaltyRate: 2500,
  criticalDelayThresholdDays: 7,
  onScheduleBufferDays: 2,
};

export const VARIANCE_COLORS = {
  ahead: "#38BDF8",       // Sky blue
  onSchedule: "#64748B",  // Slate grey
  delayed: "#F59E0B",     // Amber
  critical: "#EF4444",    // Crimson red
};

const DAY_MS = 86400000;

export class DelayImpactEngine {
  private static instance: DelayImpactEngine;

  public static getInstance(): DelayImpactEngine {
    if (!DelayImpactEngine.instance) {
      DelayImpactEngine.instance = new DelayImpactEngine();
    }
    return DelayImpactEngine.instance;
  }

  public config: DelayImpactEngineConfig = { ...DEFAULT_DELAY_CONFIG };

  constructor(config?: Partial<DelayImpactEngineConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    DelayImpactEngine.instance = this;
  }

  /**
   * Parse a date string (YYYY-MM-DD) into UTC timestamp. Returns null if invalid.
   */
  public parseDateMs(dateStr?: string): number | null {
    if (!dateStr || typeof dateStr !== "string") return null;
    const clean = dateStr.trim();
    if (!clean) return null;
    const ms = Date.parse(clean);
    return isNaN(ms) ? null : ms;
  }

  /**
   * Compute single task delay and financial impact.
   */
  public computeTaskDelay(task: ScheduleTask, currentSimDateMs?: number): TaskDelayImpact {
    const plannedStartMs = this.parseDateMs(task.startDate) ?? 0;
    const plannedEndMs = this.parseDateMs(task.endDate) ?? plannedStartMs;
    const actualStartMs = this.parseDateMs(task.actualStartDate);
    const actualEndMs = this.parseDateMs(task.actualEndDate);

    const plannedDurationDays = Math.max(1, Math.round((plannedEndMs - plannedStartMs) / DAY_MS));
    let actualDurationDays: number | undefined;
    if (actualStartMs !== null && actualEndMs !== null) {
      actualDurationDays = Math.max(1, Math.round((actualEndMs - actualStartMs) / DAY_MS));
    }

    // Determine delay in days
    let delayDays = 0;
    if (actualEndMs !== null) {
      // Completed or actual end specified
      delayDays = Math.round((actualEndMs - plannedEndMs) / DAY_MS);
    } else if (currentSimDateMs !== undefined && currentSimDateMs > plannedEndMs && task.status !== "Completed") {
      // In progress or not completed past planned finish
      delayDays = Math.round((currentSimDateMs - plannedEndMs) / DAY_MS);
    } else if (actualStartMs !== null && actualStartMs > plannedStartMs) {
      // Started late and not yet finished
      const startSlipped = Math.round((actualStartMs - plannedStartMs) / DAY_MS);
      if (currentSimDateMs !== undefined && currentSimDateMs > plannedEndMs) {
        delayDays = Math.round((currentSimDateMs - plannedEndMs) / DAY_MS);
      } else {
        delayDays = Math.max(0, startSlipped);
      }
    } else if (task.delayDays !== undefined && task.delayDays !== 0) {
      delayDays = task.delayDays;
    }

    // Categorize status
    let status: VarianceCategory = "On Schedule";
    const isCritical = task.isCritical === true || (task.totalFloat !== undefined && task.totalFloat <= 0);
    const totalFloat = task.totalFloat ?? (isCritical ? 0 : 5);

    if (delayDays < -this.config.onScheduleBufferDays) {
      status = "Ahead";
    } else if (delayDays <= this.config.onScheduleBufferDays) {
      status = "On Schedule";
    } else if (delayDays > this.config.criticalDelayThresholdDays || (isCritical && delayDays > 0)) {
      status = "Critical Delay";
    } else {
      status = "Delayed";
    }

    // Cost calculations
    const elementCount = Math.max(1, task.elementIds ? task.elementIds.size : 1);
    const plannedCost = task.totalCost ?? (task.unitCost * elementCount);
    const actualCost = task.actualCost !== undefined ? task.actualCost : plannedCost;
    const directCostVariance = actualCost - plannedCost;

    // Financial prolongation and delay damages
    const prolongationCost = delayDays > 0 ? delayDays * this.config.dailyOverheadRate : 0;
    const penaltyCost = (status === "Critical Delay" && delayDays > 0)
      ? delayDays * this.config.dailyPenaltyRate
      : 0;

    const totalCostImpact = directCostVariance + prolongationCost + penaltyCost;

    return {
      taskId: task.id,
      taskName: task.name,
      category: task.category,
      plannedStartDate: task.startDate,
      plannedEndDate: task.endDate,
      actualStartDate: task.actualStartDate,
      actualEndDate: task.actualEndDate,
      plannedDurationDays,
      actualDurationDays,
      delayDays,
      status,
      isCritical,
      totalFloat,
      plannedCost,
      actualCost,
      directCostVariance,
      prolongationCost,
      penaltyCost,
      totalCostImpact,
      elementCount,
      elementIds: task.elementIds ?? new Set<number>(),
      modelId: task.modelId || "",
    };
  }

  /**
   * Compute comprehensive project-level delay impact report and EVM analytics.
   */
  public computeProjectDelayReport(tasks: ScheduleTask[], currentSimDateMs?: number): DelayImpactReport {
    const taskImpacts: TaskDelayImpact[] = [];
    let aheadCount = 0;
    let onScheduleCount = 0;
    let delayedCount = 0;
    let criticalDelayCount = 0;
    let maxSlippageDays = 0;
    let totalPlannedCost = 0;
    let totalActualCost = 0;
    let earnedValue = 0;
    let plannedValue = 0;
    let totalProlongationCost = 0;
    let totalPenaltyCost = 0;
    let totalCostImpact = 0;
    const criticalTasksDelayed: TaskDelayImpact[] = [];

    const simMs = currentSimDateMs ?? Date.now();

    for (const task of tasks) {
      const impact = this.computeTaskDelay(task, simMs);
      taskImpacts.push(impact);

      totalPlannedCost += impact.plannedCost;
      totalActualCost += impact.actualCost;
      totalProlongationCost += impact.prolongationCost;
      totalPenaltyCost += impact.penaltyCost;
      totalCostImpact += impact.totalCostImpact;

      if (impact.status === "Ahead") aheadCount++;
      else if (impact.status === "On Schedule") onScheduleCount++;
      else if (impact.status === "Delayed") delayedCount++;
      else if (impact.status === "Critical Delay") {
        criticalDelayCount++;
        criticalTasksDelayed.push(impact);
      }

      if (impact.delayDays > maxSlippageDays) {
        maxSlippageDays = impact.delayDays;
      }

      // EVM per task
      const plannedStart = this.parseDateMs(task.startDate) ?? simMs;
      const plannedEnd = this.parseDateMs(task.endDate) ?? plannedStart;
      const plannedSpan = Math.max(1, plannedEnd - plannedStart);

      // Planned Value (PV)
      if (simMs >= plannedEnd) {
        plannedValue += impact.plannedCost;
      } else if (simMs > plannedStart) {
        const pct = Math.min(1, Math.max(0, (simMs - plannedStart) / plannedSpan));
        plannedValue += impact.plannedCost * pct;
      }

      // Earned Value (EV)
      if (task.status === "Completed") {
        earnedValue += impact.plannedCost;
      } else if (task.status === "In Progress") {
        const actualStart = this.parseDateMs(task.actualStartDate) ?? plannedStart;
        const actualEnd = this.parseDateMs(task.actualEndDate) ?? plannedEnd;
        const actualSpan = Math.max(1, actualEnd - actualStart);
        const earnedPct = Math.min(0.95, Math.max(0.05, (simMs - actualStart) / actualSpan));
        earnedValue += impact.plannedCost * earnedPct;
      }
    }

    const scheduleVariance = earnedValue - plannedValue;
    const costVariance = earnedValue - totalActualCost;
    const spi = plannedValue > 0 ? earnedValue / plannedValue : 1.0;
    const cpi = totalActualCost > 0 ? earnedValue / totalActualCost : 1.0;
    const eac = cpi > 0 ? totalPlannedCost / cpi : totalPlannedCost;
    const vac = totalPlannedCost - eac;

    return {
      currentSimDateMs: simMs,
      totalTasks: tasks.length,
      aheadCount,
      onScheduleCount,
      delayedCount,
      criticalDelayCount,
      projectSlippageDays: maxSlippageDays,
      totalPlannedCost,
      totalActualCost,
      earnedValue,
      plannedValue,
      scheduleVariance,
      costVariance,
      spi,
      cpi,
      eac,
      vac,
      totalProlongationCost,
      totalPenaltyCost,
      totalCostImpact,
      criticalTasksDelayed,
      taskImpacts,
    };
  }

  /**
   * Partition elements into Variance Buckets for 3D visualization.
   * Can evaluate from ScheduleTasks or fall back to Schedule4DEngine elements.
   */
  public getVarianceBuckets(currentSimDateMs: number, tasks: ScheduleTask[]): VarianceBuckets {
    const ahead: Record<string, Set<number>> = {};
    const onSchedule: Record<string, Set<number>> = {};
    const delayed: Record<string, Set<number>> = {};
    const critical: Record<string, Set<number>> = {};
    const counts = { ahead: 0, onSchedule: 0, delayed: 0, critical: 0 };

    for (const task of tasks) {
      const impact = this.computeTaskDelay(task, currentSimDateMs);
      const modelId = task.modelId || "";

      let targetBucket: Record<string, Set<number>>;
      if (impact.status === "Ahead") {
        targetBucket = ahead;
        counts.ahead += impact.elementIds.size;
      } else if (impact.status === "Critical Delay") {
        targetBucket = critical;
        counts.critical += impact.elementIds.size;
      } else if (impact.status === "Delayed") {
        targetBucket = delayed;
        counts.delayed += impact.elementIds.size;
      } else {
        targetBucket = onSchedule;
        counts.onSchedule += impact.elementIds.size;
      }

      const modelSet = targetBucket[modelId] ??= new Set<number>();
      for (const id of impact.elementIds) {
        modelSet.add(id);
      }
    }

    return { ahead, onSchedule, delayed, critical, counts };
  }
}
