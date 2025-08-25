#!/usr/bin/env node

// Test script to check user recognition and context loading
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserRecognition() {
  console.log('🔍 Testing user recognition system...\n');
  
  // Get existing users
  const { data: existingUsers, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, session_id, last_session_date')
    .order('last_session_date', { ascending: false })
    .limit(3);
    
  if (error) {
    console.error('❌ Error fetching users:', error);
    return;
  }
  
  console.log('👥 Found existing users:');
  existingUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} (${user.first_name})`);
    console.log(`   - Session ID: ${user.session_id ? 'Yes' : 'No'}`);
    console.log(`   - Last Session: ${user.last_session_date}`);
    console.log('');
  });
  
  // Check conversations for users
  for (const user of existingUsers) {
    console.log(`🗨️ Checking conversations for ${user.email}:`);
    
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        title,
        created_at,
        updated_at,
        last_message,
        messages (
          id,
          content,
          role,
          personal_data,
          timestamp
        )
      `)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(2);
      
    if (convError) {
      console.log(`   ❌ Error: ${convError.message}`);
    } else if (conversations && conversations.length > 0) {
      console.log(`   ✅ Found ${conversations.length} conversations`);
      conversations.forEach(conv => {
        console.log(`   - ${conv.title}: ${conv.messages?.length || 0} messages`);
        if (conv.last_message) {
          console.log(`     Last: "${conv.last_message}"`);
        }
        
        // Check for extracted personal data in messages
        const personalDataMessages = conv.messages?.filter(m => m.personal_data) || [];
        if (personalDataMessages.length > 0) {
          console.log(`     📊 ${personalDataMessages.length} messages with personal data extracted`);
        }
      });
    } else {
      console.log(`   📭 No conversations found`);
    }
    console.log('');
  }
  
  // Test what context would be generated for a returning user
  if (existingUsers.length > 0) {
    const testUser = existingUsers[0];
    console.log(`🧠 Testing context generation for returning user: ${testUser.email}`);
    
    // Simulate what would be in localStorage
    const mockUserData = {
      id: testUser.id,
      email: testUser.email,
      first_name: testUser.first_name,
      session_id: testUser.session_id,
      personal_data: { // Mock personal data for demo
        attachmentStyle: 'secure',
        relationshipStatus: 'single',
        familyInfo: ['close with sister', 'parents supportive'],
        importantDates: ['birthday: March 15'],
        emotionalTriggers: ['stress about work']
      },
      last_session_date: testUser.last_session_date,
      conversationHistory: [] // Would be populated from conversations
    };
    
    console.log('📋 Context that would be sent to VoiceFlow:');
    console.log(`   - User ID: ${mockUserData.id}`);
    console.log(`   - Name: ${mockUserData.first_name}`);
    console.log(`   - Email: ${mockUserData.email}`);
    console.log(`   - Has Personal Data: ${Object.keys(mockUserData.personal_data).length > 0 ? 'Yes' : 'No'}`);
    
    if (Object.keys(mockUserData.personal_data).length > 0) {
      console.log('   - Personal Data Available:');
      Object.entries(mockUserData.personal_data).forEach(([key, value]) => {
        console.log(`     * ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
      });
    }
  }
}

testUserRecognition().catch(console.error);
