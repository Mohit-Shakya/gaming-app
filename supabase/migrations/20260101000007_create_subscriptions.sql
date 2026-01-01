-- Create subscriptions table for customer membership subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  membership_plan_id UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  hours_purchased INTEGER NOT NULL, -- Total hours in the package
  hours_remaining INTEGER NOT NULL, -- Hours left to use
  amount_paid DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT hours_remaining_valid CHECK (hours_remaining >= 0 AND hours_remaining <= hours_purchased)
);

-- Create index for faster queries
CREATE INDEX idx_subscriptions_cafe ON subscriptions(cafe_id);
CREATE INDEX idx_subscriptions_phone ON subscriptions(customer_phone);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expiry ON subscriptions(expiry_date);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users with owner/admin role can view their cafe's subscriptions
CREATE POLICY "Allow owners to view their subscriptions"
ON subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM cafes c
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = subscriptions.cafe_id
    AND p.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Policy: Authenticated users with owner/admin role can manage subscriptions
CREATE POLICY "Allow owners to manage their subscriptions"
ON subscriptions FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM cafes c
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = subscriptions.cafe_id
    AND p.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_updated_at();

-- Function to automatically mark expired subscriptions
CREATE OR REPLACE FUNCTION check_subscription_expiry()
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired'
  WHERE expiry_date < now()
  AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE subscriptions IS 'Customer membership subscriptions with hour-based packages';
