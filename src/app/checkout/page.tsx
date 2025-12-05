// src/app/checkout/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";

type DraftTicket = {
  ticketId: string;
  console: string;
  title: string;
  price: number;
  quantity: number;
};

type CheckoutDraft = {
  cafeId: string;
  cafeName?: string;
  bookingDate: string;
  timeSlot: string;
  tickets: DraftTicket[];
  totalAmount: number;
};

// ============ STYLES ============
const colors = {
  red: "#ff073a",
  cyan: "#00f0ff",
  dark: "#08080c",
  darkCard: "#0f0f14",
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  green: "#22c55e",
  greenDark: "#16a34a",
  orange: "#f59e0b",
};

const fonts = {
  heading: "'Orbitron', sans-serif",
  body: "'Rajdhani', sans-serif",
};

// Console icons mapping
const consoleIcons: Record<string, string> = {
  ps5: "🎮",
  ps4: "🎮",
  xbox: "🎮",
  pc: "💻",
  pool: "🎱",
  arcade: "🕹️",
  snooker: "🎱",
  vr: "🥽",
  steering: "🏎️",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useUser();

  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [offerCode, setOfferCode] = useState("");
  const [offerApplied, setOfferApplied] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [showOfferInput, setShowOfferInput] = useState(false);

  // Load draft from sessionStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("checkoutDraft");
    if (!raw) {
      setLoadingDraft(false);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as CheckoutDraft;
      setDraft(parsed);
    } catch (err) {
      console.error("Failed to parse checkoutDraft", err);
    } finally {
      setLoadingDraft(false);
    }
  }, []);

  // Amount calculations
  const baseAmount = draft?.totalAmount ?? 0;
  const convenienceFee = 13;
  const offerDiscount = offerApplied ? Math.min(baseAmount * 0.2, 150) : 0;
  const grandTotal = Math.max(baseAmount + convenienceFee - offerDiscount, 0);

  const ticketsCount = useMemo(() => {
    if (!draft) return 0;
    return draft.tickets.reduce((sum, t) => sum + (t.quantity ?? 0), 0);
  }, [draft]);

  const dateLabel = useMemo(() => {
    if (!draft?.bookingDate) return "";
    const d = new Date(`${draft.bookingDate}T00:00:00`);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [draft]);

  // Apply offer
  function handleApplyOffer() {
    if (offerCode.toLowerCase() === "game20" || offerCode.toLowerCase() === "first50") {
      setOfferApplied(true);
      setShowOfferInput(false);
    } else {
      alert("Invalid offer code. Try GAME20 or FIRST50");
    }
  }

  // Main pay handler
  async function handlePayClick() {
    if (!draft) {
      alert("No booking data found. Please start again.");
      return;
    }
    if (!user) {
      alert("Please login to complete your booking.");
      router.push("/login");
      return;
    }

    setIsPaying(true);

    try {
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: draft.cafeId,
          user_id: user.id,
          booking_date: draft.bookingDate,
          start_time: draft.timeSlot,
          total_amount: grandTotal,
          status: "confirmed",
        })
        .select("id")
        .single();

      if (bookingError) {
        console.error("Booking insert error:", bookingError);
        throw bookingError;
      }

      const bookingId = booking.id as string;

      const itemsPayload = draft.tickets.map((t) => ({
        booking_id: bookingId,
        ticket_id: t.ticketId,
        console: t.console,
        title: t.title,
        price: t.price,
        quantity: t.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("booking_items")
        .insert(itemsPayload);

      if (itemsError) {
        console.error("Booking items insert error:", itemsError);
        throw itemsError;
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("checkoutDraft");
      }

      router.replace(`/bookings/${bookingId}/success`);
    } catch (err: any) {
      console.error("Error while creating booking:", err);
      alert(`Could not complete booking. Please try again.\n\n${err?.message ?? ""}`);
    } finally {
      setIsPaying(false);
    }
  }

  // Loading state
  if (loadingDraft) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.body,
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: "48px",
            height: "48px",
            border: `3px solid ${colors.border}`,
            borderTopColor: colors.red,
            borderRadius: "50%",
            margin: "0 auto 16px",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ color: colors.textSecondary, fontSize: "14px" }}>Loading checkout...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // No draft state
  if (!draft) {
    return (
      <div style={{
        minHeight: "100vh",
        background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: fonts.body,
        padding: "20px",
      }}>
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Rajdhani:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎮</div>
        <h1 style={{
          fontFamily: fonts.heading,
          fontSize: "20px",
          color: colors.textPrimary,
          marginBottom: "12px",
        }}>
          Session Expired
        </h1>
        <p style={{
          color: colors.textSecondary,
          fontSize: "14px",
          marginBottom: "24px",
          textAlign: "center",
        }}>
          Your checkout session has expired.<br />Please start a new booking.
        </p>
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "14px 28px",
            background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
            border: "none",
            borderRadius: "12px",
            color: "white",
            fontFamily: fonts.heading,
            fontSize: "13px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "1px",
            cursor: "pointer",
          }}
        >
          Browse Cafés
        </button>
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
        padding: "20px 16px 160px",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Header */}
        <header style={{ marginBottom: "24px" }}>
          <button
            onClick={() => router.back()}
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
            Back
          </button>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <div>
              <p style={{
                fontSize: "12px",
                color: colors.cyan,
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "4px",
              }}>
                Checkout
              </p>
              <h1 style={{
                fontFamily: fonts.heading,
                fontSize: "22px",
                fontWeight: 700,
                color: colors.textPrimary,
                margin: 0,
              }}>
                Order Summary
              </h1>
            </div>
            
            {/* Secure badge */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              background: "rgba(34, 197, 94, 0.1)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              borderRadius: "20px",
            }}>
              <span style={{ fontSize: "12px" }}>🔒</span>
              <span style={{
                fontSize: "11px",
                color: colors.green,
                fontWeight: 600,
              }}>
                Secure
              </span>
            </div>
          </div>
        </header>

        {/* Booking Info Card */}
        <section style={{
          background: `linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, ${colors.darkCard} 100%)`,
          border: `1px solid rgba(0, 240, 255, 0.2)`,
          borderRadius: "16px",
          padding: "20px",
          marginBottom: "20px",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* Top accent */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "2px",
            background: `linear-gradient(90deg, ${colors.cyan}, transparent)`,
          }} />

          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "16px",
          }}>
            {/* Cafe icon */}
            <div style={{
              width: "56px",
              height: "56px",
              background: `linear-gradient(135deg, ${colors.cyan}20 0%, ${colors.cyan}10 100%)`,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              flexShrink: 0,
            }}>
              🎮
            </div>

            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: "16px",
                fontWeight: 600,
                color: colors.textPrimary,
                marginBottom: "8px",
              }}>
                {draft.cafeName || "Gaming Café"}
              </h2>
              
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "12px",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <span style={{ fontSize: "14px" }}>📅</span>
                  <span style={{
                    fontSize: "13px",
                    color: colors.textSecondary,
                  }}>
                    {dateLabel}
                  </span>
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <span style={{ fontSize: "14px" }}>⏰</span>
                  <span style={{
                    fontSize: "13px",
                    color: colors.cyan,
                    fontWeight: 600,
                  }}>
                    {draft.timeSlot}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tickets Section */}
        <section style={{ marginBottom: "20px" }}>
          <h3 style={{
            fontSize: "12px",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>🎟️</span> Your Tickets
          </h3>

          <div style={{
            background: colors.darkCard,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            overflow: "hidden",
          }}>
            {draft.tickets.map((ticket, index) => (
              <div
                key={ticket.ticketId}
                style={{
                  padding: "16px",
                  borderBottom: index < draft.tickets.length - 1 
                    ? `1px solid ${colors.border}` 
                    : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    background: `linear-gradient(135deg, ${colors.red}20 0%, ${colors.red}10 100%)`,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}>
                    {consoleIcons[ticket.console] || "🎮"}
                  </div>
                  <div>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.textPrimary,
                      marginBottom: "2px",
                    }}>
                      {ticket.title}
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                    }}>
                      {ticket.quantity} × ₹{ticket.price}
                    </div>
                  </div>
                </div>
                <div style={{
                  fontFamily: fonts.heading,
                  fontSize: "16px",
                  fontWeight: 600,
                  color: colors.cyan,
                }}>
                  ₹{ticket.price * ticket.quantity}
                </div>
              </div>
            ))}

            {/* Subtotal */}
            <div style={{
              padding: "14px 16px",
              background: "rgba(255, 255, 255, 0.02)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: "13px",
                color: colors.textSecondary,
              }}>
                Subtotal ({ticketsCount} ticket{ticketsCount > 1 ? "s" : ""})
              </span>
              <span style={{
                fontSize: "15px",
                fontWeight: 600,
                color: colors.textPrimary,
              }}>
                ₹{baseAmount}
              </span>
            </div>
          </div>
        </section>

        {/* Offers Section */}
        <section style={{ marginBottom: "20px" }}>
          <h3 style={{
            fontSize: "12px",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>🎁</span> Offers & Discounts
          </h3>

          <div style={{
            background: colors.darkCard,
            border: `1px solid ${offerApplied ? colors.green + "40" : colors.border}`,
            borderRadius: "16px",
            padding: "16px",
          }}>
            {offerApplied ? (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    background: `linear-gradient(135deg, ${colors.green}30 0%, ${colors.green}15 100%)`,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}>
                    ✓
                  </div>
                  <div>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.green,
                      marginBottom: "2px",
                    }}>
                      Offer Applied!
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                    }}>
                      20% OFF up to ₹150
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setOfferApplied(false)}
                  style={{
                    padding: "8px 14px",
                    background: "transparent",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "8px",
                    color: colors.textMuted,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
            ) : showOfferInput ? (
              <div>
                <div style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "12px",
                }}>
                  <input
                    type="text"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    placeholder="Enter offer code"
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid ${colors.border}`,
                      borderRadius: "10px",
                      color: colors.textPrimary,
                      fontSize: "14px",
                      fontFamily: fonts.body,
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleApplyOffer}
                    style={{
                      padding: "12px 20px",
                      background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`,
                      border: "none",
                      borderRadius: "10px",
                      color: "white",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Apply
                  </button>
                </div>
                <p style={{
                  fontSize: "12px",
                  color: colors.textMuted,
                }}>
                  💡 Try: GAME20 or FIRST50
                </p>
              </div>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    background: `linear-gradient(135deg, ${colors.orange}20 0%, ${colors.orange}10 100%)`,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                  }}>
                    %
                  </div>
                  <div>
                    <div style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.textPrimary,
                      marginBottom: "2px",
                    }}>
                      Have an offer code?
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: colors.textMuted,
                    }}>
                      Get up to 20% OFF
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowOfferInput(true)}
                  style={{
                    padding: "10px 18px",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: "10px",
                    color: colors.cyan,
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add Code
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Payment Details */}
        <section style={{ marginBottom: "20px" }}>
          <h3 style={{
            fontSize: "12px",
            color: colors.textMuted,
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            marginBottom: "12px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <span>💳</span> Payment Details
          </h3>

          <div style={{
            background: colors.darkCard,
            border: `1px solid ${colors.border}`,
            borderRadius: "16px",
            padding: "16px",
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
            }}>
              <span style={{ fontSize: "14px", color: colors.textSecondary }}>
                Ticket Amount
              </span>
              <span style={{ fontSize: "14px", color: colors.textPrimary }}>
                ₹{baseAmount}
              </span>
            </div>

            <div style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 0",
            }}>
              <span style={{ fontSize: "14px", color: colors.textSecondary }}>
                Convenience Fee
              </span>
              <span style={{ fontSize: "14px", color: colors.textPrimary }}>
                ₹{convenienceFee}
              </span>
            </div>

            {offerApplied && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "8px 0",
              }}>
                <span style={{ fontSize: "14px", color: colors.green }}>
                  Offer Discount
                </span>
                <span style={{ fontSize: "14px", color: colors.green }}>
                  − ₹{offerDiscount.toFixed(0)}
                </span>
              </div>
            )}

            <div style={{
              borderTop: `1px dashed ${colors.border}`,
              marginTop: "8px",
              paddingTop: "12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{
                fontSize: "16px",
                fontWeight: 600,
                color: colors.textPrimary,
              }}>
                Total Amount
              </span>
              <span style={{
                fontFamily: fonts.heading,
                fontSize: "24px",
                fontWeight: 700,
                color: colors.cyan,
              }}>
                ₹{grandTotal}
              </span>
            </div>
          </div>
        </section>

        {/* Booking Info Note */}
        <section>
          <div style={{
            background: "rgba(0, 240, 255, 0.05)",
            border: `1px solid rgba(0, 240, 255, 0.15)`,
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
          }}>
            <span style={{ fontSize: "18px" }}>ℹ️</span>
            <p style={{
              fontSize: "13px",
              color: colors.textSecondary,
              lineHeight: 1.5,
              margin: 0,
            }}>
              Booking confirmation will be sent to your registered email address. 
              Please show the confirmation at the venue.
            </p>
          </div>
        </section>
      </div>

      {/* Bottom Payment Bar */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(15, 15, 20, 0.98)",
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${colors.border}`,
        padding: "16px",
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: "600px",
          margin: "0 auto",
        }}>
          {/* Savings banner */}
          {offerApplied && (
            <div style={{
              background: `linear-gradient(90deg, ${colors.green}20 0%, transparent 100%)`,
              borderRadius: "8px",
              padding: "8px 12px",
              marginBottom: "12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}>
              <span style={{ fontSize: "14px" }}>🎉</span>
              <span style={{
                fontSize: "13px",
                color: colors.green,
                fontWeight: 600,
              }}>
                You're saving ₹{offerDiscount.toFixed(0)} on this order!
              </span>
            </div>
          )}

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}>
            <div>
              <div style={{
                fontSize: "12px",
                color: colors.textMuted,
                marginBottom: "2px",
              }}>
                Amount Payable
              </div>
              <div style={{
                fontFamily: fonts.heading,
                fontSize: "28px",
                fontWeight: 700,
                color: colors.textPrimary,
              }}>
                ₹{grandTotal}
              </div>
            </div>

            <button
              disabled={isPaying}
              onClick={handlePayClick}
              style={{
                padding: "16px 32px",
                background: isPaying
                  ? "rgba(255, 255, 255, 0.1)"
                  : `linear-gradient(135deg, ${colors.green} 0%, ${colors.greenDark} 100%)`,
                border: "none",
                borderRadius: "14px",
                color: isPaying ? colors.textMuted : "white",
                fontFamily: fonts.heading,
                fontSize: "14px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: isPaying ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: isPaying ? "none" : `0 8px 32px ${colors.green}40`,
                transition: "all 0.2s ease",
              }}
            >
              {isPaying ? (
                <>
                  <span style={{
                    width: "16px",
                    height: "16px",
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  🎮 Pay Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        input::placeholder {
          color: ${colors.textMuted};
        }
      `}</style>
    </div>
  );
}