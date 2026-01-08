// src/types/cafe.ts
export type Cafe = {
  id: string;
  name: string;
  slug?: string | null; // SEO-friendly URL slug
  address: string | null;
  city?: string | null;
  hourly_price: number | null;
  cover_url: string | null;

  ps5_count?: number | null;
  ps4_count?: number | null;
  xbox_count?: number | null;
  pc_count?: number | null;
  pool_count?: number | null;
  arcade_count?: number | null;

  // NEW
  steering_wheel_count?: number | null; // racing rigs
  vr_count?: number | null;             // VR setups
  snooker_count?: number | null;        // snooker tables

  // status flags
  is_active?: boolean | null;   // used by "Deactivate" in admin
  is_deleted?: boolean | null;  // used by "Delist" / soft delete

  // café details
  opening_hours?: string | null;
  peak_hours?: string | null;
  popular_games?: string | null;
  offers?: string | null;

  // device specs
  monitor_details?: string | null;
  processor_details?: string | null;
  gpu_details?: string | null;
  ram_details?: string | null;
  accessories_details?: string | null;

  created_at?: string;
};