// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, vi } from "vitest";
import { CameraSpeedController } from "../CameraSpeedController";

describe("CameraSpeedController — Dynamic Zoom Speed Engine", () => {
  let controller: CameraSpeedController;
  let mockWorld: any;
  let mockControls: any;

  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }

    mockControls = {
      dollySpeed: 1.0,
      zoomSpeed: 1.0,
      distance: 25,
      dolly: vi.fn().mockResolvedValue(undefined),
      zoom: vi.fn().mockResolvedValue(undefined),
      camera: {
        isOrthographicCamera: false,
        zoom: 1
      }
    };

    mockWorld = {
      camera: {
        controls: mockControls
      }
    };

    controller = CameraSpeedController.getInstance();
    controller.init(mockWorld);
  });

  it("should initialize with default speed 1.0x", () => {
    controller.resetSpeed(false);
    expect(controller.getSpeed()).toBe(1.0);
    expect(mockControls.dollySpeed).toBe(1.0);
    expect(mockControls.zoomSpeed).toBe(1.0);
  });

  it("should clamp speed between MIN_SPEED (0.1) and MAX_SPEED (5.0)", () => {
    controller.setSpeed(0.01, false);
    expect(controller.getSpeed()).toBe(0.1);

    controller.setSpeed(10.0, false);
    expect(controller.getSpeed()).toBe(5.0);
  });

  it("should increase and decrease speed progressively", () => {
    controller.setSpeed(0.2, false);
    
    // In precision tier (<0.5), step is 0.1
    controller.increaseSpeed(undefined, false);
    expect(controller.getSpeed()).toBe(0.3);

    // In normal tier (0.5 to 2.0), step is 0.2
    controller.setSpeed(1.0, false);
    controller.increaseSpeed(undefined, false);
    expect(controller.getSpeed()).toBe(1.2);

    controller.decreaseSpeed(undefined, false);
    expect(controller.getSpeed()).toBe(1.0);

    // In turbo tier (>2.0), step is 0.5
    controller.setSpeed(3.0, false);
    controller.increaseSpeed(undefined, false);
    expect(controller.getSpeed()).toBe(3.5);

    controller.decreaseSpeed(undefined, false);
    expect(controller.getSpeed()).toBe(3.0);
  });

  it("should return human-friendly speed tier labels", () => {
    expect(controller.getSpeedLabel(0.2)).toBe("Ultra Fine");
    expect(controller.getSpeedLabel(0.5)).toBe("Precision");
    expect(controller.getSpeedLabel(1.0)).toBe("Standard");
    expect(controller.getSpeedLabel(2.0)).toBe("Fast");
    expect(controller.getSpeedLabel(4.0)).toBe("Turbo / GIS");
  });

  it("should persist speed to localStorage", () => {
    controller.setSpeed(2.5, false);
    expect(localStorage.getItem(CameraSpeedController.STORAGE_KEY)).toBe("2.5");
  });

  it("should execute smooth dolly when zoomIn and zoomOut are called in perspective", async () => {
    controller.setSpeed(1.0, false);
    await controller.zoomIn(0.2);
    expect(mockControls.dolly).toHaveBeenCalledWith(5.0, true);

    await controller.zoomOut(0.2);
    expect(mockControls.dolly).toHaveBeenCalledWith(-5.0, true);
  });

  it("should execute smooth zoom when zoomIn and zoomOut are called in orthographic", async () => {
    mockControls.camera.isOrthographicCamera = true;
    mockControls.camera.zoom = 2;
    controller.setSpeed(1.0, false);

    await controller.zoomIn(0.2);
    expect(mockControls.zoom).toHaveBeenCalledWith(0.4, true);

    await controller.zoomOut(0.2);
    expect(mockControls.zoom).toHaveBeenCalledWith(-0.4, true);
  });

  it("should dispatch camera-speed-changed custom event on window", () => {
    const eventSpy = vi.fn();
    window.addEventListener("camera-speed-changed", eventSpy);

    controller.setSpeed(1.8, false);
    expect(eventSpy).toHaveBeenCalledTimes(1);
    expect(eventSpy.mock.calls[0][0].detail.speed).toBe(1.8);

    window.removeEventListener("camera-speed-changed", eventSpy);
  });
});
