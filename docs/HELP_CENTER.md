# BIM Kintsugi Help Center — Step-by-Step User Guides

Welcome to the official **BIM Kintsugi Help Center**. Use the quick navigation below to jump directly to any step-by-step guide, or open the interactive Help Center web portal at **[help.html](https://lalithebinezer.github.io/BIM-Kintsugi/help.html)** (also accessible in-app anytime by pressing `?` → **Help Center**).

## Quick Guide Index

1. [Getting Started: Load Models & Explore in 3D](#1-getting-started-load-models--explore-in-3d)
2. [Switching Between Classic UI & Spatial Cockpit UI](#2-switching-between-classic-ui--spatial-cockpit-ui)
3. [Mobile & Jobsite Field Guide (Touch, Walkthrough & Photo Snags)](#3-mobile--jobsite-field-guide-touch-walkthrough--photo-snags)
4. [4D Construction Simulation, WBS Gantt & CasCADe 4D Lens](#4-4d-construction-simulation-wbs-gantt--cascade-4d-lens)
5. [3D/4D Clash Detection, SLF Congestion & BCF Coordination](#5-3d4d-clash-detection-slf-congestion--bcf-coordination)
6. [5D Rule-Book BOQ, GAEB .X83, ANSI EVM & Executive PDF](#6-5d-rule-book-boq-gaeb-x83-ansi-evm--executive-pdf)
7. [6D Embodied Carbon LCA, GeoBIM GIS & Engineering Studio](#7-6d-embodied-carbon-lca-geobim-gis--engineering-studio)
8. [Command Palette, Shortcuts & Troubleshooting FAQ](#8-command-palette-shortcuts--troubleshooting-faq)

---

## 1. Getting Started: Load Models & Explore in 3D

**Estimated time:** 3 minutes | **Applies to:** Desktop, Tablet & Mobile

### Before You Begin
- Open BIM Kintsugi in any modern WebGL2 browser (Chrome, Edge, Safari, or Firefox).
- Have a local `.ifc` (IFC2x3, IFC4, or IFC4.3) or `.frag` file ready, or use one of the built-in live sample buildings.

### Step-by-Step Instructions
1. **Load a sample or upload your model**
   - In **Spatial Cockpit UI**, click **Load Snowdon Towers (IFC)** on the centered Quick Launcher card (or choose **School Demo** / **Upload IFC**).
   - In **Classic UI**, open the **Files** tab (`1`) and click **Load**, or drag-and-drop any `.ifc` / `.frag` file onto the 3D canvas.
   - *Tip:* Uploaded IFC files are compiled into binary Fragments and cached in IndexedDB so reopening the same project is nearly instant.
2. **Review automatic IFC Pre-Flight diagnostics**
   - An off-thread Web Worker automatically inspects schema version, SI units, georeferencing (`IfcMapConversion`), quantity sets (`Qto_*`), and native IFC4 `IfcWorkSchedule` timelines without blocking the viewport.
3. **Navigate the 3D viewport**
   - **Left-drag** to orbit, **Right-drag** to pan, and **Scroll** (or `+` / `-`) to zoom.
   - Click any face on the top-right **3D ViewCube**, press `T` (Top Plan), `P` (Isometric 3D), or `F` / `Home` (Fit Model).
4. **Inspect BIM metadata & multi-element takeoffs**
   - **Left-click** any element to open the dedicated **META** tab (`8`) showing attributes, Psets, Qto quantities, and WGS84 coordinates.
   - Hold `Shift+Click` or press `B` and drag a marquee box to multi-select elements and view summed `NetVolume`, surface area, cost valuation, and category filter chips.
   - Press `Ctrl+Z` / `Ctrl+Y` for 25-step Selection Undo/Redo, or click **Save Set** to store reusable groups in **Finder** (`2`).

---

## 2. Switching Between Classic UI & Spatial Cockpit UI

**Estimated time:** 2 minutes | **Applies to:** All Screen Sizes

### Step-by-Step Instructions
1. **Understand device-smart defaults**
   - **Desktop & Tablet (`>= 768px`)** starts automatically in **Classic UI** with full docked sidebars, top quick-view ribbon, 2D Floor Radar, and Magic Dock.
   - **Mobile (`<= 767px` & phone landscape)** starts automatically in **Spatial Cockpit UI**, freeing 88%+ of the 3D canvas with a slim top bar, centered 5-tab thumb dock, and swipeable bottom sheets.
2. **Switch layouts in one click (zero page reload)**
   - **Classic → Cockpit:** Click the accent-highlighted **Cockpit UI** button in the top-right header (or tap **Switch to Cockpit UI** at the top of the mobile `≡` menu).
   - **Cockpit → Classic:** Click **Classic UI** in the top-right bar on desktop, or open **Workspace & Views (`≡`) → Interface Layout → Classic UI** on any screen size.
   - **Keyboard power user:** Press `Ctrl+K` and run **Toggle UI Layout (Spatial Cockpit ↔ Classic BIM UI)**.
3. **Switch between 5 WCAG AAA appearance themes**
   - Choose **Obsidian**, **Studio (Light)**, **Zen**, **Neon**, or **CAD Blueprint** from the top header (Classic) or **Workspace & Views** (Cockpit). UI tokens, 3D scene lighting, ground grid, and outliner colors synchronize instantly.
4. **Choose a Workspace Role Persona**
   - Pick **All Tools**, **Design Review**, **4D Planner**, **5D Commercial**, or **Field Touch** to streamline tools for your discipline.

> **Note:** Your explicit UI layout choice is persisted in `localStorage` (`bim_ui_layout`) and restored synchronously before first paint on subsequent visits.

---

## 3. Mobile & Jobsite Field Guide (Touch, Walkthrough & Photo Snags)

**Estimated time:** 4 minutes | **Applies to:** Phones & Field Tablets

### Step-by-Step Instructions
1. **Navigate with the 5-Tab Bottom Bar & Swipe Sheets**
   - Tap **Model** (files/finder/schedule), **Inspect** (scene/metadata/tools), **Tools** (measure/section/selection/files), **4D** (compact 4D scrubber), or **Suites** (Clash, BCF, AI Copilot, 5D, 6D, GIS).
   - Drag any sheet handle down to close or up to expand full height.
2. **Use the Right-Edge Thumb Camera Rail**
   - Tap the floating right-edge rail for 1-tap **Fit View**, **Camera Views** (*Top, Iso, Explode, Grid, Radar*), and **Section Cut**.
3. **Walk the site with Dual-Thumb Touch Controls**
   - Open **Workspace & Views (`≡`) → First-Person Touch Walk**.
   - Use the left analog stick to move/strafe, drag the right look pad to turn your gaze, use **↑ / ↓** for floor elevation, and tap **Exit** to return to Orbit mode.
4. **Capture 1-Tap Site Photo Snags directly into BCF**
   - Tap **Tools → Photo Snag → BCF** (or **Suites → BCF Issues → Photo**).
   - Snap a photo with your device camera—BIM Kintsugi compresses the image client-side, attaches your live 3D camera viewpoint and selected element, and creates a ready-to-export `.bcfzip` issue.
5. **Use Offline PWA Mode & Adaptive GPU Smoothing**
   - Use your browser's **Add to Home Screen / Install App** option to cache WebAssembly loaders and assets offline. During touch orbit/pinch gestures, adaptive GPU scaling keeps frame rates fluid and restores crisp detail automatically 180ms after release.

---

## 4. 4D Construction Simulation, WBS Gantt & CasCADe 4D Lens

**Estimated time:** 4 minutes | **Applies to:** Classic UI & Spatial Cockpit UI

### Step-by-Step Instructions
1. **Enter 4D Mode & scrub the timeline**
   - Click **4D** on the Cockpit dock (or **4D Gantt** in Classic UI). Press **Play** (`Space`) or scrub the timeline slider across project weeks. Adjust playback speed (`1x`, `2x`, `5x`, `10x`) from **4D Tools** or the timeline speed pills.
2. **Import or generate a construction schedule**
   - Open **4D Schedule (`3`)** to auto-sequence by any IFC property (*Storey*, *Phase*, custom Pset), or import **CSV** (with interactive column mapping & composite `Storey+Category` keys), **MS Project (.xml)**, **Primavera P6 (.xer)**, or native **IFC4 `IfcWorkSchedule`**.
3. **Analyze slack & dependencies with CasCADe 4D Lens**
   - Click **CasCADe Lens** to colorize the 3D building across 12 CPM metrics (*Total Slack, Free Slack, Duration, Cost Density*) and 15 ColorBrewer scales. Click any of the 5 legend swatches to isolate matching elements and toggle `Crit Arcs`, `Pred/Succ`, or `Out-of-Seq` 3D Bezier arcs.
4. **Launch WBS Gantt, Visual Rule Builder, Tower Crane & What-If Sim**
   - Open **WBS Gantt** for `M/W/D` timescale zooming and boolean **Visual Rule Builder** task binding.
   - Activate **Tower Crane** for 3D swing safety envelopes, **Lookahead** for 2–6 week site plans, **What-If Sim** for delay cascades, and **Cash-Flow** for live cost histograms.
   - Click the red **×** button on the 4D bar to cleanly exit and restore model visibility.

---

## 5. 3D/4D Clash Detection, SLF Congestion & BCF Coordination

**Estimated time:** 3 minutes

### Step-by-Step Instructions
1. **Open Clash Matrix & pick a scan mode**
   - Choose **Static 3D** (hard geometric overlaps), **Temporal 4D** (prunes pairs whose tasks never overlap on site), or **Workspace 4D** (crew work-zone clearances).
2. **Run scan & inspect ranked clashes**
   - Clashes execute off-thread in a Web Worker and sort by **BWM Criticality Index (`CI`)**. Click any clash row to focus the camera and isolate Element A vs. Element B.
3. **Analyze Workspace Congestion (`SLF`)**
   - Click **Analyze SLF** (or enable **SLF Zones** in 4D Tools) to render Hosny Space Loading Factor overlays per storey (`Optimal <= 0.70`, `Moderate 0.70–0.90`, `Extreme > 0.90`).
4. **Coordinate via BCF 2.1/3.0**
   - Promote any clash or right-click any element → **Create BCF Issue** to bind a 3D pin, camera viewpoint, and optional site photo. Click **Export `.bcfzip`** to exchange issues with Revit, Navisworks, Solibri, or ACC.

---

## 6. 5D Rule-Book BOQ, GAEB .X83, ANSI EVM & Executive PDF

**Estimated time:** 4 minutes

### Step-by-Step Instructions
1. **Configure your Rule-Book & rates**
   - Open **5D Cost & BOQ (`$`)**, pick **DIN 276**, **Uniclass 2015**, or **CSI MasterFormat**, choose your currency, or import a custom `.csv` unit-rate catalog.
2. **Audit model & BOQ quality**
   - Click **Model & BOQ Audit** to flag `MISSING_QTO`, `ZERO_RATE`, `UNIT_MISMATCH`, `LOW_CONFIDENCE`, and `UNCLASSIFIED` elements. Click any audit finding to isolate elements in 3D, switch per-item QTO provenance, and export **GAEB DA XML (`.X83`)** or CSV BOQ.
3. **Forecast performance in ANSI 748-B EVM**
   - Open **EVM Control** to review live `CPI`, `SPI`, 4 EAC forecast models, Lipke Earned Schedule (`SV(t)`, `SPI(t)`, `EAC(t)`), APM Bulls-Eye Quadrant, and Tier 1/Tier 2 variance alerts. Export **CPR Format 1** or **CPR Format 5**.
4. **Print the Boardroom Executive Twin Report**
   - Click **Executive Report** inside the 5D drawer (or press `Ctrl+K`) to generate a print-optimized PDF/vector report summarizing 4D progress, EVM S-Curve, clashes, and 6D carbon grade.

---

## 7. 6D Embodied Carbon LCA, GeoBIM GIS & Engineering Studio

**Estimated time:** 3 minutes

### Step-by-Step Instructions
1. **Run 6D Embodied Carbon LCA**
   - Open **6D Carbon LCA** to paint an ICE v3.0 5-band heatmap (`Grade A` Emerald → `Grade E` Crimson) onto 3D elements, test material substitutions (*Fly-Ash Concrete, CLT, EAF Recycled Steel*), and export EN 15978 CSV reports.
2. **Georeference with GeoBIM GIS (`G`)**
   - Search any address worldwide (keyless Nominatim geocoder) or auto-parse `IfcMapConversion` / `IfcSite`. Enable 1:1 metric 3D satellite basemaps, municipal GeoJSON overlays, and NOAA astronomical solar shadows.
3. **Inspect CAD, Scans & Civil Alignments in Engineering Studio**
   - Align 2D DXF floor drawings on storey cut planes, load E57/LAS/PLY point clouds, split IFC sub-models with `IfcSplitter`, or inspect OpenBIM Civil 4.3 clothoids and click station dots on the vertical profile SVG.

---

## 8. Command Palette, Shortcuts & Troubleshooting FAQ

### Essential Shortcuts
| Shortcut | Action |
| :--- | :--- |
| `Ctrl+K` / `Cmd+K` | Open Omni Command Palette (search tools, views, layouts, elements) |
| `1` – `8` | Switch sidebars (`1` Files, `2` Finder, `3` 4D Sched, `4` Scene, `5` Inspect, `6` Ctrls, `7` Tools, `8` META) |
| `I` / `H` / `U` | Isolate selected / Hide selected / Unhide all |
| `F` / `Z` / `T` / `P` | Focus selection / Fit model / Top plan / Isometric 3D |
| `X` / `M` / `B` / `G` | Section Cut / 3D Measure / Box Marquee / GeoBIM GIS |
| `Ctrl+Z` / `Ctrl+Y` | 25-step Selection Undo / Redo |
| `Ctrl+Shift+L` / `Ctrl+Shift+S` | Copy shareable `#view=` link / Save IndexedDB snapshot |
| `?` | Open In-App Help Center & Shortcuts Guide |

### Troubleshooting FAQ
- **Why did my phone open Spatial Cockpit UI while my desktop opened Classic UI?**
  Devices `>= 768px` default to **Classic UI** and phones (`<= 767px`) default to **Spatial Cockpit UI**. Click the header toggle button (or **Workspace & Views → Interface Layout**) to switch anytime and remember your choice.
- **How do I speed up repeated loading of a large IFC file?**
  Export the model once to `.frag` (`Export FRAG`) for near-instant reloads, and use Storey Slicing or Category Isolation (`I`) on mobile devices.
- **How do I enable optional local Ollama AI responses?**
  Start Ollama on `http://localhost:11434` with CORS enabled and enable Ollama in the AI Copilot drawer (or set `localStorage.bim_enable_ollama = "true"`). Offline structured BIM tool routing works without Ollama.
- **How do I hide the welcome guide on startup?**
  Check **Don't show on startup** in the Help modal footer. You can always reopen it with `?`.
