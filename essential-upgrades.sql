-- ESSENTIAL MEMORY SYSTEM UPGRADES
-- Run these first in Supabase SQL Editor

-- 1. Add personal_data to profiles (core memory storage)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS personal_data JSONB DEFAULT '{}';

-- 2. Add personal_data to messages (per-message extraction)
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS personal_data JSONB DEFAULT '{}';

-- 3. Add conversation summary field
ALTER TABLE conversations 
ADD COLUMN IF NOT EXISTS conversation_summary TEXT;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_personal_data ON profiles USING GIN (personal_data);
CREATE INDEX IF NOT EXISTS idx_messages_personal_data ON messages USING GIN (personal_data);

-- That's it! These 4 commands enable the full memory system.
