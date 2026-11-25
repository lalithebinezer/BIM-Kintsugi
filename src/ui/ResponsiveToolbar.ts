/**
 * ResponsiveToolbar — Compact Mobile Dock ("More" Tools Sheet) & Header Mobile Menu
 *
 * Keeps all existing desktop buttons and handlers intact while exposing:
 *  1. Compact 5-slot mobile bottom dock + clean 2-column expanded "More" tools sheet
 *  2. Standardized header Mobile Menu (`#btn-mobile-menu` -> `createBkDropdown`) on <= 768px
 *     so Saved Views, Workspace Mode, Sidebar Tabs, Camera Modes, 4K Sheet, and Help
 *     are always 1 tap away on phones & compact tablets.
 */

import { createBkDropdown, type BkDropdownHandle } from "./UiPlatform";

function initMobileHeaderMenu(): void {
  const headerControls = document.querySelector<HTMLElement>("header .header-controls");
  if (!headerControls || document.getElementById("btn-mobile-menu")) return;

  const menuBtn = document.createElement("button");
  menuBtn.type = "button";
  menuBtn.id = "btn-mobile-menu";
  menuBtn.className = "btn-sidebar-toggle mobile-menu-trigger";
  menuBtn.title = "Open Mobile Menu (Views, Workspace, Camera & Help)";
  menuBtn.setAttribute("aria-label", "Open Mobile Menu");
  menuBtn.setAttribute("aria-haspopup", "menu");
  menuBtn.setAttribute("aria-expanded", "false");
  menuBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;

  const rightToggle = document.getElementById("btn-toggle-right");
  if (rightToggle && rightToggle.parentElement === headerControls) {
    headerControls.insertBefore(menuBtn, rightToggle);
  } else {
    headerControls.appendChild(menuBtn);
  }

  let dropdown: BkDropdownHandle | null = null;

  const buildMenu = (): BkDropdownHandle => {
    dropdown?.destroy();
    const personaSelect = document.getElementById("workspace-persona-select") as HTMLSelectElement | null;
    const currentPersonaLabel =
      personaSelect?.selectedOptions?.[0]?.textContent?.trim() || "All Tools";
    const viewsBadge = document.getElementById("saved-views-count-badge")?.textContent?.trim() || "";

    const switchTab = (barId: string, tab: string) => {
      (window as any).switchSidebarTab?.(barId, tab);
    };

    const cyclePersona = () => {
      if (!personaSelect || personaSelect.options.length === 0) return;
      const nextIdx = (personaSelect.selectedIndex + 1) % personaSelect.options.length;
      personaSelect.selectedIndex = nextIdx;
      personaSelect.dispatchEvent(new Event("change", { bubbles: true }));
    };

    dropdown = createBkDropdown({
      id: "mobile-main-menu",
      anchor: menuBtn,
      items: [
        {
          id: "mob-switch-cockpit",
          label: "Switch to Cockpit UI",
          badge: "✦",
          onSelect: () => {
            (window as any).setUiLayout?.("cockpit");
          },
        },
        {
          id: "mob-views",
          label: "Saved Views & Bookmarks",
          badge: viewsBadge || undefined,
          dividerBefore: true,
          onSelect: () => {
            document.getElementById("btn-ribbon-saved-views")?.click();
          },
        },
        {
          id: "mob-persona",
          label: "Workspace Mode",
          badge: currentPersonaLabel,
          onSelect: cyclePersona,
        },
        {
          id: "mob-files",
          label: "Project Files & IFC",
          dividerBefore: true,
          onSelect: () => switchTab("left-tab-bar", "files"),
        },
        {
          id: "mob-finder",
          label: "Items Finder",
          onSelect: () => switchTab("left-tab-bar", "finder"),
        },
        {
          id: "mob-4d",
          label: "4D Construction Schedule",
          onSelect: () => switchTab("left-tab-bar", "schedule"),
        },
        {
          id: "mob-scene",
          label: "Scene & Hierarchy",
          dividerBefore: true,
          onSelect: () => switchTab("right-tab-bar", "scene"),
        },
        {
          id: "mob-meta",
          label: "Element Metadata",
          onSelect: () => switchTab("right-tab-bar", "metadata"),
        },
        {
          id: "mob-inspector",
          label: "4D / 5D Cost Inspector",
          onSelect: () => switchTab("right-tab-bar", "inspector"),
        },
        {
          id: "mob-tools",
          label: "Tools & Measurements",
          onSelect: () => switchTab("right-tab-bar", "tools"),
        },
        {
          id: "mob-drone",
          label: "Drone 360° Orbit",
          dividerBefore: true,
          onSelect: () => document.getElementById("btn-drone-orbit")?.click(),
        },
        {
          id: "mob-tour",
          label: "Walkthrough Tour",
          onSelect: () => document.getElementById("btn-play-tour")?.click(),
        },
        {
          id: "mob-slice",
          label: "Slice Active Floor",
          onSelect: () => document.getElementById("btn-toggle-storey-slice")?.click(),
        },
        {
          id: "mob-snapshot",
          label: "Export 4K Sheet",
          onSelect: () => document.getElementById("btn-view-snapshot")?.click(),
        },
        {
          id: "mob-search",
          label: "Search Everything",
          badge: "⌘K",
          dividerBefore: true,
          onSelect: () => document.getElementById("btn-open-command-palette")?.click(),
        },
        {
          id: "mob-help",
          label: "Help & Shortcuts Guide",
          badge: "?",
          onSelect: () => {
            if (typeof (window as any).toggleShortcutsModal === "function") {
              (window as any).toggleShortcutsModal();
            } else {
              document.getElementById("btn-shortcuts-toggle")?.click();
            }
          },
        },
      ],
    });
    return dropdown;
  };

  menuBtn.addEventListener("click", (ev) => {
    ev.stopPropagation();
    const isOpen = dropdown && !dropdown.menu.classList.contains("hidden");
    if (isOpen) {
      dropdown?.close();
    } else {
      buildMenu().open();
    }
  });
}

export function initResponsiveToolbar() {
  initMobileHeaderMenu();

  const dock = document.getElementById("bottom-toolbar");
  if (!dock || dock.querySelector(".responsive-more")) return;
  const primary = new Set(["btn-load-ifc", "btn-focus", "btn-dock-measure", "btn-section-cut"]);
  for (const button of dock.querySelectorAll<HTMLButtonElement>("button.dock-icon")) {
    const kind = primary.has(button.id) ? "compact-primary" : "compact-secondary";
    button.classList.add(kind);
    button.closest(".dock-item")?.classList.add(kind + "-item");
    const label = button.getAttribute("aria-label") || button.title;
    if (label) button.setAttribute("aria-label", label);
  }
  const more = document.createElement("button");
  more.type = "button";
  more.className = "btn-tool responsive-more";
  more.textContent = "More";
  more.setAttribute("aria-expanded", "false");
  more.setAttribute("aria-label", "More tools");
  more.setAttribute("aria-controls", dock.id);
  dock.append(more);

  const syncMoreLabel = (expanded: boolean) => {
    more.textContent = expanded ? "Close Tools ✕" : "More";
    more.setAttribute("aria-expanded", String(expanded));
  };

  const close = () => {
    const restoreFocus =
      dock.classList.contains("tools-expanded") &&
      document.activeElement?.classList.contains("compact-secondary");
    dock.classList.remove("tools-expanded");
    syncMoreLabel(false);
    if (restoreFocus && matchMedia("(max-width: 768px)").matches) more.focus();
  };

  more.addEventListener("click", () => {
    const expanded = dock.classList.toggle("tools-expanded");
    syncMoreLabel(expanded);
  });
  dock.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dock.classList.contains("tools-expanded")) {
      event.stopPropagation();
      close();
      more.focus();
    }
  });
  dock.addEventListener("click", (event) => {
    const button = (event.target as Element).closest("button");
    if (button && button !== more) close();
  });
  const compact = matchMedia("(max-width: 768px)");
  compact.addEventListener("change", close);
  document.addEventListener("pointerdown", (event) => {
    if (!dock.contains(event.target as Node)) close();
  });
}
