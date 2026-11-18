import { scanIfcPreflight, type IfcPreflightReport } from "../modules/IfcStepParser";

export interface PreflightWorkerRequest {
  requestId: string;
  ifcText: string;
}

export interface PreflightWorkerResponse {
  requestId: string;
  report?: IfcPreflightReport;
  error?: string;
}

if (typeof self !== "undefined") {
  self.addEventListener("message", (event: MessageEvent<PreflightWorkerRequest>) => {
    const { requestId, ifcText } = event.data || {};
    try {
      const report = scanIfcPreflight(ifcText || "");
      (self as any).postMessage({
        requestId,
        report,
      } satisfies PreflightWorkerResponse);
    } catch (err) {
      (self as any).postMessage({
        requestId,
        error: err instanceof Error ? err.message : String(err),
      } satisfies PreflightWorkerResponse);
    }
  });
}
