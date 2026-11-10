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

  it("should normalize mixed international date formats (DD-MMM-YY, DD-MM-YY, DD/MM/YYYY) to ISO", () => {
    const sm = new ScheduleManager();
    expect(sm.normalizeDateString("09-Dec-26")).toBe("2026-12-09");
    expect(sm.normalizeDateString("26-12-26")).toBe("2026-12-26");
    expect(sm.normalizeDateString("07-01-27")).toBe("2027-01-07");
    expect(sm.normalizeDateString("15/11/2026")).toBe("2026-11-15");
    expect(sm.normalizeDateString("2026-05-20")).toBe("2026-05-20");

    const userStyleCsv = `TaskID,TaskName,Category,StartDate,EndDate,Status,ModelID,ElementCount,UnitCost,TotalCost,ExpressIDs
msp-1,COL_EPit,IFCELEMENT,09-Dec-26,11-Dec-26,Completed,model-1,0,8750,8750,
msp-2,COL_LL1_35_Low,IFCELEMENT,26-12-26,28-12-26,Planned,model-1,5,8750,15000,3923;3955;4164;4375;24794
msp-5,COL_LL3,IFCELEMENT,20-01-27,31-01-27,Planned,model-1,2,8750,17500,23219;23251`;

    const imported = sm.importScheduleFromCSV(userStyleCsv);
    expect(imported).toBe(3);
    expect(sm.tasks.get("msp-1")?.startDate).toBe("2026-12-09");
    expect(sm.tasks.get("msp-1")?.endDate).toBe("2026-12-11");
    expect(sm.tasks.get("msp-2")?.startDate).toBe("2026-12-26");
    expect(sm.tasks.get("msp-2")?.endDate).toBe("2026-12-28");
    expect(sm.tasks.get("msp-5")?.startDate).toBe("2027-01-20");
    expect(sm.tasks.get("msp-5")?.endDate).toBe("2027-01-31");
  });

  it("should cleanly import realistic construction schedule CSV with 1,300+ element bindings and currency totals", () => {
    const sm = new ScheduleManager();
    const csvContent = `TaskID,TaskName,Category,StartDate,EndDate,ActualStartDate,ActualEndDate,Status,ModelID,ElementCount,UnitCost,TotalCost,DelayDays,CostImpact,ExpressIDs
msp-1,COL_EPit,IFCELEMENT,09-Dec-26,11-Dec-26,,,Completed,,0,1,8750,0,0,
msp-2,COL_LL1_35_Low,IFCELEMENT,26-12-26,28-12-26,,,Planned,Dynamo_NCP_Snowdon_Towers_Sample_Structural.ifc,5,8750,15000,0,0,3923;3955;4164;4375;24794
,COL_LL2,,07-01-27,17-01-27,,,,,,,45000,,,
msp-35,FRA_LTOS_LL5,IFCELEMENT,13-02-27,15-02-27,,,Planned,Dynamo_NCP_Snowdon_Towers_Sample_Structural.ifc,5,8750,43750,0,0,4634;4722;6822;6893;6937
,,,,,,,,,,,,,,
msp-49,Unassigned,IFCELEMENT,11-03-27,11-03-27,,,Planned,,0,8750,8750,0,0,`;

    const count = sm.importScheduleFromCSV(csvContent);
    expect(count).toBe(5); // skips empty row 5 cleanly
    expect(sm.tasks.get("msp-2")?.elementIds.size).toBe(5);
    expect(sm.tasks.get("msp-35")?.elementIds.size).toBe(5);
    expect(sm.tasks.get("csv-task-3")?.totalCost).toBe(45000); // anonymous row assigned id
    expect(sm.tasks.get("csv-task-3")?.startDate).toBe("2027-01-07");
    expect(sm.tasks.get("csv-task-3")?.endDate).toBe("2027-01-17");

    const range = sm.getProjectDateRange();
    expect(range).not.toBeNull();
    expect(range?.min.toISOString().split("T")[0]).toBe("2026-12-09");
    expect(range?.max.toISOString().split("T")[0]).toBe("2027-03-11");
  });

  it("should resolve status colors properly", () => {
    expect(ScheduleManager.getStatusColor("Planned")).toBe("#6B7280");
    expect(ScheduleManager.getStatusColor("In Progress")).toBe("#F59E0B");
    expect(ScheduleManager.getStatusColor("Completed")).toBe("#10B981");
  });

  it("should accurately auto-adjust project date range enclosing long-running and overlapping tasks", () => {
    // Task 1 starts early and lasts long
    manager.tasks.set("t1", {
      id: "t1",
      name: "Long Infrastructure Works",
      category: "IFCSITE",
      startDate: "2027-01-01",
      endDate: "2027-12-31",
      status: "Planned",
      elementIds: new Set([1]),
      modelId: "m1",
      unitCost: 100,
      quantity: 1,
    });
    // Task 2 starts later but finishes earlier
    manager.tasks.set("t2", {
      id: "t2",
      name: "Quick Slab Pour",
      category: "IFCSLAB",
      startDate: "2027-06-01",
      endDate: "2027-06-30",
      status: "Planned",
      elementIds: new Set([2]),
      modelId: "m1",
      unitCost: 200,
      quantity: 1,
    });

    const range = manager.getProjectDateRange();
    expect(range).not.toBeNull();
    expect(range?.min.toISOString().split("T")[0]).toBe("2027-01-01");
    // Ensure max is 2027-12-31, NOT prematurely truncated to 2027-06-30
    expect(range?.max.toISOString().split("T")[0]).toBe("2027-12-31");
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

  it("should parse complex CSV schedule with mixed date formats and calculate project date range", () => {
    const csv = `TaskID,TaskName,Category,StartDate,EndDate,ActualStartDate,ActualEndDate,Status,ModelID,ElementCount,UnitCost,TotalCost,DelayDays,CostImpact,ExpressIDs
msp-1,COL_EPit,IFCELEMENT,09-Dec-26,11-Dec-26,,,Completed,,0,1,8750,0,0,
msp-2,COL_LL1_35_Low,IFCELEMENT,26-12-26,28-12-26,,,Planned,Dynamo_NCP_Snowdon_Towers_Sample_Structural.ifc,5,8750,15000,0,0,3923;3955;4164;4375;24794
msp-8,COL_LTOS,IFCELEMENT,11-03-27,11-03-27,,,Planned,Dynamo_NCP_Snowdon_Towers_Sample_Structural.ifc,2,8750,45000,0,0,154936;155008`;

    const count = manager.importScheduleFromCSV(csv);
    expect(count).toBe(3);
    const range = manager.getProjectDateRange();
    expect(range).not.toBeNull();
    expect(range?.min.toISOString().slice(0, 10)).toBe("2026-12-09");
    expect(range?.max.toISOString().slice(0, 10)).toBe("2027-03-11");

    const t2 = manager.tasks.get("msp-2")!;
    expect(t2.startDate).toBe("2026-12-26");
    expect(t2.endDate).toBe("2026-12-28");
    expect(t2.elementIds.size).toBe(5);
    expect(t2.totalCost).toBe(15000);
  });

  it("should support 1-click assigning selected 3D elements to a task (assignElementsToTask)", () => {
    manager.tasks.set("task-col", {
      id: "task-col",
      name: "Columns Erection",
      category: "IFCCOLUMN",
      startDate: "2026-08-01",
      endDate: "2026-08-10",
      status: "Planned",
      elementIds: new Set<number>([1001]),
      modelId: "model-alpha",
      unitCost: 500,
      totalCost: 500,
      quantity: 1,
    });

    const selMap: Record<string, Set<number>> = {
      "model-alpha": new Set<number>([1002, 1003, 1004]),
    };

    const linked = manager.assignElementsToTask("task-col", selMap);
    expect(linked).toBe(3);

    const updatedTask = manager.tasks.get("task-col")!;
    expect(updatedTask.elementIds.size).toBe(4);
    expect(updatedTask.elementIds.has(1001)).toBe(true);
    expect(updatedTask.elementIds.has(1002)).toBe(true);
    expect(updatedTask.elementIds.has(1003)).toBe(true);
    expect(updatedTask.elementIds.has(1004)).toBe(true);
    expect(updatedTask.quantity).toBe(4);
    expect(updatedTask.totalCost).toBe(2000); // 500 * 4

    // Verify elementData is populated
    const elData = manager.elementData.get("model-alpha:1003")!;
    expect(elData).toBeDefined();
    expect(elData.taskName).toBe("Columns Erection");
    expect(elData.startDate).toBe("2026-08-01");
    expect(elData.endDate).toBe("2026-08-10");
  });
});
