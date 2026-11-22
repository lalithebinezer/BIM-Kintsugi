/**
 * Schedule Manager — 4D Construction Schedule Data Model & Operations.
 *
 * Manages schedule tasks linked to IFC elements via ExpressIDs.
 * Supports auto-generation from model categories and manual editing.
 */

import { CostRateManager } from "./CostRateManager";
import { resolveCategoryUnitCost } from "./BoqGenerator";
import { DelayImpactEngine } from "./DelayImpactEngine";
import { FragmentIndexer } from "../core/FragmentIndexer";
import {
  solveCpmGraph,
  rollupWbsHierarchy,
  type TaskDependency,
  type CpmSolveReport,
} from "./CpmGraphSolver";

export type TaskStatus = 'Planned' | 'In Progress' | 'Completed';

export interface ScheduleTask {
  id: string;
  name: string;
  category: string;
  startDate: string;      // ISO date string YYYY-MM-DD
  endDate: string;        // ISO date string YYYY-MM-DD
  actualStartDate?: string; // ISO date string YYYY-MM-DD
  actualEndDate?: string;   // ISO date string YYYY-MM-DD
  baselineStartDate?: string; // Baseline ISO date YYYY-MM-DD
  baselineEndDate?: string;   // Baseline ISO date YYYY-MM-DD
  status: TaskStatus;
  elementIds: Set<number>;
  modelId: string;
  unitCost: number;
  totalCost?: number;
  actualCost?: number;
  delayDays?: number;
  costImpact?: number;
  quantity: number;
  wbsCode?: string;
  parentId?: string;
  outlineLevel?: number;
  isSummary?: boolean;
  predecessors?: TaskDependency[];
  successors?: string[];
  earlyStart?: string;
  earlyFinish?: string;
  lateStart?: string;
  lateFinish?: string;
  totalFloat?: number;
  freeFloat?: number;
  isCritical?: boolean;
  outOfSequence?: boolean;
  simulationKey?: string;
  appearanceProfileId?: string;
  selectionRuleId?: string;
  customMetric?: number;
  /** Optional explicit IFC property name from CSV (e.g. `SIMULATION`, `Pset_WallCommon.Reference`) */
  matchProperty?: string;
  /** Optional explicit property value from CSV to exact-match against 3D elements (defaults to `name`) */
  matchValue?: string;
  /** Recorded IFC property name(s) that exact-matched this task to 3D elements */
  matchedProperty?: string;
  /** Tracks which cost column(s) were supplied in CSV so exact values are preserved on element linking */
  costSource?: "total" | "unit" | "both" | "fallback";
}

export interface ElementCostData {
  unitCost: number;
  quantity: number;
  taskName: string;
  taskStatus: TaskStatus;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  delayDays?: number;
  costImpact?: number;
}

export interface LevelWiseScheduleElement {
  modelId: string;
  expressId: number;
  category: string;
  storey?: string;
  /** World-space minimum Y elevation (meters) from element bounding box */
  minY?: number;
}

/**
 * Manages 4D schedule tasks and 5D cost data for the application.
 */
export class ScheduleManager {
  private static instance: ScheduleManager;

  public static getInstance(): ScheduleManager {
    if (!ScheduleManager.instance) {
      ScheduleManager.instance = new ScheduleManager();
    }
    return ScheduleManager.instance;
  }

  constructor() {
    ScheduleManager.instance = this;
  }

  /** All schedule tasks keyed by task ID */
  tasks: Map<string, ScheduleTask> = new Map();

  /** Per-element cost/schedule data keyed by `${modelId}:${expressId}` */
  elementData: Map<string, ElementCostData> = new Map();

  /** Grand total cost across all elements */
  get grandTotal(): number {
    let total = 0;
    for (const [, data] of this.elementData) {
      total += data.unitCost * data.quantity;
    }
    return total;
  }

  /** Count of elements with cost data */
  get costedElementCount(): number {
    let count = 0;
    for (const [, data] of this.elementData) {
      if (data.unitCost > 0 && data.quantity > 0) count++;
    }
    return count;
  }

  /**
   * Auto-generate schedule tasks from model classification categories.
   * Creates one task per IFC category with default date ranges.
   */
  generateFromCategories(
    categories: Map<string, { modelId: string; elementIds: number[] }[]>,
    projectStartDate?: string
  ): void {
    const start = projectStartDate || new Date().toISOString().split('T')[0];
    const startMs = new Date(start).getTime();
    let phaseIndex = 0;

    // Sort categories in a logical construction sequence
    const CONSTRUCTION_ORDER: Record<string, number> = {
      IFCSITE: 0,
      IFCFOOTING: 1,
      IFCPILE: 2,
      IFCCOLUMN: 3,
      IFCBEAM: 4,
      IFCSLAB: 5,
      IFCWALL: 6,
      IFCWALLSTANDARDCASE: 6,
      IFCSTAIR: 7,
      IFCSTAIRFLIGHT: 7,
      IFCROOF: 8,
      IFCDOOR: 9,
      IFCWINDOW: 10,
      IFCRAILING: 11,
      IFCCOVERING: 12,
      IFCPLATE: 13,
      IFCFURNISHINGELEMENT: 14,
      IFCFLOWSEGMENT: 15,
      IFCFLOWFITTING: 15,
      IFCFLOWTERMINAL: 16,
    };

    const sortedCategories = [...categories.entries()].sort(([a], [b]) => {
      const orderA = CONSTRUCTION_ORDER[a.toUpperCase()] ?? 50;
      const orderB = CONSTRUCTION_ORDER[b.toUpperCase()] ?? 50;
      return orderA - orderB;
    });

    for (const [categoryName, models] of sortedCategories) {
      const taskId = `auto-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${phaseIndex}`;
      
      // Each phase gets 14 days (2 weeks), staggered by 7 days overlap
      const phaseStartMs = startMs + phaseIndex * 7 * 24 * 60 * 60 * 1000;
      const phaseEndMs = phaseStartMs + 14 * 24 * 60 * 60 * 1000;
      const phaseStart = new Date(phaseStartMs).toISOString().split('T')[0];
      const phaseEnd = new Date(phaseEndMs).toISOString().split('T')[0];

      const allElementIds = new Set<number>();
      let taskModelId = '';
      for (const { modelId, elementIds } of models) {
        taskModelId = modelId;
        for (const id of elementIds) {
          allElementIds.add(id);
        }
      }

      const cleanName = ScheduleManager.formatCategoryLabel(categoryName);

      const taskUnitCost = this.resolveFallbackUnitCost(categoryName);
      const taskTotalCost = Math.round(taskUnitCost * Math.max(1, allElementIds.size) * 100) / 100;

      const task: ScheduleTask = {
        id: taskId,
        name: `${cleanName} Works`,
        category: categoryName,
        startDate: phaseStart,
        endDate: phaseEnd,
        status: 'Planned',
        elementIds: allElementIds,
        modelId: taskModelId,
        unitCost: taskUnitCost,
        totalCost: taskTotalCost,
        quantity: allElementIds.size,
      };

      this.tasks.set(taskId, task);

      for (const id of allElementIds) {
        this.elementData.set(`${taskModelId}:${id}`, {
          unitCost: taskUnitCost,
          quantity: 1,
          taskName: task.name,
          taskStatus: 'Planned',
          startDate: phaseStart,
          endDate: phaseEnd,
        });

        if (typeof window !== "undefined" && (window as any).twinDatabase) {
          const dbKey = `${taskModelId}-${id}`;
          const existing = (window as any).twinDatabase[dbKey] || {
            modelId: taskModelId,
            expressId: id,
            quantity: 1,
            unitCost: taskUnitCost,
            calculatedCost: taskUnitCost,
          };
          existing.task = task.name;
          existing.startDate = phaseStart;
          existing.endDate = phaseEnd;
          existing.status = 'Planned';
          existing.isCustomized = true;
          (window as any).twinDatabase[dbKey] = existing;
        }
      }

      phaseIndex++;
    }
  }

  /**
   * Computes a semantic elevation sort rank from storey/level names when 3D Y bounds are unavailable
   * (e.g. Footings/Pit < Basement B2 < B1 < Ground/L0 < L1 < L2 < ... < Roof).
   */
  public static parseLevelElevationRank(storeyName: string): number {
    const s = storeyName.trim().toLowerCase();
    if (/footing|foundation|pile|pit|subgrade/.test(s)) return -100;
    const bMatch = s.match(/\b(?:b|basement|sub|ug|p)[\s_-]*(\d+)\b/);
    if (bMatch) return -10 * Number(bMatch[1]);
    if (/\bbasement\b|\bcellar\b/.test(s)) return -10;
    if (/\bground\b|\bgf\b|\bentry\b|\bl0\b|\blevel[\s_-]*0\b/.test(s)) return 0;
    if (/\broof\b|\bparapet\b|\bpenthouse\b|\btos\b|\brtos\b|\bltos\b/.test(s)) return 900;
    const lMatch = s.match(/(?:level|lvl|floor|fl|storey|story|ll|l)[\s_-]*(-?\d+(?:\.\d+)?)/);
    if (lMatch) return Number(lMatch[1]) * 10;
    const anyNum = s.match(/(-?\d+(?:\.\d+)?)/);
    if (anyNum) return Number(anyNum[1]) * 10;
    return 500;
  }

  /**
   * Generates a bottom-up, level-wise 4D construction schedule:
   * builds the lowest level completely (sorted by trade construction order), then moves upward
   * level by level to the top/roof level, creating WBS parent summary tasks per level with FS links.
   */
  generateLevelWiseSchedule(
    elements: LevelWiseScheduleElement[],
    projectStartDate?: string
  ): number {
    if (!elements || elements.length === 0) return 0;

    const start = projectStartDate || new Date().toISOString().split("T")[0];
    const startMs = new Date(start).getTime();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const TRADE_DURATION_DAYS = 7;

    const CONSTRUCTION_ORDER: Record<string, number> = {
      IFCSITE: 0,
      IFCFOOTING: 1,
      IFCPILE: 2,
      IFCCOLUMN: 3,
      IFCBEAM: 4,
      IFCSLAB: 5,
      IFCWALL: 6,
      IFCWALLSTANDARDCASE: 6,
      IFCSTAIR: 7,
      IFCSTAIRFLIGHT: 7,
      IFCROOF: 8,
      IFCDOOR: 9,
      IFCWINDOW: 10,
      IFCRAILING: 11,
      IFCCOVERING: 12,
      IFCPLATE: 13,
      IFCFURNISHINGELEMENT: 14,
      IFCFLOWSEGMENT: 15,
      IFCFLOWFITTING: 16,
      IFCFLOWTERMINAL: 17,
    };

    // 1. Group elements by storey (falling back to 3.5m elevation buckets if storey is missing)
    const levelBuckets = new Map<
      string,
      {
        label: string;
        yValues: number[];
        byCategory: Map<string, { modelId: string; expressIds: Set<number> }>;
      }
    >();

    for (const el of elements) {
      let label = (el.storey || "").trim();
      if (!label || label.toLowerCase() === "unassigned" || label.toLowerCase() === "default") {
        if (typeof el.minY === "number" && Number.isFinite(el.minY)) {
          const band = Math.floor(el.minY / 3.5) * 3.5;
          label = `Elevation ${band >= 0 ? "+" : ""}${band.toFixed(1)}m`;
        } else {
          label = "Level 1";
        }
      }

      let bucket = levelBuckets.get(label);
      if (!bucket) {
        bucket = { label, yValues: [], byCategory: new Map() };
        levelBuckets.set(label, bucket);
      }
      if (typeof el.minY === "number" && Number.isFinite(el.minY)) {
        bucket.yValues.push(el.minY);
      }
      const catKey = (el.category || "IFCELEMENT").toUpperCase();
      let catEntry = bucket.byCategory.get(catKey);
      if (!catEntry) {
        catEntry = { modelId: el.modelId, expressIds: new Set<number>() };
        bucket.byCategory.set(catKey, catEntry);
      }
      catEntry.expressIds.add(el.expressId);
    }

    // 2. Sort levels strictly bottom-to-top using 10th-percentile geometric minY (or semantic rank)
    const sortedLevels = Array.from(levelBuckets.values())
      .map((b) => {
        let sortElevation: number;
        if (b.yValues.length > 0) {
          const sortedY = [...b.yValues].sort((a, c) => a - c);
          sortElevation = sortedY[Math.floor(sortedY.length * 0.1)];
        } else {
          sortElevation = ScheduleManager.parseLevelElevationRank(b.label);
        }
        return { ...b, sortElevation, hasGeomY: b.yValues.length > 0 };
      })
      .sort((a, b) => {
        if (a.hasGeomY && b.hasGeomY) {
          if (Math.abs(a.sortElevation - b.sortElevation) > 0.15) {
            return a.sortElevation - b.sortElevation;
          }
        }
        const rankDiff =
          ScheduleManager.parseLevelElevationRank(a.label) -
          ScheduleManager.parseLevelElevationRank(b.label);
        if (rankDiff !== 0) return rankDiff;
        return a.label.localeCompare(b.label);
      });

    // 3. Emit level WBS parent summaries and child trade tasks bottom -> top
    let cursorMs = startMs;
    let prevLeafTaskId: string | null = null;
    let createdTasks = 0;

    sortedLevels.forEach((lvl, lvlIdx) => {
      const wbsLevel = `${lvlIdx + 1}`;
      const levelSlug = lvl.label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `l${lvlIdx + 1}`;
      const summaryId = `auto-lvl-${lvlIdx + 1}-${levelSlug}`;
      const levelStartIso = new Date(cursorMs).toISOString().split("T")[0];

      const sortedTrades = [...lvl.byCategory.entries()].sort(([catA], [catB]) => {
        const orderA = CONSTRUCTION_ORDER[catA] ?? 50;
        const orderB = CONSTRUCTION_ORDER[catB] ?? 50;
        return orderA - orderB || catA.localeCompare(catB);
      });

      const levelElementIds = new Set<number>();
      let levelModelId = "";
      const summaryTask: ScheduleTask = {
        id: summaryId,
        name: `${lvl.label}`,
        wbsCode: wbsLevel,
        outlineLevel: 1,
        isSummary: true,
        category: "IFCBUILDINGSTOREY",
        startDate: levelStartIso,
        endDate: levelStartIso,
        status: "Planned",
        elementIds: levelElementIds,
        modelId: levelModelId,
        unitCost: 0,
        totalCost: 0,
        quantity: 0,
      };
      this.tasks.set(summaryId, summaryTask);
      createdTasks++;

      sortedTrades.forEach(([categoryName, data], tradeIdx) => {
        const tradeStartMs = cursorMs;
        const tradeEndMs = tradeStartMs + TRADE_DURATION_DAYS * DAY_MS;
        const tradeStart = new Date(tradeStartMs).toISOString().split("T")[0];
        const tradeEnd = new Date(tradeEndMs).toISOString().split("T")[0];

        const taskId = `auto-lvl-${lvlIdx + 1}-${categoryName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        const cleanCat = ScheduleManager.formatCategoryLabel(categoryName);
        const taskUnitCost = this.resolveFallbackUnitCost(categoryName);
        const count = Math.max(1, data.expressIds.size);
        const taskTotalCost = Math.round(taskUnitCost * count * 100) / 100;
        levelModelId = data.modelId || levelModelId;

        const childTask: ScheduleTask = {
          id: taskId,
          name: `${lvl.label} — ${cleanCat}`,
          wbsCode: `${wbsLevel}.${tradeIdx + 1}`,
          parentId: summaryId,
          outlineLevel: 2,
          isSummary: false,
          category: categoryName,
          startDate: tradeStart,
          endDate: tradeEnd,
          status: "Planned",
          elementIds: new Set(data.expressIds),
          modelId: data.modelId,
          unitCost: taskUnitCost,
          totalCost: taskTotalCost,
          quantity: data.expressIds.size,
          predecessors: prevLeafTaskId
            ? [{ predecessorId: prevLeafTaskId, type: "FS", lagDays: 0 }]
            : undefined,
        };

        this.tasks.set(taskId, childTask);
        createdTasks++;

        for (const id of data.expressIds) {
          levelElementIds.add(id);
          this.elementData.set(`${data.modelId}:${id}`, {
            unitCost: taskUnitCost,
            quantity: 1,
            taskName: childTask.name,
            taskStatus: "Planned",
            startDate: tradeStart,
            endDate: tradeEnd,
          });

          if (typeof window !== "undefined" && (window as any).twinDatabase) {
            const dbKey = `${data.modelId}-${id}`;
            const existing = (window as any).twinDatabase[dbKey] || {
              modelId: data.modelId,
              expressId: id,
              quantity: 1,
              unitCost: taskUnitCost,
              calculatedCost: taskUnitCost,
            };
            existing.task = childTask.name;
            existing.startDate = tradeStart;
            existing.endDate = tradeEnd;
            existing.status = "Planned";
            existing.isCustomized = true;
            (window as any).twinDatabase[dbKey] = existing;
          }
        }

        prevLeafTaskId = taskId;
        cursorMs = tradeEndMs;
      });

      summaryTask.modelId = levelModelId;
      summaryTask.quantity = levelElementIds.size;
      summaryTask.endDate = new Date(Math.max(cursorMs, startMs + DAY_MS)).toISOString().split("T")[0];
    });

    this.recomputeCpmAndRollups();
    return createdTasks;
  }

  /**
   * Save element-level cost and schedule data.
   */
  setElementData(modelId: string, expressId: number, data: Partial<ElementCostData>): void {
    const key = `${modelId}:${expressId}`;
    const existing = this.elementData.get(key) || {
      unitCost: 0,
      quantity: 0,
      taskName: '',
      taskStatus: 'Planned' as TaskStatus,
      startDate: '',
      endDate: '',
    };
    this.elementData.set(key, { ...existing, ...data });
  }

  /**
   * Get element-level cost and schedule data.
   */
  getElementData(modelId: string, expressId: number): ElementCostData | undefined {
    return this.elementData.get(`${modelId}:${expressId}`);
  }

  /**
   * Get all tasks sorted by start date.
   */
  getTasksSorted(): ScheduleTask[] {
    return [...this.tasks.values()].sort((a, b) =>
      new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }

  /**
   * Get the overall project date range enclosing all schedule tasks.
   */
  getProjectDateRange(): { min: Date; max: Date } | null {
    if (this.tasks.size === 0) return null;
    let minMs = Infinity;
    let maxMs = -Infinity;
    for (const task of this.tasks.values()) {
      if (!task.startDate || !task.endDate) continue;
      const s = new Date(task.startDate).getTime();
      const e = new Date(task.endDate).getTime();
      if (Number.isFinite(s) && Number.isFinite(e)) {
        if (s < minMs) minMs = s;
        if (e > maxMs) maxMs = e;
      }
    }
    if (minMs === Infinity || maxMs === -Infinity) return null;
    return { min: new Date(minMs), max: new Date(maxMs) };
  }

  /**
   * Get all element IDs that should be visible at a given date.
   * Elements whose task has not yet started are hidden.
   * Elements whose task has started or completed are visible.
   */
  getVisibleElementsAtDate(date: Date): Map<string, Set<number>> {
    const result = new Map<string, Set<number>>();
    const dateMs = date.getTime();

    for (const [, task] of this.tasks) {
      const startMs = new Date(task.startDate).getTime();
      if (dateMs >= startMs) {
        let modelSet = result.get(task.modelId);
        if (!modelSet) {
          modelSet = new Set<number>();
          result.set(task.modelId, modelSet);
        }
        for (const id of task.elementIds) {
          modelSet.add(id);
        }
      }
    }
    return result;
  }

  /**
   * Partitions scheduled elements into completed, inProgress, and planned (future) ModelIdMaps at a given date.
   */
  getPhasingStateAtDate(date: Date): {
    completed: Record<string, Set<number>>;
    inProgress: Record<string, Set<number>>;
    planned: Record<string, Set<number>>;
  } {
    const completed: Record<string, Set<number>> = {};
    const inProgress: Record<string, Set<number>> = {};
    const planned: Record<string, Set<number>> = {};
    const dateMs = date.getTime();

    const addIds = (bucket: Record<string, Set<number>>, modelId: string, ids: Set<number>) => {
      if (!modelId) return;
      if (!bucket[modelId]) bucket[modelId] = new Set<number>();
      for (const id of ids) {
        bucket[modelId].add(id);
      }
    };

    for (const [, task] of this.tasks) {
      const startMs = new Date(task.startDate).getTime();
      const endMs = new Date(task.endDate).getTime();
      if (dateMs > endMs) {
        addIds(completed, task.modelId, task.elementIds);
      } else if (dateMs >= startMs && dateMs <= endMs) {
        addIds(inProgress, task.modelId, task.elementIds);
      } else {
        addIds(planned, task.modelId, task.elementIds);
      }
    }

    return { completed, inProgress, planned };
  }

  public static statusColors: Record<TaskStatus, string> = {
    'Planned': '#6B7280',
    'In Progress': '#F59E0B',
    'Completed': '#10B981',
  };

  /**
   * Formats an IFC category identifier (e.g. IFCWALLSTANDARDCASE, IfcFooting) into a readable label.
   */
  public static formatCategoryLabel(categoryName: string): string {
    const upper = categoryName.trim().toUpperCase();
    const known: Record<string, string> = {
      IFCFOOTING: "Footing",
      IFCPILE: "Pile",
      IFCCOLUMN: "Column",
      IFCBEAM: "Beam",
      IFCSLAB: "Slab",
      IFCWALL: "Wall",
      IFCWALLSTANDARDCASE: "Wall (Standard)",
      IFCCURTAINWALL: "Curtain Wall",
      IFCMEMBER: "Structural Member",
      IFCPLATE: "Steel Plate",
      IFCSTAIR: "Staircase",
      IFCSTAIRFLIGHT: "Stair Flight",
      IFCRAMP: "Ramp",
      IFCRAILING: "Railing",
      IFCWINDOW: "Window",
      IFCDOOR: "Door",
      IFCROOF: "Roof",
      IFCCOVERING: "Cladding",
      IFCBUILDINGELEMENTPROXY: "Specialty Element",
      IFCFURNISHINGELEMENT: "Furnishings",
      IFCFLOWSEGMENT: "MEP Segment",
      IFCFLOWTERMINAL: "MEP Terminal",
      IFCFLOWFITTING: "MEP Fitting",
      IFCPIPESEGMENT: "Pipe Segment",
      IFCDUCTSEGMENT: "Duct Segment",
    };
    if (known[upper]) return known[upper];
    const stripped = categoryName
      .trim()
      .replace(/^IFC/i, "")
      .replace(/STANDARDCASE$/i, " (Standard)")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim();
    if (!stripped) return "Element";
    // Title-case all-uppercase words cleanly without splitting every letter
    return stripped
      .split(/\s+/)
      .map((w) => (w.startsWith("(") ? w : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()))
      .join(" ");
  }

  /**
   * Get task status color for timeline visualization.
   */
  static getStatusColor(status: TaskStatus): string {
    return this.statusColors[status] || '#6B7280';
  }

  /**
   * Resolves a benchmark fallback unit cost for an IFC category.
   */
  public resolveFallbackUnitCost(category: string): number {
    try {
      const rate = CostRateManager.getInstance().getRate(category);
      if (rate && rate.unitRate > 0) {
        return rate.unitRate;
      }
    } catch (e) {}
    return resolveCategoryUnitCost(category, 0);
  }

  /**
   * Resolves the unit cost for a schedule task using linked elements,
   * cost rate manager, or standard category benchmarks.
   */
  public getTaskUnitCost(task: ScheduleTask): number {
    if (task.unitCost && task.unitCost > 0) {
      return task.unitCost;
    }

    let elemCostSum = 0;
    let elemCostCount = 0;
    const twinDb = typeof window !== "undefined" ? (window as any).twinDatabase : undefined;

    if (task.elementIds && task.elementIds.size > 0) {
      for (const expId of task.elementIds) {
        const edKey = `${task.modelId}:${expId}`;
        const ed = this.elementData.get(edKey);
        if (ed && ed.unitCost > 0) {
          elemCostSum += ed.unitCost;
          elemCostCount++;
          continue;
        }
        if (twinDb) {
          const twinKey = `${task.modelId}-${expId}`;
          const twin = twinDb[twinKey] || twinDb[String(expId)];
          if (twin && twin.unitCost > 0) {
            elemCostSum += twin.unitCost;
            elemCostCount++;
          }
        }
      }
    }

    if (elemCostCount > 0) {
      return Math.round((elemCostSum / elemCostCount) * 100) / 100;
    }

    return this.resolveFallbackUnitCost(task.category);
  }

  /**
   * Resolves the total cost for a schedule task.
   */
  public getTaskTotalCost(task: ScheduleTask): number {
    if (task.totalCost && task.totalCost > 0) {
      return task.totalCost;
    }

    const count = Math.max(1, task.elementIds.size || task.quantity || 1);
    const unitRate = this.getTaskUnitCost(task);

    const twinDb = typeof window !== "undefined" ? (window as any).twinDatabase : undefined;
    if (twinDb && task.elementIds.size > 0) {
      let sum = 0;
      let matched = 0;
      for (const expId of task.elementIds) {
        const twinKey = `${task.modelId}-${expId}`;
        const twin = twinDb[twinKey] || twinDb[String(expId)];
        if (twin && (twin.calculatedCost !== undefined || twin.unitCost !== undefined)) {
          sum += twin.calculatedCost ?? (twin.unitCost * (twin.quantity || 1));
          matched++;
        }
      }
      if (matched > 0 && sum > 0) {
        return Math.round(sum * 100) / 100;
      }
    }

    return Math.round(unitRate * count * 100) / 100;
  }

  /**
   * Parses a single CSV line respecting double quotes and escaped quotes.
   */
  public parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Normalizes any incoming date string (ISO YYYY-MM-DD, DD-MM-YY, DD-MM-YYYY, DD-MMM-YY, MM/DD/YYYY)
   * into standard ISO YYYY-MM-DD.
   */
  public normalizeDateString(val?: string): string {
    if (!val) return "";
    const s = val.trim();
    if (!s) return "";

    // Already ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      return s;
    }

    // DD-MMM-YY or DD-MMM-YYYY (e.g. 09-Dec-26 or 09-Dec-2026)
    const mmmMatch = s.match(/^(\d{1,2})[-/ ]([A-Za-z]{3})[-/ ](\d{2,4})$/);
    if (mmmMatch) {
      const day = parseInt(mmmMatch[1], 10);
      const mStr = mmmMatch[2].toLowerCase();
      const months: Record<string, string> = {
        jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
        jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
      };
      const month = months[mStr];
      let year = parseInt(mmmMatch[3], 10);
      if (year < 100) year += 2000;
      if (month && day >= 1 && day <= 31) {
        return `${year}-${month}-${String(day).padStart(2, "0")}`;
      }
    }

    // DD-MM-YY or DD-MM-YYYY or DD/MM/YY or DD/MM/YYYY
    const numMatch = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
    if (numMatch) {
      const p1 = parseInt(numMatch[1], 10);
      const p2 = parseInt(numMatch[2], 10);
      let year = parseInt(numMatch[3], 10);
      if (year < 100) year += 2000;

      let day = p1;
      let month = p2;
      // If p1 <= 12 and p2 > 12, p2 is Day and p1 is Month (MM/DD/YYYY)
      if (p1 <= 12 && p2 > 12) {
        day = p2;
        month = p1;
      }

      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Fallback: Native JavaScript Date
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }

    return s;
  }

  /**
   * Export all tasks as a downloadable CSV template with 5D costs and 4D variance/actual dates included.
   */
  exportScheduleTemplateCSV(): string {
    const headers = [
      "TaskID",
      "TaskName",
      "Category",
      "StartDate",
      "EndDate",
      "ActualStartDate",
      "ActualEndDate",
      "Status",
      "ModelID",
      "ElementCount",
      "UnitCost",
      "TotalCost",
      "DelayDays",
      "CostImpact",
      "ExpressIDs"
    ];
    const rows: string[] = [headers.join(",")];

    for (const [, task] of this.tasks) {
      const expressIdsStr = `"${Array.from(task.elementIds).join(";")}"`;
      const cleanTaskName = `"${task.name.replace(/"/g, '""')}"`;
      const unitCost = this.getTaskUnitCost(task);
      const totalCost = this.getTaskTotalCost(task);

      // Cache resolved costs on task
      task.unitCost = unitCost;
      task.totalCost = totalCost;

      // Compute delay days and financial impact via DelayImpactEngine
      const impact = DelayImpactEngine.getInstance().computeTaskDelay(task);
      task.delayDays = impact.delayDays;
      task.costImpact = impact.totalCostImpact;

      const row = [
        task.id,
        cleanTaskName,
        task.category,
        task.startDate,
        task.endDate,
        task.actualStartDate || "",
        task.actualEndDate || "",
        task.status,
        task.modelId,
        task.elementIds.size,
        unitCost.toFixed(2),
        totalCost.toFixed(2),
        impact.delayDays,
        impact.totalCostImpact.toFixed(2),
        expressIdsStr
      ];
      rows.push(row.join(","));
    }

    return rows.join("\n");
  }

  /**
   * Import schedule CSV and update tasks, element data, itemized 5D costs, and 4D actual variance dates.
   */
  importScheduleFromCSV(csvText: string, options?: { replaceExisting?: boolean }): number {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return 0;

    let importedCount = 0;
    const headerLine = lines[0].replace(/^\uFEFF/, "");
    const headers = this.parseCsvLine(headerLine).map(h => h.trim().replace(/^"|"$/g, ""));

    const findCol = (...aliases: string[]) => {
      const lower = aliases.map(a => a.toLowerCase().replace(/[\s_\-]/g, ""));
      return headers.findIndex(h => {
        const cleanH = h.toLowerCase().replace(/[\s_\-]/g, "");
        return lower.includes(cleanH);
      });
    };

    const idIdx = findCol("TaskID", "ID", "UID", "Code", "ActivityID");
    const nameIdx = findCol("TaskName", "Name", "Description", "Task", "ActivityName", "Activity");
    const catIdx = findCol("Category", "Type", "Trade", "Discipline");
    const wbsIdx = findCol("WBS", "WBSCode", "WBS_Code", "OutlineNumber");
    const startIdx = findCol("StartDate", "Start", "EarlyStart", "TargetStart", "PlannedStart");
    const endIdx = findCol("EndDate", "End", "Finish", "EarlyFinish", "TargetEnd", "PlannedFinish", "PlannedEnd");
    const actualStartIdx = findCol("ActualStartDate", "ActualStart", "ActStart", "Actual_Start", "Act_Start");
    const actualEndIdx = findCol("ActualEndDate", "ActualEnd", "ActualFinish", "ActFinish", "Actual_End", "Act_Finish");
    const statusIdx = findCol("Status", "State", "Progress");
    const modelIdx = findCol("ModelID", "Model");
    const idsIdx = findCol("ExpressIDs", "ElementIDs", "IDs", "ExpressID");
    const unitCostIdx = findCol("UnitCost", "UnitRate", "Rate", "Unit_Cost");
    const totalCostIdx = findCol("TotalCost", "Cost", "Total_Cost", "Budget", "PlannedCost", "Price", "BAC");
    const actualCostIdx = findCol("ActualCost", "ActCost", "Actual_Cost", "AC");
    const qtyIdx = findCol("Quantity", "Qty", "Count");
    const delayDaysIdx = findCol("DelayDays", "Delay", "VarianceDays", "Slippage");
    const costImpactIdx = findCol("CostImpact", "DelayCost", "CostVariance");
    const profileIdx = findCol("AppearanceProfile", "Profile", "ProfileID", "Appearance");
    const matchPropIdx = findCol("MatchProperty", "PropertyName", "IFCProperty", "LinkProperty", "Property");
    const matchValIdx = findCol("MatchValue", "PropertyValue", "LinkValue");
    const predIdx = findCol("Predecessors", "Predecessor", "Dependencies");

    const cleanNumber = (val: string): number => {
      if (!val) return 0;
      const numStr = val.replace(/[^0-9.-]/g, "");
      const num = Number(numStr);
      return isNaN(num) ? 0 : num;
    };

    const parsedTasks: ScheduleTask[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = this.parseCsvLine(lines[i]);
      if (cols.length < 3) continue;

      const getCol = (idx: number) => (idx >= 0 && cols[idx] ? cols[idx].trim().replace(/^"|"$/g, "") : "");

      const id = getCol(idIdx) || `csv-task-${i}`;
      const name = getCol(nameIdx) || `Custom Task ${i}`;
      const category = getCol(catIdx) || "IFCELEMENT";
      const wbsCode = getCol(wbsIdx) || undefined;
      const startDate = this.normalizeDateString(getCol(startIdx));
      const endDate = this.normalizeDateString(getCol(endIdx));
      const actualStartDateRaw = getCol(actualStartIdx);
      const actualEndDateRaw = getCol(actualEndIdx);
      const actualStartDate = actualStartDateRaw ? this.normalizeDateString(actualStartDateRaw) : undefined;
      const actualEndDate = actualEndDateRaw ? this.normalizeDateString(actualEndDateRaw) : undefined;
      const status = (getCol(statusIdx) as TaskStatus) || "Planned";
      const modelId = getCol(modelIdx) || "";
      const idsRaw = getCol(idsIdx);
      const rawUnitCost = Math.max(0, cleanNumber(getCol(unitCostIdx)));
      const rawTotalCost = Math.max(0, cleanNumber(getCol(totalCostIdx)));
      const rawActualCost = Math.max(0, cleanNumber(getCol(actualCostIdx)));
      const rawQty = Math.max(0, cleanNumber(getCol(qtyIdx)));
      const rawDelayDays = cleanNumber(getCol(delayDaysIdx));
      const rawCostImpact = cleanNumber(getCol(costImpactIdx));
      const matchProperty = getCol(matchPropIdx) || undefined;
      const matchValue = getCol(matchValIdx) || undefined;
      const predRaw = getCol(predIdx);

      if (!startDate || !endDate) continue;

      const elementIds = new Set<number>();
      if (idsRaw) {
        idsRaw.split(";").forEach(val => {
          const num = Number(val.trim());
          if (!isNaN(num) && num > 0) elementIds.add(num);
        });
      }

      const count = elementIds.size > 0 ? elementIds.size : (rawQty > 0 ? rawQty : 1);
      let unitCost = rawUnitCost;
      let totalCost = rawTotalCost;
      let costSource: "total" | "unit" | "both" | "fallback" = "fallback";

      if (totalCost > 0 && unitCost > 0) {
        costSource = "both";
      } else if (totalCost > 0 && unitCost === 0) {
        costSource = "total";
        unitCost = Math.round((totalCost / count) * 100) / 100;
      } else if (unitCost > 0 && totalCost === 0) {
        costSource = "unit";
        totalCost = Math.round((unitCost * count) * 100) / 100;
      } else if (unitCost === 0 && totalCost === 0) {
        costSource = "fallback";
        unitCost = this.resolveFallbackUnitCost(category);
        totalCost = Math.round((unitCost * count) * 100) / 100;
      }

      const appearanceProfileId = getCol(profileIdx) || undefined;
      const predecessors: TaskDependency[] | undefined = predRaw
        ? predRaw
            .split(/[;,]/)
            .map((tok) => tok.trim())
            .filter(Boolean)
            .map((tok) => {
              const m = tok.match(/^(.+?)(FS|SS|FF|SF)([+-]\d+)?$/i);
              if (m) {
                return {
                  predecessorId: m[1].trim(),
                  type: m[2].toUpperCase() as TaskDependency["type"],
                  lagDays: m[3] ? Number(m[3]) : 0,
                };
              }
              return { predecessorId: tok, type: "FS" as const, lagDays: 0 };
            })
        : undefined;

      const task: ScheduleTask = {
        id,
        name,
        category,
        wbsCode,
        startDate,
        endDate,
        actualStartDate,
        actualEndDate,
        status,
        elementIds,
        modelId,
        unitCost,
        totalCost,
        costSource,
        actualCost: rawActualCost > 0 ? rawActualCost : undefined,
        delayDays: rawDelayDays !== 0 ? rawDelayDays : undefined,
        costImpact: rawCostImpact !== 0 ? rawCostImpact : undefined,
        quantity: count,
        appearanceProfileId,
        matchProperty,
        matchValue,
        predecessors,
      };

      // Calculate task delay and cost impact using DelayImpactEngine
      const impact = DelayImpactEngine.getInstance().computeTaskDelay(task);
      task.delayDays = impact.delayDays;
      task.costImpact = impact.totalCostImpact;

      parsedTasks.push(task);
    }

    if (parsedTasks.length === 0) return 0;

    if (options?.replaceExisting) {
      this.tasks.clear();
      this.elementData.clear();
    }

    for (const task of parsedTasks) {
      this.tasks.set(task.id, task);

      for (const expressId of task.elementIds) {
        this.elementData.set(`${task.modelId}:${expressId}`, {
          unitCost: task.unitCost,
          quantity: 1,
          taskName: task.name,
          taskStatus: task.status,
          startDate: task.startDate,
          endDate: task.endDate,
          actualStartDate: task.actualStartDate,
          actualEndDate: task.actualEndDate,
          delayDays: task.delayDays,
          costImpact: task.costImpact,
        });
      }

      importedCount++;
    }

    this.recomputeCpmAndRollups();
    return importedCount;
  }

  /**
   * Import schedule from Excel workbook (.xlsx / .xls) including Bentley Synchro multi-sheet workbooks.
   */
  async importScheduleFromExcel(buffer: ArrayBuffer | Uint8Array, fileName?: string): Promise<number> {
    const { ScheduleImportParsers } = await import("./ScheduleImportParsers");
    const res = await ScheduleImportParsers.parseExcel(buffer, fileName);
    if (!res || res.tasks.length === 0) return 0;

    let importedCount = 0;
    for (const task of res.tasks) {
      this.tasks.set(task.id, task);
      importedCount++;

      for (const expressId of task.elementIds) {
        this.elementData.set(`${task.modelId || "default-model"}:${expressId}`, {
          unitCost: task.unitCost || 0,
          quantity: 1,
          taskName: task.name,
          taskStatus: task.status,
          startDate: task.startDate,
          endDate: task.endDate,
        });
      }
    }

    return importedCount;
  }

  /**
   * Link selected 3D elements to a specific task (Synchro-style manual resource assignment).
   */
  assignElementsToTask(taskId: string, elementMap: Record<string, Set<number>>): number {
    const task = this.tasks.get(taskId);
    if (!task) return 0;

    let totalLinked = 0;
    for (const [modelId, elemSet] of Object.entries(elementMap)) {
      if (!task.modelId && modelId) {
        task.modelId = modelId;
      }
      for (const id of elemSet) {
        if (!task.elementIds.has(id)) {
          task.elementIds.add(id);
          totalLinked++;
        }
        const key = `${modelId}:${id}`;
        this.elementData.set(key, {
          unitCost: task.unitCost || 0,
          quantity: 1,
          taskName: task.name,
          taskStatus: task.status,
          startDate: task.startDate,
          endDate: task.endDate,
        });
      }
    }

    task.quantity = Math.max(1, task.elementIds.size);
    if (task.unitCost > 0) {
      task.totalCost = task.unitCost * task.quantity;
    }
    return totalLinked;
  }

  /**
   * Synchronizes schedule tasks with loaded 3D BIM model elements by matching
   * task names or task simulation keys against the IFC model's SIMULATION property.
   */
  public syncTasksWithModelSimulation(
    models: any[],
    twinDatabase?: Record<string, any>,
    options?: {
      targetProperty?: string;
    }
  ): {
    matchedTasks: number;
    totalTasks: number;
    totalElementsLinked: number;
    tasksMatched: Array<{ taskId: string; name: string; count: number }>;
  } {
    const targetProp = (options?.targetProperty || "SIMULATION").toLowerCase();
    
    // 1. Build an index of: simulationValue (normalized uppercase) -> Array<{ modelId: string; expressId: number }>
    const simIndex = new Map<string, Array<{ modelId: string; expressId: number }>>();

    const addSimEntry = (simVal: string, modelId: string, expressId: number) => {
      if (!simVal) return;
      const cleanVal = String(simVal).trim();
      if (!cleanVal || cleanVal.toLowerCase() === "unassigned") return;

      const upper = cleanVal.toUpperCase();
      if (!simIndex.has(upper)) {
        simIndex.set(upper, []);
      }
      simIndex.get(upper)!.push({ modelId, expressId });

      // Also index stripped prefix variants (e.g. "Text.SIMULATION: COL_EPit" -> "COL_EPit")
      if (cleanVal.includes(":")) {
        const afterColon = cleanVal.split(":").pop()!.trim().toUpperCase();
        if (!simIndex.has(afterColon)) {
          simIndex.set(afterColon, []);
        }
        simIndex.get(afterColon)!.push({ modelId, expressId });
      }
    };

    // Scan loaded model properties or cached FRAGS v3 index
    const indexer = FragmentIndexer.getInstance();
    for (const model of models) {
      if (!model) continue;
      const modelId = indexer.resolveModelId(model);
      let properties = model.properties || (model as any).getLocalProperties?.() || {};
      if (Object.keys(properties).length === 0) {
        const synced = indexer.getSyncModelData(modelId, model);
        if (synced) properties = indexer.toLegacyPropertyMap(synced);
      }

      for (const expressIdStr in properties) {
        const expressId = Number(expressIdStr);
        if (isNaN(expressId)) continue;
        const p = properties[expressId];
        if (!p) continue;

        // A. Direct property
        if (p.SIMULATION) {
          const val = typeof p.SIMULATION === "object" ? (p.SIMULATION.value ?? p.SIMULATION.NominalValue) : p.SIMULATION;
          if (val) addSimEntry(String(val), modelId, expressId);
        }

        // B. Property sets (Psets)
        if (p.psets && typeof p.psets === "object") {
          for (const rawPset of Object.values(p.psets)) {
            if (rawPset && typeof rawPset === "object") {
              for (const [k, v] of Object.entries(rawPset as Record<string, any>)) {
                if (k.toLowerCase() === targetProp || k.toLowerCase().endsWith(`.${targetProp}`)) {
                  if (v !== undefined && v !== null) {
                    addSimEntry(String(v), modelId, expressId);
                  }
                }
              }
            }
          }
        }
      }
    }

    // 2. Also check IfcParameterReader parsed properties cache
    try {
      const reader = (window as any).IfcParameterReader?.getInstance?.();
      if (reader && typeof reader.getParsedPropertiesMap === "function") {
        const parsedMap = reader.getParsedPropertiesMap();
        for (const [mId, elemPropsMap] of parsedMap.entries()) {
          for (const [eid, elemData] of Object.entries(elemPropsMap as Record<number, any>)) {
            const eidNum = Number(eid);
            if (elemData && elemData.psets) {
              for (const rawPset of Object.values(elemData.psets)) {
                if (rawPset && typeof rawPset === "object") {
                  for (const [k, v] of Object.entries(rawPset as Record<string, any>)) {
                    if (k.toLowerCase() === targetProp || k.toLowerCase().endsWith(`.${targetProp}`)) {
                      if (v !== undefined && v !== null) {
                        addSimEntry(String(v), mId, eidNum);
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    } catch (e) {}

    // 3. Match each schedule task to the indexed elements
    let matchedTasks = 0;
    let totalElementsLinked = 0;
    const tasksMatched: Array<{ taskId: string; name: string; count: number }> = [];

    const nowMs = Date.now();

    for (const [, task] of this.tasks) {
      const searchKeys: string[] = [];
      if (task.simulationKey) searchKeys.push(task.simulationKey.trim().toUpperCase());
      if (task.name) searchKeys.push(task.name.trim().toUpperCase());
      if (task.name.includes(":")) {
        searchKeys.push(task.name.split(":").pop()!.trim().toUpperCase());
      }

      let matchedElements: Array<{ modelId: string; expressId: number }> = [];
      for (const k of searchKeys) {
        if (simIndex.has(k)) {
          matchedElements = simIndex.get(k)!;
          break;
        }
      }

      if (matchedElements.length > 0) {
        matchedTasks++;
        task.elementIds = new Set<number>();

        const taskStartMs = new Date(task.startDate).getTime();
        const taskEndMs = new Date(task.endDate).getTime();
        let taskStatus: TaskStatus = "Planned";
        if (nowMs > taskEndMs) taskStatus = "Completed";
        else if (nowMs >= taskStartMs && nowMs <= taskEndMs) taskStatus = "In Progress";
        task.status = taskStatus;

        const taskUnitCost = this.getTaskUnitCost(task);
        const taskTotalCost = Math.round(taskUnitCost * Math.max(1, matchedElements.length) * 100) / 100;
        task.unitCost = taskUnitCost;
        task.totalCost = taskTotalCost;
        task.quantity = matchedElements.length;

        for (const { modelId, expressId } of matchedElements) {
          task.elementIds.add(expressId);
          task.modelId = modelId;
          totalElementsLinked++;

          this.elementData.set(`${modelId}:${expressId}`, {
            unitCost: taskUnitCost,
            quantity: 1,
            taskName: task.name,
            taskStatus: taskStatus,
            startDate: task.startDate,
            endDate: task.endDate,
          });

          if (twinDatabase) {
            const dbKey = `${modelId}-${expressId}`;
            const existing = twinDatabase[dbKey] || {
              modelId,
              expressId,
              quantity: 1,
            };

            twinDatabase[dbKey] = {
              ...existing,
              modelId,
              expressId,
              task: task.name,
              status: taskStatus,
              startDate: task.startDate,
              endDate: task.endDate,
              wbsCode: task.wbsCode,
              totalFloat: task.totalFloat,
              isCritical: task.isCritical,
              unitCost: taskUnitCost,
              calculatedCost: taskUnitCost * (existing.quantity || 1),
              isCustomized: true,
            };
          }
        }

        task.quantity = task.elementIds.size;
        tasksMatched.push({
          taskId: task.id,
          name: task.name,
          count: task.elementIds.size,
        });
      }
    }

    return {
      matchedTasks,
      totalTasks: this.tasks.size,
      totalElementsLinked,
      tasksMatched,
    };
  }

  /**
   * Recomputes DAG CPM schedule dates/floats (totalFloat, freeFloat, critical path,
   * out-of-sequence flags) and bottom-up WBS hierarchy rollups across all tasks.
   */
  public recomputeCpmAndRollups(): CpmSolveReport {
    const taskList = this.getTasksSorted();
    const report = solveCpmGraph(taskList);

    // Populate bidirectional successor arrays cleanly
    const succMap = new Map<string, string[]>();
    for (const t of taskList) succMap.set(t.id, []);
    for (const t of taskList) {
      for (const dep of t.predecessors ?? []) {
        const list = succMap.get(dep.predecessorId);
        if (list && !list.includes(t.id)) list.push(t.id);
      }
    }

    for (const t of taskList) {
      const res = report.results.get(t.id);
      const succs = succMap.get(t.id);
      if (succs && succs.length > 0) t.successors = succs;
      if (res) {
        t.earlyStart = res.earlyStart;
        t.earlyFinish = res.earlyFinish;
        t.lateStart = res.lateStart;
        t.lateFinish = res.lateFinish;
        t.totalFloat = res.totalFloatDays;
        t.freeFloat = res.freeFloatDays;
        t.isCritical = res.isCritical;
        t.outOfSequence = res.outOfSequence;
      }
    }

    rollupWbsHierarchy(taskList);
    return report;
  }

  /**
   * Binds a dynamic Search Set rule ID to a schedule task and applies its resolved elements.
   */
  public bindSearchSetRuleToTask(
    taskId: string,
    ruleId: string,
    elementMap: Record<string, Set<number>>
  ): number {
    const task = this.tasks.get(taskId);
    if (!task) return 0;
    task.selectionRuleId = ruleId;
    return this.assignElementsToTask(taskId, elementMap);
  }

  /**
   * Re-evaluates all tasks carrying a `selectionRuleId` against currently loaded BIM models.
   */
  public async refreshDynamicRuleBindings(): Promise<number> {
    const { RuleSearchEngine } = await import("./RuleSearchEngine");
    const ruleEngine = RuleSearchEngine.getInstance();
    let totalUpdated = 0;
    for (const task of this.tasks.values()) {
      if (!task.selectionRuleId) continue;
      const rule = ruleEngine.getRule(task.selectionRuleId);
      if (!rule) continue;
      const res = await ruleEngine.evaluateAgainstLoadedModels(rule);
      if (res.matchedCount > 0) {
        this.assignElementsToTask(task.id, res.modelIdMap);
        totalUpdated++;
      }
    }
    return totalUpdated;
  }

  /**
   * Clear all tasks and element data.
   */
  clear(): void {
    this.tasks.clear();
    this.elementData.clear();
  }
}
