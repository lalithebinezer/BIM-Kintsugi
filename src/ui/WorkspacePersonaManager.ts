/**
 * WorkspacePersonaManager — Role-Based Progressive Disclosure Presets
 *
 * Allows engineers to switch cleanly between focused AEC personas:
 *  - all:           Full Enterprise Suite
 *  - design:        Design Review (Scene, Meta, Sections, BCF, Measure)
 *  - planner-4d:    4D Construction Planner (4D Schedule, Gantt, Cash Flow, Lookahead, Split-4D)
 *  - commercial-5d: 5D Commercial / QS (Cost Control, BOQ, EVM, GAEB, IDS QA)
 *  - field:         Field / Site Engineer (Jobsite Touch Mode 44px, 2D Radar, BCF, Offline)
 */

import { AppStateStore, type WorkspacePersonaId } from "../core/AppStateStore";
import { JobsiteTouchMode } from "./JobsiteTouchMode";

export interface WorkspacePersonaDefinition {
  id: WorkspacePersonaId;
  label: string;
  shortLabel: string;
  description: string;
  recommendedLeftTab: "files" | "finder" | "schedule";
  recommendedRightTab: "scene" | "metadata" | "inspector" | "controls" | "tools";
  enable4dMode?: boolean;
  enableTouchMode?: boolean;
}

export const WORKSPACE_PERSONAS: readonly WorkspacePersonaDefinition[] = [
  {
    id: "all",
    label: "All Tools (Enterprise)",
    shortLabel: "All",
    description: "Full 3D/4D/5D/6D/7D OpenBIM platform workspace.",
    recommendedLeftTab: "files",
    recommendedRightTab: "scene",
  },
  {
    id: "design",
    label: "Design Review",
    shortLabel: "Design",
    description: "Focused model inspection, metadata, section cuts, clash checks & BCF coordination.",
    recommendedLeftTab: "finder",
    recommendedRightTab: "metadata",
  },
  {
    id: "planner-4d",
    label: "4D Planner",
    shortLabel: "4D Plan",
    description: "Construction phasing, 3-week lookahead, Gantt, What-If sandbox, crane envelopes & timelapse.",
    recommendedLeftTab: "schedule",
    recommendedRightTab: "inspector",
    enable4dMode: true,
  },
  {
    id: "commercial-5d",
    label: "5D Commercial / QS",
    shortLabel: "5D QS",
    description: "Rule-Book BOQ, GAEB X83, ANSI 748-B EVM, Cash-Flow Histogram & IDS QTO QA.",
    recommendedLeftTab: "schedule",
    recommendedRightTab: "inspector",
  },
  {
    id: "field",
    label: "Field / Site Engineer",
    shortLabel: "Field",
    description: "44px touch targets, swipe-to-dismiss drawers, 2D Radar teleport & rapid BCF capture.",
    recommendedLeftTab: "files",
    recommendedRightTab: "tools",
    enableTouchMode: true,
  },
];

const STORAGE_KEY = "bim_kintsugi_workspace_persona";

export class WorkspacePersonaManager {
  private static instance: WorkspacePersonaManager | null = null;
  private activePersona: WorkspacePersonaId = "all";

  public static getInstance(): WorkspacePersonaManager {
    if (!this.instance) this.instance = new WorkspacePersonaManager();
    return this.instance;
  }

  public getActivePersona(): WorkspacePersonaId {
    return this.activePersona;
  }

  public init(): WorkspacePersonaId {
    let saved: WorkspacePersonaId = "all";
    try {
      const raw = localStorage.getItem(STORAGE_KEY) as WorkspacePersonaId | null;
      if (raw && WORKSPACE_PERSONAS.some((p) => p.id === raw)) {
        saved = raw;
      }
    } catch {
      // Ignore storage errors
    }
    this.applyPersona(saved, false);
    return saved;
  }

  public applyPersona(
    personaId: WorkspacePersonaId,
    persist = true,
    hooks?: {
      switchTab?: (barId: string, tab: string) => void;
      toggle4D?: (force: boolean) => void;
    }
  ): WorkspacePersonaDefinition {
    const def = WORKSPACE_PERSONAS.find((p) => p.id === personaId) ?? WORKSPACE_PERSONAS[0];
    this.activePersona = def.id;

    if (typeof document !== "undefined") {
      document.body.dataset.persona = def.id;
    }

    AppStateStore.getInstance().setState({ workspacePersona: def.id });

    if (def.enableTouchMode !== undefined) {
      JobsiteTouchMode.getInstance().setEnabled(def.enableTouchMode, persist);
    } else if (def.id !== "field" && JobsiteTouchMode.getInstance().isEnabled() && persist) {
      // Keep touch mode manual unless explicitly entering field persona
    }

    if (def.enable4dMode && hooks?.toggle4D) {
      hooks.toggle4D(true);
    }
    if (hooks?.switchTab) {
      hooks.switchTab("left-tab-bar", def.recommendedLeftTab);
      hooks.switchTab("right-tab-bar", def.recommendedRightTab);
    }

    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, def.id);
      } catch {
        // Ignore storage errors
      }
    }

    return def;
  }
}
