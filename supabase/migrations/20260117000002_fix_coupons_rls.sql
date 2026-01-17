-- Fix RLS for coupons table - disable RLS since we use custom auth

-- Drop existing policies if any
DROP POLICY IF EXISTS "Cafe owners can manage their coupons" ON coupons;
DROP POLICY IF EXISTS "Public can read active coupons" ON coupons;
DROP POLICY IF EXISTS "Cafe owners can select their coupons" ON coupons;
DROP POLICY IF EXISTS "Cafe owners can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Cafe owners can update their coupons" ON coupons;
DROP POLICY IF EXISTS "Cafe owners can delete their coupons" ON coupons;

-- Disable RLS as we are using custom auth (not Supabase auth)
ALTER TABLE coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage DISABLE ROW LEVEL SECURITY;
