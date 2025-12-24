// src/components/ConsoleStatusDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts, CONSOLE_LABELS, CONSOLE_ICONS } from "@/lib/constants";

type ConsoleId = "ps5" | "ps4" | "xbox" | "pc" | "pool" | "arcade" | "snooker" | "vr" | "steering";

type BookingData = {
  id: string;
  start_time: string;
  duration: number;
  customer_name: string | null;
  user_id: string | null;
  booking_items: Array<{
    console: ConsoleId;
    quantity: number;
  }>;
  profile?: {
    name: string;
  } | null;
};

type ConsoleStatus = {
  id: string;
  consoleNumber: number;
  status: "free" | "busy" | "ending_soon";
  booking?: {
    customerName: string;
    startTime: string;
    endTime: string;
    timeRemaining: number;
  };
};

type ConsoleSummary = {
  type: ConsoleId;
  label: string;
  icon: string;
  total: number;
  free: number;
  busy: number;
  statuses: ConsoleStatus[];
};

export default function ConsoleStatusDashboard({ cafeId }: { cafeId: string }) {
  const [consoleData, setConsoleData] = useState<ConsoleSummary[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const loadConsoleStatus = async () => {
    try {
      setLoading(true);

      // Get cafe data
      const { data: cafe, error: cafeError } = await supabase
        .from("cafes")
        .select("ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count")
        .eq("id", cafeId)
        .single();

      if (cafeError || !cafe) {
        console.error("Error loading cafe:", cafeError);
        return;
      }

      // Get today's confirmed bookings
      const today = new Date().toISOString().split("T")[0];
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          duration,
          customer_name,
          user_id,
          booking_items (console, quantity)
        `)
        .eq("cafe_id", cafeId)
        .eq("booking_date", today)
        .eq("status", "confirmed");

      if (bookingsError) {
        console.error("Error loading bookings:", bookingsError);
        return;
      }

      // Fetch user profiles
      const userIds = bookings?.filter(b => b.user_id).map(b => b.user_id) || [];
      let profilesMap: Record<string, { name: string }> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);

        profiles?.forEach(p => {
          profilesMap[p.id] = { name: p.name };
        });
      }

      // Merge profiles with bookings
      const enrichedBookings: BookingData[] = (bookings || []).map(b => ({
        ...b,
        profile: b.user_id ? profilesMap[b.user_id] : null
      }));

      console.log("📊 All bookings:", enrichedBookings.map(b => ({
        customer: b.customer_name || b.profile?.name,
        items: b.booking_items
      })));

      // Build console summaries
      const summaries = buildConsoleSummaries(cafe, enrichedBookings);

      setConsoleData(summaries);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading console status:", error);
    } finally {
      setLoading(false);
    }
  };

  const buildConsoleSummaries = (cafe: any, bookings: BookingData[]): ConsoleSummary[] => {
    const consoleTypes: Array<{ id: ConsoleId; key: string }> = [
      { id: "ps5", key: "ps5_count" },
      { id: "ps4", key: "ps4_count" },
      { id: "xbox", key: "xbox_count" },
      { id: "pc", key: "pc_count" },
      { id: "pool", key: "pool_count" },
      { id: "arcade", key: "arcade_count" },
      { id: "snooker", key: "snooker_count" },
      { id: "vr", key: "vr_count" },
      { id: "steering", key: "steering_wheel_count" },
    ];

    const summaries: ConsoleSummary[] = [];
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Filter active/upcoming bookings
    const activeBookings = bookings.filter(b => {
      if (!b.start_time || !b.duration) return false;
      const startMinutes = parseTimeToMinutes(b.start_time);
      const endMinutes = startMinutes + b.duration;
      return currentMinutes < endMinutes; // Include if not ended yet
    });

    consoleTypes.forEach(({ id, key }) => {
      const total = cafe[key] || 0;
      if (total === 0) return;

      // Get bookings for this console type
      const consoleBookings = activeBookings
        .filter(b => b.booking_items?.some(item => item.console === id))
        .map(b => ({
          ...b,
          quantity: b.booking_items?.find(item => item.console === id)?.quantity || 1
        }));

      console.log(`📋 ${id.toUpperCase()}: ${consoleBookings.length} bookings, ${total} total units`);

      const statuses: ConsoleStatus[] = [];
      let busyCount = 0;

      // Assign each console unit
      for (let unitNumber = 1; unitNumber <= total; unitNumber++) {
        const booking = findBookingForUnit(unitNumber, consoleBookings);

        if (booking) {
          const customerName = booking.customer_name || booking.profile?.name || "Guest";
          const startMinutes = parseTimeToMinutes(booking.start_time);
          const endMinutes = startMinutes + booking.duration;
          const hasStarted = currentMinutes >= startMinutes;

          let timeRemaining: number;
          let status: "busy" | "ending_soon";

          if (hasStarted) {
            // Booking is active
            timeRemaining = endMinutes - currentMinutes;
            status = timeRemaining <= 15 ? "ending_soon" : "busy";
          } else {
            // Booking is upcoming
            timeRemaining = startMinutes - currentMinutes;
            status = "busy"; // Show as busy even if upcoming
          }

          statuses.push({
            id: `${id}-${unitNumber}`,
            consoleNumber: unitNumber,
            status,
            booking: {
              customerName,
              startTime: booking.start_time,
              endTime: formatEndTime(startMinutes, booking.duration),
              timeRemaining
            }
          });

          busyCount++;
        } else {
          statuses.push({
            id: `${id}-${unitNumber}`,
            consoleNumber: unitNumber,
            status: "free"
          });
        }
      }

      summaries.push({
        type: id,
        label: CONSOLE_LABELS[id] || id,
        icon: CONSOLE_ICONS[id] || "🎮",
        total,
        free: total - busyCount,
        busy: busyCount,
        statuses
      });
    });

    return summaries;
  };

  const findBookingForUnit = (unitNumber: number, bookings: any[]): any => {
    let currentUnit = 1;

    for (const booking of bookings) {
      const endUnit = currentUnit + booking.quantity - 1;

      if (unitNumber >= currentUnit && unitNumber <= endUnit) {
        return booking;
      }

      currentUnit += booking.quantity;
    }

    return null;
  };

  const parseTimeToMinutes = (timeStr: string): number => {
    const [time, period] = timeStr.toLowerCase().split(" ");
    const [hours, minutes] = time.split(":").map(Number);
    let totalHours = hours;
    if (period === "pm" && hours !== 12) totalHours += 12;
    if (period === "am" && hours === 12) totalHours = 0;
    return totalHours * 60 + minutes;
  };

  const formatEndTime = (startMinutes: number, duration: number): string => {
    const endMinutes = startMinutes + duration;
    const hours = Math.floor(endMinutes / 60) % 24;
    const mins = endMinutes % 60;
    const period = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
  };

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  useEffect(() => {
    loadConsoleStatus();

    if (autoRefresh) {
      const interval = setInterval(loadConsoleStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [cafeId, autoRefresh]);

  if (loading && consoleData.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: colors.textSecondary }}>
        Loading console status...
      </div>
    );
  }

  if (consoleData.length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎮</div>
        <p style={{ color: colors.textSecondary }}>No consoles configured for this café yet.</p>
      </div>
    );
  }

  const totalFree = consoleData.reduce((sum, c) => sum + c.free, 0);
  const totalBusy = consoleData.reduce((sum, c) => sum + c.busy, 0);
  const totalConsoles = totalFree + totalBusy;
  const occupancyRate = totalConsoles > 0 ? Math.round((totalBusy / totalConsoles) * 100) : 0;

  return (
    <div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.darkCard} 0%, ${colors.darkerCard} 100%)`,
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "32px",
        border: `1px solid ${colors.border}`,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "20px",
        }}>
          <div>
            <h2 style={{
              fontFamily: fonts.heading,
              fontSize: "28px",
              color: colors.textPrimary,
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}>
              <span style={{ animation: "pulse 2s ease-in-out infinite" }}>🔴</span>
              Live Console Status
            </h2>
            <p style={{ fontSize: "14px", color: colors.textSecondary }}>
              Last updated: {formatTimeAgo(lastUpdated)}
            </p>
          </div>

          {/* Stats Cards */}
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{
              background: "rgba(34, 197, 94, 0.15)",
              border: "2px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "12px",
              padding: "12px 20px",
              textAlign: "center",
              minWidth: "100px",
            }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#22c55e", fontFamily: fonts.heading }}>
                {totalFree}
              </div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "4px" }}>
                Free
              </div>
            </div>

            <div style={{
              background: "rgba(239, 68, 68, 0.15)",
              border: "2px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "12px 20px",
              textAlign: "center",
              minWidth: "100px",
            }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444", fontFamily: fonts.heading }}>
                {totalBusy}
              </div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "4px" }}>
                Busy
              </div>
            </div>

            <div style={{
              background: "rgba(99, 102, 241, 0.15)",
              border: "2px solid rgba(99, 102, 241, 0.3)",
              borderRadius: "12px",
              padding: "12px 20px",
              textAlign: "center",
              minWidth: "100px",
            }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#6366f1", fontFamily: fonts.heading }}>
                {occupancyRate}%
              </div>
              <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "4px" }}>
                Occupancy
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginTop: "20px",
          paddingTop: "20px",
          borderTop: `1px solid ${colors.border}`,
        }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            padding: "8px 12px",
            background: colors.darkCard,
            borderRadius: "8px",
            border: `1px solid ${colors.border}`,
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: "pointer", width: "16px", height: "16px" }}
            />
            <span style={{ fontSize: "13px", color: colors.textPrimary }}>
              Auto-refresh (30s)
            </span>
          </label>

          <button
            onClick={loadConsoleStatus}
            disabled={loading}
            style={{
              padding: "8px 16px",
              background: loading ? colors.border : colors.cyan,
              border: "none",
              borderRadius: "8px",
              color: loading ? colors.textSecondary : colors.dark,
              fontSize: "13px",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: fonts.body,
              fontWeight: 600,
              transition: "all 0.2s",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "🔄 Refreshing..." : "🔄 Refresh Now"}
          </button>

          <div style={{
            marginLeft: "auto",
            fontSize: "12px",
            color: colors.textSecondary,
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}>
            <span>🟢 Free</span>
            <span>🟡 Ending Soon</span>
            <span>🔴 Busy</span>
          </div>
        </div>
      </div>

      {/* Console Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {consoleData.map((console) => (
          <div key={console.type}>
            {/* Console Type Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}>
              <h3 style={{
                fontFamily: fonts.heading,
                fontSize: "18px",
                color: colors.textPrimary,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span>{console.icon}</span>
                <span>{console.label}</span>
                <span style={{ fontSize: "14px", color: colors.textSecondary }}>
                  ({console.total} total)
                </span>
              </h3>

              <div style={{ display: "flex", gap: "16px", fontSize: "13px" }}>
                <span style={{ color: "#22c55e" }}>🟢 {console.free} Free</span>
                <span style={{ color: "#ef4444" }}>🔴 {console.busy} Busy</span>
              </div>
            </div>

            {/* Console Cards Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "16px",
            }}>
              {console.statuses.map((status) => {
                const isFree = status.status === "free";
                const isEndingSoon = status.status === "ending_soon";

                return (
                  <div
                    key={status.id}
                    style={{
                      background: isFree
                        ? "rgba(34, 197, 94, 0.08)"
                        : isEndingSoon
                        ? "rgba(251, 191, 36, 0.08)"
                        : "rgba(239, 68, 68, 0.08)",
                      border: `2px solid ${
                        isFree
                          ? "rgba(34, 197, 94, 0.4)"
                          : isEndingSoon
                          ? "rgba(251, 191, 36, 0.4)"
                          : "rgba(239, 68, 68, 0.4)"
                      }`,
                      borderRadius: "16px",
                      padding: "20px",
                      minHeight: "160px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = `0 8px 24px ${
                        isFree
                          ? "rgba(34, 197, 94, 0.2)"
                          : isEndingSoon
                          ? "rgba(251, 191, 36, 0.2)"
                          : "rgba(239, 68, 68, 0.2)"
                      }`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Status Badge */}
                    <div style={{
                      position: "absolute",
                      top: "12px",
                      right: "12px",
                      background: isFree
                        ? "rgba(34, 197, 94, 0.2)"
                        : isEndingSoon
                        ? "rgba(251, 191, 36, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                      border: `1.5px solid ${
                        isFree ? "#22c55e" : isEndingSoon ? "#f59e0b" : "#ef4444"
                      }`,
                      borderRadius: "20px",
                      padding: "4px 12px",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: isFree ? "#22c55e" : isEndingSoon ? "#f59e0b" : "#ef4444",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}>
                      {isFree ? "FREE" : isEndingSoon ? "ENDING SOON" : "BUSY"}
                    </div>

                    {/* Console Number */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "16px",
                    }}>
                      <div style={{ fontSize: "32px", filter: isFree ? "grayscale(0)" : "grayscale(0.3)" }}>
                        {console.icon}
                      </div>
                      <div>
                        <div style={{
                          fontFamily: fonts.heading,
                          fontSize: "18px",
                          fontWeight: 700,
                          color: colors.textPrimary,
                        }}>
                          #{status.consoleNumber}
                        </div>
                        <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: "2px" }}>
                          {console.label}
                        </div>
                      </div>
                    </div>

                    {/* Booking Info */}
                    {status.booking ? (
                      <div style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        background: "rgba(0, 0, 0, 0.2)",
                        padding: "12px",
                        borderRadius: "8px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "16px" }}>👤</span>
                          <span style={{ fontSize: "15px", color: colors.textPrimary, fontWeight: 600 }}>
                            {status.booking.customerName}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "14px" }}>🕒</span>
                          <span style={{ fontSize: "13px", color: colors.textSecondary }}>
                            {status.booking.timeRemaining > 120
                              ? `Starts at ${status.booking.startTime}`
                              : `Ends at ${status.booking.endTime}`
                            }
                          </span>
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginTop: "4px",
                          padding: "8px",
                          background: isEndingSoon
                            ? "rgba(251, 191, 36, 0.15)"
                            : "rgba(99, 102, 241, 0.1)",
                          borderRadius: "6px",
                          border: `1px solid ${
                            isEndingSoon ? "rgba(251, 191, 36, 0.3)" : "rgba(99, 102, 241, 0.2)"
                          }`,
                        }}>
                          <span style={{ fontSize: "16px" }}>⏱️</span>
                          <span style={{ fontSize: "14px", color: isEndingSoon ? "#f59e0b" : "#6366f1", fontWeight: 700 }}>
                            {status.booking.timeRemaining > 120
                              ? `Starts in ${status.booking.timeRemaining} min`
                              : `${status.booking.timeRemaining} min left`
                            }
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "20px",
                        background: "rgba(34, 197, 94, 0.05)",
                        borderRadius: "8px",
                        border: "1px dashed rgba(34, 197, 94, 0.3)",
                      }}>
                        <span style={{ fontSize: "24px" }}>✓</span>
                        <span style={{ fontSize: "13px", color: "#22c55e", fontWeight: 600, textAlign: "center" }}>
                          Available Now
                        </span>
                        <span style={{ fontSize: "11px", color: colors.textSecondary }}>
                          Ready for booking
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
