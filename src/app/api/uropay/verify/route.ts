// src/app/api/uropay/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { updateOrder } from '@/lib/uropay';
import { createClient } from '@supabase/supabase-js';

// Use service role key if available, otherwise fall back to anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Manual payment verification endpoint
 * Used when customer enters UPI reference number manually
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, referenceNumber } = body;

    if (!bookingId || !referenceNumber) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, referenceNumber' },
        { status: 400 }
      );
    }

    // Get the UROPAY order ID from booking
    const { data: booking, error: bookingError } = await supabaseAdmin
      .from('bookings')
      .select('uropay_order_id, status')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    if (booking.status === 'confirmed') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        status: 'confirmed',
      });
    }

    if (!booking.uropay_order_id) {
      return NextResponse.json(
        { error: 'No payment order found for this booking' },
        { status: 404 }
      );
    }

    // Update UROPAY order with reference number
    const result = await updateOrder({
      uroPayOrderId: booking.uropay_order_id,
      referenceNumber,
      orderStatus: 'COMPLETED',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to verify payment' },
        { status: 500 }
      );
    }

    // Update booking status to confirmed
    await supabaseAdmin
      .from('bookings')
      .update({
        status: 'confirmed',
        payment_mode: 'upi',
        upi_reference: referenceNumber,
      })
      .eq('id', bookingId);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      status: 'confirmed',
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
