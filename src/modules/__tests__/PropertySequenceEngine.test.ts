import { describe, it, expect, beforeEach } from 'vitest';
import { PropertySequenceEngine } from '../PropertySequenceEngine';
import { ScheduleManager } from '../ScheduleManager';

describe('PropertySequenceEngine Unit Tests', () => {
  let engine: PropertySequenceEngine;
  let scheduleManager: ScheduleManager;

  // Mock model with various IFC elements, storeys, and attributes
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
        // Property sets definitions
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
        // Single property values
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
    engine = PropertySequenceEngine.getInstance();
    scheduleManager = new ScheduleManager();
  });

  it('should discover available sequence properties from loaded model', () => {
    const model = createMockModel();
    const props = engine.discoverAvailableProperties([model], mockStoreysMap);

    expect(props.length).toBeGreaterThanOrEqual(4);
    const keys = props.map(p => p.key);
    expect(keys).toContain("Storey");
    expect(keys).toContain("Category");
    expect(keys).toContain("PredefinedType");
    expect(keys).toContain("Phase");

    const phaseProp = props.find(p => p.key === "Phase");
    expect(phaseProp).toBeDefined();
    expect(phaseProp?.count).toBe(5);
  });

  it('should calculate construction sequence grouped by Storey / Vertical Elevation', () => {
    const model = createMockModel();
    const result = engine.calculateSequence(
      [model],
      {
        propertyKey: "Storey",
        startDate: "2026-07-01",
        taskDurationDays: 14,
        overlapDays: 4
      },
      { globalStoreysMap: mockStoreysMap }
    );

    expect(result.totalElements).toBe(5);
    expect(result.totalTasks).toBe(4); // Foundation Level, Ground Floor, Level 1, Roof
    expect(result.tasks[0].propertyValue).toBe("Foundation Level");
    expect(result.tasks[0].startDate).toBe("2026-07-01");
    // 14 days duration: 2026-07-01 + 14 days = 2026-07-15
    expect(result.tasks[0].endDate).toBe("2026-07-15");

    // Next task starts with stepDays = 14 - 4 = 10 days -> 2026-07-11
    expect(result.tasks[1].startDate).toBe("2026-07-11");
    expect(result.tasks[1].propertyValue).toBe("Ground Floor");

    // Verify last task is Roof
    expect(result.tasks[3].propertyValue).toBe("Roof");
  });

  it('should calculate construction sequence grouped by Category / IFC Entity', () => {
    const model = createMockModel();
    const result = engine.calculateSequence(
      [model],
      {
        propertyKey: "Category",
        startDate: "2026-06-01",
        taskDurationDays: 10,
        overlapDays: 2
      }
    );

    expect(result.totalTasks).toBe(5);
    // Substructure (IFCFOOTING) comes before superstructure (IFCSLAB, IFCCOLUMN, IFCWALL) and IFCROOF
    const taskValues = result.tasks.map(t => t.propertyValue);
    expect(taskValues[0]).toBe("IFCFOOTING");
    expect(taskValues).toContain("IFCSLAB");
    expect(taskValues).toContain("IFCCOLUMN");
    expect(taskValues).toContain("IFCWALL");
    expect(taskValues[taskValues.length - 1]).toBe("IFCROOF");
  });

  it('should calculate sequence from custom user property (e.g. Phase)', () => {
    const model = createMockModel();
    const result = engine.calculateSequence(
      [model],
      {
        propertyKey: "Phase",
        startDate: "2026-08-01",
        taskDurationDays: 20,
        overlapDays: 5
      }
    );

    expect(result.totalTasks).toBe(3);
    expect(result.tasks[0].propertyValue).toBe("Phase 1 - Substructure");
    expect(result.tasks[1].propertyValue).toBe("Phase 2 - Core");
    expect(result.tasks[2].propertyValue).toBe("Phase 3 - Enclosure");
    expect(result.tasks[0].elementCount).toBe(2); // 101, 102
    expect(result.tasks[1].elementCount).toBe(2); // 103, 104
    expect(result.tasks[2].elementCount).toBe(1); // 105
  });

  it('should resolve and calculate sequence by picked text property inside a Pset (e.g. TradePackage)', () => {
    const model = createMockModel();
    
    // Picked by simple prop name "TradePackage"
    const result = engine.calculateSequence(
      [model],
      {
        propertyKey: "TradePackage",
        startDate: "2026-09-01",
        taskDurationDays: 12,
        overlapDays: 3
      }
    );

    expect(result.totalTasks).toBe(3);
    const taskVals = result.tasks.map(t => t.propertyValue);
    expect(taskVals).toContain("Civil & Substructure");
    expect(taskVals).toContain("Structural Frame");
    expect(taskVals).toContain("Envelope & Enclosure");

    // Also pick by qualified name "Pset_Construction.Contractor"
    const resultQualified = engine.calculateSequence(
      [model],
      {
        propertyKey: "Pset_Construction.Contractor",
        startDate: "2026-09-01",
        taskDurationDays: 10
      }
    );
    expect(resultQualified.totalTasks).toBe(3);
    const contractors = resultQualified.tasks.map(t => t.propertyValue);
    expect(contractors).toContain("Apex Earthworks");
    expect(contractors).toContain("Titan Concrete");
    expect(contractors).toContain("Skyline Roofing");
  });

  it('should apply sequence directly to twinDatabase and ScheduleManager', () => {
    const model = createMockModel();
    const result = engine.calculateSequence(
      [model],
      {
        propertyKey: "Storey",
        startDate: "2026-06-18",
        taskDurationDays: 10,
        overlapDays: 3
      },
      { globalStoreysMap: mockStoreysMap }
    );

    const mockTwinDb: Record<string, any> = {};
    const applyStats = engine.applySequenceToTwinDatabase(result, mockTwinDb, scheduleManager);

    expect(applyStats.updatedElements).toBe(5);
    expect(applyStats.updatedTasks).toBe(4);

    // Verify twinDatabase entries
    expect(mockTwinDb["model-1-101"]).toBeDefined();
    expect(mockTwinDb["model-1-101"].startDate).toBe("2026-06-18");
    expect(mockTwinDb["model-1-101"].task).toContain("Foundation Level");

    // Verify scheduleManager tasks
    expect(scheduleManager.tasks.size).toBe(4);
    const sortedTasks = scheduleManager.getTasksSorted();
    expect(sortedTasks[0].startDate).toBe("2026-06-18");
  });

  it('should support reverse sorting direction', () => {
    const model = createMockModel();
    const result = engine.calculateSequence(
      [model],
      {
        propertyKey: "Storey",
        sortDirection: "desc",
        startDate: "2026-09-01"
      },
      { globalStoreysMap: mockStoreysMap }
    );

    expect(result.tasks[0].propertyValue).toBe("Roof");
    expect(result.tasks[result.tasks.length - 1].propertyValue).toBe("Foundation Level");
  });
});
