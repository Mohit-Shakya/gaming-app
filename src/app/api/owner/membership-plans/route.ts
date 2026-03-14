import { NextRequest, NextResponse } from "next/server";
import {
  getOwnedCafeIdForRecord,
  requireOwnerCafeAccess,
  requireOwnerContext,
} from "@/lib/ownerAuth";

export const dynamic = 'force-dynamic';

// POST /api/owner/membership-plans — create or update (body has id for update)
export async function POST(request: NextRequest) {
  const auth = await requireOwnerContext(request);
  if (auth.response) {
    return auth.response;
  }

  const { ownerId, supabase } = auth.context;
  const body = await request.json();
  const { id, ...payload } = body;

  if (id) {
    const ownedCafeId = await getOwnedCafeIdForRecord(
      supabase,
      "membership_plans",
      id,
      ownerId
    );
    if (!ownedCafeId) {
      return NextResponse.json({ error: "Membership plan not found" }, { status: 404 });
    }

    const updates = { ...payload };
    delete updates.cafe_id;
    const { error } = await supabase
      .from('membership_plans')
      .update(updates)
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    if (!payload.cafe_id) {
      return NextResponse.json({ error: "cafe_id required" }, { status: 400 });
    }

    const accessResponse = await requireOwnerCafeAccess(
      supabase,
      ownerId,
      payload.cafe_id
    );
    if (accessResponse) {
      return accessResponse;
    }

    const { error } = await supabase.from('membership_plans').insert([payload]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/owner/membership-plans?id=...
export async function DELETE(request: NextRequest) {
  const auth = await requireOwnerContext(request);
  if (auth.response) {
    return auth.response;
  }

  const { ownerId, supabase } = auth.context;
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const ownedCafeId = await getOwnedCafeIdForRecord(
    supabase,
    "membership_plans",
    id,
    ownerId
  );
  if (!ownedCafeId) {
    return NextResponse.json({ error: "Membership plan not found" }, { status: 404 });
  }

  const { error } = await supabase.from('membership_plans').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
