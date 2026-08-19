import { BimEngine } from "../core/BimEngine";
import { extractQuantityData, generateBOQSummary, exportBOQAsCSV, type BOQSummary } from "./BoqGenerator";

export class Boq5DModule {
  private engine: BimEngine;

  constructor() {
    this.engine = BimEngine.getInstance();
  }

  public async generateSummary(): Promise<BOQSummary> {
    const rawData = await extractQuantityData(this.engine.fragments);
    return generateBOQSummary(rawData as any);
  }

  public async exportCSV() {
    const summary = await this.generateSummary();
    exportBOQAsCSV(summary);
  }
}

