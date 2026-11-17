// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MetadataPanelController } from "../../ui/MetadataPanelController";

describe("MetadataPanelController & Dedicated Metadata Tab UX", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="right-tab-bar">
        <button class="sidebar-tab-btn" data-tab="scene">SCENE</button>
        <button class="sidebar-tab-btn" data-tab="metadata">META</button>
        <button class="sidebar-tab-btn" data-tab="inspector">INSPECT</button>
      </div>
      <div id="tab-right-metadata">
        <button id="btn-metadata-clear-selection" style="display:none;"></button>
        <button id="btn-meta-open-inspect"></button>
        <div id="metadata-selected-state" style="display:none;">
          <span id="meta-hero-entity"></span>
          <span id="meta-hero-storey"></span>
          <div id="meta-hero-name"></div>
          <span id="meta-hero-id"></span>
          <span id="meta-hero-guid"></span>
          <button id="btn-copy-meta-guid"></button>
          <input id="metadata-search-input" />
          <button id="btn-clear-meta-search" class="hidden"></button>
          <span id="meta-filter-count"></span>
          <button id="btn-meta-toggle-all">Collapse All</button>
          <button id="btn-copy-metadata-json"></button>
          <div id="element-metadata-table"></div>
          <div id="meta-no-filter-matches" style="display:none;"></div>
        </div>
        <div id="metadata-empty-state" style="display:flex;"></div>
      </div>
      <div id="tab-right-inspector">
        <div id="inspector-element-banner" class="hidden">
          <span id="inspector-banner-title"></span>
          <button id="btn-inspector-open-meta"></button>
        </div>
      </div>
    `;
    (MetadataPanelController as any).instance = null;
  });

  it("populates hero identity card, accordion groups, filters fields live, and resets cleanly", () => {
    const ctrl = MetadataPanelController.getInstance();
    ctrl.init();

    const table = document.getElementById("element-metadata-table")!;
    const g1 = ctrl.createAccordionGroup("Core Identity & Attributes", "", true, "IFC");
    g1.content.innerHTML = `
      <div class="prop-row"><span class="prop-label">Express ID</span><span class="prop-val">1044</span></div>
      <div class="prop-row"><span class="prop-label">Fire Rating</span><span class="prop-val">FR60</span></div>
    `;
    const g2 = ctrl.createAccordionGroup("Pset_BeamCommon", "", true, "1");
    g2.content.innerHTML = `
      <div class="prop-row"><span class="prop-label">Span</span><span class="prop-val">7.5 m</span></div>
    `;
    table.appendChild(g1.details);
    table.appendChild(g2.details);

    ctrl.setSelectedElementState({
      modelId: "m1",
      expressId: 1044,
      entityName: "IFCBEAM",
      nameVal: "W12x40 Steel Girder",
      guid: "2O2Fr$t4X7Zf8NOew3FLOH",
      storeyName: "Level 2",
      dimensions: { length: "7.50 m", width: "0.30 m", height: "0.45 m", volume: "1.01 m³" },
    });

    expect(document.getElementById("metadata-selected-state")!.style.display).toBe("flex");
    expect(document.getElementById("metadata-empty-state")!.style.display).toBe("none");
    expect(document.getElementById("meta-hero-entity")!.textContent).toBe("IFCBEAM");
    expect(document.getElementById("meta-hero-name")!.textContent).toBe("W12x40 Steel Girder");
    expect(document.getElementById("meta-filter-count")!.textContent).toBe("3 fields");
    expect(document.getElementById("inspector-element-banner")!.classList.contains("hidden")).toBe(false);

    // Live filter isolates matching property & hides empty accordion
    ctrl.applyFilter("fire");
    expect(document.getElementById("meta-filter-count")!.textContent).toBe("1 / 3 match");
    expect(g2.details.style.display).toBe("none");
    expect(document.getElementById("meta-no-filter-matches")!.style.display).toBe("none");

    // Non-matching filter reveals helpful empty hint
    ctrl.applyFilter("nonexistent_prop");
    expect(document.getElementById("meta-no-filter-matches")!.style.display).toBe("block");

    // Reset restores empty state cleanly
    ctrl.reset();
    expect(document.getElementById("metadata-empty-state")!.style.display).toBe("flex");
    expect(document.getElementById("metadata-selected-state")!.style.display).toBe("none");
    expect(document.getElementById("inspector-element-banner")!.classList.contains("hidden")).toBe(true);
  });

  it("supports cross-tab navigation between META and INSPECT panels", () => {
    const switchSpy = vi.fn();
    (window as any).switchSidebarTab = switchSpy;

    const ctrl = MetadataPanelController.getInstance();
    ctrl.init();

    document.getElementById("btn-meta-open-inspect")!.click();
    expect(switchSpy).toHaveBeenCalledWith("right-tab-bar", "inspector");

    document.getElementById("btn-inspector-open-meta")!.click();
    expect(switchSpy).toHaveBeenCalledWith("right-tab-bar", "metadata");
  });

  it("renders multi-selection batch summary with aggregate quantities and interactive category filter", () => {
    const filterSpy = vi.fn();
    (window as any).__filterSelectionCategory = filterSpy;

    const ctrl = MetadataPanelController.getInstance();
    ctrl.init();

    ctrl.setMultiSelectionState({
      totalCount: 14,
      modelCount: 1,
      categories: [
        { category: "IFCWALL", count: 10, expressIds: [1, 2], modelId: "m1" },
        { category: "IFCCOLUMN", count: 4, expressIds: [3], modelId: "m1" },
      ],
      storeys: [{ storey: "Level 1", count: 14 }],
      totalVolumeM3: 24.5,
      totalAreaM2: 88.25,
      estimatedCost: 14250,
      formattedCost: "$14,250.00",
      sharedAttributes: [{ label: "Building Storey", value: "Level 1" }],
      leadElement: {
        modelId: "m1",
        expressId: 1,
        category: "IFCWALL",
        name: "Wall W1",
        storey: "Level 1",
      },
    });

    expect(document.getElementById("meta-hero-name")!.textContent).toBe("14 Elements Selected");
    expect(document.getElementById("meta-hero-entity")!.textContent).toBe("BATCH × 14");
    expect(document.getElementById("inspector-banner-title")!.textContent).toContain("$14,250.00");

    const filterBtn = document.querySelector<HTMLButtonElement>('[data-filter-category="IFCWALL"]')!;
    expect(filterBtn).not.toBeNull();
    filterBtn.click();
    expect(filterSpy).toHaveBeenCalledWith("IFCWALL");
  });
});
