import { describe, it, expect } from "vitest";
import { ScheduleImportParsers } from "../ScheduleImportParsers";

describe("ScheduleImportParsers", () => {
  it("should parse Microsoft Project XML (MSPDI) schedule data correctly", () => {
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>Commercial Tower Phase 1</Name>
  <Tasks>
    <Task>
      <UID>10</UID>
      <Name>Excavation &amp; Reinforced Foundations</Name>
      <Start>2026-06-01T08:00:00</Start>
      <Finish>2026-06-15T17:00:00</Finish>
      <PercentComplete>100</PercentComplete>
      <Cost>85000</Cost>
    </Task>
    <Task>
      <UID>20</UID>
      <Name>Level 1 Concrete Slabs</Name>
      <Start>2026-06-16T08:00:00</Start>
      <Finish>2026-06-30T17:00:00</Finish>
      <PercentComplete>40</PercentComplete>
      <Cost>120000</Cost>
    </Task>
    <Task>
      <UID>30</UID>
      <Name>Curtain Wall Facade Glazing</Name>
      <Start>2026-07-01T08:00:00</Start>
      <Finish>2026-07-20T17:00:00</Finish>
      <PercentComplete>0</PercentComplete>
      <Cost>95000</Cost>
    </Task>
  </Tasks>
</Project>`;

    const res = ScheduleImportParsers.parseMSPDI(sampleXml);
    expect(res.format).toBe("MSPDI_XML");
    expect(res.projectName).toBe("Commercial Tower Phase 1");
    expect(res.tasks.length).toBe(3);

    expect(res.tasks[0].id).toBe("msp-10");
    expect(res.tasks[0].status).toBe("Completed");
    expect(res.tasks[0].category).toBe("IFCFOOTING");
    expect(res.tasks[0].startDate).toBe("2026-06-01");
    expect(res.tasks[0].endDate).toBe("2026-06-15");

    expect(res.tasks[1].status).toBe("In Progress");
    expect(res.tasks[1].category).toBe("IFCSLAB");

    expect(res.tasks[2].status).toBe("Planned");
    expect(res.tasks[2].category).toBe("IFCWINDOW");
  });

  it("should extract ExtendedAttribute SIMULATION and skip root summary task UID 0", () => {
    const synchroXml = `<?xml version="1.0" encoding="UTF-8"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>Snowdon Towers 4D Construction Sequence</Name>
  <ExtendedAttributes>
    <ExtendedAttribute>
      <FieldID>188743743</FieldID>
      <FieldName>Text4</FieldName>
      <Alias>SIMULATION</Alias>
    </ExtendedAttribute>
  </ExtendedAttributes>
  <Tasks>
    <Task>
      <UID>0</UID>
      <Name>Snowdon Towers 4D Construction Sequence</Name>
      <Start>2026-11-19T08:00:00</Start>
      <Finish>2027-06-05T17:00:00</Finish>
    </Task>
    <Task>
      <UID>1</UID>
      <Name>COL_EPit</Name>
      <Start>2026-12-03T08:00:00</Start>
      <Finish>2026-12-04T17:00:00</Finish>
      <WBS>1</WBS>
      <Critical>1</Critical>
      <TotalSlack>0</TotalSlack>
      <PercentComplete>100</PercentComplete>
      <ExtendedAttribute>
        <FieldID>188743743</FieldID>
        <Value>COL_EPit</Value>
      </ExtendedAttribute>
    </Task>
    <Task>
      <UID>2</UID>
      <Name>WALL_LL1_35_Low</Name>
      <Start>2027-03-19T08:00:00</Start>
      <Finish>2027-03-21T17:00:00</Finish>
      <WBS>2</WBS>
      <Critical>0</Critical>
      <TotalSlack>480</TotalSlack>
      <PercentComplete>50</PercentComplete>
      <ExtendedAttribute>
        <FieldID>188743743</FieldID>
        <Value>WALL_LL1_35_Low</Value>
      </ExtendedAttribute>
    </Task>
  </Tasks>
</Project>`;

    const res = ScheduleImportParsers.parseMSPDI(synchroXml);
    expect(res.tasks.length).toBe(2); // UID 0 skipped
    expect(res.tasks[0].id).toBe("msp-1");
    expect(res.tasks[0].name).toBe("COL_EPit");
    expect(res.tasks[0].simulationKey).toBe("COL_EPit");
    expect(res.tasks[0].isCritical).toBe(true);
    expect(res.tasks[0].totalFloat).toBe(0);

    expect(res.tasks[1].id).toBe("msp-2");
    expect(res.tasks[1].name).toBe("WALL_LL1_35_Low");
    expect(res.tasks[1].simulationKey).toBe("WALL_LL1_35_Low");
    expect(res.tasks[1].isCritical).toBe(false);
    expect(res.tasks[1].totalFloat).toBe(1); // 480 min = 1 day
  });

  it("should parse Primavera P6 XER export tables correctly", () => {
    const sampleXer = `ERMHDR	19.12	2026-06-01	XER	Primavera Project Management
%T	TASK
%F	task_code	task_name	target_start_date	target_end_date	status_code	target_cost
%R	TK-01	Underground Footings	2026-06-01 08:00	2026-06-12 17:00	TK_Complete	60000
%R	TK-02	Steel Column Erection	2026-06-13 08:00	2026-06-25 17:00	TK_Active	75000
%R	TK-03	HVAC Ducting & MEP	2026-06-26 08:00	2026-07-10 17:00	TK_NotStart	45000
%T	CALENDAR
`;

    const res = ScheduleImportParsers.parsePrimaveraP6(sampleXer);
    expect(res.format).toBe("PRIMAVERA_P6_XER");
    expect(res.tasks.length).toBe(3);

    expect(res.tasks[0].id).toBe("p6-TK-01");
    expect(res.tasks[0].status).toBe("Completed");
    expect(res.tasks[0].category).toBe("IFCFOOTING");
    expect(res.tasks[0].startDate).toBe("2026-06-01");
    expect(res.tasks[0].endDate).toBe("2026-06-12");

    expect(res.tasks[1].status).toBe("In Progress");
    expect(res.tasks[1].category).toBe("IFCCOLUMN");

    expect(res.tasks[2].status).toBe("Planned");
    expect(res.tasks[2].category).toBe("IFCFLOWSEGMENT");
  });
});

