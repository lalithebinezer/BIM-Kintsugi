/**
 * MobileWorkspace — Dedicated Mobile-Only Spatial BIM Cockpit (<= 767px & Phone Landscape)
 *
 * Strictly invisible on tablet (>= 768px) and desktop via `.bk-mobile-only`.
 * Delegates 100% of actions to existing battle-tested DOM controls & window APIs
 * (zero duplicated business logic, zero impact on desktop/tablet layout).
 *
 * Spatial Layout:
 *  1. Slim Top Bar (52px): Brand K + Interactive Storey/Model Pill + Search + Quick Menu
 *  2. Unobstructed 3D Viewport (85%+ canvas) + Right-Edge Thumb Camera Rail (Fit / Views / Section)
 *  3. Unified 5-Tab Bottom Bar: Model | Inspect | Tools | 4D | Suites
 *  4. Native Bottom Sheets with drag-handle swipe-to-dismiss, Half/Full snap, and single-sheet discipline.
 */

export type MobileSheetId = "tools" | "suites" | "menu" | "storey";

interface MobileActionItem {
  id: string;
  targetId: string;
  label: string;
  subtitle?: string;
  icon: string;
  accent?: string;
}

const MOBILE_MEDIA_QUERY = "(max-width: 767px), (max-height: 460px) and (max-width: 932px)";

const FIELD_PRIMARY_TOOLS: MobileActionItem[] = [
  {
    id: "mob-tool-measure",
    targetId: "btn-dock-measure",
    label: "Measure 3D",
    subtitle: "Point-to-point",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.3 8.7 8.7 21.3a2.12 2.12 0 0 1-3 0l-4.4-4.4a2.12 2.12 0 0 1 0-3L14 1.3a2.12 2.12 0 0 1 3 0l4.3 4.4a2.12 2.12 0 0 1 0 3Z"/><line x1="14.5" y1="4.5" x2="16.5" y2="6.5"/><line x1="11" y1="8" x2="13" y2="10"/><line x1="7.5" y1="11.5" x2="9.5" y2="13.5"/></svg>`,
  },
  {
    id: "mob-tool-section",
    targetId: "btn-section-cut",
    label: "Section Cut",
    subtitle: "Clip 3D planes",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
  },
  {
    id: "mob-tool-box",
    targetId: "btn-box-select",
    label: "Box Select",
    subtitle: "Drag marquee",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><polyline points="9 9 15 15"/><polyline points="15 9 9 15"/></svg>`,
  },
  {
    id: "mob-tool-visibility",
    targetId: "btn-toggle-visibility",
    label: "Hide / Show All",
    subtitle: "Toggle visibility",
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
];

const FIELD_SELECTION_CHIPS: MobileActionItem[] = [
  { id: "mob-chip-focus", targetId: "btn-focus", label: "Focus", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>` },
  { id: "mob-chip-isolate", targetId: "btn-isolate", label: "Isolate", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>` },
  { id: "mob-chip-hide", targetId: "btn-hide-selected", label: "Hide Sel.", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>` },
  { id: "mob-chip-invert", targetId: "btn-invert-select", label: "Invert", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>` },
  { id: "mob-chip-clear-sel", targetId: "btn-clear-selection", label: "Clear Sel.", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` },
  { id: "mob-chip-clear-cuts", targetId: "btn-clear-sections", label: "Clear Cuts", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>` },
  { id: "mob-chip-grid", targetId: "btn-dock-toggle-grid", label: "Ground Grid", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>` },
];

const FIELD_FILE_CHIPS: MobileActionItem[] = [
  { id: "mob-io-ifc", targetId: "btn-load-ifc", label: "Load IFC", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>` },
  { id: "mob-io-frag", targetId: "btn-load-frag", label: "Load FRAG", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>` },
  { id: "mob-io-export", targetId: "btn-export-frag", label: "Export FRAG", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>` },
  { id: "mob-io-sheet", targetId: "btn-view-snapshot", label: "4K Sheet", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` },
];

const SUITE_COORDINATION: MobileActionItem[] = [
  {
    id: "mob-suite-clash",
    targetId: "btn-dock-clash",
    label: "Clash Matrix",
    subtitle: "Spatial & 4D conflicts",
    accent: "#F43F5E",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
  {
    id: "mob-suite-bcf",
    targetId: "btn-dock-bcf",
    label: "BCF Issues",
    subtitle: "Field pins & topics",
    accent: "#A855F7",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>`,
  },
  {
    id: "mob-suite-copilot",
    targetId: "btn-dock-copilot",
    label: "AI Copilot",
    subtitle: "Ask BIM in plain text",
    accent: "#38BDF8",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>`,
  },
  {
    id: "mob-suite-collab",
    targetId: "btn-dock-collab",
    label: "Live Peers",
    subtitle: "Shared review room",
    accent: "#22C55E",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  },
];

const SUITE_ANALYTICS: MobileActionItem[] = [
  {
    id: "mob-suite-cost",
    targetId: "btn-dock-cost",
    label: "5D Cost & BOQ",
    subtitle: "Rates & quality audit",
    accent: "#10B981",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  },
  {
    id: "mob-suite-evm",
    targetId: "btn-dock-evm",
    label: "EVM Control",
    subtitle: "CPI / SPI tracking",
    accent: "#EAB308",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="2.2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  },
  {
    id: "mob-suite-carbon",
    targetId: "btn-dock-carbon",
    label: "6D Carbon LCA",
    subtitle: "Embodied heatmap",
    accent: "#34D399",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2.2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>`,
  },
  {
    id: "mob-suite-gis",
    targetId: "btn-dock-gis",
    label: "GeoBIM GIS",
    subtitle: "3D map, sun & survey",
    accent: "#06B6D4",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  },
  {
    id: "mob-suite-eng",
    targetId: "btn-dock-engineering",
    label: "Engineering",
    subtitle: "DXF · Scans · Civil",
    accent: "#38BDF8",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>`,
  },
  {
    id: "mob-suite-params",
    targetId: "btn-dock-ifc-params",
    label: "IFC Params",
    subtitle: "4D sequence reader",
    accent: "#D4FF3F",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4FF3F" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  },
];

const THEME_PRESETS = [
  { value: "obsidian", label: "Obsidian" },
  { value: "light", label: "Studio" },
  { value: "zen", label: "Zen" },
  { value: "cyberpunk", label: "Neon" },
  { value: "blueprint", label: "CAD" },
];

export interface MobileWorkspaceController {
  openSheet: (id: MobileSheetId) => void;
  closeAllSheets: () => void;
  syncState: () => void;
  isMobileViewport: () => boolean;
}

let activeController: MobileWorkspaceController | null = null;

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function createSheetShell(
  id: MobileSheetId,
  title: string,
  subtitle: string,
  bodyHtml: string,
  onClose: () => void
): HTMLElement {
  const sheet = document.createElement("section");
  sheet.id = `mob-sheet-${id}`;
  sheet.className = "mob-sheet bk-mobile-only";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "false");
  sheet.setAttribute("aria-label", title);
  sheet.innerHTML = `
    <div class="mob-sheet__handle-zone" data-mob-drag="1" aria-hidden="true">
      <span class="mob-sheet__handle"></span>
    </div>
    <div class="mob-sheet__header">
      <div class="mob-sheet__title-wrap">
        <h2 class="mob-sheet__title">${title}</h2>
        <span class="mob-sheet__subtitle">${subtitle}</span>
      </div>
      <div class="mob-sheet__header-actions">
        <button type="button" class="mob-sheet__icon-btn mob-sheet__expand-btn" title="Toggle Full Height" aria-label="Toggle Sheet Height">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
        <button type="button" class="mob-sheet__icon-btn mob-sheet__close-btn" title="Close" aria-label="Close ${title}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="mob-sheet__body thin-scrollbar">${bodyHtml}</div>
  `;

  sheet.querySelector(".mob-sheet__close-btn")?.addEventListener("click", onClose);
  sheet.querySelector(".mob-sheet__expand-btn")?.addEventListener("click", () => {
    sheet.classList.toggle("is-expanded");
  });
  attachSheetSwipeGestures(sheet, onClose);
  return sheet;
}

function attachSheetSwipeGestures(sheet: HTMLElement, onDismiss: () => void): void {
  const dragZone = sheet.querySelector<HTMLElement>("[data-mob-drag]");
  if (!dragZone) return;

  let startY = 0;
  let deltaY = 0;
  let dragging = false;

  const onStart = (ev: TouchEvent) => {
    if (ev.touches.length !== 1) return;
    startY = ev.touches[0].clientY;
    deltaY = 0;
    dragging = true;
    sheet.style.transition = "none";
  };

  const onMove = (ev: TouchEvent) => {
    if (!dragging || ev.touches.length !== 1) return;
    deltaY = ev.touches[0].clientY - startY;
    if (deltaY > 0) {
      sheet.style.transform = `translateY(${Math.min(deltaY, 320)}px)`;
    } else if (deltaY < -24) {
      sheet.classList.add("is-expanded");
    }
  };

  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = "";
    sheet.style.transform = "";
    if (deltaY > 75) {
      if (sheet.classList.contains("is-expanded") && deltaY < 165) {
        sheet.classList.remove("is-expanded");
      } else {
        onDismiss();
      }
    }
    deltaY = 0;
  };

  dragZone.addEventListener("touchstart", onStart, { passive: true });
  dragZone.addEventListener("touchmove", onMove, { passive: true });
  dragZone.addEventListener("touchend", onEnd, { passive: true });
  dragZone.addEventListener("touchcancel", onEnd, { passive: true });
}

function injectSidebarMobileChrome(
  sidebar: HTMLElement | null,
  title: string,
  onClose: () => void
): void {
  if (!sidebar || sidebar.querySelector(".mob-sidebar-chrome")) return;

  const chrome = document.createElement("div");
  chrome.className = "mob-sidebar-chrome bk-mobile-only";
  chrome.innerHTML = `
    <div class="mob-sheet__handle-zone" data-mob-drag="1" aria-hidden="true">
      <span class="mob-sheet__handle"></span>
    </div>
    <div class="mob-sidebar-chrome__bar">
      <span class="mob-sidebar-chrome__title">${title}</span>
      <div class="mob-sheet__header-actions">
        <button type="button" class="mob-sheet__icon-btn mob-sidebar-expand-btn" title="Toggle Full Height" aria-label="Toggle Panel Height">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
        <button type="button" class="mob-sheet__icon-btn mob-sidebar-close-btn" title="Close Panel" aria-label="Close ${title}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  `;

  sidebar.insertBefore(chrome, sidebar.firstChild);
  chrome.querySelector(".mob-sidebar-close-btn")?.addEventListener("click", onClose);
  chrome.querySelector(".mob-sidebar-expand-btn")?.addEventListener("click", () => {
    sidebar.classList.toggle("is-mob-expanded");
  });
  attachSheetSwipeGestures(sidebar, onClose);
}

export function initMobileWorkspace(): MobileWorkspaceController {
  if (activeController) return activeController;

  const uiLayer = document.querySelector<HTMLElement>(".ui-layer") || document.body;
  const headerBrand = document.querySelector<HTMLElement>("header .brand");
  const headerControls = document.querySelector<HTMLElement>("header .header-controls");
  const leftSidebar = document.querySelector<HTMLElement>(".left-sidebar");
  const rightSidebar = document.querySelector<HTMLElement>(".right-sidebar");

  let openSheetId: MobileSheetId | null = null;
  let cameraPopoverOpen = false;
  let radarOpen = false;

  const sheets = new Map<MobileSheetId, HTMLElement>();

  // ─── 1. Slim Top Bar Extensions (Storey Context Pill + Mobile Menu Button) ───
  let storeyPill = document.getElementById("mob-storey-pill") as HTMLButtonElement | null;
  if (headerBrand && !storeyPill) {
    storeyPill = document.createElement("button");
    storeyPill.type = "button";
    storeyPill.id = "mob-storey-pill";
    storeyPill.className = "mob-storey-pill bk-mobile-only";
    storeyPill.setAttribute("aria-label", "Switch Active Storey or Floor Plan");
    storeyPill.setAttribute("aria-expanded", "false");
    storeyPill.innerHTML = `
      <span class="mob-storey-pill__dot" aria-hidden="true"></span>
      <span class="mob-storey-pill__label" id="mob-storey-pill-label">Level 0</span>
      <svg class="mob-storey-pill__chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    `;
    headerBrand.appendChild(storeyPill);
  }

  let menuTrigger = document.getElementById("mob-btn-menu") as HTMLButtonElement | null;
  if (headerControls && !menuTrigger) {
    menuTrigger = document.createElement("button");
    menuTrigger.type = "button";
    menuTrigger.id = "mob-btn-menu";
    menuTrigger.className = "mob-header-btn bk-mobile-only";
    menuTrigger.title = "Quick Menu, Themes & Views";
    menuTrigger.setAttribute("aria-label", "Open Mobile Quick Menu");
    menuTrigger.setAttribute("aria-expanded", "false");
    menuTrigger.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`;
    headerControls.appendChild(menuTrigger);
  }

  // ─── 2. Backdrop for Mobile Sheets ───
  let mobBackdrop = document.getElementById("mob-sheet-backdrop");
  if (!mobBackdrop) {
    mobBackdrop = document.createElement("div");
    mobBackdrop.id = "mob-sheet-backdrop";
    mobBackdrop.className = "mob-sheet-backdrop bk-mobile-only";
    uiLayer.appendChild(mobBackdrop);
  }

  // ─── 3. Right-Edge Thumb Camera Rail + Quick Views Popover ───
  let camRail = document.getElementById("mob-camera-rail");
  if (!camRail) {
    camRail = document.createElement("div");
    camRail.id = "mob-camera-rail";
    camRail.className = "mob-camera-rail bk-mobile-only";
    camRail.setAttribute("role", "toolbar");
    camRail.setAttribute("aria-label", "Quick 3D Camera Controls");
    camRail.innerHTML = `
      <div class="mob-cam-popover" id="mob-cam-popover" role="group" aria-label="Camera Presets">
        <button type="button" class="mob-cam-chip" data-click-target="btn-view-top" title="Top Floor Plan">Top</button>
        <button type="button" class="mob-cam-chip" data-click-target="btn-view-iso" title="Isometric 3D">Iso</button>
        <button type="button" class="mob-cam-chip" data-click-target="btn-quick-explode" title="Exploded View">Explode</button>
        <button type="button" class="mob-cam-chip" data-click-target="btn-toggle-ground-grid" title="Toggle Grid">Grid</button>
        <button type="button" class="mob-cam-chip" id="mob-cam-radar-chip" title="Toggle 2D Floor Radar">Radar</button>
      </div>
      <button type="button" class="mob-rail-btn" id="mob-cam-fit" data-click-target="btn-view-fit" title="Fit Model to View" aria-label="Fit View">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </button>
      <button type="button" class="mob-rail-btn" id="mob-cam-views" title="Camera Views & Overlays" aria-label="Camera Views" aria-expanded="false">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      </button>
      <button type="button" class="mob-rail-btn" id="mob-cam-section" data-click-target="btn-section-cut" title="Section Cut" aria-label="Toggle Section Cut">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
      </button>
    `;
    uiLayer.appendChild(camRail);
  }

  // ─── 4. Unified 5-Tab Bottom Navigation Bar ───
  let mobDock = document.getElementById("mob-dock");
  if (!mobDock) {
    mobDock = document.createElement("nav");
    mobDock.id = "mob-dock";
    mobDock.className = "mob-dock bk-mobile-only";
    mobDock.setAttribute("role", "tablist");
    mobDock.setAttribute("aria-label", "Mobile BIM Navigation");
    mobDock.innerHTML = `
      <button type="button" class="mob-dock__tab" id="mob-tab-model" data-mob-nav="model" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span class="mob-dock__label">Model</span>
      </button>
      <button type="button" class="mob-dock__tab" id="mob-tab-inspect" data-mob-nav="inspect" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          <span class="mob-dock__dot" id="mob-inspect-dot" aria-hidden="true"></span>
        </span>
        <span class="mob-dock__label">Inspect</span>
      </button>
      <button type="button" class="mob-dock__tab" id="mob-tab-tools" data-mob-nav="tools" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.3 8.7 8.7 21.3a2.12 2.12 0 0 1-3 0l-4.4-4.4a2.12 2.12 0 0 1 0-3L14 1.3a2.12 2.12 0 0 1 3 0l4.3 4.4a2.12 2.12 0 0 1 0 3Z"/><line x1="14.5" y1="4.5" x2="16.5" y2="6.5"/><line x1="11" y1="8" x2="13" y2="10"/></svg>
        </span>
        <span class="mob-dock__label">Tools</span>
      </button>
      <button type="button" class="mob-dock__tab" id="mob-tab-4d" data-mob-nav="4d" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
        </span>
        <span class="mob-dock__label">4D</span>
      </button>
      <button type="button" class="mob-dock__tab" id="mob-tab-suites" data-mob-nav="suites" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </span>
        <span class="mob-dock__label">Suites</span>
      </button>
    `;
    uiLayer.appendChild(mobDock);
  }

  // ─── 5. Sheet Dismissal & Single-Active-Sheet Coordination ───
  const closeCameraPopover = () => {
    cameraPopoverOpen = false;
    document.getElementById("mob-cam-popover")?.classList.remove("is-open");
    document.getElementById("mob-cam-views")?.setAttribute("aria-expanded", "false");
  };

  const setRadarOpen = (next: boolean) => {
    radarOpen = next;
    document.body.classList.toggle("mob-radar-open", radarOpen);
    const minimap = document.getElementById("minimap-container");
    if (minimap) {
      minimap.classList.toggle("expanded", radarOpen);
    }
    document.getElementById("mob-cam-radar-chip")?.classList.toggle("is-active", radarOpen);
    document.getElementById("mob-storey-radar-btn")?.classList.toggle("is-active", radarOpen);
  };

  const closeOwnSheets = () => {
    openSheetId = null;
    sheets.forEach((s) => {
      s.classList.remove("is-open", "is-expanded");
    });
    mobBackdrop?.classList.remove("is-active");
    storeyPill?.setAttribute("aria-expanded", "false");
    menuTrigger?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mob-sheet-active");
  };

  const closeAllPanelsAndSheets = () => {
    closeOwnSheets();
    closeCameraPopover();
    leftSidebar?.classList.remove("open", "is-mob-expanded");
    rightSidebar?.classList.remove("open", "is-mob-expanded");
    document.getElementById("sidebar-backdrop")?.classList.remove("active");
    document.getElementById("menu-saved-views")?.classList.add("hidden");
    if (typeof (window as any).closeAllEnterpriseDrawers === "function") {
      (window as any).closeAllEnterpriseDrawers();
    }
    syncState();
  };

  const openSheet = (id: MobileSheetId) => {
    const alreadyOpen = openSheetId === id;
    closeAllPanelsAndSheets();
    if (alreadyOpen) {
      syncState();
      return;
    }

    if (id === "storey") refreshStoreySheet();
    if (id === "menu") refreshMenuSheet();

    const target = sheets.get(id);
    if (!target) return;
    openSheetId = id;
    target.classList.add("is-open");
    mobBackdrop?.classList.add("is-active");
    document.body.classList.add("mob-sheet-active");
    if (id === "storey") storeyPill?.setAttribute("aria-expanded", "true");
    if (id === "menu") menuTrigger?.setAttribute("aria-expanded", "true");
    syncState();
  };

  // Inject mobile handle/expand/close chrome into existing left & right sidebars
  injectSidebarMobileChrome(leftSidebar, "Model & Project", closeAllPanelsAndSheets);
  injectSidebarMobileChrome(rightSidebar, "Inspector & Scene", closeAllPanelsAndSheets);

  // ─── 6. Build the 4 Purpose-Built Mobile Sheets ───
  const toolsBodyHtml = `
    <div class="mob-section-label">Field Actions</div>
    <div class="mob-tile-grid">
      ${FIELD_PRIMARY_TOOLS.map(
        (t) => `
        <button type="button" class="mob-tool-tile" id="${t.id}" data-click-target="${t.targetId}">
          <span class="mob-tool-tile__icon">${t.icon}</span>
          <span class="mob-tool-tile__text">
            <span class="mob-tool-tile__title">${t.label}</span>
            <span class="mob-tool-tile__sub">${t.subtitle || ""}</span>
          </span>
        </button>`
      ).join("")}
    </div>
    <div class="mob-section-label">Selection &amp; Visibility</div>
    <div class="mob-chip-wrap">
      ${FIELD_SELECTION_CHIPS.map(
        (c) => `
        <button type="button" class="mob-action-chip" id="${c.id}" data-click-target="${c.targetId}">
          ${c.icon}
          <span>${c.label}</span>
        </button>`
      ).join("")}
    </div>
    <div class="mob-section-label">Files &amp; Export</div>
    <div class="mob-chip-wrap">
      ${FIELD_FILE_CHIPS.map(
        (c) => `
        <button type="button" class="mob-action-chip" id="${c.id}" data-click-target="${c.targetId}">
          ${c.icon}
          <span>${c.label}</span>
        </button>`
      ).join("")}
    </div>
  `;
  const toolsSheet = createSheetShell("tools", "Field Tools", "Measure, section, select & files", toolsBodyHtml, closeAllPanelsAndSheets);
  sheets.set("tools", toolsSheet);
  uiLayer.appendChild(toolsSheet);

  const suitesBodyHtml = `
    <div class="mob-section-label">Coordination &amp; AI</div>
    <div class="mob-suite-grid">
      ${SUITE_COORDINATION.map(
        (s) => `
        <button type="button" class="mob-suite-card" id="${s.id}" data-click-target="${s.targetId}">
          <span class="mob-suite-card__icon">${s.icon}</span>
          <span class="mob-suite-card__meta">
            <span class="mob-suite-card__title">${s.label}</span>
            <span class="mob-suite-card__sub">${s.subtitle || ""}</span>
          </span>
        </button>`
      ).join("")}
    </div>
    <div class="mob-section-label">5D · 6D · GIS &amp; Engineering</div>
    <div class="mob-suite-grid">
      ${SUITE_ANALYTICS.map(
        (s) => `
        <button type="button" class="mob-suite-card" id="${s.id}" data-click-target="${s.targetId}">
          <span class="mob-suite-card__icon">${s.icon}</span>
          <span class="mob-suite-card__meta">
            <span class="mob-suite-card__title">${s.label}</span>
            <span class="mob-suite-card__sub">${s.subtitle || ""}</span>
          </span>
        </button>`
      ).join("")}
    </div>
  `;
  const suitesSheet = createSheetShell("suites", "BIM Suites", "Enterprise modules & analysis", suitesBodyHtml, closeAllPanelsAndSheets);
  sheets.set("suites", suitesSheet);
  uiLayer.appendChild(suitesSheet);

  const storeyBodyHtml = `
    <div class="mob-section-label">Active Building Levels</div>
    <div class="mob-storey-list" id="mob-storey-list"></div>
    <div class="mob-section-label">Floor Overlays</div>
    <div class="mob-tile-grid">
      <button type="button" class="mob-tool-tile" id="mob-storey-slice-btn" data-click-target="btn-toggle-storey-slice">
        <span class="mob-tool-tile__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 7 12 3 16 7"/><polyline points="8 17 12 21 16 17"/></svg>
        </span>
        <span class="mob-tool-tile__text">
          <span class="mob-tool-tile__title">Slice Floor</span>
          <span class="mob-tool-tile__sub">Ghost ceiling above</span>
        </span>
      </button>
      <button type="button" class="mob-tool-tile" id="mob-storey-radar-btn">
        <span class="mob-tool-tile__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        </span>
        <span class="mob-tool-tile__text">
          <span class="mob-tool-tile__title">2D Floor Radar</span>
          <span class="mob-tool-tile__sub">Show/hide minimap</span>
        </span>
      </button>
    </div>
  `;
  const storeySheet = createSheetShell("storey", "Storeys & Levels", "Jump to floor or slice ceilings", storeyBodyHtml, closeAllPanelsAndSheets);
  sheets.set("storey", storeySheet);
  uiLayer.appendChild(storeySheet);

  const menuBodyHtml = `
    <div class="mob-section-label">Appearance Theme</div>
    <div class="mob-theme-pills" id="mob-theme-pills">
      ${THEME_PRESETS.map(
        (t) => `<button type="button" class="mob-pill-choice" data-mob-theme="${t.value}">${t.label}</button>`
      ).join("")}
    </div>
    <div class="mob-section-label">Workspace Role</div>
    <div class="mob-persona-pills" id="mob-persona-pills"></div>
    <div class="mob-section-label">Views &amp; Camera</div>
    <div class="mob-menu-list">
      <button type="button" class="mob-menu-row" data-click-target="btn-ribbon-saved-views" data-keep-open="saved-views">
        <span>Saved Views &amp; Bookmarks</span>
        <span class="bk-badge bk-badge--accent" id="mob-menu-views-badge">4</span>
      </button>
      <button type="button" class="mob-menu-row" data-click-target="btn-drone-orbit">
        <span>Drone 360° Orbit</span>
        <span class="mob-menu-row__hint">Camera</span>
      </button>
      <button type="button" class="mob-menu-row" data-click-target="btn-play-tour">
        <span>Walkthrough Tour</span>
        <span class="mob-menu-row__hint">Play</span>
      </button>
      <button type="button" class="mob-menu-row" data-click-target="btn-view-snapshot">
        <span>Export 4K Technical Sheet</span>
        <span class="mob-menu-row__hint">PNG</span>
      </button>
      <button type="button" class="mob-menu-row" id="mob-menu-help-btn">
        <span>Help &amp; Shortcuts Guide</span>
        <span class="mob-menu-row__hint">?</span>
      </button>
    </div>
  `;
  const menuSheet = createSheetShell("menu", "Workspace & Views", "Theme, persona, camera & guide", menuBodyHtml, closeAllPanelsAndSheets);
  sheets.set("menu", menuSheet);
  uiLayer.appendChild(menuSheet);

  // ─── 7. Dynamic Sheet Sync Helpers ───
  function refreshStoreySheet(): void {
    const list = document.getElementById("mob-storey-list");
    const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
    if (!list) return;

    const options = select ? Array.from(select.options) : [];
    if (options.length === 0) {
      list.innerHTML = `<div class="mob-empty-hint">Load an IFC model to list building storeys.</div>`;
      return;
    }

    list.innerHTML = options
      .map((opt) => {
        const isSelected = select?.value === opt.value;
        return `<button type="button" class="mob-storey-btn${isSelected ? " is-active" : ""}" data-level-val="${opt.value}">
          <span>${opt.textContent?.trim() || opt.value}</span>
          ${isSelected ? `<span class="bk-badge bk-badge--accent">Active</span>` : ""}
        </button>`;
      })
      .join("");
  }

  function refreshMenuSheet(): void {
    const themeSelect = document.getElementById("select-theme-toggle") as HTMLSelectElement | null;
    const currentTheme = themeSelect?.value || document.documentElement.getAttribute("data-theme") || "obsidian";
    document.querySelectorAll<HTMLButtonElement>("#mob-theme-pills .mob-pill-choice").forEach((btn) => {
      const val = btn.getAttribute("data-mob-theme");
      const active =
        val === currentTheme ||
        (val === "light" && currentTheme === "light-studio") ||
        (val === "obsidian" && currentTheme === "dark");
      btn.classList.toggle("is-active", active);
    });

    const personaSelect = document.getElementById("workspace-persona-select") as HTMLSelectElement | null;
    const personaWrap = document.getElementById("mob-persona-pills");
    if (personaSelect && personaWrap) {
      personaWrap.innerHTML = Array.from(personaSelect.options)
        .map((opt) => {
          const active = personaSelect.value === opt.value;
          return `<button type="button" class="mob-pill-choice${active ? " is-active" : ""}" data-mob-persona="${opt.value}">${opt.textContent?.trim() || opt.value}</button>`;
        })
        .join("");
    }

    const viewsBadge = document.getElementById("saved-views-count-badge")?.textContent?.trim();
    const menuBadge = document.getElementById("mob-menu-views-badge");
    if (menuBadge && viewsBadge) menuBadge.textContent = viewsBadge;
  }

  function syncStoreyLabel(): void {
    const labelEl = document.getElementById("mob-storey-pill-label");
    if (!labelEl) return;
    const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
    const selectedOpt = select?.selectedOptions?.[0]?.textContent?.trim();
    const crumbStorey = document.getElementById("breadcrumb-storey")?.textContent?.trim();
    labelEl.textContent = crumbStorey || selectedOpt || "Model";
  }

  function syncState(): void {
    syncStoreyLabel();

    const is4D = document.body.classList.contains("mode-4d");
    const isLeftOpen = Boolean(leftSidebar?.classList.contains("open"));
    const isRightOpen = Boolean(rightSidebar?.classList.contains("open"));
    const hasOpenDrawer = Array.from(document.querySelectorAll<HTMLElement>(".enterprise-drawer")).some(
      (d) => !d.classList.contains("hidden") && d.style.display !== "none"
    );

    const anyPanelOpen = Boolean(openSheetId || isLeftOpen || isRightOpen || hasOpenDrawer);
    document.body.classList.toggle("mob-panel-open", anyPanelOpen);

    // Sync bottom 5-tab active indicator
    const setTabActive = (nav: string, active: boolean) => {
      const btn = mobDock?.querySelector<HTMLButtonElement>(`[data-mob-nav="${nav}"]`);
      if (!btn) return;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    };

    setTabActive("model", isLeftOpen);
    setTabActive("inspect", isRightOpen);
    setTabActive("tools", openSheetId === "tools");
    setTabActive("4d", is4D);
    setTabActive("suites", openSheetId === "suites" || hasOpenDrawer);

    // Mirror active tool states from desktop buttons into mobile tiles & rail
    const mirrorActive = (mobId: string, srcId: string) => {
      const src = document.getElementById(srcId);
      const dst = document.getElementById(mobId);
      if (!src || !dst) return;
      dst.classList.toggle("is-active", src.classList.contains("active"));
    };

    mirrorActive("mob-cam-section", "btn-section-cut");
    mirrorActive("mob-tool-section", "btn-section-cut");
    mirrorActive("mob-tool-measure", "btn-dock-measure");
    mirrorActive("mob-tool-box", "btn-box-select");
    mirrorActive("mob-chip-grid", "btn-dock-toggle-grid");
    mirrorActive("mob-storey-slice-btn", "btn-toggle-storey-slice");

    // Highlight Inspect dot & lift right-edge camera rail when an element is selected
    const selBar = document.getElementById("viewport-selection-bar");
    const hasSelection = Boolean(selBar && getComputedStyle(selBar).display !== "none");
    document.getElementById("mob-inspect-dot")?.classList.toggle("is-visible", hasSelection);
    document.body.classList.toggle("mob-selection-active", hasSelection);
  }

  // ─── 8. Wire Event Listeners ───
  storeyPill?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openSheet("storey");
  });

  menuTrigger?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openSheet("menu");
  });

  mobBackdrop?.addEventListener("click", closeAllPanelsAndSheets);

  // Right-edge camera rail views toggle
  document.getElementById("mob-cam-views")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    cameraPopoverOpen = !cameraPopoverOpen;
    document.getElementById("mob-cam-popover")?.classList.toggle("is-open", cameraPopoverOpen);
    document.getElementById("mob-cam-views")?.setAttribute("aria-expanded", String(cameraPopoverOpen));
  });

  document.getElementById("mob-cam-radar-chip")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    setRadarOpen(!radarOpen);
    closeCameraPopover();
  });

  document.getElementById("mob-storey-radar-btn")?.addEventListener("click", () => {
    setRadarOpen(!radarOpen);
    closeOwnSheets();
    syncState();
  });

  // 5-Tab Bottom Navigation handlers
  mobDock.addEventListener("click", (ev) => {
    const tabBtn = (ev.target as Element).closest<HTMLButtonElement>("[data-mob-nav]");
    if (!tabBtn) return;
    const nav = tabBtn.getAttribute("data-mob-nav");
    closeCameraPopover();

    if (nav === "model") {
      const wasOpen = leftSidebar?.classList.contains("open");
      closeAllPanelsAndSheets();
      if (!wasOpen) {
        const activeTab =
          document.querySelector<HTMLElement>("#left-tab-bar .sidebar-tab-btn.active")?.getAttribute("data-tab") ||
          "files";
        (window as any).switchSidebarTab?.("left-tab-bar", activeTab);
        // Ensure open even if switchSidebarTab toggled off same active tab
        if (!leftSidebar?.classList.contains("open")) {
          (window as any).switchSidebarTab?.("left-tab-bar", "files");
        }
      }
      syncState();
    } else if (nav === "inspect") {
      const wasOpen = rightSidebar?.classList.contains("open");
      closeAllPanelsAndSheets();
      if (!wasOpen) {
        const selBar = document.getElementById("viewport-selection-bar");
        const hasSelection = Boolean(selBar && selBar.style.display !== "none");
        const desiredTab = hasSelection ? "metadata" : "scene";
        (window as any).switchSidebarTab?.("right-tab-bar", desiredTab);
        if (!rightSidebar?.classList.contains("open")) {
          (window as any).switchSidebarTab?.("right-tab-bar", desiredTab);
        }
      }
      syncState();
    } else if (nav === "tools") {
      openSheet("tools");
    } else if (nav === "4d") {
      closeAllPanelsAndSheets();
      const is4D = document.body.classList.contains("mode-4d");
      if (typeof (window as any).toggle4DMode === "function") {
        (window as any).toggle4DMode(!is4D);
      } else {
        document.getElementById("btn-dock-gantt")?.click();
      }
      setTimeout(syncState, 60);
    } else if (nav === "suites") {
      openSheet("suites");
    }
  });

  // Delegated click handler for all `[data-click-target]` buttons inside sheets & camera rail
  const handleDelegatedClick = (ev: Event) => {
    const btn = (ev.target as Element).closest<HTMLElement>("[data-click-target]");
    if (!btn) return;
    const targetId = btn.getAttribute("data-click-target");
    if (!targetId) return;
    const keepOpen = btn.getAttribute("data-keep-open");
    closeCameraPopover();
    closeOwnSheets();
    document.getElementById(targetId)?.click();
    if (keepOpen === "saved-views") {
      // Saved views flyout handles its own visibility
    }
    setTimeout(syncState, 50);
  };

  camRail.addEventListener("click", handleDelegatedClick);
  toolsSheet.addEventListener("click", handleDelegatedClick);
  suitesSheet.addEventListener("click", handleDelegatedClick);
  storeySheet.addEventListener("click", handleDelegatedClick);
  menuSheet.addEventListener("click", handleDelegatedClick);

  // Storey picker click inside Storey Sheet
  storeySheet.addEventListener("click", (ev) => {
    const btn = (ev.target as Element).closest<HTMLButtonElement>(".mob-storey-btn");
    if (!btn) return;
    const val = btn.getAttribute("data-level-val");
    const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
    if (select && val !== null) {
      select.value = val;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    closeOwnSheets();
    syncState();
  });

  // Theme & Persona pill clicks inside Quick Menu Sheet
  menuSheet.addEventListener("click", (ev) => {
    const themeBtn = (ev.target as Element).closest<HTMLButtonElement>("[data-mob-theme]");
    if (themeBtn) {
      const val = themeBtn.getAttribute("data-mob-theme");
      const themeSelect = document.getElementById("select-theme-toggle") as HTMLSelectElement | null;
      if (themeSelect && val) {
        themeSelect.value = val;
        themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      refreshMenuSheet();
      return;
    }

    const personaBtn = (ev.target as Element).closest<HTMLButtonElement>("[data-mob-persona]");
    if (personaBtn) {
      const val = personaBtn.getAttribute("data-mob-persona");
      const personaSelect = document.getElementById("workspace-persona-select") as HTMLSelectElement | null;
      if (personaSelect && val) {
        personaSelect.value = val;
        personaSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      refreshMenuSheet();
      return;
    }

    const helpBtn = (ev.target as Element).closest("#mob-menu-help-btn");
    if (helpBtn) {
      closeAllPanelsAndSheets();
      if (typeof (window as any).toggleShortcutsModal === "function") {
        (window as any).toggleShortcutsModal(true);
      } else {
        document.getElementById("btn-shortcuts-toggle")?.click();
      }
    }
  });

  // Close mobile popover when tapping canvas/outside
  document.addEventListener("pointerdown", (ev) => {
    if (cameraPopoverOpen && camRail && !camRail.contains(ev.target as Node)) {
      closeCameraPopover();
    }
  });

  // Close mobile sheets on Escape
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && (openSheetId || cameraPopoverOpen)) {
      closeOwnSheets();
      closeCameraPopover();
      syncState();
    }
  });

  // Reset mobile-only overlays if viewport resizes to tablet/desktop
  window.matchMedia(MOBILE_MEDIA_QUERY).addEventListener("change", (e) => {
    if (!e.matches) {
      closeOwnSheets();
      closeCameraPopover();
      setRadarOpen(false);
    }
    syncState();
  });

  // Keep mobile UI state reactively synced with body classes, sidebars, drawers, and storey changes
  const observer = new MutationObserver(() => {
    if (isMobileViewport()) syncState();
  });

  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if (leftSidebar) observer.observe(leftSidebar, { attributes: true, attributeFilter: ["class"] });
  if (rightSidebar) observer.observe(rightSidebar, { attributes: true, attributeFilter: ["class"] });

  const breadcrumbStorey = document.getElementById("breadcrumb-storey");
  if (breadcrumbStorey) {
    observer.observe(breadcrumbStorey, { childList: true, characterData: true, subtree: true });
  }
  const minimapSelect = document.getElementById("minimap-level-select");
  if (minimapSelect) {
    observer.observe(minimapSelect, { childList: true, subtree: true });
    minimapSelect.addEventListener("change", syncState);
  }
  const selBar = document.getElementById("viewport-selection-bar");
  if (selBar) {
    observer.observe(selBar, { attributes: true, attributeFilter: ["style", "class"] });
  }

  // Sync whenever enterprise drawers open/close
  document.querySelectorAll(".enterprise-drawer").forEach((drawer) => {
    observer.observe(drawer, { attributes: true, attributeFilter: ["class", "style"] });
  });

  syncState();

  activeController = {
    openSheet,
    closeAllSheets: closeAllPanelsAndSheets,
    syncState,
    isMobileViewport,
  };
  (window as any).__mobileWorkspace = activeController;
  return activeController;
}

export function resetMobileWorkspaceForTest(): void {
  activeController = null;
}
