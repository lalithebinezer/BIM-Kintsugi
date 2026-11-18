/**
 * CostRuleBookEngine — Multi-Standard Classification & 5D Rate-Matching Engine.
 *
 * Implements clean-room Rule-Book lookups across DIN 276, Uniclass 2015, and
 * CSI MasterFormat, multi-stage fuzzy/token rate matching with confidence scores,
 * composite Labour/Material/Plant assembly breakdowns with waste factors, custom
 * CSV rate catalog import, and traffic-light BOQ validation auditing.
 */

import type { BOQSummary } from "./BoqGenerator";
import type { QuantityUnit } from "./CostRateManager";

export type ClassificationStandard = "DIN276" | "UNICLASS" | "MASTERFORMAT";

export interface AssemblyRates {
  labourRate: number;
  materialRate: number;
  plantRate: number;
  wasteFactorPct?: number;
}

export interface CostRuleBookEntry {
  id: string;
  description: string;
  ifcCategories: string[];
  keywords: string[];
  unit: QuantityUnit;
  unitRate: number;
  codes: Record<ClassificationStandard, string>;
  assembly: AssemblyRates;
}

export interface RateMatchCandidate {
  entry: CostRuleBookEntry;
  confidence: number; // 0..1
  matchReason: "classification-code" | "category-material" | "lexical-fuzzy" | "category-fallback";
}

export interface BoqAuditIssue {
  expressId: number;
  elementName: string;
  severity: "red" | "amber";
  code: "MISSING_QTO" | "ZERO_RATE" | "UNIT_MISMATCH" | "LOW_CONFIDENCE" | "UNCLASSIFIED";
  message: string;
}

export interface BoqValidationReport {
  status: "green" | "amber" | "red";
  redCount: number;
  amberCount: number;
  greenCount: number;
  issues: BoqAuditIssue[];
}

export const BUILTIN_COST_RULEBOOK: CostRuleBookEntry[] = [
  {
    id: "rb-footing-rc",
    description: "Reinforced Concrete Foundations & Strip Footings C30/37",
    ifcCategories: ["IFCFOOTING", "IFCPILE"],
    keywords: ["footing", "foundation", "pile", "pad", "concrete", "c30"],
    unit: "m³",
    unitRate: 480,
    codes: { DIN276: "322", UNICLASS: "EF_20_10_30", MASTERFORMAT: "03 30 00" },
    assembly: { labourRate: 145, materialRate: 265, plantRate: 70, wasteFactorPct: 5 },
  },
  {
    id: "rb-column-rc",
    description: "Reinforced Concrete Columns In-Situ C35/45",
    ifcCategories: ["IFCCOLUMN"],
    keywords: ["column", "pillar", "concrete", "rc", "c35", "c40"],
    unit: "m³",
    unitRate: 620,
    codes: { DIN276: "331", UNICLASS: "EF_20_10_15", MASTERFORMAT: "03 30 53" },
    assembly: { labourRate: 220, materialRate: 310, plantRate: 90, wasteFactorPct: 4 },
  },
  {
    id: "rb-beam-steel",
    description: "Structural Steel Beams & Rolled Sections S355",
    ifcCategories: ["IFCBEAM", "IFCMEMBER"],
    keywords: ["beam", "girder", "steel", "w12", "ub", "uc", "ipe", "hea"],
    unit: "m³",
    unitRate: 1450,
    codes: { DIN276: "331", UNICLASS: "EF_20_10_85", MASTERFORMAT: "05 12 00" },
    assembly: { labourRate: 410, materialRate: 860, plantRate: 180, wasteFactorPct: 3 },
  },
  {
    id: "rb-slab-rc",
    description: "Suspended & Ground Concrete Floor Slabs C30/37",
    ifcCategories: ["IFCSLAB"],
    keywords: ["slab", "deck", "floor", "concrete", "c25", "c30"],
    unit: "m³",
    unitRate: 420,
    codes: { DIN276: "351", UNICLASS: "EF_20_20", MASTERFORMAT: "03 30 00" },
    assembly: { labourRate: 135, materialRate: 225, plantRate: 60, wasteFactorPct: 5 },
  },
  {
    id: "rb-wall-ext",
    description: "Exterior Structural Masonry & Concrete Wall Assembly",
    ifcCategories: ["IFCWALL", "IFCWALLSTANDARDCASE"],
    keywords: ["wall", "exterior", "shear", "masonry", "brick", "concrete", "block"],
    unit: "m²",
    unitRate: 155,
    codes: { DIN276: "331", UNICLASS: "EF_25_10", MASTERFORMAT: "04 22 00" },
    assembly: { labourRate: 62, materialRate: 78, plantRate: 15, wasteFactorPct: 6 },
  },
  {
    id: "rb-wall-partition",
    description: "Interior Drywall Gypsum Acoustic Partition Wall",
    ifcCategories: ["IFCWALL", "IFCWALLSTANDARDCASE"],
    keywords: ["partition", "interior", "gypsum", "drywall", "stud"],
    unit: "m²",
    unitRate: 98,
    codes: { DIN276: "341", UNICLASS: "EF_25_10_30", MASTERFORMAT: "09 21 16" },
    assembly: { labourRate: 44, materialRate: 48, plantRate: 6, wasteFactorPct: 8 },
  },
  {
    id: "rb-curtain-glazing",
    description: "Aluminum Framed Double Glazed Curtain Wall & Windows",
    ifcCategories: ["IFCWINDOW", "IFCCURTAINWALL"],
    keywords: ["window", "glazing", "curtain", "glass", "facade", "aluminum"],
    unit: "ea",
    unitRate: 560,
    codes: { DIN276: "334", UNICLASS: "EF_25_30", MASTERFORMAT: "08 44 13" },
    assembly: { labourRate: 150, materialRate: 370, plantRate: 40, wasteFactorPct: 2 },
  },
  {
    id: "rb-door-fire",
    description: "Architectural Timber & Fire-Rated Door Set Complete",
    ifcCategories: ["IFCDOOR"],
    keywords: ["door", "fd30", "fd60", "fire", "portal", "timber"],
    unit: "ea",
    unitRate: 450,
    codes: { DIN276: "344", UNICLASS: "Pr_30_59_24", MASTERFORMAT: "08 14 00" },
    assembly: { labourRate: 120, materialRate: 315, plantRate: 15, wasteFactorPct: 0 },
  },
  {
    id: "rb-roof-deck",
    description: "Insulated Roof Deck & EPDM Waterproof Membrane",
    ifcCategories: ["IFCROOF"],
    keywords: ["roof", "membrane", "insulation", "waterproof"],
    unit: "m²",
    unitRate: 128,
    codes: { DIN276: "361", UNICLASS: "EF_20_30", MASTERFORMAT: "07 53 23" },
    assembly: { labourRate: 46, materialRate: 72, plantRate: 10, wasteFactorPct: 7 },
  },
  {
    id: "rb-mep-duct",
    description: "Galvanized HVAC Sheet Metal Supply/Return Ductwork",
    ifcCategories: ["IFCDUCTSEGMENT", "IFCFLOWSEGMENT"],
    keywords: ["duct", "hvac", "supply", "return", "air", "ventilation"],
    unit: "m",
    unitRate: 115,
    codes: { DIN276: "430", UNICLASS: "EF_65_40", MASTERFORMAT: "23 31 13" },
    assembly: { labourRate: 52, materialRate: 55, plantRate: 8, wasteFactorPct: 5 },
  },
  {
    id: "rb-mep-pipe",
    description: "Domestic Water / Chilled Water Copper & Steel Piping",
    ifcCategories: ["IFCPIPESEGMENT", "IFCFLOWSEGMENT"],
    keywords: ["pipe", "piping", "plumbing", "water", "drain", "sprinkler", "dn100"],
    unit: "m",
    unitRate: 88,
    codes: { DIN276: "410", UNICLASS: "EF_55_70", MASTERFORMAT: "22 11 16" },
    assembly: { labourRate: 42, materialRate: 40, plantRate: 6, wasteFactorPct: 5 },
  },
  {
    id: "rb-mep-terminal",
    description: "MEP Diffusers, Valves & Terminal Equipment",
    ifcCategories: ["IFCFLOWTERMINAL", "IFCFLOWFITTING"],
    keywords: ["terminal", "diffuser", "sprinkler", "valve", "outlet", "fixture"],
    unit: "ea",
    unitRate: 190,
    codes: { DIN276: "434", UNICLASS: "Pr_70_65", MASTERFORMAT: "23 37 13" },
    assembly: { labourRate: 75, materialRate: 105, plantRate: 10, wasteFactorPct: 0 },
  },
];

function tokenize(str: string): Set<string> {
  return new Set(
    str
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length >= 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const tok of a) {
    if (b.has(tok)) inter++;
  }
  return inter / (a.size + b.size - inter);
}

function normalizeUnit(unit?: string): string {
  const u = (unit || "").trim().toLowerCase();
  if (u === "m3" || u === "m³") return "m³";
  if (u === "m2" || u === "m²") return "m²";
  if (u === "m" || u === "lm") return "m";
  if (u === "ea" || u === "st" || u === "pcs" || u === "count" || u === "nr") return "ea";
  return u;
}

export class CostRuleBookEngine {
  private static instance: CostRuleBookEngine | null = null;
  private entries: CostRuleBookEntry[] = [...BUILTIN_COST_RULEBOOK];
  private activeStandard: ClassificationStandard = "DIN276";

  private constructor() {}

  public static getInstance(): CostRuleBookEngine {
    if (!CostRuleBookEngine.instance) {
      CostRuleBookEngine.instance = new CostRuleBookEngine();
    }
    return CostRuleBookEngine.instance;
  }

  public setStandard(standard: ClassificationStandard): void {
    this.activeStandard = standard;
  }

  public getStandard(): ClassificationStandard {
    return this.activeStandard;
  }

  public getEntries(): CostRuleBookEntry[] {
    return this.entries;
  }

  public addCustomEntries(entries: CostRuleBookEntry[]): void {
    const byId = new Map(this.entries.map((e) => [e.id, e]));
    for (const e of entries) byId.set(e.id, e);
    this.entries = Array.from(byId.values());
  }

  /**
   * Imports custom CSV cost catalogs (supporting regional/CWICR-style exports).
   * Expected header columns (flexible): code, description, category, unit, rate, labour, material, plant, wastePct
   */
  public importCatalogFromCsv(csvText: string): number {
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) return 0;
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
    const col = (...names: string[]) => headers.findIndex((h) => names.some((n) => h.includes(n)));

    const codeIdx = col("code", "wbs", "din", "uniclass");
    const descIdx = col("desc", "name", "title", "item");
    const catIdx = col("cat", "ifc");
    const unitIdx = col("unit", "uom");
    const rateIdx = col("rate", "price", "cost");
    const labIdx = col("labour", "labor");
    const matIdx = col("material");
    const plantIdx = col("plant", "equip");
    const wasteIdx = col("waste");

    const imported: CostRuleBookEntry[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      const desc = descIdx >= 0 ? cells[descIdx] : "";
      const rate = rateIdx >= 0 ? Number(cells[rateIdx]) : 0;
      if (!desc || !Number.isFinite(rate) || rate <= 0) continue;

      const unitRaw = (unitIdx >= 0 ? normalizeUnit(cells[unitIdx]) : "ea") as QuantityUnit;
      const code = codeIdx >= 0 ? cells[codeIdx] : `CUSTOM-${i}`;
      const cat = catIdx >= 0 ? cells[catIdx].toUpperCase() : "IFCELEMENT";
      const labourRate = labIdx >= 0 ? Number(cells[labIdx]) || rate * 0.4 : rate * 0.4;
      const materialRate = matIdx >= 0 ? Number(cells[matIdx]) || rate * 0.5 : rate * 0.5;
      const plantRate = plantIdx >= 0 ? Number(cells[plantIdx]) || rate * 0.1 : rate * 0.1;
      const wasteFactorPct = wasteIdx >= 0 ? Number(cells[wasteIdx]) || 0 : 0;

      imported.push({
        id: `custom-${code.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${i}`,
        description: desc,
        ifcCategories: [cat],
        keywords: Array.from(tokenize(desc)),
        unit: (["m³", "m²", "m", "ea"].includes(unitRaw) ? unitRaw : "ea") as QuantityUnit,
        unitRate: rate,
        codes: {
          DIN276: code,
          UNICLASS: code,
          MASTERFORMAT: code,
        },
        assembly: { labourRate, materialRate, plantRate, wasteFactorPct },
      });
    }

    this.addCustomEntries(imported);
    return imported.length;
  }

  /**
   * Ranks top rule-book rate candidates for an element or BOQ line with confidence scores.
   */
  public matchElement(input: {
    category: string;
    elementName: string;
    materialNumber?: string;
    classificationCode?: string;
    preferredUnit?: string;
  }): RateMatchCandidate[] {
    const catUp = (input.category || "").toUpperCase();
    const codeNorm = (input.classificationCode || "").trim().toLowerCase();
    const elemTokens = tokenize(`${input.elementName} ${input.materialNumber || ""}`);
    const normUnit = normalizeUnit(input.preferredUnit);

    const scored: RateMatchCandidate[] = [];

    for (const entry of this.entries) {
      // Stage 1: Exact Classification code match
      const entryCodes = Object.values(entry.codes).map((c) => c.toLowerCase());
      if (codeNorm && entryCodes.some((c) => c === codeNorm)) {
        scored.push({ entry, confidence: 1.0, matchReason: "classification-code" });
        continue;
      }

      const catMatch = entry.ifcCategories.some((c) => catUp.includes(c));
      const kwTokens = new Set([...entry.keywords, ...tokenize(entry.description)]);
      const lexical = jaccardSimilarity(elemTokens, kwTokens);
      const unitBonus = normUnit && normalizeUnit(entry.unit) === normUnit ? 0.08 : 0;

      if (catMatch && lexical >= 0.12) {
        const conf = Number(Math.min(0.97, 0.72 + lexical * 0.4 + unitBonus).toFixed(2));
        scored.push({ entry, confidence: conf, matchReason: "category-material" });
      } else if (lexical >= 0.15) {
        const conf = Number(Math.min(0.85, 0.45 + lexical * 0.5 + unitBonus).toFixed(2));
        scored.push({ entry, confidence: conf, matchReason: "lexical-fuzzy" });
      } else if (catMatch) {
        const conf = Number(Math.min(0.75, 0.58 + unitBonus).toFixed(2));
        scored.push({ entry, confidence: conf, matchReason: "category-fallback" });
      }
    }

    scored.sort((a, b) => b.confidence - a.confidence);
    return scored.slice(0, 3);
  }

  /**
   * Computes gross quantity applying waste factor and total assembly unit rate.
   */
  public applyAssemblyPricing(
    netQuantity: number,
    entry: CostRuleBookEntry
  ): { grossQuantity: number; effectiveUnitRate: number; totalCost: number } {
    const wastePct = Math.max(0, entry.assembly.wasteFactorPct ?? 0);
    const grossQuantity = Number((netQuantity * (1 + wastePct / 100)).toFixed(3));
    const effectiveUnitRate =
      entry.unitRate > 0
        ? entry.unitRate
        : entry.assembly.labourRate + entry.assembly.materialRate + entry.assembly.plantRate;
    return {
      grossQuantity,
      effectiveUnitRate,
      totalCost: Number((grossQuantity * effectiveUnitRate).toFixed(2)),
    };
  }

  /**
   * Traffic-light BOQ validation audit: checks missing QTO, zero prices, unit mismatches,
   * low-confidence unconfirmed suggestions, and unclassified elements.
   */
  public auditBoqSummary(summary: BOQSummary): BoqValidationReport {
    const issues: BoqAuditIssue[] = [];
    let redCount = 0;
    let amberCount = 0;
    let greenCount = 0;

    for (const item of summary.items) {
      let rowLevel: "green" | "amber" | "red" = "green";

      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        issues.push({
          expressId: item.expressId,
          elementName: item.elementName,
          severity: "red",
          code: "MISSING_QTO",
          message: `${item.elementName} has zero/missing quantity in ${item.propertySetName || "Qto_*"}.`,
        });
        rowLevel = "red";
      }

      if (!Number.isFinite(item.unitCost) || item.unitCost <= 0) {
        issues.push({
          expressId: item.expressId,
          elementName: item.elementName,
          severity: "red",
          code: "ZERO_RATE",
          message: `${item.elementName} has $0 unit price.`,
        });
        rowLevel = "red";
      }

      if (item.expectedRateUnit && normalizeUnit(item.unit) !== normalizeUnit(item.expectedRateUnit)) {
        issues.push({
          expressId: item.expressId,
          elementName: item.elementName,
          severity: "red",
          code: "UNIT_MISMATCH",
          message: `Unit mismatch on ${item.elementName}: QTO '${item.unit}' vs Rate '${item.expectedRateUnit}'.`,
        });
        rowLevel = "red";
      }

      if (rowLevel !== "red") {
        if (typeof item.matchConfidence === "number" && item.matchConfidence < 0.7 && !item.matchConfirmed) {
          issues.push({
            expressId: item.expressId,
            elementName: item.elementName,
            severity: "amber",
            code: "LOW_CONFIDENCE",
            message: `${item.elementName} auto-matched at ${Math.round(item.matchConfidence * 100)}% confidence (needs review).`,
          });
          rowLevel = "amber";
        } else if (!item.classificationCode) {
          issues.push({
            expressId: item.expressId,
            elementName: item.elementName,
            severity: "amber",
            code: "UNCLASSIFIED",
            message: `${item.elementName} missing ${this.activeStandard} classification code.`,
          });
          rowLevel = "amber";
        }
      }

      if (rowLevel === "red") redCount++;
      else if (rowLevel === "amber") amberCount++;
      else greenCount++;
    }

    const status: "green" | "amber" | "red" =
      redCount > 0 ? "red" : amberCount > 0 ? "amber" : "green";

    return { status, redCount, amberCount, greenCount, issues };
  }
}
