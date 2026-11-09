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

  it("should export and import schedule CSV cleanly with 5D itemized unit and total costs", () => {
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
      totalCost: 600,
      quantity: 3,
    };

    manager.tasks.set(task.id, task);

    const csv = manager.exportScheduleTemplateCSV();
    expect(csv).toContain("TaskID,TaskName,Category");
    expect(csv).toContain("UnitCost,TotalCost");
    expect(csv).toContain("Concrete Pouring");
    expect(csv).toContain("501;502;503");
    expect(csv).toContain("200.00,600.00");

    const newManager = new ScheduleManager();
    const imported = newManager.importScheduleFromCSV(csv);
    expect(imported).toBe(1);
    expect(newManager.tasks.has("task-01")).toBe(true);
    const importedTask = newManager.tasks.get("task-01");
    expect(importedTask?.elementIds.size).toBe(3);
    expect(importedTask?.unitCost).toBe(200);
    expect(importedTask?.totalCost).toBe(600);

    // Verify element data cost mapping
    const elData = newManager.getElementData("model-1", 501);
    expect(elData?.unitCost).toBe(200);
    expect(elData?.taskName).toBe("Concrete Pouring");
  });

  it("should parse flexible CSV column variants and currency formats", () => {
    const customCsv = `Task ID, Task Name, Category, Start Date, End Date, Status, Model, Element IDs, Unit Rate, Total Budget
task-custom,"Steel Framing",IFCBEAM,2026-05-01,2026-05-10,Planned,model-2,"701;702","$350.50","$701.00"`;

    const flexibleManager = new ScheduleManager();
    const count = flexibleManager.importScheduleFromCSV(customCsv);
    expect(count).toBe(1);
    const task = flexibleManager.tasks.get("task-custom");
    expect(task).toBeDefined();
    expect(task?.name).toBe("Steel Framing");
    expect(task?.unitCost).toBe(350.5);
    expect(task?.totalCost).toBe(701);
    expect(task?.elementIds.size).toBe(2);
  });

  it("should resolve status colors properly", () => {
    expect(ScheduleManager.getStatusColor("Planned")).toBe("#6B7280");
    expect(ScheduleManager.getStatusColor("In Progress")).toBe("#F59E0B");
    expect(ScheduleManager.getStatusColor("Completed")).toBe("#10B981");
  });

  it("should synchronize schedule tasks with 3D elements via SIMULATION property", () => {
    // Mock model with elements having SIMULATION property
    const mockModel = {
      modelId: "snowdon-model",
      properties: {
        101: {
          SIMULATION: "COL_EPit",
        },
        102: {
          SIMULATION: "COL_EPit",
        },
        201: {
          psets: {
            Text: {
              SIMULATION: "WALL_LL1_35_Low",
            },
          },
        },
        301: {
          psets: {
            CustomParams: {
              "Text.SIMULATION": "FLO_LL1_35_Low",
            },
          },
        },
      },
    };

    manager.tasks.set("t1", {
      id: "t1",
      name: "COL_EPit",
      category: "IFCCOLUMN",
      startDate: "2026-12-03",
      endDate: "2026-12-04",
      status: "Planned",
      elementIds: new Set<number>(),
      modelId: "",
      unitCost: 8750,
      quantity: 0,
      simulationKey: "COL_EPit",
    });

    manager.tasks.set("t2", {
      id: "t2",
      name: "WALL_LL1_35_Low",
      category: "IFCWALL",
      startDate: "2027-01-10",
      endDate: "2027-01-20",
      status: "Planned",
      elementIds: new Set<number>(),
      modelId: "",
      unitCost: 12000,
      quantity: 0,
    });

    manager.tasks.set("t3", {
      id: "t3",
      name: "FLO_LL1_35_Low",
      category: "IFCSLAB",
      startDate: "2027-02-01",
      endDate: "2027-02-15",
      status: "Planned",
      elementIds: new Set<number>(),
      modelId: "",
      unitCost: 15000,
      quantity: 0,
    });

    const twinDb: Record<string, any> = {};
    const result = manager.syncTasksWithModelSimulation([mockModel], twinDb);

    expect(result.matchedTasks).toBe(3);
    expect(result.totalElementsLinked).toBe(4);

    const task1 = manager.tasks.get("t1")!;
    expect(task1.elementIds.has(101)).toBe(true);
    expect(task1.elementIds.has(102)).toBe(true);
    expect(task1.modelId).toBe("snowdon-model");
    expect(task1.quantity).toBe(2);

    const task2 = manager.tasks.get("t2")!;
    expect(task2.elementIds.has(201)).toBe(true);

    const task3 = manager.tasks.get("t3")!;
    expect(task3.elementIds.has(301)).toBe(true);

    expect(twinDb["snowdon-model-101"]?.task).toBe("COL_EPit");
    expect(twinDb["snowdon-model-201"]?.task).toBe("WALL_LL1_35_Low");
  });
});
