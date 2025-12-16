-- Make title nullable in booking_items table
-- title is optional for console bookings (only needed for special named items/events)

ALTER TABLE booking_items
ALTER COLUMN title DROP NOT NULL;

-- Add comment explaining when title is used
COMMENT ON COLUMN booking_items.title IS 'Optional title/name for the booking item. Used for special events or named packages. NULL for standard console bookings.';
