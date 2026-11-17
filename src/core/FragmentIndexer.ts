import * as THREE from "three";

export interface IndexedElementRecord {
  modelId: string;
  expressId: number;
  category: string;
  name: string;
  globalId?: string;
  predefinedType?: string;
  objectType?: string;
  storey?: string;
  box: THREE.Box3 | null;
  volumeM3?: number;
  areaM2?: number;
  psets?: Record<string, Record<string, any>>;
}

export interface IndexedModelData {
  modelId: string;
  modelRef?: any;
  categories: string[];
  elements: IndexedElementRecord[];
  byExpressId: Map<number, IndexedElementRecord>;
  byCategory: Map<string, IndexedElementRecord[]>;
  hasBoxes: boolean;
  hasPsets: boolean;
  source: "fragments-v3" | "properties-fallback";
  indexedAt: number;
}

export interface FragmentIndexOptions {
  includeBoxes?: boolean;
  includePsets?: boolean;
  maxElements?: number;
  force?: boolean;
  storeysMap?: Record<string, string>;
}

const SKIP_INDEX_CATEGORIES = new Set([
  "IFCRELDEFINESBYPROPERTIES",
  "IFCRELDEFINESBYTYPE",
  "IFCRELCONTAINEDINSPATIALSTRUCTURE",
  "IFCRELAGGREGATES",
  "IFCRELASSOCIATESMATERIAL",
  "IFCRELVOIDSELEMENT",
  "IFCRELFILLSELEMENT",
  "IFCRELSPACEBOUNDARY",
  "IFCRELCONNECTSPATHELEMENTS",
  "IFCRELASSIGNSTOGROUP",
  "IFCRELASSOCIATESCLASSIFICATION",
  "IFCPROPERTYSINGLEVALUE",
  "IFCPROPERTYENUMERATEDVALUE",
  "IFCPROPERTYSET",
  "IFCELEMENTQUANTITY",
  "IFCQUANTITYLENGTH",
  "IFCQUANTITYAREA",
  "IFCQUANTITYVOLUME",
  "IFCQUANTITYCOUNT",
  "IFCQUANTITYWEIGHT",
  "IFCOWNERHISTORY",
  "IFCPERSON",
  "IFCORGANIZATION",
  "IFCPERSONANDORGANIZATION",
  "IFCAPPLICATION",
  "IFCPOSTALADDRESS",
  "IFCTELECOMADDRESS",
  "IFCSHAPEREPRESENTATION",
  "IFCPRODUCTDEFINITIONSHAPE",
  "IFCGEOMETRICREPRESENTATIONCONTEXT",
  "IFCGEOMETRICREPRESENTATIONSUBCONTEXT",
  "IFCLOCALPLACEMENT",
  "IFCAXIS2PLACEMENT2D",
  "IFCAXIS2PLACEMENT3D",
  "IFCCARTESIANPOINT",
  "IFCDIRECTION",
  "IFCSIUNIT",
  "IFCDERIVEDUNIT",
  "IFCUNITASSIGNMENT",
  "IFCMATERIAL",
  "IFCMATERIALLAYER",
  "IFCMATERIALLAYERSET",
  "IFCMATERIALLAYERSETUSAGE",
  "IFCSTYLEDITEM",
  "IFCPRESENTATIONSTYLEASSIGNMENT",
  "IFCSURFACESTYLE",
  "IFCSURFACESTYLERENDERING",
  "IFCCOLOURRGB",
]);

/**
 * Shared asynchronous FRAGS v3 spatial + semantic model indexer.
 * Replaces legacy synchronous `model.properties` iteration with cached worker calls
 * (`getCategories`, `getItemsOfCategories`, `getBoxes`, `getItemsData`) and safe Path B fallback.
 */
export class FragmentIndexer {
  private static instance: FragmentIndexer | null = null;
  private cache = new Map<string, IndexedModelData>();
  private pending = new Map<string, Promise<IndexedModelData>>();
  private attachedManagers = new WeakSet<object>();

  private constructor() {}

  public static getInstance(): FragmentIndexer {
    if (!FragmentIndexer.instance) {
      FragmentIndexer.instance = new FragmentIndexer();
    }
    return FragmentIndexer.instance;
  }

  public isValidBox(box: any): box is THREE.Box3 {
    if (!box || (typeof box.isEmpty === "function" && box.isEmpty())) return false;
    return (
      isFinite(box.min?.x) &&
      isFinite(box.min?.y) &&
      isFinite(box.min?.z) &&
      isFinite(box.max?.x) &&
      isFinite(box.max?.y) &&
      isFinite(box.max?.z)
    );
  }

  public isCategorySkipped(category: string): boolean {
    const up = String(category || "").toUpperCase();
    if (!up) return true;
    if (SKIP_INDEX_CATEGORIES.has(up)) return true;
    if (
      up.startsWith("IFCREL") ||
      up.startsWith("IFCPROPERTY") ||
      up.startsWith("IFCQUANTITY") ||
      up.startsWith("IFCDIMENSION") ||
      up.startsWith("IFCSI")
    ) {
      return true;
    }
    return false;
  }

  public resolveModelId(model: any, fallbackId = "default-model"): string {
    return String(
      model?.modelId || model?.uuid || model?.id || model?.object?.uuid || fallbackId
    );
  }

  public unwrapAttr(val: any): string {
    if (val === null || val === undefined) return "";
    if (typeof val === "object") {
      if ("value" in val) return String(val.value ?? "").trim();
      if ("NominalValue" in val) return this.unwrapAttr(val.NominalValue);
      return "";
    }
    return String(val).trim();
  }

  public getSafeModelsMap(fragments: any): Array<[string, any]> {
    const out: Array<[string, any]> = [];
    if (!fragments) return out;
    try {
      const initialized = fragments.initialized;
      if (initialized === false) return out;
      const list = fragments.list;
      if (!list) return out;
      if (typeof list.entries === "function") {
        for (const [mid, m] of list.entries()) {
          if (m) out.push([String(mid), m]);
        }
      } else if (Symbol.iterator in Object(list)) {
        for (const [mid, m] of list) {
          if (m) out.push([String(mid), m]);
        }
      }
    } catch {
      // FragmentsManager.list getter throws when uninitialized in unit tests
    }
    return out;
  }

  public attachFragmentsManager(fragments: any) {
    if (!fragments || typeof fragments !== "object") return;
    if (this.attachedManagers.has(fragments)) return;
    this.attachedManagers.add(fragments);
    try {
      const list = fragments.list;
      list?.onItemDeleted?.add?.((entry: any) => {
        const key = typeof entry === "string" ? entry : this.resolveModelId(entry?.value ?? entry, "");
        if (key) this.invalidateModel(key);
      });
    } catch {}
  }

  public invalidateModel(modelId: string) {
    this.cache.delete(modelId);
    this.pending.delete(modelId);
  }

  public clearAll() {
    this.cache.clear();
    this.pending.clear();
  }

  public getCachedModel(modelId: string): IndexedModelData | null {
    return this.cache.get(modelId) || null;
  }

  public getCachedElement(modelId: string, expressId: number): IndexedElementRecord | null {
    return this.cache.get(modelId)?.byExpressId.get(expressId) || null;
  }

  public getElementBox(modelId: string, expressId: number, model?: any): THREE.Box3 | null {
    const cached = this.getCachedElement(modelId, expressId);
    if (cached?.box && this.isValidBox(cached.box)) {
      return cached.box.clone();
    }
    const propBox = model?.properties?.[expressId]?.boundingBox;
    if (propBox instanceof THREE.Box3 && this.isValidBox(propBox)) {
      return propBox.clone();
    }
    return null;
  }

  /**
   * Returns cached FRAGS v3 index if available, otherwise synchronously extracts
   * fallback `model.properties` / `getLocalProperties()` so sync callers stay non-blocking.
   */
  public getSyncModelData(modelId: string, model: any): IndexedModelData | null {
    const cached = this.cache.get(modelId);
    if (cached && (!model || cached.modelRef === model)) return cached;
    if (!model) return null;
    const syncData = this.readSyncPropertiesFallback(modelId, model);
    if (syncData && syncData.elements.length > 0) {
      this.cache.set(modelId, syncData);
      return syncData;
    }
    return null;
  }

  /**
   * Converts an IndexedModelData summary into a legacy property-bag dictionary shape
   * so modules with attribute discovery pipelines consume FRAGS v3 seamlessly.
   */
  public toLegacyPropertyMap(data: IndexedModelData | null): Record<number, any> {
    const out: Record<number, any> = {};
    if (!data) return out;
    for (const el of data.elements) {
      out[el.expressId] = {
        expressId: el.expressId,
        type: el.category,
        Name: { value: el.name },
        GlobalId: el.globalId ? { value: el.globalId } : undefined,
        PredefinedType: el.predefinedType ? { value: el.predefinedType } : undefined,
        ObjectType: el.objectType ? { value: el.objectType } : undefined,
        Storey: el.storey,
        boundingBox: el.box || undefined,
        NetVolume: el.volumeM3 ? { value: el.volumeM3 } : undefined,
        NetArea: el.areaM2 ? { value: el.areaM2 } : undefined,
        psets: el.psets,
      };
    }
    return out;
  }

  public async indexLoadedModels(
    engine: { fragments?: any },
    options: FragmentIndexOptions = {}
  ): Promise<IndexedModelData[]> {
    const pairs = this.getSafeModelsMap(engine?.fragments);
    const results: IndexedModelData[] = [];
    for (const [modelId, model] of pairs) {
      const res = await this.indexModel(modelId, model, options);
      results.push(res);
    }
    return results;
  }

  public async indexModel(
    modelId: string,
    model: any,
    options: FragmentIndexOptions = {}
  ): Promise<IndexedModelData> {
    const wantBoxes = options.includeBoxes !== false;
    const wantPsets = Boolean(options.includePsets);
    const maxElements = Math.max(100, options.maxElements ?? 12000);

    const existing = this.cache.get(modelId);
    if (
      existing &&
      existing.modelRef === model &&
      !options.force &&
      (!wantBoxes || existing.hasBoxes) &&
      (!wantPsets || existing.hasPsets)
    ) {
      return existing;
    }

    const inFlight = this.pending.get(modelId);
    if (inFlight && !options.force) {
      const done = await inFlight;
      if ((!wantBoxes || done.hasBoxes) && (!wantPsets || done.hasPsets)) {
        return done;
      }
    }

    const work = this.performIndexModel(modelId, model, {
      includeBoxes: wantBoxes,
      includePsets: wantPsets,
      maxElements,
      storeysMap: options.storeysMap,
    });
    this.pending.set(modelId, work);

    try {
      const res = await work;
      this.cache.set(modelId, res);
      return res;
    } finally {
      if (this.pending.get(modelId) === work) {
        this.pending.delete(modelId);
      }
    }
  }

  private async performIndexModel(
    modelId: string,
    model: any,
    opts: {
      includeBoxes: boolean;
      includePsets: boolean;
      maxElements: number;
      storeysMap?: Record<string, string>;
    }
  ): Promise<IndexedModelData> {
    const fallbackProps = model?.properties || model?.getLocalProperties?.() || null;

    if (
      model &&
      typeof model.getCategories === "function" &&
      typeof model.getItemsOfCategories === "function"
    ) {
      try {
        const rawCats: string[] = (await model.getCategories()) || [];
        const activeCats = rawCats.filter((c) => !this.isCategorySkipped(c));

        if (activeCats.length > 0) {
          const regexes = activeCats.map(
            (c) => new RegExp(`^${String(c).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i")
          );
          const catItemsMap: Record<string, number[]> =
            (await model.getItemsOfCategories(regexes)) || {};

          const idSet = new Set<number>();
          const idList: number[] = [];
          const idCategory = new Map<number, string>();

          for (const [catName, ids] of Object.entries(catItemsMap)) {
            if (!Array.isArray(ids) || this.isCategorySkipped(catName)) continue;
            for (const localId of ids) {
              if (typeof localId !== "number" || idSet.has(localId)) continue;
              idSet.add(localId);
              idList.push(localId);
              idCategory.set(localId, catName);
              if (idList.length >= opts.maxElements) break;
            }
            if (idList.length >= opts.maxElements) break;
          }

          if (idList.length > 0) {
            let boxes: THREE.Box3[] = [];
            if (opts.includeBoxes && typeof model.getBoxes === "function") {
              try {
                boxes = (await model.getBoxes(idList)) || [];
              } catch {}
            }

            const attrMap = new Map<
              number,
              {
                name?: string;
                globalId?: string;
                predefinedType?: string;
                objectType?: string;
                psets?: Record<string, Record<string, any>>;
                volumeM3?: number;
                areaM2?: number;
              }
            >();

            if (typeof model.getItemsData === "function") {
              try {
                const chunkSize = opts.includePsets ? 250 : 400;
                const dataConfig = opts.includePsets
                  ? {
                      attributesDefault: true,
                      relations: {
                        IsDefinedBy: { attributes: true, relations: true },
                        DefinesOccurrence: { attributes: false, relations: false },
                      },
                    }
                  : {
                      attributesDefault: false,
                      attributes: ["Name", "GlobalId", "PredefinedType", "ObjectType"],
                    };

                for (let start = 0; start < idList.length; start += chunkSize) {
                  const chunkIds = idList.slice(start, start + chunkSize);
                  const dataArr = await model.getItemsData(chunkIds, dataConfig as any);
                  for (let k = 0; k < chunkIds.length; k++) {
                    const item = dataArr?.[k];
                    if (!item) continue;
                    const parsed = this.extractItemData(item, opts.includePsets);
                    attrMap.set(chunkIds[k], parsed);
                  }
                }
              } catch {}
            }

            const elements: IndexedElementRecord[] = [];
            const byExpressId = new Map<number, IndexedElementRecord>();
            const byCategory = new Map<string, IndexedElementRecord[]>();

            for (let i = 0; i < idList.length; i++) {
              const localId = idList[i];
              const category = idCategory.get(localId) || "IFCELEMENT";
              const rawBox = boxes[i];
              const box = this.isValidBox(rawBox) ? rawBox.clone() : null;
              const attrs = attrMap.get(localId);
              const legacy = fallbackProps?.[localId];

              let volumeM3 = attrs?.volumeM3 ?? this.readNumberAttr(legacy, ["NetVolume", "GrossVolume", "Volume"]);
              if ((!volumeM3 || volumeM3 <= 0) && box) {
                const sz = new THREE.Vector3();
                box.getSize(sz);
                volumeM3 = Math.max(0.05, sz.x * sz.y * sz.z * 0.45);
              }

              const storey =
                opts.storeysMap?.[`${modelId}-${localId}`] ||
                (legacy?.Storey ? String(legacy.Storey) : undefined);

              const record: IndexedElementRecord = {
                modelId,
                expressId: localId,
                category,
                name:
                  attrs?.name ||
                  this.unwrapAttr(legacy?.Name) ||
                  `${category} #${localId}`,
                globalId: attrs?.globalId || this.unwrapAttr(legacy?.GlobalId) || undefined,
                predefinedType:
                  attrs?.predefinedType || this.unwrapAttr(legacy?.PredefinedType) || undefined,
                objectType:
                  attrs?.objectType || this.unwrapAttr(legacy?.ObjectType) || undefined,
                storey,
                box,
                volumeM3,
                areaM2: attrs?.areaM2 ?? this.readNumberAttr(legacy, ["NetArea", "GrossArea", "Area"]),
                psets: attrs?.psets || legacy?.psets,
              };

              elements.push(record);
              byExpressId.set(localId, record);
              const list = byCategory.get(category) || [];
              list.push(record);
              byCategory.set(category, list);
            }

            return {
              modelId,
              modelRef: model,
              categories: Array.from(byCategory.keys()),
              elements,
              byExpressId,
              byCategory,
              hasBoxes: opts.includeBoxes && boxes.length > 0,
              hasPsets: opts.includePsets,
              source: "fragments-v3",
              indexedAt: Date.now(),
            };
          }
        }
      } catch {}
    }

    return (
      this.readSyncPropertiesFallback(modelId, model, opts.maxElements, opts.storeysMap) || {
        modelId,
        modelRef: model,
        categories: [],
        elements: [],
        byExpressId: new Map(),
        byCategory: new Map(),
        hasBoxes: opts.includeBoxes,
        hasPsets: opts.includePsets,
        source: "properties-fallback",
        indexedAt: Date.now(),
      }
    );
  }

  private extractItemData(
    item: any,
    extractRelations: boolean
  ): {
    name?: string;
    globalId?: string;
    predefinedType?: string;
    objectType?: string;
    psets?: Record<string, Record<string, any>>;
    volumeM3?: number;
    areaM2?: number;
  } {
    const name = this.unwrapAttr(item?.Name);
    const globalId = this.unwrapAttr(item?.GlobalId);
    const predefinedType = this.unwrapAttr(item?.PredefinedType);
    const objectType = this.unwrapAttr(item?.ObjectType);

    if (!extractRelations) {
      return { name, globalId, predefinedType, objectType };
    }

    const psets: Record<string, Record<string, any>> = {};
    let volumeM3: number | undefined;
    let areaM2: number | undefined;

    const relNodes = item?.IsDefinedBy || item?._relations?.IsDefinedBy;
    if (Array.isArray(relNodes)) {
      for (const psetItem of relNodes) {
        const psetName = this.unwrapAttr(psetItem?.Name) || "PropertySet";
        const props = psetItem?.HasProperties || psetItem?.Quantities;
        if (!Array.isArray(props)) continue;
        if (!psets[psetName]) psets[psetName] = {};

        for (const prop of props) {
          const propName = this.unwrapAttr(prop?.Name);
          if (!propName) continue;
          const valRaw =
            prop?.NominalValue ??
            prop?.VolumeValue ??
            prop?.AreaValue ??
            prop?.LengthValue ??
            prop?.CountValue ??
            prop?.WeightValue ??
            prop?.value;
          const strVal = this.unwrapAttr(valRaw);
          if (strVal !== "") {
            psets[psetName][propName] = strVal;
          }
          const numVal = Number(
            typeof valRaw === "object" && valRaw !== null && "value" in valRaw
              ? valRaw.value
              : valRaw
          );
          if (isFinite(numVal) && numVal > 0) {
            const lower = propName.toLowerCase();
            if (!volumeM3 && (lower === "netvolume" || lower === "grossvolume" || lower === "volume")) {
              volumeM3 = numVal;
            }
            if (!areaM2 && (lower === "netarea" || lower === "grossarea" || lower === "area")) {
              areaM2 = numVal;
            }
          }
        }
      }
    }

    return {
      name,
      globalId,
      predefinedType,
      objectType,
      psets: Object.keys(psets).length > 0 ? psets : undefined,
      volumeM3,
      areaM2,
    };
  }

  private readNumberAttr(obj: any, keys: string[]): number | undefined {
    if (!obj) return undefined;
    for (const k of keys) {
      const raw = obj[k]?.value ?? obj[k];
      const n = Number(raw);
      if (isFinite(n) && n > 0) return n;
    }
    return undefined;
  }

  private readSyncPropertiesFallback(
    modelId: string,
    model: any,
    maxElements = 12000,
    storeysMap?: Record<string, string>
  ): IndexedModelData | null {
    const props = model?.properties || model?.getLocalProperties?.() || null;
    if (!props || typeof props !== "object") return null;

    const elements: IndexedElementRecord[] = [];
    const byExpressId = new Map<number, IndexedElementRecord>();
    const byCategory = new Map<string, IndexedElementRecord[]>();

    for (const key in props) {
      const expressId = Number(key);
      if (!isFinite(expressId)) continue;
      const p = props[key];
      if (!p || typeof p !== "object") continue;

      const cat = String(p.type || p._category || p.typeStr || "IFCELEMENT").toUpperCase();
      if (this.isCategorySkipped(cat)) continue;

      const name = this.unwrapAttr(p.Name) || p.name || `${cat} #${expressId}`;
      const box = p.boundingBox instanceof THREE.Box3 && this.isValidBox(p.boundingBox)
        ? p.boundingBox.clone()
        : null;

      let volumeM3 = this.readNumberAttr(p, ["NetVolume", "GrossVolume", "Volume"]);
      if ((!volumeM3 || volumeM3 <= 0) && box) {
        const sz = new THREE.Vector3();
        box.getSize(sz);
        volumeM3 = Math.max(0.05, sz.x * sz.y * sz.z * 0.45);
      }

      const record: IndexedElementRecord = {
        modelId,
        expressId,
        category: cat,
        name: String(name),
        globalId: this.unwrapAttr(p.GlobalId) || undefined,
        predefinedType: this.unwrapAttr(p.PredefinedType) || undefined,
        objectType: this.unwrapAttr(p.ObjectType) || undefined,
        storey: storeysMap?.[`${modelId}-${expressId}`] || p.Storey || undefined,
        box,
        volumeM3,
        areaM2: this.readNumberAttr(p, ["NetArea", "GrossArea", "Area"]),
        psets: p.psets,
      };

      elements.push(record);
      byExpressId.set(expressId, record);
      const list = byCategory.get(cat) || [];
      list.push(record);
      byCategory.set(cat, list);

      if (elements.length >= maxElements) break;
    }

    return {
      modelId,
      modelRef: model,
      categories: Array.from(byCategory.keys()),
      elements,
      byExpressId,
      byCategory,
      hasBoxes: elements.some((e) => e.box !== null),
      hasPsets: true,
      source: "properties-fallback",
      indexedAt: Date.now(),
    };
  }
}
