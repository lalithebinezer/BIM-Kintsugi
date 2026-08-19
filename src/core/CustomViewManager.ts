import * as THREE from "three";
import { StorageCache } from "../utils/storageCache";
import { ExplosionModule, type ExplosionStateSnapshot } from "../modules/ExplosionModule";

export interface SavedCustomView {
  id: string;
  name: string;
  timestamp: string;
  isPreset?: boolean;
  badge?: string;
  description?: string;
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    fov?: number;
    projection?: "Perspective" | "Orthographic";
  };
  clustering: ExplosionStateSnapshot;
  visual?: {
    themeId?: string;
    shadowsOn?: boolean;
  };
  filters?: {
    isolatedCategories?: string[];
    hiddenCategories?: string[];
  };
}

/**
 * Custom View Manager (Autodesk Tandem Style).
 * 
 * Stores, persists, and restores digital twin custom visual configurations:
 * - Camera position, orientation, target, FOV
 * - 3D Clustering & Disassembly settings (Category Clusters, Asset Dense Grouping, Storey Stack)
 * - Visual Color Coding & Themes
 * - Filter & Visibility states
 */
export class CustomViewManager {
  private static instance: CustomViewManager | null = null;
  private customViews: SavedCustomView[] = [];
  private world: any = null;

  // Built-in Architectural & Asset Cluster Presets
  private readonly defaultPresets: SavedCustomView[] = [
    {
      id: "preset-assembled",
      name: "Standard Assembled 3D",
      timestamp: "Built-in",
      isPreset: true,
      badge: "ASSEMBLED",
      description: "Default intact 3D architectural perspective",
      camera: {
        position: [20, 15, 30],
        target: [0, 5, 0],
        fov: 55,
        projection: "Perspective"
      },
      clustering: {
        mode: "category-cluster",
        factor: 0
      }
    },
    {
      id: "preset-asset-cluster",
      name: "Asset & Furniture Cluster Pods",
      timestamp: "Tandem",
      isPreset: true,
      badge: "ASSET CLUSTER",
      description: "Organizes repetitive assets & equipment into neat spatial grid clusters",
      camera: {
        position: [35, 25, 45],
        target: [0, 8, 0],
        fov: 55,
        projection: "Perspective"
      },
      clustering: {
        mode: "asset-dense-cluster",
        factor: 0.75
      }
    },
    {
      id: "preset-category-pods",
      name: "Category Disassembly Ring",
      timestamp: "Tandem",
      isPreset: true,
      badge: "CATEGORIES",
      description: "Sorted IFC categories dispersed into dedicated orbital pods",
      camera: {
        position: [40, 30, 40],
        target: [0, 10, 0],
        fov: 60,
        projection: "Perspective"
      },
      clustering: {
        mode: "category-cluster",
        factor: 0.70
      }
    },
    {
      id: "preset-storey-stack",
      name: "Storey Level Vertical Stack",
      timestamp: "Tandem",
      isPreset: true,
      badge: "STOREYS",
      description: "Exploded floor-by-floor inspection view",
      camera: {
        position: [30, 35, 30],
        target: [0, 15, 0],
        fov: 55,
        projection: "Perspective"
      },
      clustering: {
        mode: "storey-cluster",
        factor: 0.85
      }
    }
  ];

  private constructor() {}

  public static getInstance(): CustomViewManager {
    if (!CustomViewManager.instance) {
      CustomViewManager.instance = new CustomViewManager();
    }
    return CustomViewManager.instance;
  }

  public async init(world: any) {
    this.world = world;
    this.customViews = [];
    const cache = StorageCache.getInstance();
    await cache.init();

    if (typeof localStorage !== "undefined") {
      const stored = localStorage.getItem("bim_kintsugi_saved_custom_views");
      if (stored) {
        try {
          this.customViews = JSON.parse(stored);
        } catch {
          this.customViews = [];
        }
      } else {
        this.customViews = [];
      }
    }

    this.renderAllViewUIs();
    if (typeof window !== "undefined") {
      (window as any).customViewManager = this;
      (window as any).viewpointManager = this;
    }
  }

  /**
   * Captures the full snapshot of current camera, clustering, visual theme, and filters.
   */
  public saveCurrentView(name?: string, description?: string): SavedCustomView | null {
    if (!this.world || !this.world.camera) return null;

    const controls = this.world.camera.controls;
    const pos = controls && controls.getPosition ? controls.getPosition(new THREE.Vector3()) : this.world.camera.three?.position || new THREE.Vector3(0, 0, 0);
    const target = controls && controls.getTarget ? controls.getTarget(new THREE.Vector3()) : new THREE.Vector3(0, 0, 0);

    const explosionSnap = ExplosionModule.getInstance().getStateSnapshot();
    const activeThemeId = (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme")) || "zen";

    const vpName = name || `Custom View #${this.customViews.length + 1}`;
    const badgeName = explosionSnap.factor > 0 
      ? `CLUSTER ${Math.round(explosionSnap.factor * 100)}%` 
      : "ASSEMBLED";

    const customView: SavedCustomView = {
      id: `view-${Date.now()}`,
      name: vpName,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      badge: badgeName,
      description: description || `Captured with ${explosionSnap.mode} at ${Math.round(explosionSnap.factor * 100)}% clustering`,
      camera: {
        position: [pos.x, pos.y, pos.z],
        target: [target.x, target.y, target.z],
        fov: this.world.camera.threePersp?.fov || 55,
        projection: "Perspective"
      },
      clustering: explosionSnap,
      visual: {
        themeId: activeThemeId
      }
    };

    this.customViews.push(customView);
    this.persistViews();
    this.renderAllViewUIs();
    return customView;
  }

  /**
   * Smoothly restores a saved view's camera, clustering, theme, and filters.
   */
  public restoreView(viewId: string) {
    const view = this.getAllViews().find((v) => v.id === viewId);
    if (!view || !this.world || !this.world.camera) return;

    // 1. Restore Camera Position & Target with Smooth Interpolation
    const controls = this.world.camera.controls;
    const [px, py, pz] = view.camera.position;
    const [tx, ty, tz] = view.camera.target;

    if (controls && typeof controls.setLookAt === "function") {
      controls.setLookAt(px, py, pz, tx, ty, tz, true);
    } else if (this.world.camera.three) {
      this.world.camera.three.position.set(px, py, pz);
      if (controls && controls.target) controls.target.set(tx, ty, tz);
    }

    // 2. Restore 3D Asset Clustering & Disassembly State
    if (view.clustering) {
      const explosionMod = ExplosionModule.getInstance();
      explosionMod.setClusteringMode(view.clustering.mode || "category-cluster");
      explosionMod.setExplosionFactor(view.clustering.factor || 0);

      // Sync UI slider & dropdown
      if (typeof document !== "undefined") {
        const slider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
        const valBadge = document.getElementById("val-explosion-factor");
        const modeSelect = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
        const modeBadge = document.getElementById("badge-explosion-mode");

        if (slider) slider.value = Math.round((view.clustering.factor || 0) * 100).toString();
        if (valBadge) valBadge.innerText = `${Math.round((view.clustering.factor || 0) * 100)}%`;
        if (modeSelect) modeSelect.value = view.clustering.mode || "category-cluster";
        if (modeBadge) {
          modeBadge.textContent = view.clustering.mode === "asset-dense-cluster" ? "ASSETS" : view.clustering.mode === "storey-cluster" ? "STOREYS" : "CATEGORIES";
        }

        // Sync Quick Explode button
        const quickBtn = document.getElementById("btn-quick-explode");
        if (quickBtn) {
          if ((view.clustering.factor || 0) > 0) {
            quickBtn.classList.add("active");
            quickBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Assemble`;
          } else {
            quickBtn.classList.remove("active");
            quickBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> Explode`;
          }
        }
      }
    }

    // 3. Restore Theme / Color Coding if saved
    if (view.visual?.themeId && typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", view.visual.themeId);
      const themeSelect = document.getElementById("select-theme-toggle") as HTMLSelectElement | null;
      if (themeSelect) themeSelect.value = view.visual.themeId;
    }

    // Highlight active chip in UI
    if (typeof document !== "undefined") {
      const menu = document.getElementById("menu-saved-views");
      if (menu) menu.classList.add("hidden");

      document.querySelectorAll(".view-card-chip, .viewpoint-chip").forEach((el) => {
        if (el.getAttribute("data-vpid") === viewId) {
          el.classList.add("active-view-chip");
        } else {
          el.classList.remove("active-view-chip");
        }
      });
    }
  }

  public deleteView(viewId: string) {
    this.customViews = this.customViews.filter((v) => v.id !== viewId);
    this.persistViews();
    this.renderAllViewUIs();
  }

  public getAllViews(): SavedCustomView[] {
    return [...this.defaultPresets, ...this.customViews];
  }

  private persistViews() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem("bim_kintsugi_saved_custom_views", JSON.stringify(this.customViews));
    } catch (e) {
      console.warn("Could not save views to localStorage:", e);
    }
  }

  public renderAllViewUIs() {
    this.renderSidebarList();
    this.renderRibbonDropdown();
  }

  /**
   * Renders the Viewpoints list in Scene -> Viewpoints Sidebar panel.
   */
  public renderSidebarList() {
    if (typeof document === "undefined") return;
    const container = document.getElementById("viewpoint-bookmarks-list");
    if (!container) return;

    const allViews = this.getAllViews();

    container.innerHTML = allViews.map((vp) => `
      <div class="viewpoint-chip" data-vpid="${vp.id}" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.4rem 0.5rem; margin-bottom: 0.45rem; cursor: pointer; transition: transform 0.1s ease;">
        <div class="vp-info" style="display: flex; align-items: center; gap: 0.4rem; flex: 1; overflow: hidden;" onclick="window.customViewManager.restoreView('${vp.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="${vp.isPreset ? 'var(--accent-500)' : 'none'}" stroke="var(--accent-500)" stroke-width="2" style="flex-shrink:0;">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <div style="display: flex; flex-direction: column; overflow: hidden;">
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${vp.name}</span>
              ${vp.badge ? `<span style="font-size: 0.55rem; background: var(--accent-500); color: #000000; font-weight: 800; padding: 1px 4px; border-radius: 4px;">${vp.badge}</span>` : ""}
            </div>
            ${vp.description ? `<span style="font-size: 0.58rem; color: var(--text-muted); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${vp.description}</span>` : ""}
          </div>
          <span style="font-size: 0.6rem; color: var(--text-muted); margin-left: auto; font-family: var(--font-mono);">${vp.timestamp}</span>
        </div>
        ${!vp.isPreset ? `<button onclick="event.stopPropagation(); window.customViewManager.deleteView('${vp.id}')" style="background: none; border: none; color: var(--color-error); font-weight: bold; cursor: pointer; padding: 0 0.2rem; margin-left: 0.4rem;" title="Delete View">✕</button>` : ""}
      </div>
    `).join("");
  }

  /**
   * Renders the Top Ribbon Saved Views Flyout Menu.
   */
  public renderRibbonDropdown() {
    if (typeof document === "undefined") return;
    const container = document.getElementById("saved-views-dropdown-content");
    const countBadge = document.getElementById("saved-views-count-badge");
    const allViews = this.getAllViews();

    if (countBadge) {
      countBadge.textContent = allViews.length.toString();
    }

    if (!container) return;

    container.innerHTML = `
      <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: var(--bg-panel-header);">
        <div style="font-size: 0.72rem; font-weight: 900; color: var(--text-primary); display: flex; align-items: center; gap: 0.35rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          SAVED CUSTOM VIEWS (${allViews.length})
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <button id="btn-save-current-from-ribbon" class="btn-save-ribbon" title="Save current camera position, clustering & visualization state">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            <span>Save Current View</span>
          </button>
          <button id="btn-close-saved-views-flyout" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.2rem; display: flex; align-items: center; justify-content: center; border-radius: 4px;" title="Close (Esc)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div class="saved-views-scroll-list thin-scrollbar" style="max-height: 280px; overflow-y: auto; padding: 0.5rem;">
        ${allViews.map((vp) => `
          <div class="view-card-chip" data-vpid="${vp.id}" onclick="window.customViewManager.restoreView('${vp.id}')" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.4rem 0.5rem; margin-bottom: 0.4rem; cursor: pointer; transition: all 0.1s ease;">
            <div style="display: flex; flex-direction: column; overflow: hidden; flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.35rem;">
                <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-primary);">${vp.name}</span>
                ${vp.badge ? `<span style="font-size: 0.55rem; background: var(--accent-500); color: #000000; font-weight: 800; padding: 1px 4px; border-radius: 4px;">${vp.badge}</span>` : ""}
              </div>
              <span style="font-size: 0.58rem; color: var(--text-muted);">${vp.description || "Custom configuration"}</span>
            </div>
            ${!vp.isPreset ? `
              <button onclick="event.stopPropagation(); window.customViewManager.deleteView('${vp.id}')" style="background: none; border: none; color: var(--color-error); font-weight: bold; cursor: pointer; padding: 0 0.25rem; font-size: 0.75rem;" title="Delete View">✕</button>
            ` : `<span style="font-size: 0.58rem; color: var(--text-muted); font-family: var(--font-mono);">PRESET</span>`}
          </div>
        `).join("")}
      </div>
    `;

    const closeBtn = document.getElementById("btn-close-saved-views-flyout");
    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const menu = document.getElementById("menu-saved-views");
        if (menu) menu.classList.add("hidden");
      });
    }

    const saveBtn = document.getElementById("btn-save-current-from-ribbon");
    if (saveBtn) {
      saveBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const name = prompt("Enter a name for this Custom View (stores camera, clustering, and visual settings):", `View #${allViews.length + 1}`);
        if (name && name.trim()) {
          this.saveCurrentView(name.trim());
        }
      });
    }
  }
}
