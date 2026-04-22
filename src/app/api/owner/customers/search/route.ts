import { NextRequest, NextResponse } from "next/server";
import {
  requireOwnerCafeAccess,
  requireOwnerContext,
} from "@/lib/ownerAuth";

export const dynamic = "force-dynamic";

type BookingCustomerRow = {
  customer_name: string | null;
  customer_phone: string | null;
};

type ProfileRow = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

function sanitizeSearchTerm(search: string): string {
  return search.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(request: NextRequest) {
  const auth = await requireOwnerContext(request);
  if (auth.response) {
    return auth.response;
  }

  const { ownerId, supabase } = auth.context;
  const cafeId = request.nextUrl.searchParams.get("cafeId");
  const rawQuery = request.nextUrl.searchParams.get("q") || "";
  const query = sanitizeSearchTerm(rawQuery);

  if (!cafeId) {
    return NextResponse.json({ error: "cafeId required" }, { status: 400 });
  }

  if (query.length < 2) {
    return NextResponse.json({ customers: [] });
  }

  const accessResponse = await requireOwnerCafeAccess(supabase, ownerId, cafeId);
  if (accessResponse) {
    return accessResponse;
  }

  const compactQuery = query.replace(/\s+/g, "");
  const [bookingsRes, profilesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("customer_name, customer_phone")
      .eq("cafe_id", cafeId)
      .is("deleted_at", null)
      .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${compactQuery}%`)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone.ilike.%${compactQuery}%`)
      .limit(8),
  ]);

  if (bookingsRes.error) {
    return NextResponse.json({ error: bookingsRes.error.message }, { status: 500 });
  }

  if (profilesRes.error) {
    return NextResponse.json({ error: profilesRes.error.message }, { status: 500 });
  }

  const seen = new Set<string>();
  const customers: Array<{ name: string; phone: string | null }> = [];

  ((profilesRes.data || []) as ProfileRow[]).forEach((profile) => {
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
    if (!name) return;

    const key = name.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    customers.push({ name, phone: profile.phone || null });
  });

  ((bookingsRes.data || []) as BookingCustomerRow[]).forEach((booking) => {
    const name = booking.customer_name?.trim() || "";
    if (!name) return;

    const key = name.toLowerCase();
    if (seen.has(key)) return;

    seen.add(key);
    customers.push({ name, phone: booking.customer_phone || null });
  });

  return NextResponse.json({ customers: customers.slice(0, 10) });
}
