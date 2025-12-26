// src/components/booking/SoldOutMessage.tsx
/**
 * Message displayed when a console is fully booked for the selected time slot
 */

import { colors } from "@/lib/constants";

interface SoldOutMessageProps {
  consoleName: string;
  selectedTime: string;
  endTime: string;
  nextAvailableAt?: string | null;
}

export function SoldOutMessage({
  consoleName,
  selectedTime,
  endTime,
  nextAvailableAt,
}: SoldOutMessageProps) {
  return (
    <div
      style={{
        padding: "32px 20px",
        background: colors.darkCard,
        borderRadius: "14px",
        border: `1px solid rgba(239, 68, 68, 0.2)`,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>😔</div>
      <p
        style={{
          fontSize: "15px",
          fontWeight: 600,
          color: "#ef4444",
          marginBottom: "8px",
        }}
      >
        Sold Out for This Time Slot
      </p>
      <p
        style={{
          fontSize: "13px",
          color: colors.textMuted,
          marginBottom: "12px",
        }}
      >
        All {consoleName} setups are booked for {selectedTime} - {endTime}.
      </p>
      {nextAvailableAt && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: `rgba(0, 240, 255, 0.1)`,
            border: `1px solid rgba(0, 240, 255, 0.2)`,
            borderRadius: "10px",
            marginBottom: "12px",
          }}
        >
          <span style={{ fontSize: "16px" }}>🕐</span>
          <span
            style={{
              fontSize: "13px",
              color: colors.cyan,
              fontWeight: 500,
            }}
          >
            Available from {nextAvailableAt}
          </span>
        </div>
      )}
      <p style={{ fontSize: "12px", color: colors.textMuted }}>
        Try selecting a different time or console.
      </p>
    </div>
  );
}
