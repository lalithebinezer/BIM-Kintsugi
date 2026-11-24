/**
 * SplitScreenComparisonController — 4D Planned vs. Actual Side-by-Side Split-Screen Curtain
 *
 * Overlays a synchronized draggable split-screen divider (0%–100%) across the 3D viewport:
 *  - Left Pane: Planned Baseline Snapshot (captured in Planned 4D view at current camera & date)
 *  - Right Pane: Live Actual / Variance 3D Viewport (interactive orbit/pan/zoom)
 *  - Live side-by-side KPI comparison pills (Planned %, Actual %, Variance Days, SPI)
 *  - Automatic re-sync button & debounced refresh when timeline date changes.
 */

export interface SplitScreenTelemetry {
  dateLabel: string;
  plannedPct: number;
  actualPct: number;
  varianceDays: number;
  spi: number;
  delayedCount: number;
}

export interface SplitScreenCallbacks {
  getCanvas: () => HTMLCanvasElement | null;
  renderPlannedPass: () => Promise<SplitScreenTelemetry>;
  renderActualPass: () => Promise<SplitScreenTelemetry>;
  onClose?: () => Promise<void> | void;
}

export class SplitScreenComparisonController {
  private static instance: SplitScreenComparisonController | null = null;
  private overlay: HTMLDivElement | null = null;
  private leftImg: HTMLImageElement | null = null;
  private splitPct = 50;
  private active = false;
  private callbacks: SplitScreenCallbacks | null = null;

  public static getInstance(): SplitScreenComparisonController {
    if (!this.instance) this.instance = new SplitScreenComparisonController();
    return this.instance;
  }

  public isActive(): boolean {
    return this.active;
  }

  public getSplitPercent(): number {
    return this.splitPct;
  }

  public async toggle(callbacks: SplitScreenCallbacks): Promise<boolean> {
    if (this.active) {
      await this.close();
      return false;
    }
    await this.open(callbacks);
    return true;
  }

  public async open(callbacks: SplitScreenCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.active = true;
    this.ensureDom();
    this.overlay?.classList.remove("hidden");
    this.setSplitPercent(50);
    await this.refreshComparison();
  }

  public async close(): Promise<void> {
    this.active = false;
    this.overlay?.classList.add("hidden");
    await this.callbacks?.onClose?.();
  }

  public setSplitPercent(pct: number): void {
    this.splitPct = Math.max(5, Math.min(95, Math.round(pct * 10) / 10));
    if (!this.overlay) return;
    const leftClip = this.overlay.querySelector<HTMLElement>("#split-left-pane");
    const divider = this.overlay.querySelector<HTMLElement>("#split-divider-handle");
    if (leftClip) {
      leftClip.style.clipPath = `inset(0 ${100 - this.splitPct}% 0 0)`;
    }
    if (divider) {
      divider.style.left = `${this.splitPct}%`;
    }
  }

  public async refreshComparison(): Promise<void> {
    if (!this.active || !this.callbacks) return;
    const canvas = this.callbacks.getCanvas();
    const plannedStats = await this.callbacks.renderPlannedPass();

    // Wait 1 animation frame so WebGL flushes the planned pass before snapshot capture
    await new Promise((r) => requestAnimationFrame(r));
    if (canvas && this.leftImg) {
      try {
        this.leftImg.src = canvas.toDataURL("image/png");
      } catch {
        // Fallback if WebGL buffer is tainted or preserveDrawingBuffer is off
      }
    }

    const actualStats = await this.callbacks.renderActualPass();
    this.updateTelemetryBadges(plannedStats, actualStats);
  }

  private updateTelemetryBadges(planned: SplitScreenTelemetry, actual: SplitScreenTelemetry): void {
    if (!this.overlay) return;
    const leftMeta = this.overlay.querySelector("#split-planned-meta");
    const rightMeta = this.overlay.querySelector("#split-actual-meta");
    if (leftMeta) {
      leftMeta.textContent = `${planned.dateLabel} • ${Math.round(planned.plannedPct)}% Planned`;
    }
    if (rightMeta) {
      const sign = actual.varianceDays > 0 ? "+" : "";
      rightMeta.textContent = `${Math.round(actual.actualPct)}% Actual • SPI ${actual.spi.toFixed(2)} • ${sign}${actual.varianceDays}d (${actual.delayedCount} delayed)`;
    }
  }

  private ensureDom(): void {
    if (this.overlay) return;
    const root = document.createElement("div");
    root.id = "split-screen-4d-overlay";
    root.className = "split-screen-4d-overlay hidden";
    root.innerHTML = `
      <div id="split-left-pane" class="split-left-pane">
        <img id="split-left-snapshot" class="split-left-snapshot" alt="Planned Baseline 4D View" />
      </div>
      <div class="split-badge split-badge-left">
        <span class="split-dot planned"></span>
        <div>
          <div class="split-badge-title">PLANNED BASELINE</div>
          <div class="split-badge-sub" id="split-planned-meta">--</div>
        </div>
      </div>
      <div class="split-badge split-badge-right">
        <span class="split-dot actual"></span>
        <div>
          <div class="split-badge-title">ACTUAL / VARIANCE</div>
          <div class="split-badge-sub" id="split-actual-meta">--</div>
        </div>
        <button type="button" id="btn-split-resync" class="btn-secondary" style="font-size:0.65rem;padding:0.2rem 0.45rem;margin-left:0.35rem;" title="Re-sync baseline capture after orbiting camera">↻ Sync</button>
        <button type="button" id="btn-split-close" class="btn-secondary" style="font-size:0.65rem;padding:0.2rem 0.45rem;" title="Exit Split-Screen Comparison">✕</button>
      </div>
      <div id="split-divider-handle" class="split-divider-handle" role="slider" aria-label="Split-Screen Comparison Divider" aria-valuemin="5" aria-valuemax="95" aria-valuenow="50" tabindex="0">
        <div class="split-divider-knob">⇔</div>
      </div>
    `;
    document.body.appendChild(root);
    this.overlay = root;
    this.leftImg = root.querySelector("#split-left-snapshot");

    root.querySelector("#btn-split-close")?.addEventListener("click", () => this.close());
    root.querySelector("#btn-split-resync")?.addEventListener("click", () => this.refreshComparison());

    const handle = root.querySelector<HTMLElement>("#split-divider-handle");
    if (handle) {
      let dragging = false;
      handle.addEventListener("pointerdown", (ev: PointerEvent) => {
        dragging = true;
        handle.setPointerCapture?.(ev.pointerId);
        ev.preventDefault();
        ev.stopPropagation();
      });
      handle.addEventListener("pointermove", (ev: PointerEvent) => {
        if (!dragging) return;
        const pct = (ev.clientX / Math.max(1, window.innerWidth)) * 100;
        this.setSplitPercent(pct);
        handle.setAttribute("aria-valuenow", String(Math.round(this.splitPct)));
      });
      const stopDrag = (ev: PointerEvent) => {
        if (!dragging) return;
        dragging = false;
        handle.releasePointerCapture?.(ev.pointerId);
      };
      handle.addEventListener("pointerup", stopDrag);
      handle.addEventListener("pointercancel", stopDrag);
      handle.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "ArrowLeft") this.setSplitPercent(this.splitPct - 5);
        if (ev.key === "ArrowRight") this.setSplitPercent(this.splitPct + 5);
      });
    }
  }
}
