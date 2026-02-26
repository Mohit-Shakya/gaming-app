import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

// POST /api/owner/reports — fetch booking data for reports
export async function POST(request: NextRequest) {
  try {
    const { cafeId, startDate, endDate, prevStartDate, prevEndDate } = await request.json();

    if (!cafeId) {
      return NextResponse.json({ error: "cafeId is required" }, { status: 400 });
    }

    // Fetch current period bookings
    const { data: currentData, error: currentError } = await supabase
      .from('bookings')
      .select(`
        id, total_amount, created_at, booking_date, status, payment_mode, start_time,
        customer_name, source,
        booking_items (console, quantity, price)
      `)
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('booking_date', `${startDate}T00:00:00`)
      .lte('booking_date', `${endDate}T23:59:59`)
      .order('booking_date', { ascending: true });

    if (currentError) {
      return NextResponse.json({ error: currentError.message }, { status: 500 });
    }

    // Fetch previous period bookings
    const { data: prevData } = await supabase
      .from('bookings')
      .select('id, total_amount, booking_date, status, payment_mode')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('booking_date', `${prevStartDate}T00:00:00`)
      .lte('booking_date', `${prevEndDate}T23:59:59`);

    return NextResponse.json({
      currentBookings: currentData || [],
      previousBookings: prevData || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch reports" }, { status: 500 });
  }
}

// GET /api/owner/reports/peak — fetch 30-day bookings for peak hours
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get('cafeId');

    if (!cafeId) {
      return NextResponse.json({ error: "cafeId is required" }, { status: 400 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
    const endDate = now.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('bookings')
      .select('id, start_time, created_at, status')
      .eq('cafe_id', cafeId)
      .neq('status', 'cancelled')
      .gte('booking_date', startDate)
      .lte('booking_date', endDate);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch peak hours data" }, { status: 500 });
  }
}
