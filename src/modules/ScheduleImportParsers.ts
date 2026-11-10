import * as XLSX from "xlsx";
import type { ScheduleTask, TaskStatus } from "./ScheduleManager";

/**
 * ScheduleImportParsers — Importers for MS Project (MSPDI XML), Oracle Primavera (P6 XER),
 * and Bentley Synchro / Standard Excel Spreadsheets (.xlsx / .xls).
 */

export interface ParsedScheduleResult {
  tasks: ScheduleTask[];
  format: "MSPDI_XML" | "PRIMAVERA_P6_XER" | "EXCEL_WORKBOOK";
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

    // Map FieldID -> Alias for ExtendedAttributes (e.g. 188743743 -> "SIMULATION")
    const extAttrAliasMap = new Map<string, string>();
    const extAttrDefRegex = /<ExtendedAttribute[\s\S]*?>([\s\S]*?)<\/ExtendedAttribute>/gi;
    let defMatch: RegExpExecArray | null;
    while ((defMatch = extAttrDefRegex.exec(xmlText)) !== null) {
      const defBlock = defMatch[1];
      const fId = defBlock.match(/<FieldID[^>]*>([\s\S]*?)<\/FieldID>/i)?.[1]?.trim();
      const alias = defBlock.match(/<Alias[^>]*>([\s\S]*?)<\/Alias>/i)?.[1]?.trim();
      if (fId && alias) {
        extAttrAliasMap.set(fId, alias);
      }
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
      
      // Skip project summary task (UID 0) if other tasks exist
      if (uid === "0" && xmlText.includes("<UID>1</UID>")) continue;

      const name = getTag(block, "Name") || `Task ${idx}`;
      const startRaw = getTag(block, "Start");
      const finishRaw = getTag(block, "Finish");
      const percentComplete = Number(getTag(block, "PercentComplete") || "0");
      const cost = Number(getTag(block, "Cost") || "0");
      const wbsCode = getTag(block, "WBS") || getTag(block, "OutlineNumber") || String(idx);
      const isCritical = getTag(block, "Critical") === "1";
      const totalSlackMinutes = Number(getTag(block, "TotalSlack") || "0");
      const totalFloat = !isNaN(totalSlackMinutes) ? Math.round(totalSlackMinutes / 480) : 0;

      if (!startRaw || !finishRaw) continue;

      const startDate = startRaw.split("T")[0];
      const endDate = finishRaw.split("T")[0];

      let status: TaskStatus = "Planned";
      if (percentComplete >= 100) status = "Completed";
      else if (percentComplete > 0) status = "In Progress";

      // Extract custom simulation property from ExtendedAttribute
      let simulationKey = "";
      const taskExtRegex = /<ExtendedAttribute[\s\S]*?>([\s\S]*?)<\/ExtendedAttribute>/gi;
      let taskExtMatch: RegExpExecArray | null;
      while ((taskExtMatch = taskExtRegex.exec(block)) !== null) {
        const tBlock = taskExtMatch[1];
        const fId = tBlock.match(/<FieldID[^>]*>([\s\S]*?)<\/FieldID>/i)?.[1]?.trim();
        const val = tBlock.match(/<Value[^>]*>([\s\S]*?)<\/Value>/i)?.[1]?.trim();
        if (fId && val) {
          const alias = extAttrAliasMap.get(fId) || "";
          if (alias.toUpperCase() === "SIMULATION") {
            simulationKey = val;
          }
        }
      }
      if (!simulationKey) {
        simulationKey = name;
      }

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
        wbsCode,
        totalFloat,
        isCritical,
        simulationKey,
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

    // Root project summary task (UID 0) required by MSPDI schema & Synchro 4D Pro
    const minStartMs = new Date(minStart).getTime();
    const maxEndMs = new Date(maxEnd).getTime();
    const totalProjectDays = Math.max(1, Math.round((maxEndMs - minStartMs) / (1000 * 60 * 60 * 24)));
    const totalProjectHours = totalProjectDays * 8;

    const rootTaskXml = `    <Task>
      <UID>0</UID>
      <ID>0</ID>
      <Name>${xmlEscape(projectName)}</Name>
      <Type>0</Type>
      <IsNull>0</IsNull>
      <CreateDate>${minStart}T08:00:00</CreateDate>
      <Active>1</Active>
      <Manual>0</Manual>
      <WBS>0</WBS>
      <OutlineNumber>0</OutlineNumber>
      <OutlineLevel>0</OutlineLevel>
      <Priority>500</Priority>
      <Start>${minStart}T08:00:00</Start>
      <Finish>${maxEnd}T17:00:00</Finish>
      <Duration>PT${totalProjectHours}H0M0S</Duration>
      <DurationFormat>7</DurationFormat>
      <Work>PT${totalProjectHours}H0M0S</Work>
      <Milestone>0</Milestone>
      <PercentComplete>0</PercentComplete>
      <ConstraintType>0</ConstraintType>
      <CalendarUID>1</CalendarUID>
    </Task>`;

    const taskXml = tasks.map((t, idx) => {
      const uid = idx + 1;
      const s = new Date(t.startDate);
      const e = new Date(t.endDate);
      const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
      const durationHours = days * 8;
      const cost = t.unitCost ? t.unitCost * (t.quantity || 1) : 0;

      // Clean task name so it never contains redundant parameter prefixes
      const cleanName = (t.name || `Task ${uid}`)
        .replace(/^(Text\.[A-Za-z0-9_]+|SIMULATION|Reference|Pset_[A-Za-z0-9_]+):\s*/i, "")
        .trim() || t.name;

      const cleanCat = (t.category || "General")
        .replace(/^(Text\.[A-Za-z0-9_]+|SIMULATION|Reference|Pset_[A-Za-z0-9_]+):\s*/i, "")
        .trim() || (t.category || "General");

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

      const pctComplete = t.status === "Completed" ? 100 : (t.status === "In Progress" ? 50 : 0);
      const isMilestone = durationHours <= 0 ? 1 : 0;
      const actualDurationHours = Math.round((durationHours * pctComplete) / 100);
      const remainingDurationHours = Math.max(0, durationHours - actualDurationHours);

      return `    <Task>
      <UID>${uid}</UID>
      <ID>${uid}</ID>
      <Name>${xmlEscape(cleanName)}</Name>
      <Type>0</Type>
      <IsNull>0</IsNull>
      <CreateDate>${t.startDate}T08:00:00</CreateDate>
      <Active>1</Active>
      <Manual>0</Manual>
      <WBS>${xmlEscape(wbs)}</WBS>
      <OutlineNumber>${xmlEscape(wbs)}</OutlineNumber>
      <OutlineLevel>${outlineLevel}</OutlineLevel>
      <Priority>500</Priority>
      <Start>${t.startDate}T08:00:00</Start>
      <Finish>${t.endDate}T17:00:00</Finish>
      <Duration>PT${durationHours}H0M0S</Duration>
      <DurationFormat>7</DurationFormat>
      <Work>PT${durationHours}H0M0S</Work>
      <RemainingDuration>PT${remainingDurationHours}H0M0S</RemainingDuration>
      <ActualDuration>PT${actualDurationHours}H0M0S</ActualDuration>
      <RemainingWork>PT${remainingDurationHours}H0M0S</RemainingWork>
      <ActualWork>PT${actualDurationHours}H0M0S</ActualWork>
      <Milestone>${isMilestone}</Milestone>
      <PercentComplete>${pctComplete}</PercentComplete>
      <PercentWorkComplete>${pctComplete}</PercentWorkComplete>
      <Cost>${cost.toFixed(2)}</Cost>
      <EarlyStart>${t.startDate}T08:00:00</EarlyStart>
      <EarlyFinish>${t.endDate}T17:00:00</EarlyFinish>
      <LateStart>${(t as any).lateStart || t.startDate}T08:00:00</LateStart>
      <LateFinish>${(t as any).lateFinish || t.endDate}T17:00:00</LateFinish>
      <TotalSlack>${totalFloatHours * 60}</TotalSlack>
      <Critical>${t.isCritical ? 1 : 0}</Critical>
      <ConstraintType>0</ConstraintType>
      <CalendarUID>1</CalendarUID>${predecessorXml}
      <ExtendedAttribute>
        <FieldID>188743731</FieldID>
        <Value>${xmlEscape(cleanCat)}</Value>
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
  <ScheduleFromStart>1</ScheduleFromStart>
  <MinutesPerDay>480</MinutesPerDay>
  <MinutesPerWeek>2400</MinutesPerWeek>
  <DaysPerMonth>20</DaysPerMonth>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultFinishTime>17:00:00</DefaultFinishTime>
  <DefaultTaskType>0</DefaultTaskType>
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
${rootTaskXml}
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
      const cleanName = (t.name || `Task ${taskId}`)
        .replace(/^(Text\.[A-Za-z0-9_]+|SIMULATION|Reference|Pset_[A-Za-z0-9_]+):\s*/i, "")
        .replace(/\t/g, " ")
        .trim();
      xer += `%R\t${taskId}\t1\t${taskCode}\t${cleanName}\t${status}\t${t.startDate} 08:00\t${t.endDate} 17:00\t${cost}\n`;
    });

    xer += `%E\n`;
    return xer;
  }

  /**
   * Parse Bentley SYNCHRO 4D Pro Multi-Sheet Workbooks or Standard Excel Spreadsheets (.xlsx / .xls).
   */
  public static parseExcel(buffer: ArrayBuffer | Uint8Array, fileName: string = "Excel Project Schedule"): ParsedScheduleResult {
    let wb: XLSX.WorkBook;
    try {
      wb = XLSX.read(buffer, { type: "array" });
    } catch (e: any) {
      console.error("XLSX read error:", e);
      return { tasks: [], format: "EXCEL_WORKBOOK", projectName: fileName };
    }

    const toIsoDate = (val: any): string => {
      if (val === null || val === undefined || val === "") return "";
      if (typeof val === "number") {
        const date = new Date(Math.round((val - 25569) * 86400 * 1000));
        return !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : "";
      }
      const str = String(val).trim();
      if (!str) return "";
      const d = new Date(str);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
      return str;
    };

    const cleanNum = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === "number") return isNaN(val) ? 0 : val;
      const n = Number(String(val).replace(/[^0-9.-]/g, ""));
      return isNaN(n) ? 0 : n;
    };

    const tasks: ScheduleTask[] = [];

    // CASE 1: Bentley SYNCHRO 4D Pro Excel Export Workbook (contains "Tasks" sheet)
    if (wb.Sheets["Tasks"]) {
      const tasksSheet = wb.Sheets["Tasks"];
      const rawRows = XLSX.utils.sheet_to_json(tasksSheet, { header: 1 }) as any[][];
      if (rawRows.length > 1) {
        const headers = rawRows[0].map(h => String(h || "").trim().toLowerCase());
        const idCol = headers.findIndex(h => h.includes("taskid") || h.includes("id"));
        const nameCol = headers.findIndex(h => h.includes("taskname") || h.includes("name"));
        const startCol = headers.findIndex(h => h.includes("start"));
        const finishCol = headers.findIndex(h => h.includes("finish") || h.includes("end"));
        const resCol = headers.findIndex(h => h.includes("3dresource") || h.includes("resource"));

        // Optional: read DirectCosts or CostTotals sheet if present
        const taskCostMap = new Map<string, number>();
        if (wb.Sheets["DirectCosts"]) {
          const costRows = XLSX.utils.sheet_to_json(wb.Sheets["DirectCosts"], { header: 1 }) as any[][];
          if (costRows.length > 1) {
            const ch = costRows[0].map(h => String(h || "").trim().toLowerCase());
            const cTaskIdCol = ch.findIndex(h => h.includes("taskid"));
            const cCostCol = ch.findIndex(h => h.includes("cost") || h.includes("directcost") || h.includes("total"));
            if (cTaskIdCol >= 0 && cCostCol >= 0) {
              for (let i = 1; i < costRows.length; i++) {
                const tid = String(costRows[i][cTaskIdCol] || "").trim();
                const cost = cleanNum(costRows[i][cCostCol]);
                if (tid && cost > 0) {
                  taskCostMap.set(tid, (taskCostMap.get(tid) || 0) + cost);
                }
              }
            }
          }
        }

        // Read ResourceAssignments or 3DResources sheet if present to link element expressIds
        const taskElementMap = new Map<string, Set<number>>();
        const resSheet = wb.Sheets["ResourceAssignments"] || wb.Sheets["3DResources"] || wb.Sheets["Resources"];
        if (resSheet) {
          const resRows = XLSX.utils.sheet_to_json(resSheet, { header: 1 }) as any[][];
          if (resRows.length > 1) {
            const rh = resRows[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s_\-]/g, ""));
            const rTaskCol = rh.findIndex(h => h.includes("taskid") || h.includes("task"));
            const rObjCol = rh.findIndex(h => h.includes("objects3d") || h.includes("object") || h.includes("element") || h.includes("expressid"));
            const rResIdCol = rh.findIndex(h => h.includes("resourceid") || h.includes("resource"));

            for (let i = 1; i < resRows.length; i++) {
              const row = resRows[i];
              if (!row) continue;
              const tid = rTaskCol >= 0 && row[rTaskCol] ? String(row[rTaskCol]).trim() : "";
              const objStr = rObjCol >= 0 && row[rObjCol] ? String(row[rObjCol]).trim() : "";
              const resId = rResIdCol >= 0 && row[rResIdCol] ? String(row[rResIdCol]).trim() : "";
              const targetKey = tid || resId;
              if (targetKey && objStr) {
                if (!taskElementMap.has(targetKey)) taskElementMap.set(targetKey, new Set<number>());
                const set = taskElementMap.get(targetKey)!;
                objStr.split(/[,;\s|]+/).forEach(part => {
                  const num = cleanNum(part);
                  if (num > 0) set.add(num);
                });
              }
            }
          }
        }

        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;
          const id = idCol >= 0 && row[idCol] ? String(row[idCol]).trim() : `synchro-task-${i}`;
          const name = nameCol >= 0 && row[nameCol] ? String(row[nameCol]).trim() : `Task ${id}`;
          const startDate = startCol >= 0 ? toIsoDate(row[startCol]) : "";
          const endDate = finishCol >= 0 ? toIsoDate(row[finishCol]) : "";
          if (!startDate || !endDate) continue;

          const assignedRes = resCol >= 0 && row[resCol] ? String(row[resCol]).trim() : "";
          const totalCost = taskCostMap.get(id) || 0;
          const elementIds = taskElementMap.get(id) || (assignedRes ? taskElementMap.get(assignedRes) : undefined) || new Set<number>();

          tasks.push({
            id,
            name,
            category: "IFCELEMENT",
            startDate,
            endDate,
            status: "Planned",
            modelId: "",
            elementIds,
            unitCost: totalCost > 0 ? totalCost : 0,
            totalCost,
            quantity: Math.max(1, elementIds.size),
            simulationKey: assignedRes || name,
          });
        }

        if (tasks.length > 0) {
          return { tasks, format: "EXCEL_WORKBOOK", projectName: fileName.replace(/\.[^/.]+$/, "") };
        }
      }
    }

    // CASE 2: Generic / Single-Sheet Excel Schedule (e.g. NEW!.xlsx or Cost Schedule)
    const sheetName = wb.SheetNames.find(n => /schedule|tasks|cape|gantt/i.test(n)) || wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    if (sheet) {
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
      if (rows.length > 1) {
        const headers = rows[0].map(h => String(h || "").trim().toLowerCase().replace(/[\s_\-]/g, ""));
        const findCol = (...keys: string[]) => {
          const lower = keys.map(k => k.toLowerCase().replace(/[\s_\-]/g, ""));
          const exact = headers.findIndex(h => lower.includes(h));
          if (exact >= 0) return exact;
          return headers.findIndex(h => lower.some(k => h === k || h.startsWith(k)));
        };

        const idCol = findCol("taskid", "id", "code", "uid", "wbs");
        let nameCol = findCol("taskname", "activityname", "name", "activity", "description", "title");
        if (nameCol === idCol) {
          nameCol = headers.findIndex((h, idx) => idx !== idCol && (h.includes("name") || h.includes("desc") || h.includes("act")));
        }
        const startCol = findCol("startdate", "start", "targetstart", "earlystart");
        const finishCol = findCol("finishdate", "finish", "enddate", "end", "targetend", "earlyfinish");
        const costCol = findCol("totalcost", "cost", "budget", "amount", "total");
        const unitCostCol = findCol("unitcost", "unitrate", "rate");
        const catCol = findCol("category", "trade", "discipline", "type");
        const statusCol = findCol("status", "state", "progress");
        const idsCol = findCol("expressids", "elementids", "ids", "elements");

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          const id = idCol >= 0 && row[idCol] ? String(row[idCol]).trim() : `task-${i}`;
          const name = nameCol >= 0 && row[nameCol] ? String(row[nameCol]).trim() : `Task ${id}`;
          const startDate = startCol >= 0 ? toIsoDate(row[startCol]) : "";
          const endDate = finishCol >= 0 ? toIsoDate(row[finishCol]) : "";
          if (!startDate || !endDate) continue;

          const totalCost = costCol >= 0 ? cleanNum(row[costCol]) : 0;
          const unitCost = unitCostCol >= 0 ? cleanNum(row[unitCostCol]) : (totalCost > 0 ? totalCost : 0);
          const category = catCol >= 0 && row[catCol] ? String(row[catCol]).trim() : "IFCELEMENT";
          const statusRaw = statusCol >= 0 && row[statusCol] ? String(row[statusCol]).trim() : "Planned";
          const status = /complete/i.test(statusRaw) ? "Completed" : /progress|active/i.test(statusRaw) ? "In Progress" : "Planned";

          const elementIds = new Set<number>();
          if (idsCol >= 0 && row[idsCol]) {
            String(row[idsCol]).split(/[;,|]/).forEach(v => {
              const num = cleanNum(v);
              if (num > 0) elementIds.add(num);
            });
          }

          tasks.push({
            id,
            name,
            category,
            startDate,
            endDate,
            status,
            modelId: "",
            elementIds,
            unitCost,
            totalCost: totalCost || (unitCost * Math.max(1, elementIds.size)),
            quantity: Math.max(1, elementIds.size),
            simulationKey: name,
          });
        }
      }
    }

    return {
      tasks,
      format: "EXCEL_WORKBOOK",
      projectName: fileName.replace(/\.[^/.]+$/, ""),
    };
  }

}