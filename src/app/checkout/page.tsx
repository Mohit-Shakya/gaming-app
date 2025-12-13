// src/app/checkout/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { ConsoleId, colors, fonts, CONSOLE_LABELS } from "@/lib/constants";
import { getEndTime } from "@/lib/timeUtils";

type CheckoutTicket = {
  ticketId: string;
  console: ConsoleId;
  title: string;
  price: number;
  quantity: number;
};

type CheckoutDraft = {
  cafeId: string;
  cafeName: string;
  bookingDate: string; // "2025-12-06"
  timeSlot: string;    // "2:04 pm" or "2:30 pm"
  tickets: CheckoutTicket[];
  totalAmount: number;
  source: "walk_in" | "online";
};

// ========= THEME =========
// Colors, fonts, and constants imported from @/lib/constants

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();

  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load draft from sessionStorage
  useEffect(() => {
    try {
      const raw =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("checkoutDraft")
          : null;
      if (!raw) {
        setError("No booking in progress.");
        setLoading(false);
        return;
      }
      const parsed = JSON.parse(raw) as CheckoutDraft;
      setDraft(parsed);
      setLoading(false);
    } catch (err) {
      console.error("Failed to read checkoutDraft", err);
      setError("Could not load booking details.");
      setLoading(false);
    }
  }, []);

  async function handlePlaceOrder() {
    if (!draft) return;
    if (!user) {
      alert("Please login again.");
      router.push("/login");
      return;
    }

    setPlacing(true);
    setError(null);

    try {
      const { cafeId, bookingDate, timeSlot, totalAmount, source, tickets } =
        draft;

      // 1. Create booking row
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: cafeId,
          user_id: user.id,
          booking_date: bookingDate,
          start_time: timeSlot,
          total_amount: totalAmount,
          status: "confirmed", // later you can change based on payment
          source, // "online" | "walk_in"
        })
        .select("id")
        .maybeSingle();

      if (bookingError || !bookingData) {
        console.error("Booking insert error", bookingError);
        setError("Could not place booking. Please try again.");
        setPlacing(false);
        return;
      }

      const bookingId = bookingData.id;

      // 2. Insert booking items  ✅ IMPORTANT: include ticket_id
      const itemsPayload = tickets.map((t) => ({
        booking_id: bookingId,
        ticket_id: t.ticketId, // <-- this was missing earlier
        console: t.console,
        title: t.title,
        price: t.price,
        quantity: t.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("booking_items")
        .insert(itemsPayload);

      if (itemsError) {
        console.error("Booking items insert error", itemsError);
        setError("Booking created but items failed. Contact support.");
        setPlacing(false);
        return;
      }

      // Clear draft from session storage
      if (typeof window !== "undefined") {
        window.sessionStorage.removeItem("checkoutDraft");
      }

      // Redirect to success page
      router.replace(`/bookings/success?ref=${bookingId}`);
    } catch (err) {
      console.error("Place order error", err);
      setError("Something went wrong. Please try again.");
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.dark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.body,
          color: colors.textSecondary,
        }}
      >
        Loading checkout…
      </div>
    );
  }

  if (!draft) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.dark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.body,
          color: colors.textSecondary,
          padding: "24px",
          textAlign: "center",
        }}
      >
        {error || "No booking found. Go back and start a new booking."}
      </div>
    );
  }

  const isWalkIn = draft.source === "walk_in";

  // Format date nicely
  const dateLabel = new Date(
    `${draft.bookingDate}T00:00:00`
  ).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalTickets = draft.tickets.reduce((sum, t) => sum + t.quantity, 0);
  const endTime = getEndTime(draft.timeSlot);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top, #1e1b4b 0, #050509 45%)`,
        fontFamily: fonts.body,
        color: colors.textPrimary,
        position: "relative",
      }}
    >
      {/* subtle glow */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          background: `
            radial-gradient(circle at 10% 0%, rgba(255,7,58,0.2) 0, transparent 40%),
            radial-gradient(circle at 90% 100%, rgba(0,240,255,0.12) 0, transparent 45%)
          `,
          opacity: 0.9,
        }}
      />

      <div
        style={{
          maxWidth: "720px",
          margin: "0 auto",
          padding: "16px 16px 140px",
          position: "relative",
          zIndex: 1,
        }}
        className="checkout-container"
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <button
            onClick={() => router.back()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              border: "none",
              color: colors.textSecondary,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 18 }}>←</span>
            Back
          </button>

          {/* Top-right chip */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              background: isWalkIn
                ? "rgba(245,158,11,0.12)"
                : "rgba(22,163,74,0.14)",
              border: `1px solid ${
                isWalkIn ? "rgba(245,158,11,0.7)" : "rgba(22,163,74,0.7)"
              }`,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: isWalkIn ? colors.orange : colors.green,
              }}
            />
            <span style={{ fontFamily: fonts.heading }}>
              {isWalkIn ? "Walk-in Booking" : "Secure Online Checkout"}
            </span>
          </div>
        </header>

        {/* Title */}
        <div style={{ marginBottom: "16px" }}>
          <p
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: colors.textMuted,
              marginBottom: "6px",
            }}
          >
            Checkout
          </p>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "20px",
              fontWeight: 700,
              margin: 0,
            }}
            className="checkout-title"
          >
            Order Summary
          </h1>
        </div>

        {/* Cafe + slot card */}
        <section
          style={{
            background:
              "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(17,24,39,0.95))",
            borderRadius: "16px",
            border: `1px solid ${colors.border}`,
            padding: "14px 16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
          className="cafe-card"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                minWidth: "48px",
                borderRadius: "14px",
                background:
                  "radial-gradient(circle at 0 0, #38bdf8 0, #020617 55%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
              }}
              className="cafe-icon"
            >
              🎮
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  marginBottom: "4px",
                }}
              >
                {draft.cafeName}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: colors.textSecondary,
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <span className="date-text">{dateLabel}</span>
                <span>
                  {draft.timeSlot} – {endTime}{" "}
                  <span style={{ color: colors.textMuted }} className="session-duration">
                    (1 hour session)
                  </span>
                </span>
              </div>

              {/* booking type pill inside card */}
              <div
                style={{
                  marginTop: 6,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 999,
                  background: isWalkIn
                    ? "rgba(245,158,11,0.15)"
                    : "rgba(34,197,94,0.18)",
                  fontSize: 11,
                  color: isWalkIn ? colors.orange : colors.green,
                  border: `1px solid ${
                    isWalkIn
                      ? "rgba(245,158,11,0.5)"
                      : "rgba(34,197,94,0.6)"
                  }`,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                <span>{isWalkIn ? "🚶‍♂️" : "🔒"}</span>
                <span>
                  {isWalkIn ? "Walk-in Booking" : "Online Booking"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Tickets list */}
        <section
          style={{
            marginTop: "12px",
            borderRadius: "16px",
            background: colors.darkerCard,
            border: `1px solid ${colors.border}`,
            overflow: "hidden",
          }}
          className="tickets-section"
        >
          <div
            style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${colors.border}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 16 }}>🎟️</span>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Your Tickets
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                }}
              >
                {totalTickets} ticket
                {totalTickets > 1 ? "s" : ""} · {draft.timeSlot} – {endTime}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: "10px 12px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {draft.tickets.map((t) => {
              if (t.quantity <= 0) return null;
              const lineTotal = t.price * t.quantity;
              return (
                <div
                  key={t.ticketId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 8px",
                    borderRadius: 12,
                    background: "rgba(15,23,42,0.9)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {t.title}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: colors.textMuted,
                      }}
                    >
                      {t.quantity} x ₹{t.price} • {CONSOLE_LABELS[t.console]}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: fonts.heading,
                      fontSize: 14,
                    }}
                  >
                    ₹{lineTotal}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Price summary */}
          <div
            style={{
              borderTop: `1px dashed ${colors.border}`,
              padding: "10px 14px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              <span>Subtotal</span>
              <span>₹{draft.totalAmount}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              <span>GST & charges</span>
              <span>Included</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 4,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <span>Total</span>
              <span style={{ fontFamily: fonts.heading, fontSize: 16 }}>
                ₹{draft.totalAmount}
              </span>
            </div>
          </div>
        </section>

        {/* Info line for walk-in vs online */}
        <section
          style={{ marginTop: 16, fontSize: 12, color: colors.textMuted }}
        >
          {isWalkIn ? (
            <p style={{ margin: 0 }}>
              This is a <strong>walk-in booking</strong>. Your slot is reserved
              for the selected time.{" "}
              <span style={{ color: colors.orange }}>
                Payment will be taken at the café counter.
              </span>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Complete the payment to{" "}
              <strong>lock your slot and confirm your booking.</strong>
            </p>
          )}
        </section>

        {/* Error message */}
        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(248,113,113,0.6)",
              background: "rgba(248,113,113,0.08)",
              fontSize: 12,
              color: "#fecaca",
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          borderTop: `1px solid ${colors.border}`,
          background: "rgba(5,5,9,0.98)",
          backdropFilter: "blur(18px)",
          padding: "12px 16px",
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ₹{draft.totalAmount}
            </div>
            <div
              style={{
                fontSize: 11,
                color: colors.textMuted,
              }}
            >
              {totalTickets} ticket
              {totalTickets > 1 ? "s" : ""} · {draft.timeSlot} – {endTime}
            </div>
          </div>

          <button
            disabled={placing}
            onClick={handlePlaceOrder}
            style={{
              flexShrink: 0,
              padding: "14px 20px",
              minHeight: "48px",
              borderRadius: "999px",
              border: "none",
              fontFamily: fonts.heading,
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "1px",
              textTransform: "uppercase",
              cursor: placing ? "not-allowed" : "pointer",
              background: placing
                ? "rgba(148,163,184,0.3)"
                : isWalkIn
                ? `linear-gradient(135deg, ${colors.orange} 0, #f97316 100%)`
                : `linear-gradient(135deg, ${colors.green} 0, #16a34a 100%)`,
              color: "white",
              minWidth: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
            className="place-order-button"
          >
            {placing && (
              <div
                style={{
                  width: "14px",
                  height: "14px",
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.6s linear infinite",
                }}
              />
            )}
            {placing
              ? "Processing..."
              : isWalkIn
              ? "Confirm Walk-in (Pay at Counter)"
              : `Pay ₹${draft.totalAmount} & Confirm`}
          </button>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (min-width: 640px) {
          .checkout-container {
            padding: 20px 16px 140px !important;
          }
          .checkout-title {
            font-size: 24px !important;
          }
          .cafe-card {
            padding: 16px 18px !important;
            border-radius: 20px !important;
            gap: 16px !important;
          }
          .cafe-icon {
            width: 52px !important;
            height: 52px !important;
            min-width: 52px !important;
            font-size: 26px !important;
          }
          .tickets-section {
            border-radius: 18px !important;
          }
          .place-order-button {
            padding: 12px 22px !important;
            min-width: 190px !important;
          }
        }

        @media (max-width: 400px) {
          .date-text {
            font-size: 11px !important;
          }
          .session-duration {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}