/**
 * WorkspaceSnapshotManager — IndexedDB Persistent Project Workspace Snapshots
 *
 * Saves and restores complete BIM Kintsugi working sessions (model metadata,
 * serialized 4D schedule tasks, custom cost rates, saved selection sets,
 * camera pose, 4D simulation date, and theme) in IndexedDB, with automatic
 * localStorage/in-memory fallback when IndexedDB is unavailable.
 */

import type { ScheduleTask } from "../modules/ScheduleManager";

export interface SerializedScheduleTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  actualStartDate?: string;
  actualEndDate?: string;
  status: "Planned" | "In Progress" | "Completed";
  modelId: string;
  elementIds: number[];
  unitCost: number;
  totalCost: number;
  quantity: number;
  wbsCode?: string;
  parentId?: string;
  isSummary?: boolean;
  matchProperty?: string;
  matchValue?: string;
}

export interface WorkspaceCameraPose {
  position: [number, number, number];
  target: [number, number, number];
}

export interface WorkspaceSnapshot {
  version: number;
  id: string;
  name: string;
  savedAt: string;
  sampleModelKey?: string;
  modelNames: string[];
  timelineDateIso?: string;
  is4dMode: boolean;
  activeTheme?: string;
  cameraPose?: WorkspaceCameraPose;
  tasks: SerializedScheduleTask[];
  costRates?: Record<string, number>;
  savedSelectionSetsJson?: string;
}

const DB_NAME = "bim_kintsugi_workspace_db";
const DB_VERSION = 1;
const STORE_NAME = "snapshots";
const FALLBACK_STORAGE_KEY = "bim_kintsugi_workspace_snapshots_v1";
const LATEST_SNAPSHOT_ID = "latest";

export function serializeScheduleTasks(tasks: Iterable<ScheduleTask>): SerializedScheduleTask[] {
  const out: SerializedScheduleTask[] = [];
  for (const t of tasks) {
    out.push({
      id: t.id,
      name: t.name,
      startDate: t.startDate,
      endDate: t.endDate,
      actualStartDate: t.actualStartDate,
      actualEndDate: t.actualEndDate,
      status: t.status,
      modelId: t.modelId || "",
      elementIds: Array.from(t.elementIds || []),
      unitCost: t.unitCost || 0,
      totalCost: t.totalCost || 0,
      quantity: t.quantity || 0,
      wbsCode: t.wbsCode,
      parentId: t.parentId,
      isSummary: t.isSummary,
      matchProperty: t.matchProperty,
      matchValue: t.matchValue,
    });
  }
  return out;
}

export function deserializeScheduleTasks(serialized: SerializedScheduleTask[]): ScheduleTask[] {
  return serialized.map(
    (s) =>
      ({
        id: s.id,
        name: s.name,
        startDate: s.startDate,
        endDate: s.endDate,
        actualStartDate: s.actualStartDate,
        actualEndDate: s.actualEndDate,
        status: s.status,
        modelId: s.modelId,
        elementIds: new Set<number>(s.elementIds || []),
        unitCost: s.unitCost,
        totalCost: s.totalCost,
        quantity: s.quantity,
        wbsCode: s.wbsCode,
        parentId: s.parentId,
        isSummary: s.isSummary,
        matchProperty: s.matchProperty,
        matchValue: s.matchValue,
      }) as ScheduleTask
  );
}

export class WorkspaceSnapshotManager {
  private static instance: WorkspaceSnapshotManager | null = null;
  private memoryFallback = new Map<string, WorkspaceSnapshot>();

  public static getInstance(): WorkspaceSnapshotManager {
    if (!this.instance) this.instance = new WorkspaceSnapshotManager();
    return this.instance;
  }

  private hasIndexedDb(): boolean {
    return typeof indexedDB !== "undefined" && typeof indexedDB.open === "function";
  }

  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    });
  }

  private readFallbackAll(): Record<string, WorkspaceSnapshot> {
    try {
      if (typeof localStorage !== "undefined") {
        const raw = localStorage.getItem(FALLBACK_STORAGE_KEY);
        if (raw) return JSON.parse(raw) as Record<string, WorkspaceSnapshot>;
      }
    } catch {
      // Ignore storage errors
    }
    const obj: Record<string, WorkspaceSnapshot> = {};
    for (const [k, v] of this.memoryFallback) obj[k] = v;
    return obj;
  }

  private writeFallbackAll(all: Record<string, WorkspaceSnapshot>): void {
    this.memoryFallback.clear();
    for (const [k, v] of Object.entries(all)) this.memoryFallback.set(k, v);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(all));
      }
    } catch {
      // Ignore quota errors
    }
  }

  public async saveSnapshot(
    payload: Omit<WorkspaceSnapshot, "version" | "id" | "savedAt">,
    snapshotId = LATEST_SNAPSHOT_ID
  ): Promise<WorkspaceSnapshot> {
    const snapshot: WorkspaceSnapshot = {
      ...payload,
      version: 1,
      id: snapshotId,
      savedAt: new Date().toISOString(),
    };

    if (this.hasIndexedDb()) {
      try {
        const db = await this.openDb();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).put(snapshot);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error ?? new Error("IndexedDB put failed"));
        });
        db.close();
        return snapshot;
      } catch {
        // Fall through to localStorage / memory fallback
      }
    }

    const all = this.readFallbackAll();
    all[snapshotId] = snapshot;
    this.writeFallbackAll(all);
    return snapshot;
  }

  public async loadSnapshot(snapshotId = LATEST_SNAPSHOT_ID): Promise<WorkspaceSnapshot | null> {
    if (this.hasIndexedDb()) {
      try {
        const db = await this.openDb();
        const result = await new Promise<WorkspaceSnapshot | null>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const req = tx.objectStore(STORE_NAME).get(snapshotId);
          req.onsuccess = () => resolve((req.result as WorkspaceSnapshot | undefined) ?? null);
          req.onerror = () => reject(req.error ?? new Error("IndexedDB get failed"));
        });
        db.close();
        if (result) return result;
      } catch {
        // Fall through to fallback
      }
    }

    const all = this.readFallbackAll();
    return all[snapshotId] ?? null;
  }

  public async listSnapshots(): Promise<WorkspaceSnapshot[]> {
    if (this.hasIndexedDb()) {
      try {
        const db = await this.openDb();
        const items = await new Promise<WorkspaceSnapshot[]>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readonly");
          const req = tx.objectStore(STORE_NAME).getAll();
          req.onsuccess = () => resolve((req.result as WorkspaceSnapshot[]) || []);
          req.onerror = () => reject(req.error ?? new Error("IndexedDB getAll failed"));
        });
        db.close();
        return items.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
      } catch {
        // Fall through
      }
    }

    return Object.values(this.readFallbackAll()).sort((a, b) =>
      b.savedAt.localeCompare(a.savedAt)
    );
  }

  public async deleteSnapshot(snapshotId = LATEST_SNAPSHOT_ID): Promise<void> {
    if (this.hasIndexedDb()) {
      try {
        const db = await this.openDb();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, "readwrite");
          tx.objectStore(STORE_NAME).delete(snapshotId);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
        });
        db.close();
      } catch {
        // Fall through
      }
    }
    const all = this.readFallbackAll();
    delete all[snapshotId];
    this.writeFallbackAll(all);
  }
}
