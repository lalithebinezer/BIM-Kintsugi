/**
 * ShortcutRegistry — Single Source of Truth for Keyboard Shortcuts
 *
 * Powers KeyboardController documentation, Command Palette hints, and the
 * Help & Shortcuts modal from one typed registry with automatic conflict detection.
 */

export type ShortcutCategory =
  | "Navigation"
  | "Selection"
  | "Viewport & Tools"
  | "4D Simulation"
  | "Workspace";

export interface ShortcutDefinition {
  id: string;
  keys: string;
  /** Canonical normalized key combo used for conflict detection (e.g. "ctrl+k", "shift+g", "space") */
  canonicalCombo: string;
  label: string;
  category: ShortcutCategory;
}

export const SHORTCUT_REGISTRY: readonly ShortcutDefinition[] = [
  { id: "tabs-switch", keys: "1 – 8", canonicalCombo: "digit:1-8", label: "Switch Sidebar Tabs (1–3 Left, 4–8 Right)", category: "Navigation" },
  { id: "zoom-in", keys: "+ / PageUp", canonicalCombo: "+", label: "Zoom In Camera", category: "Navigation" },
  { id: "zoom-out", keys: "- / PageDown", canonicalCombo: "-", label: "Zoom Out Camera", category: "Navigation" },
  { id: "zoom-speed-down", keys: "[", canonicalCombo: "[", label: "Decrease Camera Zoom Speed", category: "Navigation" },
  { id: "zoom-speed-up", keys: "]", canonicalCombo: "]", label: "Increase Camera Zoom Speed", category: "Navigation" },
  { id: "view-top", keys: "T", canonicalCombo: "t", label: "Snap Top Plan View", category: "Navigation" },
  { id: "view-iso", keys: "P", canonicalCombo: "p", label: "Snap Isometric 3D View", category: "Navigation" },
  { id: "focus-selection", keys: "F", canonicalCombo: "f", label: "Focus Camera on Selection", category: "Navigation" },
  { id: "fit-model", keys: "Z", canonicalCombo: "z", label: "Fit Full Model in View", category: "Navigation" },

  { id: "marquee-select", keys: "B", canonicalCombo: "b", label: "Box Marquee Drag Select", category: "Selection" },
  { id: "select-all", keys: "Ctrl+A", canonicalCombo: "ctrl+a", label: "Select All Visible Elements", category: "Selection" },
  { id: "invert-selection", keys: "Ctrl+I", canonicalCombo: "ctrl+i", label: "Invert Visible Selection", category: "Selection" },
  { id: "selection-undo", keys: "Ctrl+Z", canonicalCombo: "ctrl+z", label: "Undo Selection", category: "Selection" },
  { id: "selection-redo", keys: "Ctrl+Y", canonicalCombo: "ctrl+y", label: "Redo Selection", category: "Selection" },
  { id: "isolate-selected", keys: "I", canonicalCombo: "i", label: "Isolate Selected Elements", category: "Selection" },
  { id: "same-category", keys: "C", canonicalCombo: "c", label: "Select Same IFC Category", category: "Selection" },
  { id: "hide-selected", keys: "H", canonicalCombo: "h", label: "Hide Selected Elements", category: "Selection" },
  { id: "unhide-all", keys: "U", canonicalCombo: "u", label: "Unhide All Elements", category: "Selection" },

  { id: "grid-toggle", keys: "Shift+G", canonicalCombo: "shift+g", label: "Toggle Ground Reference Grid", category: "Viewport & Tools" },
  { id: "gis-suite", keys: "G", canonicalCombo: "g", label: "Open GeoBIM GIS & 3D Basemap Suite", category: "Viewport & Tools" },
  { id: "section-cut", keys: "X", canonicalCombo: "x", label: "Toggle 3D Section Cut Planes", category: "Viewport & Tools" },
  { id: "measure-tool", keys: "M", canonicalCombo: "m", label: "Smart 3D Dimensions Tool", category: "Viewport & Tools" },

  { id: "play-pause-4d", keys: "Space", canonicalCombo: "space", label: "Play / Pause 4D Simulation Timeline", category: "4D Simulation" },

  { id: "command-palette", keys: "Ctrl+K", canonicalCombo: "ctrl+k", label: "Open Omni Command Palette", category: "Workspace" },
  { id: "share-view-link", keys: "Ctrl+Shift+L", canonicalCombo: "ctrl+shift+l", label: "Copy Shareable 3D/4D View Link", category: "Workspace" },
  { id: "save-snapshot", keys: "Ctrl+Shift+S", canonicalCombo: "ctrl+shift+s", label: "Save Workspace Snapshot (IndexedDB)", category: "Workspace" },
  { id: "help-guide", keys: "?", canonicalCombo: "?", label: "Toggle Help & Shortcuts Guide", category: "Workspace" },
  { id: "escape-clear", keys: "Esc", canonicalCombo: "escape", label: "Cancel Drag / Clear Selection / Close Drawers", category: "Workspace" },
];

export interface ShortcutConflict {
  canonicalCombo: string;
  ids: string[];
}

export function detectShortcutConflicts(
  registry: readonly ShortcutDefinition[] = SHORTCUT_REGISTRY
): ShortcutConflict[] {
  const byCombo = new Map<string, string[]>();
  for (const item of registry) {
    const key = item.canonicalCombo.trim().toLowerCase();
    const list = byCombo.get(key) ?? [];
    list.push(item.id);
    byCombo.set(key, list);
  }
  const conflicts: ShortcutConflict[] = [];
  for (const [canonicalCombo, ids] of byCombo) {
    if (ids.length > 1) conflicts.push({ canonicalCombo, ids });
  }
  return conflicts;
}

export function getShortcutsByCategory(
  registry: readonly ShortcutDefinition[] = SHORTCUT_REGISTRY
): Map<ShortcutCategory, ShortcutDefinition[]> {
  const grouped = new Map<ShortcutCategory, ShortcutDefinition[]>();
  for (const item of registry) {
    const arr = grouped.get(item.category) ?? [];
    arr.push(item);
    grouped.set(item.category, arr);
  }
  return grouped;
}

/**
 * Renders the unified shortcut registry into any container (e.g. Help Modal Shortcuts tab)
 * so documentation can never drift out of sync with active bindings.
 */
export function renderShortcutRegistryHtml(
  registry: readonly ShortcutDefinition[] = SHORTCUT_REGISTRY
): string {
  const grouped = getShortcutsByCategory(registry);
  const sections: string[] = [];
  for (const [cat, items] of grouped) {
    const rows = items
      .map(
        (s) =>
          `<div class="shortcut-row"><kbd>${s.keys}</kbd> <span>${s.label}</span></div>`
      )
      .join("");
    sections.push(
      `<div class="shortcut-group"><div class="help-section-title" style="margin-top:0.35rem;">${cat.toUpperCase()}</div>${rows}</div>`
    );
  }
  return sections.join("");
}
