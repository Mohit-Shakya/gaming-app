-- Allow updates to walk-in bookings without authentication
-- This fixes the issue where owner dashboard cannot edit walk-in bookings
-- because it uses localStorage auth instead of Supabase auth

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own booking items" ON booking_items;

-- Recreate with walk-in support
CREATE POLICY "Users and walk-ins can update bookings"
ON bookings
FOR UPDATE
USING (
  -- Walk-in bookings can be updated without auth
  source = 'walk-in'
  OR
  -- Regular authenticated users
  auth.uid() = user_id
  OR
  -- Cafe owners can update bookings for their cafes
  EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND cafes.owner_id = auth.uid()
  )
  OR
  -- Admins can update any booking
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
  )
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  source = 'walk-in'
  OR
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND cafes.owner_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
  )
);

-- Update booking_items policy to allow updates for walk-in bookings
CREATE POLICY "Users and walk-ins can update booking items"
ON booking_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_items.booking_id
    AND (
      -- Allow if parent booking is walk-in
      bookings.source = 'walk-in'
      OR
      bookings.user_id = auth.uid()
      OR
      EXISTS (
        SELECT 1 FROM cafes
        WHERE cafes.id = bookings.cafe_id
        AND cafes.owner_id = auth.uid()
      )
      OR
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
      )
    )
  )
);

COMMENT ON POLICY "Users and walk-ins can update bookings" ON bookings IS
  'Allows updates to walk-in bookings without authentication, and authenticated updates for user/owner/admin bookings';

COMMENT ON POLICY "Users and walk-ins can update booking items" ON booking_items IS
  'Allows updates to booking items for walk-in bookings without authentication';
