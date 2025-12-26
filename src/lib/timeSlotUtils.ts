// src/lib/timeSlotUtils.ts
/**
 * Time slot and date utilities for booking functionality
 * Pure functions with no React dependencies - can be used across booking, walk-in, and dashboard
 */

import { OPEN_HOUR, CLOSE_HOUR, PEAK_START, PEAK_END, TIME_INTERVAL, BOOKING_DURATION_MINUTES } from "@/lib/constants";
import { DayOption, TimeSlot } from "@/types/booking";

/**
 * Generate the next 7 days as date options for the date picker
 * @returns Array of day options with formatted date information
 */
export function buildNext7Days(): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    days.push({
      key: d.toISOString().slice(0, 10),
      dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
      dayNum: d.getDate().toString(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      isToday: i === 0,
    });
  }
  return days;
}

/**
 * Generate time slots from opening to closing hours
 * @returns Array of time slots with peak hour indicators
 */
export function buildTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    for (let minutes = 0; minutes < 60; minutes += TIME_INTERVAL) {
      const d = new Date();
      d.setHours(hour, minutes, 0, 0);
      const label = d.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      slots.push({
        label,
        hour,
        minutes,
        isPeak: hour >= PEAK_START && hour < PEAK_END,
      });
    }
  }
  return slots;
}

/**
 * Convert time string to minutes from midnight
 * @param timeStr Time string in format "10:30 pm" or "10:30 AM"
 * @returns Total minutes from midnight (e.g., "2:00 PM" = 840)
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
 * Convert minutes from midnight to time string
 * @param totalMinutes Total minutes from midnight (e.g., 840)
 * @returns Time string in format "2:00 pm"
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
 * Check if two time slots overlap
 * @param slot1StartMinutes Start time of first slot in minutes from midnight
 * @param slot2StartMinutes Start time of second slot in minutes from midnight
 * @param durationMinutes Duration of each slot in minutes
 * @returns True if the two time ranges overlap
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
 * Calculate end time from start time and duration
 * @param startTime Start time string (e.g., "2:00 pm")
 * @param durationMinutes Duration in minutes
 * @returns End time string (e.g., "3:30 pm")
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
