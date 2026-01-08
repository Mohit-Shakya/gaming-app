// src/hooks/useLiveAvailability.ts
/**
 * Custom hook for fetching and managing live console availability
 * Auto-refreshes every 30 seconds and provides manual refresh capability
 */

import { useState, useEffect, useCallback } from "react";
import { ConsoleId } from "@/lib/constants";
import { ConsoleAvailability } from "@/types/booking";
import { fetchLiveAvailability } from "@/lib/availabilityService";

const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds

export interface LiveAvailabilityState {
  availability: Partial<Record<ConsoleId, ConsoleAvailability>>;
  loading: boolean;
  lastUpdated: Date | null;
}

export interface LiveAvailabilityActions {
  refresh: () => Promise<void>;
}

/**
 * Hook for managing live console availability
 * @param options Configuration for availability fetching
 * @returns Availability state and refresh action
 */
export function useLiveAvailability(options: {
  cafeId: string | null;
  selectedDate: string;
  selectedTime: string;
  selectedDuration: number;
  availableConsoles: ConsoleId[];
  consoleLimits: Partial<Record<ConsoleId, number>>;
  enabled?: boolean; // Allow disabling the hook
}): [LiveAvailabilityState, LiveAvailabilityActions] {
  const {
    cafeId,
    selectedDate,
    selectedTime,
    selectedDuration,
    availableConsoles,
    consoleLimits,
    enabled = true,
  } = options;

  const [availability, setAvailability] = useState<Partial<Record<ConsoleId, ConsoleAvailability>>>({});
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled || !cafeId || !selectedDate || !selectedTime) {
      setAvailability({});
      return;
    }

    try {
      setLoading(true);

      const result = await fetchLiveAvailability({
        cafeId,
        selectedDate,
        selectedTime,
        selectedDuration,
        availableConsoles,
        consoleLimits,
      });

      setAvailability(result);
      setLastUpdated(new Date());
    } catch {
      // Error already logged in service
      setAvailability({});
    } finally {
      setLoading(false);
    }
  }, [enabled, cafeId, selectedDate, selectedTime, selectedDuration, availableConsoles, consoleLimits]);

  // Initial fetch and refresh when dependencies change
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      refresh();
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [enabled, refresh]);

  const state: LiveAvailabilityState = {
    availability,
    loading,
    lastUpdated,
  };

  const actions: LiveAvailabilityActions = {
    refresh,
  };

  return [state, actions];
}
