import { NextRequest, NextResponse } from "next/server";
import { requireAdminContext, getSupabaseAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(supabase: ReturnType<typeof getSupabaseAdmin>, base: string): Promise<string> {
  let slug = base;
  let attempt = 0;
  while (true) {
    const { data } = await supabase.from("cafes").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
    attempt++;
    slug = `${base}-${attempt}`;
  }
}

export async function POST(request: NextRequest) {
  const { context, response } = await requireAdminContext(request);
  if (response) return response;
  const supabase = context.supabase;

  try {
    const body = await request.json();
    const {
      name,
      address,
      phone,
      email,
      owner_email,
      price_starts_from,
      hourly_price,
      ps5_count = 0,
      ps4_count = 0,
      xbox_count = 0,
      pc_count = 0,
      vr_count = 0,
      pool_count = 0,
      snooker_count = 0,
      arcade_count = 0,
      steering_wheel_count = 0,
      racing_sim_count = 0,
    } = body;

    if (!name?.trim() || !address?.trim()) {
      return NextResponse.json({ error: "Café name and address are required" }, { status: 400 });
    }

    if (!owner_email?.trim()) {
      return NextResponse.json({ error: "Owner Gmail is required to link the owner dashboard" }, { status: 400 });
    }

    const ownerEmailLower = owner_email.trim().toLowerCase();

    // ── Resolve owner_id ──────────────────────────────────────────────────────
    // Look up existing profile by email
    let ownerId: string | null = null;
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", ownerEmailLower)
      .maybeSingle();

    if (existingProfile?.id) {
      ownerId = existingProfile.id;
    } else {
      // Create a placeholder profile so the auth callback can resolve owner_id
      const { data: newProfile, error: profileErr } = await supabase
        .from("profiles")
        .insert({
          name: ownerEmailLower.split("@")[0],
          email: ownerEmailLower,
          role: "owner",
        })
        .select("id")
        .single();

      if (profileErr || !newProfile) {
        console.error("Failed to create owner profile:", profileErr);
        return NextResponse.json({ error: "Failed to create owner profile: " + profileErr?.message }, { status: 500 });
      }
      ownerId = newProfile.id;
    }

    // ── Generate unique slug ──────────────────────────────────────────────────
    const slug = await uniqueSlug(supabase, toSlug(name.trim()));

    // ── Insert café ───────────────────────────────────────────────────────────
    const { data: cafe, error: cafeErr } = await supabase
      .from("cafes")
      .insert({
        name: name.trim(),
        address: address.trim(),
        slug,
        owner_id: ownerId,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        price_starts_from: price_starts_from ? Number(price_starts_from) : null,
        hourly_price: hourly_price ? Number(hourly_price) : null,
        ps5_count: Number(ps5_count) || 0,
        ps4_count: Number(ps4_count) || 0,
        xbox_count: Number(xbox_count) || 0,
        pc_count: Number(pc_count) || 0,
        vr_count: Number(vr_count) || 0,
        pool_count: Number(pool_count) || 0,
        snooker_count: Number(snooker_count) || 0,
        arcade_count: Number(arcade_count) || 0,
        steering_wheel_count: Number(steering_wheel_count) || 0,
        racing_sim_count: Number(racing_sim_count) || 0,
        is_active: false,
        is_featured: false,
      })
      .select("id, name, slug")
      .single();

    if (cafeErr || !cafe) {
      console.error("Failed to create café:", cafeErr);
      return NextResponse.json({ error: "Failed to create café: " + cafeErr?.message }, { status: 500 });
    }

    // ── Add owner email to allowed list ───────────────────────────────────────
    // Upsert in case the email is already in the table from a previous attempt
    const { error: emailErr } = await supabase
      .from("owner_allowed_emails")
      .upsert(
        { email: ownerEmailLower, cafe_id: cafe.id, active: true },
        { onConflict: "email" }
      );

    if (emailErr) {
      console.error("Warning: could not add to owner_allowed_emails:", emailErr);
      // Don't fail the whole request — café was created, email can be added manually
    }

    return NextResponse.json({ success: true, cafe }, { status: 201 });
  } catch (err) {
    console.error("Create café error:", err);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
