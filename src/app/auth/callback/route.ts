// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Check if there's a redirect path in the query params (sent from login page)
  const redirectTo = req.nextUrl.searchParams.get("redirect") || "/";

  return NextResponse.redirect(new URL(redirectTo, req.url));
}