// src/components/CafeList.tsx
"use client";

import Link from "next/link";
import type { Cafe } from "@/types/cafe";

type Props = {
  cafes: Cafe[];
};

export default function CafeList({ cafes }: Props) {
  if (!cafes || cafes.length === 0) {
    return (
      <p className="text-xs text-zinc-500">
        No cafés found yet. Try changing your filters or search term.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {cafes.map((cafe) => (
        <Link
          key={cafe.id}
          href={`/cafes/${cafe.id}`}
          className="block overflow-hidden rounded-3xl border border-zinc-900 bg-zinc-950/80 shadow-sm transition hover:border-zinc-700 hover:bg-zinc-950"
        >
          {/* Cover image */}
          {cafe.cover_url && (
            <div className="relative h-40 w-full overflow-hidden bg-zinc-900 sm:h-52">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cafe.cover_url}
                alt={cafe.name}
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-col gap-3 px-4 py-3.5 sm:px-5 sm:py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h2 className="text-[15px] font-semibold sm:text-lg">
                  {cafe.name}
                </h2>
                {cafe.address && (
                  <p className="mt-1 text-[11px] text-zinc-400 sm:text-xs">
                    {cafe.address}
                  </p>
                )}
              </div>

              <div className="mt-0.5">
                <OpeningBadge
                  openingHours={cafe.opening_hours}
                  isActive={cafe.is_active !== false} // treat null as active
                />
              </div>
            </div>

            {/* Console icons row */}
            <ConsoleIconsRow cafe={cafe} />

            {/* Price */}
            <div className="flex items-center justify-between pt-1 text-xs text-zinc-400">
              <span>From</span>
              <span className="text-sm font-semibold text-white">
                ₹{cafe.hourly_price ?? 0}
                <span className="text-[11px] font-normal text-zinc-400">
                  {" "}
                  /hr
                </span>
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------- Opening hours badge (LIVE) ---------- */

function OpeningBadge({
  openingHours,
  isActive,
}: {
  openingHours?: string | null;
  isActive: boolean;
}) {
  // if café is manually turned off in admin
  if (!isActive) {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-600/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-rose-300 sm:text-[11px]">
        Temporarily closed
      </span>
    );
  }

  const range = parseOpeningRange(openingHours ?? undefined);

  // If we couldn't parse times, just show the text or fallback
  if (!range) {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-500/12 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-300 sm:text-[11px]">
        {openingHours && openingHours.trim().length > 0
          ? openingHours.trim()
          : "Opening soon"}
      </span>
    );
  }

  const now = new Date();
  const isOpen = now >= range.open && now <= range.close;
  const statusText = isOpen ? "Open now" : "Closed";

  const bgClass = isOpen ? "bg-emerald-500/15" : "bg-zinc-700/40";
  const textClass = isOpen ? "text-emerald-300" : "text-zinc-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide sm:text-[11px] ${bgClass} ${textClass}`}
    >
      {statusText} • {range.label}
    </span>
  );
}

// Parse strings like "10:00 AM – 11:00 PM (Mon–Sun)" or "10:00 AM - 11:00 PM"
function parseOpeningRange(
  openingHours?: string
): { open: Date; close: Date; label: string } | null {
  if (!openingHours) return null;

  const match = openingHours.match(
    /(\d{1,2}:\d{2}\s*(AM|PM))\s*[–-]\s*(\d{1,2}:\d{2}\s*(AM|PM))/i
  );
  if (!match) return null;

  const startStr = match[1]; // e.g. "10:00 AM"
  const endStr = match[3]; // e.g. "11:00 PM"
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
  const parts = trimmed.split(/\s+/); // ["10:00", "AM"]
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

// which fields count as “this console exists”
const CONSOLE_CONFIG: {
  key: keyof Cafe;
  icon: string;
  label: string;
}[] = [
  { key: "ps5_count", icon: "🎮", label: "PS5" },
  { key: "ps4_count", icon: "🎮", label: "PS4" },
  { key: "xbox_count", icon: "🟩", label: "Xbox" },
  { key: "pc_count", icon: "💻", label: "PC" },
  { key: "pool_count", icon: "🎱", label: "Pool" },
  { key: "arcade_count", icon: "🕹️", label: "Arcade" },
];

function ConsoleIconsRow({ cafe }: { cafe: Cafe }) {
  const available = CONSOLE_CONFIG.filter(
    ({ key }) => ((cafe[key] as number | null) ?? 0) > 0
  );

  if (available.length === 0) return null;

  return (
    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
      {available.map(({ key, icon, label }) => (
        <span
          key={String(key)}
          className="
            inline-flex items-center gap-[4px] rounded-full bg-zinc-900/90
            px-2 py-[3px]
            text-[9px] leading-none
            sm:px-2.5 sm:py-1 sm:text-[11px]
          "
        >
          <span className="text-xs leading-none sm:text-sm">{icon}</span>
          <span className="leading-none">{label}</span>
        </span>
      ))}
    </div>
  );
}