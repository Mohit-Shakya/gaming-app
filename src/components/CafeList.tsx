// src/components/CafeList.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import type { Cafe } from "@/types/cafe";

type Props = {
  cafes: Cafe[];
};

export default function CafeList({ cafes }: Props) {
  if (!cafes || cafes.length === 0) {
    return null; // Parent handles empty state
  }

  return (
    <>
      <style jsx global>{`
        .cafe-card {
          background: rgba(16, 16, 22, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.04);
          transition: all 0.25s ease;
        }

        .cafe-card:hover {
          border-color: rgba(255, 7, 58, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3),
                      0 0 0 1px rgba(255, 7, 58, 0.1);
        }

        .cafe-card:active {
          transform: translateY(0);
        }

        .image-shimmer {
          background: linear-gradient(
            110deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.03) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .badge-open {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.2);
          color: #34d399;
        }

        .badge-closed {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #f87171;
        }

        .badge-inactive {
          background: rgba(251, 191, 36, 0.12);
          border: 1px solid rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }

        .console-chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          transition: all 0.15s ease;
        }

        .console-chip:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .price-tag {
          background: linear-gradient(135deg, rgba(255, 7, 58, 0.15) 0%, rgba(255, 7, 58, 0.05) 100%);
          border: 1px solid rgba(255, 7, 58, 0.2);
        }

        .book-btn {
          background: linear-gradient(135deg, #ff073a 0%, #cc0530 100%);
          box-shadow: 0 4px 15px rgba(255, 7, 58, 0.25);
          transition: all 0.2s ease;
        }

        .book-btn:hover {
          box-shadow: 0 6px 20px rgba(255, 7, 58, 0.35);
        }

        .rating-star {
          filter: drop-shadow(0 0 2px rgba(251, 191, 36, 0.5));
        }
      `}</style>

      <div className="space-y-3 sm:space-y-4">
        {cafes.map((cafe, index) => (
          <Link
            key={cafe.id}
            href={`/cafes/${cafe.id}`}
            className="cafe-card block overflow-hidden rounded-2xl sm:rounded-3xl"
            style={{
              animationDelay: `${index * 0.05}s`,
            }}
          >
            {/* Image Section */}
            <div className="relative">
              {cafe.cover_url ? (
                <div className="relative h-36 sm:h-44 md:h-52 w-full overflow-hidden bg-zinc-900">
                  <Image
                    src={cafe.cover_url}
                    alt={cafe.name}
                    fill
                    sizes="(max-width: 640px) 640px, (max-width: 1024px) 828px, 1080px"
                    className="object-cover"
                    loading={index === 0 ? "eager" : "lazy"}
                    priority={index === 0}
                    quality={index === 0 ? 85 : index < 3 ? 75 : 60}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#101016] via-transparent to-transparent" />
                  
                  {/* Top badges row */}
                  <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                    {/* Status badge */}
                    <OpeningBadge
                      openingHours={cafe.opening_hours}
                      isActive={cafe.is_active !== false}
                    />
                    
                    {/* Rating if available */}
                    {(cafe as any).rating && (
                      <div className="flex items-center gap-1 rounded-lg bg-black/60 backdrop-blur-sm px-2 py-1">
                        <span className="rating-star text-yellow-400 text-xs">★</span>
                        <span 
                          className="text-xs font-semibold text-white"
                          style={{ fontFamily: 'Rajdhani, sans-serif' }}
                        >
                          {(cafe as any).rating}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // Placeholder when no image
                <div className="relative h-28 sm:h-36 w-full bg-gradient-to-br from-zinc-900 to-zinc-950 flex items-center justify-center">
                  <div className="text-4xl opacity-30">🎮</div>
                  <div className="absolute inset-0 image-shimmer" />
                  
                  {/* Status badge for no-image cards */}
                  <div className="absolute top-3 left-3">
                    <OpeningBadge
                      openingHours={cafe.opening_hours}
                      isActive={cafe.is_active !== false}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="px-3.5 py-3 sm:px-4 sm:py-4">
              {/* Title & Location */}
              <div className="mb-2.5">
                <h2 
                  className="text-base sm:text-lg font-bold text-white leading-tight"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  {cafe.name}
                </h2>
                {cafe.address && (
                  <div className="mt-1 flex items-center gap-1.5 text-zinc-500">
                    <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p 
                      className="text-[11px] sm:text-xs truncate"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      {cafe.address}
                      {cafe.city && `, ${cafe.city}`}
                    </p>
                  </div>
                )}
              </div>

              {/* Console chips */}
              <ConsoleIconsRow cafe={cafe} />

              {/* Price & Book Row */}
              <div className="mt-3 flex items-center justify-between">
                {/* Price */}
                <div className="price-tag rounded-xl px-3 py-1.5">
                  <span 
                    className="text-[10px] sm:text-xs text-zinc-400 block"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Starting from
                  </span>
                  <div className="flex items-baseline gap-0.5">
                    <span 
                      className="text-lg sm:text-xl font-bold text-[#ff073a]"
                      style={{ fontFamily: 'Orbitron, sans-serif' }}
                    >
                      ₹{cafe.hourly_price ?? 0}
                    </span>
                    <span 
                      className="text-[10px] sm:text-xs text-zinc-500"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      /hr
                    </span>
                  </div>
                </div>

                {/* Book Button */}
                <div 
                  className="book-btn rounded-xl px-4 py-2.5 sm:px-5 sm:py-3"
                >
                  <span 
                    className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Book Now
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ---------- Opening hours badge ---------- */

function OpeningBadge({
  openingHours,
  isActive,
}: {
  openingHours?: string | null;
  isActive: boolean;
}) {
  // If café is manually turned off
  if (!isActive) {
    return (
      <span 
        className="badge-inactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm"
        style={{ fontFamily: 'Rajdhani, sans-serif' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        Temporarily Closed
      </span>
    );
  }

  const range = parseOpeningRange(openingHours ?? undefined);

  // If we couldn't parse times
  if (!range) {
    return (
      <span 
        className="badge-open inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm"
        style={{ fontFamily: 'Rajdhani, sans-serif' }}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        {openingHours && openingHours.trim().length > 0
          ? openingHours.trim()
          : "Open"}
      </span>
    );
  }

  const now = new Date();
  const isOpen = now >= range.open && now <= range.close;

  if (isOpen) {
    return (
      <span 
        className="badge-open inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm"
        style={{ fontFamily: 'Rajdhani, sans-serif' }}
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </span>
        Open Now
      </span>
    );
  }

  return (
    <span 
      className="badge-closed inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] sm:text-[11px] font-semibold backdrop-blur-sm"
      style={{ fontFamily: 'Rajdhani, sans-serif' }}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Closed • Opens {range.label.split('–')[0].trim()}
    </span>
  );
}

// Parse strings like "10:00 AM – 11:00 PM"
function parseOpeningRange(
  openingHours?: string
): { open: Date; close: Date; label: string } | null {
  if (!openingHours) return null;

  const match = openingHours.match(
    /(\d{1,2}:\d{2}\s*(AM|PM))\s*[–-]\s*(\d{1,2}:\d{2}\s*(AM|PM))/i
  );
  if (!match) return null;

  const startStr = match[1];
  const endStr = match[3];
  const today = new Date();

  const open = parseTimeForToday(startStr, today);
  const close = parseTimeForToday(endStr, today);

  if (!open || !close) return null;

  return {
    open,
    close,
    label: `${startStr} – ${endStr}`,
  };
}

function parseTimeForToday(timeStr: string, baseDate: Date): Date | null {
  const trimmed = timeStr.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length < 2) return null;

  const [timePart, ampmRaw] = parts;
  const [hStr, mStr] = timePart.split(":");
  const hourNum = Number(hStr);
  const minNum = Number(mStr);
  if (Number.isNaN(hourNum) || Number.isNaN(minNum)) return null;

  const ampm = ampmRaw.toUpperCase();
  let hour24 = hourNum % 12;
  if (ampm === "PM") hour24 += 12;

  const d = new Date(baseDate);
  d.setHours(hour24, minNum, 0, 0);
  return d;
}

/* ---------- Console icons row ---------- */

const CONSOLE_CONFIG: {
  key: keyof Cafe;
  icon: string;
  label: string;
  color: string;
}[] = [
  { key: "ps5_count", icon: "🎮", label: "PS5", color: "rgba(0, 112, 243, 0.15)" },
  { key: "ps4_count", icon: "🎮", label: "PS4", color: "rgba(0, 112, 243, 0.1)" },
  { key: "xbox_count", icon: "🟩", label: "Xbox", color: "rgba(16, 185, 129, 0.12)" },
  { key: "pc_count", icon: "💻", label: "PC", color: "rgba(139, 92, 246, 0.12)" },
  { key: "pool_count", icon: "🎱", label: "Pool", color: "rgba(236, 72, 153, 0.12)" },
  { key: "arcade_count", icon: "🕹️", label: "Arcade", color: "rgba(251, 191, 36, 0.12)" },
];

// Extended configs for additional equipment
const EXTENDED_CONFIG: {
  key: string;
  icon: string;
  label: string;
  color: string;
}[] = [
  { key: "vr_count", icon: "🥽", label: "VR", color: "rgba(6, 182, 212, 0.12)" },
  { key: "steering_wheel_count", icon: "🏎️", label: "Racing", color: "rgba(239, 68, 68, 0.12)" },
  { key: "snooker_count", icon: "🎯", label: "Snooker", color: "rgba(34, 197, 94, 0.12)" },
];

function ConsoleIconsRow({ cafe }: { cafe: Cafe }) {
  const allConfigs = [...CONSOLE_CONFIG, ...EXTENDED_CONFIG];
  
  const available = allConfigs.filter(
    ({ key }) => (((cafe as any)[key] as number | null) ?? 0) > 0
  );

  if (available.length === 0) return null;

  // Show max 4 on mobile, all on larger screens
  const displayItems = available.slice(0, 6);
  const moreCount = available.length - 4;

  return (
    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
      {displayItems.map(({ key, icon, label, color }, idx) => (
        <span
          key={key}
          className={`console-chip inline-flex items-center gap-1 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1.5 ${
            idx >= 4 ? 'hidden sm:inline-flex' : ''
          }`}
          style={{ 
            fontFamily: 'Rajdhani, sans-serif',
            background: color,
          }}
        >
          <span className="text-xs sm:text-sm">{icon}</span>
          <span className="text-[10px] sm:text-xs font-medium text-zinc-300">{label}</span>
        </span>
      ))}
      
      {/* Show "+X more" on mobile if more than 4 items */}
      {moreCount > 0 && (
        <span 
          className="sm:hidden inline-flex items-center rounded-lg bg-zinc-800/50 px-2 py-1 text-[10px] font-medium text-zinc-400"
          style={{ fontFamily: 'Rajdhani, sans-serif' }}
        >
          +{moreCount} more
        </span>
      )}
    </div>
  );
}