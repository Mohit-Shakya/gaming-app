-- Add assigned console station tracking to subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS assigned_console_station TEXT;

-- Comment
COMMENT ON COLUMN subscriptions.assigned_console_station IS 'The specific console station assigned when timer is active (e.g., "ps5-01", "pc-02")';
