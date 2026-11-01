/**
 * CameraSpeedController — Dynamic Camera Zoom & Dolly Speed Management Suite
 * Supports real-time speed acceleration/deceleration, precision presets,
 * keyboard hotkeys ([ / ] and - / +), programmatic zoom in/out,
 * localStorage persistence, and floating HUD notifications.
 */

import { SoundManager } from "./SoundManager";

export interface CameraSpeedPreset {
  speed: number;
  label: string;
  description: string;
}

export class CameraSpeedController {
  private static instance: CameraSpeedController | null = null;

  public static readonly MIN_SPEED = 0.1;
  public static readonly MAX_SPEED = 5.0;
  public static readonly DEFAULT_SPEED = 1.0;
  public static readonly STORAGE_KEY = "bim-camera-zoom-speed";

  public static readonly PRESETS: readonly CameraSpeedPreset[] = [
    { speed: 0.2, label: "0.2x Precision", description: "Fine MEP / Micro Elements" },
    { speed: 0.5, label: "0.5x Slow", description: "Detailed Inspection" },
    { speed: 1.0, label: "1.0x Standard", description: "Default 1:1 Navigation" },
    { speed: 2.0, label: "2.0x Fast", description: "Storey / Multi-discipline" },
    { speed: 4.0, label: "4.0x Turbo", description: "Campus / GIS Basemap" }
  ];

  private speed: number = CameraSpeedController.DEFAULT_SPEED;
  private world: any = null;
  private toastTimer: any = null;
  private initialized: boolean = false;

  private constructor() {
    this.loadPersistedSpeed();
  }

  public static getInstance(): CameraSpeedController {
    if (!CameraSpeedController.instance) {
      CameraSpeedController.instance = new CameraSpeedController();
    }
    return CameraSpeedController.instance;
  }

  private loadPersistedSpeed() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(CameraSpeedController.STORAGE_KEY);
        if (saved !== null) {
          const parsed = parseFloat(saved);
          if (!isNaN(parsed) && parsed >= CameraSpeedController.MIN_SPEED && parsed <= CameraSpeedController.MAX_SPEED) {
            this.speed = Math.round(parsed * 10) / 10;
          }
        }
      }
    } catch {
      // Fallback to default
      this.speed = CameraSpeedController.DEFAULT_SPEED;
    }
  }

  private saveSpeed() {
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(CameraSpeedController.STORAGE_KEY, this.speed.toFixed(1));
      }
    } catch {}
  }

  public init(world: any) {
    this.world = world;
    this.applySpeedToControls();
    this.bindUI();
    this.syncUI();
    this.initialized = true;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getSpeed(): number {
    return this.speed;
  }

  public getSpeedLabel(spd: number = this.speed): string {
    if (spd <= 0.3) return "Ultra Fine";
    if (spd <= 0.7) return "Precision";
    if (spd <= 1.4) return "Standard";
    if (spd <= 2.8) return "Fast";
    return "Turbo / GIS";
  }

  /**
   * Set speed value, clamp, apply to controls, sync UI and optionally notify.
   */
  public setSpeed(newSpeed: number, showToast: boolean = true): number {
    const clamped = Math.max(
      CameraSpeedController.MIN_SPEED,
      Math.min(CameraSpeedController.MAX_SPEED, newSpeed)
    );
    this.speed = Math.round(clamped * 10) / 10;
    this.saveSpeed();
    this.applySpeedToControls();
    this.syncUI();

    if (showToast) {
      this.showSpeedToast();
      try {
        SoundManager.getInstance().playClick();
      } catch {}
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("camera-speed-changed", {
          detail: { speed: this.speed, label: this.getSpeedLabel() }
        })
      );
    }

    return this.speed;
  }

  /**
   * Increase camera speed dynamically based on current tier.
   */
  public increaseSpeed(customStep?: number, showToast: boolean = true): number {
    let step = customStep;
    if (step === undefined) {
      if (this.speed < 0.5) step = 0.1;
      else if (this.speed < 2.0) step = 0.2;
      else step = 0.5;
    }
    return this.setSpeed(this.speed + step, showToast);
  }

  /**
   * Decrease camera speed dynamically based on current tier.
   */
  public decreaseSpeed(customStep?: number, showToast: boolean = true): number {
    let step = customStep;
    if (step === undefined) {
      if (this.speed <= 0.5) step = 0.1;
      else if (this.speed <= 2.0) step = 0.2;
      else step = 0.5;
    }
    return this.setSpeed(this.speed - step, showToast);
  }

  /**
   * Reset camera speed to 1.0x default
   */
  public resetSpeed(showToast: boolean = true): number {
    return this.setSpeed(CameraSpeedController.DEFAULT_SPEED, showToast);
  }

  /**
   * Smoothly zoom in camera along current view direction
   */
  public async zoomIn(delta: number = 2.5): Promise<void> {
    if (!this.world?.camera?.controls) return;
    try {
      const controls = this.world.camera.controls as any;
      const step = Math.max(0.5, delta * this.speed);
      if (typeof controls.dolly === "function") {
        await controls.dolly(step, true);
      }
      try {
        SoundManager.getInstance().playClick();
      } catch {}
    } catch (e) {
      console.warn("Camera zoomIn error:", e);
    }
  }

  /**
   * Smoothly zoom out camera away from current view direction
   */
  public async zoomOut(delta: number = 2.5): Promise<void> {
    if (!this.world?.camera?.controls) return;
    try {
      const controls = this.world.camera.controls as any;
      const step = Math.max(0.5, delta * this.speed);
      if (typeof controls.dolly === "function") {
        await controls.dolly(-step, true);
      }
      try {
        SoundManager.getInstance().playClick();
      } catch {}
    } catch (e) {
      console.warn("Camera zoomOut error:", e);
    }
  }

  /**
   * Apply speed to Three.js / ThatOpen CameraControls instance
   */
  public applySpeedToControls() {
    if (this.world?.camera?.controls) {
      const controls = this.world.camera.controls as any;
      controls.dollySpeed = this.speed;
      controls.zoomSpeed = this.speed;
    }
  }

  /**
   * Show floating non-intrusive HUD toast with current zoom speed
   */
  public showSpeedToast(customMessage?: string) {
    if (typeof document === "undefined") return;

    let toastEl = document.getElementById("camera-speed-toast");
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.id = "camera-speed-toast";
      toastEl.className = "camera-speed-toast";
      document.getElementById("app")?.appendChild(toastEl);
    }

    const textEl = document.getElementById("camera-speed-toast-text");
    const msg = customMessage || `Zoom Speed: ${this.speed.toFixed(1)}x · ${this.getSpeedLabel()}`;

    if (textEl) {
      textEl.textContent = msg;
    } else {
      toastEl.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span id="camera-speed-toast-text">${msg}</span>
      `;
    }

    toastEl.classList.remove("hidden");
    toastEl.classList.add("visible");

    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
    this.toastTimer = setTimeout(() => {
      toastEl?.classList.remove("visible");
      toastEl?.classList.add("hidden");
    }, 1400);
  }

  /**
   * Sync all UI sliders, badges, and preset pills across the app
   */
  public syncUI() {
    if (typeof document === "undefined") return;

    const formatted = `${this.speed.toFixed(1)}x`;

    // Right sidebar Scene tab
    const slider = document.getElementById("settings-camera-speed") as HTMLInputElement | null;
    if (slider && Number(slider.value) !== this.speed) {
      slider.value = this.speed.toString();
    }

    const valBadge = document.getElementById("val-camera-speed");
    if (valBadge) {
      valBadge.innerText = formatted;
    }

    // Canvas HUD indicator
    const hudBadge = document.getElementById("hud-camera-speed-val");
    if (hudBadge) {
      hudBadge.innerText = formatted;
    }

    // Scene & HUD preset buttons active state
    document.querySelectorAll<HTMLElement>("[data-speed]").forEach((btn) => {
      const btnSpeed = parseFloat(btn.getAttribute("data-speed") || "0");
      btn.classList.toggle("active", Math.abs(btnSpeed - this.speed) < 0.05);
    });
  }

  /**
   * Bind event listeners to DOM controls
   */
  private bindUI() {
    if (typeof document === "undefined") return;

    // 1. Right Sidebar Scene tab slider
    const cameraSpeedInput = document.getElementById("settings-camera-speed") as HTMLInputElement | null;
    if (cameraSpeedInput) {
      cameraSpeedInput.min = CameraSpeedController.MIN_SPEED.toString();
      cameraSpeedInput.max = CameraSpeedController.MAX_SPEED.toString();
      cameraSpeedInput.step = "0.1";
      cameraSpeedInput.value = this.speed.toString();

      cameraSpeedInput.addEventListener("input", () => {
        const val = Number(cameraSpeedInput.value);
        this.setSpeed(val, false);
      });
      cameraSpeedInput.addEventListener("change", () => {
        this.showSpeedToast();
      });
    }

    // 2. Right Sidebar Scene tab step buttons
    document.getElementById("btn-scene-speed-dec")?.addEventListener("click", () => {
      this.decreaseSpeed(0.1);
    });
    document.getElementById("btn-scene-speed-inc")?.addEventListener("click", () => {
      this.increaseSpeed(0.1);
    });

    // 3. Preset pills in Scene tab
    document.querySelectorAll("#scene-speed-presets .btn-speed-pill").forEach((pill) => {
      pill.addEventListener("click", (e) => {
        const spd = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-speed") || "1.0");
        this.setSpeed(spd);
      });
    });

    // 4. Viewport HUD Stepper (- / + buttons)
    document.getElementById("btn-zoom-speed-dec")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.decreaseSpeed();
    });
    document.getElementById("btn-zoom-speed-inc")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.increaseSpeed();
    });

    // 5. Direct Zoom In / Zoom Out buttons in HUD
    document.getElementById("btn-zoom-in")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.zoomIn();
    });
    document.getElementById("btn-zoom-out")?.addEventListener("click", (e) => {
      e.stopPropagation();
      this.zoomOut();
    });

    // 6. Viewport HUD speed badge dropdown toggle
    const badgeBtn = document.getElementById("btn-zoom-speed-badge");
    const dropdown = document.getElementById("zoom-speed-dropdown");

    if (badgeBtn && dropdown) {
      badgeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("hidden");
      });

      // Dismiss dropdown on outside click
      window.addEventListener("pointerdown", (e) => {
        if (!dropdown.classList.contains("hidden")) {
          const target = e.target as HTMLElement;
          if (!target.closest("#zoom-speed-stepper")) {
            dropdown.classList.add("hidden");
          }
        }
      });

      // Preset options inside dropdown
      dropdown.querySelectorAll(".zoom-preset-opt").forEach((opt) => {
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          const spd = parseFloat((e.currentTarget as HTMLElement).getAttribute("data-speed") || "1.0");
          this.setSpeed(spd);
          dropdown.classList.add("hidden");
        });
      });
    }
  }
}
