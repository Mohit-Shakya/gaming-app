export const OWNER_BOOKINGS_CHANGED_EVENT = "owner-bookings-changed";

export type OwnerBookingsChangedDetail = {
  action: "deleted" | "restored" | "permanently-deleted" | "updated";
  bookingId?: string;
};

export function dispatchOwnerBookingsChanged(detail?: OwnerBookingsChangedDetail): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<OwnerBookingsChangedDetail | undefined>(OWNER_BOOKINGS_CHANGED_EVENT, { detail }));
}

export function subscribeToOwnerBookingsChanged(
  listener: (detail?: OwnerBookingsChangedDetail) => void
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const wrappedListener = (event: Event) => {
    const customEvent = event as CustomEvent<OwnerBookingsChangedDetail | undefined>;
    listener(customEvent.detail);
  };

  window.addEventListener(OWNER_BOOKINGS_CHANGED_EVENT, wrappedListener);
  return () => window.removeEventListener(OWNER_BOOKINGS_CHANGED_EVENT, wrappedListener);
}
