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

/**
 * Extract the reference month and year from a metric_history entry.
 * New entries store "YYYY-MM" in period_type. Legacy entries have "monthly"
 * and use recorded_at as fallback.
 */
export function getRefMonthYear(periodType: string, recordedAt: string): { month: number; year: number } {
  if (periodType && periodType.includes("-") && periodType !== "monthly") {
    const [year, month] = periodType.split("-").map(Number);
    return { month, year };
  }
  // Fallback: use recorded_at
  const date = parseLocalDate(recordedAt);
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}
