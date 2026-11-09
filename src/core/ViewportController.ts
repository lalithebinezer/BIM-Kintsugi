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
    if (this.grid?.three) {
      this.grid.three.visible = false;
      if (this.grid.three.material) {
        this.grid.three.material.transparent = true;
        this.grid.three.material.depthWrite = false;
      }
    }
    if (this.grid?.config) {
      this.grid.config.visible = false;
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
    const gh = typeof window !== "undefined" ? (window as any).viewer_grid_helper : null;
    if (gh) {
      gh.visible = visible;
    }
    if (typeof document !== "undefined") {
      document.getElementById("btn-toggle-ground-grid")?.classList.toggle("active", visible);
      document.getElementById("btn-dock-toggle-grid")?.classList.toggle("active", visible);
      const st = document.getElementById("settings-toggle-grid") as HTMLInputElement | null;
      if (st) st.checked = visible;
    }
    if (typeof window !== "undefined") {
      (window as any).viewer_grid_visible = visible;
    }
  }

  public toggleGrid(): boolean {
    const gh = typeof window !== "undefined" ? (window as any).viewer_grid_helper : null;
    const current = gh ? gh.visible : true;
    const next = !current;
    this.setGridVisible(next);
    return next;
  }

  public setGridElevation(elevation: number) {
    if (this.grid && this.grid.three) {
      this.grid.three.position.y = elevation;
    }
    const gh = typeof window !== "undefined" ? (window as any).viewer_grid_helper : null;
    if (gh) {
      gh.position.y = elevation - 0.01;
    }
  }
}
