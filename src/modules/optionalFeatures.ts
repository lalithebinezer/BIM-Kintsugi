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
export const technicalDrawingFeature = lazyFeature("vector 2D drawings & DXF", async () =>
  (await import("./TechnicalDrawingModule")).TechnicalDrawingModule.getInstance());
export const realityCaptureFeature = lazyFeature("point cloud & splat capture", async () =>
  (await import("./RealityCaptureModule")).RealityCaptureModule.getInstance());
export const ifcSplitterFeature = lazyFeature("client IFC splitter", async () =>
  (await import("./IfcSplitterModule")).IfcSplitterModule.getInstance());
export const civilAlignmentFeature = lazyFeature("IFC 4.3 civil alignments", async () =>
  (await import("./CivilAlignmentModule")).CivilAlignmentModule.getInstance());
export const engineeringStudio = lazyFeature("engineering studio UI", async () => {
  const { initEngineeringStudioController } = await import("../ui/EngineeringStudioController");
  return initEngineeringStudioController();
});
export const ruleBuilderFeature = lazyFeature("dynamic rule builder", async () =>
  (await import("../ui/RuleBuilderModal")).RuleBuilderModal.getInstance());
export const workspaceCongestionFeature = lazyFeature("4D workspace SLF analyzer", async () =>
  (await import("./WorkspaceCongestionAnalyzer")).WorkspaceCongestionAnalyzer.getInstance());
export const bimQualityAuditorFeature = lazyFeature("BIM quality auditor", async () =>
  (await import("./BimQualityAuditor")).BimQualityAuditor.getInstance());
export const scheduleParsersFeature = lazyFeature("schedule import/export parsers", async () =>
  (await import("./ScheduleImportParsers")).ScheduleImportParsers);
