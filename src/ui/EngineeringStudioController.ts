import type { DrawingViewPreset } from "../modules/TechnicalDrawingModule";
import {
  technicalDrawingFeature,
  realityCaptureFeature,
  ifcSplitterFeature,
  civilAlignmentFeature,
} from "../modules/optionalFeatures";
import { runFeature } from "../utils/lazyFeature";
import { showToast } from "./ToastManager";

let initialized = false;

/**
 * Binds UI controls inside `#engineering-panel` to lazily loaded
 * Vector 2D/DXF, Reality Capture (LAS/Potree/Splat), IFC Splitter, and Civil 4.3 modules.
 */
export function initEngineeringStudioController(): { refreshStatus: () => Promise<void> } {
  if (initialized) {
    return { refreshStatus: () => Promise.resolve() };
  }
  initialized = true;

  const panel = document.getElementById("engineering-panel");
  if (!panel) {
    return { refreshStatus: () => Promise.resolve() };
  }

  // Sub-tab switcher inside uniform #engineering-panel drawer
  const tabs = panel.querySelectorAll<HTMLButtonElement>(".eng-tab-btn");
  const sections = panel.querySelectorAll<HTMLElement>(".eng-tab-section");
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.dataset.engTab;
      tabs.forEach((b) => b.classList.toggle("active", b === btn));
      sections.forEach((sec) => {
        const show = sec.dataset.engSection === targetTab;
        sec.classList.toggle("hidden", !show);
        sec.style.display = show ? "" : "none";
      });
    });
  });

  // 1. Vector 2D Edge Projection & DXF Export (Phase 3)
  const projStatusEl = document.getElementById("eng-proj-status");
  const hiddenCheck = document.getElementById("eng-proj-hidden") as HTMLInputElement | null;
  const viewSelect = document.getElementById("eng-proj-view") as HTMLSelectElement | null;
  const dimBtn = document.getElementById("btn-eng-dim-tool") as HTMLButtonElement | null;

  document.getElementById("btn-eng-project")?.addEventListener("click", () => {
    void runFeature(async () => {
      const mod = await technicalDrawingFeature.load();
      const view = (viewSelect?.value || "top") as DrawingViewPreset;
      if (projStatusEl) projStatusEl.textContent = "Projecting edges...";
      const stats = await mod.projectView(view, { includeHidden: Boolean(hiddenCheck?.checked) });
      if (projStatusEl) {
        projStatusEl.textContent = `${view.toUpperCase()}: ${stats.visibleSegments} visible · ${stats.hiddenSegments} hidden edges`;
      }
      showToast(`Projected ${stats.visibleSegments} vector edges (${view.toUpperCase()})`, "success");
    });
  });

  hiddenCheck?.addEventListener("change", () => {
    void runFeature(async () => {
      const mod = await technicalDrawingFeature.load();
      mod.setHiddenLinesVisible(hiddenCheck.checked);
    });
  });

  dimBtn?.addEventListener("click", () => {
    void runFeature(async () => {
      const mod = await technicalDrawingFeature.load();
      const active = await mod.toggleDimensionTool();
      dimBtn.classList.toggle("active", active);
      dimBtn.textContent = active ? "Stop CAD Dimension Tool" : "Place CAD Linear Dimension";
      showToast(active ? "Click two points on drawing to dimension (Esc cancels)" : "CAD Dimension Tool deactivated", "info");
    });
  });

  document.getElementById("btn-eng-export-dxf")?.addEventListener("click", () => {
    void runFeature(async () => {
      const mod = await technicalDrawingFeature.load();
      try {
        mod.downloadDxf();
        showToast("Exported vector CAD .dxf file", "success");
      } catch {
        showToast("Generate a 2D edge projection first before exporting DXF", "warning");
      }
    });
  });

  document.getElementById("btn-eng-clear-proj")?.addEventListener("click", () => {
    void runFeature(async () => {
      const mod = await technicalDrawingFeature.load();
      mod.clearProjectionLines();
      if (projStatusEl) projStatusEl.textContent = "No active projection";
      if (dimBtn) {
        await mod.toggleDimensionTool(false);
        dimBtn.classList.remove("active");
        dimBtn.textContent = "Place CAD Linear Dimension";
      }
    });
  });

  // 2. Reality Capture: Point Clouds (.las / Potree 2.0) & Gaussian Splats (.ply) (Phase 4)
  const capStatusEl = document.getElementById("eng-capture-status");
  const pcInput = document.getElementById("eng-pc-files") as HTMLInputElement | null;
  const splatInput = document.getElementById("eng-splat-files") as HTMLInputElement | null;
  const edlCheck = document.getElementById("eng-pc-edl") as HTMLInputElement | null;
  const budgetSlider = document.getElementById("eng-pc-budget") as HTMLInputElement | null;
  const budgetVal = document.getElementById("val-eng-pc-budget");
  const splatScaleSlider = document.getElementById("eng-splat-scale") as HTMLInputElement | null;
  const splatScaleVal = document.getElementById("val-eng-splat-scale");

  pcInput?.addEventListener("change", () => {
    if (!pcInput.files?.length) return;
    const files = pcInput.files;
    void runFeature(async () => {
      const mod = await realityCaptureFeature.load();
      if (capStatusEl) capStatusEl.textContent = "Streaming / indexing point cloud...";
      const summary = await mod.loadPointCloudFiles(files, (pct, msg) => {
        if (capStatusEl) capStatusEl.textContent = `${pct}% · ${msg}`;
      });
      if (capStatusEl) {
        capStatusEl.textContent = `${summary.clouds} Point Cloud(s) · ${summary.splats} Splat(s) active`;
      }
      showToast("Point Cloud loaded with Deferred BIM occlusion", "success");
    });
  });

  splatInput?.addEventListener("change", () => {
    const file = splatInput.files?.[0];
    if (!file) return;
    void runFeature(async () => {
      const mod = await realityCaptureFeature.load();
      if (capStatusEl) capStatusEl.textContent = `Loading Gaussian Splat (${file.name})...`;
      const scale = splatScaleSlider ? Number(splatScaleSlider.value) : 1.0;
      const summary = await mod.loadSplatFile(file, scale);
      if (capStatusEl) {
        capStatusEl.textContent = `${summary.clouds} Point Cloud(s) · ${summary.splats} Splat(s) active`;
      }
      showToast(`Gaussian Splat loaded: ${file.name}`, "success");
    });
  });

  edlCheck?.addEventListener("change", () => {
    void runFeature(async () => {
      const mod = await realityCaptureFeature.load();
      mod.setEdlEnabled(edlCheck.checked);
    });
  });

  budgetSlider?.addEventListener("input", () => {
    const budget = Number(budgetSlider.value);
    if (budgetVal) budgetVal.textContent = `${(budget / 1_000_000).toFixed(1)}M`;
    void runFeature(async () => {
      const mod = await realityCaptureFeature.load();
      mod.setPointBudget(budget);
    });
  });

  splatScaleSlider?.addEventListener("input", () => {
    const scale = Number(splatScaleSlider.value);
    if (splatScaleVal) splatScaleVal.textContent = `${scale.toFixed(2)}x`;
    void runFeature(async () => {
      const mod = await realityCaptureFeature.load();
      mod.setSplatScale(scale);
    });
  });

  document.getElementById("btn-eng-clear-capture")?.addEventListener("click", () => {
    void runFeature(async () => {
      const mod = await realityCaptureFeature.load();
      mod.disposeAll();
      if (capStatusEl) capStatusEl.textContent = "0 clouds · 0 splats active";
      if (pcInput) pcInput.value = "";
      if (splatInput) splatInput.value = "";
      showToast("Cleared Reality Capture overlays", "info");
    });
  });

  // 3. Client-Side IFC Splitter & Extractor (Phase 5B)
  const splitFileInput = document.getElementById("eng-split-file") as HTMLInputElement | null;
  const splitPartsInput = document.getElementById("eng-split-parts") as HTMLInputElement | null;
  const splitStatusEl = document.getElementById("eng-split-status");
  let cachedSplitBuffer: Uint8Array | null = null;
  let cachedSplitName = "BIM_Model.ifc";

  splitFileInput?.addEventListener("change", async () => {
    const file = splitFileInput.files?.[0];
    if (!file) return;
    cachedSplitBuffer = new Uint8Array(await file.arrayBuffer());
    cachedSplitName = file.name;
    if (splitStatusEl) {
      splitStatusEl.textContent = `Ready: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }
  });

  document.getElementById("btn-eng-split-ifc")?.addEventListener("click", () => {
    if (!cachedSplitBuffer) {
      showToast("Choose an .ifc file above first", "warning");
      return;
    }
    const buf = cachedSplitBuffer;
    void runFeature(async () => {
      const mod = await ifcSplitterFeature.load();
      const parts = Number(splitPartsInput?.value || 3);
      if (splitStatusEl) splitStatusEl.textContent = `Splitting into ${parts} files...`;
      const outputs = await mod.splitBuffer(buf, parts, cachedSplitName, (stage) => {
        if (splitStatusEl) splitStatusEl.textContent = `Stage: ${stage}...`;
      });
      const totalItems = outputs.reduce((acc, o) => acc + o.itemCount, 0);
      if (splitStatusEl) {
        splitStatusEl.textContent = `Generated ${outputs.length} IFC part(s) (${totalItems} elements)`;
      }
      showToast(`Split IFC into ${outputs.length} files`, "success");
    });
  });

  document.getElementById("btn-eng-extract-selected")?.addEventListener("click", () => {
    if (!cachedSplitBuffer) {
      showToast("Choose the source .ifc file above first", "warning");
      return;
    }
    const buf = cachedSplitBuffer;
    void runFeature(async () => {
      const mod = await ifcSplitterFeature.load();
      const file = await mod.extractSelectedFromScene(buf);
      if (splitStatusEl) splitStatusEl.textContent = `Extracted ${file.itemCount} entities -> ${file.filename}`;
      showToast(`Extracted ${file.itemCount} selected IFC entities`, "success");
    });
  });

  document.getElementById("btn-eng-download-splits")?.addEventListener("click", () => {
    void runFeature(async () => {
      const mod = await ifcSplitterFeature.load();
      const outs = mod.getLastOutputs();
      if (!outs.length) {
        showToast("Run Split or Extract Selection first", "warning");
        return;
      }
      mod.downloadOutputs(outs);
      showToast(`Downloading ${outs.length} .ifc file(s)`, "success");
    });
  });

  // 4. IFC 4.3 Civil Alignments (Phase 5C)
  const civilStatusEl = document.getElementById("eng-civil-status");
  const crossSecBtn = document.getElementById("btn-eng-civil-cross-section") as HTMLButtonElement | null;

  document.getElementById("btn-eng-scan-civil")?.addEventListener("click", () => {
    void runFeature(async () => {
      const mod = await civilAlignmentFeature.load();
      const report = await mod.scanAndAttachAlignments();
      if (civilStatusEl) {
        civilStatusEl.textContent = `Scanned ${report.modelCount} model(s): ${report.alignmentCount} alignment group(s), ${report.curveCount} curve(s)`;
      }
      showToast(
        report.alignmentCount > 0
          ? `Attached ${report.alignmentCount} IFC 4.3 alignment(s)`
          : "No IFC 4.3 alignments found in current model",
        report.alignmentCount > 0 ? "success" : "info"
      );
    });
  });

  crossSecBtn?.addEventListener("click", () => {
    void runFeature(async () => {
      const mod = await civilAlignmentFeature.load();
      const active = mod.toggleCrossSection();
      crossSecBtn.classList.toggle("active", active);
      crossSecBtn.textContent = active ? "Hide Cross Section Plane" : "Cross Section";
    });
  });

  return {
    refreshStatus: async () => {},
  };
}
