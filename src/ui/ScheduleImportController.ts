/**
 * ScheduleImportController — Unified 4D/5D Schedule File Format Router
 *
 * Cleanly separates CSV, Excel (.xlsx/.xls via lazy-loaded xlsx chunk),
 * MS Project XML (.xml), and Primavera P6 (.xer) import handling from src/main.ts.
 */

import type { ScheduleManager } from "../modules/ScheduleManager";
import { scheduleParsersFeature } from "../modules/optionalFeatures";

export type ScheduleFileFormat = "csv" | "excel" | "mspdi-xml" | "primavera-xer" | "unknown";

export function detectScheduleFileFormat(filename: string): ScheduleFileFormat {
  const lower = (filename || "").trim().toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xlsx") || lower.endsWith(".xls")) return "excel";
  if (lower.endsWith(".xml")) return "mspdi-xml";
  if (lower.endsWith(".xer")) return "primavera-xer";
  return "unknown";
}

export interface ScheduleImportOutcome {
  format: ScheduleFileFormat;
  importedCount: number;
  filename: string;
}

/**
 * Parses any supported 4D/5D schedule file into `scheduleManager`, lazily loading
 * `xlsx` or MSPDI/P6 parsers only when needed.
 */
export async function importScheduleFileIntoManager(
  file: File,
  scheduleManager: ScheduleManager
): Promise<ScheduleImportOutcome> {
  const format = detectScheduleFileFormat(file.name);
  let importedCount = 0;

  if (format === "excel") {
    const buffer = await file.arrayBuffer();
    importedCount = await scheduleManager.importScheduleFromExcel(buffer, file.name);
  } else if (format === "csv") {
    const text = await file.text();
    importedCount = scheduleManager.importScheduleFromCSV(text, { replaceExisting: true });
  } else if (format === "mspdi-xml" || format === "primavera-xer") {
    const text = await file.text();
    const Parsers = await scheduleParsersFeature.load();
    const parsed =
      format === "mspdi-xml" ? Parsers.parseMSPDI(text) : Parsers.parsePrimaveraP6(text);
    if (parsed && parsed.tasks.length > 0) {
      scheduleManager.tasks.clear();
      for (const t of parsed.tasks) {
        scheduleManager.tasks.set(t.id, t);
      }
      importedCount = parsed.tasks.length;
    }
  }

  return { format, importedCount, filename: file.name };
}
