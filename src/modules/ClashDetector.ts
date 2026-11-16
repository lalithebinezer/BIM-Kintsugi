import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { MeshBVH } from "three-mesh-bvh";
import { BimEngine } from "../core/BimEngine";
import { BcfIssueManager, type BcfTopic } from "./BcfIssueManager";
import { escapeHtml } from "../utils/formatters";

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
  private static readonly MAX_SCAN_ELEMENTS_PER_MODEL = 4000;
  private static readonly MAX_CLASH_RESULTS = 200;
  private engine: BimEngine;
  private clashResults: ClashResult[] = [];
  private isScanning: boolean = false;
  private clashMarkerGroup: THREE.Group;
  private markerIds: string[] = [];
  private deepMeshVerification: boolean = false;
  private lastFalsePositivesFiltered: number = 0;
  private severityFilter: ClashSeverity | "all" = "all";
  private lastScanSummary: ClashScanSummary | null = null;

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

  public clearClashes(): void {
    this.clashResults = [];
    this.lastFalsePositivesFiltered = 0;
    this.lastScanSummary = null;
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
      }
    } catch {}
    this.updateClashUI();
  }

  /**
   * Executes collision matrix scan across loaded BIM models and element geometries.
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
      const seenPairs = new Set<string>();

      for (const rule of this.rules) {
        if (!rule.enabled) continue;

        const groupA = elements.filter((el) =>
          rule.categoryA.some((cat) => el.category.toUpperCase().includes(cat))
        );
        const groupB = elements.filter((el) =>
          rule.categoryB.some((cat) => el.category.toUpperCase().includes(cat))
        );

        const buf = rule.softClearanceBuffer;

        for (let i = 0; i < groupA.length; i++) {
          const elA = groupA[i];
          const a = elA.box;
          for (let j = 0; j < groupB.length; j++) {
            const elB = groupB[j];
            if (elA.modelId === elB.modelId && elA.expressId === elB.expressId) continue;

            const keyA = `${elA.modelId}:${elA.expressId}`;
            const keyB = `${elB.modelId}:${elB.expressId}`;
            const pairKey = keyA < keyB ? `${keyA}|${keyB}` : `${keyB}|${keyA}`;
            if (seenPairs.has(pairKey)) continue;

            const b = elB.box;
            if (
              a.max.x + buf < b.min.x || b.max.x + buf < a.min.x ||
              a.max.y + buf < b.min.y || b.max.y + buf < a.min.y ||
              a.max.z + buf < b.min.z || b.max.z + buf < a.min.z
            ) {
              continue;
            }

            const penX = Math.min(a.max.x, b.max.x) - Math.max(a.min.x, b.min.x);
            const penY = Math.min(a.max.y, b.max.y) - Math.max(a.min.y, b.min.y);
            const penZ = Math.min(a.max.z, b.max.z) - Math.max(a.min.z, b.min.z);
            const minPen = Math.min(penX, penY, penZ);

            const isHard = minPen >= rule.hardClashTolerance;
            const isClearance = !isHard && buf > 0 && minPen >= -buf;
            if (!isHard && !isClearance) continue;

            seenPairs.add(pairKey);

            const overlap = isHard
              ? Number(minPen.toFixed(3))
              : Math.max(0.001, Number((minPen >= 0 ? minPen : buf + minPen).toFixed(3)));

            const ix = (Math.max(a.min.x, b.min.x) + Math.min(a.max.x, b.max.x)) * 0.5;
            const iy = (Math.max(a.min.y, b.min.y) + Math.min(a.max.y, b.max.y)) * 0.5;
            const iz = (Math.max(a.min.z, b.min.z) + Math.min(a.max.z, b.max.z)) * 0.5;

            const severity: ClashSeverity = isHard
              ? (minPen >= 0.05 ? "critical" : "major")
              : "clearance";

            rawResults.push({
              id: `clash_${Date.now()}_${rawResults.length + 1}`,
              disciplineA: this.classifyDiscipline(elA.category),
              disciplineB: this.classifyDiscipline(elB.category),
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
              severity,
              status: "new",
              overlapDistance: overlap,
              intersectionPoint: [ix, iy, iz],
              foundAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            });
          }
        }
      }

      // Optional Phase 5A: Deep triangle-level BVH verification using OBF.Mesher + three-mesh-bvh
      this.lastFalsePositivesFiltered = 0;
      const severityWeight: Record<ClashSeverity, number> = { critical: 0, major: 1, minor: 2, clearance: 3 };
      rawResults.sort(
        (x, y) => severityWeight[x.severity] - severityWeight[y.severity] || y.overlapDistance - x.overlapDistance
      );

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
        candidatePairs: rawResults.length,
        elapsedMs,
        filteredFalsePositives: this.lastFalsePositivesFiltered,
      };
      this.clashResults = verifiedResults;
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

    for (const [modelId, model] of fragList) {
      let extractedViaFragments = false;

      // Path A: Native @thatopen/fragments v3 async category + per-element bounding box API
      try {
        if (
          model &&
          typeof model.getCategories === "function" &&
          typeof model.getItemsOfCategories === "function" &&
          typeof model.getBoxes === "function"
        ) {
          const modelCategories: string[] = await model.getCategories();
          const matchedCats = (modelCategories || []).filter((cat) => {
            const up = String(cat).toUpperCase();
            if (skipCategories.has(up)) return false;
            for (const tok of activeTokens) {
              if (up.includes(tok)) return true;
            }
            return false;
          });

          if (matchedCats.length > 0) {
            const regexes = matchedCats.map(
              (c) => new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
            );
            const catItemsMap: Record<string, number[]> = await model.getItemsOfCategories(regexes);

            const idSet = new Set<number>();
            const idList: number[] = [];
            const idCategory = new Map<number, string>();

            for (const [catName, ids] of Object.entries(catItemsMap || {})) {
              if (!Array.isArray(ids)) continue;
              for (const localId of ids) {
                if (typeof localId !== "number" || idSet.has(localId)) continue;
                idSet.add(localId);
                idList.push(localId);
                idCategory.set(localId, catName);
                if (idList.length >= ClashDetector.MAX_SCAN_ELEMENTS_PER_MODEL) break;
              }
              if (idList.length >= ClashDetector.MAX_SCAN_ELEMENTS_PER_MODEL) break;
            }

            if (idList.length > 0) {
              const boxes: THREE.Box3[] = await model.getBoxes(idList);
              const nameMap = new Map<number, string>();

              if (typeof model.getItemsData === "function") {
                try {
                  const CHUNK = 400;
                  for (let start = 0; start < idList.length; start += CHUNK) {
                    const chunkIds = idList.slice(start, start + CHUNK);
                    const dataArr = await model.getItemsData(chunkIds, {
                      attributesDefault: false,
                      attributes: ["Name"],
                    });
                    for (let k = 0; k < chunkIds.length; k++) {
                      const d = dataArr?.[k];
                      const rawName = d?.Name && typeof d.Name === "object" && "value" in d.Name
                        ? d.Name.value
                        : d?.Name;
                      if (rawName) {
                        nameMap.set(chunkIds[k], String(rawName));
                      }
                    }
                  }
                } catch {}
              }

              for (let i = 0; i < idList.length; i++) {
                const box = boxes?.[i];
                if (!this.isValidBox(box)) continue;
                const localId = idList[i];
                const cat = idCategory.get(localId) || "IFCELEMENT";
                list.push({
                  modelId,
                  expressId: localId,
                  category: cat,
                  name: nameMap.get(localId) || `${cat} #${localId}`,
                  box: box.clone(),
                });
              }
              extractedViaFragments = true;
            }
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
    } catch {}
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
        summaryEl.className = "clash-scan-summary";
        summaryEl.innerHTML = `${modeTag}<span style="color: var(--text-muted);">${s.elapsedMs}ms${escapeHtml(bvhNote)}</span>`;
      }
    }

    if (rulesContainer) {
      rulesContainer.innerHTML = "";
      this.rules.forEach((rule, idx) => {
        const lbl = document.createElement("label");
        lbl.className = "clash-rule-chip";
        lbl.title = `${rule.name} (Hard >= ${(rule.hardClashTolerance * 1000).toFixed(0)}mm, Clearance ${(rule.softClearanceBuffer * 1000).toFixed(0)}mm)`;
        lbl.innerHTML = `
          <input type="checkbox" ${rule.enabled ? "checked" : ""} />
          <span>${escapeHtml(rule.name)}</span>
        `;
        lbl.querySelector("input")?.addEventListener("change", (e) => {
          rule.enabled = (e.target as HTMLInputElement).checked;
          if (!this.lastScanSummary && summaryEl) {
            this.updateClashUI();
          }
        });
        lbl.dataset.ruleIndex = String(idx);
        rulesContainer.appendChild(lbl);
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
          card.innerHTML = `
            <div class="clash-card-header">
              <span class="clash-badge ${c.severity}">${c.severity.toUpperCase()}</span>
              <span class="clash-overlap">${distLabel}</span>
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
