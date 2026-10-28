/**
 * Timeline4DModule — Facade for 4D simulation control.
 *
 * Connects the command palette, shortcuts, and external APIs directly
 * to the unified 4D timeline playback engine in the viewport.
 */
export class Timeline4DModule {
  public startSimulation(onStep?: (currentDate: string) => void) {
    if (typeof (window as any).toggle4DMode === "function") {
      (window as any).toggle4DMode(true);
    }
    if (typeof (window as any).startTimelinePlayback === "function") {
      (window as any).startTimelinePlayback(onStep);
    } else if (typeof (window as any).toggleTimelinePlayback === "function") {
      (window as any).toggleTimelinePlayback(true);
    }
  }

  public stopSimulation() {
    if (typeof (window as any).stopTimelinePlayback === "function") {
      (window as any).stopTimelinePlayback();
    } else if (typeof (window as any).toggleTimelinePlayback === "function") {
      (window as any).toggleTimelinePlayback(false);
    }
  }

  public setSpeed(speed: number) {
    if (typeof (window as any).setTimelinePlaybackSpeed === "function") {
      (window as any).setTimelinePlaybackSpeed(speed);
    }
  }

  public isPlaying(): boolean {
    return Boolean((window as any).isTimelinePlaying);
  }
}
