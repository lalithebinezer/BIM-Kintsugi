/**
 * MobileGpuAdaptiveController — Adaptive Pixel Ratio & Interaction Throttling for Mobile GPUs
 *
 * Keeps 3D navigation at a smooth 60 FPS on phones while preventing thermal throttling:
 *  - On phones (<= 767px or phone landscape): caps resting pixelRatio at `Math.min(dpr, 1.5)`
 *  - During active touch orbit/pinch (`controlstart` -> `controlend` + 180ms): lowers DPR to `1.0`
 *    and temporarily suspends heavy postproduction AO passes, restoring smoothly on gesture end
 *  - On desktop / tablet (>= 768px): keeps full crisp `Math.min(dpr, 2)` untouched
 */

export interface AdaptiveGpuWorldLike {
  renderer?: {
    three?: {
      setPixelRatio: (ratio: number) => void;
      getPixelRatio?: () => number;
    };
    postproduction?: {
      enabled: boolean;
      customEffects?: { outlineEnabled?: boolean };
    };
  };
  camera?: {
    controls?: {
      addEventListener?: (event: string, cb: () => void) => void;
      removeEventListener?: (event: string, cb: () => void) => void;
    };
  };
}

export interface AdaptiveGpuOptions {
  mobileQuery?: string;
  mobileRestCap?: number;
  mobileInteractCap?: number;
  desktopCap?: number;
  restoreDelayMs?: number;
}

const DEFAULT_MOBILE_QUERY = "(max-width: 767px), (max-height: 460px) and (max-width: 932px)";

export class MobileGpuAdaptiveController {
  private world: AdaptiveGpuWorldLike;
  private opts: Required<AdaptiveGpuOptions>;
  private interacting = false;
  private restoreTimer: ReturnType<typeof setTimeout> | null = null;
  private savedPostprodEnabled: boolean | null = null;
  private mql: MediaQueryList | null = null;
  private disposed = false;

  constructor(world: AdaptiveGpuWorldLike, options: AdaptiveGpuOptions = {}) {
    this.world = world;
    this.opts = {
      mobileQuery: options.mobileQuery ?? DEFAULT_MOBILE_QUERY,
      mobileRestCap: options.mobileRestCap ?? 1.5,
      mobileInteractCap: options.mobileInteractCap ?? 1.0,
      desktopCap: options.desktopCap ?? 2,
      restoreDelayMs: options.restoreDelayMs ?? 180,
    };
    this.bind();
    this.applyPixelRatio();
  }

  public isMobileViewport(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(this.opts.mobileQuery).matches;
  }

  public computeTargetPixelRatio(devicePixelRatio?: number): number {
    const dpr = Math.max(1, devicePixelRatio ?? (typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1));
    if (!this.isMobileViewport()) {
      return Math.min(dpr, this.opts.desktopCap);
    }
    const cap = this.interacting ? this.opts.mobileInteractCap : this.opts.mobileRestCap;
    return Math.min(dpr, cap);
  }

  public applyPixelRatio(): number {
    const ratio = this.computeTargetPixelRatio();
    try {
      this.world.renderer?.three?.setPixelRatio(ratio);
    } catch {
      /* headless/mock renderer */
    }
    return ratio;
  }

  public onControlStart = (): void => {
    if (this.disposed || !this.isMobileViewport()) return;
    if (this.restoreTimer !== null) {
      clearTimeout(this.restoreTimer);
      this.restoreTimer = null;
    }
    if (!this.interacting) {
      this.interacting = true;
      const pp = this.world.renderer?.postproduction;
      if (pp && typeof pp.enabled === "boolean" && pp.enabled) {
        this.savedPostprodEnabled = true;
        pp.enabled = false;
      }
      this.applyPixelRatio();
    }
  };

  public onControlEnd = (): void => {
    if (this.disposed || !this.interacting) return;
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.restoreTimer = setTimeout(() => {
      this.restoreTimer = null;
      this.interacting = false;
      if (this.savedPostprodEnabled && this.world.renderer?.postproduction) {
        this.world.renderer.postproduction.enabled = true;
      }
      this.savedPostprodEnabled = null;
      this.applyPixelRatio();
    }, this.opts.restoreDelayMs);
  };

  private onViewportChange = (): void => {
    if (this.disposed) return;
    if (!this.isMobileViewport()) {
      this.interacting = false;
      if (this.savedPostprodEnabled && this.world.renderer?.postproduction) {
        this.world.renderer.postproduction.enabled = true;
        this.savedPostprodEnabled = null;
      }
    }
    this.applyPixelRatio();
  };

  private bind(): void {
    const controls = this.world.camera?.controls;
    controls?.addEventListener?.("controlstart", this.onControlStart);
    controls?.addEventListener?.("controlend", this.onControlEnd);
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      this.mql = window.matchMedia(this.opts.mobileQuery);
      this.mql.addEventListener?.("change", this.onViewportChange);
    }
  }

  public dispose(): void {
    this.disposed = true;
    if (this.restoreTimer !== null) clearTimeout(this.restoreTimer);
    this.world.camera?.controls?.removeEventListener?.("controlstart", this.onControlStart);
    this.world.camera?.controls?.removeEventListener?.("controlend", this.onControlEnd);
    this.mql?.removeEventListener?.("change", this.onViewportChange);
  }
}
