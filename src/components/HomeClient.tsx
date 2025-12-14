// src/components/HomeClient.tsx
"use client";

import { useMemo, useState, useRef, useEffect } from "react";
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
  const [mounted, setMounted] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when filter sheet is open
  useEffect(() => {
    if (showFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showFilters]);

  const handleScrollToList = () => {
    if (!listRef.current) return;
    listRef.current.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleComingSoon = (feature: string) => {
    alert(`${feature} coming soon 🚧`);
  };

  const filteredCafes = useMemo(() => {
    let list = [...safeCafes];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((c) =>
        [c.name, c.address, c.city].some((field) =>
          field?.toLowerCase().includes(q)
        )
      );
    }

    if (onlyPs5) list = list.filter((c) => (c.ps5_count ?? 0) > 0);
    if (onlyPc) list = list.filter((c) => (c.pc_count ?? 0) > 0);
    if (onlyPool) list = list.filter((c) => (c.pool_count ?? 0) > 0);
    if (onlyWheel)
      list = list.filter((c) => ((c as any).steering_wheel_count ?? 0) > 0);
    if (onlyVr) list = list.filter((c) => ((c as any).vr_count ?? 0) > 0);
    if (onlySnooker)
      list = list.filter((c) => ((c as any).snooker_count ?? 0) > 0);

    if (sortBy === "price_asc") {
      list.sort(
        (a, b) =>
          (a.hourly_price ?? Number.POSITIVE_INFINITY) -
          (b.hourly_price ?? Number.POSITIVE_INFINITY)
      );
    } else if (sortBy === "price_desc") {
      list.sort((a, b) => (b.hourly_price ?? 0) - (a.hourly_price ?? 0));
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

  const clearAllFilters = () => {
    setOnlyPs5(false);
    setOnlyPc(false);
    setOnlyPool(false);
    setOnlyWheel(false);
    setOnlyVr(false);
    setOnlySnooker(false);
    setQuery("");
    setSortBy("relevance");
  };

  const filterButtons = [
    { key: "ps5", label: "PS5", icon: "🎮", active: onlyPs5, toggle: () => setOnlyPs5((v) => !v) },
    { key: "pc", label: "PC", icon: "💻", active: onlyPc, toggle: () => setOnlyPc((v) => !v) },
    { key: "pool", label: "Pool", icon: "🎱", active: onlyPool, toggle: () => setOnlyPool((v) => !v) },
    { key: "wheel", label: "Racing", icon: "🏎️", active: onlyWheel, toggle: () => setOnlyWheel((v) => !v) },
    { key: "vr", label: "VR", icon: "🥽", active: onlyVr, toggle: () => setOnlyVr((v) => !v) },
    { key: "snooker", label: "Snooker", icon: "🎯", active: onlySnooker, toggle: () => setOnlySnooker((v) => !v) },
  ];

  return (
    <>
      <style jsx global>{`
        :root {
          --neon-red: #ff073a;
          --neon-red-dim: #cc0530;
          --neon-cyan: #00f0ff;
          --dark-bg: #08080c;
          --card-bg: #101016;
        }

        * {
          -webkit-tap-highlight-color: transparent;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out forwards;
        }

        .glow-red {
          text-shadow: 0 0 20px rgba(255, 7, 58, 0.5),
                       0 0 40px rgba(255, 7, 58, 0.25);
        }

        .glow-cyan {
          text-shadow: 0 0 15px rgba(0, 240, 255, 0.5);
        }

        .bg-hero {
          background: 
            radial-gradient(ellipse 120% 60% at 50% -20%, rgba(255, 7, 58, 0.1), transparent 60%),
            #08080c;
        }

        .card-glass {
          background: rgba(16, 16, 22, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .btn-glow {
          background: linear-gradient(135deg, var(--neon-red) 0%, var(--neon-red-dim) 100%);
          box-shadow: 0 4px 20px rgba(255, 7, 58, 0.25);
          transition: transform 0.15s, box-shadow 0.15s;
        }

        .btn-glow:active {
          transform: scale(0.97);
        }

        .btn-ghost {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .btn-ghost:active {
          background: rgba(255, 255, 255, 0.08);
        }

        .chip {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .chip-active {
          background: var(--neon-red);
          border-color: var(--neon-red);
          box-shadow: 0 0 12px rgba(255, 7, 58, 0.35);
        }

        .input-field {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .input-field:focus-within {
          border-color: var(--neon-cyan);
          box-shadow: 0 0 0 2px rgba(0, 240, 255, 0.1);
        }

        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        .safe-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 20px);
        }

        .overlay-bg {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
      `}</style>

      <main className="min-h-screen bg-hero text-white">
        <div className="mx-auto max-w-2xl px-4 pt-5 pb-20 sm:pt-8 sm:pb-8 lg:max-w-5xl lg:px-6">
          
          {/* ===== HERO - Compact on mobile ===== */}
          <section className={`mb-5 sm:mb-8 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="text-center">
              {/* Tagline */}
              <p 
                className="text-[10px] sm:text-xs tracking-[0.2em] uppercase text-zinc-500 mb-1.5 sm:mb-2"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                Gaming Café Booking
              </p>
              
              {/* Main Title */}
              <h1 
                className="text-[32px] sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-none"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                <span className="glow-red text-[#ff073a]">BOOK</span>
                <span className="text-white"> MY </span>
                <span className="text-white">GAME</span>
              </h1>
              
              {/* Subtitle */}
              <p 
                className="mt-2 sm:mt-3 text-sm sm:text-base text-zinc-400"
                style={{ fontFamily: 'Rajdhani, sans-serif' }}
              >
                Reserve your <span className="text-[#00f0ff] glow-cyan">gaming seat</span> instantly
              </p>

              {/* CTA Buttons */}
              <div className="mt-5 sm:mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
                <button
                  onClick={handleScrollToList}
                  className="btn-glow w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-bold tracking-wide uppercase"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Book Now
                  </span>
                </button>
                
                <div className="flex gap-2.5 sm:gap-3">
                  <button
                    onClick={() => handleComingSoon("Membership")}
                    className="btn-ghost flex-1 sm:flex-none sm:w-auto px-5 py-3.5 rounded-xl text-sm font-semibold text-zinc-300"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Membership
                  </button>
                  <button
                    onClick={() => handleComingSoon("Tournaments")}
                    className="btn-ghost flex-1 sm:flex-none sm:w-auto px-5 py-3.5 rounded-xl text-sm font-semibold text-zinc-300"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Tournaments
                  </button>
                </div>
              </div>

              {/* Stats Row */}
              <div className="mt-5 sm:mt-6 flex justify-center items-center gap-5 sm:gap-8">
                <div className="text-center">
                  <div 
                    className="text-lg sm:text-2xl font-bold text-[#ff073a]"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    {safeCafes.length}+
                  </div>
                  <div 
                    className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wide"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Cafés
                  </div>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="text-center">
                  <div 
                    className="text-lg sm:text-2xl font-bold text-[#00f0ff]"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    24/7
                  </div>
                  <div 
                    className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wide"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Open
                  </div>
                </div>
                <div className="w-px h-8 bg-zinc-800" />
                <div className="text-center">
                  <div 
                    className="text-lg sm:text-2xl font-bold text-white"
                    style={{ fontFamily: 'Orbitron, sans-serif' }}
                  >
                    1K+
                  </div>
                  <div 
                    className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wide"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Gamers
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== SEARCH & FILTERS ===== */}
          <section 
            className={`sticky top-0 z-30 -mx-4 px-4 py-3 bg-[#08080c]/95 backdrop-blur-lg sm:relative sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: '0.1s' }}
          >
            {/* Search + Filter Button Row */}
            <div className="flex items-center gap-2.5">
              {/* Search Input */}
              <div className="input-field flex-1 flex items-center gap-2.5 rounded-xl px-3.5 py-3 transition-all">
                <svg className="w-4.5 h-4.5 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search cafés, area..."
                  className="flex-1 min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-zinc-600"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                />
                {query && (
                  <button 
                    onClick={() => setQuery("")}
                    className="p-1 text-zinc-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(true)}
                className={`relative shrink-0 p-3 rounded-xl transition-colors ${
                  activeFiltersCount > 0 
                    ? 'bg-[#ff073a] text-white' 
                    : 'btn-ghost text-zinc-400'
                }`}
                aria-label="Open filters"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-white text-[#ff073a] text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {/* Quick Filter Chips - Horizontal scroll */}
            <div className="mt-2.5 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-0.5">
                {filterButtons.map((filter) => (
                  <button
                    key={filter.key}
                    onClick={filter.toggle}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      filter.active ? 'chip-active text-white' : 'chip text-zinc-400'
                    }`}
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    <span className="text-sm">{filter.icon}</span>
                    <span>{filter.label}</span>
                  </button>
                ))}
                
                {/* Divider */}
                <div className="shrink-0 h-5 w-px bg-zinc-800 mx-0.5" />
                
                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="shrink-0 chip px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 bg-transparent appearance-none cursor-pointer pr-7"
                  style={{ 
                    fontFamily: 'Rajdhani, sans-serif',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717a'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 6px center',
                    backgroundSize: '14px'
                  }}
                >
                  <option value="relevance">Sort</option>
                  <option value="price_asc">Price ↑</option>
                  <option value="price_desc">Price ↓</option>
                </select>
              </div>
            </div>
          </section>

          {/* ===== RESULTS ===== */}
          <section 
            ref={listRef}
            className={`mt-4 sm:mt-5 ${mounted ? 'animate-fade-in' : 'opacity-0'}`}
            style={{ animationDelay: '0.15s' }}
          >
            {/* Results Header */}
            <div className="flex items-center justify-between mb-3">
              <h2 
                className="text-sm sm:text-base font-bold"
                style={{ fontFamily: 'Orbitron, sans-serif' }}
              >
                {query || activeFiltersCount > 0 ? (
                  <span className="text-zinc-300">
                    {filteredCafes.length} result{filteredCafes.length !== 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-zinc-300">All Cafés</span>
                )}
              </h2>
              
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-[#ff073a] font-medium flex items-center gap-1"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Café List or Empty State */}
            {filteredCafes.length > 0 ? (
              <CafeList cafes={filteredCafes} />
            ) : (
              <div className="card-glass rounded-2xl p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-800/60 flex items-center justify-center">
                  <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 
                  className="text-sm font-semibold text-white mb-1.5"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  No cafés found
                </h3>
                <p 
                  className="text-xs text-zinc-500 mb-4"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Try different filters or search terms
                </p>
                <button
                  onClick={clearAllFilters}
                  className="btn-glow px-5 py-2.5 rounded-lg text-xs font-bold"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Clear Filters
                </button>
              </div>
            )}
          </section>
        </div>

        {/* ===== FILTER BOTTOM SHEET (Mobile) ===== */}
        {showFilters && (
          <div 
            className="fixed inset-0 z-50"
            onClick={() => setShowFilters(false)}
          >
            {/* Overlay */}
            <div className="overlay-bg absolute inset-0 animate-fade-in" style={{ animationDuration: '0.2s' }} />
            
            {/* Sheet */}
            <div 
              className="absolute bottom-0 left-0 right-0 bg-[#101016] rounded-t-[24px] animate-slide-up safe-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-9 h-1 rounded-full bg-zinc-700" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-2.5">
                <h3 
                  className="text-base font-bold"
                  style={{ fontFamily: 'Orbitron, sans-serif' }}
                >
                  Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 -mr-2 text-zinc-400"
                  aria-label="Close filters"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Filter Grid */}
              <div className="px-5 pt-2 pb-3">
                <p 
                  className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2.5"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Equipment
                </p>
                
                <div className="grid grid-cols-2 gap-2.5">
                  {filterButtons.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={filter.toggle}
                      className={`flex items-center gap-2.5 p-3.5 rounded-xl text-left transition-all ${
                        filter.active 
                          ? 'bg-[#ff073a] text-white' 
                          : 'bg-zinc-900/70 text-zinc-300 border border-zinc-800/80'
                      }`}
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      <span className="text-xl">{filter.icon}</span>
                      <span className="font-semibold text-sm">{filter.label}</span>
                      {filter.active && (
                        <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Sort Section */}
                <div className="pt-4 mt-3 border-t border-zinc-800/60">
                  <p 
                    className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2.5"
                    style={{ fontFamily: 'Rajdhani, sans-serif' }}
                  >
                    Sort By
                  </p>
                  <div className="flex gap-2">
                    {[
                      { value: 'relevance', label: 'Relevance' },
                      { value: 'price_asc', label: 'Price ↑' },
                      { value: 'price_desc', label: 'Price ↓' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setSortBy(option.value as SortKey)}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                          sortBy === option.value
                            ? 'bg-[#00f0ff] text-black'
                            : 'bg-zinc-900/70 text-zinc-400 border border-zinc-800/80'
                        }`}
                        style={{ fontFamily: 'Rajdhani, sans-serif' }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2.5 px-5 py-4 border-t border-zinc-800/40">
                <button
                  onClick={() => {
                    clearAllFilters();
                    setShowFilters(false);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold btn-ghost text-zinc-300"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Reset
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="flex-[2] py-3.5 rounded-xl text-sm font-bold btn-glow"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  Show {filteredCafes.length} Results
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}