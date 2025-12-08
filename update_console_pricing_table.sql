-- Update console_pricing table to support quantity-based tier pricing
-- This allows cafes to set different prices for different quantities of consoles
-- Example: PS5 | 1 Console: ₹150/hr, 2 Consoles: ₹250/hr, 3 Consoles: ₹350/hr, 4 Consoles: ₹450/hr

-- Drop the existing table
DROP TABLE IF EXISTS console_pricing;

-- Create new table with quantity column
CREATE TABLE console_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID NOT NULL REFERENCES cafes(id) ON DELETE CASCADE,
  console_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 1 AND quantity <= 4),
  hourly_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cafe_id, console_type, quantity)
);

-- Add comment to table
COMMENT ON TABLE console_pricing IS 'Stores quantity-based pricing for gaming consoles. Each row represents the price for a specific quantity of a console type at a cafe.';

-- Add comments to columns
COMMENT ON COLUMN console_pricing.cafe_id IS 'References the cafe that owns this pricing';
COMMENT ON COLUMN console_pricing.console_type IS 'Type of console (ps5, ps4, xbox, pc, pool, arcade, snooker, steering_wheel, vr)';
COMMENT ON COLUMN console_pricing.quantity IS 'Number of consoles (1-4). Different quantities can have different prices.';
COMMENT ON COLUMN console_pricing.hourly_price IS 'Price per hour for this quantity of consoles';

-- Create index for faster lookups
CREATE INDEX idx_console_pricing_cafe ON console_pricing(cafe_id);
CREATE INDEX idx_console_pricing_console ON console_pricing(cafe_id, console_type);
