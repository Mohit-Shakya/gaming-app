// src/app/cafes/[id]/book/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";

// ============ TYPES ============
type ConsoleId = "ps5" | "ps4" | "xbox" | "pc" | "pool" | "arcade" | "snooker" | "vr" | "steering";

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

// ============ CONSTANTS ============
const OPEN_HOUR = 10;
const CLOSE_HOUR = 24; // Midnight
const PEAK_START = 18;
const PEAK_END = 22;
const TIME_INTERVAL = 15; // 15-minute intervals

const CONSOLES: ConsoleOption[] = [
  { id: "ps5", label: "PS5", icon: "🎮", color: "#0070d1", dbKey: "ps5_count" },
  { id: "ps4", label: "PS4", icon: "🎮", color: "#003791", dbKey: "ps4_count" },
  { id: "xbox", label: "Xbox", icon: "🎮", color: "#107c10", dbKey: "xbox_count" },
  { id: "pc", label: "PC", icon: "💻", color: "#ff073a", dbKey: "pc_count" },
  { id: "pool", label: "Pool", icon: "🎱", color: "#8b4513", dbKey: "pool_count" },
  { id: "arcade", label: "Arcade", icon: "🕹️", color: "#ff6b00", dbKey: "arcade_count" },
  { id: "snooker", label: "Snooker", icon: "🎱", color: "#228b22", dbKey: "snooker_count" },
  { id: "vr", label: "VR", icon: "🥽", color: "#9945ff", dbKey: "vr_count" },
  { id: "steering", label: "Racing", icon: "🏎️", color: "#e10600", dbKey: "steering_wheel_count" },
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

function generateTickets(consoleId: ConsoleId, basePrice: number): TicketOption[] {
  const consoleName = CONSOLES.find(c => c.id === consoleId)?.label || consoleId;
  const tickets: TicketOption[] = [];
  
  // Different max players based on console type
  const maxPlayers = ["pool", "snooker"].includes(consoleId) ? 2 : 
                     ["pc", "vr", "steering"].includes(consoleId) ? 1 : 4;
  
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

const DAY_OPTIONS = buildNext7Days();
const ALL_TIME_SLOTS = buildTimeSlots();

// ============ STYLES ============
const colors = {
  red: "#ff073a",
  cyan: "#00f0ff",
  dark: "#08080c",
  darkCard: "#0f0f14",
  border: "rgba(255, 255, 255, 0.08)",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  green: "#22c55e",
};

const fonts = {
  heading: "'Orbitron', sans-serif",
  body: "'Rajdhani', sans-serif",
};

// ============ COMPONENT ============
export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading } = useUser();

  const rawId = params?.id;
  const cafeId = typeof rawId === "string" && rawId !== "undefined" ? rawId : null;

  // ===== STATE =====
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Date/Time, Step 2: Tickets
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

  // ===== LOAD CAFE DATA =====
  useEffect(() => {
    async function loadCafeData() {
      if (!cafeId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("cafes")
          .select("name, hourly_price, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count")
          .eq("id", cafeId)
          .maybeSingle();

        if (error || !data) {
          console.error("Error loading cafe:", error);
          return;
        }

        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);

        // Build limits and available consoles
        const limits: Partial<Record<ConsoleId, number>> = {};
        const available: ConsoleId[] = [];

        CONSOLES.forEach(c => {
          const count = (data as any)[c.dbKey];
          if (count && count > 0) {
            limits[c.id] = count;
            available.push(c.id);
          }
        });

        setConsoleLimits(limits);
        setAvailableConsoles(available);
        
        // Set default console to first available
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
  }, [cafeId]);

  // ===== DERIVED STATE =====
  // Filter time slots - remove past times if selected date is today
  const filteredTimeSlots = useMemo(() => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);
    
    // If selected date is not today, show all slots
    if (selectedDate !== todayKey) {
      return ALL_TIME_SLOTS;
    }
    
    // For today, filter out past time slots
    const currentHour = today.getHours();
    const currentMinutes = today.getMinutes();
    
    return ALL_TIME_SLOTS.filter(slot => {
      // If slot hour is greater than current hour, show it
      if (slot.hour > currentHour) return true;
      // If same hour, check minutes (add small buffer of 5 mins)
      if (slot.hour === currentHour && slot.minutes > currentMinutes + 5) return true;
      return false;
    });
  }, [selectedDate]);

  // Clear selected time if it's no longer available
  useEffect(() => {
    if (selectedTime && filteredTimeSlots.length > 0) {
      const isStillAvailable = filteredTimeSlots.some(slot => slot.label === selectedTime);
      if (!isStillAvailable) {
        setSelectedTime("");
      }
    }
  }, [filteredTimeSlots, selectedTime]);

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
      const players = parseInt(ticketId.split("_")[1]);
      const consoleTickets = generateTickets(consoleId, cafePrice);
      const ticket = consoleTickets.find(t => t.id === ticketId);
      if (ticket) {
        totalTickets += qty;
        totalAmount += qty * ticket.price;
      }
    });

    return { totalTickets, totalAmount };
  }, [quantities, cafePrice]);

  const maxForSelected = consoleLimits[selectedConsole] ?? Infinity;
  const usedForSelected = usedPerConsole[selectedConsole] ?? 0;
  const atLimit = Number.isFinite(maxForSelected) && usedForSelected >= maxForSelected;

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
    
    setQuantities(prev => {
      const next = { ...prev };
      
      if (value <= 0) {
        delete next[ticketId];
      } else {
        next[ticketId] = value;
      }

      // Check limit
      const limit = consoleLimits[consoleId];
      if (limit !== undefined) {
        let used = 0;
        Object.entries(next).forEach(([id, qty]) => {
          if (id.startsWith(consoleId + "_")) {
            used += qty;
          }
        });

        if (used > limit) {
          const overflow = used - limit;
          const newQty = (next[ticketId] ?? 0) - overflow;
          if (newQty <= 0) {
            delete next[ticketId];
          } else {
            next[ticketId] = newQty;
          }
        }
      }

      return next;
    });
  }

  function handleContinueToTickets() {
    if (!selectedDate || !selectedTime) return;
    setStep(2);
  }

  function handleBackToDateTime() {
    setStep(1);
  }

  async function handleConfirmBooking() {
    if (summary.totalTickets === 0 || !cafeId) return;
    
    // Check login
    if (!user && !userLoading) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      router.push("/login");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedTickets = Object.entries(quantities)
        .filter(([_, qty]) => qty > 0)
        .map(([ticketId, qty]) => {
          const consoleId = ticketId.split("_")[0] as ConsoleId;
          const consoleTickets = generateTickets(consoleId, cafePrice);
          const ticket = consoleTickets.find(t => t.id === ticketId);
          return {
            ticketId,
            console: consoleId,
            title: ticket?.title || ticketId,
            price: ticket?.price || 0,
            quantity: qty,
          };
        });

      const payload = {
        cafeId,
        cafeName,
        bookingDate: selectedDate,
        timeSlot: selectedTime,
        tickets: selectedTickets,
        totalAmount: summary.totalAmount,
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
      <div style={{ 
        minHeight: "100vh", 
        background: colors.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.body,
        color: colors.red,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        Missing café ID
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
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      
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
        padding: "20px 16px 140px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header */}
        <header style={{ marginBottom: "24px" }}>
          {/* Back button */}
          <button
            onClick={() => step === 2 ? handleBackToDateTime() : router.back()}
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

          {/* Cafe name */}
          <p style={{
            fontSize: "12px",
            color: colors.cyan,
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: "4px",
          }}>
            {cafeName}
          </p>

          {/* Title */}
          <h1 style={{
            fontFamily: fonts.heading,
            fontSize: "22px",
            fontWeight: 700,
            color: colors.textPrimary,
            margin: 0,
          }}>
            {step === 1 ? "Select Date & Time" : "Choose Your Setup"}
          </h1>

          {/* Progress indicator */}
          <div style={{
            display: "flex",
            gap: "8px",
            marginTop: "16px",
          }}>
            <div style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: colors.red,
            }} />
            <div style={{
              flex: 1,
              height: "3px",
              borderRadius: "2px",
              background: step === 2 ? colors.red : "rgba(255, 255, 255, 0.1)",
              transition: "background 0.3s ease",
            }} />
          </div>
        </header>

        {/* ========== STEP 1: DATE & TIME ========== */}
        {step === 1 && (
          <>
            {/* Date Selection */}
            <section style={{ marginBottom: "28px" }}>
              <h2 style={{
                fontSize: "14px",
                fontWeight: 600,
                color: colors.textSecondary,
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                📅 Select Date
              </h2>
              
              <div style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "8px",
                scrollbarWidth: "none",
              }}>
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
                      <div style={{
                        fontSize: "11px",
                        color: day.isToday ? colors.cyan : colors.textMuted,
                        marginBottom: "4px",
                        fontWeight: 500,
                      }}>
                        {day.isToday ? "TODAY" : day.dayName}
                      </div>
                      <div style={{
                        fontFamily: fonts.heading,
                        fontSize: "20px",
                        fontWeight: 700,
                        color: isActive ? colors.red : colors.textPrimary,
                      }}>
                        {day.dayNum}
                      </div>
                      <div style={{
                        fontSize: "11px",
                        color: colors.textMuted,
                        marginTop: "2px",
                      }}>
                        {day.month}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Time Selection */}
            <section>
              <h2 style={{
                fontSize: "14px",
                fontWeight: 600,
                color: colors.textSecondary,
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                ⏰ Select Time
              </h2>

              {filteredTimeSlots.length === 0 ? (
                <div style={{
                  padding: "32px 20px",
                  background: colors.darkCard,
                  borderRadius: "12px",
                  border: `1px solid ${colors.border}`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "32px", marginBottom: "12px" }}>😔</div>
                  <p style={{
                    fontSize: "14px",
                    color: colors.textSecondary,
                    marginBottom: "8px",
                  }}>
                    No slots available for today
                  </p>
                  <p style={{
                    fontSize: "12px",
                    color: colors.textMuted,
                  }}>
                    Please select another date
                  </p>
                </div>
              ) : (
                <>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: "8px",
                  }}>
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
                          <div style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: isActive ? colors.red : colors.textPrimary,
                          }}>
                            {slot.label}
                          </div>
                          {slot.isPeak && (
                            <div style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "#f59e0b",
                            }} />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <p style={{
                    fontSize: "12px",
                    color: colors.textMuted,
                    marginTop: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}>
                    <span style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "#f59e0b",
                      display: "inline-block",
                    }} />
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
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 16px",
              background: colors.darkCard,
              borderRadius: "12px",
              border: `1px solid ${colors.border}`,
              marginBottom: "24px",
            }}>
              <div>
                <div style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}>
                  {dateLabel}
                </div>
                <div style={{
                  fontSize: "13px",
                  color: colors.cyan,
                  marginTop: "2px",
                }}>
                  {selectedTime}
                </div>
              </div>
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
            </div>

            {/* Console Selection */}
            <section style={{ marginBottom: "24px" }}>
              <h2 style={{
                fontSize: "14px",
                fontWeight: 600,
                color: colors.textSecondary,
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                🎮 Select Console
              </h2>

              <div style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
              }}>
                {availableConsoles.map((consoleId) => {
                  const console = CONSOLES.find(c => c.id === consoleId);
                  if (!console) return null;
                  
                  const isActive = consoleId === selectedConsole;
                  const count = consoleLimits[consoleId] || 0;
                  
                  return (
                    <button
                      key={consoleId}
                      onClick={() => setSelectedConsole(consoleId)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 16px",
                        borderRadius: "20px",
                        border: isActive 
                          ? `2px solid ${console.color}` 
                          : `1px solid ${colors.border}`,
                        background: isActive 
                          ? `linear-gradient(135deg, ${console.color}30 0%, ${console.color}15 100%)`
                          : colors.darkCard,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: isActive ? `0 0 15px ${console.color}40` : "none",
                      }}
                    >
                      <span style={{ fontSize: "18px" }}>{console.icon}</span>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: isActive ? console.color : colors.textPrimary,
                      }}>
                        {console.label}
                      </span>
                      <span style={{
                        fontSize: "10px",
                        padding: "2px 6px",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "10px",
                        color: colors.textMuted,
                      }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {Number.isFinite(maxForSelected) && (
                <p style={{
                  fontSize: "12px",
                  color: atLimit ? "#f59e0b" : colors.textMuted,
                  marginTop: "10px",
                }}>
                  {atLimit 
                    ? `⚠️ Maximum ${maxForSelected} setups reached for this time slot`
                    : `${maxForSelected - usedForSelected} of ${maxForSelected} setups available`
                  }
                </p>
              )}
            </section>

            {/* Ticket Cards */}
            <section>
              <h2 style={{
                fontSize: "14px",
                fontWeight: 600,
                color: colors.textSecondary,
                marginBottom: "12px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                🎟️ Select Tickets
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {tickets.map((ticket) => {
                  const qty = getQty(ticket.id);
                  const hasQty = qty > 0;
                  
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
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "12px",
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: "15px",
                            fontWeight: 600,
                            color: colors.textPrimary,
                            marginBottom: "6px",
                          }}>
                            {ticket.title}
                          </div>
                          <div style={{
                            fontFamily: fonts.heading,
                            fontSize: "22px",
                            fontWeight: 700,
                            color: colors.cyan,
                            marginBottom: "8px",
                          }}>
                            ₹{ticket.price}
                            <span style={{
                              fontSize: "12px",
                              color: colors.textMuted,
                              fontFamily: fonts.body,
                              fontWeight: 400,
                            }}> /hr</span>
                          </div>
                          <p style={{
                            fontSize: "13px",
                            color: colors.textSecondary,
                            lineHeight: 1.4,
                          }}>
                            {ticket.description}
                          </p>
                        </div>

                        {/* Quantity controls */}
                        {!hasQty ? (
                          <button
                            disabled={atLimit}
                            onClick={() => !atLimit && setQty(ticket.id, 1)}
                            style={{
                              padding: "10px 20px",
                              background: atLimit 
                                ? "rgba(255, 255, 255, 0.05)" 
                                : `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
                              border: "none",
                              borderRadius: "10px",
                              color: atLimit ? colors.textMuted : "white",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: atLimit ? "not-allowed" : "pointer",
                              transition: "all 0.2s ease",
                            }}
                          >
                            Add
                          </button>
                        ) : (
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0",
                            background: colors.red,
                            borderRadius: "10px",
                            overflow: "hidden",
                          }}>
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
                            <span style={{
                              width: "32px",
                              textAlign: "center",
                              fontFamily: fonts.heading,
                              fontSize: "16px",
                              fontWeight: 700,
                              color: "white",
                            }}>
                              {qty}
                            </span>
                            <button
                              disabled={atLimit}
                              onClick={() => !atLimit && setQty(ticket.id, qty + 1)}
                              style={{
                                width: "36px",
                                height: "36px",
                                background: "transparent",
                                border: "none",
                                color: atLimit ? "rgba(255,255,255,0.4)" : "white",
                                fontSize: "18px",
                                cursor: atLimit ? "not-allowed" : "pointer",
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
            </section>
          </>
        )}
      </div>

      {/* ========== BOTTOM BAR ========== */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(15, 15, 20, 0.95)",
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${colors.border}`,
        padding: "16px",
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}>
          {step === 1 ? (
            <>
              <div>
                <div style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}>
                  {selectedDate ? dateLabel : "Select a date"}
                </div>
                <div style={{
                  fontSize: "13px",
                  color: selectedTime ? colors.cyan : colors.textMuted,
                }}>
                  {selectedTime || "Select a time"}
                </div>
              </div>
              <button
                onClick={handleContinueToTickets}
                disabled={!selectedDate || !selectedTime}
                style={{
                  padding: "14px 28px",
                  background: selectedDate && selectedTime
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
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.textPrimary,
                    }}>
                      {summary.totalTickets} ticket{summary.totalTickets > 1 ? "s" : ""} selected
                    </div>
                    <div style={{
                      fontSize: "13px",
                      color: colors.textSecondary,
                    }}>
                      {dateLabel} • {selectedTime}
                    </div>
                  </>
                ) : (
                  <div style={{
                    fontSize: "14px",
                    color: colors.textMuted,
                  }}>
                    Add tickets to continue
                  </div>
                )}
              </div>
              <button
                onClick={handleConfirmBooking}
                disabled={summary.totalTickets === 0 || isSubmitting}
                style={{
                  padding: "14px 24px",
                  background: summary.totalTickets > 0 && !isSubmitting
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
                    : "Select Tickets"
                }
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}