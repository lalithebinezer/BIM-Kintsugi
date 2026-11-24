/**
 * AiToolCallEngine — Structured Tool-Calling Grounded BIM Copilot Router
 *
 * Parses natural-language engineering queries OR structured JSON tool calls from
 * a local Ollama/cloud LLM and routes them to deterministic, hallucination-free
 * BIM/4D/5D tool handlers (SPI anomaly explainer, 3-week lookahead, IDS QA audit,
 * What-If delay simulation, and bSDD standard lookup).
 */

import type { ScheduleTask } from "./ScheduleManager";
import { DelayImpactEngine } from "./DelayImpactEngine";
import { computeLookaheadReport } from "./LookaheadEngine";
import { simulateTaskDelayScenario } from "./WhatIfScenarioEngine";

export type BimToolName =
  | "explainSpiDrop"
  | "runLookahead"
  | "simulateDelay"
  | "runIdsPreset"
  | "scrub4DToDate"
  | "openBsddLookup";

export interface StructuredToolCall {
  tool: BimToolName;
  args: Record<string, string | number | boolean>;
}

export interface GroundedToolResponse {
  tool: BimToolName;
  summary: string;
  metrics: Record<string, string | number>;
  culpritTaskIds?: string[];
}

/**
 * Extracts a structured tool call from either raw JSON emitted by an LLM
 * or natural-language engineering queries.
 */
export function parsePromptToToolCall(input: string): StructuredToolCall | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;

  // 1. Direct JSON tool call emitted by an LLM
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed) as { tool?: string; args?: Record<string, any> };
      if (parsed.tool) {
        return {
          tool: parsed.tool as BimToolName,
          args: parsed.args ?? {},
        };
      }
    } catch {
      // Fall through to natural-language routing
    }
  }

  const lower = trimmed.toLowerCase();

  // 2. SPI / delay anomaly explanation
  if (/\b(spi|behind|slippage|why.*delay|overrun|critical delay)\b/i.test(lower)) {
    return { tool: "explainSpiDrop", args: {} };
  }

  // 3. N-week Lookahead query
  const lookMatch = lower.match(/(\d+)\s*-?\s*week.*lookahead|lookahead.*?(\d+)\s*week/i);
  if (lookMatch || /\blookahead\b/i.test(lower)) {
    const weeks = Number(lookMatch?.[1] || lookMatch?.[2] || 3);
    return { tool: "runLookahead", args: { weeks } };
  }

  // 4. What-If delay simulation ("what if COL_LL2 slips 14 days")
  const delayMatch = lower.match(/(?:delay|slip|shift|push).*?(\d+)\s*d/i);
  if (delayMatch || /\bwhat[\s-]?if\b/i.test(lower)) {
    const days = Number(delayMatch?.[1] || 14);
    return { tool: "simulateDelay", args: { delayDays: days } };
  }

  // 5. Date scrub ("jump to 2026-09-15")
  const isoMatch = trimmed.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch && /\b(jump|scrub|go to|date|simulate)\b/i.test(lower)) {
    return { tool: "scrub4DToDate", args: { dateIso: isoMatch[1] } };
  }

  // 6. IDS QA / ISO 19650 check
  if (/\b(ids|iso\s*19650|compliance|qto ready|simulation ready)\b/i.test(lower)) {
    return { tool: "runIdsPreset", args: {} };
  }

  // 7. bSDD / IFC 4.3 lookup
  if (/\b(bsdd|data dictionary|ifc\s*4\.3|buildingsmart)\b/i.test(lower)) {
    const clsMatch = trimmed.match(/\b(Ifc[A-Za-z]+)\b/);
    return { tool: "openBsddLookup", args: { query: clsMatch?.[1] ?? "" } };
  }

  return null;
}

/**
 * Executes a structured tool call deterministically against live 4D/5D project data.
 */
export function executeGroundedToolCall(
  call: StructuredToolCall,
  context: {
    tasks: ScheduleTask[];
    evalDateMs: number;
  }
): GroundedToolResponse {
  const { tasks, evalDateMs } = context;

  switch (call.tool) {
    case "explainSpiDrop": {
      const report = DelayImpactEngine.getInstance().computeProjectDelayReport(tasks, evalDateMs);
      const culprits = tasks
        .filter((t) => !t.isSummary && (t.delayDays ?? 0) > 0)
        .sort((a, b) => (b.delayDays ?? 0) - (a.delayDays ?? 0))
        .slice(0, 5);
      const culpritText =
        culprits.length > 0
          ? `Top delayed activities: ${culprits.map((c) => `${c.name} (+${c.delayDays}d)`).join(", ")}.`
          : "No tasks currently exceed planned finish dates.";
      return {
        tool: "explainSpiDrop",
        summary: `Current SPI is ${report.spi.toFixed(2)} (CPI ${report.cpi.toFixed(2)}), project slippage ${report.projectSlippageDays}d, delay cost exposure $${Math.round(report.totalCostImpact).toLocaleString()}. ${culpritText}`,
        metrics: {
          spi: Number(report.spi.toFixed(2)),
          cpi: Number(report.cpi.toFixed(2)),
          slippageDays: report.projectSlippageDays,
          delayedTasks: report.delayedCount + report.criticalDelayCount,
          costExposure: Math.round(report.totalCostImpact),
        },
        culpritTaskIds: culprits.map((c) => c.id),
      };
    }

    case "runLookahead": {
      const weeks = Number(call.args.weeks) || 3;
      const la = computeLookaheadReport(tasks, evalDateMs, weeks);
      return {
        tool: "runLookahead",
        summary: `${weeks}-Week Lookahead (${la.anchorIso} → ${la.horizonIso}): ${la.thisWeekTasks.length} active this week, ${la.lookaheadTasks.length} upcoming in horizon, ${la.completedTasks.length} completed.`,
        metrics: {
          weeks,
          thisWeek: la.thisWeekTasks.length,
          upcoming: la.lookaheadTasks.length,
          completed: la.completedTasks.length,
        },
        culpritTaskIds: [...la.thisWeekTasks, ...la.lookaheadTasks].map((t) => t.id),
      };
    }

    case "simulateDelay": {
      const delayDays = Number(call.args.delayDays) || 14;
      const targetId =
        String(call.args.taskId || "") || tasks.find((t) => !t.isSummary)?.id || "";
      const sim = simulateTaskDelayScenario(tasks, targetId, delayDays, evalDateMs, true);
      return {
        tool: "simulateDelay",
        summary: `What-If (+${delayDays}d on ${sim.targetTaskName}): ${sim.affectedTaskCount} tasks affected, finish moves ${sim.baselineEndDate} → ${sim.simulatedEndDate} (+${sim.projectSlipDays}d), cost exposure Δ $${sim.deltaCostImpact.toLocaleString()}, SPI ${sim.baselineSpi.toFixed(2)} → ${sim.simulatedSpi.toFixed(2)}.`,
        metrics: {
          affectedTasks: sim.affectedTaskCount,
          projectSlipDays: sim.projectSlipDays,
          deltaCostImpact: sim.deltaCostImpact,
          simulatedSpi: Number(sim.simulatedSpi.toFixed(2)),
        },
      };
    }

    case "scrub4DToDate": {
      const dateIso = String(call.args.dateIso || "");
      return {
        tool: "scrub4DToDate",
        summary: `Ready to scrub 4D simulation timeline to ${dateIso}.`,
        metrics: { dateIso },
      };
    }

    case "runIdsPreset":
      return {
        tool: "runIdsPreset",
        summary: "Running OpenBIM IDS Compliance Presets (ISO 19650, 4D SIMULATION, 5D QTO, Storeys).",
        metrics: { presetCount: 4 },
      };

    case "openBsddLookup": {
      const q = String(call.args.query || "");
      return {
        tool: "openBsddLookup",
        summary: `Opening buildingSMART Data Dictionary (bSDD) lookup${q ? ` for ${q}` : ""}.`,
        metrics: { query: q },
      };
    }
  }
}
