// @vitest-environment happy-dom
import { describe, it, expect } from "vitest";
import {
  WorkspaceSnapshotManager,
  serializeScheduleTasks,
  deserializeScheduleTasks,
} from "../../core/WorkspaceSnapshotManager";
import {
  encodeDeepLinkState,
  decodeDeepLinkHash,
  buildShareableViewUrl,
} from "../../core/DeepLinkManager";
import {
  SHORTCUT_REGISTRY,
  detectShortcutConflicts,
  renderShortcutRegistryHtml,
} from "../../core/ShortcutRegistry";
import { evaluateAllIdsPresets } from "../IdsPresetEngine";
import {
  buildCashFlowHistogramBuckets,
  CashFlowHistogramDrawer,
} from "../../ui/CashFlowHistogramDrawer";
import { SplitScreenComparisonController } from "../../ui/SplitScreenComparisonController";
import { JobsiteTouchMode } from "../../ui/JobsiteTouchMode";
import { TimelinePlaybackController } from "../../ui/TimelinePlaybackController";
import { detectScheduleFileFormat } from "../../ui/ScheduleImportController";
import { filterLoadedModels, resolveSampleModel } from "../../ui/ModelTreeController";
import type { ScheduleTask } from "../ScheduleManager";
import type { IndexableModelElement } from "../CsvSchedulePropertyLinker";

function makeTask(partial: Partial<ScheduleTask> & { id: string; name: string }): ScheduleTask {
  return {
    id: partial.id,
    name: partial.name,
    startDate: partial.startDate ?? "2026-06-01",
    endDate: partial.endDate ?? "2026-06-30",
    status: partial.status ?? "Planned",
    modelId: partial.modelId ?? "m1",
    elementIds: partial.elementIds ?? new Set<number>([1, 2]),
    unitCost: partial.unitCost ?? 1000,
    totalCost: partial.totalCost ?? 20000,
    quantity: partial.quantity ?? 2,
    isSummary: partial.isSummary ?? false,
  } as ScheduleTask;
}

describe("Platform Upgrades Suite — Snapshots, Deep-Links, Shortcuts, IDS Presets, Histogram, Split-4D & Controllers", () => {
  it("persists, lists, restores, and deletes Workspace Snapshots cleanly", async () => {
    const mgr = WorkspaceSnapshotManager.getInstance();
    const tasks = [makeTask({ id: "T1", name: "FOU_EPit", elementIds: new Set([10, 11]) })];
    const serialized = serializeScheduleTasks(tasks);
    expect(serialized[0].elementIds).toEqual([10, 11]);
    expect(deserializeScheduleTasks(serialized)[0].elementIds.has(11)).toBe(true);

    await mgr.saveSnapshot(
      {
        name: "Test Session",
        modelNames: ["snowdon"],
        is4dMode: true,
        timelineDateIso: "2026-06-18",
        cameraPose: { position: [10, 20, 30], target: [0, 0, 0] },
        tasks: serialized,
      },
      "unit-test-snap"
    );

    const loaded = await mgr.loadSnapshot("unit-test-snap");
    expect(loaded).not.toBeNull();
    expect(loaded?.timelineDateIso).toBe("2026-06-18");
    expect(loaded?.tasks).toHaveLength(1);

    const all = await mgr.listSnapshots();
    expect(all.some((s) => s.id === "unit-test-snap")).toBe(true);

    await mgr.deleteSnapshot("unit-test-snap");
    expect(await mgr.loadSnapshot("unit-test-snap")).toBeNull();
  });

  it("round-trips Shareable Deep-Link View URLs with camera, 4D date, GUID, and lens", () => {
    const hash = encodeDeepLinkState({
      camPos: [12.345, 45.678, -9.123],
      camTarget: [0, 3.5, 0],
      storey: "Level 2",
      selectedGuid: "2O2Fr$t4X7Zf8NOew3FLOH",
      mode4d: true,
      date4d: "2026-08-15",
      lens: "trades",
      sample: "snowdon",
    });
    expect(hash.startsWith("#view=")).toBe(true);

    const decoded = decodeDeepLinkHash(hash);
    expect(decoded).toEqual({
      camPos: [12.35, 45.68, -9.12],
      camTarget: [0, 3.5, 0],
      storey: "Level 2",
      selectedGuid: "2O2Fr$t4X7Zf8NOew3FLOH",
      mode4d: true,
      date4d: "2026-08-15",
      lens: "trades",
      sample: "snowdon",
    });

    const fullUrl = buildShareableViewUrl({ mode4d: true, date4d: "2026-07-01" }, "https://example.com/app");
    expect(fullUrl).toContain("https://example.com/app#view=");
    expect(decodeDeepLinkHash("not-a-valid-hash")).toBeNull();
  });

  it("maintains zero shortcut conflicts in ShortcutRegistry and renders HTML", () => {
    expect(SHORTCUT_REGISTRY.length).toBeGreaterThan(20);
    expect(detectShortcutConflicts(SHORTCUT_REGISTRY)).toEqual([]);
    const html = renderShortcutRegistryHtml();
    expect(html).toContain("Ctrl+Shift+L");
    expect(html).toContain("Ctrl+Shift+S");
  });

  it("evaluates all 4 OpenBIM IDS & QA Rule Presets with failing 3D element maps", () => {
    const elements: IndexableModelElement[] = [
      {
        modelId: "m1",
        expressId: 1,
        properties: {
          Name: "W-101 Structural Wall",
          GlobalId: "2O2Fr$t4X7Zf8NOew3FLOH",
          Category: "IfcWall",
          Storey: "Level 1",
          "Text.SIMULATION": "WALL_LL1",
          "Qto_WallBaseQuantities.NetVolume": 12.5,
        },
      },
      {
        modelId: "m1",
        expressId: 2,
        properties: {
          Name: "Unnamed",
          Category: "IfcColumn",
          Storey: "Unassigned",
        },
      },
    ];

    const results = evaluateAllIdsPresets(elements);
    expect(results).toHaveLength(4);
    for (const r of results) {
      expect(r.passedCount).toBe(1);
      expect(r.failedCount).toBe(1);
      expect(r.compliancePct).toBe(50);
      expect(r.failingModelIdMaps["m1"].has(2)).toBe(true);
    }
  });

  it("builds monthly and weekly 4D Cash-Flow & Resource Load histogram buckets", () => {
    const tasks = [
      makeTask({ id: "1", name: "FOU_EPit", startDate: "2026-06-01", endDate: "2026-06-30", totalCost: 30000 }),
      makeTask({ id: "2", name: "EQ_Tower_Crane", startDate: "2026-06-01", endDate: "2026-07-31", totalCost: 60000 }),
      makeTask({ id: "3", name: "LAB_Substructure_Crew", startDate: "2026-07-01", endDate: "2026-07-31", totalCost: 20000 }),
      makeTask({ id: "4", name: "MAT_Concrete_Supply", startDate: "2026-07-01", endDate: "2026-07-31", totalCost: 10000 }),
    ];

    const monthly = buildCashFlowHistogramBuckets(tasks, "month");
    expect(monthly).toHaveLength(2);
    expect(monthly[1].cumulativeCost).toBeGreaterThan(100000);
    expect(monthly[0].equipmentCount).toBe(1);

    // Verify floating window drag position, resize, collapse, reset, and close callback
    localStorage.removeItem("bim_kintsugi_cfh_float_v1");
    const drawer = CashFlowHistogramDrawer.getInstance();
    let closedCount = 0;
    drawer.open(tasks, new Date("2026-06-15").getTime(), () => {}, () => {
      closedCount++;
    });
    expect(drawer.isOpen()).toBe(true);
    const el = document.getElementById("cashflow-histogram-drawer");
    expect(el?.classList.contains("floating-window")).toBe(true);
    expect(document.getElementById("cfh-resize-handle")).not.toBeNull();

    drawer.setFloatingPosition(120, 96);
    expect(drawer.getFloatingGeometry().left).toBe(120);
    expect(drawer.getFloatingGeometry().top).toBe(96);

    drawer.setFloatingSize(540, 280);
    expect(drawer.getFloatingGeometry().width).toBe(540);
    expect(drawer.getFloatingGeometry().height).toBe(280);

    drawer.setCollapsed(true);
    expect(el?.classList.contains("collapsed")).toBe(true);

    drawer.resetFloatingPosition();
    expect(drawer.getFloatingGeometry().collapsed).toBe(false);

    (document.getElementById("cfh-close-btn") as HTMLButtonElement).click();
    expect(drawer.isOpen()).toBe(false);
    expect(closedCount).toBe(1);
    expect(monthly[0].tradeTaskCount).toBe(1);
    expect(monthly[1].laborCount).toBe(1);
    expect(monthly[1].materialCount).toBe(1);

    const weekly = buildCashFlowHistogramBuckets(tasks, "week");
    expect(weekly.length).toBeGreaterThanOrEqual(8);
  });

  it("clamps SplitScreenComparisonController divider safely between 5% and 95%", () => {
    const ctrl = SplitScreenComparisonController.getInstance();
    ctrl.setSplitPercent(2);
    expect(ctrl.getSplitPercent()).toBe(5);
    ctrl.setSplitPercent(99);
    expect(ctrl.getSplitPercent()).toBe(95);
    ctrl.setSplitPercent(62.4);
    expect(ctrl.getSplitPercent()).toBe(62.4);
  });

  it("toggles JobsiteTouchMode class on document.body cleanly", () => {
    const touch = JobsiteTouchMode.getInstance();
    touch.setEnabled(true, false);
    expect(touch.isEnabled()).toBe(true);
    expect(document.body.classList.contains("jobsite-touch-mode")).toBe(true);
    touch.setEnabled(false, false);
    expect(document.body.classList.contains("jobsite-touch-mode")).toBe(false);
  });

  it("handles TimelinePlaybackController, ScheduleImportController & ModelTreeController cleanly", () => {
    const playback = new TimelinePlaybackController();
    const bounds = playback.computeBoundsFromDates([
      { startDate: "2026-06-01", endDate: "2026-06-15" },
      { startDate: "2026-06-10", endDate: "2026-07-01" },
    ]);
    expect(bounds?.totalDays).toBe(30);
    playback.setDayOffset(15);
    expect(playback.getTelemetry().progressPct).toBe(50);

    expect(detectScheduleFileFormat("plan.CSV")).toBe("csv");
    expect(detectScheduleFileFormat("plan.xlsx")).toBe("excel");
    expect(detectScheduleFileFormat("plan.xml")).toBe("mspdi-xml");
    expect(detectScheduleFileFormat("plan.xer")).toBe("primavera-xer");

    expect(resolveSampleModel("snowdon").format).toBe("ifc");
    expect(resolveSampleModel("tekla").format).toBe("ifc");
    expect(resolveSampleModel("tekla").url).toBe("Sample_Office_Building_Tekla.ifc");
    expect(resolveSampleModel("school").format).toBe("frag");
    expect(resolveSampleModel("unknown").key).toBe("snowdon");
    expect(
      filterLoadedModels(
        [
          { id: "m1", name: "Snowdon_Structural.ifc" },
          { id: "m2", name: "School_Arq.frag" },
        ],
        "snowdon"
      )
    ).toHaveLength(1);
  });
});
