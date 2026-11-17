import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { PointerInputArbiter } from "../core/PointerInputArbiter";
import { BvhAccelerationService } from "../core/BvhAccelerationService";
import { FragmentIndexer } from "../core/FragmentIndexer";
import { CostRateManager } from "./CostRateManager";

function showToast(msg: string, icon?: string) {
  if (typeof (window as any).showToast === "function") {
    (window as any).showToast(msg, icon);
  }
}

export interface SelectionCategoryCount {
  category: string;
  count: number;
  expressIds: number[];
  modelId: string;
}

export interface SelectionInfo {
  totalCount: number;
  modelIdMap: Record<string, Set<number>>;
  primaryModelId?: string;
  primaryExpressId?: number;
  primaryCategory?: string;
  primaryName?: string;
  categories: SelectionCategoryCount[];
}

export interface SelectionBatchSummary {
  totalCount: number;
  modelCount: number;
  categories: SelectionCategoryCount[];
  storeys: Array<{ storey: string; count: number }>;
  totalVolumeM3: number;
  totalAreaM2: number;
  estimatedCost: number;
  formattedCost: string;
  sharedAttributes: Array<{ label: string; value: string }>;
  leadElement?: {
    modelId: string;
    expressId: number;
    category: string;
    name: string;
    storey?: string;
  };
}

export interface SavedSelectionSet {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  modelIdMap: Record<string, number[]>;
}

export type SelectionChangeListener = (
  info: SelectionInfo,
  batch: SelectionBatchSummary
) => void;

interface NormalizedCandidate {
  expressId: number;
  category: string;
  name: string;
  storey?: string;
  box?: THREE.Box3 | null;
}

const MAX_HISTORY_ENTRIES = 25;

function cloneSelectionMap(
  source: Record<string, Set<number> | number[]> | undefined | null
): Record<string, Set<number>> {
  const out: Record<string, Set<number>> = {};
  if (!source) return out;
  for (const mid in source) {
    const entry = source[mid];
    if (!entry) continue;
    const cloned = new Set<number>(entry);
    if (cloned.size > 0) {
      out[mid] = cloned;
    }
  }
  return out;
}

function countSelectionMap(
  map: Record<string, Set<number>> | undefined | null
): number {
  if (!map) return 0;
  let total = 0;
  for (const mid in map) {
    total += map[mid]?.size || 0;
  }
  return total;
}

function selectionMapsEqual(
  a: Record<string, Set<number>>,
  b: Record<string, Set<number>>
): boolean {
  const keysA = Object.keys(a).filter((k) => (a[k]?.size || 0) > 0);
  const keysB = Object.keys(b).filter((k) => (b[k]?.size || 0) > 0);
  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    const setA = a[key];
    const setB = b[key];
    if (!setB || setA.size !== setB.size) return false;
    for (const id of setA) {
      if (!setB.has(id)) return false;
    }
  }
  return true;
}

/**
 * Coordinates 3D viewport selection state, marquee box/crossing picking,
 * category/storey bulk operations, FRAGS v3 batch quantities, selection undo/redo,
 * saved selection sets, and floating HUD synchronization.
 */
export class SelectionManager {
  private static instance: SelectionManager | null = null;
  private engine: BimEngine;
  private boxSelectActive: boolean = false;
  private isDraggingBox: boolean = false;
  private startPoint: { x: number; y: number } = { x: 0, y: 0 };
  private marqueeEl: HTMLElement | null = null;
  private selectedElements: Record<string, Set<number>> = {};
  private savedSets: SavedSelectionSet[] = [];
  private undoStack: Array<Record<string, Set<number>>> = [];
  private redoStack: Array<Record<string, Set<number>>> = [];
  private listeners: Set<SelectionChangeListener> = new Set();

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.loadSavedSets();
    this.initMarqueeDOM();
    this.bindEvents();
  }

  public static getInstance(): SelectionManager {
    if (!SelectionManager.instance) {
      SelectionManager.instance = new SelectionManager();
    }
    return SelectionManager.instance;
  }

  public onSelectionChange(listener: SelectionChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(info?: SelectionInfo, batch?: SelectionBatchSummary) {
    if (this.listeners.size === 0) return;
    const resolvedInfo = info || this.getSelectionInfo();
    const resolvedBatch = batch || this.getBatchSummary(resolvedInfo.modelIdMap);
    for (const cb of this.listeners) {
      try {
        cb(resolvedInfo, resolvedBatch);
      } catch (e) {
        console.warn("SelectionManager listener error:", e);
      }
    }
  }

  private emitSavedSetsChanged() {
    if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("bim-selection-sets-changed", {
          detail: { sets: this.savedSets },
        })
      );
    }
  }

  private loadSavedSets() {
    try {
      const stored =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("bim_selection_sets")
          : null;
      if (stored) {
        this.savedSets = JSON.parse(stored);
      }
    } catch {
      this.savedSets = [];
    }
  }

  private persistSavedSets() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("bim_selection_sets", JSON.stringify(this.savedSets));
      }
    } catch {}
    this.emitSavedSetsChanged();
  }

  private initMarqueeDOM() {
    if (typeof document === "undefined") return;
    this.marqueeEl = document.getElementById("selection-marquee-box");
    if (!this.marqueeEl) {
      this.marqueeEl = document.createElement("div");
      this.marqueeEl.id = "selection-marquee-box";
      this.marqueeEl.className = "selection-marquee-box marquee-crossing";
      this.marqueeEl.style.display = "none";
      document.body.appendChild(this.marqueeEl);
    }
  }

  private bindEvents() {
    if (typeof document === "undefined") return;
    const container = this.engine.container;
    if (!container) return;

    const arbiter = PointerInputArbiter.getInstance();
    arbiter.attach(container);
    arbiter.registerHandler({
      id: "marquee-selection",
      priority: "marquee",
      isActive: () => true,
      onPointerDown: (e: PointerEvent) => {
        if ((this.boxSelectActive || e.altKey) && e.button === 0) {
          this.isDraggingBox = true;
          this.startPoint = { x: e.clientX, y: e.clientY };

          if (this.marqueeEl) {
            this.marqueeEl.style.left = `${e.clientX}px`;
            this.marqueeEl.style.top = `${e.clientY}px`;
            this.marqueeEl.style.width = "0px";
            this.marqueeEl.style.height = "0px";
            this.marqueeEl.className = e.ctrlKey
              ? "selection-marquee-box marquee-subtract"
              : "selection-marquee-box marquee-window";
            this.marqueeEl.style.display = "block";
          }

          this.setOrbitControlsEnabled(false);
          return true;
        }
        return false;
      },
      onPointerMove: (e: PointerEvent) => {
        if (!this.isDraggingBox || !this.marqueeEl) return;

        const currentX = e.clientX;
        const currentY = e.clientY;
        const isCrossing = currentX < this.startPoint.x;
        const modeClass = e.ctrlKey
          ? "marquee-subtract"
          : isCrossing
            ? "marquee-crossing"
            : "marquee-window";
        this.marqueeEl.className = `selection-marquee-box ${modeClass}`;

        const minX = Math.min(this.startPoint.x, currentX);
        const minY = Math.min(this.startPoint.y, currentY);
        const width = Math.abs(currentX - this.startPoint.x);
        const height = Math.abs(currentY - this.startPoint.y);

        this.marqueeEl.style.left = `${minX}px`;
        this.marqueeEl.style.top = `${minY}px`;
        this.marqueeEl.style.width = `${width}px`;
        this.marqueeEl.style.height = `${height}px`;
      },
      onPointerUp: async (e: PointerEvent) => {
        if (!this.isDraggingBox) return;
        this.isDraggingBox = false;

        this.setOrbitControlsEnabled(true);

        if (this.marqueeEl) {
          this.marqueeEl.style.display = "none";
        }

        const width = Math.abs(e.clientX - this.startPoint.x);
        const height = Math.abs(e.clientY - this.startPoint.y);

        if (width > 8 && height > 8) {
          const minX = Math.min(this.startPoint.x, e.clientX);
          const maxX = Math.max(this.startPoint.x, e.clientX);
          const minY = Math.min(this.startPoint.y, e.clientY);
          const maxY = Math.max(this.startPoint.y, e.clientY);
          const isCrossing = e.clientX < this.startPoint.x;

          await this.performBoxSelection(
            minX,
            minY,
            maxX,
            maxY,
            e.shiftKey,
            isCrossing,
            e.ctrlKey
          );
        }
      },
    });
  }

  private setOrbitControlsEnabled(enabled: boolean) {
    try {
      const controls = this.engine.world?.camera?.controls as any;
      if (controls) controls.enabled = enabled;
    } catch {}
  }

  /**
   * Cancels an active in-progress marquee drag without disturbing existing selection.
   */
  public cancelActiveBoxDrag(): boolean {
    if (!this.isDraggingBox) return false;
    this.isDraggingBox = false;
    if (this.marqueeEl) {
      this.marqueeEl.style.display = "none";
    }
    this.setOrbitControlsEnabled(true);
    showToast("Box drag cancelled");
    return true;
  }

  public toggleBoxSelectMode(force?: boolean): boolean {
    this.boxSelectActive = force !== undefined ? force : !this.boxSelectActive;
    const btn = document.getElementById("btn-box-select");
    const liveContainer =
      typeof document !== "undefined" ? document.getElementById("container") : null;
    const container =
      liveContainer ||
      (this.engine.container instanceof HTMLElement ? this.engine.container : null);

    if (container && container.classList) {
      container.classList.toggle("box-select-cursor", this.boxSelectActive);
    }

    if (btn) {
      if (this.boxSelectActive) {
        btn.classList.add("active");
        btn.style.borderColor = "var(--accent-500)";
        showToast(
          "Box Selection Active (L→R Window • R→L Crossing • Shift Add • Ctrl Subtract)",
          `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><polyline points="9 9 15 15"/><polyline points="15 9 9 15"/></svg>`
        );
      } else {
        btn.classList.remove("active");
        btn.style.borderColor = "";
      }
    }
    return this.boxSelectActive;
  }

  public isBoxSelectActive(): boolean {
    return this.boxSelectActive;
  }

  public canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  private pushUndoSnapshot(snapshot: Record<string, Set<number>>) {
    const cloned = cloneSelectionMap(snapshot);
    const last = this.undoStack[this.undoStack.length - 1];
    if (last && selectionMapsEqual(last, cloned)) {
      return;
    }
    this.undoStack.push(cloned);
    if (this.undoStack.length > MAX_HISTORY_ENTRIES) {
      this.undoStack.shift();
    }
    this.redoStack = [];
  }

  private commitSelectionState(
    nextMap: Record<string, Set<number> | number[]>,
    options: { recordHistory?: boolean; notify?: boolean } = {}
  ): boolean {
    const normalized = cloneSelectionMap(nextMap);
    const changed = !selectionMapsEqual(normalized, this.selectedElements);

    if (changed && options.recordHistory !== false) {
      // Skip storing empty->empty transitions so first undo lands directly on last meaningful selection
      if (countSelectionMap(this.selectedElements) > 0 || countSelectionMap(normalized) > 0) {
        this.pushUndoSnapshot(this.selectedElements);
      }
    }

    this.selectedElements = normalized;
    this.updateSelectionHUD();
    if (options.notify !== false) {
      this.notifyListeners();
    }
    return changed;
  }

  private async applyHighlightMap(
    map: Record<string, Set<number>>,
    zoomToSelection: boolean = false
  ) {
    const highlighter = this.engine.highlighter;
    if (!highlighter) return;
    const total = countSelectionMap(map);
    try {
      if (total > 0 && typeof highlighter.highlightByID === "function") {
        await highlighter.highlightByID("select", map, true, zoomToSelection);
      } else if (total === 0 && typeof highlighter.clear === "function") {
        await highlighter.clear("select");
      }
    } catch {}
  }

  /**
   * Restores the previous selection state from the undo stack.
   */
  public async undoSelection(): Promise<boolean> {
    const prev = this.undoStack.pop();
    if (!prev) {
      showToast("No earlier selection in history");
      return false;
    }
    this.redoStack.push(cloneSelectionMap(this.selectedElements));
    this.selectedElements = cloneSelectionMap(prev);
    const count = countSelectionMap(this.selectedElements);
    await this.applyHighlightMap(this.selectedElements, false);
    this.updateSelectionHUD();
    this.notifyListeners();
    showToast(
      count > 0 ? `Restored Previous Selection (${count})` : "Restored Empty Selection"
    );
    return true;
  }

  /**
   * Re-applies an undone selection state from the redo stack.
   */
  public async redoSelection(): Promise<boolean> {
    const next = this.redoStack.pop();
    if (!next) {
      showToast("Nothing to redo");
      return false;
    }
    this.undoStack.push(cloneSelectionMap(this.selectedElements));
    this.selectedElements = cloneSelectionMap(next);
    const count = countSelectionMap(this.selectedElements);
    await this.applyHighlightMap(this.selectedElements, false);
    this.updateSelectionHUD();
    this.notifyListeners();
    showToast(
      count > 0 ? `Redid Selection (${count})` : "Redid Empty Selection"
    );
    return true;
  }

  /**
   * Syncs internal map from external single/multi click selection events.
   */
  public syncFromSelectionMap(
    selectionMap: Record<string, Set<number>> | Record<string, number[]>
  ) {
    this.commitSelectionState(selectionMap, { recordHistory: true, notify: true });
  }

  private async getHiddenIdsByModel(): Promise<Record<string, Set<number>>> {
    const hiddenMap: Record<string, Set<number>> = {};
    try {
      const hider = this.engine.hider as any;
      if (hider && typeof hider.getVisibilityMap === "function") {
        const res = await hider.getVisibilityMap(false);
        if (res && typeof res === "object") {
          for (const mid in res) {
            const ids = res[mid];
            if (ids && (ids.length > 0 || ids.size > 0)) {
              hiddenMap[mid] = new Set<number>(ids);
            }
          }
        }
      }
    } catch {}
    return hiddenMap;
  }

  private getIndexedElementsForModel(
    modelId: string,
    model: any
  ): NormalizedCandidate[] {
    const indexer = FragmentIndexer.getInstance();
    const cached =
      indexer.getCachedModel(modelId) || indexer.getSyncModelData(modelId, model);

    if (cached && cached.elements.length > 0) {
      return cached.elements.map((el) => ({
        expressId: el.expressId,
        category: (el.category || "IFCELEMENT").toUpperCase(),
        name: el.name || `Element #${el.expressId}`,
        storey: el.storey,
        box: el.box,
      }));
    }

    const out: NormalizedCandidate[] = [];
    const props = model?.properties;
    if (props && typeof props === "object") {
      for (const idStr in props) {
        const expressId = Number(idStr);
        if (!Number.isFinite(expressId)) continue;
        const p = props[idStr];
        if (!p || typeof p !== "object") continue;
        const category = String(
          p.type ?? p._category ?? p.typeStr ?? "IFCELEMENT"
        ).toUpperCase();
        const name = String(p.Name?.value || p.name || `${category} #${expressId}`);
        const storey = p.storey || p.Storey || p.Level;
        out.push({
          expressId,
          category,
          name,
          storey: storey ? String(storey) : undefined,
          box: p.boundingBox instanceof THREE.Box3 ? p.boundingBox : null,
        });
      }
    }
    return out;
  }

  private projectBoxToScreen(
    box: THREE.Box3,
    camera: THREE.Camera,
    rect: DOMRect,
    tempVec: THREE.Vector3
  ): { minX: number; maxX: number; minY: number; maxY: number; inFront: boolean } {
    const { min, max } = box;
    let sxMin = Infinity;
    let sxMax = -Infinity;
    let syMin = Infinity;
    let syMax = -Infinity;
    let inFrontCount = 0;

    const corners = [
      [min.x, min.y, min.z],
      [min.x, min.y, max.z],
      [min.x, max.y, min.z],
      [min.x, max.y, max.z],
      [max.x, min.y, min.z],
      [max.x, min.y, max.z],
      [max.x, max.y, min.z],
      [max.x, max.y, max.z],
    ];

    for (const [cx, cy, cz] of corners) {
      tempVec.set(cx, cy, cz).project(camera);
      if (tempVec.z >= -1 && tempVec.z <= 1) {
        inFrontCount++;
      }
      const screenX = ((tempVec.x + 1) / 2) * rect.width + rect.left;
      const screenY = ((-tempVec.y + 1) / 2) * rect.height + rect.top;
      if (screenX < sxMin) sxMin = screenX;
      if (screenX > sxMax) sxMax = screenX;
      if (screenY < syMin) syMin = screenY;
      if (screenY > syMax) syMax = screenY;
    }

    return {
      minX: sxMin,
      maxX: sxMax,
      minY: syMin,
      maxY: syMax,
      inFront: inFrontCount > 0,
    };
  }

  /**
   * Performs 3D frustum / screen projected box selection
   */
  public async performBoxSelection(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    isAdditive: boolean = false,
    _isCrossing: boolean = true,
    isSubtractive: boolean = false
  ) {
    const world = this.engine.world;
    const camera = world?.camera?.three as
      | THREE.PerspectiveCamera
      | THREE.OrthographicCamera
      | undefined;
    if (!camera || !this.engine.fragments) return;

    const rect = this.engine.container.getBoundingClientRect();
    const tempVec = new THREE.Vector3();
    const domEl = this.engine.world.renderer?.three?.domElement;
    const hiddenMap = await this.getHiddenIdsByModel();
    const boxHitsMap: Record<string, Set<number>> = {};

    for (const [modelId, model] of FragmentIndexer.getInstance().getSafeModelsMap(
      this.engine.fragments
    )) {
      const anyModel = model as any;
      const hits = new Set<number>();
      const hiddenSet = hiddenMap[modelId];

      // 1. Prefer native FRAGS v3 rectangleRaycast
      if (domEl && typeof anyModel.rectangleRaycast === "function") {
        try {
          const topLeft = new THREE.Vector2(minX - rect.left, minY - rect.top);
          const bottomRight = new THREE.Vector2(maxX - rect.left, maxY - rect.top);
          const rectRes = await anyModel.rectangleRaycast({
            camera,
            dom: domEl,
            topLeft,
            bottomRight,
            fullyIncluded: !_isCrossing,
          });
          if (rectRes?.localIds?.length) {
            for (const lid of rectRes.localIds) {
              if (!hiddenSet || !hiddenSet.has(lid)) {
                hits.add(lid);
              }
            }
          }
        } catch {}
      }

      // 2. Fallback to per-element Box3 bounds from FragmentIndexer (Window vs Crossing accurate)
      if (hits.size === 0) {
        const candidates = this.getIndexedElementsForModel(modelId, anyModel);
        for (const el of candidates) {
          if (hiddenSet && hiddenSet.has(el.expressId)) continue;
          if (!el.box) continue;
          const proj = this.projectBoxToScreen(el.box, camera, rect, tempVec);
          if (!proj.inFront) continue;

          const matched = _isCrossing
            ? proj.maxX >= minX &&
              proj.minX <= maxX &&
              proj.maxY >= minY &&
              proj.minY <= maxY
            : proj.minX >= minX &&
              proj.maxX <= maxX &&
              proj.minY >= minY &&
              proj.maxY <= maxY;

          if (matched) {
            hits.add(el.expressId);
          }
        }
      }

      // 3. Fallback for mock item dictionaries
      if (hits.size === 0 && anyModel.items) {
        for (const expressIdStr in anyModel.items) {
          const expressId = Number(expressIdStr);
          if (hiddenSet && hiddenSet.has(expressId)) continue;
          const item = anyModel.items[expressId];
          if (item && item.position) {
            tempVec.copy(item.position);
            tempVec.project(camera);

            const screenX = ((tempVec.x + 1) / 2) * rect.width + rect.left;
            const screenY = ((-tempVec.y + 1) / 2) * rect.height + rect.top;

            if (
              tempVec.z >= 0 &&
              tempVec.z <= 1 &&
              screenX >= minX &&
              screenX <= maxX &&
              screenY >= minY &&
              screenY <= maxY
            ) {
              hits.add(expressId);
            }
          }
        }
      }

      // 4. Last-resort Three.js mesh fallback using BVH-ready bounding spheres
      if (hits.size === 0 && anyModel.properties && anyModel.object) {
        BvhAccelerationService.getInstance().patchThreePrototypes();
        anyModel.object.traverse((child: any) => {
          if (child.isMesh && child.geometry) {
            if (!child.geometry.boundingSphere) child.geometry.computeBoundingSphere();
            const sphere = child.geometry.boundingSphere;
            if (sphere) {
              tempVec.copy(sphere.center);
              child.localToWorld(tempVec);
              tempVec.project(camera);

              const screenX = ((tempVec.x + 1) / 2) * rect.width + rect.left;
              const screenY = ((-tempVec.y + 1) / 2) * rect.height + rect.top;

              if (
                tempVec.z >= 0 &&
                tempVec.z <= 1 &&
                screenX >= minX &&
                screenX <= maxX &&
                screenY >= minY &&
                screenY <= maxY
              ) {
                for (const pid in anyModel.properties) {
                  const numPid = Number(pid);
                  if (!hiddenSet || !hiddenSet.has(numPid)) {
                    hits.add(numPid);
                  }
                  if (hits.size > 30) break;
                }
              }
            }
          }
        });
      }

      if (hits.size > 0) {
        boxHitsMap[modelId] = hits;
      }
    }

    let finalMap: Record<string, Set<number>>;
    if (isSubtractive) {
      finalMap = cloneSelectionMap(this.selectedElements);
      for (const m in boxHitsMap) {
        const currentSet = finalMap[m];
        if (!currentSet) continue;
        for (const id of boxHitsMap[m]) {
          currentSet.delete(id);
        }
        if (currentSet.size === 0) delete finalMap[m];
      }
    } else if (isAdditive) {
      finalMap = cloneSelectionMap(this.selectedElements);
      for (const m in boxHitsMap) {
        if (!finalMap[m]) finalMap[m] = new Set<number>();
        for (const id of boxHitsMap[m]) {
          finalMap[m].add(id);
        }
      }
    } else {
      finalMap = boxHitsMap;
    }

    const totalCount = countSelectionMap(finalMap);
    const hitCount = countSelectionMap(boxHitsMap);

    if (isSubtractive) {
      this.commitSelectionState(finalMap);
      await this.applyHighlightMap(this.selectedElements, false);
      showToast(
        hitCount > 0
          ? `Removed ${hitCount} Elements from Selection`
          : "No Elements in Subtraction Box"
      );
      return;
    }

    if (totalCount > 0) {
      this.commitSelectionState(finalMap);
      await this.applyHighlightMap(this.selectedElements, false);
      showToast(
        `Box Selected ${totalCount} Elements`,
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/></svg>`
      );
    } else if (!isAdditive) {
      await this.clearSelection();
      showToast(
        "No Elements in Box",
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`
      );
    }
  }

  /**
   * Selects all elements belonging to a specific IFC category using FragmentIndexer first.
   */
  public async selectSameCategory(categoryName?: string) {
    if (!this.engine.fragments || this.engine.fragments.list.size === 0) return;

    let targetCategory = categoryName;
    if (!targetCategory) {
      const activeInfo = this.getSelectionInfo();
      targetCategory = activeInfo.primaryCategory;
    }

    if (!targetCategory) {
      showToast(
        "Select an element first to match category",
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
      );
      return;
    }

    const matchedMap: Record<string, Set<number>> = {};
    let totalFound = 0;
    const catUpper = targetCategory.toUpperCase();
    const hiddenMap = await this.getHiddenIdsByModel();

    for (const [modelId, model] of FragmentIndexer.getInstance().getSafeModelsMap(
      this.engine.fragments
    )) {
      const hiddenSet = hiddenMap[modelId];
      const candidates = this.getIndexedElementsForModel(modelId, model);
      const hits = new Set<number>();

      for (const el of candidates) {
        if (hiddenSet && hiddenSet.has(el.expressId)) continue;
        if (
          el.category.includes(catUpper) ||
          el.name.toUpperCase().includes(catUpper)
        ) {
          hits.add(el.expressId);
          totalFound++;
        }
      }

      if (hits.size > 0) {
        matchedMap[modelId] = hits;
      }
    }

    if (totalFound > 0) {
      this.commitSelectionState(matchedMap);
      await this.applyHighlightMap(this.selectedElements, false);
      showToast(
        `Selected all ${totalFound} ${targetCategory} elements`,
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>`
      );
    } else {
      showToast(
        `No visible ${targetCategory} elements found`,
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`
      );
    }
  }

  /**
   * Filter active selection down to a single category using FragmentIndexer first.
   */
  public async filterSelectionToCategory(categoryName: string) {
    const currentInfo = this.getSelectionInfo();
    const catUpper = categoryName.toUpperCase();
    const filteredMap: Record<string, Set<number>> = {};
    let count = 0;

    for (const mid in currentInfo.modelIdMap) {
      const model = this.engine.fragments?.list?.get?.(mid) as any;
      const indexed = FragmentIndexer.getInstance().getCachedModel(mid);
      const set = new Set<number>();

      for (const id of currentInfo.modelIdMap[mid]) {
        const indexedEl = indexed?.byExpressId.get(id);
        const p = model?.properties?.[id];
        const typeStr = String(
          indexedEl?.category || p?.type || p?._category || p?.typeStr || ""
        ).toUpperCase();
        if (typeStr.includes(catUpper)) {
          set.add(id);
          count++;
        }
      }
      if (set.size > 0) {
        filteredMap[mid] = set;
      }
    }

    this.commitSelectionState(filteredMap);
    if ((this.engine.fragments as any)?.core) {
      await this.applyHighlightMap(this.selectedElements, false);
    }
    showToast(
      `Filtered to ${count} ${categoryName} elements`,
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>`
    );
  }

  /**
   * Isolates all elements matching a category across loaded models using OBC.Hider & OBF.Highlighter.
   */
  public async isolateCategory(categoryName: string): Promise<Record<string, Set<number>>> {
    const matchedMap: Record<string, Set<number>> = {};
    const catUpper = categoryName.toUpperCase();

    try {
      for (const [modelId, model] of FragmentIndexer.getInstance().getSafeModelsMap(
        this.engine.fragments
      )) {
        const candidates = this.getIndexedElementsForModel(modelId, model);
        const hits = new Set<number>();
        for (const el of candidates) {
          if (el.category.includes(catUpper)) {
            hits.add(el.expressId);
          }
        }
        if (hits.size > 0) {
          matchedMap[modelId] = hits;
        }
      }

      if (Object.keys(matchedMap).length > 0) {
        this.commitSelectionState(matchedMap);
        await this.engine.hider?.isolate?.(matchedMap)?.catch?.(() => {});
        if ((this.engine.fragments as any)?.core) {
          await this.applyHighlightMap(this.selectedElements, false);
        }
      }
    } catch {}

    return matchedMap;
  }

  /**
   * Isolates elements belonging to a named building storey using FragmentIndexer + OBC.Hider.
   */
  public async isolateStorey(storeyName: string): Promise<Record<string, Set<number>>> {
    const matchedMap: Record<string, Set<number>> = {};
    const targetUpper = storeyName.toUpperCase();

    try {
      for (const [modelId, model] of FragmentIndexer.getInstance().getSafeModelsMap(
        this.engine.fragments
      )) {
        const candidates = this.getIndexedElementsForModel(modelId, model);
        const hits = new Set<number>();
        for (const el of candidates) {
          const storeyStr = String(el.storey || el.name || "").toUpperCase();
          if (storeyStr.includes(targetUpper)) {
            hits.add(el.expressId);
          }
        }
        if (hits.size > 0) {
          matchedMap[modelId] = hits;
        }
      }

      if (Object.keys(matchedMap).length > 0) {
        this.commitSelectionState(matchedMap);
        await this.engine.hider?.isolate?.(matchedMap)?.catch?.(() => {});
        if ((this.engine.fragments as any)?.core) {
          await this.applyHighlightMap(this.selectedElements, false);
        }
      }
    } catch {}

    return matchedMap;
  }

  /**
   * Isolates the active selection via OBC.Hider while keeping selection & HUD synced.
   */
  public async isolateCurrentSelection(): Promise<boolean> {
    const info = this.getSelectionInfo();
    if (info.totalCount === 0) {
      showToast("Select elements first to isolate");
      return false;
    }
    try {
      await this.engine.hider?.isolate?.(info.modelIdMap);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Hides the active selection via OBC.Hider and clears selection (recording undo history).
   */
  public async hideCurrentSelection(): Promise<number> {
    const info = this.getSelectionInfo();
    if (info.totalCount === 0) return 0;
    try {
      await this.engine.hider?.set?.(false, info.modelIdMap);
    } catch {}
    await this.clearSelection(true);
    return info.totalCount;
  }

  /**
   * Restores visibility of all elements via OBC.Hider.
   */
  public async unhideAll(): Promise<void> {
    try {
      await this.engine.hider?.set?.(true);
    } catch {}
  }

  /**
   * Apply custom color highlight to active selection
   */
  public async applyCustomColorToSelection(styleId: string) {
    const highlighter = this.engine.highlighter;
    if (!highlighter) return;

    const info = this.getSelectionInfo();
    if (info.totalCount === 0) {
      showToast(
        "Select elements first to apply color",
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`
      );
      return;
    }

    try {
      await highlighter.highlightByID(styleId, info.modelIdMap, false);
      showToast(
        `Applied ${styleId} Color Highlight`,
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
      );
    } catch (e) {
      console.warn("Custom color highlight error:", e);
    }
  }

  /**
   * Saves the active selection as a named selection set
   */
  public saveCurrentSelectionSet(name?: string): SavedSelectionSet | null {
    const info = this.getSelectionInfo();
    if (info.totalCount === 0) {
      showToast(
        "No active selection to save",
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`
      );
      return null;
    }

    const fallbackName = `${info.primaryCategory || "Set"} (${info.totalCount} items)`;
    const promptFn =
      typeof window !== "undefined" && typeof window.prompt === "function"
        ? window.prompt.bind(window)
        : null;
    const setName =
      name ||
      (promptFn ? promptFn("Enter a name for this Selection Set:", fallbackName) : fallbackName);
    if (!setName || !setName.trim()) return null;

    const serializedMap: Record<string, number[]> = {};
    for (const mid in info.modelIdMap) {
      if (info.modelIdMap[mid].size > 0) {
        serializedMap[mid] = Array.from(info.modelIdMap[mid]);
      }
    }

    const newSet: SavedSelectionSet = {
      id: `set_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name: setName.trim(),
      count: info.totalCount,
      createdAt: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      modelIdMap: serializedMap,
    };

    this.savedSets.push(newSet);
    this.persistSavedSets();
    showToast(
      `Saved Selection Set: "${newSet.name}"`,
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`
    );
    return newSet;
  }

  public getSavedSets(): SavedSelectionSet[] {
    return this.savedSets;
  }

  public deleteSavedSet(setId: string): boolean {
    const idx = this.savedSets.findIndex((s) => s.id === setId);
    if (idx < 0) return false;
    this.savedSets.splice(idx, 1);
    this.persistSavedSets();
    return true;
  }

  public async restoreSelectionSet(setId: string) {
    const set = this.savedSets.find((s) => s.id === setId);
    if (!set) return;

    this.commitSelectionState(set.modelIdMap);
    await this.applyHighlightMap(this.selectedElements, false);
    showToast(
      `Restored Selection Set: "${set.name}" (${set.count} items)`,
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`
    );
  }

  /**
   * Selects all visible elements in all loaded BIM models using FragmentIndexer first.
   */
  public async selectAll() {
    if (!this.engine.fragments || this.engine.fragments.list.size === 0) {
      showToast(
        "No models loaded to select",
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`
      );
      return;
    }

    const hiddenMap = await this.getHiddenIdsByModel();
    const allMap: Record<string, Set<number>> = {};
    let totalCount = 0;

    for (const [modelId, model] of FragmentIndexer.getInstance().getSafeModelsMap(
      this.engine.fragments
    )) {
      const hiddenSet = hiddenMap[modelId];
      const candidates = this.getIndexedElementsForModel(modelId, model);
      const hits = new Set<number>();

      for (const el of candidates) {
        if (hiddenSet && hiddenSet.has(el.expressId)) continue;
        hits.add(el.expressId);
        totalCount++;
      }

      if (hits.size > 0) {
        allMap[modelId] = hits;
      }
    }

    this.commitSelectionState(allMap);
    await this.applyHighlightMap(this.selectedElements, false);
    showToast(
      `Selected All (${totalCount} visible elements)`,
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>`
    );
  }

  /**
   * Inverts active selection across visible elements in loaded models.
   */
  public async invertSelection() {
    if (!this.engine.fragments || this.engine.fragments.list.size === 0) return;

    const hiddenMap = await this.getHiddenIdsByModel();
    const currentMap = this.selectedElements;
    const invertedMap: Record<string, Set<number>> = {};
    let totalInverted = 0;

    for (const [modelId, model] of FragmentIndexer.getInstance().getSafeModelsMap(
      this.engine.fragments
    )) {
      const currentSelected = currentMap[modelId] || new Set<number>();
      const hiddenSet = hiddenMap[modelId];
      const candidates = this.getIndexedElementsForModel(modelId, model);
      const hits = new Set<number>();

      for (const el of candidates) {
        if (hiddenSet && hiddenSet.has(el.expressId)) continue;
        if (!currentSelected.has(el.expressId)) {
          hits.add(el.expressId);
          totalInverted++;
        }
      }

      if (hits.size > 0) {
        invertedMap[modelId] = hits;
      }
    }

    this.commitSelectionState(invertedMap);
    await this.applyHighlightMap(this.selectedElements, false);
    showToast(
      `Inverted Selection (${totalInverted} elements)`,
      `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>`
    );
  }

  /**
   * Clears all active selections.
   */
  public async clearSelection(recordHistory: boolean = true) {
    if (recordHistory && countSelectionMap(this.selectedElements) > 0) {
      this.pushUndoSnapshot(this.selectedElements);
    }
    this.selectedElements = {};
    try {
      if (this.engine.highlighter?.clear && (this.engine.fragments as any)?.core) {
        await this.engine.highlighter.clear("select").catch(() => {});
      }
    } catch {}

    if (typeof document !== "undefined") {
      const bar = document.getElementById("viewport-selection-bar");
      if (bar) bar.style.display = "none";
      if (document.body) {
        document.body.classList.remove("has-viewport-selection");
      }
      const batchCard = document.getElementById("multi-selection-batch-card");
      if (batchCard) batchCard.style.display = "none";
      const undoBtn = document.getElementById("btn-selection-hud-undo") as
        | HTMLButtonElement
        | null;
      if (undoBtn) undoBtn.disabled = !this.canUndo();
    }

    this.notifyListeners();
  }

  public getSelectionInfo(): SelectionInfo {
    let totalCount = 0;
    let primaryModelId: string | undefined;
    let primaryExpressId: number | undefined;
    let primaryCategory: string | undefined;
    let primaryName: string | undefined;
    const catMap: Record<
      string,
      { count: number; expressIds: number[]; modelId: string }
    > = {};

    let fragmentsList: Map<string, any> | null = null;
    try {
      if (this.engine.fragments && (this.engine.fragments as any).list) {
        fragmentsList = this.engine.fragments.list;
      }
    } catch {
      fragmentsList = null;
    }

    for (const mid in this.selectedElements) {
      const model = fragmentsList?.get ? fragmentsList.get(mid) : null;
      totalCount += this.selectedElements[mid].size;

      for (const id of this.selectedElements[mid]) {
        if (!primaryModelId) {
          primaryModelId = mid;
          primaryExpressId = id;
        }

        let cat = "IFC ELEMENT";
        const indexedEl = FragmentIndexer.getInstance().getCachedElement(mid, id);
        if (indexedEl) {
          cat = indexedEl.category || "IFC ELEMENT";
          if (!primaryName) {
            primaryName = indexedEl.name || `Element #${id}`;
            primaryCategory = cat;
          }
        } else if (model && model.properties && model.properties[id]) {
          const p = model.properties[id];
          cat = p.type || p._category || p.typeStr || "IFC ELEMENT";
          if (!primaryName) {
            primaryName = p.Name?.value || p.name || `Element #${id}`;
            primaryCategory = cat;
          }
        }

        if (!catMap[cat]) {
          catMap[cat] = { count: 0, expressIds: [], modelId: mid };
        }
        catMap[cat].count++;
        catMap[cat].expressIds.push(id);
      }
    }

    const categories: SelectionCategoryCount[] = Object.entries(catMap).map(
      ([category, data]) => ({
        category,
        count: data.count,
        expressIds: data.expressIds,
        modelId: data.modelId,
      })
    );

    return {
      totalCount,
      modelIdMap: this.selectedElements,
      primaryModelId,
      primaryExpressId,
      primaryCategory,
      primaryName,
      categories,
    };
  }

  /**
   * Computes aggregated physical quantities, category/storey breakdown, and real CostRateManager totals
   * for any active selection map.
   */
  public getBatchSummary(
    selectionMap?: Record<string, Set<number>>
  ): SelectionBatchSummary {
    const map = selectionMap || this.selectedElements;
    const info = selectionMap
      ? (() => {
          const prev = this.selectedElements;
          this.selectedElements = map;
          const res = this.getSelectionInfo();
          this.selectedElements = prev;
          return res;
        })()
      : this.getSelectionInfo();

    let totalVolumeM3 = 0;
    let totalAreaM2 = 0;
    let estimatedCost = 0;
    let activeModels = 0;
    const storeyCounts = new Map<string, number>();

    let fragmentsList: Map<string, any> | null = null;
    try {
      if (this.engine.fragments && (this.engine.fragments as any).list) {
        fragmentsList = this.engine.fragments.list;
      }
    } catch {
      fragmentsList = null;
    }

    const indexer = FragmentIndexer.getInstance();
    const costMgr = CostRateManager.getInstance();
    const sizeVec = new THREE.Vector3();

    for (const mid in map) {
      const idSet = map[mid];
      if (!idSet || idSet.size === 0) continue;
      activeModels++;
      const model = fragmentsList?.get ? fragmentsList.get(mid) : null;

      for (const id of idSet) {
        const indexedEl = indexer.getCachedElement(mid, id);
        const prop = model?.properties?.[id];
        const cat = String(
          indexedEl?.category ||
            prop?.type ||
            prop?._category ||
            prop?.typeStr ||
            "IFCELEMENT"
        ).toUpperCase();

        const storey =
          indexedEl?.storey ||
          prop?.Storey ||
          prop?.storey ||
          prop?.Level ||
          undefined;
        if (storey) {
          const sKey = String(storey);
          storeyCounts.set(sKey, (storeyCounts.get(sKey) || 0) + 1);
        }

        const box = indexedEl?.box || (prop?.boundingBox instanceof THREE.Box3 ? prop.boundingBox : null);
        let bboxSize: { x: number; y: number; z: number } | undefined;
        if (box && typeof box.getSize === "function" && !box.isEmpty()) {
          box.getSize(sizeVec);
          if (sizeVec.x > 0 || sizeVec.y > 0 || sizeVec.z > 0) {
            bboxSize = {
              x: Math.max(0.01, sizeVec.x),
              y: Math.max(0.01, sizeVec.y),
              z: Math.max(0.01, sizeVec.z),
            };
          }
        }

        let elemVol = indexedEl?.volumeM3 || Number(prop?.NetVolume?.value ?? prop?.Volume?.value ?? 0) || 0;
        if (elemVol <= 0 && bboxSize) {
          elemVol = Math.max(0.05, bboxSize.x * bboxSize.y * bboxSize.z * 0.45);
        }
        const elemArea =
          indexedEl?.areaM2 ||
          Number(prop?.NetArea?.value ?? prop?.Area?.value ?? 0) ||
          (bboxSize
            ? (() => {
                const dims = [bboxSize.x, bboxSize.y, bboxSize.z].sort((a, b) => b - a);
                return dims[0] * dims[1];
              })()
            : 0);

        totalVolumeM3 += elemVol;
        totalAreaM2 += elemArea;

        const rate = costMgr.getRate(cat);
        const qRes = costMgr.resolveQuantityForElement(
          cat,
          { volume: elemVol || undefined, area: elemArea || undefined },
          bboxSize
        );
        estimatedCost += rate.unitRate * qRes.quantity;
      }
    }

    const storeys = Array.from(storeyCounts.entries())
      .map(([storey, count]) => ({ storey, count }))
      .sort((a, b) => b.count - a.count);

    const sharedAttributes: Array<{ label: string; value: string }> = [
      {
        label: "IFC Category",
        value:
          info.categories.length === 1
            ? info.categories[0].category
            : `Mixed (${info.categories.length} types)`,
      },
      {
        label: "Building Storey",
        value:
          storeys.length === 1
            ? storeys[0].storey
            : storeys.length > 1
              ? `Mixed (${storeys.length} storeys)`
              : "Unassigned",
      },
      {
        label: "Active Models",
        value: String(activeModels || 1),
      },
    ];

    const leadElement =
      info.primaryModelId && info.primaryExpressId !== undefined
        ? {
            modelId: info.primaryModelId,
            expressId: info.primaryExpressId,
            category: info.primaryCategory || "IFCELEMENT",
            name: info.primaryName || `Element #${info.primaryExpressId}`,
            storey: storeys.length === 1 ? storeys[0].storey : undefined,
          }
        : undefined;

    return {
      totalCount: info.totalCount,
      modelCount: activeModels,
      categories: info.categories.sort((a, b) => b.count - a.count),
      storeys,
      totalVolumeM3,
      totalAreaM2,
      estimatedCost,
      formattedCost: costMgr.formatPrice(estimatedCost),
      sharedAttributes,
      leadElement,
    };
  }

  /**
   * Updates floating HUD and injects category breakdown chips + Undo button state.
   */
  public updateSelectionHUD() {
    if (typeof document === "undefined") return;
    const bar = document.getElementById("viewport-selection-bar");
    const titleEl = document.getElementById("selection-bar-title");
    const undoBtn = document.getElementById("btn-selection-hud-undo") as
      | HTMLButtonElement
      | null;
    if (undoBtn) {
      undoBtn.disabled = !this.canUndo();
    }

    if (!bar || !titleEl) return;

    const info = this.getSelectionInfo();

    if (info.totalCount === 0) {
      bar.style.display = "none";
      if (document.body) {
        document.body.classList.remove("has-viewport-selection");
      }
      return;
    }

    bar.style.display = "flex";
    if (document.body) {
      document.body.classList.add("has-viewport-selection");
    }

    if (info.totalCount === 1 && info.primaryExpressId !== undefined) {
      titleEl.innerText = `${info.primaryCategory || "Element"} #${info.primaryExpressId}`;
    } else {
      titleEl.innerText = `${info.totalCount} Elements Selected`;
    }

    // Render category chips inside HUD
    let chipsContainer = document.getElementById("selection-category-chips");
    if (!chipsContainer) {
      chipsContainer = document.createElement("div");
      chipsContainer.id = "selection-category-chips";
      chipsContainer.className = "selection-category-chips";
      titleEl.after(chipsContainer);
    }

    chipsContainer.innerHTML = "";
    if (info.categories.length > 1) {
      info.categories.slice(0, 3).forEach((c) => {
        const chip = document.createElement("button");
        chip.className = "selection-cat-chip";
        chip.title = `Filter selection to only ${c.category} (${c.count})`;
        chip.innerHTML = `<span class="chip-name">${c.category.replace("IFC", "")}</span> <span class="chip-count">${c.count}</span>`;
        chip.onclick = (e) => {
          e.stopPropagation();
          this.filterSelectionToCategory(c.category);
        };
        chipsContainer!.appendChild(chip);
      });
    }

    // Update global batch card if present
    if (typeof (window as any).updateMultiSelectionBatchCard === "function") {
      (window as any).updateMultiSelectionBatchCard();
    }
  }
}
