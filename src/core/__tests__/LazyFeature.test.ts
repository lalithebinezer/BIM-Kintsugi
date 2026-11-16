import { describe, expect, it, vi } from "vitest";
import { lazyFeature } from "../../utils/lazyFeature";

vi.mock("../../ui/ToastManager", () => ({ showToast: vi.fn() }));

describe("optional feature loading", () => {
  it("waits for use and shares concurrent downloads", async () => {
    const importer = vi.fn(async () => ({ ready: true }));
    const feature = lazyFeature("test feature", importer);
    expect(importer).not.toHaveBeenCalled();
    expect(feature.peek()).toBeUndefined();
    const first = feature.load();
    expect(feature.load()).toBe(first);
    const loaded = await first;
    expect(feature.peek()).toBe(loaded);
    expect(await feature.load()).toBe(loaded);
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("allows retry after a rejected download", async () => {
    const importer = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce("ready");
    const feature = lazyFeature("test feature", importer);
    await expect(feature.load()).rejects.toThrow("offline");
    expect(feature.peek()).toBeUndefined();
    await expect(feature.load()).resolves.toBe("ready");
    expect(importer).toHaveBeenCalledTimes(2);
  });
});
