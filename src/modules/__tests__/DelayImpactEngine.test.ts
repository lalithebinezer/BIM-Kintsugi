import { describe, it, expect, beforeEach } from "vitest";
import { DelayImpactEngine, DEFAULT_DELAY_CONFIG } from "../DelayImpactEngine";
import { ScheduleManager } from "../ScheduleManager";
import type { ScheduleTask } from "../ScheduleManager";

describe("DelayImpactEngine", () => {
  let engine: DelayImpactEngine;

  beforeEach(() => {
    engine = new DelayImpactEngine();
    ScheduleManager.getInstance().tasks.clear();
    ScheduleManager.getInstance().elementData.clear();
  });

  describe("Single Task Delay & Cost Impact", () => {
    it("should classify task finishing early as Ahead with zero prolongation cost", () => {
      const task: ScheduleTask = {
        id: "T-01",
        name: "Foundations",
        category: "IFCFOOTING",
        startDate: "2026-06-01",
        endDate: "2026-06-20",
        actualStartDate: "2026-06-01",
        actualEndDate: "2026-06-15", // 5 days early
        status: "Completed",
        elementIds: new Set([101, 102]),
        modelId: "m1",
        unitCost: 500,
        totalCost: 1000,
        quantity: 2,
      };

      const impact = engine.computeTaskDelay(task);
      expect(impact.delayDays).toBe(-5);
      expect(impact.status).toBe("Ahead");
      expect(impact.prolongationCost).toBe(0);
      expect(impact.penaltyCost).toBe(0);
      expect(impact.totalCostImpact).toBe(0);
    });

    it("should classify task finishing on time as On Schedule", () => {
      const task: ScheduleTask = {
        id: "T-02",
        name: "Columns",
        category: "IFCCOLUMN",
        startDate: "2026-06-21",
        endDate: "2026-07-10",
        actualStartDate: "2026-06-21",
        actualEndDate: "2026-07-10",
        status: "Completed",
        elementIds: new Set([201]),
        modelId: "m1",
        unitCost: 1500,
        totalCost: 1500,
        quantity: 1,
      };

      const impact = engine.computeTaskDelay(task);
      expect(impact.delayDays).toBe(0);
      expect(impact.status).toBe("On Schedule");
      expect(impact.prolongationCost).toBe(0);
      expect(impact.totalCostImpact).toBe(0);
    });

    it("should calculate delay days and prolongation overhead for delayed task", () => {
      const task: ScheduleTask = {
        id: "T-03",
        name: "Floor Slabs",
        category: "IFCSLAB",
        startDate: "2026-07-11",
        endDate: "2026-07-25",
        actualStartDate: "2026-07-11",
        actualEndDate: "2026-07-30", // 5 days late
        status: "Completed",
        elementIds: new Set([301, 302]),
        modelId: "m1",
        unitCost: 2000,
        totalCost: 4000,
        actualCost: 4500, // $500 direct overrun
        quantity: 2,
      };

      const impact = engine.computeTaskDelay(task);
      expect(impact.delayDays).toBe(5);
      expect(impact.status).toBe("Delayed");
      expect(impact.directCostVariance).toBe(500);
      // Prolongation = 5 days * $1,200/day = $6,000
      expect(impact.prolongationCost).toBe(6000);
      expect(impact.penaltyCost).toBe(0);
      // Total = $500 direct + $6,000 overhead = $6,500
      expect(impact.totalCostImpact).toBe(6500);
    });

    it("should classify severe delay (> 7 days or critical path) as Critical Delay with liquidated damages", () => {
      const task: ScheduleTask = {
        id: "T-04",
        name: "Facade Glazing",
        category: "IFCCURTAINWALL",
        startDate: "2026-08-01",
        endDate: "2026-08-15",
        actualStartDate: "2026-08-01",
        actualEndDate: "2026-08-27", // 12 days late (> 7 threshold)
        status: "Completed",
        isCritical: true,
        totalFloat: 0,
        elementIds: new Set([401]),
        modelId: "m1",
        unitCost: 10000,
        totalCost: 10000,
        quantity: 1,
      };

      const impact = engine.computeTaskDelay(task);
      expect(impact.delayDays).toBe(12);
      expect(impact.status).toBe("Critical Delay");
      // Prolongation = 12 * $1,200 = $14,400
      expect(impact.prolongationCost).toBe(14400);
      // Penalty = 12 * $2,500 = $30,000
      expect(impact.penaltyCost).toBe(30000);
      expect(impact.totalCostImpact).toBe(44400);
    });

    it("should compute dynamic slippage for in-progress task when simulation date exceeds planned end", () => {
      const task: ScheduleTask = {
        id: "T-05",
        name: "MEP Piping",
        category: "IFCPIPESEGMENT",
        startDate: "2026-09-01",
        endDate: "2026-09-10",
        actualStartDate: "2026-09-01",
        status: "In Progress",
        elementIds: new Set([501]),
        modelId: "m1",
        unitCost: 3000,
        totalCost: 3000,
        quantity: 1,
      };

      // Simulation date is 6 days past planned end: 2026-09-16
      const currentSimMs = Date.parse("2026-09-16T00:00:00Z");
      const impact = engine.computeTaskDelay(task, currentSimMs);

      expect(impact.delayDays).toBe(6);
      expect(impact.status).toBe("Delayed");
      expect(impact.prolongationCost).toBe(6 * DEFAULT_DELAY_CONFIG.dailyOverheadRate);
    });
  });

  describe("Project-Level Delay & EVM Analytics", () => {
    it("should calculate comprehensive EVM metrics and project slippage", () => {
      const tasks: ScheduleTask[] = [
        {
          id: "T-1",
          name: "Substructure",
          category: "IFCSLAB",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          actualStartDate: "2026-01-01",
          actualEndDate: "2026-01-28", // 3 days ahead
          status: "Completed",
          elementIds: new Set([1]),
          modelId: "m1",
          unitCost: 10000,
          totalCost: 10000,
          actualCost: 9500,
          quantity: 1,
        },
        {
          id: "T-2",
          name: "Superstructure",
          category: "IFCCOLUMN",
          startDate: "2026-02-01",
          endDate: "2026-02-28",
          actualStartDate: "2026-02-01",
          actualEndDate: "2026-03-10", // 10 days late
          status: "Completed",
          isCritical: true,
          elementIds: new Set([2]),
          modelId: "m1",
          unitCost: 20000,
          totalCost: 20000,
          actualCost: 22000,
          quantity: 1,
        },
      ];

      const simMs = Date.parse("2026-03-15T00:00:00Z");
      const report = engine.computeProjectDelayReport(tasks, simMs);

      expect(report.totalTasks).toBe(2);
      expect(report.aheadCount).toBe(1);
      expect(report.criticalDelayCount).toBe(1);
      expect(report.projectSlippageDays).toBe(10);
      expect(report.totalPlannedCost).toBe(30000);
      expect(report.totalActualCost).toBe(31500); // 9500 + 22000
      expect(report.earnedValue).toBe(30000);     // Both completed
      expect(report.plannedValue).toBe(30000);

      // Financial impacts
      // T-2 has 10 days delay: 10 * 1200 = 12000 prolongation, 10 * 2500 = 25000 penalty
      expect(report.totalProlongationCost).toBe(12000);
      expect(report.totalPenaltyCost).toBe(25000);
      // Cost variance: 30000 - 31500 = -1500
      expect(report.costVariance).toBe(-1500);
      expect(report.spi).toBe(1.0);
      expect(report.cpi).toBeCloseTo(30000 / 31500, 2);
    });
  });

  describe("3D Variance Buckets Partitioning", () => {
    it("should partition elements into ahead, onSchedule, delayed, and critical sets", () => {
      const tasks: ScheduleTask[] = [
        {
          id: "T-A",
          name: "Ahead Task",
          category: "IFCWALL",
          startDate: "2026-04-01",
          endDate: "2026-04-20",
          actualStartDate: "2026-04-01",
          actualEndDate: "2026-04-15",
          status: "Completed",
          elementIds: new Set([10, 11]),
          modelId: "model-1",
          unitCost: 100,
          quantity: 2,
        },
        {
          id: "T-B",
          name: "On Track Task",
          category: "IFCSLAB",
          startDate: "2026-04-21",
          endDate: "2026-04-30",
          actualStartDate: "2026-04-21",
          actualEndDate: "2026-04-30",
          status: "Completed",
          elementIds: new Set([20]),
          modelId: "model-1",
          unitCost: 100,
          quantity: 1,
        },
        {
          id: "T-C",
          name: "Critical Task",
          category: "IFCBEAM",
          startDate: "2026-05-01",
          endDate: "2026-05-10",
          actualStartDate: "2026-05-01",
          actualEndDate: "2026-05-25", // 15 days delay
          status: "Completed",
          elementIds: new Set([30, 31, 32]),
          modelId: "model-1",
          unitCost: 100,
          quantity: 3,
        },
      ];

      const buckets = engine.getVarianceBuckets(Date.parse("2026-06-01T00:00:00Z"), tasks);

      expect(buckets.counts.ahead).toBe(2);
      expect(buckets.ahead["model-1"].has(10)).toBe(true);
      expect(buckets.ahead["model-1"].has(11)).toBe(true);

      expect(buckets.counts.onSchedule).toBe(1);
      expect(buckets.onSchedule["model-1"].has(20)).toBe(true);

      expect(buckets.counts.critical).toBe(3);
      expect(buckets.critical["model-1"].has(30)).toBe(true);
      expect(buckets.critical["model-1"].has(31)).toBe(true);
      expect(buckets.critical["model-1"].has(32)).toBe(true);
    });
  });

  describe("Schedule CSV Export & Import with Variance / Actual Dates", () => {
    it("should export CSV including ActualStartDate, ActualEndDate, DelayDays, and CostImpact", () => {
      const sm = ScheduleManager.getInstance();
      sm.tasks.set("TASK-01", {
        id: "TASK-01",
        name: "Ground Foundation",
        category: "IFCFOOTING",
        startDate: "2026-06-01",
        endDate: "2026-06-20",
        actualStartDate: "2026-06-01",
        actualEndDate: "2026-06-25", // 5 days delay
        status: "Completed",
        elementIds: new Set([1001, 1002]),
        modelId: "mod-A",
        unitCost: 450,
        totalCost: 900,
        quantity: 2,
      });

      const csv = sm.exportScheduleTemplateCSV();
      expect(csv).toContain("ActualStartDate");
      expect(csv).toContain("ActualEndDate");
      expect(csv).toContain("DelayDays");
      expect(csv).toContain("CostImpact");

      const lines = csv.split("\n");
      expect(lines.length).toBe(2);
      // Header check
      expect(lines[0]).toBe("TaskID,TaskName,Category,StartDate,EndDate,ActualStartDate,ActualEndDate,Status,ModelID,ElementCount,UnitCost,TotalCost,DelayDays,CostImpact,ExpressIDs");

      // Row values check
      expect(lines[1]).toContain("2026-06-01,2026-06-20,2026-06-01,2026-06-25,Completed");
      // DelayDays = 5, CostImpact = 5 * 1200 = 6000.00
      expect(lines[1]).toContain(",5,6000.00,");
    });

    it("should import CSV with actual dates, compute delay impact, and update tasks and elementData", () => {
      const sm = ScheduleManager.getInstance();
      const csvInput = [
        "TaskID,TaskName,Category,StartDate,EndDate,ActualStartDate,ActualEndDate,Status,ModelID,ElementCount,UnitCost,TotalCost,DelayDays,CostImpact,ExpressIDs",
        'T-IMP1,"Piles & Pilecaps",IFCFOOTING,2026-07-01,2026-07-15,2026-07-01,2026-07-20,Completed,mod-B,1,1200.00,1200.00,0,0,"501;502"',
        'T-IMP2,"Basement Walls",IFCWALL,2026-07-16,2026-07-31,2026-07-16,2026-07-28,Completed,mod-B,1,800.00,800.00,0,0,"601"',
      ].join("\n");

      const count = sm.importScheduleFromCSV(csvInput);
      expect(count).toBe(2);

      const task1 = sm.tasks.get("T-IMP1");
      expect(task1).toBeDefined();
      expect(task1?.actualStartDate).toBe("2026-07-01");
      expect(task1?.actualEndDate).toBe("2026-07-20");
      // 5 days delay: 2026-07-20 - 2026-07-15
      expect(task1?.delayDays).toBe(5);
      expect(task1?.costImpact).toBe(6000); // 5 * $1,200

      const task2 = sm.tasks.get("T-IMP2");
      expect(task2).toBeDefined();
      expect(task2?.actualEndDate).toBe("2026-07-28");
      // 3 days early: 2026-07-28 vs 2026-07-31
      expect(task2?.delayDays).toBe(-3);
      expect(task2?.costImpact).toBe(0);

      // Verify elementData synchronization
      const elemData1 = sm.elementData.get("mod-B:501");
      expect(elemData1).toBeDefined();
      expect(elemData1?.actualEndDate).toBe("2026-07-20");
      expect(elemData1?.delayDays).toBe(5);
      expect(elemData1?.costImpact).toBe(6000);
    });
  });
});
