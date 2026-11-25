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
import { HelpCenterController } from "../HelpCenterController";
import { UIManager } from "../UIManager";
import { encodeDeepLinkState, decodeDeepLinkHash } from "../../core/DeepLinkManager";
import { HELP_CENTER_ARTICLES } from "../../data/helpCenterArticles";
import { MobileWalkthroughControls } from "../MobileWalkthroughControls";
import { MobileGpuAdaptiveController } from "../../core/MobileGpuAdaptiveController";
import { mountEnterpriseDrawers, resetEnterpriseDrawersForTest } from "../templates/enterpriseDrawersHtml";
import { BcfIssueManager } from "../../modules/BcfIssueManager";

describe("UI Platform Standards & Global Component Contract", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.className = "";
    document.documentElement.removeAttribute("data-ui-layout");
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
    ctrl.setUiLayout("cockpit", false);

    // Every cockpit control carries `.bk-cockpit` so the unified Spatial Cockpit scales across all screens
    const dock = document.getElementById("mob-dock");
    const rail = document.getElementById("mob-camera-rail");
    const storeyPill = document.getElementById("mob-storey-pill");
    const menuBtn = document.getElementById("mob-btn-menu");
    expect(dock?.classList.contains("bk-cockpit")).toBe(true);
    expect(rail?.classList.contains("bk-cockpit")).toBe(true);
    expect(storeyPill?.classList.contains("bk-cockpit")).toBe(true);
    expect(menuBtn?.classList.contains("bk-cockpit")).toBe(true);
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

  it("renders searchable interactive Help Center directory and navigates clickable step-by-step help pages", () => {
    document.body.innerHTML = `<div id="help-center-root"></div>`;
    const hc = new HelpCenterController();
    hc.mount("help-center-root");

    // Directory lists all 8 step-by-step articles
    expect(document.querySelectorAll(".hc-article-card").length).toBe(HELP_CENTER_ARTICLES.length);

    // Search filters articles live
    const search = document.getElementById("help-center-search") as HTMLInputElement;
    search.value = "joystick";
    search.dispatchEvent(new Event("input", { bubbles: true }));
    expect(document.querySelectorAll(".hc-article-card").length).toBe(1);
    expect(document.querySelector(".hc-article-card")?.getAttribute("data-hc-article")).toBe("mobile-field-guide");

    // Clicking an article opens its step-by-step help page inline with numbered steps & pager
    document.querySelector<HTMLButtonElement>('[data-hc-article="mobile-field-guide"]')?.click();
    expect(hc.getActiveArticleId()).toBe("mobile-field-guide");
    expect(document.querySelectorAll(".hc-step-card").length).toBeGreaterThanOrEqual(3);

    // Next Guide button navigates smoothly to the next article
    document.querySelector<HTMLButtonElement>(".hc-pager-btn--next")?.click();
    expect(hc.getActiveArticleId()).toBe("4d-simulation");

    // Back button returns to full directory
    document.querySelector<HTMLButtonElement>("[data-hc-back]")?.click();
    expect(hc.getActiveArticleId()).toBeNull();
  });

  it("defaults to Classic UI on desktop, Cockpit UI on mobile, and switches live with persistence and 4D reparenting", () => {
    resetMobileWorkspaceForTest();
    document.body.innerHTML = `
      <div class="ui-layer">
        <header>
          <div class="brand"><div class="brand-logo">K</div></div>
          <div class="header-controls">
            <button id="btn-toggle-ui-layout"><span id="ui-layout-switch-label">Cockpit UI</span></button>
          </div>
        </header>
        <div id="timeline-panel">
          <div id="cascade-4d-panel" class="hidden"></div>
          <div id="timeline-options-modal" class="hidden"></div>
        </div>
      </div>
    `;

    // 1. Desktop viewport (non-mobile matchMedia) defaults to Classic UI without persisting an override
    const origMatchMedia = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: false,
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;

    try {
      const desktopCtrl = initMobileWorkspace();
      expect(desktopCtrl.getUiLayout()).toBe("classic");
      expect(document.documentElement.getAttribute("data-ui-layout")).toBe("classic");
      expect(document.body.classList.contains("ui-classic")).toBe(true);
      expect(localStorage.getItem("bim_ui_layout")).toBeNull();
      expect(document.getElementById("cascade-4d-panel")?.parentElement?.id).toBe("timeline-panel");
      expect(document.getElementById("ui-layout-switch-label")?.textContent).toBe("Cockpit UI");

      // 1-click header toggle switches Desktop live to Cockpit UI, reparents 4D panels & persists
      document.getElementById("btn-toggle-ui-layout")?.click();
      expect(desktopCtrl.getUiLayout()).toBe("cockpit");
      expect(document.documentElement.getAttribute("data-ui-layout")).toBe("cockpit");
      expect(document.body.classList.contains("ui-cockpit")).toBe(true);
      expect(localStorage.getItem("bim_ui_layout")).toBe("cockpit");
      expect(document.getElementById("cascade-4d-panel")?.parentElement?.classList.contains("ui-layer")).toBe(true);
      expect(document.getElementById("ui-layout-switch-label")?.textContent).toBe("Classic UI");

      // Workspace menu pill switches right back to Classic UI
      document.getElementById("mob-btn-menu")?.click();
      document.querySelector<HTMLButtonElement>('[data-ui-layout-choice="classic"]')?.click();
      expect(desktopCtrl.getUiLayout()).toBe("classic");
      expect(localStorage.getItem("bim_ui_layout")).toBe("classic");
      expect(document.getElementById("mob-sheet-menu")?.classList.contains("is-open")).toBe(false);
      expect(document.getElementById("cascade-4d-panel")?.parentElement?.id).toBe("timeline-panel");

      // 2. Fresh mobile viewport defaults automatically to Cockpit UI
      resetMobileWorkspaceForTest();
      localStorage.clear();
      window.matchMedia = ((q: string) => ({
        matches: q.includes("767px"),
        media: q,
        addEventListener: () => {},
        removeEventListener: () => {},
      })) as unknown as typeof window.matchMedia;

      const mobileCtrl = initMobileWorkspace();
      expect(mobileCtrl.getUiLayout()).toBe("cockpit");
      expect(document.documentElement.getAttribute("data-ui-layout")).toBe("cockpit");
      expect(localStorage.getItem("bim_ui_layout")).toBeNull();
      expect(document.getElementById("cascade-4d-panel")?.parentElement?.classList.contains("ui-layer")).toBe(true);
    } finally {
      window.matchMedia = origMatchMedia;
      resetMobileWorkspaceForTest();
    }
  });

  it("drives Mobile 4D Mini-Scrubber sync, Empty-Canvas Quick Launcher, Walkthrough Joystick, GPU Adaptive Quality, Lazy Drawers & BCF Photo Snag", async () => {
    resetMobileWorkspaceForTest();
    resetEnterpriseDrawersForTest();
    MobileWalkthroughControls.resetForTest();

    document.body.innerHTML = `
      <div class="ui-layer">
        <header><div class="brand"><div class="brand-logo">K</div></div><div class="header-controls"></div></header>
        <span id="badge-files-count">0</span>
        <select id="sample-model-select"><option value="snowdon">Snowdon</option><option value="school">School</option></select>
        <button id="load-sample-btn"></button>
        <input id="timeline-slider" type="range" min="0" max="100" value="10" />
        <span id="gantt-week-badge">Week 4 of 52</span>
        <span id="timeline-date-badge">2026-07-01</span>
        <span id="gantt-progress-val">22% Complete</span>
        <button id="timeline-play-btn"><span class="ctrl-icon">▶</span></button>
        <button id="btn-close-gantt-bar"></button>
        <div id="enterprise-drawers-root"></div>
      </div>
    `;

    // 1. Lazy Enterprise Drawers hydration
    const mountedRoot = mountEnterpriseDrawers();
    expect(mountedRoot?.querySelectorAll(".enterprise-drawer").length).toBe(10);
    expect(document.getElementById("btn-bcf-photo-snag")).not.toBeNull();

    // 2. Empty-Canvas Launcher & Mobile 4D Scrubber sync
    let sampleLoaded = false;
    document.getElementById("load-sample-btn")?.addEventListener("click", () => { sampleLoaded = true; });
    const ctrl = initMobileWorkspace();
    ctrl.setUiLayout("cockpit", false);
    expect(document.getElementById("mob-empty-launcher")?.classList.contains("is-visible")).toBe(true);

    // Scrubbing Mobile 4D slider updates underlying timeline slider
    document.body.classList.add("mode-4d");
    ctrl.syncState();
    expect(document.getElementById("mob-empty-launcher")?.classList.contains("is-visible")).toBe(false);
    expect(document.getElementById("mob-4d-week")?.textContent).toBe("Week 4 of 52");
    expect(document.getElementById("mob-4d-pct")?.textContent).toBe("22%");
    const mobSlider = document.getElementById("mob-4d-slider") as HTMLInputElement;
    mobSlider.value = "42";
    mobSlider.dispatchEvent(new Event("input"));
    expect((document.getElementById("timeline-slider") as HTMLInputElement).value).toBe("42");

    // 4D Tools sheet opens cleanly
    document.getElementById("mob-4d-tools-btn")?.click();
    expect(document.getElementById("mob-sheet-4d")?.classList.contains("is-open")).toBe(true);
    document.body.classList.remove("mode-4d");
    ctrl.closeAllSheets();

    // Empty launcher 1-tap demo trigger
    document.getElementById("mob-launch-school")?.click();
    expect((document.getElementById("sample-model-select") as HTMLSelectElement).value).toBe("school");
    expect(sampleLoaded).toBe(true);

    // 3. Mobile Walkthrough Touch Joystick
    let moveVec = { f: 0, r: 0, v: 0 };
    let lookVec = { dx: 0, dy: 0 };
    let stopped = 0;
    MobileWalkthroughControls.init(() => ({
      walkActive: true,
      setTouchMoveInput: (f, r, v = 0) => { moveVec = { f, r, v }; },
      addLookDelta: (dx, dy) => { lookVec = { dx, dy }; },
      stopWalkthrough: () => { stopped++; },
    }));
    expect(document.getElementById("mob-walk-hud")?.classList.contains("bk-mobile-only")).toBe(true);
    const upBtn = document.getElementById("mob-walk-up")!;
    upBtn.dispatchEvent(new Event("pointerdown"));
    expect(moveVec.v).toBe(1);
    upBtn.dispatchEvent(new Event("pointerup"));
    expect(moveVec.v).toBe(0);
    document.getElementById("mob-walk-exit")?.click();
    expect(stopped).toBe(1);
    expect(lookVec.dx).toBe(0);

    // 4. Mobile GPU Adaptive Quality (caps phone DPR <= 1.5, drops to 1.0 on controlstart & restores)
    let currentDpr = 0;
    const listeners: Record<string, () => void> = {};
    const fakeWorld = {
      renderer: {
        three: { setPixelRatio: (r: number) => { currentDpr = r; } },
        postproduction: { enabled: true },
      },
      camera: {
        controls: {
          addEventListener: (e: string, cb: () => void) => { listeners[e] = cb; },
          removeEventListener: () => {},
        },
      },
    };
    const origMatchMedia = window.matchMedia;
    Object.defineProperty(window, "devicePixelRatio", { value: 3, configurable: true });
    window.matchMedia = (() => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} })) as any;
    const gpu = new MobileGpuAdaptiveController(fakeWorld, { restoreDelayMs: 10 });
    expect(currentDpr).toBe(1.5);
    listeners.controlstart?.();
    expect(currentDpr).toBe(1.0);
    expect(fakeWorld.renderer.postproduction.enabled).toBe(false);
    listeners.controlend?.();
    await new Promise((r) => setTimeout(r, 25));
    expect(currentDpr).toBe(1.5);
    expect(fakeWorld.renderer.postproduction.enabled).toBe(true);
    gpu.dispose();
    window.matchMedia = origMatchMedia;

    // 5. 1-Tap BCF Photo Snagging
    const bcf = BcfIssueManager.getInstance();
    const photoTopic = bcf.createPhotoIssue("Leak on L2", "Field photo", "data:image/jpeg;base64,AAAA", "leak.jpg");
    expect(photoTopic.topicType).toBe("Field Snag");
    expect(photoTopic.photoDataUrl).toBe("data:image/jpeg;base64,AAAA");
    expect(photoTopic.photoName).toBe("leak.jpg");

    resetMobileWorkspaceForTest();
    MobileWalkthroughControls.resetForTest();
  });

  it("wires contextual ? Help buttons in Enterprise Drawers & Cockpit sheets and executes Try It Now actions", () => {
    resetMobileWorkspaceForTest();
    resetEnterpriseDrawersForTest();

    document.body.innerHTML = `
      <div class="ui-layer">
        <header><div class="brand"><div class="brand-logo">K</div></div><div class="header-controls"></div></header>
        <button id="btn-dock-clash"></button>
        <div id="shortcuts-modal">
          <div id="help-center-root"></div>
        </div>
        <div id="enterprise-drawers-root"></div>
      </div>
    `;

    mountEnterpriseDrawers();
    let openedArticle = "";
    (window as any).openHelpArticle = (id: string) => {
      openedArticle = id;
    };

    UIManager.getInstance().injectContextualDrawerHelpButtons();
    const clashHelpBtn = document.querySelector<HTMLButtonElement>("#clash-panel .drawer-help-btn");
    expect(clashHelpBtn).not.toBeNull();
    clashHelpBtn?.click();
    expect(openedArticle).toBe("clash-bcf");

    const ctrl = initMobileWorkspace();
    ctrl.setUiLayout("cockpit", false);
    const toolsSheetHelpBtn = document.querySelector<HTMLButtonElement>("#mob-sheet-tools .mob-sheet__help-btn");
    expect(toolsSheetHelpBtn).not.toBeNull();
    toolsSheetHelpBtn?.click();
    expect(openedArticle).toBe("mobile-field-guide");

    let clashClicked = 0;
    document.getElementById("btn-dock-clash")?.addEventListener("click", () => { clashClicked++; });
    const hc = new HelpCenterController();
    hc.mount("help-center-root");
    hc.openArticle("clash-bcf");
    const tryBtn = document.querySelector<HTMLButtonElement>('[data-hc-action="open-clash"]');
    expect(tryBtn).not.toBeNull();
    tryBtn?.click();
    expect(clashClicked).toBe(1);
    expect(document.getElementById("shortcuts-modal")?.classList.contains("hidden")).toBe(true);

    delete (window as any).openHelpArticle;
    resetMobileWorkspaceForTest();
  });

  it("encodes and decodes rich #view= deep-links with layout, storey, and capped selectedIds", () => {
    const rawIds = Array.from({ length: 25 }, (_, i) => `modelA:${i + 1}`);
    const hash = encodeDeepLinkState({
      camPos: [10.126, 20.5, -5.004],
      camTarget: [0, 2.5, 0],
      storey: "Level 2",
      layout: "cockpit",
      selectedIds: rawIds,
      mode4d: true,
      date4d: "2026-08-15",
      lens: "cascade",
    });
    expect(hash.startsWith("#view=")).toBe(true);

    const decoded = decodeDeepLinkHash(hash);
    expect(decoded).not.toBeNull();
    expect(decoded?.camPos).toEqual([10.13, 20.5, -5]);
    expect(decoded?.storey).toBe("Level 2");
    expect(decoded?.layout).toBe("cockpit");
    expect(decoded?.selectedIds?.length).toBe(20);
    expect(decoded?.selectedIds?.[0]).toBe("modelA:1");
    expect(decoded?.mode4d).toBe(true);
    expect(decoded?.lens).toBe("cascade");
  });

  it("syncs Cockpit Menu PWA Install row and renders Offline Cache status badge in Empty Launcher", () => {
    resetMobileWorkspaceForTest();
    document.body.innerHTML = `
      <div class="ui-layer">
        <header>
          <div class="brand"><div class="brand-logo">K</div></div>
          <div class="header-controls">
            <button id="btn-top-pwa-install" class="hidden"></button>
          </div>
        </header>
        <span id="badge-files-count">0</span>
      </div>
    `;

    let pwaTriggered = 0;
    const topPwaBtn = document.getElementById("btn-top-pwa-install") as HTMLButtonElement;
    topPwaBtn.addEventListener("click", () => { pwaTriggered++; });

    const ctrl = initMobileWorkspace();
    ctrl.setUiLayout("cockpit", false);

    const mobPwaBtn = document.getElementById("mob-menu-pwa-install") as HTMLButtonElement | null;
    expect(mobPwaBtn).not.toBeNull();
    expect(mobPwaBtn?.style.display).toBe("none");
    expect(document.getElementById("mob-offline-cache-badge")).not.toBeNull();

    topPwaBtn.classList.remove("hidden");
    ctrl.syncState();
    expect(mobPwaBtn?.style.display).toBe("flex");
    mobPwaBtn?.click();
    expect(pwaTriggered).toBe(1);

    resetMobileWorkspaceForTest();
  });
});
