// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { CostRateManager, SUPPORTED_CURRENCIES } from "../CostRateManager";

describe("CostRateManager & Multi-Currency Engine", () => {
  let manager: CostRateManager;

  beforeEach(() => {
    localStorage.clear();
    manager = CostRateManager.getInstance();
    manager.resetToDefaults();
  });

  it("should initialize with default currencies and USD active", () => {
    expect(manager.getCurrency().code).toBe("USD");
    expect(manager.getCurrency().symbol).toBe("$");
    expect(SUPPORTED_CURRENCIES.EUR.symbol).toBe("€");
    expect(SUPPORTED_CURRENCIES.GBP.symbol).toBe("£");
    expect(SUPPORTED_CURRENCIES.INR.symbol).toBe("₹");
    expect(SUPPORTED_CURRENCIES.AED.symbol).toBe("AED ");
    expect(SUPPORTED_CURRENCIES.SAR.symbol).toBe("SAR ");
  });

  it("should switch currency and format prices accurately", () => {
    manager.setCurrency("EUR");
    expect(manager.getCurrency().code).toBe("EUR");
    expect(manager.formatPrice(1500)).toBe("€1,500.00");

    manager.setCurrency("INR");
    expect(manager.formatPrice(250000)).toBe("₹250,000.00");

    manager.setCurrency("AED");
    expect(manager.formatPrice(4500)).toBe("AED 4,500.00");
  });

  it("should retrieve category unit rates and measurement units correctly", () => {
    const colRate = manager.getRate("IFCCOLUMN");
    expect(colRate.unit).toBe("m³");
    expect(colRate.unitRate).toBe(620);
    expect(colRate.trade).toBe("Concrete");

    const wallRate = manager.getRate("IFCWALL");
    expect(wallRate.unit).toBe("m²");
    expect(wallRate.unitRate).toBe(140);

    const doorRate = manager.getRate("IFCDOOR");
    expect(doorRate.unit).toBe("ea");
    expect(doorRate.unitRate).toBe(420);
  });

  it("should allow editing rates and saving to persistent state", () => {
    manager.updateRate("IFCWALL", 185, "m²");
    expect(manager.getRate("IFCWALL").unitRate).toBe(185);

    // Verify persistence across reload
    const reloaded = CostRateManager.getInstance();
    expect(reloaded.getRate("IFCWALL").unitRate).toBe(185);
  });

  it("should resolve real volume and area multipliers based on rate unit", () => {
    // Volume test (m³)
    const volResult = manager.resolveQuantityForElement("IFCCOLUMN", { volume: 4.85 });
    expect(volResult.unit).toBe("m³");
    expect(volResult.quantity).toBe(4.85);

    // Area test (m²)
    const areaResult = manager.resolveQuantityForElement("IFCWALL", { area: 24.5 });
    expect(areaResult.unit).toBe("m²");
    expect(areaResult.quantity).toBe(24.5);

    // Length test (m)
    const lenResult = manager.resolveQuantityForElement("IFCFLOWSEGMENT", { length: 12.0 });
    expect(lenResult.unit).toBe("m");
    expect(lenResult.quantity).toBe(12.0);

    // Count test (ea)
    const countResult = manager.resolveQuantityForElement("IFCDOOR", { count: 3 });
    expect(countResult.unit).toBe("ea");
    expect(countResult.quantity).toBe(3);
  });

  it("should render modal DOM without errors", () => {
    manager.openCostRateModal();
    const modal = document.getElementById("cost-rate-table-modal");
    expect(modal).not.toBeNull();
    expect(modal?.classList.contains("hidden")).toBe(false);

    manager.closeCostRateModal();
    expect(modal?.classList.contains("hidden")).toBe(true);
  });
});
