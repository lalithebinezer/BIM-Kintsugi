import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export interface PinAnnotation {
  id: string;
  number: number;
  position: THREE.Vector3;
  cameraPosition?: THREE.Vector3;
  cameraTarget?: THREE.Vector3;
  title: string;
  comment: string;
  category: string;
  color?: string;
  modelId?: string;
  expressId?: number;
  elementName?: string;
  timestamp: string;
  thumbnail?: string;
  elementEl?: HTMLElement;
  threeMesh?: THREE.Group;
}

export class AnnotationModule {
  private static instance: AnnotationModule | null = null;
  private engine: BimEngine;
  public enabled: boolean = false;
  private annotations: PinAnnotation[] = [];
  private nextPinNumber: number = 1;
  private containerEl: HTMLElement | null = null;
  public pinsGroup: THREE.Group;
  public onPinsUpdated?: (pins: PinAnnotation[]) => void;
  public activePopoverId: string | null = null;
  public activeFilterCategory: string = "All";
  public isXRayActive: boolean = false;

  public static categoryColors: Record<string, string> = {
    Inspection: "#3b82f6",
    Defect: "#ef4444",
    Safety: "#f59e0b",
    RFI: "#a855f7",
    "Sign-off": "#10b981",
  };

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.pinsGroup = new THREE.Group();
    this.pinsGroup.name = "bim-3d-pins-layer";
    
    // Add pins group to 3D scene
    const scene = this.getScene();
    if (scene) scene.add(this.pinsGroup);

    this.setupOverlayContainer();
    this.setupOutsideClickListener();
  }

  public static getInstance(): AnnotationModule {
    if (!AnnotationModule.instance) {
      AnnotationModule.instance = new AnnotationModule();
    }
    return AnnotationModule.instance;
  }

  private getScene(): THREE.Object3D | null {
    const s = this.engine.world?.scene || (window as any).viewer_world?.scene;
    return (s as any)?.three || null;
  }

  private setupOverlayContainer() {
    this.containerEl = document.getElementById("annotation-overlay-container");
    if (!this.containerEl) {
      this.containerEl = document.createElement("div");
      this.containerEl.id = "annotation-overlay-container";
      this.containerEl.style.cssText = "position: fixed; inset: 0; pointer-events: none; z-index: 50; overflow: hidden;";
      document.body.appendChild(this.containerEl);
    }
  }

  private setupOutsideClickListener() {
    document.addEventListener("pointerdown", (e: MouseEvent) => {
      const popover = document.getElementById("pin-details-popover");
      if (!popover) return;
      const target = e.target as HTMLElement;
      if (!popover.contains(target) && !target.closest(".annotation-pin-badge") && !target.closest(".btn-goto-pin") && !target.closest(".pin-list-item")) {
        this.closePinDetailsModal();
      }
    });

    window.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        this.closePinDetailsModal();
      }
    });
  }

  public enablePinCreation(enabled: boolean) {
    this.enabled = enabled;
  }

  public captureViewportThumbnail(): string | undefined {
    try {
      const world = this.engine.world || (window as any).viewer_world;
      const renderer = world?.renderer?.three;
      const scene = world?.scene?.three;
      const camera = world?.camera?.three;
      if (renderer && scene && camera) {
        const wasPinsVis = this.pinsGroup.visible;
        this.pinsGroup.visible = false;
        renderer.render(scene, camera);
        this.pinsGroup.visible = wasPinsVis;

        const canvas = renderer.domElement;
        if (canvas && canvas.width > 0 && canvas.height > 0) {
          const thumbCanvas = document.createElement("canvas");
          thumbCanvas.width = 320;
          thumbCanvas.height = Math.max(160, Math.round(320 * (canvas.height / canvas.width)));
          const ctx = thumbCanvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(canvas, 0, 0, thumbCanvas.width, thumbCanvas.height);
            const dataUrl = thumbCanvas.toDataURL("image/jpeg", 0.85);
            if (dataUrl && dataUrl.length > 500) {
              return dataUrl;
            }
          }
        }
      }
    } catch (e) {
      console.warn("Could not capture viewport snapshot:", e);
    }
    return undefined;
  }

  private create3DPinMesh(pos: THREE.Vector3, colorHex: string): THREE.Group {
    const group = new THREE.Group();
    group.position.copy(pos);

    const color = new THREE.Color(colorHex);

    // Stem (needle standing upright)
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.015, 0.8, 12);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.85,
      roughness: 0.2
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.4;
    group.add(stem);

    // Glowing Pin Head Sphere
    const headGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.2
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.8;
    group.add(head);

    // Base surface anchor ring (decal circle)
    const ringGeo = new THREE.RingGeometry(0.1, 0.2, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    group.add(ring);

    return group;
  }

  public addAnnotation(
    pos: THREE.Vector3,
    title: string,
    comment: string,
    category: string = "Inspection",
    modelId?: string,
    expressId?: number,
    elementName?: string
  ): PinAnnotation {
    const color = AnnotationModule.categoryColors[category] || "#3b82f6";
    const pinNumber = this.nextPinNumber++;

    // Record camera viewpoint
    let cameraPos: THREE.Vector3 | undefined = undefined;
    let cameraTarget: THREE.Vector3 | undefined = undefined;
    const camera = this.engine.world?.camera || (window as any).viewer_world?.camera;
    if (camera?.controls) {
      cameraPos = new THREE.Vector3();
      cameraTarget = new THREE.Vector3();
      camera.controls.getPosition(cameraPos);
      camera.controls.getTarget(cameraTarget);
    }

    const thumbnail = this.captureViewportThumbnail();

    const anno: PinAnnotation = {
      id: `anno-${Date.now()}-${this.nextPinNumber}`,
      number: pinNumber,
      position: pos.clone(),
      cameraPosition: cameraPos,
      cameraTarget: cameraTarget,
      title,
      comment,
      category,
      color,
      modelId,
      expressId,
      elementName: elementName || (expressId ? `Element #${expressId}` : "Scene Anchor"),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      thumbnail
    };

    // Create and add 3D Pin mesh to scene
    const threeMesh = this.create3DPinMesh(pos, color);
    threeMesh.userData = { annotationId: anno.id };
    this.pinsGroup.add(threeMesh);
    anno.threeMesh = threeMesh;

    // Ensure scene contains group
    const scene = this.getScene();
    if (scene && !this.pinsGroup.parent) {
      scene.add(this.pinsGroup);
    }

    this.annotations.push(anno);
    this.renderAnnotationDOM(anno);
    this.applyCategoryFilter();
    this.updateOverlayPositions();
    if (this.onPinsUpdated) this.onPinsUpdated(this.getFilteredAnnotations());
    
    // Auto-reveal detail popover for newly placed pin
    this.showPinDetailsModal(anno);

    return anno;
  }

  public setFilterCategory(category: string) {
    this.activeFilterCategory = category;
    this.applyCategoryFilter();
    if (this.onPinsUpdated) this.onPinsUpdated(this.getFilteredAnnotations());
  }

  public applyCategoryFilter() {
    for (const anno of this.annotations) {
      const match = this.activeFilterCategory === "All" || anno.category === this.activeFilterCategory;
      if (anno.threeMesh) {
        anno.threeMesh.visible = match;
      }
      if (anno.elementEl) {
        anno.elementEl.style.display = match ? "flex" : "none";
      }
    }
  }

  public getFilteredAnnotations(): PinAnnotation[] {
    if (this.activeFilterCategory === "All") return this.annotations;
    return this.annotations.filter(a => a.category === this.activeFilterCategory);
  }

  private renderAnnotationDOM(anno: PinAnnotation) {
    this.setupOverlayContainer();
    if (!this.containerEl) return;

    const pinEl = document.createElement("div");
    pinEl.className = "annotation-pin-badge";
    pinEl.dataset.id = anno.id;
    const catColor = anno.color || "#3b82f6";

    pinEl.style.cssText = `
      position: fixed;
      transform: translate(-50%, -100%);
      pointer-events: auto;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      background: var(--bg-panel, #ffffff);
      border: 2px solid var(--border-strong, #000000);
      color: var(--text-primary, #000000);
      padding: 0.18rem 0.45rem;
      border-radius: 20px;
      font-size: 0.65rem;
      font-weight: 800;
      font-family: var(--font-body, sans-serif);
      box-shadow: var(--shadow-sm, 2px 2px 0px #000000);
      transition: transform 0.12s ease, box-shadow 0.12s ease;
      user-select: none;
      white-space: nowrap;
      margin-top: -6px;
    `;

    pinEl.innerHTML = `
      <span style="background: ${catColor}; color: #ffffff; width: 16px; height: 16px; border-radius: 50%; border: 1px solid var(--border-strong, #000); display: inline-flex; align-items: center; justify-content: center; font-size: 0.58rem; font-weight: 900; flex-shrink: 0;">${anno.number}</span>
      <span style="font-weight: 800; color: var(--text-primary); font-size: 0.65rem;">${anno.title}</span>
      ${anno.elementName ? `<span style="background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: 2px; padding: 0.02rem 0.2rem; font-size: 0.55rem; color: var(--accent-500);">${anno.elementName}</span>` : ''}
      <button class="btn-remove-pin" title="Delete pin" style="background: none; border: none; color: var(--color-danger, #ef4444); font-size: 0.8rem; font-weight: 900; cursor: pointer; padding: 0 0.1rem; margin-left: 0.1rem;">×</button>
    `;

    pinEl.addEventListener("mouseenter", () => {
      pinEl.style.transform = "translate(-50%, -108%) scale(1.04)";
      pinEl.style.boxShadow = "var(--shadow-md, 3px 3px 0px #000000)";
      this.showHoverPreview(anno, pinEl);
    });

    pinEl.addEventListener("mouseleave", () => {
      pinEl.style.transform = "translate(-50%, -100%) scale(1.0)";
      pinEl.style.boxShadow = "var(--shadow-sm, 2px 2px 0px #000000)";
      this.hideHoverPreview();
    });

    const removeBtn = pinEl.querySelector(".btn-remove-pin");
    if (removeBtn) {
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.hideHoverPreview();
        this.removeAnnotation(anno.id);
      });
    }

    pinEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this.hideHoverPreview();
      this.selectPin(anno.id);
      this.showPinDetailsModal(anno);
    });

    this.containerEl.appendChild(pinEl);
    anno.elementEl = pinEl;
  }

  private hoverPreviewEl: HTMLElement | null = null;

  private showHoverPreview(anno: PinAnnotation, targetEl: HTMLElement) {
    if (this.activePopoverId === anno.id) return; // Don't show tooltip if full modal is open
    this.hideHoverPreview();

    const rect = targetEl.getBoundingClientRect();
    const tooltip = document.createElement("div");
    tooltip.id = "pin-hover-tooltip";
    tooltip.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top - 8}px;
      transform: translate(-50%, -100%);
      z-index: 10005;
      background: var(--bg-panel, #18181b);
      border: 2px solid var(--border-strong, #000000);
      border-radius: 4px;
      padding: 0.45rem 0.55rem;
      width: 220px;
      box-shadow: var(--shadow-md, 4px 4px 0px #000000);
      color: var(--text-primary, #ffffff);
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      animation: popIn 0.12s ease-out;
    `;

    const catColor = anno.color || "#3b82f6";
    tooltip.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.64rem; font-weight: 800;">
        <span style="display: flex; align-items: center; gap: 0.3rem;">
          <span style="background: ${catColor}; color: #fff; width: 14px; height: 14px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.52rem;">${anno.number}</span>
          <span>${anno.title}</span>
        </span>
        <span style="font-size: 0.52rem; background: ${catColor}; color: #fff; padding: 0.05rem 0.25rem; border-radius: 2px; text-transform: uppercase;">${anno.category}</span>
      </div>
      ${anno.thumbnail ? `<div style="width: 100%; height: 60px; border-radius: 2px; overflow: hidden; border: 1px solid var(--border-subtle);"><img src="${anno.thumbnail}" style="width: 100%; height: 100%; object-fit: cover;" /></div>` : ''}
      <div style="font-size: 0.58rem; color: var(--text-muted); line-height: 1.35; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">${anno.comment}</div>
    `;

    document.body.appendChild(tooltip);
    this.hoverPreviewEl = tooltip;
  }

  public hideHoverPreview() {
    if (this.hoverPreviewEl) {
      this.hoverPreviewEl.remove();
      this.hoverPreviewEl = null;
    }
  }

  // --- GUIDED SITE TOUR / PRESENTATION MODE ---
  public isTourActive: boolean = false;
  public tourIndex: number = -1;
  private tourHudEl: HTMLElement | null = null;

  public startTour() {
    const list = this.getFilteredAnnotations();
    if (list.length === 0) {
      alert("No active 3D pins to tour! Drop some pins first.");
      return;
    }
    this.isTourActive = true;
    this.tourIndex = 0;
    this.closePinDetailsModal();
    this.renderTourHUD();
    this.goToTourStep(0);
  }

  public nextTourStep() {
    const list = this.getFilteredAnnotations();
    if (list.length === 0) return;
    this.tourIndex = (this.tourIndex + 1) % list.length;
    this.goToTourStep(this.tourIndex);
  }

  public prevTourStep() {
    const list = this.getFilteredAnnotations();
    if (list.length === 0) return;
    this.tourIndex = (this.tourIndex - 1 + list.length) % list.length;
    this.goToTourStep(this.tourIndex);
  }

  public stopTour() {
    this.isTourActive = false;
    this.tourIndex = -1;
    if (this.tourHudEl) {
      this.tourHudEl.remove();
      this.tourHudEl = null;
    }
    this.selectPin(null);
  }

  private async goToTourStep(index: number) {
    const list = this.getFilteredAnnotations();
    if (!list[index]) return;
    const anno = list[index];
    this.selectPin(anno.id);
    this.renderTourHUD();
  }

  private renderTourHUD() {
    const list = this.getFilteredAnnotations();
    if (!this.isTourActive || list.length === 0) {
      if (this.tourHudEl) this.tourHudEl.remove();
      return;
    }

    if (!this.tourHudEl) {
      this.tourHudEl = document.createElement("div");
      this.tourHudEl.id = "site-tour-hud";
      document.body.appendChild(this.tourHudEl);
    }

    const current = list[this.tourIndex] || list[0];
    const catColor = current.color || "#3b82f6";

    this.tourHudEl.style.cssText = `
      position: fixed;
      top: 4.8rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      background: var(--bg-panel, #18181b);
      border: 3px solid var(--border-strong, #000000);
      border-radius: 4px;
      padding: 0.55rem 0.9rem;
      box-shadow: var(--shadow-brutal, 6px 6px 0px #000000);
      color: var(--text-primary, #ffffff);
      display: flex;
      align-items: center;
      gap: 0.8rem;
      pointer-events: auto;
      animation: popIn 0.15s ease-out;
    `;

    this.tourHudEl.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.45rem;">
        <span style="background: var(--accent-500); color: var(--accent-btn-text, #000000); padding: 0.15rem 0.35rem; font-size: 0.6rem; font-weight: 900; border-radius: 2px; letter-spacing: 0.05em;">TOUR</span>
        <span style="font-size: 0.72rem; font-weight: 800; color: var(--text-primary);">Stop ${this.tourIndex + 1} of ${list.length}</span>
      </div>

      <div style="display: flex; align-items: center; gap: 0.35rem; border-left: 2px solid var(--border-strong); padding-left: 0.7rem;">
        <span style="background: ${catColor}; color: #fff; width: 18px; height: 18px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 0.62rem; font-weight: 900;">${current.number}</span>
        <span style="font-size: 0.75rem; font-weight: 800; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${current.title}</span>
      </div>

      <div style="display: flex; align-items: center; gap: 0.3rem;">
        <button id="btn-tour-prev" style="background: var(--bg-card); color: var(--text-primary); border: 1.5px solid var(--border-strong); border-radius: 2px; padding: 0.25rem 0.5rem; font-size: 0.68rem; font-weight: 800; cursor: pointer;">◀ Prev</button>
        <button id="btn-tour-next" style="background: var(--accent-500); color: var(--accent-btn-text, #000000); border: 1.5px solid var(--border-strong); border-radius: 2px; padding: 0.25rem 0.55rem; font-size: 0.68rem; font-weight: 900; cursor: pointer;">Next ▶</button>
        <button id="btn-tour-exit" style="background: var(--bg-card); color: var(--color-danger, #ef4444); border: 1.5px solid var(--border-strong); border-radius: 2px; padding: 0.25rem 0.4rem; font-size: 0.68rem; font-weight: 800; cursor: pointer;">✕</button>
      </div>
    `;

    this.tourHudEl.querySelector("#btn-tour-prev")?.addEventListener("click", () => this.prevTourStep());
    this.tourHudEl.querySelector("#btn-tour-next")?.addEventListener("click", () => this.nextTourStep());
    this.tourHudEl.querySelector("#btn-tour-exit")?.addEventListener("click", () => this.stopTour());
  }

  public selectedPinId: string | null = null;
  public onPinSelected?: (anno: PinAnnotation | null) => void;

  public selectPin(id: string | null) {
    this.selectedPinId = id;

    // Reset visual styles on all pins
    for (const a of this.annotations) {
      if (a.elementEl) {
        a.elementEl.style.outline = "none";
        a.elementEl.style.transform = "translate(-50%, -100%) scale(1.0)";
        a.elementEl.style.boxShadow = "var(--shadow-sm, 2px 2px 0px #000000)";
      }
    }

    if (!id) {
      if (this.onPinSelected) this.onPinSelected(null);
      return;
    }

    const anno = this.annotations.find(a => a.id === id);
    if (!anno) return;

    // Highlight active pin badge
    if (anno.elementEl) {
      anno.elementEl.style.outline = "2px solid var(--accent-500, #3b82f6)";
      anno.elementEl.style.transform = "translate(-50%, -105%) scale(1.08)";
      anno.elementEl.style.boxShadow = "var(--shadow-md, 4px 4px 0px #000000)";
    }

    // Select and highlight tagged element in scene
    this.selectAndHighlightTaggedElement(anno);

    // Focus camera
    this.focusOnAnnotation(anno.id);

    // Open and navigate right sidebar to Tools -> Measure / Pins
    try {
      if (typeof (window as any).switchSidebarTab === "function") {
        const rightSidebar = document.querySelector(".right-sidebar");
        const activeTab = document.querySelector("#right-tab-bar .tab-btn.active")?.getAttribute("data-tab");
        if (!rightSidebar?.classList.contains("open") || activeTab !== "tools") {
          (window as any).switchSidebarTab("right-tab-bar", "tools");
        }
      }

      const toolsNav = document.getElementById("tools-settings-cat-nav");
      const measureBtn = toolsNav?.querySelector('[data-tcat="measure"]') as HTMLElement;
      if (measureBtn && !measureBtn.classList.contains("active")) {
        measureBtn.click();
      }

      const toggleAnnotation = document.getElementById("settings-toggle-annotation") as HTMLInputElement;
      if (toggleAnnotation && !toggleAnnotation.checked) {
        toggleAnnotation.checked = true;
        toggleAnnotation.dispatchEvent(new Event("change"));
      }
    } catch (e) {
      console.warn("Sidebar navigation error:", e);
    }

    // Notify listeners / update sidebar details
    if (this.onPinSelected) {
      this.onPinSelected(anno);
    }
  }

  public updateAnnotation(id: string, updates: Partial<{ title: string; comment: string; category: string }>) {
    const anno = this.annotations.find(a => a.id === id);
    if (!anno) return;

    if (updates.title !== undefined) anno.title = updates.title;
    if (updates.comment !== undefined) anno.comment = updates.comment;
    if (updates.category !== undefined) {
      anno.category = updates.category;
      anno.color = AnnotationModule.categoryColors[updates.category] || "#3b82f6";
    }

    // Re-render DOM badge
    if (anno.elementEl) {
      anno.elementEl.remove();
      this.renderAnnotationDOM(anno);
    }

    // Update 3D mesh material colors if category changed
    if (updates.category && anno.threeMesh) {
      const color = new THREE.Color(anno.color);
      anno.threeMesh.traverse((child: any) => {
        if (child.material && child.geometry?.type === "SphereGeometry") {
          child.material.color = color;
          child.material.emissive = color;
        } else if (child.material && child.geometry?.type === "RingGeometry") {
          child.material.color = color;
        }
      });
    }

    if (this.onPinsUpdated) this.onPinsUpdated(this.getFilteredAnnotations());
    if (this.selectedPinId === id && this.onPinSelected) this.onPinSelected(anno);
  }

  public async selectAndHighlightTaggedElement(anno: PinAnnotation) {
    if (!anno.modelId || anno.expressId === undefined) return;

    try {
      const highlighter = this.engine.highlighter || (window as any).viewer_highlighter;
      if (highlighter) {
        const modelIdMap = { [anno.modelId]: new Set([anno.expressId]) };
        await highlighter.highlightByID("select", modelIdMap, true, false);
      }

      const fragments = this.engine.fragments || (window as any).viewer_fragments;
      if (fragments) {
        const model = fragments.list.get(anno.modelId);
        if (model && typeof (window as any).displayElementProperties === "function") {
          (window as any).displayElementProperties(model, anno.expressId);
        }
      }
    } catch (err) {
      console.warn("Could not highlight tagged element:", err);
    }
  }

  public toggleXRay(enable?: boolean) {
    this.isXRayActive = enable !== undefined ? enable : !this.isXRayActive;
    const fragments = this.engine.fragments || (window as any).viewer_fragments;
    if (!fragments) return;

    for (const [, model] of fragments.list) {
      const modelObj = (model?.object || model) as THREE.Object3D;
      if (modelObj && typeof modelObj.traverse === "function") {
        modelObj.traverse((child: any) => {
          if (child.isMesh && child.material) {
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((m: any) => {
              if (this.isXRayActive) {
                if (m.userData.origOpacity === undefined) m.userData.origOpacity = m.opacity ?? 1.0;
                if (m.userData.origTransparent === undefined) m.userData.origTransparent = m.transparent ?? false;
                m.transparent = true;
                m.opacity = 0.2;
                m.depthWrite = false;
              } else {
                m.opacity = m.userData.origOpacity ?? 1.0;
                m.transparent = m.userData.origTransparent ?? false;
                m.depthWrite = true;
              }
              m.needsUpdate = true;
            });
          }
        });
      }
    }
  }

  public closePinDetailsModal() {
    const existing = document.getElementById("pin-details-popover");
    if (existing) existing.remove();
    this.activePopoverId = null;
  }

  public showPinDetailsModal(anno: PinAnnotation) {
    this.closePinDetailsModal();
    this.activePopoverId = anno.id;

    const catColor = anno.color || "#3b82f6";
    const popover = document.createElement("div");
    popover.id = "pin-details-popover";
    popover.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 10000;
      background: var(--bg-panel, #18181b);
      border: 3px solid var(--border-strong, #000000);
      border-radius: 4px;
      padding: 1.1rem;
      width: 370px;
      max-width: 90vw;
      box-shadow: var(--shadow-brutal, 6px 6px 0px #000000);
      color: var(--text-primary, #ffffff);
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      pointer-events: auto;
      animation: popIn 0.15s ease-out;
    `;

    popover.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-strong, #000000); padding-bottom: 0.4rem;">
        <div style="display: flex; align-items: center; gap: 0.45rem; font-weight: 800; font-size: 0.84rem;">
          <span style="background: ${catColor}; color: #ffffff; width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid var(--border-strong, #000); display: inline-flex; align-items: center; justify-content: center; font-size: 0.68rem; font-weight: 900;">${anno.number}</span>
          <span style="color: var(--text-primary); font-weight: 800;">${anno.title}</span>
        </div>
        <button id="btn-close-pin-popover" style="background: none; border: none; font-size: 1.25rem; font-weight: 900; cursor: pointer; color: var(--text-primary); line-height: 1;">×</button>
      </div>

      <div style="display: flex; gap: 0.4rem; align-items: center; flex-wrap: wrap;">
        <span style="font-size: 0.62rem; font-weight: 800; text-transform: uppercase; background: ${catColor}; color: #ffffff; padding: 0.15rem 0.45rem; border: 1px solid var(--border-strong, #000); border-radius: 2px;">${anno.category}</span>
        ${anno.elementName ? `<span style="font-size: 0.62rem; font-weight: 800; background: var(--bg-card); color: var(--accent-500); padding: 0.15rem 0.45rem; border: 1px solid var(--border-subtle); border-radius: 2px; display: inline-flex; align-items: center; gap: 0.25rem;"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg> ${anno.elementName}</span>` : ''}
        <span style="font-size: 0.62rem; font-family: var(--font-mono, monospace); color: var(--text-muted);">Logged: ${anno.timestamp}</span>
      </div>

      ${anno.thumbnail ? `
        <div style="width: 100%; height: 110px; border: 1.5px solid var(--border-strong, #000); border-radius: 2px; overflow: hidden; background: #000;">
          <img src="${anno.thumbnail}" alt="Pin Snapshot" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      ` : ''}

      <div style="background: var(--bg-card); border: 1.5px solid var(--border-strong, #000); padding: 0.55rem; border-radius: 2px; font-size: 0.72rem; line-height: 1.45; color: var(--text-primary);">
        ${anno.comment}
      </div>

      <div style="display: flex; gap: 0.4rem; margin-top: 0.2rem; flex-wrap: wrap;">
        <button id="btn-focus-pin" style="flex: 1; min-width: 120px; background: var(--accent-500); color: var(--accent-btn-text, #000000); border: 2px solid var(--border-strong, #000); padding: 0.4rem; font-size: 0.7rem; font-weight: 900; border-radius: 2px; cursor: pointer; box-shadow: var(--shadow-sm, 2px 2px 0px #000); display: flex; align-items: center; justify-content: center; gap: 0.3rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> Focus Camera</button>
        <button id="btn-xray-pin" style="background: var(--bg-card); color: var(--text-primary); border: 2px solid var(--border-strong, #000); padding: 0.4rem 0.6rem; font-size: 0.7rem; font-weight: 800; border-radius: 2px; cursor: pointer; box-shadow: var(--shadow-sm, 2px 2px 0px #000); display: flex; align-items: center; justify-content: center; gap: 0.3rem;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4m6 0h4a2 2 0 0 0 2-2v-4m0-6V5a2 2 0 0 0-2-2h-4"/><circle cx="12" cy="12" r="3"/></svg> X-Ray</button>
        <button id="btn-delete-pin" style="background: var(--bg-card); color: var(--color-danger, #ef4444); border: 2px solid var(--border-strong, #000); padding: 0.4rem 0.65rem; font-size: 0.7rem; font-weight: 800; border-radius: 2px; cursor: pointer; box-shadow: var(--shadow-sm, 2px 2px 0px #000); display: flex; align-items: center; justify-content: center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
      </div>
    `;

    document.body.appendChild(popover);

    popover.querySelector("#btn-close-pin-popover")?.addEventListener("click", () => this.closePinDetailsModal());
    popover.querySelector("#btn-focus-pin")?.addEventListener("click", () => {
      this.focusOnAnnotation(anno.id);
      this.selectAndHighlightTaggedElement(anno);
      this.closePinDetailsModal();
    });
    popover.querySelector("#btn-xray-pin")?.addEventListener("click", () => {
      this.toggleXRay();
      this.selectAndHighlightTaggedElement(anno);
    });
    popover.querySelector("#btn-delete-pin")?.addEventListener("click", () => {
      this.removeAnnotation(anno.id);
      this.closePinDetailsModal();
    });
  }

  public exportBCFJSON() {
    const data = {
      project: "BIM Viewer Issue Report",
      exportedAt: new Date().toISOString(),
      totalPins: this.annotations.length,
      topics: this.annotations.map(a => ({
        guid: a.id,
        number: a.number,
        title: a.title,
        category: a.category,
        creationDate: a.timestamp,
        comment: a.comment,
        element: {
          name: a.elementName,
          expressId: a.expressId,
          modelId: a.modelId
        },
        viewpoint: {
          position: { x: a.position.x, y: a.position.y, z: a.position.z },
          cameraPosition: a.cameraPosition ? { x: a.cameraPosition.x, y: a.cameraPosition.y, z: a.cameraPosition.z } : null,
          cameraTarget: a.cameraTarget ? { x: a.cameraTarget.x, y: a.cameraTarget.y, z: a.cameraTarget.z } : null
        },
        snapshot: a.thumbnail || null
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bim-field-issues-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  public async focusOnAnnotation(id: string) {
    const anno = this.annotations.find(a => a.id === id);
    const camera = this.engine.world?.camera || (window as any).viewer_world?.camera;
    if (!anno || !camera?.controls) return;
    const controls = camera.controls;
    const p = anno.position;
    await controls.setLookAt(p.x + 4, p.y + 3, p.z + 4, p.x, p.y, p.z, true);
    await this.selectAndHighlightTaggedElement(anno);
  }

  public removeAnnotation(id: string) {
    const idx = this.annotations.findIndex(a => a.id === id);
    if (idx !== -1) {
      const anno = this.annotations[idx];
      if (anno.elementEl) {
        anno.elementEl.remove();
      }
      if (anno.threeMesh) {
        this.pinsGroup.remove(anno.threeMesh);
        anno.threeMesh.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
            else child.material.dispose();
          }
        });
      }
      this.annotations.splice(idx, 1);
      if (this.activePopoverId === id) this.closePinDetailsModal();
      if (this.onPinsUpdated) this.onPinsUpdated(this.getFilteredAnnotations());
    }
  }

  public updateOverlayPositions() {
    const cam = this.engine.world?.camera?.three || (window as any).viewer_world?.camera?.three;
    if (!cam || this.annotations.length === 0) return;

    cam.updateMatrixWorld(true);

    const canvas = (this.engine.world?.renderer as any)?.three?.domElement 
      || document.querySelector("#container canvas")
      || document.getElementById("container")
      || document.body;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    for (const anno of this.annotations) {
      if (!anno.elementEl) continue;

      if (this.activeFilterCategory !== "All" && anno.category !== this.activeFilterCategory) {
        anno.elementEl.style.display = "none";
        continue;
      }

      // Project top of 3D pin sphere head (sphere is at y+0.8, top is at y+1.0)
      const worldPos = anno.position.clone();
      worldPos.y += 1.05;

      const screenPos = worldPos.clone().project(cam);

      // Check if point is behind camera or beyond clip boundaries
      if (screenPos.z > 1.0 || screenPos.z < -1.0) {
        anno.elementEl.style.display = "none";
        continue;
      }

      anno.elementEl.style.display = "flex";
      const x = (screenPos.x * 0.5 + 0.5) * rect.width + rect.left;
      const y = (screenPos.y * -0.5 + 0.5) * rect.height + rect.top;

      anno.elementEl.style.left = `${x.toFixed(2)}px`;
      anno.elementEl.style.top = `${y.toFixed(2)}px`;
    }
  }

  public getAnnotations(): PinAnnotation[] {
    return this.annotations;
  }

  public clearAll() {
    this.closePinDetailsModal();
    for (const anno of this.annotations) {
      if (anno.elementEl) anno.elementEl.remove();
      if (anno.threeMesh) {
        this.pinsGroup.remove(anno.threeMesh);
        anno.threeMesh.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
            else child.material.dispose();
          }
        });
      }
    }
    this.annotations = [];
    this.nextPinNumber = 1;
    if (this.onPinsUpdated) this.onPinsUpdated(this.getFilteredAnnotations());
  }
}
