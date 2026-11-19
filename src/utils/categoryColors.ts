/**
 * Category color palette & IFC relation helper utilities extracted from main.ts.
 */

export function isRelatedObject(relatedObjects: any, idToMatch: number): boolean {
  if (!relatedObjects) return false;
  if (Array.isArray(relatedObjects)) {
    try {
      for (let i = 0; i < relatedObjects.length; i++) {
        try {
          const obj = relatedObjects[i];
          if (Number(obj?.value ?? obj) === idToMatch) return true;
        } catch {
          // Ignore getter errors from WebAssembly/Proxy properties
        }
      }
    } catch {
      // Ignore proxy iteration errors
    }
    return false;
  }
  return Number(relatedObjects.value ?? relatedObjects) === idToMatch;
}

const CATEGORY_COLOR_MAP: Record<string, string> = {
  IFCWALL: "#94a3b8",
  IFCWALLSTANDARDCASE: "#94a3b8",
  IFCSLAB: "#60a5fa",
  IFCROOF: "#6b7280",
  IFCCOLUMN: "#fbbf24",
  IFCBEAM: "#f97316",
  IFCDOOR: "#34d399",
  IFCWINDOW: "#38bdf8",
  IFCSTAIR: "#a78bfa",
  IFCSTAIRFLIGHT: "#a78bfa",
  IFCRAILING: "#e879f9",
  IFCFURNISHINGELEMENT: "#fb923c",
  IFCFLOWSEGMENT: "#22d3ee",
  IFCFLOWFITTING: "#22d3ee",
  IFCFLOWTERMINAL: "#4ade80",
  IFCSPACE: "#fde68a",
  IFCFOOTING: "#d97706",
  IFCPILE: "#92400e",
  IFCPLATE: "#78716c",
  IFCCOVERING: "#a3e635",
};

export function getCategoryColor(_theme: string, category: string): string {
  return CATEGORY_COLOR_MAP[category.toUpperCase()] ?? "#a78bfa";
}
