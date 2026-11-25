import{t as e}from"./formatters-Cb-tA797.js";import{_ as t}from"./index-Cb3Ztnha.js";var n=864e5;function r(e,t){if(!t.elementIds||t.elementIds.size===0)return;let n=t.modelId||`default-model`,r=e[n]??=new Set;for(let e of t.elementIds)r.add(e)}function i(e,t,i=3){let a=Math.max(1,Math.min(12,Math.round(i))),o=t+7*n,s=t+a*7*n,c=[],l=[],u=[],d=[],f={completed:{},thisWeek:{},lookahead:{},future:{}};for(let n of e){if(n.isSummary||!n.startDate||!n.endDate)continue;let e=new Date(n.startDate).getTime(),i=new Date(n.endDate).getTime();!Number.isFinite(e)||!Number.isFinite(i)||(n.status===`Completed`||i<t?(c.push(n),r(f.completed,n)):e<=o&&i>=t?(l.push(n),r(f.thisWeek,n)):e<=s?(u.push(n),r(f.lookahead,n)):(d.push(n),r(f.future,n)))}return{anchorIso:new Date(t).toISOString().slice(0,10),horizonIso:new Date(s).toISOString().slice(0,10),weeks:a,completedTasks:c,thisWeekTasks:l,lookaheadTasks:u,futureTasks:d,buckets:f}}function a(e){let t=e=>{let t=String(e??``);return/[",\n\r]/.test(t)?`"${t.replace(/"/g,`""`)}"`:t},n=[`Window,TaskID,TaskName,StartDate,EndDate,Elements,TotalCost`];for(let r of e.thisWeekTasks)n.push([`THIS_WEEK`,r.id,r.name,r.startDate,r.endDate,r.elementIds?.size||0,r.totalCost||0].map(t).join(`,`));for(let r of e.lookaheadTasks)n.push([`NEXT_${e.weeks}_WEEKS`,r.id,r.name,r.startDate,r.endDate,r.elementIds?.size||0,r.totalCost||0].map(t).join(`,`));return n.join(`
`)}function o(n){let r=n.initialWeeks??3,o=()=>{let s=i(n.tasks,n.anchorMs,r),c=(t,n)=>t.length===0?`<div style="font-size:var(--bk-text-sm);color:var(--bk-text-muted);">No tasks in this window.</div>`:t.slice(0,25).map(t=>`
            <div class="audit-row-item">
              <span style="font-size:var(--bk-text-sm);font-weight:600;color:var(--bk-text);">${e(t.name)}</span>
              <span style="font-size:var(--bk-text-xs);font-variant-numeric:tabular-nums;color:${n};">${e(t.startDate)} → ${e(t.endDate)} (${t.elementIds?.size||0})</span>
            </div>`).join(``),l=t({id:`lookahead-modal`,title:`${r}-Week Construction Site Lookahead`,subtitle:`Window: ${e(s.anchorIso)} → ${e(s.horizonIso)}`,size:`lg`,closeButtonId:`la-close`,headerActionsHtml:`
        <div class="bk-seg">
          ${[2,3,4,6].map(e=>`<button type="button" class="bk-seg__btn btn-la-weeks ${e===r?`is-active`:``}" data-weeks="${e}">${e}W</button>`).join(``)}
        </div>
      `,bodyHtml:`
        <div class="bk-kpi-grid">
          <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--bk-success);">${s.completedTasks.length}</div><div class="audit-kpi-lbl">Completed</div></div>
          <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--bk-accent-text);">${s.thisWeekTasks.length}</div><div class="audit-kpi-lbl">This Week</div></div>
          <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--bk-warning);">${s.lookaheadTasks.length}</div><div class="audit-kpi-lbl">Next ${r}W</div></div>
          <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--bk-text-muted);">${s.futureTasks.length}</div><div class="audit-kpi-lbl">Later</div></div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
          <div class="bk-card" style="max-height:240px;overflow-y:auto;">
            <div style="font-size:var(--bk-text-sm);font-weight:700;color:var(--bk-accent-text);margin-bottom:6px;">Active This Week (${s.thisWeekTasks.length})</div>
            <div style="display:flex;flex-direction:column;gap:4px;">${c(s.thisWeekTasks,`var(--bk-accent-text)`)}</div>
          </div>
          <div class="bk-card" style="max-height:240px;overflow-y:auto;">
            <div style="font-size:var(--bk-text-sm);font-weight:700;color:var(--bk-warning);margin-bottom:6px;">Upcoming (${r}-Week Horizon: ${s.lookaheadTasks.length})</div>
            <div style="display:flex;flex-direction:column;gap:4px;">${c(s.lookaheadTasks,`var(--bk-warning)`)}</div>
          </div>
        </div>
      `,footerHtml:`
        <button type="button" id="la-export-csv" class="bk-btn bk-btn--secondary" style="margin-right:auto;">Export Lookahead CSV</button>
        <button type="button" id="la-clear-3d" class="bk-btn bk-btn--secondary">Clear 3D Filter</button>
        <button type="button" id="la-apply-3d" class="bk-btn bk-btn--primary">Highlight ${r}W Lookahead in 3D</button>
      `}),u=l.overlay;u.querySelectorAll(`.btn-la-weeks`).forEach(e=>{e.addEventListener(`click`,()=>{r=Number(e.dataset.weeks)||3,o()})}),u.querySelector(`#la-apply-3d`)?.addEventListener(`click`,async()=>{await n.onApply3DLookahead(s),l.close()}),u.querySelector(`#la-clear-3d`)?.addEventListener(`click`,async()=>{await n.onClearLookahead(),l.close()}),u.querySelector(`#la-export-csv`)?.addEventListener(`click`,()=>{let e=a(s),t=new Blob([e],{type:`text/csv;charset=utf-8;`}),n=URL.createObjectURL(t),i=document.createElement(`a`);i.href=n,i.download=`BIM_Kintsugi_${r}W_Lookahead_${s.anchorIso}.csv`,i.click(),setTimeout(()=>URL.revokeObjectURL(n),4e3)})};o()}export{i as computeLookaheadReport,a as exportLookaheadCsv,o as openLookaheadModal};