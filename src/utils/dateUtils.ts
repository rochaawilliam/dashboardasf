/**
 * Parse a "YYYY-MM-DD" date string as a LOCAL date (not UTC).
 * 
 * JavaScript's `new Date("2026-01-01")` and date-fns' `parseISO("2026-01-01")`
 * interpret date-only strings as UTC midnight, which in negative UTC offsets
 * (e.g. Brazil UTC-3) shifts to the previous day.
 *
 * This function avoids that by extracting year/month/day and constructing
 * a Date with local timezone.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}
