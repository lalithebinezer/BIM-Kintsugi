/**
 * DependencyVectorOverlay — 3D Centroid-to-Centroid 4D Logic Arcs.
 *
 * Renders batched Three.js LineSegments visualizing schedule topology directly inside
 * the 3D scene: Critical Path (red), Predecessors (green), Successors (blue),
 * and Out-of-Sequence violations (amber-orange).
 */

import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { FragmentIndexer } from "../core/FragmentIndexer";
import { ResourceLifecycleManager } from "../core/ResourceLifecycleManager";
import type { ScheduleTask } from "./ScheduleManager";

export type DependencyEdgeChannel = "critical" | "predecessor" | "successor" | "outOfSequence";

export interface DependencyArcConfig {
  showCriticalPath: boolean;
  showPredSucc: boolean;
  showOutOfSequence: boolean;
  activeTaskId?: string | null;
  maxArcs?: number;
}

export interface ComputedDependencyArc {
  fromTaskId: string;
  toTaskId: string;
  channel: DependencyEdgeChannel;
  from: [number, number, number];
  to: [number, number, number];
}

const CHANNEL_COLORS: Record<DependencyEdgeChannel, number> = {
  critical: 0xef4444,
  predecessor: 0x22c55e,
  successor: 0x3b82f6,
  outOfSequence: 0xf59e0b,
};

const OVERLAY_GROUP_NAME = "BIM_4D_Dependency_Arcs";
const RESOURCE_TAG = "4d-dependency-arcs";

/**
 * Pure geometry builder: samples an elevated quadratic Bezier curve into point pairs
 * for batched `THREE.LineSegments` rendering.
 */
export function buildElevatedArcSegments(
  from: [number, number, number],
  to: [number, number, number],
  segments: number = 8
): number[] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const dz = to[2] - from[2];
  const dist = Math.hypot(dx, dy, dz);
  const archLift = Math.max(0.6, Math.min(8.0, dist * 0.22));
  const midX = (from[0] + to[0]) * 0.5;
  const midY = Math.max(from[1], to[1]) + archLift;
  const midZ = (from[2] + to[2]) * 0.5;

  const verts: number[] = [];
  let prevX = from[0];
  let prevY = from[1];
  let prevZ = from[2];

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const u = 1 - t;
    const x = u * u * from[0] + 2 * u * t * midX + t * t * to[0];
    const y = u * u * from[1] + 2 * u * t * midY + t * t * to[1];
    const z = u * u * from[2] + 2 * u * t * midZ + t * t * to[2];
    verts.push(prevX, prevY, prevZ, x, y, z);
    prevX = x;
    prevY = y;
    prevZ = z;
  }

  return verts;
}

/**
 * Classifies task dependency edges into visual channels without touching Three.js DOM state.
 */
export function classifyDependencyArcs(
  tasks: ScheduleTask[],
  centroids: Map<string, [number, number, number]>,
  config: DependencyArcConfig
): ComputedDependencyArc[] {
  const byId = new Map<string, ScheduleTask>();
  for (const t of tasks) byId.set(t.id, t);

  const activeId = config.activeTaskId ?? null;
  const activeTask = activeId ? byId.get(activeId) : undefined;
  const activePredIds = new Set((activeTask?.predecessors ?? []).map((d) => d.predecessorId));

  const arcs: ComputedDependencyArc[] = [];
  const cap = config.maxArcs ?? 600;

  for (const succ of tasks) {
    if (!succ.predecessors || succ.predecessors.length === 0) continue;
    const toPt = centroids.get(succ.id);
    if (!toPt) continue;

    for (const dep of succ.predecessors) {
      if (arcs.length >= cap) break;
      const pred = byId.get(dep.predecessorId);
      const fromPt = centroids.get(dep.predecessorId);
      if (!pred || !fromPt) continue;

      if (config.showOutOfSequence && succ.outOfSequence) {
        arcs.push({
          fromTaskId: pred.id,
          toTaskId: succ.id,
          channel: "outOfSequence",
          from: fromPt,
          to: toPt,
        });
      }

      if (config.showPredSucc && activeId) {
        if (succ.id === activeId && activePredIds.has(pred.id)) {
          arcs.push({
            fromTaskId: pred.id,
            toTaskId: succ.id,
            channel: "predecessor",
            from: fromPt,
            to: toPt,
          });
          continue;
        }
        if (pred.id === activeId) {
          arcs.push({
            fromTaskId: pred.id,
            toTaskId: succ.id,
            channel: "successor",
            from: fromPt,
            to: toPt,
          });
          continue;
        }
      }

      if (config.showCriticalPath && pred.isCritical && succ.isCritical) {
        arcs.push({
          fromTaskId: pred.id,
          toTaskId: succ.id,
          channel: "critical",
          from: fromPt,
          to: toPt,
        });
      }
    }
    if (arcs.length >= cap) break;
  }

  return arcs;
}

export class DependencyVectorOverlay {
  private static instance: DependencyVectorOverlay | null = null;
  private centroidCache: Map<string, [number, number, number]> = new Map();
  private group: THREE.Group | null = null;

  private constructor() {}

  public static getInstance(): DependencyVectorOverlay {
    if (!DependencyVectorOverlay.instance) {
      DependencyVectorOverlay.instance = new DependencyVectorOverlay();
    }
    return DependencyVectorOverlay.instance;
  }

  /**
   * Resolves average 3D world centroid for each task from FragmentIndexer cached AABBs.
   */
  public async resolveTaskCentroids(tasks: ScheduleTask[]): Promise<Map<string, [number, number, number]>> {
    const engine = BimEngine.getInstance();
    const indexer = FragmentIndexer.getInstance();
    const elementBoxes = new Map<string, THREE.Box3>();

    if ((engine.fragments as any)?.initialized && engine.fragments?.list) {
      for (const [modelId, model] of engine.fragments.list) {
        const indexed = await indexer.indexModel(modelId, model, {
          includeBoxes: true,
          includePsets: false,
        });
        for (const el of indexed.elements) {
          if (el.box) {
            elementBoxes.set(`${modelId}:${el.expressId}`, el.box);
          }
        }
      }
    }

    const tmpCenter = new THREE.Vector3();
    for (const task of tasks) {
      if (task.elementIds.size === 0) continue;
      let sx = 0;
      let sy = 0;
      let sz = 0;
      let count = 0;
      const mId = task.modelId || "default-model";

      for (const eid of task.elementIds) {
        const box = elementBoxes.get(`${mId}:${eid}`);
        if (!box) continue;
        box.getCenter(tmpCenter);
        sx += tmpCenter.x;
        sy += tmpCenter.y;
        sz += tmpCenter.z;
        count++;
      }

      if (count > 0) {
        this.centroidCache.set(task.id, [sx / count, sy / count, sz / count]);
      }
    }

    return this.centroidCache;
  }

  public async render(tasks: ScheduleTask[], config: DependencyArcConfig): Promise<number> {
    this.clear();
    if (!config.showCriticalPath && !config.showPredSucc && !config.showOutOfSequence) {
      return 0;
    }

    const centroids = await this.resolveTaskCentroids(tasks);
    const arcs = classifyDependencyArcs(tasks, centroids, config);
    if (arcs.length === 0) return 0;

    const scene = BimEngine.getInstance().world?.scene?.three;
    if (!scene) return arcs.length;

    const group = new THREE.Group();
    group.name = OVERLAY_GROUP_NAME;
    const lifecycle = ResourceLifecycleManager.getInstance();

    const byChannel: Record<DependencyEdgeChannel, number[]> = {
      critical: [],
      predecessor: [],
      successor: [],
      outOfSequence: [],
    };

    for (const arc of arcs) {
      const segs = buildElevatedArcSegments(arc.from, arc.to, 8);
      byChannel[arc.channel].push(...segs);
    }

    (Object.keys(byChannel) as DependencyEdgeChannel[]).forEach((channel) => {
      const verts = byChannel[channel];
      if (verts.length === 0) return;

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      const mat = new THREE.LineBasicMaterial({
        color: CHANNEL_COLORS[channel],
        transparent: true,
        opacity: 0.92,
        depthTest: true,
      });
      const lines = new THREE.LineSegments(geo, mat);
      lines.renderOrder = 3;
      group.add(lines);

      lifecycle.track(geo, RESOURCE_TAG);
      lifecycle.track(mat, RESOURCE_TAG);
    });

    scene.add(group);
    this.group = group;
    return arcs.length;
  }

  public clear(): void {
    const lifecycle = ResourceLifecycleManager.getInstance();
    lifecycle.releaseByTag(RESOURCE_TAG);
    if (this.group) {
      this.group.parent?.remove(this.group);
      this.group = null;
    }
    const scene = BimEngine.getInstance().world?.scene?.three;
    if (scene) {
      const orphan = scene.getObjectByName(OVERLAY_GROUP_NAME);
      if (orphan) orphan.parent?.remove(orphan);
    }
  }

  public invalidateCache(): void {
    this.centroidCache.clear();
  }
}
