// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import {
  UI_WINDOW_SIZES,
  UI_Z_LAYERS,
  FloatingWindowManager,
  createFloatingWindow,
  createBkModal,
  createBkDropdown,
  createBkButton,
  createBkSelect,
} from "../UiPlatform";
import { initPwaUpdateWatcher, resetPwaUpdateWatcherForTest } from "../../core/PwaUpdateManager";
import { initMobileWorkspace, resetMobileWorkspaceForTest } from "../MobileWorkspace";

describe("UI Platform Standards & Global Component Contract", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    localStorage.clear();
  });

  it("enforces monotonic floating window size presets and strict z-index elevation order", () => {
    expect(UI_WINDOW_SIZES.sm.width).toBeLessThan(UI_WINDOW_SIZES.md.width);
    expect(UI_WINDOW_SIZES.md.width).toBeLessThan(UI_WINDOW_SIZES.lg.width);
    expect(UI_WINDOW_SIZES.lg.width).toBeLessThan(UI_WINDOW_SIZES.xl.width);

    expect(UI_Z_LAYERS.canvas).toBeLessThan(UI_Z_LAYERS.hud);
    expect(UI_Z_LAYERS.hud).toBeLessThan(UI_Z_LAYERS.sidebar);
    expect(UI_Z_LAYERS.sidebar).toBeLessThan(UI_Z_LAYERS.dock);
    expect(UI_Z_LAYERS.dock).toBeLessThan(UI_Z_LAYERS.floatingBase);
    expect(UI_Z_LAYERS.floatingMax).toBeLessThan(UI_Z_LAYERS.dropdown);
    expect(UI_Z_LAYERS.dropdown).toBeLessThan(UI_Z_LAYERS.modal);
    expect(UI_Z_LAYERS.modal).toBeLessThan(UI_Z_LAYERS.command);
    expect(UI_Z_LAYERS.command).toBeLessThan(UI_Z_LAYERS.toast);
  });

  it("coordinates click-to-focus z-stacking, persistence, collapse, and minimize-to-pill in FloatingWindowManager", () => {
    const mgr = FloatingWindowManager.getInstance();
    const winA = createFloatingWindow({
      id: "test-float-a",
      title: "Analytics",
      size: "lg",
      resizable: true,
      collapsible: true,
      showResetButton: true,
      persistKey: "test_float_a_v1",
      bodyHtml: "<p>Chart</p>",
    });
    const winB = createFloatingWindow({
      id: "test-float-b",
      title: "Transform",
      size: "sm",
      minimizeMode: "pill",
      pillLabel: "Transform Pill",
      bodyHtml: "<p>Controls</p>",
    });

    winA.open();
    winB.open();
    expect(winB.getZIndex()).toBeGreaterThan(winA.getZIndex());

    // Bringing winA to front raises it cleanly above winB within the floating layer
    mgr.bringToFront("test-float-a");
    expect(winA.getZIndex()).toBeGreaterThan(winB.getZIndex());
    expect(winA.getZIndex()).toBeGreaterThanOrEqual(UI_Z_LAYERS.floatingBase);
    expect(winA.getZIndex()).toBeLessThanOrEqual(UI_Z_LAYERS.floatingMax);

    // Position, resize, collapse, and persistence
    winA.setPosition(110, 92);
    winA.setSize(520, 260);
    expect(winA.getGeometry()).toMatchObject({ left: 110, top: 92, width: 520, height: 260 });
    expect(localStorage.getItem("test_float_a_v1")).toContain('"width":520');

    winA.setCollapsed(true);
    expect(winA.el.classList.contains("is-collapsed")).toBe(true);

    // Minimize-to-pill mode creates reopen pill and restores window on click
    winB.close(true);
    expect(winB.isOpen()).toBe(false);
    const pill = document.getElementById("test-float-b-reopen-pill") as HTMLButtonElement;
    expect(pill).not.toBeNull();
    pill.click();
    expect(winB.isOpen()).toBe(true);
    expect(document.getElementById("test-float-b-reopen-pill")).toBeNull();

    winA.destroy();
    winB.destroy();
    expect(document.getElementById("test-float-a")).toBeNull();
    expect(document.getElementById("test-float-b")).toBeNull();
  });

  it("creates accessible standard modals with Escape and backdrop dismissal", () => {
    let closed = 0;
    const modal = createBkModal({
      id: "test-std-modal",
      title: "Standard Dialog",
      subtitle: "Subtitle line",
      size: "md",
      closeButtonId: "test-std-close",
      bodyHtml: "<div>Body</div>",
      footerHtml: `<button type="button" class="bk-btn bk-btn--primary">Save</button>`,
      onClose: () => {
        closed++;
      },
    });

    expect(modal.dialog.getAttribute("role")).toBe("dialog");
    expect(modal.dialog.getAttribute("aria-modal")).toBe("true");
    expect(modal.dialog.classList.contains("bk-modal--md")).toBe(true);
    expect(document.getElementById("test-std-close")).not.toBeNull();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(document.getElementById("test-std-modal")).toBeNull();
    expect(closed).toBe(1);
  });

  it("creates standard viewport-clamped dropdowns, buttons, and selects", () => {
    let clicked = false;
    const btn = createBkButton({
      id: "std-btn",
      label: "Actions",
      variant: "primary",
      size: "sm",
      onClick: () => {
        clicked = true;
      },
    });
    document.body.appendChild(btn);
    expect(btn.className).toContain("bk-btn--primary");
    expect(btn.className).toContain("bk-btn--sm");
    btn.click();
    expect(clicked).toBe(true);

    let chosen = "";
    const dropdown = createBkDropdown({
      id: "std-dropdown",
      anchor: btn,
      items: [
        { id: "opt1", label: "Option One", badge: "NEW", onSelect: () => { chosen = "opt1"; } },
        { id: "opt2", label: "Option Two", dividerBefore: true, onSelect: () => { chosen = "opt2"; } },
      ],
    });
    dropdown.open();
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    expect(dropdown.menu.classList.contains("hidden")).toBe(false);
    dropdown.menu.querySelector<HTMLButtonElement>('[data-item-id="opt2"]')?.click();
    expect(chosen).toBe("opt2");
    expect(dropdown.menu.classList.contains("hidden")).toBe(true);
    dropdown.destroy();

    let selectedVal = "";
    const sel = createBkSelect({
      id: "std-select",
      ariaLabel: "Granularity",
      size: "sm",
      items: [
        { value: "month", label: "Monthly" },
        { value: "week", label: "Weekly" },
      ],
      value: "month",
      onChange: (v) => {
        selectedVal = v;
      },
    });
    document.body.appendChild(sel);
    expect(sel.className).toContain("bk-select--sm");
    sel.value = "week";
    sel.dispatchEvent(new Event("change"));
    expect(selectedVal).toBe("week");
  });

  it("never triggers unsolicited reload on first-visit Service Worker claim (prevents double-load on start)", () => {
    resetPwaUpdateWatcherForTest();
    const listeners = new Map<string, Array<() => void>>();
    let postedSkipWaiting = false;
    let reloadCount = 0;

    const fakeSw = {
      controller: null as unknown,
      addEventListener: (evt: string, fn: () => void) => {
        listeners.set(evt, [...(listeners.get(evt) || []), fn]);
      },
      getRegistration: async () => undefined,
    };
    Object.defineProperty(navigator, "serviceWorker", { value: fakeSw, configurable: true });

    const fakeReg = {
      waiting: { postMessage: (msg: { type: string }) => { if (msg.type === "SKIP_WAITING") postedSkipWaiting = true; } },
      installing: null,
      addEventListener: () => {},
    } as unknown as ServiceWorkerRegistration;

    initPwaUpdateWatcher(undefined, fakeReg, () => { reloadCount++; });

    // Simulate first-visit SW claiming the page — MUST NOT reload
    for (const fn of listeners.get("controllerchange") || []) fn();
    expect(reloadCount).toBe(0);
    expect(postedSkipWaiting).toBe(false);

    // Now simulate returning user with an existing controller + waiting update
    resetPwaUpdateWatcherForTest();
    listeners.clear();
    fakeSw.controller = { state: "activated" };
    let triggerReload: (() => void) | null = null;
    initPwaUpdateWatcher((fn) => { triggerReload = fn; }, fakeReg, () => { reloadCount++; });

    // Unsolicited controllerchange before clicking Reload — MUST NOT reload
    for (const fn of listeners.get("controllerchange") || []) fn();
    expect(reloadCount).toBe(0);

    // User clicks Reload -> posts SKIP_WAITING -> controllerchange reloads ONCE
    expect(triggerReload).not.toBeNull();
    triggerReload!();
    expect(postedSkipWaiting).toBe(true);
    for (const fn of listeners.get("controllerchange") || []) fn();
    expect(reloadCount).toBe(1);
  });

  it("mounts dedicated mobile-only spatial cockpit with 5-tab bar, sheets, and single-sheet discipline", () => {
    resetMobileWorkspaceForTest();
    document.body.innerHTML = `
      <div class="ui-layer">
        <header>
          <div class="brand"><div class="brand-logo">K</div></div>
          <div class="header-controls">
            <select id="select-theme-toggle"><option value="obsidian">Obsidian</option><option value="light">Studio</option></select>
            <select id="workspace-persona-select"><option value="all">All Tools</option><option value="field">Field Touch</option></select>
            <button id="btn-open-command-palette"></button>
            <span id="saved-views-count-badge">6</span>
          </div>
        </header>
        <span id="breadcrumb-storey">Level 2</span>
        <select id="minimap-level-select"><option value="0">L0 (Ground)</option><option value="2" selected>L2 (Second)</option></select>
        <div id="minimap-container"></div>
        <div id="sidebar-backdrop"></div>
        <aside class="left-sidebar"><div id="left-tab-bar"><button class="sidebar-tab-btn active" data-tab="files"></button></div></aside>
        <aside class="right-sidebar"><div id="right-tab-bar"><button class="sidebar-tab-btn active" data-tab="scene"></button></div></aside>
        <button id="btn-dock-measure"></button>
        <button id="btn-section-cut"></button>
        <button id="btn-dock-clash"></button>
        <button id="btn-view-fit"></button>
      </div>
    `;

    let measured = 0;
    let clashed = 0;
    let fitted = 0;
    let switchedTo = "";
    document.getElementById("btn-dock-measure")?.addEventListener("click", () => { measured++; });
    document.getElementById("btn-dock-clash")?.addEventListener("click", () => { clashed++; });
    document.getElementById("btn-view-fit")?.addEventListener("click", () => { fitted++; });
    (window as any).switchSidebarTab = (barId: string, tab: string) => {
      switchedTo = `${barId}:${tab}`;
      const cls = barId === "left-tab-bar" ? ".left-sidebar" : ".right-sidebar";
      document.querySelector(cls)?.classList.add("open");
    };

    const ctrl = initMobileWorkspace();

    // Every injected mobile control carries `.bk-mobile-only` so desktop/tablet stays untouched
    const dock = document.getElementById("mob-dock");
    const rail = document.getElementById("mob-camera-rail");
    const storeyPill = document.getElementById("mob-storey-pill");
    const menuBtn = document.getElementById("mob-btn-menu");
    expect(dock?.classList.contains("bk-mobile-only")).toBe(true);
    expect(rail?.classList.contains("bk-mobile-only")).toBe(true);
    expect(storeyPill?.classList.contains("bk-mobile-only")).toBe(true);
    expect(menuBtn?.classList.contains("bk-mobile-only")).toBe(true);
    expect(dock?.querySelectorAll("[data-mob-nav]").length).toBe(5);
    expect(document.getElementById("mob-storey-pill-label")?.textContent).toBe("Level 2");

    // Camera rail delegates Fit View directly
    document.getElementById("mob-cam-fit")?.click();
    expect(fitted).toBe(1);

    // Opening Tools sheet and clicking Measure delegates & closes sheet
    document.getElementById("mob-tab-tools")?.click();
    expect(document.getElementById("mob-sheet-tools")?.classList.contains("is-open")).toBe(true);
    document.getElementById("mob-tool-measure")?.click();
    expect(measured).toBe(1);
    expect(document.getElementById("mob-sheet-tools")?.classList.contains("is-open")).toBe(false);

    // Single-sheet discipline: opening Suites closes Menu, clicking Clash delegates cleanly
    menuBtn?.click();
    expect(document.getElementById("mob-sheet-menu")?.classList.contains("is-open")).toBe(true);
    document.getElementById("mob-tab-suites")?.click();
    expect(document.getElementById("mob-sheet-menu")?.classList.contains("is-open")).toBe(false);
    expect(document.getElementById("mob-sheet-suites")?.classList.contains("is-open")).toBe(true);
    document.getElementById("mob-suite-clash")?.click();
    expect(clashed).toBe(1);

    // Model tab opens left sidebar sheet
    document.getElementById("mob-tab-model")?.click();
    expect(switchedTo).toBe("left-tab-bar:files");
    expect(document.querySelector(".left-sidebar")?.classList.contains("open")).toBe(true);

    // Theme choice inside Quick Menu syncs underlying select
    menuBtn?.click();
    const studioBtn = document.querySelector<HTMLButtonElement>('[data-mob-theme="light"]');
    studioBtn?.click();
    expect((document.getElementById("select-theme-toggle") as HTMLSelectElement).value).toBe("light");

    ctrl.closeAllSheets();
    expect(document.getElementById("mob-sheet-menu")?.classList.contains("is-open")).toBe(false);
    resetMobileWorkspaceForTest();
  });
});
