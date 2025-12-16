-- Add duration column to bookings table
-- This column stores the booking duration in minutes (30, 60, 90, 120, 180)

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 60;

-- Add comment to the column
COMMENT ON COLUMN bookings.duration IS 'Booking duration in minutes (30, 60, 90, 120, 180). Default is 60 minutes (1 hour).';

-- Add a check constraint to ensure valid duration values
ALTER TABLE bookings
ADD CONSTRAINT bookings_duration_check
CHECK (duration > 0 AND duration <= 300);
