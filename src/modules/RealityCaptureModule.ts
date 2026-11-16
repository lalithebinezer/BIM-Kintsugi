import * as THREE from "three";
import * as OBF from "@thatopen/components-front";
import * as RC from "@thatopen/components/dist/realityCapture/index.js";
import { BimEngine } from "../core/BimEngine";
import { GraphicsVFXManager } from "./GraphicsVFXManager";

export interface CaptureSummary {
  clouds: number;
  splats: number;
  totalPoints: number;
}

/**
 * Reality Capture Integration Module (Phase 4).
 * Supports Potree 2.0 octree streaming (`OBF.PointCloudLoader` + `potree-core`),
 * browser-side `.las` -> Potree conversion via `@thatopen/components/dist/realityCapture`,
 * and 3D Gaussian Splats (`OBF.SplatLoader` for `.ply` / `.compressed.ply`) occluded
 * behind BIM geometry via `PostproductionMode.DEFERRED`.
 */
export class RealityCaptureModule {
  private static instance: RealityCaptureModule | null = null;
  private engine: BimEngine;
  private pointCloudLoader: OBF.PointCloudLoader;
  private splatLoader: OBF.SplatLoader;
  private totalLasPoints: number = 0;

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.pointCloudLoader = this.engine.components.get(OBF.PointCloudLoader);
    this.splatLoader = this.engine.components.get(OBF.SplatLoader);
    if (this.engine.world) {
      this.pointCloudLoader.world = this.engine.world;
      this.splatLoader.world = this.engine.world;
    }
  }

  public static getInstance(): RealityCaptureModule {
    if (!RealityCaptureModule.instance) {
      RealityCaptureModule.instance = new RealityCaptureModule();
    }
    return RealityCaptureModule.instance;
  }

  private ensureDeferredOcclusion() {
    if (this.engine.world) {
      this.pointCloudLoader.world = this.engine.world;
      this.splatLoader.world = this.engine.world;
    }
    const vfx = GraphicsVFXManager.getInstance();
    if (vfx.getPipelineMode() !== "deferred") {
      vfx.setPipelineMode("deferred");
    } else {
      vfx.applyPipelineMode(false);
    }
  }

  private buildInMemoryRequestManager(
    fileMap: Map<string, Blob>
  ): OBF.PointCloudRequestManager {
    return {
      getUrl: (url: string) => `local/${url}`,
      async fetch(input: RequestInfo | URL, init?: RequestInit) {
        const rawUrl = typeof input === "string" ? input : input.toString();
        const name = rawUrl.split(/[\\/]/).pop()!.split("?")[0];
        const blob = fileMap.get(name);
        if (!blob) return new Response(null, { status: 404 });

        const range = new Headers(init?.headers).get("Range");
        const match = range?.match(/bytes=(\d+)-(\d*)/);
        if (!match) return new Response(blob);

        const start = Number(match[1]);
        const end = match[2] ? Number(match[2]) + 1 : blob.size;
        return new Response(blob.slice(start, end), { status: 206 });
      },
    };
  }

  /**
   * Loads either a raw `.las` scan (auto-converting in-memory to Potree 2.0 octree)
   * or a Potree 2.0 triad (`metadata.json`, `hierarchy.bin`, `octree.bin`).
   */
  public async loadPointCloudFiles(
    inputFiles: FileList | File[],
    onProgress?: (pct: number, msg: string) => void
  ): Promise<CaptureSummary> {
    this.ensureDeferredOcclusion();
    const list = Array.from(inputFiles);
    const lasFile = list.find((f) => f.name.toLowerCase().endsWith(".las"));

    if (lasFile) {
      const stream = lasFile.stream() as unknown as AsyncIterable<Uint8Array>;
      const pts = await RC.decodeLasStream(stream, {
        onProgress: (pct, msg) => onProgress?.(Math.round(pct * 0.5), msg),
      });
      const potreeOut = RC.buildPotreeOctree(pts, {
        name: lasFile.name.replace(/\.las$/i, ""),
        onProgress: (pct, msg) => onProgress?.(50 + Math.round(pct * 0.5), msg),
      });
      this.totalLasPoints += pts.count;

      const metaBytes = new TextEncoder().encode(JSON.stringify(potreeOut.metadata));
      const fileMap = new Map<string, Blob>([
        ["metadata.json", new Blob([metaBytes], { type: "application/json" })],
        ["hierarchy.bin", new Blob([potreeOut.hierarchy as unknown as BlobPart])],
        ["octree.bin", new Blob([potreeOut.octree as unknown as BlobPart])],
      ]);

      await this.pointCloudLoader.load(
        { url: "local", requestManager: this.buildInMemoryRequestManager(fileMap) },
        { id: `las-${this.pointCloudLoader.list.size}-${Date.now()}`, fitCamera: true }
      );
      return this.getSummary();
    }

    const fileMap = new Map<string, Blob>();
    for (const file of list) fileMap.set(file.name, file);
    const required = ["metadata.json", "hierarchy.bin", "octree.bin"];
    const missing = required.filter((n) => !fileMap.has(n));
    if (missing.length > 0) {
      throw new Error(
        `Select either a .las file or all 3 Potree files (missing: ${missing.join(", ")})`
      );
    }

    await this.pointCloudLoader.load(
      { url: "local", requestManager: this.buildInMemoryRequestManager(fileMap) },
      { id: `potree-${this.pointCloudLoader.list.size}-${Date.now()}`, fitCamera: true }
    );
    return this.getSummary();
  }

  /**
   * Loads a 3D Gaussian Splat `.ply` / `.compressed.ply` into the Deferred occlusion layer.
   */
  public async loadSplatFile(file: File, gaussianScale: number = 1.0): Promise<CaptureSummary> {
    this.ensureDeferredOcclusion();
    const bytes = new Uint8Array(await file.arrayBuffer());
    this.splatLoader.gaussianScale = gaussianScale;
    await this.splatLoader.load(
      { fileBytes: bytes },
      { id: `splat-${this.splatLoader.list.size}-${Date.now()}` }
    );
    return this.getSummary();
  }

  public setPointBudget(budget: number) {
    this.pointCloudLoader.settings.pointBudget = Math.max(100_000, budget);
  }

  public setEdlEnabled(enabled: boolean) {
    this.pointCloudLoader.settings.edl = enabled;
  }

  public setSplatScale(scale: number) {
    this.splatLoader.gaussianScale = Math.max(0.01, scale);
  }

  public setCaptureOffset(x: number, y: number, z: number) {
    const mat = new THREE.Matrix4().makeTranslation(x, y, z);
    this.splatLoader.setTransform(mat);
    for (const [, cloud] of this.pointCloudLoader.list) {
      if ((cloud as any).object) {
        ((cloud as any).object as THREE.Object3D).position.set(x, y, z);
      }
    }
  }

  public getSummary(): CaptureSummary {
    return {
      clouds: this.pointCloudLoader.list.size,
      splats: this.splatLoader.list.size,
      totalPoints: this.totalLasPoints,
    };
  }

  public disposeAll(): CaptureSummary {
    for (const id of [...this.pointCloudLoader.list.keys()]) {
      this.pointCloudLoader.remove(id);
    }
    for (const id of [...this.splatLoader.list.keys()]) {
      this.splatLoader.remove(id);
    }
    this.totalLasPoints = 0;
    return this.getSummary();
  }
}
