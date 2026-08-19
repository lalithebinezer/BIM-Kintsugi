import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "./BimEngine";

export class ModelManager {
  private engine: BimEngine;
  public ifcLoader: OBC.IfcLoader;

  constructor() {
    this.engine = BimEngine.getInstance();
    this.ifcLoader = this.engine.components.get(OBC.IfcLoader);
    this.setupIfcLoader();
  }

  private async setupIfcLoader() {
    await this.ifcLoader.setup({
      autoSetWasm: false,
      wasm: {
        path: "/",
        absolute: true,
      },
    });

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
        material.polygonOffsetFactor = Math.random();
      }
    });
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
}
