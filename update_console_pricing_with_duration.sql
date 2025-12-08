-- Update console_pricing table to support quantity-based tier pricing with duration options (30min and 60min)
-- This allows cafes to set different prices for different quantities AND different durations
-- Example: PS5 | 1 Console | 30min: ₹75, PS5 | 1 Console | 60min: ₹150
--          PS5 | 2 Consoles | 30min: ₹125, PS5 | 2 Consoles | 60min: ₹250

-- Drop the existing table
DROP TABLE IF EXISTS console_pricing;

-- Create new table with quantity AND duration_minutes columns
CREATE TABLE console_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  console_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 4),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 60)),
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cafe_id, console_type, quantity, duration_minutes)
);

-- Add comment to table
COMMENT ON TABLE console_pricing IS 'Stores quantity and duration-based pricing for gaming consoles. Each row represents the price for a specific quantity and duration of a console type at a cafe.';

-- Add comments to columns
COMMENT ON COLUMN console_pricing.cafe_id IS 'References the cafe that owns this pricing';
COMMENT ON COLUMN console_pricing.console_type IS 'Type of console (ps5, ps4, xbox, pc, pool, arcade, snooker, steering_wheel, vr)';
COMMENT ON COLUMN console_pricing.quantity IS 'Number of consoles (1-4). Different quantities can have different prices.';
COMMENT ON COLUMN console_pricing.duration_minutes IS 'Session duration in minutes (30 or 60). Different durations have different prices.';
COMMENT ON COLUMN console_pricing.price IS 'Price for this quantity and duration combination';

-- Create indexes for faster lookups
CREATE INDEX idx_console_pricing_cafe ON console_pricing(cafe_id);
CREATE INDEX idx_console_pricing_console ON console_pricing(cafe_id, console_type);
CREATE INDEX idx_console_pricing_full ON console_pricing(cafe_id, console_type, quantity, duration_minutes);
