-- VOICEFLOW AI ASSISTANT SUPABASE SCHEMA
-- Run this in your Supabase SQL Editor to set up the new schema

-- Drop existing tables if they exist (to start fresh with VoiceFlow AI schema)
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS user_memory CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Users table (as specified by VoiceFlow AI)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  returning_user BOOLEAN DEFAULT FALSE,
  session_count INTEGER DEFAULT 1,
  last_session TIMESTAMP DEFAULT NOW()
);

-- Conversation history table (as specified by VoiceFlow AI)
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  message TEXT,
  response TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Additional user profile data (extending VoiceFlow AI schema)
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  age TEXT,
  occupation TEXT,
  location TEXT,
  relationship_status TEXT DEFAULT 'single',
  partner_name TEXT,
  relationship_duration TEXT,
  relationship_goals TEXT,
  current_challenges TEXT,
  communication_style TEXT,
  last_topic_discussed TEXT,
  user_mood TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_timestamp ON conversations(timestamp);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_users_last_session ON users(last_session);

-- Create RLS policies (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (you can make this more restrictive later)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_profiles" ON user_profiles FOR ALL USING (true);

-- Function to increment session count safely
CREATE OR REPLACE FUNCTION increment_user_session(target_user_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET 
        session_count = session_count + 1,
        last_session = NOW(),
        returning_user = true
    WHERE user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create or update user
CREATE OR REPLACE FUNCTION upsert_user(
    target_user_id TEXT,
    user_email TEXT DEFAULT NULL,
    user_name TEXT DEFAULT NULL
)
RETURNS TABLE(user_id TEXT, session_count INTEGER, returning_user BOOLEAN) AS $$
BEGIN
    INSERT INTO users (user_id, session_count, returning_user)
    VALUES (target_user_id, 1, false)
    ON CONFLICT (user_id) DO UPDATE SET
        session_count = users.session_count + 1,
        last_session = NOW(),
        returning_user = true;
    
    -- Also create/update profile if data provided
    IF user_email IS NOT NULL OR user_name IS NOT NULL THEN
        INSERT INTO user_profiles (user_id, email, name, updated_at)
        VALUES (target_user_id, user_email, user_name, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            email = COALESCE(EXCLUDED.email, user_profiles.email),
            name = COALESCE(EXCLUDED.name, user_profiles.name),
            updated_at = NOW();
    END IF;
    
    RETURN QUERY SELECT u.user_id, u.session_count, u.returning_user
    FROM users u WHERE u.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create sample data for testing
INSERT INTO users (user_id, session_count, returning_user) VALUES
('clementine_anthony_anthonypaulsmailgmailcom_1753991265954', 1, false),
('clementine_user_sarah_sarahjohnsonemail_1753991265955', 1, false),
('clementine_user_michael_michaelchenemail_1753991265956', 1, false),
('clementine_user_emma_emmabrownmail_1753991265957', 1, false)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO user_profiles (user_id, email, name, age, occupation, relationship_status) VALUES
('clementine_anthony_anthonypaulsmailgmailcom_1753991265954', 'anthonypaulsmail@gmail.com', 'Anthony', '56', 'Bum', 'single'),
('clementine_user_sarah_sarahjohnsonemail_1753991265955', 'sarah.johnson@email.com', 'Sarah Johnson', '28', 'Designer', 'single'),
('clementine_user_michael_michaelchenemail_1753991265956', 'michael.chen@email.com', 'Michael Chen', '34', 'Engineer', 'married'),
('clementine_user_emma_emmabrownmail_1753991265957', 'emma.brown@mail.com', 'Emma Brown', '25', 'Teacher', 'in a relationship')
ON CONFLICT (user_id) DO NOTHING;

-- Verify everything was created correctly
SELECT 'users count' as info, count(*) as count FROM users
UNION ALL
SELECT 'conversations count' as info, count(*) as count FROM conversations
UNION ALL
SELECT 'user_profiles count' as info, count(*) as count FROM user_profiles;

-- Show all user data
SELECT 
    u.user_id,
    u.session_count,
    u.returning_user,
    u.last_session,
    p.email,
    p.name,
    p.age,
    p.occupation,
    p.relationship_status
FROM users u
LEFT JOIN user_profiles p ON u.user_id = p.user_id
ORDER BY p.name;
