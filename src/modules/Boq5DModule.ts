import { BimEngine } from "../core/BimEngine";
import { FragmentIndexer } from "../core/FragmentIndexer";
import {
  extractQuantityData,
  generateBOQSummary,
  exportBOQAsCSV,
  buildGaebX83Xml,
  resolveCategoryUnitCost,
  type BOQLineItem,
  type BOQSummary,
} from "./BoqGenerator";
import { CostRuleBookEngine, type ClassificationStandard } from "./CostRuleBookEngine";

export class Boq5DModule {
  private engine: BimEngine;

  constructor() {
    this.engine = BimEngine.getInstance();
  }

  /**
   * Builds a rich 5D BOQ summary directly from loaded Fragments models via FragmentIndexer,
   * attaching QTO parameter provenance, classification codes, confidence scores, and assembly pricing.
   */
  public async generateSummary(standard?: ClassificationStandard): Promise<BOQSummary> {
    const ruleBook = CostRuleBookEngine.getInstance();
    if (standard) ruleBook.setStandard(standard);

    const indexer = FragmentIndexer.getInstance();
    const lineItems: BOQLineItem[] = [];

    if (this.engine.fragments?.initialized && this.engine.fragments.list && this.engine.fragments.list.size > 0) {
      for (const [modelId, model] of this.engine.fragments.list) {
        const indexed = await indexer.indexModel(modelId, model, {
          includeBoxes: true,
          includePsets: true,
        });
        for (const el of indexed.elements) {
          const extracted = extractQuantityData(
            { Name: el.name, Category: el.category },
            el.psets
          );
          const qty =
            extracted.quantity > 0
              ? extracted.quantity
              : el.volumeM3 && el.volumeM3 > 0
              ? el.volumeM3
              : el.areaM2 && el.areaM2 > 0
              ? el.areaM2
              : 1;
          const unit =
            extracted.quantity > 0
              ? extracted.unit
              : el.volumeM3 && el.volumeM3 > 0
              ? "m³"
              : el.areaM2 && el.areaM2 > 0
              ? "m²"
              : "ea";

          const candidates = ruleBook.matchElement({
            category: el.category,
            elementName: el.name,
            materialNumber: extracted.materialNumber,
            preferredUnit: unit,
          });
          const best = candidates[0];
          const unitCost = best ? best.entry.unitRate : resolveCategoryUnitCost(el.category, 0);
          const pricing = best
            ? ruleBook.applyAssemblyPricing(qty, best.entry)
            : { grossQuantity: qty, effectiveUnitRate: unitCost, totalCost: Number((qty * unitCost).toFixed(2)) };

          lineItems.push({
            expressId: el.expressId,
            modelId: el.modelId,
            category: el.category,
            elementName: el.name,
            materialNumber: extracted.materialNumber,
            unit,
            quantity: Number(qty.toFixed(3)),
            grossQuantity: pricing.grossQuantity,
            wasteFactorPct: best?.entry.assembly.wasteFactorPct ?? 0,
            unitCost: pricing.effectiveUnitRate,
            totalCost: pricing.totalCost,
            propertySetName: extracted.propertySetName || "GeometricFallback",
            quantityType: extracted.quantityType || "Computed",
            availableQuantities: extracted.availableQuantities,
            classificationCode: best ? best.entry.codes[ruleBook.getStandard()] : undefined,
            expectedRateUnit: best?.entry.unit,
            matchConfidence: best?.confidence,
            matchConfirmed: best ? best.confidence >= 0.95 : false,
          });
        }
      }
    }

    return generateBOQSummary(lineItems);
  }

  public async exportCSV(standard?: ClassificationStandard) {
    const summary = await this.generateSummary(standard);
    exportBOQAsCSV(summary);
  }

  public async exportGaebX83(projectName?: string, standard?: ClassificationStandard): Promise<string> {
    const summary = await this.generateSummary(standard);
    const xml = buildGaebX83Xml(summary, projectName);
    if (typeof document !== "undefined") {
      const blob = new Blob([xml], { type: "application/xml;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BOQ_${new Date().toISOString().split("T")[0]}.X83`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    return xml;
  }
}
