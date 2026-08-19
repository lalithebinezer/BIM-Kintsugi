import type { FragmentsManager } from "@thatopen/components";
import * as FRAGS from "@thatopen/fragments";

/**
 * Exports the currently loaded FragmentsModel to a binary .frag file.
 * The .frag file uses the FlatBuffers schema defined in engine_fragment.
 */
export async function exportFrag(model: FRAGS.FragmentsModel, fileName: string) {
  const buffer = await model.getBuffer();
  const data = new Uint8Array(buffer);
  
  const blob = new Blob([data], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.frag`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Loads a .frag file and adds it to the FragmentsManager.
 */
export async function loadFrag(fragmentsManager: FragmentsManager, file: File): Promise<FRAGS.FragmentsModel> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  
  // Load the model directly into the fragments manager
  const model = await fragmentsManager.core.load(buffer, { modelId: file.name } as any);
  return model as FRAGS.FragmentsModel;
}
