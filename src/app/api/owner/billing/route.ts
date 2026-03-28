import { NextRequest, NextResponse } from "next/server";
import {
  getOwnedBookingIdForBookingItem,
  getOwnedCafeIdForBooking,
  requireOwnerCafeAccess,
  requireOwnerContext,
} from "@/lib/ownerAuth";

export const dynamic = 'force-dynamic';

// PUT /api/owner/billing — update booking + optional booking_item or items array
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireOwnerContext(request);
    if (auth.response) {
      return auth.response;
    }

    const { ownerId, supabase } = auth.context;
    const { bookingId, bookingItemId, booking, item, items, updatedAtCheck } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const ownedCafeId = await getOwnedCafeIdForBooking(supabase, bookingId, ownerId);
    if (!ownedCafeId) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Conflict detection: if caller provided a base updated_at, verify it hasn't changed
    if (updatedAtCheck) {
      const { data: current } = await supabase
        .from('bookings')
        .select('updated_at')
        .eq('id', bookingId)
        .maybeSingle();
      if (current?.updated_at && current.updated_at !== updatedAtCheck) {
        return NextResponse.json({ error: 'Conflict: booking was modified after you opened it' }, { status: 409 });
      }
    }

    // Support single item update (backward compatibility)
    if (bookingItemId && item) {
      const { error: itemError } = await supabase
        .from("booking_items")
        .update(item)
        .eq("id", bookingItemId)
        .eq("booking_id", bookingId);

      if (itemError) {
        return NextResponse.json({ error: itemError.message }, { status: 500 });
      }
    }

    // Support multiple items sync
    if (items && Array.isArray(items)) {
      // 1. Get current items in DB
      const { data: currentDbItems, error: getError } = await supabase
        .from("booking_items")
        .select("id")
        .eq("booking_id", bookingId);

      if (getError) {
        return NextResponse.json({ error: getError.message }, { status: 500 });
      }

      const itemIdsToKeep = items.filter(it => it.id).map(it => it.id);
      const dbItemIds = (currentDbItems || []).map(it => it.id);
      const itemIdsToDelete = dbItemIds.filter(id => !itemIdsToKeep.includes(id));

      // 2. Delete removed items
      if (itemIdsToDelete.length > 0) {
        const { error: delError } = await supabase
          .from("booking_items")
          .delete()
          .in("id", itemIdsToDelete)
          .eq("booking_id", bookingId);
        
        if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
      }

      // 3. Upsert items in parallel
      await Promise.all(items.map((it: any) => {
        if (it.id) {
          return supabase
            .from("booking_items")
            .update({ console: it.console, quantity: it.quantity, price: it.price, title: it.title })
            .eq("id", it.id)
            .eq("booking_id", bookingId);
        } else {
          return supabase
            .from("booking_items")
            .insert({ booking_id: bookingId, console: it.console, quantity: it.quantity, price: it.price, title: it.title });
        }
      }));
    }

    // Update booking
    if (booking) {
      const ALLOWED_BOOKING_FIELDS = ['status', 'total_amount', 'payment_mode', 'customer_name', 'customer_phone', 'booking_date', 'duration', 'start_time'] as const;
      const safeBooking: Record<string, unknown> = {};
      for (const key of ALLOWED_BOOKING_FIELDS) {
        if (booking[key] !== undefined) safeBooking[key] = booking[key];
      }
      if (Object.keys(safeBooking).length === 0) {
        return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
      }
      const { error: bookingError } = await supabase
        .from("bookings")
        .update(safeBooking)
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
    const auth = await requireOwnerContext(request);
    if (auth.response) {
      return auth.response;
    }

    const { ownerId, supabase } = auth.context;
    const { bookingId, bookingItemIds, specificItemId, newTotalAmount, deleted_remark } = await request.json();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    const ownedCafeId = await getOwnedCafeIdForBooking(supabase, bookingId, ownerId);
    if (!ownedCafeId) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (specificItemId) {
      const ownedBookingId = await getOwnedBookingIdForBookingItem(
        supabase,
        specificItemId,
        ownerId
      );

      if (!ownedBookingId || ownedBookingId !== bookingId) {
        return NextResponse.json(
          { error: "Booking item not found" },
          { status: 404 }
        );
      }

      // Hard-delete individual booking_item (items are not soft-deleted)
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
      // Soft-delete the full booking by setting deleted_at + remark
      const { error } = await supabase
        .from("bookings")
        .update({
          deleted_at: new Date().toISOString(),
          deleted_remark: deleted_remark || null,
        })
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
  const auth = await requireOwnerContext(request);
  if (auth.response) {
    return auth.response;
  }

  const { ownerId, supabase } = auth.context;
  const body = await request.json();
  const { booking, items } = body;

  if (!booking?.cafe_id) {
    return NextResponse.json({ error: "booking.cafe_id is required" }, { status: 400 });
  }

  const accessResponse = await requireOwnerCafeAccess(
    supabase,
    ownerId,
    booking.cafe_id
  );
  if (accessResponse) {
    return accessResponse;
  }

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
