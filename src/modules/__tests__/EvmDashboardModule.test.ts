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

  it("should calculate all 4 standard EAC forecasting formulas per PMI & DOE EVMS", () => {
    const bac = 200000;
    const ev = 80000;
    const ac = 100000;
    const cpi = 0.8; // ev / ac
    const spi = 0.75;

    const forecasts = evmModule.computeEacForecasts(bac, ev, ac, cpi, spi);
    expect(forecasts).toBeDefined();

    // 1. Typical: BAC / CPI = 200000 / 0.8 = 250000
    expect(forecasts.typical.eacValue).toBe(250000);
    expect(forecasts.typical.vacValue).toBe(-50000);

    // 2. Atypical: AC + (BAC - EV) = 100000 + 120000 = 220000
    expect(forecasts.atypical.eacValue).toBe(220000);
    expect(forecasts.atypical.vacValue).toBe(-20000);

    // 3. Composite: AC + (BAC - EV) / (CPI * SPI) = 100000 + 120000 / (0.8 * 0.75 = 0.6) = 100000 + 200000 = 300000
    expect(forecasts.composite.eacValue).toBe(300000);
    expect(forecasts.composite.vacValue).toBe(-100000);

    // 4. Weighted: AC + (BAC - EV) / (0.8 * 0.8 + 0.2 * 0.75 = 0.64 + 0.15 = 0.79) = 100000 + 120000 / 0.79 = 251899
    expect(forecasts.weighted.eacValue).toBeGreaterThan(250000);
    expect(forecasts.weighted.vacValue).toBeLessThan(0);
  });

  it("should evaluate ANSI/EIA 748-B variance thresholds (Tier 1 and Tier 2)", () => {
    // Normal case: minimal variance
    const normal = evmModule.evaluateAnsi748Thresholds(100000, 50000, 51000, 50500, 1000, 500, 1.02, 1.01);
    expect(normal.status).toBe("NORMAL");
    expect(normal.varRequired).toBe(false);

    // Tier 1 breach: ±30% and ±$10k
    // CV = -$12,000 on EV of $30,000 -> 40% breach
    const tier1 = evmModule.evaluateAnsi748Thresholds(100000, 40000, 30000, 42000, -10000, -12000, 0.75, 0.71);
    expect(tier1.tier1Breach).toBe(true);
    expect(tier1.varRequired).toBe(true);

    // Tier 2 breach: ±10% and ±$25k
    // CV = -$30,000 on EV of $200,000 -> 15% breach
    const tier2 = evmModule.evaluateAnsi748Thresholds(500000, 220000, 200000, 230000, -20000, -30000, 0.91, 0.87);
    expect(tier2.tier2Breach).toBe(true);
    expect(tier2.status).toBe("VAR_TIER_2");
    expect(tier2.varRequired).toBe(true);
  });

  it("should compute Earned Schedule (ES) time-based metrics per Lipke & PMI Box 3-1", () => {
    const task1: ScheduleTask = {
      id: "T1",
      name: "Phase 1 Foundation",
      startDate: "2026-01-01",
      endDate: "2026-01-31",
      totalCost: 100000,
      status: "In Progress",
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Civil",
      elementIds: new Set([1]),
    };
    const task2: ScheduleTask = {
      id: "T2",
      name: "Phase 2 Structure",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
      totalCost: 100000,
      status: "Planned",
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Structure",
      elementIds: new Set([2]),
    };

    const tasks = [task1, task2];
    const minMs = new Date("2026-01-01").getTime();
    const maxMs = new Date("2026-02-28").getTime();
    // Simulate at mid-February (say day 40)
    const simMs = minMs + 40 * 86400000;
    // But EV is only $50k (which corresponds to day 15)
    const esMetrics = evmModule.computeEarnedSchedule(tasks, simMs, 50000, 200000, minMs, maxMs);

    expect(esMetrics.plannedDurationDays).toBeGreaterThan(50);
    expect(esMetrics.actualTimeDays).toBe(40);
    expect(esMetrics.earnedScheduleDays).toBeLessThan(40); // Behind schedule in time units!
    expect(esMetrics.scheduleVarianceTimeDays).toBeLessThan(0); // SV(t) < 0
    expect(esMetrics.schedulePerformanceIndexTime).toBeLessThan(1.0); // SPI(t) < 1.0
    expect(esMetrics.estimatedDurationAtCompletionDays).toBeGreaterThan(esMetrics.plannedDurationDays);
  });

  it("should classify APM Bulls-Eye Quadrants and tolerance rings correctly", () => {
    // Q1: Ahead and Under Budget (SPI >= 1.0, CPI >= 1.0)
    const q1 = evmModule.computeApmBullsEye(1.05, 1.08);
    expect(q1.quadrant).toBe("Q1");
    expect(q1.toleranceZone).toBe("Inner Ring (±10%)");

    // Q2: Behind and Under Budget (SPI < 1.0, CPI >= 1.0)
    const q2 = evmModule.computeApmBullsEye(0.90, 1.10);
    expect(q2.quadrant).toBe("Q2");
    expect(q2.toleranceZone).toBe("Outer Ring (±20%)");

    // Q3: Behind and Over Budget (SPI < 1.0, CPI < 1.0)
    const q3 = evmModule.computeApmBullsEye(0.70, 0.65);
    expect(q3.quadrant).toBe("Q3");
    expect(q3.toleranceZone).toBe("Critical Variance (>20%)");

    // Q4: Ahead and Over Budget (SPI >= 1.0, CPI < 1.0)
    const q4 = evmModule.computeApmBullsEye(1.10, 0.92);
    expect(q4.quadrant).toBe("Q4");
  });

  it("should export CPR Format 1 (WBS Ledger CSV) and CPR Format 5 (VAR Report)", () => {
    const task: ScheduleTask = {
      id: "WBS-101",
      name: "Superstructure Concrete Columns",
      startDate: "2026-03-01",
      endDate: "2026-03-20",
      totalCost: 150000,
      actualCost: 165000,
      status: "In Progress",
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Concrete",
      elementIds: new Set([801]),
    };
    scheduleManager.tasks.set(task.id, task);

    // Mock createObjectURL
    const createObjectURL = vi.fn(() => "blob:cpr-url");
    globalThis.URL.createObjectURL = createObjectURL;
    globalThis.URL.revokeObjectURL = vi.fn();

    // CPR Format 1 CSV
    expect(() => {
      evmModule.exportCprFormat1Csv(new Date("2026-03-10").getTime());
    }).not.toThrow();
    expect(createObjectURL).toHaveBeenCalled();

    // CPR Format 5 VAR Report Text
    const varText = evmModule.generateCprFormat5Report(new Date("2026-03-10").getTime());
    expect(varText).toContain("CONTRACT PERFORMANCE REPORT (CPR) FORMAT 5");
    expect(varText).toContain("ANSI/EIA 748-B");
    expect(varText).toContain("EARNED SCHEDULE (ES) TIME-BASED METRICS");
    expect(varText).toContain("CORRECTIVE ACTION PLAN (CAP)");

    // CPR Format 5 Interactive Modal
    expect(() => {
      evmModule.openCprFormat5Modal(new Date("2026-03-10").getTime());
    }).not.toThrow();

    const modal = document.getElementById("cpr-format5-modal");
    expect(modal).not.toBeNull();
    expect(modal?.textContent).toContain("CPR Format 5");
    modal?.remove();
  });

  it("should switch chart view mode between S-Curve and APM Bulls-Eye", () => {
    const task: ScheduleTask = {
      id: "T-SW",
      name: "Roof Trusses",
      startDate: "2026-07-01",
      endDate: "2026-07-15",
      totalCost: 80000,
      status: "In Progress",
      quantity: 1,
      modelId: "m1",
      isCritical: true,
      totalFloat: 0,
      category: "Roofing",
      elementIds: new Set([99]),
    };
    scheduleManager.tasks.set(task.id, task);

    expect(evmModule.getChartViewMode()).toBe("scurve");
    evmModule.setChartViewMode("bullseye");
    expect(evmModule.getChartViewMode()).toBe("bullseye");

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
        <div id="evm-tcpi-bac-pill"></div>
        <div id="evm-tcpi-eac-pill"></div>
        <div id="evm-val-progress"></div>
        <div id="evm-val-es-svt"></div>
        <div id="evm-val-es-spit"></div>
        <div id="evm-val-es-eact"></div>
        <div id="evm-val-es-target-finish"></div>
        <div id="evm-val-slippage"></div>
        <div id="evm-val-prolongation"></div>
        <div id="evm-val-penalties"></div>
        <div id="evm-val-total-impact"></div>
        <div id="evm-var-alert-banner">
          <div id="evm-var-banner-title"></div>
          <div id="evm-var-banner-desc"></div>
        </div>
        <div id="evm-chart-viewport"></div>
        <div id="evm-delayed-tasks-container"></div>
      </div>
    `;

    evmModule.render();

    // In bullseye mode, SVG should contain Bulls-Eye matrix labels
    const viewport = document.getElementById("evm-chart-viewport");
    expect(viewport?.innerHTML).toContain("APM Bulls-Eye Quadrant Matrix");
    expect(viewport?.innerHTML).toContain("Q1: Ahead &amp; Under Budget");

    // Switch back to scurve
    evmModule.setChartViewMode("scurve");
    evmModule.render();
    expect(viewport?.innerHTML).toContain("EVM Cumulative S-Curve");
  });
});
