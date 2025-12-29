-- Create station_pricing table
CREATE TABLE IF NOT EXISTS station_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  station_type TEXT NOT NULL, -- 'PC', 'PS5', 'PS4', 'Xbox', 'VR', 'Steering', 'Pool', 'Snooker', 'Arcade'
  station_number INTEGER NOT NULL, -- 1, 2, 3, etc.
  station_name TEXT NOT NULL, -- e.g., 'PC-01', 'PS5-01', etc.
  hourly_rate DECIMAL(10, 2), -- For single player (PC, VR, Steering, Pool, Snooker, Arcade)
  single_player_rate DECIMAL(10, 2), -- For gaming consoles (PS5, PS4, Xbox)
  multi_player_rate DECIMAL(10, 2), -- For gaming consoles (PS5, PS4, Xbox)
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cafe_id, station_name)
);

-- Create index for faster queries
CREATE INDEX idx_station_pricing_cafe ON station_pricing(cafe_id);
CREATE INDEX idx_station_pricing_type ON station_pricing(station_type);

-- Enable RLS
ALTER TABLE station_pricing ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read station pricing
CREATE POLICY "Allow public read access to station pricing"
ON station_pricing FOR SELECT
USING (true);

-- Policy: Authenticated users with owner/admin role can manage station pricing
CREATE POLICY "Allow owners to manage their station pricing"
ON station_pricing FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = auth.uid()
    AND p.role IN ('owner', 'admin', 'super_admin')
  )
);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_station_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on changes
CREATE TRIGGER station_pricing_updated_at
BEFORE UPDATE ON station_pricing
FOR EACH ROW
EXECUTE FUNCTION update_station_pricing_updated_at();
