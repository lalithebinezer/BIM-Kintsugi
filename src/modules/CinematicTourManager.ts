import * as THREE from "three";
import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";
import { SoundManager } from "../core/SoundManager";
import { CustomViewManager } from "../core/CustomViewManager";

export interface TourWaypoint {
  id: string;
  name: string;
  position: THREE.Vector3;
  target: THREE.Vector3;
  durationSeconds: number;
}

export class CinematicTourManager {
  private static instance: CinematicTourManager | null = null;
  private engine: BimEngine;
  private waypoints: TourWaypoint[] = [];
  private isTourPlaying: boolean = false;
  private isDroneOrbiting: boolean = false;
  private orbitAngle: number = 0;
  private animationFrameId: number | null = null;

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.waypoints = [
      { id: "wp1", name: "Exterior Front Facade", position: new THREE.Vector3(25, 12, 35), target: new THREE.Vector3(0, 4, 0), durationSeconds: 4 },
      { id: "wp2", name: "High Angle Isometric", position: new THREE.Vector3(-30, 22, 28), target: new THREE.Vector3(0, 2, 0), durationSeconds: 5 },
      { id: "wp3", name: "Roof & Structural Core", position: new THREE.Vector3(5, 30, -5), target: new THREE.Vector3(0, 0, 0), durationSeconds: 4 },
      { id: "wp4", name: "Main Entrance Lobby", position: new THREE.Vector3(8, 2.5, 12), target: new THREE.Vector3(0, 2.5, 0), durationSeconds: 5 },
    ];
  }

  public static getInstance(): CinematicTourManager {
    if (!CinematicTourManager.instance) {
      CinematicTourManager.instance = new CinematicTourManager();
    }
    return CinematicTourManager.instance;
  }

  /**
   * Computes the real bounding center and radius of loaded BIM models using OBC.BoundingBoxer
   * or Three.js scene meshes, falling back to default studio bounds when empty.
   */
  public getModelCenterAndRadius(): { center: THREE.Vector3; radius: number } {
    const fallback = { center: new THREE.Vector3(0, 3, 0), radius: 22 };
    try {
      const box = new THREE.Box3();
      const boxer = this.engine.components?.get(OBC.BoundingBoxer);
      if (boxer && typeof boxer.list !== "undefined") {
        try {
          boxer.list.clear();
          boxer.addFromModels();
          const b = boxer.get();
          if (b && !b.isEmpty()) {
            box.copy(b);
          }
          boxer.list.clear();
        } catch (e) {}
      }

      if (box.isEmpty() && this.engine.fragments?.list) {
        for (const [, model] of this.engine.fragments.list) {
          const obj = ((model as any).object || model) as THREE.Object3D;
          if (obj && typeof obj.traverse === "function") {
            box.expandByObject(obj);
          }
        }
      }

      if (!box.isEmpty()) {
        const sphere = new THREE.Sphere();
        box.getBoundingSphere(sphere);
        const radius = Math.max(8, Math.min(250, sphere.radius || 22));
        return { center: sphere.center.clone(), radius };
      }
    } catch (e) {}
    return fallback;
  }

  public addCurrentViewAsWaypoint(name?: string) {
    const camera = this.engine.world?.camera;
    if (!camera || !camera.controls) return;

    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();
    camera.controls.getPosition(pos);
    camera.controls.getTarget(target);

    const wp: TourWaypoint = {
      id: `wp_${Date.now()}`,
      name: name || `Waypoint ${this.waypoints.length + 1}`,
      position: pos.clone(),
      target: target.clone(),
      durationSeconds: 4,
    };

    this.waypoints.push(wp);
    SoundManager.getInstance().playSnap();
  }

  public getWaypoints(): TourWaypoint[] {
    return this.waypoints;
  }

  public toggleDroneOrbit(): boolean {
    this.isDroneOrbiting = !this.isDroneOrbiting;
    SoundManager.getInstance().playClick();

    if (this.isDroneOrbiting) {
      this.startDroneLoop();
    } else {
      if (this.animationFrameId !== null) {
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
    }
    return this.isDroneOrbiting;
  }

  private startDroneLoop() {
    const orbitSpeed = 0.005;
    const { center, radius } = this.getModelCenterAndRadius();
    const orbitRadius = radius * 1.65;
    const orbitHeight = center.y + radius * 0.55;

    const loop = () => {
      if (!this.isDroneOrbiting) return;

      this.orbitAngle += orbitSpeed;
      const x = center.x + Math.sin(this.orbitAngle) * orbitRadius;
      const z = center.z + Math.cos(this.orbitAngle) * orbitRadius;

      const camera = this.engine.world?.camera;
      if (camera && camera.controls) {
        camera.controls.setLookAt(x, orbitHeight, z, center.x, center.y, center.z, false);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  public async playTour() {
    if (this.isTourPlaying) return;

    // Prefer user-saved viewpoints from CustomViewManager if available, otherwise compute model-aware waypoints
    const customViews = CustomViewManager.getInstance().getAllViews().filter((v) => !v.isPreset);
    let activeWaypoints: TourWaypoint[] = [];

    if (customViews.length > 0) {
      activeWaypoints = customViews.map((v) => ({
        id: v.id,
        name: v.name,
        position: new THREE.Vector3(v.camera.position[0], v.camera.position[1], v.camera.position[2]),
        target: new THREE.Vector3(v.camera.target[0], v.camera.target[1], v.camera.target[2]),
        durationSeconds: 3.5,
      }));
    } else {
      const { center, radius } = this.getModelCenterAndRadius();
      activeWaypoints = [
        {
          id: "wp_front",
          name: "Exterior Front Facade",
          position: new THREE.Vector3(center.x + radius * 1.2, center.y + radius * 0.5, center.z + radius * 1.5),
          target: center.clone(),
          durationSeconds: 3.5,
        },
        {
          id: "wp_iso",
          name: "High Angle Isometric",
          position: new THREE.Vector3(center.x - radius * 1.4, center.y + radius * 0.95, center.z + radius * 1.25),
          target: center.clone(),
          durationSeconds: 4,
        },
        {
          id: "wp_roof",
          name: "Roof & Structural Core",
          position: new THREE.Vector3(center.x + radius * 0.3, center.y + radius * 1.4, center.z - radius * 0.4),
          target: center.clone(),
          durationSeconds: 3.5,
        },
        {
          id: "wp_entry",
          name: "Ground Approach View",
          position: new THREE.Vector3(center.x + radius * 0.55, center.y, center.z + radius * 0.75),
          target: center.clone(),
          durationSeconds: 4,
        },
      ];
    }

    if (activeWaypoints.length === 0) return;

    this.isTourPlaying = true;
    SoundManager.getInstance().playBeacon();

    for (let i = 0; i < activeWaypoints.length; i++) {
      if (!this.isTourPlaying) break;
      const wp = activeWaypoints[i];
      const camera = this.engine.world?.camera;

      if (camera && camera.controls) {
        await camera.controls.setLookAt(
          wp.position.x,
          wp.position.y,
          wp.position.z,
          wp.target.x,
          wp.target.y,
          wp.target.z,
          true
        );
      }
      await new Promise((r) => setTimeout(r, wp.durationSeconds * 1000));
    }

    this.isTourPlaying = false;
  }

  public stopTour() {
    this.isTourPlaying = false;
    if (this.isDroneOrbiting) {
      this.toggleDroneOrbit();
    }
  }
}
