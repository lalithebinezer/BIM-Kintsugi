/**
 * Cascade4DController — Encapsulates CasCADe 4D Visual Analytics Lens & 4D-Synced
 * Workspace Congestion (SLF) UI controls, lazy-loading heavy analytics/overlay modules
 * only when activated.
 */

import type { ScheduleTask } from "../modules/ScheduleManager";
import type { CascadeIndicatorId, ColorBrewerSchemeName } from "../modules/Cascade4DAnalytics";
import { escapeHtml } from "../utils/formatters";
import { showToast } from "./ToastManager";

export interface Cascade4DControllerCallbacks {
  is4dMode: () => boolean;
  onRequestVisualRefresh: (force: boolean) => void;
  onDisableVarianceMode: () => void;
}

export class Cascade4DController {
  private static instance: Cascade4DController | null = null;

  public isCascadeMode = false;
  public cascadeIndicator: CascadeIndicatorId = "totalSlack";
  public cascadeScheme: ColorBrewerSchemeName = "RdYlGn";
  public cascadeIsolatedBand: number | null = null;
  public cascadeShowCrit = true;
  public cascadeShowPredSuc = false;
  public cascadeShowOos = true;
  public is4dSlfSyncActive = false;

  private callbacks: Cascade4DControllerCallbacks | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): Cascade4DController {
    if (!Cascade4DController.instance) {
      Cascade4DController.instance = new Cascade4DController();
    }
    return Cascade4DController.instance;
  }

  public init(callbacks: Cascade4DControllerCallbacks): void {
    this.callbacks = callbacks;
    if (this.initialized) return;
    this.initialized = true;

    (window as any).set4dSlfSync = (active: boolean) => this.set4dSlfSync(active);

    document.getElementById("btn-4d-slf-toggle")?.addEventListener("click", () => {
      this.set4dSlfSync(!this.is4dSlfSyncActive);
      showToast(
        this.is4dSlfSyncActive ? "4D Workspace SLF Congestion Zones active" : "4D SLF Zones cleared",
        this.is4dSlfSyncActive ? "info" : "success"
      );
    });

    document.getElementById("cascade-chk-crit")?.addEventListener("change", (e) => {
      this.cascadeShowCrit = (e.target as HTMLInputElement).checked;
      this.callbacks?.onRequestVisualRefresh(true);
    });
    document.getElementById("cascade-chk-predsuc")?.addEventListener("change", (e) => {
      this.cascadeShowPredSuc = (e.target as HTMLInputElement).checked;
      this.callbacks?.onRequestVisualRefresh(true);
    });
    document.getElementById("cascade-chk-oos")?.addEventListener("change", (e) => {
      this.cascadeShowOos = (e.target as HTMLInputElement).checked;
      this.callbacks?.onRequestVisualRefresh(true);
    });

    document.getElementById("btn-4d-cascade-toggle")?.addEventListener("click", async () => {
      const next = !this.isCascadeMode;
      if (next) {
        this.callbacks?.onDisableVarianceMode();
        await this.ensureDropdownOptionsPopulated();
      }
      await this.setCascadeMode(next);
      showToast(
        next ? `CasCADe Lens ON (${this.cascadeIndicator} / ${this.cascadeScheme})` : "CasCADe 4D Lens OFF",
        next ? "info" : "success"
      );
      this.callbacks?.onRequestVisualRefresh(true);
    });

    document.getElementById("btn-close-cascade-panel")?.addEventListener("click", async () => {
      await this.setCascadeMode(false);
      this.callbacks?.onRequestVisualRefresh(true);
    });
  }

  private async ensureDropdownOptionsPopulated(): Promise<void> {
    const indSelect = document.getElementById("cascade-indicator-select") as HTMLSelectElement | null;
    const schSelect = document.getElementById("cascade-scheme-select") as HTMLSelectElement | null;
    if ((!indSelect || indSelect.options.length > 0) && (!schSelect || schSelect.options.length > 0)) {
      return;
    }
    const { CASCADE_INDICATORS, COLORBREWER_SCHEMES } = await import("../modules/Cascade4DAnalytics");
    if (indSelect && indSelect.options.length === 0) {
      CASCADE_INDICATORS.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.label;
        if (m.id === this.cascadeIndicator) opt.selected = true;
        indSelect.appendChild(opt);
      });
      indSelect.addEventListener("change", () => {
        this.cascadeIndicator = indSelect.value as CascadeIndicatorId;
        this.cascadeIsolatedBand = null;
        this.callbacks?.onRequestVisualRefresh(true);
      });
    }
    if (schSelect && schSelect.options.length === 0) {
      (Object.keys(COLORBREWER_SCHEMES) as ColorBrewerSchemeName[]).forEach((name) => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        if (name === this.cascadeScheme) opt.selected = true;
        schSelect.appendChild(opt);
      });
      schSelect.addEventListener("change", () => {
        this.cascadeScheme = schSelect.value as ColorBrewerSchemeName;
        this.callbacks?.onRequestVisualRefresh(true);
      });
    }
  }

  public getVisualKeySegment(activeGanttId: string): string {
    const cPart = this.isCascadeMode
      ? `C:${this.cascadeIndicator}:${this.cascadeScheme}:${this.cascadeIsolatedBand ?? "all"}:${this.cascadeShowCrit}:${this.cascadeShowPredSuc}:${this.cascadeShowOos}:${activeGanttId}`
      : "";
    const slfPart = this.is4dSlfSyncActive ? "SLF1" : "SLF0";
    return `${cPart}|${slfPart}`;
  }

  public async setCascadeMode(active: boolean): Promise<void> {
    this.isCascadeMode = active;
    const btn = document.getElementById("btn-4d-cascade-toggle");
    const panel = document.getElementById("cascade-4d-panel");
    btn?.classList.toggle("active", active);
    panel?.classList.toggle("hidden", !active);
    if (active) {
      await this.ensureDropdownOptionsPopulated();
    } else {
      this.cascadeIsolatedBand = null;
      const { DependencyVectorOverlay } = await import("../modules/DependencyVectorOverlay");
      DependencyVectorOverlay.getInstance().clear();
    }
  }

  public set4dSlfSync(active: boolean): void {
    this.is4dSlfSyncActive = active;
    const btn = document.getElementById("btn-4d-slf-toggle");
    const badge = document.getElementById("timeline-slf-badge");
    const chk = document.getElementById("clash-sync-4d-slf") as HTMLInputElement | null;
    btn?.classList.toggle("active", active);
    if (chk && chk.checked !== active) chk.checked = active;
    if (!active) {
      void import("../modules/WorkspaceCongestionAnalyzer").then(({ WorkspaceCongestionAnalyzer }) => {
        WorkspaceCongestionAnalyzer.getInstance().clearOverlays();
      });
      if (badge) badge.textContent = "4D SLF";
    } else if (this.callbacks?.is4dMode()) {
      this.callbacks.onRequestVisualRefresh(true);
    }
  }

  public async syncSlfForDate(tasksList: ScheduleTask[], dateMs: number): Promise<void> {
    if (!this.is4dSlfSyncActive || tasksList.length === 0) return;
    const { WorkspaceCongestionAnalyzer } = await import("../modules/WorkspaceCongestionAnalyzer");
    const { peak, points } = await WorkspaceCongestionAnalyzer.getInstance().syncOverlaysForDate(tasksList, dateMs);
    const badge = document.getElementById("timeline-slf-badge");
    if (badge) {
      badge.textContent = peak ? `SLF ${peak.slf.toFixed(2)} (${peak.status})` : "4D SLF";
    }
    const summaryEl = document.getElementById("clash-slf-summary");
    if (summaryEl && points.length > 0) {
      summaryEl.classList.remove("hidden");
      summaryEl.innerHTML = points
        .sort((a, b) => b.slf - a.slf)
        .slice(0, 4)
        .map((p) => {
          const color = p.status === "Extreme" ? "#ef4444" : p.status === "Moderate" ? "#f59e0b" : "#10b981";
          return `<span style="margin-right:8px;"><strong style="color:${color};">${escapeHtml(p.storey)}</strong> SLF=${p.slf.toFixed(2)} (${p.status})</span>`;
        })
        .join("");
    }
  }

  public async renderCascadeFrame(params: {
    tasksList: ScheduleTask[];
    fragments: any;
    hider: any;
    highlighter: any;
    keepStyles: Set<string>;
    clearAll4DHighlights: (keep?: Set<string>) => Promise<void>;
    activeGanttTaskId: string | null;
  }): Promise<void> {
    const { evaluateCascadeLens } = await import("../modules/Cascade4DAnalytics");
    const evalRes = evaluateCascadeLens(params.tasksList, {
      indicator: this.cascadeIndicator,
      scheme: this.cascadeScheme,
      isolatedBandIndex: this.cascadeIsolatedBand,
    });

    const legendContainer = document.getElementById("cascade-legend-bands");
    if (legendContainer) {
      legendContainer.innerHTML = evalRes.bands
        .map(
          (b) => `
          <button type="button" class="cascade-band-chip ${this.cascadeIsolatedBand === b.bandIndex ? "isolated" : ""}" data-band="${b.bandIndex}" title="Click to isolate this range">
            <span class="cascade-band-swatch" style="background:${b.hex};"></span>
            <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(b.rangeLabel)} (${b.elementCount})</span>
          </button>`
        )
        .join("");
      legendContainer.querySelectorAll<HTMLButtonElement>(".cascade-band-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const bIdx = Number(chip.dataset.band);
          this.cascadeIsolatedBand = this.cascadeIsolatedBand === bIdx ? null : bIdx;
          this.callbacks?.onRequestVisualRefresh(true);
        });
      });
    }

    if ((params.fragments as any)?.initialized && params.fragments.list.size > 0) {
      await params.hider.set(true);
      if (!this.callbacks?.is4dMode()) return;

      for (const band of evalRes.bands) {
        const styleId = `cascade-band-${band.bandIndex}`;
        const st = params.highlighter.styles.get(styleId);
        if (st) st.color.set(band.hex);
        if (band.elementCount > 0) {
          params.keepStyles.add(styleId);
          await params.highlighter.highlightByID(styleId, band.modelIdMap, true, false);
        }
      }

      if (evalRes.isolatedBandIndex !== null && Object.keys(evalRes.ghostMap).length > 0) {
        params.keepStyles.add("audit-ghost");
        await params.highlighter.highlightByID("audit-ghost", evalRes.ghostMap, true, false);
      }

      await params.clearAll4DHighlights(params.keepStyles);
      if (!this.callbacks?.is4dMode()) return;

      const { DependencyVectorOverlay } = await import("../modules/DependencyVectorOverlay");
      await DependencyVectorOverlay.getInstance().render(params.tasksList, {
        showCriticalPath: this.cascadeShowCrit,
        showPredSucc: this.cascadeShowPredSuc,
        showOutOfSequence: this.cascadeShowOos,
        activeTaskId: params.activeGanttTaskId,
      });
    }
  }

  public async clearOnExit4D(): Promise<void> {
    if (this.isCascadeMode) {
      await this.setCascadeMode(false);
    }
    if (this.is4dSlfSyncActive) {
      this.set4dSlfSync(false);
    }
    const [{ DependencyVectorOverlay }, { WorkspaceCongestionAnalyzer }] = await Promise.all([
      import("../modules/DependencyVectorOverlay"),
      import("../modules/WorkspaceCongestionAnalyzer"),
    ]);
    DependencyVectorOverlay.getInstance().clear();
    WorkspaceCongestionAnalyzer.getInstance().clearOverlays();
  }
}
