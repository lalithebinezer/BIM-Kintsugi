export type ClashScanMode = "static-3d" | "temporal-4d" | "workspace-4d";

export interface BroadPhaseRuleTask {
  ruleIdx: number;
  groupA: number[];
  groupB: number[];
  hardTolerance: number;
  softBuffer: number;
}

export interface BroadPhaseClashHit {
  idxA: number;
  idxB: number;
  ruleIdx: number;
  isHard: boolean;
  severity: "critical" | "major" | "clearance";
  overlap: number;
  penX: number;
  penY: number;
  penZ: number;
  volumeRatio: number;
  temporalConcurrent: boolean;
  ix: number;
  iy: number;
  iz: number;
}

/**
 * Pure 1D X-axis Sweep-and-Prune AABB broad-phase collision kernel.
 * Supports static 3D checks and optional 4D temporal interval filtering
 * (`temporalWindows`: stride 2 Float64Array `[startMs, endMs]`).
 *
 * `boxes` layout: stride 6 Float64Array -> [minX, minY, minZ, maxX, maxY, maxZ].
 */
export function runSweepAndPrune(
  boxes: Float64Array,
  tasks: BroadPhaseRuleTask[],
  maxHits: number = 600,
  options?: {
    mode?: ClashScanMode;
    temporalWindows?: Float64Array;
    workspacePaddingM?: number;
  }
): { hits: BroadPhaseClashHit[]; candidatePairs: number; prunedNonConcurrent: number } {
  const hits: BroadPhaseClashHit[] = [];
  const seenPairs = new Set<string>();
  let candidatePairs = 0;
  let prunedNonConcurrent = 0;
  const mode = options?.mode ?? "static-3d";
  const windows = options?.temporalWindows;
  const extraPad = mode === "workspace-4d" ? Math.max(0, options?.workspacePaddingM ?? 0.35) : 0;

  for (let t = 0; t < tasks.length; t++) {
    const task = tasks[t];
    const { groupA, groupB, hardTolerance, softBuffer, ruleIdx } = task;
    const effectiveBuffer = softBuffer + extraPad;
    if (!groupA.length || !groupB.length) continue;

    // Sort element index lists along world X min coordinate
    const sortedA = groupA.slice().sort((a, b) => boxes[a * 6] - boxes[b * 6]);
    const sortedB = groupB.slice().sort((a, b) => boxes[a * 6] - boxes[b * 6]);

    let bStart = 0;
    const lenA = sortedA.length;
    const lenB = sortedB.length;

    for (let i = 0; i < lenA; i++) {
      const idxA = sortedA[i];
      const baseA = idxA * 6;
      const aMinX = boxes[baseA];
      const aMinY = boxes[baseA + 1];
      const aMinZ = boxes[baseA + 2];
      const aMaxX = boxes[baseA + 3];
      const aMaxY = boxes[baseA + 4];
      const aMaxZ = boxes[baseA + 5];

      const aLeftBound = aMinX - effectiveBuffer;
      const aRightBound = aMaxX + effectiveBuffer;

      // Advance left sweep cursor past any B intervals strictly to the left of A
      while (bStart < lenB && boxes[sortedB[bStart] * 6 + 3] < aLeftBound) {
        bStart++;
      }

      for (let j = bStart; j < lenB; j++) {
        const idxB = sortedB[j];
        const baseB = idxB * 6;
        const bMinX = boxes[baseB];

        // Sorted invariant: remaining B items start beyond A's padded maxX
        if (bMinX > aRightBound) break;
        if (idxA === idxB) continue;

        const bMaxX = boxes[baseB + 3];
        if (bMaxX < aLeftBound) continue;

        const bMinY = boxes[baseB + 1];
        const bMaxY = boxes[baseB + 4];
        if (aMaxY + effectiveBuffer < bMinY || bMaxY + effectiveBuffer < aMinY) continue;

        const bMinZ = boxes[baseB + 2];
        const bMaxZ = boxes[baseB + 5];
        if (aMaxZ + effectiveBuffer < bMinZ || bMaxZ + effectiveBuffer < aMinZ) continue;

        candidatePairs++;

        // 4D Spatio-Temporal window overlap check when active in temporal/workspace mode
        let temporalConcurrent = true;
        if (mode !== "static-3d" && windows && windows.length > Math.max(idxA, idxB) * 2 + 1) {
          const sA = windows[idxA * 2];
          const eA = windows[idxA * 2 + 1];
          const sB = windows[idxB * 2];
          const eB = windows[idxB * 2 + 1];
          if (sA > 0 && eA >= sA && sB > 0 && eB >= sB) {
            temporalConcurrent = !(eA < sB || eB < sA);
            if (!temporalConcurrent) {
              prunedNonConcurrent++;
              continue;
            }
          }
        }

        const pairKey = idxA < idxB ? `${idxA}:${idxB}` : `${idxB}:${idxA}`;
        if (seenPairs.has(pairKey)) continue;

        const penX = Math.min(aMaxX, bMaxX) - Math.max(aMinX, bMinX);
        const penY = Math.min(aMaxY, bMaxY) - Math.max(aMinY, bMinY);
        const penZ = Math.min(aMaxZ, bMaxZ) - Math.max(aMinZ, bMinZ);
        const minPen = Math.min(penX, penY, penZ);

        const isHard = minPen >= hardTolerance;
        const isClearance = !isHard && effectiveBuffer > 0 && minPen >= -effectiveBuffer;
        if (!isHard && !isClearance) continue;

        seenPairs.add(pairKey);

        const overlap = isHard
          ? Number(minPen.toFixed(3))
          : Math.max(0.001, Number((minPen >= 0 ? minPen : effectiveBuffer + minPen).toFixed(3)));

        const interVol = Math.max(0, penX) * Math.max(0, penY) * Math.max(0, penZ);
        const volA = Math.max(0.001, (aMaxX - aMinX) * (aMaxY - aMinY) * (aMaxZ - aMinZ));
        const volB = Math.max(0.001, (bMaxX - bMinX) * (bMaxY - bMinY) * (bMaxZ - bMinZ));
        const volumeRatio = Number(Math.max(0.15, Math.min(1.5, interVol / Math.min(volA, volB) + 0.5)).toFixed(3));

        const ix = (Math.max(aMinX, bMinX) + Math.min(aMaxX, bMaxX)) * 0.5;
        const iy = (Math.max(aMinY, bMinY) + Math.min(aMaxY, bMaxY)) * 0.5;
        const iz = (Math.max(aMinZ, bMinZ) + Math.min(aMaxZ, bMaxZ)) * 0.5;

        const severity: "critical" | "major" | "clearance" = isHard
          ? minPen >= 0.05
            ? "critical"
            : "major"
          : "clearance";

        hits.push({
          idxA,
          idxB,
          ruleIdx,
          isHard,
          severity,
          overlap,
          penX: Number(Math.max(0, penX).toFixed(3)),
          penY: Number(Math.max(0, penY).toFixed(3)),
          penZ: Number(Math.max(0, penZ).toFixed(3)),
          volumeRatio,
          temporalConcurrent,
          ix,
          iy,
          iz,
        });

        if (hits.length >= maxHits) {
          return { hits, candidatePairs, prunedNonConcurrent };
        }
      }
    }
  }

  return { hits, candidatePairs, prunedNonConcurrent };
}
