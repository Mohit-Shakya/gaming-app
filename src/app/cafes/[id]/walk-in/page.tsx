// src/app/cafes/[id]/walk-in/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts } from "@/lib/constants";
import { logger } from "@/lib/logger";

type ConsoleId = "ps5" | "ps4" | "xbox" | "pc" | "pool" | "arcade" | "snooker" | "vr" | "steering_wheel";

const CONSOLES: { id: ConsoleId; label: string; icon: string; color: string }[] = [
  { id: "ps5", label: "PS5", icon: "🎮", color: "#0070d1" },
  { id: "ps4", label: "PS4", icon: "🎮", color: "#003791" },
  { id: "xbox", label: "Xbox", icon: "🎮", color: "#107c10" },
  { id: "pc", label: "PC", icon: "💻", color: "#ff073a" },
  { id: "pool", label: "Pool Table", icon: "🎱", color: "#8b4513" },
  { id: "arcade", label: "Arcade", icon: "🕹️", color: "#ff6b00" },
  { id: "snooker", label: "Snooker", icon: "🎱", color: "#228b22" },
  { id: "vr", label: "VR", icon: "🥽", color: "#9945ff" },
  { id: "steering_wheel", label: "Racing Rig", icon: "🏎️", color: "#e10600" },
];

const CONSOLE_DB_KEYS: Record<ConsoleId, string> = {
  ps5: "ps5_count",
  ps4: "ps4_count",
  xbox: "xbox_count",
  pc: "pc_count",
  pool: "pool_count",
  arcade: "arcade_count",
  snooker: "snooker_count",
  vr: "vr_count",
  steering_wheel: "steering_wheel_count",
};

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

export default function WalkInBookingPage() {
  const params = useParams();
  const cafeIdOrSlug = typeof params?.id === "string" ? params.id : null;

  // Cafe data
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [loading, setLoading] = useState(true);
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [consolePricing, setConsolePricing] = useState<Partial<Record<ConsoleId, ConsolePricingTier>>>({});
  const [consoleCounts, setConsoleCounts] = useState<Partial<Record<ConsoleId, number>>>({});

  // Form data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState<30 | 60>(60);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<string>("");

  // Load cafe data
  useEffect(() => {
    async function loadCafe() {
      if (!cafeIdOrSlug) return;

      try {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeIdOrSlug);

        const { data, error } = await supabase
          .from("cafes")
          .select("*")
          .eq(isUUID ? "id" : "slug", cafeIdOrSlug)
          .maybeSingle();

        if (error || !data) {
          setError("Café not found");
          return;
        }

        setCafeId(data.id);
        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);

        // Get available consoles and their counts
        const available: ConsoleId[] = [];
        const counts: Partial<Record<ConsoleId, number>> = {};

        CONSOLES.forEach((c) => {
          const dbKey = CONSOLE_DB_KEYS[c.id];
          const count = (data as any)[dbKey] ?? 0;

          if (count > 0) {
            available.push(c.id);
            counts[c.id] = count;
          }
        });

        setAvailableConsoles(available);
        setConsoleCounts(counts);

        // Load console pricing from console_pricing table
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("console_type, quantity, duration_minutes, price")
          .eq("cafe_id", data.id);

        if (!pricingError && pricingData) {
          const pricing: Partial<Record<ConsoleId, ConsolePricingTier>> = {};

          pricingData.forEach((item: any) => {
            // Map database console_type to ConsoleId
            let consoleId = item.console_type as ConsoleId;

            // Initialize pricing object if it doesn't exist
            if (!pricing[consoleId]) {
              pricing[consoleId] = {
                qty1_30min: null,
                qty1_60min: null,
                qty2_30min: null,
                qty2_60min: null,
                qty3_30min: null,
                qty3_60min: null,
                qty4_30min: null,
                qty4_60min: null,
              };
            }

            // Map the pricing data to the correct tier
            const key = `qty${item.quantity}_${item.duration_minutes}min` as keyof ConsolePricingTier;
            pricing[consoleId]![key] = item.price;
          });

          setConsolePricing(pricing);
        } else if (pricingError) {
          logger.error('Error loading pricing:', pricingError);
        }

        // Auto-select first available console
        if (available.length > 0) {
          setSelectedConsole(available[0]);
        }
      } catch (err) {
        logger.error("Error loading cafe:", err);
        setError("Could not load café details");
      } finally {
        setLoading(false);
      }
    }

    loadCafe();
  }, [cafeIdOrSlug]);

  // Calculate amount based on tier pricing
  const calculateAmount = () => {
    if (!selectedConsole) return 0;

    const tier = consolePricing[selectedConsole];
    const basePrice = cafePrice;

    if (tier) {
      // Use tier-based pricing
      const key = `qty${quantity}_${duration}min` as keyof ConsolePricingTier;
      const tierPrice = tier[key];

      if (tierPrice !== null && tierPrice !== undefined) {
        return tierPrice;
      }
    }

    // Fallback to simple calculation
    const durationMultiplier = duration / 60;
    const fallbackAmount = basePrice * quantity * durationMultiplier;
    return fallbackAmount;
  };

  const totalAmount = calculateAmount();

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!customerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!customerPhone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    if (customerPhone.length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    if (!selectedConsole) {
      setError("Please select a console");
      return;
    }

    if (!cafeId) {
      setError("Café information not loaded");
      return;
    }

    try {
      setSubmitting(true);

      // Get current date and time
      const now = new Date();
      const bookingDate = now.toISOString().split("T")[0];
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "pm" : "am";
      const displayHours = hours % 12 || 12;
      const startTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: cafeId,
          user_id: null,
          booking_date: bookingDate,
          start_time: startTime,
          duration: duration,
          total_amount: totalAmount,
          status: "confirmed",
          source: "walk_in",
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
        })
        .select()
        .single();

      if (bookingError) {
        logger.error("Booking error:", bookingError);
        setError("Could not create booking. Please try again.");
        return;
      }

      // Create booking item
      const consoleInfo = CONSOLES.find(c => c.id === selectedConsole);
      const ticketId = `${selectedConsole}_${quantity}_${duration}`;

      const { error: itemError } = await supabase
        .from("booking_items")
        .insert({
          booking_id: booking.id,
          ticket_id: ticketId,
          console: selectedConsole,
          title: `${consoleInfo?.label || selectedConsole} - ${quantity}x ${duration}min`,
          price: totalAmount,
          quantity: quantity,
        });

      if (itemError) {
        logger.error("Booking item error:", itemError);
        setError("Booking created but item failed. Please contact staff.");
        return;
      }

      // Success!
      setBookingId(booking.id.slice(0, 8).toUpperCase());
      setSuccess(true);

      // Reset form after 5 seconds
      setTimeout(() => {
        setCustomerName("");
        setCustomerPhone("");
        setQuantity(1);
        setDuration(60);
        if (availableConsoles.length > 0) {
          setSelectedConsole(availableConsoles[0]);
        }
        setSuccess(false);
        setBookingId("");
      }, 5000);

    } catch (err) {
      logger.error("Unexpected error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
        fontFamily: fonts.body,
      }}>
        <div style={{ color: colors.textSecondary, fontSize: "16px" }}>Loading...</div>
      </div>
    );
  }

  if (error && !cafeId) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
        fontFamily: fonts.body,
        padding: "20px",
      }}>
        <div style={{
          textAlign: "center",
          color: colors.red,
          fontSize: "18px",
        }}>
          {error}
        </div>
      </div>
    );
  }

  // Filter consoles to show only available ones
  const availableConsoleOptions = CONSOLES.filter(c => availableConsoles.includes(c.id));

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
      fontFamily: fonts.body,
      padding: "16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <div style={{
        maxWidth: "480px",
        width: "100%",
      }}>
        {/* Success Message */}
        {success ? (
          <div style={{
            background: "rgba(20, 20, 28, 0.95)",
            border: "2px solid rgba(34, 197, 94, 0.5)",
            borderRadius: "20px",
            padding: "40px 24px",
            textAlign: "center",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{
              fontSize: "64px",
              marginBottom: "16px",
              animation: "scaleIn 0.5s ease",
            }}>
              ✅
            </div>
            <div style={{
              color: "#22c55e",
              fontFamily: fonts.heading,
              fontSize: "24px",
              fontWeight: 700,
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}>
              Booking Confirmed!
            </div>
            <div style={{
              color: colors.textPrimary,
              fontSize: "16px",
              marginBottom: "8px",
              fontWeight: 600,
            }}>
              Booking ID: #{bookingId}
            </div>
            <div style={{
              color: colors.textSecondary,
              fontSize: "14px",
              marginTop: "16px",
            }}>
              Please proceed to the counter for payment
            </div>
            <div style={{
              marginTop: "24px",
              padding: "16px",
              background: "rgba(255, 7, 58, 0.1)",
              borderRadius: "12px",
            }}>
              <div style={{ color: colors.textSecondary, fontSize: "13px", marginBottom: "4px" }}>
                Amount to Pay
              </div>
              <div style={{
                color: colors.red,
                fontSize: "32px",
                fontWeight: 700,
                fontFamily: fonts.heading,
              }}>
                ₹{totalAmount}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              textAlign: "center",
              marginBottom: "24px",
            }}>
              <h1 style={{
                fontFamily: fonts.heading,
                fontSize: "28px",
                fontWeight: 700,
                color: colors.textPrimary,
                marginBottom: "8px",
                textTransform: "uppercase",
                letterSpacing: "1px",
              }}>
                {cafeName}
              </h1>
              <p style={{
                color: colors.textSecondary,
                fontSize: "13px",
              }}>
                Walk-In Booking Form
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{
              background: "rgba(20, 20, 28, 0.95)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              padding: "24px",
            }}>
              {/* Error Message */}
              {error && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  borderRadius: "12px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  color: "#ef4444",
                  fontSize: "14px",
                  textAlign: "center",
                }}>
                  {error}
                </div>
              )}

              {/* Name Input */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  color: colors.textPrimary,
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}>
                  Your Name *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your full name"
                  disabled={submitting}
                  autoComplete="name"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: colors.textPrimary,
                    fontSize: "16px",
                    fontFamily: fonts.body,
                    outline: "none",
                  }}
                />
              </div>

              {/* Phone Input */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  color: colors.textPrimary,
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}>
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  disabled={submitting}
                  autoComplete="tel"
                  inputMode="numeric"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    color: colors.textPrimary,
                    fontSize: "16px",
                    fontFamily: fonts.body,
                    outline: "none",
                  }}
                />
              </div>

              {/* Console Selection - Only Available Consoles */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  color: colors.textPrimary,
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "10px",
                }}>
                  Select Console *
                </label>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "10px",
                }}>
                  {availableConsoleOptions.map((console) => {
                    const isSelected = selectedConsole === console.id;

                    return (
                      <button
                        key={console.id}
                        type="button"
                        onClick={() => setSelectedConsole(console.id)}
                        disabled={submitting}
                        style={{
                          padding: "14px 8px",
                          background: isSelected
                            ? `linear-gradient(135deg, ${console.color}33 0%, ${console.color}11 100%)`
                            : "rgba(255, 255, 255, 0.03)",
                          border: isSelected
                            ? `2px solid ${console.color}`
                            : "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          color: colors.textPrimary,
                          cursor: "pointer",
                          transition: "all 0.2s",
                          textAlign: "center",
                        }}
                      >
                        <div style={{ fontSize: "24px", marginBottom: "4px" }}>{console.icon}</div>
                        <div style={{ fontSize: "12px", fontWeight: 600 }}>{console.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quantity Selection */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{
                  display: "block",
                  color: colors.textPrimary,
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}>
                  No. of Controllers
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {[1, 2, 3, 4].map((num) => {
                    const isSelected = quantity === num;

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuantity(num)}
                        disabled={submitting}
                        style={{
                          flex: 1,
                          padding: "14px",
                          background: isSelected
                            ? `linear-gradient(135deg, ${colors.red} 0%, #cc0530 100%)`
                            : "rgba(255, 255, 255, 0.05)",
                          border: isSelected
                            ? `2px solid ${colors.red}`
                            : "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          color: colors.textPrimary,
                          fontSize: "18px",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration Selection */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{
                  display: "block",
                  color: colors.textPrimary,
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: "8px",
                }}>
                  Duration
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setDuration(30)}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: duration === 30
                        ? `linear-gradient(135deg, ${colors.cyan} 0%, #00b8d4 100%)`
                        : "rgba(255, 255, 255, 0.05)",
                      border: duration === 30
                        ? `2px solid ${colors.cyan}`
                        : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: colors.textPrimary,
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    30 min
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(60)}
                    disabled={submitting}
                    style={{
                      flex: 1,
                      padding: "14px",
                      background: duration === 60
                        ? `linear-gradient(135deg, ${colors.cyan} 0%, #00b8d4 100%)`
                        : "rgba(255, 255, 255, 0.05)",
                      border: duration === 60
                        ? `2px solid ${colors.cyan}`
                        : "1px solid rgba(255, 255, 255, 0.1)",
                      borderRadius: "12px",
                      color: colors.textPrimary,
                      fontSize: "16px",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    60 min
                  </button>
                </div>
              </div>

              {/* Amount Display */}
              <div style={{
                background: "rgba(255, 7, 58, 0.1)",
                border: "1px solid rgba(255, 7, 58, 0.3)",
                borderRadius: "16px",
                padding: "20px",
                marginBottom: "24px",
              }}>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <div style={{ color: colors.textSecondary, fontSize: "13px", marginBottom: "4px" }}>
                      Total Amount
                    </div>
                    <div style={{ color: colors.textPrimary, fontSize: "11px" }}>
                      Pay at Counter
                    </div>
                  </div>
                  <div style={{
                    fontFamily: fonts.heading,
                    fontSize: "36px",
                    fontWeight: 700,
                    color: colors.red,
                  }}>
                    ₹{totalAmount}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !selectedConsole}
                style={{
                  width: "100%",
                  padding: "18px",
                  background: submitting
                    ? "rgba(148, 163, 184, 0.3)"
                    : `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
                  border: "none",
                  borderRadius: "14px",
                  color: "white",
                  fontSize: "17px",
                  fontWeight: 700,
                  fontFamily: fonts.heading,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                  boxShadow: submitting ? "none" : "0 4px 20px rgba(255, 7, 58, 0.3)",
                  transition: "all 0.2s",
                }}
              >
                {submitting ? "Creating..." : "Confirm Booking"}
              </button>
            </form>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.5); }
          to { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
