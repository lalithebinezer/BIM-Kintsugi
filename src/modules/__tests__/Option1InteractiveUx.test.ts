/** @vitest-environment happy-dom */
import { describe, it, expect, beforeEach } from "vitest";
import { RuleBuilderModal } from "../../ui/RuleBuilderModal";
import { RuleSearchEngine } from "../RuleSearchEngine";
import { ScheduleManager } from "../ScheduleManager";
import { WorkspaceCongestionAnalyzer } from "../WorkspaceCongestionAnalyzer";
import { buildVerticalProfileSvg } from "../CivilAlignmentModule";
import { switchLineItemQuantitySource, type BOQLineItem } from "../BoqGenerator";

describe("Option 1: Interactive Rule Builder, Audit Drill-Down, 4D SLF Sync & Civil Profile", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("opens RuleBuilderModal, creates & saves a boolean search rule, and binds it to a 4D task", async () => {
    const sm = ScheduleManager.getInstance();
    sm.tasks.clear();
    sm.tasks.set("t-walls", {
      id: "t-walls",
      name: "Level 2 Walls",
      category: "IFCWALL",
      modelId: "m1",
      startDate: "2026-06-01",
      endDate: "2026-06-10",
      status: "Planned",
      unitCost: 250,
      quantity: 20,
      elementIds: new Set<number>(),
    });

    const modal = RuleBuilderModal.getInstance();
    modal.open({ preselectedTaskId: "t-walls" });

    const overlay = document.getElementById("rule-builder-modal");
    expect(overlay).not.toBeNull();
    expect(overlay!.classList.contains("hidden")).toBe(false);

    const nameInput = overlay!.querySelector<HTMLInputElement>("#rb-rule-name")!;
    nameInput.value = "L2 Concrete Walls";

    const valInput = overlay!.querySelector<HTMLInputElement>(".rb-cond-val")!;
    valInput.value = "IFCWALL";

    overlay!.querySelector<HTMLButtonElement>("#rb-btn-save-bind")!.click();
    await new Promise((r) => setTimeout(r, 20));

    const saved = RuleSearchEngine.getInstance().getRules().find((r) => r.name === "L2 Concrete Walls");
    expect(saved).toBeDefined();
    expect(sm.tasks.get("t-walls")?.selectionRuleId).toBe(saved!.id);

    modal.close();
    expect(overlay!.classList.contains("hidden")).toBe(true);
  });

  it("slices WorkspaceCongestionAnalyzer SLF series cleanly for a 4D timeline timestamp", async () => {
    const analyzer = WorkspaceCongestionAnalyzer.getInstance();
    const tasks = [
      {
        id: "t1",
        name: "Slab Pour",
        category: "IFCSLAB",
        modelId: "m1",
        startDate: "2026-07-01",
        endDate: "2026-07-08",
        status: "In Progress" as const,
        unitCost: 200,
        quantity: 50,
        elementIds: new Set<number>([101, 102]),
      },
      {
        id: "t2",
        name: "MEP Rough-in",
        category: "IFCPIPE",
        modelId: "m1",
        startDate: "2026-07-15",
        endDate: "2026-07-22",
        status: "Planned" as const,
        unitCost: 100,
        quantity: 80,
        elementIds: new Set<number>([201]),
      },
    ];

    const res = await analyzer.syncOverlaysForDate(tasks, new Date("2026-07-04").getTime());
    expect(res.points.length).toBeGreaterThan(0);
    expect(res.peak).not.toBeNull();
    expect(res.peak!.slf).toBeGreaterThanOrEqual(0);
    analyzer.clearOverlays();
  });

  it("renders interactive clickable station dots in buildVerticalProfileSvg", () => {
    const svg = buildVerticalProfileSvg([
      { station: 0, elevation: 10, x: 0, y: 10, z: 0 },
      { station: 100, elevation: 14.5, x: 100, y: 14.5, z: 12 },
      { station: 200, elevation: 12.2, x: 200, y: 12.2, z: 30 },
    ]);
    expect(svg).toContain('class="civil-station-dot"');
    expect(svg).toContain('data-station="0.0"');
    expect(svg).toContain('data-station="200.0"');
    expect(svg).toContain('data-x="100.00"');
    expect(svg).toContain("0+200");
  });

  it("switches QTO provenance source on a BOQ line item and updates quantity & totalCost", () => {
    const item: BOQLineItem = {
      expressId: 42,
      modelId: "m1",
      category: "IFCWALL",
      elementName: "Wall-A",
      materialNumber: "MAT-CONC-01",
      unit: "m³",
      quantity: 10,
      unitCost: 200,
      totalCost: 2000,
      propertySetName: "Qto_WallBaseQuantities",
      quantityType: "NetVolume",
      availableQuantities: [
        { propertySetName: "Qto_WallBaseQuantities", quantityType: "NetVolume", value: 10, unit: "m³" },
        { propertySetName: "Qto_WallBaseQuantities", quantityType: "GrossVolume", value: 12.5, unit: "m³" },
      ],
    };

    const switched = switchLineItemQuantitySource(item, "GrossVolume", "Qto_WallBaseQuantities");
    expect(switched.quantityType).toBe("GrossVolume");
    expect(switched.quantity).toBe(12.5);
    expect(switched.totalCost).toBe(2500);
  });
});
