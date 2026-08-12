/**
 * Returns the current date in America/New_York timezone as YYYY-MM-DD.
 * @param now - The Date to convert (defaults to current time)
 * @returns Date string in YYYY-MM-DD format
 */
export function todayInNewYork(now: Date = new Date()): string {
  return Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
}

/**
 * Returns the current time in America/New_York timezone in human-readable format.
 * @param now - The Date to convert (defaults to current time)
 * @returns Time string like "3:47 PM"
 */
export function nowInNewYorkLabel(now: Date = new Date()): string {
  return Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/New_York",
  }).format(now);
}
