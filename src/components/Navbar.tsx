"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoginPage = pathname === "/login";

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Navbar] logout error:", err);
    } finally {
      setMenuOpen(false);
      router.push("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-900 bg-black/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900">
            <span className="text-xl">🎮</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold">GoPlaya</div>
            <div className="text-[11px] text-zinc-400">
              Gaming café booking
            </div>
          </div>
        </Link>

        {/* Right user menu (hidden on /login) */}
        {!isLoginPage && (
          <div className="flex items-center">
            {loading ? null : user ? (
              <div className="relative">
                {/* Avatar + name button */}
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full bg-zinc-900 px-2 py-1 text-xs hover:bg-zinc-800"
                >
                  <div className="hidden text-right leading-tight md:block">
                    <div className="max-w-[140px] truncate font-medium">
                      {displayName(user)}
                    </div>
                    <div className="max-w-[160px] truncate text-[11px] text-zinc-400">
                      {user.email}
                    </div>
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold uppercase">
                    {initialsFromUser(user)}
                  </div>
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-xl border border-zinc-800 bg-zinc-950 py-1 text-xs shadow-lg">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        router.push("/dashboard");
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 hover:bg-zinc-900"
                    >
                      <span>My bookings</span>
                    </button>
                    <div className="my-1 h-px bg-zinc-800" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between px-3 py-2 text-red-400 hover:bg-zinc-900"
                    >
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => router.push("/login")}
                className="rounded-full border border-zinc-700 px-3 py-1.5 text-xs font-medium hover:border-white"
              >
                Login
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/* Helpers for display name + initials */
function displayName(user: any) {
  return (
    user.user_metadata?.full_name ??
    user.email?.split("@")[0] ??
    "Player"
  );
}

function initialsFromUser(user: any) {
  const name: string = displayName(user);
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}