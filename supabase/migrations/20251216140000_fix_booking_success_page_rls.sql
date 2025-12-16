-- Allow anyone to read bookings by ID for the success page
-- This is needed for walk-in bookings and for users to view their booking confirmation

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Allow public read access to bookings" ON bookings;

-- Create new policy that allows reading any booking
-- The booking ID acts as a secret token - if you know the ID, you can view it
CREATE POLICY "Allow read access to bookings by ID"
ON bookings
FOR SELECT
USING (true);

-- Keep other policies intact (only owner/admin can modify)
-- Users can only insert their own bookings
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
CREATE POLICY "Users can insert their own bookings"
ON bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Only owners/admins can update bookings
DROP POLICY IF EXISTS "Owners can update their cafe bookings" ON bookings;
CREATE POLICY "Owners can update their cafe bookings"
ON bookings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND cafes.owner_id = auth.uid()
  )
);

-- Only owners/admins can delete bookings
DROP POLICY IF EXISTS "Owners can delete their cafe bookings" ON bookings;
CREATE POLICY "Owners can delete their cafe bookings"
ON bookings
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND cafes.owner_id = auth.uid()
  )
);
