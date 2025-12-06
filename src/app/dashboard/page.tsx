// src/app/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts } from "@/lib/constants";

type BookingRow = {
  id: string;
  cafe_id: string | null;
  user_id?: string | null;
  booking_date?: string | null;
  start_time?: string | null;
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
  const [userName, setUserName] = useState<string>("");

  // Load user + bookings
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setErrorMsg(null);

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

        // Get user name from metadata
        const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "Gamer";
        setUserName(name.split(" ")[0]); // First name only

        const { data: bookingRows, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("booking_date", { ascending: false });

        if (bookingError) {
          console.error("Supabase bookingError:", bookingError);
          throw bookingError;
        }

        if (!bookingRows || bookingRows.length === 0) {
          if (!cancelled) setBookings([]);
          return;
        }

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

  // Split upcoming vs past
  const { upcoming, past } = useMemo(() => {
    if (!bookings.length)
      return {
        upcoming: [] as BookingWithCafe[],
        past: [] as BookingWithCafe[],
      };

    const todayStr = new Date().toISOString().slice(0, 10);

    const upcomingBookings = bookings
      .filter((b) => {
        const date = b.booking_date ?? "";
        return date >= todayStr;
      })
      .sort((a, b) => (a.booking_date ?? "").localeCompare(b.booking_date ?? ""));

    const pastBookings = bookings
      .filter((b) => {
        const date = b.booking_date ?? "";
        return date < todayStr;
      })
      .sort((a, b) => (b.booking_date ?? "").localeCompare(a.booking_date ?? ""));

    return { upcoming: upcomingBookings, past: pastBookings };
  }, [bookings]);

  // Stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => (b.status || "").toLowerCase() === "confirmed").length;
    const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount ?? 0), 0);
    return { total, confirmed, totalSpent };
  }, [bookings]);

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "Date not set";
    try {
      const d = new Date(`${dateStr}T00:00:00`);
      return d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
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

  function canCancelBooking(b: BookingWithCafe) {
    const status = (b.status || "").toLowerCase();
    if (status === "cancelled") return false;
    if (!b.booking_date) return false;
    const todayStr = new Date().toISOString().slice(0, 10);
    return b.booking_date >= todayStr;
  }

  async function handleCancelBooking(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    
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

  // Booking Card Component
  function BookingCard({ booking, showCancel }: { booking: BookingWithCafe; showCancel?: boolean }) {
    const statusInfo = getStatusInfo(booking.status);
    const canCancel = showCancel && canCancelBooking(booking);
    const isCancelling = cancelingId === booking.id;
    const isUpcoming = (booking.booking_date ?? "") >= new Date().toISOString().slice(0, 10);

    return (
      <div
        onClick={() => router.push(`/bookings/${booking.id}`)}
        style={{
          background: colors.darkCard,
          border: `1px solid ${colors.border}`,
          borderRadius: "16px",
          padding: "16px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          position: "relative",
          overflow: "hidden",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 7, 58, 0.3)";
          e.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.border;
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {/* Left accent bar */}
        <div style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "3px",
          background: isUpcoming ? colors.cyan : colors.textMuted,
          borderRadius: "3px 0 0 3px",
        }} />

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
        }}>
          {/* Left side - Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "10px",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                background: `linear-gradient(135deg, ${colors.red}20 0%, ${colors.red}10 100%)`,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}>
                🎮
              </div>
              <div>
                <p style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: "2px",
                }}>
                  {booking.cafe?.name ?? "Gaming Café"}
                </p>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12px",
                  color: colors.textSecondary,
                }}>
                  <span>📅 {formatDate(booking.booking_date)}</span>
                  <span style={{ color: colors.cyan }}>
                    ⏰ {booking.start_time || "Time TBD"}
                  </span>
                </div>
              </div>
            </div>

            {/* Cancel button */}
            {canCancel && (
              <button
                onClick={(e) => handleCancelBooking(booking.id, e)}
                disabled={isCancelling}
                style={{
                  padding: "6px 12px",
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  borderRadius: "6px",
                  color: "#ef4444",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: isCancelling ? "not-allowed" : "pointer",
                  opacity: isCancelling ? 0.6 : 1,
                  marginTop: "8px",
                }}
              >
                {isCancelling ? "Cancelling..." : "Cancel"}
              </button>
            )}
          </div>

          {/* Right side - Price & Status */}
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "8px",
          }}>
            <p style={{
              fontFamily: fonts.heading,
              fontSize: "18px",
              fontWeight: 700,
              color: colors.cyan,
            }}>
              ₹{booking.total_amount ?? 0}
            </p>
            <div style={{
              padding: "4px 10px",
              background: statusInfo.bg,
              border: `1px solid ${statusInfo.border}`,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}>
              <span style={{ fontSize: "10px" }}>{statusInfo.icon}</span>
              <span style={{
                fontSize: "10px",
                fontWeight: 600,
                color: statusInfo.color,
                letterSpacing: "0.5px",
              }}>
                {statusInfo.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Section Component
  function BookingSection({ 
    title, 
    icon, 
    items, 
    emptyText, 
    emptyIcon,
    showCancel 
  }: { 
    title: string; 
    icon: string;
    items: BookingWithCafe[]; 
    emptyText: string;
    emptyIcon: string;
    showCancel?: boolean;
  }) {
    return (
      <section style={{ marginBottom: "28px" }}>
        <h2 style={{
          fontSize: "13px",
          fontWeight: 600,
          color: colors.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>{icon}</span> {title}
          {items.length > 0 && (
            <span style={{
              marginLeft: "auto",
              padding: "2px 8px",
              background: colors.red + "20",
              borderRadius: "10px",
              fontSize: "11px",
              color: colors.red,
            }}>
              {items.length}
            </span>
          )}
        </h2>

        {items.length === 0 ? (
          <div style={{
            padding: "32px 20px",
            background: colors.darkCard,
            border: `1px dashed ${colors.border}`,
            borderRadius: "16px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "40px", marginBottom: "12px", opacity: 0.5 }}>
              {emptyIcon}
            </div>
            <p style={{
              fontSize: "13px",
              color: colors.textMuted,
              maxWidth: "250px",
              margin: "0 auto",
              lineHeight: 1.5,
            }}>
              {emptyText}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {items.map((booking) => (
              <BookingCard 
                key={booking.id} 
                booking={booking} 
                showCancel={showCancel}
              />
            ))}
          </div>
        )}
      </section>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
        fontFamily: fonts.body,
      }}>
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px 16px",
        }}>
          <div style={{
            height: "100px",
            background: colors.darkCard,
            borderRadius: "16px",
            marginBottom: "20px",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: "80px",
                background: colors.darkCard,
                borderRadius: "16px",
                marginBottom: "12px",
                animation: "pulse 2s ease-in-out infinite",
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 0.8; }
          }
        `}</style>
      </div>
    );
  }

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
          radial-gradient(ellipse at 20% 0%, rgba(255, 7, 58, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(0, 240, 255, 0.06) 0%, transparent 50%)
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
          <p style={{
            fontSize: "12px",
            color: colors.cyan,
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "4px",
          }}>
            Dashboard
          </p>
          <h1 style={{
            fontFamily: fonts.heading,
            fontSize: "24px",
            fontWeight: 700,
            color: colors.textPrimary,
            margin: "0 0 8px 0",
          }}>
            Hey, {userName}! 👋
          </h1>
          <p style={{
            fontSize: "14px",
            color: colors.textSecondary,
          }}>
            Manage your gaming sessions
          </p>
        </header>

        {/* Stats Cards */}
        {bookings.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "28px",
          }}>
            <div style={{
              background: colors.darkCard,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "16px",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: fonts.heading,
                fontSize: "24px",
                fontWeight: 700,
                color: colors.cyan,
                marginBottom: "4px",
              }}>
                {stats.total}
              </p>
              <p style={{
                fontSize: "11px",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Total
              </p>
            </div>
            <div style={{
              background: colors.darkCard,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "16px",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: fonts.heading,
                fontSize: "24px",
                fontWeight: 700,
                color: colors.green,
                marginBottom: "4px",
              }}>
                {upcoming.length}
              </p>
              <p style={{
                fontSize: "11px",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Upcoming
              </p>
            </div>
            <div style={{
              background: colors.darkCard,
              border: `1px solid ${colors.border}`,
              borderRadius: "14px",
              padding: "16px",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: fonts.heading,
                fontSize: "24px",
                fontWeight: 700,
                color: colors.red,
                marginBottom: "4px",
              }}>
                ₹{stats.totalSpent}
              </p>
              <p style={{
                fontSize: "11px",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}>
                Spent
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMsg && (
          <div style={{
            padding: "16px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <span style={{ fontSize: "20px" }}>⚠️</span>
            <p style={{
              fontSize: "13px",
              color: "#ef4444",
              margin: 0,
            }}>
              {errorMsg}
            </p>
          </div>
        )}

        {/* Quick Action */}
        <button
          onClick={() => router.push("/")}
          style={{
            width: "100%",
            padding: "16px 20px",
            background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
            border: "none",
            borderRadius: "14px",
            color: "white",
            fontFamily: fonts.heading,
            fontSize: "14px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            marginBottom: "28px",
            boxShadow: `0 8px 32px ${colors.red}40`,
          }}
        >
          <span style={{ fontSize: "18px" }}>🎮</span>
          Book New Session
        </button>

        {/* Booking Sections */}
        {!errorMsg && (
          <>
            <BookingSection
              title="Upcoming Sessions"
              icon="🎯"
              items={upcoming}
              emptyText="No upcoming sessions. Book a gaming café to get started!"
              emptyIcon="🎮"
              showCancel
            />
            
            <BookingSection
              title="Past Sessions"
              icon="📅"
              items={past}
              emptyText="Your gaming history will appear here after your first session."
              emptyIcon="🕹️"
            />
          </>
        )}

        {/* Empty State for No Bookings */}
        {!errorMsg && bookings.length === 0 && !loading && (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
          }}>
            <div style={{
              width: "100px",
              height: "100px",
              margin: "0 auto 20px",
              background: `linear-gradient(135deg, ${colors.red}20 0%, ${colors.cyan}20 100%)`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "50px",
            }}>
              🎮
            </div>
            <h2 style={{
              fontFamily: fonts.heading,
              fontSize: "18px",
              color: colors.textPrimary,
              marginBottom: "8px",
            }}>
              No Bookings Yet
            </h2>
            <p style={{
              fontSize: "14px",
              color: colors.textSecondary,
              marginBottom: "24px",
              maxWidth: "280px",
              margin: "0 auto 24px",
              lineHeight: 1.5,
            }}>
              Start your gaming adventure by booking your first session at a café near you!
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 