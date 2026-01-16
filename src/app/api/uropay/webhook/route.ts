// src/app/api/uropay/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature, parseWebhookPayload } from '@/lib/uropay';
import { createClient } from '@supabase/supabase-js';

// Use service role key if available, otherwise fall back to anon key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Store processed webhook IDs to prevent duplicates
const processedWebhooks = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    // Get headers
    const environment = req.headers.get('X-Uropay-Environment');
    const webhookId = req.headers.get('X-Uropay-Webhook-Id');
    const signature = req.headers.get('X-Uropay-Signature');

    console.log('UROPAY Webhook received:', {
      environment,
      webhookId,
      hasSignature: !!signature,
    });

    // Check for duplicate webhook
    if (webhookId && processedWebhooks.has(webhookId)) {
      console.log('Duplicate webhook, skipping:', webhookId);
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify signature if webhook secret is configured
    if (process.env.UROPAY_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Parse payload
    const payload = parseWebhookPayload(rawBody);
    if (!payload) {
      console.error('Invalid webhook payload');
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    console.log('UROPAY Payment received:', {
      amount: payload.amount,
      referenceNumber: payload.referenceNumber,
      from: payload.from,
      vpa: payload.vpa,
    });

    // Find booking with this UROPAY order
    // The webhook doesn't include the order ID, so we need to match by amount
    // For now, we'll rely on the status polling from the frontend
    // This webhook is primarily for logging and secondary confirmation

    // Mark webhook as processed
    if (webhookId) {
      processedWebhooks.add(webhookId);
      // Clean up old webhook IDs after 1 hour to prevent memory leak
      setTimeout(() => processedWebhooks.delete(webhookId), 3600000);
    }

    // Log payment to a payments table if you have one
    // This helps with reconciliation
    try {
      await supabaseAdmin.from('payment_logs').insert({
        provider: 'uropay',
        reference_number: payload.referenceNumber,
        amount: parseFloat(payload.amount),
        from_name: payload.from,
        vpa: payload.vpa,
        webhook_id: webhookId,
        environment,
        raw_payload: rawBody,
      });
    } catch (e) {
      // payment_logs table might not exist, that's okay
      console.log('Could not log payment (table may not exist):', e);
    }

    // Return 200 OK as required by UROPAY
    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('UROPAY webhook error:', error);
    // Still return 200 to prevent retries for unrecoverable errors
    return NextResponse.json({
      success: false,
      message: 'Error processing webhook',
    });
  }
}
