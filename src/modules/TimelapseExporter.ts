/**
 * TimelapseExporter — 4D Construction WebM Video Recorder with Composited HUD Overlay
 *
 * Captures the live 3D WebGL canvas + draws a clean broadcast-style HUD banner
 * (Simulated Date, Active Task / Level, Completion %, Progress Bar) onto an offscreen
 * 2D compositing canvas, then records it via MediaRecorder as a downloadable `.webm`.
 */

export interface TimelapseHudState {
  dateLabel: string;
  activeTaskLabel: string;
  progressPct: number;
  projectTitle?: string;
}

export interface TimelapseExportOptions {
  sourceCanvas: HTMLCanvasElement;
  totalSteps: number;
  durationSeconds?: number;
  fps?: number;
  filename?: string;
  onStep: (stepIndex: number, progressRatio: number) => Promise<TimelapseHudState>;
  onProgress?: (frameIndex: number, totalFrames: number) => void;
  signal?: AbortSignal;
}

export interface TimelapseExportResult {
  blob: Blob;
  filename: string;
  framesRecorded: number;
  mimeType: string;
}

export function selectSupportedVideoMimeType(): string {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return "video/webm";
  }
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return "video/webm";
}

export function drawTimelapseHudOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hud: TimelapseHudState
): void {
  const pad = 20;
  const cardW = Math.min(440, Math.max(280, Math.round(width * 0.34)));
  const cardH = 92;
  const x = pad;
  const y = height - cardH - pad;

  ctx.save();
  // Translucent dark glass backdrop
  ctx.fillStyle = "rgba(12, 14, 20, 0.82)";
  ctx.strokeStyle = "rgba(212, 255, 63, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, cardW, cardH, 10);
  } else {
    ctx.rect(x, y, cardW, cardH);
  }
  ctx.fill();
  ctx.stroke();

  // Top row: Date badge + % complete
  ctx.font = "700 15px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#d4ff3f";
  ctx.fillText(hud.dateLabel, x + 14, y + 26);

  const pctText = `${Math.max(0, Math.min(100, Math.round(hud.progressPct)))}% Complete`;
  ctx.font = "700 13px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#e2e8f0";
  const pctWidth = ctx.measureText(pctText).width;
  ctx.fillText(pctText, x + cardW - pctWidth - 14, y + 26);

  // Middle row: Active task label (truncated cleanly)
  ctx.font = "500 12px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "#cbd5e1";
  const maxLabelChars = Math.floor((cardW - 28) / 6.8);
  const taskText =
    hud.activeTaskLabel.length > maxLabelChars
      ? hud.activeTaskLabel.slice(0, Math.max(8, maxLabelChars - 1)) + "…"
      : hud.activeTaskLabel;
  ctx.fillText(taskText || "4D Construction Simulation", x + 14, y + 48);

  // Bottom row: Progress bar
  const barX = x + 14;
  const barY = y + 62;
  const barW = cardW - 28;
  const barH = 8;
  ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
  ctx.fillRect(barX, barY, barW, barH);

  const fillW = Math.round((Math.max(0, Math.min(100, hud.progressPct)) / 100) * barW);
  ctx.fillStyle = "#d4ff3f";
  ctx.fillRect(barX, barY, fillW, barH);

  // Subtle top-right watermark
  const watermark = hud.projectTitle || "BIM Kintsugi 4D";
  ctx.font = "600 12px 'Inter', system-ui, sans-serif";
  ctx.fillStyle = "rgba(255, 255, 255, 0.65)";
  const wmW = ctx.measureText(watermark).width;
  ctx.fillText(watermark, width - wmW - pad, pad + 14);
  ctx.restore();
}

export async function export4DTimelapseVideo(
  options: TimelapseExportOptions
): Promise<TimelapseExportResult> {
  const {
    sourceCanvas,
    totalSteps,
    durationSeconds = 12,
    fps = 24,
    filename = `BIM_Kintsugi_4D_Timelapse_${new Date().toISOString().slice(0, 10)}.webm`,
    onStep,
    onProgress,
    signal,
  } = options;

  if (typeof MediaRecorder === "undefined") {
    throw new Error("MediaRecorder API is not available in this browser.");
  }

  const width = sourceCanvas.width || sourceCanvas.clientWidth || 1280;
  const height = sourceCanvas.height || sourceCanvas.clientHeight || 720;

  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = width;
  compositeCanvas.height = height;
  const ctx = compositeCanvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize 2D compositing canvas for timelapse export.");
  }

  const mimeType = selectSupportedVideoMimeType();
  const stream = compositeCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 4_500_000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  const stopPromise = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
    recorder.onerror = (ev) => reject(new Error(`MediaRecorder error: ${String(ev)}`));
  });

  const totalFrames = Math.max(12, Math.min(600, Math.round(durationSeconds * fps)));
  const frameIntervalMs = Math.max(16, Math.round(1000 / fps));

  recorder.start();
  let framesRecorded = 0;

  try {
    for (let f = 0; f < totalFrames; f++) {
      if (signal?.aborted) {
        break;
      }
      const ratio = totalFrames > 1 ? f / (totalFrames - 1) : 1;
      const stepIdx = Math.round(ratio * Math.max(0, totalSteps));
      const hud = await onStep(stepIdx, ratio);

      // Composite live WebGL frame + HUD overlay
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(sourceCanvas, 0, 0, width, height);
      drawTimelapseHudOverlay(ctx, width, height, hud);

      framesRecorded++;
      onProgress?.(framesRecorded, totalFrames);

      await new Promise((r) => setTimeout(r, frameIntervalMs));
    }
  } finally {
    if (recorder.state !== "inactive") {
      recorder.stop();
    }
    stream.getTracks().forEach((t) => t.stop());
  }

  const blob = await stopPromise;

  // Trigger browser download when not aborted
  if (!signal?.aborted && typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  return {
    blob,
    filename,
    framesRecorded,
    mimeType,
  };
}
