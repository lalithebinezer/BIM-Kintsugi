import * as THREE from "three";
import { BimEngine } from "../core/BimEngine";
import { SoundManager } from "../core/SoundManager";

export interface GanttMilestone {
  id: string;
  name: string;
  category: string;
  startWeek: number;
  endWeek: number;
  budget: number;
  color: string;
}

export class GanttPhasingModule {
  private static instance: GanttPhasingModule | null = null;
  private engine: BimEngine;
  private currentWeek: number = 1;
  private totalWeeks: number = 52;
  private isPlaying: boolean = false;
  private playbackSpeed: number = 1;
  private animationInterval: any = null;

  public milestones: GanttMilestone[] = [
    { id: "m1", name: "Deep Excavation & Foundation Slabs", category: "IFCFOOTING", startWeek: 1, endWeek: 10, budget: 180000, color: "#d97706" },
    { id: "m2", name: "Primary Reinforced Concrete Columns & Beams", category: "IFCCOLUMN", startWeek: 8, endWeek: 24, budget: 420000, color: "#fbbf24" },
    { id: "m3", name: "Structural Slabs & Core Walls", category: "IFCSLAB", startWeek: 14, endWeek: 32, budget: 350000, color: "#60a5fa" },
    { id: "m4", name: "Curtain Wall Facade & Glazing Envelope", category: "IFCWINDOW", startWeek: 26, endWeek: 42, budget: 290000, color: "#38bdf8" },
    { id: "m5", name: "MEP Ducts, Piping & Electrical Infrastructure", category: "IFCFLOWSEGMENT", startWeek: 30, endWeek: 48, budget: 310000, color: "#22d3ee" },
    { id: "m6", name: "Architectural Interior Fitout & Handover", category: "IFCCOVERING", startWeek: 40, endWeek: 52, budget: 140000, color: "#a3e635" },
  ];

  private constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): GanttPhasingModule {
    if (!GanttPhasingModule.instance) {
      GanttPhasingModule.instance = new GanttPhasingModule();
    }
    return GanttPhasingModule.instance;
  }

  public setWeek(week: number) {
    this.currentWeek = Math.max(1, Math.min(this.totalWeeks, week));
    this.applyPhasingToScene();
    this.updateGanttUI();
  }

  public getWeek(): number {
    return this.currentWeek;
  }

  public togglePlay(): boolean {
    this.isPlaying = !this.isPlaying;
    SoundManager.getInstance().playClick();

    if (this.isPlaying) {
      this.animationInterval = setInterval(() => {
        let nextWeek = this.currentWeek + 1;
        if (nextWeek > this.totalWeeks) {
          nextWeek = 1;
        }
        this.setWeek(nextWeek);
      }, 500 / this.playbackSpeed);
    } else {
      if (this.animationInterval) {
        clearInterval(this.animationInterval);
        this.animationInterval = null;
      }
    }
    this.updateGanttUI();
    return this.isPlaying;
  }

  public setPlaybackSpeed(speed: number) {
    this.playbackSpeed = speed;
    if (this.isPlaying) {
      this.togglePlay();
      this.togglePlay();
    }
  }

  /**
   * Applies 4D visibility and material shading based on construction schedule
   */
  public applyPhasingToScene() {
    const scene = this.engine.world?.scene?.three;
    if (!scene) return;

    // Evaluate active milestones
    const activeMilestones = this.milestones.filter(
      (m) => this.currentWeek >= m.startWeek && this.currentWeek <= m.endWeek
    );
    const completedMilestones = this.milestones.filter((m) => this.currentWeek > m.endWeek);

    // Update 4D elements
    scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh && obj.name !== "BIM_GroundContactShadow") {
        const mat = obj.material as THREE.MeshStandardMaterial;
        if (mat) {
          // If in active milestone, give subtle glowing edge or transparent highlight
          const inActive = activeMilestones.some((m) => obj.name.toLowerCase().includes(m.category.toLowerCase()));
          const inCompleted = completedMilestones.some((m) => obj.name.toLowerCase().includes(m.category.toLowerCase()));

          if (inActive) {
            obj.visible = true;
            mat.opacity = 0.85;
            mat.transparent = true;
          } else if (inCompleted) {
            obj.visible = true;
            mat.opacity = 1.0;
            mat.transparent = false;
          }
        }
      }
    });
  }

  public calculateEarnedValue(): { plannedCost: number; actualCost: number; progressPercent: number } {
    let plannedCost = 0;
    let totalBudget = 0;

    this.milestones.forEach((m) => {
      totalBudget += m.budget;
      if (this.currentWeek >= m.endWeek) {
        plannedCost += m.budget;
      } else if (this.currentWeek >= m.startWeek) {
        const progress = (this.currentWeek - m.startWeek) / (m.endWeek - m.startWeek);
        plannedCost += m.budget * progress;
      }
    });

    const progressPercent = Math.round((plannedCost / (totalBudget || 1)) * 100);
    return {
      plannedCost,
      actualCost: plannedCost * 0.96, // Realistic 4% cost variance
      progressPercent,
    };
  }

  public updateGanttUI() {
    if (typeof document === "undefined") return;

    const weekLabel = document.getElementById("gantt-week-badge");
    if (weekLabel) {
      weekLabel.innerText = `Week ${this.currentWeek} of ${this.totalWeeks}`;
    }

    const playBtn = document.getElementById("btn-gantt-play");
    if (playBtn) {
      playBtn.classList.toggle("active", this.isPlaying);
      playBtn.innerText = this.isPlaying ? "Pause 4D" : "Play 4D";
    }

    const { plannedCost, progressPercent } = this.calculateEarnedValue();
    const costBadge = document.getElementById("gantt-evm-cost");
    if (costBadge) {
      costBadge.innerText = `$ ${plannedCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    const progBadge = document.getElementById("gantt-progress-val");
    if (progBadge) {
      progBadge.innerText = `${progressPercent}% Complete`;
    }
  }
}
