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

