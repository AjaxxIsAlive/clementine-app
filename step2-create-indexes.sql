-- STEP 2: CREATE INDEXES (Run after Step 1)

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON profiles(session_id);
CREATE INDEX IF NOT EXISTS idx_profiles_personal_data ON profiles USING GIN (personal_data);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_messages_personal_data ON messages USING GIN (personal_data);
CREATE INDEX IF NOT EXISTS idx_messages_role ON messages(role);
