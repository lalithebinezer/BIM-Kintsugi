import * as THREE from "three";

/**
 * GeoEngineeringSuite
 * --------------------------------------------------------------
 * Advanced GeoBIM & navigation capabilities layered on top of GisModule:
 *  1. Astronomical sun study (time-of-day / day-of-year) + 3D sun-path arc
 *  2. Interactive 3D section box (6 clipping planes + wireframe helper)
 *  3. Real 3D terrain mesh from Terrarium DEM tiles + cut/fill estimation
 *  4. IFC4 georeferencing export (IfcMapConversion / IfcProjectedCRS)
 *  5. Total-station CSV discrepancy heatmap (design vs. field)
 *  6. First-person walkthrough with floor-follow & wall collision
 *  7. IndexedDB offline basemap tile cache
 *
 * Pure math helpers are exported separately so they can be unit-tested
 * without a WebGL context.
 */

// ============================================================
// PURE HELPERS (unit-testable)
// ============================================================

export interface SolarSample {
  hour: number;
  azimuth: number; // degrees clockwise from North
  elevation: number; // degrees above horizon (may be negative)
}

/** NOAA / Spencer solar position for a given latitude, longitude, day-of-year and local solar-clock hour (UTC offset supplied). */
export function solarPosition(
  lat: number,
  lon: number,
  dayOfYear: number,
  hour: number,
  utcOffsetHours: number = Math.round(lon / 15)
): { azimuth: number; elevation: number } {
  const gamma = (2 * Math.PI * (dayOfYear - 1 + (hour - 12) / 24)) / 365;
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma);
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma));
  const timeOffset = eqTime + 4 * lon - 60 * utcOffsetHours;
  let tst = (hour * 60 + timeOffset) % 1440;
  if (tst < 0) tst += 1440;
  const ha = (tst / 4 - 180) * (Math.PI / 180);
  const latRad = (lat * Math.PI) / 180;
  const csz = Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(ha);
  const zen = Math.acos(Math.max(-1, Math.min(1, csz)));
  const elevation = 90 - (zen * 180) / Math.PI;
  const denom = Math.sin(zen) * Math.cos(latRad);
  let azimuth = 180;
  if (Math.abs(denom) > 1e-9) {
    const ca = (Math.sin(decl) - Math.cos(zen) * Math.sin(latRad)) / denom;
    azimuth = (Math.acos(Math.max(-1, Math.min(1, ca))) * 180) / Math.PI;
    if (ha > 0) azimuth = 360 - azimuth;
  }
  return { azimuth, elevation };
}

/** Samples the daily sun path (every `stepHours`). */
export function computeSunPath(lat: number, lon: number, dayOfYear: number, stepHours = 0.5, utcOffset?: number): SolarSample[] {
  const out: SolarSample[] = [];
  for (let h = 0; h <= 24 + 1e-9; h += stepHours) {
    const p = solarPosition(lat, lon, dayOfYear, h, utcOffset);
    out.push({ hour: h, azimuth: p.azimuth, elevation: p.elevation });
  }
  return out;
}

/** Approximate sunrise/sunset hours (first/last sample above horizon). */
export function computeDaylight(path: SolarSample[]): { sunrise: number | null; sunset: number | null; hours: number } {
  const lit = path.filter((s) => s.elevation > 0);
  if (!lit.length) return { sunrise: null, sunset: null, hours: 0 };
  const sunrise = lit[0].hour;
  const sunset = lit[lit.length - 1].hour;
  return { sunrise, sunset, hours: sunset - sunrise };
}

export function dayOfYearFromDate(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 0);
  const now = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((now - start) / 86400000);
}

/** Converts sun azimuth/elevation into a scene direction vector (Three.js: +Y up, -Z = model north before true-north rotation). */
export function sunDirection(azimuthDeg: number, elevationDeg: number, trueNorthDeg = 0): THREE.Vector3 {
  const az = ((azimuthDeg - trueNorthDeg) * Math.PI) / 180;
  const el = (elevationDeg * Math.PI) / 180;
  return new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), -Math.cos(el) * Math.cos(az)).normalize();
}

// ---------- Terrain ----------

/** Decodes a Mapzen/AWS Terrarium encoded pixel into metres. */
export function decodeTerrarium(r: number, g: number, b: number): number {
  return r * 256 + g + b / 256 - 32768;
}

/**
 * Cut/fill volume against a flat pad elevation.
 * heights: row-major grid (size×size) in metres, cellArea m².
 * Only cells inside `mask` (if provided) are considered.
 */
export function computeCutFill(
  heights: Float32Array | number[],
  padElevation: number,
  cellArea: number,
  mask?: (index: number) => boolean
): { cut: number; fill: number; net: number; cells: number } {
  let cut = 0;
  let fill = 0;
  let cells = 0;
  for (let i = 0; i < heights.length; i++) {
    if (mask && !mask(i)) continue;
    const d = heights[i] - padElevation;
    if (d > 0) cut += d * cellArea;
    else fill += -d * cellArea;
    cells++;
  }
  return { cut, fill, net: cut - fill, cells };
}

/** Procedural fallback terrain (smooth rolling hills) when DEM tiles are unavailable. */
export function proceduralHeights(size: number, amplitude = 6, seed = 1): Float32Array {
  const h = new Float32Array(size * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / (size - 1);
      const v = y / (size - 1);
      h[y * size + x] =
        amplitude *
        (0.55 * Math.sin(u * 3.1 * seed + 0.7) * Math.cos(v * 2.3 + 0.4 * seed) +
          0.3 * Math.sin((u + v) * 6.2) +
          0.15 * Math.cos(u * 11.0 - v * 7.0));
    }
  }
  return h;
}

// ---------- IFC4 Georeferencing ----------

export interface IfcGeoreferenceParams {
  eastings: number;
  northings: number;
  orthogonalHeight: number;
  trueNorthDeg: number; // clockwise from project +Y
  crsName: string; // e.g. "EPSG:32610"
  geodeticDatum?: string;
  verticalDatum?: string;
  mapProjection?: string;
  mapZone?: string;
  scale?: number;
  latitude: number;
  longitude: number;
}

/** Converts decimal degrees into the IFC compound plane angle [deg, min, sec, millionths]. */
export function toIfcCompoundAngle(dd: number): [number, number, number, number] {
  const sign = dd < 0 ? -1 : 1;
  let a = Math.abs(dd);
  const d = Math.floor(a);
  a = (a - d) * 60;
  const m = Math.floor(a);
  a = (a - m) * 60;
  const s = Math.floor(a);
  const us = Math.round((a - s) * 1e6);
  return [sign * d, sign * m, sign * s, sign * us];
}

/**
 * Builds the IFC4 STEP entity block for georeferencing (IfcMapConversion + IfcProjectedCRS).
 * XAxisAbscissa/Ordinate encode the rotation from project grid to map grid.
 */
export function buildIfcGeoreferencingStep(p: IfcGeoreferenceParams, startId = 9000): string {
  const rot = (-p.trueNorthDeg * Math.PI) / 180;
  const ax = Math.cos(rot);
  const ay = Math.sin(rot);
  const f = (n: number, d = 6) => {
    const s = n.toFixed(d);
    return s.includes(".") ? s : s + ".";
  };
  const id = (o: number) => `#${startId + o}`;
  const lat = toIfcCompoundAngle(p.latitude).join(",");
  const lon = toIfcCompoundAngle(p.longitude).join(",");
  return [
    `${id(0)}=IFCPROJECTEDCRS('${p.crsName}','WGS84 / UTM','${p.geodeticDatum ?? "WGS84"}','${p.verticalDatum ?? "MSL"}','${p.mapProjection ?? "UTM"}','${p.mapZone ?? ""}',$);`,
    `${id(1)}=IFCMAPCONVERSION(#CONTEXT,${id(0)},${f(p.eastings, 4)},${f(p.northings, 4)},${f(p.orthogonalHeight, 4)},${f(ax, 9)},${f(ay, 9)},${f(p.scale ?? 1, 4)});`,
    `/* IFCSITE RefLatitude (${lat}) RefLongitude (${lon}) RefElevation ${f(p.orthogonalHeight, 3)} */`,
  ].join("\n");
}

/** Injects georeferencing entities into an existing IFC4 STEP text, binding to the first IfcGeometricRepresentationContext. */
export function injectGeoreferencingIntoIfc(ifcText: string, p: IfcGeoreferenceParams): string {
  const ctx = ifcText.match(/#(\d+)\s*=\s*IFCGEOMETRICREPRESENTATIONCONTEXT\s*\(/i);
  const maxId = Array.from(ifcText.matchAll(/^#(\d+)\s*=/gim)).reduce((m, r) => Math.max(m, Number(r[1])), 0);
  let block = buildIfcGeoreferencingStep(p, maxId + 1);
  block = block.replace("#CONTEXT", ctx ? `#${ctx[1]}` : "$");
  // Strip any pre-existing georeferencing entities
  let out = ifcText.replace(/^#\d+\s*=\s*IFC(MAPCONVERSION|PROJECTEDCRS)\s*\([^;]*\);\s*$/gim, "");
  if (/ENDSEC;\s*END-ISO-10303-21;/i.test(out)) {
    out = out.replace(/ENDSEC;(\s*END-ISO-10303-21;)/i, `${block}\nENDSEC;$1`);
  } else {
    out += "\n" + block;
  }
  return out;
}

/** Generates a minimal standalone IFC4 georeferencing file (header + project context + map conversion). */
export function buildStandaloneIfcGeoreference(p: IfcGeoreferenceParams, projectName = "BIM Kintsugi Site"): string {
  const now = new Date().toISOString().slice(0, 19);
  const lat = toIfcCompoundAngle(p.latitude).join(",");
  const lon = toIfcCompoundAngle(p.longitude).join(",");
  const tn = (p.trueNorthDeg * Math.PI) / 180;
  const body = [
    `#1=IFCCARTESIANPOINT((0.,0.,0.));`,
    `#2=IFCAXIS2PLACEMENT3D(#1,$,$);`,
    `#3=IFCDIRECTION((${(-Math.sin(tn)).toFixed(9)},${Math.cos(tn).toFixed(9)}));`,
    `#4=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,1.E-05,#2,#3);`,
    `#5=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);`,
    `#6=IFCUNITASSIGNMENT((#5));`,
    `#7=IFCPROJECT('3kZ$Kintsugi0000000001',$,'${projectName}',$,$,$,$,(#4),#6);`,
    `#8=IFCLOCALPLACEMENT($,#2);`,
    `#9=IFCSITE('3kZ$Kintsugi0000000002',$,'Site',$,$,#8,$,$,.ELEMENT.,(${lat}),(${lon}),${p.orthogonalHeight.toFixed(3)},$,$);`,
    `#10=IFCRELAGGREGATES('3kZ$Kintsugi0000000003',$,$,$,#7,(#9));`,
    buildIfcGeoreferencingStep(p, 11).replace("#CONTEXT", "#4"),
  ].join("\n");
  return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [ReferenceView_V1.2]'),'2;1');
FILE_NAME('${projectName}.ifc','${now}',('BIM Kintsugi'),('BIM Kintsugi'),'BIM Kintsugi GeoBIM','BIM Kintsugi','');
FILE_SCHEMA(('IFC4'));
ENDSEC;
DATA;
${body}
ENDSEC;
END-ISO-10303-21;
`;
}

// ---------- Survey Discrepancy ----------

export interface SurveyFieldPoint {
  id: string;
  x: number; // local easting offset (m)
  y: number; // elevation (m)
  z: number; // local northing offset (m)
}

export interface SurveyDiscrepancy {
  id: string;
  design: SurveyFieldPoint;
  field: SurveyFieldPoint;
  dx: number;
  dy: number;
  dz: number;
  ds: number; // 3D vector length (m)
  status: "pass" | "warn" | "fail";
}

export interface ToleranceSpec {
  passMm: number;
  warnMm: number;
}

export const DEFAULT_TOLERANCE: ToleranceSpec = { passMm: 15, warnMm: 30 };

/**
 * Parses total-station CSV. Accepts headers (id,x,y,z | id,e,n,h | point,easting,northing,elevation)
 * or headerless "id,x,y,z". When E/N/H columns are used, N maps to scene Z and H to scene Y.
 */
export function parseSurveyCsv(text: string): SurveyFieldPoint[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  if (!lines.length) return [];
  const split = (l: string) => l.split(/[,;\t]/).map((s) => s.trim().replace(/^"|"$/g, ""));
  const first = split(lines[0]).map((s) => s.toLowerCase());
  const hasHeader = first.some((c) => isNaN(Number(c)) && /^(id|point|name|pt|x|y|z|e|n|h|easting|northing|elevation|east|north|height|code)$/.test(c));
  let idI = 0, xI = 1, yI = 2, zI = 3;
  let enh = false;
  if (hasHeader) {
    const find = (...names: string[]) => first.findIndex((c) => names.includes(c));
    idI = Math.max(0, find("id", "point", "name", "pt"));
    const e = find("e", "easting", "east");
    const n = find("n", "northing", "north");
    const h = find("h", "elevation", "height", "elev");
    if (e >= 0 && n >= 0 && h >= 0) {
      enh = true;
      xI = e; zI = n; yI = h;
    } else {
      xI = find("x"); yI = find("y"); zI = find("z");
      if (xI < 0 || yI < 0 || zI < 0) { xI = 1; yI = 2; zI = 3; }
    }
  }
  const out: SurveyFieldPoint[] = [];
  for (const line of hasHeader ? lines.slice(1) : lines) {
    const c = split(line);
    const x = Number(c[xI]);
    const y = Number(c[yI]);
    const z = Number(c[zI]);
    if (!c[idI] || [x, y, z].some((v) => !isFinite(v))) continue;
    out.push({ id: c[idI], x, y, z: enh ? -z : z });
  }
  return out;
}

export function classifyDeviation(dsMeters: number, tol: ToleranceSpec = DEFAULT_TOLERANCE): "pass" | "warn" | "fail" {
  const mm = dsMeters * 1000;
  if (mm <= tol.passMm) return "pass";
  if (mm <= tol.warnMm) return "warn";
  return "fail";
}

export function computeDiscrepancies(
  design: SurveyFieldPoint[],
  field: SurveyFieldPoint[],
  tol: ToleranceSpec = DEFAULT_TOLERANCE
): SurveyDiscrepancy[] {
  const map = new Map(design.map((d) => [d.id.toUpperCase(), d]));
  const out: SurveyDiscrepancy[] = [];
  for (const f of field) {
    const d = map.get(f.id.toUpperCase());
    if (!d) continue;
    const dx = f.x - d.x;
    const dy = f.y - d.y;
    const dz = f.z - d.z;
    const ds = Math.sqrt(dx * dx + dy * dy + dz * dz);
    out.push({ id: d.id, design: d, field: f, dx, dy, dz, ds, status: classifyDeviation(ds, tol) });
  }
  return out;
}

export function summarizeDiscrepancies(list: SurveyDiscrepancy[]) {
  const n = list.length;
  const rms = n ? Math.sqrt(list.reduce((s, d) => s + d.ds * d.ds, 0) / n) : 0;
  const max = list.reduce((m, d) => Math.max(m, d.ds), 0);
  return {
    count: n,
    pass: list.filter((d) => d.status === "pass").length,
    warn: list.filter((d) => d.status === "warn").length,
    fail: list.filter((d) => d.status === "fail").length,
    rmsMm: rms * 1000,
    maxMm: max * 1000,
  };
}

export function discrepanciesToCsv(list: SurveyDiscrepancy[]): string {
  const rows = ["Point,Design X,Design Y,Design Z,Field X,Field Y,Field Z,dX (mm),dY (mm),dZ (mm),3D Drift (mm),Status"];
  for (const d of list) {
    rows.push(
      [
        d.id,
        d.design.x.toFixed(4), d.design.y.toFixed(4), d.design.z.toFixed(4),
        d.field.x.toFixed(4), d.field.y.toFixed(4), d.field.z.toFixed(4),
        (d.dx * 1000).toFixed(1), (d.dy * 1000).toFixed(1), (d.dz * 1000).toFixed(1),
        (d.ds * 1000).toFixed(1), d.status.toUpperCase(),
      ].join(",")
    );
  }
  return rows.join("\n");
}

// ---------- Walkthrough collision ----------

/**
 * Resolves a horizontal move against an obstacle hit distance.
 * Returns the allowed travel distance along the requested direction.
 */
export function resolveWalkStep(requested: number, obstacleDistance: number | null, radius = 0.35): number {
  if (obstacleDistance === null) return requested;
  return Math.max(0, Math.min(requested, obstacleDistance - radius));
}

/** Smoothly settles eye height onto a detected floor (with max step-up for stairs). */
export function resolveEyeHeight(
  currentEyeY: number,
  floorY: number | null,
  eyeHeight = 1.65,
  maxStep = 0.45,
  lerp = 0.35
): number {
  if (floorY === null) return currentEyeY;
  const currentFeet = currentEyeY - eyeHeight;
  // Ignore floors that are too high to step onto (e.g. tables) — keep current level
  if (floorY - currentFeet > maxStep) return currentEyeY;
  const target = floorY + eyeHeight;
  return currentEyeY + (target - currentEyeY) * lerp;
}

// ============================================================
// INDEXEDDB TILE CACHE
// ============================================================

export class GisTileCache {
  private static dbPromise: Promise<IDBDatabase | null> | null = null;
  private static memo = new Map<string, string>();
  public static enabled = true;
  private static readonly DB = "bim-kintsugi-tiles";
  private static readonly STORE = "tiles";

  private static open(): Promise<IDBDatabase | null> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise((resolve) => {
      try {
        if (typeof indexedDB === "undefined") return resolve(null);
        const req = indexedDB.open(this.DB, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(this.STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
    return this.dbPromise;
  }

  private static async get(url: string): Promise<Blob | null> {
    const db = await this.open();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const r = db.transaction(this.STORE, "readonly").objectStore(this.STORE).get(url);
        r.onsuccess = () => resolve((r.result as Blob) || null);
        r.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private static async put(url: string, blob: Blob): Promise<void> {
    const db = await this.open();
    if (!db) return;
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(this.STORE, "readwrite");
        tx.objectStore(this.STORE).put(blob, url);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /** Returns an object URL for a cached tile, or the original URL. */
  public static async resolve(url: string): Promise<string> {
    if (!this.enabled) return url;
    const m = this.memo.get(url);
    if (m) return m;
    const blob = await this.get(url);
    if (!blob) return url;
    const obj = URL.createObjectURL(blob);
    this.memo.set(url, obj);
    return obj;
  }

  /** Fetches and stores a tile (fire-and-forget). */
  public static async store(url: string): Promise<boolean> {
    if (!this.enabled || url.startsWith("blob:") || url.startsWith("data:")) return false;
    try {
      if (await this.get(url)) return true;
      const res = await fetch(url, { mode: "cors" });
      if (!res.ok) return false;
      await this.put(url, await res.blob());
      return true;
    } catch {
      return false;
    }
  }

  public static async stats(): Promise<{ count: number; bytes: number }> {
    const db = await this.open();
    if (!db) return { count: 0, bytes: 0 };
    return new Promise((resolve) => {
      let count = 0;
      let bytes = 0;
      try {
        const req = db.transaction(this.STORE, "readonly").objectStore(this.STORE).openCursor();
        req.onsuccess = () => {
          const c = req.result;
          if (c) {
            count++;
            bytes += (c.value as Blob)?.size || 0;
            c.continue();
          } else resolve({ count, bytes });
        };
        req.onerror = () => resolve({ count, bytes });
      } catch {
        resolve({ count, bytes });
      }
    });
  }

  public static async clear(): Promise<void> {
    const db = await this.open();
    this.memo.forEach((u) => URL.revokeObjectURL(u));
    this.memo.clear();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(this.STORE, "readwrite");
      tx.objectStore(this.STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  }
}

// ============================================================
// 3D SUITE (scene-bound)
// ============================================================

const HELPER_TAG = "geoSuiteHelper";

export class GeoEngineeringSuite {
  private static instance: GeoEngineeringSuite;
  private world: any = null;

  // Sun study
  private sunGroup = new THREE.Group();
  private sunAnimId: number | null = null;
  public sunState = { dayOfYear: 172, hour: 12, lat: 37.7749, lon: -122.4194, trueNorth: 0, utcOffset: -8 };

  // Section box
  private boxPlanes: THREE.Plane[] = [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, -1, 0), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), 0),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),
  ];
  private boxHelper: THREE.Box3Helper | null = null;
  public sectionBox = new THREE.Box3(new THREE.Vector3(-25, -2, -25), new THREE.Vector3(25, 30, 25));
  public modelBounds = new THREE.Box3(new THREE.Vector3(-25, -2, -25), new THREE.Vector3(25, 30, 25));
  public sectionBoxEnabled = false;

  // Terrain
  private terrainMesh: THREE.Mesh | null = null;
  private contourLines: THREE.LineSegments | null = null;
  public terrainInfo: { source: "dem" | "procedural"; size: number; radius: number; min: number; max: number; heights: Float32Array } | null = null;

  // Discrepancy
  private discrepancyGroup = new THREE.Group();
  public discrepancies: SurveyDiscrepancy[] = [];

  // Walkthrough
  public walkActive = false;
  private walkKeys = new Set<string>();
  private walkYaw = 0;
  private walkPitch = 0;
  private walkAnimId: number | null = null;
  private walkColliders: THREE.Object3D[] = [];
  private walkRaycaster = new THREE.Raycaster();
  private walkLastT = 0;
  public walkConfig = { speed: 3.2, eyeHeight: 1.65, collision: true };
  private walkHandlers: { [k: string]: (e: any) => void } = {};

  public static getInstance(): GeoEngineeringSuite {
    if (!GeoEngineeringSuite.instance) GeoEngineeringSuite.instance = new GeoEngineeringSuite();
    return GeoEngineeringSuite.instance;
  }

  private fragmentsCore: any = null;

  public init(world: any, fragmentsCore?: any) {
    this.world = world;
    if (fragmentsCore) this.fragmentsCore = fragmentsCore;
    const scene: THREE.Scene | undefined = world?.scene?.three;
    if (!scene) return;
    for (const [g, name] of [
      [this.sunGroup, "GeoSuite_SunPath"],
      [this.discrepancyGroup, "GeoSuite_Discrepancy"],
    ] as [THREE.Group, string][]) {
      g.name = name;
      g.userData[HELPER_TAG] = true;
      if (!g.parent) scene.add(g);
    }
  }

  private render() {
    try {
      const r = this.world?.renderer;
      if (r?.three && this.world.scene?.three && this.world.camera?.three) {
        r.three.render(this.world.scene.three, this.world.camera.three);
      }
      if (r) {
        r.needsUpdate = true;
        if (typeof (r as any).update === "function") {
          (r as any).update();
        }
      }
    } catch {
      /* noop */
    }
  }

  private isHelper(o: THREE.Object3D): boolean {
    let p: THREE.Object3D | null = o;
    while (p) {
      if (p.userData?.[HELPER_TAG] || /gis|basemap|compass|survey|grid|anchor|cadastre|gizmo|helper|sky/i.test(p.name || "")) return true;
      p = p.parent;
    }
    return false;
  }

  /** Bounding box of real model geometry (excludes GIS/helper groups). */
  public computeModelBounds(): THREE.Box3 {
    const box = new THREE.Box3();
    const scene: THREE.Scene | undefined = this.world?.scene?.three;
    if (scene) {
      scene.traverse((o: any) => {
        if (!o.isMesh || !o.visible || this.isHelper(o)) return;
        if (o.geometry && !o.geometry.boundingBox) o.geometry.computeBoundingBox?.();
        const b = new THREE.Box3().setFromObject(o);
        if (isFinite(b.min.x) && b.getSize(new THREE.Vector3()).length() < 5000) box.union(b);
      });
    }
    if (box.isEmpty()) box.set(new THREE.Vector3(-25, -2, -25), new THREE.Vector3(25, 30, 25));
    this.modelBounds.copy(box);
    return box;
  }

  // ---------------- 1. SUN STUDY ----------------

  public setSunSite(lat: number, lon: number, trueNorth: number) {
    this.sunState.lat = lat;
    this.sunState.lon = lon;
    this.sunState.trueNorth = trueNorth;
    this.sunState.utcOffset = Math.round(lon / 15);
  }

  public getSunNow() {
    const s = this.sunState;
    return solarPosition(s.lat, s.lon, s.dayOfYear, s.hour, s.utcOffset);
  }

  /** Applies current sun to the scene directional light via the global hook and redraws the arc. */
  public applySun(): { azimuth: number; elevation: number } {
    const sun = this.getSunNow();
    // Scene north is -Z (rotated by true north). The legacy light hook places azimuth 0 on +Z,
    // so convert: hookAz = 180 - sceneAz.
    const sceneAz = sun.azimuth - this.sunState.trueNorth;
    const az = (((180 - sceneAz) % 360) + 360) % 360;
    const w = typeof window !== "undefined" ? (window as any) : null;
    if (w && typeof w.updateSunPosition === "function") {
      w.updateSunPosition(az, Math.max(0.5, sun.elevation));
    }
    this.drawSunPath();
    return sun;
  }

  public drawSunPath(visible = true) {
    this.sunGroup.clear();
    this.sunGroup.visible = visible;
    if (!visible) return this.render();
    const s = this.sunState;
    const R = Math.max(30, this.modelBounds.getSize(new THREE.Vector3()).length() * 0.9);
    const c = this.modelBounds.getCenter(new THREE.Vector3());
    c.y = this.modelBounds.min.y;
    const path = computeSunPath(s.lat, s.lon, s.dayOfYear, 0.25, s.utcOffset);
    const pts: THREE.Vector3[] = [];
    for (const p of path) {
      if (p.elevation < -2) continue;
      pts.push(sunDirection(p.azimuth, Math.max(0, p.elevation), s.trueNorth).multiplyScalar(R).add(c));
    }
    if (pts.length > 1) {
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineDashedMaterial({ color: 0xfbbf24, dashSize: 1.2, gapSize: 0.6, depthTest: false, transparent: true, opacity: 0.9 })
      );
      line.computeLineDistances();
      line.renderOrder = 9990;
      this.sunGroup.add(line);
    }
    // Hour ticks
    for (const p of path) {
      if (p.elevation <= 0 || Math.abs(p.hour - Math.round(p.hour)) > 1e-6) continue;
      const m = new THREE.Mesh(
        new THREE.SphereGeometry(R * 0.008, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0xfde68a, depthTest: false })
      );
      m.position.copy(sunDirection(p.azimuth, p.elevation, s.trueNorth).multiplyScalar(R).add(c));
      m.renderOrder = 9991;
      this.sunGroup.add(m);
    }
    // Current sun
    const now = this.getSunNow();
    if (now.elevation > -2) {
      const sunPos = sunDirection(now.azimuth, Math.max(0, now.elevation), s.trueNorth).multiplyScalar(R).add(c);
      const sun = new THREE.Mesh(
        new THREE.SphereGeometry(R * 0.03, 24, 24),
        new THREE.MeshBasicMaterial({ color: now.elevation > 0 ? 0xffc83d : 0xf97316, depthTest: false })
      );
      sun.position.copy(sunPos);
      sun.renderOrder = 9992;
      const ray = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([sunPos, c.clone()]),
        new THREE.LineBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.35, depthTest: false })
      );
      this.sunGroup.add(sun, ray);
    }
    this.render();
  }

  public hideSunPath() {
    this.drawSunPath(false);
  }

  public isPlayingDayCycle(): boolean {
    return this.sunAnimId !== null;
  }

  public stopDayCycle() {
    if (this.sunAnimId !== null) {
      cancelAnimationFrame(this.sunAnimId);
      this.sunAnimId = null;
    }
  }

  public playDayCycle(onTick: (hour: number, sun: { azimuth: number; elevation: number }) => void): boolean {
    if (this.sunAnimId !== null) {
      this.stopDayCycle();
      return false;
    }
    // Automatically ensure sun path group is visible so user sees the sun movement
    if (!this.sunGroup.visible) {
      this.sunGroup.visible = true;
    }
    let last = performance.now();
    const step = (t: number) => {
      const dt = Math.min(0.2, (t - last) / 1000); // cap delta time to avoid large jumps
      last = t;
      this.sunState.hour += dt * 1.5; // 1.5 daylight hours per real second
      if (this.sunState.hour >= 21) this.sunState.hour = 5;
      const sun = this.applySun();
      onTick(this.sunState.hour, sun);
      this.sunAnimId = requestAnimationFrame(step);
    };
    this.sunAnimId = requestAnimationFrame(step);
    return true;
  }

  // ---------------- 2. SECTION BOX ----------------

  private getRendererThree(): THREE.WebGLRenderer | null {
    return this.world?.renderer?.three || null;
  }

  public setSectionBoxEnabled(enabled: boolean) {
    this.sectionBoxEnabled = enabled;
    const r = this.getRendererThree();
    if (r) r.clippingPlanes = enabled ? this.boxPlanes : [];
    if (enabled && !this.boxHelper) {
      this.boxHelper = new THREE.Box3Helper(this.sectionBox, new THREE.Color(0xd4ff3f));
      this.boxHelper.name = "GeoSuite_SectionBoxHelper";
      this.boxHelper.userData[HELPER_TAG] = true;
      (this.boxHelper.material as THREE.LineBasicMaterial).depthTest = false;
      this.boxHelper.renderOrder = 9995;
      this.world?.scene?.three?.add(this.boxHelper);
    }
    if (this.boxHelper) this.boxHelper.visible = enabled;
    this.updateSectionBox();
  }

  public fitSectionBoxToModel(padding = 0.5) {
    const b = this.computeModelBounds().clone().expandByScalar(padding);
    this.sectionBox.copy(b);
    this.updateSectionBox();
  }

  /** Sets one axis bound expressed as fraction 0..1 of model bounds. */
  public setSectionBoxFraction(axis: "x" | "y" | "z", side: "min" | "max", t: number) {
    const mb = this.modelBounds;
    const v = mb.min[axis] + (mb.max[axis] - mb.min[axis]) * Math.max(0, Math.min(1, t));
    if (side === "min") this.sectionBox.min[axis] = Math.min(v, this.sectionBox.max[axis] - 0.05);
    else this.sectionBox.max[axis] = Math.max(v, this.sectionBox.min[axis] + 0.05);
    this.updateSectionBox();
  }

  public updateSectionBox() {
    const b = this.sectionBox;
    this.boxPlanes[0].constant = -b.min.x;
    this.boxPlanes[1].constant = b.max.x;
    this.boxPlanes[2].constant = -b.min.y;
    this.boxPlanes[3].constant = b.max.y;
    this.boxPlanes[4].constant = -b.min.z;
    this.boxPlanes[5].constant = b.max.z;
    try {
      this.fragmentsCore?.update?.(true);
    } catch {
      /* noop */
    }
    this.render();
  }

  // ---------------- 3. TERRAIN ----------------

  /**
   * Builds a 3D terrain mesh around the site using Terrarium DEM tiles (AWS open data),
   * falling back to procedural hills when offline.
   */
  public async buildTerrain(opts: {
    lat: number;
    lon: number;
    radius: number;
    exaggeration?: number;
    contourInterval?: number;
    segments?: number;
    texture?: THREE.Texture | null;
    siteElevation?: number;
  }): Promise<NonNullable<GeoEngineeringSuite["terrainInfo"]>> {
    const seg = opts.segments ?? 96;
    const size = seg + 1;
    const ex = opts.exaggeration ?? 1;
    let heights: Float32Array | null = null;
    let source: "dem" | "procedural" = "dem";
    try {
      heights = await this.sampleDem(opts.lat, opts.lon, opts.radius, size);
    } catch {
      heights = null;
    }
    if (!heights) {
      source = "procedural";
      heights = proceduralHeights(size, Math.min(12, opts.radius * 0.02));
    } else {
      // Relative to site datum (centre sample)
      const center = heights[Math.floor(size / 2) * size + Math.floor(size / 2)];
      for (let i = 0; i < heights.length; i++) heights[i] -= center;
    }
    let min = Infinity, max = -Infinity;
    for (const h of heights) { min = Math.min(min, h); max = Math.max(max, h); }

    this.removeTerrain();
    const geo = new THREE.PlaneGeometry(opts.radius * 2, opts.radius * 2, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const colors = new Float32Array(pos.count * 3);
    const low = new THREE.Color(0x166534), mid = new THREE.Color(0xa3a35a), high = new THREE.Color(0xf1f5f9);
    for (let i = 0; i < pos.count; i++) {
      const h = heights[i] * ex;
      pos.setY(i, h - 0.08);
      const t = max > min ? (heights[i] - min) / (max - min) : 0.5;
      const c = t < 0.5 ? low.clone().lerp(mid, t * 2) : mid.clone().lerp(high, (t - 0.5) * 2);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = opts.texture
      ? new THREE.MeshStandardMaterial({ map: opts.texture, roughness: 0.95, side: THREE.DoubleSide })
      : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = "GeoSuite_TerrainMesh";
    mesh.userData[HELPER_TAG] = true;
    mesh.receiveShadow = true;
    this.world?.scene?.three?.add(mesh);
    this.terrainMesh = mesh;

    // Contours
    const interval = opts.contourInterval ?? Math.max(1, Math.round((max - min) / 12) || 1);
    this.contourLines = this.buildContours(heights, size, opts.radius, interval, ex);
    if (this.contourLines) this.world?.scene?.three?.add(this.contourLines);

    this.terrainInfo = { source, size, radius: opts.radius, min, max, heights };
    this.render();
    return this.terrainInfo;
  }

  private async sampleDem(lat: number, lon: number, radius: number, size: number): Promise<Float32Array | null> {
    if (typeof document === "undefined") return null;
    const metersPerDegLat = 111320;
    const metersPerDegLon = 111320 * Math.cos((lat * Math.PI) / 180);
    const dLat = radius / metersPerDegLat;
    const dLon = radius / metersPerDegLon;
    // Pick zoom so the extent spans ~2-3 tiles
    const tileMeters = (z: number) => (40075016 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, z);
    let z = 15;
    while (z > 8 && tileMeters(z) < radius) z--;
    const lonToX = (lo: number) => ((lo + 180) / 360) * Math.pow(2, z);
    const latToY = (la: number) => {
      const r = (la * Math.PI) / 180;
      return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * Math.pow(2, z);
    };
    const x0 = Math.floor(lonToX(lon - dLon)), x1 = Math.floor(lonToX(lon + dLon));
    const y0 = Math.floor(latToY(lat + dLat)), y1 = Math.floor(latToY(lat - dLat));
    if ((x1 - x0 + 1) * (y1 - y0 + 1) > 16) return null;
    const W = (x1 - x0 + 1) * 256, H = (y1 - y0 + 1) * 256;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const loads: Promise<boolean>[] = [];
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        const url = `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${tx}/${ty}.png`;
        loads.push(
          (async () => {
            const src = await GisTileCache.resolve(url);
            return new Promise<boolean>((res) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => {
                ctx.drawImage(img, (tx - x0) * 256, (ty - y0) * 256);
                GisTileCache.store(url);
                res(true);
              };
              img.onerror = () => res(false);
              img.src = src;
            });
          })()
        );
      }
    }
    const ok = await Promise.all(loads);
    if (ok.some((v) => !v)) return null;
    const data = ctx.getImageData(0, 0, W, H).data;
    const out = new Float32Array(size * size);
    for (let j = 0; j < size; j++) {
      // PlaneGeometry rotated -90° X: row 0 is far side (-Z = north)
      const la = lat + dLat - (2 * dLat * j) / (size - 1);
      for (let i = 0; i < size; i++) {
        const lo = lon - dLon + (2 * dLon * i) / (size - 1);
        const px = Math.min(W - 1, Math.max(0, Math.floor((lonToX(lo) - x0) * 256)));
        const py = Math.min(H - 1, Math.max(0, Math.floor((latToY(la) - y0) * 256)));
        const k = (py * W + px) * 4;
        out[j * size + i] = decodeTerrarium(data[k], data[k + 1], data[k + 2]);
      }
    }
    return out;
  }

  private buildContours(h: Float32Array, size: number, radius: number, interval: number, ex: number): THREE.LineSegments | null {
    const verts: number[] = [];
    const cell = (radius * 2) / (size - 1);
    const P = (i: number, j: number) => [-radius + i * cell, -radius + j * cell];
    let min = Infinity, max = -Infinity;
    for (const v of h) { min = Math.min(min, v); max = Math.max(max, v); }
    for (let level = Math.ceil(min / interval) * interval; level <= max; level += interval) {
      for (let j = 0; j < size - 1; j++) {
        for (let i = 0; i < size - 1; i++) {
          const c = [
            [i, j, h[j * size + i]],
            [i + 1, j, h[j * size + i + 1]],
            [i + 1, j + 1, h[(j + 1) * size + i + 1]],
            [i, j + 1, h[(j + 1) * size + i]],
          ];
          const cross: number[][] = [];
          for (let e = 0; e < 4; e++) {
            const a = c[e], b = c[(e + 1) % 4];
            if ((a[2] - level) * (b[2] - level) < 0) {
              const t = (level - a[2]) / (b[2] - a[2]);
              const pa = P(a[0], a[1]), pb = P(b[0], b[1]);
              cross.push([pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t]);
            }
          }
          if (cross.length >= 2) {
            verts.push(cross[0][0], level * ex + 0.03, cross[0][1], cross[1][0], level * ex + 0.03, cross[1][1]);
          }
          if (cross.length === 4) {
            verts.push(cross[2][0], level * ex + 0.03, cross[2][1], cross[3][0], level * ex + 0.03, cross[3][1]);
          }
        }
      }
    }
    if (!verts.length) return null;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.55 }));
    lines.name = "GeoSuite_Contours";
    lines.userData[HELPER_TAG] = true;
    return lines;
  }

  public setTerrainVisible(v: boolean) {
    if (this.terrainMesh) this.terrainMesh.visible = v;
    if (this.contourLines) this.contourLines.visible = v;
    this.render();
  }

  public removeTerrain() {
    for (const o of [this.terrainMesh, this.contourLines]) {
      if (!o) continue;
      o.parent?.remove(o);
      (o as any).geometry?.dispose?.();
      const m = (o as any).material;
      (Array.isArray(m) ? m : [m]).forEach((mm: any) => mm?.dispose?.());
    }
    this.terrainMesh = null;
    this.contourLines = null;
    this.terrainInfo = null;
    this.render();
  }

  /** Cut/fill for the model footprint at a pad elevation (relative metres). */
  public computeFootprintCutFill(padElevation = 0) {
    if (!this.terrainInfo) return null;
    const { heights, size, radius } = this.terrainInfo;
    const cell = (radius * 2) / (size - 1);
    const b = this.computeModelBounds();
    const mask = (idx: number) => {
      const i = idx % size, j = Math.floor(idx / size);
      const x = -radius + i * cell, z = -radius + j * cell;
      return x >= b.min.x && x <= b.max.x && z >= b.min.z && z <= b.max.z;
    };
    return computeCutFill(heights, padElevation, cell * cell, mask);
  }

  // ---------------- 5. DISCREPANCY ----------------

  public showDiscrepancies(list: SurveyDiscrepancy[], exaggeration = 200) {
    this.discrepancies = list;
    this.discrepancyGroup.clear();
    const colors = { pass: 0x10b981, warn: 0xf59e0b, fail: 0xef4444 };
    for (const d of list) {
      const color = colors[d.status];
      const from = new THREE.Vector3(d.design.x, d.design.y, d.design.z);
      const delta = new THREE.Vector3(d.dx, d.dy, d.dz);
      const len = delta.length();
      const marker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.35),
        new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.95 })
      );
      marker.position.copy(from);
      marker.renderOrder = 9993;
      this.discrepancyGroup.add(marker);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.5, 0.5 + Math.min(3, len * exaggeration * 0.25), 32),
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.35, depthTest: false })
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.copy(from);
      this.discrepancyGroup.add(ring);
      if (len > 1e-6) {
        const arrow = new THREE.ArrowHelper(delta.clone().normalize(), from, Math.max(0.6, len * exaggeration), color, 0.4, 0.25);
        (arrow.line.material as THREE.Material).depthTest = false;
        (arrow.cone.material as THREE.Material).depthTest = false;
        arrow.renderOrder = 9994;
        this.discrepancyGroup.add(arrow);
      }
    }
    this.discrepancyGroup.visible = true;
    this.render();
  }

  public clearDiscrepancies() {
    this.discrepancies = [];
    this.discrepancyGroup.clear();
    this.render();
  }

  // ---------------- 6. WALKTHROUGH ----------------

  public startWalkthrough(onExit?: () => void): boolean {
    const cam: THREE.PerspectiveCamera | undefined = this.world?.camera?.three;
    const controls = this.world?.camera?.controls;
    const dom: HTMLElement | undefined = this.world?.renderer?.three?.domElement;
    if (!cam || !dom || this.walkActive) return false;
    this.walkActive = true;
    if (controls) controls.enabled = false;

    // Colliders: model meshes only
    this.walkColliders = [];
    this.world.scene.three.traverse((o: any) => {
      if (o.isMesh && o.visible && !this.isHelper(o)) this.walkColliders.push(o);
    });

    // Start position: model bounds south edge at eye height, facing centre
    const b = this.computeModelBounds();
    const c = b.getCenter(new THREE.Vector3());
    const start = new THREE.Vector3(c.x, b.min.y + this.walkConfig.eyeHeight, b.max.z + 4);
    cam.position.copy(start);
    this.walkYaw = 0;
    this.walkPitch = 0;
    cam.rotation.set(0, 0, 0, "YXZ");

    this.walkHandlers.keydown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") {
        this.stopWalkthrough();
        onExit?.();
        return;
      }
      this.walkKeys.add(e.key.toLowerCase());
    };
    this.walkHandlers.keyup = (e: KeyboardEvent) => this.walkKeys.delete(e.key.toLowerCase());
    this.walkHandlers.mousemove = (e: MouseEvent) => {
      if (document.pointerLockElement !== dom && !(e.buttons & 1)) return;
      this.walkYaw -= e.movementX * 0.0025;
      this.walkPitch = Math.max(-1.4, Math.min(1.4, this.walkPitch - e.movementY * 0.0025));
    };
    this.walkHandlers.click = () => {
      try { dom.requestPointerLock?.(); } catch { /* noop */ }
    };
    window.addEventListener("keydown", this.walkHandlers.keydown);
    window.addEventListener("keyup", this.walkHandlers.keyup);
    window.addEventListener("mousemove", this.walkHandlers.mousemove);
    dom.addEventListener("click", this.walkHandlers.click);

    this.walkLastT = performance.now();
    const loop = (t: number) => {
      if (!this.walkActive) return;
      const dt = Math.min(0.1, (t - this.walkLastT) / 1000);
      this.walkLastT = t;
      this.stepWalk(cam, dt);
      this.render();
      this.walkAnimId = requestAnimationFrame(loop);
    };
    this.walkAnimId = requestAnimationFrame(loop);
    return true;
  }

  private stepWalk(cam: THREE.PerspectiveCamera, dt: number) {
    const k = this.walkKeys;
    const run = k.has("shift") ? 2.2 : 1;
    const fwd = new THREE.Vector3(-Math.sin(this.walkYaw), 0, -Math.cos(this.walkYaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const move = new THREE.Vector3();
    if (k.has("w") || k.has("arrowup")) move.add(fwd);
    if (k.has("s") || k.has("arrowdown")) move.sub(fwd);
    if (k.has("d") || k.has("arrowright")) move.add(right);
    if (k.has("a") || k.has("arrowleft")) move.sub(right);
    if (k.has("e")) cam.position.y += dt * 2;
    if (k.has("q")) cam.position.y -= dt * 2;

    if (move.lengthSq() > 0) {
      move.normalize();
      let dist = this.walkConfig.speed * run * dt;
      if (this.walkConfig.collision && this.walkColliders.length) {
        const origin = cam.position.clone();
        origin.y -= this.walkConfig.eyeHeight * 0.5; // chest height
        this.walkRaycaster.set(origin, move);
        this.walkRaycaster.far = dist + 1;
        const hit = this.walkRaycaster.intersectObjects(this.walkColliders, false)[0];
        dist = resolveWalkStep(dist, hit ? hit.distance : null);
      }
      cam.position.addScaledVector(move, dist);
    }

    if (this.walkConfig.collision && this.walkColliders.length && !k.has("e") && !k.has("q")) {
      this.walkRaycaster.set(cam.position.clone().add(new THREE.Vector3(0, 0.3, 0)), new THREE.Vector3(0, -1, 0));
      this.walkRaycaster.far = 20;
      const floor = this.walkRaycaster.intersectObjects(this.walkColliders, false)[0];
      cam.position.y = resolveEyeHeight(cam.position.y, floor ? floor.point.y : this.modelBounds.min.y, this.walkConfig.eyeHeight);
    }

    cam.rotation.order = "YXZ";
    cam.rotation.y = this.walkYaw;
    cam.rotation.x = this.walkPitch;
    cam.updateMatrixWorld();
  }

  public stopWalkthrough() {
    if (!this.walkActive) return;
    this.walkActive = false;
    if (this.walkAnimId !== null) cancelAnimationFrame(this.walkAnimId);
    this.walkAnimId = null;
    window.removeEventListener("keydown", this.walkHandlers.keydown);
    window.removeEventListener("keyup", this.walkHandlers.keyup);
    window.removeEventListener("mousemove", this.walkHandlers.mousemove);
    this.world?.renderer?.three?.domElement?.removeEventListener("click", this.walkHandlers.click);
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch { /* noop */ }
    this.walkKeys.clear();
    const cam: THREE.PerspectiveCamera | undefined = this.world?.camera?.three;
    const controls = this.world?.camera?.controls;
    if (controls) {
      controls.enabled = true;
      if (cam) {
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
        const t = cam.position.clone().addScaledVector(dir, 5);
        controls.setLookAt?.(cam.position.x, cam.position.y, cam.position.z, t.x, t.y, t.z, false);
      }
    }
    this.render();
  }
}
