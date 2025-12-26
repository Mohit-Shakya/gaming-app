// src/app/cafes/[id]/book/page.tsx
"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import {
  colors,
  fonts,
  CONSOLE_LABELS,
  CONSOLE_COLORS,
  CONSOLE_ICONS,
  CONSOLE_DB_KEYS,
  type ConsoleId
} from "@/lib/constants";

// Types
import { SelectedTicketForCheck } from "@/types/booking";

// Utilities
import { buildNext7Days, buildTimeSlots, getEndTime, timeStringToMinutes } from "@/lib/timeSlotUtils";
import { generateTickets } from "@/lib/ticketService";
import { checkBookingCapacityWithOverlap } from "@/lib/capacityValidator";
import { logger } from "@/lib/logger";

// Hooks
import { useCafeData, type ConsoleOption } from "@/hooks/useCafeData";
import { useLiveAvailability } from "@/hooks/useLiveAvailability";

// Components
import {
  BookingHeader,
  DatePicker,
  TimeSlotGrid,
  DurationSelector,
  BookingSummaryCard,
  AvailabilityBanner,
  SoldOutMessage,
  ConsoleGrid,
  TicketCard,
  BookingBottomBar,
  type ConsoleCardData,
} from "@/components/booking";

// Constants
const DAY_OPTIONS = buildNext7Days();
const ALL_TIME_SLOTS = buildTimeSlots();

const CONSOLES: ConsoleCardData[] = [
  { id: "ps5", label: CONSOLE_LABELS.ps5, icon: CONSOLE_ICONS.ps5, color: CONSOLE_COLORS.ps5 },
  { id: "ps4", label: CONSOLE_LABELS.ps4, icon: CONSOLE_ICONS.ps4, color: CONSOLE_COLORS.ps4 },
  { id: "xbox", label: CONSOLE_LABELS.xbox, icon: CONSOLE_ICONS.xbox, color: CONSOLE_COLORS.xbox },
  { id: "pc", label: CONSOLE_LABELS.pc, icon: CONSOLE_ICONS.pc, color: CONSOLE_COLORS.pc },
  { id: "pool", label: CONSOLE_LABELS.pool, icon: CONSOLE_ICONS.pool, color: CONSOLE_COLORS.pool },
  { id: "arcade", label: CONSOLE_LABELS.arcade, icon: CONSOLE_ICONS.arcade, color: CONSOLE_COLORS.arcade },
  { id: "snooker", label: CONSOLE_LABELS.snooker, icon: CONSOLE_ICONS.snooker, color: CONSOLE_COLORS.snooker },
  { id: "vr", label: CONSOLE_LABELS.vr, icon: CONSOLE_ICONS.vr, color: CONSOLE_COLORS.vr },
  { id: "steering", label: CONSOLE_LABELS.steering, icon: CONSOLE_ICONS.steering, color: CONSOLE_COLORS.steering },
];

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading } = useUser();

  const rawId = params?.id;
  const cafeId = typeof rawId === "string" && rawId !== "undefined" ? rawId : null;

  // ===== STATE =====
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDate, setSelectedDate] = useState<string>(DAY_OPTIONS[0]?.key ?? "");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId>("ps5");
  const [selectedDuration, setSelectedDuration] = useState<30 | 60 | 90>(60);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== LOAD CAFE DATA =====
  const cafeData = useCafeData(cafeId);
  const {
    actualCafeId,
    cafeName,
    cafePrice,
    googleMapsUrl,
    instagramUrl,
    consoleLimits,
    availableConsoles,
    consolePricing,
    loading: cafeLoading,
    error: cafeError,
  } = cafeData;

  // Set first available console when data loads
  useEffect(() => {
    if (availableConsoles.length > 0 && !availableConsoles.includes(selectedConsole)) {
      setSelectedConsole(availableConsoles[0]);
    }
  }, [availableConsoles, selectedConsole]);

  // ===== LIVE AVAILABILITY =====
  const [availabilityState, availabilityActions] = useLiveAvailability({
    cafeId: actualCafeId,
    selectedDate,
    selectedTime,
    selectedDuration,
    availableConsoles,
    consoleLimits,
    enabled: step === 2,
  });

  const { availability: liveAvailability, loading: loadingAvailability, lastUpdated } = availabilityState;

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

  // Clear time selection if it becomes unavailable
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
    const used: Partial<Record<ConsoleId, number>> = {};
    Object.entries(quantities).forEach(([ticketId, qty]) => {
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket && qty > 0) {
        used[ticket.console] = (used[ticket.console] ?? 0) + qty;
      }
    });
    return used;
  }, [quantities, tickets]);

  const summary = useMemo(() => {
    let totalTickets = 0;
    let totalAmount = 0;

    Object.entries(quantities).forEach(([ticketId, qty]) => {
      if (qty <= 0) return;
      const ticket = tickets.find((t) => t.id === ticketId);
      if (ticket) {
        totalTickets += qty;
        totalAmount += qty * ticket.price;
      }
    });

    return { totalTickets, totalAmount };
  }, [quantities, tickets]);

  const dateLabel = useMemo(() => {
    const day = DAY_OPTIONS.find((d) => d.key === selectedDate);
    if (!day) return "";
    if (day.isToday) return "Today";
    return `${day.dayName}, ${day.dayNum} ${day.month}`;
  }, [selectedDate]);

  // Calculate remaining availability for selected console
  const usedForSelected = usedPerConsole[selectedConsole] ?? 0;
  const availForSelected = liveAvailability[selectedConsole];
  const totalForSelected = availForSelected?.total ?? consoleLimits[selectedConsole] ?? 0;
  const availableForSelected = availForSelected?.available ?? totalForSelected;
  const remainingForSelected = Math.max(0, availableForSelected - usedForSelected);
  const atLimit = availableForSelected <= 0;

  // ===== HANDLERS =====
  const getQty = (ticketId: string) => quantities[ticketId] ?? 0;

  const setQty = (ticketId: string, qty: number) => {
    setQuantities((prev) => ({
      ...prev,
      [ticketId]: Math.max(0, qty),
    }));
  };

  const handleContinueToTickets = () => {
    if (!selectedDate || !selectedTime) return;
    setStep(2);
  };

  const handleBackToDateTime = () => {
    setStep(1);
  };

  const handleChangeDuration = (duration: 30 | 60 | 90) => {
    setSelectedDuration(duration);
    setQuantities({}); // Reset quantities when duration changes
  };

  async function handleConfirmBooking() {
    if (summary.totalTickets === 0 || !cafeId) return;

    setIsSubmitting(true);

    // Check if user auth is still loading
    if (userLoading) {
      return;
    }

    if (!user) {
      // Save current page and redirect to login
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname + window.location.search);
      router.push("/login");
      return;
    }

    // Check if onboarding is complete
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
      logger.error("Error checking profile:", err);
      setIsSubmitting(false);
      return;
    }

    try {
      const selectedTickets = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketId, qty]) => {
          const ticket = tickets.find((t) => t.id === ticketId);
          return {
            ticketId,
            console: ticket?.console || (ticketId.split("_")[0] as ConsoleId),
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
        cafeId: actualCafeId || cafeId,
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
        await availabilityActions.refresh();
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
      logger.error("Failed to prepare checkout:", err);
      alert("Could not prepare checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ===== AUTH CHECK =====
  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login");
    }
  }, [user, userLoading, router]);

  // ===== LOADING & ERROR STATES =====
  if (userLoading || cafeLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.dark,
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: `4px solid ${colors.border}`,
            borderTopColor: colors.cyan,
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (cafeError || !cafeId) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: colors.dark,
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", color: colors.textPrimary }}>
            {cafeError || "Café not found"}
          </p>
          <button
            onClick={() => router.push("/cafes")}
            style={{
              marginTop: "20px",
              padding: "10px 20px",
              background: colors.red,
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
            }}
          >
            Back to Cafés
          </button>
        </div>
      </div>
    );
  }

  // ===== RENDER =====
  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.dark,
        color: colors.textPrimary,
        fontFamily: fonts.body,
      }}
    >
      {/* Gradient overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "300px",
          background: "radial-gradient(ellipse at top, rgba(0, 240, 255, 0.15) 0%, transparent 70%)",
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
        <BookingHeader
          cafeName={cafeName}
          googleMapsUrl={googleMapsUrl}
          instagramUrl={instagramUrl}
          onBack={step === 2 ? handleBackToDateTime : () => router.back()}
          backLabel={step === 2 ? "Change Date & Time" : "Back"}
        />

        {/* STEP 1: Date & Time Selection */}
        {step === 1 && (
          <>
            <DatePicker
              dates={DAY_OPTIONS}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />

            <div style={{ marginTop: "24px" }}>
              <TimeSlotGrid
                slots={filteredTimeSlots}
                selectedTime={selectedTime}
                onSelect={setSelectedTime}
              />
            </div>
          </>
        )}

        {/* STEP 2: Console & Ticket Selection */}
        {step === 2 && (
          <>
            {/* Booking Summary */}
            <BookingSummaryCard
              dateLabel={dateLabel}
              selectedTime={selectedTime}
              endTime={getEndTime(selectedTime, selectedDuration)}
              duration={selectedDuration}
              onChangeDateTime={handleBackToDateTime}
            />

            {/* Duration Selector */}
            <DurationSelector
              selectedDuration={selectedDuration}
              onSelect={handleChangeDuration}
            />

            {/* Live Availability Banner */}
            <AvailabilityBanner
              isLoading={loadingAvailability}
              lastUpdated={lastUpdated}
              onRefresh={availabilityActions.refresh}
            />

            {/* Console Selection */}
            <ConsoleGrid
              consoles={CONSOLES}
              availableConsoleIds={availableConsoles}
              selectedConsole={selectedConsole}
              liveAvailability={liveAvailability}
              consoleLimits={consoleLimits}
              consolePricing={consolePricing}
              selectedDuration={selectedDuration}
              fallbackPrice={cafePrice}
              usedPerConsole={usedPerConsole}
              onSelectConsole={setSelectedConsole}
            />

            {/* Ticket Selection */}
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
                >
                  🎟️ Select Tickets
                </h2>

                {!atLimit && remainingForSelected > 0 && (
                  <span
                    style={{
                      fontSize: "12px",
                      color: remainingForSelected <= 2 ? colors.orange : colors.green,
                      fontWeight: 500,
                    }}
                  >
                    {remainingForSelected} slot{remainingForSelected > 1 ? "s" : ""} available
                  </span>
                )}
              </div>

              {atLimit && usedForSelected === 0 ? (
                <SoldOutMessage
                  consoleName={CONSOLE_LABELS[selectedConsole]}
                  selectedTime={selectedTime}
                  endTime={getEndTime(selectedTime, selectedDuration)}
                  nextAvailableAt={liveAvailability[selectedConsole]?.nextAvailableAt}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {tickets.map((ticket) => {
                    const qty = getQty(ticket.id);
                    const canAdd = remainingForSelected > 0;

                    return (
                      <TicketCard
                        key={ticket.id}
                        ticket={ticket}
                        quantity={qty}
                        canAdd={canAdd}
                        onAdd={() => canAdd && setQty(ticket.id, 1)}
                        onIncrement={() => canAdd && setQty(ticket.id, qty + 1)}
                        onDecrement={() => setQty(ticket.id, qty - 1)}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Bottom Bar */}
      <BookingBottomBar
        step={step}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        dateLabel={dateLabel}
        onContinue={handleContinueToTickets}
        totalTickets={summary.totalTickets}
        totalAmount={summary.totalAmount}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmBooking}
      />

      {/* Animations */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .console-card:hover {
          transform: scale(1.05) !important;
        }

        .add-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 7, 58, 0.4);
        }

        .date-button:hover {
          transform: scale(1.05);
        }

        .time-button:hover {
          transform: scale(1.02);
        }

        .duration-button:hover {
          transform: translateY(-2px) !important;
        }
      `}</style>
    </div>
  );
}
