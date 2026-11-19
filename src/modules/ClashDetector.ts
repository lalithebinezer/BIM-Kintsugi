import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { MeshBVH } from "three-mesh-bvh";
import { BimEngine } from "../core/BimEngine";
import { BcfIssueManager, type BcfTopic } from "./BcfIssueManager";
import { escapeHtml } from "../utils/formatters";
import { FragmentIndexer } from "../core/FragmentIndexer";
import {
  runSweepAndPrune,
  type BroadPhaseClashHit,
  type BroadPhaseRuleTask,
  type ClashScanMode,
} from "../core/clashBroadPhase";
import { ScheduleManager } from "./ScheduleManager";
import { ClashToleranceInspector } from "./ClashToleranceInspector";

export interface BwmCriticalityInput {
  penetrationMeters: number;
  structuralWeight: number;
  mepTimeWeight: number;
  mepCostWeight: number;
  localDensityN: number;
  volumeRatioR?: number;
  zoneCriticalityU?: number;
}

/**
 * Six-Parameter Best-Worst Method (BWM) Clash Criticality Index (Bitaraf et al., 2024):
 * CI = P * W_S * W_MEP(T) * W_MEP(C) * N * R * U
 */
export function computeBwmCriticalityIndex(input: BwmCriticalityInput): {
  ci: number;
  tier: "Critical" | "Medium" | "Low";
} {
  const p = Math.max(0.01, input.penetrationMeters);
  const ws = Math.max(0.5, input.structuralWeight);
  const wt = Math.max(0.5, input.mepTimeWeight);
  const wc = Math.max(0.5, input.mepCostWeight);
  const n = Math.max(1, input.localDensityN);
  const r = Math.max(0.15, input.volumeRatioR ?? 0.5);
  const u = Math.max(0.8, input.zoneCriticalityU ?? 1.0);
  const ci = Number((p * ws * wt * wc * n * r * u).toFixed(2));
  const tier: "Critical" | "Medium" | "Low" =
    ci > 2.0 ? "Critical" : ci > 1.0 ? "Medium" : "Low";
  return { ci, tier };
}

export type ClashSeverity = "critical" | "major" | "minor" | "clearance";
export type ClashStatus = "new" | "active" | "reviewed" | "resolved";

export interface ClashPairElement {
  modelId: string;
  expressId: number;
  category: string;
  name: string;
}

export interface ClashResult {
  id: string;
  disciplineA: string;
  disciplineB: string;
  elementA: ClashPairElement;
  elementB: ClashPairElement;
  severity: ClashSeverity;
  status: ClashStatus;
  overlapDistance: number; // in meters
  intersectionPoint: [number, number, number];
  axisPenetration?: [number, number, number];
  criticalityIndex?: number;
  criticalityTier?: "Critical" | "Medium" | "Low";
  temporalConcurrent?: boolean;
  assignedTo?: string;
  comment?: string;
  foundAt: string;
}

export interface ClashRuleConfig {
  name: string;
  categoryA: string[];
  categoryB: string[];
  hardClashTolerance: number; // meters
  softClearanceBuffer: number; // meters
  enabled: boolean;
}

export interface ClashScanSummary {
  source: "model" | "demo";
  scannedElements: number;
  candidatePairs: number;
  elapsedMs: number;
  filteredFalsePositives: number;
  prunedNonConcurrent?: number;
  scanMode?: ClashScanMode;
  broadPhaseMode?: "worker-sap" | "sync-sap";
}

interface ModelScanElement {
  modelId: string;
  expressId: number;
  category: string;
  name: string;
  box: THREE.Box3;
}

export class ClashDetector {
  private static instance: ClashDetector;
  private static readonly MAX_SCAN_ELEMENTS_PER_MODEL = 12000;
  private static readonly MAX_CLASH_RESULTS = 250;
  private engine: BimEngine;
  private clashResults: ClashResult[] = [];
  private isScanning: boolean = false;
  private clashMarkerGroup: THREE.Group;
  private markerIds: string[] = [];
  private deepMeshVerification: boolean = false;
  private isolateContextOnFocus: boolean = true;
  private lastFalsePositivesFiltered: number = 0;
  private severityFilter: ClashSeverity | "all" = "all";
  private lastScanSummary: ClashScanSummary | null = null;
  private promotedClashIds: Set<string> = new Set();
  private sapWorker: Worker | null = null;
  private workerJobSeq: number = 0;
  private scanMode: ClashScanMode = "static-3d";
  private sortByCriticality: boolean = true;

  private rules: ClashRuleConfig[] = [
    {
      name: "MEP vs Structural Frame",
      categoryA: ["IFCDUCTSEGMENT", "IFCPIPESEGMENT", "IFCFLOWTERMINAL", "IFCCABLECARRIERSEGMENT"],
      categoryB: ["IFCCOLUMN", "IFCBEAM", "IFCSLAB", "IFCMEMBER", "IFCFOOTING"],
      hardClashTolerance: 0.01,
      softClearanceBuffer: 0.05,
      enabled: true,
    },
    {
      name: "MEP vs Architectural Walls/Doors",
      categoryA: ["IFCDUCTSEGMENT", "IFCPIPESEGMENT"],
      categoryB: ["IFCWALL", "IFCWALLSTANDARDCASE", "IFCDOOR", "IFCWINDOW"],
      hardClashTolerance: 0.01,
      softClearanceBuffer: 0.02,
      enabled: true,
    },
    {
      name: "Plumbing vs Electrical Services",
      categoryA: ["IFCPIPESEGMENT", "IFCSANITARYTERMINAL"],
      categoryB: ["IFCCABLECARRIERSEGMENT", "IFCELECTRICALAPPLIANCE", "IFCDISTRIBUTIONBOARD"],
      hardClashTolerance: 0.005,
      softClearanceBuffer: 0.15, // Electrical clearance requirement
      enabled: true,
    },
    {
      name: "Structural vs Architectural Envelope",
      categoryA: ["IFCBEAM", "IFCCOLUMN", "IFCMEMBER", "IFCPLATE"],
      categoryB: ["IFCWALL", "IFCWALLSTANDARDCASE", "IFCCURTAINWALL", "IFCDOOR", "IFCWINDOW", "IFCSTAIR"],
      hardClashTolerance: 0.025, // Ignore flush bearing contacts < 25mm
      softClearanceBuffer: 0,
      enabled: true,
    },
  ];

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.clashMarkerGroup = new THREE.Group();
    this.clashMarkerGroup.name = "ClashMarkerGroup";

    try {
      if (this.engine.world?.scene?.three) {
        this.engine.world.scene.three.add(this.clashMarkerGroup);
      }
    } catch (e) {
      // Scene not initialized yet in headless/test environments
    }
  }

  public static getInstance(): ClashDetector {
    if (!ClashDetector.instance) {
      ClashDetector.instance = new ClashDetector();
    }
    return ClashDetector.instance;
  }

  public getRules(): ClashRuleConfig[] {
    return this.rules;
  }

  public toggleRule(index: number, enabled?: boolean): boolean {
    const rule = this.rules[index];
    if (!rule) return false;
    rule.enabled = enabled !== undefined ? enabled : !rule.enabled;
    this.updateClashUI();
    return rule.enabled;
  }

  public updateRuleTolerances(
    index: number,
    hardClashToleranceMeters: number,
    softClearanceMeters: number
  ): boolean {
    const rule = this.rules[index];
    if (!rule) return false;
    if (Number.isFinite(hardClashToleranceMeters) && hardClashToleranceMeters >= 0) {
      rule.hardClashTolerance = Math.min(2, Number(hardClashToleranceMeters));
    }
    if (Number.isFinite(softClearanceMeters) && softClearanceMeters >= 0) {
      rule.softClearanceBuffer = Math.min(5, Number(softClearanceMeters));
    }
    this.updateClashUI();
    return true;
  }

  public setIsolateContextOnFocus(enabled: boolean) {
    this.isolateContextOnFocus = enabled;
    if (!enabled) {
      try {
        const fragsReady = Boolean((this.engine.fragments as any)?.initialized);
        if (fragsReady) {
          Promise.resolve(this.engine.hider?.set?.(true)).catch(() => {});
        }
      } catch {}
    }
  }

  public isIsolateContextOnFocus(): boolean {
    return this.isolateContextOnFocus;
  }

  public getIsScanning(): boolean {
    return this.isScanning;
  }

  public setRules(rules: ClashRuleConfig[]) {
    this.rules = rules;
  }

  public getClashes(): ClashResult[] {
    return this.clashResults;
  }

  public setSeverityFilter(filter: ClashSeverity | "all") {
    this.severityFilter = filter;
    this.updateClashUI();
  }

  public getSeverityFilter(): ClashSeverity | "all" {
    return this.severityFilter;
  }

  public getLastScanSummary(): ClashScanSummary | null {
    return this.lastScanSummary;
  }

  public setDeepMeshVerification(enabled: boolean) {
    this.deepMeshVerification = enabled;
  }

  public isDeepMeshVerification(): boolean {
    return this.deepMeshVerification;
  }

  public getLastFalsePositivesFiltered(): number {
    return this.lastFalsePositivesFiltered;
  }

  public setScanMode(mode: ClashScanMode) {
    this.scanMode = mode;
    this.updateClashUI();
  }

  public getScanMode(): ClashScanMode {
    return this.scanMode;
  }

  public setSortByCriticality(enabled: boolean) {
    this.sortByCriticality = enabled;
    this.updateClashUI();
  }

  public clearClashes(): void {
    this.clashResults = [];
    this.lastFalsePositivesFiltered = 0;
    this.lastScanSummary = null;
    this.promotedClashIds.clear();
    this.clearClashMarkers();
    try {
      const highlighter = this.engine.highlighter;
      const fragsReady = Boolean((this.engine.fragments as any)?.initialized);
      if (fragsReady && highlighter?.clear) {
        Promise.resolve(highlighter.clear("ClashElementA")).catch(() => {});
        Promise.resolve(highlighter.clear("ClashElementB")).catch(() => {});
      }
      if (fragsReady) {
        this.engine.outliner?.clean?.();
        Promise.resolve(this.engine.hider?.set?.(true)).catch(() => {});
      }
    } catch {}
    this.updateClashUI();
  }

  private async runBroadPhaseSweep(
    boxes: Float64Array,
    tasks: BroadPhaseRuleTask[],
    temporalWindows?: Float64Array
  ): Promise<{
    hits: BroadPhaseClashHit[];
    candidatePairs: number;
    prunedNonConcurrent: number;
    mode: "worker-sap" | "sync-sap";
  }> {
    if (typeof Worker !== "undefined" && boxes.length >= 60) {
      try {
        if (!this.sapWorker) {
          this.sapWorker = new Worker(new URL("../workers/clashWorker.ts", import.meta.url), {
            type: "module",
          });
        }
        const jobId = ++this.workerJobSeq;
        const worker = this.sapWorker;
        const res = await new Promise<{
          hits: BroadPhaseClashHit[];
          candidatePairs: number;
          prunedNonConcurrent: number;
        }>((resolve, reject) => {
          const timer = setTimeout(() => {
            cleanup();
            reject(new Error("Clash worker timeout"));
          }, 15000);
          const onMsg = (ev: MessageEvent<any>) => {
            if (ev.data?.jobId !== jobId) return;
            cleanup();
            resolve({
              hits: ev.data.hits || [],
              candidatePairs: ev.data.candidatePairs || 0,
              prunedNonConcurrent: ev.data.prunedNonConcurrent || 0,
            });
          };
          const onErr = (err: any) => {
            cleanup();
            reject(err);
          };
          const cleanup = () => {
            clearTimeout(timer);
            worker.removeEventListener("message", onMsg);
            worker.removeEventListener("error", onErr);
          };
          worker.addEventListener("message", onMsg);
          worker.addEventListener("error", onErr);
          worker.postMessage({
            jobId,
            boxes,
            tasks,
            maxHits: ClashDetector.MAX_CLASH_RESULTS * 3,
            mode: this.scanMode,
            temporalWindows,
          });
        });
        return { ...res, mode: "worker-sap" };
      } catch {
        try {
          this.sapWorker?.terminate();
        } catch {}
        this.sapWorker = null;
      }
    }

    const syncRes = runSweepAndPrune(boxes, tasks, ClashDetector.MAX_CLASH_RESULTS * 3, {
      mode: this.scanMode,
      temporalWindows,
    });
    return { ...syncRes, mode: "sync-sap" };
  }

  /**
   * Executes collision matrix scan across loaded BIM models using 1D Sweep-and-Prune
   * offloaded to a Web Worker (with synchronous fallback) + optional BVH verification
   * + 4D temporal window pruning and Six-Parameter BWM Criticality ranking.
   */
  public async runClashAudit(): Promise<ClashResult[]> {
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    this.isScanning = true;
    this.clearClashMarkers();
    this.clashResults = [];
    this.updateClashUI();

    try {
      const { hasLoadedModels, elements } = await this.collectModelElements();
      const rawResults: ClashResult[] = [];
      let broadPhaseMode: "worker-sap" | "sync-sap" = "sync-sap";
      let candidatePairs = 0;
      let prunedNonConcurrent = 0;

      // Build element-level 4D temporal window & float map from ScheduleManager
      const elemScheduleMap = new Map<string, { startMs: number; endMs: number; isCritical: boolean }>();
      const schedTasks = ScheduleManager.getInstance().tasks;
      for (const task of schedTasks.values()) {
        const sMs = Date.parse(task.startDate);
        const eMs = Date.parse(task.endDate);
        if (!Number.isFinite(sMs) || !Number.isFinite(eMs)) continue;
        const mId = task.modelId || "default-model";
        for (const eid of task.elementIds) {
          elemScheduleMap.set(`${mId}:${eid}`, {
            startMs: sMs,
            endMs: eMs,
            isCritical: Boolean(task.isCritical) || (task.totalFloat ?? 99) <= 2,
          });
        }
      }

      if (elements.length > 0) {
        const boxes = new Float64Array(elements.length * 6);
        const temporalWindows = new Float64Array(elements.length * 2);
        for (let i = 0; i < elements.length; i++) {
          const b = elements[i].box;
          const off = i * 6;
          boxes[off] = b.min.x;
          boxes[off + 1] = b.min.y;
          boxes[off + 2] = b.min.z;
          boxes[off + 3] = b.max.x;
          boxes[off + 4] = b.max.y;
          boxes[off + 5] = b.max.z;

          const win = elemScheduleMap.get(`${elements[i].modelId}:${elements[i].expressId}`);
          if (win) {
            temporalWindows[i * 2] = win.startMs;
            temporalWindows[i * 2 + 1] = win.endMs;
          }
        }

        const tasks: BroadPhaseRuleTask[] = [];
        this.rules.forEach((rule, ruleIdx) => {
          if (!rule.enabled) return;
          const groupA: number[] = [];
          const groupB: number[] = [];
          for (let idx = 0; idx < elements.length; idx++) {
            const catUp = elements[idx].category.toUpperCase();
            if (rule.categoryA.some((cat) => catUp.includes(cat))) groupA.push(idx);
            if (rule.categoryB.some((cat) => catUp.includes(cat))) groupB.push(idx);
          }
          if (groupA.length > 0 && groupB.length > 0) {
            tasks.push({
              ruleIdx,
              groupA,
              groupB,
              hardTolerance: rule.hardClashTolerance,
              softBuffer: rule.softClearanceBuffer,
            });
          }
        });

        const sweepRes = await this.runBroadPhaseSweep(boxes, tasks, temporalWindows);
        broadPhaseMode = sweepRes.mode;
        candidatePairs = sweepRes.candidatePairs;
        prunedNonConcurrent = sweepRes.prunedNonConcurrent;
        const foundTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

        // Compute BWM Criticality scores & local spatial density N
        const { WorkspaceCongestionAnalyzer } = await import("./WorkspaceCongestionAnalyzer");
        const peaks = WorkspaceCongestionAnalyzer.getInstance().getPeakSlfByStorey();
        const hasSevereZone = Array.from(peaks.values()).some((p) => p.status === "Extreme");

        for (let k = 0; k < sweepRes.hits.length; k++) {
          const hit = sweepRes.hits[k];
          const elA = elements[hit.idxA];
          const elB = elements[hit.idxB];
          if (!elA || !elB) continue;

          const discA = this.classifyDiscipline(elA.category);
          const discB = this.classifyDiscipline(elB.category);

          let localN = 1;
          for (let j = 0; j < sweepRes.hits.length; j++) {
            if (j === k) continue;
            const other = sweepRes.hits[j];
            const distSq =
              (hit.ix - other.ix) ** 2 + (hit.iy - other.iy) ** 2 + (hit.iz - other.iz) ** 2;
            if (distSq <= 4.0) localN++;
          }

          const schedA = elemScheduleMap.get(`${elA.modelId}:${elA.expressId}`);
          const schedB = elemScheduleMap.get(`${elB.modelId}:${elB.expressId}`);
          const touchesStruct = discA === "Structural" || discB === "Structural";
          const touchesMep =
            discA.includes("MEP") || discA === "Plumbing" || discA === "Electrical" ||
            discB.includes("MEP") || discB === "Plumbing" || discB === "Electrical";
          const anyCriticalTask = Boolean(schedA?.isCritical || schedB?.isCritical);

          const { ci, tier } = computeBwmCriticalityIndex({
            penetrationMeters: hit.overlap,
            structuralWeight: touchesStruct ? 1.8 : 1.15,
            mepTimeWeight: anyCriticalTask ? 1.85 : touchesMep ? 1.4 : 1.0,
            mepCostWeight: touchesStruct && touchesMep ? 1.55 : touchesMep ? 1.25 : 1.0,
            localDensityN: Math.min(8, localN),
            volumeRatioR: hit.volumeRatio,
            zoneCriticalityU: hasSevereZone ? 1.3 : 1.05,
          });

          rawResults.push({
            id: `clash_${Date.now()}_${k + 1}`,
            disciplineA: discA,
            disciplineB: discB,
            elementA: {
              modelId: elA.modelId,
              expressId: elA.expressId,
              category: elA.category,
              name: elA.name,
            },
            elementB: {
              modelId: elB.modelId,
              expressId: elB.expressId,
              category: elB.category,
              name: elB.name,
            },
            severity: hit.severity,
            status: "new",
            overlapDistance: hit.overlap,
            axisPenetration: [hit.penX, hit.penY, hit.penZ],
            criticalityIndex: ci,
            criticalityTier: tier,
            temporalConcurrent: hit.temporalConcurrent,
            intersectionPoint: [hit.ix, hit.iy, hit.iz],
            foundAt: foundTime,
          });
        }
      }

      // Optional Phase 5A: Deep triangle-level BVH verification using OBF.Mesher + three-mesh-bvh
      this.lastFalsePositivesFiltered = 0;
      const severityWeight: Record<ClashSeverity, number> = { critical: 0, major: 1, minor: 2, clearance: 3 };
      rawResults.sort((x, y) => {
        if (this.sortByCriticality) {
          const ciDiff = (y.criticalityIndex ?? 0) - (x.criticalityIndex ?? 0);
          if (Math.abs(ciDiff) > 0.01) return ciDiff;
        }
        return severityWeight[x.severity] - severityWeight[y.severity] || y.overlapDistance - x.overlapDistance;
      });

      let verifiedResults =
        this.deepMeshVerification && rawResults.length > 0
          ? await this.filterCandidatesWithMesherBVH(rawResults.slice(0, ClashDetector.MAX_CLASH_RESULTS * 2))
          : rawResults;

      verifiedResults = verifiedResults.slice(0, ClashDetector.MAX_CLASH_RESULTS);

      let scanSource: "model" | "demo" = hasLoadedModels ? "model" : "demo";

      // Demo fallback ONLY when no models are loaded in the scene
      if (!hasLoadedModels && verifiedResults.length === 0) {
        scanSource = "demo";
        verifiedResults.push(
          {
            id: `clash_demo_1`,
            disciplineA: "MEP / HVAC",
            disciplineB: "Structural",
            elementA: {
              modelId: "model_mep",
              expressId: 4821,
              category: "IfcDuctSegment",
              name: "Supply Air Rect Duct 600x400",
            },
            elementB: {
              modelId: "model_str",
              expressId: 1044,
              category: "IfcBeam",
              name: "UB 457x191x67 Steel Beam",
            },
            severity: "critical",
            status: "active",
            overlapDistance: 0.145,
            intersectionPoint: [4.2, 3.8, -8.5],
            foundAt: "10:15 AM",
          },
          {
            id: `clash_demo_2`,
            disciplineA: "Plumbing",
            disciplineB: "Electrical",
            elementA: {
              modelId: "model_plumb",
              expressId: 6912,
              category: "IfcPipeSegment",
              name: "DN100 Waste Water Pipe",
            },
            elementB: {
              modelId: "model_elec",
              expressId: 2133,
              category: "IfcCableCarrierSegment",
              name: "300mm Cable Ladder Tray",
            },
            severity: "clearance",
            status: "new",
            overlapDistance: 0.042,
            intersectionPoint: [-6.8, 3.2, 12.1],
            foundAt: "10:18 AM",
          },
          {
            id: `clash_demo_3`,
            disciplineA: "Fire Protection",
            disciplineB: "Architectural",
            elementA: {
              modelId: "model_fp",
              expressId: 8812,
              category: "IfcFlowTerminal",
              name: "Sprinkler Head Pendant 68C",
            },
            elementB: {
              modelId: "model_arch",
              expressId: 3302,
              category: "IfcDoor",
              name: "Double Fire Door FD60",
            },
            severity: "major",
            status: "new",
            overlapDistance: 0.09,
            intersectionPoint: [1.5, 2.7, 5.0],
            foundAt: "10:22 AM",
          }
        );
      }

      const elapsedMs = Math.max(1, Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0));
      this.lastScanSummary = {
        source: scanSource,
        scannedElements: elements.length,
        candidatePairs: rawResults.length || candidatePairs,
        elapsedMs,
        filteredFalsePositives: this.lastFalsePositivesFiltered,
        prunedNonConcurrent,
        scanMode: this.scanMode,
        broadPhaseMode,
      };
      this.clashResults = verifiedResults;
      if (scanSource === "model" && verifiedResults.length > 0) {
        ClashToleranceInspector.getInstance().syncFromClashResults(verifiedResults);
      }
      this.renderClashBeacons();
      return verifiedResults;
    } finally {
      this.isScanning = false;
      this.updateClashUI();
    }
  }

  /**
   * Refines AABB collision candidates with exact triangle-level BVH intersections
   * powered by `@thatopen/components-front` `OBF.Mesher` + `three-mesh-bvh`.
   */
  private async filterCandidatesWithMesherBVH(candidates: ClashResult[]): Promise<ClashResult[]> {
    const frags = this.engine.fragments as any;
    const fragList = this.getFragmentsMap();
    if (!frags?.initialized || !fragList) return candidates;
    const candidateMap: OBC.ModelIdMap = {};
    for (const c of candidates) {
      if (fragList.has(c.elementA.modelId)) {
        if (!candidateMap[c.elementA.modelId]) candidateMap[c.elementA.modelId] = new Set();
        candidateMap[c.elementA.modelId].add(c.elementA.expressId);
      }
      if (fragList.has(c.elementB.modelId)) {
        if (!candidateMap[c.elementB.modelId]) candidateMap[c.elementB.modelId] = new Set();
        candidateMap[c.elementB.modelId].add(c.elementB.expressId);
      }
    }

    if (Object.keys(candidateMap).length === 0) return candidates;

    let mesher: OBF.Mesher;
    let meshMap: Awaited<ReturnType<OBF.Mesher["get"]>>;
    try {
      mesher = this.engine.components.get(OBF.Mesher);
      meshMap = await mesher.get(candidateMap, { applyTransformation: true });
    } catch {
      return candidates;
    }
    const bvhCache = new WeakMap<THREE.BufferGeometry, MeshBVH>();
    const invA = new THREE.Matrix4();
    const geomToBvh = new THREE.Matrix4();
    const verified: ClashResult[] = [];

    const getBvh = (geo: THREE.BufferGeometry): MeshBVH | null => {
      if (!geo.getAttribute("position") || geo.getAttribute("position").count < 3) return null;
      let bvh = bvhCache.get(geo);
      if (!bvh) {
        bvh = new MeshBVH(geo);
        bvhCache.set(geo, bvh);
      }
      return bvh;
    };

    try {
      for (const c of candidates) {
        if (c.severity === "clearance") {
          verified.push(c);
          continue;
        }
        const meshesA = meshMap.get(c.elementA.modelId)?.get(c.elementA.expressId);
        const meshesB = meshMap.get(c.elementB.modelId)?.get(c.elementB.expressId);
        if (!meshesA?.length || !meshesB?.length) {
          verified.push(c);
          continue;
        }

        let hits = false;
        for (const mA of meshesA) {
          mA.updateMatrixWorld(true);
          const bvhA = getBvh(mA.geometry);
          if (!bvhA) continue;
          invA.copy(mA.matrixWorld).invert();
          for (const mB of meshesB) {
            mB.updateMatrixWorld(true);
            geomToBvh.copy(invA).multiply(mB.matrixWorld);
            if (bvhA.intersectsGeometry(mB.geometry, geomToBvh)) {
              hits = true;
              break;
            }
          }
          if (hits) break;
        }

        if (hits) {
          verified.push(c);
        } else {
          this.lastFalsePositivesFiltered++;
        }
      }
    } finally {
      try {
        mesher.remove(Object.keys(candidateMap));
      } catch {}
    }

    return verified;
  }

  private classifyDiscipline(category: string): string {
    const c = category.toUpperCase();
    if (c.includes("DUCT") || c.includes("AIR") || c.includes("HVAC") || c.includes("FLOWTERMINAL")) return "MEP / HVAC";
    if (c.includes("PIPE") || c.includes("SANITARY")) return "Plumbing";
    if (c.includes("CABLE") || c.includes("ELEC") || c.includes("DISTRIBUTION")) return "Electrical";
    if (c.includes("BEAM") || c.includes("COLUMN") || c.includes("SLAB") || c.includes("MEMBER") || c.includes("FOOTING") || c.includes("PLATE") || c.includes("PILE")) return "Structural";
    return "Architectural";
  }

  private isValidBox(box: THREE.Box3 | undefined | null): box is THREE.Box3 {
    if (!box || !(box instanceof THREE.Box3) || box.isEmpty()) return false;
    return (
      Number.isFinite(box.min.x) && Number.isFinite(box.min.y) && Number.isFinite(box.min.z) &&
      Number.isFinite(box.max.x) && Number.isFinite(box.max.y) && Number.isFinite(box.max.z)
    );
  }

  private getFragmentsMap(): Map<string, any> | null {
    try {
      return (this.engine.fragments as any)?.list || null;
    } catch {
      return null;
    }
  }

  private async collectModelElements(): Promise<{ hasLoadedModels: boolean; elements: ModelScanElement[] }> {
    const list: ModelScanElement[] = [];
    const fragList = this.getFragmentsMap();
    const hasLoadedModels = Boolean(fragList && fragList.size > 0);
    if (!hasLoadedModels || !fragList) {
      return { hasLoadedModels: false, elements: list };
    }

    const activeTokens = new Set<string>();
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      for (const c of rule.categoryA) activeTokens.add(c.toUpperCase());
      for (const c of rule.categoryB) activeTokens.add(c.toUpperCase());
    }
    const skipCategories = new Set([
      "IFCPROJECT", "IFCSITE", "IFCBUILDING", "IFCBUILDINGSTOREY", "IFCSPACE", "IFCOPENINGELEMENT", "IFCGRID"
    ]);

    const indexer = FragmentIndexer.getInstance();
    for (const [modelId, model] of fragList) {
      let extractedViaFragments = false;

      // Path A: Shared async @thatopen/fragments v3 FragmentIndexer (cached categories + boxes + names)
      try {
        if (
          model &&
          typeof model.getCategories === "function" &&
          typeof model.getItemsOfCategories === "function" &&
          typeof model.getBoxes === "function"
        ) {
          const indexed = await indexer.indexModel(modelId, model, {
            includeBoxes: true,
            maxElements: ClashDetector.MAX_SCAN_ELEMENTS_PER_MODEL,
          });
          if (indexed.elements.length > 0 && indexed.elements.some((e) => e.box !== null)) {
            for (const el of indexed.elements) {
              if (!el.box || !this.isValidBox(el.box)) continue;
              const up = el.category.toUpperCase();
              if (skipCategories.has(up)) continue;
              let matched = false;
              for (const tok of activeTokens) {
                if (up.includes(tok)) {
                  matched = true;
                  break;
                }
              }
              if (!matched) continue;
              list.push({
                modelId,
                expressId: el.expressId,
                category: el.category,
                name: el.name,
                box: el.box.clone(),
              });
            }
            extractedViaFragments = true;
          }
        }
      } catch {}

      if (extractedViaFragments) continue;

      // Path B: Fallback for legacy/test models with explicit model.properties
      try {
        if (model && model.properties) {
          const meshBoxes: THREE.Box3[] = [];
          try {
            const rootObj = (model?.object || model) as THREE.Object3D;
            if (rootObj && typeof rootObj.traverse === "function") {
              rootObj.traverse((child) => {
                if (child instanceof THREE.Mesh) {
                  const b = new THREE.Box3().setFromObject(child);
                  if (this.isValidBox(b)) meshBoxes.push(b);
                }
              });
            }
          } catch {}

          let propIndex = 0;
          for (const expressIdStr in model.properties) {
            const id = parseInt(expressIdStr, 10);
            const p = model.properties[id];
            if (!p) continue;
            const cat = String(p.type || p._category || p.typeStr || "IFC ELEMENT");
            if (cat === "IFCBUILDINGELEMENT") continue;
            const name = String(p.Name?.value || p.name || `Element #${id}`);

            let box: THREE.Box3;
            if (this.isValidBox(p.boundingBox)) {
              box = p.boundingBox.clone();
            } else if (meshBoxes.length > 0) {
              box = meshBoxes[propIndex % meshBoxes.length].clone();
            } else {
              box = new THREE.Box3(
                new THREE.Vector3(-1 + (id % 10), 0 + (id % 4) * 3, -1 + (id % 8)),
                new THREE.Vector3(1 + (id % 10), 0.5 + (id % 4) * 3, 1 + (id % 8))
              );
            }
            propIndex++;

            list.push({
              modelId,
              expressId: id,
              category: cat,
              name,
              box,
            });
            if (propIndex >= ClashDetector.MAX_SCAN_ELEMENTS_PER_MODEL) break;
          }
        }
      } catch {}
    }

    return { hasLoadedModels, elements: list };
  }

  public focusClash(clashId: string) {
    const clash = this.clashResults.find((c) => c.id === clashId);
    if (!clash) return;

    const aimCamera = (center: [number, number, number], dist: number) => {
      try {
        const camera = this.engine.world?.camera;
        if (camera && (camera as any).controls?.setLookAt) {
          const offset = Math.max(3.5, Math.min(18, dist));
          (camera as any).controls.setLookAt(
            center[0] + offset,
            center[1] + offset * 0.75,
            center[2] + offset,
            center[0],
            center[1],
            center[2],
            true
          );
        }
      } catch {}
    };

    aimCamera(clash.intersectionPoint, 5);

    const fragList = this.getFragmentsMap();
    const hasA = Boolean(fragList?.has?.(clash.elementA.modelId));
    const hasB = Boolean(fragList?.has?.(clash.elementB.modelId));

    // Refine focus framing using live element bounds if present in fragments
    if (fragList && (hasA || hasB)) {
      void (async () => {
        try {
          const merged = new THREE.Box3();
          if (hasA) {
            const mA = fragList.get(clash.elementA.modelId);
            const boxes = typeof mA?.getBoxes === "function" ? await mA.getBoxes([clash.elementA.expressId]) : [];
            if (this.isValidBox(boxes?.[0])) merged.union(boxes[0]);
          }
          if (hasB) {
            const mB = fragList.get(clash.elementB.modelId);
            const boxes = typeof mB?.getBoxes === "function" ? await mB.getBoxes([clash.elementB.expressId]) : [];
            if (this.isValidBox(boxes?.[0])) merged.union(boxes[0]);
          }
          if (!merged.isEmpty()) {
            const sphere = merged.getBoundingSphere(new THREE.Sphere());
            aimCamera(clash.intersectionPoint, sphere.radius * 1.4);
          }
        } catch {}
      })();
    }

    // Highlight clash pair elements using distinct ClashElementA (red) & ClashElementB (amber) styles
    const highlightMap: Record<string, Set<number>> = {};
    if (hasA) {
      highlightMap[clash.elementA.modelId] = new Set([clash.elementA.expressId]);
    }
    if (hasB) {
      if (!highlightMap[clash.elementB.modelId]) highlightMap[clash.elementB.modelId] = new Set();
      highlightMap[clash.elementB.modelId].add(clash.elementB.expressId);
    }

    if (Object.keys(highlightMap).length === 0) return;

    try {
      const fragsReady = Boolean((this.engine.fragments as any)?.initialized);
      const highlighter = this.engine.highlighter;
      if (fragsReady && highlighter) {
        if (highlighter.styles && typeof highlighter.styles.set === "function") {
          if (!highlighter.styles.has("ClashElementA")) {
            highlighter.styles.set("ClashElementA", {
              color: new THREE.Color(0xef4444),
              opacity: 0.9,
              transparent: true,
              renderedFaces: 0 as any,
              priority: 60,
            });
          }
          if (!highlighter.styles.has("ClashElementB")) {
            highlighter.styles.set("ClashElementB", {
              color: new THREE.Color(0xf59e0b),
              opacity: 0.9,
              transparent: true,
              renderedFaces: 0 as any,
              priority: 60,
            });
          }
        }

        highlighter.clear?.("select")?.catch?.(() => {});
        highlighter.clear?.("ClashElementA")?.catch?.(() => {});
        highlighter.clear?.("ClashElementB")?.catch?.(() => {});

        if (hasA) {
          highlighter.highlightByID?.(
            "ClashElementA",
            { [clash.elementA.modelId]: new Set([clash.elementA.expressId]) },
            true,
            false
          )?.catch?.(() => {});
        }
        if (hasB) {
          highlighter.highlightByID?.(
            "ClashElementB",
            { [clash.elementB.modelId]: new Set([clash.elementB.expressId]) },
            true,
            false
          )?.catch?.(() => {});
        }
      }

      if (fragsReady && this.engine.outliner && typeof this.engine.outliner.addItems === "function") {
        this.engine.outliner.clean?.();
        this.engine.outliner.addItems(highlightMap)?.catch?.(() => {});
      }

      if (fragsReady && this.isolateContextOnFocus && this.engine.hider?.isolate) {
        Promise.resolve(this.engine.hider.isolate(highlightMap)).catch(() => {});
      }
    } catch {}
  }

  public async exportClashesToNativeBcfZip(): Promise<number> {
    const bcf = BcfIssueManager.getInstance();
    let added = 0;
    const targetList =
      this.severityFilter === "all"
        ? this.clashResults
        : this.clashResults.filter((c) => c.severity === this.severityFilter);

    for (const c of targetList.slice(0, 50)) {
      if (!this.promotedClashIds.has(c.id)) {
        bcf.createIssueFromClash(c);
        this.promotedClashIds.add(c.id);
        added++;
      }
    }
    const ok = await bcf.exportNativeBcfZip();
    return ok ? targetList.slice(0, 50).length : added;
  }

  public updateClashStatus(clashId: string, status: ClashStatus) {
    const clash = this.clashResults.find((c) => c.id === clashId);
    if (clash) {
      clash.status = status;
      this.updateClashUI();
    }
  }

  public promoteClashToBcf(clashId: string): BcfTopic | null {
    const clash = this.clashResults.find((c) => c.id === clashId);
    if (!clash) return null;
    const topic = BcfIssueManager.getInstance().createIssueFromClash(clash);
    clash.status = "active";
    this.updateClashUI();
    return topic;
  }

  public exportBcfIssues(): string {
    const bcfTopics = this.clashResults.map((c, index) => ({
      guid: `guid-clash-${index + 1}`,
      topicType: "Clash",
      topicStatus: c.status,
      title: `[${c.severity.toUpperCase()}] ${c.disciplineA} vs ${c.disciplineB}`,
      priority: c.severity === "critical" ? "Critical" : "Major",
      creationDate: new Date().toISOString(),
      description: `Collision detected between ${c.elementA.name} (#${c.elementA.expressId}) and ${c.elementB.name} (#${c.elementB.expressId}) with ${c.overlapDistance}m overlap.`,
      viewpoint: {
        cameraPosition: c.intersectionPoint,
      },
    }));

    return JSON.stringify({ bcfVersion: "3.0", project: "BIM Kintsugi Project", topics: bcfTopics }, null, 2);
  }

  private renderClashBeacons() {
    this.clearClashMarkers();

    for (const clash of this.clashResults) {
      const p = clash.intersectionPoint;
      const color = clash.severity === "critical" ? 0xef4444 : 0xf59e0b;

      // Glowing clash pulse pin
      const pinGeo = new THREE.OctahedronGeometry(0.25, 0);
      const pinMat = new THREE.MeshBasicMaterial({
        color,
        wireframe: false,
        depthTest: false,
        transparent: true,
        opacity: 0.85,
      });
      const pin = new THREE.Mesh(pinGeo, pinMat);
      pin.position.set(p[0], p[1], p[2]);
      pin.renderOrder = 9999;
      this.clashMarkerGroup.add(pin);

      // Register clustered HTML 3D pin via ThatOpen OBF.Marker
      try {
        if (this.engine.marker && this.engine.world && typeof document !== "undefined") {
          const badge = document.createElement("div");
          badge.className = `bim-clash-3d-marker severity-${clash.severity}`;
          badge.style.cssText = `
            background: ${clash.severity === "critical" ? "rgba(239,68,68,0.92)" : "rgba(245,158,11,0.92)"};
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 7px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.4);
            cursor: pointer;
            pointer-events: auto;
            box-shadow: 0 2px 8px rgba(0,0,0,0.45);
            white-space: nowrap;
          `;
          badge.textContent = `⚡ ${(clash.overlapDistance * 1000).toFixed(0)}mm`;
          badge.title = `${clash.elementA.name} × ${clash.elementB.name}`;
          badge.addEventListener("click", (e) => {
            e.stopPropagation();
            this.focusClash(clash.id);
          });
          const id = this.engine.marker.create(
            this.engine.world,
            badge,
            new THREE.Vector3(p[0], p[1], p[2])
          );
          if (id) {
            this.markerIds.push(id);
          }
        }
      } catch (e) {}
    }
  }

  private clearClashMarkers() {
    while (this.clashMarkerGroup.children.length > 0) {
      const child = this.clashMarkerGroup.children[0] as THREE.Mesh;
      this.clashMarkerGroup.remove(child);
      child.geometry?.dispose?.();
      (child.material as THREE.Material)?.dispose?.();
    }
    try {
      if (this.engine.marker) {
        for (const id of this.markerIds) {
          this.engine.marker.delete(id);
        }
      }
    } catch (e) {}
    this.markerIds = [];
  }

  public getClashMatrix(): { disciplines: string[]; matrix: Record<string, Record<string, number>> } {
    const discSet = new Set<string>();
    for (const c of this.clashResults) {
      if (c.disciplineA) discSet.add(c.disciplineA);
      if (c.disciplineB) discSet.add(c.disciplineB);
    }
    const disciplines = Array.from(discSet).sort();
    if (disciplines.length === 0) {
      disciplines.push("Architecture", "Structure", "MEP");
    }

    const matrix: Record<string, Record<string, number>> = {};
    for (const d1 of disciplines) {
      matrix[d1] = {};
      for (const d2 of disciplines) {
        matrix[d1][d2] = 0;
      }
    }

    for (const c of this.clashResults) {
      const a = c.disciplineA;
      const b = c.disciplineB;
      if (matrix[a] && matrix[a][b] !== undefined) {
        matrix[a][b]++;
      }
      if (a !== b && matrix[b] && matrix[b][a] !== undefined) {
        matrix[b][a]++;
      }
    }

    return { disciplines, matrix };
  }

  public updateClashUI() {
    if (typeof document === "undefined") return;

    const listEl = document.getElementById("clash-results-list");
    const countBadge = document.getElementById("clash-total-badge");
    const critBadge = document.getElementById("clash-critical-badge");
    const headerCount = document.getElementById("clash-header-count");
    const matrixContainer = document.getElementById("clash-matrix-container");
    const summaryEl = document.getElementById("clash-scan-summary");
    const rulesContainer = document.getElementById("clash-rules-container");
    const runBtn = document.getElementById("btn-run-clash-audit") as HTMLButtonElement | null;
    const sevFilterEl = document.getElementById("clash-severity-filter") as HTMLSelectElement | null;

    if (runBtn) {
      runBtn.disabled = this.isScanning;
      const span = runBtn.querySelector("span");
      if (span) span.textContent = this.isScanning ? "Scanning..." : "Run Clash Audit";
    }

    if (sevFilterEl && sevFilterEl.value !== this.severityFilter) {
      sevFilterEl.value = this.severityFilter;
    }

    const criticalCount = this.clashResults.filter((c) => c.severity === "critical").length;
    if (countBadge) countBadge.innerText = `${this.clashResults.length} Total`;
    if (critBadge) critBadge.innerText = `${criticalCount} Critical`;
    if (headerCount) {
      headerCount.innerText = String(this.clashResults.length);
      headerCount.classList.toggle("hidden", this.clashResults.length === 0);
    }

    if (summaryEl) {
      if (!this.lastScanSummary) {
        summaryEl.className = "clash-scan-summary";
        summaryEl.innerHTML = `<span style="color: var(--text-muted);">Ready to scan loaded models across ${this.rules.filter((r) => r.enabled).length} active rules.</span>`;
      } else {
        const s = this.lastScanSummary;
        const modeTag = s.source === "demo"
          ? `<span class="clash-source-pill demo">Demo Preview (No Model)</span>`
          : `<span class="clash-source-pill model">Model Audit (${s.scannedElements} elems)</span>`;
        const bvhNote = this.deepMeshVerification
          ? ` · BVH filtered ${s.filteredFalsePositives}`
          : "";
        const sapNote = s.broadPhaseMode === "worker-sap" ? " · Worker SAP" : " · Sync SAP";
        summaryEl.className = "clash-scan-summary";
        summaryEl.innerHTML = `${modeTag}<span style="color: var(--text-muted);">${s.elapsedMs}ms${escapeHtml(sapNote + bvhNote)}</span>`;
      }
    }

    if (rulesContainer) {
      rulesContainer.innerHTML = "";
      this.rules.forEach((rule, idx) => {
        const chip = document.createElement("div");
        chip.className = "clash-rule-chip";
        const hardMm = Math.round(rule.hardClashTolerance * 1000);
        const clearMm = Math.round(rule.softClearanceBuffer * 1000);
        chip.title = `${rule.name} (Hard >= ${hardMm}mm, Clearance ${clearMm}mm)`;
        chip.innerHTML = `
          <label class="clash-rule-head">
            <input type="checkbox" class="chk-clash-rule" ${rule.enabled ? "checked" : ""} />
            <span>${escapeHtml(rule.name)}</span>
          </label>
          <div class="clash-rule-tolerances">
            <label title="Hard clash threshold (mm)">Hard <input type="number" class="clash-tol-input" data-tol="hard" min="0" max="500" step="5" value="${hardMm}" />mm</label>
            <label title="Clearance envelope (mm)">Clr <input type="number" class="clash-tol-input" data-tol="clear" min="0" max="1000" step="5" value="${clearMm}" />mm</label>
          </div>
        `;
        chip.querySelector(".chk-clash-rule")?.addEventListener("change", (e) => {
          rule.enabled = (e.target as HTMLInputElement).checked;
          if (!this.lastScanSummary && summaryEl) {
            this.updateClashUI();
          }
        });
        const hardIn = chip.querySelector('input[data-tol="hard"]') as HTMLInputElement | null;
        const clrIn = chip.querySelector('input[data-tol="clear"]') as HTMLInputElement | null;
        const onTolChange = () => {
          const hMm = Math.max(0, Number(hardIn?.value ?? hardMm) || 0);
          const cMm = Math.max(0, Number(clrIn?.value ?? clearMm) || 0);
          rule.hardClashTolerance = hMm / 1000;
          rule.softClearanceBuffer = cMm / 1000;
        };
        hardIn?.addEventListener("change", onTolChange);
        clrIn?.addEventListener("change", onTolChange);
        chip.dataset.ruleIndex = String(idx);
        rulesContainer.appendChild(chip);
      });
    }

    // Render Multi-Discipline Clash Matrix Grid
    if (matrixContainer) {
      const { disciplines, matrix } = this.getClashMatrix();
      let tableHtml = `<table class="clash-matrix-table"><thead><tr><th>Discipline</th>`;
      disciplines.forEach((d) => {
        tableHtml += `<th>${escapeHtml(d.slice(0, 5).toUpperCase())}</th>`;
      });
      tableHtml += `</tr></thead><tbody>`;

      disciplines.forEach((d1) => {
        tableHtml += `<tr><td class="row-header">${escapeHtml(d1)}</td>`;
        disciplines.forEach((d2) => {
          if (d1 === d2) {
            tableHtml += `<td class="cell-diag">—</td>`;
          } else {
            const count = matrix[d1]?.[d2] || 0;
            const heatClass = count > 5 ? "heat-high" : (count > 0 ? "heat-med" : "heat-none");
            tableHtml += `<td class="cell-count ${heatClass}" title="${d1} × ${d2}: ${count} clashes">${count}</td>`;
          }
        });
        tableHtml += `</tr>`;
      });
      tableHtml += `</tbody></table>`;
      matrixContainer.innerHTML = tableHtml;
    }

    const filteredClashes =
      this.severityFilter === "all"
        ? this.clashResults
        : this.clashResults.filter((c) => c.severity === this.severityFilter);

    if (listEl) {
      listEl.innerHTML = "";
      if (this.isScanning) {
        listEl.innerHTML = `<div class="empty-state-hint">Scanning model element bounding volumes and intersections...</div>`;
      } else if (filteredClashes.length === 0) {
        if (this.lastScanSummary?.source === "model" && this.clashResults.length === 0) {
          listEl.innerHTML = `<div class="empty-state-hint">Clean Audit: 0 clashes found across ${this.lastScanSummary.scannedElements} scanned elements.</div>`;
        } else if (this.clashResults.length > 0) {
          listEl.innerHTML = `<div class="empty-state-hint">No ${escapeHtml(this.severityFilter)} clashes match the current filter (${this.clashResults.length} total).</div>`;
        } else {
          listEl.innerHTML = `<div class="empty-state-hint">No clashes detected. Click 'Run Clash Audit' to scan all discipline models.</div>`;
        }
      } else {
        filteredClashes.forEach((c) => {
          const card = document.createElement("div");
          card.className = `clash-card severity-${c.severity}`;
          const distLabel = c.severity === "clearance"
            ? `${(c.overlapDistance * 1000).toFixed(0)}mm clearance`
            : `${(c.overlapDistance * 1000).toFixed(0)}mm overlap`;
          const ciTag = typeof c.criticalityIndex === "number"
            ? `<span class="clash-ci-badge" style="font-size:0.6rem;font-weight:800;padding:1px 5px;border-radius:3px;background:rgba(168,85,247,0.18);color:#c084fc;border:1px solid rgba(168,85,247,0.4);" title="BWM Clash Criticality Index (${c.criticalityTier ?? ""})">CI ${c.criticalityIndex.toFixed(2)}</span>`
            : "";
          card.innerHTML = `
            <div class="clash-card-header">
              <span class="clash-badge ${c.severity}">${c.severity.toUpperCase()}</span>
              <span class="clash-overlap">${distLabel}</span>
              ${ciTag}
              <span class="clash-status-tag ${c.status}">${c.status}</span>
            </div>
            <div class="clash-pair-title">
              <strong>${escapeHtml(c.elementA.name)}</strong> × <strong>${escapeHtml(c.elementB.name)}</strong>
            </div>
            <div class="clash-disciplines">
              <span>${escapeHtml(c.disciplineA)}</span> · <span>${escapeHtml(c.disciplineB)}</span>
            </div>
            <div class="clash-actions">
              <button class="btn-xs btn-accent focus-clash-btn" data-id="${c.id}">Zoom & Isolate</button>
              <button class="btn-xs btn-outline promote-bcf-btn" data-id="${c.id}" title="Promote Clash to Tracked BCF Issue">+ BCF Issue</button>
              <select class="clash-status-select" data-id="${c.id}">
                <option value="new" ${c.status === "new" ? "selected" : ""}>New</option>
                <option value="active" ${c.status === "active" ? "selected" : ""}>Active</option>
                <option value="reviewed" ${c.status === "reviewed" ? "selected" : ""}>Reviewed</option>
                <option value="resolved" ${c.status === "resolved" ? "selected" : ""}>Resolved</option>
              </select>
            </div>
          `;

          card.querySelector(".focus-clash-btn")?.addEventListener("click", () => {
            this.focusClash(c.id);
          });

          card.querySelector(".promote-bcf-btn")?.addEventListener("click", () => {
            this.promoteClashToBcf(c.id);
            try {
              (window as any).renderBcfIssues?.();
            } catch {}
          });

          card.querySelector(".clash-status-select")?.addEventListener("change", (e) => {
            const val = (e.target as HTMLSelectElement).value as ClashStatus;
            this.updateClashStatus(c.id, val);
          });

          listEl.appendChild(card);
        });
      }
    }
  }
}
