// src/types/booking.ts
/**
 * Shared types for booking-related functionality
 * Used across booking page, walk-in page, and booking components
 */

import { ConsoleId } from "@/lib/constants";

/**
 * Represents a day option in the date picker
 */
export type DayOption = {
  key: string; // ISO date string (YYYY-MM-DD)
  dayName: string; // e.g., "Mon", "Tue"
  dayNum: string; // e.g., "24", "25"
  month: string; // e.g., "Dec", "Jan"
  isToday: boolean;
};

/**
 * Represents a time slot option
 */
export type TimeSlot = {
  label: string; // e.g., "10:30 AM"
  hour: number; // 0-23
  minutes: number; // 0-59
  isPeak: boolean; // Whether this slot is during peak hours
};

/**
 * Represents a console option with metadata
 */
export type ConsoleOption = {
  id: ConsoleId;
  label: string; // e.g., "PlayStation 5"
  icon: string; // Emoji icon
  color: string; // Hex color
  dbKey: string; // Database column name
};

/**
 * Represents a bookable ticket option
 */
export type TicketOption = {
  id: string; // e.g., "ps5_2" (console_quantity)
  console: ConsoleId;
  title: string; // e.g., "PS5 | 2 Consoles"
  players: number; // Number of consoles/controllers
  price: number; // Price in rupees
  description: string; // Human-readable description
};

/**
 * Selected ticket for capacity checking
 */
export type SelectedTicketForCheck = {
  console: ConsoleId;
  quantity: number;
};

/**
 * Console pricing tier structure
 * Defines prices for different quantity/duration combinations
 */
export type ConsolePricingTier = {
  qty1_30min: number | null;
  qty1_60min: number | null;
  qty2_30min: number | null;
  qty2_60min: number | null;
  qty3_30min: number | null;
  qty3_60min: number | null;
  qty4_30min: number | null;
  qty4_60min: number | null;
};

/**
 * Console availability information
 */
export type ConsoleAvailability = {
  total: number; // Total number of consoles
  booked: number; // Currently booked count
  available: number; // Available count
  nextAvailableAt: string | null; // Time when console becomes free (e.g., "11:30 PM")
};
