import { parseIfcStepText } from "../modules/IfcStepParser";

export interface WorkerParseRequest {
  requestId: string;
  modelId: string;
  ifcText: string;
}

export interface WorkerParseResponse {
  requestId: string;
  modelId: string;
  count: number;
  properties: Record<number, any>;
  error?: string;
}

if (typeof self !== "undefined") {
  self.addEventListener("message", (event: MessageEvent<WorkerParseRequest>) => {
    const { requestId, modelId, ifcText } = event.data || {};
    try {
      const properties = parseIfcStepText(ifcText || "");
      const count = Object.keys(properties).length;
      const response: WorkerParseResponse = {
        requestId,
        modelId,
        count,
        properties,
      };
      (self as any).postMessage(response);
    } catch (err) {
      (self as any).postMessage({
        requestId,
        modelId,
        count: 0,
        properties: {},
        error: err instanceof Error ? err.message : String(err),
      } satisfies WorkerParseResponse);
    }
  });
}
