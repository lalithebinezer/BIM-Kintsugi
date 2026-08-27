// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SelectionManager } from "../SelectionManager";
import { KeyboardController } from "../../core/KeyboardController";

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
});
