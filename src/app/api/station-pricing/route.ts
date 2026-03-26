import { NextRequest, NextResponse } from 'next/server';
import { requireOwnerContext } from '@/lib/ownerAuth';

export async function POST(request: NextRequest) {
  try {
    const auth = await requireOwnerContext(request);
    if (auth.response) return auth.response;

    const { supabase } = auth.context;
    const { pricingData, applyToAll, allPricingData, powerToggleOnly } = await request.json();

    // Power-only toggle: avoid upsert constraint issues by doing select→update or insert
    if (powerToggleOnly) {
      const { cafe_id, station_name, station_type, station_number, is_active } = pricingData;

      const { data: existing } = await supabase
        .from('station_pricing')
        .select('id')
        .eq('cafe_id', cafe_id)
        .eq('station_name', station_name)
        .maybeSingle();

      if (existing?.id) {
        const { error } = await supabase
          .from('station_pricing')
          .update({ is_active })
          .eq('id', existing.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      } else {
        // No pricing row yet — insert minimal record so is_active can be persisted
        const { error } = await supabase
          .from('station_pricing')
          .insert({
            cafe_id,
            station_name,
            station_type: station_type || station_name.split('-')[0],
            station_number: station_number || 1,
            is_active,
            half_hour_rate: 0,
            hourly_rate: 0,
          });
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (applyToAll && allPricingData?.length > 0) {
      const { error } = await supabase
        .from('station_pricing')
        .upsert(allPricingData, { onConflict: 'cafe_id,station_name' });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      const { error } = await supabase
        .from('station_pricing')
        .upsert(pricingData, { onConflict: 'cafe_id,station_name' });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
