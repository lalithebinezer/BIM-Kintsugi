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

const INTERNAL_MEP_NEEDLES = [
  "=IFCFLOW",
  "=IFCDISTRIBUTION",
  "=IFCFURNISHING",
  "=IFCREINFORCING",
  "=IFCCOVERING",
  "=IFCFASTENER",
].map((s) => Array.from(s, (c) => c.charCodeAt(0)));

const SHELL_NEEDLES = [
  "=IFCWALL",
  "=IFCSLAB",
  "=IFCCOLUMN",
  "=IFCBEAM",
  "=IFCDOOR",
  "=IFCWINDOW",
  "=IFCROOF",
  "=IFCSTAIR",
].map((s) => Array.from(s, (c) => c.charCodeAt(0)));

function countStepNeedles(buffer: Uint8Array, needles: number[][], stopAtCount: number): number {
  if (!buffer || buffer.length < 16) return 0;
  let hits = 0;
  const len = buffer.length;
  for (let i = 0; i < len - 12; i++) {
    if (buffer[i] !== 61) continue; // '='
    for (let n = 0; n < needles.length; n++) {
      const pat = needles[n];
      if (i + pat.length > len) continue;
      let matched = true;
      for (let j = 1; j < pat.length; j++) {
        let b = buffer[i + j];
        if (b >= 97 && b <= 122) b -= 32; // normalize ASCII lowercase to uppercase
        if (b !== pat[j]) {
          matched = false;
          break;
        }
      }
      if (matched) {
        hits++;
        if (hits >= stopAtCount) return hits;
        i += pat.length - 1;
        break;
      }
    }
  }
  return hits;
}

/**
 * Fast zero-allocation IFC STEP scan to verify whether internal MEP/fitout entities
 * exist before spawning a Phase 2 `::internals` parse pass (prevents empty worker errors
 * on structural-only or core/shell IFC files).
 */
export function hasInternalMepEntities(buffer: Uint8Array, minMatches: number = 10): boolean {
  return countStepNeedles(buffer, INTERNAL_MEP_NEEDLES, minMatches) >= minMatches;
}

/**
 * Fast check verifying at least one primary architectural/structural shell entity exists.
 */
export function hasShellEntities(buffer: Uint8Array, minMatches: number = 1): boolean {
  return countStepNeedles(buffer, SHELL_NEEDLES, minMatches) >= minMatches;
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
  private defaultElementClasses: number[] | null = null;

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
  private captureOrRestoreDefaultClasses(importer: FRAGS.IfcImporter) {
    if (!importer?.classes?.elements) return;
    if (!this.defaultElementClasses) {
      this.defaultElementClasses = Array.from(importer.classes.elements);
    } else if (importer.classes.elements.size < this.defaultElementClasses.length) {
      importer.classes.elements.clear();
      for (const clsId of this.defaultElementClasses) {
        importer.classes.elements.add(clsId);
      }
    }
  }

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
    const shellCacheKey = `${cacheKey}::shell`;
    const internalsCacheKey = `${cacheKey}::internals`;
    this.activeStreams.add(modelId);

    try {
      onProgress?.(8, "Checking local tile cache...", "shell");
      const [cachedSingle, cachedShell] = await Promise.all([
        this.metadataService.getFragmentBuffer(cacheKey),
        this.metadataService.getFragmentBuffer(shellCacheKey),
      ]);

      if (cachedSingle) {
        onProgress?.(65, "Streaming cached spatial tiles...", "full");
        const model = await this.loadFragmentStream(cachedSingle, modelId, (pct) => {
          onProgress?.(Math.min(99, 65 + Math.round(pct * 0.35)), "Streaming spatial tiles...", "full");
        });
        onProgress?.(100, "Cached tiles ready", "full");
        return {
          primaryModel: model,
          secondaryPromise: null,
          strategy: "cached-tile-stream",
        };
      }

      if (cachedShell) {
        onProgress?.(60, "Streaming cached shell tiles...", "shell");
        const shellModel = await this.loadFragmentStream(cachedShell, modelId, (pct) => {
          onProgress?.(Math.min(92, 60 + Math.round(pct * 0.3)), "Streaming cached shell...", "shell");
        });
        await onPhaseModelReady?.(shellModel, "shell");

        const cachedInternals = await this.metadataService.getFragmentBuffer(internalsCacheKey);
        const secondaryPromise = cachedInternals
          ? (async () => {
              try {
                const internalsModel = await this.loadFragmentStream(
                  cachedInternals,
                  `${modelId}::internals`
                );
                onProgress?.(100, "Cached internal MEP tiles ready", "internals");
                await onPhaseModelReady?.(internalsModel, "internals");
                return internalsModel;
              } catch {
                return null;
              }
            })()
          : null;

        if (!secondaryPromise) {
          onProgress?.(100, "Cached shell tiles ready", "full");
        }
        return {
          primaryModel: shellModel,
          secondaryPromise,
          strategy: "cached-tile-stream",
        };
      }

      const useTwoPhase =
        buffer.byteLength >= shellFirstThresholdBytes &&
        hasShellEntities(buffer) &&
        hasInternalMepEntities(buffer);

      if (!useTwoPhase) {
        onProgress?.(30, "Converting IFC into spatial fragment tiles...", "full");
        const model = await ifcLoader.load(buffer, true, name, {
          processData: { virtualModelConfig: this.getMultithreadingConfig() } as any,
          instanceCallback: (importer: FRAGS.IfcImporter) => {
            importer.parseOnce = true;
            this.captureOrRestoreDefaultClasses(importer);
          },
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
          this.captureOrRestoreDefaultClasses(importer);
          importer.parseOnce = true;
          importer.classes.elements.clear();
          for (const clsId of SHELL_IFC_TYPE_IDS) {
            importer.classes.elements.add(clsId);
          }
        },
      });
      await this.applyDefaultLodMode(shellModel);
      this.persistFragmentsBackground(shellCacheKey, shellModel);
      onProgress?.(70, "Shell interactive — streaming internal systems...", "shell");
      await onPhaseModelReady?.(shellModel, "shell");

      // Phase 2: Internal MEP, furnishings & accessories loaded asynchronously on demand
      const secondaryPromise = (async () => {
        try {
          const internalsModel = await ifcLoader.load(buffer, true, `${name}::internals`, {
            instanceCallback: (importer: FRAGS.IfcImporter) => {
              this.captureOrRestoreDefaultClasses(importer);
              importer.parseOnce = true;
              importer.classes.elements.clear();
              for (const clsId of INTERNAL_MEP_IFC_TYPE_IDS) {
                importer.classes.elements.add(clsId);
              }
            },
          });
          let hasItems = true;
          if (internalsModel && typeof internalsModel.getLocalIds === "function") {
            const ids = await internalsModel.getLocalIds().catch(() => []);
            hasItems = Array.isArray(ids) && ids.length > 0;
          }
          if (!internalsModel || !hasItems) {
            try {
              internalsModel?.dispose?.();
            } catch {}
            onProgress?.(100, "Shell model ready", "full");
            return null;
          }
          await this.applyDefaultLodMode(internalsModel);
          this.persistFragmentsBackground(internalsCacheKey, internalsModel);
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
