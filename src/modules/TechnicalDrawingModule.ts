import * as THREE from "three";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { BimEngine } from "../core/BimEngine";

export type DrawingViewPreset = "top" | "front" | "back" | "left" | "right";

export interface ProjectionOptions {
  categoryPattern?: RegExp;
  includeHidden?: boolean;
  onProgress?: (message: string, progress?: number) => void;
}

const VIEW_DIRECTION_MAP: Record<DrawingViewPreset, THREE.Vector3> = {
  top: new THREE.Vector3(0, -1, 0),
  front: new THREE.Vector3(0, 0, -1),
  back: new THREE.Vector3(0, 0, 1),
  left: new THREE.Vector3(-1, 0, 0),
  right: new THREE.Vector3(1, 0, 0),
};

/**
 * Vector 2D Technical Drawing, Edge Projection & CAD DXF Export Manager.
 * Wraps `@thatopen/components` `EdgeProjector`, `TechnicalDrawings`, `DxfManager`,
 * and `@thatopen/components-front` `DrawingEditor` (`LinearAnnotationsTool`).
 */
export class TechnicalDrawingModule {
  private static instance: TechnicalDrawingModule | null = null;
  private engine: BimEngine;
  private edgeProjector: OBC.EdgeProjector;
  private drawings: OBC.TechnicalDrawings;
  private dxfManager: OBC.DxfManager;
  private editor: OBF.DrawingEditor;
  private activeDrawing: OBC.TechnicalDrawing | null = null;
  private visibleLines: THREE.LineSegments | null = null;
  private hiddenLines: THREE.LineSegments | null = null;
  private showHiddenLines: boolean = false;
  private annotationToolActive: boolean = false;
  private fontLoaded: boolean = false;
  private abortController: AbortController | null = null;
  private lastView: DrawingViewPreset = "top";
  private lastSegmentCount: number = 0;

  private canvasClickHandler = () => {
    if (this.annotationToolActive && this.activeDrawing) {
      this.editor.step();
    }
  };

  private keydownHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape" && this.annotationToolActive) {
      this.editor.cancel();
    }
  };

  private constructor() {
    this.engine = BimEngine.getInstance();
    const { components } = this.engine;
    this.edgeProjector = components.get(OBC.EdgeProjector);
    this.drawings = components.get(OBC.TechnicalDrawings);
    this.dxfManager = components.get(OBC.DxfManager);
    this.editor = components.get(OBF.DrawingEditor);
  }

  public static getInstance(): TechnicalDrawingModule {
    if (!TechnicalDrawingModule.instance) {
      TechnicalDrawingModule.instance = new TechnicalDrawingModule();
    }
    return TechnicalDrawingModule.instance;
  }

  public isAnnotationToolActive(): boolean {
    return this.annotationToolActive;
  }

  public getLastSegmentCount(): number {
    return this.lastSegmentCount;
  }

  public getLastView(): DrawingViewPreset {
    return this.lastView;
  }

  private ensureDrawing(view: DrawingViewPreset): OBC.TechnicalDrawing {
    const world = this.engine.world;
    if (!this.activeDrawing && world) {
      this.activeDrawing = this.drawings.create(world);
    }
    if (!this.activeDrawing) {
      throw new Error("World not initialized before creating TechnicalDrawing");
    }
    this.activeDrawing.orientTo(VIEW_DIRECTION_MAP[view]);
    this.activeDrawing.three.updateMatrixWorld(true);
    return this.activeDrawing;
  }

  private async collectModelIdMap(categoryPattern?: RegExp): Promise<OBC.ModelIdMap> {
    const map: OBC.ModelIdMap = {};
    if (!this.engine.fragments?.initialized) return map;
    for (const [modelId, model] of this.engine.fragments.list) {
      if (categoryPattern) {
        const byCat = await model.getItemsOfCategories([categoryPattern]);
        const ids = Object.values(byCat).flat();
        if (ids.length > 0) map[modelId] = new Set(ids);
      } else {
        const ids = await model.getItemsIdsWithGeometry();
        if (ids.length > 0) map[modelId] = new Set(ids);
      }
    }
    return map;
  }

  /**
   * Projects 3D BIM models along an orthographic direction into clean 2D visible/hidden
   * line geometry anchored inside an `OBC.TechnicalDrawing` container ready for annotation & DXF export.
   */
  public async projectView(
    view: DrawingViewPreset = "top",
    options: ProjectionOptions = {}
  ): Promise<{ visibleSegments: number; hiddenSegments: number }> {
    const world = this.engine.world;
    if (!world) {
      return { visibleSegments: 0, hiddenSegments: 0 };
    }

    this.abortController?.abort();
    this.abortController = new AbortController();
    this.clearProjectionLines();

    const dir = VIEW_DIRECTION_MAP[view].clone();
    this.lastView = view;
    this.edgeProjector.projectionDirection.copy(dir);
    this.edgeProjector.nearPlane = -Infinity;
    this.edgeProjector.farPlane = Infinity;

    const modelIdMap = await this.collectModelIdMap(options.categoryPattern);
    if (Object.keys(modelIdMap).length === 0) {
      return { visibleSegments: 0, hiddenSegments: 0 };
    }

    const result = await this.edgeProjector.get(modelIdMap, world, {
      onProgress: options.onProgress,
      signal: this.abortController.signal,
    });

    const drawing = this.ensureDrawing(view);

    // Transform world-space projected segments into drawing-local XZ space
    const boxer = this.engine.components.get(OBC.BoundingBoxer);
    boxer.list.clear();
    boxer.addFromModels();
    const modelBox = boxer.get();
    boxer.list.clear();
    const depthAxis = dir.clone().negate();
    const offsetDist = !modelBox.isEmpty()
      ? modelBox.max.clone().sub(modelBox.min).length() * 0.55 + 1.5
      : 10;
    const center = !modelBox.isEmpty() ? modelBox.getCenter(new THREE.Vector3()) : new THREE.Vector3();
    drawing.three.position.copy(center).addScaledVector(depthAxis, offsetDist);
    drawing.three.updateMatrixWorld(true);
    const invDrawingMatrix = drawing.three.matrixWorld.clone().invert();

    const visibleGeo = result.visible;
    visibleGeo.applyMatrix4(invDrawingMatrix);
    const hiddenGeo = result.hidden;
    hiddenGeo.applyMatrix4(invDrawingMatrix);

    if (!drawing.layers.has("projection")) {
      drawing.layers.create("projection", {
        material: new THREE.LineBasicMaterial({ color: 0x38bdf8 }),
      });
    }
    if (!drawing.layers.has("hidden")) {
      drawing.layers.create("hidden", {
        material: new THREE.LineBasicMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.35,
        }),
      });
    }

    this.visibleLines = new THREE.LineSegments(visibleGeo);
    drawing.addProjectionLines(this.visibleLines, "projection");

    this.hiddenLines = new THREE.LineSegments(hiddenGeo);
    this.showHiddenLines = Boolean(options.includeHidden);
    this.hiddenLines.visible = this.showHiddenLines;
    drawing.addProjectionLines(this.hiddenLines, "hidden");

    const visCount = Math.floor((visibleGeo.getAttribute("position")?.count || 0) / 2);
    const hidCount = Math.floor((hiddenGeo.getAttribute("position")?.count || 0) / 2);
    this.lastSegmentCount = visCount;

    return { visibleSegments: visCount, hiddenSegments: hidCount };
  }

  public setHiddenLinesVisible(visible: boolean) {
    this.showHiddenLines = visible;
    if (this.hiddenLines) {
      this.hiddenLines.visible = visible;
    }
  }

  /**
   * Toggles interactive `DrawingEditor` linear CAD dimension placement over the active drawing.
   */
  public async toggleDimensionTool(enable?: boolean): Promise<boolean> {
    const target = enable !== undefined ? enable : !this.annotationToolActive;
    const world = this.engine.world;
    const canvas = world?.renderer?.three?.domElement;

    if (target) {
      const drawing = this.ensureDrawing(this.lastView);
      if (!this.fontLoaded) {
        try {
          await this.editor.fonts.load(
            "https://thatopen.github.io/engine_components/resources/fonts/PlusJakartaSans-Medium.ttf"
          );
          this.fontLoaded = true;
        } catch {
          // Graceful offline fallback: lines & DXF dimensions still work without web font
        }
      }
      this.editor.activeDrawing = drawing;
      if (world) this.editor.setSource(world);
      this.editor.activeTool = OBF.LinearAnnotationsTool;
      this.editor.enabled = true;

      if (canvas) {
        canvas.removeEventListener("click", this.canvasClickHandler);
        canvas.addEventListener("click", this.canvasClickHandler);
      }
      document.removeEventListener("keydown", this.keydownHandler);
      document.addEventListener("keydown", this.keydownHandler);
      this.annotationToolActive = true;
    } else {
      this.editor.cancel();
      this.editor.activeTool = null;
      if (canvas) {
        canvas.removeEventListener("click", this.canvasClickHandler);
      }
      document.removeEventListener("keydown", this.keydownHandler);
      this.annotationToolActive = false;
    }
    return this.annotationToolActive;
  }

  /**
   * Serializes the active TechnicalDrawing (projection lines + vector CAD dimensions) to AC1015 DXF.
   */
  public exportDxf(): string {
    const drawing = this.activeDrawing;
    if (!drawing) {
      throw new Error("Generate a 2D projection before exporting DXF");
    }
    this.dxfManager.exporter.config.trueColor = true;
    return this.dxfManager.exporter.export([{ drawing, viewports: [{}] }]);
  }

  public downloadDxf(filename: string = `BIM_Kintsugi_${this.lastView}_projection.dxf`): string {
    const dxfContent = this.exportDxf();
    const blob = new Blob([dxfContent], { type: "application/dxf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return dxfContent;
  }

  public clearProjectionLines() {
    if (this.visibleLines) {
      this.visibleLines.removeFromParent();
      this.visibleLines.geometry.dispose();
      this.visibleLines = null;
    }
    if (this.hiddenLines) {
      this.hiddenLines.removeFromParent();
      this.hiddenLines.geometry.dispose();
      this.hiddenLines = null;
    }
    this.lastSegmentCount = 0;
  }

  public dispose() {
    this.abortController?.abort();
    void this.toggleDimensionTool(false);
    this.clearProjectionLines();
    if (this.activeDrawing) {
      this.drawings.list.delete(this.activeDrawing.uuid);
      this.activeDrawing = null;
    }
  }
}
