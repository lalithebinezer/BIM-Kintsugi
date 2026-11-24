/**
 * GpuPerformanceMonitor — WebGL Memory Telemetry, Safe Disposal & Adaptive Resolution Scaling
 *
 * Monitors live Three.js WebGLRenderer geometries, textures, draw calls, and triangle
 * budgets, and implements Adaptive Dynamic Resolution Scaling (DRS) during active camera
 * interaction or 4D playback to lock smooth framerates on integrated GPUs & tablets.
 */

import * as THREE from "three";

export interface GpuMemorySnapshot {
  geometries: number;
  textures: number;
  drawCalls: number;
  triangles: number;
  pixelRatio: number;
  drsActive: boolean;
}

export class GpuPerformanceMonitor {
  private static instance: GpuPerformanceMonitor | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private nativePixelRatio = 1;
  private drsEnabled = true;
  private drsActive = false;
  private restoreTimer: ReturnType<typeof setTimeout> | null = null;

  public static getInstance(): GpuPerformanceMonitor {
    if (!this.instance) this.instance = new GpuPerformanceMonitor();
    return this.instance;
  }

  public attach(renderer: THREE.WebGLRenderer): void {
    this.renderer = renderer;
    this.nativePixelRatio = Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1);
  }

  public setDrsEnabled(enabled: boolean): void {
    this.drsEnabled = enabled;
    if (!enabled && this.renderer) {
      this.drsActive = false;
      this.renderer.setPixelRatio(this.nativePixelRatio);
    }
  }

  /**
   * Call during high-frequency camera orbit/pan or 4D playback ticks.
   * Temporarily steps pixelRatio down for 60 FPS fluid motion, then restores
   * full crisp native DPR 220ms after interaction settles.
   */
  public notifyInteractiveMotion(): void {
    if (!this.drsEnabled || !this.renderer || this.nativePixelRatio <= 1) return;
    if (!this.drsActive) {
      this.drsActive = true;
      this.renderer.setPixelRatio(Math.max(0.85, this.nativePixelRatio * 0.65));
    }
    if (this.restoreTimer) clearTimeout(this.restoreTimer);
    this.restoreTimer = setTimeout(() => {
      if (this.renderer) {
        this.renderer.setPixelRatio(this.nativePixelRatio);
      }
      this.drsActive = false;
    }, 220);
  }

  public getSnapshot(): GpuMemorySnapshot {
    if (!this.renderer) {
      return {
        geometries: 0,
        textures: 0,
        drawCalls: 0,
        triangles: 0,
        pixelRatio: this.nativePixelRatio,
        drsActive: this.drsActive,
      };
    }
    return {
      geometries: this.renderer.info.memory.geometries,
      textures: this.renderer.info.memory.textures,
      drawCalls: this.renderer.info.render.calls,
      triangles: this.renderer.info.render.triangles,
      pixelRatio: this.renderer.getPixelRatio(),
      drsActive: this.drsActive,
    };
  }

  /**
   * Recursively disposes Three.js geometries, materials, and textures on an Object3D
   * to prevent WebGL heap leaks when unloading models or tearing down 3D overlays.
   */
  public static disposeObject3D(root: THREE.Object3D | null | undefined): number {
    if (!root) return 0;
    let disposedCount = 0;
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry && typeof mesh.geometry.dispose === "function") {
        mesh.geometry.dispose();
        disposedCount++;
      }
      const mat = mesh.material;
      if (Array.isArray(mat)) {
        for (const m of mat) {
          disposeMaterialTextures(m);
          m.dispose?.();
          disposedCount++;
        }
      } else if (mat) {
        disposeMaterialTextures(mat);
        mat.dispose?.();
        disposedCount++;
      }
    });
    return disposedCount;
  }
}

function disposeMaterialTextures(mat: THREE.Material): void {
  const rec = mat as unknown as Record<string, unknown>;
  for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap"]) {
    const tex = rec[key];
    if (tex && typeof (tex as THREE.Texture).dispose === "function") {
      (tex as THREE.Texture).dispose();
    }
  }
}
