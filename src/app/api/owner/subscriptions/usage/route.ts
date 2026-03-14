import { NextRequest, NextResponse } from "next/server";
import {
  getOwnedCafeIdForRecord,
  requireOwnerContext,
} from "@/lib/ownerAuth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireOwnerContext(request);
  if (auth.response) {
    return auth.response;
  }

  const { ownerId, supabase } = auth.context;
  const subscriptionId = request.nextUrl.searchParams.get("subscriptionId");

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "subscriptionId required" },
      { status: 400 }
    );
  }

  const ownedCafeId = await getOwnedCafeIdForRecord(
    supabase,
    "subscriptions",
    subscriptionId,
    ownerId
  );
  if (!ownedCafeId) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("subscription_usage_history")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("session_date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ usageHistory: data || [] });
}
