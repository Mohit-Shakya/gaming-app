type BookingLike = {
  booking_items?: unknown[] | null;
  booking_orders?: unknown[] | null;
  payment_mode?: string | null;
};

export function isOwnerUseBooking(booking: BookingLike | null | undefined): boolean {
  return (booking?.payment_mode || "").toLowerCase() === "owner";
}

export function isSnackOnlyOrderBooking(booking: BookingLike | null | undefined): boolean {
  const bookingItemCount = Array.isArray(booking?.booking_items) ? booking.booking_items.length : 0;
  const bookingOrderCount = Array.isArray(booking?.booking_orders) ? booking.booking_orders.length : 0;
  return bookingOrderCount > 0 && bookingItemCount === 0;
}

export function isSessionBooking(booking: BookingLike | null | undefined): boolean {
  if (!booking) return false;
  if (isOwnerUseBooking(booking)) return false;
  if (isSnackOnlyOrderBooking(booking)) return false;
  return true;
}
