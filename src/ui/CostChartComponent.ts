import { formatCurrency } from "../utils/formatters";

export interface CategoryCostItem {
  category: string;
  totalCost: number;
  itemCount: number;
  percentage: number;
}

export class CostChartComponent {
  private static instance: CostChartComponent | null = null;

  private constructor() {}

  public static getInstance(): CostChartComponent {
    if (!CostChartComponent.instance) {
      CostChartComponent.instance = new CostChartComponent();
    }
    return CostChartComponent.instance;
  }

  public renderCategoryCostBreakdown(categoryMap: Map<string, { cost: number; count: number }>, containerId: string = "cost-breakdown-chart-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (categoryMap.size === 0) {
      container.innerHTML = `<div style="font-size: 0.68rem; color: var(--text-muted); text-align: center; padding: 0.5rem; background: var(--bg-card); border-radius: 4px; border: 1px dashed var(--border-subtle);">Load a model to view 5D element category distribution.</div>`;
      return;
    }

    let grandTotalCost = 0;
    let totalCount = 0;
    categoryMap.forEach((val) => {
      grandTotalCost += val.cost;
      totalCount += val.count;
    });

    const isCostAvailable = grandTotalCost > 0;
    const denominator = isCostAvailable ? grandTotalCost : totalCount;

    const items: CategoryCostItem[] = [];
    categoryMap.forEach((val, cat) => {
      const metric = isCostAvailable ? val.cost : val.count;
      const percentage = denominator > 0 ? (metric / denominator) * 100 : 0;
      items.push({
        category: cat.replace(/^IFC/, ""),
        totalCost: val.cost,
        itemCount: val.count,
        percentage
      });
    });

    // Sort highest metric first
    items.sort((a, b) => b.percentage - a.percentage);

    const colors = ["#D4FF3F", "#3b82f6", "#10b981", "#f59e0b", "#a855f7", "#06b6d4", "#ef4444"];

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.45rem; width: 100%;">
        ${items.map((item, idx) => {
          const color = colors[idx % colors.length];
          const valDisplay = isCostAvailable ? `${formatCurrency(item.totalCost)} (${item.percentage.toFixed(1)}%)` : `${item.itemCount} items (${item.percentage.toFixed(1)}%)`;
          return `
            <div style="display: flex; flex-direction: column; gap: 0.15rem; background: var(--bg-card); padding: 0.35rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-subtle);">
              <div style="display: flex; justify-content: space-between; font-size: 0.68rem; font-weight: 700; color: var(--text-primary);">
                <span>${item.category}</span>
                <span style="color: ${color}; font-family: var(--font-mono);">${valDisplay}</span>
              </div>
              <div style="width: 100%; height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden; margin-top: 0.15rem;">
                <div style="width: ${Math.min(100, Math.max(2, item.percentage))}%; height: 100%; background: ${color}; transition: width 0.3s ease;"></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  public renderSCurveProgressChart(containerId: string = "scurve-chart-container") {
    const container = document.getElementById(containerId);
    if (!container) return;

    const width = 280;
    const height = 120;
    const padding = 20;

    // Generate cumulative EVM S-Curve Points
    const plannedPoints = [
      { x: padding, y: height - padding },
      { x: width * 0.3, y: height - padding - 15 },
      { x: width * 0.5, y: height - padding - 45 },
      { x: width * 0.75, y: height - padding - 75 },
      { x: width - padding, y: padding }
    ];

    const actualPoints = [
      { x: padding, y: height - padding },
      { x: width * 0.3, y: height - padding - 10 },
      { x: width * 0.5, y: height - padding - 40 },
      { x: width * 0.65, y: height - padding - 55 }
    ];

    const plannedPath = plannedPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const actualPath = actualPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    container.innerHTML = `
      <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 0.5rem; border-radius: 6px; margin-top: 0.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <span style="font-size: 0.68rem; font-weight: 700; color: var(--text-main); text-transform: uppercase;">4D/5D EVM S-Curve</span>
          <div style="display: flex; gap: 0.5rem; font-size: 0.6rem;">
            <span style="color: #60a5fa;">● Planned (PV)</span>
            <span style="color: #34d399;">● Earned (EV)</span>
          </div>
        </div>
        <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
          <!-- Grid Lines -->
          <line x1="${padding}" y1="${padding}" x2="${width - padding}" y2="${padding}" stroke="var(--border-subtle)" stroke-dasharray="2,2" />
          <line x1="${padding}" y1="${height / 2}" x2="${width - padding}" y2="${height / 2}" stroke="var(--border-subtle)" stroke-dasharray="2,2" />
          <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="var(--border-subtle)" />
          
          <!-- Planned S-Curve -->
          <path d="${plannedPath}" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" />
          
          <!-- Earned S-Curve -->
          <path d="${actualPath}" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" />
        </svg>
      </div>
    `;
  }
}
