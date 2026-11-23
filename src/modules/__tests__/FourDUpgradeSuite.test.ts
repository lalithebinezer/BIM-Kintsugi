import { describe, it, expect } from "vitest";
import {
  buildPropertyMatchIndex,
  addCompositeKeysToIndex,
  linkTasksToPropertyIndex,
  auditScheduleLinkage,
  parseCsvHeadersAndPreview,
  remapCsvColumns,
  detectResourceTaskReason,
  type IndexableModelElement,
} from "../CsvSchedulePropertyLinker";
import { TradeAppearanceEngine } from "../TradeAppearanceEngine";
import { selectSupportedVideoMimeType } from "../TimelapseExporter";
import {
  cleanScheduleTaskTitle,
  filterScheduleEntries,
  computeVirtualWindow,
  type ScheduleTaskEntry,
} from "../../ui/ScheduleTimelineController";
import type { ScheduleTask } from "../ScheduleManager";

function makeTask(partial: Partial<ScheduleTask> & { id: string; name: string }): ScheduleTask {
  return {
    id: partial.id,
    name: partial.name,
    startDate: partial.startDate ?? "2026-06-18",
    endDate: partial.endDate ?? "2026-06-28",
    status: partial.status ?? "Planned",
    modelId: partial.modelId ?? "m1",
    elementIds: partial.elementIds ?? new Set<number>(),
    unitCost: partial.unitCost ?? 0,
    totalCost: partial.totalCost ?? 0,
    quantity: partial.quantity ?? 0,
    matchProperty: partial.matchProperty,
    matchValue: partial.matchValue,
    isSummary: partial.isSummary ?? false,
  } as ScheduleTask;
}

describe("4D/5D Upgrade Suite — Composite Keys, Linkage Audit, Trade Profiles, Virtualization & Timelapse", () => {
  it("links CSV tasks via multi-property composite keys (Storey+Category)", () => {
    const elements: IndexableModelElement[] = [
      { modelId: "m1", expressId: 101, properties: { Storey: "Level 1", Category: "IfcColumn" } },
      { modelId: "m1", expressId: 102, properties: { Storey: "Level 1", Category: "IfcColumn" } },
      { modelId: "m1", expressId: 201, properties: { Storey: "Level 2", Category: "IfcSlab" } },
    ];
    const index = buildPropertyMatchIndex(elements);
    const compositeName = addCompositeKeysToIndex(index, elements, {
      properties: ["Storey", "Category"],
    });
    expect(compositeName).toBe("Storey+Category");

    const tasks = [
      makeTask({ id: "T1", name: "Level 1 — IfcColumn", matchProperty: "Storey+Category" }),
      makeTask({ id: "T2", name: "Level 2 - IfcSlab", matchProperty: "Storey+Category" }),
    ];
    const report = linkTasksToPropertyIndex(tasks, index);
    expect(report.linkedTasks).toBe(2);
    expect(report.totalLinkedElements).toBe(3);
    expect(Array.from(tasks[0].elementIds)).toEqual([101, 102]);
    expect(Array.from(tasks[1].elementIds)).toEqual([201]);
  });

  it("audits matched, resource (EQ_/LAB_/MAT_), unmatched tasks, and unscheduled 3D elements", () => {
    const elements: IndexableModelElement[] = [
      { modelId: "m1", expressId: 1, properties: { Category: "IfcFooting" } },
      { modelId: "m1", expressId: 2, properties: { Category: "IfcColumn" } },
      { modelId: "m1", expressId: 3, properties: { Category: "IfcWall" } },
      { modelId: "m1", expressId: 4, properties: { Category: "IfcWall" } },
    ];
    const tasks = [
      makeTask({ id: "T1", name: "FOU_EPit", elementIds: new Set([1]) }),
      makeTask({ id: "T2", name: "EQ_Tower_Crane_Operation_Site_Logistics" }),
      makeTask({ id: "T3", name: "LAB_Substructure_Crew" }),
      makeTask({ id: "T4", name: "MAT_Concrete_Supply" }),
      makeTask({ id: "T5", name: "WALL_Missing_Zone" }),
    ];

    const audit = auditScheduleLinkage(tasks, elements);
    expect(audit.matchedTasks).toHaveLength(1);
    expect(audit.resourceTasks).toHaveLength(3);
    expect(audit.unmatchedTasks).toHaveLength(1);
    expect(audit.unmatchedTasks[0].taskName).toBe("WALL_Missing_Zone");
    expect(audit.scheduledElementCount).toBe(1);
    expect(audit.unscheduledElementCount).toBe(3);
    expect(audit.unscheduledModelIdMaps["m1"].size).toBe(3);
    expect(audit.unscheduledByCategory[0]).toEqual({ category: "IfcWall", count: 2 });
    expect(detectResourceTaskReason("EQ_Concrete_Pump")).toBe("Equipment / Plant");
  });

  it("parses CSV headers/preview and remaps arbitrary columns with composite keys", () => {
    const rawCsv = [
      "ActivityName,PlannedStart,PlannedFinish,BudgetUSD",
      "Level 1 — IfcColumn,2026-07-01,2026-07-10,45000",
      "Level 2 — IfcSlab,2026-07-11,2026-07-20,62000",
    ].join("\n");

    const { headers, previewRows } = parseCsvHeadersAndPreview(rawCsv, 2);
    expect(headers).toEqual(["ActivityName", "PlannedStart", "PlannedFinish", "BudgetUSD"]);
    expect(previewRows).toHaveLength(2);

    const remapped = remapCsvColumns(rawCsv, {
      taskName: "ActivityName",
      startDate: "PlannedStart",
      endDate: "PlannedFinish",
      totalCost: "BudgetUSD",
      compositeProperties: ["Storey", "Category"],
    });
    expect(remapped).toContain("TaskID,TaskName,StartDate,EndDate");
    expect(remapped).toContain("Storey+Category");
    expect(remapped).toContain("45000");
  });

  it("groups active 4D elements by Trade Appearance Profiles (FOU, COL, FLO, WALL, FRA, STR, MEP)", () => {
    const engine = new TradeAppearanceEngine();
    expect(engine.matchTradeProfile("FOU_Tof Footing")?.id).toBe("foundation");
    expect(engine.matchTradeProfile("COL_LL2")?.id).toBe("column");
    expect(engine.matchTradeProfile("FLO_LL3")?.id).toBe("slab");
    expect(engine.matchTradeProfile("FRA_LL4")?.id).toBe("framing");
    expect(engine.matchTradeProfile("WALL_EPit")?.id).toBe("wall");
    expect(engine.matchTradeProfile("STR_ST_L2")?.id).toBe("stair");

    const dateMs = new Date("2026-06-22").getTime();
    const tasks = [
      makeTask({
        id: "T1",
        name: "FOU_EPit",
        startDate: "2026-06-18",
        endDate: "2026-06-20",
        elementIds: new Set([10]),
      }),
      makeTask({
        id: "T2",
        name: "COL_LL2",
        startDate: "2026-06-20",
        endDate: "2026-06-26",
        elementIds: new Set([20, 21]),
      }),
      makeTask({
        id: "T3",
        name: "WALL_LL2",
        startDate: "2026-06-21",
        endDate: "2026-06-28",
        elementIds: new Set([30]),
      }),
      makeTask({
        id: "T4",
        name: "FLO_LL3",
        startDate: "2026-07-01",
        endDate: "2026-07-10",
        elementIds: new Set([40]),
      }),
    ];

    const buckets = engine.buildActiveTradeBuckets(dateMs, tasks);
    expect(buckets.completed["m1"].has(10)).toBe(true);
    expect(buckets.planned["m1"].has(40)).toBe(true);
    expect(buckets.tradeBuckets.map((b) => b.profile.id).sort()).toEqual(["column", "wall"]);
  });

  it("filters schedule entries cleanly and computes virtual window for 2,000+ tasks", () => {
    expect(cleanScheduleTaskTitle("Text.SIMULATION: COL_LL2")).toBe("COL_LL2");

    const entries: ScheduleTaskEntry[] = [
      {
        taskKey: "1::COL_LL2",
        taskName: "COL_LL2",
        cleanDisplayTitle: "COL_LL2",
        stats: { startDate: "2026-06-18", endDate: "2026-06-28", totalCount: 10, completedCount: 5, modelIdMaps: { m1: new Set([1]) } },
        taskStatus: "In Progress",
        isActive: true,
        pct: 50,
        linkedElementCount: 1,
      },
      {
        taskKey: "2::EQ_Crane",
        taskName: "EQ_Crane",
        cleanDisplayTitle: "EQ_Crane",
        stats: { startDate: "2026-06-18", endDate: "2026-09-01", totalCount: 0, completedCount: 0, modelIdMaps: {} },
        taskStatus: "Planned",
        isActive: false,
        pct: 0,
        linkedElementCount: 0,
      },
    ];

    expect(filterScheduleEntries(entries, "col", "all")).toHaveLength(1);
    expect(filterScheduleEntries(entries, "", "unlinked")).toHaveLength(1);
    expect(filterScheduleEntries(entries, "", "active")).toHaveLength(1);

    const win = computeVirtualWindow(2000, 8200, 328, 82, 5);
    expect(win.startIndex).toBe(95);
    expect(win.endIndex).toBe(109);
    expect(win.topSpacerPx).toBe(95 * 82);
    expect(win.bottomSpacerPx).toBe((2000 - 109) * 82);
  });

  it("selects a valid fallback WebM video mimeType in Node/headless environments", () => {
    expect(selectSupportedVideoMimeType()).toContain("video/webm");
  });
});
