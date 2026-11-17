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
  ix: number;
  iy: number;
  iz: number;
}

/**
 * Pure 1D X-axis Sweep-and-Prune AABB broad-phase collision kernel.
 * Designed to execute inside a dedicated Web Worker (`clashWorker.ts`) OR
 * synchronously on the main thread when Workers are unavailable (e.g. Vitest).
 *
 * `boxes` layout: stride 6 Float64Array -> [minX, minY, minZ, maxX, maxY, maxZ].
 */
export function runSweepAndPrune(
  boxes: Float64Array,
  tasks: BroadPhaseRuleTask[],
  maxHits: number = 600
): { hits: BroadPhaseClashHit[]; candidatePairs: number } {
  const hits: BroadPhaseClashHit[] = [];
  const seenPairs = new Set<string>();
  let candidatePairs = 0;

  for (let t = 0; t < tasks.length; t++) {
    const task = tasks[t];
    const { groupA, groupB, hardTolerance, softBuffer, ruleIdx } = task;
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

      const aLeftBound = aMinX - softBuffer;
      const aRightBound = aMaxX + softBuffer;

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
        if (aMaxY + softBuffer < bMinY || bMaxY + softBuffer < aMinY) continue;

        const bMinZ = boxes[baseB + 2];
        const bMaxZ = boxes[baseB + 5];
        if (aMaxZ + softBuffer < bMinZ || bMaxZ + softBuffer < aMinZ) continue;

        candidatePairs++;

        const pairKey = idxA < idxB ? `${idxA}:${idxB}` : `${idxB}:${idxA}`;
        if (seenPairs.has(pairKey)) continue;

        const penX = Math.min(aMaxX, bMaxX) - Math.max(aMinX, bMinX);
        const penY = Math.min(aMaxY, bMaxY) - Math.max(aMinY, bMinY);
        const penZ = Math.min(aMaxZ, bMaxZ) - Math.max(aMinZ, bMinZ);
        const minPen = Math.min(penX, penY, penZ);

        const isHard = minPen >= hardTolerance;
        const isClearance = !isHard && softBuffer > 0 && minPen >= -softBuffer;
        if (!isHard && !isClearance) continue;

        seenPairs.add(pairKey);

        const overlap = isHard
          ? Number(minPen.toFixed(3))
          : Math.max(0.001, Number((minPen >= 0 ? minPen : softBuffer + minPen).toFixed(3)));

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
          ix,
          iy,
          iz,
        });

        if (hits.length >= maxHits) {
          return { hits, candidatePairs };
        }
      }
    }
  }

  return { hits, candidatePairs };
}
