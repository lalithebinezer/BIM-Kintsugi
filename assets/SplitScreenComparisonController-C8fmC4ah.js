var e=class e{static instance=null;overlay=null;leftImg=null;splitPct=50;active=!1;callbacks=null;static getInstance(){return this.instance||=new e,this.instance}isActive(){return this.active}getSplitPercent(){return this.splitPct}async toggle(e){return this.active?(await this.close(),!1):(await this.open(e),!0)}async open(e){this.callbacks=e,this.active=!0,this.ensureDom(),this.overlay?.classList.remove(`hidden`),this.setSplitPercent(50),await this.refreshComparison()}async close(){this.active=!1,this.overlay?.classList.add(`hidden`),await this.callbacks?.onClose?.()}setSplitPercent(e){if(this.splitPct=Math.max(5,Math.min(95,Math.round(e*10)/10)),!this.overlay)return;let t=this.overlay.querySelector(`#split-left-pane`),n=this.overlay.querySelector(`#split-divider-handle`);t&&(t.style.clipPath=`inset(0 ${100-this.splitPct}% 0 0)`),n&&(n.style.left=`${this.splitPct}%`)}async refreshComparison(){if(!this.active||!this.callbacks)return;let e=this.callbacks.getCanvas(),t=await this.callbacks.renderPlannedPass();if(await new Promise(e=>requestAnimationFrame(e)),e&&this.leftImg)try{this.leftImg.src=e.toDataURL(`image/png`)}catch{}let n=await this.callbacks.renderActualPass();this.updateTelemetryBadges(t,n)}updateTelemetryBadges(e,t){if(!this.overlay)return;let n=this.overlay.querySelector(`#split-planned-meta`),r=this.overlay.querySelector(`#split-actual-meta`);if(n&&(n.textContent=`${e.dateLabel} • ${Math.round(e.plannedPct)}% Planned`),r){let e=t.varianceDays>0?`+`:``;r.textContent=`${Math.round(t.actualPct)}% Actual • SPI ${t.spi.toFixed(2)} • ${e}${t.varianceDays}d (${t.delayedCount} delayed)`}}ensureDom(){if(this.overlay)return;let e=document.createElement(`div`);e.id=`split-screen-4d-overlay`,e.className=`split-screen-4d-overlay hidden`,e.innerHTML=`
      <div id="split-left-pane" class="split-left-pane">
        <img id="split-left-snapshot" class="split-left-snapshot" alt="Planned Baseline 4D View" />
      </div>
      <div class="split-badge split-badge-left">
        <span class="split-dot planned"></span>
        <div>
          <div class="split-badge-title">PLANNED BASELINE</div>
          <div class="split-badge-sub" id="split-planned-meta">--</div>
        </div>
      </div>
      <div class="split-badge split-badge-right">
        <span class="split-dot actual"></span>
        <div>
          <div class="split-badge-title">ACTUAL / VARIANCE</div>
          <div class="split-badge-sub" id="split-actual-meta">--</div>
        </div>
        <button type="button" id="btn-split-resync" class="btn-secondary" style="font-size:0.65rem;padding:0.2rem 0.45rem;margin-left:0.35rem;" title="Re-sync baseline capture after orbiting camera">↻ Sync</button>
        <button type="button" id="btn-split-close" class="btn-secondary" style="font-size:0.65rem;padding:0.2rem 0.45rem;" title="Exit Split-Screen Comparison">✕</button>
      </div>
      <div id="split-divider-handle" class="split-divider-handle" role="slider" aria-label="Split-Screen Comparison Divider" aria-valuemin="5" aria-valuemax="95" aria-valuenow="50" tabindex="0">
        <div class="split-divider-knob">⇔</div>
      </div>
    `,document.body.appendChild(e),this.overlay=e,this.leftImg=e.querySelector(`#split-left-snapshot`),e.querySelector(`#btn-split-close`)?.addEventListener(`click`,()=>this.close()),e.querySelector(`#btn-split-resync`)?.addEventListener(`click`,()=>this.refreshComparison());let t=e.querySelector(`#split-divider-handle`);if(t){let e=!1;t.addEventListener(`pointerdown`,n=>{e=!0,t.setPointerCapture?.(n.pointerId),n.preventDefault(),n.stopPropagation()}),t.addEventListener(`pointermove`,n=>{if(!e)return;let r=n.clientX/Math.max(1,window.innerWidth)*100;this.setSplitPercent(r),t.setAttribute(`aria-valuenow`,String(Math.round(this.splitPct)))});let n=n=>{e&&(e=!1,t.releasePointerCapture?.(n.pointerId))};t.addEventListener(`pointerup`,n),t.addEventListener(`pointercancel`,n),t.addEventListener(`keydown`,e=>{e.key===`ArrowLeft`&&this.setSplitPercent(this.splitPct-5),e.key===`ArrowRight`&&this.setSplitPercent(this.splitPct+5)})}}};export{e as SplitScreenComparisonController};