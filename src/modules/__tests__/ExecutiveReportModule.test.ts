// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { ExecutiveReportModule } from "../ExecutiveReportModule";

describe("ExecutiveReportModule Unit Tests", () => {
  let module: ExecutiveReportModule;

  beforeEach(() => {
    module = ExecutiveReportModule.getInstance();
  });

  it("should compile valid executive report data with EVM and schedule numbers", () => {
    const data = module.compileReportData();

    expect(data).toBeDefined();
    expect(data.projectName).toBeDefined();
    expect(data.budgetAtCompletion).toBeGreaterThan(0);
    expect(data.plannedValue).toBeGreaterThan(0);
    expect(data.earnedValue).toBeGreaterThan(0);
    expect(data.cpi).toBeGreaterThan(0);
    expect(data.spi).toBeGreaterThan(0);
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.totalElements).toBeGreaterThan(0);
  });

  it("should generate a valid high-resolution SVG S-Curve string", () => {
    const svg = module.generateSCurveSvg(600, 200);

    expect(svg).toContain("<svg");
    expect(svg).toContain("Planned Value (PV)");
    expect(svg).toContain("Earned Value (EV)");
    expect(svg).toContain("Actual (AC)");
    expect(svg).toContain("</svg>");
  });

  it("should open and close the executive report modal", () => {
    module.openReportModal();
    const modal = document.getElementById("executive-report-modal");
    expect(modal).not.toBeNull();
    expect(modal?.style.display).toBe("flex");

    module.closeReportModal();
    expect(modal?.style.display).toBe("none");
  });
});
