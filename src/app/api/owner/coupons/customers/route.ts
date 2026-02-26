import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

// GET /api/owner/coupons/customers?cafeId=...
export async function GET(request: NextRequest) {
  const cafeId = request.nextUrl.searchParams.get('cafeId');
  if (!cafeId) return NextResponse.json({ error: "cafeId required" }, { status: 400 });

  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, user_id, customer_name, customer_phone, total_amount, booking_date, created_at, status, source')
    .eq('cafe_id', cafeId);

  if (bookingsError) return NextResponse.json({ error: bookingsError.message }, { status: 500 });

  if (!bookings || bookings.length === 0) return NextResponse.json([]);

  const userIds = [...new Set(bookings.map((b: any) => b.user_id).filter(Boolean))];
  const userProfiles = new Map<string, { name: string; phone: string | null }>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, phone')
      .in('id', userIds);

    profiles?.forEach((p: any) => {
      userProfiles.set(p.id, {
        name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unknown',
        phone: p.phone || null,
      });
    });
  }

  const customerMap = new Map<string, any>();
  bookings.forEach((booking: any) => {
    if (booking.status === 'cancelled') return;
    const userProfile = booking.user_id ? userProfiles.get(booking.user_id) : null;
    const phone = booking.customer_phone || userProfile?.phone;
    if (!phone) return;
    const customerName = booking.customer_name || userProfile?.name || 'Unknown';
    const existing = customerMap.get(phone);
    if (existing) {
      existing.visits += 1;
      existing.total_spent += booking.total_amount || 0;
      const bookingDate = booking.booking_date || booking.created_at;
      if (bookingDate && new Date(bookingDate) > new Date(existing.last_visit)) {
        existing.last_visit = bookingDate;
        existing.name = customerName;
      }
    } else {
      customerMap.set(phone, {
        id: phone,
        name: customerName,
        phone,
        visits: 1,
        total_spent: booking.total_amount || 0,
        last_visit: booking.booking_date || booking.created_at || new Date().toISOString(),
        coupon_sent: false,
      });
    }
  });

  const customers = Array.from(customerMap.values()).sort((a, b) => b.total_spent - a.total_spent);
  return NextResponse.json(customers);
}
