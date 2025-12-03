"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.4c-.2 1.2-.9 2.3-1.9 3.1l3.1 2.4C20.4 18.2 21.3 15.8 21.3 13c0-.7-.1-1.3-.2-1.9H12z"
      />
      <path
        fill="#34A853"
        d="M6.5 14.3l-.8.6-2.5 1.9C4.6 19.8 8.1 21.6 12 21.6c2.6 0 4.7-.9 6.2-2.1l-3.1-2.4c-.8.6-1.8 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8z"
      />
      <path
        fill="#4A90E2"
        d="M3.2 7.5C2.4 8.8 2 10.3 2 11.8s.4 3 1.2 4.3l3.3-2.6c-.2-.6-.4-1.2-.4-1.9s.1-1.3.4-1.9L3.2 7.5z"
      />
      <path
        fill="#FBBC05"
        d="M12 5.3c1.4 0 2.6.5 3.5 1.3l2.6-2.6C16.7 2.8 14.6 2 12 2 8.1 2 4.6 3.8 3.2 7.5l3.3 2.6c.7-2.2 2.7-3.8 5.5-3.8z"
      />
      <path fill="none" d="M2 2h20v20H2z" />
    </svg>
  );
}

function ControllerIcon() {
  return (
    <svg
      className="h-9 w-9 text-violet-300"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="7"
        width="18"
        height="10"
        rx="4"
        className="fill-zinc-900"
      />
      <path
        d="M8 11h-1v-1a1 1 0 0 0-2 0v1H4a1 1 0 0 0 0 2h1v1a1 1 0 1 0 2 0v-1h1a1 1 0 0 0 0-2Z"
        className="fill-violet-300"
      />
      <circle cx="16.5" cy="11" r="1" className="fill-cyan-300" />
      <circle cx="19" cy="13.5" r="1" className="fill-pink-300" />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
    } catch (err) {
      console.error("Google login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white">
      {/* subtle glow background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(139,92,246,0.18)_0,_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(56,189,248,0.18)_0,_transparent_55%)]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-5xl flex-col md:flex-row items-center justify-center px-4 py-8 gap-8">
        {/* Left / hero – hidden on very small screens? No, but it stacks */}
        <section className="w-full md:w-1/2 space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-zinc-900/70 px-3 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-zinc-800/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Slots live at your favourite cafés
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <ControllerIcon />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Book your next GG in seconds
              </h1>
              <p className="mt-1 text-sm text-zinc-400 max-w-xs">
                Reserve consoles at nearby gaming cafés. No calls, no queues,
                just tap &amp; play.
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2 text-[11px] text-zinc-300">
            <span className="rounded-full bg-zinc-900/70 px-3 py-1 ring-1 ring-zinc-800/80">
              🎮 PS5 • PC • Xbox
            </span>
            <span className="rounded-full bg-zinc-900/70 px-3 py-1 ring-1 ring-zinc-800/80">
              ⚡ Instant booking
            </span>
            <span className="rounded-full bg-zinc-900/70 px-3 py-1 ring-1 ring-zinc-800/80">
              ⭐ Rewards coming soon
            </span>
          </div>
        </section>

        {/* Right / card */}
        <section className="w-full md:w-[360px]">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 p-6 shadow-[0_18px_45px_rgba(0,0,0,0.75)] backdrop-blur">
            <h2 className="text-lg font-semibold tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1 text-xs text-zinc-400">
              Sign in to manage your bookings and find open slots.
            </p>

            <button
              onClick={signInWithGoogle}
              disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white text-black font-medium py-2.5 text-sm hover:bg-zinc-100 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
            >
              <GoogleIcon />
              <span>{loading ? "Connecting…" : "Continue with Google"}</span>
            </button>

            <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
              We only use your email to create your gaming profile. No spam,
              ever.
            </p>

            <div className="mt-4 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500 flex items-center justify-between">
              <span>Powered by Supabase Auth</span>
              <span className="font-mono text-zinc-400/80">
                v0.1 • beta access
              </span>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}