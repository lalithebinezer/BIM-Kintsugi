/**
 * Schedule Manager — 4D Construction Schedule Data Model & Operations.
 *
 * Manages schedule tasks linked to IFC elements via ExpressIDs.
 * Supports auto-generation from model categories and manual editing.
 */

export type TaskStatus = 'Planned' | 'In Progress' | 'Completed';

export interface ScheduleTask {
  id: string;
  name: string;
  category: string;
  startDate: string;      // ISO date string YYYY-MM-DD
  endDate: string;        // ISO date string YYYY-MM-DD
  status: TaskStatus;
  elementIds: Set<number>;
  modelId: string;
  unitCost: number;
  quantity: number;
  wbsCode?: string;
  totalFloat?: number;
  isCritical?: boolean;
  simulationKey?: string;
}

export interface ElementCostData {
  unitCost: number;
  quantity: number;
  taskName: string;
  taskStatus: TaskStatus;
  startDate: string;
  endDate: string;
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

      const cleanName = categoryName
        .replace(/^IFC/i, '')
        .replace(/STANDARDCASE$/i, '')
        .replace(/([A-Z])/g, ' $1')
        .trim();

      const task: ScheduleTask = {
        id: taskId,
        name: `${cleanName} Works`,
        category: categoryName,
        startDate: phaseStart,
        endDate: phaseEnd,
        status: 'Planned',
        elementIds: allElementIds,
        modelId: taskModelId,
        unitCost: 0,
        quantity: allElementIds.size,
      };

      this.tasks.set(taskId, task);
      phaseIndex++;
    }
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
   * Get the overall project date range.
   */
  getProjectDateRange(): { min: Date; max: Date } | null {
    const tasks = this.getTasksSorted();
    if (tasks.length === 0) return null;
    const min = new Date(tasks[0].startDate);
    const max = new Date(tasks[tasks.length - 1].endDate);
    return { min, max };
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
   * Get task status color for timeline visualization.
   */
  static getStatusColor(status: TaskStatus): string {
    return this.statusColors[status] || '#6B7280';
  }

  /**
   * Export all tasks as a downloadable CSV template.
   */
  exportScheduleTemplateCSV(): string {
    const headers = ["TaskID", "TaskName", "Category", "StartDate", "EndDate", "Status", "ModelID", "ElementCount", "ExpressIDs", "UnitCost"];
    const rows: string[] = [headers.join(",")];

    for (const [, task] of this.tasks) {
      const expressIdsStr = `"${Array.from(task.elementIds).join(";")}"`;
      const cleanTaskName = `"${task.name.replace(/"/g, '""')}"`;
      const row = [
        task.id,
        cleanTaskName,
        task.category,
        task.startDate,
        task.endDate,
        task.status,
        task.modelId,
        task.elementIds.size,
        expressIdsStr,
        task.unitCost || 0
      ];
      rows.push(row.join(","));
    }

    return rows.join("\n");
  }

  /**
   * Import schedule CSV and update tasks and element data.
   */
  importScheduleFromCSV(csvText: string): number {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) return 0;

    let importedCount = 0;
    const headerLine = lines[0];
    const headers = headerLine.split(",").map(h => h.trim().replace(/^"|"$/g, ""));

    const idIdx = headers.indexOf("TaskID");
    const nameIdx = headers.indexOf("TaskName");
    const catIdx = headers.indexOf("Category");
    const startIdx = headers.indexOf("StartDate");
    const endIdx = headers.indexOf("EndDate");
    const statusIdx = headers.indexOf("Status");
    const modelIdx = headers.indexOf("ModelID");
    const idsIdx = headers.indexOf("ExpressIDs");
    const costIdx = headers.indexOf("UnitCost");

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV regex split supporting quoted commas
      const cols = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(",");
      if (cols.length < 5) continue;

      const getCol = (idx: number) => (idx >= 0 && cols[idx] ? cols[idx].trim().replace(/^"|"$/g, "") : "");

      const id = getCol(idIdx) || `csv-task-${i}`;
      const name = getCol(nameIdx) || `Custom Task ${i}`;
      const category = getCol(catIdx) || "IFCELEMENT";
      const startDate = getCol(startIdx);
      const endDate = getCol(endIdx);
      const status = (getCol(statusIdx) as TaskStatus) || "Planned";
      const modelId = getCol(modelIdx) || "";
      const idsRaw = getCol(idsIdx);
      const unitCost = Number(getCol(costIdx)) || 0;

      if (!startDate || !endDate) continue;

      const elementIds = new Set<number>();
      if (idsRaw) {
        idsRaw.split(";").forEach(val => {
          const num = Number(val.trim());
          if (!isNaN(num) && num > 0) elementIds.add(num);
        });
      }

      const task: ScheduleTask = {
        id,
        name,
        category,
        startDate,
        endDate,
        status,
        elementIds,
        modelId,
        unitCost,
        quantity: elementIds.size,
      };

      this.tasks.set(id, task);
      importedCount++;
    }

    return importedCount;
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

    // Scan loaded model properties
    for (const model of models) {
      if (!model) continue;
      const modelId = model.modelId || model.uuid || model.id || (model.object && model.object.uuid) || "default-model";
      const properties = model.properties || (model as any).getLocalProperties?.() || {};

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

        for (const { modelId, expressId } of matchedElements) {
          task.elementIds.add(expressId);
          task.modelId = modelId;
          totalElementsLinked++;

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
              unitCost: task.unitCost || 250,
              calculatedCost: (task.unitCost || 250) * (existing.quantity || 1),
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
   * Clear all tasks and element data.
   */
  clear(): void {
    this.tasks.clear();
    this.elementData.clear();
  }
}
