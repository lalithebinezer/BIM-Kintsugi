// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { SelectionManager } from "../SelectionManager";
import { KeyboardController } from "../../core/KeyboardController";
import { FragmentIndexer } from "../../core/FragmentIndexer";

describe("SelectionManager & DOM Selection Suite", () => {
  let selectionManager: SelectionManager;

  beforeEach(() => {
    // Setup clean DOM environment
    document.body.innerHTML = `
      <div id="container" style="width: 1000px; height: 800px;"></div>
      <button id="btn-box-select"></button>
      <button id="btn-select-all"></button>
      <button id="btn-invert-select"></button>
      <button id="btn-clear-selection"></button>
      <button id="btn-batch-clear"></button>
      <div id="viewport-selection-bar" style="display: none;">
        <span id="selection-bar-title"></span>
      </div>
      <div id="multi-selection-batch-card" style="display: none;">
        <span id="batch-selected-count"></span>
        <span id="batch-total-volume"></span>
        <span id="batch-total-cost"></span>
      </div>
      <div id="bim-context-menu" style="display: none;"></div>
      <div id="command-palette-modal" style="display: none;"></div>
      <div id="shortcuts-modal" style="display: none;"></div>
      <div id="viewport-hover-badge" style="display: none;"></div>
    `;

    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }

    selectionManager = SelectionManager.getInstance();
  });

  it("should initialize and create the selection marquee DOM element", () => {
    const marquee = document.getElementById("selection-marquee-box");
    expect(marquee).not.toBeNull();
    expect(marquee?.className).toContain("selection-marquee-box");
  });

  it("should toggle box selection mode and update DOM button active state", () => {
    const btn = document.getElementById("btn-box-select") as HTMLElement;

    // Toggle on
    const active = selectionManager.toggleBoxSelectMode(true);
    expect(active).toBe(true);
    expect(btn.classList.contains("active")).toBe(true);

    // Toggle off
    const inactive = selectionManager.toggleBoxSelectMode(false);
    expect(inactive).toBe(false);
    expect(btn.classList.contains("active")).toBe(false);
  });

  it("should sync multi-selection map and update floating HUD title", () => {
    const selectionMap = {
      model_1: new Set([101, 102, 103, 104]),
    };

    selectionManager.syncFromSelectionMap(selectionMap);

    const info = selectionManager.getSelectionInfo();
    expect(info.totalCount).toBe(4);

    const bar = document.getElementById("viewport-selection-bar");
    const title = document.getElementById("selection-bar-title");
    expect(bar?.style.display).toBe("flex");
    expect(title?.innerText).toBe("4 Elements Selected");
  });

  it("should save and restore named selection sets from localStorage", () => {
    const selectionMap = {
      model_main: new Set([201, 202, 203]),
    };
    selectionManager.syncFromSelectionMap(selectionMap);

    const saved = selectionManager.saveCurrentSelectionSet("Facade Columns");
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe("Facade Columns");
    expect(saved?.count).toBe(3);

    const sets = selectionManager.getSavedSets();
    expect(sets.length).toBeGreaterThanOrEqual(1);

    // Clear and restore
    selectionManager.clearSelection();
    expect(selectionManager.getSelectionInfo().totalCount).toBe(0);

    selectionManager.restoreSelectionSet(saved!.id);
    expect(selectionManager.getSelectionInfo().totalCount).toBe(3);
  });

  it("should clear selection and hide viewport HUD when clearSelection is called", async () => {
    selectionManager.syncFromSelectionMap({
      model_1: new Set([501, 502]),
    });
    expect(selectionManager.getSelectionInfo().totalCount).toBe(2);

    await selectionManager.clearSelection();
    expect(selectionManager.getSelectionInfo().totalCount).toBe(0);

    const bar = document.getElementById("viewport-selection-bar");
    expect(bar?.style.display).toBe("none");
  });

  it("should handle Escape key to dismiss modals and clear selection state", () => {
    KeyboardController.getInstance().init();

    const clearFn = vi.fn();
    (window as any).clearAllSelections = clearFn;

    const ctxMenu = document.getElementById("bim-context-menu") as HTMLElement;
    ctxMenu.style.display = "flex";

    const cmdModal = document.getElementById("command-palette-modal") as HTMLElement;
    cmdModal.style.display = "flex";

    // Simulate Escape key press
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

    expect(clearFn).toHaveBeenCalled();
    expect(ctxMenu.style.display).toBe("none");
    expect(cmdModal.style.display).toBe("none");
  });

  it("supports selection undo/redo, box-select crosshair cursor, and Esc drag cancel", async () => {
    KeyboardController.getInstance().init();
    const container = document.getElementById("container")!;

    // Reset stacks for deterministic test
    await selectionManager.clearSelection(false);
    (selectionManager as any).undoStack = [];
    (selectionManager as any).redoStack = [];

    selectionManager.toggleBoxSelectMode(true);
    expect(container.classList.contains("box-select-cursor")).toBe(true);
    selectionManager.toggleBoxSelectMode(false);
    expect(container.classList.contains("box-select-cursor")).toBe(false);

    selectionManager.syncFromSelectionMap({ model_1: new Set([10]) });
    selectionManager.syncFromSelectionMap({ model_1: new Set([10, 20, 30]) });
    expect(selectionManager.getSelectionInfo().totalCount).toBe(3);

    // Undo restores previous 1-item selection
    await selectionManager.undoSelection();
    expect(selectionManager.getSelectionInfo().totalCount).toBe(1);
    expect(selectionManager.getSelectionInfo().primaryExpressId).toBe(10);

    // Redo restores 3-item selection
    await selectionManager.redoSelection();
    expect(selectionManager.getSelectionInfo().totalCount).toBe(3);

    // Active marquee drag cancel on Esc preserves existing selection
    const clearFn = vi.fn();
    (window as any).clearAllSelections = clearFn;
    (window as any).__cancelBoxSelectDrag = () => selectionManager.cancelActiveBoxDrag();
    (selectionManager as any).isDraggingBox = true;

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(clearFn).not.toHaveBeenCalled();
    expect(selectionManager.getSelectionInfo().totalCount).toBe(3);
  });

  it("queries FragmentIndexer directly (skipping hidden items) and computes real batch quantities", async () => {
    FragmentIndexer.getInstance().clearAll();
    const mockModel = {
      modelId: "frags_sel_1",
      getCategories: async () => ["IFCWALL", "IFCCOLUMN"],
      getItemsOfCategories: async () => ({
        IFCWALL: [101, 102],
        IFCCOLUMN: [201],
      }),
      getBoxes: async () => [
        new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(4, 3, 0.2)),
        new THREE.Box3(new THREE.Vector3(5, 0, 0), new THREE.Vector3(9, 3, 0.2)),
        new THREE.Box3(new THREE.Vector3(2, 0, 2), new THREE.Vector3(2.5, 3, 2.5)),
      ],
      getItemsData: async () => [
        { Name: { value: "Wall A" } },
        { Name: { value: "Wall B (Hidden)" } },
        { Name: { value: "Column C" } },
      ],
    };

    await FragmentIndexer.getInstance().indexModel("frags_sel_1", mockModel, {
      includeBoxes: true,
      storeysMap: { "frags_sel_1-101": "Level 1", "frags_sel_1-201": "Level 1" },
    });

    const engine = (selectionManager as any).engine;
    const origFrags = engine.fragments;
    const origHider = engine.hider;
    const origHighlighter = engine.highlighter;

    engine.fragments = {
      initialized: true,
      list: new Map([["frags_sel_1", mockModel]]),
    };
    engine.hider = {
      getVisibilityMap: async () => ({ frags_sel_1: [102] }),
    };
    engine.highlighter = {
      selection: { select: {} },
      highlightByID: vi.fn(async () => {}),
      clear: vi.fn(async () => {}),
    };

    try {
      await selectionManager.selectAll();
      // Wall B (102) is hidden so only 101 and 201 should be selected
      const allInfo = selectionManager.getSelectionInfo();
      expect(allInfo.totalCount).toBe(2);
      expect(allInfo.modelIdMap.frags_sel_1.has(102)).toBe(false);

      const batch = selectionManager.getBatchSummary();
      expect(batch.totalCount).toBe(2);
      expect(batch.totalVolumeM3).toBeGreaterThan(1.0);
      expect(batch.estimatedCost).toBeGreaterThan(0);
      expect(batch.storeys[0]).toEqual({ storey: "Level 1", count: 2 });

      // Match same category from active selection (Wall A -> only Wall A visible, 102 hidden)
      selectionManager.syncFromSelectionMap({ frags_sel_1: new Set([101]) });
      await selectionManager.selectSameCategory("IFCWALL");
      expect(selectionManager.getSelectionInfo().totalCount).toBe(1);
      expect(selectionManager.getSelectionInfo().modelIdMap.frags_sel_1.has(101)).toBe(true);

      // Delete saved set emits cleanly
      const saved = selectionManager.saveCurrentSelectionSet("Visible Wall");
      expect(saved).not.toBeNull();
      expect(selectionManager.deleteSavedSet(saved!.id)).toBe(true);
    } finally {
      engine.fragments = origFrags;
      engine.hider = origHider;
      engine.highlighter = origHighlighter;
      FragmentIndexer.getInstance().clearAll();
      await selectionManager.clearSelection(false);
    }
  });
});
