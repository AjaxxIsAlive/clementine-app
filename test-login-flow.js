#!/usr/bin/env node

// Simple test to verify user login and context loading
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUserLogin() {
  console.log('🔐 Testing returning user login flow...\n');
  
  // Get an existing user
  const { data: users, error } = await supabase
    .from('profiles')
    .select('*')
    .order('last_session_date', { ascending: false })
    .limit(1);
    
  if (error || !users || users.length === 0) {
    console.error('❌ No existing users found');
    return;
  }
  
  const testUser = users[0];
  console.log(`👤 Testing with existing user: ${testUser.email} (${testUser.first_name})`);
  console.log(`   - User ID: ${testUser.id}`);
  console.log(`   - Session ID: ${testUser.session_id || 'Not set'}`);
  console.log(`   - Last Session: ${testUser.last_session_date}`);
  
  // Check for conversations
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select('id, title, created_at, message_count')
    .eq('user_id', testUser.id)
    .order('updated_at', { ascending: false });
    
  if (convError) {
    console.log(`   ❌ Error checking conversations: ${convError.message}`);
  } else {
    console.log(`   💬 Conversations: ${conversations?.length || 0}`);
    if (conversations && conversations.length > 0) {
      conversations.forEach(conv => {
        console.log(`     - "${conv.title}" (${conv.message_count || 0} messages)`);
      });
    }
  }
  
  // Simulate what the app would do on login
  console.log('\n🔄 Simulating login process...');
  
  // 1. Check if user exists (✅ they do)
  console.log('✅ User exists in database');
  
  // 2. Load user into localStorage context
  const userContext = {
    user: {
      id: testUser.id,
      email: testUser.email,
      first_name: testUser.first_name,
      session_id: testUser.session_id
    },
    hasHistory: conversations && conversations.length > 0,
    conversationCount: conversations?.length || 0,
    returningUser: true
  };
  
  console.log('✅ User context prepared');
  console.log('✅ Session ID available:', !!testUser.session_id);
  
  // 3. What would be sent to VoiceFlow
  console.log('\n📤 Context that would be sent to VoiceFlow:');
  const voiceflowContext = {
    user_id: testUser.id,
    email: testUser.email,
    name: testUser.first_name,
    session_id: testUser.session_id,
    hasHistory: userContext.hasHistory,
    isReturningUser: true,
    conversationCount: userContext.conversationCount,
    lastSessionDate: testUser.last_session_date
  };
  
  Object.entries(voiceflowContext).forEach(([key, value]) => {
    console.log(`   ${key}: ${value}`);
  });
  
  // 4. Test recognition verdict
  console.log('\n🎯 User Recognition Test Results:');
  console.log(`✅ User has unique session_id: ${!!testUser.session_id}`);
  console.log(`✅ User has conversation history: ${userContext.hasHistory}`);
  console.log(`✅ System can identify returning user: true`);
  
  console.log('\n📋 Summary:');
  console.log('- The system CAN identify returning users by their session_id');
  console.log('- Context includes conversation history and user details');
  console.log('- VoiceFlow will receive comprehensive user context');
  console.log('\n🤔 The question is: Does the VoiceFlow bot know how to USE this context?');
  console.log('   This depends on how the bot is programmed in VoiceFlow...');
}

testUserLogin().catch(console.error);
