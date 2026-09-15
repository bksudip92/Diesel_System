/** Month helpers shared by the monthly-report screens. */

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export type MonthName = (typeof MONTH_NAMES)[number];

export function isMonthName(value: string): value is MonthName {
  return (MONTH_NAMES as readonly string[]).includes(value);
}

export interface MonthRange {
  /** First day of the month, YYYY-MM-DD (inclusive range start). */
  firstDatePrev: string;
  /** Last day of the month, YYYY-MM-DD (inclusive calendar day, display only). */
  lastDatePrev: string;
  /** First day of the NEXT month, YYYY-MM-DD (exclusive range end for API queries). */
  endDateExclusive: string;
  /** e.g. "September 2025" — the exact `month_name` key used by the backend. */
  period: string;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

function buildMonthRange(monthIndex: number, year: number, monthName: MonthName): MonthRange {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const nextYear = monthIndex + 1 === 12 ? year + 1 : year;
  const nextMonth = monthIndex + 1 === 12 ? 1 : monthIndex + 2;

  return {
    firstDatePrev: `${year}-${pad2(monthIndex + 1)}-01`,
    lastDatePrev: `${year}-${pad2(monthIndex + 1)}-${pad2(lastDay)}`,
    endDateExclusive: `${nextYear}-${pad2(nextMonth)}-01`,
    period: `${monthName} ${year}`,
  };
}

export function getMonthDateRange(monthName: MonthName, today = new Date()): MonthRange {
  const monthIndex = MONTH_NAMES.indexOf(monthName);
  // A month in the future this calendar year cannot have data yet — use last year.
  const year = monthIndex <= today.getMonth() ? today.getFullYear() : today.getFullYear() - 1;

  return buildMonthRange(monthIndex, year, monthName);
}

/** Range for an explicit year (used by the month-detail screen, where the year comes from the URL). */
export function getMonthDateRangeForYear(monthName: MonthName, year: number): MonthRange {
  return buildMonthRange(MONTH_NAMES.indexOf(monthName), year, monthName);
}

export interface ParsedPeriod {
  month: MonthName;
  year: number;
  /** Canonical backend key, e.g. "September 2025". */
  period: string;
}

/**
 * Parses the month-detail route param. Accepts the full backend key
 * `"September 2025"` (what the list screen navigates with) plus the legacy
 * bare `"September"` (year resolved like `getMonthDateRange`). Returns null
 * for anything unparseable.
 */
export function parsePeriodParam(value: string | undefined, today = new Date()): ParsedPeriod | null {
  if (!value) return null;
  const trimmed = value.trim();

  const full = /^([A-Za-z]+)\s+(\d{4})$/.exec(trimmed);
  if (full) {
    const [, monthRaw, yearRaw] = full;
    if (!isMonthName(monthRaw)) return null;
    const year = Number(yearRaw);
    return { month: monthRaw, year, period: `${monthRaw} ${year}` };
  }

  if (isMonthName(trimmed)) {
    const range = getMonthDateRange(trimmed, today);
    const year = Number(range.period.split(' ')[1]);
    return { month: trimmed, year, period: range.period };
  }

  return null;
}
