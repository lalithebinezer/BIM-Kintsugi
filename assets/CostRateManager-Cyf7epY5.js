var e={USD:{code:`USD`,symbol:`$`,name:`US Dollar (USD)`,conversionRate:1},EUR:{code:`EUR`,symbol:`€`,name:`Euro (EUR)`,conversionRate:.92},GBP:{code:`GBP`,symbol:`£`,name:`British Pound (GBP)`,conversionRate:.79},INR:{code:`INR`,symbol:`₹`,name:`Indian Rupee (INR)`,conversionRate:83.2},AED:{code:`AED`,symbol:`AED `,name:`UAE Dirham (AED)`,conversionRate:3.67},SAR:{code:`SAR`,symbol:`SAR `,name:`Saudi Riyal (SAR)`,conversionRate:3.75}},t={IFCSITE:{category:`IFCSITE`,displayName:`Site Earthworks & Grading`,unit:`m³`,unitRate:85,trade:`General`},IFCFOOTING:{category:`IFCFOOTING`,displayName:`Foundations & Footings`,unit:`m³`,unitRate:480,trade:`Concrete`},IFCPILE:{category:`IFCPILE`,displayName:`Bored & Driven Piles`,unit:`m`,unitRate:320,trade:`Concrete`},IFCCOLUMN:{category:`IFCCOLUMN`,displayName:`Structural Columns`,unit:`m³`,unitRate:620,trade:`Concrete`},IFCBEAM:{category:`IFCBEAM`,displayName:`Structural Beams`,unit:`m³`,unitRate:590,trade:`Steel`},IFCSLAB:{category:`IFCSLAB`,displayName:`Floor Slabs & Decks`,unit:`m³`,unitRate:420,trade:`Concrete`},IFCWALL:{category:`IFCWALL`,displayName:`Exterior & Interior Walls`,unit:`m²`,unitRate:140,trade:`Concrete`},IFCWALLSTANDARDCASE:{category:`IFCWALLSTANDARDCASE`,displayName:`Standard Partition Walls`,unit:`m²`,unitRate:125,trade:`Finishes`},IFCSTAIR:{category:`IFCSTAIR`,displayName:`Stairs & Landings`,unit:`ea`,unitRate:1200,trade:`Concrete`},IFCSTAIRFLIGHT:{category:`IFCSTAIRFLIGHT`,displayName:`Stair Flights`,unit:`ea`,unitRate:850,trade:`Concrete`},IFCROOF:{category:`IFCROOF`,displayName:`Roof Deck & Waterproofing`,unit:`m²`,unitRate:110,trade:`Finishes`},IFCDOOR:{category:`IFCDOOR`,displayName:`Doors & Portals`,unit:`ea`,unitRate:420,trade:`Finishes`},IFCWINDOW:{category:`IFCWINDOW`,displayName:`Windows & Glazing Units`,unit:`ea`,unitRate:550,trade:`Finishes`},IFCRAILING:{category:`IFCRAILING`,displayName:`Guardrails & Handrails`,unit:`m`,unitRate:135,trade:`Steel`},IFCCOVERING:{category:`IFCCOVERING`,displayName:`Wall & Ceiling Cladding`,unit:`m²`,unitRate:75,trade:`Finishes`},IFCFLOWSEGMENT:{category:`IFCFLOWSEGMENT`,displayName:`MEP Pipes & Ducts`,unit:`m`,unitRate:95,trade:`MEP`},IFCFLOWFITTING:{category:`IFCFLOWFITTING`,displayName:`MEP Flow Fittings`,unit:`ea`,unitRate:65,trade:`MEP`},IFCFLOWTERMINAL:{category:`IFCFLOWTERMINAL`,displayName:`MEP Terminals & Outlets`,unit:`ea`,unitRate:180,trade:`MEP`},IFCFURNISHINGELEMENT:{category:`IFCFURNISHINGELEMENT`,displayName:`Fixtures & Furnishings`,unit:`ea`,unitRate:250,trade:`Finishes`},IFCPLATE:{category:`IFCPLATE`,displayName:`Structural Metal Plates`,unit:`m²`,unitRate:190,trade:`Steel`},IFCMEMBER:{category:`IFCMEMBER`,displayName:`Structural Members`,unit:`m`,unitRate:160,trade:`Steel`},OTHER:{category:`OTHER`,displayName:`General Architectural Works`,unit:`ea`,unitRate:150,trade:`General`}},n=`bim_custom_cost_rates_v1`,r=`bim_active_currency_v1`,i=class i{static instance=null;rates=new Map;activeCurrencyCode=`USD`;modalEl=null;escapeBound=!1;constructor(){this.loadState()}static getInstance(){return i.instance||=new i,i.instance}loadState(){if(typeof localStorage>`u`){for(let[e,n]of Object.entries(t))this.rates.set(e,{...n});return}let i=localStorage.getItem(r);i&&e[i]&&(this.activeCurrencyCode=i);try{let e=localStorage.getItem(n);if(e){let t=JSON.parse(e);for(let[e,n]of Object.entries(t))this.rates.set(e.toUpperCase(),{...n})}}catch(e){console.warn(`Could not parse stored cost rates:`,e)}for(let[e,n]of Object.entries(t))this.rates.has(e)||this.rates.set(e,{...n})}saveState(){if(typeof localStorage>`u`)return;let e={};for(let[t,n]of this.rates.entries())e[t]=n;try{localStorage.setItem(n,JSON.stringify(e)),localStorage.setItem(r,this.activeCurrencyCode)}catch{}}getCurrency(){return e[this.activeCurrencyCode]||e.USD}setCurrency(t){e[t]&&(this.activeCurrencyCode=t,this.saveState())}formatPrice(e){let t=this.getCurrency(),n=e.toLocaleString(`en-US`,{minimumFractionDigits:2,maximumFractionDigits:2});return`${t.symbol}${n}`}getRate(e){let n=e.toUpperCase();for(let[e,t]of this.rates.entries())if(n.includes(e))return t;return this.rates.get(`OTHER`)||t.OTHER}updateRate(e,t,n){let r=this.getRate(e);r.unitRate=Math.max(0,t),n&&(r.unit=n),this.rates.set(r.category,r),this.saveState()}getAllRates(){return Array.from(this.rates.values())}resetToDefaults(){this.rates.clear();for(let[e,n]of Object.entries(t))this.rates.set(e,{...n});this.saveState()}resolveQuantityForElement(e,t={},n){switch(this.getRate(e).unit){case`m³`:if(t.volume&&t.volume>0)return{quantity:Number(t.volume.toFixed(2)),unit:`m³`};if(n&&n.x>0&&n.y>0&&n.z>0){let e=n.x*n.y*n.z;return{quantity:Number(e.toFixed(2)),unit:`m³`}}return{quantity:1,unit:`m³`};case`m²`:if(t.area&&t.area>0)return{quantity:Number(t.area.toFixed(2)),unit:`m²`};if(n){let e=[n.x,n.y,n.z].sort((e,t)=>t-e),t=e[0]*e[1];if(t>0)return{quantity:Number(t.toFixed(2)),unit:`m²`}}return{quantity:1,unit:`m²`};case`m`:if(t.length&&t.length>0)return{quantity:Number(t.length.toFixed(2)),unit:`m`};if(n){let e=Math.max(n.x,n.y,n.z);if(e>0)return{quantity:Number(e.toFixed(2)),unit:`m`}}return{quantity:1,unit:`m`};default:return{quantity:t.count&&t.count>0?t.count:1,unit:`ea`}}}openCostRateModal(e){this.modalEl||this.createModalDOM(),this.renderModalContent(e),this.modalEl?.classList.remove(`hidden`)}closeCostRateModal(){this.modalEl?.classList.add(`hidden`)}createModalDOM(){let e=document.createElement(`div`);e.id=`cost-rate-table-modal`,e.className=`cost-rate-modal-overlay hidden`,e.innerHTML=`
      <div class="cost-rate-modal-container" role="dialog" aria-modal="true" aria-labelledby="cost-modal-title">
        <div class="cost-rate-modal-header">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <div class="cost-modal-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <div>
              <h2 id="cost-modal-title" style="margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">Custom Cost Rate Table & Multipliers</h2>
              <span style="font-size: 0.65rem; color: var(--text-muted);">Set baseline unit rates, measurement basis (m³, m², m, ea), and project currency.</span>
            </div>
          </div>
          <button id="btn-close-cost-modal" class="btn-icon-sm" title="Close Modal">✕</button>
        </div>

        <div class="cost-rate-modal-toolbar">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <label for="cost-currency-selector" style="font-size: 0.7rem; font-weight: 700; color: var(--text-muted);">Project Currency:</label>
            <select id="cost-currency-selector" class="cost-currency-select"></select>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <button id="btn-cost-rates-reset" class="btn-secondary" style="font-size: 0.68rem; padding: 0.25rem 0.6rem;">Reset Defaults</button>
            <button id="btn-cost-rates-save" class="btn-action-primary" style="font-size: 0.68rem; padding: 0.25rem 0.8rem; background: var(--accent-500); color: var(--accent-btn-text); font-weight: 800;">Apply Rates</button>
          </div>
        </div>

        <div class="cost-rate-table-wrapper thin-scrollbar">
          <table class="cost-rate-table" id="cost-rate-table">
            <thead>
              <tr>
                <th style="width: 28%;">IFC Category</th>
                <th style="width: 24%;">Trade Group</th>
                <th style="width: 20%;">Unit Basis</th>
                <th style="width: 28%;">Unit Rate (<span id="table-currency-symbol">$</span>)</th>
              </tr>
            </thead>
            <tbody id="cost-rate-table-body"></tbody>
          </table>
        </div>
      </div>
    `,document.body.appendChild(e),this.modalEl=e,e.querySelector(`#btn-close-cost-modal`)?.addEventListener(`click`,()=>this.closeCostRateModal()),e.addEventListener(`click`,t=>{t.target===e&&this.closeCostRateModal()}),!this.escapeBound&&typeof window<`u`&&(this.escapeBound=!0,window.addEventListener(`keydown`,e=>{e.key===`Escape`&&this.modalEl&&!this.modalEl.classList.contains(`hidden`)&&(e.stopImmediatePropagation(),this.closeCostRateModal())},!0))}renderModalContent(t){if(!this.modalEl)return;let n=this.modalEl.querySelector(`#cost-currency-selector`);n&&(n.innerHTML=Object.values(e).map(e=>`<option value="${e.code}" ${e.code===this.activeCurrencyCode?`selected`:``}>${e.name}</option>`).join(``),n.onchange=()=>{this.setCurrency(n.value);let e=this.modalEl?.querySelector(`#table-currency-symbol`);e&&(e.textContent=this.getCurrency().symbol.trim())});let r=this.modalEl.querySelector(`#table-currency-symbol`);r&&(r.textContent=this.getCurrency().symbol.trim());let i=this.modalEl.querySelector(`#cost-rate-table-body`);if(!i)return;i.innerHTML=this.getAllRates().map(e=>`
        <tr data-cat="${e.category}">
          <td>
            <div style="font-weight: 700; color: var(--text-primary);">${e.displayName}</div>
            <span style="font-family: monospace; font-size: 0.6rem; color: var(--text-muted);">${e.category}</span>
          </td>
          <td>
            <span class="cost-trade-badge trade-${e.trade.toLowerCase()}">${e.trade}</span>
          </td>
          <td>
            <select class="cost-unit-select" data-cat="${e.category}">
              <option value="m³" ${e.unit===`m³`?`selected`:``}>m³ (Volume)</option>
              <option value="m²" ${e.unit===`m²`?`selected`:``}>m² (Area)</option>
              <option value="m" ${e.unit===`m`?`selected`:``}>m (Length)</option>
              <option value="ea" ${e.unit===`ea`?`selected`:``}>ea (Count)</option>
            </select>
          </td>
          <td>
            <div style="display: flex; align-items: center; gap: 0.3rem;">
              <span style="font-family: monospace; font-weight: 700; color: var(--accent-500);">${this.getCurrency().symbol.trim()}</span>
              <input type="number" min="0" step="1" class="cost-rate-input" data-cat="${e.category}" value="${e.unitRate}" />
            </div>
          </td>
        </tr>
      `).join(``);let a=this.modalEl.querySelector(`#btn-cost-rates-reset`);a&&(a.onclick=()=>{confirm(`Reset all category rates and unit types to project defaults?`)&&(this.resetToDefaults(),this.renderModalContent(t))});let o=this.modalEl.querySelector(`#btn-cost-rates-save`);o&&(o.onclick=()=>{(this.modalEl?.querySelectorAll(`#cost-rate-table-body tr`))?.forEach(e=>{let t=e.dataset.cat;if(!t)return;let n=e.querySelector(`.cost-unit-select`),r=e.querySelector(`.cost-rate-input`),i=Number(r?.value)||0,a=n?.value||`ea`;this.updateRate(t,i,a)}),this.saveState(),this.closeCostRateModal(),t&&t()})}};export{i as t};