import { ClippingModule } from "../modules/ClippingModule";

export class SectionPlanesHUD {
  private static instance: SectionPlanesHUD;
  private clippingModule: ClippingModule;
  private container: HTMLElement | null = null;
  private isCollapsed: boolean = false;
  private isVisible: boolean = false;
  private hideTimeout: number | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.clippingModule = ClippingModule.getInstance();
    this.initHUD();
  }

  public static getInstance(): SectionPlanesHUD {
    if (!SectionPlanesHUD.instance) {
      SectionPlanesHUD.instance = new SectionPlanesHUD();
    }
    return SectionPlanesHUD.instance;
  }

  private initHUD() {
    if (typeof document === "undefined") return;

    // Check if container already exists
    let hud = document.getElementById("section-planes-hud");
    if (!hud) {
      hud = document.createElement("div");
      hud.id = "section-planes-hud";
      hud.className = "section-planes-hud hidden";
      
      // Mount inside bottom toolbar section or anchor
      const bottomCenter = document.getElementById("hud-anchor-bottom-center") || document.body;
      bottomCenter.appendChild(hud);
    }
    this.container = hud;

    this.renderBaseHTML();
    this.bindEvents();

    // Subscribe to plane changes
    this.unsubscribe = this.clippingModule.subscribePlanesChange((planes) => {
      this.renderPlanesList(planes);
    });
  }

  private renderBaseHTML() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="section-hud-header" id="section-hud-header">
        <div class="section-hud-title-group">
          <span class="section-hud-dot"></span>
          <span class="section-hud-title">SECTION PLANES</span>
          <span id="section-hud-count" class="section-hud-badge">0</span>
        </div>
        <div class="section-hud-actions">
          <div class="section-hud-add-dropdown-container">
            <button type="button" class="btn-section-hud-add" id="btn-section-hud-add" title="Add cutting plane">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>+ Cut</span>
            </button>
            <div class="section-hud-add-menu hidden" id="section-hud-add-menu">
              <button type="button" class="section-hud-menu-item" data-axis="Y">
                <span class="menu-axis-dot" style="background: #10b981;"></span>
                <span>Floor Plan (+Y)</span>
              </button>
              <button type="button" class="section-hud-menu-item" data-axis="NEG_Y">
                <span class="menu-axis-dot" style="background: #10b981;"></span>
                <span>Ceiling Cut (-Y)</span>
              </button>
              <button type="button" class="section-hud-menu-item" data-axis="X">
                <span class="menu-axis-dot" style="background: #ef4444;"></span>
                <span>X Lateral Section</span>
              </button>
              <button type="button" class="section-hud-menu-item" data-axis="Z">
                <span class="menu-axis-dot" style="background: #3b82f6;"></span>
                <span>Z Longitudinal Elevation</span>
              </button>
            </div>
          </div>
          <button type="button" class="btn-section-hud-icon" id="btn-section-hud-collapse" title="Collapse / Expand HUD">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button type="button" class="btn-section-hud-icon" id="btn-section-hud-close" title="Close Mini-HUD">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div id="section-hud-body" class="section-hud-body thin-scrollbar">
        <div id="section-hud-list" class="section-hud-list"></div>
        <div id="section-hud-empty" class="section-hud-empty">
          <div class="empty-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="12" x2="21" y2="12" /></svg>
          </div>
          <div class="empty-text">No active section cuts</div>
          <div class="empty-subtext">Double-click any surface or click <b>+ Cut</b></div>
        </div>
      </div>

      <div class="section-hud-footer" id="section-hud-footer">
        <button type="button" class="btn-section-hud-clear" id="btn-section-hud-clear-all" title="Delete all active cuts">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          <span>Clear All</span>
        </button>
        <div class="section-hud-hint">Active plane glows in theme accent</div>
      </div>
    `;
  }

  private bindEvents() {
    if (!this.container) return;

    // Toggle HUD visibility on Section Cut button click
    const btnSectionCut = document.getElementById("btn-section-cut");
    if (btnSectionCut) {
      btnSectionCut.addEventListener("click", () => {
        setTimeout(() => {
          const isEnabled = this.clippingModule.isEnabled();
          const planes = this.clippingModule.getAllPlanes();
          if (isEnabled || planes.length > 0) {
            this.show();
          } else {
            this.hide();
          }
        }, 50);
      });
    }

    // Collapse toggle
    const btnCollapse = this.container.querySelector("#btn-section-hud-collapse");
    const body = this.container.querySelector("#section-hud-body");
    const footer = this.container.querySelector("#section-hud-footer");
    if (btnCollapse && body) {
      btnCollapse.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isCollapsed = !this.isCollapsed;
        if (this.isCollapsed) {
          body.classList.add("collapsed");
          if (footer) footer.classList.add("collapsed");
          btnCollapse.classList.add("collapsed");
        } else {
          body.classList.remove("collapsed");
          if (footer) footer.classList.remove("collapsed");
          btnCollapse.classList.remove("collapsed");
        }
      });
    }

    // Close HUD button
    const btnClose = this.container.querySelector("#btn-section-hud-close");
    if (btnClose) {
      btnClose.addEventListener("click", (e) => {
        e.stopPropagation();
        this.hide();
      });
    }

    // Add plane menu toggle
    const btnAdd = this.container.querySelector("#btn-section-hud-add");
    const addMenu = this.container.querySelector("#section-hud-add-menu");
    if (btnAdd && addMenu) {
      btnAdd.addEventListener("click", (e) => {
        e.stopPropagation();
        addMenu.classList.toggle("hidden");
      });

      document.addEventListener("click", (e) => {
        if (!addMenu.contains(e.target as Node) && !btnAdd.contains(e.target as Node)) {
          addMenu.classList.add("hidden");
        }
      });

      // Handle menu option selection
      const menuItems = addMenu.querySelectorAll(".section-hud-menu-item");
      menuItems.forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          const axis = item.getAttribute("data-axis") as "X" | "Y" | "Z" | "NEG_Y";
          addMenu.classList.add("hidden");
          this.clippingModule.createDefaultPlane(axis || "Y");
          this.show();
        });
      });
    }

    // Clear all planes button
    const btnClearAll = this.container.querySelector("#btn-section-hud-clear-all");
    if (btnClearAll) {
      btnClearAll.addEventListener("click", (e) => {
        e.stopPropagation();
        this.clippingModule.deleteAllPlanes();
        this.hide();
      });
    }
  }

  public renderPlanesList(planes: any[]) {
    if (!this.container) return;

    const countBadge = this.container.querySelector("#section-hud-count");
    if (countBadge) {
      countBadge.textContent = `${planes.length}`;
    }

    const listContainer = this.container.querySelector("#section-hud-list");
    const emptyContainer = this.container.querySelector("#section-hud-empty");
    if (!listContainer || !emptyContainer) return;

    if (planes.length === 0) {
      listContainer.innerHTML = "";
      emptyContainer.classList.remove("hidden");
      
      // Auto-hide HUD when no cuts exist
      if (!this.clippingModule.isEnabled()) {
        this.hide();
      }
      return;
    }

    emptyContainer.classList.add("hidden");
    listContainer.innerHTML = "";

    const activePlane = this.clippingModule.getActivePlane() || (planes.length > 0 ? planes[0] : null);
    if (activePlane) {
      const activeMeta = this.clippingModule.getPlaneAxisMeta(activePlane);
      this.updateDynamicPlaneColor(activeMeta.color || "var(--accent-500)");
    } else {
      this.updateDynamicPlaneColor("var(--accent-500)");
    }

    planes.forEach((plane, index) => {
      const meta = this.clippingModule.getPlaneAxisMeta(plane);
      const isPlaneActive = plane === activePlane;
      const isEnabled = plane.enabled !== false && plane.visible !== false;

      const itemEl = document.createElement("div");
      itemEl.className = `section-plane-item ${isPlaneActive ? "active-plane" : ""} ${!isEnabled ? "plane-disabled" : ""}`;
      itemEl.setAttribute("data-plane-index", `${index}`);

      itemEl.innerHTML = `
        <div class="plane-item-info" title="Click to select & focus this cutting plane">
          <span class="plane-axis-badge" style="color: ${meta.color}; border-color: ${meta.color}50; background: ${meta.color}15;">
            ${meta.axis}
          </span>
          <div class="plane-title-col">
            <span class="plane-name">Plane #${index + 1}</span>
            <span class="plane-sub-label">${meta.label}</span>
          </div>
        </div>
        <div class="plane-item-controls">
          <button type="button" class="btn-plane-action btn-plane-flip" title="Flip cutting direction (invert normal)">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16"/></svg>
          </button>
          <button type="button" class="btn-plane-action btn-plane-toggle ${isEnabled ? "enabled" : "disabled"}" title="${isEnabled ? "Disable cut (hide plane)" : "Enable cut"}">
            ${isEnabled
              ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
              : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
            }
          </button>
          <button type="button" class="btn-plane-action btn-plane-delete" title="Delete this section plane">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      `;

      // Click row to activate
      const infoCol = itemEl.querySelector(".plane-item-info");
      if (infoCol) {
        infoCol.addEventListener("click", () => {
          this.clippingModule.setActivePlane(plane);
          this.renderPlanesList(this.clippingModule.getAllPlanes());
        });
      }

      // Flip normal
      const btnFlip = itemEl.querySelector(".btn-plane-flip");
      if (btnFlip) {
        btnFlip.addEventListener("click", (e) => {
          e.stopPropagation();
          this.clippingModule.flipPlaneNormal(plane);
        });
      }

      // Toggle visibility
      const btnToggle = itemEl.querySelector(".btn-plane-toggle");
      if (btnToggle) {
        btnToggle.addEventListener("click", (e) => {
          e.stopPropagation();
          this.clippingModule.togglePlaneVisibility(plane);
        });
      }

      // Delete plane
      const btnDelete = itemEl.querySelector(".btn-plane-delete");
      if (btnDelete) {
        btnDelete.addEventListener("click", (e) => {
          e.stopPropagation();
          this.clippingModule.deletePlane(plane);
        });
      }

      listContainer.appendChild(itemEl);
    });

    // Auto-show HUD if cuts exist and HUD is not visible
    if (planes.length > 0 && !this.isVisible) {
      this.show();
    }
  }

  /**
   * Dynamically adjusts the border color, glow, and header accents of the mini-HUD
   * to match the color assigned to the cutting plane in the 3D viewport.
   */
  private updateDynamicPlaneColor(colorHex: string) {
    if (!this.container) return;

    this.container.style.setProperty("--active-plane-color", colorHex);

    if (colorHex.startsWith("#")) {
      this.container.style.borderColor = `${colorHex}85`;
      this.container.style.boxShadow = `var(--shadow-panel, 0 20px 40px rgba(0,0,0,0.5)), 0 0 0 1px ${colorHex}55, 0 0 20px ${colorHex}35`;
    } else {
      this.container.style.borderColor = "var(--border-color, rgba(255, 255, 255, 0.1))";
      this.container.style.boxShadow = "var(--shadow-panel, 0 20px 40px rgba(0,0,0,0.5)), 0 0 0 1px var(--border-subtle), 0 0 16px var(--accent-glow2)";
    }

    const dot = this.container.querySelector(".section-hud-dot") as HTMLElement | null;
    if (dot) {
      dot.style.background = colorHex;
      dot.style.boxShadow = `0 0 8px ${colorHex}`;
    }

    const badge = this.container.querySelector("#section-hud-count") as HTMLElement | null;
    if (badge) {
      badge.style.color = colorHex;
      badge.style.borderColor = colorHex.startsWith("#") ? `${colorHex}60` : "var(--border-accent)";
      badge.style.background = colorHex.startsWith("#") ? `${colorHex}20` : "var(--accent-glow2)";
    }
  }

  public show() {
    if (!this.container) return;
    
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    this.container.classList.remove("hidden", "hud-exiting");
    // Force layout reflow to guarantee CSS animation restarts smoothly
    void this.container.offsetWidth;
    this.container.classList.add("hud-entering");
    this.isVisible = true;

    // Render latest planes
    this.renderPlanesList(this.clippingModule.getAllPlanes());
  }

  public hide() {
    if (!this.container || !this.isVisible) return;
    
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
    }

    this.container.classList.remove("hud-entering");
    this.container.classList.add("hud-exiting");
    this.isVisible = false;

    this.hideTimeout = window.setTimeout(() => {
      if (this.container && !this.isVisible) {
        this.container.classList.add("hidden");
        this.container.classList.remove("hud-exiting");
      }
    }, 240);
  }

  public toggle(): boolean {
    if (this.isVisible) {
      this.hide();
      return false;
    } else {
      this.show();
      return true;
    }
  }

  public dispose() {
    if (this.hideTimeout !== null) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}
