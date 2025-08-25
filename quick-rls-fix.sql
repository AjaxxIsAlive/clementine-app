-- QUICK FIX: Disable Row Level Security for Clementine App
-- Run this in Supabase SQL Editor

-- Disable RLS on all tables to allow app functionality
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Ensure all necessary permissions are granted
GRANT ALL ON profiles TO authenticated, anon;
GRANT ALL ON conversations TO authenticated, anon;
GRANT ALL ON messages TO authenticated, anon;
