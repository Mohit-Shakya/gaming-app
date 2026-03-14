-- Secure owner-managed tables now that owner access is handled through
-- authenticated Next.js API routes backed by the service role.

-- SUBSCRIPTIONS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow owners to view their subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Allow owners to manage their subscriptions" ON subscriptions;

-- No direct client access to subscriptions. All owner operations now go
-- through server routes and the service role key.

-- COUPONS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Cafe owners can manage their coupons" ON coupons;
DROP POLICY IF EXISTS "Public can read active coupons" ON coupons;
DROP POLICY IF EXISTS "Cafe owners can select their coupons" ON coupons;
DROP POLICY IF EXISTS "Cafe owners can insert coupons" ON coupons;
DROP POLICY IF EXISTS "Cafe owners can update their coupons" ON coupons;
DROP POLICY IF EXISTS "Cafe owners can delete their coupons" ON coupons;

DROP POLICY IF EXISTS "Cafe owners can view coupon usage" ON coupon_usage;
DROP POLICY IF EXISTS "System can insert coupon usage" ON coupon_usage;

CREATE POLICY "Public can read active coupons"
ON coupons
FOR SELECT
USING (
  is_active = true
  AND valid_from <= now()
  AND (valid_until IS NULL OR valid_until >= now())
);

-- MEMBERSHIP PLANS
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active membership plans" ON membership_plans;
DROP POLICY IF EXISTS "Allow owners to manage their membership plans" ON membership_plans;

CREATE POLICY "Public can read active membership plans"
ON membership_plans
FOR SELECT
USING (is_active = true);
