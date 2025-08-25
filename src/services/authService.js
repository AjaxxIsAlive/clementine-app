import { supabase, supabaseAdmin } from '../supabaseClient.js';
import { v4 as uuidv4 } from 'uuid';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionId = null;
  }

    // Check what fields the existing user has to match the structure
  async checkTableStructure() {
    try {
      console.log('🔍 Checking profiles table structure...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('❌ Failed to check table structure:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const sample = data[0];
        console.log('📋 Sample record structure:', sample);
        console.log('📝 Available fields:', Object.keys(sample));
        return sample;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Exception checking table structure:', error);
      return null;
    }
  }

  // Alternative: Create authenticated users (this will automatically create profiles if triggers exist)
  async createAuthenticatedTestUsers() {
    if (!supabaseAdmin) {
      console.error('❌ Admin client not available - service role key missing');
      return { success: false, error: 'Service role key not configured' };
    }

    const testUsers = [
      { email: 'alice@test.com', password: 'test123456', first_name: 'Alice' },
      { email: 'bob@test.com', password: 'test123456', first_name: 'Bob' },
      { email: 'charlie@test.com', password: 'test123456', first_name: 'Charlie' }
    ];

    console.log('👤 Creating authenticated test users...');
    
    // First check which users already exist
    const { data: existingProfiles } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('email', testUsers.map(u => u.email));
    
    const existingEmails = new Set(existingProfiles?.map(p => p.email) || []);
    const usersToCreate = testUsers.filter(user => !existingEmails.has(user.email));
    
    if (usersToCreate.length === 0) {
      console.log('ℹ️ All test users already exist!');
      return { 
        success: true, 
        results: testUsers.map(u => ({ email: u.email, success: true, status: 'already_exists' })),
        message: `All ${testUsers.length} test users already exist`
      };
    }

    console.log(`📝 Creating ${usersToCreate.length} new users (${existingEmails.size} already exist)`);
    const results = [];

    // Add existing users to results
    testUsers.filter(user => existingEmails.has(user.email)).forEach(user => {
      console.log(`✅ User already exists: ${user.email}`);
      results.push({ email: user.email, success: true, status: 'already_exists' });
    });

    for (const user of usersToCreate) {
      try {
        console.log(`🔄 Creating user: ${user.email}`);
        
        // Create authenticated user
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.first_name
          }
        });

        if (authError) {
          console.error(`❌ Failed to create auth user ${user.email}:`, authError);
          results.push({ email: user.email, success: false, error: authError });
          continue;
        }

        console.log(`✅ Auth user created: ${user.email}`);

        // Now create/update the profile
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authData.user.id,
            email: user.email,
            first_name: user.first_name,
            last_session_date: new Date().toISOString()
          })
          .select();

        if (profileError) {
          console.error(`❌ Failed to create profile for ${user.email}:`, profileError);
          results.push({ email: user.email, success: false, error: profileError });
        } else {
          console.log(`✅ Profile created: ${user.email}`);
          results.push({ email: user.email, success: true, status: 'created', data: profileData });
        }

      } catch (error) {
        console.error(`❌ Exception creating user ${user.email}:`, error);
        results.push({ email: user.email, success: false, error });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const createdCount = results.filter(r => r.status === 'created').length;
    const existingCount = results.filter(r => r.status === 'already_exists').length;
    
    console.log(`📊 Result: ${createdCount} created, ${existingCount} already existed, ${successCount}/${testUsers.length} total success`);

    return { 
      success: successCount === testUsers.length, 
      results, 
      message: `${createdCount} created, ${existingCount} already existed`
    };
  }

  // Initialize conversation tables if they don't exist
  async initializeConversationTables() {
    try {
      console.log('🔧 Checking if conversation tables exist...');

      // Try to query conversations table to see if it exists
      const { data: conversationsCheck, error: conversationsError } = await supabase
        .from('conversations')
        .select('id')
        .limit(1);

      // If no error, tables exist
      if (!conversationsError) {
        console.log('✅ Conversation tables already exist');
        return { success: true, message: 'Tables already exist' };
      }

      // If we get here, tables don't exist - let's create them manually using INSERT
      console.log('📝 Tables not found, creating them...');
      
      // For now, we'll skip table creation and just log the need
      console.log('ℹ️ Conversation tables need to be created in Supabase dashboard');
      console.log('📋 Required tables: conversations, messages');
      
      return { success: true, message: 'Tables check completed - manual creation may be needed' };

    } catch (error) {
      console.error('❌ Error checking conversation tables:', error);
      return { success: false, error: error.message };
    }
  }
  async addTestUsers() {
    if (!supabaseAdmin) {
      console.error('❌ Admin client not available - service role key missing');
      return { success: false, error: 'Service role key not configured' };
    }

    console.log('📝 Adding test users to profiles table using admin client...');
    console.log('⚠️ Note: profiles table appears to have foreign key constraints');
    console.log('🔄 Attempting to create users without IDs (let Supabase handle relationships)...');
    
    // Don't provide IDs - let Supabase handle the foreign key relationships
    const testUsers = [
      {
        email: 'alice@test.com',
        first_name: 'Alice',
        last_session_date: new Date().toISOString()
      },
      {
        email: 'bob@test.com', 
        first_name: 'Bob',
        last_session_date: new Date().toISOString()
      },
      {
        email: 'charlie@test.com',
        first_name: 'Charlie', 
        last_session_date: new Date().toISOString()
      }
    ];

    console.log('� Test users to add (without IDs):', testUsers);
    
    try {
      // Try without IDs first
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .insert(testUsers)
        .select();

      if (error) {
        console.error('❌ Failed to add test users:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // If it's a foreign key constraint, suggest the solution
        if (error.message.includes('foreign key constraint')) {
          console.log('💡 SOLUTION: The profiles table requires authenticated users.');
          console.log('💡 You need to either:');
          console.log('   1. Create users via Supabase Auth first, then add profiles');
          console.log('   2. Modify the table structure to remove foreign key constraints');
          console.log('   3. Add test users manually through Supabase dashboard');
          
          return { 
            success: false, 
            error: 'Profiles table requires authenticated users. See console for solutions.' 
          };
        }
        
        return { success: false, error };
      }

      console.log('✅ Test users added successfully:', data);
      return { success: true, users: data };
    } catch (error) {
      console.error('❌ Exception adding test users:', error);
      return { success: false, error };
    }
  }

  // Debug method to see what users exist
  async debugListUsers() {
    try {
      console.log('🔍 Attempting to list all users in profiles table...');
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) {
        console.error('❌ Debug error:', error);
        return { error };
      }
      
      console.log('✅ Users found:', data);
      console.log('📧 Available emails:', data?.map(user => user.email));
      console.table(data?.map(user => ({ id: user.id, email: user.email, name: user.first_name || user.name })));
      
      // Force display of emails in console
      if (data && data.length > 0) {
        console.log('🔍 ACTUAL EMAILS IN DATABASE:');
        data.forEach((user, index) => {
          console.log(`${index + 1}. ${user.email} (${user.first_name || user.name || 'No name'}) - ID: ${user.id}`);
        });
        
        // Show table structure confirmation
        console.log('📋 Table structure confirmed:');
        console.log('- Table name: profiles');
        console.log('- Fields found:', Object.keys(data[0]));
        console.log('- Record count:', data.length);
        console.log('- Database URL:', process.env.REACT_APP_SUPABASE_URL?.substring(0, 30) + '...');
      } else {
        console.warn('⚠️ No data found in profiles table - table might be empty');
      }
      
      return { data };
    } catch (error) {
      console.error('❌ Debug exception:', error);
      return { error };
    }
  }

  // Test basic Supabase connection
  async testConnection() {
    try {
      console.log('🔗 Testing Supabase connection...');
      console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
      console.log('Supabase Key length:', process.env.REACT_APP_SUPABASE_ANON_KEY?.length);
      
      // Try a simpler query first
      console.log('🔍 Testing simple profiles query...');
      const { data, error, count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .limit(5);
      
      if (error) {
        console.error('❌ Connection test failed:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          statusCode: error.status
        });
        
        // Try to see what tables are available
        console.log('🔍 Trying to check available tables...');
        try {
          const { data: tables } = await supabase.rpc('get_schema_tables');
          console.log('Available tables:', tables);
        } catch (e) {
          console.log('Could not get table list:', e.message);
        }
        
        return false;
      }
      
      console.log('✅ Connection test passed, profiles table accessible');
      console.log('📊 Total records in profiles table:', count);
      console.log('📝 Sample data structure:', data?.[0] ? Object.keys(data[0]) : 'No data');
      console.log('🔍 First record preview:', data?.[0]);
      
      // Test if we can get table metadata
      try {
        console.log('📋 Testing table metadata access...');
        // eslint-disable-next-line no-unused-vars
        const { data: metadata } = await supabase.from('profiles').select().limit(0);
        console.log('✅ Table metadata accessible');
      } catch (metaError) {
        console.warn('⚠️ Could not access table metadata:', metaError.message);
      }
      
      return true;
    } catch (error) {
      console.error('❌ Connection test exception:', error);
      return false;
    }
  }

  // Create a new user profile automatically (using same method as Alice, Bob, Charlie)
  async createUserProfile(email, displayName = null) {
    try {
      console.log('👤 Creating new authenticated user profile for:', email);
      
      if (!supabaseAdmin) {
        console.error('❌ Admin client not available - service role key missing');
        return { success: false, error: 'Service role key not configured' };
      }
      
      // Extract name from email if no display name provided
      const firstName = displayName || email.split('@')[0];
      
      // Check if user already exists first
      console.log('🔍 Checking if user already exists...');
      const { data: existingProfiles } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', email.toLowerCase().trim());
      
      if (existingProfiles && existingProfiles.length > 0) {
        console.log('✅ User already exists:', existingProfiles[0].email);
        return { success: true, user: existingProfiles[0], created: false };
      }

      console.log('📝 Creating new authenticated user (same as Alice/Bob/Charlie method)...');
      
      // Step 1: Create authenticated user through Supabase Auth (same as createAuthenticatedTestUsers)
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: 'temppassword123', // Temporary password for demo
        email_confirm: true,
        user_metadata: {
          first_name: firstName
        }
      });

      if (authError) {
        console.error(`❌ Failed to create auth user ${email}:`, authError);
        return { success: false, error: authError.message };
      }

      console.log(`✅ Auth user created: ${email}`);

      // Step 2: Create/update the profile (same as createAuthenticatedTestUsers)
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: email.toLowerCase().trim(),
          first_name: firstName,
          last_session_date: new Date().toISOString(),
          session_id: this.generateSessionId(authData.user.id) // Add session ID during creation
        })
        .select()
        .single();

      if (profileError) {
        console.error(`❌ Failed to create profile for ${email}:`, profileError);
        return { success: false, error: profileError.message };
      }

      console.log(`✅ Real user profile created successfully: ${profileData.email}`);
      return { success: true, user: profileData, created: true };
      
    } catch (error) {
      console.error('❌ Exception creating user profile:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate a unique session ID that links React user to VoiceFlow
  generateSessionId(userId) {
    return `vf_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Enhanced login with automatic profile creation and conversation loading
  async login(email, password = null) {
    try {
      console.log('🔐 Attempting login:', email);
      
      // Clear any existing localStorage first
      console.log('🧹 Clearing existing localStorage...');
      localStorage.removeItem('clementine_user');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userSessionId');
      
      // Reset auth state
      this.currentUser = null;
      this.isAuthenticated = false;
      this.sessionId = null;

      // Initialize conversation tables if needed
      await this.initializeConversationTables();

      // First test basic connection
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        throw new Error('Cannot connect to database');
      }

      // Query the profiles table directly with better error handling
      console.log('🔍 Querying for user:', email);
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email);

      if (error) {
        console.error('🔍 Supabase query error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      let user;

      if (!users || users.length === 0) {
        console.log('👤 No existing user found - creating new profile for:', email);
        
        // Auto-create new user profile
        const newUserResult = await this.createUserProfile(email, password);
        if (!newUserResult.success) {
          throw new Error(newUserResult.error || 'Failed to create user profile');
        }
        
        user = newUserResult.user;
        // Make sure session ID is set for new users
        this.sessionId = user.session_id || this.generateSessionId(user.id);
        console.log('✅ New user profile created:', user.email);
      } else {
        user = users[0];
        console.log('✅ Existing user found:', user.email);
      }

      // For demo purposes, we'll accept any password
      // In production, you'd verify the password hash here
      
      this.currentUser = user;
      this.sessionId = this.generateSessionId(user.id);
      this.isAuthenticated = true;

      // Update last session date
      await supabase
        .from('profiles')
        .update({ 
          last_session_date: new Date().toISOString(),
          session_id: this.sessionId 
        })
        .eq('id', user.id);

      // Load user's conversation history for persistent memory
      console.log('💭 Loading conversation history...');
      const conversationHistory = await this.loadUserConversations(user.id);

      // Prepare enhanced user data with conversation context
      const enhancedUserData = {
        ...user,
        session_id: this.sessionId,
        loginTime: new Date().toISOString(),
        conversationHistory: conversationHistory.conversations || [],
        hasConversationHistory: (conversationHistory.conversations || []).length > 0
      };

      // Store in localStorage
      localStorage.setItem('clementine_user', JSON.stringify(enhancedUserData));

      console.log(`✅ Login successful: ${user.email} with ${enhancedUserData.conversationHistory.length} previous conversations`);
      
      return {
        success: true,
        user: enhancedUserData,
        sessionId: this.sessionId,
        voiceFlowUserId: user.id,
        conversationHistory: enhancedUserData.conversationHistory
      };
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Load user's conversation history for persistent memory
  async loadUserConversations(userId) {
    try {
      console.log(`� Loading conversation history for user: ${userId}`);
      
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          messages (
            id,
            content,
            role,
            timestamp,
            created_at
          )
        `)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5); // Last 5 conversations for memory context

      if (error) {
        // If tables don't exist yet, that's okay - return empty history
        if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
          console.log('ℹ️ Conversation tables not created yet - returning empty history');
          return { success: true, conversations: [] };
        }
        
        console.error('❌ Failed to load conversations:', error);
        return { success: false, error, conversations: [] };
      }

      console.log(`✅ Loaded ${conversations?.length || 0} conversations for memory context`);
      return { 
        success: true, 
        conversations: conversations || []
      };

    } catch (error) {
      console.error('❌ Conversation loading exception:', error);
      return { success: false, error, conversations: [] };
    }
  }

  // Save a new conversation message for persistent memory with enhanced data extraction
  async saveConversationMessage(userId, message, role = 'user', conversationId = null, metadata = {}) {
    try {
      // If no conversation ID provided, create a new conversation
      if (!conversationId) {
        const conversation = await this.createConversation(userId, 'Chat Session');
        if (!conversation.success) {
          throw new Error('Failed to create conversation');
        }
        conversationId = conversation.conversation.id;
      }

      // Extract personal data from message for persistent memory
      const personalData = this.extractPersonalData(message, role);
      
      // Use service role for message creation to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('messages')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          content: message,
          role: role,
          timestamp: new Date().toISOString(),
          personal_data: personalData, // Store extracted personal information
          metadata: metadata // Additional context data
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to save message:', error);
        return { success: false, error };
      }

      // Update conversation timestamp and summary
      await supabaseAdmin
        .from('conversations')
        .update({ 
          updated_at: new Date().toISOString(),
          last_message: message.substring(0, 100) + (message.length > 100 ? '...' : '')
        })
        .eq('id', conversationId);

      // If personal data was extracted, update user profile
      if (personalData && Object.keys(personalData).length > 0) {
        await this.updateUserPersonalData(userId, personalData);
        console.log('🧠 Personal data extracted and saved:', Object.keys(personalData));
      }

      console.log(`✅ Message saved for persistent memory: ${role}`);
      return { 
        success: true, 
        message: data, 
        conversationId: conversationId,
        personalData: personalData
      };
    } catch (error) {
      console.error('❌ Message saving exception:', error);
      return { success: false, error };
    }
  }

  // Extract personal information from messages for persistent memory
  extractPersonalData(message, role) {
    if (role !== 'user' && role !== 'assistant') return null;
    
    const personalData = {};
    const text = message.toLowerCase();
    
    // Attachment Style Detection
    const attachmentPatterns = {
      'secure': ['secure', 'comfortable with intimacy', 'trust easily', 'good at relationships'],
      'anxious': ['anxious', 'need reassurance', 'fear abandonment', 'clingy', 'worried about relationship'],
      'avoidant': ['avoidant', 'independent', 'uncomfortable with closeness', 'need space', 'fear commitment'],
      'disorganized': ['confused about relationships', 'hot and cold', 'push and pull', 'inconsistent']
    };
    
    for (const [style, patterns] of Object.entries(attachmentPatterns)) {
      if (patterns.some(pattern => text.includes(pattern))) {
        personalData.attachment_style = style;
        break;
      }
    }
    
    // Important Dates (birthdays, anniversaries, deaths)
    const datePatterns = [
      /birthday.*?(\w+\s+\d{1,2}|\d{1,2}\/\d{1,2}|\w+\s+\d{1,2}(?:st|nd|rd|th)?)/gi,
      /anniversary.*?(\w+\s+\d{1,2}|\d{1,2}\/\d{1,2})/gi,
      /died.*?(\w+\s+\d{1,2}|\d{1,2}\/\d{1,2})/gi,
      /passed away.*?(\w+\s+\d{1,2}|\d{1,2}\/\d{1,2})/gi
    ];
    
    datePatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        personalData.important_dates = personalData.important_dates || [];
        personalData.important_dates.push(...matches);
      }
    });
    
    // Family Information
    const familyPatterns = {
      'mother': /mother|mom|mama|mum/gi,
      'father': /father|dad|papa|daddy/gi,
      'sibling': /sister|brother|sibling/gi,
      'spouse': /husband|wife|spouse|partner/gi,
      'child': /son|daughter|child|kids/gi
    };
    
    for (const [relation, pattern] of Object.entries(familyPatterns)) {
      if (pattern.test(text)) {
        personalData.family = personalData.family || {};
        personalData.family[relation] = true;
        
        // Extract names if mentioned
        const nameMatch = text.match(new RegExp(`${relation}.*?(\\b[A-Z][a-z]+\\b)`, 'i'));
        if (nameMatch && nameMatch[1]) {
          personalData.family[`${relation}_name`] = nameMatch[1];
        }
      }
    }
    
    // Relationship Status & History
    const relationshipPatterns = {
      'single': /single|not dating|no boyfriend|no girlfriend/gi,
      'dating': /dating|boyfriend|girlfriend|seeing someone/gi,
      'married': /married|spouse|husband|wife/gi,
      'divorced': /divorced|ex-husband|ex-wife/gi,
      'breakup': /broke up|ended relationship|split up/gi
    };
    
    for (const [status, pattern] of Object.entries(relationshipPatterns)) {
      if (pattern.test(text)) {
        personalData.relationship_status = status;
        break;
      }
    }
    
    // Emotional Triggers & Trauma
    const emotionalPatterns = {
      'abandonment': /abandonment|left me|everyone leaves/gi,
      'betrayal': /betrayed|cheated|lied to me/gi,
      'loss': /lost someone|grief|mourning/gi,
      'anxiety': /anxious|worried|stressed|panic/gi,
      'depression': /depressed|sad|hopeless|empty/gi
    };
    
    for (const [trigger, pattern] of Object.entries(emotionalPatterns)) {
      if (pattern.test(text)) {
        personalData.emotional_triggers = personalData.emotional_triggers || [];
        personalData.emotional_triggers.push(trigger);
      }
    }
    
    // Personal Preferences & Values
    if (text.includes('love language')) {
      const loveLanguages = ['words of affirmation', 'quality time', 'physical touch', 'acts of service', 'receiving gifts'];
      for (const language of loveLanguages) {
        if (text.includes(language)) {
          personalData.love_language = language;
          break;
        }
      }
    }
    
    return Object.keys(personalData).length > 0 ? personalData : null;
  }

  // Update user's accumulated personal data in profile
  async updateUserPersonalData(userId, newData) {
    try {
      // Get current user profile
      const { data: currentProfile, error: fetchError } = await supabaseAdmin
        .from('profiles')
        .select('personal_data')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.log('Could not fetch current profile, creating new personal data');
      }

      // Merge new personal data with existing
      const existingData = currentProfile?.personal_data || {};
      const mergedData = { ...existingData };

      // Merge attachment style (keep most recent)
      if (newData.attachment_style) {
        mergedData.attachment_style = newData.attachment_style;
        mergedData.attachment_style_updated = new Date().toISOString();
      }

      // Merge family data
      if (newData.family) {
        mergedData.family = { ...mergedData.family, ...newData.family };
      }

      // Merge important dates (avoid duplicates)
      if (newData.important_dates) {
        mergedData.important_dates = mergedData.important_dates || [];
        newData.important_dates.forEach(date => {
          if (!mergedData.important_dates.includes(date)) {
            mergedData.important_dates.push(date);
          }
        });
      }

      // Merge emotional triggers (avoid duplicates)
      if (newData.emotional_triggers) {
        mergedData.emotional_triggers = mergedData.emotional_triggers || [];
        newData.emotional_triggers.forEach(trigger => {
          if (!mergedData.emotional_triggers.includes(trigger)) {
            mergedData.emotional_triggers.push(trigger);
          }
        });
      }

      // Update relationship status (keep most recent)
      if (newData.relationship_status) {
        mergedData.relationship_status = newData.relationship_status;
        mergedData.relationship_status_updated = new Date().toISOString();
      }

      // Update love language (keep most recent)
      if (newData.love_language) {
        mergedData.love_language = newData.love_language;
        mergedData.love_language_updated = new Date().toISOString();
      }

      // Update profile with merged personal data
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          personal_data: mergedData,
          personal_data_updated: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Failed to update personal data:', updateError);
        return false;
      }

      console.log('🧠 Personal data profile updated successfully');
      return true;
    } catch (error) {
      console.error('Exception updating personal data:', error);
      return false;
    }
  }

  // Create a new conversation for persistent memory
  async createConversation(userId, title = 'New Chat') {
    try {
      // Use service role for conversation creation to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('conversations')
        .insert({
          user_id: userId,
          title: title,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create conversation:', error);
        return { success: false, error };
      }

      console.log('✅ New conversation created for persistent memory:', data.id);
      return { success: true, conversation: data };
    } catch (error) {
      console.error('❌ Conversation creation exception:', error);
      return { success: false, error };
    }
  }

  // Get conversation context for VoiceFlow (enhanced with personal data)
  getConversationContext(userId) {
    try {
      const stored = localStorage.getItem('clementine_user');
      if (!stored) return null;

      const userData = JSON.parse(stored);
      if (userData.id !== userId) return null;

      const recentMessages = [];
      
      // Extract recent messages from conversation history
      if (userData.conversationHistory && userData.conversationHistory.length > 0) {
        userData.conversationHistory.forEach(conversation => {
          if (conversation.messages) {
            const sortedMessages = conversation.messages
              .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
              .slice(0, 10); // Last 10 messages per conversation
            recentMessages.push(...sortedMessages);
          }
        });
      }

      // Sort all messages by timestamp and take the most recent 20
      const sortedRecentMessages = recentMessages
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 20);

      // Build comprehensive context for persistent memory
      const context = {
        userId: userData.id,
        userName: userData.first_name || userData.email.split('@')[0],
        email: userData.email,
        hasHistory: sortedRecentMessages.length > 0,
        recentMessages: sortedRecentMessages,
        conversationCount: userData.conversationHistory.length,
        lastSessionDate: userData.last_session_date,
        
        // Enhanced personal data for persistent memory
        personalData: userData.personal_data || {},
        
        // Generate memory summary for VoiceFlow
        memorySummary: this.generateMemorySummary(userData)
      };

      return context;
    } catch (error) {
      console.error('❌ Error getting conversation context:', error);
      return null;
    }
  }

  // Generate a memory summary for VoiceFlow context
  generateMemorySummary(userData) {
    const summary = [];
    const personalData = userData.personal_data || {};
    
    // Add attachment style
    if (personalData.attachment_style) {
      summary.push(`Attachment style: ${personalData.attachment_style}`);
    }
    
    // Add relationship status
    if (personalData.relationship_status) {
      summary.push(`Relationship status: ${personalData.relationship_status}`);
    }
    
    // Add love language
    if (personalData.love_language) {
      summary.push(`Love language: ${personalData.love_language}`);
    }
    
    // Add family information
    if (personalData.family) {
      const familyMembers = Object.keys(personalData.family)
        .filter(key => !key.endsWith('_name') && personalData.family[key])
        .map(relation => {
          const name = personalData.family[`${relation}_name`];
          return name ? `${relation} (${name})` : relation;
        });
      
      if (familyMembers.length > 0) {
        summary.push(`Family: ${familyMembers.join(', ')}`);
      }
    }
    
    // Add important dates
    if (personalData.important_dates && personalData.important_dates.length > 0) {
      summary.push(`Important dates: ${personalData.important_dates.slice(0, 3).join(', ')}`);
    }
    
    // Add emotional triggers/themes
    if (personalData.emotional_triggers && personalData.emotional_triggers.length > 0) {
      summary.push(`Key emotional themes: ${personalData.emotional_triggers.slice(0, 3).join(', ')}`);
    }
    
    return summary.join(' | ');
  }

  // Check if user is already logged in (from localStorage)
  async checkExistingLogin() {
    try {
      const stored = localStorage.getItem('clementine_user');
      if (!stored) return false;

      const userData = JSON.parse(stored);
      
      // Check if login is still valid (within 30 days)
      const loginTime = new Date(userData.loginTime);
      const now = new Date();
      const daysDiff = (now - loginTime) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 30) {
        localStorage.removeItem('clementine_user');
        return false;
      }

      // Verify user still exists in database
      if (supabase) {
        const { data: user, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .single();

        if (error || !user) {
          localStorage.removeItem('clementine_user');
          return false;
        }

        this.currentUser = user;
        this.sessionId = user.session_id;
      } else {
        // Fallback to localStorage data if Supabase unavailable
        this.currentUser = userData;
        this.sessionId = userData.session_id;
      }

      this.isAuthenticated = true;
      // console.log('🔄 Restored login session:', this.currentUser.first_name || this.currentUser.email);
      return {
        success: true,
        user: this.currentUser,
        sessionId: this.sessionId
      };

    } catch (error) {
      console.error('❌ Error checking existing login:', error);
      localStorage.removeItem('clementine_user');
      return false;
    }
  }

  // Logout
  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.sessionId = null;
    localStorage.removeItem('clementine_user');
    console.log('🚪 User logged out');
  }

  // Get current user session ID for VoiceFlow
  getVoiceFlowUserId() {
    return this.sessionId || 'anonymous_user';
  }

  // Get user display name
  getUserDisplayName() {
    if (!this.currentUser) return 'Guest';
    return this.currentUser.first_name || this.currentUser.email || 'User';
  }

  // Update user profile data (for memory persistence)
  async updateUserProfile(updates) {
    if (!this.isAuthenticated || !supabase) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', this.currentUser.id)
        .select()
        .single();

      if (error) throw error;

      this.currentUser = { ...this.currentUser, ...data };
      
      // Update localStorage
      const stored = JSON.parse(localStorage.getItem('clementine_user') || '{}');
      localStorage.setItem('clementine_user', JSON.stringify({
        ...stored,
        ...data
      }));

      return true;
    } catch (error) {
      console.error('❌ Error updating user profile:', error);
      return false;
    }
  }
}

// Create singleton instance
export const authService = new AuthService();
export default authService;