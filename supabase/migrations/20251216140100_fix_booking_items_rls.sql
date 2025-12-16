-- Allow anyone to read booking_items for the success page
-- This is needed for displaying booking details on the confirmation page

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their booking items" ON booking_items;
DROP POLICY IF EXISTS "Allow public read access to booking_items" ON booking_items;

-- Create new policy that allows reading any booking_items
CREATE POLICY "Allow read access to booking_items"
ON booking_items
FOR SELECT
USING (true);

-- Allow authenticated users and walk-in bookings to insert items
DROP POLICY IF EXISTS "Users can insert booking items" ON booking_items;
CREATE POLICY "Users can insert booking items"
ON booking_items
FOR INSERT
WITH CHECK (true);

-- Only owners can update booking items
DROP POLICY IF EXISTS "Owners can update booking items" ON booking_items;
CREATE POLICY "Owners can update booking items"
ON booking_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN cafes c ON c.id = b.cafe_id
    WHERE b.id = booking_items.booking_id
    AND c.owner_id = auth.uid()
  )
);

-- Only owners can delete booking items
DROP POLICY IF EXISTS "Owners can delete booking items" ON booking_items;
CREATE POLICY "Owners can delete booking items"
ON booking_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN cafes c ON c.id = b.cafe_id
    WHERE b.id = booking_items.booking_id
    AND c.owner_id = auth.uid()
  )
);
