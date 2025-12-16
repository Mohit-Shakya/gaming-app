-- Add customer information fields to bookings table for walk-in customers
-- This allows storing customer name and phone without requiring a user account

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);

-- Add comments explaining the columns
COMMENT ON COLUMN bookings.customer_name IS 'Customer name for walk-in bookings. NULL for online bookings (use user_id instead).';
COMMENT ON COLUMN bookings.customer_phone IS 'Customer phone number for walk-in bookings. NULL for online bookings (use user_id instead).';
