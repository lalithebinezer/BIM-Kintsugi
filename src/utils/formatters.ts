/**
 * Pure Utility Formatting Functions (Separation of Concerns)
 */

/**
 * Formats a numeric value into a USD currency string.
 */
export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
