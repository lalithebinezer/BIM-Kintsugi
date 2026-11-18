/**
 * RuleSearchEngine — Dynamic Rule-Based Search Sets & Navisworks XML Importer.
 *
 * Evaluates multi-condition boolean AST rules (AND / OR / NEWSET / Negate) across
 * IFC properties, categories, storeys, materials, and Psets without static element snapshots.
 * Re-evaluates cleanly across model reloads and federations via FragmentIndexer.
 */

import { FragmentIndexer, type IndexedElementRecord } from "../core/FragmentIndexer";
import { BimEngine } from "../core/BimEngine";

export type RuleField =
  | "name"
  | "category"
  | "storey"
  | "material"
  | "layer"
  | "pset"
  | "path"
  | "predefinedType";

export type RuleOperator =
  | "equals"
  | "not_equals"
  | "contains"
  | "regex"
  | "gt"
  | "gte"
  | "lt"
  | "lte";

export type RuleLogic = "AND" | "OR" | "NEWSET";

export interface RuleCondition {
  id?: string;
  enabled?: boolean;
  field: RuleField;
  /** Property set / key path, e.g. "Pset_WallCommon.IsExternal" or "Material" */
  propertyPath?: string;
  operator: RuleOperator;
  value: string | number;
  negate?: boolean;
  logic: RuleLogic;
}

export interface SearchSetRuleDefinition {
  id: string;
  name: string;
  sourceFile?: string;
  conditions: RuleCondition[];
  updatedAt: string;
}

export interface SearchableElement {
  modelId: string;
  expressId: number;
  name?: string;
  category?: string;
  storey?: string;
  material?: string;
  layer?: string;
  predefinedType?: string;
  path?: string;
  psets?: Record<string, Record<string, any>>;
}

export interface RuleEvaluationResult {
  modelIdMap: Record<string, Set<number>>;
  matchedCount: number;
  matchedElements: SearchableElement[];
}

/** Bitmask constants matching Navisworks FindSpec condition flags */
export const NAVISWORKS_FLAGS = {
  NEGATE_CONDITION: 32,
  OR_CONDITION: 64,
  REGEX_CONDITION: 128,
} as const;

const STORAGE_KEY = "bim_dynamic_search_sets_v1";

function escapeRegExp(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function compileSafeRegex(pattern: string): RegExp | null {
  try {
    // Reject pathological nested-quantifier patterns defensively
    if (pattern.length > 256 || /\([^)]*[+*][^)]*\)[+*]/.test(pattern)) {
      return new RegExp(escapeRegExp(pattern), "i");
    }
    return new RegExp(pattern, "i");
  } catch {
    return null;
  }
}

function unwrapValue(raw: any): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "object") {
    if ("value" in raw) return unwrapValue(raw.value);
    if ("NominalValue" in raw) return unwrapValue(raw.NominalValue);
    if ("Name" in raw) return unwrapValue(raw.Name);
  }
  return String(raw).trim();
}

function resolveFieldValues(elem: SearchableElement, cond: RuleCondition): string[] {
  switch (cond.field) {
    case "name":
      return [elem.name ?? ""];
    case "category":
      return [elem.category ?? ""];
    case "storey":
      return [elem.storey ?? ""];
    case "layer":
      return [elem.layer ?? elem.storey ?? ""];
    case "predefinedType":
      return [elem.predefinedType ?? ""];
    case "path":
      return [elem.path ?? `${elem.modelId}/${elem.storey ?? ""}/${elem.category ?? ""}/${elem.name ?? ""}`];
    case "material": {
      const vals: string[] = [];
      if (elem.material) vals.push(elem.material);
      if (elem.psets) {
        for (const pset of Object.values(elem.psets)) {
          for (const key of ["Material", "Structural Material", "Material Name", "MaterialName", "MaterialNumber"]) {
            if (pset && pset[key] !== undefined) {
              const v = unwrapValue(pset[key]);
              if (v) vals.push(v);
            }
          }
        }
      }
      return vals.length > 0 ? vals : [""];
    }
    case "pset": {
      const path = (cond.propertyPath || "").trim();
      if (!elem.psets || !path) return [""];
      const dotIdx = path.indexOf(".");
      if (dotIdx > 0) {
        const psetName = path.slice(0, dotIdx);
        const propName = path.slice(dotIdx + 1);
        const exactPset = elem.psets[psetName];
        if (exactPset && propName in exactPset) {
          return [unwrapValue(exactPset[propName])];
        }
        // Case-insensitive Pset/Property lookup fallback
        const pLower = psetName.toLowerCase();
        const kLower = propName.toLowerCase();
        for (const [pn, pObj] of Object.entries(elem.psets)) {
          if (pn.toLowerCase() !== pLower) continue;
          for (const [kn, kv] of Object.entries(pObj || {})) {
            if (kn.toLowerCase() === kLower) return [unwrapValue(kv)];
          }
        }
        return [""];
      }
      // Search across all property sets if only key name supplied
      const matches: string[] = [];
      const kLower = path.toLowerCase();
      for (const pObj of Object.values(elem.psets)) {
        for (const [kn, kv] of Object.entries(pObj || {})) {
          if (kn.toLowerCase() === kLower) {
            matches.push(unwrapValue(kv));
          }
        }
      }
      return matches.length > 0 ? matches : [""];
    }
    default:
      return [""];
  }
}

function testPredicate(elem: SearchableElement, cond: RuleCondition): boolean {
  const candidates = resolveFieldValues(elem, cond);
  const rawTarget = String(cond.value ?? "").trim();
  const op = cond.operator;

  let matched = false;

  if (op === "gt" || op === "gte" || op === "lt" || op === "lte") {
    const rhs = Number(cond.value);
    if (Number.isFinite(rhs)) {
      for (const c of candidates) {
        const lhs = Number(c);
        if (!Number.isFinite(lhs)) continue;
        if (op === "gt" && lhs > rhs) { matched = true; break; }
        if (op === "gte" && lhs >= rhs) { matched = true; break; }
        if (op === "lt" && lhs < rhs) { matched = true; break; }
        if (op === "lte" && lhs <= rhs) { matched = true; break; }
      }
    }
  } else if (op === "regex") {
    const re = compileSafeRegex(rawTarget);
    if (re) {
      matched = candidates.some((c) => re.test(c));
    }
  } else if (op === "contains") {
    const needle = rawTarget.toLowerCase();
    matched = needle.length > 0 && candidates.some((c) => c.toLowerCase().includes(needle));
  } else if (op === "not_equals") {
    const targetLower = rawTarget.toLowerCase();
    matched = candidates.every((c) => c.toLowerCase() !== targetLower);
  } else {
    // equals
    const targetLower = rawTarget.toLowerCase();
    matched = candidates.some((c) => c.toLowerCase() === targetLower);
  }

  return cond.negate ? !matched : matched;
}

/**
 * Evaluates a sequence of conditions using left-to-right boolean set precedence
 * (`NEWSET` starts an independent union branch; `AND` narrows the active branch;
 * `OR` widens the active branch from `prevSet`).
 */
export function evaluateRuleConditions(
  elements: SearchableElement[],
  conditions: RuleCondition[]
): RuleEvaluationResult {
  const activeConds = conditions.filter(
    (c) => c.enabled !== false && String(c.value ?? "").trim() !== ""
  );
  const modelIdMap: Record<string, Set<number>> = {};
  if (activeConds.length === 0 || elements.length === 0) {
    return { modelIdMap, matchedCount: 0, matchedElements: [] };
  }

  const keyOf = (e: SearchableElement) => `${e.modelId}:${e.expressId}`;
  const elementByKey = new Map<string, SearchableElement>();
  for (const e of elements) elementByKey.set(keyOf(e), e);

  let unionResult = new Set<string>();
  let activeSet = new Set<string>();
  let prevSet = new Set<string>();
  let isFirst = true;

  for (const cond of activeConds) {
    if (cond.logic === "AND") {
      prevSet = new Set(activeSet);
    }

    if (isFirst || cond.logic === "NEWSET") {
      isFirst = false;
      for (const k of activeSet) unionResult.add(k);
      activeSet = new Set<string>();
      for (const elem of elements) {
        if (testPredicate(elem, cond)) {
          activeSet.add(keyOf(elem));
        }
      }
      prevSet = new Set(activeSet);
    } else if (cond.logic === "AND") {
      const next = new Set<string>();
      for (const k of activeSet) {
        const elem = elementByKey.get(k);
        if (elem && testPredicate(elem, cond)) next.add(k);
      }
      activeSet = next;
    } else if (cond.logic === "OR") {
      const basePool = prevSet.size > 0 ? prevSet : new Set(elementByKey.keys());
      for (const k of basePool) {
        if (activeSet.has(k)) continue;
        const elem = elementByKey.get(k);
        if (elem && testPredicate(elem, cond)) activeSet.add(k);
      }
    }
  }

  for (const k of activeSet) unionResult.add(k);

  const matchedElements: SearchableElement[] = [];
  for (const k of unionResult) {
    const elem = elementByKey.get(k);
    if (!elem) continue;
    matchedElements.push(elem);
    if (!modelIdMap[elem.modelId]) modelIdMap[elem.modelId] = new Set<number>();
    modelIdMap[elem.modelId].add(elem.expressId);
  }

  return {
    modelIdMap,
    matchedCount: matchedElements.length,
    matchedElements,
  };
}

/**
 * Parses Autodesk Navisworks FindSpec / SelectionSets XML exports into reusable RuleSearchEngine definitions.
 */
export function importNavisworksSearchSetsXml(xmlText: string): SearchSetRuleDefinition[] {
  const results: SearchSetRuleDefinition[] = [];
  if (!xmlText || !xmlText.includes("<selectionset")) return results;

  const parseConditionBlock = (condAttrRaw: string, innerXml: string, index: number): RuleCondition | null => {
    const testMatch = condAttrRaw.match(/test=["']([^"']+)["']/i);
    const flagsMatch = condAttrRaw.match(/flags=["'](\d+)["']/i);
    const testVal = (testMatch?.[1] ?? "equals").toLowerCase();
    const flags = flagsMatch ? parseInt(flagsMatch[1], 10) : 0;

    const propMatch = innerXml.match(/<property[^>]*>[\s\S]*?<name(?:\s+internal=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/name>/i);
    const catMatch = innerXml.match(/<category[^>]*>[\s\S]*?<name(?:\s+internal=["']([^"']+)["'])?[^>]*>([\s\S]*?)<\/name>/i);
    const valMatch = innerXml.match(/<value[^>]*>[\s\S]*?<data[^>]*>([\s\S]*?)<\/data>/i);

    const internalProp = (propMatch?.[1] ?? "").trim();
    const propName = (propMatch?.[2] ?? "").trim();
    const catName = (catMatch?.[2] ?? "").trim();
    const rawValue = (valMatch?.[1] ?? "").replace(/&amp;/g, "&").trim();
    if (!rawValue) return null;

    let field: RuleField = "pset";
    let propertyPath: string | undefined;

    if (internalProp === "LcOaNodeSourceFile") {
      return null; // Source file metadata captured at set level
    } else if (internalProp === "LcOaSceneBaseUserName" || propName === "Name") {
      field = "name";
    } else if (internalProp === "LcOaNodeLayer" || catName === "Reference Level" || catName === "Base Level" || catName === "Level") {
      field = "storey";
    } else if (internalProp === "LcRevitPropertyElementCategory" || internalProp === "LcOaSceneBaseClassUserName") {
      field = "category";
    } else if (internalProp === "LcOaNodeMaterial") {
      field = "material";
    } else if (propName) {
      field = "pset";
      propertyPath = catName ? `${catName}.${propName}` : propName;
    }

    let operator: RuleOperator = "equals";
    let negate = Boolean(flags & NAVISWORKS_FLAGS.NEGATE_CONDITION);
    if (testVal === "contains") operator = "contains";
    else if (testVal === "regex" || (flags & NAVISWORKS_FLAGS.REGEX_CONDITION)) operator = "regex";
    else if (testVal === "not_equals") {
      operator = "equals";
      negate = !negate;
    }

    const logic: RuleLogic =
      index === 0 ? "NEWSET" : (flags & NAVISWORKS_FLAGS.OR_CONDITION) ? "OR" : "AND";

    return {
      field,
      propertyPath,
      operator,
      value: rawValue,
      negate,
      logic,
    };
  };

  const setRegex = /<selectionset\b([^>]*)>([\s\S]*?)<\/selectionset>/gi;
  let setMatch: RegExpExecArray | null;
  let setIdx = 1;

  while ((setMatch = setRegex.exec(xmlText)) !== null) {
    const attrs = setMatch[1];
    const body = setMatch[2];
    const nameMatch = attrs.match(/name=["']([^"']+)["']/i);
    const setName = (nameMatch?.[1] ?? `Navisworks Set ${setIdx}`).trim();

    let sourceFile: string | undefined;
    const conditions: RuleCondition[] = [];
    const condRegex = /<condition\b([^>]*)>([\s\S]*?)<\/condition>/gi;
    let cMatch: RegExpExecArray | null;

    while ((cMatch = condRegex.exec(body)) !== null) {
      if (/internal=["']LcOaNodeSourceFile["']/i.test(cMatch[2])) {
        const srcVal = cMatch[2].match(/<data[^>]*>([\s\S]*?)<\/data>/i)?.[1]?.trim();
        if (srcVal) sourceFile = srcVal;
        continue;
      }
      const parsed = parseConditionBlock(cMatch[1], cMatch[2], conditions.length);
      if (parsed) conditions.push(parsed);
    }

    if (conditions.length > 0) {
      results.push({
        id: `nw-rule-${setIdx}-${setName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        name: setName,
        sourceFile,
        conditions,
        updatedAt: new Date().toISOString(),
      });
    }
    setIdx++;
  }

  return results;
}

export class RuleSearchEngine {
  private static instance: RuleSearchEngine | null = null;
  private rules: Map<string, SearchSetRuleDefinition> = new Map();

  private constructor() {
    this.loadRules();
  }

  public static getInstance(): RuleSearchEngine {
    if (!RuleSearchEngine.instance) {
      RuleSearchEngine.instance = new RuleSearchEngine();
    }
    return RuleSearchEngine.instance;
  }

  private loadRules(): void {
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const arr = JSON.parse(raw) as SearchSetRuleDefinition[];
      for (const def of arr) {
        if (def && def.id) this.rules.set(def.id, def);
      }
    } catch {
      // Ignore malformed storage
    }
  }

  private persistRules(): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(this.rules.values())));
    } catch {
      // Ignore storage quota errors
    }
  }

  public upsertRule(rule: SearchSetRuleDefinition): void {
    this.rules.set(rule.id, { ...rule, updatedAt: new Date().toISOString() });
    this.persistRules();
  }

  public getRules(): SearchSetRuleDefinition[] {
    return Array.from(this.rules.values());
  }

  public getRule(id: string): SearchSetRuleDefinition | undefined {
    return this.rules.get(id);
  }

  public deleteRule(id: string): boolean {
    const deleted = this.rules.delete(id);
    if (deleted) this.persistRules();
    return deleted;
  }

  public importNavisworksXml(xmlText: string): SearchSetRuleDefinition[] {
    const imported = importNavisworksSearchSetsXml(xmlText);
    for (const def of imported) {
      this.rules.set(def.id, def);
    }
    if (imported.length > 0) this.persistRules();
    return imported;
  }

  /**
   * Evaluates a rule definition across all currently loaded models via FragmentIndexer.
   */
  public async evaluateAgainstLoadedModels(
    ruleOrConditions: SearchSetRuleDefinition | RuleCondition[]
  ): Promise<RuleEvaluationResult> {
    const conditions = Array.isArray(ruleOrConditions)
      ? ruleOrConditions
      : ruleOrConditions.conditions;
    const engine = BimEngine.getInstance();
    const indexer = FragmentIndexer.getInstance();
    const searchable: SearchableElement[] = [];

    if ((engine.fragments as any)?.initialized && engine.fragments?.list) {
      for (const [modelId, model] of engine.fragments.list) {
        const indexed = await indexer.indexModel(modelId, model, {
          includeBoxes: false,
          includePsets: true,
        });
        for (const el of indexed.elements as IndexedElementRecord[]) {
          searchable.push({
            modelId: el.modelId,
            expressId: el.expressId,
            name: el.name,
            category: el.category,
            storey: el.storey,
            predefinedType: el.predefinedType,
            psets: el.psets,
          });
        }
      }
    }

    return evaluateRuleConditions(searchable, conditions);
  }
}
