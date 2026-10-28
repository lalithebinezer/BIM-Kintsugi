/**
 * IDS Checker — Information Delivery Specification (IDS) Compliance Engine.
 *
 * Checks loaded IFC models for 4D schedule and 5D cost estimating data readiness
 * across structural & architectural entities, and exports buildingSMART IDS XML.
 */

import * as OBC from "@thatopen/components";

export interface IDSValidationResult {
  passed: boolean;
  totalChecked: number;
  passCount: number;
  failCount: number;
  failingCategories: string[];
}

export interface IdsRuleDefinition {
  entity: string;
  pset: string;
  property: string;
}

const DEFAULT_BIM_READINESS_RULES: IdsRuleDefinition[] = [
  { entity: "IFCWALL", pset: "Qto_WallBaseQuantities", property: "NetVolume" },
  { entity: "IFCSLAB", pset: "Qto_SlabBaseQuantities", property: "NetVolume" },
  { entity: "IFCCOLUMN", pset: "Qto_ColumnBaseQuantities", property: "NetVolume" },
  { entity: "IFCBEAM", pset: "Qto_BeamBaseQuantities", property: "NetVolume" },
  { entity: "IFCDOOR", pset: "Pset_DoorCommon", property: "FireRating" },
  { entity: "IFCWINDOW", pset: "Pset_WindowCommon", property: "ThermalTransmittance" },
];

export class IDSChecker {
  private components: OBC.Components;
  public ids: OBC.IDSSpecifications;

  constructor(components: OBC.Components) {
    this.components = components;
    this.ids = components.get(OBC.IDSSpecifications);
  }

  /**
   * Run automated 4D/5D data readiness validation on loaded fragment models
   * across walls, slabs, columns, beams, doors, and windows.
   */
  public async validateBimDataReadiness(): Promise<IDSValidationResult> {
    let passCount = 0;
    let failCount = 0;
    const failingCategories: string[] = [];

    const fragments = this.components.get(OBC.FragmentsManager);

    for (const rule of DEFAULT_BIM_READINESS_RULES) {
      const spec = this.ids.create(`IDS_${rule.entity}_${rule.property}`, ["IFC4", "IFC2X3"]);
      spec.description = `Verifies ${rule.entity} contains ${rule.pset}.${rule.property}`;

      const entityFacet = new OBC.IDSEntity(this.components, {
        type: "simple",
        parameter: rule.entity,
      });
      spec.applicability.add(entityFacet);

      const propFacet = new OBC.IDSProperty(
        this.components,
        { type: "simple", parameter: rule.pset },
        { type: "simple", parameter: rule.property }
      );
      spec.requirements.add(propFacet);

      let ruleFailCount = 0;

      for (const [, model] of fragments.list) {
        try {
          const modelId = model.modelId || "model";
          const result = await spec.test([new RegExp(modelId)]);
          const { fail, pass } = this.ids.getModelIdMap(result);

          for (const mId in pass) {
            passCount += pass[mId].size;
          }
          for (const mId in fail) {
            const count = fail[mId].size;
            failCount += count;
            ruleFailCount += count;
          }
        } catch (err) {
          console.warn(`IDS spec test warning (${rule.entity}):`, err);
        }
      }

      if (ruleFailCount > 0) {
        failingCategories.push(`${rule.entity} (${ruleFailCount} missing ${rule.pset}.${rule.property})`);
      }
    }

    const totalChecked = passCount + failCount;
    return {
      passed: failCount === 0 && totalChecked > 0,
      totalChecked,
      passCount,
      failCount,
      failingCategories,
    };
  }

  /**
   * Serializes the 4D/5D BIM readiness rules to buildingSMART IDS 1.0 XML format.
   */
  public exportIdsXml(): string {
    const serializedSpecs: string[] = [];
    try {
      for (const r of DEFAULT_BIM_READINESS_RULES) {
        const spec = this.ids.create(`IDS_${r.entity}_${r.property}`, ["IFC4", "IFC2X3"]);
        spec.description = `Verifies ${r.entity} contains ${r.pset}.${r.property}`;
        const entityFacet = new OBC.IDSEntity(this.components, {
          type: "simple",
          parameter: r.entity,
        });
        spec.applicability.add(entityFacet);
        const propFacet = new OBC.IDSProperty(
          this.components,
          { type: "simple", parameter: r.pset },
          { type: "simple", parameter: r.property }
        );
        spec.requirements.add(propFacet);
        if (typeof (spec as any).serialize === "function") {
          const xml = (spec as any).serialize();
          if (typeof xml === "string" && xml.includes("<specification")) {
            serializedSpecs.push(xml);
          }
        }
      }
    } catch (e) {}

    const specsXml =
      serializedSpecs.length > 0
        ? serializedSpecs.join("\n")
        : DEFAULT_BIM_READINESS_RULES.map(
            (r) => `    <specification name="${r.entity}_${r.property}" ifcVersion="IFC4 IFC2X3">
      <applicability minOccurs="0" maxOccurs="unbounded">
        <entity><name><simpleValue>${r.entity}</simpleValue></name></entity>
      </applicability>
      <requirements>
        <property dataType="IFCREAL" cardinality="required">
          <propertySet><simpleValue>${r.pset}</simpleValue></propertySet>
          <baseName><simpleValue>${r.property}</simpleValue></baseName>
        </property>
      </requirements>
    </specification>`
          ).join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<ids xmlns="http://standards.buildingsmart.org/IDS" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <info>
    <title>BIM Kintsugi — 4D/5D/6D Data Readiness Specification</title>
    <description>Automated Information Delivery Specification for Qto and Pset validation</description>
    <date>${new Date().toISOString().slice(0, 10)}</date>
  </info>
  <specifications>
${specsXml}
  </specifications>
</ids>`;
  }
}
