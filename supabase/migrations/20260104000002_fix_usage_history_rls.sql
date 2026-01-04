-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Allow owners to view subscription usage" ON subscription_usage_history;
DROP POLICY IF EXISTS "Allow owners to insert subscription usage" ON subscription_usage_history;

-- Create more permissive policies that work with localStorage auth
-- Allow anyone with a valid subscription_id to insert usage history
CREATE POLICY "Allow subscription usage insert"
ON subscription_usage_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM subscriptions s
    WHERE s.id = subscription_usage_history.subscription_id
  )
);

-- Allow anyone with a valid subscription_id to view usage history
CREATE POLICY "Allow subscription usage select"
ON subscription_usage_history FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM subscriptions s
    WHERE s.id = subscription_usage_history.subscription_id
  )
);
