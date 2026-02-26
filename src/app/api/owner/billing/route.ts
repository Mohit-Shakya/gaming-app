import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

// POST /api/owner/billing — create booking + booking_items
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { booking, items } = body;

  const { data: newBooking, error: bookingError } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();

  if (bookingError) return NextResponse.json({ error: bookingError.message }, { status: 500 });

  if (items && items.length > 0) {
    const itemsToInsert = items.map((item: any) => ({
      booking_id: newBooking.id,
      console: item.console,
      quantity: item.quantity,
      price: item.price,
    }));

    const { error: itemsError } = await supabase
      .from('booking_items')
      .insert(itemsToInsert);

    if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, bookingId: newBooking.id });
}
