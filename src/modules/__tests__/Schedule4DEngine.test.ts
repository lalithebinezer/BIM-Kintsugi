import { describe, it, expect, beforeEach } from "vitest";
import { Schedule4DEngine, type ElementSchedule } from "../Schedule4DEngine";

describe("Schedule4DEngine", () => {
  let engine: Schedule4DEngine;

  const mockElements: ElementSchedule[] = [
    {
      modelId: "m1",
      expressId: 101,
      task: "Foundations",
      group: "1. Foundations",
      start: new Date("2026-06-01").getTime(),
      end: new Date("2026-06-10").getTime(),
      cost: 10000,
    },
    {
      modelId: "m1",
      expressId: 102,
      task: "Columns",
      group: "2. Superstructure",
      start: new Date("2026-06-11").getTime(),
      end: new Date("2026-06-20").getTime(),
      cost: 20000,
    },
    {
      modelId: "m1",
      expressId: 103,
      task: "Slabs",
      group: "2. Superstructure",
      start: new Date("2026-06-21").getTime(),
      end: new Date("2026-06-30").getTime(),
      cost: 30000,
    },
  ];

  beforeEach(() => {
    engine = new Schedule4DEngine();
    engine.setElements(mockElements);
  });

  it("should initialize and compute project boundaries", () => {
    expect(engine.size).toBe(3);
    const bounds = engine.getBounds();
    expect(bounds).not.toBeNull();
    expect(bounds!.min.toISOString().slice(0, 10)).toBe("2026-06-01");
    expect(bounds!.max.toISOString().slice(0, 10)).toBe("2026-06-30");
  });

  it("should partition elements into Planned, In Progress, Completed buckets", () => {
    // Before start: all planned
    const before = engine.getStatusBuckets(new Date("2026-05-30").getTime());
    expect(before.counts.planned).toBe(3);
    expect(before.counts.inProgress).toBe(0);
    expect(before.counts.completed).toBe(0);

    // During foundations
    const mid1 = engine.getStatusBuckets(new Date("2026-06-05").getTime());
    expect(mid1.counts.planned).toBe(2);
    expect(mid1.counts.inProgress).toBe(1);
    expect(mid1.counts.completed).toBe(0);
    expect(mid1.inProgress["m1"]).toBeDefined();
    expect(mid1.inProgress["m1"].has(101)).toBe(true);

    // During columns: foundations complete, columns in progress, slabs planned
    const mid2 = engine.getStatusBuckets(new Date("2026-06-15").getTime());
    expect(mid2.counts.completed).toBe(1);
    expect(mid2.counts.inProgress).toBe(1);
    expect(mid2.counts.planned).toBe(1);
    expect(mid2.completed["m1"].has(101)).toBe(true);
    expect(mid2.inProgress["m1"].has(102)).toBe(true);
    expect(mid2.planned["m1"].has(103)).toBe(true);

    // After all: all completed
    const after = engine.getStatusBuckets(new Date("2026-07-05").getTime());
    expect(after.counts.completed).toBe(3);
    expect(after.counts.inProgress).toBe(0);
    expect(after.counts.planned).toBe(0);
  });

  it("should detect boundary changes to skip redundant re-renders", () => {
    const d1 = new Date("2026-06-03").getTime();
    const d2 = new Date("2026-06-04").getTime();
    // Both d1 and d2 fall within the same boundary interval (during task 1)
    expect(engine.getBoundaryIndex(d1)).toBe(engine.getBoundaryIndex(d2));

    const d3 = new Date("2026-06-12").getTime();
    // d3 has crossed boundary into task 2
    expect(engine.getBoundaryIndex(d3)).not.toBe(engine.getBoundaryIndex(d1));
  });

  it("should calculate Earned Value metrics correctly", () => {
    const totalBudget = 10000 + 20000 + 30000; // 60,000

    // Before start: PV = 0, EV = 0
    const evBefore = engine.getEarnedValue(new Date("2026-05-30").getTime());
    expect(evBefore.bac).toBe(totalBudget);
    expect(evBefore.pv).toBe(0);
    expect(evBefore.ev).toBe(0);
    expect(evBefore.spi).toBe(1);

    // After task 1 complete and task 2 50% complete (2026-06-15.5 UTC)
    // Task 1: 10,000. Task 2: 50% of 20,000 = 10,000. Total PV = 20,000
    const evMid = engine.getEarnedValue(new Date("2026-06-15T12:00:00Z").getTime());
    expect(evMid.bac).toBe(totalBudget);
    expect(Math.round(evMid.pv)).toBe(20000);
    expect(Math.round(evMid.plannedPercent)).toBe(33); // 20000/60000 = 33.3%

    // All completed
    const evAfter = engine.getEarnedValue(new Date("2026-07-05").getTime());
    expect(evAfter.pv).toBe(totalBudget);
    expect(evAfter.ev).toBe(totalBudget);
    expect(evAfter.plannedPercent).toBe(100);
    expect(evAfter.earnedPercent).toBe(100);
    expect(evAfter.spi).toBe(1);
  });

  it("should aggregate unique milestones by group/task", () => {
    const milestones = engine.getMilestones();
    expect(milestones.length).toBe(2); // "1. Foundations", "2. Superstructure"
    expect(milestones[0].name).toBe("1. Foundations");
    expect(milestones[0].elementCount).toBe(1);
    expect(milestones[0].cost).toBe(10000);

    expect(milestones[1].name).toBe("2. Superstructure");
    expect(milestones[1].elementCount).toBe(2);
    expect(milestones[1].cost).toBe(50000);
  });

  it("should calculate total project weeks and week index correctly", () => {
    const min = new Date("2026-06-01");
    const max = new Date("2026-06-30"); // 30 days -> 5 weeks
    const weeks = Schedule4DEngine.totalWeeks(min, max);
    expect(weeks).toBe(5);

    expect(Schedule4DEngine.weekOf(new Date("2026-06-01"), min, max)).toBe(1);
    expect(Schedule4DEngine.weekOf(new Date("2026-06-08"), min, max)).toBe(2);
    expect(Schedule4DEngine.weekOf(new Date("2026-06-25"), min, max)).toBe(4);
    expect(Schedule4DEngine.weekOf(new Date("2026-06-30"), min, max)).toBe(5);
  });
});
