/**
 * BOQ Generator — Bills of Quantities extraction and CSV export.
 *
 * Extracts quantity data from IFC elements (both standard Qto_* property
 * sets and custom property sets) and generates a downloadable CSV file.
 */

import * as THREE from 'three';
import { BimEngine } from '../core/BimEngine';

export interface QuantityProvenanceOption {
  propertySetName: string;
  quantityType: string;
  value: number;
  unit: string;
}

export interface BOQLineItem {
  expressId: number;
  modelId: string;
  category: string;
  elementName: string;
  materialNumber: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  propertySetName: string;
  quantityType: string;
  /** All Qto_* / custom quantity candidates discovered on this element for interactive provenance switching. */
  availableQuantities?: QuantityProvenanceOption[];
  classificationCode?: string;
  expectedRateUnit?: string;
  matchConfidence?: number;
  matchConfirmed?: boolean;
  wasteFactorPct?: number;
  grossQuantity?: number;
}

export interface BOQSummary {
  items: BOQLineItem[];
  totalCost: number;
  totalElements: number;
  categorySummary: Map<string, { count: number; totalCost: number }>;
}

/**
 * Standard IFC Qto property set quantity field names.
 * These are the most common quantity attributes in standard IFC exports.
 */
const QTO_QUANTITY_FIELDS = [
  'NetArea',
  'GrossArea',
  'NetVolume',
  'GrossVolume',
  'Length',
  'Width',
  'Height',
  'Perimeter',
  'NetWeight',
  'GrossWeight',
  'Count',
  'Depth',
  'NetSideArea',
  'GrossSideArea',
  'OuterSurfaceArea',
  'TotalSurfaceArea',
  'CrossSectionArea',
];

/**
 * Custom property field names that may contain material or quantity data.
 */
const CUSTOM_MATERIAL_FIELDS = [
  'Material Number',
  'MaterialNumber',
  'Material_Number',
  'Material',
  'MaterialName',
  'Material Name',
  'MaterialType',
];

const CUSTOM_QUANTITY_FIELDS = [
  'Qty',
  'Quantity',
  'qty',
  'quantity',
  'Amount',
  'Count',
  'Volume',
  'Area',
  'Length',
];

/**
 * Extract quantity and material data from element properties.
 * Searches both standard Qto_* property sets and custom sets.
 */
export function extractQuantityData(
  elementProps: Record<string, any>,
  propertySets?: Record<string, Record<string, any>>
): {
  materialNumber: string;
  quantity: number;
  quantityType: string;
  unit: string;
  propertySetName: string;
  availableQuantities: QuantityProvenanceOption[];
} {
  let materialNumber = '';
  let quantity = 0;
  let quantityType = '';
  let unit = '';
  let propertySetName = '';
  const availableQuantities: QuantityProvenanceOption[] = [];

  const inferUnit = (fieldName: string): string => {
    if (/area/i.test(fieldName)) return 'm²';
    if (/volume/i.test(fieldName)) return 'm³';
    if (/length|width|height|depth|perimeter/i.test(fieldName)) return 'm';
    if (/weight/i.test(fieldName)) return 'kg';
    return 'ea';
  };

  // 1. Collect all standard Qto_* property set quantity candidates (preserving exact order)
  if (propertySets) {
    for (const [psetName, psetData] of Object.entries(propertySets)) {
      if (/^Qto_/i.test(psetName)) {
        for (const fieldName of QTO_QUANTITY_FIELDS) {
          const val = psetData[fieldName];
          if (val !== undefined && val !== null && val !== '') {
            const numVal = typeof val === 'object' && val.value !== undefined
              ? Number(val.value)
              : Number(val);
            if (!isNaN(numVal) && numVal > 0) {
              const candUnit = inferUnit(fieldName);
              availableQuantities.push({
                propertySetName: psetName,
                quantityType: fieldName,
                value: numVal,
                unit: candUnit,
              });
              if (quantity === 0) {
                quantity = numVal;
                quantityType = fieldName;
                propertySetName = psetName;
                unit = candUnit;
              }
            }
          }
        }
      }
    }
  }

  // 2. Search custom property sets for material number
  if (propertySets) {
    for (const [, psetData] of Object.entries(propertySets)) {
      for (const fieldName of CUSTOM_MATERIAL_FIELDS) {
        const val = psetData[fieldName];
        if (val !== undefined && val !== null && val !== '') {
          materialNumber = typeof val === 'object' && val.value !== undefined
            ? String(val.value)
            : String(val);
          break;
        }
      }
      if (materialNumber) break;
    }
  }

  // 3. If no Qto_* quantity found, search custom fields
  if (quantity === 0 && propertySets) {
    for (const [psetName, psetData] of Object.entries(propertySets)) {
      for (const fieldName of CUSTOM_QUANTITY_FIELDS) {
        const val = psetData[fieldName];
        if (val !== undefined && val !== null && val !== '') {
          const numVal = typeof val === 'object' && val.value !== undefined
            ? Number(val.value)
            : Number(val);
          if (!isNaN(numVal) && numVal > 0) {
            quantity = numVal;
            quantityType = fieldName;
            propertySetName = psetName;
            unit = 'ea';
            break;
          }
        }
      }
      if (quantity > 0) break;
    }
  }

  // 4. Search top-level element props as fallback
  if (materialNumber === '') {
    for (const fieldName of CUSTOM_MATERIAL_FIELDS) {
      const val = elementProps[fieldName];
      if (val !== undefined && val !== null && val !== '') {
        materialNumber = typeof val === 'object' && val.value !== undefined
          ? String(val.value)
          : String(val);
        break;
      }
    }
  }

  return { materialNumber, quantity, quantityType, unit, propertySetName, availableQuantities };
}

/**
 * Switches an existing BOQLineItem's active quantity source using its discovered provenance list
 * and recalculates totalCost cleanly.
 */
export function switchLineItemQuantitySource(
  item: BOQLineItem,
  targetField: string,
  targetPset?: string
): BOQLineItem {
  const match = (item.availableQuantities ?? []).find(
    (q) => q.quantityType === targetField && (!targetPset || q.propertySetName === targetPset)
  );
  if (!match) return item;
  const wasteMult = 1 + (item.wasteFactorPct ?? 0) / 100;
  const grossQuantity = Number((match.value * wasteMult).toFixed(3));
  return {
    ...item,
    quantity: match.value,
    grossQuantity,
    unit: match.unit,
    quantityType: match.quantityType,
    propertySetName: match.propertySetName,
    totalCost: Number((grossQuantity * item.unitCost).toFixed(2)),
  };
}

/**
 * Exports a structured BOQ summary into GAEB DA XML 3.2 (X83) interchange format
 * grouped hierarchically by classification code or IFC category.
 */
export function buildGaebX83Xml(
  summary: BOQSummary,
  projectName: string = "BIM Kintsugi 5D BOQ"
): string {
  const esc = (s: string) =>
    (s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  const gaebUnit = (u: string): string => {
    if (u === "m³" || u === "m3") return "m3";
    if (u === "m²" || u === "m2") return "m2";
    if (u === "m") return "m";
    if (u === "kg") return "kg";
    return "St";
  };

  const groups = new Map<string, BOQLineItem[]>();
  for (const item of summary.items) {
    const key = item.classificationCode || item.category || "GENERAL";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(item);
  }

  let catIdx = 1;
  const ctgyBlocks: string[] = [];
  for (const [groupKey, groupItems] of groups) {
    const rNoCat = String(catIdx++).padStart(2, "0");
    let itemIdx = 1;
    const itemXml = groupItems
      .map((item) => {
        const rNoItem = `${rNoCat}.${String(itemIdx++).padStart(3, "0")}`;
        const qty = item.grossQuantity ?? item.quantity;
        const provNote = item.propertySetName && item.quantityType ? ` [${item.propertySetName}.${item.quantityType}]` : "";
        return `          <Item ID="I-${item.expressId}" RNoPart="${esc(rNoItem)}">
            <Qty>${qty.toFixed(3)}</Qty>
            <QU>${esc(gaebUnit(item.unit))}</QU>
            <UP>${item.unitCost.toFixed(2)}</UP>
            <IT>${item.totalCost.toFixed(2)}</IT>
            <Description>
              <OutlineText>
                <OutlTxt><TextOutlTxt>${esc(item.elementName + provNote)}</TextOutlTxt></OutlTxt>
              </OutlineText>
            </Description>
          </Item>`;
      })
      .join("\n");

    ctgyBlocks.push(`      <BoQCtgy ID="C-${rNoCat}" RNoPart="${esc(rNoCat)}">
        <LblTx>${esc(groupKey)}</LblTx>
        <BoQBody>
          <Itemlist>
${itemXml}
          </Itemlist>
        </BoQBody>
      </BoQCtgy>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<GAEB xmlns="http://www.gaeb.de/GAEB_DA_XML/DA83/3.2">
  <GAEBInfo>
    <Version>3.2</Version>
    <ProgSystem>BIM-Kintsugi 5D</ProgSystem>
  </GAEBInfo>
  <Award>
    <DP>83</DP>
    <AwardInfo>
      <Prj>${esc(projectName)}</Prj>
      <Cur>USD</Cur>
    </AwardInfo>
    <BoQ ID="BOQ-1">
      <BoQBkdn><Type>BoQLevel</Type><Length>2</Length></BoQBkdn>
      <BoQBody>
${ctgyBlocks.join("\n")}
      </BoQBody>
    </BoQ>
  </Award>
</GAEB>`;
}

/**
 * Generate a complete BOQ summary from collected line items.
 */
export function generateBOQSummary(items: BOQLineItem[]): BOQSummary {
  const categorySummary = new Map<string, { count: number; totalCost: number }>();
  let totalCost = 0;

  for (const item of items) {
    totalCost += item.totalCost;
    const existing = categorySummary.get(item.category) || { count: 0, totalCost: 0 };
    existing.count += 1;
    existing.totalCost += item.totalCost;
    categorySummary.set(item.category, existing);
  }

  return {
    items,
    totalCost,
    totalElements: items.length,
    categorySummary,
  };
}

/**
 * Export BOQ data as a downloadable CSV file.
 */
export function exportBOQAsCSV(summary: BOQSummary, filename?: string): void {
  const headers = [
    'Express ID',
    'Model ID',
    'IFC Category',
    'Element Name',
    'Material Number',
    'Property Set',
    'Quantity Type',
    'Unit',
    'Quantity',
    'Unit Cost ($)',
    'Total Cost ($)',
  ];

  const rows = summary.items.map(item => [
    item.expressId,
    item.modelId,
    item.category,
    `"${item.elementName.replace(/"/g, '""')}"`,
    `"${item.materialNumber.replace(/"/g, '""')}"`,
    item.propertySetName,
    item.quantityType,
    item.unit,
    item.quantity.toFixed(3),
    item.unitCost.toFixed(2),
    item.totalCost.toFixed(2),
  ]);

  // Add summary section at the bottom
  rows.push([]);
  rows.push(['=== CATEGORY SUMMARY ===']);
  rows.push(['Category', '', '', '', '', '', '', '', 'Elements', '', 'Total Cost ($)']);
  for (const [category, data] of summary.categorySummary) {
    rows.push([category, '', '', '', '', '', '', '', data.count, '', data.totalCost.toFixed(2)]);
  }
  rows.push([]);
  rows.push(['GRAND TOTAL', '', '', '', '', '', '', '', summary.totalElements, '', summary.totalCost.toFixed(2)]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => (row as (string | number)[]).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `BOQ_Export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Default unit cost benchmarks ($/unit) by IFC category when no manual cost is set.
 */
export const DEFAULT_CATEGORY_UNIT_COSTS: Record<string, number> = {
  IFCWALL: 185,
  IFCWALLSTANDARDCASE: 185,
  IFCSLAB: 240,
  IFCCOLUMN: 420,
  IFCBEAM: 390,
  IFCFOOTING: 310,
  IFCDOOR: 650,
  IFCWINDOW: 480,
  IFCROOF: 215,
  IFCSTAIR: 1200,
  IFCDUCTSEGMENT: 145,
  IFCPIPESEGMENT: 95,
};

/**
 * Resolves a fallback unit cost for an IFC category when manual unitCost is 0.
 */
export function resolveCategoryUnitCost(category: string, manualUnitCost: number = 0): number {
  if (manualUnitCost > 0) return manualUnitCost;
  const upper = category.toUpperCase();
  for (const [key, cost] of Object.entries(DEFAULT_CATEGORY_UNIT_COSTS)) {
    if (upper.includes(key)) return cost;
  }
  return 125;
}

/**
 * Highlights all 3D elements belonging to a specific BOQ category using ThatOpen OBF.Highlighter.
 */
export function highlightBoqCategory(category: string, summary: BOQSummary): Record<string, Set<number>> {
  const modelIdMap: Record<string, Set<number>> = {};
  const targetUpper = category.toUpperCase();

  for (const item of summary.items) {
    if (item.category.toUpperCase() === targetUpper) {
      if (!modelIdMap[item.modelId]) modelIdMap[item.modelId] = new Set<number>();
      modelIdMap[item.modelId].add(item.expressId);
    }
  }

  try {
    const engine = BimEngine.getInstance();
    const highlighter = engine.highlighter;
    if (highlighter && (engine.fragments as any)?.core && Object.keys(modelIdMap).length > 0) {
      if (highlighter.styles && !highlighter.styles.has('BOQ_Highlight')) {
        highlighter.styles.set('BOQ_Highlight', {
          color: new THREE.Color('#10b981'),
          opacity: 0.9,
          transparent: true,
          renderedFaces: 0 as any,
        });
      }
      highlighter.highlightByID?.('BOQ_Highlight', modelIdMap, true, true)?.catch?.(() => {});
    }
  } catch (e) {}

  return modelIdMap;
}

/**
 * Isolates a subset of BOQ line items in the 3D viewport using ThatOpen OBC.Hider.
 */
export function isolateBoqItems(items: BOQLineItem[]): Record<string, Set<number>> {
  const modelIdMap: Record<string, Set<number>> = {};
  for (const item of items) {
    if (!modelIdMap[item.modelId]) modelIdMap[item.modelId] = new Set<number>();
    modelIdMap[item.modelId].add(item.expressId);
  }

  try {
    const engine = BimEngine.getInstance();
    if (engine.hider && Object.keys(modelIdMap).length > 0) {
      engine.hider.isolate?.(modelIdMap)?.catch?.(() => {});
    }
  } catch (e) {}

  return modelIdMap;
}
