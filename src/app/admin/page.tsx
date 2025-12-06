// src/app/admin/page.tsx
"use client";

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
          // If there's an error, just redirect - don't let them access admin
          setIsAdmin(false);
          router.push("/dashboard");
          return;
        }

        // If no profile found, redirect to onboarding
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
          // Not admin – kick to normal dashboard
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
          maxWidth: 960,
          margin: "0 auto",
          padding: "16px 16px 40px",
        }}
      >
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: colors.textMuted,
                marginBottom: 4,
              }}
            >
              Admin
            </p>
            <h1
              style={{
                fontFamily: fonts.heading,
                fontSize: 22,
                margin: 0,
              }}
            >
              Platform Overview
            </h1>
          </div>

          <button
            onClick={() => router.push("/dashboard")}
            style={{
              padding: "8px 14px",
              borderRadius: 999,
              border: `1px solid ${colors.border}`,
              background: "rgba(15,23,42,0.8)",
              color: colors.textSecondary,
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Go to user dashboard
          </button>
        </header>

        {/* Stats grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Total Cafés",
              value: stats?.totalCafes ?? 0,
              hint: "Active gaming cafés",
            },
            {
              label: "Total Bookings",
              value: stats?.totalBookings ?? 0,
              hint: "All-time",
            },
            {
              label: "Today’s Bookings",
              value: stats?.todayBookings ?? 0,
              hint: "Today",
            },
            {
              label: "Total Users",
              value: stats?.totalUsers ?? 0,
              hint: "Registered players",
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                padding: "14px 14px",
                borderRadius: 16,
                background: colors.darkerCard,
                border: `1px solid ${colors.border}`,
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                {card.label}
              </p>
              <p
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 22,
                  margin: 0,
                }}
              >
                {loadingStats ? "…" : card.value}
              </p>
              <p
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: colors.textSecondary,
                }}
              >
                {card.hint}
              </p>
            </div>
          ))}

          {/* Revenue card */}
          <div
            style={{
              padding: "14px 14px",
              borderRadius: 16,
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.18), rgba(15,23,42,0.9))",
              border: `1px solid rgba(34,197,94,0.4)`,
            }}
          >
            <p
              style={{
                fontSize: 11,
                color: "rgba(209,250,229,0.9)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Total Revenue (All cafés)
            </p>
            <p
              style={{
                fontFamily: fonts.heading,
                fontSize: 22,
                margin: 0,
                color: "#bbf7d0",
              }}
            >
              {loadingStats ? "…" : `₹${stats?.totalRevenue ?? 0}`}
            </p>
            <p
              style={{
                marginTop: 4,
                fontSize: 11,
                color: "rgba(209,250,229,0.8)",
              }}
            >
              Simple sum of booking totals
            </p>
          </div>
        </section>

        {/* Placeholder sections for next steps */}
        <section
          style={{
            marginTop: 12,
            padding: "16px 14px",
            borderRadius: 16,
            background: colors.darkCard,
            border: `1px dashed ${colors.border}`,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Next: Cafés list + booking table
          </p>
          <p
            style={{
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            In the next step we’ll add:
            <br />• Table of all cafés (name, city, status, owner)
            <br />• Quick link to view bookings per café
          </p>
        </section>

        {error && (
          <div
            style={{
              marginTop: 16,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(248,113,113,0.6)",
              background: "rgba(248,113,113,0.08)",
              fontSize: 12,
              color: "#fecaca",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
} 