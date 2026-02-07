import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role key to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { pricingData, applyToAll, allPricingData } = await request.json();

    if (applyToAll && allPricingData?.length > 0) {
      const { error } = await supabaseAdmin
        .from('station_pricing')
        .upsert(allPricingData, { onConflict: 'cafe_id,station_name' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    } else {
      const { error } = await supabaseAdmin
        .from('station_pricing')
        .upsert(pricingData, { onConflict: 'cafe_id,station_name' });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
