// src/components/booking/BookingHeader.tsx
/**
 * Booking page header with back navigation and social links
 */

import { colors } from "@/lib/constants";

interface BookingHeaderProps {
  cafeName: string;
  googleMapsUrl?: string;
  instagramUrl?: string;
  onBack: () => void;
  backLabel?: string;
}

export function BookingHeader({
  cafeName,
  googleMapsUrl,
  instagramUrl,
  onBack,
  backLabel = "Back",
}: BookingHeaderProps) {
  return (
    <header style={{ marginBottom: "24px" }}>
      <button
        onClick={onBack}
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
          marginBottom: "16px",
        }}
      >
        <span style={{ fontSize: "18px" }}>←</span>
        {backLabel}
      </button>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
        <p
          style={{
            fontSize: "12px",
            color: colors.cyan,
            textTransform: "uppercase",
            letterSpacing: "2px",
            margin: 0,
          }}
        >
          {cafeName}
        </p>

        {/* Social Links */}
        {(googleMapsUrl || instagramUrl) && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, rgba(66, 133, 244, 0.2) 0%, rgba(66, 133, 244, 0.1) 100%)",
                  border: "1px solid rgba(66, 133, 244, 0.3)",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(66, 133, 244, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "16px" }}>📍</span>
              </a>
            )}

            {instagramUrl && (
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, rgba(225, 48, 108, 0.2) 0%, rgba(193, 53, 132, 0.1) 100%)",
                  border: "1px solid rgba(225, 48, 108, 0.3)",
                  transition: "all 0.2s ease",
                  textDecoration: "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(225, 48, 108, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span style={{ fontSize: "16px" }}>📷</span>
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
