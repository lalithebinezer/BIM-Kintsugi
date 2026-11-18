// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { solveCpmGraph, rollupWbsHierarchy, type CpmInputTask } from "../CpmGraphSolver";
import {
  evaluateRuleConditions,
  importNavisworksSearchSetsXml,
  RuleSearchEngine,
  type SearchableElement,
} from "../RuleSearchEngine";
import { ScheduleImportParsers } from "../ScheduleImportParsers";
import { ScheduleManager } from "../ScheduleManager";
import { InteractiveGanttDrawer } from "../../ui/InteractiveGanttDrawer";

describe("Phase 1: CpmGraphSolver, RuleSearchEngine & Hierarchical Gantt", () => {
  describe("CpmGraphSolver DAG & WBS Rollups", () => {
    it("computes exact Early/Late dates, Total Float, Free Float, and Critical Path across branching DAGs", () => {
      // Branch A (critical): A(4d) -> C(6d) => total 10d
      // Branch B (non-critical): B(2d) -> C(6d) => ES=0, EF=2, LS=2, LF=4 => TotalFloat=2, FreeFloat=2
      const tasks: CpmInputTask[] = [
        { id: "A", startDate: "2026-07-01", endDate: "2026-07-05", durationDays: 4 },
        { id: "B", startDate: "2026-07-01", endDate: "2026-07-03", durationDays: 2 },
        {
          id: "C",
          startDate: "2026-07-05",
          endDate: "2026-07-11",
          durationDays: 6,
          predecessors: [
            { predecessorId: "A", type: "FS", lagDays: 0 },
            { predecessorId: "B", type: "FS", lagDays: 0 },
          ],
        },
      ];

      const report = solveCpmGraph(tasks);
      expect(report.hasCycles).toBe(false);
      expect(report.criticalPathIds).toEqual(["A", "C"]);
      expect(report.results.get("A")?.totalFloatDays).toBe(0);
      expect(report.results.get("A")?.freeFloatDays).toBe(0);
      expect(report.results.get("B")?.totalFloatDays).toBe(2);
      expect(report.results.get("B")?.freeFloatDays).toBe(2);
      expect(report.results.get("C")?.earlyStart).toBe("2026-07-05");
      expect(report.results.get("C")?.earlyFinish).toBe("2026-07-11");
    });

    it("supports SS + lag relationships and flags Out-of-Sequence tasks", () => {
      const tasks: CpmInputTask[] = [
        { id: "T1", startDate: "2026-07-01", endDate: "2026-07-06", durationDays: 5, status: "In Progress" },
        {
          id: "T2",
          startDate: "2026-07-01",
          endDate: "2026-07-05",
          durationDays: 4,
          predecessors: [{ predecessorId: "T1", type: "SS", lagDays: 2 }],
        },
        {
          id: "T3",
          startDate: "2026-07-06",
          endDate: "2026-07-08",
          durationDays: 2,
          status: "In Progress", // Started while predecessor T1 is only In Progress!
          predecessors: [{ predecessorId: "T1", type: "FS", lagDays: 0 }],
        },
      ];

      const report = solveCpmGraph(tasks);
      expect(report.results.get("T2")?.earlyStart).toBe("2026-07-03");
      expect(report.results.get("T3")?.outOfSequence).toBe(true);
      expect(report.outOfSequenceIds).toContain("T3");
    });

    it("detects circular dependencies safely without crashing", () => {
      const tasks: CpmInputTask[] = [
        {
          id: "X",
          startDate: "2026-07-01",
          endDate: "2026-07-03",
          predecessors: [{ predecessorId: "Y", type: "FS" }],
        },
        {
          id: "Y",
          startDate: "2026-07-03",
          endDate: "2026-07-05",
          predecessors: [{ predecessorId: "X", type: "FS" }],
        },
      ];
      const report = solveCpmGraph(tasks);
      expect(report.hasCycles).toBe(true);
      expect(report.cycleTaskIds).toHaveLength(2);
    });

    it("rolls up WBS hierarchy dates, total cost, and composite status bottom-up", () => {
      const items: CpmInputTask[] = [
        { id: "wbs-root", startDate: "2026-07-10", endDate: "2026-07-10", status: "Planned", totalCost: 0 },
        { id: "t-1", parentId: "wbs-root", startDate: "2026-07-01", endDate: "2026-07-05", status: "Completed", totalCost: 12000 },
        { id: "t-2", parentId: "wbs-root", startDate: "2026-07-04", endDate: "2026-07-15", status: "Planned", totalCost: 8000 },
      ];
      rollupWbsHierarchy(items);
      expect(items[0].isSummary).toBe(true);
      expect(items[0].startDate).toBe("2026-07-01");
      expect(items[0].endDate).toBe("2026-07-15");
      expect(items[0].totalCost).toBe(20000);
      expect(items[0].status).toBe("In Progress");
    });
  });

  describe("RuleSearchEngine & Navisworks XML Importer", () => {
    const sampleElements: SearchableElement[] = [
      { modelId: "m1", expressId: 101, category: "IFCWALL", name: "Exterior Shear Wall", storey: "Level 1", material: "Concrete C30", psets: { Pset_WallCommon: { LoadBearing: "True", ThermalTransmittance: 0.28 } } },
      { modelId: "m1", expressId: 102, category: "IFCWALL", name: "Interior Partition", storey: "Level 1", material: "Gypsum", psets: { Pset_WallCommon: { LoadBearing: "False", ThermalTransmittance: 1.5 } } },
      { modelId: "m1", expressId: 201, category: "IFCCOLUMN", name: "RC Column C1", storey: "Level 2", material: "Concrete C40" },
    ];

    it("evaluates boolean AND / OR / NEWSET rules across category, material, and pset properties", () => {
      const res = evaluateRuleConditions(sampleElements, [
        { field: "category", operator: "equals", value: "IFCWALL", logic: "NEWSET" },
        { field: "pset", propertyPath: "Pset_WallCommon.LoadBearing", operator: "equals", value: "True", logic: "AND" },
        { field: "category", operator: "equals", value: "IFCCOLUMN", logic: "NEWSET" },
      ]);
      expect(res.matchedCount).toBe(2);
      expect(Array.from(res.modelIdMap["m1"] || [])).toEqual([101, 201]);
    });

    it("imports Navisworks SelectionSets XML respecting bitwise negate/OR flags", () => {
      const xml = `
        <selectionsets>
          <selectionset name="L1 Concrete Not Partition">
            <findspec mode="all">
              <conditions>
                <condition test="contains" flags="0">
                  <category><name internal="LcOaNode">Item</name></category>
                  <property><name internal="LcOaNodeMaterial">Material</name></property>
                  <value><data type="wstring">Concrete</data></value>
                </condition>
                <condition test="contains" flags="32">
                  <property><name internal="LcOaSceneBaseUserName">Name</name></property>
                  <value><data type="wstring">Partition</data></value>
                </condition>
              </conditions>
            </findspec>
          </selectionset>
        </selectionsets>`;

      const defs = importNavisworksSearchSetsXml(xml);
      expect(defs).toHaveLength(1);
      expect(defs[0].conditions).toHaveLength(2);
      expect(defs[0].conditions[1].negate).toBe(true);

      const res = evaluateRuleConditions(sampleElements, defs[0].conditions);
      expect(res.matchedCount).toBe(2); // 101 and 201
    });

    it("persists rule definitions in RuleSearchEngine", () => {
      const engine = RuleSearchEngine.getInstance();
      engine.upsertRule({
        id: "r-test",
        name: "Test Rule",
        conditions: [{ field: "category", operator: "equals", value: "IFCCOLUMN", logic: "NEWSET" }],
        updatedAt: new Date().toISOString(),
      });
      expect(engine.getRule("r-test")?.name).toBe("Test Rule");
      expect(engine.deleteRule("r-test")).toBe(true);
    });
  });

  describe("ScheduleImportParsers IFC4 & MSPDI Predecessor Retention", () => {
    it("parses native IFC4 IFCWORKSCHEDULE, IFCTASK, IFCTASKTIME, IFCRELSEQUENCE & IFCRELASSIGNSTOPROCESS", () => {
      const ifcStep = `
        #10=IFCWORKSCHEDULE('guid-ws',$,'Foundation Schedule',$,$,$,$,$,$,$,$);
        #20=IFCTASKTIME('TT1',$,$,'P4D','2026-08-01T08:00:00','2026-08-05T17:00:00',$,$,$,$,'P0D','P0D',.T.,$,$,$,$,$,$);
        #21=IFCTASKTIME('TT2',$,$,'P3D','2026-08-05T08:00:00','2026-08-08T17:00:00',$,$,$,$,$,$,.F.,$,$,$,$,$,$);
        #30=IFCTASK('t-1',$,'Pour Footings',$,$,'1.1',$,'COMPLETED',$,.F.,50,#20,$);
        #31=IFCTASK('t-2',$,'Erect Columns',$,$,'1.2',$,'NOTSTARTED',$,.F.,50,#21,$);
        #40=IFCRELSEQUENCE('seq-1',$,$,$,#30,#31,'P1D',.FINISH_START.,$);
        #50=IFCRELASSIGNSTOPROCESS('rel-1',$,$,$,(#101,#102),$,#30,$);
      `;
      const parsed = ScheduleImportParsers.parseIfcWorkSchedule(ifcStep, "m-struct");
      expect(parsed.format).toBe("IFC4_WORKSCHEDULE");
      expect(parsed.projectName).toBe("Foundation Schedule");
      expect(parsed.tasks).toHaveLength(2);
      const t1 = parsed.tasks.find((t) => t.wbsCode === "1.1")!;
      const t2 = parsed.tasks.find((t) => t.wbsCode === "1.2")!;
      expect(t1.elementIds.has(101)).toBe(true);
      expect(t1.elementIds.has(102)).toBe(true);
      expect(t2.predecessors?.[0]).toEqual({
        predecessorId: t1.id,
        type: "FS",
        lagDays: 1,
      });
      // With 1d lag after 2026-08-05 finish -> ES = 2026-08-06
      expect(t2.earlyStart).toBe("2026-08-06");
    });

    it("retains MSPDI <PredecessorLink> and <OutlineLevel> WBS parent links", () => {
      const mspXml = `
        <Project>
          <Title>Tower Phase 1</Title>
          <Tasks>
            <Task><UID>1</UID><Name>Superstructure</Name><OutlineLevel>1</OutlineLevel><Summary>1</Summary><Start>2026-09-01T08:00:00</Start><Finish>2026-09-02T17:00:00</Finish><WBS>1</WBS></Task>
            <Task><UID>2</UID><Name>Columns</Name><OutlineLevel>2</OutlineLevel><Start>2026-09-01T08:00:00</Start><Finish>2026-09-05T17:00:00</Finish><WBS>1.1</WBS><Cost>5000</Cost></Task>
            <Task><UID>3</UID><Name>Slabs</Name><OutlineLevel>2</OutlineLevel><Start>2026-09-05T08:00:00</Start><Finish>2026-09-12T17:00:00</Finish><WBS>1.2</WBS><Cost>7000</Cost>
              <PredecessorLink><PredecessorUID>2</PredecessorUID><Type>1</Type><LinkLag>0</LinkLag></PredecessorLink>
            </Task>
          </Tasks>
        </Project>`;
      const parsed = ScheduleImportParsers.parseMSPDI(mspXml);
      expect(parsed.tasks).toHaveLength(3);
      expect(parsed.tasks[0].isSummary).toBe(true);
      expect(parsed.tasks[0].endDate).toBe("2026-09-12");
      expect(parsed.tasks[1].parentId).toBe("msp-1");
      expect(parsed.tasks[2].predecessors?.[0].predecessorId).toBe("msp-2");
    });
  });

  describe("InteractiveGanttDrawer Hierarchical Tree & Splitter", () => {
    beforeEach(() => {
      document.body.innerHTML = "";
    });

    it("renders collapsible WBS summary nodes and toggles child row visibility", () => {
      const mgr = ScheduleManager.getInstance();
      mgr.clear();
      mgr.tasks.set("sum-1", {
        id: "sum-1",
        name: "Zone A Package",
        category: "Summary",
        startDate: "2026-07-01",
        endDate: "2026-07-10",
        status: "Planned",
        elementIds: new Set(),
        modelId: "m1",
        unitCost: 0,
        quantity: 1,
        isSummary: true,
        wbsCode: "1",
      });
      mgr.tasks.set("leaf-1", {
        id: "leaf-1",
        parentId: "sum-1",
        name: "Footing Pour",
        category: "IFCFOOTING",
        startDate: "2026-07-01",
        endDate: "2026-07-05",
        status: "Planned",
        elementIds: new Set([1, 2]),
        modelId: "m1",
        unitCost: 100,
        quantity: 2,
        wbsCode: "1.1",
      });
      (window as any).scheduleManager = mgr;

      const drawer = InteractiveGanttDrawer.getInstance();
      drawer.init("test-gantt-drawer");
      drawer.show();

      const toggleBtn = document.querySelector<HTMLButtonElement>('.btn-gantt-tree-toggle[data-toggle-id="sum-1"]');
      expect(toggleBtn).not.toBeNull();
      expect(document.querySelectorAll("#test-gantt-drawer .gantt-task-row").length).toBe(2);

      // Collapse Zone A
      toggleBtn!.click();
      expect(document.querySelectorAll("#test-gantt-drawer .gantt-task-row").length).toBe(1);

      // Switch timescale to Day
      const dayBtn = document.querySelector<HTMLButtonElement>('.btn-gantt-scale[data-scale="day"]');
      dayBtn?.click();
      expect(dayBtn?.classList.contains("active")).toBe(true);
    });
  });
});
