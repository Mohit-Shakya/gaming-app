/**
 * Zepto Mail Email Service
 * Handles all email notifications for the gaming app
 */

const ZEPTO_API_URL = 'https://api.zeptomail.in/v1.1/email';

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
        <td style="padding: 14px 0; border-bottom: 1px solid #1e293b;">
          <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 500;">${ticket.console}</p>
          <p style="margin: 4px 0 0; color: #64748b; font-size: 12px;">${ticket.quantity} player(s)</p>
        </td>
        <td style="padding: 14px 0; border-bottom: 1px solid #1e293b; text-align: right;">
          <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: 600;">₹${ticket.price}</p>
        </td>
      </tr>
    `
    )
    .join('');

  const content = `
    <!-- Success Icon -->
    <table role="presentation" style="width: 100%; margin-bottom: 24px;">
      <tr>
        <td style="text-align: center;">
          <table role="presentation" style="margin: 0 auto;">
            <tr>
              <td style="width: 72px; height: 72px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; text-align: center; vertical-align: middle;">
                <span style="color: #ffffff; font-size: 36px; line-height: 72px;">&#10003;</span>
              </td>
            </tr>
          </table>
          <h2 style="margin: 20px 0 8px; color: #ffffff; font-size: 26px; font-weight: 700;">Booking Confirmed!</h2>
          <p style="margin: 0; color: #10b981; font-size: 14px; font-weight: 500;">Your gaming session is all set</p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 24px; color: #94a3b8; font-size: 15px; line-height: 1.6; text-align: center;">
      Hi${name ? ` <strong style="color: #ffffff;">${name}</strong>` : ''}, your booking has been confirmed.<br>Here are your booking details:
    </p>

    <!-- Booking Details Card -->
    <table role="presentation" style="width: 100%; background-color: #0f172a; border-radius: 16px; margin-bottom: 24px; border: 1px solid #1e293b;">
      <tr>
        <td style="padding: 24px;">
          <!-- Booking ID Badge -->
          <table role="presentation" style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; padding: 12px 16px; text-align: center;">
                <p style="margin: 0; color: rgba(255,255,255,0.8); font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Booking ID</p>
                <p style="margin: 4px 0 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: 2px;">#${bookingId.slice(0, 8).toUpperCase()}</p>
              </td>
            </tr>
          </table>

          <!-- Venue -->
          <table role="presentation" style="width: 100%; margin-bottom: 20px; border-bottom: 1px solid #1e293b; padding-bottom: 20px;">
            <tr>
              <td>
                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Venue</p>
                <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">${cafeName}</p>
                ${cafeAddress ? `<p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px;">📍 ${cafeAddress}</p>` : ''}
              </td>
            </tr>
          </table>

          <!-- Date, Time, Duration -->
          <table role="presentation" style="width: 100%;">
            <tr>
              <td style="width: 33%; padding-right: 8px;">
                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">📅 Date</p>
                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 500;">${bookingDate}</p>
              </td>
              <td style="width: 33%; padding: 0 8px;">
                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">🕐 Time</p>
                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 500;">${startTime}</p>
              </td>
              <td style="width: 33%; padding-left: 8px;">
                <p style="margin: 0 0 4px; color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">⏱️ Duration</p>
                <p style="margin: 0; color: #ffffff; font-size: 14px; font-weight: 500;">${duration} min</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Tickets Section -->
    <table role="presentation" style="width: 100%; background-color: #0f172a; border-radius: 16px; margin-bottom: 24px; border: 1px solid #1e293b;">
      <tr>
        <td style="padding: 20px 24px 12px;">
          <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">🎮 Your Tickets</p>
        </td>
      </tr>
      <tr>
        <td style="padding: 0 24px;">
          <table role="presentation" style="width: 100%;">
            ${ticketRows}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 16px 24px 20px;">
          <table role="presentation" style="width: 100%; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px;">
            <tr>
              <td style="padding: 16px 20px;">
                <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">Total Amount</p>
              </td>
              <td style="padding: 16px 20px; text-align: right;">
                <p style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">₹${totalAmount}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Footer Note -->
    <table role="presentation" style="width: 100%; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b;">
      <tr>
        <td style="padding: 16px 20px; text-align: center;">
          <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
            ⚡ Please arrive <strong style="color: #ffffff;">10 minutes</strong> before your scheduled time.<br>
            We look forward to seeing you!
          </p>
        </td>
      </tr>
    </table>
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
