/**
 * BsddClient — buildingSMART Data Dictionary (bSDD) API Client & Offline IFC4.3 Catalog
 *
 * Queries the public buildingSMART Data Dictionary API (`api.bsdd.buildingsmart.org`)
 * to classify and validate IFC classes/properties against IFC 4.3, Uniclass 2015, and
 * ISO 12006-3 standards, with an offline-ready IFC 4.3 structural/architectural fallback
 * dictionary for air-gapped construction sites.
 */

import { escapeHtml } from "../utils/formatters";

export interface BsddClassMatch {
  code: string;
  name: string;
  dictionaryUri: string;
  classUri: string;
  standard: string;
  recommendedPsets: string[];
  source: "bsdd-live" | "ifc43-offline";
}

const OFFLINE_IFC43_CATALOG: readonly BsddClassMatch[] = [
  {
    code: "IfcFooting",
    name: "Footing / Pad & Strip Foundation",
    dictionaryUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3",
    classUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3/class/IfcFooting",
    standard: "IFC 4.3 (ISO 16739-1:2024)",
    recommendedPsets: ["Pset_FootingCommon", "Qto_FootingBaseQuantities", "Text.SIMULATION"],
    source: "ifc43-offline",
  },
  {
    code: "IfcColumn",
    name: "Structural Column",
    dictionaryUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3",
    classUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3/class/IfcColumn",
    standard: "IFC 4.3 (ISO 16739-1:2024)",
    recommendedPsets: ["Pset_ColumnCommon", "Qto_ColumnBaseQuantities", "Pset_ConcreteElementGeneral"],
    source: "ifc43-offline",
  },
  {
    code: "IfcBeam",
    name: "Structural Beam / Framing",
    dictionaryUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3",
    classUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3/class/IfcBeam",
    standard: "IFC 4.3 (ISO 16739-1:2024)",
    recommendedPsets: ["Pset_BeamCommon", "Qto_BeamBaseQuantities", "Pset_SteelElementGeneral"],
    source: "ifc43-offline",
  },
  {
    code: "IfcSlab",
    name: "Floor / Roof Slab",
    dictionaryUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3",
    classUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3/class/IfcSlab",
    standard: "IFC 4.3 (ISO 16739-1:2024)",
    recommendedPsets: ["Pset_SlabCommon", "Qto_SlabBaseQuantities", "Pset_ThermalLoadDesignCriteria"],
    source: "ifc43-offline",
  },
  {
    code: "IfcWall",
    name: "Wall / Shear & Partition Wall",
    dictionaryUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3",
    classUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3/class/IfcWall",
    standard: "IFC 4.3 (ISO 16739-1:2024)",
    recommendedPsets: ["Pset_WallCommon", "Qto_WallBaseQuantities", "Pset_FireRating"],
    source: "ifc43-offline",
  },
  {
    code: "IfcStair",
    name: "Stair / Vertical Circulation",
    dictionaryUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3",
    classUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3/class/IfcStair",
    standard: "IFC 4.3 (ISO 16739-1:2024)",
    recommendedPsets: ["Pset_StairCommon", "Qto_StairFlightBaseQuantities"],
    source: "ifc43-offline",
  },
  {
    code: "IfcRoof",
    name: "Roof Assembly",
    dictionaryUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3",
    classUri: "https://identifier.buildingsmart.org/uri/buildingsmart/ifc/4.3/class/IfcRoof",
    standard: "IFC 4.3 (ISO 16739-1:2024)",
    recommendedPsets: ["Pset_RoofCommon", "Qto_RoofBaseQuantities"],
    source: "ifc43-offline",
  },
];

export function searchOfflineBsddCatalog(query: string): BsddClassMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...OFFLINE_IFC43_CATALOG];
  return OFFLINE_IFC43_CATALOG.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.recommendedPsets.some((p) => p.toLowerCase().includes(q))
  );
}

/**
 * Searches the live buildingSMART Data Dictionary REST API with graceful fallback
 * to the bundled IFC 4.3 standard catalog when offline or rate-limited.
 */
export async function searchBsddClasses(
  query: string,
  options?: { allowNetwork?: boolean; timeoutMs?: number }
): Promise<BsddClassMatch[]> {
  const trimmed = query.trim();
  const offlineMatches = searchOfflineBsddCatalog(trimmed);
  if (!trimmed || options?.allowNetwork === false || typeof fetch !== "function") {
    return offlineMatches;
  }

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), options?.timeoutMs ?? 3500);
    const url = `https://api.bsdd.buildingsmart.org/api/TextSearchList/v2?SearchText=${encodeURIComponent(trimmed)}&TypeFilter=Class`;
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) return offlineMatches;

    const json = (await res.json()) as {
      classes?: Array<{
        code?: string;
        name?: string;
        dictionaryUri?: string;
        uri?: string;
        dictionaryName?: string;
      }>;
    };
    const live = (json.classes ?? []).slice(0, 12).map((c) => ({
      code: c.code || c.name || "Unknown",
      name: c.name || c.code || "bSDD Class",
      dictionaryUri: c.dictionaryUri || "",
      classUri: c.uri || "",
      standard: c.dictionaryName || "buildingSMART bSDD",
      recommendedPsets: [],
      source: "bsdd-live" as const,
    }));
    return live.length > 0 ? [...live, ...offlineMatches] : offlineMatches;
  } catch {
    return offlineMatches;
  }
}

export function openBsddValidatorModal(initialQuery = ""): void {
  document.getElementById("bsdd-validator-modal")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "bsdd-validator-modal";
  overlay.className = "modal-overlay open";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:10065;background:rgba(5,7,12,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;";

  overlay.innerHTML = `
    <div style="width:min(700px,96vw);max-height:85vh;border-radius:12px;border:1px solid var(--border-strong);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--studio-hairline);">
        <div>
          <div style="font-weight:750;font-size:0.95rem;">buildingSMART Data Dictionary (bSDD) &amp; IFC 4.3 Lookup</div>
          <div style="font-size:0.72rem;color:var(--text-muted);">ISO 16739-1:2024 / ISO 12006-3 live API with air-gapped IFC 4.3 fallback</div>
        </div>
        <button type="button" id="bsdd-close" class="btn-secondary" style="padding:0.22rem 0.55rem;">✕</button>
      </div>
      <div style="padding:0.85rem 1.1rem;display:flex;gap:0.5rem;border-bottom:1px solid var(--studio-hairline);">
        <input type="text" id="bsdd-search-input" value="${escapeHtml(initialQuery)}" placeholder="Search IFC class or property (e.g. IfcColumn, IfcWall, Footing)..." style="flex:1;height:32px;padding:0 0.65rem;font-size:0.76rem;" />
        <button type="button" id="bsdd-search-btn" class="btn-primary" style="height:32px;padding:0 0.9rem;font-size:0.74rem;">Query bSDD</button>
      </div>
      <div id="bsdd-results-list" class="thin-scrollbar" style="padding:0.85rem 1.1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.55rem;"></div>
    </div>
  `;

  document.body.appendChild(overlay);
  const input = overlay.querySelector<HTMLInputElement>("#bsdd-search-input")!;
  const listEl = overlay.querySelector<HTMLElement>("#bsdd-results-list")!;

  const runSearch = async () => {
    listEl.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);">Querying buildingSMART Data Dictionary...</div>`;
    const matches = await searchBsddClasses(input.value);
    if (matches.length === 0) {
      listEl.innerHTML = `<div style="font-size:0.75rem;color:var(--text-muted);">No matching bSDD / IFC 4.3 classes found.</div>`;
      return;
    }
    listEl.innerHTML = matches
      .map(
        (m) => `
      <div style="padding:0.65rem 0.78rem;border-radius:9px;background:var(--studio-surface-1);border:1px solid var(--studio-hairline);display:flex;flex-direction:column;gap:0.28rem;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
          <strong style="font-size:0.8rem;">${escapeHtml(m.code)} — ${escapeHtml(m.name)}</strong>
          <span style="font-size:0.62rem;padding:0.12rem 0.45rem;border-radius:999px;background:var(--studio-surface-2);color:var(--accent-500);">${escapeHtml(m.source === "bsdd-live" ? "Live bSDD" : "IFC 4.3 Standard")}</span>
        </div>
        <div style="font-size:0.68rem;color:var(--text-muted);">${escapeHtml(m.standard)}</div>
        ${
          m.recommendedPsets.length > 0
            ? `<div style="font-size:0.68rem;color:var(--color-info);">Required Psets: ${m.recommendedPsets.map((p) => `<code>${escapeHtml(p)}</code>`).join(", ")}</div>`
            : ""
        }
      </div>`
      )
      .join("");
  };

  overlay.querySelector("#bsdd-close")?.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) overlay.remove();
  });
  overlay.querySelector("#bsdd-search-btn")?.addEventListener("click", runSearch);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") runSearch();
  });

  runSearch();
}
