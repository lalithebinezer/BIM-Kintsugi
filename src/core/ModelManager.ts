import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";
import { BimEngine } from "./BimEngine";
import { ResourceLifecycleManager } from "./ResourceLifecycleManager";
import { BvhAccelerationService } from "./BvhAccelerationService";
import { LodAndCullingManager } from "./LodAndCullingManager";
import { PrecisionOriginController } from "./PrecisionOriginController";
import { MetadataSyncService } from "./MetadataSyncService";
import { StreamingLoader } from "./StreamingLoader";

export class ModelManager {
  private static instance: ModelManager;
  private engine: BimEngine;
  private loaderSetup: Promise<void> | undefined;

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
    this.ifcLoader.onIfcImporterInitialized?.add((importer: FRAGS.IfcImporter) => {
      importer.parseOnce = true;
    });
    this.setupFragmentListeners();
  }

  public async ensureIfcLoaderReady(): Promise<void> {
    if (!this.loaderSetup) {
      this.loaderSetup = this.ifcLoader.setup({
        autoSetWasm: false,
        wasm: { path: import.meta.env.BASE_URL || "./", absolute: false },
      }).catch((error) => {
        this.loaderSetup = undefined;
        throw error;
      });
    }
    await this.loaderSetup;
  }

  private setupFragmentListeners() {
      if (this.engine.fragments?.initialized) {
        this.engine.fragments.list.onItemSet.add(({ value: model }) => {
          model.useCamera(this.engine.world.camera.three as any);
          const modelObj = (model.object || model) as THREE.Object3D;
          if (modelObj && !this.engine.world.scene.three.children.includes(modelObj)) {
            this.engine.world.scene.three.add(modelObj);
          }
          
          // Enable cast & receive shadows & accelerate raycasting via BVH on loaded meshes
          if (modelObj && typeof modelObj.traverse === "function") {
            modelObj.traverse((child: any) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });
            BvhAccelerationService.getInstance().buildBoundsForObjectTree(
              modelObj,
              `bvh:${(model as any).modelId || "model"}`
            );
          }

          if (typeof model.setLodMode === "function") {
            Promise.resolve(model.setLodMode(FRAGS.LodMode.DEFAULT)).catch(() => {});
          }

          PrecisionOriginController.getInstance().registerAnchoredObject(
            String((model as any).modelId || "model"),
            modelObj
          );
          LodAndCullingManager.getInstance().registerCullable(
            String((model as any).modelId || "model"),
            modelObj
          );

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
  }

  public async loadIfc(fileBuffer: Uint8Array, name: string): Promise<any> {
    await this.ensureIfcLoaderReady();
    const model = await this.ifcLoader.load(fileBuffer, true, name, {
      processData: { virtualModelConfig: StreamingLoader.getInstance().getMultithreadingConfig() } as any,
      instanceCallback: (importer) => {
        importer.parseOnce = true;
        // Keep fragment payload fast & lean; full STEP Psets stream lazily via MetadataSyncService
        importer.addAllRelations();
      },
    });
    if (model && typeof model.setLodMode === "function") {
      try {
        await model.setLodMode(FRAGS.LodMode.DEFAULT);
      } catch {}
    }
    return model;
  }

  public async loadFragment(buffer: ArrayBuffer | Uint8Array, modelId: string): Promise<any> {
    return await StreamingLoader.getInstance().loadFragmentStream(buffer, modelId);
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
  public async disposeModel(model: any) {
    if (!model) return;
    const modelId = String(model.modelId || model.uuid || model.id || "model");
    const lifecycle = ResourceLifecycleManager.getInstance();

    PrecisionOriginController.getInstance().unregisterAnchoredObject(modelId);
    LodAndCullingManager.getInstance().unregisterCullable(modelId);
    lifecycle.releaseByTag(`bvh:${modelId}`);
    lifecycle.releaseByTag(`model:${modelId}`);
    MetadataSyncService.getInstance().purgeModelMetadata(modelId).catch(() => {});

    if (model.modelId && this.engine.fragments.list.get(model.modelId) === model) {
      await this.engine.fragments.core.disposeModel(model.modelId);
      return;
    }
    const modelObj = (model.object || model) as THREE.Object3D;
    lifecycle.disposeObjectTree(modelObj, { disposeMaterials: true, removeFromParent: true });
    if (typeof model.dispose === "function") {
      await model.dispose();
    }
  }

  /**
   * Disposes all loaded models and clears GPU memory.
   */
  public async disposeAllModels() {
    const models = this.getModels();
    for (const m of models) {
      await this.disposeModel(m);
    }
    try {
      this.engine.fragments.core.dispose();
    } catch {}
  }

}
