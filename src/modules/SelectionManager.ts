import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

function showToast(msg: string, icon?: string) {
  if (typeof (window as any).showToast === "function") {
    (window as any).showToast(msg, icon);
  }
}

export interface SelectionInfo {
  totalCount: number;
  modelIdMap: Record<string, Set<number>>;
  primaryModelId?: string;
  primaryExpressId?: number;
  primaryCategory?: string;
  primaryName?: string;
}

export class SelectionManager {
  private static instance: SelectionManager | null = null;
  private engine: BimEngine;
  private boxSelectActive: boolean = false;
  private isDraggingBox: boolean = false;
  private startPoint: { x: number; y: number } = { x: 0, y: 0 };
  private marqueeEl: HTMLElement | null = null;
  private selectedElements: Record<string, Set<number>> = {};

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.initMarqueeDOM();
    this.bindEvents();
  }

  public static getInstance(): SelectionManager {
    if (!SelectionManager.instance) {
      SelectionManager.instance = new SelectionManager();
    }
    return SelectionManager.instance;
  }

  private initMarqueeDOM() {
    if (typeof document === "undefined") return;
    this.marqueeEl = document.getElementById("selection-marquee-box");
    if (!this.marqueeEl) {
      this.marqueeEl = document.createElement("div");
      this.marqueeEl.id = "selection-marquee-box";
      this.marqueeEl.className = "selection-marquee-box";
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

      // Only perform box selection if user dragged more than 8 pixels
      if (width > 8 && height > 8) {
        const minX = Math.min(this.startPoint.x, e.clientX);
        const maxX = Math.max(this.startPoint.x, e.clientX);
        const minY = Math.min(this.startPoint.y, e.clientY);
        const maxY = Math.max(this.startPoint.y, e.clientY);

        await this.performBoxSelection(minX, minY, maxX, maxY, e.shiftKey);
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
        showToast("Box Marquee Select: Active (Drag on viewport)", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><polyline points="9 9 15 15"/><polyline points="15 9 9 15"/></svg>`);
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
   * Projects visible model element bounding spheres/boxes to 2D screen coordinates
   * and selects all elements intersecting the marquee rectangle.
   */
  public async performBoxSelection(
    minX: number,
    minY: number,
    maxX: number,
    maxY: number,
    isAdditive: boolean = false
  ) {
    const world = this.engine.world;
    const camera = world.camera?.three as THREE.PerspectiveCamera | THREE.OrthographicCamera;
    if (!camera || !this.engine.fragments) return;

    const matchedMap: Record<string, Set<number>> = isAdditive ? { ...this.selectedElements } : {};

    const rect = this.engine.container.getBoundingClientRect();
    const tempVec = new THREE.Vector3();

    // Iterate through all fragments in all loaded models
    for (const [modelId, model] of this.engine.fragments.list) {
      const anyModel = model as any;
      if (!matchedMap[modelId]) matchedMap[modelId] = new Set();

      // Check item bounding spheres or fragment meshes
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

      // Fallback: Check fragment mesh instances
      if (matchedMap[modelId].size === 0 && anyModel.object) {
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
                // If model has getItemIdMap or properties, collect valid expressIds
                if (anyModel.getItemIds) {
                  const ids = anyModel.getItemIds();
                  ids.slice(0, 50).forEach((id: number) => matchedMap[modelId].add(id));
                }
              }
            }
          }
        });
      }
    }

    // Apply selection
    let totalCount = 0;
    for (const m in matchedMap) {
      if (matchedMap[m].size === 0) delete matchedMap[m];
      else totalCount += matchedMap[m].size;
    }

    this.selectedElements = matchedMap;

    if (totalCount > 0) {
      await this.engine.highlighter.highlightByID("select", matchedMap, true, false);
      showToast(`Box Selected ${totalCount} Elements`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/></svg>`);
    } else if (!isAdditive) {
      await this.clearSelection();
      showToast("No Elements in Box Selection", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/></svg>`);
    }

    this.updateUI();
  }

  /**
   * Selects all elements belonging to the same IFC category as the currently selected element.
   */
  public async selectSameCategory(categoryName?: string) {
    if (!this.engine.fragments || this.engine.fragments.list.size === 0) return;

    let targetCategory = categoryName;

    // Detect category from active selection if not passed
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
      showToast(`Selected all ${totalFound} ${targetCategory} elements`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/></svg>`);
      this.updateUI();
    } else {
      showToast(`No other ${targetCategory} elements found`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/></svg>`);
    }
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
      } else if (anyModel.items) {
        for (const idStr in anyModel.items) {
          allMap[modelId].add(Number(idStr));
          totalCount++;
        }
      }
    }

    this.selectedElements = allMap;
    await this.engine.highlighter.highlightByID("select", allMap, true, false);
    showToast(`Selected All (${totalCount} elements)`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 12 15 16 10"/></svg>`);
    this.updateUI();
  }

  /**
   * Inverts the active selection.
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
    this.updateUI();
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

    for (const mid in this.selectedElements) {
      totalCount += this.selectedElements[mid].size;
      if (!primaryModelId && this.selectedElements[mid].size > 0) {
        primaryModelId = mid;
        primaryExpressId = Array.from(this.selectedElements[mid])[0];
      }
    }

    if (primaryModelId && primaryExpressId !== undefined) {
      const model = this.engine.fragments.list.get(primaryModelId) as any;
      if (model && model.properties && model.properties[primaryExpressId]) {
        const p = model.properties[primaryExpressId];
        primaryCategory = p.type || p._category || p.typeStr || "IFC ELEMENT";
        primaryName = p.Name?.value || p.name || `Element #${primaryExpressId}`;
      }
    }

    return {
      totalCount,
      modelIdMap: this.selectedElements,
      primaryModelId,
      primaryExpressId,
      primaryCategory,
      primaryName,
    };
  }

  private updateUI() {
    if (typeof (window as any).updateViewportSelectionBar === "function") {
      (window as any).updateViewportSelectionBar();
    }
  }
}
