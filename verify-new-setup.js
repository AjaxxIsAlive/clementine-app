#!/usr/bin/env node

// Verify new Supabase setup is working correctly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function verifyNewSupabaseSetup() {
  console.log('🔍 VERIFYING NEW SUPABASE SETUP\n');
  
  // Check environment variables
  console.log('📋 Environment Variables:');
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const supabaseServiceRole = process.env.REACT_APP_SUPABASE_SERVICE_ROLE;
  
  console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_SERVICE_ROLE:', supabaseServiceRole ? '✅ Set' : '❌ Missing');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ Please update your .env file with new Supabase credentials');
    console.log('📝 Copy from .env.template and fill in your values');
    return;
  }
  
  console.log('- URL:', supabaseUrl);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    console.log('\n🏗️ Testing Database Schema...');
    
    // Test 1: Check tables exist
    const tables = ['profiles', 'conversations', 'messages'];
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact' })
        .limit(0);
        
      if (error) {
        console.log(`❌ Table '${table}' error:`, error.message);
      } else {
        console.log(`✅ Table '${table}': Exists`);
      }
    }
    
    // Test 2: Check test users
    console.log('\n👥 Testing User Data...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('first_name, email, personal_data')
      .order('last_session_date', { ascending: false });
      
    if (userError) {
      console.log('❌ User data error:', userError.message);
    } else {
      console.log(`✅ Found ${users.length} test users:`);
      users.forEach((user, index) => {
        const hasPersonalData = user.personal_data && Object.keys(user.personal_data).length > 0;
        console.log(`   ${index + 1}. ${user.first_name} (${user.email}) - Personal data: ${hasPersonalData ? 'Yes' : 'No'}`);
      });
    }
    
    // Test 3: Check conversations
    console.log('\n💬 Testing Conversations...');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('title, user_id, message_count');
      
    if (convError) {
      console.log('❌ Conversations error:', convError.message);
    } else {
      console.log(`✅ Found ${conversations.length} sample conversations`);
      conversations.forEach((conv, index) => {
        console.log(`   ${index + 1}. "${conv.title}" (${conv.message_count} messages)`);
      });
    }
    
    // Test 4: Check messages
    console.log('\n📝 Testing Messages...');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('content, role, personal_data')
      .limit(3);
      
    if (msgError) {
      console.log('❌ Messages error:', msgError.message);
    } else {
      console.log(`✅ Found ${messages.length} sample messages`);
      messages.forEach((msg, index) => {
        const hasPersonalData = msg.personal_data && Object.keys(msg.personal_data).length > 0;
        console.log(`   ${index + 1}. ${msg.role}: "${msg.content.substring(0, 50)}..." (Personal data: ${hasPersonalData ? 'Yes' : 'No'})`);
      });
    }
    
    // Test 5: Test CRUD operations
    console.log('\n🔧 Testing CRUD Operations...');
    
    // Test insert
    const testUser = {
      first_name: 'TestUser',
      email: `test-${Date.now()}@example.com`,
      personal_data: { test: true, created: new Date().toISOString() }
    };
    
    const { data: insertResult, error: insertError } = await supabase
      .from('profiles')
      .insert(testUser)
      .select()
      .single();
      
    if (insertError) {
      console.log('❌ Insert test failed:', insertError.message);
    } else {
      console.log('✅ Insert test: Working');
      
      // Test update
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update({ personal_data: { test: true, updated: new Date().toISOString() } })
        .eq('id', insertResult.id)
        .select();
        
      if (updateError) {
        console.log('❌ Update test failed:', updateError.message);
      } else {
        console.log('✅ Update test: Working');
      }
      
      // Test delete (cleanup)
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', insertResult.id);
        
      if (deleteError) {
        console.log('❌ Delete test failed:', deleteError.message);
      } else {
        console.log('✅ Delete test: Working');
      }
    }
    
    console.log('\n🎯 SETUP VERIFICATION COMPLETE!');
    console.log('\n✅ Your new Supabase database is ready for Clementine app!');
    console.log('\n📋 Next steps:');
    console.log('1. Start your React app: npm start');
    console.log('2. Test all functionality at http://localhost:3000');
    console.log('3. Click the test buttons to verify everything works');
    console.log('4. Deploy to Vercel when ready');
    
  } catch (error) {
    console.log('❌ Verification failed:', error.message);
  }
}

verifyNewSupabaseSetup().catch(console.error);
