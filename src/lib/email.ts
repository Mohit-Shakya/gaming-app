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
  // Default to "BookMyGame" if not set, but prefer environment variable if available
  const fromName = process.env.ZEPTO_MAIL_FROM_NAME || 'BookMyGame';

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

// Helper to format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Email template wrapper
function emailTemplate(content: string, title: string = 'BookMyGame'): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f172a;">
    <tr>
      <td style="padding: 40px 10px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3); border: 1px solid #334155;">
          
          <!-- Brand Header -->
          <tr>
            <td style="padding: 32px 0; text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">BookMyGame</h1>
            </td>
          </tr>

          <!-- Content Area -->
          <tr>
            <td style="padding: 40px 32px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 32px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0 0 12px; color: #94a3b8; font-size: 14px;">
                Need help? Contact us at <a href="mailto:support@bookmygame.in" style="color: #10b981; text-decoration: none;">support@bookmygame.in</a>
              </p>
              <div style="margin-bottom: 24px;">
                <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 12px;">Terms</a>
                <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 12px;">Privacy</a>
                <a href="#" style="color: #64748b; text-decoration: none; margin: 0 10px; font-size: 12px;">Unsubscribe</a>
              </div>
              <p style="margin: 0; color: #64748b; font-size: 12px;">
                &copy; ${new Date().getFullYear()} BookMyGame. All rights reserved.
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
    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 24px; font-weight: 700;">New Login Detected</h2>
    <p style="margin: 0 0 32px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
      Hi ${name || 'Gamer'},<br>
      We detected a new login to your BookMyGame account.
    </p>

    <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #334155;">
      <table role="presentation" style="width: 100%;">
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Time</p>
            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 500;">${loginTime}</p>
          </td>
        </tr>
        ${device ? `
        <tr>
          <td style="padding-bottom: 16px;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Device</p>
            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 500;">${device}</p>
          </td>
        </tr>
        ` : ''}
        ${location ? `
        <tr>
          <td>
            <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Location</p>
            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 500;">${location}</p>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>

    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6;">
      If this wasn't you, please secure your account immediately by changing your password.
    </p>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: 'Security Alert: New Login Detected',
    html: emailTemplate(content, 'New Login Detected'),
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
  
  const ticketRows = tickets.map(ticket => `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #334155;">
        <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 600;">${ticket.console}</p>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 14px;">${ticket.quantity} player(s)</p>
      </td>
      <td style="padding: 16px 0; border-bottom: 1px solid #334155; text-align: right; vertical-align: top;">
        <p style="margin: 0; color: #10b981; font-size: 16px; font-weight: 600;">${formatCurrency(ticket.price)}</p>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Success Animation/Icon -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #10b981; border-radius: 50%; margin-bottom: 16px; box-shadow: 0 0 20px rgba(16, 185, 129, 0.4);">
        <span style="display: block; color: #ffffff; font-size: 32px; line-height: 64px;">&#10003;</span>
      </div>
      <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Booking Confirmed!</h2>
      <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 16px;">
        Hi ${name || 'Gamer'}, your session is locked in.
      </p>
    </div>

    <!-- Main Booking Card -->
    <div style="background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #334155; margin-bottom: 32px;">
      
      <!-- Card Header: Booking ID -->
      <div style="background-color: #1e293b; padding: 20px 24px; border-bottom: 1px solid #334155; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="margin: 0; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Booking ID</p>
          <p style="margin: 4px 0 0; color: #10b981; font-size: 18px; font-weight: 700; letter-spacing: 1px;">#${bookingId.slice(0, 8).toUpperCase()}</p>
        </div>
      </div>

      <!-- Venue Details -->
      <div style="padding: 24px;">
        <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Venue</p>
        <h3 style="margin: 0 0 8px; color: #ffffff; font-size: 20px; font-weight: 700;">${cafeName}</h3>
        ${cafeAddress ? `<p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.5;">📍 ${cafeAddress}</p>` : ''}
        
        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #334155; display: flex;">
          <div style="flex: 1;">
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date</p>
            <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600;">${bookingDate}</p>
          </div>
          <div style="flex: 1;">
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Time</p>
            <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600;">${startTime}</p>
          </div>
          <div style="flex: 1;">
            <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Duration</p>
            <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600;">${duration} min</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Tickets Section -->
    <div style="margin-bottom: 32px;">
      <h3 style="margin: 0 0 16px; color: #ffffff; font-size: 18px; font-weight: 700;">Your Tickets</h3>
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        ${ticketRows}
        <!-- Total -->
        <tr>
          <td style="padding: 20px 0 0; border-top: 1px solid #334155;">
            <p style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 700;">Total Paid</p>
          </td>
          <td style="padding: 20px 0 0; border-top: 1px solid #334155; text-align: right;">
            <p style="margin: 0; color: #10b981; font-size: 24px; font-weight: 800;">${formatCurrency(totalAmount)}</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Arrival Info -->
    <div style="background-color: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 16px; text-align: center;">
      <p style="margin: 0; color: #d1fae5; font-size: 14px; line-height: 1.6;">
        ⚡ <strong>Pro Tip:</strong> Please arrive 10 minutes before your scheduled start time to get set up on your console.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: `Booking Confirmed: #${bookingId.slice(0, 8).toUpperCase()} at ${cafeName}`,
    html: emailTemplate(content, 'Booking Confirmed'),
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
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #ef4444; border-radius: 50%; margin-bottom: 16px; box-shadow: 0 0 20px rgba(239, 68, 68, 0.4);">
        <span style="display: block; color: #ffffff; font-size: 40px; line-height: 64px; font-weight: 300;">&times;</span>
      </div>
      <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Booking Cancelled</h2>
      <p style="margin: 8px 0 0; color: #cbd5e1; font-size: 16px;">
        Hi ${name || 'Gamer'}, your booking has been cancelled.
      </p>
    </div>

    <div style="background-color: #0f172a; border-radius: 16px; overflow: hidden; border: 1px solid #334155; margin-bottom: 32px; padding: 24px;">
      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Booking ID</p>
        <p style="margin: 0; color: #ef4444; font-size: 18px; font-weight: 700; letter-spacing: 1px;">#${bookingId.slice(0, 8).toUpperCase()}</p>
      </div>

      <div style="margin-bottom: 24px;">
        <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Venue</p>
        <h3 style="margin: 0; color: #ffffff; font-size: 18px; font-weight: 600;">${cafeName}</h3>
      </div>

      <div style="display: flex; gap: 24px; margin-bottom: 24px;">
        <div style="flex: 1;">
          <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Date</p>
          <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600;">${bookingDate}</p>
        </div>
        <div style="flex: 1;">
          <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Time</p>
          <p style="margin: 0; color: #ffffff; font-size: 15px; font-weight: 600;">${startTime}</p>
        </div>
      </div>

      <div style="padding-top: 20px; border-top: 1px solid #334155;">
        <p style="margin: 0 0 8px; color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Refund Amount</p>
        <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700;">${formatCurrency(totalAmount)}</p>
      </div>
    </div>

    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
      If you did not request this cancellation, please contact the venue immediately.
    </p>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: `Booking Cancelled: #${bookingId.slice(0, 8).toUpperCase()}`,
    html: emailTemplate(content, 'Booking Cancelled'),
  });
}

// Welcome Email
export interface WelcomeEmailParams {
  email: string;
  name?: string;
}

export async function sendWelcomeEmail({ email, name }: WelcomeEmailParams) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmygame.in';

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 28px; font-weight: 800;">Welcome to BookMyGame!</h2>
      <p style="margin: 0; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
        Hi ${name || 'Gamer'},<br>
        Ready to level up your gaming experience? You're in!
      </p>
    </div>

    <div style="background-color: #0f172a; border-radius: 16px; padding: 32px; margin-bottom: 32px; border: 1px solid #334155;">
      <h3 style="margin: 0 0 20px; color: #10b981; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Get Started</h3>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #e2e8f0; font-size: 15px; line-height: 2;">
        <li>🎮 Browse top-tier gaming cafes near you</li>
        <li>🕹️ Book PS5, Xbox, PC, and Racing Sims instantly</li>
        <li>🏆 Join community tournaments & events</li>
        <li>💎 Earn rewards on every booking</li>
      </ul>
    </div>

    <div style="text-align: center;">
      <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4); transition: transform 0.2s;">
        Explore Cafes Now
      </a>
    </div>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: 'Welcome to BookMyGame!',
    html: emailTemplate(content, 'Welcome'),
  });
}
