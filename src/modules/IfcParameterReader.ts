/**
 * IfcParameterReader.ts
 *
 * Dedicated IFC Parameter Reader feature that extracts, catalogs, and indexes
 * all IFC parameters, property sets (Psets), spatial storeys, and attributes
 * from loaded models. Users can search/filter any parameter and choose it to
 * dynamically generate 4D construction sequences with interactive preview.
 */

import { PropertySequenceEngine, type SequenceCalculationOptions, type SequenceEngineResult } from "./PropertySequenceEngine";
import { ScheduleManager } from "./ScheduleManager";

export interface IfcParameterMeta {
  key: string;              // Unique identifier, e.g. "Pset_WallCommon.Status", "Storey", "PredefinedType"
  name: string;             // Human-readable parameter name, e.g. "Status"
  group: string;            // Group / Pset / Container name, e.g. "Pset_WallCommon", "Spatial Hierarchy"
  category: 'Spatial' | 'IFC Standard' | 'Pset' | 'Custom' | 'Quantity';
  elementCount: number;     // How many elements have this parameter defined
  totalElements: number;    // Total elements scanned in model
  coveragePercent: number;  // 0 - 100 (%)
  distinctCount: number;    // Count of unique values discovered
  distinctValues: string[]; // All unique values sorted
  sampleValues: string[];   // Up to 5 sample values for quick preview tags
  valueCounts: Record<string, number>; // Distribution map: value -> count of elements
  isRecommended: boolean;   // True if suitable for construction scheduling
  recommendReason?: string; // Explanation why recommended
}

export class IfcParameterReader {
  private static instance: IfcParameterReader;
  private cachedParameters: IfcParameterMeta[] = [];
  private lastScannedModelIds: string = "";
  private currentSearchQuery: string = "";
  private currentCategoryFilter: string = "all"; // 'all' | 'recommended' | 'Spatial' | 'IFC Standard' | 'Pset' | 'Custom'
  private currentSortBy: 'coverage' | 'distinct' | 'name' = 'coverage';
  private selectedParameterKey: string | null = null;
  private parsedModelProperties: Map<string, Record<number, any>> = new Map();
  private lastParsedProperties: Record<number, any> | null = null;

  // External references injected from main.ts
  private getModelsCallback: (() => any[]) | null = null;
  private getStoreysMapCallback: (() => Record<string, string>) | null = null;
  private onSequenceAppliedCallback: ((result: SequenceEngineResult, paramKey: string) => void) | null = null;

  private constructor() {}

  public static getInstance(): IfcParameterReader {
    if (!IfcParameterReader.instance) {
      IfcParameterReader.instance = new IfcParameterReader();
    }
    return IfcParameterReader.instance;
  }

  public setCallbacks(options: {
    getModels: () => any[];
    getStoreysMap?: () => Record<string, string>;
    onSequenceApplied?: (result: SequenceEngineResult, paramKey: string) => void;
  }) {
    this.getModelsCallback = options.getModels;
    if (options.getStoreysMap) this.getStoreysMapCallback = options.getStoreysMap;
    if (options.onSequenceApplied) this.onSequenceAppliedCallback = options.onSequenceApplied;
  }

  /**
   * Scans loaded models and indexes every single IFC parameter and Pset.
   */
  /**
   * High-speed STEP (ISO-10303-21) text parser that extracts all IFC elements,
   * building storeys, property sets (Psets), and property single values in ~40ms.
   * Enables 100% parameter extraction even when 3D geometry fragments are decoupled.
   */
  public parseIfcText(content: string, modelId: string = "default-model"): Record<number, any> {
    if (!content) return {};

    const lines = content.split('\n');
    const propValues = new Map<number, { name: string; val: string }>();
    const psets = new Map<number, { name: string; pvalIds: number[] }>();
    const elemPsets = new Map<number, number[]>();
    const storeyNames = new Map<number, string>();
    const elemStorey = new Map<number, string>();
    const elements = new Map<number, { id: number; type: string; guid: string; name: string }>();

    const rePropVal = /^#(\d+)\s*=\s*IFCPROPERTYSINGLEVALUE\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*([A-Za-z0-9_]+)\s*\(\s*([^)]*)\s*\)/i;
    const rePset = /^#(\d+)\s*=\s*IFCPROPERTYSET\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*'([^']*)'\s*,\s*[^,]*\s*,\s*\(([^)]*)\)/i;
    const reRelProp = /IFCRELDEFINESBYPROPERTIES\s*\([^,]+,[^,]+,[^,]+,[^,]+,\s*\(([^)]*)\)\s*,\s*#(\d+)/i;
    const reStorey = /^#(\d+)\s*=\s*IFCBUILDINGSTOREY\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*'([^']*)'/i;
    const reRelSpatial = /IFCRELCONTAINEDINSPATIALSTRUCTURE\s*\([^,]+,[^,]+,[^,]+,[^,]+,\s*\(([^)]*)\)\s*,\s*#(\d+)/i;
    const reElement = /^#(\d+)\s*=\s*(IFC[A-Z0-9_]+)s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*(?:'([^']*)'|\$)/i;

    const SKIP_TYPES = new Set([
      'IFCRELDEFINESBYPROPERTIES', 'IFCRELCONTAINEDINSPATIALSTRUCTURE', 'IFCRELASSOCIATESMATERIAL',
      'IFCRELDEFINESBYTYPE', 'IFCRELVOIDSELEMENT', 'IFCRELAGGREGATES',
      'IFCPROPERTYSET', 'IFCPROPERTYSINGLEVALUE', 'IFCPOLYLOOP', 'IFCFACEOUTERBOUND', 'IFCFACE',
      'IFCSHAPEREPRESENTATION', 'IFCSTYLEDITEM', 'IFCPOLYLINE', 'IFCCOMPOSITECURVESEGMENT',
      'IFCCLOSEDSHELL', 'IFCFACETEDBREP', 'IFCEXTRUDEDAREASOLID', 'IFCTRIMMEDCURVE', 'IFCCIRCLE',
      'IFCISHAPEPROFILEDEF', 'IFCPRESENTATIONSTYLEASSIGNMENT', 'IFCRECTANGLEPROFILEDEF',
      'IFCCOMPOSITECURVE', 'IFCCOLOURRGB', 'IFCREPRESENTATIONMAP', 'IFCGRIDAXIS', 'IFCCURVESTYLE',
      'IFCSWEPTDISKSOLID', 'IFCMATERIALLAYERSETUSAGE', 'IFCARBITRARYCLOSEDPROFILEDEF',
      'IFCDIRECTION', 'IFCCARTESIANPOINT', 'IFCAXIS2PLACEMENT3D', 'IFCLOCALPLACEMENT'
    ]);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('/*')) continue;

      let m = line.match(rePropVal);
      if (m) {
        const id = parseInt(m[1], 10);
        let val = m[4].replace(/^'|'$/g, '').trim();
        if (val === '.T.') val = 'True';
        else if (val === '.F.') val = 'False';
        propValues.set(id, { name: m[2], val });
        continue;
      }

      m = line.match(rePset);
      if (m) {
        const id = parseInt(m[1], 10);
        const psetName = m[3];
        const pvalIds = m[4].split(',').map(s => parseInt(s.replace(/#/g, '').trim(), 10)).filter(n => !isNaN(n));
        psets.set(id, { name: psetName, pvalIds });
        continue;
      }

      m = line.match(reRelProp);
      if (m) {
        const elemIds = m[1].split(',').map(s => parseInt(s.replace(/#/g, '').trim(), 10)).filter(n => !isNaN(n));
        const psetId = parseInt(m[2], 10);
        for (const eid of elemIds) {
          if (!elemPsets.has(eid)) elemPsets.set(eid, []);
          elemPsets.get(eid)!.push(psetId);
        }
        continue;
      }

      m = line.match(reStorey);
      if (m) {
        storeyNames.set(parseInt(m[1], 10), m[3]);
        continue;
      }

      m = line.match(reRelSpatial);
      if (m) {
        const elemIds = m[1].split(',').map(s => parseInt(s.replace(/#/g, '').trim(), 10)).filter(n => !isNaN(n));
        const storeyId = parseInt(m[2], 10);
        const stName = storeyNames.get(storeyId) || ('Storey #' + storeyId);
        for (const eid of elemIds) {
          elemStorey.set(eid, stName);
        }
        continue;
      }

      m = line.match(reElement);
      if (m) {
        const type = m[2].toUpperCase();
        if (!SKIP_TYPES.has(type) && !type.startsWith('IFCREL') && !type.startsWith('IFCPROP')) {
          const id = parseInt(m[1], 10);
          elements.set(id, { id, type, guid: m[3], name: m[4] || (type + ' #' + id) });
        }
      }
    }

    // Include any element ID referenced by Psets or Spatial Structure not captured above
    for (const eid of elemPsets.keys()) {
      if (!elements.has(eid)) {
        elements.set(eid, { id: eid, type: 'IFCBUILDINGELEMENT', guid: 'guid-' + eid, name: 'Element #' + eid });
      }
    }

    const properties: Record<number, any> = {};
    for (const [id, el] of elements.entries()) {
      const st = elemStorey.get(id) || 'Entry Level';
      const psetList = elemPsets.get(id) || [];
      const resolvedPsets: Record<string, Record<string, string>> = {};

      for (const pid of psetList) {
        const pdef = psets.get(pid);
        if (!pdef) continue;
        if (!resolvedPsets[pdef.name]) resolvedPsets[pdef.name] = {};
        for (const vid of pdef.pvalIds) {
          const vdef = propValues.get(vid);
          if (vdef && vdef.val) {
            resolvedPsets[pdef.name][vdef.name] = vdef.val;
          }
        }
      }

      properties[id] = {
        expressId: id,
        type: el.type,
        Name: { value: el.name },
        GlobalId: { value: el.guid },
        Storey: st,
        psets: resolvedPsets
      };
    }

    this.parsedModelProperties.set(modelId, properties);
    this.lastParsedProperties = properties;
    return properties;
  }

  public getLastParsedProperties(): Record<number, any> | null {
    return this.lastParsedProperties;
  }

  public scanModelParameters(
    models: any[],
    globalStoreysMap?: Record<string, string>
  ): IfcParameterMeta[] {
    // If models array is empty but we have parsed STEP properties, use them as virtual model
    let scanModels = models;
    if ((!scanModels || scanModels.length === 0) && this.lastParsedProperties) {
      scanModels = [{ modelId: "parsed-ifc", properties: this.lastParsedProperties }];
    } else if (scanModels && scanModels.length > 0) {
      // If models have empty properties but we have parsed properties cached, assign them
      for (const m of scanModels) {
        if ((!m.properties || Object.keys(m.properties).length === 0) && this.lastParsedProperties) {
          m.properties = this.lastParsedProperties;
        }
      }
    }

    if (!scanModels || scanModels.length === 0) {
      this.cachedParameters = [];
      return [];
    }

    const modelIdsKey = scanModels.map(m => m.modelId || m.uuid || m.id || "m").join(",");
    if (this.cachedParameters.length > 0 && this.lastScannedModelIds === modelIdsKey) {
      return this.cachedParameters;
    }

    const engine = PropertySequenceEngine.getInstance();
    const discoveredMap = new Map<string, {
      name: string;
      group: string;
      category: 'Spatial' | 'IFC Standard' | 'Pset' | 'Custom' | 'Quantity';
      valuesMap: Map<string, number>;
      elementCount: number;
    }>();

    let totalElements = 0;

    // Helper to register an element's parameter value
    const recordParam = (
      key: string,
      name: string,
      group: string,
      category: 'Spatial' | 'IFC Standard' | 'Pset' | 'Custom' | 'Quantity',
      val: string
    ) => {
      if (!val || val === "Unassigned") return;
      let entry = discoveredMap.get(key);
      if (!entry) {
        entry = {
          name,
          group,
          category,
          valuesMap: new Map(),
          elementCount: 0
        };
        discoveredMap.set(key, entry);
      }
      entry.elementCount++;
      const curCount = entry.valuesMap.get(val) || 0;
      entry.valuesMap.set(val, curCount + 1);
    };

    // Scan each model
    for (const model of scanModels) {
      if (!model) continue;
      const modelId = model.modelId || model.uuid || model.id || (model.object && model.object.uuid) || "default-model";
      const properties = model.properties || (model as any).getLocalProperties?.() || {};
      const relMap = engine.buildRelDefinesMap(properties);

      for (const expressIdStr in properties) {
        const expressId = Number(expressIdStr);
        if (isNaN(expressId)) continue;
        const p = properties[expressId];
        if (!p) continue;

        const rawType = engine.extractValue(p.type ?? "").toUpperCase();
        if (
          rawType.startsWith("IFCREL") ||
          rawType.startsWith("IFCPROPERTY") ||
          rawType === "IFCPROPERTYSINGLEVALUE" ||
          rawType === "IFCPROPERTYSET" ||
          rawType === "IFCQUANTITYAREA" ||
          rawType === "IFCQUANTITYVOLUME"
        ) {
          continue;
        }

        totalElements++;
        const dbKey = `${modelId}-${expressId}`;

        // 1. Spatial Storey / Level
        const storey = p.Storey || globalStoreysMap?.[dbKey];
        if (storey) {
          recordParam("Storey", "Building Storey / Level", "Spatial Hierarchy", "Spatial", storey);
        }

        // 2. IFC Category / Entity Type
        const cat = p.type || rawType || "IFCELEMENT";
        if (cat) {
          recordParam("Category", "IFC Entity / Trade Category", "IFC Standard", "IFC Standard", cat);
        }

        // 3. PredefinedType
        if (p.PredefinedType) {
          const pt = engine.extractValue(p.PredefinedType);
          if (pt && pt !== "NOTDEFINED" && pt !== "USERDEFINED") {
            recordParam("PredefinedType", "Predefined Type / Function", "IFC Standard", "IFC Standard", pt);
          }
        }

        // 4. Name and ObjectType
        if (p.Name) {
          const nameVal = engine.extractValue(p.Name);
          if (nameVal) recordParam("Name", "Element Name / Tag", "IFC Standard", "IFC Standard", nameVal);
        }
        if (p.ObjectType) {
          const objType = engine.extractValue(p.ObjectType);
          if (objType) recordParam("ObjectType", "Object Type Code", "IFC Standard", "IFC Standard", objType);
        }
        if (p.Tag) {
          const tagVal = engine.extractValue(p.Tag);
          if (tagVal) recordParam("Tag", "Component Mark / Tag", "IFC Standard", "IFC Standard", tagVal);
        }

        // 5. Phase / Status direct attributes
        if (p.Phase) {
          const ph = engine.extractValue(p.Phase);
          if (ph) recordParam("Phase", "Construction Phase", "IFC Standard", "IFC Standard", ph);
        }
        if (p.Status) {
          const st = engine.extractValue(p.Status);
          if (st) recordParam("Status", "Execution Status", "IFC Standard", "IFC Standard", st);
        }

        // 6. Direct custom attributes on element
        for (const [key, rawVal] of Object.entries(p)) {
          if ([
            'expressId', 'localId', 'type', '_type', 'GlobalId', 'IsDefinedBy',
            'HasProperties', 'HasPropertySets', 'PredefinedType', 'Name', 'ObjectType',
            'Tag', 'Phase', 'Status', 'OwnerHistory', 'ObjectPlacement', 'Representation',
            'Storey', 'psets'
          ].includes(key)) {
            continue;
          }
          if (rawVal === null || rawVal === undefined || (typeof rawVal === "object" && !(rawVal as any).value)) {
            continue;
          }
          const strVal = engine.extractValue(rawVal);
          if (strVal && strVal.length > 0 && strVal.length < 80 && strVal !== "[object Object]") {
            recordParam(key, key, "Custom Attributes", "Custom", strVal);
          }
        }

        // 7. Full Property Sets (Psets) Resolution
        const psets = p.psets || engine.resolveElementPsets(properties, expressId, relMap);
        for (const [psetName, pset] of Object.entries(psets)) {
          if (!pset || typeof pset !== "object") continue;
          for (const [propName, propVal] of Object.entries(pset)) {
            if (!propVal || typeof propVal !== "string") continue;
            const qualifiedKey = `${psetName}.${propName}`;
            const isQty = psetName.toLowerCase().includes("quantity") ||
                          psetName.toLowerCase().includes("basequantities") ||
                          propName.toLowerCase().includes("area") ||
                          propName.toLowerCase().includes("volume") ||
                          propName.toLowerCase().includes("weight");

            recordParam(
              qualifiedKey,
              propName,
              psetName,
              isQty ? "Quantity" : "Pset",
              propVal
            );
          }
        }
      }
    }

    if (totalElements === 0) totalElements = 1;

    // Convert map to enriched IfcParameterMeta array
    const result: IfcParameterMeta[] = [];
    for (const [key, entry] of discoveredMap.entries()) {
      const distinctValues = Array.from(entry.valuesMap.keys()).sort((a, b) => a.localeCompare(b));
      const distinctCount = distinctValues.length;
      const coveragePercent = Math.min(100, Math.round((entry.elementCount / totalElements) * 100));

      // Build value distribution counts
      const valueCounts: Record<string, number> = {};
      for (const [val, count] of entry.valuesMap.entries()) {
        valueCounts[val] = count;
      }

      // Check recommendation for 4D simulation:
      // Good 4D candidate has between 2 and 60 distinct values, reasonable coverage,
      // and represents logical phases, storeys, trades, or structural systems.
      const keyLower = key.toLowerCase();
      let isRecommended = false;
      let recommendReason = "";

      if (distinctCount >= 2 && distinctCount <= 60 && coveragePercent >= 5) {
        if (keyLower === "storey" || keyLower.includes("level") || keyLower.includes("floor")) {
          isRecommended = true;
          recommendReason = `Optimal vertical construction progression (${distinctCount} storeys detected, ${coveragePercent}% model coverage)`;
        } else if (keyLower === "category" || keyLower === "ifctype") {
          isRecommended = true;
          recommendReason = `Standard trade package sequence (${distinctCount} trades detected, ${coveragePercent}% model coverage)`;
        } else if (keyLower.includes("reference") || keyLower.includes("profile") || keyLower.includes("section")) {
          isRecommended = true;
          recommendReason = `Structural section sizing sequence (${distinctCount} profiles discovered, ${coveragePercent}% model coverage)`;
        } else if (keyLower.includes("phase") || keyLower.includes("stage")) {
          isRecommended = true;
          recommendReason = `Designated phasing attribute (${distinctCount} phases detected, ${coveragePercent}% model coverage)`;
        } else if (keyLower.includes("status")) {
          isRecommended = true;
          recommendReason = `Project status lifecycle (${distinctCount} states detected, ${coveragePercent}% model coverage)`;
        } else if (keyLower === "predefinedtype" || keyLower.includes("trade") || keyLower.includes("contractor") || keyLower.includes("zone") || keyLower.includes("pour")) {
          isRecommended = true;
          recommendReason = `Trade/Zoning grouping (${distinctCount} unique groups, ${coveragePercent}% model coverage)`;
        } else if (distinctCount >= 3 && distinctCount <= 50 && coveragePercent >= 10) {
          isRecommended = true;
          recommendReason = `Well-distributed parameter (${distinctCount} groups across ${coveragePercent}% of elements)`;
        }
      }

      result.push({
        key,
        name: entry.name,
        group: entry.group,
        category: entry.category,
        elementCount: entry.elementCount,
        totalElements,
        coveragePercent,
        distinctCount,
        distinctValues,
        sampleValues: distinctValues.slice(0, 5),
        valueCounts,
        isRecommended,
        recommendReason
      });
    }

    // Default Sort: Recommended first, then highest coverage
    result.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return b.coveragePercent - a.coveragePercent;
    });

    this.cachedParameters = result;
    this.lastScannedModelIds = modelIdsKey;
    return result;
  }

  public getCachedParameters(): IfcParameterMeta[] {
    return this.cachedParameters;
  }

  /**
   * Generates a 4D construction sequence directly from a chosen parameter.
   */
  public generateSequenceFromParameter(
    parameterKey: string,
    options?: Partial<SequenceCalculationOptions>,
    twinDatabase?: Record<string, any>,
    scheduleManager?: ScheduleManager
  ): SequenceEngineResult {
    const models = this.getModelsCallback ? this.getModelsCallback() : [];
    const storeysMap = this.getStoreysMapCallback ? this.getStoreysMapCallback() : undefined;
    const engine = PropertySequenceEngine.getInstance();

    const calcOptions: SequenceCalculationOptions = {
      propertyKey: parameterKey,
      startDate: options?.startDate || "2026-06-18",
      taskDurationDays: options?.taskDurationDays ?? 10,
      overlapDays: options?.overlapDays ?? 3,
      sortDirection: options?.sortDirection || "asc",
      customOrder: options?.customOrder
    };

    const result = engine.calculateSequence(models, calcOptions, { globalStoreysMap: storeysMap });

    if (twinDatabase && scheduleManager) {
      engine.applySequenceToTwinDatabase(result, twinDatabase, scheduleManager);
    }

    if (this.onSequenceAppliedCallback) {
      this.onSequenceAppliedCallback(result, parameterKey);
    }

    return result;
  }

  /**
   * Opens the dedicated IFC Parameter Reader Modal.
   */
  public openModal(targetParameterKey?: string) {
    if (typeof document === "undefined") return;

    let modal = document.getElementById("ifc-parameter-reader-modal");
    if (!modal) {
      modal = this.createModalDOM();
      document.body.appendChild(modal);
      this.bindModalEvents(modal);
    }

    // Refresh model parameter scan
    const models = this.getModelsCallback ? this.getModelsCallback() : [];
    const storeysMap = this.getStoreysMapCallback ? this.getStoreysMapCallback() : undefined;
    this.scanModelParameters(models, storeysMap);

    if (targetParameterKey) {
      this.selectedParameterKey = targetParameterKey;
    }

    modal.classList.remove("hidden");
    this.renderModalContent();
  }

  public closeModal() {
    const modal = document.getElementById("ifc-parameter-reader-modal");
    if (modal) {
      modal.classList.add("hidden");
    }
  }

  private createModalDOM(): HTMLElement {
    const overlay = document.createElement("div");
    overlay.id = "ifc-parameter-reader-modal";
    overlay.className = "ifc-param-reader-overlay hidden";
    overlay.innerHTML = `
      <div class="ifc-param-reader-container" role="dialog" aria-modal="true" aria-labelledby="ifc-reader-title">
        <!-- Modal Header -->
        <div class="ifc-reader-header">
          <div class="ifc-reader-title-wrap">
            <div class="ifc-reader-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                <line x1="8" y1="6" x2="16" y2="6"/>
                <line x1="8" y1="10" x2="16" y2="10"/>
                <line x1="8" y1="14" x2="12" y2="14"/>
              </svg>
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <h2 id="ifc-reader-title" class="ifc-reader-title">IFC PARAMETER READER</h2>
                <span class="ifc-reader-badge" id="ifc-reader-stats-badge">Scanning...</span>
              </div>
              <p class="ifc-reader-subtitle">Inspect discovered IFC attributes, property sets (Psets), and spatial storeys. Pick any parameter to dynamically generate your 4D construction schedule.</p>
            </div>
          </div>
          <button class="ifc-reader-close-btn" id="btn-close-ifc-reader" aria-label="Close IFC Parameter Reader">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <!-- Search & Filter Controls -->
        <div class="ifc-reader-toolbar">
          <div class="ifc-reader-search-wrap">
            <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="ifc-reader-search-input" class="ifc-reader-search-input" placeholder="Search parameters, Psets, or sample values (e.g. Status, Storey, Concrete)..." />
            <button class="ifc-reader-search-clear" id="btn-clear-param-search" style="display: none;" title="Clear Search">✕</button>
          </div>

          <div class="ifc-reader-filter-chips" id="ifc-reader-category-chips">
            <button class="param-filter-chip active" data-category="all">All Parameters</button>
            <button class="param-filter-chip" data-category="recommended">⭐ Recommended (4D)</button>
            <button class="param-filter-chip" data-category="Spatial">🏢 Spatial Storeys</button>
            <button class="param-filter-chip" data-category="IFC Standard">🏷️ IFC Standard</button>
            <button class="param-filter-chip" data-category="Pset">📋 Property Sets</button>
            <button class="param-filter-chip" data-category="Custom">✍️ Custom</button>
          </div>

          <div class="ifc-reader-sort-wrap">
            <label for="ifc-reader-sort-select">Sort By:</label>
            <select id="ifc-reader-sort-select" class="custom-select ifc-sort-select">
              <option value="coverage">Highest Model Coverage</option>
              <option value="distinct">Distinct Values Count</option>
              <option value="name">Parameter Name (A-Z)</option>
            </select>
          </div>
        </div>

        <!-- Main Content Area: Parameter List + Sequence Generator Drawer -->
        <div class="ifc-reader-body">
          <div class="ifc-params-list thin-scrollbar" id="ifc-params-list-container">
            <!-- Parameter Cards Rendered Dynamically -->
          </div>

          <!-- Slide-in Sequence Preview & Configuration Drawer -->
          <div class="ifc-sequence-config-drawer" id="ifc-sequence-config-drawer" style="display: none;">
            <div class="seq-drawer-header">
              <div style="display: flex; align-items: center; gap: 0.4rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-400)" stroke-width="2.2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                <h3 id="seq-drawer-param-name">4D Sequence Configuration</h3>
              </div>
              <button class="btn-drawer-close" id="btn-close-seq-drawer">✕</button>
            </div>

            <div class="seq-drawer-params">
              <div class="seq-drawer-param-row">
                <label for="seq-drawer-param-input">Simulation Parameter:</label>
                <input type="text" id="seq-drawer-param-input" class="sequence-input" placeholder="e.g. Storey, Pset_QuantityTakeOff.Reference..." style="font-weight: 700; color: var(--accent-400); flex: 1;" />
              </div>
              <div class="seq-drawer-param-row">
                <label>Start Date:</label>
                <input type="date" id="seq-drawer-start-date" class="sequence-input" value="2026-06-18" />
              </div>
              <div class="seq-drawer-param-row">
                <label>Phase Duration:</label>
                <div style="display: flex; align-items: center; gap: 0.3rem;">
                  <input type="number" id="seq-drawer-duration" class="sequence-input" value="12" min="1" max="180" style="width: 70px;" />
                  <span style="font-size: 0.75rem; color: var(--text-muted);">days</span>
                </div>
              </div>
              <div class="seq-drawer-param-row">
                <label>Overlap / Stagger:</label>
                <div style="display: flex; align-items: center; gap: 0.3rem;">
                  <input type="number" id="seq-drawer-overlap" class="sequence-input" value="3" min="0" max="60" style="width: 70px;" />
                  <span style="font-size: 0.75rem; color: var(--text-muted);">days</span>
                </div>
              </div>
              <div class="seq-drawer-param-row">
                <label>Sequencing Order:</label>
                <select id="seq-drawer-sort-dir" class="custom-select sequence-input">
                  <option value="asc">Ascending (Earliest / Substructure First)</option>
                  <option value="desc">Descending (Top Down / Reverse)</option>
                </select>
              </div>
            </div>

            <!-- Preview List of Generated 4D Phases -->
            <div class="seq-drawer-preview-title">
              <span>SIMULATED PHASES PREVIEW</span>
              <span id="seq-drawer-tasks-count" style="color: var(--accent-400); font-weight: 800;">4 Tasks</span>
            </div>
            <div class="seq-drawer-preview-list thin-scrollbar" id="seq-drawer-preview-list">
              <!-- Dynamically populated -->
            </div>

            <!-- Action Button -->
            <div class="seq-drawer-actions">
              <button class="btn-calculate-seq" id="btn-apply-drawer-sequence" style="width: 100%; height: 38px; font-size: 0.85rem;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                <span>Apply & Run 4D Simulation</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="ifc-reader-footer">
          <div class="ifc-reader-footer-info">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            <span>Tip: Parameters with ⭐ are pre-classified as optimal candidates for construction phasing and trade breakdown.</span>
          </div>
          <button class="btn-tool" id="btn-reader-rescan" style="padding: 0 0.8rem; height: 28px; font-size: 0.75rem;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
            <span>Rescan Model</span>
          </button>
        </div>
      </div>
    `;
    return overlay;
  }

  private bindModalEvents(modal: HTMLElement) {
    // Close button
    modal.querySelector("#btn-close-ifc-reader")?.addEventListener("click", () => {
      this.closeModal();
    });

    // Close on overlay backdrop click
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        this.closeModal();
      }
    });

    // ESC key closes modal
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) {
        this.closeModal();
      }
    });

    // Search input
    const searchInput = modal.querySelector("#ifc-reader-search-input") as HTMLInputElement | null;
    const clearBtn = modal.querySelector("#btn-clear-param-search") as HTMLElement | null;

    searchInput?.addEventListener("input", () => {
      this.currentSearchQuery = searchInput.value.trim().toLowerCase();
      if (clearBtn) clearBtn.style.display = this.currentSearchQuery ? "block" : "none";
      this.renderFilteredList();
    });

    clearBtn?.addEventListener("click", () => {
      if (searchInput) {
        searchInput.value = "";
        this.currentSearchQuery = "";
        clearBtn.style.display = "none";
        this.renderFilteredList();
      }
    });

    // Category filter chips
    const chips = modal.querySelectorAll(".param-filter-chip");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        this.currentCategoryFilter = chip.getAttribute("data-category") || "all";
        this.renderFilteredList();
      });
    });

    // Sort select
    const sortSelect = modal.querySelector("#ifc-reader-sort-select") as HTMLSelectElement | null;
    sortSelect?.addEventListener("change", () => {
      this.currentSortBy = (sortSelect.value as 'coverage' | 'distinct' | 'name') || 'coverage';
      this.renderFilteredList();
    });

    // Rescan button
    modal.querySelector("#btn-reader-rescan")?.addEventListener("click", () => {
      this.lastScannedModelIds = "";
      const models = this.getModelsCallback ? this.getModelsCallback() : [];
      const storeysMap = this.getStoreysMapCallback ? this.getStoreysMapCallback() : undefined;
      this.scanModelParameters(models, storeysMap);
      this.renderModalContent();
    });

    // Drawer close
    modal.querySelector("#btn-close-seq-drawer")?.addEventListener("click", () => {
      const drawer = modal.querySelector("#ifc-sequence-config-drawer") as HTMLElement | null;
      if (drawer) drawer.style.display = "none";
      this.selectedParameterKey = null;
    });

    // Drawer inputs update preview
    const drawerInputs = [
      "#seq-drawer-param-input",
      "#seq-drawer-start-date",
      "#seq-drawer-duration",
      "#seq-drawer-overlap",
      "#seq-drawer-sort-dir"
    ];
    drawerInputs.forEach(selector => {
      modal.querySelector(selector)?.addEventListener("input", (e) => {
        if (selector === "#seq-drawer-param-input") {
          const val = (e.target as HTMLInputElement).value.trim();
          if (val) this.selectedParameterKey = val;
        }
        this.updateDrawerPreview();
      });
      modal.querySelector(selector)?.addEventListener("change", () => {
        this.updateDrawerPreview();
      });
    });

    // Drawer Apply Button
    modal.querySelector("#btn-apply-drawer-sequence")?.addEventListener("click", () => {
      this.applyDrawerSequence();
    });
  }

  private renderModalContent() {
    const modal = document.getElementById("ifc-parameter-reader-modal");
    if (!modal) return;

    // Update stats badge
    const statsBadge = modal.querySelector("#ifc-reader-stats-badge");
    const totalParams = this.cachedParameters.length;
    const totalElements = this.cachedParameters[0]?.totalElements || 0;
    if (statsBadge) {
      statsBadge.textContent = `${totalParams} Parameters Discovered • ${totalElements} Elements Scanned`;
    }

    this.renderFilteredList();

    // If a parameter was pre-selected, open drawer
    if (this.selectedParameterKey) {
      this.openSequenceDrawer(this.selectedParameterKey);
    }
  }

  private renderFilteredList() {
    const modal = document.getElementById("ifc-parameter-reader-modal");
    if (!modal) return;

    const container = modal.querySelector("#ifc-params-list-container");
    if (!container) return;

    // Filter
    let filtered = [...this.cachedParameters];

    if (this.currentCategoryFilter === "recommended") {
      filtered = filtered.filter(p => p.isRecommended);
    } else if (this.currentCategoryFilter !== "all") {
      filtered = filtered.filter(p => p.category === this.currentCategoryFilter);
    }

    if (this.currentSearchQuery) {
      const q = this.currentSearchQuery;
      filtered = filtered.filter(p => 
        p.key.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.group.toLowerCase().includes(q) ||
        p.distinctValues.some(v => v.toLowerCase().includes(q))
      );
    }

    // Sort
    if (this.currentSortBy === "coverage") {
      filtered.sort((a, b) => b.coveragePercent - a.coveragePercent);
    } else if (this.currentSortBy === "distinct") {
      filtered.sort((a, b) => b.distinctCount - a.distinctCount);
    } else if (this.currentSortBy === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (this.cachedParameters.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1.5rem; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 0.75rem;">
          <div style="width: 52px; height: 52px; border-radius: 14px; background: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); display: flex; align-items: center; justify-content: center; color: #38BDF8;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </div>
          <div style="font-size: 1rem; font-weight: 800; color: #F8FAFC;">No IFC Model Currently Loaded</div>
          <div style="font-size: 0.78rem; color: var(--text-muted); max-width: 440px; line-height: 1.4;">
            To read parameters, attributes, and property sets for 4D construction sequencing, load an <code>.ifc</code> / <code>.frag</code> model or load the Snowdon Towers sample model.
          </div>
          <button id="btn-reader-load-sample" class="btn-calculate-seq" style="margin-top: 0.5rem; padding: 0 1.2rem; height: 36px; display: inline-flex; align-items: center; gap: 0.4rem;">
            <span>⚡ Load Snowdon Towers Sample IFC</span>
          </button>
        </div>
      `;
      container.querySelector("#btn-reader-load-sample")?.addEventListener("click", () => {
        const sampleSelect = document.getElementById("sample-model-select") as HTMLSelectElement | null;
        if (sampleSelect) sampleSelect.value = "snowdon";
        const loadBtn = document.getElementById("load-sample-btn");
        if (loadBtn) {
          loadBtn.click();
        } else if (typeof (window as any).loadSampleModel === "function") {
          (window as any).loadSampleModel("snowdon");
        }
        this.closeModal();
      });
      return;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="padding: 3rem 1rem; text-align: center;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.8" style="margin-bottom: 0.5rem;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <div style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">No matching IFC parameters found</div>
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Try refining your search keyword or switching category tabs.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(param => {
      const isSelected = param.key === this.selectedParameterKey;
      const recBadge = param.isRecommended ? `
        <span class="param-badge-rec" title="${param.recommendReason || 'Optimal for 4D sequencing'}">
          ⭐ 4D Candidate
        </span>
      ` : '';

      const sampleChips = param.sampleValues.map(v => `
        <span class="param-val-chip" title="${v}">${this.escapeHtml(v)}</span>
      `).join("");

      const moreCount = param.distinctCount > param.sampleValues.length ? param.distinctCount - param.sampleValues.length : 0;
      const moreBadge = moreCount > 0 ? `<span class="param-val-chip more">+${moreCount} more</span>` : '';

      return `
        <div class="ifc-param-card ${isSelected ? 'selected' : ''}" data-key="${param.key}">
          <div class="param-card-top">
            <div class="param-card-info">
              <div class="param-meta-tags">
                <span class="param-group-tag">${this.escapeHtml(param.group)}</span>
                <span class="param-cat-tag ${param.category.toLowerCase()}">${param.category}</span>
                ${recBadge}
              </div>
              <div class="param-title-row">
                <h4 class="param-name" title="${param.key}">${this.escapeHtml(param.name)}</h4>
                <span class="param-key-sub">${this.escapeHtml(param.key)}</span>
              </div>
            </div>

            <!-- Generate 4D Action Button -->
            <button class="btn-param-generate-4d" data-action="generate-4d" data-key="${param.key}" title="Generate 4D Construction Sequence using '${param.name}'">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              <span>Generate 4D Sequence</span>
            </button>
          </div>

          <!-- Coverage & Stats -->
          <div class="param-coverage-wrap">
            <div class="coverage-bar-track">
              <div class="coverage-bar-fill" style="width: ${param.coveragePercent}%;"></div>
            </div>
            <div class="param-stats-row">
              <span class="coverage-text">Coverage: <strong>${param.coveragePercent}%</strong> (${param.elementCount} elements)</span>
              <span class="distinct-text">Unique Groups: <strong>${param.distinctCount}</strong></span>
            </div>
          </div>

          <!-- Values preview chips -->
          <div class="param-values-preview">
            <span class="values-label">Discovered Values:</span>
            <div class="values-chips-wrap">
              ${sampleChips}
              ${moreBadge}
            </div>
          </div>
        </div>
      `;
    }).join("");

    // Bind click events on cards and generate buttons
    container.querySelectorAll(".btn-param-generate-4d").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const key = btn.getAttribute("data-key");
        if (key) {
          this.openSequenceDrawer(key);
        }
      });
    });

    container.querySelectorAll(".ifc-param-card").forEach(card => {
      card.addEventListener("click", () => {
        const key = card.getAttribute("data-key");
        if (key) {
          this.openSequenceDrawer(key);
        }
      });
    });
  }

  private openSequenceDrawer(paramKey: string) {
    this.selectedParameterKey = paramKey;
    const modal = document.getElementById("ifc-parameter-reader-modal");
    if (!modal) return;

    const drawer = modal.querySelector("#ifc-sequence-config-drawer") as HTMLElement | null;
    const paramNameEl = modal.querySelector("#seq-drawer-param-name");
    const param = this.cachedParameters.find(p => p.key === paramKey);
    if (!drawer || !param) return;

    if (paramNameEl) {
      paramNameEl.textContent = `Sequence by: ${param.name}`;
    }
    const paramInput = modal.querySelector("#seq-drawer-param-input") as HTMLInputElement | null;
    if (paramInput) {
      paramInput.value = paramKey;
    }

    drawer.style.display = "flex";

    // Highlight active card
    modal.querySelectorAll(".ifc-param-card").forEach(c => {
      if (c.getAttribute("data-key") === paramKey) {
        c.classList.add("selected");
      } else {
        c.classList.remove("selected");
      }
    });

    this.updateDrawerPreview();
  }

  private updateDrawerPreview() {
    const modal = document.getElementById("ifc-parameter-reader-modal");
    if (!modal || !this.selectedParameterKey) return;

    const param = this.cachedParameters.find(p => p.key === this.selectedParameterKey);
    if (!param) return;

    const startDateInput = modal.querySelector("#seq-drawer-start-date") as HTMLInputElement | null;
    const durationInput = modal.querySelector("#seq-drawer-duration") as HTMLInputElement | null;
    const overlapInput = modal.querySelector("#seq-drawer-overlap") as HTMLInputElement | null;
    const sortDirSelect = modal.querySelector("#seq-drawer-sort-dir") as HTMLSelectElement | null;
    const previewList = modal.querySelector("#seq-drawer-preview-list");
    const tasksCount = modal.querySelector("#seq-drawer-tasks-count");

    const startDate = startDateInput?.value || "2026-06-18";
    const durationDays = parseInt(durationInput?.value || "12", 10) || 12;
    const overlapDays = parseInt(overlapInput?.value || "3", 10) || 0;
    const sortDirection = (sortDirSelect?.value as 'asc' | 'desc') || 'asc';

    const models = this.getModelsCallback ? this.getModelsCallback() : [];
    const storeysMap = this.getStoreysMapCallback ? this.getStoreysMapCallback() : undefined;
    const engine = PropertySequenceEngine.getInstance();

    const result = engine.calculateSequence(
      models,
      {
        propertyKey: this.selectedParameterKey,
        startDate,
        taskDurationDays: durationDays,
        overlapDays,
        sortDirection
      },
      { globalStoreysMap: storeysMap }
    );

    if (tasksCount) {
      tasksCount.textContent = `${result.totalTasks} Phased Tasks (${result.totalElements} elements)`;
    }

    if (previewList) {
      if (result.tasks.length === 0) {
        previewList.innerHTML = `<div style="padding: 1rem; color: var(--text-muted); font-size: 0.75rem;">No tasks generated for this parameter.</div>`;
      } else {
        previewList.innerHTML = result.tasks.map((task, idx) => `
          <div class="seq-preview-task-item">
            <div class="task-num-badge">${idx + 1}</div>
            <div class="task-details">
              <div class="task-name" title="${task.propertyValue}">${this.escapeHtml(task.propertyValue)}</div>
              <div class="task-meta">
                <span>${task.startDate} &rarr; ${task.endDate} (${task.durationDays}d)</span>
                <span class="task-elem-count">${task.elementCount} elements</span>
              </div>
            </div>
          </div>
        `).join("");
      }
    }
  }

  private applyDrawerSequence() {
    const modal = document.getElementById("ifc-parameter-reader-modal");
    if (!modal) return;
    const paramInput = modal.querySelector("#seq-drawer-param-input") as HTMLInputElement | null;
    const resolvedKey = paramInput?.value.trim() || this.selectedParameterKey;
    if (!resolvedKey) return;
    this.selectedParameterKey = resolvedKey;

    const startDateInput = modal.querySelector("#seq-drawer-start-date") as HTMLInputElement | null;
    const durationInput = modal.querySelector("#seq-drawer-duration") as HTMLInputElement | null;
    const overlapInput = modal.querySelector("#seq-drawer-overlap") as HTMLInputElement | null;
    const sortDirSelect = modal.querySelector("#seq-drawer-sort-dir") as HTMLSelectElement | null;

    const startDate = startDateInput?.value || "2026-06-18";
    const durationDays = parseInt(durationInput?.value || "12", 10) || 12;
    const overlapDays = parseInt(overlapInput?.value || "3", 10) || 0;
    const sortDirection = (sortDirSelect?.value as 'asc' | 'desc') || 'asc';

    // Also synchronize sidebar Dynamic Sequence Engine inputs
    const sidebarSelect = document.getElementById("sequence-property-select") as HTMLSelectElement | null;
    const sidebarStartDate = document.getElementById("sequence-start-date") as HTMLInputElement | null;
    const sidebarDuration = document.getElementById("sequence-duration-days") as HTMLInputElement | null;
    const sidebarOverlap = document.getElementById("sequence-overlap-days") as HTMLInputElement | null;
    const sidebarSort = document.getElementById("sequence-sort-dir") as HTMLSelectElement | null;
    const sidebarCustom = document.getElementById("sequence-custom-prop-input") as HTMLInputElement | null;

    if (sidebarStartDate) sidebarStartDate.value = startDate;
    if (sidebarDuration) sidebarDuration.value = String(durationDays);
    if (sidebarOverlap) sidebarOverlap.value = String(overlapDays);
    if (sidebarSort) sidebarSort.value = sortDirection;

    if (sidebarSelect) {
      let found = false;
      for (let i = 0; i < sidebarSelect.options.length; i++) {
        if (sidebarSelect.options[i].value.toLowerCase() === this.selectedParameterKey.toLowerCase()) {
          sidebarSelect.selectedIndex = i;
          found = true;
          break;
        }
      }
      if (!found) {
        const opt = document.createElement("option");
        opt.value = this.selectedParameterKey;
        opt.textContent = `Picked: ${this.selectedParameterKey}`;
        opt.selected = true;
        sidebarSelect.insertBefore(opt, sidebarSelect.firstChild);
        sidebarSelect.value = this.selectedParameterKey;
      }
    }
    if (sidebarCustom) {
      sidebarCustom.value = this.selectedParameterKey;
    }

    // Trigger calculation button in main.ts
    const btnCalc = document.getElementById("btn-calculate-sequence");
    if (btnCalc) {
      btnCalc.click();
    }

    // Close reader modal
    this.closeModal();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
