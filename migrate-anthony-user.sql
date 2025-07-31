-- MIGRATE ANTHONY'S USER TO SUPABASE
-- Run this in your Supabase SQL Editor

-- First, let's see current state
SELECT 'Before migration - user_profiles' as info, count(*) as count FROM user_profiles
UNION ALL
SELECT 'Before migration - user_memory' as info, count(*) as count FROM user_memory;

-- Create Anthony's user profile
INSERT INTO user_profiles (user_id, email, name, created_at, updated_at)
VALUES (
  'clementine_anthony_anthonypaulsmailgmailcom_1753991265954',
  'anthonypaulsmail@gmail.com', 
  'Anthony',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  updated_at = NOW();

-- Create Anthony's memory record with current localStorage data
INSERT INTO user_memory (
  user_id, 
  user_name, 
  user_age, 
  user_occupation,
  relationship_status,
  session_count, 
  last_active_date,
  created_at, 
  updated_at
) VALUES (
  'clementine_anthony_anthonypaulsmailgmailcom_1753991265954',
  'Anthony',
  '56',
  'Bum',
  'single',
  1,  -- Current session count from the logs
  '2025-07-31T19:49:21.438Z',  -- Last active date from the logs
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET
  user_name = EXCLUDED.user_name,
  user_age = EXCLUDED.user_age,
  user_occupation = EXCLUDED.user_occupation,
  relationship_status = EXCLUDED.relationship_status,
  session_count = EXCLUDED.session_count,
  last_active_date = EXCLUDED.last_active_date,
  updated_at = NOW();

-- Verify the migration
SELECT 'After migration - user_profiles' as info, count(*) as count FROM user_profiles
UNION ALL
SELECT 'After migration - user_memory' as info, count(*) as count FROM user_memory;

-- Show Anthony's specific data
SELECT 'Anthony profile data' as type, user_id, email, name, created_at FROM user_profiles 
WHERE user_id = 'clementine_anthony_anthonypaulsmailgmailcom_1753991265954';

SELECT 'Anthony memory data' as type, user_id, user_name, user_age, user_occupation, relationship_status, session_count, last_active_date 
FROM user_memory 
WHERE user_id = 'clementine_anthony_anthonypaulsmailgmailcom_1753991265954';
