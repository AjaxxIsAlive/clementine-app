# Supabase Memory System Implementation Guide

## 🎯 OBJECTIVE
Replace VoiceFlow variable system with external Supabase database for persistent memory storage. Keep existing working VoiceFlow voice activation while adding robust memory capabilities.

## 📋 CURRENT STATE ANALYSIS
- ✅ Working React app with VoiceFlow voice activation
- ✅ User authentication system (LoginModal)
- ✅ Local storage memory system (18+ variables)
- ❌ VoiceFlow variables not receiving payload data properly
- 🎯 GOAL: External database replaces local storage for memory

## 🏗️ ARCHITECTURE OVERVIEW

```
User Interaction → React App → Supabase DB → Memory Context → VoiceFlow
                                ↑                              ↓
                        Store/Retrieve Memory          Voice Response
```

## 📊 DATABASE SCHEMA

### Table: `user_profiles`
```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL, -- clementine_user_xxxxx
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Table: `user_memory`
```sql
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
```

### RLS (Row Level Security) Policies
```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (user_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (user_id = current_setting('app.current_user_id'));

CREATE POLICY "Users can view own memory" ON user_memory
  FOR ALL USING (user_id = current_setting('app.current_user_id'));
```

## 🔧 IMPLEMENTATION STEPS

### Step 1: Supabase Setup
1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create new project
   - Note: Project URL and anon key

2. **Run Database Migrations**
   - Copy the SQL schema above
   - Paste in Supabase SQL Editor
   - Execute to create tables

3. **Environment Variables**
   ```bash
   # Add to .env
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 2: Install Dependencies
```bash
npm install @supabase/supabase-js
```

### Step 3: Create Supabase Client
Create `src/services/supabase.js`:
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Step 4: Create Memory Service
Create `src/services/memoryService.js`:
```javascript
import { supabase } from './supabase'

class MemoryService {
  async createUserProfile(userData) {
    // Implementation needed
  }

  async getUserMemory(userId) {
    // Implementation needed
  }

  async updateUserMemory(userId, memoryData) {
    // Implementation needed
  }

  async incrementSessionCount(userId) {
    // Implementation needed
  }
}

export const memoryService = new MemoryService()
```

### Step 5: Update ChatPageNew.js
Replace localStorage memory system with Supabase calls.

**Key Changes Needed:**
1. Replace `loadMemoryData()` function
2. Replace `saveMemoryData()` function  
3. Update login flow to create Supabase profile
4. Update session tracking
5. Keep VoiceFlow integration unchanged

### Step 6: Memory Context Integration
Create intelligent context system that:
1. Loads memory before VoiceFlow interaction
2. Generates conversation context
3. Updates memory after interaction

## 🎯 CRITICAL IMPLEMENTATION DETAILS

### Memory Loading Flow
```javascript
// When user logs in:
1. Check if user exists in Supabase
2. If not, create profile + memory record
3. If exists, load memory data
4. Update session count
5. Set last_active_date
```

### VoiceFlow Integration Strategy
```javascript
// Instead of payload to VoiceFlow:
1. Load memory from Supabase
2. Generate conversation context string
3. Pass context via VoiceFlow API interaction
4. Listen for conversation end
5. Extract new information and save to Supabase
```

### Context String Generation
```javascript
// Generate smart context for VoiceFlow
const generateContext = (memory) => {
  if (memory.session_count > 1) {
    return `Returning user: ${memory.user_name}, Session #${memory.session_count}, 
            Relationship: ${memory.relationship_status}, 
            Last topic: ${memory.last_topic_discussed}`
  } else {
    return `New user: First session`
  }
}
```

## 📝 SPECIFIC FILES TO MODIFY

### 1. ChatPageNew.js Updates
- Replace MEMORY_KEYS localStorage system
- Update loadMemoryData() to use Supabase
- Update saveMemoryData() to use Supabase
- Keep VoiceFlow integration as-is
- Add context generation before VoiceFlow interaction

### 2. LoginModal.js Updates
- Create Supabase user profile on login
- Handle existing user detection

### 3. New Files to Create
- `src/services/supabase.js`
- `src/services/memoryService.js`
- `src/hooks/useMemory.js` (optional React hook)

## 🔍 TESTING STRATEGY

### Phase 1: Database Operations
1. Test user creation
2. Test memory storage/retrieval
3. Test session increment

### Phase 2: React Integration
1. Test login flow
2. Test memory loading on app start
3. Test memory updates

### Phase 3: VoiceFlow Integration
1. Test context generation
2. Test conversation continuity
3. Test memory persistence across sessions

## 🚨 IMPORTANT NOTES FOR LLM ASSISTANT

### Preserve Existing Functionality
- ❌ DO NOT break existing VoiceFlow voice activation
- ✅ Keep all current UI/UX working
- ✅ Maintain LoginModal functionality
- ✅ Keep project switching system

### Key Implementation Requirements
1. **Async/Await Patterns**: All Supabase calls are async
2. **Error Handling**: Robust error handling for database calls
3. **Loading States**: Show loading while fetching memory
4. **Offline Fallback**: Graceful handling if Supabase unavailable
5. **Data Validation**: Validate data before saving

### Performance Considerations
- Load memory once on login, cache in React state
- Batch updates to reduce database calls
- Use Supabase real-time for multi-device sync (optional)

## 🎯 SUCCESS CRITERIA

### Must Have
- ✅ User memory persists across browser sessions
- ✅ VoiceFlow conversations show memory awareness
- ✅ Session counting works correctly
- ✅ No data loss during conversation
- ✅ Existing voice activation continues working

### Nice to Have
- ✅ Real-time sync across devices
- ✅ Memory analytics dashboard
- ✅ Conversation history storage
- ✅ Memory export functionality

## 📚 REFERENCE LINKS

- **Supabase JavaScript Client**: https://supabase.com/docs/reference/javascript
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **React Integration**: https://supabase.com/docs/guides/getting-started/quickstarts/reactjs
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security

## 🎯 PROMPT FOR NEXT LLM

"I need to implement a Supabase-based memory system for a React VoiceFlow chat application. The app currently uses localStorage for memory but VoiceFlow variable payload isn't working. Please implement the external memory system following the detailed specification in SUPABASE_MEMORY_IMPLEMENTATION.md. Focus on preserving the existing working VoiceFlow voice activation while adding robust database-backed memory persistence. The current ChatPageNew.js file has the localStorage memory system that needs to be replaced with Supabase integration."