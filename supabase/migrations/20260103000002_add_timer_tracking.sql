-- Add timer tracking fields to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS timer_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS timer_start_time TIMESTAMPTZ;

-- Create index for faster queries on active timers
CREATE INDEX IF NOT EXISTS idx_subscriptions_timer_active ON subscriptions(timer_active) WHERE timer_active = true;

-- Comment
COMMENT ON COLUMN subscriptions.timer_active IS 'Whether a timer is currently running for this subscription';
COMMENT ON COLUMN subscriptions.timer_start_time IS 'Timestamp when the current timer was started (null if not running)';
