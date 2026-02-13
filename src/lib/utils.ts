import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely format a date string or Date object
 * @param dateValue - A date string, Date object, or any value that might be invalid
 * @param formatString - date-fns format string (default: "EEE, MMM d")
 * @param fallback - Value to return if date is invalid (default: "Invalid date")
 * @returns Formatted date string or fallback value
 */
export function safeFormatDate(
  dateValue: string | Date | null | undefined,
  formatString: string = "EEE, MMM d",
  fallback: string = "Invalid date"
): string {
  if (!dateValue) return fallback;

  try {
    const date = typeof dateValue === "string" ? new Date(dateValue) : dateValue;
    return isValid(date) ? format(date, formatString) : fallback;
  } catch {
    return fallback;
  }
}
