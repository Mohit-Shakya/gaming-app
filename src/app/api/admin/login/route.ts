import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, applyAdminSessionCookie, clearAdminSessionCookie, createAdminSession } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Try the verify_admin_login RPC first
    const { data, error } = await supabase.rpc("verify_admin_login", {
      p_username: username.trim(),
      p_password: password,
    });

    if (!error && data?.[0]?.is_valid) {
      const response = NextResponse.json({
        userId: data[0].user_id,
        username: data[0].username || username.trim(),
      });
      applyAdminSessionCookie(
        response,
        createAdminSession(data[0].user_id, data[0].username || username.trim())
      );
      return response;
    }

    // Fallback: check profiles table directly
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, is_admin, admin_username, admin_password")
      .or("role.eq.admin,role.eq.super_admin,is_admin.eq.true")
      .limit(10);

    if (profileError) {
      console.error("Admin profile lookup error:", profileError);
      return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }

    const match = (profiles || []).find((p) => {
      const profileUsername = (p.admin_username || "admin").trim().toLowerCase();
      const profilePassword = p.admin_password || "Admin@2026";
      return (
        profileUsername === username.trim().toLowerCase() &&
        profilePassword === password
      );
    });

    // Emergency fallback: allow admin/Admin@2026 if any admin profile exists
    const emergencyMatch =
      !match &&
      username.trim().toLowerCase() === "admin" &&
      password === "Admin@2026" &&
      (profiles || []).length > 0;

    const resolvedMatch = match || (emergencyMatch ? profiles![0] : null);

    if (!resolvedMatch) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }

    const finalUsername = resolvedMatch.admin_username || username.trim();
    const response = NextResponse.json({ userId: resolvedMatch.id, username: finalUsername });
    applyAdminSessionCookie(response, createAdminSession(resolvedMatch.id, finalUsername));
    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAdminSessionCookie(response);
  return response;
}
