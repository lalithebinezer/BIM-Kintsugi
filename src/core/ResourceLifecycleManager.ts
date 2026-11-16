import * as THREE from "three";

export interface GpuMemorySnapshot {
  geometries: number;
  textures: number;
  calls: number;
  triangles: number;
  points: number;
  lines: number;
  trackedCount: number;
  hiddenPoolCount: number;
  jsHeapUsedMb: number | null;
}

export interface TrackedResourceEntry {
  id: string;
  tag: string;
  resource: any;
  disposeFn?: () => void;
  acquiredAt: number;
  refCount: number;
}

export interface HiddenReclaimTarget {
  key: string;
  hiddenSinceMs: number;
  onReclaim: () => Promise<void> | void;
  onRestore?: () => Promise<void> | void;
  reclaimed: boolean;
}

/**
 * Centralized GPU & transient scene resource registry with reference counting,
 * deterministic disposal on clear/unload, and TTL-based eviction of hidden elements/models.
 */
export class ResourceLifecycleManager {
  private static instance: ResourceLifecycleManager | null = null;
  private entries: Map<string, TrackedResourceEntry> = new Map();
  private hiddenTargets: Map<string, HiddenReclaimTarget> = new Map();
  private renderer: THREE.WebGLRenderer | null = null;
  private softGeometryBudget: number = 2500;
  private defaultHiddenTtlMs: number = 45_000;
  private nextId = 1;

  private constructor() {}

  public static getInstance(): ResourceLifecycleManager {
    if (!ResourceLifecycleManager.instance) {
      ResourceLifecycleManager.instance = new ResourceLifecycleManager();
    }
    return ResourceLifecycleManager.instance;
  }

  public setRenderer(renderer: THREE.WebGLRenderer | null | undefined) {
    if (renderer) {
      this.renderer = renderer;
    }
  }

  public setBudgets(options: { softGeometryBudget?: number; defaultHiddenTtlMs?: number }) {
    if (typeof options.softGeometryBudget === "number" && options.softGeometryBudget > 0) {
      this.softGeometryBudget = options.softGeometryBudget;
    }
    if (typeof options.defaultHiddenTtlMs === "number" && options.defaultHiddenTtlMs >= 0) {
      this.defaultHiddenTtlMs = options.defaultHiddenTtlMs;
    }
  }

  /**
   * Registers or increments ref-count for a disposable GPU/CPU resource under a logical owner tag.
   */
  public track(resource: any, tag: string, customKey?: string, disposeFn?: () => void): string {
    const id = customKey || `${tag}:${this.nextId++}`;
    const existing = this.entries.get(id);
    if (existing) {
      existing.refCount += 1;
      return id;
    }
    this.entries.set(id, {
      id,
      tag,
      resource,
      disposeFn,
      acquiredAt: Date.now(),
      refCount: 1,
    });
    return id;
  }

  /**
   * Decrements ref-count and disposes when refCount reaches 0.
   */
  public release(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.refCount -= 1;
    if (entry.refCount > 0) return false;

    this.disposeSingleResource(entry.resource, entry.disposeFn);
    this.entries.delete(id);
    return true;
  }

  /**
   * Disposes and removes every tracked resource belonging to a subsystem tag.
   */
  public releaseByTag(tag: string): number {
    let released = 0;
    for (const [id, entry] of this.entries.entries()) {
      if (entry.tag === tag) {
        this.disposeSingleResource(entry.resource, entry.disposeFn);
        this.entries.delete(id);
        released++;
      }
    }
    return released;
  }

  /**
   * Safely disposes a single Three.js geometry, material, texture, render target, or BVH bounds tree.
   */
  public disposeSingleResource(res: any, customDispose?: () => void) {
    try {
      if (typeof customDispose === "function") {
        customDispose();
      }
      if (!res) return;

      if (typeof res.disposeBoundsTree === "function") {
        try {
          res.disposeBoundsTree();
        } catch {}
      }

      if (res instanceof THREE.Material) {
        this.disposeMaterialTextures(res);
        res.dispose();
        return;
      }

      if (typeof res.dispose === "function") {
        res.dispose();
      }
    } catch {
      // Defensive: ignore already-disposed GL resources
    }
  }

  private disposeMaterialTextures(mat: any) {
    if (!mat || typeof mat !== "object") return;
    const textureKeys = [
      "map",
      "alphaMap",
      "aoMap",
      "bumpMap",
      "displacementMap",
      "emissiveMap",
      "envMap",
      "lightMap",
      "metalnessMap",
      "normalMap",
      "roughnessMap",
      "specularMap",
    ];
    for (const key of textureKeys) {
      const tex = mat[key];
      if (tex && typeof tex.dispose === "function") {
        try {
          tex.dispose();
        } catch {}
        mat[key] = null;
      }
    }
  }

  /**
   * Deeply disposes an Object3D subtree (geometries, materials, textures, and BVH structures),
   * while optionally preserving shared materials belonging to fragment material registries.
   */
  public disposeObjectTree(
    root: THREE.Object3D | null | undefined,
    options: { disposeMaterials?: boolean; removeFromParent?: boolean } = {}
  ): number {
    if (!root) return 0;
    const disposeMaterials = options.disposeMaterials ?? true;
    const removeFromParent = options.removeFromParent ?? true;
    let disposedGeometries = 0;

    if (typeof root.traverse === "function") {
      root.traverse((node: any) => {
        if (node.geometry) {
          if (typeof node.geometry.disposeBoundsTree === "function") {
            try {
              node.geometry.disposeBoundsTree();
            } catch {}
          }
          if (typeof node.geometry.dispose === "function") {
            try {
              node.geometry.dispose();
              disposedGeometries++;
            } catch {}
          }
        }
        if (disposeMaterials && node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          for (const mat of mats) {
            if (mat && !mat.userData?.sharedRegistry) {
              this.disposeMaterialTextures(mat);
              if (typeof mat.dispose === "function") {
                try {
                  mat.dispose();
                } catch {}
              }
            }
          }
        }
      });
    }

    if (removeFromParent && typeof root.removeFromParent === "function") {
      root.removeFromParent();
    }
    return disposedGeometries;
  }

  /**
   * Registers a hidden element batch or model eligible for GPU buffer eviction if hidden past TTL.
   */
  public markHidden(
    key: string,
    onReclaim: () => Promise<void> | void,
    onRestore?: () => Promise<void> | void
  ) {
    const existing = this.hiddenTargets.get(key);
    if (existing) {
      existing.hiddenSinceMs = Date.now();
      existing.onReclaim = onReclaim;
      if (onRestore) existing.onRestore = onRestore;
      return;
    }
    this.hiddenTargets.set(key, {
      key,
      hiddenSinceMs: Date.now(),
      onReclaim,
      onRestore,
      reclaimed: false,
    });
  }

  /**
   * Marks a hidden target visible again and triggers lazy buffer re-hydration if it had been evicted.
   */
  public async markVisible(key: string): Promise<boolean> {
    const target = this.hiddenTargets.get(key);
    if (!target) return false;
    const wasReclaimed = target.reclaimed;
    this.hiddenTargets.delete(key);
    if (wasReclaimed && typeof target.onRestore === "function") {
      await target.onRestore();
      return true;
    }
    return false;
  }

  /**
   * Evicts GPU buffers for targets hidden longer than `ttlMs`, or sooner if geometry count exceeds soft budget.
   */
  public async reclaimExpiredHidden(ttlMs: number = this.defaultHiddenTtlMs, nowMs: number = Date.now()): Promise<number> {
    const snapshot = this.getMemorySnapshot();
    const pressureMode = snapshot.geometries > this.softGeometryBudget;
    let reclaimedCount = 0;

    for (const target of this.hiddenTargets.values()) {
      if (target.reclaimed) continue;
      const ageMs = nowMs - target.hiddenSinceMs;
      if (pressureMode || ageMs >= ttlMs) {
        try {
          await target.onReclaim();
          target.reclaimed = true;
          reclaimedCount++;
        } catch {}
      }
    }
    return reclaimedCount;
  }

  /**
   * Immediately purges all hidden reclaimables and transient GPU caches.
   */
  public async purgeTransientCaches(): Promise<number> {
    const count = await this.reclaimExpiredHidden(0, Date.now() + 1);
    try {
      this.renderer?.renderLists?.dispose();
    } catch {}
    return count;
  }

  public getMemorySnapshot(): GpuMemorySnapshot {
    const info = this.renderer?.info;
    const perfAny = typeof performance !== "undefined" ? (performance as any) : null;
    const jsHeapUsedMb =
      perfAny?.memory?.usedJSHeapSize !== undefined
        ? Math.round((perfAny.memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10
        : null;

    return {
      geometries: info?.memory?.geometries ?? 0,
      textures: info?.memory?.textures ?? 0,
      calls: info?.render?.calls ?? 0,
      triangles: info?.render?.triangles ?? 0,
      points: info?.render?.points ?? 0,
      lines: info?.render?.lines ?? 0,
      trackedCount: this.entries.size,
      hiddenPoolCount: this.hiddenTargets.size,
      jsHeapUsedMb,
    };
  }
}
