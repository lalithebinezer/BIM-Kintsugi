/**
 * IfcPreflightCoordinator — Off-thread Web Worker IFC STEP pre-flight scanner &
 * native IFC4 `IfcWorkSchedule` auto-importer with graceful main-thread fallback.
 */

import type { IfcPreflightReport } from "../modules/IfcStepParser";
import type { ScheduleManager } from "../modules/ScheduleManager";
import type { PreflightWorkerRequest, PreflightWorkerResponse } from "../workers/ifcPreflightWorker";
import { showToast } from "../ui/ToastManager";

export interface PreflightFormatResult {
  report: IfcPreflightReport;
  subtitleText: string;
  viaWorker: boolean;
}

let cachedWorker: Worker | null = null;
let workerReqSeq = 0;

function runPreflightInWorker(ifcText: string, timeoutMs: number = 8000): Promise<IfcPreflightReport> {
  return new Promise((resolve, reject) => {
    if (typeof Worker === "undefined") {
      reject(new Error("Web Worker unavailable"));
      return;
    }

    try {
      if (!cachedWorker) {
        cachedWorker = new Worker(new URL("../workers/ifcPreflightWorker.ts", import.meta.url), {
          type: "module",
        });
      }
    } catch (err) {
      reject(err);
      return;
    }

    const requestId = `pf-${++workerReqSeq}`;
    const worker = cachedWorker;

    const cleanup = () => {
      clearTimeout(timer);
      worker.removeEventListener("message", onMessage);
      worker.removeEventListener("error", onError);
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("IFC pre-flight worker timed out"));
    }, timeoutMs);

    const onMessage = (ev: MessageEvent<PreflightWorkerResponse>) => {
      if (!ev.data || ev.data.requestId !== requestId) return;
      cleanup();
      if (ev.data.error || !ev.data.report) {
        reject(new Error(ev.data.error || "Invalid pre-flight worker response"));
      } else {
        resolve(ev.data.report);
      }
    };

    const onError = (err: ErrorEvent) => {
      cleanup();
      terminatePreflightWorker();
      reject(new Error(err.message || "IFC pre-flight worker error"));
    };

    worker.addEventListener("message", onMessage);
    worker.addEventListener("error", onError);
    worker.postMessage({ requestId, ifcText } satisfies PreflightWorkerRequest);
  });
}

export function terminatePreflightWorker(): void {
  if (cachedWorker) {
    cachedWorker.terminate();
    cachedWorker = null;
  }
}

export async function runIfcPreflightSummary(ifcText: string): Promise<PreflightFormatResult> {
  let report: IfcPreflightReport;
  let viaWorker = false;

  try {
    report = await runPreflightInWorker(ifcText);
    viaWorker = true;
  } catch {
    const { scanIfcPreflight } = await import("../modules/IfcStepParser");
    report = scanIfcPreflight(ifcText);
    viaWorker = false;
  }

  const pfFlags = [
    report.hasMapConversion ? "CRS/MapConv" : "",
    report.hasAlignment ? "Alignment" : "",
    report.hasWorkSchedule ? "IFC4 Schedule" : "",
    report.hasElementQuantities ? "Qto" : "",
  ]
    .filter(Boolean)
    .join(" · ");

  const subtitleText = `Pre-flight: ${report.schema} (${report.lengthUnitLabel}, ${report.totalEntities.toLocaleString()} entities)${
    pfFlags ? ` · ${pfFlags}` : ""
  }`;

  return { report, subtitleText, viaWorker };
}

export async function tryImportNativeIfc4Schedule(
  preflightReport: IfcPreflightReport | null,
  loadedIfcStepText: string | null,
  scheduleManager: ScheduleManager | null,
  modelId: string
): Promise<boolean> {
  if (!preflightReport?.hasWorkSchedule || !loadedIfcStepText) return false;
  if (!scheduleManager || scheduleManager.tasks.size > 0) return false;

  try {
    const { ScheduleImportParsers } = await import("../modules/ScheduleImportParsers");
    const parsedIfc4 = ScheduleImportParsers.parseIfcWorkSchedule(loadedIfcStepText, modelId);
    if (parsedIfc4.tasks.length > 0) {
      for (const t of parsedIfc4.tasks) {
        scheduleManager.tasks.set(t.id, t);
      }
      scheduleManager.recomputeCpmAndRollups();
      showToast(`Loaded native IFC4 4D Schedule (${parsedIfc4.tasks.length} tasks)`, "success");
      return true;
    }
  } catch {
    // Fall back to category-based auto-sequencing
  }
  return false;
}
