import { describe, it, expect, beforeEach, vi } from "vitest";
import { ScheduleImportParsers } from "../ScheduleImportParsers";
import type { ScheduleTask } from "../ScheduleManager";
import { PropertySequenceEngine } from "../PropertySequenceEngine";
import { ModelManager } from "../../core/ModelManager";
import * as THREE from "three";

describe("Enterprise Schedule Interchange & Multi-Tier WBS CPM Suite", () => {
  let sampleTasks: ScheduleTask[];

  beforeEach(() => {
    sampleTasks = [
      {
        id: "task-01",
        name: "Substructure & Piles",
        category: "IFCFOOTING",
        startDate: "2026-06-01",
        endDate: "2026-06-15",
        status: "Completed",
        elementIds: new Set([101, 102, 103]),
        modelId: "model-1",
        unitCost: 1500,
        quantity: 3,
        wbsCode: "1.1",
        isCritical: true,
        totalFloat: 0
      },
      {
        id: "task-02",
        name: "Ground Floor Columns & Slabs",
        category: "IFCCOLUMN",
        startDate: "2026-06-12",
        endDate: "2026-06-28",
        status: "In Progress",
        elementIds: new Set([201, 202]),
        modelId: "model-1",
        unitCost: 800,
        quantity: 2,
        wbsCode: "1.2",
        isCritical: true,
        totalFloat: 0
      },
      {
        id: "task-03",
        name: "External Brickwork & Façade",
        category: "IFCWALL",
        startDate: "2026-06-25",
        endDate: "2026-07-15",
        status: "Planned",
        elementIds: new Set([301, 302, 303, 304]),
        modelId: "model-1",
        unitCost: 450,
        quantity: 4,
        wbsCode: "2.1",
        isCritical: false,
        totalFloat: 5
      }
    ];
  });

  describe("1. Microsoft Project XML (MSPDI) Exporter", () => {
    it("should export tasks to valid MSPDI XML with schema headers", () => {
      const xml = ScheduleImportParsers.exportToMSPDI(sampleTasks, "Snowdon Towers Phase 1");

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
      expect(xml).toContain('<Project xmlns="http://schemas.microsoft.com/project">');
      expect(xml).toContain('<Name>Snowdon Towers Phase 1</Name>');
      expect(xml).toContain('<StartDate>2026-06-01T08:00:00</StartDate>');
      expect(xml).toContain('<FinishDate>2026-07-15T17:00:00</FinishDate>');
      expect(xml).toContain('<Tasks>');
      expect(xml).toContain('</Tasks>');
      expect(xml).toContain('<Calendars>');
      expect(xml).toContain('<Name>Standard 5 Day Workweek</Name>');
      expect(xml).toContain('<Resources>');
      expect(xml).toContain('<Assignments>');
      expect(xml).toContain('<ExtendedAttributes>');
      expect(xml).toContain('<Alias>IFC Category</Alias>');
      expect(xml).toContain('<Alias>WBS Code</Alias>');
      expect(xml).toContain('<PredecessorLink>');
      expect(xml).toContain('<OutlineNumber>1.1</OutlineNumber>');
      expect(xml).toContain('<WBS>1.1</WBS>');
    });

    it("should escape special characters in task names and compute duration in hours", () => {
      const specialTask: ScheduleTask = {
        id: "task-spec",
        name: "MEP & HVAC <Chilled Beams> \"Level 1\"",
        category: "IFCFLOWSEGMENT",
        startDate: "2026-08-01",
        endDate: "2026-08-11", // 10 days = 80 hours
        status: "Planned",
        elementIds: new Set([999]),
        modelId: "m1",
        unitCost: 500,
        quantity: 1
      };

      const xml = ScheduleImportParsers.exportToMSPDI([specialTask]);

      expect(xml).toContain("&amp;");
      expect(xml).toContain("&lt;Chilled Beams&gt;");
      expect(xml).toContain("&quot;Level 1&quot;");
      expect(xml).toContain("<Duration>PT80H0M0S</Duration>");
      expect(xml).toContain("<PercentComplete>0</PercentComplete>");
    });
  });

  describe("2. Oracle Primavera P6 XER Exporter", () => {
    it("should export tasks to valid Primavera P6 tab-delimited format with ERMHDR and tables", () => {
      const xer = ScheduleImportParsers.exportToPrimaveraP6(sampleTasks, "Project Delta");

      expect(xer).toContain("ERMHDR\t");
      expect(xer).toContain("%T\tPROJECT\n");
      expect(xer).toContain("%F\tproj_id\tproj_short_name\tclndr_id\tplan_start_date\tplan_end_date\n");
      expect(xer).toContain("%R\t1\tProject Delta\t1\t2026-06-01 08:00\t2026-07-15 17:00\n");
      expect(xer).toContain("%T\tCALENDAR\n");
      expect(xer).toContain("%T\tTASK\n");
      expect(xer).toContain("TK-001\tSubstructure & Piles\tTK_Complete");
      expect(xer).toContain("TK-002\tGround Floor Columns & Slabs\tTK_Active");
      expect(xer).toContain("TK-003\tExternal Brickwork & Façade\tTK_NotStart");
      expect(xer.trim().endsWith("%E")).toBe(true);
    });
  });

  describe("3. Multi-Tier WBS & CPM Float Engine", () => {
    it("should calculate hierarchical multi-tier WBS sequence (Storey > Category)", () => {
      const engine = PropertySequenceEngine.getInstance();

      const mockModel = {
        modelId: "test-model-4d",
        properties: {
          1: { type: "IFCWALL", Storey: "Level 1" },
          2: { type: "IFCCOLUMN", Storey: "Level 1" },
          3: { type: "IFCSLAB", Storey: "Level 1" },
          4: { type: "IFCWALL", Storey: "Level 2" },
          5: { type: "IFCCOLUMN", Storey: "Level 2" },
          6: { type: "IFCFOOTING", Storey: "Basement" }
        }
      };

      const result = engine.calculateSequence([mockModel], {
        propertyKey: "Storey > Category",
        startDate: "2026-06-01",
        taskDurationDays: 10,
        overlapDays: 2,
        enableCPM: true
      });

      expect(result.totalElements).toBe(6);
      expect(result.totalTasks).toBeGreaterThan(0);
      expect(result.propertyKey).toBe("Storey > Category");

      // Verify hierarchical WBS codes (e.g. 1.1, 2.1, 2.2...)
      const wbsCodes = result.tasks.map(t => t.wbsCode);
      expect(wbsCodes).toContain("1.1");
      expect(wbsCodes.some(c => c?.startsWith("2."))).toBe(true);

      // Verify that Basement tasks are sequenced first before Level 1 and Level 2
      const firstTask = result.tasks[0];
      expect(firstTask.name).toContain("Basement");

      // Verify CPM fields are populated
      expect(firstTask.earlyStart).toBe("2026-06-01");
      expect(typeof firstTask.totalFloat).toBe("number");
      expect(typeof firstTask.isCritical).toBe("boolean");
      expect(result.criticalTaskCount).toBeGreaterThan(0);
    });

    it("should compute correct CPM floats and mark critical path tasks", () => {
      const engine = PropertySequenceEngine.getInstance();

      const mockModel = {
        modelId: "cpm-model",
        properties: {
          10: { type: "IFCCOLUMN", Storey: "Level 0" },
          20: { type: "IFCSLAB", Storey: "Level 1" },
          30: { type: "IFCROOF", Storey: "Roof" }
        }
      };

      const result = engine.calculateSequence([mockModel], {
        propertyKey: "Storey",
        startDate: "2026-06-01",
        taskDurationDays: 8,
        overlapDays: 2,
        enableCPM: true
      });

      expect(result.tasks.length).toBe(3);
      // In a linear schedule with sequential dependencies, all tasks lie on the critical path
      result.tasks.forEach(t => {
        expect(t.totalFloat).toBe(0);
        expect(t.isCritical).toBe(true);
      });
      expect(result.criticalTaskCount).toBe(3);
    });
  });

  describe("4. GPU VRAM Memory Disposal", () => {
    it("should safely dispose model geometry and materials without error", () => {
      const modelMgr = ModelManager.getInstance();

      // Mock THREE.Mesh
      const geomDispose = vi.fn();
      const matDispose = vi.fn();
      const mockMesh = new THREE.Mesh();
      mockMesh.geometry = { dispose: geomDispose } as any;
      mockMesh.material = { dispose: matDispose } as any;

      const mockParent = new THREE.Group();
      mockParent.add(mockMesh);

      const mockModel = {
        object: mockParent,
        dispose: vi.fn()
      };

      expect(() => modelMgr.disposeModel(mockModel)).not.toThrow();
      expect(geomDispose).toHaveBeenCalled();
      expect(matDispose).toHaveBeenCalled();
      expect(mockModel.dispose).toHaveBeenCalled();
    });
  });
});
