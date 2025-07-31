# Code Templates for Supabase Memory Implementation

## 🔧 Template 1: Supabase Client Setup

### File: `src/services/supabase.js`
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to set user context for RLS
export const setUserContext = async (userId) => {
  const { error } = await supabase.rpc('set_config', {
    setting_name: 'app.current_user_id',
    setting_value: userId
  })
  
  if (error) {
    console.error('Error setting user context:', error)
  }
}
```

## 🔧 Template 2: Memory Service

### File: `src/services/memoryService.js`
```javascript
import { supabase, setUserContext } from './supabase'

class MemoryService {
  async createUserProfile(userData) {
    try {
      // Set user context for RLS
      await setUserContext(userData.userID)
      
      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userData.userID,
          email: userData.email,
          name: userData.name
        })
        .select()
        .single()

      if (profileError) throw profileError

      // Create initial memory record
      const { data: memory, error: memoryError } = await supabase
        .from('user_memory')
        .insert({
          user_id: userData.userID,
          user_name: userData.name,
          session_count: 1
        })
        .select()
        .single()

      if (memoryError) throw memoryError

      console.log('✅ User profile and memory created:', { profile, memory })
      return { profile, memory }
      
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
      throw error
    }
  }

  async getUserMemory(userId) {
    try {
      await setUserContext(userId)
      
      const { data, error } = await supabase
        .from('user_memory')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No memory record exists, return empty
          return null
        }
        throw error
      }

      console.log('🧠 Memory loaded from Supabase:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error loading memory:', error)
      throw error
    }
  }

  async updateUserMemory(userId, memoryUpdates) {
    try {
      await setUserContext(userId)
      
      const { data, error } = await supabase
        .from('user_memory')
        .update({
          ...memoryUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single()

      if (error) throw error

      console.log('💾 Memory updated in Supabase:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error updating memory:', error)
      throw error
    }
  }

  async incrementSessionCount(userId) {
    try {
      await setUserContext(userId)
      
      const { data, error } = await supabase
        .rpc('increment_session_count', { 
          target_user_id: userId 
        })

      if (error) throw error

      console.log('📈 Session count incremented:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error incrementing session:', error)
      
      // Fallback: manual increment
      const memory = await this.getUserMemory(userId)
      if (memory) {
        return await this.updateUserMemory(userId, {
          session_count: (memory.session_count || 0) + 1,
          last_active_date: new Date().toISOString()
        })
      }
      
      throw error
    }
  }

  // Helper method to convert memory object to localStorage-like format
  formatMemoryForLocalStorage(memory) {
    if (!memory) return {}
    
    return {
      userName: memory.user_name || '',
      userAge: memory.user_age || '',
      userLocation: memory.user_location || '',
      userOccupation: memory.user_occupation || '',
      relationshipStatus: memory.relationship_status || '',
      partnerName: memory.partner_name || '',
      relationshipDuration: memory.relationship_duration || '',
      relationshipGoals: memory.relationship_goals || '',
      currentChallenges: memory.current_challenges || '',
      communicationStyle: memory.communication_style || '',
      lastTopicDiscussed: memory.last_topic_discussed || '',
      userMood: memory.user_mood || '',
      sessionCount: memory.session_count?.toString() || '1',
      lastActiveDate: memory.last_active_date || new Date().toISOString()
    }
  }

  // Helper method to convert localStorage format to Supabase format
  formatMemoryForSupabase(localMemory) {
    return {
      user_name: localMemory.userName || '',
      user_age: localMemory.userAge || '',
      user_location: localMemory.userLocation || '',
      user_occupation: localMemory.userOccupation || '',
      relationship_status: localMemory.relationshipStatus || '',
      partner_name: localMemory.partnerName || '',
      relationship_duration: localMemory.relationshipDuration || '',
      relationship_goals: localMemory.relationshipGoals || '',
      current_challenges: localMemory.currentChallenges || '',
      communication_style: localMemory.communicationStyle || '',
      last_topic_discussed: localMemory.lastTopicDiscussed || '',
      user_mood: localMemory.userMood || '',
      session_count: parseInt(localMemory.sessionCount) || 1,
      last_active_date: localMemory.lastActiveDate || new Date().toISOString()
    }
  }
}

export const memoryService = new MemoryService()
```

## 🔧 Template 3: Updated LoginModal Integration

### Updates for `src/components/LoginModal.js`
```javascript
// Add import at top
import { memoryService } from '../services/memoryService'

// Update handleSubmit function
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!email.trim() || !name.trim()) {
    alert('Please fill in both email and name');
    return;
  }

  setIsLoading(true);
  
  try {
    // Create user credentials
    const userID = 'clementine_user_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const credentials = {
      email: email.trim(),
      name: name.trim(),
      userID: userID,
      loginTime: new Date().toISOString()
    };

    // Save to localStorage (for compatibility)
    localStorage.setItem('clementine_user_credentials', JSON.stringify(credentials));
    localStorage.setItem('clementine_user_id', userID);
    localStorage.setItem('clementine_user_email', email.trim());
    localStorage.setItem('clementine_user_name', name.trim());
    
    // Create Supabase profile and memory
    try {
      await memoryService.createUserProfile(credentials);
      console.log('✅ Supabase profile created successfully');
    } catch (supabaseError) {
      console.warn('⚠️ Supabase profile creation failed, continuing with localStorage:', supabaseError);
      // Continue anyway - app will fall back to localStorage
    }
    
    console.log('✅ User credentials saved:', credentials);
    
    // Call the onLogin callback
    onLogin(credentials);
    
    // Reset form
    setEmail('');
    setName('');
  } catch (error) {
    console.error('❌ Login error:', error);
    alert('Login failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};
```

## 🔧 Template 4: ChatPageNew.js Memory System Updates

### Key Function Replacements
```javascript
// Add imports at top
import { memoryService } from '../services/memoryService'

// Replace loadMemoryData function
const loadMemoryData = async () => {
  try {
    const userID = localStorage.getItem('clementine_user_id');
    if (!userID) return {};

    // Try Supabase first
    try {
      const supabaseMemory = await memoryService.getUserMemory(userID);
      if (supabaseMemory) {
        // Increment session count
        await memoryService.incrementSessionCount(userID);
        
        // Convert to local format
        const formattedMemory = memoryService.formatMemoryForLocalStorage(supabaseMemory);
        formattedMemory.sessionCount = (supabaseMemory.session_count + 1).toString();
        
        setMemoryData(formattedMemory);
        console.log('🧠 Memory loaded from Supabase:', formattedMemory);
        return formattedMemory;
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase memory load failed, falling back to localStorage:', supabaseError);
    }

    // Fallback to localStorage (existing code)
    const data = {};
    Object.entries(MEMORY_KEYS).forEach(([key, storageKey]) => {
      const value = localStorage.getItem(storageKey);
      data[key] = value || '';
    });
    
    // Update session count
    const currentCount = parseInt(data.sessionCount) || 0;
    const newCount = currentCount + 1;
    localStorage.setItem(MEMORY_KEYS.sessionCount, newCount.toString());
    localStorage.setItem(MEMORY_KEYS.lastActiveDate, new Date().toISOString());
    
    data.sessionCount = newCount.toString();
    data.lastActiveDate = new Date().toISOString();
    
    setMemoryData(data);
    console.log('🧠 Memory loaded from localStorage:', data);
    return data;
    
  } catch (error) {
    console.error('❌ Error loading memory:', error);
    return {};
  }
};

// Replace saveMemoryData function
const saveMemoryData = async (key, value) => {
  try {
    const userID = localStorage.getItem('clementine_user_id');
    
    // Update localStorage (for compatibility)
    if (MEMORY_KEYS[key]) {
      localStorage.setItem(MEMORY_KEYS[key], value);
      setMemoryData(prev => ({ ...prev, [key]: value }));
      console.log(`💾 Saved ${key}:`, value);
    }

    // Update Supabase
    if (userID) {
      try {
        const currentMemory = { ...memoryData, [key]: value };
        const supabaseFormat = memoryService.formatMemoryForSupabase(currentMemory);
        await memoryService.updateUserMemory(userID, supabaseFormat);
        console.log('💾 Memory synced to Supabase');
      } catch (supabaseError) {
        console.warn('⚠️ Supabase sync failed:', supabaseError);
      }
    }
    
  } catch (error) {
    console.error('❌ Error saving memory:', error);
  }
};
```

## 🔧 Template 5: SQL Functions for Supabase

### Add to Supabase SQL Editor
```sql
-- Function to increment session count atomically
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

-- Function to set config for RLS
CREATE OR REPLACE FUNCTION set_config(setting_name TEXT, setting_value TEXT)
RETURNS void AS $$
BEGIN
  PERFORM set_config(setting_name, setting_value, false);
END;
$$ LANGUAGE plpgsql;
```

## 🎯 USAGE EXAMPLE

### Complete Implementation Flow
```javascript
// 1. User logs in
const credentials = await handleLogin(email, name);

// 2. Create profile (LoginModal)
await memoryService.createUserProfile(credentials);

// 3. Load memory (ChatPageNew)
const memory = await loadMemoryData();

// 4. During conversation, save updates
await saveMemoryData('relationshipStatus', 'married');

// 5. Session tracking happens automatically
```

## 🚨 CRITICAL NOTES

1. **Always include try/catch** - Supabase calls can fail
2. **Fallback to localStorage** - Keep app working if Supabase unavailable  
3. **Async/await patterns** - All Supabase calls are async
4. **RLS security** - User context must be set correctly
5. **Data validation** - Validate data before saving
6. **Preserve VoiceFlow** - Don't modify existing voice activation code