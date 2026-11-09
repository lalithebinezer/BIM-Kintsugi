import { describe, it, expect, beforeEach } from "vitest";
import * as THREE from "three";
import {
  AppearanceProfileEngine,
  PRESET_APPEARANCE_PROFILES,
  type TaskLike,
} from "../AppearanceProfileEngine";

describe("AppearanceProfileEngine Suite", () => {
  let engine: AppearanceProfileEngine;

  beforeEach(() => {
    engine = new AppearanceProfileEngine();
  });

  describe("1. Schema & Preset Profiles", () => {
    it("should have all 4 preset appearance profiles registered", () => {
      const presets = engine.getAllProfiles();
      expect(presets.length).toBeGreaterThanOrEqual(4);

      const install = engine.getProfile("Install_BottomUp");
      expect(install.name).toBe("Install - Bottom to Top");
      expect(install.type).toBe("INSTALL");
      expect(install.growthDirection).toBe("BOTTOM_TOP");
      expect(install.startAppearance.visible).toBe(false);
      expect(install.activeAppearance.visible).toBe(true);
      expect(install.endAppearance.visible).toBe(true);

      const remove = engine.getProfile("Remove_TopDown");
      expect(remove.name).toBe("Demolish - Top to Bottom");
      expect(remove.type).toBe("REMOVE");
      expect(remove.growthDirection).toBe("TOP_BOTTOM");
      expect(remove.startAppearance.visible).toBe(true);
      expect(remove.activeAppearance.visible).toBe(true);
      expect(remove.endAppearance.visible).toBe(false);

      const temp = engine.getProfile("Temporary_Equipment");
      expect(temp.type).toBe("TEMPORARY");
      expect(temp.startAppearance.visible).toBe(false);
      expect(temp.activeAppearance.visible).toBe(true);
      expect(temp.endAppearance.visible).toBe(false);

      const maintain = engine.getProfile("Maintain_Highlight");
      expect(maintain.type).toBe("MAINTAIN");
      expect(maintain.groupMode).toBe("GROUP_BOUNDING_BOX");
      expect(maintain.startAppearance.visible).toBe(true);
      expect(maintain.activeAppearance.visible).toBe(true);
      expect(maintain.endAppearance.visible).toBe(true);
    });

    it("should correctly infer profile from task keywords", () => {
      expect(engine.inferProfileForTask({ id: "1", name: "Demolish Concrete Pier", startDate: "", endDate: "", elementIds: [] }).id).toBe("Remove_TopDown");
      expect(engine.inferProfileForTask({ id: "2", name: "Erect Temporary Tower Crane", startDate: "", endDate: "", elementIds: [] }).id).toBe("Temporary_Equipment");
      expect(engine.inferProfileForTask({ id: "3", name: "Annual Facility Inspection & Maintenance", startDate: "", endDate: "", elementIds: [] }).id).toBe("Maintain_Highlight");
      expect(engine.inferProfileForTask({ id: "4", name: "Cast In Place Slabs", startDate: "", endDate: "", elementIds: [] }).id).toBe("Install_BottomUp");
    });
  });

  describe("2. Growth Direction Vectors & Dynamic Clipping Planes", () => {
    const testBox = new THREE.Box3(new THREE.Vector3(-2, 0, -2), new THREE.Vector3(2, 10, 2));

    it("should resolve proper direction vectors", () => {
      expect(engine.getGrowthDirectionVector("BOTTOM_TOP")?.equals(new THREE.Vector3(0, 1, 0))).toBe(true);
      expect(engine.getGrowthDirectionVector("TOP_BOTTOM")?.equals(new THREE.Vector3(0, -1, 0))).toBe(true);
      expect(engine.getGrowthDirectionVector("LEFT_RIGHT")?.equals(new THREE.Vector3(1, 0, 0))).toBe(true);
      expect(engine.getGrowthDirectionVector("RIGHT_LEFT")?.equals(new THREE.Vector3(-1, 0, 0))).toBe(true);
      expect(engine.getGrowthDirectionVector("FRONT_BACK")?.equals(new THREE.Vector3(0, 0, 1))).toBe(true);
      expect(engine.getGrowthDirectionVector("BACK_FRONT")?.equals(new THREE.Vector3(0, 0, -1))).toBe(true);
      expect(engine.getGrowthDirectionVector("NONE")).toBeNull();

      const custom = engine.getGrowthDirectionVector("CUSTOM_VECTOR", { x: 3, y: 4, z: 0 });
      expect(custom?.x).toBeCloseTo(0.6);
      expect(custom?.y).toBeCloseTo(0.8);
    });

    it("should compute dynamic clipping plane for Install_BottomUp as progress t advances", () => {
      const profile = PRESET_APPEARANCE_PROFILES.Install_BottomUp;

      // At t = 0.0: plane is at the very bottom (Y = 0)
      const plane0 = engine.computeClippingPlane(testBox, profile, 0.0);
      expect(plane0).not.toBeNull();
      expect(plane0?.normal.equals(new THREE.Vector3(0, -1, 0))).toBe(true);
      expect(plane0?.constant).toBeCloseTo(0.0);

      // At t = 0.5: plane is halfway up (Y = 5.0)
      const planeMid = engine.computeClippingPlane(testBox, profile, 0.5);
      expect(planeMid).not.toBeNull();
      expect(planeMid?.normal.equals(new THREE.Vector3(0, -1, 0))).toBe(true);
      expect(planeMid?.constant).toBeCloseTo(5.0);

      // At t = 1.0: completed installation has NO clipping plane (zero overhead)
      const plane1 = engine.computeClippingPlane(testBox, profile, 1.0);
      expect(plane1).toBeNull();
    });

    it("should invert clipping plane direction for Remove_TopDown demolition profile", () => {
      const profile = PRESET_APPEARANCE_PROFILES.Remove_TopDown;

      // At t = 0.0: element is fully standing, keeping all points y <= 10
      const plane0 = engine.computeClippingPlane(testBox, profile, 0.0);
      expect(plane0).not.toBeNull();
      expect(plane0?.normal.equals(new THREE.Vector3(0, -1, 0))).toBe(true);
      expect(plane0?.constant).toBeCloseTo(10.0);

      // At t = 0.5: top half demolished, remaining bottom half up to Y = 5.0 is kept (y <= 5)
      const planeMid = engine.computeClippingPlane(testBox, profile, 0.5);
      expect(planeMid).not.toBeNull();
      expect(planeMid?.normal.equals(new THREE.Vector3(0, -1, 0))).toBe(true);
      expect(planeMid?.constant).toBeCloseTo(5.0);

      // At t = 1.0: fully demolished, no clipping plane needed as element is hidden
      const plane1 = engine.computeClippingPlane(testBox, profile, 1.0);
      expect(plane1).toBeNull();
    });

    it("should return null for profiles with growthDirection NONE", () => {
      const temp = PRESET_APPEARANCE_PROFILES.Temporary_Equipment;
      expect(engine.computeClippingPlane(testBox, temp, 0.5)).toBeNull();
    });
  });

  describe("3. Multi-Task Chronological Handling", () => {
    it("should chronologically evaluate an element linked to sequential tasks without resetting to invisible", () => {
      // Element 101: Task 1 (Install: Jan 1 → Jan 10) then Task 2 (Inspect: Feb 1 → Feb 10)
      const tasks: TaskLike[] = [
        {
          id: "task-install",
          name: "Install Superstructure Columns",
          startDate: "2027-01-01",
          endDate: "2027-01-10",
          elementIds: [101],
          appearanceProfileId: "Install_BottomUp",
        },
        {
          id: "task-inspect",
          name: "Ultrasonic Weld Inspection",
          startDate: "2027-02-01",
          endDate: "2027-02-10",
          elementIds: [101],
          appearanceProfileId: "Maintain_Highlight",
        },
      ];

      // Phase 1: Before Task 1 (Dec 25) -> Invisible
      const tDec25 = new Date("2026-12-25").getTime();
      const resBefore = engine.evaluateTimelineFrame(tDec25, tasks);
      const stateBefore = resBefore.elements.get("default-model:101");
      expect(stateBefore?.visible).toBe(false);
      expect(stateBefore?.clippingPlane).toBeNull();

      // Phase 2: During Task 1 (Jan 5) -> Active Install (progress 50%, sky blue, clipping plane active)
      const tJan5 = new Date("2027-01-05T12:00:00Z").getTime();
      const resDuring1 = engine.evaluateTimelineFrame(tJan5, tasks);
      const stateDuring1 = resDuring1.elements.get("default-model:101");
      expect(stateDuring1?.visible).toBe(true);
      expect(stateDuring1?.colorOverride).toBe("#38bdf8");
      expect(stateDuring1?.progress).toBeCloseTo(0.5, 1);
      expect(stateDuring1?.clippingPlane).not.toBeNull();

      // Phase 3: Between Task 1 & Task 2 (Jan 20) -> VISIBLE! (Retains Task 1 endAppearance, NOT reset to invisible!)
      const tJan20 = new Date("2027-01-20").getTime();
      const resBetween = engine.evaluateTimelineFrame(tJan20, tasks);
      const stateBetween = resBetween.elements.get("default-model:101");
      expect(stateBetween?.visible).toBe(true);
      expect(stateBetween?.progress).toBe(1.0);
      expect(stateBetween?.clippingPlane).toBeNull(); // Completed task has no active clipping plane

      // Phase 4: During Task 2 (Feb 5) -> Active Maintain (progress 50%, emerald green highlight)
      const tFeb5 = new Date("2027-02-05T12:00:00Z").getTime();
      const resDuring2 = engine.evaluateTimelineFrame(tFeb5, tasks);
      const stateDuring2 = resDuring2.elements.get("default-model:101");
      expect(stateDuring2?.visible).toBe(true);
      expect(stateDuring2?.colorOverride).toBe("#10b981");
      expect(stateDuring2?.activeTaskId).toBe("task-inspect");

      // Phase 5: After Task 2 (Feb 20) -> VISIBLE (Task 2 endAppearance)
      const tFeb20 = new Date("2027-02-20").getTime();
      const resAfter = engine.evaluateTimelineFrame(tFeb20, tasks);
      const stateAfter = resAfter.elements.get("default-model:101");
      expect(stateAfter?.visible).toBe(true);
      expect(stateAfter?.clippingPlane).toBeNull();
    });
  });

  describe("4. Group Bounding Box Mode", () => {
    it("should compute union bounding box across multiple elements when groupMode is GROUP_BOUNDING_BOX", () => {
      engine.setElementBoundingBox("model-1", 1, new THREE.Box3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 5, 2)));
      engine.setElementBoundingBox("model-1", 2, new THREE.Box3(new THREE.Vector3(10, 0, 10), new THREE.Vector3(12, 10, 12)));

      const task: TaskLike = {
        id: "task-group",
        name: "Steel Trusses",
        startDate: "2027-03-01",
        endDate: "2027-03-10",
        elementIds: [1, 2],
        modelId: "model-1",
        appearanceProfileId: "Maintain_Highlight",
      };

      const group = engine.getTaskGroupBoundingBox(task);
      expect(group.min.x).toBe(0);
      expect(group.min.z).toBe(0);
      expect(group.max.x).toBe(12);
      expect(group.max.y).toBe(10);
      expect(group.max.z).toBe(12);
    });
  });

  describe("5. Timeline Evaluation Frame Loop & Buckets", () => {
    it("should produce valid visible and hidden buckets for renderer / hider per frame", () => {
      const tasks: TaskLike[] = [
        {
          id: "t1",
          name: "Installed Elements",
          startDate: "2027-01-01",
          endDate: "2027-01-10",
          elementIds: [101, 102],
          appearanceProfileId: "Install_BottomUp",
        },
        {
          id: "t2",
          name: "Future Elements",
          startDate: "2027-02-01",
          endDate: "2027-02-10",
          elementIds: [201],
          appearanceProfileId: "Install_BottomUp",
        },
      ];

      const tMidJan = new Date("2027-01-15").getTime();
      const result = engine.evaluateTimelineFrame(tMidJan, tasks);

      expect(result.visibleCount).toBe(2); // 101, 102 installed
      expect(result.hiddenCount).toBe(1);  // 201 not started yet
      expect(result.buckets.visible["default-model"].has(101)).toBe(true);
      expect(result.buckets.visible["default-model"].has(102)).toBe(true);
      expect(result.buckets.hidden["default-model"].has(201)).toBe(true);
    });
  });
});
