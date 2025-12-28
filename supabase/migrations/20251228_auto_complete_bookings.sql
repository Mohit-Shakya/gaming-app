-- Auto-complete bookings that have ended
-- This ensures past bookings don't show as in-progress forever

-- First, complete all past date bookings
UPDATE bookings
SET status = 'completed'
WHERE status = 'in-progress'
AND booking_date < CURRENT_DATE;

-- Create a function to auto-complete bookings that have ended
CREATE OR REPLACE FUNCTION auto_complete_ended_bookings()
RETURNS void AS $$
BEGIN
  -- Update bookings that have ended (past date OR today but time has passed)
  UPDATE bookings
  SET status = 'completed'
  WHERE status = 'in-progress'
  AND (
    -- Past dates
    booking_date < CURRENT_DATE
    OR
    -- Today but session has ended
    (
      booking_date = CURRENT_DATE
      AND (
        -- Calculate end time and check if it's passed
        -- This is a simplified check - you may need to adjust based on your time format
        EXTRACT(EPOCH FROM NOW() - (booking_date || ' ' || start_time)::timestamp) / 60 > duration
      )
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run this every minute (requires pg_cron extension)
-- Note: You'll need to enable pg_cron extension in Supabase if not already enabled
-- If pg_cron is not available, this will need to be called from the application

COMMENT ON FUNCTION auto_complete_ended_bookings() IS
  'Automatically updates in-progress bookings to completed status when their session time has ended';
