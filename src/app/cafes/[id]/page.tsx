// src/app/cafes/[id]/page.tsx

import { supabase } from "@/lib/supabaseClient";
import Image from "next/image";
import dynamicImport from "next/dynamic";
import Link from "next/link";

// Lazy load heavy components
const CafeGallery = dynamicImport(() => import("@/components/CafeGallery"), {
  loading: () => <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Loading gallery...</div>,
});

const CafeDetailsAccordion = dynamicImport(() => import("@/components/CafeDetailsAccordion"), {
  loading: () => <div style={{ padding: "20px", textAlign: "center", color: "#666" }}>Loading details...</div>,
});

type CafePageProps = {
  params: Promise<{ id: string }>;
};

type CafeImageRow = {
  id: string;
  image_url: string;
  cafe_id?: string;
};

const CONSOLE_CONFIG: {
  key:
    | "ps5_count"
    | "ps4_count"
    | "xbox_count"
    | "pc_count"
    | "pool_count"
    | "arcade_count"
    | "snooker_count"
    | "steering_wheel_count"
    | "vr_count";
  label: string;
  icon: string;
  color: string;
}[] = [
  { key: "ps5_count", label: "PS5", icon: "🎮", color: "#0070d1" },
  { key: "ps4_count", label: "PS4", icon: "🎮", color: "#003791" },
  { key: "xbox_count", label: "Xbox", icon: "🎮", color: "#107c10" },
  { key: "pc_count", label: "PC", icon: "💻", color: "#ff073a" },
  { key: "pool_count", label: "Pool", icon: "🎱", color: "#8b4513" },
  { key: "arcade_count", label: "Arcade", icon: "🕹️", color: "#ff6b00" },
  { key: "snooker_count", label: "Snooker", icon: "🎱", color: "#228b22" },
  { key: "steering_wheel_count", label: "Racing", icon: "🏎️", color: "#e10600" },
  { key: "vr_count", label: "VR", icon: "🥽", color: "#9945ff" },
];

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function CafePage({ params }: CafePageProps) {
  const { id } = await params;

  // Common styles
  const fonts = {
    heading: "'Orbitron', sans-serif",
    body: "'Rajdhani', sans-serif",
  };

  const colors = {
    red: "#ff073a",
    cyan: "#00f0ff",
    dark: "#08080c",
    cardBg: "rgba(18, 18, 24, 0.9)",
    border: "rgba(255, 255, 255, 0.08)",
    textPrimary: "#ffffff",
    textSecondary: "#9ca3af",
    textMuted: "#6b7280",
  };

  if (!id) {
    return (
      <main
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          padding: "48px 16px",
          fontFamily: fonts.body,
        }}
      >
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "24px",
            color: colors.red,
            marginBottom: "16px",
          }}
        >
          Café not found
        </h1>
        <p style={{ color: colors.textSecondary }}>
          The URL did not contain a valid café id.
        </p>
      </main>
    );
  }

  const { data: cafeRows, error: cafeError } = await supabase
    .from("cafes")
    .select(
      `
      id,
      name,
      address,
      description,
      hourly_price,
      google_maps_url,
      cover_url,
      ps5_count,
      ps4_count,
      xbox_count,
      pc_count,
      pool_count,
      arcade_count,
      snooker_count,
      steering_wheel_count,
      vr_count,
      opening_hours,
      peak_hours,
      popular_games,
      offers,
      monitor_details,
      processor_details,
      gpu_details,
      ram_details,
      accessories_details,
      show_tech_specs
    `
    )
    .eq("id", id)
    .limit(1);

  const cafe = cafeRows?.[0] ?? null;

  if (!cafe || cafeError) {
    return (
      <main
        style={{
          maxWidth: "896px",
          margin: "0 auto",
          padding: "48px 16px",
          fontFamily: fonts.body,
        }}
      >
        <h1
          style={{
            fontFamily: fonts.heading,
            fontSize: "24px",
            color: colors.red,
            marginBottom: "16px",
          }}
        >
          Café not found
        </h1>
        <p style={{ color: colors.textSecondary }}>
          This café doesn&apos;t exist anymore or could not be loaded.
        </p>
      </main>
    );
  }

  const { data: galleryRows } = await supabase
    .from("cafe_images")
    .select("id, image_url, cafe_id")
    .eq("cafe_id", id);

  const galleryImages =
    (galleryRows as CafeImageRow[] | null)?.map((img) => ({
      id: img.id,
      url: img.image_url,
      alt: `${cafe.name} photo`,
    })) ?? [];

  const mapsUrl =
    cafe.google_maps_url ??
    (cafe.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          cafe.address
        )}`
      : null);

  const availableConsoles = CONSOLE_CONFIG.filter(({ key }) => {
    const value = (cafe as any)[key] as number | null;
    return (value ?? 0) > 0;
  });

  // Styles
  const sectionCardStyle: React.CSSProperties = {
    background: `linear-gradient(145deg, rgba(18, 18, 24, 0.8) 0%, rgba(14, 14, 18, 0.9) 100%)`,
    backdropFilter: "blur(10px)",
    border: `1px solid ${colors.border}`,
    borderRadius: "12px",
    padding: "16px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontFamily: fonts.heading,
    fontSize: "13px",
    fontWeight: 600,
    color: colors.red,
    textTransform: "uppercase",
    letterSpacing: "1.5px",
    marginBottom: "12px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  return (
    <main
      style={{
        fontFamily: fonts.body,
        background: `linear-gradient(180deg, ${colors.dark} 0%, #0a0a10 50%, ${colors.dark} 100%)`,
        minHeight: "100vh",
        position: "relative",
      }}
    >
      {/* Background ambient glow */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 20% 0%, rgba(255, 7, 58, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, rgba(0, 240, 255, 0.06) 0%, transparent 50%)
          `,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          maxWidth: "1024px",
          margin: "0 auto",
          padding: "16px",
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        className="cafe-detail-container"
      >
        {/* Hero Section */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "16px",
          }}
        >
          {/* Cover Image */}
          {cafe.cover_url ? (
            <div
              style={{
                position: "relative",
                aspectRatio: "16/9",
                width: "100%",
                overflow: "hidden",
                borderRadius: "16px",
              }}
            >
              <Image
                src={cafe.cover_url}
                alt={cafe.name}
                fill
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
                priority
              />
              {/* Gradient overlay */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(180deg, transparent 0%, transparent 40%, rgba(8, 8, 12, 0.6) 70%, rgba(8, 8, 12, 0.95) 100%)`,
                  pointerEvents: "none",
                }}
              />
              {/* Title overlay */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: "16px",
                  zIndex: 2,
                }}
              >
                <h1
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "20px",
                    fontWeight: 700,
                    color: colors.textPrimary,
                    textShadow: "0 2px 20px rgba(0, 0, 0, 0.5)",
                    marginBottom: "8px",
                  }}
                  className="cafe-title"
                >
                  {cafe.name}
                </h1>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Status badge */}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      background: "rgba(34, 197, 94, 0.15)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#22c55e",
                    }}
                  >
                    <span
                      style={{
                        width: "6px",
                        height: "6px",
                        background: "#22c55e",
                        borderRadius: "50%",
                      }}
                    />
                    Open Now
                  </span>
                  {cafe.address && (
                    <span
                      style={{
                        fontSize: "13px",
                        color: "rgba(255, 255, 255, 0.7)",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span style={{ color: colors.red }}>📍</span>
                      {cafe.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Fallback cover */
            <div
              style={{
                aspectRatio: "16/9",
                width: "100%",
                borderRadius: "16px",
                background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #1a1a2e 75%, #16213e 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px",
                textAlign: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  right: "20px",
                  bottom: "20px",
                  fontSize: "80px",
                  opacity: 0.1,
                }}
              >
                🎮
              </div>
              <div style={{ position: "relative", zIndex: 1 }}>
                <h1
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "clamp(24px, 5vw, 36px)",
                    fontWeight: 700,
                    color: colors.textPrimary,
                    marginBottom: "12px",
                  }}
                >
                  {cafe.name}
                </h1>
                <p
                  style={{
                    fontSize: "14px",
                    color: "rgba(255, 255, 255, 0.6)",
                    maxWidth: "300px",
                  }}
                >
                  Premium gaming experience with latest consoles & high-end PCs
                </p>
              </div>
            </div>
          )}

          {/* Booking Card */}
          <div
            style={{
              background: `linear-gradient(145deg, rgba(20, 20, 28, 0.95) 0%, rgba(16, 16, 22, 0.98) 100%)`,
              backdropFilter: "blur(20px)",
              border: `1px solid rgba(255, 7, 58, 0.2)`,
              borderRadius: "16px",
              padding: "16px",
              position: "relative",
              overflow: "hidden",
            }}
            className="booking-card"
          >
            {/* Top accent line */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "1px",
                background: `linear-gradient(90deg, transparent, rgba(255, 7, 58, 0.5), transparent)`,
              }}
            />

            {/* Cafe Name */}
            <h2
              style={{
                fontFamily: fonts.heading,
                fontSize: "16px",
                fontWeight: 600,
                color: colors.textPrimary,
                marginBottom: "12px",
              }}
              className="booking-card-title"
            >
              {cafe.name}
            </h2>

            {/* Address with directions */}
            {mapsUrl && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "20px",
                  paddingBottom: "16px",
                  borderBottom: `1px solid ${colors.border}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: "16px", color: colors.red }}>📍</span>
                  <span
                    style={{
                      fontSize: "13px",
                      color: colors.textSecondary,
                      lineHeight: 1.4,
                    }}
                  >
                    {cafe.address ?? "Address coming soon"}
                  </span>
                </div>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: colors.cyan,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    padding: "6px 12px",
                    background: "rgba(0, 240, 255, 0.1)",
                    borderRadius: "6px",
                  }}
                >
                  Directions →
                </a>
              </div>
            )}

            {/* Pricing */}
            <div style={{ marginBottom: "24px" }}>
              <p
                style={{
                  fontSize: "12px",
                  color: colors.textMuted,
                  marginBottom: "6px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                }}
              >
                Starting from
              </p>
              <div>
                <span
                  style={{
                    fontFamily: fonts.body,
                    fontSize: "18px",
                    color: colors.cyan,
                    marginRight: "2px",
                  }}
                >
                  ₹
                </span>
                <span
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: "36px",
                    fontWeight: 700,
                    color: colors.textPrimary,
                  }}
                >
                  {cafe.hourly_price ?? 0}
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: colors.textMuted,
                    fontWeight: 400,
                  }}
                >
                  {" "}
                  /hr
                </span>
              </div>
              <p
                style={{
                  fontSize: "11px",
                  color: "#4b5563",
                  marginTop: "6px",
                }}
              >
                💡 Prices may vary based on console/device
              </p>
            </div>

            {/* Quick equipment preview */}
            {availableConsoles.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                {availableConsoles.slice(0, 4).map(({ key, icon, label }) => (
                  <span
                    key={key}
                    style={{
                      fontSize: "11px",
                      padding: "4px 10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      borderRadius: "6px",
                      color: "#d1d5db",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{icon}</span>
                    {label}
                  </span>
                ))}
                {availableConsoles.length > 4 && (
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "4px 10px",
                      background: "rgba(255, 7, 58, 0.1)",
                      borderRadius: "6px",
                      color: colors.red,
                    }}
                  >
                    +{availableConsoles.length - 4} more
                  </span>
                )}
              </div>
            )}

            {/* Book Now Button */}
            <Link href={`/cafes/${cafe.id}/booking-mode`} style={{ display: "block" }}>
              <button
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  minHeight: "48px",
                  background: `linear-gradient(135deg, ${colors.red} 0%, #ff3366 50%, ${colors.red} 100%)`,
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontFamily: fonts.heading,
                  fontWeight: 600,
                  fontSize: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  cursor: "pointer",
                }}
                className="book-button"
              >
                🎮 Book Your Session
              </button>
            </Link>

            {/* Trust indicators */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "16px",
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  color: colors.textMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ color: "#22c55e" }}>✓</span> Instant Confirmation
              </span>
              <span
                style={{
                  fontSize: "11px",
                  color: colors.textMuted,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span style={{ color: "#22c55e" }}>✓</span> Free Cancellation
              </span>
            </div>
          </div>
        </section>

        {/* Equipment Section */}
        {availableConsoles.length > 0 && (
          <section style={sectionCardStyle}>
            <h2 style={sectionTitleStyle}>
              <span>🎮</span> Available Equipment
              <span
                style={{
                  flex: 1,
                  height: "1px",
                  background: `linear-gradient(90deg, rgba(255, 7, 58, 0.3), transparent)`,
                }}
              />
            </h2>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {availableConsoles.map(({ key, icon, label, color }) => {
                return (
                  <div
                    key={key}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "10px",
                      background: "rgba(255, 255, 255, 0.05)",
                      border: `1px solid rgba(255, 255, 255, 0.1)`,
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#e5e5e5",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "18px",
                        filter: `drop-shadow(0 0 8px ${color})`,
                      }}
                    >
                      {icon}
                    </span>
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* About Section */}
        <section style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>
            <span>📖</span> About
            <span
              style={{
                flex: 1,
                height: "1px",
                background: `linear-gradient(90deg, rgba(255, 7, 58, 0.3), transparent)`,
              }}
            />
          </h2>
          <p
            style={{
              fontSize: "14px",
              lineHeight: 1.7,
              color: colors.textSecondary,
            }}
          >
            {cafe.description
              ? cafe.description
              : `Welcome to ${cafe.name} - your ultimate gaming destination! We offer a premium gaming experience with the latest consoles, high-end PCs, and comfortable seating. Whether you're into competitive esports, casual gaming, or just hanging out with friends, we've got you covered.`}
          </p>
        </section>

        {/* Cafe Details Accordion - Highlights & Specs */}
        <CafeDetailsAccordion
          opening_hours={cafe.opening_hours}
          peak_hours={cafe.peak_hours}
          popular_games={cafe.popular_games}
          offers={cafe.offers}
          monitor_details={cafe.monitor_details}
          processor_details={cafe.processor_details}
          gpu_details={cafe.gpu_details}
          ram_details={cafe.ram_details}
          accessories_details={cafe.accessories_details}
          show_tech_specs={cafe.show_tech_specs ?? true}
        />

        {/* Gallery Section */}
        <section style={sectionCardStyle}>
          <h2 style={sectionTitleStyle}>
            <span>📸</span> Gallery
            <span
              style={{
                flex: 1,
                height: "1px",
                background: `linear-gradient(90deg, rgba(255, 7, 58, 0.3), transparent)`,
              }}
            />
          </h2>
          <CafeGallery images={galleryImages} />
        </section>

        {/* Venue Section */}
        <section
          style={{
            background: `linear-gradient(135deg, rgba(20, 20, 28, 0.9) 0%, rgba(16, 16, 22, 0.95) 100%)`,
            border: `1px solid rgba(0, 240, 255, 0.15)`,
            borderRadius: "16px",
            padding: "20px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent gradient */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, ${colors.cyan}, ${colors.red}, ${colors.cyan})`,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: fonts.heading,
                  fontSize: "16px",
                  fontWeight: 600,
                  color: colors.textPrimary,
                  marginBottom: "8px",
                }}
              >
                📍 {cafe.name}
              </h3>
              <p
                style={{
                  fontSize: "14px",
                  color: colors.textSecondary,
                  maxWidth: "400px",
                }}
              >
                {cafe.address ?? "Address coming soon"}
              </p>
            </div>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 20px",
                  background: "rgba(0, 240, 255, 0.1)",
                  border: `1px solid rgba(0, 240, 255, 0.3)`,
                  borderRadius: "10px",
                  color: colors.cyan,
                  fontFamily: fonts.body,
                  fontWeight: 600,
                  fontSize: "14px",
                  textDecoration: "none",
                  width: "fit-content",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Get Directions
              </a>
            )}
          </div>
        </section>

        {/* Bottom spacing for mobile */}
        <div style={{ height: "80px" }} />
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 640px) {
          .cafe-detail-container {
            padding: 24px !important;
            gap: 24px !important;
          }
          .cafe-title {
            font-size: 28px !important;
          }
          .booking-card {
            padding: 20px !important;
            border-radius: 20px !important;
          }
          .booking-card-title {
            font-size: 18px !important;
          }
        }
        @media (min-width: 768px) {
          .cafe-title {
            font-size: 32px !important;
          }
        }
      `}</style>
    </main>
  );
}
