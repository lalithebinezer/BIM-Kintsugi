import { escapeHtml } from "../utils/formatters";

export interface MetadataSummaryPayload {
  modelId: string;
  expressId: number;
  entityName: string;
  nameVal: string;
  guid?: string;
  storeyName?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
    volume: string;
  };
  psets?: Record<string, Record<string, any>>;
}

function notifyToast(msg: string, type: "info" | "success" | "warning" = "info") {
  if (typeof (window as any).showToast === "function") {
    (window as any).showToast(msg, type);
  }
}

export class MetadataPanelController {
  private static instance: MetadataPanelController | null = null;
  private initialized = false;
  private currentSummary: MetadataSummaryPayload | null = null;

  private constructor() {}

  public static getInstance(): MetadataPanelController {
    if (!MetadataPanelController.instance) {
      MetadataPanelController.instance = new MetadataPanelController();
    }
    return MetadataPanelController.instance;
  }

  public init() {
    if (typeof document === "undefined" || this.initialized) return;
    this.initialized = true;

    const searchInput = document.getElementById("metadata-search-input") as HTMLInputElement | null;
    const clearSearchBtn = document.getElementById("btn-clear-meta-search");

    searchInput?.addEventListener("input", () => {
      const q = searchInput.value;
      clearSearchBtn?.classList.toggle("hidden", q.trim().length === 0);
      this.applyFilter(q);
    });

    clearSearchBtn?.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      clearSearchBtn.classList.add("hidden");
      this.applyFilter("");
      searchInput?.focus();
    });

    document.getElementById("btn-meta-toggle-all")?.addEventListener("click", () => {
      this.toggleAllAccordions();
    });

    document.getElementById("btn-copy-meta-guid")?.addEventListener("click", () => {
      const guid = this.currentSummary?.guid;
      if (!guid) {
        notifyToast("No GlobalId available for this element", "warning");
        return;
      }
      this.copyText(guid, `Copied GUID: ${guid}`);
    });

    document.getElementById("btn-copy-metadata-json")?.addEventListener("click", () => {
      this.copyCurrentMetadataAsJson();
    });

    document.getElementById("btn-meta-focus")?.addEventListener("click", () => {
      document.getElementById("btn-focus")?.click();
    });

    document.getElementById("btn-meta-isolate")?.addEventListener("click", () => {
      document.getElementById("btn-isolate")?.click();
    });

    document.getElementById("btn-meta-cost")?.addEventListener("click", () => {
      (window as any).switchSidebarTab?.("right-tab-bar", "inspector");
    });

    document.getElementById("btn-meta-open-inspect")?.addEventListener("click", () => {
      (window as any).switchSidebarTab?.("right-tab-bar", "inspector");
    });

    document.getElementById("btn-inspector-open-meta")?.addEventListener("click", () => {
      (window as any).switchSidebarTab?.("right-tab-bar", "metadata");
    });

    document.getElementById("btn-metadata-clear-selection")?.addEventListener("click", () => {
      (window as any).clearAllSelections?.();
    });

    document.getElementById("btn-metadata-param-reader")?.addEventListener("click", () => {
      document.getElementById("btn-inspector-param-reader")?.click();
    });

    document.getElementById("btn-meta-empty-params")?.addEventListener("click", () => {
      document.getElementById("btn-inspector-param-reader")?.click();
    });

    document.getElementById("btn-meta-empty-search")?.addEventListener("click", () => {
      const overlay = (window as any).globalSearchOverlay;
      if (overlay && typeof overlay.open === "function") {
        overlay.open();
      } else {
        document.getElementById("btn-global-search")?.click();
      }
    });

    // Delegate click-to-copy on any property row value inside #element-metadata-table
    const tableEl = document.getElementById("element-metadata-table");
    tableEl?.addEventListener("click", (e) => {
      const target = e.target as HTMLElement | null;
      if (!target || target.closest("button")) return;
      const row = target.closest(".prop-row") as HTMLElement | null;
      if (!row) return;
      const label = row.querySelector(".prop-label")?.textContent?.trim() || "Property";
      const val = row.querySelector(".prop-val")?.textContent?.trim() || "";
      if (!val || val === "-") return;
      this.copyText(val, `Copied ${label}: ${val}`);
    });
  }

  public createAccordionGroup(
    title: string,
    accentClass: string = "",
    openByDefault: boolean = true,
    badgeText?: string
  ): { details: HTMLDetailsElement; content: HTMLDivElement } {
    const details = document.createElement("details");
    details.className = `meta-accordion ${accentClass}`.trim();
    details.open = openByDefault;

    const summary = document.createElement("summary");
    summary.className = "meta-accordion-summary";
    summary.innerHTML = `
      <span class="meta-acc-title">${escapeHtml(title)}</span>
      ${badgeText ? `<span class="meta-acc-badge">${escapeHtml(badgeText)}</span>` : ""}
    `;

    const content = document.createElement("div");
    content.className = "meta-accordion-body";

    details.appendChild(summary);
    details.appendChild(content);
    return { details, content };
  }

  public setSelectedElementState(payload: MetadataSummaryPayload) {
    this.init();
    this.currentSummary = payload;

    const emptyMeta = document.getElementById("metadata-empty-state");
    const selectedMeta = document.getElementById("metadata-selected-state");
    if (emptyMeta) emptyMeta.style.display = "none";
    if (selectedMeta) selectedMeta.style.display = "flex";

    const escMetaBtn = document.getElementById("btn-metadata-clear-selection");
    if (escMetaBtn) escMetaBtn.style.display = "inline-flex";

    const entityEl = document.getElementById("meta-hero-entity");
    const storeyEl = document.getElementById("meta-hero-storey");
    const nameEl = document.getElementById("meta-hero-name");
    const idEl = document.getElementById("meta-hero-id");
    const guidEl = document.getElementById("meta-hero-guid");
    const guidBtn = document.getElementById("btn-copy-meta-guid") as HTMLButtonElement | null;

    if (entityEl) entityEl.textContent = payload.entityName || "IFCELEMENT";
    if (storeyEl) {
      storeyEl.textContent = payload.storeyName || "All Storeys";
      storeyEl.classList.toggle("hidden", !payload.storeyName);
    }
    if (nameEl) nameEl.textContent = payload.nameVal || `Element #${payload.expressId}`;
    if (idEl) idEl.textContent = `#${payload.expressId}`;
    if (guidEl) guidEl.textContent = payload.guid || "No GlobalId";
    if (guidBtn) guidBtn.disabled = !payload.guid;

    // Update companion banner inside 4D/5D INSPECT tab
    const bannerEl = document.getElementById("inspector-element-banner");
    const bannerNameEl = document.getElementById("inspector-banner-title");
    if (bannerEl) bannerEl.classList.remove("hidden");
    if (bannerNameEl) {
      bannerNameEl.textContent = `${payload.entityName}: ${payload.nameVal} (#${payload.expressId})`;
    }

    // Re-apply active search query if user already typed a filter
    const searchInput = document.getElementById("metadata-search-input") as HTMLInputElement | null;
    this.applyFilter(searchInput?.value || "");
    this.syncToggleAllLabel();
  }

  public reset() {
    this.currentSummary = null;

    const emptyMeta = document.getElementById("metadata-empty-state");
    const selectedMeta = document.getElementById("metadata-selected-state");
    if (emptyMeta) emptyMeta.style.display = "flex";
    if (selectedMeta) selectedMeta.style.display = "none";

    const escMetaBtn = document.getElementById("btn-metadata-clear-selection");
    if (escMetaBtn) escMetaBtn.style.display = "none";

    const bannerEl = document.getElementById("inspector-element-banner");
    if (bannerEl) bannerEl.classList.add("hidden");

    const searchInput = document.getElementById("metadata-search-input") as HTMLInputElement | null;
    if (searchInput) searchInput.value = "";
    document.getElementById("btn-clear-meta-search")?.classList.add("hidden");

    const countEl = document.getElementById("meta-filter-count");
    if (countEl) countEl.textContent = "";
    const noMatchEl = document.getElementById("meta-no-filter-matches");
    if (noMatchEl) noMatchEl.style.display = "none";
  }

  public applyFilter(rawQuery: string) {
    if (typeof document === "undefined") return;
    const q = String(rawQuery || "").trim().toLowerCase();
    const tableEl = document.getElementById("element-metadata-table");
    const countEl = document.getElementById("meta-filter-count");
    if (!tableEl) return;

    const rows = Array.from(tableEl.querySelectorAll<HTMLElement>(".prop-row"));
    let matched = 0;

    for (const row of rows) {
      const label = row.querySelector(".prop-label")?.textContent?.toLowerCase() || "";
      const val = row.querySelector(".prop-val")?.textContent?.toLowerCase() || "";
      const hit = !q || label.includes(q) || val.includes(q);
      row.style.display = hit ? "flex" : "none";
      if (hit) matched++;
    }

    const accordions = Array.from(tableEl.querySelectorAll<HTMLDetailsElement>(".meta-accordion"));
    for (const acc of accordions) {
      const accTitle = acc.querySelector(".meta-acc-title")?.textContent?.toLowerCase() || "";
      const accRows = Array.from(acc.querySelectorAll<HTMLElement>(".prop-row"));
      const anyRowHit = accRows.some((r) => r.style.display !== "none");
      const titleHit = Boolean(q && accTitle.includes(q));
      if (titleHit && !anyRowHit) {
        accRows.forEach((r) => {
          r.style.display = "flex";
          matched++;
        });
      }
      const visible = !q || anyRowHit || titleHit;
      acc.style.display = visible ? "" : "none";
      if (q && visible) {
        acc.open = true;
      }
    }

    if (countEl) {
      countEl.textContent = q
        ? `${matched} / ${rows.length} match`
        : `${rows.length} fields`;
    }

    const noMatchEl = document.getElementById("meta-no-filter-matches");
    if (noMatchEl) {
      noMatchEl.style.display = q && matched === 0 ? "block" : "none";
    }
  }

  private toggleAllAccordions() {
    const tableEl = document.getElementById("element-metadata-table");
    if (!tableEl) return;
    const accordions = Array.from(tableEl.querySelectorAll<HTMLDetailsElement>(".meta-accordion"));
    const anyClosed = accordions.some((a) => !a.open);
    accordions.forEach((a) => {
      a.open = anyClosed;
    });
    this.syncToggleAllLabel();
  }

  private syncToggleAllLabel() {
    const btn = document.getElementById("btn-meta-toggle-all");
    const tableEl = document.getElementById("element-metadata-table");
    if (!btn || !tableEl) return;
    const accordions = Array.from(tableEl.querySelectorAll<HTMLDetailsElement>(".meta-accordion"));
    const anyClosed = accordions.some((a) => !a.open);
    btn.textContent = anyClosed ? "Expand All" : "Collapse All";
  }

  public getCurrentSummary(): MetadataSummaryPayload | null {
    return this.currentSummary;
  }

  private copyCurrentMetadataAsJson() {
    if (!this.currentSummary) {
      notifyToast("Select an element first to copy metadata JSON", "warning");
      return;
    }
    const tableEl = document.getElementById("element-metadata-table");
    const fields: Record<string, string> = {};
    tableEl?.querySelectorAll(".prop-row").forEach((row) => {
      const k = row.querySelector(".prop-label")?.textContent?.trim();
      const v = row.querySelector(".prop-val")?.textContent?.trim();
      if (k && v !== undefined) fields[k] = v;
    });

    const json = JSON.stringify(
      {
        ...this.currentSummary,
        renderedFields: fields,
      },
      null,
      2
    );
    this.copyText(json, "Copied element metadata JSON to clipboard");
  }

  private copyText(text: string, toastMsg: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => notifyToast(toastMsg, "success"))
        .catch(() => notifyToast(toastMsg, "info"));
    } else {
      notifyToast(toastMsg, "info");
    }
  }
}
