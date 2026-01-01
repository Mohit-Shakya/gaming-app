-- Helper script to add consoles to your cafe
-- Replace 'YOUR_CAFE_ID' with your actual cafe ID

-- First, find your cafe ID:
-- SELECT id, name FROM cafes;

-- Then add consoles (uncomment and modify as needed):

-- Add PC consoles (quantity: 10)
-- INSERT INTO cafe_consoles (cafe_id, console_type, quantity, is_active)
-- VALUES ('YOUR_CAFE_ID', 'PC', 10, true);

-- Add PS5 consoles (quantity: 5)
-- INSERT INTO cafe_consoles (cafe_id, console_type, quantity, is_active)
-- VALUES ('YOUR_CAFE_ID', 'PS5', 5, true);

-- Add PS4 consoles (quantity: 3)
-- INSERT INTO cafe_consoles (cafe_id, console_type, quantity, is_active)
-- VALUES ('YOUR_CAFE_ID', 'PS4', 3, true);

-- Add Xbox Series X consoles (quantity: 2)
-- INSERT INTO cafe_consoles (cafe_id, console_type, quantity, is_active)
-- VALUES ('YOUR_CAFE_ID', 'Xbox Series X', 2, true);

-- Add Xbox One consoles (quantity: 2)
-- INSERT INTO cafe_consoles (cafe_id, console_type, quantity, is_active)
-- VALUES ('YOUR_CAFE_ID', 'Xbox One', 2, true);

-- Add Nintendo Switch consoles (quantity: 2)
-- INSERT INTO cafe_consoles (cafe_id, console_type, quantity, is_active)
-- VALUES ('YOUR_CAFE_ID', 'Nintendo Switch', 2, true);

-- Add VR consoles (quantity: 1)
-- INSERT INTO cafe_consoles (cafe_id, console_type, quantity, is_active)
-- VALUES ('YOUR_CAFE_ID', 'VR', 1, true);

-- View all cafe consoles:
-- SELECT * FROM cafe_consoles WHERE cafe_id = 'YOUR_CAFE_ID';
