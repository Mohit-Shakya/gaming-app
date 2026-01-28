-- Fix RLS policies for cash_drawer table
-- This allows owners to insert and manage cash drawer records for their cafes

-- First, ensure RLS is enabled
ALTER TABLE IF EXISTS cash_drawer ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow owners to view their cash drawer" ON cash_drawer;
DROP POLICY IF EXISTS "Allow owners to insert cash drawer records" ON cash_drawer;
DROP POLICY IF EXISTS "Allow owners to update their cash drawer" ON cash_drawer;

-- Policy: Allow owners/admins to SELECT their cafe's cash drawer records
CREATE POLICY "Allow owners to view their cash drawer"
ON cash_drawer FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM cafes c
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = cash_drawer.cafe_id
    AND p.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Policy: Allow owners/admins to INSERT cash drawer records for their cafes
CREATE POLICY "Allow owners to insert cash drawer records"
ON cash_drawer FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM cafes c
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = cash_drawer.cafe_id
    AND p.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Policy: Allow owners/admins to UPDATE their cafe's cash drawer records
CREATE POLICY "Allow owners to update their cash drawer"
ON cash_drawer FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM cafes c
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = cash_drawer.cafe_id
    AND p.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Also fix subscriptions RLS policy to allow reading with .in() filter
-- Drop and recreate more permissive select policy
DROP POLICY IF EXISTS "Allow owners to view their subscriptions" ON subscriptions;

CREATE POLICY "Allow owners to view their subscriptions"
ON subscriptions FOR SELECT
USING (
  cafe_id IN (
    SELECT c.id
    FROM cafes c
    INNER JOIN profiles p ON p.id = auth.uid()
    WHERE p.role IN ('owner', 'admin', 'super_admin')
  )
  OR
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  )
);

-- Comment
COMMENT ON POLICY "Allow owners to view their cash drawer" ON cash_drawer IS 'Allows cafe owners to view their cash drawer records';
COMMENT ON POLICY "Allow owners to insert cash drawer records" ON cash_drawer IS 'Allows cafe owners to create cash drawer records';
COMMENT ON POLICY "Allow owners to update their cash drawer" ON cash_drawer IS 'Allows cafe owners to update their cash drawer records';
