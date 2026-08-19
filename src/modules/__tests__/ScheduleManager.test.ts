import { describe, it, expect, beforeEach } from "vitest";
import { ScheduleManager, type ScheduleTask } from "../ScheduleManager";

describe("ScheduleManager Unit Tests", () => {
  let manager: ScheduleManager;

  beforeEach(() => {
    manager = new ScheduleManager();
  });

  it("should initialize with empty tasks and element data", () => {
    expect(manager.tasks.size).toBe(0);
    expect(manager.elementData.size).toBe(0);
    expect(manager.grandTotal).toBe(0);
    expect(manager.costedElementCount).toBe(0);
  });

  it("should auto-generate construction tasks in correct sequence", () => {
    const categories = new Map<string, { modelId: string; elementIds: number[] }[]>([
      ["IFCWALL", [{ modelId: "model-1", elementIds: [101, 102] }]],
      ["IFCFOOTING", [{ modelId: "model-1", elementIds: [201] }]],
      ["IFCROOF", [{ modelId: "model-1", elementIds: [301] }]],
    ]);

    manager.generateFromCategories(categories, "2026-03-01");
    const tasks = manager.getTasksSorted();

    expect(tasks.length).toBe(3);
    // Footings should come before Walls, which come before Roof
    expect(tasks[0].category).toBe("IFCFOOTING");
    expect(tasks[1].category).toBe("IFCWALL");
    expect(tasks[2].category).toBe("IFCROOF");

    expect(tasks[0].startDate).toBe("2026-03-01");
    expect(tasks[0].elementIds.has(201)).toBe(true);
  });

  it("should calculate grand total and element cost data accurately", () => {
    manager.setElementData("model-1", 101, { unitCost: 150, quantity: 4 });
    manager.setElementData("model-1", 102, { unitCost: 50, quantity: 10 });

    expect(manager.costedElementCount).toBe(2);
    expect(manager.grandTotal).toBe(150 * 4 + 50 * 10); // 600 + 500 = 1100

    const elData = manager.getElementData("model-1", 101);
    expect(elData?.unitCost).toBe(150);
    expect(elData?.quantity).toBe(4);
  });

  it("should export and import schedule CSV cleanly", () => {
    const task: ScheduleTask = {
      id: "task-01",
      name: "Concrete Pouring",
      category: "IFCSLAB",
      startDate: "2026-04-01",
      endDate: "2026-04-15",
      status: "In Progress",
      elementIds: new Set([501, 502, 503]),
      modelId: "model-1",
      unitCost: 200,
      quantity: 3,
    };

    manager.tasks.set(task.id, task);

    const csv = manager.exportScheduleTemplateCSV();
    expect(csv).toContain("TaskID,TaskName,Category");
    expect(csv).toContain("Concrete Pouring");
    expect(csv).toContain("501;502;503");

    const newManager = new ScheduleManager();
    const imported = newManager.importScheduleFromCSV(csv);
    expect(imported).toBe(1);
    expect(newManager.tasks.has("task-01")).toBe(true);
    expect(newManager.tasks.get("task-01")?.elementIds.size).toBe(3);
  });

  it("should resolve status colors properly", () => {
    expect(ScheduleManager.getStatusColor("Planned")).toBe("#6B7280");
    expect(ScheduleManager.getStatusColor("In Progress")).toBe("#F59E0B");
    expect(ScheduleManager.getStatusColor("Completed")).toBe("#10B981");
  });
});
