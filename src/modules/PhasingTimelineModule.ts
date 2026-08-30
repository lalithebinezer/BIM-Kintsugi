import { BimEngine } from "../core/BimEngine";

export interface ConstructionPhase {
  id: string;
  name: string;
  startWeek: number;
  endWeek: number;
  categories: string[];
  discipline: "Structure" | "Architectural" | "MEP" | "Fitout";
  colorHex: string;
}

export interface TimelineState {
  currentWeek: number;
  totalWeeks: number;
  isPlaying: boolean;
  playbackSpeed: number; // 1, 2, 5, 10
}

export class PhasingTimelineModule {
  private static instance: PhasingTimelineModule;
  private engine: BimEngine;
  private timer: any = null;

  private state: TimelineState = {
    currentWeek: 1,
    totalWeeks: 52,
    isPlaying: false,
    playbackSpeed: 1,
  };

  private phases: ConstructionPhase[] = [
    {
      id: "phase_1",
      name: "Substructure & Foundation",
      startWeek: 1,
      endWeek: 10,
      categories: ["IFCFOOTING", "IFCSLAB", "IFCPILE"],
      discipline: "Structure",
      colorHex: "#F59E0B",
    },
    {
      id: "phase_2",
      name: "Structural Superstructure",
      startWeek: 11,
      endWeek: 22,
      categories: ["IFCCOLUMN", "IFCBEAM", "IFCMEMBER", "IFCPLATE"],
      discipline: "Structure",
      colorHex: "#3B82F6",
    },
    {
      id: "phase_3",
      name: "Envelope & Facade",
      startWeek: 23,
      endWeek: 34,
      categories: ["IFCWALL", "IFCWALLSTANDARDCASE", "IFCROOF", "IFCWINDOW", "IFCCURTAINWALL"],
      discipline: "Architectural",
      colorHex: "#10B981",
    },
    {
      id: "phase_4",
      name: "MEP & Building Services",
      startWeek: 35,
      endWeek: 46,
      categories: ["IFCDUCTSEGMENT", "IFCPIPESEGMENT", "IFCFLOWTERMINAL", "IFCCABLECARRIERSEGMENT"],
      discipline: "MEP",
      colorHex: "#EC4899",
    },
    {
      id: "phase_5",
      name: "Interior Fitout & Handover",
      startWeek: 47,
      endWeek: 52,
      categories: ["IFCDOOR", "IFCFURNISHINGELEMENT", "IFCRAILING", "IFCCOVERING"],
      discipline: "Fitout",
      colorHex: "#8B5CF6",
    },
  ];

  private constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): PhasingTimelineModule {
    if (!PhasingTimelineModule.instance) {
      PhasingTimelineModule.instance = new PhasingTimelineModule();
    }
    return PhasingTimelineModule.instance;
  }

  public play() {
    if (this.state.isPlaying) return;
    this.state.isPlaying = true;

    const intervalMs = Math.max(100, Math.floor(600 / this.state.playbackSpeed));
    this.timer = setInterval(() => {
      if (this.state.currentWeek >= this.state.totalWeeks) {
        this.pause();
        return;
      }
      this.setWeek(this.state.currentWeek + 1);
    }, intervalMs);

    this.updateUI();
  }

  public pause() {
    this.state.isPlaying = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.updateUI();
  }

  public togglePlayPause(): boolean {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      if (this.state.currentWeek >= this.state.totalWeeks) {
        this.state.currentWeek = 1;
      }
      this.play();
    }
    return this.state.isPlaying;
  }

  public setSpeed(speed: number) {
    this.state.playbackSpeed = speed;
    if (this.state.isPlaying) {
      this.pause();
      this.play();
    }
    this.updateUI();
  }

  public setWeek(week: number) {
    this.state.currentWeek = Math.max(1, Math.min(this.state.totalWeeks, week));
    this.applyPhaseVisibility();
    this.updateUI();
  }

  public stepForward() {
    this.setWeek(this.state.currentWeek + 1);
  }

  public stepBackward() {
    this.setWeek(this.state.currentWeek - 1);
  }

  public reset() {
    this.pause();
    this.setWeek(1);
  }

  public getActivePhase(): ConstructionPhase | undefined {
    return this.phases.find(
      (p) => this.state.currentWeek >= p.startWeek && this.state.currentWeek <= p.endWeek
    );
  }

  public getPhaseStatus(phase: ConstructionPhase): "planned" | "active" | "completed" {
    if (this.state.currentWeek < phase.startWeek) return "planned";
    if (this.state.currentWeek > phase.endWeek) return "completed";
    return "active";
  }

  public applyPhaseVisibility() {
    try {
      if (!this.engine.hider || !this.engine.fragments) return;

      const activePhase = this.getActivePhase();
      if (activePhase) {
        // High-level phase status synchronization
      }
    } catch (e) {}
  }

  public getState(): TimelineState {
    return { ...this.state };
  }

  public getPhases(): ConstructionPhase[] {
    return this.phases;
  }

  public updateUI() {
    if (typeof document === "undefined") return;

    const playBtn = document.getElementById("btn-timeline-play");
    const weekLabel = document.getElementById("timeline-week-label");
    const slider = document.getElementById("timeline-week-slider") as HTMLInputElement | null;
    const phaseName = document.getElementById("timeline-phase-name");
    const progressFill = document.getElementById("timeline-progress-fill");

    const progressPct = ((this.state.currentWeek / this.state.totalWeeks) * 100).toFixed(0);

    if (playBtn) {
      playBtn.innerHTML = this.state.isPlaying
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
      playBtn.title = this.state.isPlaying ? "Pause Simulation" : "Play Simulation";
    }

    if (weekLabel) {
      weekLabel.innerText = `Week ${this.state.currentWeek} / ${this.state.totalWeeks} (${progressPct}%)`;
    }

    if (slider) {
      slider.value = this.state.currentWeek.toString();
    }

    if (progressFill) {
      progressFill.style.width = `${progressPct}%`;
    }

    const activePhase = this.getActivePhase();
    if (phaseName) {
      if (activePhase) {
        phaseName.innerHTML = `<span style="color: ${activePhase.colorHex}; font-weight: 800;">${activePhase.discipline}</span>: ${activePhase.name}`;
      } else {
        phaseName.innerText = "Project Complete";
      }
    }
  }
}
