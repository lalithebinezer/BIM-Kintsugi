/**
 * IndexedDB Storage Cache (Separation of Concerns)
 * Caches model fragments and persists camera viewpoints locally.
 */

const DB_NAME = "BIM_Viewer_Storage";
const DB_VERSION = 1;
const STORE_MODELS = "models";
const STORE_VIEWPOINTS = "viewpoints";

export class StorageCache {
  private static instance: StorageCache | null = null;
  private db: IDBDatabase | null = null;

  private constructor() {}

  public static getInstance(): StorageCache {
    if (!StorageCache.instance) {
      StorageCache.instance = new StorageCache();
    }
    return StorageCache.instance;
  }

  public async init(): Promise<void> {
    if (typeof indexedDB === "undefined") return;
    if (this.db) return;

    return new Promise((resolve) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_MODELS)) {
          db.createObjectStore(STORE_MODELS);
        }
        if (!db.objectStoreNames.contains(STORE_VIEWPOINTS)) {
          db.createObjectStore(STORE_VIEWPOINTS, { keyPath: "id" });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (event) => {
        console.warn("IndexedDB initialization failed:", (event.target as IDBOpenDBRequest).error);
        resolve(); // Fallback gracefully if IndexedDB is disabled
      };
    });
  }

  public async saveModelBuffer(modelId: string, buffer: ArrayBuffer): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_MODELS, "readwrite");
        const store = transaction.objectStore(STORE_MODELS);
        store.put(buffer, modelId);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getModelBuffer(modelId: string): Promise<ArrayBuffer | null> {
    if (!this.db) return null;
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_MODELS, "readonly");
        const store = transaction.objectStore(STORE_MODELS);
        const request = store.get(modelId);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async saveViewpoints(viewpoints: any[]): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_VIEWPOINTS, "readwrite");
        const store = transaction.objectStore(STORE_VIEWPOINTS);
        store.clear();
        viewpoints.forEach((vp) => store.put(vp));
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getViewpoints(): Promise<any[]> {
    if (!this.db) return [];
    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_VIEWPOINTS, "readonly");
        const store = transaction.objectStore(STORE_VIEWPOINTS);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }
}
