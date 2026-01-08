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
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .nav-glass {
          background: rgba(8, 8, 12, 0.75);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          border-bottom: 1px solid rgba(255, 7, 58, 0.1);
        }

        .nav-glass-scrolled {
          background: rgba(5, 5, 8, 0.80);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                      0 2px 8px rgba(255, 7, 58, 0.15);
        }

        .brand-glow {
          text-shadow: 0 0 25px rgba(255, 7, 58, 0.6),
                       0 0 50px rgba(255, 7, 58, 0.3);
        }

        .logo-container {
          background: linear-gradient(135deg, 
            rgba(255, 7, 58, 0.15) 0%,
            rgba(255, 7, 58, 0.05) 100%);
          border: 1px solid rgba(255, 7, 58, 0.3);
        }

        .logo-outer-ring {
          position: relative;
          overflow: hidden;
        }

        .logo-outer-ring::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(135deg, 
            #ff073a 0%,
            #ff073a 50%,
            #00f0ff 100%);
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .logo-outer-ring:hover::before {
          opacity: 0.5;
          animation: rotate 2s linear infinite;
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .menu-item {
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .menu-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #ff073a, #ff073a);
          transition: all 0.3s ease;
          transform: translateX(-50%);
        }

        .menu-item:hover::after {
          width: 80%;
        }

        .avatar-container {
          background: linear-gradient(135deg, #ff073a, #00f0ff);
          padding: 2px;
          transition: all 0.3s ease;
        }

        .avatar-container:hover {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(255, 7, 58, 0.5);
        }

        .dropdown-menu {
          background: rgba(10, 10, 15, 0.98);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 7, 58, 0.2);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5),
                      0 8px 32px rgba(255, 7, 58, 0.15);
        }

        .login-btn {
          background: linear-gradient(135deg, #ff073a, #ff073a);
          box-shadow: 0 4px 20px rgba(255, 7, 58, 0.4),
                      inset 0 1px 1px rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .login-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
          transition: 0.5s;
        }

        .login-btn:hover::before {
          left: 100%;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(255, 7, 58, 0.6),
                      inset 0 1px 1px rgba(255, 255, 255, 0.3);
        }

        .login-btn:active {
          transform: translateY(0);
        }

        .dropdown-enter {
          animation: dropdownEnter 0.25s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        @keyframes dropdownEnter {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .icon-container {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          transition: all 0.3s ease;
        }

        .menu-item:hover .icon-container {
          background: rgba(255, 7, 58, 0.1);
          border-color: rgba(255, 7, 58, 0.3);
          transform: translateX(2px);
        }

        .divider {
          background: linear-gradient(90deg, 
            transparent, 
            rgba(255, 7, 58, 0.3), 
            transparent);
        }

        .status-badge {
          background: linear-gradient(135deg, 
            rgba(255, 7, 58, 0.2) 0%,
            rgba(0, 240, 255, 0.2) 100%);
          border: 1px solid rgba(255, 7, 58, 0.3);
        }
      `}</style>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "nav-glass-scrolled" : "nav-glass"
        }`}
      >
        {/* Top accent line */}
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#ff073a] to-transparent opacity-70" />

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2">
          {/* Brand Section */}
          <Link href="/" className="flex items-center gap-3 group">
            

            {/* Brand Text */}
            <div className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-md font-extrabold tracking-tight"
                  style={{ fontFamily: "Orbitron, sans-serif" }}
                >
                  <span className="text-[#ff073a] brand-glow">BOOK</span>
                  <span className="text-white">MY</span>
                  <span className="text-white">GAME</span>
                </span>
               
              </div>
              
            </div>
          </Link>

          {/* Right Side */}
          {!isLoginPage && (
            <div className="flex items-center gap-4">
              {loading ? (
                // Loading skeleton
                <div className="flex items-center gap-3">
                  <div className="h-10 w-24 rounded-lg bg-gradient-to-r from-gray-900/50 to-gray-800/50 animate-pulse"></div>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-r from-gray-900/50 to-gray-800/50 animate-pulse"></div>
                </div>
              ) : user ? (
                // Logged in state
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#0a0a0f] to-[#101016] px-2.5 py-1.5 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#ff073a]/5"
                  >
                    {/* Avatar */}
                    <div className="avatar-container rounded-full">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101016] text-sm font-bold text-white uppercase shadow-lg">
                        {initialsFromUser(user)}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="hidden md:block text-left">
                      <div
                        className="text-sm font-semibold text-white max-w-[120px] truncate"
                        style={{ fontFamily: "Inter, sans-serif" }}
                      >
                        {displayName(user)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {userRole ? capitalizeFirst(userRole) : "Player"}
                      </div>
                    </div>

                    {/* Dropdown arrow */}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
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
                    <div className="dropdown-menu absolute right-0 mt-2 w-64 rounded-2xl p-2 z-50">
                      {/* User info header */}
                      <div className="px-4 py-3 mb-2">
                        <div
                          className="text-sm font-semibold text-white truncate"
                          style={{ fontFamily: "Inter, sans-serif" }}
                        >
                          {displayName(user)}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {user.email}
                        </div>
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium status-badge text-[#ff073a]">
                            {userRole ? capitalizeFirst(userRole) : "Player"}
                          </span>
                        </div>
                      </div>

                      <div className="divider h-px my-2" />

                      {/* Menu Items */}
                      <div className="space-y-1">
                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            router.push("/dashboard");
                          }}
                          className="menu-item flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5"
                        >
                          <div className="icon-container flex h-10 w-10 items-center justify-center rounded-xl">
                            <svg
                              className="w-5 h-5 text-[#00f0ff]"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div
                              className="text-sm font-medium text-white"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              My Bookings
                            </div>
                            <div className="text-xs text-gray-400">
                              View your reservations
                            </div>
                          </div>
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>

                        <button
                          onClick={() => {
                            setMenuOpen(false);
                            router.push("/profile");
                          }}
                          className="menu-item flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5"
                        >
                          <div className="icon-container flex h-10 w-10 items-center justify-center rounded-xl">
                            <svg
                              className="w-5 h-5 text-gray-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div
                              className="text-sm font-medium text-white"
                              style={{ fontFamily: "Inter, sans-serif" }}
                            >
                              Profile Settings
                            </div>
                            <div className="text-xs text-gray-400">
                              Account settings
                            </div>
                          </div>
                        </button>

                        {/* Owner Dashboard */}
                        {(userRole === "owner" || userRole === "admin" || userRole === "super_admin") && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              router.push("/owner");
                            }}
                            className="menu-item flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5"
                          >
                            <div className="icon-container flex h-10 w-10 items-center justify-center rounded-xl" style={{
                              background: 'rgba(168, 85, 247, 0.1)',
                              border: '1px solid rgba(168, 85, 247, 0.2)'
                            }}>
                              <svg
                                className="w-5 h-5 text-purple-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div
                                className="text-sm font-medium text-white"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                Owner Dashboard
                              </div>
                              <div className="text-xs text-gray-400">
                                Manage your cafés
                              </div>
                            </div>
                          </button>
                        )}

                        {/* Admin Dashboard */}
                        {(userRole === "admin" || userRole === "super_admin") && (
                          <button
                            onClick={() => {
                              setMenuOpen(false);
                              router.push("/admin");
                            }}
                            className="menu-item flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5"
                          >
                            <div className="icon-container flex h-10 w-10 items-center justify-center rounded-xl" style={{
                              background: 'rgba(245, 158, 11, 0.1)',
                              border: '1px solid rgba(245, 158, 11, 0.2)'
                            }}>
                              <svg
                                className="w-5 h-5 text-amber-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div
                                className="text-sm font-medium text-white"
                                style={{ fontFamily: "Inter, sans-serif" }}
                              >
                                Admin Dashboard
                              </div>
                              <div className="text-xs text-gray-400">
                                System management
                              </div>
                            </div>
                          </button>
                        )}
                      </div>

                      <div className="divider h-px my-2" />

                      {/* Logout */}
                      <button
                        onClick={handleLogout}
                        className="menu-item flex w-full items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 group"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-red-500/10 to-red-500/5 group-hover:from-red-500/20 group-hover:to-red-500/10 transition-all duration-300">
                          <svg
                            className="w-5 h-5 text-red-400 group-hover:text-red-300"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div
                            className="text-sm font-medium text-red-400 group-hover:text-red-300"
                            style={{ fontFamily: "Inter, sans-serif" }}
                          >
                            Logout
                          </div>
                          <div className="text-xs text-gray-400 group-hover:text-gray-300">
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
                  className="login-btn flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ fontFamily: "Inter, sans-serif" }}
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

/* Helper functions */
function displayName(user: any) {
  return (
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Player"
  );
}

function initialsFromUser(user: any) {
  const name: string = displayName(user);
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function capitalizeFirst(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}