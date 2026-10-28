import { escapeHtml } from "../utils/formatters";

const TOAST_ICON_PRESETS: Record<string, string> = {
  success: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>`,
  info: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  warning: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2.2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  error: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
};

export function resolveToastIcon(iconOrPreset?: string): string {
  if (!iconOrPreset) return TOAST_ICON_PRESETS.info;
  const key = iconOrPreset.trim().toLowerCase();
  if (key in TOAST_ICON_PRESETS) {
    return TOAST_ICON_PRESETS[key];
  }
  return iconOrPreset;
}

export function showToast(
  message: string,
  icon: string = TOAST_ICON_PRESETS.info,
  durationMs: number = 3200
) {
  if (typeof document === "undefined") return;
  const container = document.getElementById("bim-toast-container");
  if (!container) return;

  const resolvedIcon = resolveToastIcon(icon);

  const toast = document.createElement("div");
  toast.style.cssText = `
    background: var(--bg-panel, #18181b);
    color: var(--text-primary, #ffffff);
    border: 2px solid var(--border-strong, #000000);
    border-radius: 4px;
    padding: 0.5rem 0.85rem;
    box-shadow: var(--shadow-brutal, 4px 4px 0px #000000);
    font-size: 0.72rem;
    font-weight: 800;
    font-family: var(--font-body, sans-serif);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    pointer-events: auto;
    animation: popIn 0.15s ease-out;
    max-width: 320px;
  `;

  toast.innerHTML = `
    <span style="display: inline-flex; align-items: center; flex-shrink: 0;">${resolvedIcon}</span>
    <span style="flex: 1; line-height: 1.35;">${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 220);
  }, durationMs);
}
