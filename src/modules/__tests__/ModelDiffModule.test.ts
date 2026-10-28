import { describe, it, expect, beforeEach } from "vitest";
import { ModelDiffModule } from "../ModelDiffModule";

describe("ModelDiffModule", () => {
  let diffModule: ModelDiffModule;

  beforeEach(() => {
    diffModule = ModelDiffModule.getInstance();
  });

  it("should initialize as singleton and have inactive status initially", () => {
    expect(diffModule).toBeDefined();
    expect(diffModule.isActive()).toBe(false);
    expect(diffModule.getSummary()).toBeNull();
  });
});

