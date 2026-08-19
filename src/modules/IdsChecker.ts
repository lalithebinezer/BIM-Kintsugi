/**
 * IDS Checker — Information Delivery Specification (IDS) Compliance Engine.
 *
 * Checks loaded IFC models for 4D schedule and 5D cost estimating data readiness.
 */

import * as OBC from "@thatopen/components";

export interface IDSValidationResult {
  passed: boolean;
  totalChecked: number;
  passCount: number;
  failCount: number;
  failingCategories: string[];
}

export class IDSChecker {
  private components: OBC.Components;
  public ids: OBC.IDSSpecifications;

  constructor(components: OBC.Components) {
    this.components = components;
    this.ids = components.get(OBC.IDSSpecifications);
  }

  /**
   * Run automated 4D/5D data readiness validation on loaded fragment models.
   */
  public async validateBimDataReadiness(): Promise<IDSValidationResult> {
    const spec = this.ids.create("4D_5D_BIM_Readiness", ["IFC4", "IFC2X3"]);
    spec.description = "Verifies elements contain essential 4D scheduling and 5D cost estimating parameters";

    // Entity applicability: check major structural & architectural categories
    const wallEntity = new OBC.IDSEntity(this.components, {
      type: "simple",
      parameter: "IFCWALL",
    });
    spec.applicability.add(wallEntity);

    // Quantity takeoff requirement
    const qtoProperty = new OBC.IDSProperty(
      this.components,
      { type: "simple", parameter: "Qto_WallBaseQuantities" },
      { type: "simple", parameter: "NetVolume" }
    );
    spec.requirements.add(qtoProperty);

    let passCount = 0;
    let failCount = 0;
    const failingCategories: string[] = [];

    // Test across all loaded fragment models
    for (const [, model] of this.components.get(OBC.FragmentsManager).list) {
      try {
        const modelId = model.modelId || "model";
        const result = await spec.test([new RegExp(modelId)]);
        const { fail, pass } = this.ids.getModelIdMap(result);

        for (const mId in pass) {
          passCount += pass[mId].size;
        }
        for (const mId in fail) {
          failCount += fail[mId].size;
        }
        if (failCount > 0) {
          failingCategories.push(`IFCWALL (${failCount} missing Qto_WallBaseQuantities)`);
        }
      } catch (err) {
        console.warn("IDS spec test warning:", err);
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
}
