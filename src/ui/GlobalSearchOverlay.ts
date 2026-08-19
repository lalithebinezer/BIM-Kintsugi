import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";
import { AnnotationModule } from "../modules/AnnotationModule";

export interface BimSearchItem {
  modelId: string;
  modelName: string;
  expressId: number;
  guid: string;
  name: string;
  ifcType: string;
  category: string;
  storey: string;
  tag: string;
  psets: Record<string, Record<string, string>>;
  allSearchText: string;
}

export type SearchScope = "all" | "guid" | "name" | "property";

export class GlobalSearchOverlay {
  private static instance: GlobalSearchOverlay | null = null;
  private engine: BimEngine;
  private overlayEl: HTMLElement;
  private modalEl: HTMLElement;
  private searchInput: HTMLInputElement;
  private resultsContainer: HTMLElement;
  private resultsSummaryEl: HTMLElement;
  private scopeSelect: HTMLSelectElement;
  private modelSelect: HTMLSelectElement;
  private categoryChipsContainer: HTMLElement;
  private batchActionsContainer: HTMLElement;
  private recentSearchesContainer: HTMLElement;
  private pinBtn: HTMLButtonElement;
  private minimizeBtn: HTMLButtonElement;
  private minimizedPillEl: HTMLElement;

  private isPinned: boolean = false;
  private isMinimized: boolean = false;
  private isOpen: boolean = false;
  private activeCategoryFilter: string = "All";
  private currentQuery: string = "";
  private selectedResultIndex: number = 0;

  // In-memory index of all loaded elements across all models
  private searchIndex: BimSearchItem[] = [];
  private lastResults: BimSearchItem[] = [];
  private recentSearches: string[] = [];

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.loadRecentSearches();
    this.loadPinnedState();

    // Create DOM structure
    this.overlayEl = document.createElement("div");
    this.overlayEl.id = "global-search-overlay";
    this.overlayEl.className = "bim-search-overlay hidden";

    this.overlayEl.innerHTML = `
      <div class="bim-search-modal" id="bim-search-modal" role="dialog" aria-label="Global BIM Element Search">
        <!-- Header -->
        <div class="bim-search-header">
          <div class="bim-search-title-group">
            <div class="bim-search-icon-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <div style="display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="bim-search-title">GLOBAL BIM SEARCH</span>
                <span class="bim-search-version-badge" id="search-models-count-badge">0 Models</span>
              </div>
              <span class="bim-search-subtitle">Search by GUID, Element Name, IFC Class, or Property Value across all IFC files</span>
            </div>
          </div>

          <div class="bim-search-header-actions">
            <button class="btn-search-header-tool" id="btn-search-pin" title="Pin Search Overlay (Keep open while inspecting 3D viewport)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="12" y1="17" x2="12" y2="22"/>
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a1 1 0 0 0 0-2H8a1 1 0 0 0 0 2h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
              </svg>
              <span id="btn-search-pin-text">Pin Mode</span>
            </button>
            <button class="btn-search-header-tool" id="btn-search-minimize" title="Minimize to floating pill">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button class="btn-search-header-tool btn-search-close" id="btn-search-close" title="Close Search (Esc)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Search Bar & Filters Section -->
        <div class="bim-search-tools-section">
          <div class="bim-search-input-wrapper">
            <svg class="search-input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              class="bim-search-input" 
              id="bim-global-search-input" 
              placeholder="Type GUID (e.g. 2O2$U), element name, IFC entity, or property (e.g. FireRating, LoadBearing, Concrete, 120)..." 
              autocomplete="off"
              spellcheck="false"
            />
            <button class="btn-search-clear hidden" id="btn-search-clear" title="Clear Search">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <kbd class="search-shortcut-kbd">ESC</kbd>
          </div>

          <!-- Controls Row: Scope & Model Filters -->
          <div class="bim-search-controls-row">
            <div class="bim-search-select-group">
              <span class="search-control-label">Search In:</span>
              <select class="bim-search-select" id="bim-search-scope">
                <option value="all">All Fields (GUID, Name & Properties)</option>
                <option value="guid">GUID / GlobalId Only</option>
                <option value="name">Element Name & IFC Class</option>
                <option value="property">Property Sets & Values Only</option>
              </select>
            </div>

            <div class="bim-search-select-group">
              <span class="search-control-label">Model:</span>
              <select class="bim-search-select" id="bim-search-model-select">
                <option value="all">All Loaded IFC Models</option>
              </select>
            </div>

            <button class="btn-search-refresh-index" id="btn-search-refresh-index" title="Re-index all loaded models">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <span>Re-index</span>
            </button>
          </div>

          <!-- Category Filter Chips -->
          <div class="bim-search-categories-bar thin-scrollbar" id="bim-search-category-chips">
            <!-- Dynamic Category Chips -->
          </div>

          <!-- Quick Search Preset Chips -->
          <div class="bim-search-presets-bar">
            <span class="search-preset-label">Quick Suggestions:</span>
            <button class="search-preset-chip" data-query="LoadBearing">🧱 LoadBearing</button>
            <button class="search-preset-chip" data-query="FireRating">🔥 FireRating</button>
            <button class="search-preset-chip" data-query="IsExternal">🚪 IsExternal</button>
            <button class="search-preset-chip" data-query="Concrete">🏗️ Concrete</button>
            <button class="search-preset-chip" data-query="Door">🚪 Doors</button>
            <button class="search-preset-chip" data-query="Column">🏛️ Columns</button>
            <button class="search-preset-chip" data-query="Volume">📐 Volume</button>
          </div>
        </div>

        <!-- Batch Actions Toolbar (Visible when results > 0) -->
        <div class="bim-search-batch-toolbar hidden" id="bim-search-batch-toolbar">
          <div class="batch-summary-info">
            <span id="batch-results-count-text">0 elements matched</span>
          </div>
          <div class="batch-action-buttons">
            <button class="btn-search-batch" id="btn-batch-select-all" title="Select and highlight all matching elements in 3D">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Select All</span>
            </button>
            <button class="btn-search-batch" id="btn-batch-isolate-all" title="Isolate only matching elements in 3D viewport">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Isolate All</span>
            </button>
            <button class="btn-search-batch" id="btn-batch-highlight-gold" title="Apply Theme Accent highlight to all matches">
              <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:var(--accent-500, #D4FF3F);"></span>
              <span>Highlight</span>
            </button>
            <button class="btn-search-batch" id="btn-batch-export-csv" title="Export matching elements list to CSV spreadsheet">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export CSV</span>
            </button>
            <button class="btn-search-batch" id="btn-batch-reset-view" title="Reset visibility and selection in 3D scene">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
              <span>Show All</span>
            </button>
          </div>
        </div>

        <!-- Recent Searches Section (Shown when query is empty) -->
        <div class="bim-search-recent-section" id="bim-search-recent-section">
          <div class="recent-header">
            <span>Recent Searches</span>
            <button class="btn-clear-recent" id="btn-clear-recent">Clear</button>
          </div>
          <div class="recent-list" id="bim-search-recent-list">
            <!-- Dynamic recent searches -->
          </div>
        </div>

        <!-- Results List Section -->
        <div class="bim-search-results-list thin-scrollbar" id="bim-search-results-container">
          <!-- Dynamic Results Cards -->
        </div>

        <!-- Footer / Shortcuts Guide -->
        <div class="bim-search-footer">
          <div class="search-shortcuts-guide">
            <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Focus & Select</span>
            <span><kbd>Esc</kbd> Close</span>
            <span><kbd>📌</kbd> Pin Mode keeps search open while exploring 3D</span>
          </div>
          <div class="search-index-status" id="search-index-status-text">
            Indexed 0 elements
          </div>
        </div>
      </div>

      <!-- Minimized Floating Pill -->
      <div class="bim-search-minimized-pill hidden" id="bim-search-minimized-pill">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-500)" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span id="minimized-pill-label">Global Search</span>
        <span class="minimized-pill-count" id="minimized-pill-count">0</span>
        <button class="btn-pill-expand" id="btn-pill-expand" title="Restore Search Window">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
      </div>
    `;

    document.body.appendChild(this.overlayEl);

    // Bind references
    this.modalEl = this.overlayEl.querySelector("#bim-search-modal") as HTMLElement;
    this.searchInput = this.overlayEl.querySelector("#bim-global-search-input") as HTMLInputElement;
    this.resultsContainer = this.overlayEl.querySelector("#bim-search-results-container") as HTMLElement;
    this.resultsSummaryEl = this.overlayEl.querySelector("#batch-results-count-text") as HTMLElement;
    this.scopeSelect = this.overlayEl.querySelector("#bim-search-scope") as HTMLSelectElement;
    this.modelSelect = this.overlayEl.querySelector("#bim-search-model-select") as HTMLSelectElement;
    this.categoryChipsContainer = this.overlayEl.querySelector("#bim-search-category-chips") as HTMLElement;
    this.batchActionsContainer = this.overlayEl.querySelector("#bim-search-batch-toolbar") as HTMLElement;
    this.recentSearchesContainer = this.overlayEl.querySelector("#bim-search-recent-section") as HTMLElement;
    this.pinBtn = this.overlayEl.querySelector("#btn-search-pin") as HTMLButtonElement;
    this.minimizeBtn = this.overlayEl.querySelector("#btn-search-minimize") as HTMLButtonElement;
    this.minimizedPillEl = this.overlayEl.querySelector("#bim-search-minimized-pill") as HTMLElement;

    this.setupEventListeners();
    this.renderRecentSearches();
    this.applyPinnedModeUI();
  }

  public static getInstance(): GlobalSearchOverlay {
    if (!GlobalSearchOverlay.instance) {
      GlobalSearchOverlay.instance = new GlobalSearchOverlay();
    }
    return GlobalSearchOverlay.instance;
  }

  /**
   * Builds or updates the comprehensive search index across all loaded IFC models.
   */
  public async buildIndex(): Promise<number> {
    const statusText = this.overlayEl.querySelector("#search-index-status-text");
    const countBadge = this.overlayEl.querySelector("#search-models-count-badge");
    if (statusText) statusText.textContent = "Indexing loaded IFC models...";

    this.searchIndex = [];
    const modelsCount = this.engine.fragments.list.size;
    if (countBadge) countBadge.textContent = `${modelsCount} ${modelsCount === 1 ? "Model" : "Models"}`;

    this.updateModelSelectDropdown();

    for (const [modelId, model] of this.engine.fragments.list) {
      const anyModel = model as any;
      const modelName = anyModel.modelId || anyModel.name || modelId || "IFC Model";
      const properties = anyModel.properties || (anyModel.getLocalProperties ? anyModel.getLocalProperties() : {});

      if (!properties || Object.keys(properties).length === 0) continue;

      // 1. Single O(N) pre-pass to map expressId -> relating property definition IDs
      const elementToPsetIdsMap = new Map<number, number[]>();
      for (const idStr in properties) {
        const item = properties[idStr];
        if (!item) continue;
        if (item.type === "IFCRELDEFINESBYPROPERTIES") {
          const relDef = item.RelatingPropertyDefinition;
          if (!relDef) continue;
          const psetId = Number(relDef.value ?? relDef);
          if (isNaN(psetId)) continue;

          const related = item.RelatedObjects;
          if (!related) continue;

          if (Array.isArray(related)) {
            for (const obj of related) {
              const elId = Number(obj.value ?? obj);
              if (!isNaN(elId)) {
                let arr = elementToPsetIdsMap.get(elId);
                if (!arr) {
                  arr = [];
                  elementToPsetIdsMap.set(elId, arr);
                }
                arr.push(psetId);
              }
            }
          } else {
            const elId = Number(related.value ?? related);
            if (!isNaN(elId)) {
              let arr = elementToPsetIdsMap.get(elId);
              if (!arr) {
                arr = [];
                elementToPsetIdsMap.set(elId, arr);
              }
              arr.push(psetId);
            }
          }
        }
      }

      // 2. Cache parsed property sets (psetId -> { psetName, props })
      const parsedPsetCache = new Map<number, { psetName: string; props: Record<string, string> }>();
      const getParsedPset = (psetId: number) => {
        if (parsedPsetCache.has(psetId)) return parsedPsetCache.get(psetId)!;
        const propSet = properties[psetId];
        if (!propSet) return null;

        const psetName = this.unvalue(propSet.Name) || `PropertySet_${psetId}`;
        const props: Record<string, string> = {};

        const hasProps = propSet.HasProperties;
        if (hasProps && Array.isArray(hasProps)) {
          for (const propRef of hasProps) {
            const propId = Number(propRef.value ?? propRef);
            const p = properties[propId];
            if (!p) continue;
            const propName = this.unvalue(p.Name);
            const propVal = this.unvalue(p.NominalValue) || this.unvalue(p.Value);
            if (propName) props[propName] = propVal;
          }
        }

        const quantities = propSet.Quantities;
        if (quantities && Array.isArray(quantities)) {
          for (const qtyRef of quantities) {
            const qtyId = Number(qtyRef.value ?? qtyRef);
            const q = properties[qtyId];
            if (!q) continue;
            const qtyName = this.unvalue(q.Name);
            let qtyVal = "";
            for (const key in q) {
              if (key.endsWith("Value")) {
                qtyVal = this.unvalue(q[key]);
                break;
              }
            }
            if (!qtyVal) qtyVal = this.unvalue(q.NominalValue) || this.unvalue(q.Value);
            if (qtyName) props[qtyName] = qtyVal;
          }
        }

        const res = { psetName, props };
        parsedPsetCache.set(psetId, res);
        return res;
      };

      // 3. Fast O(N) extraction of all BIM elements
      for (const idStr in properties) {
        const expressId = Number(idStr);
        if (isNaN(expressId)) continue;
        const prop = properties[idStr];
        if (!prop) continue;

        const ifcTypeRaw = String(prop.type || "");
        // Filter for BIM spatial and physical elements
        const isBimElement = ifcTypeRaw.startsWith("IFC") && 
          !ifcTypeRaw.includes("REL") && 
          !ifcTypeRaw.includes("PROPERTY") && 
          !ifcTypeRaw.includes("QUANTITY") &&
          !ifcTypeRaw.includes("SHAPE") &&
          !ifcTypeRaw.includes("REPRESENTATION") &&
          !ifcTypeRaw.includes("LOCALPLACEMENT") &&
          !ifcTypeRaw.includes("OWNERHISTORY") &&
          !ifcTypeRaw.includes("GEOMETRIC");

        if (!isBimElement && !prop.GlobalId && !prop.Name) continue;

        const guid = this.extractGuid(prop);
        const ifcType = this.formatIfcType(ifcTypeRaw);
        const category = this.categorizeIfcType(ifcTypeRaw);
        const name = this.resolveElementName(properties, expressId, prop, ifcType);
        const tag = prop.Tag ? this.unvalue(prop.Tag) : "";
        const storey = ""; // Will be enriched from classification if present

        // Resolve psets using pre-indexed relations and cache
        const psets: Record<string, Record<string, string>> = {};

        // Direct HasPropertySets
        if (prop.HasPropertySets) {
          const refs = Array.isArray(prop.HasPropertySets) ? prop.HasPropertySets : [prop.HasPropertySets];
          for (const r of refs) {
            const psetId = Number(r.value ?? r);
            const parsed = getParsedPset(psetId);
            if (parsed && Object.keys(parsed.props).length > 0) {
              psets[parsed.psetName] = { ...(psets[parsed.psetName] || {}), ...parsed.props };
            }
          }
        }

        // RelDefinesByProperties from pre-indexed Map (O(1) lookup)
        const relPsetIds = elementToPsetIdsMap.get(expressId);
        if (relPsetIds) {
          for (const psetId of relPsetIds) {
            const parsed = getParsedPset(psetId);
            if (parsed && Object.keys(parsed.props).length > 0) {
              psets[parsed.psetName] = { ...(psets[parsed.psetName] || {}), ...parsed.props };
            }
          }
        }

        // Precompute unified lowercase text token bag for high speed queries
        let psetsText = "";
        for (const psetName in psets) {
          psetsText += ` ${psetName.toLowerCase()}`;
          for (const key in psets[psetName]) {
            psetsText += ` ${key.toLowerCase()}:${String(psets[psetName][key]).toLowerCase()}`;
          }
        }

        const allSearchText = `${guid.toLowerCase()} ${name.toLowerCase()} ${ifcType.toLowerCase()} ${category.toLowerCase()} ${tag.toLowerCase()} ${expressId} #${expressId} ${modelName.toLowerCase()}${psetsText}`;

        this.searchIndex.push({
          modelId,
          modelName,
          expressId,
          guid,
          name,
          ifcType,
          category,
          storey,
          tag,
          psets,
          allSearchText
        });
      }
    }

    if (statusText) {
      statusText.textContent = `Indexed ${this.searchIndex.length.toLocaleString()} BIM elements across ${modelsCount} ${modelsCount === 1 ? 'model' : 'models'}`;
    }

    this.renderCategoryChips();
    if (this.currentQuery) {
      this.executeSearch(this.currentQuery);
    }

    return this.searchIndex.length;
  }

  private updateModelSelectDropdown() {
    this.modelSelect.innerHTML = `<option value="all">All Loaded IFC Models (${this.engine.fragments.list.size})</option>`;
    for (const [modelId, model] of this.engine.fragments.list) {
      const anyModel = model as any;
      const modelName = anyModel.modelId || anyModel.name || modelId;
      const opt = document.createElement("option");
      opt.value = modelId;
      opt.textContent = modelName;
      this.modelSelect.appendChild(opt);
    }
  }

  private extractGuid(prop: any): string {
    if (!prop) return "";
    if (prop.GlobalId) {
      return this.unvalue(prop.GlobalId);
    }
    if (prop.guid) {
      return String(prop.guid);
    }
    return "";
  }

  private unvalue(val: any): string {
    if (val === undefined || val === null) return "";
    if (typeof val === "string" || typeof val === "number") return String(val);
    if (val.value !== undefined) {
      if (typeof val.value === "object" && val.value !== null) {
        return String(val.value.value ?? "");
      }
      return String(val.value);
    }
    return String(val);
  }

  private formatIfcType(raw: string): string {
    if (!raw) return "IfcElement";
    if (raw.startsWith("IFC")) {
      return raw.charAt(0) + raw.slice(1).toLowerCase().replace(/^[a-z]/, (s) => s.toUpperCase());
    }
    return raw;
  }

  private categorizeIfcType(raw: string): string {
    const t = raw.toUpperCase();
    if (t.includes("WALL")) return "Walls";
    if (t.includes("DOOR")) return "Doors";
    if (t.includes("WINDOW")) return "Windows";
    if (t.includes("SLAB") || t.includes("FLOOR")) return "Slabs";
    if (t.includes("COLUMN")) return "Columns";
    if (t.includes("BEAM")) return "Beams";
    if (t.includes("ROOF")) return "Roofs";
    if (t.includes("STAIR") || t.includes("RAMP") || t.includes("RAILING")) return "Stairs";
    if (t.includes("SPACE") || t.includes("ZONE")) return "Spaces";
    if (t.includes("FLOW") || t.includes("DUCT") || t.includes("PIPE") || t.includes("TERMINAL") || t.includes("VALVE")) return "MEP";
    if (t.includes("FURNISHING") || t.includes("FURNITURE")) return "Furniture";
    if (t.includes("FOOTING") || t.includes("PILE") || t.includes("FOUNDATION")) return "Foundation";
    if (t.includes("PLATE") || t.includes("MEMBER") || t.includes("STRUCTURAL")) return "Structure";
    return "Elements";
  }

  public getIsMinimized(): boolean {
    return this.isMinimized;
  }

  private resolveElementName(_properties: any, expressId: number, elementProps: any, fallbackType: string): string {
    let name = elementProps.Name ? this.unvalue(elementProps.Name) : "";
    if (!name || name === "Unnamed Element" || name.toUpperCase().includes("IFCBUILDINGELEMENT")) {
      if (elementProps.ObjectType) name = this.unvalue(elementProps.ObjectType);
      else if (elementProps.Tag) name = `Tag ${this.unvalue(elementProps.Tag)}`;
      else name = `${fallbackType} #${expressId}`;
    }
    return name;
  }

  private setupEventListeners() {
    // Keyboard shortcuts: Ctrl+F, Cmd+F, or "/"
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement || activeEl instanceof HTMLSelectElement;

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === "f")) {
        e.preventDefault();
        this.toggle();
      } else if (e.key === "/" && !isInput) {
        e.preventDefault();
        this.open();
      } else if (e.key === "Escape" && this.isOpen) {
        if (!this.isPinned) {
          this.close();
        } else {
          this.minimize();
        }
      }
    });

    // Close buttons
    this.overlayEl.querySelector("#btn-search-close")?.addEventListener("click", () => this.close());
    this.overlayEl.addEventListener("click", (e) => {
      if (e.target === this.overlayEl && !this.isPinned) {
        this.close();
      }
    });

    // Pinned mode button
    this.pinBtn.addEventListener("click", () => this.togglePinnedMode());

    // Minimize button
    this.minimizeBtn.addEventListener("click", () => this.minimize());
    this.minimizedPillEl.querySelector("#btn-pill-expand")?.addEventListener("click", () => this.restore());
    this.minimizedPillEl.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest("#btn-pill-expand")) return;
      this.restore();
    });

    // Input events
    this.searchInput.addEventListener("input", () => {
      const q = this.searchInput.value.trim();
      const clearBtn = this.overlayEl.querySelector("#btn-search-clear");
      if (clearBtn) clearBtn.classList.toggle("hidden", !q);
      this.selectedResultIndex = 0;
      this.executeSearch(q);
    });

    this.searchInput.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.navigateResults(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.navigateResults(-1);
      } else if (e.key === "Enter") {
        e.preventDefault();
        this.activateSelectedResult();
      }
    });

    this.overlayEl.querySelector("#btn-search-clear")?.addEventListener("click", () => {
      this.searchInput.value = "";
      this.searchInput.focus();
      this.overlayEl.querySelector("#btn-search-clear")?.classList.add("hidden");
      this.executeSearch("");
    });

    // Scope & Model selectors
    this.scopeSelect.addEventListener("change", () => {
      this.executeSearch(this.searchInput.value.trim());
    });

    this.modelSelect.addEventListener("change", () => {
      this.executeSearch(this.searchInput.value.trim());
    });

    // Re-index button
    this.overlayEl.querySelector("#btn-search-refresh-index")?.addEventListener("click", async () => {
      const count = await this.buildIndex();
      this.showToast(`Re-indexed ${count.toLocaleString()} elements across all models`);
    });

    // Quick suggestion presets
    this.overlayEl.querySelectorAll(".search-preset-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        const query = btn.getAttribute("data-query") || "";
        this.searchInput.value = query;
        this.overlayEl.querySelector("#btn-search-clear")?.classList.remove("hidden");
        this.searchInput.focus();
        this.executeSearch(query);
      });
    });

    // Clear recent searches
    this.overlayEl.querySelector("#btn-clear-recent")?.addEventListener("click", () => {
      this.recentSearches = [];
      this.saveRecentSearches();
      this.renderRecentSearches();
    });

    // Batch Actions Toolbar Listeners
    this.overlayEl.querySelector("#btn-batch-select-all")?.addEventListener("click", () => this.batchSelectAll());
    this.overlayEl.querySelector("#btn-batch-isolate-all")?.addEventListener("click", () => this.batchIsolateAll());
    this.overlayEl.querySelector("#btn-batch-highlight-gold")?.addEventListener("click", () => this.batchHighlightAll("Gold"));
    this.overlayEl.querySelector("#btn-batch-export-csv")?.addEventListener("click", () => this.exportResultsToCSV());
    this.overlayEl.querySelector("#btn-batch-reset-view")?.addEventListener("click", () => this.resetSceneVisibility());

    // Listen for model load/dispose events to keep index fresh
    this.engine.fragments.list.onItemSet.add(() => {
      setTimeout(() => this.buildIndex(), 500);
    });
  }

  public open(prefillQuery?: string) {
    this.isOpen = true;
    this.isMinimized = false;
    this.overlayEl.classList.remove("hidden");
    this.minimizedPillEl.classList.add("hidden");
    this.modalEl.classList.remove("hidden");

    if (this.searchIndex.length === 0 && this.engine.fragments.list.size > 0) {
      this.buildIndex();
    } else {
      this.updateModelSelectDropdown();
    }

    if (prefillQuery !== undefined) {
      this.searchInput.value = prefillQuery;
      this.overlayEl.querySelector("#btn-search-clear")?.classList.toggle("hidden", !prefillQuery);
      this.executeSearch(prefillQuery);
    } else {
      this.executeSearch(this.searchInput.value.trim());
    }

    setTimeout(() => {
      this.searchInput.focus();
      this.searchInput.select();
    }, 50);
  }

  public close() {
    if (this.isPinned) {
      // In pinned mode, close minimizes or hides overlay
      this.minimize();
      return;
    }
    this.isOpen = false;
    this.overlayEl.classList.add("hidden");
    this.minimizedPillEl.classList.add("hidden");
  }

  public toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public minimize() {
    this.isMinimized = true;
    this.modalEl.classList.add("hidden");
    this.minimizedPillEl.classList.remove("hidden");
    const countEl = this.minimizedPillEl.querySelector("#minimized-pill-count");
    if (countEl) countEl.textContent = String(this.lastResults.length);
    const labelEl = this.minimizedPillEl.querySelector("#minimized-pill-label");
    if (labelEl) {
      labelEl.textContent = this.currentQuery ? `"${this.currentQuery}"` : "Global Search";
    }
  }

  public restore() {
    this.isMinimized = false;
    this.modalEl.classList.remove("hidden");
    this.minimizedPillEl.classList.add("hidden");
    this.searchInput.focus();
  }

  public togglePinnedMode() {
    this.isPinned = !this.isPinned;
    localStorage.setItem("bim_search_pinned", this.isPinned ? "true" : "false");
    this.applyPinnedModeUI();
    this.showToast(
      this.isPinned 
        ? "📌 Pinned: Search panel will stay open while you navigate 3D viewport" 
        : "Unpinned: Standard modal overlay mode"
    );
  }

  private applyPinnedModeUI() {
    if (this.isPinned) {
      this.overlayEl.classList.add("pinned-mode");
      this.pinBtn.classList.add("active");
      const pinText = this.overlayEl.querySelector("#btn-search-pin-text");
      if (pinText) pinText.textContent = "Pinned (Active)";
    } else {
      this.overlayEl.classList.remove("pinned-mode");
      this.pinBtn.classList.remove("active");
      const pinText = this.overlayEl.querySelector("#btn-search-pin-text");
      if (pinText) pinText.textContent = "Pin Mode";
    }
  }

  private loadPinnedState() {
    const saved = localStorage.getItem("bim_search_pinned");
    this.isPinned = saved === "true";
  }

  /**
   * Main Search Execution Logic
   */
  public executeSearch(query: string) {
    this.currentQuery = query;
    const scope = (this.scopeSelect.value || "all") as SearchScope;
    const targetModelId = this.modelSelect.value || "all";
    const qClean = query.toLowerCase().trim();

    if (!qClean && this.activeCategoryFilter === "All" && targetModelId === "all") {
      this.batchActionsContainer.classList.add("hidden");
      this.recentSearchesContainer.classList.remove("hidden");
      this.renderEmptyOrInitialView();
      return;
    }

    this.recentSearchesContainer.classList.add("hidden");

    // Add to recent searches if substantial
    if (qClean.length >= 2 && !this.recentSearches.includes(query.trim())) {
      this.recentSearches.unshift(query.trim());
      if (this.recentSearches.length > 8) this.recentSearches.pop();
      this.saveRecentSearches();
      this.renderRecentSearches();
    }

    // Filter index
    let matched = this.searchIndex.filter((item) => {
      // Model filter
      if (targetModelId !== "all" && item.modelId !== targetModelId) {
        return false;
      }

      // Category filter
      if (this.activeCategoryFilter !== "All" && item.category !== this.activeCategoryFilter) {
        return false;
      }

      if (!qClean) return true;

      // Scope checking
      if (scope === "guid") {
        return item.guid.toLowerCase().includes(qClean) || String(item.expressId) === qClean || `#${item.expressId}` === qClean;
      }

      if (scope === "name") {
        return item.name.toLowerCase().includes(qClean) || item.ifcType.toLowerCase().includes(qClean) || item.tag.toLowerCase().includes(qClean);
      }

      if (scope === "property") {
        for (const psetName in item.psets) {
          if (psetName.toLowerCase().includes(qClean)) return true;
          for (const k in item.psets[psetName]) {
            if (k.toLowerCase().includes(qClean) || String(item.psets[psetName][k]).toLowerCase().includes(qClean)) {
              return true;
            }
          }
        }
        return false;
      }

      // All fields matching
      if (item.allSearchText.includes(qClean)) {
        return true;
      }

      // Multi-word matching
      const words = qClean.split(/\s+/).filter(Boolean);
      if (words.length > 1) {
        return words.every((w) => item.allSearchText.includes(w));
      }

      return false;
    });

    this.lastResults = matched;
    this.renderSearchResults(matched, qClean);
  }

  private renderSearchResults(results: BimSearchItem[], query: string) {
    this.resultsContainer.innerHTML = "";
    const totalCount = results.length;

    // Update batch toolbar
    if (totalCount > 0) {
      this.batchActionsContainer.classList.remove("hidden");
      this.resultsSummaryEl.textContent = `Found ${totalCount.toLocaleString()} matching BIM elements`;
    } else {
      this.batchActionsContainer.classList.add("hidden");
    }

    const pillCount = this.minimizedPillEl.querySelector("#minimized-pill-count");
    if (pillCount) pillCount.textContent = String(totalCount);

    if (totalCount === 0) {
      this.resultsContainer.innerHTML = `
        <div class="search-empty-state">
          <div class="empty-icon">🔍</div>
          <div class="empty-title">No matching elements found</div>
          <div class="empty-desc">
            No BIM objects matched "${query}" under current filters.<br/>
            Try searching by partial GUID, general IFC class name (e.g. <code>Wall</code>, <code>Door</code>), or property names (e.g. <code>FireRating</code>, <code>LoadBearing</code>).
          </div>
        </div>
      `;
      return;
    }

    // Limit rendering for ultra-fast DOM response (up to 150 items, with infinite scroll or full batch actions)
    const displayLimit = Math.min(results.length, 120);
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < displayLimit; i++) {
      const item = results[i];
      const card = document.createElement("div");
      card.className = `bim-result-card ${i === this.selectedResultIndex ? "selected" : ""}`;
      card.setAttribute("data-index", String(i));
      card.setAttribute("data-model-id", item.modelId);
      card.setAttribute("data-express-id", String(item.expressId));

      const matchedContext = this.findMatchingContextSnippet(item, query);
      const highlightedName = this.highlightQueryText(item.name, query);
      const highlightedGuid = item.guid ? this.highlightQueryText(item.guid, query) : `#${item.expressId}`;

      card.innerHTML = `
        <div class="result-card-main">
          <div class="result-header-row">
            <div class="result-category-badge cat-${item.category.toLowerCase()}">
              ${this.getCategoryIcon(item.category)}
              <span>${item.category.toUpperCase()}</span>
            </div>
            <span class="result-ifc-type">${item.ifcType}</span>
            <span class="result-model-badge" title="Source Model: ${item.modelName}">
              📁 ${item.modelName}
            </span>
            <span class="result-express-id">#${item.expressId}</span>
          </div>

          <div class="result-name-row">
            <span class="result-element-name" title="${item.name}">${highlightedName}</span>
          </div>

          <div class="result-guid-row">
            <span class="result-guid-label">GUID:</span>
            <code class="result-guid-code">${highlightedGuid}</code>
            ${item.guid ? `
              <button class="btn-copy-guid" data-guid="${item.guid}" title="Copy IFC GlobalId to Clipboard">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>Copy</span>
              </button>
            ` : ""}
          </div>

          ${matchedContext ? `
            <div class="result-matched-props-snippet">
              <span class="snippet-tag">Match:</span>
              <span class="snippet-content">${matchedContext}</span>
            </div>
          ` : ""}
        </div>

        <div class="result-card-actions">
          <button class="btn-res-action btn-res-focus" title="Focus & Inspect in 3D Viewport">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
            <span>Focus</span>
          </button>
          <button class="btn-res-action btn-res-isolate" title="Isolate Element">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn-res-action btn-res-xray" title="Ghost / X-Ray Context">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="btn-res-action btn-res-pin" title="Add 3D Pin Annotation">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
          </button>
        </div>
      `;

      // Copy GUID button event
      const copyBtn = card.querySelector(".btn-copy-guid");
      if (copyBtn) {
        copyBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          const guidVal = copyBtn.getAttribute("data-guid") || "";
          navigator.clipboard.writeText(guidVal);
          this.showToast(`Copied GUID "${guidVal}" to clipboard`);
        });
      }

      // Card click / Focus event
      card.addEventListener("click", () => {
        this.selectAndFocusItem(item);
      });

      // Isolate button
      card.querySelector(".btn-res-isolate")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.isolateSingleElement(item);
      });

      // X-Ray button
      card.querySelector(".btn-res-xray")?.addEventListener("click", (e) => {
        e.stopPropagation();
        AnnotationModule.getInstance().toggleXRay();
        this.showToast("Toggled X-Ray Mode");
      });

      // Pin button
      card.querySelector(".btn-res-pin")?.addEventListener("click", (e) => {
        e.stopPropagation();
        this.pinAnnotationToElement(item);
      });

      fragment.appendChild(card);
    }

    if (results.length > displayLimit) {
      const moreNote = document.createElement("div");
      moreNote.className = "search-more-notice";
      moreNote.textContent = `Showing first ${displayLimit} of ${results.length.toLocaleString()} matching elements. Use batch actions to select or isolate all.`;
      fragment.appendChild(moreNote);
    }

    this.resultsContainer.appendChild(fragment);
  }

  private findMatchingContextSnippet(item: BimSearchItem, query: string): string {
    if (!query) return "";
    const qLower = query.toLowerCase();

    // Check Property Sets
    for (const psetName in item.psets) {
      const pset = item.psets[psetName];
      for (const propName in pset) {
        const propVal = String(pset[propName]);
        if (propName.toLowerCase().includes(qLower) || propVal.toLowerCase().includes(qLower)) {
          return `<code>${psetName}</code> ➔ <strong>${this.highlightQueryText(propName, query)}</strong>: "${this.highlightQueryText(propVal, query)}"`;
        }
      }
    }

    // Check GUID
    if (item.guid && item.guid.toLowerCase().includes(qLower)) {
      return `Matched in GlobalId: <code>${this.highlightQueryText(item.guid, query)}</code>`;
    }

    return "";
  }

  private highlightQueryText(text: string, query: string): string {
    if (!query || !text) return text || "";
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");
    return text.replace(regex, `<mark class="search-highlight-mark">$1</mark>`);
  }

  private renderEmptyOrInitialView() {
    const totalIndexed = this.searchIndex.length;
    this.resultsContainer.innerHTML = `
      <div class="search-initial-guide">
        <div class="guide-grid">
          <div class="guide-card">
            <span class="guide-icon">🔑</span>
            <div class="guide-card-title">Search by IFC GUID</div>
            <div class="guide-card-text">Paste exact or partial 22-char IFC GlobalId strings or UUIDs.</div>
          </div>
          <div class="guide-card">
            <span class="guide-icon">🏷️</span>
            <div class="guide-card-title">Search by Element Name</div>
            <div class="guide-card-text">Find Wall Types, Door specifications, Beam profiles, or Room tags.</div>
          </div>
          <div class="guide-card">
            <span class="guide-icon">📊</span>
            <div class="guide-card-title">Search Property Values</div>
            <div class="guide-card-text">Search property values like <code>FireRating: 120</code>, <code>LoadBearing: TRUE</code>, or <code>Concrete</code>.</div>
          </div>
        </div>
        <div class="guide-footer-status">
          ${totalIndexed > 0 
            ? `⚡ Fast Indexed: ${totalIndexed.toLocaleString()} BIM elements ready across ${this.engine.fragments.list.size} models.` 
            : `ℹ️ Load an IFC model to begin searching elements.`}
        </div>
      </div>
    `;
  }

  private renderCategoryChips() {
    this.categoryChipsContainer.innerHTML = "";
    const counts: Record<string, number> = { All: this.searchIndex.length };

    for (const item of this.searchIndex) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }

    const categories = ["All", "Walls", "Doors", "Windows", "Slabs", "Columns", "Beams", "Roofs", "Stairs", "Spaces", "MEP", "Furniture", "Structure"];

    for (const cat of categories) {
      const count = counts[cat] || 0;
      if (cat !== "All" && count === 0) continue;

      const chip = document.createElement("button");
      chip.className = `search-cat-chip ${this.activeCategoryFilter === cat ? "active" : ""}`;
      chip.innerHTML = `
        <span>${cat}</span>
        <span class="cat-count-badge">${count}</span>
      `;

      chip.addEventListener("click", () => {
        this.activeCategoryFilter = cat;
        this.categoryChipsContainer.querySelectorAll(".search-cat-chip").forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        this.executeSearch(this.searchInput.value.trim());
      });

      this.categoryChipsContainer.appendChild(chip);
    }
  }

  private navigateResults(direction: number) {
    const cards = this.resultsContainer.querySelectorAll(".bim-result-card");
    if (cards.length === 0) return;

    cards.forEach((c) => c.classList.remove("selected"));
    this.selectedResultIndex = (this.selectedResultIndex + direction + cards.length) % cards.length;

    const selectedCard = cards[this.selectedResultIndex] as HTMLElement;
    if (selectedCard) {
      selectedCard.classList.add("selected");
      selectedCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  private activateSelectedResult() {
    if (this.lastResults[this.selectedResultIndex]) {
      this.selectAndFocusItem(this.lastResults[this.selectedResultIndex]);
    }
  }

  /**
   * Action: Select, highlight in 3D, and zoom camera to element
   */
  public async selectAndFocusItem(item: BimSearchItem) {
    try {
      const highlighter = this.engine.highlighter;
      const modelIdMap = { [item.modelId]: new Set([item.expressId]) };

      // Highlight element in 3D viewport
      if (highlighter) {
        await highlighter.highlightByID("select", modelIdMap, true, false);
      }

      // Display in Properties inspector panel
      const model = this.engine.fragments.list.get(item.modelId);
      if (model && typeof (window as any).displayElementProperties === "function") {
        (window as any).displayElementProperties(model, item.expressId);
      }

      // Camera Focus using BoundingBoxer
      try {
        const boundingBoxer = this.engine.components.get(OBC.BoundingBoxer);
        boundingBoxer.list.clear();
        await boundingBoxer.addFromModelIdMap(modelIdMap);
        const box = boundingBoxer.get();
        if (!box.isEmpty() && this.engine.world?.camera && (this.engine.world.camera as any).controls) {
          await (this.engine.world.camera as any).controls.fitToBox(box, true);
        }
        boundingBoxer.list.clear();
      } catch (e) {
        console.warn("BoundingBoxer fit fallback:", e);
      }

      this.showToast(`Focused on ${item.name} (#${item.expressId})`);

      // If not pinned, automatically close overlay
      if (!this.isPinned) {
        this.close();
      }
    } catch (err) {
      console.error("Error focusing search item:", err);
    }
  }

  /**
   * Action: Isolate single element
   */
  public async isolateSingleElement(item: BimSearchItem) {
    try {
      const hider = this.engine.components.get(OBC.Hider);
      const highlighter = this.engine.highlighter;
      const modelIdMap = { [item.modelId]: new Set([item.expressId]) };

      await hider.isolate(modelIdMap);
      if (highlighter) {
        await highlighter.highlightByID("select", modelIdMap, true, false);
      }

      // Zoom
      try {
        const boundingBoxer = this.engine.components.get(OBC.BoundingBoxer);
        boundingBoxer.list.clear();
        await boundingBoxer.addFromModelIdMap(modelIdMap);
        const box = boundingBoxer.get();
        if (this.engine.world?.camera && (this.engine.world.camera as any).controls) {
          await (this.engine.world.camera as any).controls.fitToBox(box, true);
        }
        boundingBoxer.list.clear();
      } catch (e) {}

      this.showToast(`Isolated ${item.name}`);
    } catch (err) {
      console.warn("Isolate failed:", err);
    }
  }

  /**
   * Action: Batch Select all search matches
   */
  public async batchSelectAll() {
    if (this.lastResults.length === 0) return;
    const modelIdMap: Record<string, Set<number>> = {};

    for (const item of this.lastResults) {
      if (!modelIdMap[item.modelId]) modelIdMap[item.modelId] = new Set();
      modelIdMap[item.modelId].add(item.expressId);
    }

    try {
      const highlighter = this.engine.highlighter;
      if (highlighter) {
        await highlighter.highlightByID("select", modelIdMap, true, false);
      }

      // Zoom to fit all matched elements
      const boundingBoxer = this.engine.components.get(OBC.BoundingBoxer);
      boundingBoxer.list.clear();
      await boundingBoxer.addFromModelIdMap(modelIdMap);
      const box = boundingBoxer.get();
      if (!box.isEmpty() && this.engine.world?.camera && (this.engine.world.camera as any).controls) {
        await (this.engine.world.camera as any).controls.fitToBox(box, true);
      }
      boundingBoxer.list.clear();

      this.showToast(`Selected all ${this.lastResults.length.toLocaleString()} matching elements`);
    } catch (err) {
      console.warn("Batch select failed:", err);
    }
  }

  /**
   * Action: Batch Isolate all search matches
   */
  public async batchIsolateAll() {
    if (this.lastResults.length === 0) return;
    const modelIdMap: Record<string, Set<number>> = {};

    for (const item of this.lastResults) {
      if (!modelIdMap[item.modelId]) modelIdMap[item.modelId] = new Set();
      modelIdMap[item.modelId].add(item.expressId);
    }

    try {
      const hider = this.engine.components.get(OBC.Hider);
      await hider.isolate(modelIdMap);

      const boundingBoxer = this.engine.components.get(OBC.BoundingBoxer);
      boundingBoxer.list.clear();
      await boundingBoxer.addFromModelIdMap(modelIdMap);
      const box = boundingBoxer.get();
      if (!box.isEmpty() && this.engine.world?.camera && (this.engine.world.camera as any).controls) {
        await (this.engine.world.camera as any).controls.fitToBox(box, true);
      }
      boundingBoxer.list.clear();

      this.showToast(`Isolated ${this.lastResults.length.toLocaleString()} matching elements`);
    } catch (err) {
      console.warn("Batch isolate failed:", err);
    }
  }

  /**
   * Action: Batch Highlight in a specific color preset
   */
  public async batchHighlightAll(colorStyle: string = "Gold") {
    if (this.lastResults.length === 0) return;
    const modelIdMap: Record<string, Set<number>> = {};

    for (const item of this.lastResults) {
      if (!modelIdMap[item.modelId]) modelIdMap[item.modelId] = new Set();
      modelIdMap[item.modelId].add(item.expressId);
    }

    try {
      const highlighter = this.engine.highlighter;
      if (highlighter) {
        await highlighter.highlightByID(colorStyle, modelIdMap, false);
      }
      this.showToast(`Applied ${colorStyle} Highlight to ${this.lastResults.length} matches`);
    } catch (err) {
      console.warn("Highlight style failed:", err);
    }
  }

  /**
   * Action: Export search results to CSV spreadsheet
   */
  public exportResultsToCSV() {
    if (this.lastResults.length === 0) {
      this.showToast("No results to export");
      return;
    }

    const headers = ["Model", "ExpressID", "GlobalID", "Name", "IFC Type", "Category", "Matched Properties"];
    const rows = this.lastResults.map((item) => {
      let psetSummary = "";
      for (const psetName in item.psets) {
        for (const k in item.psets[psetName]) {
          psetSummary += `${psetName}.${k}=${item.psets[psetName][k]}; `;
        }
      }
      return [
        `"${item.modelName.replace(/"/g, '""')}"`,
        item.expressId,
        `"${item.guid}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.ifcType}"`,
        `"${item.category}"`,
        `"${psetSummary.replace(/"/g, '""')}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `BIM_Search_Results_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(`Exported ${this.lastResults.length} results to CSV`);
  }

  /**
   * Action: Reset Scene Visibility and selection
   */
  public async resetSceneVisibility() {
    try {
      const hider = this.engine.components.get(OBC.Hider);
      await hider.set(true);
      const highlighter = this.engine.highlighter;
      if (highlighter) {
        await highlighter.clear("select");
      }
      this.showToast("Restored all elements visibility");
    } catch (e) {}
  }

  /**
   * Action: Add 3D Pin Annotation for item
   */
  private pinAnnotationToElement(item: BimSearchItem) {
    try {
      const target = new THREE.Vector3();
      if (this.engine.world?.camera && (this.engine.world.camera as any).controls) {
        (this.engine.world.camera as any).controls.getTarget(target);
      }
      AnnotationModule.getInstance().addAnnotation(
        target,
        item.name,
        `Found via Global BIM Search. GUID: ${item.guid || 'N/A'}`,
        "Inspection",
        item.modelId,
        item.expressId,
        item.name
      );
      this.showToast(`Placed 3D Pin on ${item.name}`);
    } catch (err) {
      console.warn("Pin placement failed:", err);
    }
  }

  private getCategoryIcon(cat: string): string {
    switch (cat) {
      case "Walls": return `🧱`;
      case "Doors": return `🚪`;
      case "Windows": return `🪟`;
      case "Slabs": return `⬜`;
      case "Columns": return `🏛️`;
      case "Beams": return `🏗️`;
      case "Roofs": return `🏠`;
      case "Stairs": return `🪜`;
      case "Spaces": return `📦`;
      case "MEP": return `⚡`;
      case "Furniture": return `🪑`;
      default: return `🔹`;
    }
  }

  private renderRecentSearches() {
    const listEl = this.overlayEl.querySelector("#bim-search-recent-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    if (this.recentSearches.length === 0) {
      listEl.innerHTML = `<span class="recent-empty">No recent searches yet</span>`;
      return;
    }

    this.recentSearches.forEach((term) => {
      const chip = document.createElement("button");
      chip.className = "recent-term-chip";
      chip.innerHTML = `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span>${term}</span>
      `;
      chip.addEventListener("click", () => {
        this.searchInput.value = term;
        this.overlayEl.querySelector("#btn-search-clear")?.classList.remove("hidden");
        this.searchInput.focus();
        this.executeSearch(term);
      });
      listEl.appendChild(chip);
    });
  }

  private loadRecentSearches() {
    try {
      const data = localStorage.getItem("bim_recent_searches");
      if (data) this.recentSearches = JSON.parse(data);
    } catch (e) {
      this.recentSearches = [];
    }
  }

  private saveRecentSearches() {
    try {
      localStorage.setItem("bim_recent_searches", JSON.stringify(this.recentSearches));
    } catch (e) {}
  }

  private showToast(msg: string) {
    if (typeof (window as any).showToast === "function") {
      (window as any).showToast(msg, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`);
    }
  }
}
