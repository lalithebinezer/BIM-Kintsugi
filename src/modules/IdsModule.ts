import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";
import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";

export class IdsModule {
  private engine: BimEngine;
  public ids: OBC.IDSSpecifications;
  private originalColors: Map<FRAGS.BIMMaterial, { color: number; transparent: boolean; opacity: number }> = new Map();
  private stylesInitialized: boolean = false;

  constructor() {
    this.engine = BimEngine.getInstance();
    this.ids = this.engine.components.get(OBC.IDSSpecifications);
    this.ensureHighlighterStyles();
  }

  private ensureHighlighterStyles() {
    if (this.stylesInitialized) return;
    try {
      const highlighter = this.engine.highlighter;
      if (highlighter && highlighter.styles) {
        highlighter.styles.set("IDS_Pass", {
          color: new THREE.Color("#10B981"),
          renderedFaces: FRAGS.RenderedFaces.ONE,
          opacity: 0.95,
          transparent: false,
        });
        highlighter.styles.set("IDS_Fail", {
          color: new THREE.Color("#EF4444"),
          renderedFaces: FRAGS.RenderedFaces.ONE,
          opacity: 0.95,
          transparent: false,
        });
        this.stylesInitialized = true;
      }
    } catch (e) {}
  }

  public createSampleDoorSpec(): OBC.IDSSpecification {
    const spec = this.ids.create("Door Fire Rating Verification", ["IFC4"]);
    spec.description = "Verify that all doors have FireRating specified in Pset_DoorCommon";

    const entity = new OBC.IDSEntity(this.engine.components, {
      type: "simple",
      parameter: "IFCDOOR",
    });

    const property = new OBC.IDSProperty(
      this.engine.components,
      { type: "simple", parameter: "Pset_DoorCommon" },
      { type: "simple", parameter: "FireRating" }
    );

    spec.applicability.add(entity);
    spec.requirements.add(property);

    return spec;
  }

  public toggleGhostMode() {
    if (this.originalColors.size > 0) {
      this.restoreMaterials();
    } else {
      this.makeModelGhosted();
    }
  }

  private makeModelGhosted() {
    const materials = [...this.engine.fragments.core.models.materials.list.values()];
    for (const material of materials) {
      if (material.userData.customId) continue;
      const color: number = "color" in material ? material.color.getHex() : material.lodColor.getHex();
      this.originalColors.set(material, {
        color,
        transparent: material.transparent,
        opacity: material.opacity,
      });

      material.transparent = true;
      material.opacity = 0.08;
      material.needsUpdate = true;
      if ("color" in material) {
        material.color.setColorName("white");
      } else {
        material.lodColor.setColorName("white");
      }
    }
  }

  private restoreMaterials() {
    for (const [material, data] of this.originalColors) {
      material.transparent = data.transparent;
      material.opacity = data.opacity;
      if ("color" in material) {
        material.color.setHex(data.color);
      } else {
        material.lodColor.setHex(data.color);
      }
      material.needsUpdate = true;
    }
    this.originalColors.clear();
  }

  public async runAudit(spec: OBC.IDSSpecification) {
    this.ensureHighlighterStyles();
    const result = await spec.test([/.*/]);
    const { fail, pass } = this.ids.getModelIdMap(result);

    try {
      const highlighter = this.engine.highlighter;
      if (highlighter && typeof highlighter.highlightByID === "function") {
        await highlighter.clear("IDS_Pass");
        await highlighter.clear("IDS_Fail");
        await highlighter.highlightByID("IDS_Pass", pass, false, false);
        await highlighter.highlightByID("IDS_Fail", fail, false, false);
      } else {
        await this.engine.fragments.resetHighlight();
        await this.engine.fragments.highlight(
          { customId: "pass_green", color: new THREE.Color("#10B981"), renderedFaces: FRAGS.RenderedFaces.ONE, opacity: 1, transparent: false },
          pass
        );
        await this.engine.fragments.highlight(
          { customId: "fail_red", color: new THREE.Color("#EF4444"), renderedFaces: FRAGS.RenderedFaces.ONE, opacity: 1, transparent: false },
          fail
        );
      }
    } catch (e) {}

    await this.engine.fragments.core.update(true);

    if (this.originalColors.size === 0) {
      this.toggleGhostMode();
    }

    return { pass, fail };
  }
}
