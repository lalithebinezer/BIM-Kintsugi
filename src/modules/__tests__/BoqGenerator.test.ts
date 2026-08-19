import { describe, it, expect } from "vitest";
import { generateBOQSummary, extractQuantityData, type BOQLineItem } from "../BoqGenerator";

describe("BOQ Generator Unit Tests", () => {
  it("should extract quantity data from Qto property sets", () => {
    const elementProps = { Name: "Concrete Slab 200mm" };
    const propertySets = {
      Qto_SlabBaseQuantities: {
        NetVolume: { value: 12.5 },
      },
    };

    const data = extractQuantityData(elementProps, propertySets);
    expect(data.quantity).toBe(12.5);
    expect(data.quantityType).toBe("NetVolume");
    expect(data.unit).toBe("m³");
    expect(data.propertySetName).toBe("Qto_SlabBaseQuantities");
  });

  it("should generate category summaries and total cost correctly", () => {
    const items: BOQLineItem[] = [
      {
        expressId: 101,
        modelId: "m1",
        category: "IFCSLAB",
        elementName: "Floor Slab",
        materialNumber: "MAT-C30",
        unit: "m³",
        quantity: 10,
        unitCost: 120,
        totalCost: 1200,
        propertySetName: "Qto_SlabBaseQuantities",
        quantityType: "NetVolume",
      },
      {
        expressId: 102,
        modelId: "m1",
        category: "IFCSLAB",
        elementName: "Balcony Slab",
        materialNumber: "MAT-C30",
        unit: "m³",
        quantity: 4,
        unitCost: 120,
        totalCost: 480,
        propertySetName: "Qto_SlabBaseQuantities",
        quantityType: "NetVolume",
      },
      {
        expressId: 201,
        modelId: "m1",
        category: "IFCWALL",
        elementName: "Exterior Wall",
        materialNumber: "MAT-BRICK",
        unit: "m²",
        quantity: 50,
        unitCost: 40,
        totalCost: 2000,
        propertySetName: "Qto_WallBaseQuantities",
        quantityType: "NetArea",
      },
    ];

    const summary = generateBOQSummary(items);
    expect(summary.totalElements).toBe(3);
    expect(summary.totalCost).toBe(1200 + 480 + 2000); // 3680

    const slabCategory = summary.categorySummary.get("IFCSLAB");
    expect(slabCategory?.count).toBe(2);
    expect(slabCategory?.totalCost).toBe(1680);

    const wallCategory = summary.categorySummary.get("IFCWALL");
    expect(wallCategory?.count).toBe(1);
    expect(wallCategory?.totalCost).toBe(2000);
  });
});
