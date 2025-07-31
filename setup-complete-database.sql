-- COMPLETE SUPABASE DATABASE SETUP
-- Copy and paste this ENTIRE script into your Supabase SQL Editor and run it

-- First, let's check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_profiles', 'user_memory');

-- Drop existing tables if they exist (to start fresh)
DROP TABLE IF EXISTS user_memory CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE user_profiles (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_memory table
CREATE TABLE user_memory (
    user_id TEXT PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
    user_name TEXT DEFAULT '',
    user_age TEXT DEFAULT '',
    user_location TEXT DEFAULT '',
    user_occupation TEXT DEFAULT '',
    relationship_status TEXT DEFAULT 'single',
    partner_name TEXT DEFAULT '',
    relationship_duration TEXT DEFAULT '',
    relationship_goals TEXT DEFAULT '',
    current_challenges TEXT DEFAULT '',
    communication_style TEXT DEFAULT '',
    last_topic_discussed TEXT DEFAULT '',
    user_mood TEXT DEFAULT '',
    session_count INTEGER DEFAULT 1,
    last_active_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_memory_session_count ON user_memory(session_count);
CREATE INDEX idx_user_memory_last_active ON user_memory(last_active_date);

-- Create RLS policies (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_memory" ON user_memory FOR ALL USING (true);

-- Create a function to increment session count safely
CREATE OR REPLACE FUNCTION increment_session_count(target_user_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE user_memory 
    SET 
        session_count = session_count + 1,
        last_active_date = NOW(),
        updated_at = NOW()
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create sample data for testing
INSERT INTO user_profiles (user_id, email, name) VALUES
('clementine_anthony_anthonypaulsmailgmailcom_1753991265954', 'anthonypaulsmail@gmail.com', 'Anthony'),
('clementine_user_sarah_sarahjohnsonemail_1753991265955', 'sarah.johnson@email.com', 'Sarah Johnson'),
('clementine_user_michael_michaelchenemail_1753991265956', 'michael.chen@email.com', 'Michael Chen'),
('clementine_user_emma_emmabrownmail_1753991265957', 'emma.brown@mail.com', 'Emma Brown')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_memory (user_id, user_name, user_age, user_occupation, relationship_status, session_count) VALUES
('clementine_anthony_anthonypaulsmailgmailcom_1753991265954', 'Anthony', '56', 'Bum', 'single', 1),
('clementine_user_sarah_sarahjohnsonemail_1753991265955', 'Sarah Johnson', '28', 'Designer', 'single', 1),
('clementine_user_michael_michaelchenemail_1753991265956', 'Michael Chen', '34', 'Engineer', 'married', 1),
('clementine_user_emma_emmabrownmail_1753991265957', 'Emma Brown', '25', 'Teacher', 'in a relationship', 1)
ON CONFLICT (user_id) DO NOTHING;

-- Verify everything was created correctly
SELECT 'user_profiles count' as info, count(*) as count FROM user_profiles
UNION ALL
SELECT 'user_memory count' as info, count(*) as count FROM user_memory;

-- Show all user data
SELECT 
    p.user_id,
    p.email,
    p.name,
    m.user_age,
    m.user_occupation,
    m.relationship_status,
    m.session_count,
    m.last_active_date
FROM user_profiles p
LEFT JOIN user_memory m ON p.user_id = m.user_id
ORDER BY p.name;

-- Show table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_memory' 
ORDER BY ordinal_position;
