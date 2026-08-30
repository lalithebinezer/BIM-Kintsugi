/**
 * Keyboard Controller (Separation of Concerns)
 * Manages keybindings, modal shortcuts (?), and viewport navigation triggers.
 */

export class KeyboardController {
  private static instance: KeyboardController | null = null;
  private initialized = false;

  private constructor() {}

  public static getInstance(): KeyboardController {
    if (!KeyboardController.instance) {
      KeyboardController.instance = new KeyboardController();
    }
    return KeyboardController.instance;
  }

  public init() {
    if (this.initialized) return;
    this.initialized = true;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        activeEl.tagName === 'SELECT' ||
        (activeEl as HTMLElement).isContentEditable
      );

      if (e.key === 'Escape') {
        if (activeEl && (activeEl as HTMLElement).blur) {
          (activeEl as HTMLElement).blur();
        }
        // Clear all 3D element selections and close menus/modals
        if (typeof (window as any).clearAllSelections === 'function') {
          (window as any).clearAllSelections();
        } else {
          document.getElementById('btn-clear-selection')?.click();
          document.getElementById('btn-batch-clear')?.click();
        }
        const ctxMenu = document.getElementById('bim-context-menu');
        if (ctxMenu) ctxMenu.style.display = 'none';
        const cmdModal = document.getElementById('command-palette-modal');
        if (cmdModal) cmdModal.style.display = 'none';
        document.querySelectorAll('.enterprise-drawer').forEach((d) => d.classList.add('hidden'));
        return;
      }

      if (isTyping) return;

      const switchTab = (window as any).switchSidebarTab;
      if (typeof switchTab === 'function') {
        switch (e.key) {
          case '1': switchTab('left-tab-bar', 'files'); break;
          case '2': switchTab('left-tab-bar', 'finder'); break;
          case '3': switchTab('left-tab-bar', 'schedule'); break;
          case '4': switchTab('right-tab-bar', 'scene'); break;
          case '5': switchTab('right-tab-bar', 'inspector'); break;
          case '6': switchTab('right-tab-bar', 'controls'); break;
          case '7': switchTab('right-tab-bar', 'tools'); break;
        }
      }


      // BIM Feature Hotkeys
      const keyLower = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && keyLower === 'a') {
        e.preventDefault();
        document.getElementById('btn-select-all')?.click();
      } else if ((e.ctrlKey || e.metaKey) && keyLower === 'i') {
        e.preventDefault();
        document.getElementById('btn-invert-select')?.click();
      } else if (keyLower === 'b') {
        document.getElementById('btn-box-select')?.click();
      } else if (keyLower === 'c') {
        document.getElementById('btn-selection-hud-category')?.click();
      } else if (keyLower === 'f') {
        document.getElementById('btn-focus')?.click();
      } else if (keyLower === 'h') {
        document.getElementById('btn-hide-selected')?.click();
      } else if (keyLower === 'i') {
        document.getElementById('btn-isolate')?.click();
      } else if (keyLower === 'u') {
        document.getElementById('btn-show-all')?.click();
      } else if (keyLower === 'x') {
        document.getElementById('btn-section-cut')?.click();
      } else if (keyLower === 'm') {
        document.getElementById('btn-header-measure')?.click();
      } else if (keyLower === 'z') {
        document.getElementById('btn-view-fit')?.click();
      } else if (keyLower === 't') {
        document.getElementById('btn-view-top')?.click();
      } else if (keyLower === 'p') {
        document.getElementById('btn-view-iso')?.click();
      } else if (e.key === ' ' || e.code === 'Space') {
        const btn4dPlay = document.getElementById('timeline-play-btn');
        const timelinePanel = document.getElementById('timeline-panel');
        if (btn4dPlay && timelinePanel && (timelinePanel.classList.contains('active') || timelinePanel.style.display !== 'none')) {
          e.preventDefault();
          btn4dPlay.click();
        }
      }
    });
  }
}
