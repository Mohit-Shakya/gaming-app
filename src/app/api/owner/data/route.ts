import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { ownerId } = await request.json();

    if (!ownerId) {
      return NextResponse.json({ error: "ownerId is required" }, { status: 400 });
    }

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

    const ownerCafes = cafeRows ?? [];

    if (!ownerCafes.length) {
      return NextResponse.json({
        cafes: [], bookings: [], stationPricing: {}, consolePricing: {},
        cafeConsoles: [], availableConsoleTypes: [], membershipPlans: [],
        subscriptions: [], totalBookingsCount: 0,
      });
    }

    const cafeIds = ownerCafes.map((c: any) => c.id);

    // 2. Fetch Station Pricing
    const { data: stationPricingData } = await supabase
      .from("station_pricing")
      .select("*")
      .in("cafe_id", cafeIds)
      .eq("is_active", true);

    const stationPricingMap: Record<string, any> = {};
    const uniqueTypes: string[] = [];
    const sortedStations = [...(stationPricingData || [])].sort(
      (a: any, b: any) => (a.station_number || 0) - (b.station_number || 0)
    );
    stationPricingData?.forEach((pricing: any) => {
      stationPricingMap[pricing.station_name] = pricing;
      if (!uniqueTypes.includes(pricing.station_type)) uniqueTypes.push(pricing.station_type);
    });

    // 3. Fetch Console Pricing
    const { data: pricingData } = await supabase
      .from("console_pricing")
      .select("cafe_id, console_type, quantity, duration_minutes, price")
      .in("cafe_id", cafeIds);

    const consolePricingMap: Record<string, any> = {};
    pricingData?.forEach((item: any) => {
      if (!consolePricingMap[item.cafe_id]) consolePricingMap[item.cafe_id] = {};
      if (!consolePricingMap[item.cafe_id][item.console_type]) {
        consolePricingMap[item.cafe_id][item.console_type] = {
          qty1_30min: null, qty1_60min: null, qty2_30min: null, qty2_60min: null,
          qty3_30min: null, qty3_60min: null, qty4_30min: null, qty4_60min: null,
        };
      }
      const key = `qty${item.quantity}_${item.duration_minutes}min`;
      consolePricingMap[item.cafe_id][item.console_type][key] = item.price;
    });

    // 4. Auto-complete ended bookings (past dates)
    await supabase
      .from("bookings")
      .update({ status: "completed" })
      .in("cafe_id", cafeIds)
      .in("status", ["in-progress", "confirmed"])
      .lt("booking_date", todayStr);

    // 5. Auto-complete today's ended sessions
    const { data: todayBookings } = await supabase
      .from("bookings")
      .select("id, start_time, duration, status")
      .in("cafe_id", cafeIds)
      .eq("booking_date", todayStr)
      .in("status", ["in-progress", "confirmed"]);

    if (todayBookings && todayBookings.length > 0) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const endedIds: string[] = [];

      todayBookings.forEach((booking: any) => {
        if (!booking.start_time || !booking.duration) return;
        const timeParts = booking.start_time.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
        if (!timeParts) return;
        let hours = parseInt(timeParts[1]);
        const minutes = parseInt(timeParts[2]);
        const period = timeParts[3]?.toLowerCase();
        if (period === 'pm' && hours !== 12) hours += 12;
        else if (period === 'am' && hours === 12) hours = 0;
        if (currentMinutes > hours * 60 + minutes + booking.duration) endedIds.push(booking.id);
      });

      if (endedIds.length > 0) {
        await supabase.from("bookings").update({ status: "completed" }).in("id", endedIds);
      }
    }

    // 6. Fetch booking count
    const { count: totalCount } = await supabase
      .from("bookings")
      .select("*", { count: 'exact', head: true })
      .in("cafe_id", cafeIds);

    // 7. Fetch all bookings
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

    const ownerBookings = bookingRows ?? [];

    // 8. Enrich bookings with user profiles
    const userIds = [...new Set(ownerBookings.map((b: any) => b.user_id).filter(Boolean))];
    const userProfiles = new Map();

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone")
        .in("id", userIds);

      profiles?.forEach((p: any) => {
        const fullName = [p.first_name, p.last_name].filter(Boolean).join(" ") || null;
        userProfiles.set(p.id, { name: fullName, phone: p.phone });
      });
    }

    const enrichedBookings = ownerBookings.map((booking: any) => {
      const cafe = ownerCafes.find((c: any) => c.id === booking.cafe_id);
      const userProfile = booking.user_id ? userProfiles.get(booking.user_id) : null;
      return {
        ...booking,
        user_name: userProfile?.name || booking.customer_name || (booking.user_id ? `User ${booking.user_id.slice(0, 8)}` : null),
        user_email: null,
        user_phone: userProfile?.phone || booking.customer_phone || null,
        cafe_name: cafe?.name || null,
      };
    });

    // 9. Fetch membership plans
    const { data: plans } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('is_active', true)
      .order('price');

    // 10. Fetch subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('*, membership_plans(*)')
      .in('cafe_id', cafeIds)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      cafes: ownerCafes,
      bookings: enrichedBookings,
      stationPricing: stationPricingMap,
      consolePricing: consolePricingMap,
      cafeConsoles: sortedStations,
      availableConsoleTypes: uniqueTypes,
      membershipPlans: plans || [],
      subscriptions: subs || [],
      totalBookingsCount: totalCount || 0,
    });
  } catch (err: any) {
    console.error("Error loading owner data:", err);
    return NextResponse.json({ error: err.message || "Failed to load data" }, { status: 500 });
  }
}
