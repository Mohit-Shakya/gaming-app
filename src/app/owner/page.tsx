// src/app/owner/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { colors, fonts } from "@/lib/constants";
import { getEndTime } from "@/lib/timeUtils";

type OwnerStats = {
  cafesCount: number;
  bookingsToday: number;
  recentBookings: number;
  recentRevenue: number;
  totalBookings: number;
  pendingBookings: number;
};

type CafeRow = {
  id: string;
  name: string | null;
  city?: string | null;
  address?: string | null;
  description?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  opening_hours?: string | null;
  status?: string | null;
  hourly_price?: number | null;
  ps5_count?: number | null;
  ps4_count?: number | null;
  xbox_count?: number | null;
  pc_count?: number | null;
  pool_count?: number | null;
  snooker_count?: number | null;
  arcade_count?: number | null;
  vr_count?: number | null;
  steering_wheel_count?: number | null;
};

type BookingRow = {
  id: string;
  cafe_id: string | null;
  user_id: string | null;
  booking_date: string | null;
  start_time: string | null;
  duration?: number | null;
  total_amount: number | null;
  status: string | null;
  source: string | null;
  created_at: string | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  booking_items?: Array<{
    console: string | null;
    quantity: number | null;
  }>;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  cafe_name?: string | null;
};

type NavTab = 'overview' | 'bookings' | 'live-billing' | 'cafe-details' | 'analytics';

// Helper functions for time conversion
function convertTo24Hour(time12h: string): string {
  const match = time12h.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) return "";

  let hours = parseInt(match[1]);
  const minutes = match[2];
  const period = match[3].toLowerCase();

  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

function convertTo12Hour(time24h: string): string {
  const [hoursStr, minutes] = time24h.split(":");
  let hours = parseInt(hoursStr);

  const period = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
}

export default function OwnerDashboardPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  const [checkingRole, setCheckingRole] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>('overview');

  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("all"); // today, week, month, quarter, custom, all
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Edit modal state
  const [editingBooking, setEditingBooking] = useState<BookingRow | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editStartTime, setEditStartTime] = useState<string>("");
  const [editDuration, setEditDuration] = useState<number>(60);
  const [saving, setSaving] = useState(false);

  // Check role
  useEffect(() => {
    async function checkRole() {
      if (userLoading) return;

      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        const role = profile?.role?.toLowerCase();
        if (role === "owner" || role === "admin" || role === "super_admin") {
          setAllowed(true);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Error checking role:", err);
        router.push("/dashboard");
      } finally {
        setCheckingRole(false);
      }
    }

    checkRole();
  }, [user, userLoading, router]);

  // Load data
  useEffect(() => {
    if (!allowed || !user) return;

    async function loadData() {
      try {
        setLoadingData(true);
        setError(null);

        if (!user) return;
        const ownerId = user.id;
        const todayStr = new Date().toISOString().slice(0, 10);

        // Fetch cafes with all console counts
        const { data: cafeRows, error: cafesError } = await supabase
          .from("cafes")
          .select(`
            id,
            name,
            address,
            description,
            hourly_price,
            ps5_count,
            ps4_count,
            xbox_count,
            pc_count,
            pool_count,
            snooker_count,
            arcade_count,
            vr_count,
            steering_wheel_count
          `)
          .eq("owner_id", ownerId)
          .order("created_at", { ascending: false});

        if (cafesError) throw cafesError;

        const ownerCafes = (cafeRows as CafeRow[]) ?? [];
        setCafes(ownerCafes);

        if (!ownerCafes.length) {
          setBookings([]);
          setStats({
            cafesCount: 0,
            bookingsToday: 0,
            recentBookings: 0,
            recentRevenue: 0,
            totalBookings: 0,
            pendingBookings: 0,
          });
          return;
        }

        const cafeIds = ownerCafes.map((c) => c.id);

        // Fetch bookings with booking items
        const { data: bookingRows, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            id,
            cafe_id,
            user_id,
            booking_date,
            start_time,
            total_amount,
            status,
            source,
            created_at,
            customer_name,
            customer_phone,
            booking_items (
              console,
              quantity
            )
          `)
          .in("cafe_id", cafeIds)
          .order("created_at", { ascending: false })
          .limit(100);

        if (bookingsError) throw bookingsError;

        const ownerBookings = (bookingRows as BookingRow[]) ?? [];

        // Get all unique user IDs
        const userIds = [...new Set(ownerBookings.map(b => b.user_id).filter(Boolean))];

        // Fetch all user profiles at once
        const userProfiles = new Map();
        if (userIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, phone")
              .in("id", userIds);

            if (profiles && profiles.length > 0) {
              profiles.forEach((profile: any) => {
                const fullName = [profile.first_name, profile.last_name]
                  .filter(Boolean)
                  .join(" ") || null;

                userProfiles.set(profile.id, {
                  name: fullName,
                  email: null,
                  phone: profile.phone || null,
                });
              });
            }
          } catch (err) {
            console.error("[Owner Dashboard] Error fetching profiles:", err);
          }
        }

        // Enrich bookings with user and cafe data
        const enrichedBookings = ownerBookings.map((booking: any) => {
          const cafe = ownerCafes.find((c) => c.id === booking.cafe_id);
          const cafe_name = cafe?.name || null;

          // Get user data from profiles map
          const userProfile = booking.user_id ? userProfiles.get(booking.user_id) : null;

          // If no profile found, show user ID as fallback
          const user_name = userProfile?.name || (booking.user_id ? `User ${booking.user_id.slice(0, 8)}` : null);
          const user_email = userProfile?.email || null;
          const user_phone = userProfile?.phone || null;

          return {
            ...booking,
            user_name,
            user_email,
            user_phone,
            cafe_name,
          };
        });

        setBookings(enrichedBookings);

        // Calculate stats
        const bookingsToday = enrichedBookings.filter(
          (b) => b.booking_date === todayStr
        ).length;

        const pendingBookings = enrichedBookings.filter(
          (b) => b.status?.toLowerCase() === "pending"
        ).length;

        const recentRevenue = enrichedBookings
          .slice(0, 20)
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        setStats({
          cafesCount: ownerCafes.length,
          bookingsToday,
          recentBookings: Math.min(enrichedBookings.length, 20),
          recentRevenue,
          totalBookings: enrichedBookings.length,
          pendingBookings,
        });
      } catch (err: any) {
        console.error("[OwnerDashboard] loadData error:", err);
        setError(err.message || "Could not load café owner dashboard.");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, [allowed, user]);

  // Handle edit booking
  function handleEditBooking(booking: BookingRow) {
    if (booking.source?.toLowerCase() !== "walk_in") {
      alert("Only walk-in bookings can be edited");
      return;
    }
    setEditingBooking(booking);
    setEditAmount(booking.total_amount?.toString() || "");
    setEditStatus(booking.status || "confirmed");
    setEditDate(booking.booking_date || "");
    setEditDuration(booking.duration || 60);
    // Convert 12-hour format (from DB) to 24-hour format (for input)
    setEditStartTime(booking.start_time ? convertTo24Hour(booking.start_time) : "");
  }

  // Handle save booking
  async function handleSaveBooking() {
    if (!editingBooking) return;

    try {
      setSaving(true);
      // Convert 24-hour format (from input) back to 12-hour format (for DB)
      const startTime12h = editStartTime ? convertTo12Hour(editStartTime) : editingBooking.start_time;

      const { error } = await supabase
        .from("bookings")
        .update({
          total_amount: parseFloat(editAmount),
          status: editStatus,
          booking_date: editDate,
          start_time: startTime12h,
          duration: editDuration,
        })
        .eq("id", editingBooking.id);

      if (error) throw error;

      setBookings((prev) =>
        prev.map((b) =>
          b.id === editingBooking.id
            ? {
                ...b,
                total_amount: parseFloat(editAmount),
                status: editStatus,
                booking_date: editDate,
                start_time: startTime12h,
                duration: editDuration,
              }
            : b
        )
      );

      setEditingBooking(null);
      alert("Booking updated successfully!");
    } catch (err: any) {
      console.error("Error updating booking:", err);
      alert("Failed to update booking: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  // Auto-calculate amount when duration changes in edit modal
  useEffect(() => {
    if (!editingBooking || !editDuration) return;

    // Get console type and controllers from booking items
    const bookingItems = editingBooking.booking_items;
    if (!bookingItems || bookingItems.length === 0) return;

    const consoleType = bookingItems[0].console;
    const controllers = bookingItems[0].quantity || 1;

    if (!consoleType) return;

    // Calculate price based on duration
    // For 30 min and 60 min: use pricing from console_pricing table
    // For other durations: calculate by adding blocks

    const calculatePrice = () => {
      // This is a simplified calculation - in production you'd fetch from console_pricing
      // For now, use a simple hourly rate calculation
      const baseHourlyRate = cafes.length > 0 && cafes[0].hourly_price ? cafes[0].hourly_price : 100;

      if (editDuration === 30) {
        return Math.round((baseHourlyRate * 0.7) * controllers); // 30 min ≈ 70% of hourly
      } else if (editDuration === 60) {
        return Math.round(baseHourlyRate * controllers);
      } else if (editDuration === 90) {
        return Math.round((baseHourlyRate * 0.7 + baseHourlyRate) * controllers); // 30min + 60min
      } else if (editDuration === 120) {
        return Math.round((baseHourlyRate * 2) * controllers);
      } else if (editDuration === 150) {
        return Math.round((baseHourlyRate * 0.7 + baseHourlyRate * 2) * controllers); // 30min + 2hr
      } else if (editDuration === 180) {
        return Math.round((baseHourlyRate * 3) * controllers);
      } else {
        // For other durations, calculate proportionally
        const hours = editDuration / 60;
        return Math.round(baseHourlyRate * hours * controllers);
      }
    };

    const newAmount = calculatePrice();
    setEditAmount(newAmount.toString());
  }, [editDuration, editingBooking, cafes]);

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter !== "all" && booking.status?.toLowerCase() !== statusFilter) {
      return false;
    }

    // Source filter
    if (sourceFilter !== "all") {
      const bookingSource = booking.source?.toLowerCase() === "walk_in" ? "walk_in" : "online";
      if (bookingSource !== sourceFilter) return false;
    }

    // Date Range filter
    if (dateRangeFilter !== "all" && booking.booking_date) {
      const bookingDate = new Date(booking.booking_date + 'T00:00:00');
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      if (dateRangeFilter === "today") {
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        if (bookingDate < todayStart || bookingDate > todayEnd) return false;
      } else if (dateRangeFilter === "week") {
        const weekAgo = new Date(todayStart);
        weekAgo.setDate(todayStart.getDate() - 7);
        if (bookingDate < weekAgo || bookingDate > todayStart) return false;
      } else if (dateRangeFilter === "month") {
        const monthAgo = new Date(todayStart);
        monthAgo.setMonth(todayStart.getMonth() - 1);
        if (bookingDate < monthAgo || bookingDate > todayStart) return false;
      } else if (dateRangeFilter === "quarter") {
        const quarterAgo = new Date(todayStart);
        quarterAgo.setMonth(todayStart.getMonth() - 3);
        if (bookingDate < quarterAgo || bookingDate > todayStart) return false;
      } else if (dateRangeFilter === "custom") {
        if (customStartDate) {
          const startDate = new Date(customStartDate + 'T00:00:00');
          if (bookingDate < startDate) return false;
        }
        if (customEndDate) {
          const endDate = new Date(customEndDate + 'T23:59:59');
          if (bookingDate > endDate) return false;
        }
      }
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = booking.id.toLowerCase().includes(query);
      const matchesName = (booking.customer_name || booking.user_name || "").toLowerCase().includes(query);
      const matchesEmail = (booking.user_email || "").toLowerCase().includes(query);
      const matchesPhone = (booking.customer_phone || booking.user_phone || "").toLowerCase().includes(query);
      if (!matchesId && !matchesName && !matchesEmail && !matchesPhone) {
        return false;
      }
    }

    return true;
  });

  // Loading state
  if (checkingRole || userLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: colors.dark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: colors.textPrimary,
        }}
      >
        Loading...
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  // Navigation items
  const navItems: { id: NavTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'live-billing', label: 'Live Billing', icon: '💳' },
    { id: 'cafe-details', label: 'Café Details', icon: '🏪' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        fontFamily: fonts.body,
        color: colors.textPrimary,
      }}
    >
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: 260,
          background: "linear-gradient(180deg, #0f172a 0%, #020617 100%)",
          borderRight: `1px solid ${colors.border}`,
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
            padding: "24px 20px",
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              🏪
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Owner Portal
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: colors.textMuted,
                }}
              >
                Gaming Café
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "16px 12px" }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: "100%",
                padding: "12px 16px",
                marginBottom: 8,
                borderRadius: 10,
                border: "none",
                background: activeTab === item.id
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15))"
                  : "transparent",
                color: activeTab === item.id ? "#3b82f6" : colors.textSecondary,
                fontSize: 14,
                fontWeight: activeTab === item.id ? 600 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 12,
                transition: "all 0.2s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = "rgba(51,65,85,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div
          style={{
            padding: "16px",
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid ${colors.border}`,
              background: "rgba(51,65,85,0.3)",
              color: colors.textSecondary,
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              justifyContent: "center",
            }}
          >
            <span>🕹</span>
            Player View
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: "auto" }}>
        {/* Header */}
        <header
          style={{
            padding: "24px 32px",
            borderBottom: `1px solid ${colors.border}`,
            background: "rgba(15,23,42,0.5)",
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
                  fontSize: 24,
                  margin: 0,
                  marginBottom: 4,
                }}
              >
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'bookings' && 'Manage Bookings'}
                {activeTab === 'live-billing' && 'Live Billing & Availability'}
                {activeTab === 'cafe-details' && 'Café Details'}
                {activeTab === 'analytics' && 'Analytics & Reports'}
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: colors.textMuted,
                  margin: 0,
                }}
              >
                {activeTab === 'overview' && 'Track your café performance and bookings'}
                {activeTab === 'bookings' && 'View and manage all customer bookings'}
                {activeTab === 'live-billing' && 'Real-time console availability and manual billing for walk-ins'}
                {activeTab === 'cafe-details' && 'Manage your gaming café information and pricing'}
                {activeTab === 'analytics' && 'Detailed insights and statistics'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: `1px solid ${colors.border}`,
                background: "rgba(15,23,42,0.7)",
                color: colors.textSecondary,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>🔄</span>
              Refresh
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: "32px" }}>
          {error && (
            <div
              style={{
                padding: "16px 20px",
                borderRadius: 12,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                marginBottom: 24,
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Overview Tab */}
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
                <div
                  onClick={() => cafes.length > 0 && setActiveTab('cafe-details')}
                  style={{
                    padding: "24px",
                    borderRadius: 16,
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.1))",
                    border: "1px solid #818cf840",
                    position: "relative",
                    overflow: "hidden",
                    cursor: cafes.length > 0 ? "pointer" : "default",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (cafes.length > 0) {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.1 }}>
                    🏪
                  </div>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <p
                      style={{
                        fontSize: 11,
                        color: "#818cf8E6",
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: 1.5,
                        fontWeight: 600,
                      }}
                    >
                      My Café
                    </p>
                    <p
                      style={{
                        fontFamily: fonts.heading,
                        fontSize: cafes.length > 0 ? 20 : 36,
                        margin: "8px 0",
                        color: "#818cf8",
                        lineHeight: 1.2,
                      }}
                    >
                      {loadingData ? "..." : cafes.length > 0 ? cafes[0].name || "Your Café" : "0"}
                    </p>
                    <p style={{ fontSize: 13, color: "#818cf8B3", marginTop: 8 }}>
                      {cafes.length > 0 ? "Click to manage" : "No café assigned"}
                    </p>
                  </div>
                </div>
                <StatCard
                  title="Today's Bookings"
                  value={loadingData ? "..." : stats?.bookingsToday ?? 0}
                  subtitle="Sessions today"
                  icon="📅"
                  gradient="linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.1))"
                  color="#fb923c"
                />
                <StatCard
                  title="Total Bookings"
                  value={loadingData ? "..." : stats?.totalBookings ?? 0}
                  subtitle="All time"
                  icon="📊"
                  gradient="linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(147, 51, 234, 0.1))"
                  color="#a855f7"
                />
                <StatCard
                  title="Pending"
                  value={loadingData ? "..." : stats?.pendingBookings ?? 0}
                  subtitle="Awaiting confirmation"
                  icon="⏳"
                  gradient="linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))"
                  color="#f59e0b"
                />
                <StatCard
                  title="Recent Revenue"
                  value={loadingData ? "..." : `₹${stats?.recentRevenue ?? 0}`}
                  subtitle="Last 20 bookings"
                  icon="💰"
                  gradient="linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.1))"
                  color="#22c55e"
                />
              </div>

              {/* Recent Activity */}
              <div
                style={{
                  background: "rgba(15,23,42,0.6)",
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  padding: "24px",
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    marginBottom: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span>📈</span>
                  Recent Bookings
                </h2>
                {bookings.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px",
                      color: colors.textMuted,
                    }}
                  >
                    No bookings yet
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                          <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Customer</th>
                          <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Café</th>
                          <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Date</th>
                          <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Status</th>
                          <th style={{ padding: "12px", textAlign: "right", color: colors.textMuted, fontWeight: 600 }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.slice(0, 5).map((booking) => (
                          <tr
                            key={booking.id}
                            style={{
                              borderBottom: `1px solid rgba(71, 85, 105, 0.2)`,
                            }}
                          >
                            <td style={{ padding: "12px" }}>{booking.customer_name || booking.user_name || "Guest"}</td>
                            <td style={{ padding: "12px", color: colors.textSecondary }}>{booking.cafe_name || "-"}</td>
                            <td style={{ padding: "12px", color: colors.textSecondary }}>
                              {booking.booking_date
                                ? new Date(`${booking.booking_date}T00:00:00`).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "short",
                                  })
                                : "-"}
                            </td>
                            <td style={{ padding: "12px" }}>
                              <StatusBadge status={booking.status || "pending"} />
                            </td>
                            <td style={{ padding: "12px", textAlign: "right", color: "#22c55e", fontWeight: 600 }}>
                              ₹{booking.total_amount ?? 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {bookings.length > 5 && (
                  <button
                    onClick={() => setActiveTab('bookings')}
                    style={{
                      marginTop: 16,
                      padding: "10px 20px",
                      borderRadius: 8,
                      border: `1px solid ${colors.border}`,
                      background: "rgba(59, 130, 246, 0.1)",
                      color: "#3b82f6",
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: "pointer",
                    }}
                  >
                    View All Bookings →
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              {/* Filters */}
              <div
                style={{
                  background: "rgba(15,23,42,0.6)",
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  padding: "20px",
                  marginBottom: 24,
                }}
              >
                {/* Date Range Quick Filters */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: colors.textMuted,
                      display: "block",
                      marginBottom: 12,
                      fontWeight: 600,
                    }}
                  >
                    📅 Date Range
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { value: "all", label: "All Time" },
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                      { value: "quarter", label: "This Quarter" },
                      { value: "custom", label: "Custom Range" },
                    ].map((range) => (
                      <button
                        key={range.value}
                        onClick={() => setDateRangeFilter(range.value)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: `1px solid ${dateRangeFilter === range.value ? "#3b82f6" : colors.border}`,
                          background: dateRangeFilter === range.value ? "rgba(59, 130, 246, 0.15)" : "rgba(30,41,59,0.5)",
                          color: dateRangeFilter === range.value ? "#3b82f6" : colors.textSecondary,
                          fontSize: 13,
                          fontWeight: dateRangeFilter === range.value ? 600 : 400,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Range Inputs */}
                {dateRangeFilter === "custom" && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 16,
                      marginBottom: 20,
                      padding: 16,
                      background: "rgba(59, 130, 246, 0.05)",
                      borderRadius: 8,
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `1px solid ${colors.border}`,
                          background: "rgba(30,41,59,0.5)",
                          color: colors.textPrimary,
                          fontSize: 14,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                        End Date
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: `1px solid ${colors.border}`,
                          background: "rgba(30,41,59,0.5)",
                          color: colors.textPrimary,
                          fontSize: 14,
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Other Filters */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                  }}
                >
                  {/* Search */}
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      🔍 Search
                    </label>
                    <input
                      type="text"
                      placeholder="Name, email, phone, ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: "rgba(30,41,59,0.5)",
                        color: colors.textPrimary,
                        fontSize: 14,
                      }}
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      ⚡ Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: "rgba(30,41,59,0.5)",
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
                  </div>

                  {/* Source Filter */}
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      📍 Source
                    </label>
                    <select
                      value={sourceFilter}
                      onChange={(e) => setSourceFilter(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: `1px solid ${colors.border}`,
                        background: "rgba(30,41,59,0.5)",
                        color: colors.textPrimary,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      <option value="all">All Sources</option>
                      <option value="online">Online</option>
                      <option value="walk_in">Walk-in</option>
                    </select>
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setSourceFilter("all");
                    setDateRangeFilter("all");
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  style={{
                    marginTop: 16,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                    background: "rgba(239, 68, 68, 0.1)",
                    color: "#ef4444",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  🔄 Clear All Filters
                </button>
              </div>

              {/* Active Filters Summary */}
              {(statusFilter !== "all" || sourceFilter !== "all" || dateRangeFilter !== "all" || searchQuery) && (
                <div style={{ marginBottom: 16, fontSize: 13, color: colors.textMuted }}>
                  📊 Showing {filteredBookings.length} of {bookings.length} bookings
                </div>
              )}

              {/* Results Count */}
              <div
                style={{
                  marginBottom: 16,
                  fontSize: 14,
                  color: colors.textMuted,
                }}
              >
                Showing {filteredBookings.length} of {bookings.length} bookings
              </div>

              {/* Bookings Table */}
              <div
                style={{
                  background: "rgba(15,23,42,0.6)",
                  borderRadius: 16,
                  border: `1px solid ${colors.border}`,
                  overflow: "hidden",
                }}
              >
                {filteredBookings.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: colors.textMuted,
                    }}
                  >
                    <div style={{ fontSize: 48, marginBottom: 16 }}>📅</div>
                    <div style={{ fontSize: 16 }}>No bookings found</div>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: 13 }}>
                      <thead>
                        <tr
                          style={{
                            background: "rgba(30,41,59,0.5)",
                            borderBottom: `1px solid ${colors.border}`,
                          }}
                        >
                          <th style={{ padding: "14px 16px", textAlign: "left", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Booking ID
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Customer Name
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Phone Number
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Console
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Duration
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Source
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Status
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "right", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Amount
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "center", color: colors.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking, index) => {
                          const source = booking.source?.toLowerCase() === "walk_in" ? "Walk-in" : "Online";
                          return (
                            <tr
                              key={booking.id}
                              style={{
                                borderBottom: index < filteredBookings.length - 1 ? `1px solid rgba(71, 85, 105, 0.2)` : "none",
                                transition: "background 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(51,65,85,0.3)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "transparent";
                              }}
                            >
                              {/* Booking ID */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontFamily: "monospace", fontSize: 12, color: colors.textPrimary, fontWeight: 600 }}>
                                  #{booking.id.slice(0, 8).toUpperCase()}
                                </div>
                              </td>

                              {/* Customer Name */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>
                                  {booking.customer_name || booking.user_name || "Guest"}
                                </div>
                              </td>

                              {/* Phone Number */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontSize: 13, color: colors.textSecondary }}>
                                  {booking.customer_phone || booking.user_phone || "-"}
                                </div>
                              </td>

                              {/* Console */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 500 }}>
                                  {(() => {
                                    const items = booking.booking_items || [];
                                    if (items.length === 0) return "-";

                                    const consoles = items.map((item: any) => {
                                      const consoleName = item.console || "Unknown";
                                      const controllers = item.quantity || 1;
                                      return controllers > 1 ? `${consoleName} (${controllers} controllers)` : consoleName;
                                    });

                                    return consoles.join(", ");
                                  })()}
                                </div>
                              </td>

                              {/* Duration */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <div style={{ fontSize: 12, color: colors.textSecondary }}>
                                    {booking.booking_date
                                      ? (() => {
                                          const bookingDate = new Date(`${booking.booking_date}T00:00:00`);
                                          const today = new Date();
                                          const tomorrow = new Date(today);
                                          tomorrow.setDate(tomorrow.getDate() + 1);

                                          const isToday = bookingDate.toDateString() === today.toDateString();
                                          const isTomorrow = bookingDate.toDateString() === tomorrow.toDateString();

                                          if (isToday) return "Today";
                                          if (isTomorrow) return "Tomorrow";

                                          return bookingDate.toLocaleDateString("en-IN", {
                                            day: "2-digit",
                                            month: "short",
                                          });
                                        })()
                                      : "-"}
                                  </div>
                                  <div style={{ fontSize: 13, color: colors.textPrimary, fontWeight: 600 }}>
                                    {(() => {
                                      if (!booking.start_time) return "-";

                                      try {
                                        // Parse start time and calculate end time using booking duration
                                        const startTime = booking.start_time;
                                        const duration = booking.duration || 60; // Default to 60 minutes if not set
                                        const timeParts = startTime.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);

                                        if (!timeParts) return startTime;

                                        let hours = parseInt(timeParts[1]);
                                        const minutes = parseInt(timeParts[2]);
                                        const period = timeParts[3]?.toLowerCase();

                                        // Convert to 24-hour format
                                        if (period === 'pm' && hours !== 12) {
                                          hours += 12;
                                        } else if (period === 'am' && hours === 12) {
                                          hours = 0;
                                        }

                                        // Calculate end time (add duration in minutes)
                                        let endMinutes = hours * 60 + minutes + duration;
                                        let endHours = Math.floor(endMinutes / 60) % 24;
                                        const endMins = endMinutes % 60;

                                        // Convert back to 12-hour format
                                        const endPeriod = endHours >= 12 ? 'pm' : 'am';
                                        const endHours12 = endHours % 12 || 12;
                                        const endTime = `${endHours12}:${endMins.toString().padStart(2, '0')} ${endPeriod}`;

                                        return `${startTime} - ${endTime}`;
                                      } catch (e) {
                                        return booking.start_time;
                                      }
                                    })()}
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <span
                                  style={{
                                    padding: "4px 10px",
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 500,
                                    background: source === "Walk-in" ? "rgba(168, 85, 247, 0.15)" : "rgba(59, 130, 246, 0.15)",
                                    color: source === "Walk-in" ? "#a855f7" : "#3b82f6",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                >
                                  {source === "Walk-in" ? "🚶" : "💻"}
                                  {source}
                                </span>
                              </td>
                              <td style={{ padding: "14px 16px" }}>
                                <StatusBadge status={booking.status || "pending"} />
                              </td>
                              <td style={{ padding: "14px 16px", textAlign: "right" }}>
                                <div style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  background: "rgba(34, 197, 94, 0.1)",
                                  padding: "6px 12px",
                                  borderRadius: 6,
                                  border: "1px solid rgba(34, 197, 94, 0.2)"
                                }}>
                                  <span style={{ fontSize: 11, color: "#22c55e" }}>💰</span>
                                  <span style={{ fontFamily: fonts.heading, fontSize: 15, color: "#22c55e", fontWeight: 700 }}>
                                    ₹{booking.total_amount ?? 0}
                                  </span>
                                </div>
                              </td>
                              <td style={{ padding: "14px 16px", textAlign: "center" }}>
                                {source === "Walk-in" && (
                                  <button
                                    onClick={() => handleEditBooking(booking)}
                                    style={{
                                      padding: "6px 12px",
                                      borderRadius: 6,
                                      border: `1px solid ${colors.border}`,
                                      background: "rgba(59, 130, 246, 0.1)",
                                      color: "#3b82f6",
                                      fontSize: 11,
                                      fontWeight: 500,
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = "rgba(59, 130, 246, 0.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                                    }}
                                  >
                                    ✏️ Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Billing Tab */}
          {activeTab === 'live-billing' && (
            <LiveBillingTab
              cafes={cafes}
            />
          )}

          {/* Cafe Details Tab */}
          {activeTab === 'cafe-details' && (
            <div>
              {cafes.length === 0 ? (
                <div
                  style={{
                    background: "rgba(15,23,42,0.6)",
                    borderRadius: 16,
                    border: `1px solid ${colors.border}`,
                    padding: "60px 20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🏪</div>
                  <p style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                    No café found
                  </p>
                  <p style={{ fontSize: 13, color: colors.textMuted, marginBottom: 20 }}>
                    Contact admin to set up your café.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(30,41,59,0.8), rgba(15,23,42,0.9))",
                    borderRadius: 16,
                    border: `1px solid rgba(71, 85, 105, 0.3)`,
                    padding: "32px",
                    maxWidth: 800,
                    margin: "0 auto",
                  }}
                >
                  {/* Cafe Header */}
                  <div style={{ marginBottom: 32, textAlign: "center" }}>
                    <div style={{
                      fontSize: 48,
                      marginBottom: 16,
                      background: "linear-gradient(135deg, #22c55e, #16a34a)",
                      width: 80,
                      height: 80,
                      borderRadius: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 16px",
                    }}>
                      🏪
                    </div>
                    <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: colors.textPrimary }}>
                      {cafes[0].name || "Your Gaming Café"}
                    </h2>
                    {cafes[0].address && (
                      <div style={{ fontSize: 15, color: colors.textSecondary, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                        <span>📍</span>
                        {cafes[0].address}
                      </div>
                    )}
                  </div>

                  {/* Café Description */}
                  {cafes[0].description && (
                    <div style={{
                      fontSize: 14,
                      color: colors.textSecondary,
                      lineHeight: 1.6,
                      marginBottom: 32,
                      padding: "20px",
                      background: "rgba(15,23,42,0.5)",
                      borderRadius: 12,
                      border: `1px solid ${colors.border}`,
                    }}>
                      {cafes[0].description}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => router.push(`/owner/cafes/${cafes[0].id}`)}
                    style={{
                      width: "100%",
                      padding: "18px 32px",
                      borderRadius: 12,
                      border: "none",
                      background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                      color: "#fff",
                      fontSize: 16,
                      fontWeight: 600,
                      cursor: "pointer",
                      boxShadow: "0 4px 16px rgba(59, 130, 246, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 16px rgba(59, 130, 246, 0.3)";
                    }}
                  >
                    <span style={{ fontSize: 20 }}>⚙️</span>
                    Edit Café Details, Pricing & Photos
                  </button>

                  <p style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: colors.textMuted,
                    marginTop: 16,
                    fontStyle: "italic"
                  }}>
                    Update your café information, console pricing, and photo gallery
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div
              style={{
                background: "rgba(15,23,42,0.6)",
                borderRadius: 16,
                border: `1px solid ${colors.border}`,
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>📈</div>
              <p style={{ fontSize: 18, color: colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                Analytics Coming Soon
              </p>
              <p style={{ fontSize: 14, color: colors.textMuted }}>
                Detailed insights and reports will be available here.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setEditingBooking(null)}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              borderRadius: 20,
              border: `1px solid ${colors.border}`,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "32px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 24, margin: "0 0 8px 0", color: colors.textPrimary }}>
                Edit Walk-In Booking
              </h2>
              <p style={{ fontSize: 13, color: colors.textMuted, margin: 0 }}>
                Booking ID: #{editingBooking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Customer Info */}
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                  Customer
                </label>
                <div
                  style={{
                    padding: "12px",
                    background: "rgba(30,41,59,0.5)",
                    borderRadius: 8,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div style={{ fontSize: 14, color: colors.textPrimary, marginBottom: 4 }}>
                    {editingBooking.user_name || "Guest"}
                  </div>
                  {editingBooking.user_email && (
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>
                      {editingBooking.user_email}
                    </div>
                  )}
                  {editingBooking.user_phone && (
                    <div style={{ fontSize: 12, color: colors.textSecondary }}>
                      📞 {editingBooking.user_phone}
                    </div>
                  )}
                </div>
              </div>

              {/* Date */}
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                  Booking Date *
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(30,41,59,0.5)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontFamily: fonts.body,
                  }}
                />
              </div>

              {/* Start Time */}
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                  Start Time *
                </label>
                <input
                  type="time"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(30,41,59,0.5)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontFamily: fonts.body,
                  }}
                />
              </div>

              {/* Duration */}
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                  Duration *
                </label>
                <select
                  value={editDuration}
                  onChange={(e) => setEditDuration(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(30,41,59,0.5)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontFamily: fonts.body,
                    cursor: "pointer",
                  }}
                >
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={90}>1.5 Hours</option>
                  <option value={120}>2 Hours</option>
                  <option value={150}>2.5 Hours</option>
                  <option value={180}>3 Hours</option>
                  <option value={210}>3.5 Hours</option>
                  <option value={240}>4 Hours</option>
                  <option value={270}>4.5 Hours</option>
                  <option value={300}>5 Hours</option>
                </select>
              </div>

              {/* End Time */}
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                  End Time (Auto-calculated)
                </label>
                <input
                  type="text"
                  value={editStartTime ? getEndTime(convertTo12Hour(editStartTime), editDuration) : ""}
                  readOnly
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(30,41,59,0.3)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.textMuted,
                    fontSize: 14,
                    fontFamily: fonts.body,
                    cursor: "not-allowed",
                  }}
                />
              </div>

              {/* Amount */}
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                  Total Amount (₹) * (Auto-calculated, editable)
                </label>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  min="0"
                  step="1"
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(30,41,59,0.5)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: "#22c55e",
                    fontSize: 14,
                    fontFamily: fonts.body,
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Status */}
              <div>
                <label style={{ fontSize: 12, color: colors.textMuted, display: "block", marginBottom: 8 }}>
                  Status *
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: "rgba(30,41,59,0.5)",
                    border: `1px solid ${colors.border}`,
                    borderRadius: 8,
                    color: colors.textPrimary,
                    fontSize: 14,
                    fontFamily: fonts.body,
                    cursor: "pointer",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button
                onClick={() => setEditingBooking(null)}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: 10,
                  border: `1px solid ${colors.border}`,
                  background: "rgba(51,65,85,0.5)",
                  color: colors.textSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBooking}
                disabled={saving || !editAmount || !editDate || !editStartTime}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  borderRadius: 10,
                  border: "none",
                  background:
                    saving || !editAmount || !editDate || !editStartTime
                      ? "rgba(59, 130, 246, 0.3)"
                      : "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: saving || !editAmount || !editDate || !editStartTime ? "not-allowed" : "pointer",
                  boxShadow:
                    saving || !editAmount || !editDate || !editStartTime
                      ? "none"
                      : "0 4px 16px rgba(59, 130, 246, 0.3)",
                }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Live Billing Tab Component
function LiveBillingTab({
  cafes,
}: {
  cafes: CafeRow[];
}) {
  const router = useRouter();
  const [consoleAvailability, setConsoleAvailability] = useState<any>({});
  const [activeBookings, setActiveBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingForm, setBillingForm] = useState({
    customerName: "",
    customerPhone: "",
    console: "",
    controllers: 1, // Number of controllers
    duration: 60, // Default 1 hour in minutes
    startTime: "",
    amount: "",
  });
  const [creatingBilling, setCreatingBilling] = useState(false);
  const [consolePricing, setConsolePricing] = useState<any[]>([]);

  const CONSOLE_TYPES = [
    { id: "ps5", label: "PS5", icon: "🎮", color: "#0070f3", dbKey: "ps5_count" },
    { id: "ps4", label: "PS4", icon: "🎮", color: "#7928ca", dbKey: "ps4_count" },
    { id: "xbox", label: "Xbox", icon: "🎮", color: "#107c10", dbKey: "xbox_count" },
    { id: "pc", label: "PC", icon: "💻", color: "#ff6b6b", dbKey: "pc_count" },
    { id: "pool", label: "Pool", icon: "🎱", color: "#f59e0b", dbKey: "pool_count" },
    { id: "snooker", label: "Snooker", icon: "🎱", color: "#10b981", dbKey: "snooker_count" },
    { id: "arcade", label: "Arcade", icon: "🕹️", color: "#8b5cf6", dbKey: "arcade_count" },
    { id: "vr", label: "VR", icon: "🥽", color: "#ec4899", dbKey: "vr_count" },
    { id: "steering_wheel", label: "Racing", icon: "🏎️", color: "#f97316", dbKey: "steering_wheel_count" },
  ];

  // Load live availability and pricing
  useEffect(() => {
    if (cafes.length === 0) return;

    async function loadLiveData() {
      try {
        setLoading(true);
        const cafeId = cafes[0].id;
        const now = new Date();
        const today = now.toISOString().slice(0, 10);

        // Set current time on initial load
        if (!billingForm.startTime) {
          const currentTime = now.toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          setBillingForm(prev => ({ ...prev, startTime: currentTime }));
        }

        // Fetch console pricing
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("*")
          .eq("cafe_id", cafeId);

        if (!pricingError && pricingData) {
          setConsolePricing(pricingData);
        }

        // Fetch active bookings (today, confirmed/pending, not completed)
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            id,
            cafe_id,
            user_id,
            booking_date,
            start_time,
            total_amount,
            status,
            source,
            created_at,
            customer_name,
            customer_phone,
            booking_items (
              console,
              quantity
            )
          `)
          .eq("cafe_id", cafeId)
          .eq("booking_date", today)
          .in("status", ["confirmed", "pending"])
          .order("start_time", { ascending: true });

        if (bookingsError) throw bookingsError;

        setActiveBookings((bookingsData as BookingRow[]) || []);

        // Calculate console availability based on current time
        const cafe = cafes[0];
        const availability: any = {};

        // Get current time in minutes from midnight
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;

        CONSOLE_TYPES.forEach((consoleType) => {
          const dbKey = consoleType.dbKey as keyof CafeRow;
          const totalConsoles = typeof cafe[dbKey] === 'number' ? cafe[dbKey] : 0;

          // Count booked consoles that are currently active (booking time overlaps with current time)
          let bookedCount = 0;
          bookingsData?.forEach((booking: any) => {
            // Parse booking start time
            const startTime = booking.start_time;
            if (!startTime) return;

            // Convert start time to minutes (e.g., "10:45 am" -> 645 minutes)
            const timeMatch = startTime.match(/(\d+):(\d+)\s*(am|pm)/i);
            if (!timeMatch) return;

            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const period = timeMatch[3].toLowerCase();

            // Convert to 24-hour format
            if (period === 'pm' && hours !== 12) {
              hours += 12;
            } else if (period === 'am' && hours === 12) {
              hours = 0;
            }

            const bookingStartMinutes = hours * 60 + minutes;
            const bookingEndMinutes = bookingStartMinutes + (booking.duration || 60);

            // Check if current time falls within booking time range
            const isActive = currentTimeMinutes >= bookingStartMinutes && currentTimeMinutes < bookingEndMinutes;

            if (isActive) {
              booking.booking_items?.forEach((item: any) => {
                if (item.console?.toLowerCase() === consoleType.id.toLowerCase()) {
                  bookedCount += 1; // Count 1 console per booking item, regardless of controller count
                }
              });
            }
          });

          availability[consoleType.id] = {
            total: totalConsoles,
            booked: bookedCount,
            available: Math.max(0, totalConsoles - bookedCount),
          };
        });

        setConsoleAvailability(availability);
      } catch (err: any) {
        console.error("Error loading live data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadLiveData();

    // Refresh every 30 seconds
    const interval = setInterval(loadLiveData, 30000);
    return () => clearInterval(interval);
  }, [cafes]);

  // Calculate price based on console, controllers, and duration
  useEffect(() => {
    if (!billingForm.console || !billingForm.controllers || !billingForm.duration) {
      setBillingForm(prev => ({ ...prev, amount: "" }));
      return;
    }

    // Find exact pricing match for the selected console, controllers, and duration
    const exactPricing = consolePricing.find((p: any) =>
      p.console_type?.toLowerCase() === billingForm.console.toLowerCase() &&
      p.quantity === billingForm.controllers &&
      p.duration_minutes === billingForm.duration
    );

    if (exactPricing) {
      // Exact match found in pricing table
      setBillingForm(prev => ({ ...prev, amount: exactPricing.price.toString() }));
    } else {
      // Calculate by breaking down duration into 30min and 60min blocks
      // Example: 90min = 1x 60min + 1x 30min, 120min = 2x 60min, 180min = 3x 60min

      const duration = billingForm.duration;
      const controllers = billingForm.controllers;
      const consoleType = billingForm.console.toLowerCase();

      // Get base pricing for 30min and 60min
      const pricing30 = consolePricing.find((p: any) =>
        p.console_type?.toLowerCase() === consoleType &&
        p.quantity === controllers &&
        p.duration_minutes === 30
      );

      const pricing60 = consolePricing.find((p: any) =>
        p.console_type?.toLowerCase() === consoleType &&
        p.quantity === controllers &&
        p.duration_minutes === 60
      );

      if (pricing30 && pricing60) {
        let totalPrice = 0;

        // Calculate price by adding 60min and 30min blocks
        if (duration === 90) {
          // 90min = 60min + 30min
          totalPrice = pricing60.price + pricing30.price;
        } else if (duration === 120) {
          // 120min = 2x 60min
          totalPrice = pricing60.price * 2;
        } else if (duration === 180) {
          // 180min = 3x 60min
          totalPrice = pricing60.price * 3;
        } else {
          // Fallback for other durations
          const hours = Math.floor(duration / 60);
          const halfHours = (duration % 60) / 30;
          totalPrice = (pricing60.price * hours) + (pricing30.price * halfHours);
        }

        setBillingForm(prev => ({ ...prev, amount: Math.round(totalPrice).toString() }));
      } else if (pricing60) {
        // Only 60min pricing available, scale proportionally
        const durationMultiplier = duration / 60;
        const calculatedPrice = Math.round(pricing60.price * durationMultiplier);
        setBillingForm(prev => ({ ...prev, amount: calculatedPrice.toString() }));
      } else {
        // Try to scale by controllers if duration pricing exists for different controller count
        const anyPricing = consolePricing.find((p: any) =>
          p.console_type?.toLowerCase() === consoleType &&
          p.duration_minutes === duration
        );

        if (anyPricing) {
          const pricePerController = anyPricing.price / anyPricing.quantity;
          const calculatedPrice = Math.round(pricePerController * controllers);
          setBillingForm(prev => ({ ...prev, amount: calculatedPrice.toString() }));
        } else if (cafes.length > 0 && cafes[0].hourly_price) {
          // Last fallback to café hourly price
          const basePrice = cafes[0].hourly_price as number;
          const durationMultiplier = duration / 60;
          const calculatedPrice = Math.round(basePrice * controllers * durationMultiplier);
          setBillingForm(prev => ({ ...prev, amount: calculatedPrice.toString() }));
        }
      }
    }
  }, [billingForm.console, billingForm.controllers, billingForm.duration, consolePricing, cafes]);

  // Handle manual billing creation
  async function handleCreateBilling() {
    if (!billingForm.customerName || !billingForm.customerPhone || !billingForm.console || !billingForm.startTime || !billingForm.amount) {
      alert("Please fill in all required fields");
      return;
    }

    if (cafes.length === 0) {
      alert("No café found");
      return;
    }

    try {
      setCreatingBilling(true);
      const today = new Date().toISOString().slice(0, 10);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          cafe_id: cafes[0].id,
          user_id: null, // Walk-in customer
          booking_date: today,
          start_time: billingForm.startTime,
          duration: billingForm.duration,
          total_amount: parseFloat(billingForm.amount),
          status: "confirmed",
          source: "walk_in",
          customer_name: billingForm.customerName,
          customer_phone: billingForm.customerPhone,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create booking items
      const { error: itemsError } = await supabase
        .from("booking_items")
        .insert({
          booking_id: booking.id,
          console: billingForm.console,
          quantity: billingForm.controllers,
          price: parseFloat(billingForm.amount),
        });

      if (itemsError) throw itemsError;

      // Navigate to success page
      router.push(`/bookings/success?ref=${booking.id}`);
    } catch (err: any) {
      console.error("Error creating billing:", err);
      alert("Failed to create billing: " + err.message);
    } finally {
      setCreatingBilling(false);
    }
  }

  if (cafes.length === 0) {
    return (
      <div
        style={{
          background: "rgba(15,23,42,0.6)",
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: "60px 20px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>💳</div>
        <p style={{ fontSize: 16, color: colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>
          No café found
        </p>
        <p style={{ fontSize: 13, color: colors.textMuted }}>
          Contact admin to set up your café.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Console Availability Grid */}
      <div
        style={{
          background: "rgba(15,23,42,0.6)",
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: "24px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2
            style={{
              fontSize: 18,
              fontWeight: 600,
              margin: 0,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span>🎮</span>
            Live Console Availability
          </h2>
          <div style={{
            fontSize: 11,
            color: colors.textMuted,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <span style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#22c55e",
              animation: "pulse 2s ease-in-out infinite",
            }}></span>
            Live - Auto-refreshes every 30s
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.textMuted }}>
            Loading availability...
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            {CONSOLE_TYPES.filter((consoleType) => {
              const avail = consoleAvailability[consoleType.id] || { total: 0, booked: 0, available: 0 };
              return avail.total > 0; // Only show consoles the café has
            }).map((consoleType) => {
              const avail = consoleAvailability[consoleType.id] || { total: 0, booked: 0, available: 0 };
              const availabilityPercent = avail.total > 0 ? (avail.available / avail.total) * 100 : 0;

              return (
                <div
                  key={consoleType.id}
                  style={{
                    background: "rgba(30,41,59,0.5)",
                    borderRadius: 12,
                    border: `1px solid ${colors.border}`,
                    padding: "16px",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Background gradient */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: `${availabilityPercent}%`,
                      background: `linear-gradient(180deg, transparent, ${consoleType.color}15)`,
                      transition: "height 0.3s ease",
                    }}
                  />

                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <span style={{ fontSize: 24 }}>{consoleType.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                          {consoleType.label}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>
                          {avail.total} Total
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
                      <div>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#22c55e" }}>
                          {avail.available}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>Available</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: "#ef4444" }}>
                          {avail.booked}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textMuted }}>In Use</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Manual Billing Form */}
      <div
        style={{
          background: "rgba(15,23,42,0.6)",
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: "24px",
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>💳</span>
          Create Walk-In Billing
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: colors.textMuted, display: "block", marginBottom: 8 }}>
              Customer Name *
            </label>
            <input
              type="text"
              value={billingForm.customerName}
              onChange={(e) => setBillingForm({ ...billingForm, customerName: e.target.value })}
              placeholder="Enter customer name"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "rgba(30,41,59,0.5)",
                color: colors.textPrimary,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textMuted, display: "block", marginBottom: 8 }}>
              Phone Number *
            </label>
            <input
              type="tel"
              value={billingForm.customerPhone}
              onChange={(e) => setBillingForm({ ...billingForm, customerPhone: e.target.value })}
              placeholder="Enter phone number"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "rgba(30,41,59,0.5)",
                color: colors.textPrimary,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textMuted, display: "block", marginBottom: 8 }}>
              Console Type *
            </label>
            <select
              value={billingForm.console}
              onChange={(e) => setBillingForm({ ...billingForm, console: e.target.value })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "rgba(30,41,59,0.5)",
                color: colors.textPrimary,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <option value="">Select Console</option>
              {CONSOLE_TYPES.filter((console) => {
                const avail = consoleAvailability[console.id] || { total: 0, available: 0 };
                return avail.total > 0; // Only show consoles the café has
              }).map((console) => {
                const avail = consoleAvailability[console.id] || { available: 0 };
                return (
                  <option key={console.id} value={console.id} disabled={avail.available === 0}>
                    {console.icon} {console.label} ({avail.available} available)
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textMuted, display: "block", marginBottom: 8 }}>
              Number of Controllers *
            </label>
            <select
              value={billingForm.controllers}
              onChange={(e) => setBillingForm({ ...billingForm, controllers: parseInt(e.target.value) })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "rgba(30,41,59,0.5)",
                color: colors.textPrimary,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <option value={1}>1 Controller</option>
              <option value={2}>2 Controllers</option>
              <option value={3}>3 Controllers</option>
              <option value={4}>4 Controllers</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textMuted, display: "block", marginBottom: 8 }}>
              Duration *
            </label>
            <select
              value={billingForm.duration}
              onChange={(e) => setBillingForm({ ...billingForm, duration: parseInt(e.target.value) })}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "rgba(30,41,59,0.5)",
                color: colors.textPrimary,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              <option value={30}>30 Minutes</option>
              <option value={60}>1 Hour</option>
              <option value={90}>1.5 Hours</option>
              <option value={120}>2 Hours</option>
              <option value={180}>3 Hours</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textMuted, display: "block", marginBottom: 8 }}>
              Start Time * (Auto-set to current time)
            </label>
            <input
              type="text"
              value={billingForm.startTime}
              onChange={(e) => setBillingForm({ ...billingForm, startTime: e.target.value })}
              placeholder="e.g., 2:30 pm"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "rgba(30,41,59,0.5)",
                color: colors.textPrimary,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: colors.textMuted, display: "block", marginBottom: 8 }}>
              Amount (₹) * (Auto-calculated, editable)
            </label>
            <input
              type="number"
              value={billingForm.amount}
              onChange={(e) => setBillingForm({ ...billingForm, amount: e.target.value })}
              placeholder="Auto-calculated price"
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: `1px solid ${colors.border}`,
                background: "rgba(30,41,59,0.5)",
                color: billingForm.amount ? "#22c55e" : colors.textPrimary,
                fontSize: 14,
                fontWeight: billingForm.amount ? 600 : 400,
              }}
            />
          </div>
        </div>

        <button
          onClick={handleCreateBilling}
          disabled={creatingBilling}
          style={{
            padding: "14px 28px",
            borderRadius: 10,
            border: "none",
            background: creatingBilling
              ? "rgba(34, 197, 94, 0.3)"
              : "linear-gradient(135deg, #22c55e, #16a34a)",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: creatingBilling ? "not-allowed" : "pointer",
            boxShadow: creatingBilling ? "none" : "0 4px 16px rgba(34, 197, 94, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {creatingBilling ? "Creating..." : "Create Walk-In Booking"}
        </button>
      </div>

      {/* Active Bookings Today */}
      <div
        style={{
          background: "rgba(15,23,42,0.6)",
          borderRadius: 16,
          border: `1px solid ${colors.border}`,
          padding: "24px",
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span>📅</span>
          Active Bookings Today ({activeBookings.length})
        </h2>

        {activeBookings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: colors.textMuted }}>
            No active bookings for today
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Time</th>
                  <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Console</th>
                  <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Qty</th>
                  <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Source</th>
                  <th style={{ padding: "12px", textAlign: "left", color: colors.textMuted, fontWeight: 600 }}>Status</th>
                  <th style={{ padding: "12px", textAlign: "right", color: colors.textMuted, fontWeight: 600 }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {activeBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    style={{
                      borderBottom: `1px solid rgba(71, 85, 105, 0.2)`,
                    }}
                  >
                    <td style={{ padding: "12px" }}>{booking.start_time}</td>
                    <td style={{ padding: "12px" }}>
                      {booking.booking_items?.map((item: any) => item.console).join(", ") || "-"}
                    </td>
                    <td style={{ padding: "12px" }}>
                      {booking.booking_items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0}
                    </td>
                    <td style={{ padding: "12px" }}>
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        background: booking.source === "walk_in" ? "rgba(168, 85, 247, 0.15)" : "rgba(59, 130, 246, 0.15)",
                        color: booking.source === "walk_in" ? "#a855f7" : "#3b82f6",
                      }}>
                        {booking.source === "walk_in" ? "Walk-in" : "Online"}
                      </span>
                    </td>
                    <td style={{ padding: "12px" }}>
                      <StatusBadge status={booking.status || "pending"} />
                    </td>
                    <td style={{ padding: "12px", textAlign: "right", color: "#22c55e", fontWeight: 600 }}>
                      ₹{booking.total_amount ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Helper Components
function StatCard({
  title,
  value,
  subtitle,
  icon,
  gradient,
  color,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  gradient: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "24px",
        borderRadius: 16,
        background: gradient,
        border: `1px solid ${color}40`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.1 }}>
        {icon}
      </div>
      <div style={{ position: "relative", zIndex: 1 }}>
        <p
          style={{
            fontSize: 11,
            color: `${color}E6`,
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            fontWeight: 600,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: fonts.heading,
            fontSize: 36,
            margin: "8px 0",
            color: color,
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        <p style={{ fontSize: 13, color: `${color}B3`, marginTop: 8 }}>{subtitle}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusLower = status.toLowerCase();
  let background = "rgba(245, 158, 11, 0.15)";
  let color = "#f59e0b";

  if (statusLower === "confirmed") {
    background = "rgba(34, 197, 94, 0.15)";
    color = "#22c55e";
  } else if (statusLower === "cancelled") {
    background = "rgba(239, 68, 68, 0.15)";
    color = "#ef4444";
  } else if (statusLower === "completed") {
    background = "rgba(59, 130, 246, 0.15)";
    color = "#3b82f6";
  }

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 500,
        background,
        color,
        textTransform: "uppercase",
      }}
    >
      {status}
    </span>
  );
}
