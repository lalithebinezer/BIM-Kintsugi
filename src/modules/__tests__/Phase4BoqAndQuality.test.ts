// @vitest-environment happy-dom
import * as THREE from "three";
import { describe, it, expect } from "vitest";
import { CostRuleBookEngine } from "../CostRuleBookEngine";
import {
  extractQuantityData,
  generateBOQSummary,
  switchLineItemQuantitySource,
  buildGaebX83Xml,
  type BOQLineItem,
} from "../BoqGenerator";
import { evaluateModelQuality, exportQualityAuditCsv } from "../BimQualityAuditor";
import { BimAiCopilot } from "../BimAiCopilot";

describe("Phase 4: Rule-Book 5D BOQ, QTO Provenance, GAEB X83 & Model Quality Audit", () => {
  it("supports DIN 276, Uniclass, and MasterFormat classification matching with confidence scores and CSV import", () => {
    const rb = CostRuleBookEngine.getInstance();
    rb.setStandard("DIN276");

    // Exact code match -> confidence 1.0
    const exact = rb.matchElement({
      category: "IFCCOLUMN",
      elementName: "Custom Column",
      classificationCode: "331",
    });
    expect(exact[0].confidence).toBe(1.0);
    expect(exact[0].matchReason).toBe("classification-code");

    // Category + lexical material match
    const fuzzy = rb.matchElement({
      category: "IFCDUCTSEGMENT",
      elementName: "Supply HVAC Duct 600x400",
      preferredUnit: "m",
    });
    expect(fuzzy[0].entry.codes.MASTERFORMAT).toBe("23 31 13");
    expect(fuzzy[0].confidence).toBeGreaterThanOrEqual(0.75);

    // Import regional CSV catalog
    const importedCount = rb.importCatalogFromCsv(
      "code,description,category,unit,rate,labour,material,plant,wastePct\nCWICR-101,Precast Hollowcore Slab 250mm,IFCSLAB,m²,175,45,115,15,4"
    );
    expect(importedCount).toBe(1);
    const precastMatch = rb.matchElement({
      category: "IFCSLAB",
      elementName: "Precast Hollowcore Slab 250mm",
      classificationCode: "CWICR-101",
    });
    expect(precastMatch[0].entry.unitRate).toBe(175);
    const priced = rb.applyAssemblyPricing(100, precastMatch[0].entry);
    expect(priced.grossQuantity).toBe(104); // +4% waste
    expect(priced.totalCost).toBe(18200);
  });

  it("captures multi-parameter QTO provenance, switches source parameters cleanly, and builds valid GAEB X83 XML", () => {
    const extracted = extractQuantityData(
      { Name: "Concrete Wall W1" },
      {
        Qto_WallBaseQuantities: {
          NetArea: { value: 42.0 },
          GrossArea: { value: 48.0 },
          NetVolume: { value: 8.4 },
        },
      }
    );
    expect(extracted.availableQuantities).toHaveLength(3);
    expect(extracted.quantity).toBe(42.0);
    expect(extracted.quantityType).toBe("NetArea");

    const baseItem: BOQLineItem = {
      expressId: 501,
      modelId: "m1",
      category: "IFCWALL",
      elementName: "Concrete Wall W1",
      materialNumber: "C30",
      unit: extracted.unit,
      quantity: extracted.quantity,
      unitCost: 200,
      totalCost: extracted.quantity * 200,
      propertySetName: extracted.propertySetName,
      quantityType: extracted.quantityType,
      availableQuantities: extracted.availableQuantities,
      classificationCode: "331",
      expectedRateUnit: "m³",
    };

    // Traffic-light catches unit mismatch (m² vs m³)
    const auditBefore = CostRuleBookEngine.getInstance().auditBoqSummary(generateBOQSummary([baseItem]));
    expect(auditBefore.status).toBe("red");
    expect(auditBefore.issues[0].code).toBe("UNIT_MISMATCH");

    // Switch provenance to NetVolume (m³) -> clears mismatch!
    const switched = switchLineItemQuantitySource(baseItem, "NetVolume");
    expect(switched.unit).toBe("m³");
    expect(switched.quantity).toBe(8.4);
    expect(switched.totalCost).toBe(1680);

    const auditAfter = CostRuleBookEngine.getInstance().auditBoqSummary(generateBOQSummary([switched]));
    expect(auditAfter.status).toBe("green");

    const xml = buildGaebX83Xml(generateBOQSummary([switched]), "Tower Project");
    expect(xml).toContain("http://www.gaeb.de/GAEB_DA_XML/DA83/3.2");
    expect(xml).toContain("<Qty>8.400</Qty>");
    expect(xml).toContain("<QU>m3</QU>");
    expect(xml).toContain("<IT>1680.00</IT>");
  });

  it("audits model quality across all 6 DDC categories and exports CSV scorecard", () => {
    const report = evaluateModelQuality([
      {
        modelId: "m1",
        expressId: 1,
        category: "IFCCOLUMN",
        name: "Concrete Column C1",
        globalId: "GUID-DUP",
        storey: "Level 1",
        box: new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.4, 3, 0.4)),
        volumeM3: 0.48,
        psets: { Identity: { Material: "Concrete C35" }, Common: { Classification: "331" } },
        objectType: "RC Column",
      },
      {
        modelId: "m1",
        expressId: 2,
        category: "IFCBEAM",
        name: "B2",
        globalId: "GUID-DUP", // Duplicate GUID + missing material + zero volume!
        box: new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)),
        volumeM3: 0,
      },
    ]);

    expect(report.status).toBe("failed");
    expect(report.summaryBySeverity.error).toBeGreaterThanOrEqual(3); // missing material, zero volume, dup GUID
    const csv = exportQualityAuditCsv(report);
    expect(csv).toContain("GEO-001");
    expect(csv).toContain("REL-001");
  });

  it("handles quality audit, BOQ, and workspace congestion intents in BimAiCopilot", async () => {
    const copilot = BimAiCopilot.getInstance();
    const resBoq = await copilot.executeQuery("validate boq cost catalog");
    expect(resBoq.actionsExecuted).toContain("Generate 5D Rule-Book BOQ");
  });
});
