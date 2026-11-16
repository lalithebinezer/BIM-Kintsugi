import * as WEBIFC from "web-ifc";
import * as FRAGS from "@thatopen/fragments";
import { BimEngine } from "./BimEngine";
import { MetadataSyncService } from "./MetadataSyncService";

export type StreamDisciplinePhase = "shell" | "internals" | "full";

export interface StreamingLoadOptions {
  modelId: string;
  name: string;
  buffer: Uint8Array;
  shellFirstThresholdBytes?: number;
  onProgress?: (percent: number, stage: string, phase: StreamDisciplinePhase) => void;
  onPhaseModelReady?: (model: any, phase: StreamDisciplinePhase) => Promise<void> | void;
}

export interface StreamingLoadResult {
  primaryModel: any;
  secondaryPromise: Promise<any | null> | null;
  strategy: "shell-then-internals" | "tile-stream" | "cached-tile-stream";
}

export const SHELL_IFC_TYPE_IDS: number[] = [
  WEBIFC.IFCWALL,
  WEBIFC.IFCWALLSTANDARDCASE,
  WEBIFC.IFCSLAB,
  WEBIFC.IFCCOLUMN,
  WEBIFC.IFCBEAM,
  WEBIFC.IFCROOF,
  WEBIFC.IFCFOOTING,
  WEBIFC.IFCPILE,
  WEBIFC.IFCSTAIR,
  WEBIFC.IFCSTAIRFLIGHT,
  WEBIFC.IFCRAMP,
  WEBIFC.IFCRAMPFLIGHT,
  WEBIFC.IFCCURTAINWALL,
  WEBIFC.IFCPLATE,
  WEBIFC.IFCMEMBER,
  WEBIFC.IFCDOOR,
  WEBIFC.IFCWINDOW,
  WEBIFC.IFCRAILING,
  WEBIFC.IFCSITE,
];

export const INTERNAL_MEP_IFC_TYPE_IDS: number[] = [
  WEBIFC.IFCFLOWSEGMENT,
  WEBIFC.IFCFLOWFITTING,
  WEBIFC.IFCFLOWTERMINAL,
  WEBIFC.IFCFLOWCONTROLLER,
  WEBIFC.IFCFLOWMOVINGDEVICE,
  WEBIFC.IFCFLOWSTORAGEDEVICE,
  WEBIFC.IFCFLOWTREATMENTDEVICE,
  WEBIFC.IFCDISTRIBUTIONELEMENT,
  WEBIFC.IFCDISTRIBUTIONCONTROLELEMENT,
  WEBIFC.IFCFURNISHINGELEMENT,
  WEBIFC.IFCFASTENER,
  WEBIFC.IFCREINFORCINGBAR,
  WEBIFC.IFCREINFORCINGMESH,
  WEBIFC.IFCCOVERING,
  WEBIFC.IFCBUILDINGELEMENTPROXY,
];

const SHELL_NAMES = new Set([
  "IFCWALL",
  "IFCWALLSTANDARDCASE",
  "IFCSLAB",
  "IFCCOLUMN",
  "IFCBEAM",
  "IFCROOF",
  "IFCFOOTING",
  "IFCPILE",
  "IFCSTAIR",
  "IFCSTAIRFLIGHT",
  "IFCRAMP",
  "IFCRAMPFLIGHT",
  "IFCCURTAINWALL",
  "IFCPLATE",
  "IFCMEMBER",
  "IFCDOOR",
  "IFCWINDOW",
  "IFCRAILING",
  "IFCSITE",
]);

/**
 * Classifies an IFC entity name into hierarchical streaming tiers:
 * `"shell"` loads first for instant architectural context; `"internals"` streams asynchronously.
 */
export function classifyStreamPriority(ifcType: string): "shell" | "internals" {
  const upper = String(ifcType || "").toUpperCase();
  if (SHELL_NAMES.has(upper)) return "shell";
  return "internals";
}

/**
 * Hierarchical 2-Phase Model Streamer.
 * Configures spatial tile streaming (`FragmentsModels` worker multithreading + `LodMode.DEFAULT`),
 * separates metadata storage into `MetadataSyncService`, and prioritizes building shell geometry
 * ahead of dense internal MEP/fitout classes on large IFC inputs.
 */
export class StreamingLoader {
  private static instance: StreamingLoader | null = null;
  private engine: BimEngine;
  private metadataService: MetadataSyncService;
  private activeStreams: Set<string> = new Set();

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.metadataService = MetadataSyncService.getInstance();
  }

  public static getInstance(): StreamingLoader {
    if (!StreamingLoader.instance) {
      StreamingLoader.instance = new StreamingLoader();
    }
    return StreamingLoader.instance;
  }

  public getMultithreadingConfig(): FRAGS.VirtualModelConfig {
    return {
      multithreading: {
        meshConnectionRate: 45,
        meshConnectionThreshold: 24,
        threadUpdaterDelay: 16,
      },
    };
  }

  /**
   * Loads a `.frag` buffer with spatial tile streaming and default distance-based LOD enabled.
   */
  public async loadFragmentStream(
    buffer: Uint8Array | ArrayBuffer,
    modelId: string,
    onProgress?: (percent: number) => void
  ): Promise<any> {
    const model = await this.engine.fragments.core.load(buffer, {
      modelId,
      camera: this.engine.world?.camera?.three as any,
      virtualModelConfig: this.getMultithreadingConfig(),
      onProgress: (ev: FRAGS.LoadProgressEvent) => {
        if (onProgress && typeof ev?.progress === "number") {
          onProgress(Math.round(ev.progress * 100));
        }
      },
    });

    await this.applyDefaultLodMode(model);
    return model;
  }

  private async applyDefaultLodMode(model: any) {
    try {
      if (model && typeof model.setLodMode === "function") {
        await model.setLodMode(FRAGS.LodMode.DEFAULT);
      }
    } catch {}
  }

  /**
   * Executes hierarchical streaming ingestion for `.ifc` models:
   * - Checks unified IndexedDB tile cache first (`MetadataSyncService`).
   * - For large models (`>= threshold`), loads structural Shell classes first so the user can
   *   interact immediately while internal MEP/furnishings stream in the background.
   */
  public async streamIfc(
    ifcLoader: any,
    options: StreamingLoadOptions
  ): Promise<StreamingLoadResult> {
    const {
      modelId,
      name,
      buffer,
      shellFirstThresholdBytes = 6 * 1024 * 1024,
      onProgress,
      onPhaseModelReady,
    } = options;

    const cacheKey = `${name}-${buffer.length}`;
    this.activeStreams.add(modelId);

    try {
      onProgress?.(8, "Checking local tile cache...", "shell");
      const cached = await this.metadataService.getFragmentBuffer(cacheKey);
      if (cached) {
        onProgress?.(65, "Streaming cached spatial tiles...", "full");
        const model = await this.loadFragmentStream(cached, modelId, (pct) => {
          onProgress?.(Math.min(99, 65 + Math.round(pct * 0.35)), "Streaming spatial tiles...", "full");
        });
        onProgress?.(100, "Cached tiles ready", "full");
        return {
          primaryModel: model,
          secondaryPromise: null,
          strategy: "cached-tile-stream",
        };
      }

      const useTwoPhase = buffer.byteLength >= shellFirstThresholdBytes;
      if (!useTwoPhase) {
        onProgress?.(30, "Converting IFC into spatial fragment tiles...", "full");
        const model = await ifcLoader.load(buffer, true, name, {
          processData: { virtualModelConfig: this.getMultithreadingConfig() } as any,
        });
        await this.applyDefaultLodMode(model);
        this.persistFragmentsBackground(cacheKey, model);
        onProgress?.(100, "Spatial model streamed", "full");
        return {
          primaryModel: model,
          secondaryPromise: null,
          strategy: "tile-stream",
        };
      }

      // Phase 1: Building shell & primary structural framing first
      onProgress?.(25, "Phase 1/2: Streaming building shell & structure...", "shell");
      const shellModel = await ifcLoader.load(buffer, true, name, {
        instanceCallback: (importer: FRAGS.IfcImporter) => {
          importer.classes.elements.clear();
          for (const clsId of SHELL_IFC_TYPE_IDS) {
            importer.classes.elements.add(clsId);
          }
        },
      });
      await this.applyDefaultLodMode(shellModel);
      onProgress?.(70, "Shell interactive — streaming internal systems...", "shell");
      await onPhaseModelReady?.(shellModel, "shell");

      // Phase 2: Internal MEP, furnishings & accessories loaded asynchronously on demand
      const secondaryPromise = (async () => {
        try {
          const internalsModel = await ifcLoader.load(buffer, true, `${name}::internals`, {
            instanceCallback: (importer: FRAGS.IfcImporter) => {
              importer.classes.elements.clear();
              for (const clsId of INTERNAL_MEP_IFC_TYPE_IDS) {
                importer.classes.elements.add(clsId);
              }
            },
          });
          await this.applyDefaultLodMode(internalsModel);
          onProgress?.(100, "All internal MEP & fitout tiles ready", "internals");
          await onPhaseModelReady?.(internalsModel, "internals");
          return internalsModel;
        } catch (err) {
          console.warn("[StreamingLoader] Deferred internal systems stream skipped:", err);
          return null;
        }
      })();

      return {
        primaryModel: shellModel,
        secondaryPromise,
        strategy: "shell-then-internals",
      };
    } finally {
      this.activeStreams.delete(modelId);
    }
  }

  private persistFragmentsBackground(cacheKey: string, model: any) {
    if (!model || typeof model.getBuffer !== "function") return;
    setTimeout(async () => {
      try {
        const fragBuf = await model.getBuffer(false);
        await this.metadataService.saveFragmentBuffer(cacheKey, fragBuf);
      } catch {}
    }, 1000);
  }

  public getActiveStreamCount(): number {
    return this.activeStreams.size;
  }
}
