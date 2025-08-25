#!/usr/bin/env node

// Supabase Issues Diagnostic Tool
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function diagnoseSupabaseIssues() {
  console.log('🔍 DIAGNOSING SUPABASE ISSUES\n');
  
  // Check environment variables
  console.log('📋 Environment Variables Check:');
  const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
  const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
  const supabaseServiceRole = process.env.REACT_APP_SUPABASE_SERVICE_ROLE;
  
  console.log('- SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('- SUPABASE_SERVICE_ROLE:', supabaseServiceRole ? '✅ Set' : '❌ Missing');
  
  if (supabaseUrl) {
    console.log('- URL Value:', supabaseUrl);
  }
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ Critical environment variables missing!');
    console.log('📝 Please check your .env file contains:');
    console.log('   REACT_APP_SUPABASE_URL=https://your-project.supabase.co');
    console.log('   REACT_APP_SUPABASE_ANON_KEY=your-anon-key');
    console.log('   REACT_APP_SUPABASE_SERVICE_ROLE=your-service-role-key');
    return;
  }
  
  // Test connection
  console.log('\n🔗 Testing Supabase Connection...');
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test basic connection
    console.log('🏓 Ping test...');
    const { data: ping, error: pingError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact' })
      .limit(0);
      
    if (pingError) {
      console.log('❌ Basic connection failed:', pingError.message);
      console.log('   Error code:', pingError.code);
      console.log('   Details:', pingError.details);
      
      // Common error solutions
      if (pingError.code === 'PGRST301') {
        console.log('\n🔧 SOLUTION: This is a Row Level Security (RLS) issue');
        console.log('   - Your table has RLS enabled but no policies');
        console.log('   - Need to add RLS policies or disable RLS temporarily');
      }
      
      if (pingError.message.includes('JWT')) {
        console.log('\n🔧 SOLUTION: Authentication token issue');
        console.log('   - Check if your SUPABASE_ANON_KEY is correct');
        console.log('   - Verify the key matches your Supabase project');
      }
      
      if (pingError.message.includes('relation') && pingError.message.includes('does not exist')) {
        console.log('\n🔧 SOLUTION: Table does not exist');
        console.log('   - The profiles table has not been created');
        console.log('   - Run the database setup SQL in Supabase SQL Editor');
      }
      
      return;
    } else {
      console.log('✅ Basic connection: Working');
    }
    
    // Test table access
    console.log('\n📊 Testing Table Access...');
    
    // Test profiles table schema
    const { data: profileSchema, error: schemaError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
      
    if (schemaError) {
      console.log('❌ Profiles table access error:', schemaError.message);
      console.log('   Code:', schemaError.code);
      
      if (schemaError.code === 'PGRST116') {
        console.log('\n🔧 SOLUTION: Table not found');
        console.log('   - Run the database setup SQL in Supabase');
        console.log('   - Check table name spelling');
      }
    } else {
      console.log('✅ Profiles table: Accessible');
      if (profileSchema && profileSchema.length > 0) {
        console.log('   Available columns:', Object.keys(profileSchema[0]));
      }
    }
    
    // Test conversations table
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .limit(1);
      
    if (convError) {
      console.log('❌ Conversations table error:', convError.message);
    } else {
      console.log('✅ Conversations table: Accessible');
    }
    
    // Test messages table
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .limit(1);
      
    if (msgError) {
      console.log('❌ Messages table error:', msgError.message);
    } else {
      console.log('✅ Messages table: Accessible');
    }
    
    // Test user data
    console.log('\n👥 Testing User Data...');
    const { data: users, error: userError } = await supabase
      .from('profiles')
      .select('id, email, first_name, personal_data')
      .limit(5);
      
    if (userError) {
      console.log('❌ User data query failed:', userError.message);
      console.log('   Code:', userError.code);
    } else {
      console.log('✅ User data query: Working');
      console.log('   Found users:', users?.length || 0);
      
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.first_name})`);
          console.log(`      - Has personal_data: ${user.personal_data ? 'Yes' : 'No'}`);
        });
      } else {
        console.log('   ⚠️ No users found. You may need to create test users.');
      }
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE');
    
  } catch (error) {
    console.log('❌ Unexpected error during diagnosis:', error.message);
    console.log('   Stack:', error.stack);
  }
}

// Run diagnosis
diagnoseSupabaseIssues().catch(console.error);
