import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

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

export interface SavedSelectionSet {
  id: string;
  name: string;
  count: number;
  createdAt: string;
  modelIdMap: Record<string, number[]>;
}

export class SelectionManager {
  private static instance: SelectionManager | null = null;
  private engine: BimEngine;
  private boxSelectActive: boolean = false;
  private isDraggingBox: boolean = false;
  private startPoint: { x: number; y: number } = { x: 0, y: 0 };
  private marqueeEl: HTMLElement | null = null;
  private selectedElements: Record<string, Set<number>> = {};
  private savedSets: SavedSelectionSet[] = [];

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

  private loadSavedSets() {
    try {
      const stored = localStorage.getItem("bim_selection_sets");
      if (stored) {
        this.savedSets = JSON.parse(stored);
      }
    } catch (e) {
      this.savedSets = [];
    }
  }

  private persistSavedSets() {
    try {
      localStorage.setItem("bim_selection_sets", JSON.stringify(this.savedSets));
    } catch (e) {}
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

    container.addEventListener("pointerdown", (e: PointerEvent) => {
      // Trigger box selection if mode is enabled OR user holds Alt key
      if ((this.boxSelectActive || e.altKey) && e.button === 0) {
        this.isDraggingBox = true;
        this.startPoint = { x: e.clientX, y: e.clientY };

        if (this.marqueeEl) {
          this.marqueeEl.style.left = `${e.clientX}px`;
          this.marqueeEl.style.top = `${e.clientY}px`;
          this.marqueeEl.style.width = "0px";
          this.marqueeEl.style.height = "0px";
          this.marqueeEl.className = "selection-marquee-box marquee-window";
          this.marqueeEl.style.display = "block";
        }

        // Disable camera controls during marquee drag
        const controls = this.engine.world.camera?.controls as any;
        if (controls) controls.enabled = false;
      }
    });

    window.addEventListener("pointermove", (e: PointerEvent) => {
      if (!this.isDraggingBox || !this.marqueeEl) return;

      const currentX = e.clientX;
      const currentY = e.clientY;

      const isCrossing = currentX < this.startPoint.x; // Right-to-left = Crossing selection
      this.marqueeEl.className = isCrossing
        ? "selection-marquee-box marquee-crossing"
        : "selection-marquee-box marquee-window";

      const minX = Math.min(this.startPoint.x, currentX);
      const minY = Math.min(this.startPoint.y, currentY);
      const width = Math.abs(currentX - this.startPoint.x);
      const height = Math.abs(currentY - this.startPoint.y);

      this.marqueeEl.style.left = `${minX}px`;
      this.marqueeEl.style.top = `${minY}px`;
      this.marqueeEl.style.width = `${width}px`;
      this.marqueeEl.style.height = `${height}px`;
    });

    window.addEventListener("pointerup", async (e: PointerEvent) => {
      if (!this.isDraggingBox) return;
      this.isDraggingBox = false;

      // Re-enable camera controls
      const controls = this.engine.world.camera?.controls as any;
      if (controls) controls.enabled = true;

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

        await this.performBoxSelection(minX, minY, maxX, maxY, e.shiftKey, isCrossing);
      }
    });
  }

  public toggleBoxSelectMode(force?: boolean): boolean {
    this.boxSelectActive = force !== undefined ? force : !this.boxSelectActive;
    const btn = document.getElementById("btn-box-select");
    if (btn) {
      if (this.boxSelectActive) {
        btn.classList.add("active");
        btn.style.borderColor = "var(--accent-500)";
        showToast(
          "Box Selection Active (Drag window: Left➔Right | Crossing: Right➔Left)",
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

  /**
   * Syncs internal map from external single/multi click selection events.
   */
  public syncFromSelectionMap(selectionMap: Record<string, Set<number>> | Record<string, number[]>) {
    const newMap: Record<string, Set<number>> = {};
    for (const mid in selectionMap) {
      const val = selectionMap[mid];
      if (val instanceof Set) {
        newMap[mid] = new Set(val);
      } else if (Array.isArray(val)) {
        newMap[mid] = new Set(val);
      }
    }
    this.selectedElements = newMap;
    this.updateSelectionHUD();
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
    _isCrossing: boolean = true
  ) {
    const world = this.engine.world;
    const camera = world.camera?.three as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (!camera || !this.engine.fragments) return;

    const matchedMap: Record<string, Set<number>> = isAdditive ? { ...this.selectedElements } : {};
    const rect = this.engine.container.getBoundingClientRect();
    const tempVec = new THREE.Vector3();

    for (const [modelId, model] of this.engine.fragments.list) {
      const anyModel = model as any;
      if (!matchedMap[modelId]) matchedMap[modelId] = new Set();

      if (anyModel.items) {
        for (const expressIdStr in anyModel.items) {
          const expressId = Number(expressIdStr);
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
              matchedMap[modelId].add(expressId);
            }
          }
        }
      }

      // If no items map, search properties
      if (matchedMap[modelId].size === 0 && anyModel.properties) {
        if (anyModel.object) {
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
                    matchedMap[modelId].add(Number(pid));
                    if (matchedMap[modelId].size > 30) break;
                  }
                }
              }
            }
          });
        }
      }
    }

    let totalCount = 0;
    for (const m in matchedMap) {
      if (matchedMap[m].size === 0) delete matchedMap[m];
      else totalCount += matchedMap[m].size;
    }

    this.selectedElements = matchedMap;

    if (totalCount > 0) {
      await this.engine.highlighter.highlightByID("select", matchedMap, true, false);
      showToast(
        `Box Selected ${totalCount} Elements`,
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/></svg>`
      );
    } else if (!isAdditive) {
      await this.clearSelection();
      showToast("No Elements in Box", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`);
    }

    this.updateSelectionHUD();
  }

  /**
   * Selects all elements belonging to a specific IFC category
   */
  public async selectSameCategory(categoryName?: string) {
    if (!this.engine.fragments || this.engine.fragments.list.size === 0) return;

    let targetCategory = categoryName;
    if (!targetCategory) {
      const activeInfo = this.getSelectionInfo();
      targetCategory = activeInfo.primaryCategory;
    }

    if (!targetCategory) {
      showToast("Select an element first to match category", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`);
      return;
    }

    const matchedMap: Record<string, Set<number>> = {};
    let totalFound = 0;
    const catUpper = targetCategory.toUpperCase();

    for (const [modelId, model] of this.engine.fragments.list) {
      const anyModel = model as any;
      matchedMap[modelId] = new Set();

      if (anyModel.properties) {
        for (const idStr in anyModel.properties) {
          const id = Number(idStr);
          const props = anyModel.properties[id];
          const typeStr = (props?.type ?? props?._category ?? props?.typeStr ?? "").toUpperCase();
          if (typeStr.includes(catUpper) || (props?.Name?.value && props.Name.value.toUpperCase().includes(catUpper))) {
            matchedMap[modelId].add(id);
            totalFound++;
          }
        }
      }
    }

    if (totalFound > 0) {
      this.selectedElements = matchedMap;
      await this.engine.highlighter.highlightByID("select", matchedMap, true, false);
      showToast(
        `Selected all ${totalFound} ${targetCategory} elements`,
        `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>`
      );
      this.updateSelectionHUD();
    } else {
      showToast(`No other ${targetCategory} elements found`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`);
    }
  }

  /**
   * Filter active selection down to a single category
   */
  public async filterSelectionToCategory(categoryName: string) {
    const currentInfo = this.getSelectionInfo();
    const catUpper = categoryName.toUpperCase();
    const filteredMap: Record<string, Set<number>> = {};
    let count = 0;

    for (const mid in currentInfo.modelIdMap) {
      const model = this.engine.fragments.list.get(mid) as any;
      filteredMap[mid] = new Set();

      for (const id of currentInfo.modelIdMap[mid]) {
        const p = model?.properties?.[id];
        const typeStr = (p?.type || p?._category || p?.typeStr || "").toUpperCase();
        if (typeStr.includes(catUpper)) {
          filteredMap[mid].add(id);
          count++;
        }
      }
    }

    this.selectedElements = filteredMap;
    await this.engine.highlighter.highlightByID("select", filteredMap, true, false);
    showToast(`Filtered to ${count} ${categoryName} elements`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>`);
    this.updateSelectionHUD();
  }

  /**
   * Apply custom color highlight to active selection
   */
  public async applyCustomColorToSelection(styleId: string) {
    const highlighter = this.engine.highlighter;
    if (!highlighter) return;

    const info = this.getSelectionInfo();
    if (info.totalCount === 0) {
      showToast("Select elements first to apply color", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`);
      return;
    }

    try {
      await highlighter.highlightByID(styleId, info.modelIdMap, false);
      showToast(`Applied ${styleId} Color Highlight`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`);
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
      showToast("No active selection to save", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`);
      return null;
    }

    const setName = name || prompt("Enter a name for this Selection Set:", `${info.primaryCategory || "Set"} (${info.totalCount} items)`);
    if (!setName) return null;

    const serializedMap: Record<string, number[]> = {};
    for (const mid in info.modelIdMap) {
      serializedMap[mid] = Array.from(info.modelIdMap[mid]);
    }

    const newSet: SavedSelectionSet = {
      id: `set_${Date.now()}`,
      name: setName,
      count: info.totalCount,
      createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      modelIdMap: serializedMap,
    };

    this.savedSets.push(newSet);
    this.persistSavedSets();
    showToast(`Saved Selection Set: "${setName}"`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>`);
    return newSet;
  }

  public getSavedSets(): SavedSelectionSet[] {
    return this.savedSets;
  }

  public async restoreSelectionSet(setId: string) {
    const set = this.savedSets.find((s) => s.id === setId);
    if (!set) return;

    this.syncFromSelectionMap(set.modelIdMap);
    await this.engine.highlighter.highlightByID("select", this.selectedElements, true, false);
    showToast(`Restored Selection Set: "${set.name}" (${set.count} items)`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`);
  }

  /**
   * Selects all elements in all loaded BIM models.
   */
  public async selectAll() {
    if (!this.engine.fragments || this.engine.fragments.list.size === 0) {
      showToast("No models loaded to select", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`);
      return;
    }

    const allMap: Record<string, Set<number>> = {};
    let totalCount = 0;

    for (const [modelId, model] of this.engine.fragments.list) {
      const anyModel = model as any;
      allMap[modelId] = new Set();

      if (anyModel.properties) {
        for (const idStr in anyModel.properties) {
          allMap[modelId].add(Number(idStr));
          totalCount++;
        }
      }
    }

    this.selectedElements = allMap;
    await this.engine.highlighter.highlightByID("select", allMap, true, false);
    showToast(`Selected All (${totalCount} elements)`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>`);
    this.updateSelectionHUD();
  }

  /**
   * Inverts active selection.
   */
  public async invertSelection() {
    if (!this.engine.fragments || this.engine.fragments.list.size === 0) return;

    const currentMap = this.selectedElements;
    const invertedMap: Record<string, Set<number>> = {};
    let totalInverted = 0;

    for (const [modelId, model] of this.engine.fragments.list) {
      const anyModel = model as any;
      invertedMap[modelId] = new Set();
      const currentSelected = currentMap[modelId] || new Set();

      if (anyModel.properties) {
        for (const idStr in anyModel.properties) {
          const id = Number(idStr);
          if (!currentSelected.has(id)) {
            invertedMap[modelId].add(id);
            totalInverted++;
          }
        }
      }
    }

    this.selectedElements = invertedMap;
    await this.engine.highlighter.highlightByID("select", invertedMap, true, false);
    showToast(`Inverted Selection (${totalInverted} elements)`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>`);
    this.updateSelectionHUD();
  }

  /**
   * Clears all active selections.
   */
  public async clearSelection() {
    this.selectedElements = {};
    try {
      await this.engine.highlighter.clear("select");
    } catch (e) {
      console.warn("Highlighter clear:", e);
    }

    const bar = document.getElementById("viewport-selection-bar");
    if (bar) bar.style.display = "none";

    const batchCard = document.getElementById("multi-selection-batch-card");
    if (batchCard) batchCard.style.display = "none";
  }

  public getSelectionInfo(): SelectionInfo {
    let totalCount = 0;
    let primaryModelId: string | undefined;
    let primaryExpressId: number | undefined;
    let primaryCategory: string | undefined;
    let primaryName: string | undefined;
    const catMap: Record<string, { count: number; expressIds: number[]; modelId: string }> = {};

    for (const mid in this.selectedElements) {
      const model = this.engine.fragments.list.get(mid) as any;
      totalCount += this.selectedElements[mid].size;

      for (const id of this.selectedElements[mid]) {
        if (!primaryModelId) {
          primaryModelId = mid;
          primaryExpressId = id;
        }

        let cat = "IFC ELEMENT";
        if (model && model.properties && model.properties[id]) {
          const p = model.properties[id];
          cat = p.type || p._category || p.typeStr || "IFC ELEMENT";
          if (!primaryName) {
            primaryName = p.Name?.value || p.name || `Element #${id}`;
            primaryCategory = cat;
          }
        }

        if (!catMap[cat]) catMap[cat] = { count: 0, expressIds: [], modelId: mid };
        catMap[cat].count++;
        catMap[cat].expressIds.push(id);
      }
    }

    const categories: SelectionCategoryCount[] = Object.entries(catMap).map(([category, data]) => ({
      category,
      count: data.count,
      expressIds: data.expressIds,
      modelId: data.modelId,
    }));

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
   * Updates floating HUD and injects category breakdown chips and color coding swatch
   */
  public updateSelectionHUD() {
    const bar = document.getElementById("viewport-selection-bar");
    const titleEl = document.getElementById("selection-bar-title");
    if (!bar || !titleEl) return;

    const info = this.getSelectionInfo();

    if (info.totalCount === 0) {
      bar.style.display = "none";
      return;
    }

    bar.style.display = "flex";

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
      info.categories.slice(0, 4).forEach((c) => {
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

    // Update global callbacks if present
    if (typeof (window as any).updateMultiSelectionBatchCard === "function") {
      (window as any).updateMultiSelectionBatchCard();
    }
  }
}
