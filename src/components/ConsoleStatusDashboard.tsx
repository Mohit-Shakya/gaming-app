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
      console.log('📅 Loading bookings for date:', today);

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          id,
          start_time,
          duration,
          customer_name,
          booking_items (console, quantity)
        `)
        .eq("cafe_id", cafeId)
        .eq("booking_date", today)
        .in("status", ["confirmed"]);

      console.log('Bookings data:', bookings);
      console.log('Bookings error:', bookingsError);

      if (bookingsError) {
        console.error('❌ Error loading bookings:', bookingsError);
        throw bookingsError;
      }

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

  // Calculate overall stats
  const totalFree = consoleData.reduce((sum, c) => sum + c.free, 0);
  const totalBusy = consoleData.reduce((sum, c) => sum + c.busy, 0);

  return (
    <div style={{
      padding: "32px",
      background: "linear-gradient(to bottom, #0a0e1a 0%, #0f1419 100%)",
      minHeight: "100vh",
    }}>
      {/* Header Section */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "32px",
        flexWrap: "wrap",
        gap: "20px",
      }}>
        {/* Title & Stats */}
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "12px",
          }}>
            <div style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 12px rgba(239, 68, 68, 0.6)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }} />
            <h2 style={{
              fontFamily: fonts.heading,
              fontSize: "28px",
              fontWeight: 700,
              color: colors.textPrimary,
              letterSpacing: "-0.5px",
              margin: 0,
            }}>
              Live Console Status
            </h2>
          </div>

          {/* Stats Cards Row */}
          <div style={{
            display: "flex",
            gap: "16px",
            marginTop: "16px",
            flexWrap: "wrap",
          }}>
            <div style={{
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "12px",
              padding: "12px 20px",
              minWidth: "120px",
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#22c55e",
                fontFamily: fonts.heading,
              }}>{totalFree}</div>
              <div style={{
                fontSize: "12px",
                color: "rgba(34, 197, 94, 0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 600,
                marginTop: "4px",
              }}>Free</div>
            </div>

            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "12px",
              padding: "12px 20px",
              minWidth: "120px",
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#ef4444",
                fontFamily: fonts.heading,
              }}>{totalBusy}</div>
              <div style={{
                fontSize: "12px",
                color: "rgba(239, 68, 68, 0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 600,
                marginTop: "4px",
              }}>Busy</div>
            </div>

            <div style={{
              background: "rgba(148, 163, 184, 0.1)",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              borderRadius: "12px",
              padding: "12px 20px",
              minWidth: "120px",
            }}>
              <div style={{
                fontSize: "28px",
                fontWeight: 700,
                color: "#94a3b8",
                fontFamily: fonts.heading,
              }}>{Math.round((totalBusy / (totalFree + totalBusy) * 100) || 0)}%</div>
              <div style={{
                fontSize: "12px",
                color: "rgba(148, 163, 184, 0.8)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                fontWeight: 600,
                marginTop: "4px",
              }}>Occupancy</div>
            </div>
          </div>

          <p style={{
            fontSize: "13px",
            color: colors.textSecondary,
            marginTop: "12px",
            marginBottom: 0,
          }}>
            Last updated {formatTimeAgo(lastUpdated)}
          </p>
        </div>

        {/* Controls */}
        <div style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          flexWrap: "wrap",
        }}>
          <label style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontSize: "14px",
            color: colors.textSecondary,
            padding: "10px 16px",
            background: colors.darkCard,
            border: `1px solid ${colors.border}`,
            borderRadius: "10px",
            transition: "all 0.2s",
          }}>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              style={{
                cursor: "pointer",
                width: "16px",
                height: "16px",
              }}
            />
            <span>Auto-refresh (30s)</span>
          </label>

          <button
            onClick={loadConsoleStatus}
            disabled={loading}
            style={{
              padding: "10px 20px",
              background: loading ? colors.darkCard : colors.cyan,
              border: loading ? `1px solid ${colors.border}` : "none",
              borderRadius: "10px",
              color: loading ? colors.textPrimary : colors.dark,
              fontSize: "14px",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: fonts.body,
              opacity: loading ? 0.6 : 1,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span>{loading ? "⏳" : "🔄"}</span>
            {loading ? "Refreshing..." : "Refresh Now"}
          </button>
        </div>
      </div>

      {/* Console Groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
        {consoleData.map((console) => (
          <div key={console.type}>
            {/* Console Type Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              padding: "16px 20px",
              background: colors.darkCard,
              borderRadius: "12px",
              border: `1px solid ${colors.border}`,
            }}>
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>
                <span style={{ fontSize: "28px" }}>{console.icon}</span>
                <div>
                  <h3 style={{
                    fontFamily: fonts.heading,
                    fontSize: "20px",
                    fontWeight: 700,
                    color: colors.textPrimary,
                    margin: 0,
                    marginBottom: "2px",
                  }}>
                    {console.label}
                  </h3>
                  <p style={{
                    fontSize: "13px",
                    color: colors.textSecondary,
                    margin: 0,
                  }}>
                    {console.total} total units
                  </p>
                </div>
              </div>

              <div style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  background: "rgba(34, 197, 94, 0.15)",
                  borderRadius: "8px",
                }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#22c55e",
                  }} />
                  <span style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#22c55e",
                  }}>{console.free} Free</span>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  background: "rgba(239, 68, 68, 0.15)",
                  borderRadius: "8px",
                }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#ef4444",
                  }} />
                  <span style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#ef4444",
                  }}>{console.busy} Busy</span>
                </div>
              </div>
            </div>

            {/* Console Cards Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
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
                        ? "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(34, 197, 94, 0.02) 100%)"
                        : isEndingSoon
                        ? "linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.02) 100%)"
                        : "linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.02) 100%)",
                      border: `1.5px solid ${
                        isFree
                          ? "rgba(34, 197, 94, 0.3)"
                          : isEndingSoon
                          ? "rgba(251, 191, 36, 0.4)"
                          : "rgba(239, 68, 68, 0.4)"
                      }`,
                      borderRadius: "14px",
                      padding: "20px",
                      transition: "all 0.3s ease",
                      cursor: "default",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Status Indicator Dot */}
                    <div style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: isFree ? "#22c55e" : isEndingSoon ? "#fbbf24" : "#ef4444",
                      boxShadow: `0 0 12px ${isFree ? "rgba(34, 197, 94, 0.6)" : isEndingSoon ? "rgba(251, 191, 36, 0.6)" : "rgba(239, 68, 68, 0.6)"}`,
                    }} />

                    {/* Console Number */}
                    <div style={{
                      fontFamily: fonts.heading,
                      fontSize: "24px",
                      fontWeight: 800,
                      color: colors.textPrimary,
                      marginBottom: "16px",
                      letterSpacing: "-0.5px",
                    }}>
                      {console.icon} #{status.consoleNumber}
                    </div>

                    {/* Status Badge */}
                    <div style={{
                      display: "inline-block",
                      padding: "6px 14px",
                      background: isFree
                        ? "rgba(34, 197, 94, 0.15)"
                        : isEndingSoon
                        ? "rgba(251, 191, 36, 0.15)"
                        : "rgba(239, 68, 68, 0.15)",
                      borderRadius: "8px",
                      marginBottom: "12px",
                    }}>
                      <span style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        color: isFree ? "#22c55e" : isEndingSoon ? "#fbbf24" : "#ef4444",
                      }}>
                        {isFree ? "Available" : isEndingSoon ? "Ending Soon" : "In Use"}
                      </span>
                    </div>

                    {/* Booking Info */}
                    {status.booking ? (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: `1px solid ${colors.border}`,
                      }}>
                        <div style={{
                          fontSize: "15px",
                          color: colors.textPrimary,
                          fontWeight: 600,
                        }}>
                          👤 {status.booking.customerName}
                        </div>
                        <div style={{
                          fontSize: "13px",
                          color: colors.textSecondary,
                        }}>
                          ⏰ Until {status.booking.endTime}
                        </div>
                        <div style={{
                          fontSize: "14px",
                          color: isEndingSoon ? "#fbbf24" : colors.textSecondary,
                          fontWeight: 700,
                        }}>
                          ⏱️ {status.booking.timeRemaining} min left
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        marginTop: "12px",
                        paddingTop: "12px",
                        borderTop: `1px solid ${colors.border}`,
                      }}>
                        <div style={{
                          fontSize: "14px",
                          color: "#22c55e",
                          fontWeight: 600,
                        }}>
                          ✓ Ready for booking
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
}
