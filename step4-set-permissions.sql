-- STEP 4: SET PERMISSIONS (Run after Step 3)

-- Disable Row Level Security for development ease
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Grant permissions to all roles
GRANT ALL ON profiles TO authenticated, anon, service_role;
GRANT ALL ON conversations TO authenticated, anon, service_role;
GRANT ALL ON messages TO authenticated, anon, service_role;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon, service_role;
