import { supabase, setUserContext } from './supabase'

class MemoryService {
  async createUserProfile(userData) {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, skipping profile creation')
      return null
    }

    try {
      // Don't use setUserContext for now to avoid RLS issues
      // await setUserContext(userData.userID)
      
      console.log('🔧 Creating user profile for:', userData.userID)
      
      // Validate required fields
      if (!userData.userID || !userData.email || !userData.name) {
        throw new Error('Missing required user data: userID, email, or name')
      }
      
      // Create user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userData.userID,
          email: userData.email,
          name: userData.name
        })
        .select()
        .maybeSingle()

      if (profileError) {
        console.error('❌ Profile creation error:', profileError)
        // Check if it's a duplicate key error (user already exists)
        if (profileError.code === '23505') {
          console.log('👤 User profile already exists, continuing...')
        } else {
          throw profileError
        }
      }

      // Create initial memory record
      const { data: memory, error: memoryError } = await supabase
        .from('user_memory')
        .insert({
          user_id: userData.userID,
          user_name: userData.name,
          session_count: 1
        })
        .select()
        .maybeSingle()

      if (memoryError) {
        console.error('❌ Memory creation error:', memoryError)
        // Check if it's constraints or duplicate key error
        if (memoryError.code === '23505' || memoryError.code === '23503') {
          console.log('🧠 Memory record issue, using upsert method...')
          // Try upsert instead
          return await this.updateUserMemory(userData.userID, {
            user_name: userData.name,
            session_count: 1
          })
        } else {
          throw memoryError
        }
      }

      console.log('✅ User profile and memory created:', { profile, memory })
      return { profile, memory }
      
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
      throw error
    }
  }

  // Get user data from new VoiceFlow AI schema
  async getUserData(userId) {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, returning null')
      return null
    }

    try {
      console.log('🔍 Querying users table for userId:', userId)
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_profiles (*)
        `)
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('❌ Supabase query error:', error)
        throw error
      }

      if (!data) {
        console.log('🔍 No user record found for:', userId)
        return null
      }

      console.log('👤 User data loaded from Supabase:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error loading user data:', error)
      throw error
    }
  }

  // Create or update user in new schema with proper error handling
  async upsertUser(userId, userEmail = null, userName = null) {
    console.log('👤 Upserting user:', userId, userEmail, userName)
    
    if (!supabase) {
      console.warn('⚠️ Supabase not available')
      return null
    }

    try {
      let userData = null
      
      // First, try to get existing user
      const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected for new users
        throw selectError
      }

      if (existingUser) {
        // Update existing user
        const { data, error } = await supabase
          .from('users')
          .update({
            session_count: (existingUser.session_count || 0) + 1,
            returning_user: true,
            last_session: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single()

        if (error) throw error
        userData = data
      } else {
        // Create new user
        const { data, error } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            session_count: 1,
            returning_user: false,
            last_session: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          // Handle duplicate key error (409 conflict)
          if (error.code === '23505') {
            console.log('👤 User already exists, attempting update instead...')
            // Try to update instead
            const { data: updateData, error: updateError } = await supabase
              .from('users')
              .update({
                session_count: 1,
                returning_user: true,
                last_session: new Date().toISOString()
              })
              .eq('user_id', userId)
              .select()
              .single()
              
            if (updateError) throw updateError
            userData = updateData
          } else {
            throw error
          }
        } else {
          userData = data
        }
      }

      // Also create/update profile if data provided
      if (userEmail || userName) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: userId,
            email: userEmail || null,
            name: userName || null,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })

        if (profileError) {
          console.warn('⚠️ Profile upsert failed:', profileError)
        }
      }

      console.log('👤 User upserted successfully:', userData)
      return userData
      
    } catch (error) {
      console.error('❌ Error upserting user:', error)
      throw error
    }
  }

  // Save conversation to new schema
  async saveConversation(userId, message, response) {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, skipping conversation save')
      return null
    }

    try {
      console.log('💬 Saving conversation for:', userId)
      
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          message: message,
          response: response,
          timestamp: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Conversation save error:', error)
        throw error
      }

      console.log('💬 Conversation saved:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error saving conversation:', error)
      throw error
    }
  }

  // Get recent conversations
  async getRecentConversations(userId, limit = 5) {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, returning empty array')
      return []
    }

    try {
      console.log('� Getting recent conversations for:', userId)
      
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Conversations query error:', error)
        throw error
      }

      console.log('💬 Recent conversations loaded:', data)
      return data || []
      
    } catch (error) {
      console.error('❌ Error loading conversations:', error)
      throw error
    }
  }

  async updateUserMemory(userId, memoryUpdates) {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, skipping memory update')
      return null
    }

    try {
      // Don't use setUserContext for now to avoid RLS issues
      // await setUserContext(userId)
      
      console.log('💾 Updating user memory for:', userId, memoryUpdates)
      
      // Use UPSERT to insert if record doesn't exist, update if it does
      const { data, error } = await supabase
        .from('user_memory')
        .upsert({
          user_id: userId,
          ...memoryUpdates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle()

      if (error) {
        console.error('❌ Memory upsert error:', error)
        throw error
      }

      console.log('💾 Memory upserted in Supabase:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error updating memory:', error)
      throw error
    }
  }

  // Ensure user exists in both tables - called when switching users
  async ensureUserExists(userId, userEmail, userName, userAge = '', userOccupation = '', relationshipStatus = 'single') {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, skipping user creation')
      return null
    }

    try {
      console.log('👤 Ensuring user exists:', userId, userEmail, userName)

      // First ensure user profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          email: userEmail,
          name: userName,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle()

      if (profileError) {
        console.error('❌ Profile upsert error:', profileError)
        throw profileError
      }

      console.log('👤 User profile ensured:', profileData)

      // Then ensure memory record exists with all required fields
      const { data: memoryData, error: memoryError } = await supabase
        .from('user_memory')
        .upsert({
          user_id: userId,
          user_name: userName,
          user_age: userAge || '',
          user_location: '',
          user_occupation: userOccupation || '',
          relationship_status: relationshipStatus || 'single',
          partner_name: '',
          relationship_duration: '',
          relationship_goals: '',
          current_challenges: '',
          communication_style: '',
          last_topic_discussed: '',
          user_mood: '',
          session_count: 1,
          last_active_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .maybeSingle()

      if (memoryError) {
        console.error('❌ Memory upsert error:', memoryError)
        throw memoryError
      }

      console.log('🧠 User memory ensured:', memoryData)
      return { profile: profileData, memory: memoryData }
      
    } catch (error) {
      console.error('❌ Error ensuring user exists:', error)
      throw error
    }
  }

  async incrementSessionCount(userId) {
    if (!supabase) {
      console.warn('⚠️ Supabase not available, skipping session increment')
      return null
    }

    try {
      await setUserContext(userId)
      
      // Try using the stored procedure first
      const { data, error } = await supabase
        .rpc('increment_session_count', { 
          target_user_id: userId 
        })

      if (error) {
        console.warn('⚠️ RPC increment failed, using manual method:', error)
        
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

      console.log('📈 Session count incremented:', data)
      return data
      
    } catch (error) {
      console.error('❌ Error incrementing session:', error)
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
