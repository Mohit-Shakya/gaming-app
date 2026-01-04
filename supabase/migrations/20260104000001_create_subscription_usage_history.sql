-- Create subscription usage history table
CREATE TABLE IF NOT EXISTS subscription_usage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_hours DECIMAL(10, 4) NOT NULL, -- Hours used in this session
  assigned_console_station TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT duration_positive CHECK (duration_hours > 0)
);

-- Create indexes for faster queries
CREATE INDEX idx_subscription_usage_subscription ON subscription_usage_history(subscription_id);
CREATE INDEX idx_subscription_usage_date ON subscription_usage_history(session_date DESC);

-- Enable RLS
ALTER TABLE subscription_usage_history ENABLE ROW LEVEL SECURITY;

-- Policy: Allow owners to view usage history for their subscriptions
CREATE POLICY "Allow owners to view subscription usage"
ON subscription_usage_history FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM subscriptions s
    INNER JOIN cafes c ON c.id = s.cafe_id
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = subscription_usage_history.subscription_id
    AND p.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Policy: Allow owners to insert usage history
CREATE POLICY "Allow owners to insert subscription usage"
ON subscription_usage_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM subscriptions s
    INNER JOIN cafes c ON c.id = s.cafe_id
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE s.id = subscription_usage_history.subscription_id
    AND p.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Comment
COMMENT ON TABLE subscription_usage_history IS 'Tracks each session/usage of a membership subscription';
