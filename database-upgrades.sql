npm -- SQL UPGRADES FOR ENHANCED PERSISTENT MEMORY SYSTEM
-- Execute these in Supabase SQL Editor

-- 1. Add personal_data column to profiles table (if not exists)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS personal_data JSONB DEFAULT '{}';

COMMENT ON COLUMN profiles.personal_data IS 'Stores extracted personal information like attachment styles, family info, emotional triggers';

-- 2. Add memory-related columns to conversations table (if not exists)
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS conversation_summary TEXT,
ADD COLUMN IF NOT EXISTS extracted_insights JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS topic_tags TEXT[];

COMMENT ON COLUMN conversations.conversation_summary IS 'AI-generated summary of the conversation';
COMMENT ON COLUMN conversations.extracted_insights IS 'Personal insights extracted from this conversation';
COMMENT ON COLUMN conversations.topic_tags IS 'Array of conversation topic tags';

-- 3. Add personal_data column to messages table (if not exists)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS personal_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS emotional_tone VARCHAR(50),
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3,2);

COMMENT ON COLUMN messages.personal_data IS 'Personal data extracted from this specific message';
COMMENT ON COLUMN messages.emotional_tone IS 'Detected emotional tone (anxious, happy, sad, etc.)';
COMMENT ON COLUMN messages.confidence_score IS 'Confidence score for the extracted data (0.0-1.0)';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_personal_data ON profiles USING GIN (personal_data);
CREATE INDEX IF NOT EXISTS idx_conversations_topic_tags ON conversations USING GIN (topic_tags);
CREATE INDEX IF NOT EXISTS idx_messages_personal_data ON messages USING GIN (personal_data);
CREATE INDEX IF NOT EXISTS idx_messages_emotional_tone ON messages (emotional_tone);

-- 5. Create a view for easy user memory retrieval
CREATE OR REPLACE VIEW user_memory_summary AS
SELECT 
    p.id as user_id,
    p.first_name,
    p.email,
    p.personal_data,
    COUNT(c.id) as conversation_count,
    COUNT(m.id) as message_count,
    MAX(c.updated_at) as last_conversation_date,
    ARRAY_AGG(DISTINCT unnest(c.topic_tags)) FILTER (WHERE c.topic_tags IS NOT NULL) as all_topics
FROM profiles p
LEFT JOIN conversations c ON p.id = c.user_id
LEFT JOIN messages m ON c.id = m.conversation_id
GROUP BY p.id, p.first_name, p.email, p.personal_data;

COMMENT ON VIEW user_memory_summary IS 'Comprehensive view of user memory and conversation history';

-- 6. Enable Row Level Security (RLS) for privacy
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for data access (adjust as needed for your auth setup)
-- Note: These policies assume you have user authentication set up
-- You may need to modify based on your specific auth implementation

-- Allow users to read/write their own profile data
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON profiles
    FOR ALL USING (auth.uid()::text = id::text);

-- Allow users to read/write their own conversations
CREATE POLICY IF NOT EXISTS "Users can manage own conversations" ON conversations
    FOR ALL USING (auth.uid()::text = user_id::text);

-- Allow users to read/write messages in their conversations
CREATE POLICY IF NOT EXISTS "Users can manage own messages" ON messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE conversations.id = messages.conversation_id 
            AND conversations.user_id::text = auth.uid()::text
        )
    );

-- 8. Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON messages TO authenticated;
GRANT SELECT ON user_memory_summary TO authenticated;
