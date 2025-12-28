-- Fix existing walk-in bookings to have in-progress status
-- Walk-in customers are already at the cafe, so their sessions should be in-progress

-- Update all walk-in bookings with confirmed status to in-progress
UPDATE bookings
SET status = 'in-progress'
WHERE source = 'walk-in'
AND status = 'confirmed';

-- Create a trigger function to automatically set walk-in bookings to in-progress
CREATE OR REPLACE FUNCTION auto_start_walkin_bookings()
RETURNS TRIGGER AS $$
BEGIN
  -- If it's a walk-in booking being created with confirmed status, change to in-progress
  IF NEW.source = 'walk-in' AND NEW.status = 'confirmed' THEN
    NEW.status := 'in-progress';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_start_walkin ON bookings;

-- Create trigger on INSERT to auto-start walk-in bookings
CREATE TRIGGER trigger_auto_start_walkin
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION auto_start_walkin_bookings();

-- Comment for documentation
COMMENT ON FUNCTION auto_start_walkin_bookings() IS
  'Automatically sets walk-in bookings to in-progress status since customers are already at the cafe';
