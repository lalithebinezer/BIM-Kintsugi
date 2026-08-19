import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export type DisciplineType = "ARQ" | "STR" | "MEP" | "GENERIC";

export interface FederatedModelEntry {
  modelId: string;
  name: string;
  discipline: DisciplineType;
  visible: boolean;
  opacity: number;
  model: any;
}

export class FederationModule {
  private engine: BimEngine;
  public models: Map<string, FederatedModelEntry> = new Map();

  constructor() {
    this.engine = BimEngine.getInstance();
  }

  public registerModel(model: any, name: string, discipline?: DisciplineType): FederatedModelEntry {
    const modelId = model.modelId || name;
    
    // Auto-deduce discipline if not provided
    let autoDiscipline: DisciplineType = discipline || "GENERIC";
    if (!discipline) {
      const lower = name.toLowerCase();
      if (lower.includes("arq") || lower.includes("arch")) autoDiscipline = "ARQ";
      else if (lower.includes("str") || lower.includes("struct")) autoDiscipline = "STR";
      else if (lower.includes("mep") || lower.includes("hvac") || lower.includes("plumb") || lower.includes("elec")) autoDiscipline = "MEP";
    }

    const entry: FederatedModelEntry = {
      modelId,
      name,
      discipline: autoDiscipline,
      visible: true,
      opacity: 1.0,
      model,
    };

    this.models.set(modelId, entry);
    return entry;
  }

  public setModelVisibility(modelId: string, visible: boolean) {
    const entry = this.models.get(modelId);
    if (!entry || !entry.model) return;

    entry.visible = visible;
    const modelObj = (entry.model.object || entry.model) as THREE.Object3D;
    if (modelObj) modelObj.visible = visible;
    this.engine.fragments.core.update(true);
  }

  public setModelOpacity(modelId: string, opacity: number) {
    const entry = this.models.get(modelId);
    if (!entry || !entry.model) return;

    entry.opacity = opacity;
    const modelObj = (entry.model.object || entry.model) as THREE.Object3D;
    if (modelObj && typeof modelObj.traverse === "function") {
      modelObj.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          for (const mat of materials) {
            mat.transparent = opacity < 1.0;
            mat.opacity = opacity;
            mat.needsUpdate = true;
          }
        }
      });
    }
    this.engine.fragments.core.update(true);
  }

  public isolateDiscipline(discipline: DisciplineType) {
    for (const [modelId, entry] of this.models) {
      const isTarget = entry.discipline === discipline;
      this.setModelVisibility(modelId, isTarget);
    }
  }

  public resetAllVisibility() {
    for (const [modelId] of this.models) {
      this.setModelVisibility(modelId, true);
      this.setModelOpacity(modelId, 1.0);
    }
  }

  public getCombinedBoundingBox(): THREE.Box3 {
    const box = new THREE.Box3();
    for (const [, entry] of this.models) {
      if (entry.visible && entry.model) {
        const modelObj = (entry.model.object || entry.model) as THREE.Object3D;
        if (modelObj) {
          box.expandByObject(modelObj);
        }
      }
    }
    return box;
  }

  public async fitCameraToFederation() {
    const box = this.getCombinedBoundingBox();
    if (!box.isEmpty() && this.engine.world.camera && (this.engine.world.camera as any).controls) {
      await (this.engine.world.camera as any).controls.fitToBox(box, true);
    }
  }
}
