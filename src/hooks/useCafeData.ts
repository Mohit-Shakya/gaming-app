// src/hooks/useCafeData.ts
/**
 * Custom hook for loading cafe data, pricing, and console availability
 * Handles UUID vs slug resolution and loads all necessary cafe information
 */

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ConsoleId, CONSOLE_DB_KEYS, CONSOLE_LABELS, CONSOLE_COLORS, CONSOLE_ICONS } from "@/lib/constants";
import { ConsolePricingTier } from "@/types/booking";
import { ConsolePricingRow } from "@/types/database";
import { logger } from "@/lib/logger";

export interface ConsoleOption {
  id: ConsoleId;
  label: string;
  icon: string;
  color: string;
  dbKey: string;
}

export interface CafeData {
  // Cafe information
  actualCafeId: string | null; // Resolved UUID
  cafeName: string;
  cafePrice: number;
  googleMapsUrl: string;
  instagramUrl: string;

  // Console availability
  consoleLimits: Partial<Record<ConsoleId, number>>;
  availableConsoles: ConsoleId[];

  // Pricing tiers
  consolePricing: Partial<Record<ConsoleId, ConsolePricingTier>>;

  // Loading states
  loading: boolean;
  error: string | null;
}

/**
 * Hook for loading cafe data and pricing information
 * @param cafeId Cafe UUID or slug
 * @returns Cafe data state
 */
export function useCafeData(cafeId: string | null): CafeData {
  const [actualCafeId, setActualCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");

  const [consoleLimits, setConsoleLimits] = useState<Partial<Record<ConsoleId, number>>>({});
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [consolePricing, setConsolePricing] = useState<Partial<Record<ConsoleId, ConsolePricingTier>>>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCafeData() {
      if (!cafeId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Check if cafeId is a UUID or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeId);

        // Fetch cafe data
        const { data, error: cafeError } = await supabase
          .from("cafes")
          .select(
            "id, name, slug, hourly_price, price_starts_from, google_maps_url, instagram_url, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count"
          )
          .eq(isUUID ? "id" : "slug", cafeId)
          .maybeSingle();

        if (cafeError || !data) {
          logger.error("Error loading cafe:", cafeError);
          setError("Failed to load cafe information");
          return;
        }

        // Store the actual UUID for booking creation
        setActualCafeId(data.id);
        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.price_starts_from ?? data.hourly_price ?? 150);
        setGoogleMapsUrl(data.google_maps_url || "");
        setInstagramUrl(data.instagram_url || "");

        // Build console limits and available list
        const limits: Partial<Record<ConsoleId, number>> = {};
        const available: ConsoleId[] = [];

        const CONSOLES: ConsoleOption[] = [
          { id: "ps5", label: CONSOLE_LABELS.ps5, icon: CONSOLE_ICONS.ps5, color: CONSOLE_COLORS.ps5, dbKey: CONSOLE_DB_KEYS.ps5 },
          { id: "ps4", label: CONSOLE_LABELS.ps4, icon: CONSOLE_ICONS.ps4, color: CONSOLE_COLORS.ps4, dbKey: CONSOLE_DB_KEYS.ps4 },
          { id: "xbox", label: CONSOLE_LABELS.xbox, icon: CONSOLE_ICONS.xbox, color: CONSOLE_COLORS.xbox, dbKey: CONSOLE_DB_KEYS.xbox },
          { id: "pc", label: CONSOLE_LABELS.pc, icon: CONSOLE_ICONS.pc, color: CONSOLE_COLORS.pc, dbKey: CONSOLE_DB_KEYS.pc },
          { id: "pool", label: CONSOLE_LABELS.pool, icon: CONSOLE_ICONS.pool, color: CONSOLE_COLORS.pool, dbKey: CONSOLE_DB_KEYS.pool },
          { id: "arcade", label: CONSOLE_LABELS.arcade, icon: CONSOLE_ICONS.arcade, color: CONSOLE_COLORS.arcade, dbKey: CONSOLE_DB_KEYS.arcade },
          { id: "snooker", label: CONSOLE_LABELS.snooker, icon: CONSOLE_ICONS.snooker, color: CONSOLE_COLORS.snooker, dbKey: CONSOLE_DB_KEYS.snooker },
          { id: "vr", label: CONSOLE_LABELS.vr, icon: CONSOLE_ICONS.vr, color: CONSOLE_COLORS.vr, dbKey: CONSOLE_DB_KEYS.vr },
          { id: "steering", label: CONSOLE_LABELS.steering, icon: CONSOLE_ICONS.steering, color: CONSOLE_COLORS.steering, dbKey: CONSOLE_DB_KEYS.steering },
        ];

        CONSOLES.forEach((c) => {
          const count = data[c.dbKey as keyof typeof data] as number;
          if (count && count > 0) {
            limits[c.id] = count;
            available.push(c.id);
          }
        });

        setConsoleLimits(limits);
        setAvailableConsoles(available);

        // Load console pricing from database
        // IMPORTANT: Use data.id (UUID) not cafeId (could be slug)
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("console_type, quantity, duration_minutes, price")
          .eq("cafe_id", data.id);

        if (!pricingError && pricingData) {
          const pricing: Partial<Record<ConsoleId, ConsolePricingTier>> = {};

          logger.debug("Raw pricing data from database:", pricingData);

          pricingData.forEach((item) => {
            // Map database console_type to ConsoleId
            let consoleId = item.console_type as ConsoleId;
            // Handle steering_wheel mapping
            if (item.console_type === "steering_wheel") {
              consoleId = "steering" as ConsoleId;
            }

            // Initialize tier object if not exists
            if (!pricing[consoleId]) {
              pricing[consoleId] = {
                qty1_30min: null,
                qty1_60min: null,
                qty2_30min: null,
                qty2_60min: null,
                qty3_30min: null,
                qty3_60min: null,
                qty4_30min: null,
                qty4_60min: null,
              };
            }

            // Set the price for the specific quantity and duration
            const qty = item.quantity;
            const duration = item.duration_minutes;
            if (qty >= 1 && qty <= 4 && (duration === 30 || duration === 60)) {
              const qtyKey = `qty${qty}_${duration}min` as keyof ConsolePricingTier;
              pricing[consoleId]![qtyKey] = item.price;
            }
          });

          logger.debug("Processed console pricing:", pricing);
          setConsolePricing(pricing);
        } else if (pricingError) {
          logger.error("Error loading pricing:", pricingError);
        } else {
          logger.warn("No pricing data found for cafe");
        }
      } catch (err) {
        logger.error("Error loading cafe data:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadCafeData();
  }, [cafeId]);

  return {
    actualCafeId,
    cafeName,
    cafePrice,
    googleMapsUrl,
    instagramUrl,
    consoleLimits,
    availableConsoles,
    consolePricing,
    loading,
    error,
  };
}
