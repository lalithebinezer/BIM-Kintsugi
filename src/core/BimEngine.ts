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
  public outliner?: OBF.Outliner;
  public hoverer?: OBF.Hoverer;
  public marker?: OBF.Marker;
  public clipStyler?: OBF.ClipStyler;
  public views?: OBC.Views;
  public viewpoints?: OBC.Viewpoints;
  public classifier?: OBC.Classifier;
  public bcfTopics?: OBC.BCFTopics;
  public idsSpecs?: OBC.IDSSpecifications;
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

    this.initThatOpenExtensions();
    this.setupListeners();
  }

  public static getInstance(components?: OBC.Components, world?: OBC.World): BimEngine {
    if (!BimEngine.instance) {
      BimEngine.instance = new BimEngine(components, world);
    } else if (components && world && BimEngine.instance.world !== world) {
      BimEngine.instance.components = components;
      BimEngine.instance.world = world;
      BimEngine.instance.fragments = components.get(OBC.FragmentsManager);
      BimEngine.instance.highlighter = components.get(OBF.Highlighter);
      BimEngine.instance.clipper = components.get(OBC.Clipper);
      BimEngine.instance.finder = components.get(OBC.ItemsFinder);
      BimEngine.instance.hider = components.get(OBC.Hider);
      BimEngine.instance.initThatOpenExtensions();
      BimEngine.instance.setupListeners();
    }
    return BimEngine.instance;
  }

  private initThatOpenExtensions() {
    try {
      this.views = this.components.get(OBC.Views);
      if (this.views && this.world) {
        this.views.world = this.world;
      }
    } catch (e) {}

    try {
      this.bcfTopics = this.components.get(OBC.BCFTopics);
      this.idsSpecs = this.components.get(OBC.IDSSpecifications);
      this.viewpoints = this.components.get(OBC.Viewpoints);
      this.classifier = this.components.get(OBC.Classifier);
      if (this.viewpoints && this.world) {
        this.viewpoints.world = this.world;
      }
    } catch (e) {}

    try {
      this.hoverer = this.components.get(OBF.Hoverer);
      if (this.hoverer && this.world) {
        this.hoverer.world = this.world;
        this.hoverer.enabled = true;
        this.hoverer.mode = OBF.HovererMode.MOUSE_MOVE;
        this.hoverer.fade = true;
        this.hoverer.fadeDuration = 120;
        this.hoverer.material = new THREE.MeshBasicMaterial({
          color: 0xd4ff3f,
          transparent: true,
          opacity: 0.32,
          depthTest: false,
        });
      }
    } catch (e) {}

    try {
      this.marker = this.components.get(OBF.Marker);
      if (this.marker) {
        this.marker.enabled = true;
        this.marker.autoCluster = true;
        this.marker.threshold = 45;
      }
    } catch (e) {}

    try {
      this.clipStyler = this.components.get(OBF.ClipStyler);
      if (this.clipStyler && this.world) {
        this.clipStyler.world = this.world;
        this.clipStyler.enabled = true;
      }
    } catch (e) {}

    try {
      this.outliner = this.components.get(OBF.Outliner);
      if (this.outliner && this.world) {
        this.outliner.world = this.world;
        this.outliner.enabled = true;
        this.outliner.color = new THREE.Color(0x00d2ff);
        this.outliner.fillColor = new THREE.Color(0x00d2ff);
        this.outliner.fillOpacity = 0.18;
        this.outliner.thickness = 2.0;

        if (this.outliner.styles && typeof this.outliner.styles.add === "function") {
          this.outliner.styles.add("select");
        } else if (typeof this.outliner.bindStyle === "function") {
          this.outliner.bindStyle("select");
        }

        // Also configure a hover outline group if supported
        if (typeof this.outliner.create === "function") {
          this.outliner.create("hover", {
            color: new THREE.Color(0xd4ff3f),
            fillColor: new THREE.Color(0xd4ff3f),
            fillOpacity: 0.08,
            thickness: 1.2,
          });
          if (typeof this.outliner.bindStyle === "function") {
            this.outliner.bindStyle("hover", "hover");
          }
        }
      }
    } catch (e) {
      // Safe fallback in headless test environments without WebGL
    }
  }

  public syncOutlinerTheme(selectColorHex: string, hoverColorHex?: string) {
    try {
      if (this.hoverer && hoverColorHex) {
        this.hoverer.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(hoverColorHex),
          transparent: true,
          opacity: 0.32,
          depthTest: false,
        });
      }
      if (!this.outliner) return;
      const selectColor = new THREE.Color(selectColorHex);
      this.outliner.color = selectColor;
      this.outliner.fillColor = selectColor;
      if (hoverColorHex && typeof this.outliner.configure === "function") {
        const hoverColor = new THREE.Color(hoverColorHex);
        this.outliner.configure("hover", {
          color: hoverColor,
          fillColor: hoverColor,
          fillOpacity: 0.08,
          thickness: 1.2,
        });
      }
    } catch (e) {}
  }

  /**
   * Uses ThatOpen OBC.Classifier to index loaded models by IFC Category and Spatial Storey.
   */
  public async classifyModelByStoreyAndCategory(): Promise<{
    categories: string[];
    storeys: string[];
  }> {
    const categories = new Set<string>();
    const storeys = new Set<string>();

    try {
      if (this.classifier) {
        if (typeof (this.classifier as any).byCategory === "function") {
          await (this.classifier as any).byCategory();
        }
        if (typeof (this.classifier as any).byIfcRel === "function") {
          await (this.classifier as any).byIfcRel();
        }
        const list = (this.classifier as any).list;
        if (list instanceof Map) {
          for (const [groupName, groupMap] of list) {
            if (groupMap instanceof Map) {
              for (const [itemName] of groupMap) {
                if (String(groupName).toLowerCase().includes("storey") || String(groupName).toLowerCase().includes("spatial")) {
                  storeys.add(String(itemName));
                } else {
                  categories.add(String(itemName));
                }
              }
            }
          }
        }
      }
    } catch (e) {}

    // Fallback scan across loaded fragment properties
    try {
      if (this.fragments && (this.fragments as any).list) {
        for (const [, model] of (this.fragments as any).list) {
          const props = (model as any)?.properties;
          if (!props) continue;
          for (const idStr in props) {
            const p = props[idStr];
            if (!p) continue;
            const cat = String(p.type || p._category || p.typeStr || "").toUpperCase();
            if (cat.includes("BUILDINGSTOREY")) {
              storeys.add(p.Name?.value || p.name || `Storey #${idStr}`);
            } else if (cat) {
              categories.add(cat);
            }
          }
        }
      }
    } catch (e) {}

    return {
      categories: Array.from(categories),
      storeys: Array.from(storeys),
    };
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
