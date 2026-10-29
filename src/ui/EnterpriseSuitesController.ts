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
import { GisModule } from "../modules/GisModule";
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
  const gisModule = GisModule.getInstance();
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
  (window as any).renderBcfIssues = renderBcfIssues;
  renderBcfIssues();

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

  const bcfImportInput = document.getElementById("btn-import-bcf-input") as HTMLInputElement | null;
  bcfImportInput?.addEventListener("change", async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const count = await bcfIssueManager.importBcfData(file);
    renderBcfIssues();
    bcfImportInput.value = "";
    showToast(
      count > 0 ? `Imported ${count} BCF Coordination Issue(s) from ${file.name}` : `No new BCF topics found in ${file.name}`,
      count > 0 ? "success" : "warning"
    );
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

  // 5D Project Cost Control Unified Suite Trigger
  const toggleUnifiedCostControl = () => {
    SoundManager.getInstance().playClick();
    toggleEnterpriseDrawer("cost-control-panel");
    const panel = document.getElementById("cost-control-panel");
    if (panel && !panel.classList.contains("hidden")) {
      if (typeof (window as any).updateCumulative5DCost === "function") {
        (window as any).updateCumulative5DCost();
      }
      showToast("5D Project Cost Control: Budget & Rates Active", "success");
    }
  };
  (window as any).toggleUnifiedCostControl = toggleUnifiedCostControl;

  document.getElementById("btn-dock-cost")?.addEventListener("click", toggleUnifiedCostControl);
  document.getElementById("btn-header-cost")?.addEventListener("click", toggleUnifiedCostControl);
  document.getElementById("btn-timeline-cost-control")?.addEventListener("click", toggleUnifiedCostControl);

  // GeoBIM GIS & Site Georeference Suite Trigger
  const refreshGisUI = () => {
    const geo = gisModule.getGeoreference();
    const cfg = gisModule.getBasemapConfig();

    const latInput = document.getElementById("gis-input-lat") as HTMLInputElement | null;
    const lonInput = document.getElementById("gis-input-lon") as HTMLInputElement | null;
    const elevInput = document.getElementById("gis-input-elev") as HTMLInputElement | null;
    const northInput = document.getElementById("gis-input-north") as HTMLInputElement | null;
    const dmsBadge = document.getElementById("gis-dms-badge");
    const utmBadge = document.getElementById("gis-utm-badge");

    if (latInput) latInput.value = String(geo.latitude);
    if (lonInput) lonInput.value = String(geo.longitude);
    if (elevInput) elevInput.value = String(geo.elevation);
    if (northInput) northInput.value = String(geo.trueNorthRotation);

    const dms = gisModule.formatDMS(geo.latitude, geo.longitude);
    if (dmsBadge) dmsBadge.textContent = `${dms.latDms} ${dms.lonDms}`;
    if (utmBadge) utmBadge.textContent = gisModule.getUtmZone(geo.latitude, geo.longitude);

    // Synchronize 3D Basemap controls
    const toggleBasemap = document.getElementById("gis-toggle-basemap") as HTMLInputElement | null;
    const statusBadge = document.getElementById("gis-basemap-status");
    const selectProvider = document.getElementById("gis-select-provider") as HTMLSelectElement | null;
    const sliderRadius = document.getElementById("gis-slider-radius") as HTMLInputElement | null;
    const badgeRadius = document.getElementById("gis-radius-val");
    const sliderElev = document.getElementById("gis-slider-elev") as HTMLInputElement | null;
    const badgeElev = document.getElementById("gis-elev-val");
    const sliderOpacity = document.getElementById("gis-slider-opacity") as HTMLInputElement | null;
    const badgeOpacity = document.getElementById("gis-opacity-val");

    if (toggleBasemap) toggleBasemap.checked = cfg.enabled;
    if (statusBadge) {
      statusBadge.textContent = cfg.enabled ? "Active" : "Hidden";
      statusBadge.style.color = cfg.enabled ? "#06b6d4" : "var(--text-muted)";
    }
    if (selectProvider) selectProvider.value = cfg.provider;
    if (sliderRadius) sliderRadius.value = String(cfg.radius);
    if (badgeRadius) badgeRadius.textContent = `${cfg.radius} m`;
    if (sliderElev) sliderElev.value = String(cfg.elevationOffset);
    if (badgeElev) badgeElev.textContent = `${cfg.elevationOffset >= 0 ? "+" : ""}${cfg.elevationOffset.toFixed(2)} m`;
    if (sliderOpacity) sliderOpacity.value = String(cfg.opacity);
    if (badgeOpacity) badgeOpacity.textContent = `${Math.round(cfg.opacity * 100)}%`;
  };
  (window as any).refreshGisUI = refreshGisUI;

  const toggleGisSuite = () => {
    SoundManager.getInstance().playClick();
    toggleEnterpriseDrawer("gis-panel");
    const panel = document.getElementById("gis-panel");
    if (panel && !panel.classList.contains("hidden")) {
      refreshGisUI();
      showToast("GeoBIM GIS: 3D Georeference & Basemap Active", "info");
    }
  };
  (window as any).toggleGisSuite = toggleGisSuite;

  document.getElementById("btn-dock-gis")?.addEventListener("click", toggleGisSuite);
  document.getElementById("btn-header-gis")?.addEventListener("click", toggleGisSuite);

  // Apply Georeference Datum
  document.getElementById("gis-btn-apply-coords")?.addEventListener("click", () => {
    const lat = parseFloat((document.getElementById("gis-input-lat") as HTMLInputElement)?.value || "0");
    const lon = parseFloat((document.getElementById("gis-input-lon") as HTMLInputElement)?.value || "0");
    const elev = parseFloat((document.getElementById("gis-input-elev") as HTMLInputElement)?.value || "0");
    const north = parseFloat((document.getElementById("gis-input-north") as HTMLInputElement)?.value || "0");
    gisModule.setGeoreference({ latitude: lat, longitude: lon, elevation: elev, trueNorthRotation: north });
    refreshGisUI();
    showToast(`Georeference updated: ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`, "success");
    SoundManager.getInstance().playClick();
  });

  // Preset Select
  document.getElementById("gis-preset-select")?.addEventListener("change", (e) => {
    const val = (e.target as HTMLSelectElement).value;
    const applied = gisModule.applyPreset(val);
    if (applied) {
      refreshGisUI();
      showToast(`Applied Site Preset: ${val.toUpperCase()}`, "info");
      SoundManager.getInstance().playClick();
    }
  });

  // Align Sun to Site Coordinates
  document.getElementById("gis-btn-align-sun")?.addEventListener("click", () => {
    const sun = gisModule.calculateSolarPosition();
    if (typeof (window as any).updateSunPosition === "function") {
      (window as any).updateSunPosition(sun.azimuth, sun.elevation);
    }
    const azSlider = document.getElementById("slider-sun-azimuth") as HTMLInputElement | null;
    const elSlider = document.getElementById("slider-sun-elevation") as HTMLInputElement | null;
    const azBadge = document.getElementById("val-sun-azimuth");
    const elBadge = document.getElementById("val-sun-elevation");
    if (azSlider) azSlider.value = String(Math.round(sun.azimuth));
    if (elSlider) elSlider.value = String(Math.round(sun.elevation));
    if (azBadge) azBadge.textContent = `${Math.round(sun.azimuth)}°`;
    if (elBadge) elBadge.textContent = `${Math.round(sun.elevation)}°`;
    showToast(`NOAA Solar Position: Azimuth ${sun.azimuth.toFixed(1)}°, Elevation ${sun.elevation.toFixed(1)}°`, "success");
    SoundManager.getInstance().playClick();
  });

  // 3D Basemap Controls
  document.getElementById("gis-toggle-basemap")?.addEventListener("change", (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    gisModule.setBasemapVisible(checked);
    const statusBadge = document.getElementById("gis-basemap-status");
    if (statusBadge) {
      statusBadge.textContent = checked ? "Active" : "Hidden";
      statusBadge.style.color = checked ? "#06b6d4" : "var(--text-muted)";
    }
    SoundManager.getInstance().playClick();
  });

  document.getElementById("gis-select-provider")?.addEventListener("change", (e) => {
    const prov = (e.target as HTMLSelectElement).value as any;
    gisModule.setBasemapProvider(prov);
    showToast(`Basemap Provider: ${prov}`, "info");
    SoundManager.getInstance().playClick();
  });

  document.getElementById("gis-slider-radius")?.addEventListener("input", (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    gisModule.setBasemapRadius(val);
    const badge = document.getElementById("gis-radius-val");
    if (badge) badge.textContent = `${val} m`;
  });

  document.getElementById("gis-slider-elev")?.addEventListener("input", (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    gisModule.setBasemapElevation(val);
    const badge = document.getElementById("gis-elev-val");
    if (badge) badge.textContent = `${val >= 0 ? "+" : ""}${val.toFixed(2)} m`;
  });

  document.getElementById("gis-slider-opacity")?.addEventListener("input", (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    gisModule.setBasemapOpacity(val);
    const badge = document.getElementById("gis-opacity-val");
    if (badge) badge.textContent = `${Math.round(val * 100)}%`;
  });

  // Demo Cadastre
  document.getElementById("gis-btn-demo-cadastre")?.addEventListener("click", () => {
    const res = gisModule.loadDemoCadastre();
    refreshGisUI();
    gisModule.fitToCadastre();
    showToast(`Demo Cadastre Loaded: ${res.featureCount} Features (${res.layerNames.join(", ")})`, "success");
    SoundManager.getInstance().playClick();
  });

  // Clear Cadastre
  document.getElementById("gis-btn-clear-cadastre")?.addEventListener("click", () => {
    gisModule.clearCadastre();
    showToast("GIS Cadastral & Utility layers cleared", "info");
    SoundManager.getInstance().playClick();
  });

  // Import GeoJSON File
  document.getElementById("gis-file-geojson")?.addEventListener("change", async (e) => {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = gisModule.loadGeoJSON(parsed);
      refreshGisUI();
      gisModule.fitToCadastre();
      showToast(`GeoJSON Imported: ${res.featureCount} Features (${res.layerNames.join(", ")})`, "success");
      SoundManager.getInstance().playClick();
    } catch (err: any) {
      showToast(`Failed to parse GeoJSON: ${err.message}`, "error");
    } finally {
      input.value = "";
    }
  });

  // Export Site GeoJSON
  document.getElementById("gis-btn-export-geojson")?.addEventListener("click", () => {
    const jsonStr = gisModule.exportSiteGeoJson();
    const blob = new Blob([jsonStr], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Site_Georeference_${Date.now()}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported Site GeoJSON FeatureCollection", "success");
    SoundManager.getInstance().playClick();
  });
  document.getElementById("btn-close-gantt-bar")?.addEventListener("click", () => {
    if (typeof (window as any).toggle4DMode === "function") {
      (window as any).toggle4DMode(false);
    }
    SoundManager.getInstance().playClick();
  });

  const milestonesRow = document.querySelector(".gantt-milestones-row");
  milestonesRow?.addEventListener("click", (e) => {
    const pill = (e.target as HTMLElement).closest(".gantt-pill") as HTMLElement | null;
    if (!pill) return;
    const startMs = Number(pill.getAttribute("data-start"));
    if (Number.isFinite(startMs) && startMs > 0) {
      if (typeof (window as any).jumpTimelineToDate === "function") {
        (window as any).jumpTimelineToDate(new Date(startMs));
      }
    } else {
      const week = Number(pill.getAttribute("data-week"));
      if (week) {
        ganttPhasing.setWeek(week);
        phasingTimeline.setWeek(week);
        if (typeof (window as any).jumpTimelineToWeek === "function") {
          (window as any).jumpTimelineToWeek(week);
        }
      }
    }
    document.querySelectorAll(".gantt-pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    SoundManager.getInstance().playSnap();
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
      localStorage.setItem("bim_theme", preset.name);
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

    try {
      if (typeof (window as any).applyCategoryColors === "function") {
        (window as any).applyCategoryColors().catch?.(() => {});
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

  // Global floating body-level tooltip (guarantees highest z-index and zero overflow clipping)
  let globalTooltip = document.getElementById("dock-global-tooltip");
  if (!globalTooltip) {
    globalTooltip = document.createElement("div");
    globalTooltip.id = "dock-global-tooltip";
    globalTooltip.setAttribute("role", "tooltip");
    globalTooltip.setAttribute("aria-hidden", "true");
    document.body.appendChild(globalTooltip);
  }

  let activeItem: HTMLElement | null = null;

  const hideGlobalTooltip = () => {
    if (globalTooltip) {
      globalTooltip.classList.remove("visible");
      globalTooltip.setAttribute("aria-hidden", "true");
    }
  };

  const showGlobalTooltip = (item: HTMLElement) => {
    if (!globalTooltip) return;
    const text = item.getAttribute("data-tooltip") || item.querySelector<HTMLElement>(".dock-tooltip")?.textContent?.trim();
    if (!text) {
      hideGlobalTooltip();
      return;
    }
    globalTooltip.textContent = text;
    globalTooltip.setAttribute("aria-hidden", "false");

    const btn = item.querySelector<HTMLElement>(".dock-icon") || item;
    const rect = btn.getBoundingClientRect();
    const tooltipW = globalTooltip.offsetWidth || 80;
    const posX = Math.max(tooltipW / 2 + 10, Math.min(window.innerWidth - tooltipW / 2 - 10, rect.left + rect.width / 2));
    const posY = Math.max(10, rect.top - 18);

    globalTooltip.style.left = `${posX}px`;
    globalTooltip.style.top = `${posY}px`;
    globalTooltip.classList.add("visible");
  };

  // Mouse wheel horizontal scroll translation
  dock.addEventListener("wheel", (e: WheelEvent) => {
    if (e.deltaY !== 0 || e.deltaX !== 0) {
      e.preventDefault();
      dock.scrollLeft += e.deltaY !== 0 ? e.deltaY * 1.25 : e.deltaX;
      if (activeItem) showGlobalTooltip(activeItem);
    }
  }, { passive: false });

  // Pointer drag-to-scroll for fluid mouse and touch swipe panning
  let isDown = false;
  let startX = 0;
  let initialScroll = 0;
  let totalDragDist = 0;

  dock.addEventListener("pointerdown", (e: PointerEvent) => {
    if (e.button !== 0) return;
    isDown = true;
    totalDragDist = 0;
    startX = e.clientX;
    initialScroll = dock.scrollLeft;
    dock.style.cursor = "grabbing";
    dock.style.userSelect = "none";
    hideGlobalTooltip();
  });

  window.addEventListener("pointermove", (e: PointerEvent) => {
    if (!isDown) return;
    const delta = e.clientX - startX;
    totalDragDist += Math.abs(delta);
    dock.scrollLeft = initialScroll - delta;
    hideGlobalTooltip();
  });

  const onPointerEnd = () => {
    if (!isDown) return;
    isDown = false;
    dock.style.cursor = "";
    dock.style.userSelect = "";
  };

  window.addEventListener("pointerup", onPointerEnd);
  window.addEventListener("pointercancel", onPointerEnd);

  dock.addEventListener("click", (e: MouseEvent) => {
    if (totalDragDist > 8) {
      e.stopPropagation();
      e.preventDefault();
    }
  }, true);

  const items = Array.from(dock.querySelectorAll<HTMLElement>(".dock-item"));

  const onMouseMove = (e: MouseEvent) => {
    if (isDown) return;
    const isSmall = window.innerWidth <= 768 || !document.body.classList.contains("left-sidebar-collapsed") || !document.body.classList.contains("right-sidebar-collapsed");
    const maxScale = isSmall ? 1.18 : 1.28;
    const radius = isSmall ? 85 : 120;
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
        const translateY = -4 * factor;
        btn.style.transform = `scale(${scale.toFixed(3)}) translateY(${translateY.toFixed(1)}px)`;
        item.style.margin = isSmall ? "0 1px" : `0 ${(factor * 3.5).toFixed(1)}px`;
        item.style.zIndex = Math.round(100 * factor + 10).toString();
      } else {
        btn.style.transform = "scale(1) translateY(0px)";
        item.style.margin = isSmall ? "0 1px" : "0 0";
        item.style.zIndex = "1";
      }
    });

    if (activeItem) {
      showGlobalTooltip(activeItem);
    }
  };

  const onMouseLeave = () => {
    const isSmall = window.innerWidth <= 768;
    items.forEach((item) => {
      const btn = item.querySelector<HTMLElement>(".dock-icon");
      if (btn) btn.style.transform = "scale(1) translateY(0px)";
      item.style.margin = isSmall ? "0 1px" : "0 0";
      item.style.zIndex = "1";
    });
    activeItem = null;
    hideGlobalTooltip();
  };

  items.forEach((item) => {
    const btn = item.querySelector<HTMLElement>(".dock-icon");

    item.addEventListener("mouseenter", () => {
      if (activeItem !== item) {
        activeItem = item;
        SoundManager.getInstance().playHover();
      }
      showGlobalTooltip(item);
    }, { passive: true });

    item.addEventListener("mouseleave", () => {
      if (activeItem === item) {
        activeItem = null;
        hideGlobalTooltip();
      }
    }, { passive: true });

    if (btn) {
      btn.addEventListener("focus", () => {
        activeItem = item;
        showGlobalTooltip(item);
      });
      btn.addEventListener("blur", () => {
        if (activeItem === item) {
          activeItem = null;
          hideGlobalTooltip();
        }
      });
    }

    item.addEventListener("click", () => {
      SoundManager.getInstance().playClick();
    }, { passive: true });
  });

  dock.addEventListener("mousemove", onMouseMove, { passive: true });
  dock.addEventListener("mouseleave", () => {
    onMouseLeave();
  }, { passive: true });
}

