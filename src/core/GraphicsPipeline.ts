import * as THREE from "three";

export type RenderBackendType = "webgl2" | "webgl" | "webgpu-ready";
export type GraphicsQualityTier = "ultra" | "balanced" | "efficiency";

export interface GpuCapabilitiesReport {
  activeBackend: RenderBackendType;
  webgpuSupported: boolean;
  webgpuAdapterInfo: string | null;
  experimentalWebGpuOptIn: boolean;
  webgl2Supported: boolean;
  hardwareOcclusionSupported: boolean;
  maxTextureSize: number;
  maxSamples: number;
  devicePixelRatioApplied: number;
  qualityTier: GraphicsQualityTier;
}

/**
 * Abstracts hardware acceleration probing (WebGPU availability + WebGL2 extensions),
 * adaptive DPR scaling, demand-driven shadow updates, and quality tiers.
 */
export class GraphicsPipeline {
  private static instance: GraphicsPipeline | null = null;
  private static readonly WEBGPU_STORAGE_KEY = "bim_experimental_webgpu";
  private qualityTier: GraphicsQualityTier = "balanced";
  private webgpuSupported: boolean = false;
  private webgpuAdapterInfo: string | null = null;
  private experimentalWebGpuOptIn: boolean = false;
  private renderer: THREE.WebGLRenderer | null = null;
  private probed: boolean = false;

  private constructor() {
    try {
      if (typeof localStorage !== "undefined") {
        this.experimentalWebGpuOptIn = localStorage.getItem(GraphicsPipeline.WEBGPU_STORAGE_KEY) === "true";
      }
    } catch {}
  }

  public setExperimentalWebGpu(enabled: boolean): boolean {
    this.experimentalWebGpuOptIn = Boolean(enabled);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(GraphicsPipeline.WEBGPU_STORAGE_KEY, this.experimentalWebGpuOptIn ? "true" : "false");
      }
    } catch {}
    return this.experimentalWebGpuOptIn;
  }

  public isExperimentalWebGpuEnabled(): boolean {
    return this.experimentalWebGpuOptIn;
  }

  public getBackendDisplayLabel(): string {
    const report = this.getCapabilitiesReport();
    if (report.webgpuSupported && report.experimentalWebGpuOptIn) {
      return `WebGPU Ready (${report.webgpuAdapterInfo || "Adapter"}) · WebGL2 Active`;
    }
    if (report.webgpuSupported) {
      return report.webgl2Supported ? "WebGL 2.0 (WebGPU Capable)" : "WebGL 1.0 (WebGPU Capable)";
    }
    return report.webgl2Supported ? "WebGL 2.0 (Fallback)" : "WebGL 1.0";
  }

  public static getInstance(): GraphicsPipeline {
    if (!GraphicsPipeline.instance) {
      GraphicsPipeline.instance = new GraphicsPipeline();
    }
    return GraphicsPipeline.instance;
  }

  public attachRenderer(renderer: THREE.WebGLRenderer | null | undefined) {
    if (!renderer) return;
    this.renderer = renderer;
    this.applyQualityTier(this.detectDefaultTier());
  }

  public detectDefaultTier(): GraphicsQualityTier {
    if (typeof window === "undefined") return "balanced";
    const width = window.innerWidth || 1440;
    const hwConcurrency = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    if (width <= 1080 || hwConcurrency <= 4) {
      return width <= 640 ? "efficiency" : "balanced";
    }
    return "ultra";
  }

  /**
   * Probes browser `navigator.gpu` WebGPU support without interrupting active WebGL2 fragment passes.
   */
  public async probeHardware(options?: { force?: boolean }): Promise<GpuCapabilitiesReport> {
    if ((!this.probed || options?.force) && typeof navigator !== "undefined" && "gpu" in navigator) {
      try {
        const adapter = await (navigator as any).gpu?.requestAdapter?.({
          powerPreference: "high-performance",
        });
        if (adapter) {
          this.webgpuSupported = true;
          const info = adapter.info || (await adapter.requestAdapterInfo?.().catch(() => null));
          this.webgpuAdapterInfo = info
            ? [info.vendor, info.architecture, info.description].filter(Boolean).join(" • ") || "WebGPU Adapter Ready"
            : "WebGPU Adapter Ready";
        } else {
          this.webgpuSupported = false;
        }
      } catch {
        this.webgpuSupported = false;
      }
      this.probed = true;
    } else {
      this.probed = true;
    }

    return this.getCapabilitiesReport();
  }

  /**
   * Tunes renderer DPR, shadow map cadence, and shader anti-aliasing for the selected quality tier.
   */
  public applyQualityTier(tier: GraphicsQualityTier) {
    this.qualityTier = tier;
    if (!this.renderer) return;

    const nativeDpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    let targetDpr = 1;
    if (tier === "ultra") {
      targetDpr = Math.min(nativeDpr, 2.0);
    } else if (tier === "balanced") {
      targetDpr = Math.min(nativeDpr, 1.5);
    } else {
      targetDpr = Math.min(nativeDpr, 1.15);
    }

    try {
      this.renderer.setPixelRatio(targetDpr);
      // Demand-driven shadow updates avoid re-rendering expensive shadow maps on static camera ticks
      this.renderer.shadowMap.autoUpdate = false;
      this.renderer.shadowMap.needsUpdate = true;
    } catch {}
  }

  public requestShadowRefresh() {
    if (this.renderer?.shadowMap) {
      this.renderer.shadowMap.needsUpdate = true;
    }
  }

  public getQualityTier(): GraphicsQualityTier {
    return this.qualityTier;
  }

  public getCapabilitiesReport(): GpuCapabilitiesReport {
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null = null;
    try {
      gl = this.renderer?.getContext?.() || null;
    } catch {}

    const isWebGL2 =
      typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

    const maxTextureSize = this.renderer?.capabilities?.maxTextureSize ?? 4096;
    const maxSamples = (this.renderer?.capabilities as any)?.maxSamples ?? 0;

    return {
      activeBackend: this.webgpuSupported ? "webgpu-ready" : isWebGL2 ? "webgl2" : "webgl",
      webgpuSupported: this.webgpuSupported,
      webgpuAdapterInfo: this.webgpuAdapterInfo,
      experimentalWebGpuOptIn: this.experimentalWebGpuOptIn,
      webgl2Supported: isWebGL2,
      hardwareOcclusionSupported: isWebGL2 && typeof (gl as any)?.createQuery === "function",
      maxTextureSize,
      maxSamples,
      devicePixelRatioApplied: this.renderer?.getPixelRatio?.() ?? 1,
      qualityTier: this.qualityTier,
    };
  }
}
