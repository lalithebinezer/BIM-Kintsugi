import{n as e,t}from"./helpCenterArticles-CWJAGNzn.js";var n=class{container=null;activeCategory=`All`;searchQuery=``;activeArticleId=null;initialized=!1;mount(e=`help-center-root`){let t=document.getElementById(e);t&&(this.container=t,this.initialized||(this.initialized=!0,t.addEventListener(`click`,e=>this.handleClick(e)),t.addEventListener(`input`,e=>this.handleInput(e))),this.render())}openArticle(e){return t.some(t=>t.id===e)?(this.activeArticleId=e,this.render(),this.container?.closest(`.help-modal-body`)?.scrollTo({top:0,behavior:`smooth`}),!0):!1}showDirectory(){this.activeArticleId=null,this.render()}getActiveArticleId(){return this.activeArticleId}getFilteredArticles(){let e=this.searchQuery.trim().toLowerCase();return t.filter(t=>this.activeCategory!==`All`&&t.category!==this.activeCategory?!1:!e||[t.title,t.summary,t.category,...t.keywords,...t.steps.map(e=>`${e.title} ${e.body}`)].join(` `).toLowerCase().includes(e))}handleInput(e){let t=e.target;t?.id===`help-center-search`&&(this.searchQuery=t.value,this.activeArticleId=null,this.renderDirectoryListOnly())}handleClick(e){let t=e.target;if(!t)return;let n=t.closest(`[data-hc-cat]`);if(n){this.activeCategory=n.getAttribute(`data-hc-cat`)||`All`,this.activeArticleId=null,this.render();return}let r=t.closest(`[data-hc-article]`);if(r){let e=r.getAttribute(`data-hc-article`);e&&this.openArticle(e);return}if(t.closest(`[data-hc-back]`)){this.showDirectory();return}let i=t.closest(`[data-hc-action]`);if(i){let e=i.getAttribute(`data-hc-action`);e&&this.runArticleAction(e)}}runArticleAction(e){switch(window.toggleShortcutsModal?.(!1),document.getElementById(`shortcuts-modal`)?.classList.add(`hidden`),e){case`load-snowdon`:{let e=document.getElementById(`sample-model-select`);e&&(e.value=`snowdon`,e.dispatchEvent(new Event(`change`,{bubbles:!0}))),document.getElementById(`load-sample-btn`)?.click();break}case`toggle-layout`:window.toggleUiLayout?.();break;case`photo-snag`:window.triggerSitePhotoBcfSnag?.();break;case`enter-4d`:typeof window.toggle4DMode==`function`?window.toggle4DMode(!0):document.getElementById(`btn-dock-gantt`)?.click();break;case`open-clash`:document.getElementById(`btn-dock-clash`)?.click();break;case`open-5d`:document.getElementById(`btn-dock-cost`)?.click();break;case`open-gis`:document.getElementById(`btn-dock-gis`)?.click();break;case`open-palette`:document.getElementById(`btn-open-command-palette`)?.click()}}renderDirectoryListOnly(){let e=this.container?.querySelector(`#hc-articles-grid`);if(!e){this.render();return}e.innerHTML=this.buildArticleCardsHtml(this.getFilteredArticles())}buildArticleCardsHtml(e){return e.length===0?`<div class="hc-empty-state">No guides match "<strong>${this.escapeHtml(this.searchQuery)}</strong>". Try searching for <em>Cockpit</em>, <em>4D</em>, <em>BCF</em>, <em>GAEB</em>, or <em>Mobile</em>.</div>`:e.map(e=>`
      <button type="button" class="hc-article-card" data-hc-article="${e.id}">
        <span class="hc-article-card__icon" style="--hc-accent:${e.accent}">${e.icon}</span>
        <span class="hc-article-card__body">
          <span class="hc-article-card__meta">
            <span class="hc-cat-tag">${e.category}</span>
            <span class="hc-read-time">${e.readTime}</span>
          </span>
          <span class="hc-article-card__title">${e.title}</span>
          <span class="hc-article-card__summary">${e.summary}</span>
        </span>
        <span class="hc-article-card__arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </span>
      </button>`).join(``)}renderArticleView(e){let n=t.findIndex(t=>t.id===e.id),r=n>0?t[n-1]:null,i=n<t.length-1?t[n+1]:null,a=e.prerequisites?.length?`<div class="hc-prereq-box">
          <div class="hc-prereq-title">Before You Begin</div>
          <ul>${e.prerequisites.map(e=>`<li>${e}</li>`).join(``)}</ul>
        </div>`:``,o=e.steps.map((e,t)=>`
      <div class="hc-step-card">
        <div class="hc-step-num">${String(t+1).padStart(2,`0`)}</div>
        <div class="hc-step-content">
          <h4 class="hc-step-title">${e.title}</h4>
          <p class="hc-step-body">${e.body}</p>
          ${e.tip?`<div class="hc-step-tip"><strong>Pro Tip:</strong> ${e.tip}</div>`:``}
        </div>
      </div>`).join(``),s=(e.callouts||[]).map(e=>`
      <div class="hc-callout hc-callout--${e.tone}">
        <div class="hc-callout__title">${e.title}</div>
        <div class="hc-callout__body">${e.body}</div>
      </div>`).join(``),c=e.faqs?.length?`<div class="hc-faq-section">
          <h4 class="hc-faq-heading">Frequently Asked Questions</h4>
          ${e.faqs.map(e=>`
            <details class="hc-faq-item">
              <summary>${e.question}</summary>
              <p>${e.answer}</p>
            </details>`).join(``)}
        </div>`:``;return`
      <div class="hc-article-view" data-active-article="${e.id}">
        <div class="hc-article-topbar">
          <button type="button" class="bk-btn bk-btn--secondary bk-btn--sm" data-hc-back="1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            <span>All Guides</span>
          </button>
          <a class="bk-btn bk-btn--ghost bk-btn--sm hc-ext-link" href="./help.html#${e.id}" target="_blank" rel="noopener">
            <span>Open Full Page</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
        <div class="hc-article-header">
          <span class="hc-article-card__icon" style="--hc-accent:${e.accent}">${e.icon}</span>
          <div style="flex:1 1 auto;min-width:0;">
            <div class="hc-article-card__meta">
              <span class="hc-cat-tag">${e.category}</span>
              <span class="hc-read-time">${e.readTime}</span>
            </div>
            <h3 class="hc-article-title">${e.title}</h3>
            <p class="hc-article-summary">${e.summary}</p>
            ${e.action?`<div class="hc-try-bar">
                    <button type="button" class="bk-btn bk-btn--primary bk-btn--sm" data-hc-action="${e.action.runId}">
                      <span>Try It Now: ${e.action.label}</span>
                      <span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>`:``}
          </div>
        </div>
        ${a}
        <div class="hc-steps-list">${o}</div>
        ${s}
        ${c}
        <div class="hc-article-pager">
          ${r?`<button type="button" class="hc-pager-btn" data-hc-article="${r.id}">
                  <span class="hc-pager-dir">&larr; Previous Guide</span>
                  <span class="hc-pager-name">${r.title}</span>
                </button>`:`<span></span>`}
          ${i?`<button type="button" class="hc-pager-btn hc-pager-btn--next" data-hc-article="${i.id}">
                  <span class="hc-pager-dir">Next Guide &rarr;</span>
                  <span class="hc-pager-name">${i.title}</span>
                </button>`:`<span></span>`}
        </div>
      </div>
    `}render(){if(!this.container)return;if(this.activeArticleId){let e=t.find(e=>e.id===this.activeArticleId);if(e){this.container.innerHTML=this.renderArticleView(e);return}this.activeArticleId=null}let n=this.getFilteredArticles();this.container.innerHTML=`
      <div class="hc-directory">
        <div class="hc-toolbar">
          <div class="hc-search-wrap">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="search" id="help-center-search" class="bk-input" placeholder="Search step-by-step guides (e.g. Cockpit, 4D, BCF, Photo, GAEB)..." value="${this.escapeHtml(this.searchQuery)}" aria-label="Search Help Center Guides" />
          </div>
          <a class="bk-btn bk-btn--secondary bk-btn--sm hc-ext-link" href="./help.html" target="_blank" rel="noopener">
            <span>Full Help Portal</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
        <div class="hc-cat-pills" role="tablist" aria-label="Help Categories">
          ${e.map(e=>`
            <button type="button" class="hc-cat-pill${this.activeCategory===e?` is-active`:``}" data-hc-cat="${e}" role="tab" aria-selected="${this.activeCategory===e}">${e}</button>`).join(``)}
        </div>
        <div class="hc-articles-grid" id="hc-articles-grid">
          ${this.buildArticleCardsHtml(n)}
        </div>
      </div>
    `}escapeHtml(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}};export{n as HelpCenterController};