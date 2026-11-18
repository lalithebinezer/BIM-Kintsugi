/**
 * Cascade4DAnalytics — 12-Indicator Spatio-Temporal ColorBrewer Lens & Legend Isolator.
 *
 * Inspired by IEEE CasCADe's 4D analytics workflow: maps 12 schedule/slack/delta metrics
 * onto 5-band perceptual ColorBrewer scales with interactive band isolation and ghosting.
 */

import type { ScheduleTask } from "./ScheduleManager";

export type CascadeIndicatorId =
  | "baselineStart"
  | "baselineFinish"
  | "actualStart"
  | "actualFinish"
  | "baselineDuration"
  | "actualDuration"
  | "deltaDuration"
  | "deltaStart"
  | "deltaFinish"
  | "freeSlack"
  | "totalSlack"
  | "customMetric";

export type ColorBrewerSchemeName =
  | "Spectral"
  | "RdYlGn"
  | "RdYlBu"
  | "RdBu"
  | "PuOr"
  | "PRGn"
  | "PiYG"
  | "BrBG"
  | "YlOrRd"
  | "BuGn"
  | "Blues"
  | "Greens"
  | "Oranges"
  | "Purples"
  | "Reds";

export interface CascadeIndicatorMeta {
  id: CascadeIndicatorId;
  label: string;
  isDate: boolean;
  unit: string;
}

export const CASCADE_INDICATORS: CascadeIndicatorMeta[] = [
  { id: "totalSlack", label: "Total Slack / Float", isDate: false, unit: "d" },
  { id: "freeSlack", label: "Free Slack / Float", isDate: false, unit: "d" },
  { id: "deltaStart", label: "Start Delta (Actual − Planned)", isDate: false, unit: "d" },
  { id: "deltaFinish", label: "Finish Delta (Actual − Planned)", isDate: false, unit: "d" },
  { id: "deltaDuration", label: "Duration Delta", isDate: false, unit: "d" },
  { id: "baselineStart", label: "Baseline / Planned Start", isDate: true, unit: "" },
  { id: "baselineFinish", label: "Baseline / Planned Finish", isDate: true, unit: "" },
  { id: "actualStart", label: "Actual Start", isDate: true, unit: "" },
  { id: "actualFinish", label: "Actual Finish", isDate: true, unit: "" },
  { id: "baselineDuration", label: "Baseline Duration", isDate: false, unit: "d" },
  { id: "actualDuration", label: "Actual Duration", isDate: false, unit: "d" },
  { id: "customMetric", label: "Custom Metric (Cost / Risk)", isDate: false, unit: "" },
];

/** 5-stop ColorBrewer palettes (band 0 = high/warm alert or start, band 4 = low/cool) */
export const COLORBREWER_SCHEMES: Record<ColorBrewerSchemeName, [string, string, string, string, string]> = {
  Spectral: ["#d7191c", "#fdae61", "#ffffbf", "#abdda4", "#2b83ba"],
  RdYlGn: ["#d7191c", "#fdae61", "#ffffbf", "#a6d96a", "#1a9641"],
  RdYlBu: ["#d7191c", "#fdae61", "#ffffbf", "#abd9e9", "#2c7bb6"],
  RdBu: ["#ca0020", "#f4a582", "#f7f7f7", "#92c5de", "#0571b0"],
  PuOr: ["#e66101", "#fdb863", "#f7f7f7", "#b2abd2", "#5e3c99"],
  PRGn: ["#7b3294", "#c2a5cf", "#f7f7f7", "#a6dba0", "#008837"],
  PiYG: ["#d01c8b", "#f1b6da", "#f7f7f7", "#b8e186", "#4dac26"],
  BrBG: ["#a6611a", "#dfc27d", "#f5f5f5", "#80cdc1", "#018571"],
  YlOrRd: ["#bd0026", "#f03b20", "#fd8d3c", "#fecc5c", "#ffffb2"],
  BuGn: ["#006d2c", "#2ca25f", "#66c2a4", "#b2e2e2", "#edf8fb"],
  Blues: ["#08519c", "#3182bd", "#6baed6", "#bdd7e7", "#eff3ff"],
  Greens: ["#006d2c", "#31a354", "#74c476", "#bae4b3", "#edf8e9"],
  Oranges: ["#a63603", "#e6550d", "#fd8d3c", "#fdbe85", "#feedde"],
  Purples: ["#54278f", "#756bb1", "#9e9ac8", "#cbc9e2", "#f2f0f7"],
  Reds: ["#a50f15", "#de2d26", "#fb6a4a", "#fcae91", "#fee5d9"],
};

export interface CascadeBandResult {
  bandIndex: number;
  hex: string;
  rangeLabel: string;
  taskCount: number;
  elementCount: number;
  modelIdMap: Record<string, Set<number>>;
}

export interface CascadeLensConfig {
  indicator: CascadeIndicatorId;
  scheme: ColorBrewerSchemeName;
  invertScale?: boolean;
  isolatedBandIndex?: number | null;
  minOverride?: number;
  maxOverride?: number;
}

export interface CascadeEvaluationResult {
  indicator: CascadeIndicatorMeta;
  scheme: ColorBrewerSchemeName;
  minVal: number;
  maxVal: number;
  minLabel: string;
  maxLabel: string;
  bands: CascadeBandResult[];
  isolatedBandIndex: number | null;
  ghostMap: Record<string, Set<number>>;
  totalMappedElements: number;
}

const MS_PER_DAY = 86_400_000;

function parseMs(dateStr?: string): number {
  if (!dateStr) return NaN;
  const ms = Date.parse(dateStr);
  return Number.isFinite(ms) ? ms : NaN;
}

function daysBetween(startStr?: string, endStr?: string): number {
  const s = parseMs(startStr);
  const e = parseMs(endStr);
  if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
  return Math.max(0, Math.round((e - s) / MS_PER_DAY));
}

function formatBoundLabel(val: number, meta: CascadeIndicatorMeta): string {
  if (!Number.isFinite(val)) return "-";
  if (meta.isDate) {
    return new Date(val).toISOString().split("T")[0];
  }
  const rounded = Math.abs(val) >= 100 ? Math.round(val).toString() : val.toFixed(1).replace(/\.0$/, "");
  return meta.unit ? `${rounded}${meta.unit}` : rounded;
}

/**
 * Extracts raw numeric metric value (epoch ms for dates, numeric value otherwise) from a ScheduleTask.
 */
export function extractIndicatorValue(task: ScheduleTask, indicator: CascadeIndicatorId): number {
  const baseStart = task.baselineStartDate || task.startDate;
  const baseEnd = task.baselineEndDate || task.endDate;
  const actStart = task.actualStartDate || task.startDate;
  const actEnd = task.actualEndDate || task.endDate;

  switch (indicator) {
    case "baselineStart":
      return parseMs(baseStart);
    case "baselineFinish":
      return parseMs(baseEnd);
    case "actualStart":
      return parseMs(actStart);
    case "actualFinish":
      return parseMs(actEnd);
    case "baselineDuration":
      return Math.max(1, daysBetween(baseStart, baseEnd));
    case "actualDuration":
      return Math.max(1, daysBetween(actStart, actEnd));
    case "deltaDuration":
      return daysBetween(actStart, actEnd) - daysBetween(baseStart, baseEnd);
    case "deltaStart": {
      const b = parseMs(baseStart);
      const a = parseMs(actStart);
      return Number.isFinite(b) && Number.isFinite(a) ? Math.round((a - b) / MS_PER_DAY) : 0;
    }
    case "deltaFinish": {
      const b = parseMs(baseEnd);
      const a = parseMs(actEnd);
      return Number.isFinite(b) && Number.isFinite(a) ? Math.round((a - b) / MS_PER_DAY) : 0;
    }
    case "freeSlack":
      return task.freeFloat ?? task.totalFloat ?? 0;
    case "totalSlack":
      return task.totalFloat ?? (task.isCritical ? 0 : 5);
    case "customMetric":
      return (
        task.customMetric ??
        task.costImpact ??
        task.totalCost ??
        task.unitCost * Math.max(1, task.quantity || task.elementIds.size || 1)
      );
    default:
      return 0;
  }
}

/**
 * Quantizes tasks and linked BIM elements into a 5-band ColorBrewer lens for the active indicator.
 * When `isolatedBandIndex` is set, non-matching elements move to `ghostMap`.
 */
export function evaluateCascadeLens(
  tasks: ScheduleTask[],
  config: CascadeLensConfig
): CascadeEvaluationResult {
  const meta = CASCADE_INDICATORS.find((m) => m.id === config.indicator) ?? CASCADE_INDICATORS[0];
  const rawPalette = COLORBREWER_SCHEMES[config.scheme] ?? COLORBREWER_SCHEMES.Spectral;
  const colors = config.invertScale
    ? ([...rawPalette].reverse() as [string, string, string, string, string])
    : rawPalette;

  const workTasks = tasks.filter((t) => !t.isSummary);
  const sampledValues: Array<{ task: ScheduleTask; value: number }> = [];

  let minVal = Infinity;
  let maxVal = -Infinity;

  for (const t of workTasks) {
    const val = extractIndicatorValue(t, meta.id);
    if (!Number.isFinite(val)) continue;
    sampledValues.push({ task: t, value: val });
    if (val < minVal) minVal = val;
    if (val > maxVal) maxVal = val;
  }

  if (!Number.isFinite(minVal) || !Number.isFinite(maxVal)) {
    minVal = 0;
    maxVal = 1;
  }
  if (typeof config.minOverride === "number" && Number.isFinite(config.minOverride)) {
    minVal = config.minOverride;
  }
  if (typeof config.maxOverride === "number" && Number.isFinite(config.maxOverride)) {
    maxVal = config.maxOverride;
  }
  if (maxVal < minVal) {
    [minVal, maxVal] = [maxVal, minVal];
  }

  const span = maxVal - minVal;
  const bands: CascadeBandResult[] = colors.map((hex, i) => {
    const lo = minVal + (span * i) / 5;
    const hi = minVal + (span * (i + 1)) / 5;
    return {
      bandIndex: i,
      hex,
      rangeLabel: span === 0 ? formatBoundLabel(minVal, meta) : `${formatBoundLabel(lo, meta)} – ${formatBoundLabel(hi, meta)}`,
      taskCount: 0,
      elementCount: 0,
      modelIdMap: {},
    };
  });

  const isolated =
    typeof config.isolatedBandIndex === "number" &&
    config.isolatedBandIndex >= 0 &&
    config.isolatedBandIndex < 5
      ? config.isolatedBandIndex
      : null;

  const ghostMap: Record<string, Set<number>> = {};
  let totalMappedElements = 0;

  for (const { task, value } of sampledValues) {
    let idx = span > 0 ? Math.floor(((value - minVal) / span) * 5) : 0;
    idx = Math.max(0, Math.min(4, idx));

    const mId = task.modelId || "default-model";
    if (isolated !== null && idx !== isolated) {
      if (!ghostMap[mId]) ghostMap[mId] = new Set<number>();
      for (const eid of task.elementIds) {
        ghostMap[mId].add(eid);
        totalMappedElements++;
      }
      continue;
    }

    const band = bands[idx];
    band.taskCount++;
    if (!band.modelIdMap[mId]) band.modelIdMap[mId] = new Set<number>();
    for (const eid of task.elementIds) {
      band.modelIdMap[mId].add(eid);
      band.elementCount++;
      totalMappedElements++;
    }
  }

  return {
    indicator: meta,
    scheme: config.scheme,
    minVal,
    maxVal,
    minLabel: formatBoundLabel(minVal, meta),
    maxLabel: formatBoundLabel(maxVal, meta),
    bands,
    isolatedBandIndex: isolated,
    ghostMap,
    totalMappedElements,
  };
}
