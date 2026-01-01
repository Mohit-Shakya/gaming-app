-- Script to manually update admin credentials
-- Run this using: supabase db remote exec < update_admin_credentials.sql

-- Update admin credentials for all admin users
-- CHANGE THE VALUES BELOW:
UPDATE profiles
SET
    admin_username = 'your_new_username',  -- Change this
    admin_password = 'your_new_password'    -- Change this
WHERE
    (role IN ('admin', 'super_admin') OR is_admin = true);

-- Verify the update
SELECT id, first_name, last_name, admin_username, role, is_admin
FROM profiles
WHERE (role IN ('admin', 'super_admin') OR is_admin = true);
