export const OWNER_BOOKINGS_CHANGED_EVENT = "owner-bookings-changed";

export function dispatchOwnerBookingsChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OWNER_BOOKINGS_CHANGED_EVENT));
}

export function subscribeToOwnerBookingsChanged(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(OWNER_BOOKINGS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(OWNER_BOOKINGS_CHANGED_EVENT, listener);
}
