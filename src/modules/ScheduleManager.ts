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
   * Clear all tasks and element data.
   */
  clear(): void {
    this.tasks.clear();
    this.elementData.clear();
  }
}
