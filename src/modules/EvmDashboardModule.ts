/**
 * EvmDashboardModule — Enterprise Earned Value Management (EVM) Suite & Analytics.
 *
 * Implements ANSI/EIA 748-B, PMI Practice Standard for EVM, and APM Handbook EVM Standards:
 * - Core Parameters: BAC, PV (BCWS), EV (BCWP), AC (ACWP), SV, CV, SPI, CPI.
 * - Alternative EAC Forecasting: Typical (BAC/CPI), Atypical (AC+BAC-EV), Composite (AC+(BAC-EV)/(CPI*SPI)), Weighted (AC+(BAC-EV)/(0.8CPI+0.2SPI)).
 * - To-Complete Performance Index: TCPI(BAC) and TCPI(EAC) with feasibility analysis.
 * - Earned Schedule (ES) Time-Based Metrics: SV(t), SPI(t), EAC(t), VAC(t) (Lipke/PMI Box 3-1).
 * - ANSI/EIA 748-B Variance Threshold Analysis: Tier 1 (±30% / $10k) & Tier 2 (±10% / $25k).
 * - APM Bulls-Eye Matrix: 4-Quadrant CPI vs SPI scatter plot with concentric ±10%/±20% tolerance rings.
 * - Dual Chart Visualization: Switch between PMBOK S-Curve and APM Bulls-Eye Quadrant view.
 * - CPR Reporting: CPR Format 1 (WBS Ledger CSV) & CPR Format 5 (Variance Analysis Report VAR).
 */

import { DelayImpactEngine, type DelayImpactReport, type TaskDelayImpact } from "./DelayImpactEngine";
import { ScheduleManager, type ScheduleTask } from "./ScheduleManager";
import { formatCurrency } from "../utils/formatters";
import { showToast } from "../ui/ToastManager";

export type EacModelType = "typical" | "atypical" | "composite" | "weighted";
export type EvmChartViewMode = "scurve" | "bullseye";

export interface EacForecastDetail {
  model: EacModelType;
  label: string;
  formula: string;
  description: string;
  eacValue: number;
  vacValue: number;
  tcpiValue: number;
  isFeasible: boolean;
}

export interface EarnedScheduleSummary {
  plannedDurationDays: number;               // PD
  actualTimeDays: number;                    // AT
  earnedScheduleDays: number;                // ES
  scheduleVarianceTimeDays: number;          // SV(t) = ES - AT
  schedulePerformanceIndexTime: number;      // SPI(t) = ES / AT
  estimatedDurationAtCompletionDays: number; // EAC(t) = PD / SPI(t)
  timeVarianceAtCompletionDays: number;      // VAC(t) = PD - EAC(t)
  projectedFinishDateIso: string;
}

export interface Ansi748ThresholdStatus {
  tier1Breach: boolean; // ±30% and ±$10k
  tier2Breach: boolean; // ±10% and ±$25k
  status: "NORMAL" | "WATCH" | "VAR_TIER_1" | "VAR_TIER_2";
  badgeText: string;
  badgeColor: string;
  varRequired: boolean;
  reasons: string[];
}

export interface ApmBullsEyeSummary {
  quadrant: "Q1" | "Q2" | "Q3" | "Q4";
  quadrantTitle: string;
  quadrantDescription: string;
  distanceFromTarget: number; // sqrt((spi - 1)^2 + (cpi - 1)^2)
  toleranceZone: "Inner Ring (±10%)" | "Outer Ring (±20%)" | "Critical Variance (>20%)";
  ringColor: string;
  spi: number;
  cpi: number;
}

export interface EvmMetricsSummary {
  simDateMs: number;
  simDateIso: string;
  bac: number;           // Budget at Completion (Total Planned Cost)
  pv: number;            // Planned Value (BCWS)
  ev: number;            // Earned Value (BCWP)
  ac: number;            // Actual Cost (ACWP)
  sv: number;            // Schedule Variance (EV - PV)
  cv: number;            // Cost Variance (EV - AC)
  spi: number;           // Schedule Performance Index (EV / PV)
  cpi: number;           // Cost Performance Index (EV / AC)
  eac: number;           // Active Estimate at Completion
  vac: number;           // Active Variance at Completion (BAC - EAC)
  tcpi: number;          // Target To-Complete Performance Index (BAC)
  tcpiBac: number;       // TCPI to original BAC
  tcpiEac: number;       // TCPI to revised EAC
  tcpiBacFeasible: boolean;
  tcpiEacFeasible: boolean;
  progressPercent: number; // EV / BAC * 100
  prolongationCost: number; // Overhead delay costs
  penaltyCost: number;   // Contractual liquidated damages
  totalCostImpact: number; // Total financial delay exposure
  projectSlippageDays: number;
  delayedCount: number;
  criticalDelayCount: number;
  criticalTasksDelayed: TaskDelayImpact[];
  taskImpacts: TaskDelayImpact[];
  // Enhanced ANSI / PMI / APM metrics
  eacForecasts: Record<EacModelType, EacForecastDetail>;
  activeEacModel: EacModelType;
  earnedSchedule: EarnedScheduleSummary;
  ansiThresholds: Ansi748ThresholdStatus;
  apmBullsEye: ApmBullsEyeSummary;
}

export interface SCurvePoint {
  dateMs: number;
  dateStr: string;
  pv: number;
  ev: number;
  ac: number;
}

export class EvmDashboardModule {
  private static instance: EvmDashboardModule | null = null;
  private delayEngine: DelayImpactEngine;
  private simulatedDelayDays: number = 0;
  private activeEacModel: EacModelType = "composite";
  private chartViewMode: EvmChartViewMode = "scurve";

  private constructor() {
    this.delayEngine = DelayImpactEngine.getInstance();
  }

  public static getInstance(): EvmDashboardModule {
    if (!EvmDashboardModule.instance) {
      EvmDashboardModule.instance = new EvmDashboardModule();
    }
    return EvmDashboardModule.instance;
  }

  /**
   * Set a what-if simulated delay in days to test EVM sensitivity.
   */
  public setSimulatedDelayDays(days: number): void {
    this.simulatedDelayDays = Math.max(0, days);
  }

  public getSimulatedDelayDays(): number {
    return this.simulatedDelayDays;
  }

  /**
   * Set active EAC Forecasting Formula (Typical, Atypical, Composite, Weighted).
   */
  public setActiveEacModel(model: EacModelType): void {
    this.activeEacModel = model;
  }

  public getActiveEacModel(): EacModelType {
    return this.activeEacModel;
  }

  /**
   * Set active chart view mode (S-Curve vs APM Bulls-Eye).
   */
  public setChartViewMode(mode: EvmChartViewMode): void {
    this.chartViewMode = mode;
  }

  public getChartViewMode(): EvmChartViewMode {
    return this.chartViewMode;
  }

  /**
   * Compute continuous cumulative Planned Value PV(t) at any timestamp t.
   */
  public computeCumulativePvAt(tasks: ScheduleTask[], timestampMs: number): number {
    let cumPv = 0;
    for (const t of tasks) {
      const pStart = new Date(t.startDate).getTime();
      const pEnd = new Date(t.endDate).getTime();
      const cost = t.totalCost || (t.unitCost && t.quantity ? t.unitCost * t.quantity : 0) || 0;
      if (timestampMs <= pStart) {
        continue;
      } else if (timestampMs >= pEnd) {
        cumPv += cost;
      } else {
        const dur = Math.max(1, pEnd - pStart);
        const frac = (timestampMs - pStart) / dur;
        cumPv += cost * frac;
      }
    }
    return cumPv;
  }

  /**
   * Compute Earned Schedule (ES) Time-Based Metrics per Lipke / PMI EVM Practice Standard Box 3-1.
   */
  public computeEarnedSchedule(
    tasks: ScheduleTask[],
    simMs: number,
    currentEv: number,
    bac: number,
    minDateMs: number,
    maxDateMs: number
  ): EarnedScheduleSummary {
    const plannedDurationDays = Math.max(1, Math.round((maxDateMs - minDateMs) / (1000 * 60 * 60 * 24)));
    const actualTimeDays = Math.max(0, Math.round((simMs - minDateMs) / (1000 * 60 * 60 * 24)));

    let earnedScheduleDays = 0;

    if (bac > 0 && currentEv > 0) {
      if (currentEv >= bac) {
        earnedScheduleDays = plannedDurationDays;
      } else {
        // Binary search to find exact timestamp where PV(t) == EV
        let low = minDateMs;
        let high = maxDateMs;
        for (let iter = 0; iter < 24; iter++) {
          const mid = (low + high) / 2;
          const pvMid = this.computeCumulativePvAt(tasks, mid);
          if (pvMid < currentEv) {
            low = mid;
          } else {
            high = mid;
          }
        }
        const esMs = (low + high) / 2;
        earnedScheduleDays = Math.max(0, (esMs - minDateMs) / (1000 * 60 * 60 * 24));
      }
    }

    // Schedule Variance (Time): SV(t) = ES - AT
    const scheduleVarianceTimeDays = Math.round((earnedScheduleDays - actualTimeDays) * 10) / 10;

    // Schedule Performance Index (Time): SPI(t) = ES / AT
    let schedulePerformanceIndexTime = 1.0;
    if (actualTimeDays > 0) {
      schedulePerformanceIndexTime = Math.round((earnedScheduleDays / actualTimeDays) * 100) / 100;
    }

    // Estimated Duration at Completion: EAC(t) = PD / SPI(t)
    const effectiveSpiT = Math.max(0.1, schedulePerformanceIndexTime);
    const estimatedDurationAtCompletionDays = Math.round(plannedDurationDays / effectiveSpiT);

    // Time Variance at Completion: VAC(t) = PD - EAC(t)
    const timeVarianceAtCompletionDays = plannedDurationDays - estimatedDurationAtCompletionDays;

    const projFinishMs = minDateMs + estimatedDurationAtCompletionDays * (1000 * 60 * 60 * 24);
    const projectedFinishDateIso = new Date(projFinishMs).toISOString().split("T")[0];

    return {
      plannedDurationDays,
      actualTimeDays,
      earnedScheduleDays: Math.round(earnedScheduleDays * 10) / 10,
      scheduleVarianceTimeDays,
      schedulePerformanceIndexTime,
      estimatedDurationAtCompletionDays,
      timeVarianceAtCompletionDays,
      projectedFinishDateIso,
    };
  }

  /**
   * Compute all 4 standard EAC Forecasting Models (PMI EVM Practice Standard Box 3-2 & DOE Module 6).
   */
  public computeEacForecasts(
    bac: number,
    ev: number,
    ac: number,
    cpi: number,
    spi: number
  ): Record<EacModelType, EacForecastDetail> {
    const remainingWork = Math.max(0, bac - ev);
    const safeCpi = Math.max(0.05, cpi);
    const safeSpi = Math.max(0.05, spi);

    // 1. Typical (Cumulative CPI): EAC = BAC / CPI
    const eac1 = cpi > 0 ? bac / safeCpi : bac;
    const vac1 = bac - eac1;
    const tcpi1 = remainingWork > 0 && eac1 - ac > 0 ? remainingWork / (eac1 - ac) : 1.0;

    // 2. Atypical (Current Plan / Budgeted Rate): EAC = AC + (BAC - EV)
    const eac2 = ac + remainingWork;
    const vac2 = bac - eac2;
    const tcpi2 = remainingWork > 0 && eac2 - ac > 0 ? remainingWork / (eac2 - ac) : 1.0;

    // 3. Composite (Cost & Schedule Index): EAC = AC + (BAC - EV) / (CPI * SPI)
    const compIndex = Math.max(0.05, safeCpi * safeSpi);
    const eac3 = ac + remainingWork / compIndex;
    const vac3 = bac - eac3;
    const tcpi3 = remainingWork > 0 && eac3 - ac > 0 ? remainingWork / (eac3 - ac) : 1.0;

    // 4. Weighted Multi-Index (80% CPI / 20% SPI): EAC = AC + (BAC - EV) / (0.8CPI + 0.2SPI)
    const weightedIndex = Math.max(0.05, 0.8 * safeCpi + 0.2 * safeSpi);
    const eac4 = ac + remainingWork / weightedIndex;
    const vac4 = bac - eac4;
    const tcpi4 = remainingWork > 0 && eac4 - ac > 0 ? remainingWork / (eac4 - ac) : 1.0;

    return {
      typical: {
        model: "typical",
        label: "Typical (Cumulative CPI)",
        formula: "EAC = BAC / CPI",
        description: "Assumes past cost efficiency will continue until completion.",
        eacValue: Math.round(eac1),
        vacValue: Math.round(vac1),
        tcpiValue: Math.round(tcpi1 * 100) / 100,
        isFeasible: tcpi1 <= 1.10,
      },
      atypical: {
        model: "atypical",
        label: "Atypical (Planned Rate)",
        formula: "EAC = AC + (BAC - EV)",
        description: "Assumes future variances will conform to original budget.",
        eacValue: Math.round(eac2),
        vacValue: Math.round(vac2),
        tcpiValue: Math.round(tcpi2 * 100) / 100,
        isFeasible: tcpi2 <= 1.10,
      },
      composite: {
        model: "composite",
        label: "Composite (CPI × SPI)",
        formula: "EAC = AC + (BAC - EV) / (CPI × SPI)",
        description: "Accounts for mutual compounding effect of schedule delay on project costs.",
        eacValue: Math.round(eac3),
        vacValue: Math.round(vac3),
        tcpiValue: Math.round(tcpi3 * 100) / 100,
        isFeasible: tcpi3 <= 1.10,
      },
      weighted: {
        model: "weighted",
        label: "Weighted (0.80 CPI + 0.20 SPI)",
        formula: "EAC = AC + (BAC - EV) / (0.80·CPI + 0.20·SPI)",
        description: "Defense/DOE standard weighted sensitivity forecast.",
        eacValue: Math.round(eac4),
        vacValue: Math.round(vac4),
        tcpiValue: Math.round(tcpi4 * 100) / 100,
        isFeasible: tcpi4 <= 1.10,
      },
    };
  }

  /**
   * Evaluate ANSI/EIA 748-B Variance Thresholds (from OOI EVMS Plan App A-5, A-6, A-7).
   * - Tier 1: ±30% and ±$10,000
   * - Tier 2: ±10% and ±$25,000
   */
  public evaluateAnsi748Thresholds(
    _bac: number,
    pv: number,
    ev: number,
    _ac: number,
    sv: number,
    cv: number,
    spi: number,
    cpi: number
  ): Ansi748ThresholdStatus {
    const reasons: string[] = [];
    const cvPct = ev > 0 ? (cv / ev) * 100 : 0;
    const svPct = pv > 0 ? (sv / pv) * 100 : 0;

    const absCv = Math.abs(cv);
    const absSv = Math.abs(sv);
    const absCvPct = Math.abs(cvPct);
    const absSvPct = Math.abs(svPct);

    // Tier 1 Check: ±30% and ±$10k
    const cvTier1 = absCvPct >= 30 && absCv >= 10000;
    const svTier1 = absSvPct >= 30 && absSv >= 10000;
    const tier1Breach = cvTier1 || svTier1;

    // Tier 2 Check: ±10% and ±$25k
    const cvTier2 = absCvPct >= 10 && absCv >= 25000;
    const svTier2 = absSvPct >= 10 && absSv >= 25000;
    const tier2Breach = cvTier2 || svTier2;

    if (tier2Breach) {
      if (cvTier2) reasons.push(`Cost Variance (${cvPct.toFixed(1)}%, ${formatCurrency(cv)}) breached Tier 2 (±10% / $25k).`);
      if (svTier2) reasons.push(`Schedule Variance (${svPct.toFixed(1)}%, ${formatCurrency(sv)}) breached Tier 2 (±10% / $25k).`);
      return {
        tier1Breach,
        tier2Breach: true,
        status: "VAR_TIER_2",
        badgeText: "ANSI 748-B TIER 2 BREACH (VAR REQUIRED)",
        badgeColor: "#ef4444",
        varRequired: true,
        reasons,
      };
    }

    if (tier1Breach) {
      if (cvTier1) reasons.push(`Cost Variance (${cvPct.toFixed(1)}%, ${formatCurrency(cv)}) breached Tier 1 (±30% / $10k).`);
      if (svTier1) reasons.push(`Schedule Variance (${svPct.toFixed(1)}%, ${formatCurrency(sv)}) breached Tier 1 (±30% / $10k).`);
      return {
        tier1Breach: true,
        tier2Breach: false,
        status: "VAR_TIER_1",
        badgeText: "ANSI 748-B TIER 1 BREACH (VAR REQUIRED)",
        badgeColor: "#f59e0b",
        varRequired: true,
        reasons,
      };
    }

    if (spi < 0.95 || cpi < 0.95) {
      reasons.push(`Performance indices below control limit (SPI: ${spi.toFixed(2)}, CPI: ${cpi.toFixed(2)}).`);
      return {
        tier1Breach: false,
        tier2Breach: false,
        status: "WATCH",
        badgeText: "WATCH LIST (VARIANCE NOTICE)",
        badgeColor: "#eab308",
        varRequired: false,
        reasons,
      };
    }

    return {
      tier1Breach: false,
      tier2Breach: false,
      status: "NORMAL",
      badgeText: "ANSI 748-B COMPLIANT (ON TRACK)",
      badgeColor: "#10b981",
      varRequired: false,
      reasons: ["Project performance operating within allowable ANSI/EIA 748-B variance parameters."],
    };
  }

  /**
   * Compute APM Bulls-Eye Quadrant Classification (APM EVM Handbook Fig 15).
   */
  public computeApmBullsEye(spi: number, cpi: number): ApmBullsEyeSummary {
    const dist = Math.sqrt(Math.pow(spi - 1.0, 2) + Math.pow(cpi - 1.0, 2));

    let quadrant: "Q1" | "Q2" | "Q3" | "Q4";
    let quadrantTitle: string;
    let quadrantDescription: string;

    if (spi >= 1.0 && cpi >= 1.0) {
      quadrant = "Q1";
      quadrantTitle = "Quadrant I: Under Budget & Ahead of Schedule";
      quadrantDescription = "Optimal execution efficiency. Project delivering ahead of plan with cost savings.";
    } else if (spi < 1.0 && cpi >= 1.0) {
      quadrant = "Q2";
      quadrantTitle = "Quadrant II: Under Budget & Behind Schedule";
      quadrantDescription = "Favorable costs but milestone delivery is delayed. Risk of liquidated damages.";
    } else if (spi < 1.0 && cpi < 1.0) {
      quadrant = "Q3";
      quadrantTitle = "Quadrant III: Over Budget & Behind Schedule";
      quadrantDescription = "Critical distress quadrant. Simultaneous cost overruns and construction slippage.";
    } else {
      quadrant = "Q4";
      quadrantTitle = "Quadrant IV: Over Budget & Ahead of Schedule";
      quadrantDescription = "Acceleration trade-off. Overtime expenditure or fast-tracking driving project ahead.";
    }

    let toleranceZone: "Inner Ring (±10%)" | "Outer Ring (±20%)" | "Critical Variance (>20%)";
    let ringColor: string;
    if (dist <= 0.10) {
      toleranceZone = "Inner Ring (±10%)";
      ringColor = "#10b981";
    } else if (dist <= 0.20) {
      toleranceZone = "Outer Ring (±20%)";
      ringColor = "#f59e0b";
    } else {
      toleranceZone = "Critical Variance (>20%)";
      ringColor = "#ef4444";
    }

    return {
      quadrant,
      quadrantTitle,
      quadrantDescription,
      distanceFromTarget: Math.round(dist * 100) / 100,
      toleranceZone,
      ringColor,
      spi,
      cpi,
    };
  }

  /**
   * Compute complete EVM analytics for the active schedule and simulation date.
   */
  public computeEvmMetrics(currentSimDateMs?: number): EvmMetricsSummary {
    const sm = ScheduleManager.getInstance();
    const tasks = sm.getTasksSorted();

    let simMs = currentSimDateMs ?? Date.now();
    const range = sm.getProjectDateRange();
    let minDateMs = simMs;
    let maxDateMs = simMs + 86400000;

    if (range) {
      minDateMs = range.min.getTime();
      maxDateMs = range.max.getTime();
      if (currentSimDateMs === undefined) {
        simMs = minDateMs;
      }
    }

    // Apply simulated delay if active
    let effectiveTasks = tasks;
    if (this.simulatedDelayDays > 0) {
      effectiveTasks = tasks.map(t => {
        if (t.isCritical || (t.totalFloat !== undefined && t.totalFloat <= 0)) {
          return {
            ...t,
            delayDays: (t.delayDays || 0) + this.simulatedDelayDays
          };
        }
        return t;
      });
    }

    const report: DelayImpactReport = this.delayEngine.computeProjectDelayReport(effectiveTasks, simMs);

    const bac = report.totalPlannedCost;
    const pv = report.plannedValue;
    const ev = report.earnedValue;
    const ac = report.totalActualCost;
    const sv = report.scheduleVariance;
    const cv = report.costVariance;
    const spi = report.spi;
    const cpi = report.cpi;

    // Advanced EAC Forecasts
    const eacForecasts = this.computeEacForecasts(bac, ev, ac, cpi, spi);
    const activeForecast = eacForecasts[this.activeEacModel];
    const eac = activeForecast.eacValue;
    const vac = activeForecast.vacValue;

    // TCPI Metrics
    const remainingWork = Math.max(0, bac - ev);
    const remainingBudgetBac = bac - ac;
    const remainingBudgetEac = eac - ac;
    const tcpiBac = remainingWork > 0 && remainingBudgetBac > 0 ? remainingWork / remainingBudgetBac : (remainingWork === 0 ? 1.0 : 9.99);
    const tcpiEac = remainingWork > 0 && remainingBudgetEac > 0 ? remainingWork / remainingBudgetEac : (remainingWork === 0 ? 1.0 : 9.99);
    const tcpiBacFeasible = remainingBudgetBac > 0 && tcpiBac <= 1.10;
    const tcpiEacFeasible = remainingBudgetEac > 0 && tcpiEac <= 1.10;

    const progressPercent = bac > 0 ? Math.min(100, Math.round((ev / bac) * 100)) : 0;
    const simDateIso = new Date(simMs).toISOString().split("T")[0];

    // Earned Schedule (Time-based Lipke/PMI metrics)
    const earnedSchedule = this.computeEarnedSchedule(effectiveTasks, simMs, ev, bac, minDateMs, maxDateMs);

    // ANSI/EIA 748-B Thresholds
    const ansiThresholds = this.evaluateAnsi748Thresholds(bac, pv, ev, ac, sv, cv, spi, cpi);

    // APM Bulls-Eye Matrix
    const apmBullsEye = this.computeApmBullsEye(spi, cpi);

    return {
      simDateMs: simMs,
      simDateIso,
      bac,
      pv,
      ev,
      ac,
      sv,
      cv,
      spi,
      cpi,
      eac,
      vac,
      tcpi: Math.round(tcpiBac * 100) / 100,
      tcpiBac: Math.round(tcpiBac * 100) / 100,
      tcpiEac: Math.round(tcpiEac * 100) / 100,
      tcpiBacFeasible,
      tcpiEacFeasible,
      progressPercent,
      prolongationCost: report.totalProlongationCost,
      penaltyCost: report.totalPenaltyCost,
      totalCostImpact: report.totalCostImpact,
      projectSlippageDays: report.projectSlippageDays,
      delayedCount: report.delayedCount,
      criticalDelayCount: report.criticalDelayCount,
      criticalTasksDelayed: report.criticalTasksDelayed,
      taskImpacts: report.taskImpacts,
      eacForecasts,
      activeEacModel: this.activeEacModel,
      earnedSchedule,
      ansiThresholds,
      apmBullsEye,
    };
  }

  /**
   * Generate time-series milestones for the multi-line S-Curve across project duration.
   */
  public generateSCurveSeries(steps: number = 28, currentSimDateMs?: number): {
    points: SCurvePoint[];
    maxCost: number;
    minDateMs: number;
    maxDateMs: number;
  } {
    const sm = ScheduleManager.getInstance();
    const tasks = sm.getTasksSorted();
    const range = sm.getProjectDateRange();

    if (!range || tasks.length === 0) {
      return { points: [], maxCost: 0, minDateMs: 0, maxDateMs: 0 };
    }

    const minDateMs = range.min.getTime();
    const maxDateMs = range.max.getTime();
    const durationMs = Math.max(1, maxDateMs - minDateMs);
    const stepMs = durationMs / Math.max(1, steps - 1);

    const points: SCurvePoint[] = [];
    let maxCost = 0;

    for (let i = 0; i < steps; i++) {
      const pointMs = minDateMs + i * stepMs;
      const report = this.delayEngine.computeProjectDelayReport(tasks, pointMs);
      const pv = report.plannedValue;
      const ev = pointMs <= (currentSimDateMs ?? maxDateMs) ? report.earnedValue : 0;
      const ac = pointMs <= (currentSimDateMs ?? maxDateMs) ? report.totalActualCost : 0;

      if (pv > maxCost) maxCost = pv;
      if (ev > maxCost) maxCost = ev;
      if (ac > maxCost) maxCost = ac;

      points.push({
        dateMs: pointMs,
        dateStr: new Date(pointMs).toISOString().split("T")[0],
        pv,
        ev,
        ac,
      });
    }

    return { points, maxCost: Math.max(1000, maxCost), minDateMs, maxDateMs };
  }

  /**
   * Render the dedicated Earned Value Management (EVM) Suite inside `#evm-panel`.
   */
  public render(currentSimDateMs?: number): void {
    const panel = document.getElementById("evm-panel");
    if (!panel) return;

    const metrics = this.computeEvmMetrics(currentSimDateMs);

    // 1. Status Badge in Header
    const statusBadge = document.getElementById("evm-status-badge");
    if (statusBadge) {
      statusBadge.style.borderColor = metrics.ansiThresholds.badgeColor;
      statusBadge.style.color = metrics.ansiThresholds.badgeColor;
      statusBadge.style.background = `${metrics.ansiThresholds.badgeColor}22`;
      statusBadge.textContent = `${metrics.ansiThresholds.badgeText} • SPI ${metrics.spi.toFixed(2)} | CPI ${metrics.cpi.toFixed(2)}`;
    }

    // 2. Executive KPI Cards
    const setElem = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setElem("evm-val-bac", formatCurrency(metrics.bac));
    setElem("evm-val-pv", formatCurrency(metrics.pv));
    setElem("evm-val-ev", formatCurrency(metrics.ev));
    setElem("evm-val-ac", formatCurrency(metrics.ac));

    // Schedule Variance & Cost Variance with sign styling
    const svEl = document.getElementById("evm-val-sv");
    if (svEl) {
      const svSign = metrics.sv >= 0 ? "+" : "−";
      svEl.textContent = `${svSign}${formatCurrency(Math.abs(metrics.sv))}`;
      svEl.style.color = metrics.sv >= 0 ? "var(--color-success)" : "var(--color-danger)";
    }

    const cvEl = document.getElementById("evm-val-cv");
    if (cvEl) {
      const cvSign = metrics.cv >= 0 ? "+" : "−";
      cvEl.textContent = `${cvSign}${formatCurrency(Math.abs(metrics.cv))}`;
      cvEl.style.color = metrics.cv >= 0 ? "var(--color-success)" : "var(--color-danger)";
    }

    // Indices & Forecasts
    setElem("evm-val-spi", metrics.spi.toFixed(2));
    setElem("evm-val-cpi", metrics.cpi.toFixed(2));
    setElem("evm-val-eac", formatCurrency(metrics.eac));
    setElem("evm-val-vac", (metrics.vac >= 0 ? "+" : "−") + formatCurrency(Math.abs(metrics.vac)));
    const vacEl = document.getElementById("evm-val-vac");
    if (vacEl) {
      vacEl.style.color = metrics.vac >= 0 ? "var(--color-success)" : "var(--color-danger)";
    }

    // TCPI BAC & EAC
    setElem("evm-val-tcpi", metrics.tcpiBac > 9 ? "Infeasible (>2.0)" : metrics.tcpiBac.toFixed(2));
    const tcpiBacPill = document.getElementById("evm-tcpi-bac-pill");
    if (tcpiBacPill) {
      tcpiBacPill.textContent = `BAC: ${metrics.tcpiBac > 9 ? "∞" : metrics.tcpiBac.toFixed(2)} (${metrics.tcpiBacFeasible ? "Feasible" : "High Risk"})`;
      tcpiBacPill.style.color = metrics.tcpiBacFeasible ? "var(--color-success)" : "var(--color-danger)";
    }
    const tcpiEacPill = document.getElementById("evm-tcpi-eac-pill");
    if (tcpiEacPill) {
      tcpiEacPill.textContent = `EAC: ${metrics.tcpiEac > 9 ? "∞" : metrics.tcpiEac.toFixed(2)} (${metrics.tcpiEacFeasible ? "Feasible" : "High Risk"})`;
      tcpiEacPill.style.color = metrics.tcpiEacFeasible ? "var(--color-success)" : "var(--color-danger)";
    }

    setElem("evm-val-progress", `${metrics.progressPercent}%`);

    // Earned Schedule (Time-Based Metrics)
    setElem("evm-val-es-svt", `${metrics.earnedSchedule.scheduleVarianceTimeDays >= 0 ? "+" : ""}${metrics.earnedSchedule.scheduleVarianceTimeDays}d`);
    const svtEl = document.getElementById("evm-val-es-svt");
    if (svtEl) {
      svtEl.style.color = metrics.earnedSchedule.scheduleVarianceTimeDays >= 0 ? "var(--color-success)" : "var(--color-danger)";
    }
    setElem("evm-val-es-spit", metrics.earnedSchedule.schedulePerformanceIndexTime.toFixed(2));
    setElem("evm-val-es-eact", `${metrics.earnedSchedule.estimatedDurationAtCompletionDays}d`);
    setElem("evm-val-es-target-finish", metrics.earnedSchedule.projectedFinishDateIso);

    // ANSI 748-B VAR Banner Alert
    const varBanner = document.getElementById("evm-var-alert-banner");
    if (varBanner) {
      if (metrics.ansiThresholds.varRequired) {
        varBanner.classList.remove("hidden");
        varBanner.style.display = "flex";
        varBanner.style.borderColor = metrics.ansiThresholds.badgeColor;
        varBanner.style.background = `${metrics.ansiThresholds.badgeColor}18`;
        const titleEl = document.getElementById("evm-var-banner-title");
        const descEl = document.getElementById("evm-var-banner-desc");
        if (titleEl) titleEl.textContent = metrics.ansiThresholds.badgeText;
        if (descEl) descEl.textContent = metrics.ansiThresholds.reasons.join(" ");
      } else {
        varBanner.classList.add("hidden");
        varBanner.style.display = "none";
      }
    }

    // Financial Exposure & Risk
    setElem("evm-val-slippage", `${metrics.projectSlippageDays > 0 ? "+" : ""}${metrics.projectSlippageDays} Days`);
    setElem("evm-val-prolongation", formatCurrency(metrics.prolongationCost));
    setElem("evm-val-penalties", formatCurrency(metrics.penaltyCost));
    setElem("evm-val-total-impact", formatCurrency(metrics.totalCostImpact));

    // Active EAC Model Selector State
    const selectModel = document.getElementById("select-evm-eac-model") as HTMLSelectElement | null;
    if (selectModel && selectModel.value !== this.activeEacModel) {
      selectModel.value = this.activeEacModel;
    }
    const eacDescEl = document.getElementById("evm-eac-formula-desc");
    if (eacDescEl) {
      const activeObj = metrics.eacForecasts[this.activeEacModel];
      eacDescEl.textContent = `${activeObj.formula} • ${activeObj.description}`;
    }

    // 3. Render Chart (S-Curve or APM Bulls-Eye Quadrant)
    const chartContainerId = document.getElementById("evm-chart-viewport")
      ? "evm-chart-viewport"
      : "evm-scurve-chart-container";

    if (this.chartViewMode === "scurve") {
      this.renderSCurveSVG(chartContainerId, metrics.simDateMs);
    } else {
      this.renderBullsEyeSVG(chartContainerId, metrics);
    }

    // 4. Render Critical Delayed Tasks Table
    this.renderDelayedTasksTable("evm-delayed-tasks-container", metrics.criticalTasksDelayed);
  }

  /**
   * Render high-resolution multi-line SVG S-Curve with PV, EV, AC lines and scrub position.
   */
  public renderSCurveSVG(containerId: string, currentSimDateMs?: number): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { points, maxCost, minDateMs, maxDateMs } = this.generateSCurveSeries(28, currentSimDateMs);

    if (points.length === 0 || maxCost === 0) {
      container.innerHTML = `
        <div style="font-size: 0.65rem; color: var(--text-muted); text-align: center; padding: 1.5rem; border: 1px dashed var(--border-subtle); border-radius: 6px;">
          Awaiting schedule or model loading to compute EVM S-Curve.
        </div>
      `;
      return;
    }

    const w = 360;
    const h = 145;
    const padL = 36;
    const padR = 14;
    const padT = 16;
    const padB = 22;

    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const mapX = (dateMs: number) => padL + ((dateMs - minDateMs) / Math.max(1, maxDateMs - minDateMs)) * chartW;
    const mapY = (cost: number) => padT + chartH - (cost / maxCost) * chartH;

    // Paths
    const pvPts = points.map(p => `${mapX(p.dateMs).toFixed(1)},${mapY(p.pv).toFixed(1)}`).join(" L ");
    const evPts = points.filter(p => p.ev > 0).map(p => `${mapX(p.dateMs).toFixed(1)},${mapY(p.ev).toFixed(1)}`).join(" L ");
    const acPts = points.filter(p => p.ac > 0).map(p => `${mapX(p.dateMs).toFixed(1)},${mapY(p.ac).toFixed(1)}`).join(" L ");

    const scrubX = currentSimDateMs ? mapX(currentSimDateMs) : padL;

    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.6rem; position: relative;">
        <!-- Header Legend -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem; font-size: 0.62rem; font-weight: 700;">
          <span style="color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">EVM Cumulative S-Curve</span>
          <div style="display: flex; gap: 0.6rem; align-items: center;">
            <span style="color: var(--color-info); display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: var(--color-info);"></span>PV</span>
            <span style="color: var(--color-success); display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: var(--color-success);"></span>EV</span>
            <span style="color: var(--color-warning); display: flex; align-items: center; gap: 0.2rem;"><span style="width: 8px; height: 2px; background: var(--color-warning);"></span>AC</span>
            <span style="color: var(--accent-primary); display: flex; align-items: center; gap: 0.2rem;"><span style="width: 2px; height: 8px; background: var(--accent-primary);"></span>Now</span>
          </div>
        </div>

        <!-- SVG Chart -->
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="overflow: visible;">
          <!-- Horizontal Grid Lines -->
          <line x1="${padL}" y1="${padT}" x2="${w - padR}" y2="${padT}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          <line x1="${padL}" y1="${padT + chartH * 0.5}" x2="${w - padR}" y2="${padT + chartH * 0.5}" stroke="rgba(255,255,255,0.08)" stroke-dasharray="2,2" />
          <line x1="${padL}" y1="${padT + chartH}" x2="${w - padR}" y2="${padT + chartH}" stroke="rgba(255,255,255,0.18)" />

          <!-- Y-Axis Ticks -->
          <text x="${padL - 4}" y="${padT + 4}" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">${(maxCost / 1e6).toFixed(1)}M</text>
          <text x="${padL - 4}" y="${padT + chartH * 0.5 + 3}" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">${(maxCost * 0.5 / 1e6).toFixed(1)}M</text>
          <text x="${padL - 4}" y="${padT + chartH}" font-size="7" fill="#64748b" text-anchor="end" font-family="monospace">0</text>

          <!-- Planned Value (PV) Curve -->
          <path d="M ${pvPts}" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />

          <!-- Actual Cost (AC) Curve -->
          ${acPts ? `<path d="M ${acPts}" fill="none" stroke="#f59e0b" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="3,2" />` : ""}

          <!-- Earned Value (EV) Curve -->
          ${evPts ? `<path d="M ${evPts}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" />` : ""}

          <!-- Current Simulation Scrub Line -->
          ${currentSimDateMs ? `
            <line x1="${scrubX}" y1="${padT}" x2="${scrubX}" y2="${padT + chartH}" stroke="#d4ff3f" stroke-width="1.5" stroke-dasharray="2,2" />
            <circle cx="${scrubX}" cy="${padT + chartH}" r="3" fill="#d4ff3f" />
          ` : ""}
        </svg>
      </div>
    `;
  }

  /**
   * Render APM Bulls-Eye Quadrant SVG Scatter Plot (APM EVM Handbook Figure 15).
   * Plots Cost Performance Index (CPI) vs Schedule Performance Index (SPI)
   * with centered axes (1.0, 1.0) and concentric ±10% and ±20% tolerance rings.
   */
  public renderBullsEyeSVG(containerId: string, metrics: EvmMetricsSummary): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const w = 360;
    const h = 210;
    const padL = 32;
    const padR = 24;
    const padT = 24;
    const padB = 28;

    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    // Domain for SPI and CPI: centered at 1.0, span [0.6, 1.4]
    const minVal = 0.6;
    const maxVal = 1.4;
    const span = maxVal - minVal;

    const mapX = (spi: number) => {
      const clamped = Math.max(minVal, Math.min(maxVal, spi));
      return padL + ((clamped - minVal) / span) * chartW;
    };

    const mapY = (cpi: number) => {
      const clamped = Math.max(minVal, Math.min(maxVal, cpi));
      return padT + chartH - ((clamped - minVal) / span) * chartH;
    };

    const centerX = mapX(1.0);
    const centerY = mapY(1.0);

    // Radii in SVG units for 0.10 (10%) and 0.20 (20%) tolerance rings
    const r10 = (0.10 / span) * chartW;
    const r20 = (0.20 / span) * chartW;

    const currentX = mapX(metrics.spi);
    const currentY = mapY(metrics.cpi);

    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.6rem; position: relative;">
        <!-- Header Legend -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem; font-size: 0.62rem; font-weight: 700;">
          <span style="color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;">APM Bulls-Eye Quadrant Matrix</span>
          <div style="display: flex; gap: 0.45rem; align-items: center; font-size: 0.58rem;">
            <span style="color: var(--color-success); font-weight: 800;">Target (1.0, 1.0)</span>
            <span style="color: ${metrics.apmBullsEye.ringColor}; font-weight: 800; background: ${metrics.apmBullsEye.ringColor}22; padding: 1px 5px; border-radius: 3px;">
              ${metrics.apmBullsEye.toleranceZone}
            </span>
          </div>
        </div>

        <!-- SVG Matrix Plot -->
        <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" style="overflow: visible;">
          <defs>
            <radialGradient id="target-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.3" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
            </radialGradient>
            <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <!-- Quadrant Background Tints -->
          <!-- Q1: Top-Right (SPI >= 1, CPI >= 1) - Green (Ahead & Under Budget) -->
          <rect x="${centerX}" y="${padT}" width="${chartW / 2}" height="${chartH / 2}" fill="rgba(16, 185, 129, 0.08)" />
          <!-- Q2: Top-Left (SPI < 1, CPI >= 1) - Yellow (Behind & Under Budget) -->
          <rect x="${padL}" y="${padT}" width="${chartW / 2}" height="${chartH / 2}" fill="rgba(245, 158, 11, 0.07)" />
          <!-- Q3: Bottom-Left (SPI < 1, CPI < 1) - Red (Behind & Over Budget) -->
          <rect x="${padL}" y="${centerY}" width="${chartW / 2}" height="${chartH / 2}" fill="rgba(239, 68, 68, 0.12)" />
          <!-- Q4: Bottom-Right (SPI >= 1, CPI < 1) - Orange (Ahead & Over Budget) -->
          <rect x="${centerX}" y="${centerY}" width="${chartW / 2}" height="${chartH / 2}" fill="rgba(249, 115, 22, 0.08)" />

          <!-- Concentric Tolerance Rings around (1.0, 1.0) -->
          <circle cx="${centerX}" cy="${centerY}" r="${r20}" fill="none" stroke="#f59e0b" stroke-width="1" stroke-dasharray="3,3" opacity="0.45" />
          <circle cx="${centerX}" cy="${centerY}" r="${r10}" fill="url(#target-glow)" stroke="#10b981" stroke-width="1.2" stroke-dasharray="2,2" opacity="0.75" />

          <!-- Center Crosshairs (1.0, 1.0) -->
          <line x1="${padL}" y1="${centerY}" x2="${w - padR}" y2="${centerY}" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" />
          <line x1="${centerX}" y1="${padT}" x2="${centerX}" y2="${padT + chartH}" stroke="rgba(255,255,255,0.25)" stroke-width="1.2" />

          <!-- Quadrant Text Labels -->
          <text x="${w - padR - 4}" y="${padT + 12}" font-size="6.5" font-weight="700" fill="#10b981" text-anchor="end">Q1: Ahead & Under Budget</text>
          <text x="${padL + 4}" y="${padT + 12}" font-size="6.5" font-weight="700" fill="#f59e0b" text-anchor="start">Q2: Behind & Under Budget</text>
          <text x="${padL + 4}" y="${padT + chartH - 6}" font-size="6.5" font-weight="700" fill="#ef4444" text-anchor="start">Q3: CRITICAL DISTRESS</text>
          <text x="${w - padR - 4}" y="${padT + chartH - 6}" font-size="6.5" font-weight="700" fill="#f97316" text-anchor="end">Q4: Ahead & Over Budget</text>

          <!-- Axis Tick Marks & Labels -->
          <text x="${centerX}" y="${padT - 6}" font-size="7" font-weight="800" fill="#94a3b8" text-anchor="middle">CPI ↑ (Cost Performance)</text>
          <text x="${w - padR + 2}" y="${centerY + 3}" font-size="7" font-weight="800" fill="#94a3b8" text-anchor="start">SPI →</text>
          <text x="${centerX + 4}" y="${centerY - 4}" font-size="7" font-weight="800" fill="#ffffff">1.0</text>

          <text x="${mapX(0.8)}" y="${padT + chartH + 11}" font-size="6.5" fill="#64748b" text-anchor="middle">0.8</text>
          <text x="${mapX(1.2)}" y="${padT + chartH + 11}" font-size="6.5" fill="#64748b" text-anchor="middle">1.2</text>
          <text x="${padL - 4}" y="${mapY(0.8) + 3}" font-size="6.5" fill="#64748b" text-anchor="end">0.8</text>
          <text x="${padL - 4}" y="${mapY(1.2) + 3}" font-size="6.5" fill="#64748b" text-anchor="end">1.2</text>

          <!-- Current Project Performance Marker -->
          <circle cx="${currentX}" cy="${currentY}" r="6" fill="${metrics.apmBullsEye.ringColor}" filter="url(#node-glow)" opacity="0.85" />
          <circle cx="${currentX}" cy="${currentY}" r="3" fill="#ffffff" />
          <line x1="${centerX}" y1="${centerY}" x2="${currentX}" y2="${currentY}" stroke="${metrics.apmBullsEye.ringColor}" stroke-width="1.5" stroke-dasharray="2,2" />

          <!-- Marker Badge -->
          <rect x="${Math.min(w - padR - 65, Math.max(padL + 2, currentX - 32))}" y="${currentY - 18 < padT ? currentY + 8 : currentY - 18}" width="64" height="12" rx="3" fill="#09090b" stroke="${metrics.apmBullsEye.ringColor}" stroke-width="1" />
          <text x="${Math.min(w - padR - 65, Math.max(padL + 2, currentX - 32)) + 32}" y="${(currentY - 18 < padT ? currentY + 8 : currentY - 18) + 9}" font-size="6" font-weight="800" fill="#ffffff" text-anchor="middle">
            SPI ${metrics.spi.toFixed(2)} | CPI ${metrics.cpi.toFixed(2)}
          </text>
        </svg>

        <!-- Quadrant Description Footer -->
        <div style="font-size: 0.58rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.3; background: var(--bg-hover); padding: 0.3rem 0.45rem; border-radius: 4px; border-left: 2px solid ${metrics.apmBullsEye.ringColor};">
          <strong style="color: var(--text-primary);">${metrics.apmBullsEye.quadrantTitle}</strong>: ${metrics.apmBullsEye.quadrantDescription} (Offset distance: ${metrics.apmBullsEye.distanceFromTarget}).
        </div>
      </div>
    `;
  }

  /**
   * Render table of critical delayed activities and their financial exposure.
   */
  public renderDelayedTasksTable(containerId: string, criticalDelayed: TaskDelayImpact[]): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (criticalDelayed.length === 0) {
      container.innerHTML = `
        <div style="font-size: 0.62rem; color: var(--color-success); background: var(--color-success-subtle); border: 1px solid var(--color-success-border); padding: 0.5rem 0.6rem; border-radius: 6px; display: flex; align-items: center; gap: 0.35rem;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6L9 17l-5-5"/></svg>
          <span>All critical path construction activities are operating on schedule. Zero delay exposure detected.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.35rem; width: 100%;">
        ${criticalDelayed.slice(0, 5).map(task => {
          return `
            <div style="background: var(--bg-card); border-left: 3px solid var(--color-danger); border: 1px solid var(--border-subtle); border-left-width: 3px; border-left-color: var(--color-danger); border-radius: 4px; padding: 0.35rem 0.5rem; display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; flex-direction: column; gap: 0.1rem; overflow: hidden; max-width: 65%;">
                <span style="font-size: 0.68rem; font-weight: 700; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${task.taskName}</span>
                <span style="font-size: 0.58rem; color: var(--text-muted);">Target End: ${task.plannedEndDate} • CPM Critical</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem;">
                <span style="font-size: 0.62rem; font-weight: 800; color: var(--color-danger); background: var(--color-danger-subtle); padding: 1px 4px; border-radius: 2px;">+${task.delayDays}d Delayed</span>
                <span style="font-size: 0.58rem; color: var(--text-muted); font-family: var(--font-mono);">${formatCurrency(task.totalCostImpact)} Exp</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  /**
   * Export complete EVM Audit Ledger to downloadable CSV.
   */
  public exportEvmAuditCsv(currentSimDateMs?: number): void {
    const metrics = this.computeEvmMetrics(currentSimDateMs);
    const headers = [
      "TaskID",
      "TaskName",
      "Category",
      "PlannedStartDate",
      "PlannedEndDate",
      "ActualStartDate",
      "ActualEndDate",
      "PlannedDurationDays",
      "ActualDurationDays",
      "DelayDays",
      "Status",
      "IsCritical",
      "TotalFloat",
      "PlannedCost_BAC",
      "ActualCost_AC",
      "ProlongationCost",
      "PenaltyCost",
      "TotalFinancialExposure"
    ];

    const rows = metrics.taskImpacts.map(t => [
      `"${t.taskId}"`,
      `"${t.taskName.replace(/"/g, '""')}"`,
      `"${t.category}"`,
      `"${t.plannedStartDate}"`,
      `"${t.plannedEndDate}"`,
      `"${t.actualStartDate || ""}"`,
      `"${t.actualEndDate || ""}"`,
      t.plannedDurationDays,
      t.actualDurationDays || "",
      t.delayDays,
      `"${t.status}"`,
      t.isCritical ? "YES" : "NO",
      t.totalFloat,
      t.plannedCost,
      t.actualCost,
      t.prolongationCost,
      t.penaltyCost,
      t.totalCostImpact
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BIM_EVM_Audit_${metrics.simDateIso}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`✓ Exported EVM Audit Ledger (${metrics.taskImpacts.length} activities)`, "success");
  }

  /**
   * Export ANSI/EIA 748-B CPR Format 1 (Work Breakdown Structure Summary Ledger CSV).
   */
  public exportCprFormat1Csv(currentSimDateMs?: number): void {
    const metrics = this.computeEvmMetrics(currentSimDateMs);
    const headers = [
      "WBS_Element_ID",
      "WBS_Description",
      "Discipline",
      "Status",
      "Planned_Start",
      "Planned_Finish",
      "Baseline_BAC",
      "Planned_Value_PV",
      "Earned_Value_EV",
      "Actual_Cost_AC",
      "Schedule_Variance_SV",
      "Cost_Variance_CV",
      "SV_Percent",
      "CV_Percent",
      "SPI",
      "CPI",
      "EAC_Typical",
      "EAC_Composite",
      "Forecast_VAC",
      "ANSI_748_Threshold_Status"
    ];

    const rows = metrics.taskImpacts.map(t => {
      const taskDone = Boolean(t.actualEndDate) || t.actualCost >= t.plannedCost;
      const taskEv = taskDone
        ? t.plannedCost
        : (t.status === "Ahead" || t.status === "On Schedule"
            ? t.plannedCost * 0.75
            : (t.status === "Delayed" ? t.plannedCost * 0.4 : t.plannedCost * 0.2));
      const taskPv = t.plannedCost;
      const taskAc = t.actualCost;
      const taskSv = taskEv - taskPv;
      const taskCv = taskEv - taskAc;
      const svPct = taskPv > 0 ? ((taskSv / taskPv) * 100).toFixed(1) : "0.0";
      const cvPct = taskEv > 0 ? ((taskCv / taskEv) * 100).toFixed(1) : "0.0";
      const taskSpi = taskPv > 0 ? (taskEv / taskPv).toFixed(2) : "1.00";
      const taskCpi = taskAc > 0 ? (taskEv / taskAc).toFixed(2) : "1.00";

      // Threshold check for task
      const isTier2 = Math.abs(Number(cvPct)) >= 10 && Math.abs(taskCv) >= 25000;
      const isTier1 = Math.abs(Number(cvPct)) >= 30 && Math.abs(taskCv) >= 10000;
      const varStatus = isTier2 ? "TIER 2 VAR REQUIRED" : (isTier1 ? "TIER 1 VAR REQUIRED" : "OK");

      const safeCpi = Math.max(0.05, Number(taskCpi));
      const safeSpi = Math.max(0.05, Number(taskSpi));
      const eacTyp = Math.round(t.plannedCost / safeCpi);
      const eacComp = Math.round(taskAc + Math.max(0, t.plannedCost - taskEv) / Math.max(0.05, safeCpi * safeSpi));
      const vacComp = t.plannedCost - eacComp;

      return [
        `"${t.taskId}"`,
        `"${t.taskName.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        `"${t.status}"`,
        `"${t.plannedStartDate}"`,
        `"${t.plannedEndDate}"`,
        t.plannedCost,
        taskPv,
        taskEv,
        taskAc,
        taskSv,
        taskCv,
        `"${svPct}%"`,
        `"${cvPct}%"`,
        taskSpi,
        taskCpi,
        eacTyp,
        eacComp,
        vacComp,
        `"${varStatus}"`
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CPR_Format1_WBS_Summary_${metrics.simDateIso}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`✓ Exported ANSI 748-B CPR Format 1 (${metrics.taskImpacts.length} WBS elements)`, "success");
  }

  /**
   * Generate ANSI/EIA 748-B CPR Format 5 (Variance Analysis Report - VAR).
   */
  public generateCprFormat5Report(currentSimDateMs?: number): string {
    const m = this.computeEvmMetrics(currentSimDateMs);
    const cvPct = m.ev > 0 ? ((m.cv / m.ev) * 100).toFixed(1) : "0.0";
    const svPct = m.pv > 0 ? ((m.sv / m.pv) * 100).toFixed(1) : "0.0";

    const report = `
================================================================================
     CONTRACT PERFORMANCE REPORT (CPR) FORMAT 5 — VARIANCE ANALYSIS REPORT (VAR)
     Standard: ANSI/EIA 748-B Earned Value Management System (EVMS)
================================================================================

1. PROJECT & REPORT IDENTIFICATION
--------------------------------------------------------------------------------
Project Name:       BIM Kintsugi Digital Twin & Construction Operations
Reporting Period:   Through ${m.simDateIso}
Control Account:    CA-001 (Structural, Architectural & MEP Execution)
CAM / Author:       Project Controls & BIM Management Office
Classification:     OFFICIAL PROJECT RECORD / PROPRIETARY

2. QUANTITATIVE VARIANCE SUMMARY
--------------------------------------------------------------------------------
Metric                              Value           Variance / %
--------------------------------------------------------------------------------
Budget at Completion (BAC):         ${formatCurrency(m.bac).padEnd(16)} Baseline Total
Planned Value (PV / BCWS):          ${formatCurrency(m.pv).padEnd(16)} Planned to Date
Earned Value (EV / BCWP):           ${formatCurrency(m.ev).padEnd(16)} Work Accomplished (${m.progressPercent}%)
Actual Cost (AC / ACWP):            ${formatCurrency(m.ac).padEnd(16)} Incurred to Date
Schedule Variance (SV):             ${formatCurrency(m.sv).padEnd(16)} ${svPct}%
Cost Variance (CV):                 ${formatCurrency(m.cv).padEnd(16)} ${cvPct}%
Schedule Performance Index (SPI):   ${m.spi.toFixed(2).padEnd(16)} [Threshold: >= 1.00]
Cost Performance Index (CPI):       ${m.cpi.toFixed(2).padEnd(16)} [Threshold: >= 1.00]
Active Forecast Model:              ${m.eacForecasts[m.activeEacModel].label}
Estimate at Completion (EAC):       ${formatCurrency(m.eac).padEnd(16)}
Variance at Completion (VAC):       ${formatCurrency(m.vac).padEnd(16)}
To-Complete Index (TCPI BAC):       ${m.tcpiBac.toFixed(2).padEnd(16)} (${m.tcpiBacFeasible ? "Feasible" : "Infeasible / High Risk"})
To-Complete Index (TCPI EAC):       ${m.tcpiEac.toFixed(2).padEnd(16)} (${m.tcpiEacFeasible ? "Feasible" : "Infeasible / High Risk"})

3. EARNED SCHEDULE (ES) TIME-BASED METRICS (Lipke / PMI Standard Box 3-1)
--------------------------------------------------------------------------------
Planned Project Duration (PD):      ${m.earnedSchedule.plannedDurationDays} calendar days
Actual Elapsed Time (AT):           ${m.earnedSchedule.actualTimeDays} calendar days
Earned Schedule (ES):               ${m.earnedSchedule.earnedScheduleDays} calendar days
Schedule Variance (Time) SV(t):     ${m.earnedSchedule.scheduleVarianceTimeDays >= 0 ? "+" : ""}${m.earnedSchedule.scheduleVarianceTimeDays} days (${m.earnedSchedule.scheduleVarianceTimeDays >= 0 ? "Ahead of Schedule" : "Behind Schedule"})
Schedule Performance Index SPI(t):  ${m.earnedSchedule.schedulePerformanceIndexTime.toFixed(2)}
Estimated Duration EAC(t):          ${m.earnedSchedule.estimatedDurationAtCompletionDays} calendar days
Time Variance at Completion VAC(t): ${m.earnedSchedule.timeVarianceAtCompletionDays >= 0 ? "+" : ""}${m.earnedSchedule.timeVarianceAtCompletionDays} days
Projected Practical Finish:         ${m.earnedSchedule.projectedFinishDateIso}

4. ANSI/EIA 748-B THRESHOLD BREACH AUDIT
--------------------------------------------------------------------------------
Compliance State:   ${m.ansiThresholds.badgeText}
VAR Status:         ${m.ansiThresholds.varRequired ? "MANDATORY VARIANCE ACTION REQUIRED" : "WITHIN TOLERANCE"}
Tier 1 Trigger:     ${m.ansiThresholds.tier1Breach ? "BREACHED (Exceeds ±30% and ±$10,000 threshold)" : "Pass"}
Tier 2 Trigger:     ${m.ansiThresholds.tier2Breach ? "BREACHED (Exceeds ±10% and ±$25,000 threshold)" : "Pass"}
Specific Triggers:
${m.ansiThresholds.reasons.map(r => `  - ${r}`).join("\n")}

5. APM BULLS-EYE QUADRANT DIAGNOSIS (APM Handbook Fig 15)
--------------------------------------------------------------------------------
Assigned Quadrant:  ${m.apmBullsEye.quadrantTitle}
Tolerance Ring:     ${m.apmBullsEye.toleranceZone}
Vector Offset:      ${m.apmBullsEye.distanceFromTarget} from target (1.0, 1.0)
Analysis:           ${m.apmBullsEye.quadrantDescription}

6. ROOT CAUSE ANALYSIS (RCA)
--------------------------------------------------------------------------------
Primary Variance Drivers:
${m.criticalTasksDelayed.length > 0 ? m.criticalTasksDelayed.map((t, idx) => `  ${idx + 1}. [${t.taskId}] ${t.taskName}:
     - Delay: +${t.delayDays} days (Planned Finish: ${t.plannedEndDate})
     - Prolongation Impact: ${formatCurrency(t.prolongationCost)}
     - Liquidated Penalties: ${formatCurrency(t.penaltyCost)}
     - Combined Exposure: ${formatCurrency(t.totalCostImpact)}`).join("\n") : "  - No critical path delays recorded."}

7. CORRECTIVE ACTION PLAN (CAP)
--------------------------------------------------------------------------------
Item # | Corrective Mitigation Action                | Owner      | Target Date | Expected Recovery
-------+---------------------------------------------+------------+-------------+-------------------
CAP-01 | Mobilize secondary structural crew          | Supt. Steel| Next 10 days| Reclaim 4 days float
CAP-02 | Expedite MEP prefabrication delivery        | MEP Lead   | Next 14 days| Prevent downstream ripple
CAP-03 | Re-baseline non-critical float activities   | Lead CAM   | Next cycle  | Stabilize TCPI < 1.05
CAP-04 | Enforce strict vendor penalty offsets       | Commercial | Ongoing     | Neutralize penalty fees

================================================================================
Approved by: Project Director _______________________   Date: ${m.simDateIso}
================================================================================
`.trim();

    return report;
  }

  /**
   * Open interactive CPR Format 5 Variance Analysis Report modal.
   */
  public openCprFormat5Modal(currentSimDateMs?: number): void {
    const reportText = this.generateCprFormat5Report(currentSimDateMs);
    const existing = document.getElementById("cpr-format5-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "cpr-format5-modal";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "var(--bg-overlay)";
    overlay.style.backdropFilter = "blur(8px)";
    overlay.style.zIndex = "99999";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.padding = "1.5rem";

    overlay.innerHTML = `
      <div style="background: var(--bg-panel); border: 1px solid var(--color-warning-border); border-radius: 10px; width: 880px; max-width: 95vw; height: 85vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: var(--shadow-panel);">
        <!-- Modal Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 1.2rem; background: var(--bg-panel-header); border-bottom: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            <h3 style="margin: 0; font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">CPR Format 5 — Variance Analysis Report (VAR)</h3>
            <span style="font-size: 0.6rem; background: var(--color-warning-subtle); color: var(--color-warning); border: 1px solid var(--color-warning-border); padding: 2px 6px; border-radius: 3px; font-weight: 700;">ANSI/EIA 748-B</span>
          </div>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button id="btn-cpr5-download" style="background: var(--accent-500); color: var(--accent-btn-text); border: none; padding: 0.35rem 0.75rem; border-radius: 5px; font-size: 0.72rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.35rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download Report (.txt)
            </button>
            <button id="btn-cpr5-copy" style="background: var(--bg-input); color: var(--text-main); border: 1px solid var(--border-color); padding: 0.35rem 0.75rem; border-radius: 5px; font-size: 0.72rem; font-weight: 600; cursor: pointer;">
              Copy to Clipboard
            </button>
            <button id="btn-cpr5-close" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 0.3rem;" aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- Modal Body Content -->
        <div style="flex: 1; padding: 1rem 1.2rem; overflow-y: auto;">
          <pre style="margin: 0; font-family: monospace; font-size: 0.75rem; line-height: 1.45; color: var(--text-main); background: var(--bg-app); padding: 1rem; border-radius: 6px; border: 1px solid var(--border-color); white-space: pre-wrap; word-break: break-all;">${reportText}</pre>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById("btn-cpr5-close")?.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    document.getElementById("btn-cpr5-download")?.addEventListener("click", () => {
      const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CPR_Format5_VAR_Report_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("✓ Downloaded CPR Format 5 Report", "success");
    });

    document.getElementById("btn-cpr5-copy")?.addEventListener("click", () => {
      navigator.clipboard.writeText(reportText).then(() => {
        showToast("✓ Copied CPR Format 5 Report to clipboard", "success");
      });
    });
  }
}
