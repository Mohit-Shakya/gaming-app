-- Add google_place_id and instagram_handle columns to cafes table
ALTER TABLE cafes
ADD COLUMN IF NOT EXISTS google_place_id TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

-- Add comments
COMMENT ON COLUMN cafes.google_place_id IS 'Google Place ID for review links';
COMMENT ON COLUMN cafes.instagram_handle IS 'Instagram handle (with or without @)';
