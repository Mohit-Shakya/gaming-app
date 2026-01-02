-- Fix RLS policies for subscriptions table to work with localStorage auth
-- Since we're not using Supabase Auth, we need to disable RLS or use different policies

-- Drop existing policies
DROP POLICY IF EXISTS "Allow owners to view their subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Allow owners to manage their subscriptions" ON subscriptions;

-- Disable RLS on subscriptions table (since we're using localStorage auth, not Supabase Auth)
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;

-- Note: In production, you should implement proper authentication with Supabase Auth
-- and re-enable RLS with appropriate policies. For now, we're disabling it to work
-- with the localStorage-based owner authentication system.
