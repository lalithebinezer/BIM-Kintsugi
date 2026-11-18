import * as THREE from "three";
import { describe, it, expect } from "vitest";
import {
  CASCADE_INDICATORS,
  COLORBREWER_SCHEMES,
  evaluateCascadeLens,
  extractIndicatorValue,
  type CascadeIndicatorId,
} from "../Cascade4DAnalytics";
import {
  buildElevatedArcSegments,
  classifyDependencyArcs,
} from "../DependencyVectorOverlay";
import { AppearanceProfileEngine } from "../AppearanceProfileEngine";
import type { ScheduleTask } from "../ScheduleManager";

describe("Phase 2: CasCADe 4D Visual Analytics & 3D Dependency Vectors", () => {
  const mkTask = (overrides: Partial<ScheduleTask>): ScheduleTask => ({
    id: "t",
    name: "Task",
    category: "IFCWALL",
    startDate: "2026-07-01",
    endDate: "2026-07-11",
    status: "Planned",
    elementIds: new Set([1]),
    modelId: "m1",
    unitCost: 100,
    quantity: 1,
    ...overrides,
  });

  it("extracts exact values across all 12 CasCADe schedule indicators", () => {
    const task = mkTask({
      id: "t1",
      baselineStartDate: "2026-07-01",
      baselineEndDate: "2026-07-06", // 5d base
      actualStartDate: "2026-07-03",   // +2d start delta
      actualEndDate: "2026-07-10",     // 7d actual (+2d dur delta, +4d finish delta)
      freeFloat: 1,
      totalFloat: 3,
      customMetric: 4250,
    });

    expect(CASCADE_INDICATORS).toHaveLength(12);
    const results: Record<CascadeIndicatorId, number> = {
      baselineStart: extractIndicatorValue(task, "baselineStart"),
      baselineFinish: extractIndicatorValue(task, "baselineFinish"),
      actualStart: extractIndicatorValue(task, "actualStart"),
      actualFinish: extractIndicatorValue(task, "actualFinish"),
      baselineDuration: extractIndicatorValue(task, "baselineDuration"),
      actualDuration: extractIndicatorValue(task, "actualDuration"),
      deltaDuration: extractIndicatorValue(task, "deltaDuration"),
      deltaStart: extractIndicatorValue(task, "deltaStart"),
      deltaFinish: extractIndicatorValue(task, "deltaFinish"),
      freeSlack: extractIndicatorValue(task, "freeSlack"),
      totalSlack: extractIndicatorValue(task, "totalSlack"),
      customMetric: extractIndicatorValue(task, "customMetric"),
    };

    expect(results.baselineDuration).toBe(5);
    expect(results.actualDuration).toBe(7);
    expect(results.deltaDuration).toBe(2);
    expect(results.deltaStart).toBe(2);
    expect(results.deltaFinish).toBe(4);
    expect(results.freeSlack).toBe(1);
    expect(results.totalSlack).toBe(3);
    expect(results.customMetric).toBe(4250);
  });

  it("buckets elements into 5 ColorBrewer bands and isolates non-matching elements into ghostMap", () => {
    const tasks: ScheduleTask[] = [
      mkTask({ id: "a", totalFloat: 0, elementIds: new Set([10, 11]) }),
      mkTask({ id: "b", totalFloat: 5, elementIds: new Set([20]) }),
      mkTask({ id: "c", totalFloat: 10, elementIds: new Set([30, 31, 32]) }),
    ];

    const full = evaluateCascadeLens(tasks, {
      indicator: "totalSlack",
      scheme: "Spectral",
    });
    expect(full.bands).toHaveLength(5);
    expect(full.bands[0].hex).toBe(COLORBREWER_SCHEMES.Spectral[0]);
    expect(full.bands[0].elementCount).toBe(2);
    expect(full.bands[4].elementCount).toBe(3);
    expect(Object.keys(full.ghostMap)).toHaveLength(0);

    // Isolate band 0 (critical totalFloat = 0)
    const isolated = evaluateCascadeLens(tasks, {
      indicator: "totalSlack",
      scheme: "Spectral",
      isolatedBandIndex: 0,
    });
    expect(isolated.bands[0].elementCount).toBe(2);
    expect(isolated.bands[4].elementCount).toBe(0);
    expect(isolated.ghostMap["m1"].size).toBe(4); // elements 20, 30, 31, 32
  });

  it("classifies 3D dependency arcs cleanly into critical, pred/succ, and out-of-sequence channels", () => {
    const tasks: ScheduleTask[] = [
      mkTask({ id: "p", isCritical: true }),
      mkTask({
        id: "cur",
        isCritical: true,
        predecessors: [{ predecessorId: "p", type: "FS" }],
      }),
      mkTask({
        id: "s",
        isCritical: false,
        outOfSequence: true,
        predecessors: [{ predecessorId: "cur", type: "FS" }],
      }),
    ];

    const centroids = new Map<string, [number, number, number]>([
      ["p", [0, 0, 0]],
      ["cur", [10, 0, 0]],
      ["s", [20, 0, 0]],
    ]);

    const arcs = classifyDependencyArcs(tasks, centroids, {
      showCriticalPath: true,
      showPredSucc: true,
      showOutOfSequence: true,
      activeTaskId: "cur",
    });

    expect(arcs.some((a) => a.fromTaskId === "p" && a.toTaskId === "cur" && a.channel === "predecessor")).toBe(true);
    expect(arcs.some((a) => a.fromTaskId === "cur" && a.toTaskId === "s" && a.channel === "successor")).toBe(true);
    expect(arcs.some((a) => a.fromTaskId === "cur" && a.toTaskId === "s" && a.channel === "outOfSequence")).toBe(true);

    const verts = buildElevatedArcSegments([0, 0, 0], [10, 0, 0], 4);
    expect(verts).toHaveLength(4 * 6); // 4 segments * 2 endpoints * 3 coords
    expect(verts[4]).toBeGreaterThan(0); // midpoint elevated in +Y
  });

  it("configures alphaHash and ghost-layer translucency on materials without depth-sorting flicker", () => {
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const engine = AppearanceProfileEngine.getInstance();

    engine.applyTranslucentGhostPass(mat, 0.25, "alpha-hash");
    expect((mat as any).alphaHash).toBe(true);
    expect(mat.transparent).toBe(false);
    expect(mat.depthWrite).toBe(true);

    engine.applyTranslucentGhostPass(mat, 0.2, "ghost-layer");
    expect((mat as any).alphaHash).toBe(false);
    expect(mat.transparent).toBe(true);
    expect(mat.depthWrite).toBe(false);
  });
});
