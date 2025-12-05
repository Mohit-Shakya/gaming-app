// src/app/bookings/[bookingId]/success/page.tsx
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
  console?: string;
};

type FullBooking = {
  booking: BookingRow;
  cafe: CafeRow | null;
  items: BookingItemRow[];
};

// ============ STYLES ============
const colors = {
  red: "#ff073a",
  cyan: "#00f0ff",
  dark: "#08080c",
  darkCard: "#0f0f14",
  border: "rgba(255, 255, 255, 0.08)",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  green: "#22c55e",
  greenDark: "#16a34a",
  orange: "#f59e0b",
  purple: "#a855f7",
};

const fonts = {
  heading: "'Orbitron', sans-serif",
  body: "'Rajdhani', sans-serif",
};

// Console icons
const consoleIcons: Record<string, string> = {
  ps5: "🎮",
  ps4: "🎮",
  xbox: "🎮",
  pc: "💻",
  pool: "🎱",
  arcade: "🕹️",
  snooker: "🎱",
  vr: "🥽",
  steering: "🏎️",
};

export default function BookingSuccessPage() {
  const params = useParams<{ bookingId: string }>();
  const router = useRouter();
  const bookingId = params.bookingId;

  const [data, setData] = useState<FullBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bookingId) return;

      try {
        setLoading(true);
        setErrorMsg(null);

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

        const { data: itemRows, error: itemsError } = await supabase
          .from("booking_items")
          .select("id, booking_id, title, price, quantity, console")
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

  function getStatusInfo(status?: string | null) {
    const value = (status || "confirmed").toLowerCase();
    
    if (value === "cancelled") {
      return {
        label: "CANCELLED",
        bg: "rgba(239, 68, 68, 0.15)",
        border: "rgba(239, 68, 68, 0.3)",
        color: "#ef4444",
        icon: "✕",
      };
    }
    if (value === "pending") {
      return {
        label: "PENDING",
        bg: "rgba(245, 158, 11, 0.15)",
        border: "rgba(245, 158, 11, 0.3)",
        color: colors.orange,
        icon: "⏳",
      };
    }
    return {
      label: "CONFIRMED",
      bg: "rgba(34, 197, 94, 0.15)",
      border: "rgba(34, 197, 94, 0.3)",
      color: colors.green,
      icon: "✓",
    };
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
        fontFamily: fonts.body,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "56px",
            height: "56px",
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.cyan,
            borderRadius: "50%",
            margin: "0 auto 20px",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: colors.textSecondary, fontSize: "14px" }}>
            Loading your booking...
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Error state
  if (errorMsg || !data) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
        fontFamily: fonts.body,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>😕</div>
        <h1 style={{
          fontFamily: fonts.heading,
          fontSize: "20px",
          color: colors.red,
          marginBottom: "12px",
        }}>
          Booking Not Found
        </h1>
        <p style={{
          color: colors.textSecondary,
          fontSize: "14px",
          marginBottom: "24px",
          textAlign: "center",
        }}>
          {errorMsg ?? "This booking doesn't exist or has been removed."}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          style={{
            padding: "14px 28px",
            background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
            border: "none",
            borderRadius: "12px",
            color: "white",
            fontFamily: fonts.heading,
            fontSize: "13px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1px",
            cursor: "pointer",
          }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const { booking, cafe, items } = data;
  const statusInfo = getStatusInfo(booking.status);
  const isConfirmed = (booking.status || "confirmed").toLowerCase() === "confirmed";

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
      fontFamily: fonts.body,
      color: colors.textPrimary,
      position: "relative",
      overflow: "hidden",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      {/* Background glow */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isConfirmed
          ? `radial-gradient(ellipse at 50% 0%, rgba(34, 197, 94, 0.12) 0%, transparent 50%)`
          : `radial-gradient(ellipse at 50% 0%, rgba(255, 7, 58, 0.08) 0%, transparent 50%)`,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      {/* Confetti effect for confirmed bookings */}
      {showConfetti && isConfirmed && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 10,
          overflow: "hidden",
        }}>
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: "-10px",
                left: `${Math.random() * 100}%`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                background: [colors.red, colors.cyan, colors.green, colors.orange, colors.purple][Math.floor(Math.random() * 5)],
                borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                animation: `confetti-fall ${Math.random() * 3 + 2}s linear forwards`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.8,
              }}
            />
          ))}
        </div>
      )}

      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px 16px 40px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Success Header */}
        <header style={{
          textAlign: "center",
          marginBottom: "32px",
          paddingTop: "20px",
        }}>
          {/* Animated checkmark */}
          <div style={{
            width: "80px",
            height: "80px",
            margin: "0 auto 20px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${statusInfo.bg} 0%, transparent 100%)`,
            border: `2px solid ${statusInfo.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: isConfirmed ? "pulse-success 2s ease-in-out infinite" : "none",
          }}>
            <span style={{
              fontSize: "36px",
              color: statusInfo.color,
            }}>
              {isConfirmed ? "✓" : statusInfo.icon}
            </span>
          </div>

          <h1 style={{
            fontFamily: fonts.heading,
            fontSize: "24px",
            fontWeight: 700,
            color: statusInfo.color,
            marginBottom: "8px",
          }}>
            {isConfirmed ? "Booking Confirmed!" : `Booking ${statusInfo.label}`}
          </h1>
          
          <p style={{
            fontSize: "14px",
            color: colors.textSecondary,
          }}>
            {isConfirmed 
              ? "Get ready for an amazing gaming session! 🎮"
              : "Your booking status has been updated."
            }
          </p>
        </header>

        {/* Booking Card */}
        <section style={{
          background: `linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, ${colors.darkCard} 100%)`,
          border: `1px solid ${isConfirmed ? "rgba(34, 197, 94, 0.2)" : colors.border}`,
          borderRadius: "20px",
          padding: "24px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Top accent */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "3px",
            background: `linear-gradient(90deg, ${colors.green}, ${colors.cyan})`,
          }} />

          {/* Booking ID */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            paddingBottom: "16px",
            borderBottom: `1px solid ${colors.border}`,
          }}>
            <div>
              <p style={{
                fontSize: "11px",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}>
                Booking ID
              </p>
              <p style={{
                fontFamily: fonts.heading,
                fontSize: "14px",
                color: colors.cyan,
                letterSpacing: "1px",
              }}>
                #{booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div style={{
              padding: "6px 14px",
              background: statusInfo.bg,
              border: `1px solid ${statusInfo.border}`,
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span style={{ fontSize: "12px" }}>{statusInfo.icon}</span>
              <span style={{
                fontSize: "11px",
                fontWeight: 600,
                color: statusInfo.color,
                letterSpacing: "0.5px",
              }}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Venue */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              background: `linear-gradient(135deg, ${colors.red}20 0%, ${colors.red}10 100%)`,
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}>
              🎮
            </div>
            <div>
              <p style={{
                fontSize: "18px",
                fontWeight: 600,
                color: colors.textPrimary,
                marginBottom: "4px",
              }}>
                {cafe?.name ?? "Gaming Café"}
              </p>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}>
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: colors.textSecondary,
                }}>
                  <span>📅</span>
                  {formatDate(booking.booking_date)}
                </span>
                <span style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                  color: colors.cyan,
                  fontWeight: 600,
                }}>
                  <span>⏰</span>
                  {booking.start_time || "Time not set"}
                </span>
              </div>
            </div>
          </div>

          {/* Tickets */}
          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            borderRadius: "12px",
            padding: "16px",
          }}>
            <p style={{
              fontSize: "11px",
              color: colors.textMuted,
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "12px",
            }}>
              🎟️ Your Tickets
            </p>

            {items.length === 0 ? (
              <p style={{ fontSize: "13px", color: colors.textSecondary }}>
                Ticket details not available.
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderRadius: "8px",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}>
                      <span style={{ fontSize: "20px" }}>
                        {consoleIcons[item.console || "ps5"] || "🎮"}
                      </span>
                      <div>
                        <p style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: colors.textPrimary,
                        }}>
                          {item.title}
                        </p>
                        <p style={{
                          fontSize: "11px",
                          color: colors.textMuted,
                        }}>
                          {item.quantity} × ₹{item.price}
                        </p>
                      </div>
                    </div>
                    <p style={{
                      fontFamily: fonts.heading,
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.cyan,
                    }}>
                      ₹{item.price * (item.quantity ?? 1)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Payment Summary */}
        <section style={{
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <p style={{
                fontSize: "11px",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "4px",
              }}>
                Total Paid
              </p>
              <p style={{
                fontFamily: fonts.heading,
                fontSize: "28px",
                fontWeight: 700,
                color: colors.textPrimary,
              }}>
                ₹{booking.total_amount ?? 0}
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "rgba(34, 197, 94, 0.1)",
              borderRadius: "10px",
            }}>
              <span style={{ color: colors.green }}>✓</span>
              <span style={{
                fontSize: "12px",
                color: colors.green,
                fontWeight: 600,
              }}>
                Payment Complete
              </span>
            </div>
          </div>
        </section>

        {/* Info Note */}
        <section style={{
          background: "rgba(0, 240, 255, 0.05)",
          border: `1px solid rgba(0, 240, 255, 0.15)`,
          borderRadius: "12px",
          padding: "14px 16px",
          marginBottom: "24px",
          display: "flex",
          alignItems: "flex-start",
          gap: "12px",
        }}>
          <span style={{ fontSize: "18px" }}>💡</span>
          <p style={{
            fontSize: "13px",
            color: colors.textSecondary,
            lineHeight: 1.5,
            margin: 0,
          }}>
            Show this booking at the venue. Your details are also saved in your dashboard for easy access.
          </p>
        </section>

        {/* Action Buttons */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "16px 24px",
              background: `linear-gradient(135deg, ${colors.cyan} 0%, #0891b2 100%)`,
              border: "none",
              borderRadius: "14px",
              color: colors.dark,
              fontFamily: fonts.heading,
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: `0 8px 32px ${colors.cyan}40`,
            }}
          >
            <span>📊</span>
            View Dashboard
          </button>

          <button
            onClick={() => router.push("/")}
            style={{
              padding: "16px 24px",
              background: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              color: colors.textPrimary,
              fontFamily: fonts.heading,
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <span>🎮</span>
            Book Another Café
          </button>

          {canCancel && (
            <button
              onClick={handleCancelBooking}
              disabled={isCancelling}
              style={{
                padding: "14px 24px",
                background: "rgba(239, 68, 68, 0.1)",
                border: `1px solid rgba(239, 68, 68, 0.3)`,
                borderRadius: "12px",
                color: "#ef4444",
                fontFamily: fonts.body,
                fontSize: "13px",
                fontWeight: 600,
                cursor: isCancelling ? "not-allowed" : "pointer",
                opacity: isCancelling ? 0.6 : 1,
                marginTop: "8px",
              }}
            >
              {isCancelling ? "Cancelling..." : "Cancel Booking"}
            </button>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse-success {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(34, 197, 94, 0);
          }
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}