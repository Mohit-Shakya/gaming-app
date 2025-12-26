// src/components/booking/ConsoleCard.tsx
/**
 * Compact console selection card with availability status
 */

import { colors, fonts, type ConsoleId } from "@/lib/constants";

export interface ConsoleCardData {
  id: ConsoleId;
  label: string;
  icon: string;
  color: string;
}

interface ConsoleCardProps {
  console: ConsoleCardData;
  isActive: boolean;
  isSoldOut: boolean;
  isLowStock: boolean;
  availableSlots: number;
  totalSlots: number;
  mySelection: number;
  price: number;
  onClick: () => void;
}

export function ConsoleCard({
  console,
  isActive,
  isSoldOut,
  isLowStock,
  availableSlots,
  totalSlots,
  mySelection,
  price,
  onClick,
}: ConsoleCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={isSoldOut}
      style={{
        minWidth: "85px",
        maxWidth: "85px",
        padding: "10px 6px",
        borderRadius: "10px",
        border: isActive
          ? `2px solid ${console.color}`
          : isSoldOut
          ? `1px solid rgba(255, 255, 255, 0.06)`
          : `1px solid ${colors.border}`,
        background: isActive
          ? `linear-gradient(135deg, ${console.color}25 0%, ${console.color}10 100%)`
          : isSoldOut
          ? "rgba(255, 255, 255, 0.02)"
          : colors.darkCard,
        cursor: isSoldOut ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        boxShadow: isActive ? `0 4px 16px ${console.color}35` : "none",
        opacity: isSoldOut ? 0.5 : 1,
        textAlign: "center",
        transform: isActive ? "scale(1.02)" : "none",
      }}
      className="console-card"
    >
      {/* Console icon */}
      <div
        style={{
          fontSize: "24px",
          marginBottom: "4px",
          filter: isSoldOut ? "grayscale(1)" : "none",
        }}
      >
        {console.icon}
      </div>

      {/* Console name */}
      <div
        style={{
          fontSize: "11px",
          fontWeight: 800,
          fontFamily: fonts.heading,
          color: isActive ? console.color : colors.textPrimary,
          marginBottom: "2px",
          letterSpacing: "-0.2px",
        }}
      >
        {console.label}
      </div>

      {/* Price */}
      <div
        style={{
          fontSize: "10px",
          color: colors.textMuted,
          fontWeight: 600,
          marginBottom: "6px",
        }}
      >
        ₹{price}
      </div>

      {/* Availability badge - compact */}
      <div
        style={{
          padding: "4px 8px",
          background: isSoldOut
            ? "rgba(239, 68, 68, 0.2)"
            : isLowStock
            ? "rgba(245, 158, 11, 0.2)"
            : "rgba(34, 197, 94, 0.2)",
          borderRadius: "6px",
          fontSize: "9px",
          fontWeight: 700,
          color: isSoldOut
            ? "#ef4444"
            : isLowStock
            ? colors.orange
            : colors.green,
          marginBottom: mySelection > 0 ? "6px" : "0",
        }}
      >
        {isSoldOut ? "Sold Out" : `${availableSlots}/${totalSlots}`}
      </div>

      {/* Selected indicator - compact */}
      {mySelection > 0 && (
        <div
          style={{
            padding: "3px 6px",
            background: `${console.color}30`,
            borderRadius: "5px",
            fontSize: "9px",
            fontWeight: 700,
            color: console.color,
          }}
        >
          ✓ {mySelection}
        </div>
      )}
    </button>
  );
}
