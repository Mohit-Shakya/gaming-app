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
          maxWidth: "600px",
          margin: "0 auto",
          padding: "24px 16px",
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
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
            padding: "0",
            marginBottom: "32px",
            position: "absolute",
            top: "24px",
            left: "16px",
          }}
        >
          <span style={{ fontSize: "18px" }}>←</span>
          Back
        </button>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <p
            style={{
              fontSize: "12px",
              color: colors.cyan,
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: "12px",
            }}
          >
            {loading ? "Loading..." : cafeName}
          </p>
          <h1
            style={{
              fontFamily: fonts.heading,
              fontSize: "28px",
              fontWeight: 800,
              background: `linear-gradient(135deg, ${colors.textPrimary} 0%, ${colors.cyan} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "12px",
            }}
          >
            Choose Booking Type
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: colors.textSecondary,
              lineHeight: "1.6",
            }}
          >
            Select how you'd like to book your gaming session
          </p>
        </div>

        {/* Booking Mode Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Advance Booking Card */}
          <button
            onClick={() => handleModeSelect("advance")}
            style={{
              padding: "32px 24px",
              background: `linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%)`,
              border: `2px solid rgba(0, 240, 255, 0.3)`,
              borderRadius: "20px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              textAlign: "left",
              position: "relative",
              overflow: "hidden",
            }}
            className="booking-card"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 32px rgba(0, 240, 255, 0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                background: `linear-gradient(135deg, ${colors.cyan} 0%, #0088cc 100%)`,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "20px",
                boxShadow: `0 8px 24px rgba(0, 240, 255, 0.3)`,
              }}
            >
              📅
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "22px",
                fontWeight: 700,
                color: colors.cyan,
                marginBottom: "12px",
              }}
            >
              Advance Booking
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "14px",
                color: colors.textSecondary,
                lineHeight: "1.6",
                marginBottom: "16px",
              }}
            >
              Book your slot in advance. Perfect for planning your gaming sessions ahead of time.
            </p>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.cyan }}>✓</span>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>
                  Choose any date & time
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.cyan }}>✓</span>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>
                  Guaranteed slot reservation
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.cyan }}>✓</span>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>
                  Plan ahead for weekends
                </span>
              </div>
            </div>

            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                right: "24px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "24px",
                color: colors.cyan,
              }}
            >
              →
            </div>
          </button>

          {/* Walk-in Booking Card */}
          <button
            onClick={() => handleModeSelect("walkin")}
            style={{
              padding: "32px 24px",
              background: `linear-gradient(135deg, rgba(255, 7, 58, 0.1) 0%, rgba(255, 7, 58, 0.05) 100%)`,
              border: `2px solid rgba(255, 7, 58, 0.3)`,
              borderRadius: "20px",
              cursor: "pointer",
              transition: "all 0.3s ease",
              textAlign: "left",
              position: "relative",
              overflow: "hidden",
            }}
            className="booking-card"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = `0 12px 32px rgba(255, 7, 58, 0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: "56px",
                height: "56px",
                background: `linear-gradient(135deg, ${colors.red} 0%, #cc0033 100%)`,
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                marginBottom: "20px",
                boxShadow: `0 8px 24px rgba(255, 7, 58, 0.3)`,
              }}
            >
              🚶‍♂️
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "22px",
                fontWeight: 700,
                color: colors.red,
                marginBottom: "12px",
              }}
            >
              Walk-in Booking
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: "14px",
                color: colors.textSecondary,
                lineHeight: "1.6",
                marginBottom: "16px",
              }}
            >
              Already at the café? Book instantly for immediate play. Perfect for spontaneous gaming.
            </p>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.red }}>✓</span>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>
                  Instant booking (today only)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.red }}>✓</span>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>
                  Start playing immediately
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: colors.red }}>✓</span>
                <span style={{ fontSize: "13px", color: colors.textMuted }}>
                  No date/time selection needed
                </span>
              </div>
            </div>

            {/* Badge */}
            <div
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                padding: "4px 12px",
                background: colors.red,
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 700,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Quick
            </div>

            {/* Arrow */}
            <div
              style={{
                position: "absolute",
                right: "24px",
                bottom: "24px",
                fontSize: "24px",
                color: colors.red,
              }}
            >
              →
            </div>
          </button>
        </div>

        {/* Help Text */}
        <div
          style={{
            marginTop: "32px",
            padding: "16px",
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${colors.border}`,
            borderRadius: "12px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "13px", color: colors.textMuted, lineHeight: "1.6" }}>
            💡 <strong style={{ color: colors.textSecondary }}>Tip:</strong> Use Advance Booking for planning ahead, or Walk-in Booking if you're already at the café
          </p>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        .booking-card {
          box-shadow: none;
        }

        @media (max-width: 640px) {
          .booking-card {
            padding: 24px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
