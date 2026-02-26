import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

// GET /api/owner/coupons/usage?couponId=...
export async function GET(request: NextRequest) {
  const couponId = request.nextUrl.searchParams.get('couponId');
  if (!couponId) return NextResponse.json({ error: "couponId required" }, { status: 400 });

  const { data, error } = await supabase
    .from('coupon_usage')
    .select('*')
    .eq('coupon_id', couponId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
