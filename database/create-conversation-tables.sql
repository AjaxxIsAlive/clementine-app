-- Create conversations table for persistent memory
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for storing chat history
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user', -- 'user', 'assistant', 'system'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversations table
CREATE POLICY "Users can view their own conversations" ON conversations
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their own conversations" ON conversations
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their own conversations" ON conversations
  FOR UPDATE USING (user_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their own conversations" ON conversations
  FOR DELETE USING (user_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

-- RLS policies for messages table
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (user_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can insert their own messages" ON messages
  FOR INSERT WITH CHECK (user_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (user_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Users can delete their own messages" ON messages
  FOR DELETE USING (user_id IN (
    SELECT id FROM profiles WHERE id = auth.uid()
  ));

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on conversations
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT 'conversations table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations');

SELECT 'messages table created' as status 
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages');
