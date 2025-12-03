"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

type BookingRow = {
  id: string;
  cafe_id: string | null;
  user_id?: string | null;
  booking_date?: string | null; // 'YYYY-MM-DD'
  start_time?: string | null;   // e.g. "10:00 am"
  total_amount?: number | null;
  status?: string | null;
  created_at?: string | null;
};

type CafeRow = {
  id: string;
  name: string;
};

type BookingWithCafe = BookingRow & { cafe?: CafeRow | null };

export default function DashboardPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingWithCafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  // ---------- Load user + bookings ----------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

        // 1) Current user
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error("[Dashboard] auth error:", authError);
          throw authError;
        }

        if (!user) {
          router.replace("/login");
          return;
        }

        console.log("[Dashboard] Loading bookings for user", user.id);

        // 2) Bookings for this user
        const { data: bookingRows, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("booking_date", { ascending: true });

        console.log("[Dashboard] bookings result:", {
          bookingRows,
          bookingError,
        });

        if (bookingError) {
          console.error("Supabase bookingError:", bookingError);
          throw bookingError;
        }

        if (!bookingRows || bookingRows.length === 0) {
          if (!cancelled) setBookings([]);
          return;
        }

        // 3) Cafes referenced by those bookings
        const cafeIds = Array.from(
          new Set(
            bookingRows
              .map((b: BookingRow) => b.cafe_id)
              .filter((id): id is string => !!id)
          )
        );

        const cafeMap = new Map<string, CafeRow>();

        if (cafeIds.length > 0) {
          const { data: cafeRows, error: cafeError } = await supabase
            .from("cafes")
            .select("id, name")
            .in("id", cafeIds);

          console.log("[Dashboard] cafes result:", { cafeRows, cafeError });

          if (cafeError) {
            console.error("Supabase cafeError:", cafeError);
            throw cafeError;
          }

          (cafeRows || []).forEach((c: CafeRow) => {
            cafeMap.set(c.id, c);
          });
        }

        const merged: BookingWithCafe[] = (bookingRows as BookingRow[]).map(
          (b) => ({
            ...b,
            cafe: b.cafe_id ? cafeMap.get(b.cafe_id) ?? null : null,
          })
        );

        if (!cancelled) setBookings(merged);
      } catch (err) {
        console.error("Error loading dashboard bookings:", err);
        if (!cancelled) {
          setErrorMsg("Could not load your bookings. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  // ---------- Split upcoming vs past ----------
  const { upcoming, past } = useMemo(() => {
    if (!bookings.length)
      return {
        upcoming: [] as BookingWithCafe[],
        past: [] as BookingWithCafe[],
      };

    const todayStr = new Date().toISOString().slice(0, 10);

    const upcomingBookings = bookings.filter((b) => {
      const date = b.booking_date ?? "";
      return date >= todayStr;
    });

    const pastBookings = bookings.filter((b) => {
      const date = b.booking_date ?? "";
      return date < todayStr;
    });

    return { upcoming: upcomingBookings, past: pastBookings };
  }, [bookings]);

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

  function canCancelBooking(b: BookingWithCafe) {
    const status = (b.status || "").toLowerCase();
    if (status === "cancelled") return false;
    if (!b.booking_date) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return b.booking_date >= todayStr;
  }

  async function handleCancelBooking(id: string) {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;
    if (!canCancelBooking(booking)) return;

    const ok = window.confirm(
      "Are you sure you want to cancel this booking? This cannot be undone."
    );
    if (!ok) return;

    try {
      setCancelingId(id);

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b))
      );
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Could not cancel booking. Please try again.");
    } finally {
      setCancelingId(null);
    }
  }

  function BookingListSection({
    title,
    items,
    emptyText,
    enableCancel,
  }: {
    title: string;
    items: BookingWithCafe[];
    emptyText: string;
    enableCancel?: boolean;
  }) {
    return (
      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold tracking-tight text-gray-800">
          {title}
        </h2>
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-gray-200 bg-white px-4 py-3 text-xs text-gray-500">
            {emptyText}
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((b) => {
              const cafeName = b.cafe?.name ?? "Gaming Café";
              const canCancel = enableCancel && canCancelBooking(b);
              const isThisCancelling = cancelingId === b.id;

              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
                >
                  <button
                    onClick={() =>
                      router.push(`/bookings/${b.id}/success`)
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="text-[13px] font-semibold text-gray-900">
                          {cafeName}
                        </div>

                        <div className="mt-2 text-[11px] text-gray-600">
                          <span className="font-medium">
                            {formatDate(b.booking_date)}
                          </span>{" "}
                          • <span>{b.start_time || "Time not set"}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="text-sm font-semibold text-gray-900">
                          ₹{b.total_amount ?? 0}
                        </div>
                        {statusBadge(b.status)}
                      </div>
                    </div>
                  </button>

                  {canCancel && (
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelBooking(b.id);
                        }}
                        disabled={isThisCancelling}
                        className="text-[11px] font-semibold uppercase tracking-wide text-red-600 disabled:opacity-60"
                      >
                        {isThisCancelling ? "Cancelling..." : "Cancel booking"}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  // ---------- Render ----------
  return (
    <div className="min-h-screen bg-[#f4f5fb] text-[#111827]">
      <div className="mx-auto max-w-xl px-4 pb-10 pt-6">
        <header className="mb-5">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
            Dashboard
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Your bookings
          </h1>
          <p className="mt-1 text-[12px] text-gray-500">
            View and manage all your gaming café bookings in one place.
          </p>
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
        ) : (
          <>
            <BookingListSection
              title="Upcoming bookings"
              items={upcoming}
              emptyText="You don't have any upcoming bookings yet. Book a gaming café to see it here."
              enableCancel
            />
            <BookingListSection
              title="Past bookings"
              items={past}
              emptyText="Past bookings will show up here once you've completed a booking."
            />
          </>
        )}
      </div>
    </div>
  );
}