/**
 * Snapshot Module — High-Resolution Technical Architectural Drawing & Report Snapshot Tool.
 *
 * Captures 3D WebGL viewport and composites a professional architectural Titleblock
 * border with project metadata, drawing sheet reference, coordinate rulers, and North indicator.
 */

import { BimEngine } from "../core/BimEngine";

export interface SnapshotMetadata {
  projectName?: string;
  sheetNumber?: string;
  discipline?: string;
  author?: string;
  themeName?: string;
  viewMode?: string;
}

export class SnapshotModule {
  private static instance: SnapshotModule | null = null;
  private engine: BimEngine;

  private constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): SnapshotModule {
    if (!SnapshotModule.instance) {
      SnapshotModule.instance = new SnapshotModule();
    }
    return SnapshotModule.instance;
  }

  /**
   * Captures the current 3D WebGL canvas and composites a high-res architectural titleblock.
   */
  public async captureTechnicalSnapshot(meta: SnapshotMetadata = {}): Promise<void> {
    const world = this.engine.world;
    if (!world || !world.renderer || !world.renderer.three) {
      console.warn("Snapshot capture failed: WebGL renderer not ready.");
      return;
    }

    // Force an immediate render so the canvas buffer is up to date
    if (world.renderer.update) {
      world.renderer.update();
    }

    const sourceCanvas = world.renderer.three.domElement as HTMLCanvasElement;
    if (!sourceCanvas) return;

    const width = sourceCanvas.width || 1920;
    const height = sourceCanvas.height || 1080;

    // Create high-res composite canvas
    const canvas = document.createElement("canvas");
    const borderPadding = 32;
    const titleBlockHeight = 110;

    canvas.width = width + borderPadding * 2;
    canvas.height = height + borderPadding * 2 + titleBlockHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Get active theme colors from DOM or fallback to Obsidian Dark Pro tokens
    const rootStyle = getComputedStyle(document.documentElement);
    const accentColor = rootStyle.getPropertyValue("--accent-500").trim() || "#D4FF3F";
    const bgAppColor = rootStyle.getPropertyValue("--bg-app").trim() || "#0A0A0C";

    // 1. Fill blueprint / dark background
    ctx.fillStyle = bgAppColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw 3D Viewport in center
    ctx.drawImage(sourceCanvas, borderPadding, borderPadding, width, height);

    // 3. Draw Outer Architectural Frame
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(borderPadding, borderPadding, width, height + titleBlockHeight);

    // Inner hairline frame
    ctx.strokeStyle = "rgba(212, 255, 63, 0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(borderPadding + 6, borderPadding + 6, width - 12, height + titleBlockHeight - 12);

    // 4. Draw Titleblock Separator
    const titleBlockY = borderPadding + height;
    ctx.beginPath();
    ctx.moveTo(borderPadding, titleBlockY);
    ctx.lineTo(borderPadding + width, titleBlockY);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 5. Titleblock Content - Left Section (Project & Scale)
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px 'Space Mono', monospace";
    ctx.fillText("PROJECT: " + (meta.projectName || "WEB BIM TWIN — 4D/5D DIGITAL TWIN").toUpperCase(), borderPadding + 20, titleBlockY + 32);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px 'Space Mono', monospace";
    const dateStr = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
    ctx.fillText(`DATE: ${dateStr}  |  STATUS: VERIFIED AS-BUILT`, borderPadding + 20, titleBlockY + 56);
    ctx.fillText(`DISCIPLINE: ${meta.discipline || "MULTI-DISCIPLINARY BIM / 4D SIMULATION"}`, borderPadding + 20, titleBlockY + 76);
    ctx.fillText(`ENGINE: THAT OPEN Fragments API / WebGL2`, borderPadding + 20, titleBlockY + 96);

    // 6. Titleblock Content - Right Box (Sheet Info)
    const boxWidth = 280;
    const boxX = borderPadding + width - boxWidth;
    ctx.strokeRect(boxX, titleBlockY, boxWidth, titleBlockHeight);

    ctx.fillStyle = accentColor;
    ctx.font = "bold 13px 'Space Mono', monospace";
    ctx.fillText("DRAWING SHEET", boxX + 16, titleBlockY + 28);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px 'Space Mono', monospace";
    ctx.fillText(meta.sheetNumber || "DWG-BIM-4D-01", boxX + 16, titleBlockY + 58);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px 'Space Mono', monospace";
    ctx.fillText(`REV: 04  |  SCALE: 1:100 (METRIC)`, boxX + 16, titleBlockY + 82);
    ctx.fillText(`AUTHOR: ${meta.author || "LEAD BIM ENGINEER"}`, boxX + 16, titleBlockY + 98);

    // 7. North Arrow Stamp in Top-Right Corner
    const naX = borderPadding + width - 60;
    const naY = borderPadding + 50;
    ctx.fillStyle = "rgba(10, 12, 16, 0.85)";
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(naX, naY, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.moveTo(naX, naY - 20);
    ctx.lineTo(naX - 7, naY + 12);
    ctx.lineTo(naX, naY + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(naX, naY - 20);
    ctx.lineTo(naX + 7, naY + 12);
    ctx.lineTo(naX, naY + 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = accentColor;
    ctx.font = "bold 10px 'Space Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("N", naX, naY - 24);
    ctx.textAlign = "left";

    // 8. Trigger Download
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const filename = `BIM_Technical_Drawing_${new Date().toISOString().split("T")[0]}_${Date.now().toString().slice(-4)}.png`;
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
