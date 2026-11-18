import * as THREE from "three";
import * as OBF from "@thatopen/components-front";
import { BimEngine } from "../core/BimEngine";

export interface CivilAlignmentReport {
  modelCount: number;
  alignmentCount: number;
  curveCount: number;
  crossSectionActive: boolean;
}

/**
 * IFC 4.3 Infrastructure & Civil Alignment Navigator (Phase 5C).
 * Wraps `@thatopen/components-front` `CivilNavigators` & `CivilCrossSectionNavigator`
 * to inspect road/rail/bridge alignments and jump cross-sections along stations.
 */
export interface HorizontalClothoidInput {
  startX: number;
  startZ: number;
  startDirRad: number;
  length: number;
  /** Signed radius in meters (Infinity or 0 = straight tangent). */
  startRadius: number;
  /** Signed radius in meters (Infinity or 0 = straight tangent). */
  endRadius: number;
  startStation?: number;
}

export interface AlignmentSamplePoint {
  station: number;
  x: number;
  y: number;
  z: number;
  tangentRad: number;
  curvature: number;
}

/**
 * Clean-room Euler/Cornu Clothoid sampler using composite Simpson numerical integration
 * for `IfcAlignmentHorizontal` transition spiral segments.
 */
export function sampleClothoidSegment(
  input: HorizontalClothoidInput,
  numSamples: number = 24
): AlignmentSamplePoint[] {
  const L = Math.max(0.001, input.length);
  const k0 = Number.isFinite(input.startRadius) && Math.abs(input.startRadius) > 1e-9 ? 1 / input.startRadius : 0;
  const k1 = Number.isFinite(input.endRadius) && Math.abs(input.endRadius) > 1e-9 ? 1 / input.endRadius : 0;
  const dk = (k1 - k0) / L;
  const steps = Math.max(2, numSamples);
  const startS = input.startStation ?? 0;

  const thetaAt = (s: number) => input.startDirRad + k0 * s + 0.5 * dk * s * s;

  const points: AlignmentSamplePoint[] = [];
  let accX = input.startX;
  let accZ = input.startZ;
  const ds = L / steps;

  for (let i = 0; i <= steps; i++) {
    const s = i * ds;
    if (i > 0) {
      // Composite Simpson step over [s - ds, s]
      const sPrev = s - ds;
      const sMid = sPrev + ds * 0.5;
      const t0 = thetaAt(sPrev);
      const tMid = thetaAt(sMid);
      const t1 = thetaAt(s);
      accX += (ds / 6) * (Math.cos(t0) + 4 * Math.cos(tMid) + Math.cos(t1));
      accZ += (ds / 6) * (Math.sin(t0) + 4 * Math.sin(tMid) + Math.sin(t1));
    }

    points.push({
      station: Number((startS + s).toFixed(3)),
      x: accX,
      y: 0,
      z: accZ,
      tangentRad: thetaAt(s),
      curvature: k0 + dk * s,
    });
  }

  return points;
}

/**
 * Evaluates a vertical parabolic curve segment (`IfcAlignmentVertical`) across station steps.
 */
export function sampleVerticalParabola(
  startElev: number,
  g1: number,
  g2: number,
  length: number,
  startStation: number = 0,
  steps: number = 20
): Array<{ station: number; elevation: number; grade: number }> {
  const L = Math.max(0.001, length);
  const n = Math.max(2, steps);
  const out: Array<{ station: number; elevation: number; grade: number }> = [];
  for (let i = 0; i <= n; i++) {
    const x = (L * i) / n;
    const elev = startElev + g1 * x + ((g2 - g1) / (2 * L)) * x * x;
    const grade = g1 + ((g2 - g1) / L) * x;
    out.push({
      station: Number((startStation + x).toFixed(3)),
      elevation: Number(elev.toFixed(4)),
      grade: Number(grade.toFixed(5)),
    });
  }
  return out;
}

/** Formats station meters into standard civil chainage label (e.g. `1250` -> `1+250`). */
export function formatChainage(stationMeters: number): string {
  const km = Math.floor(stationMeters / 1000);
  const rem = Math.round(stationMeters - km * 1000);
  return `${km}+${String(rem).padStart(3, "0")}`;
}

/**
 * Renders a lightweight inline SVG Elevation vs. Chainage profile diagram for vertical alignments.
 */
export function buildVerticalProfileSvg(
  samples: Array<{ station: number; elevation: number }>,
  width: number = 320,
  height: number = 96
): string {
  if (samples.length < 2) return `<svg width="${width}" height="${height}"></svg>`;
  const minS = Math.min(...samples.map((p) => p.station));
  const maxS = Math.max(...samples.map((p) => p.station));
  const minE = Math.min(...samples.map((p) => p.elevation));
  const maxE = Math.max(...samples.map((p) => p.elevation));
  const pad = 10;
  const spanS = Math.max(1, maxS - minS);
  const spanE = Math.max(0.1, maxE - minE);

  const pts = samples
    .map((p) => {
      const px = pad + ((p.station - minS) / spanS) * (width - pad * 2);
      const py = height - pad - ((p.elevation - minE) / spanE) * (height - pad * 2);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg"><polyline fill="none" stroke="#38bdf8" stroke-width="2" points="${pts}"/><text x="${pad}" y="${height - 2}" font-size="9" fill="#94a3b8">${formatChainage(minS)}</text><text x="${width - 42}" y="${height - 2}" font-size="9" fill="#94a3b8">${formatChainage(maxS)}</text></svg>`;
}

export class CivilAlignmentModule {
  private static instance: CivilAlignmentModule | null = null;
  private engine: BimEngine;
  private navigators: OBF.CivilNavigators;
  private crossSection: OBF.CivilCrossSectionNavigator;
  private alignmentGroups: THREE.Group[] = [];
  private crossSectionEnabled: boolean = false;

  private constructor() {
    this.engine = BimEngine.getInstance();
    this.navigators = this.engine.components.get(OBF.CivilNavigators);
    this.crossSection = this.engine.components.get(OBF.CivilCrossSectionNavigator);
    if (this.engine.world?.renderer) {
      this.crossSection.world = this.engine.world;
    }
  }

  public static getInstance(): CivilAlignmentModule {
    if (!CivilAlignmentModule.instance) {
      CivilAlignmentModule.instance = new CivilAlignmentModule();
    }
    return CivilAlignmentModule.instance;
  }

  /**
   * Scans all loaded Fragments models for IFC4x3 `IfcAlignment` geometry groups
   * and attaches them to the 3D world + `CivilNavigators`.
   */
  public async scanAndAttachAlignments(): Promise<CivilAlignmentReport> {
    const world = this.engine.world;
    this.clearAlignments();

    let modelCount = 0;
    let curveCount = 0;

    if (!this.engine.fragments?.initialized) {
      return {
        modelCount: 0,
        alignmentCount: 0,
        curveCount: 0,
        crossSectionActive: this.crossSectionEnabled,
      };
    }

    for (const [modelId, model] of this.engine.fragments.list) {
      modelCount++;
      if (typeof (model as any).getAlignments !== "function") continue;
      try {
        const group = (await (model as any).getAlignments()) as THREE.Group;
        if (group && group.children.length > 0) {
          this.alignmentGroups.push(group);
          world?.scene?.three?.add(group);
          group.traverse((obj) => {
            if ((obj as THREE.Line).isLine) curveCount++;
          });
          const nav = this.navigators.create(`civil-${modelId}`);
          if (world) nav.world = world;
          nav.alignments = [group];
        }
      } catch {
        // Model contains no IFC 4.3 alignments
      }
    }

    this.navigators.updateAlignments();
    return {
      modelCount,
      alignmentCount: this.alignmentGroups.length,
      curveCount,
      crossSectionActive: this.crossSectionEnabled,
    };
  }

  public toggleCrossSection(enable?: boolean): boolean {
    const target = enable !== undefined ? enable : !this.crossSectionEnabled;
    if (this.engine.world?.renderer) {
      this.crossSection.world = this.engine.world;
      this.crossSection.sectionVisible = target;
    }
    this.crossSectionEnabled = target;
    return target;
  }

  public clearAlignments() {
    for (const g of this.alignmentGroups) {
      g.removeFromParent();
    }
    this.alignmentGroups = [];
    for (const id of [...this.navigators.list.keys()]) {
      this.navigators.delete(id);
    }
  }

  public dispose() {
    this.clearAlignments();
    this.toggleCrossSection(false);
  }
}
