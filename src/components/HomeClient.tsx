// src/components/HomeClient.tsx
"use client";

import { useMemo, useState } from "react";
import CafeList from "@/components/CafeList";
import type { Cafe } from "../types/cafe";

type Props = {
  cafes: Cafe[];
};

type SortKey = "relevance" | "price_asc" | "price_desc";

export default function HomeClient({ cafes }: Props) {
  const safeCafes: Cafe[] = Array.isArray(cafes) ? cafes : [];

  const [query, setQuery] = useState("");

  const [onlyPs5, setOnlyPs5] = useState(false);
  const [onlyPc, setOnlyPc] = useState(false);
  const [onlyPool, setOnlyPool] = useState(false);
  const [onlyWheel, setOnlyWheel] = useState(false);
  const [onlyVr, setOnlyVr] = useState(false);
  const [onlySnooker, setOnlySnooker] = useState(false);

  const [sortBy, setSortBy] = useState<SortKey>("relevance");

  // ----- filtering + sorting -----
  const filteredCafes = useMemo(() => {
    let list = [...safeCafes];

    // text search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) =>
        [c.name, c.address, c.city].some((field) =>
          field?.toLowerCase().includes(q)
        )
      );
    }

    // feature filters
    if (onlyPs5) list = list.filter((c) => (c.ps5_count ?? 0) > 0);
    if (onlyPc) list = list.filter((c) => (c.pc_count ?? 0) > 0);
    if (onlyPool) list = list.filter((c) => (c.pool_count ?? 0) > 0);
    if (onlyWheel)
      list = list.filter((c) => ((c as any).steering_wheel_count ?? 0) > 0);
    if (onlyVr) list = list.filter((c) => ((c as any).vr_count ?? 0) > 0);
    if (onlySnooker)
      list = list.filter((c) => ((c as any).snooker_count ?? 0) > 0);

    // sort
    if (sortBy === "price_asc") {
      list.sort(
        (a, b) =>
          (a.hourly_price ?? Number.POSITIVE_INFINITY) -
          (b.hourly_price ?? Number.POSITIVE_INFINITY)
      );
    } else if (sortBy === "price_desc") {
      list.sort(
        (a, b) => (b.hourly_price ?? 0) - (a.hourly_price ?? 0)
      );
    }

    return list;
  }, [
    safeCafes,
    query,
    onlyPs5,
    onlyPc,
    onlyPool,
    onlyWheel,
    onlyVr,
    onlySnooker,
    sortBy,
  ]);

  const activeFiltersCount = useMemo(() => {
    let n = 0;
    if (onlyPs5) n++;
    if (onlyPc) n++;
    if (onlyPool) n++;
    if (onlyWheel) n++;
    if (onlyVr) n++;
    if (onlySnooker) n++;
    return n;
  }, [onlyPs5, onlyPc, onlyPool, onlyWheel, onlyVr, onlySnooker]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex max-w-5xl flex-col px-4 py-6 md:py-10">
        {/* Hero text */}
        <section className="mb-5 md:mb-6">
          <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-gray-500">
            Discover
          </p>
          <h1 className="text-2xl font-semibold md:text-3xl">
            Find a gaming café near you
          </h1>
          <p className="mt-2 text-xs text-gray-400 md:text-sm">
            Browse cafés, check pricing and book your favourite console
            in a few taps.
          </p>
        </section>

        {/* Search + filters container */}
        <section className="mb-4 space-y-3 rounded-3xl border border-zinc-900 bg-zinc-950/80 px-3 py-3 md:px-4 md:py-4">
          {/* 1) Search bar */}
          <div>
            <div className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-3 py-2.5 text-xs sm:text-sm">
              <span className="text-lg text-zinc-500">🔍</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by café, area or city"
                className="w-full bg-transparent text-xs text-zinc-100 outline-none placeholder:text-zinc-500 sm:text-sm"
              />
            </div>
          </div>

          {/* 2) Sort row only */}
          <div className="flex w-full items-center justify-start text-xs sm:text-sm">
            <span className="mr-2 text-[11px] uppercase tracking-[0.16em] text-zinc-500">
              Sort
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="rounded-2xl bg-zinc-900 px-3 py-2 text-[11px] text-white ring-1 ring-zinc-800 focus:outline-none sm:text-xs"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: Low to high</option>
              <option value="price_desc">Price: High to low</option>
            </select>
          </div>

          {/* 3) Filter chips row */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-[11px] sm:text-xs">
            <span className="shrink-0 text-[11px] text-zinc-500">
              Filters:
            </span>

            <button
              type="button"
              onClick={() => setOnlyPs5((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                onlyPs5
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-900 text-zinc-200"
              }`}
            >
              🎮 <span>PS5</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyPc((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                onlyPc
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-900 text-zinc-200"
              }`}
            >
              💻 <span>PC</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyPool((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                onlyPool
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-900 text-zinc-200"
              }`}
            >
              🎱 <span>Pool</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyWheel((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                onlyWheel
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-900 text-zinc-200"
              }`}
            >
              🏎️ <span>Wheel</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlyVr((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                onlyVr
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-900 text-zinc-200"
              }`}
            >
              🥽 <span>VR</span>
            </button>

            <button
              type="button"
              onClick={() => setOnlySnooker((v) => !v)}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 ${
                onlySnooker
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-zinc-900 text-zinc-200"
              }`}
            >
              🎯 <span>Snooker</span>
            </button>

            {/* Tiny summary on the right */}
            <span className="ml-auto shrink-0 text-[10px] text-zinc-500 sm:text-[11px]">
              {activeFiltersCount === 0
                ? "None active"
                : `${activeFiltersCount} active`}
              {sortBy !== "relevance" && ` • ${sortLabel(sortBy)}`}
            </span>
          </div>
        </section>

        {/* List */}
        {filteredCafes.length > 0 ? (
          <CafeList cafes={filteredCafes} />
        ) : (
          <div className="mt-4 rounded-2xl bg-zinc-900/80 px-4 py-4 text-xs text-zinc-400">
            No cafés match your filters yet. Try removing one of the filters
            or searching a different area.
          </div>
        )}
      </div>
    </main>
  );
}

function sortLabel(sortBy: SortKey) {
  if (sortBy === "price_asc") return "Price ↑";
  if (sortBy === "price_desc") return "Price ↓";
  return "Relevance";
}