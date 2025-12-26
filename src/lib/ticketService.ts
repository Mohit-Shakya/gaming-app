// src/lib/ticketService.ts
/**
 * Ticket generation and pricing logic
 * Handles console-specific ticket creation with tier-based pricing
 */

import { ConsoleId, CONSOLE_LABELS } from "@/lib/constants";
import { TicketOption, ConsolePricingTier } from "@/types/booking";
import { logger } from "@/lib/logger";

/**
 * Determine maximum bookable quantity for a console type
 * Different console types have different capacity limits
 * @param consoleId The console type identifier
 * @returns Maximum number of consoles that can be booked at once
 */
export function calculateConsoleMaxQuantity(consoleId: ConsoleId): number {
  if (["pool", "snooker"].includes(consoleId)) {
    return 2; // Pool and snooker tables limited to 2
  }
  if (["pc", "vr", "steering"].includes(consoleId)) {
    return 1; // Single-player experiences
  }
  if (consoleId === "xbox") {
    return 2; // Xbox limited to 2 controllers
  }
  return 4; // Default for PS5, PS4, Arcade
}

/**
 * Calculate price for a specific quantity and duration tier
 * @param pricingTier The pricing tier data from database
 * @param quantity Number of consoles (1-4)
 * @param duration Duration in minutes (30, 60, or 90)
 * @param fallbackPrice Hourly price to use if tier pricing unavailable
 * @param consoleId Console identifier for logging
 * @returns Calculated price in rupees
 */
export function determinePriceForTier(
  pricingTier: ConsolePricingTier | null,
  quantity: number,
  duration: 30 | 60 | 90,
  fallbackPrice: number,
  consoleId: ConsoleId
): number {
  // Use tier-based pricing if available, otherwise fallback to simple multiplication
  if (pricingTier) {
    if (duration === 90) {
      // 90min = 60min + 30min pricing
      const price60 = pricingTier[`qty${quantity}_60min` as keyof ConsolePricingTier] ?? (fallbackPrice * quantity);
      const price30 = pricingTier[`qty${quantity}_30min` as keyof ConsolePricingTier] ?? (fallbackPrice * quantity * 0.5);
      return price60 + price30;
    } else {
      const qtyKey = `qty${quantity}_${duration}min` as keyof ConsolePricingTier;
      const tierPrice = pricingTier[qtyKey];

      logger.debug(`💰 [${consoleId}] qty=${quantity}, duration=${duration}min, key=${qtyKey}, tierPrice=${tierPrice}, fallbackPrice=${fallbackPrice}`);

      if (tierPrice !== null && tierPrice !== undefined) {
        logger.debug(`✓ Using tier price: ₹${tierPrice}`);
        return tierPrice;
      } else {
        // Fallback: calculate based on duration ratio
        const calculatedPrice = duration === 30 ? (fallbackPrice * quantity * 0.5) : (fallbackPrice * quantity);
        logger.debug(`✗ Using fallback price: ₹${calculatedPrice}`);
        return calculatedPrice;
      }
    }
  } else {
    logger.debug(`⚠️ [${consoleId}] No pricingTier found, using fallback`);
    if (duration === 90) {
      // 90min = 1.5 hours
      return fallbackPrice * quantity * 1.5;
    } else {
      return duration === 30 ? (fallbackPrice * quantity * 0.5) : (fallbackPrice * quantity);
    }
  }
}

/**
 * Generate ticket options for a console type
 * Creates bookable tickets for all valid quantities (1 to maxConsoles)
 * @param consoleId Console type identifier
 * @param pricingTier Database pricing tier for this console
 * @param fallbackPrice Hourly price if tier pricing unavailable
 * @param duration Booking duration in minutes
 * @returns Array of ticket options for this console
 */
export function generateTickets(
  consoleId: ConsoleId,
  pricingTier: ConsolePricingTier | null,
  fallbackPrice: number,
  duration: 30 | 60 | 90
): TicketOption[] {
  const consoleName = CONSOLE_LABELS[consoleId] || consoleId;
  const tickets: TicketOption[] = [];

  const maxConsoles = calculateConsoleMaxQuantity(consoleId);

  for (let qty = 1; qty <= maxConsoles; qty++) {
    const price = determinePriceForTier(pricingTier, qty, duration, fallbackPrice, consoleId);
    const durationText = duration === 30 ? "30 minutes" : duration === 60 ? "1 hour" : "1.5 hours";

    tickets.push({
      id: `${consoleId}_${qty}`,
      console: consoleId,
      title: `${consoleName} | ${qty} Console${qty > 1 ? "s" : ""}`,
      players: qty,
      price: price,
      description: `${qty} ${consoleName} console${qty > 1 ? "s" : ""} for ${durationText}.`,
    });
  }
  return tickets;
}
