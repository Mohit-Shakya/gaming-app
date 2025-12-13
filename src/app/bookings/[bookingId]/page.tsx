// src/app/bookings/[bookingId]/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts } from "@/lib/constants";

type BookingRow = {
  id: string;
  cafe_id: string | null;
  user_id: string | null;
  booking_date: string | null;
  start_time: string | null;
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
  google_maps_url?: string | null;
  instagram_url?: string | null;
};

type BookingWithRelations = BookingRow & {
  items: BookingItemRow[];
  cafe: CafeRow | null;
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

export default function BookingDetailsPage() {
  const params = useParams<{ bookingId: string }>();
  const bookingId = params?.bookingId;
  const router = useRouter();

  const [data, setData] = useState<BookingWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Load booking + items + cafe
  useEffect(() => {
    if (!bookingId) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

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

        const { data: itemsRows, error: itemsError } = await supabase
          .from("booking_items")
          .select("*")
          .eq("booking_id", bookingId);

        if (itemsError) {
          console.error("[BookingDetails] itemsError:", itemsError);
          throw itemsError;
        }

        const items = (itemsRows || []) as BookingItemRow[];

        let cafe: CafeRow | null = null;
        if (booking.cafe_id) {
          const { data: cafeRow, error: cafeError } = await supabase
            .from("cafes")
            .select("id, name, google_maps_url, instagram_url")
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

  // Helpers
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

  const canCancel = useMemo(() => {
    if (!data) return false;
    const status = (data.status || "").toLowerCase();
    if (status === "cancelled") return false;
    if (!data.booking_date) return false;

    const todayStr = new Date().toISOString().slice(0, 10);
    return data.booking_date >= todayStr;
  }, [data]);

  const isUpcoming = useMemo(() => {
    if (!data?.booking_date) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return data.booking_date >= todayStr;
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
          ? { ...prev, status: "cancelled" }
          : prev
      );
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Could not cancel booking. Please try again.");
    } finally {
      setIsCancelling(false);
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
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.cyan,
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: colors.textSecondary, fontSize: "14px" }}>
            Loading booking details...
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
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎮</div>
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

  const statusInfo = getStatusInfo(data.status);

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
      fontFamily: fonts.body,
      color: colors.textPrimary,
      position: "relative",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(ellipse at 20% 0%, rgba(255, 7, 58, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(0, 240, 255, 0.04) 0%, transparent 50%)
        `,
        pointerEvents: "none",
        zIndex: 0,
      }} />

      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "20px 16px 40px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header */}
        <header style={{ marginBottom: "24px" }}>
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "none",
              border: "none",
              color: colors.textSecondary,
              fontSize: "14px",
              cursor: "pointer",
              padding: "0",
              marginBottom: "16px",
            }}
          >
            <span style={{ fontSize: "18px" }}>←</span>
            Back to Dashboard
          </button>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <p style={{
                fontSize: "12px",
                color: colors.cyan,
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "4px",
              }}>
                Booking Details
              </p>
              <h1 style={{
                fontFamily: fonts.heading,
                fontSize: "20px",
                fontWeight: 700,
                color: colors.textPrimary,
                margin: 0,
              }}>
                #{data.id.slice(0, 8).toUpperCase()}
              </h1>
            </div>

            {/* Status Badge */}
            <div style={{
              padding: "8px 16px",
              background: statusInfo.bg,
              border: `1px solid ${statusInfo.border}`,
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}>
              <span style={{ fontSize: "14px" }}>{statusInfo.icon}</span>
              <span style={{
                fontSize: "12px",
                fontWeight: 600,
                color: statusInfo.color,
                letterSpacing: "0.5px",
              }}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </header>

        {/* Upcoming/Past Badge */}
        {data.status?.toLowerCase() !== "cancelled" && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: isUpcoming 
              ? "rgba(0, 240, 255, 0.1)" 
              : "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${isUpcoming ? "rgba(0, 240, 255, 0.2)" : colors.border}`,
            borderRadius: "10px",
            marginBottom: "20px",
          }}>
            <span style={{ fontSize: "16px" }}>
              {isUpcoming ? "🎯" : "📅"}
            </span>
            <span style={{
              fontSize: "13px",
              color: isUpcoming ? colors.cyan : colors.textSecondary,
              fontWeight: 500,
            }}>
              {isUpcoming ? "Upcoming Session" : "Past Session"}
            </span>
          </div>
        )}

        {/* Venue Card - Redesigned */}
        <section style={{
          background: colors.darkCard,
          borderRadius: "24px",
          marginBottom: "16px",
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${colors.border}`,
        }}>
          {/* Animated gradient header */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%)`,
            padding: "20px",
            position: "relative",
          }}>
            <div style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M0 0h20v20H0z\" fill=\"none\"/%3E%3Cpath d=\"M0 0h10v10H0zm10 10h10v10H10z\" fill=\"%23000\" fill-opacity=\".05\"/%3E%3C/svg%3E')",
              opacity: 0.3,
            }} />
            <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
              <div style={{
                fontSize: "48px",
                marginBottom: "8px",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.3))",
              }}>🎮</div>
              <h2 style={{
                fontSize: "24px",
                fontWeight: 900,
                color: "white",
                margin: 0,
                fontFamily: fonts.heading,
                textShadow: "0 2px 8px rgba(0,0,0,0.3)",
                letterSpacing: "0.5px",
              }}>
                {data.cafe?.name ?? "Gaming Café"}
              </h2>
            </div>
          </div>

          {/* Body content */}
          <div style={{ padding: "20px" }}>
            {/* Date & Time - Big and Bold */}
            <div style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)`,
              borderRadius: "16px",
              padding: "16px",
              marginBottom: "16px",
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
              }}>
                {/* Date */}
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "36px",
                    marginBottom: "4px",
                  }}>📅</div>
                  <div style={{
                    fontSize: "11px",
                    color: colors.textMuted,
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}>Date</div>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: colors.textPrimary,
                  }}>{formattedDate}</div>
                </div>

                {/* Time */}
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "36px",
                    marginBottom: "4px",
                  }}>⏰</div>
                  <div style={{
                    fontSize: "11px",
                    color: colors.textMuted,
                    marginBottom: "4px",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}>Time</div>
                  <div style={{
                    fontSize: "15px",
                    fontWeight: 700,
                    color: colors.cyan,
                  }}>{data.start_time || "Time not set"}</div>
                </div>
              </div>
            </div>

            {/* Social Links - Clean & Prominent */}
            {data.cafe && (data.cafe.google_maps_url || data.cafe.instagram_url) && (
              <>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: data.cafe.google_maps_url && data.cafe.instagram_url ? "1fr 1fr" : "1fr",
                  gap: "12px",
                  marginBottom: "16px",
                }}>
                  {data.cafe.google_maps_url && (
                    <a
                      href={data.cafe.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px 16px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #4285F4 0%, #357AE8 100%)",
                        textDecoration: "none",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 12px rgba(66, 133, 244, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(66, 133, 244, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(66, 133, 244, 0.3)";
                      }}
                    >
                      <div style={{ fontSize: "40px", marginBottom: "8px" }}>📍</div>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "white",
                        marginBottom: "2px",
                      }}>
                        View Location
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.8)",
                      }}>
                        Get directions
                      </div>
                    </a>
                  )}

                  {data.cafe.instagram_url && (
                    <a
                      href={data.cafe.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "20px 16px",
                        borderRadius: "16px",
                        background: "linear-gradient(135deg, #E1306C 0%, #C13584 100%)",
                        textDecoration: "none",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 12px rgba(225, 48, 108, 0.3)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-3px)";
                        e.currentTarget.style.boxShadow = "0 8px 24px rgba(225, 48, 108, 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(225, 48, 108, 0.3)";
                      }}
                    >
                      <div style={{ fontSize: "40px", marginBottom: "8px" }}>📷</div>
                      <div style={{
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "white",
                        marginBottom: "2px",
                      }}>
                        Follow Us
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: "rgba(255,255,255,0.8)",
                      }}>
                        Tag & share
                      </div>
                    </a>
                  )}
                </div>

                {/* Review CTA */}
                <div style={{
                  padding: "14px 16px",
                  background: `linear-gradient(135deg, ${colors.green}20 0%, ${colors.green}10 100%)`,
                  borderRadius: "12px",
                  border: `2px solid ${colors.green}40`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "24px", marginBottom: "6px" }}>⭐⭐⭐⭐⭐</div>
                  <div style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    color: colors.green,
                    marginBottom: "4px",
                  }}>
                    Enjoyed your session?
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: colors.textMuted,
                    lineHeight: 1.4,
                  }}>
                    Leave a 5-star review and help others discover this venue!
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Tickets Section */}
        <section style={{
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <h3 style={{
            fontSize: "12px",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>🎟️</span> Tickets ({totalTickets})
          </h3>

          {data.items.length === 0 ? (
            <p style={{ fontSize: "13px", color: colors.textSecondary }}>
              No ticket details available.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {data.items.map((item) => (
                <div
                  key={item.id ?? `${item.ticket_id}-${item.console}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "12px",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                  }}>
                    <span style={{ fontSize: "24px" }}>
                      {consoleIcons[item.console || "ps5"] || "🎮"}
                    </span>
                    <div>
                      <p style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: colors.textPrimary,
                        marginBottom: "2px",
                      }}>
                        {item.title ?? "Ticket"}
                      </p>
                      <p style={{
                        fontSize: "12px",
                        color: colors.textMuted,
                      }}>
                        {item.quantity ?? 0} × ₹{item.price ?? 0}
                      </p>
                    </div>
                  </div>
                  <p style={{
                    fontFamily: fonts.heading,
                    fontSize: "16px",
                    fontWeight: 600,
                    color: colors.cyan,
                  }}>
                    ₹{(item.price ?? 0) * (item.quantity ?? 0)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Payment Summary */}
        <section style={{
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
        }}>
          <h3 style={{
            fontSize: "12px",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>💳</span> Payment Summary
          </h3>

          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px",
            background: "rgba(34, 197, 94, 0.08)",
            borderRadius: "12px",
            border: "1px solid rgba(34, 197, 94, 0.15)",
          }}>
            <div>
              <p style={{
                fontSize: "12px",
                color: colors.textMuted,
                marginBottom: "4px",
              }}>
                Total Amount Paid
              </p>
              <p style={{
                fontFamily: fonts.heading,
                fontSize: "28px",
                fontWeight: 700,
                color: colors.textPrimary,
              }}>
                ₹{data.total_amount ?? 0}
              </p>
            </div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "rgba(34, 197, 94, 0.15)",
              borderRadius: "8px",
            }}>
              <span style={{ color: colors.green }}>✓</span>
              <span style={{
                fontSize: "12px",
                color: colors.green,
                fontWeight: 600,
              }}>
                Paid
              </span>
            </div>
          </div>
        </section>

        {/* Booking Info */}
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
          <div>
            <p style={{
              fontSize: "13px",
              color: colors.textSecondary,
              lineHeight: 1.5,
              margin: 0,
            }}>
              {isUpcoming 
                ? "Show this booking at the venue. Arrive 5 minutes early for the best experience!"
                : "Thank you for gaming with us! We hope you had a great time."
              }
            </p>
            <p style={{
              fontSize: "11px",
              color: colors.textMuted,
              marginTop: "8px",
            }}>
              Booked on: {new Date(data.created_at || "").toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
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
            View All Bookings
          </button>

          <Link
            href="/"
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
              textDecoration: "none",
            }}
          >
            <span>🎮</span>
            Book Another Session
          </Link>

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

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}