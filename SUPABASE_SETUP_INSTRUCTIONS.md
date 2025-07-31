# Supabase Setup Instructions for LLM Assistant

## 🎯 OBJECTIVE
Help the user complete the Supabase database setup to activate persistent memory storage for their React VoiceFlow chat application. The Supabase integration code is already implemented - we just need to connect the database and configure the environment variables.

## 📋 CURRENT STATE
- ✅ Supabase client code implemented in `src/services/supabase.js`
- ✅ Memory service implemented in `src/services/memoryService.js`
- ✅ React components updated to use Supabase with localStorage fallback
- ✅ Environment variables configured with placeholders
- ❌ **MISSING**: Actual Supabase project and database schema
- ❌ **MISSING**: Real Supabase credentials in `.env` file

## 🔧 STEP-BY-STEP SUPABASE SETUP

### Step 1: Create Supabase Project
Help the user:
1. Go to https://supabase.com
2. Sign up/login with GitHub or email
3. Click "New Project"
4. Choose organization (or create new one)
5. Set project name: `clementine-memory-db`
6. Set database password (save this!)
7. Choose region closest to user
8. Click "Create new project"
9. Wait 2-3 minutes for setup completion

### Step 2: Get Supabase Credentials
Help the user navigate to get credentials:
1. In Supabase dashboard, go to **Settings** → **API**
2. Copy the **Project URL** (looks like: `https://xyz.supabase.co`)
3. Copy the **anon public** key (long string starting with `eyJ...`)
4. Save these securely - they'll be added to the `.env` file

### Step 3: Create Database Schema
Help the user run this SQL in Supabase:

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste this EXACT schema:

```sql
-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_memory table
CREATE TABLE user_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_profiles(user_id),
  
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified for development)
CREATE POLICY "Enable all operations for all users" ON user_profiles
  FOR ALL USING (true);

CREATE POLICY "Enable all operations for all users" ON user_memory
  FOR ALL USING (true);

-- Create helper function for session increment
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

-- Create config function
CREATE OR REPLACE FUNCTION set_config(setting_name TEXT, setting_value TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$$ LANGUAGE plpgsql;
```

4. Click **Run** to execute the schema
5. Verify no errors occurred

### Step 4: Update Environment Variables
Help the user update the `.env` file in their project:

1. Open `/workspaces/clementine-app/.env`
2. Replace these lines:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   With actual values:
   ```
   REACT_APP_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. Save the file

### Step 5: Test the Connection
Help the user test the setup:

1. Restart the React development server:
   ```bash
   # Stop current server (Ctrl+C)
   # Then restart:
   npm start
   ```

2. Open the app in browser
3. Clear any existing data:
   - Open browser Developer Tools (F12)
   - Go to Application → Local Storage
   - Clear all clementine_* entries

4. Test the flow:
   - Enter name and email in login modal
   - Check browser console for Supabase success messages
   - Verify data appears in Supabase dashboard under **Table Editor**

## 🔍 TROUBLESHOOTING GUIDE

### Common Issues and Solutions

#### Issue 1: "Missing Supabase environment variables"
**Symptoms**: Warning in console, localStorage fallback used
**Solution**: 
- Check `.env` file has correct REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
- Restart development server after updating .env

#### Issue 2: "Error creating user profile" 
**Symptoms**: Supabase errors in console during login
**Solutions**:
- Verify database schema was created correctly
- Check Supabase project is active (not paused)
- Verify RLS policies are enabled

#### Issue 3: "RPC function not found"
**Symptoms**: Session increment fails
**Solution**: 
- Ensure `increment_session_count` function was created in SQL
- Re-run the function creation SQL if needed

#### Issue 4: Network/Connection errors
**Symptoms**: "Failed to fetch" errors
**Solutions**:
- Check internet connection
- Verify Supabase project URL is correct
- Check Supabase service status

## ✅ SUCCESS VERIFICATION

### How to Confirm Everything Works:

1. **Login Flow**:
   - Login with new user → Should see "✅ Supabase profile created successfully" in console

2. **Memory Persistence**:
   - Refresh browser → User should stay logged in
   - Session count should increment each reload

3. **Database Verification**:
   - Check Supabase **Table Editor**
   - Should see entries in both `user_profiles` and `user_memory` tables

4. **Console Messages**:
   - Should see "🧠 Memory loaded from Supabase" instead of localStorage
   - Should see "💾 Memory synced to Supabase" when data changes

## 🎯 COMPLETION CHECKLIST

- [ ] Supabase project created
- [ ] Database schema executed successfully  
- [ ] Environment variables updated with real credentials
- [ ] Development server restarted
- [ ] Login creates Supabase profile
- [ ] Memory loads from Supabase
- [ ] Data visible in Supabase dashboard
- [ ] Session counting works
- [ ] VoiceFlow voice activation still works

## 🚨 IMPORTANT NOTES

### For the LLM Assistant:
- **DO NOT** modify any existing React code - it's already correctly implemented
- **DO NOT** change the VoiceFlow integration - it must remain working
- **FOCUS ONLY** on helping with Supabase project setup and configuration
- The app has graceful fallbacks - it will work with localStorage if Supabase fails

### Security Notes:
- The anon key is safe to use in frontend code
- RLS policies are simplified for development (can be tightened later)
- Never share the service_role key publicly

## 📞 NEXT STEPS AFTER SETUP

Once Supabase is connected:
1. Test cross-device persistence (same user, different browsers)
2. Monitor memory usage in Supabase dashboard  
3. Consider adding memory analytics
4. Optionally implement real-time sync for multi-device usage

## 🎯 PROMPT FOR LLM TO HELP USER

"I need help connecting my Supabase database to complete the memory system setup for my React VoiceFlow chat application. The integration code is already implemented - I just need to create the Supabase project, run the database schema, and update my environment variables. Please guide me through the Supabase project creation, help me execute the SQL schema, and update my .env file with the correct credentials. The goal is to activate persistent memory storage while keeping the existing VoiceFlow voice functionality working."
