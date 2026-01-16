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
  // Website Red Theme
  const colors = {
    bg: '#000000',           // Pure Black
    card: '#111111',         // Almost Black
    border: '#222222',       // Dark Gray
    primary: '#ef4444',      // Red 500
    primaryDark: '#b91c1c',  // Red 700
    textMain: '#ffffff',
    textMuted: '#9ca3af'     // Gray 400
  };

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <!--[if mso]>
  <xml>
    <o:OfficeDocumentSettings>
      <o:PixelsPerInch>96</o:PixelsPerInch>
    </o:OfficeDocumentSettings>
  </xml>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; background-color: ${colors.bg}; }
    table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    td, th { padding: 0; }
    .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: ${colors.bg}; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-center { text-align: center !important; }
      .mobile-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="background-color: ${colors.bg}; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: ${colors.textMain};">
  
  <center role="article" aria-roledescription="email" lang="en" style="width: 100%; background-color: ${colors.bg};">
    
    <!-- Main Container -->
    <table align="center" role="presentation" class="email-container" style="margin: 0 auto; background-color: ${colors.bg};">
      
      <!-- Top Spacer -->
      <tr><td style="height: 40px;">&nbsp;</td></tr>

      <!-- Brand Logo -->
      <tr>
        <td style="padding-bottom: 30px; text-align: center;">
           <span style="font-size: 24px; font-weight: 900; color: ${colors.textMain}; letter-spacing: 2px; text-transform: uppercase; font-style: italic;">
              BOOK<span style="color: ${colors.primary};">MY</span>GAME
           </span>
        </td>
      </tr>

      <!-- Content Card -->
      <tr>
        <td style="background-color: ${colors.card}; border: 1px solid ${colors.border}; border-top: 4px solid ${colors.primary}; border-radius: 4px; padding: 40px 30px;" class="mobile-padding">
          ${content}
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding: 30px 20px; text-align: center;">
          <p style="margin: 0 0 10px; color: ${colors.textMuted}; font-size: 13px;">
            Questions? Contact <a href="mailto:support@bookmygame.in" style="color: ${colors.primary}; text-decoration: none;">support@bookmygame.in</a>
          </p>
          <p style="margin: 0; color: #52525b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
            &copy; ${new Date().getFullYear()} BookMyGame
          </p>
        </td>
      </tr>

      <!-- Bottom Spacer -->
      <tr><td style="height: 40px;">&nbsp;</td></tr>

    </table>
  </center>
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
    <!-- Centered Icon -->
    <table role="presentation" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td align="center">
           <img src="https://img.icons8.com/ios-filled/100/ef4444/security-checked.png" alt="Security" width="50" height="50" style="display: block; width: 50px; border: 0;" />
        </td>
      </tr>
    </table>

    <h1 style="margin: 0 0 10px; font-size: 22px; font-weight: 700; text-align: center; color: #ffffff; text-transform: uppercase; letter-spacing: 1px;">New Login</h1>
    <p style="margin: 0 0 30px; color: #9ca3af; font-size: 15px; line-height: 1.5; text-align: center;">
      We detected a new login to your BookMyGame account.
    </p>

    <!-- Info Table -->
    <table role="presentation" width="100%" style="background-color: #000000; border: 1px solid #222222; border-radius: 4px;">
      <tr>
        <td style="padding: 20px;">
          <table role="presentation" width="100%">
            <tr>
              <td style="padding-bottom: 12px; border-bottom: 1px solid #222222; font-size: 13px; color: #ef4444; font-weight: 600; text-transform: uppercase;">Time</td>
              <td style="padding-bottom: 12px; border-bottom: 1px solid #222222; font-size: 14px; color: #ffffff; text-align: right;">${loginTime}</td>
            </tr>
            ${device ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #222222; font-size: 13px; color: #ef4444; font-weight: 600; text-transform: uppercase;">Device</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #222222; font-size: 14px; color: #ffffff; text-align: right;">${device}</td>
            </tr>
            ` : ''}
            ${location ? `
            <tr>
              <td style="padding-top: 12px; font-size: 13px; color: #ef4444; font-weight: 600; text-transform: uppercase;">Location</td>
              <td style="padding-top: 12px; font-size: 14px; color: #ffffff; text-align: right;">${location}</td>
            </tr>
            ` : ''}
          </table>
        </td>
      </tr>
    </table>

    <div style="margin-top: 30px; text-align: center;">
      <a href="#" style="color: #6b7280; font-size: 12px; text-decoration: underline;">Secure my account</a>
    </div>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: '⚠️ New Login Detected',
    html: emailTemplate(content, 'Security Alert'),
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
      <td style="padding: 15px 0; border-bottom: 1px solid #222222;">
        <span style="display: block; color: #ffffff; font-size: 14px; font-weight: 700;">${ticket.console}</span>
        <span style="display: block; color: #9ca3af; font-size: 12px; margin-top: 4px;">Player(s): ${ticket.quantity}</span>
      </td>
      <td style="padding: 15px 0; border-bottom: 1px solid #222222; text-align: right; vertical-align: middle;">
        <span style="color: #ef4444; font-size: 14px; font-weight: 700;">${formatCurrency(ticket.price)}</span>
      </td>
    </tr>
  `).join('');

  const content = `
    <!-- Icon -->
    <table role="presentation" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td align="center">
           <img src="https://img.icons8.com/ios-filled/100/ef4444/checked-checkbox.png" alt="Success" width="50" height="50" style="display: block; width: 50px; border: 0;" />
        </td>
      </tr>
    </table>

    <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 800; text-align: center; color: #ffffff; text-transform: uppercase;">Booking Confirmed</h1>
    <p style="margin: 0 0 30px; color: #9ca3af; font-size: 15px; text-align: center;">
      Game on, ${name || 'Player'}. Your slot is locked.
    </p>

    <!-- Booking ID -->
    <div style="background-color: #ef4444; color: #ffffff; font-weight: 700; text-align: center; padding: 12px; border-radius: 4px; margin-bottom: 30px; font-size: 16px; letter-spacing: 1px;">
       ID: #${bookingId.slice(0, 8).toUpperCase()}
    </div>

    <!-- Venue Info -->
    <div style="margin-bottom: 30px;">
       <h3 style="margin: 0 0 5px; color: #ffffff; font-size: 18px;">${cafeName}</h3>
       ${cafeAddress ? `<p style="margin: 0; color: #9ca3af; font-size: 13px;">${cafeAddress}</p>` : ''}
    </div>

    <!-- Date/Time Grid -->
    <table role="presentation" width="100%" style="margin-bottom: 30px; border-top: 1px solid #222222; border-bottom: 1px solid #222222;">
      <tr>
        <td style="padding: 15px 0; width: 33%; text-align: left; border-right: 1px solid #222222;">
          <span style="display: block; color: #ef4444; font-size: 11px; text-transform: uppercase; font-weight: 700;">Date</span>
          <span style="display: block; color: #ffffff; font-size: 14px; margin-top: 4px;">${bookingDate}</span>
        </td>
        <td style="padding: 15px 15px; width: 33%; text-align: left; border-right: 1px solid #222222;">
          <span style="display: block; color: #ef4444; font-size: 11px; text-transform: uppercase; font-weight: 700;">Time</span>
          <span style="display: block; color: #ffffff; font-size: 14px; margin-top: 4px;">${startTime}</span>
        </td>
        <td style="padding: 15px 0; width: 33%; text-align: right;">
          <span style="display: block; color: #ef4444; font-size: 11px; text-transform: uppercase; font-weight: 700;">Duration</span>
          <span style="display: block; color: #ffffff; font-size: 14px; margin-top: 4px;">${duration} min</span>
        </td>
      </tr>
    </table>

    <!-- Tickets -->
    <div>
      <h4 style="margin: 0 0 10px; color: #ffffff; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Order Summary</h4>
      <table role="presentation" width="100%" style="border-collapse: collapse;">
        ${ticketRows}
        <tr>
          <td style="padding-top: 15px;">
            <span style="color: #ffffff; font-size: 16px; font-weight: 700;">Total</span>
          </td>
          <td style="padding-top: 15px; text-align: right;">
            <span style="color: #ef4444; font-size: 20px; font-weight: 800;">${formatCurrency(totalAmount)}</span>
          </td>
        </tr>
      </table>
    </div>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: `Booking Confirmed: ${cafeName}`,
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
     <!-- Icon -->
    <table role="presentation" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td align="center">
           <img src="https://img.icons8.com/ios-filled/100/ef4444/cancel.png" alt="Cancelled" width="50" height="50" style="display: block; width: 50px; border: 0;" />
        </td>
      </tr>
    </table>

    <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 800; text-align: center; color: #ffffff; text-transform: uppercase;">Order Cancelled</h1>
    <p style="margin: 0 0 30px; color: #9ca3af; font-size: 15px; text-align: center;">
      Booking <span style="color: #ffffff; font-weight: 600;">#${bookingId.slice(0, 8).toUpperCase()}</span> has been cancelled.
    </p>

    <!-- Info Box -->
    <div style="background-color: #000000; border: 1px solid #222222; padding: 20px; border-radius: 4px;">
      <div style="border-bottom: 1px solid #222222; padding-bottom: 15px; margin-bottom: 15px;">
        <span style="display: block; color: #ef4444; font-size: 11px; text-transform: uppercase; font-weight: 700; margin-bottom: 5px;">Venue</span>
        <span style="display: block; color: #ffffff; font-size: 16px;">${cafeName}</span>
      </div>

       <div style="border-bottom: 1px solid #222222; padding-bottom: 15px; margin-bottom: 15px;">
        <span style="display: block; color: #ef4444; font-size: 11px; text-transform: uppercase; font-weight: 700; margin-bottom: 5px;">Original Time</span>
        <span style="display: block; color: #ffffff; font-size: 16px;">${bookingDate} @ ${startTime}</span>
      </div>

       <div>
        <span style="display: block; color: #ef4444; font-size: 11px; text-transform: uppercase; font-weight: 700; margin-bottom: 5px;">Refund Amount</span>
        <span style="display: block; color: #ffffff; font-size: 20px; font-weight: 700;">${formatCurrency(totalAmount)}</span>
      </div>
    </div>

    <p style="margin: 25px 0 0; color: #6b7280; font-size: 13px; text-align: center;">
      If you strongly believe this is a mistake, please reach out to support.
    </p>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: `Cancelled: #${bookingId.slice(0, 8).toUpperCase()}`,
    html: emailTemplate(content, 'Booking Cancelled'),
  });
}

// Welcome Email
export interface WelcomeEmailParams {
  email: string;
  name?: string;
  bookingId?: string;
}

export async function sendWelcomeEmail({ email, name }: WelcomeEmailParams) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://bookmygame.in';

  const content = `
    <!-- Icon -->
    <table role="presentation" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td align="center">
           <img src="https://img.icons8.com/ios-filled/100/ef4444/controller.png" alt="Controller" width="60" height="60" style="display: block; width: 60px; border: 0;" />
        </td>
      </tr>
    </table>

    <h1 style="margin: 0 0 10px; font-size: 28px; font-weight: 900; text-align: center; color: #ffffff; text-transform: uppercase; font-style: italic;">WELCOME</h1>
    <p style="margin: 0 0 30px; color: #9ca3af; font-size: 16px; line-height: 1.6; text-align: center;">
      Hi ${name || 'Gamer'},<br>
      You're now ready to book the best setups in town.
    </p>

    <!-- Features -->
    <table role="presentation" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #222222;">
          <table role="presentation" width="100%">
            <tr>
              <td width="30" style="vertical-align: middle;">🔴</td>
              <td style="padding-left: 15px;">
                <span style="display: block; color: #ffffff; font-weight: 700; font-size: 14px;">High-End PCs & Consoles</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 15px; border-bottom: 1px solid #222222;">
          <table role="presentation" width="100%">
            <tr>
              <td width="30" style="vertical-align: middle;">🔴</td>
              <td style="padding-left: 15px;">
                <span style="display: block; color: #ffffff; font-weight: 700; font-size: 14px;">Exclusive Tournaments</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 15px;">
          <table role="presentation" width="100%">
            <tr>
              <td width="30" style="vertical-align: middle;">🔴</td>
              <td style="padding-left: 15px;">
                <span style="display: block; color: #ffffff; font-weight: 700; font-size: 14px;">Instant Bookings</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- CTA -->
    <div style="text-align: center;">
      <a href="${siteUrl}" style="display: inline-block; padding: 16px 40px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: 800; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">Start Now</a>
    </div>
  `;

  return sendEmail({
    to: email,
    toName: name,
    subject: 'Welcome to BookMyGame',
    html: emailTemplate(content, 'Welcome'),
  });
}
