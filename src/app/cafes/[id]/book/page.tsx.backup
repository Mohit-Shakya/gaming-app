// src/app/cafes/[id]/book/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { colors, fonts, CONSOLE_LABELS, CONSOLE_DB_KEYS, CONSOLE_COLORS, CONSOLE_ICONS, OPEN_HOUR, CLOSE_HOUR, PEAK_START, PEAK_END, TIME_INTERVAL, BOOKING_DURATION_MINUTES, type ConsoleId } from "@/lib/constants";
import { ConsolePricingRow, BookingRow, BookingItemRow, BookingWithNestedItems } from "@/types/database";

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

function generateTickets(
  consoleId: ConsoleId,
  pricingTier: {
    qty1_30min: number | null; qty1_60min: number | null;
    qty2_30min: number | null; qty2_60min: number | null;
    qty3_30min: number | null; qty3_60min: number | null;
    qty4_30min: number | null; qty4_60min: number | null;
  } | null,
  fallbackPrice: number,
  duration: 30 | 60 | 90
): TicketOption[] {
  const consoleName = CONSOLES.find((c) => c.id === consoleId)?.label || consoleId;
  const tickets: TicketOption[] = [];

  const maxConsoles = ["pool", "snooker"].includes(consoleId)
    ? 2
    : ["pc", "vr", "steering"].includes(consoleId)
    ? 1
    : 4;

  for (let qty = 1; qty <= maxConsoles; qty++) {
    let price: number;

    // Use tier-based pricing if available, otherwise fallback to simple multiplication
    if (pricingTier) {
      if (duration === 90) {
        // 90min = 60min + 30min pricing
        const price60 = pricingTier[`qty${qty}_60min` as keyof typeof pricingTier] ?? (fallbackPrice * qty);
        const price30 = pricingTier[`qty${qty}_30min` as keyof typeof pricingTier] ?? (fallbackPrice * qty * 0.5);
        price = price60 + price30;
      } else {
        const qtyKey = `qty${qty}_${duration}min` as keyof typeof pricingTier;
        const tierPrice = pricingTier[qtyKey];

        console.log(`💰 [${consoleId}] qty=${qty}, duration=${duration}min, key=${qtyKey}, tierPrice=${tierPrice}, fallbackPrice=${fallbackPrice}`);

        if (tierPrice !== null && tierPrice !== undefined) {
          price = tierPrice;
          console.log(`✓ Using tier price: ₹${price}`);
        } else {
          // Fallback: calculate based on duration ratio
          price = duration === 30 ? (fallbackPrice * qty * 0.5) : (fallbackPrice * qty);
          console.log(`✗ Using fallback price: ₹${price}`);
        }
      }
    } else {
      console.log(`⚠️ [${consoleId}] No pricingTier found, using fallback`);
      if (duration === 90) {
        // 90min = 1.5 hours
        price = fallbackPrice * qty * 1.5;
      } else {
        price = duration === 30 ? (fallbackPrice * qty * 0.5) : (fallbackPrice * qty);
      }
    }

    const durationText = duration === 30 ? "30 minutes" : duration === 60 ? "1 hour" : "1.5 hours";

    tickets.push({
      id: `${consoleId}_${qty}`,
      console: consoleId,
      title: `${consoleName} | ${qty} Console${qty > 1 ? "s" : ""}`,
      players: qty,
      price: price,
      description: `${qty} ${consoleName} console${qty > 1 ? "s" : ""} for ${durationText}.`,
    });
  }
  return tickets;
}


const DAY_OPTIONS = buildNext7Days();
const ALL_TIME_SLOTS = buildTimeSlots();

// ============ COMPONENT ============
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user, loading: userLoading } = useUser();


  const rawId = params?.id;
  const cafeId = typeof rawId === "string" && rawId !== "undefined" ? rawId : null;

  // ===== STATE =====
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState<string>(DAY_OPTIONS[0]?.key ?? "");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId>("ps5");
  const [quantities, setQuantities] = useState<Record<string, number>>({}); // ticketId -> quantity
  // ticketId format: "ps5_2" (console_quantity) OR "ps5_2_30" / "ps5_2_60" (console_quantity_duration)

  // Cafe data
  const [actualCafeId, setActualCafeId] = useState<string | null>(null); // Store UUID when slug is used
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [googleMapsUrl, setGoogleMapsUrl] = useState<string>("");
  const [instagramUrl, setInstagramUrl] = useState<string>("");

  type ConsolePricingTier = {
    qty1_30min: number | null;
    qty1_60min: number | null;
    qty2_30min: number | null;
    qty2_60min: number | null;
    qty3_30min: number | null;
    qty3_60min: number | null;
    qty4_30min: number | null;
    qty4_60min: number | null;
  };

  const [consolePricing, setConsolePricing] = useState<Partial<Record<ConsoleId, ConsolePricingTier>>>({});
  const [selectedDuration, setSelectedDuration] = useState<30 | 60 | 90>(60);
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

        // Check if cafeId is a UUID or slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeId);

        const { data, error } = await supabase
          .from("cafes")
          .select(
            "id, name, slug, hourly_price, google_maps_url, instagram_url, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count"
          )
          .eq(isUUID ? "id" : "slug", cafeId)
          .maybeSingle();

        if (error || !data) {
          console.error("Error loading cafe:", error);
          return;
        }

        // Store the actual UUID for booking creation
        setActualCafeId(data.id);
        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);
        setGoogleMapsUrl(data.google_maps_url || "");
        setInstagramUrl(data.instagram_url || "");

        const limits: Partial<Record<ConsoleId, number>> = {};
        const available: ConsoleId[] = [];

        CONSOLES.forEach((c) => {
          const count = data[c.dbKey as keyof typeof data] as number;
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

        // Load console pricing from database (both 30min and 60min)
        // IMPORTANT: Use data.id (UUID) not cafeId (could be slug)
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("console_type, quantity, duration_minutes, price")
          .eq("cafe_id", data.id);

        if (!pricingError && pricingData) {
          const pricing: Partial<Record<ConsoleId, ConsolePricingTier>> = {};

          console.log('🔍 [BOOKING] Raw pricing data from database:', pricingData);

          pricingData.forEach((item: ConsolePricingRow) => {
            // Map database console_type to ConsoleId
            let consoleId = item.console_type as ConsoleId;
            // Handle steering_wheel mapping
            if (item.console_type === "steering_wheel") {
              consoleId = "steering";
            }

            // Initialize tier object if not exists
            if (!pricing[consoleId]) {
              pricing[consoleId] = {
                qty1_30min: null, qty1_60min: null,
                qty2_30min: null, qty2_60min: null,
                qty3_30min: null, qty3_60min: null,
                qty4_30min: null, qty4_60min: null,
              };
            }

            // Set the price for the specific quantity and duration
            const qty = item.quantity;
            const duration = item.duration_minutes;
            if (qty >= 1 && qty <= 4 && (duration === 30 || duration === 60)) {
              const qtyKey = `qty${qty}_${duration}min` as keyof ConsolePricingTier;
              pricing[consoleId]![qtyKey] = item.price;
            }
          });

          console.log('🔍 [BOOKING] Processed console pricing:', pricing);
          setConsolePricing(pricing);
        } else if (pricingError) {
          console.error('❌ [BOOKING] Error loading pricing:', pricingError);
        } else {
          console.warn('⚠️ [BOOKING] No pricing data found for cafe');
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCafeData();
  }, [cafeId, selectedConsole]);


  // FETCH LIVE AVAILABILITY with OVERLAP LOGIC
  const fetchLiveAvailability = useCallback(async () => {
    const effectiveCafeId = actualCafeId || cafeId;
    if (!effectiveCafeId || !selectedDate || !selectedTime) {
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
        .eq("cafe_id", effectiveCafeId)
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

      (bookings ?? []).forEach((booking: BookingWithNestedItems) => {
        const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");
        const bookingEndMinutes = bookingStartMinutes + BOOKING_DURATION_MINUTES;

        if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, selectedDuration)) {
          (booking.booking_items ?? []).forEach((item: BookingItemRow) => {
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
  }, [actualCafeId, cafeId, selectedDate, selectedTime, availableConsoles, consoleLimits, selectedDuration]);

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

  useEffect(() => {
    if (selectedTime && filteredTimeSlots.length > 0) {
      const isStillAvailable = filteredTimeSlots.some((slot) => slot.label === selectedTime);
      if (!isStillAvailable) {
        setSelectedTime("");
      }
    }
  }, [filteredTimeSlots, selectedTime]);

  const tickets = useMemo(() => {
    const pricingTier = consolePricing[selectedConsole] ?? null;
    return generateTickets(selectedConsole, pricingTier, cafePrice, selectedDuration);
  }, [selectedConsole, consolePricing, cafePrice, selectedDuration]);

  const usedPerConsole = useMemo(() => {
    const map: Partial<Record<ConsoleId, number>> = {};
    Object.entries(quantities).forEach(([ticketId, qty]) => {
      if (qty <= 0) return;

      const consoleId = ticketId.split("_")[0] as ConsoleId;
      const players = parseInt(ticketId.split("_")[1]) || 1; // Number of consoles in this ticket tier

      // Each ticket quantity uses (players × qty) consoles
      // e.g., 2 tickets of "PS5 | 3 Consoles" = 2 × 3 = 6 consoles used
      map[consoleId] = (map[consoleId] ?? 0) + (players * qty);
    });
    return map;
  }, [quantities]);

  const summary = useMemo(() => {
    let totalTickets = 0;
    let totalAmount = 0;

    Object.entries(quantities).forEach(([ticketId, qty]) => {
      if (qty <= 0) return;
      const consoleId = ticketId.split("_")[0] as ConsoleId;
      const pricingTier = consolePricing[consoleId] ?? null;
      const consoleTickets = generateTickets(consoleId, pricingTier, cafePrice, selectedDuration);
      const ticket = consoleTickets.find((t) => t.id === ticketId);
      if (ticket) {
        totalTickets += qty;
        totalAmount += qty * ticket.price;
      }
    });

    return { totalTickets, totalAmount };
  }, [quantities, consolePricing, cafePrice, selectedDuration]);

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

    // Set loading state immediately for instant feedback
    setIsSubmitting(true);

    // Wait for auth check to complete before redirecting
    if (userLoading) {
      // Still checking auth status, wait a bit
      return;
    }

    if (!user) {
      // User is not logged in, save current page and redirect to login
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      router.push("/login");
      return;
    }

    // User is logged in, check if onboarding is complete
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.onboarding_complete) {
        sessionStorage.setItem("redirectAfterOnboarding", window.location.pathname + window.location.search);
        router.push("/onboarding");
        return;
      }
    } catch (err) {
      console.error("Error checking profile:", err);
      setIsSubmitting(false);
      return;
    }

    try {
      const selectedTickets = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketId, qty]) => {
          const consoleId = ticketId.split("_")[0] as ConsoleId;
          const pricingTier = consolePricing[consoleId] ?? null;
          const consoleTickets = generateTickets(consoleId, pricingTier, cafePrice, selectedDuration);
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
        durationMinutes: selectedDuration,
      });

      if (!capacityResult.ok) {
        alert(capacityResult.message);
        await fetchLiveAvailability();
        setIsSubmitting(false);
        return;
      }

      const payload = {
        cafeId: actualCafeId || cafeId, // Use actual UUID, fallback to cafeId if not set
        cafeName,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        tickets: selectedTickets,
        totalAmount: summary.totalAmount,
        durationMinutes: selectedDuration,
        source: "online",
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
          padding: "16px 16px 140px",
          position: "relative",
          zIndex: 1,
        }}
        className="booking-container"
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
            {step === 2 ? "Change Date & Time" : "Back"}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <p
              style={{
                fontSize: "12px",
                color: colors.cyan,
                textTransform: "uppercase",
                letterSpacing: "2px",
                margin: 0,
              }}
            >
              {cafeName}
            </p>

            {/* Social Links */}
            {(googleMapsUrl || instagramUrl) && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, rgba(66, 133, 244, 0.2) 0%, rgba(66, 133, 244, 0.1) 100%)",
                      border: "1px solid rgba(66, 133, 244, 0.3)",
                      transition: "all 0.2s ease",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(66, 133, 244, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>📍</span>
                  </a>
                )}

                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "linear-gradient(135deg, rgba(225, 48, 108, 0.2) 0%, rgba(193, 53, 132, 0.1) 100%)",
                      border: "1px solid rgba(225, 48, 108, 0.3)",
                      transition: "all 0.2s ease",
                      textDecoration: "none",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.1)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(225, 48, 108, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>📷</span>
                  </a>
                )}
              </div>
            )}
          </div>

          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "24px",
              fontWeight: 800,
              background: `linear-gradient(135deg, ${colors.textPrimary} 0%, ${colors.cyan} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              margin: 0,
              marginBottom: "8px",
            }}
            className="booking-title"
          >
            {step === 1 ? "Select Date & Time" : "Choose Your Setup"}
          </h1>

          {/* Step indicator with labels */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Step 1: Date & Time
              </div>
              <div
                style={{
                  height: "4px",
                  borderRadius: "4px",
                  background: `linear-gradient(90deg, ${colors.red} 0%, ${colors.cyan} 100%)`,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "10px", color: step === 2 ? colors.cyan : colors.textMuted, marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Step 2: Consoles
              </div>
              <div
                style={{
                  height: "4px",
                  borderRadius: "4px",
                  background: step === 2 ? `linear-gradient(90deg, ${colors.cyan} 0%, ${colors.red} 100%)` : "rgba(255, 255, 255, 0.1)",
                  transition: "background 0.3s ease",
                }}
              />
            </div>
          </div>
        </header>

        {/* ========== STEP 1: DATE & TIME ========== */}
        {step === 1 && (
          <>
            {/* Date Selection */}
            <section style={{ marginBottom: "20px" }}>
              <h2
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: colors.textSecondary,
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
                className="section-heading"
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
                        width: "68px",
                        padding: "10px 6px",
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
                        boxShadow: isActive ? `0 0 20px rgba(255, 7, 58, 0.3)` : "none",
                        minHeight: "48px",
                      }}
                      className="date-button"
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
                  fontSize: "13px",
                  fontWeight: 600,
                  color: colors.textSecondary,
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
                className="section-heading"
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
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: "8px",
                    }}
                    className="time-grid"
                  >
                    {filteredTimeSlots.map((slot) => {
                      const isActive = slot.label === selectedTime;
                      return (
                        <button
                          key={slot.label}
                          onClick={() => setSelectedTime(slot.label)}
                          style={{
                            padding: "10px 6px",
                            minHeight: "44px",
                            borderRadius: "8px",
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
                          className="time-button"
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
            {/* Selected Date/Time Summary - Redesigned */}
            <div
              style={{
                padding: "18px 20px",
                background: `linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(255, 7, 58, 0.08) 100%)`,
                borderRadius: "16px",
                border: `2px solid rgba(0, 240, 255, 0.2)`,
                marginBottom: "24px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative glow */}
              <div style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: "100px",
                height: "100px",
                background: `radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)`,
                pointerEvents: "none",
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "11px", color: colors.textMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px" }}>
                      📅 Your Booking
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: 700, color: colors.textPrimary, fontFamily: fonts.heading, marginBottom: "4px" }}>
                      {dateLabel}
                    </div>
                    <div style={{ fontSize: "15px", color: colors.cyan, fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                      <span>⏰</span>
                      {selectedTime} - {getEndTime(selectedTime, selectedDuration)}
                    </div>
                  </div>
                  <button
                    onClick={handleBackToDateTime}
                    style={{
                      padding: "8px 16px",
                      background: `linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.25) 100%)`,
                      border: `1px solid ${colors.cyan}`,
                      borderRadius: "10px",
                      color: colors.cyan,
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Change
                  </button>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      background: "rgba(0, 240, 255, 0.15)",
                      border: `1px solid ${colors.cyan}`,
                      fontSize: "11px",
                      fontWeight: 700,
                      color: colors.cyan,
                    }}
                  >
                    <span>⏱️</span>
                    <span>{selectedDuration === 30 ? "30 min" : selectedDuration === 60 ? "1 hour" : "1.5 hours"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration Selector - Improved */}
            <div style={{ marginBottom: "24px" }}>
              <h2
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: colors.textPrimary,
                  marginBottom: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
                className="section-heading"
              >
                <span style={{ fontSize: "18px" }}>⏱️</span>
                <span>Select Duration</span>
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                <button
                  onClick={() => { setSelectedDuration(30); setQuantities({}); }}
                  style={{
                    padding: "16px 12px",
                    minHeight: "80px",
                    borderRadius: "14px",
                    border: selectedDuration === 30
                      ? `2.5px solid ${colors.cyan}`
                      : `1.5px solid ${colors.border}`,
                    background: selectedDuration === 30
                      ? `linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.10) 100%)`
                      : `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: selectedDuration === 30 ? `0 6px 20px rgba(0, 240, 255, 0.3)` : "0 2px 6px rgba(0, 0, 0, 0.15)",
                    transform: selectedDuration === 30 ? "translateY(-1px)" : "none",
                  }}
                  className="duration-button"
                >
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 900,
                      fontFamily: fonts.heading,
                      color: selectedDuration === 30 ? colors.cyan : colors.textPrimary,
                      marginBottom: "4px",
                      letterSpacing: "-0.5px",
                      lineHeight: "1",
                    }}
                  >
                    30
                  </div>
                  <div style={{ fontSize: "12px", color: selectedDuration === 30 ? colors.cyan : colors.textMuted, fontWeight: 600 }}>
                    min
                  </div>
                </button>
                <button
                  onClick={() => { setSelectedDuration(60); setQuantities({}); }}
                  style={{
                    padding: "16px 12px",
                    minHeight: "80px",
                    borderRadius: "14px",
                    border: selectedDuration === 60
                      ? `2.5px solid ${colors.cyan}`
                      : `1.5px solid ${colors.border}`,
                    background: selectedDuration === 60
                      ? `linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.10) 100%)`
                      : `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: selectedDuration === 60 ? `0 6px 20px rgba(0, 240, 255, 0.3)` : "0 2px 6px rgba(0, 0, 0, 0.15)",
                    transform: selectedDuration === 60 ? "translateY(-1px)" : "none",
                  }}
                  className="duration-button"
                >
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 900,
                      fontFamily: fonts.heading,
                      color: selectedDuration === 60 ? colors.cyan : colors.textPrimary,
                      marginBottom: "4px",
                      letterSpacing: "-0.5px",
                      lineHeight: "1",
                    }}
                  >
                    60
                  </div>
                  <div style={{ fontSize: "12px", color: selectedDuration === 60 ? colors.cyan : colors.textMuted, fontWeight: 600 }}>
                    min
                  </div>
                </button>
                <button
                  onClick={() => { setSelectedDuration(90); setQuantities({}); }}
                  style={{
                    padding: "16px 12px",
                    minHeight: "80px",
                    borderRadius: "14px",
                    border: selectedDuration === 90
                      ? `2.5px solid ${colors.red}`
                      : `1.5px solid ${colors.border}`,
                    background: selectedDuration === 90
                      ? `linear-gradient(135deg, rgba(255, 7, 58, 0.22) 0%, rgba(255, 7, 58, 0.10) 100%)`
                      : `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: selectedDuration === 90 ? `0 6px 20px rgba(255, 7, 58, 0.3)` : "0 2px 6px rgba(0, 0, 0, 0.15)",
                    transform: selectedDuration === 90 ? "translateY(-1px)" : "none",
                    position: "relative",
                  }}
                  className="duration-button"
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      fontSize: "10px",
                    }}
                  >
                    🔥
                  </div>
                  <div
                    style={{
                      fontSize: "26px",
                      fontWeight: 900,
                      fontFamily: fonts.heading,
                      color: selectedDuration === 90 ? colors.red : colors.textPrimary,
                      marginBottom: "4px",
                      letterSpacing: "-0.5px",
                      lineHeight: "1",
                    }}
                  >
                    90
                  </div>
                  <div style={{ fontSize: "12px", color: selectedDuration === 90 ? colors.red : colors.textMuted, fontWeight: 600 }}>
                    min
                  </div>
                </button>
              </div>
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
                  fontWeight: 700,
                  color: colors.textPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
                className="section-heading"
              >
                <span style={{ fontSize: "18px" }}>🎮</span>
                <span>Select Console</span>
              </h2>

              {/* Compact console cards grid */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  justifyContent: "flex-start",
                }}
                className="console-grid-container"
              >
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
                        minWidth: "85px",
                        maxWidth: "85px",
                        padding: "10px 6px",
                        borderRadius: "10px",
                        border: isActive
                          ? `2px solid ${console.color}`
                          : isSoldOut
                          ? `1px solid rgba(255, 255, 255, 0.06)`
                          : `1px solid ${colors.border}`,
                        background: isActive
                          ? `linear-gradient(135deg, ${console.color}25 0%, ${console.color}10 100%)`
                          : isSoldOut
                          ? "rgba(255, 255, 255, 0.02)"
                          : colors.darkCard,
                        cursor: isSoldOut ? "not-allowed" : "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isActive ? `0 4px 16px ${console.color}35` : "none",
                        opacity: isSoldOut ? 0.5 : 1,
                        textAlign: "center",
                        transform: isActive ? "scale(1.02)" : "none",
                      }}
                      className="console-card"
                    >
                      {/* Console icon */}
                      <div style={{
                        fontSize: "24px",
                        marginBottom: "4px",
                        filter: isSoldOut ? "grayscale(1)" : "none",
                      }}>
                        {console.icon}
                      </div>

                      {/* Console name */}
                      <div
                        style={{
                          fontSize: "11px",
                          fontWeight: 800,
                          fontFamily: fonts.heading,
                          color: isActive ? console.color : colors.textPrimary,
                          marginBottom: "2px",
                          letterSpacing: "-0.2px",
                        }}
                      >
                        {console.label}
                      </div>

                      {/* Price */}
                      <div style={{ fontSize: "10px", color: colors.textMuted, fontWeight: 600, marginBottom: "6px" }}>
                        ₹{
                          selectedDuration === 90
                            ? ((consolePricing[consoleId]?.qty1_60min ?? cafePrice) + (consolePricing[consoleId]?.qty1_30min ?? cafePrice * 0.5))
                            : (consolePricing[consoleId]?.[`qty1_${selectedDuration}min` as keyof ConsolePricingTier] ?? (selectedDuration === 30 ? cafePrice * 0.5 : cafePrice))
                        }
                      </div>

                      {/* Availability badge - compact */}
                      <div
                        style={{
                          padding: "4px 8px",
                          background: isSoldOut
                            ? "rgba(239, 68, 68, 0.2)"
                            : isLowStock
                            ? "rgba(245, 158, 11, 0.2)"
                            : "rgba(34, 197, 94, 0.2)",
                          borderRadius: "6px",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: isSoldOut
                            ? "#ef4444"
                            : isLowStock
                            ? colors.orange
                            : colors.green,
                          marginBottom: mySelection > 0 ? "6px" : "0",
                        }}
                      >
                        {isSoldOut ? "Sold Out" : `${availableSlots}/${totalSlots}`}
                      </div>

                      {/* Selected indicator - compact */}
                      {mySelection > 0 && (
                        <div
                          style={{
                            padding: "3px 6px",
                            background: `${console.color}30`,
                            borderRadius: "5px",
                            fontSize: "9px",
                            fontWeight: 700,
                            color: console.color,
                          }}
                        >
                          ✓ {mySelection}
                        </div>
                      )}
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
                    fontSize: "13px",
                    fontWeight: 600,
                    color: colors.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                  className="section-heading"
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
                                minHeight: "44px",
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
                              className="add-button"
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
          {step === 1 ? (
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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isSubmitting && (
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

      {/* Animations & Responsive styles */}
      <style>{`
        /* Hide scrollbar but keep functionality */}
        .console-scroll-container::-webkit-scrollbar {
          display: none;
        }
        .console-scroll-container {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        /* Mobile-first responsive styles */
        @media (min-width: 480px) {
          .time-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
          .date-button {
            width: 72px !important;
            padding: 12px 8px !important;
          }
        }

        @media (min-width: 640px) {
          .booking-container {
            padding: 20px 16px 140px !important;
          }
          .booking-title {
            font-size: 22px !important;
          }
          .section-heading {
            font-size: 14px !important;
          }
          .duration-button {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Helper to calculate end time based on duration
 */
function getEndTime(startTime: string, durationMinutes: number = BOOKING_DURATION_MINUTES): string {
  const startMinutes = timeStringToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;

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
  durationMinutes: number;
}): Promise<{ ok: boolean; message?: string }> {
  const { cafeId, bookingDate, timeSlot, tickets, durationMinutes } = options;

  const requested: Partial<Record<ConsoleId, number>> = {};
  for (const t of tickets) {
    if (!t.console || t.quantity <= 0) continue;
    requested[t.console] = (requested[t.console] ?? 0) + t.quantity;
  }
  if (Object.keys(requested).length === 0) {
    return { ok: false, message: "No tickets selected." };
  }

  // Check if cafeId is a UUID or slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeId);

  const { data: cafeRow, error: cafeError } = await supabase
    .from("cafes")
    .select(
      "id, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count"
    )
    .eq(isUUID ? "id" : "slug", cafeId)
    .maybeSingle();

  if (cafeError || !cafeRow) {
    console.error("Capacity check: error loading cafe", cafeError);
    return { ok: false, message: "Could not check availability. Please try again." };
  }

  const capacities: Partial<Record<ConsoleId, number>> = {};
  (Object.keys(CONSOLE_DB_KEYS) as ConsoleId[]).forEach((consoleId) => {
    const dbKey = CONSOLE_DB_KEYS[consoleId];
    capacities[consoleId] = (cafeRow[dbKey as keyof typeof cafeRow] as number) ?? 0;
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
    .eq("cafe_id", cafeRow.id)
    .eq("booking_date", bookingDate)
    .neq("status", "cancelled");

  if (bookingsError) {
    console.error("Capacity check: error loading bookings", bookingsError);
    return { ok: false, message: "Could not check availability. Please try again." };
  }

  const alreadyBooked: Partial<Record<ConsoleId, number>> = {};

  (bookings ?? []).forEach((booking: BookingWithNestedItems) => {
    const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");

    if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, durationMinutes)) {
      (booking.booking_items ?? []).forEach((item: BookingItemRow) => {
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