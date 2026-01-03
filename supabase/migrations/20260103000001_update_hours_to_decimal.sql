-- Update subscriptions table to use DECIMAL for hours fields to support fractional hours
-- This allows tracking partial hours (e.g., 4.75 hours) when using timers

-- Change hours_purchased from INTEGER to DECIMAL(10, 2)
ALTER TABLE subscriptions
ALTER COLUMN hours_purchased TYPE DECIMAL(10, 2);

-- Change hours_remaining from INTEGER to DECIMAL(10, 2)
ALTER TABLE subscriptions
ALTER COLUMN hours_remaining TYPE DECIMAL(10, 2);

-- Drop the old constraint
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS hours_remaining_valid;

-- Add updated constraint that works with DECIMAL
ALTER TABLE subscriptions
ADD CONSTRAINT hours_remaining_valid CHECK (hours_remaining >= 0 AND hours_remaining <= hours_purchased);

-- Comment
COMMENT ON COLUMN subscriptions.hours_purchased IS 'Total hours purchased (supports decimals for precise tracking)';
COMMENT ON COLUMN subscriptions.hours_remaining IS 'Hours remaining (supports decimals for timer precision)';
