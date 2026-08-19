import * as THREE from "three";
import { StorageCache } from "../utils/storageCache";

export interface Viewpoint {
  id: string;
  name: string;
  position: [number, number, number];
  target: [number, number, number];
  timestamp: string;
}

export class ViewpointManager {
  private static instance: ViewpointManager | null = null;
  private viewpoints: Viewpoint[] = [];
  private world: any = null;

  private constructor() {}

  public static getInstance(): ViewpointManager {
    if (!ViewpointManager.instance) {
      ViewpointManager.instance = new ViewpointManager();
    }
    return ViewpointManager.instance;
  }

  public async init(world: any) {
    this.world = world;
    const cache = StorageCache.getInstance();
    await cache.init();
    this.viewpoints = await cache.getViewpoints();
    this.renderViewpointList();
  }

  public saveCurrentViewpoint(name?: string): Viewpoint | null {
    if (!this.world || !this.world.camera || !this.world.camera.controls) return null;

    const controls = this.world.camera.controls;
    const pos = controls.getPosition ? controls.getPosition(new THREE.Vector3()) : this.world.camera.three.position;
    const target = controls.getTarget ? controls.getTarget(new THREE.Vector3()) : new THREE.Vector3(0, 0, 0);

    const vpName = name || `Viewpoint #${this.viewpoints.length + 1}`;
    const vp: Viewpoint = {
      id: `vp-${Date.now()}`,
      name: vpName,
      position: [pos.x, pos.y, pos.z],
      target: [target.x, target.y, target.z],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.viewpoints.push(vp);
    StorageCache.getInstance().saveViewpoints(this.viewpoints);
    this.renderViewpointList();
    return vp;
  }

  public restoreViewpoint(vpId: string) {
    const vp = this.viewpoints.find((v) => v.id === vpId);
    if (!vp || !this.world || !this.world.camera || !this.world.camera.controls) return;

    const controls = this.world.camera.controls;
    const [px, py, pz] = vp.position;
    const [tx, ty, tz] = vp.target;

    if (typeof controls.setLookAt === "function") {
      controls.setLookAt(px, py, pz, tx, ty, tz, true);
    } else {
      this.world.camera.three.position.set(px, py, pz);
      if (controls.target) controls.target.set(tx, ty, tz);
    }
  }

  public deleteViewpoint(vpId: string) {
    this.viewpoints = this.viewpoints.filter((v) => v.id !== vpId);
    StorageCache.getInstance().saveViewpoints(this.viewpoints);
    this.renderViewpointList();
  }

  public renderViewpointList() {
    const container = document.getElementById("viewpoint-bookmarks-list");
    if (!container) return;

    if (this.viewpoints.length === 0) {
      container.innerHTML = `<div style="font-size: 0.68rem; color: var(--text-muted); font-style: italic; padding: 0.4rem 0;">No camera bookmarks saved yet. Click "+ Bookmark View" to save position.</div>`;
      return;
    }

    container.innerHTML = this.viewpoints.map((vp) => `
      <div class="viewpoint-chip" data-vpid="${vp.id}" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.35rem 0.5rem; margin-bottom: 0.35rem; cursor: pointer; transition: all 0.15s ease;">
        <div class="vp-info" style="display: flex; align-items: center; gap: 0.4rem; flex: 1; overflow: hidden;" onclick="window.viewpointManager.restoreViewpoint('${vp.id}')">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-500)" stroke-width="2" style="flex-shrink:0;">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          <span style="font-size: 0.7rem; font-weight: 700; color: var(--text-primary); text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${vp.name}</span>
          <span style="font-size: 0.6rem; color: var(--text-muted); margin-left: auto;">${vp.timestamp}</span>
        </div>
        <button onclick="window.viewpointManager.deleteViewpoint('${vp.id}')" style="background: none; border: none; color: #ef4444; font-weight: bold; cursor: pointer; padding: 0 0.2rem; margin-left: 0.4rem;" title="Delete Bookmark">✕</button>
      </div>
    `).join("");

    (window as any).viewpointManager = this;
  }
}
