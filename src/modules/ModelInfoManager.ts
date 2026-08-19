import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export interface FormattedPropertySets {
  [psetName: string]: Record<string, any>;
}

export interface SpatialNode {
  id?: number | string;
  name?: string;
  type?: string;
  children?: SpatialNode[];
  [key: string]: any;
}

export class ModelInfoManager {
  private static instance: ModelInfoManager | null = null;
  private engine: BimEngine;
  public activeLocalId: number | null = null;
  public activeModelId: string | null = null;
  public extractedMeshes: THREE.Mesh[] = [];

  private constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): ModelInfoManager {
    if (!ModelInfoManager.instance) {
      ModelInfoManager.instance = new ModelInfoManager();
    }
    return ModelInfoManager.instance;
  }

  private getModel(modelId?: string): any {
    if (modelId) {
      return this.engine.fragments.list.get(modelId);
    }
    // Return first loaded model if none specified
    for (const [, model] of this.engine.fragments.list) {
      return model;
    }
    return null;
  }

  /**
   * Retrieves raw or filtered attributes of the selected element
   * using Fragment model's getItemsData() API
   */
  public async getAttributes(localId?: number, attributes?: string[], modelId?: string): Promise<any> {
    const targetId = localId ?? this.activeLocalId;
    if (targetId === null || targetId === undefined) return null;

    const model = this.getModel(modelId);
    if (!model) return null;

    try {
      if (typeof model.getItemsData === "function") {
        const [data] = await model.getItemsData([targetId], {
          attributesDefault: !attributes || attributes.length === 0,
          attributes,
        });
        return data;
      }
    } catch (e) {
      console.warn("getItemsData fallback to properties:", e);
    }

    // Fallback to model.properties map
    const props = model.properties || (model as any).getLocalProperties?.() || {};
    return props[targetId] || null;
  }

  /**
   * Retrieves the element Name attribute
   */
  public async getName(localId?: number, modelId?: string): Promise<string | null> {
    const data = await this.getAttributes(localId, ["Name"], modelId);
    if (!data) return null;

    const name = data.Name;
    if (name && typeof name === "object" && "value" in name) {
      return String(name.value);
    }
    if (typeof name === "string") return name;

    return null;
  }

  /**
   * Retrieves related Property Sets (Psets) by traversing IsDefinedBy relations
   */
  public async getItemPropertySets(localId?: number, modelId?: string): Promise<any[]> {
    const targetId = localId ?? this.activeLocalId;
    if (targetId === null || targetId === undefined) return [];

    const model = this.getModel(modelId);
    if (!model) return [];

    try {
      if (typeof model.getItemsData === "function") {
        const [data] = await model.getItemsData([targetId], {
          attributesDefault: false,
          attributes: ["Name", "NominalValue"],
          relations: {
            IsDefinedBy: { attributes: true, relations: true },
            DefinesOccurrence: { attributes: false, relations: false },
          },
        });
        if (data && data.IsDefinedBy) {
          return Array.isArray(data.IsDefinedBy) ? data.IsDefinedBy : [data.IsDefinedBy];
        }
      }
    } catch (e) {
      console.warn("getItemPropertySets traversal error:", e);
    }

    return [];
  }

  /**
   * Formats raw Fragments ItemData property sets into a clean developer-friendly object
   */
  public formatItemPsets(rawPsets: any[]): FormattedPropertySets {
    const result: FormattedPropertySets = {};
    if (!Array.isArray(rawPsets)) return result;

    for (const pset of rawPsets) {
      if (!pset) continue;
      const psetNameObj = pset.Name;
      const hasProperties = pset.HasProperties;

      const psetName = psetNameObj && typeof psetNameObj === "object" && "value" in psetNameObj
        ? psetNameObj.value
        : (typeof psetNameObj === "string" ? psetNameObj : "PropertySet");

      const props: Record<string, any> = {};

      if (Array.isArray(hasProperties)) {
        for (const prop of hasProperties) {
          if (!prop) continue;
          const propNameObj = prop.Name;
          const nominalValObj = prop.NominalValue;

          const name = propNameObj && typeof propNameObj === "object" && "value" in propNameObj
            ? propNameObj.value
            : (typeof propNameObj === "string" ? propNameObj : null);

          let nominalValue = nominalValObj && typeof nominalValObj === "object" && "value" in nominalValObj
            ? nominalValObj.value
            : nominalValObj;

          if (name && nominalValue !== undefined) {
            props[name] = nominalValue;
          }
        }
      } else if (pset && typeof pset === "object") {
        // Flat properties map fallback
        for (const key in pset) {
          if (key === "Name" || key === "type" || key === "expressId") continue;
          const val = pset[key];
          props[key] = (val && typeof val === "object" && "value" in val) ? val.value : val;
        }
      }

      if (Object.keys(props).length > 0 || psetName) {
        result[psetName] = props;
      }
    }

    return result;
  }

  /**
   * Retrieves all item names from a given IFC category
   */
  public async getNamesFromCategory(category: string, unique: boolean = false, modelId?: string): Promise<string[]> {
    const model = this.getModel(modelId);
    if (!model) return [];

    try {
      if (typeof model.getItemsOfCategories === "function") {
        const categoryIds = await model.getItemsOfCategories([new RegExp(`^${category}$`, "i")]);
        const matchedKey = Object.keys(categoryIds).find(k => k.toLowerCase() === category.toLowerCase()) || category;
        const localIds = categoryIds[matchedKey] || Object.values(categoryIds).flat();

        if (Array.isArray(localIds) && localIds.length > 0 && typeof model.getItemsData === "function") {
          const data = await model.getItemsData(localIds, {
            attributesDefault: false,
            attributes: ["Name"],
          });

          const names = data
            .map((d: any) => {
              if (!d) return null;
              const { Name } = d;
              if (Name && typeof Name === "object" && "value" in Name) return Name.value;
              if (typeof Name === "string") return Name;
              return null;
            })
            .filter((n: any) => Boolean(n)) as string[];

          return unique ? [...new Set(names)] : names;
        }
      }
    } catch (e) {
      console.warn("getNamesFromCategory fallback:", e);
    }

    // Fallback: iterate model properties
    const props = model.properties || (model as any).getLocalProperties?.() || {};
    const names: string[] = [];
    for (const id in props) {
      const item = props[id];
      if (item && item.type && String(item.type).toLowerCase().includes(category.toLowerCase())) {
        const name = item.Name?.value || item.Name;
        if (name) names.push(String(name));
      }
    }

    return unique ? [...new Set(names)] : names;
  }

  /**
   * Retrieves all available categories in the model
   */
  public async getCategories(modelId?: string): Promise<string[]> {
    const model = this.getModel(modelId);
    if (!model) return [];

    try {
      if (typeof model.getCategories === "function") {
        return await model.getCategories();
      }
    } catch (e) {
      console.warn("getCategories fallback:", e);
    }

    // Fallback through Classifier or properties
    const categories = new Set<string>();
    const props = model.properties || (model as any).getLocalProperties?.() || {};
    for (const id in props) {
      if (props[id]?.type) {
        categories.add(String(props[id].type));
      }
    }

    return Array.from(categories);
  }

  /**
   * Retrieves the full spatial structure hierarchy of the model
   */
  public async getSpatialStructure(modelId?: string): Promise<SpatialNode | null> {
    const model = this.getModel(modelId);
    if (!model) return null;

    try {
      if (typeof model.getSpatialStructure === "function") {
        return await model.getSpatialStructure();
      }
    } catch (e) {
      console.warn("getSpatialStructure error:", e);
    }

    return null;
  }

  /**
   * Retrieves children of the first level (e.g. 01 - Entry Level)
   */
  public async getFirstLevelChildren(modelId?: string): Promise<number[] | null> {
    const model = this.getModel(modelId);
    if (!model) return null;

    try {
      if (typeof model.getItemsOfCategories === "function" && typeof model.getItemsChildren === "function") {
        const categoryIds = await model.getItemsOfCategories([/BUILDINGSTOREY/i]);
        const key = Object.keys(categoryIds)[0];
        const localIds = categoryIds[key] || [];

        if (localIds.length > 0 && typeof model.getItemsData === "function") {
          const attributes = await model.getItemsData(localIds, {
            attributesDefault: false,
            attributes: ["Name"],
          });

          let firstLevelLocalId: number | null = null;
          for (const [index, data] of attributes.entries()) {
            if (!data) continue;
            const nameVal = data.Name?.value || data.Name;
            if (nameVal && (String(nameVal).includes("Entry") || String(nameVal).includes("Level 0") || String(nameVal).includes("01") || String(nameVal).includes("Floor 1"))) {
              firstLevelLocalId = localIds[index];
              break;
            }
          }

          if (firstLevelLocalId === null) {
            firstLevelLocalId = localIds[0];
          }

          if (firstLevelLocalId !== null) {
            return await model.getItemsChildren([firstLevelLocalId]);
          }
        }
      }
    } catch (e) {
      console.warn("getFirstLevelChildren error:", e);
    }

    return null;
  }

  /**
   * Retrieves explicit geometric mesh buffers for a local item
   */
  public async getItemGeometry(localId?: number, modelId?: string): Promise<any> {
    const targetId = localId ?? this.activeLocalId;
    if (targetId === null || targetId === undefined) return null;

    const model = this.getModel(modelId);
    if (!model) return null;

    try {
      if (typeof model.getItemsGeometry === "function") {
        const [geomCollection] = await model.getItemsGeometry([targetId]);
        return geomCollection;
      }
    } catch (e) {
      console.warn("getItemGeometry error:", e);
    }

    return null;
  }

  /**
   * Retrieves geometries of all elements in a category
   */
  public async getGeometriesFromCategory(category: string, modelId?: string): Promise<{ localIds: number[]; geometries: any[] }> {
    const model = this.getModel(modelId);
    if (!model) return { localIds: [], geometries: [] };

    try {
      if (typeof model.getItemsOfCategories === "function" && typeof model.getItemsGeometry === "function") {
        const items = await model.getItemsOfCategories([new RegExp(`^${category}$`, "i")]);
        const localIds = Object.values(items).flat() as number[];
        const geometries = await model.getItemsGeometry(localIds);
        return { localIds, geometries };
      }
    } catch (e) {
      console.warn("getGeometriesFromCategory error:", e);
    }

    return { localIds: [], geometries: [] };
  }

  /**
   * Extracts and renders ThreeJS Mesh objects directly from Fragment MeshData
   */
  public createMeshFromData(data: any, materialColor: string = "#a855f7"): THREE.Mesh | null {
    if (!data) return null;
    const { positions, indices, normals, transform } = data;
    if (!(positions && indices && normals)) return null;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
    geometry.setIndex(Array.from(indices));

    const material = new THREE.MeshLambertMaterial({
      color: new THREE.Color(materialColor),
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    if (transform) {
      mesh.applyMatrix4(transform);
    }

    this.extractedMeshes.push(mesh);
    const scene = this.engine.world?.scene?.three || (this.engine.world?.scene as any);
    if (scene) {
      scene.add(mesh);
    }

    return mesh;
  }

  /**
   * Disposes all extracted geometric meshes and restores model visibility
   */
  public async disposeExtractedMeshes(modelId?: string): Promise<void> {
    for (const mesh of this.extractedMeshes) {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        mat.dispose();
      }
    }
    this.extractedMeshes = [];

    const model = this.getModel(modelId);
    if (model && typeof model.setVisible === "function") {
      await model.setVisible(undefined, true);
    }
    if (this.engine.fragments && typeof this.engine.fragments.core?.update === "function") {
      this.engine.fragments.core.update(true);
    }
  }
}
