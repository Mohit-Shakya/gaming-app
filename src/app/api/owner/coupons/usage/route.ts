import { NextRequest, NextResponse } from "next/server";
import {
  ownerHasCouponAccess,
  requireOwnerContext,
} from "@/lib/ownerAuth";

export const dynamic = 'force-dynamic';

// GET /api/owner/coupons/usage?couponId=...
export async function GET(request: NextRequest) {
  const auth = await requireOwnerContext(request);
  if (auth.response) {
    return auth.response;
  }

  const { ownerId, supabase } = auth.context;
  const couponId = request.nextUrl.searchParams.get('couponId');
  if (!couponId) return NextResponse.json({ error: "couponId required" }, { status: 400 });

  const hasAccess = await ownerHasCouponAccess(supabase, ownerId, couponId);
  if (!hasAccess) {
    return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from('coupon_usage')
    .select('*')
    .eq('coupon_id', couponId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
