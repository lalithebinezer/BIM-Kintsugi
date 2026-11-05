import { describe, it, expect, beforeEach } from 'vitest';
import { IfcParameterReader } from '../IfcParameterReader';
import { ScheduleManager } from '../ScheduleManager';

describe('IfcParameterReader Unit Tests', () => {
  let reader: IfcParameterReader;
  let scheduleManager: ScheduleManager;

  const createMockModel = (modelId: string = "model-1") => {
    return {
      modelId,
      properties: {
        101: {
          type: "IFCFOOTING",
          Name: { value: "Footing F1" },
          PredefinedType: "PAD_FOOTING",
          Phase: "Phase 1 - Substructure",
          HasPropertySets: [201]
        },
        102: {
          type: "IFCSLAB",
          Name: { value: "Slab Ground" },
          PredefinedType: "FLOOR",
          Phase: "Phase 1 - Substructure",
          HasPropertySets: [201]
        },
        103: {
          type: "IFCCOLUMN",
          Name: { value: "Column C1" },
          PredefinedType: "COLUMN",
          Phase: "Phase 2 - Core",
          HasPropertySets: [202]
        },
        104: {
          type: "IFCWALL",
          Name: { value: "Wall Exterior" },
          PredefinedType: "SOLIDWALL",
          Phase: "Phase 2 - Core",
          HasPropertySets: [202]
        },
        105: {
          type: "IFCROOF",
          Name: { value: "Main Roof" },
          PredefinedType: "ROOF",
          Phase: "Phase 3 - Enclosure",
          HasPropertySets: [203]
        },
        201: {
          type: "IFCPROPERTYSET",
          Name: { value: "Pset_Construction" },
          HasProperties: [301, 302]
        },
        202: {
          type: "IFCPROPERTYSET",
          Name: { value: "Pset_Construction" },
          HasProperties: [303, 304]
        },
        203: {
          type: "IFCPROPERTYSET",
          Name: { value: "Pset_Construction" },
          HasProperties: [305, 306]
        },
        301: { type: "IFCPROPERTYSINGLEVALUE", Name: { value: "TradePackage" }, NominalValue: { value: "Civil & Substructure" } },
        302: { type: "IFCPROPERTYSINGLEVALUE", Name: { value: "Contractor" }, NominalValue: { value: "Apex Earthworks" } },
        303: { type: "IFCPROPERTYSINGLEVALUE", Name: { value: "TradePackage" }, NominalValue: { value: "Structural Frame" } },
        304: { type: "IFCPROPERTYSINGLEVALUE", Name: { value: "Contractor" }, NominalValue: { value: "Titan Concrete" } },
        305: { type: "IFCPROPERTYSINGLEVALUE", Name: { value: "TradePackage" }, NominalValue: { value: "Envelope & Enclosure" } },
        306: { type: "IFCPROPERTYSINGLEVALUE", Name: { value: "Contractor" }, NominalValue: { value: "Skyline Roofing" } }
      }
    };
  };

  const mockStoreysMap = {
    "model-1-101": "Foundation Level",
    "model-1-102": "Ground Floor",
    "model-1-103": "Level 1",
    "model-1-104": "Level 1",
    "model-1-105": "Roof"
  };

  beforeEach(() => {
    reader = IfcParameterReader.getInstance();
    scheduleManager = new ScheduleManager();
  });

  it('should scan and index all parameters and property sets from models', () => {
    const model = createMockModel();
    const params = reader.scanModelParameters([model], mockStoreysMap);

    expect(params.length).toBeGreaterThanOrEqual(5);

    const keys = params.map(p => p.key);
    expect(keys).toContain("Storey");
    expect(keys).toContain("Category");
    expect(keys).toContain("PredefinedType");
    expect(keys).toContain("Phase");
    expect(keys).toContain("Pset_Construction.TradePackage");
    expect(keys).toContain("Pset_Construction.Contractor");

    const phaseParam = params.find(p => p.key === "Phase");
    expect(phaseParam).toBeDefined();
    expect(phaseParam?.distinctCount).toBe(3);
    expect(phaseParam?.elementCount).toBe(5);
    expect(phaseParam?.coveragePercent).toBe(100);
    expect(phaseParam?.isRecommended).toBe(true);
  });

  it('should identify recommended 4D candidates with valid reasons', () => {
    const model = createMockModel();
    const params = reader.scanModelParameters([model], mockStoreysMap);

    const recommended = params.filter(p => p.isRecommended);
    expect(recommended.length).toBeGreaterThan(0);

    const storeyParam = recommended.find(p => p.key === "Storey");
    expect(storeyParam).toBeDefined();
    expect(storeyParam?.recommendReason).toContain("vertical");
  });

  it('should generate a 4D construction sequence from chosen parameter', () => {
    const model = createMockModel();
    reader.setCallbacks({
      getModels: () => [model],
      getStoreysMap: () => mockStoreysMap
    });

    const twinDb: Record<string, any> = {};
    const result = reader.generateSequenceFromParameter(
      "Phase",
      {
        startDate: "2026-06-18",
        taskDurationDays: 14,
        overlapDays: 4
      },
      twinDb,
      scheduleManager
    );

    expect(result.totalTasks).toBe(3);
    expect(result.totalElements).toBe(5);
    expect(result.tasks[0].propertyValue).toBe("Phase 1 - Substructure");
    expect(result.tasks[1].propertyValue).toBe("Phase 2 - Core");
    expect(result.tasks[2].propertyValue).toBe("Phase 3 - Enclosure");

    // Verify ScheduleManager was populated
    expect(scheduleManager.tasks.size).toBe(3);
  });

  it('should generate sequence from a Pset parameter (e.g. Pset_Construction.TradePackage)', () => {
    const model = createMockModel();
    reader.setCallbacks({
      getModels: () => [model],
      getStoreysMap: () => mockStoreysMap
    });

    const twinDb: Record<string, any> = {};
    const result = reader.generateSequenceFromParameter(
      "Pset_Construction.TradePackage",
      {
        startDate: "2026-07-01",
        taskDurationDays: 10
      },
      twinDb,
      scheduleManager
    );

    expect(result.totalTasks).toBe(3);
    const names = result.tasks.map(t => t.propertyValue);
    expect(names).toContain("Civil & Substructure");
    expect(names).toContain("Structural Frame");
    expect(names).toContain("Envelope & Enclosure");
  });
});
