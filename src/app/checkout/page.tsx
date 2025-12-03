// src/app/checkout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";

type DraftTicket = {
  ticketId: string;
  console: string;
  title: string;
  price: number;
  quantity: number;
};

type CheckoutDraft = {
  cafeId: string;
  cafeName?: string;
  bookingDate: string; // "2025-11-29"
  timeSlot: string; // "10:00 am"
  tickets: DraftTicket[];
  totalAmount: number; // ticket subtotal
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();

  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [offerApplied, setOfferApplied] = useState(true); // default: offer ON
  const [isPaying, setIsPaying] = useState(false);

  // Load draft from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("checkoutDraft");
    if (!raw) {
      setLoadingDraft(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CheckoutDraft;
      setDraft(parsed);
    } catch (err) {
      console.error("Failed to parse checkoutDraft", err);
    } finally {
      setLoadingDraft(false);
    }
  }, []);

  // ---- Amount calculations ----
  const baseAmount = draft?.totalAmount ?? 0;
  const convenienceFee = 13; // flat for now
  const offerDiscount = offerApplied ? 50 : 0;
  const grandTotal = Math.max(baseAmount + convenienceFee - offerDiscount, 0);

  const ticketsCount = useMemo(() => {
    if (!draft) return 0;
    return draft.tickets.reduce((sum, t) => sum + (t.quantity ?? 0), 0);
  }, [draft]);

  // ---- MAIN PAY HANDLER (creates booking in Supabase) ----
  async function handlePayClick() {
  if (!draft) {
    alert("No booking data found. Please start again.");
    return;
  }
  if (!user) {
    alert("Please login to complete your booking.");
    router.push("/login");
    return;
  }

  setIsPaying(true);

  try {
    // 1) create booking row – match YOUR existing columns
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        cafe_id: draft.cafeId,
        user_id: user.id,
        booking_date: draft.bookingDate,   // date column
        start_time: draft.timeSlot,        // use your actual column name here
        total_amount: grandTotal,          // final amount user pays
        status: "confirmed",
      })
      .select("id")
      .single();

    if (bookingError) {
      console.error("Booking insert error:", bookingError);
      throw bookingError;
    }

    const bookingId = booking.id as string;

    // 2) create booking_items rows
    const itemsPayload = draft.tickets.map((t) => ({
      booking_id: bookingId,
      ticket_id: t.ticketId,
      console: t.console,
      title: t.title,
      price: t.price,
      quantity: t.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(itemsPayload);

    if (itemsError) {
      console.error("Booking items insert error:", itemsError);
      throw itemsError;
    }

    // 3) cleanup + redirect
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("checkoutDraft");
    }

    router.replace(`/bookings/${bookingId}/success`);
  } catch (err: any) {
    console.error("Error while creating booking:", err);
    alert(
      `Could not complete booking. Please try again.\n\n${err?.message ?? ""}`
    );
  } finally {
    setIsPaying(false);
  }
}
  // ---- UI ----

  if (loadingDraft) {
    return (
      <div className="min-h-screen bg-[#f4f5fb] flex items-center justify-center">
        <p className="text-sm text-gray-500">Loading checkout…</p>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="min-h-screen bg-[#f4f5fb] flex flex-col items-center justify-center px-4">
        <p className="text-sm text-gray-600 mb-3">
          Your checkout session has expired.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="rounded-lg bg-[#111827] text-white px-4 py-2 text-xs font-semibold uppercase tracking-wide"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5fb] text-[#111827]">
      <div className="max-w-xl mx-auto px-4 pb-28 pt-6">
        {/* Step header */}
        <header className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-[0.18em]">
            Step 1
          </p>
          <h1 className="mt-1 text-lg font-semibold tracking-tight">
            Order Summary
          </h1>
        </header>

        {/* Selected gaming cafe + time */}
        <section className="mb-4 rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
          <div className="text-[11px] font-semibold text-gray-500">
            Selected Gaming Café
          </div>
          <div className="mt-1 text-sm font-semibold">
            {draft.cafeName || "Selected Gaming Café"}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            {new Date(`${draft.bookingDate}T00:00:00`).toLocaleDateString(
              "en-IN",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}{" "}
            • {draft.timeSlot}
          </div>
        </section>

        {/* Tickets card */}
        <section className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">
            Tickets
          </h2>
          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm">
            {draft.tickets.map((t) => (
              <div
                key={t.ticketId}
                className="flex items-center justify-between py-1.5"
              >
                <div>
                  <div className="text-[13px] font-semibold">{t.title}</div>
                  <div className="text-[11px] text-gray-500">
                    {t.quantity} ticket{t.quantity > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-sm font-semibold">
                  ₹{t.price * t.quantity}
                </div>
              </div>
            ))}

            <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-200 pt-2">
              <div className="text-[12px] text-gray-600">
                Ticket subtotal ({ticketsCount} ticket
                {ticketsCount > 1 ? "s" : ""})
              </div>
              <div className="text-sm font-semibold">₹{baseAmount}</div>
            </div>
          </div>
        </section>

        {/* Offers */}
        <section className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">
            Offers
          </h2>
          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-semibold">
                Get 20% OFF up to ₹150
              </div>
              <div className="text-[11px] text-gray-500">
                Save up to ₹150 on this booking.
              </div>
            </div>
            <button
              onClick={() => setOfferApplied((v) => !v)}
              className={`rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide border ${
                offerApplied
                  ? "bg-[#111827] text-white border-[#111827]"
                  : "bg-white text-[#111827] border-gray-300"
              }`}
            >
              {offerApplied ? "Applied" : "Apply"}
            </button>
          </div>
        </section>

        {/* Payment details */}
        <section className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">
            Payment Details
          </h2>
          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm text-[13px]">
            <div className="flex items-center justify-between py-1">
              <span>Ticket amount</span>
              <span>₹{baseAmount}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Convenience fee</span>
              <span>₹{convenienceFee}</span>
            </div>
            <div className="flex items-center justify-between py-1">
              <span>Offer discount</span>
              <span className="text-green-600">− ₹{offerDiscount}</span>
            </div>
            <div className="mt-2 border-t border-gray-200 pt-2 flex items-center justify-between font-semibold">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>
          </div>
        </section>

        {/* Booking details note */}
        <section className="mb-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 mb-2">
            Booking Details
          </h2>
          <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 shadow-sm text-[12px] text-gray-600">
            Tickets and booking details will be sent to your Google account
            email and phone number linked with this login.
          </div>
        </section>
      </div>

      {/* Bottom Pay bar */}
      <div className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between px-4 py-3 gap-3">
          <div className="text-xs">
            <div className="font-semibold">Amount Payable</div>
            <div className="text-lg font-bold">₹{grandTotal}</div>
          </div>
          <button
            disabled={isPaying}
            onClick={handlePayClick}
            className={`rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wide ${
              isPaying
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#111827] text-white"
            }`}
          >
            {isPaying ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
}