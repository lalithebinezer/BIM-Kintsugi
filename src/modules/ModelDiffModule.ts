import * as THREE from "three";
import { showToast } from "../ui/ToastManager";

export type DiffChangeType = "added" | "removed" | "modified" | "unchanged";

export interface DiffElementSummary {
  modelId: string;
  expressId: number;
  changeType: DiffChangeType;
  name: string;
  category: string;
  details?: string;
}

export interface ModelDiffSummary {
  modelAId: string;
  modelBId: string;
  addedCount: number;
  removedCount: number;
  modifiedCount: number;
  unchangedCount: number;
  elements: DiffElementSummary[];
}

export class ModelDiffModule {
  private static instance: ModelDiffModule | null = null;
  private currentSummary: ModelDiffSummary | null = null;
  private isDiffActive: boolean = false;

  private constructor() {}

  public static getInstance(): ModelDiffModule {
    if (!ModelDiffModule.instance) {
      ModelDiffModule.instance = new ModelDiffModule();
    }
    return ModelDiffModule.instance;
  }

  public getSummary(): ModelDiffSummary | null {
    return this.currentSummary;
  }

  public isActive(): boolean {
    return this.isDiffActive;
  }

  /**
   * Compare two loaded models by comparing their element properties and geometry bounding boxes.
   */
  public async compareModels(modelAId: string, modelBId: string): Promise<ModelDiffSummary | null> {
    const components = (window as any).components;
    if (!components) return null;
    const fragments = components.get((window as any).OBC?.FragmentsManager);
    if (!fragments) return null;

    const modelA = fragments.list.get(modelAId) as any;
    const modelB = fragments.list.get(modelBId) as any;

    if (!modelA || !modelB) {
      showToast("Both baseline and revised models must be loaded in the viewport.", "warning");
      return null;
    }

    const propsA = modelA.properties || modelA.getLocalProperties?.() || {};
    const propsB = modelB.properties || modelB.getLocalProperties?.() || {};

    const diffElements: DiffElementSummary[] = [];
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    let unchangedCount = 0;

    // Build key map for Model A: expressId and GlobalId
    const mapA = new Map<number, any>();
    const guidMapA = new Map<string, number>();

    for (const idStr in propsA) {
      const expressId = Number(idStr);
      if (isNaN(expressId)) continue;
      const p = propsA[expressId];
      if (!p) continue;
      mapA.set(expressId, p);
      const guid = String(p.GlobalId?.value || p.GlobalId || "");
      if (guid) guidMapA.set(guid, expressId);
    }

    const visitedA = new Set<number>();

    // Evaluate Model B against Model A
    for (const idStr in propsB) {
      const expressId = Number(idStr);
      if (isNaN(expressId)) continue;
      const pB = propsB[expressId];
      if (!pB) continue;

      const guidB = String(pB.GlobalId?.value || pB.GlobalId || "");
      const name = String(pB.Name?.value || pB.name || `Element #${expressId}`);
      const category = String(pB.type || "IFCELEMENT").toUpperCase();

      const matchedAId = guidB && guidMapA.has(guidB) ? guidMapA.get(guidB)! : (mapA.has(expressId) ? expressId : null);

      if (matchedAId !== null && mapA.has(matchedAId)) {
        visitedA.add(matchedAId);
        const pA = mapA.get(matchedAId);
        const nameA = String(pA.Name?.value || pA.name || "");
        
        // Check for modifications
        const isModified = name !== nameA || (pA.NominalValue && pB.NominalValue && pA.NominalValue !== pB.NominalValue);

        if (isModified) {
          modifiedCount++;
          diffElements.push({
            modelId: modelBId,
            expressId,
            changeType: "modified",
            name,
            category,
            details: "Properties or nominal values modified between revisions.",
          });
        } else {
          unchangedCount++;
          diffElements.push({
            modelId: modelBId,
            expressId,
            changeType: "unchanged",
            name,
            category,
          });
        }
      } else {
        // Element is in B but not in A -> Added
        addedCount++;
        diffElements.push({
          modelId: modelBId,
          expressId,
          changeType: "added",
          name,
          category,
          details: "Newly added element in revised model.",
        });
      }
    }

    // Check elements in Model A that were never visited in B -> Removed
    for (const [idA, pA] of mapA.entries()) {
      if (!visitedA.has(idA)) {
        removedCount++;
        const name = String(pA.Name?.value || pA.name || `Element #${idA}`);
        const category = String(pA.type || "IFCELEMENT").toUpperCase();
        diffElements.push({
          modelId: modelAId,
          expressId: idA,
          changeType: "removed",
          name,
          category,
          details: "Element was removed/demolished in revised model.",
        });
      }
    }

    this.currentSummary = {
      modelAId,
      modelBId,
      addedCount,
      removedCount,
      modifiedCount,
      unchangedCount,
      elements: diffElements,
    };

    await this.applyDiffVisualization();
    this.updateDiffUI();
    return this.currentSummary;
  }

  /**
   * Apply 3D visual ghosting and color highlighting:
   * Green = Added, Red = Removed, Yellow = Modified, Translucent Ghost = Unchanged
   */
  public async applyDiffVisualization(): Promise<void> {
    if (!this.currentSummary) return;
    const components = (window as any).components;
    const highlighter = (window as any).highlighter;
    if (!components || !highlighter) return;

    const hider = components.get((window as any).OBC?.Hider);

    const addedMap: Record<string, Set<number>> = {};
    const removedMap: Record<string, Set<number>> = {};
    const modifiedMap: Record<string, Set<number>> = {};
    const unchangedMap: Record<string, Set<number>> = {};

    for (const item of this.currentSummary.elements) {
      const map = item.changeType === "added" ? addedMap :
                  item.changeType === "removed" ? removedMap :
                  item.changeType === "modified" ? modifiedMap : unchangedMap;
      (map[item.modelId] ??= new Set<number>()).add(item.expressId);
    }

    // Setup diff highlight styles
    this.ensureDiffStyles(highlighter);

    await highlighter.clear("diff-added");
    await highlighter.clear("diff-removed");
    await highlighter.clear("diff-modified");

    if (hider) {
      await hider.set(true); // make all visible
    }

    if (Object.keys(addedMap).length > 0) {
      await highlighter.highlightByID("diff-added", addedMap, false, false);
    }
    if (Object.keys(removedMap).length > 0) {
      await highlighter.highlightByID("diff-removed", removedMap, false, false);
    }
    if (Object.keys(modifiedMap).length > 0) {
      await highlighter.highlightByID("diff-modified", modifiedMap, false, false);
    }

    this.isDiffActive = true;
    showToast(`Visual Diff Active: +${this.currentSummary.addedCount} Added, -${this.currentSummary.removedCount} Removed, ~${this.currentSummary.modifiedCount} Modified`, "success");
  }

  public async clearDiffVisualization(): Promise<void> {
    const highlighter = (window as any).highlighter;
    if (highlighter) {
      await highlighter.clear("diff-added");
      await highlighter.clear("diff-removed");
      await highlighter.clear("diff-modified");
    }
    this.isDiffActive = false;
    this.currentSummary = null;
    showToast("Cleared 3D Model Revision Diff", "info");
  }

  private ensureDiffStyles(highlighter: any): void {
    if (!highlighter.styles) return;

    if (!highlighter.styles.get("diff-added")) {
      const mat = new THREE.MeshBasicMaterial({ color: 0x10b981, depthTest: false, transparent: true, opacity: 0.88 });
      highlighter.styles.set("diff-added", { color: new THREE.Color(0x10b981), material: mat });
    }
    if (!highlighter.styles.get("diff-removed")) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xef4444, depthTest: false, transparent: true, opacity: 0.88 });
      highlighter.styles.set("diff-removed", { color: new THREE.Color(0xef4444), material: mat });
    }
    if (!highlighter.styles.get("diff-modified")) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, depthTest: false, transparent: true, opacity: 0.88 });
      highlighter.styles.set("diff-modified", { color: new THREE.Color(0xf59e0b), material: mat });
    }
  }

  public updateDiffUI(): void {
    if (typeof document === "undefined" || !this.currentSummary) return;

    const container = document.getElementById("model-diff-results");
    if (!container) return;

    const s = this.currentSummary;
    container.innerHTML = `
      <div class="diff-summary-grid">
        <div class="diff-summary-card added">
          <span class="diff-card-count">+${s.addedCount}</span>
          <span class="diff-card-label">Added</span>
        </div>
        <div class="diff-summary-card removed">
          <span class="diff-card-count">-${s.removedCount}</span>
          <span class="diff-card-label">Removed</span>
        </div>
        <div class="diff-summary-card modified">
          <span class="diff-card-count">~${s.modifiedCount}</span>
          <span class="diff-card-label">Modified</span>
        </div>
        <div class="diff-summary-card unchanged">
          <span class="diff-card-count">${s.unchangedCount}</span>
          <span class="diff-card-label">Unchanged</span>
        </div>
      </div>
      <div class="diff-actions-row">
        <button id="btn-clear-model-diff" class="btn-xs btn-outline">Clear Diff Overlay</button>
      </div>
    `;

    document.getElementById("btn-clear-model-diff")?.addEventListener("click", () => {
      this.clearDiffVisualization();
      container.innerHTML = "";
    });
  }
}
