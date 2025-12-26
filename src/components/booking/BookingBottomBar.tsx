// src/components/booking/BookingBottomBar.tsx
/**
 * Fixed bottom bar with step-specific CTAs and booking summary
 */

import { colors, fonts } from "@/lib/constants";

interface BookingBottomBarProps {
  step: 1 | 2;

  // Step 1 props
  selectedDate?: string;
  selectedTime?: string;
  dateLabel?: string;
  onContinue?: () => void;

  // Step 2 props
  totalTickets?: number;
  totalAmount?: number;
  isSubmitting?: boolean;
  onConfirm?: () => void;
}

export function BookingBottomBar({
  step,
  selectedDate,
  selectedTime,
  dateLabel,
  onContinue,
  totalTickets = 0,
  totalAmount = 0,
  isSubmitting = false,
  onConfirm,
}: BookingBottomBarProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "rgba(15, 15, 20, 0.95)",
        backdropFilter: "blur(20px)",
        borderTop: `1px solid ${colors.border}`,
        padding: "16px",
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        {step === 1 ? (
          <>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: colors.textPrimary }}>
                {selectedDate ? dateLabel : "Select a date"}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: selectedTime ? colors.cyan : colors.textMuted,
                }}
              >
                {selectedTime || "Select a time"}
              </div>
            </div>
            <button
              onClick={onContinue}
              disabled={!selectedDate || !selectedTime}
              style={{
                padding: "14px 28px",
                background:
                  selectedDate && selectedTime
                    ? `linear-gradient(135deg, ${colors.red} 0%, #ff3366 100%)`
                    : "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "12px",
                color: selectedDate && selectedTime ? "white" : colors.textMuted,
                fontFamily: fonts.heading,
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: selectedDate && selectedTime ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
              }}
            >
              Continue →
            </button>
          </>
        ) : (
          <>
            <div>
              {totalTickets > 0 ? (
                <>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: colors.textPrimary,
                    }}
                  >
                    {totalTickets} ticket{totalTickets > 1 ? "s" : ""} selected
                  </div>
                  <div style={{ fontSize: "13px", color: colors.textSecondary }}>
                    {dateLabel} • {selectedTime}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: "14px", color: colors.textMuted }}>
                  Add tickets to continue
                </div>
              )}
            </div>
            <button
              onClick={onConfirm}
              disabled={totalTickets === 0 || isSubmitting}
              style={{
                padding: "14px 24px",
                background:
                  totalTickets > 0 && !isSubmitting
                    ? `linear-gradient(135deg, ${colors.green} 0%, #16a34a 100%)`
                    : "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "12px",
                color: totalTickets > 0 ? "white" : colors.textMuted,
                fontFamily: fonts.heading,
                fontSize: "13px",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "1px",
                cursor: totalTickets > 0 && !isSubmitting ? "pointer" : "not-allowed",
                transition: "all 0.2s ease",
                minWidth: "140px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isSubmitting && (
                <div
                  style={{
                    width: "14px",
                    height: "14px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
              )}
              {isSubmitting
                ? "Processing..."
                : totalTickets > 0
                ? `Pay ₹${totalAmount}`
                : "Select Tickets"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
