import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "./BimEngine";

export class ModelManager {
  private static instance: ModelManager;
  private engine: BimEngine;

  public static getInstance(): ModelManager {
    if (!ModelManager.instance) {
      ModelManager.instance = new ModelManager();
    }
    return ModelManager.instance;
  }
  public ifcLoader: OBC.IfcLoader;

  constructor() {
    ModelManager.instance = this;
    this.engine = BimEngine.getInstance();
    this.ifcLoader = this.engine.components.get(OBC.IfcLoader);
    this.setupIfcLoader();
  }

  private async setupIfcLoader() {
    try {
      await this.ifcLoader.setup({
        autoSetWasm: false,
        wasm: {
          path: (typeof import.meta !== "undefined" && import.meta.env?.BASE_URL) || "./",
          absolute: false,
        },
      });

      if (this.engine.fragments) {
        this.engine.fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(this.engine.world.camera.three as any);
          const modelObj = (model.object || model) as THREE.Object3D;
          if (modelObj && !this.engine.world.scene.three.children.includes(modelObj)) {
            this.engine.world.scene.three.add(modelObj);
          }
          
          // Enable cast & receive shadows on loaded fragment meshes
          if (modelObj && typeof modelObj.traverse === "function") {
            modelObj.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
          }

          this.engine.fragments.core.update(true);
        });

        // Fix z-fighting for LOD materials
        this.engine.fragments.core.models.materials.list.onItemSet.add(({ value: material }) => {
          if (!("isLodMaterial" in material && material.isLodMaterial)) {
            material.polygonOffset = true;
            material.polygonOffsetUnits = 1;
            material.polygonOffsetFactor = 1;
          }
        });
      }
    } catch (e) {
      // In headless test environments, FragmentsManager may be uninitialized
    }
  }

  public async loadIfc(fileBuffer: Uint8Array, name: string): Promise<any> {
    const model = await this.ifcLoader.load(fileBuffer, false, name);
    return model;
  }

  public async loadFragment(buffer: ArrayBuffer, modelId: string): Promise<any> {
    const model = await this.engine.fragments.core.load(buffer, { modelId });
    return model;
  }

  public getModels() {
    return Array.from(this.engine.fragments.list.values());
  }

  public async downloadModelFragments(modelId?: string) {
    const models = this.getModels();
    const targetModel = modelId ? this.engine.fragments.list.get(modelId) : models[0];
    if (!targetModel) return;

    const fragsBuffer = await targetModel.getBuffer(false);
    const file = new File([fragsBuffer], `${targetModel.modelId || 'model'}.frag`);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Explicitly disposes model geometry, buffer attributes, textures, and materials from GPU VRAM.
   */
  public disposeModel(model: any) {
    if (!model) return;
    const modelObj = (model.object || model) as THREE.Object3D;
    if (modelObj && typeof modelObj.traverse === "function") {
      modelObj.traverse((child: any) => {
        if (child.geometry) {
          child.geometry.dispose();
        }
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat: any) => {
              if (mat.map) mat.map.dispose();
              mat.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      });
      if (modelObj.parent) {
        modelObj.parent.remove(modelObj);
      }
    }
    if (typeof model.dispose === "function") {
      try { model.dispose(); } catch {}
    }
  }

  /**
   * Disposes all loaded models and clears GPU memory.
   */
  public disposeAllModels() {
    const models = this.getModels();
    for (const m of models) {
      this.disposeModel(m);
    }
    try {
      this.engine.fragments.core.dispose();
    } catch {}
  }

}