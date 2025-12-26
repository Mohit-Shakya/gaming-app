// src/lib/availabilityService.ts
/**
 * Live availability calculation for booking system
 * Computes real-time console availability based on existing bookings
 */

import { supabase } from "@/lib/supabaseClient";
import { ConsoleId, BOOKING_DURATION_MINUTES } from "@/lib/constants";
import { ConsoleAvailability } from "@/types/booking";
import { BookingWithNestedItems, BookingItemRow } from "@/types/database";
import { timeStringToMinutes, minutesToTimeString, doTimeSlotsOverlap } from "@/lib/timeSlotUtils";
import { logger } from "@/lib/logger";

/**
 * Fetch and compute live availability for all consoles at a specific date/time
 * @param options Parameters for availability check
 * @returns Availability map for each console type
 */
export async function fetchLiveAvailability(options: {
  cafeId: string;
  selectedDate: string;
  selectedTime: string;
  selectedDuration: number;
  availableConsoles: ConsoleId[];
  consoleLimits: Partial<Record<ConsoleId, number>>;
}): Promise<Partial<Record<ConsoleId, ConsoleAvailability>>> {
  const { cafeId, selectedDate, selectedTime, selectedDuration, availableConsoles, consoleLimits } = options;

  if (!cafeId || !selectedDate || !selectedTime) {
    return {};
  }

  try {
    const selectedTimeMinutes = timeStringToMinutes(selectedTime);

    // Fetch all active bookings for this cafe and date
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        start_time,
        booking_items (
          console,
          quantity
        )
      `
      )
      .eq("cafe_id", cafeId)
      .eq("booking_date", selectedDate)
      .neq("status", "cancelled");

    if (bookingsError) {
      logger.error("Error fetching bookings:", bookingsError);
      return {};
    }

    // Initialize availability for all consoles
    const availability: Partial<Record<ConsoleId, ConsoleAvailability>> = {};
    availableConsoles.forEach((consoleId) => {
      availability[consoleId] = {
        total: consoleLimits[consoleId] || 0,
        booked: 0,
        available: consoleLimits[consoleId] || 0,
        nextAvailableAt: null,
      };
    });

    // Track overlapping bookings per console for "next available" calculation
    const overlappingBookingsPerConsole: Partial<
      Record<ConsoleId, { endMinutes: number; quantity: number }[]>
    > = {};

    // Process each booking and check for overlap
    (bookings ?? []).forEach((booking: BookingWithNestedItems) => {
      const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");
      const bookingEndMinutes = bookingStartMinutes + BOOKING_DURATION_MINUTES;

      // Check if this booking overlaps with the selected time slot
      if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, selectedDuration)) {
        (booking.booking_items ?? []).forEach((item: BookingItemRow) => {
          const consoleId = item.console as ConsoleId;
          if (consoleId && availability[consoleId]) {
            // Add to booked count
            availability[consoleId]!.booked += item.quantity || 0;
            availability[consoleId]!.available =
              availability[consoleId]!.total - availability[consoleId]!.booked;

            // Track for "next available" calculation
            if (!overlappingBookingsPerConsole[consoleId]) {
              overlappingBookingsPerConsole[consoleId] = [];
            }
            overlappingBookingsPerConsole[consoleId]!.push({
              endMinutes: bookingEndMinutes,
              quantity: item.quantity || 0,
            });
          }
        });
      }
    });

    // Calculate "next available" time for partially or fully booked consoles
    availableConsoles.forEach((consoleId) => {
      const consoleData = availability[consoleId];
      if (!consoleData) return;

      // Only calculate if console has some bookings
      if (consoleData.available === 0 || consoleData.available < consoleData.total) {
        const overlappingBookings = overlappingBookingsPerConsole[consoleId] || [];

        if (overlappingBookings.length > 0) {
          // Find the earliest end time among overlapping bookings
          const sortedByEndTime = [...overlappingBookings].sort(
            (a, b) => a.endMinutes - b.endMinutes
          );
          const earliestEndMinutes = sortedByEndTime[0].endMinutes;
          availability[consoleId]!.nextAvailableAt = minutesToTimeString(earliestEndMinutes);
        }
      }
    });

    return availability;
  } catch (err) {
    logger.error("Error fetching availability:", err);
    return {};
  }
}
