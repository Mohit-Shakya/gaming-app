-- Add per-controller pricing fields for gaming consoles (PS5, PS4, Xbox)
-- Support for 1-4 controllers for both half-hour and full-hour durations

ALTER TABLE station_pricing
ADD COLUMN controller_1_half_hour DECIMAL(10, 2), -- 1 controller, 30 minutes
ADD COLUMN controller_1_full_hour DECIMAL(10, 2), -- 1 controller, 60 minutes
ADD COLUMN controller_2_half_hour DECIMAL(10, 2), -- 2 controllers, 30 minutes
ADD COLUMN controller_2_full_hour DECIMAL(10, 2), -- 2 controllers, 60 minutes
ADD COLUMN controller_3_half_hour DECIMAL(10, 2), -- 3 controllers, 30 minutes
ADD COLUMN controller_3_full_hour DECIMAL(10, 2), -- 3 controllers, 60 minutes
ADD COLUMN controller_4_half_hour DECIMAL(10, 2), -- 4 controllers, 30 minutes
ADD COLUMN controller_4_full_hour DECIMAL(10, 2); -- 4 controllers, 60 minutes

-- Add comments for clarity
COMMENT ON COLUMN station_pricing.controller_1_half_hour IS 'Price for 1 controller, 30 minutes (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.controller_1_full_hour IS 'Price for 1 controller, 60 minutes (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.controller_2_half_hour IS 'Price for 2 controllers, 30 minutes (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.controller_2_full_hour IS 'Price for 2 controllers, 60 minutes (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.controller_3_half_hour IS 'Price for 3 controllers, 30 minutes (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.controller_3_full_hour IS 'Price for 3 controllers, 60 minutes (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.controller_4_half_hour IS 'Price for 4 controllers, 30 minutes (PS5, PS4, Xbox)';
COMMENT ON COLUMN station_pricing.controller_4_full_hour IS 'Price for 4 controllers, 60 minutes (PS5, PS4, Xbox)';
