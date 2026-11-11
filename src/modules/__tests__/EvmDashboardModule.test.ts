// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EvmDashboardModule } from "../EvmDashboardModule";
import { ScheduleManager, type ScheduleTask } from "../ScheduleManager";

describe("EvmDashboardModule Unit Tests", () => {
  let evmModule: EvmDashboardModule;
  let scheduleManager: ScheduleManager;

  beforeEach(() => {
    scheduleManager = ScheduleManager.getInstance();
    scheduleManager.tasks.clear();
    evmModule = EvmDashboardModule.getInstance();
    evmModule.setSimulatedDelayDays(0);
    document.body.innerHTML = "";
  });

  it("should be a singleton instance", () => {
    const inst1 = EvmDashboardModule.getInstance();
    const inst2 = EvmDashboardModule.getInstance();
    expect(inst1).toBe(inst2);
    expect(inst1.getSimulatedDelayDays()).toBe(0);
  });

  it("should compute default EVM metrics when schedule is empty", () => {
    const metrics = evmModule.computeEvmMetrics(Date.now());
    expect(metrics).toBeDefined();
    expect(metrics.bac).toBe(0);
    expect(metrics.pv).toBe(0);
    expect(metrics.ev).toBe(0);
    expect(metrics.ac).toBe(0);
    expect(metrics.sv).toBe(0);
    expect(metrics.cv).toBe(0);
    expect(metrics.spi).toBe(1.0);
    expect(metrics.cpi).toBe(1.0);
    expect(metrics.progressPercent).toBe(0);
    expect(metrics.taskImpacts).toHaveLength(0);
  });

  it("should compute accurate PMBOK EVM metrics with active schedule tasks", () => {
    const task1: ScheduleTask = {
      id: "T1",
      name: "Substructure Concrete",
      startDate: "2026-06-01",
      endDate: "2026-06-10",
      actualStartDate: "2026-06-01",
      actualEndDate: "2026-06-12", // 2 days delay
      status: "Completed",
      unitCost: 50000,
      totalCost: 50000,
      actualCost: 55000,
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Concrete",
      elementIds: new Set([101, 102]),
    };

    const task2: ScheduleTask = {
      id: "T2",
      name: "Superstructure Steel Framing",
      startDate: "2026-06-11",
      endDate: "2026-06-25",
      actualStartDate: "2026-06-15", // 4 days delay
      status: "In Progress",
      unitCost: 100000,
      totalCost: 100000,
      actualCost: 90000,
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Steel",
      elementIds: new Set([201, 202]),
    };

    scheduleManager.tasks.set(task1.id, task1);
    scheduleManager.tasks.set(task2.id, task2);

    // Compute metrics at simulation date after both tasks start
    const simDate = new Date("2026-06-20").getTime();
    const metrics = evmModule.computeEvmMetrics(simDate);

    expect(metrics.bac).toBe(150000);
    expect(metrics.pv).toBeGreaterThan(0);
    expect(metrics.ev).toBeGreaterThan(0);
    expect(metrics.ac).toBe(145000);
    expect(metrics.spi).toBeGreaterThan(0);
    expect(metrics.cpi).toBeGreaterThan(0);
    expect(metrics.taskImpacts).toHaveLength(2);
  });

  it("should support What-If delay sensitivity simulation", () => {
    const task1: ScheduleTask = {
      id: "T1",
      name: "Critical Foundation Piles",
      startDate: "2026-01-01",
      endDate: "2026-01-10",
      status: "Planned",
      unitCost: 40000,
      totalCost: 40000,
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Piling",
      elementIds: new Set([301]),
    };
    scheduleManager.tasks.set(task1.id, task1);

    const baseMetrics = evmModule.computeEvmMetrics(new Date("2026-01-05").getTime());
    expect(baseMetrics.projectSlippageDays).toBe(0);

    // Apply +15 days simulated delay to critical tasks
    evmModule.setSimulatedDelayDays(15);
    expect(evmModule.getSimulatedDelayDays()).toBe(15);

    const delayedMetrics = evmModule.computeEvmMetrics(new Date("2026-01-05").getTime());
    expect(delayedMetrics.projectSlippageDays).toBeGreaterThanOrEqual(15);
    expect(delayedMetrics.totalCostImpact).toBeGreaterThan(baseMetrics.totalCostImpact);

    // Reset back to 0
    evmModule.setSimulatedDelayDays(0);
    expect(evmModule.getSimulatedDelayDays()).toBe(0);
  });

  it("should generate multi-line S-Curve data points across project lifecycle", () => {
    const task1: ScheduleTask = {
      id: "T1",
      name: "Phase 1 Excavation",
      startDate: "2026-01-01",
      endDate: "2026-01-15",
      status: "Completed",
      unitCost: 20000,
      totalCost: 20000,
      quantity: 1,
      modelId: "m1",
      isCritical: false,
      totalFloat: 5,
      category: "Excavation",
      elementIds: new Set([401]),
    };
    const task2: ScheduleTask = {
      id: "T2",
      name: "Phase 2 Structure",
      startDate: "2026-01-16",
      endDate: "2026-02-15",
      status: "Planned",
      unitCost: 80000,
      totalCost: 80000,
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Structure",
      elementIds: new Set([501]),
    };
    scheduleManager.tasks.set(task1.id, task1);
    scheduleManager.tasks.set(task2.id, task2);

    const { points, maxCost, minDateMs, maxDateMs } = evmModule.generateSCurveSeries(10);
    expect(points).toHaveLength(10);
    expect(maxCost).toBeGreaterThanOrEqual(100000);
    expect(minDateMs).toBe(new Date("2026-01-01").getTime());
    expect(maxDateMs).toBe(new Date("2026-02-15").getTime());

    // PV should be monotonically non-decreasing
    for (let i = 1; i < points.length; i++) {
      expect(points[i].pv).toBeGreaterThanOrEqual(points[i - 1].pv);
    }
  });

  it("should render EVM KPIs, S-Curve SVG, and critical delayed tasks into DOM", () => {
    // Setup mock DOM elements matching #evm-panel
    document.body.innerHTML = `
      <div id="evm-panel">
        <div id="evm-status-badge"></div>
        <div id="evm-val-bac"></div>
        <div id="evm-val-pv"></div>
        <div id="evm-val-ev"></div>
        <div id="evm-val-ac"></div>
        <div id="evm-val-sv"></div>
        <div id="evm-val-cv"></div>
        <div id="evm-val-spi"></div>
        <div id="evm-val-cpi"></div>
        <div id="evm-val-eac"></div>
        <div id="evm-val-vac"></div>
        <div id="evm-val-tcpi"></div>
        <div id="evm-val-progress"></div>
        <div id="evm-val-slippage"></div>
        <div id="evm-val-prolongation"></div>
        <div id="evm-val-penalties"></div>
        <div id="evm-val-total-impact"></div>
        <div id="evm-scurve-chart-container"></div>
        <div id="evm-delayed-tasks-container"></div>
      </div>
    `;

    const task: ScheduleTask = {
      id: "T1",
      name: "Deep Foundations",
      startDate: "2026-04-01",
      endDate: "2026-04-20",
      actualStartDate: "2026-04-01",
      actualEndDate: "2026-04-30", // 10 days delay
      status: "In Progress",
      unitCost: 120000,
      totalCost: 120000,
      actualCost: 135000,
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Substructure",
      elementIds: new Set([601]),
    };
    scheduleManager.tasks.set(task.id, task);

    evmModule.render(new Date("2026-04-25").getTime());

    expect(document.getElementById("evm-val-bac")?.textContent).toContain("120,000");
    expect(document.getElementById("evm-val-ac")?.textContent).toContain("135,000");
    expect(document.getElementById("evm-val-spi")?.textContent).toBeDefined();
    expect(document.getElementById("evm-val-cpi")?.textContent).toBeDefined();
    expect(document.getElementById("evm-status-badge")?.textContent).toContain("SPI");

    // S-Curve SVG container should contain an svg element
    const svg = document.querySelector("#evm-scurve-chart-container svg");
    expect(svg).not.toBeNull();

    // Critical delayed task container should display the delayed foundation task
    const delayedContainer = document.getElementById("evm-delayed-tasks-container");
    expect(delayedContainer?.innerHTML).toContain("Deep Foundations");
  });

  it("should export EVM audit ledger to CSV", () => {
    const task: ScheduleTask = {
      id: "T1",
      name: "Basement Excavation",
      startDate: "2026-05-01",
      endDate: "2026-05-10",
      status: "Completed",
      unitCost: 50000,
      totalCost: 50000,
      actualCost: 52000,
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Earthworks",
      elementIds: new Set([701]),
    };
    scheduleManager.tasks.set(task.id, task);

    // Mock URL and Blob methods
    const createObjectURL = vi.fn(() => "blob:mock-url");
    const revokeObjectURL = vi.fn();
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = revokeObjectURL;

    expect(() => {
      evmModule.exportEvmAuditCsv(new Date("2026-05-05").getTime());
    }).not.toThrow();

    expect(createObjectURL).toHaveBeenCalled();
  });
});
