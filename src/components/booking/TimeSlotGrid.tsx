// src/components/booking/TimeSlotGrid.tsx
/**
 * 3-column grid for selecting time slots with peak hours indicator
 */

import { colors } from "@/lib/constants";
import { TimeSlot } from "@/types/booking";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedTime: string;
  onSelect: (time: string) => void;
  peakHoursMessage?: string;
}

export function TimeSlotGrid({
  slots,
  selectedTime,
  onSelect,
  peakHoursMessage = "Peak hours (6 PM - 10 PM) may have higher demand",
}: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div
        style={{
          padding: "32px 20px",
          background: colors.darkCard,
          borderRadius: "12px",
          border: `1px solid ${colors.border}`,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "32px", marginBottom: "12px" }}>😔</div>
        <p style={{ fontSize: "14px", color: colors.textSecondary, marginBottom: "8px" }}>
          No slots available for today
        </p>
        <p style={{ fontSize: "12px", color: colors.textMuted }}>
          Please select another date
        </p>
      </div>
    );
  }

  return (
    <section>
      <h2
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: colors.textSecondary,
          marginBottom: "12px",
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}
        className="section-heading"
      >
        ⏰ Select Time
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}
        className="time-grid"
      >
        {slots.map((slot) => {
          const isActive = slot.label === selectedTime;
          return (
            <button
              key={slot.label}
              onClick={() => onSelect(slot.label)}
              style={{
                padding: "10px 6px",
                minHeight: "44px",
                borderRadius: "8px",
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
              className="time-button"
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: isActive ? colors.red : colors.textPrimary,
                }}
              >
                {slot.label}
              </div>
              {slot.isPeak && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#f59e0b",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      <p
        style={{
          fontSize: "12px",
          color: colors.textMuted,
          marginTop: "12px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#f59e0b",
            display: "inline-block",
          }}
        />
        {peakHoursMessage}
      </p>
    </section>
  );
}
