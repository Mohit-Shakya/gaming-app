/**
 * Zepto Mail Email Service
 * Handles all email notifications for the gaming app
 */

const ZEPTO_API_URL = 'https://api.zeptomail.com/v1.1/email';

interface EmailAddress {
  email_address: {
    address: string;
    name?: string;
  };
}

interface ZeptoMailPayload {
  from: EmailAddress['email_address'];
  to: EmailAddress[];
  subject: string;
  htmlbody: string;
}

interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html: string;
}

// Base email sending function
export async function sendEmail({ to, toName, subject, html }: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const token = process.env.ZEPTO_MAIL_TOKEN;
  const fromEmail = process.env.ZEPTO_MAIL_FROM_EMAIL;
  const fromName = process.env.ZEPTO_MAIL_FROM_NAME || 'Gaming App';

  if (!token || !fromEmail) {
    console.error('Zepto Mail credentials not configured');
    return { success: false, error: 'Email service not configured' };
  }

  const payload: ZeptoMailPayload = {
    from: {
      address: fromEmail,
      name: fromName,
    },
    to: [
      {
        email_address: {
          address: to,
          name: toName,
        },
      },
    ],
    subject,
    htmlbody: html,
  };

  try {
    const response = await fetch(ZEPTO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': token,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Zepto Mail error:', errorData);
      return { success: false, error: errorData.message || 'Failed to send email' };
    }

    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: 'Network error while sending email' };
  }
}

// Email template wrapper
function emailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Gaming App</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0f172a; text-align: center;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                This email was sent by Gaming App. Please do not reply to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Login Alert Email
export interface LoginAlertParams {
  email: string;
  name?: string;
  loginTime: string;
  device?: string;
  location?: string;
}

export async function sendLoginAlert({ email, name, loginTime, device, location }: LoginAlertParams) {
  const content = `
    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 20px;">New Login Detected</h2>
    <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Hi${name ? ` ${name}` : ''},<br><br>
      We detected a new login to your Gaming App account.
    </p>
    <table role="presentation" style="width: 100%; background-color: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 8px 16px;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Time</p>
          <p style="margin: 4px 0 0; color: #ffffff; font-size: 14px;">${loginTime}</p>
        </td>
      </tr>
      ${device ? `
      <tr>
        <td style="padding: 8px 16px;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Device</p>
          <p style="margin: 4px 0 0; color: #ffffff; font-size: 14px;">${device}</p>
        </td>
      </tr>
      ` : ''}
      ${location ? `
      <tr>
        <td style="padding: 8px 16px;">
          <p style="margin: 0; color: #64748b; font-size: 12px;">Location</p>
          <p style="margin: 4px 0 0; color: #ffffff; font-size: 14px;">${location}</p>
        </td>
      </tr>
      ` : ''}
    </table>
    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
      If this wasn't you, please secure your account immediately by changing your password.
    </p>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: 'New login to your Gaming App account',
    html: emailTemplate(content),
  });
}

// Booking Confirmation Email
export interface BookingConfirmationParams {
  email: string;
  name?: string;
  bookingId: string;
  cafeName: string;
  cafeAddress?: string;
  bookingDate: string;
  startTime: string;
  duration: number;
  tickets: Array<{
    console: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
}

export async function sendBookingConfirmation({
  email,
  name,
  bookingId,
  cafeName,
  cafeAddress,
  bookingDate,
  startTime,
  duration,
  tickets,
  totalAmount,
}: BookingConfirmationParams) {
  const ticketRows = tickets
    .map(
      (ticket) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
          <p style="margin: 0; color: #ffffff; font-size: 14px;">${ticket.console}</p>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">${ticket.quantity} player(s)</p>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #334155; text-align: right;">
          <p style="margin: 0; color: #10b981; font-size: 14px; font-weight: 600;">₹${ticket.price}</p>
        </td>
      </tr>
    `
    )
    .join('');

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">✓</span>
      </div>
      <h2 style="margin: 0; color: #ffffff; font-size: 24px;">Booking Confirmed!</h2>
    </div>

    <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
      Hi${name ? ` ${name}` : ''}, your booking has been confirmed. Here are the details:
    </p>

    <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Booking ID</p>
      <p style="margin: 0 0 16px; color: #10b981; font-size: 16px; font-weight: 600;">#${bookingId.slice(0, 8).toUpperCase()}</p>

      <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Venue</p>
      <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${cafeName}</p>
      ${cafeAddress ? `<p style="margin: 4px 0 16px; color: #94a3b8; font-size: 12px;">${cafeAddress}</p>` : '<div style="height: 16px;"></div>'}

      <div style="display: flex; gap: 24px;">
        <div style="flex: 1;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Date</p>
          <p style="margin: 0; color: #ffffff; font-size: 14px;">${bookingDate}</p>
        </div>
        <div style="flex: 1;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Time</p>
          <p style="margin: 0; color: #ffffff; font-size: 14px;">${startTime}</p>
        </div>
        <div style="flex: 1;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Duration</p>
          <p style="margin: 0; color: #ffffff; font-size: 14px;">${duration} min</p>
        </div>
      </div>
    </div>

    <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 16px;">Your Tickets</h3>
    <table role="presentation" style="width: 100%; margin-bottom: 16px;">
      ${ticketRows}
      <tr>
        <td style="padding: 16px 0 0;">
          <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">Total</p>
        </td>
        <td style="padding: 16px 0 0; text-align: right;">
          <p style="margin: 0; color: #10b981; font-size: 20px; font-weight: 700;">₹${totalAmount}</p>
        </td>
      </tr>
    </table>

    <p style="margin: 24px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
      Please arrive 10 minutes before your scheduled time. See you there!
    </p>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: `Booking Confirmed - ${cafeName}`,
    html: emailTemplate(content),
  });
}

// Booking Cancellation Email
export interface BookingCancellationParams {
  email: string;
  name?: string;
  bookingId: string;
  cafeName: string;
  bookingDate: string;
  startTime: string;
  totalAmount: number;
}

export async function sendBookingCancellation({
  email,
  name,
  bookingId,
  cafeName,
  bookingDate,
  startTime,
  totalAmount,
}: BookingCancellationParams) {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background-color: #ef4444; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
        <span style="font-size: 32px;">✕</span>
      </div>
      <h2 style="margin: 0; color: #ffffff; font-size: 24px;">Booking Cancelled</h2>
    </div>

    <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
      Hi${name ? ` ${name}` : ''}, your booking has been cancelled. Here are the details:
    </p>

    <div style="background-color: #0f172a; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Booking ID</p>
      <p style="margin: 0 0 16px; color: #ef4444; font-size: 16px; font-weight: 600;">#${bookingId.slice(0, 8).toUpperCase()}</p>

      <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Venue</p>
      <p style="margin: 0 0 16px; color: #ffffff; font-size: 16px;">${cafeName}</p>

      <div style="display: flex; gap: 24px;">
        <div style="flex: 1;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Date</p>
          <p style="margin: 0; color: #ffffff; font-size: 14px;">${bookingDate}</p>
        </div>
        <div style="flex: 1;">
          <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Time</p>
          <p style="margin: 0; color: #ffffff; font-size: 14px;">${startTime}</p>
        </div>
      </div>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #334155;">
        <p style="margin: 0 0 4px; color: #64748b; font-size: 12px;">Amount</p>
        <p style="margin: 0; color: #ffffff; font-size: 16px;">₹${totalAmount}</p>
      </div>
    </div>

    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
      If you have any questions about this cancellation, please contact the venue directly.
    </p>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: `Booking Cancelled - #${bookingId.slice(0, 8).toUpperCase()}`,
    html: emailTemplate(content),
  });
}

// Welcome Email
export interface WelcomeEmailParams {
  email: string;
  name?: string;
}

export async function sendWelcomeEmail({ email, name }: WelcomeEmailParams) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://gaming-app.com';

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h2 style="margin: 0; color: #ffffff; font-size: 24px;">Welcome to Gaming App!</h2>
    </div>

    <p style="margin: 0 0 24px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Hi${name ? ` ${name}` : ''},<br><br>
      Thanks for joining Gaming App! We're excited to have you on board.
    </p>

    <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 16px;">Here's what you can do:</h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #94a3b8; font-size: 14px; line-height: 2;">
        <li>Browse gaming cafes near you</li>
        <li>Book PS5, PS4, Xbox, PC and more</li>
        <li>Join gaming tournaments</li>
        <li>Get exclusive member discounts</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 600; font-size: 14px;">
        Explore Cafes
      </a>
    </div>

    <p style="margin: 24px 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
      Have questions? Feel free to reach out to us anytime.
    </p>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: 'Welcome to Gaming App!',
    html: emailTemplate(content),
  });
}
