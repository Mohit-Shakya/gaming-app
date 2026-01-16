// src/lib/uropay.ts
/**
 * UROPAY Payment Gateway Integration
 * API Documentation: https://www.uropay.me/documentation
 *
 * UROPAY is a zero-commission UPI payment gateway that allows
 * accepting payments directly to your bank account.
 */

import crypto from 'crypto';

const UROPAY_API_BASE = 'https://api.uropay.me';

interface UroPayOrderRequest {
  vpa: string;
  vpaName: string;
  amount: number; // Amount in paise (₹150 = 15000)
  merchantOrderId: string;
  customerName: string;
  customerEmail: string;
  transactionNote?: string;
  notes?: Record<string, string>;
}

interface UroPayOrderResponse {
  success: boolean;
  data?: {
    uroPayOrderId: string;
    orderStatus: 'CREATED' | 'UPDATED' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'CANCELLED';
    upiString: string;
    qrCode: string; // Base64 encoded PNG
    amountInRupees: string;
    merchantOrderId: string;
  };
  error?: string;
}

interface UroPayStatusResponse {
  success: boolean;
  data?: {
    uroPayOrderId: string;
    orderStatus: 'PENDING' | 'COMPLETED';
  };
  error?: string;
}

interface UroPayWebhookPayload {
  amount: string;
  referenceNumber: string;
  from: string;
  vpa: string;
}

/**
 * Generate SHA-512 hash of the secret for authorization
 */
function generateAuthToken(secret: string): string {
  return crypto.createHash('sha512').update(secret).digest('hex');
}

/**
 * Get authorization headers for UROPAY API
 */
function getHeaders(): Record<string, string> {
  const apiKey = process.env.UROPAY_API_KEY;
  const secret = process.env.UROPAY_SECRET;

  if (!apiKey || !secret) {
    throw new Error('UROPAY credentials not configured');
  }

  return {
    'Content-Type': 'application/json',
    'X-API-KEY': apiKey,
    'Authorization': `Bearer ${generateAuthToken(secret)}`,
  };
}

/**
 * Create a new payment order
 */
export async function createOrder(params: {
  bookingId: string;
  amount: number; // Amount in rupees
  customerName: string;
  customerEmail: string;
  cafeName?: string;
}): Promise<UroPayOrderResponse> {
  const vpa = process.env.UROPAY_VPA;
  const vpaName = process.env.UROPAY_VPA_NAME || 'Gaming App';

  if (!vpa) {
    return { success: false, error: 'UROPAY VPA not configured' };
  }

  try {
    const requestBody: UroPayOrderRequest = {
      vpa,
      vpaName,
      amount: params.amount * 100, // Convert to paise
      merchantOrderId: params.bookingId,
      customerName: params.customerName,
      customerEmail: params.customerEmail,
      transactionNote: params.cafeName
        ? `Booking at ${params.cafeName}`
        : 'Gaming Cafe Booking',
      notes: {
        bookingId: params.bookingId,
      },
    };

    const response = await fetch(`${UROPAY_API_BASE}/order/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('UROPAY create order error:', response.status, errorText);
      return {
        success: false,
        error: `Payment gateway error: ${response.status}`
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('UROPAY create order exception:', error);
    return {
      success: false,
      error: 'Failed to create payment order'
    };
  }
}

/**
 * Update order with UPI reference number (for manual verification)
 */
export async function updateOrder(params: {
  uroPayOrderId: string;
  referenceNumber: string;
  orderStatus?: 'CREATED' | 'UPDATED' | 'COMPLETED' | 'FAILED' | 'PENDING' | 'CANCELLED';
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${UROPAY_API_BASE}/order/update`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({
        uroPayOrderId: params.uroPayOrderId,
        referenceNumber: params.referenceNumber,
        ...(params.orderStatus && { orderStatus: params.orderStatus }),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('UROPAY update order error:', response.status, errorText);
      return {
        success: false,
        error: `Failed to update order: ${response.status}`
      };
    }

    return { success: true };
  } catch (error) {
    console.error('UROPAY update order exception:', error);
    return {
      success: false,
      error: 'Failed to update payment order'
    };
  }
}

/**
 * Check order status (no auth required)
 */
export async function getOrderStatus(uroPayOrderId: string): Promise<UroPayStatusResponse> {
  try {
    const response = await fetch(
      `${UROPAY_API_BASE}/order/status/${uroPayOrderId}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('UROPAY get status error:', response.status, errorText);
      return {
        success: false,
        error: `Failed to get status: ${response.status}`
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('UROPAY get status exception:', error);
    return {
      success: false,
      error: 'Failed to get payment status'
    };
  }
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  const webhookSecret = process.env.UROPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('UROPAY_WEBHOOK_SECRET not configured');
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Parse webhook payload
 */
export function parseWebhookPayload(body: string): UroPayWebhookPayload | null {
  try {
    return JSON.parse(body) as UroPayWebhookPayload;
  } catch {
    return null;
  }
}

/**
 * Generate UPI deep link for mobile apps
 */
export function generateUPIDeepLink(upiString: string): string {
  // The upiString from UROPAY is already a UPI URI
  // Format: upi://pay?pa=vpa@bank&pn=Name&am=100&cu=INR&tn=Note
  return upiString;
}

/**
 * Generate UPI intent URLs for various apps
 */
export function generateUPIAppLinks(upiString: string): Record<string, string> {
  const encodedUPI = encodeURIComponent(upiString);

  return {
    gpay: `gpay://upi/${upiString}`,
    phonepe: `phonepe://pay?${upiString.replace('upi://pay?', '')}`,
    paytm: `paytmmp://pay?${upiString.replace('upi://pay?', '')}`,
    generic: upiString,
  };
}
