import * as OBC from "@thatopen/components";
import { BimEngine } from "../core/BimEngine";

export class QueryModule {
  private engine: BimEngine;

  constructor() {
    this.engine = BimEngine.getInstance();
  }

  public async isolateCategories(categories: string[]) {
    const modelIdMap: OBC.ModelIdMap = {};
    const categoriesRegex = categories.map((cat) => new RegExp(`^${cat}$`));

    for (const [, model] of this.engine.fragments.list) {
      const items = await model.getItemsOfCategories(categoriesRegex);
      const localIds = Object.values(items).flat();
      modelIdMap[model.modelId] = new Set(localIds);
    }
    await this.engine.hider.isolate(modelIdMap);
  }

  public async hideCategories(categories: string[]) {
    const modelIdMap: OBC.ModelIdMap = {};
    const categoriesRegex = categories.map((cat) => new RegExp(`^${cat}$`));

    for (const [, model] of this.engine.fragments.list) {
      const items = await model.getItemsOfCategories(categoriesRegex);
      const localIds = Object.values(items).flat();
      modelIdMap[model.modelId] = new Set(localIds);
    }
    await this.engine.hider.set(false, modelIdMap);
  }

  public async resetVisibility() {
    await this.engine.hider.set(true);
  }

  public createQuery(name: string, params: any[]) {
    return this.engine.finder.create(name, params);
  }

  public async testQuery(name: string) {
    const query = this.engine.finder.list.get(name);
    if (!query) return {};
    return await query.test();
  }
}
