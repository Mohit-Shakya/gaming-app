import { NextResponse } from 'next/server';

export async function GET() {
  const token = process.env.ZEPTO_MAIL_TOKEN;
  const fromEmail = process.env.ZEPTO_MAIL_FROM_EMAIL;
  const fromName = process.env.ZEPTO_MAIL_FROM_NAME;

  // Check if env vars are set (don't expose full token)
  const tokenPreview = token ? `${token.substring(0, 20)}...` : 'NOT SET';

  // Debug: Check token format
  const tokenDebug = token ? {
    length: token.length,
    startsWithZoho: token.startsWith('Zoho-enczapikey '),
    hasNewline: token.includes('\n'),
    hasCarriageReturn: token.includes('\r'),
    firstChars: token.substring(0, 30),
  } : null;

  // Test API call
  const testPayload = {
    from: {
      address: fromEmail || 'not-set@example.com',
      name: fromName || 'Test',
    },
    to: [
      {
        email_address: {
          address: 'test@example.com',
          name: 'Test User',
        },
      },
    ],
    subject: 'Test Email',
    htmlbody: '<p>Test</p>',
  };

  let apiResponse = null;
  let apiError = null;

  if (token && fromEmail) {
    try {
      const response = await fetch('https://api.zeptomail.in/v1.1/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': token,
        },
        body: JSON.stringify(testPayload),
      });

      const data = await response.json();
      apiResponse = {
        status: response.status,
        statusText: response.statusText,
        data,
      };
    } catch (err) {
      apiError = String(err);
    }
  }

  return NextResponse.json({
    env: {
      ZEPTO_MAIL_TOKEN: tokenPreview,
      ZEPTO_MAIL_FROM_EMAIL: fromEmail || 'NOT SET',
      ZEPTO_MAIL_FROM_NAME: fromName || 'NOT SET',
    },
    tokenDebug,
    apiResponse,
    apiError,
  });
}
