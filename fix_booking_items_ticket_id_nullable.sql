-- Make ticket_id nullable in booking_items table
-- ticket_id is only needed for ticketed events, not for regular console bookings

ALTER TABLE booking_items
ALTER COLUMN ticket_id DROP NOT NULL;

-- Add comment explaining when ticket_id is used
COMMENT ON COLUMN booking_items.ticket_id IS 'Ticket ID for special events or tournaments. NULL for regular console bookings.';
