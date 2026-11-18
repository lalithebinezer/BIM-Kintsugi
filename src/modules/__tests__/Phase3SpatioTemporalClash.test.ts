import * as THREE from "three";
import { describe, it, expect } from "vitest";
import {
  classifySlf,
  computeWorkspaceSlfSeries,
  type WorkspaceElementInfo,
} from "../WorkspaceCongestionAnalyzer";
import { runSweepAndPrune } from "../../core/clashBroadPhase";
import { computeBwmCriticalityIndex } from "../ClashDetector";
import { ClashToleranceInspector } from "../ClashToleranceInspector";
import type { ScheduleTask } from "../ScheduleManager";

describe("Phase 3: 4D Spatio-Temporal Clashes, SLF Congestion & BWM CI", () => {
  it("computes Space Loading Factor SLF and distinguishes staggered (Optimal) vs stacked (Extreme) zones", () => {
    const mkTask = (id: string, startDate: string, endDate: string, elemIds: number[]): ScheduleTask => ({
      id,
      name: id,
      category: "IFCWALL",
      startDate,
      endDate,
      status: "Planned",
      elementIds: new Set(elemIds),
      modelId: "m1",
      unitCost: 100,
      quantity: elemIds.length,
    });

    const elemLookup = new Map<string, WorkspaceElementInfo>();
    [1, 2, 3].forEach((eid) => {
      elemLookup.set(`m1:${eid}`, {
        storey: "Level 1",
        box: new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(4, 3, 4)),
      });
    });

    // Staggered across separate months inside a 400 m3 available zone -> SLF moderate/optimal
    const staggered = computeWorkspaceSlfSeries(
      [
        mkTask("t1", "2026-07-01", "2026-07-05", [1]),
        mkTask("t2", "2026-08-01", "2026-08-05", [2]),
      ],
      elemLookup,
      { workspaceBufferMeters: 0.5, storeyVolumesM3: { "Level 1": 400 } }
    );
    expect(staggered.length).toBeGreaterThan(0);
    expect(Math.max(...staggered.map((s) => s.slf))).toBeLessThanOrEqual(0.7);

    // Concurrent stacking of all 3 heavy workspaces inside a tight 150 m3 zone -> Extreme SLF > 0.90
    const stacked = computeWorkspaceSlfSeries(
      [
        mkTask("t1", "2026-07-01", "2026-07-06", [1]),
        mkTask("t2", "2026-07-01", "2026-07-06", [2]),
        mkTask("t3", "2026-07-01", "2026-07-06", [3]),
      ],
      elemLookup,
      { workspaceBufferMeters: 0.75, storeyVolumesM3: { "Level 1": 150 } }
    );
    expect(stacked[0].status).toBe("Extreme");
    expect(stacked[0].slf).toBeGreaterThan(0.9);
    expect(classifySlf(0.75)).toBe("Moderate");
  });

  it("prunes non-concurrent overlaps in temporal-4d SAP mode and handles 5000+ boxes swiftly", () => {
    // 2 overlapping AABBs at same XYZ: A in Jan, B in March (pruned in temporal-4d, detected in static-3d)
    const boxes = new Float64Array([
      0, 0, 0, 2, 2, 2,
      1, 1, 1, 3, 3, 3,
      1, 1, 1, 3, 3, 3, // C concurrent with B
    ]);
    const janStart = Date.parse("2026-01-01");
    const janEnd = Date.parse("2026-01-15");
    const marStart = Date.parse("2026-03-01");
    const marEnd = Date.parse("2026-03-15");

    const temporalWindows = new Float64Array([
      janStart, janEnd,
      marStart, marEnd,
      marStart, marEnd,
    ]);

    const tasks = [{ ruleIdx: 0, groupA: [0], groupB: [1, 2], hardTolerance: 0.01, softBuffer: 0 }];

    const staticRes = runSweepAndPrune(boxes, tasks, 100, { mode: "static-3d" });
    expect(staticRes.hits).toHaveLength(2);

    const temporalRes = runSweepAndPrune(boxes, tasks, 100, {
      mode: "temporal-4d",
      temporalWindows,
    });
    expect(temporalRes.hits).toHaveLength(0);
    expect(temporalRes.prunedNonConcurrent).toBe(2);

    // Performance check on 5,000 synthetic AABBs
    const count = 5000;
    const perfBoxes = new Float64Array(count * 6);
    const groupA: number[] = [];
    const groupB: number[] = [];
    for (let i = 0; i < count; i++) {
      const x = i * 2.5;
      perfBoxes[i * 6] = x;
      perfBoxes[i * 6 + 1] = 0;
      perfBoxes[i * 6 + 2] = 0;
      perfBoxes[i * 6 + 3] = x + 1;
      perfBoxes[i * 6 + 4] = 1;
      perfBoxes[i * 6 + 5] = 1;
      if (i % 2 === 0) groupA.push(i);
      else groupB.push(i);
    }
    const t0 = performance.now();
    runSweepAndPrune(perfBoxes, [{ ruleIdx: 0, groupA, groupB, hardTolerance: 0.01, softBuffer: 0 }], 600);
    expect(performance.now() - t0).toBeLessThan(250);
  });

  it("computes exact Six-Parameter BWM Clash Criticality Index (CI)", () => {
    // CI = 0.15 * 1.8 * 1.5 * 1.4 * 4 * 0.5 * 1.2 = 1.3608 => 1.36 (Medium)
    const med = computeBwmCriticalityIndex({
      penetrationMeters: 0.15,
      structuralWeight: 1.8,
      mepTimeWeight: 1.5,
      mepCostWeight: 1.4,
      localDensityN: 4,
      volumeRatioR: 0.5,
      zoneCriticalityU: 1.2,
    });
    expect(med.ci).toBe(1.36);
    expect(med.tier).toBe("Medium");

    const crit = computeBwmCriticalityIndex({
      penetrationMeters: 0.25,
      structuralWeight: 1.8,
      mepTimeWeight: 1.8,
      mepCostWeight: 1.5,
      localDensityN: 5,
      volumeRatioR: 0.6,
      zoneCriticalityU: 1.2,
    });
    expect(crit.ci).toBeGreaterThan(2.0);
    expect(crit.tier).toBe("Critical");
  });

  it("syncs ClashToleranceInspector from live ClashDetector outputs", () => {
    const inspector = ClashToleranceInspector.getInstance();
    inspector.syncFromClashResults([
      {
        id: "c-live-1",
        elementA: { expressId: 700, name: "Live Duct 400", category: "IFCDUCTSEGMENT" },
        elementB: { expressId: 800, name: "Live Girder W14", category: "IFCBEAM" },
        overlapDistance: 0.11,
        axisPenetration: [0.4, 0.11, 0.3],
        criticalityIndex: 2.84,
        severity: "critical",
        intersectionPoint: [5, 3, -2],
      },
    ]);
    const list = inspector.getToleranceClashes();
    expect(list).toHaveLength(1);
    expect(list[0].penetrationDepthMm).toBe(110);
    expect(list[0].deltaY).toBe(110);
    expect(list[0].severity).toBe("High");
  });
});
