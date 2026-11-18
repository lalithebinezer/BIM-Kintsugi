/**
 * CpmGraphSolver — Directed Acyclic Graph (DAG) Critical Path Method & WBS Rollup Engine.
 *
 * Computes Early Start/Finish, Late Start/Finish, Total Float, Free Float, Critical Path,
 * Out-of-Sequence alerts, and bottom-up WBS hierarchy rollups across FS/SS/FF/SF links with lags.
 */

export type DependencyType = "FS" | "SS" | "FF" | "SF";

export interface TaskDependency {
  predecessorId: string;
  type: DependencyType;
  /** Lag in calendar days (negative values represent lead / overlap). */
  lagDays?: number;
}

export interface CpmInputTask {
  id: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  durationDays?: number;
  predecessors?: TaskDependency[];
  parentId?: string;
  isSummary?: boolean;
  status?: "Planned" | "In Progress" | "Completed";
  unitCost?: number;
  quantity?: number;
  totalCost?: number;
}

export interface CpmTaskResult {
  id: string;
  earlyStartMs: number;
  earlyFinishMs: number;
  lateStartMs: number;
  lateFinishMs: number;
  earlyStart: string;
  earlyFinish: string;
  lateStart: string;
  lateFinish: string;
  totalFloatDays: number;
  freeFloatDays: number;
  isCritical: boolean;
  outOfSequence: boolean;
}

export interface CpmSolveReport {
  results: Map<string, CpmTaskResult>;
  topologicalOrder: string[];
  hasCycles: boolean;
  cycleTaskIds: string[];
  projectStartMs: number;
  projectFinishMs: number;
  criticalPathIds: string[];
  outOfSequenceIds: string[];
}

const MS_PER_DAY = 86_400_000;

function parseIsoMs(dateStr?: string): number {
  if (!dateStr) return NaN;
  const ms = Date.parse(dateStr);
  return Number.isFinite(ms) ? ms : NaN;
}

function toIsoDate(ms: number): string {
  return new Date(ms).toISOString().split("T")[0];
}

function getDurationMs(task: CpmInputTask): number {
  if (typeof task.durationDays === "number" && Number.isFinite(task.durationDays)) {
    return Math.max(0, Math.round(task.durationDays) * MS_PER_DAY);
  }
  const s = parseIsoMs(task.startDate);
  const e = parseIsoMs(task.endDate);
  if (Number.isFinite(s) && Number.isFinite(e) && e >= s) {
    return Math.max(MS_PER_DAY, e - s);
  }
  return MS_PER_DAY;
}

/**
 * Evaluates minimum Early Start required on successor from a predecessor relationship edge.
 */
function forwardEdgeStartConstraint(
  predEs: number,
  predEf: number,
  succDur: number,
  dep: TaskDependency
): number {
  const lagMs = (dep.lagDays ?? 0) * MS_PER_DAY;
  switch (dep.type) {
    case "SS":
      return predEs + lagMs;
    case "FF":
      return predEf + lagMs - succDur;
    case "SF":
      return predEs + lagMs - succDur;
    case "FS":
    default:
      return predEf + lagMs;
  }
}

/**
 * Evaluates maximum Late Finish allowed on predecessor from a successor relationship edge.
 */
function backwardEdgeFinishConstraint(
  succLs: number,
  succLf: number,
  predDur: number,
  dep: TaskDependency
): number {
  const lagMs = (dep.lagDays ?? 0) * MS_PER_DAY;
  switch (dep.type) {
    case "SS":
      return succLs - lagMs + predDur;
    case "FF":
      return succLf - lagMs;
    case "SF":
      return succLs - lagMs + predDur;
    case "FS":
    default:
      return succLs - lagMs;
  }
}

/**
 * Computes free slack contribution of a single outgoing edge before delaying the successor's ES.
 */
function computeEdgeFreeSlack(
  predEs: number,
  predEf: number,
  succEs: number,
  succEf: number,
  dep: TaskDependency
): number {
  const lagMs = (dep.lagDays ?? 0) * MS_PER_DAY;
  switch (dep.type) {
    case "SS":
      return succEs - (predEs + lagMs);
    case "FF":
      return succEf - (predEf + lagMs);
    case "SF":
      return succEf - (predEs + lagMs);
    case "FS":
    default:
      return succEs - (predEf + lagMs);
  }
}

/**
 * Solves Critical Path Method forward & backward passes over a task dependency DAG.
 * Gracefully detects cyclic dependencies without throwing and returns partial orderings.
 */
export function solveCpmGraph(
  tasks: CpmInputTask[],
  anchorStartMs?: number
): CpmSolveReport {
  const results = new Map<string, CpmTaskResult>();
  if (tasks.length === 0) {
    const now = anchorStartMs ?? Date.now();
    return {
      results,
      topologicalOrder: [],
      hasCycles: false,
      cycleTaskIds: [],
      projectStartMs: now,
      projectFinishMs: now,
      criticalPathIds: [],
      outOfSequenceIds: [],
    };
  }

  const byId = new Map<string, CpmInputTask>();
  for (const t of tasks) byId.set(t.id, t);

  // Identify summary parents so CPM operates cleanly on leaf work tasks
  const parentSet = new Set<string>();
  for (const t of tasks) {
    if (t.parentId && byId.has(t.parentId)) {
      parentSet.add(t.parentId);
    }
  }
  const leafTasks = tasks.filter((t) => !t.isSummary && !parentSet.has(t.id));
  const workSet = new Set(leafTasks.map((t) => t.id));

  // Derive project anchor start from earliest valid task start if omitted
  let projectAnchor = anchorStartMs ?? Infinity;
  if (!Number.isFinite(projectAnchor)) {
    for (const t of leafTasks) {
      const s = parseIsoMs(t.startDate);
      if (Number.isFinite(s) && s < projectAnchor) projectAnchor = s;
    }
    if (!Number.isFinite(projectAnchor)) projectAnchor = Date.now();
  }

  // Build adjacency graphs & indegrees
  const inDegree = new Map<string, number>();
  const outgoing = new Map<string, Array<{ successorId: string; dep: TaskDependency }>>();
  const incoming = new Map<string, TaskDependency[]>();

  for (const t of leafTasks) {
    inDegree.set(t.id, 0);
    outgoing.set(t.id, []);
    incoming.set(t.id, []);
  }

  for (const t of leafTasks) {
    if (!t.predecessors) continue;
    for (const dep of t.predecessors) {
      if (!workSet.has(dep.predecessorId) || dep.predecessorId === t.id) continue;
      inDegree.set(t.id, (inDegree.get(t.id) ?? 0) + 1);
      outgoing.get(dep.predecessorId)!.push({ successorId: t.id, dep });
      incoming.get(t.id)!.push(dep);
    }
  }

  // Kahn topological sort
  const queue: string[] = [];
  for (const t of leafTasks) {
    if ((inDegree.get(t.id) ?? 0) === 0) queue.push(t.id);
  }

  const topologicalOrder: string[] = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    topologicalOrder.push(u);
    for (const edge of outgoing.get(u) ?? []) {
      const nextDeg = (inDegree.get(edge.successorId) ?? 1) - 1;
      inDegree.set(edge.successorId, nextDeg);
      if (nextDeg === 0) queue.push(edge.successorId);
    }
  }

  const cycleTaskIds: string[] = [];
  const hasCycles = topologicalOrder.length < leafTasks.length;
  if (hasCycles) {
    const visited = new Set(topologicalOrder);
    const remaining = leafTasks
      .filter((t) => !visited.has(t.id))
      .sort((a, b) => (parseIsoMs(a.startDate) || 0) - (parseIsoMs(b.startDate) || 0));
    for (const t of remaining) {
      cycleTaskIds.push(t.id);
      topologicalOrder.push(t.id);
    }
  }

  // Forward pass
  const durMs = new Map<string, number>();
  const esMs = new Map<string, number>();
  const efMs = new Map<string, number>();

  for (const id of topologicalOrder) {
    const task = byId.get(id)!;
    const d = getDurationMs(task);
    durMs.set(id, d);

    const preds = incoming.get(id) ?? [];
    const ownStart = parseIsoMs(task.startDate);
    let es = Number.isFinite(ownStart) ? Math.max(projectAnchor, ownStart) : projectAnchor;

    if (preds.length > 0) {
      let constraintMax = projectAnchor;
      for (const dep of preds) {
        const pEs = esMs.get(dep.predecessorId);
        const pEf = efMs.get(dep.predecessorId);
        if (pEs === undefined || pEf === undefined) continue;
        const candidate = forwardEdgeStartConstraint(pEs, pEf, d, dep);
        if (candidate > constraintMax) constraintMax = candidate;
      }
      // Honor explicit manual start only if it is later than predecessor constraints (constraint-free otherwise)
      es = Number.isFinite(ownStart) && preds.length === 0 ? Math.max(projectAnchor, ownStart) : constraintMax;
      if (!hasCycles && Number.isFinite(ownStart) && ownStart > es) {
        es = Math.max(es, ownStart);
      }
    }

    const ef = es + d;
    esMs.set(id, es);
    efMs.set(id, ef);
  }

  let projectFinishMs = projectAnchor;
  for (const id of topologicalOrder) {
    const ef = efMs.get(id) ?? projectAnchor;
    if (ef > projectFinishMs) projectFinishMs = ef;
  }

  // Backward pass
  const lsMs = new Map<string, number>();
  const lfMs = new Map<string, number>();

  for (let i = topologicalOrder.length - 1; i >= 0; i--) {
    const id = topologicalOrder[i];
    const d = durMs.get(id) ?? MS_PER_DAY;
    const succs = outgoing.get(id) ?? [];

    let lf = projectFinishMs;
    if (succs.length > 0) {
      for (const edge of succs) {
        const sLs = lsMs.get(edge.successorId);
        const sLf = lfMs.get(edge.successorId);
        if (sLs === undefined || sLf === undefined) continue;
        const candidateLf = backwardEdgeFinishConstraint(sLs, sLf, d, edge.dep);
        if (candidateLf < lf) lf = candidateLf;
      }
    }

    const ls = lf - d;
    lfMs.set(id, lf);
    lsMs.set(id, ls);
  }

  // Build results & Out-of-Sequence audit
  const criticalPathIds: string[] = [];
  const outOfSequenceIds: string[] = [];

  for (const id of topologicalOrder) {
    const task = byId.get(id)!;
    const es = esMs.get(id)!;
    const ef = efMs.get(id)!;
    const ls = lsMs.get(id)!;
    const lf = lfMs.get(id)!;

    const totalFloatDays = Math.max(0, Math.round((ls - es) / MS_PER_DAY));
    const succs = outgoing.get(id) ?? [];
    let freeFloatMs = projectFinishMs - ef;
    if (succs.length > 0) {
      freeFloatMs = Infinity;
      for (const edge of succs) {
        const sEs = esMs.get(edge.successorId)!;
        const sEf = efMs.get(edge.successorId)!;
        const ff = computeEdgeFreeSlack(es, ef, sEs, sEf, edge.dep);
        if (ff < freeFloatMs) freeFloatMs = ff;
      }
      if (!Number.isFinite(freeFloatMs)) freeFloatMs = 0;
    } else {
      freeFloatMs = 0;
    }
    const freeFloatDays = Math.max(0, Math.round(freeFloatMs / MS_PER_DAY));
    const isCritical = totalFloatDays <= 0;
    if (isCritical) criticalPathIds.push(id);

    // Detect Out-of-Sequence execution (task started/completed before required predecessor completion)
    let outOfSequence = false;
    const taskStarted = task.status === "In Progress" || task.status === "Completed" || Boolean(task.actualStartDate);
    if (taskStarted) {
      const taskActualStart = parseIsoMs(task.actualStartDate);
      for (const dep of incoming.get(id) ?? []) {
        const pred = byId.get(dep.predecessorId);
        if (!pred) continue;
        if (dep.type === "SS") {
          if (pred.status === "Planned" && !pred.actualStartDate) {
            outOfSequence = true;
            break;
          }
        } else {
          if (pred.status !== "Completed") {
            outOfSequence = true;
            break;
          }
          const predActualEnd = parseIsoMs(pred.actualEndDate);
          if (Number.isFinite(taskActualStart) && Number.isFinite(predActualEnd) && taskActualStart < predActualEnd) {
            outOfSequence = true;
            break;
          }
        }
      }
    }
    if (outOfSequence) outOfSequenceIds.push(id);

    results.set(id, {
      id,
      earlyStartMs: es,
      earlyFinishMs: ef,
      lateStartMs: ls,
      lateFinishMs: lf,
      earlyStart: toIsoDate(es),
      earlyFinish: toIsoDate(ef),
      lateStart: toIsoDate(ls),
      lateFinish: toIsoDate(lf),
      totalFloatDays,
      freeFloatDays,
      isCritical,
      outOfSequence,
    });
  }

  return {
    results,
    topologicalOrder,
    hasCycles,
    cycleTaskIds,
    projectStartMs: projectAnchor,
    projectFinishMs,
    criticalPathIds,
    outOfSequenceIds,
  };
}

/**
 * Performs bottom-up WBS hierarchy rollups on tasks carrying `parentId` references:
 * aggregates summary start/end dates, cost, status, and critical-child propagation.
 */
export function rollupWbsHierarchy<
  T extends {
    id: string;
    parentId?: string;
    startDate: string;
    endDate: string;
    isSummary?: boolean;
    status?: "Planned" | "In Progress" | "Completed";
    totalCost?: number;
    unitCost?: number;
    quantity?: number;
    isCritical?: boolean;
    totalFloat?: number;
  }
>(tasks: T[]): T[] {
  const byId = new Map<string, T>();
  const children = new Map<string, T[]>();

  for (const t of tasks) {
    byId.set(t.id, t);
    children.set(t.id, []);
  }
  for (const t of tasks) {
    if (t.parentId && t.parentId !== t.id && byId.has(t.parentId)) {
      children.get(t.parentId)!.push(t);
    }
  }

  const visited = new Set<string>();
  const visiting = new Set<string>();

  const computeNode = (node: T): void => {
    if (visited.has(node.id) || visiting.has(node.id)) return;
    visiting.add(node.id);

    const kids = children.get(node.id) ?? [];
    if (kids.length > 0) {
      node.isSummary = true;
      let minStart = Infinity;
      let maxEnd = -Infinity;
      let costSum = 0;
      let anyCritical = false;
      let minFloat = Infinity;
      let allCompleted = true;
      let allPlanned = true;

      for (const kid of kids) {
        computeNode(kid);
        const ks = parseIsoMs(kid.startDate);
        const ke = parseIsoMs(kid.endDate);
        if (Number.isFinite(ks) && ks < minStart) minStart = ks;
        if (Number.isFinite(ke) && ke > maxEnd) maxEnd = ke;
        const kidCost = kid.totalCost ?? (kid.unitCost ?? 0) * Math.max(1, kid.quantity ?? 1);
        costSum += kidCost;
        if (kid.isCritical) anyCritical = true;
        if (typeof kid.totalFloat === "number" && kid.totalFloat < minFloat) {
          minFloat = kid.totalFloat;
        }
        if (kid.status !== "Completed") allCompleted = false;
        if (kid.status !== "Planned") allPlanned = false;
      }

      if (Number.isFinite(minStart)) node.startDate = toIsoDate(minStart);
      if (Number.isFinite(maxEnd)) node.endDate = toIsoDate(maxEnd);
      if (costSum > 0) node.totalCost = costSum;
      node.isCritical = anyCritical;
      if (Number.isFinite(minFloat)) node.totalFloat = minFloat;
      node.status = allCompleted ? "Completed" : allPlanned ? "Planned" : "In Progress";
    }

    visiting.delete(node.id);
    visited.add(node.id);
  };

  for (const t of tasks) {
    computeNode(t);
  }
  return tasks;
}
