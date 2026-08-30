import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export type GraphicsPreset = "performance" | "balanced" | "cinematic";

export class GraphicsVFXManager {
  private static instance: GraphicsVFXManager | null = null;
  private engine: BimEngine;
  private preset: GraphicsPreset = "balanced";
  private groundShadowMesh: THREE.Mesh | null = null;

  private constructor() {
    this.engine = BimEngine.getInstance();
    const saved = typeof localStorage !== "undefined" ? (localStorage.getItem("bim_graphics_preset") as GraphicsPreset) : null;
    if (saved && ["performance", "balanced", "cinematic"].includes(saved)) {
      this.preset = saved;
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
    } else if (preset === "balanced") {
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;
      if (this.groundShadowMesh) {
        this.groundShadowMesh.visible = true;
        (this.groundShadowMesh.material as THREE.MeshBasicMaterial).opacity = 0.55;
      }
    } else {
      // performance
      renderer.toneMapping = THREE.LinearToneMapping;
      renderer.toneMappingExposure = 1.0;
      if (this.groundShadowMesh) {
        this.groundShadowMesh.visible = false;
      }
    }
  }

  public updateGroundShadowPosition(center: THREE.Vector3, size: THREE.Vector3) {
    if (!this.groundShadowMesh) return;
    this.groundShadowMesh.position.set(center.x, center.y - size.y / 2 - 0.01, center.z);
    const maxDim = Math.max(size.x, size.z) * 2.2;
    this.groundShadowMesh.scale.set(maxDim / 80, maxDim / 80, 1);
  }
}
