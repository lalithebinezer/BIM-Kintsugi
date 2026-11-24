/**
 * ModelTreeController — Extracted Left-Sidebar Files List Search & Sample Registry
 *
 * Cleanly manages loaded model entry filtering and sample catalog definitions
 * outside src/main.ts.
 */

export interface SampleModelDescriptor {
  key: string;
  label: string;
  url: string;
  format: "ifc" | "frag";
}

export const SAMPLE_MODEL_CATALOG: readonly SampleModelDescriptor[] = [
  {
    key: "snowdon",
    label: "Snowdon Towers (Structural IFC)",
    url: "Dynamo_NCP_Snowdon_Towers_Sample_Structural_Final.ifc",
    format: "ifc",
  },
  {
    key: "school",
    label: "School Architecture (FRAG)",
    url: "school_arq.frag",
    format: "frag",
  },
];

export interface LoadedModelListItem {
  id: string;
  name: string;
  elementCount?: number;
  visible?: boolean;
}

export function filterLoadedModels(
  models: LoadedModelListItem[],
  query: string
): LoadedModelListItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return models;
  return models.filter(
    (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)
  );
}

export function resolveSampleModel(key: string): SampleModelDescriptor {
  return SAMPLE_MODEL_CATALOG.find((s) => s.key === key) ?? SAMPLE_MODEL_CATALOG[0];
}
