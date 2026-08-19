/**
 * UI Manager (Separation of Concerns)
 * Manages UI overlays, sidebar tab systems, mobile navigation, help modal, and theme switcher event bindings.
 */

export class UIManager {
  private static instance: UIManager | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): UIManager {
    if (!UIManager.instance) {
      UIManager.instance = new UIManager();
    }
    return UIManager.instance;
  }

  public init() {
    if (this.initialized) return;
    this.initialized = true;

    this.setupSidebarTabSystem();
    this.setupSettingsCategorySystem();
    this.setupHelpModalController();
    this.setupMobileNavigation();
  }

  public setupSettingsCategorySystem() {
    const sceneNav = document.getElementById("scene-settings-cat-nav");
    if (sceneNav) {
      sceneNav.querySelectorAll(".settings-cat-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.currentTarget as HTMLElement;
          const cat = target.getAttribute("data-cat");
          if (!cat) return;

          sceneNav.querySelectorAll(".settings-cat-btn").forEach((b) => b.classList.remove("active"));
          target.classList.add("active");

          document.querySelectorAll(".settings-cat-panel").forEach((panel) => {
            const el = panel as HTMLElement;
            if (el.id === `scat-${cat}`) {
              el.style.display = "block";
              el.classList.add("active");
            } else {
              el.style.display = "none";
              el.classList.remove("active");
            }
          });
        });
      });
    }

    const toolsNav = document.getElementById("tools-settings-cat-nav");
    if (toolsNav) {
      toolsNav.querySelectorAll(".tools-cat-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const target = e.currentTarget as HTMLElement;
          const tcat = target.getAttribute("data-tcat");
          if (!tcat) return;

          toolsNav.querySelectorAll(".tools-cat-btn").forEach((b) => b.classList.remove("active"));
          target.classList.add("active");

          document.querySelectorAll(".tools-cat-panel").forEach((panel) => {
            const el = panel as HTMLElement;
            if (el.id === `tcat-${tcat}`) {
              el.style.display = "flex";
              el.classList.add("active");
            } else {
              el.style.display = "none";
              el.classList.remove("active");
            }
          });
        });
      });
    }
  }

  public setupSidebarTabSystem() {
    const switchSidebarTab = (tabBarId: string, tabName: string) => {
      const tabBar = document.getElementById(tabBarId);
      if (!tabBar) return;

      const isLeft = tabBarId === 'left-tab-bar';
      const sidebar = document.querySelector(isLeft ? '.left-sidebar' : '.right-sidebar');
      if (!sidebar) return;

      const isMobile = window.innerWidth <= 1024;
      const currentActiveBtn = tabBar.querySelector('.sidebar-tab-btn.active, .tab-btn.active');
      const currentActiveTab = currentActiveBtn?.getAttribute('data-tab');

      // On mobile, clicking the currently active tab closes the drawer
      if (isMobile && currentActiveTab === tabName && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        currentActiveBtn?.classList.remove('active');

        const otherSidebar = document.querySelector(isLeft ? '.right-sidebar' : '.left-sidebar');
        if (!otherSidebar?.classList.contains('open')) {
          document.getElementById('sidebar-backdrop')?.classList.remove('active');
        }
        return;
      }

      // On desktop, if the sidebar was collapsed, uncollapse it when switching tabs
      if (!isMobile) {
        if (isLeft && document.body.classList.contains('left-sidebar-collapsed')) {
          document.body.classList.remove('left-sidebar-collapsed');
        } else if (!isLeft && document.body.classList.contains('right-sidebar-collapsed')) {
          document.body.classList.remove('right-sidebar-collapsed');
        }
      }

      if (isMobile) {
        sidebar.classList.add('open');
        document.getElementById('sidebar-backdrop')?.classList.add('active');
      }

      tabBar.querySelectorAll('.sidebar-tab-btn, .tab-btn').forEach((btn) => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabName);
      });

      const parentEl = sidebar;
      parentEl.querySelectorAll('.tab-content-panel').forEach((panel) => {
        const panelId = isLeft ? `tab-left-${tabName}` : `tab-right-${tabName}`;
        panel.classList.toggle('active', panel.id === panelId);
      });
    };

    (window as any).switchSidebarTab = switchSidebarTab;

    document.querySelectorAll('.sidebar-tab-btn, .tab-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget as HTMLElement;
        const tabBar = target.closest('.sidebar-tab-bar');
        const tabName = target.getAttribute('data-tab');
        if (tabBar && tabName) {
          switchSidebarTab(tabBar.id, tabName);
        }
      });
    });

    const closeAllSidebars = () => {
      document.querySelector('.left-sidebar')?.classList.remove('open');
      document.querySelector('.right-sidebar')?.classList.remove('open');
      document.getElementById('sidebar-backdrop')?.classList.remove('active');
      document.querySelectorAll('.mobile-nav-btn').forEach((b) => b.classList.remove('active'));
    };
    (window as any).closeAllSidebars = closeAllSidebars;

    document.querySelectorAll('.btn-panel-back').forEach((btn) => {
      btn.addEventListener('click', closeAllSidebars);
    });

    document.getElementById('btn-toggle-left')?.addEventListener('click', () => {
      if (window.innerWidth > 1024) {
        document.body.classList.toggle('left-sidebar-collapsed');
        if (!document.body.classList.contains('left-sidebar-collapsed')) {
          document.body.classList.add('right-sidebar-collapsed');
        }
      } else {
        const leftSidebar = document.querySelector('.left-sidebar');
        if (leftSidebar?.classList.contains('open')) {
          closeAllSidebars();
        } else {
          switchSidebarTab('left-tab-bar', 'files');
        }
      }
    });

    document.getElementById('btn-toggle-right')?.addEventListener('click', () => {
      if (window.innerWidth > 1024) {
        document.body.classList.toggle('right-sidebar-collapsed');
        if (!document.body.classList.contains('right-sidebar-collapsed')) {
          document.body.classList.add('left-sidebar-collapsed');
        }
      } else {
        const rightSidebar = document.querySelector('.right-sidebar');
        if (rightSidebar?.classList.contains('open')) {
          closeAllSidebars();
        } else {
          switchSidebarTab('right-tab-bar', 'scene');
        }
      }
    });

    document.getElementById('sidebar-backdrop')?.addEventListener('click', closeAllSidebars);
  }

  public setupHelpModalController() {
    const helpModal = document.getElementById("shortcuts-modal");
    const btnShortcutsToggle = document.getElementById("btn-shortcuts-toggle");
    const btnShortcutsClose  = document.getElementById("btn-shortcuts-close");
    const btnHelpNext        = document.getElementById("btn-help-next") as HTMLButtonElement | null;
    const btnHelpPrev        = document.getElementById("btn-help-prev") as HTMLButtonElement | null;
    const btnHelpDone        = document.getElementById("btn-help-done") as HTMLButtonElement | null;
    const helpDontShow       = document.getElementById("help-dont-show-again") as HTMLInputElement | null;

    const HELP_TABS = ["welcome", "tools", "shortcuts", "navigate"] as const;
    type HelpTab = typeof HELP_TABS[number];
    let helpCurrentTab: HelpTab = "welcome";

    const switchHelpTab = (tab: HelpTab) => {
      helpCurrentTab = tab;
      document.querySelectorAll(".help-tab-btn").forEach((btn) => {
        const isActive = (btn as HTMLElement).getAttribute("data-help-tab") === tab;
        btn.classList.toggle("active", isActive);
      });

      document.querySelectorAll(".help-tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `help-tab-${tab}`);
      });

      const idx = HELP_TABS.indexOf(tab);
      if (btnHelpPrev) btnHelpPrev.classList.toggle("hidden", idx === 0);
      if (btnHelpNext) btnHelpNext.classList.toggle("hidden", idx === HELP_TABS.length - 1);
      if (btnHelpDone) btnHelpDone.classList.toggle("hidden", idx !== HELP_TABS.length - 1);
    };

    const openHelpModal = (startTab: HelpTab = "welcome") => {
      if (!helpModal) return;
      helpModal.classList.remove("hidden");
      switchHelpTab(startTab);
    };

    const closeHelpModal = () => {
      if (!helpModal) return;
      helpModal.classList.add("hidden");
      if (helpDontShow?.checked) {
        localStorage.setItem("bim-help-dont-show", "1");
      }
    };

    const toggleShortcutsModal = (forceOpen?: boolean) => {
      if (!helpModal) return;
      const isHidden = helpModal.classList.contains("hidden");
      if (forceOpen === true || (forceOpen === undefined && isHidden)) {
        openHelpModal("welcome");
      } else {
        closeHelpModal();
      }
    };
    (window as any).toggleShortcutsModal = toggleShortcutsModal;

    btnShortcutsToggle?.addEventListener("click", () => openHelpModal("welcome"));
    btnShortcutsClose?.addEventListener("click", closeHelpModal);

    helpModal?.addEventListener("click", (e) => {
      if (e.target === helpModal) closeHelpModal();
    });

    document.querySelectorAll(".help-tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute("data-help-tab") as HelpTab | null;
        if (tab) switchHelpTab(tab);
      });
    });

    btnHelpNext?.addEventListener("click", () => {
      const idx = HELP_TABS.indexOf(helpCurrentTab);
      if (idx < HELP_TABS.length - 1) switchHelpTab(HELP_TABS[idx + 1]);
    });

    btnHelpPrev?.addEventListener("click", () => {
      const idx = HELP_TABS.indexOf(helpCurrentTab);
      if (idx > 0) switchHelpTab(HELP_TABS[idx - 1]);
    });

    btnHelpDone?.addEventListener("click", closeHelpModal);
  }

  public setupMobileNavigation() {
    const mobileNavBtns = document.querySelectorAll<HTMLButtonElement>(".mobile-nav-btn");
    mobileNavBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetTab = btn.getAttribute("data-mobile-tab");
        if (!targetTab) return;

        const leftSidebar = document.querySelector(".left-sidebar");
        const rightSidebar = document.querySelector(".right-sidebar");
        const isLeftOpen = leftSidebar?.classList.contains("open");
        const isRightOpen = rightSidebar?.classList.contains("open");
        const isBtnActive = btn.classList.contains("active");

        const closeAll = (window as any).closeAllSidebars;

        if (isBtnActive && (isLeftOpen || isRightOpen)) {
          if (typeof closeAll === "function") closeAll();
          return;
        }

        mobileNavBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        if (targetTab === "files" || targetTab === "finder" || targetTab === "sched" || targetTab === "schedule") {
          rightSidebar?.classList.remove("open");
          leftSidebar?.classList.add("open");

          const actualTab = targetTab === "sched" ? "schedule" : targetTab;
          const tabBtn = document.querySelector<HTMLButtonElement>(`#left-tab-bar [data-tab="${actualTab}"]`);
          if (tabBtn) tabBtn.click();
        } else if (targetTab === "scene" || targetTab === "tools" || targetTab === "inspector" || targetTab === "controls") {
          leftSidebar?.classList.remove("open");
          rightSidebar?.classList.add("open");

          const tabBtn = document.querySelector<HTMLButtonElement>(`#right-tab-bar [data-tab="${targetTab}"]`);
          if (tabBtn) tabBtn.click();
        }

        const backdrop = document.getElementById("sidebar-backdrop");
        if (backdrop) backdrop.classList.add("active");
      });
    });
  }
}
