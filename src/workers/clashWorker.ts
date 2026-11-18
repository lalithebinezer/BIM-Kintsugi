import {
  runSweepAndPrune,
  type BroadPhaseClashHit,
  type BroadPhaseRuleTask,
  type ClashScanMode,
} from "../core/clashBroadPhase";

export interface ClashWorkerRequest {
  jobId: number;
  boxes: Float64Array;
  tasks: BroadPhaseRuleTask[];
  maxHits?: number;
  mode?: ClashScanMode;
  temporalWindows?: Float64Array;
  workspacePaddingM?: number;
}

export interface ClashWorkerResponse {
  jobId: number;
  hits: BroadPhaseClashHit[];
  candidatePairs: number;
  prunedNonConcurrent: number;
}

self.onmessage = (event: MessageEvent<ClashWorkerRequest>) => {
  const { jobId, boxes, tasks, maxHits, mode, temporalWindows, workspacePaddingM } = event.data;
  const result = runSweepAndPrune(boxes, tasks, maxHits ?? 600, {
    mode,
    temporalWindows,
    workspacePaddingM,
  });
  const reply: ClashWorkerResponse = {
    jobId,
    hits: result.hits,
    candidatePairs: result.candidatePairs,
    prunedNonConcurrent: result.prunedNonConcurrent,
  };
  self.postMessage(reply);
};
