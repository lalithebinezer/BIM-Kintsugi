/**
 * WorkspaceCongestionAnalyzer — Dynamic 4D Trade Workspace & Space Loading Factor (SLF).
 *
 * Implements Hosny et al.'s Space Loading Factor:
 *   SLF(z, dt) = Sum(V_req,i(t)) / V_avail,z
 * Thresholds:
 *   - SLF <= 0.70 : Optimal zone availability
 *   - 0.70 < SLF <= 0.90 : Moderate workspace congestion risk
 *   - SLF > 0.90 : Extreme trade congestion / safety hazard
 */

import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { FragmentIndexer } from "../core/FragmentIndexer";
import { ResourceLifecycleManager } from "../core/ResourceLifecycleManager";
import { AppearanceProfileEngine } from "./AppearanceProfileEngine";
import type { ScheduleTask } from "./ScheduleManager";

export type CongestionStatus = "Optimal" | "Moderate" | "Extreme";

export interface StoreySlfPoint {
  storey: string;
  dateIso: string;
  windowEndIso: string;
  slf: number;
  status: CongestionStatus;
  activeTaskIds: string[];
  activeTaskCount: number;
  requiredVolumeM3: number;
  availableVolumeM3: number;
}

export interface WorkspaceElementInfo {
  storey?: string;
  volumeM3?: number;
  box?: THREE.Box3 | null;
}

export interface SlfAnalysisOptions {
  /** Workspace inflation clearance around active elements in meters (default 0.75m). */
  workspaceBufferMeters?: number;
  /** Time bucket step size in days (default 7 days). */
  stepDays?: number;
  /** Clear zone ceiling height fallback in meters (default 3.2m). */
  defaultClearHeightM?: number;
  /** Optional pre-computed available volume (m^3) per storey name. */
  storeyVolumesM3?: Record<string, number>;
}

const MS_PER_DAY = 86_400_000;
const OVERLAY_GROUP_NAME = "BIM_4D_SLF_Zones";
const RESOURCE_TAG = "4d-workspace-slf";

const CONGESTION_COLORS: Record<CongestionStatus, number> = {
  Optimal: 0x10b981,
  Moderate: 0xf59e0b,
  Extreme: 0xef4444,
};

export function classifySlf(slf: number): CongestionStatus {
  if (slf > 0.9) return "Extreme";
  if (slf > 0.7) return "Moderate";
  return "Optimal";
}

/**
 * Pure SLF calculator evaluating spatial-temporal workspace congestion across storeys and timeline windows.
 */
export function computeWorkspaceSlfSeries(
  tasks: ScheduleTask[],
  elementLookup: Map<string, WorkspaceElementInfo>,
  options: SlfAnalysisOptions = {}
): StoreySlfPoint[] {
  const buf = Math.max(0, options.workspaceBufferMeters ?? 0.75);
  const stepDays = Math.max(1, options.stepDays ?? 7);
  const defaultClearH = Math.max(2.0, options.defaultClearHeightM ?? 3.2);

  const workTasks = tasks.filter((t) => !t.isSummary && t.startDate && t.endDate);
  if (workTasks.length === 0) return [];

  let minMs = Infinity;
  let maxMs = -Infinity;
  const parsedTasks: Array<{
    task: ScheduleTask;
    startMs: number;
    endMs: number;
    storeyRequiredVol: Map<string, number>;
  }> = [];

  // Precompute element footprint boxes per storey for available volume estimation
  const storeyBounds = new Map<string, THREE.Box3>();
  for (const [, info] of elementLookup) {
    const st = (info.storey || "Default Zone").trim();
    if (info.box && !info.box.isEmpty()) {
      let sb = storeyBounds.get(st);
      if (!sb) {
        sb = info.box.clone();
        storeyBounds.set(st, sb);
      } else {
        sb.union(info.box);
      }
    }
  }

  for (const task of workTasks) {
    const s = Date.parse(task.startDate);
    const e = Date.parse(task.endDate);
    if (!Number.isFinite(s) || !Number.isFinite(e) || e < s) continue;
    if (s < minMs) minMs = s;
    if (e > maxMs) maxMs = e;

    const storeyReq = new Map<string, number>();
    const mId = task.modelId || "default-model";

    if (task.elementIds.size > 0) {
      for (const eid of task.elementIds) {
        const info = elementLookup.get(`${mId}:${eid}`) || elementLookup.get(`:${eid}`);
        const st = (info?.storey || "Default Zone").trim();
        let workspaceVol = 4.5; // fallback 4.5m3 single element crew envelope
        if (info?.box && !info.box.isEmpty()) {
          const sz = new THREE.Vector3();
          info.box.getSize(sz);
          workspaceVol = (sz.x + buf * 2) * (sz.y + buf * 2) * (sz.z + buf * 2);
        } else if (typeof info?.volumeM3 === "number" && info.volumeM3 > 0) {
          workspaceVol = Math.max(info.volumeM3 * 2.2, 2.5);
        }
        storeyReq.set(st, (storeyReq.get(st) ?? 0) + workspaceVol);
      }
    } else {
      storeyReq.set("Default Zone", 18.0);
    }

    parsedTasks.push({ task, startMs: s, endMs: e, storeyRequiredVol: storeyReq });
  }

  if (!Number.isFinite(minMs) || !Number.isFinite(maxMs)) return [];

  // Estimate V_avail,z per storey
  const availVolByStorey = new Map<string, number>();
  const allStoreys = new Set<string>(Object.keys(options.storeyVolumesM3 ?? {}));
  for (const pt of parsedTasks) {
    for (const st of pt.storeyRequiredVol.keys()) allStoreys.add(st);
  }

  for (const st of allStoreys) {
    if (options.storeyVolumesM3 && options.storeyVolumesM3[st] > 0) {
      availVolByStorey.set(st, options.storeyVolumesM3[st]);
      continue;
    }
    const sb = storeyBounds.get(st);
    if (sb && !sb.isEmpty()) {
      const sz = new THREE.Vector3();
      sb.getSize(sz);
      const area = Math.max(30, sz.x * sz.z);
      const height = Math.max(defaultClearH, sz.y);
      availVolByStorey.set(st, area * height);
    } else {
      availVolByStorey.set(st, 350); // sensible single-zone room default (m3)
    }
  }

  const out: StoreySlfPoint[] = [];
  const stepMs = stepDays * MS_PER_DAY;
  let guard = 0;

  for (let t0 = minMs; t0 <= maxMs && guard < 180; t0 += stepMs, guard++) {
    const t1 = t0 + stepMs;
    const dateIso = new Date(t0).toISOString().split("T")[0];
    const windowEndIso = new Date(Math.min(maxMs, t1)).toISOString().split("T")[0];

    const reqByStorey = new Map<string, number>();
    const idsByStorey = new Map<string, string[]>();

    for (const entry of parsedTasks) {
      if (entry.endMs < t0 || entry.startMs > t1) continue;
      for (const [st, vol] of entry.storeyRequiredVol) {
        reqByStorey.set(st, (reqByStorey.get(st) ?? 0) + vol);
        if (!idsByStorey.has(st)) idsByStorey.set(st, []);
        idsByStorey.get(st)!.push(entry.task.id);
      }
    }

    for (const [st, vReq] of reqByStorey) {
      const vAvail = Math.max(1, availVolByStorey.get(st) ?? 350);
      const slf = Number((vReq / vAvail).toFixed(3));
      out.push({
        storey: st,
        dateIso,
        windowEndIso,
        slf,
        status: classifySlf(slf),
        activeTaskIds: idsByStorey.get(st) ?? [],
        activeTaskCount: (idsByStorey.get(st) ?? []).length,
        requiredVolumeM3: Number(vReq.toFixed(1)),
        availableVolumeM3: Number(vAvail.toFixed(1)),
      });
    }
  }

  return out;
}

export class WorkspaceCongestionAnalyzer {
  private static instance: WorkspaceCongestionAnalyzer | null = null;
  private lastSeries: StoreySlfPoint[] = [];
  private lastStoreyBoxes: Map<string, THREE.Box3> = new Map();
  private lastTaskSignature: string = "";
  private overlayGroup: THREE.Group | null = null;

  private constructor() {}

  public static getInstance(): WorkspaceCongestionAnalyzer {
    if (!WorkspaceCongestionAnalyzer.instance) {
      WorkspaceCongestionAnalyzer.instance = new WorkspaceCongestionAnalyzer();
    }
    return WorkspaceCongestionAnalyzer.instance;
  }

  public getLastSeries(): StoreySlfPoint[] {
    return this.lastSeries;
  }

  public getLastStoreyBoxes(): Map<string, THREE.Box3> {
    return this.lastStoreyBoxes;
  }

  public getPeakSlfByStorey(): Map<string, StoreySlfPoint> {
    const peaks = new Map<string, StoreySlfPoint>();
    for (const pt of this.lastSeries) {
      const existing = peaks.get(pt.storey);
      if (!existing || pt.slf > existing.slf) peaks.set(pt.storey, pt);
    }
    return peaks;
  }

  /**
   * Returns the StoreySlfPoint slice active at `dateMs` (or closest preceding window).
   */
  public getActivePointsAtDate(dateMs: number): StoreySlfPoint[] {
    if (this.lastSeries.length === 0) return [];
    const byStorey = new Map<string, StoreySlfPoint>();
    for (const pt of this.lastSeries) {
      const startMs = Date.parse(pt.dateIso);
      const endMs = Date.parse(pt.windowEndIso);
      if (dateMs >= startMs && dateMs <= endMs) {
        const prev = byStorey.get(pt.storey);
        if (!prev || pt.slf > prev.slf) byStorey.set(pt.storey, pt);
      }
    }
    if (byStorey.size > 0) return Array.from(byStorey.values());
    // Fallback to nearest window by midpoint
    let bestDist = Infinity;
    let bestMid = 0;
    for (const pt of this.lastSeries) {
      const mid = (Date.parse(pt.dateIso) + Date.parse(pt.windowEndIso)) / 2;
      const dist = Math.abs(dateMs - mid);
      if (dist < bestDist) {
        bestDist = dist;
        bestMid = mid;
      }
    }
    for (const pt of this.lastSeries) {
      const mid = (Date.parse(pt.dateIso) + Date.parse(pt.windowEndIso)) / 2;
      if (Math.abs(mid - bestMid) <= 1) {
        const prev = byStorey.get(pt.storey);
        if (!prev || pt.slf > prev.slf) byStorey.set(pt.storey, pt);
      }
    }
    return Array.from(byStorey.values());
  }

  /**
   * Computes 4D SLF series across all loaded models via FragmentIndexer and caches storey bounding boxes.
   */
  public async analyzeLoadedModels(
    tasks: ScheduleTask[],
    options: SlfAnalysisOptions = {}
  ): Promise<StoreySlfPoint[]> {
    const engine = BimEngine.getInstance();
    const indexer = FragmentIndexer.getInstance();
    const lookup = new Map<string, WorkspaceElementInfo>();
    const storeyBoxes = new Map<string, THREE.Box3>();

    if ((engine.fragments as any)?.initialized && engine.fragments?.list) {
      for (const [modelId, model] of engine.fragments.list) {
        const indexed = await indexer.indexModel(modelId, model, {
          includeBoxes: true,
          includePsets: false,
        });
        for (const el of indexed.elements) {
          lookup.set(`${modelId}:${el.expressId}`, {
            storey: el.storey,
            volumeM3: el.volumeM3,
            box: el.box,
          });
          if (el.box && !el.box.isEmpty()) {
            const st = el.storey || "Default Zone";
            const acc = storeyBoxes.get(st) ?? new THREE.Box3();
            acc.union(el.box);
            storeyBoxes.set(st, acc);
          }
        }
      }
    }

    this.lastStoreyBoxes = storeyBoxes;
    this.lastTaskSignature = `${tasks.length}:${tasks[0]?.id ?? ""}:${tasks[tasks.length - 1]?.id ?? ""}`;
    this.lastSeries = computeWorkspaceSlfSeries(tasks, lookup, options);
    return this.lastSeries;
  }

  /**
   * Synchronizes 3D translucent SLF congestion overlays to a specific 4D simulation timestamp.
   */
  public async syncOverlaysForDate(
    tasks: ScheduleTask[],
    dateMs: number
  ): Promise<{ points: StoreySlfPoint[]; peak: StoreySlfPoint | null; renderedCount: number }> {
    const sig = `${tasks.length}:${tasks[0]?.id ?? ""}:${tasks[tasks.length - 1]?.id ?? ""}`;
    if (this.lastSeries.length === 0 || this.lastTaskSignature !== sig) {
      await this.analyzeLoadedModels(tasks);
    }
    const activePoints = this.getActivePointsAtDate(dateMs);
    const renderedCount = this.renderZoneOverlays(activePoints, this.lastStoreyBoxes);
    let peak: StoreySlfPoint | null = null;
    for (const pt of activePoints) {
      if (!peak || pt.slf > peak.slf) peak = pt;
    }
    return { points: activePoints, peak, renderedCount };
  }

  /**
   * Renders 3D heat-tinted zone bounding prisms for Moderate/Extreme congestion storeys.
   */
  public renderZoneOverlays(points: StoreySlfPoint[], storeyBoxes: Map<string, THREE.Box3>): number {
    this.clearOverlays();
    const scene = BimEngine.getInstance().world?.scene?.three;
    if (!scene || points.length === 0) return 0;

    const peaks = new Map<string, StoreySlfPoint>();
    for (const pt of points) {
      const prev = peaks.get(pt.storey);
      if (!prev || pt.slf > prev.slf) peaks.set(pt.storey, pt);
    }

    const group = new THREE.Group();
    group.name = OVERLAY_GROUP_NAME;
    const lifecycle = ResourceLifecycleManager.getInstance();
    const profileEngine = AppearanceProfileEngine.getInstance();
    let count = 0;

    for (const [storey, pt] of peaks) {
      const box = storeyBoxes.get(storey);
      if (!box || box.isEmpty()) continue;
      const sz = new THREE.Vector3();
      const center = new THREE.Vector3();
      box.getSize(sz);
      box.getCenter(center);

      const geo = new THREE.BoxGeometry(Math.max(1, sz.x), Math.max(0.5, sz.y), Math.max(1, sz.z));
      const mat = new THREE.MeshBasicMaterial({
        color: CONGESTION_COLORS[pt.status],
      });
      profileEngine.applyTranslucentGhostPass(mat, pt.status === "Extreme" ? 0.34 : 0.2, "alpha-hash");

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(center);
      mesh.renderOrder = 2;
      group.add(mesh);

      lifecycle.track(geo, RESOURCE_TAG);
      lifecycle.track(mat, RESOURCE_TAG);
      count++;
    }

    if (count > 0) {
      scene.add(group);
      this.overlayGroup = group;
    }
    return count;
  }

  public clearOverlays(): void {
    ResourceLifecycleManager.getInstance().releaseByTag(RESOURCE_TAG);
    if (this.overlayGroup) {
      this.overlayGroup.parent?.remove(this.overlayGroup);
      this.overlayGroup = null;
    }
    const scene = BimEngine.getInstance().world?.scene?.three;
    if (scene) {
      const orphan = scene.getObjectByName(OVERLAY_GROUP_NAME);
      if (orphan) orphan.parent?.remove(orphan);
    }
  }
}
