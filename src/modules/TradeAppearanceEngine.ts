/**
 * TradeAppearanceEngine — Per-Trade / Prefix 4D Appearance Profiles
 *
 * Maps construction task prefixes & trade keywords (e.g. FOU_*, COL_*, FLO_*, WALL_*,
 * FRA_*, STR_*, ROOF_*, MEP_*) to distinct in-progress highlight colors during 4D playback
 * so formwork, columns, slabs, walls, framing, stairs, and MEP stand out visually.
 */

import type { ScheduleTask } from "./ScheduleManager";

export interface TradeProfile {
  id: string;
  label: string;
  color: string;
  opacity: number;
  patterns: RegExp[];
}

export interface TradeBucket {
  profile: TradeProfile;
  styleName: string;
  modelIdMaps: Record<string, Set<number>>;
  elementCount: number;
}

export const DEFAULT_TRADE_PROFILES: TradeProfile[] = [
  {
    id: "foundation",
    label: "Foundations & Footings",
    color: "#f97316", // Terracotta / Formwork Orange
    opacity: 0.92,
    patterns: [/^FOU[_-\s]/i, /FOOTING|PILE|FOUNDATION|SUBSTRUCTURE/i],
  },
  {
    id: "column",
    label: "Columns & Piers",
    color: "#38bdf8", // Steel Sky Blue
    opacity: 0.92,
    patterns: [/^COL[_-\s]/i, /COLUMN|PIER|PILLAR/i],
  },
  {
    id: "slab",
    label: "Slabs & Floors",
    color: "#06b6d4", // Concrete Pour Cyan
    opacity: 0.9,
    patterns: [/^FLO[_-\s]/i, /SLAB|FLOOR|DECK|PARKING/i],
  },
  {
    id: "framing",
    label: "Beams & Framing",
    color: "#eab308", // Structural Steel Gold
    opacity: 0.92,
    patterns: [/^FRA[_-\s]/i, /BEAM|FRAMING|TRUSS|GIRDER|JOIST/i],
  },
  {
    id: "wall",
    label: "Walls & Core",
    color: "#10b981", // Emerald Green
    opacity: 0.9,
    patterns: [/^WALL[_-\s]/i, /WALL|CORE|SHEAR|CURTAIN/i],
  },
  {
    id: "stair",
    label: "Stairs & Circulation",
    color: "#a855f7", // Violet
    opacity: 0.92,
    patterns: [/^STR[_-\s]/i, /STAIR|RAMP|RAILING|ELEVATOR/i],
  },
  {
    id: "roof",
    label: "Roof & Envelope",
    color: "#ec4899", // Rose
    opacity: 0.9,
    patterns: [/^ROOF[_-\s]/i, /ROOF|CANOPY|FACADE|CLADDING/i],
  },
  {
    id: "mep",
    label: "MEP & Systems",
    color: "#f43f5e", // Crimson / MEP Accent
    opacity: 0.92,
    patterns: [/^MEP[_-\s]/i, /HVAC|DUCT|PIPE|PLUMB|ELECTR|CONDUIT|SPRINKLER/i],
  },
];

export class TradeAppearanceEngine {
  private profiles: TradeProfile[];
  public enabled = false;

  constructor(profiles?: TradeProfile[]) {
    this.profiles = (profiles ?? DEFAULT_TRADE_PROFILES).map((p) => ({
      ...p,
      patterns: [...p.patterns],
    }));
  }

  public getProfiles(): TradeProfile[] {
    return this.profiles;
  }

  public setProfileColor(profileId: string, hexColor: string): boolean {
    const profile = this.profiles.find((p) => p.id === profileId);
    if (!profile) return false;
    profile.color = hexColor;
    return true;
  }

  public matchTradeProfile(taskName: string): TradeProfile | null {
    const clean = (taskName || "").trim();
    if (!clean) return null;
    for (const profile of this.profiles) {
      if (profile.patterns.some((re) => re.test(clean))) {
        return profile;
      }
    }
    return null;
  }

  /**
   * Groups currently in-progress task elements at `dateMs` by their matched trade profile.
   * Tasks that do not match any trade profile fall into `defaultInProgress`.
   */
  public buildActiveTradeBuckets(
    dateMs: number,
    tasks: ScheduleTask[]
  ): {
    tradeBuckets: TradeBucket[];
    defaultInProgress: Record<string, Set<number>>;
    completed: Record<string, Set<number>>;
    planned: Record<string, Set<number>>;
  } {
    const bucketMap = new Map<string, TradeBucket>();
    const defaultInProgress: Record<string, Set<number>> = {};
    const completed: Record<string, Set<number>> = {};
    const planned: Record<string, Set<number>> = {};

    for (const task of tasks) {
      if (!task.elementIds || task.elementIds.size === 0 || task.isSummary) continue;
      const modelId = task.modelId || "default-model";
      const startMs = new Date(task.startDate).getTime();
      const endMs = new Date(task.endDate).getTime();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) continue;

      if (dateMs >= endMs || task.status === "Completed") {
        const set = (completed[modelId] ??= new Set<number>());
        for (const eid of task.elementIds) set.add(eid);
      } else if (dateMs >= startMs) {
        const profile = this.matchTradeProfile(task.name);
        if (profile) {
          let bucket = bucketMap.get(profile.id);
          if (!bucket) {
            bucket = {
              profile,
              styleName: `trade-profile-${profile.id}`,
              modelIdMaps: {},
              elementCount: 0,
            };
            bucketMap.set(profile.id, bucket);
          }
          const set = (bucket.modelIdMaps[modelId] ??= new Set<number>());
          for (const eid of task.elementIds) {
            if (!set.has(eid)) {
              set.add(eid);
              bucket.elementCount++;
            }
          }
        } else {
          const set = (defaultInProgress[modelId] ??= new Set<number>());
          for (const eid of task.elementIds) set.add(eid);
        }
      } else {
        const set = (planned[modelId] ??= new Set<number>());
        for (const eid of task.elementIds) set.add(eid);
      }
    }

    return {
      tradeBuckets: Array.from(bucketMap.values()),
      defaultInProgress,
      completed,
      planned,
    };
  }
}
