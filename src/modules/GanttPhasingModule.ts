import type { EarnedValue, Milestone } from "./Schedule4DEngine";

/**
 * GanttPhasingModule — renders the unified 4D bar (week badge, milestone pills,
 * earned-value readout) from data computed by `Schedule4DEngine`.
 *
 * It holds no schedule data of its own and never touches the 3D scene;
 * element visibility and colouring are handled by the main 4D timeline.
 */
export class GanttPhasingModule {
  private static instance: GanttPhasingModule | null = null;
  private currentWeek = 1;
  private totalWeeks = 1;
  private milestones: Milestone[] = [];
  private activeMilestone: string | null = null;

  private constructor() {}

  public static getInstance(): GanttPhasingModule {
    if (!GanttPhasingModule.instance) {
      GanttPhasingModule.instance = new GanttPhasingModule();
    }
    return GanttPhasingModule.instance;
  }

  public setTotalWeeks(total: number) {
    this.totalWeeks = Math.max(1, Math.round(total));
    this.currentWeek = Math.min(this.currentWeek, this.totalWeeks);
  }

  public getTotalWeeks(): number {
    return this.totalWeeks;
  }

  public setWeek(week: number) {
    this.currentWeek = Math.max(1, Math.min(this.totalWeeks, Math.round(week)));
    this.updateWeekBadge();
  }

  public getWeek(): number {
    return this.currentWeek;
  }

  /** Re-render milestone pills (max 8, evenly sampled if there are more). */
  public setMilestones(milestones: Milestone[]) {
    const MAX = 8;
    if (milestones.length <= MAX) {
      this.milestones = milestones;
    } else {
      const step = milestones.length / MAX;
      this.milestones = Array.from({ length: MAX }, (_, i) => milestones[Math.floor(i * step)]);
    }
    this.renderPills();
  }

  public getMilestones(): Milestone[] {
    return this.milestones;
  }

  /** Highlight the latest milestone that has started by `dateMs`. */
  public setCurrentDate(dateMs: number) {
    let active: string | null = null;
    for (const m of this.milestones) {
      if (dateMs >= m.start) active = m.name;
    }
    if (active === this.activeMilestone) return;
    this.activeMilestone = active;
    if (typeof document === "undefined") return;
    document.querySelectorAll<HTMLElement>(".gantt-pill").forEach((p) => {
      p.classList.toggle("active", p.dataset.name === active);
    });
  }

  public updateEarnedValue(evm: EarnedValue) {
    if (typeof document === "undefined") return;
    const fmt = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;

    const costBadge = document.getElementById("gantt-evm-cost");
    if (costBadge) {
      costBadge.innerText = `${fmt(evm.ev)} / ${fmt(evm.bac)}`;
      costBadge.title =
        `Planned Value (PV): ${fmt(evm.pv)}\n` +
        `Earned Value (EV): ${fmt(evm.ev)}\n` +
        `Budget at Completion (BAC): ${fmt(evm.bac)}\n` +
        `Schedule Variance (SV): ${evm.sv >= 0 ? "+" : "−"}${fmt(Math.abs(evm.sv))}`;
    }

    const spiBadge = document.getElementById("gantt-spi-val");
    if (spiBadge) {
      spiBadge.innerText = `SPI ${evm.spi.toFixed(2)}`;
      spiBadge.classList.toggle("behind", evm.spi < 0.95);
      spiBadge.classList.toggle("ahead", evm.spi > 1.05);
      spiBadge.title =
        evm.spi < 0.95 ? "Behind schedule (EV < PV)" : evm.spi > 1.05 ? "Ahead of schedule (EV > PV)" : "On schedule";
    }

    const progBadge = document.getElementById("gantt-progress-val");
    if (progBadge) {
      progBadge.innerText = `${Math.round(evm.earnedPercent)}% Complete`;
      progBadge.title = `Earned ${evm.earnedPercent.toFixed(1)}% · Planned ${evm.plannedPercent.toFixed(1)}%`;
    }
  }

  private updateWeekBadge() {
    if (typeof document === "undefined") return;
    const weekLabel = document.getElementById("gantt-week-badge");
    if (weekLabel) {
      weekLabel.innerText = `Week ${this.currentWeek} of ${this.totalWeeks}`;
    }
  }

  private renderPills() {
    if (typeof document === "undefined") return;
    const row = document.querySelector<HTMLElement>(".gantt-milestones-row");
    if (!row) return;
    row.innerHTML = "";
    this.activeMilestone = null;
    this.milestones.forEach((m, i) => {
      const pill = document.createElement("span");
      pill.className = "gantt-pill";
      pill.dataset.name = m.name;
      pill.dataset.start = String(m.start);
      pill.textContent = `${i + 1}. ${m.name}`;
      const startStr = new Date(m.start).toISOString().slice(0, 10);
      const endStr = new Date(m.end).toISOString().slice(0, 10);
      pill.title = `${m.name}\n${startStr} → ${endStr}\n${m.elementCount} elements · $${Math.round(m.cost).toLocaleString("en-US")}`;
      row.appendChild(pill);
    });
  }
}
