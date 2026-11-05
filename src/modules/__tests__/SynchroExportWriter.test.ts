import { describe, it, expect } from "vitest";
import { ScheduleImportParsers } from "../ScheduleImportParsers";
import type { ScheduleTask } from "../ScheduleManager";

describe("Generate Clean Synchro XML for Snowdon Towers", () => {
  it("should generate clean, production-grade XML with Task UID 0 and clean task names", () => {
    // 47 simulation groups from Snowdon Towers
    const rawGroups = [
      "COL_EPit", "COL_LL1_35_Low", "COL_LL1_37_Med", "COL_LL1_43_High", "COL_LL3",
      "COL_LL4", "COL_LL5", "COL_LTOS", "COL_RTOS", "COL_Tof Footing",
      "FLO_LL1_35_Low", "FLO_LL1_37_Med", "FLO_LL1_43_High", "FLO_LL2", "FLO_LL3",
      "FLO_LL4", "FLO_LL5", "FLO_MM1", "FLO_P2", "FLO_PPparking", "FLO_RR2",
      "FLO_RTOS", "FOU_EPit", "FOU_PPparking", "FOU_Tof Footing", "FOU_Tof PileCap",
      "FRA_EPit", "FRA_LL1_35_Low", "FRA_LL1_37_Med", "FRA_LL1_43_High", "FRA_LL2",
      "FRA_LL3", "FRA_LL4", "FRA_LL5", "FRA_LTOS", "FRA_MM1", "FRA_P2", "FRA_PPparking",
      "FRA_RR2", "FRA_RTOS", "FRA_Tof Footing", "WAL_EPit", "WAL_LL1_35_Low",
      "WAL_LL1_37_Med", "WAL_LL1_43_High", "WAL_LL2", "WAL_PPparking"
    ];

    const projectStart = new Date("2026-06-18");
    const durationDays = 10;
    const overlapDays = 3;
    const stepDays = durationDays - overlapDays; // 7 days step

    const tasks: ScheduleTask[] = rawGroups.map((group, idx) => {
      const s = new Date(projectStart);
      s.setDate(s.getDate() + idx * stepDays);
      const e = new Date(s);
      e.setDate(e.getDate() + durationDays);

      const sStr = s.toISOString().split("T")[0];
      const eStr = e.toISOString().split("T")[0];

      let cat = "Structural Concrete Columns Crew";
      if (group.startsWith("FLO_")) cat = "Concrete Slabs & Decks Crew";
      else if (group.startsWith("FOU_")) cat = "Substructure & Geotechnical Crew";
      else if (group.startsWith("FRA_")) cat = "Structural Framing & Steel Crew";
      else if (group.startsWith("WAL_")) cat = "Wall & Partition Masonry Crew";

      return {
        id: `task-${idx + 1}`,
        name: group, // Clean name matching Synchro 3D resource property!
        category: cat,
        startDate: sStr,
        endDate: eStr,
        status: idx === 0 ? "Completed" : idx === 1 ? "In Progress" : "Planned",
        elementIds: new Set([1000 + idx]),
        modelId: "snowdon-structural",
        unitCost: 350,
        quantity: 25,
        wbsCode: String(idx + 1),
        isCritical: idx < 10,
        totalFloat: idx < 10 ? 0 : 5
      };
    });

    const xml = ScheduleImportParsers.exportToMSPDI(tasks, "Snowdon Towers 4D Construction Sequence");

    expect(xml).toContain("<UID>0</UID>");
    expect(xml).toContain("<Milestone>0</Milestone>");
    expect(xml).toContain("<DurationFormat>7</DurationFormat>");
    expect(xml).toContain("<Duration>PT80H0M0S</Duration>");
    expect(xml).toContain("<Work>PT80H0M0S</Work>");
    expect(xml).toContain("<Name>COL_EPit</Name>");
    expect(xml).not.toContain("Text.SIMULATION:");
  });
});
