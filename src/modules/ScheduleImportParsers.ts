import type { ScheduleTask, TaskStatus } from "./ScheduleManager";

/**
 * ScheduleImportParsers — Importers for MS Project (MSPDI XML) and Oracle Primavera (P6 XER).
 */

export interface ParsedScheduleResult {
  tasks: ScheduleTask[];
  format: "MSPDI_XML" | "PRIMAVERA_P6_XER";
  projectName: string;
}

export class ScheduleImportParsers {
  /**
   * Parse Microsoft Project XML (MSPDI) export.
   */
  public static parseMSPDI(xmlText: string): ParsedScheduleResult {
    let projectName = "MS Project Schedule";
    const nameMatch = xmlText.match(/<(?:Title|Name)>(.*?)<\/(?:Title|Name)>/i);
    if (nameMatch) {
      projectName = nameMatch[1].trim();
    }

    const tasks: ScheduleTask[] = [];
    const taskRegex = /<Task[\s\S]*?>([\s\S]*?)<\/Task>/gi;
    let match: RegExpExecArray | null;
    let idx = 1;

    const getTag = (block: string, tag: string) => {
      const reg = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
      const m = block.match(reg);
      return m ? m[1].replace(/&amp;/g, "&").trim() : "";
    };

    while ((match = taskRegex.exec(xmlText)) !== null) {
      const block = match[1];
      const uid = getTag(block, "UID") || `task-${idx}`;
      const name = getTag(block, "Name") || `Task ${idx}`;
      const startRaw = getTag(block, "Start");
      const finishRaw = getTag(block, "Finish");
      const percentComplete = Number(getTag(block, "PercentComplete") || "0");
      const cost = Number(getTag(block, "Cost") || "0");

      if (!startRaw || !finishRaw) continue;

      const startDate = startRaw.split("T")[0];
      const endDate = finishRaw.split("T")[0];

      let status: TaskStatus = "Planned";
      if (percentComplete >= 100) status = "Completed";
      else if (percentComplete > 0) status = "In Progress";

      const category = this.guessCategoryFromName(name);

      tasks.push({
        id: `msp-${uid}`,
        name,
        category,
        startDate,
        endDate,
        status,
        elementIds: new Set<number>(),
        modelId: "",
        unitCost: cost,
        quantity: 1,
      });
      idx++;
    }

    return {
      tasks,
      format: "MSPDI_XML",
      projectName,
    };
  }

  /**
   * Parse Oracle Primavera P6 XER tab-delimited file.
   */
  public static parsePrimaveraP6(xerText: string): ParsedScheduleResult {
    const lines = xerText.split(/\r?\n/);
    let inTaskTable = false;
    let headers: string[] = [];
    const tasks: ScheduleTask[] = [];
    let projectName = "Primavera P6 Schedule";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith("%T\tPROJECT")) {
        // Read project name if next line is %F / %R
        continue;
      }
      if (line.startsWith("%T\tTASK")) {
        inTaskTable = true;
        continue;
      }
      if (line.startsWith("%T\t") && inTaskTable) {
        // Another table started
        inTaskTable = false;
      }

      if (inTaskTable) {
        if (line.startsWith("%F\t")) {
          headers = line.substring(3).split("\t");
        } else if (line.startsWith("%R\t")) {
          const values = line.substring(3).split("\t");
          const getVal = (col: string) => {
            const cIdx = headers.indexOf(col);
            return cIdx >= 0 ? values[cIdx]?.trim() : "";
          };

          const taskCode = getVal("task_code") || `T-${i}`;
          const taskName = getVal("task_name") || `Task ${taskCode}`;
          const targetStart = getVal("target_start_date") || getVal("act_start_date") || getVal("early_start_date");
          const targetEnd = getVal("target_end_date") || getVal("act_end_date") || getVal("early_end_date");
          const statusVal = getVal("status_code"); // TK_NotStart, TK_Active, TK_Complete
          const targetCost = Number(getVal("target_cost") || "0");

          if (!targetStart || !targetEnd) continue;

          const startDate = this.normalizePrimaveraDate(targetStart);
          const endDate = this.normalizePrimaveraDate(targetEnd);

          let status: TaskStatus = "Planned";
          if (statusVal === "TK_Complete") status = "Completed";
          else if (statusVal === "TK_Active") status = "In Progress";

          tasks.push({
            id: `p6-${taskCode}`,
            name: taskName,
            category: this.guessCategoryFromName(taskName),
            startDate,
            endDate,
            status,
            elementIds: new Set<number>(),
            modelId: "",
            unitCost: targetCost,
            quantity: 1,
          });
        }
      }
    }

    return {
      tasks,
      format: "PRIMAVERA_P6_XER",
      projectName,
    };
  }

  private static normalizePrimaveraDate(raw: string): string {
    // Examples: "2026-07-01 08:00", "01-JUL-26"
    if (raw.includes(" ")) {
      return raw.split(" ")[0];
    }
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toISOString().split("T")[0];
    }
    return raw;
  }

  private static guessCategoryFromName(name: string): string {
    const upper = name.toUpperCase();
    if (upper.includes("FOUNDATION") || upper.includes("EXCAVAT") || upper.includes("FOOTING") || upper.includes("PILE")) return "IFCFOOTING";
    if (upper.includes("COLUMN") || upper.includes("PILLAR")) return "IFCCOLUMN";
    if (upper.includes("BEAM") || upper.includes("GIRDER")) return "IFCBEAM";
    if (upper.includes("SLAB") || upper.includes("DECK") || upper.includes("CONCRETE FLOOR")) return "IFCSLAB";
    if (upper.includes("CURTAIN") || upper.includes("FACADE") || upper.includes("WINDOW") || upper.includes("GLAZING")) return "IFCWINDOW";
    if (upper.includes("WALL") || upper.includes("PARTITION") || upper.includes("MASONRY")) return "IFCWALL";
    if (upper.includes("ROOF")) return "IFCROOF";
    if (upper.includes("DOOR")) return "IFCDOOR";
    if (upper.includes("STAIR")) return "IFCSTAIR";
    if (upper.includes("MEP") || upper.includes("HVAC") || upper.includes("DUCT") || upper.includes("PIPE") || upper.includes("ELECTRIC")) return "IFCFLOWSEGMENT";
    return "IFCELEMENT";
  }
}
