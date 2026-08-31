import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { SoundManager } from "../core/SoundManager";

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
    // Default waypoints
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
    const radius = 35;
    const height = 15;

    const loop = () => {
      if (!this.isDroneOrbiting) return;

      this.orbitAngle += orbitSpeed;
      const x = Math.sin(this.orbitAngle) * radius;
      const z = Math.cos(this.orbitAngle) * radius;

      const camera = this.engine.world?.camera;
      if (camera && camera.controls) {
        camera.controls.setLookAt(x, height, z, 0, 3, 0, false);
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    loop();
  }

  public async playTour() {
    if (this.isTourPlaying || this.waypoints.length === 0) return;
    this.isTourPlaying = true;
    SoundManager.getInstance().playBeacon();

    for (let i = 0; i < this.waypoints.length; i++) {
      if (!this.isTourPlaying) break;
      const wp = this.waypoints[i];
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
