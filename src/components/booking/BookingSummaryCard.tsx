// src/components/booking/BookingSummaryCard.tsx
/**
 * Compact summary card showing selected date, time, and duration
 * Appears at top of Step 2 with "Change" button
 */

import { colors, fonts } from "@/lib/constants";

interface BookingSummaryCardProps {
  dateLabel: string;
  selectedTime: string;
  endTime: string;
  duration: 30 | 60 | 90;
  onChangeDateTime: () => void;
}

export function BookingSummaryCard({
  dateLabel,
  selectedTime,
  endTime,
  duration,
  onChangeDateTime,
}: BookingSummaryCardProps) {
  const durationText = duration === 30 ? "30 min" : duration === 60 ? "1 hour" : "1.5 hours";

  return (
    <div
      style={{
        background: `linear-gradient(135deg, rgba(0, 240, 255, 0.08) 0%, rgba(0, 240, 255, 0.03) 100%)`,
        border: `1px solid rgba(0, 240, 255, 0.25)`,
        borderRadius: "16px",
        padding: "18px 20px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0, 240, 255, 0.08)",
      }}
    >
      {/* Glowing circle background effect */}
      <div
        style={{
          position: "absolute",
          top: "-30px",
          right: "-30px",
          width: "100px",
          height: "100px",
          background: `radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: "11px",
                color: colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "6px",
              }}
            >
              📅 Your Booking
            </div>
            <div
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: colors.textPrimary,
                fontFamily: fonts.heading,
                marginBottom: "4px",
              }}
            >
              {dateLabel}
            </div>
            <div
              style={{
                fontSize: "15px",
                color: colors.cyan,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span>⏰</span>
              {selectedTime} - {endTime}
            </div>
          </div>
          <button
            onClick={onChangeDateTime}
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
            <span>{durationText}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
