/**
 * CsvExportModal — Lets the user choose which 3D IFC metadata property to export as
 * `TaskName` (along with `MatchProperty`, 4D dates, and 5D costs) for seamless CSV round-trips.
 */

import { BimEngine } from "../core/BimEngine";
import { ScheduleManager } from "../modules/ScheduleManager";
import {
  collectLoadedModelElements,
  discoverModelMetaProperties,
  buildCsvGroupedByMetaProperty,
  type DiscoveredMetaProperty,
  type IndexableModelElement,
} from "../modules/CsvSchedulePropertyLinker";
import { escapeHtml } from "../utils/formatters";
import { showToast } from "./ToastManager";

export class CsvExportModal {
  private static instance: CsvExportModal | null = null;
  private modalEl: HTMLElement | null = null;
  private cachedElements: IndexableModelElement[] = [];
  private discoveredProps: DiscoveredMetaProperty[] = [];

  private constructor() {}

  public static getInstance(): CsvExportModal {
    if (!CsvExportModal.instance) {
      CsvExportModal.instance = new CsvExportModal();
    }
    return CsvExportModal.instance;
  }

  public async open(scheduleManager?: ScheduleManager): Promise<void> {
    this.ensureModalDom();
    if (!this.modalEl) return;

    const sm = scheduleManager ?? (window as any).scheduleManager ?? ScheduleManager.getInstance();
    const engine = BimEngine.getInstance();
    const activeModels =
      (engine.fragments as any)?.initialized && engine.fragments?.list
        ? Array.from(engine.fragments.list.entries())
        : [];

    this.cachedElements = await collectLoadedModelElements(activeModels);
    this.discoveredProps = discoverModelMetaProperties(this.cachedElements);

    this.populatePropertySelect(sm);
    this.updatePreview(sm);

    const downloadBtn = this.modalEl.querySelector<HTMLButtonElement>("#csv-export-btn-download");
    if (downloadBtn) {
      downloadBtn.onclick = () => this.handleDownload(sm);
    }

    this.modalEl.classList.remove("hidden");
  }

  public close(): void {
    this.modalEl?.classList.add("hidden");
  }

  private ensureModalDom(): void {
    const existing = document.getElementById("csv-export-modal");
    if (existing) {
      this.modalEl = existing;
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "csv-export-modal";
    overlay.className = "rb-modal-overlay hidden";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Export 4D/5D Schedule CSV");

    overlay.innerHTML = `
      <div class="rb-modal-card" style="width:min(520px, 95vw);">
        <div class="rb-modal-header">
          <div class="rb-modal-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            <span>Export 4D/5D Schedule CSV</span>
          </div>
          <button type="button" class="btn-icon-sm" id="csv-export-btn-close" title="Close">✕</button>
        </div>

        <div class="rb-modal-body thin-scrollbar">
          <div class="rb-section-label">Select Meta Property to Export as TaskName</div>
          <div style="font-size:0.66rem; color:var(--text-muted); line-height:1.4;">
            Choose any IFC metadata property from your loaded 3D model to populate the CSV <code>TaskName</code> and <code>MatchProperty</code> columns. When you edit dates &amp; costs and re-upload the CSV, elements will exact-match back to this property.
          </div>

          <input type="text" id="csv-export-prop-filter" class="gis-input" placeholder="Filter properties (e.g. Name, Storey, SIMULATION, Pset_)..." aria-label="Filter Meta Properties" />
          <select id="csv-export-prop-select" class="clash-status-select" style="width:100%; padding:0.4rem;" aria-label="Meta Property for TaskName"></select>

          <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.68rem; color:var(--text-muted); cursor:pointer; margin-top:0.2rem;">
            <input type="checkbox" id="csv-export-include-unassigned" checked style="accent-color:var(--accent, #d4ff3f);" />
            <span>Include elements missing this property as <code>Unassigned (&lt;Category&gt;)</code> rows</span>
          </label>
          <label style="display:flex; align-items:center; gap:0.4rem; font-size:0.68rem; color:var(--text-muted); cursor:pointer; margin-top:0.15rem;">
            <input type="checkbox" id="csv-export-include-ids" style="accent-color:var(--accent, #d4ff3f);" />
            <span>Also include explicit <code>ExpressIDs</code> column (unchecked = exact-match by property on re-import)</span>
          </label>

          <div class="rb-section-label" style="margin-top:0.45rem;">Preview of Exported TaskNames</div>
          <div id="csv-export-preview" class="rb-test-output"></div>
        </div>

        <div class="rb-modal-footer">
          <button type="button" id="csv-export-btn-cancel" class="btn-xs btn-outline">Cancel</button>
          <button type="button" id="csv-export-btn-download" class="btn-xs btn-accent">Download Schedule CSV</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modalEl = overlay;

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });
    overlay.querySelector("#csv-export-btn-close")?.addEventListener("click", () => this.close());
    overlay.querySelector("#csv-export-btn-cancel")?.addEventListener("click", () => this.close());
    overlay.querySelector("#csv-export-prop-filter")?.addEventListener("input", () => {
      const sm = (window as any).scheduleManager ?? ScheduleManager.getInstance();
      this.populatePropertySelect(sm);
      this.updatePreview(sm);
    });
    overlay.querySelector("#csv-export-prop-select")?.addEventListener("change", () => {
      const sm = (window as any).scheduleManager ?? ScheduleManager.getInstance();
      this.updatePreview(sm);
    });
  }

  private populatePropertySelect(sm: ScheduleManager): void {
    const sel = this.modalEl?.querySelector<HTMLSelectElement>("#csv-export-prop-select");
    if (!sel) return;
    const filter = (this.modalEl?.querySelector<HTMLInputElement>("#csv-export-prop-filter")?.value || "")
      .trim()
      .toLowerCase();
    const prevVal = sel.value;

    sel.innerHTML = "";
    const defaultOpt = document.createElement("option");
    defaultOpt.value = "";
    defaultOpt.textContent = `Default — Current Schedule Task Names (${sm.tasks.size} tasks)`;
    sel.appendChild(defaultOpt);

    const filtered = this.discoveredProps.filter(
      (p) => !filter || p.propertyName.toLowerCase().includes(filter)
    );

    for (const p of filtered) {
      const opt = document.createElement("option");
      opt.value = p.propertyName;
      opt.textContent = `${p.propertyName} (${p.uniqueValueCount} unique · ${p.elementCount} elements)`;
      sel.appendChild(opt);
    }

    if (prevVal && Array.from(sel.options).some((o) => o.value === prevVal)) {
      sel.value = prevVal;
    } else if (!filter && filtered.length > 0 && sm.tasks.size === 0) {
      sel.value = filtered[0].propertyName;
    }
  }

  private updatePreview(sm: ScheduleManager): void {
    const previewEl = this.modalEl?.querySelector<HTMLElement>("#csv-export-preview");
    const sel = this.modalEl?.querySelector<HTMLSelectElement>("#csv-export-prop-select");
    if (!previewEl || !sel) return;

    const chosen = sel.value;
    if (!chosen) {
      const names = Array.from(sm.tasks.values()).slice(0, 6).map((t) => t.name);
      previewEl.innerHTML =
        names.length > 0
          ? `<strong>${sm.tasks.size} task(s)</strong> from current schedule:<br/>${names.map((n) => `• ${escapeHtml(n)}`).join("<br/>")}`
          : "No tasks in schedule yet. Select a 3D model meta property above to generate a CSV template.";
      return;
    }

    const meta = this.discoveredProps.find((p) => p.propertyName === chosen);
    if (!meta) {
      previewEl.textContent = "No matching elements found for this property.";
      return;
    }
    const missingCount = Math.max(0, this.cachedElements.length - meta.elementCount);
    const missingLine =
      missingCount > 0
        ? `<br/><span style="color:#fbbf24;">⚠ ${missingCount} of ${this.cachedElements.length} model elements do not have <code>${escapeHtml(meta.propertyName)}</code> (included as Unassigned rows when checked above).</span>`
        : `<br/><span style="color:#34d399;">✓ 100% coverage (${meta.elementCount}/${this.cachedElements.length} elements).</span>`;
    previewEl.innerHTML = `<strong>${meta.uniqueValueCount} TaskName row(s)</strong> covering <strong>${meta.elementCount}</strong> 3D elements (<code>MatchProperty = ${escapeHtml(meta.propertyName)}</code>):<br/>${meta.sampleValues.map((v) => `• ${escapeHtml(v)}`).join("<br/>")}${meta.uniqueValueCount > meta.sampleValues.length ? `<br/><span style="color:var(--text-muted);">… +${meta.uniqueValueCount - meta.sampleValues.length} more</span>` : ""}${missingLine}`;
  }

  private handleDownload(sm: ScheduleManager): void {
    const sel = this.modalEl?.querySelector<HTMLSelectElement>("#csv-export-prop-select");
    const includeIds = Boolean(this.modalEl?.querySelector<HTMLInputElement>("#csv-export-include-ids")?.checked);
    const includeUnassigned = Boolean(
      this.modalEl?.querySelector<HTMLInputElement>("#csv-export-include-unassigned")?.checked ?? true
    );
    const metaProperty = sel?.value || "";

    const { csv, rowCount, elementCount, missingElementCount } = buildCsvGroupedByMetaProperty({
      scheduleManager: sm,
      elements: this.cachedElements,
      metaProperty,
      includeExpressIds: includeIds,
      includeUnassigned,
    });

    if (rowCount === 0) {
      showToast("No tasks or matching 3D elements to export. Load a model first.", "warning");
      return;
    }

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const propSlug = metaProperty ? `_${metaProperty.replace(/[^a-zA-Z0-9_-]/g, "_")}` : "";
    link.download = `4D_Schedule${propSlug}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.close();
    const missingNote =
      missingElementCount > 0
        ? includeUnassigned
          ? ` (incl. ${missingElementCount} unassigned)`
          : ` (${missingElementCount} missing prop skipped)`
        : "";
    showToast(
      metaProperty
        ? `Exported ${rowCount} CSV rows using "${metaProperty}" (${elementCount} elements${missingNote})`
        : `Exported ${rowCount} 4D/5D schedule rows to CSV!`,
      "success"
    );
  }
}
