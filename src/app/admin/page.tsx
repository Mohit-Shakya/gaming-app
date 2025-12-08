// src/app/admin/page.tsx
"use client";

import CafesTable from "./_components/CafesTable";
import AdminRecentBookings from "./_components/AdminRecentBookings";
import ManageCafes from "./_components/ManageCafes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { colors, fonts } from "@/lib/constants";

type AdminStats = {
  totalCafes: number;
  totalBookings: number;
  todayBookings: number;
  totalUsers: number;
  totalRevenue: number; 
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "cafes" | "bookings" | "manage">("overview");

  // 1) Check if user is admin
  useEffect(() => {
    async function checkAdmin() {
      if (userLoading) return;

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role, is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Admin check error:", profileError);
          setIsAdmin(false);
          router.push("/dashboard");
          return;
        }

        if (!profile) {
          console.log("No profile found, redirecting to onboarding");
          router.push("/onboarding");
          return;
        }

        const role = (profile as any)?.role;
        const is_admin = (profile as any)?.is_admin;

        const isReallyAdmin =
          role === "admin" || role === "super_admin" || is_admin === true;

        if (!isReallyAdmin) {
          router.push("/dashboard");
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Admin check error:", err);
        router.push("/dashboard");
        return;
      } finally {
        setIsChecking(false);
      }
    }

    checkAdmin();
  }, [user, userLoading, router]);

  // 2) Load simple stats for admin
  useEffect(() => {
    if (!isAdmin) return;

    async function loadStats() {
      try {
        setLoadingStats(true);
        setError(null);

        // Cafes count
        const { count: cafesCount, error: cafesError } = await supabase
          .from("cafes")
          .select("id", { count: "exact", head: true });

        if (cafesError) throw cafesError;

        // Total bookings
        const { count: bookingsCount, error: bookingsError } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true });

        if (bookingsError) throw bookingsError;

        // Today bookings
        const todayStr = new Date().toISOString().slice(0, 10);
        const { count: todayBookingsCount, error: todayError } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("booking_date", todayStr);

        if (todayError) throw todayError;

        // Total users
        const { count: usersCount, error: usersError } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });

        if (usersError) throw usersError;

        // Total revenue (simple sum of total_amount on bookings)
        const { data: revenueRows, error: revenueError } = await supabase
          .from("bookings")
          .select("total_amount");

        if (revenueError) throw revenueError;

        const totalRevenue =
          revenueRows?.reduce(
            (sum, row) => sum + (row.total_amount ?? 0),
            0
          ) ?? 0;

        setStats({
          totalCafes: cafesCount ?? 0,
          totalBookings: bookingsCount ?? 0,
          todayBookings: todayBookingsCount ?? 0,
          totalUsers: usersCount ?? 0,
          totalRevenue,
        });
      } catch (err) {
        console.error("Admin stats error:", err);
        setError("Could not load admin stats.");
      } finally {
        setLoadingStats(false);
      }
    }

    loadStats();
  }, [isAdmin]);

  // Loading admin check
  if (isChecking || userLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.dark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.body,
          color: colors.textSecondary,
        }}
      >
        Checking admin access…
      </div>
    );
  }

  if (!isAdmin) {
    // While redirecting
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `radial-gradient(circle at top, #1e1b4b 0, #050509 45%)`,
        fontFamily: fonts.body,
        color: colors.textPrimary,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "20px 20px 60px",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 32,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, #a855f7, #ec4899)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                }}
              >
                ⚡
              </div>
              <div>
                <p
                  style={{
                    fontSize: 10,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: colors.textMuted,
                    marginBottom: 2,
                  }}
                >
                  Admin Dashboard
                </p>
                <h1
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 24,
                    margin: 0,
                    background: "linear-gradient(135deg, #fff, #a855f7)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Platform Control
                </h1>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: "rgba(15,23,42,0.6)",
                color: colors.textSecondary,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(15,23,42,0.9)";
                e.currentTarget.style.borderColor = colors.cyan;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(15,23,42,0.6)";
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              🔄 Refresh
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #a855f7, #ec4899)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 16px rgba(168,85,247,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              👤 User Dashboard
            </button>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            padding: 6,
            background: colors.darkerCard,
            borderRadius: 12,
            border: `1px solid ${colors.border}`,
          }}
        >
          {[
            { id: "overview" as const, label: "📊 Overview", icon: "📊" },
            { id: "cafes" as const, label: "🏪 Cafés", icon: "🏪" },
            { id: "manage" as const, label: "⚙️ Manage Cafés", icon: "⚙️" },
            { id: "bookings" as const, label: "📅 Bookings", icon: "📅" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px 20px",
                borderRadius: 8,
                border: "none",
                background: activeTab === tab.id
                  ? "linear-gradient(135deg, rgba(168,85,247,0.3), rgba(236,72,153,0.3))"
                  : "transparent",
                color: activeTab === tab.id ? colors.textPrimary : colors.textSecondary,
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
                borderLeft: activeTab === tab.id ? `3px solid ${colors.purple}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = "rgba(148,163,184,0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error message (if stats failed) */}
        {error && (
          <div
            style={{
              marginBottom: 20,
              padding: "14px 16px",
              borderRadius: 12,
              border: "1px solid rgba(248,113,113,0.6)",
              background: "rgba(248,113,113,0.08)",
              fontSize: 13,
              color: "#fecaca",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === "overview" && (
          <>
            {/* Stats grid */}
            <section
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 16,
                marginBottom: 32,
              }}
            >
              {[
                {
                  label: "Total Cafés",
                  value: stats?.totalCafes ?? 0,
                  hint: "Active gaming cafés",
                  icon: "🏪",
                  color: colors.cyan,
                },
                {
                  label: "Total Bookings",
                  value: stats?.totalBookings ?? 0,
                  hint: "All-time bookings",
                  icon: "📅",
                  color: colors.purple,
                },
                {
                  label: "Today's Bookings",
                  value: stats?.todayBookings ?? 0,
                  hint: "Today",
                  icon: "⚡",
                  color: colors.orange,
                },
                {
                  label: "Total Users",
                  value: stats?.totalUsers ?? 0,
                  hint: "Registered players",
                  icon: "👥",
                  color: colors.green,
                },
              ].map((card) => (
                <div
                  key={card.label}
                  style={{
                    padding: "20px",
                    borderRadius: 16,
                    background: colors.darkerCard,
                    border: `1px solid ${colors.border}`,
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = card.color;
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = colors.border;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <p
                        style={{
                          fontSize: 11,
                          color: colors.textMuted,
                          marginBottom: 8,
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                        }}
                      >
                        {card.label}
                      </p>
                      <p
                        style={{
                          fontFamily: fonts.heading,
                          fontSize: 32,
                          margin: 0,
                          color: card.color,
                          lineHeight: 1,
                        }}
                      >
                        {loadingStats ? "…" : card.value}
                      </p>
                      <p
                        style={{
                          marginTop: 8,
                          fontSize: 12,
                          color: colors.textSecondary,
                        }}
                      >
                        {card.hint}
                      </p>
                    </div>
                    <div
                      style={{
                        fontSize: 28,
                        opacity: 0.6,
                      }}
                    >
                      {card.icon}
                    </div>
                  </div>
                </div>
              ))}

              {/* Revenue card */}
              <div
                style={{
                  padding: "20px",
                  borderRadius: 16,
                  background:
                    "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(15,23,42,0.9))",
                  border: `2px solid rgba(34,197,94,0.5)`,
                  gridColumn: "span 1",
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 28px rgba(34,197,94,0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        color: "rgba(209,250,229,0.9)",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                      }}
                    >
                      Total Revenue
                    </p>
                    <p
                      style={{
                        fontFamily: fonts.heading,
                        fontSize: 32,
                        margin: 0,
                        color: "#bbf7d0",
                        lineHeight: 1,
                      }}
                    >
                      {loadingStats ? "…" : `₹${stats?.totalRevenue ?? 0}`}
                    </p>
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: 12,
                        color: "rgba(209,250,229,0.8)",
                      }}
                    >
                      All cafés combined
                    </p>
                  </div>
                  <div
                    style={{
                      fontSize: 28,
                      opacity: 0.8,
                    }}
                  >
                    💰
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Stats Summary */}
            <div
              style={{
                padding: "20px",
                borderRadius: 16,
                background: colors.darkCard,
                border: `1px solid ${colors.border}`,
                marginBottom: 32,
              }}
            >
              <h2
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 18,
                  marginBottom: 16,
                  color: colors.textPrimary,
                }}
              >
                📈 Quick Insights
              </h2>
              <div style={{ display: "grid", gap: 12, fontSize: 14, color: colors.textSecondary }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: colors.green }}>✓</span>
                  <span>
                    Average of{" "}
                    <strong style={{ color: colors.textPrimary }}>
                      {stats?.totalCafes && stats?.totalBookings
                        ? Math.round(stats.totalBookings / stats.totalCafes)
                        : 0}
                    </strong>{" "}
                    bookings per café
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: colors.cyan }}>✓</span>
                  <span>
                    Average revenue per booking:{" "}
                    <strong style={{ color: colors.textPrimary }}>
                      ₹
                      {stats?.totalBookings && stats?.totalRevenue
                        ? Math.round(stats.totalRevenue / stats.totalBookings)
                        : 0}
                    </strong>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: colors.orange }}>✓</span>
                  <span>
                    Platform has{" "}
                    <strong style={{ color: colors.textPrimary }}>{stats?.todayBookings ?? 0}</strong>{" "}
                    active bookings today
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === "cafes" && <CafesTable />}

        {activeTab === "manage" && <ManageCafes />}

        {activeTab === "bookings" && <AdminRecentBookings />}
      </div>
    </div>
  );
}