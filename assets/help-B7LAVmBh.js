import"./modulepreload-polyfill-P2Xu9kJm.js";import{t as e}from"./helpCenterArticles-CWJAGNzn.js";var t=document.getElementById(`help-sidebar`),n=document.getElementById(`help-main`),r=document.getElementById(`help-toc`),i=document.getElementById(`help-search`),a=document.getElementById(`btn-print-guide`),o=``;function s(e){return e.replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`)}function c(){let t=(location.hash||``).replace(/^#/,``).trim();return e.some(e=>e.id===t)?t:null}function l(n){t.innerHTML=`<div class="nav-group">
      <button type="button" class="nav-link ${n?``:`is-active`}" data-nav="home">
        <span class="nav-dot" style="background:var(--accent)"></span>
        <span>All Help Guides</span>
      </button>
    </div>`+[`Getting Started`,`Interface`,`Field & Mobile`,`4D / 5D / 6D`,`Coordination`].map(t=>{let r=e.filter(e=>e.category===t);return r.length?`<div class="nav-group">
          <div class="nav-group-label">${t}</div>
          ${r.map(e=>`
            <button type="button" class="nav-link ${n===e.id?`is-active`:``}" data-nav="${e.id}">
              <span class="nav-dot" style="background:${e.accent}"></span>
              <span>${e.title.split(`:`)[0]}</span>
            </button>`).join(``)}
        </div>`:``}).join(``)}function u(){let t=o.trim().toLowerCase(),i=e.filter(e=>!t||[e.title,e.summary,e.category,...e.keywords,...e.steps.map(e=>`${e.title} ${e.body}`)].join(` `).toLowerCase().includes(t));n.innerHTML=`
    <section class="hero-card">
      <div class="hero-kicker">BIM KINTSUGI KNOWLEDGE BASE</div>
      <h1>How can we help you build faster in 3D, 4D &amp; 5D?</h1>
      <p>Click any step-by-step guide below for concise walkthroughs covering IFC loading, Classic &amp; Spatial Cockpit UI layouts, mobile jobsite workflows, 4D CasCADe Lens, Clash/BCF coordination, and 5D/6D analytics.</p>
    </section>
    <section class="card-grid">
      ${i.length?i.map(e=>`
        <button type="button" class="guide-card" data-nav="${e.id}">
          <div class="guide-card__top">
            <span class="icon-badge" style="--item-accent:${e.accent}">${e.icon}</span>
            <span class="cat-pill">${e.category}</span>
          </div>
          <h3>${e.title}</h3>
          <p>${e.summary}</p>
          <div class="guide-card__foot">
            <span>${e.readTime}</span>
            <span>Read guide &rarr;</span>
          </div>
        </button>`).join(``):`<div class="article-shell">No guides matched "<strong>${s(o)}</strong>". Try <strong>Cockpit</strong>, <strong>4D</strong>, <strong>BCF</strong>, <strong>Photo</strong>, or <strong>GAEB</strong>.</div>`}
    </section>
  `,r.innerHTML=`<div class="toc-title">Quick Links</div>`+e.map(e=>`<a href="#${e.id}">${e.title.split(`:`)[0]}</a>`).join(``),document.title=`BIM Kintsugi Help Center — Step-by-Step User Guides`}function d(t){let i=e.findIndex(e=>e.id===t),a=e[i],o=i>0?e[i-1]:null,s=i<e.length-1?e[i+1]:null;n.innerHTML=`
    <article class="article-shell">
      <div class="breadcrumbs">
        <button type="button" data-nav="home">Help Center</button>
        <span>/</span>
        <span>${a.category}</span>
        <span>&middot;</span>
        <span>${a.readTime}</span>
      </div>
      <div class="article-head">
        <span class="icon-badge" style="--item-accent:${a.accent}">${a.icon}</span>
        <div style="flex:1 1 auto;min-width:0;">
          <h1>${a.title}</h1>
          <p>${a.summary}</p>
        </div>
        <button type="button" class="btn no-print" data-print-article="1" title="Print or Save this guide as PDF">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span>Print / PDF</span>
        </button>
      </div>
      ${a.prerequisites?.length?`<div class="prereq"><div class="prereq-title">Before You Begin</div><ul>${a.prerequisites.map(e=>`<li>${e}</li>`).join(``)}</ul></div>`:``}
      <div class="step-list">
        ${a.steps.map((e,t)=>`
          <section class="step-card" id="step-${t+1}">
            <div class="step-num">${String(t+1).padStart(2,`0`)}</div>
            <div>
              <h2>${e.title}</h2>
              <p>${e.body}</p>
              ${e.tip?`<div class="step-tip"><strong>Pro Tip:</strong> ${e.tip}</div>`:``}
            </div>
          </section>`).join(``)}
      </div>
      ${(a.callouts||[]).map(e=>`<div class="callout"><div class="callout-title">${e.title}</div><div class="callout-body">${e.body}</div></div>`).join(``)}
      ${a.faqs?.length?`<section class="faq-wrap" id="faq"><h3>Frequently Asked Questions</h3>${a.faqs.map(e=>`<details class="faq" open><summary>${e.question}</summary><p>${e.answer}</p></details>`).join(``)}</section>`:``}
      <div class="pager no-print">
        ${o?`<button type="button" class="pager-btn" data-nav="${o.id}"><span class="pager-dir">&larr; Previous Guide</span><span class="pager-title">${o.title}</span></button>`:`<span></span>`}
        ${s?`<button type="button" class="pager-btn pager-btn--next" data-nav="${s.id}"><span class="pager-dir">Next Guide &rarr;</span><span class="pager-title">${s.title}</span></button>`:`<span></span>`}
      </div>
    </article>
  `,r.innerHTML=`<div class="toc-title">On This Page</div>`+a.steps.map((e,t)=>`<a href="#step-${t+1}">${t+1}. ${e.title}</a>`).join(``)+(a.faqs?.length?`<a href="#faq">Troubleshooting FAQ</a>`:``),document.title=`${a.title} — BIM Kintsugi Help Center`}function f(){let e=c();l(e),e?d(e):u()}document.addEventListener(`click`,e=>{let n=e.target;if(!n)return;if(n.closest(`[data-print-article]`)){window.print();return}let r=n.closest(`[data-nav]`);if(r){let e=r.getAttribute(`data-nav`);t.classList.remove(`is-open`),e===`home`?(history.pushState(null,``,location.pathname),f(),window.scrollTo({top:0,behavior:`smooth`})):e&&(location.hash=e,window.scrollTo({top:0,behavior:`smooth`}))}}),i?.addEventListener(`input`,()=>{o=i.value,c()&&history.pushState(null,``,location.pathname),f()}),document.getElementById(`btn-mob-nav`)?.addEventListener(`click`,()=>{t.classList.toggle(`is-open`)}),document.getElementById(`btn-theme`)?.addEventListener(`click`,()=>{let e=document.documentElement.getAttribute(`data-theme`)===`light`?`obsidian`:`light`;document.documentElement.setAttribute(`data-theme`,e);try{localStorage.setItem(`bim_theme_preset`,e)}catch{}}),a?.addEventListener(`click`,()=>window.print()),window.addEventListener(`hashchange`,f),window.addEventListener(`popstate`,f),f();