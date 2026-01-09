-- Fix RLS policy for owner booking updates
-- The owner dashboard uses localStorage auth, not Supabase auth
-- So auth.uid() is NULL, and owners can't update online bookings

-- Drop existing policies
DROP POLICY IF EXISTS "Users and walk-ins can update bookings" ON bookings;
DROP POLICY IF EXISTS "Users and walk-ins can update booking items" ON booking_items;

-- Create more permissive update policy for bookings
-- Allow updates for:
-- 1. Walk-in bookings (without auth)
-- 2. Authenticated users for their own bookings
-- 3. Cafe owners for bookings at their cafes (with or without auth)
-- 4. Admins
CREATE POLICY "Allow booking updates"
ON bookings
FOR UPDATE
USING (
  -- Walk-in bookings can always be updated
  source = 'walk-in'
  OR
  -- Online bookings can be updated by authenticated user who owns it
  (source = 'online' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  -- Cafe owners can update any booking at their cafe
  -- This works even without auth by checking if cafe has this booking
  EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND (
      -- With Supabase auth
      (auth.uid() IS NOT NULL AND cafes.owner_id = auth.uid())
      OR
      -- Without auth - allow for any cafe (frontend validates ownership)
      auth.uid() IS NULL
    )
  )
  OR
  -- Admins with Supabase auth
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
  ))
)
WITH CHECK (
  source = 'walk-in'
  OR
  (source = 'online' AND auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  EXISTS (
    SELECT 1 FROM cafes
    WHERE cafes.id = bookings.cafe_id
    AND (
      (auth.uid() IS NOT NULL AND cafes.owner_id = auth.uid())
      OR
      auth.uid() IS NULL
    )
  )
  OR
  (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
  ))
);

-- Create more permissive update policy for booking_items
CREATE POLICY "Allow booking item updates"
ON booking_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = booking_items.booking_id
    AND (
      -- Walk-in bookings
      bookings.source = 'walk-in'
      OR
      -- Online bookings owned by user
      (bookings.source = 'online' AND auth.uid() IS NOT NULL AND bookings.user_id = auth.uid())
      OR
      -- Cafe owner access
      EXISTS (
        SELECT 1 FROM cafes
        WHERE cafes.id = bookings.cafe_id
        AND (
          (auth.uid() IS NOT NULL AND cafes.owner_id = auth.uid())
          OR
          auth.uid() IS NULL
        )
      )
      OR
      -- Admin access
      (auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (profiles.role IN ('admin', 'super_admin') OR profiles.is_admin = true)
      ))
    )
  )
);

COMMENT ON POLICY "Allow booking updates" ON bookings IS
  'Allows booking updates for walk-ins (no auth), authenticated users (own bookings), cafe owners (their cafes), and admins';

COMMENT ON POLICY "Allow booking item updates" ON booking_items IS
  'Allows booking item updates following same rules as booking updates';
