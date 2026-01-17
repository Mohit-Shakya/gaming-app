// src/app/admin/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { fonts } from "@/lib/constants";
import { logAdminAction } from "@/lib/auditLog";

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
  is_featured?: boolean;
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

type NavTab = 'overview' | 'cafes' | 'users' | 'bookings' | 'revenue' | 'reports' | 'settings' | 'announcements' | 'audit-logs' | 'coupons';

type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  target_audience: 'all' | 'users' | 'owners';
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
};

type AuditLogRow = {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

type CouponRow = {
  id: string;
  cafe_id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  bonus_minutes: number;
  max_uses: number | null;
  uses_count: number;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  cafe_name?: string;
};

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
  const [announcements, setAnnouncements] = useState<AnnouncementRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Announcement form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    type: 'info' as 'info' | 'warning' | 'success' | 'error',
    target_audience: 'all' as 'all' | 'users' | 'owners',
    expires_at: '',
  });

  // Admin settings state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filters
  const [cafeFilter, setCafeFilter] = useState<string>("all");
  const [cafeSearch, setCafeSearch] = useState<string>("");
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userSearch, setUserSearch] = useState<string>("");
  const [bookingStatusFilter, setBookingStatusFilter] = useState<string>("all");
  const [bookingDateFilter, setBookingDateFilter] = useState<string>("");
  const [bookingSearch, setBookingSearch] = useState<string>("");

  // Pagination
  const [cafePage, setCafePage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [bookingPage, setBookingPage] = useState(1);
  const itemsPerPage = 10;

  // Sorting
  const [cafeSort, setCafeSort] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'created_at', order: 'desc' });
  const [userSort, setUserSort] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'created_at', order: 'desc' });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [bookingSort, setBookingSort] = useState<{ field: string; order: 'asc' | 'desc' }>({ field: 'created_at', order: 'desc' });

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

  const navItems: { id: NavTab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'cafes', label: 'Cafés', icon: '🏪' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'coupons', label: 'Coupons', icon: '🎟️' },
    { id: 'revenue', label: 'Revenue', icon: '💰' },
    { id: 'announcements', label: 'Announcements', icon: '📢' },
    { id: 'audit-logs', label: 'Audit Logs', icon: '📋' },
    { id: 'reports', label: 'Reports', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  // Check if user is admin and has valid admin session
  useEffect(() => {
    async function checkAdmin() {
      // Check for admin session first
      const adminSession = localStorage.getItem("admin_session");
      if (!adminSession) {
        router.push("/admin/login");
        return;
      }

      // Verify session is not expired (24 hours)
      let sessionUserId: string;
      try {
        const session = JSON.parse(adminSession);
        if (Date.now() - session.timestamp > 24 * 60 * 60 * 1000) {
          localStorage.removeItem("admin_session");
          router.push("/admin/login");
          return;
        }
        sessionUserId = session.userId;
      } catch {
        localStorage.removeItem("admin_session");
        router.push("/admin/login");
        return;
      }

      // Verify the user from session is still an admin
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role, is_admin")
          .eq("id", sessionUserId)
          .maybeSingle();

        if (profileError) {
          console.error("Admin check error:", profileError);
          setIsAdmin(false);
          localStorage.removeItem("admin_session");
          router.push("/admin/login");
          return;
        }

        if (!profile) {
          localStorage.removeItem("admin_session");
          router.push("/admin/login");
          return;
        }

        const role = profile.role?.toLowerCase();
        const is_admin_flag = profile.is_admin;

        const isReallyAdmin = role === "admin" || role === "super_admin" || is_admin_flag === true;

        if (!isReallyAdmin) {
          localStorage.removeItem("admin_session");
          router.push("/admin/login");
          return;
        }

        setIsAdmin(true);
      } catch (err) {
        console.error("Admin check error:", err);
        localStorage.removeItem("admin_session");
        router.push("/admin/login");
        return;
      } finally {
        setIsChecking(false);
      }
    }

    checkAdmin();
  }, [router]);

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
            is_featured,
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
              .select("first_name, last_name")
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

            // Combine first_name and last_name for owner name
            const ownerName = owner
              ? [owner.first_name, owner.last_name].filter(Boolean).join(" ") || "Unknown Owner"
              : "Unknown Owner";

            return {
              ...cafe,
              owner_name: ownerName,
              owner_email: "N/A", // Email not in profiles table
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
        setError(null);

        // Fetch profiles with role - email comes from auth.users, not profiles table
        const { data, error } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, phone, role, created_at")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Profiles query error details:", error);
          setError(`Failed to load users: ${error.message || 'Unknown error'}`);
          setLoadingData(false);
          return;
        }

        const enrichedUsers = await Promise.all(
          (data || []).map(async (profile) => {
            const { count: bookingCount } = await supabase
              .from("bookings")
              .select("id", { count: "exact", head: true })
              .eq("user_id", profile.id);

            const { data: bookingData } = await supabase
              .from("bookings")
              .select("total_amount, created_at")
              .eq("user_id", profile.id)
              .order("created_at", { ascending: false })
              .limit(1);

            const { data: revenueData } = await supabase
              .from("bookings")
              .select("total_amount")
              .eq("user_id", profile.id);

            const totalSpent = revenueData?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;

            // Combine first_name and last_name into name
            const name = [profile.first_name, profile.last_name]
              .filter(Boolean)
              .join(" ") || "Unknown User";

            // Get role from profiles table, default to 'user' if not set
            const role = profile.role || "user";

            return {
              id: profile.id,
              name,
              email: null, // Email not stored in profiles table
              phone: profile.phone,
              role: role,
              created_at: profile.created_at,
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
                .select("first_name, last_name")
                .eq("id", booking.user_id)
                .maybeSingle();
              userName = user
                ? [user.first_name, user.last_name].filter(Boolean).join(" ") || "Online User"
                : "Online User";
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

  // Load announcements data
  useEffect(() => {
    if (!isAdmin || activeTab !== 'announcements') return;

    async function loadAnnouncements() {
      try {
        setLoadingData(true);
        setError(null);

        const { data, error } = await supabase
          .from("platform_announcements")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setAnnouncements(data || []);
      } catch (err) {
        console.error("Error loading announcements:", err);
        setError("Failed to load announcements data");
      } finally {
        setLoadingData(false);
      }
    }

    loadAnnouncements();
  }, [isAdmin, activeTab]);

  // Load audit logs data
  useEffect(() => {
    if (!isAdmin || activeTab !== 'audit-logs') return;

    async function loadAuditLogs() {
      try {
        setLoadingData(true);
        setError(null);

        const { data, error } = await supabase
          .from("audit_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        setAuditLogs(data || []);
      } catch (err) {
        console.error("Error loading audit logs:", err);
        setError("Failed to load audit logs data");
      } finally {
        setLoadingData(false);
      }
    }

    loadAuditLogs();
  }, [isAdmin, activeTab]);

  // Load coupons data
  useEffect(() => {
    if (!isAdmin || activeTab !== 'coupons') return;

    async function loadCoupons() {
      try {
        setLoadingData(true);
        setError(null);

        const { data, error } = await supabase
          .from("coupons")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Enrich with cafe names
        const enrichedCoupons = await Promise.all(
          (data || []).map(async (coupon) => {
            const { data: cafe } = await supabase
              .from("cafes")
              .select("name")
              .eq("id", coupon.cafe_id)
              .maybeSingle();

            return {
              ...coupon,
              cafe_name: cafe?.name || "Unknown Café",
            };
          })
        );

        setCoupons(enrichedCoupons);
      } catch (err) {
        console.error("Error loading coupons:", err);
        setError("Failed to load coupons data");
      } finally {
        setLoadingData(false);
      }
    }

    loadCoupons();
  }, [isAdmin, activeTab]);

  // Toggle cafe active status
  async function toggleCafeStatus(cafeId: string, currentStatus: boolean, cafeName: string) {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("cafes")
        .update({ is_active: newStatus })
        .eq("id", cafeId);

      if (error) throw error;

      setCafes(prev => prev.map(c =>
        c.id === cafeId ? { ...c, is_active: newStatus } : c
      ));

      // Log the action
      await logAdminAction({
        action: newStatus ? "activate" : "deactivate",
        entityType: "cafe",
        entityId: cafeId,
        details: { cafeName, oldStatus: currentStatus, newStatus }
      });
    } catch (err) {
      console.error("Error toggling cafe status:", err);
      alert("Failed to update café status");
    }
  }

  // Delete cafe
  async function deleteCafe(cafeId: string, cafeName: string) {
    if (!confirm(`Are you sure you want to delete "${cafeName}"? This will delete all related bookings, pricing, and images. This action cannot be undone.`)) {
      return;
    }

    try {
      setLoadingData(true);

      console.log("Starting deletion process for cafe:", cafeId);

      // Delete related records first (cascading delete)
      // 1. Delete booking items
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id")
        .eq("cafe_id", cafeId);

      if (bookingsError) {
        console.error("Error fetching bookings:", bookingsError);
      }

      if (bookings && bookings.length > 0) {
        console.log(`Deleting booking items for ${bookings.length} bookings`);
        const bookingIds = bookings.map(b => b.id);
        const { error: bookingItemsError } = await supabase
          .from("booking_items")
          .delete()
          .in("booking_id", bookingIds);

        if (bookingItemsError) {
          console.error("Error deleting booking items:", bookingItemsError);
        }
      }

      // 2. Delete bookings
      console.log("Deleting bookings...");
      const { error: deleteBookingsError } = await supabase
        .from("bookings")
        .delete()
        .eq("cafe_id", cafeId);

      if (deleteBookingsError) {
        console.error("Error deleting bookings:", deleteBookingsError);
      }

      // 3. Delete console pricing
      console.log("Deleting console pricing...");
      const { error: pricingError } = await supabase
        .from("console_pricing")
        .delete()
        .eq("cafe_id", cafeId);

      if (pricingError) {
        console.error("Error deleting console pricing:", pricingError);
      }

      // 4. Delete cafe images
      console.log("Deleting cafe images...");
      const { error: galleryError } = await supabase
        .from("cafe_images")
        .delete()
        .eq("cafe_id", cafeId);

      if (galleryError) {
        console.error("Error deleting cafe images:", galleryError);
      }

      // 5. Finally, delete the café
      console.log("Deleting café...");
      const { error } = await supabase
        .from("cafes")
        .delete()
        .eq("id", cafeId);

      if (error) {
        console.error("Error deleting cafe:", error);
        throw error;
      }

      console.log("Café deleted successfully");

      // Update local state
      setCafes(prev => prev.filter(c => c.id !== cafeId));

      // Reload stats to reflect changes
      setStats(prev => prev ? {
        ...prev,
        totalCafes: prev.totalCafes - 1,
        activeCafes: prev.activeCafes - 1,
      } : null);

      // Log the action
      await logAdminAction({
        action: "delete",
        entityType: "cafe",
        entityId: cafeId,
        details: { cafeName }
      });

      alert("Café and all related data deleted successfully");
    } catch (err) {
      console.error("Error deleting cafe:", err);
      alert(`Failed to delete café: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoadingData(false);
    }
  }

  // Update user role
  async function updateUserRole(userId: string, newRole: string, userName: string) {
    try {
      const oldRole = users.find(u => u.id === userId)?.role;

      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));

      // Log the action
      await logAdminAction({
        action: "change_role",
        entityType: "user",
        entityId: userId,
        details: { userName, oldRole, newRole }
      });
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

      // Log the action
      await logAdminAction({
        action: "delete",
        entityType: "user",
        entityId: userId,
        details: { userName }
      });

      alert("User deleted successfully");
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user");
    }
  }

  // Create announcement
  async function createAnnouncement() {
    try {
      if (!announcementForm.title || !announcementForm.message) {
        alert("Please fill in title and message");
        return;
      }

      const { error } = await supabase
        .from("platform_announcements")
        .insert({
          title: announcementForm.title,
          message: announcementForm.message,
          type: announcementForm.type,
          target_audience: announcementForm.target_audience,
          expires_at: announcementForm.expires_at || null,
        });

      if (error) throw error;

      // Log the action
      await logAdminAction({
        action: "create",
        entityType: "announcement",
        details: { title: announcementForm.title, type: announcementForm.type }
      });

      // Reset form
      setAnnouncementForm({
        title: '',
        message: '',
        type: 'info',
        target_audience: 'all',
        expires_at: '',
      });
      setShowAnnouncementForm(false);

      // Reload announcements
      const { data } = await supabase
        .from("platform_announcements")
        .select("*")
        .order("created_at", { ascending: false });

      setAnnouncements(data || []);
      alert("Announcement created successfully");
    } catch (err) {
      console.error("Error creating announcement:", err);
      alert("Failed to create announcement");
    }
  }

  // Toggle announcement status
  async function toggleAnnouncementStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("platform_announcements")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setAnnouncements(prev => prev.map(a =>
        a.id === id ? { ...a, is_active: !currentStatus } : a
      ));
    } catch (err) {
      console.error("Error toggling announcement:", err);
      alert("Failed to update announcement");
    }
  }

  // Delete announcement
  async function deleteAnnouncement(id: string, title: string) {
    if (!confirm(`Are you sure you want to delete announcement "${title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("platform_announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(a => a.id !== id));

      await logAdminAction({
        action: "delete",
        entityType: "announcement",
        entityId: id,
        details: { title }
      });

      alert("Announcement deleted successfully");
    } catch (err) {
      console.error("Error deleting announcement:", err);
      alert("Failed to delete announcement");
    }
  }

  // Save admin settings (username/password)
  async function saveAdminSettings() {
    setSettingsMessage(null);
    setSavingSettings(true);

    try {
      if (!user?.id) {
        setSettingsMessage({ type: 'error', text: 'User not found' });
        setSavingSettings(false);
        return;
      }

      // Get current admin credentials
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("admin_username, admin_password")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setSettingsMessage({ type: 'error', text: 'Unable to load admin credentials' });
        setSavingSettings(false);
        return;
      }

      // Verify current password
      const currentAdminPassword = profile.admin_password || 'admin123';
      if (currentPassword !== currentAdminPassword) {
        setSettingsMessage({ type: 'error', text: 'Current password is incorrect' });
        setSavingSettings(false);
        return;
      }

      // Validate new credentials
      if (!newUsername && !newPassword) {
        setSettingsMessage({ type: 'error', text: 'Please enter a new username or password' });
        setSavingSettings(false);
        return;
      }

      if (newPassword && newPassword !== confirmPassword) {
        setSettingsMessage({ type: 'error', text: 'New passwords do not match' });
        setSavingSettings(false);
        return;
      }

      if (newPassword && newPassword.length < 6) {
        setSettingsMessage({ type: 'error', text: 'Password must be at least 6 characters' });
        setSavingSettings(false);
        return;
      }

      // Update credentials
      const updates: { admin_username?: string; admin_password?: string } = {};
      if (newUsername) updates.admin_username = newUsername;
      if (newPassword) updates.admin_password = newPassword;

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Update session with new username if changed
      if (newUsername) {
        const adminSession = localStorage.getItem("admin_session");
        if (adminSession) {
          const session = JSON.parse(adminSession);
          session.username = newUsername;
          localStorage.setItem("admin_session", JSON.stringify(session));
        }
      }

      // Log the action
      await logAdminAction({
        action: "update",
        entityType: "settings",
        entityId: user.id,
        details: {
          username_changed: !!newUsername,
          password_changed: !!newPassword
        }
      });

      setSettingsMessage({ type: 'success', text: 'Admin credentials updated successfully!' });

      // Clear form
      setCurrentPassword('');
      setNewUsername('');
      setNewPassword('');
      setConfirmPassword('');

    } catch (err) {
      console.error("Error updating admin settings:", err);
      setSettingsMessage({ type: 'error', text: 'Failed to update credentials' });
    } finally {
      setSavingSettings(false);
    }
  }

  // Toggle featured café
  async function toggleFeaturedCafe(cafeId: string, currentStatus: boolean, cafeName: string) {
    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from("cafes")
        .update({
          is_featured: newStatus,
          featured_at: newStatus ? new Date().toISOString() : null
        })
        .eq("id", cafeId);

      if (error) throw error;

      setCafes(prev => prev.map(c =>
        c.id === cafeId ? { ...c, is_featured: newStatus } as CafeRow : c
      ));

      await logAdminAction({
        action: newStatus ? "feature" : "unfeature",
        entityType: "cafe",
        entityId: cafeId,
        details: { cafeName }
      });

      alert(`Café ${newStatus ? 'featured' : 'unfeatured'} successfully`);
    } catch (err) {
      console.error("Error toggling featured status:", err);
      alert("Failed to update featured status");
    }
  }

  // Sorting helper
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortData = <T extends Record<string, any>>(data: T[], field: string, order: 'asc' | 'desc'): T[] => {
    return [...data].sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return order === 'asc'
        ? (aVal > bVal ? 1 : -1)
        : (bVal > aVal ? 1 : -1);
    });
  };

  // Handle sort click
  const handleSort = (
    currentSort: { field: string; order: 'asc' | 'desc' },
    setSort: React.Dispatch<React.SetStateAction<{ field: string; order: 'asc' | 'desc' }>>,
    field: string
  ) => {
    if (currentSort.field === field) {
      setSort({ field, order: currentSort.order === 'asc' ? 'desc' : 'asc' });
    } else {
      setSort({ field, order: 'asc' });
    }
  };

  // Filter and sort data
  const filteredCafes = sortData(
    cafes.filter(cafe => {
      if (cafeFilter === "active" && !cafe.is_active) return false;
      if (cafeFilter === "inactive" && cafe.is_active) return false;
      if (cafeSearch && !cafe.name.toLowerCase().includes(cafeSearch.toLowerCase()) &&
        !cafe.address.toLowerCase().includes(cafeSearch.toLowerCase())) return false;
      return true;
    }),
    cafeSort.field,
    cafeSort.order
  );

  const filteredUsers = sortData(
    users.filter(user => {
      if (userRoleFilter !== "all" && user.role !== userRoleFilter) return false;
      if (userSearch && !user.name.toLowerCase().includes(userSearch.toLowerCase()) &&
        !(user.email || "").toLowerCase().includes(userSearch.toLowerCase())) return false;
      return true;
    }),
    userSort.field,
    userSort.order
  );

  const filteredBookings = sortData(
    bookings.filter(booking => {
      if (bookingStatusFilter !== "all" && booking.status !== bookingStatusFilter) return false;
      if (bookingDateFilter && booking.booking_date !== bookingDateFilter) return false;
      if (bookingSearch && !booking.user_name?.toLowerCase().includes(bookingSearch.toLowerCase()) &&
        !booking.cafe_name?.toLowerCase().includes(bookingSearch.toLowerCase())) return false;
      return true;
    }),
    bookingSort.field,
    bookingSort.order
  );

  // Paginate data
  const paginatedCafes = filteredCafes.slice((cafePage - 1) * itemsPerPage, cafePage * itemsPerPage);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * itemsPerPage, userPage * itemsPerPage);
  const paginatedBookings = filteredBookings.slice((bookingPage - 1) * itemsPerPage, bookingPage * itemsPerPage);

  const totalCafePages = Math.ceil(filteredCafes.length / itemsPerPage);
  const totalUserPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const totalBookingPages = Math.ceil(filteredBookings.length / itemsPerPage);

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
            display: "flex",
            flexDirection: "column",
            gap: 12,
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
          <button
            onClick={() => {
              localStorage.removeItem("admin_session");
              router.push("/admin/login");
            }}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: 10,
              border: `1px solid rgba(248, 113, 113, 0.3)`,
              background: "transparent",
              color: "#f87171",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(248, 113, 113, 0.1)";
              e.currentTarget.style.borderColor = "#f87171";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = "rgba(248, 113, 113, 0.3)";
            }}
          >
            🚪 Logout Admin
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
                {activeTab === 'announcements' && 'Platform Announcements'}
                {activeTab === 'audit-logs' && 'Audit Logs'}
                {activeTab === 'coupons' && 'Coupon Management'}
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
                        <th onClick={() => handleSort(cafeSort, setCafeSort, 'name')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Café Name {cafeSort.field === 'name' && (cafeSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort(cafeSort, setCafeSort, 'owner_name')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Owner {cafeSort.field === 'owner_name' && (cafeSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Location</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Consoles</th>
                        <th onClick={() => handleSort(cafeSort, setCafeSort, 'total_bookings')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Bookings {cafeSort.field === 'total_bookings' && (cafeSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort(cafeSort, setCafeSort, 'total_revenue')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Revenue {cafeSort.field === 'total_revenue' && (cafeSort.order === 'asc' ? '↑' : '↓')}
                        </th>
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
                      ) : paginatedCafes.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No cafés found
                          </td>
                        </tr>
                      ) : (
                        paginatedCafes.map((cafe) => (
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
                                  onClick={() => toggleCafeStatus(cafe.id, cafe.is_active, cafe.name)}
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
                                  onClick={() => toggleFeaturedCafe(cafe.id, cafe.is_featured || false, cafe.name)}
                                  style={{
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    border: "none",
                                    background: cafe.is_featured ? "rgba(245, 158, 11, 0.2)" : "rgba(139, 92, 246, 0.2)",
                                    color: cafe.is_featured ? "#f59e0b" : "#8b5cf6",
                                    fontSize: 12,
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  {cafe.is_featured ? "⭐ Featured" : "☆ Feature"}
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

                {/* Pagination Controls */}
                {totalCafePages > 1 && (
                  <div style={{ padding: "20px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, color: theme.textSecondary }}>
                      Showing {((cafePage - 1) * itemsPerPage) + 1} - {Math.min(cafePage * itemsPerPage, filteredCafes.length)} of {filteredCafes.length} cafés
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setCafePage(p => Math.max(1, p - 1))}
                        disabled={cafePage === 1}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: `1px solid ${theme.border}`,
                          background: cafePage === 1 ? "rgba(15, 23, 42, 0.5)" : theme.cardBackground,
                          color: cafePage === 1 ? theme.textMuted : theme.textPrimary,
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: cafePage === 1 ? "not-allowed" : "pointer",
                        }}
                      >
                        Previous
                      </button>
                      <div style={{ display: "flex", gap: 4 }}>
                        {Array.from({ length: Math.min(5, totalCafePages) }, (_, i) => {
                          let pageNum;
                          if (totalCafePages <= 5) {
                            pageNum = i + 1;
                          } else if (cafePage <= 3) {
                            pageNum = i + 1;
                          } else if (cafePage >= totalCafePages - 2) {
                            pageNum = totalCafePages - 4 + i;
                          } else {
                            pageNum = cafePage - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCafePage(pageNum)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: `1px solid ${theme.border}`,
                                background: cafePage === pageNum ? "linear-gradient(135deg, #a855f7, #9333ea)" : theme.cardBackground,
                                color: cafePage === pageNum ? "#fff" : theme.textPrimary,
                                fontSize: 14,
                                fontWeight: cafePage === pageNum ? 600 : 500,
                                cursor: "pointer",
                                minWidth: 40,
                              }}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      <button
                        onClick={() => setCafePage(p => Math.min(totalCafePages, p + 1))}
                        disabled={cafePage === totalCafePages}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: `1px solid ${theme.border}`,
                          background: cafePage === totalCafePages ? "rgba(15, 23, 42, 0.5)" : theme.cardBackground,
                          color: cafePage === totalCafePages ? theme.textMuted : theme.textPrimary,
                          fontSize: 14,
                          fontWeight: 500,
                          cursor: cafePage === totalCafePages ? "not-allowed" : "pointer",
                        }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
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
                        <th onClick={() => handleSort(userSort, setUserSort, 'name')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Name {userSort.field === 'name' && (userSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Email</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Phone</th>
                        <th onClick={() => handleSort(userSort, setUserSort, 'role')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Role {userSort.field === 'role' && (userSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort(userSort, setUserSort, 'total_bookings')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Bookings {userSort.field === 'total_bookings' && (userSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort(userSort, setUserSort, 'total_spent')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Total Spent {userSort.field === 'total_spent' && (userSort.order === 'asc' ? '↑' : '↓')}
                        </th>
                        <th onClick={() => handleSort(userSort, setUserSort, 'created_at')} style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", userSelect: "none" }}>
                          Joined {userSort.field === 'created_at' && (userSort.order === 'asc' ? '↑' : '↓')}
                        </th>
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
                      ) : paginatedUsers.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No users found
                          </td>
                        </tr>
                      ) : (
                        paginatedUsers.map((userRow) => (
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
                                onChange={(e) => updateUserRole(userRow.id, e.target.value, userRow.name)}
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

                {/* Pagination Controls */}
                {totalUserPages > 1 && (
                  <div style={{ padding: "20px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, color: theme.textSecondary }}>
                      Showing {((userPage - 1) * itemsPerPage) + 1} - {Math.min(userPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${theme.border}`, background: userPage === 1 ? "rgba(15, 23, 42, 0.5)" : theme.cardBackground, color: userPage === 1 ? theme.textMuted : theme.textPrimary, fontSize: 14, fontWeight: 500, cursor: userPage === 1 ? "not-allowed" : "pointer" }}>Previous</button>
                      {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => { const pageNum = totalUserPages <= 5 ? i + 1 : userPage <= 3 ? i + 1 : userPage >= totalUserPages - 2 ? totalUserPages - 4 + i : userPage - 2 + i; return (<button key={pageNum} onClick={() => setUserPage(pageNum)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: userPage === pageNum ? "linear-gradient(135deg, #a855f7, #9333ea)" : theme.cardBackground, color: userPage === pageNum ? "#fff" : theme.textPrimary, fontSize: 14, fontWeight: userPage === pageNum ? 600 : 500, cursor: "pointer", minWidth: 40 }}>{pageNum}</button>); })}
                      <button onClick={() => setUserPage(p => Math.min(totalUserPages, p + 1))} disabled={userPage === totalUserPages} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${theme.border}`, background: userPage === totalUserPages ? "rgba(15, 23, 42, 0.5)" : theme.cardBackground, color: userPage === totalUserPages ? theme.textMuted : theme.textPrimary, fontSize: 14, fontWeight: 500, cursor: userPage === totalUserPages ? "not-allowed" : "pointer" }}>Next</button>
                    </div>
                  </div>
                )}
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
                      ) : paginatedBookings.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No bookings found
                          </td>
                        </tr>
                      ) : (
                        paginatedBookings.map((booking) => (
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

                {/* Pagination Controls */}
                {totalBookingPages > 1 && (
                  <div style={{ padding: "20px", borderTop: `1px solid ${theme.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 14, color: theme.textSecondary }}>
                      Showing {((bookingPage - 1) * itemsPerPage) + 1} - {Math.min(bookingPage * itemsPerPage, filteredBookings.length)} of {filteredBookings.length} bookings
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setBookingPage(p => Math.max(1, p - 1))} disabled={bookingPage === 1} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${theme.border}`, background: bookingPage === 1 ? "rgba(15, 23, 42, 0.5)" : theme.cardBackground, color: bookingPage === 1 ? theme.textMuted : theme.textPrimary, fontSize: 14, fontWeight: 500, cursor: bookingPage === 1 ? "not-allowed" : "pointer" }}>Previous</button>
                      {Array.from({ length: Math.min(5, totalBookingPages) }, (_, i) => { const pageNum = totalBookingPages <= 5 ? i + 1 : bookingPage <= 3 ? i + 1 : bookingPage >= totalBookingPages - 2 ? totalBookingPages - 4 + i : bookingPage - 2 + i; return (<button key={pageNum} onClick={() => setBookingPage(pageNum)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${theme.border}`, background: bookingPage === pageNum ? "linear-gradient(135deg, #a855f7, #9333ea)" : theme.cardBackground, color: bookingPage === pageNum ? "#fff" : theme.textPrimary, fontSize: 14, fontWeight: bookingPage === pageNum ? 600 : 500, cursor: "pointer", minWidth: 40 }}>{pageNum}</button>); })}
                      <button onClick={() => setBookingPage(p => Math.min(totalBookingPages, p + 1))} disabled={bookingPage === totalBookingPages} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${theme.border}`, background: bookingPage === totalBookingPages ? "rgba(15, 23, 42, 0.5)" : theme.cardBackground, color: bookingPage === totalBookingPages ? theme.textMuted : theme.textPrimary, fontSize: 14, fontWeight: 500, cursor: bookingPage === totalBookingPages ? "not-allowed" : "pointer" }}>Next</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REVENUE TAB */}
          {activeTab === 'revenue' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Time-based Revenue Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4, 1fr)",
                  gap: 16,
                }}
              >
                <div style={{ padding: "24px", background: "rgba(16, 185, 129, 0.1)", borderRadius: 16, border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    Today
                  </p>
                  <p style={{ fontFamily: fonts.heading, fontSize: 32, color: "#10b981", margin: 0, fontWeight: 700 }}>
                    {formatCurrency(stats?.todayRevenue || 0)}
                  </p>
                  <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>{stats?.todayBookings || 0} bookings</p>
                </div>
                <div style={{ padding: "24px", background: "rgba(59, 130, 246, 0.1)", borderRadius: 16, border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                  <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    This Week
                  </p>
                  <p style={{ fontFamily: fonts.heading, fontSize: 32, color: "#3b82f6", margin: 0, fontWeight: 700 }}>
                    {formatCurrency(stats?.weekRevenue || 0)}
                  </p>
                </div>
                <div style={{ padding: "24px", background: "rgba(139, 92, 246, 0.1)", borderRadius: 16, border: "1px solid rgba(139, 92, 246, 0.2)" }}>
                  <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    This Month
                  </p>
                  <p style={{ fontFamily: fonts.heading, fontSize: 32, color: "#8b5cf6", margin: 0, fontWeight: 700 }}>
                    {formatCurrency(stats?.monthRevenue || 0)}
                  </p>
                </div>
                <div style={{ padding: "24px", background: "rgba(168, 85, 247, 0.1)", borderRadius: 16, border: "1px solid rgba(168, 85, 247, 0.2)" }}>
                  <p style={{ fontSize: 11, color: theme.textMuted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    All Time
                  </p>
                  <p style={{ fontFamily: fonts.heading, fontSize: 32, color: "#a855f7", margin: 0, fontWeight: 700 }}>
                    {formatCurrency(stats?.totalRevenue || 0)}
                  </p>
                  <p style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>{stats?.totalBookings || 0} total bookings</p>
                </div>
              </div>

              {/* Revenue by Café Table */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "20px 24px", borderBottom: `1px solid ${theme.border}` }}>
                  <h3 style={{ fontSize: 18, color: theme.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                    📊 Revenue by Café
                  </h3>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "rgba(168, 85, 247, 0.08)", borderBottom: `1px solid ${theme.border}` }}>
                        <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Café</th>
                        <th style={{ padding: "14px 20px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Owner</th>
                        <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Bookings</th>
                        <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Revenue</th>
                        <th style={{ padding: "14px 20px", textAlign: "right", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cafes.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No café data available
                          </td>
                        </tr>
                      ) : (
                        [...cafes]
                          .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
                          .map((cafe) => {
                            const sharePercent = stats?.totalRevenue ? ((cafe.total_revenue || 0) / stats.totalRevenue * 100).toFixed(1) : '0';
                            return (
                              <tr
                                key={cafe.id}
                                style={{
                                  borderBottom: `1px solid ${theme.border}`,
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(168, 85, 247, 0.05)"; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                              >
                                <td style={{ padding: "16px 20px" }}>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>{cafe.name}</div>
                                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 2 }}>{cafe.address?.substring(0, 40)}...</div>
                                </td>
                                <td style={{ padding: "16px 20px", fontSize: 14, color: theme.textSecondary }}>
                                  {cafe.owner_name || 'Unknown'}
                                </td>
                                <td style={{ padding: "16px 20px", textAlign: "right", fontSize: 14, color: theme.textSecondary }}>
                                  {cafe.total_bookings || 0}
                                </td>
                                <td style={{ padding: "16px 20px", textAlign: "right", fontSize: 14, fontWeight: 600, color: "#10b981" }}>
                                  {formatCurrency(cafe.total_revenue || 0)}
                                </td>
                                <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                  <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, background: "rgba(168, 85, 247, 0.15)", color: "#a855f7" }}>
                                    {sharePercent}%
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Top Cafés by Revenue */}
              <div
                style={{
                  padding: "24px",
                  borderRadius: 16,
                  background: theme.cardBackground,
                  border: `1px solid ${theme.border}`,
                }}
              >
                <h3 style={{ fontSize: 18, marginBottom: 20, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 10 }}>
                  🏆 Top Cafés by Revenue
                </h3>
                {cafes.length === 0 ? (
                  <p style={{ color: theme.textMuted }}>No café data available</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {[...cafes]
                      .sort((a, b) => (b.total_revenue || 0) - (a.total_revenue || 0))
                      .slice(0, 5)
                      .map((cafe, index) => {
                        const maxRevenue = Math.max(...cafes.map(c => c.total_revenue || 0), 1);
                        const widthPercent = ((cafe.total_revenue || 0) / maxRevenue) * 100;
                        return (
                          <div key={cafe.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ width: 24, fontSize: 14, fontWeight: 600, color: index === 0 ? "#fbbf24" : theme.textSecondary }}>
                              #{index + 1}
                            </span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: 14, color: theme.textPrimary }}>{cafe.name}</span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: "#10b981" }}>{formatCurrency(cafe.total_revenue || 0)}</span>
                              </div>
                              <div style={{ height: 8, background: "rgba(16, 185, 129, 0.1)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${widthPercent}%`, background: "linear-gradient(90deg, #10b981, #34d399)", borderRadius: 4, transition: "width 0.5s" }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Platform Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                <div style={{ padding: "20px", borderRadius: 12, background: theme.cardBackground, border: `1px solid ${theme.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Total Revenue</div>
                </div>
                <div style={{ padding: "20px", borderRadius: 12, background: theme.cardBackground, border: `1px solid ${theme.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#3b82f6" }}>{stats?.totalBookings || 0}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Total Bookings</div>
                </div>
                <div style={{ padding: "20px", borderRadius: 12, background: theme.cardBackground, border: `1px solid ${theme.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#a855f7" }}>{stats?.totalCafes || 0}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Active Cafés</div>
                </div>
                <div style={{ padding: "20px", borderRadius: 12, background: theme.cardBackground, border: `1px solid ${theme.border}`, textAlign: "center" }}>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>{stats?.totalUsers || 0}</div>
                  <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>Registered Users</div>
                </div>
              </div>

              {/* Revenue Breakdown */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 16,
                    background: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <h3 style={{ fontSize: 18, marginBottom: 20, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 10 }}>
                    💰 Revenue Breakdown
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textSecondary }}>Today</span>
                      <span style={{ fontWeight: 600, color: "#10b981" }}>{formatCurrency(stats?.todayRevenue || 0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textSecondary }}>This Week</span>
                      <span style={{ fontWeight: 600, color: "#3b82f6" }}>{formatCurrency(stats?.weekRevenue || 0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textSecondary }}>This Month</span>
                      <span style={{ fontWeight: 600, color: "#a855f7" }}>{formatCurrency(stats?.monthRevenue || 0)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                      <span style={{ color: theme.textSecondary }}>All Time</span>
                      <span style={{ fontWeight: 600, color: "#f59e0b" }}>{formatCurrency(stats?.totalRevenue || 0)}</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "24px",
                    borderRadius: 16,
                    background: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <h3 style={{ fontSize: 18, marginBottom: 20, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 10 }}>
                    📊 Café Performance
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textSecondary }}>Active Cafés</span>
                      <span style={{ fontWeight: 600, color: "#10b981" }}>{stats?.activeCafes || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textSecondary }}>Pending Cafés</span>
                      <span style={{ fontWeight: 600, color: "#f59e0b" }}>{stats?.pendingCafes || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: `1px solid ${theme.border}` }}>
                      <span style={{ color: theme.textSecondary }}>Café Owners</span>
                      <span style={{ fontWeight: 600, color: "#3b82f6" }}>{stats?.totalOwners || 0}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0" }}>
                      <span style={{ color: theme.textSecondary }}>Avg. Revenue/Café</span>
                      <span style={{ fontWeight: 600, color: "#a855f7" }}>{formatCurrency(stats?.totalCafes ? Math.round((stats?.totalRevenue || 0) / stats.totalCafes) : 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ANNOUNCEMENTS TAB */}
          {activeTab === 'announcements' && (
            <div>
              {/* Create Announcement Button */}
              <div style={{ marginBottom: 24 }}>
                <button
                  onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: "linear-gradient(135deg, #a855f7, #9333ea)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {showAnnouncementForm ? '✕ Cancel' : '+ Create Announcement'}
                </button>
              </div>

              {/* Announcement Form */}
              {showAnnouncementForm && (
                <div
                  style={{
                    marginBottom: 24,
                    padding: "24px",
                    borderRadius: 12,
                    background: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                  }}
                >
                  <h3 style={{ fontSize: 18, marginBottom: 16, color: theme.textPrimary }}>New Announcement</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <input
                      type="text"
                      placeholder="Title"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: `1px solid ${theme.border}`,
                        background: "rgba(15, 23, 42, 0.8)",
                        color: theme.textPrimary,
                        fontSize: 14,
                      }}
                    />
                    <textarea
                      placeholder="Message"
                      value={announcementForm.message}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, message: e.target.value })}
                      rows={4}
                      style={{
                        padding: "12px 16px",
                        borderRadius: 10,
                        border: `1px solid ${theme.border}`,
                        background: "rgba(15, 23, 42, 0.8)",
                        color: theme.textPrimary,
                        fontSize: 14,
                        fontFamily: fonts.body,
                        resize: "vertical",
                      }}
                    />
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                      <select
                        value={announcementForm.type}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, type: e.target.value as 'info' | 'warning' | 'success' | 'error' })}
                        style={{
                          padding: "12px 16px",
                          borderRadius: 10,
                          border: `1px solid ${theme.border}`,
                          background: "rgba(15, 23, 42, 0.8)",
                          color: theme.textPrimary,
                          fontSize: 14,
                        }}
                      >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                      </select>
                      <select
                        value={announcementForm.target_audience}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, target_audience: e.target.value as 'all' | 'users' | 'owners' })}
                        style={{
                          padding: "12px 16px",
                          borderRadius: 10,
                          border: `1px solid ${theme.border}`,
                          background: "rgba(15, 23, 42, 0.8)",
                          color: theme.textPrimary,
                          fontSize: 14,
                        }}
                      >
                        <option value="all">All Users</option>
                        <option value="users">Users Only</option>
                        <option value="owners">Owners Only</option>
                      </select>
                      <input
                        type="datetime-local"
                        placeholder="Expires At (optional)"
                        value={announcementForm.expires_at}
                        onChange={(e) => setAnnouncementForm({ ...announcementForm, expires_at: e.target.value })}
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
                    <button
                      onClick={createAnnouncement}
                      style={{
                        padding: "12px 24px",
                        borderRadius: 10,
                        border: "none",
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        color: "#fff",
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: "pointer",
                        alignSelf: "flex-start",
                      }}
                    >
                      Create Announcement
                    </button>
                  </div>
                </div>
              )}

              {/* Announcements List */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 12,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                }}
              >
                {loadingData ? (
                  <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                    Loading announcements...
                  </div>
                ) : announcements.length === 0 ? (
                  <div style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                    No announcements yet
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "20px" }}>
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        style={{
                          padding: "20px",
                          borderRadius: 12,
                          background: "rgba(15, 23, 42, 0.8)",
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, margin: "0 0 8px 0" }}>
                              {announcement.title}
                            </h4>
                            <p style={{ fontSize: 14, color: theme.textSecondary, margin: "0 0 12px 0" }}>
                              {announcement.message}
                            </p>
                            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                              <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: announcement.type === 'info' ? 'rgba(59, 130, 246, 0.2)' : announcement.type === 'warning' ? 'rgba(245, 158, 11, 0.2)' : announcement.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(248, 113, 113, 0.2)', color: announcement.type === 'info' ? '#3b82f6' : announcement.type === 'warning' ? '#f59e0b' : announcement.type === 'success' ? '#10b981' : '#f87171' }}>
                                {announcement.type}
                              </span>
                              <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'rgba(168, 85, 247, 0.2)', color: '#a855f7' }}>
                                {announcement.target_audience}
                              </span>
                              <span style={{ padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, background: announcement.is_active ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)', color: announcement.is_active ? '#10b981' : theme.textMuted }}>
                                {announcement.is_active ? 'Active' : 'Inactive'}
                              </span>
                              <span style={{ fontSize: 12, color: theme.textMuted }}>
                                Created: {formatDate(announcement.created_at)}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={() => toggleAnnouncementStatus(announcement.id, announcement.is_active)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 8,
                                border: "none",
                                background: announcement.is_active ? "rgba(248, 113, 113, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                color: announcement.is_active ? "#f87171" : "#10b981",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {announcement.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteAnnouncement(announcement.id, announcement.title)}
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
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === 'audit-logs' && (
            <div>
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
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Timestamp</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Action</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Entity Type</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Entity ID</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            Loading audit logs...
                          </td>
                        </tr>
                      ) : auditLogs.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No audit logs found
                          </td>
                        </tr>
                      ) : (
                        auditLogs.map((log) => (
                          <tr
                            key={log.id}
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
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              {new Date(log.created_at).toLocaleString()}
                            </td>
                            <td style={{ padding: "16px" }}>
                              <span
                                style={{
                                  padding: "6px 12px",
                                  borderRadius: 8,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  background: log.action === 'delete' ? "rgba(248, 113, 113, 0.2)" : log.action === 'create' ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)",
                                  color: log.action === 'delete' ? "#f87171" : log.action === 'create' ? "#10b981" : "#3b82f6",
                                }}
                              >
                                {log.action}
                              </span>
                            </td>
                            <td style={{ padding: "16px", fontSize: 14, color: theme.textPrimary }}>
                              {log.entity_type}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textMuted, fontFamily: "monospace" }}>
                              {log.entity_id ? log.entity_id.substring(0, 8) + '...' : 'N/A'}
                            </td>
                            <td style={{ padding: "16px", fontSize: 13, color: theme.textSecondary }}>
                              {log.details ? JSON.stringify(log.details).substring(0, 100) + '...' : 'N/A'}
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

          {/* COUPONS TAB */}
          {activeTab === 'coupons' && (
            <div>
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
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Code</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Café</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Discount</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Usage</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Valid Until</th>
                        <th style={{ padding: "16px", textAlign: "left", fontSize: 12, fontWeight: 600, color: theme.textSecondary, textTransform: "uppercase", letterSpacing: 1 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingData ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            Loading coupons...
                          </td>
                        </tr>
                      ) : coupons.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: theme.textMuted }}>
                            No coupons found across any café
                          </td>
                        </tr>
                      ) : (
                        coupons.map((coupon) => {
                          const isExpired = coupon.valid_until && new Date(coupon.valid_until) < new Date();
                          const discountDisplay = coupon.discount_type === 'percentage'
                            ? `${coupon.discount_value}% OFF`
                            : coupon.bonus_minutes > 0
                              ? `${coupon.bonus_minutes} mins FREE`
                              : `₹${coupon.discount_value} OFF`;

                          return (
                            <tr
                              key={coupon.id}
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
                              <td style={{ padding: "16px", fontFamily: "monospace", fontSize: 14, color: theme.textPrimary, fontWeight: 600 }}>
                                {coupon.code}
                              </td>
                              <td style={{ padding: "16px", fontSize: 14, color: theme.textSecondary }}>
                                {coupon.cafe_name}
                              </td>
                              <td style={{ padding: "16px" }}>
                                <span
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: coupon.discount_type === 'percentage' ? "rgba(16, 185, 129, 0.2)" : "rgba(59, 130, 246, 0.2)",
                                    color: coupon.discount_type === 'percentage' ? "#10b981" : "#3b82f6",
                                  }}
                                >
                                  {discountDisplay}
                                </span>
                              </td>
                              <td style={{ padding: "16px", fontSize: 14, color: theme.textSecondary }}>
                                {coupon.uses_count} / {coupon.max_uses || '∞'}
                              </td>
                              <td style={{ padding: "16px", fontSize: 13, color: theme.textMuted }}>
                                {coupon.valid_until ? formatDate(coupon.valid_until) : 'No expiry'}
                              </td>
                              <td style={{ padding: "16px" }}>
                                <span
                                  style={{
                                    padding: "6px 12px",
                                    borderRadius: 8,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    background: !coupon.is_active || isExpired ? "rgba(248, 113, 113, 0.2)" : "rgba(16, 185, 129, 0.2)",
                                    color: !coupon.is_active || isExpired ? "#f87171" : "#10b981",
                                  }}
                                >
                                  {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div
              style={{
                padding: "40px",
                borderRadius: 16,
                background: theme.cardBackground,
                border: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ marginBottom: 32 }}>
                <h2 style={{ fontFamily: fonts.heading, fontSize: 24, marginBottom: 8, color: theme.textPrimary, display: "flex", alignItems: "center", gap: 12 }}>
                  ⚙️ Admin Settings
                </h2>
                <p style={{ fontSize: 14, color: theme.textSecondary }}>
                  Manage your admin login credentials
                </p>
              </div>

              {/* Success/Error Message */}
              {settingsMessage && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 8,
                    marginBottom: 24,
                    background: settingsMessage.type === 'success'
                      ? "rgba(34, 197, 94, 0.1)"
                      : "rgba(239, 68, 68, 0.1)",
                    border: `1px solid ${settingsMessage.type === 'success' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    color: settingsMessage.type === 'success' ? '#22c55e' : '#ef4444',
                    fontSize: 14,
                  }}
                >
                  {settingsMessage.text}
                </div>
              )}

              <div style={{ maxWidth: 600 }}>
                {/* Current Password */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.textPrimary,
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ height: 1, background: theme.border, marginBottom: 24 }} />

                {/* New Username */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>
                    New Username (optional)
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Leave blank to keep current username"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.textPrimary,
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                {/* New Password */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>
                    New Password (optional)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: theme.background,
                      color: theme.textPrimary,
                      fontSize: 14,
                      outline: "none",
                    }}
                  />
                </div>

                {/* Confirm New Password */}
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: theme.textSecondary, marginBottom: 8 }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    disabled={!newPassword}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: newPassword ? theme.background : theme.cardBackground,
                      color: theme.textPrimary,
                      fontSize: 14,
                      outline: "none",
                      cursor: newPassword ? "text" : "not-allowed",
                    }}
                  />
                </div>

                {/* Save Button */}
                <button
                  onClick={saveAdminSettings}
                  disabled={savingSettings || !currentPassword}
                  style={{
                    padding: "12px 24px",
                    borderRadius: 8,
                    border: "none",
                    background: savingSettings || !currentPassword
                      ? "rgba(168, 85, 247, 0.3)"
                      : "linear-gradient(135deg, #a855f7, #8b5cf6)",
                    color: "#ffffff",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: savingSettings || !currentPassword ? "not-allowed" : "pointer",
                    opacity: savingSettings || !currentPassword ? 0.5 : 1,
                    transition: "all 0.2s",
                  }}
                >
                  {savingSettings ? "Saving..." : "Save Changes"}
                </button>

                <p style={{ fontSize: 13, color: theme.textMuted, marginTop: 16 }}>
                  * Current password is required to make changes
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
