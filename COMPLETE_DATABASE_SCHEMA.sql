-- COMPLETE CLEMENTINE APP DATABASE SCHEMA
-- Run this entire script in your new Supabase SQL Editor

-- ============================================================================
-- 1. CREATE PROFILES TABLE (Main user storage)
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    session_id TEXT,
    last_session_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    personal_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_personal_data ON profiles USING GIN (personal_data);

-- ============================================================================
-- 2. CREATE CONVERSATIONS TABLE (Chat conversations)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Conversation',
    conversation_summary TEXT,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_message TEXT
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

-- ============================================================================
-- 3. CREATE MESSAGES TABLE (Individual chat messages)
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    personal_data JSONB DEFAULT '{}',
    emotional_tone TEXT,
    confidence_score DECIMAL(3,2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_personal_data ON messages USING GIN (personal_data);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);

-- ============================================================================
-- 4. CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to update conversation message count
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE conversations 
        SET message_count = message_count + 1,
            updated_at = NOW(),
            last_message = NEW.content
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE conversations 
        SET message_count = message_count - 1,
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update message count
DROP TRIGGER IF EXISTS trigger_update_message_count ON messages;
CREATE TRIGGER trigger_update_message_count
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_conversations_updated_at ON conversations;
CREATE TRIGGER trigger_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 5. CREATE USEFUL VIEWS
-- ============================================================================

-- View for user memory summary
CREATE OR REPLACE VIEW user_memory_summary AS
SELECT 
    p.id as user_id,
    p.first_name,
    p.email,
    p.session_id,
    p.personal_data,
    p.last_session_date,
    COUNT(DISTINCT c.id) as conversation_count,
    COUNT(m.id) as total_messages,
    MAX(c.updated_at) as last_conversation_date,
    COALESCE(
        string_agg(DISTINCT c.title, ', ' ORDER BY c.title), 
        'No conversations'
    ) as conversation_titles
FROM profiles p
LEFT JOIN conversations c ON p.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY p.id, p.first_name, p.email, p.session_id, p.personal_data, p.last_session_date;

-- ============================================================================
-- 6. INSERT TEST USERS (Clementine App Test Data)
-- ============================================================================

-- Insert test users with the exact data we've been using
INSERT INTO profiles (id, first_name, email, session_id, last_session_date, personal_data) VALUES
(
    'b47ac10b-58cc-4372-a567-0e02b2c3d479',
    'Alice',
    'alice@test.com',
    'vf_b47ac10b-58cc-4372-a567-0e02b2c3d479_' || extract(epoch from now())::bigint || '_alice',
    NOW() - INTERVAL '2 days',
    '{"attachmentStyle": ["secure"], "relationshipStatus": ["in relationship"], "familyInfo": ["close with parents"], "conversationTopics": ["relationship advice"]}'::jsonb
),
(
    'c47ac10b-58cc-4372-a567-0e02b2c3d480',
    'Bob',
    'bob@test.com',
    'vf_c47ac10b-58cc-4372-a567-0e02b2c3d480_' || extract(epoch from now())::bigint || '_bob',
    NOW() - INTERVAL '1 day',
    '{"attachmentStyle": ["anxious"], "relationshipStatus": ["single"], "familyInfo": ["distant from family"], "emotionalTriggers": ["fear of abandonment"], "conversationTopics": ["dating anxiety"]}'::jsonb
),
(
    'd47ac10b-58cc-4372-a567-0e02b2c3d481',
    'Charlie',
    'charlie@test.com',
    'vf_d47ac10b-58cc-4372-a567-0e02b2c3d481_' || extract(epoch from now())::bigint || '_charlie',
    NOW() - INTERVAL '3 hours',
    '{"attachmentStyle": ["avoidant"], "relationshipStatus": ["complicated"], "familyInfo": ["only child"], "importantDates": ["anniversary: June 12"], "conversationTopics": ["commitment issues"]}'::jsonb
),
(
    'e47ac10b-58cc-4372-a567-0e02b2c3d482',
    'DOT',
    'dot@mail.com',
    'vf_e47ac10b-58cc-4372-a567-0e02b2c3d482_' || extract(epoch from now())::bigint || '_dot',
    NOW() - INTERVAL '30 minutes',
    '{"attachmentStyle": ["secure"], "relationshipStatus": ["single"], "familyInfo": ["close with sister"], "importantDates": ["birthday: March 15"], "emotionalTriggers": ["stress about work"], "conversationTopics": ["career", "self-improvement"]}'::jsonb
),
(
    'f47ac10b-58cc-4372-a567-0e02b2c3d483',
    'Sarah',
    'sarah@test.com',
    'vf_f47ac10b-58cc-4372-a567-0e02b2c3d483_' || extract(epoch from now())::bigint || '_sarah',
    NOW() - INTERVAL '1 hour',
    '{"attachmentStyle": ["anxious"], "relationshipStatus": ["dating"], "familyInfo": ["close with mom"], "emotionalTriggers": ["jealousy", "overthinking"], "conversationTopics": ["relationship communication", "trust issues"]}'::jsonb
);

-- ============================================================================
-- 7. INSERT SAMPLE CONVERSATIONS AND MESSAGES
-- ============================================================================

-- Sample conversation for DOT
INSERT INTO conversations (id, user_id, title, conversation_summary, created_at, updated_at) VALUES
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d490',
    'e47ac10b-58cc-4372-a567-0e02b2c3d482',
    'Career Stress Discussion',
    'User discussed work anxiety and stress management strategies',
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '1 hour'
);

-- Sample messages for the conversation
INSERT INTO messages (conversation_id, content, role, personal_data, timestamp) VALUES
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d490',
    'Hi Clementine, I''ve been feeling really stressed about work lately.',
    'user',
    '{"extractedInfo": ["work stress", "anxiety"], "emotionalTone": "anxious", "topics": ["career", "stress management"]}'::jsonb,
    NOW() - INTERVAL '2 hours'
),
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d490',
    'I understand you''re feeling stressed about work. That can be really challenging. What specific aspects of work are causing you the most stress?',
    'assistant',
    '{}'::jsonb,
    NOW() - INTERVAL '2 hours' + INTERVAL '30 seconds'
),
(
    'a47ac10b-58cc-4372-a567-0e02b2c3d490',
    'It''s mostly deadlines and my perfectionist tendencies. I worry I''m not good enough.',
    'user',
    '{"extractedInfo": ["perfectionism", "imposter syndrome", "deadline anxiety"], "emotionalTone": "worried", "topics": ["self-doubt", "work performance"]}'::jsonb,
    NOW() - INTERVAL '2 hours' + INTERVAL '1 minute'
);

-- ============================================================================
-- 8. SET PERMISSIONS (Disable RLS for development)
-- ============================================================================

-- Disable Row Level Security for development ease
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Grant permissions to all roles
GRANT ALL ON profiles TO authenticated, anon, service_role;
GRANT ALL ON conversations TO authenticated, anon, service_role;
GRANT ALL ON messages TO authenticated, anon, service_role;
GRANT SELECT ON user_memory_summary TO authenticated, anon, service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;

-- ============================================================================
-- 9. VERIFICATION QUERIES
-- ============================================================================

-- Verify table creation and data
SELECT 'VERIFICATION COMPLETE' as status;

SELECT 'profiles' as table_name, count(*) as row_count FROM profiles
UNION ALL
SELECT 'conversations' as table_name, count(*) as row_count FROM conversations
UNION ALL
SELECT 'messages' as table_name, count(*) as row_count FROM messages;

-- Show sample data
SELECT 'Sample Users:' as info;
SELECT first_name, email, 
       CASE WHEN personal_data IS NOT NULL THEN 'Has personal data' ELSE 'No personal data' END as data_status
FROM profiles 
ORDER BY last_session_date DESC;

-- ============================================================================
-- SCHEMA CREATION COMPLETE! 
-- Your Clementine app database is ready to use.
-- ============================================================================
