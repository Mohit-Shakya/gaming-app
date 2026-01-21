// Time utility functions for booking system

import { BOOKING_DURATION_MINUTES } from "./constants";

/**
 * Convert "10:30 pm" to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const match = timeStr.toLowerCase().match(/(\d+):(\d+)\s*(am|pm)/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

/**
 * Convert minutes from midnight to "11:30 pm"
 */
export function minutesToTimeString(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours >= 24) hours -= 24;

  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Check if two time ranges of given duration overlap
 */
export function doTimeSlotsOverlap(
  slot1StartMinutes: number,
  slot2StartMinutes: number,
  durationMinutes: number = BOOKING_DURATION_MINUTES
): boolean {
  const slot1End = slot1StartMinutes + durationMinutes;
  const slot2End = slot2StartMinutes + durationMinutes;
  return slot1StartMinutes < slot2End && slot2StartMinutes < slot1End;
}

/**
 * Calculate end time based on duration
 * @param startTime - Start time string (e.g., "2:30 pm")
 * @param durationMinutes - Duration in minutes (default: BOOKING_DURATION_MINUTES from constants)
 */
export function getEndTime(startTime: string, durationMinutes: number = BOOKING_DURATION_MINUTES): string {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;

  let hours = Math.floor(endMinutes / 60);
  const mins = endMinutes % 60;

  if (hours >= 24) hours -= 24;

  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Format date nicely
 */
export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "Date not set";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
      weekday: "short",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Convert 12-hour time string to 24-hour format
 * e.g., "10:30 am" -> "10:30", "2:30 pm" -> "14:30"
 */
export function convertTo24Hour(timeStr: string): string {
  if (!timeStr) return "";
  const time = timeStr.trim();

  // Try 12-hour format with am/pm
  const match12h = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)$/i);
  if (match12h) {
    let hours = parseInt(match12h[1]);
    const minutes = match12h[2];
    const period = match12h[3].toLowerCase();

    if (period === "pm" && hours !== 12) hours += 12;
    else if (period === "am" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  // Try 24-hour format
  const match24h = time.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match24h) {
    return `${match24h[1].padStart(2, "0")}:${match24h[2]}`;
  }

  // Relaxed match
  const matchAny = time.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)?/i);
  if (matchAny) {
    let hours = parseInt(matchAny[1]);
    const minutes = matchAny[2];
    const period = matchAny[3]?.toLowerCase();

    if (period === "pm" && hours !== 12) hours += 12;
    else if (period === "am" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }

  console.warn('[convertTo24Hour] Unrecognized time format:', timeStr);
  return "";
}

/**
 * Convert 24-hour or any time string to 12-hour format
 * e.g., "14:30" -> "2:30 PM"
 */
export function convertTo12Hour(timeStr?: string | null): string {
  if (!timeStr) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

  // Already 12-hour format
  const match12h = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)/i);
  if (match12h) {
    const hours = parseInt(match12h[1]);
    const minutes = match12h[2];
    const period = match12h[3].toUpperCase();
    return `${hours}:${minutes} ${period}`;
  }

  // Parse 24-hour format
  const match24h = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?/);
  if (match24h) {
    let hours = parseInt(match24h[1]);
    const minutes = match24h[2];
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${period}`;
  }

  return timeStr;
}

/**
 * Get emoji icon for console type
 */
export function getConsoleIcon(consoleType: string): string {
  const type = consoleType?.toUpperCase() || '';
  if (type.includes('PC')) return '🖥️';
  if (type.includes('PS5')) return '🎮';
  if (type.includes('PS4')) return '🎮';
  if (type.includes('XBOX')) return '🎮';
  if (type.includes('VR')) return '🥽';
  if (type.includes('STEERING')) return '🏎️';
  if (type.includes('POOL')) return '🎱';
  if (type.includes('SNOOKER')) return '🎱';
  if (type.includes('ARCADE')) return '🕹️';
  if (type.includes('NINTENDO') || type.includes('SWITCH')) return '🎮';
  return '🎮';
}

