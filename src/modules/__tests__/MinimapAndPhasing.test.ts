// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { MinimapModule } from "../MinimapModule";
import { PhasingTimelineModule } from "../PhasingTimelineModule";

describe("Minimap & 4D Phasing Modules", () => {
  describe("MinimapModule", () => {
    let minimap: MinimapModule;

    beforeEach(() => {
      minimap = MinimapModule.getInstance();
    });

    it("should initialize with default config", () => {
      const config = minimap.getConfig();
      expect(config.size).toBe(180);
      expect(config.zoom).toBe(8);
      expect(config.levels.length).toBe(4);
      expect(config.isWalkModeActive).toBe(false);
    });

    it("should correctly convert world coordinates to minimap pixels", () => {
      const pixel = minimap.worldToMinimap(0, 0);
      expect(pixel.x).toBe(90);
      expect(pixel.y).toBe(90);

      const offsetPixel = minimap.worldToMinimap(5, -5);
      expect(offsetPixel.x).toBe(90 + 5 * 8);
      expect(offsetPixel.y).toBe(90 - 5 * 8);
    });

    it("should correctly convert minimap pixels back to world coordinates", () => {
      const worldPos = minimap.minimapToWorld(90, 90);
      expect(worldPos.x).toBe(0);
      expect(worldPos.z).toBe(0);
    });

    it("should toggle walk mode state", () => {
      expect(minimap.toggleWalkMode(true)).toBe(true);
      expect(minimap.getConfig().isWalkModeActive).toBe(true);
      expect(minimap.toggleWalkMode(false)).toBe(false);
    });

    it("should update floor levels", () => {
      minimap.setLevel(1);
      expect(minimap.getConfig().currentLevelIndex).toBe(1);
      minimap.setLevel(3);
      expect(minimap.getConfig().currentLevelIndex).toBe(3);
    });

    it("should zoom in, zoom out and reset view", () => {
      const initialZoom = minimap.getConfig().zoom;
      minimap.zoomIn();
      expect(minimap.getConfig().zoom).toBeGreaterThan(initialZoom);
      minimap.zoomOut();
      minimap.zoomOut();
      expect(minimap.getConfig().zoom).toBeLessThan(initialZoom);
      minimap.resetView();
      expect(minimap.getConfig().zoom).toBe(8);
    });

    it("should toggle auto-track level, clash pins and expanded size", () => {
      expect(minimap.toggleAutoTrackLevel(false)).toBe(false);
      expect(minimap.toggleAutoTrackLevel(true)).toBe(true);

      expect(minimap.toggleClashPins(false)).toBe(false);
      expect(minimap.toggleClashPins(true)).toBe(true);

      expect(minimap.toggleExpanded(true)).toBe(true);
      expect(minimap.getConfig().size).toBe(280);
      expect(minimap.toggleExpanded(false)).toBe(false);
      expect(minimap.getConfig().size).toBe(180);
    });

    it("should set and clear selected element position", () => {
      minimap.setSelectedElement({ x: 10, y: 3.5, z: -15 }, 999);
      // Verify no throw and correct state
      minimap.setSelectedElement(null);
    });

    it("should manage camera synchronization state", () => {
      expect(minimap.isCameraSyncEnabled()).toBe(true);
      minimap.setAutoSyncCamera(false);
      expect(minimap.isCameraSyncEnabled()).toBe(false);
      minimap.resetView();
      expect(minimap.isCameraSyncEnabled()).toBe(true);
    });

    it("should accurately compute canvas orientation angles matching world coordinates", () => {
      // +X is East (0 rad), +Z is South (+PI/2 rad), -X is West (PI rad), -Z is North (-PI/2 rad)
      const forwardNorth = { x: 0, z: -1 };
      const forwardSouth = { x: 0, z: 1 };
      const forwardEast = { x: 1, z: 0 };
      const forwardWest = { x: -1, z: 0 };

      expect(Math.atan2(forwardNorth.z, forwardNorth.x)).toBeCloseTo(-Math.PI / 2);
      expect(Math.atan2(forwardSouth.z, forwardSouth.x)).toBeCloseTo(Math.PI / 2);
      expect(Math.atan2(forwardEast.z, forwardEast.x)).toBeCloseTo(0);
      expect(Math.atan2(forwardWest.z, forwardWest.x)).toBeCloseTo(Math.PI);
    });
  });

  describe("PhasingTimelineModule", () => {
    let timeline: PhasingTimelineModule;

    beforeEach(() => {
      timeline = PhasingTimelineModule.getInstance();
      timeline.reset();
    });

    it("should initialize with 52 weeks and 5 construction phases", () => {
      const state = timeline.getState();
      expect(state.currentWeek).toBe(1);
      expect(state.totalWeeks).toBe(52);
      expect(state.isPlaying).toBe(false);
      expect(timeline.getPhases().length).toBe(5);
    });

    it("should set and clamp week numbers properly", () => {
      timeline.setWeek(25);
      expect(timeline.getState().currentWeek).toBe(25);

      timeline.setWeek(100);
      expect(timeline.getState().currentWeek).toBe(52);

      timeline.setWeek(-10);
      expect(timeline.getState().currentWeek).toBe(1);
    });

    it("should step forward and backward correctly", () => {
      timeline.setWeek(10);
      timeline.stepForward();
      expect(timeline.getState().currentWeek).toBe(11);

      timeline.stepBackward();
      expect(timeline.getState().currentWeek).toBe(10);
    });

    it("should return the correct active construction phase by week", () => {
      timeline.setWeek(5);
      expect(timeline.getActivePhase()?.name).toBe("Substructure & Foundation");

      timeline.setWeek(15);
      expect(timeline.getActivePhase()?.name).toBe("Structural Superstructure");

      timeline.setWeek(30);
      expect(timeline.getActivePhase()?.name).toBe("Envelope & Facade");

      timeline.setWeek(40);
      expect(timeline.getActivePhase()?.name).toBe("MEP & Building Services");

      timeline.setWeek(50);
      expect(timeline.getActivePhase()?.name).toBe("Interior Fitout & Handover");
    });

    it("should update playback speed", () => {
      timeline.setSpeed(5);
      expect(timeline.getState().playbackSpeed).toBe(5);
    });

    it("should toggle play and pause states", () => {
      expect(timeline.togglePlayPause()).toBe(true);
      expect(timeline.getState().isPlaying).toBe(true);

      expect(timeline.togglePlayPause()).toBe(false);
      expect(timeline.getState().isPlaying).toBe(false);
    });
  });

  describe("InteractiveGanttDrawer & Seekbar Playhead", () => {
    it("should initialize Gantt Drawer with seekbar and playhead elements", async () => {
      const { InteractiveGanttDrawer } = await import("../../ui/InteractiveGanttDrawer");
      const drawer = InteractiveGanttDrawer.getInstance();
      drawer.init("test-gantt-panel");

      const panel = document.getElementById("test-gantt-panel");
      expect(panel).not.toBeNull();
      expect(panel?.querySelector("#gantt-seekbar-slider")).not.toBeNull();
      expect(panel?.querySelector("#gantt-playhead-marker")).not.toBeNull();
      expect(panel?.querySelector("#gantt-playhead-line")).not.toBeNull();
      expect(panel?.querySelector("#btn-gantt-play-toggle")).not.toBeNull();
      expect(panel?.querySelector("#gantt-current-date-badge")).not.toBeNull();
    });

    it("should update playback state on the Gantt play toggle button", async () => {
      const { InteractiveGanttDrawer } = await import("../../ui/InteractiveGanttDrawer");
      const drawer = InteractiveGanttDrawer.getInstance();
      drawer.init("test-gantt-panel");

      drawer.updatePlaybackState(true);
      const playBtn = document.getElementById("btn-gantt-play-toggle");
      expect(playBtn?.classList.contains("playing")).toBe(true);
      expect(document.getElementById("gantt-play-text")?.textContent).toBe("Pause");

      drawer.updatePlaybackState(false);
      expect(playBtn?.classList.contains("playing")).toBe(false);
      expect(document.getElementById("gantt-play-text")?.textContent).toBe("Play");
    });
  });
});
