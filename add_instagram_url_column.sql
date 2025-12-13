-- Migration: Add instagram_url column to cafes table
-- Date: 2025-12-13
-- Description: Add Instagram URL field to allow cafe owners to link their Instagram profiles

-- Add instagram_url column to cafes table
ALTER TABLE cafes
ADD COLUMN IF NOT EXISTS instagram_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN cafes.instagram_url IS 'Instagram profile URL for the cafe';
