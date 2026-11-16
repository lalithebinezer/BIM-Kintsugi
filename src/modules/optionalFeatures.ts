import { lazyFeature } from "../utils/lazyFeature";
import { BimEngine } from "../core/BimEngine";

export const executiveReport = lazyFeature("executive reports", async () =>
  (await import("./ExecutiveReportModule")).ExecutiveReportModule.getInstance());
export const cobieExport = lazyFeature("COBie export", async () =>
  (await import("./CobieExportModule")).CobieExportModule.getInstance());
export const recorder = lazyFeature("video recording", async () =>
  (await import("./TimelapseRecorderModule")).TimelapseRecorderModule.getInstance());
export const evmDashboard = lazyFeature("EVM dashboard", async () => {
  const { EvmDashboardModule } = await import("./EvmDashboardModule");
  (window as any).EvmDashboardModule = EvmDashboardModule;
  return EvmDashboardModule.getInstance();
});
export const gisFeature = lazyFeature("GeoBIM", async () => {
  const { GisModule } = await import("./GisModule");
  const gis = GisModule.getInstance();
  gis.init(BimEngine.getInstance().world);
  (window as any).gisModule = gis;
  return gis;
});
export const geoTools = lazyFeature("terrain and solar tools", async () => {
  await gisFeature.load();
  const { initGeoEngineeringController } = await import("../ui/GeoEngineeringController");
  const engine = BimEngine.getInstance();
  initGeoEngineeringController(engine.world, engine.fragments.core);
  return (await import("./GeoEngineeringSuite")).GeoEngineeringSuite.getInstance();
});
