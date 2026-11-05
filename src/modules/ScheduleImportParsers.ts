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

  /**
   * Export schedule tasks to Microsoft Project XML format (MSPDI) with full
   * enterprise metadata: Calendars, WBS Outline, Trade Resources, Assignments,
   * Predecessors, and Custom User Fields (UDF).
   */
  public static exportToMSPDI(tasks: ScheduleTask[], projectName: string = "BIM-Kintsugi 4D Schedule"): string {
    const minStart = tasks.reduce((min, t) => !min || t.startDate < min ? t.startDate : min, "") || "2026-06-18";
    const maxEnd = tasks.reduce((max, t) => !max || t.endDate > max ? t.endDate : max, "") || "2026-12-31";

    const xmlEscape = (str: string) => (str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

    // 1. Build Trade Resources from unique IFC categories
    const tradeMap = new Map<string, { uid: number; name: string }>();
    let resUidCounter = 1;

    const getTradeName = (category: string) => {
      const upper = (category || "").toUpperCase();
      if (upper.includes("FOOT") || upper.includes("PILE")) return "Substructure & Geotechnical Crew";
      if (upper.includes("COLUMN")) return "Structural Concrete Columns Crew";
      if (upper.includes("BEAM") || upper.includes("MEMBER")) return "Structural Framing & Steel Crew";
      if (upper.includes("SLAB")) return "Concrete Slabs & Decks Crew";
      if (upper.includes("WALL")) return "Wall & Partition Masonry Crew";
      if (upper.includes("ROOF")) return "Roofing & Waterproofing Trade";
      if (upper.includes("DOOR") || upper.includes("WINDOW") || upper.includes("CURTAIN")) return "Glazing & Enclosure Trade";
      if (upper.includes("STAIR") || upper.includes("RAMP")) return "Vertical Circulation Crew";
      if (upper.includes("FLOW") || upper.includes("MEP") || upper.includes("DUCT") || upper.includes("PIPE")) return "MEP Building Services Trade";
      if (upper.includes("COVERING") || upper.includes("FINISH")) return "Interior Architectural Finishes Crew";
      return "General Construction Trade";
    };

    tasks.forEach(t => {
      const cat = t.category || "General";
      if (!tradeMap.has(cat)) {
        tradeMap.set(cat, {
          uid: resUidCounter++,
          name: getTradeName(cat)
        });
      }
    });

    const resourcesXml = Array.from(tradeMap.values()).map(r => `    <Resource>
      <UID>${r.uid}</UID>
      <ID>${r.uid}</ID>
      <Name>${xmlEscape(r.name)}</Name>
      <Type>1</Type>
      <MaxUnits>1.0</MaxUnits>
    </Resource>`).join("\n");

    // 2. Build Task XML with WBS, Predecessors, and UDFs
    const assignmentsList: string[] = [];
    let assignUid = 1;

    const taskXml = tasks.map((t, idx) => {
      const uid = idx + 1;
      const s = new Date(t.startDate);
      const e = new Date(t.endDate);
      const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      const durationHours = days * 8;
      const pct = t.status === "Completed" ? 100 : t.status === "In Progress" ? 50 : 0;
      const cost = t.unitCost ? t.unitCost * (t.quantity || 1) : 0;

      const wbs = t.wbsCode || String(uid);
      const outlineLevel = wbs.includes(".") ? wbs.split(".").length : 1;
      const elemCount = t.elementIds ? t.elementIds.size : (t.quantity || 1);
      const isCrit = t.isCritical ? "YES" : "NO";
      const totalFloatHours = (t.totalFloat ?? 0) * 8;

      // Assign to trade resource
      const resource = tradeMap.get(t.category || "General");
      if (resource) {
        assignmentsList.push(`    <Assignment>
      <UID>${assignUid++}</UID>
      <TaskUID>${uid}</TaskUID>
      <ResourceUID>${resource.uid}</ResourceUID>
      <Units>1.0</Units>
      <Cost>${cost.toFixed(2)}</Cost>
    </Assignment>`);
      }

      // Predecessor link: sequential Finish-to-Start link to previous task
      let predecessorXml = "";
      if (idx > 0) {
        predecessorXml = `\n      <PredecessorLink>
        <PredecessorUID>${idx}</PredecessorUID>
        <Type>1</Type>
        <CrossProject>0</CrossProject>
        <LinkLag>0</LinkLag>
        <LagFormat>7</LagFormat>
      </PredecessorLink>`;
      }

      return `    <Task>
      <UID>${uid}</UID>
      <ID>${uid}</ID>
      <Name>${xmlEscape(t.name)}</Name>
      <Type>1</Type>
      <IsNull>0</IsNull>
      <OutlineNumber>${xmlEscape(wbs)}</OutlineNumber>
      <OutlineLevel>${outlineLevel}</OutlineLevel>
      <WBS>${xmlEscape(wbs)}</WBS>
      <CalendarUID>1</CalendarUID>
      <CreateDate>${t.startDate}T08:00:00</CreateDate>
      <Start>${t.startDate}T08:00:00</Start>
      <Finish>${t.endDate}T17:00:00</Finish>
      <Duration>PT${durationHours}H0M0S</Duration>
      <PercentComplete>${pct}</PercentComplete>
      <Cost>${cost.toFixed(2)}</Cost>
      <TotalSlack>${totalFloatHours * 60}</TotalSlack>
      <Critical>${t.isCritical ? 1 : 0}</Critical>${predecessorXml}
      <ExtendedAttribute>
        <FieldID>188743731</FieldID>
        <Value>${xmlEscape(t.category || "IFCELEMENT")}</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldID>188743734</FieldID>
        <Value>${xmlEscape(wbs)}</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldID>188743737</FieldID>
        <Value>${elemCount}</Value>
      </ExtendedAttribute>
      <ExtendedAttribute>
        <FieldID>188743740</FieldID>
        <Value>${isCrit}</Value>
      </ExtendedAttribute>
    </Task>`;
    }).join("\n");

    const assignmentsXml = assignmentsList.join("\n");

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${xmlEscape(projectName)}</Name>
  <Title>${xmlEscape(projectName)}</Title>
  <Company>BIM Kintsugi Enterprise 4D</Company>
  <CalendarUID>1</CalendarUID>
  <StartDate>${minStart}T08:00:00</StartDate>
  <FinishDate>${maxEnd}T17:00:00</FinishDate>
  <ExtendedAttributes>
    <ExtendedAttribute>
      <FieldID>188743731</FieldID>
      <FieldName>Text1</FieldName>
      <Alias>IFC Category</Alias>
    </ExtendedAttribute>
    <ExtendedAttribute>
      <FieldID>188743734</FieldID>
      <FieldName>Text2</FieldName>
      <Alias>WBS Code</Alias>
    </ExtendedAttribute>
    <ExtendedAttribute>
      <FieldID>188743737</FieldID>
      <FieldName>Number1</FieldName>
      <Alias>BIM Element Count</Alias>
    </ExtendedAttribute>
    <ExtendedAttribute>
      <FieldID>188743740</FieldID>
      <FieldName>Text3</FieldName>
      <Alias>Critical Path (CPM)</Alias>
    </ExtendedAttribute>
  </ExtendedAttributes>
  <Calendars>
    <Calendar>
      <UID>1</UID>
      <Name>Standard 5 Day Workweek</Name>
      <IsBaseCalendar>1</IsBaseCalendar>
      <WeekDays>
        <WeekDay>
          <DayType>1</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
        <WeekDay>
          <DayType>2</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>3</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>4</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>5</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>6</DayType>
          <DayWorking>1</DayWorking>
          <WorkingTimes>
            <WorkingTime>
              <FromTime>08:00:00</FromTime>
              <ToTime>12:00:00</ToTime>
            </WorkingTime>
            <WorkingTime>
              <FromTime>13:00:00</FromTime>
              <ToTime>17:00:00</ToTime>
            </WorkingTime>
          </WorkingTimes>
        </WeekDay>
        <WeekDay>
          <DayType>7</DayType>
          <DayWorking>0</DayWorking>
        </WeekDay>
      </WeekDays>
    </Calendar>
  </Calendars>
  <Tasks>
${taskXml}
  </Tasks>
  <Resources>
${resourcesXml}
  </Resources>
  <Assignments>
${assignmentsXml}
  </Assignments>
</Project>`;
  }

  /**
   * Export schedule tasks to Oracle Primavera P6 XER format.
   */
  public static exportToPrimaveraP6(tasks: ScheduleTask[], projectName: string = "BIM-Kintsugi 4D Schedule"): string {
    const minStart = tasks.reduce((min, t) => !min || t.startDate < min ? t.startDate : min, "") || "2026-06-18";
    const maxEnd = tasks.reduce((max, t) => !max || t.endDate > max ? t.endDate : max, "") || "2026-12-31";
    const today = new Date().toISOString().split("T")[0];

    let xer = `ERMHDR\t24.12\t${today}\tPROJECTS\tUSER\tBIM-Kintsugi\n`;
    xer += `%T\tPROJECT\n`;
    xer += `%F\tproj_id\tproj_short_name\tclndr_id\tplan_start_date\tplan_end_date\n`;
    xer += `%R\t1\t${projectName.replace(/\t/g, " ").slice(0, 32)}\t1\t${minStart} 08:00\t${maxEnd} 17:00\n`;
    xer += `%T\tCALENDAR\n`;
    xer += `%F\tclndr_id\tclndr_name\tclndr_type\tday_hr_cnt\tweek_hr_cnt\n`;
    xer += `%R\t1\tStandard 5 Day Workweek\tCA_Base\t8.0\t40.0\n`;
    xer += `%T\tTASK\n`;
    xer += `%F\ttask_id\tproj_id\ttask_code\ttask_name\tstatus_code\ttarget_start_date\ttarget_end_date\ttarget_cost\n`;

    tasks.forEach((t, idx) => {
      const taskId = idx + 1;
      const taskCode = `TK-${String(idx + 1).padStart(3, "0")}`;
      const status = t.status === "Completed" ? "TK_Complete" : t.status === "In Progress" ? "TK_Active" : "TK_NotStart";
      const cost = (t.unitCost ? t.unitCost * (t.quantity || 1) : 0).toFixed(2);
      const safeName = (t.name || `Task ${taskId}`).replace(/\t/g, " ");
      xer += `%R\t${taskId}\t1\t${taskCode}\t${safeName}\t${status}\t${t.startDate} 08:00\t${t.endDate} 17:00\t${cost}\n`;
    });

    xer += `%E\n`;
    return xer;
  }

}