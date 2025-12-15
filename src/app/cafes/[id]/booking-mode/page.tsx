"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function BookingModePage() {
  const router = useRouter();
  const params = useParams();
  const cafeId = params?.id as string;

  const [cafeName, setCafeName] = useState("Gaming Café");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCafe() {
      if (!cafeId) return;

      try {
        const { data } = await supabase
          .from("cafes")
          .select("name")
          .eq("id", cafeId)
          .maybeSingle();

        if (data) {
          setCafeName(data.name);
        }
      } catch (err) {
        console.error("Error loading cafe:", err);
      } finally {
        setLoading(false);
      }
    }

    loadCafe();
  }, [cafeId]);

  const handleModeSelect = (mode: "advance" | "walkin") => {
    if (mode === "walkin") {
      router.push(`/cafes/${cafeId}/book?mode=walkin`);
    } else {
      router.push(`/cafes/${cafeId}/book`);
    }
  };

  const fonts = {
    heading: "'Orbitron', sans-serif",
    body: "'Rajdhani', sans-serif",
  };

  const colors = {
    red: "#ff073a",
    cyan: "#00f0ff",
    dark: "#08080c",
    cardBg: "rgba(18, 18, 24, 0.9)",
    border: "rgba(255, 255, 255, 0.08)",
    textPrimary: "#ffffff",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",
  };

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
        href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800&family=Rajdhani:wght@400;600&display=swap"
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
          maxWidth: "480px",
          margin: "0 auto",
          padding: "20px 16px 32px",
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Back Button */}
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
            padding: "12px 0",
            marginBottom: "20px",
            minHeight: "44px",
          }}
        >
          <span style={{ fontSize: "20px" }}>←</span>
          Back
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <p
            style={{
              fontSize: "11px",
              color: colors.cyan,
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: "10px",
              fontWeight: 600,
            }}
          >
            {loading ? "Loading..." : cafeName}
          </p>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "24px",
              fontWeight: 800,
              background: `linear-gradient(135deg, ${colors.textPrimary} 0%, ${colors.cyan} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "10px",
              lineHeight: "1.3",
            }}
          >
            Choose Booking Type
          </h1>
          <p
            style={{
              fontSize: "13px",
              color: colors.textSecondary,
              lineHeight: "1.5",
              maxWidth: "320px",
              margin: "0 auto",
            }}
          >
            Select how you'd like to book your gaming session
          </p>
        </div>

        {/* Booking Mode Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Walk-in Booking Card - PRIMARY OPTION */}
          <button
            onClick={() => handleModeSelect("walkin")}
            style={{
              padding: "24px 20px",
              background: `linear-gradient(135deg, rgba(255, 7, 58, 0.12) 0%, rgba(255, 7, 58, 0.06) 100%)`,
              border: `2px solid rgba(255, 7, 58, 0.35)`,
              borderRadius: "18px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
              position: "relative",
              overflow: "hidden",
              minHeight: "200px",
            }}
            className="booking-card-primary"
          >
            {/* Icon */}
            <div
              style={{
                width: "52px",
                height: "52px",
                background: `linear-gradient(135deg, ${colors.red} 0%, #cc0033 100%)`,
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "26px",
                marginBottom: "16px",
                boxShadow: `0 6px 20px rgba(255, 7, 58, 0.35)`,
              }}
            >
              🚶‍♂️
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "20px",
                fontWeight: 700,
                color: colors.red,
                marginBottom: "10px",
                paddingRight: "80px",
                lineHeight: "1.3",
              }}
            >
              Walk-in Booking
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "13px",
                color: colors.textSecondary,
                lineHeight: "1.6",
                marginBottom: "14px",
                paddingRight: "40px",
              }}
            >
              Already at the café? Book instantly and start playing now
            </p>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.red, fontSize: "14px" }}>✓</span>
                <span style={{ fontSize: "12px", color: colors.textMuted }}>
                  Instant booking
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.red, fontSize: "14px" }}>✓</span>
                <span style={{ fontSize: "12px", color: colors.textMuted }}>
                  Play immediately
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.red, fontSize: "14px" }}>✓</span>
                <span style={{ fontSize: "12px", color: colors.textMuted }}>
                  No wait time
                </span>
              </div>
            </div>

            {/* Badge */}
            <div
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                padding: "6px 12px",
                background: colors.red,
                borderRadius: "999px",
                fontSize: "10px",
                fontWeight: 700,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Instant
            </div>

            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                right: "20px",
                bottom: "20px",
                fontSize: "24px",
                color: colors.red,
              }}
            >
              →
            </div>
          </button>

          {/* Advance Booking Card - SECONDARY OPTION */}
          <button
            onClick={() => handleModeSelect("advance")}
            style={{
              padding: "20px 18px",
              background: `linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(0, 240, 255, 0.03) 100%)`,
              border: `1.5px solid rgba(0, 240, 255, 0.25)`,
              borderRadius: "16px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              textAlign: "left",
              position: "relative",
              overflow: "hidden",
              minHeight: "160px",
            }}
            className="booking-card-secondary"
          >
            {/* Icon */}
            <div
              style={{
                width: "44px",
                height: "44px",
                background: `linear-gradient(135deg, ${colors.cyan} 0%, #0088cc 100%)`,
                borderRadius: "11px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "22px",
                marginBottom: "14px",
                boxShadow: `0 4px 16px rgba(0, 240, 255, 0.25)`,
              }}
            >
              📅
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "18px",
                fontWeight: 700,
                color: colors.cyan,
                marginBottom: "9px",
                paddingRight: "60px",
                lineHeight: "1.3",
              }}
            >
              Advance Booking
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "12px",
                color: colors.textSecondary,
                lineHeight: "1.6",
                marginBottom: "12px",
                paddingRight: "40px",
              }}
            >
              Plan ahead and book for any future date & time
            </p>

            {/* Features - Compact */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.cyan, fontSize: "12px" }}>✓</span>
                <span style={{ fontSize: "11px", color: colors.textMuted }}>
                  Choose future dates
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.cyan, fontSize: "12px" }}>✓</span>
                <span style={{ fontSize: "11px", color: colors.textMuted }}>
                  Guaranteed slot
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                right: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "18px",
                color: colors.cyan,
                opacity: 0.6,
              }}
            >
              →
            </div>
          </button>
        </div>

        {/* Help Text */}
        <div
          style={{
            marginTop: "24px",
            padding: "14px 16px",
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "12px", color: colors.textMuted, lineHeight: "1.6" }}>
            💡 <strong style={{ color: colors.textSecondary }}>Tip:</strong> Walk-in for instant play, Advance for planning ahead
          </p>
        </div>
      </div>

      {/* Mobile-First Responsive Styles */}
      <style>{`
        /* Mobile touch optimization */
        @media (hover: none) {
          .booking-card-primary:active {
            transform: scale(0.98);
            opacity: 0.95;
          }

          .booking-card-secondary:active {
            transform: scale(0.98);
            opacity: 0.95;
          }
        }

        /* Desktop hover effects */
        @media (hover: hover) {
          .booking-card-primary:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(255, 7, 58, 0.35);
          }

          .booking-card-secondary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 22px rgba(0, 240, 255, 0.25);
            border-color: rgba(0, 240, 255, 0.4);
          }
        }

        /* Smooth transitions */
        .booking-card-primary,
        .booking-card-secondary {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }

        /* Small mobile adjustments */
        @media (max-width: 380px) {
          .booking-card-primary {
            padding: 20px 16px !important;
            min-height: 180px !important;
          }

          .booking-card-secondary {
            padding: 18px 16px !important;
            min-height: 150px !important;
          }
        }
      `}</style>
    </div>
  );
}
