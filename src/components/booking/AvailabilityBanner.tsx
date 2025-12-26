// src/components/booking/AvailabilityBanner.tsx
/**
 * Live availability status banner with refresh functionality
 */

import { colors } from "@/lib/constants";

interface AvailabilityBannerProps {
  isLoading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export function AvailabilityBanner({ isLoading, lastUpdated, onRefresh }: AvailabilityBannerProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        background: `linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(0, 240, 255, 0.05) 100%)`,
        borderRadius: "10px",
        border: `1px solid rgba(0, 240, 255, 0.2)`,
        marginBottom: "20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: colors.green,
            animation: "pulse 2s ease-in-out infinite",
          }}
        />
        <span style={{ fontSize: "13px", color: colors.cyan, fontWeight: 500 }}>
          Live Availability
        </span>
        <span style={{ fontSize: "11px", color: colors.textMuted }}>
          (accounts for overlapping bookings)
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {isLoading && (
          <div
            style={{
              width: "14px",
              height: "14px",
              border: `2px solid ${colors.border}`,
              borderTopColor: colors.cyan,
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        )}
        {lastUpdated && (
          <span style={{ fontSize: "11px", color: colors.textMuted }}>
            Updated{" "}
            {lastUpdated.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            padding: "4px 10px",
            background: "rgba(255, 255, 255, 0.05)",
            border: `1px solid ${colors.border}`,
            borderRadius: "6px",
            color: colors.textSecondary,
            fontSize: "11px",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
