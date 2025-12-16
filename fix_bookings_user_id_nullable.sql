-- Make user_id nullable in bookings table to support walk-in customers
-- Walk-in customers don't have user accounts, so user_id should be NULL

ALTER TABLE bookings
ALTER COLUMN user_id DROP NOT NULL;

-- Add comment explaining the nullable user_id
COMMENT ON COLUMN bookings.user_id IS 'User ID for online bookings. NULL for walk-in customers who book directly at the café.';
