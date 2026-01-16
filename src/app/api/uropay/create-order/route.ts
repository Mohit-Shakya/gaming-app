// src/app/api/uropay/create-order/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createOrder } from '@/lib/uropay';
import { createClient } from '@supabase/supabase-js';

// Use service role key if available, otherwise fall back to anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, amount, customerName, customerEmail, cafeName } = body;

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, amount' },
        { status: 400 }
      );
    }

    // Create UROPAY order
    const result = await createOrder({
      bookingId,
      amount,
      customerName: customerName || 'Guest',
      customerEmail: customerEmail || 'guest@example.com',
      cafeName,
    });

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to create payment order' },
        { status: 500 }
      );
    }

    // Store UROPAY order ID in database for later verification
    await supabaseAdmin
      .from('bookings')
      .update({
        uropay_order_id: result.data.uroPayOrderId,
        payment_mode: 'upi',
      })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      uroPayOrderId: result.data.uroPayOrderId,
      qrCode: result.data.qrCode,
      upiString: result.data.upiString,
      amountInRupees: result.data.amountInRupees,
    });
  } catch (error) {
    console.error('Create UROPAY order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
