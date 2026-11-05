/**
 * PropertySequenceEngine.ts
 *
 * Simulation engine to calculate 4D construction sequences dynamically
 * from any selected IFC property, attribute, spatial container, or Pset.
 */

export interface PropertyOption {
  key: string;            // Unique identifier, e.g. "Category", "Storey", "PredefinedType", "Pset_WallCommon.Status"
  label: string;          // Human-readable label
  category: 'Spatial' | 'IFC Standard' | 'Pset' | 'Custom';
  count?: number;         // Approximate number of elements with this property
  sampleValues?: string[]; // Up to 3-5 sample distinct values
}

export interface SequenceCalculationOptions {
  propertyKey: string;              // The property to sequence by, or compound "Storey > Category"
  secondaryPropertyKey?: string;    // Optional secondary property key for multi-tier WBS
  startDate?: string;               // ISO YYYY-MM-DD, defaults to project start (e.g. 2026-06-18)
  taskDurationDays?: number;        // Default duration for each task group in days (e.g. 7-14)
  overlapDays?: number;             // Stagger/overlap in days between consecutive groups
  sortDirection?: 'asc' | 'desc';   // Ordering direction
  customOrder?: string[];           // Optional explicitly defined sequence of values
  enableCPM?: boolean;              // Compute Critical Path Method float & criticality (default: true)
}

export interface SequencedTaskResult {
  id: string;
  name: string;
  propertyKey: string;
  propertyValue: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  elementCount: number;
  modelIdMaps: Record<string, number[]>; // modelId -> expressIds
  sampleIfcTypes: string[];
  wbsCode?: string;                      // WBS numbering, e.g. "1.1", "1.2"
  tierValues?: string[];                 // Individual tier values, e.g. ["Level 1", "IFCWALL"]
  earlyStart?: string;                   // CPM Early Start date
  earlyFinish?: string;                  // CPM Early Finish date
  lateStart?: string;                    // CPM Late Start date
  lateFinish?: string;                   // CPM Late Finish date
  totalFloat?: number;                   // CPM Total Float in days (LS - ES)
  freeFloat?: number;                    // CPM Free Float in days
  isCritical?: boolean;                  // True if totalFloat <= 0
}

export interface SequenceEngineResult {
  propertyKey: string;
  totalTasks: number;
  totalElements: number;
  projectStartDate: string;
  projectEndDate: string;
  tasks: SequencedTaskResult[];
  criticalTaskCount?: number;
}

export class PropertySequenceEngine {
  private static instance: PropertySequenceEngine;

  private constructor() {}

  public static getInstance(): PropertySequenceEngine {
    if (!PropertySequenceEngine.instance) {
      PropertySequenceEngine.instance = new PropertySequenceEngine();
    }
    return PropertySequenceEngine.instance;
  }

  /**
   * Helper to safely extract string value from an IFC property entry.
   */
  public extractValue(val: any): string {
    if (val === null || val === undefined) return "";
    if (typeof val === "object") {
      if ("value" in val) return this.extractValue(val.value);
      if ("NominalValue" in val) return this.extractValue(val.NominalValue);
      if ("Name" in val) return this.extractValue(val.Name);
    }
    return String(val).trim();
  }

  /**
   * Helper to resolve property sets for an IFC element from model properties.
   */
  /**
   * Helper to index all IFCRELDEFINESBYPROPERTIES relations in a model in a single O(N) pass.
   * Maps elementId -> array of property set definition IDs.
   */
  public buildRelDefinesMap(properties: any): Map<number, number[]> {
    const relMap = new Map<number, number[]>();
    if (!properties) return relMap;

    for (const id in properties) {
      const rel = properties[id];
      if (!rel || rel.type !== "IFCRELDEFINESBYPROPERTIES") continue;
      const relatedObjects = rel.RelatedObjects;
      if (!relatedObjects) continue;
      const relPropDef = rel.RelatingPropertyDefinition;
      if (!relPropDef) continue;
      const propDefId = Number(relPropDef.value ?? relPropDef);
      if (isNaN(propDefId)) continue;

      if (Array.isArray(relatedObjects)) {
        for (let i = 0; i < relatedObjects.length; i++) {
          const item = relatedObjects[i];
          const elemId = Number(item?.value ?? item);
          if (!isNaN(elemId)) {
            let list = relMap.get(elemId);
            if (!list) {
              list = [];
              relMap.set(elemId, list);
            }
            list.push(propDefId);
          }
        }
      } else {
        const elemId = Number(relatedObjects.value ?? relatedObjects);
        if (!isNaN(elemId)) {
          let list = relMap.get(elemId);
          if (!list) {
            list = [];
            relMap.set(elemId, list);
          }
          list.push(propDefId);
        }
      }
    }

    return relMap;
  }

  /**
   * Helper to resolve property sets for an IFC element from model properties.
   */
  public resolveElementPsets(properties: any, elementId: number, relMap?: Map<number, number[]>): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {};
    if (!properties) return result;

    const parsePset = (propSet: any, propDefId: number) => {
      if (!propSet) return;
      try {
        const psetName = this.extractValue(propSet.Name) || `PropertySet_${propDefId}`;
        if (!result[psetName]) result[psetName] = {};

        if (propSet.HasProperties) {
          const hasProps = Array.isArray(propSet.HasProperties) ? propSet.HasProperties : [propSet.HasProperties];
          for (const propRef of hasProps) {
            try {
              const propId = Number(propRef.value ?? propRef);
              const prop = properties[propId];
              if (!prop) continue;
              const propName = this.extractValue(prop.Name);
              const propValue = this.extractValue(prop.NominalValue) || this.extractValue(prop.Value);
              if (propName) result[psetName][propName] = propValue;
            } catch (e) {}
          }
        }

        if (propSet.Quantities) {
          const quantities = Array.isArray(propSet.Quantities) ? propSet.Quantities : [propSet.Quantities];
          for (const qtyRef of quantities) {
            try {
              const qtyId = Number(qtyRef.value ?? qtyRef);
              const qty = properties[qtyId];
              if (!qty) continue;
              const qtyName = this.extractValue(qty.Name);
              let qtyValue = "";
              for (const key in qty) {
                if (key.endsWith("Value")) {
                  qtyValue = this.extractValue(qty[key]);
                  break;
                }
              }
              if (!qtyValue) qtyValue = this.extractValue(qty.NominalValue) || this.extractValue(qty.Value);
              if (qtyName) result[psetName][qtyName] = qtyValue;
            } catch (e) {}
          }
        }
      } catch (e) {}
    };

    try {
      const element = properties[elementId];
      if (element) {
        // Direct HasPropertySets
        if (element.HasPropertySets) {
          const psetRefs = Array.isArray(element.HasPropertySets) ? element.HasPropertySets : [element.HasPropertySets];
          for (const psetRef of psetRefs) {
            const psetId = Number(psetRef.value ?? psetRef);
            const propSet = properties[psetId];
            if (propSet) parsePset(propSet, psetId);
          }
        }

        // Direct IsDefinedBy on element
        if (element.IsDefinedBy) {
          const isDefList = Array.isArray(element.IsDefinedBy) ? element.IsDefinedBy : [element.IsDefinedBy];
          for (const def of isDefList) {
            if (!def) continue;
            const pDefId = Number(def.value ?? def);
            const propSet = properties[pDefId] || def;
            if (propSet) parsePset(propSet, pDefId);
          }
        }
      }

      // Fast lookup via precomputed relMap
      if (relMap) {
        const psetIds = relMap.get(elementId);
        if (psetIds) {
          for (const psetId of psetIds) {
            const propSet = properties[psetId];
            if (propSet) parsePset(propSet, psetId);
          }
        }
      } else {
        // Fallback scan
        for (const id in properties) {
          const rel = properties[id];
          if (!rel || rel.type !== "IFCRELDEFINESBYPROPERTIES") continue;
          const relatedObjects = rel.RelatedObjects;
          if (!relatedObjects) continue;
          const isRelated = Array.isArray(relatedObjects)
            ? relatedObjects.some((o: any) => Number(o?.value ?? o) === elementId)
            : Number(relatedObjects.value ?? relatedObjects) === elementId;
          if (!isRelated) continue;
          const relPropDef = rel.RelatingPropertyDefinition;
          if (!relPropDef) continue;
          const propDefId = Number(relPropDef.value ?? relPropDef);
          const propSet = properties[propDefId];
          if (propSet) parsePset(propSet, propDefId);
        }
      }
    } catch (e) {}

    return result;
  }

  /**
   * Resolve an element's value for a given property key.
   */
  public getElementPropertyValue(
    props: any,
    propertyKey: string,
    context?: {
      expressId: number;
      modelId: string;
      storeyName?: string;
      psets?: Record<string, Record<string, string>>;
    }
  ): string {
    if (!props && !context) return "Unassigned";

    const keyLower = propertyKey.toLowerCase();

    // 1. Spatial / Storey Level
    if (keyLower === "storey" || keyLower === "ifcbuildingstorey" || keyLower === "level" || keyLower === "floor") {
      if (context?.storeyName && context.storeyName.trim()) {
        return context.storeyName;
      }
      return "Ground Level";
    }

    // 2. IFC Category / Entity Type
    if (keyLower === "category" || keyLower === "ifctype" || keyLower === "entity" || keyLower === "ifcentity") {
      const typeRaw = props?.type !== undefined ? props.type : (props?._type ?? "");
      let typeStr = this.extractValue(typeRaw).toUpperCase();
      if (!typeStr) typeStr = "IFCELEMENT";
      return typeStr;
    }

    // 3. Predefined Type
    if (keyLower === "predefinedtype") {
      const val = props?.PredefinedType || props?.predefinedType;
      const str = this.extractValue(val);
      if (str && str !== "NOTDEFINED" && str !== "USERDEFINED") return str;
      return "Standard";
    }

    // 4. Standard Top-level Attributes
    if (props && props[propertyKey] !== undefined) {
      const val = this.extractValue(props[propertyKey]);
      if (val) return val;
    }

    // 5. Look inside resolved Psets if present
    const psets: Record<string, any> | undefined = context?.psets || props?.psets;
    if (psets) {
      // Check if propertyKey is in "Pset.Name" format
      if (propertyKey.includes(".")) {
        const [psetName, propName] = propertyKey.split(".");
        const psetLower = psetName.toLowerCase();
        const propLower = propName.toLowerCase();
        for (const [pName, rawPset] of Object.entries(psets)) {
          if (pName.toLowerCase() === psetLower && rawPset && typeof rawPset === "object") {
            const psetObj = rawPset as Record<string, any>;
            for (const [k, v] of Object.entries(psetObj)) {
              if (k.toLowerCase() === propLower && v !== undefined && v !== null) return String(v);
            }
          }
        }
      } else {
        // Search across all psets for this propName (exact or case-insensitive)
        for (const rawPset of Object.values(psets)) {
          if (rawPset && typeof rawPset === "object") {
            const psetObj = rawPset as Record<string, any>;
            if (psetObj[propertyKey] !== undefined && psetObj[propertyKey] !== null) return String(psetObj[propertyKey]);
            for (const [k, v] of Object.entries(psetObj)) {
              if (k.toLowerCase() === keyLower && v !== undefined && v !== null) return String(v);
            }
          }
        }
      }
    }

    // Fallback: check direct property object if key is lowercase/case-insensitive match
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k.toLowerCase() === keyLower) {
          const val = this.extractValue(v);
          if (val) return val;
        }
      }
    }

    return "Unassigned";
  }

  /**
   * Scans a collection of loaded models and returns all available property keys
   * that can be used to drive the construction sequence.
   */
  public discoverAvailableProperties(
    models: any[],
    storeysOrContext?: Record<string, string> | { globalStoreysMap?: Record<string, string>; elementPsetsMap?: Record<string, Record<string, Record<string, string>>> }
  ): PropertyOption[] {
    const globalStoreysMap: Record<string, string> | undefined = 
      storeysOrContext && typeof storeysOrContext === 'object' && 'globalStoreysMap' in storeysOrContext 
        ? (storeysOrContext as { globalStoreysMap?: Record<string, string> }).globalStoreysMap 
        : (storeysOrContext as Record<string, string> | undefined);

    const contextStoreys: { globalStoreysMap?: Record<string, string>; elementPsetsMap?: Record<string, Record<string, Record<string, string>>> } | undefined = 
      storeysOrContext && typeof storeysOrContext === 'object' && 'elementPsetsMap' in storeysOrContext 
        ? (storeysOrContext as { globalStoreysMap?: Record<string, string>; elementPsetsMap?: Record<string, Record<string, Record<string, string>>> })
        : undefined;
    const discovered: Map<string, {
      label: string;
      category: 'Spatial' | 'IFC Standard' | 'Pset' | 'Custom';
      values: Set<string>;
      count: number;
    }> = new Map();

    // Default primary sequence properties
    discovered.set("Storey", {
      label: "Building Storey / Level (Vertical Sequence)",
      category: "Spatial",
      values: new Set(["Foundation", "Ground Floor", "Level 1", "Level 2", "Roof"]),
      count: 0
    });

    discovered.set("Category", {
      label: "IFC Entity / Category (Trade Sequence)",
      category: "IFC Standard",
      values: new Set(),
      count: 0
    });

    discovered.set("PredefinedType", {
      label: "Predefined Type / Functional Classification",
      category: "IFC Standard",
      values: new Set(),
      count: 0
    });

    discovered.set("Name", {
      label: "Element Name / Component Tag",
      category: "IFC Standard",
      values: new Set(),
      count: 0
    });

    discovered.set("Status", {
      label: "Phasing / Status Attribute",
      category: "Pset",
      values: new Set(),
      count: 0
    });

    // Scan models to discover actual values and custom Pset attributes
    for (const model of models) {
      if (!model) continue;
      const modelId = model.modelId || model.uuid || model.id || (model.object && model.object.uuid) || "default-model";
      const properties = model.properties || (model as any).getLocalProperties?.() || {};
      const relMap = this.buildRelDefinesMap(properties);

      for (const expressIdStr in properties) {
        const expressId = Number(expressIdStr);
        if (isNaN(expressId)) continue;
        const p = properties[expressId];
        if (!p) continue;

        // Count storey
        const storey = p.Storey || globalStoreysMap?.[`${modelId}-${expressId}`];
        if (storey) {
          const storeyEntry = discovered.get("Storey")!;
          storeyEntry.values.add(storey);
          storeyEntry.count++;
        }

        // Check valid element entity
        const rawType = this.extractValue(p.type ?? "").toUpperCase();
        if (rawType.startsWith("IFCREL") || rawType.startsWith("IFCPROPERTY") || rawType === "IFCPROPERTYSINGLEVALUE" || rawType === "IFCPROPERTYSET") {
          continue;
        }

        // Count Category
        if (p.type !== undefined) {
          const cat = this.extractValue(p.type).toUpperCase();
          if (cat && cat !== "IFCRELDEFINESBYPROPERTIES" && cat !== "IFCRELDEFINESBYTYPE") {
            const catEntry = discovered.get("Category")!;
            catEntry.values.add(cat);
            catEntry.count++;
          }
        }

        // Count PredefinedType
        if (p.PredefinedType) {
          const pt = this.extractValue(p.PredefinedType);
          if (pt && pt !== "NOTDEFINED" && pt !== "USERDEFINED") {
            const ptEntry = discovered.get("PredefinedType")!;
            ptEntry.values.add(pt);
            ptEntry.count++;
          }
        }

        // Scan any other top-level keys
        for (const key of Object.keys(p)) {
          if (['expressId', 'localId', 'type', '_type', 'GlobalId', 'IsDefinedBy', 'HasProperties'].includes(key)) {
            continue;
          }
          const val = this.extractValue(p[key]);
          if (!val) continue;

          let entry = discovered.get(key);
          if (!entry) {
            entry = {
              label: `${key} (Attribute)`,
              category: "Custom",
              values: new Set(),
              count: 0
            };
            discovered.set(key, entry);
          }
          entry.count++;
          if (entry.values.size < 10) {
            entry.values.add(val);
          }
        }

        // Scan Psets for text properties
        const elemPsets: Record<string, Record<string, string>> | null = 
          p.psets ||
          contextStoreys?.elementPsetsMap?.[`${modelId}-${expressId}`] || 
          (discovered.size < 50 ? this.resolveElementPsets(properties, expressId, relMap) : null);

        if (elemPsets && typeof elemPsets === 'object') {
          for (const [psetName, pset] of Object.entries(elemPsets)) {
            if (!pset || typeof pset !== 'object') continue;
            for (const [propName, propVal] of Object.entries(pset as Record<string, string>)) {
              if (!propVal || typeof propVal !== 'string') continue;
              const qualifiedKey = `${psetName}.${propName}`;
              let psetEntry = discovered.get(qualifiedKey);
              if (!psetEntry) {
                psetEntry = {
                  label: `${psetName}: ${propName}`,
                  category: "Pset",
                  values: new Set(),
                  count: 0
                };
                discovered.set(qualifiedKey, psetEntry);
              }
              psetEntry.count++;
              if (psetEntry.values.size < 10) {
                psetEntry.values.add(propVal);
              }
            }
          }
        }
      }
    }

    // Convert map to sorted PropertyOption array
    const options: PropertyOption[] = [];
    for (const [key, meta] of discovered.entries()) {
      options.push({
        key,
        label: meta.label,
        category: meta.category,
        count: meta.count,
        sampleValues: Array.from(meta.values).slice(0, 4)
      });
    }

    // Priority order: Spatial -> IFC Standard -> Pset -> Custom
    const categoryOrder = { 'Spatial': 0, 'IFC Standard': 1, 'Pset': 2, 'Custom': 3 };
    options.sort((a, b) => {
      const diff = categoryOrder[a.category] - categoryOrder[b.category];
      if (diff !== 0) return diff;
      return (b.count || 0) - (a.count || 0);
    });

    return options;
  }

  /**
   * Sort property values in an engineering-logical sequence.
   * - Elevation / Storey: Basement -> Ground -> Level 1 -> Roof
   * - Category: Substructure / Foundations -> Structure -> Walls -> Roof -> MEP -> Finishes
   * - Numeric strings: Natural numerical sorting (1, 2, 10 instead of 1, 10, 2)
   */
  public sortPropertyValues(
    values: string[],
    propertyKey: string,
    direction: 'asc' | 'desc' = 'asc',
    customOrder?: string[]
  ): string[] {
    if (customOrder && customOrder.length > 0) {
      const orderMap = new Map(customOrder.map((v, i) => [v.toLowerCase(), i]));
      const sorted = [...values].sort((a, b) => {
        const idxA = orderMap.has(a.toLowerCase()) ? orderMap.get(a.toLowerCase())! : 9999;
        const idxB = orderMap.has(b.toLowerCase()) ? orderMap.get(b.toLowerCase())! : 9999;
        return idxA - idxB;
      });
      return direction === 'desc' ? sorted.reverse() : sorted;
    }

    const keyLower = propertyKey.toLowerCase();

    // 1. Storey / Vertical Elevation Ordering
    if (keyLower === "storey" || keyLower === "ifcbuildingstorey" || keyLower === "level" || keyLower === "floor") {
      const getStoreyRank = (name: string): number => {
        const lower = name.toLowerCase();
        if (lower.includes("found") || lower.includes("sub") || lower.includes("foot") || lower.includes("pile")) return -20;
        if (lower.includes("base") || lower.includes("b1") || lower.includes("b2") || lower.includes("under")) return -10;
        if (lower.includes("ground") || lower.includes("gnd") || lower.includes("entry") || lower.includes("l0") || lower.includes("level 0") || lower.includes("00")) return 0;
        if (lower.includes("first") || lower.includes("1st") || lower.includes("l1") || lower.includes("level 1") || lower.includes("01")) return 10;
        if (lower.includes("second") || lower.includes("2nd") || lower.includes("l2") || lower.includes("level 2") || lower.includes("02")) return 20;
        if (lower.includes("third") || lower.includes("3rd") || lower.includes("l3") || lower.includes("level 3") || lower.includes("03")) return 30;
        if (lower.includes("fourth") || lower.includes("4th") || lower.includes("l4") || lower.includes("level 4") || lower.includes("04")) return 40;
        if (lower.includes("roof") || lower.includes("parapet") || lower.includes("attic")) return 100;
        
        // Match numbers e.g. "Level 5"
        const numMatch = name.match(/-?\d+/);
        if (numMatch) return parseInt(numMatch[0], 10) * 10;
        return 50;
      };

      const sorted = [...values].sort((a, b) => getStoreyRank(a) - getStoreyRank(b));
      return direction === 'desc' ? sorted.reverse() : sorted;
    }

    // 2. IFC Category / Entity Construction Sequencing
    if (keyLower === "category" || keyLower === "ifctype" || keyLower === "entity" || keyLower === "ifcentity") {
      const CONSTRUCTION_RANKS: Record<string, number> = {
        IFCSITE: 0,
        IFCGEOTECHNICALELEMENT: 1,
        IFCFOOTING: 2,
        IFCPILE: 3,
        IFCCOLUMN: 4,
        IFCBEAM: 5,
        IFCMEMBER: 5,
        IFCSLAB: 6,
        IFCWALL: 7,
        IFCWALLSTANDARDCASE: 7,
        IFCURTAINWALL: 8,
        IFCSTAIR: 9,
        IFCSTAIRFLIGHT: 9,
        IFCRAMP: 9,
        IFCROOF: 10,
        IFCDOOR: 11,
        IFCWINDOW: 12,
        IFCRAILING: 13,
        IFCCOVERING: 14,
        IFCPLATE: 15,
        IFCFLOWSEGMENT: 16,
        IFCFLOWFITTING: 16,
        IFCFLOWTERMINAL: 17,
        IFCFLOWCONTROLLER: 17,
        IFCFLOWSTORAGEDEVICE: 17,
        IFCFLOWMOVINGDEVICE: 17,
        IFCDISTRIBUTIONELEMENT: 18,
        IFCFURNISHINGELEMENT: 19,
        IFCBUILDINGELEMENTPROXY: 20
      };

      const getCatRank = (cat: string): number => {
        const u = cat.toUpperCase();
        return CONSTRUCTION_RANKS[u] ?? 50;
      };

      const sorted = [...values].sort((a, b) => {
        const diff = getCatRank(a) - getCatRank(b);
        if (diff !== 0) return diff;
        return a.localeCompare(b);
      });
      return direction === 'desc' ? sorted.reverse() : sorted;
    }

    // 3. Natural Alphanumeric Sort (e.g. Phase 1, Phase 2, Phase 10)
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    const sorted = [...values].sort((a, b) => collator.compare(a, b));
    return direction === 'desc' ? sorted.reverse() : sorted;
  }

  /**
   * Main simulation engine execution:
   * Groups loaded IFC elements by the selected property, sorts them into a logical
   * construction timeline, assigns start/finish dates, and returns the sequenced tasks.
   */
    public calculateSequence(
    models: any[],
    options: SequenceCalculationOptions,
    context?: {
      globalStoreysMap?: Record<string, string>;
      elementPsetsMap?: Record<string, Record<string, Record<string, string>>>;
    }
  ): SequenceEngineResult {
    const rawKey = (options.propertyKey || "Storey").trim();
    let primaryKey = rawKey;
    let secondaryKey = options.secondaryPropertyKey ? options.secondaryPropertyKey.trim() : "";

    // Support compound notation e.g. "Storey > Category" or "Storey / Category"
    if (rawKey.includes(" > ")) {
      const parts = rawKey.split(" > ");
      primaryKey = parts[0].trim();
      secondaryKey = parts[1].trim();
    } else if (rawKey.includes(" / ")) {
      const parts = rawKey.split(" / ");
      primaryKey = parts[0].trim();
      secondaryKey = parts[1].trim();
    }

    const isMultiTier = Boolean(secondaryKey && secondaryKey.toLowerCase() !== primaryKey.toLowerCase());
    const startDateStr = options.startDate || "2026-06-18";
    const durationDays = Math.max(1, options.taskDurationDays ?? 10);
    const overlapDays = Math.max(0, Math.min(durationDays - 1, options.overlapDays ?? 3));
    const enableCPM = options.enableCPM !== false;

    // 1. Hierarchical Multi-Tier Element Grouping
    // Map: tier1Value -> (Map: tier2Value -> groupData)
    interface NodeGroup {
      tier1: string;
      tier2: string;
      compositeKey: string;
      modelIdMaps: Record<string, Set<number>>;
      ifcTypes: Set<string>;
      elementCount: number;
    }

    const hierarchy = new Map<string, Map<string, NodeGroup>>();
    let totalElements = 0;

    for (const model of models) {
      if (!model) continue;
      const modelId = model.modelId || model.uuid || model.id || (model.object && model.object.uuid) || "default-model";
      const properties = model.properties || (model as any).getLocalProperties?.() || {};
      const relMap = this.buildRelDefinesMap(properties);

      for (const expressIdStr in properties) {
        const expressId = Number(expressIdStr);
        if (isNaN(expressId)) continue;
        const p = properties[expressId];
        if (!p) continue;

        const dbKey = `${modelId}-${expressId}`;
        const storeyName = p.Storey || context?.globalStoreysMap?.[dbKey];
        let psets = p.psets || context?.elementPsetsMap?.[dbKey];
        if (!psets && (primaryKey.includes('.') || secondaryKey.includes('.') || !['storey', 'category', 'predefinedtype', 'name'].includes(primaryKey.toLowerCase()))) {
          psets = this.resolveElementPsets(properties, expressId, relMap);
        }

        const ifcType = this.extractValue(p.type ?? "").toUpperCase() || "IFCELEMENT";
        if (ifcType.startsWith("IFCREL") || ifcType.startsWith("IFCPROPERTY") || ifcType === "IFCPROPERTYSINGLEVALUE" || ifcType === "IFCPROPERTYSET") {
          continue;
        }

        const tier1Val = this.getElementPropertyValue(p, primaryKey, {
          expressId,
          modelId,
          storeyName,
          psets
        });

        const tier2Val = isMultiTier
          ? this.getElementPropertyValue(p, secondaryKey, {
              expressId,
              modelId,
              storeyName,
              psets
            })
          : "";

        if (!hierarchy.has(tier1Val)) {
          hierarchy.set(tier1Val, new Map());
        }
        const tier2Map = hierarchy.get(tier1Val)!;
        const subKey = isMultiTier ? tier2Val : "__single__";

        if (!tier2Map.has(subKey)) {
          tier2Map.set(subKey, {
            tier1: tier1Val,
            tier2: tier2Val,
            compositeKey: isMultiTier ? `${tier1Val} > ${tier2Val}` : tier1Val,
            modelIdMaps: {},
            ifcTypes: new Set(),
            elementCount: 0
          });
        }

        const node = tier2Map.get(subKey)!;
        if (!node.modelIdMaps[modelId]) {
          node.modelIdMaps[modelId] = new Set<number>();
        }
        node.modelIdMaps[modelId].add(expressId);
        node.ifcTypes.add(ifcType);
        node.elementCount++;
        totalElements++;
      }
    }

    // 2. Hierarchical Sorting
    // Primary tier sorting (e.g. storeys by elevation)
    const uniqueTier1 = Array.from(hierarchy.keys());
    const sortedTier1 = this.sortPropertyValues(
      uniqueTier1,
      primaryKey,
      options.sortDirection ?? 'asc',
      !isMultiTier ? options.customOrder : undefined
    );

    // Build ordered list of node groups
    const orderedNodes: { node: NodeGroup; wbsCode: string }[] = [];
    sortedTier1.forEach((t1Val, i) => {
      const tier2Map = hierarchy.get(t1Val);
      if (!tier2Map) return;

      if (!isMultiTier) {
        const node = tier2Map.get("__single__");
        if (node) {
          orderedNodes.push({ node, wbsCode: String(i + 1) });
        }
      } else {
        const uniqueTier2 = Array.from(tier2Map.keys());
        const sortedTier2 = this.sortPropertyValues(
          uniqueTier2,
          secondaryKey,
          options.sortDirection ?? 'asc'
        );

        sortedTier2.forEach((t2Val, j) => {
          const node = tier2Map.get(t2Val);
          if (node) {
            orderedNodes.push({ node, wbsCode: `${i + 1}.${j + 1}` });
          }
        });
      }
    });

    // 3. CPM Date Calculation (Forward Pass & Backward Pass)
    const MS_PER_DAY = 86400000;
    const baseStartMs = new Date(startDateStr).getTime();
    const taskCount = orderedNodes.length;

    // Forward Pass: calculate Early Start (ES) and Early Finish (EF)
    const esMsList: number[] = new Array(taskCount).fill(0);
    const efMsList: number[] = new Array(taskCount).fill(0);

    for (let k = 0; k < taskCount; k++) {
      if (k === 0) {
        esMsList[k] = baseStartMs;
      } else {
        // Predecessor finishes at efMsList[k-1]; with overlap, next starts at EF[k-1] - overlap
        const predecessorFinish = efMsList[k - 1];
        const earliestWithOverlap = predecessorFinish - (overlapDays * MS_PER_DAY);
        esMsList[k] = Math.max(baseStartMs, earliestWithOverlap);
      }
      efMsList[k] = esMsList[k] + (durationDays * MS_PER_DAY);
    }

    const projectFinishMs = taskCount > 0 ? Math.max(...efMsList) : baseStartMs;

    // Backward Pass: calculate Late Finish (LF) and Late Start (LS)
    const lfMsList: number[] = new Array(taskCount).fill(0);
    const lsMsList: number[] = new Array(taskCount).fill(0);
    const totalFloatDays: number[] = new Array(taskCount).fill(0);
    const freeFloatDays: number[] = new Array(taskCount).fill(0);

    for (let k = taskCount - 1; k >= 0; k--) {
      if (k === taskCount - 1) {
        lfMsList[k] = projectFinishMs;
      } else {
        // Successor k+1 has Late Start lsMsList[k+1].
        // Because ES[k+1] >= EF[k] - overlapDays, latest EF[k] <= LS[k+1] + overlapDays
        const latestFromSuccessor = lsMsList[k + 1] + (overlapDays * MS_PER_DAY);
        lfMsList[k] = Math.min(projectFinishMs, latestFromSuccessor);
      }
      lsMsList[k] = lfMsList[k] - (durationDays * MS_PER_DAY);

      const floatMs = lsMsList[k] - esMsList[k];
      totalFloatDays[k] = Math.max(0, Math.round(floatMs / MS_PER_DAY));

      if (k < taskCount - 1) {
        const freeFloatMs = esMsList[k + 1] - (efMsList[k] - (overlapDays * MS_PER_DAY));
        freeFloatDays[k] = Math.max(0, Math.round(freeFloatMs / MS_PER_DAY));
      } else {
        freeFloatDays[k] = 0;
      }
    }

    // 4. Construct Sequenced Task Results
    const tasks: SequencedTaskResult[] = [];
    let criticalCount = 0;

    orderedNodes.forEach(({ node, wbsCode }, idx) => {
      const taskStartMs = esMsList[idx];
      const taskEndMs = efMsList[idx];
      const taskStartDate = new Date(taskStartMs).toISOString().split("T")[0];
      const taskEndDate = new Date(taskEndMs).toISOString().split("T")[0];
      const lateStartDate = new Date(lsMsList[idx]).toISOString().split("T")[0];
      const lateFinishDate = new Date(lfMsList[idx]).toISOString().split("T")[0];

      const isCritical = enableCPM && totalFloatDays[idx] <= 0;
      if (isCritical) criticalCount++;

      // Convert Set<number> to number[] for each model
      const modelMapsArray: Record<string, number[]> = {};
      for (const [mId, idSet] of Object.entries(node.modelIdMaps)) {
        modelMapsArray[mId] = Array.from(idSet);
      }

      // Generate descriptive task name
      let cleanTaskName = "";
      if (isMultiTier) {
        const cleanCat = node.tier2.replace(/^IFC/i, '').replace(/STANDARDCASE$/i, '');
        cleanTaskName = `WBS ${wbsCode} — ${node.tier1}: ${cleanCat}`;
      } else {
        if (primaryKey.toLowerCase() === "storey" || primaryKey.toLowerCase() === "level") {
          cleanTaskName = `Phase ${wbsCode} — ${node.tier1} Superstructure & Finishes`;
        } else if (primaryKey.toLowerCase() === "category") {
          const readable = node.tier1.replace(/^IFC/i, '').replace(/STANDARDCASE$/i, '');
          cleanTaskName = `Phase ${wbsCode} — ${readable} Construction Works`;
        } else {
          // If sequencing by a parameter like SIMULATION or Reference,
          // output the property value directly (e.g. COL_EP1) so it directly matches
          // the 3D element property in Synchro 4D Pro for 1-click automatic 3D resource linking!
          cleanTaskName = node.tier1;
        }
      }

      const slug = (isMultiTier ? `${node.tier1}-${node.tier2}` : node.tier1)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-');

      tasks.push({
        id: `seq-task-${wbsCode.replace(/\./g, '_')}-${slug}`,
        name: cleanTaskName,
        propertyKey: isMultiTier ? `${primaryKey} > ${secondaryKey}` : primaryKey,
        propertyValue: node.compositeKey,
        startDate: taskStartDate,
        endDate: taskEndDate,
        durationDays,
        elementCount: node.elementCount,
        modelIdMaps: modelMapsArray,
        sampleIfcTypes: Array.from(node.ifcTypes).slice(0, 5),
        wbsCode,
        tierValues: isMultiTier ? [node.tier1, node.tier2] : [node.tier1],
        earlyStart: taskStartDate,
        earlyFinish: taskEndDate,
        lateStart: lateStartDate,
        lateFinish: lateFinishDate,
        totalFloat: totalFloatDays[idx],
        freeFloat: freeFloatDays[idx],
        isCritical
      });
    });

    const projectStartDate = taskCount > 0 ? new Date(esMsList[0]).toISOString().split("T")[0] : startDateStr;
    const projectEndDate = taskCount > 0 ? new Date(projectFinishMs).toISOString().split("T")[0] : startDateStr;

    return {
      propertyKey: isMultiTier ? `${primaryKey} > ${secondaryKey}` : primaryKey,
      totalTasks: tasks.length,
      totalElements,
      projectStartDate,
      projectEndDate,
      tasks,
      criticalTaskCount: criticalCount
    };
  }

  /**
   * Applies the calculated sequence directly to the twinDatabase record dictionary
   * and the ScheduleManager task list.
   */
  public applySequenceToTwinDatabase(
    sequenceResult: SequenceEngineResult,
    twinDatabase: Record<string, any>,
    scheduleManager: any
  ): { updatedElements: number; updatedTasks: number } {
    let updatedElements = 0;

    if (scheduleManager && typeof scheduleManager.clear === "function") {
      scheduleManager.clear();
    }

    const currentMs = Date.now();

    for (const task of sequenceResult.tasks) {
      const taskStartMs = new Date(task.startDate).getTime();
      const taskEndMs = new Date(task.endDate).getTime();

      let taskStatus: 'Planned' | 'In Progress' | 'Completed' = 'Planned';
      if (currentMs > taskEndMs) {
        taskStatus = 'Completed';
      } else if (currentMs >= taskStartMs && currentMs <= taskEndMs) {
        taskStatus = 'In Progress';
      }

      const allElementIds = new Set<number>();
      let firstModelId = "default-model";

      for (const [modelId, ids] of Object.entries(task.modelIdMaps)) {
        firstModelId = modelId;
        for (const expressId of ids) {
          allElementIds.add(expressId);
          const dbKey = `${modelId}-${expressId}`;
          const existing = twinDatabase[dbKey] || {};

          let elemStatus: 'Planned' | 'In Progress' | 'Completed' = 'Planned';
          if (currentMs > taskEndMs) {
            elemStatus = 'Completed';
          } else if (currentMs >= taskStartMs && currentMs <= taskEndMs) {
            elemStatus = 'In Progress';
          }

          twinDatabase[dbKey] = {
            ...existing,
            modelId,
            expressId,
            task: task.name,
            status: elemStatus,
            startDate: task.startDate,
            endDate: task.endDate,
            unitCost: existing.unitCost || 250,
            quantity: existing.quantity || 1,
            calculatedCost: existing.calculatedCost || 250,
            wbsCode: task.wbsCode,
            totalFloat: task.totalFloat,
            isCritical: task.isCritical
          };
          updatedElements++;
        }
      }

      // Add to scheduleManager tasks
      if (scheduleManager && scheduleManager.tasks) {
        scheduleManager.tasks.set(task.id, {
          id: task.id,
          name: task.name,
          category: task.propertyValue,
          startDate: task.startDate,
          endDate: task.endDate,
          status: taskStatus,
          elementIds: allElementIds,
          modelId: firstModelId,
          unitCost: 250,
          quantity: allElementIds.size,
          wbsCode: task.wbsCode,
          totalFloat: task.totalFloat,
          isCritical: task.isCritical
        });
      }
    }

    return {
      updatedElements,
      updatedTasks: sequenceResult.tasks.length
    };
  }
}

