// src/app/cafes/[id]/walk-in/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts } from "@/lib/constants";

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

export default function WalkInBookingPage() {
  const params = useParams();
  const router = useRouter();
  const cafeIdOrSlug = typeof params?.id === "string" ? params.id : null;

  // Cafe data
  const [cafeId, setCafeId] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState<string>("Gaming Café");
  const [cafePrice, setCafePrice] = useState<number>(150);
  const [loading, setLoading] = useState(true);
  const [availableConsoles, setAvailableConsoles] = useState<ConsoleId[]>([]);
  const [consoleLimits, setConsoleLimits] = useState<Partial<Record<ConsoleId, number>>>({});

  // Form data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [duration, setDuration] = useState<30 | 60>(60); // Default 60 minutes

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load cafe data
  useEffect(() => {
    async function loadCafe() {
      if (!cafeIdOrSlug) return;

      try {
        setLoading(true);
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cafeIdOrSlug);

        const { data, error } = await supabase
          .from("cafes")
          .select("id, name, hourly_price, ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count")
          .eq(isUUID ? "id" : "slug", cafeIdOrSlug)
          .maybeSingle();

        if (error || !data) {
          setError("Café not found");
          return;
        }

        setCafeId(data.id);
        setCafeName(data.name || "Gaming Café");
        setCafePrice(data.hourly_price || 150);

        // Get available consoles
        const limits: Partial<Record<ConsoleId, number>> = {};
        const available: ConsoleId[] = [];

        CONSOLES.forEach((c) => {
          const dbKey = CONSOLE_DB_KEYS[c.id];
          const count = (data as any)[dbKey] ?? 0;
          if (count > 0) {
            limits[c.id] = count;
            available.push(c.id);
          }
        });

        setConsoleLimits(limits);
        setAvailableConsoles(available);

        // Auto-select first available console
        if (available.length > 0) {
          setSelectedConsole(available[0]);
        }
      } catch (err) {
        console.error("Error loading cafe:", err);
        setError("Could not load café details");
      } finally {
        setLoading(false);
      }
    }

    loadCafe();
  }, [cafeIdOrSlug]);

  // Calculate amount
  const calculateAmount = () => {
    if (!selectedConsole) return 0;
    const basePrice = cafePrice;
    const durationMultiplier = duration / 60; // 0.5 for 30min, 1 for 60min
    return basePrice * quantity * durationMultiplier;
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
      const bookingDate = now.toISOString().split("T")[0]; // YYYY-MM-DD
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
          user_id: null, // Walk-in customers don't have user accounts
          booking_date: bookingDate,
          start_time: startTime,
          duration: duration,
          total_amount: totalAmount,
          status: "confirmed", // Walk-in bookings are instantly confirmed
          source: "walk_in",
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
        })
        .select()
        .single();

      if (bookingError) {
        console.error("Booking error:", bookingError);
        setError("Could not create booking. Please try again.");
        return;
      }

      // Create booking item
      const { error: itemError } = await supabase
        .from("booking_items")
        .insert({
          booking_id: booking.id,
          console: selectedConsole,
          quantity: quantity,
        });

      if (itemError) {
        console.error("Booking item error:", itemError);
        setError("Booking created but item failed. Please contact staff.");
        return;
      }

      // Success!
      setSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setCustomerName("");
        setCustomerPhone("");
        setQuantity(1);
        setDuration(60);
        setSuccess(false);
        if (availableConsoles.length > 0) {
          setSelectedConsole(availableConsoles[0]);
        }
      }, 3000);

    } catch (err) {
      console.error("Unexpected error:", err);
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
        <div style={{ color: colors.textSecondary }}>Loading café details...</div>
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)",
      fontFamily: fonts.body,
      padding: "20px",
    }}>
      <div style={{
        maxWidth: "600px",
        margin: "0 auto",
      }}>
        {/* Header */}
        <div style={{
          textAlign: "center",
          marginBottom: "30px",
          paddingTop: "20px",
        }}>
          <h1 style={{
            fontFamily: fonts.heading,
            fontSize: "32px",
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
            fontSize: "14px",
            marginTop: "8px",
          }}>
            Walk-In Booking
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>✅</div>
            <div style={{ color: "#22c55e", fontWeight: 600, marginBottom: "4px" }}>
              Booking Confirmed!
            </div>
            <div style={{ color: colors.textSecondary, fontSize: "14px" }}>
              Please proceed to the counter for payment
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{
          background: "rgba(20, 20, 28, 0.8)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "16px",
          padding: "24px",
        }}>
          {/* Error Message */}
          {error && (
            <div style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              padding: "12px",
              marginBottom: "20px",
              color: "#ef4444",
              fontSize: "14px",
            }}>
              {error}
            </div>
          )}

          {/* Name Input */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              color: colors.textPrimary,
              fontSize: "14px",
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
              disabled={submitting || success}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
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
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="Enter 10-digit mobile number"
              disabled={submitting || success}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "8px",
                color: colors.textPrimary,
                fontSize: "16px",
                fontFamily: fonts.body,
                outline: "none",
              }}
            />
          </div>

          {/* Console Selection */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{
              display: "block",
              color: colors.textPrimary,
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "12px",
            }}>
              Select Console *
            </label>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "12px",
            }}>
              {availableConsoles.map((consoleId) => {
                const console = CONSOLES.find((c) => c.id === consoleId);
                if (!console) return null;
                const isSelected = selectedConsole === consoleId;
                const maxQty = consoleLimits[consoleId] || 0;

                return (
                  <button
                    key={consoleId}
                    type="button"
                    onClick={() => {
                      setSelectedConsole(consoleId);
                      setQuantity(1);
                    }}
                    disabled={submitting || success}
                    style={{
                      padding: "16px 12px",
                      background: isSelected
                        ? `linear-gradient(135deg, ${console.color}22 0%, ${console.color}11 100%)`
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
                    <div style={{ fontSize: "13px", fontWeight: 600 }}>{console.label}</div>
                    <div style={{ fontSize: "11px", color: colors.textSecondary, marginTop: "4px" }}>
                      {maxQty} available
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity Selection */}
          {selectedConsole && (
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                color: colors.textPrimary,
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "8px",
              }}>
                Number of Controllers
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {[1, 2, 3, 4].map((num) => {
                  const maxQty = consoleLimits[selectedConsole] || 0;
                  const isAvailable = num <= maxQty;
                  const isSelected = quantity === num;

                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuantity(num)}
                      disabled={!isAvailable || submitting || success}
                      style={{
                        flex: 1,
                        padding: "12px",
                        background: isSelected
                          ? `linear-gradient(135deg, ${colors.red} 0%, #cc0530 100%)`
                          : "rgba(255, 255, 255, 0.05)",
                        border: isSelected ? `1px solid ${colors.red}` : "1px solid rgba(255, 255, 255, 0.1)",
                        borderRadius: "8px",
                        color: isAvailable ? colors.textPrimary : colors.textMuted,
                        fontSize: "16px",
                        fontWeight: 600,
                        cursor: isAvailable ? "pointer" : "not-allowed",
                        opacity: isAvailable ? 1 : 0.5,
                      }}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Duration Selection */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              color: colors.textPrimary,
              fontSize: "14px",
              fontWeight: 600,
              marginBottom: "8px",
            }}>
              Duration
            </label>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={() => setDuration(30)}
                disabled={submitting || success}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: duration === 30
                    ? `linear-gradient(135deg, ${colors.cyan} 0%, #00b8d4 100%)`
                    : "rgba(255, 255, 255, 0.05)",
                  border: duration === 30 ? `1px solid ${colors.cyan}` : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: colors.textPrimary,
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                30 min
              </button>
              <button
                type="button"
                onClick={() => setDuration(60)}
                disabled={submitting || success}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: duration === 60
                    ? `linear-gradient(135deg, ${colors.cyan} 0%, #00b8d4 100%)`
                    : "rgba(255, 255, 255, 0.05)",
                  border: duration === 60 ? `1px solid ${colors.cyan}` : "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: colors.textPrimary,
                  fontSize: "16px",
                  fontWeight: 600,
                  cursor: "pointer",
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
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "24px",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <div>
                <div style={{ color: colors.textSecondary, fontSize: "14px" }}>Total Amount</div>
                <div style={{ color: colors.textPrimary, fontSize: "12px", marginTop: "4px" }}>
                  Pay at Counter
                </div>
              </div>
              <div style={{
                fontFamily: fonts.heading,
                fontSize: "32px",
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
            disabled={submitting || success || !selectedConsole}
            style={{
              width: "100%",
              padding: "16px",
              background: submitting || success
                ? "rgba(148, 163, 184, 0.3)"
                : `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
              border: "none",
              borderRadius: "12px",
              color: "white",
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: fonts.heading,
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: submitting || success ? "not-allowed" : "pointer",
              opacity: submitting || success ? 0.6 : 1,
            }}
          >
            {submitting ? "Creating Booking..." : success ? "Booking Confirmed!" : "Confirm Booking"}
          </button>
        </form>
      </div>
    </div>
  );
}
