/**
 * Pure Utility Formatting Functions (Separation of Concerns)
 */
import { CostRateManager } from "../modules/CostRateManager";

/**
 * Formats a numeric value into an active project currency string.
 */
export function formatCurrency(amount: number): string {
  try {
    return CostRateManager.getInstance().formatPrice(amount);
  } catch {
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

/**
 * Formats a count into a human-readable item string.
 */
export function formatItemCount(count: number): string {
  return `${count.toLocaleString()} items`;
}

/**
 * Formats a percentage number to a formatted string (e.g. "85%").
 */
export function formatProgressPct(pct: number): string {
  return `${Math.round(pct)}%`;
}

/**
 * Escapes HTML special characters to prevent XSS and broken markup in templates.
 */
export function escapeHtml(raw: string): string {
  return String(raw)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
