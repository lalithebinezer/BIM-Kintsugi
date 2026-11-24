import{t as e}from"./formatters-Cb-tA797.js";var t=864e5;function n(e,t){if(!t.elementIds||t.elementIds.size===0)return;let n=t.modelId||`default-model`,r=e[n]??=new Set;for(let e of t.elementIds)r.add(e)}function r(e,r,i=3){let a=Math.max(1,Math.min(12,Math.round(i))),o=r+7*t,s=r+a*7*t,c=[],l=[],u=[],d=[],f={completed:{},thisWeek:{},lookahead:{},future:{}};for(let t of e){if(t.isSummary||!t.startDate||!t.endDate)continue;let e=new Date(t.startDate).getTime(),i=new Date(t.endDate).getTime();!Number.isFinite(e)||!Number.isFinite(i)||(t.status===`Completed`||i<r?(c.push(t),n(f.completed,t)):e<=o&&i>=r?(l.push(t),n(f.thisWeek,t)):e<=s?(u.push(t),n(f.lookahead,t)):(d.push(t),n(f.future,t)))}return{anchorIso:new Date(r).toISOString().slice(0,10),horizonIso:new Date(s).toISOString().slice(0,10),weeks:a,completedTasks:c,thisWeekTasks:l,lookaheadTasks:u,futureTasks:d,buckets:f}}function i(e){let t=e=>{let t=String(e??``);return/[",\n\r]/.test(t)?`"${t.replace(/"/g,`""`)}"`:t},n=[`Window,TaskID,TaskName,StartDate,EndDate,Elements,TotalCost`];for(let r of e.thisWeekTasks)n.push([`THIS_WEEK`,r.id,r.name,r.startDate,r.endDate,r.elementIds?.size||0,r.totalCost||0].map(t).join(`,`));for(let r of e.lookaheadTasks)n.push([`NEXT_${e.weeks}_WEEKS`,r.id,r.name,r.startDate,r.endDate,r.elementIds?.size||0,r.totalCost||0].map(t).join(`,`));return n.join(`
`)}function a(t){document.getElementById(`lookahead-modal`)?.remove();let n=t.initialWeeks??3,a=document.createElement(`div`);a.id=`lookahead-modal`,a.className=`modal-overlay open`,a.style.cssText=`position:fixed;inset:0;z-index:10060;background:rgba(5,7,12,0.75);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;padding:1rem;`;let o=()=>{let s=r(t.tasks,t.anchorMs,n),c=(t,n)=>t.length===0?`<div style="font-size:0.73rem;color:var(--text-muted);">No tasks in this window.</div>`:t.slice(0,25).map(t=>`
            <div class="audit-row-item">
              <span style="font-size:0.74rem;font-weight:600;color:var(--text-primary);">${e(t.name)}</span>
              <span style="font-size:0.66rem;font-variant-numeric:tabular-nums;color:${n};">${e(t.startDate)} → ${e(t.endDate)} (${t.elementIds?.size||0})</span>
            </div>`).join(``);a.innerHTML=`
      <div style="width:min(740px,96vw);max-height:88vh;border-radius:12px;border:1px solid var(--border-strong);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:0.85rem 1.1rem;border-bottom:1px solid var(--studio-hairline);">
          <div>
            <div style="font-weight:750;font-size:0.95rem;">${n}-Week Construction Site Lookahead</div>
            <div style="font-size:0.73rem;color:var(--text-muted);font-variant-numeric:tabular-nums;">Window: ${e(s.anchorIso)} → ${e(s.horizonIso)}</div>
          </div>
          <div style="display:flex;gap:0.35rem;align-items:center;">
            ${[2,3,4,6].map(e=>`<button type="button" class="btn-secondary btn-la-weeks ${e===n?`active`:``}" data-weeks="${e}" style="font-size:0.7rem;padding:0.22rem 0.5rem;">${e}W</button>`).join(``)}
            <button type="button" id="la-close" class="btn-secondary" style="padding:0.22rem 0.55rem;">✕</button>
          </div>
        </div>

        <div class="thin-scrollbar" style="padding:0.95rem 1.1rem;overflow-y:auto;display:flex;flex-direction:column;gap:0.8rem;">
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;">
            <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--color-success);">${s.completedTasks.length}</div><div class="audit-kpi-lbl">Completed</div></div>
            <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--accent-500);">${s.thisWeekTasks.length}</div><div class="audit-kpi-lbl">This Week</div></div>
            <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--color-warning);">${s.lookaheadTasks.length}</div><div class="audit-kpi-lbl">Next ${n}W</div></div>
            <div class="audit-kpi-card"><div class="audit-kpi-val" style="color:var(--text-muted);">${s.futureTasks.length}</div><div class="audit-kpi-lbl">Later</div></div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.7rem;">
            <div style="padding:0.7rem;border:1px solid var(--studio-hairline);border-radius:8px;max-height:240px;overflow-y:auto;">
              <div style="font-size:0.73rem;font-weight:700;color:var(--accent-500);margin-bottom:0.4rem;">Active This Week (${s.thisWeekTasks.length})</div>
              <div style="display:flex;flex-direction:column;gap:0.28rem;">${c(s.thisWeekTasks,`var(--accent-500)`)}</div>
            </div>
            <div style="padding:0.7rem;border:1px solid var(--studio-hairline);border-radius:8px;max-height:240px;overflow-y:auto;">
              <div style="font-size:0.73rem;font-weight:700;color:var(--color-warning);margin-bottom:0.4rem;">Upcoming (${n}-Week Horizon: ${s.lookaheadTasks.length})</div>
              <div style="display:flex;flex-direction:column;gap:0.28rem;">${c(s.lookaheadTasks,`var(--color-warning)`)}</div>
            </div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;gap:0.5rem;padding:0.8rem 1.1rem;border-top:1px solid var(--studio-hairline);">
          <button type="button" id="la-export-csv" class="btn-secondary">Export Lookahead CSV</button>
          <div style="display:flex;gap:0.45rem;">
            <button type="button" id="la-clear-3d" class="btn-secondary">Clear 3D Filter</button>
            <button type="button" id="la-apply-3d" class="btn-primary">Highlight ${n}W Lookahead in 3D</button>
          </div>
        </div>
      </div>
    `,a.querySelector(`#la-close`)?.addEventListener(`click`,()=>a.remove()),a.querySelectorAll(`.btn-la-weeks`).forEach(e=>{e.addEventListener(`click`,()=>{n=Number(e.dataset.weeks)||3,o()})}),a.querySelector(`#la-apply-3d`)?.addEventListener(`click`,async()=>{await t.onApply3DLookahead(s),a.remove()}),a.querySelector(`#la-clear-3d`)?.addEventListener(`click`,async()=>{await t.onClearLookahead(),a.remove()}),a.querySelector(`#la-export-csv`)?.addEventListener(`click`,()=>{let e=i(s),t=new Blob([e],{type:`text/csv;charset=utf-8;`}),r=URL.createObjectURL(t),a=document.createElement(`a`);a.href=r,a.download=`BIM_Kintsugi_${n}W_Lookahead_${s.anchorIso}.csv`,a.click(),setTimeout(()=>URL.revokeObjectURL(r),4e3)})};a.addEventListener(`click`,e=>{e.target===a&&a.remove()}),document.body.appendChild(a),o()}export{r as computeLookaheadReport,i as exportLookaheadCsv,a as openLookaheadModal};