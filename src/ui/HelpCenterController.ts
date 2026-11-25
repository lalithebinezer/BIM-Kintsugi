/**
 * HelpCenterController — Interactive In-App Clickable Help Center inside `#shortcuts-modal`
 *
 * Lets users search, filter by category, click any guide card to read step-by-step
 * help pages inline, navigate Previous/Next articles, or pop open the dedicated
 * standalone Help Center portal (`./help.html#<slug>`).
 */

import {
  HELP_CENTER_ARTICLES,
  HELP_CENTER_CATEGORIES,
  type HelpArticle,
} from "../data/helpCenterArticles";

export class HelpCenterController {
  private container: HTMLElement | null = null;
  private activeCategory: string = "All";
  private searchQuery = "";
  private activeArticleId: string | null = null;
  private initialized = false;

  public mount(containerId = "help-center-root"): void {
    const root = document.getElementById(containerId);
    if (!root) return;
    this.container = root;
    if (!this.initialized) {
      this.initialized = true;
      root.addEventListener("click", (ev) => this.handleClick(ev));
      root.addEventListener("input", (ev) => this.handleInput(ev));
    }
    this.render();
  }

  public openArticle(articleId: string): boolean {
    const exists = HELP_CENTER_ARTICLES.some((a) => a.id === articleId);
    if (!exists) return false;
    this.activeArticleId = articleId;
    this.render();
    this.container?.closest(".help-modal-body")?.scrollTo({ top: 0, behavior: "smooth" });
    return true;
  }

  public showDirectory(): void {
    this.activeArticleId = null;
    this.render();
  }

  public getActiveArticleId(): string | null {
    return this.activeArticleId;
  }

  private getFilteredArticles(): HelpArticle[] {
    const q = this.searchQuery.trim().toLowerCase();
    return HELP_CENTER_ARTICLES.filter((a) => {
      if (this.activeCategory !== "All" && a.category !== this.activeCategory) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        a.title,
        a.summary,
        a.category,
        ...a.keywords,
        ...a.steps.map((s) => `${s.title} ${s.body}`),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  private handleInput(ev: Event): void {
    const target = ev.target as HTMLElement | null;
    if (target?.id === "help-center-search") {
      this.searchQuery = (target as HTMLInputElement).value;
      this.activeArticleId = null;
      this.renderDirectoryListOnly();
    }
  }

  private handleClick(ev: Event): void {
    const target = ev.target as Element | null;
    if (!target) return;

    const catBtn = target.closest<HTMLButtonElement>("[data-hc-cat]");
    if (catBtn) {
      this.activeCategory = catBtn.getAttribute("data-hc-cat") || "All";
      this.activeArticleId = null;
      this.render();
      return;
    }

    const articleCard = target.closest<HTMLElement>("[data-hc-article]");
    if (articleCard) {
      const id = articleCard.getAttribute("data-hc-article");
      if (id) this.openArticle(id);
      return;
    }

    if (target.closest("[data-hc-back]")) {
      this.showDirectory();
      return;
    }

    const actionBtn = target.closest<HTMLButtonElement>("[data-hc-action]");
    if (actionBtn) {
      const runId = actionBtn.getAttribute("data-hc-action");
      if (runId) this.runArticleAction(runId);
    }
  }

  public runArticleAction(runId: string): void {
    (window as any).toggleShortcutsModal?.(false);
    document.getElementById("shortcuts-modal")?.classList.add("hidden");

    switch (runId) {
      case "load-snowdon": {
        const sel = document.getElementById("sample-model-select") as HTMLSelectElement | null;
        if (sel) {
          sel.value = "snowdon";
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
        document.getElementById("load-sample-btn")?.click();
        break;
      }
      case "toggle-layout":
        (window as any).toggleUiLayout?.();
        break;
      case "photo-snag":
        (window as any).triggerSitePhotoBcfSnag?.();
        break;
      case "enter-4d":
        if (typeof (window as any).toggle4DMode === "function") {
          (window as any).toggle4DMode(true);
        } else {
          document.getElementById("btn-dock-gantt")?.click();
        }
        break;
      case "open-clash":
        document.getElementById("btn-dock-clash")?.click();
        break;
      case "open-5d":
        document.getElementById("btn-dock-cost")?.click();
        break;
      case "open-gis":
        document.getElementById("btn-dock-gis")?.click();
        break;
      case "open-palette":
        document.getElementById("btn-open-command-palette")?.click();
        break;
    }
  }

  private renderDirectoryListOnly(): void {
    const grid = this.container?.querySelector<HTMLElement>("#hc-articles-grid");
    if (!grid) {
      this.render();
      return;
    }
    grid.innerHTML = this.buildArticleCardsHtml(this.getFilteredArticles());
  }

  private buildArticleCardsHtml(articles: HelpArticle[]): string {
    if (articles.length === 0) {
      return `<div class="hc-empty-state">No guides match "<strong>${this.escapeHtml(this.searchQuery)}</strong>". Try searching for <em>Cockpit</em>, <em>4D</em>, <em>BCF</em>, <em>GAEB</em>, or <em>Mobile</em>.</div>`;
    }
    return articles
      .map(
        (a) => `
      <button type="button" class="hc-article-card" data-hc-article="${a.id}">
        <span class="hc-article-card__icon" style="--hc-accent:${a.accent}">${a.icon}</span>
        <span class="hc-article-card__body">
          <span class="hc-article-card__meta">
            <span class="hc-cat-tag">${a.category}</span>
            <span class="hc-read-time">${a.readTime}</span>
          </span>
          <span class="hc-article-card__title">${a.title}</span>
          <span class="hc-article-card__summary">${a.summary}</span>
        </span>
        <span class="hc-article-card__arrow" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </span>
      </button>`
      )
      .join("");
  }

  private renderArticleView(article: HelpArticle): string {
    const idx = HELP_CENTER_ARTICLES.findIndex((a) => a.id === article.id);
    const prev = idx > 0 ? HELP_CENTER_ARTICLES[idx - 1] : null;
    const next = idx < HELP_CENTER_ARTICLES.length - 1 ? HELP_CENTER_ARTICLES[idx + 1] : null;

    const prereqHtml = article.prerequisites?.length
      ? `<div class="hc-prereq-box">
          <div class="hc-prereq-title">Before You Begin</div>
          <ul>${article.prerequisites.map((p) => `<li>${p}</li>`).join("")}</ul>
        </div>`
      : "";

    const stepsHtml = article.steps
      .map(
        (s, i) => `
      <div class="hc-step-card">
        <div class="hc-step-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="hc-step-content">
          <h4 class="hc-step-title">${s.title}</h4>
          <p class="hc-step-body">${s.body}</p>
          ${s.tip ? `<div class="hc-step-tip"><strong>Pro Tip:</strong> ${s.tip}</div>` : ""}
        </div>
      </div>`
      )
      .join("");

    const calloutsHtml = (article.callouts || [])
      .map(
        (c) => `
      <div class="hc-callout hc-callout--${c.tone}">
        <div class="hc-callout__title">${c.title}</div>
        <div class="hc-callout__body">${c.body}</div>
      </div>`
      )
      .join("");

    const faqHtml = article.faqs?.length
      ? `<div class="hc-faq-section">
          <h4 class="hc-faq-heading">Frequently Asked Questions</h4>
          ${article.faqs
            .map(
              (f) => `
            <details class="hc-faq-item">
              <summary>${f.question}</summary>
              <p>${f.answer}</p>
            </details>`
            )
            .join("")}
        </div>`
      : "";

    return `
      <div class="hc-article-view" data-active-article="${article.id}">
        <div class="hc-article-topbar">
          <button type="button" class="bk-btn bk-btn--secondary bk-btn--sm" data-hc-back="1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg>
            <span>All Guides</span>
          </button>
          <a class="bk-btn bk-btn--ghost bk-btn--sm hc-ext-link" href="./help.html#${article.id}" target="_blank" rel="noopener">
            <span>Open Full Page</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          </a>
        </div>
        <div class="hc-article-header">
          <span class="hc-article-card__icon" style="--hc-accent:${article.accent}">${article.icon}</span>
          <div style="flex:1 1 auto;min-width:0;">
            <div class="hc-article-card__meta">
              <span class="hc-cat-tag">${article.category}</span>
              <span class="hc-read-time">${article.readTime}</span>
            </div>
            <h3 class="hc-article-title">${article.title}</h3>
            <p class="hc-article-summary">${article.summary}</p>
            ${
              article.action
                ? `<div class="hc-try-bar">
                    <button type="button" class="bk-btn bk-btn--primary bk-btn--sm" data-hc-action="${article.action.runId}">
                      <span>Try It Now: ${article.action.label}</span>
                      <span aria-hidden="true">&rarr;</span>
                    </button>
                  </div>`
                : ""
            }
          </div>
        </div>
        ${prereqHtml}
        <div class="hc-steps-list">${stepsHtml}</div>
        ${calloutsHtml}
        ${faqHtml}
        <div class="hc-article-pager">
          ${
            prev
              ? `<button type="button" class="hc-pager-btn" data-hc-article="${prev.id}">
                  <span class="hc-pager-dir">&larr; Previous Guide</span>
                  <span class="hc-pager-name">${prev.title}</span>
                </button>`
              : `<span></span>`
          }
          ${
            next
              ? `<button type="button" class="hc-pager-btn hc-pager-btn--next" data-hc-article="${next.id}">
                  <span class="hc-pager-dir">Next Guide &rarr;</span>
                  <span class="hc-pager-name">${next.title}</span>
                </button>`
              : `<span></span>`
          }
        </div>
      </div>
    `;
  }

  private render(): void {
    if (!this.container) return;

    if (this.activeArticleId) {
      const article = HELP_CENTER_ARTICLES.find((a) => a.id === this.activeArticleId);
      if (article) {
        this.container.innerHTML = this.renderArticleView(article);
        return;
      }
      this.activeArticleId = null;
    }

    const filtered = this.getFilteredArticles();
    this.container.innerHTML = `
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
          ${HELP_CENTER_CATEGORIES.map(
            (cat) => `
            <button type="button" class="hc-cat-pill${this.activeCategory === cat ? " is-active" : ""}" data-hc-cat="${cat}" role="tab" aria-selected="${this.activeCategory === cat}">${cat}</button>`
          ).join("")}
        </div>
        <div class="hc-articles-grid" id="hc-articles-grid">
          ${this.buildArticleCardsHtml(filtered)}
        </div>
      </div>
    `;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
}
