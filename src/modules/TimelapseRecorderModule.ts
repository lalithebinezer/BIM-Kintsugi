import { showToast } from "../ui/ToastManager";

/**
 * TimelapseRecorderModule — Records 4D simulation viewport to downloadable WebM video.
 *
 * Uses HTML5 Canvas captureStream and MediaRecorder APIs.
 */
export class TimelapseRecorderModule {
  private static instance: TimelapseRecorderModule | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecordingActive: boolean = false;
  private canvasElement: HTMLCanvasElement | null = null;

  private constructor() {}

  public static getInstance(): TimelapseRecorderModule {
    if (!TimelapseRecorderModule.instance) {
      TimelapseRecorderModule.instance = new TimelapseRecorderModule();
    }
    return TimelapseRecorderModule.instance;
  }

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvasElement = canvas;
  }

  private resolveCanvas(): HTMLCanvasElement | null {
    if (this.canvasElement && document.body.contains(this.canvasElement)) {
      return this.canvasElement;
    }
    const canvas = document.querySelector<HTMLCanvasElement>("#app canvas") ||
      document.querySelector<HTMLCanvasElement>("canvas");
    this.canvasElement = canvas;
    return canvas;
  }

  public isRecording(): boolean {
    return this.isRecordingActive;
  }

  public startRecording(fps: number = 30): boolean {
    if (this.isRecordingActive) return false;
    const canvas = this.resolveCanvas();
    if (!canvas) {
      showToast("Cannot record: Viewport canvas not found.", "warning");
      return false;
    }

    try {
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
      if (!stream) {
        showToast("Screen capture not supported in this browser.", "warning");
        return false;
      }

      let mimeType = "video/webm;codecs=vp9";
      if (typeof MediaRecorder !== "undefined") {
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp8") ? "video/webm;codecs=vp8" : "video/webm";
        }
      }

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5000000 });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.saveRecordedFile();
      };

      this.mediaRecorder.start(250); // Record chunks every 250ms
      this.isRecordingActive = true;
      this.updateRecordButtonUI(true);
      showToast("🔴 4D Video Recording Started (WebM)", "info");
      return true;
    } catch (err) {
      console.error("Failed to start canvas video recording:", err);
      showToast("Could not start video recording.", "warning");
      return false;
    }
  }

  public stopRecording(): void {
    if (!this.isRecordingActive || !this.mediaRecorder) return;
    this.isRecordingActive = false;
    try {
      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
    } catch (e) {
      console.warn("MediaRecorder stop error:", e);
    }
    this.updateRecordButtonUI(false);
  }

  public toggleRecording(): boolean {
    if (this.isRecordingActive) {
      this.stopRecording();
      return false;
    } else {
      return this.startRecording();
    }
  }

  private saveRecordedFile(): void {
    if (this.recordedChunks.length === 0) {
      showToast("No video frames recorded.", "warning");
      return;
    }
    const blob = new Blob(this.recordedChunks, { type: "video/webm" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BIM_4D_Timelapse_${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast(`✅ Exported 4D Video Timelapse (${(blob.size / (1024 * 1024)).toFixed(1)} MB)`, "success");
  }

  private updateRecordButtonUI(recording: boolean): void {
    const btn = document.getElementById("btn-4d-record");
    if (btn) {
      btn.classList.toggle("recording", recording);
      btn.innerHTML = recording
        ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg> Stop Rec`
        : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg> Record 4D`;
      btn.title = recording ? "Stop and save 4D video recording" : "Record 4D simulation playback to WebM video";
    }
  }
}

