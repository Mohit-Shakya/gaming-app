// src/components/ConsoleStatusDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts, CONSOLE_LABELS, CONSOLE_ICONS } from "@/lib/constants";

type ConsoleId = "ps5" | "ps4" | "xbox" | "pc" | "pool" | "arcade" | "snooker" | "vr" | "steering";

type ConsoleStatus = {
  id: string;
  consoleType: ConsoleId;
  consoleNumber: number;
  status: "free" | "busy" | "ending_soon";
  booking?: {
    id: string;
    customerName: string;
    startTime: string;
    endTime: string;
    duration: number;
    timeRemaining: number; // minutes
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

  // Calculate time remaining in minutes
  const calculateTimeRemaining = (endTime: string): number => {
    const now = new Date();
    const [time, period] = endTime.toLowerCase().split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let endHours = hours;
    if (period === "pm" && hours !== 12) endHours += 12;
    if (period === "am" && hours === 12) endHours = 0;

    const endDate = new Date();
    endDate.setHours(endHours, minutes, 0, 0);

    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.floor(diff / 60000)); // Convert to minutes
  };

  // Load console status
  const loadConsoleStatus = async () => {
    try {
      setLoading(true);

      console.log('🔍 Loading console status for cafe:', cafeId);

      // Get cafe console counts
      const { data: cafe, error: cafeError } = await supabase
        .from("cafes")
        .select("ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count")
        .eq("id", cafeId)
        .single();

      console.log('Cafe data:', cafe);
      console.log('Cafe error:', cafeError);

      if (cafeError) {
        console.error('❌ Error loading cafe:', cafeError);
        throw cafeError;
      }

      if (!cafe) {
        console.warn('⚠️ No cafe found with ID:', cafeId);
        return;
      }

      // Get today's active bookings
      const today = new Date().toISOString().split("T")[0];
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          duration,
          customer_name,
          booking_items (console, quantity),
          profiles!bookings_user_id_fkey (name)
        `)
        .eq("cafe_id", cafeId)
        .eq("booking_date", today)
        .in("status", ["confirmed", "active"]);

      if (bookingsError) throw bookingsError;

      const now = new Date();
      const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();

      // Calculate end time from start time and duration
      const parseTime = (timeStr: string): number => {
        const [time, period] = timeStr.toLowerCase().split(" ");
        const [hours, minutes] = time.split(":").map(Number);
        let totalHours = hours;
        if (period === "pm" && hours !== 12) totalHours += 12;
        if (period === "am" && hours === 12) totalHours = 0;
        return totalHours * 60 + minutes;
      };

      // Process active bookings
      const activeBookings = bookings?.filter((b: any) => {
        if (!b.start_time || !b.duration) return false;
        const startMinutes = parseTime(b.start_time);
        const endMinutes = startMinutes + (b.duration || 0);
        return currentTimeMinutes >= startMinutes && currentTimeMinutes < endMinutes;
      }) || [];

      // Build console status data
      const consoleTypes: { id: ConsoleId; key: string }[] = [
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

      consoleTypes.forEach(({ id, key }) => {
        const total = (cafe as any)[key] || 0;
        if (total === 0) return; // Skip consoles not available at this cafe

        const statuses: ConsoleStatus[] = [];

        // Find bookings for this console type with their quantities
        const consoleBookings = activeBookings
          .filter((b: any) => b.booking_items?.some((item: any) => item.console === id))
          .map((b: any) => {
            const item = b.booking_items?.find((i: any) => i.console === id);
            return {
              ...b,
              consoleQuantity: item?.quantity || 1,
            };
          });

        let busyCount = 0;

        // Create status for each console unit
        for (let i = 1; i <= total; i++) {
          // Check if this console unit is covered by any active booking
          let assignedBooking = null;

          // Find which booking uses this console unit
          let currentConsole = 1;
          for (const booking of consoleBookings) {
            const bookingEndConsole = currentConsole + booking.consoleQuantity - 1;

            if (i >= currentConsole && i <= bookingEndConsole) {
              assignedBooking = booking;
              break;
            }

            currentConsole += booking.consoleQuantity;
          }

          if (assignedBooking) {
            const startMinutes = parseTime(assignedBooking.start_time);
            const endMinutes = startMinutes + assignedBooking.duration;
            const endHours = Math.floor(endMinutes / 60) % 24;
            const endMins = endMinutes % 60;
            const endPeriod = endHours >= 12 ? "pm" : "am";
            const displayHours = endHours % 12 || 12;
            const endTime = `${displayHours}:${endMins.toString().padStart(2, "0")} ${endPeriod}`;

            const timeRemaining = calculateTimeRemaining(endTime);
            const customerName = assignedBooking.customer_name || (assignedBooking.profiles as any)?.name || "Guest";

            statuses.push({
              id: `${id}-${i}`,
              consoleType: id,
              consoleNumber: i,
              status: timeRemaining <= 15 ? "ending_soon" : "busy",
              booking: {
                id: assignedBooking.id,
                customerName,
                startTime: assignedBooking.start_time,
                endTime,
                duration: assignedBooking.duration,
                timeRemaining,
              },
            });

            busyCount++;
          } else {
            statuses.push({
              id: `${id}-${i}`,
              consoleType: id,
              consoleNumber: i,
              status: "free",
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
          statuses,
        });
      });

      console.log('📊 Console summaries generated:', summaries);
      console.log('Total console types found:', summaries.length);

      setConsoleData(summaries);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("❌ Error loading console status:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and auto-refresh
  useEffect(() => {
    loadConsoleStatus();

    if (autoRefresh) {
      const interval = setInterval(loadConsoleStatus, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [cafeId, autoRefresh]);

  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

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

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div>
          <h2 style={{
            fontFamily: fonts.heading,
            fontSize: "24px",
            color: colors.textPrimary,
            marginBottom: "4px",
          }}>
            🔴 Live Console Status
          </h2>
          <p style={{
            fontSize: "13px",
            color: colors.textSecondary,
          }}>
            Updated: {formatTimeAgo(lastUpdated)}
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span style={{ fontSize: "13px", color: colors.textSecondary }}>Auto-refresh</span>
          </label>

          <button
            onClick={loadConsoleStatus}
            style={{
              padding: "8px 16px",
              background: colors.darkCard,
              border: `1px solid ${colors.border}`,
              borderRadius: "8px",
              color: colors.textPrimary,
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: fonts.body,
            }}
          >
            🔄 Refresh
          </button>
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
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
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
                        ? "rgba(34, 197, 94, 0.1)"
                        : isEndingSoon
                        ? "rgba(251, 191, 36, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                      border: `2px solid ${
                        isFree
                          ? "rgba(34, 197, 94, 0.3)"
                          : isEndingSoon
                          ? "rgba(251, 191, 36, 0.3)"
                          : "rgba(239, 68, 68, 0.3)"
                      }`,
                      borderRadius: "12px",
                      padding: "16px",
                      minHeight: "140px",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Console Number & Status */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}>
                      <span style={{
                        fontFamily: fonts.heading,
                        fontSize: "16px",
                        fontWeight: 700,
                        color: colors.textPrimary,
                      }}>
                        {console.label} #{status.consoleNumber}
                      </span>

                      <span style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: isFree ? "#22c55e" : isEndingSoon ? "#f59e0b" : "#ef4444",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        {isFree ? "🟢 FREE" : isEndingSoon ? "🟡 ENDING SOON" : "🔴 BUSY"}
                      </span>
                    </div>

                    {/* Booking Details */}
                    {status.booking ? (
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ fontSize: "14px", color: colors.textPrimary, fontWeight: 600 }}>
                          {status.booking.customerName}
                        </div>
                        <div style={{ fontSize: "13px", color: colors.textSecondary }}>
                          Ends: {status.booking.endTime}
                        </div>
                        <div style={{ fontSize: "13px", color: isEndingSoon ? "#f59e0b" : colors.textSecondary, fontWeight: 600 }}>
                          ⏱️ {status.booking.timeRemaining} min remaining
                        </div>
                      </div>
                    ) : (
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "13px", color: colors.textSecondary }}>
                          Available for booking
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
    </div>
  );
}
