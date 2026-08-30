import { BimEngine } from "../core/BimEngine";

export interface MaterialCarbonProfile {
  name: string;
  categoryMatch: string[];
  embodiedCarbonPerM3: number; // kg CO2e / m³
  sustainableAlternative?: {
    name: string;
    embodiedCarbonPerM3: number;
    reductionPercent: number;
    costDeltaPercent: number;
  };
}

export interface ElementCarbonData {
  modelId: string;
  expressId: number;
  category: string;
  name: string;
  volumeM3: number;
  material: string;
  embodiedCarbonKg: number; // kg CO2e
  intensityRating: "A" | "B" | "C" | "D" | "E";
  colorHex: string;
}

export interface ProjectCarbonSummary {
  totalCarbonTonnes: number;
  carbonIntensityPerM2: number;
  ratingGrade: "A+" | "A" | "B" | "C" | "D";
  potentialSavingsTonnes: number;
  elementCount: number;
  categoryBreakdown: Record<string, { totalCarbonKg: number; count: number }>;
}

export class CarbonLcaManager {
  private static instance: CarbonLcaManager;
  private engine: BimEngine;
  private isHeatmapActive: boolean = false;
  private materialSubstitutions: Record<string, string> = {};

  private carbonProfiles: Record<string, MaterialCarbonProfile> = {
    concrete: {
      name: "Standard C30/37 Concrete",
      categoryMatch: ["IFCWALL", "IFCSLAB", "IFCCOLUMN", "IFCBEAM", "IFCFOOTING"],
      embodiedCarbonPerM3: 340,
      sustainableAlternative: {
        name: "Eco-Mix GGBS Concrete (50% Fly Ash)",
        embodiedCarbonPerM3: 165,
        reductionPercent: 51.5,
        costDeltaPercent: -2.0,
      },
    },
    steel: {
      name: "Structural Steel Frame",
      categoryMatch: ["IFCMEMBER", "IFCBEAM", "IFCCOLUMN"],
      embodiedCarbonPerM3: 1450,
      sustainableAlternative: {
        name: "100% Recycled Electric Arc Furnace Steel",
        embodiedCarbonPerM3: 480,
        reductionPercent: 66.9,
        costDeltaPercent: 4.5,
      },
    },
    timber: {
      name: "Glulam Mass Timber",
      categoryMatch: ["IFCBEAM", "IFCSLAB", "IFCROOF"],
      embodiedCarbonPerM3: -320, // Carbon Sequestering
      sustainableAlternative: {
        name: "FSC Certified CLT Mass Timber",
        embodiedCarbonPerM3: -450,
        reductionPercent: 40.6,
        costDeltaPercent: 1.5,
      },
    },
    glass: {
      name: "Standard Double Glazing Curtain Wall",
      categoryMatch: ["IFCCURTAINWALL", "IFCWINDOW", "IFCDOOR"],
      embodiedCarbonPerM3: 820,
      sustainableAlternative: {
        name: "Triple Low-E Vacuum Glazing",
        embodiedCarbonPerM3: 540,
        reductionPercent: 34.1,
        costDeltaPercent: 8.0,
      },
    },
    mep: {
      name: "Galvanized Steel Ductwork & MEP",
      categoryMatch: ["IFCDUCTSEGMENT", "IFCPIPESEGMENT", "IFCFLOWTERMINAL"],
      embodiedCarbonPerM3: 650,
      sustainableAlternative: {
        name: "Bio-Composite Low-Loss Ducting",
        embodiedCarbonPerM3: 280,
        reductionPercent: 56.9,
        costDeltaPercent: 3.0,
      },
    },
  };

  private constructor() {
    this.engine = BimEngine.getInstance();
  }

  public static getInstance(): CarbonLcaManager {
    if (!CarbonLcaManager.instance) {
      CarbonLcaManager.instance = new CarbonLcaManager();
    }
    return CarbonLcaManager.instance;
  }

  public toggleHeatmap(active?: boolean): boolean {
    this.isHeatmapActive = active !== undefined ? active : !this.isHeatmapActive;
    this.applyHeatmapVisuals();
    this.updateCarbonUI();
    return this.isHeatmapActive;
  }

  public isHeatmapEnabled(): boolean {
    return this.isHeatmapActive;
  }

  public substituteMaterial(categoryKey: string, useGreenAlternative: boolean) {
    if (useGreenAlternative) {
      this.materialSubstitutions[categoryKey] = "green";
    } else {
      delete this.materialSubstitutions[categoryKey];
    }
    this.updateCarbonUI();
  }

  public calculateProjectCarbon(): ProjectCarbonSummary {
    const elements = this.getAnalyzedElements();
    let totalKg = 0;
    let potentialSavingsKg = 0;
    const catMap: Record<string, { totalCarbonKg: number; count: number }> = {};

    for (const el of elements) {
      totalKg += el.embodiedCarbonKg;
      if (!catMap[el.category]) catMap[el.category] = { totalCarbonKg: 0, count: 0 };
      catMap[el.category].totalCarbonKg += el.embodiedCarbonKg;
      catMap[el.category].count++;

      // Compute potential savings
      const profile = this.findProfileForCategory(el.category);
      if (profile?.sustainableAlternative) {
        const saved = el.volumeM3 * (profile.embodiedCarbonPerM3 - profile.sustainableAlternative.embodiedCarbonPerM3);
        if (saved > 0) potentialSavingsKg += saved;
      }
    }

    const estimatedGiaM2 = Math.max(1, elements.length * 14.5);
    const carbonIntensity = (totalKg / estimatedGiaM2);

    let rating: "A+" | "A" | "B" | "C" | "D" = "B";
    if (carbonIntensity < 150) rating = "A+";
    else if (carbonIntensity < 300) rating = "A";
    else if (carbonIntensity < 500) rating = "B";
    else if (carbonIntensity < 750) rating = "C";
    else rating = "D";

    return {
      totalCarbonTonnes: totalKg / 1000,
      carbonIntensityPerM2: carbonIntensity,
      ratingGrade: rating,
      potentialSavingsTonnes: potentialSavingsKg / 1000,
      elementCount: elements.length,
      categoryBreakdown: catMap,
    };
  }

  public getAnalyzedElements(): ElementCarbonData[] {
    const list: ElementCarbonData[] = [];
    try {
      if (this.engine.fragments && (this.engine.fragments as any).list) {
        const fragList = (this.engine.fragments as any).list;
        for (const [modelId, model] of fragList) {
          if (model && model.properties) {
            for (const idStr in model.properties) {
              const id = parseInt(idStr, 10);
              const p = model.properties[id];
              if (!p) continue;
              const cat = p.type || p._category || p.typeStr || "IFCWALL";
              const name = p.Name?.value || p.name || `Element #${id}`;

              const profile = this.findProfileForCategory(cat);
              const isSubstituted = this.materialSubstitutions[cat] === "green";
              const coeff = isSubstituted && profile.sustainableAlternative
                ? profile.sustainableAlternative.embodiedCarbonPerM3
                : profile.embodiedCarbonPerM3;

              const vol = 0.65 + ((id % 7) * 0.25);
              const kg = vol * coeff;

              let grade: "A" | "B" | "C" | "D" | "E" = "C";
              let hex = "#eab308";
              if (kg <= 50) { grade = "A"; hex = "#22c55e"; }
              else if (kg <= 150) { grade = "B"; hex = "#84cc16"; }
              else if (kg <= 300) { grade = "C"; hex = "#eab308"; }
              else if (kg <= 600) { grade = "D"; hex = "#f97316"; }
              else { grade = "E"; hex = "#ef4444"; }

              list.push({
                modelId,
                expressId: id,
                category: cat,
                name,
                volumeM3: vol,
                material: isSubstituted && profile.sustainableAlternative ? profile.sustainableAlternative.name : profile.name,
                embodiedCarbonKg: kg,
                intensityRating: grade,
                colorHex: hex,
              });
            }
          }
        }
      }
    } catch (e) {}

    // Standalone demonstration items if model not loaded
    if (list.length === 0) {
      for (let i = 1; i <= 24; i++) {
        const cat = i % 3 === 0 ? "IFCCOLUMN" : i % 2 === 0 ? "IFCSLAB" : "IFCWALL";
        const vol = 0.8 + (i * 0.15);
        const coeff = i % 4 === 0 ? 165 : 340;
        const kg = vol * coeff;
        list.push({
          modelId: "model_demo",
          expressId: 100 + i,
          category: cat,
          name: `${cat.replace("IFC", "")} ${100 + i}`,
          volumeM3: vol,
          material: "C30/37 Concrete",
          embodiedCarbonKg: kg,
          intensityRating: kg < 200 ? "A" : kg < 400 ? "B" : "D",
          colorHex: kg < 200 ? "#22c55e" : kg < 400 ? "#84cc16" : "#f97316",
        });
      }
    }

    return list;
  }

  private findProfileForCategory(category: string): MaterialCarbonProfile {
    const c = category.toUpperCase();
    if (c.includes("STEEL") || c.includes("MEMBER")) return this.carbonProfiles.steel;
    if (c.includes("TIMBER") || c.includes("WOOD")) return this.carbonProfiles.timber;
    if (c.includes("WINDOW") || c.includes("CURTAIN") || c.includes("GLASS")) return this.carbonProfiles.glass;
    if (c.includes("DUCT") || c.includes("PIPE") || c.includes("FLOW")) return this.carbonProfiles.mep;
    return this.carbonProfiles.concrete;
  }

  private applyHeatmapVisuals() {
    // Toggles color-ramp representation
    try {
      if (this.isHeatmapActive) {
        // Highlighting in green / amber / red groups
        const elements = this.getAnalyzedElements();
        const lowCarbonMap: Record<string, Set<number>> = {};
        const highCarbonMap: Record<string, Set<number>> = {};

        for (const el of elements) {
          const map = el.embodiedCarbonKg < 250 ? lowCarbonMap : highCarbonMap;
          if (!map[el.modelId]) map[el.modelId] = new Set();
          map[el.modelId].add(el.expressId);
        }

        if (this.engine.highlighter?.highlightByID && (this.engine.fragments as any)?.core) {
          this.engine.highlighter.highlightByID("select", lowCarbonMap, true, false).catch(() => {});
        }
      } else {
        if (this.engine.highlighter?.clear && (this.engine.fragments as any)?.core) {
          this.engine.highlighter.clear("select").catch(() => {});
        }
      }
    } catch (e) {}
  }

  public updateCarbonUI() {
    if (typeof document === "undefined") return;

    const summary = this.calculateProjectCarbon();
    const totalEl = document.getElementById("carbon-total-tonnes");
    const intensityEl = document.getElementById("carbon-intensity-m2");
    const gradeEl = document.getElementById("carbon-rating-grade");
    const savingsEl = document.getElementById("carbon-potential-savings");
    const toggleBtn = document.getElementById("btn-toggle-carbon-heatmap");

    if (totalEl) totalEl.innerText = `${summary.totalCarbonTonnes.toFixed(1)} tCO₂e`;
    if (intensityEl) intensityEl.innerText = `${summary.carbonIntensityPerM2.toFixed(1)} kg/m²`;
    if (gradeEl) {
      gradeEl.innerText = summary.ratingGrade;
      gradeEl.className = `carbon-grade-badge grade-${summary.ratingGrade.replace("+", "plus")}`;
    }
    if (savingsEl) savingsEl.innerText = `-${summary.potentialSavingsTonnes.toFixed(1)} tCO₂e potential savings`;
    if (toggleBtn) {
      toggleBtn.classList.toggle("active", this.isHeatmapActive);
      toggleBtn.innerText = this.isHeatmapActive ? "Heatmap: Active" : "Toggle Heatmap";
    }

    const matList = document.getElementById("carbon-materials-list");
    if (matList) {
      matList.innerHTML = "";
      Object.entries(this.carbonProfiles).forEach(([key, profile]) => {
        if (!profile.sustainableAlternative) return;
        const isSwapped = this.materialSubstitutions[key] === "green";
        const row = document.createElement("div");
        row.className = "carbon-material-row";
        row.innerHTML = `
          <div class="mat-info">
            <span class="mat-name">${isSwapped ? profile.sustainableAlternative.name : profile.name}</span>
            <span class="mat-saving ${isSwapped ? "active" : ""}">
              ${isSwapped ? `✓ Active (${profile.sustainableAlternative.reductionPercent}% saved)` : `Save ${profile.sustainableAlternative.reductionPercent}%`}
            </span>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" class="chk-carbon-swap" data-cat="${key}" ${isSwapped ? "checked" : ""} />
            <span class="toggle-slider"></span>
          </label>
        `;

        row.querySelector(".chk-carbon-swap")?.addEventListener("change", (e) => {
          const checked = (e.target as HTMLInputElement).checked;
          this.substituteMaterial(key, checked);
          if (this.isHeatmapActive) this.applyHeatmapVisuals();
        });

        matList.appendChild(row);
      });
    }
  }
}
