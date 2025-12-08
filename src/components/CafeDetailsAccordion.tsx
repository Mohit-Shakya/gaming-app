// src/components/CafeDetailsAccordion.tsx
"use client";

import { useState } from "react";

type CafeDetailsAccordionProps = {
  opening_hours?: string | null;
  peak_hours?: string | null;
  popular_games?: string | null;
  offers?: string | null;
  monitor_details?: string | null;
  processor_details?: string | null;
  gpu_details?: string | null;
  ram_details?: string | null;
  ssd_details?: string | null;
  accessories_details?: string | null;
  screen_size?: string | null;
  show_tech_specs?: boolean;
};

type SectionId = "highlights" | "device" | null;

// ============ STYLES ============
const colors = {
  red: "#ff073a",
  cyan: "#00f0ff",
  dark: "#08080c",
  darkCard: "#0f0f14",
  border: "rgba(255, 255, 255, 0.08)",
  textPrimary: "#ffffff",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  green: "#22c55e",
  orange: "#f59e0b",
  purple: "#a855f7",
};

const fonts = {
  heading: "'Orbitron', sans-serif",
  body: "'Rajdhani', sans-serif",
};

// Highlight items config
const highlightItems = [
  { key: "opening_hours", icon: "⏰", label: "Opening Hours", color: colors.cyan },
  { key: "peak_hours", icon: "🔥", label: "Peak Hours", color: colors.orange },
  { key: "popular_games", icon: "🎮", label: "Popular Games", color: colors.red },
  { key: "offers", icon: "🏷️", label: "Offers", color: colors.green },
];

// Spec items config
const specItems = [
  { key: "monitor_details", icon: "🖥️", label: "Monitor" },
  { key: "screen_size", icon: "📐", label: "Screen Size" },
  { key: "processor_details", icon: "⚡", label: "Processor" },
  { key: "gpu_details", icon: "🎴", label: "Graphics Card" },
  { key: "ram_details", icon: "💾", label: "RAM" },
  { key: "ssd_details", icon: "💿", label: "Storage" },
  { key: "accessories_details", icon: "🎧", label: "Accessories" },
];

export default function CafeDetailsAccordion(props: CafeDetailsAccordionProps) {
  const [openSection, setOpenSection] = useState<SectionId>("highlights");

  const toggle = (id: SectionId) =>
    setOpenSection((current) => (current === id ? null : id));

  const hasHighlights =
    props.opening_hours ||
    props.peak_hours ||
    props.popular_games ||
    props.offers;

  const hasDeviceSpecs =
    props.show_tech_specs !== false &&
    (props.monitor_details ||
    props.processor_details ||
    props.gpu_details ||
    props.ram_details ||
    props.ssd_details ||
    props.accessories_details ||
    props.screen_size);

  if (!hasHighlights && !hasDeviceSpecs) return null;

  return (
    <section
      style={{
        fontFamily: fonts.body,
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid ${colors.border}`,
        background: `linear-gradient(145deg, rgba(18, 18, 24, 0.9) 0%, rgba(14, 14, 18, 0.95) 100%)`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <span style={{ fontSize: "20px" }}>📋</span>
        <h2
          style={{
            fontFamily: fonts.heading,
            fontSize: "14px",
            fontWeight: 600,
            color: colors.red,
            textTransform: "uppercase",
            letterSpacing: "2px",
            margin: 0,
          }}
        >
          Café Details
        </h2>
      </div>

      {/* Top Highlights Section */}
      {hasHighlights && (
        <div style={{ borderBottom: openSection === "highlights" || hasDeviceSpecs ? `1px solid ${colors.border}` : "none" }}>
          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => toggle("highlights")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              background: openSection === "highlights" 
                ? "rgba(255, 7, 58, 0.05)" 
                : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>✨</span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Top Highlights
              </span>
            </div>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: openSection === "highlights" 
                  ? `rgba(255, 7, 58, 0.2)` 
                  : "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: openSection === "highlights" ? colors.red : colors.textMuted,
                  transform: openSection === "highlights" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                ▼
              </span>
            </div>
          </button>

          {/* Accordion Content */}
          {openSection === "highlights" && (
            <div
              style={{
                padding: "0 20px 16px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
              }}
            >
              {highlightItems.map((item) => {
                const value = props[item.key as keyof CafeDetailsAccordionProps];
                if (!value) return null;

                return (
                  <div
                    key={item.key}
                    style={{
                      padding: "14px",
                      background: "rgba(255, 255, 255, 0.03)",
                      borderRadius: "12px",
                      border: `1px solid rgba(255, 255, 255, 0.05)`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "16px",
                          filter: `drop-shadow(0 0 6px ${item.color})`,
                        }}
                      >
                        {item.icon}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          color: item.color,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {item.label}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "13px",
                        color: colors.textSecondary,
                        margin: 0,
                        lineHeight: 1.5,
                      }}
                    >
                      {value}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Device Specifications Section */}
      {hasDeviceSpecs && (
        <div>
          {/* Accordion Header */}
          <button
            type="button"
            onClick={() => toggle("device")}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              background: openSection === "device" 
                ? "rgba(0, 240, 255, 0.05)" 
                : "transparent",
              border: "none",
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "16px" }}>💻</span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Device Specifications
              </span>
            </div>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "6px",
                background: openSection === "device" 
                  ? `rgba(0, 240, 255, 0.2)` 
                  : "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease",
              }}
            >
              <span
                style={{
                  fontSize: "10px",
                  color: openSection === "device" ? colors.cyan : colors.textMuted,
                  transform: openSection === "device" ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                ▼
              </span>
            </div>
          </button>

          {/* Accordion Content */}
          {openSection === "device" && (
            <div
              style={{
                padding: "0 20px 16px",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: "10px",
              }}
            >
              {specItems.map((item) => {
                const value = props[item.key as keyof CafeDetailsAccordionProps];
                if (!value) return null;

                return (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px",
                      background: "rgba(255, 255, 255, 0.02)",
                      borderRadius: "10px",
                      border: `1px solid rgba(255, 255, 255, 0.04)`,
                    }}
                  >
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        background: "rgba(0, 240, 255, 0.1)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        flexShrink: 0,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontSize: "10px",
                          color: colors.textMuted,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          marginBottom: "2px",
                        }}
                      >
                        {item.label}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: colors.textPrimary,
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
