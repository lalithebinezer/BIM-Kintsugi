import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";

export interface ClashToleranceItem {
  id: string;
  elementA: { id: number; name: string; category: string };
  elementB: { id: number; name: string; category: string };
  penetrationDepthMm: number;
  deltaX: number;
  deltaY: number;
  deltaZ: number;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
  position: THREE.Vector3;
}

export class ClashToleranceInspector {
  private static instance: ClashToleranceInspector | null = null;
  private engine: BimEngine;
  private toleranceClashes: ClashToleranceItem[] = [];

  private constructor() {
    this.engine = BimEngine.getInstance();
    // Default clash clearance detections
    this.toleranceClashes = [
      {
        id: "tol-clash-1",
        elementA: { id: 1042, name: "HVAC Supply Air Duct 600x400", category: "IFCFLOWSEGMENT" },
        elementB: { id: 2088, name: "W12x26 Structural Steel Beam", category: "IFCBEAM" },
        penetrationDepthMm: 142.5,
        deltaX: 25.0,
        deltaY: 142.5,
        deltaZ: 10.0,
        severity: "High",
        recommendation: "Lower HVAC duct run by 160mm along Level 1 ceiling void to achieve 25mm clearance.",
        position: new THREE.Vector3(12.4, 4.2, -6.8),
      },
      {
        id: "tol-clash-2",
        elementA: { id: 3105, name: "Fire Sprinkler Main 100mm Pipe", category: "IFCFLOWSEGMENT" },
        elementB: { id: 4120, name: "Cast-in-Place Concrete Wall 200mm", category: "IFCWALL" },
        penetrationDepthMm: 85.0,
        deltaX: 85.0,
        deltaY: 0.0,
        deltaZ: 12.0,
        severity: "Medium",
        recommendation: "Add 150mm round penetration sleeve with firestop collar in structural wall schedule.",
        position: new THREE.Vector3(-8.5, 3.8, 14.2),
      },
      {
        id: "tol-clash-3",
        elementA: { id: 5012, name: "Cable Tray 300x100mm", category: "IFCFLOWSEGMENT" },
        elementB: { id: 6044, name: "Domestic Cold Water 50mm", category: "IFCFLOWSEGMENT" },
        penetrationDepthMm: 32.0,
        deltaX: 10.0,
        deltaY: 32.0,
        deltaZ: 5.0,
        severity: "Low",
        recommendation: "Offset domestic cold water pipe 50mm horizontally to meet NEC 110.26 working space.",
        position: new THREE.Vector3(3.2, 5.1, 2.4),
      },
    ];
  }

  public static getInstance(): ClashToleranceInspector {
    if (!ClashToleranceInspector.instance) {
      ClashToleranceInspector.instance = new ClashToleranceInspector();
    }
    return ClashToleranceInspector.instance;
  }

  public getToleranceClashes(): ClashToleranceItem[] {
    return this.toleranceClashes;
  }

  /**
   * Replaces demo items with live CI-ranked intersections from ClashDetector.
   */
  public syncFromClashResults(
    clashes: Array<{
      id: string;
      elementA: { expressId: number; name: string; category: string };
      elementB: { expressId: number; name: string; category: string };
      overlapDistance: number;
      intersectionPoint: [number, number, number];
      axisPenetration?: [number, number, number];
      criticalityIndex?: number;
      severity: string;
    }>
  ): void {
    if (!clashes || clashes.length === 0) return;
    this.toleranceClashes = clashes.slice(0, 50).map((c) => {
      const penMm = Math.round(c.overlapDistance * 1000 * 10) / 10;
      const [px, py, pz] = c.axisPenetration ?? [c.overlapDistance, c.overlapDistance, c.overlapDistance];
      const dx = Math.round(px * 1000 * 10) / 10;
      const dy = Math.round(py * 1000 * 10) / 10;
      const dz = Math.round(pz * 1000 * 10) / 10;
      const sev: "High" | "Medium" | "Low" =
        c.severity === "critical" || (c.criticalityIndex ?? 0) > 2.0
          ? "High"
          : c.severity === "major" || (c.criticalityIndex ?? 0) > 1.0
          ? "Medium"
          : "Low";
      const minAxis = dy <= dx && dy <= dz ? "vertically" : "horizontally";
      return {
        id: c.id,
        elementA: { id: c.elementA.expressId, name: c.elementA.name, category: c.elementA.category },
        elementB: { id: c.elementB.expressId, name: c.elementB.name, category: c.elementB.category },
        penetrationDepthMm: penMm,
        deltaX: dx,
        deltaY: dy,
        deltaZ: dz,
        severity: sev,
        recommendation: `Offset ${c.elementA.name} ${minAxis} by ${(penMm + 25).toFixed(0)}mm or coordinate sleeve against ${c.elementB.name}.`,
        position: new THREE.Vector3(c.intersectionPoint[0], c.intersectionPoint[1], c.intersectionPoint[2]),
      };
    });
  }

  public focusClash(clash: ClashToleranceItem) {
    try {
      const camera = this.engine.world?.camera;
      if (!camera || !camera.controls) return;

      const p = clash.position;
      camera.controls.setLookAt(p.x + 3, p.y + 2, p.z + 4, p.x, p.y, p.z, true);
    } catch (e) {}
  }
}
