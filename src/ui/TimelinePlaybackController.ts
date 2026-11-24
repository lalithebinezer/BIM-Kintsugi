/**
 * TimelinePlaybackController — Extracted 4D Timeline Date Bounds, Stepping & Speed Engine
 *
 * Encapsulates timeline range calculation, day-to-date conversion, week numbering,
 * and play/pause loop timing cleanly outside src/main.ts.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface TimelineBounds {
  minDate: Date;
  maxDate: Date;
  totalDays: number;
  totalWeeks: number;
}

export interface TimelineTelemetry {
  currentDay: number;
  totalDays: number;
  currentWeek: number;
  totalWeeks: number;
  progressPct: number;
  isoDate: string;
}

export class TimelinePlaybackController {
  public minDate: Date | null = null;
  public maxDate: Date | null = null;
  public currentDate: Date | null = null;
  public speedDaysPerSec = 2;
  private timerId: ReturnType<typeof setInterval> | null = null;

  public computeBoundsFromDates(dates: Array<{ startDate?: string; endDate?: string }>): TimelineBounds | null {
    let minMs = Infinity;
    let maxMs = -Infinity;
    for (const d of dates) {
      if (d.startDate) {
        const s = new Date(d.startDate).getTime();
        if (Number.isFinite(s) && s < minMs) minMs = s;
      }
      if (d.endDate) {
        const e = new Date(d.endDate).getTime();
        if (Number.isFinite(e) && e > maxMs) maxMs = e;
      }
    }
    if (!Number.isFinite(minMs) || !Number.isFinite(maxMs) || maxMs < minMs) return null;
    this.minDate = new Date(minMs);
    this.maxDate = new Date(maxMs);
    const totalDays = Math.max(1, Math.ceil((maxMs - minMs) / DAY_MS));
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
    if (!this.currentDate || this.currentDate.getTime() < minMs || this.currentDate.getTime() > maxMs) {
      this.currentDate = new Date(minMs);
    }
    return { minDate: this.minDate, maxDate: this.maxDate, totalDays, totalWeeks };
  }

  public setDayOffset(dayOffset: number): Date | null {
    if (!this.minDate || !this.maxDate) return null;
    const totalDays = Math.max(1, Math.ceil((this.maxDate.getTime() - this.minDate.getTime()) / DAY_MS));
    const clamped = Math.max(0, Math.min(totalDays, dayOffset));
    this.currentDate = new Date(this.minDate.getTime() + clamped * DAY_MS);
    return this.currentDate;
  }

  public getTelemetry(): TimelineTelemetry {
    if (!this.minDate || !this.maxDate || !this.currentDate) {
      return {
        currentDay: 0,
        totalDays: 1,
        currentWeek: 1,
        totalWeeks: 1,
        progressPct: 0,
        isoDate: "--",
      };
    }
    const totalDays = Math.max(1, Math.ceil((this.maxDate.getTime() - this.minDate.getTime()) / DAY_MS));
    const currentDay = Math.max(
      0,
      Math.min(totalDays, Math.round((this.currentDate.getTime() - this.minDate.getTime()) / DAY_MS))
    );
    const totalWeeks = Math.max(1, Math.ceil(totalDays / 7));
    const currentWeek = Math.max(1, Math.min(totalWeeks, Math.floor(currentDay / 7) + 1));
    const progressPct = Math.round((currentDay / totalDays) * 100);
    return {
      currentDay,
      totalDays,
      currentWeek,
      totalWeeks,
      progressPct,
      isoDate: this.currentDate.toISOString().slice(0, 10),
    };
  }

  public isPlaying(): boolean {
    return this.timerId !== null;
  }

  public start(onTick: (nextDate: Date, telemetry: TimelineTelemetry) => void, onEnd?: () => void): void {
    this.stop();
    if (!this.minDate || !this.maxDate) return;
    if (!this.currentDate) this.currentDate = new Date(this.minDate);

    const tickMs = 100;
    this.timerId = setInterval(() => {
      if (!this.currentDate || !this.maxDate) {
        this.stop();
        return;
      }
      const stepMs = (this.speedDaysPerSec * DAY_MS) * (tickMs / 1000);
      const nextMs = this.currentDate.getTime() + stepMs;
      if (nextMs >= this.maxDate.getTime()) {
        this.currentDate = new Date(this.maxDate);
        onTick(this.currentDate, this.getTelemetry());
        this.stop();
        onEnd?.();
      } else {
        this.currentDate = new Date(nextMs);
        onTick(this.currentDate, this.getTelemetry());
      }
    }, tickMs);
  }

  public stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
