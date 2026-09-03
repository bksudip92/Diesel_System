/**
 * Date/time formatting helpers. Single source of truth — previously
 * `formatDate` was copy-pasted with different behavior in 3 screens.
 */

const DAY_MONTH_YEAR = { day: 'numeric', month: 'short', year: 'numeric' } as const;

/** e.g. "Sep 3, 2026" */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', DAY_MONTH_YEAR);
}

/** e.g. "9/3/2026, 11:29 AM" */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

/** Current local date as YYYY-MM-DD (for fuel-log submissions). */
export function todayISODate(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Current local time as HH:MM:SS (24h), matching the backend's expectations. */
export function nowHMMSTime(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
