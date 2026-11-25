import{parseCsvHeadersAndPreview as e,remapCsvColumns as t}from"./CsvSchedulePropertyLinker-D4nswwKB.js";function n(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function r(e,t){for(let n of t){let t=e.find(e=>n.test(e));if(t)return t}return``}function i(i){let{headers:a,previewRows:o}=e(i.csvText,4);return a.length===0?Promise.resolve(null):new Promise(e=>{document.getElementById(`csv-column-mapper-modal`)?.remove();let s=r(a,[/task.?name/i,/activity.?name/i,/^name$/i,/^task$/i,/wbs/i])||a[0],c=r(a,[/start.?date/i,/^start$/i,/planned.?start/i,/early.?start/i]),l=r(a,[/end.?date/i,/finish/i,/^end$/i,/planned.?end/i,/early.?finish/i]),u=r(a,[/total.?cost/i,/budget/i,/^cost$/i]),d=r(a,[/match.?val/i,/simulation/i,/code/i]),f=Array.from(new Set([`Text.SIMULATION`,`Storey`,`Category`,`Name`,`ObjectType`,`PredefinedType`,...i.availableProperties.map(e=>e.propertyName)])),p=(e,t,r=!0)=>`<select id="${e}" class="custom-select csv-mapper-select">${[...r?[`<option value="">(Auto / None)</option>`]:[],...a.map(e=>`<option value="${n(e)}" ${e===t?`selected`:``}>${n(e)}</option>`)].join(``)}</select>`,m=(e,t,r)=>`<select id="${e}" class="custom-select csv-mapper-select">${[`<option value="">${n(r)}</option>`,...f.map(e=>`<option value="${n(e)}" ${e===t?`selected`:``}>${n(e)}</option>`)].join(``)}</select>`,h=`
      <div class="csv-mapper-preview-wrap thin-scrollbar">
        <table class="csv-mapper-preview-table">
          <thead><tr>${a.map(e=>`<th>${n(e)}</th>`).join(``)}</tr></thead>
          <tbody>
            ${o.map(e=>`<tr>${a.map((t,r)=>`<td>${n(e[r]??``)}</td>`).join(``)}</tr>`).join(``)}
          </tbody>
        </table>
      </div>
    `,g=document.createElement(`div`);g.id=`csv-column-mapper-modal`,g.className=`modal-overlay open`,g.style.cssText=`position:fixed;inset:0;z-index:10050;background:rgba(5,7,12,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;`,g.innerHTML=`
      <div class="csv-mapper-dialog" style="background:var(--bg-panel,#12141c);border:1px solid var(--border-strong,#2e3346);border-radius:12px;width:min(760px,96vw);max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--border-subtle,#232635);">
          <div>
            <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary,#f8fafc);">CSV Column &amp; 3D Property Mapper</div>
            <div style="font-size:0.74rem;color:var(--text-muted,#94a3b8);">${n(i.filename)} • ${a.length} columns detected</div>
          </div>
          <button type="button" id="csv-mapper-close" class="btn-secondary" style="padding:0.25rem 0.6rem;">✕</button>
        </div>

        <div style="padding:1rem 1.1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.85rem;">
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:0.65rem;">
            <label class="csv-mapper-field">
              <span>Task Name Column *</span>
              ${p(`csv-map-taskname`,s,!1)}
            </label>
            <label class="csv-mapper-field">
              <span>Start Date Column</span>
              ${p(`csv-map-start`,c,!0)}
            </label>
            <label class="csv-mapper-field">
              <span>End Date Column</span>
              ${p(`csv-map-end`,l,!0)}
            </label>
            <label class="csv-mapper-field">
              <span>Cost / Budget Column</span>
              ${p(`csv-map-cost`,u,!0)}
            </label>
            <label class="csv-mapper-field">
              <span>Match Value Column</span>
              ${p(`csv-map-matchval`,d,!0)}
            </label>
          </div>

          <div style="padding:0.75rem;border:1px solid var(--border-subtle,#232635);border-radius:8px;background:rgba(212,255,63,0.03);">
            <div style="font-size:0.75rem;font-weight:700;color:var(--accent-400,#d4ff3f);margin-bottom:0.45rem;">
              3D Property Link Key (Single or Multi-Property Composite)
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.65rem;">
              <label class="csv-mapper-field">
                <span>Primary IFC Property</span>
                ${m(`csv-map-prop1`,``,`Auto-Match Any Property`)}
              </label>
              <label class="csv-mapper-field">
                <span>+ Secondary Composite Property (Optional)</span>
                ${m(`csv-map-prop2`,``,`None (Single Property)`)}
              </label>
            </div>
            <div style="font-size:0.69rem;color:var(--text-muted,#94a3b8);margin-top:0.35rem;">
              Tip: Select <strong>Storey</strong> + <strong>Category</strong> to link schedules like <code>Level 1 — IfcColumn</code> even without a Revit SIMULATION parameter.
            </div>
          </div>

          <div>
            <div style="font-size:0.72rem;font-weight:600;color:var(--text-secondary,#cbd5e1);margin-bottom:0.35rem;">CSV Preview (first ${o.length} rows)</div>
            ${h}
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:0.8rem 1.1rem;border-top:1px solid var(--border-subtle,#232635);">
          <button type="button" id="csv-mapper-cancel" class="btn-secondary">Cancel</button>
          <button type="button" id="csv-mapper-confirm" class="btn-primary">Import &amp; Link to 3D</button>
        </div>
      </div>
    `,document.body.appendChild(g);let _=t=>{g.remove(),e(t)};g.querySelector(`#csv-mapper-close`)?.addEventListener(`click`,()=>_(null)),g.querySelector(`#csv-mapper-cancel`)?.addEventListener(`click`,()=>_(null)),g.addEventListener(`click`,e=>{e.target===g&&_(null)}),g.querySelector(`#csv-mapper-confirm`)?.addEventListener(`click`,()=>{let e=e=>g.querySelector(`#${e}`)?.value||``,n=e(`csv-map-prop1`),r=e(`csv-map-prop2`),o=n&&r&&n!==r?[n,r]:void 0,s={taskName:e(`csv-map-taskname`)||a[0],startDate:e(`csv-map-start`)||void 0,endDate:e(`csv-map-end`)||void 0,totalCost:e(`csv-map-cost`)||void 0,matchValue:e(`csv-map-matchval`)||void 0,matchProperty:!o&&n?n:void 0,compositeProperties:o},c=t(i.csvText,s);_({remappedCsv:c,mapping:s})})})}function a(e){document.getElementById(`schedule-linkage-audit-modal`)?.remove();let{report:t}=e,r=document.createElement(`div`);r.id=`schedule-linkage-audit-modal`,r.className=`modal-overlay open`,r.style.cssText=`position:fixed;inset:0;z-index:10050;background:rgba(5,7,12,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;`;let i=t.unmatchedTasks.length===0?`<div style="font-size:0.75rem;color:var(--color-success,#10b981);">All geometric schedule tasks are linked to 3D elements.</div>`:t.unmatchedTasks.map(e=>`
          <div class="audit-row-item" data-task-id="${n(e.taskId)}">
            <span style="font-size:0.76rem;color:var(--text-primary,#f8fafc);">${n(e.taskName)}</span>
            <button type="button" class="btn-secondary btn-mark-resource" data-task-id="${n(e.taskId)}" style="font-size:0.66rem;padding:0.18rem 0.45rem;">
              Mark Resource
            </button>
          </div>`).join(``),a=t.resourceTasks.length===0?`<div style="font-size:0.74rem;color:var(--text-muted,#94a3b8);">None detected.</div>`:t.resourceTasks.map(e=>`
          <div class="audit-row-item">
            <span style="font-size:0.75rem;color:var(--text-secondary,#cbd5e1);">${n(e.taskName)}</span>
            <span style="font-size:0.66rem;color:var(--color-info,#38bdf8);padding:0.12rem 0.4rem;border-radius:4px;background:rgba(56,189,248,0.12);">${n(e.reason)}</span>
          </div>`).join(``),o=t.unscheduledByCategory.length===0?`<div style="font-size:0.75rem;color:var(--color-success,#10b981);">100% of physical 3D elements are scheduled!</div>`:t.unscheduledByCategory.slice(0,12).map(e=>`<span class="audit-cat-chip">${n(e.category)}: <strong>${e.count}</strong></span>`).join(``);r.innerHTML=`
    <div style="background:var(--bg-panel,#12141c);border:1px solid var(--border-strong,#2e3346);border-radius:12px;width:min(720px,96vw);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
      <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--border-subtle,#232635);">
        <div>
          <div style="font-weight:700;font-size:0.95rem;color:var(--text-primary,#f8fafc);">4D Schedule ↔ 3D Model Linkage Audit</div>
          <div style="font-size:0.74rem;color:var(--text-muted,#94a3b8);">${t.scheduledElementCount.toLocaleString()} / ${t.totalModelElements.toLocaleString()} physical 3D elements linked</div>
        </div>
        <button type="button" id="audit-modal-close" class="btn-secondary" style="padding:0.25rem 0.6rem;">✕</button>
      </div>

      <div style="padding:1rem 1.1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.9rem;">
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.55rem;">
          <div class="audit-kpi-card">
            <div class="audit-kpi-val" style="color:#10b981;">${t.matchedTasks.length}</div>
            <div class="audit-kpi-lbl">Matched Tasks</div>
          </div>
          <div class="audit-kpi-card">
            <div class="audit-kpi-val" style="color:#38bdf8;">${t.resourceTasks.length}</div>
            <div class="audit-kpi-lbl">Resource Tasks</div>
          </div>
          <div class="audit-kpi-card">
            <div class="audit-kpi-val" style="color:#f59e0b;">${t.unmatchedTasks.length}</div>
            <div class="audit-kpi-lbl">Unmatched Tasks</div>
          </div>
          <div class="audit-kpi-card">
            <div class="audit-kpi-val" style="color:${t.unscheduledElementCount>0?`#f43f5e`:`#10b981`};">${t.unscheduledElementCount.toLocaleString()}</div>
            <div class="audit-kpi-lbl">Unscheduled 3D</div>
          </div>
        </div>

        <div style="padding:0.75rem;border:1px solid var(--border-subtle,#232635);border-radius:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.45rem;">
            <span style="font-size:0.76rem;font-weight:700;color:var(--text-primary,#f8fafc);">Unscheduled 3D Elements by Category</span>
            <div style="display:flex;gap:0.4rem;">
              ${t.unscheduledElementCount>0?`<button type="button" id="btn-audit-isolate-unscheduled" class="btn-primary" style="font-size:0.72rem;padding:0.28rem 0.65rem;">Isolate ${t.unscheduledElementCount.toLocaleString()} Unscheduled in 3D</button>`:``}
              <button type="button" id="btn-audit-reset-isolation" class="btn-secondary" style="font-size:0.72rem;padding:0.28rem 0.6rem;">Reset View</button>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">${o}</div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
          <div style="padding:0.75rem;border:1px solid var(--border-subtle,#232635);border-radius:8px;max-height:220px;overflow-y:auto;">
            <div style="font-size:0.75rem;font-weight:700;color:#f59e0b;margin-bottom:0.4rem;">Unmatched Geometric Tasks (${t.unmatchedTasks.length})</div>
            <div style="display:flex;flex-direction:column;gap:0.3rem;">${i}</div>
          </div>
          <div style="padding:0.75rem;border:1px solid var(--border-subtle,#232635);border-radius:8px;max-height:220px;overflow-y:auto;">
            <div style="font-size:0.75rem;font-weight:700;color:#38bdf8;margin-bottom:0.4rem;">Non-Geometric / Resource Tasks (${t.resourceTasks.length})</div>
            <div style="display:flex;flex-direction:column;gap:0.3rem;">${a}</div>
          </div>
        </div>
      </div>
    </div>
  `,document.body.appendChild(r);let s=()=>r.remove();r.querySelector(`#audit-modal-close`)?.addEventListener(`click`,s),r.addEventListener(`click`,e=>{e.target===r&&s()}),r.querySelector(`#btn-audit-isolate-unscheduled`)?.addEventListener(`click`,async()=>{await e.onIsolateUnscheduled(t.unscheduledModelIdMaps),s()}),r.querySelector(`#btn-audit-reset-isolation`)?.addEventListener(`click`,async()=>{await e.onResetIsolation?.(),s()}),r.querySelectorAll(`.btn-mark-resource`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.dataset.taskId;n&&(e.onMarkResourceTask?.(n),t.textContent=`✓ Resource`,t.disabled=!0)})})}export{i as openCsvColumnMapperModal,a as openScheduleAuditModal};