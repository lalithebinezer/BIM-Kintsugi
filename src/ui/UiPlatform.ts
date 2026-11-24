/**
 * UiPlatform — Global Production-Ready UI Component Engine & Window Manager
 *
 * Enforces uniform sizing, elevation z-index focus stacking, collision-free
 * floating window placement, keyboard Escape dismissal, viewport clamping,
 * and standardized factories for Buttons, Selects, Dropdowns, Floating Windows,
 * and Modals across the entire BIM Kintsugi platform.
 */

export type BkControlSize = "xs" | "sm" | "md" | "lg";
export type BkButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type BkWindowSize = "sm" | "md" | "lg" | "xl";
export type BkWindowSlot = "auto" | "left" | "right" | "center";

export interface BkWindowSizeSpec {
  width: number;
  minWidth: number;
  maxWidth: number;
  height: number;
  minHeight: number;
  maxHeight: number;
}

/** Canonical Floating Window size presets — single source of truth across all modules. */
export const UI_WINDOW_SIZES: Record<BkWindowSize, BkWindowSizeSpec> = {
  sm: { width: 284, minWidth: 240, maxWidth: 420, height: 340, minHeight: 160, maxHeight: 540 },
  md: { width: 440, minWidth: 300, maxWidth: 680, height: 300, minHeight: 170, maxHeight: 560 },
  lg: { width: 640, minWidth: 300, maxWidth: 1120, height: 244, minHeight: 180, maxHeight: 560 },
  xl: { width: 820, minWidth: 320, maxWidth: 1280, height: 460, minHeight: 220, maxHeight: 720 },
};

/** Canonical Z-Index elevation tiers matching `--bk-z-*` in ui-primitives.css. */
export const UI_Z_LAYERS = {
  canvas: 1,
  hud: 100,
  sidebar: 400,
  dock: 500,
  floatingBase: 880,
  floatingMax: 940,
  dropdown: 10020,
  modal: 10060,
  command: 100000,
  toast: 100020,
} as const;

export interface BkFloatingGeometry {
  left: number;
  top: number;
  width: number;
  height: number;
  collapsed: boolean;
}

export interface BkFloatingWindowOptions {
  id: string;
  title: string;
  size: BkWindowSize;
  preferredSlot?: BkWindowSlot;
  extraClass?: string;
  ariaLabel?: string;
  resizable?: boolean;
  collapsible?: boolean;
  showResetButton?: boolean;
  /** "collapse" folds into a compact header bar; "pill" hides into a floating reopen chip; "close" simply hides/removes. */
  minimizeMode?: "collapse" | "pill" | "close";
  pillLabel?: string;
  pillId?: string;
  closeButtonId?: string;
  resizeHandleId?: string;
  persistKey?: string;
  autoHeight?: boolean;
  headerBadgeHtml?: string;
  headerActionsHtml?: string;
  bodyHtml?: string;
  footerHtml?: string;
  onClose?: () => void;
  onResize?: (geom: BkFloatingGeometry) => void;
  onFocus?: () => void;
}

/**
 * Global singleton registry coordinating z-index focus stacking, collision-free
 * spawn positions, and viewport resize clamping for every floating window.
 */
export class FloatingWindowManager {
  private static instance: FloatingWindowManager | null = null;
  private windows = new Map<string, BkFloatingWindow>();
  private topZ: number = UI_Z_LAYERS.floatingBase;
  private resizeBound = false;

  public static getInstance(): FloatingWindowManager {
    if (!this.instance) this.instance = new FloatingWindowManager();
    return this.instance;
  }

  public register(win: BkFloatingWindow): void {
    this.windows.set(win.id, win);
    this.ensureResizeListener();
    this.bringToFront(win.id);
  }

  public unregister(id: string): void {
    this.windows.delete(id);
  }

  public getOpenWindows(excludeId?: string): BkFloatingWindow[] {
    const open: BkFloatingWindow[] = [];
    for (const win of this.windows.values()) {
      if (win.id !== excludeId && win.isOpen()) open.push(win);
    }
    return open;
  }

  public bringToFront(id: string): number {
    const win = this.windows.get(id);
    if (!win) return this.topZ;
    this.topZ++;
    if (this.topZ > UI_Z_LAYERS.floatingMax) {
      // Compact all registered window z-indices back down cleanly
      const sorted = Array.from(this.windows.values()).sort((a, b) => a.getZIndex() - b.getZIndex());
      this.topZ = UI_Z_LAYERS.floatingBase;
      for (const w of sorted) {
        w.setZIndex(++this.topZ);
      }
      this.topZ++;
    }
    win.setZIndex(this.topZ);
    return this.topZ;
  }

  public clampAll(): void {
    for (const win of this.windows.values()) {
      if (win.isOpen()) win.clampToViewport();
    }
  }

  /**
   * Computes a collision-free initial rectangle respecting live HUD landmarks
   * (header, quick-views, ViewCube, bottom dock, minimap) AND sibling open windows.
   */
  public computeSafeInitialGeometry(
    size: BkWindowSize,
    preferredSlot: BkWindowSlot = "auto",
    excludeId?: string
  ): BkFloatingGeometry {
    const spec = UI_WINDOW_SIZES[size];
    const vw = typeof window !== "undefined" && window.innerWidth > 0 ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" && window.innerHeight > 0 ? window.innerHeight : 800;
    const safeMinW = Math.min(spec.minWidth, Math.max(240, vw - 16));

    let headerBottom = 56;
    let topLeftBottom = 118;
    let viewCubeBottom = 126;
    let bottomDockTop = vh - 96;
    let minimapLeft = vw - 12;
    let minimapTop = vh - 96;
    let leftSidebarRight = 0;

    if (typeof document !== "undefined") {
      const hdr = document.querySelector("header")?.getBoundingClientRect();
      if (hdr && hdr.height > 0) headerBottom = Math.ceil(hdr.bottom);

      const topLeft = document.querySelector(".hud-anchor-top-left")?.getBoundingClientRect();
      if (topLeft && topLeft.height > 0 && topLeft.bottom < vh * 0.45) {
        topLeftBottom = Math.ceil(topLeft.bottom);
      }

      const viewCube = document.querySelector(".view-cube-layer")?.getBoundingClientRect();
      if (viewCube && viewCube.height > 0 && viewCube.bottom < vh * 0.45) {
        viewCubeBottom = Math.ceil(viewCube.bottom);
      }

      const timeline = document.querySelector<HTMLElement>(".timeline-panel");
      const dock = document.querySelector<HTMLElement>("#bottom-toolbar");
      const activeDock =
        timeline && getComputedStyle(timeline).display !== "none" ? timeline : dock;
      const dockRect = activeDock?.getBoundingClientRect();
      if (dockRect && dockRect.height > 0 && dockRect.top > headerBottom + 80) {
        bottomDockTop = Math.floor(dockRect.top);
      }

      const minimap = document.querySelector<HTMLElement>(".hud-anchor-bottom-right");
      if (minimap && getComputedStyle(minimap).display !== "none") {
        const mr = minimap.getBoundingClientRect();
        if (mr.width > 0 && mr.top > vh * 0.35) {
          minimapLeft = Math.floor(mr.left);
          minimapTop = Math.floor(mr.top);
        }
      }

      const leftSidebar = document.querySelector<HTMLElement>(".left-sidebar");
      const leftCollapsed = document.body.classList.contains("left-sidebar-collapsed");
      if (leftSidebar && (!leftCollapsed || leftSidebar.classList.contains("open"))) {
        const lr = leftSidebar.getBoundingClientRect();
        if (lr.width > 0 && lr.width < vw * 0.6) {
          leftSidebarRight = Math.ceil(lr.width) + 20;
        }
      }
    }

    const topClear = Math.max(headerBottom + 10, topLeftBottom + 10, viewCubeBottom + 10);
    const availH = Math.max(140, bottomDockTop - topClear - 12);
    const height = Math.round(
      vh <= 480
        ? Math.max(136, Math.min(spec.height, bottomDockTop - headerBottom - 16))
        : Math.max(Math.min(spec.minHeight, availH), Math.min(spec.height, availH))
    );

    const maxFitW =
      vw >= 1024 && preferredSlot === "center"
        ? Math.min(spec.width, Math.max(safeMinW, minimapLeft - Math.max(316, leftSidebarRight + 24)))
        : spec.width;
    const width = Math.round(Math.max(safeMinW, Math.min(maxFitW, vw - 16)));

    let left = Math.max(8, Math.round((vw - width) / 2));
    let top =
      vh <= 480
        ? Math.max(headerBottom + 6, Math.min(topClear, bottomDockTop - height - 8))
        : Math.max(topClear, Math.min(bottomDockTop - height - 12, Math.round(topClear + (availH - height) / 2)));

    if (preferredSlot === "left" && vw >= 960) {
      left = Math.max(16, leftSidebarRight + 12);
      top = Math.max(headerBottom + 10, topLeftBottom + 10);
    } else if (preferredSlot === "right" || (preferredSlot === "left" && vw < 960)) {
      left = Math.max(8, vw - width - 12);
      top =
        vh <= 480
          ? headerBottom + 6
          : Math.min(Math.max(headerBottom + 10, viewCubeBottom + 10), Math.max(headerBottom + 10, bottomDockTop - height - 10));
    } else if (vw >= 1024) {
      // Center slot: stay clear of left Crane HUD track & right Minimap
      if (left < 304 && minimapLeft - width - 12 >= 304) {
        left = Math.min(308, minimapLeft - width - 12);
      } else if (left + width > minimapLeft - 10) {
        left = Math.max(8, minimapLeft - width - 12);
      }
    }

    // Sibling floating window collision avoidance on wide screens
    const siblings = this.getOpenWindows(excludeId);
    if (vw >= 960 && siblings.length > 0) {
      for (const sib of siblings) {
        const sr = sib.getRect();
        if (!sr) continue;
        const ox = Math.min(left + width, sr.right) - Math.max(left, sr.left);
        const oy = Math.min(top + height, sr.bottom) - Math.max(top, sr.top);
        if (ox > 8 && oy > 8) {
          if (vw - sr.right >= width + 24) {
            left = Math.ceil(sr.right) + 12;
            const rightTop = Math.max(headerBottom + 10, viewCubeBottom + 10);
            if (rightTop + height <= Math.min(minimapTop, bottomDockTop) - 8) {
              top = rightTop;
            }
          } else if (sr.left >= width + 24) {
            left = Math.max(16, Math.floor(sr.left) - width - 12);
          } else if (sr.top - topClear >= spec.minHeight + 10) {
            top = topClear;
          }
        }
      }
    }

    return {
      left: Math.round(Math.max(8, Math.min(Math.max(8, vw - width - 8), left))),
      top: Math.round(Math.max(54, Math.min(Math.max(54, vh - height - 10), top))),
      width,
      height,
      collapsed: false,
    };
  }

  private ensureResizeListener(): void {
    if (this.resizeBound || typeof window === "undefined") return;
    this.resizeBound = true;
    window.addEventListener("resize", () => this.clampAll());
  }
}

/**
 * Standard Draggable, Resizable, Collapsible & Viewport-Clamped Floating Window.
 */
export class BkFloatingWindow {
  public readonly id: string;
  public readonly el: HTMLDivElement;
  public readonly headerEl: HTMLDivElement;
  public readonly bodyEl: HTMLDivElement;
  public readonly footerEl: HTMLDivElement | null;
  private readonly opts: BkFloatingWindowOptions;
  private readonly spec: BkWindowSizeSpec;
  private pillEl: HTMLButtonElement | null = null;
  private geometry: BkFloatingGeometry;
  private zIndex: number = UI_Z_LAYERS.floatingBase;

  constructor(options: BkFloatingWindowOptions) {
    this.id = options.id;
    this.opts = options;
    this.spec = UI_WINDOW_SIZES[options.size];

    // Remove stale duplicate DOM with same id
    document.getElementById(options.id)?.remove();
    document.getElementById(options.pillId || `${options.id}-reopen-pill`)?.remove();

    this.geometry = this.loadPersistedOrDefault();

    const win = document.createElement("div");
    win.id = options.id;
    win.className = `bk-window bk-window--${options.size} ${options.extraClass || ""} hidden`.trim();
    win.setAttribute("role", "dialog");
    win.setAttribute("aria-label", options.ariaLabel || options.title);

    const resetBtn = options.showResetButton
      ? `<button type="button" class="bk-btn bk-btn--ghost bk-btn--xs bk-btn--icon bk-win-reset" title="Reset Floating Position &amp; Size">⌖</button>`
      : "";
    const collapseBtn =
      options.collapsible !== false && options.minimizeMode !== "pill"
        ? `<button type="button" class="bk-btn bk-btn--ghost bk-btn--xs bk-btn--icon bk-win-collapse" title="Minimize to Floating Bar">—</button>`
        : "";
    const closeIdAttr = options.closeButtonId ? `id="${options.closeButtonId}"` : "";
    const resizeIdAttr = options.resizeHandleId ? `id="${options.resizeHandleId}"` : "";

    win.innerHTML = `
      <div class="bk-window__header" title="Drag to move floating window">
        <div class="bk-window__title-group">
          <span class="bk-window__grip" aria-hidden="true">⋮⋮</span>
          <span class="bk-window__title">${options.title}</span>
          ${options.headerBadgeHtml || ""}
        </div>
        <div class="bk-window__actions">
          ${options.headerActionsHtml || ""}
          ${resetBtn}
          ${collapseBtn}
          <button type="button" ${closeIdAttr} class="bk-btn bk-btn--ghost bk-btn--xs bk-btn--icon bk-win-close" title="${
            options.minimizeMode === "pill" ? "Minimize to Floating Pill" : "Close Window"
          }">✕</button>
        </div>
      </div>
      <div class="bk-window__body thin-scrollbar">${options.bodyHtml || ""}</div>
      ${options.footerHtml !== undefined ? `<div class="bk-window__footer">${options.footerHtml}</div>` : ""}
      ${options.resizable ? `<div ${resizeIdAttr} class="bk-window__resize" title="Drag to resize window" aria-hidden="true"></div>` : ""}
    `;

    document.body.appendChild(win);
    this.el = win;
    this.headerEl = win.querySelector<HTMLDivElement>(".bk-window__header")!;
    this.bodyEl = win.querySelector<HTMLDivElement>(".bk-window__body")!;
    this.footerEl = win.querySelector<HTMLDivElement>(".bk-window__footer");

    this.bindInteractions();
    FloatingWindowManager.getInstance().register(this);
    this.applyGeometry();
  }

  public isOpen(): boolean {
    return !this.el.classList.contains("hidden");
  }

  public open(): void {
    this.removePill();
    this.el.classList.remove("hidden");
    FloatingWindowManager.getInstance().bringToFront(this.id);
    this.applyGeometry();
  }

  public close(minimizeToPill = false): void {
    if (!this.isOpen()) return;
    this.el.classList.add("hidden");
    if (minimizeToPill && this.opts.minimizeMode === "pill") {
      this.showPill();
    } else {
      this.removePill();
    }
    this.opts.onClose?.();
  }

  public destroy(): void {
    this.removePill();
    this.el.remove();
    FloatingWindowManager.getInstance().unregister(this.id);
  }

  public getZIndex(): number {
    return this.zIndex;
  }

  public setZIndex(z: number): void {
    this.zIndex = z;
    this.el.style.zIndex = String(z);
    if (this.pillEl) this.pillEl.style.zIndex = String(z);
  }

  public getRect(): DOMRect | null {
    if (!this.isOpen()) return null;
    return this.el.getBoundingClientRect();
  }

  public getGeometry(): BkFloatingGeometry {
    return { ...this.geometry };
  }

  public setPosition(left: number, top: number): void {
    this.geometry = this.clamp({ ...this.geometry, left, top });
    this.applyGeometry();
    this.persist();
  }

  public setSize(width: number, height: number): void {
    this.geometry = this.clamp({ ...this.geometry, width, height, collapsed: false });
    this.applyGeometry();
    this.persist();
    this.opts.onResize?.(this.getGeometry());
  }

  public setCollapsed(collapsed: boolean): void {
    this.geometry = this.clamp({ ...this.geometry, collapsed });
    this.applyGeometry();
    this.persist();
  }

  public resetGeometry(): void {
    this.geometry = FloatingWindowManager.getInstance().computeSafeInitialGeometry(
      this.opts.size,
      this.opts.preferredSlot ?? "auto",
      this.id
    );
    this.applyGeometry();
    this.persist();
    this.opts.onResize?.(this.getGeometry());
  }

  public clampToViewport(): void {
    this.geometry = this.clamp(this.geometry);
    this.applyGeometry();
  }

  private loadPersistedOrDefault(): BkFloatingGeometry {
    const fallback = FloatingWindowManager.getInstance().computeSafeInitialGeometry(
      this.opts.size,
      this.opts.preferredSlot ?? "auto",
      this.id
    );
    if (!this.opts.persistKey) return fallback;
    try {
      const raw = localStorage.getItem(this.opts.persistKey);
      if (!raw) return fallback;
      const p = JSON.parse(raw) as Partial<BkFloatingGeometry>;
      if (
        typeof p.left === "number" &&
        typeof p.top === "number" &&
        typeof p.width === "number" &&
        typeof p.height === "number"
      ) {
        return this.clamp({
          left: p.left,
          top: p.top,
          width: p.width,
          height: p.height,
          collapsed: Boolean(p.collapsed),
        });
      }
    } catch {
      // Fall back safely on corrupt storage
    }
    return fallback;
  }

  private persist(): void {
    if (!this.opts.persistKey) return;
    try {
      localStorage.setItem(this.opts.persistKey, JSON.stringify(this.geometry));
    } catch {
      // Ignore storage quota errors
    }
  }

  private clamp(geom: BkFloatingGeometry): BkFloatingGeometry {
    const vw = typeof window !== "undefined" && window.innerWidth > 0 ? window.innerWidth : 1280;
    const vh = typeof window !== "undefined" && window.innerHeight > 0 ? window.innerHeight : 800;
    const safeMinW = Math.min(this.spec.minWidth, Math.max(240, vw - 16));
    const maxW = Math.max(safeMinW, Math.min(this.spec.maxWidth, vw - 16));
    const minH = vh <= 480 ? Math.min(144, this.spec.minHeight) : this.spec.minHeight;
    const maxH = Math.max(minH, Math.min(this.spec.maxHeight, vh - 72));

    const width = Math.round(Math.max(safeMinW, Math.min(maxW, geom.width)));
    const height = Math.round(Math.max(minH, Math.min(maxH, geom.height)));
    const effH = geom.collapsed ? 46 : height;
    const left = Math.round(Math.max(8, Math.min(Math.max(8, vw - width - 8), geom.left)));
    const top = Math.round(Math.max(54, Math.min(Math.max(54, vh - effH - 10), geom.top)));
    return { left, top, width, height, collapsed: Boolean(geom.collapsed) };
  }

  private applyGeometry(): void {
    this.geometry = this.clamp(this.geometry);
    this.el.style.left = `${this.geometry.left}px`;
    this.el.style.top = `${this.geometry.top}px`;
    this.el.style.width = `${this.geometry.width}px`;
    if (this.opts.autoHeight && !this.opts.resizable) {
      this.el.style.height = "auto";
      this.el.style.maxHeight = `${Math.max(150, Math.min(460, (typeof window !== "undefined" ? window.innerHeight : 800) - this.geometry.top - 14))}px`;
    } else {
      this.el.style.height = this.geometry.collapsed ? "auto" : `${this.geometry.height}px`;
    }
    this.el.classList.toggle("is-collapsed", this.geometry.collapsed);
    this.el.classList.toggle("collapsed", this.geometry.collapsed);

    const collapseBtn = this.el.querySelector<HTMLButtonElement>(".bk-win-collapse");
    if (collapseBtn) {
      collapseBtn.textContent = this.geometry.collapsed ? "▢" : "—";
      collapseBtn.title = this.geometry.collapsed ? "Expand Floating Window" : "Minimize to Floating Bar";
    }
  }

  private showPill(): void {
    this.removePill();
    const pill = document.createElement("button");
    pill.id = this.opts.pillId || `${this.id}-reopen-pill`;
    pill.type = "button";
    pill.className = "bk-window-pill";
    pill.textContent = this.opts.pillLabel || this.opts.title;
    pill.title = `Reopen ${this.opts.title}`;
    pill.style.top = `${this.geometry.top}px`;
    pill.style.right = "16px";
    pill.style.zIndex = String(this.zIndex);
    pill.addEventListener("click", () => this.open());
    document.body.appendChild(pill);
    this.pillEl = pill;
  }

  private removePill(): void {
    this.pillEl?.remove();
    this.pillEl = null;
  }

  private bindInteractions(): void {
    // Click anywhere on window raises z-index to top of floating stack
    this.el.addEventListener("pointerdown", () => {
      FloatingWindowManager.getInstance().bringToFront(this.id);
      this.opts.onFocus?.();
    });

    this.el.querySelector(".bk-win-close")?.addEventListener("click", () => {
      this.close(this.opts.minimizeMode === "pill");
    });

    this.el.querySelector(".bk-win-collapse")?.addEventListener("click", () => {
      this.setCollapsed(!this.geometry.collapsed);
    });

    this.el.querySelector(".bk-win-reset")?.addEventListener("click", () => {
      this.resetGeometry();
    });

    // Header drag
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;

    this.headerEl.addEventListener("pointerdown", (ev: PointerEvent) => {
      if ((ev.target as HTMLElement)?.closest("button, select, input")) return;
      dragging = true;
      originLeft = this.geometry.left;
      originTop = this.geometry.top;
      startX = ev.clientX;
      startY = ev.clientY;
      this.el.classList.add("is-dragging", "dragging");
      this.headerEl.setPointerCapture?.(ev.pointerId);
      ev.preventDefault();
    });

    this.headerEl.addEventListener("pointermove", (ev: PointerEvent) => {
      if (!dragging) return;
      this.geometry = this.clamp({
        ...this.geometry,
        left: originLeft + (ev.clientX - startX),
        top: originTop + (ev.clientY - startY),
      });
      this.applyGeometry();
    });

    const endDrag = (ev: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      this.el.classList.remove("is-dragging", "dragging");
      this.headerEl.releasePointerCapture?.(ev.pointerId);
      this.persist();
    };
    this.headerEl.addEventListener("pointerup", endDrag);
    this.headerEl.addEventListener("pointercancel", endDrag);

    if (this.opts.collapsible !== false && this.opts.minimizeMode !== "pill") {
      this.headerEl.addEventListener("dblclick", (ev: MouseEvent) => {
        if ((ev.target as HTMLElement)?.closest("button, select, input")) return;
        this.setCollapsed(!this.geometry.collapsed);
      });
    }

    // Corner resize handle
    const resizeHandle = this.el.querySelector<HTMLElement>(".bk-window__resize");
    if (resizeHandle) {
      let resizing = false;
      let rx = 0;
      let ry = 0;
      let ow = 0;
      let oh = 0;

      resizeHandle.addEventListener("pointerdown", (ev: PointerEvent) => {
        resizing = true;
        ow = this.geometry.width;
        oh = this.geometry.height;
        rx = ev.clientX;
        ry = ev.clientY;
        this.el.classList.add("is-resizing", "resizing");
        resizeHandle.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
        ev.stopPropagation();
      });

      resizeHandle.addEventListener("pointermove", (ev: PointerEvent) => {
        if (!resizing) return;
        this.geometry = this.clamp({
          ...this.geometry,
          width: ow + (ev.clientX - rx),
          height: oh + (ev.clientY - ry),
          collapsed: false,
        });
        this.applyGeometry();
      });

      const endResize = (ev: PointerEvent) => {
        if (!resizing) return;
        resizing = false;
        this.el.classList.remove("is-resizing", "resizing");
        resizeHandle.releasePointerCapture?.(ev.pointerId);
        this.persist();
        this.opts.onResize?.(this.getGeometry());
      };
      resizeHandle.addEventListener("pointerup", endResize);
      resizeHandle.addEventListener("pointercancel", endResize);
    }
  }
}

export function createFloatingWindow(options: BkFloatingWindowOptions): BkFloatingWindow {
  return new BkFloatingWindow(options);
}

/* ==========================================================================
   STANDARD MODAL FACTORY (`createBkModal`)
   ========================================================================== */

export interface BkModalOptions {
  id: string;
  title: string;
  subtitle?: string;
  size?: BkWindowSize;
  closeButtonId?: string;
  headerActionsHtml?: string;
  bodyHtml?: string;
  footerHtml?: string;
  onClose?: () => void;
}

export interface BkModalHandle {
  overlay: HTMLDivElement;
  dialog: HTMLDivElement;
  body: HTMLDivElement;
  footer: HTMLDivElement | null;
  close: () => void;
}

export function createBkModal(options: BkModalOptions): BkModalHandle {
  document.getElementById(options.id)?.remove();

  const overlay = document.createElement("div");
  overlay.id = options.id;
  overlay.className = "bk-modal-backdrop modal-overlay open";
  overlay.setAttribute("role", "presentation");

  const size = options.size ?? "md";
  const closeIdAttr = options.closeButtonId ? `id="${options.closeButtonId}"` : "";

  overlay.innerHTML = `
    <div class="bk-modal bk-modal--${size}" role="dialog" aria-modal="true" aria-label="${options.title}">
      <div class="bk-modal__header">
        <div>
          <div class="bk-modal__title">${options.title}</div>
          ${options.subtitle ? `<div class="bk-modal__subtitle">${options.subtitle}</div>` : ""}
        </div>
        <div class="bk-window__actions">
          ${options.headerActionsHtml || ""}
          <button type="button" ${closeIdAttr} class="bk-btn bk-btn--ghost bk-btn--sm bk-btn--icon bk-modal-close" aria-label="Close dialog">✕</button>
        </div>
      </div>
      <div class="bk-modal__body thin-scrollbar">${options.bodyHtml || ""}</div>
      ${options.footerHtml !== undefined ? `<div class="bk-modal__footer">${options.footerHtml}</div>` : ""}
    </div>
  `;

  const onKeyDown = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") close();
  };

  const close = () => {
    window.removeEventListener("keydown", onKeyDown);
    if (overlay.parentNode) overlay.remove();
    options.onClose?.();
  };

  overlay.querySelector(".bk-modal-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
  window.addEventListener("keydown", onKeyDown);

  document.body.appendChild(overlay);
  return {
    overlay,
    dialog: overlay.querySelector<HTMLDivElement>(".bk-modal")!,
    body: overlay.querySelector<HTMLDivElement>(".bk-modal__body")!,
    footer: overlay.querySelector<HTMLDivElement>(".bk-modal__footer"),
    close,
  };
}

/* ==========================================================================
   STANDARD DROPDOWN MENU FACTORY (`createBkDropdown`)
   ========================================================================== */

export interface BkDropdownItem {
  id: string;
  label: string;
  badge?: string;
  active?: boolean;
  dividerBefore?: boolean;
  onSelect: () => void;
}

export interface BkDropdownHandle {
  menu: HTMLDivElement;
  open: () => void;
  close: () => void;
  toggle: () => void;
  destroy: () => void;
}

export function createBkDropdown(options: {
  id: string;
  anchor: HTMLElement;
  items: BkDropdownItem[];
}): BkDropdownHandle {
  document.getElementById(options.id)?.remove();
  const menu = document.createElement("div");
  menu.id = options.id;
  menu.className = "bk-dropdown__menu hidden";
  menu.setAttribute("role", "menu");

  for (const item of options.items) {
    if (item.dividerBefore) {
      const div = document.createElement("div");
      div.className = "bk-dropdown__divider";
      menu.appendChild(div);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `bk-dropdown__item${item.active ? " is-active" : ""}`;
    btn.dataset.itemId = item.id;
    btn.setAttribute("role", "menuitem");
    btn.textContent = item.label;
    if (item.badge) {
      const span = document.createElement("span");
      span.className = "bk-badge";
      span.textContent = item.badge;
      btn.appendChild(span);
    }
    btn.addEventListener("click", () => {
      close();
      item.onSelect();
    });
    menu.appendChild(btn);
  }

  document.body.appendChild(menu);

  const positionMenu = () => {
    const ar = options.anchor.getBoundingClientRect();
    const vw = window.innerWidth || 1280;
    const vh = window.innerHeight || 800;
    const mw = Math.min(360, Math.max(196, menu.offsetWidth || 220));
    const mh = menu.offsetHeight || 220;
    const left = Math.max(8, Math.min(vw - mw - 8, ar.right - mw));
    const spaceBelow = vh - ar.bottom - 12;
    const top = spaceBelow >= mh || spaceBelow >= 160 ? ar.bottom + 6 : Math.max(8, ar.top - mh - 6);
    menu.style.left = `${Math.round(left)}px`;
    menu.style.top = `${Math.round(top)}px`;
  };

  const onOutsidePointer = (ev: PointerEvent) => {
    const t = ev.target as Node;
    if (!menu.contains(t) && !options.anchor.contains(t)) close();
  };
  const onEsc = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") close();
  };

  const open = () => {
    menu.classList.remove("hidden");
    options.anchor.setAttribute("aria-expanded", "true");
    positionMenu();
    document.addEventListener("pointerdown", onOutsidePointer, true);
    window.addEventListener("keydown", onEsc);
  };

  const close = () => {
    menu.classList.add("hidden");
    options.anchor.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", onOutsidePointer, true);
    window.removeEventListener("keydown", onEsc);
  };

  const toggle = () => {
    if (menu.classList.contains("hidden")) open();
    else close();
  };

  const destroy = () => {
    close();
    menu.remove();
  };

  return { menu, open, close, toggle, destroy };
}

/* ==========================================================================
   STANDARD BUTTON & SELECT FACTORIES
   ========================================================================== */

export function createBkButton(options: {
  id?: string;
  label: string;
  variant?: BkButtonVariant;
  size?: BkControlSize;
  iconOnly?: boolean;
  title?: string;
  onClick?: (ev: MouseEvent) => void;
}): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.type = "button";
  if (options.id) btn.id = options.id;
  const variant = options.variant ?? "secondary";
  const size = options.size ?? "md";
  btn.className = `bk-btn bk-btn--${variant} bk-btn--${size}${options.iconOnly ? " bk-btn--icon" : ""}`;
  btn.textContent = options.label;
  if (options.title) btn.title = options.title;
  if (options.onClick) btn.addEventListener("click", options.onClick);
  return btn;
}

export function createBkSelect(options: {
  id?: string;
  ariaLabel: string;
  size?: BkControlSize;
  items: Array<{ value: string; label: string }>;
  value?: string;
  onChange?: (value: string) => void;
}): HTMLSelectElement {
  const sel = document.createElement("select");
  if (options.id) sel.id = options.id;
  sel.setAttribute("aria-label", options.ariaLabel);
  sel.className = `bk-select${options.size && options.size !== "md" ? ` bk-select--${options.size}` : ""}`;
  for (const item of options.items) {
    const opt = document.createElement("option");
    opt.value = item.value;
    opt.textContent = item.label;
    if (options.value === item.value) opt.selected = true;
    sel.appendChild(opt);
  }
  if (options.onChange) {
    sel.addEventListener("change", () => options.onChange?.(sel.value));
  }
  return sel;
}
