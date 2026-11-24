/**
 * BsddClient — buildingSMART Data Dictionary (bSDD) API Client & Offline IFC4.3 Catalog
 *
 * Queries the public buildingSMART Data Dictionary API (`api.bsdd.buildingsmart.org`)
 * to classify and validate IFC classes/properties against IFC 4.3, Uniclass 2015, and
 * ISO 12006-3 standards, with an offline-ready IFC 4.3 structural/architectural fallback
 * dictionary for air-gapped construction sites.
 */

import { escapeHtml } from "../utils/formatters";
import { createBkModal } from "../ui/UiPlatform";

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
  const modal = createBkModal({
    id: "bsdd-validator-modal",
    title: "buildingSMART Data Dictionary (bSDD) &amp; IFC 4.3 Lookup",
    subtitle: "ISO 16739-1:2024 / ISO 12006-3 live API with air-gapped IFC 4.3 fallback",
    size: "md",
    closeButtonId: "bsdd-close",
    bodyHtml: `
      <div style="display:flex;gap:8px;">
        <input type="text" id="bsdd-search-input" class="bk-input" value="${escapeHtml(initialQuery)}" placeholder="Search IFC class or property (e.g. IfcColumn, IfcWall, Footing)..." style="flex:1;" />
        <button type="button" id="bsdd-search-btn" class="bk-btn bk-btn--primary">Query bSDD</button>
      </div>
      <div id="bsdd-results-list" style="display:flex;flex-direction:column;gap:8px;"></div>
    `,
  });

  const input = modal.overlay.querySelector<HTMLInputElement>("#bsdd-search-input")!;
  const listEl = modal.overlay.querySelector<HTMLElement>("#bsdd-results-list")!;

  const runSearch = async () => {
    listEl.innerHTML = `<div style="font-size:var(--bk-text-sm);color:var(--bk-text-muted);">Querying buildingSMART Data Dictionary...</div>`;
    const matches = await searchBsddClasses(input.value);
    if (matches.length === 0) {
      listEl.innerHTML = `<div style="font-size:var(--bk-text-sm);color:var(--bk-text-muted);">No matching bSDD / IFC 4.3 classes found.</div>`;
      return;
    }
    listEl.innerHTML = matches
      .map(
        (m) => `
      <div class="bk-card" style="display:flex;flex-direction:column;gap:4px;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <strong style="font-size:var(--bk-text-base);">${escapeHtml(m.code)} — ${escapeHtml(m.name)}</strong>
          <span class="bk-badge bk-badge--accent">${escapeHtml(m.source === "bsdd-live" ? "Live bSDD" : "IFC 4.3 Standard")}</span>
        </div>
        <div style="font-size:var(--bk-text-xs);color:var(--bk-text-muted);">${escapeHtml(m.standard)}</div>
        ${
          m.recommendedPsets.length > 0
            ? `<div style="font-size:var(--bk-text-xs);color:var(--bk-info);">Required Psets: ${m.recommendedPsets.map((p) => `<code>${escapeHtml(p)}</code>`).join(", ")}</div>`
            : ""
        }
      </div>`
      )
      .join("");
  };

  modal.overlay.querySelector("#bsdd-search-btn")?.addEventListener("click", runSearch);
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter") runSearch();
  });

  runSearch();
}
