import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

// GET /api/owner/cafes?cafeId=... — fetch cafe by id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get('cafeId');

    if (!cafeId) {
      return NextResponse.json({ error: "cafeId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("cafes")
      .select("*")
      .eq("id", cafeId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cafe: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch cafe" }, { status: 500 });
  }
}

// PUT /api/owner/cafes — update cafe fields
export async function PUT(request: NextRequest) {
  try {
    const { cafeId, updates } = await request.json();

    if (!cafeId) {
      return NextResponse.json({ error: "cafeId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("cafes")
      .update(updates)
      .eq("id", cafeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update cafe" }, { status: 500 });
  }
}
