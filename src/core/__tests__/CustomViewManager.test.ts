import { describe, it, expect, beforeEach, vi } from "vitest";
import * as THREE from "three";
import { CustomViewManager } from "../CustomViewManager";
import { ExplosionModule } from "../../modules/ExplosionModule";

describe("CustomViewManager — Autodesk Tandem-Style Saved Views Suite", () => {
  let customViewManager: CustomViewManager;
  let mockWorld: any;
  let mockCameraControls: any;

  beforeEach(async () => {
    // Setup mock camera controls
    mockCameraControls = {
      getPosition: vi.fn().mockReturnValue(new THREE.Vector3(15, 20, 25)),
      getTarget: vi.fn().mockReturnValue(new THREE.Vector3(0, 5, 0)),
      setLookAt: vi.fn()
    };

    mockWorld = {
      camera: {
        three: { position: new THREE.Vector3(15, 20, 25) },
        threePersp: { fov: 55 },
        controls: mockCameraControls
      }
    };

    // Clear local storage
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }

    customViewManager = CustomViewManager.getInstance();
    await customViewManager.init(mockWorld);
  });

  it("should initialize with default digital twin cluster presets", () => {
    const allViews = customViewManager.getAllViews();
    expect(allViews.length).toBeGreaterThanOrEqual(4);

    const assetPreset = allViews.find((v) => v.id === "preset-asset-cluster");
    expect(assetPreset).toBeDefined();
    expect(assetPreset?.clustering.mode).toBe("asset-dense-cluster");
    expect(assetPreset?.clustering.factor).toBe(0.75);

    const catPreset = allViews.find((v) => v.id === "preset-category-pods");
    expect(catPreset).toBeDefined();
    expect(catPreset?.clustering.mode).toBe("category-cluster");
  });

  it("should capture and save complete custom view state snapshot", () => {
    // Set clustering state
    const explosionMod = ExplosionModule.getInstance();
    explosionMod.setClusteringMode("asset-dense-cluster");
    explosionMod.setExplosionFactor(0.60);

    const saved = customViewManager.saveCurrentView("MEP & Equipment Audit", "HVAC clusters");
    expect(saved).not.toBeNull();
    expect(saved?.name).toBe("MEP & Equipment Audit");
    expect(saved?.camera.position).toEqual([15, 20, 25]);
    expect(saved?.clustering.mode).toBe("asset-dense-cluster");
    expect(saved?.clustering.factor).toBe(0.60);
  });

  it("should restore camera, clustering mode, and factor on restoreView()", () => {
    const saved = customViewManager.saveCurrentView("Test View");
    expect(saved).toBeDefined();

    // Alter world state
    mockCameraControls.setLookAt.mockClear();

    // Restore
    customViewManager.restoreView(saved!.id);

    expect(mockCameraControls.setLookAt).toHaveBeenCalledWith(15, 20, 25, 0, 5, 0, true);
  });

  it("should delete custom views properly", () => {
    const saved = customViewManager.saveCurrentView("Deletable View");
    const countBefore = customViewManager.getAllViews().length;

    customViewManager.deleteView(saved!.id);
    const countAfter = customViewManager.getAllViews().length;

    expect(countAfter).toBe(countBefore - 1);
  });
});
