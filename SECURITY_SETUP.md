# Security Setup Guide

This guide explains the security features implemented and how to configure them properly.

## ✅ Implemented Security Features

### 1. Row Level Security (RLS)
- **Status**: ✅ Implemented
- **File**: `supabase/migrations/20251218100000_enable_rls_security.sql`
- **What it does**:
  - Users can only view their own bookings
  - Cafe owners can view bookings for their cafes
  - Admins can view all bookings
  - Prevents unauthorized data access

### 2. Rate Limiting
- **Status**: ✅ Implemented
- **Files**:
  - `src/lib/ratelimit.ts`
  - `src/middleware.ts`
- **Limits**:
  - Booking creation: 10 requests per 10 minutes per IP
  - API routes: 100 requests per minute per IP
  - Authentication: 5 requests per 5 minutes per IP
- **Fallback**: In-memory rate limiting for development (when Redis not configured)

### 3. Input Sanitization
- **Status**: ✅ Implemented
- **File**: `src/lib/sanitize.ts`
- **Features**:
  - XSS prevention (HTML tag removal)
  - Email validation
  - Phone number sanitization (Indian format)
  - URL validation
  - Date/time validation
  - UUID validation
  - Enum validation

### 4. Security Headers
- **Status**: ✅ Implemented
- **File**: `src/middleware.ts`
- **Headers added**:
  - `X-Frame-Options: DENY` (prevent clickjacking)
  - `X-Content-Type-Options: nosniff` (prevent MIME sniffing)
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy` (restrict resource loading)

---

## 🔧 Setup Instructions

### Step 1: Apply Database Migration

Run the RLS migration to enable Row Level Security:

\`\`\`bash
supabase db push
\`\`\`

This will:
- Enable RLS on `bookings`, `booking_items`, and `cafes` tables
- Create policies for secure data access
- Protect against unauthorized database queries

### Step 2: Configure Rate Limiting (Production)

For production, set up Upstash Redis for distributed rate limiting:

1. **Create Upstash Account**:
   - Go to [upstash.com](https://upstash.com)
   - Create a new Redis database (free tier available)

2. **Get Credentials**:
   - Copy the REST URL
   - Copy the REST Token

3. **Add to Environment Variables**:

   Add to `.env.local` (development) and Vercel environment variables (production):

   \`\`\`env
   UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-redis-token-here
   \`\`\`

4. **Verify**:
   - If Redis is configured, distributed rate limiting will be used
   - If not configured, in-memory fallback will be used (development only)

### Step 3: Update Booking Creation Code

Add rate limiting and sanitization to your booking creation logic.

Example for checkout page:

\`\`\`typescript
import { rateLimit, bookingRateLimiter } from "@/lib/ratelimit";
import { sanitizeText, sanitizeNumber, sanitizeDate } from "@/lib/sanitize";

async function handlePlaceOrder() {
  // 1. Rate limiting check
  const rateLimitResult = await rateLimit(
    new Request(window.location.href),
    bookingRateLimiter,
    10,
    600000 // 10 requests per 10 minutes
  );

  if (!rateLimitResult.success) {
    setError("Too many booking attempts. Please try again later.");
    return;
  }

  // 2. Sanitize inputs
  const sanitizedDate = sanitizeDate(draft.bookingDate);
  const sanitizedAmount = sanitizeNumber(draft.totalAmount, { min: 0, max: 100000 });

  if (!sanitizedDate || !sanitizedAmount) {
    setError("Invalid booking data");
    return;
  }

  // 3. Proceed with booking creation
  // ... rest of your code
}
\`\`\`

---

## 🔒 Security Best Practices

### 1. Environment Variables
- **Never commit** `.env.local` to git
- Use Vercel environment variables for production
- Rotate credentials regularly

### 2. Database Security
- Keep RLS enabled at all times
- Review and audit policies regularly
- Use `auth.uid()` for user identification

### 3. Input Validation
- Always sanitize user inputs before database operations
- Validate on both client and server side
- Use TypeScript types for type safety

### 4. API Security
- Implement rate limiting on all public endpoints
- Use HTTPS only (enforced by Vercel)
- Validate JWT tokens from Supabase

### 5. Monitoring
- Monitor rate limit hits in Upstash dashboard
- Track failed authentication attempts
- Set up alerts for unusual activity

---

## 🚨 Security Checklist

Before going to production, ensure:

- [ ] RLS migration applied (`supabase db push`)
- [ ] Upstash Redis configured (production)
- [ ] Environment variables set in Vercel
- [ ] Rate limiting tested
- [ ] Input sanitization added to all forms
- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Security headers verified
- [ ] API routes protected
- [ ] Sensitive data not logged
- [ ] Error messages don't leak information

---

## 📚 Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Upstash Rate Limiting](https://upstash.com/docs/redis/features/ratelimiting)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)

---

## 🐛 Troubleshooting

### Issue: "Booking creation blocked"
- Check if user is authenticated (`auth.uid()` returns value)
- Verify RLS policies allow the operation
- Check browser console for specific error

### Issue: "Rate limit exceeded"
- Wait for the time window to expire
- In development, rate limits use in-memory store (resets on server restart)
- In production, check Upstash Redis connection

### Issue: "Row Level Security policy violation"
- Verify user has proper role assigned
- Check if booking belongs to authenticated user
- Ensure cafe owner is set correctly

---

**Last Updated**: 2025-12-18
