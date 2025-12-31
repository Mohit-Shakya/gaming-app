// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { colors, fonts } from "@/lib/constants";

type AdminStats = {
  totalCafes: number;
  activeCafes: number;
  pendingCafes: number;
  totalBookings: number;
  todayBookings: number;
  totalUsers: number;
  totalOwners: number;
  totalRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
};

type CafeRow = {
  id: string;
  name: string;
  slug: string;
  address: string;
  phone: string | null;
  email: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  price_starts_from: number | null;
  hourly_price: number | null;
  ps5_count: number;
  ps4_count: number;
  xbox_count: number;
  pc_count: number;
  owner_name?: string;
  owner_email?: string;
  total_bookings?: number;
  total_revenue?: number;
};

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  created_at: string;
  total_bookings?: number;
  total_spent?: number;
  last_booking?: string;
};

type BookingRow = {
  id: string;
  cafe_id: string;
  user_id: string | null;
  booking_date: string;
  start_time: string;
  duration: number;
  total_amount: number;
  status: string;
  source: string;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string;
  cafe_name?: string;
  user_name?: string;
};

type NavTab = 'overview' | 'cafes' | 'users' | 'bookings' | 'revenue' | 'reports' | 'settings';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [isChecking, setIsChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  // Data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [cafeFilter, setCafeFilter] = useState<string>("all"); // all, active, inactive, pending
  const [cafeSearch, setCafeSearch] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [bookingDateFilter, setBookingDateFilter] = useState<string>("");
  const [bookingSearch, setBookingSearch] = useState<string>("");

  // Check if user is admin
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
          router.push("/onboarding");
          return;
        }

        const role = profile.role?.toLowerCase();
        const is_admin_flag = profile.is_admin;

        const isReallyAdmin = role === "admin" || role === "super_admin" || is_admin_flag === true;

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

  // Load platform statistics
  useEffect(() => {
    if (!isAdmin) return;

    async function loadStats() {
      try {
        setLoadingData(true);
        setError(null);

        const todayStr = new Date().toISOString().slice(0, 10);

        // Get week start date
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStr = weekAgo.toISOString().slice(0, 10);

        // Get month start date
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthStr = monthAgo.toISOString().slice(0, 10);

        // Total and active cafes
        const { count: totalCafes } = await supabase
          .from("cafes")
          .select("id", { count: "exact", head: true });

        const { count: activeCafes } = await supabase
          .from("cafes")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true);

        const { count: pendingCafes } = await supabase
          .from("cafes")
          .select("id", { count: "exact", head: true })
          .eq("is_active", false);

        // Total bookings
        const { count: totalBookings } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true });

        // Today's bookings
        const { count: todayBookings } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("booking_date", todayStr);

        // Total users
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });

        // Total owners
        const { count: totalOwners } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "owner");

        // Revenue calculations
        const { data: allBookings } = await supabase
          .from("bookings")
          .select("total_amount, booking_date");

        const totalRevenue = allBookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
        const todayRevenue = allBookings?.filter(b => b.booking_date === todayStr).reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
        const weekRevenue = allBookings?.filter(b => b.booking_date >= weekStr).reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
        const monthRevenue = allBookings?.filter(b => b.booking_date >= monthStr).reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

        setStats({
          totalCafes: totalCafes || 0,
          activeCafes: activeCafes || 0,
          pendingCafes: pendingCafes || 0,
          totalBookings: totalBookings || 0,
          todayBookings: todayBookings || 0,
          totalUsers: totalUsers || 0,
          totalOwners: totalOwners || 0,
          totalRevenue,
          todayRevenue,
          weekRevenue,
          monthRevenue,
        });
      } catch (err) {
        console.error("Error loading stats:", err);
        setError("Failed to load platform statistics");
      } finally {
        setLoadingData(false);
      }
    }

    loadStats();
  }, [isAdmin]);

  // Load cafes data
  useEffect(() => {
    if (!isAdmin || activeTab !== 'cafes') return;

    async function loadCafes() {
      try {
        setLoadingData(true);

        const { data, error } = await supabase
          .from("cafes")
          .select(`
            id,
            name,
            slug,
            address,
            phone,
            email,
            owner_id,
            is_active,
            created_at,
            price_starts_from,
            hourly_price,
            ps5_count,
            ps4_count,
            xbox_count,
            pc_count
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Enrich with owner info and booking stats
        const enrichedCafes = await Promise.all(
          (data || []).map(async (cafe) => {
            // Get owner info
            const { data: owner } = await supabase
              .from("profiles")
              .select("name, email")
              .eq("id", cafe.owner_id)
              .maybeSingle();

            // Get booking stats
            const { count: bookingCount } = await supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("cafe_id", cafe.id);

            const { data: revenueData } = await supabase
              .from("bookings")
              .select("total_amount")
              .eq("cafe_id", cafe.id);

            const totalRevenue = revenueData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

            return {
              ...cafe,
              owner_name: owner?.name || "Unknown",
              owner_email: owner?.email || "N/A",
              total_bookings: bookingCount || 0,
              total_revenue: totalRevenue,
            };
          })
        );

        setCafes(enrichedCafes);
      } catch (err) {
        console.error("Error loading cafes:", err);
        setError("Failed to load cafés data");
      } finally {
        setLoadingData(false);
      }
    }

    loadCafes();
  }, [isAdmin, activeTab]);

  // Load users data
  useEffect(() => {
    if (!isAdmin || activeTab !== 'users') return;

    async function loadUsers() {
      try {
        setLoadingData(true);

        const { data, error } = await supabase
          .from("profiles")
          .select("id, name, email, phone, role, created_at")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Enrich with booking stats
        const enrichedUsers = await Promise.all(
          (data || []).map(async (user) => {
            const { count: bookingCount } = await supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id);

            const { data: bookingData } = await supabase
              .from("bookings")
              .select("total_amount, created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(1);

            const { data: revenueData } = await supabase
              .from("bookings")
              .select("total_amount")
              .eq("user_id", user.id);

            const totalSpent = revenueData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

            return {
              ...user,
              total_bookings: bookingCount || 0,
              total_spent: totalSpent,
              last_booking: bookingData?.[0]?.created_at || null,
            };
          })
        );

        setUsers(enrichedUsers);
      } catch (err) {
        console.error("Error loading users:", err);
        setError("Failed to load users data");
      } finally {
        setLoadingData(false);
      }
    }

    loadUsers();
  }, [isAdmin, activeTab]);

  // Load bookings data
  useEffect(() => {
    if (!isAdmin || activeTab !== 'bookings') return;

    async function loadBookings() {
      try {
        setLoadingData(true);

        const { data, error } = await supabase
          .from("bookings")
          .select(`
            id,
            cafe_id,
            user_id,
            booking_date,
            start_time,
            duration,
            total_amount,
            status,
            source,
            customer_name,
            customer_phone,
            created_at
          `)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        // Enrich with cafe and user names
        const enrichedBookings = await Promise.all(
          (data || []).map(async (booking) => {
            const { data: cafe } = await supabase
              .from("cafes")
              .select("name")
              .eq("id", booking.cafe_id)
              .maybeSingle();

            let userName = booking.customer_name || "Walk-in";
            if (booking.user_id) {
              const { data: user } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", booking.user_id)
                .maybeSingle();
              userName = user?.name || "Online User";
            }

            return {
              ...booking,
              cafe_name: cafe?.name || "Unknown Café",
              user_name: userName,
            };
          })
        );

        setBookings(enrichedBookings);
      } catch (err) {
        console.error("Error loading bookings:", err);
        setError("Failed to load bookings data");
      } finally {
        setLoadingData(false);
      }
    }

    loadBookings();
  }, [isAdmin, activeTab]);

  // Toggle cafe active status
  async function toggleCafeStatus(cafeId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("cafes")
        .update({ is_active: !currentStatus })
        .eq("id", cafeId);

      if (error) throw error;

      // Refresh cafes list
      setCafes(prev => prev.map(c =>
        c.id === cafeId ? { ...c, is_active: !currentStatus } : c
      ));
    } catch (err) {
      console.error("Error toggling cafe status:", err);
      alert("Failed to update café status");
    }
  }

  // Delete cafe
  async function deleteCafe(cafeId: string, cafeName: string) {
    if (!confirm(`Are you sure you want to delete "${cafeName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("cafes")
        .delete()
        .eq("id", cafeId);

      if (error) throw error;

      setCafes(prev => prev.filter(c => c.id !== cafeId));
      alert("Café deleted successfully");
    } catch (err) {
      console.error("Error deleting cafe:", err);
      alert("Failed to delete café");
    }
  }

  // Update user role
  async function updateUserRole(userId: string, newRole: string) {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      console.error("Error updating user role:", err);
      alert("Failed to update user role");
    }
  }

  // Delete user
  async function deleteUser(userId: string, userName: string) {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (error) throw error;

      setUsers(prev => prev.filter(u => u.id !== userId));
      alert("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user");
    }
  }

  // Filter data
  const filteredCafes = cafes.filter(cafe => {
    if (cafeFilter === "active" && !cafe.is_active) return false;
    if (cafeFilter === "inactive" && cafe.is_active) return false;
    if (cafeSearch && !cafe.name.toLowerCase().includes(cafeSearch.toLowerCase()) &&
        !cafe.address.toLowerCase().includes(cafeSearch.toLowerCase())) return false;
    return true;
  });

  const filteredUsers = users.filter(user => {
    if (userRoleFilter !== "all" && user.role !== userRoleFilter) return false;
    if (userSearch && !user.name.toLowerCase().includes(userSearch.toLowerCase()) &&
        !(user.email || "").toLowerCase().includes(userSearch.toLowerCase())) return false;
    return true;
  });

  const filteredBookings = bookings.filter(booking => {
    if (bookingStatusFilter !== "all" && booking.status !== bookingStatusFilter) return false;
    if (bookingDateFilter && booking.booking_date !== bookingDateFilter) return false;
    if (bookingSearch && !booking.user_name?.toLowerCase().includes(bookingSearch.toLowerCase()) &&
        !booking.cafe_name?.toLowerCase().includes(bookingSearch.toLowerCase())) return false;
    return true;
  });

  // Format currency
  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isChecking || userLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.body,
          color: colors.textPrimary,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
          <p>Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
        fontFamily: fonts.body,
        color: colors.textPrimary,
        paddingBottom: 60,
      }}
    >
      {/* Header */}
      <header
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${colors.border}`,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                boxShadow: "0 8px 16px rgba(102, 126, 234, 0.3)",
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
                  fontSize: 22,
                  margin: 0,
                  background: "linear-gradient(135deg, #fff, #667eea)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 700,
                }}
              >
                Platform Control Center
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => router.push("/dashboard")}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: "rgba(15, 23, 42, 0.6)",
                color: colors.textSecondary,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.9)";
                e.currentTarget.style.borderColor = colors.cyan;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(15, 23, 42, 0.6)";
                e.currentTarget.style.borderColor = colors.border;
              }}
            >
              👤 User Dashboard
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #667eea, #764ba2)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(102, 126, 234, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        {/* Navigation Tabs */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 32,
            padding: 8,
            background: "rgba(15, 23, 42, 0.8)",
            borderRadius: 16,
            border: `1px solid ${colors.border}`,
            overflowX: "auto",
          }}
        >
          {[
            { id: "overview" as const, label: "Overview", icon: "📊" },
            { id: "cafes" as const, label: "Cafés", icon: "🏪" },
            { id: "users" as const, label: "Users", icon: "👥" },
            { id: "bookings" as const, label: "Bookings", icon: "📅" },
            { id: "revenue" as const, label: "Revenue", icon: "💰" },
            { id: "reports" as const, label: "Reports", icon: "📈" },
            { id: "settings" as const, label: "Settings", icon: "⚙️" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                minWidth: 120,
                padding: "14px 20px",
                borderRadius: 12,
                border: "none",
                background:
                  activeTab === tab.id
                    ? "linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3))"
                    : "transparent",
                color: activeTab === tab.id ? colors.textPrimary : colors.textSecondary,
                fontSize: 14,
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = "rgba(148, 163, 184, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              marginBottom: 24,
              padding: "16px 20px",
              borderRadius: 12,
              border: "1px solid rgba(248, 113, 113, 0.5)",
              background: "rgba(248, 113, 113, 0.1)",
              color: "#fca5a5",
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>⚠️</span>
            {error}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: 20,
                marginBottom: 32,
              }}
            >
              {[
                {
                  label: "Total Cafés",
                  value: stats?.totalCafes || 0,
                  subtext: `${stats?.activeCafes || 0} active, ${stats?.pendingCafes || 0} pending`,
                  icon: "🏪",
                  gradient: "linear-gradient(135deg, #667eea, #764ba2)",
                },
                {
                  label: "Total Users",
                  value: stats?.totalUsers || 0,
                  subtext: `${stats?.totalOwners || 0} café owners`,
                  icon: "👥",
                  gradient: "linear-gradient(135deg, #f093fb, #f5576c)",
                },
                {
                  label: "Total Bookings",
                  value: stats?.totalBookings || 0,
                  subtext: `${stats?.todayBookings || 0} today`,
                  icon: "📅",
                  gradient: "linear-gradient(135deg, #4facfe, #00f2fe)",
                },
                {
                  label: "Total Revenue",
                  value: formatCurrency(stats?.totalRevenue || 0),
                  subtext: `${formatCurrency(stats?.todayRevenue || 0)} today`,
                  icon: "💰",
                  gradient: "linear-gradient(135deg, #43e97b, #38f9d7)",
                },
              ].map((card, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: "24px",
                    borderRadius: 16,
                    background: "rgba(15, 23, 42, 0.6)",
                    border: `1px solid ${colors.border}`,
                    position: "relative",
                    overflow: "hidden",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 12px 28px rgba(0, 0, 0, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 100,
                      height: 100,
                      background: card.gradient,
                      opacity: 0.1,
                      borderRadius: "0 0 0 100%",
                    }}
                  />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <p
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          color: colors.textMuted,
                          margin: 0,
                        }}
                      >
                        {card.label}
                      </p>
                      <span style={{ fontSize: 28, opacity: 0.7 }}>{card.icon}</span>
                    </div>
                    <p
                      style={{
                        fontFamily: fonts.heading,
                        fontSize: 36,
                        fontWeight: 700,
                        margin: "8px 0",
                        color: colors.textPrimary,
                      }}
                    >
                      {loadingData ? "..." : card.value}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: colors.textSecondary,
                        margin: 0,
                      }}
                    >
                      {card.subtext}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Insights */}
            <div
              style={{
                padding: "24px",
                borderRadius: 16,
                background: "rgba(15, 23, 42, 0.6)",
                border: `1px solid ${colors.border}`,
                marginBottom: 32,
              }}
            >
              <h2
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 20,
                  marginBottom: 20,
                  color: colors.textPrimary,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span>📈</span> Platform Insights
              </h2>
              <div style={{ display: "grid", gap: 16, fontSize: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(102, 126, 234, 0.1)", borderRadius: 10 }}>
                  <span style={{ color: "#667eea", fontSize: 18 }}>✓</span>
                  <span style={{ color: colors.textSecondary }}>
                    Average of{" "}
                    <strong style={{ color: colors.textPrimary }}>
                      {stats?.totalCafes && stats?.totalBookings
                        ? Math.round(stats.totalBookings / stats.totalCafes)
                        : 0}
                    </strong>{" "}
                    bookings per café
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(67, 233, 123, 0.1)", borderRadius: 10 }}>
                  <span style={{ color: "#43e97b", fontSize: 18 }}>✓</span>
                  <span style={{ color: colors.textSecondary }}>
                    Average revenue per booking:{" "}
                    <strong style={{ color: colors.textPrimary }}>
                      {formatCurrency(
                        stats?.totalBookings && stats?.totalRevenue
                          ? Math.round(stats.totalRevenue / stats.totalBookings)
                          : 0
                      )}
                    </strong>
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(79, 172, 254, 0.1)", borderRadius: 10 }}>
                  <span style={{ color: "#4facfe", fontSize: 18 }}>✓</span>
                  <span style={{ color: colors.textSecondary }}>
                    Week revenue: <strong style={{ color: colors.textPrimary }}>{formatCurrency(stats?.weekRevenue || 0)}</strong>{" "}
                    | Month: <strong style={{ color: colors.textPrimary }}>{formatCurrency(stats?.monthRevenue || 0)}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CAFES TAB */}
        {activeTab === 'cafes' && (
          <div>
            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 24,
                flexWrap: "wrap",
                padding: "20px",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <input
                type="text"
                placeholder="Search cafés..."
                value={cafeSearch}
                onChange={(e) => setCafeSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(15, 23, 42, 0.8)",
                  color: colors.textPrimary,
                  fontSize: 14,
                }}
              />
              <select
                value={cafeFilter}
                onChange={(e) => setCafeFilter(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(15, 23, 42, 0.8)",
                  color: colors.textPrimary,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <option value="all">All Cafés</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            {/* Cafes Table */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(102, 126, 234, 0.1)", borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Café Name</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Owner</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Location</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Consoles</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Bookings</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Revenue</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Status</th>
                      <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingData ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}>
                          Loading cafés...
                        </td>
                      </tr>
                    ) : filteredCafes.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}>
                          No cafés found
                        </td>
                      </tr>
                    ) : (
                      filteredCafes.map((cafe) => (
                        <tr
                          key={cafe.id}
                          style={{
                            borderBottom: `1px solid ${colors.border}`,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(102, 126, 234, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td style={{ padding: "16px", fontSize: 14, color: colors.textPrimary, fontWeight: 500 }}>
                            {cafe.name}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            <div>{cafe.owner_name}</div>
                            <div style={{ fontSize: 11, color: colors.textMuted }}>{cafe.owner_email}</div>
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary, maxWidth: 200 }}>
                            {cafe.address}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            PS5: {cafe.ps5_count} | PS4: {cafe.ps4_count} | Xbox: {cafe.xbox_count} | PC: {cafe.pc_count}
                          </td>
                          <td style={{ padding: "16px", fontSize: 14, color: colors.textPrimary, fontWeight: 500 }}>
                            {cafe.total_bookings}
                          </td>
                          <td style={{ padding: "16px", fontSize: 14, color: "#43e97b", fontWeight: 600 }}>
                            {formatCurrency(cafe.total_revenue || 0)}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                background: cafe.is_active ? "rgba(67, 233, 123, 0.2)" : "rgba(248, 113, 113, 0.2)",
                                color: cafe.is_active ? "#43e97b" : "#f87171",
                              }}
                            >
                              {cafe.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                              <button
                                onClick={() => router.push(`/admin/cafes/${cafe.id}`)}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  border: "none",
                                  background: "rgba(79, 172, 254, 0.2)",
                                  color: "#4facfe",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                View
                              </button>
                              <button
                                onClick={() => toggleCafeStatus(cafe.id, cafe.is_active)}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  border: "none",
                                  background: cafe.is_active ? "rgba(248, 113, 113, 0.2)" : "rgba(67, 233, 123, 0.2)",
                                  color: cafe.is_active ? "#f87171" : "#43e97b",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                {cafe.is_active ? "Deactivate" : "Activate"}
                              </button>
                              <button
                                onClick={() => deleteCafe(cafe.id, cafe.name)}
                                style={{
                                  padding: "8px 12px",
                                  borderRadius: 8,
                                  border: "none",
                                  background: "rgba(248, 113, 113, 0.2)",
                                  color: "#f87171",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div>
            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 24,
                flexWrap: "wrap",
                padding: "20px",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(15, 23, 42, 0.8)",
                  color: colors.textPrimary,
                  fontSize: 14,
                }}
              />
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(15, 23, 42, 0.8)",
                  color: colors.textPrimary,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <option value="all">All Roles</option>
                <option value="user">Users</option>
                <option value="owner">Owners</option>
                <option value="admin">Admins</option>
              </select>
            </div>

            {/* Users Table */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(102, 126, 234, 0.1)", borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Name</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Email</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Phone</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Role</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Bookings</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Total Spent</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Joined</th>
                      <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingData ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}>
                          Loading users...
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}>
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((userRow) => (
                        <tr
                          key={userRow.id}
                          style={{
                            borderBottom: `1px solid ${colors.border}`,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(102, 126, 234, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td style={{ padding: "16px", fontSize: 14, color: colors.textPrimary, fontWeight: 500 }}>
                            {userRow.name}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            {userRow.email || "N/A"}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            {userRow.phone || "N/A"}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <select
                              value={userRow.role}
                              onChange={(e) => updateUserRole(userRow.id, e.target.value)}
                              style={{
                                padding: "6px 10px",
                                borderRadius: 8,
                                border: `1px solid ${colors.border}`,
                                background: "rgba(15, 23, 42, 0.8)",
                                color: colors.textPrimary,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              <option value="user">User</option>
                              <option value="owner">Owner</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td style={{ padding: "16px", fontSize: 14, color: colors.textPrimary }}>
                            {userRow.total_bookings}
                          </td>
                          <td style={{ padding: "16px", fontSize: 14, color: "#43e97b", fontWeight: 600 }}>
                            {formatCurrency(userRow.total_spent || 0)}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            {formatDate(userRow.created_at)}
                          </td>
                          <td style={{ padding: "16px", textAlign: "center" }}>
                            <button
                              onClick={() => deleteUser(userRow.id, userRow.name)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: "rgba(248, 113, 113, 0.2)",
                                color: "#f87171",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* BOOKINGS TAB */}
        {activeTab === 'bookings' && (
          <div>
            {/* Filters */}
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 24,
                flexWrap: "wrap",
                padding: "20px",
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
              }}
            >
              <input
                type="text"
                placeholder="Search bookings..."
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: 200,
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(15, 23, 42, 0.8)",
                  color: colors.textPrimary,
                  fontSize: 14,
                }}
              />
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(15, 23, 42, 0.8)",
                  color: colors.textPrimary,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <input
                type="date"
                value={bookingDateFilter}
                onChange={(e) => setBookingDateFilter(e.target.value)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(15, 23, 42, 0.8)",
                  color: colors.textPrimary,
                  fontSize: 14,
                }}
              />
            </div>

            {/* Bookings Table */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                borderRadius: 12,
                border: `1px solid ${colors.border}`,
                overflow: "hidden",
              }}
            >
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(102, 126, 234, 0.1)", borderBottom: `1px solid ${colors.border}` }}>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Café</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Customer</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Date</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Time</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Duration</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Amount</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Source</th>
                      <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingData ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}>
                          Loading bookings...
                        </td>
                      </tr>
                    ) : filteredBookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: colors.textMuted }}>
                          No bookings found
                        </td>
                      </tr>
                    ) : (
                      filteredBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          style={{
                            borderBottom: `1px solid ${colors.border}`,
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "rgba(102, 126, 234, 0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td style={{ padding: "16px", fontSize: 14, color: colors.textPrimary, fontWeight: 500 }}>
                            {booking.cafe_name}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            <div>{booking.user_name}</div>
                            {booking.customer_phone && (
                              <div style={{ fontSize: 11, color: colors.textMuted }}>{booking.customer_phone}</div>
                            )}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            {formatDate(booking.booking_date)}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            {booking.start_time}
                          </td>
                          <td style={{ padding: "16px", fontSize: 13, color: colors.textSecondary }}>
                            {booking.duration} min
                          </td>
                          <td style={{ padding: "16px", fontSize: 14, color: "#43e97b", fontWeight: 600 }}>
                            {formatCurrency(booking.total_amount)}
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                background: booking.source === "online" ? "rgba(79, 172, 254, 0.2)" : "rgba(245, 87, 108, 0.2)",
                                color: booking.source === "online" ? "#4facfe" : "#f5576c",
                              }}
                            >
                              {booking.source}
                            </span>
                          </td>
                          <td style={{ padding: "16px" }}>
                            <span
                              style={{
                                padding: "6px 12px",
                                borderRadius: 8,
                                fontSize: 12,
                                fontWeight: 600,
                                background:
                                  booking.status === "confirmed"
                                    ? "rgba(67, 233, 123, 0.2)"
                                    : booking.status === "pending"
                                    ? "rgba(251, 191, 36, 0.2)"
                                    : booking.status === "completed"
                                    ? "rgba(79, 172, 254, 0.2)"
                                    : "rgba(248, 113, 113, 0.2)",
                                color:
                                  booking.status === "confirmed"
                                    ? "#43e97b"
                                    : booking.status === "pending"
                                    ? "#fbbf24"
                                    : booking.status === "completed"
                                    ? "#4facfe"
                                    : "#f87171",
                              }}
                            >
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REVENUE TAB */}
        {activeTab === 'revenue' && (
          <div>
            <div
              style={{
                padding: "32px",
                borderRadius: 16,
                background: "rgba(15, 23, 42, 0.6)",
                border: `1px solid ${colors.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 24, marginBottom: 12, color: colors.textPrimary }}>
                Revenue Analytics
              </h2>
              <p style={{ fontSize: 14, color: colors.textSecondary, marginBottom: 24 }}>
                Detailed revenue tracking and analytics coming soon
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  marginTop: 32,
                }}
              >
                <div style={{ padding: "20px", background: "rgba(67, 233, 123, 0.1)", borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    Today
                  </p>
                  <p style={{ fontFamily: fonts.heading, fontSize: 28, color: "#43e97b", margin: 0 }}>
                    {formatCurrency(stats?.todayRevenue || 0)}
                  </p>
                </div>
                <div style={{ padding: "20px", background: "rgba(79, 172, 254, 0.1)", borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    This Week
                  </p>
                  <p style={{ fontFamily: fonts.heading, fontSize: 28, color: "#4facfe", margin: 0 }}>
                    {formatCurrency(stats?.weekRevenue || 0)}
                  </p>
                </div>
                <div style={{ padding: "20px", background: "rgba(102, 126, 234, 0.1)", borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    This Month
                  </p>
                  <p style={{ fontFamily: fonts.heading, fontSize: 28, color: "#667eea", margin: 0 }}>
                    {formatCurrency(stats?.monthRevenue || 0)}
                  </p>
                </div>
                <div style={{ padding: "20px", background: "rgba(245, 87, 108, 0.1)", borderRadius: 12 }}>
                  <p style={{ fontSize: 11, color: colors.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    All Time
                  </p>
                  <p style={{ fontFamily: fonts.heading, fontSize: 28, color: "#f5576c", margin: 0 }}>
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div
            style={{
              padding: "60px 32px",
              borderRadius: 16,
              background: "rgba(15, 23, 42, 0.6)",
              border: `1px solid ${colors.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>📈</div>
            <h2 style={{ fontFamily: fonts.heading, fontSize: 24, marginBottom: 12, color: colors.textPrimary }}>
              Advanced Reports
            </h2>
            <p style={{ fontSize: 14, color: colors.textSecondary }}>
              Generate detailed platform reports and analytics
            </p>
            <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
              Coming soon: Export reports, custom date ranges, performance metrics, and more
            </p>
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div
            style={{
              padding: "60px 32px",
              borderRadius: 16,
              background: "rgba(15, 23, 42, 0.6)",
              border: `1px solid ${colors.border}`,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 64, marginBottom: 16 }}>⚙️</div>
            <h2 style={{ fontFamily: fonts.heading, fontSize: 24, marginBottom: 12, color: colors.textPrimary }}>
              Platform Settings
            </h2>
            <p style={{ fontSize: 14, color: colors.textSecondary }}>
              Configure global platform settings and preferences
            </p>
            <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 8 }}>
              Coming soon: Email templates, notification settings, payment gateways, and more
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
