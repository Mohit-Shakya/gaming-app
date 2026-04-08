import { NextRequest, NextResponse } from "next/server";
import {
  requireOwnerCafeAccess,
  requireOwnerContext,
} from "@/lib/ownerAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerContext(request);
  if (auth.response) {
    return auth.response;
  }

  const { ownerId, supabase } = auth.context;
  const cafeId = request.nextUrl.searchParams.get("cafeId");
  const customerKey = request.nextUrl.searchParams.get("customerKey");
  const phone = request.nextUrl.searchParams.get("phone");

  if (!cafeId || (!phone && !customerKey)) {
    return NextResponse.json(
      { error: "cafeId and customer identity required" },
      { status: 400 }
    );
  }

  const accessResponse = await requireOwnerCafeAccess(supabase, ownerId, cafeId);
  if (accessResponse) {
    return accessResponse;
  }

  const bookingMap = new Map<string, Record<string, unknown>>();
  const addBookings = (rows: Array<Record<string, unknown>> | null | undefined) => {
    (rows || []).forEach((row) => {
      if (typeof row.id === "string") bookingMap.set(row.id, row);
    });
  };

  const selectFields = `
    id, booking_date, start_time, duration, total_amount, status, source, created_at,
    customer_name, customer_phone, user_id,
    booking_items (console, quantity, title)
  `;

  const userIdFromKey = customerKey?.startsWith("user:") ? customerKey.slice(5) : "";
  const fallbackPhone = !phone && customerKey?.startsWith("phone:") ? customerKey.slice(6) : "";
  const targetPhone = phone || fallbackPhone;

  if (userIdFromKey) {
    const { data, error } = await supabase
      .from("bookings")
      .select(selectFields)
      .eq("cafe_id", cafeId)
      .eq("user_id", userIdFromKey)
      .neq("status", "cancelled")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    addBookings(data as Array<Record<string, unknown>> | null);
  }

  if (targetPhone) {
    const { data, error } = await supabase
      .from("bookings")
      .select(selectFields)
      .eq("cafe_id", cafeId)
      .eq("customer_phone", targetPhone)
      .neq("status", "cancelled")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    addBookings(data as Array<Record<string, unknown>> | null);

    const { data: matchingProfiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", targetPhone);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    const profileIds = (matchingProfiles || []).map((profile) => profile.id).filter(Boolean);
    if (profileIds.length > 0) {
      const { data: profileBookings, error: profileBookingsError } = await supabase
        .from("bookings")
        .select(selectFields)
        .eq("cafe_id", cafeId)
        .in("user_id", profileIds)
        .neq("status", "cancelled")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (profileBookingsError) {
        return NextResponse.json({ error: profileBookingsError.message }, { status: 500 });
      }

      addBookings(profileBookings as Array<Record<string, unknown>> | null);
    }
  }

  const bookings = Array.from(bookingMap.values()).sort((left, right) => {
    const leftCreated = typeof left.created_at === "string" ? left.created_at : "";
    const rightCreated = typeof right.created_at === "string" ? right.created_at : "";
    return rightCreated.localeCompare(leftCreated);
  });

  return NextResponse.json({ bookings });
}
