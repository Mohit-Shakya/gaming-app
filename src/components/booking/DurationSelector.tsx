// src/components/booking/DurationSelector.tsx
/**
 * Duration selector with 30/60/90 minute options
 */

import { colors, fonts } from "@/lib/constants";

interface DurationSelectorProps {
  selectedDuration: 30 | 60 | 90;
  onSelect: (duration: 30 | 60 | 90) => void;
}

export function DurationSelector({ selectedDuration, onSelect }: DurationSelectorProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <h2
        style={{
          fontSize: "14px",
          fontWeight: 700,
          color: colors.textPrimary,
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
        className="section-heading"
      >
        <span style={{ fontSize: "18px" }}>⏱️</span>
        <span>Select Duration</span>
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        {/* 30 min */}
        <button
          onClick={() => onSelect(30)}
          style={{
            padding: "16px 12px",
            minHeight: "80px",
            borderRadius: "14px",
            border: selectedDuration === 30
              ? `2.5px solid ${colors.cyan}`
              : `1.5px solid ${colors.border}`,
            background: selectedDuration === 30
              ? `linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.10) 100%)`
              : `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: selectedDuration === 30 ? `0 6px 20px rgba(0, 240, 255, 0.3)` : "0 2px 6px rgba(0, 0, 0, 0.15)",
            transform: selectedDuration === 30 ? "translateY(-1px)" : "none",
          }}
          className="duration-button"
        >
          <div
            style={{
              fontSize: "26px",
              fontWeight: 900,
              fontFamily: fonts.heading,
              color: selectedDuration === 30 ? colors.cyan : colors.textPrimary,
              marginBottom: "4px",
              letterSpacing: "-0.5px",
              lineHeight: "1",
            }}
          >
            30
          </div>
          <div style={{ fontSize: "12px", color: selectedDuration === 30 ? colors.cyan : colors.textMuted, fontWeight: 600 }}>
            min
          </div>
        </button>

        {/* 60 min */}
        <button
          onClick={() => onSelect(60)}
          style={{
            padding: "16px 12px",
            minHeight: "80px",
            borderRadius: "14px",
            border: selectedDuration === 60
              ? `2.5px solid ${colors.cyan}`
              : `1.5px solid ${colors.border}`,
            background: selectedDuration === 60
              ? `linear-gradient(135deg, rgba(0, 240, 255, 0.22) 0%, rgba(0, 240, 255, 0.10) 100%)`
              : `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: selectedDuration === 60 ? `0 6px 20px rgba(0, 240, 255, 0.3)` : "0 2px 6px rgba(0, 0, 0, 0.15)",
            transform: selectedDuration === 60 ? "translateY(-1px)" : "none",
          }}
          className="duration-button"
        >
          <div
            style={{
              fontSize: "26px",
              fontWeight: 900,
              fontFamily: fonts.heading,
              color: selectedDuration === 60 ? colors.cyan : colors.textPrimary,
              marginBottom: "4px",
              letterSpacing: "-0.5px",
              lineHeight: "1",
            }}
          >
            60
          </div>
          <div style={{ fontSize: "12px", color: selectedDuration === 60 ? colors.cyan : colors.textMuted, fontWeight: 600 }}>
            min
          </div>
        </button>

        {/* 90 min - Hot Deal */}
        <button
          onClick={() => onSelect(90)}
          style={{
            padding: "16px 12px",
            minHeight: "80px",
            borderRadius: "14px",
            border: selectedDuration === 90
              ? `2.5px solid ${colors.red}`
              : `1.5px solid ${colors.border}`,
            background: selectedDuration === 90
              ? `linear-gradient(135deg, rgba(255, 7, 58, 0.22) 0%, rgba(255, 7, 58, 0.10) 100%)`
              : `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: selectedDuration === 90 ? `0 6px 20px rgba(255, 7, 58, 0.3)` : "0 2px 6px rgba(0, 0, 0, 0.15)",
            transform: selectedDuration === 90 ? "translateY(-1px)" : "none",
            position: "relative",
          }}
          className="duration-button"
        >
          <div
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              fontSize: "10px",
            }}
          >
            🔥
          </div>
          <div
            style={{
              fontSize: "26px",
              fontWeight: 900,
              fontFamily: fonts.heading,
              color: selectedDuration === 90 ? colors.red : colors.textPrimary,
              marginBottom: "4px",
              letterSpacing: "-0.5px",
              lineHeight: "1",
            }}
          >
            90
          </div>
          <div style={{ fontSize: "12px", color: selectedDuration === 90 ? colors.red : colors.textMuted, fontWeight: 600 }}>
            min
          </div>
        </button>
      </div>
    </div>
  );
}
