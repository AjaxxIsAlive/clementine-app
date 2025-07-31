// Supabase Database Verification Script
// Run this with: node verify-supabase-setup.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please check your .env file for:');
  console.log('- REACT_APP_SUPABASE_URL');
  console.log('- REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySupabaseSetup() {
  console.log('🔍 Verifying Supabase database setup...\n');

  try {
    // 1. Check connection
    console.log('1. Testing Supabase connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('user_profiles')
      .select('count', { head: true });
    
    if (healthError) {
      console.error('❌ Connection failed:', healthError.message);
      return false;
    }
    console.log('✅ Connection successful\n');

    // 2. Check table structure
    console.log('2. Verifying table structure...');
    
    // Check user_profiles table
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.error('❌ user_profiles table error:', profilesError.message);
      console.log('📋 Please run the setup-complete-database.sql script in your Supabase SQL editor');
      return false;
    }
    console.log('✅ user_profiles table exists');

    // Check user_memory table
    const { data: memory, error: memoryError } = await supabase
      .from('user_memory')
      .select('*')
      .limit(1);
    
    if (memoryError) {
      console.error('❌ user_memory table error:', memoryError.message);
      console.log('📋 Please run the setup-complete-database.sql script in your Supabase SQL editor');
      return false;
    }
    console.log('✅ user_memory table exists\n');

    // 3. Test operations
    console.log('3. Testing basic operations...');
    
    const testUserID = 'test_user_' + Date.now();
    const testEmail = 'test@example.com';
    const testName = 'Test User';

    // Test profile creation
    const { data: testProfile, error: testProfileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: testUserID,
        email: testEmail,
        name: testName
      })
      .select()
      .maybeSingle();

    if (testProfileError) {
      console.error('❌ Profile creation test failed:', testProfileError.message);
      return false;
    }
    console.log('✅ Profile creation works');

    // Test memory creation
    const { data: testMemory, error: testMemoryError } = await supabase
      .from('user_memory')
      .insert({
        user_id: testUserID,
        user_name: testName,
        session_count: 1
      })
      .select()
      .maybeSingle();

    if (testMemoryError) {
      console.error('❌ Memory creation test failed:', testMemoryError.message);
      return false;
    }
    console.log('✅ Memory creation works');

    // Test memory update
    const { data: updatedMemory, error: updateError } = await supabase
      .from('user_memory')
      .update({ session_count: 2 })
      .eq('user_id', testUserID)
      .select()
      .maybeSingle();

    if (updateError) {
      console.error('❌ Memory update test failed:', updateError.message);
      return false;
    }
    console.log('✅ Memory update works');

    // Clean up test data
    await supabase.from('user_memory').delete().eq('user_id', testUserID);
    await supabase.from('user_profiles').delete().eq('user_id', testUserID);
    console.log('✅ Test data cleaned up\n');

    // 4. Show existing data
    console.log('4. Current database contents:');
    const { data: allProfiles } = await supabase
      .from('user_profiles')
      .select(`
        user_id,
        email,
        name,
        created_at,
        user_memory (
          session_count,
          user_name,
          user_age,
          user_occupation,
          relationship_status,
          last_active_date
        )
      `)
      .order('created_at', { ascending: false });

    if (allProfiles && allProfiles.length > 0) {
      console.log(`📊 Found ${allProfiles.length} user profiles:`);
      allProfiles.forEach((profile, i) => {
        console.log(`  ${i + 1}. ${profile.name} (${profile.email})`);
        console.log(`     ID: ${profile.user_id.substring(0, 30)}...`);
        if (profile.user_memory && profile.user_memory.length > 0) {
          const memory = profile.user_memory[0];
          console.log(`     Sessions: ${memory.session_count}, Age: ${memory.user_age || 'N/A'}, Status: ${memory.relationship_status || 'N/A'}`);
        }
        console.log('');
      });
    } else {
      console.log('📊 No user profiles found');
    }

    console.log('🎉 Supabase setup verification completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Your database is working correctly');
    console.log('2. The app should now be able to store and retrieve memory');
    console.log('3. Test the app by logging in and having a conversation');
    console.log('4. Check that session counts increment and memory persists');
    
    return true;

  } catch (error) {
    console.error('❌ Verification failed:', error);
    return false;
  }
}

// Run verification
verifySupabaseSetup()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Script error:', error);
    process.exit(1);
  });