import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Validate service role key exists - fail fast if not configured
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceRoleKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not configured');
}

export async function POST(request: NextRequest) {
  try {
    // Verify service role key is available
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify user is authenticated and is an owner
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a cafe owner
    const { data: ownerCheck } = await supabaseAuth
      .from('cafes')
      .select('id')
      .eq('owner_id', user.id)
      .limit(1);

    if (!ownerCheck || ownerCheck.length === 0) {
      return NextResponse.json({ error: 'Forbidden: Not a cafe owner' }, { status: 403 });
    }

    const { pricingData, applyToAll, allPricingData } = await request.json();

    // Create admin client with service role key (already validated above)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

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
