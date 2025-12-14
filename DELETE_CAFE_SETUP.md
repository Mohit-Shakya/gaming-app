# Setup: Cafe Deletion Function

The cafe delete functionality requires a database function to properly handle cascading deletes.

## Steps to Set Up

### 1. Run the SQL Function

Go to your Supabase Dashboard:
1. Open your project at https://supabase.com/dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `delete_cafe_cascade.sql`
5. Click **Run** to create the function

### 2. Verify the Function

After running the SQL, you can verify it was created:

```sql
SELECT * FROM pg_proc WHERE proname = 'delete_cafe_cascade';
```

## What It Does

This function:
- Deletes all bookings for the cafe
- Deletes all console pricing records
- Deletes all cafe images
- Finally deletes the cafe itself

All in a transaction, so if any step fails, nothing is deleted.

## Usage

The frontend code will automatically use this function when you click the Delete button in the admin portal.

## Troubleshooting

If you get errors about foreign key constraints:
1. Make sure the function was created successfully
2. Check that you granted execute permissions
3. Verify you're running as an authenticated user with admin rights

## Alternative: Manual Deletion

If you need to delete a cafe manually without the function:

```sql
-- Replace 'your-cafe-id' with the actual UUID
DO $$
DECLARE
  cafe_uuid UUID := 'your-cafe-id';
BEGIN
  DELETE FROM bookings WHERE cafe_id = cafe_uuid;
  DELETE FROM console_pricing WHERE cafe_id = cafe_uuid;
  DELETE FROM cafe_images WHERE cafe_id = cafe_uuid;
  DELETE FROM cafes WHERE id = cafe_uuid;
END $$;
```
