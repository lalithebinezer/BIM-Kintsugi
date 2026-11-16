export interface ParsedIfcElementRecord {
  expressId: number;
  type: string;
  Name: { value: string };
  GlobalId: { value: string };
  Storey: string;
  psets: Record<string, Record<string, string>>;
}

/**
 * Pure, dependency-free STEP (ISO-10303-21) parser shared by both main-thread
 * parameter readers and off-thread metadata Web Workers.
 */
export function parseIfcStepText(content: string): Record<number, ParsedIfcElementRecord> {
  if (!content) return {};

  const lines = content.split("\n");
  const propValues = new Map<number, { name: string; val: string }>();
  const psets = new Map<number, { name: string; pvalIds: number[] }>();
  const elemPsets = new Map<number, number[]>();
  const storeyNames = new Map<number, string>();
  const elemStorey = new Map<number, string>();
  const elements = new Map<number, { id: number; type: string; guid: string; name: string }>();

  const rePropVal =
    /^#(\d+)\s*=\s*IFCPROPERTYSINGLEVALUE\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*([A-Za-z0-9_]+)\s*\(\s*([^)]*)\s*\)/i;
  const rePset =
    /^#(\d+)\s*=\s*IFCPROPERTYSET\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*'([^']*)'\s*,\s*[^,]*\s*,\s*\(([^)]*)\)/i;
  const reRelProp =
    /IFCRELDEFINESBYPROPERTIES\s*\([^,]+,[^,]+,[^,]+,[^,]+,\s*\(([^)]*)\)\s*,\s*#(\d+)/i;
  const reStorey = /^#(\d+)\s*=\s*IFCBUILDINGSTOREY\s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*'([^']*)'/i;
  const reRelSpatial =
    /IFCRELCONTAINEDINSPATIALSTRUCTURE\s*\([^,]+,[^,]+,[^,]+,[^,]+,\s*\(([^)]*)\)\s*,\s*#(\d+)/i;
  const reElement =
    /^#(\d+)\s*=\s*(IFC[A-Z0-9_]+)s*\(\s*'([^']*)'\s*,\s*[^,]*\s*,\s*(?:'([^']*)'|\$)/i;

  const SKIP_TYPES = new Set([
    "IFCRELDEFINESBYPROPERTIES",
    "IFCRELCONTAINEDINSPATIALSTRUCTURE",
    "IFCRELASSOCIATESMATERIAL",
    "IFCRELDEFINESBYTYPE",
    "IFCRELVOIDSELEMENT",
    "IFCRELAGGREGATES",
    "IFCPROPERTYSET",
    "IFCPROPERTYSINGLEVALUE",
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
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

    m = line.match(rePset);
    if (m) {
      const id = parseInt(m[1], 10);
      const psetName = m[3];
      psets.set(id, { name: psetName, pvalIds: parseIdList(m[4]) });
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
