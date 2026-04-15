import { NextRequest, NextResponse } from "next/server";
import { requireOwnerContext } from "@/lib/ownerAuth";

export const dynamic = "force-dynamic";

const ALLOWED_PAGE_SIZES = [10, 30, 50, 100];
const BOOKING_SELECT_BASE = `
  id, cafe_id, user_id, booking_date, start_time, duration, total_amount, status,
  source, payment_mode, created_at, customer_name, customer_phone, deleted_at,
  booking_items (id, console, quantity, price, title),
  booking_orders (id, item_name, quantity, total_price)
`;
const BOOKING_SELECT_WITH_UPDATED_AT = `
  id, cafe_id, user_id, booking_date, start_time, duration, total_amount, status,
  updated_at,
  source, payment_mode, created_at, customer_name, customer_phone, deleted_at,
  booking_items (id, console, quantity, price, title),
  booking_orders (id, item_name, quantity, total_price)
`;

type OwnedCafeRecord = { id: string };
type BookingListRecord = {
  customer_name?: string | null;
  customer_phone?: string | null;
  deleted_at?: string | null;
  updated_at?: string | null;
  user_id?: string | null;
} & Record<string, unknown>;
type BookingQueryResult = {
  count: number | null;
  data: unknown[] | null;
  error: { message?: string | null } | null;
};
type SingleBookingQueryResult = {
  data: unknown | null;
  error: { message?: string | null } | null;
};
type ProfileRecord = {
  first_name: string | null;
  id: string;
  last_name: string | null;
  phone: string | null;
};

function isMissingBookingsUpdatedAtError(error: { message?: string | null } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() || "";
  return message.includes("bookings.updated_at") && message.includes("does not exist");
}

// GET /api/owner/bookings — paginated, server-side filtered bookings for the Bookings tab
export async function GET(request: NextRequest) {
  try {
    const auth = await requireOwnerContext(request);
    if (auth.response) return auth.response;

    const { ownerId, supabase } = auth.context;
    const { searchParams } = new URL(request.url);

    const cafeId = searchParams.get("cafeId");
    const bookingId = searchParams.get("bookingId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const requestedSize = parseInt(searchParams.get("pageSize") || "30", 10);
    const PAGE_SIZE = ALLOWED_PAGE_SIZES.includes(requestedSize) ? requestedSize : 30;
    const status = searchParams.get("status") || "all";
    const source = searchParams.get("source") || "all";
    const search = searchParams.get("search") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";

    // Verify cafe ownership
    const { data: cafes } = await supabase
      .from("cafes")
      .select("id")
      .eq("owner_id", ownerId);

    const ownedCafeIds = ((cafes || []) as OwnedCafeRecord[]).map((c) => c.id);
    if (ownedCafeIds.length === 0) {
      return NextResponse.json({ bookings: [], total: 0, page, pageSize: PAGE_SIZE });
    }

    const targetCafeIds = cafeId && ownedCafeIds.includes(cafeId)
      ? [cafeId]
      : ownedCafeIds;

    const offset = (page - 1) * PAGE_SIZE;

    const enrichBookings = async (rawBookings: BookingListRecord[]) => {
      const bookings = rawBookings.filter((booking) => !booking.deleted_at);
      const userIds = [...new Set(bookings.map((booking) => booking.user_id).filter((userId): userId is string => Boolean(userId)))];
      const userProfiles = new Map<string, { name: string | null; phone: string | null }>();

      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, phone")
          .in("id", userIds);

        if (profilesError) {
          throw new Error(profilesError.message);
        }

        (profiles as ProfileRecord[] | null)?.forEach((profile) => {
          const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || null;
          userProfiles.set(profile.id, { name: fullName, phone: profile.phone || null });
        });
      }

      return bookings.map((booking) => {
        const userProfile = booking.user_id ? userProfiles.get(booking.user_id) : null;
        return {
          ...booking,
          user_name: userProfile?.name || booking.customer_name || null,
          user_email: null,
          user_phone: userProfile?.phone || booking.customer_phone || null,
        };
      });
    };

    const runSingleBookingQuery = async (includeUpdatedAt: boolean): Promise<SingleBookingQueryResult> => {
      return await supabase
        .from("bookings")
        .select(includeUpdatedAt ? BOOKING_SELECT_WITH_UPDATED_AT : BOOKING_SELECT_BASE)
        .eq("id", bookingId!)
        .in("cafe_id", targetCafeIds)
        .is("deleted_at", null)
        .maybeSingle() as unknown as SingleBookingQueryResult;
    };

    const runBookingQuery = async (includeUpdatedAt: boolean): Promise<BookingQueryResult> => {
      let query = supabase
        .from("bookings")
        .select(includeUpdatedAt ? BOOKING_SELECT_WITH_UPDATED_AT : BOOKING_SELECT_BASE, { count: "exact" })
        .in("cafe_id", targetCafeIds)
        .is("deleted_at", null);

      if (status !== "all") {
        query = query.eq("status", status);
      }

      if (source === "membership") {
        query = query.eq("source", "membership");
      } else if (source === "normal") {
        query = query.neq("source", "membership");
      }

      if (dateFrom) query = query.gte("booking_date", dateFrom);
      if (dateTo) query = query.lte("booking_date", dateTo);

      if (search) {
        // Strip PostgREST filter special chars to prevent query injection via .or() interpolation
        const safeSearch = search.replace(/[(),\s]/g, '');
        query = query.or(
          `customer_name.ilike.%${safeSearch}%,customer_phone.ilike.%${safeSearch}%,id.ilike.${safeSearch}%`
        );
      }

      return await query
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1) as unknown as BookingQueryResult;
    };

    if (bookingId) {
      let { data, error } = await runSingleBookingQuery(true);
      if (isMissingBookingsUpdatedAtError(error)) {
        const fallbackResult = await runSingleBookingQuery(false);
        data = fallbackResult.data
          ? { ...(fallbackResult.data as Record<string, unknown>), updated_at: null }
          : null;
        error = fallbackResult.error;
      }

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (!data) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

      const enrichedBookings = await enrichBookings([data as BookingListRecord]);
      const booking = enrichedBookings[0];

      if (!booking) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      return NextResponse.json({ booking });
    }

    let { data, error, count } = await runBookingQuery(true);
    if (isMissingBookingsUpdatedAtError(error)) {
      const fallbackResult = await runBookingQuery(false);
      const fallbackData = ((fallbackResult.data || []) as Record<string, unknown>[]);
      data = fallbackData.map((booking) => ({
        ...booking,
        updated_at: null,
      }));
      error = fallbackResult.error;
      count = fallbackResult.count;
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rawBookings = (data || []) as BookingListRecord[];
    const filteredOutDeletedCount = rawBookings.length - rawBookings.filter((booking) => !booking.deleted_at).length;
    const enrichedBookings = await enrichBookings(rawBookings);

    return NextResponse.json({
      bookings: enrichedBookings,
      total: count == null ? enrichedBookings.length : Math.max(0, count - filteredOutDeletedCount),
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (err: unknown) {
    console.error("Error fetching paginated bookings:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch bookings";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
