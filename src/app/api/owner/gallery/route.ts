import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

// GET /api/owner/gallery?cafeId=... — fetch gallery images for a cafe
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cafeId = searchParams.get('cafeId');

    if (!cafeId) {
      return NextResponse.json({ error: "cafeId is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('gallery_images')
      .select('id, image_url')
      .eq('cafe_id', cafeId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ images: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch gallery" }, { status: 500 });
  }
}

// POST /api/owner/gallery — insert a gallery image record
export async function POST(request: NextRequest) {
  try {
    const { cafeId, imageUrl } = await request.json();

    if (!cafeId || !imageUrl) {
      return NextResponse.json({ error: "cafeId and imageUrl are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('gallery_images')
      .insert({ cafe_id: cafeId, image_url: imageUrl })
      .select('id, image_url')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ image: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to add gallery image" }, { status: 500 });
  }
}

// DELETE /api/owner/gallery — delete a gallery image record
export async function DELETE(request: NextRequest) {
  try {
    const { imageId } = await request.json();

    if (!imageId) {
      return NextResponse.json({ error: "imageId is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from('gallery_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete gallery image" }, { status: 500 });
  }
}
