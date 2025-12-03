// src/app/bookings/[bookingId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type BookingRow = {
  id: string;
  cafe_id: string | null;
  user_id: string | null;
  booking_date: string | null; // 'YYYY-MM-DD'
  start_time: string | null; // e.g. "10:00 am"
  total_amount: number | null;
  status: string | null;
  created_at: string | null;
};

type BookingItemRow = {
  id?: string;
  booking_id: string;
  ticket_id: string;
  console: string | null;
  title: string | null;
  price: number | null;
  quantity: number | null;
};

type CafeRow = {
  id: string;
  name: string;
};

type BookingWithRelations = BookingRow & {
  items: BookingItemRow[];
  cafe: CafeRow | null;
};

export default function BookingDetailsPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId;
  const router = useRouter();

  const [data, setData] = useState<BookingWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --------- load booking + items + cafe ----------
  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1) get booking
        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .maybeSingle<BookingRow>();

        if (bookingError) {
          console.error("[BookingDetails] bookingError:", bookingError);
          throw bookingError;
        }

        if (!booking) {
          setErrorMsg("This booking could not be found.");
          return;
        }

        // 2) items
        const { data: itemsRows, error: itemsError } = await supabase
          .from("booking_items")
          .select("*")
          .eq("booking_id", bookingId);

        if (itemsError) {
          console.error("[BookingDetails] itemsError:", itemsError);
          throw itemsError;
        }

        const items = (itemsRows || []) as BookingItemRow[];

        // 3) cafe
        let cafe: CafeRow | null = null;
        if (booking.cafe_id) {
          const { data: cafeRow, error: cafeError } = await supabase
            .from("cafes")
            .select("id, name")
            .eq("id", booking.cafe_id)
            .maybeSingle<CafeRow>();

          if (cafeError) {
            console.error("[BookingDetails] cafeError:", cafeError);
            throw cafeError;
          }
          cafe = cafeRow ?? null;
        }

        if (!cancelled) {
          setData({
            ...booking,
            items,
            cafe,
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

  // -------- helpers --------
  const formattedDate = useMemo(() => {
    if (!data?.booking_date) return "Date not set";
    try {
      const d = new Date(`${data.booking_date}T00:00:00`);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        weekday: "short",
      });
    } catch {
      return data.booking_date;
    }
  }, [data?.booking_date]);

  const totalTickets = useMemo(() => {
    if (!data) return 0;
    return data.items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);
  }, [data]);

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

  // -------- render --------
  return (
    <div className="min-h-screen bg-[#f4f5fb] text-[#111827]">
      <div className="mx-auto max-w-xl px-4 pb-10 pt-6">
        <header className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
            Booking
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Booking details
          </h1>
        </header>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-gray-200/70"
              />
            ))}
          </div>
        ) : errorMsg ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMsg}
          </p>
        ) : !data ? (
          <p className="text-xs text-gray-500">
            Booking not found. It may have been deleted.
          </p>
        ) : (
          <>
            {/* Selected café + slot */}
            <section className="mb-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Selected gaming café
                  </p>
                  <p className="mt-1 text-[15px] font-semibold text-gray-900">
                    {data.cafe?.name ?? "Gaming Café"}
                  </p>
                  <p className="mt-1 text-[12px] text-gray-600">
                    {formattedDate} • {data.start_time || "Time not set"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {statusBadge(data.status)}
                  <p className="text-[11px] text-gray-400">
                    ID: {data.id.slice(0, 8)}…
                  </p>
                </div>
              </div>
            </section>

            {/* Tickets */}
            <section className="mb-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Tickets
              </p>
              <div className="mt-2 space-y-2">
                {data.items.map((item) => (
                  <div
                    key={item.id ?? `${item.ticket_id}-${item.console}`}
                    className="flex items-center justify-between text-[13px]"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.title ?? "Ticket"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {item.quantity ?? 0} ticket
                        {(item.quantity ?? 0) === 1 ? "" : "s"}
                      </p>
                    </div>
                    <p className="text-[13px] font-semibold text-gray-900">
                      ₹{(item.price ?? 0) * (item.quantity ?? 0)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-gray-500">
                Total tickets: {totalTickets}
              </p>
            </section>

            {/* Payment details */}
            <section className="mb-4 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                Payment details
              </p>
              <div className="mt-2 flex items-center justify-between text-[13px]">
                <span>Grand total</span>
                <span className="font-semibold">
                  ₹{data.total_amount ?? 0}
                </span>
              </div>
            </section>

            {/* Info */}
            <section className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-[12px] text-gray-600 shadow-sm">
              Your booking details and café information will also be available
              in your dashboard.
            </section>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 rounded-xl bg-[#111827] px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-white"
              >
                Go to dashboard
              </button>
              <Link
                href="/"
                className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-800"
              >
                Book another café
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}