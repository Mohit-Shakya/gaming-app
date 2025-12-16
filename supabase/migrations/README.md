# Database Migrations

## Current Migrations

### 20251216133400_add_customer_info_to_bookings.sql
Adds customer information fields for walk-in bookings:
- `customer_name` - Name of walk-in customer
- `customer_phone` - Phone number of walk-in customer

### 20251216142000_disable_rls_for_bookings.sql
Disables Row Level Security on `bookings` and `booking_items` tables to allow:
- Success page to display booking details
- Walk-in bookings (user_id = null) to be accessible

### 20251216143000_disable_rls_cafes.sql
Disables Row Level Security on `cafes` table to allow:
- Success page to load cafe details (name, social media links)

## Important Notes

- RLS is currently disabled on `bookings`, `booking_items`, and `cafes` tables
- This allows the booking success page to work for both authenticated and anonymous users
- In production, consider re-enabling RLS with proper policies for public read access
