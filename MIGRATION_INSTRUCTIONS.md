# Database Migration Instructions

## Add Instagram URL Column

**File:** `add_instagram_url_column.sql`

### How to Run This Migration

#### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the contents of `add_instagram_url_column.sql`
5. Paste into the SQL editor
6. Click **Run** or press `Ctrl/Cmd + Enter`
7. You should see "Success. No rows returned"

#### Option 2: Command Line (if you have Supabase CLI)
```bash
supabase db execute --file add_instagram_url_column.sql
```

### Verify Migration
After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cafes' AND column_name = 'instagram_url';
```

You should see:
```
column_name    | data_type
---------------+-----------
instagram_url  | text
```

### What This Migration Does
- Adds `instagram_url` column to the `cafes` table
- Type: TEXT (allows NULL values)
- Allows cafe owners to add their Instagram profile URL
- Used in the booking page to display Instagram icon link

### Rollback (if needed)
If you need to remove this column:

```sql
ALTER TABLE cafes DROP COLUMN IF EXISTS instagram_url;
```
