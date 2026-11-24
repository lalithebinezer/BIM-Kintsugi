import{v as e}from"./thatopen-front-umhMv6cH.js";import{t}from"./ToastManager-BQIS5LYY.js";import{t as n}from"./BimEngine-CwvQmZpT.js";import{m as r}from"./index-WcyeT-60.js";import{RuleSearchEngine as i}from"./RuleSearchEngine-Cy4bRA4d.js";var a=[{value:`category`,label:`IFC Category`},{value:`name`,label:`Element Name`},{value:`storey`,label:`Building Storey`},{value:`material`,label:`Material`},{value:`layer`,label:`Layer`},{value:`predefinedType`,label:`Predefined Type`},{value:`pset`,label:`PropertySet (path)`},{value:`path`,label:`Hierarchy Path`}],o=[{value:`contains`,label:`contains`},{value:`equals`,label:`equals`},{value:`not_equals`,label:`not equals`},{value:`regex`,label:`regex`},{value:`gt`,label:`>`},{value:`gte`,label:`>=`},{value:`lt`,label:`<`},{value:`lte`,label:`<=`}];function s(e){return String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}var c=class c{static instance=null;modalEl=null;editingRuleId=null;draftConditions=[];onBoundCallback=null;constructor(){}static getInstance(){return c.instance||=new c,c.instance}open(e){if(this.onBoundCallback=e?.onBound??null,this.ensureModalDom(),!this.modalEl)return;let t=i.getInstance();if(e?.ruleId){let n=t.getRule(e.ruleId);n?this.loadRuleIntoForm(n):this.resetDraft()}else this.resetDraft();this.populateTaskSelect(e?.preselectedTaskId),this.renderSavedRulesList(),this.renderConditionRows(),this.setTestOutput(`Click Test Rule to evaluate against loaded 3D models.`),this.modalEl.classList.remove(`hidden`)}close(){this.modalEl?.classList.add(`hidden`)}resetDraft(){this.editingRuleId=null,this.draftConditions=[{field:`category`,operator:`contains`,value:`IFCWALL`,logic:`NEWSET`,negate:!1,enabled:!0}];let e=this.modalEl?.querySelector(`#rb-rule-name`);e&&(e.value=``)}loadRuleIntoForm(e){this.editingRuleId=e.id,this.draftConditions=e.conditions.map(e=>({...e}));let t=this.modalEl?.querySelector(`#rb-rule-name`);t&&(t.value=e.name)}ensureModalDom(){let e=document.getElementById(`rule-builder-modal`);if(e){this.modalEl=e;return}let t=document.createElement(`div`);t.id=`rule-builder-modal`,t.className=`rb-modal-overlay hidden`,t.setAttribute(`role`,`dialog`),t.setAttribute(`aria-modal`,`true`),t.setAttribute(`aria-label`,`Dynamic Search Set Rule Builder`),t.innerHTML=`
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
    `,document.body.appendChild(t),this.modalEl=t,t.addEventListener(`click`,e=>{e.target===t&&this.close()}),t.querySelector(`#rb-btn-close`)?.addEventListener(`click`,()=>this.close()),t.querySelector(`#rb-btn-new-draft`)?.addEventListener(`click`,()=>{this.resetDraft(),this.renderConditionRows()}),t.querySelector(`#rb-btn-add-condition`)?.addEventListener(`click`,()=>{this.syncConditionsFromDom(),this.draftConditions.push({field:`storey`,operator:`contains`,value:``,logic:this.draftConditions.length===0?`NEWSET`:`AND`,negate:!1,enabled:!0}),this.renderConditionRows()}),t.querySelector(`#rb-btn-test`)?.addEventListener(`click`,()=>void this.handleTestRule()),t.querySelector(`#rb-btn-save`)?.addEventListener(`click`,()=>void this.handleSave(!1)),t.querySelector(`#rb-btn-save-bind`)?.addEventListener(`click`,()=>void this.handleSave(!0))}populateTaskSelect(e){let t=this.modalEl?.querySelector(`#rb-bind-task-select`);if(!t)return;let n=r.getInstance().getTasksSorted();t.innerHTML=`<option value="">(None — Save Rule Only)</option>`;for(let r of n){let n=document.createElement(`option`);n.value=r.id,n.textContent=`${r.wbsCode?`[${r.wbsCode}] `:``}${r.name}`,e&&r.id===e&&(n.selected=!0),t.appendChild(n)}}renderSavedRulesList(){let e=this.modalEl?.querySelector(`#rb-saved-rules-list`);if(!e)return;let n=i.getInstance().getRules();if(n.length===0){e.innerHTML=`<div class="rb-empty">No saved dynamic rules yet. Build one below or import Navisworks XML.</div>`;return}e.innerHTML=n.map(e=>`
        <div class="rb-saved-item ${e.id===this.editingRuleId?`active`:``}" data-rule-id="${s(e.id)}">
          <div class="rb-saved-meta">
            <span class="rb-saved-name">${s(e.name)}</span>
            <span class="rb-saved-count">${e.conditions.length} cond.</span>
          </div>
          <div class="rb-saved-actions">
            <button type="button" class="btn-xs btn-outline rb-act-edit" data-rule-id="${s(e.id)}">Edit</button>
            <button type="button" class="btn-xs btn-outline rb-act-del" data-rule-id="${s(e.id)}">Del</button>
          </div>
        </div>`).join(``),e.querySelectorAll(`.rb-act-edit`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.ruleId;if(!t)return;let n=i.getInstance().getRule(t);n&&(this.loadRuleIntoForm(n),this.renderSavedRulesList(),this.renderConditionRows())})}),e.querySelectorAll(`.rb-act-del`).forEach(e=>{e.addEventListener(`click`,()=>{let n=e.dataset.ruleId;n&&(i.getInstance().deleteRule(n),this.editingRuleId===n&&this.resetDraft(),this.renderSavedRulesList(),this.renderConditionRows(),t(`Deleted search set rule`,`info`))})})}renderConditionRows(){let e=this.modalEl?.querySelector(`#rb-conditions-list`);e&&(e.innerHTML=this.draftConditions.map((e,t)=>{let n=a.map(t=>`<option value="${t.value}" ${e.field===t.value?`selected`:``}>${t.label}</option>`).join(``),r=o.map(t=>`<option value="${t.value}" ${e.operator===t.value?`selected`:``}>${t.label}</option>`).join(``),i=[`NEWSET`,`AND`,`OR`].map(t=>`<option value="${t}" ${e.logic===t?`selected`:``}>${t}</option>`).join(``),c=e.field===`pset`;return`
          <div class="rb-cond-row" data-idx="${t}">
            <select class="rb-cond-logic" aria-label="Condition Logic">${i}</select>
            <label class="rb-cond-neg" title="Negate condition">
              <input type="checkbox" class="rb-cond-negate" ${e.negate?`checked`:``} /> NOT
            </label>
            <select class="rb-cond-field" aria-label="Condition Field">${n}</select>
            ${c?`<input type="text" class="rb-cond-path gis-input" placeholder="Pset.Key" value="${s(e.propertyPath??``)}" aria-label="PropertySet Path" />`:``}
            <select class="rb-cond-op" aria-label="Condition Operator">${r}</select>
            <input type="text" class="rb-cond-val gis-input" placeholder="Value..." value="${s(String(e.value??``))}" aria-label="Condition Value" />
            <button type="button" class="btn-icon-sm rb-cond-remove" title="Remove Condition">✕</button>
          </div>
        `}).join(``),e.querySelectorAll(`.rb-cond-row`).forEach(e=>{let t=Number(e.dataset.idx);e.querySelector(`.rb-cond-field`)?.addEventListener(`change`,()=>{this.syncConditionsFromDom(),this.renderConditionRows()}),e.querySelector(`.rb-cond-remove`)?.addEventListener(`click`,()=>{this.syncConditionsFromDom(),this.draftConditions.splice(t,1),this.draftConditions.length===0&&this.draftConditions.push({field:`category`,operator:`contains`,value:``,logic:`NEWSET`,negate:!1,enabled:!0}),this.renderConditionRows()})}))}syncConditionsFromDom(){let e=this.modalEl?.querySelector(`#rb-conditions-list`);if(!e)return;let t=Array.from(e.querySelectorAll(`.rb-cond-row`));this.draftConditions=t.map(e=>{let t=e.querySelector(`.rb-cond-logic`)?.value||`AND`,n=!!e.querySelector(`.rb-cond-negate`)?.checked,r=e.querySelector(`.rb-cond-field`)?.value||`category`,i=e.querySelector(`.rb-cond-path`)?.value?.trim()||void 0,a=e.querySelector(`.rb-cond-op`)?.value||`contains`,o=e.querySelector(`.rb-cond-val`)?.value??``,s=Number(o);return{logic:t,negate:n,field:r,propertyPath:i,operator:a,value:[`gt`,`gte`,`lt`,`lte`].includes(a)&&o.trim()!==``&&Number.isFinite(s)?s:o,enabled:!0}})}buildDraftRule(){this.syncConditionsFromDom();let e=this.modalEl?.querySelector(`#rb-rule-name`)?.value.trim()||``;return{id:this.editingRuleId||`rule-${Date.now()}`,name:e||`Dynamic Rule ${new Date().toLocaleTimeString()}`,conditions:this.draftConditions.filter(e=>String(e.value).trim()!==``),updatedAt:new Date().toISOString()}}setTestOutput(e){let t=this.modalEl?.querySelector(`#rb-test-output`);t&&(t.innerHTML=e)}async handleTestRule(){let r=this.buildDraftRule();if(r.conditions.length===0){this.setTestOutput(`Add at least one non-empty condition value to test.`);return}let a=await i.getInstance().evaluateAgainstLoadedModels(r);if(this.setTestOutput(`Matched <strong>${a.matchedCount}</strong> element(s) across ${Object.keys(a.modelIdMap).length} model(s).`),a.matchedCount>0)try{await n.getInstance().components.get(e).highlightByID(`select`,a.modelIdMap,!0,!1)}catch{}t(`Rule "${r.name}": ${a.matchedCount} match(es)`,a.matchedCount>0?`success`:`info`)}async handleSave(e){let n=this.buildDraftRule();if(n.conditions.length===0){t(`Please enter a value in at least one condition`,`warning`);return}if(i.getInstance().upsertRule(n),this.editingRuleId=n.id,this.renderSavedRulesList(),e){let e=this.modalEl?.querySelector(`#rb-bind-task-select`)?.value||``;if(!e){t(`Rule saved. Select a 4D task to bind it.`,`info`);return}let a=await i.getInstance().evaluateAgainstLoadedModels(n),o=r.getInstance().bindSearchSetRuleToTask(e,n.id,a.modelIdMap);this.setTestOutput(`Saved <strong>${s(n.name)}</strong> &amp; bound to task (<strong>${o}</strong> elements linked).`),t(`Bound "${n.name}" to task (${o} elements)`,`success`),this.onBoundCallback?.(),typeof window.updateTimelineVisualState==`function`&&window.updateTimelineVisualState(!0)}else this.setTestOutput(`Saved rule <strong>${s(n.name)}</strong>.`),t(`Saved Search Set Rule "${n.name}"`,`success`)}};export{c as RuleBuilderModal};