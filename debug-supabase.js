const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugSupabase() {
  console.log('🔍 Debugging Supabase queries...');
  
  try {
    // Test 1: Check what tables exist
    console.log('\n1️⃣ Testing user_memory table access...');
    const { data: memoryData, error: memoryError } = await supabase
      .from('user_memory')
      .select('*')
      .limit(3);
    
    console.log('user_memory result:', { 
      data: memoryData, 
      error: memoryError,
      status: memoryError?.code || 'success'
    });

    // Test 2: Check user_profiles table
    console.log('\n2️⃣ Testing user_profiles table access...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(3);
    
    console.log('user_profiles result:', { 
      data: profileData, 
      error: profileError,
      status: profileError?.code || 'success'
    });

    // Test 3: Check the specific query that's failing
    console.log('\n3️⃣ Testing specific user query...');
    const testUserId = 'clementine_anthonypaulsmail_gmail_com_1753922654482';
    const { data: specificData, error: specificError } = await supabase
      .from('user_memory')
      .select('*')
      .eq('user_id', testUserId);
    
    console.log('Specific user query result:', { 
      data: specificData, 
      error: specificError,
      status: specificError?.code || 'success'
    });

    // Test 4: Try to create a user profile
    console.log('\n4️⃣ Testing profile creation...');
    const newUserId = 'debug_user_' + Date.now();
    const { data: createProfile, error: createError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: newUserId,
        email: 'debug@test.com',
        name: 'Debug User'
      })
      .select();
    
    console.log('Profile creation result:', { 
      data: createProfile, 
      error: createError,
      status: createError?.code || 'success'
    });

    if (createProfile) {
      // Clean up
      await supabase.from('user_profiles').delete().eq('user_id', newUserId);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugSupabase().then(() => process.exit(0));
