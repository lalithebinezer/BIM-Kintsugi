import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import CameraControls from "camera-controls";

export class BimEngine {
  private static instance: BimEngine;

  public components: OBC.Components;
  public world: OBC.World;
  public container: HTMLElement;
  public fragments: OBC.FragmentsManager;
  public highlighter: OBF.Highlighter;
  public clipper: OBC.Clipper;
  public finder: OBC.ItemsFinder;
  public hider: OBC.Hider;

  private constructor(existingComponents?: OBC.Components, existingWorld?: OBC.World) {
    if (typeof document !== "undefined") {
      this.container = document.getElementById("container") || document.createElement("div");
    } else {
      this.container = {} as HTMLElement;
    }

    this.components = existingComponents || new OBC.Components();
    const worlds = this.components.get(OBC.Worlds);

    this.world = existingWorld || worlds.create<
      OBC.ShadowedScene,
      OBC.OrthoPerspectiveCamera,
      OBF.PostproductionRenderer
    >();

    if (!existingWorld && typeof document !== "undefined") {
      const scene = new OBC.ShadowedScene(this.components);
      this.world.scene = scene;

      try {
        this.world.renderer = new OBF.PostproductionRenderer(this.components, this.container);
        this.world.renderer.three.shadowMap.enabled = true;
        this.world.renderer.three.shadowMap.type = THREE.PCFShadowMap;
        (this.world.renderer as any).showLogo = false;
      } catch (e) {
        // Ignored in headless test environments without WebGL context
      }

      try {
        this.world.camera = new OBC.OrthoPerspectiveCamera(this.components);
        this.world.camera.currentWorld = this.world;
        if (this.world.camera.controls) {
          const controls = this.world.camera.controls as any;
          controls.enabled = true;
          controls.dollyToCursor = true;
          controls.dollySpeed = 1.2;
          controls.zoomSpeed = 1.2;
          if (controls.mouseButtons) {
            controls.mouseButtons.left = CameraControls.ACTION.ROTATE;
            controls.mouseButtons.right = CameraControls.ACTION.TRUCK;
            controls.mouseButtons.middle = CameraControls.ACTION.DOLLY;
            controls.mouseButtons.wheel = CameraControls.ACTION.DOLLY;
          }
          if (controls.touches) {
            controls.touches.one = CameraControls.ACTION.TOUCH_ROTATE;
            controls.touches.two = CameraControls.ACTION.TOUCH_DOLLY_TRUCK;
          }
        }
        try {
          (this.world.camera as any)?.set?.("Orbit");
        } catch (e) {}
      } catch (e) {
        // Headless test environment camera fallback
      }

      try {
        scene.setup();
        scene.three.background = null;
      } catch (e) {}

      try {
        this.components.init();
      } catch (e) {}
    }

    // Initialize core components
    this.fragments = this.components.get(OBC.FragmentsManager);
    this.highlighter = this.components.get(OBF.Highlighter);
    this.clipper = this.components.get(OBC.Clipper);
    this.finder = this.components.get(OBC.ItemsFinder);
    this.hider = this.components.get(OBC.Hider);

    this.setupListeners();
  }

  public static getInstance(components?: OBC.Components, world?: OBC.World): BimEngine {
    if (!BimEngine.instance) {
      BimEngine.instance = new BimEngine(components, world);
    }
    return BimEngine.instance;
  }

  private setupListeners() {
    if (this.world && this.world.onCameraChanged) {
      this.world.onCameraChanged.add((camera: any) => {
        for (const [, model] of this.fragments.list) {
          if (model && typeof model.useCamera === "function") {
            model.useCamera(camera.three);
          }
        }
      });
    }
  }
}
