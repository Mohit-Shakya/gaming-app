import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

// PUT /api/owner/billing — update booking + optional booking_item
export async function PUT(request: NextRequest) {
  try {
    const { bookingId, bookingItemId, booking, item } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    // Update booking_item first (if provided)
    if (bookingItemId && item) {
      const { error: itemError } = await supabase
        .from("booking_items")
        .update(item)
        .eq("id", bookingItemId);

      if (itemError) {
        return NextResponse.json({ error: itemError.message }, { status: 500 });
      }
    }

    // Update booking
    if (booking) {
      const { error: bookingError } = await supabase
        .from("bookings")
        .update(booking)
        .eq("id", bookingId);

      if (bookingError) {
        return NextResponse.json({ error: bookingError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error updating booking:", err);
    return NextResponse.json({ error: err.message || "Failed to update booking" }, { status: 500 });
  }
}

// DELETE /api/owner/billing — delete booking or specific booking_item
export async function DELETE(request: NextRequest) {
  try {
    const { bookingId, bookingItemIds, specificItemId, newTotalAmount } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    if (specificItemId) {
      // Delete only a specific booking_item from a bulk booking
      const { error: itemError } = await supabase
        .from("booking_items")
        .delete()
        .eq("id", specificItemId);

      if (itemError) {
        return NextResponse.json({ error: itemError.message }, { status: 500 });
      }

      // Update the booking's total_amount
      if (newTotalAmount !== undefined) {
        const { error: updateError } = await supabase
          .from("bookings")
          .update({ total_amount: newTotalAmount })
          .eq("id", bookingId);

        if (updateError) {
          console.error("Error updating booking total after item delete:", updateError);
        }
      }
    } else {
      // Delete all booking_items first, then the booking
      if (bookingItemIds && bookingItemIds.length > 0) {
        const { error: itemsError } = await supabase
          .from("booking_items")
          .delete()
          .in("id", bookingItemIds);

        if (itemsError) {
          return NextResponse.json({ error: itemsError.message }, { status: 500 });
        }
      }

      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting booking:", err);
    return NextResponse.json({ error: err.message || "Failed to delete booking" }, { status: 500 });
  }
}

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
