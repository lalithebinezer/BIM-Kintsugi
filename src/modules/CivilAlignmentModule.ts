import * as THREE from "three";
import * as OBF from "@thatopen/components-front";
import { BimEngine } from "../core/BimEngine";

export interface CivilAlignmentReport {
  modelCount: number;
  alignmentCount: number;
  curveCount: number;
  crossSectionActive: boolean;
}

/**
 * IFC 4.3 Infrastructure & Civil Alignment Navigator (Phase 5C).
 * Wraps `@thatopen/components-front` `CivilNavigators` & `CivilCrossSectionNavigator`
 * to inspect road/rail/bridge alignments and jump cross-sections along stations.
 */
export class CivilAlignmentModule {
  private static instance: CivilAlignmentModule | null = null;
  private engine: BimEngine;
  private navigators: OBF.CivilNavigators;
  private crossSection: OBF.CivilCrossSectionNavigator;
  private alignmentGroups: THREE.Group[] = [];
  private crossSectionEnabled: boolean = false;

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.navigators = this.engine.components.get(OBF.CivilNavigators);
    this.crossSection = this.engine.components.get(OBF.CivilCrossSectionNavigator);
    if (this.engine.world?.renderer) {
      this.crossSection.world = this.engine.world;
    }
  }

  public static getInstance(): CivilAlignmentModule {
    if (!CivilAlignmentModule.instance) {
      CivilAlignmentModule.instance = new CivilAlignmentModule();
    }
    return CivilAlignmentModule.instance;
  }

  /**
   * Scans all loaded Fragments models for IFC4x3 `IfcAlignment` geometry groups
   * and attaches them to the 3D world + `CivilNavigators`.
   */
  public async scanAndAttachAlignments(): Promise<CivilAlignmentReport> {
    const world = this.engine.world;
    this.clearAlignments();

    let modelCount = 0;
    let curveCount = 0;

    if (!this.engine.fragments?.initialized) {
      return {
        modelCount: 0,
        alignmentCount: 0,
        curveCount: 0,
        crossSectionActive: this.crossSectionEnabled,
      };
    }

    for (const [modelId, model] of this.engine.fragments.list) {
      modelCount++;
      if (typeof (model as any).getAlignments !== "function") continue;
      try {
        const group = (await (model as any).getAlignments()) as THREE.Group;
        if (group && group.children.length > 0) {
          this.alignmentGroups.push(group);
          world?.scene?.three?.add(group);
          group.traverse((obj) => {
            if ((obj as THREE.Line).isLine) curveCount++;
          });
          const nav = this.navigators.create(`civil-${modelId}`);
          if (world) nav.world = world;
          nav.alignments = [group];
        }
      } catch {
        // Model contains no IFC 4.3 alignments
      }
    }

    this.navigators.updateAlignments();
    return {
      modelCount,
      alignmentCount: this.alignmentGroups.length,
      curveCount,
      crossSectionActive: this.crossSectionEnabled,
    };
  }

  public toggleCrossSection(enable?: boolean): boolean {
    const target = enable !== undefined ? enable : !this.crossSectionEnabled;
    if (this.engine.world?.renderer) {
      this.crossSection.world = this.engine.world;
      this.crossSection.sectionVisible = target;
    }
    this.crossSectionEnabled = target;
    return target;
  }

  public clearAlignments() {
    for (const g of this.alignmentGroups) {
      g.removeFromParent();
    }
    this.alignmentGroups = [];
    for (const id of [...this.navigators.list.keys()]) {
      this.navigators.delete(id);
    }
  }

  public dispose() {
    this.clearAlignments();
    this.toggleCrossSection(false);
  }
}
