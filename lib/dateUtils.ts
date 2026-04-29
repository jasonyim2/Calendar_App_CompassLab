import { parseISO, format, differenceInDays } from 'date-fns';

/**
 * Parses a YYYY-MM-DD string into a local Date object.
 * Safe to use since parseISO treats 'YYYY-MM-DD' without time/Z as local midnight.
 */
export function parseLocalDate(dateString: string): Date {
  return parseISO(dateString);
}

/**
 * Formats a local Date object into a YYYY-MM-DD string.
 */
export function formatLocalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Gets the number of days between two YYYY-MM-DD strings (inclusive).
 * If start_date === end_date, it returns 1.
 */
export function getDaysSpan(startDateStr: string, endDateStr: string): number {
  if (!endDateStr) return 1;
  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);
  return differenceInDays(end, start) + 1;
}
