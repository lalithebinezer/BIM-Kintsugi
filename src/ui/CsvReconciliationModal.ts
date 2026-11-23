/**
 * CsvReconciliationModal — Interactive CSV Column & Composite Property Mapper
 * + Schedule-to-3D Linkage & Unscheduled Elements Audit Modal.
 */

import {
  parseCsvHeadersAndPreview,
  remapCsvColumns,
  type CsvColumnMapping,
  type DiscoveredMetaProperty,
  type ScheduleLinkageAuditReport,
} from "../modules/CsvSchedulePropertyLinker";

function escHtml(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function guessHeader(headers: string[], patterns: RegExp[]): string {
  for (const re of patterns) {
    const found = headers.find((h) => re.test(h));
    if (found) return found;
  }
  return "";
}

export interface CsvColumnMapperResult {
  remappedCsv: string;
  mapping: CsvColumnMapping;
}

/**
 * Opens an interactive modal allowing the user to map arbitrary CSV headers to
 * TaskName, StartDate, EndDate, Cost, and Single or Multi-Property Composite Keys
 * (e.g. `Storey + Category`) before importing into the 4D ScheduleManager.
 */
export function openCsvColumnMapperModal(options: {
  filename: string;
  csvText: string;
  availableProperties: DiscoveredMetaProperty[];
}): Promise<CsvColumnMapperResult | null> {
  const { headers, previewRows } = parseCsvHeadersAndPreview(options.csvText, 4);
  if (headers.length === 0) return Promise.resolve(null);

  return new Promise((resolve) => {
    document.getElementById("csv-column-mapper-modal")?.remove();

    const guessedTask = guessHeader(headers, [/task.?name/i, /activity.?name/i, /^name$/i, /^task$/i, /wbs/i]) || headers[0];
    const guessedStart = guessHeader(headers, [/start.?date/i, /^start$/i, /planned.?start/i, /early.?start/i]);
    const guessedEnd = guessHeader(headers, [/end.?date/i, /finish/i, /^end$/i, /planned.?end/i, /early.?finish/i]);
    const guessedCost = guessHeader(headers, [/total.?cost/i, /budget/i, /^cost$/i]);
    const guessedMatch = guessHeader(headers, [/match.?val/i, /simulation/i, /code/i]);

    const propNames = Array.from(
      new Set([
        "Text.SIMULATION",
        "Storey",
        "Category",
        "Name",
        "ObjectType",
        "PredefinedType",
        ...options.availableProperties.map((p) => p.propertyName),
      ])
    );

    const buildHeaderSelect = (id: string, selected: string, allowEmpty = true) => {
      const opts = [
        ...(allowEmpty ? [`<option value="">(Auto / None)</option>`] : []),
        ...headers.map(
          (h) => `<option value="${escHtml(h)}" ${h === selected ? "selected" : ""}>${escHtml(h)}</option>`
        ),
      ].join("");
      return `<select id="${id}" class="custom-select csv-mapper-select">${opts}</select>`;
    };

    const buildPropSelect = (id: string, selected: string, emptyLabel: string) => {
      const opts = [
        `<option value="">${escHtml(emptyLabel)}</option>`,
        ...propNames.map(
          (p) => `<option value="${escHtml(p)}" ${p === selected ? "selected" : ""}>${escHtml(p)}</option>`
        ),
      ].join("");
      return `<select id="${id}" class="custom-select csv-mapper-select">${opts}</select>`;
    };

    const previewTableHtml = `
      <div class="csv-mapper-preview-wrap thin-scrollbar">
        <table class="csv-mapper-preview-table">
          <thead><tr>${headers.map((h) => `<th>${escHtml(h)}</th>`).join("")}</tr></thead>
          <tbody>
            ${previewRows
              .map(
                (row) =>
                  `<tr>${headers.map((_, i) => `<td>${escHtml(row[i] ?? "")}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;

    const overlay = document.createElement("div");
    overlay.id = "csv-column-mapper-modal";
    overlay.className = "modal-overlay open";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:10050;background:rgba(5,7,12,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";

    overlay.innerHTML = `
      <div class="csv-mapper-dialog" style="background:var(--bg-panel,#12141c);border:1px solid var(--border-strong,#2e3346);border-radius:12px;width:min(760px,96vw);max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--border-subtle,#232635);">
          <div>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary,#f8fafc);">CSV Column &amp; 3D Property Mapper</div>
            <div style="font-size:0.74rem;color:var(--text-muted,#94a3b8);">${escHtml(options.filename)} • ${headers.length} columns detected</div>
          </div>
          <button type="button" id="csv-mapper-close" class="btn-secondary" style="padding:0.25rem 0.6rem;">✕</button>
        </div>

        <div style="padding:1rem 1.1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.85rem;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:0.65rem;">
            <label class="csv-mapper-field">
              <span>Task Name Column *</span>
              ${buildHeaderSelect("csv-map-taskname", guessedTask, false)}
            </label>
            <label class="csv-mapper-field">
              <span>Start Date Column</span>
              ${buildHeaderSelect("csv-map-start", guessedStart, true)}
            </label>
            <label class="csv-mapper-field">
              <span>End Date Column</span>
              ${buildHeaderSelect("csv-map-end", guessedEnd, true)}
            </label>
            <label class="csv-mapper-field">
              <span>Cost / Budget Column</span>
              ${buildHeaderSelect("csv-map-cost", guessedCost, true)}
            </label>
            <label class="csv-mapper-field">
              <span>Match Value Column</span>
              ${buildHeaderSelect("csv-map-matchval", guessedMatch, true)}
            </label>
          </div>

          <div style="padding:0.75rem;border:1px solid var(--border-subtle,#232635);border-radius:8px;background:rgba(212,255,63,0.03);">
            <div style="font-size:0.75rem;font-weight:700;color:var(--accent-400,#d4ff3f);margin-bottom:0.45rem;">
              3D Property Link Key (Single or Multi-Property Composite)
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;">
              <label class="csv-mapper-field">
                <span>Primary IFC Property</span>
                ${buildPropSelect("csv-map-prop1", "", "Auto-Match Any Property")}
              </label>
              <label class="csv-mapper-field">
                <span>+ Secondary Composite Property (Optional)</span>
                ${buildPropSelect("csv-map-prop2", "", "None (Single Property)")}
              </label>
            </div>
            <div style="font-size:0.69rem;color:var(--text-muted,#94a3b8);margin-top:0.35rem;">
              Tip: Select <strong>Storey</strong> + <strong>Category</strong> to link schedules like <code>Level 1 — IfcColumn</code> even without a Revit SIMULATION parameter.
            </div>
          </div>

          <div>
            <div style="font-size:0.72rem;font-weight:600;color:var(--text-secondary,#cbd5e1);margin-bottom:0.35rem;">CSV Preview (first ${previewRows.length} rows)</div>
            ${previewTableHtml}
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:0.8rem 1.1rem;border-top:1px solid var(--border-subtle,#232635);">
          <button type="button" id="csv-mapper-cancel" class="btn-secondary">Cancel</button>
          <button type="button" id="csv-mapper-confirm" class="btn-primary">Import &amp; Link to 3D</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const cleanup = (result: CsvColumnMapperResult | null) => {
      overlay.remove();
      resolve(result);
    };

    overlay.querySelector("#csv-mapper-close")?.addEventListener("click", () => cleanup(null));
    overlay.querySelector("#csv-mapper-cancel")?.addEventListener("click", () => cleanup(null));
    overlay.addEventListener("click", (ev) => {
      if (ev.target === overlay) cleanup(null);
    });

    overlay.querySelector("#csv-mapper-confirm")?.addEventListener("click", () => {
      const val = (id: string) =>
        (overlay.querySelector(`#${id}`) as HTMLSelectElement | null)?.value || "";
      const prop1 = val("csv-map-prop1");
      const prop2 = val("csv-map-prop2");
      const compositeProperties = prop1 && prop2 && prop1 !== prop2 ? [prop1, prop2] : undefined;

      const mapping: CsvColumnMapping = {
        taskName: val("csv-map-taskname") || headers[0],
        startDate: val("csv-map-start") || undefined,
        endDate: val("csv-map-end") || undefined,
        totalCost: val("csv-map-cost") || undefined,
        matchValue: val("csv-map-matchval") || undefined,
        matchProperty: !compositeProperties && prop1 ? prop1 : undefined,
        compositeProperties,
      };
      const remappedCsv = remapCsvColumns(options.csvText, mapping);
      cleanup({ remappedCsv, mapping });
    });
  });
}

/**
 * Opens the Schedule Linkage & Unscheduled Elements Audit Drawer/Modal.
 */
export function openScheduleAuditModal(options: {
  report: ScheduleLinkageAuditReport;
  onIsolateUnscheduled: (modelIdMaps: Record<string, Set<number>>) => Promise<void> | void;
  onResetIsolation?: () => Promise<void> | void;
  onMarkResourceTask?: (taskId: string) => void;
}): void {
  document.getElementById("schedule-linkage-audit-modal")?.remove();
  const { report } = options;

  const overlay = document.createElement("div");
  overlay.id = "schedule-linkage-audit-modal";
  overlay.className = "modal-overlay open";
  overlay.style.cssText =
    "position:fixed;inset:0;z-index:10050;background:rgba(5,7,12,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;";

  const unmatchedHtml =
    report.unmatchedTasks.length === 0
      ? `<div style="font-size:0.75rem;color:var(--color-success,#10b981);">All geometric schedule tasks are linked to 3D elements.</div>`
      : report.unmatchedTasks
          .map(
            (t) => `
          <div class="audit-row-item" data-task-id="${escHtml(t.taskId)}">
            <span style="font-size:0.76rem;color:var(--text-primary,#f8fafc);">${escHtml(t.taskName)}</span>
            <button type="button" class="btn-secondary btn-mark-resource" data-task-id="${escHtml(t.taskId)}" style="font-size:0.66rem;padding:0.18rem 0.45rem;">
              Mark Resource
            </button>
          </div>`
          )
          .join("");

  const resourceHtml =
    report.resourceTasks.length === 0
      ? `<div style="font-size:0.74rem;color:var(--text-muted,#94a3b8);">None detected.</div>`
      : report.resourceTasks
          .map(
            (t) => `
          <div class="audit-row-item">
            <span style="font-size:0.75rem;color:var(--text-secondary,#cbd5e1);">${escHtml(t.taskName)}</span>
            <span style="font-size:0.66rem;color:var(--color-info,#38bdf8);padding:0.12rem 0.4rem;border-radius:4px;background:rgba(56,189,248,0.12);">${escHtml(t.reason)}</span>
          </div>`
          )
          .join("");

  const unschedCatHtml =
    report.unscheduledByCategory.length === 0
      ? `<div style="font-size:0.75rem;color:var(--color-success,#10b981);">100% of physical 3D elements are scheduled!</div>`
      : report.unscheduledByCategory
          .slice(0, 12)
          .map(
            (c) =>
              `<span class="audit-cat-chip">${escHtml(c.category)}: <strong>${c.count}</strong></span>`
          )
          .join("");

  overlay.innerHTML = `
    <div style="background:var(--bg-panel,#12141c);border:1px solid var(--border-strong,#2e3346);border-radius:12px;width:min(720px,96vw);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--border-subtle,#232635);">
        <div>
          <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary,#f8fafc);">4D Schedule ↔ 3D Model Linkage Audit</div>
          <div style="font-size:0.74rem;color:var(--text-muted,#94a3b8);">${report.scheduledElementCount.toLocaleString()} / ${report.totalModelElements.toLocaleString()} physical 3D elements linked</div>
        </div>
        <button type="button" id="audit-modal-close" class="btn-secondary" style="padding:0.25rem 0.6rem;">✕</button>
      </div>

      <div style="padding:1rem 1.1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.9rem;">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.55rem;">
          <div class="audit-kpi-card">
            <div class="audit-kpi-val" style="color:#10b981;">${report.matchedTasks.length}</div>
            <div class="audit-kpi-lbl">Matched Tasks</div>
          </div>
          <div class="audit-kpi-card">
            <div class="audit-kpi-val" style="color:#38bdf8;">${report.resourceTasks.length}</div>
            <div class="audit-kpi-lbl">Resource Tasks</div>
          </div>
          <div class="audit-kpi-card">
            <div class="audit-kpi-val" style="color:#f59e0b;">${report.unmatchedTasks.length}</div>
            <div class="audit-kpi-lbl">Unmatched Tasks</div>
          </div>
          <div class="audit-kpi-card">
            <div class="audit-kpi-val" style="color:${report.unscheduledElementCount > 0 ? "#f43f5e" : "#10b981"};">${report.unscheduledElementCount.toLocaleString()}</div>
            <div class="audit-kpi-lbl">Unscheduled 3D</div>
          </div>
        </div>

        <div style="padding:0.75rem;border:1px solid var(--border-subtle,#232635);border-radius:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.45rem;">
            <span style="font-size:0.76rem;font-weight:700;color:var(--text-primary,#f8fafc);">Unscheduled 3D Elements by Category</span>
            <div style="display:flex;gap:0.4rem;">
              ${
                report.unscheduledElementCount > 0
                  ? `<button type="button" id="btn-audit-isolate-unscheduled" class="btn-primary" style="font-size:0.72rem;padding:0.28rem 0.65rem;">Isolate ${report.unscheduledElementCount.toLocaleString()} Unscheduled in 3D</button>`
                  : ""
              }
              <button type="button" id="btn-audit-reset-isolation" class="btn-secondary" style="font-size:0.72rem;padding:0.28rem 0.6rem;">Reset View</button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">${unschedCatHtml}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div style="padding:0.75rem;border:1px solid var(--border-subtle,#232635);border-radius:8px;max-height:220px;overflow-y:auto;">
            <div style="font-size:0.75rem;font-weight:700;color:#f59e0b;margin-bottom:0.4rem;">Unmatched Geometric Tasks (${report.unmatchedTasks.length})</div>
            <div style="display:flex;flex-direction:column;gap:0.3rem;">${unmatchedHtml}</div>
          </div>
          <div style="padding:0.75rem;border:1px solid var(--border-subtle,#232635);border-radius:8px;max-height:220px;overflow-y:auto;">
            <div style="font-size:0.75rem;font-weight:700;color:#38bdf8;margin-bottom:0.4rem;">Non-Geometric / Resource Tasks (${report.resourceTasks.length})</div>
            <div style="display:flex;flex-direction:column;gap:0.3rem;">${resourceHtml}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const close = () => overlay.remove();
  overlay.querySelector("#audit-modal-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (ev) => {
    if (ev.target === overlay) close();
  });

  overlay.querySelector("#btn-audit-isolate-unscheduled")?.addEventListener("click", async () => {
    await options.onIsolateUnscheduled(report.unscheduledModelIdMaps);
    close();
  });

  overlay.querySelector("#btn-audit-reset-isolation")?.addEventListener("click", async () => {
    await options.onResetIsolation?.();
    close();
  });

  overlay.querySelectorAll<HTMLButtonElement>(".btn-mark-resource").forEach((btn) => {
    btn.addEventListener("click", () => {
      const taskId = btn.dataset.taskId;
      if (!taskId) return;
      options.onMarkResourceTask?.(taskId);
      btn.textContent = "✓ Resource";
      btn.disabled = true;
    });
  });
}
