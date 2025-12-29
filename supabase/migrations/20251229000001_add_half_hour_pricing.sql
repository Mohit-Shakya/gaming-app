-- Add half-hour pricing fields to station_pricing table
ALTER TABLE station_pricing
ADD COLUMN half_hour_rate DECIMAL(10, 2), -- For single player half hour (PC, VR, Steering, Pool, Snooker, Arcade)
ADD COLUMN single_player_half_hour_rate DECIMAL(10, 2), -- For gaming consoles half hour (PS5, PS4, Xbox)
ADD COLUMN multi_player_half_hour_rate DECIMAL(10, 2); -- For gaming consoles half hour (PS5, PS4, Xbox)

-- Update existing column comments for clarity
COMMENT ON COLUMN station_pricing.hourly_rate IS 'Full hour rate for single player (PC, VR, Steering, Pool, Snooker, Arcade)';
COMMENT ON COLUMN station_pricing.single_player_rate IS 'Full hour rate for gaming consoles single player (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.multi_player_rate IS 'Full hour rate for gaming consoles multi player (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.half_hour_rate IS 'Half hour rate for single player (PC, VR, Steering, Pool, Snooker, Arcade)';
COMMENT ON COLUMN station_pricing.single_player_half_hour_rate IS 'Half hour rate for gaming consoles single player (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.multi_player_half_hour_rate IS 'Half hour rate for gaming consoles multi player (PS5, PS4, Xbox)';
