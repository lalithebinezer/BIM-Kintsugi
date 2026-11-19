/**
 * RuleBuilderModal — Visual Dynamic Search Set Rule Builder & 4D Task Binder.
 *
 * Lets users visually author boolean AST search rules (`AND` / `OR` / `NEWSET` + negate)
 * for `RuleSearchEngine`, preview live matched 3D elements, and bind rules directly
 * to 4D schedule tasks in `ScheduleManager`.
 */

import {
  RuleSearchEngine,
  type RuleCondition,
  type RuleField,
  type RuleLogic,
  type RuleOperator,
  type SearchSetRuleDefinition,
} from "../modules/RuleSearchEngine";
import { ScheduleManager } from "../modules/ScheduleManager";
import { BimEngine } from "../core/BimEngine";
import * as OBF from "@thatopen/components-front";
import { showToast } from "./ToastManager";

const RULE_FIELDS: Array<{ value: RuleField; label: string }> = [
  { value: "category", label: "IFC Category" },
  { value: "name", label: "Element Name" },
  { value: "storey", label: "Building Storey" },
  { value: "material", label: "Material" },
  { value: "layer", label: "Layer" },
  { value: "predefinedType", label: "Predefined Type" },
  { value: "pset", label: "PropertySet (path)" },
  { value: "path", label: "Hierarchy Path" },
];

const RULE_OPERATORS: Array<{ value: RuleOperator; label: string }> = [
  { value: "contains", label: "contains" },
  { value: "equals", label: "equals" },
  { value: "not_equals", label: "not equals" },
  { value: "regex", label: "regex" },
  { value: "gt", label: ">" },
  { value: "gte", label: ">=" },
  { value: "lt", label: "<" },
  { value: "lte", label: "<=" },
];

function escapeAttr(val: string): string {
  return String(val)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export class RuleBuilderModal {
  private static instance: RuleBuilderModal | null = null;
  private modalEl: HTMLElement | null = null;
  private editingRuleId: string | null = null;
  private draftConditions: RuleCondition[] = [];
  private onBoundCallback: (() => void) | null = null;

  private constructor() {}

  public static getInstance(): RuleBuilderModal {
    if (!RuleBuilderModal.instance) {
      RuleBuilderModal.instance = new RuleBuilderModal();
    }
    return RuleBuilderModal.instance;
  }

  public open(options?: { ruleId?: string; preselectedTaskId?: string; onBound?: () => void }): void {
    this.onBoundCallback = options?.onBound ?? null;
    this.ensureModalDom();
    if (!this.modalEl) return;

    const engine = RuleSearchEngine.getInstance();
    if (options?.ruleId) {
      const existing = engine.getRule(options.ruleId);
      if (existing) {
        this.loadRuleIntoForm(existing);
      } else {
        this.resetDraft();
      }
    } else {
      this.resetDraft();
    }

    this.populateTaskSelect(options?.preselectedTaskId);
    this.renderSavedRulesList();
    this.renderConditionRows();
    this.setTestOutput("Click Test Rule to evaluate against loaded 3D models.");

    this.modalEl.classList.remove("hidden");
  }

  public close(): void {
    this.modalEl?.classList.add("hidden");
  }

  private resetDraft(): void {
    this.editingRuleId = null;
    this.draftConditions = [
      {
        field: "category",
        operator: "contains",
        value: "IFCWALL",
        logic: "NEWSET",
        negate: false,
        enabled: true,
      },
    ];
    const nameInput = this.modalEl?.querySelector<HTMLInputElement>("#rb-rule-name");
    if (nameInput) nameInput.value = "";
  }

  private loadRuleIntoForm(rule: SearchSetRuleDefinition): void {
    this.editingRuleId = rule.id;
    this.draftConditions = rule.conditions.map((c) => ({ ...c }));
    const nameInput = this.modalEl?.querySelector<HTMLInputElement>("#rb-rule-name");
    if (nameInput) nameInput.value = rule.name;
  }

  private ensureModalDom(): void {
    const existing = document.getElementById("rule-builder-modal");
    if (existing) {
      this.modalEl = existing;
      return;
    }

    const overlay = document.createElement("div");
    overlay.id = "rule-builder-modal";
    overlay.className = "rb-modal-overlay hidden";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Dynamic Search Set Rule Builder");

    overlay.innerHTML = `
      <div class="rb-modal-card">
        <div class="rb-modal-header">
          <div class="rb-modal-title">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span>Dynamic Search Set Rule Builder</span>
          </div>
          <button type="button" class="btn-icon-sm" id="rb-btn-close" title="Close Rule Builder">✕</button>
        </div>

        <div class="rb-modal-body thin-scrollbar">
          <div class="rb-section-label">Saved Search Set Rules</div>
          <div class="rb-saved-list" id="rb-saved-rules-list"></div>

          <div class="rb-section-label" style="margin-top:0.75rem;">Rule Definition</div>
          <div class="rb-name-row">
            <input type="text" id="rb-rule-name" class="gis-input" placeholder="e.g. Level 2 Structural Walls" aria-label="Search Set Rule Name" />
            <button type="button" id="rb-btn-new-draft" class="btn-xs btn-outline">New</button>
          </div>

          <div class="rb-conditions-list" id="rb-conditions-list"></div>
          <button type="button" id="rb-btn-add-condition" class="btn-xs btn-outline" style="margin-top:0.35rem;">+ Add Condition</button>

          <div class="rb-bind-row">
            <label for="rb-bind-task-select">Bind to 4D Task:</label>
            <select id="rb-bind-task-select" class="clash-status-select" aria-label="Bind Rule to 4D Task"></select>
          </div>

          <div class="rb-test-output" id="rb-test-output"></div>
        </div>

        <div class="rb-modal-footer">
          <button type="button" id="rb-btn-test" class="btn-xs btn-outline">Test &amp; Highlight</button>
          <button type="button" id="rb-btn-save" class="btn-xs btn-accent">Save Rule</button>
          <button type="button" id="rb-btn-save-bind" class="btn-xs btn-accent">Save &amp; Bind to Task</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modalEl = overlay;

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) this.close();
    });
    overlay.querySelector("#rb-btn-close")?.addEventListener("click", () => this.close());
    overlay.querySelector("#rb-btn-new-draft")?.addEventListener("click", () => {
      this.resetDraft();
      this.renderConditionRows();
    });
    overlay.querySelector("#rb-btn-add-condition")?.addEventListener("click", () => {
      this.syncConditionsFromDom();
      this.draftConditions.push({
        field: "storey",
        operator: "contains",
        value: "",
        logic: this.draftConditions.length === 0 ? "NEWSET" : "AND",
        negate: false,
        enabled: true,
      });
      this.renderConditionRows();
    });
    overlay.querySelector("#rb-btn-test")?.addEventListener("click", () => void this.handleTestRule());
    overlay.querySelector("#rb-btn-save")?.addEventListener("click", () => void this.handleSave(false));
    overlay.querySelector("#rb-btn-save-bind")?.addEventListener("click", () => void this.handleSave(true));
  }

  private populateTaskSelect(preselectedTaskId?: string): void {
    const sel = this.modalEl?.querySelector<HTMLSelectElement>("#rb-bind-task-select");
    if (!sel) return;
    const tasks = ScheduleManager.getInstance().getTasksSorted();
    sel.innerHTML = `<option value="">(None — Save Rule Only)</option>`;
    for (const t of tasks) {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = `${t.wbsCode ? `[${t.wbsCode}] ` : ""}${t.name}`;
      if (preselectedTaskId && t.id === preselectedTaskId) opt.selected = true;
      sel.appendChild(opt);
    }
  }

  private renderSavedRulesList(): void {
    const listEl = this.modalEl?.querySelector<HTMLElement>("#rb-saved-rules-list");
    if (!listEl) return;
    const rules = RuleSearchEngine.getInstance().getRules();
    if (rules.length === 0) {
      listEl.innerHTML = `<div class="rb-empty">No saved dynamic rules yet. Build one below or import Navisworks XML.</div>`;
      return;
    }

    listEl.innerHTML = rules
      .map(
        (r) => `
        <div class="rb-saved-item ${r.id === this.editingRuleId ? "active" : ""}" data-rule-id="${escapeAttr(r.id)}">
          <div class="rb-saved-meta">
            <span class="rb-saved-name">${escapeAttr(r.name)}</span>
            <span class="rb-saved-count">${r.conditions.length} cond.</span>
          </div>
          <div class="rb-saved-actions">
            <button type="button" class="btn-xs btn-outline rb-act-edit" data-rule-id="${escapeAttr(r.id)}">Edit</button>
            <button type="button" class="btn-xs btn-outline rb-act-del" data-rule-id="${escapeAttr(r.id)}">Del</button>
          </div>
        </div>`
      )
      .join("");

    listEl.querySelectorAll<HTMLButtonElement>(".rb-act-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.ruleId;
        if (!id) return;
        const rule = RuleSearchEngine.getInstance().getRule(id);
        if (rule) {
          this.loadRuleIntoForm(rule);
          this.renderSavedRulesList();
          this.renderConditionRows();
        }
      });
    });

    listEl.querySelectorAll<HTMLButtonElement>(".rb-act-del").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.ruleId;
        if (!id) return;
        RuleSearchEngine.getInstance().deleteRule(id);
        if (this.editingRuleId === id) this.resetDraft();
        this.renderSavedRulesList();
        this.renderConditionRows();
        showToast("Deleted search set rule", "info");
      });
    });
  }

  private renderConditionRows(): void {
    const container = this.modalEl?.querySelector<HTMLElement>("#rb-conditions-list");
    if (!container) return;

    container.innerHTML = this.draftConditions
      .map((cond, idx) => {
        const fieldOptions = RULE_FIELDS.map(
          (f) => `<option value="${f.value}" ${cond.field === f.value ? "selected" : ""}>${f.label}</option>`
        ).join("");
        const opOptions = RULE_OPERATORS.map(
          (o) => `<option value="${o.value}" ${cond.operator === o.value ? "selected" : ""}>${o.label}</option>`
        ).join("");
        const logicOptions = (["NEWSET", "AND", "OR"] as RuleLogic[])
          .map((l) => `<option value="${l}" ${cond.logic === l ? "selected" : ""}>${l}</option>`)
          .join("");
        const showPath = cond.field === "pset";

        return `
          <div class="rb-cond-row" data-idx="${idx}">
            <select class="rb-cond-logic" aria-label="Condition Logic">${logicOptions}</select>
            <label class="rb-cond-neg" title="Negate condition">
              <input type="checkbox" class="rb-cond-negate" ${cond.negate ? "checked" : ""} /> NOT
            </label>
            <select class="rb-cond-field" aria-label="Condition Field">${fieldOptions}</select>
            ${
              showPath
                ? `<input type="text" class="rb-cond-path gis-input" placeholder="Pset.Key" value="${escapeAttr(cond.propertyPath ?? "")}" aria-label="PropertySet Path" />`
                : ""
            }
            <select class="rb-cond-op" aria-label="Condition Operator">${opOptions}</select>
            <input type="text" class="rb-cond-val gis-input" placeholder="Value..." value="${escapeAttr(String(cond.value ?? ""))}" aria-label="Condition Value" />
            <button type="button" class="btn-icon-sm rb-cond-remove" title="Remove Condition">✕</button>
          </div>
        `;
      })
      .join("");

    container.querySelectorAll<HTMLElement>(".rb-cond-row").forEach((row) => {
      const idx = Number(row.dataset.idx);
      row.querySelector<HTMLSelectElement>(".rb-cond-field")?.addEventListener("change", () => {
        this.syncConditionsFromDom();
        this.renderConditionRows();
      });
      row.querySelector<HTMLButtonElement>(".rb-cond-remove")?.addEventListener("click", () => {
        this.syncConditionsFromDom();
        this.draftConditions.splice(idx, 1);
        if (this.draftConditions.length === 0) {
          this.draftConditions.push({
            field: "category",
            operator: "contains",
            value: "",
            logic: "NEWSET",
            negate: false,
            enabled: true,
          });
        }
        this.renderConditionRows();
      });
    });
  }

  private syncConditionsFromDom(): void {
    const container = this.modalEl?.querySelector<HTMLElement>("#rb-conditions-list");
    if (!container) return;
    const rows = Array.from(container.querySelectorAll<HTMLElement>(".rb-cond-row"));
    this.draftConditions = rows.map((row) => {
      const logic = (row.querySelector<HTMLSelectElement>(".rb-cond-logic")?.value || "AND") as RuleLogic;
      const negate = Boolean(row.querySelector<HTMLInputElement>(".rb-cond-negate")?.checked);
      const field = (row.querySelector<HTMLSelectElement>(".rb-cond-field")?.value || "category") as RuleField;
      const propertyPath = row.querySelector<HTMLInputElement>(".rb-cond-path")?.value?.trim() || undefined;
      const operator = (row.querySelector<HTMLSelectElement>(".rb-cond-op")?.value || "contains") as RuleOperator;
      const rawVal = row.querySelector<HTMLInputElement>(".rb-cond-val")?.value ?? "";
      const num = Number(rawVal);
      const value =
        ["gt", "gte", "lt", "lte"].includes(operator) && rawVal.trim() !== "" && Number.isFinite(num)
          ? num
          : rawVal;
      return { logic, negate, field, propertyPath, operator, value, enabled: true };
    });
  }

  private buildDraftRule(): SearchSetRuleDefinition {
    this.syncConditionsFromDom();
    const rawName = this.modalEl?.querySelector<HTMLInputElement>("#rb-rule-name")?.value.trim() || "";
    const id = this.editingRuleId || `rule-${Date.now()}`;
    return {
      id,
      name: rawName || `Dynamic Rule ${new Date().toLocaleTimeString()}`,
      conditions: this.draftConditions.filter((c) => String(c.value).trim() !== ""),
      updatedAt: new Date().toISOString(),
    };
  }

  private setTestOutput(html: string): void {
    const el = this.modalEl?.querySelector<HTMLElement>("#rb-test-output");
    if (el) el.innerHTML = html;
  }

  private async handleTestRule(): Promise<void> {
    const rule = this.buildDraftRule();
    if (rule.conditions.length === 0) {
      this.setTestOutput("Add at least one non-empty condition value to test.");
      return;
    }
    const res = await RuleSearchEngine.getInstance().evaluateAgainstLoadedModels(rule);
    this.setTestOutput(
      `Matched <strong>${res.matchedCount}</strong> element(s) across ${Object.keys(res.modelIdMap).length} model(s).`
    );
    if (res.matchedCount > 0) {
      try {
        const hl = BimEngine.getInstance().components.get(OBF.Highlighter);
        await hl.highlightByID("select", res.modelIdMap, true, false);
      } catch {
        // Highlight unavailable in headless unit test environments
      }
    }
    showToast(`Rule "${rule.name}": ${res.matchedCount} match(es)`, res.matchedCount > 0 ? "success" : "info");
  }

  private async handleSave(bindToTask: boolean): Promise<void> {
    const rule = this.buildDraftRule();
    if (rule.conditions.length === 0) {
      showToast("Please enter a value in at least one condition", "warning");
      return;
    }
    RuleSearchEngine.getInstance().upsertRule(rule);
    this.editingRuleId = rule.id;
    this.renderSavedRulesList();

    if (bindToTask) {
      const taskId = this.modalEl?.querySelector<HTMLSelectElement>("#rb-bind-task-select")?.value || "";
      if (!taskId) {
        showToast("Rule saved. Select a 4D task to bind it.", "info");
        return;
      }
      const evalRes = await RuleSearchEngine.getInstance().evaluateAgainstLoadedModels(rule);
      const matched = ScheduleManager.getInstance().bindSearchSetRuleToTask(taskId, rule.id, evalRes.modelIdMap);
      this.setTestOutput(
        `Saved <strong>${escapeAttr(rule.name)}</strong> &amp; bound to task (<strong>${matched}</strong> elements linked).`
      );
      showToast(`Bound "${rule.name}" to task (${matched} elements)`, "success");
      this.onBoundCallback?.();
      if (typeof (window as any).updateTimelineVisualState === "function") {
        (window as any).updateTimelineVisualState(true);
      }
    } else {
      this.setTestOutput(`Saved rule <strong>${escapeAttr(rule.name)}</strong>.`);
      showToast(`Saved Search Set Rule "${rule.name}"`, "success");
    }
  }
}
