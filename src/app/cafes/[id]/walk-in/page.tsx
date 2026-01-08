// src/app/cafes/[id]/walk-in/page.tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { colors, fonts, CONSOLE_LABELS, CONSOLE_COLORS, CONSOLE_ICONS, type ConsoleId } from "@/lib/constants";
import { useCafeData } from "@/hooks/useCafeData";
import { determinePriceForTier, calculateConsoleMaxQuantity } from "@/lib/ticketService";
import { checkBookingCapacityWithOverlap } from "@/lib/capacityValidator";
import { fetchLiveAvailability } from "@/lib/availabilityService";
import { logger } from "@/lib/logger";

// Walk-in bookings are ALWAYS in-progress since customers are already at the cafe
const WALKIN_BOOKING_STATUS = "in-progress" as const;

const CONSOLES = [
  { id: "ps5" as ConsoleId, label: CONSOLE_LABELS.ps5, icon: CONSOLE_ICONS.ps5, color: CONSOLE_COLORS.ps5 },
  { id: "ps4" as ConsoleId, label: CONSOLE_LABELS.ps4, icon: CONSOLE_ICONS.ps4, color: CONSOLE_COLORS.ps4 },
  { id: "xbox" as ConsoleId, label: CONSOLE_LABELS.xbox, icon: CONSOLE_ICONS.xbox, color: CONSOLE_COLORS.xbox },
  { id: "pc" as ConsoleId, label: CONSOLE_LABELS.pc, icon: CONSOLE_ICONS.pc, color: CONSOLE_COLORS.pc },
  { id: "pool" as ConsoleId, label: CONSOLE_LABELS.pool, icon: CONSOLE_ICONS.pool, color: CONSOLE_COLORS.pool },
  { id: "arcade" as ConsoleId, label: CONSOLE_LABELS.arcade, icon: CONSOLE_ICONS.arcade, color: CONSOLE_COLORS.arcade },
  { id: "snooker" as ConsoleId, label: CONSOLE_LABELS.snooker, icon: CONSOLE_ICONS.snooker, color: CONSOLE_COLORS.snooker },
  { id: "vr" as ConsoleId, label: CONSOLE_LABELS.vr, icon: CONSOLE_ICONS.vr, color: CONSOLE_COLORS.vr },
  { id: "steering" as ConsoleId, label: CONSOLE_LABELS.steering, icon: CONSOLE_ICONS.steering, color: CONSOLE_COLORS.steering },
];

export default function WalkInBookingPage() {
  const params = useParams();
  const router = useRouter();
  const cafeIdOrSlug = typeof params?.id === "string" ? params.id : null;

  // Load cafe data
  const { actualCafeId, cafeName, cafePrice, consolePricing, availableConsoles, consoleLimits, loading, error: cafeError } = useCafeData(cafeIdOrSlug);

  // Form data
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedConsole, setSelectedConsole] = useState<ConsoleId | null>(null);
  const [consoleQuantity, setConsoleQuantity] = useState(1); // Number of consoles
  const [numControllers, setNumControllers] = useState(1); // Number of controllers/players
  const [duration, setDuration] = useState<30 | 60>(60);
  const [paymentMode, setPaymentMode] = useState<string>("cash");

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmedAmount, setConfirmedAmount] = useState<number>(0);
  const [confirmedBooking, setConfirmedBooking] = useState<{
    name: string;
    phone: string;
    console: string;
    duration: number;
    startTime: string;
    endTime: string;
    paymentMode: string;
  } | null>(null);

  // Get max controllers for selected console type
  const getMaxControllers = (): number => {
    if (!selectedConsole) return 4;
    return calculateConsoleMaxQuantity(selectedConsole);
  };

  // Get max quantity available for selected console
  const getMaxConsoleQuantity = (): number => {
    if (!selectedConsole) return 5;
    const availableCount = consoleLimits[selectedConsole] ?? 0;
    // Return available count (minimum 1 if console is available)
    return Math.max(1, availableCount);
  };

  // Calculate price based on controllers (players) and console quantity
  const calculatePrice = (): number => {
    if (!selectedConsole) return 0;

    const pricingTier = consolePricing[selectedConsole] ?? null;
    const pricePerConsole = determinePriceForTier(pricingTier, numControllers, duration, cafePrice, selectedConsole);

    // Multiply by console quantity
    return pricePerConsole * consoleQuantity;
  };

  const totalPrice = calculatePrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError("Please enter customer name");
      return;
    }
    // Phone number is now optional
    if (customerPhone.trim() && customerPhone.trim().length < 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }
    if (!selectedConsole) {
      setError("Please select a console");
      return;
    }
    if (!actualCafeId) {
      setError("Café information not loaded");
      return;
    }

    setSubmitting(true);

    try {
      // Get current date and time
      const now = new Date();
      const bookingDate = now.toISOString().split("T")[0];
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "pm" : "am";
      const displayHours = hours % 12 || 12;
      const startTime = `${displayHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;

      // Check capacity availability before creating bookings
      const capacityCheck = await checkBookingCapacityWithOverlap({
        cafeId: actualCafeId,
        bookingDate,
        timeSlot: startTime,
        tickets: [{
          console: selectedConsole,
          quantity: consoleQuantity, // Number of console units
        }],
        durationMinutes: duration,
      });

      if (!capacityCheck.ok) {
        // Fetch live availability to get next available time
        const availability = await fetchLiveAvailability({
          cafeId: actualCafeId,
          selectedDate: bookingDate,
          selectedTime: startTime,
          selectedDuration: duration,
          availableConsoles: [selectedConsole],
          consoleLimits: consoleLimits,
        });

        const consoleAvailability = availability[selectedConsole];
        const nextAvailableTime = consoleAvailability?.nextAvailableAt;

        if (nextAvailableTime) {
          setError(`${CONSOLE_LABELS[selectedConsole]} not available right now. Next available at ${nextAvailableTime}`);
        } else {
          setError(capacityCheck.message || "Not enough consoles available for this time slot");
        }
        setSubmitting(false);
        return;
      }

      // Create separate bookings for each console unit
      const pricePerConsole = totalPrice / consoleQuantity;
      const createdBookingIds: string[] = [];

      for (let i = 0; i < consoleQuantity; i++) {
        // Create individual booking for each console
        const { data: booking, error: bookingError } = await supabase
          .from("bookings")
          .insert({
            cafe_id: actualCafeId,
            booking_date: bookingDate,
            start_time: startTime,
            duration: duration,
            status: WALKIN_BOOKING_STATUS, // Walk-in bookings auto-start immediately
            customer_name: customerName.trim(),
            customer_phone: customerPhone.trim(),
            source: "walk-in",
            payment_mode: paymentMode,
            total_amount: pricePerConsole,
          })
          .select()
          .single();

        if (bookingError || !booking) {
          logger.error("Error creating booking:", bookingError);
          setError("Failed to create booking. Please try again.");
          setSubmitting(false);
          return;
        }

        createdBookingIds.push(booking.id);

        // Create booking item for this console
        const { error: itemsError } = await supabase
          .from("booking_items")
          .insert({
            booking_id: booking.id,
            console: selectedConsole,
            quantity: numControllers, // Number of controllers
            title: `${CONSOLE_LABELS[selectedConsole]} (${numControllers} ${numControllers > 1 ? 'controllers' : 'controller'})`,
            price: pricePerConsole,
            ticket_id: `walk-in-${booking.id}`,
          });

        if (itemsError) {
          logger.error("Error creating booking item:", itemsError);
          setError("Booking created but items failed. Please contact support.");
          setSubmitting(false);
          return;
        }
      }

      // Calculate end time
      const [startHours, startMinutesPart] = startTime.split(':');
      const startMinutes = parseInt(startMinutesPart.split(' ')[0]);
      const startIsPM = startTime.includes('pm');
      let startHour24 = parseInt(startHours);
      if (startIsPM && startHour24 !== 12) startHour24 += 12;
      if (!startIsPM && startHour24 === 12) startHour24 = 0;

      const totalMinutes = (startHour24 * 60 + startMinutes + duration) % (24 * 60);
      const endHour24 = Math.floor(totalMinutes / 60);
      const endMin = totalMinutes % 60;
      const endHour12 = endHour24 % 12 || 12;
      const endAmPm = endHour24 >= 12 ? 'pm' : 'am';
      const endTime = `${endHour12}:${endMin.toString().padStart(2, '0')} ${endAmPm}`;

      // Save the confirmed booking details
      setConfirmedAmount(totalPrice);
      setConfirmedBooking({
        name: customerName.trim(),
        phone: customerPhone.trim(),
        console: CONSOLE_LABELS[selectedConsole],
        duration: duration,
        startTime: startTime,
        endTime: endTime,
        paymentMode: paymentMode,
      });
      setSuccess(true);

      // Reset form
      setCustomerName("");
      setCustomerPhone("");
      setSelectedConsole(null);
      setConsoleQuantity(1);
      setNumControllers(1);
      setDuration(60);
      setPaymentMode("cash");
    } catch (err) {
      logger.error("Error creating walk-in booking:", err);
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.dark }}>
        <div style={{ width: "40px", height: "40px", border: `4px solid ${colors.border}`, borderTopColor: colors.cyan, borderRadius: "50%", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  // Error state
  if (cafeError || !cafeIdOrSlug) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.dark, padding: "20px" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: "18px", color: colors.textPrimary }}>{cafeError || "Café not found"}</p>
          <button onClick={() => router.push("/owner")} style={{ marginTop: "20px", padding: "10px 20px", background: colors.red, color: "white", border: "none", borderRadius: "8px", cursor: "pointer" }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F14", color: colors.textPrimary, fontFamily: fonts.body, padding: "20px 16px 40px" }}>
      <div style={{ maxWidth: "500px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px", textAlign: "center" }}>
          <div style={{ marginBottom: "8px" }}>
            <h1 style={{
              fontSize: "24px",
              fontWeight: 700,
              fontFamily: fonts.heading,
              color: "#FFFFFF",
              marginBottom: "4px",
              letterSpacing: "0.5px"
            }}>
              {cafeName || "Gaming Cafe"}
            </h1>
          </div>
          <p style={{
            fontSize: "14px",
            fontWeight: 400,
            color: "#8B8B8E",
            marginBottom: "0",
            letterSpacing: "0.3px"
          }}>
            Walk-In Booking
          </p>
        </div>

        {/* Success Modal */}
        {success && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            backdropFilter: "blur(8px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}>
            <div style={{
              background: "linear-gradient(145deg, rgba(30, 30, 36, 0.95) 0%, rgba(25, 25, 30, 0.95) 100%)",
              borderRadius: "28px",
              padding: "40px 32px",
              maxWidth: "450px",
              width: "100%",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              textAlign: "center",
              animation: "slideUp 0.4s ease-out"
            }}>
              {/* Success Icon */}
              <div style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 24px",
                border: "2px solid #10B981"
              }}>
                <span style={{ fontSize: "48px" }}>✅</span>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: "28px",
                fontWeight: 800,
                color: "#10B981",
                fontFamily: fonts.heading,
                marginBottom: "8px",
                letterSpacing: "0.5px"
              }}>
                Booking Confirmed!
              </h2>

              {/* Cafe Name */}
              <div style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#E5E5E7",
                fontFamily: fonts.heading,
                marginBottom: "4px",
                letterSpacing: "0.5px"
              }}>
                {cafeName || "Gaming Cafe"}
              </div>

              {/* Subtitle */}
              <div style={{
                fontSize: "13px",
                fontWeight: 400,
                color: "#8B8B8E",
                marginBottom: "20px",
                letterSpacing: "0.3px"
              }}>
                Walk-In Booking
              </div>

              {/* Booking Details */}
              {confirmedBooking && (
                <div style={{
                  background: "rgba(15, 15, 20, 0.8)",
                  padding: "24px",
                  borderRadius: "16px",
                  marginBottom: "20px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  textAlign: "left"
                }}>
                  {/* Name */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Name</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#E5E5E7" }}>{confirmedBooking.name}</div>
                  </div>

                  {/* Phone */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Phone</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#E5E5E7" }}>{confirmedBooking.phone}</div>
                  </div>

                  {/* Console */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Console</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#00D9FF" }}>{confirmedBooking.console}</div>
                  </div>

                  {/* Duration */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Duration</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#E5E5E7" }}>{confirmedBooking.duration} min</div>
                  </div>

                  {/* Start Time */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Start Time</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#10B981" }}>{confirmedBooking.startTime}</div>
                  </div>

                  {/* End Time */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>End Time</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#EF4444" }}>{confirmedBooking.endTime}</div>
                  </div>

                  {/* Payment Mode */}
                  <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: "12px", color: "#999", textTransform: "uppercase", letterSpacing: "0.5px" }}>Payment</div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "#a855f7", textTransform: "capitalize" }}>
                      {confirmedBooking.paymentMode === 'cash' ? '💵' : '📱'} {confirmedBooking.paymentMode}
                    </div>
                  </div>

                  {/* Amount - highlighted */}
                  <div style={{
                    marginTop: "20px",
                    paddingTop: "20px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{ fontSize: "14px", color: "#B4B4B7", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>
                      Total Amount
                    </div>
                    <div style={{ fontSize: "28px", fontWeight: 900, color: "#EF4444", fontFamily: fonts.heading }}>
                      ₹{confirmedAmount}
                    </div>
                  </div>
                </div>
              )}

              {/* Screenshot Note */}
              <div style={{
                fontSize: "11px",
                color: "#8B8B8E",
                textAlign: "center",
                marginBottom: "16px",
                fontStyle: "italic"
              }}>
                📸 Take a screenshot of this booking as proof
              </div>

              {/* Close Button */}
              <button
                onClick={() => {
                  setSuccess(false);
                  setConfirmedAmount(0);
                  setConfirmedBooking(null);
                }}
                style={{
                  width: "100%",
                  padding: "18px 24px",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  border: "none",
                  borderRadius: "16px",
                  color: "#FFFFFF",
                  fontFamily: fonts.heading,
                  fontSize: "15px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.3)"
                }}
                className="close-modal-btn"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{ padding: "16px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid #ef4444", borderRadius: "12px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "24px" }}>❌</span>
              <p style={{ fontSize: "14px", color: "#ef4444" }}>{error}</p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div style={{
            background: "linear-gradient(145deg, rgba(30, 30, 36, 0.7) 0%, rgba(25, 25, 30, 0.6) 100%)",
            borderRadius: "28px",
            padding: "36px 28px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
          }}>
            {/* Customer Name */}
            <div style={{ marginBottom: "24px" }}>
              <label style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#E5E5E7",
                marginBottom: "10px",
                letterSpacing: "0.3px"
              }}>
                Your Name <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  // Only allow letters and spaces
                  const value = e.target.value.replace(/[^a-zA-Z\s]/g, '');
                  setCustomerName(value);
                }}
                placeholder="Enter your full name"
                className="form-input"
                maxLength={50}
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  background: "rgba(15, 15, 20, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontFamily: fonts.body,
                  fontWeight: 400
                }}
              />
            </div>

            {/* Phone Number */}
            <div style={{ marginBottom: "32px" }}>
              <label style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#E5E5E7",
                marginBottom: "10px",
                letterSpacing: "0.3px"
              }}>
                Phone Number <span style={{ fontSize: "11px", color: "#999", fontWeight: 400 }}>(Optional)</span>
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  // Only allow digits
                  const value = e.target.value.replace(/\D/g, '');
                  // Limit to 10 digits
                  setCustomerPhone(value.slice(0, 10));
                }}
                placeholder="10-digit mobile number (optional)"
                className="form-input"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  background: "rgba(15, 15, 20, 0.9)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "14px",
                  color: "#FFFFFF",
                  fontSize: "15px",
                  fontFamily: fonts.body,
                  fontWeight: 400
                }}
              />
            </div>

            {/* Console Selection */}
            <div style={{ marginBottom: "32px" }}>
              <label style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 500,
                color: "#E5E5E7",
                marginBottom: "14px",
                letterSpacing: "0.3px"
              }}>
                Select Console <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))", gap: "12px" }}>
                {CONSOLES.filter(c => availableConsoles.includes(c.id)).map((console) => {
                  const isSelected = selectedConsole === console.id;
                  return (
                    <button
                      key={console.id}
                      type="button"
                      onClick={() => setSelectedConsole(console.id)}
                      style={{
                        padding: "18px 10px",
                        borderRadius: "18px",
                        border: isSelected ? `2px solid ${console.color}` : "1px solid rgba(255, 255, 255, 0.08)",
                        background: isSelected
                          ? `linear-gradient(135deg, ${console.color}25 0%, ${console.color}15 100%)`
                          : "rgba(15, 15, 20, 0.7)",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        textAlign: "center"
                      }}
                      className="console-btn"
                    >
                      <div style={{ fontSize: "36px", marginBottom: "10px" }}>{console.icon}</div>
                      <div style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isSelected ? console.color : "#E5E5E7",
                        letterSpacing: "0.3px"
                      }}>
                        {console.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Console Quantity */}
            {selectedConsole && (
              <div style={{ marginBottom: "32px" }}>
                <label style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#E5E5E7",
                  marginBottom: "14px",
                  letterSpacing: "0.3px"
                }}>
                  Quantity (No. of Consoles)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))", gap: "12px" }}>
                  {Array.from({ length: getMaxConsoleQuantity() }, (_, i) => i + 1).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setConsoleQuantity(num)}
                      style={{
                        padding: "22px 12px",
                        borderRadius: "18px",
                        border: consoleQuantity === num ? "2px solid #10B981" : "1px solid rgba(255, 255, 255, 0.08)",
                        background: consoleQuantity === num
                          ? "linear-gradient(135deg, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0.15) 100%)"
                          : "rgba(15, 15, 20, 0.7)",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        textAlign: "center"
                      }}
                      className="quantity-btn"
                    >
                      <div style={{
                        fontSize: "32px",
                        fontWeight: 800,
                        color: consoleQuantity === num ? "#10B981" : "#E5E5E7",
                        fontFamily: fonts.heading,
                        lineHeight: "1"
                      }}>
                        {num}
                      </div>
                    </button>
                  ))}
                </div>
                <div style={{
                  fontSize: "12px",
                  color: "#999",
                  marginTop: "10px",
                  textAlign: "center"
                }}>
                  {getMaxConsoleQuantity()} {getMaxConsoleQuantity() === 1 ? 'console' : 'consoles'} available
                </div>
              </div>
            )}

            {/* Number of Controllers */}
            {selectedConsole && (
              <div style={{ marginBottom: "32px" }}>
                <label style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#E5E5E7",
                  marginBottom: "14px",
                  letterSpacing: "0.3px"
                }}>
                  No. of Controllers
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  {[1, 2, 3, 4].filter(num => num <= getMaxControllers()).map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setNumControllers(num)}
                      style={{
                        padding: "22px 12px",
                        borderRadius: "18px",
                        border: numControllers === num ? "2px solid #EF4444" : "1px solid rgba(255, 255, 255, 0.08)",
                        background: numControllers === num
                          ? "linear-gradient(135deg, rgba(239, 68, 68, 0.3) 0%, rgba(239, 68, 68, 0.15) 100%)"
                          : "rgba(15, 15, 20, 0.7)",
                        cursor: "pointer",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        textAlign: "center"
                      }}
                      className="controller-btn"
                    >
                      <div style={{
                        fontSize: "32px",
                        fontWeight: 800,
                        color: numControllers === num ? "#EF4444" : "#E5E5E7",
                        fontFamily: fonts.heading,
                        lineHeight: "1"
                      }}>
                        {num}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Duration */}
            {selectedConsole && (
              <div style={{ marginBottom: "36px" }}>
                <label style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#E5E5E7",
                  marginBottom: "14px",
                  letterSpacing: "0.3px"
                }}>
                  Duration
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
                  <button
                    type="button"
                    onClick={() => setDuration(30)}
                    style={{
                      padding: "22px 20px",
                      borderRadius: "18px",
                      border: duration === 30 ? "2px solid #00D9FF" : "1px solid rgba(255, 255, 255, 0.08)",
                      background: duration === 30
                        ? "linear-gradient(135deg, rgba(0, 217, 255, 0.3) 0%, rgba(0, 217, 255, 0.15) 100%)"
                        : "rgba(15, 15, 20, 0.7)",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      textAlign: "center"
                    }}
                    className="duration-btn"
                  >
                    <div style={{
                      fontSize: "32px",
                      fontWeight: 800,
                      color: duration === 30 ? "#00D9FF" : "#E5E5E7",
                      fontFamily: fonts.heading,
                      lineHeight: "1",
                      letterSpacing: "0.5px"
                    }}>
                      30 min
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuration(60)}
                    style={{
                      padding: "22px 20px",
                      borderRadius: "18px",
                      border: duration === 60 ? "2px solid #00D9FF" : "1px solid rgba(255, 255, 255, 0.08)",
                      background: duration === 60
                        ? "linear-gradient(135deg, rgba(0, 217, 255, 0.3) 0%, rgba(0, 217, 255, 0.15) 100%)"
                        : "rgba(15, 15, 20, 0.7)",
                      cursor: "pointer",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      textAlign: "center"
                    }}
                    className="duration-btn"
                  >
                    <div style={{
                      fontSize: "32px",
                      fontWeight: 800,
                      color: duration === 60 ? "#00D9FF" : "#E5E5E7",
                      fontFamily: fonts.heading,
                      lineHeight: "1",
                      letterSpacing: "0.5px"
                    }}>
                      60 min
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Payment Mode */}
            {selectedConsole && (
              <div style={{ marginBottom: "36px" }}>
                <label style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "#E5E5E7",
                  marginBottom: "14px",
                  letterSpacing: "0.3px"
                }}>
                  Payment Mode
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "14px" }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("cash")}
                    style={{
                      padding: "22px 20px",
                      borderRadius: "18px",
                      border: paymentMode === "cash" ? "2px solid #00D9FF" : "1px solid rgba(255, 255, 255, 0.08)",
                      background: paymentMode === "cash"
                        ? "linear-gradient(135deg, rgba(0, 217, 255, 0.1) 0%, rgba(0, 217, 255, 0.05) 100%)"
                        : "rgba(30, 30, 36, 0.6)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <div style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      color: paymentMode === "cash" ? "#00D9FF" : "#E5E5E7",
                      fontFamily: fonts.heading,
                      lineHeight: "1",
                      letterSpacing: "0.5px"
                    }}>
                      💵 Cash
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("upi")}
                    style={{
                      padding: "22px 20px",
                      borderRadius: "18px",
                      border: paymentMode === "upi" ? "2px solid #00D9FF" : "1px solid rgba(255, 255, 255, 0.08)",
                      background: paymentMode === "upi"
                        ? "linear-gradient(135deg, rgba(0, 217, 255, 0.1) 0%, rgba(0, 217, 255, 0.05) 100%)"
                        : "rgba(30, 30, 36, 0.6)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    <div style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      color: paymentMode === "upi" ? "#00D9FF" : "#E5E5E7",
                      fontFamily: fonts.heading,
                      lineHeight: "1",
                      letterSpacing: "0.5px"
                    }}>
                      📱 UPI
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Price Summary */}
            {selectedConsole && (
              <div style={{
                padding: "28px 24px",
                background: "linear-gradient(135deg, rgba(139, 69, 69, 0.2) 0%, rgba(139, 69, 69, 0.08) 100%)",
                borderRadius: "20px",
                marginBottom: "28px",
                border: "1px solid rgba(239, 68, 68, 0.12)",
                boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)"
              }}>
                <div style={{
                  fontSize: "12px",
                  color: "#999",
                  marginBottom: "6px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase"
                }}>
                  Total Amount
                </div>
                <div style={{
                  fontSize: "13px",
                  color: "#B4B4B7",
                  marginBottom: "20px",
                  fontWeight: 400
                }}>
                  Pay at Counter
                </div>
                <div style={{
                  fontSize: "52px",
                  fontWeight: 900,
                  color: "#EF4444",
                  fontFamily: fonts.heading,
                  lineHeight: "1",
                  letterSpacing: "1px"
                }}>
                  ₹{totalPrice}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedConsole}
              style={{
                width: "100%",
                padding: "20px 24px",
                background: selectedConsole && !submitting
                  ? "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)"
                  : "rgba(255, 255, 255, 0.04)",
                border: "none",
                borderRadius: "18px",
                color: selectedConsole ? "#FFFFFF" : "#555",
                fontFamily: fonts.heading,
                fontSize: "15px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "2.5px",
                cursor: selectedConsole && !submitting ? "pointer" : "not-allowed",
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: selectedConsole && !submitting
                  ? "0 8px 24px rgba(239, 68, 68, 0.25)"
                  : "none"
              }}
              className="submit-btn"
            >
              {submitting ? "PROCESSING..." : "CONFIRM BOOKING"}
            </button>
          </div>
        </form>
      </div>

      {/* Styles */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .form-input:focus {
          outline: none;
          border-color: #00D9FF !important;
          box-shadow: 0 0 0 4px rgba(0, 217, 255, 0.1);
        }

        .form-input::placeholder {
          color: #666;
        }

        .console-btn:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .quantity-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 8px 16px rgba(16, 185, 129, 0.2);
        }

        .controller-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 8px 16px rgba(239, 68, 68, 0.2);
        }

        .duration-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 8px 16px rgba(0, 217, 255, 0.2);
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(239, 68, 68, 0.3);
        }

        .submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .close-modal-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 12px 32px rgba(16, 185, 129, 0.4) !important;
        }

        .close-modal-btn:active {
          transform: scale(0.98);
        }
      `}</style>
    </div>
  );
}
