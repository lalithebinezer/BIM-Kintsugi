import * as OBC from "@thatopen/components";
import { BimEngine } from "./BimEngine";

export class ViewportController {
  private engine: BimEngine;
  public grid: any;

  constructor() {
    this.engine = BimEngine.getInstance();
    this.setupGrid();
  }

  private setupGrid() {
    const grids = this.engine.components.get(OBC.Grids);
    try {
      this.grid = grids.create(this.engine.world);
    } catch (e) {
      // Grid already created for world
      this.grid = (grids as any).list?.values()?.next()?.value;
    }
  }

  public setCameraMode(mode: "Orbit" | "FirstPerson" | "Plan") {
    if (this.engine.world.camera) {
      const cam = this.engine.world.camera as OBC.OrthoPerspectiveCamera;
      const camAny = cam as any;
      if (!camAny._navigationModes.has(mode)) {
        camAny._navigationModes.set("Orbit", new OBC.OrbitMode(cam));
        camAny._navigationModes.set("FirstPerson", new OBC.FirstPersonMode(cam));
        camAny._navigationModes.set("Plan", new OBC.PlanMode(cam));
        camAny._mode = camAny._navigationModes.get("Orbit");
      }
      cam.set(mode as any);
      if (typeof document !== "undefined") {
        const select = document.getElementById("settings-camera-mode") as HTMLSelectElement | null;
        if (select && select.value !== mode) {
          select.value = mode;
        }
      }
    }
  }

  public setGridVisible(visible: boolean) {
    if (this.grid && this.grid.config) {
      this.grid.config.visible = visible;
    }
  }

  public setGridElevation(elevation: number) {
    if (this.grid && this.grid.three) {
      this.grid.three.position.y = elevation;
    }
  }
}
