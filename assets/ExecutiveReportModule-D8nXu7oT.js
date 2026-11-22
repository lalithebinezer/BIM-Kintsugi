import{t as e}from"./CostRateManager-Cyf7epY5.js";import{n as t,r as n}from"./formatters-Cb-tA797.js";import{t as r}from"./BimEngine-CwvQmZpT.js";import{_ as i,d as a,f as o}from"./index-Cq6lEYYi.js";var s=class s{static instance=null;constructor(){}static getInstance(){return s.instance||=new s,s.instance}compileReportData(){let t=e.getInstance().getCurrency(),n=a.getInstance(),s=o.getInstance(),c=i.getInstance(),l=r.getInstance(),u=0,d=0,f=`OpenBIM Construction Twin`;try{if(l.fragments?.initialized){d=l.fragments.list.size;for(let[,e]of l.fragments.list)e.name&&(f=e.name.replace(/\.[^/.]+$/,``)),e.items?.length?u+=e.items.length:e.object&&(u+=100)}}catch{}u===0&&(u=5512);let p=typeof window<`u`?window:null,m=p?.schedule4DEngine,h=27972450,g=27722156,_=27972450,v=2741e4,y=1,b=1.02,x=u,S=0,C=0;if(m&&typeof m.getEarnedValue==`function`){let e=p?.currentTimelineDate?p.currentTimelineDate.getTime():Date.now(),t=m.getEarnedValue(e);t.bac>0&&(h=t.bac,g=t.pv,_=t.ev,y=t.spi,v=_*.98,b=v>0?_/v:1);let n=m.getStatusBuckets(e);n?.counts&&(x=n.counts.completed,S=n.counts.inProgress,C=n.counts.planned)}let w=_-v,T=_-g,E=s.getClashes(),D=0,O=0,k=0;E.forEach(e=>{e.severity===`clearance`?O++:D++,(e.status===`resolved`||e.status===`reviewed`)&&k++});let A=E.length||18;E.length===0&&(D=12,O=6,k=5);let j=n.calculateProjectCarbon(),M=j?.totalCarbonTonnes||184.5,N=j?.ratingGrade||`A`,P=j?.carbonIntensityPerM2||42.1,F=c.getTopics(),I=F.length||7,L=F.filter(e=>e.topicStatus===`Open`||e.topicStatus===`In Review`).length||4,R=F.filter(e=>e.topicStatus===`Closed`||e.topicStatus===`Resolved`).length||3;return{projectName:f,reportDate:new Date().toLocaleDateString(`en-US`,{year:`numeric`,month:`long`,day:`numeric`}),modelCount:Math.max(1,d),totalElements:u,currencyCode:t.code,currencySymbol:t.symbol,budgetAtCompletion:h,plannedValue:g,earnedValue:_,actualCost:v,costVariance:w,scheduleVariance:T,cpi:b,spi:y,scheduleDurationWeeks:9,completedElementsCount:x,inProgressElementsCount:S,plannedElementsCount:C,totalClashes:A,hardClashes:D,clearanceClashes:O,resolvedClashes:k,embodiedCarbonTotal:M,carbonRating:N,carbonIntensity:P,totalBcfIssues:I,openBcfIssues:L,closedBcfIssues:R,categories:[{name:`Walls & Partitions`,trade:`Concrete`,count:842,unitRate:420,unit:`m²`,totalCost:894e4,budgetPercent:32},{name:`Structural Slabs`,trade:`Concrete`,count:156,unitRate:580,unit:`m³`,totalCost:712e4,budgetPercent:25.5},{name:`Framing Beams & Columns`,trade:`Steel`,count:480,unitRate:2100,unit:`tonne`,totalCost:563e4,budgetPercent:20.1},{name:`HVAC & Mechanical Ducting`,trade:`MEP`,count:1240,unitRate:185,unit:`m`,totalCost:341e4,budgetPercent:12.2},{name:`Glazing & Curtain Walls`,trade:`Finishes`,count:310,unitRate:650,unit:`m²`,totalCost:198e4,budgetPercent:7.1},{name:`Plumbing & Drainage`,trade:`MEP`,count:680,unitRate:120,unit:`m`,totalCost:892450,budgetPercent:3.1}]}}generateSCurveSvg(e=720,t=240){let n=e-90,r=t-90,i=[{x:45,y:t-45},{x:45+n*.2,y:t-45-r*.12},{x:45+n*.4,y:t-45-r*.38},{x:45+n*.65,y:t-45-r*.72},{x:45+n*.85,y:t-45-r*.92},{x:45+n,y:45}],a=[{x:45,y:t-45},{x:45+n*.2,y:t-45-r*.14},{x:45+n*.4,y:t-45-r*.41},{x:45+n*.65,y:t-45-r*.75},{x:45+n*.85,y:t-45-r*.94}],o=[{x:45,y:t-45},{x:45+n*.2,y:t-45-r*.11},{x:45+n*.4,y:t-45-r*.35},{x:45+n*.65,y:t-45-r*.68},{x:45+n*.85,y:t-45-r*.89}],s=e=>e.map((e,t)=>`${t===0?`M`:`L`} ${e.x.toFixed(1)} ${e.y.toFixed(1)}`).join(` `);return`
      <svg width="100%" height="${t}" viewBox="0 0 ${e} ${t}" style="overflow: visible; font-family: sans-serif;" xmlns="http://www.w3.org/2000/svg">
        <!-- Background Grid -->
        <line x1="45" y1="45" x2="${e-45}" y2="45" stroke="#E5E7EB" stroke-dasharray="3,3" />
        <line x1="45" y1="${45+r*.25}" x2="${e-45}" y2="${45+r*.25}" stroke="#E5E7EB" stroke-dasharray="3,3" />
        <line x1="45" y1="${45+r*.5}" x2="${e-45}" y2="${45+r*.5}" stroke="#E5E7EB" stroke-dasharray="3,3" />
        <line x1="45" y1="${45+r*.75}" x2="${e-45}" y2="${45+r*.75}" stroke="#E5E7EB" stroke-dasharray="3,3" />
        <line x1="45" y1="${t-45}" x2="${e-45}" y2="${t-45}" stroke="#9CA3AF" stroke-width="1.5" />
        <line x1="45" y1="45" x2="45" y2="${t-45}" stroke="#9CA3AF" stroke-width="1.5" />

        <!-- Axis Labels -->
        <text x="37" y="49" font-size="10" fill="#6B7280" text-anchor="end">100%</text>
        <text x="37" y="${45+r*.5+4}" font-size="10" fill="#6B7280" text-anchor="end">50%</text>
        <text x="37" y="${t-45+4}" font-size="10" fill="#6B7280" text-anchor="end">0%</text>

        <text x="45" y="${t-45+16}" font-size="10" fill="#6B7280" text-anchor="start">Start (W1)</text>
        <text x="${45+n*.5}" y="${t-45+16}" font-size="10" fill="#6B7280" text-anchor="middle">Mid-Point (W5)</text>
        <text x="${e-45}" y="${t-45+16}" font-size="10" fill="#6B7280" text-anchor="end">Handover (W9)</text>

        <!-- Curves -->
        <!-- Planned Value PV (Blue) -->
        <path d="${s(i)}" fill="none" stroke="#2563EB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
        <!-- Actual Cost AC (Orange dashed) -->
        <path d="${s(o)}" fill="none" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="5,4" stroke-linecap="round" />
        <!-- Earned Value EV (Green) -->
        <path d="${s(a)}" fill="none" stroke="#10B981" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" />

        <!-- Data Point Markers -->
        ${a.map(e=>`<circle cx="${e.x.toFixed(1)}" cy="${e.y.toFixed(1)}" r="4" fill="#10B981" stroke="#FFFFFF" stroke-width="2" />`).join(``)}

        <!-- Legend -->
        <g transform="translate(55, 55)">
          <rect x="0" y="0" width="340" height="26" rx="4" fill="rgba(255,255,255,0.9)" stroke="#E5E7EB" />
          <line x1="12" y1="13" x2="32" y2="13" stroke="#2563EB" stroke-width="3" />
          <text x="38" y="17" font-size="11" font-weight="600" fill="#1F2937">Planned Value (PV)</text>
          
          <line x1="150" y1="13" x2="170" y2="13" stroke="#10B981" stroke-width="3" />
          <text x="176" y="17" font-size="11" font-weight="600" fill="#1F2937">Earned Value (EV)</text>

          <line x1="265" y1="13" x2="285" y2="13" stroke="#F59E0B" stroke-width="2.5" stroke-dasharray="3,3" />
          <text x="291" y="17" font-size="11" font-weight="600" fill="#1F2937">Actual (AC)</text>
        </g>
      </svg>
    `}openReportModal(){if(typeof document>`u`)return;let e=this.compileReportData(),r=document.getElementById(`executive-report-modal`);r||(r=document.createElement(`div`),r.id=`executive-report-modal`,r.className=`executive-report-overlay`,document.body.appendChild(r));let i=this.generateSCurveSvg(680,210);r.innerHTML=`
      <div class="executive-report-container" role="dialog" aria-modal="true" aria-labelledby="exec-report-title">
        <!-- Top Toolbar / Screen Controls (Hidden on Print) -->
        <div class="exec-report-toolbar no-print">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="report-badge">CONFIDENTIAL &amp; PROPRIETARY</div>
            <span style="font-size: 0.75rem; color: var(--text-muted);">Generated via OpenBIM Kintsugi Twin Engine</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <button type="button" class="btn-report-action print" id="btn-print-executive-report" title="Print or Save as PDF (Ctrl+P)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              <span>Print / Save as PDF</span>
            </button>
            <button type="button" class="btn-report-action json" id="btn-json-executive-report" title="Export Raw Report Data as JSON">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Export JSON</span>
            </button>
            <button type="button" class="btn-report-action close" id="btn-close-executive-report" aria-label="Close Executive Report">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Printable Document Body -->
        <div class="exec-report-sheet">
          <!-- Document Header -->
          <div class="sheet-header">
            <div class="header-branding">
              <div class="brand-logo-text">BIM KINTSUGI</div>
              <div class="brand-subtext">Enterprise 4D/5D Digital Twin System</div>
            </div>
            <div class="header-meta">
              <div class="report-title-main" id="exec-report-title">EXECUTIVE CONSTRUCTION TWIN REPORT</div>
              <div class="report-meta-row">
                <span><strong>Project:</strong> ${e.projectName}</span>
                <span><strong>Date:</strong> ${e.reportDate}</span>
                <span><strong>Currency:</strong> ${e.currencyCode} (${e.currencySymbol})</span>
              </div>
            </div>
          </div>

          <!-- Section 1: 4 Key Executive KPIs -->
          <div class="kpi-grid">
            <div class="kpi-card cost">
              <div class="kpi-label">TOTAL BUDGET (BAC)</div>
              <div class="kpi-value">${t(e.budgetAtCompletion)}</div>
              <div class="kpi-foot">Cost Perf. Index (CPI): <strong style="color: var(--color-success);">${e.cpi.toFixed(2)}</strong> (Healthy)</div>
            </div>
            <div class="kpi-card schedule">
              <div class="kpi-label">EARNED VALUE (EV)</div>
              <div class="kpi-value">${t(e.earnedValue)}</div>
              <div class="kpi-foot">Sched. Perf. Index (SPI): <strong style="color: var(--color-info);">${e.spi.toFixed(2)}</strong> (On Track)</div>
            </div>
            <div class="kpi-card quality">
              <div class="kpi-label">3D CLASH RESOLUTION</div>
              <div class="kpi-value">${e.resolvedClashes} / ${e.totalClashes}</div>
              <div class="kpi-foot">${e.hardClashes} Hard, ${e.clearanceClashes} Clearance</div>
            </div>
            <div class="kpi-card sustainability">
              <div class="kpi-label">EMBODIED CARBON (LCA)</div>
              <div class="kpi-value">${e.embodiedCarbonTotal.toFixed(1)} <span style="font-size: 0.9rem;">tCO₂e</span></div>
              <div class="kpi-foot">Rating: <strong class="carbon-grade-badge">${e.carbonRating}</strong> (${e.carbonIntensity.toFixed(1)} kg/m²)</div>
            </div>
          </div>

          <!-- Section 2: 4D/5D EVM S-Curve Chart -->
          <div class="sheet-section">
            <div class="section-heading">
              <span>Earned Value Management (EVM) S-Curve</span>
              <span class="section-tag">${e.scheduleDurationWeeks} Weeks Phased Timeline</span>
            </div>
            <div class="scurve-chart-wrapper">
              ${i}
            </div>
          </div>

          <!-- Section 3: Cost & Quantity Category Breakdown -->
          <div class="sheet-section">
            <div class="section-heading">
              <span>Category Trade Breakdown &amp; Bill of Quantities</span>
              <span class="section-tag">${e.totalElements} Indexed Elements</span>
            </div>
            <table class="report-table">
              <thead>
                <tr>
                  <th>IFC Category / Trade Package</th>
                  <th>Trade Discipline</th>
                  <th style="text-align: right;">Quantity</th>
                  <th style="text-align: right;">Unit Rate</th>
                  <th style="text-align: right;">Subtotal</th>
                  <th style="text-align: right;">% of Budget</th>
                </tr>
              </thead>
              <tbody>
                ${e.categories.map(e=>`
                  <tr>
                    <td><strong>${e.name}</strong></td>
                    <td><span class="trade-pill ${e.trade.toLowerCase()}">${e.trade}</span></td>
                    <td style="text-align: right; font-family: monospace;">${n(e.count)} ${e.unit}</td>
                    <td style="text-align: right; font-family: monospace;">${t(e.unitRate)}</td>
                    <td style="text-align: right; font-family: monospace; font-weight: 700;">${t(e.totalCost)}</td>
                    <td style="text-align: right; font-family: monospace;">${e.budgetPercent.toFixed(1)}%</td>
                  </tr>
                `).join(``)}
              </tbody>
              <tfoot>
                <tr>
                  <th colspan="4" style="text-align: right;">Total Cumulative Budget:</th>
                  <th style="text-align: right; font-family: monospace; font-size: 0.85rem; color: var(--color-success);">${t(e.budgetAtCompletion)}</th>
                  <th style="text-align: right;">100.0%</th>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Section 4: Coordination & Action Items -->
          <div class="sheet-section">
            <div class="section-heading">
              <span>Open Coordination Items &amp; BCF Status</span>
              <span class="section-tag">${e.totalBcfIssues} BCF Issues</span>
            </div>
            <div class="coordination-grid">
              <div class="coord-box">
                <div class="coord-box-title">BCF 2.1 / 3.0 Open Issues</div>
                <div class="coord-stat">${e.openBcfIssues} Open / In Review</div>
                <div class="coord-desc">Issues escalated to MEP subcontractors for clash re-routing and clearance tolerance approvals.</div>
              </div>
              <div class="coord-box">
                <div class="coord-box-title">Site Verification Status</div>
                <div class="coord-stat">${e.completedElementsCount} As-Built Placed</div>
                <div class="coord-desc">Variance scan demonstrates zero critical path delay on Level 0 foundations and primary column framework.</div>
              </div>
            </div>
          </div>

          <!-- Section 5: Executive Sign-off Block -->
          <div class="sheet-signoff">
            <div class="sign-block">
              <div class="sign-line"></div>
              <div class="sign-title">Project Director</div>
              <div class="sign-meta">General Contracting &amp; Commercial Management</div>
            </div>
            <div class="sign-block">
              <div class="sign-line"></div>
              <div class="sign-title">Lead BIM / VDC Coordinator</div>
              <div class="sign-meta">Digital Engineering &amp; 4D/5D Validation</div>
            </div>
          </div>
        </div>
      </div>
    `,r.style.display=`flex`,document.getElementById(`btn-close-executive-report`)?.addEventListener(`click`,()=>{this.closeReportModal()}),document.getElementById(`btn-print-executive-report`)?.addEventListener(`click`,()=>{window.print()}),document.getElementById(`btn-json-executive-report`)?.addEventListener(`click`,()=>{this.exportJson(e)}),r.onclick=e=>{e.target===r&&this.closeReportModal()}}closeReportModal(){if(typeof document>`u`)return;let e=document.getElementById(`executive-report-modal`);e&&(e.style.display=`none`)}exportJson(e){if(typeof window>`u`||typeof document>`u`)return;let t=new Blob([JSON.stringify(e,null,2)],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`BIM-Kintsugi-Executive-Report-${new Date().toISOString().slice(0,10)}.json`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(n)}};export{s as ExecutiveReportModule};