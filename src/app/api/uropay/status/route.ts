// src/app/api/uropay/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getOrderStatus } from '@/lib/uropay';
import { createClient } from '@supabase/supabase-js';

// Use service role key if available, otherwise fall back to anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uroPayOrderId = searchParams.get('orderId');
    const bookingId = searchParams.get('bookingId');

    if (!uroPayOrderId && !bookingId) {
      return NextResponse.json(
        { error: 'Missing orderId or bookingId parameter' },
        { status: 400 }
      );
    }

    let orderIdToCheck = uroPayOrderId;

    // If bookingId is provided, get the uroPayOrderId from database
    if (!orderIdToCheck && bookingId) {
      const { data: booking } = await supabaseAdmin
        .from('bookings')
        .select('uropay_order_id')
        .eq('id', bookingId)
        .single();

      if (!booking?.uropay_order_id) {
        return NextResponse.json(
          { error: 'No payment order found for this booking' },
          { status: 404 }
        );
      }

      orderIdToCheck = booking.uropay_order_id;
    }

    // Get status from UROPAY
    const result = await getOrderStatus(orderIdToCheck!);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to get payment status' },
        { status: 500 }
      );
    }

    // If payment is completed, update booking status
    if (result.data.orderStatus === 'COMPLETED' && bookingId) {
      await supabaseAdmin
        .from('bookings')
        .update({
          status: 'confirmed',
          payment_mode: 'upi',
        })
        .eq('id', bookingId)
        .eq('status', 'pending'); // Only update if still pending
    }

    return NextResponse.json({
      success: true,
      orderStatus: result.data.orderStatus,
      uroPayOrderId: result.data.uroPayOrderId,
    });
  } catch (error) {
    console.error('Get UROPAY status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
