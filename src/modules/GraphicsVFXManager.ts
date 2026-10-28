import * as THREE from "three";
import * as OBF from "@thatopen/components-front";
import { BimEngine } from "../core/BimEngine";

export type GraphicsPreset = "performance" | "balanced" | "cinematic";
export type RenderStyleMode = "color" | "pen" | "pen-shadows" | "color-pen-shadows" | "gloss";

export class GraphicsVFXManager {
  private static instance: GraphicsVFXManager | null = null;
  private engine: BimEngine;
  private preset: GraphicsPreset = "balanced";
  private renderStyle: RenderStyleMode = "color-pen-shadows";
  private groundShadowMesh: THREE.Mesh | null = null;

  private constructor() {
    this.engine = BimEngine.getInstance();
    const saved = typeof localStorage !== "undefined" ? (localStorage.getItem("bim_graphics_preset") as GraphicsPreset) : null;
    if (saved && ["performance", "balanced", "cinematic"].includes(saved)) {
      this.preset = saved;
    }
    const savedStyle = typeof localStorage !== "undefined" ? (localStorage.getItem("bim_render_style") as RenderStyleMode) : null;
    if (savedStyle && ["color", "pen", "pen-shadows", "color-pen-shadows", "gloss"].includes(savedStyle)) {
      this.renderStyle = savedStyle;
    }
    this.initGroundShadow();
    this.applyPreset(this.preset);
  }

  public static getInstance(): GraphicsVFXManager {
    if (!GraphicsVFXManager.instance) {
      GraphicsVFXManager.instance = new GraphicsVFXManager();
    }
    return GraphicsVFXManager.instance;
  }

  private initGroundShadow() {
    const scene = this.engine.world?.scene?.three;
    if (!scene) return;

    // Create radial soft ambient ground shadow texture via canvas
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const grad = ctx.createRadialGradient(256, 256, 10, 256, 256, 250);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.75)");
      grad.addColorStop(0.35, "rgba(0, 0, 0, 0.45)");
      grad.addColorStop(0.7, "rgba(0, 0, 0, 0.15)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(80, 80);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.7,
      depthWrite: false,
    });

    this.groundShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.groundShadowMesh.rotation.x = -Math.PI / 2;
    this.groundShadowMesh.position.y = -0.01;
    this.groundShadowMesh.name = "BIM_GroundContactShadow";
    this.groundShadowMesh.renderOrder = 1;
    scene.add(this.groundShadowMesh);
  }

  public getPreset(): GraphicsPreset {
    return this.preset;
  }

  public getRenderStyle(): RenderStyleMode {
    return this.renderStyle;
  }

  public setRenderStyle(style: RenderStyleMode) {
    this.renderStyle = style;
    try {
      localStorage.setItem("bim_render_style", style);
    } catch (e) {}

    try {
      const ppRenderer = this.engine.world?.renderer as OBF.PostproductionRenderer | undefined;
      const post = ppRenderer?.postproduction;
      if (post) {
        post.enabled = true;
        if (style === "pen") {
          post.style = OBF.PostproductionAspect.PEN;
          post.glossEnabled = false;
        } else if (style === "pen-shadows") {
          post.style = OBF.PostproductionAspect.PEN_SHADOWS;
          post.glossEnabled = false;
        } else if (style === "color-pen-shadows") {
          post.style = OBF.PostproductionAspect.COLOR_PEN_SHADOWS;
          post.glossEnabled = false;
        } else if (style === "gloss") {
          post.style = OBF.PostproductionAspect.COLOR_SHADOWS;
          post.glossEnabled = true;
        } else {
          post.style = OBF.PostproductionAspect.COLOR;
          post.glossEnabled = false;
        }
      }
    } catch (e) {}
  }

  public setPreset(preset: GraphicsPreset) {
    this.preset = preset;
    try {
      localStorage.setItem("bim_graphics_preset", preset);
    } catch (e) {}
    this.applyPreset(preset);
  }

  public applyPreset(preset: GraphicsPreset) {
    const renderer = this.engine.world?.renderer?.three;
    if (!renderer) return;

    if (preset === "cinematic") {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      if (this.groundShadowMesh) {
        this.groundShadowMesh.visible = true;
        (this.groundShadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.85;
      }
      try {
        const post = (this.engine.world?.renderer as OBF.PostproductionRenderer)?.postproduction;
        if (post) {
          post.enabled = true;
          post.smaaEnabled = true;
          post.style = OBF.PostproductionAspect.COLOR_PEN_SHADOWS;
        }
      } catch (e) {}
    } else if (preset === "balanced") {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      if (this.groundShadowMesh) {
        this.groundShadowMesh.visible = true;
        (this.groundShadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.55;
      }
      try {
        const post = (this.engine.world?.renderer as OBF.PostproductionRenderer)?.postproduction;
        if (post) {
          post.enabled = true;
          post.smaaEnabled = true;
          post.style = OBF.PostproductionAspect.COLOR_SHADOWS;
        }
      } catch (e) {}
    } else {
      // performance
      renderer.toneMapping = THREE.LinearToneMapping;
      renderer.toneMappingExposure = 1.0;
      if (this.groundShadowMesh) {
        this.groundShadowMesh.visible = false;
      }
      try {
        const post = (this.engine.world?.renderer as OBF.PostproductionRenderer)?.postproduction;
        if (post) {
          post.smaaEnabled = false;
          post.style = OBF.PostproductionAspect.COLOR;
        }
      } catch (e) {}
    }
  }

  public updateGroundShadowPosition(center: THREE.Vector3, size: THREE.Vector3) {
    if (!this.groundShadowMesh) return;
    this.groundShadowMesh.position.set(center.x, center.y - size.y / 2 - 0.01, center.z);
    const maxDim = Math.max(size.x, size.z) * 2.2;
    this.groundShadowMesh.scale.set(maxDim / 80, maxDim / 80, 1);
  }

  /**
   * Generates a 4K-styled Architectural Technical Drawing Sheet PNG with an ISO title block.
   */
  public exportTechnicalDrawingSheet(meta?: {
    projectTitle?: string;
    storeyName?: string;
    carbonGrade?: string;
    clashCount?: number;
  }): string {
    const previousStyle = this.renderStyle;
    this.setRenderStyle("color-pen-shadows");

    const sheetCanvas = document.createElement("canvas");
    sheetCanvas.width = 1920;
    sheetCanvas.height = 1080;
    const ctx = sheetCanvas.getContext("2d");

    if (ctx) {
      ctx.fillStyle = "#0b0f17";
      ctx.fillRect(0, 0, sheetCanvas.width, sheetCanvas.height);

      // Copy WebGL viewport if available
      try {
        const glCanvas = this.engine.world?.renderer?.three?.domElement;
        if (glCanvas && glCanvas.width > 0 && glCanvas.height > 0) {
          ctx.drawImage(glCanvas, 24, 24, 1872, 920);
        }
      } catch (e) {}

      // Outer architectural border
      ctx.strokeStyle = "#d4ff3f";
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 1880, 1040);

      // ISO Title Block Footer
      ctx.fillStyle = "#111827";
      ctx.fillRect(20, 955, 1880, 105);
      ctx.strokeStyle = "#374151";
      ctx.strokeRect(20, 955, 1880, 105);

      ctx.fillStyle = "#d4ff3f";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(meta?.projectTitle || "BIM KINTSUGI — ARCHITECTURAL COORDINATION SHEET", 44, 992);

      ctx.fillStyle = "#e5e7eb";
      ctx.font = "14px monospace";
      const storey = meta?.storeyName || "All Storeys (3D Isometric)";
      const grade = meta?.carbonGrade || "B";
      const clashes = meta?.clashCount ?? 0;
      const dateStr = new Date().toISOString().split("T")[0];
      ctx.fillText(
        `VIEW: ${storey}   |   6D CARBON RATING: GRADE ${grade}   |   OPEN CLASHES: ${clashes}   |   DATE: ${dateStr}   |   SCALE: NTS`,
        44,
        1030
      );
    }

    this.setRenderStyle(previousStyle);
    try {
      return sheetCanvas.toDataURL("image/png");
    } catch {
      return "data:image/png;base64,";
    }
  }
}
