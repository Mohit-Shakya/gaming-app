import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ownerAuth";
import { getAdminSessionFromRequest } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

async function verifyAdmin(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  if (!session) return null;
  return session;
}

// GET /api/admin/owner-emails — list all allowed emails with cafe names
export async function GET(request: NextRequest) {
  const session = await verifyAdmin(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("owner_allowed_emails")
    .select("id, email, cafe_id, active, added_by, created_at, cafes(name)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ emails: data || [] });
}

// POST /api/admin/owner-emails — add a new allowed email
export async function POST(request: NextRequest) {
  const session = await verifyAdmin(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, cafe_id } = await request.json();
  if (!email || !cafe_id) {
    return NextResponse.json({ error: "email and cafe_id are required" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("owner_allowed_emails").insert({
    email: email.toLowerCase().trim(),
    cafe_id,
    active: true,
    added_by: session.username,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// DELETE /api/admin/owner-emails?id=... — remove an allowed email
export async function DELETE(request: NextRequest) {
  const session = await verifyAdmin(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("owner_allowed_emails").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
