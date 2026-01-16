// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendLoginAlert, sendWelcomeEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (code) {
    // Create a server-side Supabase client for the auth exchange
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Session exchange error:', sessionError);
    }

    // Send email notifications after successful login
    if (sessionData?.user) {
      const user = sessionData.user;
      const userEmail = user.email;
      const userName = user.user_metadata?.full_name || user.user_metadata?.name;

      if (userEmail) {
        // Check if this is a new user (created within last 60 seconds)
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const isNewUser = (now.getTime() - createdAt.getTime()) < 60000;

        // Format login time
        const loginTime = now.toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata'
        });

        // Get device info from user agent
        const userAgent = req.headers.get('user-agent') || '';
        const device = parseUserAgent(userAgent);

        // Send emails - must await on serverless platforms
        try {
          console.log('Sending login alert to:', userEmail);
          if (isNewUser) {
            console.log('New user detected, sending welcome email');
            await sendWelcomeEmail({ email: userEmail, name: userName });
          }
          const loginResult = await sendLoginAlert({
            email: userEmail,
            name: userName,
            loginTime,
            device,
          });
          console.log('Login alert result:', loginResult);
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
        }
      }
    }
  }

  // Redirect to a client-side page that can read sessionStorage
  return NextResponse.redirect(new URL("/auth/callback/finish", req.url));
}

// Parse user agent to get device info
function parseUserAgent(ua: string): string {
  if (!ua) return 'Unknown device';

  let browser = 'Unknown browser';
  let os = 'Unknown OS';

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return `${browser} on ${os}`;
}