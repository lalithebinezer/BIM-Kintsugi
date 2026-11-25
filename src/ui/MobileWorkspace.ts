/**
 * MobileWorkspace (Unified Spatial BIM Cockpit) — All Screen Sizes (320px -> 4K)
 *
 * Delegates 100% of actions to existing battle-tested DOM controls & window APIs
 * (zero duplicated business logic). Scales seamlessly across:
 *  - Desktop & Ultrawide (>= 1081px): Floating bar, centered 5-tab command pill,
 *    side-by-side floating glass panels, anchored popover cards, single-row 4D pill.
 *  - Tablet (768px - 1080px): Floating bar, centered 5-tab pill, slide-over drawers,
 *    anchored popover cards, single-row 4D pill.
 *  - Phone Portrait & Landscape (<= 767px): Slim bar, edge-to-edge 5-tab thumb bar,
 *    swipe-down bottom sheets, 2-row 4D scrubber, dual-thumb walkthrough joystick.
 */

import { showToast } from "./ToastManager";
import { StorageCache } from "../utils/storageCache";

export type MobileSheetId = "tools" | "suites" | "menu" | "storey" | "4d";
export type UiLayoutMode = "cockpit" | "classic";
export const UI_LAYOUT_STORAGE_KEY = "bim_ui_layout";

interface MobileActionItem {
  id: string;
  targetId: string;
  label: string;
  subtitle?: string;
  icon: string;
  accent?: string;
}

const MOBILE_MEDIA_QUERY = "(max-width: 767px), (max-height: 460px) and (max-width: 932px)";

function vibrateTap(ms = 8): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(ms);
    }
  } catch {
    /* unsupported or blocked */
  }
}

const FOURD_TOOLS: MobileActionItem[] = [
  {
    id: "mob-4d-act-gantt",
    targetId: "btn-4d-gantt-chart",
    label: "WBS Gantt",
    subtitle: "Interactive schedule",
    accent: "#38BDF8",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="18" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.5"/><circle cx="4" cy="12" r="1.5"/><circle cx="4" cy="18" r="1.5"/></svg>`,
  },
  {
    id: "mob-4d-act-cashflow",
    targetId: "btn-4d-cashflow-histogram",
    label: "Cash-Flow",
    subtitle: "Cost & labor chart",
    accent: "#10B981",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  },
  {
    id: "mob-4d-act-cascade",
    targetId: "btn-4d-cascade-toggle",
    label: "CasCADe Lens",
    subtitle: "Slack & float heatmap",
    accent: "#A855F7",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></svg>`,
  },
  {
    id: "mob-4d-act-crane",
    targetId: "btn-4d-crane-envelope",
    label: "Tower Crane",
    subtitle: "3D swing safety",
    accent: "#F59E0B",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16M7 20V5l13 4M7 9h10"/></svg>`,
  },
  {
    id: "mob-4d-act-whatif",
    targetId: "btn-4d-whatif-sandbox",
    label: "What-If Sim",
    subtitle: "Delay impact cascade",
    accent: "#F43F5E",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  },
  {
    id: "mob-4d-act-lookahead",
    targetId: "btn-4d-lookahead",
    label: "Lookahead",
    subtitle: "2–6 week site window",
    accent: "#06B6D4",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
  },
  {
    id: "mob-4d-act-slf",
    targetId: "btn-4d-slf-toggle",
    label: "SLF Zones",
    subtitle: "Workspace congestion",
    accent: "#EAB308",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>`,
  },
  {
    id: "mob-4d-act-variance",
    targetId: "btn-4d-variance-toggle",
    label: "Variance",
    subtitle: "Planned vs actual",
    accent: "#34D399",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17l6-6 4 4 8-8"/></svg>`,
  },
];

const FIELD_PRIMARY_TOOLS: MobileActionItem[] = [
  {
    id: "mob-tool-measure",
    targetId: "btn-dock-measure",
    label: "Measure 3D",
    subtitle: "Point-to-point",
    accent: "#38BDF8",
    icon: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.3 8.7 8.7 21.3a2.12 2.12 0 0 1-3 0l-4.4-4.4a2.12 2.12 0 0 1 0-3L14 1.3a2.12 2.12 0 0 1 3 0l4.3 4.4a2.12 2.12 0 0 1 0 3Z"/><line x1="14.5" y1="4.5" x2="16.5" y2="6.5"/><line x1="11" y1="8" x2="13" y2="10"/><line x1="7.5" y1="11.5" x2="9.5" y2="13.5"/></svg>`,
  },
  {
    id: "mob-tool-section",
    targetId: "btn-section-cut",
    label: "Section Cut",
    subtitle: "Clip 3D planes",
    accent: "#F59E0B",
    icon: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
  },
  {
    id: "mob-tool-box",
    targetId: "btn-box-select",
    label: "Box Select",
    subtitle: "Drag marquee",
    accent: "#A855F7",
    icon: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3"/><polyline points="9 9 15 15"/><polyline points="15 9 9 15"/></svg>`,
  },
  {
    id: "mob-tool-visibility",
    targetId: "btn-toggle-visibility",
    label: "Hide / Show All",
    subtitle: "Toggle visibility",
    accent: "#10B981",
    icon: `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  },
];

const FIELD_SELECTION_CHIPS: MobileActionItem[] = [
  { id: "mob-chip-focus", targetId: "btn-focus", label: "Focus", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>` },
  { id: "mob-chip-isolate", targetId: "btn-isolate", label: "Isolate", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>` },
  { id: "mob-chip-hide", targetId: "btn-hide-selected", label: "Hide Sel.", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg>` },
  { id: "mob-chip-invert", targetId: "btn-invert-select", label: "Invert", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/></svg>` },
  { id: "mob-chip-clear-sel", targetId: "btn-clear-selection", label: "Clear Sel.", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>` },
  { id: "mob-chip-clear-cuts", targetId: "btn-clear-sections", label: "Clear Cuts", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>` },
  { id: "mob-chip-grid", targetId: "btn-dock-toggle-grid", label: "Ground Grid", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>` },
];

const FIELD_FILE_CHIPS: MobileActionItem[] = [
  { id: "mob-io-ifc", targetId: "btn-load-ifc", label: "Load IFC", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>` },
  { id: "mob-io-frag", targetId: "btn-load-frag", label: "Load FRAG", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>` },
  { id: "mob-io-export", targetId: "btn-export-frag", label: "Export FRAG", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>` },
  { id: "mob-io-sheet", targetId: "btn-view-snapshot", label: "4K Sheet", icon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>` },
];

const SUITE_COORDINATION: MobileActionItem[] = [
  {
    id: "mob-suite-clash",
    targetId: "btn-dock-clash",
    label: "Clash Matrix",
    subtitle: "Spatial & 4D conflicts",
    accent: "#F43F5E",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
  {
    id: "mob-suite-bcf",
    targetId: "btn-dock-bcf",
    label: "BCF Issues",
    subtitle: "Field pins & topics",
    accent: "#A855F7",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2.2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/><path d="m9 14 2 2 4-4"/></svg>`,
  },
  {
    id: "mob-suite-copilot",
    targetId: "btn-dock-copilot",
    label: "AI Copilot",
    subtitle: "Ask BIM in plain text",
    accent: "#38BDF8",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2"><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/></svg>`,
  },
  {
    id: "mob-suite-collab",
    targetId: "btn-dock-collab",
    label: "Live Peers",
    subtitle: "Shared review room",
    accent: "#22C55E",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>`,
  },
];

const SUITE_ANALYTICS: MobileActionItem[] = [
  {
    id: "mob-suite-cost",
    targetId: "btn-dock-cost",
    label: "5D Cost & BOQ",
    subtitle: "Rates & quality audit",
    accent: "#10B981",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  },
  {
    id: "mob-suite-evm",
    targetId: "btn-dock-evm",
    label: "EVM Control",
    subtitle: "CPI / SPI tracking",
    accent: "#EAB308",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" stroke-width="2.2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  },
  {
    id: "mob-suite-carbon",
    targetId: "btn-dock-carbon",
    label: "6D Carbon LCA",
    subtitle: "Embodied heatmap",
    accent: "#34D399",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34D399" stroke-width="2.2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>`,
  },
  {
    id: "mob-suite-gis",
    targetId: "btn-dock-gis",
    label: "GeoBIM GIS",
    subtitle: "3D map, sun & survey",
    accent: "#06B6D4",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
  },
  {
    id: "mob-suite-eng",
    targetId: "btn-dock-engineering",
    label: "Engineering",
    subtitle: "DXF · Scans · Civil",
    accent: "#38BDF8",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h5"/></svg>`,
  },
  {
    id: "mob-suite-params",
    targetId: "btn-dock-ifc-params",
    label: "IFC Params",
    subtitle: "4D sequence reader",
    accent: "#D4FF3F",
    icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D4FF3F" stroke-width="2.2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`,
  },
];

const THEME_PRESETS = [
  {
    value: "obsidian",
    label: "Obsidian",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  },
  {
    value: "light",
    label: "Studio",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41"/></svg>`,
  },
  {
    value: "zen",
    label: "Zen",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>`,
  },
  {
    value: "cyberpunk",
    label: "Neon",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  },
  {
    value: "blueprint",
    label: "CAD",
    icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  },
];

const PERSONA_ICONS: Record<string, string> = {
  all: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  design: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/></svg>`,
  "planner-4d": `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
  "commercial-5d": `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
  field: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>`,
};

const SHEET_HEADER_META: Record<MobileSheetId, { accent: string; helpId: string; icon: string }> = {
  tools: {
    accent: "#38BDF8",
    helpId: "mobile-field-guide",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.3 8.7 8.7 21.3a2.12 2.12 0 0 1-3 0l-4.4-4.4a2.12 2.12 0 0 1 0-3L14 1.3a2.12 2.12 0 0 1 3 0l4.3 4.4a2.12 2.12 0 0 1 0 3Z"/><line x1="14.5" y1="4.5" x2="16.5" y2="6.5"/><line x1="11" y1="8" x2="13" y2="10"/></svg>`,
  },
  suites: {
    accent: "#A855F7",
    helpId: "clash-bcf",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  },
  storey: {
    accent: "#10B981",
    helpId: "getting-started",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
  },
  menu: {
    accent: "#38BDF8",
    helpId: "ui-layouts",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>`,
  },
  "4d": {
    accent: "#F59E0B",
    helpId: "4d-simulation",
    icon: `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>`,
  },
};

const FLAT_SECTION_ICONS = {
  layout: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
  theme: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" opacity="0.25"/></svg>`,
  role: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  camera: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  tools: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  select: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>`,
  folder: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  spark: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  chart: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
  layers: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>`,
  speed: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>`,
};

export interface MobileWorkspaceController {
  openSheet: (id: MobileSheetId) => void;
  closeAllSheets: () => void;
  syncState: () => void;
  isMobileViewport: () => boolean;
  getUiLayout: () => UiLayoutMode;
  setUiLayout: (mode: UiLayoutMode, announce?: boolean, persist?: boolean) => void;
  toggleUiLayout: () => UiLayoutMode;
}

export function getDefaultUiLayout(): UiLayoutMode {
  return isMobileViewport() ? "cockpit" : "classic";
}

function readExplicitUiLayout(): UiLayoutMode | null {
  try {
    const saved = localStorage.getItem(UI_LAYOUT_STORAGE_KEY);
    if (saved === "classic" || saved === "cockpit") return saved;
  } catch {
    /* storage unavailable */
  }
  return null;
}

function readSavedUiLayout(): UiLayoutMode {
  return readExplicitUiLayout() ?? getDefaultUiLayout();
}

let activeController: MobileWorkspaceController | null = null;
let activeCleanup: (() => void) | null = null;

function setClassIfChanged(el: Element | null | undefined, cls: string, active: boolean): void {
  if (!el) return;
  const has = el.classList.contains(cls);
  if (has !== active) {
    el.classList.toggle(cls, active);
  }
}

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function createSheetShell(
  id: MobileSheetId,
  title: string,
  subtitle: string,
  bodyHtml: string,
  onClose: () => void
): HTMLElement {
  const sheet = document.createElement("section");
  sheet.id = `mob-sheet-${id}`;
  sheet.className = "mob-sheet bk-cockpit";
  sheet.setAttribute("role", "dialog");
  sheet.setAttribute("aria-modal", "false");
  sheet.setAttribute("aria-label", title);
  const headerMeta = SHEET_HEADER_META[id];
  sheet.innerHTML = `
    <div class="mob-sheet__handle-zone" data-mob-drag="1" aria-hidden="true">
      <span class="mob-sheet__handle"></span>
    </div>
    <div class="mob-sheet__header">
      <div class="mob-sheet__header-lead">
        <span class="mob-sheet__title-icon" style="--icon-accent:${headerMeta.accent}">${headerMeta.icon}</span>
        <div class="mob-sheet__title-wrap">
          <h2 class="mob-sheet__title">${title}</h2>
          <span class="mob-sheet__subtitle">${subtitle}</span>
        </div>
      </div>
      <div class="mob-sheet__header-actions">
        <button type="button" class="mob-sheet__icon-btn mob-sheet__help-btn" data-help-article="${headerMeta.helpId}" title="Open Step-by-Step Help Guide" aria-label="Help for ${title}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </button>
        <button type="button" class="mob-sheet__icon-btn mob-sheet__expand-btn" title="Toggle Full Height" aria-label="Toggle Sheet Height">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
        <button type="button" class="mob-sheet__icon-btn mob-sheet__close-btn" title="Close" aria-label="Close ${title}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
    <div class="mob-sheet__body thin-scrollbar">${bodyHtml}</div>
  `;

  sheet.querySelector(".mob-sheet__close-btn")?.addEventListener("click", onClose);
  sheet.querySelector(".mob-sheet__help-btn")?.addEventListener("click", () => {
    onClose();
    (window as any).openHelpArticle?.(headerMeta.helpId);
  });
  sheet.querySelector(".mob-sheet__expand-btn")?.addEventListener("click", () => {
    sheet.classList.toggle("is-expanded");
  });
  attachSheetSwipeGestures(sheet, onClose);
  return sheet;
}

function attachSheetSwipeGestures(sheet: HTMLElement, onDismiss: () => void): void {
  const dragZone = sheet.querySelector<HTMLElement>("[data-mob-drag]");
  if (!dragZone) return;

  let startY = 0;
  let deltaY = 0;
  let dragging = false;

  const onStart = (ev: TouchEvent) => {
    if (ev.touches.length !== 1) return;
    startY = ev.touches[0].clientY;
    deltaY = 0;
    dragging = true;
    sheet.style.transition = "none";
  };

  const onMove = (ev: TouchEvent) => {
    if (!dragging || ev.touches.length !== 1) return;
    deltaY = ev.touches[0].clientY - startY;
    if (deltaY > 0) {
      sheet.style.transform = `translateY(${Math.min(deltaY, 320)}px)`;
    } else if (deltaY < -24) {
      sheet.classList.add("is-expanded");
    }
  };

  const onEnd = () => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = "";
    sheet.style.transform = "";
    if (deltaY > 75) {
      if (sheet.classList.contains("is-expanded") && deltaY < 165) {
        sheet.classList.remove("is-expanded");
      } else {
        onDismiss();
      }
    }
    deltaY = 0;
  };

  dragZone.addEventListener("touchstart", onStart, { passive: true });
  dragZone.addEventListener("touchmove", onMove, { passive: true });
  dragZone.addEventListener("touchend", onEnd, { passive: true });
  dragZone.addEventListener("touchcancel", onEnd, { passive: true });
}

function injectSidebarMobileChrome(
  sidebar: HTMLElement | null,
  title: string,
  iconSvg: string,
  accent: string,
  onClose: () => void
): void {
  if (!sidebar || sidebar.querySelector(".mob-sidebar-chrome")) return;

  const chrome = document.createElement("div");
  chrome.className = "mob-sidebar-chrome bk-cockpit";
  chrome.innerHTML = `
    <div class="mob-sheet__handle-zone" data-mob-drag="1" aria-hidden="true">
      <span class="mob-sheet__handle"></span>
    </div>
    <div class="mob-sidebar-chrome__bar">
      <span class="mob-sidebar-chrome__title-group">
        <span class="mob-sidebar-chrome__icon" style="--icon-accent:${accent}">${iconSvg}</span>
        <span class="mob-sidebar-chrome__title">${title}</span>
      </span>
      <div class="mob-sheet__header-actions">
        <button type="button" class="mob-sheet__icon-btn mob-sidebar-expand-btn" title="Toggle Full Height" aria-label="Toggle Panel Height">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
        </button>
        <button type="button" class="mob-sheet__icon-btn mob-sidebar-close-btn" title="Close Panel" aria-label="Close ${title}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  `;

  sidebar.insertBefore(chrome, sidebar.firstChild);
  chrome.querySelector(".mob-sidebar-close-btn")?.addEventListener("click", onClose);
  chrome.querySelector(".mob-sidebar-expand-btn")?.addEventListener("click", () => {
    sidebar.classList.toggle("is-mob-expanded");
  });
  attachSheetSwipeGestures(sidebar, onClose);
}

export function initMobileWorkspace(): MobileWorkspaceController {
  if (activeController) return activeController;

  const uiLayer = document.querySelector<HTMLElement>(".ui-layer") || document.body;
  const headerBrand = document.querySelector<HTMLElement>("header .brand");
  const headerControls = document.querySelector<HTMLElement>("header .header-controls");
  const leftSidebar = document.querySelector<HTMLElement>(".left-sidebar");
  const rightSidebar = document.querySelector<HTMLElement>(".right-sidebar");
  const timelinePanel = document.getElementById("timeline-panel");

  let uiLayout: UiLayoutMode = readSavedUiLayout();
  let hasExplicitLayoutPref = readExplicitUiLayout() !== null;
  let openSheetId: MobileSheetId | null = null;
  let cameraPopoverOpen = false;
  let radarOpen = false;
  let launcherDismissed = false;
  const listenerAbort = new AbortController();

  const sheets = new Map<MobileSheetId, HTMLElement>();

  // ─── 1. Slim Top Bar Extensions (Storey Context Pill + Workspace Menu Button) ───
  let storeyPill = document.getElementById("mob-storey-pill") as HTMLButtonElement | null;
  if (headerBrand && !storeyPill) {
    storeyPill = document.createElement("button");
    storeyPill.type = "button";
    storeyPill.id = "mob-storey-pill";
    storeyPill.className = "mob-storey-pill bk-cockpit";
    storeyPill.setAttribute("aria-label", "Switch Active Storey or Floor Plan");
    storeyPill.setAttribute("aria-expanded", "false");
    storeyPill.innerHTML = `
      <span class="mob-storey-pill__dot" aria-hidden="true"></span>
      <span class="mob-storey-pill__label" id="mob-storey-pill-label">Level 0</span>
      <svg class="mob-storey-pill__chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
    `;
    headerBrand.appendChild(storeyPill);
  }

  let menuTrigger = document.getElementById("mob-btn-menu") as HTMLButtonElement | null;
  if (headerControls && !menuTrigger) {
    menuTrigger = document.createElement("button");
    menuTrigger.type = "button";
    menuTrigger.id = "mob-btn-menu";
    menuTrigger.className = "mob-header-btn bk-cockpit";
    menuTrigger.title = "Workspace Menu, Themes, Roles & Views";
    menuTrigger.setAttribute("aria-label", "Open Workspace Menu");
    menuTrigger.setAttribute("aria-expanded", "false");
    menuTrigger.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg><span class="mob-header-btn__label">Workspace</span>`;
    headerControls.appendChild(menuTrigger);
  }

  // ─── 2. Backdrop for Compact-Screen Sheets ───
  let mobBackdrop = document.getElementById("mob-sheet-backdrop");
  if (!mobBackdrop) {
    mobBackdrop = document.createElement("div");
    mobBackdrop.id = "mob-sheet-backdrop";
    mobBackdrop.className = "mob-sheet-backdrop bk-cockpit";
    uiLayer.appendChild(mobBackdrop);
  }

  // ─── 3. Right-Edge Quick Camera Rail + Views Popover ───
  let camRail = document.getElementById("mob-camera-rail");
  if (!camRail) {
    camRail = document.createElement("div");
    camRail.id = "mob-camera-rail";
    camRail.className = "mob-camera-rail bk-cockpit";
    camRail.setAttribute("role", "toolbar");
    camRail.setAttribute("aria-label", "Quick 3D Camera Controls");
    camRail.innerHTML = `
      <div class="mob-cam-popover" id="mob-cam-popover" role="group" aria-label="Camera Presets">
        <button type="button" class="mob-cam-chip" data-click-target="btn-view-top" title="Top Floor Plan">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M12 8v8m-3-3 3 3 3-3"/></svg>
          <span>Top</span>
        </button>
        <button type="button" class="mob-cam-chip" data-click-target="btn-view-iso" title="Isometric 3D">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          <span>Iso</span>
        </button>
        <button type="button" class="mob-cam-chip" data-click-target="btn-quick-explode" title="Exploded View">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          <span>Explode</span>
        </button>
        <button type="button" class="mob-cam-chip" data-click-target="btn-toggle-ground-grid" title="Toggle Grid">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>
          <span>Grid</span>
        </button>
        <button type="button" class="mob-cam-chip" id="mob-cam-radar-chip" title="Toggle 2D Floor Radar">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 12l6-4"/></svg>
          <span>Radar</span>
        </button>
      </div>
      <button type="button" class="mob-rail-btn" id="mob-cam-fit" data-click-target="btn-view-fit" title="Fit Model to View" aria-label="Fit View">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </button>
      <button type="button" class="mob-rail-btn" id="mob-cam-views" title="Camera Views & Overlays" aria-label="Camera Views" aria-expanded="false">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
      </button>
      <button type="button" class="mob-rail-btn" id="mob-cam-section" data-click-target="btn-section-cut" title="Section Cut" aria-label="Toggle Section Cut">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/></svg>
      </button>
    `;
    uiLayer.appendChild(camRail);
  }

  // ─── 4. Unified 5-Tab Spatial Command Bar (Edge-to-Edge on Phones, Floating Pill on Tablet/Desktop) ───
  let mobDock = document.getElementById("mob-dock");
  if (!mobDock) {
    mobDock = document.createElement("nav");
    mobDock.id = "mob-dock";
    mobDock.className = "mob-dock bk-cockpit";
    mobDock.setAttribute("role", "tablist");
    mobDock.setAttribute("aria-label", "Spatial BIM Navigation");
    mobDock.innerHTML = `
      <button type="button" class="mob-dock__tab" id="mob-tab-model" data-mob-nav="model" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
        </span>
        <span class="mob-dock__label">Model</span>
      </button>
      <button type="button" class="mob-dock__tab" id="mob-tab-inspect" data-mob-nav="inspect" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          <span class="mob-dock__dot" id="mob-inspect-dot" aria-hidden="true"></span>
        </span>
        <span class="mob-dock__label">Inspect</span>
      </button>
      <button type="button" class="mob-dock__tab" id="mob-tab-tools" data-mob-nav="tools" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.3 8.7 8.7 21.3a2.12 2.12 0 0 1-3 0l-4.4-4.4a2.12 2.12 0 0 1 0-3L14 1.3a2.12 2.12 0 0 1 3 0l4.3 4.4a2.12 2.12 0 0 1 0 3Z"/><line x1="14.5" y1="4.5" x2="16.5" y2="6.5"/><line x1="11" y1="8" x2="13" y2="10"/></svg>
        </span>
        <span class="mob-dock__label">Tools</span>
      </button>
      <button type="button" class="mob-dock__tab" id="mob-tab-4d" data-mob-nav="4d" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/></svg>
        </span>
        <span class="mob-dock__label">4D</span>
      </button>
      <button type="button" class="mob-dock__tab" id="mob-tab-suites" data-mob-nav="suites" role="tab" aria-selected="false">
        <span class="mob-dock__icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
        </span>
        <span class="mob-dock__label">Suites</span>
      </button>
    `;
    uiLayer.appendChild(mobDock);
  }

  // ─── 4b. Unified Sleek 4D Scrubber Bar (`#mob-4d-bar`, shown in `body.mode-4d` on ALL screen sizes) ───
  let mob4dBar = document.getElementById("mob-4d-bar");
  if (!mob4dBar) {
    mob4dBar = document.createElement("div");
    mob4dBar.id = "mob-4d-bar";
    mob4dBar.className = "mob-4d-bar bk-cockpit";
    mob4dBar.setAttribute("role", "region");
    mob4dBar.setAttribute("aria-label", "4D Construction Timeline Scrubber");
    mob4dBar.innerHTML = `
      <div class="mob-4d-bar__top">
        <button type="button" class="mob-4d-bar__play" id="mob-4d-play" aria-label="Play or Pause 4D Simulation">
          <span id="mob-4d-play-icon">▶</span>
        </button>
        <div class="mob-4d-bar__meta">
          <div class="mob-4d-bar__row">
            <span class="mob-4d-bar__week" id="mob-4d-week">Week 1</span>
            <span class="bk-badge bk-badge--accent" id="mob-4d-pct">0%</span>
          </div>
          <span class="mob-4d-bar__date" id="mob-4d-date">--</span>
        </div>
        <div class="mob-4d-bar__scrub-row">
          <input type="range" class="mob-4d-bar__slider" id="mob-4d-slider" min="0" max="60" value="0" aria-label="Scrub 4D Construction Timeline" />
        </div>
        <div class="mob-4d-bar__actions">
          <button type="button" class="mob-4d-bar__btn" id="mob-4d-tools-btn" aria-label="Open 4D Tools">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
            <span>4D Tools</span>
          </button>
          <button type="button" class="mob-4d-bar__btn mob-4d-bar__exit" id="mob-4d-exit" aria-label="Exit 4D Mode">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    `;
    uiLayer.appendChild(mob4dBar);
  }

  const reparent4dFloatPanels = (mode: UiLayoutMode) => {
    const targetParent = mode === "cockpit" ? uiLayer : timelinePanel || uiLayer;
    for (const float4dId of ["cascade-4d-panel", "timeline-options-modal"]) {
      const el = document.getElementById(float4dId);
      if (el && el.parentElement !== targetParent) {
        targetParent.appendChild(el);
      }
    }
  };

  // ─── 4c. Empty-Canvas Quick Launcher Card (Auto-hides once a 3D model is loaded, ALL screens) ───
  let emptyLauncher = document.getElementById("mob-empty-launcher");
  if (!emptyLauncher) {
    emptyLauncher = document.createElement("div");
    emptyLauncher.id = "mob-empty-launcher";
    emptyLauncher.className = "mob-empty-launcher bk-cockpit";
    emptyLauncher.setAttribute("role", "region");
    emptyLauncher.setAttribute("aria-label", "Quick Load 3D Model");
    emptyLauncher.innerHTML = `
      <button type="button" class="mob-empty-launcher__dismiss" id="mob-empty-dismiss" aria-label="Dismiss quick launcher">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="mob-empty-launcher__hero">
        <span class="mob-empty-launcher__badge" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        </span>
        <div>
          <div class="mob-empty-launcher__kicker">SPATIAL BIM COCKPIT</div>
          <h2 class="mob-empty-launcher__title">Open a 3D Model</h2>
        </div>
      </div>
      <p class="mob-empty-launcher__desc">Load a live IFC demo in one click or open a local model from your device.</p>
      <button type="button" class="bk-btn bk-btn--primary mob-empty-launcher__cta" id="mob-launch-snowdon">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>
        <span>Load Snowdon Towers (IFC)</span>
      </button>
      <div class="mob-empty-launcher__row">
        <button type="button" class="bk-btn bk-btn--secondary" id="mob-launch-school">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10l9-6 9 6"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/></svg>
          <span>School Demo</span>
        </button>
        <button type="button" class="bk-btn bk-btn--secondary" id="mob-launch-upload">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span>Upload IFC</span>
        </button>
      </div>
      <div class="mob-offline-cache-row" id="mob-offline-cache-badge" style="display:none;"></div>
    `;
    uiLayer.appendChild(emptyLauncher);
  }

  // ─── 5. Sheet Dismissal & Single-Active-Sheet Coordination ───
  const closeCameraPopover = () => {
    cameraPopoverOpen = false;
    document.getElementById("mob-cam-popover")?.classList.remove("is-open");
    document.getElementById("mob-cam-views")?.setAttribute("aria-expanded", "false");
  };

  const setRadarOpen = (next: boolean) => {
    radarOpen = next;
    document.body.classList.toggle("mob-radar-open", radarOpen);
    const minimap = document.getElementById("minimap-container");
    if (minimap) {
      minimap.classList.toggle("expanded", radarOpen);
    }
    document.getElementById("mob-cam-radar-chip")?.classList.toggle("is-active", radarOpen);
    document.getElementById("mob-storey-radar-btn")?.classList.toggle("is-active", radarOpen);
  };

  const isDesktopLayout = () => typeof window !== "undefined" && window.innerWidth > 1080;

  const isLeftPanelOpen = () =>
    isDesktopLayout()
      ? Boolean(leftSidebar && !document.body.classList.contains("left-sidebar-collapsed"))
      : Boolean(leftSidebar?.classList.contains("open"));

  const isRightPanelOpen = () =>
    isDesktopLayout()
      ? Boolean(rightSidebar && !document.body.classList.contains("right-sidebar-collapsed"))
      : Boolean(rightSidebar?.classList.contains("open"));

  const closeLeftPanel = () => {
    leftSidebar?.classList.remove("open", "is-mob-expanded");
    document.body.classList.add("left-sidebar-collapsed");
    if (!isRightPanelOpen()) {
      document.getElementById("sidebar-backdrop")?.classList.remove("active");
    }
    syncState();
  };

  const closeRightPanel = () => {
    rightSidebar?.classList.remove("open", "is-mob-expanded");
    document.body.classList.add("right-sidebar-collapsed");
    if (!isLeftPanelOpen()) {
      document.getElementById("sidebar-backdrop")?.classList.remove("active");
    }
    syncState();
  };

  const closeOwnSheets = () => {
    openSheetId = null;
    sheets.forEach((s) => {
      s.classList.remove("is-open", "is-expanded");
    });
    mobBackdrop?.classList.remove("is-active");
    storeyPill?.setAttribute("aria-expanded", "false");
    menuTrigger?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("mob-sheet-active");
  };

  const closeAllPanelsAndSheets = () => {
    closeOwnSheets();
    closeCameraPopover();
    leftSidebar?.classList.remove("open", "is-mob-expanded");
    rightSidebar?.classList.remove("open", "is-mob-expanded");
    if (isDesktopLayout()) {
      document.body.classList.add("left-sidebar-collapsed", "right-sidebar-collapsed");
    }
    document.getElementById("sidebar-backdrop")?.classList.remove("active");
    document.getElementById("menu-saved-views")?.classList.add("hidden");
    if (typeof (window as any).closeAllEnterpriseDrawers === "function") {
      (window as any).closeAllEnterpriseDrawers();
    }
    syncState();
  };

  const openSheet = (id: MobileSheetId) => {
    const alreadyOpen = openSheetId === id;
    if (isDesktopLayout()) {
      // On desktop, popovers float cleanly over the canvas without closing docked sidebars
      closeOwnSheets();
      closeCameraPopover();
    } else {
      closeAllPanelsAndSheets();
    }
    if (alreadyOpen) {
      syncState();
      return;
    }

    if (id === "storey") refreshStoreySheet();
    if (id === "menu") refreshMenuSheet();

    const target = sheets.get(id);
    if (!target) return;
    openSheetId = id;
    target.classList.add("is-open");
    if (!isDesktopLayout()) {
      mobBackdrop?.classList.add("is-active");
    }
    document.body.classList.add("mob-sheet-active");
    if (id === "storey") storeyPill?.setAttribute("aria-expanded", "true");
    if (id === "menu") menuTrigger?.setAttribute("aria-expanded", "true");
    syncState();
  };

  // Inject clean panel header/close/swipe chrome into existing left & right sidebars
  injectSidebarMobileChrome(
    leftSidebar,
    "Model & Project",
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
    "#38BDF8",
    closeLeftPanel
  );
  injectSidebarMobileChrome(
    rightSidebar,
    "Inspector & Scene",
    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
    "#10B981",
    closeRightPanel
  );

  // ─── 6. Build the Purpose-Built Spatial Sheets ───
  const toolsBodyHtml = `
    <div class="mob-section-label">${FLAT_SECTION_ICONS.tools}<span>Field Actions</span></div>
    <div class="mob-tile-grid">
      ${FIELD_PRIMARY_TOOLS.map(
        (t) => `
        <button type="button" class="mob-tool-tile" id="${t.id}" data-click-target="${t.targetId}">
          <span class="mob-tool-tile__icon" ${t.accent ? `style="--icon-accent:${t.accent}"` : ""}>${t.icon}</span>
          <span class="mob-tool-tile__text">
            <span class="mob-tool-tile__title">${t.label}</span>
            <span class="mob-tool-tile__sub">${t.subtitle || ""}</span>
          </span>
        </button>`
      ).join("")}
    </div>
    <div class="mob-section-label">${FLAT_SECTION_ICONS.select}<span>Selection &amp; Visibility</span></div>
    <div class="mob-chip-wrap">
      ${FIELD_SELECTION_CHIPS.map(
        (c) => `
        <button type="button" class="mob-action-chip" id="${c.id}" data-click-target="${c.targetId}">
          ${c.icon}
          <span>${c.label}</span>
        </button>`
      ).join("")}
    </div>
    <div class="mob-section-label">${FLAT_SECTION_ICONS.folder}<span>Files &amp; Field Snags</span></div>
    <div class="mob-chip-wrap">
      <button type="button" class="mob-action-chip mob-action-chip--accent" id="mob-tool-photo-snag">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
        <span>Photo Snag → BCF</span>
      </button>
      ${FIELD_FILE_CHIPS.map(
        (c) => `
        <button type="button" class="mob-action-chip" id="${c.id}" data-click-target="${c.targetId}">
          ${c.icon}
          <span>${c.label}</span>
        </button>`
      ).join("")}
    </div>
  `;
  const toolsSheet = createSheetShell("tools", "Field Tools", "Measure, section, select & files", toolsBodyHtml, closeAllPanelsAndSheets);
  sheets.set("tools", toolsSheet);
  uiLayer.appendChild(toolsSheet);

  const suitesBodyHtml = `
    <div class="mob-section-label">${FLAT_SECTION_ICONS.spark}<span>Coordination &amp; AI</span></div>
    <div class="mob-suite-grid">
      ${SUITE_COORDINATION.map(
        (s) => `
        <button type="button" class="mob-suite-card" id="${s.id}" data-click-target="${s.targetId}">
          <span class="mob-suite-card__icon" ${s.accent ? `style="--icon-accent:${s.accent}"` : ""}>${s.icon}</span>
          <span class="mob-suite-card__meta">
            <span class="mob-suite-card__title">${s.label}</span>
            <span class="mob-suite-card__sub">${s.subtitle || ""}</span>
          </span>
        </button>`
      ).join("")}
    </div>
    <div class="mob-section-label">${FLAT_SECTION_ICONS.chart}<span>5D · 6D · GIS &amp; Engineering</span></div>
    <div class="mob-suite-grid">
      ${SUITE_ANALYTICS.map(
        (s) => `
        <button type="button" class="mob-suite-card" id="${s.id}" data-click-target="${s.targetId}">
          <span class="mob-suite-card__icon" ${s.accent ? `style="--icon-accent:${s.accent}"` : ""}>${s.icon}</span>
          <span class="mob-suite-card__meta">
            <span class="mob-suite-card__title">${s.label}</span>
            <span class="mob-suite-card__sub">${s.subtitle || ""}</span>
          </span>
        </button>`
      ).join("")}
    </div>
  `;
  const suitesSheet = createSheetShell("suites", "BIM Suites", "Enterprise modules & analysis", suitesBodyHtml, closeAllPanelsAndSheets);
  sheets.set("suites", suitesSheet);
  uiLayer.appendChild(suitesSheet);

  const storeyBodyHtml = `
    <div class="mob-section-label">${FLAT_SECTION_ICONS.layers}<span>Active Building Levels</span></div>
    <div class="mob-storey-list" id="mob-storey-list"></div>
    <div class="mob-section-label">${FLAT_SECTION_ICONS.layout}<span>Floor Overlays</span></div>
    <div class="mob-tile-grid">
      <button type="button" class="mob-tool-tile" id="mob-storey-slice-btn" data-click-target="btn-toggle-storey-slice">
        <span class="mob-tool-tile__icon" style="--icon-accent:#F59E0B">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="8 7 12 3 16 7"/><polyline points="8 17 12 21 16 17"/></svg>
        </span>
        <span class="mob-tool-tile__text">
          <span class="mob-tool-tile__title">Slice Floor</span>
          <span class="mob-tool-tile__sub">Ghost ceiling above</span>
        </span>
      </button>
      <button type="button" class="mob-tool-tile" id="mob-storey-radar-btn">
        <span class="mob-tool-tile__icon" style="--icon-accent:#06B6D4">
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/><path d="M12 12l6-4"/></svg>
        </span>
        <span class="mob-tool-tile__text">
          <span class="mob-tool-tile__title">2D Floor Radar</span>
          <span class="mob-tool-tile__sub">Show/hide minimap</span>
        </span>
      </button>
    </div>
  `;
  const storeySheet = createSheetShell("storey", "Storeys & Levels", "Jump to floor or slice ceilings", storeyBodyHtml, closeAllPanelsAndSheets);
  sheets.set("storey", storeySheet);
  uiLayer.appendChild(storeySheet);

  const menuBodyHtml = `
    <div class="mob-section-label">${FLAT_SECTION_ICONS.layout}<span>Interface Layout</span></div>
    <div class="mob-theme-pills" id="mob-layout-pills" role="group" aria-label="Switch Interface Layout">
      <button type="button" class="mob-pill-choice" data-ui-layout-choice="cockpit">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
        <span>Cockpit UI</span>
      </button>
      <button type="button" class="mob-pill-choice" data-ui-layout-choice="classic">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        <span>Classic UI</span>
      </button>
    </div>
    <div class="mob-section-label">${FLAT_SECTION_ICONS.theme}<span>Appearance Theme</span></div>
    <div class="mob-theme-pills" id="mob-theme-pills">
      ${THEME_PRESETS.map(
        (t) => `<button type="button" class="mob-pill-choice" data-mob-theme="${t.value}">${t.icon}<span>${t.label}</span></button>`
      ).join("")}
    </div>
    <div class="mob-section-label">${FLAT_SECTION_ICONS.role}<span>Workspace Role</span></div>
    <div class="mob-persona-pills" id="mob-persona-pills"></div>
    <div class="mob-section-label">${FLAT_SECTION_ICONS.camera}<span>Views &amp; Camera</span></div>
    <div class="mob-menu-list">
      <button type="button" class="mob-menu-row" data-click-target="btn-ribbon-saved-views" data-keep-open="saved-views">
        <span class="mob-menu-row__lead">
          <span class="mob-menu-row__icon" style="--icon-accent:#38BDF8">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </span>
          <span>Saved Views &amp; Bookmarks</span>
        </span>
        <span class="bk-badge bk-badge--accent" id="mob-menu-views-badge">4</span>
      </button>
      <button type="button" class="mob-menu-row" data-click-target="btn-drone-orbit">
        <span class="mob-menu-row__lead">
          <span class="mob-menu-row__icon" style="--icon-accent:#A855F7">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A855F7" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="9" ry="4"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
          </span>
          <span>Drone 360° Orbit</span>
        </span>
        <span class="mob-menu-row__hint">Camera</span>
      </button>
      <button type="button" class="mob-menu-row" data-click-target="btn-play-tour">
        <span class="mob-menu-row__lead">
          <span class="mob-menu-row__icon" style="--icon-accent:#10B981">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          </span>
          <span>Walkthrough Tour</span>
        </span>
        <span class="mob-menu-row__hint">Play</span>
      </button>
      <button type="button" class="mob-menu-row" id="mob-menu-walk-btn">
        <span class="mob-menu-row__lead">
          <span class="mob-menu-row__icon" style="--icon-accent:#F59E0B">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          </span>
          <span>First-Person Touch Walk</span>
        </span>
        <span class="mob-menu-row__hint">Joystick</span>
      </button>
      <button type="button" class="mob-menu-row" data-click-target="btn-view-snapshot">
        <span class="mob-menu-row__lead">
          <span class="mob-menu-row__icon" style="--icon-accent:#EC4899">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#EC4899" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
          </span>
          <span>Export 4K Technical Sheet</span>
        </span>
        <span class="mob-menu-row__hint">PNG</span>
      </button>
      <button type="button" class="mob-menu-row" id="mob-menu-pwa-install" style="display:none;">
        <span class="mob-menu-row__lead">
          <span class="mob-menu-row__icon" style="--icon-accent:#10B981">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </span>
          <span>Install Offline Field App (PWA)</span>
        </span>
        <span class="bk-badge bk-badge--success">Offline</span>
      </button>
      <button type="button" class="mob-menu-row" id="mob-menu-help-btn">
        <span class="mob-menu-row__lead">
          <span class="mob-menu-row__icon" style="--icon-accent:#06B6D4">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </span>
          <span>Help &amp; Shortcuts Guide</span>
        </span>
        <span class="mob-menu-row__hint">?</span>
      </button>
    </div>
  `;
  const menuSheet = createSheetShell("menu", "Workspace & Views", "Layout, theme, role & camera", menuBodyHtml, closeAllPanelsAndSheets);
  sheets.set("menu", menuSheet);
  uiLayer.appendChild(menuSheet);

  const fourdBodyHtml = `
    <div class="mob-section-label">${FLAT_SECTION_ICONS.speed}<span>Playback Speed</span></div>
    <div class="mob-theme-pills" id="mob-4d-speed-pills">
      <button type="button" class="mob-pill-choice" data-mob-speed="1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>
        <span>1x</span>
      </button>
      <button type="button" class="mob-pill-choice is-active" data-mob-speed="2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>
        <span>2x</span>
      </button>
      <button type="button" class="mob-pill-choice" data-mob-speed="5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>
        <span>5x</span>
      </button>
      <button type="button" class="mob-pill-choice" data-mob-speed="10">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
        <span>10x</span>
      </button>
    </div>
    <div class="mob-section-label">${FLAT_SECTION_ICONS.chart}<span>4D Schedule &amp; Analytics</span></div>
    <div class="mob-suite-grid">
      <button type="button" class="mob-suite-card" id="mob-4d-open-sched">
        <span class="mob-suite-card__icon" style="--icon-accent:#D4FF3F">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--bk-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </span>
        <span class="mob-suite-card__meta">
          <span class="mob-suite-card__title">4D Schedule</span>
          <span class="mob-suite-card__sub">Task list &amp; CSV</span>
        </span>
      </button>
      ${FOURD_TOOLS.map(
        (t) => `
        <button type="button" class="mob-suite-card" id="${t.id}" data-click-target="${t.targetId}">
          <span class="mob-suite-card__icon" ${t.accent ? `style="--icon-accent:${t.accent}"` : ""}>${t.icon}</span>
          <span class="mob-suite-card__meta">
            <span class="mob-suite-card__title">${t.label}</span>
            <span class="mob-suite-card__sub">${t.subtitle || ""}</span>
          </span>
        </button>`
      ).join("")}
    </div>
  `;
  const fourdSheet = createSheetShell("4d", "4D Simulation Tools", "Speed, Gantt, Cash-Flow & Crane", fourdBodyHtml, closeAllPanelsAndSheets);
  sheets.set("4d", fourdSheet);
  uiLayer.appendChild(fourdSheet);

  // ─── 7. Dynamic Sheet Sync Helpers ───
  function refreshStoreySheet(): void {
    const list = document.getElementById("mob-storey-list");
    const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
    if (!list) return;

    const options = select ? Array.from(select.options) : [];
    if (options.length === 0) {
      list.innerHTML = `<div class="mob-empty-hint">Load an IFC model to list building storeys.</div>`;
      return;
    }

    list.innerHTML = options
      .map((opt) => {
        const isSelected = select?.value === opt.value;
        return `<button type="button" class="mob-storey-btn${isSelected ? " is-active" : ""}" data-level-val="${opt.value}">
          <span class="mob-menu-row__lead">
            <span class="mob-menu-row__icon" style="--icon-accent:#10B981">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${isSelected ? "currentColor" : "#10B981"}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/></svg>
            </span>
            <span>${opt.textContent?.trim() || opt.value}</span>
          </span>
          ${isSelected ? `<span class="bk-badge bk-badge--accent">Active</span>` : ""}
        </button>`;
      })
      .join("");
  }

  function syncLayoutToggleUi(): void {
    const toggleBtn = document.getElementById("btn-toggle-ui-layout") as HTMLButtonElement | null;
    const toggleLabel = document.getElementById("ui-layout-switch-label");
    const isCockpit = uiLayout === "cockpit";
    if (toggleBtn) {
      toggleBtn.dataset.currentLayout = uiLayout;
      toggleBtn.setAttribute("aria-pressed", String(isCockpit));
      toggleBtn.title = isCockpit
        ? "Switch to Classic BIM UI (all legacy toolbars & timeline)"
        : "Switch to Spatial Cockpit UI (minimalist floating workspace)";
      toggleBtn.setAttribute(
        "aria-label",
        isCockpit ? "Switch to Classic UI" : "Switch to Cockpit UI"
      );
    }
    if (toggleLabel) {
      toggleLabel.textContent = isCockpit ? "Classic UI" : "Cockpit UI";
    }
    document.querySelectorAll<HTMLButtonElement>("#mob-layout-pills [data-ui-layout-choice]").forEach((btn) => {
      setClassIfChanged(btn, "is-active", btn.getAttribute("data-ui-layout-choice") === uiLayout);
    });
  }

  function applyUiLayout(mode: UiLayoutMode, announce = false, persist = true): void {
    const normalized: UiLayoutMode = mode === "classic" ? "classic" : "cockpit";
    const changed = uiLayout !== normalized;
    uiLayout = normalized;
    if (persist) {
      hasExplicitLayoutPref = true;
      try {
        localStorage.setItem(UI_LAYOUT_STORAGE_KEY, normalized);
      } catch {
        /* storage blocked */
      }
    }

    closeOwnSheets();
    closeCameraPopover();

    document.documentElement.classList.add("theme-switching");
    document.documentElement.setAttribute("data-ui-layout", normalized);
    setClassIfChanged(document.body, "ui-cockpit", normalized === "cockpit");
    setClassIfChanged(document.body, "ui-classic", normalized === "classic");
    reparent4dFloatPanels(normalized);
    syncLayoutToggleUi();
    void document.documentElement.offsetHeight;
    document.documentElement.classList.remove("theme-switching");

    syncState();
    try {
      window.dispatchEvent(new Event("resize"));
    } catch {
      /* ignore */
    }
    if (announce && changed) {
      showToast(
        normalized === "cockpit" ? "Switched to Spatial Cockpit UI" : "Switched to Classic BIM UI",
        "info"
      );
    }
  }

  function refreshMenuSheet(): void {
    syncLayoutToggleUi();
    const themeSelect = document.getElementById("select-theme-toggle") as HTMLSelectElement | null;
    const currentTheme = themeSelect?.value || document.documentElement.getAttribute("data-theme") || "obsidian";
    document.querySelectorAll<HTMLButtonElement>("#mob-theme-pills .mob-pill-choice").forEach((btn) => {
      const val = btn.getAttribute("data-mob-theme");
      const active =
        val === currentTheme ||
        (val === "light" && currentTheme === "light-studio") ||
        (val === "obsidian" && currentTheme === "dark");
      btn.classList.toggle("is-active", active);
    });

    const personaSelect = document.getElementById("workspace-persona-select") as HTMLSelectElement | null;
    const personaWrap = document.getElementById("mob-persona-pills");
    if (personaSelect && personaWrap) {
      personaWrap.innerHTML = Array.from(personaSelect.options)
        .map((opt) => {
          const active = personaSelect.value === opt.value;
          const icon = PERSONA_ICONS[opt.value] || PERSONA_ICONS.all;
          return `<button type="button" class="mob-pill-choice${active ? " is-active" : ""}" data-mob-persona="${opt.value}">${icon}<span>${opt.textContent?.trim() || opt.value}</span></button>`;
        })
        .join("");
    }

    const viewsBadge = document.getElementById("saved-views-count-badge")?.textContent?.trim();
    const menuBadge = document.getElementById("mob-menu-views-badge");
    if (menuBadge && viewsBadge) menuBadge.textContent = viewsBadge;

    // Show Install Offline App row whenever PWA prompt is available
    syncPwaInstallRow();
  }

  function syncPwaInstallRow(): void {
    const topPwaBtn = document.getElementById("btn-top-pwa-install");
    const menuPwaBtn = document.getElementById("mob-menu-pwa-install");
    if (!menuPwaBtn) return;
    const available = Boolean(
      topPwaBtn && topPwaBtn.style.display !== "none" && !topPwaBtn.classList.contains("hidden")
    );
    menuPwaBtn.style.display = available ? "flex" : "none";
  }

  async function refreshOfflineCacheBadge(): Promise<void> {
    const badgeEl = document.getElementById("mob-offline-cache-badge");
    if (!badgeEl) return;
    try {
      const cache = StorageCache.getInstance();
      await cache.init();
      const ids = await cache.listCachedModelIds();
      if (ids.length > 0) {
        badgeEl.style.display = "flex";
        badgeEl.innerHTML = `<span class="bk-badge bk-badge--success">Offline Ready</span><span>${ids.length} model${ids.length === 1 ? "" : "s"} cached locally for jobsite use</span>`;
      } else {
        badgeEl.style.display = "none";
      }
    } catch {
      badgeEl.style.display = "none";
    }
  }
  void refreshOfflineCacheBadge();

  function syncStoreyLabel(): void {
    const labelEl = document.getElementById("mob-storey-pill-label");
    if (!labelEl) return;
    const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
    const selectedOpt = select?.selectedOptions?.[0]?.textContent?.trim();
    const crumbStorey = document.getElementById("breadcrumb-storey")?.textContent?.trim();
    labelEl.textContent = crumbStorey || selectedOpt || "Model";
  }

  let syncing = false;
  let observer: MutationObserver | null = null;

  function syncState(): void {
    if (syncing) return;
    syncing = true;
    try {
      syncLayoutToggleUi();
      if (uiLayout === "classic") {
        setClassIfChanged(document.body, "mob-panel-open", false);
        setClassIfChanged(document.body, "cockpit-right-occupied", false);
        setClassIfChanged(document.body, "mob-sheet-active", false);
        setClassIfChanged(document.body, "mob-radar-open", false);
        setClassIfChanged(document.body, "mob-selection-active", false);
        setClassIfChanged(emptyLauncher, "is-visible", false);
        return;
      }
      syncStoreyLabel();
      syncPwaInstallRow();

      const is4D = document.body.classList.contains("mode-4d");
      const isLeftOpen = isLeftPanelOpen();
      const isRightOpen = isRightPanelOpen();
      const hasDockedDrawer = Array.from(document.querySelectorAll<HTMLElement>(".enterprise-drawer")).some(
        (d) =>
          !d.classList.contains("hidden") &&
          d.style.display !== "none" &&
          !d.classList.contains("is-floating")
      );

      const anyPanelOpen = Boolean(openSheetId || isLeftOpen || isRightOpen || hasDockedDrawer);
      setClassIfChanged(document.body, "mob-panel-open", anyPanelOpen);
      setClassIfChanged(document.body, "cockpit-right-occupied", isRightOpen || hasDockedDrawer);

      // Sync bottom 5-tab active indicator
      const setTabActive = (nav: string, active: boolean) => {
        const btn = mobDock?.querySelector<HTMLButtonElement>(`[data-mob-nav="${nav}"]`);
        if (!btn) return;
        setClassIfChanged(btn, "is-active", active);
        if (btn.getAttribute("aria-selected") !== String(active)) {
          btn.setAttribute("aria-selected", String(active));
        }
      };

      setTabActive("model", isLeftOpen);
      setTabActive("inspect", isRightOpen);
      setTabActive("tools", openSheetId === "tools");
      setTabActive("4d", is4D);
      setTabActive("suites", openSheetId === "suites" || hasDockedDrawer);

      // Mirror active tool states from desktop buttons into mobile tiles & rail
      const mirrorActive = (mobId: string, srcId: string) => {
        const src = document.getElementById(srcId);
        const dst = document.getElementById(mobId);
        if (!src || !dst) return;
        setClassIfChanged(dst, "is-active", src.classList.contains("active"));
      };

      mirrorActive("mob-cam-section", "btn-section-cut");
      mirrorActive("mob-tool-section", "btn-section-cut");
      mirrorActive("mob-tool-measure", "btn-dock-measure");
      mirrorActive("mob-tool-box", "btn-box-select");
      mirrorActive("mob-chip-grid", "btn-dock-toggle-grid");
      mirrorActive("mob-storey-slice-btn", "btn-toggle-storey-slice");

      // Highlight Inspect dot & lift right-edge camera rail when an element is selected
      const selBar = document.getElementById("viewport-selection-bar");
      const hasSelection = Boolean(selBar && getComputedStyle(selBar).display !== "none");
      setClassIfChanged(document.getElementById("mob-inspect-dot"), "is-visible", hasSelection);
      setClassIfChanged(document.body, "mob-selection-active", hasSelection);

      // Sync Mobile 4D Mini-Scrubber with live desktop timeline controls
      const srcSlider = document.getElementById("timeline-slider") as HTMLInputElement | null;
      const mobSlider = document.getElementById("mob-4d-slider") as HTMLInputElement | null;
      if (srcSlider && mobSlider) {
        if (mobSlider.min !== srcSlider.min) mobSlider.min = srcSlider.min;
        if (mobSlider.max !== srcSlider.max) mobSlider.max = srcSlider.max;
        if (document.activeElement !== mobSlider && mobSlider.value !== srcSlider.value) {
          mobSlider.value = srcSlider.value;
        }
      }
      const srcWeek = document.getElementById("gantt-week-badge")?.textContent?.trim();
      const srcDate = document.getElementById("timeline-date-badge")?.textContent?.trim();
      const srcPct = document.getElementById("gantt-progress-val")?.textContent?.trim();
      const srcPlayIcon = document.querySelector("#timeline-play-btn .ctrl-icon")?.textContent?.trim();
      const mobWeekEl = document.getElementById("mob-4d-week");
      const mobDateEl = document.getElementById("mob-4d-date");
      const mobPctEl = document.getElementById("mob-4d-pct");
      const mobPlayIconEl = document.getElementById("mob-4d-play-icon");
      if (mobWeekEl && srcWeek && mobWeekEl.textContent !== srcWeek) mobWeekEl.textContent = srcWeek;
      if (mobDateEl && srcDate && mobDateEl.textContent !== srcDate) mobDateEl.textContent = srcDate;
      if (mobPctEl && srcPct) {
        const cleanPct = srcPct.replace(/\s*Complete/i, "");
        if (mobPctEl.textContent !== cleanPct) mobPctEl.textContent = cleanPct;
      }
      if (mobPlayIconEl && srcPlayIcon && mobPlayIconEl.textContent !== srcPlayIcon) {
        mobPlayIconEl.textContent = srcPlayIcon;
      }

      // Sync active 4D speed pill
      const activeSpeed =
        document.querySelector<HTMLElement>("#timeline-speed-pills .btn-speed-pill.active")?.getAttribute("data-speed") || "2";
      document.querySelectorAll<HTMLButtonElement>("#mob-4d-speed-pills [data-mob-speed]").forEach((btn) => {
        setClassIfChanged(btn, "is-active", btn.getAttribute("data-mob-speed") === activeSpeed);
      });

      // Empty-Canvas Quick Launcher visibility (visible ONLY when 0 models loaded, no sheet/modal/4D/walkthrough)
      const filesBadgeNum = Number(document.getElementById("badge-files-count")?.textContent?.trim() || "0");
      const hasFileRow = Boolean(document.querySelector("#file-list .file-item"));
      const hasModel = filesBadgeNum > 0 || hasFileRow;
      const helpOpen = Boolean(
        document.getElementById("shortcuts-modal") &&
          !document.getElementById("shortcuts-modal")!.classList.contains("hidden")
      );
      const hasFloatingDrawer = Array.from(document.querySelectorAll<HTMLElement>(".enterprise-drawer.is-floating")).some(
        (d) => !d.classList.contains("hidden") && d.style.display !== "none"
      );
      const showEmpty =
        !launcherDismissed &&
        !hasModel &&
        !anyPanelOpen &&
        !hasFloatingDrawer &&
        !is4D &&
        !helpOpen &&
        !document.body.classList.contains("walkthrough-active");
      setClassIfChanged(emptyLauncher, "is-visible", showEmpty);
    } finally {
      observer?.takeRecords();
      syncing = false;
    }
  }

  // ─── 8. Wire Event Listeners ───
  storeyPill?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openSheet("storey");
  });

  menuTrigger?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    openSheet("menu");
  });

  mobBackdrop?.addEventListener("click", closeAllPanelsAndSheets);

  // Right-edge camera rail views toggle
  document.getElementById("mob-cam-views")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    cameraPopoverOpen = !cameraPopoverOpen;
    document.getElementById("mob-cam-popover")?.classList.toggle("is-open", cameraPopoverOpen);
    document.getElementById("mob-cam-views")?.setAttribute("aria-expanded", String(cameraPopoverOpen));
  });

  document.getElementById("mob-cam-radar-chip")?.addEventListener("click", (ev) => {
    ev.stopPropagation();
    setRadarOpen(!radarOpen);
    closeCameraPopover();
  });

  document.getElementById("mob-storey-radar-btn")?.addEventListener("click", () => {
    setRadarOpen(!radarOpen);
    closeOwnSheets();
    syncState();
  });

  // 5-Tab Bottom Navigation handlers
  mobDock.addEventListener("click", (ev) => {
    const tabBtn = (ev.target as Element).closest<HTMLButtonElement>("[data-mob-nav]");
    if (!tabBtn) return;
    vibrateTap(8);
    const nav = tabBtn.getAttribute("data-mob-nav");
    closeCameraPopover();

    if (nav === "model") {
      const wasOpen = isLeftPanelOpen();
      if (isDesktopLayout()) {
        closeOwnSheets();
        if (wasOpen) {
          closeLeftPanel();
        } else {
          const activeTab =
            document.querySelector<HTMLElement>("#left-tab-bar .sidebar-tab-btn.active")?.getAttribute("data-tab") ||
            "files";
          document.body.classList.remove("left-sidebar-collapsed");
          (window as any).switchSidebarTab?.("left-tab-bar", activeTab);
        }
      } else {
        closeAllPanelsAndSheets();
        if (!wasOpen) {
          const activeTab =
            document.querySelector<HTMLElement>("#left-tab-bar .sidebar-tab-btn.active")?.getAttribute("data-tab") ||
            "files";
          (window as any).switchSidebarTab?.("left-tab-bar", activeTab);
          if (!leftSidebar?.classList.contains("open")) {
            (window as any).switchSidebarTab?.("left-tab-bar", "files");
          }
        }
      }
      syncState();
    } else if (nav === "inspect") {
      const wasOpen = isRightPanelOpen();
      if (isDesktopLayout()) {
        closeOwnSheets();
        if (wasOpen) {
          closeRightPanel();
        } else {
          if (typeof (window as any).closeAllEnterpriseDrawers === "function") {
            (window as any).closeAllEnterpriseDrawers();
          }
          const selBar = document.getElementById("viewport-selection-bar");
          const hasSelection = Boolean(selBar && getComputedStyle(selBar).display !== "none");
          const desiredTab = hasSelection ? "metadata" : "scene";
          document.body.classList.remove("right-sidebar-collapsed");
          (window as any).switchSidebarTab?.("right-tab-bar", desiredTab);
        }
      } else {
        closeAllPanelsAndSheets();
        if (!wasOpen) {
          const selBar = document.getElementById("viewport-selection-bar");
          const hasSelection = Boolean(selBar && getComputedStyle(selBar).display !== "none");
          const desiredTab = hasSelection ? "metadata" : "scene";
          (window as any).switchSidebarTab?.("right-tab-bar", desiredTab);
          if (!rightSidebar?.classList.contains("open")) {
            (window as any).switchSidebarTab?.("right-tab-bar", desiredTab);
          }
        }
      }
      syncState();
    } else if (nav === "tools") {
      openSheet("tools");
    } else if (nav === "4d") {
      closeAllPanelsAndSheets();
      const is4D = document.body.classList.contains("mode-4d");
      if (typeof (window as any).toggle4DMode === "function") {
        (window as any).toggle4DMode(!is4D);
      } else {
        document.getElementById("btn-dock-gantt")?.click();
      }
      setTimeout(syncState, 60);
    } else if (nav === "suites") {
      openSheet("suites");
    }
  });

  // Delegated click handler for all `[data-click-target]` buttons inside sheets & camera rail
  const handleDelegatedClick = (ev: Event) => {
    const btn = (ev.target as Element).closest<HTMLElement>("[data-click-target]");
    if (!btn) return;
    const targetId = btn.getAttribute("data-click-target");
    if (!targetId) return;
    const keepOpen = btn.getAttribute("data-keep-open");
    closeCameraPopover();
    closeOwnSheets();
    document.getElementById(targetId)?.click();
    if (keepOpen === "saved-views") {
      // Saved views flyout handles its own visibility
    }
    setTimeout(syncState, 50);
  };

  camRail.addEventListener("click", handleDelegatedClick);
  toolsSheet.addEventListener("click", handleDelegatedClick);
  suitesSheet.addEventListener("click", handleDelegatedClick);
  storeySheet.addEventListener("click", handleDelegatedClick);
  menuSheet.addEventListener("click", handleDelegatedClick);
  fourdSheet.addEventListener("click", handleDelegatedClick);

  // Mobile 4D Mini-Scrubber events
  document.getElementById("mob-4d-play")?.addEventListener("click", () => {
    vibrateTap(10);
    document.getElementById("timeline-play-btn")?.click();
    setTimeout(syncState, 40);
  });
  document.getElementById("mob-4d-tools-btn")?.addEventListener("click", () => {
    vibrateTap(8);
    openSheet("4d");
  });
  document.getElementById("mob-4d-exit")?.addEventListener("click", () => {
    vibrateTap(10);
    closeOwnSheets();
    document.getElementById("btn-close-gantt-bar")?.click();
    setTimeout(syncState, 60);
  });
  document.getElementById("mob-4d-slider")?.addEventListener("input", (ev) => {
    const val = (ev.currentTarget as HTMLInputElement).value;
    const srcSlider = document.getElementById("timeline-slider") as HTMLInputElement | null;
    if (srcSlider) {
      srcSlider.value = val;
      srcSlider.dispatchEvent(new Event("input", { bubbles: true }));
    }
    syncState();
  });
  fourdSheet.addEventListener("click", (ev) => {
    const speedBtn = (ev.target as Element).closest<HTMLButtonElement>("[data-mob-speed]");
    if (speedBtn) {
      const spd = speedBtn.getAttribute("data-mob-speed");
      document.querySelector<HTMLButtonElement>(`#timeline-speed-pills .btn-speed-pill[data-speed="${spd}"]`)?.click();
      setTimeout(syncState, 30);
      return;
    }
    if ((ev.target as Element).closest("#mob-4d-open-sched")) {
      closeOwnSheets();
      (window as any).switchSidebarTab?.("left-tab-bar", "schedule");
      syncState();
    }
  });

  // Empty-Canvas Quick Launcher events
  document.getElementById("mob-empty-dismiss")?.addEventListener("click", () => {
    launcherDismissed = true;
    syncState();
  });
  const triggerSampleLoad = (sampleValue: string) => {
    vibrateTap(12);
    launcherDismissed = true;
    syncState();
    const sel = document.getElementById("sample-model-select") as HTMLSelectElement | null;
    if (sel) {
      sel.value = sampleValue;
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    }
    document.getElementById("load-sample-btn")?.click();
  };
  document.getElementById("mob-launch-snowdon")?.addEventListener("click", () => triggerSampleLoad("snowdon"));
  document.getElementById("mob-launch-school")?.addEventListener("click", () => triggerSampleLoad("school"));
  document.getElementById("mob-launch-upload")?.addEventListener("click", () => {
    vibrateTap(10);
    document.getElementById("btn-load-ifc")?.click();
  });

  // 1-Tap Photo Snag -> BCF
  document.getElementById("mob-tool-photo-snag")?.addEventListener("click", () => {
    vibrateTap(10);
    closeOwnSheets();
    (window as any).triggerSitePhotoBcfSnag?.();
  });

  // Storey picker click inside Storey Sheet
  storeySheet.addEventListener("click", (ev) => {
    const btn = (ev.target as Element).closest<HTMLButtonElement>(".mob-storey-btn");
    if (!btn) return;
    const val = btn.getAttribute("data-level-val");
    const select = document.getElementById("minimap-level-select") as HTMLSelectElement | null;
    if (select && val !== null) {
      select.value = val;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
    closeOwnSheets();
    syncState();
  });

  // Layout, Theme & Persona pill clicks inside Quick Menu Sheet
  menuSheet.addEventListener("click", (ev) => {
    const layoutBtn = (ev.target as Element).closest<HTMLButtonElement>("[data-ui-layout-choice]");
    if (layoutBtn) {
      const nextLayout = layoutBtn.getAttribute("data-ui-layout-choice");
      if (nextLayout === "cockpit" || nextLayout === "classic") {
        vibrateTap(8);
        applyUiLayout(nextLayout, true);
      }
      return;
    }

    const themeBtn = (ev.target as Element).closest<HTMLButtonElement>("[data-mob-theme]");
    if (themeBtn) {
      const val = themeBtn.getAttribute("data-mob-theme");
      const themeSelect = document.getElementById("select-theme-toggle") as HTMLSelectElement | null;
      if (themeSelect && val) {
        document.documentElement.classList.add("theme-switching");
        themeSelect.value = val;
        themeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        refreshMenuSheet();
        void document.documentElement.offsetHeight;
        document.documentElement.classList.remove("theme-switching");
      } else {
        refreshMenuSheet();
      }
      return;
    }

    const personaBtn = (ev.target as Element).closest<HTMLButtonElement>("[data-mob-persona]");
    if (personaBtn) {
      const val = personaBtn.getAttribute("data-mob-persona");
      const personaSelect = document.getElementById("workspace-persona-select") as HTMLSelectElement | null;
      if (personaSelect && val) {
        personaSelect.value = val;
        personaSelect.dispatchEvent(new Event("change", { bubbles: true }));
      }
      refreshMenuSheet();
      return;
    }

    const walkBtn = (ev.target as Element).closest("#mob-menu-walk-btn");
    if (walkBtn) {
      vibrateTap(10);
      closeAllPanelsAndSheets();
      if (typeof (window as any).startMobileWalkthrough === "function") {
        (window as any).startMobileWalkthrough();
      } else {
        document.getElementById("geo-walk-toggle")?.click();
      }
      return;
    }

    const pwaInstallBtn = (ev.target as Element).closest("#mob-menu-pwa-install");
    if (pwaInstallBtn) {
      closeOwnSheets();
      document.getElementById("btn-top-pwa-install")?.click();
      return;
    }

    const helpBtn = (ev.target as Element).closest("#mob-menu-help-btn");
    if (helpBtn) {
      closeAllPanelsAndSheets();
      if (typeof (window as any).openHelpArticle === "function") {
        (window as any).openHelpArticle();
      } else if (typeof (window as any).toggleShortcutsModal === "function") {
        (window as any).toggleShortcutsModal(true);
      } else {
        document.getElementById("btn-shortcuts-toggle")?.click();
      }
    }
  });

  // Global Header 1-Click Layout Switcher (Cockpit UI <-> Classic UI)
  document.getElementById("btn-toggle-ui-layout")?.addEventListener(
    "click",
    () => {
      vibrateTap(8);
      applyUiLayout(uiLayout === "cockpit" ? "classic" : "cockpit", true);
    },
    { signal: listenerAbort.signal }
  );

  // Close floating popovers when clicking outside on canvas/header
  document.addEventListener("pointerdown", (ev) => {
    const target = ev.target as Node;
    if (cameraPopoverOpen && camRail && !camRail.contains(target)) {
      closeCameraPopover();
    }
    if (openSheetId && isDesktopLayout()) {
      const activeSheet = sheets.get(openSheetId);
      const clickedTrigger =
        storeyPill?.contains(target) ||
        menuTrigger?.contains(target) ||
        mobDock?.contains(target) ||
        mob4dBar?.contains(target);
      if (activeSheet && !activeSheet.contains(target) && !clickedTrigger) {
        closeOwnSheets();
        syncState();
      }
    }
  });

  // Close popovers on Escape
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && (openSheetId || cameraPopoverOpen)) {
      closeOwnSheets();
      closeCameraPopover();
      syncState();
    }
  });

  // Cleanly reconcile layout state across breakpoint transitions
  window.matchMedia("(max-width: 1080px)").addEventListener(
    "change",
    () => {
      closeOwnSheets();
      closeCameraPopover();
      syncState();
    },
    { signal: listenerAbort.signal }
  );

  // Auto-follow viewport default (Classic on desktop, Cockpit on mobile) unless user picked explicitly
  window.matchMedia(MOBILE_MEDIA_QUERY).addEventListener(
    "change",
    () => {
      if (!hasExplicitLayoutPref && readExplicitUiLayout() === null) {
        applyUiLayout(getDefaultUiLayout(), false, false);
      }
    },
    { signal: listenerAbort.signal }
  );

  // Keep Spatial Cockpit state reactively synced on ALL screen sizes
  let syncQueued = false;
  const scheduleSync = () => {
    if (syncQueued || syncing) return;
    syncQueued = true;
    queueMicrotask(() => {
      syncQueued = false;
      syncState();
    });
  };
  observer = new MutationObserver(() => {
    scheduleSync();
  });

  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if (leftSidebar) observer.observe(leftSidebar, { attributes: true, attributeFilter: ["class"] });
  if (rightSidebar) observer.observe(rightSidebar, { attributes: true, attributeFilter: ["class"] });

  const breadcrumbStorey = document.getElementById("breadcrumb-storey");
  if (breadcrumbStorey) {
    observer.observe(breadcrumbStorey, { childList: true, characterData: true, subtree: true });
  }
  const minimapSelect = document.getElementById("minimap-level-select");
  if (minimapSelect) {
    observer.observe(minimapSelect, { childList: true, subtree: true });
    minimapSelect.addEventListener("change", syncState);
  }
  const selBar = document.getElementById("viewport-selection-bar");
  if (selBar) {
    observer.observe(selBar, { attributes: true, attributeFilter: ["style", "class"] });
  }
  const filesBadge = document.getElementById("badge-files-count");
  if (filesBadge) {
    observer.observe(filesBadge, { childList: true, characterData: true, subtree: true });
  }
  const helpModal = document.getElementById("shortcuts-modal");
  if (helpModal) {
    observer.observe(helpModal, { attributes: true, attributeFilter: ["class"] });
  }
  for (const id of ["gantt-week-badge", "timeline-date-badge", "gantt-progress-val", "timeline-play-btn"]) {
    const el = document.getElementById(id);
    if (el) observer.observe(el, { childList: true, characterData: true, subtree: true });
  }
  const timelineSlider = document.getElementById("timeline-slider");
  if (timelineSlider) {
    timelineSlider.addEventListener("input", syncState);
    timelineSlider.addEventListener("change", syncState);
  }

  // Sync whenever enterprise drawers open/close (including lazily hydrated drawers)
  const observeEnterpriseDrawers = () => {
    document.querySelectorAll(".enterprise-drawer").forEach((drawer) => {
      observer?.observe(drawer, { attributes: true, attributeFilter: ["class", "style"] });
    });
  };
  observeEnterpriseDrawers();
  let rootObserver: MutationObserver | null = null;
  const drawersRoot = document.getElementById("enterprise-drawers-root");
  if (drawersRoot) {
    rootObserver = new MutationObserver(() => {
      observeEnterpriseDrawers();
      scheduleSync();
    });
    rootObserver.observe(drawersRoot, { childList: true });
  }

  activeCleanup = () => {
    listenerAbort.abort();
    observer?.disconnect();
    rootObserver?.disconnect();
    observer = null;
    rootObserver = null;
  };

  applyUiLayout(uiLayout, false, false);

  const toggleUiLayout = (): UiLayoutMode => {
    const next: UiLayoutMode = uiLayout === "cockpit" ? "classic" : "cockpit";
    applyUiLayout(next, true, true);
    return next;
  };

  activeController = {
    openSheet,
    closeAllSheets: closeAllPanelsAndSheets,
    syncState,
    isMobileViewport,
    getUiLayout: () => uiLayout,
    setUiLayout: (mode: UiLayoutMode, announce = true, persist = true) => applyUiLayout(mode, announce, persist),
    toggleUiLayout,
  };
  (window as any).__mobileWorkspace = activeController;
  (window as any).getUiLayout = () => uiLayout;
  (window as any).setUiLayout = (mode: UiLayoutMode, announce = true, persist = true) =>
    applyUiLayout(mode, announce, persist);
  (window as any).toggleUiLayout = toggleUiLayout;
  return activeController;
}

export const initSpatialWorkspace = initMobileWorkspace;

export function resetMobileWorkspaceForTest(): void {
  activeCleanup?.();
  activeCleanup = null;
  activeController = null;
}
