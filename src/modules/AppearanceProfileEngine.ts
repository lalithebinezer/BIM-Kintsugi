/**
 * AppearanceProfileEngine.ts — 4D Appearance Profile and Dynamic Clipping Plane Engine
 *
 * Implements Synchro 4D-grade visual appearance profiles:
 * - INSTALL (e.g. Bottom to Top growth)
 * - REMOVE (e.g. Top to Bottom demolition shrink)
 * - TEMPORARY (e.g. equipment / scaffolding active only during task)
 * - MAINTAIN (e.g. inspection highlight)
 *
 * Handles chronological multi-task evaluation, normalized task progress (t ∈ [0, 1]),
 * world-space bounding box clipping planes with directional interpolation, and zero-overhead
 * cleanup upon task completion.
 */

import * as THREE from "three";
import { FragmentIndexer } from "../core/FragmentIndexer";

export type ProfileType = "INSTALL" | "REMOVE" | "MAINTAIN" | "TEMPORARY";

export type GrowthDirection =
  | "NONE"
  | "BOTTOM_TOP"
  | "TOP_BOTTOM"
  | "LEFT_RIGHT"
  | "RIGHT_LEFT"
  | "FRONT_BACK"
  | "BACK_FRONT"
  | "CUSTOM_VECTOR";

export type GroupMode = "INDIVIDUAL" | "GROUP_BOUNDING_BOX";

export interface VisualAppearance {
  visible: boolean;
  colorOverride?: string;
  opacity?: number;
}

export interface AppearanceProfile {
  id: string;
  name: string;
  type: ProfileType;
  startAppearance: VisualAppearance;
  activeAppearance: VisualAppearance;
  endAppearance: VisualAppearance;
  growthDirection: GrowthDirection;
  customVector?: { x: number; y: number; z: number };
  groupMode: GroupMode;
}

export interface ElementVisualState {
  modelId: string;
  expressId: number;
  visible: boolean;
  colorOverride?: string;
  opacity?: number;
  progress: number; // 0.0 to 1.0
  clippingPlane?: THREE.Plane | null;
  activeProfile?: AppearanceProfile;
  activeTaskId?: string;
}

export interface TimelineEvaluationResult {
  elements: Map<string, ElementVisualState>;
  visibleCount: number;
  hiddenCount: number;
  activeCount: number;
  activePlanes: THREE.Plane[];
  buckets: {
    visible: Record<string, Set<number>>;
    hidden: Record<string, Set<number>>;
    activeColorOverrides: Map<string, { color: string; opacity: number; expressIds: Record<string, Set<number>> }>;
  };
}

export interface TaskLike {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  elementIds: Set<number> | number[];
  modelId?: string;
  appearanceProfileId?: string;
  category?: string;
}

/**
 * 4 Industry Preset Profiles Ready for Testing
 */
export const PRESET_APPEARANCE_PROFILES: Record<string, AppearanceProfile> = {
  Install_BottomUp: {
    id: "Install_BottomUp",
    name: "Install - Bottom to Top",
    type: "INSTALL",
    startAppearance: {
      visible: false,
    },
    activeAppearance: {
      visible: true,
      colorOverride: "#38bdf8", // Sky blue highlight during active installation
      opacity: 0.9,
    },
    endAppearance: {
      visible: true,
      opacity: 1.0,
    },
    growthDirection: "BOTTOM_TOP",
    groupMode: "INDIVIDUAL",
  },

  Remove_TopDown: {
    id: "Remove_TopDown",
    name: "Demolish - Top to Bottom",
    type: "REMOVE",
    startAppearance: {
      visible: true,
      opacity: 1.0,
    },
    activeAppearance: {
      visible: true,
      colorOverride: "#ef4444", // Warning red demolition highlight
      opacity: 0.85,
    },
    endAppearance: {
      visible: false,
    },
    growthDirection: "TOP_BOTTOM",
    groupMode: "INDIVIDUAL",
  },

  Temporary_Equipment: {
    id: "Temporary_Equipment",
    name: "Temporary Equipment / Scaffolding",
    type: "TEMPORARY",
    startAppearance: {
      visible: false,
    },
    activeAppearance: {
      visible: true,
      colorOverride: "#f59e0b", // Amber warning color while in place
      opacity: 0.85,
    },
    endAppearance: {
      visible: false, // Disappears after task finishes
    },
    growthDirection: "NONE",
    groupMode: "INDIVIDUAL",
  },

  Maintain_Highlight: {
    id: "Maintain_Highlight",
    name: "Maintain / Inspection Highlight",
    type: "MAINTAIN",
    startAppearance: {
      visible: true,
      opacity: 1.0,
    },
    activeAppearance: {
      visible: true,
      colorOverride: "#10b981", // Emerald maintenance highlight
      opacity: 0.9,
    },
    endAppearance: {
      visible: true,
      opacity: 1.0,
    },
    growthDirection: "NONE",
    groupMode: "GROUP_BOUNDING_BOX",
  },
};

export class AppearanceProfileEngine {
  private static instance: AppearanceProfileEngine | null = null;
  private profiles = new Map<string, AppearanceProfile>();
  private bboxCache = new Map<string, THREE.Box3>();
  private activePlanes = new Map<string, THREE.Plane>();

  public constructor() {
    this.registerPresets();
  }

  public static getInstance(): AppearanceProfileEngine {
    if (!AppearanceProfileEngine.instance) {
      AppearanceProfileEngine.instance = new AppearanceProfileEngine();
    }
    return AppearanceProfileEngine.instance;
  }

  public activeProfileId: string = "Install_BottomUp";

  public setActiveProfile(id: string): void {
    if (this.profiles.has(id)) {
      this.activeProfileId = id;
    }
  }

  public getActiveProfile(): AppearanceProfile {
    return this.profiles.get(this.activeProfileId) || PRESET_APPEARANCE_PROFILES.Install_BottomUp;
  }

  public registerPresets(): void {
    for (const [id, profile] of Object.entries(PRESET_APPEARANCE_PROFILES)) {
      this.profiles.set(id, profile);
    }
    // Register UI dropdown aliases
    this.profiles.set("Construct_BottomUp", PRESET_APPEARANCE_PROFILES.Install_BottomUp);
    this.profiles.set("Demolish_TopDown", PRESET_APPEARANCE_PROFILES.Remove_TopDown);
    this.profiles.set("Temporary_Scaffolding", PRESET_APPEARANCE_PROFILES.Temporary_Equipment);
    this.profiles.set("Maintain_Inspection", PRESET_APPEARANCE_PROFILES.Maintain_Highlight);
  }

  public registerProfile(profile: AppearanceProfile): void {
    this.profiles.set(profile.id, profile);
  }

  public getProfile(id?: string): AppearanceProfile {
    if (id && this.profiles.has(id)) {
      return this.profiles.get(id)!;
    }
    return PRESET_APPEARANCE_PROFILES.Install_BottomUp;
  }

  public getAllProfiles(): AppearanceProfile[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Infer appropriate profile from task characteristics if not explicitly specified.
   */
  public inferProfileForTask(task: TaskLike): AppearanceProfile {
    if (task.appearanceProfileId && this.profiles.has(task.appearanceProfileId)) {
      return this.profiles.get(task.appearanceProfileId)!;
    }

    // Check if user has explicitly selected a manual active profile override
    if (this.activeProfileId && this.profiles.has(this.activeProfileId) &&
        this.activeProfileId !== "Install_BottomUp" && this.activeProfileId !== "Construct_BottomUp") {
      return this.profiles.get(this.activeProfileId)!;
    }

    const name = (task.name || "").toLowerCase();
    const cat = (task.category || "").toLowerCase();
    const combined = `${name} ${cat}`;

    if (combined.includes("demolish") || combined.includes("remove") || combined.includes("tear down") || combined.includes("strip")) {
      return PRESET_APPEARANCE_PROFILES.Remove_TopDown;
    }
    if (combined.includes("scaffold") || combined.includes("crane") || combined.includes("temporary") || combined.includes("staging") || combined.includes("equipment")) {
      return PRESET_APPEARANCE_PROFILES.Temporary_Equipment;
    }
    if (combined.includes("inspect") || combined.includes("maintain") || combined.includes("commission") || combined.includes("test")) {
      return PRESET_APPEARANCE_PROFILES.Maintain_Highlight;
    }

    return PRESET_APPEARANCE_PROFILES.Install_BottomUp;
  }

  /**
   * Set or cache element bounding box.
   */
  public setElementBoundingBox(modelId: string, expressId: number, box: THREE.Box3): void {
    const key = `${modelId}:${expressId}`;
    this.bboxCache.set(key, box.clone());
  }

  /**
   * Retrieve cached element bounding box or construct fallback.
   */
  public getElementBoundingBox(modelId: string, expressId: number, model?: any): THREE.Box3 {
    const key = `${modelId}:${expressId}`;
    if (this.bboxCache.has(key)) {
      return this.bboxCache.get(key)!.clone();
    }

    // Try extracting from shared FRAGS v3 indexer or model properties
    const indexedBox = FragmentIndexer.getInstance().getElementBox(modelId, expressId, model);
    if (indexedBox) {
      this.bboxCache.set(key, indexedBox);
      return indexedBox.clone();
    }

    // Deterministic geometric default box
    const xBase = (expressId % 10) * 2;
    const yBase = ((expressId / 10) % 5) * 3;
    const zBase = ((expressId / 50) % 10) * 2;
    const fallbackBox = new THREE.Box3(
      new THREE.Vector3(xBase - 1, yBase, zBase - 1),
      new THREE.Vector3(xBase + 1, yBase + 2.8, zBase + 1)
    );
    this.bboxCache.set(key, fallbackBox);
    return fallbackBox.clone();
  }

  /**
   * Computes the combined group bounding box across all element IDs of a task.
   */
  public getTaskGroupBoundingBox(task: TaskLike, model?: any): THREE.Box3 {
    const group = new THREE.Box3();
    const elemIds = task.elementIds instanceof Set ? Array.from(task.elementIds) : task.elementIds;
    const mId = task.modelId || "default-model";

    for (const id of elemIds) {
      const box = this.getElementBoundingBox(mId, id, model);
      if (!box.isEmpty()) {
        group.union(box);
      }
    }

    if (group.isEmpty()) {
      group.set(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 15, 5));
    }
    return group;
  }

  /**
   * Resolves the 3D unit direction vector for a GrowthDirection.
   */
  public getGrowthDirectionVector(dir: GrowthDirection, customVector?: { x: number; y: number; z: number }): THREE.Vector3 | null {
    switch (dir) {
      case "BOTTOM_TOP":
        return new THREE.Vector3(0, 1, 0);
      case "TOP_BOTTOM":
        return new THREE.Vector3(0, -1, 0);
      case "LEFT_RIGHT":
        return new THREE.Vector3(1, 0, 0);
      case "RIGHT_LEFT":
        return new THREE.Vector3(-1, 0, 0);
      case "FRONT_BACK":
        return new THREE.Vector3(0, 0, 1);
      case "BACK_FRONT":
        return new THREE.Vector3(0, 0, -1);
      case "CUSTOM_VECTOR":
        if (customVector) {
          const v = new THREE.Vector3(customVector.x, customVector.y, customVector.z);
          return v.lengthSq() > 0 ? v.normalize() : new THREE.Vector3(0, 1, 0);
        }
        return new THREE.Vector3(0, 1, 0);
      case "NONE":
      default:
        return null;
    }
  }

  /**
   * Calculates dynamic clipping plane for progress t ∈ [0.0, 1.0] across box bounds.
   */
  public computeClippingPlane(box: THREE.Box3, profile: AppearanceProfile, t: number): THREE.Plane | null {
    if (profile.growthDirection === "NONE") {
      return null;
    }

    // Fully completed installation has no clipping plane (zero rendering overhead)
    if (profile.type === "INSTALL" && t >= 1.0) {
      return null;
    }
    // Fully finished demolition is completely invisible, no clipping needed
    if (profile.type === "REMOVE" && t >= 1.0) {
      return null;
    }

    const growthVec = this.getGrowthDirectionVector(profile.growthDirection, profile.customVector);
    if (!growthVec) return null;

    // Extract all 8 corners of the bounding box to calculate projection span along growth vector
    const min = box.min;
    const max = box.max;
    const corners = [
      new THREE.Vector3(min.x, min.y, min.z),
      new THREE.Vector3(min.x, min.y, max.z),
      new THREE.Vector3(min.x, max.y, min.z),
      new THREE.Vector3(min.x, max.y, max.z),
      new THREE.Vector3(max.x, min.y, min.z),
      new THREE.Vector3(max.x, min.y, max.z),
      new THREE.Vector3(max.x, max.y, min.z),
      new THREE.Vector3(max.x, max.y, max.z),
    ];

    let dMin = Infinity;
    let dMax = -Infinity;
    for (const c of corners) {
      const proj = growthVec.dot(c);
      if (proj < dMin) dMin = proj;
      if (proj > dMax) dMax = proj;
    }

    // Add tiny epsilon so min/max edges don't suffer z-fighting
    const span = Math.max(0.001, dMax - dMin);
    const clampedT = Math.min(1.0, Math.max(0.0, t));
    const dCut = dMin + clampedT * span;

    let normal: THREE.Vector3;
    let planeConstant: number;

    if (profile.type === "REMOVE") {
      // Demolition proceeds along growthVec: remaining material is ahead of the cut front (v • P >= dCut)
      normal = growthVec.clone();
      planeConstant = -dCut;
    } else {
      // Installation proceeds along growthVec: constructed material is behind the cut front (v • P <= dCut)
      normal = growthVec.clone().negate();
      planeConstant = dCut;
    }

    const plane = new THREE.Plane(normal, planeConstant);
    return plane;
  }

  /**
   * Evaluates the 4D visual state of all elements at currentTimeMs according to:
   * 1. Multi-task chronological order per element.
   * 2. Active phase normalized progress t = (currentTime - start) / (end - start).
   * 3. Appearance profile visual properties (start, active, end) and dynamic clipping planes.
   */
  public evaluateTimelineFrame(
    currentTimeMs: number,
    tasks: TaskLike[],
    models?: any
  ): TimelineEvaluationResult {
    const elementVisuals = new Map<string, ElementVisualState>();
    const activePlanesList: THREE.Plane[] = [];

    const visibleBucket: Record<string, Set<number>> = {};
    const hiddenBucket: Record<string, Set<number>> = {};
    const activeColorOverrides = new Map<string, { color: string; opacity: number; expressIds: Record<string, Set<number>> }>();

    // 1. Map all tasks per element in chronological order
    const elementTasksMap = new Map<string, Array<{ task: TaskLike; startMs: number; endMs: number; profile: AppearanceProfile }>>();
    const taskGroupBoxes = new Map<string, THREE.Box3>();

    for (const task of tasks) {
      if (!task.startDate || !task.endDate) continue;
      const startMs = new Date(task.startDate).getTime();
      const endMs = new Date(task.endDate).getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs < startMs) continue;

      const profile = this.inferProfileForTask(task);
      if (profile.groupMode === "GROUP_BOUNDING_BOX" && !taskGroupBoxes.has(task.id)) {
        taskGroupBoxes.set(task.id, this.getTaskGroupBoundingBox(task, models));
      }

      const elemIds = task.elementIds instanceof Set ? Array.from(task.elementIds) : task.elementIds;
      const mId = task.modelId || "default-model";

      for (const expId of elemIds) {
        const key = `${mId}:${expId}`;
        let list = elementTasksMap.get(key);
        if (!list) {
          list = [];
          elementTasksMap.set(key, list);
        }
        list.push({ task, startMs, endMs, profile });
      }
    }

    let visibleCount = 0;
    let hiddenCount = 0;
    let activeCount = 0;

    // 2. Evaluate each element through its chronological task sequence
    for (const [key, taskEntries] of elementTasksMap.entries()) {
      const [mId, expIdStr] = key.split(":");
      const expressId = parseInt(expIdStr, 10);

      // Sort tasks strictly chronologically by startDate, then endDate
      taskEntries.sort((a, b) => (a.startMs !== b.startMs ? a.startMs - b.startMs : a.endMs - b.endMs));

      let resolvedState: ElementVisualState = {
        modelId: mId,
        expressId,
        visible: false,
        progress: 0,
        clippingPlane: null,
      };

      // Determine active task or sequential state
      let foundActive = false;
      let lastCompletedTask: (typeof taskEntries)[0] | null = null;

      for (const entry of taskEntries) {
        if (currentTimeMs < entry.startMs) {
          // If we haven't encountered any finished task, this earliest task's startAppearance governs
          if (!lastCompletedTask && !foundActive) {
            resolvedState = {
              modelId: mId,
              expressId,
              visible: entry.profile.startAppearance.visible,
              colorOverride: entry.profile.startAppearance.colorOverride,
              opacity: entry.profile.startAppearance.opacity,
              progress: 0,
              clippingPlane: null,
              activeProfile: entry.profile,
              activeTaskId: entry.task.id,
            };
          }
          break; // Since list is chronologically sorted, later tasks haven't started either
        } else if (currentTimeMs >= entry.startMs && currentTimeMs <= entry.endMs) {
          // Task is Active!
          foundActive = true;
          const duration = Math.max(1, entry.endMs - entry.startMs);
          const t = Math.min(1.0, Math.max(0.0, (currentTimeMs - entry.startMs) / duration));

          // Determine bounding box: individual vs group bounding box
          let box: THREE.Box3;
          if (entry.profile.groupMode === "GROUP_BOUNDING_BOX") {
            box = taskGroupBoxes.get(entry.task.id) || this.getElementBoundingBox(mId, expressId, models);
          } else {
            box = this.getElementBoundingBox(mId, expressId, models);
          }

          const clippingPlane = this.computeClippingPlane(box, entry.profile, t);
          if (clippingPlane) {
            activePlanesList.push(clippingPlane);
          }

          resolvedState = {
            modelId: mId,
            expressId,
            visible: entry.profile.activeAppearance.visible,
            colorOverride: entry.profile.activeAppearance.colorOverride,
            opacity: entry.profile.activeAppearance.opacity,
            progress: t,
            clippingPlane,
            activeProfile: entry.profile,
            activeTaskId: entry.task.id,
          };
          break; // Active task takes priority
        } else {
          // currentTimeMs > entry.endMs: task has finished
          lastCompletedTask = entry;
        }
      }

      // If no task is currently active and at least one task has completed:
      // Later completed tasks override earlier ones, preserving endAppearance!
      if (!foundActive && lastCompletedTask) {
        resolvedState = {
          modelId: mId,
          expressId,
          visible: lastCompletedTask.profile.endAppearance.visible,
          colorOverride: lastCompletedTask.profile.endAppearance.colorOverride,
          opacity: lastCompletedTask.profile.endAppearance.opacity,
          progress: 1.0,
          clippingPlane: null, // Disposed upon completion
          activeProfile: lastCompletedTask.profile,
          activeTaskId: lastCompletedTask.task.id,
        };
      }

      elementVisuals.set(key, resolvedState);

      // Populate buckets for Three.js / ThatOpen hider and highlighter
      if (resolvedState.visible) {
        visibleCount++;
        (visibleBucket[mId] ??= new Set<number>()).add(expressId);

        if (foundActive && resolvedState.colorOverride) {
          activeCount++;
          const colorKey = `${resolvedState.colorOverride}_${resolvedState.opacity ?? 1.0}`;
          let group = activeColorOverrides.get(colorKey);
          if (!group) {
            group = {
              color: resolvedState.colorOverride,
              opacity: resolvedState.opacity ?? 1.0,
              expressIds: {},
            };
            activeColorOverrides.set(colorKey, group);
          }
          (group.expressIds[mId] ??= new Set<number>()).add(expressId);
        }
      } else {
        hiddenCount++;
        (hiddenBucket[mId] ??= new Set<number>()).add(expressId);
      }
    }

    return {
      elements: elementVisuals,
      visibleCount,
      hiddenCount,
      activeCount,
      activePlanes: activePlanesList,
      buckets: {
        visible: visibleBucket,
        hidden: hiddenBucket,
        activeColorOverrides,
      },
    };
  }

  /**
   * Applies the evaluated timeline frame to the scene, renderer, hider, and materials.
   */
  public async applyEvaluationResult(
    result: TimelineEvaluationResult,
    options?: {
      renderer?: THREE.WebGLRenderer;
      hider?: any;
      highlighter?: any;
      models?: any;
    }
  ): Promise<void> {
    const { hider, highlighter } = options || {};

    // 1. Reset any stale model-level material clipping planes (shared fragment materials clip unrelated elements).
    // Note: Renderer-level clippingPlanes (used by Storey Slicer / Section Box) are preserved untouched.
    if (options?.models) {
      this.clearModelClippingPlanes(options.models);
    }

    // 2. Apply visibility via ThatOpen Hider if available
    if (hider) {
      if (Object.keys(result.buckets.hidden).length > 0) {
        await hider.set(false, result.buckets.hidden);
      }
      if (Object.keys(result.buckets.visible).length > 0) {
        await hider.set(true, result.buckets.visible);
      }
    }

    // 3. Apply active color overrides through ThatOpen Highlighter
    if (highlighter) {
      let styleIdx = 0;
      for (const [, group] of result.buckets.activeColorOverrides) {
        const styleId = `appearance-profile-${styleIdx++}`;
        highlighter.styles.set(styleId, {
          color: new THREE.Color(group.color),
          opacity: group.opacity,
          transparent: group.opacity < 1.0,
          renderedFaces: true as any,
          priority: 30,
        });
        // Atomic swap (`removePrevious = true`) prevents blank flashes between frames
        await highlighter.highlightByID(styleId, group.expressIds, true, false);
      }

      // Clear only unused/extra dynamic appearance styles from prior frames
      await this.clearHighlighterAppearanceStyles(highlighter, styleIdx);
    }
  }

  /**
   * Remove any model-level material clipping planes applied during 4D simulation.
   */
  public clearModelClippingPlanes(models?: any): void {
    if (!models) return;
    const modelList = Array.isArray(models)
      ? models
      : models.values
      ? Array.from(models.values())
      : [models];

    for (const model of modelList) {
      const rootObj = (model?.object || model) as THREE.Object3D;
      if (rootObj && typeof rootObj.traverse === "function") {
        rootObj.traverse((child: any) => {
          if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            for (const mat of materials) {
              if (Array.isArray(mat.clippingPlanes) && mat.clippingPlanes.length > 0) {
                mat.clippingPlanes = [];
              }
            }
          }
        });
      }
    }
  }

  /**
   * Clear dynamic appearance-profile highlights from the highlighter (optionally only indices >= startIndex).
   */
  public async clearHighlighterAppearanceStyles(highlighter?: any, startIndex: number = 0): Promise<void> {
    if (!highlighter?.styles) return;
    for (const [styleName] of highlighter.styles) {
      if (!styleName.startsWith("appearance-profile-")) continue;
      if (startIndex > 0) {
        const idx = Number(styleName.slice("appearance-profile-".length));
        if (Number.isFinite(idx) && idx < startIndex) continue;
      }
      // Skip empty styles to avoid unnecessary WebGL/worker clear overhead unless selection map isn't present (mocks)
      const selMap = highlighter.selection?.[styleName];
      if (highlighter.selection && selMap) {
        let hasAny = false;
        for (const set of Object.values(selMap) as any[]) {
          if (set && set.size > 0) {
            hasAny = true;
            break;
          }
        }
        if (!hasAny) continue;
      } else if (highlighter.selection && !selMap) {
        continue;
      }
      await highlighter.clear(styleName);
    }
  }

  /**
   * Configures a Three.js material for order-independent / overlap-clean translucency
   * (compatible with ThatOpen `PostproductionMode.DEFERRED` without custom MRT FBO patches).
   */
  public applyTranslucentGhostPass(
    material: THREE.Material,
    opacity: number = 0.28,
    mode: "alpha-hash" | "ghost-layer" = "alpha-hash"
  ): void {
    const mat = material as THREE.MeshStandardMaterial & { alphaHash?: boolean };
    mat.opacity = Math.max(0.05, Math.min(0.95, opacity));
    if (mode === "alpha-hash") {
      // Stochastic coverage avoids depth-sorting flicker on overlapping temporary work zones
      mat.transparent = false;
      mat.alphaHash = true;
      mat.depthWrite = true;
      mat.dithering = true;
    } else {
      mat.alphaHash = false;
      mat.transparent = true;
      mat.depthWrite = false;
    }
    mat.needsUpdate = true;
  }

  /**
   * Clear both appearance-profile highlights and model material clipping planes (used when exiting 4D mode).
   */
  public async clearAppliedAppearance(options?: { highlighter?: any; models?: any }): Promise<void> {
    await this.clearHighlighterAppearanceStyles(options?.highlighter);
    this.clearModelClippingPlanes(options?.models);
  }

  /**
   * Clear all cached bounds and active clipping planes.
   */
  public reset(): void {
    this.bboxCache.clear();
    this.activePlanes.clear();
  }
}
