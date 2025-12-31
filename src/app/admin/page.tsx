// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { fonts } from "@/lib/constants";

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
  const [cafeFilter, setCafeFilter] = useState<string>("all");
  const [cafeSearch, setCafeSearch] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [bookingDateFilter, setBookingDateFilter] = useState<string>("");
  const [bookingSearch, setBookingSearch] = useState<string>("");

  // Theme (matching owner dashboard)
  const theme = {
    background: "#020617",
    cardBackground: "rgba(15,23,42,0.6)",
    sidebarBackground: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
    border: "rgba(51,65,85,0.5)",
    textPrimary: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
    headerBackground: "rgba(15,23,42,0.5)",
    statCardBackground: "#ffffff",
    statCardText: "#111827",
    hoverBackground: "rgba(51,65,85,0.3)",
    activeNavBackground: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(139, 92, 246, 0.15))",
    activeNavText: "#a855f7",
  };

  // Navigation items
  const navItems: { id: NavTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'cafes', label: 'Cafés', icon: '🏪' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

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

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekStr = weekAgo.toISOString().slice(0, 10);

        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthStr = monthAgo.toISOString().slice(0, 10);

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

        const { count: totalBookings } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true });

        const { count: todayBookings } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("booking_date", todayStr);

        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true });

        const { count: totalOwners } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("role", "owner");

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

        const enrichedCafes = await Promise.all(
          (data || []).map(async (cafe) => {
            const { data: owner } = await supabase
              .from("profiles")
              .select("name, email")
              .eq("id", cafe.owner_id)
              .maybeSingle();

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
          background: theme.background,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: fonts.body,
          color: theme.textPrimary,
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
        background: theme.background,
        display: "flex",
        fontFamily: fonts.body,
        color: theme.textPrimary,
      }}
    >
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: 320,
          background: theme.sidebarBackground,
          borderRight: `1px solid ${theme.border}`,
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
          height: "100vh",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "32px 28px",
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: theme.textPrimary,
                letterSpacing: "-0.5px",
                lineHeight: 1,
              }}
            >
              <span style={{ color: "#a855f7" }}>ADMIN</span>
              <span style={{ color: theme.textPrimary }}> PANEL</span>
            </div>
            <div
              style={{
                fontSize: 11,
                color: theme.textMuted,
                fontWeight: 500,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              Platform Control Center
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "24px 20px" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: "100%",
                padding: "16px 18px",
                marginBottom: 6,
                borderRadius: 12,
                border: "none",
                background: activeTab === item.id
                  ? theme.activeNavBackground
                  : "transparent",
                color: activeTab === item.id ? theme.activeNavText : theme.textSecondary,
                fontSize: 16,
                fontWeight: activeTab === item.id ? 600 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 16,
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = theme.hoverBackground;
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: 22, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div
          style={{
            padding: "20px 28px",
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: "transparent",
              color: theme.textSecondary,
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.hoverBackground;
              e.currentTarget.style.borderColor = theme.activeNavText;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = theme.border;
            }}
          >
            👤 User Dashboard
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <header
          style={{
            padding: "24px 32px",
            borderBottom: `1px solid ${theme.border}`,
            background: theme.headerBackground,
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h1
                style={{
                  fontFamily: fonts.heading,
                  fontSize: 28,
                  margin: 0,
                  fontWeight: 700,
                }}
              >
                {activeTab === 'overview' && 'Platform Overview'}
                {activeTab === 'cafes' && 'Café Management'}
                {activeTab === 'users' && 'User Management'}
                {activeTab === 'bookings' && 'Booking Management'}
                {activeTab === 'revenue' && 'Revenue Analytics'}
                {activeTab === 'reports' && 'Reports & Analytics'}
                {activeTab === 'settings' && 'Platform Settings'}
              </h1>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: "linear-gradient(135deg, #a855f7, #9333ea)",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 20px rgba(168, 85, 247, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: "32px" }}>
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
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: 20,
                  marginBottom: 32,
                }}
              >
                {[
                  {
                    label: "Total Cafés",
                    value: stats?.totalCafes || 0,
                    subtext: `${stats?.activeCafes || 0} active • ${stats?.pendingCafes || 0} pending`,
                    icon: "🏪",
                    color: "#3b82f6",
                  },
                  {
                    label: "Total Users",
                    value: stats?.totalUsers || 0,
                    subtext: `${stats?.totalOwners || 0} café owners`,
                    icon: "👥",
                    color: "#8b5cf6",
                  },
                  {
                    label: "Total Bookings",
                    value: stats?.totalBookings || 0,
                    subtext: `${stats?.todayBookings || 0} bookings today`,
                    icon: "📅",
                    color: "#06b6d4",
                  },
                  {
                    label: "Total Revenue",
                    value: formatCurrency(stats?.totalRevenue || 0),
                    subtext: `${formatCurrency(stats?.todayRevenue || 0)} today`,
                    icon: "💰",
                    color: "#10b981",
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "24px",
                      borderRadius: 16,
                      background: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = card.color;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = theme.border;
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <p
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: 1.5,
                          color: theme.textMuted,
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
                        color: theme.textPrimary,
                      }}
                    >
                      {loadingData ? "..." : card.value}
                    </p>
                    <p
                      style={{
                        fontSize: 13,
                        color: theme.textSecondary,
                        margin: 0,
                      }}
                    >
                      {card.subtext}
                    </p>
                  </div>
                ))}
              </div>

              {/* Platform Insights */}
              <div
                style={{
                  padding: "24px",
                  borderRadius: 16,
                  background: theme.cardBackground,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <h2
                  style={{
                    fontFamily: fonts.heading,
                    fontSize: 20,
                    marginBottom: 20,
                    color: theme.textPrimary,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span>📈</span> Platform Insights
                </h2>
                <div style={{ display: "grid", gap: 16, fontSize: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(59, 130, 246, 0.1)", borderRadius: 10, border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                    <span style={{ color: "#3b82f6", fontSize: 18 }}>✓</span>
                    <span style={{ color: theme.textSecondary }}>
                      Average of{" "}
                      <strong style={{ color: theme.textPrimary }}>
                        {stats?.totalCafes && stats?.totalBookings
                          ? Math.round(stats.totalBookings / stats.totalCafes)
                          : 0}
                      </strong>{" "}
                      bookings per café
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(16, 185, 129, 0.1)", borderRadius: 10, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <span style={{ color: "#10b981", fontSize: 18 }}>✓</span>
                    <span style={{ color: theme.textSecondary }}>
                      Average revenue per booking:{" "}
                      <strong style={{ color: theme.textPrimary }}>
                        {formatCurrency(
                          stats?.totalBookings && stats?.totalRevenue
                            ? Math.round(stats.totalRevenue / stats.totalBookings)
                            : 0
                        )}
                      </strong>
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "rgba(139, 92, 246, 0.1)", borderRadius: 10, border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                    <span style={{ color: "#8b5cf6", fontSize: 18 }}>✓</span>
                    <span style={{ color: theme.textSecondary }}>
                      Week revenue: <strong style={{ color: theme.textPrimary }}>{formatCurrency(stats?.weekRevenue || 0)}</strong>{" "}
                      • Month: <strong style={{ color: theme.textPrimary }}>{formatCurrency(stats?.monthRevenue || 0)}</strong>
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
                  background: theme.cardBackground,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
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
                    border: `1px solid ${theme.border}`,
                    background: "rgba(15, 23, 42, 0.8)",
                    color: theme.textPrimary,
                    fontSize: 14,
                  }}
                />
                <select
                  value={cafeFilter}
                  onChange={(e) => setCafeFilter(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    background: "rgba(15, 23, 42, 0.8)",
                    color: theme.textPrimary,
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
                  background: theme.cardBackground,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(168, 85, 247, 0.1)", borderBottom: `1px solid ${theme.border}` }}>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Café Name</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Owner</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Location</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Consoles</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Bookings</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Revenue</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Status</th>
                        <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            Loading cafés...
                          </td>
                        </tr>
                      ) : filteredCafes.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No cafés found
                          </td>
                        </tr>
                      ) : (
                        filteredCafes.map((cafe) => (
                          <tr
                            key={cafe.id}
                            style={{
                              borderBottom: `1px solid ${theme.border}`,
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(168, 85, 247, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td style={{ padding: "16px", fontSize: 14, color: theme.textPrimary, fontWeight: 500 }}>
                              {cafe.name}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              <div>{cafe.owner_name}</div>
                              <div style={{ fontSize: 11, color: theme.textMuted }}>{cafe.owner_email}</div>
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary, maxWidth: 200 }}>
                              {cafe.address}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              PS5: {cafe.ps5_count} | PS4: {cafe.ps4_count} | Xbox: {cafe.xbox_count} | PC: {cafe.pc_count}
                            </td>
                            <td style={{ padding: "16px", fontSize: 14, color: theme.textPrimary, fontWeight: 500 }}>
                              {cafe.total_bookings}
                            </td>
                            <td style={{ padding: "16px", fontSize: 14, color: "#10b981", fontWeight: 600 }}>
                              {formatCurrency(cafe.total_revenue || 0)}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: cafe.is_active ? "rgba(16, 185, 129, 0.2)" : "rgba(248, 113, 113, 0.2)",
                                  color: cafe.is_active ? "#10b981" : "#f87171",
                                }}
                              >
                                {cafe.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td style={{ padding: "16px", textAlign: "center" }}>
                              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                                <button
                                  onClick={() => router.push(`/cafes/${cafe.slug}`)}
                                  style={{
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    border: "none",
                                    background: "rgba(59, 130, 246, 0.2)",
                                    color: "#3b82f6",
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
                                    background: cafe.is_active ? "rgba(248, 113, 113, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                    color: cafe.is_active ? "#f87171" : "#10b981",
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
                  background: theme.cardBackground,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
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
                    border: `1px solid ${theme.border}`,
                    background: "rgba(15, 23, 42, 0.8)",
                    color: theme.textPrimary,
                    fontSize: 14,
                  }}
                />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    background: "rgba(15, 23, 42, 0.8)",
                    color: theme.textPrimary,
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
                  background: theme.cardBackground,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(168, 85, 247, 0.1)", borderBottom: `1px solid ${theme.border}` }}>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Name</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Email</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Phone</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Role</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Bookings</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Total Spent</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Joined</th>
                        <th style={{ padding: "16px", textAlign: "center", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No users found
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((userRow) => (
                          <tr
                            key={userRow.id}
                            style={{
                              borderBottom: `1px solid ${theme.border}`,
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(168, 85, 247, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td style={{ padding: "16px", fontSize: 14, color: theme.textPrimary, fontWeight: 500 }}>
                              {userRow.name}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              {userRow.email || "N/A"}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              {userRow.phone || "N/A"}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <select
                                value={userRow.role}
                                onChange={(e) => updateUserRole(userRow.id, e.target.value)}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 8,
                                  border: `1px solid ${theme.border}`,
                                  background: "rgba(15, 23, 42, 0.8)",
                                  color: theme.textPrimary,
                                  fontSize: 12,
                                  cursor: "pointer",
                                }}
                              >
                                <option value="user">User</option>
                                <option value="owner">Owner</option>
                                <option value="admin">Admin</option>
                              </select>
                            </td>
                            <td style={{ padding: "16px", fontSize: 14, color: theme.textPrimary }}>
                              {userRow.total_bookings}
                            </td>
                            <td style={{ padding: "16px", fontSize: 14, color: "#10b981", fontWeight: 600 }}>
                              {formatCurrency(userRow.total_spent || 0)}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
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
                  background: theme.cardBackground,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
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
                    border: `1px solid ${theme.border}`,
                    background: "rgba(15, 23, 42, 0.8)",
                    color: theme.textPrimary,
                    fontSize: 14,
                  }}
                />
                <select
                  value={bookingStatusFilter}
                  onChange={(e) => setBookingStatusFilter(e.target.value)}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    background: "rgba(15, 23, 42, 0.8)",
                    color: theme.textPrimary,
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
                    border: `1px solid ${theme.border}`,
                    background: "rgba(15, 23, 42, 0.8)",
                    color: theme.textPrimary,
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Bookings Table */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                }}
              >
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(168, 85, 247, 0.1)", borderBottom: `1px solid ${theme.border}` }}>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Café</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Customer</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Date</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Time</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Duration</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Amount</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Source</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            Loading bookings...
                          </td>
                        </tr>
                      ) : filteredBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        filteredBookings.map((booking) => (
                          <tr
                            key={booking.id}
                            style={{
                              borderBottom: `1px solid ${theme.border}`,
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(168, 85, 247, 0.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <td style={{ padding: "16px", fontSize: 14, color: theme.textPrimary, fontWeight: 500 }}>
                              {booking.cafe_name}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              <div>{booking.user_name}</div>
                              {booking.customer_phone && (
                                <div style={{ fontSize: 11, color: theme.textMuted }}>{booking.customer_phone}</div>
                              )}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              {formatDate(booking.booking_date)}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              {booking.start_time}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              {booking.duration} min
                            </td>
                            <td style={{ padding: "16px", fontSize: 14, color: "#10b981", fontWeight: 600 }}>
                              {formatCurrency(booking.total_amount)}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: booking.source === "online" ? "rgba(59, 130, 246, 0.2)" : "rgba(245, 87, 108, 0.2)",
                                  color: booking.source === "online" ? "#3b82f6" : "#f5576c",
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
                                      ? "rgba(16, 185, 129, 0.2)"
                                      : booking.status === "pending"
                                      ? "rgba(251, 191, 36, 0.2)"
                                      : booking.status === "completed"
                                      ? "rgba(59, 130, 246, 0.2)"
                                      : "rgba(248, 113, 113, 0.2)",
                                  color:
                                    booking.status === "confirmed"
                                      ? "#10b981"
                                      : booking.status === "pending"
                                      ? "#fbbf24"
                                      : booking.status === "completed"
                                      ? "#3b82f6"
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
                  padding: "40px",
                  borderRadius: 16,
                  background: theme.cardBackground,
                  border: `1px solid ${theme.border}`,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 64, marginBottom: 16 }}>💰</div>
                <h2 style={{ fontFamily: fonts.heading, fontSize: 24, marginBottom: 12, color: theme.textPrimary }}>
                  Revenue Analytics
                </h2>
                <p style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 32 }}>
                  Platform-wide revenue tracking and insights
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                    marginTop: 32,
                  }}
                >
                  <div style={{ padding: "20px", background: "rgba(16, 185, 129, 0.1)", borderRadius: 12, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                    <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                      Today
                    </p>
                    <p style={{ fontFamily: fonts.heading, fontSize: 28, color: "#10b981", margin: 0 }}>
                      {formatCurrency(stats?.todayRevenue || 0)}
                    </p>
                  </div>
                  <div style={{ padding: "20px", background: "rgba(59, 130, 246, 0.1)", borderRadius: 12, border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                    <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                      This Week
                    </p>
                    <p style={{ fontFamily: fonts.heading, fontSize: 28, color: "#3b82f6", margin: 0 }}>
                      {formatCurrency(stats?.weekRevenue || 0)}
                    </p>
                  </div>
                  <div style={{ padding: "20px", background: "rgba(139, 92, 246, 0.1)", borderRadius: 12, border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                    <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                      This Month
                    </p>
                    <p style={{ fontFamily: fonts.heading, fontSize: 28, color: "#8b5cf6", margin: 0 }}>
                      {formatCurrency(stats?.monthRevenue || 0)}
                    </p>
                  </div>
                  <div style={{ padding: "20px", background: "rgba(168, 85, 247, 0.1)", borderRadius: 12, border: "1px solid rgba(168, 85, 247, 0.2)" }}>
                    <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                      All Time
                    </p>
                    <p style={{ fontFamily: fonts.heading, fontSize: 28, color: "#a855f7", margin: 0 }}>
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
                padding: "60px 40px",
                borderRadius: 16,
                background: theme.cardBackground,
                border: `1px solid ${theme.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>📈</div>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 24, marginBottom: 12, color: theme.textPrimary }}>
                Advanced Reports
              </h2>
              <p style={{ fontSize: 14, color: theme.textSecondary }}>
                Generate detailed platform reports and analytics
              </p>
              <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>
                Coming soon: Export reports, custom date ranges, performance metrics, and more
              </p>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div
              style={{
                padding: "60px 40px",
                borderRadius: 16,
                background: theme.cardBackground,
                border: `1px solid ${theme.border}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16 }}>⚙️</div>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 24, marginBottom: 12, color: theme.textPrimary }}>
                Platform Settings
              </h2>
              <p style={{ fontSize: 14, color: theme.textSecondary }}>
                Configure global platform settings and preferences
              </p>
              <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 8 }}>
                Coming soon: Email templates, notification settings, payment gateways, and more
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
