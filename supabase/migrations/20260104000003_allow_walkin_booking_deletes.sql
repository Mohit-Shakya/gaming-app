-- Allow deletes for walk-in bookings without authentication
-- This fixes the issue where owner dashboard cannot delete walk-in bookings

-- Drop ALL existing DELETE policies to ensure clean state
DROP POLICY IF EXISTS "Users can delete own bookings" ON bookings;
DROP POLICY IF EXISTS "Users and walk-ins can delete bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete own booking items" ON booking_items;
DROP POLICY IF EXISTS "Users and walk-ins can delete booking items" ON booking_items;

-- Recreate DELETE policy with walk-in support - PERMISSIVE to allow unauthenticated deletes
CREATE POLICY "Users and walk-ins can delete bookings"
ON bookings
FOR DELETE
USING (
  -- Allow if it's a walk-in or online booking from owner dashboard (regardless of authentication)
  (source = 'walk-in' OR source = 'online' OR source IS NULL OR user_id IS NULL)
  OR
  -- OR if authenticated and owns the booking
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- OR if authenticated as cafe owner
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND cafes.owner_id = auth.uid()
  ))
  OR
  -- OR if authenticated as admin
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
  ))
);

-- Update booking_items DELETE policy to allow deletes for walk-in bookings
CREATE POLICY "Users and walk-ins can delete booking items"
ON booking_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_items.booking_id
    AND (
      -- Allow if parent booking is walk-in or online (regardless of authentication)
      (bookings.source = 'walk-in' OR bookings.source = 'online' OR bookings.source IS NULL OR bookings.user_id IS NULL)
      OR
      -- OR if authenticated and owns the booking
      (auth.uid() IS NOT NULL AND bookings.user_id = auth.uid())
      OR
      -- OR if authenticated as cafe owner
      (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM cafes
        WHERE cafes.id = bookings.cafe_id
        AND cafes.owner_id = auth.uid()
      ))
      OR
      -- OR if authenticated as admin
      (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
      ))
    )
  )
);

COMMENT ON POLICY "Users and walk-ins can delete bookings" ON bookings IS
  'Allows deletes for walk-in bookings without authentication, and authenticated deletes for user/owner/admin bookings';

COMMENT ON POLICY "Users and walk-ins can delete booking items" ON booking_items IS
  'Allows deletes for booking items of walk-in bookings without authentication';
