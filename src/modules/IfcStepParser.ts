export interface ParsedIfcElementRecord {
  expressId: number;
  type: string;
  Name: { value: string };
  GlobalId: { value: string };
  Storey: string;
  psets: Record<string, Record<string, string>>;
}

export interface IfcPreflightReport {
  schema: string;
  lengthUnitFactor: number;
  lengthUnitLabel: string;
  totalEntities: number;
  entityHistogram: Record<string, number>;
  hasMapConversion: boolean;
  hasProjectedCrs: boolean;
  hasAlignment: boolean;
  hasWorkSchedule: boolean;
  hasElementQuantities: boolean;
}

/**
 * Splits ISO-10303-21 STEP text into complete single-statement strings terminated by `;`,
 * preserving multi-line STEP entities safely across newline breaks.
 */
export function splitStepStatements(content: string): string[] {
  const out: string[] = [];
  if (!content) return out;
  let buf = "";
  let inString = false;

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === "'") {
      inString = !inString;
      buf += ch;
      continue;
    }
    if (!inString && ch === ";") {
      const trimmed = buf.trim();
      if (trimmed) out.push(trimmed);
      buf = "";
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      buf += " ";
    } else {
      buf += ch;
    }
  }
  const rem = buf.trim();
  if (rem) out.push(rem);
  return out;
}

/**
 * Fast streaming-capable pre-flight STEP inspector (detects schema, SI units,
 * entity counts, georeferencing, civil alignments, and 4D work schedules before full WASM parsing).
 */
export function scanIfcPreflight(content: string): IfcPreflightReport {
  let schema = "UNKNOWN";
  const schemaMatch = content.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i);
  if (schemaMatch) schema = schemaMatch[1].toUpperCase();

  let lengthUnitFactor = 1.0;
  let lengthUnitLabel = "m";
  if (/IFCSIUNIT\s*\([^,]*,\s*\.LENGTHUNIT\.\s*,\s*\.MILLI\.\s*,\s*\.METRE\./i.test(content)) {
    lengthUnitFactor = 0.001;
    lengthUnitLabel = "mm";
  } else if (/IFCSIUNIT\s*\([^,]*,\s*\.LENGTHUNIT\.\s*,\s*\.CENTI\.\s*,\s*\.METRE\./i.test(content)) {
    lengthUnitFactor = 0.01;
    lengthUnitLabel = "cm";
  } else if (/IFCCONVERSIONBASEDUNIT\s*\([^)]*'FOOT'/i.test(content)) {
    lengthUnitFactor = 0.3048;
    lengthUnitLabel = "ft";
  }

  const histogram: Record<string, number> = {};
  let totalEntities = 0;
  let hasMapConversion = false;
  let hasProjectedCrs = false;
  let hasAlignment = false;
  let hasWorkSchedule = false;
  let hasElementQuantities = false;

  const entityRe = /#\d+\s*=\s*(IFC[A-Z0-9_]+)\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = entityRe.exec(content)) !== null) {
    const ent = m[1].toUpperCase();
    totalEntities++;
    histogram[ent] = (histogram[ent] ?? 0) + 1;
    if (ent === "IFCMAPCONVERSION") hasMapConversion = true;
    else if (ent === "IFCPROJECTEDCRS") hasProjectedCrs = true;
    else if (ent.startsWith("IFCALIGNMENT")) hasAlignment = true;
    else if (ent === "IFCWORKSCHEDULE" || ent === "IFCWORKPLAN" || ent === "IFCTASK") hasWorkSchedule = true;
    else if (ent === "IFCELEMENTQUANTITY") hasElementQuantities = true;
  }

  return {
    schema,
    lengthUnitFactor,
    lengthUnitLabel,
    totalEntities,
    entityHistogram: histogram,
    hasMapConversion,
    hasProjectedCrs,
    hasAlignment,
    hasWorkSchedule,
    hasElementQuantities,
  };
}

/**
 * Pure, dependency-free STEP (ISO-10303-21) parser shared by main-thread parameter
 * readers and off-thread metadata Web Workers. Supports multi-line STEP entities,
 * Pset_*, and Qto_* element quantities (`IFCELEMENTQUANTITY` / `IFCQUANTITY*`).
 */
export function parseIfcStepText(content: string): Record<number, ParsedIfcElementRecord> {
  if (!content) return {};

  const statements = splitStepStatements(content);
  const propValues = new Map<number, { name: string; val: string }>();
  const psets = new Map<number, { name: string; pvalIds: number[] }>();
  const elemPsets = new Map<number, number[]>();
  const storeyNames = new Map<number, string>();
  const elemStorey = new Map<number, string>();
  const elements = new Map<number, { id: number; type: string; guid: string; name: string }>();

  const rePropVal =
    /^#(\d+)\s*=\s*IFCPROPERTYSINGLEVALUE\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*([A-Za-z0-9_]+)\s*\(\s*([^)]*)\s*\)/i;
  const rePhysQty =
    /^#(\d+)\s*=\s*IFCQUANTITY(?:LENGTH|AREA|VOLUME|WEIGHT|COUNT|TIME)\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*[^,]*\s*,\s*([-+\d.E]+)\s*(?:,|\))/i;
  const rePset =
    /^#(\d+)\s*=\s*IFCPROPERTYSET\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*'([^']*)'\s*,\s*[^,]*\s*,\s*\(([^)]*)\)/i;
  const reElemQty =
    /^#(\d+)\s*=\s*IFCELEMENTQUANTITY\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*'([^']*)'\s*,\s*[^,]*\s*,\s*[^,]*\s*,\s*\(([^)]*)\)/i;
  const reRelProp =
    /IFCRELDEFINESBYPROPERTIES\s*\([^,]+,[^,]+,[^,]+,[^,]+,\s*\(([^)]*)\)\s*,\s*#(\d+)/i;
  const reStorey = /^#(\d+)\s*=\s*IFCBUILDINGSTOREY\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*'([^']*)'/i;
  const reRelSpatial =
    /IFCRELCONTAINEDINSPATIALSTRUCTURE\s*\([^,]+,[^,]+,[^,]+,[^,]+,\s*\(([^)]*)\)\s*,\s*#(\d+)/i;
  const reElement =
    /^#(\d+)\s*=\s*(IFC[A-Z0-9_]+)s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*(?:'([^']*)'|\$)/i;

  const SKIP_TYPES = new Set([
    "IFCRELDEFINESBYPROPERTIES",
    "IFCRELDEFINESBYTYPE",
    "IFCRELCONTAINEDINSPATIALSTRUCTURE",
    "IFCRELASSOCIATESMATERIAL",
    "IFCRELVOIDSELEMENT",
    "IFCRELAGGREGATES",
    "IFCPROPERTYSET",
    "IFCELEMENTQUANTITY",
    "IFCPROPERTYSINGLEVALUE",
    "IFCQUANTITYLENGTH",
    "IFCQUANTITYAREA",
    "IFCQUANTITYVOLUME",
    "IFCQUANTITYWEIGHT",
    "IFCQUANTITYCOUNT",
    "IFCPOLYLOOP",
    "IFCFACEOUTERBOUND",
    "IFCFACE",
    "IFCSHAPEREPRESENTATION",
    "IFCSTYLEDITEM",
    "IFCPOLYLINE",
    "IFCCOMPOSITECURVESEGMENT",
    "IFCCLOSEDSHELL",
    "IFCFACETEDBREP",
    "IFCEXTRUDEDAREASOLID",
    "IFCTRIMMEDCURVE",
    "IFCCIRCLE",
    "IFCISHAPEPROFILEDEF",
    "IFCPRESENTATIONSTYLEASSIGNMENT",
    "IFCRECTANGLEPROFILEDEF",
    "IFCCOMPOSITECURVE",
    "IFCCOLOURRGB",
    "IFCREPRESENTATIONMAP",
    "IFCGRIDAXIS",
    "IFCCURVESTYLE",
    "IFCSWEPTDISKSOLID",
    "IFCMATERIALLAYERSETUSAGE",
    "IFCARBITRARYCLOSEDPROFILEDEF",
    "IFCDIRECTION",
    "IFCCARTESIANPOINT",
    "IFCAXIS2PLACEMENT3D",
    "IFCLOCALPLACEMENT",
  ]);

  const parseIdList = (raw: string): number[] =>
    raw
      .split(",")
      .map((s) => parseInt(s.replace(/#/g, "").trim(), 10))
      .filter((n) => !isNaN(n));

  for (let i = 0; i < statements.length; i++) {
    const line = statements[i];
    if (!line || line.startsWith("/*")) continue;

    let m = line.match(rePropVal);
    if (m) {
      const id = parseInt(m[1], 10);
      let val = m[4].replace(/^'|'$/g, "").trim();
      if (val === ".T.") val = "True";
      else if (val === ".F.") val = "False";
      propValues.set(id, { name: m[2], val });
      continue;
    }

    m = line.match(rePhysQty);
    if (m) {
      propValues.set(parseInt(m[1], 10), { name: m[2], val: m[3].trim() });
      continue;
    }

    m = line.match(rePset);
    if (m) {
      const id = parseInt(m[1], 10);
      psets.set(id, { name: m[3], pvalIds: parseIdList(m[4]) });
      continue;
    }

    m = line.match(reElemQty);
    if (m) {
      const id = parseInt(m[1], 10);
      psets.set(id, { name: m[3], pvalIds: parseIdList(m[4]) });
      continue;
    }

    m = line.match(reRelProp);
    if (m) {
      const elemIds = parseIdList(m[1]);
      const psetId = parseInt(m[2], 10);
      for (const eid of elemIds) {
        let list = elemPsets.get(eid);
        if (!list) {
          list = [];
          elemPsets.set(eid, list);
        }
        list.push(psetId);
      }
      continue;
    }

    m = line.match(reStorey);
    if (m) {
      storeyNames.set(parseInt(m[1], 10), m[3]);
      continue;
    }

    m = line.match(reRelSpatial);
    if (m) {
      const elemIds = parseIdList(m[1]);
      const storeyId = parseInt(m[2], 10);
      const stName = storeyNames.get(storeyId) || `Storey #${storeyId}`;
      for (const eid of elemIds) {
        elemStorey.set(eid, stName);
      }
      continue;
    }

    m = line.match(reElement);
    if (m) {
      const type = m[2].toUpperCase();
      if (!SKIP_TYPES.has(type) && !type.startsWith("IFCREL") && !type.startsWith("IFCPROP")) {
        const id = parseInt(m[1], 10);
        elements.set(id, { id, type, guid: m[3], name: m[4] || `${type} #${id}` });
      }
    }
  }

  for (const eid of elemPsets.keys()) {
    if (!elements.has(eid)) {
      elements.set(eid, {
        id: eid,
        type: "IFCBUILDINGELEMENT",
        guid: `guid-${eid}`,
        name: `Element #${eid}`,
      });
    }
  }

  const properties: Record<number, ParsedIfcElementRecord> = {};
  for (const [id, el] of elements.entries()) {
    const st = elemStorey.get(id) || "Entry Level";
    const psetList = elemPsets.get(id) || [];
    const resolvedPsets: Record<string, Record<string, string>> = {};

    for (const pid of psetList) {
      const pdef = psets.get(pid);
      if (!pdef) continue;
      if (!resolvedPsets[pdef.name]) resolvedPsets[pdef.name] = {};
      for (const vid of pdef.pvalIds) {
        const vdef = propValues.get(vid);
        if (vdef && vdef.val) {
          resolvedPsets[pdef.name][vdef.name] = vdef.val;
        }
      }
    }

    properties[id] = {
      expressId: id,
      type: el.type,
      Name: { value: el.name },
      GlobalId: { value: el.guid },
      Storey: st,
      psets: resolvedPsets,
    };
  }

  return properties;
}
