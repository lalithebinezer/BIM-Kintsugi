import { describe, it, expect } from "vitest";
import { CobieExportModule } from "../CobieExportModule";

describe("CobieExportModule", () => {
  it("should generate structured standard COBie dataset with Facility, Floors, and Components", () => {
    const module = CobieExportModule.getInstance();
    const dataset = module.generateCobieDataset();

    expect(dataset.facility).toBeDefined();
    expect(dataset.facility.name).toContain("BIM Kintsugi");
    expect(dataset.facility.currency).toBe("USD");

    expect(dataset.floors.length).toBeGreaterThan(0);
    expect(dataset.floors[0].name).toContain("Ground");

    expect(dataset.components.length).toBeGreaterThan(0);
    expect(dataset.components[0].serialNumber).toMatch(/^SN-/);
    expect(dataset.components[0].installationDate).toBeDefined();
  });
});

