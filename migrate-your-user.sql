-- MIGRATE YOUR EXISTING USER TO SUPABASE
-- Run this in your Supabase SQL Editor

-- First, let's see current state
SELECT 'Before migration - user_profiles' as info, count(*) as count FROM user_profiles
UNION ALL
SELECT 'Before migration - user_memory' as info, count(*) as count FROM user_memory;

-- Create your specific user profile
INSERT INTO user_profiles (user_id, email, name, created_at, updated_at)
VALUES (
  'clementine_anthonypaulsmail_gmail_com_1753922654482',
  'anthonypaulsmail@gmail.com', 
  'anthonypaulsmail',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Create your specific memory record with current localStorage data
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
  49,  -- Your current session count from the logs
  '2025-07-31T19:25:03.204Z',  -- Your last active date from the logs
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Verify the migration
SELECT 'After migration - user_profiles' as info, count(*) as count FROM user_profiles
UNION ALL
SELECT 'After migration - user_memory' as info, count(*) as count FROM user_memory;

-- Show your specific data
SELECT 'Your profile data' as type, user_id, email, name, created_at FROM user_profiles 
WHERE user_id = 'clementine_anthonypaulsmail_gmail_com_1753922654482';

SELECT 'Your memory data' as type, user_id, user_name, user_age, session_count, last_active_date 
FROM user_memory 
WHERE user_id = 'clementine_anthonypaulsmail_gmail_com_1753922654482';
