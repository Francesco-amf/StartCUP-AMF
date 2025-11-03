import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get current UTC timestamp as ISO 8601 string
 *
 * Note: new Date().toISOString() ALWAYS returns UTC regardless of server timezone.
 * The JavaScript Date object internally stores milliseconds since epoch (UTC),
 * and toISOString() always formats it as UTC.
 *
 * @returns ISO 8601 UTC timestamp string (e.g., "2025-11-02T20:30:45.123Z")
 * @example
 * const timestamp = getUTCTimestamp()
 * // "2025-11-02T20:30:45.123Z"
 */
export function getUTCTimestamp(): string {
  return new Date().toISOString()
}
