// src/components/booking/DatePicker.tsx
/**
 * Horizontal scrollable date picker for selecting booking date
 */

import { colors, fonts } from "@/lib/constants";
import { DayOption } from "@/types/booking";

interface DatePickerProps {
  dates: DayOption[];
  selectedDate: string;
  onSelect: (date: string) => void;
}

export function DatePicker({ dates, selectedDate, onSelect }: DatePickerProps) {
  return (
    <section>
      <h2
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: colors.textSecondary,
          marginBottom: "12px",
        }}
      >
        📅 Select Date
      </h2>

      <div
        style={{
          display: "flex",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "8px",
          scrollbarWidth: "none",
        }}
      >
        {dates.map((day) => {
          const isActive = day.key === selectedDate;
          return (
            <button
              key={day.key}
              onClick={() => onSelect(day.key)}
              style={{
                flexShrink: 0,
                width: "68px",
                padding: "10px 6px",
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
                boxShadow: isActive ? `0 0 20px rgba(255, 7, 58, 0.3)` : "none",
                minHeight: "48px",
              }}
              className="date-button"
            >
              <div
                style={{
                  fontSize: "11px",
                  color: day.isToday ? colors.cyan : colors.textMuted,
                  marginBottom: "4px",
                  fontWeight: 500,
                }}
              >
                {day.isToday ? "TODAY" : day.dayName}
              </div>
              <div
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "20px",
                  fontWeight: 700,
                  color: isActive ? colors.red : colors.textPrimary,
                }}
              >
                {day.dayNum}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: colors.textMuted,
                  marginTop: "2px",
                }}
              >
                {day.month}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
