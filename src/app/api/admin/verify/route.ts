import { NextRequest, NextResponse } from "next/server";
import { clearAdminSessionCookie, getAdminSessionFromRequest, getSupabaseAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

async function verifyAdminSession(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({
      userId: null,
      username: null,
      role: null,
      isAdmin: false,
    });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role, is_admin")
      .eq("id", session.userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const role = profile?.role?.toLowerCase();
    const isAdmin =
      role === "admin" || role === "super_admin" || profile?.is_admin === true;

    if (!isAdmin) {
      const response = NextResponse.json({
        userId: null,
        username: null,
        role,
        isAdmin: false,
      });
      clearAdminSessionCookie(response);
      return response;
    }

    return NextResponse.json({
      userId: session.userId,
      username: session.username,
      role,
      isAdmin: true,
    });
  } catch (err) {
    console.error("Admin verify error:", err);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return verifyAdminSession(request);
}

export async function POST(request: NextRequest) {
  return verifyAdminSession(request);
}
