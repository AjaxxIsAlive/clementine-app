-- SUPABASE DATABASE SCHEMA SETUP
-- Copy and paste this entire script into your Supabase SQL Editor

-- First, let's see what exists and clean up if needed
-- DROP TABLES IF THEY EXIST (uncomment these lines if you want to start fresh)
-- DROP TABLE IF EXISTS user_memory CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;
-- DROP FUNCTION IF EXISTS increment_session_count(TEXT);
-- DROP FUNCTION IF EXISTS set_config(TEXT, TEXT);

-- Check existing user_profiles table structure and modify if needed
DO $$
BEGIN
    -- Check if user_profiles table exists and has correct columns
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Add email column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'email') THEN
            ALTER TABLE user_profiles ADD COLUMN email TEXT;
        END IF;
        
        -- Add name column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'name') THEN
            ALTER TABLE user_profiles ADD COLUMN name TEXT;
        END IF;
        
        -- Add user_id column if it doesn't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'user_id') THEN
            ALTER TABLE user_profiles ADD COLUMN user_id TEXT UNIQUE;
        END IF;
        
        -- Add timestamps if they don't exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'created_at') THEN
            ALTER TABLE user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'updated_at') THEN
            ALTER TABLE user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        RAISE NOTICE 'Modified existing user_profiles table';
    ELSE
        -- Create user_profiles table from scratch
        CREATE TABLE user_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          name TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created new user_profiles table';
    END IF;
END
$$;

-- Create or replace user_memory table with correct schema
DROP TABLE IF EXISTS user_memory CASCADE;
CREATE TABLE user_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  
  -- Basic Info
  user_name TEXT,
  user_age TEXT,
  user_location TEXT,
  user_occupation TEXT,
  
  -- Relationship Status
  relationship_status TEXT,
  partner_name TEXT,
  relationship_duration TEXT,
  
  -- Goals and Challenges
  relationship_goals TEXT,
  current_challenges TEXT,
  communication_style TEXT,
  
  -- Session Context
  session_count INTEGER DEFAULT 1,
  last_active_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_topic_discussed TEXT,
  user_mood TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key reference
  FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (allow all for development)
-- In production, you'd want more restrictive policies
DROP POLICY IF EXISTS "Enable all operations for all users" ON user_profiles;
CREATE POLICY "Enable all operations for all users" ON user_profiles
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Enable all operations for all users" ON user_memory;
CREATE POLICY "Enable all operations for all users" ON user_memory
  FOR ALL USING (true);

-- Create the set_config function that our code expects
CREATE OR REPLACE FUNCTION set_config(setting_name TEXT, setting_value TEXT)
RETURNS void AS $$
BEGIN
  -- This function is used for RLS context setting
  -- In development, we'll just return without error
  -- PERFORM set_config(setting_name, setting_value, false);
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create the increment_session_count function
CREATE OR REPLACE FUNCTION increment_session_count(target_user_id TEXT)
RETURNS user_memory AS $$
DECLARE
  result user_memory;
BEGIN
  UPDATE user_memory 
  SET 
    session_count = session_count + 1,
    last_active_date = NOW(),
    updated_at = NOW()
  WHERE user_id = target_user_id
  RETURNING * INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON user_profiles TO anon;
GRANT ALL ON user_memory TO anon;
GRANT EXECUTE ON FUNCTION set_config(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION increment_session_count(TEXT) TO anon;

-- Insert test data to verify everything works (only if columns exist)
DO $$
BEGIN
    -- Check if the required columns exist before inserting
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name IN ('user_id', 'email', 'name')
        GROUP BY table_name 
        HAVING COUNT(*) = 3
    ) THEN
        INSERT INTO user_profiles (user_id, email, name) 
        VALUES ('test_user_setup', 'test@setup.com', 'Setup Test User')
        ON CONFLICT (user_id) DO NOTHING;
        
        INSERT INTO user_memory (user_id, user_name, session_count) 
        VALUES ('test_user_setup', 'Setup Test User', 1)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Test data inserted successfully';
    ELSE
        RAISE NOTICE 'Skipping test data insertion - required columns not found';
    END IF;
END
$$;

-- Verify the setup
SELECT 'user_profiles table' as table_name, count(*) as row_count FROM user_profiles
UNION ALL
SELECT 'user_memory table' as table_name, count(*) as row_count FROM user_memory;

-- Test the functions
SELECT set_config('test.setting', 'test_value');
SELECT increment_session_count('test_user_setup');

-- Clean up test data (safely)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_memory') THEN
        DELETE FROM user_memory WHERE user_id = 'test_user_setup';
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        DELETE FROM user_profiles WHERE user_id = 'test_user_setup';
    END IF;
    
    RAISE NOTICE 'Test data cleanup completed';
END
$$;
