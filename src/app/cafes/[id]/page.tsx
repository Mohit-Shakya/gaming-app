// src/app/cafes/[id]/page.tsx

import { supabase } from "@/lib/supabaseClient";
import CafeGallery from "@/components/CafeGallery";
import Link from "next/link";

type CafePageProps = {
  // Next 13.5+ gives params as a Promise in server components
  params: Promise<{ id: string }>;
};

type CafeImageRow = {
  id: string;
  image_url: string;
  cafe_id?: string;
};

// Config for console / devices chips
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
}[] = [
  { key: "ps5_count", label: "PS5", icon: "🎮" },
  { key: "ps4_count", label: "PS4", icon: "🎮" },
  { key: "xbox_count", label: "Xbox", icon: "🎮" },
  { key: "pc_count", label: "PC", icon: "💻" },
  { key: "pool_count", label: "Pool", icon: "🎱" },
  { key: "arcade_count", label: "Arcade", icon: "🕹️" },
  { key: "snooker_count", label: "Snooker", icon: "🎱" },
  { key: "steering_wheel_count", label: "Wheel", icon: "🏎️" },
  { key: "vr_count", label: "VR", icon: "🥽" },
];

export const dynamic = "force-dynamic";

export default async function CafePage({ params }: CafePageProps) {
  // 1) Resolve params and get id from URL
  const { id } = await params;

  if (!id) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-4 text-2xl font-semibold">Café not found</h1>
        <p className="text-gray-400">
          The URL did not contain a valid café id.
        </p>
      </main>
    );
  }

  // 2) Fetch café details (also bring console counts + cover)
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
      accessories_details
    `
    )
    .eq("id", id)
    .limit(1);

  const cafe = cafeRows?.[0] ?? null;

  if (!cafe || cafeError) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="mb-4 text-2xl font-semibold">Café not found</h1>
        <p className="text-gray-400">
          This café doesn&apos;t exist anymore or could not be loaded.
        </p>
      </main>
    );
  }

  // 3) Gallery images
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

  // 4) Google Maps link
  const mapsUrl =
    cafe.google_maps_url ??
    (cafe.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          cafe.address
        )}`
      : null);

  // 5) Consoles / devices available
  const availableConsoles = CONSOLE_CONFIG.filter(({ key }) => {
    const value = (cafe as any)[key] as number | null;
    return (value ?? 0) > 0;
  });

  // 6) UI
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8">
      {/* Top: cover image + booking card */}
      <section className="flex flex-col gap-4 md:grid md:grid-cols-[2fr,1fr] md:items-start">
        {/* Cover / banner */}
        {cafe.cover_url ? (
          <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl md:aspect-[2.3/1]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cafe.cover_url}
              alt={cafe.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-sky-500 px-6 text-center md:h-56">
            <div>
              <h1 className="mb-2 text-2xl font-bold text-white md:text-3xl">
                {cafe.name}
              </h1>
              <p className="text-xs text-white/80 md:text-sm">
                High-energy gaming space for PC, console and more.
              </p>
            </div>
          </div>
        )}

        {/* Details + booking card */}
        <div className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
          {/* Name + address + inline directions */}
          <div className="space-y-2">
            <h2 className="text-lg font-semibold md:text-xl">{cafe.name}</h2>

            {mapsUrl ? (
              <div className="flex items-center justify-between gap-3 text-xs md:text-sm">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-[14px] leading-none text-red-400">
                    📍
                  </span>
                  <span className="truncate text-gray-400">
                    {cafe.address ?? "Address coming soon"}
                  </span>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 text-xs font-semibold text-sky-400 underline-offset-2 hover:underline md:text-sm"
                >
                  Directions
                </a>
              </div>
            ) : (
              <p className="mt-1 text-xs text-gray-400 md:text-sm">
                {cafe.address ?? "Address coming soon"}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="pt-3 text-xs text-gray-400 md:text-sm">
            <p>Starts from</p>
            <p className="text-xl font-semibold text-white md:text-2xl">
              ₹{cafe.hourly_price ?? 0}
              <span className="text-xs font-normal text-gray-400 md:text-sm">
                {" "}
                /hr
              </span>
            </p>
            <p className="text-[10px] text-gray-500 md:text-xs">
              intro price (subject to change)
            </p>
          </div>

          {/* CTA */}
          <Link href={`/cafes/${cafe.id}/book`}>
            <button className="mt-2 w-full rounded-xl bg-white py-3 text-sm font-semibold text-black">
              Book now
            </button>
          </Link>
        </div>
      </section>

      {/* Consoles / devices available */}
      {availableConsoles.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold md:text-lg">
            Consoles available
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {availableConsoles.map(({ key, icon, label }) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[11px] text-gray-100"
              >
                <span className="text-base leading-none md:text-lg">
                  {icon}
                </span>
                <span className="leading-none">{label}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* About */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold md:text-lg">About the café</h2>
        <p className="text-xs leading-relaxed text-gray-400 md:text-sm">
          {cafe.description
            ? cafe.description
            : "Description coming soon. This café will soon add more details about their setup, PCs, consoles and ambience."}
        </p>
      </section>

      {/* Gallery */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold md:text-lg">Gallery</h2>
        <CafeGallery images={galleryImages} />
      </section>

      {/* Venue / directions */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold md:text-lg">Venue</h2>
        <div className="flex flex-col gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium md:text-base">{cafe.name}</p>
            <p className="text-xs text-gray-400 md:text-sm">
              {cafe.address ?? "Address coming soon"}
            </p>
          </div>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-700 px-4 py-2 text-xs md:text-sm"
            >
              Get directions
            </a>
          )}
        </div>
      </section>
    </main>
  );
}