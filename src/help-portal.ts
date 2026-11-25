/**
 * Standalone Help Center Web Portal (`help.html`)
 * Shares `HELP_CENTER_ARTICLES` directly with the in-app Help Center (zero content duplication)
 * and supports instant search, hash deep-linking (`help.html#<slug>`), theme sync, and Print / PDF export.
 */

import { HELP_CENTER_ARTICLES, type HelpArticle } from "./data/helpCenterArticles";

const sidebarEl = document.getElementById("help-sidebar")!;
const mainEl = document.getElementById("help-main")!;
const tocEl = document.getElementById("help-toc")!;
const searchEl = document.getElementById("help-search") as HTMLInputElement;
const printBtn = document.getElementById("btn-print-guide") as HTMLButtonElement | null;

let query = "";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getActiveId(): string | null {
  const hash = (location.hash || "").replace(/^#/, "").trim();
  return HELP_CENTER_ARTICLES.some((a) => a.id === hash) ? hash : null;
}

function renderSidebar(activeId: string | null): void {
  const groups = ["Getting Started", "Interface", "Field & Mobile", "4D / 5D / 6D", "Coordination"] as const;
  sidebarEl.innerHTML =
    `<div class="nav-group">
      <button type="button" class="nav-link ${!activeId ? "is-active" : ""}" data-nav="home">
        <span class="nav-dot" style="background:var(--accent)"></span>
        <span>All Help Guides</span>
      </button>
    </div>` +
    groups
      .map((g) => {
        const items = HELP_CENTER_ARTICLES.filter((a) => a.category === g);
        if (!items.length) return "";
        return `<div class="nav-group">
          <div class="nav-group-label">${g}</div>
          ${items
            .map(
              (a) => `
            <button type="button" class="nav-link ${activeId === a.id ? "is-active" : ""}" data-nav="${a.id}">
              <span class="nav-dot" style="background:${a.accent}"></span>
              <span>${a.title.split(":")[0]}</span>
            </button>`
            )
            .join("")}
        </div>`;
      })
      .join("");
}

function renderHome(): void {
  const q = query.trim().toLowerCase();
  const filtered = HELP_CENTER_ARTICLES.filter((a) => {
    if (!q) return true;
    const hay = [
      a.title,
      a.summary,
      a.category,
      ...a.keywords,
      ...a.steps.map((s) => `${s.title} ${s.body}`),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  mainEl.innerHTML = `
    <section class="hero-card">
      <div class="hero-kicker">BIM KINTSUGI KNOWLEDGE BASE</div>
      <h1>How can we help you build faster in 3D, 4D &amp; 5D?</h1>
      <p>Click any step-by-step guide below for concise walkthroughs covering IFC loading, Classic &amp; Spatial Cockpit UI layouts, mobile jobsite workflows, 4D CasCADe Lens, Clash/BCF coordination, and 5D/6D analytics.</p>
    </section>
    <section class="card-grid">
      ${
        filtered.length
          ? filtered
              .map(
                (a) => `
        <button type="button" class="guide-card" data-nav="${a.id}">
          <div class="guide-card__top">
            <span class="icon-badge" style="--item-accent:${a.accent}">${a.icon}</span>
            <span class="cat-pill">${a.category}</span>
          </div>
          <h3>${a.title}</h3>
          <p>${a.summary}</p>
          <div class="guide-card__foot">
            <span>${a.readTime}</span>
            <span>Read guide &rarr;</span>
          </div>
        </button>`
              )
              .join("")
          : `<div class="article-shell">No guides matched "<strong>${escapeHtml(query)}</strong>". Try <strong>Cockpit</strong>, <strong>4D</strong>, <strong>BCF</strong>, <strong>Photo</strong>, or <strong>GAEB</strong>.</div>`
      }
    </section>
  `;
  tocEl.innerHTML =
    `<div class="toc-title">Quick Links</div>` +
    HELP_CENTER_ARTICLES.map((a) => `<a href="#${a.id}">${a.title.split(":")[0]}</a>`).join("");
  document.title = "BIM Kintsugi Help Center — Step-by-Step User Guides";
}

function renderArticle(id: string): void {
  const idx = HELP_CENTER_ARTICLES.findIndex((a) => a.id === id);
  const a: HelpArticle = HELP_CENTER_ARTICLES[idx];
  const prev = idx > 0 ? HELP_CENTER_ARTICLES[idx - 1] : null;
  const next = idx < HELP_CENTER_ARTICLES.length - 1 ? HELP_CENTER_ARTICLES[idx + 1] : null;

  mainEl.innerHTML = `
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
      ${
        a.prerequisites?.length
          ? `<div class="prereq"><div class="prereq-title">Before You Begin</div><ul>${a.prerequisites.map((p) => `<li>${p}</li>`).join("")}</ul></div>`
          : ""
      }
      <div class="step-list">
        ${a.steps
          .map(
            (s, i) => `
          <section class="step-card" id="step-${i + 1}">
            <div class="step-num">${String(i + 1).padStart(2, "0")}</div>
            <div>
              <h2>${s.title}</h2>
              <p>${s.body}</p>
              ${s.tip ? `<div class="step-tip"><strong>Pro Tip:</strong> ${s.tip}</div>` : ""}
            </div>
          </section>`
          )
          .join("")}
      </div>
      ${
        (a.callouts || [])
          .map(
            (c) => `<div class="callout"><div class="callout-title">${c.title}</div><div class="callout-body">${c.body}</div></div>`
          )
          .join("")
      }
      ${
        a.faqs?.length
          ? `<section class="faq-wrap" id="faq"><h3>Frequently Asked Questions</h3>${a.faqs
              .map((f) => `<details class="faq" open><summary>${f.question}</summary><p>${f.answer}</p></details>`)
              .join("")}</section>`
          : ""
      }
      <div class="pager no-print">
        ${
          prev
            ? `<button type="button" class="pager-btn" data-nav="${prev.id}"><span class="pager-dir">&larr; Previous Guide</span><span class="pager-title">${prev.title}</span></button>`
            : `<span></span>`
        }
        ${
          next
            ? `<button type="button" class="pager-btn pager-btn--next" data-nav="${next.id}"><span class="pager-dir">Next Guide &rarr;</span><span class="pager-title">${next.title}</span></button>`
            : `<span></span>`
        }
      </div>
    </article>
  `;
  tocEl.innerHTML =
    `<div class="toc-title">On This Page</div>` +
    a.steps.map((s, i) => `<a href="#step-${i + 1}">${i + 1}. ${s.title}</a>`).join("") +
    (a.faqs?.length ? `<a href="#faq">Troubleshooting FAQ</a>` : "");
  document.title = `${a.title} — BIM Kintsugi Help Center`;
}

function render(): void {
  const id = getActiveId();
  renderSidebar(id);
  if (id) renderArticle(id);
  else renderHome();
}

document.addEventListener("click", (ev) => {
  const target = ev.target as Element | null;
  if (!target) return;
  if (target.closest("[data-print-article]")) {
    window.print();
    return;
  }
  const nav = target.closest<HTMLElement>("[data-nav]");
  if (nav) {
    const dest = nav.getAttribute("data-nav");
    sidebarEl.classList.remove("is-open");
    if (dest === "home") {
      history.pushState(null, "", location.pathname);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (dest) {
      location.hash = dest;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
});

searchEl?.addEventListener("input", () => {
  query = searchEl.value;
  if (getActiveId()) history.pushState(null, "", location.pathname);
  render();
});

document.getElementById("btn-mob-nav")?.addEventListener("click", () => {
  sidebarEl.classList.toggle("is-open");
});

document.getElementById("btn-theme")?.addEventListener("click", () => {
  const cur = document.documentElement.getAttribute("data-theme") === "light" ? "obsidian" : "light";
  document.documentElement.setAttribute("data-theme", cur);
  try {
    localStorage.setItem("bim_theme_preset", cur);
  } catch {
    /* ignore */
  }
});

printBtn?.addEventListener("click", () => window.print());

window.addEventListener("hashchange", render);
window.addEventListener("popstate", render);
render();
