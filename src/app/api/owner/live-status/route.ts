import { NextRequest, NextResponse } from "next/server";
import {
  requireOwnerCafeAccess,
  requireOwnerContext,
} from "@/lib/ownerAuth";
import {
  getIndiaDateDaysAgo,
  getIndiaDateString,
  isBookingSessionActiveNow,
} from "@/lib/ownerBookingTiming";

export const dynamic = 'force-dynamic';

// GET /api/owner/live-status?cafeId=... — fetch cafe console counts + today's bookings + active subscriptions
export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwnerContext(request);
    if (auth.response) {
      return auth.response;
    }

    const { ownerId, supabase } = auth.context;
    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get('cafeId');

    if (!cafeId) {
      return NextResponse.json({ error: "cafeId is required" }, { status: 400 });
    }

    const accessResponse = await requireOwnerCafeAccess(supabase, ownerId, cafeId);
    if (accessResponse) {
      return accessResponse;
    }

    const now = new Date();
    const todayStr = getIndiaDateString(now);
    const yesterdayStr = getIndiaDateDaysAgo(1, now);

    // Fetch cafe console counts
    const { data: cafe, error: cafeError } = await supabase
      .from("cafes")
      .select("ps5_count, ps4_count, xbox_count, pc_count, pool_count, arcade_count, snooker_count, vr_count, steering_wheel_count, racing_sim_count")
      .eq("id", cafeId)
      .single();

    if (cafeError) {
      return NextResponse.json({ error: cafeError.message }, { status: 500 });
    }

    // Fetch in-progress bookings that might still be active now, including valid overnight carryovers.
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select(`
        id, start_time, duration, customer_name, user_id, booking_date, status, source,
        booking_items (console, quantity, title)
      `)
      .eq("cafe_id", cafeId)
      .in("booking_date", [yesterdayStr, todayStr])
      .eq("status", "in-progress")
      .is("deleted_at", null);

    if (bookingsError) {
      return NextResponse.json({ error: bookingsError.message }, { status: 500 });
    }
    const activeBookings = (bookings || []).filter((booking) =>
      isBookingSessionActiveNow({
        bookingDate: booking.booking_date,
        duration: booking.duration,
        now,
        startTime: booking.start_time,
      })
    );

    // Fetch profiles for bookings with user_id
    const userIds = activeBookings.filter(b => b.user_id).map(b => b.user_id as string);
    const profilesMap: Record<string, { name: string }> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", userIds);

      profiles?.forEach((p: any) => {
        profilesMap[p.id] = { name: p.name };
      });
    }

    // Enrich bookings with profiles
    const enrichedBookings = activeBookings.map(b => ({
      ...b,
      profile: b.user_id ? (profilesMap[b.user_id] || null) : null,
    }));

    // Fetch active memberships
    const { data: activeSubscriptions, error: subsError } = await supabase
      .from("subscriptions")
      .select(`
        id, customer_name, assigned_console_station, timer_start_time,
        membership_plans (console_type)
      `)
      .eq("cafe_id", cafeId)
      .eq("timer_active", true);

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 500 });
    }

    // Fetch station pricing for power status (is_active)
    const { data: stationPricing } = await supabase
      .from("station_pricing")
      .select("station_name, is_active")
      .eq("cafe_id", cafeId);

    return NextResponse.json({
      cafe,
      bookings: enrichedBookings,
      activeSubscriptions: activeSubscriptions || [],
      stationPricing: stationPricing || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch live status" }, { status: 500 });
  }
}
