// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { ScheduleManager, type ScheduleTask } from "../ScheduleManager";
import { PropertySequenceEngine } from "../PropertySequenceEngine";
import { AppearanceProfileEngine } from "../AppearanceProfileEngine";
import { CostRateManager } from "../CostRateManager";
import { generateBOQSummary, type BOQLineItem } from "../BoqGenerator";
import { DelayImpactEngine } from "../DelayImpactEngine";
import { EvmDashboardModule } from "../EvmDashboardModule";
import { GisModule } from "../GisModule";
import { BcfIssueManager } from "../BcfIssueManager";
import { AccessControlManager, Permission } from "../AccessControlManager";

describe("Core Functional and Regression Tests", () => {
  let scheduleManager: ScheduleManager;
  let costRateManager: CostRateManager;
  let evmModule: EvmDashboardModule;
  let gisModule: GisModule;
  let bcfManager: BcfIssueManager;
  let acm: AccessControlManager;

  beforeEach(() => {
    document.body.innerHTML = "";
    scheduleManager = ScheduleManager.getInstance();
    scheduleManager.tasks.clear();
    costRateManager = CostRateManager.getInstance();
    costRateManager.setCurrency("USD");
    evmModule = EvmDashboardModule.getInstance();
    evmModule.setSimulatedDelayDays(0);
    gisModule = GisModule.getInstance();
    bcfManager = BcfIssueManager.getInstance();
    AccessControlManager.resetInstance();
    acm = AccessControlManager.getInstance();
  });

  describe("1. 4D Phasing & Construction Sequence Engine Regression", () => {
    it("should generate chronological 4D construction phases from property grouping", () => {
      const mockModel = {
        modelId: "m1",
        properties: {
          101: { type: "IFCFOOTING", Name: { value: "Footing 1" }, Phase: "Phase 1 - Substructure" },
          102: { type: "IFCCOLUMN", Name: { value: "Column L1" }, Phase: "Phase 2 - Core" },
          103: { type: "IFCWALL", Name: { value: "Wall L1" }, Phase: "Phase 2 - Core" },
        },
      };

      const engine = PropertySequenceEngine.getInstance();
      const result = engine.calculateSequence([mockModel], {
        propertyKey: "Phase",
        startDate: "2026-06-01",
        taskDurationDays: 14,
        overlapDays: 2,
        sortDirection: "asc",
      });

      expect(result.totalTasks).toBe(2);
      expect(result.tasks[0].name).toContain("Phase 1");
      expect(result.tasks[1].name).toContain("Phase 2");
      expect(result.tasks[0].startDate).toBe("2026-06-01");
      expect(result.tasks[0].elementCount).toBe(1);
    });

    it("should calculate CPM critical path, delays, and total float accurately", () => {
      const taskA: ScheduleTask = {
        id: "T_CRIT",
        name: "Main Core Concrete",
        startDate: "2026-07-01",
        endDate: "2026-07-20",
        actualStartDate: "2026-07-01",
        actualEndDate: "2026-07-25", // 5 days delay
        status: "In Progress",
        unitCost: 1000,
        totalCost: 100000,
        quantity: 100,
        modelId: "m1",
        isCritical: true,
        totalFloat: 0,
        category: "Concrete",
        elementIds: new Set([1, 2, 3]),
      };

      scheduleManager.tasks.set(taskA.id, taskA);
      const tasks = scheduleManager.getTasksSorted();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].isCritical).toBe(true);
      expect(tasks[0].totalFloat).toBe(0);

      const delayEngine = DelayImpactEngine.getInstance();
      const impact = delayEngine.computeTaskDelay(taskA);
      expect(impact.delayDays).toBe(5);
      expect(impact.status).toBe("Critical Delay");
      expect(impact.prolongationCost).toBeGreaterThan(0);
    });

    it("should evaluate AppearanceProfile dynamic growth states without error", () => {
      const engine = AppearanceProfileEngine.getInstance();
      const profiles = engine.getAllProfiles();
      expect(profiles.length).toBeGreaterThanOrEqual(4);

      const activeProfile = engine.getActiveProfile();
      expect(activeProfile).toBeDefined();

      const task: ScheduleTask = {
        id: "T1",
        name: "Slab Level 1",
        startDate: "2026-08-01",
        endDate: "2026-08-10",
        status: "In Progress",
        unitCost: 500,
        totalCost: 20000,
        quantity: 40,
        modelId: "m1",
        category: "Slab",
        elementIds: new Set([501]),
      };

      // Frame at mid-task
      const midDate = new Date("2026-08-05").getTime();
      const evalResult = engine.evaluateTimelineFrame(midDate, [task], new Map());
      expect(evalResult.elements.has("m1:501")).toBe(true);
      const elState = evalResult.elements.get("m1:501");
      expect(elState?.progress).toBeCloseTo(0.44, 1);
      expect(elState?.visible).toBe(true);
    });
  });

  describe("2. 5D Cost Estimating, Rates & BOQ Regression", () => {
    it("should manage unit rates and currency conversions", () => {
      costRateManager.updateRate("IFCWALL", 185);
      expect(costRateManager.getRate("IFCWALL").unitRate).toBe(185);

      // Multi-currency formatting
      costRateManager.setCurrency("EUR");
      expect(costRateManager.formatPrice(1000)).toContain("€");

      costRateManager.setCurrency("GBP");
      expect(costRateManager.formatPrice(1000)).toContain("£");

      costRateManager.setCurrency("INR");
      expect(costRateManager.formatPrice(1000)).toContain("₹");

      costRateManager.setCurrency("USD");
      expect(costRateManager.formatPrice(1000)).toContain("$");
    });

    it("should calculate Bills of Quantities (BOQ) summary with trade distribution", () => {
      const items: BOQLineItem[] = [
        {
          expressId: 101,
          modelId: "m1",
          category: "IFCSLAB",
          elementName: "Floor Slab",
          materialNumber: "MAT-C30",
          unit: "m³",
          quantity: 10,
          unitCost: 120,
          totalCost: 1200,
          propertySetName: "Qto_SlabBaseQuantities",
          quantityType: "NetVolume",
        },
        {
          expressId: 201,
          modelId: "m1",
          category: "IFCWALL",
          elementName: "Shear Wall",
          materialNumber: "MAT-C40",
          unit: "m²",
          quantity: 50,
          unitCost: 80,
          totalCost: 4000,
          propertySetName: "Qto_WallBaseQuantities",
          quantityType: "NetSideArea",
        },
      ];

      const boq = generateBOQSummary(items);
      expect(boq).toBeDefined();
      expect(boq.totalElements).toBe(2);
      expect(boq.totalCost).toBe(5200);
      expect(boq.categorySummary.size).toBe(2);
    });
  });

  describe("3. Earned Value Management (EVM) Core Regression", () => {
    it("should compute all PMBOK EVM indices and variances", () => {
      const task1: ScheduleTask = {
        id: "T_EVM_1",
        name: "Piling Foundations",
        startDate: "2026-05-01",
        endDate: "2026-05-15",
        actualStartDate: "2026-05-01",
        actualEndDate: "2026-05-15",
        status: "Completed",
        unitCost: 1000,
        totalCost: 100000,
        actualCost: 95000,
        quantity: 100,
        modelId: "m1",
        isCritical: true,
        totalFloat: 0,
        category: "Piling",
        elementIds: new Set([10, 11]),
      };

      const task2: ScheduleTask = {
        id: "T_EVM_2",
        name: "Basement Walls",
        startDate: "2026-05-16",
        endDate: "2026-05-31",
        actualStartDate: "2026-05-16",
        actualEndDate: "2026-06-05", // 5 days delay
        status: "In Progress",
        unitCost: 2000,
        totalCost: 200000,
        actualCost: 210000,
        quantity: 100,
        modelId: "m1",
        isCritical: true,
        totalFloat: 0,
        category: "Walls",
        elementIds: new Set([20, 21]),
      };

      scheduleManager.tasks.set(task1.id, task1);
      scheduleManager.tasks.set(task2.id, task2);

      const simMs = new Date("2026-05-25").getTime();
      const metrics = evmModule.computeEvmMetrics(simMs);

      // BAC = 100k + 200k = 300k
      expect(metrics.bac).toBe(300000);
      expect(metrics.pv).toBeGreaterThan(0);
      expect(metrics.ev).toBeGreaterThan(0);
      expect(metrics.ac).toBe(305000);

      // SV and CV
      expect(metrics.sv).toBe(metrics.ev - metrics.pv);
      expect(metrics.cv).toBe(metrics.ev - metrics.ac);

      // Indices
      expect(metrics.spi).toBeGreaterThan(0);
      expect(metrics.cpi).toBeGreaterThan(0);
      expect(metrics.eac).toBeGreaterThan(0);
      expect(metrics.tcpi).toBeGreaterThan(0);

      // S-Curve generation
      const scurve = evmModule.generateSCurveSeries(12, simMs);
      expect(scurve.points).toHaveLength(12);
      expect(scurve.maxCost).toBeGreaterThanOrEqual(300000);
    });

    it("should export EVM audit ledger to CSV without throwing", () => {
      globalThis.URL.createObjectURL = vi.fn(() => "blob:mock-url");
      globalThis.URL.revokeObjectURL = vi.fn();

      expect(() => {
        evmModule.exportEvmAuditCsv();
      }).not.toThrow();
    });
  });

  describe("4. GeoBIM GIS & Site Georeferencing Regression", () => {
    it("should compute accurate UTM zone, DMS formatting, and true north orientation", () => {
      gisModule.setGeoreference({
        latitude: 35.6762,
        longitude: 139.6503,
        elevation: 45.5,
        trueNorthRotation: 7.2,
      });

      const dms = gisModule.formatDMS(35.6762, 139.6503);
      expect(dms.latDms).toContain("35°");
      expect(dms.lonDms).toContain("139°");

      const utm = gisModule.getUtmZone(35.6762, 139.6503);
      expect(utm).toBe("Zone 54N");

      const geo = gisModule.getGeoreference();
      expect(geo.elevation).toBe(45.5);
      expect(geo.trueNorthRotation).toBe(7.2);
    });

    it("should configure 3D basemap settings correctly", () => {
      const initialCfg = gisModule.getBasemapConfig();
      expect(initialCfg).toBeDefined();

      gisModule.setBasemapConfig({
        provider: "satellite",
        radius: 2500,
        opacity: 0.85,
      });

      const updated = gisModule.getBasemapConfig();
      expect(updated.provider).toBe("satellite");
      expect(updated.radius).toBe(2500);
      expect(updated.opacity).toBe(0.85);
    });
  });

  describe("5. BCF Issue Management Regression", () => {
    it("should manage BCF issue topics and viewpoints", () => {
      const initialCount = bcfManager.getTopics().length;
      const topic = bcfManager.createIssue(
        "HVAC Duct Clashing with Structural Column 204",
        "Hard collision detected between 400x300 supply duct and flange of HEB 300.",
        "Critical",
        "David Chen"
      );

      expect(topic).toBeDefined();
      expect(topic.title).toContain("HVAC Duct Clashing");
      expect(topic.priority).toBe("Critical");
      expect(topic.assignedTo).toBe("David Chen");
      expect(bcfManager.getTopics().length).toBe(initialCount + 1);
    });
  });

  describe("6. Clash Detection & Tolerance Regression", () => {
    it("should detect geometric collisions between distinct element sets", () => {
      // Box 1: [0, 0, 0] to [2, 2, 2]
      const box1 = new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 2, 2));
      // Box 2: [1, 1, 1] to [3, 3, 3] (Intersects Box 1)
      const box2 = new THREE.Box3(new THREE.Vector3(1, 1, 1), new THREE.Vector3(3, 3, 3));
      // Box 3: [10, 10, 10] to [12, 12, 12] (No collision)
      const box3 = new THREE.Box3(new THREE.Vector3(10, 10, 10), new THREE.Vector3(12, 12, 12));

      expect(box1.intersectsBox(box2)).toBe(true);
      expect(box1.intersectsBox(box3)).toBe(false);
    });
  });

  describe("7. Multi-Tenancy & RBAC Integration with Core Modules", () => {
    it("should enforce authorization guards when executing core module actions", () => {
      const viewerUser = {
        id: "u_viewer",
        name: "Observer",
        email: "obs@site.com",
        tenantId: "tenant-snowdon-global",
        role: "Viewer" as const,
      };

      // Viewer cannot edit cost rates
      expect(() => {
        acm.executeWithGuard(
          Permission.EDIT_COST_RATES_5D,
          () => {
            costRateManager.updateRate("IFCWALL", 999);
          },
          "CostRates",
          viewerUser
        );
      }).toThrow();

      // Cost rate was NOT mutated
      expect(costRateManager.getRate("IFCWALL").unitRate).not.toBe(999);

      // BIMManager can edit cost rates
      const managerUser = {
        id: "u_mgr",
        name: "Manager",
        email: "mgr@site.com",
        tenantId: "tenant-snowdon-global",
        role: "BIMManager" as const,
      };

      expect(() => {
        acm.executeWithGuard(
          Permission.EDIT_COST_RATES_5D,
          () => {
            costRateManager.updateRate("IFCWALL", 175);
          },
          "CostRates",
          managerUser
        );
      }).not.toThrow();

      expect(costRateManager.getRate("IFCWALL").unitRate).toBe(175);
    });
  });
});
