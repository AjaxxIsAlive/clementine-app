-- MIGRATION SCRIPT: Fix existing user data
-- This will migrate your existing localStorage user to Supabase

-- First, let's see what's in the tables currently
SELECT 'Current user_profiles count' as info, count(*) as value FROM user_profiles
UNION ALL
SELECT 'Current user_memory count' as info, count(*) as value FROM user_memory;

-- Show current table structure
SELECT 'user_profiles columns' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
UNION ALL
SELECT 'user_memory columns' as table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_memory'
ORDER BY table_name, column_name;

-- Create the user profile for your existing user if it doesn't exist
INSERT INTO user_profiles (user_id, email, name, created_at, updated_at)
VALUES (
  'clementine_anthonypaulsmail_gmail_com_1753922654482',
  'anthonypaulsmail@gmail.com', 
  'anthonypaulsmail',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- Create the memory record for your existing user if it doesn't exist
INSERT INTO user_memory (
  user_id, 
  user_name, 
  user_age, 
  session_count, 
  last_active_date,
  created_at, 
  updated_at
) VALUES (
  'clementine_anthonypaulsmail_gmail_com_1753922654482',
  'anthonypaulsmail',
  '25',
  47,
  '2025-07-31T18:05:16.727Z',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify the data was inserted
SELECT 'After migration - user_profiles' as table_name, count(*) as count FROM user_profiles
UNION ALL
SELECT 'After migration - user_memory' as table_name, count(*) as count FROM user_memory;

-- Show the actual data
SELECT 'user_profiles data' as type, user_id, email, name FROM user_profiles;
SELECT 'user_memory data' as type, user_id, user_name, session_count FROM user_memory;
