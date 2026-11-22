import { describe, it, expect, beforeEach } from "vitest";
import { ScheduleManager } from "../ScheduleManager";
import {
  buildPropertyMatchIndex,
  linkTasksToPropertyIndex,
  discoverModelMetaProperties,
  buildCsvGroupedByMetaProperty,
  type IndexableModelElement,
} from "../CsvSchedulePropertyLinker";

describe("CsvSchedulePropertyLinker — Exact Task-to-3D Property Matching & Cost/Date Preservation", () => {
  beforeEach(() => {
    const sm = ScheduleManager.getInstance();
    sm.tasks.clear();
    sm.elementData.clear();
  });

  it("exact-matches CSV TaskName against 3D element properties (Name, Pset/SIMULATION, Tag) and rejects partial substrings", () => {
    const sm = ScheduleManager.getInstance();
    const csv = [
      "TaskName,StartDate,EndDate,ActualStartDate,ActualEndDate,TotalCost,ActualCost,Status",
      "Foundation Pour,2026-06-01,2026-06-10,2026-06-01,2026-06-12,12000,13500,Completed",
      "Wall-L1-A,2026-06-11,2026-06-20,,,8000,,In Progress",
      "Unmatched Task,2026-06-21,2026-06-25,,,4000,,Planned",
    ].join("\n");

    const count = sm.importScheduleFromCSV(csv, { replaceExisting: true });
    expect(count).toBe(3);

    const modelElements: IndexableModelElement[] = [
      { modelId: "m1", expressId: 101, properties: { Name: "Footing-1", "Pset_4D.SIMULATION": "Foundation Pour" } },
      { modelId: "m1", expressId: 102, properties: { Name: "Footing-2", "Pset_4D.SIMULATION": "Foundation Pour" } },
      // Partial substring should NOT exact-match "Foundation Pour"
      { modelId: "m1", expressId: 103, properties: { Name: "Foundation Pour Extra", "Pset_4D.SIMULATION": "Foundation Pour Phase 2" } },
      // Exact match on Name
      { modelId: "m1", expressId: 201, properties: { Name: "Wall-L1-A", Tag: "W-01" } },
    ];

    const index = buildPropertyMatchIndex(modelElements);
    const report = linkTasksToPropertyIndex(Array.from(sm.tasks.values()), index);

    expect(report.totalTasks).toBe(3);
    expect(report.linkedTasks).toBe(2);
    expect(report.unlinkedTasks).toBe(1);
    expect(report.totalLinkedElements).toBe(3);
    expect(report.unlinkedTaskNames).toEqual(["Unmatched Task"]);

    const tasks = Array.from(sm.tasks.values());
    const foundTask = tasks.find((t) => t.name === "Foundation Pour")!;
    expect(Array.from(foundTask.elementIds).sort()).toEqual([101, 102]);
    // Exact CSV dates & TotalCost preserved; UnitCost derived across 2 matched elements
    expect(foundTask.startDate).toBe("2026-06-01");
    expect(foundTask.endDate).toBe("2026-06-10");
    expect(foundTask.actualStartDate).toBe("2026-06-01");
    expect(foundTask.actualEndDate).toBe("2026-06-12");
    expect(foundTask.totalCost).toBe(12000);
    expect(foundTask.unitCost).toBe(6000);
    expect(foundTask.actualCost).toBe(13500);
    expect(foundTask.quantity).toBe(2);
    expect(foundTask.matchedProperty).toContain("SIMULATION");

    const wallTask = tasks.find((t) => t.name === "Wall-L1-A")!;
    expect(Array.from(wallTask.elementIds)).toEqual([201]);
    expect(wallTask.totalCost).toBe(8000);
    expect(wallTask.unitCost).toBe(8000);
  });

  it("supports explicit MatchProperty column and UnitCost scaling across matched elements", () => {
    const sm = ScheduleManager.getInstance();
    const csv = [
      "TaskID,TaskName,StartDate,EndDate,UnitCost,MatchProperty",
      "A-10,Level 2 Columns,2026-07-01,2026-07-08,1500,WorkPackage",
    ].join("\n");

    const count = sm.importScheduleFromCSV(csv, { replaceExisting: true });
    expect(count).toBe(1);

    const modelElements: IndexableModelElement[] = [
      { modelId: "m1", expressId: 301, properties: { Name: "Level 2 Columns", WorkPackage: "Other" } },
      { modelId: "m1", expressId: 302, properties: { Name: "Col-1", "Pset_Custom.WorkPackage": "Level 2 Columns" } },
      { modelId: "m1", expressId: 303, properties: { Name: "Col-2", "Pset_Custom.WorkPackage": "Level 2 Columns" } },
      { modelId: "m1", expressId: 304, properties: { Name: "Col-3", "Pset_Custom.WorkPackage": "Level 2 Columns" } },
    ];

    const index = buildPropertyMatchIndex(modelElements);
    const report = linkTasksToPropertyIndex(Array.from(sm.tasks.values()), index);

    expect(report.linkedTasks).toBe(1);
    expect(report.totalLinkedElements).toBe(3);

    const colTask = sm.tasks.get("A-10")!;
    // Must only match elements whose WorkPackage === "Level 2 Columns", NOT element 301 whose Name matched
    expect(Array.from(colTask.elementIds).sort()).toEqual([302, 303, 304]);
    expect(colTask.unitCost).toBe(1500);
    expect(colTask.totalCost).toBe(4500);
    expect(colTask.quantity).toBe(3);
  });

  it("accepts minimal 3-column CSV (TaskName,StartDate,EndDate) and replaces stale tasks when replaceExisting=true", () => {
    const sm = ScheduleManager.getInstance();
    sm.tasks.set("stale-1", {
      id: "stale-1",
      name: "Old Auto Task",
      category: "IFCWALL",
      startDate: "2026-01-01",
      endDate: "2026-01-05",
      status: "Planned",
      elementIds: new Set([1]),
      modelId: "m1",
      unitCost: 100,
      quantity: 1,
    });

    const csv = [
      "TaskName,StartDate,EndDate",
      "Roof Truss,2026-08-01,2026-08-15",
    ].join("\n");

    const count = sm.importScheduleFromCSV(csv, { replaceExisting: true });
    expect(count).toBe(1);
    expect(sm.tasks.has("stale-1")).toBe(false);
    expect(sm.tasks.size).toBe(1);
  });

  it("discovers model meta properties and round-trips CSV export by selected property -> edit dates/costs -> exact re-import", () => {
    const sm = ScheduleManager.getInstance();
    const modelElements: IndexableModelElement[] = [
      { modelId: "m1", expressId: 10, properties: { Name: "Col-1", Category: "IFCCOLUMN", "Pset_4D.WorkPackage": "WP-Structure-L1" } },
      { modelId: "m1", expressId: 11, properties: { Name: "Col-2", Category: "IFCCOLUMN", "Pset_4D.WorkPackage": "WP-Structure-L1" } },
      { modelId: "m1", expressId: 12, properties: { Name: "Wall-1", Category: "IFCWALL", "Pset_4D.WorkPackage": "WP-Envelope-L1" } },
    ];

    const props = discoverModelMetaProperties(modelElements);
    const wpProp = props.find((p) => p.propertyName === "Pset_4D.WorkPackage");
    expect(wpProp).toBeDefined();
    expect(wpProp!.uniqueValueCount).toBe(2);
    expect(wpProp!.elementCount).toBe(3);

    // Export CSV using Pset_4D.WorkPackage as TaskName (without ExpressIDs)
    const exported = buildCsvGroupedByMetaProperty({
      scheduleManager: sm,
      elements: modelElements,
      metaProperty: "Pset_4D.WorkPackage",
      includeExpressIds: false,
    });
    expect(exported.rowCount).toBe(2);
    expect(exported.elementCount).toBe(3);
    expect(exported.csv).toContain("MatchProperty");
    expect(exported.csv).toContain('"WP-Structure-L1"');
    expect(exported.csv).toContain('"Pset_4D.WorkPackage"');

    // Simulate user editing dates and TotalCost on the WP-Structure-L1 row in Excel, then re-importing
    const editedCsv = exported.csv
      .split("\n")
      .map((line) =>
        line.includes('"WP-Structure-L1"')
          ? line.replace(/(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})/, "2026-09-01,2026-09-15").replace("500.00", "20000.00")
          : line
      )
      .join("\n");

    const importedCount = sm.importScheduleFromCSV(editedCsv, { replaceExisting: true });
    expect(importedCount).toBe(2);

    const index = buildPropertyMatchIndex(modelElements);
    const linkReport = linkTasksToPropertyIndex(Array.from(sm.tasks.values()), index);
    expect(linkReport.linkedTasks).toBe(2);
    expect(linkReport.totalLinkedElements).toBe(3);

    const structTask = Array.from(sm.tasks.values()).find((t) => t.name === "WP-Structure-L1")!;
    expect(structTask.startDate).toBe("2026-09-01");
    expect(structTask.endDate).toBe("2026-09-15");
    expect(Array.from(structTask.elementIds).sort()).toEqual([10, 11]);
    expect(structTask.matchProperty).toBe("Pset_4D.WorkPackage");
  });

  it("includes elements missing the selected property as Unassigned rows by default so zero elements are lost", () => {
    const sm = ScheduleManager.getInstance();
    const modelElements: IndexableModelElement[] = [
      { modelId: "m1", expressId: 1, properties: { Name: "W-1", Category: "IFCWALL", "Text.SIMULATION": "WALL_L1" } },
      { modelId: "m1", expressId: 2, properties: { Name: "S-1", Category: "IFCSLAB" } },
      { modelId: "m1", expressId: 3, properties: { Name: "S-2", Category: "IFCSLAB" } },
    ];

    const withUnassigned = buildCsvGroupedByMetaProperty({
      scheduleManager: sm,
      elements: modelElements,
      metaProperty: "Text.SIMULATION",
      includeUnassigned: true,
    });
    expect(withUnassigned.rowCount).toBe(2);
    expect(withUnassigned.elementCount).toBe(3);
    expect(withUnassigned.missingElementCount).toBe(2);
    expect(withUnassigned.csv).toContain('"Unassigned (IFCSLAB)"');
    expect(withUnassigned.csv).toContain('"2;3"');

    const withoutUnassigned = buildCsvGroupedByMetaProperty({
      scheduleManager: sm,
      elements: modelElements,
      metaProperty: "Text.SIMULATION",
      includeUnassigned: false,
    });
    expect(withoutUnassigned.rowCount).toBe(1);
    expect(withoutUnassigned.elementCount).toBe(1);
    expect(withoutUnassigned.missingElementCount).toBe(2);
  });
});
