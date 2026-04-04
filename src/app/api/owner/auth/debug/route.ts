import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/ownerAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email") || "mshakya169@gmail.com";
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("owner_allowed_emails")
    .select("*")
    .eq("email", email.toLowerCase());

  const { data: all, error: allError } = await supabase
    .from("owner_allowed_emails")
    .select("*");

  return NextResponse.json({
    queried_email: email.toLowerCase(),
    match: data,
    match_error: error?.message,
    all_rows: all,
    all_error: allError?.message,
  });
}
