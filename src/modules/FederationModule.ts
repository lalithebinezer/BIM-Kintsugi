import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export type DisciplineType = "ARQ" | "STR" | "MEP" | "GENERIC";

export interface ModelTransformOffset {
  x: number;
  y: number;
  z: number;
  rotationY: number;
}

export interface FederatedModelEntry {
  modelId: string;
  name: string;
  discipline: DisciplineType;
  visible: boolean;
  opacity: number;
  transform: ModelTransformOffset;
  basePosition: [number, number, number];
  model: any;
}

export class FederationModule {
  private static instance: FederationModule | null = null;
  private engine: BimEngine;
  public models: Map<string, FederatedModelEntry> = new Map();

  constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): FederationModule {
    if (!FederationModule.instance) {
      FederationModule.instance = new FederationModule();
    }
    return FederationModule.instance;
  }

  /**
   * Automatically registers any loaded fragment models not yet tracked by FederationModule.
   */
  public syncLoadedModels(): FederatedModelEntry[] {
    try {
      if (this.engine.fragments?.list) {
        for (const [modelId, model] of this.engine.fragments.list) {
          if (!this.models.has(modelId)) {
            const name = (model as any).name || modelId;
            this.registerModel(model, name);
          }
        }
      }
    } catch (e) {}
    return Array.from(this.models.values());
  }

  public registerModel(model: any, name: string, discipline?: DisciplineType): FederatedModelEntry {
    const modelId = model.modelId || name;

    // Auto-deduce discipline if not provided
    let autoDiscipline: DisciplineType = discipline || "GENERIC";
    if (!discipline) {
      const lower = name.toLowerCase();
      if (lower.includes("arq") || lower.includes("arch") || lower.includes("school")) autoDiscipline = "ARQ";
      else if (lower.includes("str") || lower.includes("struct")) autoDiscipline = "STR";
      else if (lower.includes("mep") || lower.includes("hvac") || lower.includes("plumb") || lower.includes("elec")) autoDiscipline = "MEP";
    }

    const modelObj = (model.object || model) as THREE.Object3D;
    const basePos: [number, number, number] = modelObj?.position
      ? [modelObj.position.x, modelObj.position.y, modelObj.position.z]
      : [0, 0, 0];

    const entry: FederatedModelEntry = {
      modelId,
      name,
      discipline: autoDiscipline,
      visible: true,
      opacity: 1.0,
      transform: { x: 0, y: 0, z: 0, rotationY: 0 },
      basePosition: basePos,
      model,
    };

    this.models.set(modelId, entry);
    return entry;
  }

  public setModelTransform(modelId: string, offset: Partial<ModelTransformOffset>) {
    const entry = this.models.get(modelId);
    if (!entry || !entry.model) return;

    entry.transform = {
      ...entry.transform,
      ...offset,
    };

    const modelObj = (entry.model.object || entry.model) as THREE.Object3D;
    if (modelObj && modelObj.position) {
      modelObj.position.set(
        entry.basePosition[0] + entry.transform.x,
        entry.basePosition[1] + entry.transform.y,
        entry.basePosition[2] + entry.transform.z
      );
      if (modelObj.rotation) {
        modelObj.rotation.y = THREE.MathUtils.degToRad(entry.transform.rotationY);
      }
      modelObj.updateMatrixWorld?.(true);
    }
    try {
      this.engine.fragments.core.update(true);
    } catch (e) {}
  }

  public setModelVisibility(modelId: string, visible: boolean) {
    const entry = this.models.get(modelId);
    if (!entry || !entry.model) return;

    entry.visible = visible;
    const modelObj = (entry.model.object || entry.model) as THREE.Object3D;
    if (modelObj) modelObj.visible = visible;
    try {
      this.engine.fragments.core.update(true);
    } catch (e) {}
  }

  public setModelOpacity(modelId: string, opacity: number) {
    const entry = this.models.get(modelId);
    if (!entry || !entry.model) return;

    entry.opacity = Math.max(0.05, Math.min(1.0, opacity));
    const modelObj = (entry.model.object || entry.model) as THREE.Object3D;
    if (modelObj && typeof modelObj.traverse === "function") {
      modelObj.traverse((child: any) => {
        if (child.isMesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          for (const mat of materials) {
            mat.transparent = entry.opacity < 1.0;
            mat.opacity = entry.opacity;
            mat.needsUpdate = true;
          }
        }
      });
    }
    try {
      this.engine.fragments.core.update(true);
    } catch (e) {}
  }

  public isolateDiscipline(discipline: DisciplineType) {
    this.syncLoadedModels();
    for (const [modelId, entry] of this.models) {
      const isTarget = entry.discipline === discipline;
      this.setModelVisibility(modelId, isTarget);
    }
  }

  public resetAllVisibility() {
    this.syncLoadedModels();
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
