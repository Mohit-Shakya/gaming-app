# Deployment Guide

Complete guide to deploy your gaming cafe booking application to production.

---

## Prerequisites

- GitHub account with your repository
- Vercel account (free tier available)
- Supabase project (already configured)
- Upstash account (free tier available - optional but recommended)

---

## Step 1: Set Up Upstash Redis (Rate Limiting)

Upstash provides distributed rate limiting for your production app. Without it, rate limiting will use in-memory storage (resets on server restart).

### 1.1 Create Upstash Account

1. Go to [console.upstash.com](https://console.upstash.com)
2. Sign up with GitHub (recommended) or email
3. Verify your email if required

### 1.2 Create Redis Database

1. Click **"Create Database"** button
2. Configure your database:
   - **Name**: `gaming-app-ratelimit` (or any name you prefer)
   - **Type**: Select **Regional** (cheaper, sufficient for MVP)
   - **Region**: Choose closest to your primary users (e.g., `ap-south-1` for India)
   - **TLS**: Keep enabled (recommended)
3. Click **"Create"**

### 1.3 Get Redis Credentials

After creation, you'll see the database dashboard:

1. Copy **REST URL** (looks like: `https://your-db-name.upstash.io`)
2. Copy **REST Token** (long alphanumeric string)
3. Keep these safe - you'll add them to Vercel in the next step

**Important**: Never commit these credentials to GitHub!

---

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your gaming-app repository
5. Click **"Import"**

### 2.2 Configure Project Settings

1. **Framework Preset**: Next.js (should auto-detect)
2. **Root Directory**: `./` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)

### 2.3 Add Environment Variables

Click **"Environment Variables"** and add the following:

#### Required Variables:

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL = https://your-vercel-app.vercel.app

# Supabase (copy from your .env.local)
NEXT_PUBLIC_SUPABASE_URL = https://wdlfajgaojkfbhbhlgkb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google OAuth (copy from your .env.local)
NEXT_PUBLIC_GOOGLE_CLIENT_ID = 14922944498-65aiec6qd08vsu1d3bhru09vcp6d0knf.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET = 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
```

#### Upstash Redis (Optional but Recommended):

```bash
UPSTASH_REDIS_REST_URL = https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN = your-redis-token-here
```

**Note**:
- If you skip Upstash, rate limiting will use in-memory fallback
- For production, Upstash is highly recommended for proper distributed rate limiting

### 2.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like `https://gaming-app-xyz.vercel.app`

---

## Step 3: Update Google OAuth

After deployment, update your Google OAuth configuration:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services > Credentials**
3. Click on your OAuth 2.0 Client ID
4. Add to **Authorized JavaScript origins**:
   ```
   https://your-vercel-app.vercel.app
   ```
5. Add to **Authorized redirect URIs**:
   ```
   https://your-vercel-app.vercel.app/auth/callback
   https://wdlfajgaojkfbhbhlgkb.supabase.co/auth/v1/callback
   ```
6. Click **"Save"**

---

## Step 4: Update Supabase Settings

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication > URL Configuration**
4. Add to **Site URL**:
   ```
   https://your-vercel-app.vercel.app
   ```
5. Add to **Redirect URLs**:
   ```
   https://your-vercel-app.vercel.app/**
   ```
6. Click **"Save"**

---

## Step 5: Configure Custom Domain (Optional)

### 5.1 Add Domain in Vercel

1. Go to your project in Vercel
2. Click **Settings > Domains**
3. Enter your domain: `www.bookmygame.co.in`
4. Click **"Add"**

### 5.2 Update DNS Records

Add these records in your domain registrar (e.g., GoDaddy, Namecheap):

**For www.bookmygame.co.in:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

**For bookmygame.co.in (root domain):**
```
Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

### 5.3 Update Environment Variables

After domain is active, update in Vercel:
```bash
NEXT_PUBLIC_SITE_URL = https://www.bookmygame.co.in
```

Also update Google OAuth and Supabase redirect URLs with your custom domain.

---

## Step 6: Verify Deployment

### 6.1 Test Core Features

- ✅ Homepage loads with cafe list
- ✅ User can sign in with Google
- ✅ User can create a booking
- ✅ Booking appears in user's bookings page
- ✅ Owner can see bookings for their cafe
- ✅ Admin can see all bookings

### 6.2 Test Security Features

1. **Rate Limiting**: Try creating 10+ bookings rapidly - should get rate limited
2. **RLS**: Try accessing another user's booking - should be blocked
3. **Security Headers**: Check response headers in browser DevTools

### 6.3 Check Upstash Dashboard

If you set up Upstash:
1. Go to Upstash Console
2. Select your database
3. Click **"Data Browser"** tab
4. You should see keys like `ratelimit:booking:xxx` after making requests

---

## Step 7: Monitoring & Analytics

### 7.1 Vercel Analytics

1. Go to your project in Vercel
2. Click **Analytics** tab
3. Monitor page views, performance, errors

### 7.2 Upstash Analytics

1. Go to Upstash Console
2. Select your database
3. Check **Analytics** tab for:
   - Request count
   - Rate limit hits
   - Database usage

### 7.3 Supabase Logs

1. Go to Supabase Dashboard
2. Click **Logs** in sidebar
3. Monitor database queries and errors

---

## Troubleshooting

### Issue: "Rate limit exceeded" immediately

**Solution**:
- If using in-memory fallback, restart the Vercel deployment
- If using Upstash, check that credentials are correct in Vercel environment variables

### Issue: "Auth callback URL not allowed"

**Solution**:
- Verify Google OAuth redirect URLs include your Vercel domain
- Verify Supabase redirect URLs include your Vercel domain
- Wait 5-10 minutes for DNS propagation

### Issue: "Row Level Security policy violation"

**Solution**:
- Ensure RLS migration was applied (`supabase db push`)
- Check user is authenticated before making bookings
- Verify user has correct role in `profiles` table

### Issue: Custom domain not working

**Solution**:
- Verify DNS records are correct (use `dig` or `nslookup`)
- Wait 24-48 hours for full DNS propagation
- Check Vercel domain settings for SSL certificate status

---

## Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] Google OAuth redirect URLs updated
- [ ] Supabase redirect URLs updated
- [ ] Upstash Redis configured (or accepting in-memory fallback)
- [ ] Custom domain configured (if applicable)
- [ ] All core features tested
- [ ] Security features verified
- [ ] Monitoring dashboards checked
- [ ] Error tracking enabled

---

## Next Steps

After successful deployment:

1. **Payment Integration**: Implement Razorpay for actual payment processing
2. **Email Notifications**: Set up email service for booking confirmations
3. **Performance Optimization**: Monitor and optimize slow pages
4. **User Feedback**: Collect feedback and iterate on features

---

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Upstash Documentation](https://upstash.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

**Last Updated**: 2025-12-19
