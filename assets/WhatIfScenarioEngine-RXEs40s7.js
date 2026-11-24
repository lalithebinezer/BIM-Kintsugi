import{t as e}from"./formatters-Cb-tA797.js";import{t}from"./DelayImpactEngine-_vPTSP2f.js";import{t as n}from"./UiPlatform-uPifq2Ni.js";var r=864e5;function i(e,t){let n=new Date(e).getTime();return Number.isFinite(n)?new Date(n+t*r).toISOString().slice(0,10):e}function a(e){return{...e,category:e.category||`General`,elementIds:new Set(e.elementIds||[]),predecessors:e.predecessors?e.predecessors.map(e=>({...e})):void 0,successors:e.successors?[...e.successors]:void 0}}function o(e){let t=-1/0;for(let n of e){let e=new Date(n.actualEndDate||n.endDate).getTime();Number.isFinite(e)&&e>t&&(t=e)}return Number.isFinite(t)?new Date(t).toISOString().slice(0,10):`--`}function s(e,n,s,c,l=!0){let u=t.getInstance(),d=u.computeProjectDelayReport(e,c),f=o(e),p=e.map(a),m=new Map;for(let e of p)m.set(e.id,e);let h=m.get(n);if(!h||s===0)return{targetTaskId:n,targetTaskName:h?.name??n,delayDays:s,affectedTaskCount:0,baselineEndDate:f,simulatedEndDate:f,projectSlipDays:0,baselineCostImpact:d.totalCostImpact,simulatedCostImpact:d.totalCostImpact,deltaCostImpact:0,baselineSpi:d.spi,simulatedSpi:d.spi,simulatedTasks:p};let g=new Set([h.id]);if(h.actualStartDate=i(h.actualStartDate||h.startDate,s),h.actualEndDate=i(h.actualEndDate||h.endDate,s),l){let e=!0,t=0;for(;e&&t<20;){e=!1,t++;for(let t of p)g.has(t.id)||t.isSummary||(t.predecessors??[]).some(e=>g.has(e.predecessorId))&&(t.actualStartDate=i(t.actualStartDate||t.startDate,s),t.actualEndDate=i(t.actualEndDate||t.endDate,s),g.add(t.id),e=!0)}if(g.size===1&&s>0){let e=new Date(h.endDate).getTime();for(let t of p){if(g.has(t.id)||t.isSummary)continue;let n=new Date(t.startDate).getTime();Number.isFinite(n)&&n>=e-2*r&&(t.actualStartDate=i(t.actualStartDate||t.startDate,s),t.actualEndDate=i(t.actualEndDate||t.endDate,s),g.add(t.id))}}}for(let e of p){let t=u.computeTaskDelay(e);e.delayDays=t.delayDays,e.costImpact=t.totalCostImpact}let _=u.computeProjectDelayReport(p,c),v=o(p),y=new Date(f).getTime(),b=new Date(v).getTime(),x=Number.isFinite(y)&&Number.isFinite(b)?Math.round((b-y)/r):0;return{targetTaskId:n,targetTaskName:h.name,delayDays:s,affectedTaskCount:g.size,baselineEndDate:f,simulatedEndDate:v,projectSlipDays:x,baselineCostImpact:Math.round(d.totalCostImpact),simulatedCostImpact:Math.round(_.totalCostImpact),deltaCostImpact:Math.round(_.totalCostImpact-d.totalCostImpact),baselineSpi:d.spi,simulatedSpi:_.spi,simulatedTasks:p}}function c(t){document.getElementById(`whatif-sandbox-modal`)?.remove();let r=t.tasks.filter(e=>!e.isSummary);if(r.length===0)return;let i=r[0].id,a=14,o=!0,c=r.map(t=>`<option value="${e(t.id)}" ${t.id===i?`selected`:``}>${e(t.name)} (${e(t.startDate)})</option>`).join(``),l=n({id:`whatif-sandbox-modal`,title:`Live 4D/5D What-If Delay Scenario Sandbox`,subtitle:`Simulate schedule slip, CPM cascade, liquidated damages &amp; SPI impact (Undoable)`,size:`md`,closeButtonId:`wi-close`,bodyHtml:`
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
        <label class="bk-field">
          <span class="bk-field__label">Target Activity</span>
          <select id="wi-task-select" class="bk-select">${c}</select>
        </label>
        <label class="bk-field">
          <span class="bk-field__label"><span>Delay Shift</span><strong id="wi-delay-label">+14d</strong></span>
          <input type="range" id="wi-delay-slider" class="bk-range" min="-14" max="60" value="${a}" />
        </label>
      </div>

      <label class="bk-checkbox-row">
        <input type="checkbox" id="wi-cascade-check" ${o?`checked`:``} />
        <span>Cascade delay to downstream successor activities</span>
      </label>

      <div class="bk-kpi-grid">
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" id="wi-kpi-slip">+0d</div>
          <div class="audit-kpi-lbl">Completion Slip</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" id="wi-kpi-affected" style="color:var(--bk-warning);">0</div>
          <div class="audit-kpi-lbl">Affected Tasks</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" id="wi-kpi-cost">$0</div>
          <div class="audit-kpi-lbl">Cost Impact Δ</div>
        </div>
        <div class="audit-kpi-card">
          <div class="audit-kpi-val" id="wi-kpi-spi" style="color:var(--bk-info);">1.00 → 1.00</div>
          <div class="audit-kpi-lbl">SPI Forecast</div>
        </div>
      </div>

      <div id="wi-finish-summary" class="bk-card" style="font-size:var(--bk-text-sm);color:var(--bk-text-muted);font-variant-numeric:tabular-nums;">
        Baseline Finish: <strong>--</strong> → Simulated Finish: <strong>--</strong>
      </div>
    `,footerHtml:`
      <button type="button" id="wi-revert" class="bk-btn bk-btn--secondary">Cancel / Revert</button>
      <button type="button" id="wi-accept" class="bk-btn bk-btn--primary">Apply Scenario (Undoable)</button>
    `}),u=l.overlay,d=s(t.tasks,i,a,t.evalDateMs,o),f=()=>{d=s(t.tasks,i,a,t.evalDateMs,o);let n=u.querySelector(`#wi-delay-label`);n&&(n.textContent=`${a>=0?`+`:``}${a}d`);let r=u.querySelector(`#wi-kpi-slip`);r&&(r.textContent=`${d.projectSlipDays>=0?`+`:``}${d.projectSlipDays}d`,r.style.color=d.projectSlipDays>0?`var(--bk-danger)`:`var(--bk-success)`);let c=u.querySelector(`#wi-kpi-affected`);c&&(c.textContent=String(d.affectedTaskCount));let l=u.querySelector(`#wi-kpi-cost`);l&&(l.textContent=`${d.deltaCostImpact>=0?`+`:`-`}$${Math.abs(d.deltaCostImpact).toLocaleString()}`,l.style.color=d.deltaCostImpact>0?`var(--bk-danger)`:`var(--bk-success)`);let f=u.querySelector(`#wi-kpi-spi`);f&&(f.textContent=`${d.baselineSpi.toFixed(2)} → ${d.simulatedSpi.toFixed(2)}`);let p=u.querySelector(`#wi-finish-summary`);p&&(p.innerHTML=`Baseline Finish: <strong>${e(d.baselineEndDate)}</strong> &nbsp;→&nbsp; Simulated Finish: <strong style="color:var(--bk-warning);">${e(d.simulatedEndDate)}</strong>`)};f(),u.querySelector(`#wi-revert`)?.addEventListener(`click`,()=>l.close()),u.querySelector(`#wi-task-select`)?.addEventListener(`change`,e=>{i=e.target.value,f()}),u.querySelector(`#wi-delay-slider`)?.addEventListener(`input`,e=>{a=Number(e.target.value),f()}),u.querySelector(`#wi-cascade-check`)?.addEventListener(`change`,e=>{o=e.target.checked,f()});let p=u.querySelector(`#wi-accept`);p?.addEventListener(`click`,async()=>{p&&(p.disabled=!0,p.textContent=`Applying...`);try{await t.onAcceptScenario(d),l.close()}catch(e){console.error(`Failed to apply What-If scenario:`,e),p&&(p.disabled=!1,p.textContent=`Apply Scenario (Undoable)`)}})}export{a as cloneScheduleTask,c as openWhatIfSandboxModal,s as simulateTaskDelayScenario};