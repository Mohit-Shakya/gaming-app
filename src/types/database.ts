// src/types/database.ts
/**
 * TypeScript interfaces for database tables and responses
 * These replace 'any' types throughout the application
 */

import { ConsoleId } from "@/lib/constants";

// ============ CAFE TYPES ============

export interface CafeRow {
  id: string;
  name: string;
  slug: string;
  address: string;
  description: string | null;
  hourly_price: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  is_active: boolean;

  // Contact information
  phone: string | null;
  email: string | null;

  // URLs
  google_maps_url: string | null;
  instagram_url: string | null;
  cover_url: string | null;

  // Pricing
  price_starts_from: number | null;

  // Console counts
  ps5_count: number;
  ps4_count: number;
  xbox_count: number;
  pc_count: number;
  pool_count: number;
  arcade_count: number;
  snooker_count: number;
  vr_count: number;
  steering_wheel_count: number;

  // Additional details
  opening_hours: string | null;
  peak_hours: string | null;
  popular_games: string | null;
  offers: string | null;
  monitor_details: string | null;
  processor_details: string | null;
  gpu_details: string | null;
  ram_details: string | null;
  accessories_details: string | null;

  // Optional fields for joined data
  gallery_images?: GalleryImage[];
}

export interface GalleryImage {
  id: string;
  cafe_id: string;
  image_url: string;
  created_at: string;
}

// ============ BOOKING TYPES ============

export interface BookingRow {
  id: string;
  cafe_id: string;
  user_id: string | null;
  booking_date: string;
  start_time: string;
  duration: number;
  total_amount: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "in-progress";
  source: "online" | "walk_in";
  payment_mode?: "cash" | "online" | "upi";
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingItemRow {
  id: string;
  booking_id: string;
  ticket_id: string;
  console: ConsoleId;
  title: string;
  price: number;
  quantity: number;
  created_at: string;
}

// ============ USER/PROFILE TYPES ============

export interface ProfileRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
  role: "user" | "owner" | "admin";
}

// ============ CONSOLE PRICING TYPES ============

export interface ConsolePricingRow {
  id: string;
  cafe_id: string;
  console_type: ConsoleId;
  quantity: number;
  duration_minutes: number;
  price: number;
  created_at: string;
  updated_at: string;
}

// ============ UTILITY TYPES ============

/**
 * Cafe with all console counts accessible by ConsoleId
 */
export type CafeWithConsoleCounts = CafeRow;

/**
 * Booking with nested booking items and optional profile
 */
export interface BookingWithItems extends BookingRow {
  booking_items: BookingItemRow[];
  profile?: ProfileRow | null;
}

/**
 * Enriched booking with profile name for owner dashboard
 */
export interface EnrichedBooking extends BookingRow {
  booking_items: BookingItemRow[];
  profileName?: string;
}

/**
 * Simple booking with nested items (for availability checking)
 */
export interface BookingWithNestedItems {
  id: string;
  start_time: string;
  booking_items?: Array<{
    console: string;
    quantity: number;
  }>;
}

/**
 * Console availability for a specific console type
 */
export interface ConsoleAvailability {
  total: number;
  booked: number;
  available: number;
  nextAvailableAt: string | null;
}
