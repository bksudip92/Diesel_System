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
  /** First day of the month, YYYY-MM-DD. */
  firstDatePrev: string;
  /** Last day of the month, YYYY-MM-DD (inclusive). */
  lastDatePrev: string;
  /** First day of the NEXT month, YYYY-MM-DD (exclusive range end). */
  endDateExclusive: string;
  /** e.g. "September 2025" */
  period: string;
}

export function getMonthDateRange(monthName: MonthName, today = new Date()): MonthRange {
  const monthIndex = MONTH_NAMES.indexOf(monthName);
  // A month in the future this calendar year cannot have data yet — use last year.
  const year = monthIndex <= today.getMonth() ? today.getFullYear() : today.getFullYear() - 1;

  const pad = (n: number) => String(n).padStart(2, '0');
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  return {
    firstDatePrev: `${year}-${pad(monthIndex + 1)}-01`,
    lastDatePrev: `${year}-${pad(monthIndex + 1)}-${pad(lastDay)}`,
    endDateExclusive: `${monthIndex + 1 === 12 ? year + 1 : year}-${pad(
      monthIndex + 1 === 12 ? 1 : monthIndex + 2,
    )}-01`,
    period: `${monthName} ${year}`,
  };
}
