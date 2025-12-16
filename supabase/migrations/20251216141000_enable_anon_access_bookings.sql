-- Enable anonymous access to bookings and booking_items for success page
-- This allows the success page to load booking details without authentication

-- First, ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start fresh
DO $$
BEGIN
  -- Drop all policies on bookings
  DROP POLICY IF EXISTS "Allow read access to bookings by ID" ON bookings;
  DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
  DROP POLICY IF EXISTS "Owners can update their cafe bookings" ON bookings;
  DROP POLICY IF EXISTS "Owners can delete their cafe bookings" ON bookings;
  DROP POLICY IF EXISTS "Enable read access for all users" ON bookings;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON bookings;

  -- Drop all policies on booking_items
  DROP POLICY IF EXISTS "Allow read access to booking_items" ON booking_items;
  DROP POLICY IF EXISTS "Users can insert booking items" ON booking_items;
  DROP POLICY IF EXISTS "Owners can update booking items" ON booking_items;
  DROP POLICY IF EXISTS "Owners can delete booking items" ON booking_items;
  DROP POLICY IF EXISTS "Enable read access for all users" ON booking_items;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON booking_items;
END $$;

-- Create new simple policies that allow anonymous read access

-- Bookings: Allow anyone (including anon) to read
CREATE POLICY "anon_read_bookings"
ON bookings
FOR SELECT
TO public
USING (true);

-- Bookings: Allow anyone to insert (for walk-in bookings)
CREATE POLICY "anon_insert_bookings"
ON bookings
FOR INSERT
TO public
WITH CHECK (true);

-- Bookings: Only owners can update
CREATE POLICY "owner_update_bookings"
ON bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND cafes.owner_id = auth.uid()
  )
);

-- Bookings: Only owners can delete
CREATE POLICY "owner_delete_bookings"
ON bookings
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND cafes.owner_id = auth.uid()
  )
);

-- Booking Items: Allow anyone (including anon) to read
CREATE POLICY "anon_read_booking_items"
ON booking_items
FOR SELECT
TO public
USING (true);

-- Booking Items: Allow anyone to insert
CREATE POLICY "anon_insert_booking_items"
ON booking_items
FOR INSERT
TO public
WITH CHECK (true);

-- Booking Items: Only owners can update
CREATE POLICY "owner_update_booking_items"
ON booking_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN cafes c ON c.id = b.cafe_id
    WHERE b.id = booking_items.booking_id
    AND c.owner_id = auth.uid()
  )
);

-- Booking Items: Only owners can delete
CREATE POLICY "owner_delete_booking_items"
ON booking_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM bookings b
    JOIN cafes c ON c.id = b.cafe_id
    WHERE b.id = booking_items.booking_id
    AND c.owner_id = auth.uid()
  )
);
