/**
 * CommandPaletteRegistry — Extracted Quick-Command Definitions for `CommandPalette` (Ctrl+K)
 * Keeps `src/main.ts` modular and testable.
 */

import { CommandPalette } from "./CommandPalette";
import { AccessControlManager } from "../modules/AccessControlManager";
import { SnapshotModule } from "../modules/SnapshotModule";
import { showToast } from "./ToastManager";

export interface CommandPaletteDeps {
  clippingModule: {
    createDefaultPlane: (axis: "X" | "Y" | "Z") => void;
    deleteAllPlanes: () => void;
  };
  sectionPlanesHUD: {
    show: () => void;
    renderPlanesList: (planes: any[]) => void;
  };
  idsModule: {
    createSampleDoorSpec: () => any;
    runAudit: (spec: any) => void;
  };
  timeline4DModule: {
    startSimulation: () => void;
    stopSimulation: () => void;
  };
  queryModule: {
    resetVisibility: () => void;
  };
  customViewManager: {
    renderRibbonDropdown: () => void;
  };
}

export function createCoreCommandPalette(deps: CommandPaletteDeps): CommandPalette {
  const {
    clippingModule,
    sectionPlanesHUD,
    idsModule,
    timeline4DModule,
    queryModule,
    customViewManager,
  } = deps;

  const commands: Array<{ label: string; action: () => void }> = [
    {
      label: "Open Help Center (Step-by-Step Guides & Articles)",
      action: () => {
        if (typeof (window as any).openHelpArticle === "function") {
          (window as any).openHelpArticle();
        } else {
          (window as any).toggleShortcutsModal?.(true);
        }
      },
    },
    {
      label: "Toggle UI Layout (Spatial Cockpit ↔ Classic BIM UI)",
      action: () => {
        (window as any).toggleUiLayout?.();
      },
    },
    {
      label: "Switch UI Layout: Spatial Cockpit UI",
      action: () => {
        (window as any).setUiLayout?.("cockpit");
      },
    },
    {
      label: "Switch UI Layout: Classic BIM UI",
      action: () => {
        (window as any).setUiLayout?.("classic");
      },
    },
    {
      label: "Earned Value Management (EVM) Control Suite",
      action: () => {
        if (typeof (window as any).toggleUnifiedEvmSuite === "function") {
          (window as any).toggleUnifiedEvmSuite();
        }
      },
    },
    {
      label: "Switch Active Tenant / Access Role (RBAC)",
      action: () => {
        document.getElementById("header-tenant-rbac")?.click();
      },
    },
    {
      label: "Export Security Compliance Audit Trail (CSV)",
      action: () => {
        const acm = AccessControlManager.getInstance();
        const csv = acm.exportAuditLedgerCsv();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Security_Audit_Ledger_${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("✓ Exported ISO 19650 / SOC2 Security Audit Trail", "success");
      },
    },
    { label: "Top 2D Orthographic View", action: () => document.getElementById("btn-view-top")?.click() },
    { label: "Reset 3D Isometric View", action: () => document.getElementById("btn-view-iso")?.click() },
    { label: "Bookmark Current Camera Viewpoint", action: () => document.getElementById("btn-add-viewpoint")?.click() },
    { label: "Export Bills of Quantities (BOQ CSV)", action: () => document.getElementById("btn-export-boq-csv")?.click() },
    { label: "Toggle Section Cut Mode", action: () => document.getElementById("btn-section-cut")?.click() },
    { label: "Manage Active Section Planes (Floating Mini-HUD)", action: () => sectionPlanesHUD.show() },
    {
      label: "Add Floor Plan Cut (+Y)",
      action: () => {
        clippingModule.createDefaultPlane("Y");
        sectionPlanesHUD.show();
      },
    },
    {
      label: "Add Lateral Section Cut (+X)",
      action: () => {
        clippingModule.createDefaultPlane("X");
        sectionPlanesHUD.show();
      },
    },
    {
      label: "Add Longitudinal Elevation Cut (+Z)",
      action: () => {
        clippingModule.createDefaultPlane("Z");
        sectionPlanesHUD.show();
      },
    },
    {
      label: "Clear All Section Planes",
      action: () => {
        clippingModule.deleteAllPlanes();
        sectionPlanesHUD.renderPlanesList([]);
      },
    },
    {
      label: "Snap Site Photo to BCF Field Snag",
      action: () => {
        (window as any).triggerSitePhotoBcfSnag?.();
      },
    },
    {
      label: "Run IDS Door Compliance Audit",
      action: () => {
        const spec = idsModule.createSampleDoorSpec();
        idsModule.runAudit(spec);
      },
    },
    { label: "Start 4D Simulation Playback", action: () => timeline4DModule.startSimulation() },
    { label: "Stop 4D Simulation", action: () => timeline4DModule.stopSimulation() },
    {
      label: "Export 4K Architectural Snapshot (.png)",
      action: () => SnapshotModule.getInstance().captureTechnicalSnapshot(),
    },
    { label: "Reset Model Visibility", action: () => queryModule.resetVisibility() },
    {
      label: "Exploded Disassembly View (50% Expansion)",
      action: () => {
        const slider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
        if (slider) {
          slider.value = "50";
          slider.dispatchEvent(new Event("input"));
        }
      },
    },
    {
      label: "Exploded Disassembly View (100% Full Separation)",
      action: () => {
        const slider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
        if (slider) {
          slider.value = "100";
          slider.dispatchEvent(new Event("input"));
        }
      },
    },
    {
      label: "Reset Exploded Disassembly (0% Assembled)",
      action: () => {
        const slider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
        if (slider) {
          slider.value = "0";
          slider.dispatchEvent(new Event("input"));
        }
      },
    },
    {
      label: "Exploded View: Sort by Category Clusters",
      action: () => {
        const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
        if (select) {
          select.value = "category-cluster";
          select.dispatchEvent(new Event("change"));
        }
      },
    },
    {
      label: "Exploded View: Asset & Equipment Matrix Mode (Tandem)",
      action: () => {
        const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
        if (select) {
          select.value = "asset-dense-cluster";
          select.dispatchEvent(new Event("change"));
        }
      },
    },
    {
      label: "Exploded View: Sort by Storey Levels",
      action: () => {
        const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
        if (select) {
          select.value = "storey-cluster";
          select.dispatchEvent(new Event("change"));
        }
      },
    },
    {
      label: "Exploded View: Radial Spatial Mode",
      action: () => {
        const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
        if (select) {
          select.value = "radial";
          select.dispatchEvent(new Event("change"));
        }
      },
    },
    {
      label: "Save Current Configuration as Custom View (Bookmark)",
      action: () => {
        document.getElementById("btn-add-viewpoint")?.click();
      },
    },
    {
      label: "Open Saved Custom Views Ribbon",
      action: () => {
        const menu = document.getElementById("menu-saved-views");
        if (menu) {
          customViewManager.renderRibbonDropdown();
          menu.classList.remove("hidden");
        }
      },
    },
    {
      label: "Toggle Help & Guide Modal",
      action: () => {
        if (typeof (window as any).toggleShortcutsModal === "function") {
          (window as any).toggleShortcutsModal();
        }
      },
    },
  ];

  return new CommandPalette(commands);
}
