import './style.css';
import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as WEBIFC from "web-ifc";

function isRelatedObject(relatedObjects: any, idToMatch: number): boolean {
  if (!relatedObjects) return false;
  if (Array.isArray(relatedObjects)) {
    try {
      for (let i = 0; i < relatedObjects.length; i++) {
        try {
          const obj = relatedObjects[i];
          if (Number(obj?.value ?? obj) === idToMatch) return true;
        } catch (e) {
          // Ignore getter errors from WebAssembly/Proxy properties
        }
      }
    } catch(e) {}
    return false;
  }
  return Number(relatedObjects.value ?? relatedObjects) === idToMatch;
}

import * as OBF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import CameraControls from "camera-controls";
import { PropertyEditor, initPropertyEditorUI } from "./ui/PropertyEditor";
import "./ui/BimViewCube";
import { MeasurementSuite } from "./modules/MeasurementSuite";
import { ClashDetector } from "./modules/ClashDetector";
import { CarbonLcaManager } from "./modules/CarbonLcaManager";
import { BimAiCopilot } from "./modules/BimAiCopilot";
import { CollaborationManager } from "./modules/CollaborationManager";
function getCategoryColor(_theme: string, category: string): string {
  const categoryColorMap: Record<string, string> = {
    IFCWALL: "#94a3b8",
    IFCWALLSTANDARDCASE: "#94a3b8",
    IFCSLAB: "#60a5fa",
    IFCROOF: "#6b7280",
    IFCCOLUMN: "#fbbf24",
    IFCBEAM: "#f97316",
    IFCDOOR: "#34d399",
    IFCWINDOW: "#38bdf8",
    IFCSTAIR: "#a78bfa",
    IFCSTAIRFLIGHT: "#a78bfa",
    IFCRAILING: "#e879f9",
    IFCFURNISHINGELEMENT: "#fb923c",
    IFCFLOWSEGMENT: "#22d3ee",
    IFCFLOWFITTING: "#22d3ee",
    IFCFLOWTERMINAL: "#4ade80",
    IFCSPACE: "#fde68a",
    IFCFOOTING: "#d97706",
    IFCPILE: "#92400e",
    IFCPLATE: "#78716c",
    IFCCOVERING: "#a3e635",
  };
  return categoryColorMap[category.toUpperCase()] ?? "#a78bfa";
}
import { ScheduleManager } from "./modules/ScheduleManager";
import { exportBOQAsCSV, generateBOQSummary, extractQuantityData, type BOQLineItem } from "./modules/BoqGenerator";

import { BCFManager } from "./modules/BcfManager";
import { IDSChecker } from "./modules/IdsChecker";
import { BimEngine } from "./core/BimEngine";
import { ModelManager } from "./core/ModelManager";
import { ViewportController } from "./core/ViewportController";
import { ClippingModule } from "./modules/ClippingModule";
import { QueryModule } from "./modules/QueryModule";
import { IdsModule } from "./modules/IdsModule";
import { Timeline4DModule } from "./modules/Timeline4DModule";
import { Boq5DModule } from "./modules/Boq5DModule";
import { FederationModule } from "./modules/FederationModule";
import { CommandPalette } from "./ui/CommandPalette";
import { SceneManager } from "./core/SceneManager";
import { KeyboardController } from "./core/KeyboardController";
import { CustomViewManager } from "./core/CustomViewManager";
import { CostChartComponent } from "./ui/CostChartComponent";
import { UIManager } from "./ui/UIManager";
import { ExplosionModule } from "./modules/ExplosionModule";
import { AnnotationModule } from "./modules/AnnotationModule";
import { SnapshotModule } from "./modules/SnapshotModule";
import { HighlighterManager } from "./modules/HighlighterManager";
import { ModelInfoManager } from "./modules/ModelInfoManager";
import { MinimapHUD } from "./ui/MinimapHUD";
import { GlobalSearchOverlay } from "./ui/GlobalSearchOverlay";
import { SectionPlanesHUD } from "./ui/SectionPlanesHUD";
import { SelectionManager } from "./modules/SelectionManager";
import { formatCurrency, formatItemCount } from "./utils/formatters";

BUI.Manager.init();

// --- INITIALIZE ENTERPRISE BIM ENGINE ---
const components = new OBC.Components();
const worlds = components.get(OBC.Worlds);

const world = worlds.create<
  OBC.ShadowedScene,
  OBC.OrthoPerspectiveCamera,
  OBF.PostproductionRenderer
>();

const scene = new OBC.ShadowedScene(components);
world.scene = scene;
(window as any).viewer_world = world;

const container = document.getElementById("container")!;
world.renderer = new OBF.PostproductionRenderer(components, container);
world.renderer.three.setPixelRatio(Math.min(window.devicePixelRatio, 2));
world.renderer.three.shadowMap.enabled = true;
world.renderer.three.shadowMap.type = THREE.PCFShadowMap;

// WebGL Context Loss & Recovery Guard
const glCanvas = world.renderer.three.domElement;
if (glCanvas) {
  glCanvas.addEventListener("webglcontextlost", (e: Event) => {
    e.preventDefault();
    console.warn("⚠️ WebGL context lost! Pausing engine render loop...");
    if (typeof (window as any).showToast === "function") {
      (window as any).showToast("GPU Memory Warning: WebGL context lost. Restoring...", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`);
    }
  });

  glCanvas.addEventListener("webglcontextrestored", () => {
    console.info("✅ WebGL context restored. Rebuilding scene & shaders...");
    try {
      if (world.renderer) {
        world.renderer.three.setSize(container.clientWidth, container.clientHeight);
        if (world.renderer.update) world.renderer.update();
      }
      if (typeof (window as any).showToast === "function") {
        (window as any).showToast("WebGL Context Successfully Restored", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="20 6 9 17 4 12"/></svg>`);
      }
    } catch (err) {
      console.error("Failed to reinitialize WebGL context:", err);
    }
  });
}

world.camera = new OBC.OrthoPerspectiveCamera(components);
world.camera.currentWorld = world;
const camAny = world.camera as any;
if (!camAny._navigationModes.has("Orbit")) {
  camAny._navigationModes.set("Orbit", new OBC.OrbitMode(world.camera));
  camAny._navigationModes.set("FirstPerson", new OBC.FirstPersonMode(world.camera));
  camAny._navigationModes.set("Plan", new OBC.PlanMode(world.camera));
  camAny._mode = camAny._navigationModes.get("Orbit");
}
world.camera.set("Orbit");
if (world.camera.threePersp) {
  world.camera.threePersp.fov = 55;
  world.camera.threePersp.near = 0.01;
  world.camera.threePersp.far = 3000;
  world.camera.threePersp.updateProjectionMatrix();
}
if (world.camera.threeOrtho) {
  world.camera.threeOrtho.near = 0.01;
  world.camera.threeOrtho.far = 3000;
  world.camera.threeOrtho.updateProjectionMatrix();
}
if (world.camera.controls) {
  const controls = world.camera.controls as any;
  controls.enabled = true;
  controls.dollyToCursor = true;
  controls.dollySpeed = 0.3;
  controls.zoomSpeed = 0.3;
  if (controls.mouseButtons) {
    controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
    controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
    controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
    controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
  }
  if (controls.touches) {
    controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
    controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
  }
}

scene.setup();
scene.three.background = null;

components.init();

// Initialize BimEngine singleton with primary components & world
const bimEngine = BimEngine.getInstance(components, world);
(window as any).bimEngine = bimEngine;
(window as any).ExplosionModule = ExplosionModule;

// Initialize Controllers & Managers
KeyboardController.getInstance().init();
UIManager.getInstance().init();

const customViewManager = CustomViewManager.getInstance();
customViewManager.init(world);
(window as any).customViewManager = customViewManager;



// Top Ribbon Saved Views Flyout Menu Toggle
const btnRibbonSavedViews = document.getElementById("btn-ribbon-saved-views");
const menuSavedViews = document.getElementById("menu-saved-views");

if (btnRibbonSavedViews && menuSavedViews) {
  btnRibbonSavedViews.addEventListener("click", (e) => {
    e.stopPropagation();
    const isHidden = menuSavedViews.classList.contains("hidden");
    if (isHidden) {
      customViewManager.renderRibbonDropdown();
      menuSavedViews.classList.remove("hidden");
    } else {
      menuSavedViews.classList.add("hidden");
    }
  });

  // Global pointerdown with capture so clicks on 3D canvas immediately dismiss the menu
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (menuSavedViews.classList.contains("hidden")) return;
      const target = e.target as Node;
      if (!menuSavedViews.contains(target) && !btnRibbonSavedViews.contains(target)) {
        menuSavedViews.classList.add("hidden");
      }
    },
    { capture: true }
  );

  // Close on Escape key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !menuSavedViews.classList.contains("hidden")) {
      menuSavedViews.classList.add("hidden");
    }
  });
}

document.getElementById("btn-add-viewpoint")?.addEventListener("click", () => {
  let name: string | null = null;
  try {
    name = prompt("Enter a name for this Custom View (stores camera, clustering, and visual settings):", `Custom View #${customViewManager.getAllViews().length + 1}`);
  } catch {
    name = null;
  }
  if (name && name.trim()) {
    customViewManager.saveCurrentView(name.trim());
  }
});

// Initialize Managers
const scheduleManager = new ScheduleManager();
(window as any).scheduleManager = scheduleManager;

const bcfManager = new BCFManager(components, world);
bcfManager.init();
(window as any).bcfManager = bcfManager;

const idsChecker = new IDSChecker(components);
(window as any).idsChecker = idsChecker;

// Initialize FragmentsManager early
const fragments = components.get(OBC.FragmentsManager);
const worker = await OBC.FragmentsManager.getWorker();
fragments.init(worker);

const modelManager = new ModelManager();
const viewportController = new ViewportController();
const clippingModule = new ClippingModule();
const queryModule = new QueryModule();
const idsModule = new IdsModule();
const timeline4DModule = new Timeline4DModule();
const boq5DModule = new Boq5DModule();
const federationModule = new FederationModule();

// Initialize Global BIM Search Overlay
const globalSearchOverlay = GlobalSearchOverlay.getInstance();
(window as any).globalSearchOverlay = globalSearchOverlay;

// Initialize Section Planes Floating Mini-HUD
const sectionPlanesHUD = SectionPlanesHUD.getInstance();
(window as any).sectionPlanesHUD = sectionPlanesHUD;

(window as any).bimEngine = bimEngine;
(window as any).modelManager = modelManager;
(window as any).viewportController = viewportController;
(window as any).federationModule = federationModule;
(window as any).boq5DModule = boq5DModule;
(window as any).clippingModule = clippingModule;

// Setup Command Palette (Ctrl + K)
const commandPalette = new CommandPalette([
  { label: "Top 2D Orthographic View", action: () => {
      document.getElementById("btn-view-top")?.click();
    }
  },
  { label: "Reset 3D Isometric View", action: () => {
      document.getElementById("btn-view-iso")?.click();
    }
  },
  { label: "Bookmark Current Camera Viewpoint", action: () => {
      document.getElementById("btn-add-viewpoint")?.click();
    }
  },
  { label: "Export Bills of Quantities (BOQ CSV)", action: () => {
      document.getElementById("btn-export-boq-csv")?.click();
    }
  },
  { label: "Toggle Section Cut Mode", action: () => {
      document.getElementById("btn-section-cut")?.click();
    }
  },
  { label: "Manage Active Section Planes (Floating Mini-HUD)", action: () => {
      sectionPlanesHUD.show();
    }
  },
  { label: "Add Floor Plan Cut (+Y)", action: () => {
      clippingModule.createDefaultPlane("Y");
      sectionPlanesHUD.show();
    }
  },
  { label: "Add Lateral Section Cut (+X)", action: () => {
      clippingModule.createDefaultPlane("X");
      sectionPlanesHUD.show();
    }
  },
  { label: "Add Longitudinal Elevation Cut (+Z)", action: () => {
      clippingModule.createDefaultPlane("Z");
      sectionPlanesHUD.show();
    }
  },
  { label: "Clear All Section Planes", action: () => {
      clippingModule.deleteAllPlanes();
      sectionPlanesHUD.renderPlanesList([]);
    }
  },
  { label: "Run IDS Door Compliance Audit", action: () => {
      const spec = idsModule.createSampleDoorSpec();
      idsModule.runAudit(spec);
    } 
  },
  { label: "Start 4D Simulation Playback", action: () => timeline4DModule.startSimulation() },
  { label: "Stop 4D Simulation", action: () => timeline4DModule.stopSimulation() },
  { label: "Export 4K Architectural Snapshot (.png)", action: () => SnapshotModule.getInstance().captureTechnicalSnapshot() },
  { label: "Reset Model Visibility", action: () => queryModule.resetVisibility() },
  { label: "Exploded Disassembly View (50% Expansion)", action: () => {
      const slider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
      if (slider) { slider.value = "50"; slider.dispatchEvent(new Event("input")); }
    }
  },
  { label: "Exploded Disassembly View (100% Full Separation)", action: () => {
      const slider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
      if (slider) { slider.value = "100"; slider.dispatchEvent(new Event("input")); }
    }
  },
  { label: "Reset Exploded Disassembly (0% Assembled)", action: () => {
      const slider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
      if (slider) { slider.value = "0"; slider.dispatchEvent(new Event("input")); }
    }
  },
  { label: "Exploded View: Sort by Category Clusters", action: () => {
      const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
      if (select) { select.value = "category-cluster"; select.dispatchEvent(new Event("change")); }
    }
  },
  { label: "Exploded View: Asset & Equipment Matrix Mode (Tandem)", action: () => {
      const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
      if (select) { select.value = "asset-dense-cluster"; select.dispatchEvent(new Event("change")); }
    }
  },
  { label: "Exploded View: Sort by Storey Levels", action: () => {
      const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
      if (select) { select.value = "storey-cluster"; select.dispatchEvent(new Event("change")); }
    }
  },
  { label: "Exploded View: Radial Spatial Mode", action: () => {
      const select = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
      if (select) { select.value = "radial"; select.dispatchEvent(new Event("change")); }
    }
  },
  { label: "Save Current Configuration as Custom View (Bookmark)", action: () => {
      const name = prompt("Enter a name for this Custom View (stores camera, clustering, and visual settings):", `View #${CustomViewManager.getInstance().getAllViews().length + 1}`);
      if (name && name.trim()) {
        CustomViewManager.getInstance().saveCurrentView(name.trim());
      }
    }
  },
  { label: "Open Saved Custom Views Ribbon", action: () => {
      const menu = document.getElementById("menu-saved-views");
      if (menu) {
        customViewManager.renderRibbonDropdown();
        menu.classList.remove("hidden");
      }
    }
  },
  { label: "Toggle Help & Guide Modal", action: () => {
      if (typeof (window as any).toggleShortcutsModal === "function") {
        (window as any).toggleShortcutsModal();
      }
    }
  }
]);
(window as any).commandPalette = commandPalette;

world.onCameraChanged.add((camera) => {
  for (const [, model] of fragments.list) {
    model.useCamera(camera.three);
  }
  MinimapHUD.getInstance().update();
});

// Dynamic Metric Scale Ruler HUD calculation
function updateMetricScaleBar() {
  const scaleLabelEl = document.getElementById("scale-bar-label");
  const cam = world.camera?.three;
  if (!scaleLabelEl || !cam) return;
  try {
    const target = new THREE.Vector3();
    world.camera.controls.getTarget(target);
    const dist = cam.position.distanceTo(target);
    const fov = (cam as THREE.PerspectiveCamera).fov ?? 45;
    const fovRad = (fov * Math.PI) / 180;
    const visibleHeight = 2 * Math.tan(fovRad / 2) * Math.max(1, dist);
    const visibleWidth = visibleHeight * (window.innerWidth / Math.max(1, window.innerHeight));
    const metersPerPixel = visibleWidth / Math.max(1, window.innerWidth);
    const rulerMeters = Math.max(0.1, metersPerPixel * 80);
    scaleLabelEl.innerText = rulerMeters >= 10 ? `${Math.round(rulerMeters)} m` : `${rulerMeters.toFixed(1)} m`;
  } catch (e) {
    // fallback
  }
}

// Continuously update MinimapHUD, Scale Ruler, and 3D Pin Annotations on render loops
function animateHUD() {
  MinimapHUD.getInstance().update();
  AnnotationModule.getInstance().updateOverlayPositions();
  updateMetricScaleBar();
  requestAnimationFrame(animateHUD);
}
animateHUD();
if (world.renderer) {
  world.renderer.showLogo = false;
}

// Add Ground Reference Grid
const grids = components.get(OBC.Grids);
let simpleGrid: any;
try {
  simpleGrid = grids.create(world);
} catch (e) {
  simpleGrid = (grids as any).list?.values()?.next()?.value;
}
(window as any).viewer_grid = simpleGrid;

const grid = new THREE.GridHelper(120, 60, 0x64748b, 0x334155);
grid.position.y = -0.01;
world.scene.three.add(grid);

// Multi-Selection State Storage
let activeExpressId: number | null = null;
let activeModelId: string | null = null;
const multiSelectedElements: Record<string, Set<number>> = {};

function updateBreadcrumbs(storeyName: string = "Level 0", elementName: string = "Element", _modelId?: string, expressId?: number) {
  const storeyEl = document.getElementById("breadcrumb-storey");
  const elemEl = document.getElementById("breadcrumb-element");
  if (storeyEl) storeyEl.innerText = storeyName;
  if (elemEl) {
    if (expressId !== undefined && !elementName.includes(`#${expressId}`)) {
      elemEl.innerText = `${elementName} (#${expressId})`;
    } else {
      elemEl.innerText = elementName;
    }
  }
}

// Breadcrumb interactive clicks
document.getElementById("breadcrumb-project")?.addEventListener("click", () => {
  (window as any).showAllElements?.();
  updateBreadcrumbs("All Storeys", "Entire Model");
  showToast("Showing Complete Project Model", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1"/></svg>`);
});

document.getElementById("breadcrumb-storey")?.addEventListener("click", () => {
  const activeStorey = document.getElementById("breadcrumb-storey")?.innerText || "Level 0";
  showToast(`Storey Scope: ${activeStorey}`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M2 20h20M5 20V8l7-5 7 5v12"/></svg>`);
});

// Update single & multi-selection batch cards and floating HUD
function updateViewportSelectionBar(customTitle?: string) {
  const bar = document.getElementById("viewport-selection-bar");
  const titleEl = document.getElementById("selection-bar-title");
  const panelEscBtn = document.getElementById("btn-panel-clear-selection");

  let totalCount = 0;
  for (const mid in multiSelectedElements) {
    totalCount += multiSelectedElements[mid].size;
  }

  const activeSelection = highlighter?.selection?.["select"] || (highlighter?.selection as any)?.select;
  let hasHighlighterSelection = false;
  if (activeSelection) {
    for (const k in activeSelection) {
      if (activeSelection[k] && activeSelection[k].size > 0) {
        hasHighlighterSelection = true;
        if (totalCount === 0) totalCount += activeSelection[k].size;
      }
    }
  }

  if (totalCount > 0 || activeExpressId !== null || hasHighlighterSelection) {
    if (bar) bar.style.display = "flex";
    if (panelEscBtn) panelEscBtn.style.display = "inline-flex";
    if (titleEl) {
      if (customTitle) {
        titleEl.innerText = customTitle;
      } else if (totalCount > 1) {
        titleEl.innerText = `${totalCount} Elements Selected`;
      } else if (activeExpressId !== null) {
        const headerStatus = document.getElementById("header-status-text")?.innerText;
        titleEl.innerText = headerStatus && !headerStatus.includes("Ready") ? headerStatus : `Element #${activeExpressId} Selected`;
      } else {
        titleEl.innerText = "1 Element Selected";
      }
    }
  } else {
    if (bar) bar.style.display = "none";
    if (panelEscBtn) panelEscBtn.style.display = "none";
  }
}
(window as any).updateViewportSelectionBar = updateViewportSelectionBar;

function updateMultiSelectionBatchCard() {
  const card = document.getElementById("multi-selection-batch-card");
  const countEl = document.getElementById("batch-selected-count");
  const volEl = document.getElementById("batch-total-volume");
  const costEl = document.getElementById("batch-total-cost");
  if (!card || !countEl || !volEl || !costEl) return;

  let totalCount = 0;
  for (const mid in multiSelectedElements) {
    totalCount += multiSelectedElements[mid].size;
  }

  if (totalCount > 1) {
    card.style.display = "flex";
    countEl.innerText = String(totalCount);
    const estVol = (totalCount * 0.45).toFixed(2);
    const estCost = (totalCount * 125).toLocaleString();
    volEl.innerText = `${estVol} m³`;
    costEl.innerText = `$${estCost}`;
  } else {
    card.style.display = "none";
  }
  updateViewportSelectionBar();
}

// Global Clean Exit from All Active 3D Selections
async function clearAllSelections(notify: boolean = true) {
  for (const mid in multiSelectedElements) {
    multiSelectedElements[mid].clear();
  }
  activeExpressId = null;
  activeModelId = null;

  try {
    await highlighter.clear("select");
    await highlighter.clear("hover");
    SelectionManager.getInstance().clearSelection();
    SelectionManager.getInstance().toggleBoxSelectMode(false);
  } catch (e) {
    console.warn("Highlighter clear error:", e);
  }

  updateMultiSelectionBatchCard();
  updateViewportSelectionBar();
  resetPropertiesPanel();
  if (propertyEditor) {
    await propertyEditor.deselect();
  }
  updateBreadcrumbs("All Storeys", "No Element Selected");

  // Collapse properties panel on escape
  document.body.classList.add('right-sidebar-collapsed');

  const ctxMenu = document.getElementById("bim-context-menu");
  if (ctxMenu) ctxMenu.style.display = "none";
  const hoverBadge = document.getElementById("viewport-hover-badge");
  if (hoverBadge) hoverBadge.style.display = "none";

  if (notify) {
    showToast("Selection Cleared (Esc)", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`);
  }
}
(window as any).clearAllSelections = clearAllSelections;

document.getElementById("btn-batch-clear")?.addEventListener("click", () => {
  clearAllSelections();
});

document.getElementById("btn-panel-clear-selection")?.addEventListener("click", () => {
  clearAllSelections();
});

document.getElementById("btn-viewport-esc-selection")?.addEventListener("click", () => {
  clearAllSelections();
});

document.getElementById("btn-selection-hud-focus")?.addEventListener("click", () => {
  document.getElementById("btn-focus")?.click();
});

document.getElementById("btn-selection-hud-isolate")?.addEventListener("click", () => {
  document.getElementById("btn-isolate")?.click();
});

document.getElementById("btn-batch-isolate")?.addEventListener("click", () => {
  highlighter.highlightByID("select", multiSelectedElements, true, true);
  showToast("Isolated Selected Batch", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`);
});

document.getElementById("btn-batch-xray")?.addEventListener("click", () => {
  AnnotationModule.getInstance().toggleXRay();
  showToast("Toggled X-Ray for Batch", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4"/><circle cx="12" cy="12" r="3"/></svg>`);
});

// Fetch Ambient and Directional Lights from the scene setup for settings panel binding
let ambientLight: any = null;
let dirLight: any = null;

world.scene.three.traverse((child) => {
  if (child instanceof THREE.AmbientLight) {
    ambientLight = child;
  } else if (child instanceof THREE.DirectionalLight) {
    dirLight = child;
  }
});

// Configure default light intensities and shadow properties
if (ambientLight) ambientLight.intensity = 1.5;
if (dirLight) {
  dirLight.intensity = 1.5;
  dirLight.castShadow = false;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.camera.near = 0.5;
  dirLight.shadow.camera.far = 300;
  dirLight.shadow.camera.left = -60;
  dirLight.shadow.camera.right = 60;
  dirLight.shadow.camera.top = 60;
  dirLight.shadow.camera.bottom = -60;
  dirLight.shadow.bias = -0.0005;
  dirLight.shadow.normalBias = 0.02;
  world.scene.three.add(dirLight.target);
}
world.scene.shadowsEnabled = false;

world.renderer.update();
const sceneManager = SceneManager.getInstance();
sceneManager.initPostProcessing(world);


// --- BIM & GEOMETRY INGESTION SETUP ---
const ifcLoader = components.get(OBC.IfcLoader);

// --- CLIPPER (SECTION PLANES) SETUP ---
const clipper = components.get(OBC.Clipper);
clipper.enabled = false;
const clipping = clippingModule;

// Initialize Raycasters & Mouse helper for Clipper section plane picking & raycasting
const raycasters = components.get(OBC.Raycasters);
raycasters.get(world);

let mouse: any = null;
try {
  if (container) {
    mouse = new (OBC as any).Mouse(container);
  }
} catch (e) {
  console.warn("Mouse component fallback setup:", e);
}
(window as any).viewer_mouse = mouse;

// Add click/double-click listener for element picking and Shift+Click multi-selection
container.addEventListener("dblclick", async (e: MouseEvent) => {
  if (clipper.enabled) {
    try {
      clippingModule.createSectionPlane();
    } catch (err) {
      console.error("Clipper failed to create plane:", err);
    }
  } else {
    try {
      const caster = components.get(OBC.Raycasters).get(world);
      const result = (await caster.castRay()) as any;
      if (!result || !result.fragments) {
        if (!e.shiftKey) {
          await highlighter.clear("select");
          for (const k in multiSelectedElements) multiSelectedElements[k].clear();
          updateMultiSelectionBatchCard();
          resetPropertiesPanel();
          updateBreadcrumbs("All Storeys", "No Element Selected");
        }
        return;
      }

      const modelId = result.fragments.modelId;
      const localId = result.localId;

      if (e.shiftKey) {
        if (!multiSelectedElements[modelId]) multiSelectedElements[modelId] = new Set();
        if (multiSelectedElements[modelId].has(localId)) {
          multiSelectedElements[modelId].delete(localId);
        } else {
          multiSelectedElements[modelId].add(localId);
        }
        await highlighter.highlightByID("select", multiSelectedElements, true, false);
        updateMultiSelectionBatchCard();
        let count = 0;
        for (const m in multiSelectedElements) count += multiSelectedElements[m].size;
        updateBreadcrumbs("Active Selection", `${count} Elements Selected`);
      } else {
        for (const k in multiSelectedElements) multiSelectedElements[k].clear();
        multiSelectedElements[modelId] = new Set([localId]);
        updateMultiSelectionBatchCard();

        const modelIdMap = { [modelId]: new Set([localId]) };
        await highlighter.highlightByID("select", modelIdMap, true, false);

        const model = fragments.list.get(modelId);
        if (model) {
          await displayElementProperties(model, localId);
          const tag = resolveElementTag(localId);
          updateBreadcrumbs("Level 0", tag, modelId, localId);
          if (propertyEditor) {
            await propertyEditor.selectElement(model, localId);
          }
        }
      }
    } catch (err) {
      console.error("Raycaster element picking failed:", err);
    }
  }
});

// --- HIGHLIGHTER & SELECTION SETUP ---
const highlighter = components.get(OBF.Highlighter);
highlighter.setup({ world });
highlighter.enabled = true;

// Configure selection colors
highlighter.styles.set("select", {
  color: new THREE.Color("#00d2ff"), // Electric Blue
  opacity: 0.65,
  transparent: true,
  renderedFaces: true as any,
});
highlighter.styles.set("hover", {
  color: new THREE.Color("#00f5a0"), // Electric Green
  opacity: 0.45,
  transparent: true,
  renderedFaces: true as any,
});
highlighter.styles.set("timeline-planned", {
  color: new THREE.Color("#6b7280"), // Slate Gray
  opacity: 0.4,
  transparent: true,
  renderedFaces: true as any,
});
highlighter.styles.set("timeline-inprogress", {
  color: new THREE.Color("#f59e0b"), // Amber Orange
  opacity: 0.8,
  transparent: true,
  renderedFaces: true as any,
});
highlighter.styles.set("timeline-completed", {
  color: new THREE.Color("#10b981"), // Emerald Green
  opacity: 0.7,
  transparent: true,
  renderedFaces: true as any,
});

// --- ITEMS FINDER / SEMANTIC QUERIES ---
const finder = components.get(OBC.ItemsFinder);

// 1. Walls & Slabs Query
finder.create("Walls & Slabs", [{ categories: [/WALL/, /SLAB/] }]);

// 2. Masonry Walls Query
finder.create("Masonry Walls", [
  {
    categories: [/WALL/],
    attributes: { queries: [{ name: /Name/, value: /Masonry/ }] },
  },
]);

// 3. First Level Columns Query
const entryLevel: any = {
  categories: [/BUILDINGSTOREY/],
  attributes: { queries: [{ name: /Name/, value: /Entry/ }] },
};

finder.create("First Level Columns", [
  {
    categories: [/COLUMN/],
    relation: { name: "ContainedInStructure", query: entryLevel },
  },
]);

// Helper function to execute query
async function getQueryResults(name: string) {
  const finderQuery = finder.list.get(name);
  if (!finderQuery) return {};
  return await finderQuery.test();
}

// --- MEASUREMENTS SETUP ---
const measurements = components.get(OBF.LengthMeasurement);
measurements.world = world;

// --- CLASSIFIER SETUP ---
const classifier = components.get(OBC.Classifier);


// --- 4D/5D DIGITAL TWIN PERSISTENT DATABASE ---
interface TwinData {
  modelId: string;
  expressId: number;
  unitCost: number;
  quantity: number;
  calculatedCost: number;
  task: string;
  status: "Planned" | "In Progress" | "Completed";
  startDate: string;
  endDate: string;
  isCustomized?: boolean;
}

const twinDatabase: Record<string, TwinData> = {};
const globalElementStoreysMap: Record<string, string> = {};

// --- 4D CONSTRUCTION TIMELINE SIMULATION ENGINE STATE ---
let is4dMode = localStorage.getItem('bim-4d-mode') === 'true';
let timelineMinDate: Date | null = null;
let timelineMaxDate: Date | null = null;
let currentTimelineDate: Date | null = null;
let timelineTimer: number | null = null;
let timelineIsPlaying = false;
let timelineSpeed = 2; // Days per second

// Define sequencing helpers globally
function getStoreyIndex(storeyName: string): number {
  const name = storeyName.toUpperCase();
  if (name.includes("FOUNDATION") || name.includes("SUBSTRUCTURE") || name.includes("BASEMENT") || name.includes("GROUND")) return 0;
  if (name.includes("ENTRY") || name.includes("LEVEL 0") || name.includes("FLOOR 0")) return 1;
  if (name.includes("LEVEL 1") || name.includes("FLOOR 1") || name.includes("FIRST")) return 2;
  if (name.includes("LEVEL 2") || name.includes("FLOOR 2") || name.includes("SECOND")) return 3;
  if (name.includes("LEVEL 3") || name.includes("FLOOR 3") || name.includes("THIRD")) return 4;
  if (name.includes("ROOF") || name.includes("PENTHOUSE")) return 5;
  
  const match = name.match(/\d+/);
  if (match) {
    return parseInt(match[0], 10) + 1;
  }
  return 1; // Default
}

function getCategorySequence(ifcType: string): { startOffset: number, duration: number, task: string, unitCost: number } {
  const type = ifcType.toUpperCase();
  
  if (type.includes("SITE") || type.includes("FOOTING") || type.includes("PILE")) {
    return { startOffset: 0, duration: 8, task: "Site & Substructure Foundations", unitCost: 500 };
  }
  if (type.includes("SLAB")) {
    return { startOffset: 3, duration: 6, task: "Slab Concrete Pouring", unitCost: 450 };
  }
  if (type.includes("COLUMN") || type.includes("BEAM") || type.includes("MEMBER") || type.includes("PLATE")) {
    return { startOffset: 8, duration: 7, task: "Structural Framing", unitCost: 600 };
  }
  if (type.includes("WALL")) {
    return { startOffset: 14, duration: 8, task: "Wall Partitioning & Masonry", unitCost: 300 };
  }
  if (type.includes("STAIR") || type.includes("RAMP")) {
    return { startOffset: 15, duration: 6, task: "Vertical Core & Stairs", unitCost: 400 };
  }
  if (type.includes("RAILING")) {
    return { startOffset: 18, duration: 5, task: "Safety Railings & Handrails", unitCost: 180 };
  }
  if (type.includes("WINDOW") || type.includes("DOOR")) {
    return { startOffset: 20, duration: 5, task: "Exterior Glazing & Doors", unitCost: 350 };
  }
  if (type.includes("COVERING")) {
    return { startOffset: 24, duration: 7, task: "Wall & Ceiling Cladding", unitCost: 220 };
  }
  if (type.includes("PIPE") || type.includes("DUCT") || type.includes("CABLE") || type.includes("FLOW")) {
    return { startOffset: 22, duration: 8, task: "MEP Services & Rough-in", unitCost: 200 };
  }
  if (type.includes("ROOF")) {
    return { startOffset: 28, duration: 8, task: "Roofing & Waterproofing", unitCost: 550 };
  }
  return { startOffset: 26, duration: 10, task: "Interior Finishes & Fit-out", unitCost: 150 };
}

function loadDatabase() {
  try {
    const data = localStorage.getItem("bim_twin_db_v1");
    if (data) {
      Object.assign(twinDatabase, JSON.parse(data));
    }
  } catch (e) {
    console.error("Failed to load local database", e);
  }
}

function saveDatabase() {
  try {
    // Only serialize customized elements to prevent LocalStorage quota limits (5MB)
    const customizedDb: Record<string, TwinData> = {};
    for (const key in twinDatabase) {
      if (twinDatabase[key].isCustomized) {
        customizedDb[key] = twinDatabase[key];
      }
    }
    localStorage.setItem("bim_twin_db_v1", JSON.stringify(customizedDb));
  } catch (e) {
    console.error("Failed to save local database", e);
  }
}

// Load database from localStorage on startup
loadDatabase();

// --- INDEXEDDB OFFLINE CACHE STORAGE FOR FRAGMENTS ---
const DB_NAME = "BIMFragmentsCache";
const DB_VERSION = 1;
const STORE_NAME = "fragments";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as any).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => {
      resolve((event.target as any).result);
    };
    request.onerror = (event) => {
      reject((event.target as any).error);
    };
  });
}

async function getCachedFragment(key: string): Promise<Uint8Array | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("IndexedDB get cached fragment failed:", err);
    return null;
  }
}

async function setCachedFragment(key: string, buffer: Uint8Array): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(buffer, key);
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.warn("IndexedDB cache set failed:", err);
  }
}

async function clearFragmentCache(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      request.onsuccess = () => {
        resolve();
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error("IndexedDB cache clear failed:", err);
  }
}

// Get or generate mock twin data deterministically on the fly
function getOrGenerateTwinData(modelId: string, expressId: number, ifcType: string): TwinData {
  const dbKey = `${modelId}-${expressId}`;
  if (twinDatabase[dbKey]) {
    return twinDatabase[dbKey];
  }

  const storeyName = globalElementStoreysMap[dbKey] || "Entry Level";
  const storeyIndex = getStoreyIndex(storeyName);
  
  // 12 days construction cycle per floor with overlap
  const storeyOffset = storeyIndex * 12;
  const { startOffset, duration, task, unitCost } = getCategorySequence(ifcType);
  
  const projectStart = new Date("2026-06-18");
  const start = new Date(projectStart);
  start.setDate(start.getDate() + storeyOffset + startOffset);
  
  const end = new Date(projectStart);
  end.setDate(end.getDate() + storeyOffset + startOffset + duration);

  const startDate = start.toISOString().split("T")[0];
  const endDate = end.toISOString().split("T")[0];

  const rand = (expressId % 100) / 100;
  const quantity = Math.max(1, Math.floor(rand * 15 + 1));
  const calculatedCost = unitCost * quantity;

  // Initial status determined by start date relative to current real date
  let status: "Planned" | "In Progress" | "Completed" = "Planned";
  const currentMs = Date.now();
  if (currentMs > end.getTime()) {
    status = "Completed";
  } else if (currentMs >= start.getTime() && currentMs <= end.getTime()) {
    status = "In Progress";
  }

  return {
    modelId,
    expressId,
    unitCost,
    quantity,
    calculatedCost,
    task,
    status,
    startDate,
    endDate,
  };
}

// Pre-fill mock data for loaded elements based on their IFC type using standard construction sequencing
async function initializeModelTwinData(model: any) {
  const modelId = model.modelId || model.uuid || model.id || (model.object && model.object.uuid) || "default-model";
  let properties = model.properties || (model as any).getLocalProperties?.() || {};

  if (!properties || Object.keys(properties).length === 0) {
    try {
      const ids = await model.getItemsIds();
      if (ids && ids.length > 0) {
        properties = {};
        for (const id of ids) {
          properties[id] = {
            type: "IFCBUILDINGELEMENT",
            Name: { value: `Element #${id}` }
          };
        }
        model.properties = properties;
      }
    } catch (e) {
      console.warn("Failed to get element IDs:", e);
    }
  }

  // Pre-build a map of expressId -> storeyName from classifier Storeys classification
  const storeys = classifier.list.get("Storeys");
  if (storeys) {
    for (const [storeyName, groupData] of storeys) {
      const map = await groupData.get();
      for (const mId in map) {
        if (mId === modelId || fragments.list.get(mId) === model) {
          for (const id of map[mId]) {
            globalElementStoreysMap[`${mId}-${id}`] = storeyName;
          }
        }
      }
    }
  }

  const projectStartMs = new Date("2026-06-18").getTime();
  const MS_PER_DAY = 86400000;
  const currentMs = Date.now();

  // Date cache map to avoid repeated ISO string conversions
  const dateStringCache = new Map<number, string>();
  const getDateStr = (ms: number) => {
    let s = dateStringCache.get(ms);
    if (!s) {
      s = new Date(ms).toISOString().split("T")[0];
      dateStringCache.set(ms, s);
    }
    return s;
  };

  for (const expressIdStr in properties) {
    const expressId = Number(expressIdStr);
    if (isNaN(expressId)) continue;

    const elementProps = properties[expressId];
    if (!elementProps) continue;

    const dbKey = `${modelId}-${expressId}`;
    if (twinDatabase[dbKey]) continue; // Skip if already customized by user

    const ifcType = getIfcEntityName(elementProps.type).toUpperCase();
    const storeyName = globalElementStoreysMap[dbKey] || "Entry Level";
    const storeyIndex = getStoreyIndex(storeyName);
    
    // 12 days construction cycle per floor with overlap
    const storeyOffset = storeyIndex * 12;
    const { startOffset, duration, task, unitCost } = getCategorySequence(ifcType);
    
    const startMs = projectStartMs + (storeyOffset + startOffset) * MS_PER_DAY;
    const endMs = startMs + duration * MS_PER_DAY;

    const startDate = getDateStr(startMs);
    const endDate = getDateStr(endMs);

    const rand = (expressId % 100) / 100;
    const quantity = Math.max(1, Math.floor(rand * 15 + 1));

    // Initial status determined by start date relative to current real date
    let status: "Planned" | "In Progress" | "Completed" = "Planned";
    if (currentMs > endMs) {
      status = "Completed";
    } else if (currentMs >= startMs && currentMs <= endMs) {
      status = "In Progress";
    }

    twinDatabase[dbKey] = {
      modelId,
      expressId,
      unitCost,
      quantity,
      calculatedCost: unitCost * quantity,
      task,
      status,
      startDate,
      endDate
    };
  }

  saveDatabase();
  updateDashboardMetrics();
}

// Compute dashboard statistics and update HTML elements
function updateDashboardMetrics() {
  let totalCost = 0;
  let elementCount = 0;
  let completedCount = 0;
  let totalTasks = 0;

  const typeBreakdown: Record<string, { cost: number; count: number }> = {};

  for (const [, model] of fragments.list) {
    const anyModel = model as any;
    const modelId = anyModel.modelId || anyModel.uuid || anyModel.id || anyModel.object?.uuid || "default-model";
    const properties = anyModel.properties || anyModel.getLocalProperties?.() || {};

    for (const expressIdStr in properties) {
      const expressId = Number(expressIdStr);
      if (isNaN(expressId)) continue;

      const elementProps = properties[expressId];
      if (!elementProps) continue;

      const ifcType = getIfcEntityName(elementProps.type).toUpperCase();
      const twinData = getOrGenerateTwinData(modelId, expressId, ifcType);

      totalCost += twinData.calculatedCost;
      elementCount++;
      totalTasks++;

      if (twinData.status === "Completed") {
        completedCount++;
      }

      const rawType = getIfcEntityName(elementProps.type || "Other").replace("IFC", "");
      // Beautify IFC types (e.g. WALLSTANDARDCASE -> Wall Standard Case)
      const formattedType = rawType
        .toLowerCase()
        .replace(/_/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());

      if (!typeBreakdown[formattedType]) {
        typeBreakdown[formattedType] = { cost: 0, count: 0 };
      }
      typeBreakdown[formattedType].cost += twinData.calculatedCost;
      typeBreakdown[formattedType].count++;
    }
  }

  // Bind to UI elements (only if they exist — they're optional dashboard stats)
  const elTotalCost = document.getElementById("stat-total-cost");
  if (elTotalCost) elTotalCost.innerText = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalCost);

  const elCount = document.getElementById("stat-elements-count");
  if (elCount) elCount.innerText = String(elementCount);

  const elTotalLabel = document.getElementById("total-elements-label");
  if (elTotalLabel) elTotalLabel.innerText = String(elementCount);

  const progressPctVal = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const elPct = document.getElementById("stat-progress-pct");
  if (elPct) elPct.innerText = `${progressPctVal}%`;

  const elCompleted = document.getElementById("stat-completed-tasks");
  if (elCompleted) elCompleted.innerText = `${completedCount}/${totalTasks} Tasks`;

  const elBar = document.getElementById("stat-progress-bar");
  if (elBar) elBar.style.width = `${progressPctVal}%`;

  // Render Material allocation breakdown list
  const breakdownList = document.getElementById("breakdown-list");
  if (!breakdownList) return;
  breakdownList.innerHTML = "";

  if (elementCount === 0) {
    breakdownList.innerHTML = '<div class="empty-state">No model loaded.</div>';
    return;
  }

  for (const type in typeBreakdown) {
    const stat = typeBreakdown[type];
    const item = document.createElement("div");
    item.className = "list-item";

    let color = "var(--text-dim)";
    if (type.toUpperCase().includes("WALL")) color = "var(--primary)";
    else if (type.toUpperCase().includes("SLAB")) color = "var(--secondary)";
    else if (type.toUpperCase().includes("COLUMN") || type.toUpperCase().includes("BEAM")) color = "var(--warning)";
    item.style.borderLeftColor = color;

    item.innerHTML = `
      <div>
        <div class="list-item-name">${type}</div>
        <div style="font-size:0.65rem; color:var(--text-muted);">${stat.count} elements</div>
      </div>
      <div class="list-item-val" style="font-weight:600; color:var(--text-primary);">
        ${new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(stat.cost)}
      </div>
    `;
    breakdownList.appendChild(item);
  }
}


// --- PROPERTIES / SELECTED STATE LOGIC ---

const costUnit = document.getElementById("cost-unit-cost")! as HTMLInputElement;
const costQty = document.getElementById("cost-quantity")! as HTMLInputElement;
const costCalc = document.getElementById("cost-calculated-total")!;

const schedTask = document.getElementById("sched-task")! as HTMLInputElement;
const schedStatus = document.getElementById("sched-status")! as HTMLSelectElement;
const schedStart = document.getElementById("sched-start")! as HTMLInputElement;
const schedEnd = document.getElementById("sched-end")! as HTMLInputElement;

// Parse element property values (handles strings, numbers, or web-ifc property value objects)
function getPropValue(prop: any): string {
  if (prop === undefined || prop === null) return "";
  if (typeof prop === "string" || typeof prop === "number") return String(prop);
  if (prop.value !== undefined) {
    if (typeof prop.value === "object" && prop.value !== null) {
      return String(prop.value.value ?? "");
    }
    return String(prop.value);
  }
  return JSON.stringify(prop);
}

// Convert IFC type code (integer) to readable entity name
let ifcReverseMap: Record<number, string> | null = null;
function getIfcEntityName(type: any): string {
  if (type === undefined || type === null) return "";
  if (typeof type === "number") {
    if (!ifcReverseMap) {
      ifcReverseMap = {};
      for (const key in WEBIFC) {
        if (key.startsWith("IFC") && typeof (WEBIFC as any)[key] === "number") {
          ifcReverseMap[(WEBIFC as any)[key]] = key;
        }
      }
    }
    if (ifcReverseMap[type]) {
      return ifcReverseMap[type];
    }
    
    // Fallback if webIfc api is available (it might be under ifcLoader.webIfc)
    try {
      if (ifcLoader && (ifcLoader as any).webIfc) {
        const name = (ifcLoader as any).webIfc.GetNameFromTypeCode(type);
        if (name) return name;
      }
    } catch (e) {
      // fallback
    }
  }
  return String(type);
}

// Helper function to resolve IFC Property Sets (Psets) and Element Quantities for a given element ID
function resolveElementPropertySets(properties: any, elementId: number): Record<string, Record<string, string>> {
  const result: Record<string, Record<string, string>> = {};
  if (!properties) return result;
  
  const parsePset = (propSet: any, propDefId: number) => {
    if (!propSet) return;
    try {
      const psetName = getPropValue(propSet.Name) || `PropertySet_${propDefId}`;
      if (!result[psetName]) result[psetName] = {};
      
      if (propSet.HasProperties) {
        const hasProps = Array.isArray(propSet.HasProperties) ? propSet.HasProperties : [propSet.HasProperties];
        for (const propRef of hasProps) {
          try {
            const propId = Number(propRef.value ?? propRef);
            const prop = properties[propId];
            if (!prop) continue;
            const propName = getPropValue(prop.Name);
            const propValue = getPropValue(prop.NominalValue) || getPropValue(prop.Value);
            if (propName) result[psetName][propName] = propValue;
          } catch (e) {
            console.error("ERROR inside hasProps loop", "propRef:", propRef, e);
          }
        }
      }
      
      if (propSet.Quantities) {
        const quantities = Array.isArray(propSet.Quantities) ? propSet.Quantities : [propSet.Quantities];
        for (const qtyRef of quantities) {
          try {
            const qtyId = Number(qtyRef.value ?? qtyRef);
            const qty = properties[qtyId];
            if (!qty) continue;
            const qtyName = getPropValue(qty.Name);
            let qtyValue = "";
            for (const key in qty) {
              if (key.endsWith("Value")) {
                qtyValue = getPropValue(qty[key]);
                break;
              }
            }
            if (!qtyValue) qtyValue = getPropValue(qty.NominalValue) || getPropValue(qty.Value);
            if (qtyName) result[psetName][qtyName] = qtyValue;
          } catch (e) {
            console.error("ERROR inside quantities loop", "qtyRef:", qtyRef, e);
          }
        }
      }
    } catch (e) {
      console.error("ERROR in parsePset", e);
    }
  };

  try {
    const element = properties[elementId];
    if (element && element.HasPropertySets) {
      const psetRefs = Array.isArray(element.HasPropertySets) ? element.HasPropertySets : [element.HasPropertySets];
      for (const psetRef of psetRefs) {
        const psetId = Number(psetRef.value ?? psetRef);
        const propSet = properties[psetId];
        if (propSet) parsePset(propSet, psetId);
      }
    }

    for (const id in properties) {
      const rel = properties[id];
      if (!rel || rel.type !== "IFCRELDEFINESBYPROPERTIES") continue;
      const relatedObjects = rel.RelatedObjects;
      if (!relatedObjects) continue;
      let isRelated = isRelatedObject(relatedObjects, elementId);
      if (!isRelated) continue;
      const relPropDef = rel.RelatingPropertyDefinition;
      if (!relPropDef) continue;
      const propDefId = Number(relPropDef.value ?? relPropDef);
      const propSet = properties[propDefId];
      if (propSet) parsePset(propSet, propDefId);
    }
  } catch (e) {
    console.error("ERROR in resolveElementPropertySets main block", e);
  }

  return result;
}

// Helper function to append a row to the property table
function addPropertyRow(container: Element, label: string, value: string, extraClass: string = "") {
  const row = document.createElement("div");
  row.className = "prop-row";
  
  const labelSpan = document.createElement("span");
  labelSpan.className = "prop-label";
  labelSpan.innerText = label;
  
  const valSpan = document.createElement("span");
  valSpan.className = `prop-val ${extraClass}`;
  valSpan.title = value; // Show full value on hover
  valSpan.innerText = value;
  
  if (label === "Express ID") {
    valSpan.id = "prop-express-id";
  } else if (label === "IFC Entity") {
    valSpan.id = "prop-ifc-type";
  } else if (label === "Name") {
    valSpan.id = "prop-name";
  }
  
  row.appendChild(labelSpan);
  row.appendChild(valSpan);
  container.appendChild(row);
}

let propertyEditor: PropertyEditor | null = null;
const propsContainer = document.getElementById("properties-selected-state");
if (propsContainer) {
  const editorContainer = document.createElement("div");
  editorContainer.id = "properties-bui-container";
  propsContainer.appendChild(editorContainer);
  
  propertyEditor = new PropertyEditor(world, fragments);
  propertyEditor.init();
  initPropertyEditorUI(propertyEditor, editorContainer);
}

// Display element properties in the panel
async function displayElementProperties(model: any, expressId: number) {
  if (!model || expressId === null || expressId === undefined) return;

  activeModelId = model.modelId || model.uuid || model.id || (model.object && model.object.uuid) || "default-model";
  activeExpressId = expressId;

  // 1. Immediately toggle inspector panel state to selected
  const emptyStateEl = document.getElementById("properties-empty-state");
  if (emptyStateEl) emptyStateEl.style.display = "none";

  const selectedStateEl = document.getElementById("properties-selected-state");
  if (selectedStateEl) selectedStateEl.style.display = "flex";

  // Ensure Right Sidebar is visible and switched to the inspector tab
  document.body.classList.remove('right-sidebar-collapsed');
  if (typeof (window as any).switchSidebarTab === "function") {
    (window as any).switchSidebarTab("right-tab-bar", "inspector");
  }

  // 2. Fetch properties map from model
  let properties = model.properties || (model as any).getLocalProperties?.() || {};
  if (typeof (model as any).getAllProperties === "function" && Object.keys(properties).length === 0) {
    try {
      properties = (await (model as any).getAllProperties()) || {};
    } catch (e) {
      // ignore
    }
  }

  // 3. Resolve element specific attributes from all available sources
  let elementProps: any = properties[expressId];

  // Try direct model.getItemsData for Fragments models
  if (!elementProps && typeof model.getItemsData === "function") {
    try {
      const [itemData] = await model.getItemsData([expressId], {
        attributesDefault: true,
        relations: {
          IsDefinedBy: { attributes: true, relations: true },
          DefinesOccurrence: { attributes: true, relations: true },
        },
      });
      if (itemData) {
        elementProps = itemData;
      }
    } catch (e) {
      console.warn("model.getItemsData error in displayElementProperties:", e);
    }
  }

  // Try ModelInfoManager
  if (!elementProps && modelInfoManager) {
    try {
      elementProps = await modelInfoManager.getAttributes(expressId, undefined, activeModelId ?? undefined);
    } catch (e) {
      console.warn("modelInfoManager getAttributes error:", e);
    }
  }

  // Try Fragments Core Editor getElements
  if (!elementProps && fragments?.core?.editor) {
    try {
      const [el] = await fragments.core.editor.getElements(model.modelId, [expressId]);
      if (el) {
        elementProps = await el.getData();
      }
    } catch (e) {
      // fallback
    }
  }

  // If still not found, construct a valid elementProps object so the inspector never fails
  if (!elementProps) {
    elementProps = {
      expressId: expressId,
      localId: expressId,
    };
  }

  // 4. Resolve IFC GUID
  let guid = "";
  if (elementProps.GlobalId) {
    guid = getPropValue(elementProps.GlobalId);
  }
  if (!guid && typeof model.getGuidsByLocalIds === "function") {
    try {
      const guids = await model.getGuidsByLocalIds([expressId]);
      if (guids && guids.length > 0) {
        guid = guids[0];
      }
    } catch (e) {}
  }

  // 5. Resolve Storey / Level
  let storeyName = "";
  const storeysGroup = classifier.list.get("Storeys");
  if (storeysGroup) {
    for (const [sName, groupData] of storeysGroup) {
      const fragmentMap = (groupData as any).map || groupData;
      for (const fId in fragmentMap) {
        const ids = fragmentMap[fId];
        if (ids && (typeof ids.has === 'function' ? ids.has(expressId) : (Array.isArray(ids) ? ids.includes(expressId) : false))) {
          storeyName = sName;
          break;
        }
      }
      if (storeyName) break;
    }
  }
  if (!storeyName && (globalElementStoreysMap as any)?.[`${activeModelId}-${expressId}`]) {
    storeyName = (globalElementStoreysMap as any)[`${activeModelId}-${expressId}`];
  }

  // 6. Resolve type relation (IFCRELDEFINESBYTYPE) early for name & entity lookup
  let typeElementId: number | null = null;
  for (const id in properties) {
    const rel = properties[id];
    if (rel && rel.type === "IFCRELDEFINESBYTYPE") {
      const relatedObjects = rel.RelatedObjects;
      if (relatedObjects) {
        let isRelated = isRelatedObject(relatedObjects, expressId);
        if (isRelated && rel.RelatingType) {
          typeElementId = Number(rel.RelatingType.value ?? rel.RelatingType);
          break;
        }
      }
    }
  }

  const typeProps = typeElementId !== null ? properties[typeElementId] : null;

  // 7. Resolve Property Sets and RelDefinesByProperties
  const psets = resolveElementPropertySets(properties, expressId);

  // If elementProps has IsDefinedBy from getItemsData:
  if (elementProps && elementProps.IsDefinedBy) {
    const rawPsets = Array.isArray(elementProps.IsDefinedBy) ? elementProps.IsDefinedBy : [elementProps.IsDefinedBy];
    for (const pset of rawPsets) {
      if (!pset) continue;
      const psetName = getPropValue(pset.Name) || "PropertySet";
      if (!psets[psetName]) psets[psetName] = {};

      if (Array.isArray(pset.HasProperties)) {
        for (const prop of pset.HasProperties) {
          if (!prop) continue;
          const pName = getPropValue(prop.Name);
          const pVal = getPropValue(prop.NominalValue ?? prop.Value ?? prop);
          if (pName && pVal !== undefined && pVal !== "") {
            psets[psetName][pName] = pVal;
          }
        }
      } else {
        for (const k in pset) {
          if (k.startsWith("_") || k === "Name" || k === "type" || k === "expressId") continue;
          const pVal = getPropValue(pset[k]);
          if (pVal !== undefined && pVal !== "") {
            psets[psetName][k] = pVal;
          }
        }
      }
    }
  }

  // Merge Psets from ModelInfoManager if available
  if (modelInfoManager) {
    try {
      const rawPsets = await modelInfoManager.getItemPropertySets(expressId, activeModelId ?? undefined);
      if (rawPsets && rawPsets.length > 0) {
        const formattedPsets = modelInfoManager.formatItemPsets(rawPsets);
        for (const psetName in formattedPsets) {
          psets[psetName] = Object.assign(psets[psetName] || {}, formattedPsets[psetName]);
        }
      }
    } catch (e) {
      console.warn("Error resolving raw psets:", e);
    }
  }

  // 8. Resolve specific IFC Entity
  let entityName = elementProps.type ? getIfcEntityName(elementProps.type) : "";
  if (!entityName || entityName.includes("IFCBUILDINGELEMENT") || entityName === "IFCPROXY" || entityName === "IFCELEMENT") {
    // Check Classifier Categories group for exact expressId category assignment
    const categoriesGroup = classifier.list.get("Categories");
    if (categoriesGroup) {
      for (const [catName, groupData] of categoriesGroup) {
        let foundCat = false;
        const fragmentMap = (groupData as any).map || (groupData as any);
        for (const fragId in fragmentMap) {
          const ids = fragmentMap[fragId];
          if (ids) {
            const hasId = typeof ids.has === 'function' ? ids.has(expressId) : (Array.isArray(ids) ? ids.includes(expressId) : false);
            if (hasId) {
              entityName = catName.toUpperCase();
              foundCat = true;
              break;
            }
          }
        }
        if (foundCat) break;
      }
    }
  }

  if (!entityName || entityName.includes("IFCBUILDINGELEMENT") || entityName === "IFCPROXY" || entityName === "IFCELEMENT") {
    if (typeProps && typeProps.type) {
      entityName = getIfcEntityName(typeProps.type).replace("TYPE", "");
    } else if (elementProps.PredefinedType && getPropValue(elementProps.PredefinedType) !== "NOTDEFINED") {
      entityName = `IFC${getPropValue(elementProps.PredefinedType)}`;
    } else if (elementProps.ObjectType) {
      const objTypeStr = getPropValue(elementProps.ObjectType).toUpperCase().replace(/\s+/g, "_");
      entityName = objTypeStr.startsWith("IFC") ? objTypeStr : `IFC_${objTypeStr}`;
    } else {
      // Try to find a Family or Category from property sets
      for (const psetName in psets) {
        if (psets[psetName]["Family"]) {
          entityName = String(psets[psetName]["Family"]).toUpperCase().replace(/\s+/g, "_");
          break;
        } else if (psets[psetName]["Category"]) {
          entityName = String(psets[psetName]["Category"]).toUpperCase().replace(/\s+/g, "_");
          break;
        } else if (psets[psetName]["Reference"]) {
          entityName = String(psets[psetName]["Reference"]).toUpperCase().replace(/\s+/g, "_");
          break;
        }
      }
      if (!entityName || entityName === "IFCELEMENT" || entityName === "IFCBUILDINGELEMENT") {
        entityName = "IFC_BUILDING_COMPONENT";
      }
    }
  }

  // 9. Resolve specific element Name
  let rawName = elementProps.Name ? getPropValue(elementProps.Name) : "";
  if (!rawName || rawName === "Unnamed Element" || rawName.includes("IFCBUILDINGELEMENT")) {
    if (elementProps.ObjectType) rawName = getPropValue(elementProps.ObjectType);
    else if (typeProps && typeProps.Name) rawName = getPropValue(typeProps.Name);
    else if (elementProps.Tag) rawName = `Tag ${getPropValue(elementProps.Tag)}`;
  }

  if (!rawName || rawName === "Unnamed Element" || rawName.includes("IFCBUILDINGELEMENT") || rawName === `Element #${expressId}`) {
    for (const psetName in psets) {
      const pset = psets[psetName];
      if (pset["Name"] && pset["Name"] !== rawName) { rawName = pset["Name"]; break; }
      if (pset["Reference"]) { rawName = pset["Reference"]; break; }
      if (pset["Type"]) { rawName = pset["Type"]; break; }
    }
  }

  if (!rawName || rawName.includes("IFCBUILDINGELEMENT") || rawName === `Element #${expressId}`) {
    const cleanEntity = entityName.replace(/^IFC_?/, "").replace(/_/g, " ");
    rawName = storeyName ? `${cleanEntity} (${storeyName})` : `${cleanEntity} #${expressId}`;
  }

  const nameVal = rawName || `Element #${expressId}`;

  // 10. Update top header status badge with IFC name & type and static card fields
  const headerStatusText = document.getElementById("header-status-text");
  if (headerStatusText) {
    headerStatusText.innerText = `${entityName}: ${nameVal} (#${expressId})`;
  }

  const badgePropsIdEl = document.getElementById("badge-props-id");
  if (badgePropsIdEl) badgePropsIdEl.innerText = `#${expressId}`;

  // 11. Calculate and populate physical bounding dimensions
  try {
    const dimLengthEl = document.getElementById("prop-dim-length");
    const dimWidthEl = document.getElementById("prop-dim-width");
    const dimHeightEl = document.getElementById("prop-dim-height");
    const dimVolumeEl = document.getElementById("prop-dim-volume");

    let bbox = new THREE.Box3();
    let hasGeom = false;

    // 1. Try BoundingBoxer for exact fragment element mesh dimensions
    try {
      const boundingBoxer = components.get(OBC.BoundingBoxer);
      if (boundingBoxer) {
        boundingBoxer.list.clear();
        const mId = model.modelId || activeModelId || "default-model";
        await boundingBoxer.addFromModelIdMap({ [mId]: new Set([expressId]) });
        const box = boundingBoxer.get();
        if (box && !box.isEmpty()) {
          bbox.copy(box);
          hasGeom = true;
        }
        boundingBoxer.list.clear();
      }
    } catch (boxErr) {
      console.warn("Element BoundingBoxer computation fallback:", boxErr);
    }

    // 2. Fallback to model children mesh traversal if needed
    if (!hasGeom && model) {
      const rootObj = (model.object || model) as THREE.Object3D;
      if (rootObj && typeof rootObj.traverse === "function") {
        rootObj.traverse((child: any) => {
          if (child.isMesh && child.geometry) {
            child.geometry.computeBoundingBox();
            if (child.geometry.boundingBox) {
              const box = child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld);
              bbox.union(box);
              hasGeom = true;
            }
          }
        });
      }
    }

    if (hasGeom && !bbox.isEmpty()) {
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const l = Math.max(0.05, size.x).toFixed(2);
      const w = Math.max(0.05, size.z).toFixed(2);
      const h = Math.max(0.05, size.y).toFixed(2);
      const v = Math.max(0.01, size.x * size.y * size.z).toFixed(2);
      if (dimLengthEl) dimLengthEl.innerText = `${l} m`;
      if (dimWidthEl) dimWidthEl.innerText = `${w} m`;
      if (dimHeightEl) dimHeightEl.innerText = `${h} m`;
      if (dimVolumeEl) dimVolumeEl.innerText = `${v} m³`;
    } else {
      // Realistic default dimension estimates by IFC entity
      const upperEntity = (entityName || "").toUpperCase();
      let defL = "1.20 m", defW = "0.20 m", defH = "2.80 m", defV = "0.67 m³";
      if (upperEntity.includes("WALL") || upperEntity.includes("GLAZED") || upperEntity.includes("PLATE") || upperEntity.includes("CURTAIN")) {
        defL = "2.40 m"; defW = "0.15 m"; defH = "2.80 m"; defV = "1.01 m³";
      } else if (upperEntity.includes("DOOR")) {
        defL = "0.90 m"; defW = "0.10 m"; defH = "2.10 m"; defV = "0.19 m³";
      } else if (upperEntity.includes("WINDOW")) {
        defL = "1.20 m"; defW = "0.12 m"; defH = "1.40 m"; defV = "0.20 m³";
      } else if (upperEntity.includes("SLAB") || upperEntity.includes("FLOOR") || upperEntity.includes("ROOF")) {
        defL = "5.00 m"; defW = "4.00 m"; defH = "0.25 m"; defV = "5.00 m³";
      } else if (upperEntity.includes("COLUMN") || upperEntity.includes("BEAM")) {
        defL = "0.40 m"; defW = "0.40 m"; defH = "3.20 m"; defV = "0.51 m³";
      }
      if (dimLengthEl) dimLengthEl.innerText = defL;
      if (dimWidthEl) dimWidthEl.innerText = defW;
      if (dimHeightEl) dimHeightEl.innerText = defH;
      if (dimVolumeEl) dimVolumeEl.innerText = defV;
    }
  } catch (e) {
    console.warn("Bounding dimensions error:", e);
  }

  // 12. Render all properties dynamically
  const propExpressIdEl = document.getElementById("prop-express-id");
  if (propExpressIdEl) propExpressIdEl.innerText = `#${expressId}`;
  const propIfcTypeEl = document.getElementById("prop-ifc-type");
  if (propIfcTypeEl) propIfcTypeEl.innerText = entityName;
  const propNameEl = document.getElementById("prop-name");
  if (propNameEl) propNameEl.innerText = nameVal;

  const tableEl = document.getElementById("element-metadata-table") || document.querySelector(".properties-widget .property-table");
  if (tableEl) {
    tableEl.innerHTML = "";

    addPropertyRow(tableEl, "Express ID", String(expressId), "font-mono font-bold");
    addPropertyRow(tableEl, "IFC Entity", entityName, "color-green font-bold");
    addPropertyRow(tableEl, "Name", nameVal);

    if (guid) {
      addPropertyRow(tableEl, "Global ID (GUID)", guid, "font-mono");
    }
    if (storeyName) {
      addPropertyRow(tableEl, "Storey / Level", storeyName, "color-cyan");
    }

    for (const key in elementProps) {
      if (key === "type" || key === "expressId" || key === "Name" || key === "localId" || key === "_localId" || key === "GlobalId" || key.startsWith("Pset_") || key.startsWith("Qto_")) continue;
      
      const formattedLabel = key.replace(/([A-Z])/g, " $1").trim();
      const val = getPropValue(elementProps[key]);
      if (val !== undefined && val !== null && val !== "" && val !== "[]" && val !== "{}") {
        addPropertyRow(tableEl, formattedLabel, String(val));
      }
    }

    // Render Property Sets
    for (const psetName in psets) {
      const divider = document.createElement("div");
      divider.className = "prop-set-header";
      divider.style.cssText = "font-size: 0.65rem; font-weight: 700; color: var(--accent-300); margin: 0.5rem 0.25rem 0.2rem 0.25rem; text-transform: uppercase; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.15rem; display: flex; align-items: center; gap: 0.25rem;";
      divider.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> <span>${psetName}</span>`;
      tableEl.appendChild(divider);

      const psetProps = psets[psetName];
      for (const propName in psetProps) {
        addPropertyRow(tableEl, propName, String(psetProps[propName]));
      }
    }

    // If a type relation is found, append type details
    if (typeElementId !== null) {
      const typeProps = properties[typeElementId];
      if (typeProps) {
        const typeDivider = document.createElement("div");
        typeDivider.className = "prop-set-header";
        typeDivider.style.cssText = "font-size: 0.65rem; font-weight: 700; color: var(--color-purple); margin: 0.8rem 0.25rem 0.2rem 0.25rem; text-transform: uppercase; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.15rem; display: flex; align-items: center; gap: 0.25rem;";
        typeDivider.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> <span>Type: ${typeProps.Name?.value || typeProps.Name || "IFC Type"}</span>`;
        tableEl.appendChild(typeDivider);

        addPropertyRow(tableEl, "Type Express ID", String(typeElementId));
        if (typeProps.type) {
          const typeEntityName = getIfcEntityName(typeProps.type);
          addPropertyRow(tableEl, "Type Entity", typeEntityName, "color-green");
        }
        
        for (const key in typeProps) {
          if (key === "type" || key === "expressId" || key === "Name") continue;
          const formattedLabel = key.replace(/([A-Z])/g, " $1").trim();
          const val = getPropValue(typeProps[key]);
          if (val !== undefined && val !== null && val !== "" && val !== "[]" && val !== "{}") {
            addPropertyRow(tableEl, formattedLabel, String(val));
          }
        }
      }
    }

    // Extract real quantities and material numbers from standard Qto_* or custom property sets
    const qtoData = extractQuantityData(elementProps, psets);
    if (qtoData.materialNumber) {
      addPropertyRow(tableEl, "Material Number", qtoData.materialNumber, "color-purple font-bold");
    }
    if (qtoData.quantity > 0) {
      addPropertyRow(tableEl, `IFC Quantity (${qtoData.quantityType})`, `${qtoData.quantity} ${qtoData.unit}`, "color-green");
    }
  }

  // 13. Retrieve 4D/5D data from local twin database or generate mock
  const ifcType = String(elementProps.type ?? entityName ?? "").toUpperCase();
  const twinData = getOrGenerateTwinData(activeModelId || "default-model", expressId, ifcType);

  const qtoData = extractQuantityData(elementProps, psets);
  if (qtoData.quantity > 0 && !twinData.isCustomized) {
    twinData.quantity = qtoData.quantity;
    twinData.calculatedCost = twinData.unitCost * twinData.quantity;
  }

  // Populate 5D Cost inputs
  if (costUnit) costUnit.value = String(twinData.unitCost);
  if (costQty) costQty.value = String(twinData.quantity);
  if (costCalc) {
    costCalc.innerText = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
      twinData.calculatedCost
    );
  }

  // Populate 4D Schedule inputs
  if (schedTask) schedTask.value = twinData.task;
  if (schedStatus) schedStatus.value = twinData.status;
  if (schedStart) schedStart.value = twinData.startDate;
  if (schedEnd) schedEnd.value = twinData.endDate;

  // 14. Synchronize PropertyEditor BUI component
  if (propertyEditor) {
    try {
      await propertyEditor.selectElement(model, expressId);
    } catch (e) {
      console.warn("PropertyEditor selectElement fallback:", e);
    }
  }

  // 15. Update Floating Viewport Selection Bar, Breadcrumbs & Esc Buttons
  updateViewportSelectionBar(`${entityName}: ${nameVal} (#${expressId})`);
  updateBreadcrumbs(storeyName || "All Storeys", nameVal, activeModelId || undefined, expressId);
}
(window as any).displayElementProperties = displayElementProperties;

function resetPropertiesPanel() {
  activeModelId = null;
  activeExpressId = null;
  updateBreadcrumbs("All Storeys", "No Element Selected");
  const headerStatusText = document.getElementById("header-status-text");
  if (headerStatusText) {
    headerStatusText.innerText = "Ready • 3D Workspace";
  }
  const badgePropsIdEl = document.getElementById("badge-props-id");
  if (badgePropsIdEl) {
    badgePropsIdEl.innerText = "#--";
  }
  const emptyState = document.getElementById("properties-empty-state");
  if (emptyState) emptyState.style.display = "flex";

  const selectedState = document.getElementById("properties-selected-state");
  if (selectedState) selectedState.style.display = "none";

  const panelEscBtn = document.getElementById("btn-panel-clear-selection");
  if (panelEscBtn) panelEscBtn.style.display = "none";

  const viewportBar = document.getElementById("viewport-selection-bar");
  if (viewportBar) viewportBar.style.display = "none";

  if (propertyEditor) {
    propertyEditor.deselect();
  }
}

// ============================================================
// VIEWPORT INTERACTIVE HOVER HUD BADGE CONTROLLER
// ============================================================
const hoverBadgeEl = document.getElementById("viewport-hover-badge");
const hoverTypeEl = document.getElementById("hover-entity-type");
const hoverIdEl = document.getElementById("hover-express-id");
const hoverNameEl = document.getElementById("hover-entity-name");

let hoverDebounceTimer: number | null = null;
let lastHoveredLocalId: number | null = null;

if (container && hoverBadgeEl) {
  container.addEventListener("pointermove", (e: PointerEvent) => {
    // If dragging, or clipper is enabled, or context menu is open, hide hover tooltip
    const ctxMenuEl = document.getElementById("bim-context-menu");
    if (e.buttons > 0 || clipper.enabled || (ctxMenuEl && ctxMenuEl.style.display === "flex")) {
      hoverBadgeEl.style.display = "none";
      return;
    }

    // Keep badge near cursor with screen boundary safety
    const posX = Math.min(window.innerWidth - 300, e.clientX + 14);
    const posY = Math.min(window.innerHeight - 100, e.clientY + 14);
    hoverBadgeEl.style.left = `${posX}px`;
    hoverBadgeEl.style.top = `${posY}px`;

    if (hoverDebounceTimer) clearTimeout(hoverDebounceTimer);
    hoverDebounceTimer = window.setTimeout(async () => {
      try {
        if (fragments.list.size === 0) {
          hoverBadgeEl.style.display = "none";
          return;
        }
        const caster = components.get(OBC.Raycasters).get(world);
        const result = (await caster.castRay()) as any;
        if (!result || !result.fragments || result.localId === undefined) {
          hoverBadgeEl.style.display = "none";
          lastHoveredLocalId = null;
          return;
        }

        const modelId = result.fragments.modelId;
        const localId = result.localId;
        if (localId === lastHoveredLocalId && hoverBadgeEl.style.display === "flex") {
          return;
        }
        lastHoveredLocalId = localId;

        const model = fragments.list.get(modelId) as any;
        const properties = model ? (model.properties || model.getLocalProperties?.() || {}) : {};
        const elemProps = properties[localId] || {};

        let ifcType = getIfcEntityName(elemProps.type || "IFCBUILDINGELEMENT") || "IFC ELEMENT";
        let cleanEntityName = ifcType.replace(/^IFC_?/, "").replace(/_/g, " ");
        if (!cleanEntityName || cleanEntityName === "BUILDINGELEMENT" || cleanEntityName === "ELEMENT" || cleanEntityName === "PROXY") {
          const categoriesGroup = classifier.list.get("Categories");
          if (categoriesGroup) {
            for (const [catName, groupData] of categoriesGroup) {
              const fragmentMap = (groupData as any).map || (groupData as any);
              const ids = fragmentMap[result.fragments.id] || fragmentMap[modelId];
              if (ids && ((typeof ids.has === "function" && ids.has(localId)) || (Array.isArray(ids) && ids.includes(localId)))) {
                cleanEntityName = catName;
                break;
              }
            }
          }
        }
        if (!cleanEntityName || cleanEntityName === "BUILDINGELEMENT" || cleanEntityName === "ELEMENT" || cleanEntityName === "PROXY") {
          cleanEntityName = "Building Element";
        }

        let nameVal = elemProps.Name ? getPropValue(elemProps.Name) : "";

        if (!nameVal || nameVal === "Unnamed Element" || nameVal.startsWith("IFC") || nameVal === "IFCBUILDINGELEMENT") {
          if (elemProps.ObjectType) {
            nameVal = getPropValue(elemProps.ObjectType);
          } else if (elemProps.Tag) {
            nameVal = `Tag ${getPropValue(elemProps.Tag)}`;
          } else if (elemProps.LongName) {
            nameVal = getPropValue(elemProps.LongName);
          }
        }

        if (!nameVal || nameVal === "Unnamed Element" || nameVal === "IFCBUILDINGELEMENT") {
          try {
            const fetched = await modelInfoManager.getName(localId, modelId);
            if (fetched && fetched.trim()) {
              nameVal = fetched.trim();
            }
          } catch {
            // fallback
          }
        }

        if (!nameVal || nameVal === "Unnamed Element" || nameVal === "IFCBUILDINGELEMENT") {
          const twin = twinDatabase[`${modelId}-${localId}`];
          if (twin && twin.task) {
            nameVal = twin.task;
          } else {
            nameVal = `${cleanEntityName} #${localId}`;
          }
        }

        if (nameVal.length > 36) nameVal = nameVal.substring(0, 34) + "...";

        // Display element Name in the primary slot (in place of IFCBUILDINGELEMENT)
        if (hoverTypeEl) hoverTypeEl.textContent = nameVal;
        if (hoverIdEl) hoverIdEl.textContent = `#${localId}`;
        // Display clean IFC Entity/Category in the secondary slot
        if (hoverNameEl) hoverNameEl.textContent = `IFC ${cleanEntityName}`;

        hoverBadgeEl.style.display = "flex";
      } catch (err) {
        hoverBadgeEl.style.display = "none";
      }
    }, 50);
  });

  container.addEventListener("pointerleave", () => {
    hoverBadgeEl.style.display = "none";
    lastHoveredLocalId = null;
  });
}

// Wire BOQ CSV export button
const btnExportBoqCsv = document.getElementById("btn-export-boq-csv");
if (btnExportBoqCsv) {
  btnExportBoqCsv.addEventListener("click", () => {
    const items: BOQLineItem[] = [];
    for (const key in twinDatabase) {
      const data = twinDatabase[key];
      const [modelId, expressIdStr] = key.split("-");
      const expressId = Number(expressIdStr);
      items.push({
        expressId,
        modelId,
        category: data.task ? data.task.split(" ")[0] : "IFCELEMENT",
        elementName: `Element #${expressId}`,
        materialNumber: "",
        unit: "ea",
        quantity: data.quantity,
        unitCost: data.unitCost,
        totalCost: data.calculatedCost,
        propertySetName: "Pset_TwinData",
        quantityType: "Count",
      });
    }
    const summary = generateBOQSummary(items);
    exportBOQAsCSV(summary);
  });
}

// Wire IDS 4D/5D Data Readiness Validation button
const btnRunIdsAudit = document.getElementById("btn-run-ids-audit");
if (btnRunIdsAudit) {
  btnRunIdsAudit.addEventListener("click", async () => {
    if (fragments.list.size === 0) {
      alert("Please load an IFC or Frag model first to validate IDS 4D/5D data readiness.");
      return;
    }
    updateViewportHint("Running IDS 4D/5D Data Readiness Audit...");
    try {
      const result = await idsChecker.validateBimDataReadiness();
      if (result.passed) {
        alert(`✅ IDS Validation Passed!\n\nAll ${result.totalChecked} checked elements conform to standard 4D scheduling and 5D quantity takeoff specifications.`);
      } else {
        const issues = result.failingCategories.length > 0 ? `\n\nIdentified deficiencies:\n• ${result.failingCategories.join("\n• ")}` : "";
        alert(`⚠️ IDS Validation Complete:\n• Total Elements Evaluated: ${result.totalChecked}\n• Compliant: ${result.passCount}\n• Missing Parameters: ${result.failCount}${issues}\n\nYou can use the 5D Cost & 4D Task editor in Key 5 INSPECTOR to enrich non-compliant items.`);
      }
    } catch (err: any) {
      console.error("IDS Audit Error:", err);
      alert(`IDS Audit completed with notice: ${err?.message || "All loaded elements processed."}`);
    }
  });
}

// Wire 4D Schedule CSV Template Export & Import Listeners
const btnExport4dCsv = document.getElementById("btn-export-4d-csv");
if (btnExport4dCsv) {
  btnExport4dCsv.addEventListener("click", () => {
    const csvData = scheduleManager.exportScheduleTemplateCSV();
    const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `4D_Schedule_Template_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    updateViewportHint("4D Schedule CSV Template downloaded! Open in Excel to edit task dates.");
  });
}

const btnImport4dCsvInput = document.getElementById("btn-import-4d-csv-input") as HTMLInputElement | null;
if (btnImport4dCsvInput) {
  btnImport4dCsvInput.addEventListener("change", async (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      const file = target.files[0];
      const text = await file.text();
      const count = scheduleManager.importScheduleFromCSV(text);
      if (count > 0) {
        calculateTimelineBounds();
        if (currentTimelineDate) {
          await updateTimelineVisualState();
        }
        alert(`Imported ${count} custom 4D schedule tasks from CSV!\nTimeline and simulation playback updated.`);
        updateViewportHint(`Custom 4D Schedule CSV applied (${count} tasks updated)`);
      } else {
        alert("Could not parse valid 4D tasks from the CSV file. Please check column headers (TaskID, StartDate, EndDate).");
      }
      target.value = "";
    }
  });
}

// ============================================================
// 5D CUMULATIVE PROJECT COST CALCULATOR
// ============================================================
export function updateCumulative5DCost() {
  const grandTotalEl = document.getElementById("cost-project-grand-total");
  const countEl = document.getElementById("cost-project-elements-count");
  if (!grandTotalEl || !countEl) return;

  let grandTotal = 0;
  let elementCount = 0;
  const categoryMap = new Map<string, { cost: number; count: number }>();

  for (const [, model] of fragments.list) {
    const anyModel = model as any;
    const modelId = anyModel.modelId || anyModel.uuid || anyModel.id || anyModel.object?.uuid || "default-model";
    const properties = anyModel.properties || anyModel.getLocalProperties?.() || {};

    for (const expressIdStr in properties) {
      const expressId = Number(expressIdStr);
      if (isNaN(expressId)) continue;

      const elementProps = properties[expressId];
      if (!elementProps) continue;

      const ifcType = String(elementProps.type ?? "").toUpperCase();
      const twinData = getOrGenerateTwinData(modelId, expressId, ifcType);

      const cost = twinData.calculatedCost || 0;
      if (cost > 0) {
        grandTotal += cost;
        elementCount++;
      }

      const current = categoryMap.get(ifcType) || { cost: 0, count: 0 };
      current.cost += cost;
      current.count += 1;
      categoryMap.set(ifcType, current);
    }
  }

  grandTotalEl.textContent = formatCurrency(grandTotal);
  countEl.textContent = formatItemCount(elementCount);
  CostChartComponent.getInstance().renderCategoryCostBreakdown(categoryMap);
  CostChartComponent.getInstance().renderSCurveProgressChart();
}
(window as any).updateCumulative5DCost = updateCumulative5DCost;

// Wire real-time cost calculator logic
const updateCalculatedCost = () => {
  const unit = Number(costUnit.value) || 0;
  const qty = Number(costQty.value) || 0;
  const calculatedCost = unit * qty;

  costCalc.innerText = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(calculatedCost);

  if (activeModelId && activeExpressId !== null) {
    const dbKey = `${activeModelId}-${activeExpressId}`;
    const existing = twinDatabase[dbKey];
    if (existing) {
      existing.unitCost = unit;
      existing.quantity = qty;
      existing.calculatedCost = calculatedCost;
      existing.isCustomized = true;
    } else {
      twinDatabase[dbKey] = {
        modelId: activeModelId,
        expressId: activeExpressId,
        unitCost: unit,
        quantity: qty,
        calculatedCost,
        task: schedTask.value || "General Construction Works",
        status: (schedStatus.value as any) || "Planned",
        startDate: schedStart.value || "2026-07-01",
        endDate: schedEnd.value || "2026-07-05",
        isCustomized: true,
      };
    }
    updateCumulative5DCost();
  }
};

costUnit.addEventListener("input", updateCalculatedCost);
costQty.addEventListener("input", updateCalculatedCost);

// Save updated 4D/5D data back to the database
const saveBtn = document.getElementById("save-data-btn")!;
saveBtn.addEventListener("click", () => {
  if (!activeModelId || activeExpressId === null) return;

  const dbKey = `${activeModelId}-${activeExpressId}`;
  const unitCost = Number(costUnit.value) || 0;
  const quantity = Number(costQty.value) || 0;
  const task = schedTask.value || "General Construction Works";
  const status = schedStatus.value as any;
  const startDate = schedStart.value || "2026-07-01";
  const endDate = schedEnd.value || "2026-07-05";

  twinDatabase[dbKey] = {
    modelId: activeModelId,
    expressId: activeExpressId,
    unitCost,
    quantity,
    calculatedCost: unitCost * quantity,
    task,
    status,
    startDate,
    endDate,
    isCustomized: true,
  };

  saveDatabase();
  updateDashboardMetrics();
  // Refresh timeline at current scrub position — properly await the async call
  if (currentTimelineDate) {
    (async () => { await updateTimelineVisualState(); })();
  } else {
    calculateTimelineBounds();
  }

  // Show success animation inside the button
  const originalHtml = saveBtn.innerHTML;
  saveBtn.classList.add("success");
  saveBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
    Twin Data Synced!
  `;
  setTimeout(() => {
    saveBtn.classList.remove("success");
    saveBtn.innerHTML = originalHtml;
  }, 1500);
});

// --- BIM ASYNC INITIALIZATION ENGINE ---
let isIfcLoaderSetup = false;

const initBim = async () => {
  try {
    // 1. Initialize fragments list and workers asynchronously from local URL
    // Done synchronously above to allow early Classifier instantiation

    // 3. Register camera and list event listeners
    world.camera.controls.addEventListener("update", () => {
      fragments.core.update();
    });

    world.camera.controls.addEventListener("rest", async () => {
      if (world.scene && (world.scene as any).updateShadows) {
        await (world.scene as any).updateShadows();
      }
    });

    fragments.list.onItemSet.add(async ({ value: model }) => {
      model.useCamera(world.camera.three);
      const modelObj = (model.object || model) as THREE.Object3D;
      if (modelObj && !world.scene.three.children.includes(modelObj)) {
        world.scene.three.add(modelObj);
      }
      
      // Enable cast/receive shadows for all meshes in the model
      if (modelObj && typeof modelObj.traverse === "function") {
        modelObj.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
      }
      
      // Force shadowed scene to update shadows
      if (world.scene && (world.scene as any).updateShadows) {
        (world.scene as any).updateShadows();
      }

      // Reset explosion state for fresh model
      ExplosionModule.getInstance().reset();
      const expSlider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
      if (expSlider) expSlider.value = "0";
      const expVal = document.getElementById("val-explosion-factor");
      if (expVal) expVal.innerText = "0%";

      if (sceneManager.postproduction) {
        const postProcToggle = document.getElementById("settings-toggle-postproc") as HTMLInputElement | null;
        const isEnabled = postProcToggle ? postProcToggle.checked : false;
        try {
          sceneManager.postproduction.enabled = isEnabled;
        } catch (e) {
          console.warn("Postproduction base pass lazy initialization on model load:", e);
        }
        if (sceneManager.bluePenPass) {
          sceneManager.bluePenPass.uniforms.enabled.value = isEnabled ? 1.0 : 0.0;
        }
        if (sceneManager.postproduction.customEffects) {
          try {
            sceneManager.postproduction.customEffects.setNeedsUpdate();
          } catch (e) {
            // Ignore customEffects update error if base pass is not ready
          }
        }
      }

      // Fit camera to model bounding box so loaded model is immediately visible and centered
      try {
        const boundingBoxer = components.get(OBC.BoundingBoxer);
        if (boundingBoxer) {
          boundingBoxer.list.clear();
          boundingBoxer.addFromModels();
          const box = boundingBoxer.get();
          if (!box.isEmpty() && world.camera?.controls) {
            await (world.camera.controls as any).fitToBox(box, true);
          }
          boundingBoxer.list.clear();
        }
      } catch (err) {
        console.warn("Camera fitToBox fallback:", err);
      }

      if (typeof (window as any).syncQueryCategoryDropdown === "function") {
        (window as any).syncQueryCategoryDropdown((model as any)?.modelId);
      }

      fragments.core.update(true);
    });

    // 4. Register selection and highlighting listeners
    highlighter.events.select.onHighlight.add(async (selection) => {
      let firstExpressId: number | null = null;
      let selectedModel: any = null;

      for (const fragmentId in selection) {
        const expressIds = selection[fragmentId];
        for (const id of expressIds) {
          firstExpressId = id;
          break;
        }
        
        // Find matching model by fragment or expressId
        for (const [, model] of fragments.list) {
          const anyModel = model as any;
          if (
            (anyModel.fragments && anyModel.fragments.has && anyModel.fragments.has(fragmentId)) ||
            (anyModel.properties && firstExpressId !== null && anyModel.properties[firstExpressId]) ||
            (typeof anyModel.hasItem === "function" && firstExpressId !== null && anyModel.hasItem(firstExpressId))
          ) {
            selectedModel = anyModel;
            break;
          }
        }
        if (firstExpressId !== null) break;
      }

      if (!selectedModel && fragments.list.size > 0) {
        selectedModel = Array.from(fragments.list.values())[0];
      }

      // Sync SelectionManager state and update HUD
      SelectionManager.getInstance().syncFromSelectionMap(selection);

      if (firstExpressId !== null && selectedModel) {
        await displayElementProperties(selectedModel, firstExpressId);
        if (propertyEditor) {
          await propertyEditor.selectElement(selectedModel, firstExpressId);
        }
        // Show properties panel automatically and switch to Inspector tab
        document.body.classList.remove('right-sidebar-collapsed');
        if (typeof (window as any).switchSidebarTab === "function") {
          (window as any).switchSidebarTab("right-tab-bar", "inspector");
        }
        return;
      }

      resetPropertiesPanel();
      if (propertyEditor) {
        await propertyEditor.deselect();
      }
      // Auto-hide properties panel when selection clears
      document.body.classList.add('right-sidebar-collapsed');
    });

    highlighter.events.select.onClear.add(async () => {
      SelectionManager.getInstance().clearSelection();
      resetPropertiesPanel();
      if (propertyEditor) {
        await propertyEditor.deselect();
      }
      // Auto-hide properties panel when selection clears
      document.body.classList.add('right-sidebar-collapsed');
    });

    // Hide initial loader overlay once initialized
    const loadingOverlay = document.getElementById("loading-overlay");
    if (loadingOverlay) {
      loadingOverlay.classList.add("hidden");
    }

    // Force renderer to resize and update layout
    if (world.renderer) {
      world.renderer.resize();
    }
    window.dispatchEvent(new Event('resize'));

    // Initialize empty file list
    refreshFileList();

  } catch (err) {
    console.error("Failed to initialize BIM components:", err);
    const text = document.getElementById("loading-text")!;
    text.innerText = "Initialization Error";
    const subtitle = document.getElementById("loading-subtitle")!;
    subtitle.innerText = "Could not initialize WebAssembly or rendering environment.";
  }
};

// Start the initialization
initBim();

// --- DYNAMIC FILE LIST MANAGEMENT ---
function refreshFileList() {
  const fileListEl = document.getElementById("file-list")!;
  fileListEl.innerHTML = '';

  const headerStatusEl = document.getElementById("header-status-text");

  if (fragments.list.size === 0) {
    const empty = document.createElement('div');
    empty.className = 'file-list-empty';
    empty.id = 'file-list-empty';
    empty.textContent = 'No models loaded. Upload an IFC file or load a sample.';
    fileListEl.appendChild(empty);
    if (headerStatusEl) headerStatusEl.textContent = 'Ready • No Model Loaded';
    return;
  }

  let firstModelName = 'Active Model';
  let totalPropertiesCount = 0;

  for (const [modelId, model] of fragments.list) {
    const anyModel = model as any;
    const name = anyModel.modelId || anyModel.name || modelId;
    if (firstModelName === 'Active Model') firstModelName = name;
    if (anyModel.properties) {
      totalPropertiesCount += Object.keys(anyModel.properties).length;
    }
  }

  if (headerStatusEl) {
    const countStr = totalPropertiesCount > 0 ? ` • ${totalPropertiesCount.toLocaleString()} Elements` : '';
    headerStatusEl.textContent = `${firstModelName}${countStr}`;
  }

  const badgeFilesCount = document.getElementById("badge-files-count");
  if (badgeFilesCount) badgeFilesCount.textContent = String(fragments.list.size);

  const tickerModelName = document.getElementById("ticker-model-name");
  if (tickerModelName) tickerModelName.textContent = firstModelName.toUpperCase();

  const tickerCount = document.getElementById("ticker-elements-count");
  if (tickerCount) tickerCount.textContent = totalPropertiesCount > 0 ? totalPropertiesCount.toLocaleString() : "0";

  for (const [modelId, model] of fragments.list) {
    const item = document.createElement('div');
    item.className = 'file-item';
    item.setAttribute('data-model-id', modelId);

    const anyModel = model as any;
    const name = anyModel.modelId || anyModel.name || modelId;

    item.innerHTML = `
      <div class="file-info">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>${name}</span>
      </div>
      <div class="file-actions">
        <button class="btn-icon btn-visibility" title="Toggle Visibility">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        <button class="btn-icon btn-delete" title="Remove Model">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    `;

    // Visibility toggle
    let visible = true;
    const visBtn = item.querySelector('.btn-visibility')!;
    visBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      visible = !visible;
      try {
        const hider = components.get(OBC.Hider);
        const localIds = await model.getLocalIds();
        await hider.set(visible, { [modelId]: new Set(localIds) });
      } catch (err) {
        console.warn('Error toggling visibility:', err);
        // Fallback to standard visibility toggle
        const modelObj = (model.object || model) as THREE.Object3D;
        if (modelObj) modelObj.visible = visible;
      }
      visBtn.classList.toggle('active-icon', !visible);
      if (!visible) {
        (visBtn as HTMLElement).style.opacity = '0.4';
      } else {
        (visBtn as HTMLElement).style.opacity = '1';
      }
    });

    // Delete button
    const delBtn = item.querySelector('.btn-delete')!;
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      try {
        // Correctly dispose of the model using fragments core
        await fragments.core.disposeModel(modelId);
      } catch (err) {
        console.warn('Error removing model:', err);
        // Fallback
        const modelObj = (model.object || model) as THREE.Object3D;
        if (modelObj) world.scene.three.remove(modelObj);
        fragments.list.delete(modelId);
      }
      refreshFileList();
      updateClassificationUI();
      resetPropertiesPanel();
      calculateTimelineBounds();
      GlobalSearchOverlay.getInstance().buildIndex();
    });

    fileListEl.appendChild(item);
  }
  updateHeaderLabel();
}

// File search filter
const fileSearchInput = document.getElementById('file-search') as HTMLInputElement;
if (fileSearchInput) {
  fileSearchInput.addEventListener('input', () => {
    const filter = fileSearchInput.value.toLowerCase();
    const items = document.querySelectorAll('#file-list .file-item');
    items.forEach((item) => {
      const name = item.querySelector('.file-info span')?.textContent?.toLowerCase() || '';
      (item as HTMLElement).style.display = name.includes(filter) ? 'flex' : 'none';
    });
  });
}

// --- MODEL LOADING WRAPPER ---
async function loadModelData(name: string, buffer: Uint8Array) {
  const overlay = document.getElementById("loading-overlay")!;
  const text = document.getElementById("loading-text")!;
  const progress = document.getElementById("loading-progress")!;
  const subtitle = document.getElementById("loading-subtitle")!;

  overlay.classList.remove("hidden");
  text.innerText = "Processing 3D Geometry...";
  progress.innerText = "0%";
  subtitle.innerText = name.endsWith(".ifc")
    ? "Executing WASM parsers locally. Extracting geometry layers, components, and properties."
    : "Reading fragment package from array buffer.";

  let pct = 0;
  const interval = setInterval(() => {
    pct = Math.min(pct + Math.floor(Math.random() * 15 + 5), 95);
    progress.innerText = `${pct}%`;
  }, 150);

  try {
    let model: any = null;

    if (name.endsWith(".ifc")) {
      if (!isIfcLoaderSetup) {
        text.innerText = "Initializing local WASM engine...";
        await ifcLoader.setup({
          autoSetWasm: false,
          wasm: {
            path: import.meta.env.BASE_URL || "./",
            absolute: false
          }
        });
        isIfcLoaderSetup = true;
      }
      const cacheKey = `${name}-${buffer.length}`;
      text.innerText = "Checking offline cache...";
      
      let cachedBuffer: Uint8Array | null = null;
      try {
        cachedBuffer = await getCachedFragment(cacheKey);
      } catch (cacheErr) {
        console.warn("Error reading cache:", cacheErr);
      }

      if (cachedBuffer) {
        console.log(`Cache hit for ${name}. Loading pre-converted fragments.`);
        text.innerText = "Loading cached fragments...";
        subtitle.innerText = "Cache hit: Loading pre-converted fragment from IndexedDB (instant).";
        
        clearInterval(interval);
        progress.innerText = "100%";
        
        const fragData = cachedBuffer instanceof Uint8Array ? cachedBuffer : new Uint8Array(cachedBuffer as any);
        model = await fragments.core.load(fragData, { modelId: name } as any);
      } else {
        console.log(`Cache miss for ${name}. Converting IFC via WASM loader with complete attributes & relations...`);
        text.innerText = "Converting IFC to Fragments (All Attributes & Relations)...";
        model = await ifcLoader.load(buffer, true, name, {
          instanceCallback: (importer: any) => {
            if (typeof importer.addAllAttributes === "function") {
              importer.addAllAttributes();
            }
            if (typeof importer.addAllRelations === "function") {
              importer.addAllRelations();
            }
          }
        });
        
        // Cache the parsed model in background once loaded successfully
        if (model) {
          setTimeout(async () => {
            try {
              console.log(`Caching converted fragment for ${name} to IndexedDB...`);
              const fragBuffer = await model.getBuffer(false);
              await setCachedFragment(cacheKey, fragBuffer);
              console.log(`Successfully cached converted fragment for ${name}.`);
            } catch (cacheErr) {
              console.warn("Failed to cache model after load:", cacheErr);
            }
          }, 1000);
        }
      }
    } else {
      const fragData = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer as any);
      model = await fragments.core.load(fragData, { modelId: name } as any);
    }

    clearInterval(interval);
    progress.innerText = "100%";
    text.innerText = "Building Semantic Model database...";

    if (model) {
      (window as any).viewer_model = model;
      federationModule.registerModel(model, name);
      // Enable shadows if checked
      const shadowsToggleEl = document.getElementById("settings-toggle-shadows") as HTMLInputElement | null;
      const shadowsOn = shadowsToggleEl?.checked ?? false;
      const modelObj = (model.object || model) as THREE.Object3D;
      if (modelObj && typeof modelObj.traverse === "function") {
        modelObj.traverse((child: any) => {
          if (child.isMesh) {
            child.castShadow = shadowsOn;
            child.receiveShadow = shadowsOn;
          }
        });
      }

      // Run dynamic classifications
      console.log("CLASSIFIER: starting byCategory");
      try { await classifier.byCategory({ classificationName: "Categories" }); } catch(e) { console.warn("Categories class error:", e); }
      console.log("CLASSIFIER: byCategory done");
      console.log("CLASSIFIER: starting byIfcBuildingStorey");
      try { await classifier.byIfcBuildingStorey({ classificationName: "Storeys" }); } catch(e) { console.warn("Storeys class error:", e); }
      console.log("CLASSIFIER: byIfcBuildingStorey done");
      console.log("CLASSIFIER: starting byModel");
      try {
        await classifier.byModel({ classificationName: "Models" });
      } catch (e) {
        console.warn("Classifier byModel info:", e);
      }
      console.log("CLASSIFIER: byModel done");

      // Apply category-based theme colors to three.js mesh materials
      await applyCategoryColors();

      // Sync/generate local database twin properties using classifications
      await initializeModelTwinData(model);

      // Auto-populate 4D Schedule tasks for all elements and categories in loaded model
      const categoriesGroup = classifier.list.get("Categories");
      if (categoriesGroup) {
        const catMap = new Map<string, { modelId: string; elementIds: number[] }[]>();
        for (const [catName, groupData] of categoriesGroup) {
          const res = await groupData.get();
          const itemsArr: { modelId: string; elementIds: number[] }[] = [];
          for (const mId in res) {
            itemsArr.push({ modelId: mId, elementIds: Array.from(res[mId]) });
          }
          catMap.set(catName, itemsArr);
        }
        scheduleManager.generateFromCategories(catMap);
      }

      // Update 5D cumulative project budget now that twin data is populated
      if (typeof (window as any).updateCumulative5DCost === 'function') {
        (window as any).updateCumulative5DCost();
      }

      console.log("CLASSIFIER: starting updateClassificationUI");
      try { await updateClassificationUI(); } catch(e) { console.warn("updateClassificationUI error:", e); }
      console.log("CLASSIFIER: updateClassificationUI done");
      calculateTimelineBounds();

      // Force renderer to resize and update layout
      if (world.renderer) {
        world.renderer.resize();
      }
      window.dispatchEvent(new Event('resize'));

      // Sync 4D simulation state for newly loaded model
      if (typeof calculateTimelineBounds === 'function') {
        calculateTimelineBounds();
      }
      if (is4dMode && typeof (window as any).updateTimelineVisualState === 'function') {
        (window as any).updateTimelineVisualState();
      }

      // Fit camera controls box around loaded model
      setTimeout(async () => {
        try {
          const boundingBoxer = components.get(OBC.BoundingBoxer);
          if (boundingBoxer) {
            boundingBoxer.list.clear();
            boundingBoxer.addFromModels();
            const box = boundingBoxer.get();
            if (!box.isEmpty() && world.camera?.controls) {
              await (world.camera.controls as any).fitToBox(box, true);
            }
            boundingBoxer.list.clear();
          }
        } catch (err) {
          console.warn("Camera fitToBox skipped:", err);
        }
      }, 200);
    }

    // Dismiss loading overlay immediately so the 3D viewport is instantly interactive
    overlay.classList.add("hidden");
    (overlay as HTMLElement).style.display = "none";

    // Update dynamic file list and build search index non-blockingly
    refreshFileList();
    setTimeout(() => {
      GlobalSearchOverlay.getInstance().buildIndex().catch((e) => console.warn("Search index build error:", e));
    }, 50);

  } catch (err) {
    clearInterval(interval);
    console.error("Error loading model:", err);
    
    text.innerText = "Model Load Failed";
    progress.innerText = "Error";
    subtitle.innerText = `Detail: ${err instanceof Error ? err.message : String(err)}`;
    
    // Auto-hide error overlay after 6 seconds so user can try again
    setTimeout(() => {
      overlay.classList.add("hidden");
    }, 6000);
  }
}

// --- UI BUTTON & CONTROL EVENT LISTENERS ---

// File Inputs
const fileInput = document.getElementById("file-input")! as HTMLInputElement;
fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  await loadModelData(file.name, uint8Array);
  fileInput.value = ""; // Clear value
});

// Load Sample Model Button
async function loadSampleModel() {
  const url = "https://thatopen.github.io/engine_components/resources/frags/school_arq.frag";
  const loadSampleBtn = document.getElementById("load-sample-btn");
  try {
    if (loadSampleBtn) {
      loadSampleBtn.setAttribute("disabled", "true");
      loadSampleBtn.innerText = "Downloading...";
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    await loadModelData("school_arq.frag", uint8Array);
  } catch (err) {
    console.error("Failed to fetch sample file:", err);
  } finally {
    if (loadSampleBtn) {
      loadSampleBtn.removeAttribute("disabled");
      loadSampleBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>
        </svg>
        Load Sample
      `;
    }
  }
}
(window as any).loadSampleModel = loadSampleModel;

const loadSampleBtn = document.getElementById("load-sample-btn");
if (loadSampleBtn) {
  loadSampleBtn.addEventListener("click", loadSampleModel);
}


// Bottom Toolbar Actions: Visibility
const showAllBtn = document.getElementById("btn-show-all");
if (showAllBtn) {
  showAllBtn.addEventListener("click", async () => {
    const hider = components.get(OBC.Hider);
    await hider.set(true);
  });
}

const hideAllBtn = document.getElementById("btn-hide-all");
if (hideAllBtn) {
  hideAllBtn.addEventListener("click", async () => {
    const hider = components.get(OBC.Hider);
    await hider.set(false);
  });
}

import { exportFrag } from "./components/FragExporter";

const loadIfcBtn = document.getElementById("btn-load-ifc");
if (loadIfcBtn) {
  loadIfcBtn.addEventListener("click", () => {
    if (fileInput) {
      fileInput.accept = ".ifc";
      fileInput.click();
    }
  });
}

const exportFragBtn = document.getElementById("btn-export-frag");
if (exportFragBtn) {
  exportFragBtn.addEventListener("click", async () => {
    // We assume the first model in fragments is the current one
    const models = Array.from(fragments.list.values());
    if (models.length === 0) {
      alert("No model loaded to export.");
      return;
    }
    // Export the primary model
    const model = models[0];
    const firstId = Array.from(fragments.list.keys())[0];
    await exportFrag(model, firstId || "exported-model");
  });
}

const loadFragBtn = document.getElementById("btn-load-frag");
if (loadFragBtn) {
  loadFragBtn.addEventListener("click", () => {
    if (fileInput) {
      fileInput.accept = ".frag";
      fileInput.click();
    }
  });
}

// Bottom Toolbar Actions: Selection
const focusBtn = document.getElementById("btn-focus");
if (focusBtn) {
  focusBtn.addEventListener("click", async () => {
    const selectionMap = highlighter.selection["select"];
    let hasSelection = false;
    if (selectionMap) {
      for (const fragId in selectionMap) {
        if (selectionMap[fragId].size > 0) {
          hasSelection = true;
          break;
        }
      }
    }

    if (hasSelection) {
      try {
        const boundingBoxer = components.get(OBC.BoundingBoxer);
        boundingBoxer.list.clear();
        await boundingBoxer.addFromModelIdMap(selectionMap);
        const box = boundingBoxer.get();
        if (!box.isEmpty() && world.camera?.controls) {
          await (world.camera.controls as any).fitToBox(box, true);
        }
        boundingBoxer.list.clear();
      } catch (e) {
        console.warn("Zoom to selection failed:", e);
      }
    } else {
      // Zoom fit all models in scene
      if (fragments.list.size === 0) return;
      try {
        const boundingBoxer = components.get(OBC.BoundingBoxer);
        boundingBoxer.list.clear();
        boundingBoxer.addFromModels();
        const box = boundingBoxer.get();
        if (!box.isEmpty() && world.camera?.controls) {
          await (world.camera.controls as any).fitToBox(box, true);
        }
        boundingBoxer.list.clear();
      } catch (e) {
        console.error("Zoom fit all failed:", e);
      }
    }
  });
}

const hideSelectedBtn = document.getElementById("btn-hide-selected");
if (hideSelectedBtn) {
  hideSelectedBtn.addEventListener("click", async () => {
    const hider = components.get(OBC.Hider);
    const selection = highlighter.selection["select"];
    if (selection && Object.keys(selection).length > 0) {
      let hasItems = false;
      for (const id in selection) {
        if (selection[id].size > 0) hasItems = true;
      }
      if (hasItems) {
        await hider.set(false, selection);
        await highlighter.clear("select");
        resetPropertiesPanel();
      }
    }
  });
}

const isolateBtn = document.getElementById("btn-isolate");
if (isolateBtn) {
  isolateBtn.addEventListener("click", async () => {
    const hider = components.get(OBC.Hider);
    const selection = highlighter.selection["select"];
    if (selection && Object.keys(selection).length > 0) {
      let hasItems = false;
      for (const id in selection) {
        if (selection[id].size > 0) hasItems = true;
      }
      if (hasItems) {
        await hider.isolate(selection);
      }
    }
  });
}

const clearSelectionBtn = document.getElementById("btn-clear-selection");
if (clearSelectionBtn) {
  clearSelectionBtn.addEventListener("click", async () => {
    await clearAllSelections();
    // Auto-hide properties panel when selection clears
    document.body.classList.add('right-sidebar-collapsed');
  });
}

// Advanced Selection Suite Actions
const selectionMgr = SelectionManager.getInstance();

document.getElementById("btn-box-select")?.addEventListener("click", () => {
  selectionMgr.toggleBoxSelectMode();
});

document.getElementById("btn-select-all")?.addEventListener("click", async () => {
  await selectionMgr.selectAll();
});

document.getElementById("btn-invert-select")?.addEventListener("click", async () => {
  await selectionMgr.invertSelection();
});

document.getElementById("btn-selection-hud-category")?.addEventListener("click", async () => {
  await selectionMgr.selectSameCategory();
});

document.getElementById("btn-selection-hud-xray")?.addEventListener("click", () => {
  AnnotationModule.getInstance().toggleXRay();
  showToast("Toggled X-Ray Ghost View", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4"/></svg>`);
});

document.getElementById("btn-selection-hud-hide")?.addEventListener("click", () => {
  document.getElementById("btn-hide-selected")?.click();
});

document.getElementById("btn-selection-hud-inspect")?.addEventListener("click", () => {
  document.body.classList.remove('right-sidebar-collapsed');
  if (typeof (window as any).switchSidebarTab === "function") {
    (window as any).switchSidebarTab("right-tab-bar", "inspector");
  }
});

// Bottom Toolbar Actions: Sectioning
const clipperBtn = document.getElementById("btn-section-cut");
if (clipperBtn) {
  clipperBtn.addEventListener("click", async () => {
    const isNowActive = await clippingModule.toggleSectionCut();
    if (isNowActive || clippingModule.getAllPlanes().length > 0) {
      sectionPlanesHUD.show();
    } else {
      sectionPlanesHUD.hide();
    }
    updateViewportHint(
      isNowActive
        ? "Section Cut Active — Drag the 3D Gizmo handles in the viewport or use the Mini-HUD sliders to slice the model"
        : "Double-click any 3D element to inspect properties • Drag to Orbit view"
    );
  });
}

const clearClipsBtn = document.getElementById("btn-clear-sections");
if (clearClipsBtn) {
  clearClipsBtn.addEventListener("click", () => {
    clippingModule.deleteAllPlanes();
    sectionPlanesHUD.renderPlanesList([]);
    sectionPlanesHUD.hide();
    updateViewportHint("Section planes cleared • Double-click any 3D element to inspect properties");
  });
}

// --- INTUITIVE VIEWPORT HINT BAR MANAGER ---
function updateViewportHint(msg: string) {
  const hintText = document.getElementById("viewport-hint-text");
  const hintBar = document.getElementById("viewport-hint-bar");
  if (hintText) hintText.textContent = msg;
  if (hintBar) hintBar.classList.remove("hidden");
}

const hintDismissBtn = document.getElementById("btn-hint-dismiss");
if (hintDismissBtn) {
  hintDismissBtn.addEventListener("click", () => {
    document.getElementById("viewport-hint-bar")?.classList.add("hidden");
  });
}


// --- STRUCTURED AI PROMPT EXPORTER ---
const btnExportPrompt = document.getElementById("btn-export-prompt");
if (btnExportPrompt) {
  btnExportPrompt.addEventListener("click", () => {
    const expressId = document.getElementById("prop-express-id")?.textContent || "-";
    const ifcType = document.getElementById("prop-ifc-type")?.textContent || "-";
    const name = document.getElementById("prop-name")?.textContent || "-";
    const storey = document.getElementById("prop-storey")?.textContent || "-";
    const len = document.getElementById("prop-dim-length")?.textContent || "-";
    const width = document.getElementById("prop-dim-width")?.textContent || "-";
    const height = document.getElementById("prop-dim-height")?.textContent || "-";
    const volume = document.getElementById("prop-dim-volume")?.textContent || "-";

    const promptText = `### BIM ELEMENT CONTEXT & SPECIFICATION PROMPT
- **ExpressID**: ${expressId}
- **IFC Entity Type**: ${ifcType}
- **Element Name / Classification**: ${name}
- **Spatial Level / Storey**: ${storey}
- **Physical Dimensions**: Length (X): ${len} | Width (Z): ${width} | Height (Y): ${height}
- **Estimated Volume**: ${volume}
- **Application Context**: BIM KINTSUGI 4D/3D Digital Twin Platform

**Task**: Generate an engineering and material takeoff summary, construction sequencing recommendation, and structural compliance review for this building component.`;

    navigator.clipboard.writeText(promptText).then(() => {
      const origHTML = btnExportPrompt.innerHTML;
      btnExportPrompt.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Copied Prompt to Clipboard!</span>
      `;
      btnExportPrompt.classList.add("copied");
      setTimeout(() => {
        btnExportPrompt.innerHTML = origHTML;
        btnExportPrompt.classList.remove("copied");
      }, 2200);
      updateViewportHint("Structured AI Prompt copied to clipboard! Ready to paste into LLMs.");
    }).catch(err => {
      console.warn("Failed to copy prompt to clipboard:", err);
    });
  });
}

// Wire and render Items Finder queries dynamically based on model classification categories
async function updateItemFinderQueries() {
  const container = document.getElementById("finder-queries-list");
  if (!container) return;

  container.innerHTML = "";

  // 1. Add the 3 standard hardcoded queries
  const defaultQueries = [
    { name: "Walls & Slabs", desc: "Isolate all walls and slabs." },
    { name: "Masonry Walls", desc: "Walls with \"Masonry\" in their name." },
    { name: "First Level Columns", desc: "Columns in Entry level storey." }
  ];

  defaultQueries.forEach(q => {
    const item = document.createElement("div");
    item.className = "query-item";
    item.innerHTML = `
      <div class="query-info">
        <div class="query-name">${q.name}</div>
        <div class="query-desc">${q.desc}</div>
      </div>
      <div class="query-actions">
        <button class="btn-secondary btn-query-execute" data-query="${q.name}">Isolate</button>
      </div>
    `;
    container.appendChild(item);
  });

  // 2. Automatically generate queries from categories using ItemsFinder API
  try {
    if (fragments.list.size > 0) {
      await finder.addFromCategories();
    }
  } catch (e) {
    console.warn("ItemsFinder addFromCategories info:", e);
  }

  // Render queries registered in ItemsFinder list
  for (const [queryKey] of finder.list) {
    if (defaultQueries.some(dq => dq.name === queryKey)) continue;
    const cleanName = queryKey.replace(/^IFC/i, "");
    const item = document.createElement("div");
    item.className = "query-item";
    item.innerHTML = `
      <div class="query-info">
        <div class="query-name">${cleanName}</div>
        <div class="query-desc">Isolate all elements matching ${queryKey} using ItemsFinder.</div>
      </div>
      <div class="query-actions">
        <button class="btn-secondary btn-query-execute" data-query="${queryKey}">Isolate</button>
      </div>
    `;
    container.appendChild(item);
  }

  // 3. Fallback: Add dynamic categories from Classifier if not present
  const categoriesGroup = classifier.list.get("Categories");
  if (categoriesGroup && fragments.list.size > 0) {
    for (const [groupName] of categoriesGroup) {
      if (finder.list.has(groupName)) continue;
      const cleanName = groupName.replace(/^IFC/i, "");
      const item = document.createElement("div");
      item.className = "query-item";
      item.innerHTML = `
        <div class="query-info">
          <div class="query-name">${cleanName}</div>
          <div class="query-desc">Isolate all elements of category ${groupName}.</div>
        </div>
        <div class="query-actions">
          <button class="btn-secondary btn-query-execute" data-type="category" data-group-name="${groupName}">Isolate</button>
        </div>
      `;
      container.appendChild(item);
    }
  }

  const badgeFinderCount = document.getElementById("badge-finder-count");
  if (badgeFinderCount) {
    const totalQueries = container.querySelectorAll(".query-item").length;
    badgeFinderCount.textContent = String(totalQueries);
  }

  // 3. Wire event listeners for all buttons
  wireItemFinderButtons();
}

function wireItemFinderButtons() {
  document.querySelectorAll(".btn-query-execute").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const target = e.currentTarget as HTMLButtonElement;
      const hider = components.get(OBC.Hider);
      const currentText = target.textContent?.trim() || "";

      // If already isolated, show opposite action (Show All) to restore visibility
      if (currentText === "Show All") {
        target.disabled = true;
        target.textContent = "Restoring...";
        try {
          await hider.set(true);
          target.textContent = "Isolate";
        } catch (err) {
          console.error("Failed to restore visibility:", err);
          target.textContent = "Show All";
        } finally {
          target.disabled = false;
        }
        return;
      }

      target.disabled = true;
      target.textContent = "Finding...";

      try {
        let results: Record<string, Set<number>> = {};
        
        if (target.getAttribute("data-type") === "category") {
          const groupName = target.getAttribute("data-group-name");
          if (groupName) {
            const categoriesGroup = classifier.list.get("Categories");
            const groupData = categoriesGroup?.get(groupName);
            if (groupData) {
              results = await groupData.get();
            }
          }
        } else {
          const queryName = target.getAttribute("data-query");
          if (queryName) {
            results = await getQueryResults(queryName);
          }
        }

        if (results && Object.keys(results).length > 0) {
          // Reset all other query buttons back to "Isolate"
          document.querySelectorAll(".btn-query-execute").forEach((otherBtn) => {
            if (otherBtn !== target) {
              (otherBtn as HTMLButtonElement).textContent = "Isolate";
            }
          });

          await hider.isolate(results);
          target.textContent = "Show All";
        } else {
          alert(`No elements found matching query. Make sure a model is loaded.`);
          target.textContent = "Isolate";
        }
      } catch (err) {
        console.error("Query execution failed:", err);
        target.textContent = "Isolate";
      } finally {
        target.disabled = false;
      }
    });
  });
}

// Initial wire
updateItemFinderQueries();

// Sidebar Scene Controls bindings
const ambientSlider = document.getElementById("ambient-light-slider")! as HTMLInputElement;
const ambientValLabel = document.getElementById("val-ambient-light")!;
ambientSlider.addEventListener("input", () => {
  const val = Number(ambientSlider.value);
  ambientValLabel.innerText = val.toFixed(1);
  if (ambientLight) {
    ambientLight.intensity = val;
  }
});

const dirSlider = document.getElementById("dir-light-slider")! as HTMLInputElement;
const dirValLabel = document.getElementById("val-dir-light")!;
dirSlider.addEventListener("input", () => {
  const val = Number(dirSlider.value);
  dirValLabel.innerText = val.toFixed(1);
  if (dirLight) {
    dirLight.intensity = val;
  }
});



// Post-Processing Settings Event Bindings
const postProcToggle = document.getElementById("settings-toggle-postproc") as HTMLInputElement | null;
if (postProcToggle) {
  postProcToggle.addEventListener("change", () => {
    const enabled = postProcToggle.checked;
    if (sceneManager.postproduction) {
      sceneManager.postproduction.enabled = enabled;
    }
    if (sceneManager.bluePenPass) {
      sceneManager.bluePenPass.uniforms.enabled.value = enabled ? 1.0 : 0.0;
    }
    fragments.core.update(true);
  });
}

const postProcThickness = document.getElementById("settings-postproc-thickness") as HTMLInputElement | null;
const postProcThicknessVal = document.getElementById("val-postproc-thickness");
if (postProcThickness) {
  postProcThickness.addEventListener("input", () => {
    const val = Number(postProcThickness.value);
    if (postProcThicknessVal) postProcThicknessVal.innerText = val.toFixed(1);
    if (sceneManager.bluePenPass) {
      sceneManager.bluePenPass.uniforms.lineThickness.value = val;
    }
  });
}

const postProcJitter = document.getElementById("settings-postproc-jitter") as HTMLInputElement | null;
const postProcJitterVal = document.getElementById("val-postproc-jitter");
if (postProcJitter) {
  postProcJitter.addEventListener("input", () => {
    const val = Number(postProcJitter.value);
    if (postProcJitterVal) postProcJitterVal.innerText = val.toFixed(4);
    if (sceneManager.bluePenPass) {
      sceneManager.bluePenPass.uniforms.jitterAmount.value = val;
    }
  });
}

// Bloom Glow Slider
const postProcBloom = document.getElementById("settings-postproc-bloom") as HTMLInputElement | null;
const postProcBloomVal = document.getElementById("val-postproc-bloom");
if (postProcBloom) {
  postProcBloom.addEventListener("input", () => {
    const val = Number(postProcBloom.value);
    if (postProcBloomVal) postProcBloomVal.innerText = val.toFixed(2);
    if (sceneManager.bluePenPass) {
      sceneManager.bluePenPass.uniforms.bloomStrength.value = val;
    }
  });
}

// Radial Vignette Slider
const postProcVignette = document.getElementById("settings-postproc-vignette") as HTMLInputElement | null;
const postProcVignetteVal = document.getElementById("val-postproc-vignette");
if (postProcVignette) {
  postProcVignette.addEventListener("input", () => {
    const val = Number(postProcVignette.value);
    if (postProcVignetteVal) postProcVignetteVal.innerText = val.toFixed(2);
    if (sceneManager.bluePenPass) {
      sceneManager.bluePenPass.uniforms.vignetteIntensity.value = val;
    }
  });
}

// Chromatic Aberration Slider
const postProcChroma = document.getElementById("settings-postproc-chroma") as HTMLInputElement | null;
const postProcChromaVal = document.getElementById("val-postproc-chroma");
if (postProcChroma) {
  postProcChroma.addEventListener("input", () => {
    const val = Number(postProcChroma.value);
    if (postProcChromaVal) postProcChromaVal.innerText = val.toFixed(2);
    if (sceneManager.bluePenPass) {
      sceneManager.bluePenPass.uniforms.chromaticAberration.value = val;
    }
  });
}

// Toon Quantization Steps Slider
const postProcToon = document.getElementById("settings-postproc-toon") as HTMLInputElement | null;
const postProcToonVal = document.getElementById("val-postproc-toon");
if (postProcToon) {
  postProcToon.addEventListener("input", () => {
    const val = Number(postProcToon.value);
    if (postProcToonVal) postProcToonVal.innerText = val.toString();
    if (sceneManager.bluePenPass) {
      sceneManager.bluePenPass.uniforms.toonSteps.value = val;
    }
  });
}

// Shader FX Mode Selector
const postProcFxMode = document.getElementById("settings-postproc-fxmode") as HTMLSelectElement | null;
if (postProcFxMode) {
  postProcFxMode.addEventListener("change", () => {
    const val = Number(postProcFxMode.value);
    if (sceneManager.bluePenPass) {
      sceneManager.bluePenPass.uniforms.postMode.value = val;
    }
  });
}

const bgColorPicker = document.getElementById("settings-bg-color")! as HTMLInputElement;
bgColorPicker.addEventListener("input", () => {
  const color = bgColorPicker.value;
  document.body.style.backgroundColor = color;
  container.style.backgroundColor = color;
  if (world.scene.three.background) {
    (world.scene.three.background as THREE.Color).set(color);
  }
});

const gridToggle = document.getElementById("settings-toggle-grid")! as HTMLInputElement;
gridToggle.addEventListener("change", () => {
  grid.visible = gridToggle.checked;
});

const logoToggle = document.getElementById("settings-toggle-logo")! as HTMLInputElement;
const viewerLogoEl = document.getElementById("viewer-logo") as HTMLImageElement | null;
logoToggle.addEventListener("change", () => {
  try {
    if (world.renderer) {
      world.renderer.showLogo = logoToggle.checked;
    }
    if (viewerLogoEl) {
      viewerLogoEl.style.display = logoToggle.checked ? "block" : "none";
    }
  } catch (e) {
    console.error("Failed to toggle logo:", e);
  }
});

const shadowsToggle = document.getElementById("settings-toggle-shadows")! as HTMLInputElement;
shadowsToggle.addEventListener("change", () => {
  const enabled = shadowsToggle.checked;
  world.scene.shadowsEnabled = enabled;
  if (dirLight) {
    dirLight.castShadow = enabled;
  }
  for (const [, model] of fragments.list) {
    const modelObj = (model.object || model) as THREE.Object3D;
    if (modelObj && typeof modelObj.traverse === "function") {
      modelObj.traverse((child: any) => {
        if (child.isMesh) {
          child.castShadow = enabled;
          child.receiveShadow = enabled;
        }
      });
    }
  }
  fragments.core.update(true);
});

const clearCacheBtn = document.getElementById("btn-clear-cache")!;
clearCacheBtn.addEventListener("click", async () => {
  if (confirm("Are you sure you want to clear the offline fragments cache and reset the digital twin database? This will apply the new standard construction sequencing to all models.")) {
    await clearFragmentCache();
    localStorage.removeItem("bim_twin_db_v1");
    for (const key in twinDatabase) {
      delete twinDatabase[key];
    }
    alert("Offline cache and digital twin database reset successfully. Please reload the model to see the new sequence.");
  }
});

// Clear only localStorage (no fragment cache)
const clearStorageBtn = document.getElementById("btn-clear-storage");
clearStorageBtn?.addEventListener("click", () => {
  if (confirm("Clear all localStorage entries? This will remove saved twin data and settings.")) {
    localStorage.clear();
    alert("Local storage cleared. Reload the page to start fresh.");
  }
});

// Selection Color Customizer Event Listeners
const selectColorPicker = document.getElementById("settings-select-color")! as HTMLInputElement;
selectColorPicker.addEventListener("input", () => {
  const colorHex = selectColorPicker.value;
  const style = highlighter.styles.get("select");
  if (style) {
    style.color = new THREE.Color(colorHex);
  }
});

const hoverColorPicker = document.getElementById("settings-hover-color")! as HTMLInputElement;
hoverColorPicker.addEventListener("input", () => {
  const colorHex = hoverColorPicker.value;
  const style = highlighter.styles.get("hover");
  if (style) {
    style.color = new THREE.Color(colorHex);
  }
});

// Interactive 4D Simulation Status Color Pickers
const plannedColorPicker = document.getElementById("4d-color-planned") as HTMLInputElement | null;
if (plannedColorPicker) {
  plannedColorPicker.addEventListener("input", () => {
    ScheduleManager.statusColors['Planned'] = plannedColorPicker.value;
    if (currentTimelineDate) updateTimelineVisualState();
  });
}

const activeColorPicker = document.getElementById("4d-color-active") as HTMLInputElement | null;
if (activeColorPicker) {
  activeColorPicker.addEventListener("input", () => {
    ScheduleManager.statusColors['In Progress'] = activeColorPicker.value;
    if (currentTimelineDate) updateTimelineVisualState();
  });
}

const completeColorPicker = document.getElementById("4d-color-complete") as HTMLInputElement | null;
if (completeColorPicker) {
  completeColorPicker.addEventListener("input", () => {
    ScheduleManager.statusColors['Completed'] = completeColorPicker.value;
    if (currentTimelineDate) updateTimelineVisualState();
  });
}

const clearSelectionColorsBtn = document.getElementById("btn-clear-select-colors")!;
clearSelectionColorsBtn.addEventListener("click", async () => {
  await highlighter.clear("select");
  await highlighter.clear("hover");
  resetPropertiesPanel();
  showToast("Cleared Selection Highlight", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`);
});

// Custom Highlighter Manager UI Integration
const highlighterManager = HighlighterManager.getInstance();
const customStyleSelect = document.getElementById("select-custom-highlighter-style") as HTMLSelectElement | null;
const customStyleColorPicker = document.getElementById("picker-custom-highlighter-color") as HTMLInputElement | null;
const btnApplyCustomHighlight = document.getElementById("btn-apply-custom-highlight") as HTMLButtonElement | null;
const btnResetCustomHighlight = document.getElementById("btn-reset-custom-highlight") as HTMLButtonElement | null;
const btnClearAllHighlighters = document.getElementById("btn-clear-all-highlighters") as HTMLButtonElement | null;

if (customStyleSelect && customStyleColorPicker) {
  customStyleSelect.addEventListener("change", () => {
    const selectedStyleId = customStyleSelect.value;
    const style = highlighterManager.getStyle(selectedStyleId);
    if (style) {
      customStyleColorPicker.value = style.color;
    }
  });

  customStyleColorPicker.addEventListener("input", () => {
    const selectedStyleId = customStyleSelect.value;
    highlighterManager.updateStyleColor(selectedStyleId, customStyleColorPicker.value);
  });
}

if (btnApplyCustomHighlight && customStyleSelect) {
  btnApplyCustomHighlight.addEventListener("click", async () => {
    const styleId = customStyleSelect.value;
    const applied = await highlighterManager.applyCustomHighlight(styleId, false);
    if (applied) {
      showToast(`Applied ${styleId} Highlight (Deselect to view custom color)`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M2 12h20"/></svg>`);
    } else {
      showToast("No element selected to highlight", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`);
    }
  });
}

if (btnResetCustomHighlight && customStyleSelect) {
  btnResetCustomHighlight.addEventListener("click", async () => {
    const styleId = customStyleSelect.value;
    await highlighterManager.resetCustomHighlighter(styleId, true);
    showToast(`Reset ${styleId} Highlight for Selection`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>`);
  });
}

if (btnClearAllHighlighters) {
  btnClearAllHighlighters.addEventListener("click", async () => {
    await highlighterManager.clearAllCustomHighlights();
    showToast("Cleared All Custom Highlights", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`);
  });
}

// Quick Highlight Preset Buttons in Tools Tab
document.querySelectorAll(".btn-quick-highlight-preset").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const preset = btn.getAttribute("data-preset");
    if (!preset) return;
    const applied = await highlighterManager.applyCustomHighlight(preset, false);
    if (applied) {
      showToast(`Applied ${preset} Overlay (Deselect to view)`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M2 12h20"/></svg>`);
    } else {
      showToast("Select elements to highlight first", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`);
    }
  });
});

const btnQuickHighlightClear = document.getElementById("btn-quick-highlight-clear");
if (btnQuickHighlightClear) {
  btnQuickHighlightClear.addEventListener("click", async () => {
    await highlighterManager.clearAllCustomHighlights();
    showToast("Reset all custom highlights", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`);
  });
}

const btnHighlightApplyTool = document.getElementById("btn-highlight-apply-tool");
if (btnHighlightApplyTool && customStyleSelect) {
  btnHighlightApplyTool.addEventListener("click", async () => {
    const styleId = customStyleSelect.value || "Red";
    const applied = await highlighterManager.applyCustomHighlight(styleId, false);
    if (applied) {
      showToast(`Applied ${styleId} Overlay`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2v20M2 12h20"/></svg>`);
    } else {
      showToast("Select elements first", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`);
    }
  });
}

const btnHighlightClearTool = document.getElementById("btn-highlight-clear-tool");
if (btnHighlightClearTool) {
  btnHighlightClearTool.addEventListener("click", async () => {
    await highlighterManager.clearAllCustomHighlights();
    showToast("Cleared highlights", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`);
  });
}

// --- FRAGMENTS MODEL INFORMATION & DATA OPERATIONS WIRING ---
const modelInfoManager = ModelInfoManager.getInstance();

// 1. Log Attributes
const btnQueryLogAttrs = document.getElementById("btn-query-log-attrs");
if (btnQueryLogAttrs) {
  btnQueryLogAttrs.addEventListener("click", async () => {
    if (activeExpressId === null) {
      showToast("Select an element in viewport first", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`);
      return;
    }
    const attrs = await modelInfoManager.getAttributes(activeExpressId, undefined, activeModelId || undefined);
    console.log(`[Fragments] Attributes for Element #${activeExpressId}:`, attrs);
    showToast(`Logged Attributes for #${activeExpressId} to Console`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`);
  });
}

// 2. Log Property Sets (IsDefinedBy)
const btnQueryLogPsets = document.getElementById("btn-query-log-psets");
if (btnQueryLogPsets) {
  btnQueryLogPsets.addEventListener("click", async () => {
    if (activeExpressId === null) {
      showToast("Select an element in viewport first", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`);
      return;
    }
    const rawPsets = await modelInfoManager.getItemPropertySets(activeExpressId, activeModelId || undefined);
    const formatted = modelInfoManager.formatItemPsets(rawPsets);
    console.log(`[Fragments] Formatted Psets for Element #${activeExpressId}:`, formatted);
    console.log(`[Fragments] Raw IsDefinedBy relations:`, rawPsets);
    showToast(`Logged Property Sets for #${activeExpressId}`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`);
  });
}

// 3. Log Geometry (BufferAttributes)
const btnQueryLogGeom = document.getElementById("btn-query-log-geom");
if (btnQueryLogGeom) {
  btnQueryLogGeom.addEventListener("click", async () => {
    if (activeExpressId === null) {
      showToast("Select an element in viewport first", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`);
      return;
    }
    const geom = await modelInfoManager.getItemGeometry(activeExpressId, activeModelId || undefined);
    console.log(`[Fragments] BufferGeometry for Element #${activeExpressId}:`, geom);
    showToast(`Logged Geometry Collection for #${activeExpressId}`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`);
  });
}

// 4. Log Spatial Structure Hierarchy Tree
const btnQueryLogStructure = document.getElementById("btn-query-log-structure");
if (btnQueryLogStructure) {
  btnQueryLogStructure.addEventListener("click", async () => {
    const structure = await modelInfoManager.getSpatialStructure(activeModelId || undefined);
    console.log(`[Fragments] Full Model Spatial Structure Hierarchy:`, structure);
    showToast("Logged Full Spatial Structure Tree", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`);
  });
}

// 5. Category: Log Names & Operations
const selectQueryCategory = document.getElementById("select-query-category") as HTMLSelectElement | null;

async function syncQueryCategoryDropdown(modelId?: string) {
  if (!selectQueryCategory) return;
  const currentVal = selectQueryCategory.value;
  const standardCategories = [
    "IFCWALL", "IFCWALLSTANDARDCASE", "IFCSLAB", "IFCDOOR", "IFCWINDOW",
    "IFCCOLUMN", "IFCBEAM", "IFCROOF", "IFCBUILDINGELEMENTPROXY", "IFCSTAIR",
    "IFCRAILING", "IFCFURNISHINGELEMENT", "IFCFLOWTERMINAL", "IFCCOVERING",
    "IFCFOOTING", "IFCSPACE", "IFCMEMBER", "IFCPLATE"
  ];

  const catSet = new Set<string>(standardCategories);
  try {
    const loadedCategories = await modelInfoManager.getCategories(modelId);
    if (loadedCategories && loadedCategories.length > 0) {
      loadedCategories.forEach((cat) => {
        if (cat && typeof cat === "string") catSet.add(cat.trim().toUpperCase());
      });
    }
  } catch (err) {
    console.warn("syncQueryCategoryDropdown failed:", err);
  }

  const sortedCats = Array.from(catSet).sort();
  selectQueryCategory.innerHTML = sortedCats
    .map((cat) => `<option value="${cat}" ${cat === currentVal ? "selected" : ""}>${cat}</option>`)
    .join("");
}
(window as any).syncQueryCategoryDropdown = syncQueryCategoryDropdown;
syncQueryCategoryDropdown();

const btnCategoryLogNames = document.getElementById("btn-category-log-names");
if (btnCategoryLogNames && selectQueryCategory) {
  btnCategoryLogNames.addEventListener("click", async () => {
    const category = selectQueryCategory.value;
    const names = await modelInfoManager.getNamesFromCategory(category, true, activeModelId || undefined);
    console.log(`[Fragments] Unique Element Names in "${category}" (${names.length} items):`, names);
    showToast(`Logged ${names.length} elements in ${category}`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`);
  });
}

// 6. Category: Extract & Render Three.js Meshes
const btnCategoryExtractGeom = document.getElementById("btn-category-extract-geom");
if (btnCategoryExtractGeom && selectQueryCategory) {
  btnCategoryExtractGeom.addEventListener("click", async () => {
    const category = selectQueryCategory.value;
    showToast(`Extracting 3D geometry for ${category}...`);
    const { localIds, geometries } = await modelInfoManager.getGeometriesFromCategory(category, activeModelId || undefined);
    let createdCount = 0;
    for (const val of geometries) {
      if (Array.isArray(val)) {
        for (const meshData of val) {
          const mesh = modelInfoManager.createMeshFromData(meshData, "#a855f7");
          if (mesh) createdCount++;
        }
      }
    }

    // Hide original geometry elements so extracted meshes are prominent
    const fragments = components.get(OBC.FragmentsManager);
    for (const [, model] of fragments.list) {
      if (typeof (model as any).setVisible === "function") {
        await (model as any).setVisible(localIds, false);
      }
    }
    fragments.core.update(true);

    console.log(`[Fragments] Extracted & rendered ${createdCount} Three.js Meshes for ${category}:`, geometries);
    showToast(`Rendered ${createdCount} meshes in purple for ${category}`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 2 7 12 12 22 7 12 2"/></svg>`);
  });
}

// 7. Spatial: First Level Children
const btnSpatialFirstLevel = document.getElementById("btn-spatial-first-level");
if (btnSpatialFirstLevel) {
  btnSpatialFirstLevel.addEventListener("click", async () => {
    const children = await modelInfoManager.getFirstLevelChildren(activeModelId || undefined);
    console.log(`[Fragments] First Level (Storey) Children Elements:`, children);
    showToast(`Logged ${children ? children.length : 0} Storey Children to Console`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>`);
  });
}

// 8. Dispose Extracted Meshes
const btnDisposeExtractedMeshes = document.getElementById("btn-dispose-extracted-meshes");
if (btnDisposeExtractedMeshes) {
  btnDisposeExtractedMeshes.addEventListener("click", async () => {
    await modelInfoManager.disposeExtractedMeshes(activeModelId || undefined);
    showToast("Disposed extracted meshes & restored model", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`);
  });
}

// --- GAMEPLAY CAMERA PRESET VARIABLES & STATE ---
let activePreset: "Default" | "FPS" | "Sports" | "Racing" | "ThirdPerson" = "Default";

let gameDrawingSheetMesh: THREE.Group | null = null;
let gameCarMesh: THREE.Group | null = null;
let gameCharacterMesh: THREE.Group | null = null;

// Car movement state
const carPosition = new THREE.Vector3(0, 0.01, 0);
let carRotationY = 0;
let carSpeed = 0;
const CAR_MAX_SPEED = 0.5;
const CAR_ACCEL = 0.02;
const CAR_STEER_SPEED = 0.04;

// Character movement state
const charPosition = new THREE.Vector3(0, 0.01, 0);
let charRotationY = 0;

// Camera Shake variables
const fpsShakeOffset = new THREE.Vector3();
let fpsShakeTime = 0;

// Collision system state
let collisionMeshes: THREE.Mesh[] = [];
let baseSurfaceY = 0;
let fpsHeightOffset = 0;

function isGlass(object: THREE.Object3D): boolean {
  if (object instanceof THREE.Mesh) {
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const mat of materials) {
      if (mat) {
        if (mat.transparent && mat.opacity < 0.95) return true;
        if (mat.name && (
          mat.name.toLowerCase().includes("glass") || 
          mat.name.toLowerCase().includes("glazing") || 
          mat.name.toLowerCase().includes("translucent")
        )) {
          return true;
        }
      }
    }
  }
  return false;
}

function updateCollisionMeshes() {
  collisionMeshes = [];
  for (const [, model] of fragments.list) {
    const modelObj = (model.object || model) as THREE.Object3D;
    if (modelObj && typeof modelObj.traverse === "function") {
      modelObj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          collisionMeshes.push(child);
        }
      });
    }
  }
}


function createDrawingSheetMesh(): THREE.Group {
  const group = new THREE.Group();
  
  // A0 drawing sheet (thin blue rectangular box)
  const sheetGeo = new THREE.BoxGeometry(0.7, 0.5, 0.005);
  const sheetMat = new THREE.MeshStandardMaterial({ 
    color: 0x1e40af, // Blueprint blue
    roughness: 0.8,
    metalness: 0.1 
  });
  const sheet = new THREE.Mesh(sheetGeo, sheetMat);
  sheet.castShadow = true;
  sheet.receiveShadow = true;
  group.add(sheet);

  // Border (thin white rectangle overlay)
  const borderGeo = new THREE.BoxGeometry(0.66, 0.46, 0.006);
  const borderMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.15 });
  const border = new THREE.Mesh(borderGeo, borderMat);
  border.position.z = 0.001;
  group.add(border);

  // Mock blueprint lines (light blue lines)
  const lineMat = new THREE.MeshBasicMaterial({ color: 0x93c5fd });
  
  // Horizontal line
  const l1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.003, 0.006), lineMat);
  l1.position.set(-0.05, 0.1, 0.001);
  group.add(l1);

  // Vertical line
  const l2 = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.3, 0.006), lineMat);
  l2.position.set(-0.1, -0.05, 0.001);
  group.add(l2);

  // Mock building boxes
  const box1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.006), lineMat);
  box1.position.set(0.12, 0.05, 0.001);
  group.add(box1);

  // Title block
  const titleBlock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.006), lineMat);
  titleBlock.position.set(0.22, -0.17, 0.001);
  group.add(titleBlock);

  // Two hands holding the bottom corners
  const handMat = new THREE.MeshStandardMaterial({ 
    color: 0xe0ac69, // skin tone
    roughness: 0.6 
  });
  
  const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), handMat);
  leftHand.position.set(-0.35, -0.2, 0.03);
  leftHand.rotation.z = 0.2;
  group.add(leftHand);

  const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.08), handMat);
  rightHand.position.set(0.35, -0.2, 0.03);
  rightHand.rotation.z = -0.2;
  group.add(rightHand);

  return group;
}

function createCarMesh(): THREE.Group {
  const carGroup = new THREE.Group();
  
  // Car chassis body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 0.5, 3.2),
    new THREE.MeshStandardMaterial({ color: 0xe53e3e, metalness: 0.8, roughness: 0.2 })
  );
  body.position.y = 0.45;
  body.castShadow = true;
  body.receiveShadow = true;
  carGroup.add(body);
  
  // Cabin
  const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.5, 1.4),
    new THREE.MeshStandardMaterial({ color: 0x2d3748, transparent: true, opacity: 0.7, roughness: 0.1 })
  );
  cabin.position.set(0, 0.9, -0.2);
  cabin.castShadow = true;
  carGroup.add(cabin);

  // Wheels (4 cylinders)
  const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.8 });
  wheelGeo.rotateZ(Math.PI / 2);

  const wheelPositions = [
    [0.85, 0.4, 1.0],
    [-0.85, 0.4, 1.0],
    [0.85, 0.4, -1.0],
    [-0.85, 0.4, -1.0]
  ];

  for (const pos of wheelPositions) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(pos[0], pos[1], pos[2]);
    wheel.castShadow = true;
    carGroup.add(wheel);
  }

  // Headlights
  const lightGeo = new THREE.SphereGeometry(0.12, 8, 8);
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const l1 = new THREE.Mesh(lightGeo, lightMat); l1.position.set(0.6, 0.5, 1.6); carGroup.add(l1);
  const l2 = new THREE.Mesh(lightGeo, lightMat); l2.position.set(-0.6, 0.5, 1.6); carGroup.add(l2);

  return carGroup;
}

function createCharacterMesh(): THREE.Group {
  const charGroup = new THREE.Group();
  
  // Capsule body
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.9, 4, 8),
    new THREE.MeshStandardMaterial({ color: 0x3182ce, roughness: 0.4, metalness: 0.1 })
  );
  body.position.y = 0.8;
  body.castShadow = true;
  body.receiveShadow = true;
  charGroup.add(body);
  
  // Eyes
  const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
  
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat); leftEye.position.set(0.14, 1.0, 0.32); charGroup.add(leftEye);
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat); rightEye.position.set(-0.14, 1.0, 0.32); charGroup.add(rightEye);
  
  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), pupilMat); leftPupil.position.set(0.16, 1.0, 0.38); charGroup.add(leftPupil);
  const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), pupilMat); rightPupil.position.set(-0.12, 1.0, 0.38); charGroup.add(rightPupil);

  // Cute hat
  const hatGeo = new THREE.ConeGeometry(0.35, 0.4, 8);
  const hatMat = new THREE.MeshStandardMaterial({ color: 0xdd6b20, roughness: 0.6 });
  const hat = new THREE.Mesh(hatGeo, hatMat);
  hat.position.set(0, 1.45, 0);
  hat.castShadow = true;
  charGroup.add(hat);

  return charGroup;
}

// --- EVENT BINDINGS FOR CAMERA PRESETS ---
const gamePresetSelect = document.getElementById("settings-game-camera-preset") as HTMLSelectElement;
const fpsFovSlider = document.getElementById("settings-fps-fov") as HTMLInputElement;
const fpsFovVal = document.getElementById("val-fps-fov")!;
const fpsShakeToggle = document.getElementById("settings-fps-shake") as HTMLInputElement;
const fpsWeaponSelect = document.getElementById("settings-fps-weapon-style") as HTMLSelectElement;

const sportsHeightSlider = document.getElementById("settings-sports-height") as HTMLInputElement;
const sportsHeightVal = document.getElementById("val-sports-height")!;
const sportsZoomSlider = document.getElementById("settings-sports-zoom") as HTMLInputElement;
const sportsZoomVal = document.getElementById("val-sports-zoom")!;

const racingAttachmentSelect = document.getElementById("settings-racing-attachment") as HTMLSelectElement;
const racingFovSlider = document.getElementById("settings-racing-fov") as HTMLInputElement;
const racingFovVal = document.getElementById("val-racing-fov")!;

const tpDistanceSlider = document.getElementById("settings-thirdperson-distance") as HTMLInputElement;
const tpDistanceVal = document.getElementById("val-thirdperson-distance")!;
const tpAutoFollowToggle = document.getElementById("settings-thirdperson-autofollow") as HTMLInputElement;

const presetSubpanels = {
  FPS: document.getElementById("preset-options-fps")!,
  Sports: document.getElementById("preset-options-sports")!,
  Racing: document.getElementById("preset-options-racing")!,
  ThirdPerson: document.getElementById("preset-options-thirdperson")!,
};

function updatePresetSubpanels(activeMode: string) {
  for (const key in presetSubpanels) {
    const el = presetSubpanels[key as keyof typeof presetSubpanels];
    if (el) {
      el.style.display = key === activeMode ? "flex" : "none";
    }
  }
}

function exitActivePreset() {
  if (gameDrawingSheetMesh && gameDrawingSheetMesh.parent) {
    gameDrawingSheetMesh.parent.remove(gameDrawingSheetMesh);
  }
  if (gameCarMesh && gameCarMesh.parent) {
    gameCarMesh.parent.remove(gameCarMesh);
  }
  if (gameCharacterMesh && gameCharacterMesh.parent) {
    gameCharacterMesh.parent.remove(gameCharacterMesh);
  }

  // Restore camera defaults
  world.camera.set("Orbit");
  world.camera.projection.set("Perspective");
  if (world.camera.three instanceof THREE.PerspectiveCamera) {
    world.camera.three.near = 1.0; // Restore default near clipping plane
    world.camera.three.fov = 60;
    world.camera.three.updateProjectionMatrix();
  }
  fpsHeightOffset = 0; // Reset height offset
  firstPersonKeys.forward = false;
  firstPersonKeys.backward = false;
  firstPersonKeys.left = false;
  firstPersonKeys.right = false;
  firstPersonKeys.up = false;
  firstPersonKeys.down = false;
  const settingsCameraMode = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
  if (settingsCameraMode) {
    settingsCameraMode.value = "Orbit";
    settingsCameraMode.disabled = false;
  }
  const settingsCameraProjection = document.getElementById("settings-camera-projection") as HTMLSelectElement | null;
  if (settingsCameraProjection) {
    settingsCameraProjection.value = "Perspective";
  }
}

gamePresetSelect.addEventListener("change", () => {
  exitActivePreset();
  activePreset = gamePresetSelect.value as any;
  updatePresetSubpanels(activePreset);

  if (activePreset === "Default") {
    return;
  }

  const settingsCameraMode = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
  if (settingsCameraMode) settingsCameraMode.disabled = true;

  if (activePreset === "FPS") {
    world.camera.set("FirstPerson");
    if (settingsCameraMode) settingsCameraMode.value = "FirstPerson";
    
    // Ensure camera is added to the scene so attached children (the weapon mesh) render
    if (!world.camera.three.parent) {
      world.scene.three.add(world.camera.three);
    }
    
    if (!gameDrawingSheetMesh) gameDrawingSheetMesh = createDrawingSheetMesh();
    world.camera.three.add(gameDrawingSheetMesh);
    
    // Scan scene for collision meshes
    updateCollisionMeshes();

    // Adjust height of the camera to ground/base eye level of a 5'8" (1.727m) person
    baseSurfaceY = 0;
    const box = new THREE.Box3();
    let hasModel = false;
    for (const [, model] of fragments.list) {
      const modelObj = (model.object || model) as THREE.Object3D;
      if (modelObj) {
        box.expandByObject(modelObj);
        hasModel = true;
      }
    }
    if (hasModel) {
      baseSurfaceY = box.min.y;
    }

    const personHeight = 1.727; // 5'8" in meters
    const eyeHeight = personHeight - 0.1; // Eye level approx 10cm below top of head (~1.627m)
    const targetY = baseSurfaceY + eyeHeight;

    const currentPosition = new THREE.Vector3();
    world.camera.controls.getPosition(currentPosition);
    
    const forwardDirection = new THREE.Vector3();
    world.camera.three.getWorldDirection(forwardDirection);
    forwardDirection.y = 0;
    forwardDirection.normalize();
    
    const newEyePos = new THREE.Vector3(currentPosition.x, targetY, currentPosition.z);
    const newTargetPos = newEyePos.clone().add(forwardDirection);
    
    world.camera.controls.setLookAt(
      newEyePos.x, newEyePos.y, newEyePos.z,
      newTargetPos.x, newTargetPos.y, newTargetPos.z,
      false
    );
    
    // Apply initial FOV and near clipping plane
    if (world.camera.three instanceof THREE.PerspectiveCamera) {
      world.camera.three.near = 0.1; // Allow close rendering of the weapon
      world.camera.three.fov = Number(fpsFovSlider.value);
      world.camera.three.updateProjectionMatrix();
    }
  } else if (activePreset === "Sports") {
    world.camera.set("Orbit");
    const cameraModeEl = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
    if (cameraModeEl) cameraModeEl.value = "Orbit";
    world.camera.projection.set("Perspective");
    const cameraProjEl = document.getElementById("settings-camera-projection") as HTMLSelectElement | null;
    if (cameraProjEl) cameraProjEl.value = "Perspective";
  } else if (activePreset === "Racing") {
    world.camera.set("Orbit");
    const cameraModeEl = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
    if (cameraModeEl) cameraModeEl.value = "Orbit";
    world.camera.projection.set("Perspective");
    const cameraProjEl = document.getElementById("settings-camera-projection") as HTMLSelectElement | null;
    if (cameraProjEl) cameraProjEl.value = "Perspective";
    if (!gameCarMesh) gameCarMesh = createCarMesh();
    world.scene.three.add(gameCarMesh);
    carPosition.set(0, 0.01, 0);
    carRotationY = 0;
    carSpeed = 0;
    gameCarMesh.position.copy(carPosition);
    gameCarMesh.rotation.y = carRotationY;
    
    // Apply initial FOV
    if (world.camera.three instanceof THREE.PerspectiveCamera) {
      world.camera.three.fov = Number(racingFovSlider.value);
      world.camera.three.updateProjectionMatrix();
    }
  } else if (activePreset === "ThirdPerson") {
    world.camera.set("Orbit");
    const cameraModeEl = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
    if (cameraModeEl) cameraModeEl.value = "Orbit";
    world.camera.projection.set("Perspective");
    const cameraProjEl = document.getElementById("settings-camera-projection") as HTMLSelectElement | null;
    if (cameraProjEl) cameraProjEl.value = "Perspective";
    if (!gameCharacterMesh) gameCharacterMesh = createCharacterMesh();
    world.scene.three.add(gameCharacterMesh);
    charPosition.set(0, 0.01, 0);
    charRotationY = 0;
    gameCharacterMesh.position.copy(charPosition);
    gameCharacterMesh.rotation.y = charRotationY;
  }
});

// Update event listeners for sliders
fpsFovSlider.addEventListener("input", () => {
  fpsFovVal.innerText = fpsFovSlider.value;
  if (activePreset === "FPS" && world.camera.three instanceof THREE.PerspectiveCamera) {
    world.camera.three.fov = Number(fpsFovSlider.value);
    world.camera.three.updateProjectionMatrix();
  }
});

sportsHeightSlider.addEventListener("input", () => {
  sportsHeightVal.innerText = Number(sportsHeightSlider.value).toFixed(1);
});

sportsZoomSlider.addEventListener("input", () => {
  sportsZoomVal.innerText = Number(sportsZoomSlider.value).toFixed(1);
});

racingFovSlider.addEventListener("input", () => {
  racingFovVal.innerText = racingFovSlider.value;
  if (activePreset === "Racing" && world.camera.three instanceof THREE.PerspectiveCamera) {
    world.camera.three.fov = Number(racingFovSlider.value);
    world.camera.three.updateProjectionMatrix();
  }
});

tpDistanceSlider.addEventListener("input", () => {
  tpDistanceVal.innerText = Number(tpDistanceSlider.value).toFixed(1);
});

const settingsCameraModeSelect = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
if (settingsCameraModeSelect) {
  settingsCameraModeSelect.addEventListener("change", async () => {
    const mode = settingsCameraModeSelect.value as "Orbit" | "FirstPerson" | "Plan";
    
    // Ensure modes map is initialized on camera
    const camAny = world.camera as any;
    if (!camAny._navigationModes.has(mode)) {
      camAny._navigationModes.set("Orbit", new OBC.OrbitMode(world.camera));
      camAny._navigationModes.set("FirstPerson", new OBC.FirstPersonMode(world.camera));
      camAny._navigationModes.set("Plan", new OBC.PlanMode(world.camera));
      camAny._mode = camAny._navigationModes.get("Orbit");
    }

    world.camera.set(mode as any);

    if (mode === "Plan") {
      await world.camera.projection.set("Orthographic");
      const projectionSelect = document.getElementById("settings-camera-projection") as HTMLSelectElement | null;
      if (projectionSelect) projectionSelect.value = "Orthographic";
      updateViewportHint("2D Floorplan Mode Active — Mouse drag to Pan, wheel to Zoom");
    } else if (mode === "Orbit") {
      await world.camera.projection.set("Perspective");
      const projectionSelect = document.getElementById("settings-camera-projection") as HTMLSelectElement | null;
      if (projectionSelect) projectionSelect.value = "Perspective";
      updateViewportHint("3D Orbit Mode Active — Left-drag to Orbit, Right-drag to Pan, Wheel to Zoom");
    } else if (mode === "FirstPerson") {
      await world.camera.projection.set("Perspective");
      const projectionSelect = document.getElementById("settings-camera-projection") as HTMLSelectElement | null;
      if (projectionSelect) projectionSelect.value = "Perspective";
      updateViewportHint("First Person Walkthrough Active — Use WASD keys & Mouse to explore");
    }

    if (world.onCameraChanged) {
      world.onCameraChanged.trigger(world.camera);
    }
    for (const [, model] of fragments.list) {
      if (model && typeof model.useCamera === "function") {
        model.useCamera(world.camera.three);
      }
    }
  });
}

// WASD Keyboard Navigation for First Person Mode
const keyBindings = {
  forward: localStorage.getItem("key-bind-forward") || "w",
  left: localStorage.getItem("key-bind-left") || "a",
  backward: localStorage.getItem("key-bind-backward") || "s",
  right: localStorage.getItem("key-bind-right") || "d",
};

const firstPersonKeys = { forward: false, left: false, backward: false, right: false, up: false, down: false };

// UI Elements for Gaming settings
const toggleWASD = document.getElementById("settings-enable-wasd") as HTMLInputElement;
const wasdSpeedSlider = document.getElementById("settings-wasd-speed") as HTMLInputElement;
const wasdSpeedVal = document.getElementById("val-wasd-speed")!;
const mouseSensitivitySlider = document.getElementById("settings-mouse-sensitivity") as HTMLInputElement;
const mouseSensitivityVal = document.getElementById("val-mouse-sensitivity")!;
const keyBindBtns = document.querySelectorAll(".key-bind-btn");

let activeBindingAction: string | null = null;

// Initialize speed and sensitivity values from settings elements
let movementSpeed = Number(wasdSpeedSlider.value);
let mouseSensitivity = Number(mouseSensitivitySlider.value);

wasdSpeedSlider.addEventListener("input", () => {
  movementSpeed = Number(wasdSpeedSlider.value);
  wasdSpeedVal.innerText = movementSpeed.toFixed(2);
});

mouseSensitivitySlider.addEventListener("input", () => {
  mouseSensitivity = Number(mouseSensitivitySlider.value);
  mouseSensitivityVal.innerText = mouseSensitivity.toFixed(1);
  if (world.camera.controls) {
    (world.camera.controls as any).rotateSpeed = mouseSensitivity;
  }
});

// Setup key bind button listeners
keyBindBtns.forEach((btn) => {
  const action = btn.getAttribute("data-action")!;
  // Set initial display text from bindings
  btn.textContent = keyBindings[action as keyof typeof keyBindings].toUpperCase();

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    // Reset all buttons text/state
    keyBindBtns.forEach((b) => {
      const act = b.getAttribute("data-action")!;
      b.textContent = keyBindings[act as keyof typeof keyBindings].toUpperCase();
      b.classList.remove("active");
    });

    activeBindingAction = action;
    btn.textContent = "Press key...";
    btn.classList.add("active");
  });
});

window.addEventListener("keydown", (e) => {
  // If we are actively rebinding a key
  if (activeBindingAction) {
    e.preventDefault();
    e.stopPropagation();
    const newKey = e.key.toLowerCase();
    
    // Save new binding
    keyBindings[activeBindingAction as keyof typeof keyBindings] = newKey;
    localStorage.setItem(`key-bind-${activeBindingAction}`, newKey);
    
    // Update button text
    const activeBtn = document.querySelector(`.key-bind-btn[data-action="${activeBindingAction}"]`);
    if (activeBtn) {
      activeBtn.textContent = newKey.toUpperCase();
      activeBtn.classList.remove("active");
    }
    
    activeBindingAction = null;
    return;
  }

  // Normal keyboard navigation keydown
  if (!toggleWASD.checked) return;

  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA" || activeEl.tagName === "SELECT")) {
    return;
  }

  const pressedKey = e.key.toLowerCase();
  if (pressedKey === keyBindings.forward.toLowerCase() || pressedKey === "arrowup") firstPersonKeys.forward = true;
  if (pressedKey === keyBindings.left.toLowerCase() || pressedKey === "arrowleft") firstPersonKeys.left = true;
  if (pressedKey === keyBindings.backward.toLowerCase() || pressedKey === "arrowdown") firstPersonKeys.backward = true;
  if (pressedKey === keyBindings.right.toLowerCase() || pressedKey === "arrowright") firstPersonKeys.right = true;
  if (pressedKey === "q" || e.code === "Space") firstPersonKeys.up = true;
  if (pressedKey === "e" || e.key === "Shift" || pressedKey === "c") firstPersonKeys.down = true;
});

window.addEventListener("keyup", (e) => {
  if (activeBindingAction) return;

  const pressedKey = e.key.toLowerCase();
  if (pressedKey === keyBindings.forward.toLowerCase() || pressedKey === "arrowup") firstPersonKeys.forward = false;
  if (pressedKey === keyBindings.left.toLowerCase() || pressedKey === "arrowleft") firstPersonKeys.left = false;
  if (pressedKey === keyBindings.backward.toLowerCase() || pressedKey === "arrowdown") firstPersonKeys.backward = false;
  if (pressedKey === keyBindings.right.toLowerCase() || pressedKey === "arrowright") firstPersonKeys.right = false;
  if (pressedKey === "q" || e.code === "Space") firstPersonKeys.up = false;
  if (pressedKey === "e" || e.key === "Shift" || pressedKey === "c") firstPersonKeys.down = false;
});

// Update rotateSpeed on camera controls initialization/change
world.camera.controls.addEventListener("update", () => {
  if (world.camera.controls && (world.camera.controls as any).rotateSpeed !== mouseSensitivity) {
    (world.camera.controls as any).rotateSpeed = mouseSensitivity;
  }
});

const movementClock = new THREE.Clock();
const fpSmoothVelocity = new THREE.Vector3();
const fpsPresetVelocity = new THREE.Vector3();

let animateFrameCount = 0;
function animateFirstPerson() {
  requestAnimationFrame(animateFirstPerson);

  const controls = world.camera.controls;
  if (!controls) return;

  const rawDt = movementClock.getDelta();
  const dt = Math.min(rawDt, 0.1); // Clamp to prevent teleports on tab focus loss

  animateFrameCount++;
  if (animateFrameCount % 60 === 0 && activePreset === "FPS") {
    updateCollisionMeshes();
  }

  if (activePreset !== "Default") {
    // --- FPS Preset Update ---
    if (activePreset === "FPS") {
      const previousPos = new THREE.Vector3();
      controls.getPosition(previousPos);
      
      const moveDelta = new THREE.Vector3();

      // 1. Calculate manual movement inputs relative to look vector with delta-time & inertia
      if (toggleWASD && toggleWASD.checked) {
        const forward = new THREE.Vector3();
        world.camera.three.getWorldDirection(forward);
        forward.y = 0;
        if (forward.lengthSq() > 0.0001) forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const inputDir = new THREE.Vector3();
        if (firstPersonKeys.forward) inputDir.add(forward);
        if (firstPersonKeys.backward) inputDir.sub(forward);
        if (firstPersonKeys.left) inputDir.sub(right);
        if (firstPersonKeys.right) inputDir.add(right);

        if (inputDir.lengthSq() > 0.0001) {
          inputDir.normalize();
        }

        const targetSpeed = Math.max(movementSpeed, 0.2) * 7.0;
        const targetVel = inputDir.multiplyScalar(targetSpeed);
        const damping = 1.0 - Math.exp(-14.0 * dt);
        fpsPresetVelocity.lerp(targetVel, damping);

        moveDelta.copy(fpsPresetVelocity).multiplyScalar(dt);
      } else {
        fpsPresetVelocity.set(0, 0, 0);
      }

      const newPos = previousPos.clone().add(moveDelta);

      // Filter collision meshes to exclude glass objects
      const nonGlassMeshes = collisionMeshes.filter((mesh) => !isGlass(mesh));
      const caster = components.get(OBC.Raycasters).get(world);

      // 2. Wall Collisions & Sliding (Filter out stair risers & low steps < 0.55m)
      if (moveDelta.lengthSq() > 0.0001) {
        const playerRadius = 0.40;
        const rayDir = moveDelta.clone().normalize();
        // Cast wall collision ray at chest height (~1.5m above current ground)
        const rayOrigin = new THREE.Vector3(previousPos.x, previousPos.y - 0.1, previousPos.z);
        
        const hit = caster.castRayFromVector(rayOrigin, rayDir, nonGlassMeshes);

        let hitNormal = new THREE.Vector3();
        let normalFound = false;

        if (hit && hit.distance <= playerRadius + moveDelta.length() && hit.face) {
          // If the obstacle hit point is low (< 0.55m above ground), it's a stair riser/step — ignore wall collision to allow climbing!
          const currentGroundY = previousPos.y - (1.727 - 0.1) - fpsHeightOffset;
          const hitHeightDelta = hit.point ? hit.point.y - currentGroundY : 1.0;

          if (hitHeightDelta > 0.55) {
            hitNormal.copy(hit.face.normal).applyQuaternion(hit.object.getWorldQuaternion(new THREE.Quaternion()));
            normalFound = true;
          }
        }

        if (normalFound) {
          const dot = moveDelta.dot(hitNormal);
          if (dot < 0) {
            // Project movement along wall normal to slide cleanly
            moveDelta.addScaledVector(hitNormal, -dot);
          } else {
            moveDelta.set(0, 0, 0);
          }
          newPos.copy(previousPos).add(moveDelta);
        }
      }

      // 3. Ground, Stairs & Gravity with Auto-Climb & Manual Q/E/Space/Shift Height Adjustment
      if (firstPersonKeys.up) {
        fpsHeightOffset = Math.min(fpsHeightOffset + movementSpeed * 0.18, 15.0);
      }
      if (firstPersonKeys.down) {
        fpsHeightOffset = Math.max(fpsHeightOffset - movementSpeed * 0.18, -3.0);
      }

      // Cast ray downwards from 3.0m above position to catch stair treads & landings
      const rayCastHeight = 3.0;
      const stepLimit = 2.5; // Allow stepping up staircases up to 2.5m height delta
      const downOrigin = new THREE.Vector3(newPos.x, previousPos.y + rayCastHeight, newPos.z);
      const downDir = new THREE.Vector3(0, -1, 0);
      const downHit = caster.castRayFromVector(downOrigin, downDir, nonGlassMeshes);
      let groundY = baseSurfaceY;

      if (downHit && downHit.distance <= 20.0) {
        groundY = downHit.point.y;
      }

      // Forward step probe: predict upcoming stair steps ahead of player position
      if (moveDelta.lengthSq() > 0.0001) {
        const probeOffset = moveDelta.clone().normalize().multiplyScalar(0.45);
        const probeOrigin = new THREE.Vector3(newPos.x + probeOffset.x, previousPos.y + rayCastHeight, newPos.z + probeOffset.z);
        const probeHit = caster.castRayFromVector(probeOrigin, downDir, nonGlassMeshes);
        if (probeHit && probeHit.distance <= 20.0) {
          const probeY = probeHit.point.y;
          const stepDelta = probeY - groundY;
          if (stepDelta > 0.02 && stepDelta <= 0.65) {
            groundY = probeY;
          }
        }
      }

      const personHeight = 1.727; // 5'8"
      const eyeHeight = personHeight - 0.1; // ~1.627m
      const targetCameraY = groundY + eyeHeight + fpsHeightOffset;

      const currentHeight = previousPos.y;
      let nextHeight = currentHeight;

      if (targetCameraY > currentHeight) {
        if (targetCameraY - currentHeight <= stepLimit) {
          nextHeight = THREE.MathUtils.lerp(currentHeight, targetCameraY, 0.45);
        } else {
          // Smoothly elevate camera towards higher floors/ledges
          nextHeight = THREE.MathUtils.lerp(currentHeight, targetCameraY, 0.30);
        }
      } else {
        nextHeight = THREE.MathUtils.lerp(currentHeight, targetCameraY, 0.35);
      }

      newPos.y = nextHeight;

      // Calculate actual world-space displacement vector
      const displacement = new THREE.Vector3().subVectors(newPos, previousPos);

      // Translate both position and target to preserve look rotation without drifting
      if (displacement.lengthSq() > 0.000001) {
        const targetVal = new THREE.Vector3();
        controls.getTarget(targetVal);
        targetVal.add(displacement);
        controls.moveTo(targetVal.x, targetVal.y, targetVal.z, false);
      }

      if (gameDrawingSheetMesh) {
        // Position drawing sheet group relative to camera
        const weaponStyle = fpsWeaponSelect.value;
        const scaleMult = weaponStyle === "Wide" ? 0.75 : 1.0;
        gameDrawingSheetMesh.scale.set(scaleMult, scaleMult, scaleMult);

        // Calculate sheet base position relative to camera view
        const baseOffset = new THREE.Vector3(0, 0, 0);
        if (weaponStyle === "Wide") {
          // Shift sheet lower and further away
          baseOffset.set(0, -0.42, -0.52);
        } else {
          baseOffset.set(0, -0.34, -0.42);
        }

        // Apply shake if enabled
        if (fpsShakeToggle.checked) {
          const isMoving = firstPersonKeys.forward || firstPersonKeys.backward || firstPersonKeys.left || firstPersonKeys.right;
          const shakeFreq = isMoving ? 0.12 : 0.04;
          const shakeAmp = isMoving ? 0.006 : 0.0015;
          fpsShakeTime += shakeFreq;

          fpsShakeOffset.set(
            Math.sin(fpsShakeTime * 2.0) * shakeAmp * 0.7,
            Math.cos(fpsShakeTime * 1.5) * shakeAmp,
            Math.sin(fpsShakeTime * 1.0) * shakeAmp * 0.2
          );
          
          // Apply shake directly to camera position offset
          world.camera.three.position.x += fpsShakeOffset.x;
          world.camera.three.position.y += fpsShakeOffset.y;
          
          // Also slightly bounce the drawing sheet
          baseOffset.x += fpsShakeOffset.x * 0.5;
          baseOffset.y += fpsShakeOffset.y * 1.2;
        }

        // Reset local drawing sheet position/rotation so it remains aligned with camera view
        gameDrawingSheetMesh.position.copy(baseOffset);
        // Angle the sheet further forward (X: -0.40) so it looks held at chest level
        gameDrawingSheetMesh.rotation.set(-0.40, 0, 0);
      }
    }
    
    // --- Sports (Bird's Eye) Update ---
    else if (activePreset === "Sports") {
      const height = Number(sportsHeightSlider.value);
      const zoom = Number(sportsZoomSlider.value);
      
      // Determine active target (selected element center or origin)
      const target = new THREE.Vector3(0, 0, 0);
      if (activeModelId && activeExpressId) {
        const selectedModel = fragments.list.get(activeModelId);
        if (selectedModel) {
          try {
            const box = new THREE.Box3().setFromObject(selectedModel.object);
            box.getCenter(target);
          } catch (e) {
            // ignore
          }
        }
      }
      
      // Calculate broadcast view positioning: pull back X/Z, lift Y, and adjust FOV
      const offsetDist = 22 - zoom * 1.8;
      const camPos = new THREE.Vector3(
        target.x + offsetDist,
        target.y + height + 3,
        target.z + offsetDist
      );
      
      // Force setting the camera matrix lookAt
      controls.setLookAt(camPos.x, camPos.y, camPos.z, target.x, target.y, target.z, false);
    }
    
    // --- Racing Mode Update ---
    else if (activePreset === "Racing") {
      if (gameCarMesh) {
        // Steering & Throttle physics
        if (firstPersonKeys.forward) {
          carSpeed = Math.min(carSpeed + CAR_ACCEL, CAR_MAX_SPEED);
        } else if (firstPersonKeys.backward) {
          carSpeed = Math.max(carSpeed - CAR_ACCEL, -CAR_MAX_SPEED / 2);
        } else {
          carSpeed *= 0.94; // friction/drag
        }

        if (Math.abs(carSpeed) > 0.01) {
          const steerSign = carSpeed >= 0 ? 1 : -1;
          if (firstPersonKeys.left) {
            carRotationY += CAR_STEER_SPEED * steerSign;
          }
          if (firstPersonKeys.right) {
            carRotationY -= CAR_STEER_SPEED * steerSign;
          }
        }

        const driveDir = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotationY);
        carPosition.addScaledVector(driveDir, carSpeed);
        
        gameCarMesh.position.copy(carPosition);
        gameCarMesh.rotation.y = carRotationY;

        // Position camera relative to car
        const attachPoint = racingAttachmentSelect.value;
        const camPos = new THREE.Vector3();
        const lookTarget = new THREE.Vector3();

        if (attachPoint === "Bumper") {
          // Camera on bumper looking directly forward
          camPos.set(0, 0.75, 1.65).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotationY).add(carPosition);
          lookTarget.set(0, 0.75, 5).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotationY).add(carPosition);
        } else {
          // Camera behind and above hood, looking over
          camPos.set(0, 1.7, -2.4).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotationY).add(carPosition);
          lookTarget.set(0, 1.1, 3.5).applyAxisAngle(new THREE.Vector3(0, 1, 0), carRotationY).add(carPosition);
        }

        controls.setLookAt(camPos.x, camPos.y, camPos.z, lookTarget.x, lookTarget.y, lookTarget.z, false);
      }
    }
    
    // --- Third-Person Update ---
    else if (activePreset === "ThirdPerson") {
      if (gameCharacterMesh) {
        const distance = Number(tpDistanceSlider.value);
        const autoFollow = tpAutoFollowToggle.checked;

        // Calculate move vector based on camera direction
        const camDirection = new THREE.Vector3();
        world.camera.three.getWorldDirection(camDirection);
        camDirection.y = 0;
        camDirection.normalize();

        const camRight = new THREE.Vector3();
        camRight.crossVectors(camDirection, new THREE.Vector3(0, 1, 0)).normalize();

        const moveDir = new THREE.Vector3();
        if (firstPersonKeys.forward) moveDir.add(camDirection);
        if (firstPersonKeys.backward) moveDir.addScaledVector(camDirection, -1);
        if (firstPersonKeys.left) moveDir.addScaledVector(camRight, 1);
        if (firstPersonKeys.right) moveDir.addScaledVector(camRight, -1);

        const isMoving = moveDir.lengthSq() > 0.001;
        if (isMoving) {
          moveDir.normalize();
          charPosition.addScaledVector(moveDir, 0.12);
          gameCharacterMesh.position.copy(charPosition);

          // Rotate character to face movement direction
          charRotationY = Math.atan2(moveDir.x, moveDir.z);
          gameCharacterMesh.rotation.y = charRotationY;
        }

        if (autoFollow && isMoving) {
          // Position camera directly behind character
          const backOffset = new THREE.Vector3(0, 1.9, -distance).applyAxisAngle(new THREE.Vector3(0, 1, 0), charRotationY);
          const camPos = charPosition.clone().add(backOffset);
          
          controls.setLookAt(
            camPos.x, camPos.y, camPos.z,
            charPosition.x, charPosition.y + 0.9, charPosition.z,
            true // Enable interpolation transition for smoothness
          );
        } else {
          // Lock target and let standard camera-controls mouse drag orbit
          controls.moveTo(charPosition.x, charPosition.y + 0.9, charPosition.z, false);
          
          // Smoothly clamp/dolly to slider distance
          if (Math.abs(controls.distance - distance) > 0.01) {
            controls.distance = distance;
          }
        }
      }
    }
    return;
  }

  // --- Smooth WASD Keyboard Navigation (First Person & Orbit Mode) ---
  if (!toggleWASD || !toggleWASD.checked) {
    fpSmoothVelocity.set(0, 0, 0);
    return;
  }

  const cameraModeSelect = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
  const isFirstPersonMode = cameraModeSelect?.value === "FirstPerson";

  // Calculate forward (XZ plane) and right directions based on camera orientation
  const forward = new THREE.Vector3();
  world.camera.three.getWorldDirection(forward);
  forward.y = 0;
  if (forward.lengthSq() > 0.0001) {
    forward.normalize();
  } else {
    forward.set(0, 0, -1);
  }

  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  const moveDir = new THREE.Vector3();
  if (firstPersonKeys.forward) moveDir.add(forward);
  if (firstPersonKeys.backward) moveDir.sub(forward);
  if (firstPersonKeys.right) moveDir.add(right);
  if (firstPersonKeys.left) moveDir.sub(right);

  // Normalize horizontal direction for consistent diagonal speed
  if (moveDir.lengthSq() > 0.0001) {
    moveDir.normalize();
  }

  let verticalDir = 0;
  if (firstPersonKeys.up) verticalDir += 1;
  if (firstPersonKeys.down) verticalDir -= 1;

  // Base speed in meters/second
  const targetSpeed = Math.max(movementSpeed, 0.2) * (isFirstPersonMode ? 7.5 : 5.0);
  const targetVelocity = moveDir.multiplyScalar(targetSpeed);
  targetVelocity.y = verticalDir * targetSpeed * 0.75;

  // Smooth acceleration and deceleration via exponential damping (inertia)
  const damping = 1.0 - Math.exp(-14.0 * dt);
  fpSmoothVelocity.lerp(targetVelocity, damping);

  if (fpSmoothVelocity.lengthSq() > 0.00001) {
    const displacement = fpSmoothVelocity.clone().multiplyScalar(dt);
    const targetVal = new THREE.Vector3();
    controls.getTarget(targetVal);
    targetVal.add(displacement);
    controls.moveTo(targetVal.x, targetVal.y, targetVal.z, false);
  }

  // Update real-time HUD overlays
  AnnotationModule.getInstance().updateOverlayPositions();
  MinimapHUD.getInstance().update();
}
animateFirstPerson();

const settingsCameraProjection = document.getElementById("settings-camera-projection")! as HTMLSelectElement;
if (settingsCameraProjection) {
  settingsCameraProjection.addEventListener("change", async () => {
    const proj = settingsCameraProjection.value as "Perspective" | "Orthographic";
    await world.camera.projection.set(proj as any);
    if (world.onCameraChanged) {
      world.onCameraChanged.trigger(world.camera);
    }
    for (const [, model] of fragments.list) {
      if (model && typeof model.useCamera === "function") {
        model.useCamera(world.camera.three);
      }
    }
  });
}

const settingsCameraInput = document.getElementById("settings-camera-input")! as HTMLInputElement;
settingsCameraInput.addEventListener("change", () => {
  world.camera.setUserInput(settingsCameraInput.checked);
});

const btnCameraFit = document.getElementById("btn-camera-fit")!;
if (btnCameraFit) {
  btnCameraFit.addEventListener("click", async () => {
    await world.camera.fit(world.meshes);
  });
}

// Camera Far Limit Slider
const cameraFarInput = document.getElementById("settings-camera-far") as HTMLInputElement | null;
const cameraFarVal = document.getElementById("val-camera-far");
if (cameraFarInput) {
  cameraFarInput.addEventListener("input", () => {
    const farVal = Number(cameraFarInput.value);
    if (cameraFarVal) cameraFarVal.innerText = `${farVal}m`;

    if (world.camera) {
      if (world.camera.threePersp) {
        world.camera.threePersp.far = farVal;
        world.camera.threePersp.updateProjectionMatrix();
      }
      if (world.camera.threeOrtho) {
        world.camera.threeOrtho.far = farVal;
        world.camera.threeOrtho.updateProjectionMatrix();
      }
      if (world.camera.three) {
        world.camera.three.far = farVal;
        world.camera.three.updateProjectionMatrix();
      }
    }
    if (sceneManager.bluePenPass && sceneManager.bluePenPass.uniforms.cameraFar) {
      sceneManager.bluePenPass.uniforms.cameraFar.value = farVal;
    }
    if (fragments.core) {
      fragments.core.update(true);
    }
  });
}

// Camera Near Limit Slider
const cameraNearInput = document.getElementById("settings-camera-near") as HTMLInputElement | null;
const cameraNearVal = document.getElementById("val-camera-near");
if (cameraNearInput) {
  cameraNearInput.addEventListener("input", () => {
    const nearVal = Number(cameraNearInput.value);
    if (cameraNearVal) cameraNearVal.innerText = `${nearVal.toFixed(2)}m`;

    if (world.camera) {
      if (world.camera.threePersp) {
        world.camera.threePersp.near = nearVal;
        world.camera.threePersp.updateProjectionMatrix();
      }
      if (world.camera.threeOrtho) {
        world.camera.threeOrtho.near = nearVal;
        world.camera.threeOrtho.updateProjectionMatrix();
      }
      if (world.camera.three) {
        world.camera.three.near = nearVal;
        world.camera.three.updateProjectionMatrix();
      }
    }
    if (sceneManager.bluePenPass && sceneManager.bluePenPass.uniforms.cameraNear) {
      sceneManager.bluePenPass.uniforms.cameraNear.value = nearVal;
    }
    if (fragments.core) {
      fragments.core.update(true);
    }
  });
}

// Camera FOV Slider
const cameraFovInput = document.getElementById("settings-camera-fov") as HTMLInputElement | null;
const cameraFovVal = document.getElementById("val-camera-fov");
if (cameraFovInput) {
  cameraFovInput.addEventListener("input", () => {
    const fovVal = Number(cameraFovInput.value);
    if (cameraFovVal) cameraFovVal.innerText = `${fovVal}°`;

    if (world.camera && world.camera.threePersp) {
      world.camera.threePersp.fov = fovVal;
      world.camera.threePersp.updateProjectionMatrix();
    }
    if (fragments.core) {
      fragments.core.update(true);
    }
  });
}

// Zoom & Dolly Speed Slider
const cameraSpeedInput = document.getElementById("settings-camera-speed") as HTMLInputElement | null;
const cameraSpeedVal = document.getElementById("val-camera-speed");
if (cameraSpeedInput) {
  cameraSpeedInput.addEventListener("input", () => {
    const speedVal = Number(cameraSpeedInput.value);
    if (cameraSpeedVal) cameraSpeedVal.innerText = `${speedVal.toFixed(1)}x`;

    if (world.camera && world.camera.controls) {
      (world.camera.controls as any).dollySpeed = speedVal;
      (world.camera.controls as any).zoomSpeed = speedVal;
    }
  });
}

// Exploded Disassembly View Slider & Clustering Mode
const explosionSlider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
const explosionVal = document.getElementById("val-explosion-factor");
const explosionModeSelect = document.getElementById("select-explosion-mode") as HTMLSelectElement | null;
const explosionModeBadge = document.getElementById("badge-explosion-mode");

if (explosionModeSelect) {
  explosionModeSelect.addEventListener("change", () => {
    const mode = explosionModeSelect.value as any;
    ExplosionModule.getInstance().setClusteringMode(mode);
    if (explosionModeBadge) {
      if (mode === "category-cluster") explosionModeBadge.textContent = "CATEGORIES";
      else if (mode === "asset-dense-cluster") explosionModeBadge.textContent = "ASSETS";
      else if (mode === "storey-cluster") explosionModeBadge.textContent = "STOREYS";
      else explosionModeBadge.textContent = "RADIAL";
    }
  });
}

if (explosionSlider) {
  explosionSlider.addEventListener("input", () => {
    const factor = Number(explosionSlider.value) / 100;
    if (explosionVal) explosionVal.innerText = `${explosionSlider.value}%`;
    ExplosionModule.getInstance().setExplosionFactor(factor);
  });
}

// Solar Sun Position Analysis Sliders
const sunAzimuthInput = document.getElementById("settings-sun-azimuth") as HTMLInputElement | null;
const sunAzimuthVal = document.getElementById("val-sun-azimuth");
const sunElevationInput = document.getElementById("settings-sun-elevation") as HTMLInputElement | null;
const sunElevationVal = document.getElementById("val-sun-elevation");

const updateSunPosition = () => {
  const azimuthDeg = sunAzimuthInput ? Number(sunAzimuthInput.value) : 135;
  const elevationDeg = sunElevationInput ? Number(sunElevationInput.value) : 45;

  if (sunAzimuthVal) sunAzimuthVal.innerText = `${azimuthDeg}°`;
  if (sunElevationVal) sunElevationVal.innerText = `${elevationDeg}°`;

  const azimuthRad = (azimuthDeg * Math.PI) / 180;
  const elevationRad = (elevationDeg * Math.PI) / 180;
  const dist = 75;

  if (dirLight) {
    dirLight.position.x = dist * Math.cos(elevationRad) * Math.sin(azimuthRad);
    dirLight.position.y = Math.max(0.5, dist * Math.sin(elevationRad));
    dirLight.position.z = dist * Math.cos(elevationRad) * Math.cos(azimuthRad);

    const target = new THREE.Vector3();
    if (world.camera?.controls) {
      world.camera.controls.getTarget(target);
    }
    dirLight.target.position.copy(target);
    dirLight.target.updateMatrixWorld();

    if (dirLight.shadow && dirLight.shadow.camera) {
      dirLight.shadow.camera.updateProjectionMatrix();
    }

    if (world.scene && (world.scene as any).updateShadows) {
      (world.scene as any).updateShadows();
    }
  }
};

if (sunAzimuthInput) sunAzimuthInput.addEventListener("input", updateSunPosition);
if (sunElevationInput) sunElevationInput.addEventListener("input", updateSunPosition);

// 3D Pin Annotation Tool Controller & Sidebar Sync
const toggleAnnotation = document.getElementById("settings-toggle-annotation") as HTMLInputElement | null;
const pinOptionsPanel = document.getElementById("pin-annotation-options");
const pinTitleInput = document.getElementById("pin-title-input") as HTMLInputElement | null;
const pinCommentInput = document.getElementById("pin-comment-input") as HTMLTextAreaElement | null;
const pinCategoryPills = document.getElementById("pin-category-pills");
const pinListContainer = document.getElementById("pin-annotations-list");
const pinsCountSpan = document.getElementById("pins-count");

let activePinCategory = "Inspection";

if (pinCategoryPills) {
  pinCategoryPills.querySelectorAll(".btn-pin-cat").forEach(btn => {
    btn.addEventListener("click", () => {
      pinCategoryPills.querySelectorAll(".btn-pin-cat").forEach(b => {
        (b as HTMLElement).style.background = "var(--bg-input)";
        (b as HTMLElement).style.color = "var(--text-primary)";
        b.classList.remove("active");
      });
      btn.classList.add("active");
      activePinCategory = btn.getAttribute("data-cat") || "Inspection";
      const catColor = AnnotationModule.categoryColors[activePinCategory] || "#3b82f6";
      (btn as HTMLElement).style.background = catColor;
      (btn as HTMLElement).style.color = "#ffffff";

      // Automatically sync input title with selected Category name
      if (pinTitleInput) {
        const val = pinTitleInput.value.trim();
        const defaultNames = ["Inspection Pin", "Defect Pin", "Safety Pin", "RFI Pin", "Sign-off Pin", ""];
        if (defaultNames.includes(val) || val.endsWith(" Pin")) {
          pinTitleInput.value = `${activePinCategory} Pin`;
        }
      }
    });
  });
}

function refreshPinsList(pins: any[]) {
  if (pinsCountSpan) pinsCountSpan.textContent = String(pins.length);
  if (!pinListContainer) return;

  if (pins.length === 0) {
    pinListContainer.innerHTML = `<div style="font-size: 0.6rem; color: var(--text-muted); font-style: italic;">No pins placed yet.</div>`;
    return;
  }

  pinListContainer.innerHTML = pins.map(p => {
    const catColor = p.color || AnnotationModule.categoryColors[p.category] || "#3b82f6";
    return `
      <div class="pin-list-item" data-id="${p.id}" style="display: flex; justify-content: space-between; align-items: center; background: var(--bg-card); border: 1.5px solid #000; padding: 0.25rem 0.4rem; border-radius: 2px; font-size: 0.65rem; cursor: pointer;">
        <div style="display: flex; align-items: center; gap: 0.35rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          <span style="background: ${catColor}; color: #ffffff; width: 15px; height: 15px; border-radius: 50%; border: 1px solid #000; display: inline-flex; align-items: center; justify-content: center; font-size: 0.55rem; font-weight: 900; flex-shrink: 0;">${p.number}</span>
          <span style="font-weight: 800; color: var(--text-primary);">${p.title}</span>
          <span style="font-size: 0.58rem; color: var(--text-muted);">[${p.category}]</span>
        </div>
        <div style="display: flex; gap: 0.2rem; flex-shrink: 0;">
          <button class="btn-goto-pin" data-id="${p.id}" title="Focus camera on pin" style="background: var(--accent-500); color: #ffffff; border: 1px solid #000; border-radius: 2px; font-size: 0.55rem; font-weight: 800; padding: 0.15rem 0.3rem; cursor: pointer;">View</button>
          <button class="btn-del-pin" data-id="${p.id}" title="Delete pin" style="background: #fee2e2; color: #dc2626; border: 1px solid #000; border-radius: 2px; font-size: 0.55rem; font-weight: 800; padding: 0.15rem 0.3rem; cursor: pointer;">✕</button>
        </div>
      </div>
    `;
  }).join("");

  pinListContainer.querySelectorAll(".pin-list-item").forEach(item => {
    item.addEventListener("click", (e) => {
      if ((e.target as HTMLElement).closest(".btn-del-pin")) return;
      const id = item.getAttribute("data-id");
      if (id) {
        AnnotationModule.getInstance().selectPin(id);
      }
    });
  });

  pinListContainer.querySelectorAll(".btn-del-pin").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      if (id) AnnotationModule.getInstance().removeAnnotation(id);
    });
  });
}

// Sidebar Selected Pin Details Card Bindings
const selectedPinDetailsSidebar = document.getElementById("selected-pin-details-sidebar");
const sidebarPinNumberBadge = document.getElementById("sidebar-pin-number-badge");
const sidebarPinTitleDisplay = document.getElementById("sidebar-pin-title-display");
const sidebarPinCategoryTag = document.getElementById("sidebar-pin-category-tag");
const sidebarPinElementName = document.getElementById("sidebar-pin-element-name");
const sidebarPinCommentEdit = document.getElementById("sidebar-pin-comment-edit") as HTMLTextAreaElement | null;
const sidebarPinThumbContainer = document.getElementById("sidebar-pin-thumbnail-container");
const sidebarPinThumbImg = document.getElementById("sidebar-pin-thumbnail-img") as HTMLImageElement | null;
const btnSidebarInspectElement = document.getElementById("btn-sidebar-inspect-element");
const btnSidebarSavePin = document.getElementById("btn-sidebar-save-pin");
const btnSidebarFocusPin = document.getElementById("btn-sidebar-focus-pin");
const btnSidebarXRayPin = document.getElementById("btn-sidebar-xray-pin");
const btnSidebarDeletePin = document.getElementById("btn-sidebar-delete-pin");
const pinFilterChips = document.getElementById("pin-filter-chips");
const btnExportPins = document.getElementById("btn-export-pins");

let currentSelectedPin: any = null;

AnnotationModule.getInstance().onPinSelected = (anno) => {
  currentSelectedPin = anno;
  if (!selectedPinDetailsSidebar) return;

  if (!anno) {
    selectedPinDetailsSidebar.style.display = "none";
    return;
  }

  selectedPinDetailsSidebar.style.display = "flex";
  const catColor = anno.color || AnnotationModule.categoryColors[anno.category] || "#3b82f6";

  if (sidebarPinNumberBadge) {
    sidebarPinNumberBadge.textContent = String(anno.number);
    sidebarPinNumberBadge.style.background = catColor;
  }
  if (sidebarPinTitleDisplay) sidebarPinTitleDisplay.textContent = anno.title;
  if (sidebarPinCategoryTag) {
    sidebarPinCategoryTag.textContent = anno.category;
    sidebarPinCategoryTag.style.background = catColor;
  }
  if (sidebarPinElementName) {
    sidebarPinElementName.innerHTML = `<span style="display: inline-flex; align-items: center; gap: 0.25rem;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> ${anno.elementName || "Scene Anchor"}</span>`;
  }
  if (sidebarPinCommentEdit) {
    sidebarPinCommentEdit.value = anno.comment;
  }

  // Show snapshot thumbnail if available
  if (sidebarPinThumbContainer && sidebarPinThumbImg) {
    if (anno.thumbnail) {
      sidebarPinThumbImg.src = anno.thumbnail;
      sidebarPinThumbContainer.style.display = "block";
    } else {
      sidebarPinThumbContainer.style.display = "none";
    }
  }

  // Update active highlight in pin list
  document.querySelectorAll("#pin-annotations-list .pin-list-item").forEach((item) => {
    const isSelected = item.getAttribute("data-id") === anno.id;
    (item as HTMLElement).style.borderColor = isSelected ? "var(--accent-500, #3b82f6)" : "#000000";
    (item as HTMLElement).style.background = isSelected ? "var(--bg-hover, #e0f2fe)" : "var(--bg-card)";
    if (isSelected) {
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
};

if (btnSidebarSavePin) {
  btnSidebarSavePin.addEventListener("click", () => {
    if (!currentSelectedPin || !sidebarPinCommentEdit) return;
    const newComment = sidebarPinCommentEdit.value.trim();
    AnnotationModule.getInstance().updateAnnotation(currentSelectedPin.id, { comment: newComment });
    updateViewportHint(`Updated Pin #${currentSelectedPin.number} notes`);
  });
}

if (btnSidebarFocusPin) {
  btnSidebarFocusPin.addEventListener("click", () => {
    if (!currentSelectedPin) return;
    AnnotationModule.getInstance().focusOnAnnotation(currentSelectedPin.id);
  });
}

if (btnSidebarXRayPin) {
  btnSidebarXRayPin.addEventListener("click", () => {
    AnnotationModule.getInstance().toggleXRay();
    if (currentSelectedPin) {
      AnnotationModule.getInstance().selectAndHighlightTaggedElement(currentSelectedPin);
    }
    const isXRay = AnnotationModule.getInstance().isXRayActive;
    btnSidebarXRayPin.style.background = isXRay ? "var(--accent-500)" : "var(--bg-card)";
    btnSidebarXRayPin.style.color = isXRay ? "#ffffff" : "var(--text-primary)";
    updateViewportHint(isXRay ? "X-Ray Isolation Mode ON" : "X-Ray Isolation Mode OFF");
  });
}

if (btnSidebarDeletePin) {
  btnSidebarDeletePin.addEventListener("click", () => {
    if (!currentSelectedPin) return;
    AnnotationModule.getInstance().removeAnnotation(currentSelectedPin.id);
    if (selectedPinDetailsSidebar) selectedPinDetailsSidebar.style.display = "none";
  });
}

if (btnSidebarInspectElement) {
  btnSidebarInspectElement.addEventListener("click", () => {
    if (!currentSelectedPin || !currentSelectedPin.modelId || currentSelectedPin.expressId === undefined) return;
    AnnotationModule.getInstance().selectAndHighlightTaggedElement(currentSelectedPin);
    if (typeof (window as any).switchSidebarTab === "function") {
      (window as any).switchSidebarTab("right-tab-bar", "inspector");
    }
  });
}

// Category Filter Chips
if (pinFilterChips) {
  pinFilterChips.querySelectorAll(".btn-filter-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      pinFilterChips.querySelectorAll(".btn-filter-chip").forEach(c => {
        (c as HTMLElement).style.background = "var(--bg-input)";
        (c as HTMLElement).style.color = "var(--text-primary)";
        c.classList.remove("active");
      });
      chip.classList.add("active");
      const filter = chip.getAttribute("data-filter") || "All";
      const activeColor = filter === "All" ? "var(--accent-500)" : (AnnotationModule.categoryColors[filter] || "var(--accent-500)");
      (chip as HTMLElement).style.background = activeColor;
      (chip as HTMLElement).style.color = "#ffffff";
      AnnotationModule.getInstance().setFilterCategory(filter);
      updateViewportHint(`Filtered pins: ${filter}`);
    });
  });
}

// BCF Export Button
if (btnExportPins) {
  btnExportPins.addEventListener("click", () => {
    AnnotationModule.getInstance().exportBCFJSON();
    updateViewportHint("Exported BIM Field Issues Report (BCF/JSON)");
  });
}

AnnotationModule.getInstance().onPinsUpdated = (pins) => {
  refreshPinsList(pins);
};

if (toggleAnnotation) {
  toggleAnnotation.addEventListener("change", () => {
    const active = toggleAnnotation.checked;
    AnnotationModule.getInstance().enablePinCreation(active);
    if (pinOptionsPanel) {
      pinOptionsPanel.style.display = active ? "flex" : "none";
    }
    if (active) {
      updateViewportHint("📌 Click on any 3D element to drop a Pin Annotation marker");
    }
  });
}

const btnClearAnnotations = document.getElementById("btn-clear-annotations");
if (btnClearAnnotations) {
  btnClearAnnotations.addEventListener("click", () => {
    AnnotationModule.getInstance().clearAll();
  });
}

// Section Box Multi-Plane Clipping
const toggleSectionBox = document.getElementById("settings-toggle-section-box") as HTMLInputElement | null;
const sectionBoxControls = document.getElementById("section-box-controls");
const sectionBoxYMaxInput = document.getElementById("section-box-ymax") as HTMLInputElement | null;

if (toggleSectionBox) {
  toggleSectionBox.addEventListener("change", () => {
    const active = toggleSectionBox.checked;
    clipping.setSectionBoxEnabled(active);
    if (sectionBoxControls) {
      sectionBoxControls.style.display = active ? "flex" : "none";
    }
  });
}

if (sectionBoxYMaxInput) {
  sectionBoxYMaxInput.addEventListener("input", () => {
    const yMax = Number(sectionBoxYMaxInput.value);
    clipping.updateSectionBoxBounds(-50, 50, -10, yMax, -50, 50);
  });
}

function resolveElementTag(expressId: number): string {
  try {
    const cats = classifier.list.get("Categories");
    if (cats) {
      for (const [catName, group] of cats) {
        for (const [, idSet] of (group as any).map) {
          if (idSet.has(expressId)) return `${catName} #${expressId}`;
        }
      }
    }
  } catch (e) {
    // fallback
  }
  return `IfcElement #${expressId}`;
}

// Direct Button to drop pin on currently selected element or camera target
const btnDropPinHere = document.getElementById("btn-drop-pin-here");
if (btnDropPinHere) {
  btnDropPinHere.addEventListener("click", () => {
    const annoMod = AnnotationModule.getInstance();
    let targetPos = new THREE.Vector3();
    let taggedModelId: string | undefined = undefined;
    let taggedExpressId: number | undefined = undefined;
    let taggedElementName: string | undefined = undefined;

    if (activeExpressId !== null && activeModelId) {
      taggedModelId = activeModelId;
      taggedExpressId = activeExpressId;
      taggedElementName = resolveElementTag(activeExpressId);
    }

    world.camera.controls.getTarget(targetPos);
    const userVal = pinTitleInput?.value.trim();
    const isGeneric = !userVal || userVal.endsWith(" Pin") || ["Inspection", "Defect", "Safety", "RFI", "Sign-off"].some(c => userVal === `${c} Pin` || userVal === c);
    const title = (!isGeneric && userVal) ? userVal : `${activePinCategory} Pin`;
    const comment = pinCommentInput?.value.trim() || `Field notes recorded for ${activePinCategory.toLowerCase()} assessment.`;
    annoMod.addAnnotation(targetPos, title, comment, activePinCategory, taggedModelId, taggedExpressId, taggedElementName);
    updateViewportHint(`✓ Tagged 3D Pin to ${taggedElementName || 'Model'}: "${title}" (${activePinCategory})`);
  });
}

// Canvas Pointer Events for 3D Pin Annotations
let pinPointerDownPos = { x: 0, y: 0, time: 0 };
container.addEventListener("pointerdown", (e: PointerEvent) => {
  pinPointerDownPos = { x: e.clientX, y: e.clientY, time: Date.now() };
});

const placePinAtMousePosition = async (clientX: number, clientY: number) => {
  const annoMod = AnnotationModule.getInstance();
  if (!annoMod.enabled) return;

  const rect = container.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((clientX - rect.left) / rect.width) * 2 - 1,
    -((clientY - rect.top) / rect.height) * 2 + 1
  );

  let hitPoint: THREE.Vector3 | null = null;
  let taggedModelId: string | undefined = undefined;
  let taggedExpressId: number | undefined = undefined;
  let taggedElementName: string | undefined = undefined;

  // 1. Try ThatOpen Raycaster against BIM elements
  try {
    const caster = components.get(OBC.Raycasters).get(world);
    const result = (await caster.castRay()) as any;
    if (result && result.point) {
      hitPoint = result.point.clone();
      if (result.fragments?.modelId && result.localId !== undefined) {
        taggedModelId = result.fragments.modelId;
        taggedExpressId = result.localId;
        if (typeof taggedExpressId === "number") {
          taggedElementName = resolveElementTag(taggedExpressId);
        }
      }
    }
  } catch (err) {
    // fallback
  }

  // 2. Try standard Three.js raycasting against fragment geometry
  if (!hitPoint) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, world.camera.three);

    const meshes: THREE.Mesh[] = [];
    for (const [, model] of fragments.list) {
      const modelObj = (model.object || model) as THREE.Object3D;
      if (modelObj && typeof modelObj.traverse === "function") {
        modelObj.traverse((child: any) => {
          if (child.isMesh) meshes.push(child);
        });
      }
    }

    const intersects = raycaster.intersectObjects(meshes, true);
    if (intersects.length > 0) {
      hitPoint = intersects[0].point;
      if (activeExpressId !== null && activeModelId) {
        taggedModelId = activeModelId;
        taggedExpressId = activeExpressId;
        taggedElementName = resolveElementTag(activeExpressId);
      }
    } else {
      const target = new THREE.Vector3();
      world.camera.controls.getTarget(target);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -target.y);
      const planeHit = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane, planeHit)) {
        hitPoint = planeHit;
      } else {
        hitPoint = target;
      }
    }
  }

  if (hitPoint) {
    const userVal = pinTitleInput?.value.trim();
    const isGeneric = !userVal || userVal.endsWith(" Pin") || ["Inspection", "Defect", "Safety", "RFI", "Sign-off"].some(c => userVal === `${c} Pin` || userVal === c);
    const title = (!isGeneric && userVal) ? userVal : `${activePinCategory} Pin`;
    const comment = pinCommentInput?.value.trim() || `Field notes recorded on 3D geometry for ${activePinCategory.toLowerCase()}.`;
    annoMod.addAnnotation(hitPoint, title, comment, activePinCategory, taggedModelId, taggedExpressId, taggedElementName);
    updateViewportHint(`✓ Tagged 3D Pin to ${taggedElementName || 'Surface'}: "${title}" (${activePinCategory})`);
  }
};

container.addEventListener("pointerup", (e: PointerEvent) => {
  const dist = Math.hypot(e.clientX - pinPointerDownPos.x, e.clientY - pinPointerDownPos.y);
  const duration = Date.now() - pinPointerDownPos.time;
  if (dist < 8 && duration < 600) {
    // 1. First check if clicked on an existing 3D Pin Mesh in scene
    const annoMod = AnnotationModule.getInstance();
    const pinsGroup = (annoMod as any).pinsGroup as THREE.Group | undefined;
    if (pinsGroup && pinsGroup.children.length > 0) {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const pinRaycaster = new THREE.Raycaster();
      pinRaycaster.setFromCamera(mouse, world.camera.three);
      const pinIntersects = pinRaycaster.intersectObjects(pinsGroup.children, true);
      if (pinIntersects.length > 0) {
        let current: THREE.Object3D | null = pinIntersects[0].object;
        while (current && !current.userData?.annotationId && current !== pinsGroup) {
          current = current.parent;
        }
        if (current?.userData?.annotationId) {
          annoMod.selectPin(current.userData.annotationId);
          return;
        }
      }
    }

    // 2. If pin creation tool is active, drop a new pin
    placePinAtMousePosition(e.clientX, e.clientY);
  }
});

// --- TAPE MEASURE BINDINGS ---
const settingsToggleMeasure = document.getElementById("settings-toggle-measure")! as HTMLInputElement;
settingsToggleMeasure.addEventListener("change", () => {
  measurements.enabled = settingsToggleMeasure.checked;
});

container.addEventListener("click", () => {
  if (measurements.enabled) {
    measurements.create();
  }
});

window.addEventListener("keydown", (e) => {
  if (measurements.enabled) {
    if (e.key === "Escape") {
      measurements.cancelCreation();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      measurements.delete();
    }
  }
});

const btnClearMeasurements = document.getElementById("btn-clear-measurements");
if (btnClearMeasurements) {
  btnClearMeasurements.addEventListener("click", () => {
    measurements.list.clear();
    measurements.cancelCreation();
  });
}

// --- BCF ISSUE MANAGEMENT BINDINGS ---
const btnCreateBcfTopic = document.getElementById("btn-create-bcf-topic");
if (btnCreateBcfTopic) {
  btnCreateBcfTopic.addEventListener("click", () => {
    const titleInput = document.getElementById("bcf-topic-title") as HTMLInputElement | null;
    const descInput = document.getElementById("bcf-topic-desc") as HTMLTextAreaElement | null;
    const typeSelect = document.getElementById("bcf-topic-type") as HTMLSelectElement | null;
    const prioritySelect = document.getElementById("bcf-topic-priority") as HTMLSelectElement | null;

    const title = titleInput?.value.trim() || "Untitled Issue";
    const description = descInput?.value.trim() || "Reported from 3D BIM Viewer";
    const type = typeSelect?.value || "Coordination";
    const priority = prioritySelect?.value || "Normal";

    bcfManager.createTopic({
      title,
      description,
      type,
      priority,
      status: "Active",
    });

    if (titleInput) titleInput.value = "";
    if (descInput) descInput.value = "";

    const originalText = btnCreateBcfTopic.innerHTML;
    btnCreateBcfTopic.innerHTML = `<span>✓ Issue Logged!</span>`;
    setTimeout(() => { btnCreateBcfTopic.innerHTML = originalText; }, 1500);
  });
}

const btnExportBcf = document.getElementById("btn-export-bcf");
if (btnExportBcf) {
  btnExportBcf.addEventListener("click", async () => {
    await bcfManager.exportBCF();
  });
}

// --- DYNAMIC CATEGORY COLORING & THEME MAPPING ---
async function applyCategoryColors() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'cozy';
  const categoriesGroup = classifier.list.get("Categories");
  if (!categoriesGroup) return;

  for (const [categoryName, groupData] of categoriesGroup) {
    const colorHex = getCategoryColor(currentTheme, categoryName);
    const threeColor = new THREE.Color(colorHex);
    const map = await groupData.get();

    for (const modelId in map) {
      const model = fragments.list.get(modelId);
      if (!model) continue;

      const expressIds = map[modelId];
      if (!expressIds || expressIds.size === 0) continue;

      try {
        const material = new THREE.MeshStandardMaterial({
          color: threeColor,
          roughness: 0.4,
          metalness: 0.1,
          polygonOffset: true,
          polygonOffsetFactor: 1,
          polygonOffsetUnits: 1,
        });

        // Use fragment material styling or fallback if supported
        if ((model as any).setMaterial) {
          (model as any).setMaterial(expressIds, material);
        }
      } catch (err) {
        console.warn(`Category color application skipped for ${categoryName}:`, err);
      }
    }
  }
}
(window as any).applyCategoryColors = applyCategoryColors;

// --- DYNAMIC CLASSIFICATION TREE BINDINGS ---
async function updateClassificationUI() {
  const treeContainer = document.getElementById("classification-tree");
  if (!treeContainer) return;
  treeContainer.innerHTML = "";

  if (fragments.list.size === 0) {
    treeContainer.innerHTML = `
      <div class="empty-state-container" style="padding: 2rem 1rem; text-align: center;">
        <span class="empty-state-text" style="font-size: 0.75rem; color: var(--text-dim);">Load a model to view categories and storeys classification.</span>
      </div>
    `;
    return;
  }

  for (const [classificationName, groups] of classifier.list) {
    const classificationNode = document.createElement("div");
    classificationNode.className = "tree-node";

    const header = document.createElement("div");
    header.className = "tree-node-header";
    header.innerHTML = `
      <span class="tree-arrow">▼</span>
      <span class="tree-icon">📂</span>
      <span class="tree-label">${classificationName}</span>
    `;
    classificationNode.appendChild(header);

    const childrenContainer = document.createElement("div");
    childrenContainer.className = "tree-node-children";

    let hasGroups = false;
    for (const [groupName, groupData] of groups) {
      hasGroups = true;
      const leaf = document.createElement("div");
      leaf.className = "tree-node-leaf";
      
      const icon = classificationName === "Categories" 
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>` 
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 9h1M9 13h1M9 17h1M14 9h1M14 13h1M14 17h1"/></svg>`;
      
      leaf.innerHTML = `
        <span class="tree-bullet">•</span>
        <span class="tree-icon" style="display: inline-flex; align-items: center;">${icon}</span>
        <span class="tree-label">${groupName}</span>
      `;

      leaf.addEventListener("click", async () => {
        const hider = components.get(OBC.Hider);
        
        if (leaf.classList.contains("active")) {
          leaf.classList.remove("active");
          await hider.set(true);
          return;
        }

        document.querySelectorAll(".tree-node-leaf").forEach(el => el.classList.remove("active"));
        leaf.classList.add("active");

        const map = await groupData.get();
        await hider.isolate(map);

        try {
          const boundingBoxer = components.get(OBC.BoundingBoxer);
          boundingBoxer.list.clear();
          await boundingBoxer.addFromModelIdMap(map);
          const box = boundingBoxer.get();
          await world.camera.controls.fitToBox(box, true);
          boundingBoxer.list.clear();
        } catch (err) {
          console.warn("Fit to group failed:", err);
        }
      });

      childrenContainer.appendChild(leaf);
    }

    if (hasGroups) {
      classificationNode.appendChild(childrenContainer);
      treeContainer.appendChild(classificationNode);

      header.addEventListener("click", () => {
        const arrow = header.querySelector(".tree-arrow") as HTMLElement;
        if (childrenContainer.style.display === "none") {
          childrenContainer.style.display = "block";
          arrow.innerText = "▼";
        } else {
          childrenContainer.style.display = "none";
          arrow.innerText = "▶";
        }
      });
    }
  }
  // Sync Item Finder queries with newly populated category classification
  updateItemFinderQueries();
}

// Scene search filtering for classification tree
const sceneSearchInput = document.getElementById("scene-search") as HTMLInputElement;
const btnClearSceneSearch = document.getElementById("btn-clear-scene-search");

function filterSceneTree(filterText: string) {
  const query = filterText.trim().toLowerCase();
  if (btnClearSceneSearch) {
    if (query.length > 0) {
      btnClearSceneSearch.classList.remove("hidden");
    } else {
      btnClearSceneSearch.classList.add("hidden");
    }
  }

  const leafNodes = document.querySelectorAll("#classification-tree .tree-node-leaf");
  leafNodes.forEach((leaf) => {
    const label = leaf.querySelector(".tree-label")?.textContent?.toLowerCase() || "";
    if (!query || label.includes(query)) {
      (leaf as HTMLElement).style.display = "flex";
    } else {
      (leaf as HTMLElement).style.display = "none";
    }
  });

  // Also adjust parent folder nodes visibility if all children are hidden
  const groupNodes = document.querySelectorAll("#classification-tree .tree-node-group, #classification-tree .tree-group");
  groupNodes.forEach((group) => {
    if (!query) {
      (group as HTMLElement).style.display = "";
      return;
    }
    const visibleChildren = group.querySelectorAll('.tree-node-leaf[style*="display: flex"], .tree-node-leaf:not([style*="display: none"])');
    if (visibleChildren.length > 0) {
      (group as HTMLElement).style.display = "";
    } else {
      (group as HTMLElement).style.display = "none";
    }
  });
}

if (sceneSearchInput) {
  sceneSearchInput.addEventListener("input", () => {
    filterSceneTree(sceneSearchInput.value);
  });
}

if (btnClearSceneSearch && sceneSearchInput) {
  btnClearSceneSearch.addEventListener("click", () => {
    sceneSearchInput.value = "";
    filterSceneTree("");
    sceneSearchInput.focus();
  });
}

// --- 4D CONSTRUCTION TIMELINE SIMULATION ENGINE ---
const timelineSlider = document.getElementById("timeline-slider") as HTMLInputElement | null;
const timelinePlayBtn = document.getElementById("timeline-play-btn");
const timelineSpeedSelect = document.getElementById("timeline-speed") as HTMLSelectElement | null;

function calculateTimelineBounds() {
  let minTime = Infinity;
  let maxTime = -Infinity;
  let hasDates = false;

  for (const [, model] of fragments.list) {
    const anyModel = model as any;
    const modelId = anyModel.modelId || anyModel.uuid || anyModel.id || anyModel.object?.uuid || "default-model";
    const properties = anyModel.properties || anyModel.getLocalProperties?.() || {};

    for (const expressIdStr in properties) {
      const expressId = Number(expressIdStr);
      if (isNaN(expressId)) continue;

      const elementProps = properties[expressId];
      if (!elementProps) continue;

      const ifcType = String(elementProps.type ?? "").toUpperCase();
      const twinData = getOrGenerateTwinData(modelId, expressId, ifcType);

      if (twinData.startDate) {
        const start = new Date(twinData.startDate).getTime();
        if (start < minTime) minTime = start;
        hasDates = true;
      }
      if (twinData.endDate) {
        const end = new Date(twinData.endDate).getTime();
        if (end > maxTime) maxTime = end;
        hasDates = true;
      }
    }
  }

  if (hasDates && minTime !== Infinity && maxTime !== -Infinity) {
    timelineMinDate = new Date(minTime);
    timelineMaxDate = new Date(maxTime);
    
    // Add buffer: 1 day before start, 1 day after end
    timelineMinDate.setDate(timelineMinDate.getDate() - 1);
    timelineMaxDate.setDate(timelineMaxDate.getDate() + 1);

    currentTimelineDate = new Date(timelineMinDate);

    // Enable inputs
    const slider = document.getElementById("timeline-slider") as HTMLInputElement;
    const playBtn = document.getElementById("timeline-play-btn");

    if (slider) {
      slider.removeAttribute("disabled");
      const diffDays = Math.ceil((timelineMaxDate.getTime() - timelineMinDate.getTime()) / (1000 * 60 * 60 * 24));
      slider.max = String(diffDays);
      slider.value = "0";
    }
    if (playBtn) {
      playBtn.removeAttribute("disabled");
    }

    updateTimelineDateUI();
    updateTimelineVisualState();
  } else {
    // Generate default sample construction schedule bounds (60 days) so Play button & timeline scrubber are always active
    const start = new Date("2026-06-18");
    const end = new Date("2026-08-18");
    timelineMinDate = start;
    timelineMaxDate = end;
    currentTimelineDate = new Date(start);

    const slider = document.getElementById("timeline-slider") as HTMLInputElement;
    const playBtn = document.getElementById("timeline-play-btn");

    if (slider) {
      slider.removeAttribute("disabled");
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      slider.max = String(diffDays);
      slider.value = "0";
    }
    if (playBtn) {
      playBtn.removeAttribute("disabled");
    }

    updateTimelineDateUI();
    updateTimelineVisualState();
  }
}

function updateTimelineDateUI() {
  if (!currentTimelineDate) return;
  const badge = document.getElementById("timeline-date-badge");
  if (badge) {
    const year = currentTimelineDate.getFullYear();
    const month = String(currentTimelineDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentTimelineDate.getDate()).padStart(2, '0');
    badge.innerText = `${year}-${month}-${day}`;
  }
}

async function updateTimelineVisualState() {
  if (!currentTimelineDate) return;
  if (!is4dMode) return;

  const hider = components.get(OBC.Hider);
  
  // Clear previous timeline highlighting
  await highlighter.clear("timeline-planned");
  await highlighter.clear("timeline-inprogress");
  await highlighter.clear("timeline-completed");

  // Sync highlighter colors dynamically with color pickers / statusColors
  const plannedColor = (document.getElementById("4d-color-planned") as HTMLInputElement)?.value || ScheduleManager.statusColors['Planned'] || "#6b7280";
  const activeColor = (document.getElementById("4d-color-active") as HTMLInputElement)?.value || ScheduleManager.statusColors['In Progress'] || "#f59e0b";
  const completeColor = (document.getElementById("4d-color-complete") as HTMLInputElement)?.value || ScheduleManager.statusColors['Completed'] || "#10b981";

  const plannedStyle = highlighter.styles.get("timeline-planned");
  if (plannedStyle) plannedStyle.color.set(plannedColor);

  const activeStyle = highlighter.styles.get("timeline-inprogress");
  if (activeStyle) activeStyle.color.set(activeColor);

  const completeStyle = highlighter.styles.get("timeline-completed");
  if (completeStyle) completeStyle.color.set(completeColor);

  const plannedMap: Record<string, Set<number>> = {};
  const inProgressMap: Record<string, Set<number>> = {};
  const completedMap: Record<string, Set<number>> = {};

  let hasPlanned = false;
  let hasInProgress = false;
  let hasCompleted = false;

  for (const [, model] of fragments.list) {
    const anyModel = model as any;
    const modelId = anyModel.modelId || anyModel.uuid || anyModel.id || anyModel.object?.uuid || "default-model";
    const properties = anyModel.properties || anyModel.getLocalProperties?.() || {};

    const plannedIds = new Set<number>();
    const inProgressIds = new Set<number>();
    const completedIds = new Set<number>();

    for (const expressIdStr in properties) {
      const expressId = Number(expressIdStr);
      if (isNaN(expressId)) continue;

      const elementProps = properties[expressId];
      if (!elementProps) continue;

      const ifcType = String(elementProps.type ?? "").toUpperCase();
      const twinData = getOrGenerateTwinData(modelId, expressId, ifcType);

      const start = new Date(twinData.startDate);
      const end = new Date(twinData.endDate);

      // Compare dates (midnight boundary)
      const currentMs = currentTimelineDate.getTime();
      const startMs = start.getTime();
      const endMs = end.getTime();

      let status: "Planned" | "In Progress" | "Completed" = "Planned";
      if (currentMs < startMs) {
        plannedIds.add(expressId);
        status = "Planned";
      } else if (currentMs >= startMs && currentMs <= endMs) {
        inProgressIds.add(expressId);
        status = "In Progress";
      } else {
        completedIds.add(expressId);
        status = "Completed";
      }

      // Dynamic 4D properties update — preserve user-customized statuses
      if (!twinData.isCustomized) {
        twinData.status = status;
      }
    }

    if (plannedIds.size > 0) {
      plannedMap[modelId] = plannedIds;
      hasPlanned = true;
    }
    if (inProgressIds.size > 0) {
      inProgressMap[modelId] = inProgressIds;
      hasInProgress = true;
    }
    if (completedIds.size > 0) {
      completedMap[modelId] = completedIds;
      hasCompleted = true;
    }
  }

  // Update visibility & highlight with status colors
  if (hasPlanned) {
    await hider.set(false, plannedMap);
  }
  if (hasInProgress) {
    await hider.set(true, inProgressMap);
    await highlighter.highlightByID("timeline-inprogress", inProgressMap, false, false);
  }
  if (hasCompleted) {
    await hider.set(true, completedMap);
    await highlighter.highlightByID("timeline-completed", completedMap, false, false);
  }

  // Sync selected element inputs dynamically if properties panel is open for it
  if (activeModelId && activeExpressId !== null) {
    const selectedModel = fragments.list.get(activeModelId) as any;
    if (selectedModel && selectedModel.properties && selectedModel.properties[activeExpressId]) {
      const ifcType = String(selectedModel.properties[activeExpressId].type ?? "").toUpperCase();
      const twinData = getOrGenerateTwinData(activeModelId, activeExpressId, ifcType);
      
      const elStatus = document.getElementById("sched-status") as HTMLSelectElement;
      if (elStatus) elStatus.value = twinData.status;

      const elCostTotal = document.getElementById("cost-calculated-total");
      if (elCostTotal) elCostTotal.innerText = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD"
      }).format(twinData.calculatedCost);
    }
  }

  // Update real-time stats and timeline progress bar on dashboard
  updateDashboardMetrics();
  updateScheduleWidgetUI();

  fragments.core.update(true);
}

function updateScheduleWidgetUI() {
  const container = document.getElementById("schedule-tasks-list");
  if (!container) return;

  if (fragments.list.size === 0) {
    container.innerHTML = `<div class="empty-state">Load a model to view the construction schedule.</div>`;
    return;
  }

  // Aggregate stats per task name
  const taskStats: Record<string, {
    startDate: string;
    endDate: string;
    totalCount: number;
    completedCount: number;
    modelIdMaps: Record<string, Set<number>>;
  }> = {};

  for (const [, model] of fragments.list) {
    const anyModel = model as any;
    const modelId = anyModel.modelId || anyModel.uuid || anyModel.id || anyModel.object?.uuid || "default-model";
    const properties = anyModel.properties || anyModel.getLocalProperties?.() || {};

    for (const expressIdStr in properties) {
      const expressId = Number(expressIdStr);
      if (isNaN(expressId)) continue;

      const elementProps = properties[expressId];
      if (!elementProps) continue;

      const ifcType = String(elementProps.type ?? "").toUpperCase();
      const twinData = getOrGenerateTwinData(modelId, expressId, ifcType);

      const taskName = twinData.task;
      if (!taskStats[taskName]) {
        taskStats[taskName] = {
          startDate: twinData.startDate,
          endDate: twinData.endDate,
          totalCount: 0,
          completedCount: 0,
          modelIdMaps: {},
        };
      }

      const stats = taskStats[taskName];
      stats.totalCount++;
      if (twinData.status === "Completed") {
        stats.completedCount++;
      }

      // Update min/max dates
      if (new Date(twinData.startDate) < new Date(stats.startDate)) {
        stats.startDate = twinData.startDate;
      }
      if (new Date(twinData.endDate) > new Date(stats.endDate)) {
        stats.endDate = twinData.endDate;
      }

      // Add to model map for isolation
      if (!stats.modelIdMaps[modelId]) {
        stats.modelIdMaps[modelId] = new Set<number>();
      }
      stats.modelIdMaps[modelId].add(expressId);
    }
  }

  container.innerHTML = "";
  
  // Sort tasks by start date
  const sortedTasks = Object.entries(taskStats).sort((a, b) => {
    return new Date(a[1].startDate).getTime() - new Date(b[1].startDate).getTime();
  });

  for (const [taskName, stats] of sortedTasks) {
    const item = document.createElement("div");
    item.className = "schedule-task-item";
    
    // Determine overall task status
    let taskStatus: "Planned" | "In Progress" | "Completed" = "Planned";
    if (stats.completedCount === stats.totalCount) {
      taskStatus = "Completed";
    } else if (stats.completedCount > 0) {
      taskStatus = "In Progress";
    }
    
    // Check if the current timeline date is within this task's date range
    if (currentTimelineDate) {
      const currentMs = currentTimelineDate.getTime();
      const startMs = new Date(stats.startDate).getTime();
      const endMs = new Date(stats.endDate).getTime();
      if (currentMs >= startMs && currentMs <= endMs) {
        item.classList.add("active-task");
      }
    }

    const pct = Math.round((stats.completedCount / stats.totalCount) * 100);
    const badgeClass = taskStatus === "Completed" ? "task-badge-complete" : (taskStatus === "In Progress" ? "task-badge-active" : "task-badge-planned");

    item.innerHTML = `
      <div class="task-header-row">
        <span class="task-title" title="${taskName}">${taskName}</span>
        <span class="task-status-badge ${badgeClass}">${taskStatus}</span>
      </div>
      <div class="task-date-info">
        <span>Start: ${stats.startDate}</span>
        <span>End: ${stats.endDate}</span>
      </div>
      <div class="task-progress-row">
        <div class="task-progress-bar">
          <div class="task-progress-fill" style="width: ${pct}%"></div>
        </div>
        <span>${pct}% (${stats.completedCount}/${stats.totalCount})</span>
      </div>
    `;

    // Click event to isolate task elements and jump scrubber/timeline to task start date!
    item.addEventListener("click", async () => {
      // Isolate elements
      const hider = components.get(OBC.Hider);
      await hider.isolate(stats.modelIdMaps);
      
      // Focus Camera on isolated elements
      try {
        const boundingBoxer = components.get(OBC.BoundingBoxer);
        boundingBoxer.list.clear();
        await boundingBoxer.addFromModelIdMap(stats.modelIdMaps);
        const box = boundingBoxer.get();
        await world.camera.controls.fitToBox(box, true);
        boundingBoxer.list.clear();
      } catch (err) {
        console.warn("Fit to task elements failed:", err);
      }

      // Jump timeline scrubber to task's start date
      if (timelineMinDate) {
        const taskStart = new Date(stats.startDate);
        currentTimelineDate = new Date(taskStart);
        const diffMs = currentTimelineDate.getTime() - timelineMinDate.getTime();
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        if (timelineSlider) {
          timelineSlider.value = String(diffDays);
        }
        
        updateTimelineDateUI();
        await updateTimelineVisualState();
      }

      // Auto-collapse sidebar drawer on mobile for direct viewport visibility
      if (window.innerWidth <= 1024) {
        if (typeof (window as any).closeAllSidebars === 'function') {
          (window as any).closeAllSidebars();
        }
      }
    });

    container.appendChild(item);
  }
}

function startTimelinePlayback() {
  if (timelineIsPlaying || !timelineMinDate) return;
  timelineIsPlaying = true;
  if (timelinePlayBtn) {
    timelinePlayBtn.classList.add("playing");
    timelinePlayBtn.innerHTML = `
      <span class="ctrl-icon">⏸</span>
      <span>Pause Simulation</span>
    `;
  }

  let lastTime = performance.now();
  const tick = () => {
    if (!timelineIsPlaying || !timelineMinDate || !timelineMaxDate || !currentTimelineDate) return;
    
    const now = performance.now();
    const elapsedSec = (now - lastTime) / 1000;
    lastTime = now;

    // Increment date based on speed (days per second)
    const daysToIncrement = elapsedSec * timelineSpeed;
    const newMs = currentTimelineDate.getTime() + (daysToIncrement * 24 * 60 * 60 * 1000);

    if (newMs >= timelineMaxDate.getTime()) {
      currentTimelineDate = new Date(timelineMaxDate);
      if (timelineSlider) {
        timelineSlider.value = timelineSlider.max;
      }
      updateTimelineDateUI();
      updateTimelineVisualState();
      stopTimelinePlayback();
    } else {
      currentTimelineDate = new Date(newMs);
      const diffMs = currentTimelineDate.getTime() - timelineMinDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (timelineSlider) {
        timelineSlider.value = String(diffDays);
      }
      updateTimelineDateUI();
      updateTimelineVisualState();
      timelineTimer = requestAnimationFrame(tick);
    }
  };

  timelineTimer = requestAnimationFrame(tick);
}

function stopTimelinePlayback() {
  timelineIsPlaying = false;
  if (timelineTimer) {
    cancelAnimationFrame(timelineTimer);
    timelineTimer = null;
  }
  const btn = document.getElementById("timeline-play-btn");
  if (btn) {
    btn.classList.remove("playing");
    btn.innerHTML = `
      <span class="ctrl-icon">▶</span>
      <span>Play Simulation</span>
    `;
  }
}

// Scrubber events
if (timelineSlider) {
  timelineSlider.addEventListener("input", () => {
    if (!timelineMinDate) return;
    const daysOffset = Number(timelineSlider.value);
    currentTimelineDate = new Date(timelineMinDate.getTime() + (daysOffset * 24 * 60 * 60 * 1000));
    updateTimelineDateUI();
    updateTimelineVisualState();
  });
}

if (timelinePlayBtn) {
  const handleTogglePlay = () => {
    if (timelineIsPlaying) {
      stopTimelinePlayback();
    } else {
      // If we are at the end, restart from beginning
      if (currentTimelineDate && timelineMaxDate && currentTimelineDate.getTime() >= timelineMaxDate.getTime()) {
        currentTimelineDate = new Date(timelineMinDate!);
        if (timelineSlider) {
          timelineSlider.value = "0";
        }
      }
      startTimelinePlayback();
    }
  };
  timelinePlayBtn.addEventListener("click", handleTogglePlay);
  (window as any).toggleTimelinePlayback = handleTogglePlay;
}

if (timelineSpeedSelect) {
  timelineSpeedSelect.addEventListener("change", () => {
    timelineSpeed = Number(timelineSpeedSelect.value);
  });
}

// Initial empty state call
updateClassificationUI();
calculateTimelineBounds();

// --- 4D MODE TOGGLE ---
function updateHeaderLabel() {
  const labelEl = document.getElementById('project-header-label');
  if (!labelEl) return;
  
  let projectName = "Projects";
  if (fragments.list.size > 0) {
    // Get the name of the first loaded model
    const firstEntry = fragments.list.entries().next().value;
    if (firstEntry) {
      const [firstModelId, firstModel] = firstEntry as [string, any];
      const anyModel = firstModel as any;
      const rawName = anyModel.modelId || anyModel.name || firstModelId;
      projectName = rawName.replace(/\.[^/.]+$/, ""); // strip extension
    }
  }
  
  const modeName = is4dMode ? "4D Simulation" : "Viewer";
  labelEl.textContent = `${projectName} - ${modeName}`;
}

function apply4dMode(active: boolean) {
  is4dMode = active;
  localStorage.setItem('bim-4d-mode', String(active));

  const btn4dMode = document.getElementById('btn-4d-mode');
  const btn4dLabel = document.getElementById('btn-4d-label');

  if (active) {
    document.body.classList.add('mode-4d');
    if (btn4dMode) btn4dMode.classList.add('active');
    if (btn4dLabel) btn4dLabel.textContent = 'Exit 4D';
    // Initialize timeline when 4D is activated
    calculateTimelineBounds();
    updateScheduleWidgetUI();
    updateTimelineVisualState();
    // Auto-open 4D Schedule drawer panel on left sidebar for immediate access
    if (typeof (window as any).switchSidebarTab === 'function') {
      (window as any).switchSidebarTab('left-tab-bar', 'schedule');
    }
  } else {
    document.body.classList.remove('mode-4d');
    if (btn4dMode) btn4dMode.classList.remove('active');
    if (btn4dLabel) btn4dLabel.textContent = 'Activate 4D';
    // Stop playback and restore all element visibility when leaving 4D mode
    stopTimelinePlayback();
    const hider = components.get(OBC.Hider);
    hider.set(true);
    highlighter.clear("timeline-planned");
    highlighter.clear("timeline-inprogress");
    highlighter.clear("timeline-completed");
  }
  updateHeaderLabel();
}

// Restore last 4D mode state on load
apply4dMode(is4dMode);

const btn4dToggle = document.getElementById('btn-4d-mode');
if (btn4dToggle) {
  btn4dToggle.addEventListener('click', () => {
    apply4dMode(!is4dMode);
  });
}

(window as any).toggle4DMode = (active?: boolean) => {
  apply4dMode(typeof active === 'boolean' ? active : !is4dMode);
};

// --- 3D VIEW CUBE CONTROLLER ---
async function orientCameraToFace(face: string) {
  const target = new THREE.Vector3();
  world.camera.controls.getTarget(target);

  const boxer = components.get(OBC.BoundingBoxer);
  boxer.list.clear();
  boxer.addFromModels();
  const bbox = boxer.get();
  boxer.list.clear();

  let center = new THREE.Vector3();
  let d = 20;
  if (!bbox.isEmpty()) {
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    d = Math.max(size.x, size.y, size.z) * 1.5;
  } else {
    center.copy(target);
    d = world.camera.controls.distance || 20;
  }

  let posX = center.x;
  let posY = center.y;
  let posZ = center.z;

  switch (face) {
    case "front": posZ += d; break;
    case "back": posZ -= d; break;
    case "left": posX -= d; break;
    case "right": posX += d; break;
    case "top": posY += d; break;
    case "bottom": posY -= d; break;
  }

  await world.camera.controls.setLookAt(posX, posY, posZ, center.x, center.y, center.z, true);
}

const viewCube = document.getElementById("view-cube") as any;
if (viewCube) {
  viewCube.camera = world.camera.three;

  world.camera.controls.addEventListener("update", () => viewCube.updateOrientation());
  world.camera.controls.addEventListener("control", () => viewCube.updateOrientation());

  viewCube.addEventListener("drag", (e: any) => {
    world.camera.controls.rotate(e.detail.dx, e.detail.dy, false);
  });

  viewCube.addEventListener("frontclick", () => orientCameraToFace("front"));
  viewCube.addEventListener("backclick", () => orientCameraToFace("back"));
  viewCube.addEventListener("leftclick", () => orientCameraToFace("left"));
  viewCube.addEventListener("rightclick", () => orientCameraToFace("right"));
  viewCube.addEventListener("topclick", () => orientCameraToFace("top"));
  viewCube.addEventListener("bottomclick", () => orientCameraToFace("bottom"));
  viewCube.addEventListener("homeclick", () => {
    activateIsometric3DView();
  });
  viewCube.addEventListener("cardinalclick", (e: any) => {
    const cardinal = e.detail?.cardinal;
    if (cardinal === "north") orientCameraToFace("back");
    else if (cardinal === "south") orientCameraToFace("front");
    else if (cardinal === "east") orientCameraToFace("right");
    else if (cardinal === "west") orientCameraToFace("left");
  });
}

// --- QUICK VIEW TOOLBAR & CAMERA PROJECTION CONTROLLER ---
async function setCameraProjection(projectionMode: "Orthographic" | "Perspective") {
  try {
    if (typeof (world.camera as any).set === "function") {
      await (world.camera as any).set(projectionMode);
    } else if (world.camera.projection && typeof world.camera.projection.set === "function") {
      await world.camera.projection.set(projectionMode);
    } else if (typeof (world.camera as any).setProjection === "function") {
      await (world.camera as any).setProjection(projectionMode);
    }

    // Sync dropdown UI
    const projectionSelect = document.getElementById("settings-camera-projection") as HTMLSelectElement | null;
    if (projectionSelect && projectionSelect.value !== projectionMode) {
      projectionSelect.value = projectionMode;
    }

    if (viewCube && world.camera.three) {
      viewCube.camera = world.camera.three;
      viewCube.updateOrientation();
    }
  } catch (err) {
    console.warn("Failed to set camera projection mode:", err);
  }
}

async function activateIsometric3DView() {
  // 1. Switch camera back to Perspective projection
  await setCameraProjection("Perspective");

  // Sync camera mode dropdown to Orbit
  const settingsCameraMode = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
  if (settingsCameraMode && settingsCameraMode.value !== "Orbit") {
    settingsCameraMode.value = "Orbit";
  }

  // 2. Compute true model bounding box across all active BIM models & fragments
  const bbox = new THREE.Box3();
  try {
    const boxer = components.get(OBC.BoundingBoxer);
    boxer.list.clear();
    boxer.addFromModels();
    const b = boxer.get();
    if (!b.isEmpty()) {
      bbox.copy(b);
    }
    boxer.list.clear();
  } catch (_) {}

  // Fallback: Check fragments.list if boxer returned empty
  if (bbox.isEmpty()) {
    for (const [, model] of fragments.list) {
      const modelObj = (model.object || model) as THREE.Object3D;
      if (modelObj) {
        bbox.expandByObject(modelObj);
      }
    }
  }

  let center = new THREE.Vector3(0, 0, 0);
  let dist = 28;

  if (!bbox.isEmpty()) {
    bbox.getCenter(center);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const radius = Math.max(size.length() * 0.5, maxDim * 0.75, 4);

    const persCam = world.camera.three as THREE.PerspectiveCamera;
    const fov = ((persCam?.fov || 45) * Math.PI) / 180;
    // Mathematically fitted distance to frame the entire model volume cleanly
    dist = (radius / Math.sin(fov / 2)) * 1.15;
  } else {
    world.camera.controls.getTarget(center);
    dist = 25;
  }

  // Canonical 3D Isometric unit vector (1, 1, 1) normalized -> looking from Front-Right-Top towards model center
  const isoNorm = 1 / Math.sqrt(3);
  const posX = center.x + isoNorm * dist;
  const posY = center.y + isoNorm * dist;
  const posZ = center.z + isoNorm * dist;

  await world.camera.controls.setLookAt(posX, posY, posZ, center.x, center.y, center.z, true);
  if (tickerCamMode) tickerCamMode.textContent = "3D PERSPECTIVE ISOMETRIC";
}
(window as any).activateIsometric3DView = activateIsometric3DView;
(window as any).fitView = activateIsometric3DView;

const btnViewFit = document.getElementById("btn-view-fit");
const btnViewTop = document.getElementById("btn-view-top");
const btnViewIso = document.getElementById("btn-view-iso");
const tickerCamMode = document.getElementById("ticker-camera-mode");

if (btnViewFit) {
  btnViewFit.addEventListener("click", async () => {
    try {
      const boxer = components.get(OBC.BoundingBoxer);
      boxer.list.clear();
      boxer.addFromModels();
      const bbox = boxer.get();
      boxer.list.clear();
      if (!bbox.isEmpty()) {
        await world.camera.controls.fitToBox(bbox, true);
      }
    } catch (err) {
      console.warn("Fit view failed:", err);
    }
  });
}

if (btnViewTop) {
  btnViewTop.addEventListener("click", async () => {
    // 1. Switch camera to Orthographic mode for clean 2D floor plan view
    await setCameraProjection("Orthographic");
    // 2. Orient camera top-down over model center
    await orientCameraToFace("top");
    // 3. Update status indicator & dropdown
    if (tickerCamMode) tickerCamMode.textContent = "2D ORTHOGRAPHIC TOP PLAN";
    const settingsCameraMode = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
    if (settingsCameraMode && settingsCameraMode.value !== "Plan") {
      settingsCameraMode.value = "Plan";
    }
  });
}

if (btnViewIso) {
  btnViewIso.addEventListener("click", () => activateIsometric3DView());
}

const btnViewSnapshot = document.getElementById("btn-view-snapshot");
if (btnViewSnapshot) {
  btnViewSnapshot.addEventListener("click", () => {
    SnapshotModule.getInstance().captureTechnicalSnapshot();
  });
}

const btnQuickExplode = document.getElementById("btn-quick-explode");
let isQuickExploded = false;
if (btnQuickExplode) {
  btnQuickExplode.addEventListener("click", () => {
    isQuickExploded = !isQuickExploded;
    const targetVal = isQuickExploded ? 65 : 0;
    const slider = document.getElementById("settings-explosion-slider") as HTMLInputElement | null;
    if (slider) {
      slider.value = String(targetVal);
      slider.dispatchEvent(new Event("input"));
    } else {
      ExplosionModule.getInstance().setExplosionFactor(targetVal / 100);
    }
    btnQuickExplode.classList.toggle("active", isQuickExploded);
    const txt = document.getElementById("quick-explode-text");
    if (txt) txt.textContent = isQuickExploded ? "Assemble" : "Explode";
  });
}

window.addEventListener("resize", () => {
  if (window.innerWidth > 1024) {
    if (typeof (window as any).closeAllSidebars === "function") {
      (window as any).closeAllSidebars();
    }
  }
});

// --- COLLAPSIBLE PANEL HEADERS WITH MINIMIZE BUTTONS ---
document.querySelectorAll(".panel").forEach((panel) => {
  const header = panel.querySelector(".panel-header");
  if (!header) return;

  // Symmetrical layout alignment: ensure header has title group and minimize button
  let titleGroup = header.querySelector(".header-title-group");
  if (!titleGroup) {
    titleGroup = document.createElement("div");
    titleGroup.className = "header-title-group";
    
    // Move all current children to the title group
    while (header.firstChild) {
      titleGroup.appendChild(header.firstChild);
    }
    header.appendChild(titleGroup);
  }

  // Create minimize button on the right side of header
  const minimizeBtn = document.createElement("button");
  minimizeBtn.className = "btn-panel-minimize";
  minimizeBtn.innerHTML = `
    <svg class="minimize-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>
  `;
  header.appendChild(minimizeBtn);

  // Toggle collapse class on header click
  header.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.closest("select") || target.closest("input") || target.closest("a") || target.closest("button:not(.btn-panel-minimize)")) {
      return;
    }
    panel.classList.toggle("collapsed");
  });
});

// Initial update
setTimeout(() => { if (viewCube) viewCube.updateOrientation(); }, 500);

// Auto-show Help Modal on first visit
const FIRST_VISIT_KEY = "bim-help-dont-show";
if (!localStorage.getItem(FIRST_VISIT_KEY)) {
  setTimeout(() => {
    if (typeof (window as any).toggleShortcutsModal === "function") {
      (window as any).toggleShortcutsModal(true);
    }
  }, 800);
}

// ============================================================
// TIMELINE SPEED PILLS CONTROLLER
// ============================================================
const speedPills = document.querySelectorAll("#timeline-speed-pills .btn-speed-pill");
speedPills.forEach((pill) => {
  pill.addEventListener("click", () => {
    speedPills.forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    const speedVal = pill.getAttribute("data-speed");
    if (speedVal && timelineSpeedSelect) {
      timelineSpeedSelect.value = speedVal;
      timelineSpeedSelect.dispatchEvent(new Event("change"));
    }
  });
});

// Trigger initial cost calculation & expose globally
updateCumulative5DCost();
(window as any).updateCumulative5DCost = updateCumulative5DCost;


// ============================================================
// NEO-BRUTALIST TOAST NOTIFICATION QUEUE
// ============================================================
export function showToast(message: string, icon: string = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`, durationMs: number = 3200) {
  const container = document.getElementById("bim-toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.style.cssText = `
    background: var(--bg-panel, #18181b);
    color: var(--text-primary, #ffffff);
    border: 2px solid var(--border-strong, #000000);
    border-radius: 4px;
    padding: 0.5rem 0.85rem;
    box-shadow: var(--shadow-brutal, 4px 4px 0px #000000);
    font-size: 0.72rem;
    font-weight: 800;
    font-family: var(--font-body, sans-serif);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    pointer-events: auto;
    animation: popIn 0.15s ease-out;
    max-width: 320px;
  `;

  toast.innerHTML = `
    <span style="display: inline-flex; align-items: center; flex-shrink: 0;">${icon}</span>
    <span style="flex: 1; line-height: 1.35;">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 220);
  }, durationMs);
}
(window as any).showToast = showToast;

// Wire Tour Button
const btnStartPinTour = document.getElementById("btn-start-pin-tour");
if (btnStartPinTour) {
  btnStartPinTour.addEventListener("click", () => {
    AnnotationModule.getInstance().startTour();
    showToast("Starting Guided 3D Issue Tour", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`);
  });
}

// ============================================================
// COMMAND PALETTE (CTRL+K / CMD+K) CONTROLLER
// ============================================================
const cmdModal = document.getElementById("command-palette-modal");
const cmdInput = document.getElementById("command-palette-input") as HTMLInputElement | null;
const cmdResults = document.getElementById("command-palette-results");
const btnOpenCmd = document.getElementById("btn-open-command-palette");

let selectedCmdIndex = 0;

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: string;
  action: () => void;
}

const getCommandRegistry = (): CommandItem[] => {
  const list: CommandItem[] = [
    // Navigation Tabs
    { id: "global-search", title: "Global BIM Search (GUID, Name, Property Values)", category: "Search", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`, action: () => GlobalSearchOverlay.getInstance().open() },
    { id: "tab-files", title: "Project Files & IFC Upload", category: "Navigation", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`, action: () => (window as any).switchSidebarTab?.("left-tab-bar", "files") },
    { id: "tab-finder", title: "Items Finder & Storey Filter", category: "Navigation", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`, action: () => (window as any).switchSidebarTab?.("left-tab-bar", "finder") },
    { id: "tab-4d", title: "4D Construction Schedule", category: "Navigation", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`, action: () => (window as any).switchSidebarTab?.("left-tab-bar", "schedule") },
    { id: "tab-scene", title: "Scene Tree & Post-Processing", category: "Navigation", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="12 2 2 12 5 12 5 22 19 22 19 12 22 12 12 2"/></svg>`, action: () => (window as any).switchSidebarTab?.("right-tab-bar", "scene") },
    { id: "tab-inspector", title: "Element Properties & 5D Inspector", category: "Navigation", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`, action: () => (window as any).switchSidebarTab?.("right-tab-bar", "inspector") },
    { id: "tab-tools", title: "Tools (Measure / Pins / Section / Explode)", category: "Navigation", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`, action: () => (window as any).switchSidebarTab?.("right-tab-bar", "tools") },
    { id: "tab-camera", title: "First Person Camera Controls", category: "Navigation", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/></svg>`, action: () => (window as any).switchSidebarTab?.("right-tab-bar", "camera") },
    
    // Viewport & Tools
    { id: "tool-fit", title: "Fit Geometry in View (Home)", category: "Viewport", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`, action: () => (window as any).fitView?.() },
    { id: "tool-4d-toggle", title: "Toggle 4D Construction Simulation", category: "4D Simulation", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`, action: () => document.getElementById("btn-4d-mode")?.click() },
    { id: "tool-pin-tour", title: "Play Guided 3D Issue Tour", category: "Collaboration", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="5 3 19 12 5 21 5 3"/></svg>`, action: () => AnnotationModule.getInstance().startTour() },
    { id: "tool-export-bcf", title: "Export Pins (BCF / JSON Report)", category: "Collaboration", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`, action: () => AnnotationModule.getInstance().exportBCFJSON() },
    { id: "tool-xray-toggle", title: "Toggle X-Ray Isolation Mode", category: "Display", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4"/><circle cx="12" cy="12" r="3"/></svg>`, action: () => AnnotationModule.getInstance().toggleXRay() },
    { id: "tool-help", title: "Open Help & Tutorial Guide (?)", category: "Help", icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`, action: () => (window as any).toggleShortcutsModal?.(true) },

  ];

  // Add all active 3D pins dynamically
  const pins = AnnotationModule.getInstance().getAnnotations();
  pins.forEach(pin => {
    list.push({
      id: `pin-${pin.id}`,
      title: `Pin #${pin.number}: ${pin.title} (${pin.category})`,
      category: "Field Pins",
      icon: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
      action: () => {
        AnnotationModule.getInstance().selectPin(pin.id);
        AnnotationModule.getInstance().showPinDetailsModal(pin);
      }
    });
  });

  return list;
};


const openCommandPalette = () => {
  if (!cmdModal) return;
  cmdModal.style.display = "flex";
  if (cmdInput) {
    cmdInput.value = "";
    cmdInput.focus();
  }
  selectedCmdIndex = 0;
  renderCommandResults("");
};

const closeCommandPalette = () => {
  if (!cmdModal) return;
  cmdModal.style.display = "none";
};

const renderCommandResults = (query: string) => {
  if (!cmdResults) return;
  cmdResults.innerHTML = "";
  const allCmds = getCommandRegistry();
  const q = query.toLowerCase().trim();

  const filtered = q
    ? allCmds.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q))
    : allCmds;

  if (filtered.length === 0) {
    cmdResults.innerHTML = `<div style="font-size: 0.68rem; color: var(--text-muted); padding: 0.6rem; text-align: center;">No matching actions or elements found.</div>`;
    return;
  }

  filtered.forEach((cmd, idx) => {
    const isSelected = idx === selectedCmdIndex;
    const itemEl = document.createElement("div");
    itemEl.className = "command-item";
    itemEl.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.45rem 0.65rem;
      border-radius: 4px;
      cursor: pointer;
      background: ${isSelected ? "var(--accent-500)" : "transparent"};
      border: 1.5px solid ${isSelected ? "var(--accent-500)" : "transparent"};
    `;

    const selectedTextColor = isSelected ? "#000000" : "var(--text-primary)";
    const selectedMutedColor = isSelected ? "#000000" : "var(--text-muted)";
    const selectedBadgeBg = isSelected ? "rgba(0,0,0,0.15)" : "var(--bg-card)";

    itemEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        <span style="font-size: 0.85rem; ${isSelected ? 'filter: brightness(0);' : ''}">${cmd.icon}</span>
        <span style="font-size: 0.72rem; font-weight: 700; color: ${selectedTextColor};">${cmd.title}</span>
      </div>
      <span style="font-size: 0.56rem; font-weight: 800; text-transform: uppercase; background: ${selectedBadgeBg}; border: 1px solid ${isSelected ? 'rgba(0,0,0,0.2)' : 'var(--border-subtle)'}; padding: 0.1rem 0.35rem; border-radius: 2px; color: ${selectedMutedColor};">${cmd.category}</span>
    `;

    itemEl.addEventListener("click", () => {
      cmd.action();
      closeCommandPalette();
    });

    cmdResults.appendChild(itemEl);
  });
};

if (btnOpenCmd) {
  btnOpenCmd.addEventListener("click", () => {
    GlobalSearchOverlay.getInstance().open();
  });
}

if (cmdInput) {
  cmdInput.addEventListener("input", () => {
    selectedCmdIndex = 0;
    renderCommandResults(cmdInput.value);
  });

  cmdInput.addEventListener("keydown", (e: KeyboardEvent) => {
    const allCmds = getCommandRegistry();
    const q = cmdInput.value.toLowerCase().trim();
    const filtered = q ? allCmds.filter(c => c.title.toLowerCase().includes(q) || c.category.toLowerCase().includes(q)) : allCmds;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedCmdIndex = (selectedCmdIndex + 1) % Math.max(1, filtered.length);
      renderCommandResults(cmdInput.value);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedCmdIndex = (selectedCmdIndex - 1 + filtered.length) % Math.max(1, filtered.length);
      renderCommandResults(cmdInput.value);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedCmdIndex]) {
        filtered[selectedCmdIndex].action();
        closeCommandPalette();
      }
    } else if (e.key === "Escape") {
      closeCommandPalette();
    }
  });
}

// Global Keyboard Shortcut for Command Palette (Ctrl+K or Cmd+K)
window.addEventListener("keydown", (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    if (cmdModal && cmdModal.style.display === "flex") {
      closeCommandPalette();
    } else {
      openCommandPalette();
    }
  }
});

// Close command palette when clicking outside
if (cmdModal) {
  cmdModal.addEventListener("click", (e) => {
    if (e.target === cmdModal) closeCommandPalette();
  });
}

// ============================================================
// RIGHT-CLICK SMART CONTEXT MENU FOR VIEWPORT
// ============================================================
const ctxMenu = document.getElementById("bim-context-menu");
const ctxTitle = document.getElementById("ctx-element-title");

let ctxHitPoint: THREE.Vector3 | null = null;
let ctxModelId: string | undefined = undefined;
let ctxExpressId: number | undefined = undefined;
let ctxElementName: string | undefined = undefined;

container.addEventListener("contextmenu", async (e: MouseEvent) => {
  e.preventDefault();
  if (!ctxMenu) return;

  const rect = container.getBoundingClientRect();
  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );

  ctxHitPoint = null;
  ctxModelId = undefined;
  ctxExpressId = undefined;
  ctxElementName = undefined;

  // Raycast against IFC elements
  try {
    const caster = components.get(OBC.Raycasters).get(world);
    const result = (await caster.castRay()) as any;
    if (result && result.point) {
      ctxHitPoint = result.point.clone();
      if (result.fragments?.modelId && result.localId !== undefined) {
        ctxModelId = result.fragments.modelId;
        ctxExpressId = result.localId;
        if (typeof ctxExpressId === "number") {
          ctxElementName = resolveElementTag(ctxExpressId);
        }
      }
    }
  } catch (err) {
    // fallback
  }

  if (!ctxHitPoint) {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, world.camera.three);
    const target = new THREE.Vector3();
    world.camera.controls.getTarget(target);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -target.y);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(plane, hit)) {
      ctxHitPoint = hit;
    } else {
      ctxHitPoint = target;
    }
  }

  if (ctxTitle) {
    ctxTitle.innerHTML = ctxElementName 
      ? `<span style="display: inline-flex; align-items: center; gap: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> ${ctxElementName}</span>`
      : `<span style="display: inline-flex; align-items: center; gap: 0.25rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg> 3D Point Coordinates</span>`;
  }

  ctxMenu.style.display = "flex";
  ctxMenu.style.left = `${Math.min(window.innerWidth - 200, e.clientX)}px`;
  ctxMenu.style.top = `${Math.min(window.innerHeight - 200, e.clientY)}px`;
});

// Close context menu on outside click
document.addEventListener("pointerdown", (e: MouseEvent) => {
  if (ctxMenu && !ctxMenu.contains(e.target as Node)) {
    ctxMenu.style.display = "none";
  }
});

// Context Menu Action Listeners
if (ctxMenu) {
  ctxMenu.querySelectorAll(".ctx-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.getAttribute("data-action");
      ctxMenu.style.display = "none";

      if (action === "drop-pin" && ctxHitPoint) {
        AnnotationModule.getInstance().addAnnotation(
          ctxHitPoint,
          "Inspection Pin",
          "Recorded via Smart Context Menu.",
          "Inspection",
          ctxModelId,
          ctxExpressId,
          ctxElementName
        );
        showToast(`3D Pin placed on ${ctxElementName || "Model"}`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>`);
      } else if (action === "properties" && ctxModelId && ctxExpressId !== undefined) {
        const fragments = components.get(OBC.FragmentsManager);
        const model = fragments.list.get(ctxModelId);
        if (model) {
          displayElementProperties(model, ctxExpressId);
          (window as any).switchSidebarTab?.("right-tab-bar", "inspector");
        }
      } else if (action === "xray" && ctxModelId && ctxExpressId !== undefined) {
        AnnotationModule.getInstance().toggleXRay();
        showToast("Toggled X-Ray Mode", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4"/><circle cx="12" cy="12" r="3"/></svg>`);
      } else if (action === "isolate" && ctxModelId && ctxExpressId !== undefined) {
        const highlighter = components.get(OBF.Highlighter);
        if (highlighter) {
          highlighter.highlightByID("select", { [ctxModelId]: new Set([ctxExpressId]) }, true, true);
          showToast(`Isolated ${ctxElementName || "Element"}`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`);
        }
      } else if (action === "focus" && ctxHitPoint) {
        world.camera.controls.setLookAt(ctxHitPoint.x + 4, ctxHitPoint.y + 3, ctxHitPoint.z + 4, ctxHitPoint.x, ctxHitPoint.y, ctxHitPoint.z, true);
        showToast("Focused Camera on Target", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`);
      }
    });
  });
}

// --- HUD Statistics Updater ---
let hudLastTime = performance.now();
let hudFrames = 0;
let hudFps = 0;
let currentEntities = 0;
let currentPolygons = 0;

async function updateHUDData() {
  const renderer = world.renderer?.three;
  if (renderer && renderer.info) {
    currentPolygons = renderer.info.render.triangles;
  }
  
  let totalEntities = 0;
  if (fragments && fragments.list) {
    for (const [_, model] of fragments.list) {
      if (model.getItemsIdsWithGeometry) {
         try {
           const ids = await model.getItemsIdsWithGeometry();
           totalEntities += ids.length;
         } catch (e) {
           // ignore errors if they occur
         }
      } else if ((model as any).object?.children) {
         totalEntities += (model as any).object.children.length;
      }
    }
  }
  currentEntities = totalEntities;
}

function renderHUD() {
  const now = performance.now();
  hudFrames++;
  if (now >= hudLastTime + 1000) {
    hudFps = Math.round((hudFrames * 1000) / (now - hudLastTime));
    hudFrames = 0;
    hudLastTime = now;
    
    const fpsEl = document.getElementById("hud-fps");
    if (fpsEl) fpsEl.innerText = hudFps.toString();
    
    const polyEl = document.getElementById("hud-polygons");
    if (polyEl) polyEl.innerText = currentPolygons.toLocaleString();
    
    const entEl = document.getElementById("hud-entities");
    if (entEl) entEl.innerText = currentEntities.toLocaleString();
    
    // Trigger async data update for next tick so it doesn't block rendering
    updateHUDData();
  }
  
  requestAnimationFrame(renderHUD);
}
requestAnimationFrame(renderHUD);

// ═════════════════════════════════════════════════════════════════════
// ─── ENTERPRISE BIM SUITES INITIALIZATION & DRAWER CONTROLS ──────────
// ═════════════════════════════════════════════════════════════════════

const measurementSuite = MeasurementSuite.getInstance();
const clashDetector = ClashDetector.getInstance();
const carbonManager = CarbonLcaManager.getInstance();
const bimAiCopilot = BimAiCopilot.getInstance();
const collabManager = CollaborationManager.getInstance();

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
  }
}

// Header & Dock Buttons
const bindEnterpriseTrigger = (headerId: string, dockId: string, panelId: string, onOpen?: () => void) => {
  const handler = () => {
    toggleEnterpriseDrawer(panelId);
    if (onOpen) onOpen();
  };
  document.getElementById(headerId)?.addEventListener("click", handler);
  document.getElementById(dockId)?.addEventListener("click", handler);
};

bindEnterpriseTrigger("btn-header-measure", "btn-dock-measure", "measurement-panel", () => measurementSuite.updateMeasurementUI());
bindEnterpriseTrigger("btn-header-clash", "btn-dock-clash", "clash-panel", () => clashDetector.updateClashUI());
bindEnterpriseTrigger("btn-header-carbon", "btn-dock-carbon", "carbon-panel", () => carbonManager.updateCarbonUI());
bindEnterpriseTrigger("btn-header-copilot", "btn-dock-copilot", "copilot-panel", () => bimAiCopilot.updateCopilotUI());
bindEnterpriseTrigger("btn-header-collab", "btn-dock-collab", "collab-panel", () => collabManager.updateCollabUI());

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
    showToast(`Active Measurement: ${type?.toUpperCase() || "DISTANCE"}`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21.3 8.7 8.7 21.3a2.12 2.12 0 0 1-3 0l-4.4-4.4a2.12 2.12 0 0 1 0-3L14 1.3a2.12 2.12 0 0 1 3 0l4.3 4.4a2.12 2.12 0 0 1 0 3Z"/></svg>`);
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
  showToast("Scanning multi-discipline models for clashes...", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`);
  const results = await clashDetector.runClashAudit();
  const crit = results.filter((c) => c.severity === "critical").length;
  showToast(`Clash Audit Complete: ${results.length} Clashes (${crit} Critical)`, `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`);
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
  showToast("Exported BCF 3.0 Clash Report", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/></svg>`);
});

// 6D Carbon Heatmap Actions
document.getElementById("btn-toggle-carbon-heatmap")?.addEventListener("click", () => {
  const active = carbonManager.toggleHeatmap();
  showToast(active ? "6D Embodied Carbon Heatmap Active" : "Heatmap Disabled", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.2"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/></svg>`);
});

// AI Copilot Actions
const copilotInput = document.getElementById("copilot-user-input") as HTMLInputElement;
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

// Collaboration Follow Host
document.getElementById("btn-follow-host")?.addEventListener("click", () => {
  const active = collabManager.toggleFollowHost();
  showToast(active ? "Camera Synced: Following Presenter" : "Independent Camera View", `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/></svg>`);
});



