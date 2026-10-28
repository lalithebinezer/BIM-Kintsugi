import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { MeasurementSuite } from "../modules/MeasurementSuite";
import { ClashDetector } from "../modules/ClashDetector";
import { CarbonLcaManager } from "../modules/CarbonLcaManager";
import { BimAiCopilot } from "../modules/BimAiCopilot";
import { CollaborationManager } from "../modules/CollaborationManager";
import { MinimapModule } from "../modules/MinimapModule";
import { PhasingTimelineModule } from "../modules/PhasingTimelineModule";
import { SoundManager } from "../core/SoundManager";
import { GraphicsVFXManager } from "../modules/GraphicsVFXManager";
import { GanttPhasingModule } from "../modules/GanttPhasingModule";
import { StoreyLevelSlicer } from "../modules/StoreyLevelSlicer";
import { BcfIssueManager } from "../modules/BcfIssueManager";
import { CinematicTourManager } from "../modules/CinematicTourManager";
import { ClashToleranceInspector } from "../modules/ClashToleranceInspector";
import { showToast } from "./ToastManager";
import { escapeHtml } from "../utils/formatters";

export interface ThemePresetConfig {
  name: string;
  label: string;
  hover3D: string;
  select3D: string;
  background3D: number;
}

export const THEME_PRESET_MAP: Record<string, ThemePresetConfig> = {
  obsidian: { name: "obsidian", label: "Obsidian Dark", hover3D: "#D4FF3F", select3D: "#00D2FF", background3D: 0x0A0A0C },
  zen: { name: "zen", label: "Zen Minimalist", hover3D: "#F59E0B", select3D: "#3B82F6", background3D: 0x121316 },
  cyberpunk: { name: "cyberpunk", label: "Cyberpunk Neon", hover3D: "#00F0FF", select3D: "#EC4899", background3D: 0x070913 },
  blueprint: { name: "blueprint", label: "CAD Blueprint", hover3D: "#64FFDA", select3D: "#38BDF8", background3D: 0x0A192F },
  light: { name: "light", label: "Light Studio", hover3D: "#4F46E5", select3D: "#0284C7", background3D: 0xF8FAFC },
};

export function initEnterpriseSuitesController(world: any, highlighter: any) {
  const measurementSuite = MeasurementSuite.getInstance();
  const clashDetector = ClashDetector.getInstance();
  const carbonManager = CarbonLcaManager.getInstance();
  const bimAiCopilot = BimAiCopilot.getInstance();
  const collabManager = CollaborationManager.getInstance();
  const ganttPhasing = GanttPhasingModule.getInstance();
  const storeySlicer = StoreyLevelSlicer.getInstance();
  const bcfIssueManager = BcfIssueManager.getInstance();
  const tourManager = CinematicTourManager.getInstance();
  ClashToleranceInspector.getInstance();
  GraphicsVFXManager.getInstance();

  function closeAllEnterpriseDrawers() {
    document.querySelectorAll(".enterprise-drawer").forEach((drawer) => {
      drawer.classList.add("hidden");
    });
  }

  function toggleEnterpriseDrawer(panelId: string) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const isCurrentlyOpen = !panel.classList.contains("hidden");
    closeAllEnterpriseDrawers();
    if (!isCurrentlyOpen) {
      panel.classList.remove("hidden");
      if (!document.body.classList.contains("right-sidebar-collapsed")) {
        document.body.classList.add("right-sidebar-collapsed");
      }
      if (window.innerWidth <= 1440 && !document.body.classList.contains("left-sidebar-collapsed")) {
        document.body.classList.add("left-sidebar-collapsed");
      }
      SoundManager.getInstance().playClick();
    }
  }

  const renderBcfIssues = () => {
    const bcfList = document.getElementById("bcf-issues-list");
    if (!bcfList) return;
    const topics = bcfIssueManager.getTopics();
    const countBadge = document.getElementById("bcf-issue-count-badge");
    const headerCount = document.getElementById("bcf-header-count");
    if (countBadge) countBadge.innerText = String(topics.length);
    if (headerCount) headerCount.innerText = String(topics.length);

    bcfList.innerHTML = topics
      .map((t) => {
        const safeGuid = escapeHtml(t.guid);
        const safeTitle = escapeHtml(t.title);
        const safePrio = escapeHtml(t.priority);
        const safeDesc = escapeHtml(t.description);
        const safeAssigned = escapeHtml(t.assignedTo || "Unassigned");
        return `
        <div class="bcf-issue-card" data-guid="${safeGuid}">
          <div class="bcf-card-header">
            <span class="bcf-card-title">${safeTitle}</span>
            <span class="bcf-priority-badge ${safePrio}">${safePrio}</span>
          </div>
          <p class="bcf-card-desc">${safeDesc}</p>
          <div class="bcf-card-footer">
            <span style="font-size: 0.6rem; color: rgba(255,255,255,0.5);">👤 ${safeAssigned}</span>
            <button class="btn-bcf-restore" data-guid="${safeGuid}">📍 Restore View</button>
          </div>
        </div>
      `;
      })
      .join("");

    bcfList.querySelectorAll(".btn-bcf-restore").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const guid = (e.currentTarget as HTMLElement).getAttribute("data-guid");
        const topic = topics.find((item) => item.guid === guid);
        if (topic) {
          bcfIssueManager.restoreViewpoint(topic);
          showToast(`Restored Viewpoint: ${topic.title.substring(0, 28)}...`, "success");
        }
      });
    });
  };

  const bindEnterpriseTrigger = (headerId: string, dockId: string, panelId: string, onOpen?: () => void) => {
    const handler = () => {
      toggleEnterpriseDrawer(panelId);
      const panel = document.getElementById(panelId);
      if (panel && !panel.classList.contains("hidden") && onOpen) {
        onOpen();
      }
    };
    document.getElementById(headerId)?.addEventListener("click", handler);
    document.getElementById(dockId)?.addEventListener("click", handler);
  };

  bindEnterpriseTrigger("btn-header-measure", "btn-dock-measure", "measurement-panel", () => measurementSuite.updateMeasurementUI());
  bindEnterpriseTrigger("btn-header-clash", "btn-dock-clash", "clash-panel", () => clashDetector.updateClashUI());
  bindEnterpriseTrigger("btn-header-carbon", "btn-dock-carbon", "carbon-panel", () => carbonManager.updateCarbonUI());
  bindEnterpriseTrigger("btn-header-copilot", "btn-dock-copilot", "copilot-panel", () => bimAiCopilot.updateCopilotUI());
  bindEnterpriseTrigger("btn-header-collab", "btn-dock-collab", "collab-panel", () => collabManager.updateCollabUI());
  bindEnterpriseTrigger("btn-header-bcf", "btn-dock-bcf", "bcf-issues-panel", renderBcfIssues);

  document.getElementById("btn-export-bcf-json")?.addEventListener("click", async () => {
    const exportedZip = await bcfIssueManager.exportNativeBcfZip();
    if (!exportedZip) {
      bcfIssueManager.exportBcfJson();
    }
    showToast("Exported BCF Coordination Package", "success");
  });

  document.getElementById("btn-view-snapshot")?.addEventListener("click", () => {
    const vfx = GraphicsVFXManager.getInstance();
    const activeLevel = storeySlicer.getActiveLevel();
    const carbonSummary = carbonManager.calculateProjectCarbon();
    const dataUrl = vfx.exportTechnicalDrawingSheet({
      projectTitle: "BIM KINTSUGI — TECHNICAL COORDINATION SHEET",
      storeyName: activeLevel?.name || "Level 0",
      carbonGrade: carbonSummary.ratingGrade,
      clashCount: clashDetector.getClashes().length,
    });
    if (dataUrl && dataUrl.startsWith("data:image/png")) {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `BIM_Kintsugi_Sheet_${Date.now()}.png`;
      a.click();
    }
    showToast("Exported 4K Technical Drawing Sheet (.png)", "success");
  });

  document.getElementById("btn-create-bcf-issue")?.addEventListener("click", () => {
    const titleInput = document.getElementById("bcf-new-title") as HTMLInputElement | null;
    const prioSelect = document.getElementById("bcf-new-priority") as HTMLSelectElement | null;
    const title = titleInput?.value.trim() || "Coordination Issue Markup";
    const prio = (prioSelect?.value as any) || "Normal";

    bcfIssueManager.createIssue(title, "Recorded in 3D WebGL viewport.", prio);
    if (titleInput) titleInput.value = "";
    renderBcfIssues();
    showToast(`Created BCF Issue: ${title}`, "success");
  });

  // Drawer Close buttons
  document.querySelectorAll(".drawer-close-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = (e.currentTarget as HTMLElement).dataset.target;
      if (target) {
        document.getElementById(target)?.classList.add("hidden");
      }
    });
  });

  // Measurement Tool Buttons
  document.querySelectorAll(".btn-drawer-tool").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document.querySelectorAll(".btn-drawer-tool").forEach((b) => b.classList.remove("active"));
      const targetBtn = e.currentTarget as HTMLElement;
      targetBtn.classList.add("active");
      const type = targetBtn.dataset.type as any;
      measurementSuite.startMeasurement(type || "distance");
      showToast(`Active Measurement: ${type?.toUpperCase() || "DISTANCE"}`, "info");
    });
  });

  document.getElementById("chk-measure-snap")?.addEventListener("change", (e) => {
    measurementSuite.setSnapEnabled((e.target as HTMLInputElement).checked);
  });

  document.getElementById("btn-clear-all-measurements")?.addEventListener("click", () => {
    measurementSuite.clearAllMeasurements();
  });

  // Clash Detection Actions
  document.getElementById("btn-run-clash-audit")?.addEventListener("click", async () => {
    showToast("Scanning multi-discipline models for clashes...", "info");
    const results = await clashDetector.runClashAudit();
    const crit = results.filter((c) => c.severity === "critical").length;
    showToast(`Clash Audit Complete: ${results.length} Clashes (${crit} Critical)`, crit > 0 ? "warning" : "success");
  });

  document.getElementById("btn-export-clash-bcf")?.addEventListener("click", () => {
    const bcf = clashDetector.exportBcfIssues();
    const blob = new Blob([bcf], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BIM_Kintsugi_Clashes_${Date.now()}.bcf.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported BCF 3.0 Clash Report", "success");
  });

  // 6D Carbon Heatmap Actions
  document.getElementById("btn-toggle-carbon-heatmap")?.addEventListener("click", () => {
    const active = carbonManager.toggleHeatmap();
    showToast(active ? "6D Embodied Carbon Heatmap Active" : "Heatmap Disabled", "success");
  });

  // AI Copilot Actions
  const copilotInput = document.getElementById("copilot-user-input") as HTMLInputElement | null;
  const copilotSendBtn = document.getElementById("btn-copilot-send");

  async function handleCopilotSend() {
    if (!copilotInput || !copilotInput.value.trim()) return;
    const q = copilotInput.value.trim();
    copilotInput.value = "";
    await bimAiCopilot.executeQuery(q);
  }

  copilotSendBtn?.addEventListener("click", handleCopilotSend);
  copilotInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleCopilotSend();
    }
  });

  // Collaboration Actions
  document.getElementById("btn-follow-host")?.addEventListener("click", () => {
    const active = collabManager.toggleFollowHost();
    showToast(active ? "Camera Synced: Following Presenter" : "Independent Camera View", "info");
  });

  document.getElementById("btn-collab-ping-loc")?.addEventListener("click", () => {
    const pos = collabManager.pingCurrentLocation();
    showToast(`Dropped 3D Beacon at [${pos[0].toFixed(1)}, ${pos[1].toFixed(1)}, ${pos[2].toFixed(1)}]`, "success");
  });

  document.getElementById("btn-collab-mic-toggle")?.addEventListener("click", () => {
    const unmuted = collabManager.toggleMic();
    showToast(unmuted ? "Microphone Active (Broadcasting Voice)" : "Microphone Muted", unmuted ? "success" : "warning");
  });

  document.getElementById("btn-collab-copy-invite")?.addEventListener("click", () => {
    const url = `${window.location.origin}/?room=KINTSUGI-PRO-8924`;
    navigator.clipboard.writeText(url).then(() => {
      showToast("Session Invite Link Copied to Clipboard!", "success");
    }).catch(() => {
      showToast("Room ID: KINTSUGI-PRO-8924", "info");
    });
  });

  document.querySelectorAll(".collab-tab-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const targetTab = (e.currentTarget as HTMLElement).getAttribute("data-collab-tab");
      document.querySelectorAll(".collab-tab-btn").forEach((b) => b.classList.remove("active"));
      (e.currentTarget as HTMLElement).classList.add("active");

      const peersPane = document.getElementById("collab-tab-peers-content");
      const chatPane = document.getElementById("collab-tab-chat-content");

      if (targetTab === "chat") {
        peersPane?.classList.add("hidden");
        chatPane?.classList.remove("hidden");
      } else {
        chatPane?.classList.add("hidden");
        peersPane?.classList.remove("hidden");
      }
    });
  });

  const collabChatInput = document.getElementById("collab-chat-input") as HTMLInputElement | null;
  const collabChatSendBtn = document.getElementById("btn-collab-chat-send");

  function handleSendCollabChat() {
    if (!collabChatInput || !collabChatInput.value.trim()) return;
    const txt = collabChatInput.value.trim();
    collabChatInput.value = "";
    collabManager.sendChatMessage(txt);
  }

  collabChatSendBtn?.addEventListener("click", handleSendCollabChat);
  collabChatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleSendCollabChat();
    }
  });

  // 2D Radar Minimap & Walk Mode
  const minimap = MinimapModule.getInstance();
  minimap.init("minimap-canvas");

  document.getElementById("btn-minimap-walk-toggle")?.addEventListener("click", () => {
    const isWalk = minimap.toggleWalkMode();
    showToast(isWalk ? "Walkthrough Mode: WASD Keys Active" : "Orbit Camera Mode", "info");
  });

  document.getElementById("minimap-level-select")?.addEventListener("change", (e) => {
    const levelIdx = parseInt((e.target as HTMLSelectElement).value, 10);
    minimap.setLevel(levelIdx);
    storeySlicer.setStorey(levelIdx);
    const activeLevel = storeySlicer.getActiveLevel();
    showToast(`Active Storey: ${activeLevel.name}`, "info");
  });

  // Unified 4D Timeline & Gantt Bar Synchronization
  const phasingTimeline = PhasingTimelineModule.getInstance();

  const toggleUnified4DBar = () => {
    if (typeof (window as any).toggle4DMode === "function") {
      (window as any).toggle4DMode();
    }
    SoundManager.getInstance().playClick();
  };

  document.getElementById("btn-header-gantt")?.addEventListener("click", toggleUnified4DBar);
  document.getElementById("btn-dock-gantt")?.addEventListener("click", toggleUnified4DBar);
  document.getElementById("btn-close-gantt-bar")?.addEventListener("click", () => {
    if (typeof (window as any).toggle4DMode === "function") {
      (window as any).toggle4DMode(false);
    }
    SoundManager.getInstance().playClick();
  });

  document.querySelectorAll(".gantt-pill").forEach((pill) => {
    pill.addEventListener("click", (e) => {
      const week = Number((e.currentTarget as HTMLElement).getAttribute("data-week"));
      if (week) {
        ganttPhasing.setWeek(week);
        phasingTimeline.setWeek(week);
        if (typeof (window as any).jumpTimelineToWeek === "function") {
          (window as any).jumpTimelineToWeek(week);
        }
        document.querySelectorAll(".gantt-pill").forEach((p) => p.classList.remove("active"));
        (e.currentTarget as HTMLElement).classList.add("active");
        SoundManager.getInstance().playSnap();
      }
    });
  });

  // Cinematic Drone Orbit & Tour UI
  const btnDrone = document.getElementById("btn-drone-orbit");
  btnDrone?.addEventListener("click", () => {
    const isOrbiting = tourManager.toggleDroneOrbit();
    btnDrone.classList.toggle("active", isOrbiting);
    showToast(isOrbiting ? "360° Drone Orbit: ACTIVE" : "Drone Orbit: STOPPED", "success");
  });

  document.getElementById("btn-play-tour")?.addEventListener("click", () => {
    showToast("Starting Architectural Walkthrough Tour...", "success");
    tourManager.playTour();
  });

  // Storey Slicer UI
  const btnSliceToolbar = document.getElementById("btn-toggle-storey-slice");
  const btnSliceMinimap = document.getElementById("btn-minimap-slice-toggle");
  const toggleSlice = () => {
    const active = storeySlicer.toggleSlicing();
    btnSliceToolbar?.classList.toggle("active", active);
    btnSliceMinimap?.classList.toggle("active", active);
    const activeLevel = storeySlicer.getActiveLevel();
    showToast(active ? `Storey Slice Active: ${activeLevel.name}` : "Storey Slice: Disabled", "success");
  };

  btnSliceToolbar?.addEventListener("click", toggleSlice);
  btnSliceMinimap?.addEventListener("click", toggleSlice);

  const btnMinimapCollapse = document.getElementById("btn-minimap-collapse");
  const minimapContainer = document.getElementById("minimap-container");
  btnMinimapCollapse?.addEventListener("click", () => {
    if (minimapContainer) {
      const isCollapsed = minimapContainer.classList.toggle("collapsed");
      btnMinimapCollapse.innerHTML = isCollapsed
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg>`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`;
      SoundManager.getInstance().playClick();
    }
  });

  // Apple Dock Spring Magnifier
  initAppleDockMagnifier();

  // Enterprise Theme Synchronization
  function applyGlobalTheme(themeKey: string) {
    const preset = THEME_PRESET_MAP[themeKey] || THEME_PRESET_MAP.obsidian;
    document.documentElement.setAttribute("data-theme", preset.name);
    try {
      localStorage.setItem("bim_theme_preset", preset.name);
    } catch (e) {}

    try {
      const hoverStyle = highlighter?.styles?.get("hover");
      if (hoverStyle) hoverStyle.color = new THREE.Color(preset.hover3D);
      const selectStyle = highlighter?.styles?.get("select");
      if (selectStyle) selectStyle.color = new THREE.Color(preset.select3D);
      BimEngine.getInstance().syncOutlinerTheme(preset.select3D, preset.hover3D);
    } catch (e) {}

    try {
      if (world?.scene?.three) {
        world.scene.three.background = new THREE.Color(preset.background3D);
      }
    } catch (e) {}

    document.querySelectorAll<HTMLSelectElement>(".select-theme-toggle").forEach((selector) => {
      if (selector.value !== preset.name) {
        selector.value = preset.name;
      }
    });
  }

  document.querySelectorAll<HTMLSelectElement>(".select-theme-toggle").forEach((selector) => {
    selector.addEventListener("change", (e) => {
      const selected = (e.target as HTMLSelectElement).value;
      applyGlobalTheme(selected);
      const preset = THEME_PRESET_MAP[selected];
      showToast(`Theme Switched: ${preset?.label || selected}`, "info");
    });
  });

  const savedTheme = typeof localStorage !== "undefined" ? localStorage.getItem("bim_theme_preset") || "obsidian" : "obsidian";
  applyGlobalTheme(savedTheme);
}

function initAppleDockMagnifier() {
  const dock = document.querySelector<HTMLElement>(".bottom-toolbar.magic-dock");
  if (!dock) return;

  const items = Array.from(dock.querySelectorAll<HTMLElement>(".dock-item"));
  const maxScale = 1.32;
  const radius = 120;

  const onMouseMove = (e: MouseEvent) => {
    const mouseX = e.clientX;
    items.forEach((item) => {
      const btn = item.querySelector<HTMLElement>(".dock-icon");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const dist = Math.abs(mouseX - btnCenterX);

      if (dist < radius) {
        const factor = Math.cos((dist / radius) * (Math.PI / 2));
        const scale = 1 + (maxScale - 1) * Math.pow(factor, 1.4);
        const translateY = -5 * factor;
        btn.style.transform = `scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
        item.style.margin = `0 ${(factor * 3.5).toFixed(1)}px`;
        item.style.zIndex = Math.round(100 * factor + 10).toString();
      } else {
        btn.style.transform = "scale(1) translateY(0px)";
        item.style.margin = "0 0";
        item.style.zIndex = "1";
      }
    });
  };

  const onMouseLeave = () => {
    items.forEach((item) => {
      const btn = item.querySelector<HTMLElement>(".dock-icon");
      if (btn) btn.style.transform = "scale(1) translateY(0px)";
      item.style.margin = "0 0";
      item.style.zIndex = "1";
    });
  };

  let lastHoveredItem: HTMLElement | null = null;
  items.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      if (lastHoveredItem !== item) {
        lastHoveredItem = item;
        SoundManager.getInstance().playHover();
      }
    }, { passive: true });
    item.addEventListener("click", () => {
      SoundManager.getInstance().playClick();
    }, { passive: true });
  });

  dock.addEventListener("mousemove", onMouseMove, { passive: true });
  dock.addEventListener("mouseleave", () => {
    lastHoveredItem = null;
    onMouseLeave();
  }, { passive: true });
}

