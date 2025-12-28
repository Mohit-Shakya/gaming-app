// src/components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === "/login";
  const isOwnerPage = pathname === "/owner";

  // Don't render navbar on owner page
  if (isOwnerPage) {
    return null;
  }

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user role
  useEffect(() => {
    async function fetchUserRole() {
      if (!user) {
        setUserRole(null);
        return;
      }

      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        setUserRole(profile?.role?.toLowerCase() || null);
      } catch (err) {
        console.error("Error fetching user role:", err);
        setUserRole(null);
      }
    }

    fetchUserRole();
  }, [user]);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

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
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800&family=Rajdhani:wght@400;500;600;700&display=swap');

        .nav-glass {
          background: rgba(8, 8, 12, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .nav-glass-scrolled {
          background: rgba(8, 8, 12, 0.95);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3),
                      0 1px 0 rgba(255, 7, 58, 0.1);
        }

        .brand-glow {
          text-shadow: 0 0 20px rgba(255, 7, 58, 0.4);
        }

        .logo-pulse {
          animation: logoPulse 3s ease-in-out infinite;
        }

        @keyframes logoPulse {
          0%, 100% { 
            box-shadow: 0 0 10px rgba(255, 7, 58, 0.3),
                        inset 0 0 10px rgba(255, 7, 58, 0.1);
          }
          50% { 
            box-shadow: 0 0 20px rgba(255, 7, 58, 0.5),
                        inset 0 0 15px rgba(255, 7, 58, 0.2);
          }
        }

        .menu-item {
          transition: all 0.15s ease;
        }

        .menu-item:active {
          transform: scale(0.98);
        }

        .avatar-ring {
          background: linear-gradient(135deg, #ff073a 0%, #00f0ff 100%);
          padding: 2px;
        }

        .dropdown-enter {
          animation: dropdownEnter 0.2s ease-out forwards;
        }

        @keyframes dropdownEnter {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled ? "nav-glass-scrolled" : "nav-glass"
        }`}
      >
        {/* Accent line at top */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#ff073a] to-transparent opacity-60" />

        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-2.5 lg:max-w-5xl">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* Logo Icon */}
            <div className="logo-pulse relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1a1a24] to-[#101016] border border-[#ff073a]/20">
              <span className="text-lg">🎮</span>
            </div>

            {/* Brand Text */}
            <div className="flex flex-col">
              <span
                className="text-[15px] sm:text-base font-extrabold tracking-tight leading-none"
                style={{ fontFamily: "Orbitron, sans-serif" }}
              >
                <span className="text-[#ff073a] brand-glow">BOOK</span>
                <span className="text-white">MY</span>
                <span className="text-white">GAME</span>
              </span>
              <span
                className="text-[9px] sm:text-[10px] text-zinc-500 tracking-wider uppercase"
                style={{ fontFamily: "Rajdhani, sans-serif" }}
              >
                Gaming Café Booking
              </span>
            </div>
          </Link>

          {/* Right Side */}
          {!isLoginPage && (
            <div className="flex items-center gap-3">
              {loading ? (
                // Loading skeleton
                <div className="h-9 w-9 rounded-full bg-zinc-800/50 animate-pulse" />
              ) : user ? (
                // Logged in state
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2.5 rounded-full bg-zinc-900/80 pl-1 pr-3 py-1 border border-zinc-800/50 hover:border-zinc-700 transition-colors"
                  >
                    {/* Avatar */}
                    <div className="avatar-ring rounded-full">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#101016] text-[11px] font-bold text-white uppercase">
                        {initialsFromUser(user)}
                      </div>
                    </div>

                    {/* Name - hidden on mobile */}
                    <div className="hidden sm:block text-right leading-tight pr-1">
                      <div
                        className="max-w-[100px] truncate text-xs font-semibold text-white"
                        style={{ fontFamily: "Rajdhani, sans-serif" }}
                      >
                        {displayName(user)}
                      </div>
                    </div>

                    {/* Dropdown arrow */}
                    <svg
                      className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {menuOpen && (
                    <div className="dropdown-enter absolute right-0 mt-2 w-52 rounded-xl border border-zinc-800/80 bg-[#101016] py-2 shadow-xl shadow-black/50">
                      {/* User info header */}
                      <div className="px-3 pb-2 mb-2 border-b border-zinc-800/50">
                        <div
                          className="text-sm font-semibold text-white truncate"
                          style={{ fontFamily: "Rajdhani, sans-serif" }}
                        >
                          {displayName(user)}
                        </div>
                        <div className="text-[11px] text-zinc-500 truncate">
                          {user.email}
                        </div>
                      </div>

                      {/* Menu Items */}
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/dashboard");
                        }}
                        className="menu-item flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-900/80"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/50">
                          <svg
                            className="w-4 h-4 text-[#00f0ff]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                            />
                          </svg>
                        </div>
                        <div>
                          <div
                            className="text-sm font-medium text-white"
                            style={{ fontFamily: "Rajdhani, sans-serif" }}
                          >
                            My Bookings
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            View your reservations
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          router.push("/profile");
                        }}
                        className="menu-item flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-900/80"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800/50">
                          <svg
                            className="w-4 h-4 text-zinc-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div
                            className="text-sm font-medium text-white"
                            style={{ fontFamily: "Rajdhani, sans-serif" }}
                          >
                            Profile
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Account settings
                          </div>
                        </div>
                      </button>

                      {/* Owner Dashboard - Only show for owners and admins */}
                      {(userRole === "owner" || userRole === "admin" || userRole === "super_admin") && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            router.push("/owner");
                          }}
                          className="menu-item flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-900/80"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                            <svg
                              className="w-4 h-4 text-purple-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                          <div>
                            <div
                              className="text-sm font-medium text-white"
                              style={{ fontFamily: "Rajdhani, sans-serif" }}
                            >
                              Owner Dashboard
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              Manage your cafés
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Admin Dashboard - Only show for admins */}
                      {(userRole === "admin" || userRole === "super_admin") && (
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            router.push("/admin");
                          }}
                          className="menu-item flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-900/80"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                            <svg
                              className="w-4 h-4 text-orange-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                            </svg>
                          </div>
                          <div>
                            <div
                              className="text-sm font-medium text-white"
                              style={{ fontFamily: "Rajdhani, sans-serif" }}
                            >
                              Admin Dashboard
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              System management
                            </div>
                          </div>
                        </button>
                      )}

                      <div className="my-2 h-px bg-zinc-800/50 mx-3" />

                      <button
                        onClick={handleLogout}
                        className="menu-item flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-zinc-900/80 group"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
                          <svg
                            className="w-4 h-4 text-red-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                        </div>
                        <div>
                          <div
                            className="text-sm font-medium text-red-400"
                            style={{ fontFamily: "Rajdhani, sans-serif" }}
                          >
                            Logout
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Sign out of account
                          </div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Not logged in
                <button
                  onClick={() => router.push("/login")}
                  className="flex items-center gap-2 rounded-lg bg-[#ff073a] px-4 py-2 text-sm font-bold text-white shadow-lg shadow-[#ff073a]/20 hover:shadow-[#ff073a]/30 transition-shadow active:scale-[0.97]"
                  style={{ fontFamily: "Rajdhani, sans-serif" }}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>Login</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>
    </>
  );
}

/* Helpers for display name + initials */
function displayName(user: { user_metadata?: { full_name?: string }; email?: string }) {
  return (
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Player"
  );
}

function initialsFromUser(user: { user_metadata?: { full_name?: string }; email?: string }) {
  const name: string = displayName(user);
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}