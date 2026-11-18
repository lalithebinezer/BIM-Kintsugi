/**
 * BimQualityAuditor — Model Data Quality & Completeness Rule Engine.
 *
 * Extends BIM-Kintsugi's IDS readiness checks with 6 configurable QA/QC rule categories
 * (Required Properties, Naming Convention, Classification, Geometric Sanity, Relationships,
 * Data Format), compliance scoring, and CSV export.
 */

import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { FragmentIndexer, type IndexedElementRecord } from "../core/FragmentIndexer";

export type QualityRuleCategory =
  | "required_properties"
  | "naming_convention"
  | "classification"
  | "geometric"
  | "relationships"
  | "data_format";

export type QualitySeverity = "error" | "warning" | "info";

export interface QualityAuditIssue {
  ruleId: string;
  ruleName: string;
  category: QualityRuleCategory;
  severity: QualitySeverity;
  modelId: string;
  expressId: number;
  elementName: string;
  elementCategory: string;
  message: string;
}

export interface QualityAuditReport {
  status: "passed" | "passed_with_warnings" | "failed";
  totalElements: number;
  elementsWithIssues: number;
  scorePercent: number;
  summaryBySeverity: Record<QualitySeverity, number>;
  summaryByCategory: Record<string, number>;
  issues: QualityAuditIssue[];
  failingModelIdMap: Record<string, Set<number>>;
}

export interface QualityRule {
  ruleId: string;
  name: string;
  category: QualityRuleCategory;
  severity: QualitySeverity;
  applicableCategories?: string[];
  check: (elem: IndexedElementRecord, seenGuids: Set<string>) => string | null;
}

const STRUCTURAL_OR_ENVELOPE = [
  "IFCWALL",
  "IFCWALLSTANDARDCASE",
  "IFCSLAB",
  "IFCCOLUMN",
  "IFCBEAM",
  "IFCFOOTING",
];

export const DEFAULT_QUALITY_RULES: QualityRule[] = [
  {
    ruleId: "REQ-001",
    name: "Element Name Required",
    category: "required_properties",
    severity: "error",
    check: (el) => (!el.name || el.name.trim().length === 0 ? "Missing element Name attribute" : null),
  },
  {
    ruleId: "REQ-002",
    name: "Spatial Storey Containment",
    category: "relationships",
    severity: "warning",
    applicableCategories: ["IFCWALL", "IFCWALLSTANDARDCASE", "IFCSLAB", "IFCDOOR", "IFCWINDOW"],
    check: (el) => (!el.storey || el.storey.trim().length === 0 ? "Not assigned to an IfcBuildingStorey" : null),
  },
  {
    ruleId: "REQ-003",
    name: "Material Defined for Structure",
    category: "required_properties",
    severity: "error",
    applicableCategories: ["IFCCOLUMN", "IFCBEAM", "IFCFOOTING", "IFCSLAB"],
    check: (el) => {
      let hasMat = false;
      if (el.psets) {
        for (const pset of Object.values(el.psets)) {
          for (const k of ["Material", "Structural Material", "MaterialName", "Material Name"]) {
            if (pset?.[k]) hasMat = true;
          }
        }
      }
      if (!hasMat && /concrete|steel|timber|c\d{2}/i.test(el.name || "")) hasMat = true;
      return hasMat ? null : "Missing material definition on structural element";
    },
  },
  {
    ruleId: "NAM-001",
    name: "Naming Sanity (Length & Charset)",
    category: "naming_convention",
    severity: "info",
    check: (el) => {
      const n = (el.name || "").trim();
      if (n.length > 0 && (n.length < 3 || n.length > 120)) {
        return `Name length (${n.length}) outside recommended 3–120 character range`;
      }
      if (/[\x00-\x1f<>]/.test(n)) {
        return "Name contains disallowed control or markup characters";
      }
      return null;
    },
  },
  {
    ruleId: "CLS-001",
    name: "Type / Classification Present",
    category: "classification",
    severity: "warning",
    check: (el) => {
      const hasClass = Boolean(el.objectType || el.predefinedType);
      if (hasClass) return null;
      if (el.psets) {
        for (const pset of Object.values(el.psets)) {
          if (pset?.["Assembly Code"] || pset?.["Classification"] || pset?.["Uniclass"] || pset?.["DIN276"]) {
            return null;
          }
        }
      }
      return "Missing ObjectType / Classification metadata";
    },
  },
  {
    ruleId: "GEO-001",
    name: "Non-Zero 3D Geometry & Bounding Box",
    category: "geometric",
    severity: "error",
    applicableCategories: STRUCTURAL_OR_ENVELOPE,
    check: (el) => {
      if (typeof el.volumeM3 === "number" && el.volumeM3 <= 0) {
        return "Reported geometric volume is zero or negative";
      }
      if (el.box) {
        const sz = new THREE.Vector3();
        el.box.getSize(sz);
        if (sz.x * sz.y * sz.z < 1e-6) {
          return "Degenerate zero-volume bounding box";
        }
      }
      return null;
    },
  },
  {
    ruleId: "REL-001",
    name: "Unique IFC GlobalId",
    category: "data_format",
    severity: "error",
    check: (el, seenGuids) => {
      const g = el.globalId?.trim();
      if (!g) return null; // Only validate uniqueness when GlobalId exists
      if (seenGuids.has(g)) {
        return `Duplicate IFC GlobalId detected: ${g}`;
      }
      seenGuids.add(g);
      return null;
    },
  },
];

/**
 * Evaluates a set of indexed BIM elements against configured QA/QC quality rules.
 */
export function evaluateModelQuality(
  elements: IndexedElementRecord[],
  rules: QualityRule[] = DEFAULT_QUALITY_RULES
): QualityAuditReport {
  const issues: QualityAuditIssue[] = [];
  const summaryBySeverity: Record<QualitySeverity, number> = { error: 0, warning: 0, info: 0 };
  const summaryByCategory: Record<string, number> = {};
  const failingElems = new Set<string>();
  const failingModelIdMap: Record<string, Set<number>> = {};
  const seenGuids = new Set<string>();

  for (const el of elements) {
    const catUp = (el.category || "").toUpperCase();
    for (const rule of rules) {
      if (rule.applicableCategories && !rule.applicableCategories.some((c) => catUp.includes(c))) {
        continue;
      }
      const msg = rule.check(el, seenGuids);
      if (msg) {
        issues.push({
          ruleId: rule.ruleId,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          modelId: el.modelId,
          expressId: el.expressId,
          elementName: el.name,
          elementCategory: el.category,
          message: msg,
        });
        summaryBySeverity[rule.severity]++;
        summaryByCategory[rule.category] = (summaryByCategory[rule.category] ?? 0) + 1;
        failingElems.add(`${el.modelId}:${el.expressId}`);
        if (rule.severity === "error") {
          if (!failingModelIdMap[el.modelId]) failingModelIdMap[el.modelId] = new Set<number>();
          failingModelIdMap[el.modelId].add(el.expressId);
        }
      }
    }
  }

  const totalElements = elements.length;
  const elementsWithIssues = failingElems.size;
  const scorePercent =
    totalElements === 0
      ? 100
      : Number((Math.max(0, 1 - summaryBySeverity.error / Math.max(1, totalElements)) * 100).toFixed(1));
  const status: QualityAuditReport["status"] =
    summaryBySeverity.error > 0
      ? "failed"
      : summaryBySeverity.warning > 0
      ? "passed_with_warnings"
      : "passed";

  return {
    status,
    totalElements,
    elementsWithIssues,
    scorePercent,
    summaryBySeverity,
    summaryByCategory,
    issues,
    failingModelIdMap,
  };
}

export function exportQualityAuditCsv(report: QualityAuditReport): string {
  const header = ["RuleID", "RuleName", "Category", "Severity", "ModelID", "ExpressID", "ElementCategory", "ElementName", "Message"];
  const rows = report.issues.map((i) => [
    i.ruleId,
    `"${i.ruleName.replace(/"/g, '""')}"`,
    i.category,
    i.severity,
    i.modelId,
    i.expressId,
    i.elementCategory,
    `"${i.elementName.replace(/"/g, '""')}"`,
    `"${i.message.replace(/"/g, '""')}"`,
  ]);
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

export class BimQualityAuditor {
  private static instance: BimQualityAuditor | null = null;
  private lastReport: QualityAuditReport | null = null;

  private constructor() {}

  public static getInstance(): BimQualityAuditor {
    if (!BimQualityAuditor.instance) {
      BimQualityAuditor.instance = new BimQualityAuditor();
    }
    return BimQualityAuditor.instance;
  }

  public getLastReport(): QualityAuditReport | null {
    return this.lastReport;
  }

  public async auditLoadedModels(): Promise<QualityAuditReport> {
    const engine = BimEngine.getInstance();
    const indexer = FragmentIndexer.getInstance();
    const allElements: IndexedElementRecord[] = [];

    if ((engine.fragments as any)?.initialized && engine.fragments?.list) {
      for (const [modelId, model] of engine.fragments.list) {
        const indexed = await indexer.indexModel(modelId, model, {
          includeBoxes: true,
          includePsets: true,
        });
        allElements.push(...indexed.elements);
      }
    }

    const report = evaluateModelQuality(allElements);
    this.lastReport = report;
    return report;
  }
}
