import {
  runSweepAndPrune,
  type BroadPhaseClashHit,
  type BroadPhaseRuleTask,
} from "../core/clashBroadPhase";

export interface ClashWorkerRequest {
  jobId: number;
  boxes: Float64Array;
  tasks: BroadPhaseRuleTask[];
  maxHits?: number;
}

export interface ClashWorkerResponse {
  jobId: number;
  hits: BroadPhaseClashHit[];
  candidatePairs: number;
}

self.onmessage = (event: MessageEvent<ClashWorkerRequest>) => {
  const { jobId, boxes, tasks, maxHits } = event.data;
  const result = runSweepAndPrune(boxes, tasks, maxHits ?? 600);
  const reply: ClashWorkerResponse = {
    jobId,
    hits: result.hits,
    candidatePairs: result.candidatePairs,
  };
  self.postMessage(reply);
};
