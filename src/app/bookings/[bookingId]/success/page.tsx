"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type BookingRow = {
  id: string;
  cafe_id: string | null;
  booking_date: string | null;
  start_time: string | null;
  total_amount: number | null;
  status: string | null;
  created_at: string | null;
};

type CafeRow = {
  id: string;
  name: string;
};

type BookingItemRow = {
  id: string;
  booking_id: string;
  title: string;
  price: number;
  quantity: number;
};

type FullBooking = {
  booking: BookingRow;
  cafe: CafeRow | null;
  items: BookingItemRow[];
};

export default function BookingSuccessPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [data, setData] = useState<FullBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bookingId) return;

      try {
        setLoading(true);
        setErrorMsg(null);

        // 1) booking
        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle();

        if (bookingError) throw bookingError;
        if (!booking) {
          setErrorMsg("Booking not found.");
          return;
        }

        // 2) cafe
        let cafe: CafeRow | null = null;
        if (booking.cafe_id) {
          const { data: cafeRow, error: cafeError } = await supabase
            .from("cafes")
            .select("id, name")
            .eq("id", booking.cafe_id)
            .maybeSingle();

          if (cafeError) throw cafeError;
          cafe = cafeRow ?? null;
        }

        // 3) items
        const { data: itemRows, error: itemsError } = await supabase
          .from("booking_items")
          .select("id, booking_id, title, price, quantity")
          .eq("booking_id", bookingId);

        if (itemsError) throw itemsError;

        if (!cancelled) {
          setData({
            booking,
            cafe,
            items: (itemRows ?? []) as BookingItemRow[],
          });
        }
      } catch (err) {
        console.error("Error loading booking details:", err);
        if (!cancelled) {
          setErrorMsg("Could not load booking details. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  const totalTickets = useMemo(() => {
    if (!data) return 0;
    return data.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  }, [data]);

  const canCancel = useMemo(() => {
    if (!data) return false;
    const status = (data.booking.status || "").toLowerCase();
    if (status === "cancelled") return false;
    if (!data.booking.booking_date) return false;

    const todayStr = new Date().toISOString().slice(0, 10);
    return data.booking.booking_date >= todayStr;
  }, [data]);

  async function handleCancelBooking() {
    if (!data || !bookingId) return;
    if (!canCancel) return;

    const ok = window.confirm(
      "Are you sure you want to cancel this booking? This cannot be undone."
    );
    if (!ok) return;

    try {
      setIsCancelling(true);

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", bookingId);

      if (error) throw error;

      // Update local state so UI reflects cancelled status
      setData((prev) =>
        prev
          ? {
              ...prev,
              booking: { ...prev.booking, status: "cancelled" },
            }
          : prev
      );
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Could not cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  }

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "Date not set";
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "short",
      });
    } catch {
      return dateStr;
    }
  }

  function statusBadge(status?: string | null) {
    const value = (status || "confirmed").toLowerCase();
    const common =
      "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide";

    if (value === "cancelled") {
      return (
        <span className={`${common} bg-red-100 text-red-700`}>CANCELLED</span>
      );
    }
    if (value === "pending") {
      return (
        <span className={`${common} bg-yellow-100 text-yellow-700`}>
          PENDING
        </span>
      );
    }
    return (
      <span className={`${common} bg-emerald-100 text-emerald-700`}>
        CONFIRMED
      </span>
    );
  }

  // ---------- Render ----------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5fb] text-[#111827]">
        <div className="mx-auto max-w-xl px-4 pb-10 pt-6">
          <header className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
              Booking
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              Booking details
            </h1>
          </header>

          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl bg-gray-200/70"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-[#f4f5fb] text-[#111827]">
        <div className="mx-auto max-w-xl px-4 pb-10 pt-6">
          <header className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
              Booking
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-tight">
              Booking details
            </h1>
          </header>
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMsg ?? "Booking not found."}
          </p>
        </div>
      </div>
    );
  }

  const { booking, cafe, items } = data;

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-[#111827]">
      <div className="mx-auto max-w-xl px-4 pb-10 pt-6">
        <header className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
            Booking
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Booking details
          </h1>
        </header>

        {/* Selected cafe */}
        <section className="mb-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className="mb-1 flex items-start justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Selected gaming café
              </p>
              <p className="mt-1 text-[15px] font-semibold">
                {cafe?.name ?? "Gaming Café"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {statusBadge(booking.status)}
              <p className="text-[10px] text-gray-400">
                ID: {booking.id.slice(0, 8)}…
              </p>
            </div>
          </div>

          <p className="mt-2 text-[12px] text-gray-600">
            {formatDate(booking.booking_date)} •{" "}
            {booking.start_time || "Time not set"}
          </p>
        </section>

        {/* Tickets */}
        <section className="mb-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Tickets
          </p>

          {items.length === 0 ? (
            <p className="mt-2 text-[12px] text-gray-500">
              Ticket details are not available.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-[13px]"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-[11px] text-gray-500">
                      {item.quantity} ticket
                      {item.quantity > 1 ? "s" : ""}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ₹{item.price * (item.quantity ?? 1)}
                  </p>
                </div>
              ))}

              <div className="mt-2 border-t border-dashed border-gray-200 pt-2 text-[12px] text-gray-600">
                Total tickets: <span className="font-semibold">{totalTickets}</span>
              </div>
            </div>
          )}
        </section>

        {/* Payment details */}
        <section className="mb-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Payment details
          </p>
          <div className="mt-2 flex items-center justify-between text-[13px]">
            <span>Grand total</span>
            <span className="font-semibold">
              ₹{booking.total_amount ?? 0}
            </span>
          </div>
        </section>

        {/* Info */}
        <section className="mb-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[12px] text-gray-600 shadow-sm">
          Your booking details and café information will also be available in
          your dashboard.
        </section>

        {/* Action buttons */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex-1 rounded-xl bg-[#111827] px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white"
          >
            Go to dashboard
          </button>

          <button
            onClick={() => router.push("/cafes")}
            className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[#111827]"
          >
            Book another café
          </button>
        </div>

        {/* Cancel button */}
        {canCancel && (
          <button
            onClick={handleCancelBooking}
            disabled={isCancelling}
            className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-red-700 disabled:opacity-60"
          >
            {isCancelling ? "Cancelling booking..." : "Cancel booking"}
          </button>
        )}
      </div>
    </div>
  );
}