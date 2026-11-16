import { parseIfcStepText, type ParsedIfcElementRecord } from "../modules/IfcStepParser";
import { MetadataApiAdapter } from "./MetadataApiAdapter";

export interface StoredElementMetadata {
  modelId: string;
  expressId: number;
  type: string;
  name: string;
  globalId: string;
  storey: string;
  psets: Record<string, Record<string, string>>;
  raw: ParsedIfcElementRecord;
}

export interface MetadataStats {
  lruSize: number;
  lruCapacity: number;
  idbConnected: boolean;
  ingestedModels: string[];
  remoteEnabled: boolean;
}

const DB_NAME = "BIM_Twin_DB";
const DB_VERSION = 1;
const STORE_ELEMENTS = "elements";
const STORE_FRAGMENTS = "fragments";
const STORE_TWIN_EDITS = "twinEdits";

/**
 * Decouples heavy IFC property metadata from the active 3D scene heap.
 * Uses a bounded LRU memory cache + indexed IndexedDB database (+ optional REST/GraphQL remote)
 * so element properties are fetched lazily in sub-millisecond clicks without retaining huge graphs in RAM.
 */
export class MetadataSyncService {
  private static instance: MetadataSyncService | null = null;
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;
  private lruCache: Map<string, any> = new Map();
  private lruCapacity: number = 250;
  private ingestedModels: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): MetadataSyncService {
    if (!MetadataSyncService.instance) {
      MetadataSyncService.instance = new MetadataSyncService();
    }
    return MetadataSyncService.instance;
  }

  public setLruCapacity(capacity: number) {
    if (capacity >= 10) {
      this.lruCapacity = capacity;
      this.enforceLruBound();
    }
  }

  public async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    if (typeof indexedDB === "undefined") {
      return;
    }

    this.initPromise = new Promise<void>((resolve) => {
      try {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (ev) => {
          const db = (ev.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_ELEMENTS)) {
            const store = db.createObjectStore(STORE_ELEMENTS, { keyPath: ["modelId", "expressId"] });
            store.createIndex("byModel", "modelId", { unique: false });
            store.createIndex("byStorey", ["modelId", "storey"], { unique: false });
            store.createIndex("byType", ["modelId", "type"], { unique: false });
            store.createIndex("byGlobalId", ["modelId", "globalId"], { unique: false });
          }
          if (!db.objectStoreNames.contains(STORE_FRAGMENTS)) {
            db.createObjectStore(STORE_FRAGMENTS);
          }
          if (!db.objectStoreNames.contains(STORE_TWIN_EDITS)) {
            db.createObjectStore(STORE_TWIN_EDITS, { keyPath: "key" });
          }
        };
        req.onsuccess = (ev) => {
          this.db = (ev.target as IDBOpenDBRequest).result;
          resolve();
        };
        req.onerror = () => {
          resolve();
        };
      } catch {
        resolve();
      }
    });

    return this.initPromise;
  }

  private getLruKey(modelId: string, expressId: number): string {
    return `${modelId}:${expressId}`;
  }

  private putLru(modelId: string, expressId: number, value: any) {
    const key = this.getLruKey(modelId, expressId);
    if (this.lruCache.has(key)) {
      this.lruCache.delete(key);
    }
    this.lruCache.set(key, value);
    this.enforceLruBound();
  }

  private getLru(modelId: string, expressId: number): any | null {
    const key = this.getLruKey(modelId, expressId);
    if (!this.lruCache.has(key)) return null;
    const val = this.lruCache.get(key);
    // Refresh recency
    this.lruCache.delete(key);
    this.lruCache.set(key, val);
    return val;
  }

  private enforceLruBound() {
    while (this.lruCache.size > this.lruCapacity) {
      const oldestKey = this.lruCache.keys().next().value;
      if (oldestKey === undefined) break;
      this.lruCache.delete(oldestKey);
    }
  }

  public clearLruCache() {
    this.lruCache.clear();
  }

  /**
   * Parses IFC STEP text off the main thread when Workers are supported, stores parsed element
   * properties in IndexedDB, and returns a lightweight storey lookup map without keeping all props in heap.
   */
  public async ingestStepMetadata(
    modelId: string,
    ifcText: string
  ): Promise<{ elementCount: number; storeysMap: Record<string, string> }> {
    const parsed = await this.parseInWorkerOrFallback(modelId, ifcText);
    const storeysMap: Record<string, string> = {};
    const batch: StoredElementMetadata[] = [];

    for (const [idStr, rec] of Object.entries(parsed)) {
      const expressId = Number(idStr);
      if (!Number.isFinite(expressId)) continue;
      if (rec.Storey) {
        storeysMap[`${modelId}-${expressId}`] = rec.Storey;
      }
      batch.push({
        modelId,
        expressId,
        type: String(rec.type || "IFCBUILDINGELEMENT"),
        name: String(rec.Name?.value || `Element #${expressId}`),
        globalId: String(rec.GlobalId?.value || ""),
        storey: String(rec.Storey || "Entry Level"),
        psets: rec.psets || {},
        raw: rec,
      });
    }

    await this.saveElementsBatch(modelId, batch);
    this.ingestedModels.add(modelId);
    return { elementCount: batch.length, storeysMap };
  }

  private async parseInWorkerOrFallback(
    modelId: string,
    ifcText: string
  ): Promise<Record<number, ParsedIfcElementRecord>> {
    if (typeof Worker !== "undefined" && ifcText.length > 40_000) {
      try {
        const result = await new Promise<Record<number, ParsedIfcElementRecord>>((resolve, reject) => {
          const worker = new Worker(new URL("../workers/ifcMetadataWorker.ts", import.meta.url), {
            type: "module",
          });
          const requestId = `meta-${Date.now()}-${Math.random()}`;
          const timeout = setTimeout(() => {
            worker.terminate();
            reject(new Error("Metadata worker timeout"));
          }, 15_000);

          worker.onmessage = (ev) => {
            if (ev.data?.requestId === requestId) {
              clearTimeout(timeout);
              worker.terminate();
              resolve(ev.data.properties || {});
            }
          };
          worker.onerror = (err) => {
            clearTimeout(timeout);
            worker.terminate();
            reject(err);
          };
          worker.postMessage({ requestId, modelId, ifcText });
        });
        return result;
      } catch {
        // Fallback smoothly to synchronous parser if worker bundlers/environment block Workers
      }
    }
    return parseIfcStepText(ifcText);
  }

  /**
   * Saves a batch of element metadata records into IndexedDB in a single write transaction.
   * For small in-memory fallback (no IDB), seeds only up to LRU capacity.
   */
  public async saveElementsBatch(modelId: string, records: StoredElementMetadata[]): Promise<void> {
    await this.init();
    if (!this.db) {
      for (const r of records.slice(0, this.lruCapacity)) {
        this.putLru(modelId, r.expressId, r.raw);
      }
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_ELEMENTS, "readwrite");
        const store = tx.objectStore(STORE_ELEMENTS);
        for (const record of records) {
          store.put(record);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Resolves a single element's IFC properties on click cleanly via:
   * 1) In-memory LRU Cache -> 2) IndexedDB `[modelId, expressId]` -> 3) Remote REST/GraphQL API.
   */
  public async getElementMetadata(modelId: string, expressId: number): Promise<any | null> {
    const cached = this.getLru(modelId, expressId);
    if (cached) return cached;

    await this.init();
    if (this.db) {
      const fromIdb = await new Promise<StoredElementMetadata | null>((resolve) => {
        try {
          const tx = this.db!.transaction(STORE_ELEMENTS, "readonly");
          const store = tx.objectStore(STORE_ELEMENTS);
          const req = store.get([modelId, expressId]);
          req.onsuccess = () => resolve((req.result as StoredElementMetadata) || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      });

      if (fromIdb?.raw) {
        this.putLru(modelId, expressId, fromIdb.raw);
        return fromIdb.raw;
      }
    }

    const remote = await MetadataApiAdapter.getInstance().fetchElementMetadata(modelId, expressId);
    if (remote) {
      const normalizedPsets: Record<string, Record<string, string>> = {};
      if (remote.psets) {
        for (const [psetName, props] of Object.entries(remote.psets)) {
          normalizedPsets[psetName] = {};
          for (const [k, v] of Object.entries(props || {})) {
            normalizedPsets[psetName][k] = String(v ?? "");
          }
        }
      }
      const normalized: ParsedIfcElementRecord = {
        expressId: remote.expressId,
        type: remote.type || "IFCBUILDINGELEMENT",
        Name: { value: remote.name || `Element #${expressId}` },
        GlobalId: { value: remote.globalId || "" },
        Storey: remote.storey || "Entry Level",
        psets: normalizedPsets,
      };
      this.putLru(modelId, expressId, normalized);
      await this.saveElementsBatch(modelId, [
        {
          modelId,
          expressId,
          type: normalized.type,
          name: normalized.Name.value,
          globalId: normalized.GlobalId.value,
          storey: normalized.Storey,
          psets: normalizedPsets,
          raw: normalized,
        },
      ]);
      return normalized;
    }

    return null;
  }

  /**
   * Persists cached `.frag` buffers into the unified IndexedDB fragment store.
   */
  public async saveFragmentBuffer(key: string, buffer: Uint8Array): Promise<void> {
    await this.init();
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_FRAGMENTS, "readwrite");
        const store = tx.objectStore(STORE_FRAGMENTS);
        store.put({ buffer, updatedAt: Date.now() }, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getFragmentBuffer(key: string): Promise<Uint8Array | null> {
    await this.init();
    if (!this.db) return null;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_FRAGMENTS, "readonly");
        const store = tx.objectStore(STORE_FRAGMENTS);
        const req = store.get(key);
        req.onsuccess = () => {
          const val = req.result;
          if (!val) return resolve(null);
          if (val instanceof Uint8Array) return resolve(val);
          if (val.buffer instanceof Uint8Array) return resolve(val.buffer);
          resolve(null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async saveTwinEdit(key: string, data: any): Promise<void> {
    await this.init();
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_TWIN_EDITS, "readwrite");
        tx.objectStore(STORE_TWIN_EDITS).put({ key, ...data, updatedAt: Date.now() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async loadAllTwinEdits(): Promise<Record<string, any>> {
    await this.init();
    if (!this.db) return {};
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_TWIN_EDITS, "readonly");
        const req = tx.objectStore(STORE_TWIN_EDITS).getAll();
        req.onsuccess = () => {
          const out: Record<string, any> = {};
          const items = (req.result || []) as any[];
          for (const item of items) {
            if (item?.key) out[item.key] = item;
          }
          resolve(out);
        };
        req.onerror = () => resolve({});
      } catch {
        resolve({});
      }
    });
  }

  public async purgeModelMetadata(modelId: string): Promise<void> {
    this.ingestedModels.delete(modelId);
    for (const key of this.lruCache.keys()) {
      if (key.startsWith(`${modelId}:`)) {
        this.lruCache.delete(key);
      }
    }
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(STORE_ELEMENTS, "readwrite");
        const idx = tx.objectStore(STORE_ELEMENTS).index("byModel");
        const req = idx.openKeyCursor(IDBKeyRange.only(modelId));
        req.onsuccess = () => {
          const cursor = req.result;
          if (cursor) {
            tx.objectStore(STORE_ELEMENTS).delete(cursor.primaryKey);
            cursor.continue();
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public getStats(): MetadataStats {
    return {
      lruSize: this.lruCache.size,
      lruCapacity: this.lruCapacity,
      idbConnected: Boolean(this.db),
      ingestedModels: Array.from(this.ingestedModels),
      remoteEnabled: MetadataApiAdapter.getInstance().isConfigured(),
    };
  }
}
