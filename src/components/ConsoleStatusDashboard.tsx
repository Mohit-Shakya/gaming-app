// src/components/ConsoleStatusDashboard.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts, CONSOLE_LABELS, CONSOLE_ICONS } from "@/lib/constants";
import { logger } from "@/lib/logger";

type ConsoleId = "ps5" | "ps4" | "xbox" | "pc" | "pool" | "arcade" | "snooker" | "vr" | "steering";

type CafeConsoleCounts = {
  ps5_count: number;
  ps4_count: number;
  xbox_count: number;
  pc_count: number;
  pool_count: number;
  arcade_count: number;
  snooker_count: number;
  vr_count: number;
  steering_wheel_count: number;
};

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
    controllerCount?: number;
  };
};

/**
 * Format time remaining in a user-friendly way
 * Converts minutes to hours and minutes for better readability
 */
function formatTimeRemaining(minutes: number, isActive: boolean): string {
  if (isActive) {
    // Active booking - show minutes left
    return `${minutes} min left`;
  }

  // Future booking
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
      return `Starts in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    } else {
      return `Starts in ${hours}h ${mins}min`;
    }
  } else {
    return `Starts in ${minutes} min`;
  }
}

/**
 * Get display category and emoji for booking based on time remaining
 */
function getBookingCategory(timeRemaining: number, isActive: boolean): { emoji: string; label: string } {
  if (isActive) {
    return { emoji: "⏱️", label: "In Progress" };
  }

  if (timeRemaining >= 180) {
    // 3+ hours away
    return { emoji: "📅", label: "Upcoming Today" };
  } else if (timeRemaining >= 60) {
    // 1-3 hours away
    return { emoji: "⏳", label: "Starting Later" };
  } else if (timeRemaining >= 30) {
    // 30-60 min away
    return { emoji: "🔜", label: "Starting Soon" };
  } else {
    // Under 30 min
    return { emoji: "⏱️", label: "Starting Very Soon" };
  }
}

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

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

      // Get today's in-progress bookings (started by owner)
      const today = new Date().toISOString().split("T")[0];
      console.log("[ConsoleStatus] Loading bookings for date:", today);

      const { data: bookings, error: bookingsError} = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          duration,
          customer_name,
          user_id,
          booking_date,
          status,
          source,
          booking_items (console, quantity)
        `)
        .eq("cafe_id", cafeId)
        .eq("booking_date", today)
        .eq("status", "in-progress");

      console.log("[ConsoleStatus] Found bookings:", bookings?.length || 0);
      if (bookings && bookings.length > 0) {
        console.log("[ConsoleStatus] Bookings details:", bookings);
      }

      if (bookingsError) {
        logger.error("Error loading bookings:", bookingsError);
        return;
      }

      // Fetch user profiles
      const userIds = bookings?.filter(b => b.user_id).map(b => b.user_id) || [];
      const profilesMap: Record<string, { name: string }> = {};

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

      // Fetch active membership sessions
      const { data: activeSubscriptions, error: subsError } = await supabase
        .from("subscriptions")
        .select(`
          id,
          customer_name,
          assigned_console_station,
          timer_start_time,
          membership_plans (
            console_type
          )
        `)
        .eq("cafe_id", cafeId)
        .eq("timer_active", true);

      console.log("[ConsoleStatus] Found active memberships:", activeSubscriptions?.length || 0);
      if (subsError) {
        logger.error("Error loading subscriptions:", subsError);
      }

      // Build console summaries with both bookings and memberships
      const summaries = buildConsoleSummaries(cafe, enrichedBookings, activeSubscriptions || []);

      setConsoleData(summaries);
      setLastUpdated(new Date());
    } catch (error) {
      logger.error("Error loading console status:", error);
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buildConsoleSummaries = (cafe: CafeConsoleCounts, bookings: BookingData[], memberships: any[]): ConsoleSummary[] => {
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
      const total = cafe[key as keyof CafeConsoleCounts] || 0;
      if (total === 0) return;

      // Get bookings for this console type
      // NOTE: quantity in booking_items represents number of controllers, not console units
      // For bulk bookings, we need to count EACH booking_item as occupying a separate console unit
      // Handle console name mapping: "steering_wheel" in DB maps to "steering" in app
      const consoleBookings: Array<BookingData & { quantity: number; controllerCount: number }> = [];

      activeBookings.forEach(b => {
        // Find ALL booking_items that match this console type (not just the first one)
        const matchingItems = b.booking_items?.filter(item => {
          const itemConsole = (item.console as string) === 'steering_wheel' ? 'steering' : item.console;
          return itemConsole === id;
        }) || [];

        // Add one entry to consoleBookings for EACH matching booking_item
        // This ensures bulk bookings with multiple consoles are counted correctly
        matchingItems.forEach(item => {
          consoleBookings.push({
            ...b,
            quantity: 1, // Each booking_item occupies 1 console unit
            controllerCount: item.quantity || 1 // Controllers per console
          });
        });
      });

      const statuses: ConsoleStatus[] = [];
      let busyCount = 0;

      // Map console type names for memberships
      const consoleTypeMap: Record<string, ConsoleId> = {
        'PC': 'pc',
        'PS5': 'ps5',
        'PS4': 'ps4',
        'Xbox': 'xbox',
        'Pool': 'pool',
        'Snooker': 'snooker',
        'Arcade': 'arcade',
        'VR': 'vr',
        'Steering': 'steering'
      };

      // Get memberships for this console type
      const consoleMemberships = memberships.filter(m => {
        const membershipConsoleType = m.membership_plans?.console_type;
        return membershipConsoleType && consoleTypeMap[membershipConsoleType] === id;
      });

      // Assign each console unit
      for (let unitNumber = 1; unitNumber <= total; unitNumber++) {
        const stationId = `${id}-${unitNumber.toString().padStart(2, '0')}`;

        // Check if this station is occupied by a membership
        const membership = consoleMemberships.find(m => m.assigned_console_station === stationId);

        if (membership) {
          // Station occupied by membership
          const now = new Date();
          const startTime = new Date(membership.timer_start_time);
          const elapsedMinutes = Math.floor((now.getTime() - startTime.getTime()) / 60000);

          statuses.push({
            id: stationId,
            consoleNumber: unitNumber,
            status: "busy",
            booking: {
              customerName: membership.customer_name + " (Membership)",
              startTime: startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
              endTime: "Until stopped",
              timeRemaining: elapsedMinutes, // Show elapsed time as positive
              controllerCount: undefined
            }
          });
          busyCount++;
        } else {
          // Check for regular booking
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
                timeRemaining,
                controllerCount: booking.controllerCount
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

  const findBookingForUnit = (
    unitNumber: number,
    bookings: Array<BookingData & { quantity: number; controllerCount: number }>
  ): (BookingData & { quantity: number; controllerCount: number }) | null => {
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatTimeAgo = (date: Date): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  useEffect(() => {
    loadConsoleStatus();

    // Auto-refresh every 1 second
    const interval = setInterval(loadConsoleStatus, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cafeId]);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const occupancyRate = totalConsoles > 0 ? Math.round((totalBusy / totalConsoles) * 100) : 0;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{ padding: isMobile ? "12px" : "20px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${colors.darkCard} 0%, ${colors.darkerCard} 100%)`,
        borderRadius: isMobile ? "12px" : "16px",
        padding: isMobile ? "16px" : "24px",
        marginBottom: isMobile ? "16px" : "32px",
        border: `1px solid ${colors.border}`,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: isMobile ? "12px" : "20px",
        }}>
          <div>
            <h2 style={{
              fontFamily: fonts.heading,
              fontSize: isMobile ? "18px" : "28px",
              color: colors.textPrimary,
              marginBottom: isMobile ? "8px" : "12px",
              display: "flex",
              alignItems: "center",
              gap: isMobile ? "8px" : "12px",
            }}>
              <span style={{ animation: "pulse 2s ease-in-out infinite", fontSize: isMobile ? "16px" : "inherit" }}>🔴</span>
              Live Console Status
            </h2>
            <div style={{ display: "flex", gap: isMobile ? "12px" : "20px", flexWrap: "wrap", alignItems: "center" }}>
              <p style={{ fontSize: isMobile ? "12px" : "14px", color: colors.textSecondary, margin: 0 }}>
                Total: {totalFree} / {totalConsoles} Available
              </p>
              <div style={{ height: isMobile ? "12px" : "16px", width: "1px", background: colors.border }} />
              <div style={{ display: "flex", gap: isMobile ? "10px" : "16px", flexWrap: "wrap" }}>
                {consoleData.map((console) => (
                  <span key={console.type} style={{ fontSize: isMobile ? "11px" : "13px", color: colors.textSecondary }}>
                    {console.icon} {console.label}: <span style={{ color: console.free > 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{console.free}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            fontSize: isMobile ? "10px" : "12px",
            color: colors.textSecondary,
            display: "flex",
            alignItems: "center",
            gap: isMobile ? "8px" : "12px",
          }}>
            <span>🟢 Free</span>
            <span>🟡 Ending Soon</span>
            <span>🔴 Busy</span>
          </div>
        </div>
      </div>

      {/* Console Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "16px" : "32px" }}>
        {consoleData.map((console) => (
          <div key={console.type}>
            {/* Console Type Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: isMobile ? "8px" : "16px",
            }}>
              <h3 style={{
                fontFamily: fonts.heading,
                fontSize: isMobile ? "14px" : "18px",
                color: colors.textPrimary,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <span style={{ fontSize: isMobile ? "16px" : "inherit" }}>{console.icon}</span>
                <span>{console.label}</span>
                <span style={{ fontSize: isMobile ? "11px" : "14px", color: colors.textSecondary }}>
                  ({console.total} total)
                </span>
              </h3>

              <div style={{ display: "flex", gap: isMobile ? "10px" : "16px", fontSize: isMobile ? "11px" : "13px" }}>
                <span style={{ color: "#22c55e" }}>🟢 {console.free} Free</span>
                <span style={{ color: "#ef4444" }}>🔴 {console.busy} Busy</span>
              </div>
            </div>

            {/* Console Cards Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
              gap: isMobile ? "10px" : "16px",
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
                      border: `${isMobile ? '1px' : '2px'} solid ${
                        isFree
                          ? "rgba(34, 197, 94, 0.4)"
                          : isEndingSoon
                          ? "rgba(251, 191, 36, 0.4)"
                          : "rgba(239, 68, 68, 0.4)"
                      }`,
                      borderRadius: isMobile ? "10px" : "16px",
                      padding: isMobile ? "12px" : "20px",
                      minHeight: isMobile ? "auto" : "160px",
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
                      top: isMobile ? "8px" : "12px",
                      right: isMobile ? "8px" : "12px",
                      background: isFree
                        ? "rgba(34, 197, 94, 0.2)"
                        : isEndingSoon
                        ? "rgba(251, 191, 36, 0.2)"
                        : "rgba(239, 68, 68, 0.2)",
                      border: `1.5px solid ${
                        isFree ? "#22c55e" : isEndingSoon ? "#f59e0b" : "#ef4444"
                      }`,
                      borderRadius: isMobile ? "12px" : "20px",
                      padding: isMobile ? "3px 8px" : "4px 12px",
                      fontSize: isMobile ? "9px" : "11px",
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
                      gap: isMobile ? "8px" : "10px",
                      marginBottom: isMobile ? "10px" : "16px",
                    }}>
                      <div style={{ fontSize: isMobile ? "24px" : "32px", filter: isFree ? "grayscale(0)" : "grayscale(0.3)" }}>
                        {console.icon}
                      </div>
                      <div>
                        <div style={{
                          fontFamily: fonts.heading,
                          fontSize: isMobile ? "14px" : "18px",
                          fontWeight: 700,
                          color: colors.textPrimary,
                        }}>
                          {console.label}-{String(status.consoleNumber).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: isMobile ? "10px" : "12px", color: colors.textSecondary, marginTop: "2px" }}>
                          {console.type.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Booking Info */}
                    {status.booking ? (
                      <div style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: isMobile ? "6px" : "10px",
                        background: "rgba(0, 0, 0, 0.2)",
                        padding: isMobile ? "8px" : "12px",
                        borderRadius: isMobile ? "6px" : "8px",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "8px" }}>
                          <span style={{ fontSize: isMobile ? "14px" : "16px" }}>👤</span>
                          <span style={{ fontSize: isMobile ? "12px" : "15px", color: colors.textPrimary, fontWeight: 600 }}>
                            {status.booking.customerName}
                          </span>
                          {status.booking.controllerCount && status.booking.controllerCount > 1 && (
                            <span style={{
                              fontSize: isMobile ? "9px" : "11px",
                              color: colors.cyan,
                              background: "rgba(0, 188, 212, 0.15)",
                              padding: isMobile ? "2px 6px" : "2px 8px",
                              borderRadius: isMobile ? "8px" : "10px",
                              fontWeight: 600,
                              border: "1px solid rgba(0, 188, 212, 0.3)"
                            }}>
                              {status.booking.controllerCount}× Controllers
                            </span>
                          )}
                        </div>
                        {/* Category Label for Future Bookings */}
                        {status.booking.timeRemaining > 120 && (
                          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "8px", marginBottom: isMobile ? "3px" : "4px" }}>
                            <span style={{ fontSize: isMobile ? "12px" : "14px" }}>
                              {getBookingCategory(status.booking.timeRemaining, false).emoji}
                            </span>
                            <span style={{ fontSize: isMobile ? "10px" : "12px", color: "#a78bfa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                              {getBookingCategory(status.booking.timeRemaining, false).label}
                            </span>
                          </div>
                        )}

                        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "6px" : "8px" }}>
                          <span style={{ fontSize: isMobile ? "12px" : "14px" }}>🕒</span>
                          <span style={{ fontSize: isMobile ? "11px" : "13px", color: colors.textSecondary }}>
                            {status.booking.timeRemaining > 120
                              ? `Starts at ${status.booking.startTime}`
                              : `Ends at ${status.booking.endTime}`
                            }
                          </span>
                        </div>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: isMobile ? "6px" : "8px",
                          marginTop: isMobile ? "3px" : "4px",
                          padding: isMobile ? "6px" : "8px",
                          background: status.booking.timeRemaining > 120
                            ? (status.booking.timeRemaining >= 180
                                ? "rgba(59, 130, 246, 0.1)"  // Blue for far future
                                : status.booking.timeRemaining >= 60
                                  ? "rgba(139, 92, 246, 0.1)"  // Purple for 1-3 hours
                                  : "rgba(249, 115, 22, 0.1)")  // Orange for < 1 hour
                            : isEndingSoon
                              ? "rgba(251, 191, 36, 0.15)"  // Amber for ending soon
                              : "rgba(239, 68, 68, 0.15)",  // Red for active
                          borderRadius: "6px",
                          border: `1px solid ${
                            status.booking.timeRemaining > 120
                              ? (status.booking.timeRemaining >= 180
                                  ? "rgba(59, 130, 246, 0.3)"
                                  : status.booking.timeRemaining >= 60
                                    ? "rgba(139, 92, 246, 0.3)"
                                    : "rgba(249, 115, 22, 0.3)")
                              : isEndingSoon
                                ? "rgba(251, 191, 36, 0.3)"
                                : "rgba(239, 68, 68, 0.3)"
                          }`,
                        }}>
                          <span style={{ fontSize: isMobile ? "14px" : "16px" }}>
                            {status.booking.timeRemaining > 120
                              ? getBookingCategory(status.booking.timeRemaining, false).emoji
                              : "⏱️"
                            }
                          </span>
                          <span style={{
                            fontSize: isMobile ? "11px" : "14px",
                            color: status.booking.timeRemaining > 120
                              ? (status.booking.timeRemaining >= 180
                                  ? "#3b82f6"  // Blue
                                  : status.booking.timeRemaining >= 60
                                    ? "#8b5cf6"  // Purple
                                    : "#f97316")  // Orange
                              : isEndingSoon
                                ? "#f59e0b"  // Amber
                                : "#ef4444",  // Red
                            fontWeight: 700
                          }}>
                            {formatTimeRemaining(status.booking.timeRemaining, status.booking.timeRemaining <= 120)}
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
                        gap: isMobile ? "6px" : "8px",
                        padding: isMobile ? "12px" : "20px",
                        background: "rgba(34, 197, 94, 0.05)",
                        borderRadius: isMobile ? "6px" : "8px",
                        border: "1px dashed rgba(34, 197, 94, 0.3)",
                      }}>
                        <span style={{ fontSize: isMobile ? "18px" : "24px" }}>✓</span>
                        <span style={{ fontSize: isMobile ? "11px" : "13px", color: "#22c55e", fontWeight: 600, textAlign: "center" }}>
                          Available Now
                        </span>
                        <span style={{ fontSize: isMobile ? "9px" : "11px", color: colors.textSecondary }}>
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
