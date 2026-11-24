import{t as e}from"./formatters-Cb-tA797.js";import{t}from"./DelayImpactEngine-_vPTSP2f.js";var n=864e5;function r(e,t){let r=new Date(e).getTime();return Number.isFinite(r)?new Date(r+t*n).toISOString().slice(0,10):e}function i(e){return{...e,elementIds:new Set(e.elementIds||[]),predecessors:e.predecessors?e.predecessors.map(e=>({...e})):void 0}}function a(e){let t=-1/0;for(let n of e){let e=new Date(n.actualEndDate||n.endDate).getTime();Number.isFinite(e)&&e>t&&(t=e)}return Number.isFinite(t)?new Date(t).toISOString().slice(0,10):`--`}function o(e,o,s,c,l=!0){let u=t.getInstance(),d=u.computeProjectDelayReport(e,c),f=a(e),p=e.map(i),m=new Map;for(let e of p)m.set(e.id,e);let h=m.get(o);if(!h||s===0)return{targetTaskId:o,targetTaskName:h?.name??o,delayDays:s,affectedTaskCount:0,baselineEndDate:f,simulatedEndDate:f,projectSlipDays:0,baselineCostImpact:d.totalCostImpact,simulatedCostImpact:d.totalCostImpact,deltaCostImpact:0,baselineSpi:d.spi,simulatedSpi:d.spi,simulatedTasks:p};let g=new Set([h.id]);if(h.actualStartDate=r(h.actualStartDate||h.startDate,s),h.actualEndDate=r(h.actualEndDate||h.endDate,s),l){let e=!0,t=0;for(;e&&t<20;){e=!1,t++;for(let t of p)g.has(t.id)||t.isSummary||(t.predecessors??[]).some(e=>g.has(e.predecessorId))&&(t.actualStartDate=r(t.actualStartDate||t.startDate,s),t.actualEndDate=r(t.actualEndDate||t.endDate,s),g.add(t.id),e=!0)}if(g.size===1&&s>0){let e=new Date(h.endDate).getTime();for(let t of p){if(g.has(t.id)||t.isSummary)continue;let i=new Date(t.startDate).getTime();Number.isFinite(i)&&i>=e-2*n&&(t.actualStartDate=r(t.actualStartDate||t.startDate,s),t.actualEndDate=r(t.actualEndDate||t.endDate,s),g.add(t.id))}}}for(let e of p){let t=u.computeTaskDelay(e);e.delayDays=t.delayDays,e.costImpact=t.totalCostImpact}let _=u.computeProjectDelayReport(p,c),v=a(p),y=new Date(f).getTime(),b=new Date(v).getTime(),x=Number.isFinite(y)&&Number.isFinite(b)?Math.round((b-y)/n):0;return{targetTaskId:o,targetTaskName:h.name,delayDays:s,affectedTaskCount:g.size,baselineEndDate:f,simulatedEndDate:v,projectSlipDays:x,baselineCostImpact:Math.round(d.totalCostImpact),simulatedCostImpact:Math.round(_.totalCostImpact),deltaCostImpact:Math.round(_.totalCostImpact-d.totalCostImpact),baselineSpi:d.spi,simulatedSpi:_.spi,simulatedTasks:p}}function s(t){document.getElementById(`whatif-sandbox-modal`)?.remove();let n=t.tasks.filter(e=>!e.isSummary);if(n.length===0)return;let r=n[0].id,i=14,a=!0,s=document.createElement(`div`);s.id=`whatif-sandbox-modal`,s.className=`modal-overlay open`,s.style.cssText=`position:fixed;inset:0;z-index:10065;background:rgba(5,7,12,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;`;let c=()=>{let l=o(t.tasks,r,i,t.evalDateMs,a),u=n.map(t=>`<option value="${e(t.id)}" ${t.id===r?`selected`:``}>${e(t.name)} (${e(t.startDate)})</option>`).join(``);s.innerHTML=`
      <div style="width:min(680px,96vw);border-radius:12px;border:1px solid var(--border-strong);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--studio-hairline);">
          <div>
            <div style="font-weight:750;font-size:0.95rem;">Live 4D/5D What-If Delay Scenario Sandbox</div>
            <div style="font-size:0.73rem;color:var(--text-muted);">Simulate schedule slip, CPM cascade, liquidated damages &amp; SPI impact (Undoable)</div>
          </div>
          <button type="button" id="wi-close" class="btn-secondary" style="padding:0.22rem 0.55rem;">✕</button>
        </div>

        <div style="padding:1rem 1.1rem;display:flex;flex-direction:column;gap:0.85rem;">
          <div style="display:grid;grid-template-columns:1fr 140px;gap:0.65rem;">
            <label class="csv-mapper-field">
              <span>Target Activity</span>
              <select id="wi-task-select" class="custom-select csv-mapper-select">${u}</select>
            </label>
            <label class="csv-mapper-field">
              <span>Delay Shift: <strong>${i>=0?`+`:``}${i}d</strong></span>
              <input type="range" id="wi-delay-slider" min="-14" max="60" value="${i}" />
            </label>
          </div>

          <label style="display:flex;align-items:center;gap:0.45rem;font-size:0.74rem;cursor:pointer;">
            <input type="checkbox" id="wi-cascade-check" ${a?`checked`:``} />
            <span>Cascade delay to downstream successor activities</span>
          </label>

          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;">
            <div class="audit-kpi-card">
              <div class="audit-kpi-val" style="color:${l.projectSlipDays>0?`var(--color-danger)`:`var(--color-success)`};">${l.projectSlipDays>=0?`+`:``}${l.projectSlipDays}d</div>
              <div class="audit-kpi-lbl">Completion Slip</div>
            </div>
            <div class="audit-kpi-card">
              <div class="audit-kpi-val" style="color:var(--color-warning);">${l.affectedTaskCount}</div>
              <div class="audit-kpi-lbl">Affected Tasks</div>
            </div>
            <div class="audit-kpi-card">
              <div class="audit-kpi-val" style="color:${l.deltaCostImpact>0?`var(--color-danger)`:`var(--color-success)`};">${l.deltaCostImpact>=0?`+`:`-`}$${Math.abs(l.deltaCostImpact).toLocaleString()}</div>
              <div class="audit-kpi-lbl">Cost Impact Δ</div>
            </div>
            <div class="audit-kpi-card">
              <div class="audit-kpi-val" style="color:var(--color-info);">${l.baselineSpi.toFixed(2)} → ${l.simulatedSpi.toFixed(2)}</div>
              <div class="audit-kpi-lbl">SPI Forecast</div>
            </div>
          </div>

          <div style="font-size:0.74rem;color:var(--text-muted);font-variant-numeric:tabular-nums;padding:0.5rem 0.65rem;border-radius:8px;background:var(--studio-surface-1);border:1px solid var(--studio-hairline);">
            Baseline Finish: <strong>${e(l.baselineEndDate)}</strong> &nbsp;→&nbsp; Simulated Finish: <strong style="color:var(--color-warning);">${e(l.simulatedEndDate)}</strong>
          </div>
        </div>

        <div style="display:flex;justify-content:flex-end;gap:0.5rem;padding:0.8rem 1.1rem;border-top:1px solid var(--studio-hairline);">
          <button type="button" id="wi-revert" class="btn-secondary">Cancel / Revert</button>
          <button type="button" id="wi-accept" class="btn-primary">Apply Scenario (Undoable)</button>
        </div>
      </div>
    `,s.querySelector(`#wi-close`)?.addEventListener(`click`,()=>s.remove()),s.querySelector(`#wi-revert`)?.addEventListener(`click`,()=>s.remove()),s.querySelector(`#wi-task-select`)?.addEventListener(`change`,e=>{r=e.target.value,c()}),s.querySelector(`#wi-delay-slider`)?.addEventListener(`input`,e=>{i=Number(e.target.value),c()}),s.querySelector(`#wi-cascade-check`)?.addEventListener(`change`,e=>{a=e.target.checked,c()}),s.querySelector(`#wi-accept`)?.addEventListener(`click`,async()=>{await t.onAcceptScenario(l),s.remove()})};s.addEventListener(`click`,e=>{e.target===s&&s.remove()}),document.body.appendChild(s),c()}export{s as openWhatIfSandboxModal,o as simulateTaskDelayScenario};