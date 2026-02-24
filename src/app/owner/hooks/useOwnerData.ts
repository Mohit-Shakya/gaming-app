/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { OwnerStats, CafeRow, BookingRow, PricingTier } from '../types';

export function useOwnerData(ownerId: string | null, allowed: boolean) {
  const [cafes, setCafes] = useState<CafeRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [membershipPlans, setMembershipPlans] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [cafeConsoles, setCafeConsoles] = useState<any[]>([]);
  const [availableConsoleTypes, setAvailableConsoleTypes] = useState<string[]>([]);
  const [consolePricing, setConsolePricing] = useState<Record<string, any>>({});
  const [stationPricing, setStationPricing] = useState<Record<string, any>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);

  // Pagination state (internal to hook for now, or expose if needed)
  const [bookingPage, setBookingPage] = useState(1);
  const bookingsPerPage = 50;

  const refreshData = () => setRefreshTrigger(prev => prev + 1);

  // Derive stats from bookings and cafes - Exclude cancelled bookings from revenue
  const stats = useMemo<OwnerStats | null>(() => {
    if (!cafes.length) return null;

    const now = new Date();
    // Use local date instead of UTC to match Indian timezone
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);

    // Filter out cancelled bookings for revenue calculations
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');

    const bookingsToday = activeBookings.filter(b => b.booking_date === todayStr).length;
    const pendingBookings = bookings.filter(b => b.status?.toLowerCase() === "pending").length;
    const recentRevenue = activeBookings.slice(0, 20).reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const todayRevenue = activeBookings.filter(b => b.booking_date === todayStr).reduce((sum, b) => sum + (b.total_amount || 0), 0);
    
    const weekRevenue = activeBookings.filter(b => new Date(b.booking_date || "") >= startOfWeek).reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const monthRevenue = activeBookings.filter(b => new Date(b.booking_date || "") >= startOfMonth).reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const quarterRevenue = activeBookings.filter(b => new Date(b.booking_date || "") >= startOfQuarter).reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    return {
      cafesCount: cafes.length,
      bookingsToday,
      recentBookings: Math.min(activeBookings.length, 20),
      recentRevenue,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      quarterRevenue,
      totalRevenue,
      totalBookings: totalBookingsCount || bookings.length, 
      pendingBookings
    };
  }, [bookings, cafes, totalBookingsCount]);

  // Auto-refresh bookings based on timer
  useEffect(() => {
    if (!allowed || !ownerId) return;

    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [allowed, ownerId]);

  useEffect(() => {
    if (!allowed || !ownerId) return;

    async function loadData() {
      try {
        if (refreshTrigger === 0) setLoadingData(true);
        setError(null);

        const todayStr = new Date().toISOString().slice(0, 10);

        // 1. Fetch Cafes
        const { data: cafeRows, error: cafesError } = await supabase
          .from("cafes")
          .select(`
            id, name, slug, address, description, phone, email, opening_hours, hourly_price,
            google_maps_url, instagram_url, cover_url, price_starts_from,
            monitor_details, processor_details, gpu_details, ram_details, accessories_details,
            ps5_count, ps4_count, xbox_count, pc_count, pool_count, snooker_count, arcade_count, vr_count, steering_wheel_count, racing_sim_count,
            created_at, is_active, peak_hours, popular_games, offers
          `)
          .eq("owner_id", ownerId)
          .order("created_at", { ascending: false });

        if (cafesError) throw cafesError;
        
        const ownerCafes = (cafeRows as CafeRow[]) ?? [];
        setCafes(ownerCafes);

        if (!ownerCafes.length) {
          setBookings([]);
          setLoadingData(false);
          return;
        }

        const cafeIds = ownerCafes.map((c) => c.id);

        // Fetch station pricing (used for both pricing map and available consoles/billing)
        const { data: stationPricingData, error: stationPricingError } = await supabase
          .from("station_pricing")
          .select("*")
          .in("cafe_id", cafeIds)
          .eq("is_active", true); // Ensure we only get active stations

        if (!stationPricingError && stationPricingData) {
          // 1. Build Pricing Map
          const pricingMap: Record<string, any> = {};
          stationPricingData.forEach((pricing: any) => {
            pricingMap[pricing.station_name] = pricing;
          });
          setStationPricing(pricingMap);

          // 2. Set Available Console Types
          const uniqueTypes = [...new Set(stationPricingData.map((s: any) => s.station_type))];
          setAvailableConsoleTypes(uniqueTypes);

          // 3. Set Cafe Consoles (Stations for billing)
          // Sort by station_number if available, or just name
          const sortedStations = [...stationPricingData].sort((a: any, b: any) => 
            (a.station_number || 0) - (b.station_number || 0)
          );
          setCafeConsoles(sortedStations);
        }

        // Fetch console pricing
        const { data: pricingData, error: pricingError } = await supabase
          .from("console_pricing")
          .select("cafe_id, console_type, quantity, duration_minutes, price")
          .in("cafe_id", cafeIds);

        if (!pricingError && pricingData) {
          const pricingMap: Record<string, Record<string, PricingTier>> = {};
          pricingData.forEach((item) => {
            if (!pricingMap[item.cafe_id]) pricingMap[item.cafe_id] = {};
            if (!pricingMap[item.cafe_id][item.console_type]) {
              pricingMap[item.cafe_id][item.console_type] = {
                qty1_30min: null, qty1_60min: null, qty2_30min: null, qty2_60min: null,
                qty3_30min: null, qty3_60min: null, qty4_30min: null, qty4_60min: null,
              };
            }
            const key = `qty${item.quantity}_${item.duration_minutes}min` as keyof PricingTier;
            pricingMap[item.cafe_id][item.console_type][key] = item.price;
          });
          setConsolePricing(pricingMap);
        }

        // Auto-complete ended bookings (Side Effect)
        // 1. Past dates
        await supabase
          .from("bookings")
          .update({ status: "completed" })
          .in("cafe_id", cafeIds)
          .in("status", ["in-progress", "confirmed"])
          .lt("booking_date", todayStr);

        // 2. Today's ended sessions
        const { data: todayBookings } = await supabase
          .from("bookings")
          .select("id, start_time, duration, status")
          .in("cafe_id", cafeIds)
          .eq("booking_date", todayStr)
          .in("status", ["in-progress", "confirmed"]);

        if (todayBookings && todayBookings.length > 0) {
          const now = new Date();
          const currentMinutes = now.getHours() * 60 + now.getMinutes();
          const endedBookingIds: string[] = [];

          todayBookings.forEach((booking) => {
            if (!booking.start_time || !booking.duration) return;
            const timeParts = booking.start_time.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
            if (!timeParts) return;

            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const period = timeParts[3]?.toLowerCase();

            if (period) {
              if (period === 'pm' && hours !== 12) hours += 12;
              else if (period === 'am' && hours === 12) hours = 0;
            }

            const startMinutes = hours * 60 + minutes;
            const endMinutes = startMinutes + booking.duration;

            if (currentMinutes > endMinutes) {
              endedBookingIds.push(booking.id);
            }
          });

          if (endedBookingIds.length > 0) {
            await supabase.from("bookings").update({ status: "completed" }).in("id", endedBookingIds);
          }
        }

        // Fetch bookings total count
        const { count: totalCount } = await supabase
          .from("bookings")
          .select("*", { count: 'exact', head: true })
          .in("cafe_id", cafeIds);
        
        if (totalCount !== null) setTotalBookingsCount(totalCount);

        // Fetch All Bookings (Client-side pagination will be used)
        const { data: bookingRows, error: bookingsError } = await supabase
          .from("bookings")
          .select(`
            id, cafe_id, user_id, booking_date, start_time, duration, total_amount, status,
            source, payment_mode, created_at, customer_name, customer_phone,
            booking_items (id, console, quantity, price)
          `)
          .in("cafe_id", cafeIds)
          .order("created_at", { ascending: false });

        if (bookingsError) throw bookingsError;

        const ownerBookings = (bookingRows as BookingRow[]) ?? [];
        
        // Enrich bookings with user profiles
        const userIds = [...new Set(ownerBookings.map(b => b.user_id).filter(Boolean))];
        const userProfiles = new Map();
        
        if (userIds.length > 0) {
          try {
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, first_name, last_name, phone")
              .in("id", userIds);
              
            profiles?.forEach((p: any) => {
              const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || null;
              userProfiles.set(p.id, { name: fullName, phone: p.phone, email: null });
            });
          } catch (e) {
            console.error("Error fetching profiles", e);
          }
        }

        const enrichedBookings = ownerBookings.map((booking) => {
          const cafe = ownerCafes.find((c) => c.id === booking.cafe_id);
          const userProfile = booking.user_id ? userProfiles.get(booking.user_id) : null;
          
          return {
            ...booking,
            user_name: userProfile?.name || booking.customer_name || (booking.user_id ? `User ${booking.user_id.slice(0, 8)}` : null),
            user_email: userProfile?.email || null,
            user_phone: userProfile?.phone || booking.customer_phone || null,
            cafe_name: cafe?.name || null
          };
        });

        setBookings(enrichedBookings);

        // 3. Fetch Membership Plans
        const { data: plans } = await supabase
          .from('membership_plans')
          .select('*')
          .eq('is_active', true)
          .order('price');
        setMembershipPlans(plans || []);

        // 4. Fetch Subscriptions
        // 4. Fetch Subscriptions
        if (cafeIds.length > 0) {
          try {
            const { data: subs, error: subsError } = await supabase
              .from('subscriptions')
              .select('*, membership_plans(*)')
              .in('cafe_id', cafeIds)
              .order('created_at', { ascending: false });

            if (subsError) {
              console.error('Error fetching subscriptions:', subsError);
            } else {
              setSubscriptions(subs || []);
            }
          } catch (e) {
             console.error('Exception fetching subscriptions:', e);
          }
        } else {
          setSubscriptions([]);
        }

        setLoadingData(false);
      } catch (err: any) {
        console.error("Error loading data:", err);
        setError(err.message);
        setLoadingData(false);
      }
    }

    loadData();
  }, [allowed, ownerId, refreshTrigger, bookingPage, bookingsPerPage]);

  return {
    stats,
    cafes,
    bookings,
    loadingData,
    error,
    membershipPlans,
    subscriptions,
    cafeConsoles,
    availableConsoleTypes,
    consolePricing,
    stationPricing,
    totalBookingsCount,
    setSubscriptions,
    setBookings,
    refreshData,
    bookingPage,
    setBookingPage,
    setCafes,
    setStationPricing,
    setConsolePricing
  };
}
