/**
 * DeepLinkManager — Shareable URL Hash Views (#view=...)
 *
 * Encodes camera pose, active storey slice, selected element IDs/GUID,
 * 4D mode + simulation date, and active 3D lens into a compact URL-safe
 * hash so engineers can share exact 3D/4D viewpoints via Teams, Slack, or Jira.
 */

export interface DeepLinkViewState {
  /** Camera eye position [x, y, z] rounded to 2 decimals */
  camPos?: [number, number, number];
  /** Camera look-at target [x, y, z] rounded to 2 decimals */
  camTarget?: [number, number, number];
  /** Active storey slice name */
  storey?: string;
  /** Selected element GUID or modelId:expressId token */
  selectedGuid?: string;
  selectedExpressId?: number;
  /** Up to 20 selected element tokens ("modelId:expressId") for shared multi-selection */
  selectedIds?: string[];
  /** Preferred UI layout ("cockpit" | "classic") */
  layout?: "cockpit" | "classic";
  /** Whether 4D mode is active */
  mode4d?: boolean;
  /** Simulated 4D date (YYYY-MM-DD) */
  date4d?: string;
  /** Active 4D lens */
  lens?: "standard" | "variance" | "trades" | "cascade";
  /** Sample model key if a built-in sample was active */
  sample?: string;
}

const HASH_PREFIX = "#view=";

function roundCoord(n: number): number {
  return Math.round(n * 100) / 100;
}

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(token: string): string {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (token.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

export function encodeDeepLinkState(state: DeepLinkViewState): string {
  const compact: Record<string, unknown> = {};
  if (state.camPos) compact.p = state.camPos.map(roundCoord);
  if (state.camTarget) compact.t = state.camTarget.map(roundCoord);
  if (state.storey) compact.st = state.storey;
  if (state.selectedGuid) compact.g = state.selectedGuid;
  if (typeof state.selectedExpressId === "number") compact.e = state.selectedExpressId;
  if (Array.isArray(state.selectedIds) && state.selectedIds.length > 0) {
    compact.sel = state.selectedIds.slice(0, 20);
  }
  if (state.layout === "cockpit" || state.layout === "classic") compact.ui = state.layout;
  if (state.mode4d) compact.m4 = 1;
  if (state.date4d) compact.d = state.date4d;
  if (state.lens && state.lens !== "standard") compact.l = state.lens;
  if (state.sample) compact.s = state.sample;
  return `${HASH_PREFIX}${toBase64Url(JSON.stringify(compact))}`;
}

export function decodeDeepLinkHash(hashOrUrl: string): DeepLinkViewState | null {
  if (!hashOrUrl) return null;
  const idx = hashOrUrl.indexOf(HASH_PREFIX);
  if (idx < 0) return null;
  const token = hashOrUrl.slice(idx + HASH_PREFIX.length).split("&")[0].trim();
  if (!token) return null;

  try {
    const raw = JSON.parse(fromBase64Url(token)) as Record<string, any>;
    const out: DeepLinkViewState = {};
    if (Array.isArray(raw.p) && raw.p.length === 3 && raw.p.every((n) => typeof n === "number")) {
      out.camPos = [raw.p[0], raw.p[1], raw.p[2]];
    }
    if (Array.isArray(raw.t) && raw.t.length === 3 && raw.t.every((n) => typeof n === "number")) {
      out.camTarget = [raw.t[0], raw.t[1], raw.t[2]];
    }
    if (typeof raw.st === "string" && raw.st) out.storey = raw.st;
    if (typeof raw.g === "string" && raw.g) out.selectedGuid = raw.g;
    if (typeof raw.e === "number" && Number.isFinite(raw.e)) out.selectedExpressId = raw.e;
    if (Array.isArray(raw.sel)) {
      const cleanSel = raw.sel.filter((v: unknown): v is string => typeof v === "string" && v.length > 0).slice(0, 20);
      if (cleanSel.length > 0) out.selectedIds = cleanSel;
    }
    if (raw.ui === "cockpit" || raw.ui === "classic") out.layout = raw.ui;
    if (raw.m4 === 1 || raw.m4 === true) out.mode4d = true;
    if (typeof raw.d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.d)) out.date4d = raw.d;
    if (raw.l === "variance" || raw.l === "trades" || raw.l === "cascade") out.lens = raw.l;
    if (typeof raw.s === "string" && raw.s) out.sample = raw.s;
    return out;
  } catch {
    return null;
  }
}

export function buildShareableViewUrl(state: DeepLinkViewState, baseUrl?: string): string {
  const hash = encodeDeepLinkState(state);
  const base = (baseUrl ?? (typeof window !== "undefined" ? window.location.href : "https://lalithebinezer.github.io/BIM-Kintsugi/")).split("#")[0];
  return `${base}${hash}`;
}
