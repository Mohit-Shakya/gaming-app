export const BOOKING_SOURCE_ONLINE = "online" as const;
export const BOOKING_SOURCE_WALK_IN = "walk_in" as const;
export const BOOKING_SOURCE_MEMBERSHIP = "membership" as const;

export type BookingSource =
  | typeof BOOKING_SOURCE_ONLINE
  | typeof BOOKING_SOURCE_WALK_IN
  | "walk-in"
  | typeof BOOKING_SOURCE_MEMBERSHIP;

export type PaymentMode =
  | "cash"
  | "online"
  | "upi"
  | "owner"
  | "paytm"
  | "gpay"
  | "phonepe"
  | "card";

export function normaliseBookingSource(raw: string | null | undefined): BookingSource | "" {
  if (!raw) return "";

  const normalized = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === BOOKING_SOURCE_WALK_IN) {
    return BOOKING_SOURCE_WALK_IN;
  }
  if (normalized === BOOKING_SOURCE_MEMBERSHIP) {
    return BOOKING_SOURCE_MEMBERSHIP;
  }
  if (normalized === BOOKING_SOURCE_ONLINE) {
    return BOOKING_SOURCE_ONLINE;
  }

  return raw as BookingSource;
}

export function isWalkInSource(raw: string | null | undefined): boolean {
  return normaliseBookingSource(raw) === BOOKING_SOURCE_WALK_IN;
}

export function isMembershipSource(raw: string | null | undefined): boolean {
  return normaliseBookingSource(raw) === BOOKING_SOURCE_MEMBERSHIP;
}

export function isOwnerPaymentMode(raw: string | null | undefined): boolean {
  return raw?.trim().toLowerCase() === "owner";
}
