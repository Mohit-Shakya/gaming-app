// src/app/cafes/[id]/book/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { colors, fonts, CONSOLE_LABELS, CONSOLE_DB_KEYS, CONSOLE_COLORS, CONSOLE_ICONS, OPEN_HOUR, CLOSE_HOUR, PEAK_START, PEAK_END, TIME_INTERVAL, BOOKING_DURATION_MINUTES, type ConsoleId } from "@/lib/constants";

// ============ TYPES ============

type DayOption = {
  key: string;
  dayName: string;
  dayNum: string;
  month: string;
  isToday: boolean;
};

type TimeSlot = {
  label: string;
  hour: number;
  minutes: number;
  isPeak: boolean;
};

type ConsoleOption = {
  id: ConsoleId;
  label: string;
  icon: string;
  color: string;
  dbKey: string;
};

type TicketOption = {
  id: string;
  console: ConsoleId;
  title: string;
  players: number;
  price: number;
  description: string;
};

type SelectedTicketForCheck = {
  console: ConsoleId;
  quantity: number;
};

type ConsoleAvailability = {
  total: number;
  booked: number;
  available: number;
  nextAvailableAt: string | null; // Time when console becomes free (e.g., "11:30 pm")
};

// ============ CONSTANTS ============
const CONSOLES: ConsoleOption[] = [
  { id: "ps5", label: CONSOLE_LABELS.ps5, icon: CONSOLE_ICONS.ps5, color: CONSOLE_COLORS.ps5, dbKey: CONSOLE_DB_KEYS.ps5 },
  { id: "ps4", label: CONSOLE_LABELS.ps4, icon: CONSOLE_ICONS.ps4, color: CONSOLE_COLORS.ps4, dbKey: CONSOLE_DB_KEYS.ps4 },
  { id: "xbox", label: CONSOLE_LABELS.xbox, icon: CONSOLE_ICONS.xbox, color: CONSOLE_COLORS.xbox, dbKey: CONSOLE_DB_KEYS.xbox },
  { id: "pc", label: CONSOLE_LABELS.pc, icon: CONSOLE_ICONS.pc, color: CONSOLE_COLORS.pc, dbKey: CONSOLE_DB_KEYS.pc },
  { id: "pool", label: CONSOLE_LABELS.pool, icon: CONSOLE_ICONS.pool, color: CONSOLE_COLORS.pool, dbKey: CONSOLE_DB_KEYS.pool },
  { id: "arcade", label: CONSOLE_LABELS.arcade, icon: CONSOLE_ICONS.arcade, color: CONSOLE_COLORS.arcade, dbKey: CONSOLE_DB_KEYS.arcade },
  { id: "snooker", label: CONSOLE_LABELS.snooker, icon: CONSOLE_ICONS.snooker, color: CONSOLE_COLORS.snooker, dbKey: CONSOLE_DB_KEYS.snooker },
  { id: "vr", label: CONSOLE_LABELS.vr, icon: CONSOLE_ICONS.vr, color: CONSOLE_COLORS.vr, dbKey: CONSOLE_DB_KEYS.vr },
  { id: "steering", label: CONSOLE_LABELS.steering, icon: CONSOLE_ICONS.steering, color: CONSOLE_COLORS.steering, dbKey: CONSOLE_DB_KEYS.steering },
];

// ============ HELPER FUNCTIONS ============
function buildNext7Days(): DayOption[] {
  const days: DayOption[] = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);

    days.push({
      key: d.toISOString().slice(0, 10),
      dayName: d.toLocaleDateString("en-IN", { weekday: "short" }),
      dayNum: d.getDate().toString(),
      month: d.toLocaleDateString("en-IN", { month: "short" }),
      isToday: i === 0,
    });
  }
  return days;
}

function buildTimeSlots(): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour++) {
    for (let minutes = 0; minutes < 60; minutes += TIME_INTERVAL) {
      const d = new Date();
      d.setHours(hour, minutes, 0, 0);
      const label = d.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      slots.push({
        label,
        hour,
        minutes,
        isPeak: hour >= PEAK_START && hour < PEAK_END,
      });
    }
  }
  return slots;
}

// Convert "10:30 pm" to minutes from midnight
function timeStringToMinutes(timeStr: string): number {
  const match = timeStr.toLowerCase().match(/(\d+):(\d+)\s*(am|pm)/);
  if (!match) return 0;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3];

  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  return hours * 60 + minutes;
}

// Check if two time ranges of given duration overlap
function doTimeSlotsOverlap(
  slot1StartMinutes: number,
  slot2StartMinutes: number,
  durationMinutes: number = BOOKING_DURATION_MINUTES
): boolean {
  const slot1End = slot1StartMinutes + durationMinutes;
  const slot2End = slot2StartMinutes + durationMinutes;
  return slot1StartMinutes < slot2End && slot2StartMinutes < slot1End;
}

// Convert minutes from midnight to "11:30 pm"
function minutesToTimeString(totalMinutes: number): string {
  let hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours >= 24) hours -= 24;

  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

function generateTickets(consoleId: ConsoleId, basePrice: number): TicketOption[] {
  const consoleName = CONSOLES.find((c) => c.id === consoleId)?.label || consoleId;
  const tickets: TicketOption[] = [];

  const maxPlayers = ["pool", "snooker"].includes(consoleId)
    ? 2
    : ["pc", "vr", "steering"].includes(consoleId)
    ? 1
    : 4;

  for (let p = 1; p <= maxPlayers; p++) {
    const priceMultiplier = p === 1 ? 1 : p === 2 ? 1.6 : p === 3 ? 2.2 : 2.5;
    tickets.push({
      id: `${consoleId}_${p}`,
      console: consoleId,
      title: `${consoleName} | ${p} Player${p > 1 ? "s" : ""}`,
      players: p,
      price: Math.round(basePrice * priceMultiplier),
      description: `Access for ${p} player${p > 1 ? "s" : ""} for 60 minutes.`,
    });
  }
  return tickets;
}

// For walk-in: today + ACTUAL current time (not 15-minute slot)
function getDefaultWalkInDateAndTime(): { dateKey: string; timeLabel: string } {
  const now = new Date();

  // clone date
  let date = new Date(now);
  let hour = now.getHours();
  let minutes = now.getMinutes();

  // If before opening -> move to opening time
  if (hour < OPEN_HOUR) {
    hour = OPEN_HOUR;
    minutes = 0;
  }

  // If after closing -> move to tomorrow opening
  if (hour >= CLOSE_HOUR) {
    date.setDate(date.getDate() + 1);
    hour = OPEN_HOUR;
    minutes = 0;
  }

  const dateKey = date.toISOString().slice(0, 10);

  const d = new Date(date);
  d.setHours(hour, minutes, 0, 0);

  // "11:04 am" / "2:24 pm" etc
  const timeLabel = d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return { dateKey, timeLabel };
}

const DAY_OPTIONS = buildNext7Days();
const ALL_TIME_SLOTS = buildTimeSlots();

// ============ COMPONENT ============
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();

  // Walk-in mode (?mode=walkin or ?walkin=1)
  const isWalkIn =
    searchParams?.get("mode") === "walkin" ||
    searchParams?.get("walkin") === "1";

  const rawId = params?.id;
  const cafeId = typeof rawId === "string" && rawId !== "undefined" ? rawId : null;

  // ===== STATE =====
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState<string>(DAY_OPTIONS[0]?.key ?? "");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId>("ps5");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Cafe data
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [consoleLimits, setConsoleLimits] = useState<Partial<Record<ConsoleId, number>>>({});
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Availability State
  const [liveAvailability, setLiveAvailability] = useState<
    Partial<Record<ConsoleId, ConsoleAvailability>>
  >({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ===== LOAD CAFE DATA =====
  useEffect(() => {
    async function loadCafeData() {
      if (!cafeId) return;

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("cafes")
          .select(
            "name, hourly_price, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count"
          )
          .eq("id", cafeId)
          .maybeSingle();

        if (error || !data) {
          console.error("Error loading cafe:", error);
          return;
        }

        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);

        const limits: Partial<Record<ConsoleId, number>> = {};
        const available: ConsoleId[] = [];

        CONSOLES.forEach((c) => {
          const count = (data as any)[c.dbKey];
          if (count && count > 0) {
            limits[c.id] = count;
            available.push(c.id);
          }
        });

        setConsoleLimits(limits);
        setAvailableConsoles(available);

        if (available.length > 0 && !available.includes(selectedConsole)) {
          setSelectedConsole(available[0]);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCafeData();
  }, [cafeId, selectedConsole]);

  // ===== WALK-IN: AUTO DATE + TIME (ACTUAL CURRENT TIME) =====
  useEffect(() => {
    if (!isWalkIn) return;
    const { dateKey, timeLabel } = getDefaultWalkInDateAndTime();
    setSelectedDate(dateKey);
    setSelectedTime(timeLabel);
    setStep(2); // skip date/time step for walk-in
  }, [isWalkIn]);

  // FETCH LIVE AVAILABILITY with OVERLAP LOGIC
  const fetchLiveAvailability = useCallback(async () => {
    if (!cafeId || !selectedDate || !selectedTime) {
      setLiveAvailability({});
      return;
    }

    try {
      setLoadingAvailability(true);

      const selectedTimeMinutes = timeStringToMinutes(selectedTime);

      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          id,
          start_time,
          booking_items (
            console,
            quantity
          )
        `
        )
        .eq("cafe_id", cafeId)
        .eq("booking_date", selectedDate)
        .neq("status", "cancelled");

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
        return;
      }

      const availability: Partial<Record<ConsoleId, ConsoleAvailability>> = {};
      availableConsoles.forEach((consoleId) => {
        availability[consoleId] = {
          total: consoleLimits[consoleId] || 0,
          booked: 0,
          available: consoleLimits[consoleId] || 0,
          nextAvailableAt: null,
        };
      });

      const overlappingBookingsPerConsole: Partial<
        Record<ConsoleId, { endMinutes: number; quantity: number }[]>
      > = {};

      (bookings ?? []).forEach((booking: any) => {
        const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");
        const bookingEndMinutes = bookingStartMinutes + BOOKING_DURATION_MINUTES;

        if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, BOOKING_DURATION_MINUTES)) {
          (booking.booking_items ?? []).forEach((item: any) => {
            const consoleId = item.console as ConsoleId;
            if (consoleId && availability[consoleId]) {
              availability[consoleId]!.booked += item.quantity || 0;
              availability[consoleId]!.available =
                availability[consoleId]!.total - availability[consoleId]!.booked;

              if (!overlappingBookingsPerConsole[consoleId]) {
                overlappingBookingsPerConsole[consoleId] = [];
              }
              overlappingBookingsPerConsole[consoleId]!.push({
                endMinutes: bookingEndMinutes,
                quantity: item.quantity || 0,
              });
            }
          });
        }
      });

      availableConsoles.forEach((consoleId) => {
        const consoleData = availability[consoleId];
        if (!consoleData) return;

        if (consoleData.available === 0 || consoleData.available < consoleData.total) {
          const overlappingBookings = overlappingBookingsPerConsole[consoleId] || [];

          if (overlappingBookings.length > 0) {
            const sortedByEndTime = [...overlappingBookings].sort(
              (a, b) => a.endMinutes - b.endMinutes
            );
            const earliestEndMinutes = sortedByEndTime[0].endMinutes;
            availability[consoleId]!.nextAvailableAt = minutesToTimeString(earliestEndMinutes);
          }
        }
      });

      setLiveAvailability(availability);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error fetching availability:", err);
    } finally {
      setLoadingAvailability(false);
    }
  }, [cafeId, selectedDate, selectedTime, availableConsoles, consoleLimits]);

  useEffect(() => {
    fetchLiveAvailability();
  }, [fetchLiveAvailability]);

  useEffect(() => {
    if (step !== 2 || !selectedDate || !selectedTime) return;

    const interval = setInterval(() => {
      fetchLiveAvailability();
    }, 30000);

    return () => clearInterval(interval);
  }, [step, selectedDate, selectedTime, fetchLiveAvailability]);

  // ===== DERIVED STATE =====
  const filteredTimeSlots = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    if (selectedDate !== todayKey) {
      return ALL_TIME_SLOTS;
    }

    const currentHour = today.getHours();
    const currentMinutes = today.getMinutes();

    return ALL_TIME_SLOTS.filter((slot) => {
      if (slot.hour > currentHour) return true;
      if (slot.hour === currentHour && slot.minutes > currentMinutes + 5) return true;
      return false;
    });
  }, [selectedDate]);

  // IMPORTANT: only run this for ONLINE bookings,
  // otherwise it will wipe the walk-in "11:04 am" time.
  useEffect(() => {
    if (isWalkIn) return;
    if (selectedTime && filteredTimeSlots.length > 0) {
      const isStillAvailable = filteredTimeSlots.some((slot) => slot.label === selectedTime);
      if (!isStillAvailable) {
        setSelectedTime("");
      }
    }
  }, [isWalkIn, filteredTimeSlots, selectedTime]);

  const tickets = useMemo(() => {
    return generateTickets(selectedConsole, cafePrice);
  }, [selectedConsole, cafePrice]);

  const usedPerConsole = useMemo(() => {
    const map: Partial<Record<ConsoleId, number>> = {};
    Object.entries(quantities).forEach(([ticketId, qty]) => {
      const consoleId = ticketId.split("_")[0] as ConsoleId;
      map[consoleId] = (map[consoleId] ?? 0) + qty;
    });
    return map;
  }, [quantities]);

  const summary = useMemo(() => {
    let totalTickets = 0;
    let totalAmount = 0;

    Object.entries(quantities).forEach(([ticketId, qty]) => {
      if (qty <= 0) return;
      const consoleId = ticketId.split("_")[0] as ConsoleId;
      const consoleTickets = generateTickets(consoleId, cafePrice);
      const ticket = consoleTickets.find((t) => t.id === ticketId);
      if (ticket) {
        totalTickets += qty;
        totalAmount += qty * ticket.price;
      }
    });

    return { totalTickets, totalAmount };
  }, [quantities, cafePrice]);

  const getRealAvailable = useCallback(
    (consoleId: ConsoleId) => {
      const liveData = liveAvailability[consoleId];
      if (!liveData) return consoleLimits[consoleId] || 0;

      const mySelection = usedPerConsole[consoleId] || 0;
      return Math.max(0, liveData.available - mySelection);
    },
    [liveAvailability, usedPerConsole, consoleLimits]
  );

  const maxForSelected =
    liveAvailability[selectedConsole]?.available ??
    consoleLimits[selectedConsole] ??
    Infinity;
  const usedForSelected = usedPerConsole[selectedConsole] ?? 0;
  const remainingForSelected = Math.max(0, maxForSelected - usedForSelected);
  const atLimit = remainingForSelected <= 0;

  const dateLabel = useMemo(() => {
    if (!selectedDate) return "";
    const d = new Date(`${selectedDate}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDate]);

  // ===== HANDLERS =====
  function getQty(ticketId: string) {
    return quantities[ticketId] ?? 0;
  }

  function setQty(ticketId: string, value: number) {
    const consoleId = ticketId.split("_")[0] as ConsoleId;
    const available = getRealAvailable(consoleId) + (quantities[ticketId] || 0);

    setQuantities((prev) => {
      const next = { ...prev };

      if (value <= 0) {
        delete next[ticketId];
      } else if (value <= available) {
        next[ticketId] = value;
      } else {
        next[ticketId] = available;
      }

      return next;
    });
  }

  function handleContinueToTickets() {
    if (!selectedDate || !selectedTime) return;
    setStep(2);
    setQuantities({});
  }

  function handleBackToDateTime() {
    setStep(1);
    setQuantities({});
  }

  async function handleConfirmBooking() {
    if (summary.totalTickets === 0 || !cafeId) return;

    if (!user && !userLoading) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      router.push("/login");
      return;
    }

    if (user) {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.onboarding_complete) {
          sessionStorage.setItem("redirectAfterOnboarding", window.location.pathname);
          router.push("/onboarding");
          return;
        }
      } catch (err) {
        console.error("Error checking profile:", err);
      }
    }

    setIsSubmitting(true);

    try {
      const selectedTickets = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketId, qty]) => {
          const consoleId = ticketId.split("_")[0] as ConsoleId;
          const consoleTickets = generateTickets(consoleId, cafePrice);
          const ticket = consoleTickets.find((t) => t.id === ticketId);
          return {
            ticketId,
            console: consoleId,
            title: ticket?.title || ticketId,
            price: ticket?.price || 0,
            quantity: qty,
          };
        });

      if (selectedTickets.length === 0) {
        alert("Please select at least one ticket.");
        setIsSubmitting(false);
        return;
      }

      // Final capacity check with overlap logic
      const capacityResult = await checkBookingCapacityWithOverlap({
        cafeId,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        tickets: selectedTickets.map((t) => ({
          console: t.console,
          quantity: t.quantity,
        })),
      });

      if (!capacityResult.ok) {
        alert(capacityResult.message);
        await fetchLiveAvailability();
        setIsSubmitting(false);
        return;
      }

      const payload = {
        cafeId,
        cafeName,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        tickets: selectedTickets,
        totalAmount: summary.totalAmount,
        // mark walk-in vs online
        source: isWalkIn ? "walk_in" : "online",
      };

      sessionStorage.setItem("checkoutDraft", JSON.stringify(payload));
      router.push("/checkout");
    } catch (err) {
      console.error("Failed to prepare checkout:", err);
      alert("Could not prepare checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ===== RENDER =====
  if (!cafeId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.dark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.body,
          color: colors.red,
        }}
      >
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        Missing café ID
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
        fontFamily: fonts.body,
        color: colors.textPrimary,
        position: "relative",
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Background glow */}
      <div
        style={{
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
        }}
      />

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px 16px 140px",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: "24px" }}>
          <button
            onClick={() => (step === 2 ? handleBackToDateTime() : router.back())}
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
            {step === 2 && !isWalkIn ? "Change Date & Time" : "Back"}
          </button>

          <p
            style={{
              fontSize: "12px",
              color: colors.cyan,
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "4px",
            }}
          >
            {cafeName}
          </p>

          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "22px",
              fontWeight: 700,
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            {step === 1 ? "Select Date & Time" : "Choose Your Setup"}
          </h1>

          {/* Progress indicator */}
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            <div
              style={{
                flex: 1,
                height: "3px",
                borderRadius: "2px",
                background: colors.red,
              }}
            />
            <div
              style={{
                flex: 1,
                height: "3px",
                borderRadius: "2px",
                background: step === 2 ? colors.red : "rgba(255, 255, 255, 0.1)",
                transition: "background 0.3s ease",
              }}
            />
          </div>
        </header>

        {/* ========== STEP 1: DATE & TIME (ONLINE ONLY) ========== */}
        {step === 1 && !isWalkIn && (
          <>
            {/* Date Selection */}
            <section style={{ marginBottom: "28px" }}>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: colors.textSecondary,
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                📅 Select Date
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  overflowX: "auto",
                  paddingBottom: "8px",
                  scrollbarWidth: "none",
                }}
              >
                {DAY_OPTIONS.map((day) => {
                  const isActive = day.key === selectedDate;
                  return (
                    <button
                      key={day.key}
                      onClick={() => setSelectedDate(day.key)}
                      style={{
                        flexShrink: 0,
                        width: "72px",
                        padding: "12px 8px",
                        borderRadius: "12px",
                        border: isActive
                          ? `2px solid ${colors.red}`
                          : `1px solid ${colors.border}`,
                        background: isActive
                          ? `linear-gradient(135deg, rgba(255, 7, 58, 0.2) 0%, rgba(255, 7, 58, 0.1) 100%)`
                          : colors.darkCard,
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.2s ease",
                        boxShadow: isActive ? `0 0 20px rgba(255, 7, 58, 0.3)` : "none",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "11px",
                          color: day.isToday ? colors.cyan : colors.textMuted,
                          marginBottom: "4px",
                          fontWeight: 500,
                        }}
                      >
                        {day.isToday ? "TODAY" : day.dayName}
                      </div>
                      <div
                        style={{
                          fontFamily: fonts.heading,
                          fontSize: "20px",
                          fontWeight: 700,
                          color: isActive ? colors.red : colors.textPrimary,
                        }}
                      >
                        {day.dayNum}
                      </div>
                      <div
                        style={{
                          fontSize: "11px",
                          color: colors.textMuted,
                          marginTop: "2px",
                        }}
                      >
                        {day.month}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Time Selection */}
            <section>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: colors.textSecondary,
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                ⏰ Select Time
              </h2>

              {filteredTimeSlots.length === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    background: colors.darkCard,
                    borderRadius: "12px",
                    border: `1px solid ${colors.border}`,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>😔</div>
                  <p style={{ fontSize: "14px", color: colors.textSecondary, marginBottom: "8px" }}>
                    No slots available for today
                  </p>
                  <p style={{ fontSize: "12px", color: colors.textMuted }}>
                    Please select another date
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "8px",
                    }}
                  >
                    {filteredTimeSlots.map((slot) => {
                      const isActive = slot.label === selectedTime;
                      return (
                        <button
                          key={slot.label}
                          onClick={() => setSelectedTime(slot.label)}
                          style={{
                            padding: "12px 8px",
                            borderRadius: "10px",
                            border: isActive
                              ? `2px solid ${colors.red}`
                              : `1px solid ${colors.border}`,
                            background: isActive
                              ? `linear-gradient(135deg, rgba(255, 7, 58, 0.2) 0%, rgba(255, 7, 58, 0.1) 100%)`
                              : colors.darkCard,
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.2s ease",
                            position: "relative",
                            boxShadow: isActive ? `0 0 20px rgba(255, 7, 58, 0.3)` : "none",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: isActive ? colors.red : colors.textPrimary,
                            }}
                          >
                            {slot.label}
                          </div>
                          {slot.isPeak && (
                            <div
                              style={{
                                position: "absolute",
                                top: "4px",
                                right: "4px",
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#f59e0b",
                              }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p
                    style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                      marginTop: "12px",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#f59e0b",
                        display: "inline-block",
                      }}
                    />
                    Peak hours (6 PM - 10 PM) may have higher demand
                  </p>
                </>
              )}
            </section>
          </>
        )}

        {/* ========== STEP 2: TICKETS ========== */}
        {step === 2 && (
          <>
            {/* Selected Date/Time Summary */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                background: colors.darkCard,
                borderRadius: "12px",
                border: `1px solid ${colors.border}`,
                marginBottom: "20px",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                  {dateLabel}
                </div>
                <div style={{ fontSize: "13px", color: colors.cyan, marginTop: "2px" }}>
                  {selectedTime} - {getEndTime(selectedTime)}
                  <span style={{ color: colors.textMuted, marginLeft: "8px" }}>
                    (1 hour session)
                  </span>
                </div>
                {/* Online / Walk-in pill */}
                <div
                  style={{
                    marginTop: "6px",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: isWalkIn
                      ? "rgba(245, 158, 11, 0.12)"
                      : "rgba(34, 197, 94, 0.12)",
                    border: isWalkIn
                      ? "1px solid rgba(245, 158, 11, 0.4)"
                      : "1px solid rgba(34, 197, 94, 0.4)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: isWalkIn ? colors.orange : colors.green,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  <span>{isWalkIn ? "🚶‍♂️" : "🌐"}</span>
                  <span>{isWalkIn ? "Walk-in Booking" : "Online Booking"}</span>
                </div>
              </div>
              {!isWalkIn && (
                <button
                  onClick={handleBackToDateTime}
                  style={{
                    padding: "8px 14px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.textSecondary,
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Change
                </button>
              )}
            </div>

            {/* Live Availability Banner */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: `linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%)`,
                borderRadius: "10px",
                border: `1px solid rgba(0, 240, 255, 0.2)`,
                marginBottom: "20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: colors.green,
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                />
                <span style={{ fontSize: "13px", color: colors.cyan, fontWeight: 500 }}>
                  Live Availability
                </span>
                <span style={{ fontSize: "11px", color: colors.textMuted }}>
                  (accounts for overlapping bookings)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {loadingAvailability && (
                  <div
                    style={{
                      width: "14px",
                      height: "14px",
                      border: `2px solid ${colors.border}`,
                      borderTopColor: colors.cyan,
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                )}
                {lastUpdated && (
                  <span style={{ fontSize: "11px", color: colors.textMuted }}>
                    Updated{" "}
                    {lastUpdated.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
                <button
                  onClick={fetchLiveAvailability}
                  disabled={loadingAvailability}
                  style={{
                    padding: "4px 10px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "6px",
                    color: colors.textSecondary,
                    fontSize: "11px",
                    cursor: loadingAvailability ? "not-allowed" : "pointer",
                  }}
                >
                  Refresh
                </button>
              </div>
            </div>

            {/* Console Selection with Live Availability */}
            <section style={{ marginBottom: "24px" }}>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: colors.textSecondary,
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                🎮 Select Console
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {availableConsoles.map((consoleId) => {
                  const console = CONSOLES.find((c) => c.id === consoleId);
                  if (!console) return null;

                  const isActive = consoleId === selectedConsole;
                  const availability = liveAvailability[consoleId];
                  const totalSlots = availability?.total ?? consoleLimits[consoleId] ?? 0;
                  const availableSlots = availability?.available ?? totalSlots;
                  const nextAvailableAt = availability?.nextAvailableAt ?? null;
                  const mySelection = usedPerConsole[consoleId] ?? 0;
                  const isSoldOut = availableSlots <= 0 && mySelection === 0;
                  const isLowStock = availableSlots <= 2 && availableSlots > 0;

                  return (
                    <button
                      key={consoleId}
                      onClick={() => !isSoldOut && setSelectedConsole(consoleId)}
                      disabled={isSoldOut}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "14px 16px",
                        borderRadius: "14px",
                        border: isActive
                          ? `2px solid ${console.color}`
                          : isSoldOut
                          ? `1px solid rgba(255, 255, 255, 0.04)`
                          : `1px solid ${colors.border}`,
                        background: isActive
                          ? `linear-gradient(135deg, ${console.color}20 0%, ${console.color}10 100%)`
                          : isSoldOut
                          ? "rgba(255, 255, 255, 0.02)"
                          : colors.darkCard,
                        cursor: isSoldOut ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isActive ? `0 0 20px ${console.color}30` : "none",
                        opacity: isSoldOut ? 0.6 : 1,
                        width: "100%",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "24px" }}>{console.icon}</span>
                        <div>
                          <div
                            style={{
                              fontSize: "15px",
                              fontWeight: 600,
                              color: isActive ? console.color : colors.textPrimary,
                            }}
                          >
                            {console.label}
                          </div>
                          <div style={{ fontSize: "12px", color: colors.textMuted }}>
                            ₹{cafePrice}/hr per player
                          </div>
                          {nextAvailableAt && (isSoldOut || isLowStock) && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: colors.cyan,
                                marginTop: "2px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <span>🕐</span>
                              <span>
                                {isSoldOut
                                  ? `Free at ${nextAvailableAt}`
                                  : `+1 free at ${nextAvailableAt}`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: "4px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {mySelection > 0 && (
                            <span
                              style={{
                                padding: "4px 8px",
                                background: `${console.color}30`,
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 600,
                                color: console.color,
                              }}
                            >
                              {mySelection} selected
                            </span>
                          )}
                          <div
                            style={{
                              padding: "6px 12px",
                              background: isSoldOut
                                ? "rgba(239, 68, 68, 0.15)"
                                : isLowStock
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(34, 197, 94, 0.15)",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: isSoldOut
                                  ? "#ef4444"
                                  : isLowStock
                                  ? colors.orange
                                  : colors.green,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: isSoldOut
                                  ? "#ef4444"
                                  : isLowStock
                                  ? colors.orange
                                  : colors.green,
                              }}
                            >
                              {isSoldOut
                                ? "Sold Out"
                                : `${availableSlots}/${totalSlots} left`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Ticket Cards */}
            <section>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <h2
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: colors.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  🎟️ Select Tickets
                </h2>

                {!atLimit && remainingForSelected > 0 && (
                  <span
                    style={{
                      fontSize: "12px",
                      color:
                        remainingForSelected <= 2 ? colors.orange : colors.green,
                      fontWeight: 500,
                    }}
                  >
                    {remainingForSelected} slot
                    {remainingForSelected > 1 ? "s" : ""} available
                  </span>
                )}
              </div>

              {atLimit && usedForSelected === 0 ? (
                <div
                  style={{
                    padding: "32px 20px",
                    background: colors.darkCard,
                    borderRadius: "14px",
                    border: `1px solid rgba(239, 68, 68, 0.2)`,
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>😔</div>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#ef4444",
                      marginBottom: "8px",
                    }}
                  >
                    Sold Out for This Time Slot
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: colors.textMuted,
                      marginBottom: "12px",
                    }}
                  >
                    All {CONSOLE_LABELS[selectedConsole]} setups are booked for{" "}
                    {selectedTime} - {getEndTime(selectedTime)}.
                  </p>
                  {liveAvailability[selectedConsole]?.nextAvailableAt && (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        background: `rgba(0, 240, 255, 0.1)`,
                        border: `1px solid rgba(0, 240, 255, 0.2)`,
                        borderRadius: "10px",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>🕐</span>
                      <span
                        style={{
                          fontSize: "13px",
                          color: colors.cyan,
                          fontWeight: 500,
                        }}
                      >
                        Available from {liveAvailability[selectedConsole]?.nextAvailableAt}
                      </span>
                    </div>
                  )}
                  <p style={{ fontSize: "12px", color: colors.textMuted }}>
                    Try selecting a different time or console.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {tickets.map((ticket) => {
                    const qty = getQty(ticket.id);
                    const hasQty = qty > 0;
                    const canAdd = remainingForSelected > 0;

                    return (
                      <div
                        key={ticket.id}
                        style={{
                          padding: "16px",
                          background: hasQty
                            ? `linear-gradient(135deg, rgba(255, 7, 58, 0.1) 0%, ${colors.darkCard} 100%)`
                            : colors.darkCard,
                          borderRadius: "14px",
                          border: hasQty
                            ? `1px solid rgba(255, 7, 58, 0.3)`
                            : `1px solid ${colors.border}`,
                          transition: "all 0.2s ease",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "12px",
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontSize: "15px",
                                fontWeight: 600,
                                color: colors.textPrimary,
                                marginBottom: "6px",
                              }}
                            >
                              {ticket.title}
                            </div>
                            <div
                              style={{
                                fontFamily: fonts.heading,
                                fontSize: "22px",
                                fontWeight: 700,
                                color: colors.cyan,
                                marginBottom: "8px",
                              }}
                            >
                              ₹{ticket.price}
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: colors.textMuted,
                                  fontFamily: fonts.body,
                                  fontWeight: 400,
                                }}
                              >
                                {" "}
                                /hr
                              </span>
                            </div>
                            <p
                              style={{
                                fontSize: "13px",
                                color: colors.textSecondary,
                                lineHeight: 1.4,
                              }}
                            >
                              {ticket.description}
                            </p>
                          </div>

                          {!hasQty ? (
                            <button
                              disabled={!canAdd}
                              onClick={() => canAdd && setQty(ticket.id, 1)}
                              style={{
                                padding: "10px 20px",
                                background: canAdd
                                  ? `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`
                                  : "rgba(255, 255, 255, 0.05)",
                                border: "none",
                                borderRadius: "10px",
                                color: canAdd ? "white" : colors.textMuted,
                                fontSize: "13px",
                                fontWeight: 600,
                                cursor: canAdd ? "pointer" : "not-allowed",
                                transition: "all 0.2s ease",
                              }}
                            >
                              Add
                            </button>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0",
                                background: colors.red,
                                borderRadius: "10px",
                                overflow: "hidden",
                              }}
                            >
                              <button
                                onClick={() => setQty(ticket.id, qty - 1)}
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  background: "transparent",
                                  border: "none",
                                  color: "white",
                                  fontSize: "18px",
                                  cursor: "pointer",
                                }}
                              >
                                −
                              </button>
                              <span
                                style={{
                                  width: "32px",
                                  textAlign: "center",
                                  fontFamily: fonts.heading,
                                  fontSize: "16px",
                                  fontWeight: 700,
                                  color: "white",
                                }}
                              >
                                {qty}
                              </span>
                              <button
                                disabled={!canAdd}
                                onClick={() => canAdd && setQty(ticket.id, qty + 1)}
                                style={{
                                  width: "36px",
                                  height: "36px",
                                  background: "transparent",
                                  border: "none",
                                  color: canAdd ? "white" : "rgba(255,255,255,0.4)",
                                  fontSize: "18px",
                                  cursor: canAdd ? "pointer" : "not-allowed",
                                }}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* ========== BOTTOM BAR ========== */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(15, 15, 20, 0.95)",
          backdropFilter: "blur(20px)",
          borderTop: `1px solid ${colors.border}`,
          padding: "16px",
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          {step === 1 && !isWalkIn ? (
            <>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                  {selectedDate ? dateLabel : "Select a date"}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: selectedTime ? colors.cyan : colors.textMuted,
                  }}
                >
                  {selectedTime || "Select a time"}
                </div>
              </div>
              <button
                onClick={handleContinueToTickets}
                disabled={!selectedDate || !selectedTime}
                style={{
                  padding: "14px 28px",
                  background:
                    selectedDate && selectedTime
                      ? `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`
                      : "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "12px",
                  color: selectedDate && selectedTime ? "white" : colors.textMuted,
                  fontFamily: fonts.heading,
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  cursor: selectedDate && selectedTime ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                }}
              >
                Continue →
              </button>
            </>
          ) : (
            <>
              <div>
                {summary.totalTickets > 0 ? (
                  <>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: colors.textPrimary,
                      }}
                    >
                      {summary.totalTickets} ticket
                      {summary.totalTickets > 1 ? "s" : ""} selected
                    </div>
                    <div style={{ fontSize: "13px", color: colors.textSecondary }}>
                      {dateLabel} • {selectedTime}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: "14px", color: colors.textMuted }}>
                    Add tickets to continue
                  </div>
                )}
              </div>
              <button
                onClick={handleConfirmBooking}
                disabled={summary.totalTickets === 0 || isSubmitting}
                style={{
                  padding: "14px 24px",
                  background:
                    summary.totalTickets > 0 && !isSubmitting
                      ? `linear-gradient(135deg, ${colors.green} 0%, #16a34a 100%)`
                      : "rgba(255, 255, 255, 0.1)",
                  border: "none",
                  borderRadius: "12px",
                  color: summary.totalTickets > 0 ? "white" : colors.textMuted,
                  fontFamily: fonts.heading,
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  cursor: summary.totalTickets > 0 && !isSubmitting ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  minWidth: "140px",
                }}
              >
                {isSubmitting
                  ? "Processing..."
                  : summary.totalTickets > 0
                  ? `Pay ₹${summary.totalAmount}`
                  : "Select Tickets"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

/**
 * Helper to calculate end time (1 hour after start)
 */
function getEndTime(startTime: string): string {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = startMinutes + BOOKING_DURATION_MINUTES;

  let hours = Math.floor(endMinutes / 60);
  const mins = endMinutes % 60;

  if (hours >= 24) hours -= 24;

  const period = hours >= 12 ? "pm" : "am";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;

  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/* ================= CAPACITY CHECK WITH OVERLAP ================= */

async function checkBookingCapacityWithOverlap(options: {
  cafeId: string;
  bookingDate: string;
  timeSlot: string;
  tickets: SelectedTicketForCheck[];
}): Promise<{ ok: boolean; message?: string }> {
  const { cafeId, bookingDate, timeSlot, tickets } = options;

  const requested: Partial<Record<ConsoleId, number>> = {};
  for (const t of tickets) {
    if (!t.console || t.quantity <= 0) continue;
    requested[t.console] = (requested[t.console] ?? 0) + t.quantity;
  }
  if (Object.keys(requested).length === 0) {
    return { ok: false, message: "No tickets selected." };
  }

  const { data: cafeRow, error: cafeError } = await supabase
    .from("cafes")
    .select(
      "ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count"
    )
    .eq("id", cafeId)
    .maybeSingle();

  if (cafeError || !cafeRow) {
    console.error("Capacity check: error loading cafe", cafeError);
    return { ok: false, message: "Could not check availability. Please try again." };
  }

  const capacities: Partial<Record<ConsoleId, number>> = {};
  (Object.keys(CONSOLE_DB_KEYS) as ConsoleId[]).forEach((consoleId) => {
    const dbKey = CONSOLE_DB_KEYS[consoleId];
    capacities[consoleId] = (cafeRow as any)[dbKey] ?? 0;
  });

  const selectedTimeMinutes = timeStringToMinutes(timeSlot);

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      `
      id,
      start_time,
      booking_items (
        console,
        quantity
      )
    `
    )
    .eq("cafe_id", cafeId)
    .eq("booking_date", bookingDate)
    .neq("status", "cancelled");

  if (bookingsError) {
    console.error("Capacity check: error loading bookings", bookingsError);
    return { ok: false, message: "Could not check availability. Please try again." };
  }

  const alreadyBooked: Partial<Record<ConsoleId, number>> = {};

  (bookings ?? []).forEach((booking: any) => {
    const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");

    if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, BOOKING_DURATION_MINUTES)) {
      (booking.booking_items ?? []).forEach((item: any) => {
        const consoleId = item.console as ConsoleId;
        if (!consoleId) return;
        const qty = item.quantity ?? 0;
        alreadyBooked[consoleId] = (alreadyBooked[consoleId] ?? 0) + qty;
      });
    }
  });

  for (const [consoleIdStr, qtyRequested] of Object.entries(requested)) {
    const consoleId = consoleIdStr as ConsoleId;
    const capacity = capacities[consoleId] ?? 0;
    const used = alreadyBooked[consoleId] ?? 0;
    const remaining = capacity - used;

    if ((qtyRequested ?? 0) > remaining) {
      return {
        ok: false,
        message:
          remaining > 0
            ? `Only ${remaining} ${CONSOLE_LABELS[consoleId]} setup(s) available for this time slot. Another booking overlaps with your selected time.`
            : `No ${CONSOLE_LABELS[consoleId]} setups available. All are booked for overlapping time slots.`,
      };
    }
  }

  return { ok: true };
}