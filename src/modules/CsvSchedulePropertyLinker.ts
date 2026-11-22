/**
 * CsvSchedulePropertyLinker — Exact Task-Name-to-3D-Property Linker for 4D/5D CSV & Excel Schedules.
 *
 * When a user uploads a 4D/5D CSV schedule with TaskName, StartDate, EndDate, Cost, and optional
 * Actual dates / MatchProperty columns (without manually listing ExpressIDs), this engine indexes
 * all loaded 3D model element properties (Name, GlobalId, Tag, ObjectType, Category, Storey, and
 * every IFC PropertySet / custom parameter value) and links tasks to 3D elements via exact match
 * while preserving the exact CSV dates and cost values.
 */

import { FragmentIndexer } from "../core/FragmentIndexer";
import { IfcParameterReader } from "./IfcParameterReader";
import { DelayImpactEngine } from "./DelayImpactEngine";
import type { ScheduleManager, ScheduleTask } from "./ScheduleManager";

export interface IndexableModelElement {
  modelId: string;
  expressId: number;
  properties: Record<string, string | number | boolean | null | undefined>;
}

export interface PropertyMatchHit {
  modelId: string;
  expressId: number;
  matchedProperty: string;
}

export interface PropertyMatchIndex {
  /** propKeyLower -> exactValueLower -> hits */
  byPropAndValue: Map<string, Map<string, PropertyMatchHit[]>>;
  /** exactValueLower -> hits across any property */
  byAnyValue: Map<string, PropertyMatchHit[]>;
  totalIndexedElements: number;
}

export interface CsvLinkReport {
  totalTasks: number;
  linkedTasks: number;
  unlinkedTasks: number;
  totalLinkedElements: number;
  unlinkedTaskNames: string[];
  matchedPropertiesUsed: string[];
}

export interface DiscoveredMetaProperty {
  propertyName: string;
  uniqueValueCount: number;
  elementCount: number;
  sampleValues: string[];
}

export interface ExportCsvByPropertyOptions {
  scheduleManager: ScheduleManager;
  elements: IndexableModelElement[];
  /** Empty string or undefined => export existing schedule tasks as-is */
  metaProperty?: string;
  /** Whether to populate the ExpressIDs column (defaults to false when grouping by meta property) */
  includeExpressIds?: boolean;
  /** Whether to include elements missing `metaProperty` as `Unassigned — <Category>` rows (default: true) */
  includeUnassigned?: boolean;
}

function normKey(v: string): string {
  return v.trim().toLowerCase();
}

function normVal(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "value" in (v as any)) {
    return String((v as any).value ?? "").trim().toLowerCase();
  }
  return String(v).trim().toLowerCase();
}

/**
 * Builds an O(1) exact-match lookup index from normalized element property maps.
 */
export function buildPropertyMatchIndex(elements: IndexableModelElement[]): PropertyMatchIndex {
  const byPropAndValue = new Map<string, Map<string, PropertyMatchHit[]>>();
  const byAnyValue = new Map<string, PropertyMatchHit[]>();

  for (const el of elements) {
    const seenAny = new Set<string>();
    for (const [rawProp, rawValue] of Object.entries(el.properties)) {
      const val = normVal(rawValue);
      if (!val) continue;

      const propKey = normKey(rawProp);
      const bareProp = propKey.includes(".") ? propKey.slice(propKey.lastIndexOf(".") + 1) : propKey;

      const hit: PropertyMatchHit = {
        modelId: el.modelId,
        expressId: el.expressId,
        matchedProperty: rawProp,
      };

      for (const keyVariant of propKey === bareProp ? [propKey] : [propKey, bareProp]) {
        let valMap = byPropAndValue.get(keyVariant);
        if (!valMap) {
          valMap = new Map();
          byPropAndValue.set(keyVariant, valMap);
        }
        let arr = valMap.get(val);
        if (!arr) {
          arr = [];
          valMap.set(val, arr);
        }
        arr.push(hit);
      }

      const dedupKey = `${val}::${el.modelId}:${el.expressId}`;
      if (!seenAny.has(dedupKey)) {
        seenAny.add(dedupKey);
        let anyArr = byAnyValue.get(val);
        if (!anyArr) {
          anyArr = [];
          byAnyValue.set(val, anyArr);
        }
        anyArr.push(hit);
      }
    }
  }

  return {
    byPropAndValue,
    byAnyValue,
    totalIndexedElements: elements.length,
  };
}

/**
 * Links imported ScheduleTasks to 3D elements using exact property value matching,
 * preserving the CSV dates and reconciling CSV costs with matched element counts.
 */
export function linkTasksToPropertyIndex(
  tasks: ScheduleTask[],
  index: PropertyMatchIndex
): CsvLinkReport {
  let linkedTasks = 0;
  let totalLinkedElements = 0;
  const unlinkedTaskNames: string[] = [];
  const matchedPropsSet = new Set<string>();

  for (const task of tasks) {
    // If CSV already supplied explicit ExpressIDs, keep them intact
    if (task.elementIds && task.elementIds.size > 0) {
      linkedTasks++;
      totalLinkedElements += task.elementIds.size;
      continue;
    }

    const matchTarget = normKey(task.matchValue || task.name || "");
    const matchIdTarget = normKey(task.id || "");
    let hits: PropertyMatchHit[] = [];

    if (task.matchProperty) {
      const propMap = index.byPropAndValue.get(normKey(task.matchProperty));
      if (propMap && matchTarget) {
        hits = propMap.get(matchTarget) ?? [];
      }
    } else {
      if (matchTarget) {
        hits = index.byAnyValue.get(matchTarget) ?? [];
      }
      if (hits.length === 0 && matchIdTarget && matchIdTarget !== matchTarget) {
        hits = index.byAnyValue.get(matchIdTarget) ?? [];
      }
    }

    if (hits.length === 0) {
      unlinkedTaskNames.push(task.name);
      continue;
    }

    // Group hits by modelId (prefer primary model with most matches for task.modelId)
    const byModel = new Map<string, Set<number>>();
    const propsUsed = new Set<string>();
    for (const h of hits) {
      let s = byModel.get(h.modelId);
      if (!s) {
        s = new Set<number>();
        byModel.set(h.modelId, s);
      }
      s.add(h.expressId);
      propsUsed.add(h.matchedProperty);
      matchedPropsSet.add(h.matchedProperty);
    }

    let primaryModelId = task.modelId || "";
    let primaryCount = -1;
    for (const [mId, idSet] of byModel) {
      if (idSet.size > primaryCount) {
        primaryCount = idSet.size;
        primaryModelId = mId;
      }
    }

    const matchedIds = byModel.get(primaryModelId) ?? new Set<number>();
    task.modelId = primaryModelId;
    task.elementIds = new Set(matchedIds);
    task.matchedProperty = Array.from(propsUsed).slice(0, 3).join(", ");

    // Preserve exact CSV cost semantics while updating quantity to matched 3D element count
    const count = Math.max(1, task.elementIds.size);
    task.quantity = count;

    if (task.costSource === "total" && task.totalCost && task.totalCost > 0) {
      // CSV provided TotalCost -> preserve exact TotalCost and derive per-element UnitCost
      task.unitCost = Math.round((task.totalCost / count) * 100) / 100;
    } else if (task.costSource === "unit" && task.unitCost > 0) {
      // CSV provided UnitCost -> preserve exact UnitCost and compute TotalCost across matched elements
      task.totalCost = Math.round(task.unitCost * count * 100) / 100;
    } else if (task.costSource === "both") {
      // Both supplied in CSV -> preserve both exact values
    } else if (task.totalCost && task.totalCost > 0) {
      task.unitCost = Math.round((task.totalCost / count) * 100) / 100;
    } else if (task.unitCost > 0) {
      task.totalCost = Math.round(task.unitCost * count * 100) / 100;
    }

    // Recompute delay & cost impact using preserved CSV dates & reconciled totalCost
    const impact = DelayImpactEngine.getInstance().computeTaskDelay(task);
    task.delayDays = impact.delayDays;
    task.costImpact = impact.totalCostImpact;

    linkedTasks++;
    totalLinkedElements += task.elementIds.size;
  }

  return {
    totalTasks: tasks.length,
    linkedTasks,
    unlinkedTasks: tasks.length - linkedTasks,
    totalLinkedElements,
    unlinkedTaskNames,
    matchedPropertiesUsed: Array.from(matchedPropsSet),
  };
}

const NON_PHYSICAL_IFC_CATEGORIES = new Set([
  "IFCPROJECT",
  "IFCSITE",
  "IFCBUILDING",
  "IFCBUILDINGSTOREY",
  "IFCSPACE",
  "IFCOPENINGELEMENT",
  "IFCOWNERHISTORY",
  "IFCTYPEPRODUCT",
  "IFCTYPEOBJECT",
  "IFCRELATIONSHIP",
]);

function isNonPhysicalIfcCategory(category: unknown): boolean {
  const cat = String(category ?? "").trim().toUpperCase();
  if (!cat) return false;
  if (NON_PHYSICAL_IFC_CATEGORIES.has(cat)) return true;
  if (cat.endsWith("TYPE") || cat.endsWith("STYLE") || cat.startsWith("IFCREL")) return true;
  return false;
}

/**
 * Collects all indexable physical 3D element metadata across active Fragment models
 * (FragmentIndexer + model.properties + IfcParameterReader), excluding non-physical
 * IFC type definitions, spatial containers, and opening voids.
 */
export async function collectLoadedModelElements(
  activeModels: Array<[string, any]>
): Promise<IndexableModelElement[]> {
  if (activeModels.length === 0) return [];

  const indexer = FragmentIndexer.getInstance();
  const paramReader = IfcParameterReader.getInstance();
  const indexableMap = new Map<string, IndexableModelElement>();

  const ensureEntry = (modelId: string, expressId: number): IndexableModelElement => {
    const key = `${modelId}:${expressId}`;
    let entry = indexableMap.get(key);
    if (!entry) {
      entry = { modelId, expressId, properties: {} };
      indexableMap.set(key, entry);
    }
    return entry;
  };

  for (const [modelId, model] of activeModels) {
    // Source 1: FRAGS v3 FragmentIndexer (name, category, storey, psets)
    try {
      const indexed = await indexer.indexModel(modelId, model, {
        includeBoxes: false,
        includePsets: true,
      });
      for (const el of indexed.elements) {
        const entry = ensureEntry(modelId, el.expressId);
        if (el.name) entry.properties["Name"] = el.name;
        if (el.category) entry.properties["Category"] = el.category;
        if (el.storey) entry.properties["Storey"] = el.storey;
        if (el.globalId) entry.properties["GlobalId"] = el.globalId;
        if (el.psets) {
          for (const [psetName, kv] of Object.entries(el.psets)) {
            if (!kv || typeof kv !== "object") continue;
            for (const [k, v] of Object.entries(kv)) {
              if (v !== null && v !== undefined && typeof v !== "object") {
                entry.properties[`${psetName}.${k}`] = v;
              }
            }
          }
        }
      }
    } catch {
      // Continue to fallback sources
    }

    // Source 2: Legacy/in-memory model.properties (Tag, ObjectType, PredefinedType, custom attrs)
    const rawProps = (model as any)?.properties || (model as any)?.getLocalProperties?.();
    if (rawProps && typeof rawProps === "object") {
      for (const eidStr of Object.keys(rawProps)) {
        const eid = Number(eidStr);
        if (!Number.isFinite(eid) || eid <= 0) continue;
        const p = rawProps[eid];
        if (!p || typeof p !== "object") continue;
        const entry = ensureEntry(modelId, eid);
        for (const attr of ["Name", "GlobalId", "Tag", "ObjectType", "PredefinedType", "LongName", "Description"]) {
          const raw = p[attr]?.value ?? p[attr];
          if (raw !== null && raw !== undefined && typeof raw !== "object" && String(raw).trim() !== "") {
            entry.properties[attr] = raw;
          }
        }
        if (p.psets && typeof p.psets === "object") {
          for (const [psetName, kv] of Object.entries(p.psets)) {
            if (!kv || typeof kv !== "object") continue;
            for (const [k, v] of Object.entries(kv as Record<string, any>)) {
              const val = v?.value ?? v;
              if (val !== null && val !== undefined && typeof val !== "object" && String(val).trim() !== "") {
                entry.properties[`${psetName}.${k}`] = val;
              }
            }
          }
        }
      }
    }
  }

  // Source 3: IfcParameterReader (STEP-parsed custom parameters like Text.SIMULATION, 4D_Task, Mark, etc.)
  try {
    const parsedMap = paramReader.getParsedPropertiesMap();
    if (parsedMap && parsedMap.size > 0) {
      const defaultModelId = activeModels[0][0];
      for (const [cachedModelKey, propsRecord] of parsedMap) {
        const matchedModel = activeModels.find(
          ([mId, m]) =>
            mId === cachedModelKey ||
            m?.modelId === cachedModelKey ||
            m?.name === cachedModelKey
        );
        const targetModelId = matchedModel ? matchedModel[0] : defaultModelId;
        if (!propsRecord || typeof propsRecord !== "object") continue;

        for (const eidStr of Object.keys(propsRecord)) {
          const eid = Number(eidStr);
          if (!Number.isFinite(eid) || eid <= 0) continue;
          const elInfo = propsRecord[eid];
          if (!elInfo || typeof elInfo !== "object") continue;
          const entry = ensureEntry(targetModelId, eid);

          const nameVal = elInfo.Name?.value ?? elInfo.Name ?? elInfo.name;
          if (nameVal && typeof nameVal !== "object") entry.properties["Name"] = nameVal;
          const catVal = elInfo.type ?? elInfo.category;
          if (catVal && typeof catVal !== "object") entry.properties["Category"] = String(catVal).toUpperCase();
          const storeyVal = elInfo.Storey ?? elInfo.storey;
          if (storeyVal && typeof storeyVal !== "object") entry.properties["Storey"] = storeyVal;
          const gidVal = elInfo.GlobalId?.value ?? elInfo.GlobalId;
          if (gidVal && typeof gidVal !== "object") entry.properties["GlobalId"] = gidVal;

          if (elInfo.psets && typeof elInfo.psets === "object") {
            for (const [psetName, kv] of Object.entries(elInfo.psets)) {
              if (!kv || typeof kv !== "object") continue;
              for (const [k, v] of Object.entries(kv as Record<string, any>)) {
                const val = v?.value ?? v;
                if (val !== null && val !== undefined && typeof val !== "object" && String(val).trim() !== "") {
                  entry.properties[`${psetName}.${k}`] = val;
                }
              }
            }
          }
        }
      }
    }
  } catch {
    // Optional STEP cache
  }

  return Array.from(indexableMap.values()).filter(
    (el) => !isNonPhysicalIfcCategory(el.properties["Category"])
  );
}

/**
 * Discovers all available metadata properties across indexed 3D elements with unique-value
 * counts and sample values for the CSV Export Property Selector modal.
 */
export function discoverModelMetaProperties(
  elements: IndexableModelElement[]
): DiscoveredMetaProperty[] {
  const stats = new Map<string, { values: Set<string>; elementCount: number }>();

  for (const el of elements) {
    for (const [propName, rawVal] of Object.entries(el.properties)) {
      const str = rawVal === null || rawVal === undefined ? "" : String(rawVal).trim();
      if (!str) continue;
      let s = stats.get(propName);
      if (!s) {
        s = { values: new Set<string>(), elementCount: 0 };
        stats.set(propName, s);
      }
      s.values.add(str);
      s.elementCount++;
    }
  }

  const priorityOrder = ["Name", "Category", "Storey", "Tag", "ObjectType", "PredefinedType", "GlobalId"];

  return Array.from(stats.entries())
    .map(([propertyName, info]) => ({
      propertyName,
      uniqueValueCount: info.values.size,
      elementCount: info.elementCount,
      sampleValues: Array.from(info.values).slice(0, 6),
    }))
    .sort((a, b) => {
      const pa = priorityOrder.indexOf(a.propertyName);
      const pb = priorityOrder.indexOf(b.propertyName);
      if (pa !== -1 && pb !== -1) return pa - pb;
      if (pa !== -1) return -1;
      if (pb !== -1) return 1;
      return b.elementCount - a.elementCount || a.propertyName.localeCompare(b.propertyName);
    });
}

function csvEscape(val: string): string {
  return `"${String(val).replace(/"/g, '""')}"`;
}

/**
 * Exports a 4D/5D schedule CSV using a user-selected 3D meta property's exact values as `TaskName`
 * and sets `MatchProperty` so re-importing the edited CSV exact-links back to the same 3D elements.
 */
export function buildCsvGroupedByMetaProperty(options: ExportCsvByPropertyOptions): {
  csv: string;
  rowCount: number;
  elementCount: number;
  missingElementCount: number;
} {
  const {
    scheduleManager,
    elements,
    metaProperty,
    includeExpressIds = false,
    includeUnassigned = true,
  } = options;

  if (!metaProperty || !metaProperty.trim()) {
    const csv = scheduleManager.exportScheduleTemplateCSV();
    const rowCount = Math.max(0, csv.split("\n").length - 1);
    const elCount = Array.from(scheduleManager.tasks.values()).reduce((s, t) => s + t.elementIds.size, 0);
    return { csv, rowCount, elementCount: elCount, missingElementCount: 0 };
  }

  const targetPropLower = normKey(metaProperty);
  const headers = [
    "TaskID",
    "TaskName",
    "MatchProperty",
    "Category",
    "StartDate",
    "EndDate",
    "ActualStartDate",
    "ActualEndDate",
    "Status",
    "ModelID",
    "ElementCount",
    "UnitCost",
    "TotalCost",
    "ActualCost",
    "DelayDays",
    "CostImpact",
    "ExpressIDs",
  ];

  // Build quick lookup of existing task dates/costs by expressId so existing schedule data is carried over
  const existingTaskByEid = new Map<string, ScheduleTask>();
  for (const [, t] of scheduleManager.tasks) {
    for (const eid of t.elementIds) {
      existingTaskByEid.set(`${t.modelId}:${eid}`, t);
      existingTaskByEid.set(`:${eid}`, t);
    }
  }

  // Group 3D elements by exact property value (preserving original casing of first occurrence)
  const groups = new Map<
    string,
    {
      displayValue: string;
      matchPropCell: string;
      isUnassigned: boolean;
      modelId: string;
      category: string;
      expressIds: number[];
      inheritedTask?: ScheduleTask;
    }
  >();

  let missingElementCount = 0;

  for (const el of elements) {
    let rawVal: unknown = undefined;
    for (const [k, v] of Object.entries(el.properties)) {
      const kLower = normKey(k);
      const bareK = kLower.includes(".") ? kLower.slice(kLower.lastIndexOf(".") + 1) : kLower;
      if (kLower === targetPropLower || bareK === targetPropLower) {
        rawVal = v;
        break;
      }
    }
    const displayVal = rawVal === null || rawVal === undefined ? "" : String(rawVal).trim();
    const cat = String(el.properties["Category"] || "IFCELEMENT");

    let groupKey: string;
    let groupLabel: string;
    let isUnassigned = false;
    let matchPropCell = metaProperty;

    if (!displayVal) {
      missingElementCount++;
      if (!includeUnassigned) continue;
      isUnassigned = true;
      groupLabel = `Unassigned (${cat})`;
      groupKey = `__unassigned__::${cat.toLowerCase()}`;
      matchPropCell = "";
    } else {
      groupLabel = displayVal;
      groupKey = displayVal.toLowerCase();
    }

    let grp = groups.get(groupKey);
    if (!grp) {
      grp = {
        displayValue: groupLabel,
        matchPropCell,
        isUnassigned,
        modelId: el.modelId,
        category: cat,
        expressIds: [],
        inheritedTask:
          existingTaskByEid.get(`${el.modelId}:${el.expressId}`) ??
          existingTaskByEid.get(`:${el.expressId}`),
      };
      groups.set(groupKey, grp);
    }
    grp.expressIds.push(el.expressId);
    if (!grp.inheritedTask) {
      grp.inheritedTask =
        existingTaskByEid.get(`${el.modelId}:${el.expressId}`) ??
        existingTaskByEid.get(`:${el.expressId}`);
    }
  }

  const rows: string[] = [headers.join(",")];
  const baseDate = new Date();
  let idx = 0;
  let totalElements = 0;

  // Put assigned property groups first, unassigned fallback groups at the bottom
  const orderedGroups = Array.from(groups.values()).sort((a, b) =>
    a.isUnassigned === b.isUnassigned ? a.displayValue.localeCompare(b.displayValue) : a.isUnassigned ? 1 : -1
  );

  for (const grp of orderedGroups) {
    idx++;
    const count = grp.expressIds.length;
    totalElements += count;
    const inherited = grp.inheritedTask;

    const defaultStart = new Date(baseDate.getTime() + (idx - 1) * 7 * 86400000).toISOString().split("T")[0];
    const defaultEnd = new Date(baseDate.getTime() + idx * 7 * 86400000).toISOString().split("T")[0];

    const startDate = inherited?.startDate || defaultStart;
    const endDate = inherited?.endDate || defaultEnd;
    const actualStartDate = inherited?.actualStartDate || "";
    const actualEndDate = inherited?.actualEndDate || "";
    const status = inherited?.status || "Planned";
    const unitCost = inherited ? scheduleManager.getTaskUnitCost(inherited) : 250;
    const totalCost = Math.round(unitCost * count * 100) / 100;
    const actualCost = inherited?.actualCost !== undefined ? inherited.actualCost.toFixed(2) : "";
    const delayDays = inherited?.delayDays ?? 0;
    const costImpact = inherited?.costImpact ?? 0;
    // Always preserve ExpressIDs for unassigned elements so they aren't lost on re-import
    const idsCell = includeExpressIds || grp.isUnassigned ? csvEscape(grp.expressIds.join(";")) : "";

    rows.push(
      [
        `T-${String(idx).padStart(3, "0")}`,
        csvEscape(grp.displayValue),
        csvEscape(grp.matchPropCell),
        csvEscape(grp.category),
        startDate,
        endDate,
        actualStartDate,
        actualEndDate,
        status,
        csvEscape(grp.modelId),
        count,
        unitCost.toFixed(2),
        totalCost.toFixed(2),
        actualCost,
        delayDays,
        costImpact.toFixed(2),
        idsCell,
      ].join(",")
    );
  }

  return {
    csv: rows.join("\n"),
    rowCount: idx,
    elementCount: totalElements,
    missingElementCount,
  };
}

/**
 * Extracts all element properties from active Fragment models (via FragmentIndexer +
 * IfcParameterReader + model.properties) and exact-matches all ScheduleManager tasks.
 */
export async function linkScheduleTasksToLoadedModels(
  scheduleManager: ScheduleManager,
  activeModels: Array<[string, any]>
): Promise<CsvLinkReport> {
  const tasks = Array.from(scheduleManager.tasks.values());
  if (tasks.length === 0 || activeModels.length === 0) {
    return {
      totalTasks: tasks.length,
      linkedTasks: tasks.filter((t) => t.elementIds.size > 0).length,
      unlinkedTasks: tasks.filter((t) => t.elementIds.size === 0).length,
      totalLinkedElements: tasks.reduce((sum, t) => sum + t.elementIds.size, 0),
      unlinkedTaskNames: tasks.filter((t) => t.elementIds.size === 0).map((t) => t.name),
      matchedPropertiesUsed: [],
    };
  }

  const elements = await collectLoadedModelElements(activeModels);
  const index = buildPropertyMatchIndex(elements);
  const report = linkTasksToPropertyIndex(tasks, index);
  scheduleManager.recomputeCpmAndRollups();
  return report;
}
