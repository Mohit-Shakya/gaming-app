// src/app/cafes/[id]/book/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import {
  colors,
  fonts,
  CONSOLE_LABELS,
  CONSOLE_DB_KEYS,
  CONSOLE_COLORS,
  OPEN_HOUR,
  CLOSE_HOUR,
  PEAK_START,
  PEAK_END,
  TIME_INTERVAL,
  BOOKING_DURATION_MINUTES,
  type ConsoleId
} from "@/lib/constants";

// Lucide Icons
import {
  ArrowLeft,
  Calendar,
  Clock,
  Gamepad2,
  GamepadDirectional,
  Monitor,
  Car,
  Target,
  RectangleGoggles,
  Zap,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Loader2,
  MapPin,
  Instagram,
  CreditCard,
  Plus,
  Minus,
  ChevronRight,
  ShieldCheck,
  BadgeCheck,
  Sparkles,
  Crown,
  IndianRupee,
  Users,
  CalendarDays,
  CalendarRange,
  CrownIcon as Crown2,
  Ticket,
  Rocket
} from "lucide-react";

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
  icon: React.ReactNode;
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
  nextAvailableAt: string | null;
};

// ============ CONSTANTS ============
const CONSOLES: ConsoleOption[] = [
  {
    id: "ps5",
    label: CONSOLE_LABELS.ps5,
    icon: <GamepadDirectional className="w-5 h-5" />,
    color: CONSOLE_COLORS.ps5,
    dbKey: CONSOLE_DB_KEYS.ps5
  },
  {
    id: "ps4",
    label: CONSOLE_LABELS.ps4,
    icon: <Gamepad2 className="w-5 h-5" />,
    color: CONSOLE_COLORS.ps4,
    dbKey: CONSOLE_DB_KEYS.ps4
  },
  {
    id: "xbox",
    label: CONSOLE_LABELS.xbox,
    icon: <Gamepad2 className="w-5 h-5" />,
    color: CONSOLE_COLORS.xbox,
    dbKey: CONSOLE_DB_KEYS.xbox
  },
  {
    id: "pc",
    label: CONSOLE_LABELS.pc,
    icon: <Monitor className="w-5 h-5" />,
    color: CONSOLE_COLORS.pc,
    dbKey: CONSOLE_DB_KEYS.pc
  },
  {
    id: "pool",
    label: CONSOLE_LABELS.pool,
    icon: <Target className="w-5 h-5" />,
    color: CONSOLE_COLORS.pool,
    dbKey: CONSOLE_DB_KEYS.pool
  },
  {
    id: "arcade",
    label: CONSOLE_LABELS.arcade,
    icon: <Gamepad2 className="w-5 h-5" />,
    color: CONSOLE_COLORS.arcade,
    dbKey: CONSOLE_DB_KEYS.arcade
  },
  {
    id: "snooker",
    label: CONSOLE_LABELS.snooker,
    icon: <Target className="w-5 h-5" />,
    color: CONSOLE_COLORS.snooker,
    dbKey: CONSOLE_DB_KEYS.snooker
  },
  {
    id: "vr",
    label: CONSOLE_LABELS.vr,
    icon: <RectangleGoggles className="w-5 h-5" />,
    color: CONSOLE_COLORS.vr,
    dbKey: CONSOLE_DB_KEYS.vr
  },
  {
    id: "steering",
    label: CONSOLE_LABELS.steering,
    icon: <Car className="w-5 h-5" />,
    color: CONSOLE_COLORS.steering,
    dbKey: CONSOLE_DB_KEYS.steering
  },
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

function doTimeSlotsOverlap(
  slot1StartMinutes: number,
  slot2StartMinutes: number,
  durationMinutes: number = BOOKING_DURATION_MINUTES
): boolean {
  const slot1End = slot1StartMinutes + durationMinutes;
  const slot2End = slot2StartMinutes + durationMinutes;
  return slot1StartMinutes < slot2End && slot2StartMinutes < slot1End;
}

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

    if (pricingTier) {
      if (duration === 90) {
        const price60 = pricingTier[`qty${qty}_60min` as keyof typeof pricingTier] ?? (fallbackPrice * qty);
        const price30 = pricingTier[`qty${qty}_30min` as keyof typeof pricingTier] ?? (fallbackPrice * qty * 0.5);
        price = price60 + price30;
      } else {
        const qtyKey = `qty${qty}_${duration}min` as keyof typeof pricingTier;
        const tierPrice = pricingTier[qtyKey];

        if (tierPrice !== null && tierPrice !== undefined) {
          price = tierPrice;
        } else {
          price = duration === 30 ? (fallbackPrice * qty * 0.5) : (fallbackPrice * qty);
        }
      }
    } else {
      if (duration === 90) {
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
  return (
    <Suspense fallback={
      <div style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#00f0ff",
        fontFamily: "monospace"
      }}>
        Loading...
      </div>
    }>
      <BookingPageContent />
    </Suspense>
  );
}

function BookingPageContent() {
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
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [actualCafeId, setActualCafeId] = useState<string | null>(null);
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
  const [liveAvailability, setLiveAvailability] = useState<Partial<Record<ConsoleId, ConsoleAvailability>>>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // ===== LOAD CAFE DATA =====
  useEffect(() => {
    async function loadCafeData() {
      if (!cafeId) return;

      try {
        setLoading(true);
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

        setActualCafeId(data.id);
        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);
        setGoogleMapsUrl(data.google_maps_url || "");
        setInstagramUrl(data.instagram_url || "");

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

        // Use data.id (actual UUID) for pricing, not cafeId (which could be slug)
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("console_type, quantity, duration_minutes, price")
          .eq("cafe_id", data.id);

        console.log("[Book] Pricing query for cafe UUID:", data.id);
        console.log("[Book] Pricing data:", pricingData);
        console.log("[Book] Pricing error:", pricingError);

        if (!pricingError && pricingData && pricingData.length > 0) {
          const pricing: Partial<Record<ConsoleId, ConsolePricingTier>> = {};

          pricingData.forEach((item: any) => {
            let consoleId = item.console_type as ConsoleId;
            if (item.console_type === "steering_wheel") {
              consoleId = "steering";
            }

            if (!pricing[consoleId]) {
              pricing[consoleId] = {
                qty1_30min: null, qty1_60min: null,
                qty2_30min: null, qty2_60min: null,
                qty3_30min: null, qty3_60min: null,
                qty4_30min: null, qty4_60min: null,
              };
            }

            const qty = item.quantity;
            const duration = item.duration_minutes;
            if (qty >= 1 && qty <= 4 && (duration === 30 || duration === 60)) {
              const qtyKey = `qty${qty}_${duration}min` as keyof ConsolePricingTier;
              pricing[consoleId]![qtyKey] = item.price;
            }
          });

          console.log("[Book] Parsed pricing:", pricing);
          setConsolePricing(pricing);
        } else {
          console.log("[Book] No pricing data found, falling back to hourly_price:", data.hourly_price);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCafeData();
  }, [cafeId, selectedConsole]);

  // FETCH LIVE AVAILABILITY
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

      (bookings ?? []).forEach((booking: any) => {
        const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");
        const bookingEndMinutes = bookingStartMinutes + BOOKING_DURATION_MINUTES;

        if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, selectedDuration)) {
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

    setIsSubmitting(true);

    if (userLoading) {
      return;
    }

    if (!user) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      router.push("/login");
      return;
    }

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
        cafeId: actualCafeId || cafeId,
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
      <div className="error-container">
        <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
        <h1 className="error-title">Café not found</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="loading-text">Loading café details...</p>
      </div>
    );
  }

  return (
    <div className="booking-page">
      {/* Background glow */}
      <div className="background-glow" />

      <div className="booking-container">
        {/* Header */}
        <header className="booking-header">
          <div className="header-nav">
            <button
              onClick={() => (step === 2 ? handleBackToDateTime() : router.back())}
              className="back-button"
            >
              <ArrowLeft className="w-5 h-5" />
              {step === 2 ? "Change Date & Time" : "Back"}
            </button>

            <div className="social-links">
              {googleMapsUrl && (
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-button maps"
                  title="View on Google Maps"
                >
                  <MapPin className="w-4 h-4" />
                </a>
              )}
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-button instagram"
                  title="Follow on Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          <div className="cafe-info">
            <div className="cafe-icon">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="cafe-name">{cafeName}</h1>
              <div className="cafe-tag">Premium Gaming Zone</div>
            </div>
          </div>

          <h2 className="booking-title">
            {step === 1 ? "Select Date & Time" : "Choose Your Setup"}
          </h2>

          {/* Step indicator */}
          <div className="step-indicator">
            <div className="step">
              <div className={`step-circle ${step >= 1 ? 'active' : ''}`}>1</div>
              <div className={`step-label ${step >= 1 ? 'active' : ''}`}>Date & Time</div>
            </div>
            <div className="step-connector" />
            <div className="step">
              <div className={`step-circle ${step >= 2 ? 'active' : ''}`}>2</div>
              <div className={`step-label ${step >= 2 ? 'active' : ''}`}>Consoles</div>
            </div>
          </div>
        </header>

        {/* ========== STEP 1: DATE & TIME ========== */}
        {step === 1 && (
          <>
            {/* Date Selection */}
            <section className="date-section">
              <div className="section-header">
                <CalendarDays className="w-5 h-5" />
                <h3>Select Date</h3>
              </div>

              <div className="date-grid">
                {DAY_OPTIONS.map((day) => {
                  const isActive = day.key === selectedDate;
                  return (
                    <button
                      key={day.key}
                      onClick={() => setSelectedDate(day.key)}
                      className={`date-button ${isActive ? 'active' : ''}`}
                    >
                      <div className={`day-name ${day.isToday ? 'today' : ''}`}>
                        {day.isToday ? "TODAY" : day.dayName.toUpperCase()}
                      </div>
                      <div className="day-number">{day.dayNum}</div>
                      <div className="month">{day.month.toUpperCase()}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Time Selection */}
            <section className="time-section">
              <div className="section-header">
                <Clock className="w-5 h-5" />
                <h3>Select Time Slot</h3>
              </div>

              {filteredTimeSlots.length === 0 ? (
                <div className="no-slots">
                  <CalendarRange className="w-16 h-16 mb-4 text-gray-500" />
                  <h4>No Slots Available</h4>
                  <p>Please select another date for booking</p>
                </div>
              ) : (
                <>
                  <div className="time-grid">
                    {filteredTimeSlots.map((slot) => {
                      const isActive = slot.label === selectedTime;
                      return (
                        <button
                          key={slot.label}
                          onClick={() => setSelectedTime(slot.label)}
                          className={`time-button ${isActive ? 'active' : ''}`}
                        >
                          <span className="time-label">{slot.label}</span>
                          {slot.isPeak && (
                            <span className="peak-badge">
                              <Zap className="w-3 h-3" />
                              Peak
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="peak-info">
                    <div className="peak-dot" />
                    <span>Peak hours (6 PM - 10 PM) may have higher demand</span>
                  </div>
                </>
              )}
            </section>
          </>
        )}

        {/* ========== STEP 2: TICKETS ========== */}
        {step === 2 && (
          <>
            {/* Selected Date/Time Summary */}
            <div className="booking-summary-card">
              <div className="summary-header">
                <div className="summary-icon">
                  <Calendar className="w-6 h-6" />
                </div>
                <div className="summary-details">
                  <h3>Selected Booking</h3>
                  <div className="summary-info">
                    <span className="summary-date">{dateLabel}</span>
                    <span className="summary-time">
                      <Clock className="w-4 h-4" />
                      {selectedTime} - {getEndTime(selectedTime, selectedDuration)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleBackToDateTime}
                  className="change-button"
                >
                  Change
                </button>
              </div>

              <div className="duration-tag">
                <Clock className="w-4 h-4" />
                <span>{selectedDuration === 30 ? "30 min" : selectedDuration === 60 ? "1 hour" : "1.5 hours"}</span>
              </div>
            </div>

            {/* Duration Selector */}
            <section className="duration-section">
              <div className="section-header">
                <Clock className="w-5 h-5" />
                <h3>Select Duration</h3>
              </div>

              <div className="duration-grid">
                <button
                  onClick={() => { setSelectedDuration(30); setQuantities({}); }}
                  className={`duration-card ${selectedDuration === 30 ? 'active' : ''}`}
                >
                  <div className="duration-number">30</div>
                  <div className="duration-label">MINUTES</div>
                </button>

                <button
                  onClick={() => { setSelectedDuration(60); setQuantities({}); }}
                  className={`duration-card ${selectedDuration === 60 ? 'active' : ''}`}
                >
                  <div className="duration-number">60</div>
                  <div className="duration-label">MINUTES</div>
                </button>

                <button
                  onClick={() => { setSelectedDuration(90); setQuantities({}); }}
                  className={`duration-card premium ${selectedDuration === 90 ? 'active' : ''}`}
                >
                  <Crown className="w-4 h-4 absolute top-3 right-3 text-yellow-400" />
                  <div className="duration-number">90</div>
                  <div className="duration-label">MINUTES</div>
                  <div className="premium-badge">Popular</div>
                </button>
              </div>
            </section>

            {/* Live Availability Banner */}
            <div className="live-availability-banner">
              <div className="live-badge">
                <div className="live-dot" />
                <span>LIVE AVAILABILITY</span>
              </div>
              <div className="live-info">
                <span className="live-text">Real-time updates every 30 seconds</span>
                <button
                  onClick={fetchLiveAvailability}
                  disabled={loadingAvailability}
                  className="refresh-btn"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingAvailability ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Console Selection */}
            <section className="console-section">
              <div className="section-header">
                <Gamepad2 className="w-5 h-5" />
                <h3>Select Console Type</h3>
              </div>

              <div className="console-scroll">
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
                      className={`console-button ${isActive ? 'active' : ''} ${isSoldOut ? 'sold-out' : ''}`}
                    >
                      <div className="console-icon-wrapper">
                        <div className={`console-icon ${isSoldOut ? 'disabled' : ''}`}>
                          {console.icon}
                        </div>
                        {mySelection > 0 && (
                          <div className="selection-badge" style={{ background: console.color }}>
                            {mySelection}
                          </div>
                        )}
                      </div>

                      <div className="console-name">{console.label}</div>

                      <div className="console-price">
                        <IndianRupee className="w-3 h-3" />
                        {selectedDuration === 90
                          ? Math.round((consolePricing[consoleId]?.qty1_60min ?? cafePrice) + (consolePricing[consoleId]?.qty1_30min ?? cafePrice * 0.5))
                          : Math.round(consolePricing[consoleId]?.[`qty1_${selectedDuration}min` as keyof ConsolePricingTier] ?? (selectedDuration === 30 ? cafePrice * 0.5 : cafePrice))
                        }
                      </div>

                      <div className={`availability-status ${isSoldOut ? 'sold-out' : isLowStock ? 'low-stock' : 'available'}`}>
                        {isSoldOut ? (
                          <span className="status-text">SOLD OUT</span>
                        ) : (
                          <>
                            <span className="status-dot" />
                            <span className="status-text">{availableSlots} LEFT</span>
                          </>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Ticket Cards */}
            <section className="tickets-section">
              <div className="section-header">
                <Ticket className="w-5 h-5" />
                <div className="section-title">
                  <h3>Select Tickets</h3>
                  {!atLimit && remainingForSelected > 0 && (
                    <span className={`availability-counter ${remainingForSelected <= 2 ? 'low' : ''}`}>
                      {remainingForSelected} slot{remainingForSelected > 1 ? "s" : ""} remaining
                    </span>
                  )}
                </div>
              </div>

              {atLimit && usedForSelected === 0 ? (
                <div className="sold-out-message">
                  <div className="sold-out-icon">
                    <AlertCircle className="w-8 h-8" />
                  </div>
                  <div className="sold-out-content">
                    <h4>Fully Booked!</h4>
                    <p>All {CONSOLE_LABELS[selectedConsole]} setups are booked for this time slot.</p>
                    {liveAvailability[selectedConsole]?.nextAvailableAt && (
                      <div className="next-available">
                        <Clock className="w-4 h-4" />
                        <span>Available from {liveAvailability[selectedConsole]?.nextAvailableAt}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="tickets-grid">
                  {tickets.map((ticket) => {
                    const qty = getQty(ticket.id);
                    const hasQty = qty > 0;
                    const canAdd = remainingForSelected > 0;

                    return (
                      <div key={ticket.id} className={`ticket-card ${hasQty ? 'selected' : ''}`}>
                        <div className="ticket-header">
                          <div className="ticket-icon">
                            <Users className="w-5 h-5" />
                          </div>
                          <div className="ticket-badge">
                            {ticket.players} PLAYER{ticket.players > 1 ? "S" : ""}
                          </div>
                        </div>

                        <div className="ticket-body">
                          <h4 className="ticket-title">{ticket.title}</h4>
                          <p className="ticket-desc">{ticket.description}</p>
                        </div>

                        <div className="ticket-footer">
                          <div className="ticket-price">
                            <span className="price-amount">
                              <IndianRupee className="w-4 h-4 inline" />
                              {ticket.price}
                            </span>
                            <span className="price-unit">total</span>
                          </div>

                          {!hasQty ? (
                            <button
                              disabled={!canAdd}
                              onClick={() => canAdd && setQty(ticket.id, 1)}
                              className={`add-button ${canAdd ? 'active' : 'disabled'}`}
                            >
                              ADD
                            </button>
                          ) : (
                            <div className="quantity-controls">
                              <button
                                onClick={() => setQty(ticket.id, qty - 1)}
                                className="qty-btn"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="qty-display">{qty}</span>
                              <button
                                disabled={!canAdd}
                                onClick={() => canAdd && setQty(ticket.id, qty + 1)}
                                className={`qty-btn ${!canAdd ? 'disabled' : ''}`}
                              >
                                <Plus className="w-4 h-4" />
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

      {/* Bottom Action Bar */}
      <div className="action-bar">
        <div className="action-container">
          {step === 1 ? (
            <>
              <div className="selection-info">
                <div className="date-info">
                  <Calendar className="w-4 h-4" />
                  <span>{selectedDate ? dateLabel : "Select a date"}</span>
                </div>
                <div className={`time-info ${selectedTime ? 'selected' : ''}`}>
                  <Clock className="w-4 h-4" />
                  <span>{selectedTime || "Select a time"}</span>
                </div>
              </div>
              <button
                onClick={handleContinueToTickets}
                disabled={!selectedDate || !selectedTime}
                className={`continue-btn ${selectedDate && selectedTime ? 'active' : 'disabled'}`}
              >
                CONTINUE TO TICKETS
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="booking-summary">
                {summary.totalTickets > 0 ? (
                  <>
                    <div className="summary-tickets">
                      <Ticket className="w-4 h-4" />
                      <span>{summary.totalTickets} ticket{summary.totalTickets > 1 ? "s" : ""} selected</span>
                    </div>
                    <div className="summary-details">
                      {dateLabel} • {selectedTime}
                    </div>
                  </>
                ) : (
                  <div className="no-tickets">
                    <AlertCircle className="w-4 h-4" />
                    <span>Add tickets to continue</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleConfirmBooking}
                disabled={summary.totalTickets === 0 || isSubmitting}
                className={`confirm-btn ${summary.totalTickets > 0 && !isSubmitting ? 'active' : 'disabled'}`}
              >
                {isSubmitting && (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                )}
                {isSubmitting
                  ? "PROCESSING..."
                  : summary.totalTickets > 0
                    ? `PAY ₹${summary.totalAmount}`
                    : "SELECT TICKETS"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* CSS Styles */}
      <style jsx global>{`
        .booking-page {
          min-height: 100vh;
          background: linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%);
          font-family: ${fonts.body};
          color: ${colors.textPrimary};
          position: relative;
        }

        .background-glow {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(ellipse at 20% 0%, rgba(255, 7, 58, 0.08) 0%, transparent 50%),
                      radial-gradient(ellipse at 80% 100%, rgba(0, 240, 255, 0.06) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
        }

        /* Loading and Error States */
        .error-container, .loading-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-family: ${fonts.body};
        }

        .error-container {
          color: ${colors.red};
        }

        .error-title {
          font-family: ${fonts.heading};
          font-size: 24px;
          margin-bottom: 16px;
        }

        .loading-container {
          color: ${colors.cyan};
        }

        .loading-text {
          margin-top: 12px;
          font-size: 14px;
          color: ${colors.textSecondary};
        }

        /* Main Container */
        .booking-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px 16px 160px;
          position: relative;
          z-index: 1;
        }

        /* Header */
        .booking-header {
          margin-bottom: 32px;
        }

        .header-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: ${colors.textSecondary};
          font-size: 14px;
          cursor: pointer;
          padding: 8px 0;
          font-weight: 500;
        }

        .social-links {
          display: flex;
          gap: 8px;
        }

        .social-button {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .social-button.maps {
          background: linear-gradient(135deg, rgba(66, 133, 244, 0.15) 0%, rgba(66, 133, 244, 0.05) 100%);
          border: 1px solid rgba(66, 133, 244, 0.3);
          color: #4285f4;
        }

        .social-button.instagram {
          background: linear-gradient(135deg, rgba(225, 48, 108, 0.15) 0%, rgba(193, 53, 132, 0.05) 100%);
          border: 1px solid rgba(225, 48, 108, 0.3);
          color: #e1306c;
        }

        .cafe-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .cafe-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cafe-name {
          font-family: ${fonts.heading};
          font-size: 24px;
          font-weight: 800;
          background: linear-gradient(135deg, ${colors.textPrimary} 0%, ${colors.cyan} 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 4px 0;
        }

        .cafe-tag {
          font-size: 12px;
          color: ${colors.textMuted};
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .booking-title {
          font-family: ${fonts.heading};
          font-size: 20px;
          font-weight: 700;
          color: ${colors.textPrimary};
          margin: 0 0 24px 0;
        }

        .step-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 32px;
        }

        .step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid ${colors.border};
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          color: ${colors.textMuted};
          transition: all 0.3s ease;
        }

        .step-circle.active {
          background: linear-gradient(135deg, ${colors.red} 0%, ${colors.cyan} 100%);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 12px rgba(255, 7, 58, 0.3);
        }

        .step-label {
          font-size: 12px;
          color: ${colors.textMuted};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 500;
        }

        .step-label.active {
          color: ${colors.textPrimary};
          font-weight: 600;
        }

        .step-connector {
          width: 40px;
          height: 2px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0 4px;
        }

        /* Section Styles */
        .section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .section-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: ${colors.textPrimary};
          margin: 0;
        }

        /* Date Section */
        .date-section {
          margin-bottom: 32px;
        }

        .date-grid {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
        }

        .date-grid::-webkit-scrollbar {
          display: none;
        }

        .date-button {
          flex-shrink: 0;
          width: 80px;
          padding: 16px 8px;
          border-radius: 16px;
          border: 1.5px solid ${colors.border};
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
        }

        .date-button.active {
          border: 2px solid ${colors.red};
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.15) 0%, rgba(255, 7, 58, 0.05) 100%);
          box-shadow: 0 8px 24px rgba(255, 7, 58, 0.2);
          transform: translateY(-2px);
        }

        .day-name {
          font-size: 10px;
          color: ${colors.textMuted};
          margin-bottom: 8px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .day-name.today {
          color: ${colors.cyan};
        }

        .day-number {
          font-family: ${fonts.heading};
          font-size: 24px;
          font-weight: 800;
          color: ${colors.textPrimary};
          line-height: 1;
          margin-bottom: 4px;
        }

        .month {
          font-size: 10px;
          color: ${colors.textMuted};
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        /* Time Section */
        .time-section {
          margin-bottom: 32px;
        }

        .time-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .time-button {
          padding: 14px 8px;
          border-radius: 12px;
          border: 1.5px solid ${colors.border};
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .time-button.active {
          border: 2px solid ${colors.cyan};
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.05) 100%);
          box-shadow: 0 8px 24px rgba(0, 240, 255, 0.2);
          transform: translateY(-2px);
        }

        .time-label {
          font-size: 14px;
          font-weight: 700;
          color: ${colors.textPrimary};
        }

        .peak-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          background: rgba(245, 158, 11, 0.15);
          border-radius: 6px;
          font-size: 10px;
          color: #f59e0b;
          font-weight: 600;
        }

        .no-slots {
          padding: 48px 20px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 20px;
          border: 1.5px solid ${colors.border};
          text-align: center;
        }

        .no-slots h4 {
          font-size: 16px;
          color: ${colors.textSecondary};
          margin-bottom: 8px;
        }

        .no-slots p {
          font-size: 14px;
          color: ${colors.textMuted};
        }

        .peak-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(245, 158, 11, 0.1);
          border-radius: 10px;
          border: 1px solid rgba(245, 158, 11, 0.2);
          margin-top: 16px;
        }

        .peak-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
        }

        /* Step 2 Styles */
        .booking-summary-card {
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(255, 7, 58, 0.1) 100%);
          border-radius: 20px;
          border: 2px solid rgba(0, 240, 255, 0.3);
          padding: 20px;
          margin-bottom: 24px;
          position: relative;
          overflow: hidden;
        }

        .summary-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .summary-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(0, 240, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${colors.cyan};
        }

        .summary-details {
          flex: 1;
          margin: 0 16px;
        }

        .summary-details h3 {
          font-size: 16px;
          color: ${colors.textSecondary};
          margin-bottom: 6px;
        }

        .summary-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .summary-date {
          font-size: 18px;
          font-weight: 700;
          color: ${colors.textPrimary};
          font-family: ${fonts.heading};
        }

        .summary-time {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 15px;
          color: ${colors.cyan};
          font-weight: 600;
        }

        .change-button {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid ${colors.border};
          border-radius: 10px;
          color: ${colors.textPrimary};
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .change-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .duration-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: rgba(0, 240, 255, 0.2);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
          color: ${colors.cyan};
        }

        /* Duration Selector */
        .duration-section {
          margin-bottom: 28px;
        }

        .duration-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .duration-card {
          padding: 20px 12px;
          border-radius: 16px;
          border: 2px solid ${colors.border};
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .duration-card.active {
          border: 2px solid ${colors.cyan};
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 240, 255, 0.05) 100%);
          box-shadow: 0 8px 24px rgba(0, 240, 255, 0.2);
          transform: translateY(-2px);
        }

        .duration-card.premium.active {
          border: 2px solid ${colors.red};
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.15) 0%, rgba(255, 7, 58, 0.05) 100%);
          box-shadow: 0 8px 24px rgba(255, 7, 58, 0.2);
        }

        .duration-number {
          font-family: ${fonts.heading};
          font-size: 32px;
          font-weight: 800;
          color: ${colors.textPrimary};
          line-height: 1;
          margin-bottom: 4px;
        }

        .duration-label {
          font-size: 11px;
          color: ${colors.textMuted};
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
        }

        .duration-price {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-family: ${fonts.heading};
          font-size: 18px;
          font-weight: 700;
          color: ${colors.cyan};
        }

        .duration-card.premium.active .duration-price {
          color: ${colors.red};
        }

        .premium-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 4px 8px;
          background: ${colors.red};
          border-radius: 6px;
          font-size: 10px;
          color: white;
          font-weight: 700;
          text-transform: uppercase;
        }

        /* Live Availability Banner */
        .live-availability-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%);
          border-radius: 16px;
          border: 1.5px solid rgba(34, 197, 94, 0.2);
          margin-bottom: 24px;
        }

        .live-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: ${colors.green};
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .live-badge span {
          font-size: 12px;
          font-weight: 700;
          color: ${colors.green};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .live-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .live-text {
          font-size: 12px;
          color: ${colors.textMuted};
        }

        .refresh-btn {
          padding: 6px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid ${colors.border};
          border-radius: 8px;
          color: ${colors.textSecondary};
          cursor: pointer;
        }

        /* Console Selection */
        .console-section {
          margin-bottom: 28px;
        }

        .console-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: none;
        }

        .console-scroll::-webkit-scrollbar {
          display: none;
        }

        .console-button {
          flex-shrink: 0;
          width: 120px;
          padding: 16px 12px;
          border-radius: 16px;
          border: 2px solid ${colors.border};
          background: rgba(255, 255, 255, 0.03);
          cursor: pointer;
          text-align: center;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .console-button.active {
          border: 2px solid ${colors.cyan};
          background: linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%);
          box-shadow: 0 8px 24px rgba(0, 240, 255, 0.2);
          transform: translateY(-2px);
        }

        .console-button.sold-out {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .console-icon-wrapper {
          position: relative;
        }

        .console-icon {
          font-size: 24px;
          margin-bottom: 4px;
        }

        .console-icon.disabled {
          filter: grayscale(1);
        }

        .selection-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: white;
          font-weight: 700;
        }

        .console-name {
          font-size: 14px;
          font-weight: 700;
          color: ${colors.textPrimary};
          line-height: 1.2;
        }

        .console-price {
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: ${fonts.heading};
          font-size: 16px;
          font-weight: 700;
          color: ${colors.cyan};
        }

        .availability-status {
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .availability-status.available {
          background: rgba(34, 197, 94, 0.15);
          color: ${colors.green};
        }

        .availability-status.low-stock {
          background: rgba(245, 158, 11, 0.15);
          color: ${colors.orange};
        }

        .availability-status.sold-out {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        .status-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: currentColor;
          margin-right: 6px;
        }

        /* Tickets Section */
        .section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex: 1;
        }

        .availability-counter {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          background: rgba(34, 197, 94, 0.15);
          color: ${colors.green};
        }

        .availability-counter.low {
          background: rgba(245, 158, 11, 0.15);
          color: ${colors.orange};
        }

        .sold-out-message {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 16px;
          border: 1.5px solid rgba(239, 68, 68, 0.2);
        }

        .sold-out-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: rgba(239, 68, 68, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ef4444;
        }

        .sold-out-content h4 {
          font-size: 16px;
          color: #ef4444;
          margin-bottom: 4px;
        }

        .sold-out-content p {
          font-size: 14px;
          color: ${colors.textSecondary};
          margin-bottom: 8px;
        }

        .next-available {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: ${colors.cyan};
          font-weight: 600;
        }

        .tickets-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ticket-card {
          padding: 20px;
          border-radius: 16px;
          border: 2px solid ${colors.border};
          background: rgba(255, 255, 255, 0.03);
          transition: all 0.3s ease;
        }

        .ticket-card.selected {
          border: 2px solid ${colors.red};
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.1) 0%, rgba(255, 7, 58, 0.05) 100%);
          box-shadow: 0 8px 24px rgba(255, 7, 58, 0.2);
        }

        .ticket-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .ticket-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(0, 240, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          color: ${colors.cyan};
        }

        .ticket-badge {
          padding: 6px 12px;
          background: rgba(0, 240, 255, 0.15);
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
          color: ${colors.cyan};
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .ticket-body {
          margin-bottom: 16px;
        }

        .ticket-title {
          font-size: 16px;
          font-weight: 700;
          color: ${colors.textPrimary};
          margin-bottom: 8px;
        }

        .ticket-desc {
          font-size: 14px;
          color: ${colors.textSecondary};
          line-height: 1.4;
        }

        .ticket-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .ticket-price {
          display: flex;
          flex-direction: column;
        }

        .price-amount {
          font-family: ${fonts.heading};
          font-size: 24px;
          font-weight: 800;
          color: ${colors.cyan};
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .price-unit {
          font-size: 12px;
          color: ${colors.textMuted};
        }

        .add-button {
          padding: 12px 24px;
          border: none;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .add-button.active {
          background: linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%);
          color: white;
        }

        .add-button.disabled {
          background: rgba(255, 255, 255, 0.05);
          color: ${colors.textMuted};
          cursor: not-allowed;
        }

        .quantity-controls {
          display: flex;
          align-items: center;
          gap: 0;
          background: ${colors.red};
          border-radius: 12px;
          overflow: hidden;
        }

        .qty-btn {
          width: 40px;
          height: 40px;
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .qty-btn.disabled {
          color: rgba(255, 255, 255, 0.4);
          cursor: not-allowed;
        }

        .qty-display {
          width: 36px;
          text-align: center;
          font-family: ${fonts.heading};
          font-size: 16px;
          font-weight: 700;
          color: white;
        }

        /* Bottom Action Bar */
        .action-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(10, 10, 16, 0.95);
          backdrop-filter: blur(20px);
          border-top: 1px solid ${colors.border};
          padding: 20px 16px;
          z-index: 100;
        }

        .action-container {
          max-width: 600px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
        }

        .selection-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .date-info, .time-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: ${colors.textSecondary};
        }

        .time-info.selected {
          color: ${colors.cyan};
        }

        .booking-summary {
          flex: 1;
        }

        .summary-tickets {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 700;
          color: ${colors.textPrimary};
          margin-bottom: 4px;
        }

        .summary-details {
          font-size: 13px;
          color: ${colors.textSecondary};
        }

        .no-tickets {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: ${colors.textMuted};
        }

        .continue-btn, .confirm-btn {
          padding: 16px 28px;
          border: none;
          border-radius: 14px;
          font-family: ${fonts.heading};
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 180px;
          justify-content: center;
        }

        .continue-btn.active {
          background: linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(255, 7, 58, 0.3);
        }

        .continue-btn.disabled, .confirm-btn.disabled {
          background: rgba(255, 255, 255, 0.05);
          color: ${colors.textMuted};
          cursor: not-allowed;
        }

        .confirm-btn.active {
          background: linear-gradient(135deg, ${colors.green} 0%, #16a34a 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
        }

        /* Mobile Responsive */
        @media (max-width: 480px) {
          .booking-container {
            padding: 16px 12px 140px;
          }

          .cafe-name {
            font-size: 20px;
          }

          .booking-title {
            font-size: 18px;
          }

          .date-button {
            width: 70px;
            padding: 12px 6px;
          }

          .time-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .duration-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .duration-card {
            padding: 16px 8px;
          }

          .duration-number {
            font-size: 28px;
          }

          .console-button {
            width: 100px;
            padding: 12px 8px;
          }

          .action-container {
            gap: 12px;
          }

          .continue-btn, .confirm-btn {
            padding: 14px 20px;
            font-size: 12px;
            min-width: 150px;
          }
        }

        @media (min-width: 640px) {
          .booking-container {
            padding: 24px 20px 160px;
          }

          .booking-title {
            font-size: 22px;
          }

          .time-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .date-button {
            width: 84px;
            padding: 16px 10px;
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
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
    .eq("cafe_id", cafeRow.id)
    .eq("booking_date", bookingDate)
    .neq("status", "cancelled");

  if (bookingsError) {
    console.error("Capacity check: error loading bookings", bookingsError);
    return { ok: false, message: "Could not check availability. Please try again." };
  }

  const alreadyBooked: Partial<Record<ConsoleId, number>> = {};

  (bookings ?? []).forEach((booking: any) => {
    const bookingStartMinutes = timeStringToMinutes(booking.start_time || "");

    if (doTimeSlotsOverlap(selectedTimeMinutes, bookingStartMinutes, durationMinutes)) {
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