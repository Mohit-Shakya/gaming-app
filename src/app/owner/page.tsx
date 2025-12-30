// src/app/owner/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUser from "@/hooks/useUser";
import { colors, fonts } from "@/lib/constants";
import { getEndTime } from "@/lib/timeUtils";
import ConsoleStatusDashboard from "@/components/ConsoleStatusDashboard";
import { ConsolePricingRow, BookingItemRow } from "@/types/database";

type OwnerStats = {
  cafesCount: number;
  bookingsToday: number;
  recentBookings: number;
  recentRevenue: number;
  todayRevenue: number;
  weekRevenue: number;
  monthRevenue: number;
  quarterRevenue: number;
  totalRevenue: number;
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
  payment_mode?: string | null;
  created_at: string | null;
  customer_name?: string | null; // For walk-in bookings only
  customer_phone?: string | null; // For walk-in bookings only
  booking_items?: Array<{
    id: string;
    console: string | null;
    quantity: number | null;
  }>;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  cafe_name?: string | null;
};

type NavTab = 'dashboard' | 'sessions' | 'customers' | 'stations' | 'subscriptions' | 'memberships' | 'coupons' | 'reports' | 'settings' | 'overview' | 'live-status' | 'bookings' | 'cafe-details' | 'analytics';

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

function convertTo12Hour(time24h?: string): string {
  if (!time24h) {
    // If no time provided, use current time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const period = hours >= 12 ? "pm" : "am";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  }

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
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

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

  // Revenue filter for overview
  const [revenueFilter, setRevenueFilter] = useState<string>("today"); // today, week, month, quarter, all

  // Customer tab state
  const [customerSearch, setCustomerSearch] = useState("");
  const [hasSubscription, setHasSubscription] = useState(false);
  const [hasMembership, setHasMembership] = useState(false);
  const [customerSortBy, setCustomerSortBy] = useState<'name' | 'sessions' | 'totalSpent' | 'lastVisit'>('lastVisit');
  const [customerSortOrder, setCustomerSortOrder] = useState<'asc' | 'desc'>('desc');

  // Edit modal state
  const [editingBooking, setEditingBooking] = useState<BookingRow | null>(null);

  // Settings state
  const [settingsChanged, setSettingsChanged] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editedCafe, setEditedCafe] = useState<{
    address: string;
    phone: string;
    email: string;
    description: string;
    opening_time: string;
    closing_time: string;
  }>({
    address: '',
    phone: '',
    email: '',
    description: '',
    opening_time: '09:00 AM',
    closing_time: '11:00 PM',
  });
  // Add Station modal state
  const [showAddStationModal, setShowAddStationModal] = useState(false);
  const [newStationType, setNewStationType] = useState<string>('ps5');
  const [newStationCount, setNewStationCount] = useState<number>(1);
  const [addingStation, setAddingStation] = useState(false);

  // Delete Station state
  const [stationToDelete, setStationToDelete] = useState<{name: string, type: string} | null>(null);
  const [deletingStation, setDeletingStation] = useState(false);

  // Station power status (tracks which stations are powered off)
  const [poweredOffStations, setPoweredOffStations] = useState<Set<string>>(new Set());

  const [editAmount, setEditAmount] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editDate, setEditDate] = useState<string>("");
  const [editStartTime, setEditStartTime] = useState<string>("");
  const [editDuration, setEditDuration] = useState<number>(60);
  const [editConsole, setEditConsole] = useState<string>("");
  const [editControllers, setEditControllers] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // Console pricing data
  const [consolePricing, setConsolePricing] = useState<Record<string, any>>({});

  // Refresh trigger for bookings
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Time update trigger for active sessions (updates every second)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Station management state
  const [stationSearch, setStationSearch] = useState("");
  const [stationTypeFilter, setStationTypeFilter] = useState("all");
  const [stationStatusFilter, setStationStatusFilter] = useState("all");
  const [editingStation, setEditingStation] = useState<any>(null);
  const [savingPricing, setSavingPricing] = useState(false);
  const [stationPricing, setStationPricing] = useState<Record<string, any>>({});
  const [applyToAll, setApplyToAll] = useState(false);

  // Pricing form state
  const [singleHalfHour, setSingleHalfHour] = useState("");
  const [singleFullHour, setSingleFullHour] = useState("");
  const [multiHalfHour, setMultiHalfHour] = useState("");
  const [multiFullHour, setMultiFullHour] = useState("");
  const [halfHour, setHalfHour] = useState("");
  const [fullHour, setFullHour] = useState("");

  // Controller pricing state (for PS5, Xbox)
  const [controller1HalfHour, setController1HalfHour] = useState("");
  const [controller1FullHour, setController1FullHour] = useState("");
  const [controller2HalfHour, setController2HalfHour] = useState("");
  const [controller2FullHour, setController2FullHour] = useState("");
  const [controller3HalfHour, setController3HalfHour] = useState("");
  const [controller3FullHour, setController3FullHour] = useState("");
  const [controller4HalfHour, setController4HalfHour] = useState("");
  const [controller4FullHour, setController4FullHour] = useState("");

  // Controller enable/disable state
  const [enabledControllers, setEnabledControllers] = useState<number[]>([1]); // At least 1 controller enabled

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

  // Initialize pricing form when station is selected
  useEffect(() => {
    if (editingStation) {
      const savedPricing = stationPricing[editingStation.name];
      const isGamingConsole = ['PS5', 'PS4', 'Xbox'].includes(editingStation.type);

      if (isGamingConsole) {
        setSingleHalfHour(String(savedPricing?.single_player_half_hour_rate || 75));
        setSingleFullHour(String(savedPricing?.single_player_rate || 150));
        setMultiHalfHour(String(savedPricing?.multi_player_half_hour_rate || 150));
        setMultiFullHour(String(savedPricing?.multi_player_rate || 300));

        // Initialize controller pricing (for PS5, Xbox)
        if (['PS5', 'Xbox'].includes(editingStation.type)) {
          setController1HalfHour(String(savedPricing?.controller_1_half_hour || 75));
          setController1FullHour(String(savedPricing?.controller_1_full_hour || 150));
          setController2HalfHour(String(savedPricing?.controller_2_half_hour || 120));
          setController2FullHour(String(savedPricing?.controller_2_full_hour || 240));
          setController3HalfHour(String(savedPricing?.controller_3_half_hour || 165));
          setController3FullHour(String(savedPricing?.controller_3_full_hour || 330));
          setController4HalfHour(String(savedPricing?.controller_4_half_hour || 210));
          setController4FullHour(String(savedPricing?.controller_4_full_hour || 420));

          // Determine which controllers are enabled based on saved pricing
          const enabled = [1]; // Controller 1 is always enabled
          if (savedPricing?.controller_2_half_hour || savedPricing?.controller_2_full_hour) enabled.push(2);
          if (savedPricing?.controller_3_half_hour || savedPricing?.controller_3_full_hour) enabled.push(3);
          if (savedPricing?.controller_4_half_hour || savedPricing?.controller_4_full_hour) enabled.push(4);
          setEnabledControllers(enabled);
        }
      } else {
        const defaults: Record<string, {half: number, full: number}> = {
          'PC': {half: 50, full: 100},
          'VR': {half: 100, full: 200},
          'Steering': {half: 75, full: 150},
          'Pool': {half: 40, full: 80},
          'Snooker': {half: 40, full: 80},
          'Arcade': {half: 40, full: 80},
        };
        const stationDefaults = defaults[editingStation.type] || {half: 40, full: 80};
        setHalfHour(String(savedPricing?.half_hour_rate || stationDefaults.half));
        setFullHour(String(savedPricing?.hourly_rate || stationDefaults.full));
      }
    }
  }, [editingStation, stationPricing]);

  // Auto-refresh time every second for active sessions (only when sessions tab is active)
  useEffect(() => {
    // Only run timer when viewing sessions or live-status tabs
    if (activeTab !== 'sessions' && activeTab !== 'live-status') return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [activeTab]);

  // Auto-refresh bookings data every 30 seconds to detect ended sessions
  // Real-time subscription handles most updates, this is just a fallback
  useEffect(() => {
    if (!allowed || !user) return;

    const refreshInterval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 30000); // Refresh every 30 seconds (reduced from 5)

    return () => clearInterval(refreshInterval);
  }, [allowed, user]);

  // Load data
  useEffect(() => {
    if (!allowed || !user) return;

    async function loadData() {
      try {
        // Only show loading indicator on initial load (when refreshTrigger is 0)
        if (refreshTrigger === 0) {
          setLoadingData(true);
        }
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
            phone,
            email,
            opening_hours,
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
            todayRevenue: 0,
            weekRevenue: 0,
            monthRevenue: 0,
            quarterRevenue: 0,
            totalRevenue: 0,
            totalBookings: 0,
            pendingBookings: 0,
          });
          return;
        }

        const cafeIds = ownerCafes.map((c) => c.id);

        // Fetch station pricing for all cafes
        const { data: stationPricingData, error: stationPricingError } = await supabase
          .from("station_pricing")
          .select("*")
          .in("cafe_id", cafeIds);

        if (!stationPricingError && stationPricingData) {
          const pricingMap: Record<string, any> = {};
          stationPricingData.forEach((pricing: any) => {
            pricingMap[pricing.station_name] = pricing;
          });
          setStationPricing(pricingMap);
        }

        // Fetch console pricing for all cafes
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("cafe_id, console_type, quantity, duration_minutes, price")
          .in("cafe_id", cafeIds);

        if (!pricingError && pricingData) {
          // Organize pricing by cafe_id -> console_type -> tier
          type PricingTier = {
            qty1_30min: number | null;
            qty1_60min: number | null;
            qty2_30min: number | null;
            qty2_60min: number | null;
            qty3_30min: number | null;
            qty3_60min: number | null;
            qty4_30min: number | null;
            qty4_60min: number | null;
          };
          const pricingMap: Record<string, Record<string, PricingTier>> = {};
          pricingData.forEach((item) => {
            if (!pricingMap[item.cafe_id]) {
              pricingMap[item.cafe_id] = {};
            }
            if (!pricingMap[item.cafe_id][item.console_type]) {
              pricingMap[item.cafe_id][item.console_type] = {
                qty1_30min: null,
                qty1_60min: null,
                qty2_30min: null,
                qty2_60min: null,
                qty3_30min: null,
                qty3_60min: null,
                qty4_30min: null,
                qty4_60min: null,
              };
            }
            const key = `qty${item.quantity}_${item.duration_minutes}min` as keyof PricingTier;
            pricingMap[item.cafe_id][item.console_type][key] = item.price;
          });
          setConsolePricing(pricingMap);
        }

        // Auto-complete ended bookings before fetching
        // This ensures old bookings don't stay in wrong status forever

        // 1. Update all past date bookings to completed (both in-progress and confirmed)
        const { error: pastBookingsError } = await supabase
          .from("bookings")
          .update({ status: "completed" })
          .in("cafe_id", cafeIds)
          .in("status", ["in-progress", "confirmed"])
          .lt("booking_date", todayStr);

        if (pastBookingsError) {
          console.error("Error updating past bookings:", pastBookingsError);
        }

        // 2. Fetch today's in-progress and confirmed bookings to check if they've ended
        const { data: todayBookings, error: fetchTodayError } = await supabase
          .from("bookings")
          .select("id, start_time, duration, status")
          .in("cafe_id", cafeIds)
          .eq("booking_date", todayStr)
          .in("status", ["in-progress", "confirmed"]);

        if (fetchTodayError) {
          console.error("Error fetching today's bookings:", fetchTodayError);
        }

        // 3. Complete today's bookings that have ended
        if (todayBookings && todayBookings.length > 0) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const endedBookingIds: string[] = [];

          todayBookings.forEach((booking) => {
            if (!booking.start_time || !booking.duration) return;

            // Parse start time
            const timeParts = booking.start_time.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
            if (!timeParts) return;

            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const period = timeParts[3]?.toLowerCase();

            // Convert to 24-hour format
            if (period) {
              if (period === 'pm' && hours !== 12) hours += 12;
              else if (period === 'am' && hours === 12) hours = 0;
            }

            // Calculate end time
            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + booking.duration;

            // Check if session has ended
            if (currentMinutes > endMinutes) {
              endedBookingIds.push(booking.id);
            }
          });

          // Batch update ended bookings
          if (endedBookingIds.length > 0) {
            const { error: updateEndedError } = await supabase
              .from("bookings")
              .update({ status: "completed" })
              .in("id", endedBookingIds);

            if (updateEndedError) {
              console.error("Error updating ended bookings:", updateEndedError);
            }
          }
        }

        // Fetch bookings with booking items
        const { data: bookingRows, error: bookingsError } = await supabase
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
            payment_mode,
            created_at,
            customer_name,
            customer_phone,
            booking_items (
              id,
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
              profiles.forEach((profile: { id: string; first_name: string | null; last_name: string | null; phone: string | null }) => {
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
        const enrichedBookings = ownerBookings.map((booking: BookingRow) => {
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
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);

        const bookingsToday = enrichedBookings.filter(
          (b) => b.booking_date === todayStr
        ).length;

        const pendingBookings = enrichedBookings.filter(
          (b) => b.status?.toLowerCase() === "pending"
        ).length;

        const recentRevenue = enrichedBookings
          .slice(0, 20)
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        const todayRevenue = enrichedBookings
          .filter((b) => b.booking_date === todayStr)
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        const weekRevenue = enrichedBookings
          .filter((b) => {
            const bookingDate = new Date(b.booking_date || "");
            return bookingDate >= startOfWeek;
          })
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        const monthRevenue = enrichedBookings
          .filter((b) => {
            const bookingDate = new Date(b.booking_date || "");
            return bookingDate >= startOfMonth;
          })
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        const quarterRevenue = enrichedBookings
          .filter((b) => {
            const bookingDate = new Date(b.booking_date || "");
            return bookingDate >= startOfQuarter;
          })
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        const totalRevenue = enrichedBookings
          .reduce((sum, b) => sum + (b.total_amount || 0), 0);

        setStats({
          cafesCount: ownerCafes.length,
          bookingsToday,
          recentBookings: Math.min(enrichedBookings.length, 20),
          recentRevenue,
          todayRevenue,
          weekRevenue,
          monthRevenue,
          quarterRevenue,
          totalRevenue,
          totalBookings: enrichedBookings.length,
          pendingBookings,
        });
      } catch (err) {
        console.error("[OwnerDashboard] loadData error:", err);
        setError((err instanceof Error ? err.message : String(err)) || "Could not load café owner dashboard.");
      } finally {
        // Only set loading to false if this was the initial load
        if (refreshTrigger === 0) {
          setLoadingData(false);
        }
      }
    }

    loadData();
  }, [allowed, user, refreshTrigger]);

  // Populate editedCafe when cafes data loads
  useEffect(() => {
    if (cafes.length > 0) {
      const cafe = cafes[0];
      // Parse opening_hours if it exists (format: "Mon-Sun: 10:00 AM - 11:00 PM")
      let openingTime = '09:00 AM';
      let closingTime = '11:00 PM';

      if (cafe.opening_hours) {
        const timeMatch = cafe.opening_hours.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
        if (timeMatch) {
          openingTime = timeMatch[1].trim();
          closingTime = timeMatch[2].trim();
        }
      }

      setEditedCafe({
        address: cafe.address || '',
        phone: cafe.phone || '',
        email: cafe.email || '',
        description: cafe.description || '',
        opening_time: openingTime,
        closing_time: closingTime,
      });
    }
  }, [cafes]);

  // Real-time subscription for bookings
  useEffect(() => {
    if (!allowed || !user || cafes.length === 0) return;

    const cafeIds = cafes.map((c) => c.id);

    // Subscribe to bookings table changes for owner's cafes
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'bookings',
          filter: `cafe_id=in.(${cafeIds.join(',')})`,
        },
        async (payload) => {
          console.log('[Real-time] Booking changed:', payload);

          // Handle different event types
          if (payload.eventType === 'DELETE') {
            // Remove deleted booking from state
            setBookings(prev => prev.filter(b => b.id !== payload.old.id));
          } else {
            // For INSERT and UPDATE, fetch only the changed booking
            try {
              const { data: bookingRow, error: bookingError } = await supabase
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
                  payment_mode,
                  created_at,
                  customer_name,
                  customer_phone,
                  booking_items (
                    id,
                    console,
                    quantity
                  )
                `)
                .eq("id", payload.new.id)
                .single();

              if (bookingError) {
                console.error('[Real-time] Error fetching booking:', bookingError);
                return;
              }

              // Fetch user profile if needed
              let userProfile = null;
              if (bookingRow.user_id) {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("id, first_name, last_name, phone")
                  .eq("id", bookingRow.user_id)
                  .single();

                if (profile) {
                  const fullName = [profile.first_name, profile.last_name]
                    .filter(Boolean)
                    .join(" ") || null;

                  userProfile = {
                    name: fullName,
                    email: null,
                    phone: profile.phone || null,
                  };
                }
              }

              // Enrich booking with user and cafe data
              const cafe = cafes.find((c) => c.id === bookingRow.cafe_id);
              const enrichedBooking: BookingRow = {
                ...bookingRow,
                user_name: userProfile?.name || (bookingRow.user_id ? `User ${bookingRow.user_id.slice(0, 8)}` : null),
                user_email: userProfile?.email || null,
                user_phone: userProfile?.phone || null,
                cafe_name: cafe?.name || null,
              };

              // Update or insert in bookings array
              setBookings(prev => {
                const index = prev.findIndex(b => b.id === enrichedBooking.id);
                if (index >= 0) {
                  // Update existing
                  const updated = [...prev];
                  updated[index] = enrichedBooking;
                  return updated;
                } else {
                  // Insert new at beginning
                  return [enrichedBooking, ...prev];
                }
              });
            } catch (err) {
              console.error('[Real-time] Error processing booking change:', err);
              return;
            }
          }

          // Recalculate stats from updated bookings state
          // Use timeout to ensure state has been updated
          setTimeout(() => {
            setBookings(currentBookings => {
              const now = new Date();
              const todayStr = now.toISOString().slice(0, 10);
              const startOfWeek = new Date(now);
              startOfWeek.setDate(now.getDate() - now.getDay());
              const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
              const currentQuarter = Math.floor(now.getMonth() / 3);
              const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);

              const bookingsToday = currentBookings.filter(
                (b) => b.booking_date === todayStr
              ).length;

              const pendingBookings = currentBookings.filter(
                (b) => b.status?.toLowerCase() === "pending"
              ).length;

              const recentRevenue = currentBookings
                .slice(0, 20)
                .reduce((sum, b) => sum + (b.total_amount || 0), 0);

              const todayRevenue = currentBookings
                .filter((b) => b.booking_date === todayStr)
                .reduce((sum, b) => sum + (b.total_amount || 0), 0);

              const weekRevenue = currentBookings
                .filter((b) => {
                  const bookingDate = new Date(b.booking_date || "");
                  return bookingDate >= startOfWeek;
                })
                .reduce((sum, b) => sum + (b.total_amount || 0), 0);

              const monthRevenue = currentBookings
                .filter((b) => {
                  const bookingDate = new Date(b.booking_date || "");
                  return bookingDate >= startOfMonth;
                })
                .reduce((sum, b) => sum + (b.total_amount || 0), 0);

              const quarterRevenue = currentBookings
                .filter((b) => {
                  const bookingDate = new Date(b.booking_date || "");
                  return bookingDate >= startOfQuarter;
                })
                .reduce((sum, b) => sum + (b.total_amount || 0), 0);

              const totalRevenue = currentBookings
                .reduce((sum, b) => sum + (b.total_amount || 0), 0);

              setStats({
                cafesCount: cafes.length,
                bookingsToday,
                recentBookings: Math.min(currentBookings.length, 20),
                recentRevenue,
                todayRevenue,
                weekRevenue,
                monthRevenue,
                quarterRevenue,
                totalRevenue,
                totalBookings: currentBookings.length,
                pendingBookings,
              });

              return currentBookings; // Return unchanged bookings
            });
          }, 100);
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [allowed, user, cafes]);

  // Handle confirm booking (pending -> confirmed)
  async function handleConfirmBooking(booking: BookingRow) {
    if (booking.status !== "pending") {
      alert("Only pending bookings can be confirmed");
      return;
    }

    const confirmed = confirm(`Confirm booking for ${booking.customer_name || "customer"}?`);
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" })
        .eq("id", booking.id);

      if (error) {
        console.error("Error confirming booking:", error);
        alert("Failed to confirm booking");
        return;
      }

      // Refresh bookings list
      setRefreshTrigger(prev => prev + 1);
      alert("Booking confirmed successfully!");
    } catch (err) {
      console.error("Error confirming booking:", err);
      alert("Failed to confirm booking");
    }
  }

  // Handle start booking (confirmed -> in-progress)
  async function handleStartBooking(booking: BookingRow) {
    if (booking.status !== "confirmed") {
      alert("Only confirmed bookings can be started");
      return;
    }

    const confirmed = confirm(`Start session for ${booking.customer_name || "customer"}?`);
    if (!confirmed) return;

    try {
      // Get current time in 12-hour format
      const currentTime = convertTo12Hour();

      console.log(`[Start Booking] Updating booking ${booking.id}:`);
      console.log(`  Original start time: ${booking.start_time}`);
      console.log(`  New start time: ${currentTime}`);
      console.log(`  Duration: ${booking.duration} minutes`);

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "in-progress",
          start_time: currentTime  // Update start time to actual start time
        })
        .eq("id", booking.id);

      if (error) {
        console.error("Error starting booking:", error);
        alert("Failed to start booking");
        return;
      }

      // Refresh bookings list
      setRefreshTrigger(prev => prev + 1);
      alert("Booking started successfully!");
    } catch (err) {
      console.error("Error starting booking:", err);
      alert("Failed to start booking");
    }
  }

  // Handle edit booking
  function handleEditBooking(booking: BookingRow) {
    // Allow editing all bookings, not just walk-ins
    setEditingBooking(booking);
    setEditAmount(booking.total_amount?.toString() || "");
    setEditStatus(booking.status || "confirmed");
    setEditDate(booking.booking_date || "");
    setEditDuration(booking.duration || 60);
    // Get console and controllers from booking_items
    const console = booking.booking_items?.[0]?.console || "";
    const controllers = booking.booking_items?.[0]?.quantity || 1;
    setEditConsole(console);
    setEditControllers(controllers);
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

      // Update booking_items with new console, controllers, and price
      if (editingBooking.booking_items && editingBooking.booking_items.length > 0) {
        const bookingItemId = editingBooking.booking_items[0].id;
        const { error: itemError } = await supabase
          .from("booking_items")
          .update({
            console: editConsole,
            quantity: editControllers,
            price: parseFloat(editAmount),
          })
          .eq("id", bookingItemId);

        if (itemError) throw itemError;
      }

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
                booking_items: b.booking_items?.map(item => ({
                  ...item,
                  console: editConsole,
                  quantity: editControllers
                }))
              }
            : b
        )
      );

      setEditingBooking(null);
      alert("Booking updated successfully!");
    } catch (err) {
      console.error("Error updating booking:", err);
      alert("Failed to update booking: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  }

  // Auto-calculate amount when duration, console, or controllers change in edit modal
  useEffect(() => {
    if (!editingBooking || !editDuration || !editConsole) return;

    const cafeId = editingBooking.cafe_id;
    if (!cafeId) return;

    const calculatePrice = () => {
      // Get tier pricing for this cafe and console
      const cafePricing = consolePricing[cafeId];
      const baseHourlyRate = cafes.find(c => c.id === cafeId)?.hourly_price || 100;

      // Try to get tier-based pricing
      if (cafePricing && cafePricing[editConsole]) {
        const tier = cafePricing[editConsole];

        if (editDuration === 30 || editDuration === 60) {
          const key = `qty${editControllers}_${editDuration}min`;
          const tierPrice = tier[key];

          if (tierPrice !== null && tierPrice !== undefined) {
            return tierPrice;
          }
        } else if (editDuration === 90) {
          // 90min = 60min + 30min
          const price60 = tier[`qty${editControllers}_60min`];
          const price30 = tier[`qty${editControllers}_30min`];
          if (price60 !== null && price30 !== null) {
            return price60 + price30;
          }
        }
      }

      // Fallback to calculation based on hourly rate
      const durationMultiplier = editDuration / 60;
      return Math.round(baseHourlyRate * editControllers * durationMultiplier);
    };

    const newAmount = calculatePrice();
    setEditAmount(newAmount.toString());
  }, [editDuration, editConsole, editControllers, editingBooking, cafes, consolePricing]);

  // Handle settings save
  const handleSaveSettings = async () => {
    if (cafes.length === 0) return;

    setSavingSettings(true);
    try {
      // Combine opening and closing time into opening_hours format
      const opening_hours = `Mon-Sun: ${editedCafe.opening_time} - ${editedCafe.closing_time}`;

      const { error } = await supabase
        .from("cafes")
        .update({
          address: editedCafe.address,
          phone: editedCafe.phone,
          email: editedCafe.email,
          description: editedCafe.description,
          opening_hours: opening_hours,
        })
        .eq("id", cafes[0].id);

      if (error) throw error;

      // Update local state
      setCafes(prev => prev.map((c, i) => i === 0 ? {
        ...c,
        address: editedCafe.address,
        phone: editedCafe.phone,
        email: editedCafe.email,
        description: editedCafe.description,
        opening_hours: opening_hours,
      } : c));

      setSettingsChanged(false);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle add new station
  const handleAddStation = async () => {
    if (cafes.length === 0 || newStationCount < 1) return;

    setAddingStation(true);
    try {
      const columnName = `${newStationType}_count`;
      const currentCount = (cafes[0] as any)[columnName] || 0;
      const newCount = currentCount + newStationCount;

      const { error } = await supabase
        .from("cafes")
        .update({ [columnName]: newCount })
        .eq("id", cafes[0].id);

      if (error) throw error;

      // Update local state
      setCafes(prev => prev.map((c, i) => i === 0 ? {
        ...c,
        [columnName]: newCount,
      } : c));

      setShowAddStationModal(false);
      alert(`Successfully added ${newStationCount} ${newStationType.toUpperCase()} station(s)!`);

      // Trigger a refresh to update the stations list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error adding station:', error);
      alert('Failed to add station. Please try again.');
    } finally {
      setAddingStation(false);
    }
  };

  // Handle toggle station power
  const handleTogglePower = (stationName: string) => {
    setPoweredOffStations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stationName)) {
        newSet.delete(stationName);
      } else {
        newSet.add(stationName);
      }
      return newSet;
    });
  };

  // Handle delete station
  const handleDeleteStation = async () => {
    if (!stationToDelete || cafes.length === 0) return;

    setDeletingStation(true);
    try {
      // Map station type to column name (e.g., "PS5" -> "ps5_count")
      const columnName = `${stationToDelete.type.toLowerCase().replace(/\s+/g, '_')}_count`;
      const currentCount = (cafes[0] as any)[columnName] || 0;

      if (currentCount <= 0) {
        alert('No stations to delete');
        setStationToDelete(null);
        return;
      }

      const newCount = currentCount - 1;

      const { error } = await supabase
        .from("cafes")
        .update({ [columnName]: newCount })
        .eq("id", cafes[0].id);

      if (error) throw error;

      // Update local state
      setCafes(prev => prev.map((c, i) => i === 0 ? {
        ...c,
        [columnName]: newCount,
      } : c));

      setStationToDelete(null);
      alert(`Successfully deleted ${stationToDelete.name}!`);

      // Trigger a refresh to update the stations list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error deleting station:', error);
      alert('Failed to delete station. Please try again.');
    } finally {
      setDeletingStation(false);
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter !== "all" && booking.status?.toLowerCase() !== statusFilter) {
      return false;
    }

    // Source filter
    if (sourceFilter !== "all") {
      const bookingSource = booking.source?.toLowerCase() || "";
      if (bookingSource !== sourceFilter) return false;
    }

    // Specific date filter (for date picker)
    if (dateFilter && booking.booking_date) {
      if (booking.booking_date !== dateFilter) return false;
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
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        if (bookingDate < weekAgo || bookingDate > todayEnd) return false;
      } else if (dateRangeFilter === "month") {
        const monthAgo = new Date(todayStart);
        monthAgo.setMonth(todayStart.getMonth() - 1);
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        if (bookingDate < monthAgo || bookingDate > todayEnd) return false;
      } else if (dateRangeFilter === "quarter") {
        const quarterAgo = new Date(todayStart);
        quarterAgo.setMonth(todayStart.getMonth() - 3);
        const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
        if (bookingDate < quarterAgo || bookingDate > todayEnd) return false;
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
          background: "#020617",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#f8fafc",
        }}
      >
        Loading...
      </div>
    );
  }

  if (!allowed) {
    return null;
  }

  // Dark theme colors
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
    activeNavBackground: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15))",
    activeNavText: "#3b82f6",
  };

  // Navigation items
  const navItems: { id: NavTab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '🏠' },
    { id: 'live-status', label: 'Live Status', icon: '📡' },
    { id: 'sessions', label: 'Bookings', icon: '📅' },
    { id: 'customers', label: 'Customers', icon: '👥' },
    { id: 'stations', label: 'Stations', icon: '🖥️' },
    { id: 'subscriptions', label: 'Tournament', icon: '🏆' },
    { id: 'memberships', label: 'Memberships', icon: '🎫' },
    { id: 'coupons', label: 'Coupons', icon: '🎟️' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

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
              <span style={{ color: "#ff073a" }}>BOOK</span>
              <span style={{ color: theme.textPrimary }}>MYGAME</span>
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
              Gaming Café Booking
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
                  marginBottom: 0,
                  fontWeight: 700,
                }}
              >
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'live-status' && 'Live Console Status'}
                {activeTab === 'sessions' && 'Bookings'}
                {activeTab === 'customers' && 'Customers'}
                {activeTab === 'stations' && 'Stations'}
                {activeTab === 'subscriptions' && 'Tournament'}
                {activeTab === 'memberships' && 'Memberships'}
                {activeTab === 'coupons' && 'Coupons'}
                {activeTab === 'reports' && 'Reports'}
                {activeTab === 'settings' && 'Settings'}
                {activeTab === 'overview' && 'Dashboard Overview'}
                {activeTab === 'bookings' && 'Manage Bookings'}
                {activeTab === 'cafe-details' && 'Café Details'}
                {activeTab === 'analytics' && 'Analytics & Reports'}
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary }}>
                    {user?.user_metadata?.name || user?.email?.split('@')[0] || 'Owner'}
                  </div>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>
                    Owner
                  </div>
                </div>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 600,
                    color: "#fff",
                  }}
                >
                  {(user?.user_metadata?.name || user?.email?.split('@')[0] || 'Owner')
                    .split(' ')
                    .map((word: string) => word[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <button
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    background: "transparent",
                    color: "#ef4444",
                    fontSize: 18,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Logout"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.auth.signOut();
                      if (error) {
                        console.error('Logout error:', error);
                      }
                      // Force a full page reload to clear all state
                      window.location.href = '/login';
                    } catch (err) {
                      console.error('Logout failed:', err);
                      // Still redirect even if logout fails
                      window.location.href = '/login';
                    }
                  }}
                >
                  🚪
                </button>
              </div>
            </div>
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

          {/* Dashboard Tab - New Design */}
          {activeTab === 'dashboard' && cafes.length > 0 && (
            <div>
              {/* Top Stats Cards */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: 20,
                  marginBottom: 32,
                }}
              >
                {/* Active Now Card */}
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 16,
                    background: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "rgba(239, 68, 68, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                    }}
                  >
                    ▶️
                  </div>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <p
                      style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: theme.textPrimary,
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      {loadingData ? "..." : bookings.filter(b => b.status === 'in-progress' && b.booking_date === new Date().toISOString().split('T')[0]).length}
                    </p>
                    <p
                      style={{
                        fontSize: 18,
                        color: theme.textSecondary,
                        marginTop: 10,
                        marginBottom: 0,
                        fontWeight: 600,
                      }}
                    >
                      Active Now
                    </p>
                  </div>
                </div>

                {/* Today's Revenue Card */}
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 16,
                    background: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "rgba(34, 197, 94, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                    }}
                  >
                    ₹
                  </div>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <p
                      style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: theme.textPrimary,
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      ₹{loadingData ? "..." : stats?.todayRevenue ?? 0}
                    </p>
                    <p
                      style={{
                        fontSize: 18,
                        color: theme.textSecondary,
                        marginTop: 10,
                        marginBottom: 0,
                        fontWeight: 600,
                      }}
                    >
                      Today's Revenue
                    </p>
                    <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                        <span style={{ color: theme.textSecondary, fontWeight: 500 }}>Sessions</span>
                        <span style={{ color: theme.textPrimary, fontWeight: 600 }}>₹{loadingData ? "0" : stats?.todayRevenue ?? 0}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                        <span style={{ color: theme.textSecondary, fontWeight: 500 }}>Tournament</span>
                        <span style={{ color: theme.textPrimary, fontWeight: 600 }}>₹0</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}>
                        <span style={{ color: theme.textSecondary, fontWeight: 500 }}>Memberships</span>
                        <span style={{ color: theme.textPrimary, fontWeight: 600 }}>₹0</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Sessions Card */}
                <div
                  style={{
                    padding: "24px",
                    borderRadius: 16,
                    background: theme.cardBackground,
                    border: `1px solid ${theme.border}`,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: "rgba(249, 115, 22, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 24,
                    }}
                  >
                    🕐
                  </div>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <p
                      style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: theme.textPrimary,
                        margin: 0,
                        lineHeight: 1,
                      }}
                    >
                      {loadingData ? "..." : stats?.bookingsToday ?? 0}
                    </p>
                    <p
                      style={{
                        fontSize: 18,
                        color: theme.textSecondary,
                        marginTop: 10,
                        marginBottom: 0,
                        fontWeight: 600,
                      }}
                    >
                      Today's Sessions
                    </p>
                  </div>
                </div>
              </div>

              {/* Active Consoles Section - Only show occupied consoles */}
              <div style={{ marginTop: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: theme.textPrimary,
                      margin: 0,
                    }}
                  >
                    Active Sessions
                  </h2>
                </div>

                {/* Show only in-progress bookings */}
                {(() => {
                  const activeBookings = bookings.filter(
                    b => b.status === 'in-progress' && b.booking_date === new Date().toISOString().split('T')[0]
                  );

                  if (activeBookings.length === 0) {
                    return (
                      <div
                        style={{
                          padding: "60px 20px",
                          textAlign: "center",
                          background: theme.cardBackground,
                          borderRadius: 16,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🎮</div>
                        <p style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 6, fontWeight: 500 }}>
                          No active sessions
                        </p>
                        <p style={{ fontSize: 14, color: theme.textMuted }}>
                          Sessions in progress will appear here
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                        gap: 20,
                      }}
                    >
                      {activeBookings.map((booking, index) => {
                        const consoleInfo = booking.booking_items?.[0];
                        const isWalkIn = booking.source === 'walk-in';
                        const customerName = isWalkIn ? booking.customer_name : booking.user_name || booking.user_email;

                        // Calculate time remaining using currentTime state for auto-refresh
                        const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

                        let timeRemaining = 0;
                        let endTime = '';
                        if (booking.start_time && booking.duration) {
                          const timeParts = booking.start_time.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
                          if (timeParts) {
                            let hours = parseInt(timeParts[1]);
                            const minutes = parseInt(timeParts[2]);
                            const period = timeParts[3];

                            if (period) {
                              if (period.toLowerCase() === 'pm' && hours !== 12) hours += 12;
                              else if (period.toLowerCase() === 'am' && hours === 12) hours = 0;
                            }

                            const startMinutes = hours * 60 + minutes;
                            const endMinutes = startMinutes + booking.duration;
                            timeRemaining = Math.max(0, endMinutes - currentMinutes);

                            // Calculate end time
                            const endHours = Math.floor(endMinutes / 60) % 24;
                            const endMins = endMinutes % 60;
                            const endPeriod = endHours >= 12 ? 'pm' : 'am';
                            const endHours12 = endHours === 0 ? 12 : endHours > 12 ? endHours - 12 : endHours;
                            endTime = `${endHours12}:${endMins.toString().padStart(2, '0')} ${endPeriod}`;
                          }
                        }

                        // Generate station name based on console type and index
                        // Group bookings by console type to get proper numbering
                        const consoleType = consoleInfo?.console?.toUpperCase() || 'UNKNOWN';
                        const sameTypeBookings = activeBookings.filter(
                          (b, i) => i <= index && b.booking_items?.[0]?.console === consoleInfo?.console
                        );
                        const stationNumber = sameTypeBookings.length;
                        const stationName = `${consoleType}-${String(stationNumber).padStart(2, '0')}`;

                        return (
                          <div
                            key={booking.id}
                            style={{
                              padding: "24px",
                              borderRadius: 16,
                              background: "rgba(15,23,42,0.6)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            {/* Header with Console Icon and Number */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ fontSize: 32 }}>🎮</div>
                                <div>
                                  <div style={{ fontSize: 20, fontWeight: 700, color: theme.textPrimary }}>
                                    {stationName}
                                  </div>
                                  <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>
                                    {consoleType}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Customer Name */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                              <span style={{ fontSize: 18 }}>👤</span>
                              <span style={{ fontSize: 16, color: theme.textPrimary, fontWeight: 500 }}>
                                {customerName || 'Unknown Customer'}
                              </span>
                            </div>

                            {/* Ends At */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                              <span style={{ fontSize: 18 }}>🕐</span>
                              <span style={{ fontSize: 14, color: theme.textMuted }}>
                                Ends at {endTime}
                              </span>
                            </div>

                            {/* Time Remaining Badge */}
                            <div
                              style={{
                                padding: "16px",
                                borderRadius: 12,
                                background: "rgba(120, 40, 40, 0.4)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 24 }}>⏱️</span>
                                <span style={{ fontSize: 20, fontWeight: 700, color: "#ef4444" }}>
                                  {timeRemaining} min left
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Today's Bookings Section */}
              <div style={{ marginTop: 40 }}>
                <div
                  style={{
                    marginBottom: 20,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: theme.textPrimary,
                      margin: 0,
                    }}
                  >
                    Today's Bookings
                  </h2>
                </div>

                {(() => {
                  const today = new Date().toISOString().split('T')[0];
                  const todaysBookings = bookings.filter(b => b.booking_date === today);
                  const totalAmount = todaysBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0);

                  if (todaysBookings.length === 0) {
                    return (
                      <div
                        style={{
                          padding: "60px 20px",
                          textAlign: "center",
                          background: theme.cardBackground,
                          borderRadius: 16,
                          border: `1px solid ${theme.border}`,
                        }}
                      >
                        <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📅</div>
                        <p style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 6, fontWeight: 500 }}>
                          No bookings today
                        </p>
                        <p style={{ fontSize: 14, color: theme.textMuted }}>
                          Today's bookings will appear here
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div
                      style={{
                        background: theme.cardBackground,
                        borderRadius: 16,
                        border: `1px solid ${theme.border}`,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Table Header */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '150px 120px 110px 90px 100px 100px 100px 100px 110px 110px 110px 90px',
                          gap: 12,
                          padding: '16px 24px',
                          background: theme.hoverBackground,
                          borderBottom: `1px solid ${theme.border}`,
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Customer
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Phone
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Console
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Controllers
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Start Time
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          End Time
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Duration
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Status
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Source
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Payment
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>
                          Amount
                        </div>
                      </div>

                      {/* Table Body */}
                      {todaysBookings.map((booking, index) => {
                        const isWalkIn = booking.source === 'walk-in';
                        const customerName = isWalkIn ? booking.customer_name : booking.user_name || booking.user_email || 'Unknown';
                        const customerPhone = isWalkIn ? booking.customer_phone : booking.user_phone || 'N/A';
                        const consoleInfo = booking.booking_items?.[0];
                        const consoleName = consoleInfo?.console?.toUpperCase() || 'N/A';

                        const paymentMode = booking.payment_mode || 'cash';
                        const getPaymentIcon = (mode: string) => {
                          switch(mode) {
                            case 'cash': return '💵';
                            case 'card': return '💳';
                            case 'upi': return '📱';
                            case 'online': return '🌐';
                            default: return '💵';
                          }
                        };

                        // Calculate end time
                        const calculateEndTime = (startTime: string | null, duration: number | null) => {
                          if (!startTime || !duration) return 'N/A';
                          const [hours, minutesPart] = startTime.split(':');
                          const minutes = parseInt(minutesPart.split(' ')[0]);
                          const isPM = startTime.includes('pm');
                          let hour24 = parseInt(hours);
                          if (isPM && hour24 !== 12) hour24 += 12;
                          if (!isPM && hour24 === 12) hour24 = 0;

                          const totalMinutes = (hour24 * 60 + minutes + duration) % (24 * 60);
                          const endHour24 = Math.floor(totalMinutes / 60);
                          const endMin = totalMinutes % 60;
                          const endHour12 = endHour24 % 12 || 12;
                          const endAmPm = endHour24 >= 12 ? 'pm' : 'am';
                          return `${endHour12}:${endMin.toString().padStart(2, '0')} ${endAmPm}`;
                        };

                        const endTime = calculateEndTime(booking.start_time, booking.duration ?? null);

                        return (
                          <div
                            key={booking.id}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '150px 120px 110px 90px 100px 100px 100px 100px 110px 110px 110px 90px',
                              gap: 12,
                              padding: '18px 24px',
                              borderBottom: index < todaysBookings.length - 1 ? `1px solid ${theme.border}` : 'none',
                              transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = theme.hoverBackground}
                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            {/* Customer */}
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.textPrimary, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {customerName}
                            </div>

                            {/* Phone */}
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: theme.textSecondary }}>
                              {customerPhone}
                            </div>

                            {/* Console */}
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.textSecondary }}>
                              {consoleName}
                            </div>

                            {/* Controllers */}
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: theme.textSecondary }}>
                              {(() => {
                                const items = booking.booking_items || [];
                                if (items.length === 0) return '-';
                                const totalControllers = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                                return totalControllers;
                              })()}
                            </div>

                            {/* Start Time */}
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.textSecondary }}>
                              {booking.start_time || 'N/A'}
                            </div>

                            {/* End Time */}
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.textSecondary }}>
                              {endTime}
                            </div>

                            {/* Duration */}
                            <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.textSecondary }}>
                              {booking.duration ? `${booking.duration}m` : 'N/A'}
                            </div>

                            {/* Status */}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                background:
                                  booking.status === 'confirmed' ? 'rgba(34, 197, 94, 0.1)' :
                                  booking.status === 'in-progress' ? 'rgba(59, 130, 246, 0.1)' :
                                  booking.status === 'completed' ? 'rgba(107, 114, 128, 0.1)' :
                                  'rgba(239, 68, 68, 0.1)',
                                color:
                                  booking.status === 'confirmed' ? '#22c55e' :
                                  booking.status === 'in-progress' ? '#3b82f6' :
                                  booking.status === 'completed' ? '#6b7280' :
                                  '#ef4444',
                              }}>
                                {booking.status || 'Unknown'}
                              </span>
                            </div>

                            {/* Source */}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                background: booking.source === 'walk-in' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                color: booking.source === 'walk-in' ? '#ef4444' : '#3b82f6',
                              }}>
                                {booking.source === 'walk-in' ? 'Walk-in' : 'Online'}
                              </span>
                            </div>

                            {/* Payment Mode */}
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 600,
                                background: 'rgba(168, 85, 247, 0.1)',
                                color: '#a855f7',
                                textTransform: 'capitalize',
                              }}>
                                {getPaymentIcon(paymentMode)} {paymentMode}
                              </span>
                            </div>

                            {/* Amount */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 15, fontWeight: 600, color: theme.textPrimary }}>
                              ₹{booking.total_amount || 0}
                            </div>
                          </div>
                        );
                      })}

                      {/* Total Row */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '150px 120px 110px 100px 100px 100px 100px 110px 110px 110px 90px',
                          gap: 12,
                          padding: '18px 24px',
                          background: theme.hoverBackground,
                          borderTop: `2px solid ${theme.border}`,
                        }}
                      >
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, fontWeight: 700, color: theme.textPrimary }}>
                          Total ({todaysBookings.length})
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: 18, fontWeight: 700, color: '#22c55e' }}>
                          ₹{totalAmount}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
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
              </div>

              {/* Revenue Overview with Filters */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  padding: "24px",
                  marginBottom: 24,
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 12,
                }}>
                  <h2
                    style={{
                      fontSize: 18,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>💰</span> Revenue Overview
                  </h2>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {[
                      { value: "today", label: "Today" },
                      { value: "week", label: "This Week" },
                      { value: "month", label: "This Month" },
                      { value: "quarter", label: "This Quarter" },
                      { value: "all", label: "All Time" },
                    ].map((filter) => (
                      <button
                        key={filter.value}
                        onClick={() => setRevenueFilter(filter.value)}
                        style={{
                          padding: "8px 16px",
                          borderRadius: 8,
                          border: `1px solid ${
                            revenueFilter === filter.value ? "#10b981" : theme.border
                          }`,
                          background:
                            revenueFilter === filter.value
                              ? "rgba(16, 185, 129, 0.15)"
                              : "rgba(15,23,42,0.4)",
                          color: revenueFilter === filter.value ? "#10b981" : "#94a3b8",
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (revenueFilter !== filter.value) {
                            e.currentTarget.style.borderColor = "#10b98180";
                            e.currentTarget.style.background = "rgba(16, 185, 129, 0.08)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (revenueFilter !== filter.value) {
                            e.currentTarget.style.borderColor = theme.border;
                            e.currentTarget.style.background = "rgba(15,23,42,0.4)";
                          }
                        }}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      padding: "20px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))",
                      border: "1px solid rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    <p style={{ fontSize: 12, color: "#10b981", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                      Total Revenue
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: "#10b981", fontFamily: fonts.heading }}>
                      ₹{loadingData ? "..." : (() => {
                        const todayStr = new Date().toISOString().split('T')[0];

                        if (revenueFilter === "today") {
                          return bookings
                            .filter(b => b.booking_date === todayStr)
                            .reduce((sum, b) => sum + (b.total_amount || 0), 0);
                        } else if (revenueFilter === "week") {
                          const now = new Date();
                          const startOfWeek = new Date(now);
                          startOfWeek.setDate(now.getDate() - now.getDay());
                          return bookings
                            .filter(b => new Date(b.booking_date || "") >= startOfWeek)
                            .reduce((sum, b) => sum + (b.total_amount || 0), 0);
                        } else if (revenueFilter === "month") {
                          const now = new Date();
                          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                          return bookings
                            .filter(b => new Date(b.booking_date || "") >= startOfMonth)
                            .reduce((sum, b) => sum + (b.total_amount || 0), 0);
                        } else if (revenueFilter === "quarter") {
                          const now = new Date();
                          const currentQuarter = Math.floor(now.getMonth() / 3);
                          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
                          return bookings
                            .filter(b => new Date(b.booking_date || "") >= startOfQuarter)
                            .reduce((sum, b) => sum + (b.total_amount || 0), 0);
                        } else {
                          return bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
                        }
                      })()}
                    </p>
                    <p style={{ fontSize: 12, color: "#10b98180", marginTop: 8 }}>
                      {revenueFilter === "today" ? "Today's earnings" :
                       revenueFilter === "week" ? "This week's earnings" :
                       revenueFilter === "month" ? "This month's earnings" :
                       revenueFilter === "quarter" ? "This quarter's earnings" :
                       "All time earnings"}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "20px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.1))",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                    }}
                  >
                    <p style={{ fontSize: 12, color: "#3b82f6", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                      Bookings
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: "#3b82f6", fontFamily: fonts.heading }}>
                      {loadingData ? "..." : (() => {
                        const todayStr = new Date().toISOString().split('T')[0];

                        if (revenueFilter === "today") {
                          return bookings.filter(b => b.booking_date === todayStr).length;
                        } else if (revenueFilter === "week") {
                          const now = new Date();
                          const startOfWeek = new Date(now);
                          startOfWeek.setDate(now.getDate() - now.getDay());
                          return bookings.filter(b => new Date(b.booking_date || "") >= startOfWeek).length;
                        } else if (revenueFilter === "month") {
                          const now = new Date();
                          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                          return bookings.filter(b => new Date(b.booking_date || "") >= startOfMonth).length;
                        } else if (revenueFilter === "quarter") {
                          const now = new Date();
                          const currentQuarter = Math.floor(now.getMonth() / 3);
                          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
                          return bookings.filter(b => new Date(b.booking_date || "") >= startOfQuarter).length;
                        } else {
                          return bookings.length;
                        }
                      })()}
                    </p>
                    <p style={{ fontSize: 12, color: "#3b82f680", marginTop: 8 }}>
                      {revenueFilter === "today" ? "Today's bookings" :
                       revenueFilter === "week" ? "This week's bookings" :
                       revenueFilter === "month" ? "This month's bookings" :
                       revenueFilter === "quarter" ? "This quarter's bookings" :
                       "All time bookings"}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: "20px",
                      borderRadius: 12,
                      background: "linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(234, 88, 12, 0.1))",
                      border: "1px solid rgba(249, 115, 22, 0.3)",
                    }}
                  >
                    <p style={{ fontSize: 12, color: "#f97316", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                      Avg per Booking
                    </p>
                    <p style={{ fontSize: 32, fontWeight: 700, color: "#f97316", fontFamily: fonts.heading }}>
                      ₹{loadingData ? "..." : (() => {
                        const todayStr = new Date().toISOString().split('T')[0];
                        let revenue = 0;
                        let count = 0;

                        if (revenueFilter === "today") {
                          const todayBookings = bookings.filter(b => b.booking_date === todayStr);
                          revenue = todayBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
                          count = todayBookings.length;
                        } else if (revenueFilter === "week") {
                          const now = new Date();
                          const startOfWeek = new Date(now);
                          startOfWeek.setDate(now.getDate() - now.getDay());
                          const weekBookings = bookings.filter(b => new Date(b.booking_date || "") >= startOfWeek);
                          revenue = weekBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
                          count = weekBookings.length;
                        } else if (revenueFilter === "month") {
                          const now = new Date();
                          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                          const monthBookings = bookings.filter(b => new Date(b.booking_date || "") >= startOfMonth);
                          revenue = monthBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
                          count = monthBookings.length;
                        } else if (revenueFilter === "quarter") {
                          const now = new Date();
                          const currentQuarter = Math.floor(now.getMonth() / 3);
                          const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
                          const quarterBookings = bookings.filter(b => new Date(b.booking_date || "") >= startOfQuarter);
                          revenue = quarterBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
                          count = quarterBookings.length;
                        } else {
                          revenue = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
                          count = bookings.length;
                        }

                        return count > 0 ? Math.round(revenue / count) : 0;
                      })()}
                    </p>
                    <p style={{ fontSize: 12, color: "#f9731680", marginTop: 8 }}>
                      Average revenue per booking
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Earnings - Last 30 Days */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
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
                  <span>📊</span>
                  Daily Earnings - Last 30 Days
                </h2>

                <div
                  style={{
                    overflowX: "auto",
                    maxHeight: "500px",
                    overflowY: "auto",
                  }}
                >
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "rgba(15,23,42,0.95)",
                        zIndex: 1,
                      }}
                    >
                      <tr>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "12px 16px",
                            borderBottom: `1px solid ${theme.border}`,
                            fontSize: 13,
                            color: "#94a3b8",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "12px 16px",
                            borderBottom: `1px solid ${theme.border}`,
                            fontSize: 13,
                            color: "#94a3b8",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Bookings
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "12px 16px",
                            borderBottom: `1px solid ${theme.border}`,
                            fontSize: 13,
                            color: "#94a3b8",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Revenue
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "12px 16px",
                            borderBottom: `1px solid ${theme.border}`,
                            fontSize: 13,
                            color: "#94a3b8",
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                          }}
                        >
                          Avg/Booking
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        // Generate last 30 days
                        const last30Days = [];
                        const today = new Date();
                        for (let i = 0; i < 30; i++) {
                          const date = new Date(today);
                          date.setDate(today.getDate() - i);
                          const dateStr = date.toISOString().split('T')[0];

                          // Calculate bookings and revenue for this date
                          const dayBookings = bookings.filter(b => b.booking_date === dateStr);
                          const dayRevenue = dayBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
                          const avgRevenue = dayBookings.length > 0 ? Math.round(dayRevenue / dayBookings.length) : 0;

                          // Format date nicely
                          const isToday = i === 0;
                          const isYesterday = i === 1;
                          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                          const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

                          let dateLabel = formattedDate;
                          if (isToday) dateLabel = `Today (${formattedDate})`;
                          if (isYesterday) dateLabel = `Yesterday (${formattedDate})`;

                          last30Days.push({
                            date: dateStr,
                            dateLabel,
                            dayName,
                            bookingsCount: dayBookings.length,
                            revenue: dayRevenue,
                            avgRevenue,
                            isToday,
                            isYesterday,
                          });
                        }

                        return last30Days.map((day, idx) => (
                          <tr
                            key={day.date}
                            style={{
                              borderBottom: `1px solid ${theme.border}40`,
                              background: day.isToday ? "rgba(16, 185, 129, 0.05)" : "transparent",
                              transition: "background 0.2s ease",
                            }}
                            onMouseEnter={(e) => {
                              if (!day.isToday) {
                                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!day.isToday) {
                                e.currentTarget.style.background = "transparent";
                              }
                            }}
                          >
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 14,
                                color: day.isToday ? "#10b981" : "#e2e8f0",
                                fontWeight: day.isToday ? 600 : 400,
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{
                                  fontSize: 11,
                                  color: "#64748b",
                                  minWidth: 30,
                                  textAlign: "center",
                                  background: "rgba(255,255,255,0.05)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                }}>
                                  {day.dayName}
                                </span>
                                {day.dateLabel}
                              </div>
                            </td>
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 14,
                                color: day.bookingsCount > 0 ? "#3b82f6" : "#64748b",
                                textAlign: "right",
                                fontWeight: day.bookingsCount > 0 ? 600 : 400,
                              }}
                            >
                              {day.bookingsCount > 0 ? day.bookingsCount : "-"}
                            </td>
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 14,
                                color: day.revenue > 0 ? "#10b981" : "#64748b",
                                textAlign: "right",
                                fontWeight: day.revenue > 0 ? 600 : 400,
                              }}
                            >
                              {day.revenue > 0 ? `₹${day.revenue}` : "-"}
                            </td>
                            <td
                              style={{
                                padding: "14px 16px",
                                fontSize: 14,
                                color: day.avgRevenue > 0 ? "#f97316" : "#64748b",
                                textAlign: "right",
                              }}
                            >
                              {day.avgRevenue > 0 ? `₹${day.avgRevenue}` : "-"}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div
                  style={{
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: `1px solid ${theme.border}`,
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: 16,
                  }}
                >
                  <div>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                      Total (30 Days)
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#10b981" }}>
                      ₹{(() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return bookings
                          .filter(b => new Date(b.booking_date || "") >= thirtyDaysAgo)
                          .reduce((sum, b) => sum + (b.total_amount || 0), 0);
                      })()}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                      Total Bookings
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>
                      {(() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        return bookings.filter(b => new Date(b.booking_date || "") >= thirtyDaysAgo).length;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                      Daily Average
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#f97316" }}>
                      ₹{(() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const total = bookings
                          .filter(b => new Date(b.booking_date || "") >= thirtyDaysAgo)
                          .reduce((sum, b) => sum + (b.total_amount || 0), 0);
                        return Math.round(total / 30);
                      })()}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "#64748b", marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>
                      Peak Day
                    </p>
                    <p style={{ fontSize: 20, fontWeight: 700, color: "#a855f7" }}>
                      ₹{(() => {
                        const thirtyDaysAgo = new Date();
                        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                        const recentBookings = bookings.filter(b => new Date(b.booking_date || "") >= thirtyDaysAgo);

                        // Group by date
                        const dailyRevenue: Record<string, number> = {};
                        recentBookings.forEach(b => {
                          const date = b.booking_date || "";
                          dailyRevenue[date] = (dailyRevenue[date] || 0) + (b.total_amount || 0);
                        });

                        // Find max
                        const maxRevenue = Math.max(...Object.values(dailyRevenue), 0);
                        return maxRevenue;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
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
                      color: theme.textMuted,
                    }}
                  >
                    No bookings yet
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                          <th style={{ padding: "12px", textAlign: "left", color: theme.textMuted, fontWeight: 600 }}>Customer</th>
                          <th style={{ padding: "12px", textAlign: "left", color: theme.textMuted, fontWeight: 600 }}>Café</th>
                          <th style={{ padding: "12px", textAlign: "left", color: theme.textMuted, fontWeight: 600 }}>Date</th>
                          <th style={{ padding: "12px", textAlign: "left", color: theme.textMuted, fontWeight: 600 }}>Status</th>
                          <th style={{ padding: "12px", textAlign: "right", color: theme.textMuted, fontWeight: 600 }}>Amount</th>
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
                            <td style={{ padding: "12px", color: theme.textSecondary }}>{booking.cafe_name || "-"}</td>
                            <td style={{ padding: "12px", color: theme.textSecondary }}>
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
                      border: `1px solid ${theme.border}`,
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

          {/* Live Status Tab */}
          {activeTab === 'live-status' && cafes.length > 0 && (
            <ConsoleStatusDashboard cafeId={cafes[0].id} />
          )}

          {activeTab === 'live-status' && cafes.length === 0 && (
            <div style={{
              padding: "60px 20px",
              textAlign: "center",
              background: theme.cardBackground,
              borderRadius: 16,
              border: `1px solid ${theme.border}`,
            }}>
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏪</div>
              <h3 style={{
                fontFamily: fonts.heading,
                fontSize: "20px",
                color: theme.textPrimary,
                marginBottom: "8px"
              }}>
                No Café Found
              </h3>
              <p style={{ fontSize: "14px", color: theme.textSecondary, marginBottom: "24px" }}>
                Please add a café first to view live console status
              </p>
              <button
                onClick={() => setActiveTab('cafe-details')}
                style={{
                  padding: "12px 24px",
                  background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: fonts.body,
                }}
              >
                Add Café →
              </button>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div>
              {/* Filters */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  padding: "20px",
                  marginBottom: 24,
                }}
              >
                {/* Date Range Quick Filters */}
                <div style={{ marginBottom: 20 }}>
                  <label
                    style={{
                      fontSize: 12,
                      color: theme.textMuted,
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
                          border: `1px solid ${dateRangeFilter === range.value ? "#3b82f6" : theme.border}`,
                          background: dateRangeFilter === range.value ? "rgba(59, 130, 246, 0.15)" : "rgba(30,41,59,0.5)",
                          color: dateRangeFilter === range.value ? "#3b82f6" : theme.textSecondary,
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
                      <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8 }}>
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
                          border: `1px solid ${theme.border}`,
                          background: "rgba(30,41,59,0.5)",
                          color: theme.textPrimary,
                          fontSize: 14,
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8 }}>
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
                          border: `1px solid ${theme.border}`,
                          background: "rgba(30,41,59,0.5)",
                          color: theme.textPrimary,
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
                        color: theme.textMuted,
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
                        border: `1px solid ${theme.border}`,
                        background: "rgba(30,41,59,0.5)",
                        color: theme.textPrimary,
                        fontSize: 14,
                      }}
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
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
                        border: `1px solid ${theme.border}`,
                        background: "rgba(30,41,59,0.5)",
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
                  </div>

                  {/* Source Filter */}
                  <div>
                    <label
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
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
                        border: `1px solid ${theme.border}`,
                        background: "rgba(30,41,59,0.5)",
                        color: theme.textPrimary,
                        fontSize: 14,
                        cursor: "pointer",
                      }}
                    >
                      <option value="all">All Sources</option>
                      <option value="online">Online</option>
                      <option value="walk-in">Walk-in</option>
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
                    border: `1px solid ${theme.border}`,
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
                <div style={{ marginBottom: 16, fontSize: 13, color: theme.textMuted }}>
                  📊 Showing {filteredBookings.length} of {bookings.length} bookings
                </div>
              )}

              {/* Results Count */}
              <div
                style={{
                  marginBottom: 16,
                  fontSize: 14,
                  color: theme.textMuted,
                }}
              >
                Showing {filteredBookings.length} of {bookings.length} bookings
              </div>

              {/* Bookings Table */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  overflow: "hidden",
                }}
              >
                {filteredBookings.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "60px 20px",
                      color: theme.textMuted,
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
                            borderBottom: `1px solid ${theme.border}`,
                          }}
                        >
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Booking ID
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Customer Name
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Phone Number
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Console
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Controllers
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Duration
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Source
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Payment
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "left", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Status
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "right", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Amount
                          </th>
                          <th style={{ padding: "14px 16px", textAlign: "center", color: theme.textMuted, fontSize: 11, textTransform: "uppercase", fontWeight: 600 }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((booking, index) => {
                          const source = booking.source?.toLowerCase() === "walk-in" ? "Walk-in" : "Online";
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
                                <div style={{ fontFamily: "monospace", fontSize: 12, color: theme.textPrimary, fontWeight: 600 }}>
                                  #{booking.id.slice(0, 8).toUpperCase()}
                                </div>
                              </td>

                              {/* Customer Name */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 600 }}>
                                  {booking.customer_name || booking.user_name || "Guest"}
                                </div>
                              </td>

                              {/* Phone Number */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontSize: 13, color: theme.textSecondary }}>
                                  {booking.customer_phone || booking.user_phone || "-"}
                                </div>
                              </td>

                              {/* Console */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 500 }}>
                                  {(() => {
                                    const items = booking.booking_items || [];
                                    if (items.length === 0) return "-";

                                    const consoles = items.map((item) => {
                                      const consoleName = item.console || "Unknown";
                                      return consoleName;
                                    });

                                    return consoles.join(", ");
                                  })()}
                                </div>
                              </td>

                              {/* Controllers */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 500 }}>
                                  {(() => {
                                    const items = booking.booking_items || [];
                                    if (items.length === 0) return "-";

                                    const totalControllers = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                                    return totalControllers;
                                  })()}
                                </div>
                              </td>

                              {/* Duration */}
                              <td style={{ padding: "14px 16px" }}>
                                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                  <div style={{ fontSize: 12, color: theme.textSecondary }}>
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
                                  <div style={{ fontSize: 13, color: theme.textPrimary, fontWeight: 600 }}>
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

                              {/* Payment Mode */}
                              <td style={{ padding: "14px 16px" }}>
                                {(() => {
                                  const paymentMode = booking.payment_mode || 'cash';
                                  const getPaymentIcon = (mode: string) => {
                                    switch(mode) {
                                      case 'cash': return '💵';
                                      case 'upi': return '📱';
                                      default: return '💵';
                                    }
                                  };
                                  return (
                                    <span
                                      style={{
                                        padding: "4px 10px",
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 500,
                                        background: "rgba(168, 85, 247, 0.1)",
                                        color: "#a855f7",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        textTransform: "capitalize",
                                      }}
                                    >
                                      {getPaymentIcon(paymentMode)} {paymentMode}
                                    </span>
                                  );
                                })()}
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
                                <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                                  {(() => {
                                    const status = booking.status || "pending";

                                    // Check if booking has ended (past booking)
                                    const isBookingEnded = (() => {
                                      try {
                                        const bookingDate = booking.booking_date || "";
                                        const startTime = booking.start_time || "";
                                        const duration = booking.duration || 60;

                                        if (!bookingDate || !startTime) return false;

                                        const now = new Date();
                                        const todayStr = now.toISOString().split('T')[0];

                                        // If booking is on a past date, it's definitely ended
                                        if (bookingDate < todayStr) return true;

                                        // If booking is on a future date, it hasn't ended
                                        if (bookingDate > todayStr) return false;

                                        // Booking is today - check the time
                                        // Parse start time
                                        const timeParts = startTime.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
                                        if (!timeParts) return false;

                                        let hours = parseInt(timeParts[1]);
                                        const minutes = parseInt(timeParts[2]);
                                        const period = timeParts[3]?.toLowerCase();

                                        // Convert to 24-hour format if period exists
                                        if (period) {
                                          if (period === 'pm' && hours !== 12) {
                                            hours += 12;
                                          } else if (period === 'am' && hours === 12) {
                                            hours = 0;
                                          }
                                        }

                                        // Calculate end time in minutes from midnight
                                        const startMinutes = hours * 60 + minutes;
                                        const endMinutes = startMinutes + duration;

                                        // Get current time in minutes from midnight
                                        const currentMinutes = now.getHours() * 60 + now.getMinutes();

                                        return currentMinutes > endMinutes;
                                      } catch (e) {
                                        return false;
                                      }
                                    })();

                                    return (
                                      <>
                                        {/* Confirm button for pending online bookings */}
                                        {status === "pending" && source !== "Walk-in" && (
                                          <button
                                            onClick={() => handleConfirmBooking(booking)}
                                            style={{
                                              padding: "6px 12px",
                                              borderRadius: 6,
                                              border: "1px solid rgba(34, 197, 94, 0.3)",
                                              background: "rgba(34, 197, 94, 0.1)",
                                              color: "#22c55e",
                                              fontSize: 11,
                                              fontWeight: 500,
                                              cursor: "pointer",
                                              transition: "all 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.background = "rgba(34, 197, 94, 0.2)";
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
                                            }}
                                          >
                                            ✅ Confirm
                                          </button>
                                        )}

                                        {/* Start button for confirmed online bookings only (not walk-in, not ended) */}
                                        {status === "confirmed" && source !== "Walk-in" && !isBookingEnded && (
                                          <button
                                            onClick={() => handleStartBooking(booking)}
                                            style={{
                                              padding: "6px 12px",
                                              borderRadius: 6,
                                              border: "1px solid rgba(168, 85, 247, 0.3)",
                                              background: "rgba(168, 85, 247, 0.1)",
                                              color: "#a855f7",
                                              fontSize: 11,
                                              fontWeight: 500,
                                              cursor: "pointer",
                                              transition: "all 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                              e.currentTarget.style.background = "rgba(168, 85, 247, 0.2)";
                                            }}
                                            onMouseLeave={(e) => {
                                              e.currentTarget.style.background = "rgba(168, 85, 247, 0.1)";
                                            }}
                                          >
                                            ▶️ Start
                                          </button>
                                        )}

                                        {/* Edit button for all bookings except pending online bookings */}
                                        {!(status === "pending" && source !== "Walk-in") && (
                                          <button
                                            onClick={() => handleEditBooking(booking)}
                                            style={{
                                              padding: "6px 12px",
                                              borderRadius: 6,
                                              border: `1px solid ${theme.border}`,
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
                                      </>
                                    );
                                  })()}
                                </div>
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

          {/* Cafe Details Tab */}
          {activeTab === 'cafe-details' && (
            <div>
              {cafes.length === 0 ? (
                <div
                  style={{
                    background: theme.cardBackground,
                    borderRadius: 16,
                    border: `1px solid ${theme.border}`,
                    padding: "60px 20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🏪</div>
                  <p style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                    No café found
                  </p>
                  <p style={{ fontSize: 13, color: theme.textMuted, marginBottom: 20 }}>
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
                    <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: theme.textPrimary }}>
                      {cafes[0].name || "Your Gaming Café"}
                    </h2>
                    {cafes[0].address && (
                      <div style={{ fontSize: 15, color: theme.textSecondary, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
                        <span>📍</span>
                        {cafes[0].address}
                      </div>
                    )}
                  </div>

                  {/* Café Description */}
                  {cafes[0].description && (
                    <div style={{
                      fontSize: 14,
                      color: theme.textSecondary,
                      lineHeight: 1.6,
                      marginBottom: 32,
                      padding: "20px",
                      background: "rgba(15,23,42,0.5)",
                      borderRadius: 12,
                      border: `1px solid ${theme.border}`,
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
                    color: theme.textMuted,
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
                background: theme.cardBackground,
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>📈</div>
              <p style={{ fontSize: 18, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                Analytics Coming Soon
              </p>
              <p style={{ fontSize: 14, color: theme.textMuted }}>
                Detailed insights and reports will be available here.
              </p>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'sessions' && (
            <div>
              {/* Header with search and filters */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 24, fontWeight: 700, color: theme.textPrimary, margin: 0, marginBottom: 4 }}>Bookings</h2>
                    <p style={{ fontSize: 14, color: theme.textMuted, margin: 0 }}>Manage gaming bookings</p>
                  </div>
                  <button
                    onClick={() => router.push('/owner/walk-in')}
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 10,
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: 18 }}>+</span>
                    New Booking
                  </button>
                </div>

                {/* Search and filters row */}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search customer name or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 44px',
                        background: theme.cardBackground,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 10,
                        color: theme.textPrimary,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.5 }}>🔍</span>
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      background: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      color: theme.textPrimary,
                      fontSize: 14,
                      cursor: 'pointer',
                      minWidth: 140,
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      background: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      color: theme.textPrimary,
                      fontSize: 14,
                      cursor: 'pointer',
                      minWidth: 140,
                    }}
                  >
                    <option value="all">All Sources</option>
                    <option value="online">Online</option>
                    <option value="walk-in">Walk-in</option>
                  </select>

                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      background: theme.cardBackground,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      color: theme.textPrimary,
                      fontSize: 14,
                      cursor: 'pointer',
                      minWidth: 160,
                    }}
                  />
                </div>
              </div>

              {/* Bookings Table */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  overflow: 'hidden',
                }}
              >
                {loadingData ? (
                  <div style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>⏳</div>
                    <p style={{ color: theme.textMuted, fontSize: 14 }}>Loading bookings...</p>
                  </div>
                ) : filteredBookings.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>📅</div>
                    <p style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 6, fontWeight: 500 }}>No bookings yet</p>
                    <p style={{ color: theme.textMuted, fontSize: 14 }}>Start a gaming session to see it here</p>
                    <button
                      onClick={() => router.push('/owner/walk-in')}
                      style={{
                        marginTop: 20,
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 10,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>+</span>
                      New Booking
                    </button>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: `1px solid ${theme.border}` }}>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Customer</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Phone</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Station</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Controllers</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Duration</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Started</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>End Time</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Payment</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Amount</th>
                        <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Status</th>
                        <th style={{ padding: '16px 20px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((booking, index) => {
                        const isWalkIn = booking.source === 'walk-in';
                        const customerName = isWalkIn ? booking.customer_name : booking.user_name || booking.user_email;
                        const customerPhone = isWalkIn ? booking.customer_phone : booking.user_phone;
                        const consoleInfo = booking.booking_items?.[0];

                        const statusColors: Record<string, { bg: string; text: string }> = {
                          'pending': { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308' },
                          'confirmed': { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6' },
                          'in-progress': { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981' },
                          'completed': { bg: 'rgba(100, 116, 139, 0.15)', text: '#64748b' },
                          'cancelled': { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444' },
                        };

                        const statusColor = statusColors[booking.status || 'pending'] || statusColors.pending;

                        // Format started time as "28 Dec at 10:30 PM"
                        const formattedStarted = booking.booking_date && booking.start_time
                          ? `${new Date(booking.booking_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} at ${booking.start_time}`
                          : '-';

                        // Calculate end time
                        const calculateEndTime = (startTime: string | null, duration: number | null) => {
                          if (!startTime || !duration) return '-';
                          const [hours, minutesPart] = startTime.split(':');
                          const minutes = parseInt(minutesPart.split(' ')[0]);
                          const isPM = startTime.includes('pm');
                          let hour24 = parseInt(hours);
                          if (isPM && hour24 !== 12) hour24 += 12;
                          if (!isPM && hour24 === 12) hour24 = 0;

                          const totalMinutes = (hour24 * 60 + minutes + duration) % (24 * 60);
                          const endHour24 = Math.floor(totalMinutes / 60);
                          const endMin = totalMinutes % 60;
                          const endHour12 = endHour24 % 12 || 12;
                          const endAmPm = endHour24 >= 12 ? 'pm' : 'am';
                          return `${endHour12}:${endMin.toString().padStart(2, '0')} ${endAmPm}`;
                        };

                        const endTime = calculateEndTime(booking.start_time, booking.duration ?? null);

                        return (
                          <tr
                            key={booking.id}
                            style={{
                              borderBottom: index < filteredBookings.length - 1 ? `1px solid ${theme.border}` : 'none',
                              transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(51,65,85,0.2)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          >
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontSize: 14, fontWeight: 500, color: theme.textPrimary }}>
                                {customerName || 'Unknown'}
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 13, color: theme.textSecondary }}>
                              {customerPhone || '-'}
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 500, color: theme.textPrimary }}>
                              {consoleInfo?.console || '-'}
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: theme.textSecondary }}>
                              {(() => {
                                const items = booking.booking_items || [];
                                if (items.length === 0) return '-';
                                const totalControllers = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
                                return totalControllers;
                              })()}
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: theme.textSecondary }}>
                              {booking.duration ? `${booking.duration}m` : '-'}
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: theme.textSecondary }}>
                              {formattedStarted}
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: theme.textSecondary }}>
                              {endTime}
                            </td>

                            {/* Payment Mode */}
                            <td style={{ padding: '16px 20px' }}>
                              {(() => {
                                const paymentMode = booking.payment_mode || 'cash';
                                const getPaymentIcon = (mode: string) => {
                                  switch(mode) {
                                    case 'cash': return '💵';
                                    case 'upi': return '📱';
                                    default: return '💵';
                                  }
                                };
                                return (
                                  <span style={{
                                    display: 'inline-block',
                                    padding: '6px 12px',
                                    borderRadius: 6,
                                    fontSize: 12,
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                    background: 'rgba(168, 85, 247, 0.1)',
                                    color: '#a855f7',
                                  }}>
                                    {getPaymentIcon(paymentMode)} {paymentMode}
                                  </span>
                                );
                              })()}
                            </td>

                            <td style={{ padding: '16px 20px', fontSize: 15, fontWeight: 600, color: theme.textPrimary }}>
                              ₹{booking.total_amount || 0}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                textTransform: 'capitalize',
                                background: statusColor.bg,
                                color: statusColor.text,
                              }}>
                                {booking.status?.replace('-', ' ') || 'pending'}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                                {/* Show Confirm button for pending online bookings */}
                                {booking.status === 'pending' && booking.source === 'online' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleConfirmBooking(booking);
                                    }}
                                    style={{
                                      padding: '6px 14px',
                                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Confirm
                                  </button>
                                )}

                                {/* Show Start button for confirmed bookings */}
                                {booking.status === 'confirmed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartBooking(booking);
                                    }}
                                    style={{
                                      padding: '6px 14px',
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: 6,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    Start
                                  </button>
                                )}

                                {/* Edit/View button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditBooking(booking);
                                  }}
                                  style={{
                                    padding: '8px 12px',
                                    background: 'transparent',
                                    color: theme.textSecondary,
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 6,
                                    fontSize: 18,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                  title="View details"
                                >
                                  👁️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Customers Tab */}
          {activeTab === 'customers' && (() => {
            // Aggregate customer data from bookings
            const customerMap = new Map<string, {
              id: string;
              name: string;
              phone: string | null;
              email: string | null;
              sessions: number;
              totalSpent: number;
              lastVisit: string;
              source: string;
            }>();

            bookings.forEach(booking => {
              // Handle both walk-in and online bookings
              const customerId = booking.user_id || booking.customer_phone || booking.customer_name || 'unknown';
              const customerName = booking.customer_name || booking.user_name || 'Unknown';
              const customerPhone = booking.customer_phone || booking.user_phone || null;
              const customerEmail = booking.user_email || null;

              if (customerMap.has(customerId)) {
                const existing = customerMap.get(customerId)!;
                existing.sessions += 1;
                existing.totalSpent += booking.total_amount || 0;
                // Update last visit if this booking is more recent
                if (new Date(booking.booking_date || '') > new Date(existing.lastVisit)) {
                  existing.lastVisit = booking.booking_date || '';
                }
              } else {
                customerMap.set(customerId, {
                  id: customerId,
                  name: customerName,
                  phone: customerPhone,
                  email: customerEmail,
                  sessions: 1,
                  totalSpent: booking.total_amount || 0,
                  lastVisit: booking.booking_date || '',
                  source: booking.source || 'online'
                });
              }
            });

            let customers = Array.from(customerMap.values());

            // Apply filters
            if (customerSearch) {
              const search = customerSearch.toLowerCase();
              customers = customers.filter(c =>
                c.name.toLowerCase().includes(search) ||
                (c.phone && c.phone.includes(search)) ||
                (c.email && c.email.toLowerCase().includes(search))
              );
            }

            // Apply sorting
            customers.sort((a, b) => {
              let comparison = 0;

              switch (customerSortBy) {
                case 'name':
                  comparison = a.name.localeCompare(b.name);
                  break;
                case 'sessions':
                  comparison = a.sessions - b.sessions;
                  break;
                case 'totalSpent':
                  comparison = a.totalSpent - b.totalSpent;
                  break;
                case 'lastVisit':
                  comparison = new Date(a.lastVisit).getTime() - new Date(b.lastVisit).getTime();
                  break;
              }

              return customerSortOrder === 'asc' ? comparison : -comparison;
            });

            // Helper function to toggle sort
            const handleSort = (column: 'name' | 'sessions' | 'totalSpent' | 'lastVisit') => {
              if (customerSortBy === column) {
                setCustomerSortOrder(customerSortOrder === 'asc' ? 'desc' : 'asc');
              } else {
                setCustomerSortBy(column);
                setCustomerSortOrder('desc');
              }
            };

            const getSortIcon = (column: 'name' | 'sessions' | 'totalSpent' | 'lastVisit') => {
              if (customerSortBy !== column) return '↕';
              return customerSortOrder === 'asc' ? '↑' : '↓';
            };

            // Calculate "Today" for last visit display
            const today = new Date().toISOString().split('T')[0];
            const getLastVisitDisplay = (date: string) => {
              if (date === today) return 'Today';
              const visitDate = new Date(date);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - visitDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays === 1) return 'Yesterday';
              if (diffDays <= 7) return `${diffDays} days ago`;
              return visitDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            };

            return (
              <div>
                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ marginBottom: 20 }}>
                    <div>
                      <h2 style={{ fontSize: 28, fontWeight: 700, color: theme.textPrimary, margin: 0, marginBottom: 6 }}>
                        Customers
                      </h2>
                      <p style={{ fontSize: 15, color: theme.textMuted, margin: 0 }}>
                        Manage your customer database
                      </p>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div style={{
                    background: theme.cardBackground,
                    borderRadius: 16,
                    border: `1px solid ${theme.border}`,
                    padding: 20,
                  }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                      {/* Search */}
                      <div style={{ flex: 1, minWidth: 300, position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>
                          🔍
                        </span>
                        <input
                          type="text"
                          placeholder="Search by name, phone, email..."
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '12px 16px 12px 48px',
                            background: theme.background,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 10,
                            color: theme.textPrimary,
                            fontSize: 14,
                            outline: 'none',
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#10b981'}
                          onBlur={(e) => e.currentTarget.style.borderColor = theme.border}
                        />
                      </div>

                      {/* Filter Checkboxes */}
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={hasSubscription}
                          onChange={(e) => setHasSubscription(e.target.checked)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 14, color: theme.textSecondary }}>Has Subscription</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={hasMembership}
                          onChange={(e) => setHasMembership(e.target.checked)}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: 14, color: theme.textSecondary }}>Has Membership</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Customer Table */}
                <div style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  overflow: 'hidden',
                }}>
                  {/* Table Header */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '200px 120px 180px 120px 100px 130px 150px 60px',
                    gap: 16,
                    padding: '16px 24px',
                    background: theme.hoverBackground,
                    borderBottom: `1px solid ${theme.border}`,
                  }}>
                    <button
                      onClick={() => handleSort('name')}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: customerSortBy === 'name' ? theme.textPrimary : theme.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        textAlign: 'left',
                      }}
                    >
                      CUSTOMER {getSortIcon('name')}
                    </button>
                    <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      PHONE
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      EMAIL
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      MODE
                    </div>
                    <button
                      onClick={() => handleSort('sessions')}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: customerSortBy === 'sessions' ? theme.textPrimary : theme.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        textAlign: 'left',
                      }}
                    >
                      SESSIONS {getSortIcon('sessions')}
                    </button>
                    <button
                      onClick={() => handleSort('totalSpent')}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: customerSortBy === 'totalSpent' ? theme.textPrimary : theme.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        textAlign: 'left',
                      }}
                    >
                      TOTAL SPENT {getSortIcon('totalSpent')}
                    </button>
                    <button
                      onClick={() => handleSort('lastVisit')}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: customerSortBy === 'lastVisit' ? theme.textPrimary : theme.textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        textAlign: 'left',
                      }}
                    >
                      LAST VISIT {getSortIcon('lastVisit')}
                    </button>
                    <div></div>
                  </div>

                  {/* Table Body */}
                  {customers.length === 0 ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                      <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>👥</div>
                      <p style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 8 }}>
                        No customers found
                      </p>
                      <p style={{ fontSize: 14, color: theme.textMuted }}>
                        {customerSearch ? 'Try adjusting your search criteria' : 'Customers will appear here after bookings'}
                      </p>
                    </div>
                  ) : (
                    customers.map((customer, index) => (
                      <div
                        key={customer.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '200px 120px 180px 120px 100px 130px 150px 60px',
                          gap: 16,
                          padding: '18px 24px',
                          borderBottom: index < customers.length - 1 ? `1px solid ${theme.border}` : 'none',
                          transition: 'background 0.2s',
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = theme.hoverBackground}
                        onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Customer Name */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            fontWeight: 700,
                            color: 'white',
                            flexShrink: 0,
                          }}>
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 600, color: theme.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {customer.name}
                            </div>
                          </div>
                        </div>

                        {/* Phone */}
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.textSecondary }}>
                          {customer.phone || '-'}
                        </div>

                        {/* Email */}
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.textSecondary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {customer.email || '-'}
                        </div>

                        {/* Mode */}
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background: customer.source === 'walk-in'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(59, 130, 246, 0.1)',
                            color: customer.source === 'walk-in'
                              ? '#ef4444'
                              : '#3b82f6',
                            textTransform: 'capitalize',
                          }}>
                            {customer.source === 'walk-in' ? 'Walk-in' : 'Online'}
                          </span>
                        </div>

                        {/* Sessions */}
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 600, color: theme.textPrimary }}>
                          {customer.sessions}
                        </div>

                        {/* Total Spent */}
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 15, fontWeight: 600, color: theme.textPrimary }}>
                          ₹{customer.totalSpent}
                        </div>

                        {/* Last Visit */}
                        <div style={{ display: 'flex', alignItems: 'center', fontSize: 14, color: theme.textSecondary }}>
                          {getLastVisitDisplay(customer.lastVisit)}
                        </div>

                        {/* View Button */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <button
                            style={{
                              padding: '8px 12px',
                              background: 'transparent',
                              border: `1px solid ${theme.border}`,
                              borderRadius: 8,
                              color: theme.textSecondary,
                              fontSize: 18,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = theme.hoverBackground;
                              e.currentTarget.style.borderColor = theme.textMuted;
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.borderColor = theme.border;
                            }}
                          >
                            👁
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Customer count */}
                {customers.length > 0 && (
                  <div style={{ marginTop: 24, textAlign: 'center', color: theme.textSecondary, fontSize: 14 }}>
                    Showing {customers.length} customer{customers.length !== 1 ? 's' : ''}
                  </div>
                )}

                {/* Footer */}
                {customers.length > 0 && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <p style={{ fontSize: 14, color: theme.textMuted }}>
                      Showing 1 to {customers.length} of {customers.length} customers
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Stations Tab */}
          {activeTab === 'stations' && cafes.length > 0 && (
            <div>
              {/* Header with Stats and Add Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                  <h2 style={{ fontSize: 28, fontWeight: 700, color: theme.textPrimary, margin: 0, marginBottom: 8 }}>
                    Gaming Stations
                  </h2>
                  <p style={{ fontSize: 14, color: theme.textMuted, margin: 0 }}>
                    Configure pricing for all your gaming stations
                  </p>
                </div>

                {/* Add New Station Button */}
                <button
                  onClick={() => {
                    setNewStationType('ps5');
                    setNewStationCount(1);
                    setShowAddStationModal(true);
                  }}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: 12,
                    color: '#ffffff',
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(59, 130, 246, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: 18 }}>+</span>
                  Add New Station
                </button>
              </div>

              {/* Search and Filters */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  padding: '20px',
                  marginBottom: 24,
                }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* Search */}
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Search stations..."
                      value={stationSearch}
                      onChange={(e) => setStationSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 44px',
                        background: 'rgba(15,23,42,0.6)',
                        border: `1px solid ${theme.border}`,
                        borderRadius: 10,
                        color: theme.textPrimary,
                        fontSize: 14,
                        outline: 'none',
                      }}
                    />
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: 0.5 }}>🔍</span>
                  </div>

                  {/* Type Filter */}
                  <select
                    value={stationTypeFilter}
                    onChange={(e) => setStationTypeFilter(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(15,23,42,0.6)',
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      color: theme.textPrimary,
                      fontSize: 14,
                      cursor: 'pointer',
                      minWidth: 140,
                    }}
                  >
                    <option value="all">All Types</option>
                    <option value="PC">PC</option>
                    <option value="PS5">PS5</option>
                    <option value="PS4">PS4</option>
                    <option value="Xbox">Xbox</option>
                    <option value="VR">VR</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={stationStatusFilter}
                    onChange={(e) => setStationStatusFilter(e.target.value)}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(15,23,42,0.6)',
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      color: theme.textPrimary,
                      fontSize: 14,
                      cursor: 'pointer',
                      minWidth: 140,
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>

                  {/* View Toggle */}
                  <div style={{ display: 'flex', gap: 4, background: 'rgba(15,23,42,0.6)', borderRadius: 8, padding: 4, border: `1px solid ${theme.border}` }}>
                    <button
                      style={{
                        padding: '8px 12px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#3b82f6',
                        cursor: 'pointer',
                        fontSize: 18,
                      }}
                    >
                      ☰
                    </button>
                    <button
                      style={{
                        padding: '8px 12px',
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 6,
                        color: theme.textMuted,
                        cursor: 'pointer',
                        fontSize: 18,
                      }}
                    >
                      ▦
                    </button>
                  </div>
                </div>
              </div>

              {/* Stations Table */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15,23,42,0.8)', borderBottom: `1px solid ${theme.border}` }}>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Station ↕️
                      </th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Type ↕️
                      </th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Rate ↕️
                      </th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Sessions ↕️
                      </th>
                      <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Status
                      </th>
                      <th style={{ padding: '16px 20px', textAlign: 'right', fontSize: 11, fontWeight: 600, color: theme.textMuted, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Dynamically generate station rows from cafe console counts */}
                    {(() => {
                      const cafe = cafes[0];
                      const allStations: any[] = [];

                      // Console type configurations
                      const consoleTypes = [
                        { key: 'pc_count', name: 'PC', icon: '🖥️', bgColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', rate: '₹100/hr' },
                        { key: 'ps5_count', name: 'PS5', icon: '🎮', bgColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', rate: '₹150 Single / ₹300 Multi' },
                        { key: 'ps4_count', name: 'PS4', icon: '🎮', bgColor: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', rate: '₹100 Single / ₹200 Multi' },
                        { key: 'xbox_count', name: 'Xbox', icon: '🎮', bgColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', rate: '₹120 Single / ₹240 Multi' },
                        { key: 'vr_count', name: 'VR', icon: '🥽', bgColor: 'rgba(236, 72, 153, 0.15)', color: '#ec4899', rate: '₹200/hr' },
                        { key: 'steering_wheel_count', name: 'Steering', icon: '🏎️', bgColor: 'rgba(251, 146, 60, 0.15)', color: '#fb923c', rate: '₹150/hr' },
                        { key: 'pool_count', name: 'Pool', icon: '🎱', bgColor: 'rgba(14, 165, 233, 0.15)', color: '#0ea5e9', rate: '₹80/hr' },
                        { key: 'snooker_count', name: 'Snooker', icon: '🎱', bgColor: 'rgba(132, 204, 22, 0.15)', color: '#84cc16', rate: '₹80/hr' },
                        { key: 'arcade_count', name: 'Arcade', icon: '🕹️', bgColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', rate: '₹50/hr' },
                      ];

                      // Generate stations for each console type
                      consoleTypes.forEach((consoleType) => {
                        const count = cafe[consoleType.key as keyof CafeRow] as number || 0;
                        for (let i = 1; i <= count; i++) {
                          allStations.push({
                            id: `${consoleType.name}-${String(i).padStart(2, '0')}`,
                            name: `${consoleType.name}-${String(i).padStart(2, '0')}`,
                            type: consoleType.name,
                            icon: consoleType.icon,
                            bgColor: consoleType.bgColor,
                            color: consoleType.color,
                            rate: consoleType.rate,
                            sessions: 0, // TODO: Calculate from bookings
                            status: 'Active',
                          });
                        }
                      });

                      if (allStations.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} style={{ padding: '60px 20px', textAlign: 'center' }}>
                              <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.3 }}>🎮</div>
                              <p style={{ fontSize: 16, color: theme.textSecondary, marginBottom: 6, fontWeight: 500 }}>
                                No stations configured
                              </p>
                              <p style={{ fontSize: 14, color: theme.textMuted }}>
                                Add your first gaming station to get started
                              </p>
                            </td>
                          </tr>
                        );
                      }

                      return allStations.map((station, index) => {
                        const isPoweredOff = poweredOffStations.has(station.name);
                        const stationStatus = isPoweredOff ? 'Inactive' : 'Active';

                        return (
                          <tr key={station.id} style={{ borderBottom: index < allStations.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: station.bgColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 20,
                                    opacity: isPoweredOff ? 0.4 : 1,
                                  }}
                                >
                                  {station.icon}
                                </div>
                                <span style={{ fontSize: 15, fontWeight: 600, color: theme.textPrimary, opacity: isPoweredOff ? 0.5 : 1 }}>{station.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: station.bgColor,
                                  color: station.color,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  opacity: isPoweredOff ? 0.5 : 1,
                                }}
                              >
                                {station.type}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 1.6, opacity: isPoweredOff ? 0.5 : 1 }}>
                                {(() => {
                                  const savedPricing = stationPricing[station.name];

                                  // PS5/Xbox - Show base pricing only (half hour and full hour)
                                  if (['PS5', 'Xbox'].includes(station.type)) {
                                    const c1Half = savedPricing?.controller_1_half_hour || 75;
                                    const c1Full = savedPricing?.controller_1_full_hour || 150;

                                    return (
                                      <div>
                                        <span style={{ fontWeight: 600 }}>
                                          ₹{c1Half}/30m · ₹{c1Full}/hr
                                        </span>
                                      </div>
                                    );
                                  } else if (['PS4'].includes(station.type)) {
                                    // PS4 - Show single/multi
                                    const singleHalf = savedPricing?.single_player_half_hour_rate || 75;
                                    const singleFull = savedPricing?.single_player_rate || 150;
                                    const multiHalf = savedPricing?.multi_player_half_hour_rate || 150;
                                    const multiFull = savedPricing?.multi_player_rate || 300;

                                    return (
                                      <>
                                        <div style={{ marginBottom: 4 }}>
                                          <span style={{ color: theme.textMuted, fontSize: 11 }}>Single: </span>
                                          <span style={{ fontWeight: 600 }}>₹{singleHalf}/30m · ₹{singleFull}/hr</span>
                                        </div>
                                        <div>
                                          <span style={{ color: theme.textMuted, fontSize: 11 }}>Multi: </span>
                                          <span style={{ fontWeight: 600 }}>₹{multiHalf}/30m · ₹{multiFull}/hr</span>
                                        </div>
                                      </>
                                    );
                                  } else {
                                    const defaults: Record<string, {half: number, full: number}> = {
                                      'PC': {half: 50, full: 100},
                                      'VR': {half: 100, full: 200},
                                      'Steering': {half: 75, full: 150},
                                      'Pool': {half: 40, full: 80},
                                      'Snooker': {half: 40, full: 80},
                                      'Arcade': {half: 40, full: 80},
                                    };
                                    const stationDefaults = defaults[station.type] || {half: 40, full: 80};
                                    const halfRate = savedPricing?.half_hour_rate || stationDefaults.half;
                                    const fullRate = savedPricing?.hourly_rate || stationDefaults.full;

                                    return (
                                      <div>
                                        <span style={{ fontWeight: 600 }}>
                                          ₹{halfRate}/30m · ₹{fullRate}/hr
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: theme.textSecondary, opacity: isPoweredOff ? 0.5 : 1 }}>
                              {station.sessions}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  background: stationStatus === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                  color: stationStatus === 'Active' ? '#10b981' : '#ef4444',
                                  fontSize: 12,
                                  fontWeight: 600,
                                }}
                              >
                                {stationStatus}
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                  style={{
                                    padding: '8px',
                                    background: 'transparent',
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 6,
                                    color: theme.textSecondary,
                                    cursor: 'pointer',
                                    fontSize: 16,
                                  }}
                                  title="Edit"
                                  onClick={() => setEditingStation(station)}
                                >
                                  ✏️
                                </button>
                                <button
                                  style={{
                                    padding: '8px',
                                    background: 'transparent',
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 6,
                                    color: isPoweredOff ? '#ef4444' : '#10b981',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                  }}
                                  title={isPoweredOff ? 'Power On' : 'Power Off'}
                                  onClick={() => handleTogglePower(station.name)}
                                >
                                  🔌
                                </button>
                                <button
                                  style={{
                                    padding: '8px',
                                    background: 'transparent',
                                    border: `1px solid ${theme.border}`,
                                    borderRadius: 6,
                                    color: '#ef4444',
                                    cursor: 'pointer',
                                    fontSize: 16,
                                  }}
                                  title="Delete"
                                  onClick={() => setStationToDelete({ name: station.name, type: station.type })}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tournament Tab */}
          {activeTab === 'subscriptions' && (
            <div
              style={{
                background: theme.cardBackground,
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🏆</div>
              <p style={{ fontSize: 18, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                Tournament
              </p>
              <p style={{ fontSize: 14, color: theme.textMuted }}>
                Manage tournaments and competitions here.
              </p>
            </div>
          )}

          {/* Memberships Tab */}
          {activeTab === 'memberships' && (
            <div
              style={{
                background: theme.cardBackground,
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🎫</div>
              <p style={{ fontSize: 18, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                Memberships
              </p>
              <p style={{ fontSize: 14, color: theme.textMuted }}>
                Manage membership tiers and benefits here.
              </p>
            </div>
          )}

          {/* Coupons Tab */}
          {activeTab === 'coupons' && (
            <div
              style={{
                background: theme.cardBackground,
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>🎟️</div>
              <p style={{ fontSize: 18, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                Coupons & Discounts
              </p>
              <p style={{ fontSize: 14, color: theme.textMuted }}>
                Create and manage promotional coupons here.
              </p>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div
              style={{
                background: theme.cardBackground,
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                padding: "60px 20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.3 }}>📊</div>
              <p style={{ fontSize: 18, color: theme.textSecondary, marginBottom: 8, fontWeight: 500 }}>
                Reports
              </p>
              <p style={{ fontSize: 14, color: theme.textMuted }}>
                Generate detailed reports and exports here.
              </p>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Café Information Section */}
              <div
                style={{
                  background: theme.cardBackground,
                  borderRadius: 16,
                  border: `1px solid ${theme.border}`,
                  padding: "32px",
                }}
              >
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span style={{ fontSize: 28 }}>🏢</span>
                    <h2 style={{
                      fontFamily: fonts.heading,
                      fontSize: 24,
                      margin: 0,
                      color: theme.textPrimary,
                      fontWeight: 700,
                    }}>
                      Café Information
                    </h2>
                  </div>
                  <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>
                    Manage your café's basic information and contact details
                  </p>
                </div>

                {cafes.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                    {/* Café Name */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.textSecondary,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        Café Name
                      </label>
                      <input
                        type="text"
                        value={cafes[0].name || ''}
                        readOnly
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          background: "rgba(15, 23, 42, 0.5)",
                          border: `1px solid ${theme.border}`,
                          borderRadius: 12,
                          color: theme.textPrimary,
                          fontSize: 15,
                          outline: "none",
                          cursor: "not-allowed",
                          opacity: 0.7,
                        }}
                      />
                      <p style={{ fontSize: 12, color: theme.textMuted, margin: "6px 0 0 0" }}>
                        Contact support to change your café name
                      </p>
                    </div>

                    {/* Address */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.textSecondary,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        Address
                      </label>
                      <textarea
                        value={editedCafe.address}
                        onChange={(e) => {
                          setEditedCafe(prev => ({ ...prev, address: e.target.value }));
                          setSettingsChanged(true);
                        }}
                        rows={3}
                        placeholder="Enter café address"
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          background: "rgba(15, 23, 42, 0.8)",
                          border: `1px solid ${theme.border}`,
                          borderRadius: 12,
                          color: theme.textPrimary,
                          fontSize: 15,
                          outline: "none",
                          resize: "vertical",
                          fontFamily: fonts.body,
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = theme.border;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    {/* Contact Information Grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                      {/* Phone */}
                      <div>
                        <label style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.textSecondary,
                          marginBottom: 8,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editedCafe.phone}
                          onChange={(e) => {
                            setEditedCafe(prev => ({ ...prev, phone: e.target.value }));
                            setSettingsChanged(true);
                          }}
                          placeholder="Enter phone number"
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            background: "rgba(15, 23, 42, 0.8)",
                            border: `1px solid ${theme.border}`,
                            borderRadius: 12,
                            color: theme.textPrimary,
                            fontSize: 15,
                            outline: "none",
                            transition: "all 0.2s",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = theme.border;
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label style={{
                          display: "block",
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.textSecondary,
                          marginBottom: 8,
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={editedCafe.email}
                          onChange={(e) => {
                            setEditedCafe(prev => ({ ...prev, email: e.target.value }));
                            setSettingsChanged(true);
                          }}
                          placeholder="Enter email address"
                          style={{
                            width: "100%",
                            padding: "14px 16px",
                            background: "rgba(15, 23, 42, 0.8)",
                            border: `1px solid ${theme.border}`,
                            borderRadius: 12,
                            color: theme.textPrimary,
                            fontSize: 15,
                            outline: "none",
                            transition: "all 0.2s",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#3b82f6";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = theme.border;
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label style={{
                        display: "block",
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.textSecondary,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        Description
                      </label>
                      <textarea
                        value={editedCafe.description}
                        onChange={(e) => {
                          setEditedCafe(prev => ({ ...prev, description: e.target.value }));
                          setSettingsChanged(true);
                        }}
                        rows={4}
                        placeholder="Describe your gaming café..."
                        style={{
                          width: "100%",
                          padding: "14px 16px",
                          background: "rgba(15, 23, 42, 0.8)",
                          border: `1px solid ${theme.border}`,
                          borderRadius: 12,
                          color: theme.textPrimary,
                          fontSize: 15,
                          outline: "none",
                          resize: "vertical",
                          fontFamily: fonts.body,
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = theme.border;
                          e.currentTarget.style.boxShadow = "none";
                        }}
                      />
                    </div>

                    {/* Operational Hours Section */}
                    <div>
                      <h3 style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: theme.textPrimary,
                        margin: "0 0 16px 0",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        Operational Hours
                      </h3>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        {/* Opening Time */}
                        <div>
                          <label style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: theme.textSecondary,
                            marginBottom: 8,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}>
                            Opening Time
                          </label>
                          <input
                            type="text"
                            value={editedCafe.opening_time}
                            onChange={(e) => {
                              setEditedCafe(prev => ({ ...prev, opening_time: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            placeholder="09:00 AM"
                            style={{
                              width: "100%",
                              padding: "14px 16px",
                              background: "rgba(15, 23, 42, 0.8)",
                              border: `1px solid ${theme.border}`,
                              borderRadius: 12,
                              color: theme.textPrimary,
                              fontSize: 15,
                              outline: "none",
                              transition: "all 0.2s",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#3b82f6";
                              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = theme.border;
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        </div>

                        {/* Closing Time */}
                        <div>
                          <label style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: theme.textSecondary,
                            marginBottom: 8,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}>
                            Closing Time
                          </label>
                          <input
                            type="text"
                            value={editedCafe.closing_time}
                            onChange={(e) => {
                              setEditedCafe(prev => ({ ...prev, closing_time: e.target.value }));
                              setSettingsChanged(true);
                            }}
                            placeholder="11:00 PM"
                            style={{
                              width: "100%",
                              padding: "14px 16px",
                              background: "rgba(15, 23, 42, 0.8)",
                              border: `1px solid ${theme.border}`,
                              borderRadius: 12,
                              color: theme.textPrimary,
                              fontSize: 15,
                              outline: "none",
                              transition: "all 0.2s",
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.borderColor = "#3b82f6";
                              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.1)";
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.borderColor = theme.border;
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <button
                      onClick={handleSaveSettings}
                      disabled={!settingsChanged || savingSettings}
                      style={{
                        padding: "16px 24px",
                        background: settingsChanged ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" : "rgba(100, 116, 139, 0.3)",
                        border: "none",
                        borderRadius: 12,
                        color: settingsChanged ? "#ffffff" : theme.textMuted,
                        fontSize: 15,
                        fontWeight: 700,
                        cursor: settingsChanged && !savingSettings ? "pointer" : "not-allowed",
                        transition: "all 0.2s",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        opacity: settingsChanged ? 1 : 0.5,
                      }}
                      onMouseEnter={(e) => {
                        if (settingsChanged && !savingSettings) {
                          e.currentTarget.style.transform = "scale(1.02)";
                          e.currentTarget.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.3)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {savingSettings ? "Saving..." : settingsChanged ? "Save Changes" : "No Changes"}
                    </button>
                  </div>
                )}

                {cafes.length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🏢</div>
                    <p style={{ fontSize: 16, color: theme.textSecondary }}>
                      No café information available
                    </p>
                  </div>
                )}
              </div>
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
              background: theme.cardBackground,
              borderRadius: 24,
              border: `1px solid ${theme.border}`,
              maxWidth: 650,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "28px 32px",
              borderBottom: `1px solid ${theme.border}`,
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(79, 70, 229, 0.05))",
            }}>
              <h2 style={{
                fontFamily: fonts.heading,
                fontSize: 26,
                margin: "0 0 8px 0",
                color: theme.textPrimary,
                fontWeight: 700,
              }}>
                📝 Edit Walk-In Booking
              </h2>
              <p style={{
                fontSize: 14,
                color: theme.textSecondary,
                margin: 0,
                fontWeight: 500,
              }}>
                Booking ID: <span style={{ color: theme.textPrimary, fontWeight: 600 }}>#{editingBooking.id.slice(0, 8).toUpperCase()}</span>
              </p>
            </div>

            {/* Content */}
            <div style={{
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}>
              {/* Customer Info Section */}
              <div style={{
                padding: "20px",
                background: "rgba(99, 102, 241, 0.05)",
                borderRadius: 12,
                border: "1px solid rgba(99, 102, 241, 0.2)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span style={{ fontSize: 18 }}>👤</span>
                  <label style={{ fontSize: 13, color: theme.textSecondary, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Customer Information
                  </label>
                </div>
                <div style={{ fontSize: 16, color: theme.textPrimary, fontWeight: 600, marginBottom: 4 }}>
                  {editingBooking.user_name || "Guest"}
                </div>
                {editingBooking.user_email && (
                  <div style={{ fontSize: 13, color: theme.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>✉️</span> {editingBooking.user_email}
                  </div>
                )}
                {editingBooking.user_phone && (
                  <div style={{ fontSize: 13, color: theme.textSecondary, display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <span>📞</span> {editingBooking.user_phone}
                  </div>
                )}
              </div>

              {/* Booking Details Section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 18 }}>📅</span>
                  <h3 style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Booking Details
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Date */}
                  <div>
                    <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Booking Date *
                    </label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: theme.background,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 10,
                        color: theme.textPrimary,
                        fontSize: 14,
                        fontFamily: fonts.body,
                        fontWeight: 500,
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                      onBlur={(e) => e.target.style.borderColor = theme.border}
                    />
                  </div>

                  {/* Start Time */}
                  <div>
                    <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={editStartTime}
                      onChange={(e) => setEditStartTime(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: theme.background,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 10,
                        color: theme.textPrimary,
                        fontSize: 14,
                        fontFamily: fonts.body,
                        fontWeight: 500,
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                      onBlur={(e) => e.target.style.borderColor = theme.border}
                    />
                  </div>
                </div>

                {/* Duration */}
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8, fontWeight: 600 }}>
                    Duration *
                  </label>
                  <select
                    value={editDuration}
                    onChange={(e) => setEditDuration(parseInt(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "14px",
                      background: theme.background,
                      border: `2px solid ${theme.border}`,
                      borderRadius: 10,
                      color: theme.textPrimary,
                      fontSize: 14,
                      fontFamily: fonts.body,
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                    onBlur={(e) => e.target.style.borderColor = theme.border}
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
                <div style={{ marginTop: 16 }}>
                  <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8, fontWeight: 600 }}>
                    End Time <span style={{ color: theme.textSecondary, fontSize: 11 }}>(Auto-calculated)</span>
                  </label>
                  <div style={{
                    padding: "14px",
                    background: "rgba(100, 116, 139, 0.1)",
                    border: `2px dashed ${theme.border}`,
                    borderRadius: 10,
                    color: theme.textSecondary,
                    fontSize: 14,
                    fontFamily: fonts.body,
                    fontWeight: 500,
                  }}>
                    {editStartTime ? getEndTime(convertTo12Hour(editStartTime), editDuration) : "—"}
                  </div>
                </div>
              </div>

              {/* Console & Controllers Section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 18 }}>🎮</span>
                  <h3 style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Console & Controllers
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Console */}
                  <div>
                    <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Console *
                    </label>
                    <select
                      value={editConsole}
                      onChange={(e) => setEditConsole(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: theme.background,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 10,
                        color: theme.textPrimary,
                        fontSize: 14,
                        fontFamily: fonts.body,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                      onBlur={(e) => e.target.style.borderColor = theme.border}
                    >
                      <option value="">Select Console</option>
                      <option value="ps5">🎮 PS5</option>
                      <option value="ps4">🎮 PS4</option>
                      <option value="xbox">🎮 Xbox</option>
                      <option value="pc">💻 PC</option>
                      <option value="pool">🎱 Pool</option>
                      <option value="snooker">🎱 Snooker</option>
                      <option value="arcade">🕹️ Arcade</option>
                      <option value="vr">🥽 VR</option>
                      <option value="steering_wheel">🏎️ Racing</option>
                    </select>
                  </div>

                  {/* Number of Controllers */}
                  <div>
                    <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Controllers *
                    </label>
                    <select
                      value={editControllers}
                      onChange={(e) => setEditControllers(parseInt(e.target.value))}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: theme.background,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 10,
                        color: theme.textPrimary,
                        fontSize: 14,
                        fontFamily: fonts.body,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                      onBlur={(e) => e.target.style.borderColor = theme.border}
                    >
                      <option value={1}>1 Controller</option>
                      <option value={2}>2 Controllers</option>
                      <option value={3}>3 Controllers</option>
                      <option value={4}>4 Controllers</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment & Status Section */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 18 }}>💰</span>
                  <h3 style={{ fontSize: 14, color: theme.textSecondary, fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Payment & Status
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  {/* Amount */}
                  <div>
                    <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Total Amount * <span style={{ color: theme.textSecondary, fontSize: 11 }}>(Editable)</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute",
                        left: 14,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: 16,
                        color: "#22c55e",
                        fontWeight: 700,
                      }}>₹</span>
                      <input
                        type="number"
                        value={editAmount}
                        onChange={(e) => setEditAmount(e.target.value)}
                        min="0"
                        step="1"
                        style={{
                          width: "100%",
                          padding: "14px 14px 14px 32px",
                          background: "rgba(34, 197, 94, 0.1)",
                          border: `2px solid rgba(34, 197, 94, 0.3)`,
                          borderRadius: 10,
                          color: "#22c55e",
                          fontSize: 16,
                          fontFamily: fonts.body,
                          fontWeight: 700,
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => e.target.style.borderColor = "#22c55e"}
                        onBlur={(e) => e.target.style.borderColor = "rgba(34, 197, 94, 0.3)"}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label style={{ fontSize: 12, color: theme.textMuted, display: "block", marginBottom: 8, fontWeight: 600 }}>
                      Status *
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "14px",
                        background: theme.background,
                        border: `2px solid ${theme.border}`,
                        borderRadius: 10,
                        color: theme.textPrimary,
                        fontSize: 14,
                        fontFamily: fonts.body,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => e.target.style.borderColor = "#6366f1"}
                      onBlur={(e) => e.target.style.borderColor = theme.border}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="confirmed">✅ Confirmed</option>
                      <option value="cancelled">❌ Cancelled</option>
                      <option value="completed">✔️ Completed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with Action Buttons */}
            <div style={{
              padding: "24px 32px",
              borderTop: `1px solid ${theme.border}`,
              background: "rgba(15, 23, 42, 0.3)",
              display: "flex",
              gap: 12,
            }}>
              <button
                onClick={() => setEditingBooking(null)}
                disabled={saving}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: `2px solid ${theme.border}`,
                  background: theme.background,
                  color: theme.textPrimary,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.5 : 1,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => !saving && (e.currentTarget.style.background = theme.cardBackground)}
                onMouseLeave={(e) => !saving && (e.currentTarget.style.background = theme.background)}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBooking}
                disabled={saving || !editAmount || !editDate || !editStartTime}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  borderRadius: 12,
                  border: "none",
                  background:
                    saving || !editAmount || !editDate || !editStartTime
                      ? "rgba(99, 102, 241, 0.3)"
                      : "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: saving || !editAmount || !editDate || !editStartTime ? "not-allowed" : "pointer",
                  boxShadow:
                    saving || !editAmount || !editDate || !editStartTime
                      ? "none"
                      : "0 8px 24px rgba(99, 102, 241, 0.4)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!saving && editAmount && editDate && editStartTime) {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(99, 102, 241, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = saving || !editAmount || !editDate || !editStartTime
                    ? "none"
                    : "0 8px 24px rgba(99, 102, 241, 0.4)";
                }}
              >
                {saving ? "💾 Saving..." : "💾 Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Station Pricing Modal */}
      {editingStation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setEditingStation(null)}
        >
          <div
            style={{
              background: theme.cardBackground,
              borderRadius: 24,
              border: `1px solid ${theme.border}`,
              maxWidth: 600,
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "32px 32px 24px",
                borderBottom: `1px solid ${theme.border}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: editingStation.bgColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 28,
                  }}
                >
                  {editingStation.icon}
                </div>
                <div>
                  <h2
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: theme.textPrimary,
                      margin: 0,
                      marginBottom: 4,
                    }}
                  >
                    Edit {editingStation.name}
                  </h2>
                  <p style={{ fontSize: 14, color: theme.textMuted, margin: 0 }}>
                    Configure pricing for this station
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "32px" }}>
              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Station Name
                </label>
                <input
                  type="text"
                  value={editingStation.name}
                  disabled
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    background: theme.background,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    color: theme.textMuted,
                    fontSize: 15,
                    outline: "none",
                    cursor: "not-allowed",
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 14,
                    fontWeight: 600,
                    color: theme.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Station Type
                </label>
                <div
                  style={{
                    padding: "12px 16px",
                    background: theme.background,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: 8,
                      background: editingStation.bgColor,
                      color: editingStation.color,
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {editingStation.type}
                  </span>
                </div>
              </div>

              {/* Apply to All Checkbox */}
              <div style={{ marginBottom: 24, padding: 16, background: 'rgba(59, 130, 246, 0.08)', border: `1px solid rgba(59, 130, 246, 0.2)`, borderRadius: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={applyToAll}
                    onChange={(e) => setApplyToAll(e.target.checked)}
                    style={{
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      accentColor: '#3b82f6',
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: theme.textPrimary, marginBottom: 4 }}>
                      Apply to all {editingStation.type} stations
                    </div>
                    <div style={{ fontSize: 12, color: theme.textMuted }}>
                      Set this pricing for all {editingStation.type} stations in your cafe
                    </div>
                  </div>
                </label>
              </div>

              {/* Pricing Fields - Different based on console type */}
              {['PS5', 'Xbox'].includes(editingStation.type) ? (
                <>
                  {/* PS5/Xbox - Per Controller Pricing (1-4 controllers) */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, margin: 0 }}>
                        Per-Controller Pricing
                      </h3>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {enabledControllers.length < 4 && (
                          <button
                            onClick={() => {
                              const nextController = Math.max(...enabledControllers) + 1;
                              if (nextController <= 4) {
                                setEnabledControllers([...enabledControllers, nextController]);
                              }
                            }}
                            style={{
                              padding: '6px 12px',
                              background: '#10b981',
                              border: 'none',
                              borderRadius: 8,
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <span>+</span> Add Controller
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Controller 1 - Always shown */}
                    {enabledControllers.includes(1) && (
                      <div style={{ marginBottom: 16, padding: 16, background: theme.background, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>1 Controller</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
                              Half Hour (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g., 75"
                              value={controller1HalfHour}
                              onChange={(e) => setController1HalfHour(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", background: theme.cardBackground, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textPrimary, fontSize: 14, outline: "none" }}
                              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                              onBlur={(e) => (e.target.style.borderColor = theme.border)}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
                              Full Hour (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g., 150"
                              value={controller1FullHour}
                              onChange={(e) => setController1FullHour(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", background: theme.cardBackground, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textPrimary, fontSize: 14, outline: "none" }}
                              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                              onBlur={(e) => (e.target.style.borderColor = theme.border)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2 Controllers */}
                    {enabledControllers.includes(2) && (
                      <div style={{ marginBottom: 16, padding: 16, background: theme.background, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>2 Controllers</div>
                          <button
                            onClick={() => {
                              setEnabledControllers(enabledControllers.filter(c => c !== 2));
                              setController2HalfHour("");
                              setController2FullHour("");
                            }}
                            style={{
                              padding: '4px 10px',
                              background: '#ef4444',
                              border: 'none',
                              borderRadius: 6,
                              color: 'white',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
                              Half Hour (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g., 120"
                              value={controller2HalfHour}
                              onChange={(e) => setController2HalfHour(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", background: theme.cardBackground, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textPrimary, fontSize: 14, outline: "none" }}
                              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                              onBlur={(e) => (e.target.style.borderColor = theme.border)}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
                              Full Hour (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g., 240"
                              value={controller2FullHour}
                              onChange={(e) => setController2FullHour(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", background: theme.cardBackground, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textPrimary, fontSize: 14, outline: "none" }}
                              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                              onBlur={(e) => (e.target.style.borderColor = theme.border)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3 Controllers */}
                    {enabledControllers.includes(3) && (
                      <div style={{ marginBottom: 16, padding: 16, background: theme.background, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>3 Controllers</div>
                          <button
                            onClick={() => {
                              setEnabledControllers(enabledControllers.filter(c => c !== 3));
                              setController3HalfHour("");
                              setController3FullHour("");
                            }}
                            style={{
                              padding: '4px 10px',
                              background: '#ef4444',
                              border: 'none',
                              borderRadius: 6,
                              color: 'white',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
                              Half Hour (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g., 165"
                              value={controller3HalfHour}
                              onChange={(e) => setController3HalfHour(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", background: theme.cardBackground, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textPrimary, fontSize: 14, outline: "none" }}
                              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                              onBlur={(e) => (e.target.style.borderColor = theme.border)}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
                              Full Hour (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g., 330"
                              value={controller3FullHour}
                              onChange={(e) => setController3FullHour(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", background: theme.cardBackground, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textPrimary, fontSize: 14, outline: "none" }}
                              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                              onBlur={(e) => (e.target.style.borderColor = theme.border)}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 4 Controllers */}
                    {enabledControllers.includes(4) && (
                      <div style={{ marginBottom: 16, padding: 16, background: theme.background, borderRadius: 12, border: `1px solid ${theme.border}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: theme.textSecondary }}>4 Controllers (Max)</div>
                          <button
                            onClick={() => {
                              setEnabledControllers(enabledControllers.filter(c => c !== 4));
                              setController4HalfHour("");
                              setController4FullHour("");
                            }}
                            style={{
                              padding: '4px 10px',
                              background: '#ef4444',
                              border: 'none',
                              borderRadius: 6,
                              color: 'white',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
                              Half Hour (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g., 210"
                              value={controller4HalfHour}
                              onChange={(e) => setController4HalfHour(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", background: theme.cardBackground, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textPrimary, fontSize: 14, outline: "none" }}
                              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                              onBlur={(e) => (e.target.style.borderColor = theme.border)}
                            />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: theme.textMuted, marginBottom: 6 }}>
                              Full Hour (₹)
                            </label>
                            <input
                              type="number"
                              placeholder="e.g., 420"
                              value={controller4FullHour}
                              onChange={(e) => setController4FullHour(e.target.value)}
                              style={{ width: "100%", padding: "10px 12px", background: theme.cardBackground, border: `1px solid ${theme.border}`, borderRadius: 8, color: theme.textPrimary, fontSize: 14, outline: "none" }}
                              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                              onBlur={(e) => (e.target.style.borderColor = theme.border)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : ['PS4'].includes(editingStation.type) ? (
                <>
                  {/* PS4 - Keep old Single/Multi format */}
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, marginBottom: 12 }}>
                      Single Player Pricing
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
                          Half Hour (₹)
                        </label>
                        <input type="number" placeholder="e.g., 75" value={singleHalfHour} onChange={(e) => setSingleHalfHour(e.target.value)}
                          style={{ width: "100%", padding: "12px 16px", background: theme.background, border: `1px solid ${theme.border}`, borderRadius: 12, color: theme.textPrimary, fontSize: 15, outline: "none", transition: "border-color 0.2s" }}
                          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")} onBlur={(e) => (e.target.style.borderColor = theme.border)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
                          Full Hour (₹)
                        </label>
                        <input type="number" placeholder="e.g., 150" value={singleFullHour} onChange={(e) => setSingleFullHour(e.target.value)}
                          style={{ width: "100%", padding: "12px 16px", background: theme.background, border: `1px solid ${theme.border}`, borderRadius: 12, color: theme.textPrimary, fontSize: 15, outline: "none", transition: "border-color 0.2s" }}
                          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")} onBlur={(e) => (e.target.style.borderColor = theme.border)} />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, marginBottom: 12 }}>
                      Multi Player Pricing
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
                          Half Hour (₹)
                        </label>
                        <input type="number" placeholder="e.g., 150" value={multiHalfHour} onChange={(e) => setMultiHalfHour(e.target.value)}
                          style={{ width: "100%", padding: "12px 16px", background: theme.background, border: `1px solid ${theme.border}`, borderRadius: 12, color: theme.textPrimary, fontSize: 15, outline: "none", transition: "border-color 0.2s" }}
                          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")} onBlur={(e) => (e.target.style.borderColor = theme.border)} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: theme.textSecondary, marginBottom: 8 }}>
                          Full Hour (₹)
                        </label>
                        <input type="number" placeholder="e.g., 300" value={multiFullHour} onChange={(e) => setMultiFullHour(e.target.value)}
                          style={{ width: "100%", padding: "12px 16px", background: theme.background, border: `1px solid ${theme.border}`, borderRadius: 12, color: theme.textPrimary, fontSize: 15, outline: "none", transition: "border-color 0.2s" }}
                          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")} onBlur={(e) => (e.target.style.borderColor = theme.border)} />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Other stations - Half hour and full hour rates */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: theme.textPrimary, marginBottom: 12 }}>
                      Pricing
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: theme.textSecondary,
                            marginBottom: 8,
                          }}
                        >
                          Half Hour (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 50"
                          value={halfHour}
                          onChange={(e) => setHalfHour(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            background: theme.background,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 12,
                            color: theme.textPrimary,
                            fontSize: 15,
                            outline: "none",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                          onBlur={(e) => (e.target.style.borderColor = theme.border)}
                        />
                      </div>
                      <div>
                        <label
                          style={{
                            display: "block",
                            fontSize: 13,
                            fontWeight: 600,
                            color: theme.textSecondary,
                            marginBottom: 8,
                          }}
                        >
                          Full Hour (₹)
                        </label>
                        <input
                          type="number"
                          placeholder="e.g., 100"
                          value={fullHour}
                          onChange={(e) => setFullHour(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            background: theme.background,
                            border: `1px solid ${theme.border}`,
                            borderRadius: 12,
                            color: theme.textPrimary,
                            fontSize: 15,
                            outline: "none",
                            transition: "border-color 0.2s",
                          }}
                          onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                          onBlur={(e) => (e.target.style.borderColor = theme.border)}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: "24px 32px",
                borderTop: `1px solid ${theme.border}`,
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
              }}
            >
              <button
                onClick={() => setEditingStation(null)}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  color: theme.textSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!cafes[0]?.id) return;

                  setSavingPricing(true);
                  try {
                    const isGamingConsole = ['PS5', 'PS4', 'Xbox'].includes(editingStation.type);
                    const stationNumber = parseInt(editingStation.name.split('-')[1]);

                    // Prepare pricing data
                    const pricingData: any = {
                      cafe_id: cafes[0].id,
                      station_type: editingStation.type,
                      station_number: stationNumber,
                      station_name: editingStation.name,
                      is_active: true,
                    };

                    // Save controller pricing for PS5/Xbox - only save enabled controllers
                    if (['PS5', 'Xbox'].includes(editingStation.type)) {
                      // Controller 1 - always enabled
                      pricingData.controller_1_half_hour = parseFloat(controller1HalfHour) || 0;
                      pricingData.controller_1_full_hour = parseFloat(controller1FullHour) || 0;

                      // Controller 2 - only if enabled
                      if (enabledControllers.includes(2)) {
                        pricingData.controller_2_half_hour = parseFloat(controller2HalfHour) || 0;
                        pricingData.controller_2_full_hour = parseFloat(controller2FullHour) || 0;
                      } else {
                        pricingData.controller_2_half_hour = null;
                        pricingData.controller_2_full_hour = null;
                      }

                      // Controller 3 - only if enabled
                      if (enabledControllers.includes(3)) {
                        pricingData.controller_3_half_hour = parseFloat(controller3HalfHour) || 0;
                        pricingData.controller_3_full_hour = parseFloat(controller3FullHour) || 0;
                      } else {
                        pricingData.controller_3_half_hour = null;
                        pricingData.controller_3_full_hour = null;
                      }

                      // Controller 4 - only if enabled
                      if (enabledControllers.includes(4)) {
                        pricingData.controller_4_half_hour = parseFloat(controller4HalfHour) || 0;
                        pricingData.controller_4_full_hour = parseFloat(controller4FullHour) || 0;
                      } else {
                        pricingData.controller_4_half_hour = null;
                        pricingData.controller_4_full_hour = null;
                      }
                    } else if (isGamingConsole) {
                      // PS4 - keep old format
                      pricingData.single_player_half_hour_rate = parseFloat(singleHalfHour) || 0;
                      pricingData.single_player_rate = parseFloat(singleFullHour) || 0;
                      pricingData.multi_player_half_hour_rate = parseFloat(multiHalfHour) || 0;
                      pricingData.multi_player_rate = parseFloat(multiFullHour) || 0;
                    } else {
                      pricingData.half_hour_rate = parseFloat(halfHour) || 0;
                      pricingData.hourly_rate = parseFloat(fullHour) || 0;
                    }

                    // Apply to all stations of same type if checkbox is checked
                    if (applyToAll) {
                      // Get console count for this type
                      const cafe = cafes[0];
                      const consoleTypeKey = `${editingStation.type.toLowerCase()}_count` as keyof typeof cafe;
                      const count = (cafe[consoleTypeKey] as number) || 0;

                      // Create pricing data for all stations of this type
                      const allPricingData = [];
                      for (let i = 1; i <= count; i++) {
                        const stationName = `${editingStation.type}-${String(i).padStart(2, '0')}`;
                        const data = { ...pricingData, station_number: i, station_name: stationName };
                        allPricingData.push(data);
                      }

                      // Upsert all at once
                      const { error } = await supabase
                        .from('station_pricing')
                        .upsert(allPricingData, {
                          onConflict: 'cafe_id,station_name'
                        });

                      if (error) throw error;
                    } else {
                      // Just save this one station
                      const { error } = await supabase
                        .from('station_pricing')
                        .upsert(pricingData, {
                          onConflict: 'cafe_id,station_name'
                        });

                      if (error) throw error;
                    }

                    // Reload station pricing to update the table
                    const { data: updatedPricing } = await supabase
                      .from("station_pricing")
                      .select("*")
                      .eq("cafe_id", cafes[0].id);

                    if (updatedPricing) {
                      const pricingMap: Record<string, any> = {};
                      updatedPricing.forEach((pricing: any) => {
                        pricingMap[pricing.station_name] = pricing;
                      });
                      setStationPricing(pricingMap);
                    }

                    const successMsg = applyToAll
                      ? `Pricing updated for all ${editingStation.type} stations!`
                      : 'Pricing updated successfully!';
                    alert(successMsg);
                    setEditingStation(null);
                    setApplyToAll(false);
                  } catch (err) {
                    console.error('Error saving pricing:', err);
                    alert('Failed to save pricing. Please try again.');
                  } finally {
                    setSavingPricing(false);
                  }
                }}
                disabled={savingPricing}
                style={{
                  padding: "12px 32px",
                  background: savingPricing ? "rgba(16, 185, 129, 0.5)" : "linear-gradient(135deg, #10b981, #059669)",
                  border: "none",
                  borderRadius: 12,
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: savingPricing ? "not-allowed" : "pointer",
                  boxShadow: savingPricing ? "none" : "0 4px 16px rgba(16, 185, 129, 0.3)",
                }}
              >
                {savingPricing ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Station Modal */}
      {showAddStationModal && (
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
          onClick={() => setShowAddStationModal(false)}
        >
          <div
            style={{
              background: theme.cardBackground,
              borderRadius: 24,
              border: `1px solid ${theme.border}`,
              maxWidth: 500,
              width: "100%",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "28px 32px",
              borderBottom: `1px solid ${theme.border}`,
              background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))",
            }}>
              <h2 style={{
                fontFamily: fonts.heading,
                fontSize: 26,
                margin: "0 0 8px 0",
                color: theme.textPrimary,
                fontWeight: 700,
              }}>
                ➕ Add New Station
              </h2>
              <p style={{
                fontSize: 14,
                color: theme.textSecondary,
                margin: 0,
                fontWeight: 500,
              }}>
                Add gaming stations to your café
              </p>
            </div>

            {/* Content */}
            <div style={{
              padding: "32px",
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}>
              {/* Station Type */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.textSecondary,
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Station Type
                </label>
                <select
                  value={newStationType}
                  onChange={(e) => setNewStationType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    color: theme.textPrimary,
                    fontSize: 15,
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="ps5">PlayStation 5 (PS5)</option>
                  <option value="ps4">PlayStation 4 (PS4)</option>
                  <option value="xbox">Xbox</option>
                  <option value="pc">PC Gaming</option>
                  <option value="pool">Pool Table</option>
                  <option value="snooker">Snooker Table</option>
                  <option value="arcade">Arcade Machine</option>
                  <option value="vr">VR Station</option>
                  <option value="steering_wheel">Racing Wheel</option>
                </select>
              </div>

              {/* Number of Stations */}
              <div>
                <label style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.textSecondary,
                  marginBottom: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}>
                  Number of Stations
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newStationCount}
                  onChange={(e) => setNewStationCount(parseInt(e.target.value) || 1)}
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(15, 23, 42, 0.8)",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                    color: theme.textPrimary,
                    fontSize: 15,
                    outline: "none",
                  }}
                />
                <p style={{ fontSize: 12, color: theme.textMuted, margin: "6px 0 0 0" }}>
                  How many {newStationType.toUpperCase()} stations do you want to add?
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "20px 32px",
              borderTop: `1px solid ${theme.border}`,
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setShowAddStationModal(false)}
                disabled={addingStation}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  color: theme.textSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: addingStation ? "not-allowed" : "pointer",
                  opacity: addingStation ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddStation}
                disabled={addingStation || newStationCount < 1}
                style={{
                  padding: "12px 24px",
                  background: addingStation || newStationCount < 1
                    ? "rgba(100, 116, 139, 0.3)"
                    : "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                  border: "none",
                  borderRadius: 12,
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: addingStation || newStationCount < 1 ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  if (!addingStation && newStationCount >= 1) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {addingStation ? "Adding..." : `Add ${newStationCount} Station${newStationCount > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Station Confirmation Modal */}
      {stationToDelete && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "20px",
          }}
          onClick={() => !deletingStation && setStationToDelete(null)}
        >
          <div
            style={{
              background: theme.cardBackground,
              borderRadius: 20,
              border: `1px solid ${theme.border}`,
              maxWidth: "500px",
              width: "100%",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.3)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: "24px 32px",
              borderBottom: `1px solid ${theme.border}`,
            }}>
              <h2 style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: theme.textPrimary,
              }}>
                Delete Station
              </h2>
              <p style={{
                margin: "8px 0 0 0",
                fontSize: 14,
                color: theme.textSecondary,
              }}>
                Are you sure you want to delete this station?
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: "24px 32px" }}>
              <div style={{
                padding: "16px",
                borderRadius: 12,
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
              }}>
                <p style={{
                  margin: 0,
                  fontSize: 14,
                  color: theme.textPrimary,
                  fontWeight: 600,
                }}>
                  {stationToDelete.name}
                </p>
                <p style={{
                  margin: "8px 0 0 0",
                  fontSize: 13,
                  color: theme.textSecondary,
                }}>
                  This will permanently remove this {stationToDelete.type} station from your café. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "20px 32px",
              borderTop: `1px solid ${theme.border}`,
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
            }}>
              <button
                onClick={() => setStationToDelete(null)}
                disabled={deletingStation}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  border: `1px solid ${theme.border}`,
                  borderRadius: 12,
                  color: theme.textSecondary,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deletingStation ? "not-allowed" : "pointer",
                  opacity: deletingStation ? 0.5 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStation}
                disabled={deletingStation}
                style={{
                  padding: "12px 24px",
                  background: deletingStation
                    ? "rgba(100, 116, 139, 0.3)"
                    : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                  border: "none",
                  borderRadius: 12,
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: deletingStation ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
                onMouseEnter={(e) => {
                  if (!deletingStation) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(239, 68, 68, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {deletingStation ? "Deleting..." : "Delete Station"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Live Billing Tab Component - REMOVED (walk-in functionality was removed from the application)

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
