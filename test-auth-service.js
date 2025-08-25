#!/usr/bin/env node

// Test the specific auth service functions
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function testAuthService() {
  console.log('🧪 TESTING AUTH SERVICE FUNCTIONS\n');
  
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test 1: User login simulation
    console.log('🔐 TEST 1: User Login Simulation');
    const testEmail = 'bob@test.com';
    
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', testEmail);
      
    if (error) {
      console.log('❌ Login test failed:', error.message);
    } else if (users && users.length > 0) {
      const user = users[0];
      console.log('✅ User found:', user.email);
      console.log('   - Name:', user.first_name);
      console.log('   - Session ID:', user.session_id || 'None');
      console.log('   - Personal Data keys:', Object.keys(user.personal_data || {}));
    } else {
      console.log('❌ No user found with email:', testEmail);
    }
    
    // Test 2: Personal data update
    console.log('\n💾 TEST 2: Personal Data Update');
    if (users && users.length > 0) {
      const testPersonalData = {
        testRun: new Date().toISOString(),
        attachmentStyle: ['secure'],
        testData: true
      };
      
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ personal_data: testPersonalData })
        .eq('id', users[0].id)
        .select();
        
      if (updateError) {
        console.log('❌ Personal data update failed:', updateError.message);
        console.log('   Code:', updateError.code);
        
        if (updateError.code === 'PGRST301') {
          console.log('\n🔧 RLS POLICY ISSUE DETECTED!');
          console.log('   The personal_data update is blocked by Row Level Security');
          console.log('   Need to add RLS policies or temporarily disable RLS');
        }
      } else {
        console.log('✅ Personal data update: Working');
        console.log('   Updated user:', updateResult[0]?.email);
      }
    }
    
    // Test 3: Conversation creation
    console.log('\n💬 TEST 3: Conversation Creation');
    if (users && users.length > 0) {
      const testConversation = {
        user_id: users[0].id,
        title: 'Test Conversation',
        conversation_summary: 'Test summary',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data: convResult, error: convError } = await supabase
        .from('conversations')
        .insert(testConversation)
        .select();
        
      if (convError) {
        console.log('❌ Conversation creation failed:', convError.message);
        console.log('   Code:', convError.code);
        
        if (convError.code === 'PGRST301') {
          console.log('\n🔧 RLS POLICY ISSUE DETECTED!');
          console.log('   Conversation creation blocked by Row Level Security');
        }
      } else {
        console.log('✅ Conversation creation: Working');
        console.log('   Created conversation ID:', convResult[0]?.id);
        
        // Clean up test conversation
        await supabase
          .from('conversations')
          .delete()
          .eq('id', convResult[0]?.id);
        console.log('   (Test conversation cleaned up)');
      }
    }
    
    // Test 4: Message creation
    console.log('\n📝 TEST 4: Message Creation Check');
    
    // First get an existing conversation or create one temporarily
    const { data: existingConv, error: convFetchError } = await supabase
      .from('conversations')
      .select('id')
      .limit(1);
      
    if (convFetchError) {
      console.log('❌ Cannot fetch conversations:', convFetchError.message);
    } else if (existingConv && existingConv.length > 0) {
      const testMessage = {
        conversation_id: existingConv[0].id,
        content: 'Test message',
        role: 'user',
        personal_data: { test: true },
        timestamp: new Date().toISOString()
      };
      
      const { data: msgResult, error: msgError } = await supabase
        .from('messages')
        .insert(testMessage)
        .select();
        
      if (msgError) {
        console.log('❌ Message creation failed:', msgError.message);
        console.log('   Code:', msgError.code);
      } else {
        console.log('✅ Message creation: Working');
        
        // Clean up test message
        await supabase
          .from('messages')
          .delete()
          .eq('id', msgResult[0]?.id);
        console.log('   (Test message cleaned up)');
      }
    } else {
      console.log('⚠️ No conversations found for message test');
    }
    
    console.log('\n🎯 AUTH SERVICE TEST COMPLETE');
    
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
}

testAuthService().catch(console.error);
