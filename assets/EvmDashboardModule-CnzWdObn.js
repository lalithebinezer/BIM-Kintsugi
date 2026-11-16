import{n as e}from"./formatters-CQVrRHL2.js";import{t}from"./ToastManager-Dwu0TdOf.js";import{c as n,o as r}from"./index-DTfHv0e0.js";var i=class i{static instance=null;delayEngine;simulatedDelayDays=0;activeEacModel=`composite`;chartViewMode=`scurve`;constructor(){this.delayEngine=n.getInstance()}static getInstance(){return i.instance||=new i,i.instance}setSimulatedDelayDays(e){this.simulatedDelayDays=Math.max(0,e)}getSimulatedDelayDays(){return this.simulatedDelayDays}getEffectiveTasks(e){let t=e??r.getInstance().getTasksSorted();if(this.simulatedDelayDays<=0)return t;let n=t.some(e=>e.isCritical===!0||e.totalFloat!==void 0&&e.totalFloat<=0);return t.map(e=>{let t=e.isCritical===!0||e.totalFloat!==void 0&&e.totalFloat<=0;return e.status!==`Completed`&&(!n||t)?{...e,delayDays:(e.delayDays||0)+this.simulatedDelayDays,isCritical:e.isCritical??!0}:e})}setActiveEacModel(e){this.activeEacModel=e}getActiveEacModel(){return this.activeEacModel}setChartViewMode(e){this.chartViewMode=e}getChartViewMode(){return this.chartViewMode}computeCumulativePvAt(e,t){let n=0;for(let r of e){let e=new Date(r.startDate).getTime(),i=new Date(r.endDate).getTime(),a=r.totalCost||(r.unitCost&&r.quantity?r.unitCost*r.quantity:0)||0;if(!(t<=e)){if(t>=i)n+=a;else{let r=Math.max(1,i-e),o=(t-e)/r;n+=a*o}}}return n}computeEarnedSchedule(e,t,n,r,i,a){let o=Math.max(1,Math.round((a-i)/864e5)),s=Math.max(0,Math.round((t-i)/864e5)),c=0;if(r>0&&n>0){if(n>=r)c=o;else{let t=i,r=a;for(let i=0;i<24;i++){let i=(t+r)/2;this.computeCumulativePvAt(e,i)<n?t=i:r=i}let o=(t+r)/2;c=Math.max(0,(o-i)/864e5)}}let l=Math.round((c-s)*10)/10;this.simulatedDelayDays>0&&(l=Math.round((l-this.simulatedDelayDays)*10)/10);let u=1;if(s>0){let e=Math.max(0,c-this.simulatedDelayDays);u=Math.round(e/s*100)/100}let d=Math.round(o/Math.max(.1,u));this.simulatedDelayDays>0&&(d+=this.simulatedDelayDays);let f=o-d,p=i+d*864e5,m=new Date(p).toISOString().split(`T`)[0];return{plannedDurationDays:o,actualTimeDays:s,earnedScheduleDays:Math.round(c*10)/10,scheduleVarianceTimeDays:l,schedulePerformanceIndexTime:u,estimatedDurationAtCompletionDays:d,timeVarianceAtCompletionDays:f,projectedFinishDateIso:m}}computeEacForecasts(e,t,n,r,i){let a=Math.max(0,e-t),o=Math.max(.05,r),s=Math.max(.05,i),c=r>0?e/o:e,l=e-c,u=a>0&&c-n>0?a/(c-n):1,d=n+a,f=e-d,p=a>0&&d-n>0?a/(d-n):1,m=n+a/Math.max(.05,o*s),h=e-m,g=a>0&&m-n>0?a/(m-n):1,_=n+a/Math.max(.05,.8*o+.2*s),v=e-_,y=a>0&&_-n>0?a/(_-n):1;return{typical:{model:`typical`,label:`Typical (Cumulative CPI)`,formula:`EAC = BAC / CPI`,description:`Assumes past cost efficiency will continue until completion.`,eacValue:Math.round(c),vacValue:Math.round(l),tcpiValue:Math.round(u*100)/100,isFeasible:u<=1.1},atypical:{model:`atypical`,label:`Atypical (Planned Rate)`,formula:`EAC = AC + (BAC - EV)`,description:`Assumes future variances will conform to original budget.`,eacValue:Math.round(d),vacValue:Math.round(f),tcpiValue:Math.round(p*100)/100,isFeasible:p<=1.1},composite:{model:`composite`,label:`Composite (CPI × SPI)`,formula:`EAC = AC + (BAC - EV) / (CPI × SPI)`,description:`Accounts for mutual compounding effect of schedule delay on project costs.`,eacValue:Math.round(m),vacValue:Math.round(h),tcpiValue:Math.round(g*100)/100,isFeasible:g<=1.1},weighted:{model:`weighted`,label:`Weighted (0.80 CPI + 0.20 SPI)`,formula:`EAC = AC + (BAC - EV) / (0.80·CPI + 0.20·SPI)`,description:`Defense/DOE standard weighted sensitivity forecast.`,eacValue:Math.round(_),vacValue:Math.round(v),tcpiValue:Math.round(y*100)/100,isFeasible:y<=1.1}}}evaluateAnsi748Thresholds(t,n,r,i,a,o,s,c){let l=[],u=r>0?o/r*100:0,d=n>0?a/n*100:0,f=Math.abs(o),p=Math.abs(a),m=Math.abs(u),h=Math.abs(d),g=m>=30&&f>=1e4,_=h>=30&&p>=1e4,v=g||_,y=m>=10&&f>=25e3,b=h>=10&&p>=25e3;return y||b?(y&&l.push(`Cost Variance (${u.toFixed(1)}%, ${e(o)}) breached Tier 2 (±10% / $25k).`),b&&l.push(`Schedule Variance (${d.toFixed(1)}%, ${e(a)}) breached Tier 2 (±10% / $25k).`),{tier1Breach:v,tier2Breach:!0,status:`VAR_TIER_2`,badgeText:`ANSI 748-B TIER 2 BREACH (VAR REQUIRED)`,badgeColor:`#ef4444`,varRequired:!0,reasons:l}):v?(g&&l.push(`Cost Variance (${u.toFixed(1)}%, ${e(o)}) breached Tier 1 (±30% / $10k).`),_&&l.push(`Schedule Variance (${d.toFixed(1)}%, ${e(a)}) breached Tier 1 (±30% / $10k).`),{tier1Breach:!0,tier2Breach:!1,status:`VAR_TIER_1`,badgeText:`ANSI 748-B TIER 1 BREACH (VAR REQUIRED)`,badgeColor:`#f59e0b`,varRequired:!0,reasons:l}):s<.95||c<.95?(l.push(`Performance indices below control limit (SPI: ${s.toFixed(2)}, CPI: ${c.toFixed(2)}).`),{tier1Breach:!1,tier2Breach:!1,status:`WATCH`,badgeText:`WATCH LIST (VARIANCE NOTICE)`,badgeColor:`#eab308`,varRequired:!1,reasons:l}):{tier1Breach:!1,tier2Breach:!1,status:`NORMAL`,badgeText:`ANSI 748-B COMPLIANT (ON TRACK)`,badgeColor:`#10b981`,varRequired:!1,reasons:[`Project performance operating within allowable ANSI/EIA 748-B variance parameters.`]}}computeApmBullsEye(e,t){let n=Math.sqrt((e-1)**2+(t-1)**2),r,i,a;e>=1&&t>=1?(r=`Q1`,i=`Quadrant I: Under Budget & Ahead of Schedule`,a=`Optimal execution efficiency. Project delivering ahead of plan with cost savings.`):e<1&&t>=1?(r=`Q2`,i=`Quadrant II: Under Budget & Behind Schedule`,a=`Favorable costs but milestone delivery is delayed. Risk of liquidated damages.`):e<1&&t<1?(r=`Q3`,i=`Quadrant III: Over Budget & Behind Schedule`,a=`Critical distress quadrant. Simultaneous cost overruns and construction slippage.`):(r=`Q4`,i=`Quadrant IV: Over Budget & Ahead of Schedule`,a=`Acceleration trade-off. Overtime expenditure or fast-tracking driving project ahead.`);let o,s;return n<=.1?(o=`Inner Ring (±10%)`,s=`#10b981`):n<=.2?(o=`Outer Ring (±20%)`,s=`#f59e0b`):(o=`Critical Variance (>20%)`,s=`#ef4444`),{quadrant:r,quadrantTitle:i,quadrantDescription:a,distanceFromTarget:Math.round(n*100)/100,toleranceZone:o,ringColor:s,spi:e,cpi:t}}computeEvmMetrics(e){let t=r.getInstance(),n=t.getTasksSorted(),i=e??Date.now(),a=t.getProjectDateRange(),o=i,s=i+864e5;a&&(o=a.min.getTime(),s=a.max.getTime(),e===void 0&&(i=o));let c=this.getEffectiveTasks(n),l=this.delayEngine.computeProjectDelayReport(c,i),u=l.totalPlannedCost,d=l.plannedValue,f=l.earnedValue,p=l.totalActualCost,m=l.scheduleVariance,h=l.costVariance,g=l.spi,_=l.cpi,v=this.computeEacForecasts(u,f,p,_,g),y=v[this.activeEacModel],b=y.eacValue,x=y.vacValue,S=Math.max(0,u-f),C=u-p,w=b-p,T=S>0&&C>0?S/C:S===0?1:9.99,E=S>0&&w>0?S/w:S===0?1:9.99,D=C>0&&T<=1.1,O=w>0&&E<=1.1,k=u>0?Math.min(100,Math.round(f/u*100)):0,A=new Date(i).toISOString().split(`T`)[0],j=this.computeEarnedSchedule(c,i,f,u,o,s),M=this.evaluateAnsi748Thresholds(u,d,f,p,m,h,g,_),N=this.computeApmBullsEye(g,_);return{simDateMs:i,simDateIso:A,bac:u,pv:d,ev:f,ac:p,sv:m,cv:h,spi:g,cpi:_,eac:b,vac:x,tcpi:Math.round(T*100)/100,tcpiBac:Math.round(T*100)/100,tcpiEac:Math.round(E*100)/100,tcpiBacFeasible:D,tcpiEacFeasible:O,progressPercent:k,prolongationCost:l.totalProlongationCost,penaltyCost:l.totalPenaltyCost,totalCostImpact:l.totalCostImpact,projectSlippageDays:l.projectSlippageDays,delayedCount:l.delayedCount,criticalDelayCount:l.criticalDelayCount,criticalTasksDelayed:l.criticalTasksDelayed,taskImpacts:l.taskImpacts,eacForecasts:v,activeEacModel:this.activeEacModel,earnedSchedule:j,ansiThresholds:M,apmBullsEye:N}}generateSCurveSeries(e=28,t,n){let i=r.getInstance(),a=n??i.getTasksSorted(),o=i.getProjectDateRange();if(!o||a.length===0)return{points:[],maxCost:0,minDateMs:0,maxDateMs:0};let s=o.min.getTime(),c=o.max.getTime(),l=Math.max(1,c-s)/Math.max(1,e-1),u=n||this.getEffectiveTasks(a),d=[],f=0;for(let n=0;n<e;n++){let e=s+n*l,r=this.delayEngine.computeProjectDelayReport(u,e),i=r.plannedValue,a=e<=(t??c)?r.earnedValue:0,o=e<=(t??c)?r.totalActualCost:0;i>f&&(f=i),a>f&&(f=a),o>f&&(f=o),d.push({dateMs:e,dateStr:new Date(e).toISOString().split(`T`)[0],pv:i,ev:a,ac:o})}return{points:d,maxCost:Math.max(1e3,f),minDateMs:s,maxDateMs:c}}render(t){if(!document.getElementById(`evm-panel`))return;let n=this.computeEvmMetrics(t),r=document.getElementById(`evm-status-badge`);r&&(r.style.borderColor=n.ansiThresholds.badgeColor,r.style.color=n.ansiThresholds.badgeColor,r.style.background=`${n.ansiThresholds.badgeColor}22`,r.textContent=`${n.ansiThresholds.badgeText} • SPI ${n.spi.toFixed(2)} | CPI ${n.cpi.toFixed(2)}`);let i=(e,t)=>{let n=document.getElementById(e);n&&(n.textContent=t)};i(`evm-val-bac`,e(n.bac)),i(`evm-val-pv`,e(n.pv)),i(`evm-val-ev`,e(n.ev)),i(`evm-val-ac`,e(n.ac));let a=document.getElementById(`evm-val-sv`);a&&(a.textContent=`${n.sv>=0?`+`:`−`}${e(Math.abs(n.sv))}`,a.style.color=n.sv>=0?`var(--color-success)`:`var(--color-danger)`);let o=document.getElementById(`evm-val-cv`);o&&(o.textContent=`${n.cv>=0?`+`:`−`}${e(Math.abs(n.cv))}`,o.style.color=n.cv>=0?`var(--color-success)`:`var(--color-danger)`),i(`evm-val-spi`,n.spi.toFixed(2)),i(`evm-val-cpi`,n.cpi.toFixed(2)),i(`evm-val-eac`,e(n.eac)),i(`evm-val-vac`,(n.vac>=0?`+`:`−`)+e(Math.abs(n.vac)));let s=document.getElementById(`evm-val-vac`);s&&(s.style.color=n.vac>=0?`var(--color-success)`:`var(--color-danger)`),i(`evm-val-tcpi`,n.tcpiBac>9?`Infeasible (>2.0)`:n.tcpiBac.toFixed(2));let c=document.getElementById(`evm-tcpi-bac-pill`);c&&(c.textContent=`BAC: ${n.tcpiBac>9?`∞`:n.tcpiBac.toFixed(2)} (${n.tcpiBacFeasible?`Feasible`:`High Risk`})`,c.style.color=n.tcpiBacFeasible?`var(--color-success)`:`var(--color-danger)`);let l=document.getElementById(`evm-tcpi-eac-pill`);l&&(l.textContent=`EAC: ${n.tcpiEac>9?`∞`:n.tcpiEac.toFixed(2)} (${n.tcpiEacFeasible?`Feasible`:`High Risk`})`,l.style.color=n.tcpiEacFeasible?`var(--color-success)`:`var(--color-danger)`),i(`evm-val-progress`,`${n.progressPercent}%`),i(`evm-val-es-svt`,`${n.earnedSchedule.scheduleVarianceTimeDays>=0?`+`:``}${n.earnedSchedule.scheduleVarianceTimeDays}d`);let u=document.getElementById(`evm-val-es-svt`);u&&(u.style.color=n.earnedSchedule.scheduleVarianceTimeDays>=0?`var(--color-success)`:`var(--color-danger)`),i(`evm-val-es-spit`,n.earnedSchedule.schedulePerformanceIndexTime.toFixed(2)),i(`evm-val-es-eact`,`${n.earnedSchedule.estimatedDurationAtCompletionDays}d`),i(`evm-val-es-target-finish`,n.earnedSchedule.projectedFinishDateIso);let d=document.getElementById(`evm-var-alert-banner`);if(d){if(n.ansiThresholds.varRequired){d.classList.remove(`hidden`),d.style.display=`flex`,d.style.borderColor=n.ansiThresholds.badgeColor,d.style.background=`${n.ansiThresholds.badgeColor}18`;let e=document.getElementById(`evm-var-banner-title`),t=document.getElementById(`evm-var-banner-desc`);e&&(e.textContent=n.ansiThresholds.badgeText),t&&(t.textContent=n.ansiThresholds.reasons.join(` `))}else d.classList.add(`hidden`),d.style.display=`none`}i(`evm-val-slippage`,`${n.projectSlippageDays>0?`+`:``}${n.projectSlippageDays} Days`),i(`evm-val-prolongation`,e(n.prolongationCost)),i(`evm-val-penalties`,e(n.penaltyCost)),i(`evm-val-total-impact`,e(n.totalCostImpact));let f=document.getElementById(`select-evm-eac-model`);f&&f.value!==this.activeEacModel&&(f.value=this.activeEacModel);let p=document.getElementById(`evm-eac-formula-desc`);if(p){let e=n.eacForecasts[this.activeEacModel];p.textContent=`${e.formula} • ${e.description}`}let m=document.getElementById(`evm-chart-viewport`)?`evm-chart-viewport`:`evm-scurve-chart-container`;this.chartViewMode===`scurve`?this.renderSCurveSVG(m,n.simDateMs):this.renderBullsEyeSVG(m,n),this.renderDelayedTasksTable(`evm-delayed-tasks-container`,n.criticalTasksDelayed)}renderSCurveSVG(e,t){let n=document.getElementById(e);if(!n)return;let{points:r,maxCost:i,minDateMs:a,maxDateMs:o}=this.generateSCurveSeries(28,t);if(r.length===0||i===0){n.innerHTML=`
        <div style="font-size: 0.65rem; color: var(--text-muted); text-align: center; padding: 1.5rem; border: 1px dashed var(--border-subtle); border-radius: 6px;">
          Awaiting schedule or model loading to compute EVM S-Curve.
        </div>
      `;return}let s=e=>36+(e-a)/Math.max(1,o-a)*310,c=e=>123-e/i*107,l=r.map(e=>`${s(e.dateMs).toFixed(1)},${c(e.pv).toFixed(1)}`).join(` L `),u=r.filter(e=>e.ev>0).map(e=>`${s(e.dateMs).toFixed(1)},${c(e.ev).toFixed(1)}`).join(` L `),d=r.filter(e=>e.ac>0).map(e=>`${s(e.dateMs).toFixed(1)},${c(e.ac).toFixed(1)}`).join(` L `),f=t?s(t):36;n.innerHTML=`
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.6rem; position: relative;">
        <!-- Header Legend -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; font-size: 0.62rem; font-weight: 700;">
          <span style="color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">EVM Cumulative S-Curve</span>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <span style="color: var(--color-info); display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: var(--color-info);"></span>PV</span>
            <span style="color: var(--color-success); display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: var(--color-success);"></span>EV</span>
            <span style="color: var(--color-warning); display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: var(--color-warning);"></span>AC</span>
            <span style="color: var(--accent-primary); display: flex; align-items: center; gap: 0.2rem;"><span style="width: 2px; height: 8px; background: var(--accent-primary);"></span>Now</span>
          </div>
        </div>

        <!-- SVG Chart -->
        <svg viewBox="0 0 360 145" width="100%" height="145" style="overflow: visible;">
          <!-- Horizontal Grid Lines -->
          <line x1="36" y1="16" x2="346" y2="16" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          <line x1="36" y1="69.5" x2="346" y2="69.5" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          <line x1="36" y1="123" x2="346" y2="123" stroke="rgba(255,255,255,0.18)" />

          <!-- Y-Axis Ticks -->
          <text x="32" y="20" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">${(i/1e6).toFixed(1)}M</text>
          <text x="32" y="72.5" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">${(i*.5/1e6).toFixed(1)}M</text>
          <text x="32" y="123" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">0</text>

          <!-- Planned Value (PV) Curve -->
          <path d="M ${l}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />

          <!-- Actual Cost (AC) Curve -->
          ${d?`<path d="M ${d}" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="3,2" />`:``}

          <!-- Earned Value (EV) Curve -->
          ${u?`<path d="M ${u}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" />`:``}

          <!-- Current Simulation Scrub Line -->
          ${t?`
            <line x1="${f}" y1="16" x2="${f}" y2="123" stroke="#d4ff3f" stroke-width="1.5" stroke-dasharray="2,2" />
            <circle cx="${f}" cy="123" r="3" fill="#d4ff3f" />
          `:``}
        </svg>
      </div>
    `}renderBullsEyeSVG(e,t){let n=document.getElementById(e);if(!n)return;let r=.6,i=1.4,a=.7999999999999999,o=e=>32+(Math.max(r,Math.min(i,e))-r)/a*304,s=e=>182-(Math.max(r,Math.min(i,e))-r)/a*158,c=o(1),l=s(1),u=o(t.spi),d=s(t.cpi);n.innerHTML=`
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.6rem; position: relative;">
        <!-- Header Legend -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; font-size: 0.62rem; font-weight: 700;">
          <span style="color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">APM Bulls-Eye Quadrant Matrix</span>
          <div style="display: flex; gap: 0.45rem; align-items: center; font-size: 0.58rem;">
            <span style="color: var(--color-success); font-weight: 800;">Target (1.0, 1.0)</span>
            <span style="color: ${t.apmBullsEye.ringColor}; font-weight: 800; background: ${t.apmBullsEye.ringColor}22; padding: 1px 5px; border-radius: 3px;">
              ${t.apmBullsEye.toleranceZone}
            </span>
          </div>
        </div>

        <!-- SVG Matrix Plot -->
        <svg viewBox="0 0 360 210" width="100%" height="210" style="overflow: visible;">
          <defs>
            <radialGradient id="target-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
            </radialGradient>
            <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Quadrant Background Tints -->
          <!-- Q1: Top-Right (SPI >= 1, CPI >= 1) - Green (Ahead & Under Budget) -->
          <rect x="${c}" y="24" width="152" height="79" fill="rgba(16, 185, 129, 0.08)" />
          <!-- Q2: Top-Left (SPI < 1, CPI >= 1) - Yellow (Behind & Under Budget) -->
          <rect x="32" y="24" width="152" height="79" fill="rgba(245, 158, 11, 0.07)" />
          <!-- Q3: Bottom-Left (SPI < 1, CPI < 1) - Red (Behind & Over Budget) -->
          <rect x="32" y="${l}" width="152" height="79" fill="rgba(239, 68, 68, 0.12)" />
          <!-- Q4: Bottom-Right (SPI >= 1, CPI < 1) - Orange (Ahead & Over Budget) -->
          <rect x="${c}" y="${l}" width="152" height="79" fill="rgba(249, 115, 22, 0.08)" />

          <!-- Concentric Tolerance Rings around (1.0, 1.0) -->
          <circle cx="${c}" cy="${l}" r="76.00000000000001" fill="none" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3" opacity="0.45" />
          <circle cx="${c}" cy="${l}" r="38.00000000000001" fill="url(#target-glow)" stroke="#10b981" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.75" />

          <!-- Center Crosshairs (1.0, 1.0) -->
          <line x1="32" y1="${l}" x2="336" y2="${l}" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" />
          <line x1="${c}" y1="24" x2="${c}" y2="182" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" />

          <!-- Quadrant Text Labels -->
          <text x="332" y="36" font-size="6.5" font-weight="700" fill="#10b981" text-anchor="end">Q1: Ahead & Under Budget</text>
          <text x="36" y="36" font-size="6.5" font-weight="700" fill="#f59e0b" text-anchor="start">Q2: Behind & Under Budget</text>
          <text x="36" y="176" font-size="6.5" font-weight="700" fill="#ef4444" text-anchor="start">Q3: CRITICAL DISTRESS</text>
          <text x="332" y="176" font-size="6.5" font-weight="700" fill="#f97316" text-anchor="end">Q4: Ahead & Over Budget</text>

          <!-- Axis Tick Marks & Labels -->
          <text x="${c}" y="18" font-size="7" font-weight="800" fill="#94a3b8" text-anchor="middle">CPI ↑ (Cost Performance)</text>
          <text x="338" y="${l+3}" font-size="7" font-weight="800" fill="#94a3b8" text-anchor="start">SPI →</text>
          <text x="${c+4}" y="${l-4}" font-size="7" font-weight="800" fill="#ffffff">1.0</text>

          <text x="${o(.8)}" y="193" font-size="6.5" fill="#64748b" text-anchor="middle">0.8</text>
          <text x="${o(1.2)}" y="193" font-size="6.5" fill="#64748b" text-anchor="middle">1.2</text>
          <text x="28" y="${s(.8)+3}" font-size="6.5" fill="#64748b" text-anchor="end">0.8</text>
          <text x="28" y="${s(1.2)+3}" font-size="6.5" fill="#64748b" text-anchor="end">1.2</text>

          <!-- Current Project Performance Marker -->
          <circle cx="${u}" cy="${d}" r="6" fill="${t.apmBullsEye.ringColor}" filter="url(#node-glow)" opacity="0.85" />
          <circle cx="${u}" cy="${d}" r="3" fill="#ffffff" />
          <line x1="${c}" y1="${l}" x2="${u}" y2="${d}" stroke="${t.apmBullsEye.ringColor}" stroke-width="1.5" stroke-dasharray="2,2" />

          <!-- Marker Badge -->
          <rect x="${Math.min(271,Math.max(34,u-32))}" y="${d-18<24?d+8:d-18}" width="64" height="12" rx="3" fill="#09090b" stroke="${t.apmBullsEye.ringColor}" stroke-width="1" />
          <text x="${Math.min(271,Math.max(34,u-32))+32}" y="${(d-18<24?d+8:d-18)+9}" font-size="6" font-weight="800" fill="#ffffff" text-anchor="middle">
            SPI ${t.spi.toFixed(2)} | CPI ${t.cpi.toFixed(2)}
          </text>
        </svg>

        <!-- Quadrant Description Footer -->
        <div style="font-size: 0.58rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.3; background: var(--bg-hover); padding: 0.3rem 0.45rem; border-radius: 4px; border-left: 2px solid ${t.apmBullsEye.ringColor};">
          <strong style="color: var(--text-primary);">${t.apmBullsEye.quadrantTitle}</strong>: ${t.apmBullsEye.quadrantDescription} (Offset distance: ${t.apmBullsEye.distanceFromTarget}).
        </div>
      </div>
    `}renderDelayedTasksTable(t,n){let r=document.getElementById(t);if(r){if(n.length===0){r.innerHTML=`
        <div style="font-size: 0.62rem; color: var(--color-success); background: var(--color-success-subtle); border: 1px solid var(--color-success-border); padding: 0.5rem 0.6rem; border-radius: 6px; display: flex; align-items: center; gap: 0.35rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>
          <span>All critical path construction activities are operating on schedule. Zero delay exposure detected.</span>
        </div>
      `;return}r.innerHTML=`
      <div style="display: flex; flex-direction: column; gap: 0.35rem; width: 100%;">
        ${n.slice(0,5).map(t=>`
            <div style="background: var(--bg-card); border-left: 3px solid var(--color-danger); border: 1px solid var(--border-subtle); border-left-width: 3px; border-left-color: var(--color-danger); border-radius: 4px; padding: 0.35rem 0.5rem; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; flex-direction: column; gap: 0.1rem; overflow: hidden; max-width: 65%;">
                <span style="font-size: 0.68rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${t.taskName}</span>
                <span style="font-size: 0.58rem; color: var(--text-muted);">Target End: ${t.plannedEndDate} • CPM Critical</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem;">
                <span style="font-size: 0.62rem; font-weight: 800; color: var(--color-danger); background: var(--color-danger-subtle); padding: 1px 4px; border-radius: 2px;">+${t.delayDays}d Delayed</span>
                <span style="font-size: 0.58rem; color: var(--text-muted); font-family: var(--font-mono);">${e(t.totalCostImpact)} Exp</span>
              </div>
            </div>
          `).join(``)}
      </div>
    `}}exportEvmAuditCsv(e){let n=this.computeEvmMetrics(e),r=[`TaskID`,`TaskName`,`Category`,`PlannedStartDate`,`PlannedEndDate`,`ActualStartDate`,`ActualEndDate`,`PlannedDurationDays`,`ActualDurationDays`,`DelayDays`,`Status`,`IsCritical`,`TotalFloat`,`PlannedCost_BAC`,`ActualCost_AC`,`ProlongationCost`,`PenaltyCost`,`TotalFinancialExposure`],i=n.taskImpacts.map(e=>[`"${e.taskId}"`,`"${e.taskName.replace(/"/g,`""`)}"`,`"${e.category}"`,`"${e.plannedStartDate}"`,`"${e.plannedEndDate}"`,`"${e.actualStartDate||``}"`,`"${e.actualEndDate||``}"`,e.plannedDurationDays,e.actualDurationDays||``,e.delayDays,`"${e.status}"`,e.isCritical?`YES`:`NO`,e.totalFloat,e.plannedCost,e.actualCost,e.prolongationCost,e.penaltyCost,e.totalCostImpact]),a=[r.join(`,`),...i.map(e=>e.join(`,`))].join(`\r
`),o=new Blob([a],{type:`text/csv;charset=utf-8;`}),s=URL.createObjectURL(o),c=document.createElement(`a`);c.href=s,c.download=`BIM_EVM_Audit_${n.simDateIso}_${Date.now()}.csv`,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(s),t(`✓ Exported EVM Audit Ledger (${n.taskImpacts.length} activities)`,`success`)}exportCprFormat1Csv(e){let n=this.computeEvmMetrics(e),r=[`WBS_Element_ID`,`WBS_Description`,`Discipline`,`Status`,`Planned_Start`,`Planned_Finish`,`Baseline_BAC`,`Planned_Value_PV`,`Earned_Value_EV`,`Actual_Cost_AC`,`Schedule_Variance_SV`,`Cost_Variance_CV`,`SV_Percent`,`CV_Percent`,`SPI`,`CPI`,`EAC_Typical`,`EAC_Composite`,`Forecast_VAC`,`ANSI_748_Threshold_Status`],i=n.taskImpacts.map(e=>{let t=e.actualEndDate||e.actualCost>=e.plannedCost?e.plannedCost:e.status===`Ahead`||e.status===`On Schedule`?e.plannedCost*.75:e.status===`Delayed`?e.plannedCost*.4:e.plannedCost*.2,n=e.plannedCost,r=e.actualCost,i=t-n,a=t-r,o=n>0?(i/n*100).toFixed(1):`0.0`,s=t>0?(a/t*100).toFixed(1):`0.0`,c=n>0?(t/n).toFixed(2):`1.00`,l=r>0?(t/r).toFixed(2):`1.00`,u=Math.abs(Number(s))>=10&&Math.abs(a)>=25e3,d=Math.abs(Number(s))>=30&&Math.abs(a)>=1e4,f=u?`TIER 2 VAR REQUIRED`:d?`TIER 1 VAR REQUIRED`:`OK`,p=Math.max(.05,Number(l)),m=Math.max(.05,Number(c)),h=Math.round(e.plannedCost/p),g=Math.round(r+Math.max(0,e.plannedCost-t)/Math.max(.05,p*m)),_=e.plannedCost-g;return[`"${e.taskId}"`,`"${e.taskName.replace(/"/g,`""`)}"`,`"${e.category}"`,`"${e.status}"`,`"${e.plannedStartDate}"`,`"${e.plannedEndDate}"`,e.plannedCost,n,t,r,i,a,`"${o}%"`,`"${s}%"`,c,l,h,g,_,`"${f}"`]}),a=[r.join(`,`),...i.map(e=>e.join(`,`))].join(`\r
`),o=new Blob([a],{type:`text/csv;charset=utf-8;`}),s=URL.createObjectURL(o),c=document.createElement(`a`);c.href=s,c.download=`CPR_Format1_WBS_Summary_${n.simDateIso}_${Date.now()}.csv`,document.body.appendChild(c),c.click(),document.body.removeChild(c),URL.revokeObjectURL(s),t(`✓ Exported ANSI 748-B CPR Format 1 (${n.taskImpacts.length} WBS elements)`,`success`)}generateCprFormat5Report(t){let n=this.computeEvmMetrics(t),r=n.ev>0?(n.cv/n.ev*100).toFixed(1):`0.0`,i=n.pv>0?(n.sv/n.pv*100).toFixed(1):`0.0`;return`
================================================================================
     CONTRACT PERFORMANCE REPORT (CPR) FORMAT 5 — VARIANCE ANALYSIS REPORT (VAR)
     Standard: ANSI/EIA 748-B Earned Value Management System (EVMS)
================================================================================

1. PROJECT & REPORT IDENTIFICATION
--------------------------------------------------------------------------------
Project Name:       BIM Kintsugi Digital Twin & Construction Operations
Reporting Period:   Through ${n.simDateIso}
Control Account:    CA-001 (Structural, Architectural & MEP Execution)
CAM / Author:       Project Controls & BIM Management Office
Classification:     OFFICIAL PROJECT RECORD / PROPRIETARY

2. QUANTITATIVE VARIANCE SUMMARY
--------------------------------------------------------------------------------
Metric                              Value           Variance / %
--------------------------------------------------------------------------------
Budget at Completion (BAC):         ${e(n.bac).padEnd(16)} Baseline Total
Planned Value (PV / BCWS):          ${e(n.pv).padEnd(16)} Planned to Date
Earned Value (EV / BCWP):           ${e(n.ev).padEnd(16)} Work Accomplished (${n.progressPercent}%)
Actual Cost (AC / ACWP):            ${e(n.ac).padEnd(16)} Incurred to Date
Schedule Variance (SV):             ${e(n.sv).padEnd(16)} ${i}%
Cost Variance (CV):                 ${e(n.cv).padEnd(16)} ${r}%
Schedule Performance Index (SPI):   ${n.spi.toFixed(2).padEnd(16)} [Threshold: >= 1.00]
Cost Performance Index (CPI):       ${n.cpi.toFixed(2).padEnd(16)} [Threshold: >= 1.00]
Active Forecast Model:              ${n.eacForecasts[n.activeEacModel].label}
Estimate at Completion (EAC):       ${e(n.eac).padEnd(16)}
Variance at Completion (VAC):       ${e(n.vac).padEnd(16)}
To-Complete Index (TCPI BAC):       ${n.tcpiBac.toFixed(2).padEnd(16)} (${n.tcpiBacFeasible?`Feasible`:`Infeasible / High Risk`})
To-Complete Index (TCPI EAC):       ${n.tcpiEac.toFixed(2).padEnd(16)} (${n.tcpiEacFeasible?`Feasible`:`Infeasible / High Risk`})

3. EARNED SCHEDULE (ES) TIME-BASED METRICS (Lipke / PMI Standard Box 3-1)
--------------------------------------------------------------------------------
Planned Project Duration (PD):      ${n.earnedSchedule.plannedDurationDays} calendar days
Actual Elapsed Time (AT):           ${n.earnedSchedule.actualTimeDays} calendar days
Earned Schedule (ES):               ${n.earnedSchedule.earnedScheduleDays} calendar days
Schedule Variance (Time) SV(t):     ${n.earnedSchedule.scheduleVarianceTimeDays>=0?`+`:``}${n.earnedSchedule.scheduleVarianceTimeDays} days (${n.earnedSchedule.scheduleVarianceTimeDays>=0?`Ahead of Schedule`:`Behind Schedule`})
Schedule Performance Index SPI(t):  ${n.earnedSchedule.schedulePerformanceIndexTime.toFixed(2)}
Estimated Duration EAC(t):          ${n.earnedSchedule.estimatedDurationAtCompletionDays} calendar days
Time Variance at Completion VAC(t): ${n.earnedSchedule.timeVarianceAtCompletionDays>=0?`+`:``}${n.earnedSchedule.timeVarianceAtCompletionDays} days
Projected Practical Finish:         ${n.earnedSchedule.projectedFinishDateIso}

4. ANSI/EIA 748-B THRESHOLD BREACH AUDIT
--------------------------------------------------------------------------------
Compliance State:   ${n.ansiThresholds.badgeText}
VAR Status:         ${n.ansiThresholds.varRequired?`MANDATORY VARIANCE ACTION REQUIRED`:`WITHIN TOLERANCE`}
Tier 1 Trigger:     ${n.ansiThresholds.tier1Breach?`BREACHED (Exceeds ±30% and ±$10,000 threshold)`:`Pass`}
Tier 2 Trigger:     ${n.ansiThresholds.tier2Breach?`BREACHED (Exceeds ±10% and ±$25,000 threshold)`:`Pass`}
Specific Triggers:
${n.ansiThresholds.reasons.map(e=>`  - ${e}`).join(`
`)}

5. APM BULLS-EYE QUADRANT DIAGNOSIS (APM Handbook Fig 15)
--------------------------------------------------------------------------------
Assigned Quadrant:  ${n.apmBullsEye.quadrantTitle}
Tolerance Ring:     ${n.apmBullsEye.toleranceZone}
Vector Offset:      ${n.apmBullsEye.distanceFromTarget} from target (1.0, 1.0)
Analysis:           ${n.apmBullsEye.quadrantDescription}

6. ROOT CAUSE ANALYSIS (RCA)
--------------------------------------------------------------------------------
Primary Variance Drivers:
${n.criticalTasksDelayed.length>0?n.criticalTasksDelayed.map((t,n)=>`  ${n+1}. [${t.taskId}] ${t.taskName}:
     - Delay: +${t.delayDays} days (Planned Finish: ${t.plannedEndDate})
     - Prolongation Impact: ${e(t.prolongationCost)}
     - Liquidated Penalties: ${e(t.penaltyCost)}
     - Combined Exposure: ${e(t.totalCostImpact)}`).join(`
`):`  - No critical path delays recorded.`}

7. CORRECTIVE ACTION PLAN (CAP)
--------------------------------------------------------------------------------
Item # | Corrective Mitigation Action                | Owner      | Target Date | Expected Recovery
-------+---------------------------------------------+------------+-------------+-------------------
CAP-01 | Mobilize secondary structural crew          | Supt. Steel| Next 10 days| Reclaim 4 days float
CAP-02 | Expedite MEP prefabrication delivery        | MEP Lead   | Next 14 days| Prevent downstream ripple
CAP-03 | Re-baseline non-critical float activities   | Lead CAM   | Next cycle  | Stabilize TCPI < 1.05
CAP-04 | Enforce strict vendor penalty offsets       | Commercial | Ongoing     | Neutralize penalty fees

================================================================================
Approved by: Project Director _______________________   Date: ${n.simDateIso}
================================================================================
`.trim()}openCprFormat5Modal(e){let n=this.generateCprFormat5Report(e),r=document.getElementById(`cpr-format5-modal`);r&&r.remove();let i=document.createElement(`div`);i.id=`cpr-format5-modal`,i.style.position=`fixed`,i.style.inset=`0`,i.style.background=`var(--bg-overlay)`,i.style.backdropFilter=`blur(8px)`,i.style.zIndex=`99999`,i.style.display=`flex`,i.style.alignItems=`center`,i.style.justifyContent=`center`,i.style.padding=`1.5rem`,i.innerHTML=`
      <div style="background: var(--bg-panel); border: 1px solid var(--color-warning-border); border-radius: 10px; width: 880px; max-width: 95vw; height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-panel);">
        <!-- Modal Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 1.2rem; background: var(--bg-panel-header); border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">CPR Format 5 — Variance Analysis Report (VAR)</h3>
            <span style="font-size: 0.6rem; background: var(--color-warning-subtle); color: var(--color-warning); border: 1px solid var(--color-warning-border); padding: 2px 6px; border-radius: 3px; font-weight: 700;">ANSI/EIA 748-B</span>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button id="btn-cpr5-download" style="background: var(--accent-500); color: var(--accent-btn-text); border: none; padding: 0.35rem 0.75rem; border-radius: 5px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Report (.txt)
            </button>
            <button id="btn-cpr5-copy" style="background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-color); padding: 0.35rem 0.75rem; border-radius: 5px; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
              Copy to Clipboard
            </button>
            <button id="btn-cpr5-close" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.3rem;" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Modal Body Content -->
        <div style="flex: 1; padding: 1rem 1.2rem; overflow-y: auto;">
          <pre style="margin: 0; font-family: monospace; font-size: 0.75rem; line-height: 1.45; color: var(--text-main); background: var(--bg-app); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color); white-space: pre-wrap; word-break: break-all;">${n}</pre>
        </div>
      </div>
    `,document.body.appendChild(i),document.getElementById(`btn-cpr5-close`)?.addEventListener(`click`,()=>i.remove()),i.addEventListener(`click`,e=>{e.target===i&&i.remove()}),document.getElementById(`btn-cpr5-download`)?.addEventListener(`click`,()=>{let e=new Blob([n],{type:`text/plain;charset=utf-8`}),r=URL.createObjectURL(e),i=document.createElement(`a`);i.href=r,i.download=`CPR_Format5_VAR_Report_${Date.now()}.txt`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r),t(`✓ Downloaded CPR Format 5 Report`,`success`)}),document.getElementById(`btn-cpr5-copy`)?.addEventListener(`click`,()=>{navigator.clipboard.writeText(n).then(()=>{t(`✓ Copied CPR Format 5 Report to clipboard`,`success`)})})}};export{i as EvmDashboardModule};