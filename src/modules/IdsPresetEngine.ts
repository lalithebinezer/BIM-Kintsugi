/**
 * IdsPresetEngine — Enterprise OpenBIM IDS / QA Rule Presets & 1-Click Fix Guidance
 *
 * Evaluates loaded 3D model elements against ready-made AEC compliance presets:
 *  1. ISO 19650 Naming & GlobalId Hygiene
 *  2. 4D SIMULATION Parameter Completeness
 *  3. 5D Qto_* Quantity Readiness
 *  4. Spatial Containment (Building Storey Assignment)
 *
 * Returns exact compliance %, failing element modelIdMaps for 1-click 3D isolation,
 * and concrete remediation instructions.
 */

import type { IndexableModelElement } from "./CsvSchedulePropertyLinker";

export type IdsPresetId =
  | "iso-19650-naming"
  | "4d-simulation-ready"
  | "5d-qto-ready"
  | "spatial-storey-containment";

export interface IdsPresetDefinition {
  id: IdsPresetId;
  title: string;
  standard: string;
  description: string;
  fixSuggestion: string;
}

export interface IdsPresetResult {
  preset: IdsPresetDefinition;
  totalElements: number;
  passedCount: number;
  failedCount: number;
  compliancePct: number;
  status: "pass" | "warn" | "fail";
  failingModelIdMaps: Record<string, Set<number>>;
  failingByCategory: Array<{ category: string; count: number }>;
  sampleMissingReasons: string[];
}

export const IDS_RULE_PRESETS: readonly IdsPresetDefinition[] = [
  {
    id: "iso-19650-naming",
    title: "ISO 19650 Naming & GlobalId Hygiene",
    standard: "ISO 19650-2",
    description: "Every physical element must have a valid 22-char IFC GlobalId and a descriptive non-generic Name.",
    fixSuggestion: "Assign structured Type/Mark naming in authoring BIM tool (Revit/Archicad) and enable 'Store IFC GUID' on export.",
  },
  {
    id: "4d-simulation-ready",
    title: "4D SIMULATION Parameter Completeness",
    standard: "4D OpenBIM / Synchro",
    description: "Checks that every physical element exposes a non-empty SIMULATION / Task / Phase parameter for deterministic 4D linking.",
    fixSuggestion: "Run the bottom-up Level-Wise Sequence Generator or map Storey+Category composite keys in Map CSV.",
  },
  {
    id: "5d-qto-ready",
    title: "5D Qto_* Quantity Readiness",
    standard: "buildingSMART Qto / DIN 276",
    description: "Verifies physical elements carry base quantities (Volume, Area, Length, or Width) needed for automated 5D BOQ takeoff.",
    fixSuggestion: "Enable 'Export base quantities' in Revit IFC Export Options (Property Sets tab) or switch QTO Provenance to Bounding Box fallback.",
  },
  {
    id: "spatial-storey-containment",
    title: "Spatial Containment & Storey Assignment",
    standard: "IFC4 Spatial Schema",
    description: "Ensures elements are assigned to a named IfcBuildingStorey rather than floating unassigned at site root.",
    fixSuggestion: "Re-host orphan elements to their correct Building Storey level in the authoring model before federating.",
  },
];

function hasNonEmptyProp(el: IndexableModelElement, patterns: RegExp[]): boolean {
  for (const [k, v] of Object.entries(el.properties)) {
    if (v === null || v === undefined) continue;
    const str = String(v).trim();
    if (!str || str.toLowerCase() === "unassigned" || str.toLowerCase() === "unknown") continue;
    if (patterns.some((re) => re.test(k))) return true;
  }
  return false;
}

function evaluateElementAgainstPreset(
  el: IndexableModelElement,
  presetId: IdsPresetId
): { pass: boolean; reason?: string } {
  switch (presetId) {
    case "iso-19650-naming": {
      const name = String(el.properties["Name"] ?? "").trim();
      const guid = String(el.properties["GlobalId"] ?? "").trim();
      const genericName = !name || /^(unnamed|element|object|default|\d+)$/i.test(name);
      if (genericName) return { pass: false, reason: "Missing or generic Name" };
      if (guid && guid.length < 16) return { pass: false, reason: "Malformed GlobalId" };
      return { pass: true };
    }
    case "4d-simulation-ready": {
      const ok = hasNonEmptyProp(el, [/simulation/i, /4d/i, /task/i, /schedule/i, /phase/i, /work.?package/i]);
      return ok ? { pass: true } : { pass: false, reason: "Missing SIMULATION / 4D Task parameter" };
    }
    case "5d-qto-ready": {
      const ok = hasNonEmptyProp(el, [/qto_/i, /volume/i, /area/i, /length/i, /perimeter/i, /weight/i]);
      return ok ? { pass: true } : { pass: false, reason: "Missing Qto_* base quantity" };
    }
    case "spatial-storey-containment": {
      const storey = String(el.properties["Storey"] ?? "").trim();
      const invalid = !storey || /^(unassigned|unknown|none|all storeys|default)$/i.test(storey);
      return invalid ? { pass: false, reason: "Not assigned to an IfcBuildingStorey" } : { pass: true };
    }
  }
}

export function evaluateIdsPreset(
  presetId: IdsPresetId,
  elements: IndexableModelElement[]
): IdsPresetResult {
  const preset = IDS_RULE_PRESETS.find((p) => p.id === presetId) ?? IDS_RULE_PRESETS[0];
  let passedCount = 0;
  let failedCount = 0;
  const failingModelIdMaps: Record<string, Set<number>> = {};
  const catCounts = new Map<string, number>();
  const reasons = new Set<string>();

  for (const el of elements) {
    const res = evaluateElementAgainstPreset(el, preset.id);
    if (res.pass) {
      passedCount++;
    } else {
      failedCount++;
      (failingModelIdMaps[el.modelId] ??= new Set<number>()).add(el.expressId);
      const cat = String(el.properties["Category"] ?? "Unknown").trim() || "Unknown";
      catCounts.set(cat, (catCounts.get(cat) ?? 0) + 1);
      if (res.reason && reasons.size < 4) reasons.add(res.reason);
    }
  }

  const totalElements = elements.length;
  const compliancePct =
    totalElements > 0 ? Math.round((passedCount / totalElements) * 1000) / 10 : 100;
  const status: "pass" | "warn" | "fail" =
    compliancePct >= 95 ? "pass" : compliancePct >= 70 ? "warn" : "fail";

  const failingByCategory = Array.from(catCounts.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    preset,
    totalElements,
    passedCount,
    failedCount,
    compliancePct,
    status,
    failingModelIdMaps,
    failingByCategory,
    sampleMissingReasons: Array.from(reasons),
  };
}

export function evaluateAllIdsPresets(elements: IndexableModelElement[]): IdsPresetResult[] {
  return IDS_RULE_PRESETS.map((p) => evaluateIdsPreset(p.id, elements));
}

/**
 * Lazy-rendered Studio modal presenting all IDS Preset Audit cards with 1-click 3D isolation.
 */
export function openIdsPresetsModal(options: {
  results: IdsPresetResult[];
  onIsolateFailing: (
    presetTitle: string,
    modelIdMaps: Record<string, Set<number>>,
    failedCount: number
  ) => Promise<void> | void;
  onResetView?: () => Promise<void> | void;
}): void {
  document.getElementById("ids-presets-audit-modal")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "ids-presets-audit-modal";
  overlay.className = "modal-overlay open";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:10060;background:rgba(5,7,12,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;";

  const cardsHtml = options.results
    .map((r) => {
      const color =
        r.status === "pass" ? "#10b981" : r.status === "warn" ? "#f59e0b" : "#f43f5e";
      const cats = r.failingByCategory
        .slice(0, 5)
        .map((c) => `<span class="audit-cat-chip">${c.category}: <strong>${c.count}</strong></span>`)
        .join("");
      return `
        <div style="padding:0.85rem;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;gap:0.45rem;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
            <div>
              <div style="font-size:0.82rem;font-weight:700;color:#f8fafc;">${r.preset.title}</div>
              <div style="font-size:0.68rem;color:#94a3b8;">${r.preset.standard} • ${r.passedCount.toLocaleString()}/${r.totalElements.toLocaleString()} passed</div>
            </div>
            <span style="font-size:0.85rem;font-weight:800;font-variant-numeric:tabular-nums;color:${color};">${r.compliancePct}%</span>
          </div>
          <div style="height:5px;border-radius:999px;background:rgba(255,255,255,0.08);overflow:hidden;">
            <div style="height:100%;width:${r.compliancePct}%;background:${color};"></div>
          </div>
          <div style="font-size:0.71rem;color:#cbd5e1;">${r.preset.description}</div>
          <div style="font-size:0.69rem;color:#38bdf8;background:rgba(56,189,248,0.08);border:1px solid rgba(56,189,248,0.22);padding:0.38rem 0.55rem;border-radius:6px;">
            <strong>1-Click Fix Guidance:</strong> ${r.preset.fixSuggestion}
          </div>
          ${cats ? `<div style="display:flex;flex-wrap:wrap;gap:0.3rem;">${cats}</div>` : ""}
          <div style="display:flex;justify-content:flex-end;gap:0.4rem;margin-top:0.15rem;">
            ${
              r.failedCount > 0
                ? `<button type="button" class="btn-primary btn-ids-isolate" data-preset-id="${r.preset.id}" style="font-size:0.7rem;padding:0.28rem 0.65rem;">Highlight ${r.failedCount.toLocaleString()} Failing in 3D</button>`
                : `<span style="font-size:0.7rem;font-weight:700;color:#10b981;">✓ Fully Compliant</span>`
            }
          </div>
        </div>
      `;
    })
    .join("");

  overlay.innerHTML = `
    <div style="background:var(--bg-panel,#12141c);border:1px solid var(--border-strong,#2e3346);border-radius:12px;width:min(780px,96vw);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 28px 72px rgba(0,0,0,0.65);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid rgba(255,255,255,0.08);">
        <div>
          <div style="font-weight:750;font-size:0.95rem;color:#f8fafc;">OpenBIM IDS &amp; QA Compliance Presets</div>
          <div style="font-size:0.73rem;color:#94a3b8;">ISO 19650 · 4D SIMULATION · 5D QTO · IFC4 Spatial Containment</div>
        </div>
        <div style="display:flex;gap:0.4rem;">
          <button type="button" id="ids-presets-reset" class="btn-secondary" style="font-size:0.72rem;padding:0.25rem 0.6rem;">Reset 3D View</button>
          <button type="button" id="ids-presets-close" class="btn-secondary" style="padding:0.25rem 0.6rem;">✕</button>
        </div>
      </div>
      <div class="thin-scrollbar" style="padding:1rem 1.1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.75rem;">
        ${cardsHtml}
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector("#ids-presets-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });
  overlay.querySelector("#ids-presets-reset")?.addEventListener("click", async () => {
    await options.onResetView?.();
    close();
  });
  overlay.querySelectorAll<HTMLButtonElement>(".btn-ids-isolate").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.presetId as IdsPresetId;
      const found = options.results.find((x) => x.preset.id === id);
      if (!found) return;
      await options.onIsolateFailing(found.preset.title, found.failingModelIdMaps, found.failedCount);
      close();
    });
  });
}
